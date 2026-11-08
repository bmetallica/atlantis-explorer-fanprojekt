#!/usr/bin/env python3
"""Stadt-Außenhülle in voller Originalauflösung, aufgeteilt in Kacheln (statt global vereinfacht).

Hintergrund: Die STL-Vorlage (material/xxx_-_atlantis.stl, ~1,38 Mio. Dreiecke, 271 offene Teilkörper) wurde
früher als Ganzes auf 300k/130k Dreiecke reduziert – dabei kollabierten schlanke Türme und dünne Decks
(„Sanduhr“-Formen, Löcher). Jetzt:
- Gleiche Transformation wie stadt_stl.py (Drehung, Skala, Deckhöhe) → Stadtplan/Räume passen weiter.
- Flächen werden nach ihrem Schwerpunkt einem Raster aus Kacheln (KACHEL m) zugeordnet; Ecken werden nicht verschoben,
  daher keine Risse zwischen Kacheln.
- Je Kachel: volle Geometrie (Stufe „voll“) und eine schonend vereinfachte Fernstufe (FERN_ANTEIL der Dreiecke).
- Export: atlantis_voll.glb und atlantis_fern.glb (je ein Mesh pro Kachel, Name K<ix>_<iz>), meta.json["kacheln"].
Aufruf:  build/tools/pyenv/bin/python build/tools/stadt_kacheln.py
"""
import json, math, os
import numpy as np
import trimesh
import fast_simplification

SRC = "/root/sga/material/xxx_-_atlantis.stl"
OUT = "/root/sga/data/stadt/aussen"
META = f"{OUT}/meta.json"
KACHEL = 160.0           # m Kantenlänge
FERN_ANTEIL = 0.4        # Fernstufe: 40 % der Dreiecke je Kachel

FARBEN = {
    "deck": (112, 114, 116), "deck_hell": (150, 152, 150), "fassade": (205, 212, 220),
    "fassade_hoch": (226, 231, 236), "rumpf": (44, 58, 74),
}

meta = json.load(open(META))
s, DECK_MODELL, DECK_Y = meta["skala"], meta["deck_modell"], meta["deck_y"]
th = math.radians(meta["drehung_grad"])

src = trimesh.load(SRC, force="mesh")
src.merge_vertices()
x, y, z = src.vertices[:, 0], src.vertices[:, 1], src.vertices[:, 2]
xr = x * math.cos(th) + y * math.sin(th)
yr = -x * math.sin(th) + y * math.cos(th)
W = np.stack([xr * s, (z - DECK_MODELL) * s + DECK_Y, -yr * s], axis=1).astype(np.float32)
gesamt = trimesh.Trimesh(W, src.faces, process=False)


def faerben(m):
    n, c = m.face_normals, m.triangles_center
    col = np.zeros((len(m.faces), 3))
    up, down = n[:, 1] > 0.75, n[:, 1] < -0.5
    vert = ~up & ~down
    col[up] = FARBEN["deck"]
    col[up & (c[:, 1] > DECK_Y + 12)] = FARBEN["deck_hell"]
    col[down] = FARBEN["rumpf"]
    hoch = np.clip((c[:, 1] - DECK_Y) / 300, 0, 1)[:, None]
    col[vert] = np.array(FARBEN["fassade"]) * (1 - hoch[vert]) + np.array(FARBEN["fassade_hoch"]) * hoch[vert]
    col[vert & (c[:, 1] < DECK_Y - 2)] = FARBEN["rumpf"]
    rgba = np.concatenate([col, np.full((len(col), 1), 255)], axis=1).astype(np.uint8)
    m.visual = trimesh.visual.ColorVisuals(m, vertex_colors=trimesh.visual.color.face_to_vertex_color(m, rgba))
    return m


# Hülle innerhalb von Räumen/Gängen entfernen (data/stadt/aussen/raumquader.json, aus dem Spiel erfasst):
# ein Dreieck fällt weg, wenn alle drei Ecken im (leicht vergrößerten) Raumquader liegen. Offene Räume
# (Balkon ATL-048, Plaza ATL-042) nur oberhalb ihres Bodens – das Deck darunter bleibt.
QUADER = f"{OUT}/raumquader.json"
OFFEN = {"ATL-042", "ATL-048"}
def zuschneiden(m, q):
    """Teil der Hülle im Raumquader q entfernen; Dreiecke an den Quaderwänden werden zerteilt."""
    mn, mx = np.array(q["min"]) - 0.05, np.array(q["max"]) + 0.05
    if q["id"] in OFFEN:
        mn[1] = 0.1
    c, s_ = math.cos(q["rotY"]), math.sin(q["rotY"])
    # Welt → lokal (inverse Drehung um Y, dann Verschiebung) als 4×4-Matrix, damit trimesh zerteilen kann
    R = np.array([[c, 0, -s_, 0], [0, 1, 0, 0], [s_, 0, c, 0], [0, 0, 0, 1]])
    T = np.eye(4); T[:3, 3] = -np.array(q["pos"])
    zuLokal = R @ T
    V = trimesh.transform_points(m.vertices, zuLokal)
    tri = V[m.faces]
    beruehrt = np.all(tri.max(axis=1) > mn, axis=1) & np.all(tri.min(axis=1) < mx, axis=1)
    if not beruehrt.any():
        return m, 0
    rest = m.submesh([np.nonzero(~beruehrt)[0]], append=True, repair=False)
    teil = trimesh.Trimesh(V[m.faces[beruehrt]].reshape(-1, 3), np.arange(beruehrt.sum() * 3).reshape(-1, 3), process=False)
    stuecke = [teil]
    for achse in range(3):
        for wert, richtung in ((mn[achse], 1), (mx[achse], -1)):
            n = np.zeros(3); n[achse] = 1.0
            neu = []
            for st in stuecke:
                for vz in (1, -1):
                    try:
                        hälfte = trimesh.intersections.slice_mesh_plane(st, n * vz, n * wert, cap=False)
                    except Exception:
                        hälfte = None
                    if hälfte is not None and len(hälfte.faces):
                        neu.append(hälfte)
            stuecke = neu
    teil = trimesh.util.concatenate(stuecke) if stuecke else None
    if teil is None or not len(teil.faces):
        return rest, int(beruehrt.sum())
    cm = teil.triangles_center
    innen = np.all((cm > mn) & (cm < mx), axis=1)
    behalten = teil.submesh([np.nonzero(~innen)[0]], append=True, repair=False) if (~innen).any() else None
    if behalten is not None:
        behalten.apply_transform(np.linalg.inv(zuLokal))
        rest = trimesh.util.concatenate([rest, behalten])
    return rest, int(innen.sum())


if os.path.exists(QUADER):
    entfernt = 0
    for q in json.load(open(QUADER)):
        gesamt, n = zuschneiden(gesamt, q)
        entfernt += n
    print("in Räumen entfernt:", entfernt, "Dreieckstücke; Hülle jetzt", len(gesamt.faces), "Dreiecke")

mitte = gesamt.triangles_center
ix = np.floor(mitte[:, 0] / KACHEL).astype(int)
iz = np.floor(mitte[:, 2] / KACHEL).astype(int)
voll, fern, kacheln = trimesh.Scene(), trimesh.Scene(), []
for kx, kz in sorted(set(zip(ix.tolist(), iz.tolist()))):
    sel = np.nonzero((ix == kx) & (iz == kz))[0]
    teil = gesamt.submesh([sel], append=True, repair=False)
    name = f"K{kx}_{kz}"
    voll.add_geometry(faerben(teil.copy()), node_name=name, geom_name=name)
    ziel = max(0.0, 1 - FERN_ANTEIL) if len(sel) > 400 else 0.0
    v, f = fast_simplification.simplify(teil.vertices.astype(np.float32), teil.faces, target_reduction=ziel)
    fm = faerben(trimesh.Trimesh(v, f, process=False))
    fern.add_geometry(fm, node_name=name, geom_name=name)
    b = teil.bounds
    kacheln.append({"name": name, "voll": int(len(sel)), "fern": int(len(fm.faces)),
                    "mitte": ((b[0] + b[1]) / 2).round(1).tolist(), "radius": round(float(np.linalg.norm(b[1] - b[0]) / 2), 1)})
    print(name, len(sel), "→", len(fm.faces))

for datei, szene in (("atlantis_voll.glb", voll), ("atlantis_fern.glb", fern)):
    open(f"{OUT}/{datei}", "wb").write(trimesh.exchange.gltf.export_glb(szene, include_normals=False))
    print(datei, round(os.path.getsize(f"{OUT}/{datei}") / 1e6, 1), "MB")

meta["kacheln"] = {"voll": "atlantis_voll.glb", "fern": "atlantis_fern.glb", "kante": KACHEL, "liste": kacheln,
                   "dreiecke_voll": int(len(gesamt.faces)), "dreiecke_fern": int(sum(k["fern"] for k in kacheln))}
json.dump(meta, open(META, "w"), ensure_ascii=False, indent=1)
print(len(kacheln), "Kacheln")

#!/usr/bin/env python3
"""Bereitet die Stadt-Vorlage (STL aus material/) als Spiel-Außenhülle auf.

- Vereinfacht auf zwei Detailstufen (nah ~300k, fern ~60k Dreiecke)
- Dreht das Modell so, dass seine Piers zum Stadtplan passen (breite Piers bei 90°/210°/330°),
  skaliert auf 1,3 km Durchmesser und setzt das Deck auf DECK_Y (Stadtplan-Koordinaten: x Ost, y oben, z Süd)
- Färbt nach Flächenausrichtung (Deck, Fassade, Rumpfunterseite) als Vertex-Farben
- Exportiert GLB nach data/stadt/aussen/ + meta.json mit der Transformation
Aufruf:  build/tools/pyenv/bin/python build/tools/stadt_stl.py
"""
import json, math, os
import numpy as np
import trimesh
import fast_simplification

SRC = "/root/sga/material/xxx_-_atlantis.stl"
OUT = "/root/sga/data/stadt/aussen"
RADIUS_ZIEL = 650.0          # m (Durchmesser 1,3 km)
DECK_MODELL = 7.0            # Deckhöhe im Modell (Median der nach oben zeigenden Flächen)
DECK_Y = 6.0                 # Deckhöhe im Stadtplan
DREHUNG = 90.0               # Kompass-Grad im Uhrzeigersinn: breite Piers 0/126/240° → 90/216/330°
LODS = {"nah": 300000, "fern": 60000}

FARBEN = {                   # sRGB 0–255
    "deck": (112, 114, 116), "deck_hell": (150, 152, 150), "fassade": (205, 212, 220),
    "fassade_hoch": (226, 231, 236), "rumpf": (44, 58, 74),
}

os.makedirs(OUT, exist_ok=True)
src = trimesh.load(SRC, force="mesh")
src.merge_vertices()
r_max = np.hypot(src.vertices[:, 0], src.vertices[:, 1]).max()
s = RADIUS_ZIEL / r_max
th = math.radians(DREHUNG)
meta = {"quelle": os.path.basename(SRC), "skala": s, "drehung_grad": DREHUNG, "deck_modell": DECK_MODELL, "deck_y": DECK_Y,
        "hinweis": "Welt = (x', (z-deck)*s+deck_y, -y') mit x',y' = um 'drehung_grad' im Uhrzeigersinn gedrehte Modellkoordinaten × s", "lods": {}}

for name, ziel in LODS.items():
    v, f = fast_simplification.simplify(src.vertices.astype(np.float32), src.faces, target_reduction=max(0.0, 1 - ziel / len(src.faces)))
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    xr = x * math.cos(th) + y * math.sin(th)
    yr = -x * math.sin(th) + y * math.cos(th)
    W = np.stack([xr * s, (z - DECK_MODELL) * s + DECK_Y, -yr * s], axis=1)
    m = trimesh.Trimesh(W, f, process=False)
    # Farben je Fläche nach Ausrichtung, gemittelt auf die Ecken (geteilte Ecken halten die Datei klein;
    # harte Kanten entstehen im Spiel per flatShading)
    n = m.face_normals
    c = m.triangles_center
    col = np.zeros((len(m.faces), 3))
    up, down = n[:, 1] > 0.75, n[:, 1] < -0.5
    vert = ~up & ~down
    col[up] = FARBEN["deck"]
    col[up & (c[:, 1] > DECK_Y + 12)] = FARBEN["deck_hell"]           # Dächer heller als das Stadtdeck
    col[down] = FARBEN["rumpf"]
    hoch = np.clip((c[:, 1] - DECK_Y) / 300, 0, 1)[:, None]
    col[vert] = (np.array(FARBEN["fassade"]) * (1 - hoch[vert]) + np.array(FARBEN["fassade_hoch"]) * hoch[vert])
    col[vert & (c[:, 1] < DECK_Y - 2)] = FARBEN["rumpf"]               # Rumpfwände unter dem Deck dunkel
    rgba = np.concatenate([col, np.full((len(col), 1), 255)], axis=1).astype(np.uint8)
    m.visual = trimesh.visual.ColorVisuals(m, vertex_colors=trimesh.visual.color.face_to_vertex_color(m, rgba))
    datei = f"{OUT}/atlantis_{name}.glb"
    m.export(datei)
    b = m.bounds
    meta["lods"][name] = {"datei": os.path.basename(datei), "dreiecke": int(len(m.faces)), "bytes": os.path.getsize(datei),
                          "min": b[0].round(1).tolist(), "max": b[1].round(1).tolist()}
    print(name, len(m.faces), "Dreiecke", round(os.path.getsize(datei) / 1e6, 1), "MB", b.round(1).tolist())
json.dump(meta, open(f"{OUT}/meta.json", "w"), ensure_ascii=False, indent=1)

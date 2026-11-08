#!/usr/bin/env python3
"""Baut den Puddle Jumper (OBJ-009) aus der STL-Außenhülle (material/PuddleJprMag3.stl).

- Vereinfacht auf ~22k Dreiecke, skaliert auf 7,9 m Länge, Achsen auf Spielkonvention (Cockpit +Z, oben +Y)
- Teilt die Flächen auf: Rumpf, Cockpitglas (nach vorn-oben zeigende Frontflächen), Heckklappe (nach hinten
  zeigende Heckflächen), linke/rechte Antriebsgondel (seitlich außerhalb des Rumpfs), Triebwerksdüsen
  (Gondel-Heckflächen, leuchten)
- Schreibt die Geometrie als Base64 in build/auftraege/OBJ-009/jumper_geo.json; das JS-Modul
  (build/tools/jumper_vorlage.js) wird damit zu build/auftraege/OBJ-009/puddle_jumper.js zusammengesetzt.
Aufruf:  build/tools/pyenv/bin/python build/tools/jumper_stl.py
"""
import base64, json, os
import numpy as np
import trimesh
import fast_simplification

SRC = "/root/sga/material/PuddleJprMag3.stl"
OUT = "/root/sga/build/auftraege/OBJ-009"
VORLAGE = "/root/sga/build/tools/jumper_vorlage.js"
LAENGE = 7.9            # m
Y0 = 0.0                # Rumpfunterseite liegt flach auf dem Boden
RUMPF_HALB = 13.2       # |y| im Modell: bis hier Rumpf, außerhalb Gondeln

src = trimesh.load(SRC, force="mesh")
src.merge_vertices()
s = LAENGE / (src.bounds[1][0] - src.bounds[0][0])
cx = (src.bounds[0][0] + src.bounds[1][0]) / 2
WELD = 0.03                  # Modell-Einheiten (~4 mm): verschweißt Mikrodetails, ohne Löcher zu reißen


def weld(v, f, g):
    q = np.round(v / g)
    u, first, inv = np.unique(q, axis=0, return_index=True, return_inverse=True)
    F = inv.reshape(-1)[f]
    ok = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
    F = F[ok]
    _, keep = np.unique(np.sort(F, axis=1), axis=0, return_index=True)
    return v[first], F[np.sort(keep)]


def vereinfachen(v, f, budget):
    v, f = weld(v, f, WELD)
    if len(f) > budget:
        v, f = fast_simplification.simplify(v.astype(np.float32), f, target_reduction=1 - budget / len(f))
    return np.asarray(v, np.float32), np.asarray(f)


def spiel(v):
    # Modell: x Länge (Cockpit bei −x), y Breite, z Höhe (flache Unterseite z = 0) → Spiel: X = −y, Y = z + Y0, Z = −(x − cx)
    return np.stack([-v[:, 1] * s, v[:, 2] * s + Y0, -(v[:, 0] - cx) * s], axis=1).astype(np.float32)


# 1) Gesamtmodell geschlossen verschweißen und vereinfachen (kein Aufschneiden vorher → keine Splitter an Schnittkanten),
#    danach Rumpf und Gondeln nach Lage trennen
v, f = vereinfachen(src.vertices, src.faces, 16000)
Pg = spiel(v)
cg = Pg[f].mean(axis=1)
halb_m = 12.92 * s
# Dreiecke über der Naht (eine Ecke außerhalb des Rumpfs) gehören zur Gondel – sonst ragen sie als Splitter aus dem Rumpf
aussen = (np.abs(Pg[f][:, :, 0]) > halb_m + 0.04).any(axis=1)
links = cg[:, 0] > 0
stuecke = {"rumpf": (Pg, f[~aussen]), "gondel_l": (Pg, f[aussen & links]), "gondel_r": (Pg, f[aussen & ~links])}

teile = {}
# 1b) Gondelnischen schließen: offene Randkanten des Rumpfs neben den Gondeln suchen und mit einem Fächer füllen
#     (dort war die Gondel mit dem Rumpf verschmolzen; ohne Füllung sieht man eingefahren ins Innere)
def nischen_fuellen(P, f, seite):
    m = trimesh.Trimesh(P, f, process=False)
    kanten = m.edges_sorted
    u, cnt = np.unique(kanten, axis=0, return_counts=True)
    rand = u[cnt == 1]
    sel = rand[(seite * P[rand].mean(axis=1)[:, 0]) > halb_m - 0.35]
    if not len(sel):
        return P, np.zeros((0, 3), int)
    import networkx as nx
    G = nx.Graph(); G.add_edges_from(sel.tolist())
    neu_P, neu_f = [P], []
    off = len(P)
    for comp in nx.connected_components(G):
        ids = np.array(sorted(comp))
        if len(ids) < 4:
            continue
        # Die Nischen sind flach und senkrecht: ebenes Rechteck über die Ausdehnung der Randkante, bündig in der Rumpfseite
        lo, hi = P[ids].min(axis=0), P[ids].max(axis=0)
        x = seite * (halb_m - 0.01)
        q = np.array([[x, lo[1], lo[2]], [x, lo[1], hi[2]], [x, hi[1], hi[2]], [x, hi[1], lo[2]]], np.float32)
        neu_P.append(q)
        a, b, c_, d = off, off + 1, off + 2, off + 3
        quad = [[a, b, c_], [a, c_, d]] if seite < 0 else [[a, c_, b], [a, d, c_]]
        neu_f += quad
        off += 4
    return np.concatenate(neu_P).astype(np.float32), np.array(neu_f, int).reshape(-1, 3)

P, f = stuecke["rumpf"]
for name, seite in (("nische_l", 1), ("nische_r", -1)):
    P2, f2 = nischen_fuellen(P, f, seite)
    if len(f2):
        teile[name] = (P2, f2)
        print(name, len(f2), "Dreiecke")

# 2) Feinzuordnung auf den vereinfachten Flächen: Glas, Heckklappe, Düsen
def zerlegen(P, f, regeln, rest):
    m = trimesh.Trimesh(P, f, process=False); n, c = m.face_normals, m.triangles_center
    frei = np.ones(len(f), bool)
    for name, maske in regeln(n, c, P):
        sel = frei & maske; teile[name] = (P, f[sel]); frei &= ~sel
    teile[rest] = (P, f[frei])

P, f = stuecke["rumpf"]
halb = RUMPF_HALB * s
Ymax, Zmin, Zmax = P[:, 1].max(), P[:, 2].min(), P[:, 2].max()
zerlegen(P, f, lambda n, c, P: [
    ("glas", (c[:, 2] > Zmax - 3.2) & (n[:, 2] > 0.35) & (n[:, 1] > -0.2) & (c[:, 1] > Y0 + 0.75) & (c[:, 1] < Ymax - 0.12) & (np.abs(c[:, 0]) < halb - 0.22)),
    # Heckklappe = dicke Wand: Außenseite (nach hinten) + Innenseite zum Kabinen-Hohlraum (nach vorn) bewegen sich gemeinsam
    ("klappe", (np.abs(c[:, 0]) < halb - 0.2) & (c[:, 1] < Ymax - 0.18) & (c[:, 1] > Y0 + 0.05) & (
        ((c[:, 2] < Zmin + 1.6) & (n[:, 2] < -0.45)) | ((c[:, 2] < Zmin + 1.9) & (n[:, 2] > 0.45)))),
], "rumpf")
# Innenauskleidung des Hohlraums („Zylinder“) entfernen: Rumpfflächen im Kabinenbereich, die zur Längsachse zeigen.
# Der Rumpf wird beidseitig gezeichnet – innen sieht man die Außenhaut, dazu Glas und Bausatz-Einbauten.
P, f = teile["rumpf"]
mr = trimesh.Trimesh(P, f, process=False); n_, c_ = mr.face_normals, mr.triangles_center
achse_y = (Y0 + Ymax) / 2
radial = np.stack([c_[:, 0], c_[:, 1] - achse_y], 1)
radial /= np.linalg.norm(radial, axis=1, keepdims=True) + 1e-9
nach_innen = (n_[:, 0] * radial[:, 0] + n_[:, 1] * radial[:, 1]) < -0.3
kabine = (c_[:, 2] > Zmin + 1.0) & (c_[:, 2] < Zmax - 1.2)
# Stirnwände des Hohlraums (vorn hinter dem Glas): zeigen nach hinten, liegen weit innen
stirn = (n_[:, 2] < -0.6) & (c_[:, 2] > 0.5) & (np.abs(c_[:, 0]) < halb - 0.3) & (c_[:, 1] > Y0 + 0.15) & (c_[:, 1] < Ymax - 0.25)
weg = kabine & (nach_innen | stirn)
teile["rumpf"] = (P, f[~weg])
print("Innenauskleidung entfernt:", int(weg.sum()), "Dreiecke")
for g, d in (("gondel_l", "duese_l"), ("gondel_r", "duese_r")):
    P, f = stuecke[g]
    zerlegen(P, f, lambda n, c, P: [(d, n[:, 2] < -0.6)], g)

# 3) Innenleben aus dem Jumper-Bausatz (gleicher Maßstab): Bausatz x 45 (Pult) … 282 (Heck), y Höhe (Boden 8,4), z Breite ±57
K = (2 * halb - 0.1) / 114.0
KIT_Z0, KIT_BODEN = 2.95, Y0 + 0.17
INNEN = {"pult": 2200, "sideL": 1300, "sideR": 1300, "part8L": 500, "part8R": 500, "part33L": 700, "part33R": 700,
         "part6L": 250, "part6R": 250, "bottom2": 120}   # Triebwerke/Halter des Bausatzes = eingefahrene Gondeln → entfallen
for name, budget in INNEN.items():
    km = trimesh.load(f"/root/sga/material/Puddle_jumper_{name}.stl", force="mesh"); km.merge_vertices()
    v, f = weld(km.vertices, km.faces, 0.15)        # Bausatz-Einheiten (~4 mm im Spiel)
    if len(f) > budget:
        v, f = fast_simplification.simplify(np.asarray(v, np.float32), f, target_reduction=1 - budget / len(f))
    v = np.asarray(v)
    P = np.stack([v[:, 2] * K, (v[:, 1] - 8.4) * K + KIT_BODEN, KIT_Z0 - (v[:, 0] - 45) * K], axis=1).astype(np.float32)
    teile["innen_" + name] = (P, np.asarray(f))

geo = {"skala": s, "y0": Y0, "laenge": LAENGE, "halb": float(halb), "teile": {}}
for name, (P, ff) in teile.items():
    if not len(ff):
        continue
    used, inv = np.unique(ff, return_inverse=True)
    pos = P[used].astype(np.float32)
    idx = inv.reshape(-1, 3).astype(np.uint16 if len(used) < 65535 else np.uint32)
    b = (pos.min(0).round(3).tolist(), pos.max(0).round(3).tolist())
    geo["teile"][name] = {"pos": base64.b64encode(pos.tobytes()).decode(), "idx": base64.b64encode(idx.tobytes()).decode(),
                          "idx32": bool(idx.dtype == np.uint32), "dreiecke": int(len(ff)), "min": b[0], "max": b[1]}
    print(f"{name:20s} {len(ff):6d} Dreiecke  {b}")
print("Summe", sum(t["dreiecke"] for t in geo["teile"].values()))
os.makedirs(OUT, exist_ok=True)
json.dump(geo, open(f"{OUT}/jumper_geo.json", "w"))
js = open(VORLAGE).read().replace("/*__GEO__*/null", json.dumps(geo, separators=(",", ":")))
open(f"{OUT}/puddle_jumper.js", "w").write(js)
print("Modul:", f"{OUT}/puddle_jumper.js", round(len(js) / 1024), "KB")

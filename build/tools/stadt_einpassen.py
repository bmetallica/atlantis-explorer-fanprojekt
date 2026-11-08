#!/usr/bin/env python3
"""Passt die Trakte des Stadtplans in die Gebäude der Stadt-Vorlage ein (nach build/tools/stadtplan.py ausführen).

1. Belegungsgitter: senkrechte Strahlen im 3-m-Raster durch data/stadt/aussen/atlantis_nah.glb;
   innen = zwischen Ein- und Austritt (Parität der Treffer) → voxel[x, y, z] = in Gebäude/Rumpf.
2. Torhallen-Komplex (Trakte turm, turm-ost, turm-west): höchste Lage im Hauptturm, in der Torhalle und
   Jumper-Bucht im Turm liegen und über der Dachluke der Jumper-Bucht freier Himmel ist.
3. Übrige Trakte: als starre Gruppe verschieben/drehen/anheben, bis möglichst alle Räume und Korridore in
   Gebäuden ihrer Zone liegen und sich nichts überschneidet. Plaza (ATL-042): auf freiem Deck.
Schreibt data/stadtplan.json (Positionen ersetzt, Abschnitt "einpassung") und data/stadtplan_einpassung.png.
Aufruf:  python3 build/tools/stadtplan.py && build/tools/pyenv/bin/python build/tools/stadt_einpassen.py
"""
import json, math, os, time
import numpy as np
import trimesh

ROOT = "/root/sga"
PLAN = f"{ROOT}/data/stadtplan.json"
RD = json.load(open(f"{ROOT}/data/raumdaten.json"))
G = 3.0                       # Rastermaß x/z (m)
DY = 1.0                      # Rastermaß y (m)
Y_MIN, Y_MAX = -130.0, 460.0
plan = json.load(open(f"{ROOT}/data/stadtplan_vor_einpassung.json"))   # immer vom Rohplan aus (stadtplan.py)
t0 = time.time()

# ------------------------------------------------------------------ 1. Belegungsgitter
CACHE = f"{ROOT}/build/stadt_stl/belegung.npz"
GLB = f"{ROOT}/data/stadt/aussen/atlantis_nah.glb"
if os.path.exists(CACHE) and os.path.getmtime(CACHE) > os.path.getmtime(GLB):
    d = np.load(CACHE); occ, top, xs, zs, ys = d["occ"], d["top"], d["xs"], d["zs"], d["ys"]
    NX, NZ, NY = len(xs), len(zs), len(ys)
else:
    mesh = trimesh.load(GLB, force="mesh")
    b = mesh.bounds
    xs = np.arange(math.floor(b[0][0] / G) * G, b[1][0] + G, G)
    zs = np.arange(math.floor(b[0][2] / G) * G, b[1][2] + G, G)
    ys = np.arange(Y_MIN, Y_MAX, DY)
    NX, NZ, NY = len(xs), len(zs), len(ys)
    gx, gz = np.meshgrid(xs, zs, indexing="ij")
    orig = np.stack([gx.ravel(), np.full(gx.size, Y_MAX + 5), gz.ravel()], 1)
    ri = trimesh.ray.ray_triangle.RayMeshIntersector(mesh)
    locs, ray_idx, _ = ri.intersects_location(orig, np.tile([0, -1, 0], (len(orig), 1)), multiple_hits=True)
    occ = np.zeros((NX * NZ, NY), bool)
    top = np.full(NX * NZ, -1e9)
    order = np.lexsort((-locs[:, 1], ray_idx))
    locs, ray_idx = locs[order], ray_idx[order]
    starts = np.searchsorted(ray_idx, np.arange(NX * NZ))
    ends = np.searchsorted(ray_idx, np.arange(NX * NZ), side="right")
    for r in range(NX * NZ):
        hy = locs[starts[r]:ends[r], 1]
        if not len(hy):
            continue
        hy = np.unique(np.round(hy, 2))[::-1]
        top[r] = hy[0]
        for i in range(0, len(hy) - 1, 2):            # Parität: [Eintritt, Austritt]
            a, c = hy[i], hy[i + 1]
            occ[r, max(0, int((c - Y_MIN) / DY)):min(NY, int((a - Y_MIN) / DY) + 1)] = True
    occ = occ.reshape(NX, NZ, NY)
    top = top.reshape(NX, NZ)
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    np.savez_compressed(CACHE, occ=occ, top=top, xs=xs, zs=zs, ys=ys)
print(f"Belegungsgitter {NX}×{NZ}×{NY} in {time.time() - t0:.0f} s, belegt {occ.mean() * 100:.1f} %")


def lookup(P):
    """P: (..., 3) Weltpunkte → True, wenn im Gebäude/Rumpf."""
    ix = np.clip(np.round((P[..., 0] - xs[0]) / G).astype(int), 0, NX - 1)
    iz = np.clip(np.round((P[..., 2] - zs[0]) / G).astype(int), 0, NZ - 1)
    iy = np.round((P[..., 1] - Y_MIN) / DY).astype(int)
    inside = (iy >= 0) & (iy < NY)
    return occ[ix, iz, np.clip(iy, 0, NY - 1)] & inside


def top_at(x, z):
    ix = int(np.clip(round((x - xs[0]) / G), 0, NX - 1)); iz = int(np.clip(round((z - zs[0]) / G), 0, NZ - 1))
    return top[ix, iz]


# ------------------------------------------------------------------ Gruppen (Trakte) und Messpunkte
def rot(x, z, th):
    return (x * math.cos(th) + z * math.sin(th), -x * math.sin(th) + z * math.cos(th))


def room_samples(r, n=3):
    """Messpunkte im Raumvolumen (Weltkoordinaten nach aktuellem Plan): Raster im Grundriss × 2 Höhen."""
    mn, mx = RD[r["id"]]["min"], RD[r["id"]]["max"]
    pts = []
    for fx in np.linspace(0.12, 0.88, n):
        for fz in np.linspace(0.12, 0.88, n):
            lx, lz = mn[0] + (mx[0] - mn[0]) * fx, mn[2] + (mx[2] - mn[2]) * fz
            wx, wz = rot(lx, lz, r["rotY"])
            for fy in (0.25, 0.8):
                pts.append([r["pos"][0] + wx, r["pos"][1] + mn[1] + (mx[1] - mn[1]) * fy, r["pos"][2] + wz])
    return pts


def korr_samples(k):
    L, a = k["opts"]["laenge"], k["rotY"]
    pts = []
    for t in np.linspace(0.15, 0.85, 3):
        wx, wz = rot(0, L * t, a)
        pts.append([k["pos"][0] + wx, k["pos"][1] + 2.0, k["pos"][2] + wz])
    return pts


# Trakte ohne eigene Räume (z. B. turm-west: Korridor + Transporter an der Torhalle) gehören zum Torhallen-Komplex
mit_raeumen = {r["trakt"] for r in plan["raeume"]}
def gruppe_von(trakt):
    return "turmkomplex" if trakt == "turm" or (trakt.startswith("turm") and trakt not in mit_raeumen) else trakt

gruppen = {}
for r in plan["raeume"]:
    tid = gruppe_von(r["trakt"])
    if r["trakt"].startswith("turm-"):
        r["zone"] = "insel"                         # Bürotrakte: eigene Gruppe auf der Insel, über Transporter angebunden
    gruppen.setdefault(tid, {"raeume": [], "korridore": [], "transporter": []})["raeume"].append(r)
for k in plan["korridore"]:
    tid = gruppe_von(k["trakt"])
    gruppen.setdefault(tid, {"raeume": [], "korridore": [], "transporter": []})["korridore"].append(k)
for t in plan["transporter"]:
    tid = gruppe_von(t["trakt"])
    gruppen.setdefault(tid, {"raeume": [], "korridore": [], "transporter": []})["transporter"].append(t)


def group_points(g):
    """Messpunkte relativ zum Gruppenanker (Mittelpunkt im Grundriss, Boden-y des tiefsten Raums)."""
    R, W = [], []
    for r in g["raeume"]:
        p = room_samples(r)
        R += p; W += [1.0] * len(p)
    for k in g["korridore"]:
        p = korr_samples(k)
        R += p; W += [0.5] * len(p)
    R = np.array(R)
    anker = np.array([R[:, 0].mean(), min(r["pos"][1] for r in g["raeume"]), R[:, 2].mean()])
    return R - anker, np.array(W), anker


def place_points(rel, x, y, z, th):
    c, s = math.cos(th), math.sin(th)
    X = rel[:, 0] * c + rel[:, 2] * s
    Z = -rel[:, 0] * s + rel[:, 2] * c
    return np.stack([X + x, rel[:, 1] + y, Z + z], 1)


def footprint(rel, x, y, z, th):
    P = place_points(rel, x, y, z, th)
    return P[:, 0].min(), P[:, 0].max(), P[:, 1].min(), P[:, 1].max() + 3, P[:, 2].min(), P[:, 2].max()


belegt = []                                         # bereits vergebene Boxen (x0, x1, y0, y1, z0, z1)


def frei(box, rand=2.0):
    for o in belegt:
        if box[0] < o[1] + rand and o[0] < box[1] + rand and box[2] < o[3] and o[2] < box[3] and box[4] < o[5] + rand and o[4] < box[5] + rand:
            return False
    return True


ergebnis = {}


def apply(tid, x, y, z, th, score):
    """Gruppe tid von ihrem Anker auf (x, y, z) mit Zusatzdrehung th setzen – Räume, Korridore, Transporter."""
    g = gruppen[tid]
    _, _, anker = group_points(g)
    def tr(p):
        rx, rz = rot(p[0] - anker[0], p[2] - anker[2], th)
        return [round(x + rx, 3), round(p[1] - anker[1] + y, 3), round(z + rz, 3)]
    def tr_poly(pts):
        out = []
        for px, pz in pts:
            rx, rz = rot(px - anker[0], pz - anker[2], th)
            out.append([round(x + rx, 2), round(z + rz, 2)])
        return out
    dy = y - anker[1]
    for r in g["raeume"]:
        r["pos"] = tr(r["pos"]); r["rotY"] = round(r["rotY"] + th, 5)
        r["grundriss"] = tr_poly(r["grundriss"]); r["hoehe"] = [round(h + dy, 2) for h in r["hoehe"]]
    for k in g["korridore"]:
        k["pos"] = tr(k["pos"]); k["rotY"] = round(k["rotY"] + th, 5); k["grundriss"] = tr_poly(k["grundriss"])
    for t in g["transporter"]:
        t["pos"] = tr(t["pos"]); t["rotY"] = round(t["rotY"] + th, 5)
    ergebnis[tid] = {"pos": [round(x, 1), round(y, 1), round(z, 1)], "drehung_grad": round(math.degrees(th)), "im_gebaeude": round(score, 3)}


# ------------------------------------------------------------------ 2. Torhallen-Komplex oben im Hauptturm
g = gruppen["turmkomplex"]
rel, w, anker = group_points(g)
r001 = next(r for r in g["raeume"] if r["id"] == "ATL-001")
r040 = next(r for r in g["raeume"] if r["id"] == "ATL-040")
r048 = next((r for r in g["raeume"] if r["id"] == "ATL-048"), None)
rel001 = np.array(room_samples(r001, 4)) - anker
luke_rel = np.array([[r040["pos"][0] - anker[0], r040["hoehe"][1] - anker[1], r040["pos"][2] - anker[2]]])
bucht_boden_rel = r040["hoehe"][0] - anker[1]
bal_rel = (np.array(room_samples(r048)) - anker) if r048 else None
it = np.unravel_index(np.argmax(top), top.shape)
tx, tz = xs[it[0]], zs[it[1]]
print(f"Hauptturm-Spitze bei x={tx:.0f}, z={tz:.0f}, y={top[it]:.0f}")
best = None
YT = np.arange(40, 420, 1.0)
for th in np.radians(np.arange(0, 360, 15)):
    for dx in np.arange(-45, 46, 3):
        for dz in np.arange(-45, 46, 3):
            x, z = tx + dx, tz + dz
            P = place_points(rel001, x, 0, z, th)[None, :, :] + np.stack([np.zeros_like(YT), YT, np.zeros_like(YT)], 1)[:, None, :]
            sc = lookup(P).mean(1)                                       # Torhalle im Turm
            L0 = place_points(luke_rel, x, 0, z, th)[0]
            dach = top_at(L0[0], L0[2])
            himmel = dach < L0[1] + YT + 1.0                             # über der Dachluke der Jumper-Bucht freier Himmel
            bucht_auf_dach = np.abs(dach - (YT + bucht_boden_rel)) < 3.5   # Bucht steht auf dem Turmdach
            ok = (sc >= 0.8) & himmel & bucht_auf_dach
            if not ok.any():
                continue
            i = np.where(ok)[0][-1]
            y = YT[i]
            bal = 1 - lookup(place_points(bal_rel, x, y, z, th)).mean() if bal_rel is not None else 0
            wert = y + sc[i] * 20 + bal * 6
            if best is None or wert > best[0]:
                best = (wert, x, y, z, th, sc[i], bal)
if best:
    _, x, y, z, th, sc, bal = best
    apply("turmkomplex", x, y, z, th, sc)
    belegt.append(footprint(rel, x, y, z, th))
    ergebnis["turmkomplex"]["balkon_im_freien"] = round(bal, 2)
    print(f"Torhalle: Boden y={y:.0f} m, Drehung {math.degrees(th):.0f}°, im Turm {sc*100:.0f} %, Balkon im Freien {bal*100:.0f} %")
else:
    print("WARNUNG: keine Lage im Hauptturm mit freiem Himmel über der Jumper-Bucht gefunden")

# ------------------------------------------------------------------ 3. übrige Trakte in Gebäude ihrer Zone
zonen = {z["id"]: z for z in plan["zonen"]}


def in_zone(zid, x, z):
    zn = zonen[zid]
    r = math.hypot(x, z)
    if zn["art"] == "insel":
        return r < 200
    w = math.radians(zn["winkel"])
    a = math.degrees(math.atan2(x, -z)) % 360
    d = (a - zn["winkel"] + 180) % 360 - 180
    return zn["r_innen"] + 60 < r < zn["r_aussen"] + 10 and abs(d) < 32   # wirklich auf dem Pier, nicht am Inselrand


reihen = sorted([t for t in gruppen if t != "turmkomplex"], key=lambda t: -len(gruppen[t]["raeume"]))
for tid in reihen:
    g = gruppen[tid]
    rel, w, anker = group_points(g)
    zid = g["raeume"][0]["zone"]
    plaza = any(r["id"] == "ATL-042" for r in g["raeume"])
    best = None
    YS = np.arange(-40, 160, 3.0)
    off = np.stack([np.zeros_like(YS), YS, np.zeros_like(YS)], 1)[:, None, :]
    kandidaten = []
    for x in np.arange(-640, 641, 8.0):
        for z in np.arange(-640, 641, 8.0):
            if not in_zone(zid, x, z):
                continue
            for th in np.radians(np.arange(0, 360, 30)):
                P = place_points(rel, x, 0, z, th)[None, :, :] + off      # alle Höhen auf einmal
                ins = lookup(P)
                if plaza:   # Plaza: Boden liegt auf der obersten Fläche (Deck), darüber freier Himmel
                    ob = np.array([top_at(px, pz) for px, pz in P[0, :, [0, 2]].T])
                    sc = np.array([(np.abs(ob - (yy + 0.0)) < 1.5).mean() for yy in YS])
                else:
                    sc = (ins * w).sum(1) / w.sum()
                i = int(np.argmax(sc + YS * 1e-5))                            # bei Gleichstand höher
                kandidaten.append((sc[i], x, YS[i], z, th))
    kandidaten.sort(key=lambda k: -k[0])
    for sc, x, y, z, th in kandidaten[:400]:                            # beste freie Lage
        box = footprint(rel, x, y, z, th)
        if frei(box):
            best = (sc, x, y, z, th, box)
            break
    if best:
        sc, x, y, z, th, box = best
        apply(tid, x, y, z, th, sc)
        belegt.append(box)
        print(f"{tid:22s} → x={x:6.0f} z={z:6.0f} y={y:5.0f}  Drehung {math.degrees(th):4.0f}°  {'auf Deck' if plaza else 'im Gebäude'} {sc*100:4.0f} %")
    else:
        print(f"{tid:22s} → keine freie Lage gefunden (bleibt)")

# Verbindungen zwischen Torhalle und verlegten Trakten (eigene Gruppe) entfallen – Anbindung über Transporter
korr_gruppe = {k["id"]: gruppe_von(k["trakt"]) for k in plan["korridore"]}
raum_gruppe = {r["id"]: gruppe_von(r["trakt"]) for r in plan["raeume"]}
def gr(e):
    return raum_gruppe.get(e.get("raum")) or korr_gruppe.get(e.get("korridor")) or ("tr" if e.get("transporter") else None)
plan["verbindungen"] = [v for v in plan["verbindungen"] if v.get("art") == "transporternetz" or "tr" in (gr(v["a"]), gr(v["b"])) or gr(v["a"]) == gr(v["b"])]

# Spielmarken nachziehen (Respawn im Kontrollraum = obere Ebene der Torhalle)
r001 = next(r for r in plan["raeume"] if r["id"] == "ATL-001")
rx, rz = rot(8.0, -10.0, r001["rotY"])
plan["spielmarken"]["respawn"]["pos"] = [round(r001["pos"][0] + rx, 2), round(r001["pos"][1] + 4.6, 2), round(r001["pos"][2] + rz, 2)]
plan["spielmarken"]["respawn"]["rotY"] = round(r001["rotY"] + math.pi, 4)
plan["turm_y"] = r001["pos"][1]
plan["einpassung"] = {"vorlage": "atlantis_nah.glb", "raster_m": G, "gruppen": ergebnis,
                      "hinweis": "Positionen von build/tools/stadt_einpassen.py in die Gebäude der Stadt-Vorlage eingepasst"}
json.dump(plan, open(PLAN, "w"), ensure_ascii=False, indent=1)

# Karte: Höhenbild der Vorlage + Räume
try:
    from PIL import Image, ImageDraw, ImageFont
    S = 1600; sc_ = S / 1400
    hm = np.clip((top.T - 0) / 120, 0, 1)
    img = Image.fromarray((np.where(top.T > -1e8, 40 + hm * 180, 18)).astype(np.uint8)).resize((int(NX * G * sc_), int(NZ * G * sc_)))
    can = Image.new("RGB", (S, S), (14, 30, 48))
    can.paste(Image.merge("RGB", (img, img, img)), (int(S / 2 + xs[0] * sc_), int(S / 2 + zs[0] * sc_)))
    can.save(f"{ROOT}/data/stadtplan_hoehen.png")             # Hintergrund für die UI-Karte (−700 … 700 m)
    d = ImageDraw.Draw(can)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    P = lambda x, z: (S / 2 + x * sc_, S / 2 + z * sc_)
    for k in plan["korridore"]:
        d.polygon([P(*p) for p in k["grundriss"]], fill=(77, 163, 255))
    for r in plan["raeume"]:
        d.polygon([P(*p) for p in r["grundriss"]], outline=(255, 170, 60), width=2)
        cx = sum(p[0] for p in r["grundriss"]) / 4; cz = sum(p[1] for p in r["grundriss"]) / 4
        d.text(P(cx, cz), r["id"][4:], fill=(255, 230, 190), font=font, anchor="mm")
    d.text((20, 18), "Einpassung in die Stadt-Vorlage (Höhenbild: hell = hoch) – Räume orange, Korridore blau", fill=(230, 230, 230), font=font)
    can.save(f"{ROOT}/data/stadtplan_einpassung.png")
except Exception as e:
    print("Karte:", e)
print(f"fertig in {time.time() - t0:.0f} s")

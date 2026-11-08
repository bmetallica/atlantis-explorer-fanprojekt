#!/usr/bin/env python3
"""Erzeugt data/stadtplan.json: Lage aller Räume in der Stadt, Korridore, Transporter, Verbindungen.

Eingabe: data/raumdaten.json (Außenmaße + DOOR_-Knoten je Raummodell, erzeugt von build/tools/raumdaten.mjs).
Aufbau:
  - Stadt: Durchmesser 1,3 km, zentrale Insel mit Kontrollturm, 6 Piers (3 große, 3 kleine im Wechsel).
  - Trakte: je ein gerader Korridorstrang (ATL-049-Segmente) radial nach außen; Räume links/rechts,
    die Haupttür jedes Raums sitzt genau an einer Seitenöffnung des Korridors.
  - Anbauten: Räume, die per Tür direkt an einem anderen Raum hängen (z. B. Pflanzenkammer an Botanik-Labor).
  - Am Anfang jedes Trakts steht ein Transporter (OBJ-043); alle Transporter sind untereinander verbunden.
Koordinaten: x = Osten, z = Süden, y = oben (Meter). Kompasswinkel: 0° = Norden, im Uhrzeigersinn.
Aufruf:  python3 build/tools/stadtplan.py   → data/stadtplan.json + data/stadtplan.png (Karte)
"""
import json, math, os

ROOT = "/root/sga"
RD = json.load(open(f"{ROOT}/data/raumdaten.json"))
NAMEN = {r["id"]: r["name_de"] for r in json.load(open(f"{ROOT}/data/rooms.json"))["rooms"]}

WASSER_Y = 0.0
DECK_Y = 6.0
EBENE_Y = {0: -16, 1: -10, 2: -4, 3: 2, 4: 8, 5: 14, 6: 20}
TURM_Y = 60.0                       # Torhalle im Kontrollturm
F = 2.4                             # Feldlänge des Korridormoduls
KORR_X = 1.95                       # Abstand Korridormitte → Mitte Seitenwand (Türknoten)
SPALT = 0.15                        # Luft zwischen Korridorwand und Raumtür

ZONEN = [
    {"id": "turm", "name": "Kontrollturm", "art": "turm", "winkel": None, "r_innen": 0, "r_aussen": 45, "hoehe": 150},
    {"id": "insel", "name": "Zentrale Insel (Innenstadt)", "art": "insel", "winkel": None, "r_innen": 0, "r_aussen": 230},
    {"id": "ostpier", "name": "Ostpier", "art": "pier", "groesse": "gross", "winkel": 90, "r_innen": 200, "r_aussen": 650, "breite": 150},
    {"id": "suedpier", "name": "Südpier", "art": "pier", "groesse": "klein", "winkel": 150, "r_innen": 200, "r_aussen": 480, "breite": 95},
    {"id": "suedwestpier", "name": "Südwestpier", "art": "pier", "groesse": "gross", "winkel": 210, "r_innen": 200, "r_aussen": 650, "breite": 150},
    {"id": "westpier", "name": "Westpier", "art": "pier", "groesse": "klein", "winkel": 270, "r_innen": 200, "r_aussen": 480, "breite": 95},
    {"id": "nordwestpier", "name": "Nordwestpier", "art": "pier", "groesse": "gross", "winkel": 330, "r_innen": 200, "r_aussen": 650, "breite": 150},
    {"id": "nordostpier", "name": "Nordostpier", "art": "pier", "groesse": "klein", "winkel": 30, "r_innen": 200, "r_aussen": 480, "breite": 95},
]

# Trakte: Zone, Kompasswinkel, Startradius, Ebene; Räume paarweise (links, rechts) entlang des Korridors.
# Anbauten: Kind-Raum hängt mit seiner Tür an einer Tür des Eltern-Raums.
TRAKTE = [
    {"id": "insel-medizin", "zone": "insel", "winkel": 150, "r0": 70, "ebene": 4, "raeume": ["ATL-009", "ATL-012"]},
    {"id": "insel-wohnen", "zone": "insel", "winkel": 210, "r0": 70, "ebene": 4, "raeume": ["ATL-024", "ATL-025", "ATL-026", "ATL-027", "ATL-028", "ATL-029"]},
    {"id": "insel-oeffentlich", "zone": "insel", "winkel": 270, "r0": 70, "ebene": 5, "raeume": ["ATL-043", "ATL-006", "ATL-044", "ATL-019", "ATL-046"]},
    {"id": "insel-energie", "zone": "insel", "winkel": 90, "r0": 70, "ebene": 1, "raeume": ["ATL-036", "ATL-037"]},
    {"id": "insel-kern", "zone": "insel", "winkel": 30, "r0": 60, "ebene": 0, "raeume": ["ATL-038"]},
    {"id": "insel-stasis", "zone": "insel", "winkel": 330, "r0": 70, "ebene": 2, "raeume": ["ATL-039"]},
    {"id": "insel-plaza", "zone": "insel", "winkel": 330, "r0": 90, "ebene": 5, "raeume": ["ATL-042"]},
    {"id": "ostpier-labore", "zone": "ostpier", "winkel": 90, "r0": 240, "ebene": 3, "raeume": ["ATL-014", "ATL-013", "ATL-015", "ATL-018", "ATL-022", "ATL-020", "ATL-023", "ATL-016", "ATL-017", "ATL-021"]},
    {"id": "suedpier-fracht", "zone": "suedpier", "winkel": 150, "r0": 240, "ebene": 2, "raeume": ["ATL-034", "ATL-035"]},
    {"id": "suedpier-wasser", "zone": "suedpier", "winkel": 150, "r0": 300, "ebene": 1, "raeume": ["ATL-047"]},
    {"id": "suedwestpier-hangar", "zone": "suedwestpier", "winkel": 210, "r0": 260, "ebene": 5, "raeume": ["ATL-041"]},
    {"id": "westpier-militaer", "zone": "westpier", "winkel": 270, "r0": 240, "ebene": 5, "raeume": ["ATL-030", "ATL-031", "ATL-032", "ATL-033"]},
]
# Haupttür je Raum (die an den Korridor kommt); sonst erste Tür
HAUPTTUER = {"ATL-016": "DOOR_korridor", "ATL-011": "DOOR_aussen", "ATL-015": "DOOR_aussen", "ATL-034": "DOOR_eingang_mitte",
             "ATL-041": "DOOR_personeneingang", "ATL-042": "DOOR_eingang", "ATL-046": "DOOR_gate", "ATL-022": "DOOR_haupt"}
ANBAUTEN = [  # (Eltern, Elterntür, Kind, Kindtür)
    ("ATL-001", "DOOR_konferenz", "ATL-003", "DOOR_kontrollraum"),
    ("ATL-001", "DOOR_buero", "ATL-005", "DOOR_haupt"),
    ("ATL-001", "DOOR_balkon", "ATL-048", "DOOR_eingang"),
    ("ATL-009", "DOOR_op", "ATL-010", "DOOR_haupt_eingang"),
    ("ATL-009", "DOOR_isolation", "ATL-011", "DOOR_aussen"),
]
# Turm: Trakt ab den unteren Seitentüren der Torhalle (Höhe der Torhalle)
TURM_TRAKTE = [
    {"id": "turm-ost", "tuer": "DOOR_unten_rechts", "raeume": ["ATL-004", "ATL-007", "ATL-008"]},
    {"id": "turm-west", "tuer": "DOOR_unten_links", "raeume": []},
]


def compass_dir(deg):
    a = math.radians(deg)
    return (math.sin(a), -math.cos(a))          # (x, z): Norden = −z


def phi(vx, vz):
    return math.atan2(vx, vz)                    # Winkel wie three.js rotation.y: (0,0,1) → (sin θ, cos θ)


def rot(vx, vz, th):
    return (vx * math.cos(th) + vz * math.sin(th), -vx * math.sin(th) + vz * math.cos(th))


def door(rid, name=None):
    ts = RD[rid]["tueren"]
    name = name or HAUPTTUER.get(rid)
    for t in ts:
        if t["name"] == name:
            return t
    return ts[0]


def room_corners(rid):
    mn, mx = RD[rid]["min"], RD[rid]["max"]
    return [(mn[0], mn[2]), (mx[0], mn[2]), (mx[0], mx[2]), (mn[0], mx[2])], mn[1], mx[1]


raeume, korridore, transporter, verbindungen = {}, [], [], []


def place_room(rid, pos, roty, zone, trakt, ebene):
    raeume[rid] = {"id": rid, "zone": zone, "trakt": trakt, "ebene": ebene,
                   "pos": [round(p, 3) for p in pos], "rotY": round(roty, 5)}


def world_door(rid, dname):
    r = raeume[rid]
    t = door(rid, dname)
    dx, dz = rot(t["pos"][0], t["pos"][2], r["rotY"])
    ux, uz = rot(t["richtung"][0], t["richtung"][1], r["rotY"])
    return (r["pos"][0] + dx, r["pos"][1] + t["pos"][1], r["pos"][2] + dz), (ux, uz)


def attach(parent, pdoor, child, cdoor):
    (px, py, pz), (wx, wz) = world_door(parent, pdoor)
    t = door(child, cdoor)
    th = phi(-wx, -wz) - phi(t["richtung"][0], t["richtung"][1])
    dx, dz = rot(t["pos"][0], t["pos"][2], th)
    p = raeume[parent]
    place_room(child, (px - dx + wx * 0.05, py - t["pos"][1], pz - dz + wz * 0.05), th, p["zone"], p["trakt"], p["ebene"])
    verbindungen.append({"a": {"raum": parent, "tuer": pdoor}, "b": {"raum": child, "tuer": cdoor}, "art": "tuer"})


def build_trakt(tid, zone, origin, alpha, y, ebene, rooms):
    """Korridorstrang ab origin (x, z) in Richtung alpha (rotation.y), Räume abwechselnd links/rechts."""
    sx, sz = math.sin(alpha), math.cos(alpha)
    used = {-1: 0.0, 1: 0.0}                    # belegte Länge je Seite (lokal entlang des Strangs)
    s = 0.0                                      # aktuelles Strangende
    n = 0
    # Transporter vor dem Strang (Kabine 1,8 × 1,8 m), Tür zeigt in den Korridor
    transporter.append({"id": f"TR-{tid}", "objekt": "OBJ-043", "trakt": tid,
                        "pos": [round(origin[0] - sx * 1.2, 3), y, round(origin[1] - sz * 1.2, 3)], "rotY": round(alpha, 5)})
    first = True
    pairs = [rooms[i:i + 2] for i in range(0, len(rooms), 2)]
    for pair in pairs:
        side_rooms = {}
        for side, rid in zip((-1, 1), pair):
            t = door(rid)
            # Raumtür muss zum Korridor zeigen: links (−x) → Richtung +x, rechts → −x
            th = phi(-side, 0) - phi(t["richtung"][0], t["richtung"][1])
            dx, dz = rot(t["pos"][0], t["pos"][2], th)
            cs, _, _ = room_corners(rid)
            zs = [rot(cx, cz, th)[1] - dz for cx, cz in cs]   # Ausdehnung entlang des Strangs relativ zur Tür
            side_rooms[side] = (rid, t, th, dx, dz, min(zs), max(zs))
        felder = 4
        zo = (felder // 2) * F + F / 2           # Seitenöffnung in Feldmitte
        need = max(used[sd] + 1.0 - (zo + v[5]) for sd, v in side_rooms.items())
        if need > s + 0.01:                       # Lücke: gerades Füllstück einsetzen
            fl = max(2, math.ceil((need - s) / F))
            korridore.append({"id": f"K-{tid}-{n:02d}", "modell": "ATL-049", "trakt": tid, "opts": {"laenge": fl * F, "variante": "gerade"},
                              "pos": [round(origin[0] + sx * s, 3), y, round(origin[1] + sz * s, 3)], "rotY": round(alpha, 5)})
            if not first:
                verbindungen.append({"a": {"korridor": f"K-{tid}-{n-1:02d}", "tuer": "DOOR_ende"}, "b": {"korridor": f"K-{tid}-{n:02d}", "tuer": "DOOR_anfang"}, "art": "offen"})
            first = False
            n += 1
            s += fl * F
        kid = f"K-{tid}-{n:02d}"
        opts = {"laenge": felder * F, "variante": "t" if 1 in side_rooms else "gerade"}
        if -1 in side_rooms:
            opts["seitentuer"] = True
        korridore.append({"id": kid, "modell": "ATL-049", "trakt": tid, "opts": opts,
                          "pos": [round(origin[0] + sx * s, 3), y, round(origin[1] + sz * s, 3)], "rotY": round(alpha, 5)})
        if not first:
            verbindungen.append({"a": {"korridor": f"K-{tid}-{n-1:02d}", "tuer": "DOOR_ende"}, "b": {"korridor": kid, "tuer": "DOOR_anfang"}, "art": "offen"})
        else:
            verbindungen.append({"a": {"transporter": f"TR-{tid}"}, "b": {"korridor": kid, "tuer": "DOOR_anfang"}, "art": "offen"})
        first = False
        for side, (rid, t, th, dx, dz, zmin, zmax) in side_rooms.items():
            # Türpunkt lokal im Segment: x = side·(KORR_X + Wand/2 + Spalt), z = zo
            # Raumteile, die über die Türebene zum Korridor hin vorstehen (zurückgesetzte Tür) → Raum wegrücken, Lücke = Durchgang
            ux_, uz_ = rot(t["richtung"][0], t["richtung"][1], th)
            dproj = dx * ux_ + dz * uz_
            vor = max(rot(cx, cz, th)[0] * ux_ + rot(cx, cz, th)[1] * uz_ for cx, cz in room_corners(rid)[0]) - dproj
            durchgang = max(0.0, vor - 0.05)
            lx = side * (KORR_X + 0.15 + SPALT + durchgang)
            lz = s + zo
            rx, rz = lx - dx, lz - dz             # Raumursprung lokal im Strang
            wx, wz = rot(rx, rz, alpha)
            place_room(rid, (origin[0] + wx, y - t["pos"][1], origin[1] + wz), alpha + th, zone, tid, ebene)
            used[side] = s + zo + zmax
            for p_, pd_, c_, cd_ in ANBAUTEN:          # Anbauten sofort setzen und ihren Platz reservieren
                if p_ == rid:
                    attach(p_, pd_, c_, cd_)
                    cs_, _, _ = room_corners(c_)
                    rc = raeume[c_]
                    for cx, cz in cs_:
                        qx, qz = rot(cx, cz, rc["rotY"])
                        lz_ = (rc["pos"][0] + qx - origin[0]) * sx + (rc["pos"][2] + qz - origin[1]) * sz
                        lx_ = (rc["pos"][0] + qx - origin[0]) * sz - (rc["pos"][2] + qz - origin[1]) * sx
                        sd_ = -1 if lx_ > 0 else 1   # Seite aus Sicht des Strangs (x lokal = −Querachse)
                        used[side] = max(used[side], lz_)
            vb = {"a": {"korridor": kid, "tuer": "DOOR_seite" if side == -1 else "DOOR_abzweig"}, "b": {"raum": rid, "tuer": t["name"]}, "art": "tuer"}
            if durchgang > 0.05:
                vb["durchgang_m"] = round(durchgang + SPALT, 2)   # kurzes Verbindungsstück, erzeugt das Spiel
            verbindungen.append(vb)
        n += 1
        s += felder * F
    # Abschluss
    korridore.append({"id": f"K-{tid}-{n:02d}", "modell": "ATL-049", "trakt": tid, "opts": {"laenge": 4.8, "variante": "ende"},
                      "pos": [round(origin[0] + sx * s, 3), y, round(origin[1] + sz * s, 3)], "rotY": round(alpha, 5)})
    if n:
        verbindungen.append({"a": {"korridor": f"K-{tid}-{n-1:02d}", "tuer": "DOOR_ende"}, "b": {"korridor": f"K-{tid}-{n:02d}", "tuer": "DOOR_anfang"}, "art": "offen"})


# ---- Kontrollturm: Torhalle in der Mitte, Rückwand (Balkon) nach Norden
place_room("ATL-001", (0.0, TURM_Y, 0.0), 0.0, "turm", "turm", 6)
for p, pd, c, cd in ANBAUTEN[:3]:
    attach(p, pd, c, cd)
# Jumper-Bucht über der Deckenöffnung (Bodenluke-Mitte = Ursprung von ATL-040)
jb = door("ATL-001", "DOOR_jumperbay")
place_room("ATL-040", (jb["pos"][0], TURM_Y + jb["pos"][1] + 0.3, jb["pos"][2]), 0.0, "turm", "turm", 6)
verbindungen.append({"a": {"raum": "ATL-001", "tuer": "DOOR_jumperbay"}, "b": {"raum": "ATL-040", "tuer": "bodenluke"}, "art": "luke"})
# Transporter in der Jumper-Bucht: 2,5 m hinter ihrer Tür (Seite ohne Jumper), Ankunft weiter im Raum
(jx, jy, jz), (jux, juz) = world_door("ATL-040", "DOOR_sued")
transporter.append({"id": "TR-jumperbucht", "objekt": "OBJ-043", "trakt": "turm", "name": "Jumper-Bucht",
                    "pos": [round(jx - jux * 2.5, 3), round(jy, 3), round(jz - juz * 2.5, 3)], "rotY": round(phi(-jux, -juz), 5)})
for tt in TURM_TRAKTE:
    (dx, dy, dz), (ux, uz) = world_door("ATL-001", tt["tuer"])
    a = phi(ux, uz)
    o = (dx + ux * (0.15 + SPALT), dz + uz * (0.15 + SPALT))
    build_trakt(tt["id"], "turm", o, a, dy, 6, tt["raeume"])
    # Torhalle ↔ Transporter-Strang: Tür der Torhalle führt in den ersten Korridor (Transporter steht dahinter seitlich)
    verbindungen.append({"a": {"raum": "ATL-001", "tuer": tt["tuer"]}, "b": {"korridor": f"K-{tt['id']}-00", "tuer": "DOOR_anfang"}, "art": "tuer"})
    transporter[-1]["pos"] = [round(o[0] + math.sin(a) * 2.5 + math.cos(a) * 2.6, 3), dy, round(o[1] + math.cos(a) * 2.5 - math.sin(a) * 2.6, 3)]

# Transporter „Torhalle“: Ankunft in der unteren Ebene neben der dort eingebauten Kabine (kein eigener Korridor nötig)
for t in transporter:
    if t["id"] == "TR-turm-west":
        r1 = raeume["ATL-001"]
        lx, lz = rot(-7.0, -14.8, r1["rotY"])
        t.update({"pos": [round(r1["pos"][0] + lx, 3), r1["pos"][1], round(r1["pos"][2] + lz, 3)],
                  "rotY": round(r1["rotY"] + math.pi / 4, 5), "kabine": False, "name": "Torhalle (Stargate)"})
# ---- Insel und Piers
for t in TRAKTE:
    dx, dz = compass_dir(t["winkel"])
    o = (dx * t["r0"], dz * t["r0"])
    build_trakt(t["id"], t["zone"], o, phi(dx, dz), EBENE_Y[t["ebene"]], t["ebene"], t["raeume"])
for p, pd, c, cd in ANBAUTEN[3:]:
    if c not in raeume:
        attach(p, pd, c, cd)

# ---- lesbare Namen für das Transportermenü
NAMEN_TR = {"turm-ost": "Kommandantur und Büros", "turm-west": "Torhalle (Stargate)", "insel-medizin": "Krankenstation",
            "insel-wohnen": "Quartiere und Kantine", "insel-oeffentlich": "Stuhlraum und Sektion 7", "insel-energie": "Hauptstromraum",
            "insel-kern": "ZPM-Raum", "insel-stasis": "Stasiskammer", "insel-plaza": "Plaza", "ostpier-labore": "Ostpier – Labore",
            "suedpier-fracht": "Südpier – Frachthalle", "suedpier-wasser": "Südpier – Entsalzung", "suedwestpier-hangar": "Südwestpier – Hangar",
            "westpier-militaer": "Westpier – Waffenkammer"}
for t in transporter:
    t.setdefault("name", NAMEN_TR.get(t["trakt"], t["trakt"]))

# ---- Transporter-Netz (jeder mit jedem; im Spiel: Auswahlmenü)
tr_ids = [t["id"] for t in transporter]
verbindungen.append({"art": "transporternetz", "transporter": tr_ids})


# ---- Prüfen: Überschneidungen der Raumkästen (Achsen-Boxen in Weltkoordinaten)
def world_box(rid):
    r = raeume[rid]
    cs, y0, y1 = room_corners(rid)
    pts = [rot(cx, cz, r["rotY"]) for cx, cz in cs]
    xs = [r["pos"][0] + p[0] for p in pts]
    zs = [r["pos"][2] + p[1] for p in pts]
    return (min(xs), r["pos"][1] + y0, min(zs)), (max(xs), r["pos"][1] + y1, max(zs))


def obb(rid):
    """Gedrehter Grundriss (4 Ecken in Welt-xz) + Höhenbereich."""
    r = raeume[rid]
    cs, y0, y1 = room_corners(rid)
    pts = [(r["pos"][0] + p[0], r["pos"][2] + p[1]) for p in (rot(cx, cz, r["rotY"]) for cx, cz in cs)]
    return pts, r["pos"][1] + y0, r["pos"][1] + y1


def overlap(a, b, tol=0.6):
    """Trennachsen-Test (SAT) für zwei gedrehte Rechtecke, plus Höhenbereich; tol = erlaubte Eindringtiefe."""
    (pa, a0, a1), (pb, b0, b1) = a, b
    if a0 + tol >= b1 or b0 + tol >= a1:
        return False
    for poly in (pa, pb):
        for i in range(4):
            ex, ez = poly[(i + 1) % 4][0] - poly[i][0], poly[(i + 1) % 4][1] - poly[i][1]
            nx, nz = -ez, ex
            ln = math.hypot(nx, nz) or 1
            nx, nz = nx / ln, nz / ln
            pra = [x * nx + z * nz for x, z in pa]
            prb = [x * nx + z * nz for x, z in pb]
            if min(pra) + tol >= max(prb) or min(prb) + tol >= max(pra):
                return False
    return True


obbs = {rid: obb(rid) for rid in raeume}
korr_obbs = {}
for k in korridore:
    L, a = k["opts"]["laenge"], k["rotY"]
    cs = [(-2.1, 0), (2.1, 0), (2.1, L), (-2.1, L)]
    korr_obbs[k["id"]] = ([(k["pos"][0] + rot(cx, cz, a)[0], k["pos"][2] + rot(cx, cz, a)[1]) for cx, cz in cs], k["pos"][1], k["pos"][1] + 4.7)
boxes = {rid: world_box(rid) for rid in raeume}
konflikte = []
ids = sorted(obbs)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        paar = any({a, b} == {p_, c_} for p_, _, c_, _ in ANBAUTEN)
        if overlap(obbs[a], obbs[b], tol=1.5 if paar else 0.6):
            konflikte.append([a, b])
korr_konflikte = []
for kid, kb in korr_obbs.items():
    for rid, rb in obbs.items():
        if rid == "ATL-001":
            continue   # Torhalle: Strang beginnt direkt an ihrer Tür
        if overlap((kb[0], kb[1], kb[2] - 0.6), rb, tol=0.4):
            korr_konflikte.append([kid, rid])
print("Korridor-Konflikte:", korr_konflikte)
fehlend = sorted(set(k for k in RD if k.startswith("ATL-")) - set(raeume) - {"ATL-049"})

# ---- Außenmodule (STA-xxx): Insel, Turm, Piers, Gebäudehüllen über Trakten, freie Hochhäuser
import random
module = [{"modul": "STA-002", "name": "city_central_island", "pos": [0, DECK_Y, 0], "rotY": 0, "skala": [1, 1, 1]},
          {"modul": "STA-001", "name": "city_control_tower", "pos": [0, DECK_Y, 0], "rotY": 0, "skala": [1, 1, 1]}]
for zn in ZONEN:
    if zn["art"] == "pier":
        dx, dz = compass_dir(zn["winkel"])
        gross = zn["groesse"] == "gross"
        module.append({"modul": "STA-003" if gross else "STA-004", "name": "city_pier_large" if gross else "city_pier_small", "zone": zn["id"],
                       "pos": [round(dx * zn["r_innen"], 2), DECK_Y, round(dz * zn["r_innen"], 2)], "rotY": round(phi(dx, dz), 5), "skala": [1, 1, 1]})
# Hüllen: je Trakt über Deck (Ebene ≥ 4, außer Turm) ein skalierter Flachbau über Räumen + Korridor
belegt = []                                   # (x, z, radius) belegter Flächen für die Hochhaus-Verteilung
trakt_ids = sorted({r["trakt"] for r in raeume.values()})
for tid in trakt_ids:
    rs = [r for r in raeume.values() if r["trakt"] == tid]
    pts = [p for r in rs for p in obbs[r["id"]][0]] + [p for k in korridore if k["trakt"] == tid for p in korr_obbs[k["id"]][0]]
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
    belegt.append((cx, cz, math.hypot(max(xs) - min(xs), max(zs) - min(zs)) / 2 + 8))
    if tid.startswith("turm") or min(r["ebene"] for r in rs) < 4 or tid == "insel-plaza":
        continue
    # Ausrichtung des Trakts = Korridorrichtung; Ausdehnung in diesem Rahmen
    a = next(k["rotY"] for k in korridore if k["trakt"] == tid)
    loc = [rot(px - cx, pz - cz, -a) for px, pz in pts]
    lx = [p[0] for p in loc]; lz = [p[1] for p in loc]
    bx, bz = max(lx) - min(lx) + 4, max(lz) - min(lz) + 4
    ox, oz = rot((max(lx) + min(lx)) / 2, (max(lz) + min(lz)) / 2, a)
    top = max(obbs[r["id"]][2] for r in rs)
    hoehe = top - DECK_Y + 2.5
    module.append({"modul": "STA-008", "name": "city_block_low", "trakt": tid, "pos": [round(cx + ox, 2), DECK_Y, round(cz + oz, 2)],
                   "rotY": round(a + math.pi / 2, 5), "skala": [round(bz / 60, 3), round(hoehe / 14, 3), round(bx / 30, 3)]})
rnd = random.Random(7)
typen = [("STA-005", "city_tower_slender", 16), ("STA-006", "city_tower_stepped", 24), ("STA-007", "city_tower_round", 14)]
belegt.append((0, 0, 115))                    # Turmumfeld frei (Turm + Platz drumherum)
for zn in ZONEN:
    if zn["art"] == "turm":
        continue
    n = 34 if zn["art"] == "insel" else (16 if zn.get("groesse") == "gross" else 9)
    tries = 0
    while n > 0 and tries < 4000:
        tries += 1
        if zn["art"] == "insel":
            r_ = rnd.uniform(70, 205); w_ = rnd.uniform(0, 360)
            x, z = math.sin(math.radians(w_)) * r_, -math.cos(math.radians(w_)) * r_
        else:
            dx, dz = compass_dir(zn["winkel"]); nx, nz = -dz, dx
            t = rnd.uniform(zn["r_innen"] + 30, zn["r_aussen"] - 70)
            breite = zn["breite"] / 2 * (1 - 0.45 * (t - zn["r_innen"]) / (zn["r_aussen"] - zn["r_innen"])) - 22
            q = rnd.uniform(-breite, breite)
            x, z = dx * t + nx * q, dz * t + nz * q
        mod, name, rad = rnd.choice(typen)
        if any(math.hypot(x - bx_, z - bz_) < rad + br_ for bx_, bz_, br_ in belegt):
            continue
        belegt.append((x, z, rad + 6))
        sk = round(rnd.uniform(0.75, 1.25), 3)
        module.append({"modul": mod, "name": name, "zone": zn["id"], "pos": [round(x, 2), DECK_Y, round(z, 2)],
                       "rotY": round(rnd.uniform(0, math.pi * 2), 4), "skala": [1, sk, 1]})
        n -= 1
print("Außenmodule:", len(module))

for rid, (pts, y0, y1) in obbs.items():      # Grundriss + Höhenbereich für Karten/UI
    raeume[rid]["grundriss"] = [[round(x, 2), round(z, 2)] for x, z in pts]
    raeume[rid]["hoehe"] = [round(y0, 2), round(y1, 2)]
    raeume[rid]["name"] = NAMEN.get(rid, rid)
for k in korridore:
    k["grundriss"] = [[round(x, 2), round(z, 2)] for x, z in korr_obbs[k["id"]][0]]

plan = {
    "version": 1,
    "beschreibung": "Stadtplan Atlantis: Lage aller Räume, Korridore (ATL-049), Transporter (OBJ-043), Verbindungen. Erzeugt von build/tools/stadtplan.py.",
    "koordinaten": "x = Osten, z = Süden, y = oben, Meter; rotY wie three.js rotation.y; Kompass 0° = Norden",
    "durchmesser": 1300, "wasser_y": WASSER_Y, "deck_y": DECK_Y, "turm_y": TURM_Y, "ebenen_y": EBENE_Y,
    "zonen": ZONEN, "aussenmodule": module, "raeume": list(raeume.values()), "korridore": korridore, "transporter": transporter,
    "verbindungen": verbindungen,
    "spielmarken": {
        "respawn": {"raum": "ATL-001", "pos": [8.0, TURM_Y + 4.6, -10.0], "rotY": math.pi, "hinweis": "Kontrollraum, obere Ebene der Torhalle; nach Sturz ins Wasser"},
        "gate": {"raum": "ATL-001", "objekt": "OBJ-001"},
        "jumper_start": {"raum": "ATL-040"},
        "flug_grenze_radius": 950, "flug_grenze_hoehe": 400,
    },
    "pruefung": {"raumueberschneidungen": konflikte, "korridor_konflikte": korr_konflikte, "nicht_platziert": fehlend},
}
json.dump(plan, open(f"{ROOT}/data/stadtplan.json", "w"), ensure_ascii=False, indent=1)
json.dump(plan, open(f"{ROOT}/data/stadtplan_vor_einpassung.json", "w"), ensure_ascii=False, indent=1)   # Eingabe für stadt_einpassen.py
print(f"Räume {len(raeume)}, Korridorsegmente {len(korridore)}, Transporter {len(transporter)}, Verbindungen {len(verbindungen)}")
print("Überschneidungen:", konflikte)
print("nicht platziert:", fehlend)

# ---- Karten (Draufsicht): ganze Stadt + Innenstadt im Detail
def karte(datei, halb, titel, labels=True, mitte=(0, 0)):
    from PIL import Image, ImageDraw, ImageFont
    S = 1600
    sc = S / (2 * halb)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except Exception:
        font = big = ImageFont.load_default()
    img = Image.new("RGB", (S, S), (14, 30, 48))
    d = ImageDraw.Draw(img)
    P = lambda x, z: (S / 2 + (x - mitte[0]) * sc, S / 2 + (z - mitte[1]) * sc)
    d.ellipse([P(-230, -230), P(230, 230)], fill=(70, 80, 92))
    for zn in ZONEN:
        if zn["art"] != "pier":
            continue
        dx, dz = compass_dir(zn["winkel"]); nx, nz = -dz, dx
        w = zn["breite"] / 2
        pts = [(dx * zn["r_innen"] + nx * w, dz * zn["r_innen"] + nz * w), (dx * zn["r_aussen"] + nx * w * 0.55, dz * zn["r_aussen"] + nz * w * 0.55),
               (dx * (zn["r_aussen"] + 30), dz * (zn["r_aussen"] + 30)),
               (dx * zn["r_aussen"] - nx * w * 0.55, dz * zn["r_aussen"] - nz * w * 0.55), (dx * zn["r_innen"] - nx * w, dz * zn["r_innen"] - nz * w)]
        d.polygon([P(*p) for p in pts], fill=(78, 88, 100))
        lx, lz = dx * min(zn["r_aussen"] - 60, halb * 0.85), dz * min(zn["r_aussen"] - 60, halb * 0.85)
        d.text(P(lx, lz), zn["name"], fill=(200, 215, 230), font=big, anchor="mm")
    d.ellipse([P(-45, -45), P(45, 45)], fill=(110, 125, 140))
    for k in korridore:
        L = k["opts"]["laenge"]; a = k["rotY"]
        x0, z0 = k["pos"][0], k["pos"][2]
        d.line([P(x0, z0), P(x0 + math.sin(a) * L, z0 + math.cos(a) * L)], fill=(120, 200, 255), width=max(2, int(3.6 * sc)))
    for rid, (pts, y0, y1) in obbs.items():
        col = (255, 110, 110) if any(rid in c for c in konflikte) else (235, 190, 120)
        d.polygon([P(*p) for p in pts], outline=col, width=2)
        if labels:
            cx = sum(p[0] for p in pts) / 4; cz = sum(p[1] for p in pts) / 4
            d.text(P(cx, cz), f"{rid[4:]} E{raeume[rid]['ebene']}", fill=(255, 235, 200), font=font, anchor="mm")
    for t in transporter:
        x, _, z = t["pos"]; r = max(3, 1.2 * sc)
        d.ellipse([P(x, z)[0] - r, P(x, z)[1] - r, P(x, z)[0] + r, P(x, z)[1] + r], fill=(120, 255, 160))
    d.text((20, 18), titel, fill=(230, 230, 230), font=big)
    d.text((20, 44), "Räume orange (Nummer + Ebene), Korridore blau, Transporter grün, Konflikte rot", fill=(190, 200, 210), font=font)
    img.save(datei)


try:
    karte(f"{ROOT}/data/stadtplan.png", 700, "Atlantis – Stadtplan, Draufsicht (Norden oben, Ø 1,3 km)", labels=False)
    karte(f"{ROOT}/data/stadtplan_zentrum.png", 140, "Atlantis – Innenstadt und Kontrollturm (Ausschnitt 280 m)")
    karte(f"{ROOT}/data/stadtplan_ost.png", 60, "Ostpier – Labortrakt (Ausschnitt 120 m)", mitte=(285, 0))
    print("Karten: data/stadtplan*.png")
except Exception as e:
    print("Karte nicht erzeugt:", e)

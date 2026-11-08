# Erzeugt build/auftraege_raeume/ATL-xxx/{auftrag.md, auftrag.json, bilder/} aus der Datenbank.
import hashlib, json, os, re, sys, unicodedata, urllib.request
from PIL import Image
API = "http://localhost:8324"; B = "/root/sga/build"; IMG = "/root/sga/assets/images"
masse = json.load(open(f"{B}/orchestrator/objmasse.json"))
objs = {o["id"]: o for o in json.load(urllib.request.urlopen(f"{API}/objects"))["objects"]}
rooms = json.load(urllib.request.urlopen(f"{API}/rooms"))["rooms"]
only = set(sys.argv[1:])
def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\(.*?\)", "", t)
    w = [x for x in re.split(r"[^a-z0-9]+", t) if x and x not in ("the", "of", "and", "s")][:3]
    return "raum_" + "_".join(w)
for r in rooms:
    rid = r["id"]
    if rid == "ATL-049" or (only and rid not in only):
        continue
    d = f"{B}/auftraege_raeume/{rid}"; os.makedirs(f"{d}/bilder", exist_ok=True)
    bilder = []
    imgs = sorted(r.get("images", []), key=lambda im: 0 if not im["file"].startswith("plan_") else 1)   # Screencaps zuerst, dann Pläne
    gesehen = set()   # doppelte Bilddateien (gleicher Inhalt unter anderem Namen) nur einmal verwenden
    for im in imgs:
        if len(bilder) >= 4: break
        src = f"{IMG}/{im['file']}"
        if not os.path.exists(src): continue
        h = hashlib.md5(open(src, "rb").read()).hexdigest()
        if h in gesehen: continue
        gesehen.add(h)
        try:
            x = Image.open(src).convert("RGB"); x.thumbnail((900, 900))
            p = f"bilder/ref{len(bilder)+1}.jpg"; x.save(f"{d}/{p}", quality=85); bilder.append((p, im.get("caption") or ""))
        except Exception as e:
            print("Bildfehler", rid, e)
    zeilen = []
    for oid in r.get("objekte", []):
        o = objs.get(oid); m = masse.get(oid, {})
        mm = " × ".join(f"{v:.2f}" for v in m.get("masse") or []) or "?"
        zeilen.append(f"- `PLACE_{oid}` – {o['name_de'] if o else oid} · Art: {m.get('art') or '?'} · Maße B × H × T: {mm} m")
    name = slug(r.get("name_en") or r["name_de"])
    txt = f"""# Raum-Auftrag {rid}: {r['name_de']}

- **Dateiname:** `{name}.js` (Name `{name}`)
- Englisch: {r.get('name_en') or '—'} · Bereich: {r.get('area') or '—'} · Etage: {r.get('level')} · Kategorie: {r.get('category')} · Quellenklasse: {r.get('status')}

## Beschreibung
{r.get('summary_de') or '—'}

## Größe
{r.get('groesse') or '—'}

## Raumgeometrie
{r.get('raum_geometrie') or '—'}

## Mobiliar laut Beschreibung (NICHT bauen – nur zur Orientierung, wo Dinge stehen)
{chr(10).join('- ' + m for m in r.get('mobiliar', [])) or '—'}

## Objekte – je ein PLACE_-Punkt (mehrfach vorkommende sinnvoll vervielfachen, z. B. Wandleuchten, Türpaneele)
{chr(10).join(zeilen) or '- keine'}

## Referenzbilder
{chr(10).join(f"- `{p}`: {c}" for p, c in bilder) or "- keine (nach Beschreibung und Architektur-Regeln bauen)"}

Hinweis: Setpläne zeigen den Grundriss von oben (Maßstab in Fuß; 10 ft ≈ 3 m). Screencaps zeigen Wände, Licht und Stimmung. Quellenklasse B/C = rekonstruiert/ergänzt → nach Beschreibung im Atlantis-Stil bauen.
"""
    open(f"{d}/auftrag.md", "w").write(txt)
    json.dump({"id": rid, "name": name, "bilder": [p for p, _ in bilder], "objekte": r.get("objekte", [])}, open(f"{d}/auftrag.json", "w"), ensure_ascii=False)
print("Raum-Aufträge:", len([x for x in os.listdir(f"{B}/auftraege_raeume") if x != "ATL-049"]))

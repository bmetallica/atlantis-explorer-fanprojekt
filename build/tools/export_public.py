#!/usr/bin/env python3
"""Erzeugt den öffentlichen Stand „Atlantis Explorer – Fanprojekt“ in einem eigenen Ordner (Standard: /root/atlantis-explorer).

Nur eine feste Liste von Dateien wird kopiert (Spiel, Server, Daten, Werkzeuge, Doku). Nicht enthalten sind u. a.:
API-Schlüssel (build/orchestrator/secrets, *.env), Serienbilder (assets/images, Bildverweise in rooms.json, Auftragsordner mit
Referenzbildern), die STL-Vorlagen (material/), Zwischenstände, Logs, Caches. Zum Schluss wird der Ordner auf Schlüssel,
Tokens und die private E-Mail-Adresse durchsucht – bei einem Treffer bricht das Skript ab.
Aufruf:  python3 build/tools/export_public.py [ZIELORDNER]
"""
import json, os, re, shutil, sys
from pathlib import Path

QUELLE = Path("/root/sga")
ZIEL = Path(sys.argv[1] if len(sys.argv) > 1 else "/root/atlantis-explorer")
BILDER = Path(os.environ.get("EXPORT_BILDER", ""))        # README-Bilder (docs/bilder)

DATEIEN = [
    "Dockerfile", "docker-compose.yml",
    "src/app.py", "src/requirements.txt",
    "data/stadtplan.json", "data/stadtplan_vor_einpassung.json", "data/raumdaten.json", "data/sources.json",
    "data/stadtplan_einpassung.png", "data/stadtplan_hoehen.png",
    "data/stadt/aussen/atlantis_voll.glb", "data/stadt/aussen/atlantis_fern.glb",
    "data/stadt/aussen/meta.json", "data/stadt/aussen/raumquader.json",
    "build/ANLEITUNG.md", "build/ANLEITUNG_RAUM.md", "build/ANLEITUNG_SPIEL.md", "build/ARCHITEKTUR.md", "build/OBJEKTE.md",
    "build/orchestrator/build.py", "build/orchestrator/auftraege.py", "build/orchestrator/auftraege_raeume.py",
    "build/orchestrator/nacharbeit.sh", "build/orchestrator/objmasse.mjs",
]
ORDNER = ["src/game", "src/ui", "data/models"] + [f"data/stadt/STA-00{i}" for i in range(1, 9)]
WERKZEUGE = ["stadtplan.py", "stadt_einpassen.py", "stadt_kacheln.py", "stadt_stl.py", "jumper_stl.py", "jumper_vorlage.js",
             "spiel_test.mjs", "render.mjs", "render.html", "pruefen.mjs", "raumdaten.mjs", "raumdaten.html",
             "bodencheck.mjs", "bodencheck.html", "streaming.mjs", "streaming.html", "package.json", "package-lock.json",
             "export_public.py"]

if ZIEL.exists():
    for e in ZIEL.iterdir():               # .git und vom Nutzer gepflegte Dateien behalten
        if e.name in (".git",):
            continue
        shutil.rmtree(e) if e.is_dir() else e.unlink()
ZIEL.mkdir(parents=True, exist_ok=True)

def kopieren(rel):
    q, z = QUELLE / rel, ZIEL / rel
    z.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(q, z)

for d in DATEIEN:
    kopieren(d)
for o in ORDNER:
    shutil.copytree(QUELLE / o, ZIEL / o, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
for w in WERKZEUGE:
    kopieren("build/tools/" + w)

# Datenbank ohne Bildverweise (Serien-Screenshots)
db = json.load(open(QUELLE / "data/rooms.json"))
for liste in (db.get("rooms", []), db.get("objects", [])):
    for e in liste:
        e["images"] = []
(ZIEL / "data/rooms.json").write_text(json.dumps(db, ensure_ascii=False, indent=1))
(ZIEL / "assets/images").mkdir(parents=True, exist_ok=True)
(ZIEL / "assets/images/.gitkeep").write_text("")

# README-Bilder und Begleitdateien
if BILDER and BILDER.is_dir():
    shutil.copytree(BILDER, ZIEL / "docs/bilder")
for name in ("README.md", "CREDITS.md", "LICENSE", ".gitignore"):
    q = QUELLE / "build/public" / name
    if q.exists():
        shutil.copy2(q, ZIEL / name)

# Prüfung: keine Schlüssel, Tokens oder privaten Adressen
MUSTER = re.compile(rb"nvapi-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|bmetallica2@googlemail\.com")
treffer = []
for p in ZIEL.rglob("*"):
    if p.is_file() and ".git" not in p.parts and p.stat().st_size < 50_000_000:
        if MUSTER.search(p.read_bytes()):
            treffer.append(str(p.relative_to(ZIEL)))
if treffer:
    sys.exit("ABBRUCH – mögliche Geheimnisse gefunden in: " + ", ".join(treffer))
groesse = sum(p.stat().st_size for p in ZIEL.rglob("*") if p.is_file() and ".git" not in p.parts)
print(f"Export fertig: {ZIEL}  ({groesse / 1e6:.1f} MB, keine Geheimnisse gefunden)")

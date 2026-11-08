"""
Stargate Atlantis — Raumdatenbank API
=====================================
FastAPI-Web-App (Port 8324) mit:
  * Lese-Endpoints  : /rooms, /rooms/{id}, /sources, /images/...
  * Edit-Endpoints  : POST/PUT/PATCH/DELETE /rooms, /rooms/{id}/images, /meta, /sources
  * Persistenz      : data/rooms.json + data/sources.json (atomares Schreiben)
  * Bilder          : assets/images/ (static files, Upload, Download von URLs)

Start:  uvicorn app:app --host 0.0.0.0 --port 8324
"""

import json
import os
import re
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Konfiguration
# --------------------------------------------------------------------------
DATA_DIR = Path(os.environ.get("SGA_DATA_DIR", "/app/data"))
IMAGES_DIR = Path(os.environ.get("SGA_IMAGES_DIR", "/app/images"))
ROOMS_FILE = DATA_DIR / "rooms.json"
SOURCES_FILE = DATA_DIR / "sources.json"
BACKUP_DIR = DATA_DIR / "backups"
MODELS_DIR = DATA_DIR / "models"   # 3D-Modelle: data/models/<OBJ-ID>/<name>.<js|glb>
UI_FILE = Path(__file__).resolve().parent / "ui" / "index.html"

VALID_STATUSES = {"A", "B", "C"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"}
# Spielobjekte (siehe infos/OBJEKTE.md): Code-Objekt (.js, ES-Modul mit create()) oder Modell (.glb)
MODEL_FORMATS = {".js": "js", ".glb": "glb"}
MODEL_MEDIA_TYPES = {"js": "text/javascript; charset=utf-8", "glb": "model/gltf-binary"}
MODEL_MAX_BYTES = 16 * 1024 * 1024

# Browser-artige Header für den Bild-Download (Fandom-CDN + MediaWiki-API).
_BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"
_BROWSER_ACCEPT = "image/avif,image/webp,*/*"

_lock = threading.Lock()

app = FastAPI(
    title="Stargate Atlantis — Raumdatenbank API",
    version="1.0",
    description=(
        "REST-API für alle Räume der Stadt-Schiff Atlantis: "
        "Raumliste, Raumdetails, Bilder, Quellenkatalog und Editier-Endpoints "
        "für KI-Agenten (Beschreibungen anpassen, Bilder hinzufügen, neue Räume anlegen)."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _spiel_nicht_zwischenspeichern(request, call_next):
    """Spieldateien (ES-Module) ändern sich laufend: Browser muss jedes Mal nachfragen (ETag → 304, kein Altstand)."""
    antwort = await call_next(request)
    if request.url.path.startswith(("/spiel", "/models/", "/stadt/")):
        antwort.headers["Cache-Control"] = "no-cache"
    return antwort


# --------------------------------------------------------------------------
# Datenhaltung (in-memory + atomare Persistenz)
# --------------------------------------------------------------------------
def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict) -> None:
    """Atomares Schreiben: tmp-Datei + rename (keine korrupten Zustände)."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, path)


def _now_ts() -> str:
    return _now()


# In-memory-Zustand (wird bei Start geladen, bei /reload neu geladen)
ROOMS: dict[str, Any] = _load_json(ROOMS_FILE)
SOURCES: dict[str, Any] = _load_json(SOURCES_FILE)
# Objects liegen in rooms.json unter dem Top-Level-Schlüssel "objects"
ROOMS.setdefault("objects", [])

ROOMS_FILE.stat()  # sicherstellen, dass beide Dateien existierten (wurde oben geladen)


def _find_room(room_id: str) -> Optional[dict]:
    for room in ROOMS["rooms"]:
        if room["id"] == room_id:
            return room
    return None


def _persist_rooms() -> None:
    ROOMS["meta"]["last_modified"] = _now_ts()
    _save_json(ROOMS_FILE, ROOMS)


def _persist_sources() -> None:
    _save_json(SOURCES_FILE, SOURCES)


def _next_room_id() -> str:
    max_n = 0
    for room in ROOMS["rooms"]:
        m = re.fullmatch(r"ATL-(\d+)", room["id"])
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f"ATL-{max_n + 1:03d}"


def _find_object(obj_id: str) -> Optional[dict]:
    for obj in ROOMS.get("objects", []):
        if obj["id"] == obj_id:
            return obj
    return None


def _next_object_id() -> str:
    max_n = 0
    for obj in ROOMS.get("objects", []):
        m = re.fullmatch(r"OBJ-(\d+)", obj["id"])
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f"OBJ-{max_n + 1:03d}"


def _image_url(filename: str) -> str:
    host = os.environ.get("SGA_PUBLIC_HOST", "localhost:8324")
    return f"http://{host}/images/{filename}"


# --------------------------------------------------------------------------
# Pydantic-Modelle
# --------------------------------------------------------------------------
class ImageEntry(BaseModel):
    file: str = Field(..., description="Dateiname in assets/images (z.B. plan_control-room.jpg)")
    caption: Optional[str] = Field(None, description="Deutsche Bildunterschrift")
    source: Optional[str] = Field(None, description="Quellen-URL oder Quellenname")


class Room(BaseModel):
    id: str
    name_de: str
    name_en: str
    category: str
    level: int
    area: str
    status: str = Field(..., description="Quellenklasse: A=BELEGT, B=REKONSTRUIERT, C=ERGÄNZT")
    episodes: list[str]
    summary_de: str
    plan_ref: Optional[str] = None
    images: list[ImageEntry] = Field(default_factory=list)
    groesse: Optional[str] = Field(None, description="Größe/Bemessung des Raums (frei formuliert)")
    raum_geometrie: Optional[str] = Field(None, description="Raumgeometrie: Grundriss, Form, Anordnung, Verbindungen")
    mobiliar: list[str] = Field(default_factory=list, description="Möbel und Einrichtung (Tische, Stühle, Regale, Konsolen, ...)")
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    objekte: list[str] = Field(default_factory=list, description="Objekt-IDs (OBJ-NNN), die in diesem Raum vorhanden sind")
    updated_at: Optional[str] = None


class Object(BaseModel):
    """Einzelnes Objekt (z. B. Stargate, DHD, Kontrollstuhl)."""
    id: str
    name_de: str
    name_en: Optional[str] = None
    beschaffenheit: str = Field(..., description="Zustand / Beschaffenheit des Objekts")
    ausssehen: str = Field(..., description="Optisches Erscheinungsbild")
    funktion: str = Field(
        ..., description="Funktion / Zweck des Objekts")
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    images: list[ImageEntry] = Field(default_factory=list, description="Bilder des Objekts")


class RoomCreate(BaseModel):
    """Neuen Raum anlegen. id optional (wird dann ATL-NNN vergeben)."""
    id: Optional[str] = None
    name_de: str
    name_en: str
    category: str
    level: int = Field(..., ge=0, le=6)
    area: str
    status: str
    episodes: list[str] = Field(default_factory=list)
    summary_de: str = ""
    plan_ref: Optional[str] = None
    images: list[ImageEntry] = Field(default_factory=list)
    groesse: Optional[str] = None
    raum_geometrie: Optional[str] = None
    mobiliar: list[str] = Field(default_factory=list)
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    objekte: list[str] = Field(default_factory=list)


class RoomUpdate(BaseModel):
    """Teilweise Aktualisierung (PATCH): nur die mitgegebenen Felder werden geändert."""
    name_de: Optional[str] = None
    name_en: Optional[str] = None
    category: Optional[str] = None
    level: Optional[int] = Field(None, ge=0, le=6)
    area: Optional[str] = None
    status: Optional[str] = None
    episodes: Optional[list[str]] = None
    summary_de: Optional[str] = None
    plan_ref: Optional[str] = None
    images: Optional[list[ImageEntry]] = None
    groesse: Optional[str] = None
    raum_geometrie: Optional[str] = None
    mobiliar: Optional[list[str]] = None
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    objekte: Optional[list[str]] = None


class RoomReplace(BaseModel):
    """Vollständiger Ersatz (PUT): id bleibt unverändert, alle anderen Felder sind Pflicht."""
    name_de: str
    name_en: str
    category: str
    level: int = Field(..., ge=0, le=6)
    area: str
    status: str
    episodes: list[str]
    summary_de: str
    plan_ref: Optional[str] = None
    images: list[ImageEntry] = Field(default_factory=list)
    groesse: Optional[str] = None
    raum_geometrie: Optional[str] = None
    mobiliar: list[str] = Field(default_factory=list)
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    objekte: list[str] = Field(default_factory=list)


class AddImageBody(BaseModel):
    """Bild zu einem Raum hinzufügen: URL (wird heruntergeladen) und/oder Datei (bereits vorhanden)."""
    url: Optional[str] = Field(None, description="URL des Bildes, wird nach assets/images/ heruntergeladen")
    file: Optional[str] = Field(None, description="Dateiname, der bereits in assets/images/ liegt")
    caption: Optional[str] = None
    source: Optional[str] = None


class MetaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None


class SourceCreate(BaseModel):
    name: str
    url: str
    category: str
    type: str = ""
    note: str = ""
    id: Optional[str] = None


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    note: Optional[str] = None


class ObjectCreate(BaseModel):
    """Neues Objekt anlegen. id optional (wird dann OBJ-NNN vergeben)."""
    id: Optional[str] = None
    name_de: str
    name_en: Optional[str] = None
    beschaffenheit: str
    ausssehen: str
    funktion: str
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    images: list[ImageEntry] = Field(default_factory=list)


class ObjectUpdate(BaseModel):
    """Teilweise Aktualisierung eines Objekts (PATCH)."""
    name_de: Optional[str] = None
    name_en: Optional[str] = None
    beschaffenheit: Optional[str] = None
    ausssehen: Optional[str] = None
    funktion: Optional[str] = None
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    images: Optional[list[ImageEntry]] = None


class ObjectReplace(BaseModel):
    """Vollständiger Ersatz eines Objekts (PUT)."""
    name_de: str
    name_en: Optional[str] = None
    beschaffenheit: str
    ausssehen: str
    funktion: str
    einbau: Optional[str] = Field(None, description="Einbau ins Spiel: Datei, Platzierung, b.prop()-Aufruf, Aktionen, Hinweise (Text/Markdown)")
    images: list[ImageEntry] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Hilfsfunktionen
# --------------------------------------------------------------------------
def _safe_image_path(filename: str) -> Path:
    """Pfad aus Dateiname, mit Schutz vor Path-Traversal."""
    p = (IMAGES_DIR / filename).resolve()
    if not str(p).startswith(str(IMAGES_DIR.resolve())) or not p.is_file():
        raise HTTPException(status_code=404, detail=f"Bild '{filename}' nicht gefunden")
    return p


def _validate_room_fields(payload: dict[str, Any]) -> None:
    """Gemeinsame Validierung der Raumdaten."""
    if payload.get("status") is not None and payload["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status muss A, B oder C sein (erhalten: {payload['status']})")
    if payload.get("episodes") is not None and not all(isinstance(e, str) for e in payload["episodes"]):
        raise HTTPException(status_code=422, detail="episodes muss eine Liste von Strings sein")
    if payload.get("images") is not None:
        for img in payload["images"]:
            if not img.get("file"):
                raise HTTPException(status_code=422, detail="Jedes Bild braucht ein 'file' (Dateiname in assets/images)")
            if not (IMAGES_DIR / img["file"]).is_file():
                raise HTTPException(status_code=422, detail=f"Bilddatei '{img['file']}' liegt nicht in assets/images")
    if payload.get("objekte") is not None and not all(isinstance(e, str) for e in payload["objekte"]):
        raise HTTPException(status_code=422, detail="objekte muss eine Liste von Objekt-IDs (Strings) sein")
    if payload.get("objekte") is not None:
        for oid in payload["objekte"]:
            if _find_object(oid) is None:
                raise HTTPException(status_code=422, detail=f"Objekt '{oid}' existiert nicht in der Objects-Kollektion")


def _detect_ext(content: bytes) -> Optional[str]:
    """Echte Dateityp-Erkennung über Magic Bytes (CDN liefert je nach Accept-Header
    oft WebP/AVIF, auch wenn die URL .jpg sagt)."""
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return ".webp"
    if content[:4] == b"AVIF":
        raise HTTPException(status_code=415, detail="AVIF-Dateien werden nicht unterstützt")
    if content[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if content[:4] == b"\x89PNG":
        return ".png"
    if content[:4] == b"GIF8":
        return ".gif"
    if content[:4] == b"\x00\x00\x01\x00":
        return ".tiff"
    if content[:2] == b"BM":
        return ".bmp"
    return None


def _resolve_fandom_url(url: str) -> str:
    """
    Fandom-Wiki-Datei-URLs auflösen.

    URLs wie  https://<wiki>.fandom.com/wiki/Special:Redirect/file/X.JPG
    oder       https://<wiki>.fandom.com/wiki/File:X.JPG
    liegen hinter Cloudflare und liefern ohne echten Browser 403. Stattdessen
    wird über die MediaWiki-API das direkte CDN-URL (static.wikia.nocookie.net/...)
    ermittelt, das der Downloader mit Browser-Headern erfolgreich abruft.
    """
    from urllib.parse import urlparse, unquote, quote

    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    if "fandom.com" not in host:
        return url

    path = parsed.path
    low = path.lower()
    # Nur Datei-Redirect-URLs auflösen (keine normalen Wiki-Seiten).
    if low.startswith("/wiki/special:redirect/file/"):
        name = path[len("/wiki/special:redirect/file/"):]
    elif low.startswith("/wiki/special:file/"):
        name = path[len("/wiki/special:file/"):]
    elif "/wiki/file:" in low:
        name = path[low.index("/wiki/file:") + len("/wiki/file:"):]
    else:
        return url

    name = unquote(name)
    if not name:
        return url

    api = (
        f"https://{host}/api.php?action=query&titles=File:{quote(name, safe='')}"
        "&prop=imageinfo&iiprop=url&format=json"
    )
    try:
        with httpx.Client(timeout=30, follow_redirects=True, headers={"User-Agent": _BROWSER_UA}) as client:
            resp = client.get(api)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Fandom-API-Abfrage fehlgeschlagen: {exc}")

    for page in data.get("query", {}).get("pages", {}).values():
        for info in page.get("imageinfo", []):
            if info.get("url"):
                return info["url"]
    raise HTTPException(status_code=422, detail=f"Fandom-Datei '{name}' in der Wiki-API nicht gefunden")


def _download_image(url: str) -> str:
    """Bild-URL herunterladen und in IMAGES_DIR ablegen. Liefert Dateinamen."""
    if not re.match(r"^https?://", url):
        raise HTTPException(status_code=400, detail="url muss mit http:// oder https:// beginnen")
    from urllib.parse import urlparse

    # Fandom-Wiki-Datei-URLs zuerst auf das direkte CDN-URL auflösen (sonst 403).
    url = _resolve_fandom_url(url)
    parsed = urlparse(url)
    try:
        with httpx.Client(
            timeout=60,
            follow_redirects=True,
            headers={
                "User-Agent": _BROWSER_UA,
                "Accept": _BROWSER_ACCEPT,
                # Fandom-CDN (static.wikia.nocookie.net) prüft den Referer:
                # Es muss eine Wiki-Seite sein, sonst 403.
                "Referer": os.environ.get("SGA_DOWNLOAD_REFERER", "https://stargate.fandom.com/"),
            },
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=422, detail=f"Download fehlgeschlagen: {exc}")

    content_type = resp.headers.get("content-type", "").lower()
    if not content_type.startswith("image/") and content_type != "application/octet-stream":
        raise HTTPException(status_code=415, detail=f"Kein Bild-Content-Type: {content_type}")

    # Dateinamen aus URL ableiten (letzte Pfadstufe mit Bild-Endung)
    path = parsed.path
    segments = [s for s in path.split("/") if s]
    name = ""
    for s in reversed(segments):
        if Path(s).suffix.lower() in ALLOWED_EXTENSIONS:
            name = s
            break
    if not name:
        name = segments[-1] if segments else ""
        name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    if not name:
        name = f"image-{int(datetime.now(timezone.utc).timestamp())}"
    ext = Path(name).suffix.lower()
    # Echte Endung aus den Bytes ableiten (CDN liefert z.B. WebP trotz .jpg-URL)
    detected = _detect_ext(resp.content)
    if detected and detected != ext:
        name = Path(name).stem + detected
        ext = detected
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
        name = Path(name).stem + ext
    # Kollisionen vermeiden
    target = IMAGES_DIR / name
    counter = 1
    while target.exists():
        target = IMAGES_DIR / f"{Path(name).stem}-{counter}{ext}"
        counter += 1
    target.write_bytes(resp.content)
    return target.name


# --------------------------------------------------------------------------
# Lese-Endpoints
# --------------------------------------------------------------------------
@app.get("/health", tags=["System"])
def health():
    with _lock:
        n_rooms = len(ROOMS["rooms"])
    n_images = len(list(IMAGES_DIR.glob("*.jpg")) + list(IMAGES_DIR.glob("*.png")) + list(IMAGES_DIR.glob("*.webp")))
    return {
        "status": "ok",
        "rooms": n_rooms,
        "images": n_images,
        "version": ROOMS["meta"].get("version"),
        "time": _now_ts(),
    }


@app.get("/", tags=["Übersicht"])
def overview():
    """Allgemeine Beschreibung + Statistiken der Datenbank."""
    with _lock:
        meta = dict(ROOMS["meta"])
        rooms = ROOMS["rooms"]

    by_category: dict[str, int] = {}
    by_area: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for r in rooms:
        by_category[r["category"]] = by_category.get(r["category"], 0) + 1
        by_area[r["area"]] = by_area.get(r["area"], 0) + 1
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1

    return {
        "title": meta.get("title"),
        "description": meta.get("description"),
        "version": meta.get("version"),
        "last_modified": meta.get("last_modified"),
        "rooms_total": len(rooms),
        "by_category": by_category,
        "by_area": by_area,
        "by_status": by_status,
        "categories": SOURCES["categories"],
    }


@app.get("/meta", tags=["Übersicht"])
def meta():
    with _lock:
        return ROOMS["meta"] | {"categories": SOURCES["categories"]}


@app.get("/rooms", tags=["Räume"])
def list_rooms(
    category: Optional[str] = Query(None, description="Filter nach Kategorie (command, medical, science, ...)"),
    area: Optional[str] = Query(None, description="Filter nach Area (Control Tower, Inner City, ...)"),
    level: Optional[int] = Query(None, ge=0, le=6, description="Filter nach Etage"),
    status: Optional[str] = Query(None, pattern="^[ABC]$", description="Filter nach Quellenklasse A/B/C"),
    q: Optional[str] = Query(None, description="Textsuche in name_de/name_en/summary_de"),
):
    """Raumliste (48 Räume). Optional filterbar."""
    with _lock:
        rooms = ROOMS["rooms"]

    result = []
    for r in rooms:
        if category and r["category"] != category:
            continue
        if area and r["area"].lower() != area.lower():
            continue
        if level is not None and r["level"] != level:
            continue
        if status and r["status"] != status:
            continue
        if q:
            needle = q.lower()
            haystack = f"{r['name_de']} {r['name_en']} {r['summary_de']} {r['id']}".lower()
            if needle not in haystack:
                continue
        result.append({**r, "models": _models_with_urls(r, "rooms")} if r.get("models") else r)
    return {"count": len(result), "rooms": result}


@app.get("/rooms/{room_id}", tags=["Räume"])
def get_room(room_id: str):
    """Details eines Raums inkl. Bilder und aufgelöster Objekte."""
    with _lock:
        room = _find_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
    out = dict(room)
    out["images"] = [
        {**img, "url": _image_url(img["file"])} for img in room.get("images", [])
    ]
    out["models"] = _models_with_urls(room, "rooms")
    # Objekte auflösen: IDs → volle Daten
    out["objekte_detail"] = [
        _find_object(oid) for oid in room.get("objekte", []) if _find_object(oid) is not None
    ]
    out["stadtplan"] = _stadtplan_raum(room_id)
    return out


# --------------------------------------------------------------------------
# Stadtplan (data/stadtplan.json, erzeugt von build/tools/stadtplan.py)
STADTPLAN_FILE = DATA_DIR / "stadtplan.json"
STADTPLAN_KARTEN = {"gesamt": "stadtplan_einpassung.png", "hoehen": "stadtplan_hoehen.png"}


def _load_stadtplan() -> dict:
    if not STADTPLAN_FILE.is_file():
        raise HTTPException(status_code=404, detail="Stadtplan noch nicht erzeugt")
    return json.loads(STADTPLAN_FILE.read_text(encoding="utf-8"))


def _stadtplan_raum(room_id: str) -> Optional[dict]:
    """Lage eines Raums in der Stadt + alle Verbindungen, an denen er beteiligt ist (None ohne Plan)."""
    if not STADTPLAN_FILE.is_file():
        return None
    plan = json.loads(STADTPLAN_FILE.read_text(encoding="utf-8"))
    lage = next((r for r in plan["raeume"] if r["id"] == room_id), None)
    if lage is None:
        return None
    korr_ids = {k["id"] for k in plan["korridore"] if k["trakt"] == lage["trakt"]}
    verb = [v for v in plan["verbindungen"]
            if room_id in (v.get("a", {}).get("raum"), v.get("b", {}).get("raum"))]
    nachbarn = sorted({r["id"] for r in plan["raeume"] if r["trakt"] == lage["trakt"] and r["id"] != room_id})
    zone = next((z for z in plan["zonen"] if z["id"] == lage["zone"]), {})
    return {**lage, "zone_name": zone.get("name", lage["zone"]), "verbindungen": verb,
            "trakt_nachbarn": nachbarn, "trakt_korridore": len(korr_ids)}


@app.get("/stadtplan", tags=["Stadtplan"])
def get_stadtplan(zone: Optional[str] = Query(None, description="nur Räume/Korridore dieser Zone, z. B. ostpier")):
    """Stadtplan von Atlantis: Zonen, Lage aller Räume (Position, Drehung, Grundriss), Korridore,
    Transporter, Verbindungen und Spielmarken (Respawn, Flug-Grenze). Koordinaten in Metern."""
    plan = _load_stadtplan()
    if zone:
        plan["raeume"] = [r for r in plan["raeume"] if r["zone"] == zone]
        trakte = {r["trakt"] for r in plan["raeume"]}
        plan["korridore"] = [k for k in plan["korridore"] if k["trakt"] in trakte]
        plan["transporter"] = [t for t in plan["transporter"] if t["trakt"] in trakte]
    return plan


@app.get("/stadtplan/raeume/{room_id}", tags=["Stadtplan"])
def get_stadtplan_raum(room_id: str):
    """Lage eines Raums in der Stadt mit seinen Verbindungen und Nachbarn im selben Trakt."""
    _load_stadtplan()
    lage = _stadtplan_raum(room_id)
    if lage is None:
        raise HTTPException(status_code=404, detail=f"Raum '{room_id}' ist nicht im Stadtplan")
    return lage


STADT_DIR = DATA_DIR / "stadt"   # Außenmodule: data/stadt/<STA-ID>/<name>.js


@app.get("/stadt/module", tags=["Stadtplan"])
def list_stadt_module():
    """Fertige Außenmodule der Stadt (Turm, Insel, Piers, Gebäude) mit Download-URL."""
    out = []
    if STADT_DIR.is_dir():
        for d in sorted(STADT_DIR.iterdir()):
            f = next((x for x in d.glob("*.js")), None) if d.is_dir() else None
            if f:
                out.append({"id": d.name, "name": f.stem, "url": f"/stadt/module/{d.name}.js",
                            "size": f.stat().st_size, "updated_at": datetime.fromtimestamp(f.stat().st_mtime, timezone.utc).isoformat()})
    return {"count": len(out), "module": out}


@app.get("/stadt/module/{mid}.js", tags=["Stadtplan"])
def get_stadt_modul(mid: str):
    """JS-Modul eines Außenmoduls (export function create())."""
    if not re.fullmatch(r"STA-\d{3}", mid):
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    f = next(((STADT_DIR / mid).glob("*.js")), None) if (STADT_DIR / mid).is_dir() else None
    if not f:
        raise HTTPException(status_code=404, detail=f"Modul {mid} noch nicht fertig")
    return FileResponse(f, media_type="text/javascript; charset=utf-8", headers={"Cache-Control": "no-cache"})


@app.get("/stadt/aussen/{datei}", tags=["Stadtplan"])
def get_stadt_aussen(datei: str):
    """Außenhülle der Stadt aus der STL-Vorlage (GLB je Detailstufe) und meta.json mit der Transformation."""
    if not re.fullmatch(r"[a-z0-9_]+\.(glb|json)", datei):
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    f = STADT_DIR / "aussen" / datei
    if not f.is_file():
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return FileResponse(f, media_type="model/gltf-binary" if datei.endswith(".glb") else "application/json")


@app.get("/ui/stadt", response_class=HTMLResponse, tags=["Browser-UI"])
def ui_stadt():
    """3D-Ansicht der ganzen Stadt (Außenmodule nach Stadtplan, Wasser, Himmel)."""
    path = UI_FILE.parent / "stadt.html"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return HTMLResponse(path.read_text(encoding="utf-8"))


@app.get("/stadtplan/karte/{ausschnitt}", tags=["Stadtplan"])
def get_stadtplan_karte(ausschnitt: str):
    """Kartenbild (PNG): gesamt (Räume auf dem Höhenbild der Stadt-Vorlage) oder hoehen (nur Höhenbild, −700 … 700 m)."""
    f = STADTPLAN_KARTEN.get(ausschnitt)
    if not f or not (DATA_DIR / f).is_file():
        raise HTTPException(status_code=404, detail=f"Karte '{ausschnitt}' nicht vorhanden ({', '.join(STADTPLAN_KARTEN)})")
    return FileResponse(DATA_DIR / f, media_type="image/png", headers={"Cache-Control": "no-cache"})


@app.get("/rooms/{room_id}/images", tags=["Räume"])
def get_room_images(room_id: str):
    """Bilder eines Raums mit vollen URLs."""
    with _lock:
        room = _find_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
    images = [
        {**img, "url": _image_url(img["file"])} for img in room.get("images", [])
    ]
    return {"room": room_id, "count": len(images), "images": images}


@app.get("/images", tags=["Bilder"])
def list_images():
    """Alle Bilddateien in assets/images (inkl. URL)."""
    images = []
    for p in sorted(IMAGES_DIR.iterdir()):
        if p.is_file() and p.suffix.lower() in ALLOWED_EXTENSIONS:
            images.append({"file": p.name, "url": _image_url(p.name), "size": p.stat().st_size})
    return {"count": len(images), "images": images}


@app.get("/images/{filename}", tags=["Bilder"])
def get_image(filename: str):
    """Die Bilddatei selbst liefern (JPEG/PNG/WebP/...)."""
    p = _safe_image_path(filename)
    media_type = "image/jpeg" if p.suffix.lower() in {".jpg", ".jpeg"} else (
        "image/png" if p.suffix.lower() == ".png" else "image/webp"
    )
    return FileResponse(p, media_type=media_type)


@app.get("/episodes", tags=["Übersicht"])
def list_episodes():
    """Alle in der Datenbank referenzierten Episoden (entschärft, sortiert)."""
    with _lock:
        eps = sorted({e for r in ROOMS["rooms"] for e in r["episodes"]})
    return {"count": len(eps), "episodes": eps}


@app.get("/sources", tags=["Quellen"])
def list_sources():
    """Quellenkatalog mit Zuverlässigkeitsklassen."""
    with _lock:
        return SOURCES


@app.get("/sources/{source_id}", tags=["Quellen"])
def get_source(source_id: str):
    with _lock:
        for s in SOURCES["sources"]:
            if s["id"] == source_id:
                return s
    raise HTTPException(status_code=404, detail=f"Quelle '{source_id}' nicht gefunden")


# --------------------------------------------------------------------------
# Browser-UI (verbraucht die JSON-API, keine eigene Logik)
# --------------------------------------------------------------------------
@app.get("/ui", response_class=HTMLResponse, tags=["Browser-UI"])
@app.get("/ui/", response_class=HTMLResponse, tags=["Browser-UI"])
def ui_index():
    """Statische Browser-UI: Raumliste, -details und Bilder.

    Öffnet im Browser: http://localhost:8324/ui
    Einzelraum direkt aufrufbar: http://localhost:8324/ui/#raum/ATL-009
    """
    if not UI_FILE.is_file():
        raise HTTPException(status_code=404, detail="UI-Datei nicht gefunden")
    return HTMLResponse(UI_FILE.read_text(encoding="utf-8"))


GAME_DIR = Path(__file__).resolve().parent / "game"


@app.get("/spiel", include_in_schema=False)
def spiel_redirect():
    return RedirectResponse("/spiel/")


if GAME_DIR.is_dir():
    # Das Spiel: statische ES-Module (src/game), Start unter /spiel/
    app.mount("/spiel", StaticFiles(directory=GAME_DIR, html=True), name="spiel")


@app.get("/ui/messtest", response_class=HTMLResponse, tags=["Browser-UI"])
def ui_messtest():
    """Leistungstest für die Spielplanung: misst Bildrate und Renderzeit auf der GPU des Besuchers.

    Öffnet im Browser: http://localhost:8324/ui/messtest
    """
    path = UI_FILE.parent / "messtest.html"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return HTMLResponse(path.read_text(encoding="utf-8"))


MESSTEST_DIR = DATA_DIR / "messtest"


@app.post("/messtest", status_code=201, tags=["Browser-UI"])
async def save_messtest(request: Request):
    """Ergebnis eines Leistungstests speichern (data/messtest/<zeit>.json)."""
    body = await request.body()
    if len(body) > 200_000:
        raise HTTPException(status_code=413, detail="Zu groß")
    try:
        data = json.loads(body)
    except ValueError:
        raise HTTPException(status_code=400, detail="Kein JSON")
    MESSTEST_DIR.mkdir(parents=True, exist_ok=True)
    name = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json"
    (MESSTEST_DIR / name).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return {"saved": name}


@app.get("/messtest", tags=["Browser-UI"])
def list_messtest():
    """Gespeicherte Leistungstests, neueste zuerst."""
    if not MESSTEST_DIR.is_dir():
        return {"count": 0, "results": []}
    files = sorted(MESSTEST_DIR.glob("*.json"), reverse=True)
    return {"count": len(files), "results": [json.loads(f.read_text(encoding="utf-8")) for f in files]}


@app.get("/ui/{asset}.js", tags=["Browser-UI"])
def ui_script(asset: str):
    """Zusätzliche UI-Skripte (z. B. viewer.js für den 3D-Objekt-Viewer)."""
    if not re.fullmatch(r"[a-z0-9_-]+", asset):
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    path = UI_FILE.parent / f"{asset}.js"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    return FileResponse(path, media_type="text/javascript; charset=utf-8", headers={"Cache-Control": "no-cache"})


# --------------------------------------------------------------------------
# Edit-Endpoints: Räume
# --------------------------------------------------------------------------
@app.post("/rooms", status_code=201, tags=["Edit: Räume"])
def create_room(body: RoomCreate):
    """Neuen Raum anlegen. id wird automatisch vergeben, wenn nicht angegeben."""
    payload = body.model_dump()
    with _lock:
        if payload["id"] is None:
            payload["id"] = _next_room_id()
        if _find_room(payload["id"]) is not None:
            raise HTTPException(status_code=409, detail=f"Raum '{payload['id']}' existiert bereits")
        _validate_room_fields(payload)
        room = payload | {"updated_at": _now_ts()}
        ROOMS["rooms"].append(room)
        _persist_rooms()
    return room


@app.put("/rooms/{room_id}", tags=["Edit: Räume"])
def replace_room(room_id: str, body: RoomReplace):
    """Raum komplett ersetzen (id bleibt unverändert)."""
    payload = body.model_dump()
    with _lock:
        room = _find_room(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        _validate_room_fields(payload)
        models = room.get("models")
        room.clear()
        room.update(payload | {"id": room_id, "updated_at": _now_ts()})
        if models:
            room["models"] = models
        _persist_rooms()
    return room


@app.patch("/rooms/{room_id}", tags=["Edit: Räume"])
def update_room(room_id: str, body: RoomUpdate):
    """
    Teilweise Aktualisierung: nur die mitgegebenen Felder werden geändert,
    alle übrigen bleiben unverändert. 'updated_at' wird automatisch gesetzt.
    """
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(status_code=400, detail="Keine Felder zum Aktualisieren übergeben")
    with _lock:
        room = _find_room(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        _validate_room_fields(changes)
        room.update(changes)
        room["updated_at"] = _now_ts()
        _persist_rooms()
    return room


@app.delete("/rooms/{room_id}", tags=["Edit: Räume"])
def delete_room(room_id: str):
    """Raum endgültig löschen (inkl. Persistenz)."""
    with _lock:
        room = _find_room(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        ROOMS["rooms"] = [r for r in ROOMS["rooms"] if r["id"] != room_id]
        shutil.rmtree(MODELS_DIR / room_id, ignore_errors=True)
        _persist_rooms()
    return {"deleted": room_id}


# --------------------------------------------------------------------------
# Edit-Endpoints: Bilder
# --------------------------------------------------------------------------
@app.post("/rooms/{room_id}/images", status_code=201, tags=["Edit: Bilder"])
def add_image(room_id: str, body: AddImageBody):
    """
    Bild zu einem Raum hinzufügen.
    * url  → wird heruntergeladen und in assets/images/ abgelegt
    * file → bestehende Datei in assets/images/ wird verlinkt
    Danach wird der Eintrag (file, caption, source) in rooms.json geschrieben.
    """
    filename = None
    if body.file:
        if not (IMAGES_DIR / body.file).is_file():
            raise HTTPException(status_code=404, detail=f"Bilddatei '{body.file}' liegt nicht in assets/images")
        filename = body.file
    elif body.url:
        filename = _download_image(body.url)
    else:
        raise HTTPException(status_code=400, detail="Entweder 'url' oder 'file' angeben")

    with _lock:
        room = _find_room(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        entry = {"file": filename, "caption": body.caption, "source": body.source or body.url}
        room.setdefault("images", []).append(entry)
        room["updated_at"] = _now_ts()
        _persist_rooms()
        result = dict(room)
    return {**result, "added": {**entry, "url": _image_url(filename)}}


@app.post("/rooms/{room_id}/images/upload", status_code=201, tags=["Edit: Bilder"])
async def upload_image(
    room_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
):
    """
    Bilddatei per Multipart-Upload hochladen und an den Raum hängen.
    curl -X POST .../rooms/ATL-002/images/upload -F "file=@bild.jpg" -F "caption=..."
    """
    ext = Path(file.filename or "image").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Dateityp '{ext}' nicht erlaubt (erlaubt: {sorted(ALLOWED_EXTENSIONS)})")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Leere Datei")

    base = re.sub(r"[^A-Za-z0-9._-]", "_", Path(file.filename or "image").stem) or "image"
    target = IMAGES_DIR / f"{base}{ext}"
    counter = 1
    while target.exists():
        target = IMAGES_DIR / f"{base}-{counter}{ext}"
        counter += 1
    target.write_bytes(content)
    filename = target.name

    with _lock:
        room = _find_room(room_id)
        if room is None:
            target.unlink(missing_ok=True)
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        entry = {"file": filename, "caption": caption, "source": source}
        room.setdefault("images", []).append(entry)
        room["updated_at"] = _now_ts()
        _persist_rooms()
        result = dict(room)
    return {**result, "added": {**entry, "url": _image_url(filename)}}


@app.delete("/rooms/{room_id}/images/{index}", tags=["Edit: Bilder"])
def remove_image(room_id: str, index: int):
    """Bildeintrag (nach Index) aus dem Raum entfernen. Die Datei bleibt in assets/images."""
    with _lock:
        room = _find_room(room_id)
        if room is None:
            raise HTTPException(status_code=404, detail=f"Raum '{room_id}' nicht gefunden")
        images = room.get("images", [])
        if index < 0 or index >= len(images):
            raise HTTPException(status_code=404, detail=f"Index {index} nicht vorhanden (0..{len(images) - 1})")
        removed = images.pop(index)
        room["updated_at"] = _now_ts()
        _persist_rooms()
    return {"deleted": removed}


@app.post("/images", status_code=201, tags=["Edit: Bilder"])
async def upload_standalone(file: UploadFile = File(...)):
    """
    Bilddatei nur in assets/images/ ablegen (ohne Raumbezug).
    Liefert Dateinamen + URL; danach per POST /rooms/{id}/images mit 'file' verlinken.
    """
    ext = Path(file.filename or "image").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Dateityp '{ext}' nicht erlaubt")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Leere Datei")
    base = re.sub(r"[^A-Za-z0-9._-]", "_", Path(file.filename or "image").stem) or "image"
    target = IMAGES_DIR / f"{base}{ext}"
    counter = 1
    while target.exists():
        target = IMAGES_DIR / f"{base}-{counter}{ext}"
        counter += 1
    target.write_bytes(content)
    return {"file": target.name, "url": _image_url(target.name), "size": target.stat().st_size}


@app.delete("/images/{filename}", tags=["Edit: Bilder"])
def delete_standalone(filename: str):
    """
    Bilddatei aus assets/images/ löschen.
    Hinweis: Bildverweise in rooms.json bleiben bestehen und werden mit 404 geliefert,
    bis sie per PATCH /rooms/{id} entfernt werden.
    """
    p = _safe_image_path(filename)
    with _lock:
        refs = [
            r["id"]
            for r in ROOMS["rooms"]
            for img in r.get("images", [])
            if img["file"] == filename
        ]
    p.unlink()
    return {"deleted": filename, "still_referenced_by": refs}


# --------------------------------------------------------------------------
# Edit-Endpoints: Meta / Quellen / System
# --------------------------------------------------------------------------
@app.patch("/meta", tags=["Edit: Meta"])
def update_meta(body: MetaUpdate):
    """Allgemeine Beschreibung/ Titel/ Version der Datenbank aktualisieren."""
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(status_code=400, detail="Keine Felder zum Aktualisieren übergeben")
    with _lock:
        ROOMS["meta"].update(changes)
        ROOMS["meta"]["last_modified"] = _now_ts()
        _persist_rooms()
        return dict(ROOMS["meta"])


@app.post("/sources", status_code=201, tags=["Edit: Quellen"])
def create_source(body: SourceCreate):
    """Neue Quelle in den Quellenkatalog aufnehmen."""
    with _lock:
        if body.category not in SOURCES["categories"]:
            raise HTTPException(
                status_code=422,
                detail=f"category muss eine der Klassen sein: {sorted(SOURCES['categories'])}",
            )
        if body.id is None:
            max_n = max((int(s["id"].split("-")[1]) for s in SOURCES["sources"] if re.match(r"SRC-\d+", s["id"])), default=0)
            body.id = f"SRC-{max_n + 1:02d}"
        if any(s["id"] == body.id for s in SOURCES["sources"]):
            raise HTTPException(status_code=409, detail=f"Quelle '{body.id}' existiert bereits")
        source = body.model_dump(exclude={"id"}) | {"id": body.id}
        SOURCES["sources"].append(source)
        _persist_sources()
    return source


@app.patch("/sources/{source_id}", tags=["Edit: Quellen"])
def update_source(source_id: str, body: SourceUpdate):
    """Quelle bearbeiten (nur mitgegebene Felder)."""
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(status_code=400, detail="Keine Felder zum Aktualisieren übergeben")
    with _lock:
        source = next((s for s in SOURCES["sources"] if s["id"] == source_id), None)
        if source is None:
            raise HTTPException(status_code=404, detail=f"Quelle '{source_id}' nicht gefunden")
        if changes.get("category") and changes["category"] not in SOURCES["categories"]:
            raise HTTPException(status_code=422, detail=f"category muss eine der Klassen sein: {sorted(SOURCES['categories'])}")
        source.update(changes)
        _persist_sources()
    return source


@app.delete("/sources/{source_id}", tags=["Edit: Quellen"])
def delete_source(source_id: str):
    """Quelle löschen."""
    with _lock:
        before = len(SOURCES["sources"])
        SOURCES["sources"] = [s for s in SOURCES["sources"] if s["id"] != source_id]
        if len(SOURCES["sources"]) == before:
            raise HTTPException(status_code=404, detail=f"Quelle '{source_id}' nicht gefunden")
        _persist_sources()
    return {"deleted": source_id}


# --------------------------------------------------------------------------
# Lese-Endpoints: Objekte
# --------------------------------------------------------------------------
@app.get("/objects", tags=["Objekte"])
def list_objects():
    """Alle Objekte (Stargate, DHD, Kontrollstuhl, ...) mit ihren Referenzen."""
    with _lock:
        objects = ROOMS.get("objects", [])
    # Referenzen: welche Räume verweisen auf welches Objekt
    refs: dict[str, list[str]] = {}
    for r in ROOMS["rooms"]:
        for oid in r.get("objekte", []):
            refs.setdefault(oid, []).append(r["id"])
    result = []
    for obj in objects:
        entry = dict(obj)
        entry["rooms"] = refs.get(obj["id"], [])
        entry["images"] = [
            {**img, "url": _image_url(img["file"])} for img in obj.get("images", [])
        ]
        entry["models"] = _models_with_urls(obj)
        result.append(entry)
    return {"count": len(result), "objects": result}


@app.get("/objects/{obj_id}", tags=["Objekte"])
def get_object(obj_id: str):
    """Einzelnes Objekt mit allen Räumen, in denen es vorkommt, und seinen Bildern."""
    with _lock:
        obj = _find_object(obj_id)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
    refs = [r["id"] for r in ROOMS["rooms"] if obj_id in r.get("objekte", [])]
    out = dict(obj)
    out["rooms"] = refs
    out["images"] = [
        {**img, "url": _image_url(img["file"])} for img in obj.get("images", [])
    ]
    out["models"] = _models_with_urls(obj)
    return out


# --------------------------------------------------------------------------
# Edit-Endpoints: Objekte
# --------------------------------------------------------------------------
@app.post("/objects", status_code=201, tags=["Edit: Objekte"])
def create_object(body: ObjectCreate):
    """Neues Objekt anlegen. id wird automatisch vergeben, wenn nicht angegeben."""
    with _lock:
        if body.id is None:
            body.id = _next_object_id()
        if _find_object(body.id) is not None:
            raise HTTPException(status_code=409, detail=f"Objekt '{body.id}' existiert bereits")
        obj = body.model_dump(exclude={"id"}) | {"id": body.id}
        ROOMS.setdefault("objects", []).append(obj)
        _persist_rooms()
    return obj


@app.put("/objects/{obj_id}", tags=["Edit: Objekte"])
def replace_object(obj_id: str, body: ObjectReplace):
    """Objekt komplett ersetzen (id bleibt unverändert)."""
    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        payload = body.model_dump()
        models = obj.get("models")
        obj.clear()
        obj.update(payload | {"id": obj_id})
        if models:
            obj["models"] = models
        _persist_rooms()
    return obj


@app.patch("/objects/{obj_id}", tags=["Edit: Objekte"])
def update_object(obj_id: str, body: ObjectUpdate):
    """Teilweise Aktualisierung eines Objekts (nur mitgegebene Felder)."""
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(status_code=400, detail="Keine Felder zum Aktualisieren übergeben")
    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        obj.update(changes)
        _persist_rooms()
    return obj


@app.delete("/objects/{obj_id}", tags=["Edit: Objekte"])
def delete_object(obj_id: str):
    """
    Objekt löschen und alle Raum-Referenzen aufräumen.
    Räume, die auf das Objekt verweisen, werden entsprechend aktualisiert.
    """
    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        ROOMS["objects"] = [o for o in ROOMS["objects"] if o["id"] != obj_id]
        shutil.rmtree(MODELS_DIR / obj_id, ignore_errors=True)
        # Raum-Referenzen aufräumen
        cleaned_rooms = []
        for r in ROOMS["rooms"]:
            if obj_id in r.get("objekte", []):
                r["objekte"] = [oid for oid in r["objekte"] if oid != obj_id]
                r["updated_at"] = _now_ts()
                cleaned_rooms.append(r["id"])
        _persist_rooms()
    return {"deleted": obj_id, "cleaned_rooms": cleaned_rooms}


# --------------------------------------------------------------------------
# Edit-Endpoints: Objektbilder
# --------------------------------------------------------------------------
@app.post("/objects/{obj_id}/images", status_code=201, tags=["Edit: Objekte"])
def add_object_image(obj_id: str, body: AddImageBody):
    """
    Bild zu einem Objekt hinzufügen.
    * url  → wird heruntergeladen und in assets/images/ abgelegt
    * file → bestehende Datei in assets/images/ wird verlinkt
    Danach wird der Eintrag (file, caption, source) in rooms.json geschrieben.
    """
    filename = None
    if body.file:
        if not (IMAGES_DIR / body.file).is_file():
            raise HTTPException(status_code=404, detail=f"Bilddatei '{body.file}' liegt nicht in assets/images")
        filename = body.file
    elif body.url:
        filename = _download_image(body.url)
    else:
        raise HTTPException(status_code=400, detail="Entweder 'url' oder 'file' angeben")

    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        entry = {"file": filename, "caption": body.caption, "source": body.source or body.url}
        obj.setdefault("images", []).append(entry)
        _persist_rooms()
        result = dict(obj)
    return {**result, "added": {**entry, "url": _image_url(filename)}}


@app.post("/objects/{obj_id}/images/upload", status_code=201, tags=["Edit: Objekte"])
async def upload_object_image(
    obj_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
):
    """
    Bilddatei per Multipart-Upload hochladen und an das Objekt hängen.
    curl -X POST .../objects/OBJ-001/images/upload -F "file=@bild.jpg" -F "caption=..."
    """
    ext = Path(file.filename or "image").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Dateityp '{ext}' nicht erlaubt (erlaubt: {sorted(ALLOWED_EXTENSIONS)})")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Leere Datei")

    base = re.sub(r"[^A-Za-z0-9._-]", "_", Path(file.filename or "image").stem) or "image"
    target = IMAGES_DIR / f"{base}{ext}"
    counter = 1
    while target.exists():
        target = IMAGES_DIR / f"{base}-{counter}{ext}"
        counter += 1
    target.write_bytes(content)
    filename = target.name

    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            target.unlink(missing_ok=True)
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        entry = {"file": filename, "caption": caption, "source": source}
        obj.setdefault("images", []).append(entry)
        _persist_rooms()
        result = dict(obj)
    return {**result, "added": {**entry, "url": _image_url(filename)}}


@app.delete("/objects/{obj_id}/images/{index}", tags=["Edit: Objekte"])
def remove_object_image(obj_id: str, index: int):
    """Bildeintrag (nach Index) aus dem Objekt entfernen. Die Datei bleibt in assets/images."""
    with _lock:
        obj = _find_object(obj_id)
        if obj is None:
            raise HTTPException(status_code=404, detail=f"Objekt '{obj_id}' nicht gefunden")
        images = obj.get("images", [])
        if index < 0 or index >= len(images):
            raise HTTPException(status_code=404, detail=f"Index {index} nicht vorhanden (0..{len(images) - 1})")
        removed = images.pop(index)
        _persist_rooms()
    return {"deleted": removed}


# --------------------------------------------------------------------------
# 3D-Modelle (Spielobjekte) – Hoch-/Herunterladen
# --------------------------------------------------------------------------
def _model_url(obj_id: str, fmt: str, kind: str = "objects") -> str:
    return f"/{kind}/{obj_id}/models/{fmt}/file"


def _models_with_urls(obj: dict, kind: str = "objects") -> dict:
    return {fmt: {**m, "url": _model_url(obj["id"], fmt, kind)} for fmt, m in (obj.get("models") or {}).items()}


def _model_path(obj_id: str, entry: dict) -> Path:
    return MODELS_DIR / obj_id / entry["file"]


def _validate_model(fmt: str, content: bytes) -> None:
    if not content:
        raise HTTPException(status_code=400, detail="Leere Datei")
    if len(content) > MODEL_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Modell größer als {MODEL_MAX_BYTES // (1024 * 1024)} MB")
    if fmt == "glb":
        if content[:4] != b"glTF":
            raise HTTPException(status_code=415, detail="Keine gültige GLB-Datei (Magic 'glTF' fehlt)")
    else:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=415, detail="JS-Datei ist kein UTF-8-Text")
        if not re.search(r"export\s+(async\s+)?function\s+create\b|export\s+(const|let)\s+create\b", text):
            raise HTTPException(status_code=422, detail="JS-Objekt muss 'export function create()' enthalten (siehe infos/_vorlage.js)")


_KINDS = {
    "objects": ("Objekt", lambda i: _find_object(i)),
    "rooms": ("Raum", lambda i: _find_room(i)),
}


def _find_entity(kind: str, eid: str) -> dict:
    label, finder = _KINDS[kind]
    ent = finder(eid)
    if ent is None:
        raise HTTPException(status_code=404, detail=f"{label} '{eid}' nicht gefunden")
    return ent


@app.get("/models", tags=["Modelle"])
def list_models():
    """Alle Objekte und Räume, für die ein 3D-Modell (js/glb) hinterlegt ist."""
    with _lock:
        out = [{"id": o["id"], "kind": "objects", "name_de": o["name_de"], "models": _models_with_urls(o, "objects")}
               for o in ROOMS.get("objects", []) if o.get("models")]
        out += [{"id": r["id"], "kind": "rooms", "name_de": r["name_de"], "models": _models_with_urls(r, "rooms")}
                for r in ROOMS.get("rooms", []) if r.get("models")]
    return {"count": len(out), "models": out}


def _get_models(kind: str, eid: str):
    with _lock:
        ent = _find_entity(kind, eid)
        return {"id": eid, "models": _models_with_urls(ent, kind)}


def _download_model(kind: str, eid: str, fmt: str, download: bool):
    with _lock:
        ent = _find_entity(kind, eid)
        entry = (ent.get("models") or {}).get(fmt)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Kein '{fmt}'-Modell für '{eid}'")
    path = _model_path(eid, entry)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Modelldatei fehlt auf dem Datenträger")
    headers = {"Cache-Control": "no-cache"}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{entry["file"]}"'
    return FileResponse(path, media_type=MODEL_MEDIA_TYPES[fmt], headers=headers)


async def _upload_model(kind: str, eid: str, file: UploadFile, name, steckbrief, note):
    ext = Path(file.filename or "").suffix.lower()
    fmt = MODEL_FORMATS.get(ext)
    if fmt is None:
        raise HTTPException(status_code=415, detail=f"Format '{ext}' nicht erlaubt (erlaubt: .js, .glb)")
    base = (name or Path(file.filename or "objekt").stem).lower()
    base = re.sub(r"[^a-z0-9_]", "_", base).strip("_") or "objekt"
    if base.startswith("_"):
        raise HTTPException(status_code=422, detail="Namen mit '_' am Anfang sind Vorlagen und werden im Spiel nicht geladen")
    content = await file.read()
    _validate_model(fmt, content)
    brief = None
    if steckbrief:
        try:
            brief = json.loads(steckbrief)
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="steckbrief ist kein gültiges JSON")
    with _lock:
        ent = _find_entity(kind, eid)
        target_dir = MODELS_DIR / eid
        target_dir.mkdir(parents=True, exist_ok=True)
        old = (ent.get("models") or {}).get(fmt)
        if old and old["file"] != f"{base}{ext}":
            (target_dir / old["file"]).unlink(missing_ok=True)
        tmp = target_dir / f".{base}{ext}.tmp"
        tmp.write_bytes(content)
        os.replace(tmp, target_dir / f"{base}{ext}")
        entry = {"file": f"{base}{ext}", "name": base, "format": fmt, "size": len(content), "updated_at": _now_ts()}
        if brief is not None:
            entry["steckbrief"] = brief
        elif old and old.get("steckbrief"):
            entry["steckbrief"] = old["steckbrief"]
        if note:
            entry["note"] = note
        ent.setdefault("models", {})[fmt] = entry
        _persist_rooms()
    return {"id": eid, "model": {**entry, "url": _model_url(eid, fmt, kind)}}


def _delete_model(kind: str, eid: str, fmt: str):
    with _lock:
        ent = _find_entity(kind, eid)
        models = ent.get("models") or {}
        entry = models.pop(fmt, None)
        if entry is None:
            raise HTTPException(status_code=404, detail=f"Kein '{fmt}'-Modell für '{eid}'")
        _model_path(eid, entry).unlink(missing_ok=True)
        if not models:
            ent.pop("models", None)
        _persist_rooms()
    return {"deleted": entry}


_DL = Query(False, description="true = als Datei speichern (Content-Disposition: attachment)")
_F = File(..., description=".js (Code-Modul mit create()) oder .glb")
_N = Form(None, description="Spielname (a-z, 0-9, _); Standard: Dateiname")
_S = Form(None, description="Steckbrief als JSON-Objekt (optional)")
_T = Form(None, description="Freitext, z. B. Quelle/Lizenz")


@app.get("/objects/{obj_id}/models", tags=["Modelle"])
def get_object_models(obj_id: str):
    """Modelle eines Objekts (Metadaten + Download-URL je Format)."""
    return _get_models("objects", obj_id)


@app.get("/objects/{obj_id}/models/{fmt}/file", tags=["Modelle"])
def download_object_model(obj_id: str, fmt: str, download: bool = _DL):
    """Modelldatei eines Objekts (Dateiname = Spiel-Objektname, z. B. stargate_atlantis.js)."""
    return _download_model("objects", obj_id, fmt, download)


@app.post("/objects/{obj_id}/models", status_code=201, tags=["Modelle"])
async def upload_object_model(obj_id: str, file: UploadFile = _F, name: Optional[str] = _N,
                              steckbrief: Optional[str] = _S, note: Optional[str] = _T):
    """3D-Modell zu einem Objekt hochladen (ersetzt ein vorhandenes Modell desselben Formats)."""
    return await _upload_model("objects", obj_id, file, name, steckbrief, note)


@app.delete("/objects/{obj_id}/models/{fmt}", tags=["Modelle"])
def delete_object_model(obj_id: str, fmt: str):
    """Modell (js/glb) eines Objekts löschen – Eintrag und Datei."""
    return _delete_model("objects", obj_id, fmt)


@app.get("/rooms/{room_id}/models", tags=["Modelle"])
def get_room_models(room_id: str):
    """Modelle eines Raums (Metadaten + Download-URL je Format)."""
    return _get_models("rooms", room_id)


@app.get("/rooms/{room_id}/models/{fmt}/file", tags=["Modelle"])
def download_room_model(room_id: str, fmt: str, download: bool = _DL):
    """Modelldatei eines Raums (Dateiname = Spiel-Raumname, z. B. raum_kontrollraum.js)."""
    return _download_model("rooms", room_id, fmt, download)


@app.post("/rooms/{room_id}/models", status_code=201, tags=["Modelle"])
async def upload_room_model(room_id: str, file: UploadFile = _F, name: Optional[str] = _N,
                            steckbrief: Optional[str] = _S, note: Optional[str] = _T):
    """3D-Modell (leere Raumhülle mit PLACE_-Punkten) zu einem Raum hochladen."""
    return await _upload_model("rooms", room_id, file, name, steckbrief, note)


@app.delete("/rooms/{room_id}/models/{fmt}", tags=["Modelle"])
def delete_room_model(room_id: str, fmt: str):
    """Modell (js/glb) eines Raums löschen – Eintrag und Datei."""
    return _delete_model("rooms", room_id, fmt)


@app.post("/backup", tags=["System"])
def create_backup():
    """Sicherungs-Kopien von rooms.json und sources.json anlegen."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    with _lock:
        rooms_copy = BACKUP_DIR / f"rooms-{stamp}.json"
        sources_copy = BACKUP_DIR / f"sources-{stamp}.json"
        shutil.copy2(ROOMS_FILE, rooms_copy)
        shutil.copy2(SOURCES_FILE, sources_copy)
    return {
        "backup": [str(rooms_copy), str(sources_copy)],
        "count": len(list(BACKUP_DIR.glob("*.json"))),
    }


@app.post("/reload", tags=["System"])
def reload_data():
    """
    Daten neu von der Festplatte laden (z.B. nach externer Änderung der JSON-Dateien).
    Unpersistierte In-Memory-Änderungen gehen dabei verloren.
    """
    global ROOMS, SOURCES
    with _lock:
        ROOMS = _load_json(ROOMS_FILE)
        SOURCES = _load_json(SOURCES_FILE)
    return {"reloaded": True, "rooms": len(ROOMS["rooms"]), "sources": len(SOURCES["sources"])}


# --------------------------------------------------------------------------
# Fehler-Handling
# --------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail, "path": request.url.path})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8324)

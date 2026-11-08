#!/usr/bin/env python3
"""
Generator für Spielobjekte mit der lokalen KI (llama.cpp / llama-swap, Modell "Hauptmodell").

Pro Objekt (build/auftraege/OBJ-xxx/):
  Runde 1   : Auftrag + Referenzbilder  → komplette .js-Datei + Einbau-Text
  danach    : pruefen.mjs + render.mjs  → Prüfergebnis + Renderbild zurück an das Modell → Überarbeitung
  Nacharbeit: liegt review.md vor (Prüfung durch Claude), wird damit weitergearbeitet

Jede Runde ist ein frischer Kontext (System + Auftrag + aktueller Stand) – keine wachsende Chat-Historie,
daher keine Compaction. Streaming mit Leerlauf-Timeout erkennt Hänger, die Runde wird dann wiederholt.

Aufruf:
  build.py daemon [--workers 2]     Warteschlange orchestrator/queue.txt abarbeiten (läuft bis STOP-Datei)
  build.py one OBJ-002              ein Objekt sofort bauen (Vordergrund)
Warteschlange: eine Zeile pro Job: "OBJ-002" (Neubau) oder "OBJ-002 rework" (mit review.md nacharbeiten)
"""
import base64, io, json, os, re, subprocess, sys, threading, time, traceback, urllib.request
from datetime import datetime
from PIL import Image

BUILD = "/root/sga/build"
ORCH = f"{BUILD}/orchestrator"
QUEUE = os.environ.get("SGA_QUEUE", f"{ORCH}/queue.txt")   # eigene Warteschlange je Daemon möglich
STOPFILE = f"{ORCH}/STOP"
URL = os.environ.get("SGA_URL", "http://192.168.66.225:8080/v1/chat/completions")
# optionaler API-Schlüssel (externe OpenAI-kompatible Anbieter): Datei-Pfad in SGA_API_KEY_FILE oder Wert in SGA_API_KEY
API_KEY = (open(os.environ["SGA_API_KEY_FILE"]).read().strip() if os.environ.get("SGA_API_KEY_FILE") else os.environ.get("SGA_API_KEY", ""))
MODEL = os.environ.get("SGA_MODEL", "Hauptmodell")   # aus ~/.config/opencode/opencode.json (llama.cpp/Hauptmodell)
MAX_TOKENS = int(os.environ.get("SGA_MAX_TOKENS", "30000"))
IDLE_TIMEOUT = int(os.environ.get("SGA_IDLE_TIMEOUT", "300"))   # s ohne neues Token → Hänger
HARD_TIMEOUT = 50 * 60                # s pro Runde
MAX_ROUNDS = int(os.environ.get("SGA_ROUNDS", "4"))   # Runden pro Neubau
REWORK_ROUNDS = 3
AUFTRAEGE = os.environ.get("SGA_AUFTRAEGE", "auftraege")
REF_PX = int(os.environ.get("SGA_REF_PX", "768"))
RENDER_PX = int(os.environ.get("SGA_RENDER_PX", "1024"))
MAX_REFS = int(os.environ.get("SGA_MAX_REFS", "3"))
MAX_RENDERS = int(os.environ.get("SGA_MAX_RENDERS", "2"))
qlock = threading.Lock()


def log(obj_dir, msg):
    line = f"[{datetime.now():%H:%M:%S}] {msg}"
    print(f"{os.path.basename(obj_dir)} {line}", flush=True)
    with open(f"{obj_dir}/build.log", "a") as f:
        f.write(line + "\n")


def set_status(obj_dir, **kw):
    p = f"{obj_dir}/status.json"
    st = json.load(open(p)) if os.path.exists(p) else {}
    st.update(kw, updated=datetime.now().isoformat(timespec="seconds"))
    json.dump(st, open(p, "w"), ensure_ascii=False, indent=1)
    return st


def img_part(path, max_w=1024):
    im = Image.open(path).convert("RGB")
    im.thumbnail((max_w, max_w))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82)
    return {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()}}


RAUM = os.environ.get("SGA_MODUS") == "raum"
SPIEL = os.environ.get("SGA_MODUS") == "spiel"   # Spielmodule (src/game), Prüfung über build/tools/spiel_test.mjs


def system_prompt():
    if SPIEL:
        anl = open(f"{BUILD}/ANLEITUNG_SPIEL.md").read()
        ex = open("/root/sga/src/game/core/licht.js").read()
        return anl + "\n\n## Beispiel eines fertigen Moduls (core/licht.js)\n```js\n" + ex + "\n```\n"
    if RAUM:
        anl = open(f"{BUILD}/ANLEITUNG_RAUM.md").read() + "\n\n" + open(f"{BUILD}/ARCHITEKTUR.md").read()
        ex = open(f"{BUILD}/beispiele/raum_korridor.js").read()
    else:
        anl = open(f"{BUILD}/ANLEITUNG.md").read()
        ex = open(f"{BUILD}/beispiele/beispiel_wandkonsole.js").read()
    hint = os.environ.get("SGA_SYS_HINT", "")
    return anl + "\n\n## Beispiel (Muster für Aufbau, Funktionen, Animation)\n```js\n" + ex + "\n```\n" + (("\n" + hint + "\n") if hint else "")


FORMAT = """
## Ausgabeformat (genau einhalten)
1. Ein Codeblock ```js mit der **kompletten** Datei `{name}.js`.
2. Danach ein Codeblock ```md mit dem Einbau-Text für das Spiel, Abschnitte als `#### Überschrift`:
   Datei (Name, Art, Ursprung, Maße, Dreiecke) · Platzierung (Raum, Position, Ausrichtung, Abstände) ·
   Einbau-Code (`b.prop('{name}', [x, y, z], {{ rotY, actions: {{ <INT-id>: () => ({{ menu: {{ title, options: obj.userData.actions }} }}) }} }})`) ·
   Benutzen-Punkte · Funktionen (userData.api) · Kollision · Licht und Animation · Prüfliste im Schaukasten.
Keine weiteren Erklärungen außerhalb der beiden Blöcke.
"""

FORMAT_SPIEL = """
## Ausgabeformat (genau einhalten)
1. Ein Codeblock ```js mit der **kompletten** Datei `{name}.js` (export function init(ctx) …).
2. Danach ein Codeblock ```md mit kurzen Notizen: Aufbau, Schnittstelle, bekannte Grenzen.
Keine weiteren Erklärungen außerhalb der beiden Blöcke.
"""


def call_llm(obj_dir, rnd, messages):
    payload = {"model": MODEL, "messages": messages, "stream": True, "max_tokens": MAX_TOKENS,
               "temperature": float(os.environ.get("SGA_TEMPERATURE", "0.6")), "top_p": 0.95}
    payload.update(json.loads(os.environ.get("SGA_EXTRA_JSON", "{}")))   # z. B. chat_template_kwargs
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
    req = urllib.request.Request(URL, data=body, headers=headers)
    t0 = time.time()
    content, reasoning = [], []
    with urllib.request.urlopen(req, timeout=IDLE_TIMEOUT) as r:
        for raw in r:
            if time.time() - t0 > HARD_TIMEOUT:
                raise TimeoutError("Gesamt-Timeout der Runde")
            line = raw.decode("utf-8", "ignore").strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                ch = json.loads(data)["choices"][0]
            except Exception:
                continue
            d = ch.get("delta") or {}
            if d.get("content"):
                content.append(d["content"])
            if d.get("reasoning_content") or d.get("reasoning"):
                reasoning.append(d.get("reasoning_content") or d.get("reasoning"))   # vLLM liefert "reasoning"
    text = "".join(content)
    open(f"{obj_dir}/runde{rnd}_antwort.md", "w").write(text)
    open(f"{obj_dir}/runde{rnd}_denken.txt", "w").write("".join(reasoning))
    log(obj_dir, f"Runde {rnd}: Antwort {len(text)} Zeichen, Denken {sum(map(len, reasoning))} Zeichen, {time.time()-t0:.0f} s")
    return text


def extract(text, lang):
    blocks = re.findall(r"```(\w*)\s*\n(.*?)```", text, re.S)
    hits = [b for l, b in blocks if l.lower() in lang]
    return hits[-1].strip() + "\n" if hits else None


def check_spiel(obj_dir, name):
    meta = json.load(open(f"{obj_dir}/auftrag.json"))
    for old in os.listdir(obj_dir):
        if old.startswith("render"):
            os.remove(f"{obj_dir}/{old}")
    env = dict(os.environ, SCHRITTE=json.dumps(meta.get("test", [{"warte": 3000}, {"foto": "Start"}])))
    if meta.get("module"):
        env["MODULE"] = meta["module"]
    p = subprocess.run(["node", f"{BUILD}/tools/spiel_test.mjs", meta["modul"], f"{obj_dir}/{name}.js", f"{obj_dir}/render"],
                       capture_output=True, text=True, timeout=900, cwd=BUILD, env=env)
    out = (p.stdout + p.stderr).strip()[-6000:]
    open(f"{obj_dir}/pruefung.txt", "w").write(out)
    renders = sorted(x for x in os.listdir(obj_dir) if x.startswith("render") and x.endswith(".png"))
    return p.returncode == 0, out, renders


def check(obj_dir, name):
    if SPIEL:
        return check_spiel(obj_dir, name)
    f = f"{obj_dir}/{name}.js"
    env = dict(os.environ)
    try:
        env["RAUM_OBJEKTE"] = ",".join(json.load(open(f"{obj_dir}/auftrag.json")).get("objekte", []))
    except Exception:
        pass
    p = subprocess.run(["node", f"{BUILD}/tools/pruefen.mjs", f], capture_output=True, text=True, timeout=120, cwd=BUILD, env=env)
    out = (p.stdout + p.stderr).strip()
    open(f"{obj_dir}/pruefung.txt", "w").write(out)
    renders = []
    if p.returncode == 0:
        for old in os.listdir(obj_dir):
            if old.startswith("render"):
                os.remove(f"{obj_dir}/{old}")
        r = subprocess.run(["node", f"{BUILD}/tools/render.mjs", f, f"{obj_dir}/render"], capture_output=True, text=True, timeout=240, cwd=BUILD)
        if r.returncode != 0:
            out += "\nFEHLER beim Rendern im Browser: " + (r.stdout + r.stderr).strip()[-800:]
            open(f"{obj_dir}/pruefung.txt", "w").write(out)
        renders = sorted(x for x in os.listdir(obj_dir) if x.startswith("render") and x.endswith(".png"))
    return p.returncode == 0 and "FEHLER beim Rendern" not in out, out, renders


def build(oid, rework=False):
    obj_dir = f"{BUILD}/{AUFTRAEGE}/{oid}"
    meta = json.load(open(f"{obj_dir}/auftrag.json"))
    name = meta["name"]
    auftrag = open(f"{obj_dir}/auftrag.md").read()
    refs = [img_part(f"{obj_dir}/{b}", REF_PX) for b in meta["bilder"][:MAX_REFS]]
    review = open(f"{obj_dir}/review.md").read() if rework and os.path.exists(f"{obj_dir}/review.md") else ""
    set_status(obj_dir, state="building", rework=rework)
    code_path = f"{obj_dir}/{name}.js"
    have_code = os.path.exists(code_path) and rework
    rounds = REWORK_ROUNDS if rework else MAX_ROUNDS
    ok, out, renders = (check(obj_dir, name) if have_code else (False, "", []))
    start = len([x for x in os.listdir(obj_dir) if re.match(r"runde\d+_antwort", x)]) + 1
    failures = 0
    rnd = start
    while rnd < start + rounds:
        user = [{"type": "text", "text": auftrag}] + refs
        if not have_code:
            user.append({"type": "text", "text": ("\nBaue jetzt das Modul." + FORMAT_SPIEL if SPIEL else "\nBaue jetzt das Objekt." + FORMAT).format(name=name)})
        else:
            code = open(code_path).read()
            fb = f"\n## Dein aktueller Stand `{name}.js`\n```js\n{code}```\n\n## Prüfergebnis ({'Prüfstand spiel_test.mjs' if SPIEL else 'pruefen.mjs'})\n```\n{out}\n```\n"
            user.append({"type": "text", "text": fb})
            if renders:
                user.append({"type": "text", "text": "## Fotos aus dem Prüfstand" if SPIEL else "## Render deines aktuellen Modells" + (" (Raum: von oben ohne Decke, schräg, zwei Innenansichten auf Augenhöhe; die fertigen Objekte stehen an deinen PLACE_-Punkten):" if RAUM else " (vorne, Seite, oben, hinten; Raster 1 m, blaue Figur 1,37 m):")})
                user += [img_part(f"{obj_dir}/{x}", RENDER_PX) for x in renders[:MAX_RENDERS]]
            if review:
                user.append({"type": "text", "text": "\n## Prüfbericht des Reviewers (unbedingt umsetzen)\n" + review})
            if SPIEL:
                user.append({"type": "text", "text": "\n## Aufgabe\nBehebe alle FEHLER aus dem Prüfbericht, sodass selbsttest() echtes Verhalten bestätigt und keine Konsolenfehler auftreten. Prüfe die Fotos auf sichtbare Probleme. Halte die Schnittstellen der Anleitung exakt ein." + FORMAT_SPIEL.format(name=name)})
            else:
              user.append({"type": "text", "text": "\n## Aufgabe\nBehebe alle FEHLER und WARNUNGEN. Vergleiche den Render mit den Referenzbildern und der Beschreibung: "
                         "Form, Proportionen, reale Maße, Details, Farben/Materialien, Funktionen. Verbessere das Modell deutlich, wo es abweicht "
                         "(geschlossene Körper, nichts schwebt, Vorderseite +Z)." + FORMAT.format(name=name)})
        messages = [{"role": "system", "content": system_prompt()}, {"role": "user", "content": user}]
        log(obj_dir, f"Runde {rnd} startet ({'Nacharbeit' if rework else 'Neubau'})")
        try:
            text = call_llm(obj_dir, rnd, messages)
        except Exception as e:
            failures += 1
            log(obj_dir, f"Runde {rnd} abgebrochen: {e!r} (Versuch {failures})")
            if failures >= 3:
                break
            time.sleep(10)
            continue  # gleiche Runde wiederholen
        js = extract(text, ("js", "javascript", "mjs"))
        md = extract(text, ("md", "markdown"))
        if not js or ("export function init" if SPIEL else "export function create") not in js and ("export async function init" not in js):
            log(obj_dir, f"Runde {rnd}: kein vollständiger JS-Block in der Antwort")
            failures += 1
            rnd += 1
            continue
        open(code_path, "w").write(js)
        if md:
            open(f"{obj_dir}/einbau.md", "w").write(md)
        have_code = True
        ok, out, renders = check(obj_dir, name)
        log(obj_dir, f"Runde {rnd}: Prüfung {'OK' if ok else 'mit FEHLERN'}")
        rnd += 1
        # Neubau: mindestens eine Überarbeitung mit Render; danach nur weiter, solange Fehler bestehen
        if ok and (rnd - start) >= 2 and not rework:
            break
        if ok and rework and (rnd - start) >= 1 and not review:
            break
    state = "built" if ok else "failed"
    set_status(obj_dir, state=state, rounds=rnd - 1)
    log(obj_dir, f"fertig: {state}")
    return state


def pop_job():
    with qlock:
        if not os.path.exists(QUEUE):
            return None
        lines = [l.strip() for l in open(QUEUE) if l.strip()]
        if not lines:
            return None
        job, rest = lines[0], lines[1:]
        open(QUEUE, "w").write("".join(l + "\n" for l in rest))
        return job


WORKERS_FILE = f"{ORCH}/WORKERS"


def active_workers(default):
    try:
        return int(open(WORKERS_FILE).read().strip())
    except Exception:
        return default


def worker(n, default_n=2):
    while not os.path.exists(STOPFILE):
        if n >= active_workers(default_n):   # Worker-Anzahl zur Laufzeit über orchestrator/WORKERS steuerbar
            time.sleep(15)
            continue
        job = pop_job()
        if not job:
            time.sleep(20)
            continue
        oid, *flags = job.split()
        try:
            build(oid, rework="rework" in flags)
        except Exception:
            traceback.print_exc()
            set_status(f"{BUILD}/{AUFTRAEGE}/{oid}", state="failed", error=traceback.format_exc()[-500:])


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "one":
        build(sys.argv[2], rework="rework" in sys.argv[3:])
    elif len(sys.argv) >= 2 and sys.argv[1] == "daemon":
        n = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else 2
        ts = [threading.Thread(target=worker, args=(i, n), daemon=True) for i in range(n)]
        for t in ts:
            t.start()
            time.sleep(5)
        for t in ts:
            t.join()
    else:
        print(__doc__)

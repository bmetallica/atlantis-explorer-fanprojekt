# Anleitung: Spielmodule für „Atlantis“ (Browser-Spiel, three.js r170)

Du baust **ein einzelnes Spielmodul** (eine JS-Datei) für ein Ego-Perspektiven-Spiel in der Stadt Atlantis
(Stargate Atlantis). Der Spielkern, das Laden der Räume und das Licht sind fertig; dein Modul fügt sich über
einen festen Vertrag ein. Halte dich genau an die Schnittstellen unten – andere Module verlassen sich darauf.

## Technik
- ES-Modul, läuft im Browser. Erlaubte Importe **nur**:
  `import * as THREE from 'three';` · `import { … } from 'three/addons/…';` (three.js r170 examples/jsm) ·
  `import { MeshBVH, … } from 'three-mesh-bvh';` (Version 0.8.3). Keine anderen Bibliotheken, kein `fetch` auf fremde Server.
- Datei exportiert genau: `export function init(ctx)` (darf `async` sein) → gibt ein Objekt zurück mit
  optional `update(dt)` (jedes Bild, dt in Sekunden, max. 0,1), `dispose()`, `selbsttest()` (siehe unten),
  `auchInPause: true` (nur wenn update auch bei Pause laufen muss, z. B. Menü).
- 1 Einheit = 1 m, +Y oben. Koordinaten der Stadt: x = Osten, z = Süden.
- Deutsche Kommentare, knapp. Keine Konsolenausgaben im Normalbetrieb außer echten Fehlern (`console.error`).
- **Leistung:** keine Allokationen pro Bild in Schleifen (Vektoren vorab anlegen), keine neuen Materialien/Lichter
  pro Bild, keine `new THREE.PointLight` (Licht kommt ausschließlich aus dem Lichtpool), keine Schatten.
  Ziel: 60 fps auf einem Laptop mit Intel-Grafik.

## Spielkontext `ctx`
| Feld | Bedeutung |
|---|---|
| `ctx.THREE` | three.js |
| `ctx.renderer`, `ctx.scene`, `ctx.camera`, `ctx.canvas` | Renderer, Szene, Kamera (PerspectiveCamera), Canvas |
| `ctx.uiRoot` | `<div>` über dem Canvas für HTML-Oberflächen (pointer-events: Kinder aktiv) |
| `ctx.settings` | `get(key)`, `set(key, value)`, `alle()`; Schlüssel: `hell` 1–10, `glow` 1–10, `stufe` 'hoch'/'niedrig', `maus` 1–10, `fov` 50–100, `ton` 0–10. Änderung löst Ereignis `einstellung` {key, value} aus |
| `ctx.on(name, fn)` / `ctx.emit(name, detail)` | Ereignisse. Vorhanden: `einstellung`, `taste` {code, unten, event}, `maus` {button, unten}, `mauszeiger` {gesperrt}, `statistik` {fps, calls}, `bereit` |
| `ctx.input` | `taste(code)` → bool (z. B. 'KeyW', 'ShiftLeft', 'Space'), `nimmMaus()` → {dx, dy} seit letztem Aufruf, `sperren()` / `freigeben()` (Pointer-Lock), `maus.gesperrt` |
| `ctx.services` | `register(name, api)`, `get(name)` (undefined, wenn nicht vorhanden – dann Funktion überspringen, **nicht** warten) |
| `ctx.plan` | Stadtplan (JSON von `/stadtplan`): `raeume[]` {id, name, zone, trakt, ebene, pos[3], rotY, grundriss[[x,z]×4], hoehe[y0,y1]}, `korridore[]` {id, trakt, opts, pos, rotY, grundriss}, `transporter[]` {id, trakt, pos, rotY}, `verbindungen[]`, `spielmarken` {respawn {pos, rotY}, flug_grenze_radius, flug_grenze_hoehe}, `wasser_y`, `deck_y` |
| `ctx.state` | `modus` ('fuss' / 'jumper'), `ort` ('atlantis' / 'planet'), `pause` (bool), `spieler` {pos: Vector3 (Fußpunkt), blick {yaw, pitch}} |
| `ctx.setRaumFaktor(f)` | Lichtstimmung des aktuellen Raums (0,6–1,2) |
| `ctx.log(...)` | Spiel-Log (im Prüfstand sichtbar) |
| `ctx.test` | true im Prüfstand (Headless, kein Pointer-Lock – Maus trotzdem über `nimmMaus()` lesbar) |

## Dienste (feste Schnittstellen)
**assets** (fertig): `raum(id)` → Promise<RaumHandle> lädt einen Raum (ATL-xxx) samt Objekten an seiner Stadtplan-Position;
`korridor(korridorEintrag)` → Promise<RaumHandle>; `objekt(id)` → Promise<Object3D>.
RaumHandle: `{ id, gruppe, kollision: Mesh[] (COL_-Boxen, unsichtbar; userData.aktiv === false → ignorieren),
lampen: [{pos, color, intensity, distance}], benutzen: [{obj, pos, label, radius}], tueren: [{name, pos, breite, hoehe, raum}],
funktionen: Object3D[] (mit userData.actions [{id, label, run}] und oft userData.api), update(), dispose() }`.
`update()` jedes Bild aufrufen, solange der Raum geladen ist (bewegliche Teile/Animationen).

**licht** (fertig): `registrieren(schluessel, lampen)`, `entfernen(schluessel)`.

**kollision** (welt/kollision.js):
`hinzufuegen(schluessel, objekte)` – statische Kollision aus Meshes (Welt-Matrizen; COL_-Boxen oder beliebige Meshes),
`entfernen(schluessel)`, `dynamisch(schluessel, meshes)` – bewegliche COL_-Boxen (jedes Bild neu gelesen, `userData.aktiv === false` → aus),
`kapsel(pos, vel, dt, {radius=0.3, hoehe=1.75}) → { amBoden }` – bewegt den Fußpunkt `pos` (Vector3, wird verändert) mit Geschwindigkeit `vel` (wird bei Kontakt angepasst) und löst Kollisionen,
`strahl(origin, dir, maxDist) → { punkt, abstand, normal } | null`.

**aussen** (welt/aussen.js): `istImWasser(pos) → bool`, `sichtbar(bool)`.

**welt** (welt/streaming.js): `raumBei(pos) → id | null`, `geladen() → RaumHandle[]`, `benutzbare() → [{pos, label, actions, obj}]`,
`transporterListe() → [{id, name}]`, `teleport(transporterId) → { pos: Vector3, yaw }`, `bereit() → Promise` (Startbereich geladen).

**spieler** (spieler/steuerung.js): `position` (Vector3, Fußpunkt), `setPosition(vec, yaw)`, `respawn()`, `aktiv` (bool, false = Steuerung aus, z. B. im Jumper).

**ui** (ui/menue.js): `hinweis(text | null)` (Zeile unten mittig), `menue(titel, optionen[{label, run}])` (Auswahlliste, schließt nach Wahl),
`meldung(text, sekunden)`, `offen` (bool, Menü offen → `ctx.state.pause = true`).

## selbsttest()
Gibt `{ ok: bool, details: string }` zurück (darf async sein) und prüft **echtes Verhalten** deines Moduls im
laufenden Spiel (z. B. „Kapsel fällt auf eine Box und bleibt darauf stehen“). Der Prüfstand ruft ihn nach den
Testschritten auf. Schreibe ihn so, dass er ohne Benutzereingaben funktioniert.

## Prüfstand
Dein Modul wird im echten Spiel geladen (headless Chromium, Software-Rendering, also langsam), die Testschritte
aus dem Auftrag werden ausgeführt, Konsolenfehler gesammelt, `selbsttest()` aufgerufen, Fotos gemacht.
Ergebnis OK = keine Konsolenfehler und `selbsttest().ok === true`.

# Bauanleitung: Spielobjekte für das Atlantis-Spiel (Stargate Atlantis)

Du baust **ein** Objekt als JavaScript-Modul (three.js), das ohne Umbau ins Spiel übernommen wird.

## Pflichtregeln
- Datei: `<name>.js`, ES-Modul, `import * as THREE from 'three';` – **keine anderen Imports**, keine Netz- oder Dateizugriffe.
- `export function create(opts = {})` gibt eine `THREE.Group` zurück. Zusätzlich `export const steckbrief = { name, art, masse, wohin, benutzen, lichter, animation, quelle }`.
- **1 Einheit = 1 Meter**, +Y oben, **Vorderseite zeigt nach +Z**.
- **Ursprung**: Standobjekt = Mitte der Unterseite (tiefster Punkt bei y = 0, in X/Z mittig). Wandobjekt = Mitte der Unterkante der Rückseite (Rückseite bei z = 0, Objekt ragt nach +Z). Deckenobjekt = Mitte der Oberseite (y = 0 ist Decke, Objekt hängt nach −Y).
- **Reale Maße** (Tisch 0,75 m hoch, Tür 3 m). Spielerfigur: 1,37 m hoch – nicht daran messen, sondern an realen Maßen.
- Dreiecke: Kleinobjekt ≤ 5 000, großes Objekt ≤ 30 000. Wiederholte Teile als `THREE.InstancedMesh`.
- Stil (Ancient/Lantianer): Perl-/Silbergrau und Stahlblau, Bronze-Akzente, eisblaue oder bernsteinfarbene Leuchtlinien, **kein Rost, kein Schmutz**. Irdische Ausrüstung (Waffen, Laptops, Kisten …) sieht real aus.

## Namensregeln (das Spiel liest die Namen)
| Name | Art | Bedeutung |
|---|---|---|
| `COL_…` | Mesh (einfache Box) | Unsichtbarer Kollisionskörper. Gibt es einen, kollidieren nur die COL_-Meshes. Bei > 2 000 Dreiecken Pflicht. Bewegte Teile nie als COL_ |
| `INT_<id>` | `THREE.Object3D` | Benutzen-Punkt `[E]`, `userData = { label: 'Text', radius: 0.8 }`, vor dem Objekt in Griffhöhe |
| `LAMP_…` | `THREE.Object3D` | Lichtquelle, `userData = { color: '#6fe3ff', intensity: 8, distance: 5 }` (dauerhaft an!) |
| Material `KIT_<name>` | `new THREE.MeshStandardMaterial({ name: 'KIT_wall' })` | wird durch Spielmaterial ersetzt |

Spielmaterialien: `KIT_wall` (Silbergrau/Blaustich), `KIT_wallDark` (Stahlblau), `KIT_copper` (Bronze), `KIT_pillar` (Perlgrau), `KIT_hull` (Perlweiß), `KIT_floor`, `KIT_floorUpper`, `KIT_ceiling`, `KIT_stair`, `KIT_door`, `KIT_glass` (blaues Glas), `KIT_rail` (glänzende Bronze), `KIT_glow` (leuchtend Eisblau), `KIT_amberGlow` (leuchtend Bernstein).
Eigene Materialien (`MeshStandardMaterial` mit color/metalness/roughness/emissive, Canvas-Texturen über `document.createElement('canvas')`) sind erlaubt und für realistische Details erwünscht.

## Funktionen und Animationen (wenn sie zum Objekt passen)
Muster siehe `beispiele/beispiel_wandkonsole.js`:
- Zustand in Variablen im `create()`-Scope, eine `update(dt)`-Funktion animiert (Leuchten, Drehen, Öffnen, Pulsieren, Flackern …).
- Antrieb: `einSichtbaresMesh.onBeforeRender = () => { … performance.now() … update(dt) }` – läuft selbstständig.
- Öffentlich: `root.userData.api = { … }` (Methoden + Getter für den Zustand) und
  `root.userData.actions = [{ id, label, run }]` – die Aktionen erscheinen als Menü am INT_-Punkt.
- Sinnvoll sind Funktionen, die das Objekt **in der Serie** hat (Konsole ein/aus, Tür öffnen, Scanner scannen, Waffe Modus wechseln, Deckel öffnen …). Gegenstände ohne Funktion (Tisch, Kiste ohne Deckel) bekommen keine erfundenen Funktionen.
- Animationen müssen weich laufen (Werte mit `x += (ziel - x) * Math.min(1, dt * k)` annähern), dürfen nicht werfen und keine globalen Objekte ändern.

## Arbeitsweise
1. Lies den Auftrag (Beschreibung + Bilder). Die Bilder sind die Referenz für Form, Proportionen und Farben.
2. Plane kurz: Hauptformen mit Maßen, Details, Materialien, Funktionen.
3. Baue mit Grundkörpern (`BoxGeometry`, `CylinderGeometry`, `LatheGeometry` für Rotationskörper, `ExtrudeGeometry` für Profile, `TorusGeometry`, `CapsuleGeometry`). **Geschlossene Körper**, keine offenen Flächen; bei `LatheGeometry` das Profil so ordnen, dass Normalen nach außen zeigen.
4. Gib immer die **komplette Datei** aus, nie Ausschnitte.

## Raum-Tipps (häufige Fehler vermeiden)
- **Erst flach bauen, dann neigen:** Teile, die auf einer schrägen oder senkrechten Fläche liegen (Tasten, Kacheln, Displays), in einer eigenen `THREE.Group` aufbauen, die flach in der X/Z-Ebene liegt (Oberseite +Y). Danach nur die Gruppe positionieren und mit `gruppe.rotation.x = -neigung` kippen. Nie jedes Teil einzeln drehen.
- `ShapeGeometry`/`ExtrudeGeometry` entstehen in der **X/Y-Ebene** (Extrusion entlang +Z). Zum Hinlegen: `geo.rotateX(-Math.PI / 2)` – dann zeigt die Fläche nach +Y.
- `PlaneGeometry` liegt ebenfalls in X/Y (Normale +Z): für Böden/Deckflächen `rotateX(-Math.PI / 2)`, für Bildschirme an der Vorderseite so lassen.
- `CylinderGeometry` steht entlang Y. Für liegende Rohre `rotateZ(Math.PI / 2)` (entlang X) oder `rotateX(Math.PI / 2)` (entlang Z).
- Raster/Muster immer in **zwei** Schleifen (Reihe × Spalte) berechnen: `x = (spalte - (n - 1) / 2) * abstand`, `z = (reihe - (m - 1) / 2) * abstand`.
- Dreiecksraster (z. B. Sechseck aus Dreiecken, Kantenlänge s, Höhe h = s·√3/2): Kachel k in Reihe r hat `x = (k - (anzahl - 1) / 2) * s / 2`, `z = (r - (reihen - 1) / 2) * h`, und zeigt abwechselnd mit der Spitze nach −Z bzw. +Z (`rotation.y = (k + r) % 2 ? Math.PI : 0`).
- Höhe immer vom Boden aus rechnen: ein Teil der Höhe h, das auf einer Fläche bei y = f liegt, hat `position.y = f + h / 2`.
- Prüfe am Render: steht etwas senkrecht, das liegen soll, oder liegen alle Teile auf einer Linie, ist eine Drehung oder die zweite Schleife falsch.
- `COL_`-Körper **nie** über `.visible` an- oder ausschalten (das Spiel blendet sie aus; sichtbar geschaltet erscheinen sie als weiße Fläche). Bewegliche Kollision (Tür offen/zu) über `col.userData.aktiv = true/false` kennzeichnen.

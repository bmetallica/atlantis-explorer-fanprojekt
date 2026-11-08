# Bauanleitung: Räume für das Atlantis-Spiel (Stargate Atlantis)

Du baust **einen Raum** als JavaScript-Modul (three.js): eine **leere Raumhülle** (Boden, Wände, Decke, Türöffnungen, Fenster, Säulen, Treppen/Galerien, fest eingebaute Architektur). Möbel und Geräte kommen NICHT hinein – sie werden später als fertige Objekte an deinen `PLACE_`-Punkten eingesetzt.

## Pflichtregeln
- Datei `<name>.js`, ES-Modul, nur `import * as THREE from 'three';`. `export function create(opts = {})` gibt eine `THREE.Group` zurück, dazu `export const steckbrief = { name, art: 'Raum', masse, wohin, benutzen, lichter, animation, quelle }`.
- **1 Einheit = 1 m**, +Y oben. **Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.** Haupteingang an der Seite **−Z**.
- **Leer:** keine Tische, Konsolen, Betten, Geräte. Erlaubt ist nur Architektur (inkl. eingebauter Lichtleisten, Wandpaneele, Fenster, Buntglas, Treppen, Podeste, Galerien, Geländer). Auch wenn die Beschreibung Möbel erwähnt (Schreibtisch, Stuhl, Lampe, Regal, Bett) und kein passendes Objekt in der Liste steht: NICHT selbst bauen, sondern weglassen. Die Fläche bleibt frei.
- **Keine Rundbögen:** Fenster, Nischen, Durchgänge und Wandfelder sind eckig (Rechteck, Dreieck, 30°/60°-Polygon). Rund nur bei Maschinen, Bodenintarsien und Deckenöffnungen. Die Prüfung meldet Bögen in Wänden als FEHLER, ebenso Bauteile mit Möbelnamen (tisch, stuhl, lampe, regal, konsole, …).
- **`PLACE_OBJ-xxx`** (leeres `THREE.Object3D`) für **jedes** Objekt aus der Objektliste des Auftrags, bei mehreren Exemplaren `PLACE_OBJ-xxx_2`, `_3` … Position = Fußpunkt des Objekts laut seiner Art (Standobjekt auf dem Boden, Wandobjekt an der Wandinnenfläche, Deckenobjekt an der Decke), `rotation.y` so, dass die Objekt-Vorderseite (+Z des Objekts) in den Raum bzw. zum Spieler zeigt. Abstände nach den angegebenen Objektmaßen, nichts überlappt, Wege ≥ 1,2 m frei.
- **Türen:** In jede Türöffnung (2,4 × 3 m) kommt die fertige Antiker-Schiebetür **`PLACE_OBJ-091`** (`_2`, `_3` …): Position = Mitte der Öffnung am Boden **in der Wandmitte**, `rotation.y` so, dass +Z in den Raum zeigt. Die Tür hat eine Zarge von 3,34 × 3,74 m und schiebt ihre Flügel je 1,2 m seitlich in die Wand – dort 1,2 m Wand ohne weitere Öffnung lassen und die Öffnung im Mauerwerk 2,4 × 3,0 m groß machen (die Zarge deckt die Kanten). Offene Durchgänge ohne Tür (Torbögen, Galerien) bekommen kein PLACE_OBJ-091.
- **`DOOR_<name>`** (leeres `Object3D`) mitten in jeder Türöffnung am Boden, `rotation.y` zeigt nach außen, `userData = { breite, hoehe, ziel, raum }` – `raum` ist die Raum-ID des Nachbarraums aus der Raumliste (z. B. `'ATL-049'` für Korridore, `'ATL-003'`), `ziel` ein kurzer Klartext; die IDs bilden später den Raumgraphen fürs abschnittsweise Laden im Spiel. Mindestens ein Eingang. Öffnungen mindestens 2,4 × 3 m.
- **Decke** als eigene Meshes mit Namen, die mit `decke` beginnen.
- **Kollision** `COL_`-Boxen: Boden, Wände (an Türen geteilt), Decke, Säulen, Treppen als Rampen. Nie `COL_` über `.visible` schalten.
- **Licht:** 2–8 `LAMP_` (`userData = { color, intensity, distance }`).
- ≤ 30 000 Dreiecke; Wiederholtes (Paneele, Fugen, Lichtsegmente, Säulen) als `InstancedMesh`. Geschlossene Körper, Wände mit Dicke 0,3 m.
- Gib immer die **komplette Datei** aus.

## Material-Kürzel (werden im Spiel durch Spielmaterialien ersetzt)
`new THREE.MeshStandardMaterial({ name: 'KIT_wall' })` – verfügbar: KIT_wall, KIT_wallDark, KIT_copper, KIT_pillar, KIT_hull, KIT_floor, KIT_floorUpper, KIT_ceiling, KIT_stair, KIT_door, KIT_glass, KIT_rail, KIT_glow, KIT_amberGlow. Eigene Materialien (Buntglas-Canvas-Texturen, Patina-Grün `0x3f6b5c`, Lichtleisten) sind erwünscht.

## Raum-Tipps
- Grundriss zuerst als Liste von Wandsegmenten (Start-/Endpunkt in X/Z) planen; jedes Segment als Box mit Länge = Abstand, `rotation.y = -Math.atan2(dz, dx)`, Position = Segmentmitte. Polygonale Räume (6/8 Ecken) mit Winkeln von 30°/60°.
- Türöffnung = Wandsegment in drei Teile teilen (links, rechts, Sturz über 3 m).
- Fensterfronten: Rahmen (KIT_copper) + Glasfläche (Buntglas-Textur oder KIT_glass), keine Kollision durch Fenster nach außen nötig, aber `COL_` für die Fensterwand.
- Ebenen/Galerien: Boden der Galerie als Box mit Unterkante, Geländer (KIT_rail) 1,1 m, Treppen mit 0,25-m-Stufen.
- Prüfe den Render (von oben ohne Decke und innen auf Augenhöhe): stehen alle PLACE_-Objekte sinnvoll und frei, passen Türen und Fenster, wirkt der Raum wie in den Bildern?
- Räume brauchen **keine** `userData.actions`. Falls doch (z. B. Licht dimmen, Lockdown), dann als **Array** `[{ id, label, run }]` mit echter `run()`-Funktion.
- Alle Teile (auch Bodenfugen, Intarsien, Leisten) müssen **innerhalb** der Raumhülle liegen – Längen aus den Raummaßen berechnen, nicht aus Feldanzahlen eines anderen Raums.
- Die Raumbeschreibung im Auftrag ist maßgeblich; bei Widerspruch zu den Bildern gilt die Beschreibung (sie ist geprüft).

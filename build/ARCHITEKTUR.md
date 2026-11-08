# Architektur von Atlantis – verbindliche Gestaltungsregeln für Räume

Quellen: Produktionsangaben (Bridget McGuire, James Robbins, Brad Wright), Setpläne (Mallozzi „Halls & Corridors“, „Hallways Outer City“), Screencaps.

## Grundcharakter
- **Hell, offen, luftig** (bewusster Gegensatz zur dunklen SGC): große Fenster, viel indirektes Licht, hohe Räume. Nur technische Räume (Energie, Stuhl-Raum, Lager) sind dunkler und blauer.
- **Frank-Lloyd-Wright-Einfluss** (Price Tower): Geometrie aus **gleichseitigen Dreiecken**, Wände fast immer in **30°- bzw. 60°-Winkeln** zueinander, polygonale (sechs-/achteckige) Grundrisse. **Runde Formen nur für Maschinen** und besondere Räume (Konferenzraum, Stuhl-Raum, ZPM-Raum).
- **Schneeflocken-Motiv** (aus SG-1 „Lost City“): verzweigte, symmetrische Ornamente mit rechtwinkligen Ästen – in Glas, Bodenintarsien, Wandpaneelen.
- **Säulen** sind allgegenwärtig: schlanke, oft schräg gestellte Säulen/Pfeiler in Korridoren und Hallen.

## Farben (Kupfer-Palette nach Brad Wright: Kupfer in allen Oxidationsstufen)
| Rolle | Farbe | Material im Spiel |
|---|---|---|
| Wände (Grundfläche) | Silbergrau mit Blaustich bis Grau-Grün | `KIT_wall` |
| Akzentwände, Paneelflächen | Stahlblau / Blaugrün (Patina) | `KIT_wallDark` |
| Kanten, Rahmen, Sockelleisten, Türeinfassungen | Bronze / Kupfer, leicht glänzend | `KIT_copper` |
| Säulen | Helles Perlgrau | `KIT_pillar` |
| Boden | Dunkles Bronzegrau, mit Kupfer-/Grün-Einfassung und Intarsien | `KIT_floor` (Obergeschoss `KIT_floorUpper`) |
| Decke | Graphit, mit Lichtfeldern | `KIT_ceiling` |
| Treppen | Treppen-Bronze | `KIT_stair` |
| Geländer | glänzende Bronze | `KIT_rail` |
| Lichtlinien, Anzeigen | Eisblau (Standard) bzw. Bernstein (warme Bereiche) | `KIT_glow` / `KIT_amberGlow` |
| Glas, Fenster | blau getönt | `KIT_glass` |
Akzentfarben für Buntglas: Bernstein/Gold, Orange, Rot, Türkis, Blaugrün. **Kein Rost, kein Schmutz.**

## Bauelemente
- **Wandpaneele („plant-ons“):** Wände sind in senkrechte Felder von ca. 1,2 m Breite gegliedert; jedes zweite Feld trägt ein erhabenes Zierpaneel (2–4 cm vorstehend, Bronzerahmen, stahlblaue oder graue Fläche mit eingelassenem Lineament). Unten eine **Sockelleiste** (0,15 m, Bronze), oben ein **Gesims** (0,1 m).
- **Senkrechte Lichtleisten:** schmale (5–8 cm), weiß-eisblau leuchtende Streifen in Wandfugen bzw. in kurzen Reihen („Lichtschlitze“, 3–6 kurze Segmente übereinander) – typisches Atlantis-Merkmal.
- **Türen:** zweiflügelige Schiebetüren mit polygonaler Kontur (oben abgeschrägt), Einfassung in Bronze, Türfläche dunkelgrau mit Ornament; daneben in 1,2 m Höhe ein **Türpaneel** (OBJ-052, ovales Modul mit drei blauen Leuchtfeldern). Durchgang im Spiel: **2,4 m breit, 3 m hoch** (`b.door`).
- **Fenster:** große, gerahmte Fensterfronten, teils **Buntglas** (Canvas-Textur mit geometrischen, gebäude- bzw. schneeflockenartigen Motiven in Bernstein, Gold, Türkis); im Spiel `KIT_glass` mit eigener emissiver Buntglas-Textur.
- **Boden:** große Platten (1,2 × 1,2 m oder Dreiecks-/Sechseckraster), umlaufender **grün-kupferner Rand**, in größeren Räumen Intarsien (Kreis/Schneeflocke) in Kupfer.
- **Decke:** Graphit, abgehängte Felder mit indirektem Licht entlang der Kanten; in hohen Räumen Kassetten.
- **Wandleuchten** (OBJ-053) in ca. 2,2 m Höhe, Abstand 3–4 m.

## Raster und Maße
- Raster **1,2 m** (Wandfelder, Bodenplatten). Wanddicke **0,3 m**, Decke **0,3 m dick**.
- Raumhöhe: Korridore **4 m**, normale Räume **4,5–6 m**, Hallen (Torhalle, Kantine) **8–14 m**.
- Durchgänge mindestens 2,4 × 3 m. Stufen 0,25 m (sonst Rampe).

## Regeln für Raum-Modelle (Spiel)
- Ein Raum ist eine **leere Hülle**: Boden, Wände, Decke, Türöffnungen, Fenster, Säulen, Treppen/Galerien, fest eingebaute Architektur (Lichtleisten, Paneele). **Keine Möbel, keine Objekte aus der Objekt-Datenbank.**
- **Ursprung:** Mitte des Raumbodens (Bodenoberkante y = 0), Hauptzugang/Haupttür an der Seite **−Z** (Spieler betritt den Raum Richtung +Z), sofern nicht anders angegeben.
- **Objektplätze:** Für jedes Objekt aus `objekte` des Raums ein leeres `THREE.Object3D` mit Name **`PLACE_OBJ-xxx`** (bei mehreren gleichen: `PLACE_OBJ-xxx_2` …) an sinnvoller Stelle: Position = Fußpunkt/Ursprung des Objekts (Standobjekt: auf dem Boden, Wandobjekt: an der Wandfläche, Rückseite an der Wand, Vorderseite zeigt in den Raum), `rotation.y` so, dass die Objekt-Vorderseite (+Z des Objekts) richtig zeigt. Maße der Objekte stehen im Auftrag.
- **Türen/Anschlüsse:** Für jede Türöffnung ein leeres `Object3D` **`DOOR_<name>`** in der Mitte der Öffnung am Boden, `rotation.y` zeigt nach außen; `userData = { breite, hoehe, ziel: '<Raum-ID oder Beschreibung>' }`.
- **Decke** als eigene Meshes mit Namen `decke…` (der Viewer blendet sie zum Hineinsehen aus).
- **Kollision:** `COL_`-Boxen für Boden, Wände (mit Aussparungen für Türen), Decke, große Säulen, Treppenrampen. Keine COL_ in Türöffnungen.
- **Licht:** 2–8 `LAMP_`-Punkte (eisblau `#9fd8ff` bzw. warm `#ffd8a0`), intensity 6–15, distance je nach Raumgröße.
- Dreiecke: Raum ≤ 30 000. Wiederholte Elemente (Paneele, Lichtsegmente, Bodenplatten) als `InstancedMesh`.

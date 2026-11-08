# Objekte bauen für das Atlantis-Spiel

So baust du ein Objekt (Möbel, Konsole, Kiste, Säule, Gerät …), das ohne Umbau ins Spiel übernommen werden kann.
Ein Objekt ist **eine Datei** in `src/level/props/`. Der Dateiname ist der Objektname.

| Weg | Datei | Für wen |
|---|---|---|
| **Modell** (empfohlen) | `src/level/props/<name>.glb` | Blender oder ein anderes 3D-Programm |
| **Code** | `src/level/props/<name>.js` | Einfache Formen aus Boxen und Zylindern (Vorlage: `_vorlage.js`) |

Dateinamen: nur Kleinbuchstaben, Ziffern und `_`, keine Umlaute oder Leerzeichen (`wandkonsole.glb`, `bett_quartier.glb`).
Dateien, die mit `_` beginnen, sind Vorlagen und werden nicht geladen.

---

## 1. Maßstab, Ausrichtung, Ursprung

| Regel | Wert |
|---|---|
| Einheit | **1 Einheit = 1 Meter** (in Blender: Szene → Einheiten → Metrisch, Maßstab 1.0) |
| Oben | +Y im Spiel (Blender: +Z; der glTF-Export rechnet das automatisch um) |
| **Vorderseite** | Zeigt im Spiel nach **+Z**. In Blender nach **−Y**: die Vorderansicht (Numpad 1) zeigt die Vorderseite |
| **Ursprung** | Standobjekt: **Mitte der Unterseite** (Objekt steht auf dem Boden). Wandobjekt: **Mitte der Unterkante der Rückseite** |
| Transformationen | Vor dem Export **anwenden** (Strg+A → Alle Transformationen); Skalierung 1, Drehung 0 |

### Größen im Spiel (zum Vergleich)

| Was | Maß |
|---|---|
| Spielfigur (Kollision) | Höhe **1,37 m**, Radius **0,31 m**, Augenhöhe **1,22 m** |
| Türen (`b.door`) | 2,4 m breit, 3 m hoch |
| Treppenstufe | 0,25 m (höhere Kanten kann der Spieler nicht hochlaufen, dafür Rampe oder Treppe) |
| Raumhöhe Transporter-Räume | 6 m (Frachtraum 8 m), Decke 0,3 m dick |
| Durchgang, damit der Spieler durchpasst | mind. 0,7 m breit, 1,5 m hoch |

Die Welt ist in echten Metern gebaut (Tische ca. 0,75 m, Türen 3 m). Die Spielfigur ist mit 1,37 m etwas klein (Counter-Strike-Maße), also nicht an der Figur messen, sondern an realen Maßen.

---

## 2. Namensregeln (das eigentliche Muster)

Das Spiel liest die Namen der Objekte und Materialien in deiner Datei. Daran erkennt es, was Kollision, Licht oder ein Schalter ist.

| Name | Art | Bedeutung im Spiel |
|---|---|---|
| `COL_…` | Mesh | **Unsichtbarer Kollisionskörper.** Sobald es mindestens einen gibt, kollidieren *nur* die `COL_`-Meshes. Einfache Boxen reichen. |
| `INT_<id>` | Empty | **Benutzen-Punkt**: Steht der Spieler nah genug davor, erscheint `[E] <label>`. |
| `LAMP_…` | Empty | **Lichtquelle** an dieser Stelle (das Spiel teilt die echten Lichter automatisch zu) |
| Material `KIT_<name>` | Material | Wird durch das **Spielmaterial** ersetzt, damit dein Objekt genauso aussieht wie die Wände, Böden usw. im Spiel |
| alles andere | Mesh | Sichtbar, mit deinem eigenen Material/Texturen |

Gibt es kein `COL_`-Mesh, kollidieren alle sichtbaren Teile. Für Objekte mit vielen Polygonen deshalb immer `COL_`-Boxen anlegen.

### Eigenschaften (in Blender: Objekt-Eigenschaften → Benutzerdefinierte Eigenschaften)

| Für | Eigenschaft | Standard | Beispiel |
|---|---|---|---|
| `INT_…` | `label` (Text) | die id | `Konsole benutzen` |
| `INT_…` | `radius` (Zahl, m) | 1 | `0.8` |
| `LAMP_…` | `color` (Text) | `#ffb060` (Bernstein) | `#6fe3ff` (Eisblau) |
| `LAMP_…` | `intensity` (Zahl) | 15 | `10` |
| `LAMP_…` | `distance` (Zahl, m) | 10 | `8` |

Was beim Benutzen passiert (Tür öffnen, Menü, Teleport …), wird beim Einbau im Code festgelegt. Ohne Aktion zeigt das Spiel beim Drücken von E einen Hinweis „noch keine Aktion“. Damit lässt sich prüfen, ob der Punkt richtig sitzt.

### Spielmaterialien (`KIT_…`)

| Material | Aussehen |
|---|---|
| `KIT_wall` | Silbergrau mit Blaustich, Plattenrelief (Standardwand) |
| `KIT_wallDark` | Stahlblau |
| `KIT_copper` | Bronze, leicht glänzend (Akzente, Kanten, Sockel) |
| `KIT_pillar` | Helles Perlgrau (Säulen) |
| `KIT_hull` | Perlweiß (Außenhaut) |
| `KIT_floor` / `KIT_floorUpper` | Dunkles Bronzegrau (Boden) |
| `KIT_ceiling` | Graphit |
| `KIT_stair` | Treppen-Bronze |
| `KIT_door` | Türmetall |
| `KIT_glass` | Blaues, durchsichtiges Glas |
| `KIT_rail` | Glänzende Bronze (Geländer) |
| `KIT_glow` | **Leuchtend Eisblau** (Lichtstreifen, Anzeigen) |
| `KIT_amberGlow` | **Leuchtend Bernstein** |

Stil (Ancient-Look): Perl-/Silbergrau und Stahlblau, Bronze-Akzente, eisblaue oder bernsteinfarbene Lichtlinien, **kein Rost, kein Schmutz**.
Eigene Materialien und Texturen sind erlaubt; sie sollten sich an diese Farben halten.

---

## 3. Technische Grenzen

| Was | Grenze |
|---|---|
| Polygone | Kleinobjekt ≤ 5 000 Dreiecke, großes Objekt ≤ 30 000 |
| Texturen | max. 1024×1024 (große Objekte 2048), PNG/JPG/WebP, **in das GLB eingebettet** |
| Dateigröße | möglichst < 2 MB pro Objekt (Draco-Kompression ist erlaubt) |
| Materialien | PBR (Principled BSDF): Basisfarbe, Metallic, Roughness, Normal, Emission |
| Animation | Erlaubt, läuft im Spiel in Endlosschleife. Bewegte Teile **nicht** als Kollision nutzen, sondern feste `COL_`-Box drumherum |
| Kollision | `COL_`-Körper geschlossen und einfach halten (Boxen, wenige Flächen) |

---

## 4. Export aus Blender (glTF 2.0)

Datei → Exportieren → **glTF 2.0 (.glb/.gltf)**:

- Format: **glTF Binär (.glb)**
- Einschließen: ☑ **Benutzerdefinierte Eigenschaften** (sonst fehlen `label`, `color` …)
- Einschließen: ☐ Lichter, ☐ Kameras (Lampen über `LAMP_`-Empties)
- Transformation: ☑ **+Y nach oben**
- Daten → Mesh: ☑ Modifikatoren anwenden, ☑ UVs, ☑ Normalen
- Optional: Daten → Kompression ☑ (Draco)

Speichern unter `src/level/props/<name>.glb`.

Zum Nachschauen liegt ein fertiges Beispiel bei: `src/level/props/beispiel_lichtsaeule.glb` (in Blender über Importieren → glTF öffnen).
Es enthält ein sichtbares Mesh mit `KIT_pillar`/`KIT_copper`/`KIT_glow`, eine `COL_saeule`-Box, ein `INT_panel` mit `label` und `radius` und ein `LAMP_oben` mit `color`.

### Objektbaum eines typischen Objekts

```
wandkonsole               (Empty oder Mesh, Ursprung Mitte Rückseite unten)
├── gehaeuse              Mesh, Material KIT_wall
├── rahmen                Mesh, Material KIT_copper
├── bildschirm            Mesh, eigenes Material mit Emission
├── COL_gehaeuse          Mesh (einfache Box), wird unsichtbar
├── INT_bedienen          Empty vor dem Bildschirm   label="Konsole bedienen", radius=0.8
└── LAMP_bildschirm       Empty                      color="#6fe3ff", intensity=6, distance=4
```

---

## 5. Prüfen im Schaukasten

Das Spiel läuft als Docker-Container. Neue oder geänderte Objekte sind erst nach einem Neubau des Images zu sehen:

```bash
cd /opt/game
docker compose up -d --build
```

Dann im Browser: **`http://<server>:8081/?level=props`**

Der Schaukasten stellt **alle** Objekte aus `src/level/props/` in einer Reihe auf, mit Namensschild, 1-m-Bodenraster und einer durchsichtigen Spielerfigur (1,37 m) zum Größenvergleich. Prüfe dort:

- [ ] Steht das Objekt auf dem Boden (nicht schwebend, nicht eingesunken)?
- [ ] Zeigt die Vorderseite zum Startpunkt?
- [ ] Stimmt die Größe neben der Spielerfigur?
- [ ] Kollision: Hineinlaufen, Draufspringen (N = Noclip zum Durchfliegen)
- [ ] `[E]`-Hinweis erscheint am richtigen Punkt
- [ ] Lichter und Leuchtflächen sind sichtbar
- [ ] Ein **rotes Drahtgitter** heißt: Objekt nicht gefunden (Dateiname?). Weitere Hinweise stehen in der Browser-Konsole (F12)

---

## 6. Einbau ins Level (Code)

In einem Raum (z. B. `src/level/tower/rooms/lab.js`):

```js
export function buildLab(b, m) {
  // m = { cx, cz, y, top } – Raummitte, Bodenhöhe, Deckenhöhe
  b.prop('ancient_kiste', [m.cx + 3, m.y, m.cz - 4]);
  b.prop('beispiel_lichtsaeule', [m.cx, m.y, m.cz], {
    rotY: Math.PI / 2,             // Drehung um die Hochachse (Bogenmaß; Math.PI = 180°)
    scale: 1,                      // gleichmäßige Skalierung
    collide: true,                 // ohne COL_: true = Mesh-Kollision, 'box' = Hüllbox, false = keine
    actions: {
      panel: () => ({ menu: { title: 'Lichtsäule', options: [
        { label: 'Ein', run: () => {} },
        { label: 'Aus', run: () => {} },
      ] } }),
    },
  });
}
```

Eine Aktion darf `{ menu }` (Auswahlmenü) oder `{ teleport: { position, yaw } }` zurückgeben, siehe `src/main.js`.

---

## 7. Steckbrief (bitte zu jedem neuen Objekt ausfüllen)

```
Name (Dateiname):     wandkonsole
Datei:                src/level/props/wandkonsole.glb
Art:                  Standobjekt / Wandobjekt / Deckenobjekt
Maße (B × H × T, m):  1.2 × 1.6 × 0.4
Wohin im Spiel:       Labor (Ost-Pier), Nordwand, 2×
Benutzen-Punkte:      INT_bedienen → was soll passieren?
Lichter:              LAMP_bildschirm (eisblau)
Animation:            keine / Name + Beschreibung
Quelle / Lizenz:      selbst gebaut / CC0 / CC BY (Urheber nennen)
```

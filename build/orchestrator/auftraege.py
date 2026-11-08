# Erzeugt build/auftraege/OBJ-xxx/{auftrag.md, bilder/*.jpg} aus der Datenbank.
import json, os, re, sys, urllib.request
from PIL import Image
API = "http://localhost:8324"
BUILD = "/root/sga/build"
IMG = "/root/sga/assets/images"
NAMES = {
 "OBJ-002": "dhd_atlantis", "OBJ-003": "sensor_display", "OBJ-004": "control_chair", "OBJ-005": "zpm",
 "OBJ-006": "medical_scanner", "OBJ-007": "grounding_station", "OBJ-008": "stasis_pod", "OBJ-009": "puddle_jumper",
 "OBJ-010": "conference_table", "OBJ-012": "sensor_console", "OBJ-013": "commander_desk", "OBJ-014": "aux_console",
 "OBJ-015": "patient_bed", "OBJ-016": "surgical_table", "OBJ-017": "quarantine_emitter", "OBJ-018": "containment_chamber",
 "OBJ-019": "dna_sequencer", "OBJ-020": "research_terminal", "OBJ-021": "nanite_machine", "OBJ-022": "hydroponic_table",
 "OBJ-023": "diagnostics_station", "OBJ-024": "attero_control_key", "OBJ-025": "society_console", "OBJ-026": "ascension_machine",
 "OBJ-027": "bantos_rods", "OBJ-028": "crystal_database_pillar", "OBJ-029": "holo_projector", "OBJ-030": "armory_locker",
 "OBJ-031": "holding_cell", "OBJ-032": "drone", "OBJ-033": "drone_launcher", "OBJ-034": "cargo_transporter_pad",
 "OBJ-035": "halon_system", "OBJ-036": "power_distribution_node", "OBJ-037": "zpm_hub", "OBJ-038": "jumper_bay_hatch",
 "OBJ-039": "hangar_door", "OBJ-040": "naquadah_generator_mk2", "OBJ-041": "desalination_tank", "OBJ-042": "balcony_balustrade",
 "OBJ-043": "transporter_cabin", "OBJ-044": "city_shield_emitter", "OBJ-045": "stardrive_console", "OBJ-046": "inertial_dampener",
 "OBJ-047": "subspace_comm_array", "OBJ-048": "control_crystal", "OBJ-049": "personal_shield", "OBJ-050": "healing_device",
 "OBJ-051": "biometric_panel", "OBJ-052": "door_panel", "OBJ-053": "wall_sconce", "OBJ-054": "life_support_regulator",
 "OBJ-055": "cloak_generator", "OBJ-056": "data_pad", "OBJ-057": "pressure_suit", "OBJ-058": "sonic_shower",
 "OBJ-059": "particle_magnum", "OBJ-060": "wraith_handblaster", "OBJ-061": "wraith_stunner_rifle", "OBJ-062": "p90",
 "OBJ-063": "c4_charge", "OBJ-064": "tactical_vest", "OBJ-065": "life_signs_detector", "OBJ-066": "defibrillator",
 "OBJ-067": "medkit_backpack", "OBJ-068": "patient_monitor", "OBJ-069": "toughbook", "OBJ-070": "crystal_reader",
 "OBJ-071": "subspace_detector", "OBJ-072": "ult_freezer", "OBJ-073": "map_table", "OBJ-074": "alert_beacon",
 "OBJ-075": "relay_spire", "OBJ-076": "jumper_cockpit", "OBJ-077": "jumper_ramp", "OBJ-078": "jumper_charger",
 "OBJ-079": "pallet_jack", "OBJ-080": "equipment_case", "OBJ-081": "bed_quarters", "OBJ-082": "coffee_station",
 "OBJ-083": "athosian_tea_set", "OBJ-084": "weight_bench", "OBJ-085": "water_dispenser", "OBJ-086": "glowstick",
 "OBJ-087": "microtome", "OBJ-088": "spectral_column", "OBJ-089": "nutrient_mixer", "OBJ-090": "daedalus_comm_terminal",
 "OBJ-092": "mess_table", "OBJ-093": "mess_chair", "OBJ-094": "lounge_sofa", "OBJ-095": "serving_counter", "OBJ-096": "potted_plant",
}
# Bauhinweise für Sonderfälle (Art, Maßstab, Abgrenzung)
HINTS = {
 "OBJ-092": "Standobjekt: Tisch 1,50 × 0,75 × 0,75 m (B × H × T), schlichtes irdisches Mobiliar, KEIN Antiker-Design. Keine Funktionen nötig. Geringe Dreieckszahl (< 1 500), wird oft 10× im Raum stehen.",
 "OBJ-093": "Standobjekt: Stuhl 0,48 × 0,82 × 0,52 m, Sitzseite = +Z. Keine Funktionen. Sehr geringe Dreieckszahl (< 1 000) und wenige Meshes, wird 30–40× im Raum stehen.",
 "OBJ-094": "Standobjekt: Sofa 2,10 × 0,80 × 0,85 m, Sitzseite = +Z. Keine Funktionen. Geringe Dreieckszahl (< 2 000).",
 "OBJ-095": "Standobjekt an der Wand: Theke 4,80 × 0,90 × 0,90 m (+ Spuckschutz bis ca. 1,45 m), Bedienseite/Tablettrutsche = +Z, Rückseite steht an der Wand. Funktion: Wärmelampen an/aus, Deckel der Warmhaltebecken öffnen/schließen. Keine Canvas-Displays.",
 "OBJ-096": "Standobjekt: Kübelpflanze Ø ca. 0,9 m (Krone), Höhe 1,80 m. Blattkrone aus wenigen InstancedMesh-Blattgruppen, Dreiecke < 3 000. Optional leichtes Wiegen der Blätter.",
 "OBJ-003": "Standobjekt: hochkant stehendes Display auf schlankem Ständer (ca. 1,2 × 2,0 m), animierte Anzeige (Sensorbild) über Canvas-Textur.",
 "OBJ-005": "Kleinobjekt (ca. 0,12 × 0,30 m). Funktion: aktiv/leer (gelbes Innenleuchten, roter Punkt oben).",
 "OBJ-007": "Großobjekt: Säule ca. 1,8 m Durchmesser, 6 m hoch, mit Bedienkonsole daneben. Funktion: abschalten (Säule teilt sich in zwei Hälften), wieder verbinden.",
 "OBJ-009": "Fahrzeug ca. 8 × 4,7 m (L × H), Länge entlang Z, Cockpit-Front zeigt nach +Z. Funktionen: Heckrampe öffnen/schließen, Antriebsgondeln ausfahren, Tarnung (Transparenz).",
 "OBJ-011": "",
 "OBJ-024": "Kleinobjekt (ca. 0,30 × 0,08 × 0,20 m), liegt flach. Funktion: aktivieren (Leuchtfelder).",
 "OBJ-027": "Zwei Stöcke, liegend nebeneinander auf dem Boden (je ca. 0,75 m).",
 "OBJ-031": "Großobjekt: Zellenkäfig ca. 3 × 2,7 × 3 m. Funktion: Kraftfeld an/aus, Tür öffnen.",
 "OBJ-032": "Kleinobjekt (ca. 0,9 m lang), liegt am Boden. Funktion: aktivieren (gelb-oranges Glühen, Ranken schließen sich).",
 "OBJ-033": "Bodenobjekt: runde, flache Plattform (Ø ca. 6 m, Höhe ≤ 0,4 m). Funktion: Klappen öffnen/schließen.",
 "OBJ-038": "Deckenobjekt: achteckige Luke (Ø ca. 8 m) mit Segmentklappen. Funktion: öffnen/schließen.",
 "OBJ-039": "Wandobjekt: zweiflügeliges Schiebetor ca. 15 × 8 m. Funktion: öffnen/schließen.",
 "OBJ-042": "Wandobjekt (Kante): Brüstungssegment 4 m lang, 1,1 m hoch.",
 "OBJ-043": "Standobjekt: begehbare Kabine (innen ca. 1,6 × 1,6 × 2,6 m), Tür vorn (+Z), Kartenpaneel an der Rückwand. Funktionen: Tür öffnen/schließen, Transport (Lichtblitz). Kollision: Wände als COL_-Boxen, Innenraum frei.",
 "OBJ-044": "Baue den sichtbaren Teil im Raum: einen der zehn Schild-Emitter (Säule/Knoten ca. 1 × 3 m). Funktion: Schild aktiv (Leuchten pulsiert).",
 "OBJ-045": "Baue die Steuerkonsole des Sternenantriebs (Standpult ca. 1,5 m breit). Funktionen: Antrieb vorheizen/zünden (Anzeigen), abschalten.",
 "OBJ-046": "Baue die Matrix als wandhohe Kristallsäulen-Gruppe (Spielergänzung) ca. 2 × 3 m. Funktion: an/aus (Pulsieren).",
 "OBJ-047": "Baue das Antennen-Array als Dachaufbau ca. 2 × 6 m (Mast + Elemente). Funktion: senden (Lichtimpulse).",
 "OBJ-048": "Kleinobjekt: flaches Kristallplättchen (ca. 0,12 × 0,08 × 0,015 m), liegend.",
 "OBJ-049": "Kleinobjekt (ca. 0,07 × 0,02 × 0,05 m). Funktion: aktivieren (Leuchten).",
 "OBJ-052": "Wandobjekt: kleines Paneel ca. 0,10 × 0,30 m, in 1,2 m Höhe (Ursprung trotzdem Unterkante Rückseite des Paneels). Funktion: Tür auf/zu (Leuchtfelder).",
 "OBJ-053": "Wandobjekt: Wandleuchte (Ø ca. 0,2 m), LAMP_ in der Schale. Funktion: an/aus.",
 "OBJ-055": "Baue den Tarnfeld-Generator als Gerät im Raum (Spielergänzung) ca. 1,5 × 2,5 m. Funktion: Tarnung an/aus.",
 "OBJ-057": "Standobjekt: Anzug auf einem Ständer (ca. 0,9 × 2,0 m).",
 "OBJ-058": "Standobjekt: runde Duschkabine Ø 1 m, 2,3 m hoch. Funktion: Reinigung starten (Flimmern).",
 "OBJ-059": "Kleinobjekt, liegt auf der Seite. Funktion: Modus wechseln (orange/rot/grün).",
 "OBJ-060": "Kleinobjekt, liegt auf der Seite. Funktion: laden/feuern (Energiefenster leuchtet).",
 "OBJ-061": "Liegend, ca. 1,1 m lang. Funktion: feuern (Kammern leuchten).",
 "OBJ-062": "Liegend auf der Seite, ca. 0,5 m lang, realistisch nach FN P90.",
 "OBJ-063": "Kleinobjekt: Block ca. 0,28 × 0,05 × 0,05 m mit Zünder. Funktion: Zünder scharf (Countdown-Anzeige blinkt).",
 "OBJ-064": "Standobjekt: Weste auf einem Ständer/Torso (ca. 0,5 × 1,6 m), Headset daneben.",
 "OBJ-065": "Kleinobjekt (ca. 0,15 × 0,09 × 0,02 m) liegend; animierte Anzeige mit wandernden Punkten (Canvas-Textur).",
 "OBJ-072": "Standobjekt: Ultratiefkühlschrank ca. 0,8 × 2,0 × 0,9 m. Funktion: Tür öffnen (Kältenebel optional).",
 "OBJ-074": "Wandobjekt: Leuchtleiste ca. 0,8 × 0,12 m. Funktion: Alarm an/aus (rot pulsierend).",
 "OBJ-075": "Großobjekt: Antennenspitze ca. 1,5 × 8 m. Funktion: Signal senden (Blinklicht).",
 "OBJ-076": "Standobjekt: vorderer Cockpitbereich (2 Sitze, Konsolen, Frontscheibe) ca. 3 × 2 × 2,5 m. Funktion: HUD an/aus.",
 "OBJ-077": "Standobjekt: Heckrampe mit Rahmen ca. 2,6 × 2,4 m. Funktion: öffnen/schließen.",
 "OBJ-081": "Standobjekt: Bett ca. 2 × 1,4 m auf Podest.",
 "OBJ-086": "Kleinobjekt (ca. 0,15 m). Funktion: knicken → leuchtet grün.",
}
TITLE = {"standard": ""}
os.makedirs(f"{BUILD}/auftraege", exist_ok=True)
objs = json.load(urllib.request.urlopen(f"{API}/objects"))["objects"]
rooms = {r["id"]: r["name_de"] for r in json.load(urllib.request.urlopen(f"{API}/rooms"))["rooms"]}
only = set(sys.argv[1:])
for o in objs:
    oid = o["id"]
    if oid not in NAMES or (only and oid not in only):
        continue
    d = f"{BUILD}/auftraege/{oid}"
    os.makedirs(f"{d}/bilder", exist_ok=True)
    bilder = []
    for i, im in enumerate(o.get("images", [])[:3]):
        src = f"{IMG}/{im['file']}"
        if not os.path.exists(src):
            continue
        try:
            img = Image.open(src).convert("RGB")
            img.thumbnail((768, 768))
            out = f"{d}/bilder/ref{i+1}.jpg"
            img.save(out, quality=85)
            bilder.append((f"bilder/ref{i+1}.jpg", im.get("caption") or ""))
        except Exception as e:
            print("Bildfehler", oid, src, e)
    hint = HINTS.get(oid, "")
    txt = f"""# Auftrag {oid}: {o['name_de']}

- **Dateiname / Objektname:** `{NAMES[oid]}.js` (Objektname `{NAMES[oid]}`)
- Englisch: {o.get('name_en') or '—'}
- Vorkommen in Räumen: {', '.join(f"{r} ({rooms.get(r,'?')})" for r in o.get('rooms', [])) or '—'}
{f"- **Bauhinweis:** {hint}" if hint else ""}

## Beschaffenheit
{o.get('beschaffenheit') or '—'}

## Aussehen (Form, Farbe, Größe)
{o.get('ausssehen') or '—'}

## Funktion
{o.get('funktion') or '—'}

## Referenzbilder
{chr(10).join(f"- `{p}`: {c}" for p, c in bilder) or "- keine (nach Beschreibung bauen)"}

Hinweis: Steht im Text „Spielergänzung“, ist das Objekt in der Serie nicht gezeigt – dann nach Beschreibung im Ancient-Stil bauen; die Bilder zeigen dann nur die Umgebung.
"""
    open(f"{d}/auftrag.md", "w").write(txt)
    json.dump({"id": oid, "name": NAMES[oid], "bilder": [p for p, _ in bilder]}, open(f"{d}/auftrag.json", "w"), ensure_ascii=False)
print("Aufträge:", len(os.listdir(f"{BUILD}/auftraege")))

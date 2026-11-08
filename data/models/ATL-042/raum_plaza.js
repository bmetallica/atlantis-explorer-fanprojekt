// Raum ATL-042: Zentraler Innenplatz / Plaza (Inner City, Etage 5)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z. Freiluftplatz: zentral offen, umlaufende Kolonnaden,
// Arkadenöffnungen in der Umfassungsmauer und zwei erhöhte Fußgängerbrücken
// mit Treppen an Nord- und Südseite. Keine Möbel - nur Architektur und Platzhalter.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_plaza',
  art: 'Raum',
  masse: '48 m × 36 m lichte Grundfläche (ca. 1.728 m²), Mauerhöhe 5 m, Platzmitte nach oben offen',
  wohin: 'Zentraler öffentlicher Platz der Atlantis-Innenstadt; Hauptzugang von -Z (Innenstadt-Atrium), Arkadenzugänge an den Seiten',
  benutzen: 'Platz als Treffpunkt und Verkehrsfläche; Platzhalter für Personen-Transporter, Wandleuchten und Trinkwasserbrunnen',
  lichter: '6 LAMP_-Punkte (eisblau) plus Himmel- und Sonnenlicht, warme Akzente über KIT_amberGlow',
  animation: 'Leichte, langsame Helligkeitsmodulation der Wandlichtschlitze und Brunnenakzente',
  quelle: 'Rekonstruktion nach Raumbeschreibung ATL-042, Referenzbilder ref1/ref2 (Inner City Plaza, Säulentor) sowie Setplänen „Halls & Corridors“',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_plaza';

  const W = 48, D = 36, HX = W / 2, HZ = D / 2;
  const WH = 5.0;                    // Mauerhöhe
  const T = 0.3;                     // Wanddicke
  const DOOR_W = 2.4, DOOR_H = 3.0;  // Hauptzugang
  const ARC_W = 3.0, ARC_H = 3.0;    // rechteckige Arkadenöffnungen (Süd)
  const MID_W = 7.2, MID_H = 4.2;    // Mitteldurchgang Nord
  const BR_X = 8.0;                  // Achse der Fußgängerbrücken
  const BR_W = 3.0;                  // Breite der Brücken/Treppen
  const BR_Y = 2.5;                  // Deckhöhe der Brücken
  const STEPS = 10, RISE = 0.25, TREAD = 0.39;
  const ST_RUN = STEPS * TREAD;      // 3.9 m Lauflänge
  const ST_S0 = -17.7, ST_S1 = ST_S0 + ST_RUN; // Südtreppe: Fuß -17.7, Kopf -13.8
  const ST_N0 = 13.8, ST_N1 = ST_N0 + ST_RUN;  // Nordtreppe: Kopf 13.8, Fuß 17.7
  const DECK_LEN = ST_N0 - ST_S1;    // Brückendeck zwischen beiden Treppen

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const stairMat = kit('stair');
  const railMat = kit('rail');
  const glowMat = kit('glow');
  const amberMat = kit('amberGlow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const amberLine = new THREE.MeshStandardMaterial({
    name: 'akzentlicht', color: 0xffe3b8, emissive: 0xffb45c, emissiveIntensity: 1.25, roughness: 0.5,
  });

  const dummy = new THREE.Object3D();
  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((it, i) => {
      dummy.position.set(it[0], it[1], it[2]);
      dummy.rotation.set(it[7] || 0, it[3] || 0, it[8] || 0);
      dummy.scale.set(it[4] ?? 1, it[5] ?? 1, it[6] ?? 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  const colBox = (name, w, h, d, x, y, z, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.x = rotX;
    m.visible = false;
    root.add(m);
    return m;
  };

  // ------------------------------------------------------------------ Boden
  box(W + 2 * T, 0.12, D + 2 * T, floorMat, 0, -0.06, 0, 'boden_plaza');
  box(0.24, 0.014, D + 2 * T, patina, -(HX - 0.12), 0.008, 0);
  box(0.24, 0.014, D + 2 * T, patina, (HX - 0.12), 0.008, 0);
  box(W + 2 * T, 0.014, 0.24, patina, 0, 0.008, -(HZ - 0.12));
  box(W + 2 * T, 0.014, 0.24, patina, 0, 0.008, (HZ - 0.12));

  // Plattenfugen im 1,2-m-Raster
  const fugX = [], fugZ = [];
  for (let i = 0; i <= 40; i++) fugX.push([-HX + i * 1.2, 0.006, 0]);
  for (let j = 0; j <= 30; j++) fugZ.push([0, 0.006, -HZ + j * 1.2]);
  inst(new THREE.BoxGeometry(0.02, 0.008, D), copper, fugX, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(W, 0.008, 0.02), copper, fugZ, 'boden_fugen_z');

  // zentrale Bodenschneeflocke (rund nur als Bodenintarsie zulässig)
  const ring = add(new THREE.RingGeometry(2.6, 2.78, 6), copper, 0, 0.014, 0, 'boden_intarsie_ring');
  ring.rotation.x = -Math.PI / 2;
  const spokes = [];
  for (let i = 0; i < 6; i++) spokes.push([0, 0.014, 0, (i * Math.PI) / 3]);
  inst(new THREE.BoxGeometry(0.09, 0.01, 5.2), copper, spokes, 'boden_intarsie_flache');
  const hub = add(new THREE.CircleGeometry(0.58, 6), patina, 0, 0.016, 0, 'boden_intarsie_mitte');
  hub.rotation.x = -Math.PI / 2;

  // ------------------------------------------------------------------ Umfassungsmauer
  // Südwand: Haupttür (2,4 m) + zwei rechteckige Arkadenöffnungen (3,0 × 3,0 m) bei x = ±8
  const southSolid = [[-HX, -9.5], [-6.5, -1.2], [1.2, 6.5], [9.5, HX]];
  const northSolid = [[-HX, -3.6], [3.6, HX]];

  const wallRun = (axis, fixed, ranges, name) => {
    ranges.forEach((r, i) => {
      const a = r[0], b = r[1], len = b - a, mid = (a + b) / 2;
      const w = axis === 'x' ? len : T, d = axis === 'x' ? T : len;
      const x = axis === 'x' ? mid : fixed, z = axis === 'x' ? fixed : mid;
      box(w, WH, d, wall, x, WH / 2, z, `wand_${name}_${i}`);
      colBox(`COL_wand_${name}_${i}`, w, WH, d, x, WH / 2, z);
    });
  };
  wallRun('x', -HZ - T / 2, southSolid, 'sued');
  wallRun('x', HZ + T / 2, northSolid, 'nord');
  wallRun('z', -HX - T / 2, [[-HZ, HZ]], 'west');
  wallRun('z', HX + T / 2, [[-HZ, HZ]], 'ost');

  // Sturz über dem Haupttür
  box(DOOR_W, WH - DOOR_H, T, wall, 0, DOOR_H + (WH - DOOR_H) / 2, -HZ - T / 2, 'wand_sued_sturz_tuer');
  colBox('COL_wand_sued_sturz_tuer', DOOR_W, WH - DOOR_H, T, 0, DOOR_H + (WH - DOOR_H) / 2, -HZ - T / 2);
  box(DOOR_W + 0.16, 0.14, 0.1, copper, 0, DOOR_H, -HZ - T / 2, 'tuer_einfassung_oben');
  for (const s of [-1, 1]) box(0.1, DOOR_H, 0.1, copper, s * (DOOR_W / 2 + 0.05), DOOR_H / 2, -HZ - T / 2, 'tuer_einfassung_seite');

  // Stürze über den beiden südlichen Arkadenöffnungen (rechteckig, kein Bogen)
  for (const s of [-1, 1]) {
    box(ARC_W, WH - ARC_H, T, wall, s * BR_X, ARC_H + (WH - ARC_H) / 2, -HZ - T / 2, `wand_sued_sturz_durchgang_${s}`);
    colBox(`COL_wand_sued_sturz_durchgang_${s}`, ARC_W, WH - ARC_H, T, s * BR_X, ARC_H + (WH - ARC_H) / 2, -HZ - T / 2);
    box(ARC_W + 0.14, 0.12, 0.1, copper, s * BR_X, ARC_H, -HZ - T / 2, `durchgang_einfassung_oben_${s}`);
    for (const e of [-1, 1]) {
      box(0.1, ARC_H, 0.1, copper, s * BR_X + e * (ARC_W / 2 + 0.05), ARC_H / 2, -HZ - T / 2, `durchgang_einfassung_seite_${s}_${e}`);
    }
  }

  // Sturz über dem Mitteldurchgang im Norden
  box(MID_W, WH - MID_H, T, wall, 0, MID_H + (WH - MID_H) / 2, HZ + T / 2, 'wand_nord_sturz_mitteldurchgang');
  colBox('COL_wand_nord_sturz_mitteldurchgang', MID_W, WH - MID_H, T, 0, MID_H + (WH - MID_H) / 2, HZ + T / 2);
  box(MID_W + 0.16, 0.14, 0.1, copper, 0, MID_H, HZ + T / 2, 'mitteldurchgang_einfassung_oben');
  for (const s of [-1, 1]) box(0.1, MID_H, 0.1, copper, s * (MID_W / 2 + 0.05), MID_H / 2, HZ + T / 2, `mitteldurchgang_einfassung_seite_${s}`);

  // ------------------------------------------------------------------ Kolonnaden
  const colPos = [];
  for (const sx of [-1, 1]) for (let z = -16; z <= 16; z += 4) colPos.push([sx * 21.5, z]);
  for (const x of [-20, -16, -12, 12, 16, 20]) { colPos.push([x, 15.4]); colPos.push([x, -15.4]); }
  colPos.push([-1.8, -17.4], [1.8, -17.4]);          // Tür flankierende Pfeiler
  colPos.push([-4.2, 17.4], [4.2, 17.4]);            // Mitteldurchgang flankierende Pfeiler
  const shafts = colPos.map(([x, z]) => [x, 2.1, z]);
  const caps = colPos.map(([x, z]) => [x, 4.35, z]);
  const bases = colPos.map(([x, z]) => [x, 0.12, z]);
  inst(new THREE.BoxGeometry(0.55, 4.2, 0.55), pillar, shafts, 'saeulen_schäfte');
  inst(new THREE.BoxGeometry(0.9, 0.3, 0.9), copper, caps, 'saeulen_kapitaelle');
  inst(new THREE.BoxGeometry(0.8, 0.24, 0.8), wallDark, bases, 'saeulen_basen');
  colPos.forEach(([x, z], i) => colBox(`COL_saeule_${i}`, 0.62, 4.4, 0.62, x, 2.2, z));

  // Horizontale Balken über den Kolonnaden (eckig, ohne Rundform)
  box(1.4, 0.4, D + 1.0, copper, -21.5, 4.65, 0, 'kolonnaden_balken_west');
  box(1.4, 0.4, D + 1.0, copper, 21.5, 4.65, 0, 'kolonnaden_balken_ost');
  box(W + 1.0, 0.4, 1.4, copper, 0, 4.65, 15.4, 'kolonnaden_balken_nord');
  box(W + 1.0, 0.4, 1.4, copper, 0, 4.65, -15.4, 'kolonnaden_balken_sued');

  // ------------------------------------------------------------------ Dächer der Kolonnaden (Platzmitte bleibt offen)
  box(4.4, 0.3, D + 0.6, ceilMat, -22.2, 5.15, 0, 'decke_kolonnade_west');
  box(4.4, 0.3, D + 0.6, ceilMat, 22.2, 5.15, 0, 'decke_kolonnade_ost');
  box(40, 0.3, 3.6, ceilMat, 0, 5.15, 16.8, 'decke_kolonnade_nord');
  box(40, 0.3, 3.6, ceilMat, 0, 5.15, -16.8, 'decke_kolonnade_sued');
  colBox('COL_decke_kolonnade_west', 4.4, 0.3, D + 0.6, -22.2, 5.15, 0);
  colBox('COL_decke_kolonnade_ost', 4.4, 0.3, D + 0.6, 22.2, 5.15, 0);
  colBox('COL_decke_kolonnade_nord', 40, 0.3, 3.6, 0, 5.15, 16.8);
  colBox('COL_decke_kolonnade_sued', 40, 0.3, 3.6, 0, 5.15, -16.8);

  // ------------------------------------------------------------------ Wandpaneele und Lichtschlitze
  const panelW = [], frameW = [], slotW = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 15; i++) {
      const z = -16.8 + i * 2.4;
      panelW.push([sx * (HX - 0.018), 1.55, z]);
      frameW.push([sx * (HX - 0.025), 1.55, z]);
    }
    for (let i = 0; i < 15; i++) {
      const z = -15.6 + i * 2.4;
      for (let k = 0; k < 4; k++) slotW.push([sx * (HX - 0.01), 1.1 + k * 0.42, z]);
    }
  }
  inst(new THREE.BoxGeometry(0.035, 2.6, 1.0), wallDark, panelW, 'wandpaneele_seiten');
  inst(new THREE.BoxGeometry(0.05, 2.75, 1.12), copper, frameW, 'wandpaneel_rahmen_seiten');
  const slotMesh = inst(new THREE.BoxGeometry(0.02, 0.32, 0.06), lineGlow, slotW, 'lichtschlitze_seiten');

  const panelN = [], frameN = [], panelS = [], frameS = [];
  const northXs = [-22.8, -20.4, -18, -15.6, -13.2, -10.8, -6.6, -4.8, 4.8, 6.6, 10.8, 13.2, 15.6, 18, 20.4, 22.8];
  const southXs = [-22.8, -20.4, -18, -15.6, -13.2, -10.8, -5.4, -3.6, 3.6, 5.4, 10.8, 13.2, 15.6, 18, 20.4, 22.8];
  for (const x of northXs) { panelN.push([x, 1.55, HZ - 0.018]); frameN.push([x, 1.55, HZ - 0.025]); }
  for (const x of southXs) { panelS.push([x, 1.55, -HZ + 0.018]); frameS.push([x, 1.55, -HZ + 0.025]); }
  inst(new THREE.BoxGeometry(1.0, 2.6, 0.035), wallDark, panelN, 'wandpaneele_nord');
  inst(new THREE.BoxGeometry(1.12, 2.75, 0.05), copper, frameN, 'wandpaneel_rahmen_nord');
  inst(new THREE.BoxGeometry(1.0, 2.6, 0.035), wallDark, panelS, 'wandpaneele_sued');
  inst(new THREE.BoxGeometry(1.12, 2.75, 0.05), copper, frameS, 'wandpaneel_rahmen_sued');

  // ------------------------------------------------------------------ Fußgängerbrücken
  for (const s of [-1, 1]) {
    const x = s * BR_X;
    box(BR_W, 0.2, DECK_LEN, wallDark, x, BR_Y - 0.1, (ST_S1 + ST_N0) / 2, `bruecke_deck_${s}`);
    box(0.12, 0.06, DECK_LEN, copper, x, BR_Y + 0.01, (ST_S1 + ST_N0) / 2, `bruecke_mittelband_${s}`);
    colBox(`COL_bruecke_${s}`, BR_W, 0.2, DECK_LEN, x, BR_Y - 0.1, (ST_S1 + ST_N0) / 2);

    for (const e of [-1, 1]) {
      const rx = x + e * (BR_W / 2 - 0.08);
      box(0.09, 0.09, DECK_LEN, railMat, rx, BR_Y + 1.1, (ST_S1 + ST_N0) / 2, `bruecke_gelaender_${s}_${e}`);
      box(0.05, 0.05, DECK_LEN, railMat, rx, BR_Y + 0.55, (ST_S1 + ST_N0) / 2, `bruecke_gelaender_leiste_${s}_${e}`);
    }
    const posts = [];
    for (let z = ST_S1 + 0.9; z <= ST_N0 - 0.9; z += 1.8) {
      for (const e of [-1, 1]) posts.push([x + e * (BR_W / 2 - 0.08), BR_Y + 0.55, z]);
    }
    inst(new THREE.BoxGeometry(0.08, 1.1, 0.08), railMat, posts, `bruecke_gelaender_pfosten_${s}`);
  }

  // ------------------------------------------------------------------ Treppen (Süd aufwärts, Nord abwärts)
  const stepS = [], stepN = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < STEPS; i++) {
      const h = (i + 1) * RISE;
      stepS.push([s * BR_X, 0, ST_S0 + TREAD * (i + 0.5), 0, BR_W, h, TREAD]);
    }
    for (let i = 0; i < STEPS; i++) {
      const h = (STEPS - i) * RISE;
      stepN.push([s * BR_X, 0, ST_N0 + TREAD * (i + 0.5), 0, BR_W, h, TREAD]);
    }
  }
  const stepMesh = inst(new THREE.BoxGeometry(1, 1, 1), stairMat, stepS.concat(stepN), 'treppen_stufen');
  stepMesh.geometry.translate(0, 0.5, 0); // Einheitsbox mit Ursprung unten

  // Kollisionsrampen der Treppen
  const rampLen = Math.hypot(ST_RUN, BR_Y);
  const rampAng = Math.atan2(BR_Y, ST_RUN);
  for (const s of [-1, 1]) {
    colBox(`COL_treppe_sued_${s}`, BR_W, 0.2, rampLen, s * BR_X, BR_Y / 2 - 0.08, (ST_S0 + ST_S1) / 2, -rampAng);
    colBox(`COL_treppe_nord_${s}`, BR_W, 0.2, rampLen, s * BR_X, BR_Y / 2 - 0.08, (ST_N0 + ST_N1) / 2, rampAng);
    for (const e of [-1, 1]) {
      const rx = s * BR_X + e * (BR_W / 2 - 0.08);
      const r1 = box(0.08, 0.08, rampLen, railMat, rx, BR_Y / 2 + 1.02, (ST_S0 + ST_S1) / 2, `treppe_handlauf_sued_${s}_${e}`);
      r1.rotation.x = -rampAng;
      const r2 = box(0.08, 0.08, rampLen, railMat, rx, BR_Y / 2 + 1.02, (ST_N0 + ST_N1) / 2, `treppe_handlauf_nord_${s}_${e}`);
      r2.rotation.x = rampAng;
    }
  }

  // ------------------------------------------------------------------ Anschlüsse und Tür
  empty('DOOR_eingang', 0, 0, -HZ - T / 2, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Innenstadt-Atrium (Säulentor)', raum: 'ATL-003',
  });
  empty('DOOR_nordarkade', 0, 0, HZ + T / 2, 0, {
    breite: MID_W, hoehe: MID_H, ziel: 'Nordarkade / Fußgängerweg', raum: 'ATL-049',
  });
  // Antike Schiebetür in der Öffnung (+Z zeigt in den Platz)
  empty('PLACE_OBJ-091', 0, 0, -HZ - T / 2, 0);

  // ------------------------------------------------------------------ Objektplätze
  // Personen-Transporter (Standobjekt), Vorderseite (+Z) zur Platzmitte
  empty('PLACE_OBJ-043', -4.6, 0, -12.4, 0);

  // Wandleuchten (Wandobjekte, Rückseite an der Innenwand)
  let lampObjN = 0;
  const wandLeuchte = (x, y, z, rotY) => {
    lampObjN++;
    empty(lampObjN === 1 ? 'PLACE_OBJ-053' : `PLACE_OBJ-053_${lampObjN}`, x, y, z, rotY);
  };
  for (const z of [-12, -4, 4, 12]) {
    wandLeuchte(-HX + 0.07, 2.2, z, Math.PI / 2);
    wandLeuchte(HX - 0.07, 2.2, z, -Math.PI / 2);
  }
  for (const x of [-16, -10.8, 10.8, 16]) wandLeuchte(x, 2.2, HZ - 0.07, Math.PI);
  wandLeuchte(-2.4, 2.2, -HZ + 0.07, 0);
  wandLeuchte(2.4, 2.2, -HZ + 0.07, 0);

  // Trinkwasserbrunnen (Wandobjekte)
  empty('PLACE_OBJ-085', -HX + 0.10, 0.75, -6.0, Math.PI / 2);
  empty('PLACE_OBJ-085_2', -HX + 0.10, 0.75, 8.0, Math.PI / 2);
  empty('PLACE_OBJ-085_3', HX - 0.10, 0.75, -8.0, -Math.PI / 2);
  empty('PLACE_OBJ-085_4', HX - 0.10, 0.75, 6.0, -Math.PI / 2);

  // ------------------------------------------------------------------ Licht
  const lampPts = [
    [0, 4.6, -10], [0, 4.6, 10],
    [-16, 4.6, 0], [16, 4.6, 0],
    [-8, 4.6, -15], [8, 4.6, 15],
  ];
  lampPts.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#9fd8ff', intensity: 8, distance: 30 });
    const pl = new THREE.PointLight(0x9fd8ff, 8, 30, 2);
    pl.position.set(p[0], p[1], p[2]);
    root.add(pl);
  });
  const hemi = new THREE.HemisphereLight(0xbfe4ff, 0x2c2a26, 0.55);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8c8, 0.7);
  sun.position.set(18, 30, -12);
  root.add(sun);

  // warme Akzentstreifen an den Brückenköpfen
  for (const s of [-1, 1]) {
    box(0.1, 0.04, 2.6, amberMat, s * BR_X, BR_Y + 0.03, ST_S1 - 0.6, `bruecke_akzentlicht_sued_${s}`);
    box(0.1, 0.04, 2.6, amberMat, s * BR_X, BR_Y + 0.03, ST_N0 + 0.6, `bruecke_akzentlicht_nord_${s}`);
  }

  // ------------------------------------------------------------------ Kollision Boden
  colBox('COL_boden', W + 2 * T, 0.24, D + 2 * T, 0, -0.12, 0);

  // ------------------------------------------------------------------ Animation
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.55 + Math.sin(t * 0.7) * 0.12;
    amberLine.emissiveIntensity = 1.25 + Math.sin(t * 0.5 + 1.1) * 0.1;
  };

  root.userData.raum = { id: 'ATL-042', breite: W, tiefe: D, hoehe: WH, offen: true };
  root.userData.api = {
    info: () => ({ id: 'ATL-042', name: 'Plaza', breite: W, tiefe: D, hoehe: WH }),
  };
  return root;
}

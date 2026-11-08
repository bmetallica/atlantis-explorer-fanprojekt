// Raum ATL-043: Sektion Sieben / Section Seven
// Inner City · Etage 5 · Versorgungssektion mit Anschluss an die Notenergieversorgung
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z. Leere Hülle: nur Architektur, Lichtleisten, Paneele und Objektplätze.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_section_seven',
  art: 'Raum',
  masse: 'ca. 15,0 m × 10,0 m (≈150 m²) lichte Fläche, 3,5 m Deckenhöhe',
  wohin: 'Inner City, Etage 5 – Versorgungssektion mit Notstromanschluss zur Krankenstation',
  benutzen: 'Generatorplätze über PLACE_OBJ-040; Türen über PLACE_OBJ-091 (Antiker-Schiebetür)',
  lichter: '8 LAMP_-Punkte (7 Eisblau, 1 Bernstein), zusätzlich indirekte Decken-Lichtfelder',
  animation: 'Lichtschlitze und Deckenfelder atmen langsam (sinusförmige Helligkeitsmodulation)',
  quelle: 'selbst gebaut nach Beschreibung „Sektion Sieben“ (Staffel 4) und Referenzbild ref1.jpg',
};

const W = 15.0;      // lichte Breite  (x: -7.5 .. 7.5)
const D = 10.0;      // lichte Tiefe   (z: -5.0 .. 5.0)
const H = 3.5;       // lichte Höhe
const T = 0.3;       // Wanddicke
const DW = 2.4;      // Türbreite
const DH = 3.0;      // Türhöhe
const PW = 3.0;      // Breite der offenen Durchgänge (ohne Tür)
const PH = 3.0;      // Höhe der offenen Durchgänge
const ZMID = -2.4;   // Mittelwand (Südkorridor / Technikbereich)

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_section_seven';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlow = kit('glow');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const matSlot = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7,
  });

  const dummy = new THREE.Object3D();

  // ------------------------------------------------------------------ Helfer
  const addBox = (w, h, d, mat, x, y, z, ry = 0, name = '') => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };

  const addInst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.ry || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const addCol = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
  };

  const addEmpty = (name, x, y, z, ry = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = ry;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Wandstück entlang X (Länge in X), Wandstück entlang Z (Länge in Z)
  const wallX = (z, x0, x1, h = H, y0 = 0, name = 'wand') =>
    addBox(x1 - x0, h, T, matWall, (x0 + x1) / 2, y0 + h / 2, z, 0, name);
  const wallZ = (x, z0, z1, h = H, y0 = 0, name = 'wand') =>
    addBox(T, h, z1 - z0, matWall, x, y0 + h / 2, (z0 + z1) / 2, 0, name);

  // ------------------------------------------------------------------ Boden
  addBox(W + 2 * T, 0.12, D + 2 * T, matFloor, 0, -0.06, 0, 0, 'boden');

  // Bodenplatten 1,2 m im Raster
  const tiles = [];
  for (let ix = 0; ix < 12; ix++) {
    for (let iz = 0; iz < 8; iz++) {
      tiles.push({ x: -6.6 + ix * 1.2, y: 0.007, z: -4.2 + iz * 1.2 });
    }
  }
  addInst(new THREE.BoxGeometry(1.16, 0.014, 1.16), matFloor, tiles, 'boden_platten');

  // Kupfer-/Patina-Rand und Fugen
  addBox(W, 0.02, 0.16, matPatina, 0, 0.014, -D / 2 + 0.08, 0, 'boden_rand_sued');
  addBox(W, 0.02, 0.16, matPatina, 0, 0.014, D / 2 - 0.08, 0, 'boden_rand_nord');
  addBox(0.16, 0.02, D, matPatina, -W / 2 + 0.08, 0.014, 0, 0, 'boden_rand_west');
  addBox(0.16, 0.02, D, matPatina, W / 2 - 0.08, 0.014, 0, 0, 'boden_rand_ost');

  const seamsX = [];
  for (let ix = 0; ix <= 12; ix++) seamsX.push({ x: -7.2 + ix * 1.2, y: 0.02, z: 0 });
  addInst(new THREE.BoxGeometry(0.02, 0.008, D - 0.3), matCopper, seamsX, 'boden_fugen_x');
  const seamsZ = [];
  for (let iz = 0; iz <= 8; iz++) seamsZ.push({ x: 0, y: 0.02, z: -4.8 + iz * 1.2 });
  addInst(new THREE.BoxGeometry(W - 0.3, 0.008, 0.02), matCopper, seamsZ, 'boden_fugen_z');

  // Bodenintarsie: sechseckiger Kupferring + Dreiecke im Südkorridor
  const hex = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.12, 6, 1), matCopper);
  hex.rotation.x = -Math.PI / 2;
  hex.position.set(0, 0.022, -3.6);
  hex.name = 'boden_intarsie_sechseck';
  root.add(hex);
  const triShape = new THREE.Shape();
  triShape.moveTo(-0.42, -0.28); triShape.lineTo(0.42, -0.28); triShape.lineTo(0, 0.46); triShape.closePath();
  const triGeo = new THREE.ShapeGeometry(triShape);
  const tris = [
    { x: -2.6, y: 0.022, z: -3.6, ry: 0 },
    { x: 2.6, y: 0.022, z: -3.6, ry: Math.PI },
    { x: 0, y: 0.022, z: -1.5, ry: Math.PI / 2 },
  ];
  tris.forEach((t) => {
    const m = new THREE.Mesh(triGeo, matCopper);
    m.rotation.set(-Math.PI / 2, 0, t.ry);
    m.position.set(t.x, t.y, t.z);
    m.name = 'boden_intarsie_dreieck';
    root.add(m);
  });

  // ------------------------------------------------------------------ Aussenwände
  // Süden (-Z): Haupteingang, Mitte
  wallX(-D / 2 - T / 2, -W / 2, -DW / 2, H, 0, 'wand_sued_links');
  wallX(-D / 2 - T / 2, DW / 2, W / 2, H, 0, 'wand_sued_rechts');
  wallX(-D / 2 - T / 2, -DW / 2, DW / 2, H - DH, DH, 'wand_sued_sturz');
  // Norden (+Z): Ausgang / Anschluss an die Notenergieversorgung
  wallX(D / 2 + T / 2, -W / 2, -DW / 2, H, 0, 'wand_nord_links');
  wallX(D / 2 + T / 2, DW / 2, W / 2, H, 0, 'wand_nord_rechts');
  wallX(D / 2 + T / 2, -DW / 2, DW / 2, H - DH, DH, 'wand_nord_sturz');
  // West und Ost
  wallZ(-W / 2 - T / 2, -D / 2, D / 2, H, 0, 'wand_west');
  wallZ(W / 2 + T / 2, -D / 2, D / 2, H, 0, 'wand_ost');

  // ------------------------------------------------------------------ Innenwände (Labyrinth)
  // Mittelwand Süd (z = -2.4) mit zwei offenen Durchgängen (je 3,0 m breit, ohne Tür)
  wallX(ZMID, -W / 2, -6.9, H, 0, 'wand_mittel_west_a');
  wallX(ZMID, -3.9, 3.9, H, 0, 'wand_mittel_mitte');
  wallX(ZMID, 6.9, W / 2, H, 0, 'wand_mittel_ost_a');
  wallX(ZMID, -6.9, -3.9, H - PH, PH, 'wand_mittel_west_sturz');
  wallX(ZMID, 3.9, 6.9, H - PH, PH, 'wand_mittel_ost_sturz');
  // Technikwände West / Ost der Mittelbucht
  wallZ(-2.4, -2.25, 2.4, H, 0, 'wand_bucht_west');
  wallZ(2.4, -2.25, 2.4, H, 0, 'wand_bucht_ost');

  // ------------------------------------------------------------------ Sockel, Gesims, Paneele
  const baseY = 0.075, capY = H - 0.05;
  const stripX = (z, x0, x1, s = 1) => {
    if (x1 - x0 < 0.05) return;
    addBox(x1 - x0, 0.15, 0.05, matCopper, (x0 + x1) / 2, baseY, z + s * 0.17, 0, 'sockelleiste');
    addBox(x1 - x0, 0.10, 0.07, matCopper, (x0 + x1) / 2, capY, z + s * 0.18, 0, 'gesims');
  };
  const stripZ = (x, z0, z1, s = 1) => {
    if (z1 - z0 < 0.05) return;
    addBox(0.05, 0.15, z1 - z0, matCopper, x + s * 0.17, baseY, (z0 + z1) / 2, 0, 'sockelleiste');
    addBox(0.07, 0.10, z1 - z0, matCopper, x + s * 0.18, capY, (z0 + z1) / 2, 0, 'gesims');
  };

  stripX(-D / 2 - T / 2, -W / 2, -DW / 2, 1); stripX(-D / 2 - T / 2, DW / 2, W / 2, 1);
  stripX(D / 2 + T / 2, -W / 2, -DW / 2, -1); stripX(D / 2 + T / 2, DW / 2, W / 2, -1);
  stripZ(-W / 2 - T / 2, -D / 2, D / 2, 1); stripZ(W / 2 + T / 2, -D / 2, D / 2, -1);
  stripX(ZMID, -W / 2, -6.9, -1); stripX(ZMID, -6.9, -3.9, -1);
  stripX(ZMID, -3.9, 3.9, 1); stripX(ZMID, 3.9, 6.9, 1); stripX(ZMID, 6.9, W / 2, 1);
  stripZ(-2.4, -2.25, 2.4, 1); stripZ(-2.4, -2.25, 2.4, -1);
  stripZ(2.4, -2.25, 2.4, 1); stripZ(2.4, -2.25, 2.4, -1);

  // Plant-on-Paneele (jedes zweite Feld) und Lichtschlitze
  const panelGeo = new THREE.BoxGeometry(1.0, 2.6, 0.04);
  const frameGeo = new THREE.BoxGeometry(1.14, 2.76, 0.06);
  const slotGeo = new THREE.BoxGeometry(0.07, 0.34, 0.03);
  const panels = [], frames = [], slots = [];

  // Westwand (Innenfläche x = -7.5)
  for (let i = 0; i < 8; i++) {
    const z = -4.4 + i * 1.2;
    if (i % 2 === 0) {
      frames.push({ x: -7.485, y: 1.55, z, ry: Math.PI / 2 });
      panels.push({ x: -7.462, y: 1.55, z, ry: Math.PI / 2 });
    } else {
      for (let k = 0; k < 4; k++) slots.push({ x: -7.478, y: 1.05 + k * 0.44, z, ry: Math.PI / 2 });
    }
  }
  // Ostwand
  for (let i = 0; i < 8; i++) {
    const z = -4.4 + i * 1.2;
    if (i % 2 === 0) {
      frames.push({ x: 7.485, y: 1.55, z, ry: Math.PI / 2 });
      panels.push({ x: 7.462, y: 1.55, z, ry: Math.PI / 2 });
    } else {
      for (let k = 0; k < 4; k++) slots.push({ x: 7.478, y: 1.05 + k * 0.44, z, ry: Math.PI / 2 });
    }
  }
  // Süd- und Nordwand (Türfelder + 1,2-m-Schutzstreifen ausgespart)
  for (let i = 0; i < 12; i++) {
    const x = -6.6 + i * 1.2;
    if (Math.abs(x) < 2.4) continue;
    if (i % 2 === 0) {
      frames.push({ x, y: 1.55, z: -4.985, ry: 0 }); panels.push({ x, y: 1.55, z: -4.962, ry: 0 });
      frames.push({ x, y: 1.55, z: 4.985, ry: 0 }); panels.push({ x, y: 1.55, z: 4.962, ry: 0 });
    } else {
      for (let k = 0; k < 4; k++) {
        slots.push({ x, y: 1.05 + k * 0.44, z: -4.978, ry: 0 });
        slots.push({ x, y: 1.05 + k * 0.44, z: 4.978, ry: 0 });
      }
    }
  }
  // Mittelwand: Paneele auf der Südseite, Lichtschlitze in den Fugen
  for (let i = 0; i < 12; i++) {
    const x = -6.6 + i * 1.2;
    const inOeffnung = (x > -6.9 && x < -3.9) || (x > 3.9 && x < 6.9);
    if (inOeffnung) continue;
    if (i % 2 === 0) {
      frames.push({ x, y: 1.55, z: -2.565, ry: 0 });
      panels.push({ x, y: 1.55, z: -2.542, ry: 0 });
    } else {
      for (let k = 0; k < 4; k++) slots.push({ x, y: 1.05 + k * 0.44, z: -2.578, ry: 0 });
    }
  }
  // Mittelwand Nordseite: durchgehende Lichtschlitze
  for (let i = 0; i < 12; i++) {
    const x = -6.6 + i * 1.2;
    const inOeffnung = (x > -6.9 && x < -3.9) || (x > 3.9 && x < 6.9);
    if (inOeffnung) continue;
    for (let k = 0; k < 4; k++) slots.push({ x, y: 1.05 + k * 0.44, z: -2.222, ry: 0 });
  }
  // Buchtwände: Paneele innen, Schlitze außen
  for (let i = 0; i < 4; i++) {
    const z = -1.8 + i * 1.2;
    frames.push({ x: -2.235, y: 1.55, z, ry: Math.PI / 2 });
    panels.push({ x: -2.212, y: 1.55, z, ry: Math.PI / 2 });
    frames.push({ x: 2.235, y: 1.55, z, ry: Math.PI / 2 });
    panels.push({ x: 2.212, y: 1.55, z, ry: Math.PI / 2 });
    for (let k = 0; k < 3; k++) {
      slots.push({ x: -2.478, y: 1.1 + k * 0.46, z, ry: Math.PI / 2 });
      slots.push({ x: 2.478, y: 1.1 + k * 0.46, z, ry: Math.PI / 2 });
    }
  }

  addInst(frameGeo, matCopper, frames, 'paneel_rahmen');
  addInst(panelGeo, matWallDark, panels, 'wandpaneele');
  const slotMesh = addInst(slotGeo, matSlot, slots, 'lichtschlitze');

  // ------------------------------------------------------------------ Türzargen (Kupfer)
  const doorFrame = (z, inward) => {
    const zi = z + inward * 0.14;
    addBox(0.14, DH, 0.16, matCopper, -DW / 2 - 0.07, DH / 2, zi, 0, 'tuer_zarge_links');
    addBox(0.14, DH, 0.16, matCopper, DW / 2 + 0.07, DH / 2, zi, 0, 'tuer_zarge_rechts');
    addBox(DW + 0.28, 0.14, 0.16, matCopper, 0, DH + 0.07, zi, 0, 'tuer_zarge_oben');
  };
  doorFrame(-D / 2 - T / 2, 1);
  doorFrame(D / 2 + T / 2, -1);

  // ------------------------------------------------------------------ Säulen
  const pillarGeo = new THREE.BoxGeometry(0.26, H - 0.2, 0.26);
  const pillars = [];
  for (const s of [-1, 1]) {
    for (const z of [-3.4, 0.0, 3.4]) {
      pillars.push({ x: s * (W / 2 - 0.16), y: (H - 0.2) / 2, z, ry: 0 });
    }
  }
  addInst(pillarGeo, matPillar, pillars, 'saeulen');

  // ------------------------------------------------------------------ Decken-Podeste (Kabelbrücken / Konsolen NICHT gebaut)
  // Nur fest eingebaute Deckenriegel als Architekturdetail
  const riegel = [
    { x: -5.4, y: H - 0.06, z: 0.6, ry: 0 },
    { x: 5.4, y: H - 0.06, z: 0.6, ry: 0 },
    { x: 0, y: H - 0.06, z: -3.6, ry: 0 },
  ];
  addInst(new THREE.BoxGeometry(2.6, 0.12, 0.34), matWallDark, riegel, 'decke_riegel');

  // ------------------------------------------------------------------ Decke
  addBox(W + 2 * T, 0.3, D + 2 * T, matCeiling, 0, H + 0.15, 0, 0, 'decke_haupt');
  const kassetten = [];
  for (const x of [-6, -3, 0, 3, 6]) {
    for (const z of [-3.6, 0, 3.6]) kassetten.push({ x, y: H - 0.03, z });
  }
  addInst(new THREE.BoxGeometry(2.3, 0.06, 2.3), matWallDark, kassetten, 'decke_kassetten');
  const deckenLicht = [];
  for (const x of [-6, -3, 0, 3, 6]) {
    for (const z of [-3.6, 0, 3.6]) deckenLicht.push({ x, y: H - 0.065, z });
  }
  addInst(new THREE.BoxGeometry(1.6, 0.02, 1.6), matGlow, deckenLicht, 'decke_lichtfelder');
  // Indirekte Lichtbänder entlang der Korridore
  addBox(W - 0.6, 0.05, 0.1, matGlow, 0, H - 0.05, -3.7, 0, 'decke_lichtband_sued');
  addBox(W - 0.6, 0.05, 0.1, matGlow, 0, H - 0.05, 3.7, 0, 'decke_lichtband_nord');
  addBox(0.1, 0.05, D - 0.6, matGlow, -5.4, H - 0.05, 0, 0, 'decke_lichtband_west');
  addBox(0.1, 0.05, D - 0.6, matGlow, 5.4, H - 0.05, 0, 0, 'decke_lichtband_ost');
  addBox(0.1, 0.05, 4.4, matGlow, 0, H - 0.05, 0.1, 0, 'decke_lichtband_bucht');

  // ------------------------------------------------------------------ Türen, Anschlüsse, Objektplätze
  // Hauptzugang (-Z)
  addEmpty('DOOR_eingang', 0, 0, -D / 2 - T / 2, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Korridor Sektion Sieben / Zugang', raum: 'ATL-049',
  });
  addEmpty('PLACE_OBJ-091', 0, 0, -D / 2 - T / 2, 0);
  // Ausgang (+Z) zur Notenergieversorgung der Krankenstation
  addEmpty('DOOR_ausgang', 0, 0, D / 2 + T / 2, 0, {
    breite: DW, hoehe: DH, ziel: 'Korridor – Notenergieversorgung Krankenstation', raum: 'ATL-049',
  });
  addEmpty('PLACE_OBJ-091_2', 0, 0, D / 2 + T / 2, Math.PI);

  // Mark-II-Naquadah-Generatoren (nur Platzhalter, kein Objekt gebaut)
  // B×H×T: 0,89 × 0,49 × 0,31 m; Rücken an der Wand, Front (+Z) in den Raum
  addEmpty('PLACE_OBJ-040', -7.345, 0, -1.5, Math.PI / 2);
  addEmpty('PLACE_OBJ-040_2', -7.345, 0, 1.0, Math.PI / 2);
  addEmpty('PLACE_OBJ-040_3', 7.345, 0, -0.5, -Math.PI / 2);
  addEmpty('PLACE_OBJ-040_4', -2.095, 0, 0.9, Math.PI / 2);
  addEmpty('PLACE_OBJ-040_5', 2.095, 0, 1.8, -Math.PI / 2);

  // ------------------------------------------------------------------ Lichter
  const lampPos = [
    [-5.0, 3.25, -3.7, '#9fd8ff', 7],
    [0.0, 3.25, -3.7, '#9fd8ff', 8],
    [5.0, 3.25, -3.7, '#9fd8ff', 7],
    [-4.0, 3.25, 0.4, '#9fd8ff', 8],
    [4.0, 3.25, 0.4, '#9fd8ff', 8],
    [0.0, 3.25, 0.4, '#ffd8a0', 6],
    [-6.0, 3.25, 3.7, '#9fd8ff', 7],
    [6.0, 3.25, 3.7, '#9fd8ff', 7],
  ];
  lampPos.forEach((p, i) => {
    addEmpty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, {
      color: p[3], intensity: p[4], distance: 11,
    });
  });

  // ------------------------------------------------------------------ Kollision
  addCol('COL_boden', W + 2 * T, 0.24, D + 2 * T, 0, -0.12, 0);
  addCol('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  // Aussenwände
  addCol('COL_wand_sued_links', W / 2 - DW / 2, H, T, -(W / 2 + DW / 2) / 2, H / 2, -D / 2 - T / 2);
  addCol('COL_wand_sued_rechts', W / 2 - DW / 2, H, T, (W / 2 + DW / 2) / 2, H / 2, -D / 2 - T / 2);
  addCol('COL_wand_sued_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, -D / 2 - T / 2);
  addCol('COL_wand_nord_links', W / 2 - DW / 2, H, T, -(W / 2 + DW / 2) / 2, H / 2, D / 2 + T / 2);
  addCol('COL_wand_nord_rechts', W / 2 - DW / 2, H, T, (W / 2 + DW / 2) / 2, H / 2, D / 2 + T / 2);
  addCol('COL_wand_nord_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, D / 2 + T / 2);
  addCol('COL_wand_west', T, H, D, -W / 2 - T / 2, H / 2, 0);
  addCol('COL_wand_ost', T, H, D, W / 2 + T / 2, H / 2, 0);
  // Innenwände
  addCol('COL_wand_mittel_west_a', 0.6, H, T, -7.2, H / 2, ZMID);
  addCol('COL_wand_mittel_mitte', 7.8, H, T, 0, H / 2, ZMID);
  addCol('COL_wand_mittel_ost_a', 0.6, H, T, 7.2, H / 2, ZMID);
  addCol('COL_wand_mittel_west_sturz', PW, H - PH, T, -5.4, PH + (H - PH) / 2, ZMID);
  addCol('COL_wand_mittel_ost_sturz', PW, H - PH, T, 5.4, PH + (H - PH) / 2, ZMID);
  addCol('COL_wand_bucht_west', T, H, 4.65, -2.4, H / 2, 0.075);
  addCol('COL_wand_bucht_ost', T, H, 4.65, 2.4, H / 2, 0.075);
  // Säulen
  for (const s of [-1, 1]) {
    for (const z of [-3.4, 0.0, 3.4]) {
      addCol(`COL_saeule_${s < 0 ? 'w' : 'o'}_${String(z).replace('.', '')}`, 0.26, H - 0.2, 0.26, s * (W / 2 - 0.16), (H - 0.2) / 2, z);
    }
  }

  // ------------------------------------------------------------------ Animation: Lichtatmung
  let last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last === null) last = now;
    last = now;
    matSlot.emissiveIntensity = 1.65 + Math.sin(now * 0.8) * 0.14;
    matGlow.emissiveIntensity = 1.35 + Math.sin(now * 0.55 + 1.1) * 0.1;
  };

  root.userData.raum = {
    id: 'ATL-043',
    name: 'Sektion Sieben',
    etage: 5,
    bereich: 'Inner City',
    flaeche: 'ca. 150 m²',
    hoehe: H,
  };
  root.userData.api = {
    info: 'Leere Versorgungshülle: Labyrinthkorridor mit Notstrom-Generatorplätzen (PLACE_OBJ-040).',
    generatoren: 5,
    generatorPunkte: () => root.children.filter((c) => c.name.startsWith('PLACE_OBJ-040')),
    tueren: () => root.children.filter((c) => c.name.startsWith('DOOR_')),
  };

  return root;
}

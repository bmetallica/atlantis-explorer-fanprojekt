// Raum ATL-030: Waffenkammer / Armory (West Pier, Etage 5).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Raumhülle: Boden, feuerhemmende Wände, vergitterte Waffenausgaben mit
// Bernstein-Backlight, Schleusentüren, Wandpaneele, Lichtschlitze, Säulen, Decke.
// Keine Möbel – nur PLACE_-Punkte für die Objektliste.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_armory',
  art: 'Raum (Waffenkammer / Hochsicherheits-Waffenlager)',
  masse: '12,0 m × 7,5 m lichte Fläche (≈ 90 m²), 3,2 m lichte Höhe',
  wohin: 'West Pier, Etage 5 – gesicherter Lager- und Ausgabebereich der Expedition',
  benutzen: 'Waffen- und Ausrüstungslager; Objektplätze an Wänden und vor den vergitterten Ausgabefächern, Mittelgang bleibt frei',
  lichter: '8 LAMP_-Punkte (6 eisblau #9fd8ff, 2 bernstein #ffd8a0 an den Ausgabefächern)',
  animation: 'Lichtschlitze und Bernstein-Ausgabeflächen pulsieren minimal',
  quelle: 'selbst gebaut nach Raumauftrag ATL-030, Screencaps „À corps perdu“ / Atlantis-Waffenkammer, Atlantis-Setpläne „Halls & Corridors“',
};

export const varianten = [
  { label: 'Waffenkammer 12 × 7,5 m (Standard)', opts: {} },
];

const W = 12.0;          // lichte Breite (X)
const D = 7.5;           // lichte Tiefe (Z)
const H = 3.2;           // lichte Höhe
const T = 0.3;           // Wanddicke
const DOOR_W = 2.4;      // Öffnungsbreite
const DOOR_H = 3.0;      // Öffnungshöhe
const X0 = -W / 2, X1 = W / 2;
const Z0 = -D / 2, Z1 = D / 2;

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_armory';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeil = kit('ceiling');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const matStrip = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.55, roughness: 0.35,
  });
  const matAmberPanel = new THREE.MeshStandardMaterial({
    name: 'ausgabe_bernstein', color: 0xffc069, emissive: 0xff9c3c, emissiveIntensity: 1.35, roughness: 0.5,
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.rot || 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(W + 2 * T, 0.2, D + 2 * T, matFloor, 0, -0.1, 0, 'boden');
  // grün-kupferner Rand
  for (const s of [-1, 1]) {
    box(0.22, 0.014, D, matPatina, s * (W / 2 - 0.11), 0.007, 0, 'boden_rand_patina');
    box(W - 0.44, 0.014, 0.22, matPatina, 0, 0.007, s * (D / 2 - 0.11), 'boden_rand_patina');
  }
  for (const s of [-1, 1]) {
    box(0.05, 0.018, D - 0.5, matCopper, s * (W / 2 - 0.24), 0.009, 0, 'boden_rand_kupfer');
    box(W - 0.5, 0.018, 0.05, matCopper, 0, 0.009, s * (D / 2 - 0.24), 'boden_rand_kupfer');
  }
  // Plattenfugen im 1,2-m-Raster
  const seamsA = [], seamsB = [];
  for (let z = Z0 + 0.9; z < Z1 - 0.4; z += 1.2) seamsA.push({ x: 0, y: 0.004, z });
  for (let x = X0 + 0.6; x < X1 - 0.4; x += 1.2) seamsB.push({ x, y: 0.004, z: 0 });
  inst(new THREE.BoxGeometry(W - 0.5, 0.006, 0.02), matCopper, seamsA, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(0.02, 0.006, D - 0.5), matCopper, seamsB, 'boden_fugen_z');
  // Mittelgang-Markierung (eckig, kein Kreis)
  box(9.0, 0.01, 0.07, matCopper, 0.0, 0.006, 0, 'boden_gangmarkierung');
  for (const s of [-1, 1]) box(9.0, 0.01, 0.04, matPatina, 0.0, 0.006, s * 0.75, 'boden_gangmarkierung');
  // Schwellenplatten vor den Schleusen
  box(2.4, 0.018, 0.55, matCopper, 0, 0.009, Z0 + 0.28, 'boden_schwelle');
  box(0.55, 0.018, 2.4, matCopper, X1 - 0.28, 0.009, 0, 'boden_schwelle');

  // ------------------------------------------------------------------ Wände
  const zN = Z0 - T / 2;   // -3.90
  const zP = Z1 + T / 2;   //  3.90
  const xW = X1 + T / 2;   //  6.15
  const xO = X0 - T / 2;   // -6.15

  // -Z Wand (Haupteingang, Öffnung 2,4 × 3,0 m bei x = 0)
  box(4.95, H, T, matWall, -3.675, H / 2, zN, 'wand_nord_links');
  box(4.95, H, T, matWall, 3.675, H / 2, zN, 'wand_nord_rechts');
  box(DOOR_W, H - DOOR_H, T, matWall, 0, DOOR_H + (H - DOOR_H) / 2, zN, 'wand_nord_sturz');
  // +Z Wand
  box(W + 2 * T, H, T, matWall, 0, H / 2, zP, 'wand_sued');
  // -X Wand
  box(T, H, D, matWall, xO, H / 2, 0, 'wand_west');
  // +X Wand (Seitenschleuse bei z = 0)
  box(T, H, 2.55, matWall, xW, H / 2, -2.475, 'wand_ost_a');
  box(T, H, 2.55, matWall, xW, H / 2, 2.475, 'wand_ost_b');
  box(T, H - DOOR_H, DOOR_W, matWall, xW, DOOR_H + (H - DOOR_H) / 2, 0, 'wand_ost_sturz');

  // Sockelleisten und Gesimse
  box(4.95, 0.16, 0.05, matCopper, -3.675, 0.08, Z0 + 0.025, 'sockelleiste');
  box(4.95, 0.16, 0.05, matCopper, 3.675, 0.08, Z0 + 0.025, 'sockelleiste');
  box(0.05, 0.16, D, matCopper, X0 + 0.025, 0.08, 0, 'sockelleiste');
  box(0.05, 0.16, 2.55, matCopper, X1 - 0.025, 0.08, -2.475, 'sockelleiste');
  box(0.05, 0.16, 2.55, matCopper, X1 - 0.025, 0.08, 2.475, 'sockelleiste');
  box(W + 2 * T, 0.16, 0.05, matCopper, 0, 0.08, Z1 - 0.025, 'sockelleiste');
  box(4.95, 0.10, 0.05, matCopper, -3.675, H - 0.05, Z0 + 0.025, 'gesims');
  box(4.95, 0.10, 0.05, matCopper, 3.675, H - 0.05, Z0 + 0.025, 'gesims');
  box(W + 2 * T, 0.10, 0.05, matCopper, 0, H - 0.05, Z1 - 0.025, 'gesims');

  // ------------------------------------------------------------------ Wandpaneele / Lichtschlitze
  const panels = [], frames = [], slots = [];

  // Nordwand (Pfeiler neben den Ausgabefächern frei gelassen)
  for (const x of [-5.4, -5.1, -1.8, -1.5, 1.5, 1.8, 5.1, 5.4]) {
    panels.push({ x, y: 1.55, z: Z0 + 0.03, rot: 0 });
    frames.push({ x, y: 1.55, z: Z0 + 0.015, rot: 0 });
  }
  // Südwand
  for (const x of [-5.4, -4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2, 5.4]) {
    panels.push({ x, y: 1.55, z: Z1 - 0.03, rot: Math.PI });
    frames.push({ x, y: 1.55, z: Z1 - 0.015, rot: Math.PI });
  }
  // Westwand
  for (const z of [-3.3, -2.1, -0.9, 0.3, 1.5, 2.7]) {
    panels.push({ x: X0 + 0.03, y: 1.55, z, rot: Math.PI / 2 });
    frames.push({ x: X0 + 0.015, y: 1.55, z, rot: Math.PI / 2 });
  }
  // Ostwand
  for (const z of [-3.3, -2.1, -0.9, 0.3, 1.5, 2.7]) {
    panels.push({ x: X1 - 0.03, y: 1.55, z, rot: -Math.PI / 2 });
    frames.push({ x: X1 - 0.015, y: 1.55, z, rot: -Math.PI / 2 });
  }
  // Senkrechte Lichtschlitze in den Fugen
  slots.push(
    { x: -2.45, y: 1.4, z: Z0 + 0.035, rot: 0 },
    { x: 2.45, y: 1.4, z: Z0 + 0.035, rot: 0 },
    { x: X0 + 0.035, y: 1.4, z: -2.6, rot: Math.PI / 2 },
    { x: X0 + 0.035, y: 1.4, z: 2.6, rot: Math.PI / 2 },
    { x: X1 - 0.035, y: 1.4, z: -3.5, rot: -Math.PI / 2 },
    { x: X1 - 0.035, y: 1.4, z: 3.5, rot: -Math.PI / 2 },
    { x: -5.85, y: 1.4, z: Z1 - 0.035, rot: Math.PI },
    { x: 5.85, y: 1.4, z: Z1 - 0.035, rot: Math.PI },
  );

  inst(new THREE.BoxGeometry(1.02, 2.72, 0.022), matCopper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.9, 2.6, 0.04), matWallDark, panels, 'paneele');
  const stripMesh = inst(new THREE.BoxGeometry(0.07, 2.2, 0.022), matStrip, slots, 'lichtschlitze');

  // ------------------------------------------------------------------ Vergitterte Waffenausgaben (fest eingebaute Architektur)
  const rackX = [-3.9, 3.9];
  const bars = [];
  for (const rx of rackX) {
    box(2.06, 2.5, 0.05, matWallDark, rx, 1.5, Z0 + 0.035, 'ausgabe_rueckplatte');
    box(1.88, 2.3, 0.03, matAmberPanel, rx, 1.5, Z0 + 0.065, 'ausgabe_leuchtflaeche');
    for (const dx of [-1.02, 1.02]) box(0.09, 2.54, 0.11, matCopper, rx + dx, 1.5, Z0 + 0.15, 'ausgabe_rahmen');
    for (const dy of [-1.25, 1.25]) box(2.13, 0.09, 0.11, matCopper, rx, 1.5 + dy, Z0 + 0.15, 'ausgabe_rahmen');
    for (const dy of [-0.58, 0.58]) box(2.0, 0.05, 0.07, matCopper, rx, 1.5 + dy, Z0 + 0.155, 'ausgabe_querstab');
    for (let i = 0; i < 8; i++) bars.push({ x: rx - 0.84 + i * 0.24, y: 1.5, z: Z0 + 0.155 });
  }
  inst(new THREE.BoxGeometry(0.045, 2.42, 0.05), matCopper, bars, 'ausgabe_gitterstaebe');

  // ------------------------------------------------------------------ Türrahmen (Schleusen, Bronze) + Revisionsnieten
  const rivets = [];
  // Haupteingang (-Z)
  box(0.14, DOOR_H, 0.12, matCopper, -1.28, DOOR_H / 2, Z0 + 0.06, 'tuerrahmen_nord');
  box(0.14, DOOR_H, 0.12, matCopper, 1.28, DOOR_H / 2, Z0 + 0.06, 'tuerrahmen_nord');
  box(2.7, 0.14, 0.12, matCopper, 0, DOOR_H + 0.02, Z0 + 0.06, 'tuerrahmen_nord');
  for (let i = 0; i < 7; i++) {
    rivets.push({ x: -1.28, y: 0.28 + i * 0.42, z: Z0 + 0.13 });
    rivets.push({ x: 1.28, y: 0.28 + i * 0.42, z: Z0 + 0.13 });
  }
  // Seitenschleuse (+X)
  box(0.12, DOOR_H, 0.14, matCopper, X1 - 0.06, DOOR_H / 2, -1.28, 'tuerrahmen_ost');
  box(0.12, DOOR_H, 0.14, matCopper, X1 - 0.06, DOOR_H / 2, 1.28, 'tuerrahmen_ost');
  box(0.12, 0.14, 2.7, matCopper, X1 - 0.06, DOOR_H + 0.02, 0, 'tuerrahmen_ost');
  for (let i = 0; i < 7; i++) {
    rivets.push({ x: X1 - 0.13, y: 0.28 + i * 0.42, z: -1.28 });
    rivets.push({ x: X1 - 0.13, y: 0.28 + i * 0.42, z: 1.28 });
  }
  inst(new THREE.BoxGeometry(0.045, 0.045, 0.045), matCopper, rivets, 'tuerrahmen_nieten');

  // Tür-Objekte (fertige Antiker-Schiebetüren, Wandmitte, Vorderseite in den Raum)
  empty('PLACE_OBJ-091', 0, 0, zN, 0);
  empty('PLACE_OBJ-091_2', xW, 0, 0, -Math.PI / 2);

  // ------------------------------------------------------------------ Säulen (schlank, leicht geneigt)
  const pillarPos = [
    [X0 + 0.45, Z0 + 0.45], [X1 - 0.45, Z0 + 0.45],
    [X0 + 0.45, Z1 - 0.45], [X1 - 0.45, Z1 - 0.45],
  ];
  for (const [px, pz] of pillarPos) {
    const p = box(0.3, H - 0.16, 0.3, matPillar, px, (H - 0.16) / 2, pz, 'saeule');
    p.rotation.z = 0.05;
    p.rotation.x = -0.04;
    box(0.36, 0.12, 0.36, matCopper, px, 0.06, pz, 'saeulen_sockel');
    box(0.36, 0.12, 0.36, matCopper, px, H - 0.1, pz, 'saeulen_kopf');
  }

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, matCeil, 0, H + 0.15, 0, 'decke_haupt');
  const kass = [];
  for (const px of [-4, 0, 4]) for (const pz of [-2.4, 0, 2.4]) kass.push({ x: px, y: H - 0.015, z: pz });
  inst(new THREE.BoxGeometry(3.0, 0.03, 1.9), matWallDark, kass, 'decke_kassetten');
  const lightPanels = [];
  for (const px of [-4, 0, 4]) for (const pz of [-2.4, 2.4]) lightPanels.push({ x: px, y: H - 0.035, z: pz });
  inst(new THREE.BoxGeometry(2.2, 0.04, 0.9), matGlow, lightPanels, 'decke_leuchtfelder');
  for (const rx of rackX) {
    box(2.3, 0.05, 0.36, matAmber, rx, H - 0.06, Z0 + 0.33, 'decke_bernsteinkehle');
    box(2.3, 0.05, 0.36, matAmber, rx, H - 0.06, Z1 - 0.33, 'decke_bernsteinkehle');
  }
  box(0.09, 0.05, D - 0.4, matGlow, X0 + 0.35, H - 0.03, 0, 'decke_lichtband');
  box(0.09, 0.05, D - 0.4, matGlow, X1 - 0.35, H - 0.03, 0, 'decke_lichtband');

  // ------------------------------------------------------------------ Objektplätze (Objektliste)
  // Waffen-Sicherheitsschränke (5,16 × 2,32 × 1,45) – Rückwand an +Z, Front zum Raum (-Z)
  empty('PLACE_OBJ-030', -2.75, 0, 3.025, Math.PI);
  empty('PLACE_OBJ-030_2', 2.85, 0, 3.025, Math.PI);

  // Druckanzug / Raumanzug (1,13 × 2,11 × 1,02) – Westwand, Front +X
  empty('PLACE_OBJ-057', -5.49, 0, -1.8, Math.PI / 2);

  // Taktische Gefechtsweste & Funkheadset (0,96 × 1,64 × 0,64) – Westwand
  empty('PLACE_OBJ-064', -5.68, 0, 0.2, Math.PI / 2);
  empty('PLACE_OBJ-064_2', -5.68, 0, 1.6, Math.PI / 2);

  // Wraith-Betäubungsgewehr (0,18 × 0,17 × 1,19) – vor dem linken Ausgabefach, Front +Z
  empty('PLACE_OBJ-061', -4.2, 0, -2.95, 0);

  // Klein- und Handwaffen vor den vergitterten Ausgaben
  empty('PLACE_OBJ-059', -3.4, 0, -3.3, 0);            // Partikelstrahlwaffe (liegend)
  empty('PLACE_OBJ-060', -3.05, 0, -3.3, 0);           // Wraith-Handblaster
  empty('PLACE_OBJ-062', 3.4, 0, -3.25, 0);            // FN P90
  empty('PLACE_OBJ-063', 3.95, 0, -3.35, 0);           // C-4 Sprengstoff
  empty('PLACE_OBJ-049', 4.3, 0, -3.35, 0);            // persönlicher Schutzschild
  empty('PLACE_OBJ-086', 4.55, 0, -3.25, 0);           // Knicklicht 1
  empty('PLACE_OBJ-086_2', 4.55, 0, -3.45, 0);         // Knicklicht 2
  empty('PLACE_OBJ-086_3', 4.72, 0, -3.35, 0);         // Knicklicht 3

  // Wandobjekte
  empty('PLACE_OBJ-051', 2.75, 1.35, Z0 + 0.06, 0);             // Wandleser neben Haupteingang
  empty('PLACE_OBJ-051_2', X1 - 0.06, 1.35, -2.9, -Math.PI / 2); // Wandleser an der Ostschleuse
  empty('PLACE_OBJ-074', X0 + 0.06, 2.72, 0, Math.PI / 2);      // Beacon an der Westwand
  empty('PLACE_OBJ-074_2', 0, 2.72, Z1 - 0.06, Math.PI);         // Beacon an der Südwand

  // ------------------------------------------------------------------ Raumanschlüsse (DOOR_)
  empty('DOOR_haupteingang', 0, 0, zN, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor West Pier', raum: 'ATL-049',
  });
  empty('DOOR_seitenschleuse', xW, 0, 0, Math.PI / 2, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor West Pier (Gegenseite)', raum: 'ATL-049',
  });

  // ------------------------------------------------------------------ Licht
  const lampPos = [
    [-4.0, -2.4], [-4.0, 2.4], [4.0, -2.4], [4.0, 2.4], [0.0, -2.4], [0.0, 2.4],
  ];
  lampPos.forEach(([lx, lz], i) => {
    empty(`LAMP_${i + 1}`, lx, H - 0.55, lz, 0, { color: '#9fd8ff', intensity: 9, distance: 11 });
  });
  rackX.forEach((rx, i) => {
    empty(`LAMP_${7 + i}`, rx, 2.55, Z0 + 0.3, 0, { color: '#ffd8a0', intensity: 7, distance: 8 });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_nord_links', 4.95, H, T, -3.675, H / 2, zN);
  col('COL_wand_nord_rechts', 4.95, H, T, 3.675, H / 2, zN);
  col('COL_sturz_nord', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zN);
  col('COL_wand_sued', W + 2 * T, H, T, 0, H / 2, zP);
  col('COL_wand_west', T, H, D, xO, H / 2, 0);
  col('COL_wand_ost_a', T, H, 2.55, xW, H / 2, -2.475);
  col('COL_wand_ost_b', T, H, 2.55, xW, H / 2, 2.475);
  col('COL_sturz_ost', T, H - DOOR_H, DOOR_W, xW, DOOR_H + (H - DOOR_H) / 2, 0);
  for (const [px, pz] of pillarPos) col('COL_saeule', 0.38, H, 0.38, px, H / 2, pz);

  // ------------------------------------------------------------------ Animation
  let last = null, t = 0;
  stripMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    matStrip.emissiveIntensity = 1.55 + Math.sin(t * 0.8) * 0.12;
    matAmberPanel.emissiveIntensity = 1.35 + Math.sin(t * 0.55 + 1.2) * 0.14;
  };

  root.userData.raum = {
    id: 'ATL-030',
    breite: W, tiefe: D, hoehe: H,
    tueren: ['DOOR_haupteingang', 'DOOR_seitenschleuse'],
  };
  return root;
}

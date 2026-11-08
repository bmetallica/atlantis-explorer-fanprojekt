// Raum ATL-027: Lesezimmer / Reading Room (Inner City, Etage 4)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Hülle: nur Architektur (Akustikpaneele, Fensterfront, Lichtleisten, Intarsien).
// Möbel (Sessel, Regale, Leselampen, Tische) werden NICHT gebaut.

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_reading_room',
  art: 'Raum',
  masse: '5,8 m lichte Breite × 9,6 m lichte Tiefe × 3,2 m lichte Höhe (≈55,7 m²)',
  wohin: 'Inner City, Etage 4 – ruhiger Lese-/Arbeitsbereich mit Bibliotheksanschluss und Fensterfront zum begrünten Innenhof',
  benutzen: 'Wandleuchten (OBJ-053), Daten-Pads (OBJ-056) und Gedenk-Teeservice (OBJ-083) über die PLACE_-Punkte setzen; der Raum selbst bleibt frei von Möbeln',
  lichter: '4 warme LAMP_-Punkte (#ffd8a0) in der Raumachse, 1 kühles Licht an der Fensterseite (#9fd8ff), warme Lichtbänder und Decken-Lichtfelder',
  animation: 'Warme Lichtleisten und Lichtpunkte atmen langsam (sinusförmige Helligkeitsmodulation)',
  quelle: 'selbst gebaut nach Raumbeschreibung ATL-027, Setplänen „Halls & Corridors“ (Staffel 4) und Screencaps des Wohnbereichs'
};

export const varianten = [
  { label: 'Lesezimmer mit Innenhof-Fensterfront', opts: {} }
];

const W = 5.8;          // lichte Breite (X)
const D = 9.6;          // lichte Tiefe (Z)
const H = 3.2;          // lichte Höhe
const T = 0.3;          // Wanddicke
const DW = 2.4;         // Türbreite
const DH = 3.0;         // Türhöhe
const XW = W / 2;       // innere Wandfläche West
const XE = W / 2;       // innere Wandfläche Ost
const ZS = D / 2;       // innere Wandfläche Rücke (+Z)
const ZF = D / 2;       // innere Wandfläche Hauptseite (−Z)
const OUT_Z = D / 2 + T;
const WIN_Z0 = -3.6;    // Fensterfront: z-Bereich
const WIN_Z1 = 3.6;
const WIN_Y0 = 1.1;     // Fenster-Sockel
const WIN_Y1 = 2.6;     // Fenster-Oberkante

function buntglasTextur() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#0d3540');
  grd.addColorStop(1, '#14423c');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);

  const s = 64, h = s * 0.866;
  const pal = ['#c98a2e', '#e2b95d', '#2f9b95', '#1f6f78', '#b4552e', '#4a7f5e'];
  let k = 0;
  for (let row = 0, y = 0; y < 256 + h; row++, y += h) {
    for (let x = -s; x < 512 + s; x += s) {
      const off = row % 2 ? s / 2 : 0;
      g.beginPath();
      g.moveTo(x + off, y);
      g.lineTo(x + off + s / 2, y + h);
      g.lineTo(x + off - s / 2, y + h);
      g.closePath();
      g.fillStyle = pal[(k++) % pal.length];
      g.fill();
      g.strokeStyle = 'rgba(18,28,32,0.65)';
      g.lineWidth = 2;
      g.stroke();
    }
  }
  // rechtwinklige Schneeflocken-Äste
  g.strokeStyle = 'rgba(240,212,146,0.92)';
  g.lineWidth = 4;
  const branch = (cx, cy, sc) => {
    g.beginPath();
    g.moveTo(cx, cy - 30 * sc); g.lineTo(cx, cy + 30 * sc);
    g.moveTo(cx - 30 * sc, cy); g.lineTo(cx + 30 * sc, cy);
    g.moveTo(cx, cy - 16 * sc); g.lineTo(cx + 18 * sc, cy - 16 * sc); g.lineTo(cx + 18 * sc, cy - 28 * sc);
    g.moveTo(cx, cy + 16 * sc); g.lineTo(cx - 18 * sc, cy + 16 * sc); g.lineTo(cx - 18 * sc, cy + 28 * sc);
    g.stroke();
  };
  branch(128, 96, 1.5); branch(384, 168, 1.5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_reading_room';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glass = kit('glass');
  const glowCool = kit('glow');
  const glowWarm = kit('amberGlow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45
  });
  const warmStrip = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_warm', color: 0xffe6bd, emissive: 0xffb968, emissiveIntensity: 1.35
  });
  const coolStrip = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_kalt', color: 0xe6f6ff, emissive: 0x9fd8ff, emissiveIntensity: 1.25
  });
  const acoustic = new THREE.MeshStandardMaterial({
    name: 'akustik_panel', color: 0x46646d, roughness: 0.95, metalness: 0.03
  });
  const buntglasMat = (() => {
    const tex = buntglasTextur();
    if (!tex) return glass;
    return new THREE.MeshStandardMaterial({
      name: 'buntglas', map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55,
      roughness: 0.28, metalness: 0.08, side: THREE.DoubleSide
    });
  })();

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
  // Instanzen: [x, y, z, rotY?]
  const inst = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, ry = 0], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };
  // Instanzen mit Skalierung: [x, y, z, sx, sy, sz]
  const instScaled = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, sx, sy, sz], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(W + 2 * T, 0.1, D + 2 * T, floorMat, 0, -0.05, 0, 'boden');
  // grün-kupferner Rand
  for (const s of [-1, 1]) {
    box(0.22, 0.014, D, patina, s * (XW - 0.11), 0.007, 0, 'boden_rand');
    box(W - 0.44, 0.014, 0.22, patina, 0, 0.007, s * (ZS - 0.11), 'boden_rand');
  }
  // Plattenfugen im 1,2-m-Raster
  const seamsZ = [], seamsX = [];
  for (let z = -D / 2 + 1.2; z < D / 2 - 0.1; z += 1.2) seamsZ.push([0, 0.003, z]);
  for (let x = -W / 2 + 1.2; x < W / 2 - 0.1; x += 1.2) seamsX.push([x, 0.003, 0]);
  inst(new THREE.BoxGeometry(W - 0.44, 0.006, 0.02), copper, seamsZ, 'boden_fugen');
  inst(new THREE.BoxGeometry(0.02, 0.006, D - 0.44), copper, seamsX, 'boden_fugen');

  // sechseckige Intarsie (Rundform im Boden zulässig)
  const ring1 = add(new THREE.RingGeometry(1.32, 1.42, 6), copper, 0, 0.012, 0.4, 'boden_intarsie');
  ring1.rotation.x = -Math.PI / 2;
  const ring2 = add(new THREE.RingGeometry(0.42, 0.5, 6), patina, 0, 0.012, 0.4, 'boden_intarsie');
  ring2.rotation.x = -Math.PI / 2;

  // Schneeflocken-Intarsie aus rechtwinkligen Ästen (Mitte der Intarsie)
  const flake = [];
  flake.push([0, 0.014, 0.4, 0.035, 0.012, 1.95]);
  flake.push([0, 0.014, 0.4, 1.95, 0.012, 0.035]);
  for (const s of [-1, 1]) {
    flake.push([0, 0.014, 0.4 + s * 0.48, 0.032, 0.012, 0.55]);
    flake.push([s * 0.27, 0.014, 0.4 + s * 0.75, 0.55, 0.012, 0.032]);
    flake.push([s * 0.48, 0.014, 0.4 + s * 0.48, 0.032, 0.012, 0.55]);
    flake.push([s * 0.27, 0.014, 0.4 + s * 0.75, 0.55, 0.012, 0.032]);
  }
  instScaled(new THREE.BoxGeometry(1, 1, 1), copper, flake, 'boden_schneeflocke');

  // ------------------------------------------------------------------ Wände
  const xL = -(W / 2 + T / 2);
  const xR = (W / 2 + T / 2);
  const zB = D / 2 + T / 2;
  const zF = -(D / 2 + T / 2);

  // Westwand (−X): durchgehend, akustisch gegliedert
  box(T, H, D + 2 * T, wall, xL, H / 2, 0, 'wand_west');

  // Ostwand (+X): Fensterfront zum Innenhof
  const pierLen = OUT_Z - WIN_Z1;                     // 1,5 m
  box(T, H, pierLen, wall, xR, H / 2, -(WIN_Z1 + pierLen / 2), 'wand_ost_pier_n');
  box(T, H, pierLen, wall, xR, H / 2, (WIN_Z1 + pierLen / 2), 'wand_ost_pier_s');
  box(T, WIN_Y0, WIN_Z1 - WIN_Z0, wall, xR, WIN_Y0 / 2, (WIN_Z0 + WIN_Z1) / 2, 'wand_ost_sockel');
  box(T, H - WIN_Y1, WIN_Z1 - WIN_Z0, wall, xR, WIN_Y1 + (H - WIN_Y1) / 2, (WIN_Z0 + WIN_Z1) / 2, 'wand_ost_sturz');

  // Rückwand (+Z): durchgehend
  box(W, H, T, wall, 0, H / 2, zB, 'wand_ruecke');

  // Hauptseite (−Z): Türöffnung 2,4 × 3,0 m, je 1,7 m Mauerwerk daneben (Platz für Schiebetürflügel)
  const sideW = (W - DW) / 2;
  box(sideW, H, T, wall, -(DW / 2 + sideW / 2), H / 2, zF, 'wand_front_links');
  box(sideW, H, T, wall, (DW / 2 + sideW / 2), H / 2, zF, 'wand_front_rechts');
  box(DW, H - DH, T, wall, 0, DH + (H - DH) / 2, zF, 'wand_front_sturz');

  // ------------------------------------------------------------------ Fensterfront
  const fzc = (WIN_Z0 + WIN_Z1) / 2;
  const fzh = WIN_Y1 - WIN_Y0;
  // Bronzerahmen (Rahmentiefe 0,36 m, ragt in den Raum)
  box(0.36, 0.14, WIN_Z1 - WIN_Z0 + 0.28, copper, xR, WIN_Y0 + 0.07, fzc, 'fenster_rahmen');
  box(0.36, 0.14, WIN_Z1 - WIN_Z0 + 0.28, copper, xR, WIN_Y1 - 0.07, fzc, 'fenster_rahmen');
  box(0.36, fzh, 0.14, copper, xR, (WIN_Y0 + WIN_Y1) / 2, WIN_Z0 - 0.07, 'fenster_rahmen');
  box(0.36, fzh, 0.14, copper, xR, (WIN_Y0 + WIN_Y1) / 2, WIN_Z1 + 0.07, 'fenster_rahmen');
  // Sprossen
  const mull = [];
  for (let z = WIN_Z0; z <= WIN_Z1 + 0.01; z += 1.2) mull.push([xR, (WIN_Y0 + WIN_Y1) / 2, Math.min(z, WIN_Z1)]);
  inst(new THREE.BoxGeometry(0.30, fzh - 0.28, 0.10), copper, mull, 'fenster_sprossen');
  // Glasfläche + Buntglas-Transom
  const glassPane = box(0.04, fzh - 0.30, WIN_Z1 - WIN_Z0 - 0.16, glass, xR, (WIN_Y0 + WIN_Y1) / 2, fzc, 'fenster_glas');
  glassPane.renderOrder = 2;
  if (buntglasMat !== glass) {
    const bg = add(new THREE.PlaneGeometry(WIN_Z1 - WIN_Z0 - 0.18, 0.46), buntglasMat, XE - 0.06, 2.26, fzc, 'fenster_buntglas');
    bg.rotation.y = -Math.PI / 2;
  }
  // Fensterbank / innere Ablage
  box(0.5, 0.08, WIN_Z1 - WIN_Z0, copper, XE - 0.24, WIN_Y0 + 0.04, fzc, 'fenster_bank');

  // ------------------------------------------------------------------ Wandgestaltung
  // Westwand: plant-on Paneele, Lichtschlitze, Sockel, Gesims
  const panelData = [], frameData = [], slotData = [], motifData = [];
  const fields = 8;
  for (let i = 0; i < fields; i++) {
    const z = -D / 2 + 0.6 + i * 1.2;
    if (i % 2 === 0) {
      frameData.push([-XW + 0.025, 1.55, z]);
      panelData.push([-XW + 0.065, 1.55, z]);
      // Schneeflocken-Lineament auf der Panelfläche (Fläche bei x = -XW + 0,085)
      const bx = -XW + 0.09;
      motifData.push([bx, 1.55, z, 0.02, 1.60, 0.035]);
      motifData.push([bx, 1.55, z, 0.02, 0.035, 0.90]);
      for (const s of [-1, 1]) {
        motifData.push([bx, 1.97, z + s * 0.24, 0.02, 0.032, 0.42]);
        motifData.push([bx, 2.08, z + s * 0.45, 0.02, 0.25, 0.032]);
        motifData.push([bx, 1.13, z + s * 0.24, 0.02, 0.032, 0.42]);
        motifData.push([bx, 1.02, z + s * 0.45, 0.02, 0.25, 0.032]);
      }
    } else {
      for (let k = 0; k < 4; k++) slotData.push([-XW + 0.014, 0.95 + k * 0.42, z]);
    }
  }
  inst(new THREE.BoxGeometry(0.05, 2.35, 1.12), copper, frameData, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.04, 2.20, 1.00), wallDark, panelData, 'paneele');
  inst(new THREE.BoxGeometry(0.025, 0.30, 0.07), warmStrip, slotData, 'lichtschlitze');
  instScaled(new THREE.BoxGeometry(1, 1, 1), copper, motifData, 'paneel_lineament');

  // Rückwand: Akustikpaneele mit Bronzerahmen und Lineament (gedämpfte Akustik)
  const backFrames = [], backPanels = [], backMotif = [];
  const backXs = [-2.175, -0.725, 0.725, 2.175];
  for (const x of backXs) {
    backFrames.push([x, 1.55, ZS - 0.025]);
    backPanels.push([x, 1.55, ZS - 0.065]);
    const bz = ZS - 0.09;
    backMotif.push([x, 1.55, bz, 0.035, 1.60, 0.02]);
    backMotif.push([x, 1.55, bz, 0.90, 0.035, 0.02]);
    for (const s of [-1, 1]) {
      backMotif.push([x + s * 0.24, 1.97, bz, 0.42, 0.032, 0.02]);
      backMotif.push([x + s * 0.45, 2.08, bz, 0.032, 0.25, 0.02]);
      backMotif.push([x + s * 0.24, 1.13, bz, 0.42, 0.032, 0.02]);
      backMotif.push([x + s * 0.45, 1.02, bz, 0.032, 0.25, 0.02]);
    }
  }
  inst(new THREE.BoxGeometry(1.12, 2.35, 0.05), copper, backFrames, 'paneel_rahmen_ruecke');
  inst(new THREE.BoxGeometry(1.00, 2.20, 0.04), acoustic, backPanels, 'akustik_paneele_ruecke');
  instScaled(new THREE.BoxGeometry(1, 1, 1), copper, backMotif, 'akustik_lineament');

  // Sockelleisten und Gesimse
  box(0.05, 0.15, D, copper, -XW + 0.025, 0.075, 0, 'sockelleiste');
  box(W, 0.15, 0.05, copper, 0, 0.075, ZS - 0.025, 'sockelleiste');
  box(0.06, 0.10, D, copper, -XW + 0.03, H - 0.05, 0, 'gesims');
  box(W, 0.10, 0.06, copper, 0, H - 0.05, ZS - 0.03, 'gesims');

  // Türrahmen (Bronzeeinfassung der Öffnung)
  for (const s of [-1, 1]) box(0.12, DH, 0.12, copper, s * (DW / 2 + 0.05), DH / 2, zF + 0.16, 'tuer_einfassung');
  box(DW + 0.24, 0.14, 0.12, copper, 0, DH + 0.04, zF + 0.16, 'tuer_einfassung');
  // Lichtschlitze neben der Tür
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) box(0.07, 0.30, 0.025, warmStrip, s * 1.75, 0.95 + k * 0.42, -ZF + 0.014, 'lichtschlitze_tuer');
  }

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke');
  // Kassettenrippen (an der Decke anliegend)
  const ribs = [];
  for (const x of [-1.45, 1.45]) ribs.push([x, H - 0.05, 0, 0.08, 0.10, D]);
  inst(new THREE.BoxGeometry(0.08, 0.10, D), copper, ribs, 'decke_rippen');
  for (let z = -D / 2 + 1.2; z <= D / 2 - 0.9; z += 1.2) ribs.push([0, H - 0.05, z, 0.08, 0.10, 0.08]);
  // Lichtfelder in der Raumachse
  const cass = [];
  for (let z = -D / 2 + 1.8; z <= D / 2 - 1.8; z += 2.4) cass.push([0, H - 0.03, z]);
  inst(new THREE.BoxGeometry(1.7, 0.06, 0.62), warmStrip, cass, 'decke_lichtfelder');
  // Akustikrippen an der Decke (anliegend, schmale Lamellen)
  const baffles = [];
  for (let z = -D / 2 + 0.9; z <= D / 2 - 0.6; z += 1.2) baffles.push([0, H - 0.15, z]);
  inst(new THREE.BoxGeometry(W - 1.2, 0.30, 0.12), wallDark, baffles, 'decke_akustikrippen');
  // indirektes Licht an den Deckenkanten
  box(0.09, 0.08, D - 0.5, warmStrip, -XW + 0.45, H - 0.04, 0, 'decke_lichtband');
  box(0.09, 0.08, D - 0.5, coolStrip, XE - 0.45, H - 0.04, 0, 'decke_lichtband');

  // ------------------------------------------------------------------ Anschlüsse
  empty('DOOR_eingang', 0, 0, zF, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Bibliotheksanschluss / Korridor', raum: 'ATL-003'
  });
  // Fertige Antiker-Schiebetür: Ursprung in der Wandmitte, +Z zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, zF, 0);

  // ------------------------------------------------------------------ Objektplätze
  // Wandleuchten: Rückseite an der Wand, Vorderseite zeigt in den Raum
  empty('PLACE_OBJ-053', -1.45, 2.2, ZS, Math.PI);
  empty('PLACE_OBJ-053_2', 0.0, 2.2, ZS, Math.PI);
  empty('PLACE_OBJ-053_3', 1.45, 2.2, ZS, Math.PI);
  empty('PLACE_OBJ-053_4', -XW, 2.2, -4.55, Math.PI / 2);
  // Daten-Pads (Standobjekte, Fußpunkt auf dem Boden)
  empty('PLACE_OBJ-056', -2.10, 0, 1.60, 0);
  empty('PLACE_OBJ-056_2', -2.10, 0, 2.90, 0);
  // Gedenk-Teeservice (Standobjekt, Fußpunkt auf dem Boden)
  empty('PLACE_OBJ-083', -2.15, 0, -0.60, 0);

  // ------------------------------------------------------------------ LAMP_-Punkte
  const lampData = [
    { x: 0.0, y: 2.75, z: -3.2, color: '#ffd8a0', intensity: 9, distance: 8.5 },
    { x: 0.0, y: 2.75, z: -0.9, color: '#ffd8a0', intensity: 9, distance: 8.5 },
    { x: 0.0, y: 2.75, z: 1.4, color: '#ffd8a0', intensity: 9, distance: 8.5 },
    { x: 0.0, y: 2.75, z: 3.7, color: '#ffd8a0', intensity: 9, distance: 8.5 },
    { x: 2.0, y: 2.55, z: 0.4, color: '#9fd8ff', intensity: 7, distance: 7.5 }
  ];
  const lampObjs = [];
  lampData.forEach((d, i) => {
    const l = new THREE.PointLight(new THREE.Color(d.color), d.intensity, d.distance, 2);
    l.name = `LAMP_${i + 1}`;
    l.position.set(d.x, d.y, d.z);
    l.userData = { color: d.color, intensity: d.intensity, distance: d.distance };
    root.add(l);
    lampObjs.push(l);
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
  col('COL_wand_west', T, H, D + 2 * T, xL, H / 2, 0);
  col('COL_wand_ost_pier_n', T, H, pierLen, xR, H / 2, -(WIN_Z1 + pierLen / 2));
  col('COL_wand_ost_pier_s', T, H, pierLen, xR, H / 2, (WIN_Z1 + pierLen / 2));
  col('COL_wand_ost_sockel', T, WIN_Y0, WIN_Z1 - WIN_Z0, xR, WIN_Y0 / 2, fzc);
  col('COL_wand_ost_sturz', T, H - WIN_Y1, WIN_Z1 - WIN_Z0, xR, WIN_Y1 + (H - WIN_Y1) / 2, fzc);
  col('COL_wand_ruecke', W, H, T, 0, H / 2, zB);
  col('COL_wand_front_links', sideW, H, T, -(DW / 2 + sideW / 2), H / 2, zF);
  col('COL_wand_front_rechts', sideW, H, T, (DW / 2 + sideW / 2), H / 2, zF);
  col('COL_wand_front_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, zF);

  // ------------------------------------------------------------------ Animation & API
  let t = 0, last = null;
  root.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    warmStrip.emissiveIntensity = 1.32 + Math.sin(t * 0.7) * 0.14;
    coolStrip.emissiveIntensity = 1.22 + Math.sin(t * 0.55 + 1.1) * 0.10;
    lampObjs.forEach((l, i) => {
      l.intensity = lampData[i].intensity * (1 + Math.sin(t * 0.7 + i * 0.6) * 0.07);
    });
  };

  root.userData.raum = {
    id: 'ATL-027',
    name: 'raum_reading_room',
    etage: 4,
    bereich: 'Inner City',
    lichteBreite: W,
    lichteTiefe: D,
    lichteHoehe: H
  };
  root.userData.api = {
    getPlatz: (name) => root.getObjectByName(name),
    getLampen: () => lampObjs.slice(),
    getTuer: () => root.getObjectByName('DOOR_eingang'),
    getRaumInfo: () => root.userData.raum
  };

  return root;
}

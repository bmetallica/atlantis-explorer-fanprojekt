// Raum ATL-028: Archiv / Bibliothek der Antiker (Inner City, Etage 4)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Raumhülle: nur Architektur (Wandnischen, Paneele, Fenster, Deckenfelder, Intarsien).
// Möbel, Konsolen, Bänke und Leitern werden NICHT gebaut; Datenspeichersäulen
// werden später als OBJ-028 an den PLACE_-Punkten eingesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_archives',
  art: 'Raum',
  masse: 'ca. 14,0 m × 15,0 m (≈ 210 m²), lichte Höhe 4,5 m',
  wohin: 'Inner City, Etage 4 – Zugang über den Hauptkorridor (DOOR_haupteingang, −Z)',
  benutzen: 'Datenspeichersäulen (OBJ-028) in den Reihen aufstellen, Master-Steuerkristall (OBJ-048) auf das Podest legen',
  lichter: '7 LAMP_-Punkte, eisblau, schwach/indirekt; Lichtschlitze in den Wandfugen und Deckenbänder',
  animation: 'Lichtschlitze, Deckenbänder und Kristall-Nischen atmen langsam (emissive Intensität pulsiert)',
  quelle: 'Auftrag ATL-028 (Beschreibung „Archive“, Quellenklasse A), Referenzbilder ref1/ref2, Atlantis-Setpläne „Halls & Corridors“',
};

export const varianten = [
  { label: 'Archiv – Standard (14 × 15 m)', opts: {} },
];

/** Buntglas-Textur: geometrische Schneeflocken in Bernstein, Türkis und Blaugrün. */
function buntglasTextur() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');

  const bg = g.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#0d2a38');
  bg.addColorStop(0.55, '#123b49');
  bg.addColorStop(1, '#0a1e2a');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);

  // feine Rasterlinien
  g.strokeStyle = 'rgba(120,190,205,0.18)';
  g.lineWidth = 1;
  for (let x = 0; x <= 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let y = 0; y <= 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }

  const flake = (cx, cy, r, color, lw) => {
    g.strokeStyle = color;
    g.lineWidth = lw;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const ex = cx + Math.cos(a) * r;
      const ey = cy + Math.sin(a) * r;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(ex, ey);
      g.stroke();
      // rechtwinklige Abzweige
      const bx = cx + Math.cos(a) * r * 0.62;
      const by = cy + Math.sin(a) * r * 0.62;
      const px = -Math.sin(a);
      const py = Math.cos(a);
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + px * r * 0.2, by + py * r * 0.2);
      g.stroke();
    }
  };

  flake(128, 128, 84, 'rgba(255,183,74,0.85)', 5);
  flake(384, 128, 84, 'rgba(94,214,201,0.85)', 5);
  flake(256, 128, 48, 'rgba(220,240,255,0.55)', 3);

  // geometrische Randbänder
  g.fillStyle = 'rgba(255,183,74,0.75)';
  g.fillRect(0, 0, 512, 6);
  g.fillRect(0, 250, 512, 6);
  g.fillStyle = 'rgba(94,214,201,0.65)';
  g.fillRect(0, 10, 512, 3);
  g.fillRect(0, 243, 512, 3);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function create(opts = {}) {
  const W = 14.0;            // lichte Breite (X)
  const D = 15.0;            // lichte Tiefe (Z)
  const H = 4.5;             // lichte Höhe
  const T = 0.3;             // Wanddicke
  const DW = 2.4;            // Türöffnungsbreite
  const DH = 3.0;            // Türöffnungshöhe

  const root = new THREE.Group();
  root.name = 'raum_archives';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const matLine = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.5,
  });
  const matNiche = new THREE.MeshStandardMaterial({
    name: 'nische_kristall', color: 0x8fc9d8, emissive: 0x3f8fa8, emissiveIntensity: 0.85,
    metalness: 0.2, roughness: 0.3,
  });

  const addMesh = (geo, mat, x, y, z, ry = 0, name = '') => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name = '', ry = 0) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, ry, name);

  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(W, 0.1, D, matFloor, 0, -0.05, 0, 'boden');
  // grün-kupferner Rand
  box(0.24, 0.014, D, matPatina, -W / 2 + 0.12, 0.007, 0, 'boden_rand_links');
  box(0.24, 0.014, D, matPatina, W / 2 - 0.12, 0.007, 0, 'boden_rand_rechts');
  box(W - 0.48, 0.014, 0.24, matPatina, 0, 0.007, D / 2 - 0.12, 'boden_rand_hinten');
  box((W / 2 - 1.2), 0.014, 0.24, matPatina, -(1.2 + (W / 2 - 1.2) / 2), 0.007, -D / 2 + 0.12, 'boden_rand_vorne_l');
  box((W / 2 - 1.2), 0.014, 0.24, matPatina, (1.2 + (W / 2 - 1.2) / 2), 0.007, -D / 2 + 0.12, 'boden_rand_vorne_r');

  // Plattenfugen im 1,2-m-Raster
  const seamsX = [], seamsZ = [];
  for (let x = -6; x <= 6.001; x += 1.2) seamsX.push({ x, y: 0.003, z: 0 });
  for (let z = -7.2; z <= 7.201; z += 1.2) seamsZ.push({ x: 0, y: 0.003, z });
  inst(new THREE.BoxGeometry(0.018, 0.006, D), matCopper, seamsX, 'boden_fugen_längs');
  inst(new THREE.BoxGeometry(W, 0.006, 0.018), matCopper, seamsZ, 'boden_fugen_quer');

  // Führungsstreifen des Mittelgangs (eingelassene Bronzeleisten)
  for (const x of [-1.6, 1.6]) box(0.06, 0.008, D - 1.2, matCopper, x, 0.006, 0, 'boden_leitstreifen');

  // zentrale hexagonale Schneeflocken-Intarsie (Bodenintarsie, rund zulässig)
  const hexR = 2.6;
  const hexPts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    hexPts.push({ x: Math.cos(a) * hexR, z: Math.sin(a) * hexR });
  }
  for (let i = 0; i < 6; i++) {
    const p1 = hexPts[i];
    const p2 = hexPts[(i + 1) % 6];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    box(len, 0.01, 0.08, matCopper, (p1.x + p2.x) / 2, 0.009, (p1.z + p2.z) / 2,
      'boden_intarsie_sechseck', -Math.atan2(dz, dx));
  }
  for (const p of hexPts) {
    const ang = Math.atan2(p.z, p.x);
    box(2.25, 0.01, 0.05, matCopper, p.x * 0.48, 0.009, p.z * 0.48,
      'boden_intarsie_strahl', -ang + Math.PI / 2);
  }
  box(0.9, 0.01, 0.9, matPatina, 0, 0.009, 0, 'boden_intarsie_mitte');

  // ------------------------------------------------------------------ Wände
  const frontZ = -D / 2 - T / 2;   // Wandmitte Vorderwand (−Z, Haupteingang)
  const backZ = D / 2 + T / 2;
  const leftX = -W / 2 - T / 2;
  const rightX = W / 2 + T / 2;

  // Vorderwand mit Türöffnung 2,4 × 3,0 m (Mitte bei x = 0)
  const segW = (W / 2 - 1.2) + T;              // 6,1 m je Seite
  box(segW, H, T, matWall, -(1.2 + segW / 2), H / 2, frontZ, 'wand_vorne_links');
  box(segW, H, T, matWall, (1.2 + segW / 2), H / 2, frontZ, 'wand_vorne_rechts');
  box(DW, H - DH, T, matWall, 0, DH + (H - DH) / 2, frontZ, 'wand_vorne_sturz');

  // Hinterwand
  box(W + 2 * T, H, T, matWall, 0, H / 2, backZ, 'wand_hinten');

  // Linke Wand
  box(T, H, D, matWall, leftX, H / 2, 0, 'wand_links');

  // Rechte Wand mit großem rechteckigem Fenster (5,4 × 2,0 m)
  const winZ0 = -2.7, winZ1 = 2.7, winY0 = 1.3, winY1 = 3.3;
  box(T, winY0, D, matWall, rightX, winY0 / 2, 0, 'wand_rechts_unten');
  box(T, H - winY1, D, matWall, rightX, winY1 + (H - winY1) / 2, 0, 'wand_rechts_oben');
  box(T, winY1 - winY0, (winZ0 + D / 2), matWall, rightX, (winY0 + winY1) / 2, (-D / 2 + winZ0) / 2, 'wand_rechts_süd');
  box(T, winY1 - winY0, (D / 2 - winZ1), matWall, rightX, (winY0 + winY1) / 2, (winZ1 + D / 2) / 2, 'wand_rechts_nord');

  // Fensterrahmen + Buntglasfläche
  box(0.14, 0.1, winZ1 - winZ0 + 0.2, matCopper, W / 2 - 0.02, winY0 - 0.05, 0, 'fenster_rahmen_unten');
  box(0.14, 0.1, winZ1 - winZ0 + 0.2, matCopper, W / 2 - 0.02, winY1 + 0.05, 0, 'fenster_rahmen_oben');
  for (const z of [winZ0, -0.9, 0.9, winZ1]) {
    box(0.14, winY1 - winY0 + 0.2, 0.1, matCopper, W / 2 - 0.02, (winY0 + winY1) / 2, z, 'fenster_pfosten');
  }
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'buntglas', color: 0xffffff, map: buntglasTextur(),
    emissive: 0xffffff, emissiveMap: buntglasTextur(), emissiveIntensity: 0.55,
    roughness: 0.15, metalness: 0.1, side: THREE.DoubleSide,
  });
  const glassPane = addMesh(new THREE.PlaneGeometry(winZ1 - winZ0, winY1 - winY0), glassMat,
    W / 2 - 0.03, (winY0 + winY1) / 2, 0, Math.PI / 2, 'fenster_buntglas');
  glassPane.renderOrder = 1;

  // ------------------------------------------------------------------ Wandpaneele, Lineament, Lichtschlitze, Sockel, Gesims
  const frames = [], panels = [], slots = [];
  const panelRun = (axis, fixed, s, from, to) => {
    const len = to - from;
    const n = Math.max(1, Math.floor(len / 1.2));
    const start = from + (len - n * 1.2) / 2;
    for (let i = 0; i < n; i++) {
      const c = start + i * 1.2 + 0.6;
      const at = (d) => (axis === 'x'
        ? { x: c, y: 1.62, z: fixed + s * d }
        : { x: fixed + s * d, y: 1.62, z: c });
      const ry = axis === 'x' ? 0 : Math.PI / 2;
      if (i % 2 === 0) {
        frames.push({ ...at(0.055), ry });
        panels.push({ ...at(0.028), ry });
      } else {
        slots.push({ ...at(0.022), ry });
      }
    }
    const cx = axis === 'x' ? (from + to) / 2 : fixed;
    const cz = axis === 'x' ? fixed : (from + to) / 2;
    const lw = axis === 'x' ? len : 0.05;
    const ld = axis === 'x' ? 0.05 : len;
    box(lw, 0.15, ld, matCopper, cx, 0.075, cz, 'sockelleiste');
    box(lw, 0.1, ld, matCopper, cx, H - 0.05, cz, 'gesims');
  };
  panelRun('x', -D / 2, 1, -W / 2, -1.4);
  panelRun('x', -D / 2, 1, 1.4, W / 2);
  panelRun('x', D / 2, -1, -W / 2, W / 2);
  panelRun('z', -W / 2, 1, -D / 2, D / 2);
  panelRun('z', W / 2, -1, -D / 2, -3.0);
  panelRun('z', W / 2, -1, 3.0, D / 2);

  inst(new THREE.BoxGeometry(1.14, 2.8, 0.05), matCopper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.0, 2.62, 0.035), matWallDark, panels, 'paneele');

  // Lineament (rechtwinklige Schneeflocke) in jedem zweiten Paneel
  const stems = [], branches = [];
  for (const p of panels) {
    stems.push({ x: p.x, y: p.y, z: p.z, ry: p.ry });
    const cs = Math.cos(p.ry), sn = Math.sin(p.ry);
    for (const lx of [-0.42, 0.42]) {
      for (const ly of [0.42, -0.42]) {
        branches.push({ x: p.x + lx * cs, y: p.y + ly, z: p.z - lx * sn, ry: p.ry });
      }
    }
  }
  inst(new THREE.BoxGeometry(0.05, 1.55, 0.03), matCopper, stems, 'paneel_lineament_stamm');
  inst(new THREE.BoxGeometry(0.48, 0.05, 0.03), matCopper, branches, 'paneel_lineament_zweige');

  const slotMesh = inst(new THREE.BoxGeometry(0.07, 1.9, 0.03), matLine, slots, 'lichtschlitze');

  // ------------------------------------------------------------------ Eingebaute Speicher-Nischen (Architektur) mit Kristallglanz
  const nicheBack = [], nicheFrame = [], nicheGlow = [];
  const addNiche = (axis, fixed, s, c) => {
    const at = (d, y) => (axis === 'x'
      ? { x: c, y, z: fixed + s * d }
      : { x: fixed + s * d, y, z: c });
    const ry = axis === 'x' ? 0 : Math.PI / 2;
    nicheBack.push({ ...at(0.03, 1.9), ry });
    nicheFrame.push({ ...at(0.09, 1.9), ry });
    nicheGlow.push({ ...at(0.055, 1.9), ry });
  };
  for (let z = -6; z <= 6.001; z += 2.4) addNiche('z', -W / 2, 1, z);
  for (let z = -6; z <= 6.001; z += 2.4) addNiche('z', W / 2, -1, z);
  for (let x = -5.4; x <= 5.401; x += 2.4) addNiche('x', D / 2, -1, x);
  inst(new THREE.BoxGeometry(1.3, 2.3, 0.04), matWallDark, nicheBack, 'nischen_flaeche');
  inst(new THREE.BoxGeometry(1.46, 2.46, 0.06), matCopper, nicheFrame, 'nischen_rahmen');
  const nicheMesh = inst(new THREE.BoxGeometry(0.9, 1.9, 0.03), matNiche, nicheGlow, 'nischen_kristallglanz');

  // ------------------------------------------------------------------ Eckpfeiler (polygonal)
  const pillarGeo = new THREE.CylinderGeometry(0.26, 0.34, H, 6, 1);
  const pillarXs = [-W / 2 + 0.55, W / 2 - 0.55];
  const pillarZs = [-D / 2 + 0.55, D / 2 - 0.55];
  const pillarList = [];
  for (const x of pillarXs) for (const z of pillarZs) pillarList.push({ x, y: H / 2, z });
  inst(pillarGeo, matPillar, pillarList, 'saeulen');
  for (const x of pillarXs) for (const z of pillarZs) {
    const strut = box(0.12, 0.9, 0.12, matPillar, x, H - 0.42, z, 'saeulen_strebe');
    strut.rotation.z = x < 0 ? 0.35 : -0.35;
    strut.rotation.x = z < 0 ? -0.35 : 0.35;
  }

  // ------------------------------------------------------------------ Podest für den Master-Steuerkristall
  box(1.0, 0.4, 1.0, matWallDark, 5.7, 0.2, 6.7, 'podest_master');
  box(1.08, 0.06, 1.08, matCopper, 5.7, 0.43, 6.7, 'podest_master_platte');
  box(0.5, 0.02, 0.5, matNiche, 5.7, 0.465, 6.7, 'podest_master_auflage');

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, matCeiling, 0, H + 0.15, 0, 'decke_hauptflaeche');
  const coffers = [];
  for (let z = -6.6; z <= 6.601; z += 1.2) coffers.push({ x: 0, y: H - 0.025, z });
  inst(new THREE.BoxGeometry(W - 1.2, 0.05, 0.9), matWallDark, coffers, 'decke_kassetten');
  box(0.12, 0.05, D - 0.8, matGlow, -W / 2 + 0.75, H - 0.03, 0, 'decke_lichtband_links');
  box(0.12, 0.05, D - 0.8, matGlow, W / 2 - 0.75, H - 0.03, 0, 'decke_lichtband_rechts');
  const deckLights = [];
  for (const z of [-4.8, -1.6, 1.6, 4.8]) deckLights.push({ x: 0, y: H - 0.045, z });
  const deckLightMesh = inst(new THREE.BoxGeometry(1.8, 0.04, 0.55), matGlow, deckLights, 'decke_lichtfelder');

  // abgehängte Blenden über den Reihen (Beleuchtung der Speichersäulen)
  for (const x of [-4.0, 4.0]) {
    for (const z of [-5.0, -1.7, 1.7, 5.0]) {
      box(2.2, 0.22, 0.5, matWallDark, x, H - 0.16, z, 'decke_blende');
      box(1.9, 0.03, 0.22, matGlow, x, H - 0.29, z, 'decke_blende_leuchte');
    }
  }

  // ------------------------------------------------------------------ Türöffnung: Zarge
  box(0.08, DH, T + 0.08, matCopper, -1.24, DH / 2, frontZ, 'tuer_zarge_links');
  box(0.08, DH, T + 0.08, matCopper, 1.24, DH / 2, frontZ, 'tuer_zarge_rechts');
  box(DW + 0.16, 0.1, T + 0.08, matCopper, 0, DH + 0.05, frontZ, 'tuer_zarge_oben');
  // Türpaneel-Platz (Wandmodul) links neben der Öffnung
  box(0.7, 1.0, 0.08, matWallDark, -1.85, 1.6, -D / 2 + 0.04, 'tuerpaneel_einfassung');
  box(0.54, 0.84, 0.03, matNiche, -1.85, 1.6, -D / 2 + 0.09, 'tuerpaneel_glow');

  // ------------------------------------------------------------------ Objektplätze
  const place = (name, x, y, z, ry, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = ry;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Antiker-Schiebetür in der Öffnung, Vorderseite (+Z) zeigt in den Raum
  place('PLACE_OBJ-091', 0, 0, frontZ, 0);

  // Datenspeichersäulen: vier Reihen à zwei Stück, Mittelgang bleibt frei
  const colX = [-4.0, 4.0];
  const colZ = [-5.0, -1.7, 1.7, 5.0];
  let nCol = 0;
  for (const z of colZ) for (const x of colX) {
    nCol++;
    place(nCol === 1 ? 'PLACE_OBJ-028' : `PLACE_OBJ-028_${nCol}`, x, 0, z, 0);
  }

  // Master-Steuerkristall (flach liegend) auf dem festen Podest
  place('PLACE_OBJ-048', 5.7, 0.47, 6.7, 0);

  // Türanschluss
  place('DOOR_haupteingang', 0, 0, frontZ, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Korridor Inner City', raum: 'ATL-049',
  });

  // ------------------------------------------------------------------ Licht
  const lampPositions = [
    [0, H - 0.35, -5.4], [0, H - 0.35, 0], [0, H - 0.35, 5.4],
    [-5.4, H - 0.45, -2.6], [-5.4, H - 0.45, 2.6],
    [5.4, H - 0.45, -2.6], [5.4, H - 0.45, 2.6],
  ];
  lampPositions.forEach((p, i) => {
    place(`LAMP_${String(i + 1).padStart(2, '0')}`, p[0], p[1], p[2], 0, {
      color: '#9fd8ff', intensity: 7, distance: 13,
    });
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
  col('COL_wand_vorne_links', segW, H, T, -(1.2 + segW / 2), H / 2, frontZ);
  col('COL_wand_vorne_rechts', segW, H, T, (1.2 + segW / 2), H / 2, frontZ);
  col('COL_wand_vorne_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, frontZ);
  col('COL_wand_hinten', W + 2 * T, H, T, 0, H / 2, backZ);
  col('COL_wand_links', T, H, D, leftX, H / 2, 0);
  col('COL_wand_rechts_unten', T, winY0, D, rightX, winY0 / 2, 0);
  col('COL_wand_rechts_oben', T, H - winY1, D, rightX, winY1 + (H - winY1) / 2, 0);
  col('COL_wand_rechts_sued', T, winY1 - winY0, winZ0 + D / 2, rightX, (winY0 + winY1) / 2, (-D / 2 + winZ0) / 2);
  col('COL_wand_rechts_nord', T, winY1 - winY0, D / 2 - winZ1, rightX, (winY0 + winY1) / 2, (winZ1 + D / 2) / 2);
  for (const x of pillarXs) for (const z of pillarZs) col('COL_saeule', 0.6, H, 0.6, x, H / 2, z);
  col('COL_podest_master', 1.08, 0.46, 1.08, 5.7, 0.23, 6.7);

  // ------------------------------------------------------------------ Animation (Licht atmen)
  let t = 0, last = null;
  const breathe = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    const p = 1 + Math.sin(t * 0.7) * 0.11;
    matLine.emissiveIntensity = 1.45 * p;
    matGlow.emissiveIntensity = 1.4 * p;
    matNiche.emissiveIntensity = 0.85 * p;
  };
  if (slotMesh) slotMesh.onBeforeRender = breathe;
  else if (nicheMesh) nicheMesh.onBeforeRender = breathe;
  else if (deckLightMesh) deckLightMesh.onBeforeRender = breathe;

  // ------------------------------------------------------------------ API / Metadaten
  root.userData.raum = { id: 'ATL-028', name: 'raum_archives', breite: W, tiefe: D, hoehe: H };
  root.userData.api = {
    setLicht(intensitaet = 1) {
      matLine.emissiveIntensity = 1.45 * intensitaet;
      matGlow.emissiveIntensity = 1.4 * intensitaet;
      matNiche.emissiveIntensity = 0.85 * intensitaet;
    },
    getPlatzierungen() {
      return root.children.filter((c) => c.name.startsWith('PLACE_OBJ-'))
        .map((c) => ({ name: c.name, position: c.position.toArray(), rotationY: c.rotation.y }));
    },
  };

  return root;
}

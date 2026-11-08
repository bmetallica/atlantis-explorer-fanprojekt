// Raum ATL-008: Büro von Kate Heightmeyer (Control Tower, Etage 6).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Haupteingang an der Seite −Z. Leere Hülle: nur Architektur, kein Mobiliar.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_kate_heightmeyer_office',
  art: 'Raum',
  masse: 'ca. 44,5 m² Grundfläche (7,2 × 6,4 m), 3,2 m lichte Deckenhöhe, Wandstärke 0,3 m',
  wohin: 'Control Tower, Etage 6 – ruhiges Beratungsbüro der Chefwissenschaftlerin mit Fensterblick auf die Innenstadt',
  benutzen: 'beraumen; Athosisches Gedenk-Teeservice am PLACE_OBJ-083, Sitzmöbel werden später gesetzt',
  lichter: '6 LAMP_-Punkte: 4 warm (#ffd8a0) an Seiten-/Eingangswand, 2 kühl (#9fd8ff) an der Fensterfront',
  animation: 'warmes Decken- und Wandlicht atmet minimal, Fensterlicht und Horizont bleiben ruhig',
  quelle: 'rekonstruiert nach Staffel-3-Screencap „Psychologisches Beratungsbüro von Dr. Kate Heightmeyer“ (Quellenklasse B), Atlantis-Kupferpalette',
};

export const varianten = [
  { label: 'Standard – Fensterfront mit Abendlicht', opts: {} },
  { label: 'Kühle Morgenhelligkeit', opts: { warm: false } },
  { label: 'Warme Abendstimmung', opts: { warm: true } },
];

const H = 3.2;          // lichte Raumhöhe
const T = 0.3;          // Wandstärke
const DOOR_W = 2.4;     // Türbreite
const DOOR_H = 3.0;     // Türhöhe
const WIN_W = 4.2;      // Fensterbreite
const WIN_SILL = 0.42;  // Fensterbankhöhe
const WIN_TOP = 2.88;   // Fensterkopfhöhe

// Grundriss: achteckig, Ecken 45° abgeflacht (sanft geschwungene Wirkung durch Rundpfeiler)
const POLY = [
  [-2.7, -3.2], [2.7, -3.2], [3.6, -2.3], [3.6, 2.3],
  [2.7, 3.2], [-2.7, 3.2], [-3.6, 2.3], [-3.6, -2.3],
];

// Wandkontur: halbe Ausdehnung in X/Z für einachsige Raumplatten
const halfX = (z) => (Math.abs(z) <= 2.3 ? 3.6 : 5.9 - Math.abs(z));
const halfZ = (x) => (Math.abs(x) <= 2.7 ? 3.2 : 5.9 - Math.abs(x));

// Horizont-Blick durch die Fensterfront (Canvas; fällt ohne DOM auf einfarbige Rückwand zurück)
function himmelMaterial() {
  if (typeof document === 'undefined') {
    return new THREE.MeshStandardMaterial({
      name: 'fenster_horizont', color: 0x9db6c9, emissive: 0x7d9ab3, emissiveIntensity: 0.55, roughness: 1,
    });
  }
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0.00, '#28456b');
  grd.addColorStop(0.40, '#74849a');
  grd.addColorStop(0.60, '#d59a63');
  grd.addColorStop(0.76, '#f4cd93');
  grd.addColorStop(1.00, '#dfa870');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  // ferne Innenstadt-Silhouette mit warmen Fensterlichtern
  const hs = [[8, 146, 24], [38, 112, 32], [78, 152, 20], [106, 98, 26], [142, 134, 28], [178, 106, 24], [210, 144, 28]];
  for (const [x, y, w] of hs) {
    g.fillStyle = '#39495c';
    g.fillRect(x, y, w, 256 - y);
    g.fillStyle = 'rgba(255,208,126,0.75)';
    for (let i = 0; i < 10; i++) {
      if ((i * 7 + x) % 3 === 0) g.fillRect(x + 4 + (i % 3) * 8, y + 10 + Math.floor(i / 3) * 16, 3, 4);
    }
  }
  g.fillStyle = 'rgba(242,205,155,0.22)'; g.fillRect(0, 200, 256, 56);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    name: 'fenster_horizont', map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 1,
  });
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_kate_heightmeyer_office';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glassMat = kit('glass');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45 });
  const glowCool = new THREE.MeshStandardMaterial({ name: 'lichtleiste_kalt', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.35, roughness: 0.4 });
  const glowWarm = new THREE.MeshStandardMaterial({ name: 'lichtleiste_warm', color: 0xffe6c4, emissive: 0xffb86b, emissiveIntensity: 1.25, roughness: 0.4 });
  const fieldWarm = new THREE.MeshStandardMaterial({ name: 'lichtfeld_buero', color: 0xffe8cd, emissive: 0xffc78c, emissiveIntensity: 0.85, roughness: 0.6 });
  const skyMat = himmelMaterial();

  const add = (geo, mat, x, y, z, name, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, ry = 0) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, ry);

  const col = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
  };

  const inst = (geo, mat, items, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(0, it.ry || 0, 0);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.count = items.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // ------------------------------------------------------------------ Boden & Decke (Oktogon)
  const shape = new THREE.Shape();
  POLY.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  add(floorGeo, floorMat, 0, -0.3, 0, 'boden_octogon');

  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  add(ceilGeo, ceilMat, 0, H, 0, 'decke_octogon');

  // ------------------------------------------------------------------ Wanddefinitionen
  // kind: door (−Z), window (+Z), side (±X, Lüftungslouven), chamfer (45°-Ecken)
  const kinds = ['door', 'chamfer', 'side', 'chamfer', 'window', 'chamfer', 'side', 'chamfer'];
  const panelItems = [], frameItems = [], slotItems = [], borderItems = [];

  for (let i = 0; i < POLY.length; i++) {
    const a = POLY[i], b = POLY[(i + 1) % POLY.length];
    const kind = kinds[i];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ry = -Math.atan2(dz, dx);
    const ux = dx / len, uz = dz / len;
    const nx = -uz, nz = ux;              // Innennormale
    const ox = -nx, oz = -nz;             // Außennormale
    const at = (s) => [a[0] + ux * s, a[1] + uz * s];

    const piece = (s0, s1, y0, y1, tag) => {
      const l = s1 - s0;
      if (l < 0.001 || y1 - y0 < 0.001) return;
      const [px, pz] = at((s0 + s1) / 2);
      const cx = px + ox * (T / 2), cz = pz + oz * (T / 2);
      box(l, y1 - y0, T, wallMat, cx, (y0 + y1) / 2, cz, `wand_${i}_${tag}`, ry);
      col(`COL_wand_${i}_${tag}`, l, y1 - y0, T, cx, (y0 + y1) / 2, cz, ry);
      if (y0 === 0) {
        box(l, 0.15, 0.05, copper, px + nx * 0.025, 0.075, pz + nz * 0.025, `sockel_${i}_${tag}`, ry);
        borderItems.push({ x: px + nx * 0.15, y: 0.007, z: pz + nz * 0.15, ry, l });
      }
      if (y1 >= H - 0.001) {
        box(l, 0.1, 0.06, copper, px + nx * 0.03, H - 0.05, pz + nz * 0.03, `gesims_${i}_${tag}`, ry);
      }
    };

    if (kind === 'door') {
      piece(0, 1.5, 0, H, 'links');
      piece(3.9, 5.4, 0, H, 'rechts');
      piece(1.5, 3.9, DOOR_H, H, 'sturz');
    } else if (kind === 'window') {
      piece(0, 0.6, 0, H, 'links');
      piece(4.8, 5.4, 0, H, 'rechts');
      piece(0.6, 4.8, 0, WIN_SILL, 'bristung');
      piece(0.6, 4.8, WIN_TOP, H, 'sturz');
    } else {
      piece(0, len, 0, H, 'voll');
    }

    // Wandpaneele und Lichtschlitze je Wandart
    const panelAt = (s, withSlots) => {
      const [px, pz] = at(s);
      frameItems.push({ x: px + nx * 0.03, y: 1.5, z: pz + nz * 0.03, ry });
      panelItems.push({ x: px + nx * 0.06, y: 1.5, z: pz + nz * 0.06, ry });
      if (withSlots) {
        for (let q = 0; q < 4; q++) {
          slotItems.push({ x: px + nx * 0.088, y: 1.0 + q * 0.44, z: pz + nz * 0.088, ry });
        }
      }
    };
    const slotStack = (s) => {
      const [px, pz] = at(s);
      for (let q = 0; q < 5; q++) {
        slotItems.push({ x: px + nx * 0.03, y: 0.75 + q * 0.42, z: pz + nz * 0.03, ry });
      }
    };

    if (kind === 'door') {
      panelAt(0.75, true);
      panelAt(4.65, true);
    } else if (kind === 'side') {
      panelAt(0.45, false);
      panelAt(4.15, false);
    } else if (kind === 'window') {
      slotStack(0.3);
      slotStack(5.1);
    } else {
      slotStack(len / 2);
    }
  }

  inst(new THREE.BoxGeometry(0.95, 2.7, 0.05), copper, frameItems, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.85, 2.6, 0.035), wallDark, panelItems, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.06, 0.3, 0.025), glowWarm, slotItems, 'lichtschlitze');

  // Boden-Bordüre (Segmentweise, Türöffnung bleibt frei)
  for (const b of borderItems) box(b.l - 0.14, 0.014, 0.07, patina, b.x, b.y, b.z, 'boden_bordure', b.ry);

  // ------------------------------------------------------------------ Bodenplatten-Fugen
  const seamH = [], seamV = [];
  for (const z of [-2.4, -1.2, 0, 1.2, 2.4]) {
    const w = halfX(z) - 0.22;
    seamH.push({ x: 0, y: 0.005, z, ry: 0, l: w * 2 });
  }
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) {
    const d = halfZ(x) - 0.22;
    seamV.push({ x, y: 0.005, z: 0, ry: Math.PI / 2, l: d * 2 });
  }
  for (const s of seamH) box(s.l, 0.008, 0.018, copper, s.x, s.y, s.z, 'boden_fuge');
  for (const s of seamV) box(s.l, 0.008, 0.018, copper, s.x, s.y, s.z, 'boden_fuge', s.ry);

  // ------------------------------------------------------------------ Bodenintarsie: Schneeflocke
  const ring = add(new THREE.RingGeometry(1.62, 1.69, 72), copper, 0, 0.009, 0.1, 'boden_intarsie_ring');
  ring.rotation.x = -Math.PI / 2;
  const ring2 = add(new THREE.RingGeometry(0.40, 0.46, 48), copper, 0, 0.009, 0.1, 'boden_intarsie_mitte');
  ring2.rotation.x = -Math.PI / 2;

  const flake = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const dx = Math.sin(a), dz = Math.cos(a);
    flake.push({ x: dx * 0.62, y: 0.008, z: 0.1 + dz * 0.62, ry: a });
    for (const [d, side] of [[0.52, -1], [0.52, 1], [0.92, -1], [0.92, 1]]) {
      const b = a + side * Math.PI / 3;
      const bx = Math.sin(b), bz = Math.cos(b);
      const len = 0.34;
      flake.push({
        x: dx * d + bx * (len / 2),
        y: 0.008,
        z: 0.1 + dz * d + bz * (len / 2),
        ry: b,
      });
    }
  }
  inst(new THREE.BoxGeometry(0.045, 0.012, 0.42), copper, flake, 'boden_schneeflocke');

  // ------------------------------------------------------------------ Tür (Haupteingang −Z)
  const doorZ = -3.2 - T / 2;
  box(0.16, DOOR_H + 0.12, 0.16, copper, -1.26, (DOOR_H + 0.12) / 2, doorZ + 0.02, 'tuer_zarge_links');
  box(0.16, DOOR_H + 0.12, 0.16, copper, 1.26, (DOOR_H + 0.12) / 2, doorZ + 0.02, 'tuer_zarge_rechts');
  box(2.68, 0.16, 0.16, copper, 0, DOOR_H + 0.08, doorZ + 0.02, 'tuer_zarge_sturz');
  box(2.68, 0.1, 0.1, copper, 0, DOOR_H + 0.21, doorZ + 0.02, 'tuer_zarge_krone');

  // ------------------------------------------------------------------ Fensterfront (+Z)
  const winZ = 3.2;
  const winH = WIN_TOP - WIN_SILL;
  // Horizont-Blick (hinter dem Glas, innerhalb der Wandstärke)
  const sky = add(new THREE.PlaneGeometry(WIN_W, winH), skyMat, 0, (WIN_TOP + WIN_SILL) / 2, winZ + 0.13, 'fenster_horizont');
  sky.material.side = THREE.DoubleSide;
  // Glasfläche
  box(WIN_W, winH, 0.05, glassMat, 0, (WIN_TOP + WIN_SILL) / 2, winZ + 0.04, 'fenster_glas');
  col('COL_fensterfront', WIN_W, winH, 0.1, 0, (WIN_TOP + WIN_SILL) / 2, winZ + 0.04);
  for (const sx of [-1, 1]) box(0.14, winH + 0.2, 0.16, copper, sx * (WIN_W / 2 + 0.07), (WIN_TOP + WIN_SILL) / 2, winZ + 0.06, 'fenster_rahmen_vertikal');
  box(WIN_W + 0.28, 0.14, 0.16, copper, 0, WIN_SILL - 0.07, winZ + 0.06, 'fenster_rahmen_unten');
  box(WIN_W + 0.28, 0.14, 0.16, copper, 0, WIN_TOP + 0.07, winZ + 0.06, 'fenster_rahmen_oben');
  for (const mx of [-1.4, -0.47, 0.47, 1.4]) box(0.07, winH, 0.1, copper, mx, (WIN_TOP + WIN_SILL) / 2, winZ + 0.03, 'fenster_sprosse');
  // Fensterbank
  box(WIN_W + 0.55, 0.08, 0.32, copper, 0, WIN_SILL - 0.09, winZ - 0.15, 'fensterbank');
  // Sturmpfosten links/rechts der Fensterfront
  for (const sx of [-1, 1]) {
    box(0.18, H, 0.22, pillarMat, sx * 2.28, H / 2, winZ - 0.08, 'fenster_sturmpfosten');
    col(`COL_sturmpfosten_${sx < 0 ? 'l' : 'r'}`, 0.24, H, 0.28, sx * 2.28, H / 2, winZ - 0.08);
  }

  // ------------------------------------------------------------------ Seitliche Lüftungslouven
  const louverItems = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 13; i++) {
      louverItems.push({ x: sx * 3.55, y: 0.62 + i * 0.185, z: 0, ry: 0 });
    }
  }
  inst(new THREE.BoxGeometry(0.06, 0.055, 2.6), pillarMat, louverItems, 'lueftungslouven');
  for (const sx of [-1, 1]) {
    box(0.1, 2.5, 0.09, copper, sx * 3.55, 1.72, -1.35, 'louver_rahmen_a');
    box(0.1, 2.5, 0.09, copper, sx * 3.55, 1.72, 1.35, 'louver_rahmen_b');
    box(0.1, 0.09, 2.79, copper, sx * 3.55, 2.97, 0, 'louver_rahmen_oben');
    box(0.1, 0.09, 2.79, copper, sx * 3.55, 0.48, 0, 'louver_rahmen_unten');
  }

  // ------------------------------------------------------------------ Geschwungene Eckpfeiler
  const pillarItems = [], pillarRingItems = [];
  for (const [px, pz] of POLY) {
    pillarItems.push({ x: px, y: H / 2, z: pz, ry: 0 });
    pillarRingItems.push({ x: px, y: 0.04, z: pz, ry: 0 });
    pillarRingItems.push({ x: px, y: H - 0.04, z: pz, ry: 0 });
    col(`COL_pfeiler_${String(px).replace('.', '_')}_${String(pz).replace('.', '_')}`, 0.34, H, 0.34, px, H / 2, pz);
  }
  inst(new THREE.CylinderGeometry(0.17, 0.17, H, 14), pillarMat, pillarItems, 'eckpfeiler');
  inst(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 14), copper, pillarRingItems, 'eckpfeiler_ringe');

  // ------------------------------------------------------------------ Deckenarchitektur
  const coveItems = [];
  for (let i = 0; i < POLY.length; i++) {
    const a = POLY[i], b = POLY[(i + 1) % POLY.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const nx = -uz, nz = ux;
    const midX = (a[0] + b[0]) / 2, midZ = (a[1] + b[1]) / 2;
    const cool = kinds[i] === 'window';
    coveItems.push({
      x: midX + nx * 0.45, y: H - 0.04, z: midZ + nz * 0.45,
      ry: -Math.atan2(dz, dx), cool,
    });
  }
  inst(new THREE.BoxGeometry(1.15, 0.04, 0.07), glowCool, coveItems.filter((c) => c.cool), 'decke_lichtband_kalt');
  inst(new THREE.BoxGeometry(1.15, 0.04, 0.07), glowWarm, coveItems.filter((c) => !c.cool), 'decke_lichtband_warm');

  // eingelassenes sechseckiges Lichtfeld
  const ceilField = add(new THREE.CircleGeometry(0.78, 6), fieldWarm, 0, H - 0.03, 0.1, 'decke_leuchte_sechseck');
  ceilField.rotation.x = Math.PI / 2;
  const ceilRing = add(new THREE.RingGeometry(0.80, 0.89, 6), copper, 0, H - 0.02, 0.1, 'decke_leuchtenring');
  ceilRing.rotation.x = Math.PI / 2;
  const ceilRing2 = add(new THREE.RingGeometry(1.62, 1.66, 6), copper, 0, H - 0.02, 0.1, 'decke_leuchtenring_aussen');
  ceilRing2.rotation.x = Math.PI / 2;
  // radiale Deckenrippen
  const ribItems = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    ribItems.push({ x: Math.sin(a) * 1.22, y: H - 0.015, z: 0.1 + Math.cos(a) * 1.22, ry: a });
  }
  inst(new THREE.BoxGeometry(0.035, 0.03, 0.66), copper, ribItems, 'decke_rippen');

  // ------------------------------------------------------------------ Objektplätze / Anschlüsse
  empty('DOOR_haupt', 0, 0, doorZ, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Control Tower – Korridor Etage 6' });
  empty('PLACE_OBJ-091', 0, 0, doorZ, 0);                                   // Antiker-Schiebetür, +Z zeigt in den Raum
  empty('PLACE_OBJ-083', 2.5, 0, -1.4, -Math.PI / 2);                       // Athosisches Gedenk-Teeservice (Standobjekt)

  // ------------------------------------------------------------------ Licht
  const lamps = [
    ['LAMP_warm_links', -2.85, 2.72, 0.0, '#ffd8a0', 7, 8],
    ['LAMP_warm_rechts', 2.85, 2.72, 0.0, '#ffd8a0', 7, 8],
    ['LAMP_warm_hinten', 0, 2.72, -2.45, '#ffd8a0', 6, 7],
    ['LAMP_warm_decke', 0, 2.9, 0.1, '#ffd8a0', 6, 7],
    ['LAMP_kalt_fenster', 0, 2.8, 2.55, '#9fd8ff', 6, 10],
    ['LAMP_kalt_fenster_li', -2.2, 2.8, 2.15, '#9fd8ff', 5, 8],
  ];
  for (const [name, x, y, z, color, intensity, distance] of lamps) {
    empty(name, x, y, z, 0, { color, intensity, distance });
  }

  // ------------------------------------------------------------------ Kollision Boden / Decke
  col('COL_boden_mitte', 5.4, 0.2, 6.4, 0, -0.1, 0);
  col('COL_boden_seite_l', 0.9, 0.2, 4.6, -3.15, -0.1, 0);
  col('COL_boden_seite_r', 0.9, 0.2, 4.6, 3.15, -0.1, 0);
  col('COL_decke', 7.2, 0.3, 6.4, 0, H + 0.15, 0);

  // ------------------------------------------------------------------ userData, API, Aktionen
  const warmOn = opts.warm !== false;
  const applyStimmung = (warm) => {
    glowWarm.emissiveIntensity = warm ? 1.25 : 0.75;
    fieldWarm.emissiveIntensity = warm ? 0.85 : 0.55;
    glowCool.emissiveIntensity = warm ? 1.2 : 1.55;
  };
  applyStimmung(warmOn);

  root.userData.raum = { id: 'ATL-008', etage: 6, bereich: 'Control Tower', art: 'command', warm: warmOn };
  root.userData.api = {
    setStimmung: (warm = true) => applyStimmung(warm),
    tuer: 'DOOR_haupt',
    objekt: 'PLACE_OBJ-083',
  };
  root.userData.actions = [
    {
      id: 'INT-buerostimmung',
      label: 'Lichtstimmung des Büros umschalten',
      run: () => {
        const next = !(root.userData.raum.warm);
        root.userData.raum.warm = next;
        applyStimmung(next);
        return true;
      },
    },
  ];

  // ------------------------------------------------------------------ dezentes Lichtatmen
  let t = 0, last = null;
  const baseWarm = warmOn ? 1.25 : 0.75;
  const baseCool = warmOn ? 1.2 : 1.55;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    glowWarm.emissiveIntensity = baseWarm + Math.sin(t * 0.6) * 0.09;
    fieldWarm.emissiveIntensity = (warmOn ? 0.85 : 0.55) + Math.sin(t * 0.45 + 0.8) * 0.05;
    glowCool.emissiveIntensity = baseCool + Math.sin(t * 0.4 + 1.1) * 0.05;
  };

  return root;
}

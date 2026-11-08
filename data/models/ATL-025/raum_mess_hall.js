// Raum ATL-025: Kantine / Speisesaal (Mess Hall) – Inner City, Etage 4.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Speisesaal 20 m × 16 m (320 m²), lichte Höhe 6 m, Haupteingang an −Z,
// Balkonausgang an der Ostseite (+X). Leere Hülle: nur Architektur, Möbel nur als PLACE_-Punkte.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_mess_hall',
  art: 'Raum',
  masse: '20,0 m × 16,0 m (320 m²), lichte Höhe 6,0 m',
  wohin: 'Inner City, Etage 4 – gemeinschaftlicher Speise- und Aufenthaltsraum der Expedition',
  benutzen: 'Essen, informelle Gespräche, Crew-Treffpunkt; Buffet-, Kaffee- und Wasserstation an der Wand',
  lichter: '6 LAMP_-Punkte (gedämpft, eisblau/bernstein), dazu dezente Wand-Lichtpunkte und schmale Deckenbänder',
  animation: 'Wandlichtpunkte, Deckenbänder und das Turmrelief atmen langsam und gleichmäßig',
  quelle: 'Rekonstruiert nach Serienbild „McKay and Mrs. Miller“ (Referenzbild 2: Gesamtsaal) und Auftragsbeschreibung',
};

export const varianten = [
  { label: 'Kantine 20 × 16 m (320 m²)', opts: {} },
  { label: 'Kantine 24 × 14 m', opts: { breite: 24, tiefe: 14 } },
];

const H = 6.0;         // lichte Höhe
const T = 0.3;         // Wanddicke
const DOOR_W = 2.4;    // Türöffnungsbreite
const DOOR_H = 3.0;    // Türöffnungshöhe
const SILL = 0.9;      // Fensterbrüstung
const WTOP = 4.9;      // Fensterkopf

// Buntglas-Canvas: geometrische Bahnen in Bernstein/Türkis/Blaugrün mit Schneeflocken-Ornament.
function makeBuntglasTexture(dark = false) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = dark ? '#071a1e' : '#0b2b30';
  g.fillRect(0, 0, 256, 512);
  const cols = dark
    ? ['#7a4d18', '#175255', '#123b44', '#8a6425']
    : ['#c98b2e', '#2f8f8a', '#1f5f6b', '#e0b45a'];
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 256; x += 64) {
      g.globalAlpha = 0.5;
      g.fillStyle = cols[(x / 64 + y / 64) % cols.length];
      g.fillRect(x + 6, y + 6, 52, 52);
      g.globalAlpha = 1;
      g.strokeStyle = '#082024';
      g.lineWidth = 5;
      g.strokeRect(x + 6, y + 6, 52, 52);
      // 30°/60°-Diagonalen
      g.beginPath();
      g.moveTo(x + 6, y + 6); g.lineTo(x + 58, y + 58);
      g.moveTo(x + 58, y + 6); g.lineTo(x + 6, y + 58);
      g.stroke();
    }
  }
  // Schneeflocke (rechtwinklige Verzweigung)
  g.strokeStyle = dark ? '#cfe9f6' : '#dff4ff';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(128, 40); g.lineTo(128, 472);
  g.moveTo(36, 256); g.lineTo(220, 256);
  g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const y = 96 + i * 104;
    g.beginPath();
    g.moveTo(128, y); g.lineTo(88, y); g.lineTo(88, y - 26);
    g.moveTo(128, y); g.lineTo(168, y); g.lineTo(168, y - 26);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function create(opts = {}) {
  const W = opts.breite ?? 20;   // X
  const D = opts.tiefe ?? 16;   // Z
  const x0 = -W / 2, x1 = W / 2;
  const z0 = -D / 2, z1 = D / 2;

  const root = new THREE.Group();
  root.name = 'raum_mess_hall';

  // ------------------------------------------------------------ Materialien
  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glowMat = kit('glow');

  const petrol = new THREE.MeshStandardMaterial({
    name: 'wand_petrol', color: 0x24484b, metalness: 0.14, roughness: 0.82,
  });
  const petrolDark = new THREE.MeshStandardMaterial({
    name: 'wand_petrol_dunkel', color: 0x143033, metalness: 0.2, roughness: 0.74,
  });
  const terracotta = new THREE.MeshStandardMaterial({
    name: 'boden_terrakotta', color: 0x6b3426, metalness: 0.14, roughness: 0.74,
  });
  const seamMat = new THREE.MeshStandardMaterial({
    name: 'boden_fuge', color: 0x45261d, metalness: 0.4, roughness: 0.66,
  });
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const pointMat = new THREE.MeshStandardMaterial({
    name: 'lichtpunkte', color: 0xf2fbff, emissive: 0xbfe8ff, emissiveIntensity: 1.15, roughness: 0.35,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    name: 'lichtband_gedaempft', color: 0xcfe9f6, emissive: 0x8fc8e6, emissiveIntensity: 0.4, roughness: 0.4,
  });
  const reliefGlow = new THREE.MeshStandardMaterial({
    name: 'relief_hinterlicht', color: 0x9fd8ff, emissive: 0x4f93b6, emissiveIntensity: 0.42, roughness: 0.4,
  });
  const coneMat = new THREE.MeshStandardMaterial({
    name: 'lichtkegel', color: 0xbfe3ff, transparent: true, opacity: 0.06,
    emissive: 0x9fd8ff, emissiveIntensity: 0.35, side: THREE.DoubleSide,
    depthWrite: false, roughness: 1,
  });

  const glassTex = makeBuntglasTexture(false);
  const glassMat = glassTex
    ? new THREE.MeshStandardMaterial({
        name: 'buntglas_mess_hall', map: glassTex, emissiveMap: glassTex,
        emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.22, metalness: 0.08,
        transparent: true, opacity: 0.88, side: THREE.DoubleSide,
      })
    : kit('glass');

  const darkTex = makeBuntglasTexture(true);
  const darkGlassMat = darkTex
    ? new THREE.MeshStandardMaterial({
        name: 'buntglas_turmrelief', map: darkTex, emissiveMap: darkTex,
        emissive: 0x7fc4e8, emissiveIntensity: 0.28, roughness: 0.3, metalness: 0.1,
        side: THREE.DoubleSide,
      })
    : kit('glass');

  // ------------------------------------------------------------ Helfer
  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    const o = new THREE.Object3D();
    list.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(0, it.rot || 0, 0);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };

  // ------------------------------------------------------------ Boden
  box(W, 0.1, D, terracotta, 0, -0.05, 0, 'boden');
  const seamsX = [], seamsZ = [];
  for (let z = z0 + 1.2; z < z1 - 0.01; z += 1.2) seamsX.push({ x: 0, y: 0.004, z });
  for (let x = x0 + 1.2; x < x1 - 0.01; x += 1.2) seamsZ.push({ x, y: 0.004, z: 0, rot: Math.PI / 2 });
  inst(new THREE.BoxGeometry(W - 0.5, 0.007, 0.018), seamMat, seamsX, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(D - 0.5, 0.007, 0.018), seamMat, seamsZ, 'boden_fugen_z');

  // grün-kupferner Rand
  box(0.24, 0.014, D - 0.4, patina, x0 + 0.12, 0.007, 0, 'boden_rand_west');
  box(0.24, 0.014, D - 0.4, patina, x1 - 0.12, 0.007, 0, 'boden_rand_ost');
  box(W - 0.4, 0.014, 0.24, patina, 0, 0.007, z0 + 0.12, 'boden_rand_sued');
  box(W - 0.4, 0.014, 0.24, patina, 0, 0.007, z1 - 0.12, 'boden_rand_nord');

  // große kreisförmige Kupfer-Intarsie in der Mitte
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.9, 5.05, 96), copper);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.009;
  ring.name = 'boden_intarsie_ring';
  root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.2, 72), patina);
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.009;
  ring2.name = 'boden_intarsie_ring_innen';
  root.add(ring2);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    const arm = box(0.11, 0.009, 4.5, copper, 0, 0.009, 0, 'boden_intarsie_arm');
    arm.rotation.y = a;
    for (const s of [-1, 1]) {
      const br = box(0.07, 0.009, 1.1, copper, 0, 0.011, 0, 'boden_intarsie_zweig');
      br.rotation.y = a + s * Math.PI / 2;
      br.position.set(Math.sin(a + s * Math.PI / 2) * 1.3, 0.011, Math.cos(a + s * Math.PI / 2) * 1.3);
    }
  }
  // Schneeflocken-Intarsien (rechtwinklig verzweigt) in den vier Quadranten
  const snowSpots = [
    { x: -6.6, z: -6.2, r: 0 }, { x: 6.6, z: -6.2, r: Math.PI / 2 },
    { x: -6.6, z: 6.2, r: Math.PI }, { x: 6.6, z: 6.2, r: -Math.PI / 2 },
  ];
  snowSpots.forEach((sp, si) => {
    const g = new THREE.Group();
    g.position.set(sp.x, 0.011, sp.z);
    g.rotation.y = sp.r;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.01, 0.08), copper);
    arm.position.x = 0.0; g.add(arm);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 1.5), copper);
    g.add(arm2);
    for (const s of [-1, 1]) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.07), copper);
      b1.position.set(s * 0.45, 0, 0.3); g.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.07), copper);
      b2.position.set(s * 0.45, 0, -0.3); g.add(b2);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.5), copper);
      c1.position.set(0.3, 0, s * 0.45); g.add(c1);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.5), copper);
      c2.position.set(-0.3, 0, s * 0.45); g.add(c2);
    }
    g.name = `boden_schneeflocke_${si}`;
    root.add(g);
  });

  // ------------------------------------------------------------ Wände
  const wallZ = z0 - T / 2;   // Südwand (Hauptzugang)
  const wallZp = z1 + T / 2;  // Nordwand (Rückwand mit Turmrelief)
  const wallXw = x0 - T / 2;  // Westwand
  const wallXe = x1 + T / 2;  // Ostwand

  // --- Südwand: Haupteingang in der Mitte (2,4 × 3 m) ---
  const segL = -DOOR_W / 2 - x0;
  const segR = x1 - DOOR_W / 2;
  box(segL, H, T, petrol, x0 + segL / 2, H / 2, wallZ, 'wand_eingang_links');
  box(segR, H, T, petrol, DOOR_W / 2 + segR / 2, H / 2, wallZ, 'wand_eingang_rechts');
  box(DOOR_W, H - DOOR_H, T, petrol, 0, DOOR_H + (H - DOOR_H) / 2, wallZ, 'wand_eingang_sturz');
  box(DOOR_W + 0.30, 0.16, 0.10, copper, 0, DOOR_H + 0.05, z0 + 0.05, 'tuer_einfassung_oben');
  for (const s of [-1, 1]) box(0.14, DOOR_H, 0.10, copper, s * (DOOR_W / 2 + 0.07), DOOR_H / 2, z0 + 0.05, 'tuer_einfassung_seite');
  box(segL, 0.16, 0.06, copper, x0 + segL / 2, 0.08, z0 + 0.03, 'sockelleiste_eingang_links');
  box(segR, 0.16, 0.06, copper, DOOR_W / 2 + segR / 2, 0.08, z0 + 0.03, 'sockelleiste_eingang_rechts');

  // --- Nordwand: massive Rückwand mit Turmrelief ---
  box(W, H, T, petrol, 0, H / 2, wallZp, 'wand_nord');
  box(W, 0.18, 0.07, copper, 0, 0.09, z1 - 0.035, 'sockelleiste_nord');

  // --- Seitenwände mit hohen, schmalen Sprossenfenstern ---
  const mullionV = [], mullionH = [];
  const buildSideWall = (sign, openings, tag) => {
    const wallX = sign * (W / 2 + T / 2);
    const inner = sign * W / 2;
    let cursor = z0;
    const solids = [];
    for (const op of openings) {
      if (op.a > cursor + 0.01) solids.push([cursor, op.a]);
      cursor = op.b;
    }
    if (cursor < z1 - 0.01) solids.push([cursor, z1]);

    solids.forEach((s, i) => {
      const [a, b] = s;
      const len = b - a;
      const zc = (a + b) / 2;
      box(T, H, len, petrol, wallX, H / 2, zc, `wand_${tag}_massiv_${i}`);
      col(`COL_wand_${tag}_massiv_${i}`, T, H, len, wallX, H / 2, zc);
      box(0.07, 0.16, len, copper, inner - sign * 0.035, 0.08, zc, `sockelleiste_${tag}_${i}`);
      // schräge 60°-Wandfläche (rauminnenliegende Facette)
      if (len > 1.5) {
        const facet = box(0.06, H - 0.9, 1.4, petrolDark,
          inner - sign * 0.68, 0.45 + (H - 0.9) / 2, zc, `wandfase_${tag}_${i}`);
        facet.rotation.y = -sign * THREE.MathUtils.degToRad(60);
      }
    });

    openings.forEach((op, i) => {
      const len = op.b - op.a;
      const zc = (op.a + op.b) / 2;
      if (op.type === 'door') {
        box(T, H - DOOR_H, len, petrol, wallX, DOOR_H + (H - DOOR_H) / 2, zc, `wand_${tag}_tuersturz_${i}`);
        col(`COL_wand_${tag}_tuersturz_${i}`, T, H - DOOR_H, len, wallX, DOOR_H + (H - DOOR_H) / 2, zc);
        box(0.10, DOOR_H, 0.16, copper, inner - sign * 0.05, DOOR_H / 2, op.a + 0.07, `tuer_einfassung_${tag}_links`);
        box(0.10, DOOR_H, 0.16, copper, inner - sign * 0.05, DOOR_H / 2, op.b - 0.07, `tuer_einfassung_${tag}_rechts`);
        box(0.10, 0.16, len + 0.24, copper, inner - sign * 0.05, DOOR_H + 0.05, zc, `tuer_einfassung_${tag}_oben`);
        return;
      }
      // Fenster: Brüstung, Sturz, Buntglas, Rahmen, Sprossen
      box(T, SILL, len, petrol, wallX, SILL / 2, zc, `wand_${tag}_brustung_${i}`);
      box(T, H - WTOP, len, petrol, wallX, WTOP + (H - WTOP) / 2, zc, `wand_${tag}_sturz_${i}`);
      col(`COL_wand_${tag}_brustung_${i}`, T, SILL, len, wallX, SILL / 2, zc);
      col(`COL_wand_${tag}_sturz_${i}`, T, H - WTOP, len, wallX, WTOP + (H - WTOP) / 2, zc);
      const gw = len - 0.5;
      const g = box(0.04, WTOP - SILL, gw, glassMat, inner - sign * 0.02, (SILL + WTOP) / 2, zc, `fenster_glas_${tag}_${i}`);
      g.renderOrder = 1;
      col(`COL_fenster_${tag}_${i}`, T, WTOP - SILL, len, wallX, (SILL + WTOP) / 2, zc);
      for (const e of [op.a + 0.125, op.b - 0.125]) {
        box(0.13, WTOP - SILL + 0.1, 0.1, copper, inner - sign * 0.06, (SILL + WTOP) / 2, e, `fenster_rahmen_${tag}_${i}`);
      }
      box(0.13, 0.12, gw, copper, inner - sign * 0.06, SILL + 0.06, zc, `fenster_rahmen_${tag}_${i}_unten`);
      box(0.13, 0.12, gw, copper, inner - sign * 0.06, WTOP - 0.06, zc, `fenster_rahmen_${tag}_${i}_oben`);
      mullionV.push({ x: inner - sign * 0.06, y: (SILL + WTOP) / 2, z: zc });
      for (let k = 1; k <= 3; k++) {
        mullionH.push({ x: inner - sign * 0.06, y: SILL + ((WTOP - SILL) * k) / 4, z: zc });
      }
    });
  };

  const westOpenings = [
    { a: -7.0, b: -5.0, type: 'window' },
    { a: -3.0, b: -1.0, type: 'window' },
    { a: 1.0, b: 2.8, type: 'window' },
    { a: 5.2, b: 7.0, type: 'window' },
  ];
  const eastOpenings = [
    { a: -6.6, b: -4.2, type: 'door' },
    { a: -3.0, b: -1.6, type: 'window' },
    { a: -0.4, b: 1.0, type: 'window' },
  ];
  buildSideWall(-1, westOpenings, 'west');
  buildSideWall(1, eastOpenings, 'ost');

  inst(new THREE.BoxGeometry(0.08, WTOP - SILL - 0.1, 0.08), copper, mullionV, 'fenster_sprosse_vertikal');
  inst(new THREE.BoxGeometry(0.08, 0.07, 1.5), copper, mullionH, 'fenster_sprosse_horizontal');

  // --- Wandpaneele (plant-ons) mit Bronzerahmen ---
  const panelFrames = [], panelFills = [];
  const addPanel = (x, z, rotY) => {
    panelFrames.push({ x, y: 1.55, z, rot: rotY });
    panelFills.push({ x: x + (rotY === 0 ? 0 : 0), y: 1.55, z, rot: rotY });
  };
  [-8.0, -5.6, -3.2, 2.2, 4.6].forEach((x) => addPanel(x, z0 + 0.04, 0));      // Südwand
  [-8.8, 6.2, 7.6, 9.2].forEach((x) => addPanel(x, z1 - 0.04, 0));               // Nordwand
  [0, 4].forEach((z) => addPanel(x0 + 0.04, z, Math.PI / 2));                    // Westwand
  [1.2].forEach((z) => addPanel(x1 - 0.04, z, Math.PI / 2));                     // Ostwand
  // Paneele minimal vor die Wand setzen
  panelFills.forEach((p) => {
    if (p.rot === 0) p.z += p.z < 0 ? 0.03 : -0.03;
    else p.x += p.x < 0 ? 0.03 : -0.03;
  });
  panelFrames.forEach((p) => {
    if (p.rot === 0) p.z += p.z < 0 ? 0.02 : -0.02;
    else p.x += p.x < 0 ? 0.02 : -0.02;
  });
  inst(new THREE.BoxGeometry(1.32, 2.92, 0.05), copper, panelFrames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.20, 2.80, 0.035), wallDark, panelFills, 'paneel_flaechen');

  // --- vertikale Lichtschlitz-Leisten mit vielen kleinen Lichtpunkten ---
  const railX = [], points = [];
  const stripAt = (x, y, z) => {
    railX.push({ x, y: 3.0, z });
    for (let yy = 0.75; yy <= 5.3; yy += 0.22) points.push({ x, y: yy, z });
  };
  [-7.5, -4.0, 0.0, 3.9, 7.5].forEach((u) => stripAt(x0 + 0.10, 3.0, u));
  [-3.5, 1.9].forEach((u) => stripAt(x1 - 0.10, 3.0, u));
  [-9.7, -9.3, -4.4, 3.4].forEach((u) => stripAt(u, 3.0, z0 + 0.10));
  [-9.7, -4.9, 6.9, 8.9].forEach((u) => stripAt(u, 3.0, z1 - 0.10));
  inst(new THREE.BoxGeometry(0.12, 4.9, 0.16), copper, railX, 'lichtschlitz_leisten');
  const pointMesh = inst(new THREE.BoxGeometry(0.05, 0.05, 0.05), pointMat, points, 'lichtpunkte_wand');

  // --- Rückwand: gestuftes Turmrelief, dezent hinterleuchtet ---
  const backGlow = box(4.8, 5.8, 0.06, darkGlassMat, 0, 3.0, z1 - 0.04, 'relief_buntglas_hintergrund');
  backGlow.renderOrder = 1;
  const towerSteps = [
    { w: 4.0, h: 1.2, y: 0.6 },
    { w: 3.4, h: 1.2, y: 1.8 },
    { w: 2.8, h: 1.2, y: 3.0 },
    { w: 2.2, h: 1.2, y: 4.2 },
    { w: 1.6, h: 1.2, y: 5.4 },
  ];
  towerSteps.forEach((s, i) => {
    box(s.w, s.h, 0.42, petrolDark, 0, s.y, z1 - 0.24, `relief_turm_stufe_${i}`);
    box(s.w + 0.12, 0.09, 0.5, copper, 0, s.y + s.h / 2, z1 - 0.26, `relief_turm_kante_${i}`);
  });
  for (const s of [-1, 1]) {
    const p = box(0.12, 5.4, 0.5, copper, s * 2.06, 3.0, z1 - 0.26, 'relief_turm_seitenkante');
    p.rotation.y = s * THREE.MathUtils.degToRad(30);
  }
  box(0.9, 0.16, 0.5, copper, 0, 5.86, z1 - 0.26, 'relief_turm_krone');
  // hinterlegter Lichtspalt hinter dem Turm
  box(0.12, 5.4, 0.10, reliefGlow, 0, 3.0, z1 - 0.08, 'relief_turm_hinterlicht');

  // schräge 60°-Wandflächen neben dem Relief (rauminnenliegend)
  for (const s of [-1, 1]) {
    const f = box(0.06, 4.6, 1.6, petrolDark, s * 3.4, 2.6, z1 - 0.72, `wandfase_nord_${s < 0 ? 'links' : 'rechts'}`);
    f.rotation.y = s * THREE.MathUtils.degToRad(60);
  }

  // ------------------------------------------------------------ Säulen
  const pillarPos = [
    { x: -4.4, z: -6.2 }, { x: 4.4, z: -6.2 },
    { x: -4.4, z: 6.2 }, { x: 4.4, z: 6.2 },
  ];
  pillarPos.forEach((p, i) => {
    const shaft = add(new THREE.CylinderGeometry(0.24, 0.32, H - 0.7, 4, 1, false), pillarMat,
      p.x, (H - 0.7) / 2 + 0.16, p.z, `saeule_${i}`);
    shaft.rotation.y = Math.PI / 4;
    shaft.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.04;
    const base = add(new THREE.BoxGeometry(0.6, 0.24, 0.6), copper, p.x, 0.12, p.z, `saeule_basis_${i}`);
    base.rotation.y = Math.PI / 4;
    const cap = add(new THREE.BoxGeometry(0.56, 0.24, 0.56), copper, p.x, H - 0.28, p.z, `saeule_kopf_${i}`);
    cap.rotation.y = Math.PI / 4;
  });

  // ------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke_haupt');
  // dunkle Kassettenrippen (keine hellen Bürofelder)
  const ribs = [];
  for (let xi = 0; xi < 4; xi++) ribs.push({ x: x0 + (W / 4) * (xi + 0.5), y: H - 0.06, z: 0 });
  for (let zi = 0; zi < 3; zi++) ribs.push({ x: 0, y: H - 0.06, z: z0 + (D / 3) * (zi + 0.5), rot: Math.PI / 2 });
  inst(new THREE.BoxGeometry(0.10, 0.12, D - 0.3), petrolDark, ribs, 'decke_kassettenrippen');
  // schmale, gedämpfte Lichtbänder
  const bandMesh = [
    { x: 0, y: H - 0.05, z: z0 + 1.4 },
    { x: 0, y: H - 0.05, z: z1 - 1.4 },
  ];
  inst(new THREE.BoxGeometry(W - 2.4, 0.05, 0.08), bandMat, bandMesh, 'decke_lichtband');
  // abgehängte, dunkle Leichtfelder (eingebaute Lichtkörper)
  const fieldPos = [
    { x: -5.6, z: -4.6 }, { x: 0, z: -4.6 }, { x: 5.6, z: -4.6 },
    { x: -5.6, z: 1.2 }, { x: 0, z: 1.2 }, { x: 5.6, z: 1.2 },
  ];
  fieldPos.forEach((f, i) => {
    box(2.2, 0.10, 1.3, petrolDark, f.x, H - 0.34, f.z, `decke_leichtfeld_${i}`);
    box(1.9, 0.04, 1.0, bandMat, f.x, H - 0.41, f.z, `decke_leichtfeld_glas_${i}`);
    for (const s of [-1, 1]) box(0.05, 0.34, 0.05, copper, f.x + s * 0.95, H - 0.17, f.z, `decke_leichtfeld_haenger_${i}`);
  });
  // schräge Deckenfacetten an den Rändern
  for (const s of [-1, 1]) {
    const f = box(W - 1.5, 0.12, 1.0, petrolDark, 0, H - 0.42, s * (D / 2 - 0.6), `decke_fase_${s < 0 ? 'sued' : 'nord'}`);
    f.rotation.x = s * THREE.MathUtils.degToRad(60);
  }

  // --- Lichtkegel aus den hohen Seitenfenstern ---
  const coneSpecs = [
    { sign: -1, z: -6.0 }, { sign: -1, z: -2.0 }, { sign: -1, z: 1.9 }, { sign: -1, z: 6.1 },
    { sign: 1, z: -2.3 }, { sign: 1, z: 0.3 },
  ];
  const upVec = new THREE.Vector3(0, 1, 0);
  coneSpecs.forEach((c, i) => {
    const h = 4.0, r = 1.4;
    const apex = new THREE.Vector3(c.sign * (W / 2 - 0.25), WTOP - 0.25, c.z);
    const dir = new THREE.Vector3(-c.sign * 0.42, -0.9, 0).normalize();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18, 1, true), coneMat);
    cone.position.copy(apex).addScaledVector(dir, h / 2);
    cone.quaternion.setFromUnitVectors(upVec, dir.clone().negate());
    cone.name = `lichtkegel_${i}`;
    cone.renderOrder = 3;
    root.add(cone);
  });

  // ------------------------------------------------------------ Objektplätze
  // Türsteuerungspaneele (Wandobjekte, Vorderseite +Z zeigt in den Raum)
  empty('PLACE_OBJ-052', 1.62, 1.2, z0 + 0.06, 0);
  empty('PLACE_OBJ-052_2', x1 - 0.06, 1.2, -3.6, -Math.PI / 2);

  // Türen (Antiker-Schiebetür, OBJ-091) in jeder Öffnung, Ursprung in der Wandmitte
  empty('PLACE_OBJ-091', 0, 0, wallZ, 0);                        // Haupttür: +Z in den Raum
  empty('PLACE_OBJ-091_2', wallXe, 0, -5.4, -Math.PI / 2);      // Balkontür: −X in den Raum

  // Türknoten (zeigen nach außen)
  empty('DOOR_eingang', 0, 0, wallZ, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor ATL-049', raum: 'ATL-049',
  });
  empty('DOOR_balkon', wallXe, 0, -5.4, Math.PI / 2, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Balkon mit Blick auf die Stadt (ATL-048)', raum: 'ATL-048',
  });

  // Kantinentische (10) in lockeren Reihen und Gruppen, teils paarweise gestellt
  const tables = [
    { x: -7.4, z: -3.6 }, { x: -5.9, z: -3.6 }, { x: -2.4, z: -3.6 },
    { x: -7.4, z: 0.6 }, { x: -5.9, z: 0.6 }, { x: -2.4, z: 0.6 }, { x: 2.4, z: 0.6 },
    { x: -7.4, z: 4.6 }, { x: -5.9, z: 4.6 }, { x: -2.4, z: 4.6 },
  ];
  tables.forEach((t, i) => empty(`PLACE_OBJ-092_${i + 1}`, t.x, 0, t.z, 0));

  // Stühle: je Tisch vier, zwei je Längsseite, Sitzseite (+Z) zeigt zum Tisch
  let chairN = 0;
  tables.forEach((t) => {
    for (const s of [-1, 1]) {
      for (const dx of [-0.38, 0.38]) {
        chairN += 1;
        const rot = s < 0 ? 0 : Math.PI;
        empty(`PLACE_OBJ-093_${chairN}`, t.x + dx, 0, t.z + s * 0.99, rot);
      }
    }
  });

  // Lounge-Sofas an den Wänden, Sitzseite zum Raum
  empty('PLACE_OBJ-094_1', -7.0, 0, z1 - 0.40, Math.PI);   // Nordwand, Blick −Z
  empty('PLACE_OBJ-094_2', -4.0, 0, z1 - 0.40, Math.PI);   // Nordwand, Blick −Z
  empty('PLACE_OBJ-094_3', 4.6, 0, z1 - 0.40, Math.PI);    // Nordwand, Blick −Z
  empty('PLACE_OBJ-094_4', x0 + 0.40, 0, -4.0, Math.PI / 2); // Westwand, Blick +X

  // Essensausgabe an der Ostwand (Rückseite an der Wand), Bedienseite −X zum Raum
  empty('PLACE_OBJ-095', x1 - 0.58, 0, 4.7, -Math.PI / 2);
  // Kaffeestation an der Südwand, neben der Ausgabe
  empty('PLACE_OBJ-082', 7.8, 0, z0 + 0.46, 0);
  // Trinkwasserbrunnen (Wandobjekte)
  empty('PLACE_OBJ-085_1', x1 - 0.10, 1.15, 7.5, -Math.PI / 2);
  empty('PLACE_OBJ-085_2', -9.4, 1.15, z1 - 0.10, Math.PI);

  // Topfpflanzen neben Fenstern und Sofas
  empty('PLACE_OBJ-096_1', x0 + 0.55, 0, -7.5, 0);
  empty('PLACE_OBJ-096_2', x0 + 0.55, 0, 0.3, 0);
  empty('PLACE_OBJ-096_3', 2.9, 0, z1 - 0.55, 0);
  empty('PLACE_OBJ-096_4', 6.9, 0, z1 - 0.55, 0);

  // ------------------------------------------------------------ Licht
  const lampPos = [
    [-W * 0.28, H - 0.62, -D * 0.26], [W * 0.28, H - 0.62, -D * 0.26],
    [-W * 0.28, H - 0.62, D * 0.24], [W * 0.28, H - 0.62, D * 0.24],
    [0, H - 0.62, -D * 0.02], [0, H - 0.62, D * 0.30],
  ];
  lampPos.forEach((p, i) => {
    const warm = i === 3 || i === 5;
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, {
      color: warm ? '#ffd8a0' : '#9fd8ff', intensity: warm ? 6.0 : 7.0, distance: 17,
    });
  });

  // ------------------------------------------------------------ Kollision
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_eingang_links', segL, H, T, x0 + segL / 2, H / 2, wallZ);
  col('COL_wand_eingang_rechts', segR, H, T, DOOR_W / 2 + segR / 2, H / 2, wallZ);
  col('COL_wand_eingang_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, wallZ);
  col('COL_wand_nord', W, H, T, 0, H / 2, wallZp);
  pillarPos.forEach((p, i) => col(`COL_saeule_${i}`, 0.72, H, 0.72, p.x, H / 2, p.z));

  // ------------------------------------------------------------ Animation & API
  let t = 0, last = null;
  const breathe = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    pointMat.emissiveIntensity = 1.1 + Math.sin(t * 0.6) * 0.1;
    bandMat.emissiveIntensity = 0.38 + Math.sin(t * 0.45 + 0.8) * 0.05;
    reliefGlow.emissiveIntensity = 0.4 + Math.sin(t * 0.35) * 0.04;
  };
  pointMesh.onBeforeRender = breathe;
  bandMesh.onBeforeRender = breathe;

  root.userData.raum = { id: 'ATL-025', breite: W, tiefe: D, hoehe: H };
  root.userData.api = {
    setLicht: (v) => {
      pointMat.emissiveIntensity = v;
      bandMat.emissiveIntensity = v * 0.42;
      reliefGlow.emissiveIntensity = v * 0.4;
      coneMat.opacity = Math.min(0.14, v * 0.055);
    },
    taster: (phase = 0) => {
      pointMat.emissiveIntensity = 1.1 + Math.sin(phase) * 0.16;
      bandMat.emissiveIntensity = 0.38 + Math.sin(phase * 0.8) * 0.06;
      reliefGlow.emissiveIntensity = 0.4 + Math.sin(phase * 0.6) * 0.05;
    },
  };

  return root;
}

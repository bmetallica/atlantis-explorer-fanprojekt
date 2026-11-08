// Raum ATL-018: Labor von Radek Zelenka (East Pier, Etage 3).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Rechteckiges Speziallabor 9,6 m × 6,8 m (≈ 65 m²), lichte Höhe 3,2 m.
// Haupteingang an der Seite −Z. Leere Hülle: nur Architektur und Objektplätze.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_radek_zelenka_lab',
  art: 'Raum (Speziallabor)',
  masse: '9.6 m Breite × 6.8 m Tiefe × 3.2 m Höhe (ca. 65 m²)',
  wohin: 'East Pier, Etage 3 – persönliches Physik-/Torsio-Forschungslabor von Dr. Radek Zelenka',
  benutzen: 'Subraum-Diagnoseplatz, Kristall-Schnittstellenleser, Toughbook-Feldlaptop, Kaffeestation; Schiebetür sowie Tür-/Wandpaneele als PLACE-Punkte',
  lichter: '5 LAMP_ (eisblau #9fd8ff, Intensität 8, Distanz 9 m), zusätzlich indirekte Lichtschlitze in den Wandfugen und Deckenbänder',
  animation: 'Wand-Lichtschlitze und Deckenbänder atmen minimal; Diagnose-Architektur bleibt statisch',
  quelle: 'selbst gebaut nach Raum-Beschreibung ATL-018 und Referenzbild ref1.jpg (Forschungs- und Diagnoselabor Zelenka), Atlantis-Kupfer-Palette (Staffel 4)',
};

export function create(opts = {}) {
  const W = 9.6;   // Breite in X
  const D = 6.8;   // Tiefe in Z
  const H = 3.2;   // lichte Höhe
  const T = 0.3;   // Wanddicke
  const IN_X = W / 2;    // 4.8
  const IN_Z = D / 2;    // 3.4
  const DOOR_W = 2.4;
  const DOOR_H = 3.0;

  const root = new THREE.Group();
  root.name = 'raum_radek_zelenka_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const o3 = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z, r], i) => {
      o3.position.set(x, y, z);
      o3.rotation.set(0, r || 0, 0);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.count = list.length;
    im.instanceMatrix.needsUpdate = true;
    im.name = name;
    root.add(im);
    return im;
  };
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY || 0;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // ------------------------------------------------------------------ Boden
  box(W + 2 * T, 0.2, D + 2 * T, floorMat, 0, -0.1, 0, 'boden');
  // umlaufender grün-kupferner Rand
  for (const s of [-1, 1]) {
    box(W, 0.014, 0.22, patina, 0, 0.007, s * (IN_Z - 0.11), 'boden_rand_' + (s < 0 ? 'vorne' : 'hinten'));
    box(0.22, 0.014, D, patina, s * (IN_X - 0.11), 0.007, 0, 'boden_rand_' + (s < 0 ? 'links' : 'rechts'));
  }
  // Plattenfugen im 1,2-m-Raster
  const fugenX = [], fugenZ = [];
  for (let z = -3.0; z <= 3.01; z += 1.2) fugenZ.push([0, 0.004, z]);
  for (let x = -4.2; x <= 4.21; x += 1.2) fugenX.push([x, 0.004, 0]);
  inst(new THREE.BoxGeometry(W, 0.008, 0.02), copper, fugenZ, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(0.02, 0.008, D), copper, fugenX, 'boden_fugen_z');
  // Mittelintarsie: geometrisches Schneeflocken-Motiv
  box(2.4, 0.006, 0.06, copper, 0, 0.005, 0, 'boden_intarsie_a');
  box(0.06, 0.006, 2.4, copper, 0, 0.005, 0, 'boden_intarsie_b');
  const straelen = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 6;
    straelen.push([Math.cos(a) * 1.05, 0.005, Math.sin(a) * 1.05, -a]);
  }
  inst(new THREE.BoxGeometry(1.1, 0.006, 0.05), patina, straelen, 'boden_intarsie_strahlen');

  // ------------------------------------------------------------------ Wände
  // −Z: Hauptseite mit Türöffnung 2,4 × 3,0 m (Mitte)
  const zFront = -(IN_Z + T / 2);
  const sideLen = (W + 2 * T - DOOR_W) / 2;
  box(sideLen, H, T, wall, -(DOOR_W / 2 + sideLen / 2), H / 2, zFront, 'wand_vorne_links');
  box(sideLen, H, T, wall, (DOOR_W / 2 + sideLen / 2), H / 2, zFront, 'wand_vorne_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, zFront, 'wand_vorne_sturz');
  // Bronzeeinfassung der Türöffnung
  box(DOOR_W + 0.16, 0.12, 0.08, copper, 0, DOOR_H, -IN_Z + 0.02, 'tuer_einfassung_oben');
  for (const s of [-1, 1]) box(0.12, DOOR_H, 0.08, copper, s * (DOOR_W / 2 + 0.04), DOOR_H / 2, -IN_Z + 0.02, 'tuer_einfassung_seite');
  // +Z
  box(W + 2 * T, H, T, wall, 0, H / 2, IN_Z + T / 2, 'wand_hinten');
  // Seitenwände
  for (const s of [-1, 1]) box(T, H, D + 2 * T, wall, s * (IN_X + T / 2), H / 2, 0, 'wand_seite_' + (s < 0 ? 'links' : 'rechts'));

  // ------------------------------------------------------------------ Wandfelder, Paneele, Lichtschlitze
  // Z-Wände: Felder 1,2 m breit entlang X.  X-Wände: Felder entlang Z.
  const framesZ = [], panelsZ = [], slotsZ = [];
  const framesX = [], panelsX = [], slotsX = [];
  const fieldX = [-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2];
  const fieldZ = [-2.4, -1.2, 0, 1.2, 2.4];

  for (const s of [-1, 1]) {
    const zIn = s * (IN_Z - 0.015);   // Rahmenebene (Z-Wände)
    const zPan = s * (IN_Z - 0.05);    // Paneelebene
    const zSlot = s * (IN_Z - 0.012);
    fieldX.forEach((x, i) => {
      if (s < 0 && Math.abs(x) < DOOR_W / 2 + 0.35) return; // Türfeld aussparen
      framesZ.push([x, 1.6, zIn]);
      if (i % 2 === 0) panelsZ.push([x, 1.6, zPan]);
      else for (let k = 0; k < 4; k++) slotsZ.push([x, 0.95 + k * 0.42, zSlot]);
    });
  }
  for (const s of [-1, 1]) {
    const xIn = s * (IN_X - 0.015);
    const xPan = s * (IN_X - 0.05);
    const xSlot = s * (IN_X - 0.012);
    fieldZ.forEach((z, i) => {
      framesX.push([xIn, 1.6, z]);
      if (i % 2 === 0) panelsX.push([xPan, 1.6, z]);
      else for (let k = 0; k < 4; k++) slotsX.push([xSlot, 0.95 + k * 0.42, z]);
    });
  }
  inst(new THREE.BoxGeometry(1.12, 1.78, 0.06), copper, framesZ, 'paneel_rahmen_z');
  inst(new THREE.BoxGeometry(1.00, 1.60, 0.04), wallDark, panelsZ, 'paneele_z');
  inst(new THREE.BoxGeometry(0.07, 0.30, 0.02), lineGlow, slotsZ, 'lichtschlitze_z');
  inst(new THREE.BoxGeometry(0.06, 1.78, 1.12), copper, framesX, 'paneel_rahmen_x');
  inst(new THREE.BoxGeometry(0.04, 1.60, 1.00), wallDark, panelsX, 'paneele_x');
  const slotMesh = inst(new THREE.BoxGeometry(0.02, 0.30, 0.07), lineGlow, slotsX, 'lichtschlitze_x');

  // Sockelleisten und Gesimse (Bronze), an der Tür unterbrochen
  for (const s of [-1, 1]) {
    const x = s * (IN_X - 0.02);
    box(0.05, 0.15, D, copper, x, 0.075, 0, 'sockel_' + (s < 0 ? 'links' : 'rechts'));
    box(0.06, 0.10, D, copper, x, H - 0.05, 0, 'gesims_' + (s < 0 ? 'links' : 'rechts'));
  }
  box(W, 0.15, 0.05, copper, 0, 0.075, IN_Z - 0.02, 'sockel_hinten');
  box(W, 0.10, 0.06, copper, 0, H - 0.05, IN_Z - 0.02, 'gesims_hinten');
  for (const s of [-1, 1]) {
    const len = (W - DOOR_W) / 2;
    box(len, 0.15, 0.05, copper, s * (DOOR_W / 2 + len / 2), 0.075, -IN_Z + 0.02, 'sockel_vorne');
    box(len, 0.10, 0.06, copper, s * (DOOR_W / 2 + len / 2), H - 0.05, -IN_Z + 0.02, 'gesims_vorne');
  }

  // ------------------------------------------------------------------ Kabelarchitektur (Kanäle, Trays, Bündel)
  for (const s of [-1, 1]) {
    box(0.16, 0.12, D - 0.8, copper, s * (IN_X - 0.08), 2.62, 0, 'kabelkanal_wand_' + (s < 0 ? 'links' : 'rechts'));
    box(0.16, 0.03, 4.8, wallDark, s * 3.4, 0.015, 0.4, 'kabelkanal_boden_' + (s < 0 ? 'links' : 'rechts'));
  }
  box(W - 0.8, 0.12, 0.16, copper, 0, 2.62, IN_Z - 0.08, 'kabelkanal_wand_hinten');
  box(5.2, 0.03, 0.16, wallDark, 0, 0.015, 1.0, 'kabelkanal_boden_quer');
  // vertikale Kabelbündel in den Ecken
  const bundGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
  const bund = new THREE.InstancedMesh(bundGeo, copper, 8);
  let bi = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 2; k++) {
    o3.position.set(sx * (IN_X - 0.14 - k * 0.12), 1.25, sz * (IN_Z - 0.14));
    o3.rotation.set(0, 0, 0);
    o3.updateMatrix();
    bund.setMatrixAt(bi++, o3.matrix);
  }
  bund.count = bi;
  bund.instanceMatrix.needsUpdate = true;
  bund.name = 'kabelbuendel';
  root.add(bund);

  // ------------------------------------------------------------------ Säulen (schlank, leicht geneigt)
  const pillarGeo = new THREE.BoxGeometry(0.26, H - 0.15, 0.34);
  const cols = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cols.push([sx * (IN_X - 0.24), (H - 0.15) / 2, sz * (IN_Z - 0.24), 0]);
  // zwei geneigte Pfeiler neben dem Eingang
  cols.push([-2.15, (H - 0.15) / 2, -IN_Z + 0.45, 0]);
  cols.push([2.15, (H - 0.15) / 2, -IN_Z + 0.45, 0]);
  const colMesh = inst(pillarGeo, pillar, cols, 'saeulen');
  const mTmp = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const vTmp = new THREE.Vector3();
  const scTmp = new THREE.Vector3(1, 1, 1);
  cols.forEach((c, i) => {
    let zTilt = 0;
    if (c[2] < -IN_Z + 1) zTilt = c[0] < 0 ? 0.07 : -0.07;             // Eingangspfeiler
    else zTilt = (c[0] * c[2]) > 0 ? 0.04 : -0.04;                        // Eckpfeiler
    eul.set(0, 0, zTilt);
    q.setFromEuler(eul);
    vTmp.set(c[0], c[1], c[2]);
    mTmp.compose(vTmp, q, scTmp);
    colMesh.setMatrixAt(i, mTmp);
  });
  colMesh.instanceMatrix.needsUpdate = true;

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke');
  for (const s of [-1, 1]) {
    box(0.09, 0.04, D - 0.4, glow, s * (IN_X - 0.4), H - 0.02, 0, 'decke_lichtband_' + (s < 0 ? 'links' : 'rechts'));
    box(W - 0.4, 0.04, 0.09, glow, 0, H - 0.02, s * (IN_Z - 0.4), 'decke_lichtband_' + (s < 0 ? 'vorne' : 'hinten'));
  }
  const kass = [];
  for (let z = -2.4; z <= 2.41; z += 1.2) for (let x = -3.6; x <= 3.61; x += 1.2) kass.push([x, H - 0.015, z]);
  inst(new THREE.BoxGeometry(1.0, 0.03, 1.0), wallDark, kass, 'decke_kassetten');

  // ------------------------------------------------------------------ Anschlüsse
  empty('DOOR_haupt', 0, 0, zFront, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Ostpier, Etage 3 – Flur/Korridor' });
  empty('PLACE_OBJ-091', 0, 0, zFront, 0);

  // ------------------------------------------------------------------ Objektplätze
  // Subraum-Diagnoseplatz (3,57 × 2,32 × 2,15) an der Rückwand, Front zeigt zum Eingang
  empty('PLACE_OBJ-023', -2.2, 0, IN_Z - 0.15 - 2.15 / 2, Math.PI);
  // Kristall-Schnittstellenleser (0,74 × 0,98 × 0,38) an der rechten Wand, Front in den Raum
  empty('PLACE_OBJ-070', IN_X - 0.19, 0, 1.05, -Math.PI / 2);
  empty('PLACE_OBJ-070_2', IN_X - 0.19, 0, -0.35, -Math.PI / 2);
  // Toughbook-Feldlaptops (0,31 × 0,25 × 0,32) im vorderen Diagnose-/Arbeitsbereich
  empty('PLACE_OBJ-069', -2.95, 0, 0.35, Math.PI + 0.18);
  empty('PLACE_OBJ-069_2', -1.75, 0, 0.35, Math.PI);
  empty('PLACE_OBJ-069_3', -0.55, 0, 0.35, Math.PI - 0.18);
  // Espresso-/Kaffeestation (2,80 × 1,70 × 0,92) an der linken Wand
  empty('PLACE_OBJ-082', -(IN_X - 0.46), 0, -1.6, Math.PI / 2);
  // Türpaneel und Wandleuchten
  empty('PLACE_OBJ-052', 1.55, 1.2, -IN_Z, 0);
  empty('PLACE_OBJ-053', -(IN_X - 0.02), 2.2, -0.9, Math.PI / 2);
  empty('PLACE_OBJ-053_2', IN_X - 0.02, 2.2, 0.6, -Math.PI / 2);
  empty('PLACE_OBJ-053_3', 0, 2.2, IN_Z - 0.02, Math.PI);

  // ------------------------------------------------------------------ Lichter
  const lampPos = [
    [-2.4, H - 0.35, -1.6], [2.4, H - 0.35, -1.6],
    [-2.4, H - 0.35, 1.6], [2.4, H - 0.35, 1.6],
    [0, H - 0.35, 0],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#9fd8ff', intensity: 8, distance: 9 });
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
  col('COL_wand_hinten', W + 2 * T, H, T, 0, H / 2, IN_Z + T / 2);
  col('COL_wand_links', T, H, D + 2 * T, -(IN_X + T / 2), H / 2, 0);
  col('COL_wand_rechts', T, H, D + 2 * T, IN_X + T / 2, H / 2, 0);
  for (const s of [-1, 1]) col(`COL_wand_vorne_${s < 0 ? 'links' : 'rechts'}`, sideLen, H, T, s * (DOOR_W / 2 + sideLen / 2), H / 2, zFront);
  col('COL_wand_vorne_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zFront);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    col(`COL_saeule_${sx < 0 ? 'l' : 'r'}${sz < 0 ? 'v' : 'h'}`, 0.32, H, 0.40, sx * (IN_X - 0.24), H / 2, sz * (IN_Z - 0.24));
  }
  col('COL_saeule_eingang_l', 0.32, H, 0.40, -2.15, H / 2, -IN_Z + 0.45);
  col('COL_saeule_eingang_r', 0.32, H, 0.40, 2.15, H / 2, -IN_Z + 0.45);

  // ------------------------------------------------------------------ Animation / API
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.55 + Math.sin(t * 0.7) * 0.14;
  };
  root.userData.api = {
    setStrom: (v) => {
      const k = Math.max(0, Math.min(1, v));
      lineGlow.emissiveIntensity = 0.15 + k * 1.45;
      root.traverse((o) => {
        if (o.name && o.name.startsWith('LAMP_') && o.userData) o.userData.intensity = 8 * k;
      });
    },
    getStrom: () => lineGlow.emissiveIntensity / 1.6,
  };
  root.userData.raum = { id: 'ATL-018', breite: W, tiefe: D, hoehe: H, tuer: 'DOOR_haupt' };
  return root;
}

// Raum ATL-032: Drohnen-Waffenlager (West Pier, Etage 5)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Rechteckiger unterirdischer Lagerbunker 20,0 m × 12,5 m (250 m²), lichte Höhe 5,0 m.
// Hauptzugang an der Seite −Z. Leere Hülle: Waben-Wandarchitektur, Stützen, Deckenbinder.
// Keine Möbel, keine Gestelle, keine Kräne, keine Konsolen – nur Architektur und PLACE_-Punkte.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_drone_weapon_storage',
  art: 'Raum',
  masse: '20,0 m × 12,5 m Grundfläche (250 m²), 5,0 m lichte Höhe, 0,3 m Wandstärke',
  wohin: 'West Pier, Etage 5 – militärisches Munitionsdepot der Lantean-Drohnenwaffen',
  benutzen: 'Platzierung antiker Drohnenwaffen (OBJ-032) in den Bodenwaben an den Seitenwänden; Schiebetüren OBJ-091 an beiden Durchgängen',
  lichter: '6 LAMP_-Punkte (eisblau, Intensität 9, Reichweite 17 m), eingebaute Waben-Leuchtmodule, Lichtschlitze und gedämpfte Deckenlichtfelder',
  animation: 'Waben-Leuchtmodule, Lichtschlitze und Deckenfelder atmen subtil (Emissiv-Puls ±0,15)',
  quelle: 'Rekonstruktion nach ATL-032-Beschreibung und Screencap „Drohnen-Waffenlager“ (Ref1); Atlantis-Kupfer-, Waben- und 60°-Motiv',
};

export const varianten = [
  { label: 'Standard – Drohnen-Waffenlager 20 × 12,5 m', opts: {} },
];

const B = 20.0;
const D = 12.5;
const H = 5.0;
const T = 0.3;
const DOOR_W = 2.4;
const DOOR_H = 3.0;
const HALF_X = B / 2;
const HALF_Z = D / 2;
const PILLAR_Z = [-3.0, 3.0];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_drone_weapon_storage';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlow = kit('glow');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.62, roughness: 0.42,
  });
  const matLineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.35, roughness: 0.4,
  });
  const matCellGlow = new THREE.MeshStandardMaterial({
    name: 'wannen_leuchte', color: 0x9fc7b6, emissive: 0x6fd6a8, emissiveIntensity: 0.55, roughness: 0.55,
  });
  const matCeilField = new THREE.MeshStandardMaterial({
    name: 'decke_lichtfeld', color: 0x2b3a44, emissive: 0x9fd8ff, emissiveIntensity: 0.7, roughness: 0.6,
  });

  const dummy = new THREE.Object3D();

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const instanced = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      dummy.scale.setScalar(p.s || 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    im.instanceMatrix.needsUpdate = true;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(B, 0.1, D, matFloor, 0, -0.05, 0, 'boden');
  for (const s of [-1, 1]) {
    box(0.22, 0.012, D - 0.02, matPatina, s * (HALF_X - 0.11), 0.006, 0, 'boden_rand_x');
    box(B - 0.02, 0.012, 0.22, matPatina, 0, 0.006, s * (HALF_Z - 0.11), 'boden_rand_z');
  }
  const seamsX = [], seamsZ = [];
  for (let x = -9.6; x <= 9.6 + 0.001; x += 1.2) seamsX.push({ x, y: 0.004, z: 0 });
  for (let z = -6.0; z <= 6.0 + 0.001; z += 1.2) seamsZ.push({ x: 0, y: 0.004, z });
  instanced(new THREE.BoxGeometry(0.018, 0.006, D - 0.44), matCopper, seamsX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(B - 0.44, 0.006, 0.018), matCopper, seamsZ, 'boden_fugen_z');
  box(0.06, 0.008, D - 0.44, matCopper, 0, 0.005, 0, 'boden_mittellinie');

  // Technische Bodenintarsie (Rundform nur im Boden erlaubt) – Sechseckring
  const intShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 1.16, y = Math.sin(a) * 1.16;
    if (i === 0) intShape.moveTo(x, y); else intShape.lineTo(x, y);
  }
  intShape.closePath();
  const intHole = new THREE.Path();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 1.02, y = Math.sin(a) * 1.02;
    if (i === 0) intHole.moveTo(x, y); else intHole.lineTo(x, y);
  }
  intHole.closePath();
  intShape.holes.push(intHole);
  const intGeo = new THREE.ExtrudeGeometry(intShape, { depth: 0.012, bevelEnabled: false, curveSegments: 1 });
  intGeo.rotateX(-Math.PI / 2);
  add(intGeo, matCopper, 0, 0.002, 0, 'boden_intarsie');

  // ------------------------------------------------------------------ Wände
  const wallX = HALF_X + T / 2;
  const wallZ = HALF_Z + T / 2;

  box(T, H, D, matWallDark, -wallX, H / 2, 0, 'wand_west');
  box(T, H, D, matWallDark, wallX, H / 2, 0, 'wand_ost');

  const buildEndWall = (sign) => {
    const zc = sign * wallZ;
    const zIn = sign * HALF_Z;
    const name = sign < 0 ? 'sued' : 'nord';
    const wSide = (B - DOOR_W) / 2;
    for (const s of [-1, 1]) {
      box(wSide, H, T, matWall, s * (DOOR_W / 2 + wSide / 2), H / 2, zc, `wand_${name}_${s < 0 ? 'w' : 'o'}`);
      box(wSide, 0.16, 0.05, matCopper, s * (DOOR_W / 2 + wSide / 2), 0.08, zIn - sign * 0.025, `sockel_${name}`);
      box(wSide, 0.10, 0.06, matCopper, s * (DOOR_W / 2 + wSide / 2), H - 0.18, zIn - sign * 0.03, `gesims_${name}`);
    }
    box(DOOR_W, H - DOOR_H, T, matWall, 0, DOOR_H + (H - DOOR_H) / 2, zc, `wand_${name}_sturz`);
    for (const s of [-1, 1]) {
      box(0.12, DOOR_H, 0.09, matCopper, s * (DOOR_W / 2 + 0.06), DOOR_H / 2, zIn - sign * 0.045, `tuerfassung_${name}`);
    }
    box(DOOR_W + 0.24, 0.12, 0.09, matCopper, 0, DOOR_H + 0.06, zIn - sign * 0.045, `tuersturz_${name}`);
  };
  buildEndWall(-1);
  buildEndWall(1);

  // Sockelleisten/Gesimse der Seitenwände
  for (const s of [-1, 1]) {
    box(0.05, 0.16, D, matCopper, s * (HALF_X - 0.025), 0.08, 0, 'sockel');
    box(0.07, 0.10, D, matCopper, s * (HALF_X - 0.035), H - 0.18, 0, 'gesims');
  }

  // ------------------------------------------------------------------ Waben-Architektur (60°-Sechsecke)
  const hexRing = (ro, ri, depth) => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * ro, y = Math.sin(a) * ro;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const hole = new THREE.Path();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * ri, y = Math.sin(a) * ri;
      if (i === 0) hole.moveTo(x, y); else hole.lineTo(x, y);
    }
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -depth / 2);
    return geo;
  };
  const hexSolid = (ro, depth) => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * ro, y = Math.sin(a) * ro;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -depth / 2);
    return geo;
  };

  const ringGeo = hexRing(0.58, 0.46, 0.07);
  const cellGeo = hexSolid(0.45, 0.03);

  const cells = [];
  const pushCell = (x, y, z, ry, nx, nz) => cells.push({ x, y, z, ry, nx, nz });

  // Seitenwände
  for (const s of [-1, 1]) {
    for (let r = 0; r < 4; r++) {
      for (let c = -4; c <= 4; c++) {
        const z = c * 1.0 + (r % 2 ? 0.5 : 0);
        if (Math.abs(z) > HALF_Z - 0.75) continue;
        if (PILLAR_Z.some(pz => Math.abs(z - pz) < 0.62)) continue;
        pushCell(s * (HALF_X - 0.035), 0.78 + r * 0.92, z, s < 0 ? Math.PI / 2 : -Math.PI / 2, -s, 0);
      }
    }
  }
  // Stirnwände (Türbereich in der Mitte ausgespart)
  for (const sign of [-1, 1]) {
    for (const s of [-1, 1]) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const x = s * (2.1 + c * 1.0 + (r % 2 ? 0.5 : 0));
          if (Math.abs(x) > HALF_X - 0.75) continue;
          pushCell(x, 0.78 + r * 0.92, sign * (HALF_Z - 0.035), sign < 0 ? 0 : Math.PI, 0, -sign);
        }
      }
    }
  }

  instanced(ringGeo, matCopper, cells, 'waben_rahmen');
  instanced(cellGeo, matCellGlow, cells.map(c => ({
    x: c.x + c.nx * 0.045, y: c.y, z: c.z + c.nz * 0.045, ry: c.ry,
  })), 'waben_module');

  // Bodenwaben als Lagerplätze (Lagerfächer, Teil der Architektur)
  const floorBays = [];
  for (const s of [-1, 1]) {
    for (let c = -4; c <= 4; c++) {
      const z = c * 1.15;
      if (PILLAR_Z.some(pz => Math.abs(z - pz) < 0.72)) continue;
      floorBays.push({ x: s * 9.3, y: 0.014, z, rx: -Math.PI / 2 });
    }
  }
  instanced(hexRing(0.55, 0.44, 0.05), matCopper, floorBays, 'boden_waben');

  // ------------------------------------------------------------------ Vertikale Wandrippen + Lichtschlitze
  const ribs = [];
  for (const s of [-1, 1]) {
    for (let z = -5.4; z <= 5.4 + 0.001; z += 1.8) {
      if (PILLAR_Z.some(pz => Math.abs(z - pz) < 0.55)) continue;
      ribs.push({ x: s * (HALF_X - 0.09), y: (H - 0.5) / 2, z });
    }
  }
  instanced(new THREE.BoxGeometry(0.18, H - 0.5, 0.22), matWallDark, ribs, 'wandrippen');

  const slots = [];
  for (const s of [-1, 1]) {
    for (const z of [-5.6, 5.6]) {
      for (let k = 0; k < 5; k++) {
        slots.push({ x: s * (HALF_X - 0.02), y: 1.05 + k * 0.42, z });
      }
    }
  }
  const slotMesh = instanced(new THREE.BoxGeometry(0.02, 0.3, 0.07), matLineGlow, slots, 'lichtschlitze');

  // Lichtbänder knapp unter der Decke
  for (const s of [-1, 1]) {
    box(0.05, 0.08, D - 0.5, matGlow, s * (HALF_X - 0.03), 4.62, 0, 'lichtband_seite');
  }
  box(B - 0.6, 0.08, 0.05, matGlow, 0, 4.62, HALF_Z - 0.03, 'lichtband_rueck');
  box(B - 0.6, 0.08, 0.05, matGlow, 0, 4.62, -HALF_Z + 0.03, 'lichtband_front');

  // ------------------------------------------------------------------ Stützen
  const pillars = [];
  for (const s of [-1, 1]) for (const z of PILLAR_Z) {
    pillars.push({ x: s * (HALF_X - 0.35), y: (H - 0.4) / 2, z });
  }
  instanced(new THREE.BoxGeometry(0.5, H - 0.4, 0.5), matPillar, pillars, 'saeulen');
  instanced(new THREE.BoxGeometry(0.72, 0.18, 0.72), matCopper,
    pillars.map(p => ({ ...p, y: H - 0.28 })), 'saeulen_kappen');
  instanced(new THREE.BoxGeometry(0.78, 0.12, 0.78), matCopper,
    pillars.map(p => ({ ...p, y: 0.06 })), 'saeulen_fuesse');

  // ------------------------------------------------------------------ Decke
  box(B + 2 * T, 0.3, D + 2 * T, matCeiling, 0, H + 0.15, 0, 'decke');
  const cassettes = [], ceilFields = [];
  for (let x = -7.2; x <= 7.2 + 0.001; x += 2.4) {
    for (let z = -4.8; z <= 4.8 + 0.001; z += 2.4) {
      cassettes.push({ x, y: H - 0.03, z });
      ceilFields.push({ x, y: H - 0.075, z });
    }
  }
  instanced(new THREE.BoxGeometry(2.1, 0.06, 2.1), matWallDark, cassettes, 'decke_kassetten');
  const ceilGlowMesh = instanced(new THREE.BoxGeometry(0.95, 0.03, 0.95), matCeilField, ceilFields, 'decke_lichtfelder');
  for (const z of PILLAR_Z) box(B, 0.24, 0.34, matWallDark, 0, H - 0.12, z, 'decke_traeger');
  box(B, 0.2, 0.28, matWallDark, 0, H - 0.1, 0, 'decke_traeger_mitte');

  // ------------------------------------------------------------------ Platzhalter / Anschlüsse
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY || 0;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  empty('DOOR_eingang', 0, 0, -wallZ, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Hauptgang West Pier', raum: 'ATL-049',
  });
  empty('DOOR_verladung', 0, 0, wallZ, 0, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Verladeflur / Versorgungsgang', raum: 'ATL-049',
  });

  empty('PLACE_OBJ-091', 0, 0, -wallZ, 0);
  empty('PLACE_OBJ-091_2', 0, 0, wallZ, Math.PI);

  // Drohnenwaffen (OBJ-032) – Standobjekte, Fußpunkt auf dem Boden, Vorderseite (+Z) in den Raum
  let n = 0;
  for (const s of [-1, 1]) {
    for (let c = -4; c <= 4; c++) {
      const z = c * 1.15;
      if (PILLAR_Z.some(pz => Math.abs(z - pz) < 0.72)) continue;
      n += 1;
      empty(n === 1 ? 'PLACE_OBJ-032' : `PLACE_OBJ-032_${n}`, s * 9.35, 0, z, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }

  // ------------------------------------------------------------------ Licht
  const lampPositions = [
    [-6.0, 4.55, -3.2], [0, 4.55, -3.2], [6.0, 4.55, -3.2],
    [-6.0, 4.55, 3.2], [0, 4.55, 3.2], [6.0, 4.55, 3.2],
  ];
  const lampLights = [];
  lampPositions.forEach((p, i) => {
    const data = { color: '#9fd8ff', intensity: 9, distance: 17 };
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, data);
    const pl = new THREE.PointLight(0x9fd8ff, 9, 17, 2);
    pl.position.set(p[0], p[1], p[2]);
    pl.name = `PUNKT_${i + 1}`;
    pl.userData = { ...data };
    root.add(pl);
    lampLights.push(pl);
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
  col('COL_boden', B + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', B + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  for (const s of [-1, 1]) {
    col(`COL_wand_${s < 0 ? 'west' : 'ost'}`, T, H, D, s * wallX, H / 2, 0);
    for (const z of PILLAR_Z) {
      col(`COL_saeule_${s < 0 ? 'w' : 'o'}_${z < 0 ? 'a' : 'b'}`, 0.5, H - 0.4, 0.5,
        s * (HALF_X - 0.35), (H - 0.4) / 2, z);
    }
  }
  const wSide = (B - DOOR_W) / 2;
  for (const sign of [-1, 1]) {
    const zc = sign * wallZ;
    const nm = sign < 0 ? 'sued' : 'nord';
    for (const s of [-1, 1]) {
      col(`COL_wand_${nm}_${s < 0 ? 'w' : 'o'}`, wSide, H, T, s * (DOOR_W / 2 + wSide / 2), H / 2, zc);
    }
    col(`COL_sturz_${nm}`, DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zc);
  }

  // ------------------------------------------------------------------ Animation / API
  let t = 0, last = null;
  const breathe = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    const p = Math.sin(t * 0.7);
    matLineGlow.emissiveIntensity = 1.35 + p * 0.15;
    matCellGlow.emissiveIntensity = 0.55 + p * 0.1;
    matCeilField.emissiveIntensity = 0.7 + p * 0.12;
    matGlow.emissiveIntensity = 1.25 + p * 0.12;
  };
  if (slotMesh) slotMesh.onBeforeRender = breathe;
  if (ceilGlowMesh) ceilGlowMesh.onBeforeRender = breathe;
  root.userData.animation = breathe;

  root.userData.api = {
    setBeleuchtung(v) {
      const k = Math.max(0, Math.min(1, v));
      matLineGlow.emissiveIntensity = 1.35 * k;
      matCellGlow.emissiveIntensity = 0.55 * k;
      matCeilField.emissiveIntensity = 0.7 * k;
      matGlow.emissiveIntensity = 1.25 * k;
      lampLights.forEach(l => { l.intensity = 9 * k; });
    },
    getObjektAnzahl() {
      return root.children.filter(o => o.name.startsWith('PLACE_OBJ-032')).length;
    },
  };
  root.userData.actions = [
    {
      id: 'INT-032-licht',
      label: 'Bunkerbeleuchtung umschalten',
      run() {
        const api = root.userData.api;
        const state = root.userData._lichtAus ? 1 : 0;
        api.setBeleuchtung(state);
        root.userData._lichtAus = !state;
      },
    },
  ];

  root.userData.raum = {
    id: 'ATL-032',
    name: 'Drohnen-Waffenlager',
    breite: B, tiefe: D, hoehe: H,
    objekte: ['OBJ-032'],
    tueren: ['DOOR_eingang', 'DOOR_verladung'],
  };
  return root;
}

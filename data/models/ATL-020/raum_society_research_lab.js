// Raum ATL-020: Gesellschaftsforschungs-Labor (Society Research Lab)
// East Pier, Etage 3. 1 Einheit = 1 m, +Y oben.
// Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0, Haupteingang an der Seite -Z.
// Leere Raumhülle: nur Architektur (Boden, polygonale Wände, Fenster, Säulen, Deckenfelder).
// Der Zivilisations-Simulator (OBJ-025) wird ausschließlich als PLACE_-Punkt gesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_society_research_lab',
  art: 'Raum',
  masse: 'ca. 67,8 m² Grundfläche · 10,4 m Breite × 8,0 m Tiefe · 3,4 m Deckenhöhe',
  wohin: 'East Pier, Etage 3 – Forschungsbereich der Atlantis-Wissenschaftler',
  benutzen: 'Zivilisations-Simulation (OBJ-025) in der Raummitte; Beobachtungssitze und Auswertungskonsolen bleiben als freie Standfläche',
  lichter: '5 LAMP_ (eisblau, indirekt) plus eingebaute Wand-Lichtschlitze und Decken-Lichtfelder',
  animation: 'Lichtschlitze und Decken-Lichtfelder pulsieren sehr dezent',
  quelle: 'selbst gebaut nach Raumbeschreibung ATL-020, Referenzbild „The Game“ und Atlantis-Setplänen „Halls & Corridors“',
};

const H = 3.4;         // lichte Raumhöhe
const T = 0.3;         // Wanddicke
const GRID = 1.2;      // Rasterfeld
const DOOR_W = 2.4;    // Öffnungsbreite
const DOOR_H = 3.0;    // Öffnungshöhe
const WIN_SILL = 1.35; // Fensterbank (über Möbel-/Körperhöhe, damit keine losen Brustwände entstehen)
const WIN_HEAD = 3.05;

// Grundriss: siebeneckige, facettierte „Halbkreis“-Aufteilung (30°/60°-Kanten), im Uhrzeigersinn.
const POLY = [
  { x: 5.2, z: -3.8 },
  { x: -5.2, z: -3.8 },
  { x: -5.2, z: 0.0 },
  { x: -3.4, z: 2.7 },
  { x: 0.0, z: 4.2 },
  { x: 3.4, z: 2.7 },
  { x: 5.2, z: 0.0 },
];

// Fensterbreiten je Wandsegment (Segment 0 = Eingangswand, ohne Fenster)
const WIN = [0, 2.4, 2.4, 2.6, 2.6, 2.4, 2.4];

// Inscribed Kollisions-Scheiben für Boden/Decke ( liegen vollständig innerhalb des Polygons )
const SLICES = [
  { z0: -3.8, z1: 0.0, w: 10.4 },
  { z0: 0.0, z1: 0.9, w: 9.2 },
  { z0: 0.9, z1: 1.8, w: 8.0 },
  { z0: 1.8, z1: 2.7, w: 6.8 },
  { z0: 2.7, z1: 3.2, w: 4.5 },
  { z0: 3.2, z1: 3.7, w: 2.25 },
  { z0: 3.7, z1: 4.15, w: 0.6 },
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_society_research_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glass = kit('glass');
  const glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xe8f8ff, emissive: 0x9fd8ff, emissiveIntensity: 1.55,
    metalness: 0.1, roughness: 0.35,
  });

  const box = (w, h, d, mat, x, y, z, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const colBox = (w, h, d, x, y, z, name, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
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
  const o3 = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
    list.forEach((p, i) => {
      o3.position.set(p.x, p.y, p.z);
      o3.rotation.set(0, p.ry || 0, 0);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden / Decke (Polygonzone)
  const shape = new THREE.Shape();
  POLY.forEach((p, i) => {
    const sx = p.x, sy = -p.z; // Form in XZ-Ebene
    if (i === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
  });
  shape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.1;
  floor.name = 'boden';
  root.add(floor);

  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  const ceil = new THREE.Mesh(ceilGeo, ceilingMat);
  ceil.position.y = H;
  ceil.name = 'decke';
  root.add(ceil);

  // ------------------------------------------------------------------ Segment-Hilfsdaten
  const seg = (i) => {
    const a = POLY[i], b = POLY[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const ox = -uz, oz = ux;              // Außennormale (Innenfläche bei off = 0)
    const ry = -Math.atan2(dz, dx);
    const at = (u, off, y) => ({ x: a.x + ux * u + ox * off, y, z: a.z + uz * u + oz * off });
    return { a, b, len, ux, uz, ox, oz, ry, at };
  };

  // ------------------------------------------------------------------ Abgehängte Deckenfelder (innerhalb der Hülle)
  const deckFields = [], deckLights = [];
  for (let i = 0; i < POLY.length - 1; i++) {
    const s = seg(i);
    const cx = (s.a.x + s.b.x) / 2 - s.ox * 1.6;
    const cz = (s.a.z + s.b.z) / 2 - s.oz * 1.6;
    deckFields.push({ x: cx, y: H - 0.14, z: cz, ry: s.ry });
    deckLights.push({ x: cx - s.ox * 0.42, y: H - 0.03, z: cz - s.oz * 0.42, ry: s.ry });
  }
  inst(new THREE.BoxGeometry(1.6, 0.14, 1.2), wallDark, deckFields, 'decke_abhaengfelder');
  const deckLightMesh = inst(new THREE.BoxGeometry(1.4, 0.035, 0.16), lineGlow, deckLights, 'decke_lichtfelder');

  // ------------------------------------------------------------------ Wände
  const panelList = [], frameList = [], slotList = [];

  const addRun = (i, a, b, u0, u1, y0, y1, mat, name, collide = true) => {
    const w = u1 - u0, h = y1 - y0;
    if (w <= 0.005 || h <= 0.005) return null;
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const ox = -uz, oz = ux;
    const ry = -Math.atan2(dz, dx);
    const cx = a.x + ux * ((u0 + u1) / 2) + ox * (T / 2);
    const cz = a.z + uz * ((u0 + u1) / 2) + oz * (T / 2);
    const m = box(w, h, T, mat, cx, (y0 + y1) / 2, cz, name);
    m.rotation.y = ry;
    if (collide) colBox(w, h, T, cx, (y0 + y1) / 2, cz, `COL_${name}`, ry);
    return m;
  };

  for (let i = 0; i < POLY.length - 1; i++) {
    const s = seg(i);
    const { a, b, len, ry, at } = s;
    const isDoor = i === 0;
    const openW = isDoor ? DOOR_W : WIN[i];
    const u0 = (len - openW) / 2, u1 = u0 + openW;

    // massive Wandstücke links und rechts der Öffnung
    addRun(i, a, b, 0, u0, 0, H, wall, `wand_${i}_a`);
    addRun(i, a, b, u1, len, 0, H, wall, `wand_${i}_b`);

    if (isDoor) {
      // Türöffnung 2,4 × 3 m mit Sturz
      addRun(i, a, b, u0, u1, DOOR_H, H, wall, `wand_${i}_sturz`);
      const frameT = T + 0.08;
      for (const u of [u0, u1]) {
        const p = at(u, T / 2, DOOR_H / 2);
        const m = box(0.12, DOOR_H, frameT, copper, p.x, p.y, p.z, `tuerfassung_${i}_${u === u0 ? 'links' : 'rechts'}`);
        m.rotation.y = ry;
      }
      const ph = at(u0 + openW / 2, T / 2, DOOR_H);
      const mh = box(openW + 0.24, 0.14, frameT, copper, ph.x, ph.y, ph.z, `tuersturz_${i}`);
      mh.rotation.y = ry;
    } else {
      // Fensterfront: Brustwand (1,35 m), Oberteil, Glasfläche, Rahmen, Mittelsprosse
      addRun(i, a, b, u0, u1, 0, WIN_SILL, wall, `wand_${i}_brust`);
      addRun(i, a, b, u0, u1, WIN_HEAD, H, wall, `wand_${i}_oberteil`);

      const pg = at(u0 + openW / 2, T / 2, (WIN_SILL + WIN_HEAD) / 2);
      const gm = box(openW - 0.06, WIN_HEAD - WIN_SILL - 0.06, 0.05, glass, pg.x, pg.y, pg.z, `fenster_${i}_glas`);
      gm.rotation.y = ry;
      colBox(openW, WIN_HEAD - WIN_SILL, T, pg.x, pg.y, pg.z, `COL_fenster_${i}`, ry);

      const frameT = T + 0.08;
      for (const u of [u0, u1]) {
        const p = at(u, T / 2, (WIN_SILL + WIN_HEAD) / 2);
        const fm = box(0.1, WIN_HEAD - WIN_SILL, frameT, copper, p.x, p.y, p.z, `fenster_${i}_rahmen_seitlich`);
        fm.rotation.y = ry;
      }
      for (const y of [WIN_SILL, WIN_HEAD]) {
        const p = at(u0 + openW / 2, T / 2, y);
        const fm = box(openW + 0.2, 0.1, frameT, copper, p.x, p.y, p.z, `fenster_${i}_rahmen_quer`);
        fm.rotation.y = ry;
      }
      // Fenstersprosse
      const pm = at(u0 + openW / 2, T / 2, (WIN_SILL + WIN_HEAD) / 2);
      const mm = box(0.08, WIN_HEAD - WIN_SILL, 0.12, copper, pm.x, pm.y, pm.z, `fenster_${i}_sprosse`);
      mm.rotation.y = ry;
      // Fensterbank
      const pb = at(u0 + openW / 2, -0.08, WIN_SILL);
      const bm = box(openW + 0.2, 0.08, 0.26, copper, pb.x, pb.y, pb.z, `fenster_${i}_bank`);
      bm.rotation.y = ry;
    }

    // Sockelleiste und Gesims auf den massiven Wandabschnitten
    for (const [s0, s1] of [[0, u0], [u1, len]]) {
      if (s1 - s0 < 0.05) continue;
      const p = at((s0 + s1) / 2, -0.025, 0.075);
      const m = box(s1 - s0, 0.15, 0.05, copper, p.x, p.y, p.z, `sockelleiste_${i}`);
      m.rotation.y = ry;
      const g = at((s0 + s1) / 2, -0.035, H - 0.05);
      const mg = box(s1 - s0, 0.1, 0.07, copper, g.x, g.y, g.z, `gesims_${i}`);
      mg.rotation.y = ry;
    }

    // Wandpaneele (plant-on) und Lichtschlitze im 1,2-m-Raster
    for (const [s0, s1] of [[0, u0], [u1, len]]) {
      const span = s1 - s0;
      if (span < 0.9) continue;
      const start = s0 + 0.55;
      for (let u = start; u < s1 - 0.25; u += GRID) {
        const idx = Math.round((u - start) / GRID);
        if (idx % 2 === 0) {
          const pf = at(u, -0.03, 1.6);
          frameList.push({ x: pf.x, y: pf.y, z: pf.z, ry });
          const pp = at(u, -0.018, 1.6);
          panelList.push({ x: pp.x, y: pp.y, z: pp.z, ry });
        } else {
          for (let k = 0; k < 5; k++) {
            const ps = at(u, -0.014, 0.55 + k * 0.5);
            slotList.push({ x: ps.x, y: ps.y, z: ps.z, ry });
          }
        }
      }
    }
  }

  inst(new THREE.BoxGeometry(1.1, 2.3, 0.05), copper, frameList, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.98, 2.18, 0.035), wallDark, panelList, 'wandpaneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.07, 0.3, 0.02), lineGlow, slotList, 'lichtschlitze');

  // ------------------------------------------------------------------ Säulen (leicht schräg, Perlgrau)
  const columnCorners = [
    { x: -5.2, z: 0.0 }, { x: -3.4, z: 2.7 }, { x: 0.0, z: 4.2 },
    { x: 3.4, z: 2.7 }, { x: 5.2, z: 0.0 },
  ];
  const center = { x: 0, z: 0.2 };
  columnCorners.forEach((c, n) => {
    const dx = center.x - c.x, dz = center.z - c.z;
    const l = Math.hypot(dx, dz);
    const px = c.x + (dx / l) * 0.62, pz = c.z + (dz / l) * 0.62;
    const m = box(0.26, H - 0.1, 0.3, pillar, px, (H - 0.1) / 2, pz, `saeule_${n}`);
    m.rotation.z = (n < 2 ? 1 : -1) * 0.055;
    m.rotation.x = (n === 1 || n === 4 ? 1 : -1) * 0.04;
    colBox(0.42, H, 0.46, px, H / 2, pz, `COL_saeule_${n}`);
    box(0.44, 0.18, 0.48, copper, px, 0.09, pz, `saeulensockel_${n}`);
    box(0.38, 0.12, 0.42, copper, px, H - 0.14, pz, `saeulenkapitell_${n}`);
  });

  // ------------------------------------------------------------------ Bodenintarsien (Sechseckring + Schneeflocke)
  const inlayY = 0.007;
  const R = 2.55, cx0 = 0, cz0 = 0.45;
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2;
    const mx = cx0 + Math.cos((a0 + a1) / 2) * R * Math.cos(Math.PI / 6);
    const mz = cz0 + Math.sin((a0 + a1) / 2) * R * Math.cos(Math.PI / 6);
    const m = box(R * Math.cos(Math.PI / 6), 0.012, 0.07, copper, mx, inlayY, mz, `bodenintarsie_sechseck_${i}`);
    m.rotation.y = -(a0 + a1) / 2 + Math.PI / 2;
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const arm = box(1.15, 0.012, 0.06, patina, cx0 + Math.cos(ang) * 0.85, inlayY, cz0 + Math.sin(ang) * 0.85, `schneeflocke_arm_${i}`);
    arm.rotation.y = -ang;
    for (const sg of [-1, 1]) {
      const bAng = ang + sg * Math.PI / 3;
      const bx = cx0 + Math.cos(ang) * 1.18 + Math.cos(bAng) * 0.22;
      const bz = cz0 + Math.sin(ang) * 1.18 + Math.sin(bAng) * 0.22;
      const br = box(0.46, 0.012, 0.05, copper, bx, inlayY, bz, `schneeflocke_zweig_${i}_${sg > 0 ? 'a' : 'b'}`);
      br.rotation.y = -bAng;
    }
  }

  // ------------------------------------------------------------------ Objektplatz / Türen / Licht
  // Zivilisations-Simulator (Standobjekt) in der Raummitte, Vorderseite (+Z) zum Haupteingang (-Z).
  empty('PLACE_OBJ-025', 0, 0, 0.45, Math.PI);

  // Haupteingang an -Z
  const doorZ = -3.8 - T / 2;
  empty('DOOR_haupteingang', 0, 0, doorZ, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'East Pier – Flur / Korridor',
  });
  empty('PLACE_OBJ-091', 0, 0, doorZ, 0);

  // Lichtpunkte
  const lampPos = [
    [0, 3.12, -2.95], [-3.35, 3.12, -0.4], [3.35, 3.12, -0.4],
    [-1.9, 3.12, 2.35], [1.9, 3.12, 2.35],
  ];
  lampPos.forEach((p, n) => empty(`LAMP_${n + 1}`, p[0], p[1], p[2], 0, {
    color: '#9fd8ff', intensity: 7, distance: 9,
  }));

  // ------------------------------------------------------------------ Kollision
  for (const sl of SLICES) {
    const d = sl.z1 - sl.z0;
    const cz = (sl.z0 + sl.z1) / 2;
    colBox(sl.w, 0.2, d, 0, -0.1, cz, `COL_boden_${sl.z0.toFixed(1)}`);
    colBox(sl.w, 0.3, d, 0, H + 0.15, cz, `COL_decke_${sl.z0.toFixed(1)}`);
  }

  // ------------------------------------------------------------------ Animation / API
  let t = 0, last = null;
  const pulse = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.7) * 0.12;
  };
  slotMesh.onBeforeRender = pulse;
  deckLightMesh.onBeforeRender = pulse;

  root.userData.raum = {
    id: 'ATL-020',
    name: 'Gesellschaftsforschungs-Labor',
    flaeche: 67.8,
    hoehe: H,
    simulator: 'PLACE_OBJ-025',
  };
  root.userData.api = {
    pulsieren: (aktiv = true) => {
      slotMesh.onBeforeRender = aktiv ? pulse : () => { lineGlow.emissiveIntensity = 1.5; };
      deckLightMesh.onBeforeRender = aktiv ? pulse : () => { lineGlow.emissiveIntensity = 1.5; };
    },
  };

  return root;
}

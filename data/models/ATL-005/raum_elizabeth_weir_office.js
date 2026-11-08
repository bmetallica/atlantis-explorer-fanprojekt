// Raum ATL-005: Büro von Dr. Elizabeth Weir – Control Tower, Etage 6.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Fünfeckiger Grundriss nach Produktions-Setplan „Weir's Office“ (Sc. 31/199, Joseph Mallozzi):
// linke Wand + untere Wand orthogonal, obere Wand leicht ansteigend, rechts zwei schräge
// Wände (60°/120°) mit verglaster Spitze und Durchgang zum Kontrollraum.
// Leere Raumhülle: nur Architektur. Möbel ausschließlich über PLACE_-Punkte eingesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_elizabeth_weir_office',
  art: 'Raum',
  masse: 'Fünfeck, Grundfläche ca. 45 m² (ca. 7,9 × 7,1 m), lichte Höhe 3,5 m',
  wohin: 'Control Tower, Etage 6 – Leitungsbüro, direkt an den Kontrollraum angrenzend',
  benutzen: 'Arbeits- und Besprechungsraum der Expeditionsleitung; Schreibtisch (OBJ-013) und Daten-Pads (OBJ-056) werden als Objekte an die PLACE_-Punkte gesetzt, Sitzecke und Wandflächen bleiben frei',
  lichter: '6 LAMP_-Punkte (blaugrün #9fe0d8 / eisblau #bfe9ff), indirekt über Deckenfelder, Decken-Lichtband, Wand-Lichtschlitze und Buntglas',
  animation: 'Lichtschlitze, Deckenbänder und Deckenfelder atmen langsam (≈0,14 Hz), dezente blaugrüne Helligkeitswelle',
  quelle: 'selbst gebaut nach Auftrag ATL-005, Produktions-Setplan „Weir’s Office“ (Sc. 31 / 199, Joseph Mallozzi) und Serienbild SGA',
};

const T = 0.3;        // Wandstärke
const H = 3.5;        // lichte Raumhöhe
const DOOR_W = 2.4;   // Öffnungsbreite
const DOOR_H = 3.0;   // Öffnungshöhe

// Fünfeck (X/Z): A unten links, B unten rechts, C Spitze rechts, D oben rechts, E oben links
const A = [-3.9, -3.4];
const B = [2.4, -3.4];
const C = [4.0, -0.6];
const D = [1.0, 3.7];
const E = [-3.9, 2.6];
const POLY = [A, B, C, D, E];
const CENTROID = { x: -0.08, z: -0.22 };

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_elizabeth_weir_office';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glassKit = kit('glass');
  const glowKit = kit('glow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const slotMat = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff6f2, emissive: 0x9fe0d8, emissiveIntensity: 1.7, roughness: 0.4,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    name: 'decke_lichtband', color: 0xe8fbff, emissive: 0x9fe0d8, emissiveIntensity: 1.3, roughness: 0.35,
  });
  const cofferMat = new THREE.MeshStandardMaterial({
    name: 'decke_feld', color: 0x22343b, emissive: 0x9fe0d8, emissiveIntensity: 0.35, roughness: 0.7,
  });
  const inlayMat = new THREE.MeshStandardMaterial({
    name: 'boden_intarsie', color: 0xb6793d, metalness: 0.75, roughness: 0.34,
  });

  // ------------------------------------------------------------ Hilfsfunktionen
  const add = (geo, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, rotY = 0) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, rotY);

  const colMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const col = (name, w, h, d, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colMat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    root.add(m);
    return m;
  };

  const dummy = new THREE.Object3D();
  const instanced = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, n) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.rot || 0, 0);
      dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      dummy.updateMatrix();
      im.setMatrixAt(n, dummy.matrix);
    });
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    im.instanceMatrix.needsUpdate = true;
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

  // ------------------------------------------------------------ Buntglas-Textur (Kupfer / Bernstein / Türkis, geometrisch)
  let buntglas = null;
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const g = c.getContext('2d');
      g.fillStyle = '#0a2f3c'; g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#12525e'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(159,224,216,0.40)'; g.lineWidth = 2;
      for (let i = -2; i < 10; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 512, 512); g.stroke();
        g.beginPath(); g.moveTo(i * 64, 512); g.lineTo(i * 64 + 512, 0); g.stroke();
      }
      g.strokeStyle = '#e0a34a'; g.lineWidth = 7;
      for (const cx of [128, 384]) {
        g.beginPath(); g.moveTo(cx, 26); g.lineTo(cx, 486); g.stroke();
        g.beginPath(); g.moveTo(26, 256); g.lineTo(486, 256); g.stroke();
        g.beginPath();
        g.moveTo(cx - 54, 136); g.lineTo(cx + 54, 376);
        g.moveTo(cx + 54, 136); g.lineTo(cx - 54, 376);
        g.stroke();
      }
      g.fillStyle = 'rgba(224,163,74,0.20)';
      g.fillRect(212, 0, 88, 512);
      buntglas = new THREE.CanvasTexture(c);
      buntglas.colorSpace = THREE.SRGBColorSpace;
    }
  } catch (e) { buntglas = null; }

  const stainedMat = buntglas
    ? new THREE.MeshStandardMaterial({
        name: 'buntglas', map: buntglas, emissiveMap: buntglas, emissive: 0xffffff,
        emissiveIntensity: 0.5, roughness: 0.16, metalness: 0.12,
        transparent: true, opacity: 0.94, side: THREE.DoubleSide,
      })
    : glassKit;

  // ------------------------------------------------------------ Kanten-Hilfen
  function edgeInfo(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    let nx = -uz, nz = ux;                       // Innnennormale
    if (nx * (CENTROID.x - a[0]) + nz * (CENTROID.z - a[1]) < 0) { nx = -nx; nz = -nz; }
    return { a, b, len, ux, uz, nx, nz, angle: -Math.atan2(dz, dx) };
  }
  const EDGES = [];
  for (let i = 0; i < POLY.length; i++) EDGES.push(edgeInfo(POLY[i], POLY[(i + 1) % POLY.length]));

  // Schnittintervall einer Geraden (x = v oder z = v) mit dem konvexen Fünfeck
  function axisInterval(axis, value) {
    const vals = [];
    for (let i = 0; i < POLY.length; i++) {
      const p = POLY[i], q = POLY[(i + 1) % POLY.length];
      if (axis === 'x') {
        if (Math.abs(q[0] - p[0]) < 1e-9) {
          if (Math.abs(value - p[0]) < 1e-6) vals.push(p[1], q[1]);
          continue;
        }
        const t = (value - p[0]) / (q[0] - p[0]);
        if (t >= 0 && t <= 1) vals.push(p[1] + t * (q[1] - p[1]));
      } else {
        if (Math.abs(q[1] - p[1]) < 1e-9) {
          if (Math.abs(value - p[1]) < 1e-6) vals.push(p[0], q[0]);
          continue;
        }
        const t = (value - p[1]) / (q[1] - p[1]);
        if (t >= 0 && t <= 1) vals.push(p[0] + t * (q[0] - p[0]));
      }
    }
    if (vals.length < 2) return null;
    return [Math.min(...vals), Math.max(...vals)];
  }

  function pointInPoly(x, z) {
    for (let i = 0; i < POLY.length; i++) {
      const p = POLY[i], q = POLY[(i + 1) % POLY.length];
      const cross = (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
      if (cross < -1e-9) return false;
    }
    return true;
  }

  const panelData = [], frameData = [], slotData = [];

  // ------------------------------------------------------------ Boden / Decke (folgen dem Fünfeck)
  function polygonShape() {
    const s = new THREE.Shape();
    POLY.forEach((p, i) => { if (i === 0) s.moveTo(p[0], -p[1]); else s.lineTo(p[0], -p[1]); });
    s.closePath();
    return s;
  }
  const floorGeo = new THREE.ExtrudeGeometry(polygonShape(), { depth: 0.1, bevelEnabled: false });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.name = 'boden';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  root.add(floor);

  const ceilGeo = new THREE.ExtrudeGeometry(polygonShape(), { depth: 0.3, bevelEnabled: false });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.name = 'decke_platte';
  ceil.rotation.x = -Math.PI / 2;
  ceil.position.y = H;
  root.add(ceil);

  // Bodenfugen: exakt auf den Schnittintervallen des Fünfecks
  const seamX = [], seamZ = [];
  const minX = Math.min(...POLY.map(p => p[0])), maxX = Math.max(...POLY.map(p => p[0]));
  const minZ = Math.min(...POLY.map(p => p[1])), maxZ = Math.max(...POLY.map(p => p[1]));
  for (let x = minX + 0.6; x <= maxX - 0.2; x += 1.2) {
    const iv = axisInterval('x', x);
    if (!iv) continue;
    const len = iv[1] - iv[0] - 0.02;
    if (len < 0.2) continue;
    seamX.push({ x, y: 0.004, z: (iv[0] + iv[1]) / 2, sx: 1, sz: len });
  }
  for (let z = minZ + 0.6; z <= maxZ - 0.2; z += 1.2) {
    const iv = axisInterval('z', z);
    if (!iv) continue;
    const len = iv[1] - iv[0] - 0.02;
    if (len < 0.2) continue;
    seamZ.push({ x: (iv[0] + iv[1]) / 2, y: 0.004, z, sx: len, sz: 1 });
  }
  instanced(new THREE.BoxGeometry(0.02, 0.008, 1), copper, seamX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(1, 0.008, 0.02), copper, seamZ, 'boden_fugen_z');

  // Grün-kupferner Rand entlang der Kontur (Haupttüröffnung ausgespart)
  const randList = [];
  const mainDoorS1 = EDGES[0].len - 1.2;              // 1,2 m geschlossene Wand rechts für die Türflügel
  const mainDoorS0 = mainDoorS1 - DOOR_W;
  for (const e of EDGES) {
    const n = Math.max(1, Math.round(e.len / 1.2));
    const seg = e.len / n;
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) * seg;
      if (e.a === A && e.b === B && s > mainDoorS0 - 0.15 && s < mainDoorS1 + 0.15) continue;
      randList.push({
        x: e.a[0] + e.ux * s + e.nx * 0.1,
        y: 0.007,
        z: e.a[1] + e.uz * s + e.nz * 0.1,
        rot: e.angle,
        sx: seg * 0.96,
      });
    }
  }
  instanced(new THREE.BoxGeometry(1, 0.014, 0.18), patina, randList, 'boden_rand');

  // ------------------------------------------------------------ Wände
  function buildWall(a, b, openings, tag) {
    const e = edgeInfo(a, b);
    const { len, ux, uz, nx, nz, angle } = e;
    const pt = (s, o = 0) => ({ x: a[0] + ux * s + nx * o, z: a[1] + uz * s + nz * o });

    const pieces = [];
    let cur = 0;
    const sorted = [...openings].sort((p, q) => p.s0 - q.s0);
    for (const o of sorted) {
      if (o.s0 > cur + 0.02) pieces.push({ s0: cur, s1: o.s0, y0: 0, y1: H, kind: 'voll' });
      if (o.type === 'fenster') {
        pieces.push({ s0: o.s0, s1: o.s1, y0: 0, y1: o.bottom, kind: 'brust' });
        pieces.push({ s0: o.s0, s1: o.s1, y0: o.top, y1: H, kind: 'sturz' });
      } else {
        pieces.push({ s0: o.s0, s1: o.s1, y0: o.top, y1: H, kind: 'sturz' });
      }
      cur = o.s1;
    }
    if (cur < len - 0.02) pieces.push({ s0: cur, s1: len, y0: 0, y1: H, kind: 'voll' });

    pieces.forEach((pc, i) => {
      const l = pc.s1 - pc.s0;
      if (l < 0.03) return;
      const mid = (pc.s0 + pc.s1) / 2;
      const h = pc.y1 - pc.y0;
      const y = (pc.y0 + pc.y1) / 2;
      const p = pt(mid, -T / 2);                 // Mauerwerk liegt außerhalb, Innenfläche auf der Kante
      box(l, h, T, wallMat, p.x, y, p.z, `wand_${tag}_${i}`, angle);
      col(`COL_wand_${tag}_${i}`, l, h, T, p.x, y, p.z, angle);

      if (pc.y0 < 0.01) {
        const s = pt(mid, 0.025);
        box(l, 0.15, 0.05, copper, s.x, 0.075, s.z, `sockel_${tag}_${i}`, angle);
      }
      if (pc.y1 > H - 0.01) {
        const s = pt(mid, 0.03);
        box(l, 0.1, 0.06, copper, s.x, H - 0.05, s.z, `gesims_${tag}_${i}`, angle);
      }
      if (pc.kind === 'voll') {
        const n = Math.max(1, Math.round(l / 1.2));
        const fw = l / n;
        for (let k = 0; k < n; k++) {
          const fs = pc.s0 + (k + 0.5) * fw;
          if (k % 2 === 0) {
            const p1 = pt(fs, 0.032), p2 = pt(fs, 0.012);
            panelData.push({ x: p1.x, y: 1.62, z: p1.z, rot: angle });
            frameData.push({ x: p2.x, y: 1.62, z: p2.z, rot: angle });
          } else {
            for (let q = 0; q < 4; q++) {
              const sp = pt(fs, 0.035);
              slotData.push({ x: sp.x, y: 0.98 + q * 0.45, z: sp.z, rot: angle });
            }
          }
        }
      }
    });
    return e;
  }

  // Untere Wand (A→B): Haupteingang rechts, 2,4 × 3,0 m, rechts 1,2 m geschlossene Wand
  buildWall(A, B, [{ s0: mainDoorS0, s1: mainDoorS1, bottom: 0, top: DOOR_H, type: 'tuer' }], 'unten');

  // Untere rechte Schrägwand (B→C): massiv
  const edgeBC = buildWall(B, C, [], 'schraege_unten');

  // Obere Wand (D→E): leicht ansteigend
  const edgeDE = buildWall(D, E, [], 'oben');

  // Linke Wand (E→A): drei hohe rechteckige Buntglasfelder
  const edgeEA = edgeInfo(E, A);
  const winLen = edgeEA.len;
  const windows = [
    { s0: winLen * 0.05, s1: winLen * 0.30 },
    { s0: winLen * 0.35, s1: winLen * 0.60 },
    { s0: winLen * 0.65, s1: winLen * 0.90 },
  ];
  const WIN_SILL = 0.85, WIN_TOP = 3.0;
  buildWall(E, A, windows.map(w => ({ ...w, bottom: WIN_SILL, top: WIN_TOP, type: 'fenster' })), 'links');

  // Fensterdetails (links): rechteckiges Buntglas, Bronzepfosten, Sprossen, Fensterbank
  {
    const e = edgeEA;
    const pt = (s, o = 0) => ({ x: e.a[0] + e.ux * s + e.nx * o, z: e.a[1] + e.uz * s + e.nz * o });
    for (const w of windows) {
      const l = w.s1 - w.s0, mid = (w.s0 + w.s1) / 2;
      const h = WIN_TOP - WIN_SILL;
      const gc = pt(mid, -0.02);
      box(l - 0.06, h - 0.04, 0.05, stainedMat, gc.x, (WIN_SILL + WIN_TOP) / 2, gc.z, 'fenster_buntglas', e.angle);
      for (const s of [w.s0, w.s1]) {
        const p = pt(s, 0.02);
        box(0.09, h + 0.12, 0.16, copper, p.x, (WIN_SILL + WIN_TOP) / 2, p.z, 'fenster_pfosten', e.angle);
      }
      for (const y of [WIN_SILL, WIN_TOP]) {
        const p = pt(mid, 0.02);
        box(l + 0.1, 0.09, 0.16, copper, p.x, y, p.z, 'fenster_rahmen', e.angle);
      }
      const pm = pt(mid, 0.015);
      box(0.05, h, 0.12, copper, pm.x, (WIN_SILL + WIN_TOP) / 2, pm.z, 'fenster_sprosse', e.angle);
      const ps = pt(mid, 0.17);
      box(l + 0.24, 0.1, 0.34, wallDark, ps.x, WIN_SILL - 0.05, ps.z, 'fensterbank', e.angle);
    }
    for (const s of [0.05, 1.95, 3.75, 5.55].map(v => v * (winLen / 6.0))) {
      const p = pt(s, 0.03);
      for (let q = 0; q < 4; q++) slotData.push({ x: p.x, y: 1.0 + q * 0.45, z: p.z, rot: e.angle });
    }
  }

  // ------------------------------------------------------------ Verglaste Schrägwand zum Kontrollraum (C→D)
  const edgeCD = edgeInfo(C, D);
  let glassInfo = null;
  {
    const e = edgeCD;
    const pt = (s, o = 0) => ({ x: e.a[0] + e.ux * s + e.nx * o, z: e.a[1] + e.uz * s + e.nz * o });
    const leaf = 1.2;
    const s0 = (e.len - DOOR_W) / 2;
    const s1 = s0 + DOOR_W;
    glassInfo = { e, s0, s1, pt };

    // Bronzepfosten der Glaswand
    for (const s of [0, s0, s1, e.len]) {
      const p = pt(s, 0);
      box(0.14, H, 0.18, copper, p.x, H / 2, p.z, 'glaswand_pfosten', e.angle);
    }
    // Kopf- und Fußriegel
    const ph = pt(e.len / 2, 0);
    box(e.len, 0.14, 0.16, copper, ph.x, H - 0.07, ph.z, 'glaswand_kopfriegel', e.angle);
    box(e.len, 0.1, 0.16, copper, ph.x, 0.05, ph.z, 'glaswand_fussriegel', e.angle);

    // Feste Glasfelder links und rechts der Öffnung
    const flanks = [[0, s0], [s1, e.len]];
    flanks.forEach((f, i) => {
      const l = f[1] - f[0], mid = (f[0] + f[1]) / 2;
      const p = pt(mid, 0);
      box(l - 0.08, H - 0.24, 0.05, glassKit, p.x, H / 2, p.z, `glaswand_feld_${i + 1}`, e.angle);
      col(`COL_glaswand_${i + 1}`, l, H, 0.14, p.x, H / 2, p.z, e.angle);

      // Eigene Glas-Schiebetürflügel (KIT_glass), in die festen Felder geparkt
      const lc = Math.min(leaf, l - 0.02);
      const c = pt(f[0] + lc / 2, -0.09);
      box(lc, DOOR_H - 0.08, 0.04, glassKit, c.x, DOOR_H / 2, c.z, `schiebetuer_fluegel_${i + 1}`, e.angle);
      box(lc, 0.07, 0.07, copper, c.x, DOOR_H - 0.04, c.z, `schiebetuer_blatt_oben_${i + 1}`, e.angle);
      box(lc, 0.07, 0.07, copper, c.x, 0.04, c.z, `schiebetuer_blatt_unten_${i + 1}`, e.angle);
      for (const s of [f[0] + 0.035, f[0] + lc - 0.035]) {
        const ep = pt(s, -0.09);
        box(0.07, DOOR_H, 0.07, copper, ep.x, DOOR_H / 2, ep.z, `schiebetuer_blatt_stiel_${i + 1}`, e.angle);
      }
      const gp = pt(i === 0 ? f[0] + lc - 0.12 : f[0] + 0.12, -0.14);
      box(0.06, 0.85, 0.06, copper, gp.x, 1.35, gp.z, `schiebetuer_griff_${i + 1}`, e.angle);
    });

    // Türsturz, Lauftrack, Schwelle und Glasoberlicht über der Öffnung
    const pTop = pt((s0 + s1) / 2, 0);
    box(DOOR_W + 0.2, 0.2, 0.2, copper, pTop.x, DOOR_H + 0.1, pTop.z, 'glastuer_sturz', e.angle);
    box(DOOR_W + 0.4, 0.08, 0.12, copper, pTop.x, DOOR_H + 0.22, pTop.z, 'glastuer_lauftrack', e.angle);
    box(DOOR_W, 0.03, 0.3, copper, pTop.x, 0.015, pTop.z, 'glastuer_schwelle', e.angle);
    const transH = H - 0.14 - DOOR_H;
    box(DOOR_W - 0.1, transH, 0.05, glassKit, pTop.x, DOOR_H + transH / 2, pTop.z, 'glastuer_oberlicht', e.angle);
    box(DOOR_W, 0.09, 0.16, copper, pTop.x, DOOR_H + 0.06, pTop.z, 'glastuer_oberlicht_riegel', e.angle);
  }

  // ------------------------------------------------------------ Polygone Wandfelder (eckig, 30°-Facetten – keine Rundbögen)
  function polyFrame(px, pz, angle, w, h, chamfer, name) {
    const outer = new THREE.Shape();
    outer.moveTo(-w / 2, 0); outer.lineTo(w / 2, 0); outer.lineTo(w / 2, h - chamfer);
    outer.lineTo(w / 2 - chamfer, h); outer.lineTo(-w / 2 + chamfer, h);
    outer.lineTo(-w / 2, h - chamfer); outer.closePath();
    const hole = new THREE.Path();
    const iw = w - 0.16, ih = h - 0.16, ic = chamfer - 0.08;
    hole.moveTo(-iw / 2, 0.08); hole.lineTo(iw / 2, 0.08); hole.lineTo(iw / 2, ih - ic);
    hole.lineTo(iw / 2 - ic, ih); hole.lineTo(-iw / 2 + ic, ih);
    hole.lineTo(-iw / 2, ih - ic); hole.closePath();
    outer.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false });
    const m = new THREE.Mesh(geo, copper);
    m.position.set(px, 0.95, pz);
    m.rotation.y = angle;
    m.name = name;
    root.add(m);
  }
  {
    // obere Wand (D→E)
    const e = edgeDE;
    const pt = (s, o = 0) => ({ x: e.a[0] + e.ux * s + e.nx * o, z: e.a[1] + e.uz * s + e.nz * o });
    for (const s of [1.25, 3.35]) {
      const p = pt(s, 0.005);
      polyFrame(p.x, p.z, e.angle, 1.35, 2.0, 0.34, 'wandfeld_polygon_oben');
    }
    // untere rechte Schrägwand (B→C)
    const e2 = edgeBC;
    const pt2 = (s, o = 0) => ({ x: e2.a[0] + e2.ux * s + e2.nx * o, z: e2.a[1] + e2.uz * s + e2.nz * o });
    const p2 = pt2(1.45, 0.005);
    polyFrame(p2.x, p2.z, e2.angle, 1.25, 1.95, 0.32, 'wandfeld_polygon_schraege');
  }

  // ------------------------------------------------------------ Paneele, Rahmen, Lichtschlitze
  instanced(new THREE.BoxGeometry(0.95, 2.4, 0.04), wallDark, panelData, 'wandpaneele');
  instanced(new THREE.BoxGeometry(1.05, 2.56, 0.06), copper, frameData, 'paneel_rahmen');
  const slotMesh = instanced(new THREE.BoxGeometry(0.035, 0.3, 0.05), slotMat, slotData, 'lichtschlitze');

  // ------------------------------------------------------------ Schlanke, leicht geneigte Pfeiler
  const pillars = [
    { x: -3.45, z: -2.55, tilt: 0.045 },
    { x: -3.45, z: 1.75, tilt: -0.045 },
    { x: 1.50, z: -2.70, tilt: 0.04 },
  ];
  pillars.forEach((p, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.15, 0.30), pillarMat);
    m.position.set(p.x, 1.575, p.z);
    m.rotation.z = p.tilt;
    m.name = `saeule_${i + 1}`;
    root.add(m);
    col(`COL_saeule_${i + 1}`, 0.34, 3.15, 0.42, p.x, 1.575, p.z);
    box(0.4, 0.13, 0.48, copper, p.x, 0.065, p.z, `saeule_basis_${i + 1}`);
    box(0.36, 0.11, 0.44, copper, p.x, 3.1, p.z, `saeule_kapitell_${i + 1}`);
  });

  // ------------------------------------------------------------ Deckenfelder (flache Gewölbekassette)
  const cofferPos = [
    { x: -2.5, z: -2.4 }, { x: -0.3, z: -2.4 }, { x: 1.9, z: -2.4 },
    { x: -2.5, z: -0.6 }, { x: -0.3, z: -0.6 }, { x: 1.9, z: -0.6 },
    { x: -2.5, z: 1.2 }, { x: -0.3, z: 1.2 }, { x: 1.7, z: 1.2 },
    { x: -1.1, z: 2.4 }, { x: 0.7, z: 2.4 },
  ];
  instanced(new THREE.BoxGeometry(1.40, 0.05, 1.40), copper,
    cofferPos.map(c => ({ x: c.x, y: 3.475, z: c.z })), 'decke_feldrahmen');
  instanced(new THREE.BoxGeometry(1.28, 0.02, 1.28), cofferMat,
    cofferPos.map(c => ({ x: c.x, y: 3.45, z: c.z })), 'decke_felder');
  instanced(new THREE.BoxGeometry(0.88, 0.02, 0.88), bandMat,
    cofferPos.map(c => ({ x: c.x, y: 3.435, z: c.z })), 'decke_feldlicht');

  // Umlaufendes Deckenlichtband entlang der Kontur
  const bandList = [];
  for (const e of EDGES) {
    const n = Math.max(1, Math.round(e.len / 1.2));
    const seg = e.len / n;
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) * seg;
      bandList.push({
        x: e.a[0] + e.ux * s + e.nx * 0.16, y: 3.48,
        z: e.a[1] + e.uz * s + e.nz * 0.16, rot: e.angle, sx: seg * 0.94,
      });
    }
  }
  const bandMesh = instanced(new THREE.BoxGeometry(1, 0.04, 0.1), bandMat, bandList, 'decke_lichtband');

  // ------------------------------------------------------------ Schneeflocken-Intarsie im Boden (freie Fläche links der Mitte)
  {
    const ix = -2.1, iz = 1.5;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 24), inlayMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ix, 0.007, iz);
    ring.name = 'boden_intarsie_ring';
    root.add(ring);
    const arms = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      arms.push({ x: ix + Math.cos(a) * 0.37, y: 0.008, z: iz + Math.sin(a) * 0.37, rot: -a });
    }
    instanced(new THREE.BoxGeometry(0.74, 0.01, 0.05), inlayMat, arms, 'boden_intarsie_strahlen');
    const cross = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      cross.push({ x: ix + Math.cos(a) * 0.54, y: 0.008, z: iz + Math.sin(a) * 0.54, rot: -a + Math.PI / 2 });
    }
    instanced(new THREE.BoxGeometry(0.34, 0.01, 0.045), inlayMat, cross, 'boden_intarsie_aeste');
  }

  // ------------------------------------------------------------ Haupttür: Zarge (3,34 × 3,74 m) in der Wandmitte
  const mainDoorMid = (mainDoorS0 + mainDoorS1) / 2;
  const mainDoorX = A[0] + mainDoorMid;
  const mainDoorZ = A[1] - T / 2;
  {
    const zc = mainDoorZ;
    for (const dx of [-(DOOR_W / 2 + 0.235), (DOOR_W / 2 + 0.235)]) {
      box(0.47, 3.74, T, copper, mainDoorX + dx, 1.87, zc, 'tuer_zarge_seite');
    }
    box(3.34, 0.74, T, copper, mainDoorX, 3.37, zc, 'tuer_zarge_oben');
    box(3.34, 0.03, 0.34, copper, mainDoorX, 0.015, zc, 'tuer_schwelle');
    // Türpaneel-Blende (fest eingebaute Architektur neben der Öffnung)
    const px = mainDoorX - DOOR_W / 2 - 0.235 - 0.42;
    box(0.34, 1.0, 0.08, wallDark, px, 1.25, zc + T / 2 - 0.02, 'tuerpaneel_blende');
    for (let k = 0; k < 3; k++) {
      box(0.2, 0.1, 0.03, glowKit, px, 1.05 + k * 0.2, zc + T / 2 + 0.03, 'tuerpaneel_leuchte');
    }
  }

  // ------------------------------------------------------------ Anschlüsse, Objektplätze
  empty('DOOR_haupt', mainDoorX, 0, mainDoorZ, Math.PI,
    { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor Etage 6 / Zugang zum Leitungsbüro' });
  {
    const g = glassInfo;
    const p = g.pt((g.s0 + g.s1) / 2, 0);
    const outX = -g.e.nx, outZ = -g.e.nz;
    empty('DOOR_kontroll', p.x, 0, p.z, Math.atan2(outX, outZ),
      { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Kontrollraum (Glas-Schiebetür)' });
  }
  // Antike Schiebetür in der Hauptöffnung (Wandmitte, +Z in den Raum)
  empty('PLACE_OBJ-091', mainDoorX, 0, mainDoorZ, 0);

  // Schreibtisch der Expeditionsleitung (1,82 B × 1,35 H × 2,55 T), Front zur Glaswand
  const deskPos = { x: -0.15, z: 0.05 };
  const doorPos = glassInfo.pt((glassInfo.s0 + glassInfo.s1) / 2, 0);
  const deskRot = Math.atan2(doorPos.x - deskPos.x, doorPos.z - deskPos.z);
  empty('PLACE_OBJ-013', deskPos.x, 0, deskPos.z, deskRot);

  // Antike Daten-Pads auf der Schreibtischplatte (Unterseite bei y = 1,35)
  const padOffsets = [
    { lx: 0.42, lz: -0.55, rot: 0.16 },
    { lx: -0.34, lz: 0.48, rot: -0.24 },
  ];
  padOffsets.forEach((p, i) => {
    const wx = deskPos.x + p.lx * Math.cos(deskRot) + p.lz * Math.sin(deskRot);
    const wz = deskPos.z - p.lx * Math.sin(deskRot) + p.lz * Math.cos(deskRot);
    empty(i === 0 ? 'PLACE_OBJ-056' : 'PLACE_OBJ-056_2', wx, 1.35, wz, deskRot + p.rot);
  });

  // ------------------------------------------------------------ Lampen
  empty('LAMP_1', -0.4, 3.2, 0.2, 0, { color: '#9fe0d8', intensity: 9, distance: 10 });
  empty('LAMP_2', 0.6, 3.2, -2.1, 0, { color: '#9fe0d8', intensity: 8, distance: 9 });
  empty('LAMP_3', 0.2, 3.2, 2.2, 0, { color: '#bfe9ff', intensity: 8, distance: 9 });
  empty('LAMP_4', -3.2, 2.4, -0.6, 0, { color: '#9fe0d8', intensity: 7, distance: 8 });
  empty('LAMP_5', 2.9, 2.4, 1.4, 0, { color: '#9fe0d8', intensity: 7, distance: 8 });
  empty('LAMP_6', -1.0, 2.4, -2.8, 0, { color: '#bfe9ff', intensity: 6, distance: 7 });

  // ------------------------------------------------------------ Kollision Boden/Decke (Rasterzellen innerhalb des Fünfecks)
  let cellIndex = 0;
  for (let x0 = minX; x0 < maxX - 0.05; x0 += 1.2) {
    for (let z0 = minZ; z0 < maxZ - 0.05; z0 += 1.2) {
      const x1 = x0 + 1.2, z1 = z0 + 1.2;
      if (!pointInPoly(x0, z0) || !pointInPoly(x1, z0) || !pointInPoly(x0, z1) || !pointInPoly(x1, z1)) continue;
      cellIndex++;
      col(`COL_boden_${cellIndex}`, 1.2, 0.2, 1.2, x0 + 0.6, -0.1, z0 + 0.6);
      col(`COL_decke_${cellIndex}`, 1.2, 0.3, 1.2, x0 + 0.6, H + 0.15, z0 + 0.6);
    }
  }

  // ------------------------------------------------------------ Animation
  let t = 0, last = null;
  const animieren = () => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    slotMat.emissiveIntensity = 1.65 + Math.sin(t * 0.9) * 0.16;
    bandMat.emissiveIntensity = 1.25 + Math.sin(t * 0.9 + 1.1) * 0.13;
    cofferMat.emissiveIntensity = 0.35 + Math.sin(t * 0.9 + 0.6) * 0.08;
  };
  root.onBeforeRender = animieren;
  if (slotMesh) slotMesh.onBeforeRender = animieren;
  if (bandMesh) bandMesh.onBeforeRender = animieren;

  root.userData.raum = {
    id: 'ATL-005',
    name: 'Büro Dr. Elizabeth Weir',
    flaeche: 44.7,
    hoehe: H,
    etage: 6,
    bereich: 'Control Tower',
    form: 'fuenfeck',
  };
  return root;
}

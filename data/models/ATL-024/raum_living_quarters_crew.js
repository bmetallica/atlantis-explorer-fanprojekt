// Raum ATL-024: Crew-Quartiere / Wohnbereich (Inner City, Etage 4)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Haupteingang an der Seite −Z. Leere Hülle: nur Architektur, feste Einbauten und Objektplätze.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_living_quarters_crew',
  art: 'Raum',
  masse: 'ca. 9,6 × 6,4 m (≈57 m² Wohnfläche) + privater Balkon 7,2 × 2,4 m, Raumhöhe 4,5 m, Sanitärbereich 2,1 × 4,6 m',
  wohin: 'Crew-Quartiere der Expedition, Inner City, Etage 4',
  benutzen: 'Privates Wohnquartier: Schlafnische, offener Sanitärbereich mit Becken, privater Balkon, Teeservice-Nische',
  lichter: '9 Wandleuchten (Objektplätze), 6 LAMP_-Punkte (eisblau/teal), eingebaute Lichtleisten an den Oktagonkanten, Deckenlichtfeld',
  animation: 'Lichtleisten, Deckenlichtfeld und Teal-Akzent atmen langsam und dezent',
  quelle: 'selbst gebaut nach Crew-Quartier-Screencaps (Staffel 4/5, Badestruktur ref3) und Atlantis-Setplänen „Halls & Corridors“',
};

const H = 4.5;    // Raumhöhe
const T = 0.3;    // Wanddicke
const PT = 0.2;   // Trennwanddicke (Sanitärbereich)

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_living_quarters_crew';

  const mWall = kit('wall');
  const mWallDark = kit('wallDark');
  const mCopper = kit('copper');
  const mPillar = kit('pillar');
  const mFloor = kit('floor');
  const mCeil = kit('ceiling');
  const mRail = kit('rail');
  const mGlass = kit('glass');
  const mGlow = kit('glow');
  const mAmber = kit('amberGlow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.8,
  });
  const tealMat = new THREE.MeshStandardMaterial({
    name: 'akzent_teal', color: 0x1d4b52, emissive: 0x3fb8c8, emissiveIntensity: 0.75,
    metalness: 0.35, roughness: 0.4,
  });
  const amberMat = new THREE.MeshStandardMaterial({
    name: 'akzent_bernstein', color: 0x8a5a2a, emissive: 0xffb35c, emissiveIntensity: 0.55,
    metalness: 0.4, roughness: 0.45,
  });

  // Buntglas-Textur (schneeflockenartiges, geometrisches Muster) – Canvas
  const makeBuntglas = () => {
    if (typeof document === 'undefined') return kit('glass');
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0b2533'; g.fillRect(0, 0, 256, 256);
    const cols = ['#f2b23a', '#df7a3a', '#2fb9a8', '#4a8fd6', '#8fc9a2'];
    for (let i = 0; i < 14; i++) {
      g.fillStyle = cols[i % cols.length];
      g.globalAlpha = 0.55;
      const x = (i % 4) * 64, y = Math.floor(i / 4) * 64;
      if (i % 3 === 0) { g.beginPath(); g.moveTo(x + 32, y + 6); g.lineTo(x + 58, y + 32); g.lineTo(x + 32, y + 58); g.lineTo(x + 6, y + 32); g.closePath(); g.fill(); }
      else g.fillRect(x + 5, y + 5, 54, 54);
    }
    g.globalAlpha = 1;
    g.strokeStyle = '#eaf7ff'; g.lineWidth = 5; g.lineCap = 'square';
    g.beginPath(); g.moveTo(128, 34); g.lineTo(128, 222); g.moveTo(42, 128); g.lineTo(214, 128); g.stroke();
    g.lineWidth = 3;
    for (const a of [0, Math.PI / 2]) {
      for (const s of [-1, 1]) {
        for (const d of [0.22, 0.34]) {
          const bx = 128 + Math.cos(a) * s * 256 * d * 0.5;
          const by = 128 + Math.sin(a) * s * 256 * d * 0.5;
          g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a + 0.9) * 26, by + Math.sin(a + 0.9) * 26);
          g.moveTo(bx, by); g.lineTo(bx + Math.cos(a - 0.9) * 26, by + Math.sin(a - 0.9) * 26); g.stroke();
        }
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      name: 'buntglas', map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.7,
      metalness: 0.1, roughness: 0.28,
    });
  };
  const mBunt = makeBuntglas();

  // ---------------------------------------------------------------- Grundriss (Oktagon, 30°/60°-Geometrie)
  const P = [
    [-3.4, -3.2], [3.4, -3.2], [4.8, -1.8], [4.8, 1.8],
    [3.4, 3.2], [-3.4, 3.2], [-4.8, 1.8], [-4.8, -1.8],
  ];
  const N = P.length;
  const segs = [];
  for (let i = 0; i < N; i++) {
    const A = P[i], B = P[(i + 1) % N];
    const dx = B[0] - A[0], dz = B[1] - A[1];
    const len = Math.hypot(dx, dz);
    const dir = [dx / len, dz / len];
    let n = [-dir[1], dir[0]];
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    if (n[0] * -mid[0] + n[1] * -mid[1] < 0) n = [-n[0], -n[1]];
    segs.push({ i, A, B, len, dir, n, rotY: Math.atan2(n[0], n[1]) });
  }
  const pt = (seg, u, y, off = 0) => new THREE.Vector3(
    seg.A[0] + seg.dir[0] * u + seg.n[0] * off,
    y,
    seg.A[1] + seg.dir[1] * u + seg.n[1] * off,
  );

  // Öffnungen in den Außenwänden (u entlang der Wand)
  const OPEN = {
    0: [{ u0: 2.2, u1: 4.6, y0: 0, y1: 3.0, type: 'door' }],                                  // Haupteingang (−Z)
    1: [{ u0: 1.0, u1: 2.8, y0: 1.1, y1: 3.2, type: 'window', bunt: true }],                 // Buntglasfenster (diagonal)
    2: [{ u0: 0.6, u1: 2.8, y0: 1.4, y1: 3.4, type: 'window' }],                              // Sanitärfenster
    4: [{ u0: 2.2, u1: 4.6, y0: 0, y1: 3.0, type: 'door' }],                                  // Balkontür (+Z)
    7: [{ u0: 1.0, u1: 2.8, y0: 1.1, y1: 3.2, type: 'window' }],                              // Fenster (diagonal)
  };
  // Waffennische als eingelassene Wandnische (protruding alcove, kein Wanddurchbruch)
  const NICHES = { 0: [{ u0: 5.55, u1: 6.35, y0: 0.9, y1: 1.75, depth: 0.5 }] };

  // ---------------------------------------------------------------- Helfer
  const box = (w, h, d, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = rotY; if (name) m.name = name;
    root.add(m); return m;
  };
  const addCol = (name, w, h, d, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name; m.position.set(x, y, z); m.rotation.y = rotY; m.visible = false;
    root.add(m); return m;
  };
  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z);
    o.rotation.y = rotY; if (userData) o.userData = userData; root.add(o); return o;
  };
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    const d = new THREE.Object3D();
    list.forEach((it, i) => {
      d.position.set(it.x, it.y, it.z);
      d.rotation.set(it.rx || 0, it.r || 0, it.rz || 0);
      d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    });
    im.count = list.length; im.name = name; root.add(im); return im;
  };
  const polyShape = (pts, reverse = false) => {
    const s = new THREE.Shape();
    const q = reverse ? pts.slice().reverse() : pts;
    q.forEach((p, i) => { if (i === 0) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]); });
    s.closePath(); return s;
  };

  // ---------------------------------------------------------------- Boden
  const floorGeo = new THREE.ExtrudeGeometry(polyShape(P), { depth: 0.2, bevelEnabled: false });
  floorGeo.rotateX(Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, mFloor);
  floor.name = 'boden'; root.add(floor);

  const ringShape = polyShape(P);
  ringShape.holes.push(polyShape(P.map((p) => [p[0] * 0.93, p[1] * 0.93]), true));
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.02, bevelEnabled: false });
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, patina);
  ring.name = 'boden_rand'; ring.position.y = 0.015; root.add(ring);

  // Bodenintarsie: hexagonale Schneeflocke (rund nur als Intarsie erlaubt)
  const inlay = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.014, 6), mCopper);
  inlay.name = 'boden_intarsie'; inlay.position.y = 0.008; inlay.rotation.y = Math.PI / 6; root.add(inlay);
  const inlayCore = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.016, 6), mWallDark);
  inlayCore.name = 'boden_intarsie_kern'; inlayCore.position.y = 0.010; inlayCore.rotation.y = Math.PI / 6; root.add(inlayCore);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    box(0.05, 0.016, 2.4, mCopper, Math.sin(a) * 2.55, 0.008, Math.cos(a) * 2.55, 'boden_intarsie_strahl', a);
  }

  // ---------------------------------------------------------------- Wände
  const panelGeo = new THREE.BoxGeometry(1.0, 2.6, 0.035);
  const frameGeo = new THREE.BoxGeometry(1.14, 2.76, 0.05);
  const slotGeo = new THREE.BoxGeometry(0.06, 0.28, 0.03);
  const panels = [], frames = [], slots = [], baseboards = [], snow = [];

  for (const seg of segs) {
    const ops = (OPEN[seg.i] || []).slice().sort((a, b) => a.u0 - b.u0);
    const pieces = [];
    let cursor = 0;
    for (const op of ops) {
      if (op.u0 > cursor + 0.001) pieces.push({ u0: cursor, u1: op.u0, y0: 0, y1: H });
      if (op.y0 > 0.001) pieces.push({ u0: op.u0, u1: op.u1, y0: 0, y1: op.y0 });
      if (op.y1 < H - 0.001) pieces.push({ u0: op.u0, u1: op.u1, y0: op.y1, y1: H });
      cursor = op.u1;
    }
    if (cursor < seg.len - 0.001) pieces.push({ u0: cursor, u1: seg.len, y0: 0, y1: H });

    pieces.forEach((pc, k) => {
      const w = pc.u1 - pc.u0, h = pc.y1 - pc.y0;
      const midU = (pc.u0 + pc.u1) / 2, midY = (pc.y0 + pc.y1) / 2;
      const p = pt(seg, midU, midY, -T / 2);
      box(w, h, T, mWall, p.x, p.y, p.z, `wand_${seg.i}_${k}`, seg.rotY);
      addCol(`COL_wand_${seg.i}_${k}`, w, h, T, p.x, p.y, p.z, seg.rotY);
      if (pc.y0 === 0 && h > 0.6) {
        const b = pt(seg, midU, 0.075, 0.025);
        baseboards.push({ x: b.x, y: b.y, z: b.z, r: seg.rotY });
      }
    });

    // Zierpaneele, Lichtschlitze, Schneeflocken-Ornament
    const blocked = (u) => ops.some((op) => {
      const m = op.type === 'door' ? 1.2 : 0.22;
      return u > op.u0 - m - 0.12 && u < op.u1 + m + 0.12;
    });
    let idx = 0;
    for (let u = 0.7; u < seg.len - 0.4; u += 1.2) {
      if (blocked(u)) continue;
      idx++;
      const p = pt(seg, u, 1.55, 0.028);
      panels.push({ x: p.x, y: p.y, z: p.z, r: seg.rotY });
      const f = pt(seg, u, 1.55, 0.010);
      frames.push({ x: f.x, y: f.y, z: f.z, r: seg.rotY });
      if (idx % 2 === 0) {
        for (let k = 0; k < 4; k++) {
          const s = pt(seg, u, 1.0 + k * 0.35, 0.020);
          slots.push({ x: s.x, y: s.y, z: s.z, r: seg.rotY });
        }
      }
      // Schneeflocken-Zierornament auf den diagonalen Wänden
      if ([1, 3, 5, 7].includes(seg.i) && idx % 2 === 1) {
        const c = pt(seg, u, 2.05, 0.045);
        for (let a = 0; a < 3; a++) {
          snow.push({ x: c.x, y: c.y, z: c.z, r: seg.rotY, rz: (a * Math.PI) / 3 });
        }
        for (let a = 0; a < 3; a++) {
          for (const sgn of [-1, 1]) {
            const ang = (a * Math.PI) / 3;
            const dxl = seg.dir[0] * Math.cos(ang) * 0.3;
            const dzl = seg.dir[1] * Math.cos(ang) * 0.3;
            snow.push({
              x: c.x + dxl * sgn, y: c.y + Math.sin(ang) * 0.3 * sgn, z: c.z + dzl * sgn,
              r: seg.rotY, rz: ang, tip: 1,
            });
          }
        }
      }
    }

    // Rahmen für Türen und Fenster
    for (const op of ops) {
      const w = op.u1 - op.u0;
      if (op.type === 'door') {
        for (const u of [op.u0 + 0.06, op.u1 - 0.06]) {
          const p = pt(seg, u, 1.5, 0.03);
          box(0.12, 3.0, 0.08, mCopper, p.x, p.y, p.z, 'tuer_einfassung', seg.rotY);
        }
        const l = pt(seg, (op.u0 + op.u1) / 2, 3.04, 0.03);
        box(w + 0.24, 0.14, 0.08, mCopper, l.x, l.y, l.z, 'tuer_sturz_einfassung', seg.rotY);
        const th = pt(seg, (op.u0 + op.u1) / 2, 0.012, 0.02);
        box(w, 0.025, 0.34, mCopper, th.x, th.y, th.z, 'tuer_schwelle', seg.rotY);
      } else if (op.type === 'window') {
        const h = op.y1 - op.y0;
        for (const u of [op.u0 + 0.05, op.u1 - 0.05]) {
          const p = pt(seg, u, (op.y0 + op.y1) / 2, 0.03);
          box(0.1, h, 0.08, mCopper, p.x, p.y, p.z, 'fenster_rahmen', seg.rotY);
        }
        for (const y of [op.y0 + 0.05, op.y1 - 0.05]) {
          const p = pt(seg, (op.u0 + op.u1) / 2, y, 0.03);
          box(w, 0.1, 0.08, mCopper, p.x, p.y, p.z, 'fenster_rahmen', seg.rotY);
        }
        const g = pt(seg, (op.u0 + op.u1) / 2, (op.y0 + op.y1) / 2, -0.04);
        box(w - 0.12, h - 0.12, 0.04, op.bunt ? mBunt : mGlass, g.x, g.y, g.z, 'fenster_glas', seg.rotY);
        const mull = pt(seg, (op.u0 + op.u1) / 2, (op.y0 + op.y1) / 2, 0.0);
        box(0.06, h - 0.12, 0.06, mCopper, mull.x, mull.y, mull.z, 'fenster_sprosse', seg.rotY);
        const sill = pt(seg, (op.u0 + op.u1) / 2, op.y0 - 0.05, 0.09);
        box(w + 0.2, 0.1, 0.22, mCopper, sill.x, sill.y, sill.z, 'fenster_sims', seg.rotY);
      }
    }

    // Eingelassene Nische (protruding alcove)
    for (const ni of (NICHES[seg.i] || [])) {
      const w = ni.u1 - ni.u0, hh = ni.y1 - ni.y0, d = ni.depth;
      const back = pt(seg, (ni.u0 + ni.u1) / 2, (ni.y0 + ni.y1) / 2, d);
      box(w, hh, 0.08, mWallDark, back.x, back.y, back.z, 'nische_rueckwand', seg.rotY);
      for (const u of [ni.u0, ni.u1]) {
        const p = pt(seg, u, (ni.y0 + ni.y1) / 2, d / 2);
        box(0.08, hh, d, mWallDark, p.x, p.y, p.z, 'nische_seitenwand', seg.rotY);
      }
      const shelf = pt(seg, (ni.u0 + ni.u1) / 2, ni.y0, d / 2);
      box(w, 0.07, d, mCopper, shelf.x, shelf.y, shelf.z, 'nische_fachboden', seg.rotY);
      const head = pt(seg, (ni.u0 + ni.u1) / 2, ni.y1, d / 2);
      box(w, 0.07, d, mWallDark, head.x, head.y, head.z, 'nische_kopf', seg.rotY);
      const rim = pt(seg, (ni.u0 + ni.u1) / 2, ni.y1 + 0.04, 0.01);
      box(w + 0.08, 0.05, 0.05, mCopper, rim.x, rim.y, rim.z, 'nische_einfassung', seg.rotY);
      const glow = pt(seg, (ni.u0 + ni.u1) / 2, ni.y1 - 0.09, d - 0.06);
      box(w - 0.2, 0.035, 0.05, lightMat, glow.x, glow.y, glow.z, 'nische_licht', seg.rotY);
    }
  }

  // Sockelleisten
  for (const b of baseboards) box(0.05, 0.15, 1, mCopper, b.x, b.y, b.z, 'sockelleiste', b.r);

  inst(frameGeo, mCopper, frames, 'paneel_rahmen');
  inst(panelGeo, mWallDark, panels, 'wandpaneele');
  const slotMesh = inst(slotGeo, lightMat, slots, 'lichtschlitze');

  // Schneeflocken-Ornamente (zweite Instanz: Zweige)
  const snowArmGeo = new THREE.BoxGeometry(0.045, 0.72, 0.028);
  const snowTipGeo = new THREE.BoxGeometry(0.05, 0.16, 0.028);
  const snowArms = snow.filter((s) => !s.tip), snowTips = snow.filter((s) => s.tip);
  inst(snowArmGeo, mCopper, snowArms, 'schneeflocke_zweige');
  inst(snowTipGeo, mCopper, snowTips, 'schneeflocke_spitzen');

  // Eck-Lichtleisten (blaugrün) an den acht Oktagonkanten
  const cornerStrips = [];
  for (let v = 0; v < N; v++) {
    const prev = segs[(v - 1 + N) % N], next = segs[v];
    const nx = (prev.n[0] + next.n[0]) / 2, nz = (prev.n[1] + next.n[1]) / 2;
    const nl = Math.hypot(nx, nz);
    const ux = nx / nl, uz = nz / nl;
    cornerStrips.push({
      x: P[v][0] + ux * 0.13, y: 2.0, z: P[v][1] + uz * 0.13,
      r: Math.atan2(ux, uz),
    });
  }
  inst(new THREE.BoxGeometry(0.07, 2.9, 0.05), tealMat, cornerStrips, 'eck_leuchtstreifen');

  // ---------------------------------------------------------------- Decken
  const ceilGeo = new THREE.ExtrudeGeometry(polyShape(P), { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(Math.PI / 2);
  const ceil = new THREE.Mesh(ceilGeo, mCeil);
  ceil.name = 'decke_hauptschale'; ceil.position.y = H + 0.3; root.add(ceil);

  const fieldGeo = new THREE.ExtrudeGeometry(polyShape(P, 0.74), { depth: 0.06, bevelEnabled: false });
  fieldGeo.rotateX(Math.PI / 2);
  const field = new THREE.Mesh(fieldGeo, mGlow);
  field.name = 'decke_lichtfeld'; field.position.y = H - 0.02; root.add(field);

  const fieldFrameShape = polyShape(P, 0.78);
  fieldFrameShape.holes.push(polyShape(P.map((p) => [p[0] * 0.71, p[1] * 0.71]), true));
  const ffGeo = new THREE.ExtrudeGeometry(fieldFrameShape, { depth: 0.09, bevelEnabled: false });
  ffGeo.rotateX(Math.PI / 2);
  const ff = new THREE.Mesh(ffGeo, mCopper);
  ff.name = 'decke_lichtfeld_rahmen'; ff.position.y = H - 0.01; root.add(ff);

  // ---------------------------------------------------------------- Schlafnische (linke Wand)
  const nicheX = -3.4;
  for (const z of [-1.5, 1.5]) {
    box(0.24, 3.4, 0.24, mPillar, nicheX, 1.7, z, 'schlafnische_pfeiler');
    addCol('COL_schlafnische_pfeiler', 0.24, 3.4, 0.24, nicheX, 1.7, z);
  }
  box(0.24, 0.5, 3.24, mPillar, nicheX, 3.15, 0, 'schlafnische_sturz');
  box(0.06, 0.05, 2.8, lightMat, nicheX + 0.12, 2.86, 0, 'schlafnische_lichtleiste');
  // Rückwand-Paneel der Nische (Schneeflocken-Motiv)
  box(0.06, 2.9, 3.0, mWallDark, -4.76, 1.45, 0, 'schlafnische_rueckpaneel');
  for (const zz of [-0.75, 0, 0.75]) {
    for (let a = 0; a < 3; a++) {
      const ang = (a * Math.PI) / 3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.62, 0.045), mCopper);
      m.position.set(-4.70, 1.95 + Math.sin(ang) * zz * 0.0, zz);
      m.rotation.set(0, Math.PI / 2, ang);
      m.name = 'schlafnische_ornament'; root.add(m);
    }
  }
  // Leselicht (warm) an der Nischenwand
  box(0.05, 0.05, 0.9, amberMat, -4.68, 1.0, 0.85, 'schlafnische_warmlicht');

  // ---------------------------------------------------------------- Sanitärbereich (rechts, offener Trakt)
  const bathX = 2.6;            // Trennwand-Mitte
  const bathSide = 2.4;         // Ausdehnung nach Norden/Süden
  // Trennwand mit Türöffnung 2,4 × 3,0 m, je 1,2 m Wand daneben (Türschieber)
  for (const s of [-1, 1]) {
    const zc = s * 1.8;
    box(PT, 3.4, 1.2, mWallDark, bathX, 1.7, zc, s < 0 ? 'sanitaer_trennwand_sued' : 'sanitaer_trennwand_nord');
    addCol(s < 0 ? 'COL_sanitaer_trennwand_sued' : 'COL_sanitaer_trennwand_nord', PT, 3.4, 1.2, bathX, 1.7, zc);
  }
  box(PT, 0.4, 2.4, mWallDark, bathX, 3.2, 0, 'sanitaer_sturz');
  addCol('COL_sanitaer_sturz', PT, 0.4, 2.4, bathX, 3.2, 0);
  // Seitwände des Sanitärtrakts bis zur Diagonalwand
  for (const s of [-1, 1]) {
    const zc = s * bathSide;
    box(1.7, 3.4, PT, mWallDark, bathX + 0.85, 1.7, zc, s < 0 ? 'sanitaer_seitenwand_sued' : 'sanitaer_seitenwand_nord');
    addCol(s < 0 ? 'COL_sanitaer_seitenwand_sued' : 'COL_sanitaer_seitenwand_nord', 1.7, 3.4, PT, bathX + 0.85, 1.7, zc);
  }
  // Eingebaute Bade-/Duschstruktur (feste Architektur)
  const basinX = 3.85, basinZ = 1.35, bw = 1.4, bd = 1.3;
  box(bw, 0.12, bd, mWallDark, basinX, 0.06, basinZ, 'sanitaer_becken_boden');
  box(bw, 0.55, 0.12, mPillar, basinX, 0.275, basinZ - bd / 2 + 0.06, 'sanitaer_becken_rand_sued');
  box(bw, 0.55, 0.12, mPillar, basinX, 0.275, basinZ + bd / 2 - 0.06, 'sanitaer_becken_rand_nord');
  box(0.12, 0.55, bd, mPillar, basinX - bw / 2 + 0.06, 0.275, basinZ, 'sanitaer_becken_rand_west');
  box(0.12, 0.55, bd, mPillar, basinX + bw / 2 - 0.06, 0.275, basinZ, 'sanitaer_becken_rand_ost');
  box(bw - 0.24, 0.05, bd - 0.24, tealMat, basinX, 0.115, basinZ, 'sanitaer_becken_wasser');
  addCol('COL_sanitaer_becken', bw, 0.6, bd, basinX, 0.3, basinZ);
  // Duschkopf-Leiste an der Wand
  box(0.08, 0.08, 1.6, mCopper, 4.62, 2.35, -1.2, 'sanitaer_duschleiste');
  box(0.05, 0.04, 1.5, lightMat, 4.55, 2.29, -1.2, 'sanitaer_duschlicht');
  // Sanitär-Bodenintarsie
  const bathInlay = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.012, 6), patina);
  bathInlay.name = 'sanitaer_bodenintarsie'; bathInlay.position.set(3.85, 0.006, -0.6); bathInlay.rotation.y = Math.PI / 6; root.add(bathInlay);
  // Abgehängte Decke über dem Sanitärbereich
  box(2.2, 0.2, 4.6, mCeil, bathX + 0.95, 3.5, 0, 'decke_sanitaer');
  addCol('COL_decke_sanitaer', 2.2, 0.2, 4.6, bathX + 0.95, 3.5, 0);
  box(0.06, 0.04, 4.2, tealMat, bathX + 0.2, 3.38, 0, 'decke_sanitaer_leuchtband');
  box(0.06, 0.04, 4.2, tealMat, 4.4, 3.38, 0, 'decke_sanitaer_leuchtband_2');

  // ---------------------------------------------------------------- Privater Balkon (+Z)
  box(7.2, 0.2, 2.4, mFloor, 0, -0.1, 4.7, 'balkon_boden');
  addCol('COL_balkon_boden', 7.2, 0.2, 2.4, 0, -0.1, 4.7);
  box(7.2, 0.2, 2.4, mCeil, 0, 3.3, 4.7, 'decke_balkon');
  addCol('COL_decke_balkon', 7.2, 0.2, 2.4, 0, 3.3, 4.7);
  for (const s of [-1, 1]) {
    box(0.2, 3.3, 2.4, mWall, s * 3.5, 1.65, 4.7, 'balkon_seitenwand');
    addCol('COL_balkon_seitenwand', 0.2, 3.3, 2.4, s * 3.5, 1.65, 4.7);
  }
  box(7.2, 0.09, 0.09, mRail, 0, 1.1, 5.85, 'balkon_gelaender_oberholm');
  box(7.2, 0.06, 0.06, mRail, 0, 0.55, 5.85, 'balkon_gelaender_mittelholm');
  addCol('COL_balkon_gelaender', 7.2, 1.15, 0.12, 0, 0.575, 5.85);
  for (let i = -3; i <= 3; i++) {
    box(0.08, 1.1, 0.08, mRail, i * 1.1, 0.55, 5.85, 'balkon_gelaender_pfosten');
  }
  // Verglaste Geländerfelder
  for (let i = -2; i <= 2; i++) {
    box(0.96, 0.9, 0.04, mGlass, i * 1.1, 0.6, 5.85, 'balkon_gelaender_glas');
  }
  box(0.06, 0.04, 2.2, lightMat, 0, 3.16, 4.7, 'balkon_lichtleiste');

  // ---------------------------------------------------------------- Podest für das Teeservice (Ecknische vorn links)
  const podX = -3.85, podZ = -2.25, podRot = Math.PI / 4;
  box(1.0, 0.45, 0.6, mWallDark, podX, 0.225, podZ, 'podest_teeservice', podRot);
  box(1.06, 0.05, 0.66, mCopper, podX, 0.465, podZ, 'podest_teeservice_kante', podRot);
  addCol('COL_podest_teeservice', 1.0, 0.45, 0.6, podX, 0.225, podZ, podRot);
  box(0.9, 0.04, 0.05, amberMat, podX, 0.5, podZ - 0.3, 'podest_teeservice_leuchte', podRot);

  // ---------------------------------------------------------------- Kollision Boden / Decke (Oktagon angenähert)
  const chamfers = [];
  for (let v = 0; v < N; v++) {
    const prev = segs[(v - 1 + N) % N];
    chamfers.push({ x: P[v][0], z: P[v][1], rotY: Math.atan2(-prev.dir[1], prev.dir[0]) });
  }
  const footprint = (y, h, prefix) => {
    addCol(`${prefix}_mitte`, 6.8, h, 6.4, 0, y, 0);
    for (const s of [-1, 1]) addCol(`${prefix}_seite_${s < 0 ? 'l' : 'r'}`, 1.4, h, 3.6, s * 4.1, y, 0);
    for (const c of chamfers) addCol(`${prefix}_ecke_${c.x.toFixed(1)}_${c.z.toFixed(1)}`, 2.0, h, 2.0, c.x, y, c.z, c.rotY);
  };
  footprint(-0.1, 0.2, 'COL_boden');
  footprint(H + 0.15, 0.3, 'COL_decke');

  // ---------------------------------------------------------------- Türen / Anschlüsse
  const doorMain = pt(segs[0], 3.4, 0, -T / 2);
  const doorBal = pt(segs[4], 3.4, 0, -T / 2);
  empty('DOOR_haupt', 0, 0, -3.2, Math.PI, { breite: 2.4, hoehe: 3, ziel: 'Flur / Korridor', raum: 'ATL-049' });
  empty('DOOR_balkon', 0, 0, 3.2, 0, { breite: 2.4, hoehe: 3, ziel: 'Privater Balkon des Quartiers', raum: 'ATL-024' });
  empty('DOOR_sanitaer', bathX, 0, 0, Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Sanitärbereich des Quartiers', raum: 'ATL-024' });

  // Schiebetüren: Position in der Wandmitte, +Z zeigt in den Raum
  empty('PLACE_OBJ-091', doorMain.x, 0, doorMain.z, segs[0].rotY);
  empty('PLACE_OBJ-091_2', doorBal.x, 0, doorBal.z, segs[4].rotY);
  empty('PLACE_OBJ-091_3', bathX, 0, 0, -Math.PI / 2);

  // ---------------------------------------------------------------- Objektplätze
  // Türsteuerungspaneele (Wandobjekte, Vorderseite in den Raum)
  const p52a = pt(segs[0], 1.35, 1.2, 0.04);
  empty('PLACE_OBJ-052', p52a.x, p52a.y, p52a.z, segs[0].rotY);
  const p52b = pt(segs[4], 5.35, 1.2, 0.04);
  empty('PLACE_OBJ-052_2', p52b.x, p52b.y, p52b.z, segs[4].rotY);
  empty('PLACE_OBJ-052_3', bathX - 0.12, 1.2, 1.8, -Math.PI / 2);

  // Wandleuchten (Wandobjekte, 0,20 × 0,21 × 0,14 m)
  const lampSpots = [
    [0, 0.8], [0, 5.0], [1, 3.3], [2, 3.3], [3, 1.9],
    [4, 0.8], [4, 5.2], [5, 1.9], [7, 3.3],
  ];
  lampSpots.forEach(([si, u], i) => {
    const seg = segs[si];
    const p = pt(seg, u, 2.2, 0.03);
    empty(i === 0 ? 'PLACE_OBJ-053' : `PLACE_OBJ-053_${i + 1}`, p.x, p.y, p.z, seg.rotY);
  });

  // Atmosphärenregler (Wandobjekt, Rückseite an der Trennwand, Fußpunkt am Boden)
  empty('PLACE_OBJ-054', bathX - 0.18, 0, -1.8, -Math.PI / 2);

  // Schall-Reinigungsdusche (Standobjekt im Sanitärbereich, Front zum Raum)
  empty('PLACE_OBJ-058', 4.05, 0, -1.25, -Math.PI / 2);

  // Partikelstrahlwaffe (liegend in der Wandnische, auf dem Fachboden)
  const wNiche = NICHES[0][0];
  const wPos = pt(segs[0], (wNiche.u0 + wNiche.u1) / 2, wNiche.y0 + 0.035, wNiche.depth / 2);
  empty('PLACE_OBJ-059', wPos.x, wPos.y, wPos.z, segs[0].rotY);

  // Schlafpodest / Bett (Standobjekt in der Schlafnische, Front zum Raum)
  empty('PLACE_OBJ-081', -4.02, 0, 0, Math.PI / 2);

  // Gedenk-Teeservice (auf dem Podest)
  empty('PLACE_OBJ-083', podX, 0.49, podZ, podRot);

  // ---------------------------------------------------------------- Lichtpunkte
  const lampPts = [
    [0, 3.9, -1.9, 9, 11], [-3.6, 2.6, 0, 6, 8], [0, 3.4, -2.3, 8, 10],
    [3.3, 2.9, 0, 7, 9], [0, 2.9, 4.7, 6, 9], [3.8, 3.2, -0.6, 6, 7],
  ];
  lampPts.forEach((l, i) => {
    empty(`LAMP_${i + 1}`, l[0], l[1], l[2], 0, { color: '#9fd8ff', intensity: l[3], distance: l[4] });
  });

  // ---------------------------------------------------------------- sanftes Atmen der Leuchtschlitze
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lightMat.emissiveIntensity = 1.7 + Math.sin(t * 0.8) * 0.15;
    tealMat.emissiveIntensity = 0.7 + Math.sin(t * 0.55 + 0.7) * 0.12;
    mGlow.emissiveIntensity = 1.4 + Math.sin(t * 0.6 + 1.1) * 0.1;
    amberMat.emissiveIntensity = 0.5 + Math.sin(t * 0.7 + 2.2) * 0.08;
  };

  root.userData.raum = { id: 'ATL-024', name: 'Crew-Quartiere / Wohnbereich', etage: 4 };
  root.userData.api = {
    setLicht: (v) => {
      lightMat.emissiveIntensity = v;
      tealMat.emissiveIntensity = v * 0.4;
      mGlow.emissiveIntensity = v * 0.8;
      amberMat.emissiveIntensity = v * 0.3;
    },
  };
  root.userData.actions = [
    { id: 'INT-quartier-hell', label: 'Helles Licht', run: () => root.userData.api.setLicht(1.8) },
    { id: 'INT-quartier-abend', label: 'Abendlicht', run: () => root.userData.api.setLicht(0.85) },
  ];
  return root;
}

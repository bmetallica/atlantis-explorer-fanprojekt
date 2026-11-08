// Raum ATL-041: Großer Hangar im Südwest-Pier (Etage 5).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Oktogonaler Grundriss (ca. 1.400 m²), lichte Höhe 12 m.
// Haupteingang (Personal-Schiebetür 2,4 × 3 m) an der Seite −Z, Großraum-Hangartor (15,88 × 8,46 m) an der Seite +Z.
// Leere Hülle: nur Architektur (Boden, Wände, Fenster, Paneele, Säulen, Fachwerk, Servicegalerie mit Treppe, Deckenfelder).
// Keine Möbel, keine Fahrzeuge, keine Krane, kein Lager – nur Platzhalter (PLACE_-Punkte).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_hangar',
  art: 'Raum',
  masse: 'Oktogon 40 m × 38 m, ca. 1.400 m² Grundfläche · 12 m lichte Höhe · Wandstärke 0,3 m',
  wohin: 'South-West Pier, Etage 5 – direkt am Start-/Landepier-Ausleger',
  benutzen: 'Transportbereich für schwere Fahrzeuge und Drohnen; leere Hülle, Mobiliar/Technik kommt später über PLACE_-Punkte',
  lichter: '8 LAMP_-Punkte (6 × eisblau, 2 × bernstein am Hangartor) plus Decken-Lichtfelder, Deckenbänder und Wand-Lichtschlitze',
  animation: 'Decken-Lichtfelder, Lichtbänder und Wand-Lichtschlitze atmen sehr dezent (Emissionspuls)',
  quelle: 'Auftrag ATL-041 (Beschreibung maßgeblich), Atlantis-Setpläne „Halls & Corridors“ / Hangarbereich South-West Pier, Referenzbild ref1.jpg',
};

export const varianten = [
  { label: 'Hangar 40 × 38 m, 12 m Höhe', opts: {} },
];

const H = 12;        // lichte Raumhöhe
const T = 0.3;       // Wandstärke
const D = 0.3;       // Boden-/Deckenstärke
const GATE_W = 15.88;
const GATE_H = 8.46;
const DOOR_W = 2.4;
const DOOR_H = 3.0;

// Oktogon: 8 Kanten, diagonale Fasen mit 60° zur X-Achse.
const P = [
  [-14, -19], [14, -19], [20, -8.608], [20, 8.608],
  [14, 19], [-14, 19], [-20, 8.608], [-20, -8.608],
];

// Horizontal liegende Öffnungen je Kante: t-Bereich (Lauf entlang der Kante) + Öffnungshöhe
const OPENINGS = {
  0: [{ a: 12.8, b: 15.2, h: DOOR_H, art: 'personal' }],
  4: [{ a: (28 - GATE_W) / 2, b: (28 + GATE_W) / 2, h: GATE_H, art: 'tor' }],
};

// Fensterfelder (echte Wandöffnungen mit Glas): t-Bereich + Höhenband
const WINDOWS = {
  1: [{ t0: 3.0, t1: 9.0, y0: 6.2, y1: 9.2, art: 'bunt' }],
  2: [{ t0: 2.6, t1: 14.6, y0: 6.2, y1: 9.2, art: 'glas' }],
  3: [{ t0: 3.0, t1: 9.0, y0: 6.2, y1: 9.2, art: 'bunt' }],
  5: [{ t0: 3.0, t1: 9.0, y0: 6.2, y1: 9.2, art: 'bunt' }],
  6: [{ t0: 2.6, t1: 14.6, y0: 6.2, y1: 9.2, art: 'glas' }],
  7: [{ t0: 3.0, t1: 9.0, y0: 6.2, y1: 9.2, art: 'bunt' }],
};

function edgeInfo(i) {
  const a = P[i], b = P[(i + 1) % P.length];
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  return { a, b, dx, dz, L, nx: -dz / L, nz: dx / L, ang: -Math.atan2(dz, dx) };
}

function pointAt(e, t) {
  return [e.a[0] + e.dx * (t / e.L), e.a[1] + e.dz * (t / e.L)];
}

function complement(L, openings) {
  const cuts = openings.map(o => [o.a, o.b]).sort((p, q) => p[0] - q[0]);
  const out = [];
  let cursor = 0;
  for (const [a, b] of cuts) {
    if (a > cursor) out.push([cursor, a]);
    cursor = b;
  }
  if (cursor < L) out.push([cursor, L]);
  return out;
}

function pointInPoly(x, z, poly = P) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if (((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)) inside = !inside;
  }
  return inside;
}

// Schnitt einer Geraden (x = c oder z = c) mit dem Grundriss → Liste von Spannweiten
function lineSpans(axis, c) {
  const hits = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if (axis === 'x') {
      if ((a[0] - c) * (b[0] - c) < 0) {
        const t = (c - a[0]) / (b[0] - a[0]);
        hits.push(a[1] + t * (b[1] - a[1]));
      }
    } else {
      if ((a[1] - c) * (b[1] - c) < 0) {
        const t = (c - a[1]) / (b[1] - a[1]);
        hits.push(a[0] + t * (b[0] - a[0]));
      }
    }
  }
  hits.sort((p, q) => p - q);
  const spans = [];
  for (let i = 0; i + 1 < hits.length; i += 2) {
    const lo = hits[i], hi = hits[i + 1];
    const mid = axis === 'x' ? c : (lo + hi) / 2;
    const mid2 = axis === 'x' ? (lo + hi) / 2 : c;
    if (pointInPoly(mid, mid2)) spans.push([lo, hi]);
  }
  return spans;
}

// Prozedurale Buntglas-Textur (geometrische Schneeflocken-/Feldmuster in Atlantis-Farben)
function buntglasTexture() {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#0a2b40';
  g.fillRect(0, 0, 256, 256);
  const cols = ['#d9a441', '#e8c874', '#3fa69b', '#2e7f9e', '#b1532f'];
  g.save();
  g.translate(128, 128);
  for (let i = 0; i < 6; i++) {
    g.rotate(Math.PI / 3);
    g.fillStyle = cols[i % cols.length];
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(124, 0); g.lineTo(124, 32); g.lineTo(0, 32); g.closePath();
    g.fill();
  }
  g.restore();
  g.strokeStyle = '#eef6ff';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(128, 20); g.lineTo(128, 236);
  g.moveTo(20, 128); g.lineTo(236, 128);
  g.stroke();
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI / 4) * k + Math.PI / 8;
    g.beginPath();
    g.moveTo(128, 128);
    g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_hangar';

  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper');
  const pillarMat = kit('pillar'), floorMat = kit('floor'), ceilMat = kit('ceiling');
  const stairMat = kit('stair'), glowMat = kit('glow'), glassMat = kit('glass');
  const railMat = kit('rail');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45 });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7, roughness: 0.4,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_bernstein', color: 0xffe6c2, emissive: 0xffb45c, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const colMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  const bgTex = buntglasTexture();
  const buntglasMat = bgTex
    ? new THREE.MeshStandardMaterial({
      name: 'buntglas_fenster', map: bgTex, emissiveMap: bgTex, emissive: 0xffffff,
      emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.15,
    })
    : glassMat;

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const dummy = new THREE.Object3D();

  const instanced = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
    list.forEach((it, n) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      dummy.scale.set(it.s ? it.s[0] : 1, it.s ? it.s[1] : 1, it.s ? it.s[2] : 1);
      dummy.updateMatrix();
      im.setMatrixAt(n, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ---------------------------------------------------------------- Boden (Oktogon, Oberkante y = 0)
  const shape = new THREE.Shape(P.slice().reverse().map(([x, z]) => new THREE.Vector2(x, -z)));
  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = add(floorGeo, floorMat, 0, -D, 0, 'boden_hangar');
  floorMesh.receiveShadow = true;

  const colFloorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  colFloorGeo.rotateX(-Math.PI / 2);
  add(colFloorGeo, colMat, 0, -0.2, 0, 'COL_boden');

  // Bodenraster (Kupferfugen, 1,2-m-Raster) – innerhalb der Hülle beschnitten
  const grid = [];
  for (let x = -18; x <= 18; x += 1.2) {
    for (const [a, b] of lineSpans('x', x)) {
      if (b - a > 0.3) grid.push({ p: [x, 0.004, (a + b) / 2], s: [0.02, 0.006, b - a] });
    }
  }
  for (let z = -18; z <= 18; z += 1.2) {
    for (const [a, b] of lineSpans('z', z)) {
      if (b - a > 0.3) grid.push({ p: [(a + b) / 2, 0.004, z], s: [b - a, 0.006, 0.02] });
    }
  }
  instanced(new THREE.BoxGeometry(1, 1, 1), copper, grid, 'boden_fugen');

  // Grüner Randstreifen entlang der Bodeninnenkante (Kupfer-Patina)
  for (let i = 0; i < P.length; i++) {
    const e = edgeInfo(i);
    const mid = pointAt(e, e.L / 2);
    const m = box(e.L - 0.2, 0.014, 0.18, patina,
      mid[0] + e.nx * 0.1, 0.007, mid[1] + e.nz * 0.1, `boden_rand_${i}`);
    m.rotation.y = e.ang;
  }

  // Flugfeld-Markierungen als flache Bodenintarsien
  for (const x of [-7.2, 7.2]) box(0.08, 0.008, 8.6, copper, x, 0.008, 13.6, `boden_intarsie_leitlinie_${x}`);
  for (let i = 0; i < 7; i++) box(0.16, 0.008, 1.0, copper, 0, 0.008, -14.0 + i * 2.4, `boden_intarsie_mittellinie_${i}`);
  box(15.2, 0.008, 0.08, copper, 0, 0.008, 18.0, 'boden_intarsie_quermarkierung');
  // Landekreis (flacher Ring)
  const ring = add(new THREE.RingGeometry(5.92, 6.0, 64), copper, 0, 0.009, 12.0, 'boden_intarsie_landekreis');
  ring.rotation.x = -Math.PI / 2;
  // Chevrons vor dem Hangartor
  for (const s of [-1, 1]) {
    const ch = box(0.16, 0.008, 2.2, copper, s * 2.6, 0.009, 16.6, `boden_intarsie_chevron_${s}`);
    ch.rotation.y = s * 0.55;
  }
  // Warnschraffur direkt vor dem Tor
  for (let i = 0; i < 14; i++) {
    const bar = box(0.26, 0.008, 1.5, amberGlow, -7.0 + i * 1.05, 0.009, 18.55, `boden_warnstreifen_${i}`);
    bar.rotation.y = 0.6;
  }

  // ---------------------------------------------------------------- Wände (mit echten Fensteröffnungen)
  const panelData = [], frameData = [], slotData = [];
  let segId = 0;

  function wallSeg(i, t0, t1, y0, y1, mat, tag) {
    const e = edgeInfo(i);
    const len = t1 - t0;
    if (len < 0.03 || y1 - y0 < 0.03) return null;
    const mid = pointAt(e, (t0 + t1) / 2);
    const cx = mid[0] - e.nx * (T / 2), cz = mid[1] - e.nz * (T / 2);
    const id = segId++;
    const m = box(len, y1 - y0, T, mat, cx, (y0 + y1) / 2, cz, `wand_${tag}_${id}`);
    m.rotation.y = e.ang;
    const c = box(len, y1 - y0, T, colMat, cx, (y0 + y1) / 2, cz, `COL_wand_${tag}_${id}`);
    c.rotation.y = e.ang;
    return m;
  }

  for (let i = 0; i < P.length; i++) {
    const e = edgeInfo(i);
    const ops = OPENINGS[i] || [];
    const wins = WINDOWS[i] || [];
    for (const [a, b] of complement(e.L, ops)) {
      const ints = [];
      for (const w of wins) {
        const s = Math.max(a, w.t0), t = Math.min(b, w.t1);
        if (t - s > 0.05) ints.push({ s, t, y0: w.y0, y1: w.y1 });
      }
      ints.sort((u, v) => u.s - v.s);
      let cur = a;
      for (const it of ints) {
        if (it.s - cur > 0.05) wallSeg(i, cur, it.s, 0, H, wall, `${i}`);
        wallSeg(i, it.s, it.t, 0, it.y0, wall, `${i}_unterglas`);
        wallSeg(i, it.s, it.t, it.y1, H, wall, `${i}_ueberglas`);
        cur = it.t;
      }
      if (b - cur > 0.05) wallSeg(i, cur, b, 0, H, wall, `${i}`);
      // Sockelleiste und Gesims entlang der massiven Abschnitte
      const mid = pointAt(e, (a + b) / 2);
      const len = b - a;
      const s1 = box(len, 0.15, 0.05, copper, mid[0] + e.nx * 0.025, 0.075, mid[1] + e.nz * 0.025, `sockel_${i}`);
      s1.rotation.y = e.ang;
      const s2 = box(len, 0.10, 0.07, copper, mid[0] + e.nx * 0.035, H - 0.05, mid[1] + e.nz * 0.035, `gesims_${i}`);
      s2.rotation.y = e.ang;
    }
    // Stürze über den Türöffnungen
    for (const o of ops) wallSeg(i, o.a, o.b, o.h, H, wall, `sturz_${i}`);
  }

  // ---------------------------------------------------------------- Fenster (Glas, Rahmen, Sprossen, Fensterbank)
  function addWindow(i, w) {
    const e = edgeInfo(i);
    const rot = Math.atan2(e.nx, e.nz);
    const t0 = w.t0, t1 = w.t1, y0 = w.y0, y1 = w.y1;
    const tw = t1 - t0, th = y1 - y0;
    const mid = pointAt(e, (t0 + t1) / 2);
    const mat = w.art === 'bunt' ? buntglasMat : glassMat;
    const g = box(tw, th, 0.06, mat, mid[0] + e.nx * 0.015, (y0 + y1) / 2, mid[1] + e.nz * 0.015, `fenster_glas_${i}`);
    g.rotation.y = rot;
    // Rahmen oben / unten
    const fT = box(tw + 0.36, 0.18, 0.16, copper, mid[0] + e.nx * 0.08, y1 + 0.09, mid[1] + e.nz * 0.08, `fenster_rahmen_oben_${i}`);
    fT.rotation.y = rot;
    const fB = box(tw + 0.36, 0.18, 0.16, copper, mid[0] + e.nx * 0.08, y0 - 0.09, mid[1] + e.nz * 0.08, `fenster_rahmen_unten_${i}`);
    fB.rotation.y = rot;
    // Fensterbank (vorspringend)
    const sill = box(tw + 0.36, 0.12, 0.34, copper, mid[0] + e.nx * 0.16, y0 - 0.19, mid[1] + e.nz * 0.16, `fenster_bank_${i}`);
    sill.rotation.y = rot;
    // Seitenrahmen
    for (const s of [-1, 1]) {
      const p = pointAt(e, s < 0 ? t0 : t1);
      const fs = box(0.18, th + 0.36, 0.16, copper, p[0] + e.nx * 0.08, (y0 + y1) / 2, p[1] + e.nz * 0.08, `fenster_rahmen_seite_${i}_${s}`);
      fs.rotation.y = rot;
    }
    // Sprossen
    for (let k = 1; k < 4; k++) {
      const p = pointAt(e, t0 + (tw * k) / 4);
      const mu = box(0.09, th, 0.12, copper, p[0] + e.nx * 0.05, (y0 + y1) / 2, p[1] + e.nz * 0.05, `fenster_sprosse_${i}_${k}`);
      mu.rotation.y = rot;
    }
  }
  for (const i of Object.keys(WINDOWS)) for (const w of WINDOWS[i]) addWindow(Number(i), w);

  // ---------------------------------------------------------------- Wandpaneele und Lichtschlitze
  for (let i = 0; i < P.length; i++) {
    const e = edgeInfo(i);
    const ops = OPENINGS[i] || [];
    const rot = Math.atan2(e.nx, e.nz);
    let idx = 0;
    for (let t = 0.6; t < e.L - 0.4; t += 1.2, idx++) {
      let skip = false;
      for (const o of ops) if (t > o.a - 0.9 && t < o.b + 0.9) skip = true;
      if (skip) continue;
      const p = pointAt(e, t);
      if (idx % 2 === 0) {
        frameData.push({ p: [p[0] + e.nx * 0.018, 2.9, p[1] + e.nz * 0.018], ry: rot });
        panelData.push({ p: [p[0] + e.nx * 0.045, 2.9, p[1] + e.nz * 0.045], ry: rot });
      } else {
        for (let k = 0; k < 5; k++) {
          slotData.push({ p: [p[0] + e.nx * 0.03, 1.1 + k * 0.9, p[1] + e.nz * 0.03], ry: rot });
        }
      }
    }
    // Decken-Lichtband entlang der Wandoberkante
    const mid = pointAt(e, e.L / 2);
    const band = box(e.L - 0.6, 0.07, 0.05, lineGlow, mid[0] + e.nx * 0.07, 10.75, mid[1] + e.nz * 0.07, `decke_wandlichtband_${i}`);
    band.rotation.y = e.ang;
  }

  instanced(new THREE.BoxGeometry(1.12, 5.12, 0.03), copper, frameData, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(1.0, 5.0, 0.04), wallDark, panelData, 'paneele');
  const slotMesh = instanced(new THREE.BoxGeometry(0.07, 0.52, 0.03), lineGlow, slotData, 'lichtschlitze');

  // ---------------------------------------------------------------- Tür-/Tor-Einfassungen
  // Personaltür (Kante 0, −Z)
  {
    const e = edgeInfo(0);
    const rot = Math.atan2(e.nx, e.nz);
    const o = OPENINGS[0][0];
    const mid = pointAt(e, (o.a + o.b) / 2);
    const top = box(DOOR_W + 0.34, 0.14, 0.1, copper, mid[0] + e.nx * 0.05, DOOR_H, mid[1] + e.nz * 0.05, 'tuer_einfassung_oben');
    top.rotation.y = rot;
    for (const s of [-1, 1]) {
      const p = pointAt(e, s < 0 ? o.a : o.b);
      const jamb = box(0.14, DOOR_H, 0.1, copper, p[0] + e.nx * 0.05, DOOR_H / 2, p[1] + e.nz * 0.05, `tuer_einfassung_${s < 0 ? 'links' : 'rechts'}`);
      jamb.rotation.y = rot;
    }
  }
  // Großraum-Hangartor (Kante 4, +Z): kräftige Bronzefassung + Flutlichtleuchten
  {
    const e = edgeInfo(4);
    const rot = Math.atan2(e.nx, e.nz);
    const o = OPENINGS[4][0];
    const mid = pointAt(e, (o.a + o.b) / 2);
    const top = box(GATE_W + 0.6, 0.28, 0.18, copper, mid[0] + e.nx * 0.09, GATE_H + 0.14, mid[1] + e.nz * 0.09, 'tor_einfassung_oben');
    top.rotation.y = rot;
    const glowBand = box(GATE_W + 0.2, 0.08, 0.06, amberGlow, mid[0] + e.nx * 0.06, GATE_H - 0.35, mid[1] + e.nz * 0.06, 'tor_lichtband');
    glowBand.rotation.y = rot;
    for (const s of [-1, 1]) {
      const p = pointAt(e, s < 0 ? o.a : o.b);
      const jamb = box(0.26, GATE_H, 0.18, copper, p[0] + e.nx * 0.09, GATE_H / 2, p[1] + e.nz * 0.09, `tor_einfassung_${s < 0 ? 'links' : 'rechts'}`);
      jamb.rotation.y = rot;
      // Flutlichtkasten am Torpfosten
      const fl = box(0.5, 0.7, 0.34, wallDark, p[0] + e.nx * 0.28, 6.1, p[1] + e.nz * 0.28, `tor_flutlicht_${s < 0 ? 'links' : 'rechts'}`);
      fl.rotation.y = rot;
      const lens = box(0.42, 0.56, 0.08, amberGlow, p[0] + e.nx * 0.45, 6.1, p[1] + e.nz * 0.45, `tor_flutlicht_linse_${s < 0 ? 'links' : 'rechts'}`);
      lens.rotation.y = rot;
    }
    const sill = box(GATE_W + 0.6, 0.1, 0.5, stairMat, mid[0] + e.nx * 0.25, 0.05, mid[1] + e.nz * 0.25, 'tor_schwelle');
    sill.rotation.y = rot;
  }

  // ---------------------------------------------------------------- Säulen (Perlgrau, Kupfer-Fuß/Kopf)
  const pillarPos = [
    [-13, -11], [13, -11], [-13, -2], [13, -2], [-13, 7], [13, 7], [-7.5, -14.5], [7.5, -14.5],
  ];
  for (let i = 0; i < pillarPos.length; i++) {
    const [x, z] = pillarPos[i];
    box(1.1, H, 1.1, pillarMat, x, H / 2, z, `saeule_${i}`);
    box(1.32, 0.22, 1.32, copper, x, 0.11, z, `saeule_sockel_${i}`);
    box(1.28, 0.16, 1.28, copper, x, 4.4, z, `saeule_gurt_${i}`);
    box(1.34, 0.24, 1.34, copper, x, H - 0.12, z, `saeule_kopf_${i}`);
    box(1.46, 0.3, 1.46, wallDark, x, H - 0.38, z, `saeule_kappe_${i}`);
    box(1.1, H, 1.1, colMat, x, H / 2, z, `COL_saeule_${i}`);
  }

  // ---------------------------------------------------------------- Deckenkonstruktion: Binder/Fachwerk
  const trussZ = [-14.4, -9.6, -4.8, 0, 4.8, 9.6, 14.4];
  const diagData = [], vertData = [];
  for (const z of trussZ) {
    const spans = lineSpans('z', z);
    if (!spans.length) continue;
    const [lo, hi] = spans[0];
    const L = hi - lo - 0.8;
    const cx = (lo + hi) / 2;
    if (L < 2) continue;
    box(L, 0.26, 0.3, wallDark, cx, 11.28, z, `fachwerk_obergurt_${z}`);
    box(L, 0.22, 0.24, copper, cx, 9.98, z, `fachwerk_untergurt_${z}`);
    const n = Math.max(4, Math.round(L / 2.4));
    const step = L / n;
    const rise = 1.3;
    const dlen = Math.hypot(step, rise);
    for (let k = 0; k < n; k++) {
      const x0 = cx - L / 2 + k * step;
      const x1 = x0 + step;
      const ang = Math.atan2(rise, step) * (k % 2 === 0 ? 1 : -1);
      const mx = (x0 + x1) / 2, my = 10.63;
      diagData.push({ p: [mx, my, z], rz: ang, s: [dlen, 0.12, 0.12] });
      vertData.push({ p: [x1, 10.63, z], s: [0.11, rise, 0.11] });
    }
  }
  instanced(new THREE.BoxGeometry(1, 0.12, 0.12), copper, diagData, 'fachwerk_diagonalen');
  instanced(new THREE.BoxGeometry(0.11, 1, 0.11), copper, vertData, 'fachwerk_streben');

  // ---------------------------------------------------------------- Decke
  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  add(ceilGeo, ceilMat, 0, H, 0, 'decke_haupt');
  const colCeilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  colCeilGeo.rotateX(-Math.PI / 2);
  add(colCeilGeo, colMat, 0, H, 0, 'COL_decke');

  // Abgehängte Kassettenfelder mit indirektem Licht
  const fieldPos = [
    [-13, -12], [13, -12], [-13, -3], [13, -3], [-13, 6], [13, 6], [0, -8], [0, 5],
  ];
  for (let i = 0; i < fieldPos.length; i++) {
    const [x, z] = fieldPos[i];
    box(3.4, 0.12, 3.4, wallDark, x, H - 0.06, z, `decke_kassette_${i}`);
    box(2.9, 0.05, 2.9, lineGlow, x, H - 0.14, z, `decke_lichtfeld_${i}`);
  }
  // Lichtbänder längs der Mittelachse
  for (const x of [-5.6, 5.6]) {
    box(0.26, 0.1, 26, copper, x, H - 0.05, 0, 'decke_lichtband_halter');
    box(0.12, 0.05, 25.6, lineGlow, x, H - 0.11, 0, 'decke_lichtband');
  }

  // ---------------------------------------------------------------- Servicegalerie an der +X-Wand (Architektur)
  const GAL_X0 = 18.2, GAL_X1 = 20.0, GAL_Y = 4.8;
  const GAL_Z0 = -3.3, GAL_Z1 = 8.608;
  {
    const len = GAL_Z1 - GAL_Z0, cz = (GAL_Z0 + GAL_Z1) / 2;
    const deck = box(GAL_X1 - GAL_X0, 0.2, len, wallDark, (GAL_X0 + GAL_X1) / 2, GAL_Y - 0.1, cz, 'galerie_boden');
    deck.receiveShadow = true;
    box(GAL_X1 - GAL_X0 + 0.1, 0.1, 0.1, copper, (GAL_X0 + GAL_X1) / 2, GAL_Y - 0.02, GAL_Z0, 'galerie_kante_sued');
    box(GAL_X1 - GAL_X0 + 0.1, 0.1, 0.1, copper, (GAL_X0 + GAL_X1) / 2, GAL_Y - 0.02, GAL_Z1, 'galerie_kante_nord');
    // Kollision Galerieboden
    box(GAL_X1 - GAL_X0, 0.2, len, colMat, (GAL_X0 + GAL_X1) / 2, GAL_Y - 0.1, cz, 'COL_galerie_boden');
    // Geländer
    const railTop = box(0.1, 0.1, len, railMat, GAL_X0 + 0.06, GAL_Y + 1.05, cz, 'galerie_gelaender_oberholm');
    railTop.receiveShadow = true;
    box(0.06, 0.06, len, railMat, GAL_X0 + 0.06, GAL_Y + 0.55, cz, 'galerie_gelaender_mittelholm');
    const posts = [];
    for (let z = GAL_Z0 + 0.2; z <= GAL_Z1 - 0.1; z += 1.45) {
      posts.push({ p: [GAL_X0 + 0.06, GAL_Y + 0.53, z], s: [0.08, 1.06, 0.08] });
    }
    instanced(new THREE.BoxGeometry(1, 1, 1), railMat, posts, 'galerie_gelaender_pfosten');
    // Statische Ausleger unter dem Galerieboden (reine Gebäudearchitektur)
    const ausleger = [];
    const ang = Math.atan2(1.22, -1.5);
    for (let z = GAL_Z0 + 0.9; z <= GAL_Z1 - 0.4; z += 2.4) {
      ausleger.push({ p: [19.1, 4.01, z], rz: ang, s: [1.94, 0.14, 0.14] });
    }
    instanced(new THREE.BoxGeometry(1, 1, 1), copper, ausleger, 'galerie_ausleger');
  }

  // Treppe zur Galerie (Stufen 0,25 m, 19 Stufen, 0,28 m Tiefe)
  {
    const steps = 19, run = 0.28, rise = 0.25;
    const z0 = -8.6;
    const stepData = [];
    for (let k = 0; k < steps; k++) {
      const h = (k + 1) * rise;
      stepData.push({ p: [19.2, h / 2, z0 + k * run + run / 2], s: [1.6, h, run] });
    }
    instanced(new THREE.BoxGeometry(1, 1, 1), stairMat, stepData, 'treppe_stufen');
    const totalRun = steps * run, totalRise = steps * rise;
    const theta = Math.atan2(totalRise, totalRun);
    const len = Math.hypot(totalRun, totalRise);
    const cz = z0 + totalRun / 2;
    // Schräger Handlauf
    const hr = box(0.1, 0.1, len + 0.4, railMat, 18.3, totalRise / 2 + 1.05, cz, 'treppe_handlauf');
    hr.rotation.x = -theta;
    for (const t of [0.05, 0.5, 0.95]) {
      const pz = z0 + totalRun * t;
      const py = totalRise * t + 1.0;
      const p = box(0.08, 1.05, 0.08, railMat, 18.3, py - 0.5, pz, `treppe_gelaender_pfosten_${t}`);
      p.rotation.x = -theta * 0.0;
    }
    // Kollision als Rampe
    const ramp = box(1.6, 0.2, len, colMat, 19.2, totalRise / 2 - 0.1, cz, 'COL_treppe_rampe');
    ramp.rotation.x = -theta;
  }

  // ---------------------------------------------------------------- Objektplätze
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Großraum-Hangartor (Wandobjekt, Rückseite an der Wandinnenfläche +Z, Vorderseie in den Raum)
  empty('PLACE_OBJ-039', 0, 0, 19.0, Math.PI);

  // Mobiler Naquadah-Flüssigtreibstoff-Lader (Standobjekt)
  empty('PLACE_OBJ-078', -12.4, 0, -14.6, 0.35);
  empty('PLACE_OBJ-078_2', -12.4, 0, 9.6, -0.4);
  empty('PLACE_OBJ-078_3', 12.6, 0, -6.2, 0.9);

  // Antigravitations-Hubwagen (Standobjekt)
  empty('PLACE_OBJ-079', -9.2, 0, -16.2, 0.2);
  empty('PLACE_OBJ-079_2', 9.6, 0, 12.4, -0.7);
  empty('PLACE_OBJ-079_3', 14.6, 0, 3.6, 1.6);

  // ---------------------------------------------------------------- Anschlüsse
  empty('DOOR_personeneingang', 0, 0, -19.15, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor ATL-049', raum: 'ATL-049',
  });
  empty('DOOR_aussentor', 0, 0, 19.15, 0, {
    breite: GATE_W, hoehe: GATE_H, ziel: 'Start- und Landebahn (Pier-Ausleger)', raum: 'AUSSEN',
  });

  // Antiker-Schiebetür in der 2,4 × 3 m-Öffnung (Mitte der Wand, Vorderseite in den Raum)
  empty('PLACE_OBJ-091', 0, 0, -19.15, 0);

  // ---------------------------------------------------------------- Lichter
  const lampPos = [
    [-12, 9.4, -10, '#9fd8ff', 11, 30], [12, 9.4, -10, '#9fd8ff', 11, 30],
    [-12, 9.4, 6, '#9fd8ff', 11, 30], [12, 9.4, 6, '#9fd8ff', 11, 30],
    [0, 10.4, -2, '#9fd8ff', 10, 28], [0, 10.4, 13, '#9fd8ff', 10, 28],
    [-8.4, 6.1, 18.5, '#ffd8a0', 9, 18], [8.4, 6.1, 18.5, '#ffd8a0', 9, 18],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: p[3], intensity: p[4], distance: p[5] });
  });

  // ---------------------------------------------------------------- Animation / API
  let t = 0, last = null;
  function animate(dt = 0.016) {
    t += dt;
    lineGlow.emissiveIntensity = 1.62 + Math.sin(t * 0.7) * 0.13;
    amberGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.7 + 1.1) * 0.12;
  }
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) animate(Math.min(now - last, 0.1));
    last = now;
  };
  slotMesh.userData.pulsierend = true;
  root.userData.animation = 'Lichtleisten pulsieren dezent (Sinus 0,7 Hz, ±0,13 Emissionsstärke)';

  root.userData.raum = {
    id: 'ATL-041',
    name: 'raum_hangar',
    flaeche: 1400,
    hoehe: H,
    tueren: ['DOOR_personeneingang', 'DOOR_aussentor'],
  };
  root.userData.api = {
    getFlaeche: () => 1400,
    getHoehe: () => H,
    getTueren: () => ['DOOR_personeneingang', 'DOOR_aussentor'],
    isAussenTor: (name) => name === 'DOOR_aussentor',
    animate,
    update: animate,
  };
  root.userData.animate = animate;
  root.userData.update = animate;

  return root;
}

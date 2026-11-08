// Raum ATL-046: Erdungsstationen 1–4 (Control Tower, Etage 6).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Aufbau: oktogonaler Turm-Hub (Mitte) mit vier symmetrisch diagonal angeordneten
// Stationsbereichen (je 5,97 × 5,0 m, lichte Höhe 4,0 m). Über jeder Station
// führt ein rechteckiger Erderschacht bis 6,9 m, damit die 6 m hohen
// Naquadah-Erdungssäulen (OBJ-007) ohne Durchdringung der Decke stehen.
// Hauptzugang an der Seite −Z (Südflanke des Hubs, Ziel ATL-003).
// Leer: nur Architektur; Erdungsstäbe werden später als OBJ-007 gesetzt.
import * as THREE from 'three';

const kit = (n) => new THREE.MeshStandardMaterial({ name: `KIT_${n}` });

export const steckbrief = {
  name: 'raum_grounding_stations_1',
  art: 'Raum',
  masse: 'ca. 300 m² Gesamtfläche · oktogonaler Turm-Hub (14,4 m Durchmesser) + vier Stationsbereiche je 5,97 × 5,0 m · lichte Höhe 4,0 m, Erderschacht bis 6,9 m',
  wohin: 'Control Tower, Etage 6: vier Naquadah-Erdungsstationen symmetrisch um die Gate-Etage gruppiert',
  benutzen: 'Erdungsstationen 1–4 (OBJ-007) dienen der Naquadah-Erdung; Trennschalter und Kondensatorbänke werden später als Objekte eingesetzt',
  lichter: '8 LAMP_ (4 im Turm-Hub, 1 je Station), eisblau #9fd8ff, zusätzlich eingebaute Lichtleisten an den Wandfugen',
  animation: 'Lichtleisten und Decken-Lichtfelder pulsieren minimal; Beleuchtung über userData.actions schaltbar',
  quelle: 'selbst gebaut nach Szenenbildern „The Storm“ (Erdungsstation mit Naquadah-Leitungssäulen, Schaltmechanik), Atlantis-Setplänen und Screencaps (Quellenklasse A/B)',
};

export function create(opts = {}) {
  const H = 4.0;            // lichte Raumhöhe
  const T = 0.3;            // Wanddicke
  const A = 7.2;            // Apothem des Oktogon-Hubs (Abstand Wandmitte – Mitte)
  const DEG = Math.PI / 180;
  const R = A / Math.cos(Math.PI / 8);          // Eckradius des Oktogons
  const FACE = 2 * R * Math.sin(Math.PI / 8);   // Seitenlänge einer Oktogonwand (~5,97 m)
  const BAY_D = 5.0;        // Tiefe eines Stationsbereichs
  const SHAFT_TOP = 6.9;    // Oberkante des Erderschachts
  const DOOR_W = 2.4, DOOR_H = 3.0;

  const root = new THREE.Group();
  root.name = 'raum_grounding_stations_1';

  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper');
  const pillar = kit('pillar'), floorMat = kit('floor'), ceilMat = kit('ceiling');
  const glass = kit('glass'), glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.45 });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6, metalness: 0.0, roughness: 0.4,
  });
  lineGlow.userData.on = true;

  // ------------------------------------------------------------------ Helfer
  const box = (w, h, d, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = rotY; if (name) m.name = name;
    root.add(m); return m;
  };
  const col = (name, w, h, d, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name; m.position.set(x, y, z); m.rotation.y = rotY; m.visible = false;
    root.add(m); return m;
  };
  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); o.rotation.y = rotY;
    if (userData) o.userData = userData; root.add(o); return o;
  };
  const instanced = (geo, mat, items, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(items.length, 1));
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(0, it.rot || 0, 0);
      o.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    });
    im.count = items.length;
    im.name = name; im.castShadow = false; im.receiveShadow = false;
    root.add(im); return im;
  };

  // Wandlauf (Start/Ende in X/Z) mit optionalen Öffnungen.
  // opening: { u (Mitte entlang der Wand), w, h, sill, glass }
  function wallRun(p1, p2, openings, prefix, inward = { x: 0, z: 0 }) {
    const dx = p2.x - p1.x, dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    if (!(len > 0.001)) return { len: 0, rot: 0, ux: 1, uz: 0, at: () => ({ x: 0, z: 0 }) };
    const ux = dx / len, uz = dz / len;
    const rot = -Math.atan2(dz, dx);
    const at = (u) => ({ x: p1.x + ux * u, z: p1.z + uz * u });
    const piece = (u0, u1, y0, y1, tag) => {
      if (u1 - u0 < 0.02 || y1 - y0 < 0.02) return;
      const c = at((u0 + u1) / 2);
      box(u1 - u0, y1 - y0, T, wall, c.x, (y0 + y1) / 2, c.z, `${prefix}_${tag}`, rot);
      col(`COL_${prefix}_${tag}`, u1 - u0, y1 - y0, T, c.x, (y0 + y1) / 2, c.z, rot);
    };
    let prev = 0;
    const ops = [...openings].sort((a, b) => a.u - b.u);
    for (const o of ops) {
      const u0 = o.u - o.w / 2, u1 = o.u + o.w / 2;
      piece(prev, u0, 0, H, 'voll');
      if (o.sill > 0) piece(u0, u1, 0, o.sill, 'sockel');
      piece(u0, u1, o.sill + o.h, H, 'sturz');
      if (o.glass) {
        const c = at(o.u), fw = 0.11;
        const ix = c.x + inward.x * (T / 2 + 0.02), iz = c.z + inward.z * (T / 2 + 0.02);
        box(o.w, o.h, 0.06, glass, ix, o.sill + o.h / 2, iz, `${prefix}_glas`, rot);
        for (const s of [-1, 1]) {
          const cj = at(o.u + s * (o.w / 2 + fw / 2));
          const jx = cj.x + inward.x * (T / 2 + 0.02), jz = cj.z + inward.z * (T / 2 + 0.02);
          box(fw, o.h + 2 * fw, 0.14, copper, jx, o.sill + o.h / 2, jz, `${prefix}_rahmen_seite_${s > 0 ? 'b' : 'a'}`, rot);
        }
        box(o.w + 2 * fw, fw, 0.14, copper, ix, o.sill + o.h / 2 - fw / 2, iz, `${prefix}_rahmen_unten`, rot);
        box(o.w + 2 * fw, fw, 0.14, copper, ix, o.sill + o.h / 2 + fw / 2, iz, `${prefix}_rahmen_oben`, rot);
      }
      prev = u1;
    }
    piece(prev, len, 0, H, 'voll');
    return { len, rot, ux, uz, at };
  }

  // ------------------------------------------------------------------ Oktogon-Hub
  const V = [];
  for (let k = 0; k < 8; k++) {
    const a = (22.5 + 45 * k) * DEG;
    V.push({ x: R * Math.cos(a), z: R * Math.sin(a) });
  }

  const panelItems = [], frameItems = [], slotItems = [], floorItems = [];

  const faces = [];
  for (let k = 0; k < 8; k++) {
    const p1 = V[k], p2 = V[(k + 1) % 8];
    const dx = p2.x - p1.x, dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const rot = -Math.atan2(dz, dx);
    const theta = (45 * (k + 1)) * DEG;
    const n = { x: Math.cos(theta), z: Math.sin(theta) };
    const isDoor = (k === 0 || k === 2 || k === 4 || k === 6 || k === 5);
    const isWin = (k === 1 || k === 3 || k === 7);
    const ops = isDoor
      ? [{ u: FACE / 2, w: DOOR_W, h: DOOR_H, sill: 0, glass: false }]
      : (isWin ? [{ u: FACE / 2, w: 3.0, h: 2.6, sill: 0.5, glass: true }] : []);
    wallRun(p1, p2, ops, `hub_wand_${k}`, { x: -n.x, z: -n.z });
    faces.push({ k, p1, p2, ux, uz, rot, theta, n, isDoor, isWin });
  }

  // Wanddekor des Hubs: Zierpaneele, Lichtschlitze, Sockelleiste, Gesims
  const innerR = A - T / 2;                 // Innenfläche der Hubwände
  for (const f of faces) {
    const { n, ux, uz, rot } = f;
    const spans = f.isDoor
      ? [[0, (FACE - DOOR_W) / 2], [(FACE + DOOR_W) / 2, FACE]]
      : (f.isWin ? [[0, (FACE - 3.0) / 2], [(FACE + 3.0) / 2, FACE]] : [[0, FACE]]);
    for (const [a, b] of spans) {
      const len = b - a;
      if (len < 0.9) continue;
      const w = Math.min(1.18, len - 0.15);
      const s = (a + b) / 2;
      const px = f.p1.x + ux * s - n.x * 0.018, pz = f.p1.z + uz * s - n.z * 0.018;
      frameItems.push({ x: px, y: 1.55, z: pz, rot });
      panelItems.push({ x: px - n.x * 0.02, y: 1.55, z: pz - n.z * 0.02, rot });
    }
    // senkrechte Lichtschlitze an den Wandenden
    for (const s of [0.16, FACE - 0.16]) {
      for (let q = 0; q < 4; q++) {
        const px = f.p1.x + ux * s - n.x * 0.02, pz = f.p1.z + uz * s - n.z * 0.02;
        slotItems.push({ x: px, y: 1.05 + q * 0.42, z: pz, rot });
      }
    }
    // Sockelleiste / Gesims (durchgehende Wandfelder)
    const segs = f.isDoor
      ? [[0, (FACE - DOOR_W) / 2], [(FACE + DOOR_W) / 2, FACE]]
      : [[0, FACE]];
    for (const [a, b] of segs) {
      const l = b - a; if (l < 0.05) continue;
      const s = (a + b) / 2;
      const px = f.p1.x + ux * s - n.x * 0.02, pz = f.p1.z + uz * s - n.z * 0.02;
      box(l, 0.15, 0.05, copper, px, 0.075, pz, `hub_sockel_${f.k}`, rot);
      box(l, 0.1, 0.06, copper, px, H - 0.05, pz, `hub_gesims_${f.k}`, rot);
    }
  }

  // Hub-Boden (Oktagon) + Hub-Decke
  const hubFloor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.1, 8, 1), floorMat);
  hubFloor.position.y = -0.05; hubFloor.rotation.y = -Math.PI / 8; hubFloor.name = 'boden_hub';
  root.add(hubFloor);
  const hubCeil = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 8, 1), ceilMat);
  hubCeil.position.y = H + 0.15; hubCeil.rotation.y = -Math.PI / 8; hubCeil.name = 'decke_hub';
  root.add(hubCeil);

  // Kollisions-Boden/Decke des Hubs: 8 Randbänder + Mittelquadrat
  for (const f of faces) {
    const c = { x: f.n.x * (A - 2.0), z: f.n.z * (A - 2.0) };
    col(`COL_boden_hub_${f.k}`, FACE, 0.2, 4.0, c.x, -0.1, c.z, f.rot);
    col(`COL_decke_hub_${f.k}`, FACE, 0.3, 4.0, c.x, H + 0.15, c.z, f.rot);
  }
  col('COL_boden_hub_mitte', 8.0, 0.2, 8.0, 0, -0.1, 0);
  col('COL_decke_hub_mitte', 8.0, 0.3, 8.0, 0, H + 0.15, 0);

  // kupferner Oktogon-Rand und grün-kupferne Innenlinie
  for (const f of faces) {
    const rr = (A - 0.28) / A;
    const q1 = { x: f.p1.x * rr, z: f.p1.z * rr }, q2 = { x: f.p2.x * rr, z: f.p2.z * rr };
    const dx = q2.x - q1.x, dz = q2.z - q1.z, l = Math.hypot(dx, dz);
    box(l, 0.014, 0.1, copper, (q1.x + q2.x) / 2, 0.007, (q1.z + q2.z) / 2, `boden_rand_hub_${f.k}`, -Math.atan2(dz, dx));
    const rr2 = (A - 0.72) / A;
    const r1 = { x: f.p1.x * rr2, z: f.p1.z * rr2 }, r2 = { x: f.p2.x * rr2, z: f.p2.z * rr2 };
    const ex = r2.x - r1.x, ez = r2.z - r1.z, el = Math.hypot(ex, ez);
    box(el, 0.010, 0.07, patina, (r1.x + r2.x) / 2, 0.005, (r1.z + r2.z) / 2, `boden_patina_hub_${f.k}`, -Math.atan2(ez, ex));
  }

  // Schneeflocken-Intarsie im Zentrum des Hubs (gerundete Bodenintarsie)
  for (let k = 0; k < 6; k++) {
    const a = k * 60 * DEG, dx = Math.cos(a), dz = Math.sin(a);
    floorItems.push({ x: dx * 0.85, y: 0.008, z: dz * 0.85, rot: -a, sx: 1.6, sy: 0.012, sz: 0.07 });
    for (const r of [0.85, 1.28]) {
      floorItems.push({ x: dx * r, y: 0.008, z: dz * r, rot: -(a + Math.PI / 2), sx: 0.42, sy: 0.012, sz: 0.05 });
    }
  }

  // Decken-Lichtfelder im Hub
  for (let i = 0; i < 4; i++) {
    const a = (45 + i * 90) * DEG;
    const cx = Math.cos(a) * 3.2, cz = Math.sin(a) * 3.2;
    const rot = -(a + Math.PI / 2);
    box(4.6, 0.04, 0.45, glow, cx, H - 0.03, cz, `decke_lichtfeld_hub_${i}`, rot);
    box(4.9, 0.05, 0.64, copper, cx, H - 0.055, cz, `decke_lichtfeld_rahmen_hub_${i}`, rot);
  }

  // schlanke, leicht geneigte Säulen in vier Hubecken
  for (let i = 0; i < 4; i++) {
    const a = (22.5 + i * 90) * DEG;
    const cx = Math.cos(a) * 6.85, cz = Math.sin(a) * 6.85;
    const p = box(0.3, H - 0.3, 0.3, pillar, cx, (H - 0.3) / 2, cz, `hub_saeule_${i}`);
    p.rotation.z = 0.05 * Math.cos(a); p.rotation.x = -0.05 * Math.sin(a);
    col(`COL_hub_saeule_${i}`, 0.36, H, 0.36, cx, H / 2, cz);
  }

  // ------------------------------------------------------------------ Vier Stationen
  const stations = [];
  const bayFaces = [0, 2, 4, 6];   // Normalen 45°, 135°, 225°, 315°
  bayFaces.forEach((k, idx) => {
    const num = idx + 1;
    const theta = (45 * (k + 1)) * DEG;
    const n = { x: Math.cos(theta), z: Math.sin(theta) };
    const phi = Math.PI / 2 - theta;                       // lokale Z-Achse zeigt nach außen
    const LX = { x: Math.cos(phi), z: -Math.sin(phi) };     // lokale X-Achse der Station
    const innerC = { x: n.x * A, z: n.z * A };
    const outerC = { x: n.x * (A + BAY_D), z: n.z * (A + BAY_D) };
    const midC = { x: n.x * (A + BAY_D / 2), z: n.z * (A + BAY_D / 2) };
    const bp = (lx, lz) => ({ x: midC.x + LX.x * lx + n.x * lz, z: midC.z + LX.z * lx + n.z * lz });
    const pre = `station${num}`;

    // Seitenwände
    for (const s of [-1, 1]) {
      const p1 = { x: innerC.x + LX.x * s * FACE / 2, z: innerC.z + LX.z * s * FACE / 2 };
      const p2 = { x: outerC.x + LX.x * s * FACE / 2, z: outerC.z + LX.z * s * FACE / 2 };
      wallRun(p1, p2, [], `${pre}_seitenwand_${s > 0 ? 'a' : 'b'}`, { x: -LX.x * s, z: -LX.z * s });
      const wallRot = -Math.atan2(n.z, n.x);
      const faceX = s * (FACE / 2 - T / 2 - 0.02);
      // Zierpaneel (plant-on)
      const pp = bp(faceX, -1.45);
      frameItems.push({ x: pp.x, y: 1.55, z: pp.z, rot: wallRot });
      panelItems.push({ x: pp.x - LX.x * s * 0.02, y: 1.55, z: pp.z - LX.z * s * 0.02, rot: wallRot });
      // Lichtschlitze
      for (let q = 0; q < 4; q++) {
        const sp = bp(s * (FACE / 2 - T / 2 - 0.02), 0.05);
        slotItems.push({ x: sp.x, y: 1.05 + q * 0.42, z: sp.z, rot: wallRot });
      }
      // Sockel / Gesims
      const cm = bp(s * (FACE / 2 - T / 2 - 0.02), 0);
      box(BAY_D, 0.15, 0.05, copper, cm.x, 0.075, cm.z, `${pre}_sockel_${s > 0 ? 'a' : 'b'}`, wallRot);
      box(BAY_D, 0.1, 0.06, copper, cm.x, H - 0.05, cm.z, `${pre}_gesims_${s > 0 ? 'a' : 'b'}`, wallRot);

      // Schneeflocken-Ornament (rechtwinklige Verzweigung) auf der Seitenwand
      const d = { x: -LX.x * s, z: -LX.z * s };              // Blickrichtung in den Raum
      const w = { x: d.z, z: -d.x };                          // Wandtangente
      const r = -Math.atan2(w.z, w.x);
      const mo = bp(s * (FACE / 2 - T / 2 - 0.045), 1.35);
      const push = (ox, oy, oz, sx, sy, sz) => floorItems.push({
        x: mo.x + w.x * ox + n.x * oz, y: oy, z: mo.z + w.z * ox + n.z * oz, rot: r, sx, sy, sz,
      });
      push(0, 1.55, 0, 0.07, 1.7, 0.05);
      for (let q = 0; q < 3; q++) {
        const y = 1.02 + q * 0.42, L = (q === 1) ? 0.46 : 0.32;
        for (const sg of [-1, 1]) {
          push(sg * L / 2, y, 0, L, 0.06, 0.05);
          push(sg * L, y - 0.11, 0, 0.06, 0.22, 0.05);
        }
      }
    }

    // Außenwand mit großem Fenster
    const ow1 = { x: outerC.x - LX.x * FACE / 2, z: outerC.z - LX.z * FACE / 2 };
    const ow2 = { x: outerC.x + LX.x * FACE / 2, z: outerC.z + LX.z * FACE / 2 };
    wallRun(ow1, ow2, [{ u: FACE / 2, w: 3.6, h: 2.5, sill: 0.7, glass: true }], `${pre}_aussenwand`, { x: -n.x, z: -n.z });
    // Bronzeeinfassung des Außenfensters
    {
      const c = bp(0, BAY_D / 2 - T / 2 - 0.03);
      const rot = -Math.atan2(n.z, n.x);
      box(3.9, 0.1, 0.06, copper, c.x, 0.65, c.z, `${pre}_aussenfenster_sockel`, rot);
      box(3.9, 0.1, 0.06, copper, c.x, 3.25, c.z, `${pre}_aussenfenster_kopf`, rot);
    }

    // Boden / Kollision
    box(FACE, 0.1, BAY_D, floorMat, midC.x, -0.05, midC.z, `boden_${pre}`, phi);
    col(`COL_boden_${pre}`, FACE, 0.2, BAY_D, midC.x, -0.1, midC.z, phi);

    // grün-kupferner Rand + 1,2-m-Fugen
    for (const s of [-1, 1]) {
      const p = bp(s * (FACE / 2 - 0.11), 0);
      box(0.18, 0.012, BAY_D - 0.12, patina, p.x, 0.006, p.z, `boden_${pre}_rand_${s > 0 ? 'a' : 'b'}`, phi);
    }
    for (let g = 0; g < 4; g++) {
      const p = bp(0, -1.8 + g * 1.2);
      box(FACE - 0.34, 0.008, 0.03, copper, p.x, 0.004, p.z, `boden_${pre}_fuge_${g}`, phi);
    }

    // Decke der Station: drei Platten um die Schachtöffnung
    const ceilPanels = [
      { x: 0, z: -1.525, w: 4.3, d: 1.95 },     // Rückstreifen (Richtung Hub)
      { x: 2.5675, z: 0.075, w: 0.835, d: 5.15 },// Seitenstreifen rechts
      { x: -2.5675, z: 0.075, w: 0.835, d: 5.15 },// Seitenstreifen links
    ];
    ceilPanels.forEach((cp, i) => {
      const p = bp(cp.x, cp.z);
      box(cp.w, 0.3, cp.d, ceilMat, p.x, H + 0.15, p.z, `decke_${pre}_${i}`, phi);
      col(`COL_decke_${pre}_${i}`, cp.w, 0.3, cp.d, p.x, H + 0.15, p.z, phi);
    });
    // Bronzefassung der Schachtöffnung
    {
      const p = bp(0, -0.55);
      box(4.3, 0.12, 0.1, copper, p.x, H + 0.05, p.z, `decke_${pre}_schachtrahmen_hub`, phi);
      for (const s of [-1, 1]) {
        const q = bp(s * 2.0, 1.05);
        box(0.12, 0.12, 3.2, copper, q.x, H + 0.05, q.z, `decke_${pre}_schachtrahmen_${s > 0 ? 'a' : 'b'}`, phi);
      }
    }
    // Decken-Lichtfeld (über dem Bereich nahe am Hub)
    {
      const p = bp(0, -1.45);
      box(3.4, 0.04, 0.5, glow, p.x, H - 0.03, p.z, `decke_lichtfeld_${pre}`, phi);
      box(3.7, 0.05, 0.68, copper, p.x, H - 0.055, p.z, `decke_lichtfeld_rahmen_${pre}`, phi);
    }

    // ---------------------------------------------------------------- Erderschacht
    const shaftH = SHAFT_TOP - H;
    for (const s of [-1, 1]) {                       // Schachtseitenwände
      const p = bp(s * 2.0, 1.05);
      box(0.3, shaftH, 3.2, wall, p.x, H + shaftH / 2, p.z, `${pre}_schacht_seitenwand_${s > 0 ? 'a' : 'b'}`, phi);
      col(`COL_${pre}_schacht_seitenwand_${s > 0 ? 'a' : 'b'}`, 0.3, shaftH, 3.2, p.x, H + shaftH / 2, p.z, phi);
      const r = bp(s * 1.83, 1.05);
      box(0.06, shaftH - 0.3, 0.08, copper, r.x, H + shaftH / 2, r.z, `${pre}_schacht_rippe_${s > 0 ? 'a' : 'b'}`, phi);
    }
    {                                              // Schachtrückwand (Richtung Hub)
      const p = bp(0, -0.4);
      box(4.3, shaftH, 0.3, wall, p.x, H + shaftH / 2, p.z, `${pre}_schacht_rueckwand`, phi);
      col(`COL_${pre}_schacht_rueckwand`, 4.3, shaftH, 0.3, p.x, H + shaftH / 2, p.z, phi);
    }
    {                                              // Schacht-Außenwand mit Fensterband
      const p = bp(0, 2.5);
      const wRun = wallRun(
        { x: p.x - LX.x * 2.15, z: p.z - LX.z * 2.15 },
        { x: p.x + LX.x * 2.15, z: p.z + LX.z * 2.15 },
        [{ u: 2.15, w: 2.6, h: 1.6, sill: 4.6, glass: true }],
        `${pre}_schacht_aussenwand`, { x: -n.x, z: -n.z });
      // Wandsturz über dem Fenster ergänzen (auf 4,0 – 6,9 m Höhe)
      const cap = 6.9;
      void wRun; void cap;
    }
    {                                              // Schachtabschluss (Decke)
      const p = bp(0, 1.05);
      box(4.3, 0.3, 3.2, ceilMat, p.x, SHAFT_TOP + 0.15, p.z, `decke_schacht_${pre}`, phi);
      col(`COL_decke_schacht_${pre}`, 4.3, 0.3, 3.2, p.x, SHAFT_TOP + 0.15, p.z, phi);
      const g = bp(0, 1.05);
      box(2.6, 0.04, 2.4, glow, g.x, SHAFT_TOP - 0.03, g.z, `decke_lichtfeld_schacht_${pre}`, phi);
      box(2.9, 0.05, 2.7, copper, g.x, SHAFT_TOP - 0.055, g.z, `decke_lichtfeld_rahmen_schacht_${pre}`, phi);
    }

    stations.push({ num, theta, n, LX, phi, midC, innerC, outerC, bp });
  });

  // ------------------------------------------------------------------ Instanzen
  instanced(new THREE.BoxGeometry(1.18, 2.78, 0.035), copper, frameItems, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(1.04, 2.62, 0.04), wallDark, panelItems, 'paneele');
  const slotMesh = instanced(new THREE.BoxGeometry(0.07, 0.32, 0.03), lineGlow, slotItems, 'lichtschlitze');
  instanced(new THREE.BoxGeometry(1, 1, 1), copper, floorItems, 'boden_ornament');

  // ------------------------------------------------------------------ Türen / Anschlüsse
  let doorIdx = 0;
  const placeDoor = (x, z, rotY) => {
    doorIdx++;
    empty(doorIdx === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorIdx}`, x, 0, z, rotY);
  };

  // Haupteingang an der Seite −Z (Hub-Südseite)
  const entryTheta = 270 * DEG;
  const entryN = { x: Math.cos(entryTheta), z: Math.sin(entryTheta) };
  const entryPos = { x: entryN.x * A, z: entryN.z * A };
  empty('DOOR_gate', entryPos.x, 0, entryPos.z, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Gate-Etage / Kontrollturm-Kern', raum: 'ATL-003',
  });
  placeDoor(entryPos.x, entryPos.z, 0);   // +Z zeigt in den Raum

  // Türen von den vier Stationen in den Hub
  for (const st of stations) {
    const x = st.n.x * A, z = st.n.z * A;
    const outRot = Math.PI / 2 - st.theta;   // +Z zeigt nach außen (in die Station)
    const inRot = outRot + Math.PI;           // +Z zeigt in den Hub
    empty(`DOOR_station${st.num}`, x, 0, z, outRot, {
      breite: DOOR_W, hoehe: DOOR_H, ziel: `Erdungsstation ${st.num}`, raum: 'ATL-046',
    });
    placeDoor(x, z, inRot);
  }

  // ------------------------------------------------------------------ Objektplätze OBJ-007
  stations.forEach((st, i) => {
    const p = st.bp(0, 1.0);                 // Fußpunkt der Erdungssäule (1,0 m hinter der Stationsmitte)
    const rotY = -st.theta - Math.PI / 2;    // +Z zeigt zum Hub
    empty(i === 0 ? 'PLACE_OBJ-007' : `PLACE_OBJ-007_${i + 1}`, p.x, 0, p.z, rotY);
  });

  // ------------------------------------------------------------------ Lichter
  const lamps = [];
  const lamp = (name, x, y, z, intensity = 9, distance = 16) => {
    const l = empty(name, x, y, z, 0, { color: '#9fd8ff', intensity, distance });
    l.userData.on = true; lamps.push(l); return l;
  };
  for (let i = 0; i < 4; i++) {
    const a = (45 + i * 90) * DEG;
    lamp(`LAMP_hub_${i}`, Math.cos(a) * 3.2, H - 0.5, Math.sin(a) * 3.2, 10, 18);
  }
  for (const st of stations) {
    const p = st.bp(0, -1.45);
    lamp(`LAMP_station${st.num}`, p.x, H - 0.5, p.z, 8, 14);
  }

  // ------------------------------------------------------------------ Aktionen / API
  root.userData.actions = [{
    id: 'INT-046-licht',
    label: 'Beleuchtung',
    run() {
      const on = !lineGlow.userData.on;
      lineGlow.userData.on = on;
      lineGlow.emissiveIntensity = on ? 1.6 : 0.12;
      lamps.forEach((l) => { l.userData.on = on; });
    },
  }];
  root.userData.api = {
    stationen: () => stations.map((s) => ({
      nummer: s.num,
      position: [s.midC.x, 0, s.midC.z],
      achse: [s.n.x, s.n.z],
      hoehe: H,
      schachtHoehe: SHAFT_TOP,
      flaeche: Math.round(FACE * BAY_D),
    })),
    hubRadius: R,
    deckenhoehe: H,
    beleuchtung: (an) => {
      lineGlow.userData.on = an;
      lineGlow.emissiveIntensity = an ? 1.6 : 0.12;
      lamps.forEach((l) => { l.userData.on = an; });
    },
  };
  root.userData.raum = { id: 'ATL-046', etage: 6, bereich: 'Control Tower', stationen: 4 };

  // ------------------------------------------------------------------ Animation (nur Material)
  let t = 0, last = null;
  const pulse = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    if (lineGlow.userData.on) lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.8) * 0.14;
  };
  slotMesh.onBeforeRender = pulse;
  root.userData.update = (dt) => {
    t += Math.min(Math.max(dt || 0, 0), 0.1);
    if (lineGlow.userData.on) lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.8) * 0.14;
  };

  return root;
}

// Raum ATL-038: ZPM-Raum / Zentraler Power-Modulator (Inner City, Kern, Etage 0).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Achteckiger Hochsicherheitsraum, ca. 161 m² (13,0 m × 13,0 m, 2 m Eckabschnitt),
// lichte Höhe 5,0 m. Haupteingang an der Seite −Z.
// Leere Hülle: nur Architektur (Sockel, Kanäle, Paneele, Lichtfelder).
// ZPM-Module, Aufnahmeplattform, Stadtschild, Sternenantrieb und Tarnfeld-Generator
// liegen ausschließlich als PLACE_-Punkte vor.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_zpm_room',
  art: 'Raum',
  masse: '13,0 m × 13,0 m (Achteck, 161 m²) × 5,0 m lichte Höhe',
  wohin: 'Inner City (Kern), am Fuß des Zentralen Turms – ZPM-Sockel',
  benutzen: 'keine (ZPM-Module, Aufnahmeplattform, Stadtschild, Sternenantrieb und Tarnfeld-Generator werden als fertige Objekte an die PLACE_-Punkte gesetzt)',
  lichter: '8 LAMP_-Punkte (7× eisblau, 1× bernstein über dem ZPM-Sockel), dazu eingebaute Deckenlichtfelder, Wandlichtschlitze und Energiekanal-Linien',
  animation: 'Lichtschlitze, Deckenfelder und der Leuchtring am ZPM-Sockel pulsieren minimal und versetzt',
  quelle: 'Rekonstruiert nach Beschreibung (ATL-038), Mallozzi-Setplan „Atlantis ZPM Room“ (Stage 6) und Asuran-Replikator-Setplan',
};

const T = 0.30;        // Wanddicke
const H = 5.00;        // lichte Raumhöhe
const AX = 6.50;       // Achse X
const AZ = 6.50;       // Achse Z
const CUT = 2.00;      // Eckabschnitt (30°/60°-Achteck)
const DOOR_W = 2.40;
const DOOR_H = 3.00;
const PLINTH_H = 0.50; // dreieckiger ZPM-Sockel

// Achteck (gegen den Uhrzeigersinn), Flachs-Seiten bei x = ±AX und z = ±AZ
const POLY = [
  [-(AX - CUT), -AZ], [AX - CUT, -AZ], [AX, -(AZ - CUT)], [AX, AZ - CUT],
  [AX - CUT, AZ], [-(AX - CUT), AZ], [-AX, AZ - CUT], [-AX, -(AZ - CUT)],
];

const WALLS = [
  { a: POLY[0], b: POLY[1], name: 'sued', door: true },
  { a: POLY[1], b: POLY[2], name: 'suedost' },
  { a: POLY[2], b: POLY[3], name: 'ost' },
  { a: POLY[3], b: POLY[4], name: 'nordost' },
  { a: POLY[4], b: POLY[5], name: 'nord' },
  { a: POLY[5], b: POLY[6], name: 'nordwest' },
  { a: POLY[6], b: POLY[7], name: 'west' },
  { a: POLY[7], b: POLY[0], name: 'suedwest' },
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_zpm_room';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const stairMat = kit('stair');
  const glowMat = kit('glow');
  const amberMat = kit('amberGlow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'energie_ring', color: 0xffd8a0, emissive: 0xffb35c, emissiveIntensity: 1.8,
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

  const colBox = (w, h, d, x, y, z, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z);
    m.name = name;
    m.visible = false;
    root.add(m);
    return m;
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

  // --------------------------------------------------------------- Grundriss (Achteck)
  const shape = new THREE.Shape();
  shape.moveTo(POLY[0][0], POLY[0][1]);
  for (let i = 1; i < POLY.length; i++) shape.lineTo(POLY[i][0], POLY[i][1]);
  shape.closePath();

  // Boden: Extrusion in −Y, Oberkante exakt bei y = 0
  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: false });
  floorGeo.rotateX(Math.PI / 2);
  add(floorGeo, floorMat, 0, 0, 0, 'boden_octagon');

  // Deckenschale: 0,3 m dick, Unterseite bei y = 5,0
  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.30, bevelEnabled: false });
  ceilGeo.rotateX(Math.PI / 2);
  add(ceilGeo, ceilMat, 0, H + 0.30, 0, 'decke_hauptschale');

  // --------------------------------------------------------------- Wandsegment-Helfer
  const wallLen = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
  const wallPoint = (w, t) => [
    w.a[0] + (w.b[0] - w.a[0]) * t,
    w.a[1] + (w.b[1] - w.a[1]) * t,
  ];
  const wallFrame = (w) => {
    const Lw = wallLen(w);
    const dx = (w.b[0] - w.a[0]) / Lw;
    const dz = (w.b[1] - w.a[1]) / Lw;
    return {
      Lw, dx, dz,
      rot: -Math.atan2(dz, dx),
      outX: dz, outZ: -dx,   // Außennormale
      inX: -dz, inZ: dx,     // Innennormale
    };
  };

  const addWallSegment = (w, t0, t1, y0, y1, mat, name) => {
    const f = wallFrame(w);
    const len = (t1 - t0) * f.Lw;
    const p0 = wallPoint(w, t0), p1 = wallPoint(w, t1);
    const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
    const m = box(len, y1 - y0, T, mat, mx + f.outX * T / 2, (y0 + y1) / 2, mz + f.outZ * T / 2, name);
    m.rotation.y = f.rot;
    return m;
  };

  const panelData = [];
  const frameData = [];
  const slotData = [];
  const trimData = [];
  const seamData = [];
  const lineData = [];

  const panelIndex = { n: 0 };
  for (const w of WALLS) {
    const f = wallFrame(w);
    const Lw = f.Lw;

    // Wandkörper; Südsegment mit 2,4 × 3,0 m Türöffnung
    if (w.door) {
      const tL = (-DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0]);
      const tR = (DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0]);
      addWallSegment(w, 0, tL, 0, H, wallMat, `wand_${w.name}_links`);
      addWallSegment(w, tR, 1, 0, H, wallMat, `wand_${w.name}_rechts`);
      addWallSegment(w, tL, tR, DOOR_H, H, wallMat, `wand_${w.name}_sturz`);
    } else {
      addWallSegment(w, 0, 1, 0, H, wallMat, `wand_${w.name}`);
    }

    // Sockelleiste, Gesims und Bodenrand (Türöffnung ausgespart)
    const segs = w.door
      ? [[0, (-DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0])],
         [(DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0]), 1]]
      : [[0, 1]];
    for (const [t0, t1] of segs) {
      addWallSegment(w, t0, t1, 0, 0.15, copper, `sockel_${w.name}`);
      addWallSegment(w, t0, t1, H - 0.10, H, copper, `gesims_${w.name}`);
      const p0 = wallPoint(w, t0), p1 = wallPoint(w, t1);
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      trimData.push({
        p: [mx + f.inX * 0.11, 0.007, mz + f.inZ * 0.11],
        r: f.rot,
        s: [(t1 - t0) * Lw, 1, 1],
      });
    }

    // Eck-/Fugenprofile auf den kurzen Diagonalwänden
    if (Lw < 6) {
      seamData.push({
        p: [w.a[0] + f.dx * 0.15 + f.inX * 0.03, H / 2, w.a[1] + f.dz * 0.15 + f.inZ * 0.03],
        r: f.rot,
      });
      seamData.push({
        p: [w.b[0] - f.dx * 0.15 + f.inX * 0.03, H / 2, w.b[1] - f.dz * 0.15 + f.inZ * 0.03],
        r: f.rot,
      });
      continue;
    }

    // Paneelfelder / Lichtschlitze im 1,2-m-Raster auf den Flachs-Seiten
    const n = Math.max(1, Math.floor((Lw - 0.6) / 1.2));
    for (let i = 0; i < n; i++) {
      const s = 0.6 + i * 1.2;
      if (s > Lw - 0.45) continue;
      const t = s / Lw;
      const p = wallPoint(w, t);
      if (w.door && Math.abs(p[0]) < 1.95) continue;

      // vertikale Kupferfuge zwischen den Feldern
      seamData.push({ p: [p[0] + f.inX * 0.022, H / 2, p[1] + f.inZ * 0.022], r: f.rot });

      if (i % 2 === 0) {
        frameData.push({ p: [p[0] + f.inX * 0.022, 1.55, p[1] + f.inZ * 0.022], r: f.rot });
        panelData.push({ p: [p[0] + f.inX * 0.052, 1.55, p[1] + f.inZ * 0.052], r: f.rot });
        panelIndex.n++;
        // rechteckiges, verzweigtes Lineament auf jedem zweiten Zierpaneel
        if (panelIndex.n % 2 === 0) {
          const at = (along, height, sx, sy) => lineData.push({
            p: [p[0] + f.inX * 0.082 + f.dx * along, height, p[1] + f.inZ * 0.082 + f.dz * along],
            r: f.rot,
            s: [sx, sy, 1],
          });
          at(0, 1.55, 0.05, 1.00);
          at(0, 1.20, 0.55, 0.04);
          at(0, 1.55, 0.36, 0.04);
          at(0, 1.90, 0.18, 0.04);
        }
      } else {
        for (let k = 0; k < 4; k++) {
          slotData.push({ p: [p[0] + f.inX * 0.030, 1.20 + k * 0.45, p[1] + f.inZ * 0.030], r: f.rot });
        }
      }
    }
  }

  // --------------------------------------------------------------- Instanzen
  const inst = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(0, it.r || 0, 0);
      if (it.s) dummy.scale.set(it.s[0], it.s[1], it.s[2]);
      else dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.name = name;
    root.add(im);
    return im;
  };

  inst(new THREE.BoxGeometry(1.06, 2.70, 0.05), copper, frameData, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.96, 2.58, 0.04), wallDark, panelData, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.06, 0.30, 0.02), lineGlow, slotData, 'lichtschlitze');
  inst(new THREE.BoxGeometry(1, 0.014, 0.20), patina, trimData, 'bodenrand_patina');
  inst(new THREE.BoxGeometry(0.06, H - 0.30, 0.04), copper, seamData, 'wandfugen');
  inst(new THREE.BoxGeometry(1, 1, 0.02), copper, lineData, 'paneel_lineament');

  // --------------------------------------------------------------- Eckpfeiler
  const pillarData = POLY.map((p) => ({
    p: [p[0] * 0.985, (H - 0.20) / 2, p[1] * 0.985],
    r: Math.PI / 4,
  }));
  inst(new THREE.BoxGeometry(0.36, H - 0.20, 0.36), pillarMat, pillarData, 'eckpfeiler');

  // --------------------------------------------------------------- Bodenintarsien / Energiekanäle
  for (let i = 0; i < 6; i++) {
    const phi = (i * Math.PI) / 3 + Math.PI / 6;
    const cx = 4.05 * Math.sin(phi), cz = 4.05 * Math.cos(phi);
    const m = box(0.20, 0.014, 3.30, patina, cx, 0.007, cz, `bodenkanal_${i}`);
    m.rotation.y = phi;
    const g = box(0.055, 0.018, 3.20, lineGlow, cx, 0.016, cz, `bodenkanal_leuchte_${i}`);
    g.rotation.y = phi;
  }
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3 + Math.PI / 6;
    const m = box(0.06, 0.012, 3.0, copper, 4.05 * Math.sin(phi), 0.009, 4.05 * Math.cos(phi), `boden_fuge_${i}`);
    m.rotation.y = phi;
  }
  // hexagonale Bodenintarsie um den Sockel
  const hexRing = add(new THREE.RingGeometry(2.35, 2.52, 6), copper, 0, 0.011, 0, 'boden_intarsie_hex');
  hexRing.rotation.x = -Math.PI / 2;
  const hexRing2 = add(new THREE.RingGeometry(2.70, 2.78, 6), patina, 0, 0.010, 0, 'boden_intarsie_hex_aussen');
  hexRing2.rotation.x = -Math.PI / 2;

  // --------------------------------------------------------------- Dreieckiger ZPM-Sockel + Stufe
  const tri = new THREE.Shape();
  tri.moveTo(0, -2.05);
  tri.lineTo(1.85, 1.15);
  tri.lineTo(-1.85, 1.15);
  tri.closePath();
  const plinthGeo = new THREE.ExtrudeGeometry(tri, { depth: PLINTH_H, bevelEnabled: false });
  plinthGeo.rotateX(Math.PI / 2);
  add(plinthGeo, stairMat, 0, PLINTH_H, 0, 'sockel_zpm_dreieck');

  const triTrim = new THREE.Shape();
  triTrim.moveTo(0, -2.13);
  triTrim.lineTo(1.93, 1.23);
  triTrim.lineTo(-1.93, 1.23);
  triTrim.closePath();
  const trimGeo = new THREE.ExtrudeGeometry(triTrim, { depth: 0.07, bevelEnabled: false });
  trimGeo.rotateX(Math.PI / 2);
  add(trimGeo, copper, 0, PLINTH_H + 0.07, 0, 'sockel_zpm_einfassung');

  const triRing = new THREE.Shape();
  triRing.moveTo(0, -1.62);
  triRing.lineTo(1.38, 0.80);
  triRing.lineTo(-1.38, 0.80);
  triRing.closePath();
  const ringGeo = new THREE.ExtrudeGeometry(triRing, { depth: 0.05, bevelEnabled: false });
  ringGeo.rotateX(Math.PI / 2);
  const ring = add(ringGeo, amberGlow, 0, PLINTH_H + 0.085, 0, 'sockel_zpm_leuchtring');

  // eine Stufe (0,25 m) vor der Dreiecksspitze
  box(2.40, 0.25, 0.40, stairMat, 0, 0.125, -2.25, 'stufe_zpm');
  box(2.44, 0.05, 0.08, copper, 0, 0.245, -2.44, 'stufe_zpm_kante');

  // --------------------------------------------------------------- Deckenfelder und Lichtkranz
  const deckField = [];
  for (let i = 0; i < 8; i++) {
    const phi = (i * Math.PI) / 4;
    deckField.push({ p: [4.35 * Math.sin(phi), H - 0.03, 4.35 * Math.cos(phi)], r: phi });
  }
  const deckMesh = inst(new THREE.BoxGeometry(1.5, 0.05, 0.9), glowMat, deckField, 'decke_lichtfelder');

  const cove = [];
  for (const w of WALLS) {
    const f = wallFrame(w);
    const p0 = wallPoint(w, 0.05), p1 = wallPoint(w, 0.95);
    cove.push({
      p: [(p0[0] + p1[0]) / 2 + f.inX * 0.18, H - 0.04, (p0[1] + p1[1]) / 2 + f.inZ * 0.18],
      r: f.rot,
      s: [0.90 * f.Lw, 1, 1],
    });
  }
  inst(new THREE.BoxGeometry(1, 0.05, 0.09), glowMat, cove, 'decke_lichtkranz');

  const deckMedallion = add(new THREE.CylinderGeometry(2.25, 2.25, 0.05, 6), glowMat, 0, H - 0.055, 0, 'decke_medaillon_sechseck');
  const deckTri = add(new THREE.CylinderGeometry(1.55, 1.55, 0.06, 3), copper, 0, H - 0.04, 0, 'decke_medaillon_dreieck');
  deckTri.rotation.y = Math.PI;

  // --------------------------------------------------------------- Türöffnung: Zarge / Rahmen
  const frameZ = -AZ - T / 2;
  box(DOOR_W + 0.18, 0.14, T + 0.10, copper, 0, DOOR_H, frameZ, 'tuer_einfassung_oben');
  for (const s of [-1, 1]) {
    box(0.14, DOOR_H, T + 0.10, copper, s * (DOOR_W / 2 + 0.03), DOOR_H / 2, frameZ, `tuer_einfassung_${s < 0 ? 'links' : 'rechts'}`);
  }
  // Türpaneel-Felder seitlich der Öffnung (Schieberichtung frei)
  for (const s of [-1, 1]) {
    box(1.10, 1.70, 0.06, wallDark, s * 2.05, 1.75, -AZ + 0.04, `tuer_seitenfeld_${s < 0 ? 'links' : 'rechts'}`);
  }

  // --------------------------------------------------------------- Objektplätze
  // Dreifach-ZPM-Aufnahmeplattform im Zentrum, auf dem erhöhten Sockel
  empty('PLACE_OBJ-037', 0, PLINTH_H, 0, Math.PI);
  // Drei Zero-Point-Module in den Aufnahmepunkten der Plattform (Fuß auf Plattformoberkante)
  empty('PLACE_OBJ-005', -0.45, PLINTH_H + 1.10, 0, 0);
  empty('PLACE_OBJ-005_2', 0.00, PLINTH_H + 1.10, 0, 0);
  empty('PLACE_OBJ-005_3', 0.45, PLINTH_H + 1.10, 0, 0);
  // Stadtschild (Emitter-System) an der Ostwand, Vorderseite in den Raum
  empty('PLACE_OBJ-044', AX - 0.62, 0, 2.20, -Math.PI / 2);
  // Antiker Sternenantrieb an der Westwand
  empty('PLACE_OBJ-045', -AX + 0.44, 0, -0.60, Math.PI / 2);
  // Antiker Tarnfeld-Generator an der Nordwand
  empty('PLACE_OBJ-055', 2.60, 0, AZ - 0.81, Math.PI);
  // Antike Hauptschiebetür im Südeingang (Vorderseite +Z zeigt in den Raum)
  empty('PLACE_OBJ-091', 0, 0, frameZ, 0);

  // --------------------------------------------------------------- Türanschluss
  empty('DOOR_sued', 0, 0, frameZ, Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Korridor am Zentralen Turm',
    raum: 'ATL-049',
  });

  // --------------------------------------------------------------- Licht
  const lampPos = [
    [3.6, H - 0.40, 3.6], [-3.6, H - 0.40, 3.6],
    [3.6, H - 0.40, -3.6], [-3.6, H - 0.40, -3.6],
    [0, H - 0.40, -5.2], [0, H - 0.40, 5.2],
    [5.4, H - 0.40, 0], [-5.4, H - 0.40, 0],
  ];
  lampPos.forEach((p, i) => {
    const warm = i === 4;
    const o = empty(`LAMP_${String(i + 1).padStart(2, '0')}`, p[0], p[1], p[2], 0, {
      color: warm ? '#ffd8a0' : '#9fd8ff',
      intensity: warm ? 9 : 7,
      distance: 13,
    });
    const pl = new THREE.PointLight(o.userData.color, o.userData.intensity, o.userData.distance, 2);
    pl.name = 'lichtpunkt';
    o.add(pl);
  });
  // warmes Kernlicht direkt über der Aufnahmeplattform
  const core = empty('LAMP_09', 0, H - 0.60, 0, 0, { color: '#ffd8a0', intensity: 8, distance: 9 });
  const coreLight = new THREE.PointLight(core.userData.color, core.userData.intensity, core.userData.distance, 2);
  coreLight.name = 'lichtpunkt';
  core.add(coreLight);

  // --------------------------------------------------------------- Kollision
  colBox(13.0, 0.20, 13.0, 0, -0.10, 0, 'COL_boden');
  colBox(13.6, 0.30, 13.6, 0, H + 0.15, 0, 'COL_decke');
  for (const w of WALLS) {
    const f = wallFrame(w);
    const mk = (t0, t1, y0, y1, name) => {
      const len = (t1 - t0) * f.Lw;
      const p0 = wallPoint(w, t0), p1 = wallPoint(w, t1);
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      const c = colBox(len, y1 - y0, T, mx + f.outX * T / 2, (y0 + y1) / 2, mz + f.outZ * T / 2, name);
      c.rotation.y = f.rot;
    };
    if (w.door) {
      const tL = (-DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0]);
      const tR = (DOOR_W / 2 - w.a[0]) / (w.b[0] - w.a[0]);
      mk(0, tL, 0, H, `COL_wand_${w.name}_links`);
      mk(tR, 1, 0, H, `COL_wand_${w.name}_rechts`);
      mk(tL, tR, DOOR_H, H, `COL_sturz_${w.name}`);
    } else {
      mk(0, 1, 0, H, `COL_wand_${w.name}`);
    }
  }
  for (const p of POLY) {
    colBox(0.42, H - 0.20, 0.42, p[0] * 0.985, (H - 0.20) / 2, p[1] * 0.985,
      `COL_pfeiler_${p[0].toFixed(1)}_${p[1].toFixed(1)}`);
  }
  colBox(3.60, PLINTH_H, 3.10, 0, PLINTH_H / 2, 0.10, 'COL_sockel_zpm');
  colBox(2.40, 0.25, 0.40, 0, 0.125, -2.25, 'COL_stufe_zpm');
  colBox(1.47, 1.10, 1.28, 0, PLINTH_H + 0.55, 0, 'COL_plattform_zpm');

  // --------------------------------------------------------------- Animation
  let t = 0, last = null;
  const animate = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.55 + Math.sin(t * 0.8) * 0.14;
    amberGlow.emissiveIntensity = 1.75 + Math.sin(t * 0.8 + 1.2) * 0.20;
    if (deckMesh) deckMesh.material.emissiveIntensity = 0.9 + Math.sin(t * 0.6 + 0.4) * 0.08;
  };
  if (slotMesh) slotMesh.onBeforeRender = animate;
  else root.onBeforeRender = animate;

  root.userData.raum = {
    id: 'ATL-038',
    name: 'raum_zpm_room',
    flaeche: 161,
    hoehe: H,
    grundriss: 'achteck',
    zugang: 'DOOR_sued',
  };
  return root;
}

// Raum ATL-009: Krankenstation / Infirmary – Inner City, Etage 4.
// 1 Einheit = 1 m, +Y oben, Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Hülle: nur Architektur und Platzierungspunkte für die Objektliste.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_infirmary',
  art: 'Raum',
  masse: 'ca. 21,9 m × 12,3 m (261 m²), lichte Höhe 4,0 m',
  wohin: 'Inner City, 4. Etage – zentraler medizinischer Trakt mit OP- und Isolationsanschlüssen',
  benutzen: 'Erstversorgung, Diagnostik, Überwachung und Quarantäne; zentrale Überwachungsinsel sowie strahlenförmige Patientenplätze bleiben frei',
  lichter: '6 LAMP_ (eisblau, indirekt), zusätzlich eisblaue Lichtschlitze, Deckenfelder und warme Akzentfelder',
  animation: 'Lichtschlitze und Deckenfelder atmen subtil; Beleuchtung über userData.api dimmbar',
  quelle: 'Beschreibung ATL-009, Screencaps „Quarantine“ und Atlantis-Setpläne „Halls & Corridors“ (Quellenklasse A/B)',
};

export const varianten = [
  { label: 'Krankenstation – Hauptsaal mit OP-/Isolationsanschlüssen', opts: {} },
];

const H = 4.0;          // lichte Höhe
const T = 0.3;          // Wanddicke
const DOOR_W = 2.4;     // Türöffnungsbreite
const DOOR_H = 3.0;     // Türöffnungshöhe
const SILL = 0.95;      // Fensterbrüstung
const HEAD = 3.25;      // Fenstersturz

// Oktogonale Hülle (Polygon ist die Wand-Mittelachse), Fläche ca. 261 m².
const POLY = [
  [-8.6, -6.2], [8.6, -6.2], [11.0, -3.8], [11.0, 3.8],
  [8.6, 6.2], [-8.6, 6.2], [-11.0, 3.8], [-11.0, -3.8],
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_infirmary';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glowMat = kit('glow');
  const glassMat = kit('glass');
  glassMat.transparent = true;
  glassMat.opacity = 0.34;
  glassMat.depthWrite = false;

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.62, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_infirmary', color: 0xdff4ff, emissive: 0x9fd8ff,
    emissiveIntensity: 1.45, roughness: 0.35, metalness: 0.1,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'lichtfeld_amber', color: 0xffe4bd, emissive: 0xffd8a0,
    emissiveIntensity: 0.85, roughness: 0.45,
  });

  // --------------------------------------------------------------- Hilfsfunktionen
  const addMesh = (geo, mat, x, y, z, name, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, parent = root) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, parent);

  const dummy = new THREE.Object3D();
  const instanced = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(0, it.r || 0, 0);
      const s = it.s || [1, 1, 1];
      dummy.scale.set(s[0], s[1], s[2]);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
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

  const col = (name, w, h, d, x, y, z, parent = root, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.visible = false;
    parent.add(m);
    return m;
  };

  const polygonShape = (pts) => {
    const s = new THREE.Shape();
    pts.forEach((p, i) => (i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])));
    s.closePath();
    return s;
  };

  // --------------------------------------------------------------- Boden
  const floorGeo = new THREE.ExtrudeGeometry(polygonShape(POLY), { depth: 0.1, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  const floor = addMesh(floorGeo, floorMat, 0, -0.1, 0, 'boden');
  floor.receiveShadow = true;

  // Bodenintarsie der freien Überwachungsinsel (Kupfer / Patina).
  const ring = addMesh(new THREE.RingGeometry(2.30, 2.40, 72), copper, 0, 0.008, 0, 'boden_intarsie_ring');
  ring.rotation.x = -Math.PI / 2;
  const ring2 = addMesh(new THREE.RingGeometry(1.60, 1.66, 60), patina, 0, 0.007, 0, 'boden_intarsie_innen');
  ring2.rotation.x = -Math.PI / 2;

  const spokes = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    spokes.push({ p: [1.66 * Math.cos(a), 0.008, 1.66 * Math.sin(a)], r: -a });
  }
  instanced(new THREE.BoxGeometry(0.60, 0.008, 0.05), copper, spokes, 'boden_intarsie_strahlen');

  // Bodenfugen im 1,2-m-Raster (nur im sicheren Innenbereich).
  const seamsX = [], seamsZ = [];
  for (let x = -7.2; x <= 7.2 + 0.001; x += 1.2) seamsX.push({ p: [x, 0.004, 0], r: 0 });
  for (let z = -4.8; z <= 4.8 + 0.001; z += 1.2) seamsZ.push({ p: [0, 0.004, z], r: 0 });
  instanced(new THREE.BoxGeometry(0.016, 0.006, 8.0), copper, seamsX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(18.0, 0.006, 0.016), copper, seamsZ, 'boden_fugen_z');

  // Umlaufender grün-kupferner Rand entlang der Hülle.
  {
    const imP = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.012, 0.18), patina, POLY.length);
    const imC = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.010, 0.045), copper, POLY.length);
    for (let i = 0; i < POLY.length; i++) {
      const a = POLY[i], b = POLY[(i + 1) % POLY.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      const nx = -dz / len, nz = dx / len;
      const rot = -Math.atan2(dz, dx);
      dummy.position.set((a[0] + b[0]) / 2 + nx * 0.13, 0.006, (a[1] + b[1]) / 2 + nz * 0.13);
      dummy.rotation.set(0, rot, 0); dummy.scale.set(len - 0.24, 1, 1); dummy.updateMatrix();
      imP.setMatrixAt(i, dummy.matrix);
      dummy.position.set((a[0] + b[0]) / 2 + nx * 0.225, 0.009, (a[1] + b[1]) / 2 + nz * 0.225);
      dummy.rotation.set(0, rot, 0); dummy.scale.set(len - 0.24, 1, 1); dummy.updateMatrix();
      imC.setMatrixAt(i, dummy.matrix);
    }
    imP.name = 'boden_rand_patina';
    imC.name = 'boden_rand_kupfer';
    root.add(imP); root.add(imC);
  }

  // --------------------------------------------------------------- Wände / Türen / Fenster
  const panelData = [], frameData = [], slotData = [];
  const doorRecords = [];

  const buildWall = (a, b, door) => {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const nx = -uz, nz = ux;                       // Innennormale (+ = Rauminnenes)
    const rot = -Math.atan2(dz, dx);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;

    const grp = new THREE.Group();
    grp.name = `wandgruppe_${a[0].toFixed(1)}_${a[1].toFixed(1)}`;
    grp.position.set(mx, 0, mz);
    grp.rotation.y = rot;
    root.add(grp);

    const localBox = (w, h, d, mat, x, y, z, name) => box(w, h, d, mat, x, y, z, name, grp);
    const localCol = (name, w, h, d, x, y, z) => col(name, w, h, d, x, y, z, grp);

    const s = -len / 2, e = len / 2;
    const oc = door ? door.dist - len / 2 : 0;
    const o1 = oc - DOOR_W / 2, o2 = oc + DOOR_W / 2;

    const intervals = door ? [[s, o1], [o2, e]] : [[s, e]];
    intervals.forEach((iv, k) => {
      const w = iv[1] - iv[0];
      if (w <= 0.01) return;
      const cx = (iv[0] + iv[1]) / 2;
      localBox(w, H, T, wall, cx, H / 2, 0, `wand_${k}`);
      localCol(`COL_wand_${k}`, w, H, T, cx, H / 2, 0);
      localBox(w, 0.15, 0.05, copper, cx, 0.075, T / 2 + 0.02, `sockel_${k}`);
      localBox(w, 0.10, 0.06, copper, cx, H - 0.05, T / 2 + 0.025, `gesims_${k}`);
      // medizinischer Lichtstreifen auf Augenhöhe der Geräte (2,45 m)
      if (w > 0.8) localBox(w - 0.1, 0.05, 0.03, lineGlow, cx, 2.45, T / 2 + 0.015, `lichtband_${k}`);
    });

    if (door) {
      localBox(DOOR_W, H - DOOR_H, T, wall, oc, DOOR_H + (H - DOOR_H) / 2, 0, 'wand_sturz');
      localCol('COL_wand_sturz', DOOR_W, H - DOOR_H, T, oc, DOOR_H + (H - DOOR_H) / 2, 0);
      // Bronzene Zarge (3,34 × 3,74 m), Flügel schieben je 1,2 m in die Seitenwand.
      localBox(0.12, DOOR_H, 0.42, copper, o1 - 0.06, DOOR_H / 2, 0, 'tuerzarge_links');
      localBox(0.12, DOOR_H, 0.42, copper, o2 + 0.06, DOOR_H / 2, 0, 'tuerzarge_rechts');
      localBox(DOOR_W + 0.24, 0.12, 0.42, copper, oc, DOOR_H + 0.06, 0, 'tuerzarge_oben');
      // abgeschrägte Ecken der polygonalen Türkontur
      const cham = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.42), copper);
      cham.position.set(o1 - 0.06, DOOR_H - 0.16, 0);
      cham.rotation.z = Math.PI / 4;
      cham.name = 'tuerzarge_fase_links';
      grp.add(cham);
      const cham2 = cham.clone();
      cham2.position.x = o2 + 0.06;
      cham2.rotation.z = -Math.PI / 4;
      cham2.name = 'tuerzarge_fase_rechts';
      grp.add(cham2);

      const gx = a[0] + ux * door.dist, gz = a[1] + uz * door.dist;
      doorRecords.push({
        ...door, gx, gz,
        inRot: Math.atan2(nx, nz),
        outRot: Math.atan2(-nx, -nz),
      });
    }

    // Plant-on-Paneele und Lichtschlitze je 1,2-m-Feld.
    const fields = Math.max(1, Math.floor(len / 1.2));
    const step = len / fields;
    for (let i = 0; i < fields; i++) {
      const c = s + (i + 0.5) * step;
      if (door && c > o1 - 0.15 && c < o2 + 0.15) continue;
      const wp = [mx + ux * c, 0, mz + uz * c];
      if (i % 2 === 0) {
        panelData.push({ p: [wp[0] + nx * 0.168, 1.62, wp[2] + nz * 0.168], r: rot });
        frameData.push({ p: [wp[0] + nx * 0.175, 1.62, wp[2] + nz * 0.175], r: rot });
      } else {
        for (let k = 0; k < 4; k++) {
          slotData.push({ p: [wp[0] + nx * 0.165, 0.95 + k * 0.44, wp[2] + nz * 0.165], r: rot });
        }
      }
    }
  };

  const buildWindow = (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const rot = -Math.atan2(dz, dx);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    const grp = new THREE.Group();
    grp.name = 'fensterfront';
    grp.position.set(mx, 0, mz);
    grp.rotation.y = rot;
    root.add(grp);

    const glassH = HEAD - SILL;
    // Brüstung und Sturz als massive Wandteile
    box(len, SILL, T, wall, 0, SILL / 2, 0, 'fenster_brustung', grp);
    box(len, H - HEAD, T, wall, 0, HEAD + (H - HEAD) / 2, 0, 'fenster_sturz_wand', grp);
    col('COL_fenster_brustung', len, SILL, T, 0, SILL / 2, 0, grp);
    col('COL_fenster_sturz', len, H - HEAD, T, 0, HEAD + (H - HEAD) / 2, 0, grp);
    col('COL_fenster_glas', len, glassH, T, 0, SILL + glassH / 2, 0, grp);

    // Glasfläche (halbtransparent) + Buntglas-Einsatz in der Mitte
    box(len - 0.24, glassH - 0.18, 0.05, glassMat, 0, SILL + glassH / 2, 0, 'fenster_glas', grp);
    box(Math.min(2.0, len - 0.5), glassH - 0.3, 0.07, stained, 0, SILL + glassH / 2, 0.02, 'fenster_buntglas', grp);

    // Rahmen
    box(len, 0.18, 0.34, copper, 0, SILL + 0.03, 0, 'fenster_schwelle', grp);
    box(len, 0.16, 0.34, copper, 0, HEAD - 0.02, 0, 'fenster_sturzrahmen', grp);
    box(0.18, H, 0.34, copper, -len / 2 + 0.09, H / 2, 0, 'fenster_pfosten_links', grp);
    box(0.18, H, 0.34, copper, len / 2 - 0.09, H / 2, 0, 'fenster_pfosten_rechts', grp);
    box(0.11, glassH, 0.24, copper, 0, SILL + glassH / 2, 0, 'fenster_mittelpfosten', grp);
    box(len - 0.3, 0.08, 0.22, copper, 0, SILL + glassH * 0.62, 0, 'fenster_querrahmen', grp);
    // Fensterbank
    box(len - 0.3, 0.07, 0.42, copper, 0, SILL + 0.07, 0.06, 'fenster_bank', grp);
  };

  // Buntglas-Canvas (Fallback: KIT_glass)
  let stained = glassMat;
  if (typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = '#0b3342'; g.fillRect(0, 0, 256, 256);
      const cols = ['#1c7180', '#2f9d93', '#c08a2e', '#e0a33a', '#b84c2a', '#173f57'];
      g.globalAlpha = 0.8;
      for (let i = 0; i < 26; i++) {
        g.fillStyle = cols[i % cols.length];
        const w = 18 + (i % 4) * 9, h = 16 + ((i * 7) % 5) * 10;
        const x = (i * 37) % 240, y = (i * 53) % 240;
        g.beginPath();
        g.moveTo(x + w / 2, y); g.lineTo(x + w, y + h / 2);
        g.lineTo(x + w / 2, y + h); g.lineTo(x, y + h / 2);
        g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
      g.strokeStyle = '#9fd8ff'; g.lineWidth = 3;
      g.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        g.moveTo(128 - 78 * Math.cos(a), 128 - 78 * Math.sin(a));
        g.lineTo(128 + 78 * Math.cos(a), 128 + 78 * Math.sin(a));
        g.moveTo(128 + 46 * Math.cos(a), 128 + 46 * Math.sin(a));
        g.lineTo(128 + 46 * Math.cos(a + 0.9) + 18 * Math.cos(a + 1.6),
                 128 + 46 * Math.sin(a) + 18 * Math.sin(a + 1.6));
      }
      g.stroke();
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      stained = new THREE.MeshStandardMaterial({
        name: 'buntglas_infirmary', map: tex, emissive: 0x1c5f6b,
        emissiveIntensity: 0.45, roughness: 0.22, metalness: 0.1,
        transparent: true, opacity: 0.88,
      });
    } catch (e) { /* KIT_glass bleibt Fallback */ }
  }

  const seg = (i) => [POLY[i], POLY[(i + 1) % POLY.length]];
  buildWall(...seg(0), { name: 'haupt', dist: 8.6, ziel: 'Innenstadt-Korridor / Haupteingang' });
  buildWindow(...seg(1));
  buildWall(...seg(2), { name: 'isolation', dist: 2.6, ziel: 'Isolationsbereich / Quarantäne' });
  buildWindow(...seg(3));
  buildWall(...seg(4), { name: 'op', dist: 8.6, ziel: 'OP-Vorbereitung / Operationsbereich' });
  buildWindow(...seg(5));
  buildWall(...seg(6), { name: 'intensiv', dist: 2.6, ziel: 'Intensivbehandlung' });
  buildWindow(...seg(7));

  instanced(new THREE.BoxGeometry(1.0, 2.6, 0.035), wallDark, panelData, 'wandpaneele');
  instanced(new THREE.BoxGeometry(1.12, 2.76, 0.05), copper, frameData, 'wandpaneel_rahmen');
  const slotMesh = instanced(new THREE.BoxGeometry(0.07, 0.32, 0.03), lineGlow, slotData, 'lichtschlitze');

  // Türen und Anschlussmarker
  doorRecords.forEach((d, i) => {
    empty(`DOOR_${d.name}`, d.gx, 0, d.gz, d.outRot,
      { breite: DOOR_W, hoehe: DOOR_H, ziel: d.ziel });
    empty(i === 0 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${i + 1}`, d.gx, 0, d.gz, d.inRot);
  });

  // --------------------------------------------------------------- Behandlungsnischen
  const partition = (x, name) => {
    const z0 = 2.8, z1 = 5.9, len = z1 - z0, hz = (z0 + z1) / 2;
    const grp = new THREE.Group();
    grp.name = `nische_${name}`;
    grp.position.set(x, 0, hz);
    root.add(grp);
    box(0.2, 1.25, len, wallDark, 0, 0.625, 0, 'nische_unterteil', grp);
    box(0.07, 2.0, len - 0.16, stained, 0, 2.3, 0, 'nische_glas', grp);
    box(0.2, 0.66, len, wallDark, 0, 3.67, 0, 'nische_kopf', grp);
    box(0.26, 0.14, len, copper, 0, 1.3, 0, 'nische_rahmen_mitte', grp);
    box(0.26, 0.14, len, copper, 0, 3.3, 0, 'nische_rahmen_oben', grp);
    box(0.26, 0.10, len - 0.2, lineGlow, 0, 3.38, 0, 'nische_lichtleiste', grp);
    for (const zz of [-len / 2 + 0.09, 0, len / 2 - 0.09]) {
      box(0.26, H, 0.18, copper, 0, H / 2, zz, 'nische_pfosten');
    }
    col('COL_nische', 0.22, H, len, x, H / 2, hz);
  };
  partition(-5.0, 'links');
  partition(5.0, 'rechts');

  // --------------------------------------------------------------- Säulen
  const colPos = [[-8.6, -3.0], [8.6, -3.0], [-8.6, 1.6], [8.6, 1.6]];
  colPos.forEach((p) => {
    box(0.46, 0.22, 0.46, copper, p[0], 0.11, p[1], 'saeulen_sockel');
    box(0.34, H - 0.4, 0.34, pillar, p[0], H / 2 - 0.1, p[1], 'saeule');
    box(0.5, 0.18, 0.5, copper, p[0], H - 0.16, p[1], 'saeulen_kapital');
    col('COL_saeule', 0.5, H - 0.4, 0.5, p[0], (H - 0.4) / 2, p[1]);
  });

  // --------------------------------------------------------------- Decke und Deckenfelder
  const ceilGeo = new THREE.ExtrudeGeometry(polygonShape(POLY), { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  addMesh(ceilGeo, ceilingMat, 0, H, 0, 'decke_haupfeld');

  const ceilIce = [], ceilWarm = [], beamsX = [], beamsZ = [];
  for (let x = -7.2; x <= 7.2 + 0.001; x += 4.8) {
    for (let z = -4.2; z <= 4.2 + 0.001; z += 4.2) {
      const warm = (Math.abs(x) > 4 && z > 2) || (x < -4 && z < -2);
      (warm ? ceilWarm : ceilIce).push({ p: [x, H - 0.03, z], r: 0 });
    }
  }
  for (let x = -6; x <= 6 + 0.001; x += 4.8) beamsX.push({ p: [x, H - 0.05, 0], r: 0 });
  for (let z = -4.2; z <= 4.2 + 0.001; z += 4.2) beamsZ.push({ p: [0, H - 0.05, z], r: 0 });
  instanced(new THREE.BoxGeometry(0.16, 0.10, 9.6), wallDark, beamsX, 'decke_rippen_x');
  instanced(new THREE.BoxGeometry(19.2, 0.10, 0.16), wallDark, beamsZ, 'decke_rippen_z');
  instanced(new THREE.BoxGeometry(2.10, 0.05, 1.40), glowMat, ceilIce, 'decke_lichtfelder');
  instanced(new THREE.BoxGeometry(1.70, 0.05, 1.10), amberGlow, ceilWarm, 'decke_lichtfelder_amber');

  // Deckenrosette über der freien Überwachungsinsel
  const rosette = addMesh(new THREE.RingGeometry(1.05, 1.18, 48), copper, 0, H - 0.06, 0, 'decke_rosette');
  rosette.rotation.x = -Math.PI / 2;
  const rosArms = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rosArms.push({ p: [0.62 * Math.cos(a), H - 0.055, 0.62 * Math.sin(a)], r: -a });
  }
  instanced(new THREE.BoxGeometry(0.86, 0.03, 0.05), lineGlow, rosArms, 'decke_rosette_strahlen');

  // --------------------------------------------------------------- Objektplätze
  // Krankenbetten radial um die freie Überwachungsinsel (Vorderseite zur Insel).
  const bedAngles = [0, 60, 120, 180, 240, 300];
  const bedR = 4.8;
  bedAngles.forEach((a, i) => {
    const rad = (a * Math.PI) / 180;
    const x = bedR * Math.cos(rad), z = bedR * Math.sin(rad);
    const rot = Math.atan2(-Math.cos(rad), -Math.sin(rad));
    empty(i === 0 ? 'PLACE_OBJ-015' : `PLACE_OBJ-015_${i + 1}`, x, 0, z, rot);
  });
  // Behandlungsplatz in der linken Nische
  empty('PLACE_OBJ-015_7', -6.9, 0, 4.3, Math.PI / 2);

  // Scanner in der rechten Intensivnische, zur Insel gewandt.
  empty('PLACE_OBJ-006', 7.4, 0, 4.3, -Math.PI / 2);

  // Antikes Heilgerät (Telchaks Gerät) – freistehend am Westrand.
  empty('PLACE_OBJ-050', -9.7, 0, -4.1, 0.35);

  // Biometrische Wandleser (mind. 1,2 m von der Öffnung entfernt, Wandinnenseite).
  empty('PLACE_OBJ-051', -3.0, 1.2, -6.05, 0);
  empty('PLACE_OBJ-051_2', 10.85, 1.2, 0.6, -Math.PI / 2);
  empty('PLACE_OBJ-051_3', -10.85, 1.2, -0.6, Math.PI / 2);

  // Lebens-erhaltungs-Atmosphärenregler an der Wand (Rückseite an der Wand).
  empty('PLACE_OBJ-054', -6.4, 0, 6.05, Math.PI);
  empty('PLACE_OBJ-054_2', -10.85, 0, -3.0, Math.PI / 2);

  // Antike Daten-Pads (flach am Boden).
  empty('PLACE_OBJ-056', -7.6, 0, -4.6, 0.2);
  empty('PLACE_OBJ-056_2', 7.6, 0, -4.6, -0.2);
  empty('PLACE_OBJ-056_3', -2.0, 0, -5.6, 0.05);

  // Lebenszeichendetektoren (Antiker-Handscanner) neben Behandlungsplätzen.
  empty('PLACE_OBJ-065', 3.2, 0, -1.2, 0.4);
  empty('PLACE_OBJ-065_2', -3.2, 0, 1.2, -0.4);
  empty('PLACE_OBJ-065_3', -6.0, 0, 2.6, 0.2);

  // Defibrillatoren der Erde in den Randzonen.
  empty('PLACE_OBJ-066', 5.6, 0, 1.6, 0.5);
  empty('PLACE_OBJ-066_2', -5.6, 0, -1.6, -0.5);
  empty('PLACE_OBJ-066_3', -6.9, 0, 2.6, 0.3);

  // Tragbare Notfall-Sanitätsrucksäcke.
  empty('PLACE_OBJ-067', 8.8, 0, -2.0, -0.4);
  empty('PLACE_OBJ-067_2', -8.8, 0, -2.0, 0.25);

  // Koma- und Narkosemonitoren an den Wänden.
  empty('PLACE_OBJ-068', -10.85, 1.5, -1.5, Math.PI / 2);
  empty('PLACE_OBJ-068_2', 10.85, 1.5, 2.4, -Math.PI / 2);
  empty('PLACE_OBJ-068_3', 2.6, 1.5, 6.05, Math.PI);
  empty('PLACE_OBJ-068_4', -4.9, 1.5, 4.3, -Math.PI / 2);

  // --------------------------------------------------------------- Lichtpunkte
  const lampPos = [
    [-6.2, 3.45, -3.4], [6.2, 3.45, -3.4],
    [-6.2, 3.45, 2.6], [6.2, 3.45, 2.6],
    [0, 3.50, -5.0], [0, 3.50, 3.8],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0,
      { color: '#9fd8ff', intensity: 10, distance: 15 });
  });

  // --------------------------------------------------------------- Kollision Hülle
  col('COL_boden', 22.0, 0.2, 12.4, 0, -0.1, 0);
  col('COL_decke', 22.0, 0.3, 12.4, 0, H + 0.15, 0);

  // --------------------------------------------------------------- API / Aktionen / Animation
  let dimmed = false;
  const baseGlow = 1.45;
  const applyLight = () => {
    lineGlow.emissiveIntensity = dimmed ? 0.5 : baseGlow;
    amberGlow.emissiveIntensity = dimmed ? 0.3 : 0.85;
    glowMat.emissiveIntensity = dimmed ? 0.35 : 1.0;
  };

  root.userData.raum = { id: 'ATL-009', flaeche: 261.3, hoehe: H, beleuchtung: 6 };
  root.userData.api = {
    setLicht: (stark) => {
      dimmed = !stark;
      applyLight();
      return !dimmed;
    },
    getLicht: () => !dimmed,
  };
  root.userData.actions = [
    {
      id: 'INF_LICHT_MODUS',
      label: 'Beleuchtung der Krankenstation umschalten',
      run: () => {
        dimmed = !dimmed;
        applyLight();
        return [{
          id: 'INF_LICHT_MODUS',
          label: dimmed ? 'Normale Beleuchtung einschalten' : 'Beleuchtung dimmen',
          run: () => root.userData.actions[0].run(),
        }];
      },
    },
  ];

  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    if (!dimmed) lineGlow.emissiveIntensity = baseGlow + Math.sin(t * 0.7) * 0.12;
  };

  return root;
}

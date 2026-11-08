// Raum ATL-010: Operationsraum / Operating Room
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Steriler, sechseckiger Spezialraum; Haupteingang an der Seite -Z,
// zweite Schiebetür in der +X-Flanke zur Infirmary (Krankenstation).
import * as THREE from 'three';

const H = 3.8;          // lichte Deckenhöhe
const T = 0.3;          // Wanddicke
const DW = 2.4;         // Türbreite
const DH = 3.0;         // Türhöhe

// Innenraum-Sechseck (gegen den Uhrzeigersinn in der x/z-Ebene), ca. 69.9 m²
const V = [
  [-3.1, -3.8],
  [ 3.1, -3.8],
  [ 6.1,  0.0],
  [ 3.1,  3.8],
  [-3.1,  3.8],
  [-6.1,  0.0],
];

export const steckbrief = {
  name: 'raum_operating_room',
  art: 'Raum',
  masse: '12.2 m × 7.6 m (Sechseck, ca. 70 m²) × 3.8 m lichte Höhe',
  wohin: 'Inner City, Etage 4, direkt an die Krankenstation (Infirmary) angrenzend',
  benutzen: 'steriler Operationssaal; Operationstisch, Heilgerät, Handscanner und Defibrillator werden später an die PLACE_-Punkte gesetzt',
  lichter: '4 LAMP_-Punkte (eisblau), warmes OP-Deckenfeld über dem Operationstisch, Deckenfeldbeleuchtung und sterile Wandlichtbänder',
  animation: 'sanftes Atmen der Operationsfeld- und Wandleuchten',
  quelle: 'Produktions-Setplan "Operating Room" (Mallozzi, Blade FX) und Verbindungsgrundriss "Infirmary O/S"',
};

export const varianten = [
  { label: 'Operationsraum (Standard)', opts: {} },
];

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_operating_room';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glassMat = kit('glass');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const sterile = new THREE.MeshStandardMaterial({
    name: 'wand_steril', color: 0xd9e6e4, metalness: 0.05, roughness: 0.38,
  });
  const sterileDark = new THREE.MeshStandardMaterial({
    name: 'wand_steril_panel', color: 0x9fb8bb, metalness: 0.18, roughness: 0.32,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xe8f8ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7,
  });
  const opLightMat = new THREE.MeshStandardMaterial({
    name: 'lichtfeld_op', color: 0xfff4e2, emissive: 0xffd8a0, emissiveIntensity: 1.9,
  });

  const add = (geo, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  // lokale Achsen der Wandstücke: x = Länge der Wand, z = Dicke
  const box = (w, h, d, mat, x, y, z, name, rotY = 0) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, rotY);
  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };
  const dummy = new THREE.Object3D();
  // Instanzen mit Einheitsgeometrie + Skalierung (lange Streifen bleiben so klein wie möglich)
  const instanced = (geo, mat, items, name) => {
    if (!items.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(0, it.rot || 0, 0);
      dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Grundrissdaten
  const segs = [];
  for (let i = 0; i < V.length; i++) {
    const a = V[i], b = V[(i + 1) % V.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx);
    segs.push({
      i, a, b, dx, dz, len, ang,
      u: [dx / len, dz / len],
      n: [dz / len, -dx / len],       // Auswärtsnormale
      wallRot: -ang,                  // lokales x liegt entlang der Wand, lokales +z zeigt in den Raum
      door: null,
      windows: [],
    });
  }
  // Tür 0: Haupteingang (-Z-Flanke), Tür 1: Verbindung zur Infirmary (+X-Flanke)
  segs[0].door = { ziel: 'Infirmary / Operationskorridor', name: 'DOOR_haupt_eingang' };
  segs[1].door = { ziel: 'Infirmary (Krankenstation)', name: 'DOOR_infirmary' };
  // Fensterfront in der Rückwand (+Z), zwei 1.2-m-Fenster
  segs[3].windows.push({ d: 1.7, w: 1.2, y0: 1.5, y1: 3.0 });
  segs[3].windows.push({ d: 4.5, w: 1.2, y0: 1.5, y1: 3.0 });

  const pt = (s, d) => [s.a[0] + s.u[0] * d, s.a[1] + s.u[1] * d];
  // Sechseck-Hilfsfunktionen für die Boden-Intarsien (strikt innerhalb der Hülle)
  const xMaxAt = (z) => 6.1 - (3 / 3.8) * Math.abs(z);
  const zMaxAt = (x) => (Math.abs(x) <= 3.1 ? 3.8 : 3.8 * (6.1 - Math.abs(x)) / 3.0);

  // ------------------------------------------------------------------ Boden
  const floorShape = new THREE.Shape();
  V.forEach((p, i) => (i ? floorShape.lineTo(p[0], p[1]) : floorShape.moveTo(p[0], p[1])));
  floorShape.closePath();
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.25, bevelEnabled: false });
  floorGeo.rotateX(Math.PI / 2);                // Form y -> Welt z, Extrusion -> -Y
  const floorMesh = add(floorGeo, floorMat, 0, 0, 0, 'boden');
  floorMesh.receiveShadow = true;

  // Plattenfugen: exakt auf das Sechseck geklemmt (mit Sicherheitsabstand zur Kante)
  const seamH = [], seamV = [];
  for (let z0 = -2.4; z0 <= 2.4 + 0.001; z0 += 1.2) {
    const xm = xMaxAt(z0) - 0.35;
    if (xm > 0.5) seamH.push({ p: [0, 0.005, z0], rot: 0, sx: 2 * xm });
  }
  for (let x0 = -3.6; x0 <= 3.6 + 0.001; x0 += 1.2) {
    const zm = zMaxAt(x0) - 0.35;
    if (zm > 0.5) seamV.push({ p: [x0, 0.005, 0], rot: 0, sz: 2 * zm });
  }
  instanced(new THREE.BoxGeometry(1, 0.008, 0.02), copper, seamH, 'bodenfugen_quer');
  instanced(new THREE.BoxGeometry(0.02, 0.008, 1), copper, seamV, 'bodenfugen_laengs');

  // Grün-kupferner Randstreifen entlang der Sechseckkante
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const mid = pt(s, s.len / 2);
    const px = mid[0] - s.n[0] * 0.16;
    const pz = mid[1] - s.n[1] * 0.16;
    box(s.len - 0.12, 0.012, 0.24, patina, px, 0.008, pz, `bodenrand_${i}`, s.wallRot);
  }

  // Bodenintarsie: sechseckiger Ring + zurückhaltendes Schneeflocken-Motiv
  const R = 2.55;
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const x0 = Math.cos(a0) * R, z0 = Math.sin(a0) * R;
    const x1 = Math.cos(a1) * R, z1 = Math.sin(a1) * R;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    box(len, 0.008, 0.05, copper, (x0 + x1) / 2, 0.007, (z0 + z1) / 2, `intarsie_ring_${i}`, -ang);
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    box(2.5, 0.008, 0.04, copper, Math.cos(ang) * 1.25, 0.007, Math.sin(ang) * 1.25, `intarsie_zweig_${i}`, -ang);
    for (const rr of [1.55, 2.1]) {
      const bx = Math.cos(ang) * rr, bz = Math.sin(ang) * rr;
      box(0.7, 0.008, 0.032, copper, bx, 0.007, bz, `intarsie_schneeflocke_${i}_${rr}`, -ang + Math.PI / 2);
    }
  }

  // ------------------------------------------------------------------ Wände
  const panelItems = [], frameItems = [], slotItems = [];
  let doorCount = 0;

  const solidAt = (s, d) => {
    if (s.door && Math.abs(d - s.len / 2) < DW / 2 + 0.001) return false;
    for (const w of s.windows) if (Math.abs(d - w.d) < w.w / 2) return false;
    return true;
  };

  for (const s of segs) {
    const doorIv = s.door ? [s.len / 2 - DW / 2, s.len / 2 + DW / 2] : null;
    const winIvs = s.windows.map((w) => [w.d - w.w / 2, w.d + w.w / 2]);

    // Wandstücke in voller Höhe
    let cur = 0;
    const cuts = [];
    if (doorIv) cuts.push(doorIv);
    winIvs.forEach((iv) => cuts.push(iv));
    cuts.sort((a, b) => a[0] - b[0]);
    const solids = [];
    for (const iv of cuts) {
      if (iv[0] > cur + 0.01) solids.push([cur, iv[0]]);
      cur = Math.max(cur, iv[1]);
    }
    if (cur < s.len - 0.01) solids.push([cur, s.len]);

    for (const [d0, d1] of solids) {
      const len = d1 - d0;
      const c = pt(s, (d0 + d1) / 2);
      const wx = c[0] + s.n[0] * (T / 2);
      const wz = c[1] + s.n[1] * (T / 2);
      // durchgehend antibakterielle, nahtlose Wandflächen
      box(len, H, T, sterile, wx, H / 2, wz, `wand_${s.i}_${d0.toFixed(1)}`, s.wallRot);
      const ix = c[0] - s.n[0] * 0.02, iz = c[1] - s.n[1] * 0.02;
      box(len, 0.15, 0.05, copper, ix, 0.075, iz, `sockel_${s.i}_${d0.toFixed(1)}`, s.wallRot);
      box(len, 0.10, 0.07, copper, ix - s.n[0] * 0.01, H - 0.05, iz - s.n[1] * 0.01, `gesims_${s.i}_${d0.toFixed(1)}`, s.wallRot);
      const lx = c[0] - s.n[0] * 0.14, lz = c[1] - s.n[1] * 0.14;
      box(len, 0.035, 0.07, lightMat, lx, H - 0.035, lz, `lichtband_${s.i}_${d0.toFixed(1)}`, s.wallRot);
    }

    // Türöffnungen (2.4 x 3.0 m)
    if (s.door) {
      const c = pt(s, s.len / 2);
      const wx = c[0] + s.n[0] * (T / 2);
      const wz = c[1] + s.n[1] * (T / 2);
      box(DW, H - DH, T, sterile, wx, DH + (H - DH) / 2, wz, `wand_${s.i}_sturz`, s.wallRot);
      box(DW + 0.2, 0.14, T + 0.06, copper, wx, DH, wz, `tuerfassung_${s.i}_oben`, s.wallRot);
      for (const sd of [-1, 1]) {
        const px = wx + s.u[0] * sd * (DW / 2 + 0.07);
        const pz = wz + s.u[1] * sd * (DW / 2 + 0.07);
        box(0.14, DH, T + 0.06, copper, px, DH / 2, pz, `tuerfassung_${s.i}_${sd}`, s.wallRot);
      }
      doorCount++;
      // fertige Antiker-Schiebetür: Ursprung in der Wandmitte, +Z zeigt in den Raum
      empty(doorCount === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorCount}`, wx, 0, wz, s.wallRot);
      // Anschlusspunkt: +Z zeigt nach außen
      empty(s.door.name, wx, 0, wz, Math.atan2(s.n[0], s.n[1]), { breite: DW, hoehe: DH, ziel: s.door.ziel });
    }

    // Fensteröffnungen
    s.windows.forEach((w, wi) => {
      const c = pt(s, w.d);
      const wx = c[0] + s.n[0] * (T / 2);
      const wz = c[1] + s.n[1] * (T / 2);
      box(w.w, w.y0, T, sterile, wx, w.y0 / 2, wz, `wand_${s.i}_fenster_${wi}_unten`, s.wallRot);
      box(w.w, H - w.y1, T, sterile, wx, (H + w.y1) / 2, wz, `wand_${s.i}_fenster_${wi}_oben`, s.wallRot);
      const gx = c[0] - s.n[0] * 0.04, gz = c[1] - s.n[1] * 0.04;
      box(w.w - 0.08, w.y1 - w.y0 - 0.08, 0.05, glassMat, gx, (w.y0 + w.y1) / 2, gz, `fenster_${wi}_glas`, s.wallRot);
      const fx = c[0] - s.n[0] * 0.06, fz = c[1] - s.n[1] * 0.06;
      box(w.w + 0.16, 0.12, 0.12, copper, fx, w.y1, fz, `fenster_${wi}_rahmen_oben`, s.wallRot);
      box(w.w + 0.16, 0.12, 0.12, copper, fx, w.y0, fz, `fenster_${wi}_rahmen_unten`, s.wallRot);
      for (const sd of [-1, 1]) {
        const px = fx + s.u[0] * sd * (w.w / 2 + 0.04);
        const pz = fz + s.u[1] * sd * (w.w / 2 + 0.04);
        box(0.12, w.y1 - w.y0 + 0.16, 0.12, copper, px, (w.y0 + w.y1) / 2, pz, `fenster_${wi}_rahmen_seite`, s.wallRot);
      }
      box(0.06, w.y1 - w.y0, 0.08, copper, fx, (w.y0 + w.y1) / 2, fz, `fenster_${wi}_sprosse`, s.wallRot);
    });

    // Steril-Feldraster: flache, eingelassene Paneele im 1.2-m-Raster
    const n = Math.max(1, Math.round(s.len / 1.2));
    const step = s.len / n;
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) * step;
      if (!solidAt(s, d)) continue;
      if (s.door && Math.abs(d - s.len / 2) < DW / 2 + 0.6) continue;
      const c = pt(s, d);
      const bx = c[0] - s.n[0] * 0.028, bz = c[1] - s.n[1] * 0.028;
      frameItems.push({ p: [bx, 1.62, bz], rot: s.wallRot });
      const px = c[0] - s.n[0] * 0.05, pz = c[1] - s.n[1] * 0.05;
      panelItems.push({ p: [px, 1.62, pz], rot: s.wallRot });
      if (i % 2 === 1) {
        for (let k = 0; k < 4; k++) {
          const sx = c[0] - s.n[0] * 0.045, sz = c[1] - s.n[1] * 0.045;
          slotItems.push({ p: [sx, 1.05 + k * 0.44, sz], rot: s.wallRot });
        }
      }
    }
  }
  instanced(new THREE.BoxGeometry(1.08, 2.72, 0.05), copper, frameItems, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(0.96, 2.58, 0.035), sterileDark, panelItems, 'paneele');
  const slotMesh = instanced(new THREE.BoxGeometry(0.06, 0.30, 0.04), lightMat, slotItems, 'lichtschlitze');

  // Wand-Schneeflocken-Motiv zwischen den beiden Fenstern der Rückwand
  const back = segs[3];
  {
    const c = pt(back, 3.1);
    const mx = c[0] - back.n[0] * 0.05, mz = c[1] - back.n[1] * 0.05;
    box(0.05, 1.15, 0.035, copper, mx, 2.35, mz, 'wand_schneeflocke_längs', back.wallRot);
    box(1.05, 0.05, 0.035, copper, mx, 2.35, mz, 'wand_schneeflocke_quer', back.wallRot);
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const bx = mx + back.u[0] * sd * (0.16 + k * 0.13);
        const bz = mz + back.u[1] * sd * (0.16 + k * 0.13);
        box(0.34, 0.035, 0.03, copper, bx, 2.35 + (k - 1) * 0.28, bz, `wand_schneeflocke_zweig_${sd}_${k}`, back.wallRot + sd * 0.6);
      }
    }
  }

  // ------------------------------------------------------------------ Säulen ( schlanke Eckpfeiler)
  const colIdx = [2, 3, 4, 5];
  for (const i of colIdx) {
    const p = V[i];
    const px = p[0] * 0.9, pz = p[1] * 0.9;
    const cyl = add(new THREE.CylinderGeometry(0.15, 0.21, H, 8), pillarMat, px, H / 2, pz, `saeule_${i}`);
    cyl.rotation.y = Math.atan2(p[0], p[1]);
    box(0.44, 0.10, 0.44, copper, px, 0.05, pz, `saeule_fuss_${i}`);
    box(0.34, 0.08, 0.34, copper, px, H - 0.04, pz, `saeule_kopf_${i}`);
  }

  // ------------------------------------------------------------------ Decke
  const ceilShape = new THREE.Shape();
  V.forEach((p, i) => (i ? ceilShape.lineTo(p[0], p[1]) : ceilShape.moveTo(p[0], p[1])));
  ceilShape.closePath();
  const ceilGeo = new THREE.ShapeGeometry(ceilShape);
  ceilGeo.rotateX(Math.PI / 2);                // Normale nach unten
  add(ceilGeo, ceilingMat, 0, H, 0, 'decke_feld');

  const slabGeo = new THREE.ExtrudeGeometry(ceilShape, { depth: 0.3, bevelEnabled: false });
  slabGeo.rotateX(Math.PI / 2);
  add(slabGeo, ceilingMat, 0, H + 0.3, 0, 'decke_platte');

  // Deckenfeldbeleuchtung: eisblaue Lichtfelder entlang der Sechseckkanten
  const ceilFields = [];
  for (const s of segs) {
    const mid = pt(s, s.len / 2);
    const lx = mid[0] - s.n[0] * 0.62, lz = mid[1] - s.n[1] * 0.62;
    const len = Math.min(3.4, s.len - 1.2);
    if (len > 0.4) ceilFields.push({ p: [lx, H - 0.055, lz], rot: s.wallRot, sx: len });
    if (s.len > 5.0) {
      const c2 = pt(s, s.len * 0.25);
      const l2x = c2[0] - s.n[0] * 0.62, l2z = c2[1] - s.n[1] * 0.62;
      ceilFields.push({ p: [l2x, H - 0.055, l2z], rot: s.wallRot, sx: len });
    }
  }
  instanced(new THREE.BoxGeometry(1, 0.05, 0.44), lightMat, ceilFields, 'decke_lichtfelder');

  // Warmes, sechseckiges Operationsfeld über dem Tisch
  const opShape = new THREE.Shape();
  const OR = 2.25;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * OR, z = Math.sin(a) * OR;
    i ? opShape.lineTo(x, z) : opShape.moveTo(x, z);
  }
  opShape.closePath();
  const opGeo = new THREE.ShapeGeometry(opShape);
  opGeo.rotateX(Math.PI / 2);
  add(opGeo, opLightMat, 0, H - 0.05, 0, 'decke_opsfeld');

  // Bronzefeld um das Operationsfeld
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const r = 2.62;
    const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    box(len, 0.05, 0.05, copper, (x0 + x1) / 2, H - 0.075, (z0 + z1) / 2, `decke_intarsie_${i}`, -ang);
  }

  // ------------------------------------------------------------------ Objektplätze
  // Operationstisch mittig, Vorderseite (+Z) zeigt zum Haupteingang (-Z)
  empty('PLACE_OBJ-016', 0, 0, 0, Math.PI);
  // Antikes Heilgerät an der Rückwand, außerhalb der Fenster
  empty('PLACE_OBJ-050', -2.55, 0, 3.42, Math.PI);
  // Lebenszeichendetektor an der Rückwand
  empty('PLACE_OBJ-065', 2.55, 0, 3.42, Math.PI);
  // Erd-Defibrillator an der rechten Flanke, Vorderseite zum Raum
  empty('PLACE_OBJ-066', 4.55, 0, 1.15, -Math.PI / 2);

  // ------------------------------------------------------------------ Lichter
  const lamps = [
    empty('LAMP_opsfeld', 0, 3.3, 0, 0, { color: '#ffd8a0', intensity: 14, distance: 13 }),
    empty('LAMP_hinten_links', -2.4, 3.3, 2.3, 0, { color: '#9fd8ff', intensity: 9, distance: 9 }),
    empty('LAMP_hinten_rechts', 2.4, 3.3, 2.3, 0, { color: '#9fd8ff', intensity: 9, distance: 9 }),
    empty('LAMP_eingang', 0, 3.3, -2.4, 0, { color: '#9fd8ff', intensity: 8, distance: 9 }),
  ];

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.visible = false;
    root.add(m);
    return m;
  };

  // Boden / Decke als Sechseck-Bänder (Rechteckkern + schräge Flankenbänder)
  const bands = 12;
  for (let k = 0; k < bands; k++) {
    const z0 = (k / bands) * 3.8, z1 = ((k + 1) / bands) * 3.8;
    const zc = (z0 + z1) / 2, zh = (z1 - z0) / 2;
    const outer = Math.max(xMaxAt(z0), xMaxAt(z1));
    const w = Math.max(0.05, outer - 3.1);
    for (const sd of [-1, 1]) {
      const cx = sd * (3.1 + w / 2);
      col(`COL_boden_seite_${sd}_${k}`, w, 0.2, zh * 2, cx, -0.1, sd * zc);
      col(`COL_decke_seite_${sd}_${k}`, w, 0.3, zh * 2, cx, H + 0.15, sd * zc);
    }
  }
  col('COL_boden_mitte', 6.2, 0.2, 7.6, 0, -0.1, 0);
  col('COL_decke_mitte', 6.2, 0.3, 7.6, 0, H + 0.15, 0);

  for (const s of segs) {
    const doorIv = s.door ? [s.len / 2 - DW / 2, s.len / 2 + DW / 2] : null;
    const winIvs = s.windows.map((w) => [w.d - w.w / 2, w.d + w.w / 2]);
    let cur = 0;
    const cuts = [];
    if (doorIv) cuts.push(doorIv);
    winIvs.forEach((iv) => cuts.push(iv));
    cuts.sort((a, b) => a[0] - b[0]);
    const solids = [];
    for (const iv of cuts) {
      if (iv[0] > cur + 0.01) solids.push([cur, iv[0]]);
      cur = Math.max(cur, iv[1]);
    }
    if (cur < s.len - 0.01) solids.push([cur, s.len]);
    for (const [d0, d1] of solids) {
      const len = d1 - d0;
      const c = pt(s, (d0 + d1) / 2);
      const wx = c[0] + s.n[0] * (T / 2), wz = c[1] + s.n[1] * (T / 2);
      col(`COL_wand_${s.i}_${d0.toFixed(1)}`, len, H, T, wx, H / 2, wz, s.wallRot);
    }
    if (s.door) {
      const c = pt(s, s.len / 2);
      const wx = c[0] + s.n[0] * (T / 2), wz = c[1] + s.n[1] * (T / 2);
      col(`COL_sturz_${s.i}`, DW, H - DH, T, wx, DH + (H - DH) / 2, wz, s.wallRot);
    }
    s.windows.forEach((w, wi) => {
      const c = pt(s, w.d);
      const wx = c[0] + s.n[0] * (T / 2), wz = c[1] + s.n[1] * (T / 2);
      col(`COL_fenster_${wi}_unten`, w.w, w.y0, T, wx, w.y0 / 2, wz, s.wallRot);
      col(`COL_fenster_${wi}_oben`, w.w, H - w.y1, T, wx, (H + w.y1) / 2, wz, s.wallRot);
      col(`COL_fenster_${wi}_glas`, w.w, w.y1 - w.y0, 0.1, c[0] - s.n[0] * 0.05, (w.y0 + w.y1) / 2, c[1] - s.n[1] * 0.05, s.wallRot);
    });
  }
  for (const i of colIdx) {
    const p = V[i];
    col(`COL_saeule_${i}`, 0.42, H, 0.42, p[0] * 0.9, H / 2, p[1] * 0.9);
  }

  // ------------------------------------------------------------------ API / Animation
  const api = {
    setSterilLicht: (an) => {
      opLightMat.emissiveIntensity = an ? 1.9 : 0.25;
      lightMat.emissiveIntensity = an ? 1.7 : 0.35;
      for (const l of lamps) l.userData.intensity = an ? (l.name === 'LAMP_opsfeld' ? 14 : 8.5) : 0.8;
    },
    flaeche: () => 69.9,
  };
  root.userData.api = api;
  root.userData.raum = { id: 'ATL-010', flaeche: 69.9, hoehe: H, tueren: 2 };

  let t = 0, last = null;
  const tick = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    opLightMat.emissiveIntensity = 1.85 + Math.sin(t * 0.7) * 0.10;
    lightMat.emissiveIntensity = 1.65 + Math.sin(t * 0.9 + 1.1) * 0.09;
  };
  root.userData.animation = tick;
  root.userData.update = tick;
  root.userData.animations = [tick];
  root.onBeforeRender = tick;

  return root;
}

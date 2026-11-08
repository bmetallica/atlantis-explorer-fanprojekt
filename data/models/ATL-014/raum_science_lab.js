// Raum ATL-014: Wissenschaftslabor – East Pier, Etage 3.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z. Leere Hülle: nur Architektur und PLACE_-Punkte.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_science_lab',
  art: 'Raum',
  masse: 'ca. 15,0 m × 12,0 m (≈179 m²), lichte Höhe 3,8 m, Wandstärke 0,3 m',
  wohin: 'East Pier, Etage 3 – zentrale Forschungsfläche des Wissenschaftsbereichs',
  benutzen: 'Antike Forschungskonsolen (OBJ-020) und Spektralanalyse-Säulen (OBJ-088) als feste Geräte; Erden-Objekte (049, 056, 069, 070, 071) als loses Mess-Equipment auf den Arbeitsinseln',
  lichter: '6 LAMP_-Punkte (5× eisblau, 1× bernstein als Akzent) sowie eingebaute Lichtleisten und abgehängte Decken-Lichtfelder',
  animation: 'Lichtleisten, Wand-Nischenleuchten und Deckenfelder atmen minimal (emissives Pulsieren)',
  quelle: 'ATL-014 Wissenschaftslabor (East Pier, Etage 3), Rekonstruktion nach Raum-Beschreibung, Atlantis-Setplänen „Halls & Corridors“ und den Referenzbildern ref1–ref3',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_science_lab';

  const H = 3.8;        // lichte Raumhöhe
  const T = 0.3;        // Wandstärke
  const DW = 2.4;       // Türöffnungsbreite
  const DH = 3.0;       // Türöffnungshöhe
  const ZC = 4.8660254; // 1,5 · tan(30°) → 30°/150°-Ecken

  // ------------------------------------------------------------------ Materialien
  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glassMat = kit('glass');
  const glowMat = kit('glow');
  const amberMat = kit('amberGlow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });
  const amberLine = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_bernstein', color: 0xffe4bb, emissive: 0xffc078, emissiveIntensity: 1.5,
  });

  // ------------------------------------------------------------------ Grundriss (achteckig, 30°/150°-Ecken)
  const V = [
    [-6.0, -6.0], [6.0, -6.0], [7.5, -ZC], [7.5, ZC],
    [6.0, 6.0], [-6.0, 6.0], [-7.5, ZC], [-7.5, -ZC],
  ];

  const shape = new THREE.Shape();
  V.forEach((p, i) => {
    if (i === 0) shape.moveTo(p[0], p[1]);
    else shape.lineTo(p[0], p[1]);
  });
  shape.closePath();

  // ------------------------------------------------------------------ Hilfsfunktionen
  const dummy = new THREE.Object3D();
  const add = (geo, mat, x, y, z, ry = 0, name = '') => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, ry = 0, name = '') =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, ry, name);

  // Instanzierte Wiederholungen: Grundgeometrie ist immer 1×1×1, die Skalierung
  // gibt die realen Maße an (verhindert Über-/Untergrößen der Paneele).
  const inst = (geo, mat, list, name) => {
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

  const col = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
  };

  const place = (name, x, y, z, ry, extra = {}) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = ry;
    o.userData = { ...extra };
    root.add(o);
    return o;
  };

  // ------------------------------------------------------------------ Boden
  const floorPlane = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat);
  floorPlane.geometry.rotateX(-Math.PI / 2);
  floorPlane.position.y = 0.002;
  floorPlane.name = 'boden';
  root.add(floorPlane);

  const floorSlab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }), floorMat
  );
  floorSlab.geometry.rotateX(Math.PI / 2);
  floorSlab.name = 'boden_sockel';
  root.add(floorSlab);

  // ------------------------------------------------------------------ Wände
  const SEGMENTS = [
    { name: 'sued', a: V[0], b: V[1], openings: [{ type: 'door', u: 6.0, w: DW, h: DH }] },
    { name: 'suedost', a: V[1], b: V[2], openings: [] },
    { name: 'ost', a: V[2], b: V[3], openings: [{ type: 'fenster', u: ZC, w: 5.4, sill: 0.9, head: 3.1 }] },
    { name: 'nordost', a: V[3], b: V[4], openings: [] },
    { name: 'nord', a: V[4], b: V[5], openings: [{ type: 'door', u: 6.0, w: DW, h: DH }] },
    { name: 'nordwest', a: V[5], b: V[6], openings: [] },
    { name: 'west', a: V[6], b: V[7], openings: [{ type: 'fenster', u: ZC, w: 5.4, sill: 0.9, head: 3.1 }] },
    { name: 'suedwest', a: V[7], b: V[0], openings: [] },
  ];

  const panelList = [], frameList = [], slotList = [], skirtList = [], corniceList = [], borderList = [];
  const nicheList = [], nicheFrameList = [], nicheGlowList = [];
  let doorIndex = 0;

  for (const seg of SEGMENTS) {
    const [ax, az] = seg.a, [bx, bz] = seg.b;
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const dirx = dx / len, dirz = dz / len;
    const theta = -Math.atan2(dz, dx);             // lokale X-Achse entlang der Wand
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    let nx = -mx, nz = -mz;                        // Innenrichtung
    const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    const ryIn = Math.atan2(nx, nz);               // +Z zeigt in den Raum
    const P = (u, off = 0) => [ax + dirx * u + nx * off, az + dirz * u + nz * off];

    // grün-kupferner Bodenrand entlang der Wand
    const bp = P(len / 2, T / 2 + 0.11);
    borderList.push({ p: [bp[0], 0.012, bp[1]], r: theta, s: [len - 0.1, 0.024, 0.22] });

    const solid = (u0, u1) => {
      const l = u1 - u0;
      if (l < 0.05) return;
      const uc = (u0 + u1) / 2;
      const p = P(uc);
      box(l, H, T, wall, p[0], H / 2, p[1], theta, `wand_${seg.name}_${u0.toFixed(1)}`);
      col(`COL_wand_${seg.name}_${u0.toFixed(1)}`, T, H, l, p[0], H / 2, p[1], theta);

      // Sockelleiste und Gesims
      const ps = P(uc, T / 2 + 0.025), pc = P(uc, T / 2 + 0.035);
      skirtList.push({ p: [ps[0], 0.075, ps[1]], r: theta, s: [l, 0.15, 0.05] });
      corniceList.push({ p: [pc[0], H - 0.12, pc[1]], r: theta, s: [l, 0.1, 0.07] });

      // Wandpaneele im 1,2-m-Raster, Lichtschlitze dazwischen
      let u = u0 + 0.62;
      while (u < u1 - 0.25) {
        const pw = Math.min(1.05, Math.max(0.55, l - 0.2));
        const pp = P(u, T / 2 + 0.05), pf = P(u, T / 2 + 0.028);
        panelList.push({ p: [pp[0], 1.58, pp[1]], r: ryIn, s: [pw, 2.6, 0.035] });
        frameList.push({ p: [pf[0], 1.58, pf[1]], r: ryIn, s: [pw + 0.1, 2.76, 0.03] });
        const su = u + 0.6;
        if (su < u1 - 0.2) {
          const sp = P(su, T / 2 + 0.02);
          for (let k = 0; k < 4; k++) slotList.push({ p: [sp[0], 1.05 + k * 0.42, sp[1]], r: ryIn });
        }
        u += 1.2;
      }
    };

    const ops = [...seg.openings].sort((a, b) => a.u - b.u);
    let cursor = 0;
    for (const op of ops) {
      const s = op.u - op.w / 2, e = op.u + op.w / 2;
      solid(cursor, s);
      const uc = op.u;

      if (op.type === 'door') {
        // Sturz über der Öffnung
        const pl = P(uc);
        box(op.w, H - op.h, T, wall, pl[0], op.h + (H - op.h) / 2, pl[1], theta, `wand_${seg.name}_sturz`);
        col(`COL_sturz_${seg.name}`, op.w, H - op.h, T, pl[0], op.h + (H - op.h) / 2, pl[1], theta);
        // Bronzefassung (Zarge 3,34 × 3,74)
        for (const sgn of [-1, 1]) {
          const pv = P(uc + sgn * (op.w / 2 + 0.07));
          box(0.14, op.h, 0.36, copper, pv[0], op.h / 2, pv[1], theta, `tuerfassung_${seg.name}`);
        }
        const pt = P(uc);
        box(3.34, 0.14, 0.36, copper, pt[0], op.h + 0.07, pt[1], theta, `tuersturz_${seg.name}`);
        // Türblatt-Objekt (fertige Antiker-Schiebetür) + Anschlusspunkt
        doorIndex++;
        place(doorIndex === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorIndex}`,
          pt[0], 0, pt[1], ryIn, { breite: DW, hoehe: DH });
        place(`DOOR_${seg.name}`, pt[0], 0, pt[1], ryIn + Math.PI, {
          breite: DW, hoehe: DH,
          ziel: seg.name === 'sued' ? 'East Pier / Flur Etage 3' : 'Wissenschaftsflur Etage 3',
        });
      } else if (op.type === 'fenster') {
        const pl = P(uc);
        // Unter- und Überfüllung
        box(op.w, op.sill, T, wall, pl[0], op.sill / 2, pl[1], theta, `wand_${seg.name}_sockel`);
        box(op.w, H - op.head, T, wall, pl[0], op.head + (H - op.head) / 2, pl[1], theta, `wand_${seg.name}_sturz`);
        // Rahmen + Glas
        const fh = op.head - op.sill;
        for (const sgn of [-1, 1]) {
          const pv = P(uc + sgn * (op.w / 2));
          box(0.12, fh + 0.2, 0.36, copper, pv[0], op.sill + fh / 2, pv[1], theta, `fensterrahmen_${seg.name}`);
        }
        const pb = P(uc);
        box(op.w + 0.2, 0.12, 0.36, copper, pb[0], op.sill, pb[1], theta, `fensterrahmen_${seg.name}_unten`);
        box(op.w + 0.2, 0.12, 0.36, copper, pb[0], op.head, pb[1], theta, `fensterrahmen_${seg.name}_oben`);
        const pg = P(uc);
        box(op.w, fh, 0.05, glassMat, pg[0], op.sill + fh / 2, pg[1], theta, `fenster_glas_${seg.name}`);
        // Sprossen
        for (let k = 1; k <= 3; k++) {
          const pm = P(uc - op.w / 2 + (op.w * k) / 4);
          box(0.07, fh, 0.22, copper, pm[0], op.sill + fh / 2, pm[1], theta, `fenstersprosse_${seg.name}`);
        }
        // geschlossene Fensterwand
        col(`COL_wand_${seg.name}`, T, H, len, mx, H / 2, mz, theta);
      }
      cursor = e;
    }
    solid(cursor, len);

    // Wandnischen auf den kurzen Diagonalwänden (fest eingebaute Architektur)
    if (seg.name === 'suedost' || seg.name === 'nordost' || seg.name === 'suedwest' || seg.name === 'nordwest') {
      const np = P(len / 2, T / 2 + 0.035);
      nicheList.push({ p: [np[0], 1.7, np[1]], r: ryIn, s: [1.1, 2.2, 0.04] });
      nicheFrameList.push({ p: [np[0], 1.7, np[1]], r: ryIn, s: [1.24, 2.34, 0.03] });
      const gp = P(len / 2, T / 2 + 0.06);
      nicheGlowList.push({ p: [gp[0], 2.55, gp[1]], r: ryIn, s: [0.06, 0.5, 0.02] });
    }
  }

  // ------------------------------------------------------------------ Säulen an den acht Raumecken
  V.forEach((v, i) => {
    let nx = -v[0], nz = -v[1];
    const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    const off = T / 2 + 0.13;
    const x = v[0] + nx * off, z = v[1] + nz * off;
    const ry = Math.atan2(nx, nz);
    box(0.22, H - 0.25, 0.22, pillarMat, x, (H - 0.25) / 2, z, ry, `saeule_${i}`);
    box(0.34, 0.14, 0.34, copper, x, 0.07, z, ry, `saeule_fuss_${i}`);
    box(0.32, 0.12, 0.32, copper, x, H - 0.31, z, ry, `saeule_kapital_${i}`);
    col(`COL_saeule_${i}`, 0.3, H - 0.25, 0.3, x, (H - 0.25) / 2, z, ry);
  });

  // ------------------------------------------------------------------ Wandpaneele / Leisten / Lichtschlitze
  inst(new THREE.BoxGeometry(1, 1, 1), wallDark, panelList, 'wandpaneele');
  inst(new THREE.BoxGeometry(1, 1, 1), copper, frameList, 'wandpaneel_rahmen');
  inst(new THREE.BoxGeometry(0.075, 0.28, 0.025), lineGlow, slotList, 'lichtschlitze');
  inst(new THREE.BoxGeometry(1, 1, 1), copper, skirtList, 'sockelleisten');
  inst(new THREE.BoxGeometry(1, 1, 1), copper, corniceList, 'gesimse');
  inst(new THREE.BoxGeometry(1, 1, 1), patina, borderList, 'bodenrand');
  inst(new THREE.BoxGeometry(1, 1, 1), wallDark, nicheList, 'wandnischen');
  inst(new THREE.BoxGeometry(1, 1, 1), copper, nicheFrameList, 'wandnischen_rahmen');
  inst(new THREE.BoxGeometry(1, 1, 1), amberLine, nicheGlowList, 'wandnischen_leuchte');

  // ------------------------------------------------------------------ Bodenintarsie (Schneeflocke / Kreis)
  const ring = add(new THREE.TorusGeometry(1.45, 0.045, 8, 48), copper, 0, 0.022, 0, 0, 'boden_intarsie_ring');
  ring.rotation.x = -Math.PI / 2;
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    const bar = box(2.7, 0.018, 0.05, copper, 0, 0.022, 0, a, 'boden_intarsie_strahl');
    bar.position.set(Math.cos(a) * 0.72, 0.022, Math.sin(a) * 0.72);
  }
  box(0.9, 0.018, 0.05, patina, 0, 0.022, 0, 0, 'boden_intarsie_quer');

  // ------------------------------------------------------------------ Kabelkanäle am Boden
  const ch = [];
  ch.push({ p: [-4.8, 0.018, 0], r: 0, s: [0.18, 0.036, 9.6] });
  ch.push({ p: [4.8, 0.018, 0], r: 0, s: [0.18, 0.036, 9.6] });
  ch.push({ p: [0, 0.018, -4.8], r: 0, s: [9.6, 0.036, 0.18] });
  ch.push({ p: [0, 0.018, 4.8], r: 0, s: [9.6, 0.036, 0.18] });
  inst(new THREE.BoxGeometry(1, 1, 1), wallDark, ch, 'kabelkanaele');
  const chEdge = [];
  for (const c of ch) {
    const long = Math.max(c.s[0], c.s[2]), short = Math.min(c.s[0], c.s[2]);
    const off = short / 2 + 0.025;
    for (const sgn of [-1, 1]) {
      const p = [c.p[0], 0.021, c.p[1]];
      if (c.s[0] > c.s[2]) p[0] += sgn * off; else p[2] += sgn * off;
      chEdge.push({ p, r: 0, s: c.s[0] > c.s[2] ? [long, 0.03, 0.05] : [0.05, 0.03, long] });
    }
  }
  inst(new THREE.BoxGeometry(1, 1, 1), copper, chEdge, 'kabelkanaele_kanten');

  // ------------------------------------------------------------------ Decke
  const ceilPlane = new THREE.Mesh(new THREE.ShapeGeometry(shape), ceilMat);
  ceilPlane.geometry.rotateX(Math.PI / 2);
  ceilPlane.position.y = H;
  ceilPlane.name = 'decke_flaeche';
  root.add(ceilPlane);

  const ceilSlab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }), ceilMat
  );
  ceilSlab.geometry.rotateX(Math.PI / 2);
  ceilSlab.position.y = H + 0.3;
  ceilSlab.name = 'decke_schale';
  root.add(ceilSlab);

  // abgehängte Lichtfelder
  const fields = [];
  for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
    if (Math.abs(ix) === 1 && Math.abs(iz) === 1) continue;
    fields.push({ p: [ix * 3.6, H - 0.08, iz * 3.0], r: 0, s: [2.2, 0.08, 1.1] });
  }
  inst(new THREE.BoxGeometry(1, 1, 1), glowMat, fields, 'decke_lichtfelder');
  const fieldFrames = fields.map((f) => ({
    p: [f.p[0], H - 0.055, f.p[2]], r: 0, s: [f.s[0] + 0.16, 0.06, f.s[2] + 0.16],
  }));
  inst(new THREE.BoxGeometry(1, 1, 1), copper, fieldFrames, 'decke_lichtfeld_rahmen');

  // Deckenleisten entlang der Wände
  const ceilTrim = [];
  SEGMENTS.forEach((seg) => {
    const dx = seg.b[0] - seg.a[0], dz = seg.b[1] - seg.a[1];
    const len = Math.hypot(dx, dz);
    const theta = -Math.atan2(dz, dx);
    const mx = (seg.a[0] + seg.b[0]) / 2, mz = (seg.a[1] + seg.b[1]) / 2;
    let nx = -mx, nz = -mz; const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    ceilTrim.push({
      p: [mx + nx * (T / 2 + 0.08), H - 0.07, mz + nz * (T / 2 + 0.08)],
      r: theta, s: [len - 0.1, 0.09, 0.12],
    });
  });
  inst(new THREE.BoxGeometry(1, 1, 1), copper, ceilTrim, 'decke_leisten');

  // ------------------------------------------------------------------ Objektplätze
  const placeObj = (id, x, z, ry, extra = {}) => place(`PLACE_OBJ-${id}`, x, 0, z, ry, extra);

  // Antike Forschungskonsolen (2,00 × 1,52 × 1,00) an den Wandflächen
  placeObj('020', -6.85, -3.70, Math.PI / 2, { orientierung: 'Westwand, Vorderseite +X in den Raum' });
  placeObj('020', 6.85, 3.70, -Math.PI / 2, { orientierung: 'Ostwand, Vorderseite -X in den Raum' });
  placeObj('020', -3.80, 5.35, Math.PI, { orientierung: 'Nordwand, Vorderseite -Z in den Raum' });
  placeObj('020', 3.80, 5.35, Math.PI, { orientierung: 'Nordwand, Vorderseite -Z in den Raum' });

  // Antike Spektralanalyse-Säulen (0,50 × 1,80 × 0,50) als Inseln
  placeObj('088', -3.60, -2.40, Math.PI / 2, { orientierung: 'Insel west-süd, Vorderseite +X' });
  placeObj('088', 3.60, -2.40, -Math.PI / 2, { orientierung: 'Insel ost-süd, Vorderseite -X' });
  placeObj('088', -3.60, 2.40, Math.PI / 2, { orientierung: 'Insel west-nord, Vorderseite +X' });
  placeObj('088', 3.60, 2.40, -Math.PI / 2, { orientierung: 'Insel ost-nord, Vorderseite -X' });

  // Kristall-Schnittstellenleser (0,74 × 0,98 × 0,38) an den Analyseplätzen
  placeObj('070', -1.80, 0.00, 0, { orientierung: 'Arbeitsplatz west, Vorderseite +Z' });
  placeObj('070', 1.80, 0.00, Math.PI, { orientierung: 'Arbeitsplatz ost, Vorderseite -Z' });

  // Erden-Equipment
  placeObj('069', -1.90, 4.40, Math.PI, { orientierung: 'Feld-Laptop nördlich, Vorderseite -Z' });
  placeObj('069', 1.90, 4.40, Math.PI, { orientierung: 'Feld-Laptop nördlich, Vorderseite -Z' });
  placeObj('056', -1.90, 3.00, Math.PI, { orientierung: 'Daten-Pad nördlich, Vorderseite -Z' });
  placeObj('056', 1.90, 3.00, Math.PI, { orientierung: 'Daten-Pad nördlich, Vorderseite -Z' });
  placeObj('056', -5.20, 1.20, Math.PI / 2, { orientierung: 'Daten-Pad westlich, Vorderseite +X' });
  placeObj('071', -1.90, 1.40, Math.PI, { orientierung: 'Partikeldetektor nördlich, Vorderseite -Z' });
  placeObj('071', 1.90, 1.40, Math.PI, { orientierung: 'Partikeldetektor nördlich, Vorderseite -Z' });
  placeObj('049', -5.20, 2.60, Math.PI / 2, { orientierung: 'Schutzschild westlich, Vorderseite +X' });
  placeObj('049', 5.20, 2.60, -Math.PI / 2, { orientierung: 'Schutzschild östlich, Vorderseite -X' });

  // ------------------------------------------------------------------ Lichtpunkte
  const lamps = [
    { p: [0, 3.35, -4.20], color: '#9fd8ff', intensity: 9 },
    { p: [0, 3.35, 0.00], color: '#9fd8ff', intensity: 9 },
    { p: [0, 3.35, 4.20], color: '#9fd8ff', intensity: 9 },
    { p: [-4.80, 3.35, -2.40], color: '#9fd8ff', intensity: 8 },
    { p: [-4.80, 3.35, 2.40], color: '#9fd8ff', intensity: 8 },
    { p: [4.80, 3.35, 0.00], color: '#ffd8a0', intensity: 8 },
  ];
  lamps.forEach((l, i) => place(`LAMP_${i + 1}`, l.p[0], l.p[1], l.p[2], 0, {
    color: l.color, intensity: l.intensity, distance: 16,
  }));

  // ------------------------------------------------------------------ Kollision
  col('COL_boden', 15.0, 0.2, 12.0, 0, -0.1, 0);
  col('COL_decke', 15.0, 0.3, 12.0, 0, H + 0.15, 0);

  // ------------------------------------------------------------------ Animation
  let t = 0, last = null;
  root.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.55 + Math.sin(t * 0.7) * 0.14;
    amberLine.emissiveIntensity = 1.45 + Math.sin(t * 0.7 + 2.1) * 0.12;
    glowMat.emissiveIntensity = 1.2 + Math.sin(t * 0.7 + 1.1) * 0.1;
  };

  root.userData.raum = {
    id: 'ATL-014',
    bereich: 'East Pier',
    etage: 3,
    hoehe: H,
    flaeche: 'ca. 179 m²',
    tueren: ['DOOR_sued', 'DOOR_nord'],
  };
  root.userData.api = {};
  return root;
}

// Raum ATL-040: Jumper-Bay / Puddle-Jumper-Hangar
// 1 Einheit = 1 m, +Y oben, Ursprung = Mitte der Bodenfläche (y = 0).
// Sechseckiges Hangardeck (60°-Wände) direkt über der Torhalle ATL-001,
// mit kreisrunder Bodenluke (Ø 8,4 m), segmentierter Dachluke, umlaufender
// Galerie und Parkbuchten für Puddle Jumper.
// Leere Hülle: nur Architektur, feste Einbauten und Platzhalter (PLACE_).
import * as THREE from 'three';

const kit = (n) => new THREE.MeshStandardMaterial({ name: `KIT_${n}` });

export const steckbrief = {
  name: 'raum_jumper_bay',
  art: 'Raum',
  masse: 'sechseckig, Ø 24,2 m (ca. 379 m²), Höhe 6,5 m',
  wohin: 'South-West Pier, Etage 5, direkt über der Torhalle ATL-001',
  benutzen: 'Bodenluke (8-Segment-Radschacht, Ø 8,4 m) und segmentierte Dachluke bedienen; Startschacht OBJ-038',
  lichter: '6 LAMP_ (eisblau) plus Wandlichtschlitze, Galerie- und Deckenlichtbänder',
  animation: 'Bodenluken-Segmente und Dachluken-Segmente fahren radial auf/zu, Lichtleisten pulsieren minimal',
  quelle: 'rekonstruiert nach Setplan (Mallozzi, Staffel 4/5) und Screencaps der Puddle-Jumper-Bucht',
};

export const varianten = [
  { label: 'Standard-Hangardeck (sechseckig, Galerie)', opts: {} },
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_jumper_bay';

  // ------------------------------------------------------------------ Maße
  const R = 12.1;                        // Umkreisradius
  const A = R * Math.cos(Math.PI / 6);   // Apothem = 10,478 m
  const H = 6.5;                         // lichte Raumhöhe
  const T = 0.3;                         // Wanddicke
  const GY0 = 3.7, GY1 = 4.0;            // Galerie Unterkante / Oberkante
  const BAND = 2.38;                     // Galeriebreite
  const IR = A - BAND;                   // innere Galeriekante = 8,098 m
  const f = IR / A;
  const floorR = 4.2;                    // Bodenluke Ø 8,4 m
  const roofR = 5.0;                     // Dachluke Ø 10,0 m (Startschacht OBJ-038)
  const DOOR_SIDE = 4;                   // Seite -Z (Haupteingang)
  const DOOR_W = 2.4, DOOR_H = 3.0;
  const STAIR_SIDE = 0, STAIR_RUN = 4.8, STAIR_N = 16, STAIR_RISE = 0.25, STAIR_TREAD = 0.3;

  // ------------------------------------------------------------ Materialien
  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper');
  const pillar = kit('pillar'), floorMat = kit('floor'), floorUp = kit('floorUpper');
  const ceilMat = kit('ceiling'), stairMat = kit('stair'), railMat = kit('rail'), glowMat = kit('glow');
  const amber = kit('amberGlow');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.45 });
  const lineGlow = new THREE.MeshStandardMaterial({ name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.8 });
  const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };

  // ---------------------------------------------------------------- Helfer
  const dummy = new THREE.Object3D();
  const addMesh = (geo, mat, x, y, z, name, rotY = 0, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (name) m.name = name;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, rotY = 0, parent = root) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, rotY, parent);

  // Prisma aus XZ-Punkten (y0..y1)
  const prismGeo = (pts, y0, y1) => {
    const n = pts.length, pos = [], idx = [];
    for (const p of pts) pos.push(p[0], y0, p[1]);
    for (const p of pts) pos.push(p[0], y1, p[1]);
    for (let i = 1; i < n - 1; i++) idx.push(0, i + 1, i);
    for (let i = 1; i < n - 1; i++) idx.push(n, n + i, n + i + 1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, n + j, i, n + j, n + i); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const prism = (pts, y0, y1, mat, name) => {
    const m = new THREE.Mesh(prismGeo(pts, y0, y1), dbl(mat));
    m.name = name;
    root.add(m);
    return m;
  };

  // Kreissektor (Tortennanteil) als liegende Platte, Öffnung entlang +X
  const sectorGeo = (radius, halfAngle, thickness, segs = 8) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i <= segs; i++) {
      const a = -halfAngle + (2 * halfAngle) * (i / segs);
      shape.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // Formebene -> XZ, Dicke -> +Y
    return g;
  };

  // Keil (Rampenkörper) für die Treppe: lokal X = Laufrichtung, Z = Breite
  const wedgeGeo = (len, w, h0, h1) => {
    const L = len / 2, W = w / 2;
    const v = [
      [-L, 0, -W], [L, 0, -W], [L, 0, W], [-L, 0, W],
      [-L, h0, -W], [L, h1, -W], [L, h1, W], [-L, h0, W],
    ];
    const idx = [
      0, 2, 1, 0, 3, 2,       // unten
      4, 5, 6, 4, 6, 7,       // Oberseite (Rampe)
      0, 1, 5, 0, 5, 4,       // Seite -Z
      3, 7, 6, 3, 6, 2,       // Seite +Z
      0, 4, 7, 0, 7, 3,       // Stirnseite -X
      1, 2, 6, 1, 6, 5,       // Stirnseite +X
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };

  const inst = (geo, mat, list, name, parent = root) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((it, i) => {
      dummy.position.set(it[0], it[1], it[2]);
      dummy.rotation.set(0, it[3] || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    parent.add(im);
    return im;
  };
  const place = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name; o.position.set(x, y, z); o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };
  const collider = (name, w, h, d, x, y, z, rotY = 0, parent = root) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name; m.position.set(x, y, z);
    m.rotation.order = 'YXZ'; m.rotation.y = rotY;
    m.visible = false;
    parent.add(m);
    return m;
  };

  // -------------------------------------------------- Grundriss (Sechseck)
  const V = [];
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; V.push([R * Math.cos(a), R * Math.sin(a)]); }
  const S = [];
  for (let k = 0; k < 6; k++) {
    const p0 = V[k], p1 = V[(k + 1) % 6];
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
    const len = Math.hypot(dx, dz), d = [dx / len, dz / len];
    const n = [-d[1], d[0]];
    S.push({ p0, p1, d, n, len, mid: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], rot: -Math.atan2(d[1], d[0]) });
  }
  const at = (k, t, off = 0) => [
    S[k].p0[0] + S[k].d[0] * t + S[k].n[0] * off,
    S[k].p0[1] + S[k].d[1] * t + S[k].n[1] * off,
  ];
  const lerp2 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const VI = V.map((p) => [p[0] * f, p[1] * f]);

  // ----------------------------------------------------------------- Boden
  const floorShape = new THREE.Shape();
  V.forEach((p, i) => { const x = p[0], y = -p[1]; if (i === 0) floorShape.moveTo(x, y); else floorShape.lineTo(x, y); });
  floorShape.closePath();
  const fh = new THREE.Path(); fh.absarc(0, 0, floorR, 0, Math.PI * 2, true); floorShape.holes.push(fh);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.25, bevelEnabled: false, curveSegments: 48 });
  const floor = new THREE.Mesh(floorGeo, dbl(floorMat));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.25; floor.name = 'boden_hauptflaeche';
  root.add(floor);

  // Bodenintarsien: Patina-Rand, Kupferring, radiale Landeplatz-Markierungen
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(floorR + 0.30, 0.09, 8, 56), patina);
  ring1.rotation.x = -Math.PI / 2; ring1.position.y = 0.012; ring1.name = 'boden_intarsie_patina'; root.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(floorR + 1.55, 0.05, 8, 64), copper);
  ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.010; ring2.name = 'boden_intarsie_kupfer'; root.add(ring2);
  const radials = [];
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    radials.push([Math.cos(a) * (floorR + 0.95), 0.008, Math.sin(a) * (floorR + 0.95), Math.PI / 2 - a]);
  }
  inst(new THREE.BoxGeometry(0.06, 0.014, 1.15), copper, radials, 'boden_intarsie_strahlen');

  // Parkbucht-Markierungen (Kupferlinien) für vier Jumper unter der Galerie
  const bayMarks = [];
  for (const k of [1, 2, 3, 5]) {
    const len = S[k].len, mid = len / 2, halfL = 4.0, offA = 0.30, offB = 4.66;
    for (const off of [offA, offB]) {
      const p = at(k, mid, off);
      bayMarks.push([p[0], 0.009, p[1], S[k].rot]);
    }
    for (const t of [mid - halfL, mid + halfL]) {
      const p = at(k, t, (offA + offB) / 2);
      bayMarks.push([p[0], 0.009, p[1], S[k].rot]);
    }
  }
  inst(new THREE.BoxGeometry(0.07, 0.016, 1), copper, bayMarks, 'boden_parkbuchten_markierung');

  // ---------------------------------------------------------------- Wände
  const wallPiece = (k, t0, t1, y0, y1, mat, name) => {
    const p = at(k, (t0 + t1) / 2, -T / 2);
    return box(t1 - t0, y1 - y0, T, mat, p[0], (y0 + y1) / 2, p[1], name, S[k].rot);
  };
  const doorHalf = DOOR_W / 2;
  for (let k = 0; k < 6; k++) {
    if (k === DOOR_SIDE) {
      const len = S[k].len, c = len / 2;
      wallPiece(k, 0, c - doorHalf, 0, H, wall, 'wand_sued_links');
      wallPiece(k, c + doorHalf, len, 0, H, wall, 'wand_sued_rechts');
      wallPiece(k, c - doorHalf, c + doorHalf, DOOR_H, H, wall, 'wand_sued_sturz');
    } else {
      wallPiece(k, 0, S[k].len, 0, H, wall, `wand_${k}`);
    }
  }

  // Türrahmen (Kupfer) in der Öffnung
  {
    const k = DOOR_SIDE, c = S[k].len / 2;
    const pL = at(k, c - doorHalf, 0.06), pR = at(k, c + doorHalf, 0.06), pH = at(k, c, 0.06);
    box(0.14, DOOR_H, 0.14, copper, pL[0], DOOR_H / 2, pL[1], 'tuer_rahmen_links', S[k].rot);
    box(0.14, DOOR_H, 0.14, copper, pR[0], DOOR_H / 2, pR[1], 'tuer_rahmen_rechts', S[k].rot);
    box(DOOR_W + 0.28, 0.16, 0.14, copper, pH[0], DOOR_H, pH[1], 'tuer_rahmen_kopf', S[k].rot);
  }

  // Wandpaneele (plant-ons), Lichtschlitze, Sockel, Gesims
  const frames = [], panels = [], slots = [];
  for (let k = 0; k < 6; k++) {
    const len = S[k].len, fields = Math.floor(len / 1.2);
    const doorBlock = (k === DOOR_SIDE);
    for (let i = 0; i < fields; i++) {
      const t = i * 1.2 + 0.6;
      if (doorBlock && Math.abs(t - len / 2) < 1.9) continue;
      const p = at(k, t, 0);
      if (i % 2 === 0) {
        frames.push([p[0], 1.55, p[1], S[k].rot]);
        const q = at(k, t, 0.035);
        panels.push([q[0], 1.55, q[1], S[k].rot]);
      } else {
        for (let j = 0; j < 4; j++) {
          const q = at(k, t, 0.02);
          slots.push([q[0], 1.05 + j * 0.42, q[1], S[k].rot]);
        }
      }
    }
    const segs = doorBlock ? [[0, len / 2 - doorHalf], [len / 2 + doorHalf, len]] : [[0, len]];
    for (const [a, b] of segs) {
      if (b - a < 0.05) continue;
      const p = at(k, (a + b) / 2, 0.03);
      box(b - a, 0.15, 0.05, copper, p[0], 0.075, p[1], `sockel_${k}`, S[k].rot);
      const q = at(k, (a + b) / 2, 0.04);
      box(b - a, 0.1, 0.08, copper, q[0], H - 0.08, q[1], `gesims_${k}`, S[k].rot);
    }
  }
  inst(new THREE.BoxGeometry(1.08, 2.72, 0.05), copper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.98, 2.6, 0.035), wallDark, panels, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.07, 0.30, 0.03), lineGlow, slots, 'lichtschlitze');

  // --------------------------------------------------------------- Galerie
  const galleryTrapez = (k, t0, t1) => {
    const o0 = lerp2(S[k].p0, S[k].p1, t0 / S[k].len);
    const o1 = lerp2(S[k].p0, S[k].p1, t1 / S[k].len);
    const i0 = lerp2(VI[k], VI[(k + 1) % 6], t0 / S[k].len);
    const i1 = lerp2(VI[k], VI[(k + 1) % 6], t1 / S[k].len);
    return [o0, o1, i1, i0];
  };
  for (let k = 0; k < 6; k++) {
    const t0 = (k === STAIR_SIDE) ? STAIR_RUN : 0;
    prism(galleryTrapez(k, t0, S[k].len), GY0, GY1, floorUp, `galerie_${k}`);
  }
  // Galeriekante (Kupferprofil) innen
  for (let k = 0; k < 6; k++) {
    const t0 = (k === STAIR_SIDE) ? STAIR_RUN : 0;
    const p = at(k, (t0 + S[k].len) / 2, BAND - 0.03);
    box(S[k].len - t0, 0.12, 0.10, copper, p[0], GY0 - 0.06, p[1], `galerie_kante_${k}`, S[k].rot);
  }

  // Treppe: massiver Rampenkörper + instanzierte Tritte (kein Einzelkörper)
  const stairGroup = new THREE.Group();
  {
    const p = at(STAIR_SIDE, STAIR_RUN / 2, BAND / 2);
    stairGroup.position.set(p[0], 0, p[1]);
    stairGroup.rotation.y = S[STAIR_SIDE].rot;
    stairGroup.name = 'treppe';
    root.add(stairGroup);

    const wedge = new THREE.Mesh(wedgeGeo(STAIR_RUN, 1.9, 0.02, GY1), dbl(stairMat));
    wedge.name = 'treppe_rampenkörper';
    stairGroup.add(wedge);

    const treads = [];
    for (let i = 0; i < STAIR_N; i++) {
      const s = i * STAIR_TREAD + STAIR_TREAD / 2;
      const h = (i + 1) * STAIR_RISE;
      treads.push([-STAIR_RUN / 2 + s, h - 0.03, 0, 0]);
    }
    inst(new THREE.BoxGeometry(STAIR_TREAD, 0.06, 1.9), copper, treads, 'treppe_stufen', stairGroup);

    const slope = Math.atan2(GY1, STAIR_RUN);
    const railGrp = new THREE.Group();
    railGrp.rotation.order = 'YXZ';
    railGrp.rotation.z = slope;
    railGrp.name = 'treppe_gelaender';
    stairGroup.add(railGrp);
    for (const h of [0.52, 1.06]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(STAIR_RUN + 0.3, 0.06, 0.06), railMat);
      r.position.set(STAIR_RUN / 2, h, 0);
      r.name = 'treppe_handlauf';
      railGrp.add(r);
    }
    const posts = [];
    for (let i = 0; i <= 4; i++) {
      const x = -STAIR_RUN / 2 + (i * STAIR_RUN) / 4;
      const h = GY1 * ((x + STAIR_RUN / 2) / STAIR_RUN);
      posts.push([x, h + 0.55, 0, 0]);
    }
    inst(new THREE.BoxGeometry(0.07, 1.1, 0.07), railMat, posts, 'treppe_gelaender_pfosten', stairGroup);

    const c = new THREE.Mesh(new THREE.BoxGeometry(STAIR_RUN + 0.2, 0.24, 1.9));
    c.name = 'COL_treppe_rampe';
    c.rotation.order = 'YXZ';
    c.rotation.set(0, 0, slope);
    c.position.set(0, GY1 / 2, 0);
    c.visible = false;
    stairGroup.add(c);
  }

  // Geländer der Galerie (Pfosten instanziert + Handläufe)
  const posts = [];
  for (let k = 0; k < 6; k++) {
    const len = S[k].len, n = Math.floor(len / 1.2);
    const t0 = (k === STAIR_SIDE) ? STAIR_RUN : 0;
    for (let i = 0; i <= n; i++) {
      const t = i * 1.2;
      if (t < t0 || t > len) continue;
      const p = at(k, t, BAND + 0.05);
      posts.push([p[0], GY1 + 0.55, p[1], S[k].rot]);
    }
  }
  inst(new THREE.BoxGeometry(0.07, 1.1, 0.07), railMat, posts, 'gelander_pfosten');
  for (let k = 0; k < 6; k++) {
    const len = S[k].len;
    const t0 = (k === STAIR_SIDE) ? STAIR_RUN : 0, t1 = len;
    const mid = at(k, (t0 + t1) / 2, BAND + 0.05);
    const l = t1 - t0;
    box(l, 0.06, 0.06, railMat, mid[0], GY1 + 1.05, mid[1], `gelander_${k}_oben`, S[k].rot);
    box(l, 0.05, 0.05, railMat, mid[0], GY1 + 0.50, mid[1], `gelander_${k}_mitte`, S[k].rot);
    const lg = at(k, (t0 + t1) / 2, BAND - 0.02);
    box(l, 0.04, 0.05, glowMat, lg[0], GY0 - 0.02, lg[1], `galerie_licht_${k}`, S[k].rot);
  }

  // -------------------------------------------------------------- Säulen
  const colDefs = [];
  for (let k = 1; k < 6; k++) {
    const a = k * Math.PI / 3;
    colDefs.push([Math.cos(a) * 9.2, Math.sin(a) * 9.2]);
  }
  colDefs.forEach((c, i) => {
    const m = box(0.44, H - 0.2, 0.44, pillar, c[0], (H - 0.2) / 2, c[1], `saeule_${i + 1}`);
    m.rotation.z = 0.05;
    // schräge Verstrebung zur Decke
    const br = box(0.18, 2.6, 0.18, copper, c[0] * 0.92, H - 1.4, c[1] * 0.92, `saeule_strebe_${i + 1}`);
    br.rotation.z = -Math.atan2(c[1] * 0.12, 1.2) * Math.sign(c[0] || 1);
    br.rotation.x = Math.atan2(c[1] * 0.12, 1.2) * Math.sign(c[1] || 1);
  });

  // -------------------------------------------------------------- Decke
  const ceilShape = new THREE.Shape();
  V.forEach((p, i) => { const x = p[0], y = -p[1]; if (i === 0) ceilShape.moveTo(x, y); else ceilShape.lineTo(x, y); });
  ceilShape.closePath();
  const rh = new THREE.Path(); rh.absarc(0, 0, roofR, 0, Math.PI * 2, true); ceilShape.holes.push(rh);
  const ceilGeo = new THREE.ExtrudeGeometry(ceilShape, { depth: 0.3, bevelEnabled: false, curveSegments: 48 });
  const ceiling = new THREE.Mesh(ceilGeo, dbl(ceilMat));
  ceiling.rotation.x = -Math.PI / 2; ceiling.position.y = H; ceiling.name = 'decke_hauptscheibe';
  root.add(ceiling);

  // Rahmen um die Dachluke (Polygon aus 8 Kästen)
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    const p = [Math.cos(a) * (roofR + 0.14), H - 0.04, Math.sin(a) * (roofR + 0.14)];
    box(roofR * 0.80, 0.18, 0.14, copper, p[0], p[1], p[2], `decke_rahmen_${k + 1}`, Math.PI / 2 - a);
  }
  // radiale Deckenrippen und Lichtfelder über der Galerie
  const ribs = [], ceilLights = [];
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3 + Math.PI / 6;
    const p = [Math.cos(a) * 7.9, H - 0.16, Math.sin(a) * 7.9];
    ribs.push([p[0], p[1], p[2], Math.PI / 2 - a]);
    const q = at(k, S[k].len / 2, BAND / 2);
    ceilLights.push([q[0], H - 0.06, q[1], S[k].rot]);
  }
  inst(new THREE.BoxGeometry(4.8, 0.22, 0.28), wallDark, ribs, 'decke_rippen');
  inst(new THREE.BoxGeometry(4.4, 0.06, 1.1), glowMat, ceilLights, 'decke_lichtfeld');

  // --------------------------------------------------------- Bodenluke (8 Segmente)
  // Jedes Segment ist ein Kreissektor und fährt radial in den Bodenring zurück.
  const floorPetals = [], floorCols = [];
  const floorBase = -0.21, floorTh = 0.2;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    const g = new THREE.Group();
    g.name = `bodenluke_segment_${k + 1}`;
    g.rotation.y = -a;
    root.add(g);
    const blade = new THREE.Mesh(sectorGeo(floorR, Math.PI / 8, floorTh, 10), dbl(floorMat));
    blade.name = `bodenluke_fluegel_${k + 1}`;
    blade.position.y = floorBase;
    g.add(blade);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(floorR * 0.95, 0.10, 0.10), copper);
    edge.name = `bodenluke_kante_${k + 1}`;
    edge.position.set(floorR * 0.50, floorBase + 0.02, 0);
    g.add(edge);
    const c = new THREE.Mesh(new THREE.BoxGeometry(floorR * 1.0, 0.18, floorR * 0.9));
    c.name = `COL_bodenluke_fluegel_${k + 1}`;
    c.position.set(floorR * 0.40, floorBase + 0.09, 0);
    c.visible = false;
    c.userData = { aktiv: true };
    g.add(c);
    floorCols.push(c);
    floorPetals.push({ g, a });
  }
  // Schachtrahmen der Bodenluke
  const shaftRing = new THREE.Mesh(new THREE.TorusGeometry(floorR + 0.05, 0.10, 8, 64), copper);
  shaftRing.rotation.x = -Math.PI / 2; shaftRing.position.y = -0.02;
  shaftRing.name = 'bodenluke_schachtrahmen'; root.add(shaftRing);

  // ---------------------------------------------------- Dachluke (8 Segmente)
  const roofPetals = [], roofCols = [];
  const roofBase = H + 0.05, roofTh = 0.2;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    const g = new THREE.Group();
    g.name = `dachluke_segment_${k + 1}`;
    g.rotation.y = -a;
    root.add(g);
    const blade = new THREE.Mesh(sectorGeo(roofR, Math.PI / 8, roofTh, 10), dbl(wallDark));
    blade.name = `dachluke_fluegel_${k + 1}`;
    blade.position.y = roofBase;
    g.add(blade);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(roofR * 0.95, 0.12, 0.12), copper);
    rim.name = `dachluke_kante_${k + 1}`;
    rim.position.set(roofR * 0.50, roofBase + 0.10, 0);
    g.add(rim);
    const c = new THREE.Mesh(new THREE.BoxGeometry(roofR * 1.0, 0.18, roofR * 0.9));
    c.name = `COL_dachluke_fluegel_${k + 1}`;
    c.position.set(roofR * 0.40, roofBase + 0.09, 0);
    c.visible = false;
    c.userData = { aktiv: true };
    g.add(c);
    roofCols.push(c);
    roofPetals.push({ g, a });
  }

  // ---------------------------------------------------- Objektplätze
  // Puddle Jumper in vier Parkbuchten unter der Galerie, längs der Wand
  let ji = 0;
  for (const k of [1, 2, 3, 5]) {
    const s = S[k];
    // parallel zur Wand unter der Galerie: Jumper 7,9 m lang, Wandseite 12,1 m; Mitte 2,3 m vor der Wand
    // (Rumpf 3,2 m breit → 0,7 m Abstand zur Wand, Bodenluke in der Raummitte bleibt frei)
    const tangente = [-s.n[1], s.n[0]];
    const p = at(k, s.len / 2, 2.3);
    ji++;
    place(ji === 1 ? 'PLACE_OBJ-009' : `PLACE_OBJ-009_${ji}`, p[0], 0, p[1], Math.atan2(tangente[0], tangente[1]));
  }
  // Antiker Druckanzug an der Südkante
  place('PLACE_OBJ-057', -3.4, 0, -A + 0.52, 0);
  // Naquadah-Flüssigtreibstoff-Lader
  place('PLACE_OBJ-078', 3.6, 0, -A + 0.52, 0);
  // Notfall-Sanitätsrucksack
  place('PLACE_OBJ-067', -2.0, 0, -9.0, 0.45);
  // Dachluke ist im Raum selbst gebaut (dachluke_*) – OBJ-038 nicht zusätzlich platzieren

  // ---------------------------------------------------- Anschlüsse / Türen
  {
    const k = DOOR_SIDE, c = S[k].len / 2;
    const p = at(k, c, -T / 2);
    place('DOOR_sued', p[0], 0, p[1], Math.PI, {
      breite: DOOR_W, hoehe: DOOR_H, ziel: 'Turmkorridor zur Steuerebene', raum: 'ATL-049',
    });
    place('PLACE_OBJ-091', p[0], 0, p[1], 0);
  }

  // ------------------------------------------------------------- Lichter
  const lampFixtures = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + k * Math.PI / 3;
    const x = Math.cos(a) * 7.4, z = Math.sin(a) * 7.4;
    place(`LAMP_${k + 1}`, x, 5.75, z, 0, { color: '#9fd8ff', intensity: 9, distance: 15 });
    // sichtbare Leuchte unter der Decke
    box(1.5, 0.22, 0.5, wallDark, x, 5.95, z, `decke_leuchte_${k + 1}`, -a);
    box(1.3, 0.05, 0.34, glowMat, x, 5.82, z, `decke_leuchte_licht_${k + 1}`, -a);
    lampFixtures.push([x, 5.82, z, -a]);
  }
  // Bernstein-Akzentleuchten an den Landeplatz-Markierungen
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + Math.PI / 4;
    const x = Math.cos(a) * (floorR + 1.0), z = Math.sin(a) * (floorR + 1.0);
    box(0.45, 0.06, 0.16, amber, x, 0.03, z, `boden_akzentleuchte_${k + 1}`, -a);
  }

  // ----------------------------------------------------------- Kollision
  // Bodenring (acht Kästen) – lässt die Bodenluke frei
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    // lückenlos: 9,6 m breit, radial von 4,3 m (Lukenrand) bis 12,3 m (über die Sechseck-Ecken hinaus)
    collider(`COL_boden_${k + 1}`, 9.6, 0.2, 8.0, Math.cos(a) * 8.3, -0.1, Math.sin(a) * 8.3, Math.PI / 2 - a);
  }
  // Deckenband (lässt die Dachluke frei)
  for (let k = 0; k < 6; k++) {
    const p = at(k, S[k].len / 2, 2.1);
    collider(`COL_decke_${k + 1}`, S[k].len, 0.3, 4.2, p[0], H + 0.15, p[1], S[k].rot);
  }
  // Wände (an der Türöffnung geteilt)
  for (let k = 0; k < 6; k++) {
    const len = S[k].len;
    if (k === DOOR_SIDE) {
      const c = len / 2;
      const pl = at(k, (c - doorHalf) / 2, -T / 2);
      const pr = at(k, (c + doorHalf + len) / 2, -T / 2);
      const ps = at(k, c, -T / 2);
      collider('COL_wand_sued_links', c - doorHalf, H, T, pl[0], H / 2, pl[1], S[k].rot);
      collider('COL_wand_sued_rechts', len - c - doorHalf, H, T, pr[0], H / 2, pr[1], S[k].rot);
      collider('COL_wand_sued_sturz', DOOR_W, H - DOOR_H, T, ps[0], DOOR_H + (H - DOOR_H) / 2, ps[1], S[k].rot);
    } else {
      const p = at(k, len / 2, -T / 2);
      collider(`COL_wand_${k}`, len, H, T, p[0], H / 2, p[1], S[k].rot);
    }
  }
  // Galerie
  for (let k = 0; k < 6; k++) {
    const t0 = (k === STAIR_SIDE) ? STAIR_RUN : 0;
    const p = at(k, (t0 + S[k].len) / 2, BAND / 2);
    collider(`COL_galerie_${k}`, S[k].len - t0, 0.3, BAND, p[0], (GY0 + GY1) / 2, p[1], S[k].rot);
  }
  // Säulen
  colDefs.forEach((c, i) => collider(`COL_saeule_${i + 1}`, 0.5, H - 0.2, 0.5, c[0], (H - 0.2) / 2, c[1]));

  // ------------------------------------------- Funktionen: Boden-/Dachluke
  const state = { boden: 0, bodenZiel: 0, dach: 0, dachZiel: 0 };
  const api = {
    bodenluke_oeffnen() { state.bodenZiel = 1; },
    bodenluke_schliessen() { state.bodenZiel = 0; },
    dachluke_oeffnen() { state.dachZiel = 1; },
    dachluke_schliessen() { state.dachZiel = 0; },
  };
  root.userData.api = api;
  root.userData.actions = [
    { id: 'bodenluke_oeffnen', label: 'Bodenluke öffnen', run: () => api.bodenluke_oeffnen() },
    { id: 'bodenluke_schliessen', label: 'Bodenluke schließen', run: () => api.bodenluke_schliessen() },
    { id: 'dachluke_oeffnen', label: 'Dachluke öffnen', run: () => api.dachluke_oeffnen() },
    { id: 'dachluke_schliessen', label: 'Dachluke schließen', run: () => api.dachluke_schliessen() },
  ];

  let last = null;
  const updateLuken = () => {
    const now = performance.now() / 1000;
    const dt = last === null ? 0 : Math.min(now - last, 0.05);
    last = now;
    if (dt > 0) {
      state.boden += (state.bodenZiel - state.boden) * Math.min(1, dt * 1.5);
      state.dach += (state.dachZiel - state.dach) * Math.min(1, dt * 1.5);
    }
    floorPetals.forEach((p, i) => {
      const s = floorR * state.boden;
      p.g.position.set(Math.cos(p.a) * s, 0, Math.sin(p.a) * s);
      floorCols[i].userData.aktiv = state.boden < 0.02;
    });
    roofPetals.forEach((p, i) => {
      const s = roofR * state.dach;
      p.g.position.set(Math.cos(p.a) * s, 0, Math.sin(p.a) * s);
      roofCols[i].userData.aktiv = state.dach < 0.02;
    });
    lineGlow.emissiveIntensity = 1.7 + Math.sin(now * 0.7) * 0.12;
  };
  root.onBeforeRender = updateLuken;
  const animMesh = lampFixtures.length ? null : null;
  // Animation hängt zusätzlich an einem sichtbaren Element (wird zuverlässig gerendert)
  const lightAnchor = root.getObjectByName('decke_leuchte_1');
  if (lightAnchor) lightAnchor.onBeforeRender = updateLuken;

  root.userData.raum = { id: 'ATL-040', name: 'Jumper-Bay', etage: 5, bereich: 'South-West Pier' };
  return root;
}

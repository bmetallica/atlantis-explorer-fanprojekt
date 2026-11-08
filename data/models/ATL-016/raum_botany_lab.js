// Raum ATL-016: Botanik-Labor (East Pier, Etage 3).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Unregelmäßiges, gestrecktes SECHSECK (ca. 8 m breit × 11,6 m lang) mit 60°/120°-Ecken:
// zwei lange Seitenwände (West / Ost) und je zwei schräge Stirnwände.
// Türen: Pflanzenkammer (ATL-017) an der nördlichen Schrägwand, Kurzschluss-Halle
// (ATL-049) an der Ostwand, Treppenhaus (ATL-003) an der südlichen Schrägwand (Hauptzugang −Z).
// Leere Hülle: Architektur, integrierte Pflanzbeete, Glasfronten, UV-Lichtfelder,
// Pfeiler mit Lichtpunkten – keine Möbel, nur Objektplätze für OBJ-022 / OBJ-089.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_botany_lab',
  art: 'Raum',
  masse: 'ca. 8,0 m breit × 11,6 m lang, Sechseck-Grundriss (60°/120°-Ecken), 4,5 m lichte Höhe',
  wohin: 'East Pier, Etage 3, Abzweig Botany Lab / Plant Room',
  benutzen: 'Forschungsbereich für Hydrokultur-Zuchtbehälter (OBJ-022) und Nährstoffmischer (OBJ-089); Arbeitsflächen, Pflanzenregale und Erntetische bleiben frei',
  lichter: '6 LAMP_ eisblau, 2 LAMP_ violett für die UV-Lichtfelder; eingebaute Lichtschlitze an Pfeilern, Wandpaneelen und Fensterständern',
  animation: 'UV-Lichtfelder pulsieren langsam; Lichtschlitze, Deckenbänder und Grow-Light-Leisten atmen dezent',
  quelle: 'Rekonstruiert nach „Quarantine“ (Staffel 4), Produktions-Konzeptzeichnung „Plant Room / Botany Lab“ und Screencaps',
};

export const varianten = [
  { label: 'Botanik-Labor Sechseck (8,0 × 11,6 m)', opts: {} },
];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_botany_lab';

  // ------------------------------------------------------------------ Maße
  const H = 4.5;        // lichte Höhe
  const T = 0.3;        // Wanddicke
  const DW = 2.4;      // Durchgangsbreite
  const DH = 3.0;      // Durchgangshöhe
  const SILL = 1.1;    // Fensterbank
  const HEAD = 3.6;    // Fensterkopf

  // Grundriss: unregelmäßiges Sechseck, Längsachse entlang Z.
  // Reihenfolge im Uhrzeigersinn (X/Z), Start = Westecke Süd.
  const P = [
    [-4.0, -3.0], // A West/Süd
    [-4.0, 3.0],  // B West/Nord
    [0.0, 5.8],   // C Nordspitze
    [4.0, 3.0],   // D Ost/Nord
    [4.0, -3.0],  // E Ost/Süd
    [0.0, -5.8],  // F Südspitze
  ];

  const edges = P.map((a, i) => {
    const b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    return {
      i, a, b, dx, dz, L, ux, uz,
      nx: uz, nz: -ux,          // Innennormale (Richtung Rauminneres)
      th: -Math.atan2(dz, dx),  // Wandrotation (lokales X entlang der Kante)
    };
  });

  // Türdefinitionen: s = Position entlang der Kante (Standard: Kantenmitte).
  const doorDefs = {
    2: { name: 'pflanzenkammer', ziel: 'ATL-017 Pflanzenkammer', raum: 'ATL-017' },
    3: { name: 'korridor', ziel: 'ATL-049 Kurzschluss-Halle (Short-cut Hall)', raum: 'ATL-049', s: 2.4 },
    5: { name: 'treppe', ziel: 'ATL-003 Treppenhaus / Ausgang East Pier', raum: 'ATL-003' },
  };
  const doorS = (e) => (doorDefs[e.i].s !== undefined ? doorDefs[e.i].s : e.L / 2);

  // ------------------------------------------------------------------ Materialien
  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glass = kit('glass');
  const glow = kit('glow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xe8f7ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7,
  });
  const uvGlow = new THREE.MeshStandardMaterial({
    name: 'uv_feld', color: 0xcbbcff, emissive: 0x7a5cff, emissiveIntensity: 1.25, roughness: 0.4,
  });
  const growGlow = new THREE.MeshStandardMaterial({
    name: 'grow_licht', color: 0xd9cdff, emissive: 0x9a72ff, emissiveIntensity: 1.35, roughness: 0.4,
  });
  const bedSoil = new THREE.MeshStandardMaterial({
    name: 'beet_substrat', color: 0x27301f, roughness: 0.96, metalness: 0.04,
  });
  const leafA = new THREE.MeshStandardMaterial({
    name: 'laub_dunkel', color: 0x1f4a2b, roughness: 0.82, side: THREE.DoubleSide,
  });
  const leafB = new THREE.MeshStandardMaterial({
    name: 'laub_hell', color: 0x2f6b3a, roughness: 0.8, side: THREE.DoubleSide,
  });
  const leafC = new THREE.MeshStandardMaterial({
    name: 'laub_busch', color: 0x255632, roughness: 0.9,
  });

  // ------------------------------------------------------------------ Helfer
  const box = (w, h, d, mat, x, y, z, name, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((e, n) => {
      dummy.position.set(e[0], e[1], e[2]);
      dummy.rotation.set(e[4] || 0, e[3] || 0, e[5] || 0);
      dummy.scale.set(e[6] ?? 1, e[7] ?? 1, e[8] ?? 1);
      dummy.updateMatrix();
      im.setMatrixAt(n, dummy.matrix);
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
  const col = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
  };
  const edgePoint = (e, s) => new THREE.Vector3(e.a[0] + e.ux * s, 0, e.a[1] + e.uz * s);
  const edgeCenter = (e, s0, s1) => edgePoint(e, (s0 + s1) / 2);
  const freeIntervals = (e) => {
    if (!doorDefs[e.i]) return [[0, e.L]];
    const s = doorS(e);
    return [[0, s - DW / 2], [s + DW / 2, e.L]];
  };

  // ------------------------------------------------------------------ Boden (Polygon)
  const shape = new THREE.Shape(P.map(([x, z]) => new THREE.Vector2(x, z)));
  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
  floorGeo.rotateX(Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.name = 'boden';
  root.add(floorMesh);

  const colGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false });
  colGeo.rotateX(Math.PI / 2);
  const floorCol = new THREE.Mesh(colGeo);
  floorCol.name = 'COL_boden';
  floorCol.visible = false;
  root.add(floorCol);

  // Bodenfugen (1,2-m-Raster), alle innerhalb der Hülle
  const seamList = [];
  const halfAt = (z) => (Math.abs(z) <= 3.0 ? 4.0 : 4.0 * (5.8 - Math.abs(z)) / 2.8);
  for (let z = -4.8; z <= 4.81; z += 1.2) {
    const half = halfAt(z);
    seamList.push([0, 0.006, z, 0, 0, 0, Math.max(0.4, half * 2 - 0.3), 1, 1]);
  }
  inst(new THREE.BoxGeometry(1, 0.012, 0.025), copper, seamList, 'boden_fugen');

  // Radiale Intarsie (Schneeflocken-/Sternmotiv)
  const rays = [];
  for (const [x, z] of P) {
    const len = Math.hypot(x, z) - 0.35;
    rays.push([x / 2, 0.012, z / 2, Math.atan2(-z, x), 0, 0, len, 1, 1]);
  }
  inst(new THREE.BoxGeometry(1, 0.012, 0.045), copper, rays, 'boden_intarsie_strahlen');
  const hexRing = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.88, 6), copper);
  hexRing.rotation.x = -Math.PI / 2;
  hexRing.position.set(0, 0.013, 0);
  hexRing.name = 'boden_intarsie';
  root.add(hexRing);

  // Grün-kupferner Randstreifen entlang der Polygonbasis
  for (const e of edges) {
    const c = edgeCenter(e, 0, e.L);
    box(e.L - 0.1, 0.012, 0.2, patina, c.x + e.nx * 0.13, 0.006, c.z + e.nz * 0.13, 'boden_rand', e.th);
  }

  // ------------------------------------------------------------------ Wände
  const panelFrames = [];
  const panels = [];
  const slotList = [];
  let doorIndex = 0;

  for (const e of edges) {
    const def = doorDefs[e.i];
    const intervals = freeIntervals(e);

    if (!def) {
      // -------- Fensterband: Sockel, Glas, Kopfband, Rahmen, Sprossen
      const c = edgeCenter(e, 0, e.L);
      box(e.L, SILL, T, wall, c.x, SILL / 2, c.z, `wand_${e.i}_sockel`, e.th);
      box(e.L, H - HEAD, T, wall, c.x, (H + HEAD) / 2, c.z, `wand_${e.i}_oberteil`, e.th);
      box(e.L - 0.12, HEAD - SILL, 0.06, glass, c.x, (SILL + HEAD) / 2, c.z, `fenster_${e.i}_glas`, e.th);
      box(e.L + 0.06, 0.16, T + 0.08, copper, c.x, SILL, c.z, `fenster_${e.i}_rahmen_unten`, e.th);
      box(e.L + 0.06, 0.14, T + 0.08, copper, c.x, HEAD, c.z, `fenster_${e.i}_rahmen_oben`, e.th);
      const nMul = Math.max(1, Math.round(e.L / 1.35));
      for (let k = 0; k <= nMul; k++) {
        const s = (k / nMul) * e.L;
        const p = edgePoint(e, s);
        box(0.12, HEAD - SILL, T + 0.06, copper, p.x, (SILL + HEAD) / 2, p.z, `fenster_${e.i}_sprosse`, e.th);
        // senkrechter Lichtschlitz auf der Innenseite des Ständers
        slotList.push([p.x + e.nx * 0.10, 2.3, p.z + e.nz * 0.10, e.th]);
      }
      col(`COL_wand_${e.i}`, e.L, H, T, c.x, H / 2, c.z, e.th);
    } else {
      // -------- Wandabschnitte links/rechts der Öffnung (je 1,2 m Schiebelauf)
      for (const [s0, s1] of intervals) {
        if (s1 - s0 < 0.02) continue;
        const c = edgeCenter(e, s0, s1);
        box(s1 - s0, H, T, wall, c.x, H / 2, c.z, `wand_${e.i}_abschnitt_${s0.toFixed(1)}`, e.th);
        col(`COL_wand_${e.i}_${s0.toFixed(1)}`, s1 - s0, H, T, c.x, H / 2, c.z, e.th);

        // Wandpaneele (plant-ons) im 1,2-m-Raster, dazwischen Lichtschlitze
        const len = s1 - s0;
        const n = Math.max(1, Math.round(len / 1.2));
        const fld = len / n;
        for (let k = 0; k < n; k++) {
          const pc = edgeCenter(e, s0 + k * fld, s0 + (k + 1) * fld);
          if (k % 2 === 0) {
            panelFrames.push([pc.x + e.nx * 0.05, 1.62, pc.z + e.nz * 0.05, e.th]);
            panels.push([pc.x + e.nx * 0.02, 1.62, pc.z + e.nz * 0.02, e.th]);
          } else {
            for (let q = 0; q < 3; q++) {
              slotList.push([pc.x + e.nx * 0.075, 1.0 + q * 0.55, pc.z + e.nz * 0.075, e.th]);
            }
          }
        }
      }
      // Sturz über der Öffnung
      const cDoor = edgePoint(e, doorS(e));
      box(DW, H - DH, T, wall, cDoor.x, DH + (H - DH) / 2, cDoor.z, `wand_${e.i}_sturz`, e.th);
      col(`COL_wand_${e.i}_sturz`, DW, H - DH, T, cDoor.x, DH + (H - DH) / 2, cDoor.z, e.th);
      // Bronzefassung der Öffnung
      box(DW + 0.28, 0.14, T + 0.07, copper, cDoor.x, DH, cDoor.z, `tuerfassung_${e.i}_oben`, e.th);
      for (const sgn of [-1, 1]) {
        const p = edgePoint(e, doorS(e) + sgn * (DW / 2 + 0.07));
        box(0.14, DH, T + 0.07, copper, p.x, DH / 2, p.z, `tuerfassung_${e.i}_seite`, e.th);
      }
      // Zierpaneel über der Tür
      panelFrames.push([cDoor.x + e.nx * 0.05, 3.92, cDoor.z + e.nz * 0.05, e.th]);
      panels.push([cDoor.x + e.nx * 0.02, 3.92, cDoor.z + e.nz * 0.02, e.th]);

      // Anschlussmarker (zeigt nach außen) + Antiker-Schiebetür (Vorderseite in den Raum)
      doorIndex++;
      empty(`DOOR_${def.name}`, cDoor.x, 0, cDoor.z, Math.atan2(-e.nx, -e.nz), {
        breite: DW, hoehe: DH, ziel: def.ziel, raum: def.raum,
      });
      empty(doorIndex === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorIndex}`,
        cDoor.x, 0, cDoor.z, Math.atan2(e.nx, e.nz));
    }

    // -------- Sockelleiste und Gesims (Türöffnungen ausgespart)
    for (const [s0, s1] of intervals) {
      if (s1 - s0 < 0.05) continue;
      const c = edgeCenter(e, s0, s1);
      box(s1 - s0 - 0.02, 0.15, 0.05, copper, c.x + e.nx * 0.025, 0.075, c.z + e.nz * 0.025,
        `sockelleiste_${e.i}`, e.th);
      box(s1 - s0 - 0.02, 0.10, 0.06, copper, c.x + e.nx * 0.03, H - 0.05, c.z + e.nz * 0.03,
        `gesims_${e.i}`, e.th);
    }
  }

  // ------------------------------------------------------------------ Eckpfeiler (Sternpunkte des Setplans)
  const columns = [];
  const columnSlots = [];
  for (let i = 0; i < P.length; i++) {
    const prev = edges[(i - 1 + edges.length) % edges.length];
    const next = edges[i];
    let bx = prev.nx + next.nx, bz = prev.nz + next.nz;
    const bl = Math.hypot(bx, bz) || 1;
    bx /= bl; bz /= bl;
    const x = P[i][0] + bx * 0.28, z = P[i][1] + bz * 0.28;
    columns.push([x, (H - 0.1) / 2, z, 0, 0, 0]);
    col('COL_pfeiler', 0.46, H - 0.1, 0.46, x, (H - 0.1) / 2, z);
    // helle Lichtpunkte am Pfeiler (Screencap-Motiv)
    for (let k = 0; k < 8; k++) {
      columnSlots.push([x + bx * 0.235, 0.95 + k * 0.38, z + bz * 0.235, 0]);
    }
  }
  inst(new THREE.BoxGeometry(0.46, H - 0.1, 0.46), pillarMat, columns, 'pfeiler');
  const columnCaps = columns.map((c) => [c[0], H - 0.13, c[2], 0, 0, 0]);
  inst(new THREE.BoxGeometry(0.58, 0.26, 0.58), copper, columnCaps, 'pfeiler_köpfe');

  const slotMesh = inst(new THREE.BoxGeometry(0.07, 0.07, 0.05), lineGlow, columnSlots, 'pfeiler_lichtpunkte');
  const mullionSlots = inst(new THREE.BoxGeometry(0.05, 0.30, 0.05), lineGlow,
    slotList.map((s) => [s[0], s[1], s[2], s[3]]), 'wand_lichtschlitze');

  inst(new THREE.BoxGeometry(1.22, 1.08, 0.06), copper, panelFrames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.06, 0.92, 0.04), wallDark, panels, 'paneele');

  // ------------------------------------------------------------------ Integrierte Pflanzbeete (fest eingebaute Architektur)
  const rnd = mulberry32(20240716);
  const frondsA = [], frondsB = [], bushes = [];
  const growBars = [];

  const edgeBed = (e, s0, s1, width, name, density = 6) => {
    const c = edgeCenter(e, s0, s1);
    const len = s1 - s0;
    const x = c.x + e.nx * (width / 2 + 0.02);
    const z = c.z + e.nz * (width / 2 + 0.02);
    box(len, 0.42, width, wallDark, x, 0.21, z, `${name}_koerper`, e.th);
    box(len, 0.05, 0.09, copper, x, 0.42, z, `${name}_rand`, e.th);
    box(len - 0.12, 0.04, width - 0.12, bedSoil, x, 0.41, z, `${name}_substrat`, e.th);
    col(`COL_${name}`, len, 0.5, width, x, 0.25, z, e.th);
    // Entwässerungsrinne vor dem Beet
    box(len - 0.2, 0.03, 0.1, copper, c.x + e.nx * (width + 0.09), 0.015, c.z + e.nz * (width + 0.09), `${name}_rinne`, e.th);
    // Bewässerungs-/Grow-Light-Leiste über dem Beet (fest eingebaut)
    const gx = c.x + e.nx * (width / 2 + 0.02);
    const gz = c.z + e.nz * (width / 2 + 0.02);
    box(len - 0.2, 0.09, 0.14, copper, gx, 2.62, gz, `${name}_grow_leiste`, e.th);
    box(len - 0.34, 0.035, 0.07, growGlow, gx, 2.56, gz, `${name}_grow_leuchte`, e.th);
    for (const sgn of [-1, 1]) {
      const p = edgePoint(e, sgn < 0 ? s0 + 0.25 : s1 - 0.25);
      box(0.07, 1.85, 0.07, copper, p.x + e.nx * 0.1, 1.32, p.z + e.nz * 0.1, `${name}_aufhaenger`, e.th);
    }
    growBars.push([gx, 2.56, gz, e.th]);

    const n = Math.max(5, Math.round(len * density));
    for (let i = 0; i < n; i++) {
      const s = s0 + 0.15 + rnd() * Math.max(0.1, len - 0.3);
      const p = edgePoint(e, s);
      const px = p.x + e.nx * (0.14 + rnd() * Math.max(0.05, width - 0.28));
      const pz = p.z + e.nz * (0.14 + rnd() * Math.max(0.05, width - 0.28));
      const nl = 5 + Math.floor(rnd() * 4);
      for (let k = 0; k < nl; k++) {
        const h = 0.65 + rnd() * 1.35;
        const target = rnd() < 0.5 ? frondsA : frondsB;
        target.push([
          px + (rnd() - 0.5) * 0.26, 0.42, pz + (rnd() - 0.5) * 0.26,
          rnd() * Math.PI * 2, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6,
          0.85 + rnd() * 0.5, h, 0.85 + rnd() * 0.5,
        ]);
      }
      if (rnd() < 0.75) {
        const s2 = 0.6 + rnd() * 0.55;
        bushes.push([px, 0.42 + 0.24 * s2, pz, rnd() * 3, 0, 0, s2, s2 * 0.85, s2]);
      }
    }
  };

  edgeBed(edges[1], 0.25, edges[1].L - 0.25, 0.85, 'beet_nordwest'); // NW-Schrägwand (Glas)
  edgeBed(edges[4], 0.25, edges[4].L - 0.25, 0.85, 'beet_suedost');  // SE-Schrägwand (Glas)

  // Blattform als angetapptes Blatt (keine Rundkörper als Pflanzen)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.16, 0.38, 0, 1);
  leafShape.quadraticCurveTo(-0.16, 0.38, 0, 0);
  const frondGeo = new THREE.ShapeGeometry(leafShape, 6);
  frondGeo.translate(0, 0.02, 0);
  inst(frondGeo, leafA, frondsA, 'beet_belaubung_a');
  inst(frondGeo, leafB, frondsB, 'beet_belaubung_b');
  inst(new THREE.IcosahedronGeometry(0.24, 0), leafC, bushes, 'beet_buschwerk');

  // ------------------------------------------------------------------ Decke (Polygon)
  const ceilShape = new THREE.Shape(P.map(([x, z]) => new THREE.Vector2(x, -z)));
  const ceilGeo = new THREE.ExtrudeGeometry(ceilShape, { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
  ceilMesh.name = 'decke_hauptebene';
  ceilMesh.position.y = H;
  root.add(ceilMesh);

  const ceilColGeo = new THREE.ExtrudeGeometry(ceilShape, { depth: 0.3, bevelEnabled: false });
  ceilColGeo.rotateX(-Math.PI / 2);
  const ceilCol = new THREE.Mesh(ceilColGeo);
  ceilCol.name = 'COL_decke';
  ceilCol.position.y = H;
  ceilCol.visible = false;
  root.add(ceilCol);

  // Deckenträger und Lichtbänder
  for (const z of [-2.4, 0, 2.4]) box(6.6, 0.16, 0.22, copper, 0, H - 0.1, z, 'decke_traeger_quer');
  for (const x of [-2.9, 2.9]) box(0.16, 0.16, 10.6, copper, x, H - 0.1, 0, 'decke_traeger_laengs');
  for (const x of [-2.9, 2.9]) box(0.08, 0.05, 10.4, glow, x, H - 0.2, 0, 'decke_lichtband');

  // Abgehängte Kassettenfelder
  const coffers = [];
  for (const z of [-3.6, -1.2, 1.2, 3.6]) {
    for (const x of [-1.5, 1.5]) coffers.push([x, H - 0.03, z, 0, 0, 0]);
  }
  inst(new THREE.BoxGeometry(1.9, 0.06, 1.9), wallDark, coffers, 'decke_kassetten');

  // ------------------------------------------------------------------ UV-Lichtfelder
  const uvDefs = [
    [-2.0, 1.6, 1.8, 0.8], [2.0, 1.6, 1.8, 0.8],
    [-2.0, -1.6, 1.8, 0.8], [2.0, -1.6, 1.8, 0.8],
    [0, 3.6, 1.6, 0.7], [0, -3.6, 1.6, 0.7],
  ];
  for (const [x, z, w, d] of uvDefs) {
    box(w, 0.07, d, uvGlow, x, H - 0.05, z, 'decke_uv_feld');
    box(w + 0.12, 0.06, 0.06, copper, x, H - 0.05, z - d / 2 - 0.03, 'decke_uv_rahmen');
    box(w + 0.12, 0.06, 0.06, copper, x, H - 0.05, z + d / 2 + 0.03, 'decke_uv_rahmen');
    box(0.06, 0.06, d + 0.12, copper, x - w / 2 - 0.03, H - 0.05, z, 'decke_uv_rahmen');
    box(0.06, 0.06, d + 0.12, copper, x + w / 2 + 0.03, H - 0.05, z, 'decke_uv_rahmen');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(0.05, 0.24, 0.05, copper, x + sx * (w / 2 - 0.1), H + 0.07, z + sz * (d / 2 - 0.12), 'decke_uv_abhaengung');
    }
  }

  // ------------------------------------------------------------------ Objektplätze
  // OBJ-022 Hydrokultur-Zuchtbehälter (2,91 B × 1,70 H × 1,19 T) entlang der langen Westwand.
  // Rückseite an der Wandinnenfläche (0,15 m Wandmitte → 0,15 m Innenabstand), Front in den Raum.
  const container = (edge, s, name) => {
    const p = edgePoint(edge, s);
    const off = T / 2 + 1.19 / 2;
    const x = p.x + edge.nx * off;
    const z = p.z + edge.nz * off;
    empty(name, x, 0, z, Math.atan2(edge.nx, edge.nz));
  };
  container(edges[0], 4.5, 'PLACE_OBJ-022');    // Westwand, Nordhälfte
  container(edges[0], 1.5, 'PLACE_OBJ-022_2');  // Westwand, Südhälfte

  // OBJ-089 Botanischer Nährstoffmischer (1,90 B × 1,61 H × 0,77 T), Wandobjekt an der
  // Ostwand im südlichen Wandsegment (hinter der Korridortür), Rückseite an der Wandinnenfläche.
  {
    const e = edges[3];
    const p = edgePoint(e, 4.8);
    const x = p.x + e.nx * (T / 2 + 0.02);
    const z = p.z + e.nz * (T / 2 + 0.02);
    empty('PLACE_OBJ-089', x, 0, z, Math.atan2(e.nx, e.nz));
  }

  // ------------------------------------------------------------------ Licht
  const lampPos = [
    [-2.9, 1.7], [2.9, 1.7], [-2.9, -1.7], [2.9, -1.7],
    [0, 4.0], [0, -4.0],
  ];
  lampPos.forEach(([x, z], i) => {
    empty(`LAMP_${i + 1}`, x, H - 0.55, z, 0, { color: '#9fd8ff', intensity: 9, distance: 11 });
  });
  empty('LAMP_7', -2.0, H - 0.25, 1.6, 0, { color: '#a487ff', intensity: 6, distance: 8 });
  empty('LAMP_8', 2.0, H - 0.25, -1.6, 0, { color: '#a487ff', intensity: 6, distance: 8 });

  // ------------------------------------------------------------------ Animation
  let t = 0;
  let last = null;
  const animate = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    uvGlow.emissiveIntensity = 1.2 + Math.sin(t * 0.55) * 0.35;
    growGlow.emissiveIntensity = 1.3 + Math.sin(t * 0.7 + 1.1) * 0.22;
    lineGlow.emissiveIntensity = 1.65 + Math.sin(t * 0.8) * 0.12;
  };
  slotMesh.onBeforeRender = animate;
  mullionSlots.onBeforeRender = animate;

  root.userData.raum = { id: 'ATL-016', breite: 8.0, tiefe: 11.6, hoehe: H, grundriss: 'sechseck' };
  return root;
}

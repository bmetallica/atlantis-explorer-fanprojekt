// Raum ATL-047: Entsalzungstanks – South Pier, Etage 1, technischer Bereich.
// 1 Einheit = 1 m, +Y oben, Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Leere Hülle: nur Architektur (Boden, Wände, Decke, Paneele, fest verlegte Leitungen,
// Kassetten, Tragwerke). Die Antiken Entsalzungs-Filterzylinder werden später als
// fertige Objekte an PLACE_OBJ-041 / _2 / _3 eingesetzt.
import * as THREE from 'three';

const T = 0.3;          // Wanddicke
const H = 8.0;          // Deckenhöhe
const DW = 2.4;         // Durchgangsbreite
const DH = 3.0;         // Durchgangshöhe

// Achteckiger Grundriss mit 60°-Eckfasen (ca. 431 m² Grundfläche).
const POLY = [
  [-8.8, -10.5],
  [8.8, -10.5],
  [10.5, -8.556],
  [10.5, 8.556],
  [8.8, 10.5],
  [-8.8, 10.5],
  [-10.5, 8.556],
  [-10.5, -8.556],
];

// Türpositionen (Laufmeter entlang der jeweiligen Wandkante ab Kantenanfang).
const DOORS = {
  0: 8.8,     // Südwand (-Z): Haupteingang
  2: 8.556,   // Ostwand (+X): Technikzugang
};

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_desalination_tanks',
  art: 'Raum',
  masse: 'ca. 21,6 m × 21,6 m (431 m²) × 8,0 m Höhe',
  wohin: 'South Pier, untere Versorgungsebene, direkt neben dem Korridor ATL-049',
  benutzen: 'Wasseraufbereitung; drei antike Entsalzungs-Filterzylinder (OBJ-041) in festen Tragwerken',
  lichter: '6 LAMP_ (eisblau, indirekt) + Decken-Lichtbänder, Wandlichtschlitzte und warmes Notlicht',
  animation: 'Lichtbänder und Lichtschlitze pulsieren minimal',
  quelle: 'selbst gebaut nach Produktionsskizze „Lower Levels / Desalination“ (Mallozzi, Episoden 402/403) und Auftragsbeschreibung',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_desalination_tanks';

  // ---------------------------------------------------------------- Materialien
  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const hull = kit('hull');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.5 });
  const lineGlow = new THREE.MeshStandardMaterial({ name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.5 });
  const amberLine = new THREE.MeshStandardMaterial({ name: 'lichtleiste_bernstein', color: 0xffe4bc, emissive: 0xffb45a, emissiveIntensity: 1.1 });
  const steel = new THREE.MeshStandardMaterial({ name: 'technik_stahl', color: 0x8d9aa2, metalness: 0.72, roughness: 0.38 });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const edgeInfo = (i) => {
    const p1 = POLY[i];
    const p2 = POLY[(i + 1) % POLY.length];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const len = Math.hypot(dx, dz);
    const dir = [dx / len, dz / len];
    const n = [dz / len, -dx / len];       // Außennormale
    return { p1, p2, len, dir, n, angle: -Math.atan2(dz, dx) };
  };
  const pointAt = (info, s) => [info.p1[0] + info.dir[0] * s, info.p1[1] + info.dir[1] * s];

  const colBox = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
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

  const instanced = (geo, mat, items, name) => {
    if (!items.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, items.length);
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      o.scale.set(it.sx || 1, it.sy || 1, it.sz || 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.name = name;
    root.add(im);
    return im;
  };

  // ---------------------------------------------------------------- Boden (Polygon)
  const shape = new THREE.Shape();
  for (let i = POLY.length - 1; i >= 0; i--) shape.lineTo(POLY[i][0], -POLY[i][1]);
  shape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.name = 'boden';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;              // Oberkante exakt auf y = 0
  root.add(floor);

  // Bodenfugen (Raster 1,2 m)
  const seamsX = [], seamsZ = [];
  for (let v = -8.4; v <= 8.4 + 0.001; v += 1.2) {
    seamsX.push({ x: v, y: 0.006, z: 0 });
    seamsZ.push({ x: 0, y: 0.006, z: v });
  }
  instanced(new THREE.BoxGeometry(0.03, 0.012, 16.8), copper, seamsX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(16.8, 0.012, 0.03), copper, seamsZ, 'boden_fugen_z');

  // Umlaufende Patina-Kante entlang aller acht Wandkanten (innen liegend)
  for (let i = 0; i < POLY.length; i++) {
    const info = edgeInfo(i);
    const mid = pointAt(info, info.len / 2);
    const inward = [-info.n[0], -info.n[1]];
    const b = box(info.len - 0.24, 0.014, 0.22, patina,
      mid[0] + inward[0] * 0.12, 0.007, mid[1] + inward[1] * 0.12, 'boden_einfassung');
    b.rotation.y = info.angle;
  }
  // Kreisintarsie in der Mitte (Boden – Rundform zulässig)
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.05, 5.2, 64), copper);
  ring.name = 'boden_intarsie';
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.5, 48), patina);
  ring2.name = 'boden_intarsie_innen';
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.012;
  root.add(ring2);
  // Entwässerungsrinnen entlang der Ost- und Nordwand
  box(0.34, 0.016, 16.2, steel, 9.95, 0.008, 0, 'boden_rinne');
  box(15.0, 0.016, 0.34, steel, 1.2, 0.008, 9.95, 'boden_rinne');

  // ---------------------------------------------------------------- Wände
  const panelItems = [], frameItems = [], slotItems = [], slotBackItems = [];
  const indicatorItems = [];
  const lintelItems = [];
  let doorCounter = 0;

  for (let i = 0; i < POLY.length; i++) {
    const info = edgeInfo(i);
    const doorPos = DOORS[i];
    const pieces = [];
    let lintel = null;

    if (doorPos == null) {
      pieces.push({ s: 0, e: info.len, y0: 0, y1: H });
    } else {
      const ds = doorPos - DW / 2;
      const de = doorPos + DW / 2;
      if (ds > 0.01) pieces.push({ s: 0, e: ds, y0: 0, y1: H });
      if (info.len - de > 0.01) pieces.push({ s: de, e: info.len, y0: 0, y1: H });
      lintel = { s: ds, e: de };
    }

    // Wandkörper
    for (const p of pieces) {
      const sc = (p.s + p.e) / 2;
      const len = p.e - p.s;
      const pt = pointAt(info, sc);
      const w = new THREE.Mesh(new THREE.BoxGeometry(len + T, p.y1 - p.y0, T), wallMat);
      w.name = `wand_${i}_${Math.round(p.s * 10)}`;
      w.position.set(pt[0] + info.n[0] * T / 2, (p.y0 + p.y1) / 2, pt[1] + info.n[1] * T / 2);
      w.rotation.y = info.angle;
      root.add(w);

      colBox(`COL_wand_${i}_${Math.round(p.s * 10)}`, len + T, p.y1 - p.y0, T,
        pt[0] + info.n[0] * T / 2, (p.y0 + p.y1) / 2, pt[1] + info.n[1] * T / 2, info.angle);

      // Sockelleiste und Gesims an der Innenfläche
      const inward = [-info.n[0], -info.n[1]];
      const sk = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, 0.06), copper);
      sk.position.set(pt[0] + inward[0] * 0.03, 0.075, pt[1] + inward[1] * 0.03);
      sk.rotation.y = info.angle;
      sk.name = `sockelleiste_${i}`;
      root.add(sk);

      const co = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.08), copper);
      co.position.set(pt[0] + inward[0] * 0.04, H - 0.05, pt[1] + inward[1] * 0.04);
      co.rotation.y = info.angle;
      co.name = `gesims_${i}`;
      root.add(co);
    }

    // Sturz über der Türöffnung
    if (lintel) {
      const sc = (lintel.s + lintel.e) / 2;
      const len = lintel.e - lintel.s;
      const pt = pointAt(info, sc);
      const w = new THREE.Mesh(new THREE.BoxGeometry(len + T, H - DH, T), wallDark);
      w.name = `wand_sturz_${i}`;
      w.position.set(pt[0] + info.n[0] * T / 2, DH + (H - DH) / 2, pt[1] + info.n[1] * T / 2);
      w.rotation.y = info.angle;
      root.add(w);
      colBox(`COL_sturz_${i}`, len + T, H - DH, T,
        pt[0] + info.n[0] * T / 2, DH + (H - DH) / 2, pt[1] + info.n[1] * T / 2, info.angle);
      lintelItems.push({ i, info, lintel });
    }

    // Wandpaneele / Lichtschlitze im 1,2-m-Raster
    const fields = Math.max(2, Math.round(info.len / 1.2));
    const fw = info.len / fields;
    for (let f = 0; f < fields; f++) {
      const sc = (f + 0.5) * fw;
      if (doorPos != null && Math.abs(sc - doorPos) < DW / 2 + 0.55) continue;
      const pt = pointAt(info, sc);
      const inward = [-info.n[0], -info.n[1]];
      if (f % 2 === 0) {
        frameItems.push({ x: pt[0] + inward[0] * 0.03, y: 1.9, z: pt[1] + inward[1] * 0.03, ry: info.angle });
        panelItems.push({ x: pt[0] + inward[0] * 0.065, y: 1.9, z: pt[1] + inward[1] * 0.065, ry: info.angle });
        indicatorItems.push({ x: pt[0] + inward[0] * 0.09, y: 0.95, z: pt[1] + inward[1] * 0.09, ry: info.angle });
      } else {
        slotBackItems.push({ x: pt[0] + inward[0] * 0.02, y: 2.4, z: pt[1] + inward[1] * 0.02, ry: info.angle });
        slotItems.push({ x: pt[0] + inward[0] * 0.035, y: 2.4, z: pt[1] + inward[1] * 0.035, ry: info.angle });
      }
    }

    // Fest verlegte Wandleitungen: zwei waagerechte Rohre mit Flanschen
    const inward = [-info.n[0], -info.n[1]];
    const rohre = [
      { yy: 5.62, mat: hull, d: 0.22, off: 0.24 },
      { yy: 5.18, mat: copper, d: 0.16, off: 0.16 },
    ];
    for (const r of rohre) {
      const pp = new THREE.Mesh(new THREE.BoxGeometry(info.len, r.d, r.d), r.mat);
      const mid = pointAt(info, info.len / 2);
      pp.position.set(mid[0] + inward[0] * r.off, r.yy, mid[1] + inward[1] * r.off);
      pp.rotation.y = info.angle;
      pp.name = `rohr_wand_${i}_${r.yy.toFixed(2)}`;
      root.add(pp);
    }
    // Flanschringe an den Rohren
    for (let s = 1.2; s < info.len - 0.4; s += 2.4) {
      const pp = pointAt(info, s);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.42), steel);
      fl.position.set(pp[0] + inward[0] * 0.24, 5.4, pp[1] + inward[1] * 0.24);
      fl.rotation.y = info.angle;
      fl.name = `rohr_flansch_${i}`;
      root.add(fl);
    }
  }

  instanced(new THREE.BoxGeometry(1.02, 3.6, 0.06), copper, frameItems, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(0.8, 3.2, 0.04), wallDark, panelItems, 'paneele');
  instanced(new THREE.BoxGeometry(0.18, 0.1, 0.05), amberLine, indicatorItems, 'paneel_anzeige');
  instanced(new THREE.BoxGeometry(0.15, 3.8, 0.04), wallDark, slotBackItems, 'lichtschlitz_sockel');
  const slotMesh = instanced(new THREE.BoxGeometry(0.08, 3.6, 0.05), lineGlow, slotItems, 'lichtschlitze');

  // ---------------------------------------------------------------- Türen / Anschlüsse
  const doorNames = ['DOOR_sued', 'DOOR_ost'];
  let di = 0;
  for (const li of lintelItems) {
    const { info, lintel } = li;
    const sc = (lintel.s + lintel.e) / 2;
    const pt = pointAt(info, sc);
    const inward = [-info.n[0], -info.n[1]];
    const wallMid = [pt[0] + info.n[0] * T / 2, pt[1] + info.n[1] * T / 2];
    const outwardRot = Math.atan2(info.n[0], info.n[1]);

    // Bronzefassung der Öffnung
    for (const s of [lintel.s, lintel.e]) {
      const p = pointAt(info, s);
      const j = new THREE.Mesh(new THREE.BoxGeometry(0.14, DH + 0.12, T + 0.08), copper);
      j.position.set(p[0] + inward[0] * 0.04, (DH + 0.12) / 2, p[1] + inward[1] * 0.04);
      j.rotation.y = info.angle;
      j.name = `tuerfassung_${di}`;
      root.add(j);
    }
    const lf = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.28, 0.14, T + 0.08), copper);
    lf.position.set(pt[0] + inward[0] * 0.04, DH + 0.07, pt[1] + inward[1] * 0.04);
    lf.rotation.y = info.angle;
    lf.name = `tuerfassung_${di}_oben`;
    root.add(lf);
    // Türsturz als eckiger Zierkeil (keine Rundbögen)
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(DW - 0.3, 0.16, 0.1), wallDark);
    wedge.position.set(pt[0] + inward[0] * 0.05, DH + 0.18, pt[1] + inward[1] * 0.05);
    wedge.rotation.y = info.angle;
    wedge.name = `tuer_keil_${di}`;
    root.add(wedge);

    // Schiebetür (fertiges Objekt) – Vorderseite (+Z) zeigt in den Raum
    doorCounter++;
    empty(doorCounter === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorCounter}`,
      wallMid[0], 0, wallMid[1], outwardRot + Math.PI);

    // Anschlusspunkt – +Z zeigt nach außen
    empty(doorNames[di] || `DOOR_${di}`, wallMid[0], 0, wallMid[1], outwardRot, {
      breite: DW,
      hoehe: DH,
      ziel: di === 0 ? 'ATL-049 – Korridor South Pier (Haupteingang)' : 'ATL-049 – Technikgang (Servicezugang)',
      raum: 'ATL-049',
    });
    di++;
  }

  // ---------------------------------------------------------------- Feste Tragwerke für die Filterzylinder
  const bays = [
    { x: -5.0, z: -4.2, ry: Math.PI },
    { x: 5.0, z: -4.2, ry: Math.PI },
    { x: 0.0, z: 4.2, ry: Math.PI },
  ];
  const BW = 7.58, BH = 7.43, BD = 5.95;
  const framePosts = [], beamX = [], beamZ = [], frameBraces = [];
  bays.forEach((b, bi) => {
    const hw = BW / 2 + 0.22, hd = BD / 2 + 0.22;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        framePosts.push({ x: b.x + sx * hw, y: 3.9, z: b.z + sz * hd });
        colBox(`COL_tragwerk_${bi + 1}_${sx < 0 ? 'w' : 'o'}${sz < 0 ? 's' : 'n'}`, 0.3, 7.8, 0.3,
          b.x + sx * hw, 3.9, b.z + sz * hd);
      }
      // Diagonale Verbände in der Seitenebene (Neigung um die X-Achse)
      frameBraces.push({ x: b.x + sx * hw, y: 5.7, z: b.z, rx: sx * 0.3 });
    }
    // Oberer Umlauf (Traeger entlang X bzw. Z)
    for (const sz of [-1, 1]) beamX.push({ x: b.x, y: 7.72, z: b.z + sz * hd });
    for (const sx of [-1, 1]) beamZ.push({ x: b.x + sx * hw, y: 7.72, z: b.z });
    // Mittlere Riegel
    for (const sz of [-1, 1]) beamX.push({ x: b.x, y: 3.95, z: b.z + sz * hd });
    for (const sx of [-1, 1]) beamZ.push({ x: b.x + sx * hw, y: 3.95, z: b.z });

    // Bodenmarkierung des Aufstellplatzes
    const ow = BW / 2 + 0.1, od = BD / 2 + 0.1;
    box(BW + 0.2, 0.014, 0.08, copper, b.x, 0.007, b.z - od, `boden_rahmen_${bi + 1}`);
    box(BW + 0.2, 0.014, 0.08, copper, b.x, 0.007, b.z + od, `boden_rahmen_${bi + 1}`);
    box(0.08, 0.014, BD + 0.2, copper, b.x - ow, 0.007, b.z, `boden_rahmen_${bi + 1}`);
    box(0.08, 0.014, BD + 0.2, copper, b.x + ow, 0.007, b.z, `boden_rahmen_${bi + 1}`);
    // Warnmarkierung an den Ecken der Aufstellplätze (flach, bodenbündig)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(0.7, 0.016, 0.14, amberLine, b.x + sx * (ow - 0.4), 0.008, b.z + sz * od, `boden_warnfeld_${bi + 1}`);
    }
  });
  instanced(new THREE.BoxGeometry(0.22, 7.8, 0.22), pillarMat, framePosts, 'tragwerk_pfosten');
  instanced(new THREE.BoxGeometry(BW + 0.66, 0.22, 0.22), copper, beamX, 'tragwerk_traeger_x');
  instanced(new THREE.BoxGeometry(0.22, 0.22, BD + 0.66), copper, beamZ, 'tragwerk_traeger_z');
  instanced(new THREE.BoxGeometry(0.1, 3.4, 0.12), steel, frameBraces, 'tragwerk_strebe');

  // ---------------------------------------------------------------- Massive Leitungen / Aufbereitungskanäle
  const ductNorth = box(17.2, 0.8, 0.8, hull, 0, 6.75, 9.85, 'leitung_nord');
  const ductWest = box(0.8, 0.8, 17.2, hull, -9.85, 6.75, 0, 'leitung_west');
  root.add(ductNorth, ductWest);
  colBox('COL_leitung_nord', 17.2, 0.8, 0.8, 0, 6.75, 9.85);
  colBox('COL_leitung_west', 0.8, 0.8, 17.2, -9.85, 6.75, 0);
  for (let x = -7.2; x <= 7.2 + 0.01; x += 2.4) box(0.12, 0.96, 0.96, copper, x, 6.75, 9.85, 'leitung_flansch');
  for (let z = -7.2; z <= 7.2 + 0.01; z += 2.4) box(0.96, 0.96, 0.12, copper, -9.85, 6.75, z, 'leitung_flansch');
  // Vertikale Steigleitungen an den Ecken
  for (const [x, z] of [[-9.6, 9.6], [9.6, 9.6], [-9.6, -9.6], [9.6, -9.6]]) {
    box(0.62, 6.4, 0.62, hull, x, 3.2, z, 'leitung_steig');
    box(0.78, 0.14, 0.78, copper, x, 5.4, z, 'leitung_flansch');
    colBox(`COL_leitung_steig_${x.toFixed(0)}_${z.toFixed(0)}`, 0.72, 6.4, 0.72, x, 3.2, z);
  }
  // Querleitungen zwischen den Filterrahmen (hoch geführt, begehbar darunter)
  box(10.0, 0.42, 0.42, hull, 0, 7.25, -4.2, 'leitung_quer');
  box(0.42, 0.42, 8.4, hull, 0, 7.25, 0.0, 'leitung_quer_mitte');

  // Meerwasseransaugung: eckiges Gitter an der Ostwand
  const gx = 10.42, gz = 4.6;
  box(0.16, 4.2, 0.16, copper, gx, 3.5, gz - 2.4, 'ansaugung_rahmen');
  box(0.16, 4.2, 0.16, copper, gx, 3.5, gz + 2.4, 'ansaugung_rahmen');
  box(0.16, 0.16, 4.96, copper, gx, 5.5, gz, 'ansaugung_rahmen');
  box(0.16, 0.16, 4.96, copper, gx, 1.5, gz, 'ansaugung_rahmen');
  const slats = [];
  for (let k = 0; k < 10; k++) slats.push({ x: gx - 0.05, y: 3.5, z: gz - 2.16 + k * 0.48 });
  instanced(new THREE.BoxGeometry(0.12, 3.8, 0.12), wallDark, slats, 'ansaugung_sprossen');
  box(1.0, 1.6, 4.0, hull, 9.9, 6.6, gz, 'leitung_ansaugung');
  colBox('COL_leitung_ansaugung', 1.0, 1.6, 4.0, 9.9, 6.6, gz);

  // ---------------------------------------------------------------- Säulen
  const pillarPositions = [[-9.9, -7.0], [9.9, -7.0], [-9.9, 7.0], [9.9, 7.0]];
  pillarPositions.forEach(([x, z], i) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.52, 7.6, 0.52), pillarMat);
    p.name = `saeule_${i + 1}`;
    p.position.set(x, 3.8, z);
    p.rotation.z = (x > 0 ? -1 : 1) * 0.045;
    root.add(p);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.3, 0.78), copper);
    base.name = `saeule_sockel_${i + 1}`;
    base.position.set(x, 0.15, z);
    root.add(base);
    colBox(`COL_saeule_${i + 1}`, 0.7, 7.6, 0.7, x, 3.8, z);
  });

  // ---------------------------------------------------------------- Decke
  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.name = 'decke_hauptebene';
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = H;
  root.add(ceiling);

  // Abgehängte Kassettenfelder
  const coffers = [];
  for (let x = -7.2; x <= 7.2 + 0.01; x += 3.6) {
    for (let z = -7.2; z <= 7.2 + 0.01; z += 3.6) coffers.push({ x, y: H - 0.12, z });
  }
  instanced(new THREE.BoxGeometry(3.2, 0.16, 3.2), wallDark, coffers, 'decke_kassetten');

  // Deckenträger (Längs- und Querträger) mit Knotenblechen
  for (const z of [-6.6, 0, 6.6]) {
    box(20.4, 0.34, 0.44, copper, 0, H - 0.42, z, 'decke_traeger');
    for (const x of [-7.2, 0, 7.2]) box(0.6, 0.46, 0.56, steel, x, H - 0.46, z, 'decke_knotenblech');
  }
  box(0.38, 0.3, 19.6, copper, 0, H - 0.62, 0, 'decke_traeger_quer');
  // Kabelpritsche
  box(18.4, 0.1, 0.5, steel, 0, 6.62, -8.2, 'decke_kabelpritsche');
  box(0.5, 0.1, 16.4, steel, -8.4, 6.62, 0, 'decke_kabelpritsche');

  // Decken-Lichtbänder
  const bandItems = [];
  for (const x of [-4.8, 0, 4.8]) bandItems.push({ x, y: H - 0.62, z: 0 });
  instanced(new THREE.BoxGeometry(0.3, 0.07, 15.0), glow, bandItems, 'decke_lichtband');
  const warmBands = [];
  for (const z of [-8.2, 8.2]) warmBands.push({ x: 0, y: H - 0.72, z });
  instanced(new THREE.BoxGeometry(14.0, 0.06, 0.22), amberLine, warmBands, 'decke_lichtband_bernstein');

  // Wandlichtbänder an den Türfassungen
  const jambGlow = [];
  for (const li of lintelItems) {
    const { info, lintel } = li;
    for (const s of [lintel.s - 0.5, lintel.e + 0.5]) {
      const p = pointAt(info, s);
      const inward = [-info.n[0], -info.n[1]];
      jambGlow.push({ x: p[0] + inward[0] * 0.05, y: 1.5, z: p[1] + inward[1] * 0.05, ry: info.angle });
    }
  }
  instanced(new THREE.BoxGeometry(0.07, 2.6, 0.05), lineGlow, jambGlow, 'lichtschlitze_tuer');

  // ---------------------------------------------------------------- Objektplätze
  bays.forEach((b, i) => {
    empty(i === 0 ? 'PLACE_OBJ-041' : `PLACE_OBJ-041_${i + 1}`, b.x, 0, b.z, b.ry);
  });

  // ---------------------------------------------------------------- Lichter
  const lampPos = [
    [-6.2, 6.6, -6.2], [6.2, 6.6, -6.2],
    [-6.2, 6.6, 6.2], [6.2, 6.6, 6.2],
    [0, 6.9, -8.6], [0, 6.9, 8.6],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#9fd8ff', intensity: 9, distance: 18 });
    const pl = new THREE.PointLight(0x9fd8ff, 90, 20, 1.7);
    pl.name = `lichtpunkt_${i + 1}`;
    pl.position.set(p[0], p[1], p[2]);
    root.add(pl);
  });
  // schwaches warmes Notlicht an der Ansaugung
  const pl2 = new THREE.PointLight(0xffb45a, 22, 9, 1.8);
  pl2.name = 'lichtpunkt_ansaugung';
  pl2.position.set(8.8, 3.0, 4.6);
  root.add(pl2);
  const hemi = new THREE.HemisphereLight(0x8fb8d8, 0x1d2a30, 0.55);
  hemi.name = 'licht_grundhelligkeit';
  root.add(hemi);

  // ---------------------------------------------------------------- Kollision
  colBox('COL_boden', 21, 0.2, 21, 0, -0.1, 0);
  // Eckabschnitte der Bodenfläche (60°-Fasen) blockieren
  [1, 3, 5, 7].forEach((i) => {
    const info = edgeInfo(i);
    const pt = pointAt(info, info.len / 2);
    colBox(`COL_boden_fase_${i}`, info.len + 0.4, 0.2, 0.7,
      pt[0] - info.n[0] * 0.05, -0.1, pt[1] - info.n[1] * 0.05, info.angle);
  });
  colBox('COL_decke', 21, 0.3, 21, 0, H + 0.15, 0);
  [1, 3, 5, 7].forEach((i) => {
    const info = edgeInfo(i);
    const pt = pointAt(info, info.len / 2);
    colBox(`COL_decke_fase_${i}`, info.len + 0.4, 0.3, 0.7,
      pt[0] - info.n[0] * 0.05, H + 0.15, pt[1] - info.n[1] * 0.05, info.angle);
  });

  // ---------------------------------------------------------------- Animation / API
  let t = 0;
  let last = null;
  const pulsieren = (dt) => {
    t += dt;
    lineGlow.emissiveIntensity = 1.45 + Math.sin(t * 0.8) * 0.14;
    amberLine.emissiveIntensity = 1.05 + Math.sin(t * 0.6 + 1.2) * 0.1;
  };
  if (slotMesh) {
    slotMesh.onBeforeRender = () => {
      const now = performance.now() / 1000;
      if (last !== null) pulsieren(Math.min(now - last, 0.1));
      last = now;
    };
  }

  root.userData.raum = {
    id: 'ATL-047',
    name: 'raum_desalination_tanks',
    flaeche: 431,
    hoehe: H,
    etage: 1,
    bereich: 'South Pier',
    kategorie: 'technical',
  };
  root.userData.api = {
    anzahlFilter: bays.length,
    pulsieren,
    getPositionen: () => bays.map((b) => [b.x, b.z]),
    setBereit: (v) => { root.userData.raum.bereit = !!v; return root.userData.raum.bereit; },
  };

  return root;
}

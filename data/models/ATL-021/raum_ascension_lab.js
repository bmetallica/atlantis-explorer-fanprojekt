// Raum ATL-021: Aufstiegs-Labor (Ascension Lab) – East Pier, Etage 3.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite −Z. Leere Hülle: nur Architektur, zentrale Aufstiegsplattform,
// facettiertes Gewölbe mit antiken Glyphenringen sowie Platzhalter für OBJ-026 und OBJ-071.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_ascension_lab',
  art: 'Raum',
  masse: '8,4 m × 9,6 m lichte Fläche (≈ 80,6 m²), Wandhöhe 3,0 m, Gewölbescheitel 4,0 m',
  wohin: 'East Pier, Etage 3 – Wissenschaftsbereich für Aufstiegs- und Reinkarnationsforschung',
  benutzen: 'Antike Aufstiegsmaschine (OBJ-026) auf der zentralen Plattform; Subraum-Partikeldetektor (OBJ-071) an der linken Wand',
  lichter: '5 LAMP-Punkte (eisblau #9fd8ff), zusätzlich leuchtende Deckenringe, Wandlichtschlitze und Bernsteinakzente an der Plattform',
  animation: 'Glyphen der Deckenringe pulsieren langsam; per userData.actions / userData.api umschaltbar',
  quelle: 'selbst gebaut nach Raumauftrag ATL-021, Referenzbild ref1.jpg und Atlantis-Setplänen „Halls & Corridors“',
};

// Grundriss und Maße
const W = 8.4;          // lichte Breite  (X)
const D = 9.6;          // lichte Tiefe   (Z)
const H = 3.0;          // Wandhöhe bis zum Gewölbeanfang
const T = 0.3;          // Wanddicke
const APEX = 4.0;       // Gewölbescheitel
const PLAT_H = 0.10;    // Höhe der Aufstiegsplattform
const PLAT_HALF = 2.6;  // halbe Kantenlänge der Plattform (Umgang ≥ 1,6 m)

// Gewölbequerschnitt (x, y) – facettierte 30°-Architektur, kein Bogen
const XS = [-4.2, -3.15, -2.1, -1.05, 0, 1.05, 2.1, 3.15, 4.2];
const YS = [3.0, 3.45, 3.78, 3.95, 4.0, 3.95, 3.78, 3.45, 3.0];

// Oktogonale Plattform (Kantenlänge 1,6 m / 2,6 m)
const PLAT_PTS = [
  [-1.6, -2.6], [1.6, -2.6], [2.6, -1.6], [2.6, 1.6],
  [1.6, 2.6], [-1.6, 2.6], [-2.6, 1.6], [-2.6, -1.6],
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_ascension_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glow = kit('glow');
  const amber = kit('amberGlow');
  const stairMat = kit('stair');
  const glassMat = kit('glass');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.45,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.5, roughness: 0.4,
  });
  const glyphMat = new THREE.MeshStandardMaterial({
    name: 'glyphen_glow', color: 0x0d2a33, emissive: 0x7fe6ff, emissiveIntensity: 1.8, roughness: 0.4,
  });
  const amberLine = new THREE.MeshStandardMaterial({
    name: 'bernstein_linie', color: 0xffb45c, emissive: 0xffa33c, emissiveIntensity: 1.4, roughness: 0.45,
  });

  const dummy = new THREE.Object3D();

  const addMesh = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const addBox = (w, h, d, mat, x, y, z, name, rz = 0) => {
    const m = addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
    m.rotation.z = rz;
    return m;
  };

  // Instanzen: Listeneinträge [x, y, z, rotY, rotZ]
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z, ry = 0, rz = 0], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry, rz);
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
  const col = (name, w, h, d, x, y, z, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.z = rz;
    m.visible = false;
    root.add(m);
    return m;
  };

  // ---------------------------------------------------------------- Boden (Oberkante exakt y = 0)
  addBox(W, 0.18, D, floorMat, 0, -0.10, 0, 'boden');
  const tiles = [];
  for (let ix = 0; ix < 7; ix++) {
    for (let iz = 0; iz < 8; iz++) {
      tiles.push([-3.6 + ix * 1.2, -0.01, -4.2 + iz * 1.2, 0, 0]);
    }
  }
  inst(new THREE.BoxGeometry(1.16, 0.02, 1.16), floorMat, tiles, 'bodenplatten');

  // grün-kupferner Rand
  for (const s of [-1, 1]) {
    addBox(0.18, 0.016, D - 0.36, patina, s * (W / 2 - 0.09), 0.006, 0, 'boden_rand_seitlich');
    addBox(W - 0.36, 0.016, 0.18, patina, 0, 0.006, s * (D / 2 - 0.09), 'boden_rand_frontal');
  }

  // zentrale Bodenintarsie: achteckiger Schneeflocken-Ring + Speichen (rein dekorativ)
  const ringR = 2.05;
  const midR = ringR * Math.cos(Math.PI / 8);
  const segLen = 2 * ringR * Math.sin(Math.PI / 8) - 0.06;
  const inlay = [];
  for (let i = 0; i < 8; i++) {
    const am = (i + 0.5) * (Math.PI / 4);
    const t = am + Math.PI / 2;               // Tangentenrichtung
    inlay.push([Math.cos(am) * midR, 0.007, Math.sin(am) * midR, -t, 0]);
  }
  inst(new THREE.BoxGeometry(segLen, 0.014, 0.07), copper, inlay, 'boden_intarsie_ring');
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const a = i * (Math.PI / 4) + Math.PI / 8;
    spokes.push([Math.cos(a) * 1.15, 0.007, Math.sin(a) * 1.15, -a, 0]);
  }
  inst(new THREE.BoxGeometry(0.95, 0.014, 0.055), copper, spokes, 'boden_intarsie_speichen');
  addBox(0.05, 0.012, D - 0.5, copper, 0, 0.006, 0, 'boden_mittellinie');

  // ---------------------------------------------------------------- Wände
  addBox(T, H, D + 2 * T, wall, -(W / 2 + T / 2), H / 2, 0, 'wand_links');
  addBox(T, H, D + 2 * T, wall, (W / 2 + T / 2), H / 2, 0, 'wand_rechts');
  addBox(W, H, T, wall, 0, H / 2, (D / 2 + T / 2), 'wand_hinten');

  const frontZ = -(D / 2 + T / 2);
  addBox(3.0, H, T, wall, -2.7, H / 2, frontZ, 'wand_vorne_links');
  addBox(3.0, H, T, wall, 2.7, H / 2, frontZ, 'wand_vorne_rechts');

  // Giebelbänder über dem Gewölbeanfang (eckig, facettiert)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(XS[0], YS[0]);
  for (let i = 1; i < XS.length; i++) gableShape.lineTo(XS[i], YS[i]);
  gableShape.lineTo(XS[XS.length - 1], H);
  gableShape.lineTo(XS[0], H);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: T, bevelEnabled: false });
  addMesh(gableGeo, wall, 0, 0, -(D / 2 + T), 'wand_giebel_vorne');
  addMesh(gableGeo.clone(), wall, 0, 0, D / 2, 'wand_giebel_hinten');

  // ---------------------------------------------------------------- Gewölbe (Decke)
  // Facetten liegen AUSSEN der Lichtraumkante – die Sichtfläche ist exakt die Gewölbekurve.
  const facets = [];
  for (let i = 0; i < XS.length - 1; i++) {
    const x0 = XS[i], x1 = XS[i + 1], y0 = YS[i], y1 = YS[i + 1];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    const nx = -Math.sin(a), ny = Math.cos(a);   // Außennormale
    facets.push({ x0, y0, x1, y1, len, a, nx, ny });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const p = addBox(len, T, D, ceilMat, cx + nx * (T / 2), cy + ny * (T / 2), 0, `decke_facet_${i}`, a);
    p.name = `decke_facet_${i}`;
  }

  // Decken-Lichtbänder entlang der unteren Kante
  for (const s of [-1, 1]) {
    const f = facets[s < 0 ? 0 : facets.length - 2];
    const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
    addBox(f.len * 0.92, 0.05, D - 0.4, glow, cx - f.nx * 0.04, cy - f.ny * 0.04, 0, 'decke_lichtband');
  }

  // ---------------------------------------------------------------- Deckenringe mit antiken Glyphen
  const ringZ = [-2.4, 0, 2.4];
  const glyphs = [];
  for (const rz of ringZ) {
    for (const f of facets) {
      const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
      // Bronzeringband knapp unter der Decke
      addBox(f.len * 0.99, 0.09, 0.34, copper, cx - f.nx * 0.045, cy - f.ny * 0.045, rz, 'decke_glyphenring', f.a);
      // kantige Glyphen auf dem Ring
      for (const t of [0.26, 0.74]) {
        const px = f.x0 + (f.x1 - f.x0) * t;
        const py = f.y0 + (f.y1 - f.y0) * t;
        glyphs.push([px - f.nx * 0.10, py - f.ny * 0.10, rz, 0, f.a]);
      }
    }
  }
  const glyphMesh = inst(new THREE.BoxGeometry(0.17, 0.035, 0.20), glyphMat, glyphs, 'glyphen_deckenringe');

  // ---------------------------------------------------------------- Wandpaneele, Lichtschlitze, Sockel/Gesims
  const panelData = [], frameData = [], slotData = [];
  for (const s of [-1, 1]) {
    const xIn = s * (W / 2);
    for (let i = 0; i < 8; i++) {
      const zc = -4.2 + i * 1.2;
      if (i % 2 === 0) {
        panelData.push([xIn - s * 0.018, 1.5, zc, 0, 0]);
        frameData.push([xIn - s * 0.026, 1.5, zc, 0, 0]);
      } else {
        for (let k = 0; k < 4; k++) slotData.push([xIn - s * 0.032, 0.95 + k * 0.45, zc, 0, 0]);
      }
    }
    addBox(0.05, 0.15, D, copper, xIn - s * 0.025, 0.075, 0, 'sockelleiste_seitlich');
    addBox(0.07, 0.1, D, copper, xIn - s * 0.035, H - 0.05, 0, 'gesims_seitlich');
  }
  for (let i = 0; i < 7; i++) {
    const xc = -3.6 + i * 1.2;
    if (i % 2 === 0) {
      panelData.push([xc, 1.5, D / 2 - 0.018, 0, 0]);
      frameData.push([xc, 1.5, D / 2 - 0.026, 0, 0]);
    } else {
      for (let k = 0; k < 4; k++) slotData.push([xc, 0.95 + k * 0.45, D / 2 - 0.032, 0, 0]);
    }
  }
  addBox(W, 0.15, 0.05, copper, 0, 0.075, D / 2 - 0.025, 'sockelleiste_hinten');
  addBox(W, 0.1, 0.07, copper, 0, H - 0.05, D / 2 - 0.035, 'gesims_hinten');

  for (let i = 0; i < 7; i++) {
    const xc = -3.6 + i * 1.2;
    if (Math.abs(xc) <= 1.2) continue;
    if (i % 2 === 0) {
      panelData.push([xc, 1.5, -D / 2 + 0.018, 0, 0]);
      frameData.push([xc, 1.5, -D / 2 + 0.026, 0, 0]);
    } else {
      for (let k = 0; k < 4; k++) slotData.push([xc, 0.95 + k * 0.45, -D / 2 + 0.032, 0, 0]);
    }
  }
  addBox(3.0, 0.15, 0.05, copper, -2.7, 0.075, -D / 2 + 0.025, 'sockelleiste_vorne_links');
  addBox(3.0, 0.15, 0.05, copper, 2.7, 0.075, -D / 2 + 0.025, 'sockelleiste_vorne_rechts');
  addBox(3.0, 0.1, 0.07, copper, -2.7, H - 0.05, -D / 2 + 0.035, 'gesims_vorne_links');
  addBox(3.0, 0.1, 0.07, copper, 2.7, H - 0.05, -D / 2 + 0.035, 'gesims_vorne_rechts');

  inst(new THREE.BoxGeometry(1.0, 2.4, 0.035), wallDark, panelData, 'wandpaneele');
  inst(new THREE.BoxGeometry(1.12, 2.62, 0.05), copper, frameData, 'wandpaneel_rahmen');
  inst(new THREE.BoxGeometry(0.06, 0.3, 0.08), lineGlow, slotData, 'wand_lichtschlitze');

  // ---------------------------------------------------------------- Schräge Eckpfeiler + Wandpfeiler
  const pilasters = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * 4.02, z = sz * 4.62;
      addBox(0.26, H, 0.26, pillarMat, x, H / 2, z, `saeule_${sx < 0 ? 'l' : 'r'}${sz < 0 ? 'v' : 'h'}`, sx * 0.07);
      col(`COL_saeule_${sx < 0 ? 'l' : 'r'}${sz < 0 ? 'v' : 'h'}`, 0.3, H, 0.3, x, H / 2, z);
    }
    // schlanke, leicht geneigte Wandpfeiler
    for (const pz of [-2.4, 0.6]) {
      const x = sx * 4.05, z = pz;
      addBox(0.22, H - 0.1, 0.28, pillarMat, x, (H - 0.1) / 2, z, `wandpfeiler_${sx < 0 ? 'l' : 'r'}_${pz}`, sx * 0.06);
      col(`COL_wandpfeiler_${sx < 0 ? 'l' : 'r'}_${pz}`, 0.26, H, 0.32, x, (H - 0.1) / 2, z);
      pilasters.push([x, 1.9, z]);
    }
  }

  // ---------------------------------------------------------------- Zentrale Aufstiegsplattform (Architektur)
  const platShape = new THREE.Shape();
  platShape.moveTo(PLAT_PTS[0][0], PLAT_PTS[0][1]);
  for (let i = 1; i < PLAT_PTS.length; i++) platShape.lineTo(PLAT_PTS[i][0], PLAT_PTS[i][1]);
  platShape.closePath();
  const platGeo = new THREE.ExtrudeGeometry(platShape, { depth: PLAT_H, bevelEnabled: false });
  const plat = addMesh(platGeo, stairMat, 0, 0, 0, 'plattform_aufstieg');
  plat.rotation.x = -Math.PI / 2;
  plat.name = 'plattform_aufstieg';

  // Kupfer-/Patina-Rahmen der Plattform
  const borderShape = new THREE.Shape();
  borderShape.moveTo(PLAT_PTS[0][0], PLAT_PTS[0][1]);
  for (let i = 1; i < PLAT_PTS.length; i++) borderShape.lineTo(PLAT_PTS[i][0], PLAT_PTS[i][1]);
  borderShape.closePath();
  const hole = new THREE.Path();
  const inner = PLAT_PTS.map(([x, y]) => [x * 0.94, y * 0.94]);
  hole.moveTo(inner[0][0], inner[0][1]);
  for (let i = 1; i < inner.length; i++) hole.lineTo(inner[i][0], inner[i][1]);
  hole.closePath();
  borderShape.holes.push(hole);
  const borderGeo = new THREE.ExtrudeGeometry(borderShape, { depth: 0.02, bevelEnabled: false });
  const border = addMesh(borderGeo, copper, 0, PLAT_H, 0, 'plattform_rahmen');
  border.rotation.x = -Math.PI / 2;
  border.name = 'plattform_rahmen';

  // Leuchtfelder und Bernsteinakzente im Plattformbereich
  const plSlots = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    plSlots.push([Math.cos(a) * 2.38, PLAT_H + 0.012, Math.sin(a) * 2.38, -a, 0]);
  }
  inst(new THREE.BoxGeometry(0.52, 0.02, 0.07), glow, plSlots, 'plattform_leuchtfelder');
  const plAmber = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    plAmber.push([Math.cos(a) * 2.48, PLAT_H + 0.016, Math.sin(a) * 2.48, -a, 0]);
  }
  inst(new THREE.BoxGeometry(0.30, 0.016, 0.05), amberLine, plAmber, 'plattform_bernsteinakzente');

  // ---------------------------------------------------------------- Türöffnung / Anschlüsse
  for (const s of [-1, 1]) addBox(0.12, 3.0, 0.36, copper, s * 1.26, 1.5, frontZ, 'tuerfassung_seitlich');
  addBox(2.64, 0.12, 0.36, copper, 0, 3.0, frontZ, 'tuerfassung_sturz');
  // Bronzeschwelle auf Bodenhöhe
  addBox(2.64, 0.02, 0.36, copper, 0, 0.01, frontZ + 0.02, 'tuerfassung_schwelle');

  empty('DOOR_eingang', 0, 0, frontZ, Math.PI, {
    breite: 2.4, hoehe: 3.0, ziel: 'East Pier – Aufstiegs-Labor (Haupteingang)',
  });
  // Antiker Schiebetür: Ursprung in Wandmitte, Vorderseite (+Z) zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, frontZ, 0);

  // ---------------------------------------------------------------- Objektplätze aus der Objektliste
  // Antike Aufstiegsmaschine (4,78 × 3,37 × 4,78 m) auf der Plattform, Front zum Eingang (−Z)
  empty('PLACE_OBJ-026', 0, PLAT_H, 0, Math.PI);
  // Subraum-Partikeldetektor (0,19 × 0,34 × 0,11 m) an der linken Wand, Front (+X) in den Raum
  empty('PLACE_OBJ-071', -(W / 2) + 0.06, 0, 2.60, Math.PI / 2);

  // ---------------------------------------------------------------- Licht
  const lampPos = [
    [0, 3.45, -3.0], [0, 3.45, 0], [0, 3.45, 3.0],
    [-2.3, 2.55, -3.9], [2.3, 2.55, 3.9],
  ];
  lampPos.forEach(([x, y, z], i) => {
    empty(`LAMP_${i + 1}`, x, y, z, 0, { color: '#9fd8ff', intensity: 8, distance: 10 });
    const pl = new THREE.PointLight(0x9fd8ff, 9, 10, 2);
    pl.position.set(x, y - 0.06, z);
    pl.name = `LICHT_ceiling_${i + 1}`;
    pl.userData = { color: '#9fd8ff', intensity: 9, distance: 10 };
    root.add(pl);
  });
  // warme Bernstein-Akzentbeleuchtung über der Plattform
  const warm = new THREE.PointLight(0xffb45c, 5, 7, 2);
  warm.position.set(0, 2.6, 0);
  warm.name = 'LICHT_plattform_bernstein';
  warm.userData = { color: '#ffd8a0', intensity: 5, distance: 7 };
  root.add(warm);

  // ---------------------------------------------------------------- Kollision
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_wand_links', T, H, D + 2 * T, -(W / 2 + T / 2), H / 2, 0);
  col('COL_wand_rechts', T, H, D + 2 * T, (W / 2 + T / 2), H / 2, 0);
  col('COL_wand_hinten', W, H, T, 0, H / 2, (D / 2 + T / 2));
  col('COL_wand_vorne_links', 3.0, H, T, -2.7, H / 2, frontZ);
  col('COL_wand_vorne_rechts', 3.0, H, T, 2.7, H / 2, frontZ);
  col('COL_giebel_vorne', W + 2 * T, 1.0, T, 0, 3.5, -(D / 2 + T / 2));
  col('COL_giebel_hinten', W + 2 * T, 1.0, T, 0, 3.5, (D / 2 + T / 2));
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, APEX + 0.15, 0);
  col('COL_plattform', PLAT_HALF * 2, PLAT_H, PLAT_HALF * 2, 0, PLAT_H / 2, 0);

  // ---------------------------------------------------------------- Glyphen-Animation & API
  let glyphActive = true;
  let t = 0, last = null;
  glyphMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    const target = glyphActive ? 1.8 + Math.sin(t * 0.7) * 0.35 : 0.25;
    glyphMat.emissiveIntensity += (target - glyphMat.emissiveIntensity) * 0.15;
  };

  root.userData.api = {
    setGlyphenAktiv(an) { glyphActive = !!an; },
    glyphenAktiv() { return glyphActive; },
    getAufstiegsplattform() {
      return {
        position: [0, PLAT_H, 0],
        groesse: [PLAT_HALF * 2, PLAT_H, PLAT_HALF * 2],
        maschine: 'PLACE_OBJ-026',
      };
    },
    getRaummasse() { return { breite: W, tiefe: D, hoehe: APEX, flaeche: +(W * D).toFixed(2) }; },
  };
  root.userData.actions = [
    {
      id: 'ATL-021_glyphen',
      label: 'Glyphen der Deckenringe',
      run() {
        glyphActive = !glyphActive;
        return { menu: { title: 'Aufstiegs-Labor', options: [{ id: 'ATL-021_glyphen', label: glyphActive ? 'Glyphen aktiv' : 'Glyphen gedimmt' }] } };
      },
    },
  ];
  root.userData.raum = {
    id: 'ATL-021',
    name: 'Aufstiegs-Labor',
    breite: W, tiefe: D, hoehe: APEX,
    eingang: 'DOOR_eingang',
    objekte: ['PLACE_OBJ-026', 'PLACE_OBJ-071'],
  };
  return root;
}

// Raum ATL-019: Labor von Janus (Inner City, Etage 3)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang (getarnte Wand) an der Seite −Z. Leere Raumhülle: nur Architektur, keine Möbel.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_janus_lab',
  art: 'Raum',
  masse: 'ca. 89 m² Grundfläche · 3,6 m Deckenhöhe · 9,6 m × 9,6 m achteckiger Grundriss',
  wohin: 'Inner City, Etage 3 · verborgenes Forschungslabor des Antikers Janus hinter einer getarnten Wand',
  benutzen: 'Steuerschlüssel (OBJ-024) liegt auf der obersten Stufe des zentralen Attero-Sockels; Wandtastaturen, Kristallkonsolen und Messspulen werden später als fertige Objekte nachgerüstet',
  lichter: '5 LAMP_ (blaues Eislicht, Intensität 10–12, Reichweite 11 m) plus eingebaute blaue Lichtschlitze, Wanddisplays und Decken-Lichtfelder',
  animation: 'Blaues Licht der Lichtschlitze, Wanddisplays, Deckenfelder und Sockelintarsien pulsiert langsam',
  quelle: 'Screencaps Janus-Geheimlabor (ref1–ref3), Beschreibung „Labor von Janus“, Atlantis-Kupfer- und 30/60-Grad-Ästhetik',
};

const HALF = 4.8;               // halbe Grundkante
const H = 3.6;                 // lichte Höhe
const T = 0.3;                 // Wanddicke
const V = 0.79;                // senkrechter Anteil der 30°-Eckschnitte
const HC = Math.sqrt(3) * V;   // waagerechter Anteil der Eckschnitte
const DOOR_W = 2.4;
const DOOR_H = 3.0;

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_janus_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');

  const patina = new THREE.MeshStandardMaterial({
    name: 'lab_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const blueGlow = new THREE.MeshStandardMaterial({
    name: 'lab_blaues_licht', color: 0x9fd8ff, emissive: 0x3f8cff,
    emissiveIntensity: 1.6, roughness: 0.35,
  });
  const blueGlass = new THREE.MeshStandardMaterial({
    name: 'lab_blaues_glas', color: 0x0b2233, emissive: 0x2f7fd8,
    emissiveIntensity: 0.85, metalness: 0.25, roughness: 0.2,
  });
  const darkStone = new THREE.MeshStandardMaterial({
    name: 'lab_dunkler_stein', color: 0x39434a, metalness: 0.15, roughness: 0.85,
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, ry = 0) => {
    const m = add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
    m.rotation.y = ry;
    return m;
  };
  const empty = (name, x, y, z, ry = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = ry;
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

  const o3 = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((it, n) => {
      o3.position.set(it.x, it.y ?? 0, it.z);
      o3.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
      o3.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      o3.updateMatrix();
      im.setMatrixAt(n, o3.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Grundriss (Achteck, 30°-Eckschnitte)
  const fx = HALF - HC;
  const P = [
    [-fx, -HALF], [fx, -HALF],
    [HALF, -fx], [HALF, fx],
    [fx, HALF], [-fx, HALF],
    [-HALF, fx], [-HALF, -fx],
  ];

  const shapeFrom = (pts) => {
    const s = new THREE.Shape();
    pts.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    s.closePath();
    return s;
  };

  // ------------------------------------------------------------------ Boden (geschlossener Körper, Oberkante y = 0)
  const floorGeo = new THREE.ExtrudeGeometry(shapeFrom(P), { depth: 0.3, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = add(floorGeo, floorMat, 0, -0.3, 0, 'boden');
  floorMesh.receiveShadow = true;

  // Bodenplatten-Fugen im 1,2-m-Raster
  const fugen = [];
  for (let x = -3.6; x <= 3.61; x += 1.2) fugen.push({ x, z: 0, ry: 0 });
  for (let z = -3.6; z <= 3.61; z += 1.2) fugen.push({ x: 0, z, ry: Math.PI / 2 });
  inst(new THREE.BoxGeometry(0.035, 0.008, 7.6), copper, fugen, 'boden_fugen');

  // ------------------------------------------------------------------ Wandsegmente (Metadaten: Mitte, Länge, Normalen)
  const segs = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
    const ry = -Math.atan2(dz, dx);
    const nx = -dz / len, nz = dx / len;   // Innennormale
    const ux = dx / len, uz = dz / len;   // Tangente
    segs.push({ a, b, dx, dz, len, cx, cz, ry, nx, nz, ux, uz });
  }

  // Grün-kupferner Sockelrand entlang der acht Seiten (Länge exakt je Segment)
  const rand = [];
  segs.forEach((s, i) => {
    if (i === 0) {
      // Frontseite: nur links und rechts der Tarnöffnung
      const leftLen = fx - DOOR_W / 2;
      rand.push({ x: -DOOR_W / 2 - leftLen / 2, y: 0.01, z: -HALF + 0.14, ry: 0, sx: leftLen - 0.1 });
      rand.push({ x: DOOR_W / 2 + leftLen / 2, y: 0.01, z: -HALF + 0.14, ry: 0, sx: leftLen - 0.1 });
      return;
    }
    rand.push({
      x: s.cx + s.nx * 0.14, y: 0.01, z: s.cz + s.nz * 0.14,
      ry: s.ry, sx: s.len - 0.12,
    });
  });
  inst(new THREE.BoxGeometry(1, 0.02, 0.12), patina, rand, 'boden_patina_rand');

  // Attero-Intarsie: achteckiger Kupferring (keine Rundbögen)
  const ringSeg = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ringSeg.push({ x: Math.cos(a) * 1.72, z: Math.sin(a) * 1.72, ry: -a + Math.PI / 2, y: 0.012 });
  }
  inst(new THREE.BoxGeometry(1.28, 0.024, 0.09), copper, ringSeg, 'boden_intarsie_attero');

  // Schneeflocken-Arme (radial zur Ringintarsie)
  const arms = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    arms.push({ x: Math.cos(a) * 1.05, z: Math.sin(a) * 1.05, ry: -a, y: 0.012 });
  }
  inst(new THREE.BoxGeometry(1.35, 0.02, 0.055), patina, arms, 'boden_schneeflocke');

  // ------------------------------------------------------------------ Wandaufbau, Paneele, Lichtschlitze
  const panelFramesQuer = [];   // obere/untere Rahmenleiste
  const panelFramesHoch = [];   // seitliche Rahmenleiste
  const panelFaces = [];
  const lightSlots = [];
  const basisStrips = [];

  // Panel mit Rahmen aus vier Leisten und eingelassener Fläche
  const addPanel = (cx, cz, u, n, ry, w = 1.0, h = 2.6) => {
    const d = 0.03;
    const px = cx + n.x * d, pz = cz + n.z * d;
    panelFaces.push({ x: px, y: 1.55, z: pz, ry, sx: w, sy: h });
    const bw = 0.08;
    panelFramesQuer.push({ x: cx + u.x * 0, y: 1.55 + h / 2 + bw / 2, z: cz + u.z * 0, ry, sx: w + bw * 2 });
    panelFramesQuer.push({ x: cx + u.x * 0, y: 1.55 - h / 2 - bw / 2, z: cz + u.z * 0, ry, sx: w + bw * 2 });
    panelFramesHoch.push({ x: cx + u.x * (w / 2 + bw / 2), y: 1.55, z: cz + u.z * (w / 2 + bw / 2), ry, sy: h + bw * 2 });
    panelFramesHoch.push({ x: cx - u.x * (w / 2 + bw / 2), y: 1.55, z: cz - u.z * (w / 2 + bw / 2), ry, sy: h + bw * 2 });
  };

  segs.forEach((s, si) => {
    const isFront = si === 0;
    if (isFront) {
      // Getarnte Wand: Öffnung 2,4 × 3 m mittig, je 1,2 m Wandfläche für die Schiebetürflügel.
      const leftLen = fx - DOOR_W / 2;
      const leftC = -DOOR_W / 2 - leftLen / 2;
      const rightC = DOOR_W / 2 + leftLen / 2;
      for (const c of [leftC, rightC]) {
        const nm = c < 0 ? 'links' : 'rechts';
        box(leftLen, H, T, wall, c, H / 2, -HALF, `wand_front_${nm}`);
        col(`COL_wand_front_${nm}`, leftLen, H, T, c, H / 2, -HALF);
        box(leftLen, 0.15, 0.05, copper, c, 0.075, -HALF + 0.17, `sockelleiste_front_${nm}`);
        box(leftLen, 0.1, 0.07, copper, c, H - 0.05, -HALF + 0.17, `gesims_front_${nm}`);
        basisStrips.push({ x: c, y: 0.24, z: -HALF + 0.17, ry: 0, sx: leftLen - 0.3 });
      }
      box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, -HALF, 'wand_front_sturz');
      col('COL_wand_front_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, -HALF);

      // Bronzefassung / Zarge der Tarnöffnung (3,34 × 3,74 m Außenmaß)
      box(DOOR_W + 0.34, 0.16, 0.12, copper, 0, DOOR_H + 0.08, -HALF + 0.19, 'tuerfassung_sturz');
      for (const sx of [-1, 1]) {
        box(0.17, DOOR_H + 0.16, 0.12, copper, sx * (DOOR_W / 2 + 0.085), (DOOR_H + 0.16) / 2, -HALF + 0.19, `tuerfassung_seite_${sx < 0 ? 'l' : 'r'}`);
      }
      // Getarnungs-Paneele beidseitig der Öffnung (flach, bündig in der Wand)
      for (const sx of [-1, 1]) {
        for (let k = 0; k < 2; k++) {
          const px = sx * (1.82 + k * 1.06);
          addPanel(px, -HALF + 0.16, { x: 1, z: 0 }, { x: 0, z: 1 }, 0, 0.98, 2.55);
        }
      }
      // Blaues Lichtband über der Tarnöffnung
      box(DOOR_W + 0.34, 0.05, 0.05, blueGlow, 0, DOOR_H + 0.2, -HALF + 0.24, 'lichtband_tarnwand');
      return;
    }

    box(s.len, H, T, wall, s.cx, H / 2, s.cz, `wand_${si}`, s.ry);
    col(`COL_wand_${si}`, s.len, H, T, s.cx, H / 2, s.cz, s.ry);

    // Sockelleiste, Gesims und blauer Sockel-Lichtstreifen an der Innenfläche
    const ix = s.cx + s.nx * (T / 2 + 0.02);
    const iz = s.cz + s.nz * (T / 2 + 0.02);
    box(s.len, 0.15, 0.05, copper, ix, 0.075, iz, `sockelleiste_${si}`, s.ry);
    box(s.len, 0.1, 0.07, copper, ix, H - 0.05, iz, `gesims_${si}`, s.ry);
    basisStrips.push({ x: s.cx + s.nx * (T / 2 + 0.06), y: 0.24, z: s.cz + s.nz * (T / 2 + 0.06), ry: s.ry, sx: s.len - 0.3 });

    // Zierpaneele im 1,2-m-Raster, jedes zweite Feld mit Lichtschlitzen
    const n = Math.max(1, Math.floor(s.len / 1.2));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const px = s.a[0] + (s.b[0] - s.a[0]) * t + s.nx * (T / 2 + 0.03);
      const pz = s.a[1] + (s.b[1] - s.a[1]) * t + s.nz * (T / 2 + 0.03);
      addPanel(px, pz, { x: s.ux, z: s.uz }, { x: s.nx, z: s.nz }, s.ry, 1.0, 2.6);
      if (k % 2 === 1) {
        for (let q = 0; q < 4; q++) {
          lightSlots.push({
            x: px + s.nx * 0.05, y: 0.95 + q * 0.42, z: pz + s.nz * 0.05, ry: s.ry,
          });
        }
      }
    }
  });

  // Paneelrahmen (vier Leisten pro Feld) und eingelassene Paneelflächen
  inst(new THREE.BoxGeometry(1, 0.08, 0.05), copper, panelFramesQuer, 'paneel_rahmen_quer');
  inst(new THREE.BoxGeometry(0.08, 1, 0.05), copper, panelFramesHoch, 'paneel_rahmen_hoch');
  inst(new THREE.BoxGeometry(1, 1, 0.035), wallDark, panelFaces, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.07, 0.3, 0.03), blueGlow, lightSlots, 'lichtschlitze');
  inst(new THREE.BoxGeometry(1, 0.04, 0.03), blueGlow, basisStrips, 'sockel_lichtstreifen');

  // ------------------------------------------------------------------ Fest eingebaute Wanddisplays (architektonische Paneele)
  const octPlate = (r, depth) => {
    const s = new THREE.Shape();
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 8; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  };
  const displayGeoFrame = octPlate(1.02, 0.06);
  const displayGeoGlass = octPlate(0.9, 0.04);
  const displays = [
    { x: 4.6, y: 1.85, z: -2.0, ry: -Math.PI / 2 },
    { x: 4.6, y: 1.85, z: 2.0, ry: -Math.PI / 2 },
    { x: -4.6, y: 1.85, z: -2.0, ry: Math.PI / 2 },
    { x: -4.6, y: 1.85, z: 2.0, ry: Math.PI / 2 },
  ];
  displays.forEach((d, i) => {
    const f = add(displayGeoFrame, copper, d.x, d.y, d.z, `wanddisplay_rahmen_${i}`);
    f.rotation.y = d.ry;
    const g = add(displayGeoGlass, blueGlass, d.x - Math.sin(d.ry) * 0.02, d.y, d.z - Math.cos(d.ry) * 0.02, `wanddisplay_glas_${i}`);
    g.rotation.y = d.ry;
  });

  // ------------------------------------------------------------------ Alte Steinsäulen an den Eckpunkten
  const pillarData = [];
  P.forEach(([x, z], i) => {
    const a = P[(i + 1) % P.length];
    const ry = -Math.atan2(a[1] - z, a[0] - x);
    const px = x * 0.93, pz = z * 0.93;
    pillarData.push({ x: px, y: 1.85, z: pz, ry, rz: (i % 2 === 0 ? 1 : -1) * 0.03 });
    box(0.46, 0.3, 0.46, darkStone, px, 0.15, pz, `saeule_basis_${i}`, ry);
    col(`COL_saeule_${i}`, 0.5, H, 0.5, px, H / 2, pz, ry);
  });
  inst(new THREE.BoxGeometry(0.3, 3.0, 0.3), pillar, pillarData, 'saeulen');
  const kap = pillarData.map((p) => ({ x: p.x, y: H - 0.22, z: p.z, ry: p.ry, rz: p.rz }));
  inst(new THREE.BoxGeometry(0.42, 0.18, 0.42), copper, kap, 'saeulen_kapitell');

  // ------------------------------------------------------------------ Zentraler Sockel für das Attero-Gerät
  const sockel = new THREE.Group();
  sockel.name = 'sockel_attero';
  root.add(sockel);
  const plinth = (r, h, y, mat, name) => {
    const g = new THREE.CylinderGeometry(r, r, h, 8, 1);
    g.rotateY(Math.PI / 8);
    const m = new THREE.Mesh(g, mat);
    m.position.set(0, y + h / 2, 0);
    m.name = name;
    sockel.add(m);
    return m;
  };
  plinth(1.35, 0.22, 0, darkStone, 'sockel_stufe_1');
  plinth(1.02, 0.3, 0.22, copper, 'sockel_stufe_2');
  plinth(0.7, 0.33, 0.52, wallDark, 'sockel_stufe_3');
  const sockelRing = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    sockelRing.push({ x: Math.cos(a) * 0.52, y: 0.855, z: Math.sin(a) * 0.52, ry: -a + Math.PI / 2 });
  }
  inst(new THREE.BoxGeometry(0.38, 0.02, 0.07), blueGlow, sockelRing, 'sockel_leuchtring');
  col('COL_sockel_attero', 1.9, 0.85, 1.9, 0, 0.425, 0);

  // ------------------------------------------------------------------ Decke
  const ceilGeo = new THREE.ExtrudeGeometry(shapeFrom(P), { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  add(ceilGeo, ceilingMat, 0, H, 0, 'decke');

  // Abgehängte Kassettenfelder und blaue Lichtfelder
  const kass = [];
  const lichtfelder = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    kass.push({ x: sx * 2.15, y: H - 0.04, z: sz * 2.15, ry: 0 });
    lichtfelder.push({ x: sx * 2.15, y: H - 0.09, z: sz * 2.15, ry: 0 });
  }
  inst(new THREE.BoxGeometry(2.2, 0.08, 2.2), wallDark, kass, 'decke_kassetten');
  inst(new THREE.BoxGeometry(1.9, 0.04, 1.9), blueGlow, lichtfelder, 'decke_lichtfelder');

  // Kantenband der Decke (Bronze), Länge exakt je Wandsegment
  const kanten = segs.map((s) => ({
    x: s.cx + s.nx * 0.12, y: H - 0.09, z: s.cz + s.nz * 0.12, ry: s.ry, sx: s.len - 0.12,
  }));
  inst(new THREE.BoxGeometry(1, 0.07, 0.08), copper, kanten, 'decke_kantenband');

  // ------------------------------------------------------------------ Zugänge und Objektplätze
  // Getarnter Haupteingang: DOOR zeigt nach außen (−Z), Türblatt (+Z) zeigt in den Raum.
  empty('DOOR_getarnter_eingang', 0, 0, -HALF, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Verborgener Zugang zum Inner City (getarnte Wand)',
  });
  empty('PLACE_OBJ-091', 0, 0, -HALF, 0);

  // Steuerschlüssel des Attero-Geräts liegt auf der Sockeloberfläche (y = 0,85 m), Vorderseite zum Eingang
  empty('PLACE_OBJ-024', 0, 0.85, 0, Math.PI);

  // ------------------------------------------------------------------ Licht
  const lampPos = [
    [0, 3.25, 0],
    [-2.9, 3.2, -2.4],
    [2.9, 3.2, -2.4],
    [-2.9, 3.2, 2.4],
    [2.9, 3.2, 2.4],
  ];
  const pointLights = [];
  lampPos.forEach(([x, y, z], i) => {
    empty(`LAMP_${i + 1}`, x, y, z, 0, { color: '#5aa8ff', intensity: 11, distance: 11 });
    const pl = new THREE.PointLight(0x5aa8ff, 11, 11, 2);
    pl.position.set(x, y, z);
    root.add(pl);
    pointLights.push(pl);
  });
  const hemi = new THREE.HemisphereLight(0x2f6fb0, 0x101820, 0.55);
  root.add(hemi);

  // ------------------------------------------------------------------ Kollision
  // Boden (Boxen decken den achteckigen Grundriss ab)
  col('COL_boden_mitte', 6.8, 0.2, 6.8, 0, -0.1, 0);
  col('COL_boden_sued', 6.8, 0.2, 1.4, 0, -0.1, -4.1);
  col('COL_boden_nord', 6.8, 0.2, 1.4, 0, -0.1, 4.1);
  col('COL_boden_west', 1.4, 0.2, 6.8, -4.1, -0.1, 0);
  col('COL_boden_ost', 1.4, 0.2, 6.8, 4.1, -0.1, 0);

  // Decke
  col('COL_decke_mitte', 6.8, 0.3, 6.8, 0, H + 0.15, 0);
  col('COL_decke_sued', 6.8, 0.3, 1.4, 0, H + 0.15, -4.1);
  col('COL_decke_nord', 6.8, 0.3, 1.4, 0, H + 0.15, 4.1);
  col('COL_decke_west', 1.4, 0.3, 6.8, -4.1, H + 0.15, 0);
  col('COL_decke_ost', 1.4, 0.3, 6.8, 4.1, H + 0.15, 0);

  // ------------------------------------------------------------------ Animation (langsames Pulsieren des Blaulichts)
  let t = 0;
  let last = null;
  const animate = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.08);
    last = now;
    const p = 0.5 + 0.5 * Math.sin(t * 0.9);
    blueGlow.emissiveIntensity = 1.25 + p * 0.7;
    blueGlass.emissiveIntensity = 0.6 + p * 0.6;
  };
  root.onBeforeRender = animate;

  root.userData.raum = {
    id: 'ATL-019',
    name: 'Labor von Janus',
    etage: 3,
    bereich: 'Inner City',
    hoehe: H,
    grundflaeche: 'ca. 89 m²',
    zugang: 'DOOR_getarnter_eingang (-Z)',
  };
  root.userData.api = {
    laborLicht: (intensitaet = 1) => {
      pointLights.forEach((pl) => { pl.intensity = 11 * intensitaet; });
      hemi.intensity = 0.55 * intensitaet;
      blueGlow.emissiveIntensity = (1.25 + 0.7) * intensitaet;
      blueGlass.emissiveIntensity = 1.2 * intensitaet;
    },
  };

  return root;
}

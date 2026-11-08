// Raum ATL-044: Stuhl-Raum / Chair Room – Inner City, Etage 5
// Sechseckige Kontrollkammer (60°-Flächenraster) mit kreisrunder Plattform,
// gewölbter Kuppel, abgestuftem Stuhlpodest, tiefroten Wandpaneelen mit
// geometrischen Atlantis-Motiven sowie eingelassenen Diagnoseanschlüssen.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Haupteingang an der Seite −Z. Leere Hülle: nur Architektur und Objektplätze.
import * as THREE from 'three';

const KIT = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });
const DEG = THREE.MathUtils.degToRad;

export const steckbrief = {
  name: 'raum_chair_room',
  art: 'Raum',
  masse: 'Sechseck ca. Ø 14,1 m (Fläche ca. 130 m²) × 4,5 m Mauerhöhe, Kuppel bis ca. 6,8 m',
  wohin: 'Inner City, Etage 5, öffentlicher Bereich – zentrale Kontrollkammer für den antiken Kontrollstuhl',
  benutzen: 'keine festen Bedienelemente; der antike Kontrollstuhl (OBJ-004) steht auf der erhöhten Kreisplattform in der Raummitte',
  lichter: '5 warme LAMP_-Punkte an den Wandflächen, 1 eisblauer LAMP_-Punkt im Kuppelapex, dazu eingebaute Lichtschlitze und Bernstein-Bodenfelder',
  animation: 'Lichtschlitze und Bodenfelder pulsieren dezent; Beleuchtung umschaltbar über userData.actions',
  quelle: 'selbst gebaut nach Beschreibung „Chair Room“, Serienbilder ref1/ref2, MGM Tech Journal ref3 und Setplan Mallozzi ref4 (Quellenklasse A/B)',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_chair_room';

  // ---------------------------------------------------------------- Maße
  const N = 6;                          // Sechseck: 60°-Flächenraster (30/60-Regel)
  const R = 7.07;                       // Umkreisradius (Eckenpunkte)
  const A = R * Math.cos(Math.PI / N);  // Inkreisradius ≈ 6,12 m (Wandinnenfläche)
  const T = 0.3;                        // Wanddicke
  const H = 4.5;                        // Mauerhöhe bis Kuppelansatz
  const APEX = 6.8;                     // Kuppelhöhe
  const SY = (APEX - H) / A;            // Stauchung der Kuppel
  const DOOR_W = 2.4;
  const DOOR_H = 3.0;
  const PODEST = 0.75;                  // Höhe der Podestoberkante
  const PODEST_R = 3.5;                 // Radius der Kreisplattform

  // ---------------------------------------------------------------- Materialien
  const wall = KIT('wall');
  const wallDark = KIT('wallDark');
  const copper = KIT('copper');
  const pillarMat = KIT('pillar');
  const floorMat = KIT('floor');
  const stairMat = KIT('stair');
  const glow = KIT('glow');
  const amberGlow = KIT('amberGlow');
  const ceilingMat = new THREE.MeshStandardMaterial({ name: 'KIT_ceiling', side: THREE.BackSide });
  const crimson = new THREE.MeshStandardMaterial({ name: 'wand_karmesin', color: 0x6e2222, roughness: 0.74, metalness: 0.12 });
  const motifMat = new THREE.MeshStandardMaterial({ name: 'wand_motiv_grau', color: 0x9aa4a8, roughness: 0.6, metalness: 0.22 });
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, roughness: 0.45, metalness: 0.6 });
  const lineGlow = new THREE.MeshStandardMaterial({ name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7 });
  const warmGlow = new THREE.MeshStandardMaterial({ name: 'boden_lichtfeld', color: 0xffd8a0, emissive: 0xffb15c, emissiveIntensity: 1.5 });
  const colMat = new THREE.MeshBasicMaterial({ name: 'COL_hinweis', transparent: true, opacity: 0, depthWrite: false });

  // ---------------------------------------------------------------- Helfer
  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const cyl = (r, h, mat, x, y, z, name, seg = 48) =>
    add(new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z, name);
  const torus = (r, tube, mat, x, y, z, name) => {
    const m = add(new THREE.TorusGeometry(r, tube, 6, 48), mat, x, y, z, name);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const colBox = (name, w, h, d, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colMat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    root.add(m);
    return m;
  };
  const colCyl = (name, r, h, x, y, z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), colMat);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  };
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    const o = new THREE.Object3D();
    list.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.count = list.length;
    im.instanceMatrix.needsUpdate = true;
    im.name = name;
    root.add(im);
    return im;
  };

  // ---------------------------------------------------------------- Grundriss (Sechseck)
  // Vertexwinkel: -120° … +180° → eine Fläche liegt exakt auf −Z (Haupteingang).
  const vAng = [];
  for (let k = 0; k < N; k++) vAng.push(DEG(-120 + 60 * k));
  const verts = vAng.map(a => new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R));

  const facets = [];
  for (let k = 0; k < N; k++) {
    const mAng = DEG(-90 + 60 * k);
    const n = new THREE.Vector2(Math.cos(mAng), Math.sin(mAng));   // Außennormale der Fläche
    const t = new THREE.Vector2(-Math.sin(mAng), Math.cos(mAng));  // Tangente (Flächenrichtung)
    const ry = -Math.atan2(t.y, t.x);                            // lokales X = Tangente, lokales Z = nach innen
    const len = R;                                                // Sechseck: Seitenlänge = Umkreisradius
    facets.push({
      k, mAng, n, t, ry, len,
      inner: n.clone().multiplyScalar(A),
      center: n.clone().multiplyScalar(A + T / 2),
      inward: n.clone().negate(),
    });
  }
  const front = facets[0];
  const frontWallZ = front.center.y;             // Wandmitte vorn (≈ -6,27)
  const sideW = (front.len - DOOR_W) / 2;         // ≈ 2,34 m Wand je Seite der Öffnung

  // ---------------------------------------------------------------- Boden
  cyl(R + T + 0.05, 0.1, floorMat, 0, -0.05, 0, 'boden', 64);
  torus(A + 0.03, 0.05, copper, 0, 0.012, 0, 'boden_rand');
  torus(4.55, 0.045, patina, 0, 0.014, 0, 'boden_intarsie_aussen');
  torus(4.05, 0.035, copper, 0, 0.016, 0, 'boden_intarsie_innen');

  // radiale Bodenschliffe (6 × 60°)
  const floorLines = [];
  for (let i = 0; i < N; i++) {
    const a = DEG(-90 + 60 * i);
    floorLines.push({
      x: Math.cos(a) * 4.8, y: 0.006, z: Math.sin(a) * 4.8,
      ry: -Math.atan2(Math.cos(a), Math.sin(a)),
    });
  }
  inst(new THREE.BoxGeometry(0.05, 0.006, 1.5), copper, floorLines, 'boden_schliffe');

  // ---------------------------------------------------------------- Wandaufbauten
  const wallPanels = [];
  const wallFrames = [];
  const motifs = [];
  const sockets = [];
  const socketSlots = [];
  const lightSlots = [];

  const pushPanel = (f, off, w = 1.35) => {
    const base = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(0.035));
    wallPanels.push({ x: base.x, y: 1.8, z: base.y, ry: f.ry });
    wallFrames.push({ x: base.x, y: 1.8, z: base.y, ry: f.ry });
    const mBase = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(0.075));
    // geometrisches Atlantis-Motiv: Querbalken + Stiel + zwei diagonale Äste
    motifs.push({ x: mBase.x, y: 2.42, z: mBase.y, ry: f.ry });
    motifs.push({ x: mBase.x, y: 1.95, z: mBase.y, ry: f.ry });
    motifs.push({ x: mBase.x + f.t.x * (w * 0.26), y: 1.95, z: mBase.y + f.t.y * (w * 0.26), ry: f.ry, rz: 0.46 });
    motifs.push({ x: mBase.x - f.t.x * (w * 0.26), y: 1.95, z: mBase.y - f.t.y * (w * 0.26), ry: f.ry, rz: -0.46 });
  };
  const pushSocket = (f, off) => {
    const base = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(0.03));
    sockets.push({ x: base.x, y: 1.55, z: base.y, ry: f.ry });
    for (let j = 0; j < 3; j++) {
      socketSlots.push({
        x: base.x + f.inward.x * 0.06,
        y: 1.84 - j * 0.26,
        z: base.y + f.inward.y * 0.06,
        ry: f.ry,
      });
    }
  };
  const pushSlots = (f, off) => {
    for (let j = 0; j < 4; j++) {
      const base = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(0.03));
      lightSlots.push({ x: base.x, y: 1.15 + j * 0.55, z: base.y, ry: f.ry });
    }
  };

  for (const f of facets) {
    if (f.k === 0) {
      // Frontfläche: zwei Seitenstücke + Sturz über der 2,4 × 3,0-m-Öffnung
      for (const sign of [-1, 1]) {
        const off = sign * (DOOR_W / 2 + sideW / 2);
        const p = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(T / 2));
        const m = box(sideW, H, T, wall, p.x, H / 2, p.y, `wand_front_${sign < 0 ? 'l' : 'r'}`);
        m.rotation.y = f.ry;
      }
      const lintel = box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, frontWallZ, 'wand_front_sturz');
      lintel.rotation.y = f.ry;
      // Bronzeeinfassung der Türöffnung
      const fr = f.inner.clone().add(f.inward.clone().multiplyScalar(0.04));
      box(DOOR_W + 0.2, 0.14, 0.1, copper, 0, DOOR_H, fr.y, 'tuer_einfassung_oben');
      for (const sign of [-1, 1]) {
        box(0.1, DOOR_H, 0.1, copper, sign * (DOOR_W / 2 + 0.05), DOOR_H / 2, fr.y, `tuer_einfassung_${sign < 0 ? 'l' : 'r'}`);
      }
      // Zierpaneele und Lichtschlitze neben der Tür
      pushPanel(f, -(DOOR_W / 2 + sideW / 2), 1.6);
      pushPanel(f, (DOOR_W / 2 + sideW / 2), 1.6);
      pushSlots(f, -(DOOR_W / 2 + 0.3));
      pushSlots(f, (DOOR_W / 2 + 0.3));
      continue;
    }
    const m = box(f.len, H, T, wall, f.center.x, H / 2, f.center.y, `wand_${f.k}`);
    m.rotation.y = f.ry;
    // vier Wandfelder je Fläche (ca. 1,77 m): Paneel – Diagnoseanschluss – Paneel – Lichtschlitze
    const fw = f.len / 4;
    for (let j = 0; j < 4; j++) {
      const off = -f.len / 2 + fw * (j + 0.5);
      if (j === 0 || j === 2) pushPanel(f, off);
      else if (j === 1) { pushSocket(f, off - fw * 0.24); pushSlots(f, off + fw * 0.3); }
      else pushSocket(f, off);
    }
  }

  // ---------------------------------------------------------------- Eckpfeiler
  const pillarList = [];
  for (let k = 0; k < N; k++) {
    const a = vAng[k];
    const p = new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(R - 0.3);
    pillarList.push({ x: p.x, y: (H - 0.4) / 2, z: p.y, ry: -a - Math.PI / 2 });
  }
  inst(new THREE.BoxGeometry(0.28, H - 0.4, 0.36), pillarMat, pillarList, 'saeulen');

  // ---------------------------------------------------------------- Wandfelder als Instanzen
  inst(new THREE.BoxGeometry(1.46, 2.96, 0.06), copper, wallFrames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.34, 2.84, 0.05), crimson, wallPanels, 'paneele');
  inst(new THREE.BoxGeometry(1.08, 0.08, 0.03), motifMat, motifs, 'wand_motive');
  inst(new THREE.BoxGeometry(0.86, 1.06, 0.05), wallDark, sockets, 'diagnoseanschluesse');
  inst(new THREE.BoxGeometry(0.54, 0.055, 0.03), lineGlow, socketSlots, 'diagnose_leuchtfelder');
  const slotMesh = inst(new THREE.BoxGeometry(0.05, 0.34, 0.04), lineGlow, lightSlots, 'lichtschlitze');

  // Sockelleisten und Gesimse je Fläche
  for (const f of facets) {
    if (f.k === 0) {
      for (const sign of [-1, 1]) {
        const off = sign * (DOOR_W / 2 + sideW / 2);
        const p = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(0.03));
        box(sideW, 0.15, 0.05, copper, p.x, 0.075, p.y, `sockel_front_${sign < 0 ? 'l' : 'r'}`).rotation.y = f.ry;
        box(sideW, 0.1, 0.06, copper, p.x, H - 0.05, p.y, `gesims_front_${sign < 0 ? 'l' : 'r'}`).rotation.y = f.ry;
      }
      continue;
    }
    const p = f.inner.clone().add(f.inward.clone().multiplyScalar(0.03));
    box(f.len, 0.15, 0.05, copper, p.x, 0.075, p.y, `sockel_${f.k}`).rotation.y = f.ry;
    box(f.len, 0.1, 0.06, copper, p.x, H - 0.05, p.y, `gesims_${f.k}`).rotation.y = f.ry;
  }

  // ---------------------------------------------------------------- Kreisplattform und Treppe
  // Erhöhte Kreisplattform (Tragkörper der Plattform), Oberkante y = 0,75
  cyl(PODEST_R, PODEST, stairMat, 0, PODEST / 2, 0, 'podest_plattform', 56);
  torus(PODEST_R - 0.02, 0.04, copper, 0, PODEST - 0.02, 0, 'podest_kante');
  torus(PODEST_R - 0.55, 0.03, patina, 0, PODEST + 0.002, 0, 'podest_intarsie_aussen');
  torus(2.15, 0.03, copper, 0, PODEST + 0.004, 0, 'podest_intarsie_innen');

  // Zwei Stufen (0,25 m) vom Eingang zur Plattform
  const stepW = 2.4;
  box(stepW, 0.25, 0.6, stairMat, 0, 0.125, -4.4, 'treppe_stufe_1');
  box(stepW, 0.5, 0.6, stairMat, 0, 0.25, -3.8, 'treppe_stufe_2');
  box(stepW + 0.12, 0.06, 0.06, copper, 0, 0.255, -4.1, 'treppe_kante_1');
  box(stepW + 0.12, 0.06, 0.06, copper, 0, 0.505, -3.5, 'treppe_kante_2');

  // ---------------------------------------------------------------- Bodenlichtfelder (Ring um die Plattform)
  const floorLights = [];
  for (let i = 0; i < 12; i++) {
    const a = DEG(-90 + i * 30);
    floorLights.push({ x: Math.cos(a) * 4.85, y: 0.02, z: Math.sin(a) * 4.85, ry: -a + Math.PI / 2 });
  }
  const floorLightMesh = inst(new THREE.BoxGeometry(0.9, 0.018, 0.62), warmGlow, floorLights, 'boden_lichtfelder');

  // ---------------------------------------------------------------- Decke: Kranz, Kuppel, Rippen
  const corniceDepth = R - A + 0.14;
  for (const f of facets) {
    const p = f.n.clone().multiplyScalar(A + corniceDepth / 2 - 0.06);
    const m = box(f.len, 0.3, corniceDepth, ceilingMat, p.x, H + 0.15, p.y, `decke_kranz_${f.k}`);
    m.rotation.y = f.ry;
  }
  const dome = add(new THREE.SphereGeometry(A, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), ceilingMat, 0, H, 0, 'decke_kuppel');
  dome.scale.set(1, SY, 1);
  torus(A - 0.06, 0.14, copper, 0, H - 0.04, 0, 'decke_ring_bronze');
  torus(A - 0.5, 0.06, glow, 0, H - 0.14, 0, 'decke_leuchtring');
  // Kuppelrippen (Meridiane)
  for (let k = 0; k < N; k++) {
    const a = DEG(-90 + 60 * k);
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const r = 0.95 + (A - 1.0) * (i / 8);
      const y = H + SY * Math.sqrt(Math.max(0, A * A - r * r));
      pts.push(new THREE.Vector3(Math.cos(a) * r, y - 0.02, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.055, 5, false), copper);
    tube.name = `decke_rippe_${k}`;
    root.add(tube);
  }
  // konzentrische Leuchtringe auf der Kuppel
  for (const r of [2.6, 4.3, 5.4]) {
    const y = H + SY * Math.sqrt(Math.max(0, A * A - r * r)) - 0.02;
    torus(r, 0.035, glow, 0, y, 0, `decke_leuchtring_${String(r).replace('.', '_')}`);
  }
  add(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 28), glow, 0, APEX - 0.09, 0, 'decke_lichtfeld_apex');

  // ---------------------------------------------------------------- Objektplätze / Anschlüsse
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Antiker Kontrollstuhl (3,39 × 2,30 × 3,39 m): Fußpunkt auf der Podestoberkante,
  // Vorderseite (+Z des Objekts) zeigt zum Haupteingang (−Z).
  empty('PLACE_OBJ-004', 0, PODEST, 0, Math.PI);

  // Antiker Schiebetür in der Frontöffnung: Ursprung in der Wandmitte, +Z zeigt in den Raum.
  empty('PLACE_OBJ-091', 0, 0, frontWallZ, 0);

  // Durchgang nach außen
  empty('DOOR_haupteingang', 0, 0, frontWallZ, Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Korridor Innere Stadt (ATL-049)',
    raum: 'ATL-049',
  });

  // Interaktionsanker für die Lichtsteuerung (an der Wandinnenseite)
  {
    const f = facets[1];
    const p = f.inner.clone().add(f.inward.clone().multiplyScalar(0.06));
    empty('INT_044_licht', p.x, 1.2, p.y, f.ry + Math.PI, { label: 'Beleuchtung dimmen' });
  }

  // ---------------------------------------------------------------- Licht
  const lampNodes = [];
  const addLamp = (name, x, y, z, color, intensity, distance) => {
    const node = empty(name, x, y, z, 0, { color, intensity, distance });
    const light = new THREE.PointLight(new THREE.Color(color), intensity, distance, 2);
    light.position.set(x, y, z);
    root.add(light);
    lampNodes.push({ node, light, base: intensity });
    return node;
  };
  for (let i = 0; i < 5; i++) {
    const f = facets[i + 1];                    // Flächen 1..5; Frontfläche bleibt frei
    const p = f.n.clone().multiplyScalar(A - 0.6);
    addLamp(`LAMP_${i + 1}`, p.x, 3.35, p.y, '#ffd8a0', 9, 13);
  }
  addLamp('LAMP_6', 0, APEX - 0.6, 0, '#9fd8ff', 7, 16);

  // ---------------------------------------------------------------- Kollision
  colCyl('COL_boden', R + T + 0.05, 0.2, 0, -0.1, 0);
  for (const f of facets) {
    if (f.k === 0) {
      for (const sign of [-1, 1]) {
        const off = sign * (DOOR_W / 2 + sideW / 2);
        const p = f.inner.clone().add(f.t.clone().multiplyScalar(off)).add(f.inward.clone().multiplyScalar(T / 2));
        colBox(`COL_wand_front_${sign < 0 ? 'l' : 'r'}`, sideW, H, T, p.x, H / 2, p.y, f.ry);
      }
      colBox('COL_sturz_front', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, frontWallZ, f.ry);
    } else {
      colBox(`COL_wand_${f.k}`, f.len, H, T, f.center.x, H / 2, f.center.y, f.ry);
    }
  }
  {
    const domeCol = new THREE.Mesh(new THREE.SphereGeometry(A, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), colMat);
    domeCol.name = 'COL_kuppel';
    domeCol.position.set(0, H, 0);
    domeCol.scale.set(1, SY, 1);
    root.add(domeCol);
  }
  colCyl('COL_podest', PODEST_R, PODEST, 0, PODEST / 2, 0);
  // Treppe als Rampe (0,25-m-Stufen von der Plattform bis zum Boden)
  {
    const run = 1.2, rise = PODEST;
    const len = Math.hypot(run, rise);
    const ang = Math.atan2(rise, run);
    const midZ = -3.5 - run / 2;
    const midY = rise / 2;
    colBox('COL_treppe_rampe', stepW, 0.2, len, 0, midY - 0.1 * Math.cos(ang), midZ + 0.1 * Math.sin(ang), 0, -ang);
  }
  for (let k = 0; k < N; k++) {
    const a = vAng[k];
    const p = new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(R - 0.3);
    colBox(`COL_saeule_${k}`, 0.28, H - 0.4, 0.36, p.x, (H - 0.4) / 2, p.y, -a - Math.PI / 2);
  }

  // ---------------------------------------------------------------- Interaktion & Animation
  let dimmed = false;
  const setDim = (on) => {
    dimmed = on;
    for (const l of lampNodes) {
      const v = on ? Math.max(2.5, l.base * 0.35) : l.base;
      l.light.intensity = v;
      l.node.userData.intensity = v;
    }
    lineGlow.emissiveIntensity = on ? 0.55 : 1.7;
    warmGlow.emissiveIntensity = on ? 0.5 : 1.5;
    glow.emissiveIntensity = on ? 0.5 : 1.6;
  };
  root.userData.actions = [
    { id: 'INT_044_licht', label: 'Beleuchtung dimmen', run: () => setDim(!dimmed) },
  ];
  root.userData.api = {
    setDim,
    isDimmed: () => dimmed,
    podestHoehe: PODEST,
    radius: R,
    radiusInnen: A,
    hoehe: H,
    kuppelHoehe: APEX,
  };

  let t = 0, last = null;
  const pulse = (mesh, mat, base, amp, speed) => {
    mesh.onBeforeRender = () => {
      const now = performance.now() / 1000;
      if (last !== null) t += Math.min(now - last, 0.1);
      last = now;
      mat.emissiveIntensity = base + Math.sin(t * speed) * amp;
    };
  };
  pulse(slotMesh, lineGlow, 1.7, 0.14, 0.8);
  pulse(floorLightMesh, warmGlow, 1.5, 0.16, 0.55);

  root.userData.raum = {
    id: 'ATL-044',
    name: 'Stuhl-Raum / Chair Room',
    radius: R,
    hoehe: H,
    podest: PODEST,
    doorn: 'DOOR_haupteingang',
  };
  return root;
}

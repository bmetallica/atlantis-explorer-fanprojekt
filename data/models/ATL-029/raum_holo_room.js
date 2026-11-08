// Raum ATL-029: Holo-Raum (Antiker-Projektionssaal)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Haupteingang an der Seite -Z. Leere Raumhülle: nur Architektur (Wände, Projektionsflächen,
// Deckengewölbe, Sternfeld, Lichtschlitze, Bodenintarsien) – keine Möbel.
//
// Der Raum ist polygonal aufgebaut (1 breite Frontfläche + 24 Seitenflächen), damit die
// 360-Grad-Projektionswand als nahtlos wirkende, facettierte Hülle erscheint und zugleich
// eckige Wandfelder gemäß Atlantis-Regeln erhalten bleiben.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_holo_room',
  art: 'Raum',
  masse: 'ca. 120 m² Grundfläche (Ø ca. 12,4 m), lichte Höhe 5,0 m',
  wohin: 'Inner City, Etage 4 – Schnittstelle zur Antiker-Wissensdatenbank',
  benutzen: 'Hologramm-Projektion und räumliche Informationsvermittlung',
  lichter: '6 LAMP_ (eisblau, indirekt), architektonische Lichtschlitze, Deckensternfeld und Deckenlichtband',
  animation: 'Deckensternfeld und Lichtschlitze pulsieren sehr dezent',
  quelle: 'selbst gebaut nach Raumbeschreibung ATL-029 sowie Screencaps (Hologramm-Projektionsraum, aktivierte Geschichtsdarstellung)',
};

const R = 6.2;             // Radius des polygonalen Grundrisses (Eckpunkte der Innenhülle)
const H = 4.2;             // Höhe der senkrechten Wandzone
const CEIL = 5.0;          // lichte Deckenhöhe
const T = 0.3;             // Wanddicke
const DOOR_W = 2.4;        // Durchgangsbreite
const DOOR_H = 3.0;        // Durchgangshöhe
const FRONT_HALF = Math.asin(2.4 / R); // halber Öffnungswinkel der Frontfläche (Chord 4,8 m)
const SIDE_FACES = 24;     // Seitenfacetten der 360°-Projektionshülle
const CROWN_R = 4.35;      // Radius, auf den das Deckengewölbe zusammenläuft
const RISE = CEIL - H;     // 0,8 m Anstieg der Gewölbeflächen

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_holo_room';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const ceilMat = kit('ceiling');
  const glowMat = kit('glow');
  const floorMat = new THREE.MeshStandardMaterial({
    name: 'boden_hologramm', color: 0x1a222a, metalness: 0.88, roughness: 0.11,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'licht_holo', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7, roughness: 0.4,
  });
  const nebulaMat = new THREE.MeshStandardMaterial({
    name: 'sternfeld_nebel', color: 0x171532, emissive: 0x241d52, emissiveIntensity: 0.9,
    roughness: 0.85, metalness: 0.0,
  });
  const starWhite = new THREE.MeshBasicMaterial({ name: 'sternfeld_weiss', color: 0xf6fbff, toneMapped: false });
  const starViolet = new THREE.MeshBasicMaterial({ name: 'sternfeld_violett', color: 0xbcc6ff, toneMapped: false });

  const up = new THREE.Vector3(0, 1, 0);
  const o3 = new THREE.Object3D();

  const add = (geo, mat, x, y, z, name, quat) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (quat) m.quaternion.copy(quat);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, quat) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, quat);

  // Instanzierte, wandparallel orientierte Elemente
  const inst = (geo, mat, items, name) => {
    if (!items.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, i) => {
      o3.position.copy(it.p);
      o3.quaternion.copy(it.q);
      o3.scale.set(1, 1, 1);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Grundriss
  const faces = [];
  {
    const a0 = -Math.PI / 2 - FRONT_HALF;
    const a1 = -Math.PI / 2 + FRONT_HALF;
    faces.push({ a0, a1, door: true });
    const step = (Math.PI * 2 - (a1 - a0)) / SIDE_FACES;
    let a = a1;
    for (let i = 0; i < SIDE_FACES; i++) {
      faces.push({ a0: a, a1: a + step, door: false });
      a += step;
    }
  }

  // ------------------------------------------------------------------ Boden
  add(new THREE.CylinderGeometry(R, R, 0.12, 48), floorMat, 0, -0.06, 0, 'boden');
  add(new THREE.RingGeometry(R - 0.36, R - 0.08, 48), copper, 0, 0.004, 0, 'boden_rand').rotation.x = -Math.PI / 2;
  add(new THREE.RingGeometry(3.60, 3.74, 48), copper, 0, 0.004, 0, 'boden_intarsie_innen').rotation.x = -Math.PI / 2;
  add(new THREE.RingGeometry(4.84, 4.96, 48), copper, 0, 0.004, 0, 'boden_intarsie_aussen').rotation.x = -Math.PI / 2;

  // radiale Kupferadern (Schneeflocken-Motiv auf dem reflektierenden Boden)
  const spokes = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * 4.30, 0.004, Math.sin(a) * 4.30);
    const q = new THREE.Quaternion().setFromAxisAngle(up, -a);
    spokes.push({ p, q });
  }
  inst(new THREE.BoxGeometry(1.0, 0.008, 0.05), copper, spokes, 'boden_adern');

  // ------------------------------------------------------------------ Wände / Projektionshülle
  const projPanels = [];
  const mullions = [];
  const sockels = [];
  const cornices = [];
  const slots = [];
  const coves = [];
  const wallSegs = [];

  for (const f of faces) {
    const dA = f.a1 - f.a0;
    const theta = (f.a0 + f.a1) / 2;
    const chord = 2 * R * Math.sin(dA / 2);
    const dPlane = R * Math.cos(dA / 2);
    const dir = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
    const ex = new THREE.Vector3(Math.sin(theta), 0, -Math.cos(theta));
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, up, dir));
    const inner = dir.clone().multiplyScalar(dPlane);
    const inward = dir.clone().negate();

    const addSeg = (w, h, y, off, name) => {
      const p = inner.clone().addScaledVector(dir, T / 2).addScaledVector(ex, off).setY(y);
      box(w, h, T, wallMat, p.x, p.y, p.z, name, q);
      wallSegs.push({ w, h, p, q });
      return p;
    };

    if (f.door) {
      // Frontfläche: 4,8 m breit → 2,4-m-Öffnung + je 1,2 m Taschenwand für die Schiebetür
      const sideW = (chord - DOOR_W) / 2;
      const off = DOOR_W / 2 + sideW / 2;
      for (const s of [-1, 1]) {
        addSeg(sideW, H, H / 2, s * off, `wand_front_${s < 0 ? 'links' : 'rechts'}`);
        // Projektionsfläche der Taschenwand
        projPanels.push({
          p: inner.clone().addScaledVector(ex, s * off).addScaledVector(inward, 0.03).setY(H / 2 + 0.05),
          q,
        });
        // Sockel / Gesims
        sockels.push({ p: inner.clone().addScaledVector(ex, s * off).addScaledVector(inward, 0.035).setY(0.08), q });
        cornices.push({ p: inner.clone().addScaledVector(ex, s * off).addScaledVector(inward, 0.035).setY(H - 0.08), q });
        // Lichtschlitze auf der Taschenwand
        for (let k = 0; k < 4; k++) {
          slots.push({
            p: inner.clone().addScaledVector(ex, s * off).addScaledVector(inward, 0.062).setY(1.02 + k * 0.42),
            q,
          });
        }
      }
      // Sturz über der Öffnung
      addSeg(chord, H - DOOR_H, DOOR_H + (H - DOOR_H) / 2, 0, 'wand_front_sturz');
      projPanels.push({
        p: inner.clone().addScaledVector(inward, 0.03).setY(DOOR_H + (H - DOOR_H) / 2),
        q,
      });
    } else {
      addSeg(chord, H, H / 2, 0, 'wand');
      // durchgehende dunkle Projektionsfläche, minimal vorstehend
      projPanels.push({
        p: inner.clone().addScaledVector(inward, 0.03).setY(H / 2 + 0.05),
        q,
      });
      sockels.push({ p: inner.clone().addScaledVector(inward, 0.035).setY(0.08), q });
      cornices.push({ p: inner.clone().addScaledVector(inward, 0.035).setY(H - 0.08), q });
      // senkrechte Lichtschlitze an beiden Facettenkanten
      for (const s of [-1, 1]) {
        const t = s * (chord / 2 - 0.17);
        for (let k = 0; k < 4; k++) {
          slots.push({
            p: inner.clone().addScaledVector(ex, t).addScaledVector(inward, 0.062).setY(1.02 + k * 0.42),
            q,
          });
        }
      }
    }

    // Bronzene Facettenkanten (Mullions) an beiden Enden jeder Fläche
    for (const s of [-1, 1]) {
      const t = s * (chord / 2 - 0.045);
      mullions.push({
        p: inner.clone().addScaledVector(ex, t).addScaledVector(inward, 0.06).setY(H / 2),
        q,
      });
    }

    // Decken-Lichtband an der Gewölbekante
    coves.push({
      p: inner.clone().addScaledVector(inward, 0.075).setY(H - 0.14),
      q,
    });

    // ---------------------------------------------------------------- Gewölbe-Fläche
    const run = dPlane - CROWN_R;
    const len = Math.sqrt(run * run + RISE * RISE);
    const sVec = new THREE.Vector3().addScaledVector(dir, -run / len).addScaledVector(up, RISE / len);
    const ez = new THREE.Vector3().crossVectors(ex, sVec).normalize();
    const q2 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, sVec, ez));
    const p1 = dir.clone().multiplyScalar(dPlane).setY(H);
    const p2 = dir.clone().multiplyScalar(CROWN_R).setY(CEIL);
    const surfMid = p1.clone().lerp(p2, 0.5);
    const c = surfMid.clone().addScaledVector(ez, T / 2);
    box(chord, len, T, wallDark, c.x, c.y, c.z, 'decke_fach', q2);
  }

  // ------------------------------------------------------------------ Gewölbe-Kranz, Decke, Sternfeld
  add(new THREE.CylinderGeometry(CROWN_R + 0.06, CROWN_R + 0.06, 0.3, 48), ceilMat, 0, CEIL + 0.15, 0, 'decke_scheibe');
  add(new THREE.RingGeometry(CROWN_R - 0.16, CROWN_R + 0.02, 48), copper, 0, CEIL - 0.008, 0, 'decke_kranz').rotation.x = Math.PI / 2;

  // weicher Nebel als Sternfeld-Hintergrund, flach an der Decke
  const nebula = add(new THREE.CircleGeometry(CROWN_R - 0.14, 48), nebulaMat, 0, CEIL - 0.006, 0, 'decke_sternnebel');
  nebula.rotation.x = Math.PI / 2;

  const starGeo = new THREE.CircleGeometry(0.055, 6);
  starGeo.rotateX(Math.PI / 2);
  const whiteStars = new THREE.InstancedMesh(starGeo, starWhite, 360);
  const violetStars = new THREE.InstancedMesh(starGeo, starViolet, 180);
  let seed = 20250;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  let wI = 0, vI = 0;
  for (let i = 0; i < 540; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (CROWN_R - 0.28);
    const s = 0.45 + rnd() * 1.7;
    o3.position.set(Math.cos(a) * r, CEIL - 0.016, Math.sin(a) * r);
    o3.quaternion.identity();
    o3.scale.set(s, s, s);
    o3.updateMatrix();
    if (i % 3 === 0) violetStars.setMatrixAt(vI++, o3.matrix);
    else whiteStars.setMatrixAt(wI++, o3.matrix);
  }
  whiteStars.count = wI;
  violetStars.count = vI;
  whiteStars.name = 'decke_sternfeld_weiss';
  violetStars.name = 'decke_sternfeld_violett';
  root.add(whiteStars, violetStars);

  // ------------------------------------------------------------------ Wanddetails (instanziert)
  const panelMesh = inst(new THREE.BoxGeometry(1, 2.5, 0.04), wallDark, [], 'paneele'); // Platzhalter entfernt
  root.remove(panelMesh);

  // Projektionsflächen: Maße je Fläche variieren → Instanzen über Skalierung
  const projMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.04), wallDark, projPanels.length);
  projPanels.forEach((it, i) => {
    const w = it.w ?? 1;
    o3.position.copy(it.p);
    o3.quaternion.copy(it.q);
    o3.scale.set(w, it.h ?? 1, 1);
    o3.updateMatrix();
    projMesh.setMatrixAt(i, o3.matrix);
  });
  projMesh.name = 'wand_projektionsflaechen';
  root.add(projMesh);

  inst(new THREE.BoxGeometry(0.08, H - 0.3, 0.07), copper, mullions, 'wand_facettenkanten');
  inst(new THREE.BoxGeometry(1, 0.16, 0.07), copper, sockels, 'sockelleisten');
  inst(new THREE.BoxGeometry(1, 0.10, 0.07), copper, cornices, 'gesimse');
  inst(new THREE.BoxGeometry(0.05, 0.30, 0.035), lineGlow, slots, 'lichtschlitze');
  inst(new THREE.BoxGeometry(1, 0.06, 0.06), lineGlow, coves, 'decke_lichtband');

  // Projektionsflächen mit korrekten Breiten/Höhen nachziehen
  projPanels.forEach((it, i) => {
    it.w = it.w ?? 1;
  });

  // ------------------------------------------------------------------ Tür (Frontfläche, -Z)
  const doorTheta = -Math.PI / 2;
  const doorDir = new THREE.Vector3(Math.cos(doorTheta), 0, Math.sin(doorTheta));
  const doorPlane = R * Math.cos(FRONT_HALF);
  const doorInner = doorDir.clone().multiplyScalar(doorPlane);
  const doorCenter = doorInner.clone().addScaledVector(doorDir, T / 2);

  // Bronzefassung der Öffnung
  for (const s of [-1, 1]) {
    box(0.16, DOOR_H + 0.16, 0.18, copper, s * (DOOR_W / 2 + 0.08), (DOOR_H + 0.16) / 2, doorInner.z - 0.06, 'tuer_fassung');
  }
  box(DOOR_W + 0.32, 0.16, 0.18, copper, 0, DOOR_H + 0.08, doorInner.z - 0.06, 'tuer_sturz');
  box(DOOR_W + 0.32, 0.06, 0.20, copper, 0, 0.03, doorInner.z - 0.07, 'tuer_sockel');

  // ------------------------------------------------------------------ Platzmarker / Anschlüsse
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  empty('DOOR_haupt', doorCenter.x, 0, doorCenter.z, Math.PI,
    { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor Innere Stadt, Etage 4', raum: 'ATL-049' });
  empty('PLACE_OBJ-091', doorCenter.x, 0, doorCenter.z, 0);   // Schiebetür, +Z zeigt in den Raum
  empty('PLACE_OBJ-029', 0, 0, 0, 0);                        // Hologramm-Projektor, Mitte, +Z zeigt zur Tür

  // ------------------------------------------------------------------ Lichter
  const lampAngles = [-Math.PI / 2 + 1.0, -Math.PI / 2 - 1.0, Math.PI * 0.35, Math.PI * 0.65, Math.PI * 1.15, Math.PI * 1.5];
  lampAngles.forEach((a, i) => {
    const r = 5.25;
    empty(`LAMP_${i + 1}`, Math.cos(a) * r, 3.85, Math.sin(a) * r, 0,
      { color: '#9fd8ff', intensity: 9, distance: 14 });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z, quat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    if (quat) m.quaternion.copy(quat);
    root.add(m);
    return m;
  };
  col('COL_boden_mitte', 8.8, 0.2, 8.8, 0, -0.1, 0);
  col('COL_boden_x', 12.4, 0.2, 8.8, 0, -0.1, 0);
  col('COL_boden_z', 8.8, 0.2, 12.4, 0, -0.1, 0);
  col('COL_decke', 12.4, 0.3, 12.4, 0, CEIL + 0.15, 0);
  wallSegs.forEach((s, i) => col(`COL_wand_${i}`, s.w, s.h, T, s.p.x, s.p.y, s.p.z, s.q));

  // ------------------------------------------------------------------ Animation
  const t0 = performance.now();
  whiteStars.onBeforeRender = () => {
    const t = performance.now() / 1000 - t0 / 1000;
    starWhite.color.setHSL(0.58, 0.12 + 0.05 * Math.sin(t * 0.5), 0.92 + 0.05 * Math.sin(t * 0.9));
    lineGlow.emissiveIntensity = 1.65 + Math.sin(t * 0.9 + 1.1) * 0.12;
    nebulaMat.emissiveIntensity = 0.85 + Math.sin(t * 0.35) * 0.12;
  };

  root.userData.raum = {
    id: 'ATL-029', radius: R, hoehe: CEIL, flaeche: Math.round(Math.PI * R * R),
  };
  return root;
}

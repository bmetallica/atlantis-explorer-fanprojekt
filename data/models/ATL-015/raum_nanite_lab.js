// Raum ATL-015: Nanite-Labor (East Pier, Etage 3).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hermetisch abgeschirmtes Speziallabor mit Schleusenvorraum.
// Nur Architektur (Hülle, EM-Ribs, Wandpaneele, Lichtschlitze, Deckenfelder, Geländer) – keine Möbel.
import * as THREE from 'three';

const kit = (n) => new THREE.MeshStandardMaterial({ name: `KIT_${n}` });

export const steckbrief = {
  name: 'raum_nanite_lab',
  art: 'Raum',
  masse: '9,0 m × 7,2 m Hauptlabor (64,8 m²) + 4,8 m × 2,4 m Schleusenvorraum (11,5 m²), Gesamt ca. 76 m², lichte Höhe 3,2 m',
  wohin: 'East Pier, Etage 3 – Wissenschafts- und Sicherheitsbereich',
  benutzen: 'Naniten-Erzeugung, Kryoproben und Gewebeschnitte; hermetischer Zutritt ausschließlich über die Doppelschleuse',
  lichter: '6 LAMP_ (4× eisblau im Labor, 2× bernsteinfarben in der Schleuse), dazu EM-Lichtschlitze und Deckenlichtfelder',
  animation: 'EM-Lichtschlitze und Abschirmfelder atmen langsam (0,15 Hz), Schleusen-Warnanzeige pulsiert schwach',
  quelle: 'Auftrag ATL-015 (science, Quellenklasse A), Referenzbild ref1.jpg (Hot Zone), Atlantis-Setpläne „Labs“',
};

export const varianten = [
  { label: 'Standard: Labor mit Schleusenvorraum', opts: {} },
];

const H = 3.2;          // lichte Raumhöhe
const T = 0.3;          // Wanddicke
const DOOR_W = 2.4;     // Öffnungsbreite
const DOOR_H = 3.0;     // Öffnungshöhe

// Hauptlabor (innen): x [-4.5, 4.5], z [-2.25, 4.95]
// Schleusenvorraum (innen): x [-2.4, 2.4], z [-4.95, -2.55]
const MAIN = { x0: -4.5, x1: 4.5, z0: -2.25, z1: 4.95 };
const VEST = { x0: -2.4, x1: 2.4, z0: -4.95, z1: -2.55 };
const PART_Z = -2.4;   // Mittelebene der Trennwand (Labor <-> Schleuse)
const OUT_Z = -5.1;    // Mittelebene der Außenwand (Haupteingang -Z)

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_nanite_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const floorUpper = kit('floorUpper');
  const ceilMat = kit('ceiling');
  const glowMat = kit('glow');
  const amberGlow = kit('amberGlow');
  const railMat = kit('rail');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const emPanel = new THREE.MeshStandardMaterial({
    name: 'em_abschirmfeld', color: 0x2b4a52, metalness: 0.55, roughness: 0.44,
    emissive: 0x0b2a33, emissiveIntensity: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'em_lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });
  const shieldGlow = new THREE.MeshStandardMaterial({
    name: 'em_daempfungsanzeige', color: 0x18323a, emissive: 0x2f7f9c, emissiveIntensity: 0.9,
  });
  const warnGlow = new THREE.MeshStandardMaterial({
    name: 'schleuse_warnanzeige', color: 0x3a2a12, emissive: 0xffb04a, emissiveIntensity: 1.1,
  });

  const dummy = new THREE.Object3D();

  const addMesh = (geo, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const addBox = (w, h, d, mat, x, y, z, name, rotY = 0) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, rotY);

  const addInst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.rotation.set(0, p[3] || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Maße
  const mainW = MAIN.x1 - MAIN.x0;         // 9.0
  const mainD = MAIN.z1 - MAIN.z0;         // 7.2
  const mainCz = (MAIN.z0 + MAIN.z1) / 2;  // 1.35
  const vestW = VEST.x1 - VEST.x0;         // 4.8
  const vestD = VEST.z1 - VEST.z0;         // 2.4
  const vestCz = (VEST.z0 + VEST.z1) / 2;  // -3.75

  // ------------------------------------------------------------------ Boden
  addBox(mainW, 0.12, mainD, floorMat, 0, -0.06, mainCz, 'boden_labor');
  addBox(vestW, 0.12, vestD, floorUpper, 0, -0.06, vestCz, 'boden_schleuse');

  // Grün-kupferner Rand
  for (const s of [-1, 1]) {
    addBox(0.16, 0.014, mainD, patina, s * (MAIN.x1 - 0.08), 0.007, mainCz, 'boden_rand');
    addBox(0.16, 0.014, vestD, patina, s * (VEST.x1 - 0.08), 0.007, vestCz, 'boden_rand_schleuse');
  }
  addBox(mainW, 0.014, 0.16, patina, 0, 0.007, MAIN.z1 - 0.08, 'boden_rand');
  addBox(mainW, 0.014, 0.16, patina, 0, 0.007, MAIN.z0 + 0.08, 'boden_rand');
  addBox(vestW, 0.014, 0.16, patina, 0, 0.007, VEST.z0 + 0.08, 'boden_rand_schleuse');

  // Bodenfugen (Raster 1,2 m)
  const fugenX = [];
  for (let z = MAIN.z0 + 1.2; z < MAIN.z1 - 0.4; z += 1.2) fugenX.push([0, 0.006, z, 0]);
  addInst(new THREE.BoxGeometry(mainW - 0.34, 0.008, 0.022), copper, fugenX, 'boden_fugen');
  const fugenZ = [];
  for (let x = MAIN.x0 + 1.2; x < MAIN.x1 - 0.4; x += 1.2) fugenZ.push([x, 0.006, mainCz, 0]);
  addInst(new THREE.BoxGeometry(0.022, 0.008, mainD - 0.34), copper, fugenZ, 'boden_fugen');

  // Sechseckige Bodenintarsie mit Schneeflocken-Armen (rund nur als Bodenintarsie erlaubt)
  const hexA = addMesh(new THREE.RingGeometry(1.36, 1.44, 6), copper, 0, 0.01, mainCz, 'boden_intarsie');
  hexA.rotation.x = -Math.PI / 2;
  const hexB = addMesh(new THREE.RingGeometry(0.52, 0.58, 6), copper, 0, 0.01, mainCz, 'boden_intarsie');
  hexB.rotation.x = -Math.PI / 2;
  const hexC = addMesh(new THREE.RingGeometry(1.78, 1.84, 6), patina, 0, 0.008, mainCz, 'boden_intarsie');
  hexC.rotation.x = -Math.PI / 2;
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    arms.push([Math.cos(a) * 0.95, 0.01, mainCz + Math.sin(a) * 0.95, -a]);
    arms.push([Math.cos(a) * 1.6, 0.01, mainCz + Math.sin(a) * 1.6, -a]);
  }
  addInst(new THREE.BoxGeometry(0.5, 0.01, 0.055), copper, arms, 'boden_intarsie_strahlen');
  // kleine Sechseck-Nischen in den vier Ecken des Hauptlabors
  const cornerHex = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cornerHex.push([sx * 3.55, 0.008, mainCz + sz * 2.55, 0]);
  const ch = addInst(new THREE.RingGeometry(0.42, 0.48, 6), patina, cornerHex, 'boden_intarsie_ecken');
  ch.geometry.rotateX(-Math.PI / 2);

  // Schleusen-Warnstreifen (diagonal, fest eingebaut)
  const warn = [];
  for (let x = -1.8; x <= 1.81; x += 0.6) warn.push([x, 0.01, -3.75, Math.PI / 4]);
  addInst(new THREE.BoxGeometry(0.12, 0.012, 1.1), warnGlow, warn, 'boden_warnstreifen');

  // Schwellenleisten an beiden Türöffnungen (Magnet-Sperrfeld-Markierung)
  for (const z of [PART_Z, OUT_Z]) {
    addBox(DOOR_W, 0.014, 0.10, glowMat, 0, 0.008, z, 'boden_schwelle_licht');
    addBox(DOOR_W + 0.2, 0.016, 0.05, copper, 0, 0.006, z - 0.09, 'boden_schwelle_einfassung');
    addBox(DOOR_W + 0.2, 0.016, 0.05, copper, 0, 0.006, z + 0.09, 'boden_schwelle_einfassung');
  }

  // ------------------------------------------------------------------ Wände
  // Rückwand Hauptlabor
  addBox(mainW + 2 * T, H, T, wall, 0, H / 2, MAIN.z1 + T / 2, 'wand_rueck');
  // Seitenwände Hauptlabor
  addBox(T, H, mainD, wall, MAIN.x0 - T / 2, H / 2, mainCz, 'wand_links');
  addBox(T, H, mainD, wall, MAIN.x1 + T / 2, H / 2, mainCz, 'wand_rechts');
  // Trennwand mit Türöffnung 2,4 × 3,0 (jede Seite 3,6 m Mauerwerk für die Schiebetür)
  const partHalf = (mainW + 2 * T - DOOR_W) / 2;   // 3.6
  addBox(partHalf, H, T, wall, -(DOOR_W / 2 + partHalf / 2), H / 2, PART_Z, 'wand_trenn_links');
  addBox(partHalf, H, T, wall, (DOOR_W / 2 + partHalf / 2), H / 2, PART_Z, 'wand_trenn_rechts');
  addBox(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, PART_Z, 'wand_trenn_sturz');
  // Schleusenseitenwände
  addBox(T, H, vestD, wall, VEST.x0 - T / 2, H / 2, vestCz, 'wand_schleuse_links');
  addBox(T, H, vestD, wall, VEST.x1 + T / 2, H / 2, vestCz, 'wand_schleuse_rechts');
  // Außenwand der Schleuse mit Türöffnung (1,5 m Mauerwerk je Seite für die Schiebetür)
  const outHalf = (vestW + 2 * T - DOOR_W) / 2;    // 1.5
  addBox(outHalf, H, T, wall, -(DOOR_W / 2 + outHalf / 2), H / 2, OUT_Z, 'wand_aussen_links');
  addBox(outHalf, H, T, wall, (DOOR_W / 2 + outHalf / 2), H / 2, OUT_Z, 'wand_aussen_rechts');
  addBox(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, OUT_Z, 'wand_aussen_sturz');

  // Bronzefassungen der Türöffnungen (Zarge)
  const doorTrim = (z, faceZ) => {
    addBox(DOOR_W + 0.28, 0.12, 0.09, copper, 0, DOOR_H + 0.05, faceZ, 'tuer_einfassung');
    for (const s of [-1, 1]) addBox(0.14, DOOR_H + 0.05, 0.09, copper, s * (DOOR_W / 2 + 0.06), (DOOR_H + 0.05) / 2, faceZ, 'tuer_einfassung');
    addBox(DOOR_W + 0.28, 0.05, 0.10, copper, 0, 0.025, faceZ, 'tuer_schwelle');
  };
  doorTrim(PART_Z, PART_Z + T / 2 + 0.05);
  doorTrim(OUT_Z, OUT_Z + T / 2 + 0.05);

  // Sockelleisten und Gesimse
  for (const s of [-1, 1]) {
    addBox(0.05, 0.15, mainD, copper, s * (MAIN.x1 - 0.025), 0.075, mainCz, 'sockelleiste');
    addBox(0.06, 0.10, mainD, copper, s * (MAIN.x1 - 0.03), H - 0.05, mainCz, 'gesims');
    addBox(0.05, 0.15, vestD, copper, s * (VEST.x1 - 0.025), 0.075, vestCz, 'sockelleiste');
    addBox(0.06, 0.10, vestD, copper, s * (VEST.x1 - 0.03), H - 0.05, vestCz, 'gesims');
  }
  addBox(mainW, 0.15, 0.05, copper, 0, 0.075, MAIN.z1 - 0.025, 'sockelleiste');
  addBox(mainW, 0.10, 0.06, copper, 0, H - 0.05, MAIN.z1 - 0.03, 'gesims');
  addBox(vestW, 0.15, 0.05, copper, 0, 0.075, VEST.z0 + 0.025, 'sockelleiste');
  addBox(vestW, 0.10, 0.06, copper, 0, H - 0.05, VEST.z0 + 0.03, 'gesims');

  // ------------------------------------------------------------------ EM-Abschirmfelder, Lichtschlitze, Rippen
  const panelGeo = new THREE.BoxGeometry(1.0, 2.3, 0.045);
  const frameGeo = new THREE.BoxGeometry(1.13, 2.43, 0.06);
  const slotGeo = new THREE.BoxGeometry(0.07, 0.30, 0.035);
  const panels = [], frames = [], slots = [];

  // Rückwand: 7 Felder à 1,2 m
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 1.2;
    if (i % 2 === 0) {
      panels.push([x, 1.55, MAIN.z1 - 0.035, 0]);
      frames.push([x, 1.55, MAIN.z1 - 0.055, 0]);
    } else {
      for (let k = 0; k < 4; k++) slots.push([x, 1.05 + k * 0.44, MAIN.z1 - 0.05, 0]);
    }
  }
  // Seitenwände: 6 Felder entlang z
  for (const s of [-1, 1]) {
    const ry = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    const xIn = s < 0 ? MAIN.x0 + 0.035 : MAIN.x1 - 0.035;
    const xFr = s < 0 ? MAIN.x0 + 0.055 : MAIN.x1 - 0.055;
    for (let i = 0; i < 6; i++) {
      const z = MAIN.z0 + 0.6 + i * 1.2;
      if (i % 2 === 0) {
        panels.push([xIn, 1.55, z, ry]);
        frames.push([xFr, 1.55, z, ry]);
      } else {
        for (let k = 0; k < 4; k++) slots.push([xIn, 1.55 - 1.55 + 1.05 + k * 0.44, z, ry]);
      }
    }
  }
  // Trennwandfelder, beide Seiten
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = s * (DOOR_W / 2 + 0.6 + i * 1.2);
      if (i % 2 === 0) {
        panels.push([x, 1.55, PART_Z - T / 2 - 0.035, 0]);
        frames.push([x, 1.55, PART_Z - T / 2 - 0.055, 0]);
        panels.push([x, 1.55, PART_Z + T / 2 + 0.035, 0]);
        frames.push([x, 1.55, PART_Z + T / 2 + 0.055, 0]);
      } else {
        for (let k = 0; k < 4; k++) {
          slots.push([x, 1.05 + k * 0.44, PART_Z - T / 2 - 0.05, 0]);
          slots.push([x, 1.05 + k * 0.44, PART_Z + T / 2 + 0.05, 0]);
        }
      }
    }
  }
  // Schleusenseitenfelder
  for (const s of [-1, 1]) {
    const ry = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    const xIn = s < 0 ? VEST.x0 + 0.035 : VEST.x1 - 0.035;
    const xFr = s < 0 ? VEST.x0 + 0.055 : VEST.x1 - 0.055;
    for (let i = 0; i < 2; i++) {
      const z = VEST.z0 + 0.6 + i * 1.2;
      if (i % 2 === 0) {
        panels.push([xIn, 1.55, z, ry]);
        frames.push([xFr, 1.55, z, ry]);
      } else {
        for (let k = 0; k < 4; k++) slots.push([xIn, 1.05 + k * 0.44, z, ry]);
      }
    }
  }

  addInst(frameGeo, copper, frames, 'em_feld_rahmen');
  addInst(panelGeo, emPanel, panels, 'em_abschirmfelder');
  const slotMesh = addInst(slotGeo, lineGlow, slots, 'em_lichtschlitze');

  // Vertikale EM-Rippen an den Wandstößen (eckig, verstärkte Abschirmung)
  const ribs = [];
  for (let i = 0; i <= 7; i++) {
    const x = MAIN.x0 + i * (mainW / 7);
    ribs.push([x, H / 2 - 0.1, MAIN.z1 - 0.10, 0]);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 6; i++) {
      const z = MAIN.z0 + i * (mainD / 6);
      ribs.push([s * (MAIN.x1 - 0.10), H / 2 - 0.1, z, Math.PI / 2]);
    }
  }
  addInst(new THREE.BoxGeometry(0.16, H - 0.5, 0.14), pillar, ribs, 'em_rippen');

  // 30°-Chevrons an den oberen Wandflächen (Frank-Lloyd-Wright-Motiv)
  const chevrons = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = MAIN.z0 + 1.2 + i * 2.4;
      chevrons.push([s * (MAIN.x1 - 0.08), H - 0.62, z, s < 0 ? Math.PI / 2 : -Math.PI / 2]);
    }
  }
  const chevMesh = addInst(new THREE.BoxGeometry(1.6, 0.09, 0.45), copper, chevrons, 'em_chevron');
  chevMesh.rotation.set(0, 0, 0);

  // ------------------------------------------------------------------ Säulen (leicht geneigt, Perlgrau)
  const colDefs = [
    { x: -4.05, z: -0.60, tilt: 0.055 },
    { x: 4.05, z: -0.60, tilt: -0.055 },
    { x: -4.05, z: 3.45, tilt: 0.055 },
    { x: 4.05, z: 3.45, tilt: -0.055 },
  ];
  colDefs.forEach((c, i) => {
    const p = addBox(0.30, H - 0.22, 0.30, pillar, c.x, (H - 0.22) / 2, c.z, `saeule_${i + 1}`);
    p.rotation.z = c.tilt;
    const cap = addBox(0.46, 0.13, 0.46, copper, c.x, H - 0.30, c.z, `saeulen_kappe_${i + 1}`);
    cap.rotation.z = c.tilt;
    const foot = addBox(0.46, 0.13, 0.46, copper, c.x, 0.065, c.z, `saeulen_fuss_${i + 1}`);
    foot.rotation.z = c.tilt;
  });

  // ------------------------------------------------------------------ Decke
  addBox(mainW + 2 * T, 0.3, mainD + T, ceilMat, 0, H + 0.15, mainCz + T / 2, 'decke_labor');
  addBox(vestW + 2 * T, 0.3, vestD + T, ceilMat, 0, H + 0.15, vestCz - T / 2, 'decke_schleuse');

  // Abgehängte Kassetten und Lichtfelder im Hauptlabor
  const deckeFelder = [];
  const deckeLicht = [];
  for (const z of [0.0, 3.4]) for (const x of [-2.2, 2.2]) {
    deckeFelder.push([x, H - 0.07, z, 0]);
    deckeLicht.push([x, H - 0.13, z, 0]);
  }
  addInst(new THREE.BoxGeometry(2.7, 0.09, 1.5), wallDark, deckeFelder, 'decke_kassetten');
  addInst(new THREE.BoxGeometry(2.35, 0.05, 1.15), glowMat, deckeLicht, 'decke_lichtfelder');

  // Sechseckiges Lichtfeld über der Bodenintarsie
  const hexLamp = addMesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 6), glowMat, 0, H - 0.10, mainCz, 'decke_lichtfeld_sechseck');
  hexLamp.rotation.y = Math.PI / 6;
  addMesh(new THREE.CylinderGeometry(0.78, 0.78, 0.10, 6), copper, 0, H - 0.04, mainCz, 'decke_lichtfeld_rahmen').rotation.y = Math.PI / 6;

  // Lichtbänder entlang der Deckenkanten
  for (const s of [-1, 1]) {
    addBox(0.08, 0.06, mainD - 0.2, glowMat, s * (MAIN.x1 - 0.32), H - 0.07, mainCz, 'decke_lichtband');
  }
  addBox(mainW - 0.4, 0.06, 0.08, glowMat, 0, H - 0.07, MAIN.z1 - 0.28, 'decke_lichtband');

  // Schleuse: bernsteinfarbene Lichtfelder und Warnstreifen an der Decke
  const vestLicht = [];
  for (const z of [-3.0, -4.5]) vestLicht.push([0, H - 0.11, z, 0]);
  addInst(new THREE.BoxGeometry(3.4, 0.07, 0.55), amberGlow, vestLicht, 'decke_lichtfelder_schleuse');
  addBox(vestW - 0.4, 0.06, 0.08, amberGlow, 0, H - 0.07, VEST.z0 + 0.25, 'decke_warnband_schleuse');

  // ------------------------------------------------------------------ Schleusen-Einbauten
  // Dämpfungsanzeigen (flach eingelassen) an den Schleusenseitenwänden
  for (const s of [-1, 1]) {
    addBox(0.05, 0.52, 1.15, shieldGlow, s * (VEST.x1 - 0.025), 1.72, -3.95, 'em_daempfungsanzeige');
    addBox(0.07, 0.66, 1.30, copper, s * (VEST.x1 - 0.035), 1.72, -3.95, 'em_daempfungsanzeige_rahmen');
    addBox(0.06, 0.16, 1.15, warnGlow, s * (VEST.x1 - 0.03), 2.22, -3.95, 'schleuse_warnanzeige');
  }
  // Feste Haltegriffe in der Schleuse
  for (const s of [-1, 1]) {
    addBox(0.08, 0.08, 2.0, railMat, s * (VEST.x1 - 0.06), 0.95, -3.55, 'schleuse_greifleiste');
    addBox(0.10, 0.06, 0.10, copper, s * (VEST.x1 - 0.06), 0.95, -2.72, 'schleuse_greifhalter');
    addBox(0.10, 0.06, 0.10, copper, s * (VEST.x1 - 0.06), 0.95, -4.38, 'schleuse_greifhalter');
  }
  // Flache Statusleiste über der Trennwand im Hauptlabor
  addBox(1.6, 0.14, 0.05, shieldGlow, 0, 3.07, MAIN.z0 + 0.03, 'em_daempfungsanzeige');
  addBox(1.8, 0.20, 0.07, copper, 0, 3.07, MAIN.z0 + 0.045, 'em_daempfungsanzeige_rahmen');

  // ------------------------------------------------------------------ Anschlüsse, Platzpunkte
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Türanschlüsse (Markierung zeigt nach außen)
  empty('DOOR_aussen', 0, 0, OUT_Z, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-015 Vorraum / Gang (außen)' });
  empty('DOOR_schleuse', 0, 0, PART_Z, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-015 Schleusenvorraum (innen)' });
  // Fertige Antiker-Schiebetüren, Vorderseite (+Z) in den Raum
  empty('PLACE_OBJ-091', 0, 0, OUT_Z, 0);
  empty('PLACE_OBJ-091_2', 0, 0, PART_Z, 0);

  // Objektplätze (Fußpunkt auf dem Boden, Vorderseite zeigt in den Raum)
  empty('PLACE_OBJ-021', -2.35, 0, MAIN.z1 - 1.06 - 0.07, Math.PI);          // Naniten-Erzeugungsmaschine, Rückwand
  empty('PLACE_OBJ-072', 0.55, 0, MAIN.z1 - 0.53 - 0.07, Math.PI);           // Kryotank 1, Rückwand
  empty('PLACE_OBJ-072_2', MAIN.x1 - 0.53 - 0.07, 0, 1.20, -Math.PI / 2);     // Kryotank 2, rechte Wand
  empty('PLACE_OBJ-087', MAIN.x0 + 0.19 + 0.06, 0, -0.55, Math.PI / 2);       // Mikrotom 1, links (Tischgerät bodennah)
  empty('PLACE_OBJ-087_2', 2.45, 0, -1.55, 0);                               // Mikrotom 2, Mitte (Tischgerät bodennah)

  // Türpaneele (OBJ-052) neben den Öffnungen, 1,2 m Höhe
  empty('PLACE_OBJ-052', 1.48, 1.2, VEST.z0 + 0.02, 0);
  empty('PLACE_OBJ-052_2', 1.48, 1.2, MAIN.z0 + 0.02, 0);
  empty('PLACE_OBJ-052_3', -1.48, 1.2, VEST.z1 - 0.02, Math.PI);

  // Wandleuchten (OBJ-053), 2,2 m Höhe
  const lampPlaces = [
    [MAIN.x0 + 0.02, 2.2, 0.40, Math.PI / 2], [MAIN.x0 + 0.02, 2.2, 3.40, Math.PI / 2],
    [MAIN.x1 - 0.02, 2.2, 0.40, -Math.PI / 2], [MAIN.x1 - 0.02, 2.2, 3.40, -Math.PI / 2],
    [VEST.x0 + 0.02, 2.2, -3.75, Math.PI / 2], [VEST.x1 - 0.02, 2.2, -3.75, -Math.PI / 2],
  ];
  lampPlaces.forEach((p, i) => empty(i === 0 ? 'PLACE_OBJ-053' : `PLACE_OBJ-053_${i + 1}`, p[0], p[1], p[2], p[3]));

  // Lichtpunkte
  const lampPts = [
    [-2.2, 2.95, 0.0, 9, 8, '#9fd8ff'],
    [2.2, 2.95, 0.0, 9, 8, '#9fd8ff'],
    [-2.2, 2.95, 3.4, 9, 8, '#9fd8ff'],
    [2.2, 2.95, 3.4, 9, 8, '#9fd8ff'],
    [0, 2.95, -3.0, 6, 5, '#ffd8a0'],
    [0, 2.95, -4.5, 6, 5, '#ffd8a0'],
  ];
  lampPts.forEach((p, i) => empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: p[5], intensity: p[3], distance: p[4] }));

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };
  col('COL_boden_labor', mainW, 0.2, mainD, 0, -0.1, mainCz);
  col('COL_boden_schleuse', vestW, 0.2, vestD, 0, -0.1, vestCz);
  col('COL_decke_labor', mainW + 2 * T, 0.3, mainD + T, 0, H + 0.15, mainCz + T / 2);
  col('COL_decke_schleuse', vestW + 2 * T, 0.3, vestD + T, 0, H + 0.15, vestCz - T / 2);

  col('COL_wand_rueck', mainW + 2 * T, H, T, 0, H / 2, MAIN.z1 + T / 2);
  col('COL_wand_links', T, H, mainD, MAIN.x0 - T / 2, H / 2, mainCz);
  col('COL_wand_rechts', T, H, mainD, MAIN.x1 + T / 2, H / 2, mainCz);

  col('COL_wand_trenn_links', partHalf, H, T, -(DOOR_W / 2 + partHalf / 2), H / 2, PART_Z);
  col('COL_wand_trenn_rechts', partHalf, H, T, (DOOR_W / 2 + partHalf / 2), H / 2, PART_Z);
  col('COL_wand_trenn_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, PART_Z);

  col('COL_wand_schleuse_links', T, H, vestD, VEST.x0 - T / 2, H / 2, vestCz);
  col('COL_wand_schleuse_rechts', T, H, vestD, VEST.x1 + T / 2, H / 2, vestCz);
  col('COL_wand_aussen_links', outHalf, H, T, -(DOOR_W / 2 + outHalf / 2), H / 2, OUT_Z);
  col('COL_wand_aussen_rechts', outHalf, H, T, (DOOR_W / 2 + outHalf / 2), H / 2, OUT_Z);
  col('COL_wand_aussen_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, OUT_Z);

  colDefs.forEach((c, i) => col(`COL_saeule_${i + 1}`, 0.46, H, 0.46, c.x, H / 2, c.z));

  // ------------------------------------------------------------------ Animation, API, Aktionen
  let emTarget = 0.42;
  let shieldTarget = 0.9;
  let lichtFaktor = 1;
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = (1.55 + Math.sin(t * 0.9) * 0.14) * lichtFaktor;
    shieldGlow.emissiveIntensity = shieldTarget + Math.sin(t * 0.55 + 1.2) * 0.16;
    warnGlow.emissiveIntensity = (1.05 + Math.sin(t * 1.1) * 0.25) * lichtFaktor;
    emPanel.emissiveIntensity = emTarget + Math.sin(t * 0.4) * 0.06;
  };

  const setDaempfung = (aktiv) => {
    emTarget = aktiv ? 0.9 : 0.42;
    shieldTarget = aktiv ? 1.6 : 0.9;
    return { emDaempfung: !!aktiv };
  };
  const setLicht = (v) => {
    lichtFaktor = THREE.MathUtils.clamp(Number(v) || 0, 0, 4);
    glowMat.emissiveIntensity = 1.0 * lichtFaktor;
    amberGlow.emissiveIntensity = 1.0 * lichtFaktor;
    return { lichtIntensitaet: lichtFaktor };
  };

  root.userData.raum = {
    id: 'ATL-015', typ: 'Speziallabor', hoehe: H, schleuse: true,
    laborFlaeche: 64.8, schleuseFlaeche: 11.5, gesamtFlaeche: 76.3,
  };
  root.userData.api = {
    setEMDaempfung: setDaempfung,
    setLichtIntensitaet: setLicht,
  };
  root.userData.actions = [
    { id: 'em_daempfung_hoch', label: 'EM-Dämpfung aktivieren', run: () => setDaempfung(true) },
    { id: 'em_daempfung_normal', label: 'EM-Dämpfung Normalbetrieb', run: () => setDaempfung(false) },
    { id: 'laborlicht_dimmen', label: 'Laborlicht dimmen', run: () => setLicht(0.35) },
    { id: 'laborlicht_voll', label: 'Laborlicht voll', run: () => setLicht(1) },
  ];

  return root;
}

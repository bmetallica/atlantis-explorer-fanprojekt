// Raum ATL-007: Büro von Colonel Steven Caldwell
// Kontrollturm, Etage 6, Staffel 3.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z. Leere Hülle: KEINE Möbel – nur feste Architektur
// (Boden, Wände, Fensterlamellen, Paneele, Säulen, Sichtblende, Decke) und leere
// PLACE_-Objektpunkte. Schreibtisch, Funkterminal und Tür werden später gesetzt.

import * as THREE from 'three';

export const steckbrief = {
  name: 'raum_steven_caldwell_office',
  art: 'Raum',
  masse: '7,20 m × 4,80 m Grundfläche (34,56 m²), 3,20 m lichte Höhe',
  wohin: 'Kontrollturm, Etage 6, Verwaltungsbereich von Colonel Steven Caldwell',
  benutzen: 'Dienstbüro; Arbeitsbereich mit Jalousien-Sichtfront zum Kontrollturm und gesichertem Daedalus-Subraumfunkterminal',
  lichter: '4 LAMP_ als indirekte Deckenleuchten (eisblau) sowie 2 warme Akzentlampen (bernstein)',
  animation: 'Wand- und Säulenlichtleisten pulsieren dezent; Lichtstärke über userData.api steuerbar',
  quelle: 'Rekonstruktion nach Auftrag ATL-007 und Referenzbild bilder/ref1.jpg; Atlantis-Kupferpalette, Mallozzi „Halls & Corridors“, Staffel 3',
};

const W = 7.2;
const D = 4.8;
const H = 3.2;
const T = 0.3;
const XI = W / 2;
const ZI = D / 2;
const DOOR_W = 2.4;
const DOOR_H = 3.0;

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_steven_caldwell_office';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });
  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');

  // Grün-kupferner Rand und zurückhaltende Fugen (kein „Stabkreuz“-Muster).
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina',
    color: 0x3f6b5c,
    metalness: 0.62,
    roughness: 0.42,
  });
  const matJoint = new THREE.MeshStandardMaterial({
    name: 'boden_fuge',
    color: 0x233a36,
    metalness: 0.35,
    roughness: 0.68,
  });
  const matLightStrip = new THREE.MeshStandardMaterial({
    name: 'lichtleiste',
    color: 0xdff4ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 1.7,
    metalness: 0.05,
    roughness: 0.35,
  });
  const matDaylight = new THREE.MeshStandardMaterial({
    name: 'fenster_tageslicht',
    color: 0x93bdd2,
    emissive: 0x6f9fb8,
    emissiveIntensity: 0.95,
    metalness: 0.0,
    roughness: 0.65,
  });

  const addMesh = (name, geometry, material, x, y, z, rotY = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    root.add(mesh);
    return mesh;
  };

  const box = (name, w, h, d, material, x, y, z, rotY = 0) =>
    addMesh(name, new THREE.BoxGeometry(w, h, d), material, x, y, z, rotY);

  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const object = new THREE.Object3D();
    object.name = name;
    object.position.set(x, y, z);
    object.rotation.y = rotY;
    if (userData) object.userData = userData;
    root.add(object);
    return object;
  };

  const collider = (name, w, h, d, x, y, z, rotY = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.visible = false;
    root.add(mesh);
    return mesh;
  };

  const dummy = new THREE.Object3D();
  const instanced = (name, geometry, material, placements) => {
    if (!placements || !placements.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
    placements.forEach((p, index) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      dummy.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // ------------------------------------------------------------------
  // Boden: durchgehende Platte, umlaufendes Grün-Kupfer-Band, feines
  // 1,2-m-Fugenraster und GENAU EINE zentrale Dreiecksintarsie.
  // Keine Möbel, keine losen Streifen im Raum.
  // ------------------------------------------------------------------
  box('boden', W, 0.1, D, matFloor, 0, -0.05, 0);

  // Umlaufendes Band (innenliegend), 2 cm über dem Boden.
  for (const s of [-1, 1]) {
    box(`boden_rand_${s < 0 ? 'links' : 'rechts'}`, 0.22, 0.012, D - 0.44, matPatina, s * (XI - 0.11), 0.006, 0);
    box(`boden_rand_${s < 0 ? 'vorne' : 'hinten'}`, W - 0.44, 0.012, 0.22, matPatina, 0, 0.006, s * (ZI - 0.11));
  }
  // Feine Kupfer-Kante innerhalb des Grünbands (sauberer Abschluss, kein Kreuzmuster).
  for (const s of [-1, 1]) {
    box(`boden_kante_${s < 0 ? 'links' : 'rechts'}`, 0.02, 0.008, D - 0.48, matCopper, s * (XI - 0.23), 0.004, 0);
    box(`boden_kante_${s < 0 ? 'vorne' : 'hinten'}`, W - 0.48, 0.008, 0.02, matCopper, 0, 0.004, s * (ZI - 0.23));
  }

  // 1,2-m-Fugenraster (schmal, dunkel, zurückhaltend).
  const jointsZ = [];
  const jointsX = [];
  for (const z of [-1.2, 0, 1.2]) jointsZ.push({ x: 0, y: 0.003, z });
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) jointsX.push({ x, y: 0.003, z: 0 });
  instanced('boden_fugen_quer', new THREE.BoxGeometry(W - 0.48, 0.005, 0.01), matJoint, jointsZ);
  instanced('boden_fugen_längs', new THREE.BoxGeometry(0.01, 0.005, D - 0.48), matJoint, jointsX);

  // Eine zentrale Intarsie aus gleichseitigen Dreiecken, frei von Objektplätzen.
  const inlayCenter = { x: -0.85, z: -1.0 };
  const triangleBars = (radius, material, name, y, reverse = false) => {
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      pts.push({ x: inlayCenter.x + Math.cos(a) * radius, z: inlayCenter.z + Math.sin(a) * radius });
    }
    const bars = [];
    for (let i = 0; i < 3; i++) {
      const a = reverse ? pts[(i + 1) % 3] : pts[i];
      const b = reverse ? pts[i] : pts[(i + 1) % 3];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      bars.push({
        x: (a.x + b.x) / 2,
        y,
        z: (a.z + b.z) / 2,
        ry: -Math.atan2(dz, dx),
        sx: len,
      });
    }
    instanced(name, new THREE.BoxGeometry(1, 0.01, 0.045), material, bars);
  };
  triangleBars(0.7, matCopper, 'boden_intarsie_dreieck', 0.007, false);
  triangleBars(0.28, matPatina, 'boden_intarsie_innen', 0.008, true);

  // ------------------------------------------------------------------
  // Wände: linke Massivwand, Rück- und Seitenwand als Lamellen-Sichtfront
  // ------------------------------------------------------------------
  box('wand_links', T, H, D, matWall, -(XI + T / 2), H / 2, 0);

  // Rückwand (+Z): Fensterband mit horizontalen Lamellen.
  box('wand_hinten_sockel', W, 0.55, T, matWall, 0, 0.275, ZI + T / 2);
  box('wand_hinten_band', W, H - 2.85, T, matWall, 0, 2.85 + (H - 2.85) / 2, ZI + T / 2);
  box('wand_hinten_pfeiler_links', 0.8, 2.3, T, matWall, -3.2, 1.7, ZI + T / 2);
  box('wand_hinten_pfeiler_rechts', 0.8, 2.3, T, matWall, 3.2, 1.7, ZI + T / 2);
  box('fenster_hinten_glas', 5.6, 2.3, 0.04, matGlass, 0, 1.7, ZI + T / 2);
  box('fenster_hinten_tageslicht', 5.56, 2.26, 0.02, matDaylight, 0, 1.7, ZI + T / 2 + 0.06);

  const louversHinten = [];
  for (let i = 0; i < 16; i++) {
    louversHinten.push({ x: 0, y: 0.64 + i * 0.135, z: ZI + 0.12, rx: 0.3 });
  }
  instanced('fenster_lamellen_hinten', new THREE.BoxGeometry(5.55, 0.05, 0.16), matWallDark, louversHinten);
  for (const x of [-0.93, 0.93]) {
    box(`fenster_hinten_mullion_${x < 0 ? 'l' : 'r'}`, 0.09, 2.3, 0.2, matCopper, x, 1.7, ZI + 0.1);
  }
  box('fenster_hinten_rahmen_unten', 5.6, 0.08, 0.16, matCopper, 0, 0.59, ZI + 0.1);
  box('fenster_hinten_rahmen_oben', 5.6, 0.08, 0.16, matCopper, 0, 2.81, ZI + 0.1);

  // Rechte Wand (+X): zweite Lamellen-Sichtfront zum Kontrollturm.
  box('wand_rechts_sockel', T, 0.55, D, matWall, XI + T / 2, 0.275, 0);
  box('wand_rechts_band', T, H - 2.85, D, matWall, XI + T / 2, 2.85 + (H - 2.85) / 2, 0);
  box('wand_rechts_pfeiler_vorne', T, 2.3, 0.5, matWall, XI + T / 2, 1.7, -2.15);
  box('wand_rechts_pfeiler_hinten', T, 2.3, 0.5, matWall, XI + T / 2, 1.7, 2.15);
  box('fenster_rechts_glas', 0.04, 2.3, 3.8, matGlass, XI + T / 2, 1.7, 0);
  box('fenster_rechts_tageslicht', 0.02, 2.26, 3.76, matDaylight, XI + T / 2 + 0.06, 1.7, 0);

  const louversRechts = [];
  for (let i = 0; i < 16; i++) {
    louversRechts.push({ x: XI - 0.12, y: 0.64 + i * 0.135, z: 0, rz: 0.3 });
  }
  instanced('fenster_lamellen_rechts', new THREE.BoxGeometry(0.16, 0.05, 3.75), matWallDark, louversRechts);
  for (const z of [-0.63, 0.63]) {
    box(`fenster_rechts_mullion_${z < 0 ? 'v' : 'h'}`, 0.2, 2.3, 0.09, matCopper, XI - 0.1, 1.7, z);
  }
  box('fenster_rechts_rahmen_unten', 0.16, 0.08, 3.8, matCopper, XI - 0.1, 0.59, 0);
  box('fenster_rechts_rahmen_oben', 0.16, 0.08, 3.8, matCopper, XI - 0.1, 2.81, 0);

  // Haupteingang an -Z: Öffnung 2,4 × 3,0 m, mittig; je 1,2 m Schieberwand daneben.
  box('wand_vorne_links', 2.4, H, T, matWall, -2.4, H / 2, -(ZI + T / 2));
  box('wand_vorne_rechts', 2.4, H, T, matWall, 2.4, H / 2, -(ZI + T / 2));
  box('wand_vorne_sturz', DOOR_W, H - DOOR_H, T, matWall, 0, DOOR_H + (H - DOOR_H) / 2, -(ZI + T / 2));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(`ecke_${sx < 0 ? 'l' : 'r'}_${sz < 0 ? 'v' : 'h'}`, T, H, T, matWall, sx * (XI + T / 2), H / 2, sz * (ZI + T / 2));
    }
  }

  // Bronzeleisten an der Öffnungskante (nicht in den Durchgang hinein).
  for (const s of [-1, 1]) {
    box(`tuer_kante_${s < 0 ? 'links' : 'rechts'}`, 0.04, DOOR_H, 0.06, matCopper, s * 1.22, DOOR_H / 2, -ZI + 0.02);
  }
  box('tuer_kante_oben', DOOR_W + 0.08, 0.04, 0.06, matCopper, 0, DOOR_H + 0.02, -ZI + 0.02);

  // ------------------------------------------------------------------
  // Wandpaneele, Sockelleisten, Gesimse
  // ------------------------------------------------------------------
  const framesSide = [];
  const panelsSide = [];
  const framesFront = [];
  const panelsFront = [];
  const lightSlots = [];

  for (const z of [-1.8, -0.6, 0.6, 1.8]) {
    framesSide.push({ x: -XI + 0.025, y: 1.35, z });
    panelsSide.push({ x: -XI + 0.055, y: 1.35, z });
  }
  for (const z of [-1.2, 0, 1.2]) {
    lightSlots.push({ x: -XI + 0.03, y: 1.35, z });
  }
  for (const x of [-2.4, 2.4]) {
    framesFront.push({ x, y: 1.35, z: -ZI + 0.025 });
    panelsFront.push({ x, y: 1.35, z: -ZI + 0.055 });
  }

  instanced('paneel_rahmen_seitenwand', new THREE.BoxGeometry(0.05, 2.45, 1.02), matCopper, framesSide);
  instanced('paneele_seitenwand', new THREE.BoxGeometry(0.035, 2.2, 0.88), matWallDark, panelsSide);
  instanced('paneel_rahmen_vorderwand', new THREE.BoxGeometry(1.02, 2.45, 0.05), matCopper, framesFront);
  instanced('paneele_vorderwand', new THREE.BoxGeometry(0.88, 2.2, 0.035), matWallDark, panelsFront);
  const slotMesh = instanced('wand_lichtschlitze', new THREE.BoxGeometry(0.02, 2.2, 0.055), matLightStrip, lightSlots);

  box('sockel_links', 0.05, 0.15, D, matCopper, -XI + 0.025, 0.075, 0);
  box('sockel_vorne_links', 2.4, 0.15, 0.05, matCopper, -2.4, 0.075, -ZI + 0.025);
  box('sockel_vorne_rechts', 2.4, 0.15, 0.05, matCopper, 2.4, 0.075, -ZI + 0.025);
  box('sockel_hinten', W, 0.15, 0.05, matCopper, 0, 0.075, ZI - 0.025);
  box('sockel_rechts', 0.05, 0.15, D, matCopper, XI - 0.025, 0.075, 0);

  box('gesims_links', 0.07, 0.1, D, matCopper, -XI + 0.035, H - 0.05, 0);
  box('gesims_vorne_links', 2.4, 0.1, 0.07, matCopper, -2.4, H - 0.05, -ZI + 0.035);
  box('gesims_vorne_rechts', 2.4, 0.1, 0.07, matCopper, 2.4, H - 0.05, -ZI + 0.035);
  box('gesims_hinten', W, 0.1, 0.07, matCopper, 0, H - 0.05, ZI - 0.035);
  box('gesims_rechts', 0.07, 0.1, D, matCopper, XI - 0.035, H - 0.05, 0);

  // ------------------------------------------------------------------
  // Antike Säulenabschlüsse (leicht geneigt) – reine Architektur.
  // ------------------------------------------------------------------
  const columnPositions = [
    { x: -3.22, z: -2.02, tilt: 0.055 },
    { x: 3.22, z: -2.02, tilt: -0.055 },
    { x: -3.22, z: 2.02, tilt: 0.055 },
    { x: 3.22, z: 2.02, tilt: -0.055 },
  ];
  instanced(
    'saeulen_schafte',
    new THREE.BoxGeometry(0.26, 2.62, 0.26),
    matPillar,
    columnPositions.map((p) => ({ x: p.x, y: 1.41, z: p.z, rz: p.tilt })),
  );
  instanced(
    'saeulen_abschluesse',
    new THREE.BoxGeometry(0.44, 0.22, 0.44),
    matCopper,
    columnPositions.map((p) => ({ x: p.x + (p.tilt || 0) * 0.05, y: 2.88, z: p.z, rz: p.tilt })),
  );
  instanced(
    'saeulen_basis',
    new THREE.BoxGeometry(0.42, 0.14, 0.42),
    matCopper,
    columnPositions.map((p) => ({ x: p.x, y: 0.07, z: p.z })),
  );
  instanced(
    'saeulen_halsring',
    new THREE.BoxGeometry(0.32, 0.07, 0.32),
    matCopper,
    columnPositions.map((p) => ({ x: p.x, y: 2.7, z: p.z, rz: p.tilt })),
  );

  const columnSlots = [];
  for (const p of columnPositions) {
    const inward = p.x < 0 ? 1 : -1;
    columnSlots.push({ x: p.x + inward * 0.14, y: 1.45, z: p.z });
  }
  instanced('saeulen_lichtschlitze', new THREE.BoxGeometry(0.02, 1.7, 0.045), matLightStrip, columnSlots);

  // ------------------------------------------------------------------
  // Einfache Sichtblende (fest eingebaute Architektur, kein Möbel),
  // parallel zur rechten Wand, lässt ≥ 1,2 m Laufweg zum Schreibtisch.
  // ------------------------------------------------------------------
  const BLEND_X = 3.2;
  const BLEND_Z = -0.6;
  const BLEND_L = 1.8;
  box('sichtblende_feld', 0.08, 1.4, BLEND_L, matWallDark, BLEND_X, 0.95, BLEND_Z);
  box('sichtblende_glas', 0.03, 0.55, BLEND_L - 0.2, matGlass, BLEND_X - 0.06, 1.55, BLEND_Z);
  box('sichtblende_unterer_rahmen', 0.16, 0.12, BLEND_L + 0.16, matCopper, BLEND_X, 0.19, BLEND_Z);
  box('sichtblende_oberer_rahmen', 0.16, 0.12, BLEND_L + 0.16, matCopper, BLEND_X, 1.87, BLEND_Z);
  box('sichtblende_mittelholm', 0.14, 0.08, BLEND_L, matCopper, BLEND_X - 0.01, 1.24, BLEND_Z);
  box('sichtblende_pfosten_vorne', 0.16, 1.8, 0.12, matCopper, BLEND_X, 0.9, BLEND_Z - BLEND_L / 2 + 0.06);
  box('sichtblende_pfosten_hinten', 0.16, 1.8, 0.12, matCopper, BLEND_X, 0.9, BLEND_Z + BLEND_L / 2 - 0.06);

  // ------------------------------------------------------------------
  // Decke
  // ------------------------------------------------------------------
  box('decke_haupt', W + T * 2, 0.3, D + T * 2, matCeiling, 0, H + 0.15, 0);

  for (const z of [-1.8, 0, 1.8]) {
    box(`decke_rippe_${z < 0 ? 'v' : z > 0 ? 'h' : 'm'}`, W - 0.2, 0.07, 0.07, matCopper, 0, H - 0.035, z);
  }

  const ceilingPanels = [];
  for (const x of [-2.4, 0, 2.4]) {
    for (const z of [-0.9, 0.9]) {
      ceilingPanels.push({ x, y: H - 0.015, z });
    }
  }
  instanced('decke_kassetten', new THREE.BoxGeometry(1.9, 0.03, 1.35), matWallDark, ceilingPanels);

  for (const x of [-1.8, 1.8]) {
    for (const z of [-1.2, 1.2]) {
      const tag = `${x < 0 ? 'links' : 'rechts'}_${z < 0 ? 'vorne' : 'hinten'}`;
      box(`decke_lichtfeld_${tag}_rahmen`, 2.5, 0.05, 1.1, matCopper, x, H - 0.025, z);
      box(`decke_lichtfeld_${tag}`, 2.36, 0.04, 0.96, matGlow, x, H - 0.03, z);
    }
  }

  // Eingebaute Wandleuchten (Bernstein) neben den Fensterfronten.
  for (const x of [-3.05, 3.05]) {
    box(`wandleuchte_bernstein_${x < 0 ? 'l' : 'r'}`, 0.18, 0.34, 0.08, matAmber, x, 2.15, ZI - 0.04);
  }
  for (const x of [-2.95, 2.95]) {
    box(`wandleuchte_bernstein_vorne_${x < 0 ? 'l' : 'r'}`, 0.18, 0.34, 0.08, matAmber, x, 2.15, -ZI + 0.04);
  }

  // ------------------------------------------------------------------
  // Anschlüsse und Objektplätze (Raum bleibt leer – nur Platzhalter).
  // ------------------------------------------------------------------
  empty('DOOR_haupt', 0, 0, -(ZI + T / 2), Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Kontrollturm-Korridor, Etage 6',
  });

  // Antiker Schiebetürflügel (3,34 × 3,74 m Zarge): Ursprung in der Wandmitte,
  // +Z zeigt in den Raum.
  empty('PLACE_OBJ-091', 0, 0, -(ZI + T / 2), 0);

  // Schreibtisch der Expeditionsleitung (1,82 B × 1,35 H × 2,55 T):
  // vor der Jalousien-Fensterwand (+Z), Vorderseite (+Z) zur Tür bzw. in den Raum.
  empty('PLACE_OBJ-013', 1.0, 0, 1.0, Math.PI);

  // Daedalus-Subraumfunkterminal (2,90 B × 2,45 H × 1,89 T):
  // Rückseite an der linken Wand, Vorderseite (+X) in den Raum gerichtet.
  empty('PLACE_OBJ-090', -2.65, 0, 0.3, Math.PI / 2);

  // ------------------------------------------------------------------
  // Licht
  // ------------------------------------------------------------------
  const lamps = [];
  const addLamp = (name, x, y, z, color, intensity, distance) => {
    const light = new THREE.PointLight(color, intensity, distance);
    light.name = name;
    light.position.set(x, y, z);
    light.userData = { color, intensity, distance };
    root.add(light);
    lamps.push(light);
    return light;
  };

  addLamp('LAMP_1', -1.8, H - 0.3, -1.2, '#9fd8ff', 8, 7);
  addLamp('LAMP_2', 1.8, H - 0.3, -1.2, '#9fd8ff', 8, 7);
  addLamp('LAMP_3', -1.8, H - 0.3, 1.2, '#9fd8ff', 8, 7);
  addLamp('LAMP_4', 1.8, H - 0.3, 1.2, '#9fd8ff', 8, 7);
  addLamp('LAMP_5', -3.0, 2.25, 2.15, '#ffd8a0', 5, 5);
  addLamp('LAMP_6', 3.0, 2.25, -2.15, '#ffd8a0', 5, 5);

  // ------------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------------
  collider('COL_boden', W + T * 2, 0.2, D + T * 2, 0, -0.1, 0);
  collider('COL_decke', W + T * 2, 0.3, D + T * 2, 0, H + 0.15, 0);

  collider('COL_wand_links', T, H, D, -(XI + T / 2), H / 2, 0);
  collider('COL_wand_hinten_sockel', W, 0.55, T, 0, 0.275, ZI + T / 2);
  collider('COL_wand_hinten_band', W, H - 2.85, T, 0, 2.85 + (H - 2.85) / 2, ZI + T / 2);
  collider('COL_wand_hinten_pfeiler_l', 0.8, 2.3, T, -3.2, 1.7, ZI + T / 2);
  collider('COL_wand_hinten_pfeiler_r', 0.8, 2.3, T, 3.2, 1.7, ZI + T / 2);
  collider('COL_fenster_hinten', 5.6, 2.3, 0.12, 0, 1.7, ZI + T / 2);

  collider('COL_wand_rechts_sockel', T, 0.55, D, XI + T / 2, 0.275, 0);
  collider('COL_wand_rechts_band', T, H - 2.85, D, XI + T / 2, 2.85 + (H - 2.85) / 2, 0);
  collider('COL_wand_rechts_pfeiler_v', T, 2.3, 0.5, XI + T / 2, 1.7, -2.15);
  collider('COL_wand_rechts_pfeiler_h', T, 2.3, 0.5, XI + T / 2, 1.7, 2.15);
  collider('COL_fenster_rechts', 0.12, 2.3, 3.8, XI + T / 2, 1.7, 0);

  // Kein Collider in der Türöffnung.
  collider('COL_wand_vorne_links', 2.4, H, T, -2.4, H / 2, -(ZI + T / 2));
  collider('COL_wand_vorne_rechts', 2.4, H, T, 2.4, H / 2, -(ZI + T / 2));
  collider('COL_wand_vorne_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, -(ZI + T / 2));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      collider(
        `COL_ecke_${sx < 0 ? 'l' : 'r'}_${sz < 0 ? 'v' : 'h'}`,
        T,
        H,
        T,
        sx * (XI + T / 2),
        H / 2,
        sz * (ZI + T / 2),
      );
    }
  }

  for (const p of columnPositions) {
    collider(
      `COL_saeule_${p.x < 0 ? 'l' : 'r'}_${p.z < 0 ? 'v' : 'h'}`,
      0.42,
      H,
      0.42,
      p.x,
      H / 2,
      p.z,
    );
  }

  collider('COL_sichtblende', 0.2, 1.9, BLEND_L + 0.16, BLEND_X, 0.95, BLEND_Z);

  // ------------------------------------------------------------------
  // API, Actions und dezente Lichtanimation
  // ------------------------------------------------------------------
  let pulseEnabled = true;
  let elapsed = 0;
  let lastTime = null;
  let lampScale = 1;

  const api = {
    setLampIntensity(scale) {
      lampScale = Math.max(0, Math.min(2, Number(scale) || 0));
      for (const lamp of lamps) {
        lamp.intensity = lamp.userData.intensity * lampScale;
      }
      return lampScale;
    },
    getLampIntensity() {
      return lampScale;
    },
    setPulse(enabled) {
      pulseEnabled = Boolean(enabled);
      return pulseEnabled;
    },
    togglePulse() {
      pulseEnabled = !pulseEnabled;
      return pulseEnabled;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'INT_ATL007_PULS',
      label: 'Lichtleisten pulsieren',
      run: () => api.togglePulse(),
    },
  ];

  if (slotMesh) {
    slotMesh.onBeforeRender = () => {
      const now = performance.now() / 1000;
      if (lastTime !== null) elapsed += Math.min(now - lastTime, 0.1);
      lastTime = now;
      matLightStrip.emissiveIntensity = pulseEnabled
        ? 1.65 + Math.sin(elapsed * 0.75) * 0.16
        : 1.65;
    };
  }

  root.userData.raum = {
    id: 'ATL-007',
    name: 'Büro von Steven Caldwell',
    etage: 6,
    bereich: 'Control Tower',
    breite: W,
    tiefe: D,
    hoehe: H,
    flaeche: W * D,
  };

  return root;
}

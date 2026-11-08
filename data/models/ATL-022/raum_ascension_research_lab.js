// Raum ATL-022: Aufstiegs-Forschungslabor (East Pier, Etage 3).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Innenmaß 8,4 m (X) × 7,2 m (Z), lichte Höhe 3,4 m (ca. 60,5 m²).
// Leere Raumhülle: nur Architektur. Die antike Aufstiegsmaschine wird über
// PLACE_OBJ-026 eingesetzt (Maschinenpodest als eingebaute Architektur).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_ascension_research_lab',
  art: 'Raum',
  masse: '8,4 m × 7,2 m Grundfläche (ca. 60,5 m²), 3,4 m lichte Deckenhöhe',
  wohin: 'East Pier, Etage 3, direkt an das Aufstiegslabor angrenzend',
  benutzen: 'Aufstiegsforschung und physiologische Überwachung; Diagnose- und Analyseraum',
  lichter: '6 LAMP_-Punkte (4 eisblau, 2 warm), Decken-Lichtfelder, Wandlichtschlitze und eine Amber-Sichtnische',
  animation: 'Wandlichtschlitze, Deckenfelder und Sichtnische pulsieren sehr dezent',
  quelle: 'Selbst gebaut nach Raumauftrag ATL-022 (Staffel 5), Atlantis-Setplänen „Halls & Corridors“ und Screencaps',
};

const W = 8.4;
const D = 7.2;
const H = 3.4;
const T = 0.3;
const DOOR_W = 2.4;
const DOOR_H = 3.0;

// Das Objektmodell der Aufstiegsmaschine reicht 0,42 m unter seinen eigenen
// Fußpunkt. Deshalb steht die Maschine auf einem fest eingebauten Podest
// (0,42 m hoch); der versunkene Sockel verschwindet darin, nichts schwebt.
const PODIUM_H = 0.42;
const MACHINE_POS = new THREE.Vector3(0, PODIUM_H, 0);

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_ascension_research_lab';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glass = kit('glass');
  const glow = kit('glow');
  const amberGlow = kit('amberGlow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina',
    color: 0x3f6b5c,
    metalness: 0.55,
    roughness: 0.42,
  });
  const jointMat = new THREE.MeshStandardMaterial({
    name: 'boden_fuge',
    color: 0x263f3b,
    metalness: 0.5,
    roughness: 0.65,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz',
    color: 0xe4f6ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 1.7,
    roughness: 0.35,
  });
  const amberMat = new THREE.MeshStandardMaterial({
    name: 'nische_bernstein',
    color: 0xffc07a,
    emissive: 0xff9a3c,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  const add = (geo, mat, x, y, z, name) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const collider = (name, w, h, d, x, y, z, rotY = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.visible = false;
    root.add(mesh);
    return mesh;
  };

  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const object = new THREE.Object3D();
    object.name = name;
    object.position.set(x, y, z);
    object.rotation.y = rotY;
    if (userData) object.userData = userData;
    root.add(object);
    return object;
  };

  const dummy = new THREE.Object3D();
  const instances = (geometry, material, list, name) => {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((item, index) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(0, item.rotY || 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------
  // Boden: Platte mit Oberkante exakt bei y = 0.
  // ---------------------------------------------------------------------
  box(W, 0.12, D, floorMat, 0, -0.06, 0, 'boden');

  // Umlaufender grün-kupferner Saum.
  box(W, 0.012, 0.16, patina, 0, 0.006, -D / 2 + 0.08, 'boden_saum_sued');
  box(W, 0.012, 0.16, patina, 0, 0.006, D / 2 - 0.08, 'boden_saum_nord');
  box(0.16, 0.012, D - 0.32, patina, -W / 2 + 0.08, 0.006, 0, 'boden_saum_west');
  box(0.16, 0.012, D - 0.32, patina, W / 2 - 0.08, 0.006, 0, 'boden_saum_ost');

  // Plattenraster 1,2 m (Fugen nur innerhalb der Raumhülle).
  const floorX = [];
  const floorZ = [];
  for (let x = -W / 2 + 1.2; x < W / 2 - 0.1; x += 1.2) floorX.push({ x, y: 0.004, z: 0 });
  for (let z = -D / 2 + 1.2; z < D / 2 - 0.1; z += 1.2) floorZ.push({ x: 0, y: 0.004, z });
  instances(new THREE.BoxGeometry(0.016, 0.008, D - 0.34), jointMat, floorX, 'boden_fugen_x');
  instances(new THREE.BoxGeometry(W - 0.34, 0.008, 0.016), jointMat, floorZ, 'boden_fugen_z');

  // Kupfer-Kreisintarsie um das Maschinenpodest (Kreis ist Bodenintarsie).
  const ringRadius = 2.86;
  const ringSegments = 24;
  const ringInstances = [];
  for (let i = 0; i < ringSegments; i++) {
    const a = (i / ringSegments) * Math.PI * 2;
    ringInstances.push({
      x: Math.cos(a) * ringRadius,
      y: 0.008,
      z: Math.sin(a) * ringRadius,
      rotY: -a,
    });
  }
  instances(new THREE.BoxGeometry((2 * Math.PI * ringRadius) / ringSegments + 0.03, 0.01, 0.06), copper, ringInstances, 'boden_intarsie_ring');

  // Schneeflocken-Motiv aus rechtwinkligen Ästen im freien Westbereich.
  const snowBranches = [
    [0.80, 0.045, -3.28, -2.35, 0.9],
    [0.045, 0.80, -3.68, -1.95, 0.9],
    [0.40, 0.035, -3.50, -2.17, 0.9],
    [0.40, 0.035, -3.06, -2.17, 0.9],
    [0.035, 0.40, -3.50, -2.17, 0.9],
    [0.035, 0.40, -3.06, -2.17, -0.9],
    [0.28, 0.035, -3.28, -2.02, 0.72],
    [0.28, 0.035, -3.28, -2.02, -0.72],
  ];
  snowBranches.forEach(([w, h, x, z, rotY], i) => {
    box(w, h, 0.014, copper, x, 0.009, z, `boden_schneeflocke_${i}`).rotation.y = rotY;
  });

  // ---------------------------------------------------------------------
  // Maschinenpodest: achteckig (keine Rundbögen), fest mit dem Boden verbunden.
  // ---------------------------------------------------------------------
  const octagonShape = (a, cut) => {
    const shape = new THREE.Shape();
    const pts = [
      [a, a - cut], [a - cut, a], [-(a - cut), a], [-a, a - cut],
      [-a, -(a - cut)], [-(a - cut), -a], [a - cut, -a], [a, -(a - cut)],
    ];
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
    shape.closePath();
    return shape;
  };

  const plinthGeo = new THREE.ExtrudeGeometry(octagonShape(2.40, 0.85), {
    depth: PODIUM_H,
    bevelEnabled: false,
    curveSegments: 1,
  });
  plinthGeo.rotateX(-Math.PI / 2);
  add(plinthGeo, wallDark, 0, 0, 0, 'maschinenpodest');

  const plinthTopGeo = new THREE.ExtrudeGeometry(octagonShape(2.46, 0.87), {
    depth: 0.06,
    bevelEnabled: false,
    curveSegments: 1,
  });
  plinthTopGeo.rotateX(-Math.PI / 2);
  add(plinthTopGeo, copper, 0, PODIUM_H - 0.06, 0, 'maschinenpodest_deckplatte');

  // ---------------------------------------------------------------------
  // Wände (Dicke 0,3 m), Außenlage an der lichten Innenfläche.
  // ---------------------------------------------------------------------
  const southZ = -D / 2 - T / 2;
  const northZ = D / 2 + T / 2;
  const westX = -W / 2 - T / 2;
  const eastX = W / 2 + T / 2;

  // Südwand: Haupteingang bei −Z.
  box(3.0, H, T, wall, -2.7, H / 2, southZ, 'wand_sued_links');
  box(3.0, H, T, wall, 2.7, H / 2, southZ, 'wand_sued_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, southZ, 'wand_sued_sturz');

  // Nordwand.
  box(W, H, T, wall, 0, H / 2, northZ, 'wand_nord');

  // Ostwand: Verbindung zum Aufstiegslabor.
  box(T, H, 2.4, wall, eastX, H / 2, -2.4, 'wand_ost_sued');
  box(T, H, 2.4, wall, eastX, H / 2, 2.4, 'wand_ost_nord');
  box(T, H - DOOR_H, DOOR_W, wall, eastX, DOOR_H + (H - DOOR_H) / 2, 0, 'wand_ost_sturz');

  // Westwand: große Fensterfront (eckig) zwischen z = −2,7 und z = +2,7.
  box(T, 1.0, D, wall, westX, 0.5, 0, 'wand_west_unterfenster');
  box(T, 0.3, D, wall, westX, 3.25, 0, 'wand_west_ueberfenster');
  box(T, H, 0.9, wall, westX, H / 2, -3.15, 'wand_west_sued');
  box(T, H, 0.9, wall, westX, H / 2, 3.15, 'wand_west_nord');

  // ---------------------------------------------------------------------
  // Fensterfront: Rahmen (Kupfer), Glasfläche, keine Rundbögen.
  // ---------------------------------------------------------------------
  box(0.07, 2.1, 5.4, glass, westX, 2.05, 0, 'fenster_glas');
  box(0.12, 0.12, 5.55, copper, westX + 0.06, 1.0, 0, 'fenster_rahmen_unten');
  box(0.12, 0.12, 5.55, copper, westX + 0.06, 3.1, 0, 'fenster_rahmen_oben');
  const mullions = [];
  for (const z of [-2.7, -1.35, 0, 1.35, 2.7]) mullions.push({ x: westX + 0.07, y: 2.05, z });
  instances(new THREE.BoxGeometry(0.13, 2.16, 0.11), copper, mullions, 'fenster_pfosten');
  box(0.16, 2.16, 0.12, copper, westX + 0.07, 2.05, -2.75, 'fenster_rahmen_sued');
  box(0.16, 2.16, 0.12, copper, westX + 0.07, 2.05, 2.75, 'fenster_rahmen_nord');

  // ---------------------------------------------------------------------
  // Sockelleisten, Gesimse, Türzargen.
  // ---------------------------------------------------------------------
  box(W, 0.15, 0.05, copper, 0, 0.075, D / 2 - 0.025, 'sockel_nord');
  box(3.0, 0.15, 0.05, copper, -2.7, 0.075, -D / 2 + 0.025, 'sockel_sued_links');
  box(3.0, 0.15, 0.05, copper, 2.7, 0.075, -D / 2 + 0.025, 'sockel_sued_rechts');
  box(0.05, 0.15, 2.4, copper, W / 2 - 0.025, 0.075, -2.4, 'sockel_ost_sued');
  box(0.05, 0.15, 2.4, copper, W / 2 - 0.025, 0.075, 2.4, 'sockel_ost_nord');
  box(0.05, 0.15, D, copper, -W / 2 + 0.025, 0.075, 0, 'sockel_west');

  box(W, 0.10, 0.06, copper, 0, 3.30, D / 2 - 0.03, 'gesims_nord');
  box(3.0, 0.10, 0.06, copper, -2.7, 3.30, -D / 2 + 0.03, 'gesims_sued_links');
  box(3.0, 0.10, 0.06, copper, 2.7, 3.30, -D / 2 + 0.03, 'gesims_sued_rechts');
  box(0.06, 0.10, 2.4, copper, W / 2 - 0.03, 3.30, -2.4, 'gesims_ost_sued');
  box(0.06, 0.10, 2.4, copper, W / 2 - 0.03, 3.30, 2.4, 'gesims_ost_nord');

  box(DOOR_W + 0.24, 0.14, 0.12, copper, 0, DOOR_H + 0.03, southZ, 'tuer_einfassung_sued_oben');
  for (const x of [-1.26, 1.26]) {
    box(0.12, DOOR_H, 0.12, copper, x, DOOR_H / 2, southZ, `tuer_einfassung_sued_${x}`);
  }
  box(0.12, DOOR_H + 0.14, 0.24, copper, eastX, DOOR_H / 2, -1.26, 'tuer_einfassung_ost_sued');
  box(0.12, DOOR_H + 0.14, 0.24, copper, eastX, DOOR_H / 2, 1.26, 'tuer_einfassung_ost_nord');
  box(0.12, 0.14, DOOR_W + 0.24, copper, eastX, DOOR_H + 0.03, 0, 'tuer_einfassung_ost_oben');

  // ---------------------------------------------------------------------
  // Wandpaneele, Bronzerahmen und senkrechte Lichtschlitze.
  // ---------------------------------------------------------------------
  const panels = [];
  const frames = [];
  const slots = [];

  const addWallPanel = (x, y, z, rotY) => {
    panels.push({ x, y, z, rotY });
    frames.push({ x, y, z, rotY });
  };
  const addWallSlots = (x, y, z, rotY, count = 4) => {
    for (let i = 0; i < count; i++) slots.push({ x, y: y + i * 0.42, z, rotY });
  };

  // Nordwand (Front nach −Z).
  for (let i = 0; i < 7; i++) {
    const x = -3.6 + i * 1.2;
    if (i % 2 === 0) addWallPanel(x, 1.62, D / 2 - 0.045, Math.PI);
    else if (i === 3) {
      // Amber-Sichtnische (eingebaute Architektur, kein Gerät).
      box(0.96, 1.24, 0.08, copper, x, 1.62, D / 2 - 0.05, 'wand_sichtnische_rahmen');
      box(0.78, 1.04, 0.05, amberMat, x, 1.62, D / 2 - 0.10, 'wand_sichtnische_feld');
      for (let k = 0; k < 3; k++) {
        box(0.56, 0.05, 0.03, copper, x, 1.30 + k * 0.30, D / 2 - 0.13, `wand_sichtnische_steg_${k}`);
      }
    } else addWallSlots(x, 1.08, D / 2 - 0.035, Math.PI);
  }

  // Südwand neben der Türöffnung (Front nach +Z).
  for (const x of [-3.6, -2.4, 2.4, 3.6]) addWallPanel(x, 1.62, -D / 2 + 0.045, 0);

  // Ostwand neben dem Durchgang (Front nach −X).
  for (const z of [-3.0, -1.8, 1.8, 3.0]) addWallPanel(W / 2 - 0.045, 1.62, z, -Math.PI / 2);

  // Westwand an den Fensterseiten (Front nach +X).
  addWallPanel(-W / 2 + 0.045, 1.62, -3.15, Math.PI / 2);
  addWallPanel(-W / 2 + 0.045, 1.62, 3.15, Math.PI / 2);

  instances(new THREE.BoxGeometry(0.045, 2.3, 1.0), wallDark, panels, 'wandpaneele');
  instances(new THREE.BoxGeometry(0.065, 2.42, 1.1), copper, frames, 'wandpaneel_rahmen');
  const slotMesh = instances(new THREE.BoxGeometry(0.035, 0.28, 0.055), lightMat, slots, 'wand_lichtschlitze');

  // ---------------------------------------------------------------------
  // Eckpfeiler (Perlgrau) mit 60°-Streben zur Decke.
  // ---------------------------------------------------------------------
  const columnData = [
    [-3.88, -3.25, 0.055],
    [3.88, -3.25, -0.055],
    [-3.88, 3.25, -0.055],
    [3.88, 3.25, 0.055],
  ];

  columnData.forEach(([x, z, tilt], i) => {
    const column = box(0.26, 3.08, 0.26, pillar, x, 1.54, z, `saeule_${i}`);
    column.rotation.z = tilt;
    box(0.38, 0.10, 0.38, copper, x, 0.05, z, `saeulen_sockel_${i}`);
    box(0.38, 0.10, 0.38, copper, x, 3.20, z, `saeulen_kopf_${i}`);

    // Strebe vom Pfeilerkopf zur Decke (60°-Anschluss, nichts schwebt).
    const brace = box(0.12, 0.95, 0.12, copper, x, 3.05, z, `saeulen_strebe_${i}`);
    brace.rotation.z = tilt * 3.2;
    brace.rotation.x = (z > 0 ? -1 : 1) * 0.28;
  });

  // ---------------------------------------------------------------------
  // Decke: eigenständige Meshes, Namen beginnen mit „decke“.
  // ---------------------------------------------------------------------
  box(W + T * 2, 0.3, D + T * 2, ceilingMat, 0, H + 0.15, 0, 'decke_hauptplatte');

  const ceilingFields = [
    [-2.05, -1.8, false],
    [2.05, -1.8, false],
    [-2.05, 1.8, false],
    [2.05, 1.8, true],
  ];
  ceilingFields.forEach(([x, z, warm], i) => {
    box(2.7, 0.06, 0.42, wallDark, x, H + 0.01, z, `decke_kassette_${i}`);
    box(2.45, 0.035, 0.24, warm ? amberGlow : glow, x, H - 0.025, z, `decke_lichtfeld_${i}`);
  });

  box(0.09, 0.05, D - 0.5, glow, -W / 2 + 0.42, H - 0.03, 0, 'decke_lichtband_west');
  box(0.09, 0.05, D - 0.5, glow, W / 2 - 0.42, H - 0.03, 0, 'decke_lichtband_ost');

  // Abgehängte Querträger (an der Decke befestigt).
  for (const z of [-2.4, 0, 2.4]) {
    box(W - 1.2, 0.16, 0.22, wallDark, 0, H - 0.08, z, `decke_traeger_${z}`);
  }

  // ---------------------------------------------------------------------
  // Anschlüsse, Türpunkte, Objektplatz.
  // ---------------------------------------------------------------------
  empty('DOOR_haupt', 0, 0, southZ, Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'East Pier, Flur',
    raum: 'ATL-023',
  });

  empty('DOOR_aufstiegslabor', eastX, 0, 0, Math.PI / 2, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Aufstiegslabor',
    raum: 'ATL-021',
  });

  // Antiker Schiebetür-Einsatz in jeder 2,4 × 3,0-m-Öffnung.
  empty('PLACE_OBJ-091', 0, 0, southZ, 0);
  empty('PLACE_OBJ-091_2', eastX, 0, 0, -Math.PI / 2);

  // Antike Aufstiegsmaschine: steht auf dem Podest, Vorderseite nach +Z.
  empty('PLACE_OBJ-026', MACHINE_POS.x, MACHINE_POS.y, MACHINE_POS.z, 0);

  // ---------------------------------------------------------------------
  // Lichtpunkte (2–8), ausschließlich als LAMP_-Object3D.
  // ---------------------------------------------------------------------
  empty('LAMP_haupt_sued', 0, 3.05, -2.45, 0, { color: '#9fd8ff', intensity: 8, distance: 7.5 });
  empty('LAMP_haupt_nord', 0, 3.05, 2.45, 0, { color: '#9fd8ff', intensity: 8, distance: 7.5 });
  empty('LAMP_haupt_west', -3.35, 3.05, 0, 0, { color: '#9fd8ff', intensity: 7, distance: 6.5 });
  empty('LAMP_haupt_ost', 3.35, 3.05, 0, 0, { color: '#ffd8a0', intensity: 7, distance: 6.5 });
  empty('LAMP_fenster_sued', -3.2, 2.35, -2.85, 0, { color: '#9fd8ff', intensity: 5, distance: 5.0 });
  empty('LAMP_fenster_nord', -3.2, 2.35, 2.85, 0, { color: '#9fd8ff', intensity: 5, distance: 5.0 });

  // ---------------------------------------------------------------------
  // Kollisionskörper: Boden, Wände (an Türen geteilt), Decke, Pfeiler, Podest.
  // ---------------------------------------------------------------------
  collider('COL_boden', W, 0.2, D, 0, -0.1, 0);
  collider('COL_decke', W + T * 2, 0.3, D + T * 2, 0, H + 0.15, 0);

  collider('COL_wand_sued_links', 3.0, H, T, -2.7, H / 2, southZ);
  collider('COL_wand_sued_rechts', 3.0, H, T, 2.7, H / 2, southZ);
  collider('COL_wand_sued_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, southZ);

  collider('COL_wand_nord', W, H, T, 0, H / 2, northZ);

  collider('COL_wand_ost_sued', T, H, 2.4, eastX, H / 2, -2.4);
  collider('COL_wand_ost_nord', T, H, 2.4, eastX, H / 2, 2.4);
  collider('COL_wand_ost_sturz', T, H - DOOR_H, DOOR_W, eastX, DOOR_H + (H - DOOR_H) / 2, 0);

  collider('COL_wand_west', T, H, D, westX, H / 2, 0);

  columnData.forEach(([x, z, tilt], i) => {
    const collision = collider(`COL_saeule_${i}`, 0.34, 3.12, 0.34, x, 1.56, z);
    collision.rotation.z = tilt;
  });

  collider('COL_maschinenpodest', 4.9, PODIUM_H, 4.9, 0, PODIUM_H / 2, 0);

  // ---------------------------------------------------------------------
  // Dezente Lichtanimation.
  // ---------------------------------------------------------------------
  let elapsed = 0;
  let previous = null;

  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (previous !== null) elapsed += Math.min(now - previous, 0.1);
    previous = now;
    lightMat.emissiveIntensity = 1.65 + Math.sin(elapsed * 0.7) * 0.12;
    amberMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 0.5 + 1.2) * 0.15;
  };

  root.userData.raum = {
    id: 'ATL-022',
    name: 'Aufstiegs-Forschungslabor',
    breite: W,
    tiefe: D,
    hoehe: H,
    etage: 3,
    bereich: 'East Pier',
    kategorie: 'science',
  };

  return root;
}

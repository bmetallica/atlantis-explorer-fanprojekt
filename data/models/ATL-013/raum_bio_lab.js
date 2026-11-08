// Raum ATL-013: Biolabor, East Pier, Etage 3.
// 1 Einheit = 1 m. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// L-förmiger Laborraum: Analysezone (Hauptteil) und angefaster Nassbereich,
// getrennt durch transparente Trennwände. Leere Hülle – keine Möbel, keine Geräte.
// Nur die im Auftrag genannten Objekte erhalten PLACE_-Punkte.
import * as THREE from 'three';

const H = 3.5;
const T = 0.3;
const FIELD = 1.2;

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_bio_lab',
  art: 'Raum',
  masse: 'L-förmiges Forschungslabor, ca. 109 m² Grundfläche, lichte Höhe 3,5 m',
  wohin: 'East Pier, Etage 3, wissenschaftlicher Bereich',
  benutzen: 'Biologische Proben untersuchen; Messgeräte werden an den PLACE_OBJ-Punkten eingesetzt',
  lichter: '7 LAMP-Punkte, eisblaues indirektes Licht, ergänzt um Deckenlichtfelder und Wandlichtschlitze',
  animation: 'Deckenleuchten und Wandlichtschlitze pulsieren sehr dezent',
  quelle: 'Rekonstruiert nach Raumauftrag ATL-013, Referenzbild ref1.jpg und Atlantis-Setplänen',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_bio_lab';

  const wallMat = kit('wall');
  const wallDarkMat = kit('wallDark');
  const copperMat = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const upperFloorMat = kit('floorUpper');
  const ceilingMat = kit('ceiling');
  const glassMat = kit('glass');
  const glowMat = kit('glow');

  const patinaMat = new THREE.MeshStandardMaterial({
    name: 'boden_patina',
    color: 0x3f6b5c,
    metalness: 0.55,
    roughness: 0.42,
  });
  const lineGlowMat = new THREE.MeshStandardMaterial({
    name: 'lichtleiste',
    color: 0xdff4ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 1.5,
    metalness: 0.05,
    roughness: 0.35,
  });
  const colMat = new THREE.MeshBasicMaterial({
    name: 'kollektion_unsichtbar',
    colorWrite: false,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });

  const dummy = new THREE.Object3D();

  const addMesh = (geometry, material, x, y, z, name) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  };
  const addBox = (w, h, d, material, x, y, z, name) =>
    addMesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, name);
  const addCollider = (w, h, d, x, y, z, name, rotationY = 0) => {
    const mesh = addBox(w, h, d, colMat, x, y, z, name);
    mesh.rotation.y = rotationY;
    return mesh;
  };
  const addEmpty = (name, x, y, z, rotationY = 0, userData = null) => {
    const object = new THREE.Object3D();
    object.name = name;
    object.position.set(x, y, z);
    object.rotation.y = rotationY;
    if (userData) object.userData = userData;
    root.add(object);
    return object;
  };

  // -------------------------------------------------------------- Grundriss
  // Analysezone: x -8.4 .. 3.6, z -3.9 .. 3.9
  // Nassbereich: x 3.6 .. 8.4, z -1.7 .. 1.7, mit 60°-Fase an der Ostspitze.
  const floorPoints = [
    [-8.4, -3.9],
    [3.6, -3.9],
    [3.6, -1.7],
    [7.7, -1.7],
    [8.4, -0.488],
    [8.4, 0.488],
    [7.7, 1.7],
    [3.6, 1.7],
    [3.6, 3.9],
    [-8.4, 3.9],
  ];
  const wetPoints = [
    [3.6, -1.7],
    [7.7, -1.7],
    [8.4, -0.488],
    [8.4, 0.488],
    [7.7, 1.7],
    [3.6, 1.7],
  ];

  // Flache, eckige Geometrie (keine Rundbögen).
  const shapeFlat = (points, y, material, name) => {
    const shape = new THREE.Shape();
    points.forEach(([x, z], index) => {
      if (index === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // Bodenoberkante exakt bei y = 0.
  shapeFlat(floorPoints, 0, floorMat, 'boden');
  shapeFlat(wetPoints, 0.004, upperFloorMat, 'boden_nassbereich');

  // -------------------------------------------------------------- Segmente
  // Normalenrichtung n = (-dz, dx) zeigt bei der gewählten Reihenfolge in den Raum.
  const segInfo = (a, b) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    return {
      dx,
      dz,
      len,
      nx: -dz / len,
      nz: dx / len,
      rot: -Math.atan2(dz, dx),
      cx: (a[0] + b[0]) / 2,
      cz: (a[1] + b[1]) / 2,
    };
  };

  const wallSegment = (a, b, name, material = wallMat, height = H, y0 = 0, collide = true) => {
    const s = segInfo(a, b);
    const mesh = addBox(s.len, height, T, material, s.cx, y0 + height / 2, s.cz, name);
    mesh.rotation.y = s.rot;
    if (collide) {
      addCollider(s.len, height, T, s.cx, y0 + height / 2, s.cz, `COL_${name}`, s.rot);
    }
    return mesh;
  };

  // Transparente Wand mit Bronzefassung, Sockelband und Sturz.
  const glassWall = (a, b, name, options = {}) => {
    const base = options.base ?? 0.18;
    const top = options.top ?? 3.2;
    const s = segInfo(a, b);

    const kick = addBox(s.len, base, T, wallDarkMat, s.cx, base / 2, s.cz, `${name}_sockel`);
    kick.rotation.y = s.rot;

    const pane = addBox(s.len - 0.18, top - base, 0.055, glassMat, s.cx, (base + top) / 2, s.cz, `${name}_glas`);
    pane.rotation.y = s.rot;

    const band = addBox(s.len, H - top, T, wallMat, s.cx, (H + top) / 2, s.cz, `${name}_sturz`);
    band.rotation.y = s.rot;

    const ux = s.dx / s.len;
    const uz = s.dz / s.len;
    for (const [px, pz] of [
      [a[0] + ux * 0.07, a[1] + uz * 0.07],
      [b[0] - ux * 0.07, b[1] - uz * 0.07],
    ]) {
      addBox(0.13, H, 0.13, copperMat, px, H / 2, pz, `${name}_pfeiler`);
    }
    for (const y of [base, top]) {
      const rail = addBox(s.len, 0.1, 0.12, copperMat, s.cx, y, s.cz, `${name}_leiste`);
      rail.rotation.y = s.rot;
    }
    addCollider(s.len, H, T, s.cx, H / 2, s.cz, `COL_${name}`, s.rot);
    return s;
  };

  // -------------------------------------------------------------- Wände
  // Haupteingang an der Seite -Z: Öffnung 2,4 x 3,0 m.
  wallSegment([-8.4, -3.9], [-3.6, -3.9], 'wand_sued_links');
  wallSegment([-1.2, -3.9], [3.6, -3.9], 'wand_sued_rechts');
  wallSegment([-3.6, -3.9], [-1.2, -3.9], 'wand_eingang_sturz', wallMat, H - 3, 3);

  // Rückwand mit breitem Fenster.
  wallSegment([-7.2, 3.9], [-8.4, 3.9], 'wand_nord_links');
  wallSegment([3.6, 3.9], [-3.6, 3.9], 'wand_nord_rechts');
  wallSegment([-7.2, 3.9], [-3.6, 3.9], 'wand_fenster_below', wallMat, 0.9, 0);
  wallSegment([-7.2, 3.9], [-3.6, 3.9], 'wand_fenster_sturz', wallMat, H - 3, 3);

  // Westwand.
  wallSegment([-8.4, 3.9], [-8.4, -3.9], 'wand_west');

  // Transparente Trennwände: Ostseite der Analysezone und Flanken des Nassbereichs.
  glassWall([3.6, -3.9], [3.6, -1.7], 'trennwand_ost_sued');
  glassWall([3.6, 1.7], [3.6, 3.9], 'trennwand_ost_nord');
  glassWall([3.6, -1.7], [3.6, -1.3], 'trennwand_hals_sued', { base: 0.18, top: 3.0 });
  glassWall([3.6, 1.3], [3.6, 1.7], 'trennwand_hals_nord', { base: 0.18, top: 3.0 });

  // Sturz über dem 2,5-m-Durchgang in den Nassbereich (Öffnung bleibt frei).
  wallSegment([3.6, -1.3], [3.6, 1.3], 'trennwand_durchgang_sturz', wallMat, H - 3, 3);

  // Glasumfassungung des Nassbereichs.
  glassWall([3.6, -1.7], [7.7, -1.7], 'nass_sued');
  glassWall([7.7, 1.7], [3.6, 1.7], 'nass_nord');
  glassWall([7.7, -1.7], [8.4, -0.488], 'nass_fase_sued');
  glassWall([8.4, 0.488], [7.7, 1.7], 'nass_fase_nord');
  glassWall([8.4, -0.488], [8.4, 0.488], 'nass_ost');

  // -------------------------------------------------------------- Wandpaneele
  const panelFrames = [];
  const panels = [];
  const lightSlots = [];

  const decorateWall = (a, b) => {
    const s = segInfo(a, b);
    const count = Math.max(1, Math.floor(s.len / FIELD));
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) * FIELD;
      const px = a[0] + s.dx * (along / s.len);
      const pz = a[1] + s.dz * (along / s.len);
      const fx = px + s.nx * (T / 2 + 0.028);
      const fz = pz + s.nz * (T / 2 + 0.028);
      if (i % 2 === 0) {
        panelFrames.push([fx, fz, s.rot]);
        panels.push([fx + s.nx * 0.04, fz + s.nz * 0.04, s.rot]);
      } else {
        for (let k = 0; k < 4; k++) {
          lightSlots.push([
            px + s.nx * (T / 2 + 0.012),
            pz + s.nz * (T / 2 + 0.012),
            1.05 + k * 0.48,
            s.rot,
          ]);
        }
      }
    }
  };

  decorateWall([-8.4, -3.9], [-3.6, -3.9]);
  decorateWall([-1.2, -3.9], [3.6, -3.9]);
  decorateWall([3.6, 3.9], [-3.6, 3.9]);
  decorateWall([-7.2, 3.9], [-8.4, 3.9]);
  decorateWall([-8.4, 3.9], [-8.4, -3.9]);

  const addInstances = (geometry, material, entries, name) => {
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    entries.forEach(([x, z, rotationY], index) => {
      dummy.position.set(x, 1.65, z);   // Paneelmitte (Unterkante ca. 0,3 m)
      dummy.rotation.set(0, rotationY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  addInstances(new THREE.BoxGeometry(1.12, 2.75, 0.05), copperMat, panelFrames, 'wandpaneel_rahmen');
  addInstances(new THREE.BoxGeometry(0.98, 2.55, 0.035), wallDarkMat, panels, 'wandpaneele');

  const slotMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.065, 0.3, 0.022),
    lineGlowMat,
    lightSlots.length
  );
  lightSlots.forEach(([x, z, y, rotationY], index) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotationY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    slotMesh.setMatrixAt(index, dummy.matrix);
  });
  slotMesh.name = 'wand_lichtschlitze';
  root.add(slotMesh);

  // Sockelleisten und Gesimse.
  const addTrim = (a, b, y, h, d, name) => {
    const s = segInfo(a, b);
    const mesh = addBox(s.len, h, d, copperMat, s.cx + s.nx * (T / 2 + d / 2), y, s.cz + s.nz * (T / 2 + d / 2), name);
    mesh.rotation.y = s.rot;
  };
  addTrim([-8.4, -3.9], [-3.6, -3.9], 0.075, 0.15, 0.05, 'wand_leiste_sockel_w');
  addTrim([-1.2, -3.9], [3.6, -3.9], 0.075, 0.15, 0.05, 'wand_leiste_sockel_o');
  addTrim([-8.4, -3.9], [-3.6, -3.9], H - 0.06, 0.08, 0.06, 'wand_leiste_gesims_w');
  addTrim([-1.2, -3.9], [3.6, -3.9], H - 0.06, 0.08, 0.06, 'wand_leiste_gesims_o');
  addTrim([-8.4, 3.9], [-8.4, -3.9], 0.075, 0.15, 0.05, 'wand_leiste_sockel_nord');
  addTrim([-8.4, 3.9], [-8.4, -3.9], H - 0.06, 0.08, 0.06, 'wand_leiste_gesims_nord');
  addTrim([3.6, 3.9], [-3.6, 3.9], 0.075, 0.15, 0.05, 'wand_leiste_sockel_sued');
  addTrim([3.6, 3.9], [-3.6, 3.9], H - 0.06, 0.08, 0.06, 'wand_leiste_gesims_sued');

  // -------------------------------------------------------------- Fenster
  addBox(3.5, 1.95, 0.05, glassMat, -5.4, 1.95, 3.9, 'fenster_glas');
  addBox(3.74, 0.12, 0.14, copperMat, -5.4, 0.9, 3.88, 'fenster_rahmen_unten');
  addBox(3.74, 0.12, 0.14, copperMat, -5.4, 3.0, 3.88, 'fenster_rahmen_oben');
  for (const x of [-7.2, -5.4, -3.6]) {
    addBox(0.12, 2.16, 0.14, copperMat, x, 1.95, 3.88, 'fenster_rahmen_pfeiler');
  }
  addBox(3.5, 0.06, 0.09, lineGlowMat, -5.4, 0.98, 3.82, 'fenster_lichtband');

  // -------------------------------------------------------------- Türbereich
  const doorCenterX = -2.4;
  const doorCenterZ = -3.9;

  addBox(0.14, 3.12, 0.42, copperMat, doorCenterX - 1.27, 1.56, doorCenterZ, 'tuer_einfassung_links');
  addBox(0.14, 3.12, 0.42, copperMat, doorCenterX + 1.27, 1.56, doorCenterZ, 'tuer_einfassung_rechts');
  addBox(2.68, 0.14, 0.42, copperMat, doorCenterX, 3.07, doorCenterZ, 'tuer_einfassung_oben');

  addEmpty(
    'DOOR_eingang',
    doorCenterX,
    0,
    doorCenterZ,
    Math.PI,
    { breite: 2.4, hoehe: 3, ziel: 'Flur / vorheriger Raum' }
  );
  // Antiker-Schiebetür: Platz in der Wandmitte, Vorderseite +Z zeigt in den Raum.
  addEmpty('PLACE_OBJ-091', doorCenterX, 0, doorCenterZ, 0);

  // -------------------------------------------------------------- Objektplätze
  // DNA-Analysator an der Nordwand der Analysezone (Rückseite an der Wand).
  addEmpty('PLACE_OBJ-019', -0.6, 0, 3.205, Math.PI);

  // Kryotank an der Nordwand des Nassbereichs.
  addEmpty('PLACE_OBJ-072', 5.0, 0, 1.02, Math.PI);

  // Feste, wandgebundene Trägerplatte an der Westwand (Architektur, kein Möbel).
  addBox(0.55, 0.08, 2.0, upperFloorMat, -8.125, 0.94, 1.3, 'wand_traeger_analyse');
  addBox(0.58, 0.05, 2.04, copperMat, -8.125, 0.99, 1.3, 'wand_traeger_kante');
  for (const z of [0.55, 2.05]) {
    addBox(0.5, 0.14, 0.1, copperMat, -8.1, 0.84, z, 'wand_traeger_arm');
  }
  addCollider(0.55, 0.1, 2.0, -8.125, 0.94, 1.3, 'COL_wand_traeger_analyse');

  // Mikrotome als Tischgeräte auf der Trägerplatte (+Z des Objekts zeigt in den Raum).
  addEmpty('PLACE_OBJ-087', -8.035, 0.98, 0.8, Math.PI / 2);
  addEmpty('PLACE_OBJ-087_2', -8.035, 0.98, 1.8, Math.PI / 2);

  // -------------------------------------------------------------- Boden details
  const seamPositions = [];
  for (let x = -8.4; x <= 3.6001; x += FIELD) seamPositions.push(x);
  const longitudinalSeams = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.022, 0.006, 7.5),
    copperMat,
    seamPositions.length
  );
  seamPositions.forEach((x, index) => {
    dummy.position.set(x, 0.004, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    longitudinalSeams.setMatrixAt(index, dummy.matrix);
  });
  longitudinalSeams.name = 'boden_fugen_laengs';
  root.add(longitudinalSeams);

  const transversePositions = [];
  for (let z = -3.6; z <= 3.6001; z += FIELD) transversePositions.push(z);
  const transverseSeams = new THREE.InstancedMesh(
    new THREE.BoxGeometry(11.7, 0.006, 0.022),
    copperMat,
    transversePositions.length
  );
  transversePositions.forEach((z, index) => {
    dummy.position.set(-2.4, 0.004, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    transverseSeams.setMatrixAt(index, dummy.matrix);
  });
  transverseSeams.name = 'boden_fugen_quer';
  root.add(transverseSeams);

  // Grün-kupferner Rand der Analysezone.
  addBox(0.16, 0.014, 7.5, patinaMat, -8.28, 0.008, 0, 'boden_rand_west');
  addBox(0.16, 0.014, 7.5, patinaMat, 3.48, 0.008, 0, 'boden_rand_ost');
  addBox(11.7, 0.014, 0.16, patinaMat, -2.4, 0.008, -3.78, 'boden_rand_sued');
  addBox(11.7, 0.014, 0.16, patinaMat, -2.4, 0.008, 3.78, 'boden_rand_nord');

  // Rinnen-/Ablaufmarkierung im Nassbereich.
  addBox(0.14, 0.016, 3.2, copperMat, 4.1, 0.01, 0, 'boden_nass_markierung');
  for (let z = -1.2; z <= 1.2001; z += 0.8) {
    addBox(0.9, 0.014, 0.1, patinaMat, 6.0, 0.01, z, 'boden_nass_steg');
  }

  // Schneeflocken-Intarsie in der Analysezone (Kupfer, flach im Boden).
  const flake = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    flake.push([-2.4 + Math.cos(angle) * 0.9, 0.4 + Math.sin(angle) * 0.9, angle]);
  }
  const flakeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.008, 0.05), copperMat, flake.length);
  flake.forEach(([x, z, angle], index) => {
    dummy.position.set(x, 0.006, z);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    flakeMesh.setMatrixAt(index, dummy.matrix);
  });
  flakeMesh.name = 'boden_intarsie_schneeflocke';
  root.add(flakeMesh);
  for (const [x, z] of [[-2.4, 0.4], [-2.4, 1.3], [-2.4, -0.5]]) {
    addBox(0.05, 0.008, 0.5, copperMat, x, 0.006, z, 'boden_intarsie_ast');
  }

  // -------------------------------------------------------------- Decke
  shapeFlat(floorPoints, H, ceilingMat, 'decke_haupt');

  const ceilingPanels = [
    [-6.0, -2.2],
    [-2.4, -2.2],
    [1.2, -2.2],
    [-6.0, 1.8],
    [-2.4, 1.8],
    [1.2, 1.8],
    [5.6, 0.0],
  ];
  const ceilingLightMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.55, 0.035, 0.8),
    glowMat,
    ceilingPanels.length
  );
  ceilingPanels.forEach(([x, z], index) => {
    dummy.position.set(x, H - 0.02, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ceilingLightMesh.setMatrixAt(index, dummy.matrix);
  });
  ceilingLightMesh.name = 'decke_lichtfelder';
  root.add(ceilingLightMesh);

  const ceilingFrameMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.74, 0.06, 0.98),
    copperMat,
    ceilingPanels.length
  );
  ceilingPanels.forEach(([x, z], index) => {
    dummy.position.set(x, H - 0.04, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ceilingFrameMesh.setMatrixAt(index, dummy.matrix);
  });
  ceilingFrameMesh.name = 'decke_lichtfeldrahmen';
  root.add(ceilingFrameMesh);

  // Schräg gestellte Stützpfeiler am Übergang Analysezone / Nassbereich.
  for (const z of [-1.75, 1.75]) {
    const pillar = addBox(0.26, H - 0.12, 0.32, pillarMat, 3.42, (H - 0.12) / 2, z, 'stuetzpfeiler');
    pillar.rotation.y = z < 0 ? 0.32 : -0.32;
    addCollider(
      0.26,
      H - 0.12,
      0.32,
      3.42,
      (H - 0.12) / 2,
      z,
      'COL_stuetzpfeiler',
      pillar.rotation.y
    );
  }

  // -------------------------------------------------------------- Beleuchtung
  const lampDefinitions = [
    { x: -6.0, z: -2.2, color: '#9fd8ff', intensity: 9, distance: 9, light: true },
    { x: -2.4, z: -2.2, color: '#9fd8ff', intensity: 9, distance: 9, light: false },
    { x: 1.2, z: -2.2, color: '#9fd8ff', intensity: 9, distance: 9, light: true },
    { x: -6.0, z: 1.8, color: '#d9f3ff', intensity: 10, distance: 9, light: false },
    { x: -2.4, z: 1.8, color: '#d9f3ff', intensity: 10, distance: 9, light: true },
    { x: 1.2, z: 1.8, color: '#9fd8ff', intensity: 9, distance: 9, light: false },
    { x: 5.6, z: 0.0, color: '#9fd8ff', intensity: 8, distance: 7, light: true },
  ];
  const lampLights = [];

  lampDefinitions.forEach((definition, index) => {
    const lamp = addEmpty(`LAMP_${index + 1}`, definition.x, H - 0.45, definition.z, 0, {
      color: definition.color,
      intensity: definition.intensity,
      distance: definition.distance,
    });
    if (definition.light) {
      const light = new THREE.PointLight(definition.color, definition.intensity, definition.distance, 1.3);
      light.position.set(0, -0.15, 0);
      light.userData.baseIntensity = definition.intensity;
      lamp.add(light);
      lampLights.push(light);
    }
  });

  // -------------------------------------------------------------- Kollision
  addCollider(12, 0.2, 7.8, -2.4, -0.05, 0, 'COL_boden_analyse');
  addCollider(4.1, 0.2, 3.4, 5.65, -0.05, 0, 'COL_boden_nass');
  addCollider(0.7, 0.2, 0.976, 8.05, -0.05, 0, 'COL_boden_nass_spitze');
  addCollider(12, 0.3, 7.8, -2.4, H + 0.15, 0, 'COL_decke_analyse');
  addCollider(4.1, 0.3, 3.4, 5.65, H + 0.15, 0, 'COL_decke_nass');
  addCollider(0.7, 0.3, 0.976, 8.05, H + 0.15, 0, 'COL_decke_nass_spitze');

  // -------------------------------------------------------------- Animation / API
  let animationActive = true;
  glowMat.emissiveIntensity = 1.5;
  lineGlowMat.emissiveIntensity = 1.5;

  const pulse = (time) => {
    if (!animationActive) return;
    glowMat.emissiveIntensity = 1.45 + Math.sin(time * 0.72) * 0.08;
    lineGlowMat.emissiveIntensity = 1.5 + Math.sin(time * 0.72 + 0.8) * 0.09;
  };
  root.userData.animate = pulse;
  root.userData.update = pulse;
  slotMesh.onBeforeRender = () => pulse(performance.now() / 1000);

  root.userData.raum = {
    id: 'ATL-013',
    etage: 3,
    bereich: 'East Pier',
    kategorie: 'science',
    analyzezone: { minX: -8.4, maxX: 3.6, minZ: -3.9, maxZ: 3.9 },
    nassbereich: { minX: 3.6, maxX: 8.4, minZ: -1.7, maxZ: 1.7 },
  };

  root.userData.api = {
    setLaborlicht(aktiv = true) {
      animationActive = aktiv;
      lampLights.forEach((light) => {
        light.intensity = aktiv ? light.userData.baseIntensity : 0;
      });
      root.userData.laborlichtAktiv = aktiv;
    },
    getGrundriss() {
      return {
        analyse: [
          [-8.4, -3.9],
          [3.6, -3.9],
          [3.6, 3.9],
          [-8.4, 3.9],
        ],
        nassbereich: wetPoints,
      };
    },
  };

  return root;
}

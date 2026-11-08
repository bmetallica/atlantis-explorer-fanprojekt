// OBJ-057: Antiker Druckanzug / Ancient Environmental Pressure Suit
// Standobjekt auf Prüfständer, 1 Einheit = 1 Meter, Vorderseite zeigt nach +Z.
import * as THREE from 'three';

const KIT = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'pressure_suit',
  art: 'Standobjekt',
  masse: 'ca. 185 kg (Anzug, Rückenaggregat und Prüfständer)',
  wohin: 'ATL-030 Waffenkammer, ATL-035 Gefahrstofflager, ATL-040 Jumper-Bay',
  benutzen: 'INT_bedienen → Druckanzugsystem und eingebauten Funk bedienen',
  lichter: 'LAMP_helmlinks, LAMP_helmrechts (weiß-blau, dauerhaft an), LAMP_brust (eisblau)',
  animation: 'Brustdisplay und Funkstatus pulsieren weich; Helmscheinwerfer bleiben dauerhaft aktiv',
  quelle: 'selbst gebaut nach Atlantis, Staffel 3 „Submersion“ / OBJ-057',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'pressure_suit';

  // ------------------------------------------------------------
  // Materialien: gedämpftes Blaugrau, Perlmetall und sparsame Bronze
  // ------------------------------------------------------------
  const matAnzug = new THREE.MeshStandardMaterial({
    name: 'anzug_blau',
    color: 0x26384e,
    metalness: 0.58,
    roughness: 0.43,
  });

  const matPanzerung = new THREE.MeshStandardMaterial({
    name: 'panzerung_blaugrau',
    color: 0x40586d,
    metalness: 0.72,
    roughness: 0.3,
  });

  const matDunkel = new THREE.MeshStandardMaterial({
    name: 'technik_dunkel',
    color: 0x151f2b,
    metalness: 0.62,
    roughness: 0.46,
  });

  const matGummi = new THREE.MeshStandardMaterial({
    name: 'dichtung_dunkel',
    color: 0x0b1219,
    metalness: 0.05,
    roughness: 0.9,
  });

  const matBronze = KIT('copper');
  const matPerl = KIT('pillar');
  const matStahl = KIT('wallDark');

  const matSicht = new THREE.MeshStandardMaterial({
    name: 'helmscheibe',
    color: 0x10283a,
    emissive: 0x061522,
    emissiveIntensity: 0.24,
    metalness: 0.34,
    roughness: 0.09,
  });

  const matLicht = new THREE.MeshStandardMaterial({
    name: 'helmscheinwerfer',
    color: 0xd5f7ff,
    emissive: 0xb9efff,
    emissiveIntensity: 2.1,
    metalness: 0.1,
    roughness: 0.16,
  });

  const matFunk = new THREE.MeshStandardMaterial({
    name: 'funkanzeige',
    color: 0x14352f,
    emissive: 0x52ffd1,
    emissiveIntensity: 0.04,
    metalness: 0.2,
    roughness: 0.3,
  });

  // Brustdisplay mit Canvas-Textur.
  let screenTexture = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#061520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#6fcde2';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, 308, 188);

    ctx.fillStyle = '#b3efff';
    ctx.font = 'bold 25px monospace';
    ctx.fillText('DEPTH SUIT // EPS-04', 18, 38);

    ctx.fillStyle = '#6fe3c3';
    ctx.font = '21px monospace';
    ctx.fillText('PRESS  4500 m', 18, 76);
    ctx.fillText('O2     98 %', 18, 108);
    ctx.fillText('PWR    READY', 18, 140);

    ctx.strokeStyle = '#2f7185';
    ctx.lineWidth = 2;
    for (let x = 18; x < 302; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 164);
      ctx.lineTo(x, 181);
      ctx.stroke();
    }

    screenTexture = new THREE.CanvasTexture(canvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
  }

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'brustdisplay',
    color: screenTexture ? 0xffffff : 0x0b2130,
    map: screenTexture,
    emissive: 0x59cbe8,
    emissiveMap: screenTexture,
    emissiveIntensity: 0.16,
    metalness: 0.12,
    roughness: 0.25,
  });

  // ------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------
  const addMesh = (geometry, material, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  function addCylinderBetween(a, b, radius, material, radialSegments = 14) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      radialSegments,
      1,
      false,
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  function addCapsuleBetween(a, b, radius, length, material, radialSegments = 14) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(end, start);

    const geometry = new THREE.CapsuleGeometry(
      radius,
      length,
      5,
      radialSegments,
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------
  // Prüfständer, etwa 0,9 × 2,0 m
  // ------------------------------------------------------------
  const base = addMesh(
    new THREE.BoxGeometry(0.88, 0.12, 0.7),
    matStahl,
    0,
    0.06,
    -0.04,
  );
  base.name = 'stand_basis';

  addMesh(
    new THREE.BoxGeometry(0.8, 0.025, 0.62),
    matPerl,
    0,
    0.1325,
    -0.04,
  );

  // Hinterer Träger.
  addMesh(
    new THREE.BoxGeometry(0.1, 1.4, 0.1),
    matStahl,
    0,
    0.845,
    -0.43,
  );
  addMesh(
    new THREE.BoxGeometry(0.18, 0.1, 0.16),
    matBronze,
    0,
    1.52,
    -0.43,
  );

  // Hüftring und diagonale Verstrebungen zum Ständer.
  addMesh(
    new THREE.TorusGeometry(0.285, 0.03, 8, 28),
    matBronze,
    0,
    0.98,
    -0.01,
    Math.PI / 2,
  );
  addCylinderBetween([0, 0.98, -0.39], [0, 0.98, -0.25], 0.032, matBronze);
  addCylinderBetween([0, 0.2, -0.42], [0.27, 0.94, -0.25], 0.021, matStahl);
  addCylinderBetween([0, 0.2, -0.42], [-0.27, 0.94, -0.25], 0.021, matStahl);

  // Schrauben auf der Standplatte.
  const boltGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 8);
  const bolts = new THREE.InstancedMesh(boltGeometry, matBronze, 8);
  bolts.name = 'inst_staender_schrauben';
  const boltMatrix = new THREE.Matrix4();
  let boltIndex = 0;

  for (const x of [-0.34, 0.34]) {
    for (const z of [-0.28, 0.2]) {
      boltMatrix.makeTranslation(x, 0.153, z);
      bolts.setMatrixAt(boltIndex++, boltMatrix);
    }
  }

  bolts.count = boltIndex;
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  // ------------------------------------------------------------
  // Stiefel und Beine
  // ------------------------------------------------------------
  for (const side of [-1, 1]) {
    const x = side * 0.18;

    // Schwerer Stiefel, Unterseite auf der Standplatte.
    addMesh(
      new THREE.BoxGeometry(0.28, 0.18, 0.39),
      matDunkel,
      x,
      0.235,
      0.075,
    );
    addMesh(
      new THREE.BoxGeometry(0.29, 0.035, 0.405),
      matGummi,
      x,
      0.1525,
      0.075,
    );
    addMesh(
      new THREE.BoxGeometry(0.21, 0.085, 0.24),
      matPanzerung,
      x,
      0.34,
      0.035,
    );

    // Wade und Unterschenkel.
    addCapsuleBetween(
      [x, 0.3, 0.015],
      [x, 0.64, 0.015],
      0.135,
      0.18,
      matAnzug,
    );

    // Schienbeinschoner.
    addMesh(
      new THREE.BoxGeometry(0.205, 0.3, 0.075),
      matPanzerung,
      x,
      0.43,
      0.135,
      0.035,
    );
    addMesh(
      new THREE.BoxGeometry(0.09, 0.21, 0.025),
      matBronze,
      x,
      0.43,
      0.18,
      0.035,
    );

    // Kniegelenk.
    addMesh(
      new THREE.SphereGeometry(0.155, 18, 12),
      matDunkel,
      x,
      0.64,
      0.015,
    );
    addMesh(
      new THREE.TorusGeometry(0.147, 0.022, 8, 28),
      matBronze,
      x,
      0.64,
      0.015,
      0,
      Math.PI / 2,
    );

    // Oberschenkel.
    addCapsuleBetween(
      [x, 0.64, 0.005],
      [x * 0.94, 1.01, 0],
      0.15,
      0.19,
      matAnzug,
    );

    // Äußere Panzerlasche.
    addMesh(
      new THREE.BoxGeometry(0.07, 0.33, 0.24),
      matPanzerung,
      x + side * 0.115,
      0.82,
      0.005,
      0,
      0,
      side * -0.035,
    );
  }

  // ------------------------------------------------------------
  // Becken und Rumpf
  // ------------------------------------------------------------
  addMesh(
    new THREE.BoxGeometry(0.54, 0.27, 0.39),
    matDunkel,
    0,
    1.01,
    0,
  );
  addMesh(
    new THREE.BoxGeometry(0.46, 0.12, 0.405),
    matPanzerung,
    0,
    1.065,
    0,
  );

  // Segmentierter Gürtel statt durchgehendem, dominatem Ring.
  for (const x of [-0.18, 0, 0.18]) {
    addMesh(
      new THREE.BoxGeometry(x === 0 ? 0.12 : 0.16, 0.07, 0.04),
      matBronze,
      x,
      0.99,
      0.215,
    );
  }

  const torso = addMesh(
    new THREE.CapsuleGeometry(0.29, 0.31, 5, 18),
    matAnzug,
    0,
    1.34,
    0,
  );
  torso.name = 'torso_druckanzug';
  torso.scale.set(1.08, 1, 0.73);

  // Verbreiterte obere Panzerung.
  addMesh(
    new THREE.BoxGeometry(0.63, 0.2, 0.37),
    matPanzerung,
    0,
    1.52,
    0,
    0,
    0,
    0,
  );

  // Verjüngtes Brustschild als geschlossener Extrusionskörper.
  const chestShape = new THREE.Shape();
  chestShape.moveTo(-0.29, -0.24);
  chestShape.lineTo(0.29, -0.24);
  chestShape.lineTo(0.32, 0.2);
  chestShape.lineTo(0.17, 0.3);
  chestShape.lineTo(-0.17, 0.3);
  chestShape.lineTo(-0.32, 0.2);
  chestShape.closePath();

  const chestGeometry = new THREE.ExtrudeGeometry(chestShape, {
    depth: 0.105,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 4,
  });

  const chest = addMesh(
    chestGeometry,
    matPanzerung,
    0,
    1.33,
    0.205,
    -0.035,
  );
  chest.name = 'brustpanzer';

  // Unterer Bauchpanzer.
  addMesh(
    new THREE.BoxGeometry(0.4, 0.18, 0.09),
    matDunkel,
    0,
    1.075,
    0.205,
  );

  // Brustdisplay.
  addMesh(
    new THREE.BoxGeometry(0.36, 0.235, 0.035),
    matDunkel,
    0,
    1.365,
    0.339,
    -0.035,
  );

  const screen = addMesh(
    new THREE.PlaneGeometry(0.315, 0.195),
    matScreen,
    0,
    1.365,
    0.36,
    -0.035,
  );
  screen.name = 'brustdisplay';

  // Druckventile und Messingbronze-Akzente.
  for (const x of [-0.165, 0.165]) {
    addMesh(
      new THREE.CylinderGeometry(0.047, 0.047, 0.045, 16),
      matBronze,
      x,
      1.145,
      0.26,
      Math.PI / 2,
    );
  }

  addMesh(
    new THREE.BoxGeometry(0.04, 0.43, 0.025),
    matBronze,
    0,
    1.3,
    0.347,
    -0.035,
  );

  // Kleine Nieten auf dem Brustschild.
  const rivetGeometry = new THREE.SphereGeometry(0.014, 8, 6);
  const rivets = new THREE.InstancedMesh(rivetGeometry, matBronze, 8);
  rivets.name = 'inst_brustnieten';
  const rivetMatrix = new THREE.Matrix4();
  let rivetIndex = 0;

  for (const y of [1.15, 1.52]) {
    for (const x of [-0.235, 0.235]) {
      rivetMatrix.makeTranslation(x, y, 0.34);
      rivets.setMatrixAt(rivetIndex++, rivetMatrix);
    }
  }

  rivets.count = rivetIndex;
  rivets.instanceMatrix.needsUpdate = true;
  root.add(rivets);

  // ------------------------------------------------------------
  // Arme, Schulterpanzer und Handschuhe
  // ------------------------------------------------------------
  for (const side of [-1, 1]) {
    const shoulderX = side * 0.32;
    const elbowX = side * 0.38;
    const wristX = side * 0.405;

    // Schulterkugel und massive, kantige Schulterplatte.
    addMesh(
      new THREE.SphereGeometry(0.145, 18, 12),
      matDunkel,
      shoulderX,
      1.47,
      0,
    );

    const shoulder = addMesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.3),
      matPanzerung,
      shoulderX,
      1.485,
      0,
      0,
      0,
      side * -0.13,
    );
    shoulder.name = side < 0 ? 'schulter_links' : 'schulter_rechts';

    addMesh(
      new THREE.BoxGeometry(0.085, 0.13, 0.025),
      matBronze,
      shoulderX + side * 0.045,
      1.49,
      0.165,
      0,
      0,
      side * -0.13,
    );

    // Oberarm.
    addCapsuleBetween(
      [side * 0.34, 1.4, 0.005],
      [elbowX, 1.08, 0.025],
      0.13,
      0.16,
      matAnzug,
    );

    // Ellbogengelenk.
    addMesh(
      new THREE.SphereGeometry(0.125, 18, 12),
      matDunkel,
      elbowX,
      1.075,
      0.025,
    );
    addMesh(
      new THREE.TorusGeometry(0.12, 0.021, 8, 28),
      matBronze,
      elbowX,
      1.075,
      0.025,
      0,
      Math.PI / 2,
    );

    // Unterarm.
    addCapsuleBetween(
      [elbowX, 1.08, 0.025],
      [wristX, 0.78, 0.065],
      0.12,
      0.15,
      matPanzerung,
    );

    // Handgelenk und schwerer Handschuh.
    addMesh(
      new THREE.CylinderGeometry(0.105, 0.115, 0.09, 14),
      matDunkel,
      wristX,
      0.755,
      0.065,
    );
    addMesh(
      new THREE.BoxGeometry(0.205, 0.225, 0.235),
      matDunkel,
      side * 0.42,
      0.595,
      0.075,
      0,
      0,
      side * -0.045,
    );
    addMesh(
      new THREE.BoxGeometry(0.175, 0.075, 0.205),
      matBronze,
      side * 0.42,
      0.5,
      0.072,
      0,
      0,
      side * -0.045,
    );

    // Kleine seitliche Armplatte.
    addMesh(
      new THREE.BoxGeometry(0.06, 0.25, 0.19),
      matPanzerung,
      side * 0.49,
      0.93,
      0.04,
      0,
      0,
      side * -0.08,
    );
  }

  // ------------------------------------------------------------
  // Halsring und Druckhelm
  // ------------------------------------------------------------
  addMesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.15, 20),
    matDunkel,
    0,
    1.63,
    0,
  );
  addMesh(
    new THREE.TorusGeometry(0.165, 0.027, 8, 30),
    matBronze,
    0,
    1.59,
    0,
    Math.PI / 2,
  );

  const helmet = addMesh(
    new THREE.SphereGeometry(0.305, 24, 16),
    matPanzerung,
    0,
    1.75,
    0,
  );
  helmet.name = 'helm_druckanzug';
  helmet.scale.set(1, 0.98, 1);

  // Seitliche Drucklautsprecher.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.12, 18),
      matDunkel,
      side * 0.315,
      1.73,
      -0.025,
      0,
      0,
      Math.PI / 2,
    );
    addMesh(
      new THREE.TorusGeometry(0.105, 0.016, 8, 28),
      matBronze,
      side * 0.383,
      1.73,
      -0.025,
      0,
      Math.PI / 2,
    );
  }

  // Große, geschlossene, gewölbte Sichtscheibe.
  const visor = addMesh(
    new THREE.SphereGeometry(0.272, 24, 16),
    matSicht,
    0,
    1.765,
    0.245,
  );
  visor.name = 'helmscheibe';
  visor.scale.set(0.97, 0.78, 0.27);

  // Bronze-Rahmen und dunkler Dichtungsring.
  addMesh(
    new THREE.TorusGeometry(0.254, 0.024, 8, 32),
    matBronze,
    0,
    1.765,
    0.295,
  );
  addMesh(
    new THREE.TorusGeometry(0.268, 0.011, 6, 32),
    matGummi,
    0,
    1.765,
    0.281,
  );

  // Stirnreifen und technische Leiste.
  addMesh(
    new THREE.TorusGeometry(0.298, 0.018, 8, 32),
    matDunkel,
    0,
    1.79,
    0.005,
  );
  addMesh(
    new THREE.BoxGeometry(0.26, 0.055, 0.075),
    matDunkel,
    0,
    1.95,
    0.075,
  );

  // Helmscheinwerfer, dauerhaft eingeschaltet.
  for (const side of [-1, 1]) {
    const x = side * 0.105;

    addMesh(
      new THREE.CylinderGeometry(0.057, 0.064, 0.09, 18),
      matDunkel,
      x,
      1.86,
      0.245,
      Math.PI / 2,
    );
    addMesh(
      new THREE.CylinderGeometry(0.046, 0.046, 0.016, 18),
      matLicht,
      x,
      1.86,
      0.295,
      Math.PI / 2,
    );
  }

  // ------------------------------------------------------------
  // Rückenaggregat, Hochdruckflaschen, Funk und Druckluftschläuche
  // ------------------------------------------------------------
  addMesh(
    new THREE.BoxGeometry(0.46, 0.68, 0.27),
    matDunkel,
    0,
    1.25,
    -0.365,
  );
  addMesh(
    new THREE.BoxGeometry(0.39, 0.22, 0.245),
    matPanzerung,
    0,
    1.67,
    -0.35,
  );
  addMesh(
    new THREE.BoxGeometry(0.35, 0.16, 0.25),
    matAnzug,
    0,
    0.92,
    -0.35,
  );

  // Flaschen liegen hinter dem Aggregat.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.57, 18),
      matPanzerung,
      side * 0.165,
      1.2,
      -0.545,
    );
    addMesh(
      new THREE.SphereGeometry(0.085, 18, 12),
      matPanzerung,
      side * 0.165,
      1.485,
      -0.545,
    );
    addMesh(
      new THREE.SphereGeometry(0.085, 18, 12),
      matPanzerung,
      side * 0.165,
      0.915,
      -0.545,
    );
    addMesh(
      new THREE.BoxGeometry(0.055, 0.18, 0.035),
      matBronze,
      side * 0.165,
      1.23,
      -0.632,
    );
  }

  // Zwei Druckschläuche zum Helm.
  addCylinderBetween(
    [-0.17, 1.58, -0.56],
    [-0.22, 1.76, -0.26],
    0.034,
    matGummi,
  );
  addCylinderBetween(
    [0.17, 1.58, -0.56],
    [0.22, 1.76, -0.26],
    0.034,
    matGummi,
  );

  // Funkmodul und Antenne.
  addMesh(
    new THREE.BoxGeometry(0.25, 0.15, 0.09),
    matDunkel,
    0.055,
    1.55,
    -0.525,
  );
  addMesh(
    new THREE.SphereGeometry(0.027, 10, 8),
    matFunk,
    -0.025,
    1.555,
    -0.575,
  );
  addMesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8),
    matBronze,
    0.13,
    1.835,
    -0.525,
  );
  addMesh(
    new THREE.SphereGeometry(0.021, 10, 8),
    matBronze,
    0.13,
    1.99,
    -0.525,
  );

  // Warnmarken an den Oberschenkeln.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.06, 0.055, 0.018),
      matBronze,
      side * 0.185,
      0.9,
      0.15,
      0,
      0,
      side * -0.035,
    );
  }

  // ------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------
  const colStaender = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.18, 0.74),
  );
  colStaender.name = 'COL_staender';
  colStaender.position.set(0, 0.09, -0.04);
  root.add(colStaender);

  const colAnzug = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 1.5, 0.64),
  );
  colAnzug.name = 'COL_anzug';
  colAnzug.position.set(0, 0.9, 0.04);
  root.add(colAnzug);

  const colKopf = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.43, 0.62),
  );
  colKopf.name = 'COL_helm';
  colKopf.position.set(0, 1.75, 0.03);
  root.add(colKopf);

  const colAggregat = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.8, 0.34),
  );
  colAggregat.name = 'COL_rueckenaggregat';
  colAggregat.position.set(0, 1.25, -0.54);
  root.add(colAggregat);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.28, 0.76);
  use.userData = { label: 'Druckanzug bedienen', radius: 0.8 };
  root.add(use);

  const lampLeft = new THREE.Object3D();
  lampLeft.name = 'LAMP_helmlinks';
  lampLeft.position.set(-0.105, 1.86, 0.34);
  lampLeft.userData = { color: '#b9efff', intensity: 6, distance: 5 };
  root.add(lampLeft);

  const lampRight = new THREE.Object3D();
  lampRight.name = 'LAMP_helmrechts';
  lampRight.position.set(0.105, 1.86, 0.34);
  lampRight.userData = { color: '#b9efff', intensity: 6, distance: 5 };
  root.add(lampRight);

  const lampChest = new THREE.Object3D();
  lampChest.name = 'LAMP_brust';
  lampChest.position.set(0, 1.36, 0.39);
  lampChest.userData = { color: '#6fe3ff', intensity: 2.5, distance: 2.2 };
  root.add(lampChest);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let systemAktiv = false;
  let funkAktiv = false;
  let zeit = 0;
  let systemStaerke = 0;
  let funkStaerke = 0;
  let letzteZeit = null;

  function update(dt) {
    zeit += dt;

    const weich = Math.min(1, Math.max(0, dt) * 5);
    const zielSystem = systemAktiv ? 1 : 0;
    const zielFunk = funkAktiv ? 1 : 0;

    systemStaerke += (zielSystem - systemStaerke) * weich;
    funkStaerke += (zielFunk - funkStaerke) * weich;

    const langsamePuls = 0.5 + 0.5 * Math.sin(zeit * 2.5);
    const funkPuls = Math.max(0, Math.sin(zeit * 5.2));

    matScreen.emissiveIntensity =
      0.14 + systemStaerke * (0.85 + langsamePuls * 0.22);

    // Die Helmscheinwerfer bleiben dauerhaft aktiv.
    matLicht.emissiveIntensity = 1.9 + langsamePuls * 0.28;

    matFunk.emissiveIntensity =
      0.035 + funkStaerke * (0.65 + funkPuls * 1.25);
  }

  torso.onBeforeRender = () => {
    const jetzt = performance.now() / 1000;
    if (letzteZeit !== null) {
      update(Math.min(Math.max(jetzt - letzteZeit, 0), 0.1));
    }
    letzteZeit = jetzt;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    einschalten() {
      systemAktiv = true;
    },
    ausschalten() {
      systemAktiv = false;
      funkAktiv = false;
    },
    funkEinschalten() {
      funkAktiv = true;
      systemAktiv = true;
    },
    funkAusschalten() {
      funkAktiv = false;
    },
    get eingeschaltet() {
      return systemAktiv;
    },
    get funkAktiv() {
      return funkAktiv;
    },
    get status() {
      return {
        eingeschaltet: systemAktiv,
        funkAktiv,
        betriebsart: 'Tiefsee-Umweltanzug',
        tiefe: '4500 m',
      };
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'anzug_einschalten',
      label: 'Druckanzugsystem aktivieren',
      run: () => api.einschalten(),
    },
    {
      id: 'anzug_ausschalten',
      label: 'Druckanzugsystem deaktivieren',
      run: () => api.ausschalten(),
    },
    {
      id: 'funk_einschalten',
      label: 'Eingebauten Funk einschalten',
      run: () => api.funkEinschalten(),
    },
    {
      id: 'funk_ausschalten',
      label: 'Eingebauten Funk ausschalten',
      run: () => api.funkAusschalten(),
    },
  ];

  return root;
}

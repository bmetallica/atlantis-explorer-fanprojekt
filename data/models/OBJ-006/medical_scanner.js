import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

function makeLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#06131e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#b88d4f';
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.strokeStyle = '#4edfff';
  ctx.lineWidth = 3;
  ctx.strokeRect(23, 23, canvas.width - 46, canvas.height - 46);

  ctx.fillStyle = '#b9f4ff';
  ctx.font = 'bold 92px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MRI', 384, 91);

  ctx.strokeStyle = '#6fe3ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const x = 104 + i * 35;
    ctx.moveTo(x, 151);
    ctx.lineTo(x + 12, 126);
    ctx.lineTo(x + 6, 151);
    ctx.lineTo(x + 19, 126);
    ctx.lineTo(x + 24, 151);
    ctx.moveTo(x + 19, 126);
    ctx.lineTo(x + 28, 151);
  }
  ctx.stroke();

  ctx.fillStyle = '#d0a566';
  ctx.font = 'bold 25px monospace';
  ctx.fillText('ATLANTIS MEDICAL SYSTEMS', 384, 209);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeScreenState() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, ctx, texture };
}

export const steckbrief = {
  name: 'medical_scanner',
  art: 'Standobjekt',
  masse: '2,72 × 2,04 × 2,26 (B × H × T, m), inklusive Liege, Scannerkopf und Konsole',
  benutzen: 'INT_scannen → Menü aus userData.actions',
  lichter: 'LAMP_scanband (grün-gelb), LAMP_display (eisblau)',
  animation: 'Das grün-gelbe Diagnoseband fährt vom Fuß- zum Kopfende über die Liege; der Turmschirm zeigt ein blau-türkisfarbenes Ganzkörperschema mit roten Befunden',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'medical_scanner';

  // --- Materialien
  const matHull = new THREE.MeshStandardMaterial({
    name: 'scanner_hull',
    color: 0x1a3444,
    metalness: 0.82,
    roughness: 0.3,
  });
  const matDark = new THREE.MeshStandardMaterial({
    name: 'scanner_dark',
    color: 0x08151e,
    metalness: 0.72,
    roughness: 0.4,
  });
  const matTrim = new THREE.MeshStandardMaterial({
    name: 'scanner_trim',
    color: 0xa7bdc5,
    metalness: 0.9,
    roughness: 0.2,
  });
  const matBlanket = new THREE.MeshStandardMaterial({
    name: 'scanner_blanket',
    color: 0x9fc6bd,
    metalness: 0.0,
    roughness: 0.95,
  });
  const matCloth = new THREE.MeshStandardMaterial({
    name: 'scanner_cloth',
    color: 0xd6e4e3,
    metalness: 0.0,
    roughness: 0.88,
  });
  const matCyan = new THREE.MeshStandardMaterial({
    name: 'scanner_cyan_glow',
    color: 0x205a6d,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.6,
    metalness: 0.25,
    roughness: 0.28,
  });
  const matScan = new THREE.MeshStandardMaterial({
    name: 'scanner_green_glow',
    color: 0xa4f53b,
    emissive: 0xbaff32,
    emissiveIntensity: 0,
    metalness: 0.04,
    roughness: 0.22,
  });
  const matScanVolume = new THREE.MeshStandardMaterial({
    name: 'scanner_volume',
    color: 0x7cff35,
    emissive: 0x8dff32,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  // --- Behandlungsliege: Länge entlang Z, Kopfende bei +Z
  const bed = new THREE.Group();
  bed.name = 'behandlungsliege';
  root.add(bed);

  const bedBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.16, 1.72),
    kit('wallDark'),
  );
  bedBase.position.set(0, 0.24, -0.06);
  bed.add(bedBase);

  const bedFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.12, 2.12),
    matTrim,
  );
  bedFrame.position.set(0, 0.4, -0.06);
  bed.add(bedFrame);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.2, 2.0),
    kit('hull'),
  );
  mattress.position.set(0, 0.55, -0.06);
  bed.add(mattress);

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.075, 1.26),
    matBlanket,
  );
  blanket.position.set(0, 0.69, -0.34);
  bed.add(blanket);

  const blanketEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.775, 0.028, 1.27),
    matCloth,
  );
  blanketEdge.position.set(0, 0.651, -0.34);
  bed.add(blanketEdge);

  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.13, 0.36),
    matCloth,
  );
  pillow.position.set(0, 0.715, 0.66);
  bed.add(pillow);

  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.56, 0.11),
    kit('wallDark'),
  );
  headboard.position.set(0, 0.8, 1.01);
  bed.add(headboard);

  const headboardInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.29, 0.025),
    matHull,
  );
  headboardInset.position.set(0, 0.84, 1.075);
  bed.add(headboardInset);

  const footboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.36, 0.1),
    matHull,
  );
  footboard.position.set(0, 0.65, -1.1);
  bed.add(footboard);

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.075, 1.5),
      kit('rail'),
    );
    rail.position.set(side * 0.47, 0.83, -0.08);
    bed.add(rail);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 0.16, 12),
      matHull,
    );
    leg.position.set(side * 0.29, 0.08, 0.7);
    bed.add(leg);

    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 0.16, 12),
      matHull,
    );
    foot.position.set(side * 0.29, 0.08, -0.82);
    bed.add(foot);
  }

  // Seitenstreben als InstancedMesh
  const postGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.32, 10);
  const bedPosts = new THREE.InstancedMesh(postGeometry, matTrim, 8);
  const instanceMatrix = new THREE.Matrix4();
  let postIndex = 0;
  for (const side of [-1, 1]) {
    for (const z of [-0.83, -0.29, 0.25, 0.67]) {
      instanceMatrix.makeTranslation(side * 0.47, 0.76, z);
      bedPosts.setMatrixAt(postIndex, instanceMatrix);
      postIndex += 1;
    }
  }
  bedPosts.instanceMatrix.needsUpdate = true;
  bed.add(bedPosts);

  // --- Schwenkbare Trägergabel und Scannerkopf
  const gantry = new THREE.Group();
  gantry.name = 'schwenkbarer_ausleger';
  root.add(gantry);

  const supportFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.1, 0.46),
    matHull,
  );
  supportFoot.position.set(0.78, 0.05, 0.84);
  gantry.add(supportFoot);

  const supportColumn = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 1.86, 0.25),
    kit('wallDark'),
  );
  supportColumn.position.set(0.78, 0.98, 0.84);
  gantry.add(supportColumn);

  const supportTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 1.48, 0.265),
    kit('rail'),
  );
  supportTrim.position.set(0.675, 1.02, 0.84);
  gantry.add(supportTrim);

  const supportLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 1.1, 0.014),
    matCyan,
  );
  supportLight.position.set(0.652, 1.05, 0.9);
  gantry.add(supportLight);

  const horizontalArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.16, 0.22),
    matTrim,
  );
  horizontalArm.position.set(0.48, 1.96, 0.84);
  gantry.add(horizontalArm);

  const rearBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.14, 0.53),
    matHull,
  );
  rearBridge.position.set(0.37, 1.96, 0.56);
  gantry.add(rearBridge);

  const pivotGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.28, 18);
  pivotGeometry.rotateZ(Math.PI / 2);
  const pivot = new THREE.Mesh(pivotGeometry, kit('copper'));
  pivot.position.set(0.37, 1.96, 0.63);
  gantry.add(pivot);

  const verticalJoint = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.26, 18),
    kit('copper'),
  );
  verticalJoint.position.set(0.78, 1.96, 0.84);
  gantry.add(verticalJoint);

  const headMain = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.3, 1.28),
    kit('wallDark'),
  );
  headMain.position.set(0, 1.88, 0);
  gantry.add(headMain);

  const headTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.055, 1.08),
    matHull,
  );
  headTop.position.set(0, 2.057, 0);
  gantry.add(headTop);

  const underside = new THREE.Mesh(
    new THREE.BoxGeometry(1.43, 0.055, 1.1),
    matDark,
  );
  underside.position.set(0, 1.705, 0);
  gantry.add(underside);

  for (const side of [-1, 1]) {
    const bronzeEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.32, 1.29),
      kit('copper'),
    );
    bronzeEdge.position.set(side * 0.805, 1.88, 0);
    gantry.add(bronzeEdge);
  }

  const frontStatusStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.018, 0.018),
    matCyan,
  );
  frontStatusStrip.position.set(0, 1.7, 0.65);
  gantry.add(frontStatusStrip);

  // Lüftungsschlitze als InstancedMesh
  const ventGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.016);
  const vents = new THREE.InstancedMesh(ventGeometry, matDark, 12);
  for (let i = 0; i < 12; i += 1) {
    instanceMatrix.makeTranslation(-0.55 + i * 0.1, 1.87, 0.648);
    vents.setMatrixAt(i, instanceMatrix);
  }
  vents.instanceMatrix.needsUpdate = true;
  gantry.add(vents);

  // Antike Beschriftung "MRI"
  const labelTexture = makeLabelTexture();
  const labelMaterial = new THREE.MeshStandardMaterial({
    name: 'scanner_mri_label',
    map: labelTexture,
    emissiveMap: labelTexture,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.62,
    transparent: true,
    metalness: 0.25,
    roughness: 0.35,
  });
  const mriLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.22),
    labelMaterial,
  );
  mriLabel.position.set(0, 1.9, 0.651);
  gantry.add(mriLabel);

  const emitterBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.03, 0.085),
    matCyan,
  );
  emitterBar.position.set(0, 1.664, 0);
  gantry.add(emitterBar);

  // --- Bewegtes Scan-Lichtband
  const scanGroup = new THREE.Group();
  scanGroup.name = 'scanlichtband';
  scanGroup.position.z = -0.88;
  root.add(scanGroup);

  const upperScanStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.025, 0.09),
    matScan,
  );
  upperScanStrip.position.set(0, 1.52, 0);
  scanGroup.add(upperScanStrip);

  const lowerScanStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.022, 0.08),
    matScan,
  );
  lowerScanStrip.position.set(0, 0.79, 0);
  scanGroup.add(lowerScanStrip);

  const scanVolume = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 0.73, 0.085),
    matScanVolume,
  );
  scanVolume.position.set(0, 1.155, 0);
  scanGroup.add(scanVolume);

  // --- Diagnosekonsole links
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'diagnosekonsole';
  root.add(consoleGroup);

  const consoleFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.08, 0.56),
    kit('wallDark'),
  );
  consoleFoot.position.set(-1.08, 0.04, 0.52);
  consoleGroup.add(consoleFoot);

  const consoleBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.76, 0.42),
    matHull,
  );
  consoleBase.position.set(-1.08, 0.46, 0.52);
  consoleGroup.add(consoleBase);

  const consoleNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.34, 0.2),
    matTrim,
  );
  consoleNeck.position.set(-1.08, 0.98, 0.48);
  consoleGroup.add(consoleNeck);

  const displayEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 1.0, 0.055),
    kit('wallDark'),
  );
  displayEdge.position.set(-1.08, 1.42, 0.755);
  consoleGroup.add(displayEdge);

  const displayCopper = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.94, 0.022),
    kit('copper'),
  );
  displayCopper.position.set(-1.08, 1.42, 0.791);
  consoleGroup.add(displayCopper);

  const screenState = makeScreenState();
  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'scanner_display',
    map: screenState.texture,
    emissiveMap: screenState.texture,
    emissive: 0xffffff,
    emissiveIntensity: 1.05,
    metalness: 0.04,
    roughness: 0.25,
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.88),
    screenMaterial,
  );
  screen.position.set(-1.08, 1.42, 0.807);
  consoleGroup.add(screen);

  const consoleSlotGeometry = new THREE.BoxGeometry(0.3, 0.018, 0.014);
  const consoleSlots = new THREE.InstancedMesh(consoleSlotGeometry, matCyan, 3);
  for (let i = 0; i < 3; i += 1) {
    instanceMatrix.makeTranslation(-1.08, 0.26 + i * 0.11, 0.738);
    consoleSlots.setMatrixAt(i, instanceMatrix);
  }
  consoleSlots.instanceMatrix.needsUpdate = true;
  consoleGroup.add(consoleSlots);

  // --- Technikschrank rechts neben dem Liege
  const utilityCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.86, 0.48),
    matHull,
  );
  utilityCabinet.position.set(1.12, 0.45, 0.1);
  root.add(utilityCabinet);

  const utilityTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.51, 0.08, 0.53),
    kit('wallDark'),
  );
  utilityTop.position.set(1.12, 0.92, 0.1);
  root.add(utilityTop);

  const utilitySlots = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.28, 0.016, 0.014),
    matCyan,
    4,
  );
  for (let i = 0; i < 4; i += 1) {
    instanceMatrix.makeTranslation(1.12, 0.22 + i * 0.12, 0.347);
    utilitySlots.setMatrixAt(i, instanceMatrix);
  }
  utilitySlots.instanceMatrix.needsUpdate = true;
  root.add(utilitySlots);

  // --- Kollisionskörper: nur COL_-Meshes kollidieren
  const colBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.78, 2.24),
    collisionMaterial,
  );
  colBed.name = 'COL_behandlungsliege';
  colBed.position.set(0, 0.39, -0.05);
  root.add(colBed);

  const colConsole = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.94, 0.58),
    collisionMaterial,
  );
  colConsole.name = 'COL_diagnosekonsole';
  colConsole.position.set(-1.08, 0.97, 0.58);
  root.add(colConsole);

  const colCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.98, 0.56),
    collisionMaterial,
  );
  colCabinet.name = 'COL_technikschrank';
  colCabinet.position.set(1.12, 0.49, 0.1);
  root.add(colCabinet);

  const colSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 2.02, 0.44),
    collisionMaterial,
  );
  colSupport.name = 'COL_scannerausleger';
  colSupport.position.set(0.78, 1.01, 0.84);
  root.add(colSupport);

  const colScannerHead = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 0.4, 1.34),
    collisionMaterial,
  );
  colScannerHead.name = 'COL_scannerkopf';
  colScannerHead.position.set(0, 1.88, 0);
  root.add(colScannerHead);

  // --- Benutzen-Punkte
  const useScan = new THREE.Object3D();
  useScan.name = 'INT_scannen';
  useScan.position.set(0, 1.08, 1.3);
  useScan.userData = { label: 'Ganzkörperdiagnose', radius: 0.85 };
  root.add(useScan);

  const useDisplay = new THREE.Object3D();
  useDisplay.name = 'INT_anzeige';
  useDisplay.position.set(-1.08, 1.4, 1.1);
  useDisplay.userData = { label: 'Diagnosebildschirm prüfen', radius: 0.75 };
  root.add(useDisplay);

  // --- Lichter
  const lampScan = new THREE.Object3D();
  lampScan.name = 'LAMP_scanband';
  lampScan.position.set(0, 1.15, 0);
  lampScan.userData = { color: '#baff36', intensity: 7, distance: 3.8 };
  root.add(lampScan);

  const lampDisplay = new THREE.Object3D();
  lampDisplay.name = 'LAMP_display';
  lampDisplay.position.set(-1.08, 1.42, 0.95);
  lampDisplay.userData = { color: '#6fe3ff', intensity: 5, distance: 3.2 };
  root.add(lampDisplay);

  // --- Zustand und Anzeige
  let scanning = false;
  let progress = 0;
  let findings = false;
  let findingText = 'NO ACTIVE ANOMALIES';
  let time = 0;
  let lastScreenUpdate = -1;
  let last = null;

  function drawBodyDiagram(ctx) {
    const cyan = '#5ce8ff';

    ctx.save();
    ctx.strokeStyle = cyan;
    ctx.fillStyle = 'rgba(26, 137, 175, 0.15)';
    ctx.lineWidth = 4;
    ctx.shadowColor = cyan;
    ctx.shadowBlur = 9;

    // Kopf rechts
    ctx.beginPath();
    ctx.ellipse(643, 430, 47, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rumpf
    ctx.beginPath();
    ctx.moveTo(603, 390);
    ctx.lineTo(582, 365);
    ctx.lineTo(527, 372);
    ctx.lineTo(365, 397);
    ctx.lineTo(331, 421);
    ctx.lineTo(363, 452);
    ctx.lineTo(532, 462);
    ctx.lineTo(582, 482);
    ctx.lineTo(603, 455);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arme
    ctx.beginPath();
    ctx.moveTo(575, 377);
    ctx.lineTo(495, 329);
    ctx.lineTo(214, 341);
    ctx.lineTo(186, 360);
    ctx.lineTo(216, 374);
    ctx.lineTo(493, 359);
    ctx.lineTo(560, 396);
    ctx.moveTo(578, 462);
    ctx.lineTo(492, 510);
    ctx.lineTo(214, 499);
    ctx.lineTo(186, 480);
    ctx.lineTo(216, 466);
    ctx.lineTo(493, 481);
    ctx.lineTo(559, 443);
    ctx.stroke();

    // Beine
    ctx.beginPath();
    ctx.moveTo(346, 400);
    ctx.lineTo(265, 385);
    ctx.lineTo(91, 388);
    ctx.lineTo(72, 408);
    ctx.lineTo(91, 427);
    ctx.lineTo(262, 417);
    ctx.lineTo(332, 432);
    ctx.moveTo(346, 435);
    ctx.lineTo(263, 450);
    ctx.lineTo(91, 459);
    ctx.lineTo(72, 481);
    ctx.lineTo(91, 497);
    ctx.lineTo(266, 474);
    ctx.lineTo(335, 448);
    ctx.stroke();
    ctx.restore();

    // Röntgen-Skelett
    ctx.save();
    ctx.strokeStyle = 'rgba(190, 247, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#b9f6ff';
    ctx.shadowBlur = 5;

    ctx.beginPath();
    ctx.moveTo(590, 430);
    ctx.lineTo(350, 424);
    ctx.stroke();

    for (let i = 0; i < 7; i += 1) {
      const x = 545 - i * 24;
      ctx.beginPath();
      ctx.moveTo(x, 392);
      ctx.quadraticCurveTo(x + 9, 425, x, 456);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(366, 407);
    ctx.quadraticCurveTo(342, 424, 366, 443);
    ctx.moveTo(575, 416);
    ctx.quadraticCurveTo(586, 430, 575, 444);
    ctx.moveTo(490, 348);
    ctx.lineTo(213, 350);
    ctx.moveTo(490, 491);
    ctx.lineTo(213, 488);
    ctx.moveTo(350, 418);
    ctx.lineTo(90, 408);
    ctx.moveTo(350, 435);
    ctx.lineTo(90, 479);
    ctx.stroke();
    ctx.restore();
  }

  function drawScreen() {
    const { ctx, canvas } = screenState;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020912';
    ctx.fillRect(0, 0, w, h);

    // Raster
    ctx.strokeStyle = 'rgba(35, 132, 158, 0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Rahmen
    ctx.strokeStyle = '#42d9ee';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, w - 68, h - 68);

    ctx.fillStyle = '#71f0ff';
    ctx.font = 'bold 27px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('ATLANTIS MEDICAL / MRI', 52, 76);

    ctx.font = '19px monospace';
    ctx.fillStyle = '#ffca45';
    ctx.fillText(
      scanning ? 'SCAN IN PROGRESS' : findings ? 'DIAGNOSTIC COMPLETE' : 'SYSTEM READY',
      52,
      108,
    );

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(progress * 100)}%`, w - 54, 108);

    // Diagnosefeld
    ctx.strokeStyle = 'rgba(71, 222, 242, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 160, w - 96, 456);

    drawBodyDiagram(ctx);

    // Rote Befunde
    if (findings || scanning) {
      const alpha = scanning ? 0.55 + Math.sin(time * 8) * 0.2 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff3434';
      ctx.strokeStyle = '#ffd0c0';
      ctx.shadowColor = '#ff1717';
      ctx.shadowBlur = 13;
      ctx.lineWidth = 2;

      for (const point of [[478, 414], [522, 432], [462, 442]]) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Gelb-grüne Scanebene
    if (scanning) {
      const scanX = 125 + progress * 505;
      ctx.save();
      ctx.strokeStyle = '#d2ff43';
      ctx.shadowColor = '#8cff2d';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(scanX, 180);
      ctx.lineTo(scanX, 596);
      ctx.stroke();

      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#9dff34';
      ctx.fillRect(scanX - 7, 180, 14, 416);
      ctx.restore();
    }

    // Status- und Datentexte
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillStyle = '#5ee8f8';
    ctx.fillText('PRIMARY', 53, 664);
    ctx.fillText('SECONDARY', 376, 664);

    ctx.fillStyle = findings ? '#ff5b5b' : '#62e8a0';
    ctx.fillText(findingText, 53, 695);

    ctx.fillStyle = '#a4d9e3';
    ctx.fillText('BLOOD / ORGANS / SKELETON', 376, 695);

    ctx.fillStyle = '#54dff0';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PATIENT RECORD: DR. M. WEIR', 53, 751);

    ctx.font = '17px monospace';
    ctx.fillStyle = '#8db9c4';
    ctx.fillText('SCAN ID: 0907-244', 53, 781);
    ctx.fillText('NANITE MARKERS: 3 ACTIVE', 53, 811);
    ctx.fillText('INTERNAL TRAUMA: MONITOR', 53, 841);
    ctx.fillText('INFECTION MARKERS: CLEAR', 53, 871);

    ctx.strokeStyle = '#42d9ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 724, 664, 171);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffca45';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ATL-009 INFIRMARY', w - 54, 918);

    screenState.texture.needsUpdate = true;
  }

  function startScan() {
    scanning = true;
    progress = 0;
    findings = false;
    findingText = 'ANALYZING SUBJECT';
    drawScreen();
  }

  function stopScan() {
    scanning = false;
    findingText = findings ? findingText : 'SCAN INTERRUPTED';
    drawScreen();
  }

  function clearFindings() {
    scanning = false;
    progress = 0;
    findings = false;
    findingText = 'NO ACTIVE ANOMALIES';
    drawScreen();
  }

  function setFindings(hasFindings) {
    findings = Boolean(hasFindings);
    progress = findings ? 1 : 0;
    findingText = findings ? 'NANITE SIGNALS: DETECTED' : 'NO ACTIVE ANOMALIES';
    drawScreen();
  }

  function update(dt) {
    time += dt;

    if (scanning) {
      progress = Math.min(1, progress + dt / 4.2);
      scanGroup.position.z = THREE.MathUtils.lerp(-0.88, 0.74, progress);

      if (progress >= 1) {
        scanning = false;
        findings = true;
        findingText = 'NANITE SIGNALS: DETECTED';
      }
    } else {
      scanGroup.position.z = THREE.MathUtils.lerp(
        scanGroup.position.z,
        findings ? 0.74 : -0.88,
        Math.min(1, dt * 5),
      );
    }

    const scanIntensity = scanning ? 4.2 + Math.sin(time * 13) * 1.1 : 0;
    matScan.emissiveIntensity +=
      (scanIntensity - matScan.emissiveIntensity) * Math.min(1, dt * 8);
    matScanVolume.opacity +=
      ((scanning ? 0.075 : 0) - matScanVolume.opacity) * Math.min(1, dt * 7);
    matScanVolume.emissiveIntensity = scanning
      ? 1.6 + Math.sin(time * 9) * 0.45
      : 0;

    matCyan.emissiveIntensity = 1.35 + Math.sin(time * 2.1) * 0.28;
    screenMaterial.emissiveIntensity = 0.95 + Math.sin(time * 3.3) * 0.13;

    if (time - lastScreenUpdate > 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      drawScreen();
      lastScreenUpdate = time;
    }
  }

  headMain.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) update(Math.min(now - last, 0.1));
    last = now;
  };

  root.userData.update = update;
  root.userData.api = {
    scan: startScan,
    stop: stopScan,
    clear: clearFindings,
    setFindings,
    get scanning() { return scanning; },
    get progress() { return progress; },
    get findings() { return findings; },
  };

  root.userData.actions = [
    { id: 'scan', label: 'Ganzkörperdiagnose starten', run: startScan },
    { id: 'stop', label: 'Diagnose stoppen', run: stopScan },
    { id: 'clear', label: 'Befunde löschen', run: clearFindings },
  ];

  drawScreen();
  return root;
}

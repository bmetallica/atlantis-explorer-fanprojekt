// OBJ-076: Jumper-Cockpit & Flugsteuerung
// Standobjekt: 3,00 m breit, 2,00 m tief, 2,55 m hoch.
// Ursprung: Mitte der Unterseite; Vorderseite und Fahrtrichtung zeigen nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'jumper_cockpit',
  art: 'Standobjekt',
  masse: '3,00 × 2,00 × 2,55 (B × T × H, m)',
  wohin: 'ATL-040 – Jumper-Bay / Puddle-Jumper-Hangar',
  benutzen: 'INT_hud → Menü zum Ein- und Ausschalten des Head-up-Displays',
  lichter: 'LAMP_hud (eisblau), LAMP_console (bernstein)',
  animation: 'HUD blendet weich ein und aus; türkise Abtastlinie fährt kontinuierlich über die Frontscheibe',
  quelle: 'selbst gebaut nach OBJ-076 und den Referenzbildern',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'jumper_cockpit';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------
  const hullTexture = createHullTexture();
  hullTexture.wrapS = hullTexture.wrapT = THREE.RepeatWrapping;
  hullTexture.repeat.set(2.2, 1.6);
  hullTexture.colorSpace = THREE.SRGBColorSpace;

  const matHull = new THREE.MeshStandardMaterial({
    name: 'jumper_hull',
    color: 0x8a948a,
    map: hullTexture,
    metalness: 0.55,
    roughness: 0.55,
  });
  const matDark = new THREE.MeshStandardMaterial({
    name: 'jumper_dark',
    color: 0x2c312d,
    metalness: 0.35,
    roughness: 0.7,
  });
  const matFrame = new THREE.MeshStandardMaterial({
    name: 'jumper_frame',
    color: 0x3a403b,
    metalness: 0.7,
    roughness: 0.38,
  });
  const matSeat = new THREE.MeshStandardMaterial({
    name: 'jumper_seat',
    color: 0x4a4038,
    metalness: 0.08,
    roughness: 0.92,
  });
  const matAmber = new THREE.MeshStandardMaterial({
    name: 'jumper_amber',
    color: 0xffa040,
    emissive: 0xff7a18,
    emissiveIntensity: 1.1,
    metalness: 0.15,
    roughness: 0.45,
  });
  const matWhite = new THREE.MeshStandardMaterial({
    name: 'jumper_white_key',
    color: 0xe8eee9,
    emissive: 0xd8ffff,
    emissiveIntensity: 0.45,
    metalness: 0.1,
    roughness: 0.5,
  });
  const matCyan = new THREE.MeshStandardMaterial({
    name: 'jumper_cyan',
    color: 0x6fd0ff,
    emissive: 0x32b8ff,
    emissiveIntensity: 1.2,
    metalness: 0.1,
    roughness: 0.35,
  });
  const matGlass = new THREE.MeshStandardMaterial({
    name: 'jumper_glass',
    color: 0x0d1a24,
    metalness: 0.12,
    roughness: 0.2,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    name: 'jumper_console_screen',
    color: 0x071922,
    emissive: 0x1f91b5,
    emissiveIntensity: 0.75,
    metalness: 0.15,
    roughness: 0.4,
  });

  // ------------------------------------------------------------------
  // Grundbau, Boden und rückwärtige Kabinenwand
  // ------------------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, 2), matHull);
  floor.position.y = 0.09;
  root.add(floor);

  const floorInset = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.035, 1.72), matDark);
  floorInset.position.y = 0.195;
  root.add(floorInset);

  const rearBulkhead = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.18, 0.16), matDark);
  rearBulkhead.position.set(0, 0.75, -0.92);
  root.add(rearBulkhead);

  const rearTrim = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.055, 0.035), matCyan);
  rearTrim.position.set(0, 1.19, -0.825);
  root.add(rearTrim);

  const centerPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.66, 0.72), matDark);
  centerPedestal.position.set(0, 0.52, -0.02);
  root.add(centerPedestal);

  // Schulter- und Sitzblenden
  const shoulderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.72, 0.8), matFrame);
  shoulderLeft.position.set(-1.4, 0.56, -0.04);
  shoulderLeft.rotation.z = -0.12;
  root.add(shoulderLeft);

  const shoulderRight = shoulderLeft.clone();
  shoulderRight.position.x = 1.4;
  shoulderRight.rotation.z = 0.12;
  root.add(shoulderRight);

  // Kleine Seitenblenden mit Anzeigen
  for (const side of [-1, 1]) {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.48, 0.52), matDark);
    sidePanel.position.set(side * 1.36, 1.11, 0.19);
    sidePanel.rotation.z = side * -0.08;
    root.add(sidePanel);

    const sideScreen = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.29, 0.34), matScreen);
    sideScreen.position.set(side * 1.255, 1.12, 0.21);
    sideScreen.rotation.z = side * -0.08;
    root.add(sideScreen);

    const sideEdge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.34), matCyan);
    sideEdge.position.set(side * 1.24, 0.96, 0.21);
    root.add(sideEdge);
  }

  // ------------------------------------------------------------------
  // Zwei Sitze
  // ------------------------------------------------------------------
  function createSeat(x, name) {
    const seat = new THREE.Group();
    seat.name = name;
    seat.position.set(x, 0, -0.43);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.28, 16), matFrame);
    pedestal.position.y = 0.35;
    seat.add(pedestal);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.19, 0.59), matSeat);
    cushion.position.y = 0.57;
    seat.add(cushion);

    const cushionSideL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.19, 0.55), matDark);
    cushionSideL.position.set(-0.34, 0.57, 0);
    seat.add(cushionSideL);

    const cushionSideR = cushionSideL.clone();
    cushionSideR.position.x = 0.34;
    seat.add(cushionSideR);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.9, 0.17), matSeat);
    back.position.set(0, 1.05, -0.3);
    back.rotation.x = -0.15;
    seat.add(back);

    const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.97, 0.08), matFrame);
    backFrame.position.set(0, 1.04, -0.4);
    backFrame.rotation.x = -0.15;
    seat.add(backFrame);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.27, 0.19), matSeat);
    headrest.position.set(0, 1.57, -0.39);
    headrest.rotation.x = -0.15;
    seat.add(headrest);

    const headrestFrame = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.08, 0.12), matFrame);
    headrestFrame.position.set(0, 1.72, -0.43);
    headrestFrame.rotation.x = -0.15;
    seat.add(headrestFrame);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.48), matDark);
    armL.position.set(-0.4, 0.83, -0.02);
    seat.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.4;
    seat.add(armR);

    const seatStripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.035), matCyan);
    seatStripe.position.set(0, 1.29, -0.215);
    seatStripe.rotation.x = -0.15;
    seat.add(seatStripe);

    root.add(seat);
    return seat;
  }

  createSeat(-0.72, 'Sitz_Pilot');
  createSeat(0.72, 'Sitz_Kopilot');

  // ------------------------------------------------------------------
  // Schräge Konsolen vor den Sitzen
  // ------------------------------------------------------------------
  function createConsole(x, name, mirror) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0.73, 0.34);
    group.rotation.x = -0.48;

    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.69, 0.1, 0.43), matDark);
    housing.position.y = -0.025;
    group.add(housing);

    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.71, 0.035, 0.045), matFrame);
    edge.position.set(0, 0.025, 0.215);
    group.add(edge);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.018, 0.12), matScreen);
    screen.position.set(mirror ? 0.13 : -0.13, 0.035, -0.12);
    group.add(screen);

    const screenBorder = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.012, 0.14), matCyan);
    screenBorder.position.set(mirror ? 0.13 : -0.13, 0.025, -0.12);
    group.add(screenBorder);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.014), matCyan);
    strip.position.set(0, 0.038, 0.185);
    group.add(strip);

    // Wiederholte Tasten als InstancedMesh
    const amberGeo = new THREE.BoxGeometry(0.052, 0.022, 0.042);
    const amberKeys = new THREE.InstancedMesh(amberGeo, matAmber, 8);
    const matrix = new THREE.Matrix4();
    let index = 0;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const px = mirror ? 0.19 - col * 0.083 : -0.19 + col * 0.083;
        const pz = -0.015 + row * 0.073;
        matrix.makeTranslation(px, 0.057, pz);
        amberKeys.setMatrixAt(index++, matrix);
      }
    }
    amberKeys.instanceMatrix.needsUpdate = true;
    group.add(amberKeys);

    const whiteGeo = new THREE.BoxGeometry(0.045, 0.018, 0.035);
    const whiteKeys = new THREE.InstancedMesh(whiteGeo, matWhite, 4);
    index = 0;

    for (let col = 0; col < 4; col++) {
      const px = mirror ? 0.15 - col * 0.1 : -0.15 + col * 0.1;
      matrix.makeTranslation(px, 0.052, 0.15);
      whiteKeys.setMatrixAt(index++, matrix);
    }
    whiteKeys.instanceMatrix.needsUpdate = true;
    group.add(whiteKeys);

    root.add(group);

    // Sichtbare Konsole steht auf einem festen Träger.
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.36), matFrame);
    support.position.set(x, 0.455, 0.32);
    root.add(support);

    const supportFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.055, 0.46), matDark);
    supportFoot.position.set(x, 0.235, 0.32);
    root.add(supportFoot);

    return group;
  }

  createConsole(-0.72, 'Konsole_Pilot', false);
  createConsole(0.72, 'Konsole_Kopilot', true);

  // ------------------------------------------------------------------
  // Mittelkonsole mit DHD
  // ------------------------------------------------------------------
  const dhdGroup = new THREE.Group();
  dhdGroup.name = 'DHD_Mittelkonsole';
  dhdGroup.position.set(0, 0.84, 0.42);
  dhdGroup.rotation.x = -0.62;
  root.add(dhdGroup);

  const dhdBase = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.08, 0.35), matDark);
  dhdBase.position.y = -0.025;
  dhdGroup.add(dhdBase);

  const dhdRim = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.014, 10, 32), matFrame);
  dhdRim.rotation.x = Math.PI / 2;
  dhdRim.position.y = 0.035;
  dhdGroup.add(dhdRim);

  const dhdButton = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.027, 32), matAmber);
  dhdButton.position.y = 0.035;
  dhdGroup.add(dhdButton);

  const dhdSymbol = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.008, 8, 6), matCyan);
  dhdSymbol.rotation.x = Math.PI / 2;
  dhdSymbol.position.y = 0.052;
  dhdGroup.add(dhdSymbol);

  // Kleine Schalterreihen neben dem DHD
  const toggleGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.055, 10);
  const toggles = new THREE.InstancedMesh(toggleGeo, matFrame, 6);
  const toggleMatrix = new THREE.Matrix4();

  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const n = i % 3;
    toggleMatrix.makeTranslation(side * 0.26, 0.04, -0.1 + n * 0.075);
    toggles.setMatrixAt(i, toggleMatrix);
  }
  toggles.instanceMatrix.needsUpdate = true;
  dhdGroup.add(toggles);

  // ------------------------------------------------------------------
  // Kleine Steuergriffe / Hebel
  // ------------------------------------------------------------------
  function createLever(x, z, side) {
    const group = new THREE.Group();
    group.name = 'Steuerhebel';
    group.position.set(x, 0, z);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.25), matDark);
    foot.position.y = 0.245;
    group.add(foot);

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.09), matFrame);
    post.position.y = 0.55;
    group.add(post);

    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.26), matDark);
    pod.position.y = 0.87;
    group.add(pod);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.23, 12), matFrame);
    stalk.position.set(0, 1.0, 0);
    stalk.rotation.z = side * 0.13;
    group.add(stalk);

    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.105, 4, 12), matDark);
    grip.position.set(side * 0.018, 1.14, 0);
    grip.rotation.z = side * 0.13;
    group.add(grip);

    const button = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 8), matAmber);
    button.position.set(side * 0.018, 1.2, 0.025);
    group.add(button);

    root.add(group);
  }

  createLever(-1.08, 0.03, -1);
  createLever(-0.42, 0.03, 1);
  createLever(0.42, 0.03, -1);
  createLever(1.08, 0.03, 1);

  // ------------------------------------------------------------------
  // Deckenkonsole mit Bernstein-Tasten
  // ------------------------------------------------------------------
  const overhead = new THREE.Group();
  overhead.position.set(0, 2.18, 0.48);
  overhead.rotation.x = 0.3;
  root.add(overhead);

  const overheadPanel = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.13, 0.34), matDark);
  overhead.add(overheadPanel);

  const overheadButtons = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.07, 0.025, 0.055),
    matAmber,
    10
  );
  const overheadMatrix = new THREE.Matrix4();

  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    overheadMatrix.makeTranslation(-0.48 + col * 0.24, 0.077, -0.075 + row * 0.15);
    overheadButtons.setMatrixAt(i, overheadMatrix);
  }
  overheadButtons.instanceMatrix.needsUpdate = true;
  overhead.add(overheadButtons);

  for (const side of [-1, 1]) {
    addTubeBetween(
      root,
      new THREE.Vector3(side * 0.62, 2.12, 0.38),
      new THREE.Vector3(side * 0.62, 2.46, 0.76),
      0.025,
      matFrame
    );
  }

  // ------------------------------------------------------------------
  // Gewölbte, geschlossene Cockpitscheibe
  // ------------------------------------------------------------------
  const canopy = createCanopyGeometry();
  const canopyMesh = new THREE.Mesh(canopy, matGlass);
  canopyMesh.name = 'Frontscheibe';
  root.add(canopyMesh);

  const framePoints = createFramePoints();
  const frameCurve = new THREE.CatmullRomCurve3(framePoints, true, 'centripetal');
  const frameGeometry = new THREE.TubeGeometry(frameCurve, 160, 0.052, 8, true);
  const frame = new THREE.Mesh(frameGeometry, matFrame);
  frame.name = 'Scheibenrahmen';
  root.add(frame);

  const innerFrameCurve = new THREE.CatmullRomCurve3(
    framePoints.map((p) => p.clone().multiplyScalar(0.965).add(new THREE.Vector3(0, 0.018, -0.018))),
    true,
    'centripetal'
  );
  const innerFrame = new THREE.Mesh(
    new THREE.TubeGeometry(innerFrameCurve, 140, 0.018, 6, true),
    matCyan
  );
  root.add(innerFrame);

  addTubeBetween(
    root,
    new THREE.Vector3(-1.43, 0.2, -0.82),
    new THREE.Vector3(-1.43, 1.55, 0.66),
    0.045,
    matFrame
  );
  addTubeBetween(
    root,
    new THREE.Vector3(1.43, 0.2, -0.82),
    new THREE.Vector3(1.43, 1.55, 0.66),
    0.045,
    matFrame
  );

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.1, 0.12), matDark);
  topBeam.position.set(0, 2.48, 0.82);
  topBeam.rotation.x = 0.12;
  root.add(topBeam);

  // ------------------------------------------------------------------
  // HUD-Projektion auf der Frontscheibe
  // ------------------------------------------------------------------
  const hudTexture = createHudTexture();
  hudTexture.colorSpace = THREE.SRGBColorSpace;

  const hudMaterial = new THREE.MeshBasicMaterial({
    map: hudTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 1.34), hudMaterial);
  hudPlane.name = 'HUD_Projektion';
  hudPlane.position.set(0, 1.53, 1.075);
  hudPlane.rotation.y = Math.PI;
  root.add(hudPlane);

  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0x79e8ff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 0.018), scanMaterial);
  scanLine.position.set(0, 0.92, 1.082);
  scanLine.rotation.y = Math.PI;
  root.add(scanLine);

  // Echte schmale Geometrie statt einer gefüllten Fläche.
  const hudFrameMaterial = new THREE.MeshBasicMaterial({
    color: 0x4ccfff,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const hudFrameParts = [
    { size: [2.1, 0.012, 0.006], position: [0, 2.2, 1.078] },
    { size: [2.1, 0.012, 0.006], position: [0, 0.86, 1.078] },
    { size: [0.012, 1.34, 0.006], position: [-1.05, 1.53, 1.078] },
    { size: [0.012, 1.34, 0.006], position: [1.05, 1.53, 1.078] },
  ];

  for (const part of hudFrameParts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...part.size), hudFrameMaterial);
    mesh.position.set(...part.position);
    root.add(mesh);
  }

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  const colFloor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, 2));
  colFloor.name = 'COL_cockpit_boden';
  colFloor.position.y = 0.09;
  colFloor.userData.aktiv = true;
  root.add(colFloor);

  const colPilot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.35, 0.75));
  colPilot.name = 'COL_sitz_pilot';
  colPilot.position.set(-0.72, 0.88, -0.45);
  colPilot.userData.aktiv = true;
  root.add(colPilot);

  const colCopilot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.35, 0.75));
  colCopilot.name = 'COL_sitz_kopilot';
  colCopilot.position.set(0.72, 0.88, -0.45);
  colCopilot.userData.aktiv = true;
  root.add(colCopilot);

  const colConsole = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.42, 0.55));
  colConsole.name = 'COL_mittelkonsole';
  colConsole.position.set(0, 0.75, 0.38);
  colConsole.userData.aktiv = true;
  root.add(colConsole);

  const colLeftSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.15, 1.35));
  colLeftSide.name = 'COL_seitenblende_links';
  colLeftSide.position.set(-1.4, 0.78, -0.1);
  colLeftSide.userData.aktiv = true;
  root.add(colLeftSide);

  const colRightSide = colLeftSide.clone();
  colRightSide.name = 'COL_seitenblende_rechts';
  colRightSide.position.x = 1.4;
  root.add(colRightSide);

  // ------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------------
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_hud';
  usePoint.position.set(0, 1.12, 0.78);
  usePoint.userData = {
    label: 'Jumper-HUD bedienen',
    radius: 0.8,
  };
  root.add(usePoint);

  const hudLamp = new THREE.Object3D();
  hudLamp.name = 'LAMP_hud';
  hudLamp.position.set(0, 1.55, 0.83);
  hudLamp.userData = {
    color: '#6fd0ff',
    intensity: 5,
    distance: 4,
  };
  root.add(hudLamp);

  const consoleLamp = new THREE.Object3D();
  consoleLamp.name = 'LAMP_console';
  consoleLamp.position.set(0, 0.95, 0.45);
  consoleLamp.userData = {
    color: '#ffa040',
    intensity: 2.5,
    distance: 2.2,
  };
  root.add(consoleLamp);

  // ------------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------------
  let hudAktiv = opts.hud !== false;
  let hudOpazitaet = hudAktiv ? 1 : 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    zeit += dt;

    const ziel = hudAktiv ? 1 : 0;
    hudOpazitaet += (ziel - hudOpazitaet) * Math.min(1, dt * 6);

    hudMaterial.opacity = hudOpazitaet;
    hudFrameMaterial.opacity = hudOpazitaet * 0.8;
    scanMaterial.opacity = hudOpazitaet * (0.48 + Math.sin(zeit * 5.5) * 0.2);

    scanLine.position.y = 0.9 + ((zeit * 0.24) % 1.24);

    const puls = 0.85 + Math.sin(zeit * 2.6) * 0.12;
    matCyan.emissiveIntensity = 0.95 + puls * 0.35;
    matAmber.emissiveIntensity = 0.9 + Math.sin(zeit * 3.1 + 0.8) * 0.18;
  }

  canopyMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------------
  // Öffentliche API und Menü
  // ------------------------------------------------------------------
  const api = {
    hudEinschalten() {
      hudAktiv = true;
    },
    hudAusschalten() {
      hudAktiv = false;
    },
    hudUmschalten() {
      hudAktiv = !hudAktiv;
    },
    get hudAktiv() {
      return hudAktiv;
    },
    get hudOpazitaet() {
      return hudOpazitaet;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'hud_ein',
      label: 'HUD einschalten',
      run: () => api.hudEinschalten(),
    },
    {
      id: 'hud_aus',
      label: 'HUD ausschalten',
      run: () => api.hudAusschalten(),
    },
    {
      id: 'hud_umschalten',
      label: 'HUD ein-/ausschalten',
      run: () => api.hudUmschalten(),
    },
  ];

  return root;
}

// --------------------------------------------------------------------
// Hilfsfunktionen
// --------------------------------------------------------------------
function createHullTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#7f8b80';
  ctx.fillRect(0, 0, 512, 512);

  const palette = ['#899489', '#7d887d', '#929b8e', '#768176', '#858f84'];
  const cell = 64;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * cell;
      const y = row * cell;
      const tone = palette[(row * 3 + col * 5) % palette.length];
      ctx.fillStyle = tone;
      ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);

      ctx.strokeStyle = 'rgba(25,30,27,0.72)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);

      ctx.strokeStyle = 'rgba(205,220,205,0.13)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 5, y + 5, cell - 10, cell - 10);
    }
  }

  for (let i = 0; i < 36; i++) {
    const x = (i * 97) % 512;
    const y = (i * 61) % 512;
    ctx.fillStyle = '#454e48';
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createHudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 1024, 512);

  const cyan = '#6fd0ff';
  const pale = '#d5f6ff';
  const green = '#70f09a';
  const yellow = '#ffe477';

  // Äußerer HUD-Rahmen
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(40, 35);
  ctx.lineTo(270, 35);
  ctx.lineTo(300, 15);
  ctx.lineTo(724, 15);
  ctx.lineTo(752, 35);
  ctx.lineTo(984, 35);
  ctx.lineTo(984, 230);
  ctx.lineTo(1010, 250);
  ctx.lineTo(1010, 462);
  ctx.lineTo(14, 462);
  ctx.lineTo(14, 250);
  ctx.lineTo(40, 230);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(111,208,255,0.65)';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 55, 310, 150);
  ctx.strokeRect(390, 55, 252, 150);
  ctx.strokeRect(672, 55, 286, 150);

  // Kopfzeile
  ctx.fillStyle = pale;
  ctx.font = 'bold 22px monospace';
  ctx.fillText('P.U.D.D.L.E. FLIGHT SYSTEM', 66, 31);
  ctx.fillStyle = green;
  ctx.fillText('LINK ONLINE', 790, 30);

  // Linkes Sensorfeld
  ctx.fillStyle = yellow;
  ctx.font = '18px monospace';
  ctx.fillText('ATA-GENE STATUS', 68, 82);
  ctx.fillStyle = pale;
  ctx.font = '16px monospace';
  ctx.fillText('NEURAL INPUT  STABLE', 68, 111);
  ctx.fillText('POWER         NOMINAL', 68, 138);
  ctx.fillText('SUBSPACE     READY', 68, 165);
  ctx.fillText('THRUST VECTOR LOCKED', 68, 192);

  // Mittleres Diagramm
  ctx.fillStyle = yellow;
  ctx.font = '18px monospace';
  ctx.fillText('FLIGHT TELEMETRY', 408, 82);
  ctx.strokeStyle = 'rgba(111,208,255,0.25)';
  ctx.lineWidth = 1;

  for (let i = 0; i < 6; i++) {
    const x = 410 + i * 36;
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, 185);
    ctx.stroke();
  }

  ctx.strokeStyle = green;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < 18; i++) {
    const x = 410 + i * 12;
    const y = 169 - Math.sin(i * 0.72) * 24 - Math.cos(i * 0.21) * 12;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Rechte Navigationsanzeige
  ctx.fillStyle = yellow;
  ctx.font = '18px monospace';
  ctx.fillText('NAVIGATION', 690, 82);
  ctx.fillStyle = pale;
  ctx.font = '16px monospace';
  ctx.fillText('ATLANTIS   14.2 km', 690, 112);
  ctx.fillText('TARGET     LOCKED', 690, 140);
  ctx.fillText('CLOAK      STANDBY', 690, 168);
  ctx.fillText('DRONE      READY', 690, 194);

  // Zentrales Zielreticle
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(512, 300, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(512, 300, 65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(512, 192);
  ctx.lineTo(512, 228);
  ctx.moveTo(512, 372);
  ctx.lineTo(512, 408);
  ctx.moveTo(404, 300);
  ctx.lineTo(440, 300);
  ctx.moveTo(584, 300);
  ctx.lineTo(620, 300);
  ctx.stroke();

  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.arc(512, 300, 8, 0, Math.PI * 2);
  ctx.fill();

  // Systemstatus rechts
  ctx.strokeStyle = 'rgba(111,208,255,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(690, 245, 285, 178);
  ctx.fillStyle = green;
  ctx.font = '17px monospace';
  ctx.fillText('WEAPON ARRAY', 710, 278);
  ctx.fillText('CLOAK GENERATOR', 710, 312);
  ctx.fillText('FLIGHT COMPUTER', 710, 346);
  ctx.fillText('SENSOR ARRAY', 710, 380);

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 2 ? yellow : green;
    ctx.fillRect(900, 263 + i * 34, 55, 9);
  }

  // Kartenraster
  ctx.strokeStyle = 'rgba(111,208,255,0.26)';
  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(52 + i * 34, 245);
    ctx.lineTo(52 + i * 34, 422);
    ctx.stroke();
  }

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(52, 245 + i * 35);
    ctx.lineTo(300, 245 + i * 35);
    ctx.stroke();
  }

  ctx.strokeStyle = green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(65, 390);
  ctx.lineTo(115, 360);
  ctx.lineTo(160, 373);
  ctx.lineTo(205, 310);
  ctx.lineTo(252, 280);
  ctx.stroke();

  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.arc(205, 310, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pale;
  ctx.font = '15px monospace';
  ctx.fillText('ATL-040 / JUMPER BAY', 58, 445);
  ctx.fillText('COURSE LOCK  072.4', 745, 445);

  return new THREE.CanvasTexture(canvas);
}

function createCanopyGeometry() {
  const cols = 30;
  const rows = 22;
  const yBottom = 0.22;
  const yTop = 2.55;
  const positions = [];
  const indices = [];

  function halfWidth(y) {
    if (y < 0.67) {
      const radius = 0.42;
      const distance = Math.min(radius, 0.67 - y);
      return 1.08 + Math.sqrt(Math.max(0, radius * radius - (radius - distance) ** 2));
    }
    if (y > 1.63) {
      const radius = 0.92;
      const distance = Math.min(radius, y - 1.63);
      return 1.5 - radius + Math.sqrt(Math.max(0, radius * radius - distance * distance));
    }
    return 1.5;
  }

  function canopyZ(x, y) {
    const sideCurve = 0.22 * (1 - (x / 1.5) ** 2);
    const topCurve = 0.05 * ((y - yBottom) / (yTop - yBottom));
    return 0.8 + sideCurve - topCurve;
  }

  // Vorder- und Rückfläche
  for (let layer = 0; layer < 2; layer++) {
    for (let row = 0; row <= rows; row++) {
      const v = row / rows;
      const y = yBottom + (yTop - yBottom) * v;
      const hw = halfWidth(y);

      for (let col = 0; col <= cols; col++) {
        const u = col / cols;
        const x = (u * 2 - 1) * hw;
        const z = canopyZ(x, y) - layer * 0.035;
        positions.push(x, y, z);
      }
    }
  }

  const layerSize = (rows + 1) * (cols + 1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = row * (cols + 1) + col;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;

      // Innenfläche nach -Z
      indices.push(a, c, b, b, c, d);

      // Rückfläche nach +Z
      const aa = a + layerSize;
      const bb = b + layerSize;
      const cc = c + layerSize;
      const dd = d + layerSize;
      indices.push(aa, bb, cc, bb, dd, cc);
    }
  }

  // Geschlossene Seitenkanten
  function addSide(a, b) {
    const aa = a + layerSize;
    const bb = b + layerSize;
    const start = positions.length / 3;

    positions.push(
      positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2],
      positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2],
      positions[bb * 3], positions[bb * 3 + 1], positions[bb * 3 + 2],
      positions[aa * 3], positions[aa * 3 + 1], positions[aa * 3 + 2]
    );

    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }

  for (let col = 0; col < cols; col++) {
    addSide(col, col + 1);
    const top = rows * (cols + 1);
    addSide(top + col + 1, top + col);
  }

  for (let row = 0; row < rows; row++) {
    const left = row * (cols + 1);
    const right = left + cols;
    addSide(right, left);
    const bottom = (row + 1) * (cols + 1);
    addSide(bottom, bottom + cols);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createFramePoints() {
  const points = [];
  const zAt = (x) => 0.8 + 0.22 * (1 - (x / 1.5) ** 2) - 0.03;

  function arc(cx, cy, radius, start, end, count) {
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const angle = THREE.MathUtils.lerp(start, end, t);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, zAt(x)));
    }
  }

  points.push(new THREE.Vector3(-1.08, 0.22, zAt(-1.08)));
  points.push(new THREE.Vector3(1.08, 0.22, zAt(1.08)));

  arc(1.08, 0.64, 0.42, -Math.PI / 2, 0, 8);
  points.push(new THREE.Vector3(1.5, 1.63, zAt(1.5)));
  arc(0.58, 1.63, 0.92, 0, Math.PI / 2, 14);
  arc(-0.58, 1.63, 0.92, Math.PI / 2, Math.PI, 14);
  points.push(new THREE.Vector3(-1.5, 0.64, zAt(-1.5)));
  arc(-1.08, 0.64, 0.42, Math.PI, Math.PI * 1.5, 8);

  return points;
}

function addTubeBetween(parent, start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  parent.add(mesh);
  return mesh;
}

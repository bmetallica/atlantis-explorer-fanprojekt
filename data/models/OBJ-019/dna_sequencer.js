// Antiker DNA-Analysator & Zentrifuge — Standobjekt
// Vorderseite +Z, Ursprung = Mitte der Unterseite.
import * as THREE from 'three';

export const steckbrief = {
  name: 'dna_sequencer',
  art: 'Standobjekt',
  masse: '3,32 × 2,50 × 1,04 (B × H × T, m)',
  benutzen: 'INT_analyse / INT_zentrifuge → Menü aus userData.actions',
  lichter: 'LAMP_display (eisblau), LAMP_console (bernstein)',
  animation: 'Sequenzdisplay und LED-Matrix pulsieren; Zentrifugenrotor dreht während der Analyse; Deckel öffnet und schließt weich',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'dna_sequencer';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const matConsole = new THREE.MeshStandardMaterial({
    name: 'labor_dunkelgrau',
    color: 0x252b31,
    metalness: 0.62,
    roughness: 0.34,
  });
  const matConsoleDark = new THREE.MeshStandardMaterial({
    name: 'labor_tiefschwarz',
    color: 0x101418,
    metalness: 0.38,
    roughness: 0.46,
  });
  const matSteel = new THREE.MeshStandardMaterial({
    name: 'labor_stahl',
    color: 0x90999f,
    metalness: 0.88,
    roughness: 0.24,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    name: 'labor_gummi',
    color: 0x171b1d,
    metalness: 0.05,
    roughness: 0.82,
  });
  const matGlass = new THREE.MeshStandardMaterial({
    name: 'labor_blauglas',
    color: 0x8ac8dc,
    metalness: 0.08,
    roughness: 0.12,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const matOrange = new THREE.MeshStandardMaterial({
    name: 'labor_bernstein_led',
    color: 0xff6418,
    emissive: 0xff4208,
    emissiveIntensity: 1.5,
    metalness: 0.15,
    roughness: 0.32,
  });
  const matBlueGlow = new THREE.MeshStandardMaterial({
    name: 'labor_eisblau_leiste',
    color: 0x79dfff,
    emissive: 0x36bfff,
    emissiveIntensity: 1.15,
    metalness: 0.1,
    roughness: 0.3,
  });
  const matSample = new THREE.MeshStandardMaterial({
    name: 'labor_probenrohr',
    color: 0xc9e9ec,
    metalness: 0.05,
    roughness: 0.18,
    transparent: true,
    opacity: 0.84,
  });
  const matSampleFluid = new THREE.MeshStandardMaterial({
    name: 'labor_probenfluessigkeit',
    color: 0xff7a2a,
    emissive: 0xff4d08,
    emissiveIntensity: 0.7,
    metalness: 0,
    roughness: 0.4,
  });

  function box(parent, w, h, d, material, x = 0, y = 0, z = 0, name = '') {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------
  // Langpult: geschlossener Unterbau, Stahlplatte, bronzefarbene Kanten
  // ------------------------------------------------------------
  const body = box(root, 3.2, 0.84, 0.88, matConsole, 0, 0.42, 0, 'pult_unterbau');
  box(root, 3.24, 0.08, 0.94, matSteel, 0, 0.88, 0, 'pult_arbeitsplatte');
  box(root, 3.24, 0.025, 0.96, kit('copper'), 0, 0.835, 0, 'pult_bronze_kante');
  box(root, 3.08, 0.09, 0.8, matConsoleDark, 0, 0.045, 0, 'pult_sockel');
  box(root, 2.86, 0.018, 0.012, matConsoleDark, 0, 0.43, 0.446, 'pult_schattenfuge');

  // Linke Schubladenfront
  for (let i = 0; i < 3; i++) {
    box(
      root, 0.76, 0.2, 0.028, matConsoleDark,
      -1.02, 0.21 + i * 0.24, 0.454,
      `schublade_${i + 1}`
    );
    box(
      root, 0.22, 0.018, 0.026, kit('copper'),
      -1.02, 0.21 + i * 0.24, 0.477,
      `schubladengriff_${i + 1}`
    );
  }

  // Mittige Serviceblende mit Lüftungsschlitzen
  box(root, 0.78, 0.62, 0.025, matConsoleDark, 0, 0.45, 0.456, 'serviceblende');
  for (let i = 0; i < 7; i++) {
    box(
      root, 0.52, 0.018, 0.012, matSteel,
      0, 0.25 + i * 0.065, 0.475,
      `lueftungsschlitz_${i + 1}`
    );
  }

  // Rechte, leicht vorstehende Antiker-Konsole
  box(root, 0.72, 0.62, 0.18, kit('wallDark'), 1.0, 0.46, 0.48, 'antik_konsole');
  box(root, 0.76, 0.035, 0.2, kit('copper'), 1.0, 0.79, 0.48, 'antik_konsole_kante');
  box(root, 0.58, 0.018, 0.018, matOrange, 1.0, 0.7, 0.578, 'antik_konsole_statusleiste');

  // Orangefarbene Statusleiste an der Pultfront
  box(root, 0.52, 0.016, 0.016, matOrange, 0.62, 0.735, 0.478, 'statusleiste');

  // ------------------------------------------------------------
  // Hinterleuchtete Lamellen als rückwärtiger Konsolenrahmen
  // ------------------------------------------------------------
  for (let c = 0; c < 7; c++) {
    const x = (c - 3) * 0.48;
    box(root, 0.42, 1.5, 0.075, kit('wallDark'), x, 1.73, -0.455, `lamelle_${c + 1}`);
  }

  box(root, 3.32, 0.07, 0.09, kit('copper'), 0, 2.5, -0.455, 'lamellen_oberrahmen');
  box(root, 3.32, 0.07, 0.09, kit('copper'), 0, 0.98, -0.455, 'lamellen_unterrahmen');

  const stripeGeometry = new THREE.BoxGeometry(0.34, 0.014, 0.016);
  const stripes = new THREE.InstancedMesh(stripeGeometry, matBlueGlow, 49);
  stripes.name = 'leisten_lamellen';
  const stripeMatrix = new THREE.Matrix4();
  let stripeIndex = 0;
  for (let c = 0; c < 7; c++) {
    const x = (c - 3) * 0.48;
    for (let r = 0; r < 7; r++) {
      stripeMatrix.makeTranslation(x, 1.1 + r * 0.21, -0.41);
      stripes.setMatrixAt(stripeIndex++, stripeMatrix);
    }
  }
  stripes.instanceMatrix.needsUpdate = true;
  root.add(stripes);

  // ------------------------------------------------------------
  // Großes Wanddisplay
  // ------------------------------------------------------------
  box(root, 2.66, 1.08, 0.15, kit('wallDark'), 0, 1.87, -0.385, 'display_gehaeuse');
  box(root, 2.7, 0.035, 0.17, kit('copper'), 0, 1.325, -0.385, 'display_unterkante');
  box(root, 2.7, 0.025, 0.17, kit('copper'), 0, 2.415, -0.385, 'display_oberkante');

  // Tragstreben vom Pult zum Display: nichts schwebt.
  for (const x of [-1.28, 1.28]) {
    box(root, 0.07, 0.42, 0.07, matSteel, x, 1.11, -0.4, 'display_strebe');
    box(root, 0.18, 0.035, 0.16, kit('wallDark'), x, 0.925, -0.4, 'display_streben_fuss');
  }
  box(root, 2.36, 0.018, 0.02, matBlueGlow, 0, 1.3, -0.29, 'display_unterlicht');

  // Kleine Schrauben/Kopfknoten an der Displayfassung
  const boltGeometry = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8);
  const bolts = new THREE.InstancedMesh(boltGeometry, matSteel, 8);
  bolts.name = 'display_schrauben';
  const boltMatrix = new THREE.Matrix4();
  const boltQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  const unitScale = new THREE.Vector3(1, 1, 1);
  let boltIndex = 0;
  for (const x of [-1.24, 1.24]) {
    for (const y of [1.44, 2.3]) {
      boltMatrix.compose(new THREE.Vector3(x, y, -0.302), boltQuat, unitScale);
      bolts.setMatrixAt(boltIndex++, boltMatrix);
    }
  }
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  // Canvas-Textur: tiefe blaue Wellen- und DNA-Sequenzdarstellung
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'dna_display',
    color: 0xd7f5ff,
    map: texture,
    emissive: 0x246ea3,
    emissiveMap: texture,
    emissiveIntensity: 0.85,
    metalness: 0,
    roughness: 0.38,
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.47, 0.91), screenMaterial);
  screen.position.set(0, 1.87, -0.303);
  screen.name = 'display_flaeche';
  root.add(screen);

  // ------------------------------------------------------------
  // Irdisches Analysegerät auf der linken Arbeitsplatte
  // ------------------------------------------------------------
  const analyzer = new THREE.Group();
  analyzer.name = 'probenanalysator';
  analyzer.position.set(-1.04, 0.92, 0.01);
  root.add(analyzer);

  box(analyzer, 0.76, 0.23, 0.5, matConsoleDark, 0, 0.115, 0, 'analysator_gehaeuse');
  box(analyzer, 0.79, 0.035, 0.52, matSteel, 0, 0.247, 0, 'analysator_abdeckung');

  const matAnalyzerScreen = new THREE.MeshStandardMaterial({
    name: 'analysator_kleinbildschirm',
    color: 0x25120a,
    emissive: 0xff4b0a,
    emissiveIntensity: 0.85,
    roughness: 0.5,
  });
  const analyzerScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.27, 0.11),
    matAnalyzerScreen
  );
  analyzerScreen.position.set(-0.17, 0.13, 0.251);
  analyzerScreen.name = 'analysator_kleinbildschirm';
  analyzer.add(analyzerScreen);

  box(analyzer, 0.28, 0.055, 0.018, matRubber, 0.19, 0.085, 0.255, 'proben_einwurfschacht');
  box(root, 0.36, 0.016, 0.025, kit('copper'), -1.04, 0.928, 0.268, 'probenfach');

  box(analyzer, 0.24, 0.02, 0.13, matConsoleDark, -0.03, 0.275, -0.12, 'probenrohr_ausgabefach');

  const smallTubeGeometry = new THREE.CylinderGeometry(0.016, 0.018, 0.085, 10);
  const smallTubes = new THREE.InstancedMesh(smallTubeGeometry, matSample, 4);
  smallTubes.name = 'probenroehre_ausgabefach';
  const smallTubeMatrix = new THREE.Matrix4();
  for (let i = 0; i < 4; i++) {
    smallTubeMatrix.makeTranslation(-0.1 + i * 0.047, 0.327, -0.12);
    smallTubes.setMatrixAt(i, smallTubeMatrix);
  }
  smallTubes.instanceMatrix.needsUpdate = true;
  analyzer.add(smallTubes);

  const smallFluidGeometry = new THREE.CylinderGeometry(0.012, 0.013, 0.035, 8);
  const smallFluids = new THREE.InstancedMesh(smallFluidGeometry, matSampleFluid, 4);
  smallFluids.name = 'probenfluessigkeit_ausgabefach';
  for (let i = 0; i < 4; i++) {
    smallTubeMatrix.makeTranslation(-0.1 + i * 0.047, 0.3, -0.12);
    smallFluids.setMatrixAt(i, smallTubeMatrix);
  }
  smallFluids.instanceMatrix.needsUpdate = true;
  analyzer.add(smallFluids);

  // Orangefarbene LED-Matrix an der Pultfront
  const ledGeometry = new THREE.BoxGeometry(0.035, 0.095, 0.022);
  const leds = new THREE.InstancedMesh(ledGeometry, matOrange, 12);
  leds.name = 'led_matrix';
  const ledMatrix = new THREE.Matrix4();
  const ledQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.28));
  for (let i = 0; i < 12; i++) {
    ledMatrix.compose(
      new THREE.Vector3(-1.31 + i * 0.05, 0.65, 0.487),
      ledQuaternion,
      unitScale
    );
    leds.setMatrixAt(i, ledMatrix);
  }
  leds.instanceMatrix.needsUpdate = true;
  root.add(leds);

  // Kleines Tastenfeld auf der Pultplatte
  const keyGeometry = new THREE.BoxGeometry(0.065, 0.018, 0.052);
  const keys = new THREE.InstancedMesh(keyGeometry, kit('copper'), 12);
  keys.name = 'tastenfeld';
  const keyMatrix = new THREE.Matrix4();
  let keyIndex = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      keyMatrix.makeTranslation(-0.49 + col * 0.095, 0.929, 0.08 + row * 0.095);
      keys.setMatrixAt(keyIndex++, keyMatrix);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  root.add(keys);

  // ------------------------------------------------------------
  // Zentrifuge rechts auf dem Pult
  // ------------------------------------------------------------
  const centrifuge = new THREE.Group();
  centrifuge.name = 'zentrifuge';
  centrifuge.position.set(0.96, 0.92, 0.02);
  root.add(centrifuge);

  const centrifugeBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.34, 0.25, 32),
    matConsoleDark
  );
  centrifugeBase.position.y = 0.125;
  centrifugeBase.name = 'zentrifuge_gehaeuse';
  centrifuge.add(centrifugeBase);

  const centrifugeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.305, 0.025, 10, 40),
    kit('copper')
  );
  centrifugeRing.rotation.x = Math.PI / 2;
  centrifugeRing.position.y = 0.253;
  centrifuge.add(centrifugeRing);

  const controlStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.055, 0.018),
    matOrange
  );
  controlStrip.position.set(0, 0.13, 0.332);
  controlStrip.rotation.x = -0.18;
  centrifuge.add(controlStrip);

  const rotor = new THREE.Group();
  rotor.name = 'zentrifuge_rotor';
  rotor.position.y = 0.252;
  centrifuge.add(rotor);

  const rotorHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.045, 20),
    matSteel
  );
  rotorHub.position.y = 0.022;
  rotor.add(rotorHub);

  const tubeGeometry = new THREE.CylinderGeometry(0.017, 0.019, 0.09, 12);
  const tubes = new THREE.InstancedMesh(tubeGeometry, matSample, 8);
  tubes.name = 'probenroehre';
  const tubeMatrix = new THREE.Matrix4();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    tubeMatrix.makeTranslation(
      Math.cos(angle) * 0.19,
      0.06,
      Math.sin(angle) * 0.19
    );
    tubes.setMatrixAt(i, tubeMatrix);
  }
  tubes.instanceMatrix.needsUpdate = true;
  rotor.add(tubes);

  const fluidGeometry = new THREE.CylinderGeometry(0.012, 0.013, 0.04, 8);
  const fluids = new THREE.InstancedMesh(fluidGeometry, matSampleFluid, 8);
  fluids.name = 'zentrifuge_probenfluessigkeit';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    tubeMatrix.makeTranslation(
      Math.cos(angle) * 0.19,
      0.04,
      Math.sin(angle) * 0.19
    );
    fluids.setMatrixAt(i, tubeMatrix);
  }
  fluids.instanceMatrix.needsUpdate = true;
  rotor.add(fluids);

  // Scharnier und transparenter Deckel
  const lidPivot = new THREE.Group();
  lidPivot.name = 'zentrifuge_deckel_scharnier';
  lidPivot.position.set(0, 0.39, -0.29);
  centrifuge.add(lidPivot);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.305, 0.305, 0.045, 32),
    matGlass
  );
  lid.position.set(0, 0.018, 0.29);
  lid.name = 'zentrifuge_deckel';
  lidPivot.add(lid);

  const lidRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.295, 0.017, 10, 40),
    kit('copper')
  );
  lidRim.rotation.x = Math.PI / 2;
  lidRim.position.set(0, 0.042, 0.29);
  lidPivot.add(lidRim);

  const lidHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.028, 0.045),
    kit('wall')
  );
  lidHandle.position.set(0, 0.065, 0.53);
  lidPivot.add(lidHandle);

  // Kleine Gummifüße unter dem irdischen Analysegerät
  const footGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.012, 10);
  const analyzerFeet = new THREE.InstancedMesh(footGeometry, matRubber, 4);
  analyzerFeet.name = 'analysator_fuesse';
  const footMatrix = new THREE.Matrix4();
  let footIndex = 0;
  for (const x of [-0.31, 0.31]) {
    for (const z of [-0.18, 0.18]) {
      footMatrix.makeTranslation(x, 0.006, z);
      analyzerFeet.setMatrixAt(footIndex++, footMatrix);
    }
  }
  analyzerFeet.instanceMatrix.needsUpdate = true;
  analyzer.add(analyzerFeet);

  // ------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------
  const colPult = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 0.94));
  colPult.name = 'COL_pult';
  colPult.position.set(0, 0.46, 0);
  root.add(colPult);

  const colDisplay = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.12, 0.18));
  colDisplay.name = 'COL_display';
  colDisplay.position.set(0, 1.87, -0.385);
  root.add(colDisplay);

  const colAnalyzer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.53));
  colAnalyzer.name = 'COL_probenanalysator';
  colAnalyzer.position.set(-1.04, 1.06, 0.01);
  root.add(colAnalyzer);

  // Nur der feste Zentrifugenkörper kollidiert; der bewegte Deckel bleibt frei.
  const colCentrifuge = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.28, 0.66));
  colCentrifuge.name = 'COL_zentrifuge';
  colCentrifuge.position.set(0.96, 1.06, 0.02);
  root.add(colCentrifuge);

  // ------------------------------------------------------------
  // Benutzen-Punkte und Lichter
  // ------------------------------------------------------------
  const intAnalyse = new THREE.Object3D();
  intAnalyse.name = 'INT_analyse';
  intAnalyse.position.set(-0.32, 1.08, 0.76);
  intAnalyse.userData = { label: 'DNA-Analyse bedienen', radius: 0.8 };
  root.add(intAnalyse);

  const intZentrifuge = new THREE.Object3D();
  intZentrifuge.name = 'INT_zentrifuge';
  intZentrifuge.position.set(0.98, 1.2, 0.73);
  intZentrifuge.userData = { label: 'Zentrifuge bedienen', radius: 0.7 };
  root.add(intZentrifuge);

  const lampDisplay = new THREE.Object3D();
  lampDisplay.name = 'LAMP_display';
  lampDisplay.position.set(0, 1.88, -0.12);
  lampDisplay.userData = { color: '#6fe3ff', intensity: 7, distance: 4.5 };
  root.add(lampDisplay);

  const lampConsole = new THREE.Object3D();
  lampConsole.name = 'LAMP_console';
  lampConsole.position.set(-0.8, 0.78, 0.58);
  lampConsole.userData = { color: '#ff7a32', intensity: 4, distance: 2.7 };
  root.add(lampConsole);

  // ------------------------------------------------------------
  // Zustand, Displaydarstellung und Animation
  // ------------------------------------------------------------
  let analysing = false;
  let progress = 0;
  let lidOpen = false;
  let lidAngle = 0;
  let rotorAngle = 0;
  let elapsed = 0;
  let screenTimer = 0;
  let lastTime = null;

  const bases = ['A', 'T', 'G', 'C'];
  let sequence = '';

  function makeSequence() {
    let result = '';
    for (let i = 0; i < 42; i++) {
      result += bases[Math.floor(Math.random() * bases.length)];
    }
    return result;
  }
  sequence = makeSequence();

  function drawScreen() {
    const w = canvas.width;
    const h = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#020b18');
    gradient.addColorStop(0.55, '#05223a');
    gradient.addColorStop(1, '#03101f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Raster
    ctx.strokeStyle = 'rgba(45, 140, 190, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 52) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // DNA-Helix
    const helixCenter = 128;
    const amplitude = 66;
    ctx.strokeStyle = '#1789d1';
    ctx.lineWidth = 4;
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (let x = 30; x <= 650; x += 5) {
        const phase = x * 0.025 + elapsed * (analysing ? 1.4 : 0.45);
        const y = helixCenter + Math.sin(phase + strand * Math.PI) * amplitude;
        if (x === 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(67, 184, 236, 0.5)';
    ctx.lineWidth = 2;
    for (let x = 30; x <= 650; x += 14) {
      const phase = x * 0.025 + elapsed * (analysing ? 1.4 : 0.45);
      const y1 = helixCenter + Math.sin(phase) * amplitude;
      const y2 = helixCenter - Math.sin(phase) * amplitude;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }

    // Wellen-/Sequenzdiagramm
    ctx.strokeStyle = '#35b9ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 28; x <= 990; x += 4) {
      const y = 300 + Math.sin(x * 0.021 + elapsed * 2.2) * 28
        + Math.sin(x * 0.057 - elapsed * 1.1) * 10;
      if (x === 28) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ff7a32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 28; x <= 990; x += 5) {
      const y = 344 + Math.sin(x * 0.04 + elapsed * 1.7) * 14;
      if (x === 28) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Kopfzeile
    ctx.fillStyle = '#b9ecff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('ATA-GEN / ERREGER-SCAN', 30, 42);

    ctx.font = '19px monospace';
    ctx.fillStyle = '#54b8e6';
    ctx.fillText('SAMPLE: FLAGSALLUS-07', 30, 72);
    ctx.fillText('CHAIN: ' + sequence.slice(0, 24), 30, 98);

    // Status und Fortschritt
    let status = 'BEREIT';
    if (analysing) status = 'GENANALYSE LAEUFT';
    else if (progress >= 1) status = 'ERGEBNIS VORLAEUFIG';

    ctx.fillStyle = analysing ? '#ff9b55' : '#75dcff';
    ctx.font = 'bold 21px monospace';
    ctx.fillText(status, 704, 52);

    ctx.strokeStyle = '#2d7ca5';
    ctx.lineWidth = 2;
    ctx.strokeRect(704, 73, 270, 24);
    ctx.fillStyle = analysing ? '#ff7a32' : '#46bfff';
    ctx.fillRect(707, 76, 264 * progress, 18);

    ctx.fillStyle = '#70a8c6';
    ctx.font = '17px monospace';
    ctx.fillText(`${Math.round(progress * 100)}%`, 704, 122);

    // Basenreihe
    ctx.font = 'bold 20px monospace';
    for (let i = 0; i < 42; i++) {
      const x = 30 + i * 23.2;
      const active = i / 42 < progress;
      ctx.fillStyle = active ? '#2389c4' : '#123b58';
      ctx.fillRect(x, 375, 20, 28);
      ctx.fillStyle = active ? '#d7f6ff' : '#56839c';
      ctx.fillText(sequence[i], x + 2, 396);
    }

    texture.needsUpdate = true;
  }

  drawScreen();

  function update(dt) {
    elapsed += dt;
    screenTimer += dt;

    if (analysing) {
      progress = Math.min(1, progress + dt / 8);
      rotorAngle += dt * 13;
      if (progress >= 1) {
        analysing = false;
        sequence = makeSequence();
      }
    } else {
      rotorAngle += dt * 0.18;
    }

    const targetLid = lidOpen ? -1.08 : 0;
    lidAngle += (targetLid - lidAngle) * Math.min(1, dt * 6.5);
    lidPivot.rotation.x = lidAngle;
    rotor.rotation.y = rotorAngle;

    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.2);
    matOrange.emissiveIntensity = analysing ? 1.4 + pulse * 1.2 : 0.75 + pulse * 0.4;
    matBlueGlow.emissiveIntensity = 0.65 + pulse * 0.55;
    matSampleFluid.emissiveIntensity = analysing ? 1.1 + pulse * 0.7 : 0.45;
    matAnalyzerScreen.emissiveIntensity = analysing ? 1.5 + pulse * 0.6 : 0.55 + pulse * 0.3;
    screenMaterial.emissiveIntensity = analysing ? 1.15 : 0.72 + pulse * 0.16;

    if (screenTimer >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      screenTimer = 0;
      drawScreen();
    }
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    startAnalyse() {
      analysing = true;
      progress = 0;
      lidOpen = false;
      sequence = makeSequence();
      return { ok: true, status: 'Genanalyse gestartet' };
    },
    stopAnalyse() {
      analysing = false;
      return { ok: true, status: 'Genanalyse gestoppt' };
    },
    toggleLid() {
      if (analysing) api.stopAnalyse();
      lidOpen = !lidOpen;
      return { ok: true, status: lidOpen ? 'Deckel geöffnet' : 'Deckel geschlossen' };
    },
    reset() {
      analysing = false;
      progress = 0;
      lidOpen = false;
      sequence = makeSequence();
      return { ok: true, status: 'Gerät zurückgesetzt' };
    },
    get analysing() { return analysing; },
    get progress() { return progress; },
    get lidOpen() { return lidOpen; },
    get status() {
      if (analysing) return 'Genanalyse läuft';
      if (progress >= 1) return 'Analyse abgeschlossen';
      return 'Bereit';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'genanalyse_start',
      label: 'Genanalyse starten',
      run: () => api.startAnalyse(),
    },
    {
      id: 'genanalyse_stop',
      label: 'Genanalyse stoppen',
      run: () => api.stopAnalyse(),
    },
    {
      id: 'zentrifuge_deckel',
      label: 'Zentrifugendeckel öffnen / schließen',
      run: () => api.toggleLid(),
    },
    {
      id: 'reset',
      label: 'Gerät zurücksetzen',
      run: () => api.reset(),
    },
  ];

  return root;
}

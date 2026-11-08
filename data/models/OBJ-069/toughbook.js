import * as THREE from 'three';

// Panasonic Toughbook CF-29, offenes rugged Expedition-Terminal.
// 1 Einheit = 1 Meter; Vorderkante und Tragegriff zeigen nach +Z.

function magnesiumMaterial() {
  return new THREE.MeshStandardMaterial({
    name: 'Toughbook_Magnesium',
    color: 0xb9bec0,
    metalness: 0.68,
    roughness: 0.46
  });
}

function rubberMaterial() {
  return new THREE.MeshStandardMaterial({
    name: 'Toughbook_Gummi',
    color: 0x101315,
    metalness: 0.02,
    roughness: 0.92
  });
}

function darkPlasticMaterial() {
  return new THREE.MeshStandardMaterial({
    name: 'Toughbook_Kunststoff',
    color: 0x202529,
    metalness: 0.14,
    roughness: 0.67
  });
}

function createDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050a10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0a1b28';
  ctx.fillRect(0, 0, canvas.width, 45);
  ctx.fillStyle = '#8bdfff';
  ctx.font = 'bold 21px monospace';
  ctx.fillText('EXPEDITION TERMINAL  /  CF-29', 18, 29);
  ctx.fillStyle = '#4c8098';
  ctx.font = '15px monospace';
  ctx.fillText('FIELD UNIT 04', 785, 28);

  ctx.fillStyle = '#11394c';
  ctx.fillRect(18, 62, 573, 31);
  ctx.fillStyle = '#d3f3ff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('ANCIENT CONTROL NETWORK', 30, 84);

  ctx.fillStyle = '#06131c';
  ctx.fillRect(18, 105, 573, 326);
  ctx.strokeStyle = '#173e50';
  ctx.lineWidth = 1;
  for (let y = 119; y < 431; y += 24) {
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(591, y);
    ctx.stroke();
  }
  for (let x = 18; x <= 591; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 105);
    ctx.lineTo(x, 431);
    ctx.stroke();
  }

  ctx.strokeStyle = '#55c9ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const samples = 52;
  for (let i = 0; i <= samples; i++) {
    const x = 25 + i * 10.8;
    const envelope = Math.sin(i * 0.19) * Math.sin(i * 0.071);
    const y = 250 - envelope * 72 - Math.sin(i * 0.83) * 13;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#2a8eb5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, 250);
  ctx.lineTo(591, 250);
  ctx.stroke();

  ctx.fillStyle = '#0d2b3a';
  ctx.fillRect(613, 62, 329, 112);
  ctx.fillStyle = '#8bdfff';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('SIGNAL MATRIX', 628, 87);

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 1 ? '#54c9ef' : '#174253';
    ctx.fillRect(628 + i * 60, 105 + i * 5, 45, 40 - i * 5);
  }

  ctx.fillStyle = '#07141d';
  ctx.fillRect(613, 190, 329, 241);
  ctx.fillStyle = '#a5e6fb';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('UPLINK       STABLE', 630, 220);
  ctx.fillStyle = '#6596aa';
  ctx.font = '15px monospace';
  ctx.fillText('POWER        84%', 630, 252);
  ctx.fillText('THERMAL      NOMINAL', 630, 282);
  ctx.fillText('ENV          LAB-01', 630, 312);
  ctx.fillText('AUTH         MCKAY', 630, 342);
  ctx.fillText('DATA LINK    READY', 630, 372);
  ctx.fillText('ANCIENT NODE 07', 630, 402);

  ctx.fillStyle = '#0d2633';
  ctx.fillRect(0, 493, canvas.width, 47);
  ctx.fillStyle = '#79d8fa';
  ctx.font = '15px monospace';
  ctx.fillText('CF-29   13.3 in   1600 x 900', 18, 522);
  ctx.fillStyle = '#4f8196';
  ctx.fillText('PANASONIC TOUGHBOOK', 742, 522);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createBrandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1b1e20';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Panasonic', 256, 43);
  ctx.fillStyle = '#727a7e';
  ctx.font = '22px sans-serif';
  ctx.fillText('TOUGHBOOK', 256, 74);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createKeyboardLegendTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Back'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', 'Enter'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter', 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift', 'Shift', 'Shift'],
    ['Ctrl', 'Fn', 'Alt', 'Space', 'Space', 'Space', 'Space', 'Alt', 'Ctrl', 'Left', 'Down', 'Up', 'Right', 'PgUp']
  ];

  ctx.fillStyle = '#d8dde0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px monospace';

  for (let row = 0; row < rows.length; row++) {
    const y = 515 - row * 103;
    for (let column = 0; column < rows[row].length; column++) {
      const x = 42 + column * 86;
      const label = rows[row][column];
      ctx.fillStyle = label.length > 5 ? '#aeb6ba' : '#e0e4e6';
      ctx.fillText(label, x, y);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const steckbrief = {
  name: 'toughbook',
  art: 'Standobjekt',
  masse: '3,5 kg; geschlossen ca. 30 × 28 × 6 cm',
  wohin: 'Arbeitsplatten in Kontrollräumen und Laboren, bevorzugt neben Antiker-Konsolen oder Kristall-Analysegeräten',
  benutzen: 'INT_analyse → Analyse- und Diagnosemenü',
  lichter: 'LAMP_bildschirm (eisblau), dauerhaft aktiv; Status-LED am Gehäuse',
  animation: 'Display pulsiert; laufende Analyse zeigt einen Fortschrittsbalken und wechselt die LED-Farbe; Ein-/Ausschalten blendet das Display weich',
  quelle: 'selbst gebaut nach Panasonic Toughbook CF-29'
};

export function create() {
  const root = new THREE.Group();
  root.name = 'toughbook';

  const magnesium = magnesiumMaterial();
  const rubber = rubberMaterial();
  const plastic = darkPlasticMaterial();

  const portBlue = new THREE.MeshStandardMaterial({
    name: 'Toughbook_PortBlau',
    color: 0x123e55,
    metalness: 0.24,
    roughness: 0.52
  });

  const hingeMaterial = new THREE.MeshStandardMaterial({
    name: 'Scharnier',
    color: 0x777e82,
    metalness: 0.64,
    roughness: 0.43
  });

  const keyMaterial = new THREE.MeshStandardMaterial({
    name: 'Tastenkappe',
    color: 0x252a2d,
    metalness: 0.05,
    roughness: 0.78
  });

  // --- Unteres Gehäuse
  const lowerShell = new THREE.Mesh(
    new THREE.BoxGeometry(0.302, 0.036, 0.242),
    rubber
  );
  lowerShell.name = 'Gehaeuse_unten';
  lowerShell.position.set(0, 0.018, 0);
  lowerShell.castShadow = true;
  lowerShell.receiveShadow = true;
  root.add(lowerShell);

  const magnesiumDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.284, 0.014, 0.218),
    magnesium
  );
  magnesiumDeck.name = 'Magnesium_Tastaturplatte';
  magnesiumDeck.position.set(0, 0.041, -0.004);
  magnesiumDeck.castShadow = true;
  magnesiumDeck.receiveShadow = true;
  root.add(magnesiumDeck);

  const frontWedge = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.011, 0.031),
    magnesium
  );
  frontWedge.name = 'Gehaeuse_vorne';
  frontWedge.position.set(0, 0.047, 0.096);
  root.add(frontWedge);

  // Gummierte Stoßecken
  const cornerPositions = [
    [-0.142, -0.104],
    [0.142, -0.104],
    [-0.142, 0.104],
    [0.142, 0.104]
  ];
  cornerPositions.forEach(([x, z], i) => {
    const corner = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.050, 0.034),
      rubber
    );
    corner.name = `Gummiecke_${i + 1}`;
    corner.position.set(x, 0.027, z);
    corner.castShadow = true;
    root.add(corner);
  });

  // Kleine Verriegelungen an der Vorderkante
  [-0.122, 0.122].forEach((x, i) => {
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.016, 0.024),
      plastic
    );
    latch.name = `Verschluss_${i + 1}`;
    latch.position.set(x, 0.050, 0.107);
    root.add(latch);
  });

  // --- Tastaturfeld
  const keyboardBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.244, 0.010, 0.122),
    plastic
  );
  keyboardBed.name = 'Tastaturfeld';
  keyboardBed.position.set(0, 0.052, -0.035);
  root.add(keyboardBed);

  const keyGeometry = new THREE.BoxGeometry(0.0142, 0.006, 0.0165);
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, 14 * 5);
  keys.name = 'Tasten';
  keys.castShadow = true;

  const dummy = new THREE.Object3D();
  let instance = 0;
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 14; column++) {
      const x = (column - 6.5) * 0.0167;
      const z = -0.077 + row * 0.021;
      dummy.position.set(x, 0.0595, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      keys.setMatrixAt(instance, dummy.matrix);
      instance++;
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  root.add(keys);

  const functionKeys = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.014, 0.005, 0.010),
    keyMaterial,
    12
  );
  functionKeys.name = 'Funktionstasten';
  for (let i = 0; i < 12; i++) {
    dummy.position.set((i - 5.5) * 0.0182, 0.059, -0.097);
    dummy.updateMatrix();
    functionKeys.setMatrixAt(i, dummy.matrix);
  }
  functionKeys.instanceMatrix.needsUpdate = true;
  root.add(functionKeys);

  // Aufgedruckte Tastenbeschriftungen
  const keyboardLegend = new THREE.Mesh(
    new THREE.PlaneGeometry(0.240, 0.112),
    new THREE.MeshBasicMaterial({
      name: 'Tastenbeschriftung',
      map: createKeyboardLegendTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false
    })
  );
  keyboardLegend.name = 'Tastenbeschriftung';
  keyboardLegend.geometry.rotateX(-Math.PI / 2);
  keyboardLegend.position.set(0, 0.0631, -0.035);
  root.add(keyboardLegend);

  // --- Touchpad
  const touchpadBorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.078, 0.006, 0.054),
    rubber
  );
  touchpadBorder.name = 'Touchpad_Rahmen';
  touchpadBorder.position.set(-0.026, 0.051, 0.064);
  root.add(touchpadBorder);

  const touchpad = new THREE.Mesh(
    new THREE.BoxGeometry(0.067, 0.004, 0.043),
    new THREE.MeshStandardMaterial({
      name: 'Touchpad_Flaeche',
      color: 0x4c5357,
      metalness: 0.23,
      roughness: 0.49
    })
  );
  touchpad.name = 'Touchpad';
  touchpad.position.set(-0.026, 0.055, 0.064);
  root.add(touchpad);

  const mouseButtons = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.022, 0.004, 0.010),
    keyMaterial,
    2
  );
  mouseButtons.name = 'Touchpad_Tasten';
  dummy.position.set(-0.039, 0.056, 0.041);
  dummy.updateMatrix();
  mouseButtons.setMatrixAt(0, dummy.matrix);
  dummy.position.set(-0.013, 0.056, 0.041);
  dummy.updateMatrix();
  mouseButtons.setMatrixAt(1, dummy.matrix);
  mouseButtons.instanceMatrix.needsUpdate = true;
  root.add(mouseButtons);

  // Lautsprecherraster
  const speakerGeometry = new THREE.BoxGeometry(0.003, 0.002, 0.003);
  const speakerMaterial = new THREE.MeshStandardMaterial({
    name: 'Lautsprecherloch',
    color: 0x080a0b,
    roughness: 0.96
  });
  const speakers = new THREE.InstancedMesh(speakerGeometry, speakerMaterial, 18);
  speakers.name = 'Lautsprecher';
  for (let i = 0; i < 18; i++) {
    const column = i % 3;
    const row = Math.floor(i / 3);
    dummy.position.set(0.063 + column * 0.008, 0.051, 0.047 + row * 0.008);
    dummy.updateMatrix();
    speakers.setMatrixAt(i, dummy.matrix);
  }
  speakers.instanceMatrix.needsUpdate = true;
  root.add(speakers);

  // --- Vorderer Tragegriff mit sichtbarer Öffnung
  const handleGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.176, 0.016, 0.018),
    magnesium
  );
  handleGrip.name = 'Tragegriff';
  handleGrip.position.set(0, 0.039, 0.158);
  handleGrip.castShadow = true;
  root.add(handleGrip);

  const handlePad = new THREE.Mesh(
    new THREE.BoxGeometry(0.110, 0.018, 0.021),
    rubber
  );
  handlePad.name = 'Tragegriff_Gummiauflage';
  handlePad.position.set(0, 0.039, 0.160);
  root.add(handlePad);

  [-0.083, 0.083].forEach((x, i) => {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.014, 0.031),
      magnesium
    );
    arm.name = `Tragegriff_Arm_${i + 1}`;
    arm.position.set(x, 0.039, 0.141);
    root.add(arm);

    const pivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.020, 16),
      hingeMaterial
    );
    pivot.name = `Tragegriff_Drehpunkt_${i + 1}`;
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(x, 0.039, 0.127);
    root.add(pivot);
  });

  // --- Seitliche Anschlüsse und Funkmodul
  const portGeometry = new THREE.BoxGeometry(0.006, 0.018, 0.032);
  const portPositions = [
    [0.151, 0.029, -0.070],
    [0.151, 0.029, -0.029],
    [0.151, 0.030, 0.013],
    [0.151, 0.031, 0.050]
  ];
  portPositions.forEach(([x, y, z], i) => {
    const port = new THREE.Mesh(portGeometry, i === 1 ? portBlue : rubber);
    port.name = `Seitenanschluss_${i + 1}`;
    port.position.set(x, y, z);
    root.add(port);
  });

  const radioCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.010, 0.048, 0.078),
    rubber
  );
  radioCover.name = 'Funkmodul_Abdeckung';
  radioCover.position.set(0.148, 0.038, -0.078);
  root.add(radioCover);

  // --- Statusanzeige und Einschaltknopf
  const ledMaterial = new THREE.MeshStandardMaterial({
    name: 'Status_LED',
    color: 0x4acfff,
    emissive: 0x40d8ff,
    emissiveIntensity: 1.6,
    roughness: 0.25
  });
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.0035, 10, 8),
    ledMaterial
  );
  led.name = 'Statusanzeige';
  led.position.set(0.096, 0.052, 0.092);
  root.add(led);

  const powerButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.003, 16),
    rubber
  );
  powerButton.name = 'Einschaltknopf';
  powerButton.position.set(0.116, 0.050, 0.085);
  root.add(powerButton);

  // --- Scharniere
  [-0.083, 0.083].forEach((x, i) => {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.090, 18),
      hingeMaterial
    );
    hinge.name = `Scharnier_${i + 1}`;
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 0.052, -0.110);
    root.add(hinge);

    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.013, 0.022),
      plastic
    );
    bracket.name = `Scharnierhalter_${i + 1}`;
    bracket.position.set(x, 0.048, -0.102);
    root.add(bracket);
  });

  // --- Displaygruppe, nach leicht hinten geneigt
  const displayPivot = new THREE.Group();
  displayPivot.name = 'Bildschirm_Scharniergruppe';
  displayPivot.position.set(0, 0.049, -0.111);
  displayPivot.rotation.x = -0.12;
  root.add(displayPivot);

  const screenHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.302, 0.205, 0.027),
    magnesium
  );
  screenHousing.name = 'Bildschirmgehaeuse';
  screenHousing.position.set(0, 0.1025, 0);
  screenHousing.castShadow = true;
  displayPivot.add(screenHousing);

  const screenInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.284, 0.182, 0.006),
    rubber
  );
  screenInset.name = 'Display_Blende';
  screenInset.position.set(0, 0.106, 0.014);
  displayPivot.add(screenInset);

  const displayTexture = createDisplayTexture();
  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'Display_aktiv',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0x5ccfff,
    emissiveMap: displayTexture,
    emissiveIntensity: 0.52,
    roughness: 0.38,
    metalness: 0.02
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.270, 0.162),
    screenMaterial
  );
  screen.name = 'Display';
  screen.position.set(0, 0.108, 0.0175);
  displayPivot.add(screen);

  // Gummierte Ecken des Bildschirmgehäuses
  const displayCornerPositions = [
    [-0.141, 0.012],
    [0.141, 0.012],
    [-0.141, 0.191],
    [0.141, 0.191]
  ];
  displayCornerPositions.forEach(([x, y], i) => {
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.020, 0.022, 0.031),
      rubber
    );
    bumper.name = `Bildschirm_Gummiecke_${i + 1}`;
    bumper.position.set(x, y, 0.001);
    displayPivot.add(bumper);
  });

  const brandMaterial = new THREE.MeshBasicMaterial({
    name: 'Panasonic_Logo',
    map: createBrandTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false
  });
  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(0.090, 0.016),
    brandMaterial
  );
  brand.name = 'Herstellerlogo';
  brand.position.set(0, 0.008, 0.0145);
  displayPivot.add(brand);

  const camera = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 16),
    plastic
  );
  camera.name = 'Webcam';
  camera.rotation.x = Math.PI / 2;
  camera.position.set(0, 0.199, 0.015);
  displayPivot.add(camera);

  // --- Fortschrittsbalken auf dem Display
  const progressGeometry = new THREE.BoxGeometry(0.244, 0.003, 0.001);
  progressGeometry.translate(0.122, 0, 0);
  const progressMaterial = new THREE.MeshBasicMaterial({
    name: 'Analyse_Fortschritt',
    color: 0x6fe3ff,
    transparent: true,
    opacity: 0.92,
    toneMapped: false
  });
  const progressBar = new THREE.Mesh(progressGeometry, progressMaterial);
  progressBar.name = 'Analyse_Fortschrittsbalken';
  progressBar.position.set(-0.122, 0.031, 0.019);
  progressBar.scale.x = 0.001;
  progressBar.visible = false;
  displayPivot.add(progressBar);

  // --- Kollisionskörper
  const baseCollision = new THREE.Mesh(
    new THREE.BoxGeometry(0.306, 0.062, 0.248)
  );
  baseCollision.name = 'COL_basis';
  baseCollision.position.set(0, 0.031, 0);
  baseCollision.userData.aktiv = true;
  root.add(baseCollision);

  const screenCollision = new THREE.Mesh(
    new THREE.BoxGeometry(0.304, 0.210, 0.040)
  );
  screenCollision.name = 'COL_bildschirm';
  screenCollision.position.set(0, 0.150, -0.123);
  screenCollision.rotation.x = -0.12;
  screenCollision.userData.aktiv = true;
  root.add(screenCollision);

  // --- Benutzen-Punkt und dauerhaftes Bildschirmlicht
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_analyse';
  usePoint.position.set(0, 0.270, 0.260);
  usePoint.userData = {
    label: 'Toughbook bedienen',
    radius: 0.8
  };
  root.add(usePoint);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_bildschirm';
  lamp.position.set(0, 0.110, 0.043);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 0.9,
    distance: 0.75
  };
  displayPivot.add(lamp);

  // --- Zustand und Animation
  let scanTarget = '';
  let scanProgress = 0;
  let scanning = false;
  let completed = false;
  let powered = true;
  let elapsed = 0;
  let lastTime = null;

  const api = {
    analyse(target = 'Antiker-System') {
      if (!powered) this.powerOn();
      scanTarget = target;
      scanProgress = 0;
      scanning = true;
      completed = false;
    },
    analysiere(target = 'Antiker-System') {
      this.analyse(target);
    },
    diagnose() {
      this.analyse('Erd-Systemdiagnose');
    },
    stopScan() {
      scanning = false;
    },
    powerOn() {
      powered = true;
    },
    powerOff() {
      powered = false;
      scanning = false;
      progressBar.visible = false;
    },
    togglePower() {
      if (powered) this.powerOff();
      else this.powerOn();
    },
    get scanProgress() {
      return scanProgress;
    },
    get scanTarget() {
      return scanTarget;
    },
    get isScanning() {
      return scanning;
    },
    get completed() {
      return completed;
    },
    get powered() {
      return powered;
    },
    get status() {
      if (!powered) return 'Ausgeschaltet';
      if (scanning) return `Analyse läuft: ${scanTarget}`;
      if (completed) return `Analyse abgeschlossen: ${scanTarget}`;
      return 'Bereit';
    }
  };

  function update(dt) {
    elapsed += dt;

    if (powered && scanning) {
      scanProgress = Math.min(1, scanProgress + dt / 6);
      if (scanProgress >= 1) {
        scanning = false;
        completed = true;
      }
    }

    const crystalScan = scanTarget.includes('Kristall');
    const pulse = 0.48 + Math.sin(elapsed * 2.2) * 0.06;

    screenMaterial.emissiveIntensity = powered
      ? (scanning ? pulse + 0.22 : pulse)
      : 0;
    screenMaterial.color.setHex(powered ? 0xffffff : 0x20262a);
    screenMaterial.emissive.setHex(crystalScan ? 0xffb35a : 0x5ccfff);

    progressBar.visible = powered && scanProgress > 0 && (scanning || completed);
    progressBar.scale.x = Math.max(0.001, scanProgress);
    progressMaterial.color.setHex(crystalScan ? 0xffb35a : 0x6fe3ff);

    ledMaterial.emissive.setHex(!powered
      ? 0x000000
      : crystalScan
        ? 0xffa83c
        : 0x40d8ff);
    ledMaterial.emissiveIntensity = !powered
      ? 0
      : scanning
        ? 1.4 + Math.abs(Math.sin(elapsed * 5.5)) * 2.0
        : completed
          ? 2.6
          : 1.25;
  }

  screen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'analyse_konsole',
      label: 'Antiker-Konsole analysieren',
      run: () => api.analyse('Antiker-Konsole')
    },
    {
      id: 'analyse_kristall',
      label: 'Kristall-Signal scannen',
      run: () => api.analyse('Antiker-Kristall')
    },
    {
      id: 'diagnose',
      label: 'Erd-Systemdiagnose starten',
      run: () => api.diagnose()
    },
    {
      id: 'stopp',
      label: 'Laufende Analyse stoppen',
      run: () => api.stopScan()
    },
    {
      id: 'power',
      label: 'Toughbook ein-/ausschalten',
      run: () => api.togglePower()
    }
  ];

  return root;
}

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'crystal_reader',
  art: 'Standobjekt / Kristall-Programmierwerkplatz',
  masse: '0,72 × 0,98 × 0,38 m (B × H × T); Lesegerät 0,40 × 0,30 m; Tischhöhe 0,76 m',
  wohin: 'ATL-014 Wissenschaftslabor; ATL-018 Labor von Radek Zelenka',
  benutzen: 'INT_bedienen → Kristall auslesen, Programm kopieren und Kristall umprogrammieren',
  lichter: 'LAMP_kristall (eisblau), LAMP_laptop (eisblau)',
  animation: 'Slot-Beleuchtung pulsiert; Scanlinie fährt über den Kristall; Fortschrittsanzeige und Laptop-Diagnose wechseln bei Lesen, Kopieren und Programmieren',
  quelle: 'selbst gebaut (Spielergänzung)',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'crystal_reader';

  const matPearl = kit('pillar');
  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matFloor = kit('floor');

  const matSteel = new THREE.MeshStandardMaterial({
    name: 'LAB_stahl',
    color: 0x252e35,
    metalness: 0.82,
    roughness: 0.32,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    name: 'LAB_kabel',
    color: 0x11161a,
    metalness: 0.08,
    roughness: 0.72,
  });
  const matBlueGlow = new THREE.MeshStandardMaterial({
    name: 'LAB_blau',
    color: 0x8be5ff,
    emissive: 0x39bfff,
    emissiveIntensity: 1.35,
    metalness: 0.12,
    roughness: 0.2,
  });
  const matStatus = new THREE.MeshStandardMaterial({
    name: 'LAB_status',
    color: 0x70dfff,
    emissive: 0x39bfff,
    emissiveIntensity: 1.2,
    metalness: 0.08,
    roughness: 0.22,
  });
  const matSlot = new THREE.MeshStandardMaterial({
    name: 'LAB_slot',
    color: 0x07131c,
    metalness: 0.5,
    roughness: 0.34,
  });
  const matCrystal = new THREE.MeshStandardMaterial({
    name: 'LAB_kristall',
    color: 0x9ae8ff,
    emissive: 0x178dcc,
    emissiveIntensity: 0.65,
    metalness: 0.12,
    roughness: 0.12,
    transparent: true,
    opacity: 0.88,
  });
  const matProgress = new THREE.MeshStandardMaterial({
    name: 'LAB_fortschritt',
    color: 0x8ceaff,
    emissive: 0x35c8ff,
    emissiveIntensity: 1.7,
    metalness: 0.05,
    roughness: 0.24,
  });
  const matScan = new THREE.MeshStandardMaterial({
    name: 'LAB_scan',
    color: 0xe2fbff,
    emissive: 0x66ddff,
    emissiveIntensity: 2.4,
    metalness: 0.05,
    roughness: 0.18,
  });

  // Zustand
  let crystalPresent = true;
  let mode = 'idle';
  let progress = 0;
  let readComplete = false;
  let copyComplete = false;
  let programComplete = false;
  let time = 0;
  let lastTime = null;
  let lastScreenKey = '';

  // ------------------------------------------------------------------
  // Arbeitstisch: 0,72 × 0,38 m, Oberkante bei 0,76 m
  // ------------------------------------------------------------------
  const table = new THREE.Group();
  table.name = 'LAB_tisch';
  root.add(table);

  const top = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.38), matFloor);
  top.position.set(0, 0.74, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);

  const edgeProfile = new THREE.Mesh(new THREE.BoxGeometry(0.725, 0.018, 0.385), matRail);
  edgeProfile.position.set(0, 0.716, 0);
  edgeProfile.castShadow = true;
  table.add(edgeProfile);

  const legX = [-0.32, 0.32];
  const legZ = [-0.15, 0.15];

  for (const x of legX) {
    for (const z of legZ) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.035), matSteel);
      leg.position.set(x, 0.36, z);
      leg.castShadow = true;
      table.add(leg);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.03, 0.018, 12), matRubber);
      foot.position.set(x, 0.009, z);
      foot.castShadow = true;
      table.add(foot);
    }
  }

  const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.022, 0.3), matDark);
  lowerShelf.position.set(0, 0.18, 0);
  lowerShelf.castShadow = true;
  lowerShelf.receiveShadow = true;
  table.add(lowerShelf);

  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.1, 0.25), matWall);
  drawer.position.set(0.19, 0.235, 0);
  drawer.castShadow = true;
  table.add(drawer);

  const drawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.018), matRail);
  drawerHandle.position.set(0.19, 0.235, 0.133);
  table.add(drawerHandle);

  const supplyCase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.24), matDark);
  supplyCase.position.set(-0.17, 0.236, 0);
  supplyCase.castShadow = true;
  table.add(supplyCase);

  const supplyLabel = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.008, 0.035), matCopper);
  supplyLabel.position.set(-0.17, 0.284, 0.08);
  table.add(supplyLabel);

  // ------------------------------------------------------------------
  // Kristall-Lesegerät: 0,40 × 0,30 m
  // ------------------------------------------------------------------
  const reader = new THREE.Group();
  reader.name = 'LAB_kristallleser';
  reader.position.set(-0.18, 0.76, 0.015);
  root.add(reader);

  const readerBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.3), matWall);
  readerBase.position.y = 0.03;
  readerBase.castShadow = true;
  readerBase.receiveShadow = true;
  reader.add(readerBase);

  const readerSockel = new THREE.Mesh(new THREE.BoxGeometry(0.365, 0.018, 0.265), matDark);
  readerSockel.position.y = 0.067;
  readerSockel.castShadow = true;
  reader.add(readerSockel);

  const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.022, 0.018), matCopper);
  frontTrim.position.set(0, 0.032, 0.145);
  reader.add(frontTrim);

  // Geschlossene, leicht nach hinten ansteigende Bedienfläche.
  const panel = new THREE.Group();
  panel.position.set(0, 0.079, 0.01);
  panel.rotation.x = 0.3;
  reader.add(panel);

  const panelCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.018, 0.22), matPearl);
  panelCarrier.castShadow = true;
  panelCarrier.receiveShadow = true;
  panel.add(panelCarrier);

  const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.365, 0.009, 0.225), matCopper);
  panelFrame.position.y = 0.007;
  panel.add(panelFrame);

  // Zwei breite Aufnahmeschlitzen für flache Kristallplättchen.
  for (const slotZ of [-0.055, 0.055]) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.005, 0.045), matSlot);
    slot.position.set(0, 0.014, slotZ);
    panel.add(slot);

    for (const stripeZ of [slotZ - 0.026, slotZ + 0.026]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.004, 0.004), matBlueGlow);
      stripe.position.set(0, 0.015, stripeZ);
      panel.add(stripe);
    }

    for (const side of [-1, 1]) {
      const contact = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.009, 0.018), matCopper);
      contact.position.set(side * 0.159, 0.018, slotZ);
      panel.add(contact);
    }
  }

  // Flaches Kristallplättchen im vorderen Slot.
  const crystal = new THREE.Group();
  crystal.name = 'LAB_kristallplatte';
  crystal.position.set(0, 0.014, 0.055);
  panel.add(crystal);

  const crystalBody = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.008, 0.032), matCrystal);
  crystalBody.castShadow = true;
  crystal.add(crystalBody);

  const crystalTrace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.003, 0.004), matBlueGlow);
  crystalTrace.position.y = 0.0055;
  crystal.add(crystalTrace);

  for (let i = 0; i < 5; i++) {
    const contact = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.003, 0.026), matRail);
    contact.position.set(-0.06 + i * 0.03, -0.0045, 0);
    crystal.add(contact);
  }

  // Fortschrittsbalken und Scanlinie liegen auf der geneigten Fläche.
  const progressBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.004, 0.007), matProgress);
  progressBar.position.set(-0.15, 0.024, 0.096);
  progressBar.scale.x = 0.001;
  progressBar.visible = false;
  panel.add(progressBar);

  const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.041), matScan);
  scanBar.position.set(-0.16, 0.027, 0.055);
  scanBar.visible = false;
  panel.add(scanBar);

  // Drei robuste Bedienknöpfe am vorderen Rand.
  const buttonGeometry = new THREE.BoxGeometry(0.035, 0.008, 0.019);
  const buttons = new THREE.InstancedMesh(buttonGeometry, matDark, 3);
  const buttonDummy = new THREE.Object3D();

  for (let i = 0; i < 3; i++) {
    buttonDummy.position.set(-0.095 + i * 0.095, 0.022, 0.096);
    buttonDummy.updateMatrix();
    buttons.setMatrixAt(i, buttonDummy.matrix);
  }
  buttons.instanceMatrix.needsUpdate = true;
  panel.add(buttons);

  // Frontseitige Statusleuchte.
  const statusLight = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), matStatus);
  statusLight.position.set(0.165, 0.064, 0.142);
  reader.add(statusLight);

  const statusRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 24), matCopper);
  statusRing.rotation.x = Math.PI / 2;
  statusRing.position.set(0.165, 0.06, 0.142);
  reader.add(statusRing);

  // Kabelanschluss an der rechten Seite des Lesegeräts.
  const readerPlug = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.024), matSteel);
  readerPlug.position.set(0.204, 0.034, -0.065);
  reader.add(readerPlug);

  const portGlow = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.008, 0.015), matBlueGlow);
  portGlow.position.set(0.213, 0.034, -0.065);
  reader.add(portGlow);

  // ------------------------------------------------------------------
  // Kompakter Laptop rechts auf dem Arbeitstisch
  // ------------------------------------------------------------------
  const laptop = new THREE.Group();
  laptop.name = 'LAB_laptop';
  laptop.position.set(0.19, 0.76, 0.015);
  root.add(laptop);

  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.21), matSteel);
  laptopBase.position.y = 0.009;
  laptopBase.castShadow = true;
  laptopBase.receiveShadow = true;
  laptop.add(laptopBase);

  const laptopDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.288, 0.003, 0.198),
    new THREE.MeshStandardMaterial({
      name: 'LAB_laptopdeck',
      color: 0x38434b,
      metalness: 0.75,
      roughness: 0.42,
    })
  );
  laptopDeck.position.y = 0.0195;
  laptop.add(laptopDeck);

  const keyGeometry = new THREE.BoxGeometry(0.019, 0.004, 0.016);
  const keyMaterial = new THREE.MeshStandardMaterial({
    name: 'LAB_tasten',
    color: 0x111a20,
    metalness: 0.18,
    roughness: 0.56,
  });
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, 40);
  keys.name = 'KEY_laptoptasten';
  const keyDummy = new THREE.Object3D();
  let keyIndex = 0;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      keyDummy.position.set(-0.113 + col * 0.025, 0.023, 0.006 + row * 0.021);
      keyDummy.updateMatrix();
      keys.setMatrixAt(keyIndex++, keyDummy.matrix);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  const touchpad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.002, 0.042), matRubber);
  touchpad.position.set(0, 0.022, 0.078);
  laptop.add(touchpad);

  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 0.018, -0.094);
  screenGroup.rotation.x = -0.12;
  laptop.add(screenGroup);

  const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.205, 0.018), matSteel);
  screenFrame.position.set(0, 0.1025, 0);
  screenFrame.castShadow = true;
  screenGroup.add(screenFrame);

  // Dynamische Diagnoseoberfläche.
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  function drawLaptopScreen() {
    const key = [
      mode,
      Math.round(progress * 100),
      readComplete ? 1 : 0,
      copyComplete ? 1 : 0,
      programComplete ? 1 : 0,
      crystalPresent ? 1 : 0,
    ].join(':');

    if (key === lastScreenKey) return;
    lastScreenKey = key;

    ctx.fillStyle = '#06121b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#123246';
    ctx.fillRect(0, 0, canvas.width, 48);
    ctx.fillStyle = '#83eaff';
    ctx.fillRect(24, 17, 214, 9);
    ctx.fillRect(25, 30, 132, 4);

    const amber = programComplete || mode === 'programmieren';
    const statusColor = amber ? '#ffb35d' : '#6fe3ff';

    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 72, 350, 250);

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('INTERFACE READER', 43, 101);

    ctx.fillStyle = '#7ba5b7';
    ctx.font = '16px sans-serif';
    ctx.fillText('CRYSTAL CONTROL', 43, 130);
    ctx.fillText('PORT', 43, 166);
    ctx.fillText('MODE', 43, 197);
    ctx.fillText('SIGNAL', 43, 228);
    ctx.fillText('BUFFER', 43, 259);

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 17px monospace';
    ctx.fillText(crystalPresent ? 'CRYSTAL A' : 'EMPTY', 150, 166);
    ctx.fillText(
      mode === 'idle' ? (programComplete ? 'READY' : 'STANDBY') : mode.toUpperCase(),
      150,
      197
    );
    ctx.fillText(`${Math.round(progress * 100)}%`, 150, 228);
    ctx.fillText(copyComplete ? 'COPY OK' : '--', 150, 259);

    ctx.fillStyle = '#173e50';
    ctx.fillRect(42, 287, 310, 12);
    ctx.fillStyle = statusColor;
    ctx.fillRect(42, 287, 310 * progress, 12);

    // Kristall-/Datendiagramm rechts
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(470, 158);
    ctx.lineTo(520, 112);
    ctx.lineTo(575, 158);
    ctx.lineTo(520, 211);
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(520, 158);
      ctx.lineTo(520 + Math.cos(angle) * 45, 158 + Math.sin(angle) * 53);
      ctx.stroke();
    }

    ctx.fillStyle = '#173e50';
    ctx.fillRect(405, 285, 200, 12);
    ctx.fillStyle = statusColor;
    ctx.fillRect(405, 285, 200 * progress, 12);

    ctx.fillStyle = '#65a9bd';
    ctx.font = '13px monospace';
    ctx.fillText('ATL // CRYSTAL LAB', 405, 35);
    ctx.fillStyle = '#8aeaff';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(25 + i * 78, 350, 52, 5);
    }

    screenTexture.needsUpdate = true;
  }

  const screenTexture = new THREE.CanvasTexture(canvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'LAB_laptopbild',
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 1.05,
    metalness: 0,
    roughness: 0.38,
  });

  // Geschlossener, sehr flacher Bildschirmkörper; nur die Frontfläche trägt das Bild.
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.276, 0.169, 0.003),
    [matSteel, matSteel, matSteel, matSteel, screenMaterial, matSteel]
  );
  screen.position.set(0, 0.106, 0.0105);
  screenGroup.add(screen);

  const camera = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 12), matRubber);
  camera.rotation.x = Math.PI / 2;
  camera.position.set(0, 0.008, 0.010);
  screenGroup.add(camera);

  const laptopPlug = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.013, 0.014), matSteel);
  laptopPlug.position.set(0.185, 0.768, -0.096);
  root.add(laptopPlug);

  // ------------------------------------------------------------------
  // Datenkabel zwischen Lesegerät und Laptop
  // ------------------------------------------------------------------
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.026, 0.794, -0.05),
    new THREE.Vector3(0.06, 0.772, -0.145),
    new THREE.Vector3(0.115, 0.767, -0.17),
    new THREE.Vector3(0.17, 0.767, -0.135),
    new THREE.Vector3(0.185, 0.768, -0.102),
  ]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 36, 0.0045, 7, false),
    matRubber
  );
  cable.castShadow = true;
  root.add(cable);

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  const colTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.38));
  colTop.name = 'COL_tischplatte';
  colTop.position.set(0, 0.74, 0);
  root.add(colTop);

  for (const x of legX) {
    for (const z of legZ) {
      const colLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04));
      colLeg.name = 'COL_tischbein';
      colLeg.position.set(x, 0.36, z);
      root.add(colLeg);
    }
  }

  const colReader = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.3));
  colReader.name = 'COL_kristallleser';
  colReader.position.set(-0.18, 0.835, 0.015);
  root.add(colReader);

  const colLaptop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.21));
  colLaptop.name = 'COL_laptopbasis';
  colLaptop.position.set(0.19, 0.769, 0.015);
  root.add(colLaptop);

  const colScreen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.205, 0.022));
  colScreen.name = 'COL_laptopschirm';
  colScreen.position.set(0.19, 0.88, -0.094);
  root.add(colScreen);

  // ------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(-0.18, 0.88, 0.36);
  use.userData = { label: 'Kristall-Leser bedienen', radius: 0.8 };
  root.add(use);

  const lampCrystal = new THREE.Object3D();
  lampCrystal.name = 'LAMP_kristall';
  lampCrystal.position.set(-0.18, 0.88, 0.05);
  lampCrystal.userData = { color: '#6fe3ff', intensity: 5, distance: 1.4 };
  root.add(lampCrystal);

  const lampLaptop = new THREE.Object3D();
  lampLaptop.name = 'LAMP_laptop';
  lampLaptop.position.set(0.19, 0.93, 0.01);
  lampLaptop.userData = { color: '#6fe3ff', intensity: 2.5, distance: 0.8 };
  root.add(lampLaptop);

  // ------------------------------------------------------------------
  // Bedienlogik und Animation
  // ------------------------------------------------------------------
  function begin(modeName) {
    if (!crystalPresent) return false;

    mode = modeName;
    progress = 0;
    readComplete = false;
    copyComplete = false;
    programComplete = false;
    return true;
  }

  const api = {
    auslesen() {
      return begin('lesen');
    },
    kopieren() {
      return begin('kopieren');
    },
    programmieren() {
      return begin('programmieren');
    },
    kristallEinlegen() {
      crystalPresent = true;
      crystal.visible = true;
      mode = 'idle';
      progress = 0;
      return true;
    },
    kristallEntnehmen() {
      crystalPresent = false;
      crystal.visible = false;
      mode = 'idle';
      progress = 0;
      readComplete = false;
      copyComplete = false;
      programComplete = false;
      progressBar.visible = false;
      scanBar.visible = false;
      return true;
    },
    get mode() { return mode; },
    get progress() { return progress; },
    get crystalPresent() { return crystalPresent; },
    get readComplete() { return readComplete; },
    get copyComplete() { return copyComplete; },
    get programComplete() { return programComplete; },
  };

  function update(dt) {
    time += dt;

    const active = mode !== 'idle';

    if (active) {
      const speed = mode === 'programmieren' ? 0.32 : 0.45;
      progress = Math.min(1, progress + dt * speed);

      if (progress >= 1) {
        if (mode === 'lesen') readComplete = true;
        if (mode === 'kopieren') copyComplete = true;
        if (mode === 'programmieren') programComplete = true;
        mode = 'idle';
      }
    }

    progressBar.visible = active;
    progressBar.scale.x = Math.max(0.001, progress);
    progressBar.position.x = -0.15 + 0.15 * progress;

    scanBar.visible = active;
    if (active) {
      const phase = (time * 0.75) % 1;
      scanBar.position.x = -0.16 + phase * 0.32;
    }

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    matBlueGlow.emissiveIntensity = 1 + pulse * 0.55;
    matCrystal.emissiveIntensity = 0.5 + pulse * 0.35 + (active ? 0.7 : 0);
    matProgress.emissiveIntensity = 1.4 + pulse * 0.7;

    if (programComplete) {
      matStatus.color.setHex(0xffb060);
      matStatus.emissive.setHex(0xffa23c);
      matStatus.emissiveIntensity = 1.3 + pulse * 0.7;
    } else if (active) {
      matStatus.color.setHex(0xd7f7ff);
      matStatus.emissive.setHex(mode === 'programmieren' ? 0xffa23c : 0x39bfff);
      matStatus.emissiveIntensity = 2.2;
    } else {
      matStatus.color.setHex(0x70dfff);
      matStatus.emissive.setHex(0x39bfff);
      matStatus.emissiveIntensity = 0.8 + pulse * 0.4;
    }

    drawLaptopScreen();
  }

  top.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  drawLaptopScreen();

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'auslesen',
      label: 'Kristall auslesen',
      run: () => api.auslesen(),
    },
    {
      id: 'kopieren',
      label: 'Programm kopieren',
      run: () => api.kopieren(),
    },
    {
      id: 'programmieren',
      label: 'Kristall umprogrammieren',
      run: () => api.programmieren(),
    },
    {
      id: 'einlegen',
      label: 'Kristall einlegen',
      run: () => api.kristallEinlegen(),
    },
    {
      id: 'entnehmen',
      label: 'Kristall entnehmen',
      run: () => api.kristallEntnehmen(),
    },
  ];

  return root;
}

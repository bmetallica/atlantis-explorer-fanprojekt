import * as THREE from 'three';

export const steckbrief = {
  name: 'coffee_station',
  art: 'Standobjekt',
  masse: '2,80 × 1,70 × 0,90 (B × H × T, m)',
  wohin: 'ATL-018 Labor von Radek Zelenka, ATL-025 Kantine / Speisesaal',
  benutzen: 'INT_kaffee → Espresso zubereiten, Kaffee trinken und Moral-Buff aktivieren',
  lichter: 'LAMP_status (eisblau), LAMP_ausgabe (bernstein), LAMP_regal (eisblau)',
  animation: 'Anzeige und Statuslicht pulsieren, Espressobezug füllt die Tasse, Dampf steigt weich auf, Moral-Buff pulsiert',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'coffee_station';

  // ------------------------------------------------------------
  // Materialien: irdische Küchengeräte, perlgraue und bronzene Akzente
  // ------------------------------------------------------------
  const materials = {
    cabinet: new THREE.MeshStandardMaterial({
      name: 'coffee_cabinet',
      color: 0xd2d6d4,
      metalness: 0.32,
      roughness: 0.38,
    }),
    cabinetDark: new THREE.MeshStandardMaterial({
      name: 'coffee_cabinet_dark',
      color: 0x59656b,
      metalness: 0.55,
      roughness: 0.42,
    }),
    worktop: new THREE.MeshStandardMaterial({
      name: 'coffee_worktop',
      color: 0x9aa5a9,
      metalness: 0.86,
      roughness: 0.26,
    }),
    steel: new THREE.MeshStandardMaterial({
      name: 'coffee_brushed_steel',
      color: 0xb9c2c4,
      metalness: 0.91,
      roughness: 0.24,
    }),
    chrome: new THREE.MeshStandardMaterial({
      name: 'coffee_chrome',
      color: 0xe0e7e8,
      metalness: 0.97,
      roughness: 0.12,
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      name: 'coffee_dark_steel',
      color: 0x252d32,
      metalness: 0.78,
      roughness: 0.31,
    }),
    shell: new THREE.MeshStandardMaterial({
      name: 'coffee_machine_shell',
      color: 0x151b20,
      metalness: 0.68,
      roughness: 0.23,
    }),
    bronze: new THREE.MeshStandardMaterial({
      name: 'coffee_bronze',
      color: 0xa8763f,
      metalness: 0.78,
      roughness: 0.32,
    }),
    rubber: new THREE.MeshStandardMaterial({
      name: 'coffee_rubber',
      color: 0x111417,
      metalness: 0.02,
      roughness: 0.76,
    }),
    ceramic: new THREE.MeshStandardMaterial({
      name: 'coffee_ceramic',
      color: 0xeee9df,
      metalness: 0.02,
      roughness: 0.2,
    }),
    ceramicBlue: new THREE.MeshStandardMaterial({
      name: 'coffee_ceramic_blue',
      color: 0x2c6a86,
      metalness: 0.04,
      roughness: 0.22,
    }),
    coffee: new THREE.MeshStandardMaterial({
      name: 'coffee_coffee',
      color: 0x211008,
      metalness: 0.01,
      roughness: 0.19,
    }),
    coffeeFill: new THREE.MeshStandardMaterial({
      name: 'coffee_espresso_fill',
      color: 0x321709,
      metalness: 0.01,
      roughness: 0.16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
    milk: new THREE.MeshStandardMaterial({
      name: 'coffee_milk',
      color: 0xf1eee4,
      metalness: 0,
      roughness: 0.34,
    }),
    amber: new THREE.MeshStandardMaterial({
      name: 'coffee_amber',
      color: 0xb96822,
      metalness: 0.05,
      roughness: 0.24,
    }),
    glass: new THREE.MeshStandardMaterial({
      name: 'coffee_glass',
      color: 0x9bd7e6,
      metalness: 0.06,
      roughness: 0.08,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
    paper: new THREE.MeshStandardMaterial({
      name: 'coffee_paper',
      color: 0xe5e0d4,
      metalness: 0,
      roughness: 0.82,
    }),
    status: new THREE.MeshStandardMaterial({
      name: 'coffee_statusleuchte',
      color: 0x8cecff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.8,
      metalness: 0.15,
      roughness: 0.22,
    }),
    buff: new THREE.MeshStandardMaterial({
      name: 'coffee_moral_led',
      color: 0xffc16c,
      emissive: 0xffa23c,
      emissiveIntensity: 0.25,
      metalness: 0.15,
      roughness: 0.25,
    }),
  };

  function mesh(geometry, material, x, y, z, parent = root, name = '') {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z);
    if (name) result.name = name;
    parent.add(result);
    return result;
  }

  function instanced(geometry, material, count, name, parent = root) {
    const result = new THREE.InstancedMesh(geometry, material, count);
    result.name = name;
    parent.add(result);
    return result;
  }

  const dummy = new THREE.Object3D();
  function setInstance(im, index, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    im.setMatrixAt(index, dummy.matrix);
  }

  function closedLathe(points, segments = 24) {
    const profile = points.map((p) => new THREE.Vector2(p[0], p[1]));
    return new THREE.LatheGeometry(profile, segments);
  }

  // ------------------------------------------------------------
  // Tresenkorpus und Sockel
  // Ursprung: Mitte der Unterseite, Vorderseite nach +Z
  // ------------------------------------------------------------
  const plinth = mesh(
    new THREE.BoxGeometry(2.58, 0.08, 0.72),
    materials.cabinetDark,
    0,
    0.04,
    -0.025,
    root,
    'Sockel'
  );

  const cabinet = mesh(
    new THREE.BoxGeometry(2.76, 0.78, 0.84),
    materials.cabinet,
    0,
    0.47,
    0,
    root,
    'Tresenkorpus'
  );

  mesh(new THREE.BoxGeometry(2.80, 0.08, 0.90), materials.worktop, 0, 0.90, 0, root, 'Arbeitsplatte');
  mesh(new THREE.BoxGeometry(2.80, 0.018, 0.90), materials.chrome, 0, 0.944, 0, root, 'Kantenprofil');

  // Schranktüren, Fugen und Griffe
  for (let i = 0; i < 3; i++) {
    const x = -0.91 + i * 0.91;

    mesh(
      new THREE.BoxGeometry(0.84, 0.66, 0.026),
      materials.cabinet,
      x,
      0.47,
      0.425,
      root,
      `Schranktür_${i + 1}`
    );

    mesh(
      new THREE.BoxGeometry(0.82, 0.018, 0.03),
      materials.cabinetDark,
      x,
      0.78,
      0.442,
      root
    );

    mesh(
      new THREE.BoxGeometry(0.24, 0.016, 0.032),
      materials.chrome,
      x,
      0.72,
      0.45,
      root
    );

    mesh(
      new THREE.BoxGeometry(0.015, 0.16, 0.023),
      materials.bronze,
      x + 0.08,
      0.55,
      0.449,
      root
    );
  }

  // Rückwand mit schmaler bronzener Zierleiste
  const backPanel = mesh(
    new THREE.BoxGeometry(2.72, 0.72, 0.055),
    materials.cabinetDark,
    0,
    1.31,
    -0.422,
    root,
    'Rueckwand'
  );

  mesh(new THREE.BoxGeometry(2.68, 0.014, 0.016), materials.bronze, 0, 1.655, -0.386, root);
  mesh(new THREE.BoxGeometry(2.68, 0.012, 0.014), materials.status, 0, 1.632, -0.383, root);

  // ------------------------------------------------------------
  // Espressomaschine
  // ------------------------------------------------------------
  const machine = new THREE.Group();
  machine.name = 'Espressomaschine';
  machine.position.set(-0.84, 0.95, -0.04);
  root.add(machine);

  const machineBody = mesh(
    new THREE.BoxGeometry(0.94, 0.58, 0.46),
    materials.shell,
    0,
    0.29,
    -0.07,
    machine,
    'Espressomaschine_Gehaeuse'
  );

  mesh(new THREE.BoxGeometry(0.98, 0.045, 0.50), materials.chrome, 0, 0.602, -0.06, machine);
  mesh(new THREE.BoxGeometry(0.82, 0.38, 0.028), materials.darkSteel, 0, 0.34, 0.172, machine);

  // Tassenwärmer
  mesh(new THREE.BoxGeometry(0.78, 0.012, 0.35), materials.darkSteel, 0, 0.633, -0.04, machine);

  const warmerBars = instanced(
    new THREE.BoxGeometry(0.024, 0.012, 0.30),
    materials.chrome,
    11,
    'Tassenwaermer_Staebe',
    machine
  );

  for (let i = 0; i < 11; i++) {
    setInstance(warmerBars, i, -0.33 + i * 0.066, 0.643, -0.04);
  }
  warmerBars.instanceMatrix.needsUpdate = true;

  // Brühgruppe, Siebträger und Dampflanze
  const groupHead = mesh(
    new THREE.CylinderGeometry(0.078, 0.084, 0.10, 24),
    materials.chrome,
    0,
    0.205,
    0.205,
    machine
  );
  groupHead.rotation.x = Math.PI / 2;

  mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 24), materials.bronze, 0, 0.175, 0.267, machine);

  const portafilter = mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.19, 16),
    materials.rubber,
    0,
    0.135,
    0.35,
    machine
  );
  portafilter.rotation.x = Math.PI / 2;

  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 16), materials.chrome, 0, 0.135, 0.263, machine);

  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.27, 14), materials.chrome, 0.335, 0.19, 0.14, machine);
  const steamWand = mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.13, 14),
    materials.chrome,
    0.335,
    0.075,
    0.19,
    machine
  );
  steamWand.rotation.x = -0.5;
  mesh(new THREE.SphereGeometry(0.045, 16, 12), materials.bronze, 0.34, 0.35, 0.13, machine);

  // Manometer
  const gauge = mesh(
    new THREE.CylinderGeometry(0.064, 0.064, 0.022, 24),
    materials.chrome,
    -0.235,
    0.445,
    0.19,
    machine
  );
  gauge.rotation.x = Math.PI / 2;

  const gaugeFace = mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.007, 24),
    materials.paper,
    -0.235,
    0.445,
    0.204,
    machine
  );
  gaugeFace.rotation.x = Math.PI / 2;

  const gaugeNeedle = mesh(
    new THREE.BoxGeometry(0.006, 0.043, 0.005),
    materials.amber,
    -0.235,
    0.453,
    0.210,
    machine
  );
  gaugeNeedle.rotation.z = -0.55;

  // Digitalanzeige
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 320;
  displayCanvas.height = 112;
  const displayContext = displayCanvas.getContext('2d');
  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;

  const displayMaterial = new THREE.MeshStandardMaterial({
    name: 'coffee_display',
    map: displayTexture,
    emissiveMap: displayTexture,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.2,
    metalness: 0.08,
    roughness: 0.28,
  });

  function setDisplay(text, color = '#8cecff') {
    displayContext.fillStyle = '#03141c';
    displayContext.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayContext.strokeStyle = color;
    displayContext.lineWidth = 4;
    displayContext.strokeRect(4, 4, displayCanvas.width - 8, displayCanvas.height - 8);
    displayContext.fillStyle = color;
    displayContext.font = 'bold 39px monospace';
    displayContext.textAlign = 'center';
    displayContext.textBaseline = 'middle';
    displayContext.fillText(text, displayCanvas.width / 2, displayCanvas.height / 2 + 1);
    displayTexture.needsUpdate = true;
  }

  setDisplay('READY');

  mesh(
    new THREE.BoxGeometry(0.31, 0.11, 0.016),
    displayMaterial,
    0.09,
    0.445,
    0.195,
    machine,
    'Display'
  );

  const statusBulb = mesh(
    new THREE.SphereGeometry(0.026, 16, 10),
    materials.status,
    -0.38,
    0.445,
    0.195,
    machine,
    'Statusleuchte'
  );

  // Schalter
  for (let i = 0; i < 3; i++) {
    const button = mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.022, 18),
      i === 1 ? materials.bronze : materials.chrome,
      -0.11 + i * 0.11,
      0.285,
      0.194,
      machine
    );
    button.rotation.x = Math.PI / 2;
  }

  // Abtropfgitter
  mesh(new THREE.BoxGeometry(0.60, 0.035, 0.27), materials.chrome, 0, 0.022, 0.235, machine);

  const trayBars = instanced(
    new THREE.BoxGeometry(0.032, 0.010, 0.23),
    materials.darkSteel,
    10,
    'Abtropfgitter',
    machine
  );

  for (let i = 0; i < 10; i++) {
    setInstance(trayBars, i, -0.27 + i * 0.06, 0.046, 0.235);
  }
  trayBars.instanceMatrix.needsUpdate = true;

  // Espressotasse unter dem Auslauf
  const espressoCup = new THREE.Group();
  espressoCup.name = 'Espressotasse';
  espressoCup.position.set(0, 0.052, 0.245);
  machine.add(espressoCup);

  const cupGeometry = closedLathe([
    [0.000, 0.000],
    [0.044, 0.000],
    [0.053, 0.102],
    [0.046, 0.102],
    [0.038, 0.016],
    [0.000, 0.016],
  ], 24);

  mesh(cupGeometry, materials.ceramic, 0, 0, 0, espressoCup);
  const espressoHandle = mesh(
    new THREE.TorusGeometry(0.029, 0.007, 8, 18),
    materials.ceramicBlue,
    0.061,
    0.055,
    0,
    espressoCup
  );
  espressoHandle.rotation.y = Math.PI / 2;

  const espressoFill = mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.004, 24),
    materials.coffeeFill,
    0,
    0.088,
    0,
    espressoCup
  );

  // ------------------------------------------------------------
  // Separate Mühle
  // ------------------------------------------------------------
  const grinder = new THREE.Group();
  grinder.name = 'Kaffeegrinder';
  grinder.position.set(-0.16, 0.95, -0.21);
  root.add(grinder);

  mesh(new THREE.BoxGeometry(0.27, 0.34, 0.25), materials.darkSteel, 0, 0.17, 0, grinder);
  mesh(new THREE.BoxGeometry(0.25, 0.035, 0.24), materials.chrome, 0, 0.355, 0, grinder);
  mesh(
    new THREE.CylinderGeometry(0.105, 0.074, 0.17, 24),
    materials.glass,
    0,
    0.46,
    0,
    grinder
  );
  mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.025, 24), materials.rubber, 0, 0.558, 0, grinder);
  mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 18), materials.bronze, 0, 0.08, 0.142, grinder).rotation.x = Math.PI / 2;

  // ------------------------------------------------------------
  // Thermoskannen
  // ------------------------------------------------------------
  function thermos(x, bandMaterial, name) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0.95, -0.25);
    root.add(group);

    mesh(
      closedLathe([
        [0.000, 0.000],
        [0.090, 0.000],
        [0.103, 0.035],
        [0.103, 0.270],
        [0.085, 0.305],
        [0.000, 0.305],
      ], 28),
      materials.steel,
      0,
      0,
      0,
      group
    );

    mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.052, 28), bandMaterial, 0, 0.19, 0, group);
    mesh(new THREE.CylinderGeometry(0.091, 0.091, 0.026, 28), materials.bronze, 0, 0.315, 0, group);
    mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.018, 20), materials.rubber, 0, 0.336, 0, group);

    const handle = mesh(
      new THREE.TorusGeometry(0.065, 0.012, 8, 22, Math.PI * 1.55),
      materials.darkSteel,
      -0.115,
      0.17,
      0,
      group
    );
    handle.rotation.y = Math.PI / 2;

    const spout = mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.09, 16),
      materials.chrome,
      0,
      0.075,
      0.112,
      group
    );
    spout.rotation.x = Math.PI / 2;

    const nozzle = mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.06, 14),
      materials.chrome,
      0,
      0.048,
      0.152,
      group
    );

    mesh(new THREE.BoxGeometry(0.08, 0.014, 0.035), materials.bronze, 0, 0.105, 0.145, group);

    return group;
  }

  thermos(0.42, materials.coffee, 'Thermoskanne_Kaffee');
  thermos(0.79, materials.amber, 'Thermoskanne_Tee');

  // ------------------------------------------------------------
  // Regal, Vorratsdosen und Stationsschild
  // ------------------------------------------------------------
  mesh(new THREE.BoxGeometry(1.08, 0.035, 0.29), materials.worktop, 0.82, 1.34, -0.245, root, 'Regal');
  mesh(new THREE.BoxGeometry(1.08, 0.016, 0.016), materials.bronze, 0.82, 1.311, -0.092, root);

  for (const x of [0.39, 1.25]) {
    const bracket = mesh(
      new THREE.BoxGeometry(0.022, 0.25, 0.025),
      materials.bronze,
      x,
      1.205,
      -0.375,
      root
    );
    bracket.rotation.z = x < 1 ? -0.45 : 0.45;
  }

  const canisterBodies = instanced(
    new THREE.CylinderGeometry(0.065, 0.062, 0.17, 20),
    materials.ceramic,
    4,
    'Vorratsdosen',
    root
  );

  const canisterLids = instanced(
    new THREE.CylinderGeometry(0.068, 0.068, 0.024, 20),
    materials.bronze,
    4,
    'Vorratsdosen_Deckel',
    root
  );

  const canisterLabels = instanced(
    new THREE.CylinderGeometry(0.066, 0.066, 0.05, 20),
    materials.cabinetDark,
    4,
    'Vorratsdosen_Etiketten',
    root
  );

  for (let i = 0; i < 4; i++) {
    const x = 0.47 + i * 0.23;
    setInstance(canisterBodies, i, x, 1.445, -0.245);
    setInstance(canisterLids, i, x, 1.542, -0.245);
    setInstance(canisterLabels, i, x, 1.445, -0.245);
  }

  canisterBodies.instanceMatrix.needsUpdate = true;
  canisterLids.instanceMatrix.needsUpdate = true;
  canisterLabels.instanceMatrix.needsUpdate = true;

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 640;
  signCanvas.height = 128;
  const signContext = signCanvas.getContext('2d');
  signContext.fillStyle = '#17242b';
  signContext.fillRect(0, 0, signCanvas.width, signCanvas.height);
  signContext.strokeStyle = '#b8864d';
  signContext.lineWidth = 6;
  signContext.strokeRect(5, 5, signCanvas.width - 10, signCanvas.height - 10);
  signContext.fillStyle = '#d9eef5';
  signContext.font = 'bold 37px sans-serif';
  signContext.textAlign = 'center';
  signContext.textBaseline = 'middle';
  signContext.fillText('EXPEDITION COFFEE', 320, 64);

  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;

  const signMaterial = new THREE.MeshStandardMaterial({
    name: 'coffee_schild',
    map: signTexture,
    emissiveMap: signTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
    metalness: 0.18,
    roughness: 0.44,
  });

  mesh(
    new THREE.BoxGeometry(0.94, 0.19, 0.025),
    signMaterial,
    0.82,
    1.525,
    -0.379,
    root,
    'Stationsschild'
  );

  const buffLed = mesh(
    new THREE.SphereGeometry(0.025, 14, 10),
    materials.buff,
    1.27,
    1.525,
    -0.355,
    root,
    'Moral_Anzeige'
  );

  // ------------------------------------------------------------
  // Bechertablett und Becher
  // ------------------------------------------------------------
  mesh(new THREE.BoxGeometry(0.64, 0.022, 0.42), materials.darkSteel, 1.05, 0.962, 0.18, root, 'Bechertablett');
  mesh(new THREE.BoxGeometry(0.60, 0.008, 0.38), materials.bronze, 1.05, 0.977, 0.18, root);

  const trayCupPositions = [
    [0.87, 1.025, 0.08],
    [1.05, 1.025, 0.08],
    [1.23, 1.025, 0.08],
    [0.87, 1.025, 0.27],
    [1.05, 1.025, 0.27],
    [1.23, 1.025, 0.27],
  ];

  const trayCups = instanced(cupGeometry, materials.ceramic, trayCupPositions.length, 'Becherkoerper');
  const trayCupHandles = instanced(
    new THREE.TorusGeometry(0.029, 0.007, 8, 18),
    materials.ceramicBlue,
    trayCupPositions.length,
    'Bechergriffe'
  );
  const trayCoffee = instanced(
    new THREE.CylinderGeometry(0.041, 0.041, 0.004, 20),
    materials.coffee,
    trayCupPositions.length,
    'Becherkaffee'
  );

  trayCupPositions.forEach((p, i) => {
    setInstance(trayCups, i, p[0], p[1], p[2]);
    setInstance(trayCupHandles, i, p[0] + 0.061, p[1] + 0.055, p[2], 0, Math.PI / 2, 0);
    setInstance(trayCoffee, i, p[0], p[1] + 0.088, p[2]);
  });

  trayCups.instanceMatrix.needsUpdate = true;
  trayCupHandles.instanceMatrix.needsUpdate = true;
  trayCoffee.instanceMatrix.needsUpdate = true;

  // Tassen auf der Maschine
  const warmerCupPositions = [
    [-0.30, 0.648, -0.03],
    [-0.10, 0.648, -0.03],
    [0.10, 0.648, -0.03],
    [0.30, 0.648, -0.03],
  ];

  const warmerCups = instanced(cupGeometry, materials.ceramic, warmerCupPositions.length, 'Warmhalterbecher', machine);
  const warmerHandles = instanced(
    new THREE.TorusGeometry(0.029, 0.007, 8, 18),
    materials.ceramicBlue,
    warmerCupPositions.length,
    'Warmhalterbechergriffe',
    machine
  );

  warmerCupPositions.forEach((p, i) => {
    setInstance(warmerCups, i, p[0], p[1], p[2]);
    setInstance(warmerHandles, i, p[0] + 0.061, p[1] + 0.055, p[2], 0, Math.PI / 2, 0);
  });

  warmerCups.instanceMatrix.needsUpdate = true;
  warmerHandles.instanceMatrix.needsUpdate = true;

  // ------------------------------------------------------------
  // Milchkanne, Zucker und Servietten
  // ------------------------------------------------------------
  const milkPitcher = new THREE.Group();
  milkPitcher.name = 'Milchkanne';
  milkPitcher.position.set(0.22, 0.95, 0.23);
  root.add(milkPitcher);

  mesh(
    closedLathe([
      [0.000, 0.000],
      [0.062, 0.000],
      [0.072, 0.020],
      [0.066, 0.165],
      [0.055, 0.165],
      [0.052, 0.020],
      [0.000, 0.020],
    ], 24),
    materials.chrome,
    0,
    0,
    0,
    milkPitcher
  );

  const milkHandle = mesh(
    new THREE.TorusGeometry(0.047, 0.009, 8, 18, Math.PI * 1.45),
    materials.chrome,
    -0.073,
    0.095,
    0,
    milkPitcher
  );
  milkHandle.rotation.y = Math.PI / 2;

  mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.004, 24), materials.milk, 0, 0.151, 0, milkPitcher);

  const sugarBin = mesh(
    new THREE.BoxGeometry(0.20, 0.15, 0.16),
    materials.chrome,
    0.49,
    1.025,
    0.23,
    root,
    'Zuckerbehaelter'
  );
  mesh(new THREE.BoxGeometry(0.205, 0.018, 0.165), materials.bronze, 0.49, 1.109, 0.23, root);

  const napkinHolder = new THREE.Group();
  napkinHolder.name = 'Serviettenhalter';
  napkinHolder.position.set(0.68, 0.95, 0.22);
  root.add(napkinHolder);

  mesh(new THREE.BoxGeometry(0.15, 0.12, 0.14), materials.darkSteel, 0, 0.06, 0, napkinHolder);
  mesh(new THREE.BoxGeometry(0.135, 0.09, 0.012), materials.paper, 0, 0.145, 0, napkinHolder);
  mesh(new THREE.BoxGeometry(0.012, 0.09, 0.135), materials.paper, 0, 0.145, 0, napkinHolder);

  // Löffel und Zuckerportionen
  for (let i = 0; i < 4; i++) {
    const spoon = new THREE.Group();
    spoon.position.set(0.55 + i * 0.035, 0.959, -0.02 + i * 0.055);
    spoon.rotation.y = -0.22;
    root.add(spoon);

    mesh(new THREE.BoxGeometry(0.009, 0.004, 0.145), materials.chrome, 0, 0, 0, spoon);
    mesh(new THREE.SphereGeometry(0.019, 10, 8), materials.chrome, 0, 0.001, -0.076, spoon);
  }

  for (let i = 0; i < 3; i++) {
    mesh(
      new THREE.BoxGeometry(0.035, 0.024, 0.035),
      materials.paper,
      0.44 + i * 0.048,
      1.112,
      0.23,
      root
    );
  }

  // ------------------------------------------------------------
  // Dampf: weiche Sprite-Partikel über der Espressotasse
  // ------------------------------------------------------------
  const steamCanvas = document.createElement('canvas');
  steamCanvas.width = 64;
  steamCanvas.height = 64;
  const steamContext = steamCanvas.getContext('2d');
  const steamGradient = steamContext.createRadialGradient(32, 32, 2, 32, 32, 31);
  steamGradient.addColorStop(0, 'rgba(235,250,255,0.85)');
  steamGradient.addColorStop(0.45, 'rgba(220,245,252,0.32)');
  steamGradient.addColorStop(1, 'rgba(220,245,252,0)');
  steamContext.fillStyle = steamGradient;
  steamContext.fillRect(0, 0, 64, 64);

  const steamTexture = new THREE.CanvasTexture(steamCanvas);
  steamTexture.colorSpace = THREE.SRGBColorSpace;

  const steam = [];
  for (let i = 0; i < 5; i++) {
    const material = new THREE.SpriteMaterial({
      name: `coffee_dampf_${i}`,
      map: steamTexture,
      color: 0xe8faff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const puff = new THREE.Sprite(material);
    puff.position.set(-0.84, 1.12, 0.205);
    root.add(puff);
    steam.push(puff);
  }

  // ------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------
  const colCounter = new THREE.Mesh(new THREE.BoxGeometry(2.80, 0.95, 0.90));
  colCounter.name = 'COL_tresen';
  colCounter.position.set(0, 0.475, 0);
  root.add(colCounter);

  const colMachine = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.63, 0.52));
  colMachine.name = 'COL_espressomaschine';
  colMachine.position.set(-0.84, 1.265, -0.04);
  root.add(colMachine);

  const colThermos = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.42, 0.28));
  colThermos.name = 'COL_thermoskannen';
  colThermos.position.set(0.61, 1.16, -0.25);
  root.add(colThermos);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_kaffee';
  use.position.set(-0.55, 1.12, 0.72);
  use.userData = { label: 'Kaffee und Espresso nutzen', radius: 0.8 };
  root.add(use);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(-0.84, 1.36, 0.32);
  lampStatus.userData = { color: '#6fe3ff', intensity: 4, distance: 2.5 };
  root.add(lampStatus);

  const lampOutput = new THREE.Object3D();
  lampOutput.name = 'LAMP_ausgabe';
  lampOutput.position.set(0.72, 1.39, 0.14);
  lampOutput.userData = { color: '#ffb060', intensity: 2.5, distance: 2.2 };
  root.add(lampOutput);

  const lampShelf = new THREE.Object3D();
  lampShelf.name = 'LAMP_regal';
  lampShelf.position.set(0.82, 1.57, -0.25);
  lampShelf.userData = { color: '#6fe3ff', intensity: 2.8, distance: 2.0 };
  root.add(lampShelf);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let machineOn = true;
  let brewing = false;
  let brewRemaining = 0;
  let brewDuration = 3.4;
  let fillAmount = 0;
  let time = 0;
  let lastTime = null;
  let moralBuff = false;
  let moralUntil = 0;
  const MORAL_DURATION = 120;

  function update(dt) {
    time += dt;

    if (brewing) {
      brewRemaining -= dt;
      if (brewRemaining <= 0) {
        brewing = false;
        brewRemaining = 0;
        setDisplay('READY');
      }
    }

    const targetFill = brewing ? 1 - Math.max(0, brewRemaining) / brewDuration : fillAmount;
    fillAmount += (targetFill - fillAmount) * Math.min(1, dt * 5);
    materials.coffeeFill.opacity = fillAmount * 0.96;

    const pulse = 0.5 + 0.5 * Math.sin(time * 3.3);
    const brewingPulse = 0.5 + 0.5 * Math.sin(time * 8.0);

    statusBulb.material.emissiveIntensity = machineOn
      ? (brewing ? 1.8 + brewingPulse * 1.7 : 1.1 + pulse * 0.8)
      : 0.035;

    displayMaterial.emissiveIntensity = machineOn
      ? (brewing ? 1.4 + brewingPulse * 0.7 : 0.85 + pulse * 0.35)
      : 0.04;

    lampStatus.userData.intensity = machineOn
      ? (brewing ? 4.5 + brewingPulse * 2.0 : 3.2 + pulse * 1.0)
      : 0.25;

    steam.forEach((puff, i) => {
      const phase = (time * 0.31 + i * 0.17) % 1;
      const targetOpacity = machineOn && (brewing || fillAmount > 0.25)
        ? (brewing ? 0.30 : 0.12) * Math.sin(phase * Math.PI)
        : 0;

      puff.material.opacity += (targetOpacity - puff.material.opacity) * Math.min(1, dt * 4);
      puff.position.y = 1.12 + phase * 0.46;
      puff.position.x = -0.84 + Math.sin(time * 1.8 + i * 0.9) * 0.018;
      puff.position.z = 0.205 + Math.cos(time * 1.5 + i) * 0.012;
      const size = 0.08 + phase * 0.16;
      puff.scale.set(size, size, size);
    });

    if (moralBuff && time >= moralUntil) {
      moralBuff = false;
    }

    materials.buff.emissiveIntensity = moralBuff
      ? 1.6 + 0.8 * (0.5 + 0.5 * Math.sin(time * 4.2))
      : 0.18;
  }

  machineBody.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    einschalten() {
      machineOn = true;
      setDisplay(brewing ? 'BREWING' : 'READY');
    },

    ausschalten() {
      machineOn = false;
      brewing = false;
      brewRemaining = 0;
      setDisplay('OFF', '#61727a');
    },

    espressoZubereiten() {
      if (!machineOn || brewing) return false;
      brewing = true;
      brewRemaining = brewDuration;
      fillAmount = 0;
      setDisplay('BREWING', '#ffd08a');
      return true;
    },

    kaffeeTrinken() {
      machineOn = true;
      moralBuff = true;
      moralUntil = time + MORAL_DURATION;
      if (!brewing) setDisplay('READY');
      return true;
    },

    get machineOn() {
      return machineOn;
    },

    get brewing() {
      return brewing;
    },

    get moralBuff() {
      return moralBuff;
    },

    get moralRemaining() {
      return moralBuff ? Math.max(0, moralUntil - time) : 0;
    },

    get espressoReady() {
      return fillAmount > 0.75 && !brewing;
    },

    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'espresso_zubereiten',
      label: 'Espresso zubereiten',
      run: () => api.espressoZubereiten(),
    },
    {
      id: 'kaffee_trinken',
      label: 'Kaffee trinken – Moral-Buff aktivieren',
      run: () => api.kaffeeTrinken(),
    },
    {
      id: 'maschine_ein',
      label: 'Espressomaschine einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'maschine_aus',
      label: 'Espressomaschine ausschalten',
      run: () => api.ausschalten(),
    },
  ];

  return root;
}

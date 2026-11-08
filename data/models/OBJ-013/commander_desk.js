import * as THREE from 'three';

export const steckbrief = {
  name: 'commander_desk',
  art: 'Standobjekt',
  masse: 'Schreibtisch 1,80 × 0,90 × 0,75 m; mit Stühlen ca. 1,82 × 1,25 × 2,48 m',
  wohin: 'ATL-004 Kommandantur, ATL-005 Büro von Dr. Elizabeth Weir',
  benutzen: 'INT_sprechen → Expeditionsleitung kontaktieren; INT_laptop → Expeditionsterminal bedienen; INT_akte → Akte durchsehen',
  lichter: 'LAMP_bordlampe (bernsteinfarben), LAMP_monitor und LAMP_laptop (eisblau); dauerhaft aktiv',
  animation: 'Monitor- und Laptopanzeige pulsieren weich; Kontaktstatus erhöht die Monitorhelligkeit; Laptop wird beim Aufwecken heller',
  quelle: 'selbst gebaut nach Referenzbildern',
};

function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#48231b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 300; i++) {
    const y = Math.random() * canvas.height;
    const amplitude = 1.2 + Math.random() * 5.5;
    const frequency = 0.008 + Math.random() * 0.024;
    const phase = Math.random() * Math.PI * 2;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const yy = y + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = Math.random() > 0.45
      ? `rgba(124, 56, 34, ${0.12 + Math.random() * 0.24})`
      : `rgba(22, 8, 6, ${0.10 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'commander_desk_wood';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1.4);
  return texture;
}

function createScreenTexture(title, detailed = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#06131f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(65, 194, 229, 0.13)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#6fe3ff';
  ctx.fillRect(28, 25, 330, 4);
  ctx.font = 'bold 27px sans-serif';
  ctx.fillText(title, 28, 61);
  ctx.font = '15px monospace';
  ctx.fillStyle = '#8ebfce';
  ctx.fillText('ATLANTIS // EXPEDITION COMMAND', 28, 87);

  if (detailed) {
    ctx.strokeStyle = '#43d7f4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(430, 235, 142, 82, -0.12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(111, 227, 255, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(430, 235, 80 + i * 29, 42 + i * 16, -0.12, 0, Math.PI * 2);
      ctx.stroke();
    }

    const points = [
      [402, 190], [465, 210], [487, 265], [426, 287], [367, 248],
    ];
    ctx.fillStyle = '#ffb45e';
    for (const [x, y] of points) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 180, 94, 0.75)';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();

    ctx.fillStyle = '#a9dbe7';
    ctx.font = '14px monospace';
    ctx.fillText('SENSOR ARRAY', 28, 140);
    ctx.fillText('GATE STATUS', 28, 172);
    ctx.fillText('O2 RESERVE', 28, 204);
    ctx.fillText('POWER GRID', 28, 236);
    ctx.fillText('SIGNAL', 28, 268);

    ctx.fillStyle = '#ffb45e';
    ctx.fillText('ONLINE', 178, 140);
    ctx.fillText('NOMINAL', 178, 172);
    ctx.fillText('87.4%', 178, 204);
    ctx.fillText('STABLE', 178, 236);
    ctx.fillText('LOCKED', 178, 268);
  } else {
    ctx.fillStyle = '#102b3b';
    ctx.fillRect(28, 118, 712, 284);
    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 118, 712, 284);

    ctx.fillStyle = '#6fe3ff';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('EXPEDITION STATUS', 48, 154);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#a9dbe7';
    ctx.fillText('INTERCOM CHANNEL READY', 48, 197);
    ctx.fillText('LOCAL SYSTEMS NOMINAL', 48, 232);
    ctx.fillText('NO ACTIVE PRIORITY ALERT', 48, 267);

    ctx.fillStyle = '#ffb45e';
    ctx.fillRect(48, 306, 390, 8);
    ctx.fillStyle = '#42d3ef';
    ctx.fillRect(438, 306, 270, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = detailed
    ? 'commander_desk_monitor_texture'
    : 'commander_desk_laptop_texture';
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createNameplateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, '#715126');
  gradient.addColorStop(0.5, '#d2b16d');
  gradient.addColorStop(1, '#715126');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#24170c';
  ctx.textAlign = 'center';
  ctx.font = 'bold 35px serif';
  ctx.fillText('EXPEDITION COMMAND', 256, 59);
  ctx.font = '20px serif';
  ctx.fillText('ATLANTIS EXPEDITIONARY FORCE', 256, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'commander_desk_nameplate';
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'commander_desk';

  const woodMap = createWoodTexture();
  const wood = new THREE.MeshStandardMaterial({
    name: 'commander_desk_wood',
    color: 0x7a3d2c,
    map: woodMap,
    metalness: 0.02,
    roughness: 0.4,
  });
  const darkWood = new THREE.MeshStandardMaterial({
    name: 'commander_desk_dark_wood',
    color: 0x321914,
    map: woodMap,
    metalness: 0.02,
    roughness: 0.5,
  });
  const leather = new THREE.MeshStandardMaterial({
    name: 'commander_desk_leather',
    color: 0x431f1b,
    metalness: 0.02,
    roughness: 0.78,
  });
  const brass = new THREE.MeshStandardMaterial({
    name: 'commander_desk_brass',
    color: 0xb08a45,
    metalness: 0.82,
    roughness: 0.28,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    name: 'commander_desk_dark_metal',
    color: 0x20272b,
    metalness: 0.72,
    roughness: 0.34,
  });
  const blackPlastic = new THREE.MeshStandardMaterial({
    name: 'commander_desk_black_plastic',
    color: 0x111719,
    metalness: 0.12,
    roughness: 0.48,
  });
  const chairFabric = new THREE.MeshStandardMaterial({
    name: 'commander_desk_chair_fabric',
    color: 0x263a4b,
    metalness: 0.02,
    roughness: 0.88,
  });
  const paper = new THREE.MeshStandardMaterial({
    name: 'commander_desk_paper',
    color: 0xe5dfcc,
    metalness: 0,
    roughness: 0.93,
  });
  const folderMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_folder',
    color: 0x7f5a35,
    metalness: 0,
    roughness: 0.8,
  });
  const coffeeMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_coffee',
    color: 0x21100b,
    metalness: 0,
    roughness: 0.25,
  });
  const warmGlow = new THREE.MeshStandardMaterial({
    name: 'commander_desk_warm_glow',
    color: 0xffd08a,
    emissive: 0xffa43c,
    emissiveIntensity: 2.4,
    metalness: 0.05,
    roughness: 0.28,
  });
  const cyanGlow = new THREE.MeshStandardMaterial({
    name: 'commander_desk_cyan_glow',
    color: 0x8aeaff,
    emissive: 0x38c8f4,
    emissiveIntensity: 1.5,
    metalness: 0.08,
    roughness: 0.25,
  });

  const monitorTexture = createScreenTexture('ATLANTIS COMMAND', true);
  const laptopTexture = createScreenTexture('EXPEDITION TERMINAL', false);
  const monitorMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_monitor_screen',
    color: 0xffffff,
    map: monitorTexture,
    emissive: 0xffffff,
    emissiveMap: monitorTexture,
    emissiveIntensity: 0.8,
    metalness: 0,
    roughness: 0.3,
  });
  const laptopMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_laptop_screen',
    color: 0xffffff,
    map: laptopTexture,
    emissive: 0xffffff,
    emissiveMap: laptopTexture,
    emissiveIntensity: 0.72,
    metalness: 0,
    roughness: 0.3,
  });
  const nameplateMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_nameplate',
    color: 0xffffff,
    map: createNameplateTexture(),
    metalness: 0.75,
    roughness: 0.34,
  });

  const addBox = (parent, size, position, material, name) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (parent, radiusTop, radiusBottom, height, segments, position, material, name) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      material
    );
    mesh.position.set(position[0], position[1], position[2]);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------
  // Schreibtisch
  // Ursprung: Mitte der Unterseite bei y = 0.
  // Besucherseite: +Z. Chefsessel und Displays: -Z.
  // ---------------------------------------------------------------------
  const desk = new THREE.Group();
  desk.name = 'schreibtisch';
  root.add(desk);

  const top = addBox(desk, [1.8, 0.05, 0.9], [0, 0.725, 0], wood, 'tischplatte');
  addBox(desk, [1.82, 0.025, 0.92], [0, 0.6875, 0], darkWood, 'tischkante');
  addBox(desk, [1.42, 0.38, 0.04], [0, 0.46, -0.405], darkWood, 'rueckblende');

  const legPositions = [
    [-0.82, -0.36], [0.82, -0.36],
    [-0.82, 0.36], [0.82, 0.36],
  ];
  legPositions.forEach(([x, z], index) => {
    addBox(desk, [0.075, 0.67, 0.075], [x, 0.355, z], darkWood, `schreibtischbein_${index + 1}`);
    addCylinder(desk, 0.045, 0.05, 0.03, 16, [x, 0.015, z], blackPlastic, `fussgleiter_${index + 1}`);
  });
  addBox(desk, [1.46, 0.07, 0.06], [0, 0.22, -0.37], darkWood, 'querstrebe');

  // Schubladenblock rechts, Fächer zur Besucherseite.
  addBox(desk, [0.4, 0.68, 0.74], [0.62, 0.36, -0.03], wood, 'schubladenblock');
  for (let i = 0; i < 3; i++) {
    addBox(desk, [0.35, 0.185, 0.03], [0.62, 0.14 + i * 0.21, 0.36], darkWood, `schublade_${i + 1}`);
    addBox(desk, [0.13, 0.018, 0.028], [0.62, 0.14 + i * 0.21, 0.386], brass, `schubladengriff_${i + 1}`);
  }

  // Lederne Schreibunterlage und Kabelabdeckung.
  addBox(desk, [1.28, 0.008, 0.59], [0.08, 0.754, -0.035], leather, 'schreibunterlage');
  addCylinder(desk, 0.045, 0.045, 0.006, 20, [-0.47, 0.756, -0.28], darkMetal, 'kabelabdeckung');

  // Dezente türkise Statusleiste an der vorderen Tischkante.
  addBox(desk, [0.23, 0.01, 0.012], [0.35, 0.674, 0.462], cyanGlow, 'statusleiste');

  // ---------------------------------------------------------------------
  // Flachbildschirm, Display zum Chefsplatz (-Z).
  // ---------------------------------------------------------------------
  const monitor = new THREE.Group();
  monitor.name = 'flachbildschirm';
  monitor.position.set(-0.22, 0.75, -0.29);
  desk.add(monitor);

  addBox(monitor, [0.31, 0.018, 0.19], [0, 0.009, 0], darkMetal, 'monitor_basis');
  addBox(monitor, [0.055, 0.25, 0.05], [0, 0.135, 0.004], darkMetal, 'monitor_stiel');
  addBox(monitor, [0.69, 0.42, 0.045], [0, 0.39, 0], blackPlastic, 'monitor_gehaeuse');

  const monitorScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.635, 0.365, 0.003),
    monitorMat
  );
  monitorScreen.rotation.y = Math.PI;
  monitorScreen.position.set(0, 0.39, -0.0245);
  monitorScreen.name = 'monitor_anzeige';
  monitor.add(monitorScreen);

  addBox(monitor, [0.024, 0.012, 0.008], [0.286, 0.207, -0.027], cyanGlow, 'monitor_statuslicht');

  // ---------------------------------------------------------------------
  // Laptop, Tastatur zum Chefsplatz, Scharnier auf der Rückseite.
  // ---------------------------------------------------------------------
  const laptop = new THREE.Group();
  laptop.name = 'laptop';
  laptop.position.set(0.28, 0.75, -0.05);
  desk.add(laptop);

  addBox(laptop, [0.43, 0.018, 0.27], [0, 0.009, 0], darkMetal, 'laptop_basis');

  const keyGeo = new THREE.BoxGeometry(0.029, 0.006, 0.019);
  const keyMat = new THREE.MeshStandardMaterial({
    name: 'commander_desk_tasten',
    color: 0x30383b,
    metalness: 0.25,
    roughness: 0.55,
  });
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, 40);
  keys.name = 'laptop_tasten';
  const dummy = new THREE.Object3D();
  let keyIndex = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      dummy.position.set((col - 4.5) * 0.037, 0.021, -0.09 + row * 0.027);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      keys.setMatrixAt(keyIndex++, dummy.matrix);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  addBox(laptop, [0.115, 0.005, 0.075], [0, 0.0205, -0.083], darkMetal, 'laptop_touchpad');

  const laptopScreenGroup = new THREE.Group();
  laptopScreenGroup.position.set(0, 0.019, 0.127);
  laptopScreenGroup.rotation.x = 0.2;
  laptop.add(laptopScreenGroup);

  addBox(laptopScreenGroup, [0.43, 0.275, 0.017], [0, 0.1375, 0], blackPlastic, 'laptop_display_gehaeuse');
  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.392, 0.238, 0.003),
    laptopMat
  );
  laptopScreen.rotation.y = Math.PI;
  laptopScreen.position.set(0, 0.1375, -0.0095);
  laptopScreen.name = 'laptop_anzeige';
  laptopScreenGroup.add(laptopScreen);

  // Kompakte externe Tastatur links vom Laptop.
  const keyboard = new THREE.Group();
  keyboard.name = 'externe_tastatur';
  keyboard.position.set(-0.18, 0.75, -0.085);
  desk.add(keyboard);

  addBox(keyboard, [0.4, 0.017, 0.13], [0, 0.0085, 0], blackPlastic, 'tastatur_basis');
  const externalKeys = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.025, 0.005, 0.017),
    keyMat,
    48
  );
  externalKeys.name = 'tastatur_tasten';
  let externalKeyIndex = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      dummy.position.set((col - 5.5) * 0.029, 0.0195, -0.04 + row * 0.026);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      externalKeys.setMatrixAt(externalKeyIndex++, dummy.matrix);
    }
  }
  externalKeys.instanceMatrix.needsUpdate = true;
  keyboard.add(externalKeys);

  // Maus rechts neben der externen Tastatur.
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), blackPlastic);
  mouse.scale.set(0.72, 0.45, 1.25);
  mouse.position.set(0.075, 0.766, -0.085);
  mouse.name = 'maus';
  desk.add(mouse);

  // ---------------------------------------------------------------------
  // Messing-Schreibtischlampe mit geschlossenem Halbschirm.
  // ---------------------------------------------------------------------
  const lamp = new THREE.Group();
  lamp.name = 'bordlampe';
  lamp.position.set(0.69, 0.75, -0.275);
  desk.add(lamp);

  addCylinder(lamp, 0.105, 0.12, 0.035, 28, [0, 0.0175, 0], brass, 'bordlampe_fuss');
  addCylinder(lamp, 0.012, 0.016, 0.36, 16, [0, 0.205, 0], brass, 'bordlampe_stiel');
  addCylinder(lamp, 0.035, 0.045, 0.035, 20, [0, 0.365, 0], brass, 'bordlampe_gelenk');

  const shadeProfile = [];
  const shadeSegments = 12;
  for (let i = 0; i <= shadeSegments; i++) {
    const a = (i / shadeSegments) * (Math.PI / 2);
    shadeProfile.push(new THREE.Vector2(Math.sin(a) * 0.17, Math.cos(a) * 0.105));
  }
  for (let i = shadeSegments; i >= 0; i--) {
    const a = (i / shadeSegments) * (Math.PI / 2);
    shadeProfile.push(new THREE.Vector2(Math.sin(a) * 0.155, Math.cos(a) * 0.093));
  }
  shadeProfile.push(shadeProfile[0].clone());

  const shade = new THREE.Mesh(new THREE.LatheGeometry(shadeProfile, 28), brass);
  shade.position.set(0, 0.382, 0);
  shade.name = 'bordlampe_schirm';
  lamp.add(shade);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.047, 16, 10), warmGlow);
  bulb.position.set(0, 0.398, 0);
  bulb.name = 'bordlampe_gluehbirne';
  lamp.add(bulb);

  // ---------------------------------------------------------------------
  // Kaffeebecher, Akten, Notizbuch, Stift und Telefon.
  // ---------------------------------------------------------------------
  const mug = new THREE.Group();
  mug.name = 'kaffeebecher';
  mug.position.set(0.6, 0.75, 0.2);
  desk.add(mug);

  addCylinder(mug, 0.061, 0.052, 0.105, 24, [0, 0.0525, 0], paper, 'kaffeebecher_koerper');
  addCylinder(mug, 0.053, 0.053, 0.003, 24, [0, 0.104, 0], coffeeMat, 'kaffeeoberflaeche');
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.034, 0.009, 8, 20, Math.PI * 1.55),
    paper
  );
  handle.rotation.z = -Math.PI * 0.28;
  handle.position.set(0.063, 0.058, 0);
  handle.name = 'kaffeebecher_henkel';
  mug.add(handle);

  const files = new THREE.Group();
  files.name = 'akten';
  files.position.set(-0.57, 0.75, 0.16);
  files.rotation.y = -0.1;
  desk.add(files);

  for (let i = 0; i < 3; i++) {
    const folder = addBox(
      files,
      [0.34, 0.009, 0.245],
      [i * 0.009, 0.0045 + i * 0.011, i * 0.004],
      folderMat,
      `akte_${i + 1}`
    );
    folder.rotation.y = i * 0.018;
  }
  const sheet = addBox(files, [0.31, 0.003, 0.222], [0.018, 0.0375, 0.006], paper, 'aktenblatt');
  sheet.rotation.y = 0.025;

  const notebook = addBox(desk, [0.27, 0.022, 0.18], [-0.28, 0.761, 0.235], leather, 'notizbuch');
  notebook.rotation.y = 0.08;
  const notebookPaper = addBox(desk, [0.24, 0.004, 0.15], [-0.28, 0.774, 0.235], paper, 'notizbuch_papier');
  notebookPaper.rotation.y = 0.08;

  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.145, 10), darkMetal);
  pen.rotation.x = Math.PI / 2;
  pen.rotation.z = -0.28;
  pen.position.set(-0.08, 0.776, 0.25);
  pen.name = 'schreibstift';
  desk.add(pen);

  const phone = new THREE.Group();
  phone.name = 'burotelefon';
  phone.position.set(-0.63, 0.75, -0.035);
  phone.rotation.y = 0.12;
  desk.add(phone);

  addBox(phone, [0.16, 0.035, 0.12], [0, 0.0175, 0], blackPlastic, 'telefon_basis');
  addBox(phone, [0.17, 0.028, 0.035], [0, 0.056, 0.01], darkMetal, 'telefon_hoerer');
  addBox(phone, [0.045, 0.035, 0.048], [-0.062, 0.05, 0.01], blackPlastic, 'telefon_hohrer_links');
  addBox(phone, [0.045, 0.035, 0.048], [0.062, 0.05, 0.01], blackPlastic, 'telefon_hohrer_rechts');

  const cordGeo = new THREE.TorusGeometry(0.017, 0.004, 6, 12);
  const cord = new THREE.InstancedMesh(cordGeo, blackPlastic, 4);
  cord.name = 'telefonschnur';
  for (let i = 0; i < 4; i++) {
    dummy.position.set(0.095 + i * 0.012, 0.026, -0.03 + i * 0.022);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    cord.setMatrixAt(i, dummy.matrix);
  }
  cord.instanceMatrix.needsUpdate = true;
  phone.add(cord);

  // Messingene Namensplatte an der Besucherseite.
  const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.008), nameplateMat);
  nameplate.position.set(-0.2, 0.782, 0.437);
  nameplate.name = 'namensplatte';
  desk.add(nameplate);
  addBox(desk, [0.32, 0.012, 0.05], [-0.2, 0.762, 0.435], darkWood, 'namensplatten_fuss');

  // ---------------------------------------------------------------------
  // Chefsessel hinter dem Schreibtisch.
  // ---------------------------------------------------------------------
  const chiefChair = new THREE.Group();
  chiefChair.name = 'chefessessel';
  chiefChair.position.set(0, 0, -0.92);
  root.add(chiefChair);

  addBox(chiefChair, [0.56, 0.1, 0.52], [0, 0.47, 0], chairFabric, 'chefessessel_sitz');
  addBox(chiefChair, [0.58, 0.66, 0.1], [0, 0.83, -0.255], chairFabric, 'chefessessel_lehne');
  addBox(chiefChair, [0.47, 0.54, 0.035], [0, 0.82, -0.19], chairFabric, 'chefessessel_lehnenpolster');
  addBox(chiefChair, [0.34, 0.16, 0.09], [0, 1.22, -0.255], chairFabric, 'chefessessel_kopfstuetze');

  addCylinder(chiefChair, 0.045, 0.055, 0.35, 16, [0, 0.265, 0], darkMetal, 'chefessessel_gashebel');
  addCylinder(chiefChair, 0.095, 0.11, 0.07, 20, [0, 0.105, 0], darkMetal, 'chefessessel_hub');

  const spokeGeo = new THREE.BoxGeometry(0.31, 0.035, 0.055);
  const spokes = new THREE.InstancedMesh(spokeGeo, darkMetal, 5);
  spokes.name = 'chefessessel_sternfuß';
  const wheelGeo = new THREE.SphereGeometry(0.038, 10, 8);
  const wheels = new THREE.InstancedMesh(wheelGeo, blackPlastic, 5);
  wheels.name = 'chefessessel_rollen';

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.16, 0.075, Math.sin(a) * 0.16);
    dummy.rotation.set(0, -a, 0);
    dummy.updateMatrix();
    spokes.setMatrixAt(i, dummy.matrix);

    dummy.position.set(Math.cos(a) * 0.315, 0.038, Math.sin(a) * 0.315);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    wheels.setMatrixAt(i, dummy.matrix);
  }
  spokes.instanceMatrix.needsUpdate = true;
  wheels.instanceMatrix.needsUpdate = true;
  chiefChair.add(spokes, wheels);

  addBox(chiefChair, [0.065, 0.24, 0.065], [-0.325, 0.6, -0.055], darkMetal, 'armlehne_links_stuetze');
  addBox(chiefChair, [0.065, 0.24, 0.065], [0.325, 0.6, -0.055], darkMetal, 'armlehne_rechts_stuetze');
  addBox(chiefChair, [0.095, 0.05, 0.34], [-0.325, 0.735, 0], blackPlastic, 'armlehne_links');
  addBox(chiefChair, [0.095, 0.05, 0.34], [0.325, 0.735, 0], blackPlastic, 'armlehne_rechts');

  // ---------------------------------------------------------------------
  // Zwei Besucherstühle, wiederholte Bauteile als InstancedMesh.
  // ---------------------------------------------------------------------
  const visitorPositions = [
    { x: -0.44, z: 1.02 },
    { x: 0.39, z: 1.02 },
  ];

  const visitorSeat = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.45, 0.075, 0.44),
    chairFabric,
    visitorPositions.length
  );
  visitorSeat.name = 'besucherstuehle_sitze';

  const visitorBack = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.45, 0.46, 0.075),
    chairFabric,
    visitorPositions.length
  );
  visitorBack.name = 'besucherstuehle_lehnen';

  const visitorLegs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.035, 0.43, 0.035),
    darkMetal,
    visitorPositions.length * 4
  );
  visitorLegs.name = 'besucherstuehle_beine';

  const visitorArmSupports = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.035, 0.22, 0.035),
    darkMetal,
    visitorPositions.length * 2
  );
  visitorArmSupports.name = 'besucherstuehle_armlehnenstuetzen';

  const visitorArmPads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 0.04, 0.28),
    blackPlastic,
    visitorPositions.length * 2
  );
  visitorArmPads.name = 'besucherstuehle_armlehnen';

  let legIndex = 0;
  let armIndex = 0;
  visitorPositions.forEach((p, chairIndex) => {
    dummy.position.set(p.x, 0.445, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    visitorSeat.setMatrixAt(chairIndex, dummy.matrix);

    dummy.position.set(p.x, 0.71, p.z + 0.205);
    dummy.rotation.set(0.12, 0, 0);
    dummy.updateMatrix();
    visitorBack.setMatrixAt(chairIndex, dummy.matrix);

    const corners = [
      [-0.175, -0.175], [0.175, -0.175],
      [-0.175, 0.175], [0.175, 0.175],
    ];
    for (const [ox, oz] of corners) {
      dummy.position.set(p.x + ox, 0.215, p.z + oz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      visitorLegs.setMatrixAt(legIndex++, dummy.matrix);
    }

    for (const ox of [-0.25, 0.25]) {
      dummy.position.set(p.x + ox, 0.565, p.z + 0.02);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      visitorArmSupports.setMatrixAt(armIndex, dummy.matrix);

      dummy.position.set(p.x + ox, 0.685, p.z + 0.02);
      dummy.updateMatrix();
      visitorArmPads.setMatrixAt(armIndex, dummy.matrix);
      armIndex++;
    }
  });

  visitorSeat.instanceMatrix.needsUpdate = true;
  visitorBack.instanceMatrix.needsUpdate = true;
  visitorLegs.instanceMatrix.needsUpdate = true;
  visitorArmSupports.instanceMatrix.needsUpdate = true;
  visitorArmPads.instanceMatrix.needsUpdate = true;
  root.add(visitorSeat, visitorBack, visitorLegs, visitorArmSupports, visitorArmPads);

  // ---------------------------------------------------------------------
  // Unsichtbare Kollisionskörper.
  // ---------------------------------------------------------------------
  const colDesk = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.75, 0.92));
  colDesk.name = 'COL_schreibtisch';
  colDesk.position.set(0, 0.375, 0);
  colDesk.visible = false;
  root.add(colDesk);

  const colChief = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.3, 0.62));
  colChief.name = 'COL_chefessessel';
  colChief.position.set(0, 0.65, -0.92);
  colChief.visible = false;
  root.add(colChief);

  visitorPositions.forEach((p, index) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.95, 0.5));
    col.name = `COL_besucherstuhl_${index + 1}`;
    col.position.set(p.x, 0.475, p.z + 0.04);
    col.visible = false;
    root.add(col);
  });

  // ---------------------------------------------------------------------
  // Benutzen-Punkte und dauerhaft aktive Lichter.
  // ---------------------------------------------------------------------
  const speak = new THREE.Object3D();
  speak.name = 'INT_sprechen';
  speak.position.set(0.2, 1.0, 0.63);
  speak.userData = { label: 'Expeditionsleitung kontaktieren', radius: 0.9 };
  root.add(speak);

  const laptopUse = new THREE.Object3D();
  laptopUse.name = 'INT_laptop';
  laptopUse.position.set(0.28, 0.92, -0.02);
  laptopUse.userData = { label: 'Laptop bedienen', radius: 0.65 };
  root.add(laptopUse);

  const filesUse = new THREE.Object3D();
  filesUse.name = 'INT_akte';
  filesUse.position.set(-0.55, 0.9, 0.16);
  filesUse.userData = { label: 'Akte durchsehen', radius: 0.6 };
  root.add(filesUse);

  const lampLight = new THREE.Object3D();
  lampLight.name = 'LAMP_bordlampe';
  lampLight.position.set(0.69, 1.13, -0.275);
  lampLight.userData = { color: '#ffb45e', intensity: 8, distance: 4.5 };
  root.add(lampLight);

  const monitorLight = new THREE.Object3D();
  monitorLight.name = 'LAMP_monitor';
  monitorLight.position.set(-0.22, 1.14, -0.33);
  monitorLight.userData = { color: '#6fe3ff', intensity: 4.5, distance: 2.8 };
  root.add(monitorLight);

  const laptopLight = new THREE.Object3D();
  laptopLight.name = 'LAMP_laptop';
  laptopLight.position.set(0.28, 1.0, 0.02);
  laptopLight.userData = { color: '#6fe3ff', intensity: 2.2, distance: 1.8 };
  root.add(laptopLight);

  // ---------------------------------------------------------------------
  // Zustand, Animation und öffentliche Schnittstelle.
  // ---------------------------------------------------------------------
  let contacted = false;
  let laptopAwake = false;
  let lastTime = null;
  let time = 0;

  function update(dt) {
    time += dt;

    const monitorTarget = contacted
      ? 1.05 + Math.sin(time * 4.2) * 0.15
      : 0.72 + Math.sin(time * 2.1) * 0.09;
    monitorMat.emissiveIntensity +=
      (monitorTarget - monitorMat.emissiveIntensity) * Math.min(1, dt * 5);

    const laptopTarget = laptopAwake
      ? 1.05 + Math.sin(time * 3.4) * 0.1
      : 0.5 + Math.sin(time * 2.2 + 0.8) * 0.05;
    laptopMat.emissiveIntensity +=
      (laptopTarget - laptopMat.emissiveIntensity) * Math.min(1, dt * 6);

    const lampTarget = 2.4 + Math.sin(time * 1.7) * 0.06;
    warmGlow.emissiveIntensity +=
      (lampTarget - warmGlow.emissiveIntensity) * Math.min(1, dt * 7);
  }

  top.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  const api = {
    ansprechen() {
      contacted = true;
      return { kontaktiert: true, empfaenger: 'Expeditionsleitung' };
    },
    laptopAufwecken() {
      laptopAwake = true;
      contacted = true;
      return { laptop: 'aktiv', kanal: 'Expeditionsterminal' };
    },
    aktteDurchsehen() {
      return {
        aktte: 'Expeditionsbericht',
        hinweis: 'Dr. Elizabeth Weir ist die Expeditionsleiterin.',
      };
    },
    get kontaktiert() {
      return contacted;
    },
    get laptopAktiv() {
      return laptopAwake;
    },
    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'expeditionsleitung_kontaktieren',
      label: 'Ansprechpartner der Expeditionsleitung kontaktieren',
      run: () => api.ansprechen(),
    },
    {
      id: 'laptop_aufwecken',
      label: 'Expeditionsterminal aufwecken',
      run: () => api.laptopAufwecken(),
    },
    {
      id: 'akte_durchsehen',
      label: 'Akte der Expeditionsleitung durchsehen',
      run: () => api.aktteDurchsehen(),
    },
  ];

  if (opts.scale && Number.isFinite(opts.scale)) {
    root.scale.setScalar(opts.scale);
  }

  return root;
}

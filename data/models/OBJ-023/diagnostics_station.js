// OBJ-023 — Subraum-Diagnoseplatz für Dr. Radek Zelenkas Labor
// Standobjekt: Ursprung in der Mitte der Unterseite, Vorderseite nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'diagnostics_station',
  art: 'Standobjekt',
  masse: '3,56 × 2,32 × 2,06 (B × H × T, m)',
  wohin: 'ATL-018 — Labor von Dr. Radek Zelenka',
  benutzen: 'INT_diagnose / INT_scan / INT_terminal / INT_cart → Diagnosemenü',
  lichter: 'LAMP_display, LAMP_desk, LAMP_terminal, LAMP_cart (eisblau/weiß)',
  animation: 'Antiker-Display pulsiert, Scanlinie läuft, Sternschaltbild rotiert während der Analyse',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'diagnostics_station';

  const kit = (name, overrides = {}) => new THREE.MeshStandardMaterial({
    name: `KIT_${name}`,
    ...overrides,
  });

  const matHull = kit('hull', {
    color: 0xc8d4da,
    metalness: 0.38,
    roughness: 0.31,
  });
  const matWall = kit('wall', {
    color: 0x879ca9,
    metalness: 0.64,
    roughness: 0.36,
  });
  const matDark = kit('wallDark', {
    color: 0x263b4b,
    metalness: 0.72,
    roughness: 0.38,
  });
  const matCopper = kit('copper', {
    color: 0xa07a50,
    metalness: 0.86,
    roughness: 0.27,
  });
  const matRail = kit('rail', {
    color: 0xc29a65,
    metalness: 0.95,
    roughness: 0.18,
  });
  const matGlow = kit('glow', {
    color: 0xa3f1ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.35,
    metalness: 0.08,
    roughness: 0.26,
  });
  const matAmber = kit('amberGlow', {
    color: 0xffc77f,
    emissive: 0xffa63d,
    emissiveIntensity: 1.05,
    metalness: 0.08,
    roughness: 0.3,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    name: 'chrom',
    color: 0xc7d3dc,
    metalness: 0.96,
    roughness: 0.17,
  });
  const matWorktop = new THREE.MeshStandardMaterial({
    name: 'arbeitsplatte',
    color: 0x3b4b58,
    metalness: 0.38,
    roughness: 0.48,
  });
  const matRubber = new THREE.MeshStandardMaterial({
    name: 'gummi',
    color: 0x101820,
    metalness: 0.05,
    roughness: 0.82,
  });
  const matPlastic = new THREE.MeshStandardMaterial({
    name: 'geraeteplastik',
    color: 0x344650,
    metalness: 0.14,
    roughness: 0.5,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    name: 'displayglas',
    color: 0x07131e,
    metalness: 0.18,
    roughness: 0.22,
  });
  const matSteel = new THREE.MeshStandardMaterial({
    name: 'stahlblau',
    color: 0x304b5b,
    metalness: 0.78,
    roughness: 0.39,
  });
  const matPaper = new THREE.MeshStandardMaterial({
    name: 'notizpapier',
    color: 0xdbe7e8,
    metalness: 0,
    roughness: 0.86,
  });

  const colMaterial = new THREE.MeshBasicMaterial({
    name: 'COL_material',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });

  function box(parent, w, h, d, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, rt, rb, h, material, x = 0, y = 0, z = 0, segments = 16) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function collider(parent, name, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colMaterial);
    mesh.name = `COL_${name}`;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function canvasTexture(width = 512, height = 320) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, ctx, texture };
  }

  function screenMaterial(name, texture, intensity = 0.8) {
    return new THREE.MeshStandardMaterial({
      name,
      color: 0xffffff,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: intensity,
      metalness: 0.06,
      roughness: 0.24,
    });
  }

  function drawGrid(c, width, height, stepX = 32, stepY = 30, color = '#245466') {
    c.strokeStyle = color;
    c.lineWidth = 1;
    for (let x = 0; x <= width; x += stepX) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, height);
      c.stroke();
    }
    for (let y = 0; y <= height; y += stepY) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(width, y);
      c.stroke();
    }
  }

  function makeLaptop(parent, x, z, title) {
    const laptop = new THREE.Group();
    laptop.name = 'Laptop';
    laptop.position.set(x, 0.752, z);
    parent.add(laptop);

    box(laptop, 0.49, 0.035, 0.34, matPlastic, 0, 0.0175, 0.02);
    box(laptop, 0.45, 0.012, 0.11, matRubber, 0, 0.041, -0.09);

    const keyGeo = new THREE.BoxGeometry(0.041, 0.008, 0.03);
    const keys = new THREE.InstancedMesh(keyGeo, matDark, 30);
    keys.name = 'Laptop_Tastatur';
    const dummy = new THREE.Object3D();
    let keyIndex = 0;
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 10; column++) {
        dummy.position.set(-0.18 + column * 0.04, 0.043, -0.025 + row * 0.042);
        dummy.updateMatrix();
        keys.setMatrixAt(keyIndex++, dummy.matrix);
      }
    }
    keys.instanceMatrix.needsUpdate = true;
    laptop.add(keys);

    box(laptop, 0.13, 0.005, 0.075, matSteel, 0, 0.039, 0.115);

    const lid = new THREE.Group();
    lid.position.set(0, 0.035, -0.135);
    lid.rotation.x = -0.13;
    laptop.add(lid);

    box(lid, 0.5, 0.31, 0.028, matPlastic, 0, 0.155, 0);
    box(lid, 0.455, 0.265, 0.009, matBlack, 0, 0.155, 0.018);

    const data = canvasTexture(384, 240);
    const c = data.ctx;
    c.fillStyle = '#06141d';
    c.fillRect(0, 0, 384, 240);
    drawGrid(c, 384, 240);
    c.fillStyle = '#6fe3ff';
    c.font = 'bold 17px monospace';
    c.fillText(title, 22, 33);
    c.fillStyle = '#ffb65c';
    c.font = '14px monospace';
    c.fillText('> Energieverteilung', 22, 76);
    c.fillText('> Schild', 22, 107);
    c.fillText('> Jumper', 22, 138);
    c.fillStyle = '#d7f7ff';
    c.fillText('> Diagnoseprogramm bereit', 22, 194);

    const laptopMat = screenMaterial('laptopbild', data.texture, 0.72);
    const laptopScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.445, 0.255), laptopMat);
    laptopScreen.position.set(0, 0.155, 0.024);
    lid.add(laptopScreen);

    const ledMat = new THREE.MeshStandardMaterial({
      name: 'laptop_status',
      color: 0x8beaff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.1,
    });
    box(laptop, 0.018, 0.006, 0.008, ledMat, 0.17, 0.039, 0.16);

    return { group: laptop, material: laptopMat, ledMat };
  }

  function makeMonitor(parent, x, z, width = 0.62, height = 0.4) {
    const monitor = new THREE.Group();
    monitor.name = 'Erdmonitor';
    monitor.position.set(x, 0.752, z);
    parent.add(monitor);

    const depth = Math.min(0.25, width * 0.42);
    box(monitor, width * 0.58, 0.035, depth * 0.72, matDark, 0, 0.0175, 0.01);
    cylinder(monitor, 0.035, 0.047, 0.25, matChrome, 0, 0.145, -0.01, 14);
    box(monitor, width + 0.025, height + 0.035, 0.045, matDark, 0, 0.43, -0.01);
    box(monitor, width, height, 0.01, matBlack, 0, 0.43, 0.017);

    const data = canvasTexture(384, 256);
    const c = data.ctx;
    c.fillStyle = '#071722';
    c.fillRect(0, 0, 384, 256);
    c.fillStyle = '#103749';
    c.fillRect(12, 12, 220, 25);
    c.fillStyle = '#8beaff';
    c.font = 'bold 15px monospace';
    c.fillText('ATLANTIS / SYSTEM MONITOR', 22, 30);

    c.strokeStyle = '#39768d';
    c.lineWidth = 2;
    for (let row = 0; row < 5; row++) {
      c.strokeRect(20, 55 + row * 32, 165, 22);
      c.fillStyle = row === 2 ? '#ffbf69' : '#4fa8c0';
      c.fillRect(25, 61 + row * 32, 80 + row * 13, 9);
    }

    c.fillStyle = '#123b4e';
    c.fillRect(205, 55, 158, 175);
    c.strokeStyle = '#6fe3ff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(284, 142, 47, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(284 + Math.cos(a) * 20, 142 + Math.sin(a) * 20);
      c.lineTo(284 + Math.cos(a) * 43, 142 + Math.sin(a) * 43);
      c.stroke();
    }

    const monitorMat = screenMaterial('monitorbild', data.texture, 0.75);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.025, height - 0.025), monitorMat);
    screen.position.set(0, 0.43, 0.023);
    monitor.add(screen);

    return { group: monitor, material: monitorMat };
  }

  function makeStool(x, z, rotation = 0) {
    const stool = new THREE.Group();
    stool.name = 'Hocker';
    stool.position.set(x, 0, z);
    stool.rotation.y = rotation;
    root.add(stool);

    cylinder(stool, 0.22, 0.235, 0.075, matRubber, 0, 0.6, 0, 24);
    cylinder(stool, 0.225, 0.225, 0.018, matChrome, 0, 0.555, 0, 24);
    cylinder(stool, 0.034, 0.045, 0.49, matChrome, 0, 0.305, 0, 16);
    cylinder(stool, 0.085, 0.11, 0.07, matDark, 0, 0.085, 0, 18);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.012, 8, 24), matChrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.24;
    stool.add(ring);

    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + Math.PI / 10;
      const leg = box(
        stool,
        0.23,
        0.026,
        0.038,
        matDark,
        Math.cos(a) * 0.105,
        0.035,
        Math.sin(a) * 0.105,
      );
      leg.rotation.y = -a;
      cylinder(
        stool,
        0.031,
        0.031,
        0.04,
        matRubber,
        Math.cos(a) * 0.22,
        0.02,
        Math.sin(a) * 0.22,
        10,
      );
    }

    return stool;
  }

  // ------------------------------------------------------------------
  // Hauptarbeitstisch
  // ------------------------------------------------------------------
  const desk = new THREE.Group();
  desk.name = 'Hauptarbeitstisch';
  desk.position.set(-0.42, 0, 0.1);
  root.add(desk);

  box(desk, 2.4, 0.07, 0.86, matWorktop, 0, 0.715, 0);
  box(desk, 2.34, 0.032, 0.8, matChrome, 0, 0.672, 0);
  box(desk, 2.2, 0.095, 0.055, matDark, 0, 0.59, -0.35);

  const deskLegs = [
    [-1.07, -0.31], [1.07, -0.31], [-1.07, 0.31], [1.07, 0.31],
  ];
  for (const [x, z] of deskLegs) {
    cylinder(desk, 0.031, 0.038, 0.65, matChrome, x, 0.325, z, 12);
    cylinder(desk, 0.055, 0.055, 0.045, matRubber, x, 0.0225, z, 14);
  }

  box(desk, 2.05, 0.032, 0.032, matChrome, 0, 0.23, -0.31);
  box(desk, 2.05, 0.032, 0.032, matChrome, 0, 0.23, 0.31);
  box(desk, 1.72, 0.12, 0.12, matDark, 0, 0.49, -0.28);

  const ventGeo = new THREE.BoxGeometry(0.09, 0.025, 0.13);
  const vents = new THREE.InstancedMesh(ventGeo, matChrome, 8);
  const ventDummy = new THREE.Object3D();
  for (let i = 0; i < 8; i++) {
    ventDummy.position.set(-0.735 + i * 0.21, 0.555, -0.28);
    ventDummy.updateMatrix();
    vents.setMatrixAt(i, ventDummy.matrix);
  }
  vents.instanceMatrix.needsUpdate = true;
  desk.add(vents);

  box(desk, 1.65, 0.022, 0.045, matGlow, 0, 0.683, 0.355);

  // Zwei Rechnerunterbauten, vollständig am Boden stehend.
  for (const x of [-0.88, 0.22]) {
    box(desk, 0.27, 0.55, 0.55, matDark, x, 0.275, -0.11);
    box(desk, 0.235, 0.035, 0.51, matSteel, x, 0.5675, -0.11);
    box(desk, 0.015, 0.18, 0.012, matGlow, x + 0.08, 0.4, 0.169);
    for (let row = 0; row < 5; row++) {
      box(desk, 0.13, 0.012, 0.012, matBlack, x - 0.035, 0.18 + row * 0.035, 0.17);
    }
  }

  const mainMonitor = makeMonitor(desk, -0.83, -0.055, 0.62, 0.4);
  const mainLaptop = makeLaptop(desk, 0.03, 0.12, 'STADTSYSTEM-DIAGNOSE');

  const terminal = new THREE.Group();
  terminal.name = 'Diagnoseterminal';
  terminal.position.set(0.72, 0.752, -0.04);
  desk.add(terminal);

  box(terminal, 0.34, 0.05, 0.26, matDark, 0, 0.025, 0);
  box(terminal, 0.31, 0.3, 0.035, matWall, 0, 0.185, -0.02);
  box(terminal, 0.27, 0.22, 0.01, matBlack, 0, 0.19, 0.002);
  for (let i = 0; i < 4; i++) {
    box(terminal, 0.045, 0.014, 0.008, i === 1 ? matAmber : matGlow, -0.09 + i * 0.06, 0.19, 0.011);
  }

  const toolTray = box(desk, 0.32, 0.035, 0.19, matDark, 0.48, 0.768, 0.3);
  toolTray.castShadow = true;
  for (let i = 0; i < 3; i++) {
    const tool = box(
      desk,
      0.025,
      0.025,
      0.15,
      i === 1 ? matCopper : matChrome,
      0.38 + i * 0.09,
      0.798,
      0.3,
    );
    tool.rotation.y = (i - 1) * 0.17;
  }

  const notes = box(desk, 0.22, 0.003, 0.3, matPaper, -0.12, 0.7515, 0.34);
  notes.rotation.y = 0.13;

  // ------------------------------------------------------------------
  // Seitlicher Arbeitstisch mit Messgeräten
  // ------------------------------------------------------------------
  const sideDesk = new THREE.Group();
  sideDesk.name = 'Seitlicher Arbeitstisch';
  sideDesk.position.set(1.26, 0, 0.12);
  root.add(sideDesk);

  box(sideDesk, 0.9, 0.07, 0.7, matWorktop, 0, 0.715, 0);
  box(sideDesk, 0.85, 0.03, 0.65, matChrome, 0, 0.672, 0);
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.25, 0.25]) {
      cylinder(sideDesk, 0.026, 0.031, 0.65, matChrome, x, 0.325, z, 12);
      cylinder(sideDesk, 0.046, 0.046, 0.04, matRubber, x, 0.02, z, 12);
    }
  }
  box(sideDesk, 0.62, 0.025, 0.025, matGlow, 0, 0.685, 0.29);

  const sideMonitor = makeMonitor(sideDesk, 0.16, -0.08, 0.42, 0.28);

  box(sideDesk, 0.31, 0.16, 0.27, matPlastic, -0.27, 0.83, 0.13);
  box(sideDesk, 0.23, 0.095, 0.01, matBlack, -0.27, 0.845, 0.271);
  for (let i = 0; i < 3; i++) {
    box(
      sideDesk,
      0.032,
      0.01,
      0.008,
      i === 1 ? matAmber : matGlow,
      -0.335 + i * 0.065,
      0.845,
      0.279,
    );
  }
  cylinder(sideDesk, 0.047, 0.047, 0.03, matDark, -0.27, 0.925, 0.13, 16);

  // ------------------------------------------------------------------
  // Antiker-Wanddisplay mit sternförmigem Schaltbild
  // ------------------------------------------------------------------
  const display = new THREE.Group();
  display.name = 'Antiker_Wanddisplay';
  display.position.set(-0.35, 0, -0.78);
  root.add(display);

  box(display, 2.42, 1.32, 0.18, matSteel, 0, 1.66, -0.05);

  for (const x of [-0.91, 0.91]) {
    cylinder(display, 0.04, 0.052, 1.02, matChrome, x, 0.51, -0.06, 14);
    box(display, 0.26, 0.06, 0.3, matDark, x, 0.03, -0.03);
    box(display, 0.15, 0.17, 0.065, matWall, x, 1.02, -0.06);
    box(display, 0.035, 0.78, 0.025, matGlow, x, 0.56, -0.018);
  }

  box(display, 2.16, 1.07, 0.14, matWall, 0, 1.66, 0);
  box(display, 2.03, 0.94, 0.025, matBlack, 0, 1.66, 0.082);

  const displayData = canvasTexture(768, 360);
  const displayMat = screenMaterial('antiker_display', displayData.texture, 1.02);
  const displayScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 0.85), displayMat);
  displayScreen.position.set(0, 1.66, 0.098);
  display.add(displayScreen);

  box(display, 2.08, 0.035, 0.04, matGlow, 0, 2.135, 0.105);
  box(display, 2.08, 0.035, 0.04, matGlow, 0, 1.185, 0.105);
  box(display, 0.035, 0.985, 0.04, matGlow, -1.04, 1.66, 0.105);
  box(display, 0.035, 0.985, 0.04, matGlow, 1.04, 1.66, 0.105);

  for (const x of [-1.11, 1.11]) {
    box(display, 0.06, 0.34, 0.065, matCopper, x, 1.66, 0.03);
    const cap = cylinder(display, 0.027, 0.027, 0.065, matRail, x, 1.66, 0.09, 12);
    cap.rotation.x = Math.PI / 2;
  }

  box(display, 1.72, 0.035, 0.035, matRail, 0, 1.07, 0.07);
  for (const x of [-0.46, 0.46]) {
    box(display, 0.035, 0.27, 0.025, matGlow, x, 1.58, -0.118);
  }

  const scanLineMat = new THREE.MeshBasicMaterial({
    name: 'scanlinie',
    color: 0x9ff4ff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.012), scanLineMat);
  scanLine.position.set(0, 1.25, 0.11);
  display.add(scanLine);

  // ------------------------------------------------------------------
  // Rollwagen mit Messgeräten
  // ------------------------------------------------------------------
  const cart = new THREE.Group();
  cart.name = 'Messwagen';
  cart.position.set(1.52, 0, -0.6);
  root.add(cart);

  for (const x of [-0.38, 0.38]) {
    for (const z of [-0.3, 0.3]) {
      cylinder(cart, 0.026, 0.026, 0.73, matChrome, x, 0.44, z, 12);
      box(cart, 0.09, 0.1, 0.075, matDark, x, 0.075, z);
      const wheel = cylinder(cart, 0.055, 0.055, 0.04, matRubber, x, 0.055, z, 14);
      wheel.rotation.z = Math.PI / 2;
    }
  }

  box(cart, 0.84, 0.045, 0.72, matWorktop, 0, 0.84, 0);
  box(cart, 0.8, 0.035, 0.68, matDark, 0, 0.44, 0);
  box(cart, 0.8, 0.035, 0.68, matDark, 0, 0.19, 0);

  box(cart, 0.34, 0.025, 0.025, matChrome, -0.17, 0.48, 0.345);
  box(cart, 0.34, 0.025, 0.025, matChrome, -0.17, 0.23, 0.345);
  box(cart, 0.62, 0.025, 0.025, matRail, 0, 0.92, 0.345);

  box(cart, 0.33, 0.18, 0.28, matPlastic, -0.18, 0.9525, -0.1);
  box(cart, 0.25, 0.105, 0.012, matBlack, -0.18, 0.965, 0.047);
  for (let i = 0; i < 4; i++) {
    box(
      cart,
      0.035,
      0.01,
      0.008,
      i === 2 ? matAmber : matGlow,
      -0.27 + i * 0.055,
      0.965,
      0.055,
    );
  }

  box(cart, 0.28, 0.13, 0.24, matWall, 0.2, 0.9275, 0.11);
  cylinder(cart, 0.045, 0.045, 0.025, matDark, 0.2, 1.005, 0.11, 16);
  box(cart, 0.18, 0.06, 0.012, matBlack, 0.2, 0.93, 0.237);
  box(cart, 0.13, 0.012, 0.008, matGlow, 0.2, 0.93, 0.246);

  box(cart, 0.34, 0.14, 0.28, matDark, -0.17, 0.525, 0.04);
  box(cart, 0.3, 0.025, 0.025, matChrome, -0.17, 0.55, 0.19);
  box(cart, 0.27, 0.11, 0.24, matPlastic, 0.19, 0.51, 0.04);

  // ------------------------------------------------------------------
  // Hocker
  // ------------------------------------------------------------------
  makeStool(-0.78, 0.9, -0.16);
  makeStool(0.2, 0.91, 0.22);

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  collider(root, 'hauptarbeitstisch', 2.43, 0.76, 0.88, -0.42, 0.38, 0.1);
  collider(root, 'seitenarbeitstisch', 0.93, 0.76, 0.72, 1.26, 0.38, 0.12);
  collider(root, 'wanddisplay', 2.44, 1.34, 0.4, -0.35, 1.66, -0.78);
  collider(root, 'messwagen', 0.88, 0.94, 0.76, 1.52, 0.47, -0.6);
  collider(root, 'hocker_links', 0.48, 0.64, 0.48, -0.78, 0.32, 0.9);
  collider(root, 'hocker_rechts', 0.48, 0.64, 0.48, 0.2, 0.32, 0.91);

  // ------------------------------------------------------------------
  // Benutzen-Punkte und Lichter
  // ------------------------------------------------------------------
  function interactionPoint(name, label, x, y, z, radius = 0.8) {
    const point = new THREE.Object3D();
    point.name = name;
    point.position.set(x, y, z);
    point.userData = { label, radius };
    root.add(point);
    return point;
  }

  interactionPoint('INT_diagnose', 'Subraum-Diagnose bedienen', -0.2, 1.03, 0.85, 0.9);
  interactionPoint('INT_scan', 'Antiker-System scannen', -0.35, 1.13, -0.35, 0.75);
  interactionPoint('INT_terminal', 'Diagnoseterminal bedienen', 1.22, 1.02, 0.73, 0.75);
  interactionPoint('INT_cart', 'Messgeräte prüfen', 1.52, 1.01, -0.12, 0.75);

  function lightPoint(name, color, intensity, distance, x, y, z) {
    const light = new THREE.Object3D();
    light.name = name;
    light.position.set(x, y, z);
    light.userData = { color, intensity, distance };
    root.add(light);
    return light;
  }

  lightPoint('LAMP_display', '#6fe3ff', 7, 4.2, -0.35, 1.66, -0.38);
  lightPoint('LAMP_desk', '#c8f5ff', 4, 2.8, -0.42, 1.02, 0.42);
  lightPoint('LAMP_terminal', '#6fe3ff', 2.4, 1.8, 1.22, 1, 0.48);
  lightPoint('LAMP_cart', '#ffb866', 2.5, 1.8, 1.52, 1.02, -0.25);

  // ------------------------------------------------------------------
  // Zustand, Displaygrafik und Diagnoseablauf
  // ------------------------------------------------------------------
  const systems = ['Energieverteilung', 'Schild', 'Jumper'];
  const systemColors = {
    'Energieverteilung': '#6fe3ff',
    'Schild': '#8dffe4',
    'Jumper': '#ffb45f',
  };

  let activeSystem = 'Energieverteilung';
  let powered = true;
  let scanning = false;
  let repaired = false;
  let progress = 0;
  let report = 'BEREIT — SYSTEM AUSWÄHLEN';
  let zeit = 0;
  let letzte = null;
  let dirty = true;
  let redrawTimer = 0;

  function drawAncientDisplay() {
    const c = displayData.ctx;
    const w = displayData.canvas.width;
    const h = displayData.canvas.height;
    const accent = systemColors[activeSystem];

    c.clearRect(0, 0, w, h);
    c.fillStyle = '#06131e';
    c.fillRect(0, 0, w, h);

    c.strokeStyle = 'rgba(76, 151, 178, 0.2)';
    c.lineWidth = 1;
    for (let x = 0; x <= w; x += 48) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    c.fillStyle = 'rgba(12, 52, 70, 0.94)';
    c.fillRect(20, 18, 728, 46);
    c.fillStyle = accent;
    c.font = 'bold 22px monospace';
    c.fillText(`SUBRAUM-DIAGNOSE / ${activeSystem.toUpperCase()}`, 36, 49);

    const cx = 355;
    const cy = 198;
    const rotation = scanning ? zeit * 0.42 : 0;
    const nodes = [];

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2 + rotation;
      const radius = i % 3 === 0 ? 111 : 84;
      nodes.push({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        big: i % 3 === 0,
      });
    }

    c.strokeStyle = accent;
    c.lineWidth = 3;
    c.shadowColor = accent;
    c.shadowBlur = 10;

    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      const next = nodes[(i + 1) % nodes.length];

      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(p.x, p.y);
      c.stroke();

      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(next.x, next.y);
      c.stroke();
    }

    c.beginPath();
    c.arc(cx, cy, 27, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, 10, 0, Math.PI * 2);
    c.fillStyle = accent;
    c.fill();

    for (const p of nodes) {
      c.beginPath();
      c.arc(p.x, p.y, p.big ? 9 : 5, 0, Math.PI * 2);
      c.fillStyle = p.big ? '#e4fbff' : accent;
      c.fill();
    }

    c.shadowBlur = 0;

    c.fillStyle = 'rgba(10, 42, 57, 0.96)';
    c.fillRect(570, 84, 174, 246);
    c.fillStyle = accent;
    c.font = 'bold 18px monospace';
    c.fillText('STATUS', 590, 114);
    c.font = '15px monospace';
    c.fillText(powered ? 'STROM: ONLINE' : 'STROM: OFFLINE', 588, 146);
    c.fillText(`MODUS: ${activeSystem}`, 588, 177);
    c.fillText(scanning ? 'SCAN: LÄUFT' : 'SCAN: BEREIT', 588, 208);
    c.fillText(repaired ? 'REPARATUR: OK' : 'REPARATUR: OFFEN', 588, 239);
    c.fillText(`FORTSCHRITT ${Math.round(progress * 100)}%`, 588, 277);

    c.fillStyle = '#123f50';
    c.fillRect(588, 290, 136, 9);
    c.fillStyle = accent;
    c.fillRect(588, 290, 136 * progress, 9);

    c.fillStyle = '#bfeefa';
    c.font = '14px monospace';
    c.fillText(report.slice(0, 48), 36, 331);

    displayData.texture.needsUpdate = true;
    dirty = false;
  }

  function startScan(system = activeSystem) {
    if (!systems.includes(system)) return;
    activeSystem = system;
    powered = true;
    scanning = true;
    repaired = false;
    progress = 0;
    report = `SCAN START — ${activeSystem.toUpperCase()}`;
    dirty = true;
  }

  function releaseRepair() {
    if (!powered) {
      report = 'REPARATUR BENÖTIGT STROMVERSORGUNG';
      dirty = true;
      return;
    }
    if (progress < 1) {
      report = 'DIAGNOSE ABSCHLIESSEN — REPARATUR GESPERRT';
      dirty = true;
      return;
    }
    repaired = true;
    scanning = false;
    report = `REPARATURPROTOKOLL FREIGEGEBEN — ${activeSystem.toUpperCase()}`;
    dirty = true;
  }

  function togglePower() {
    powered = !powered;
    scanning = false;
    progress = 0;
    repaired = false;
    report = powered
      ? 'STROMVERSORGUNG WIEDERHERGESTELLT'
      : 'STROMVERSORGUNG GETRENNT';
    dirty = true;
  }

  const api = {
    startScan,
    scan: startScan,
    releaseRepair,
    reparieren: releaseRepair,
    togglePower,
    setSystem(system) {
      if (!systems.includes(system)) return;
      activeSystem = system;
      scanning = false;
      progress = 0;
      repaired = false;
      report = `SYSTEM AUSGEWÄHLT — ${activeSystem.toUpperCase()}`;
      dirty = true;
    },
    get system() { return activeSystem; },
    get powered() { return powered; },
    get scanning() { return scanning; },
    get progress() { return progress; },
    get repaired() { return repaired; },
    get report() { return report; },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'scan_energie',
      label: 'Diagnose: Energieverteilung',
      run: () => startScan('Energieverteilung'),
    },
    {
      id: 'scan_schild',
      label: 'Diagnose: Schild',
      run: () => startScan('Schild'),
    },
    {
      id: 'scan_jumper',
      label: 'Diagnose: Jumper',
      run: () => startScan('Jumper'),
    },
    {
      id: 'scan_start',
      label: 'Diagnose erneut starten',
      run: () => startScan(activeSystem),
    },
    {
      id: 'repair',
      label: 'Reparaturprotokoll freigeben',
      run: () => releaseRepair(),
    },
    {
      id: 'power',
      label: 'Station ein-/ausschalten',
      run: () => togglePower(),
    },
  ];

  // ------------------------------------------------------------------
  // Selbstständige Animation
  // ------------------------------------------------------------------
  function update(dt) {
    zeit += dt;

    if (scanning) {
      progress = Math.min(1, progress + dt / 2.8);
      redrawTimer += dt;

      if (progress >= 1) {
        scanning = false;
        report = `ANALYSE ABGESCHLOSSEN — ${activeSystem.toUpperCase()}`;
        dirty = true;
      } else if (redrawTimer >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
        redrawTimer = 0;
        dirty = true;
      }
    }

    if (dirty) drawAncientDisplay();

    const displayTarget = powered ? 1.02 + Math.sin(zeit * 2.2) * 0.12 : 0.035;
    displayMat.emissiveIntensity +=
      (displayTarget - displayMat.emissiveIntensity) * Math.min(1, dt * 5);

    mainMonitor.material.emissiveIntensity = powered
      ? 0.7 + Math.sin(zeit * 1.7) * 0.05
      : 0.025;

    sideMonitor.material.emissiveIntensity = powered
      ? 0.66 + Math.sin(zeit * 1.9 + 0.8) * 0.05
      : 0.025;

    mainLaptop.material.emissiveIntensity = powered ? 0.68 : 0.02;
    mainLaptop.ledMat.emissiveIntensity = powered
      ? 0.8 + Math.sin(zeit * 4) * 0.55
      : 0.02;

    matGlow.emissiveIntensity = powered
      ? 1.25 + Math.sin(zeit * 1.9) * 0.22
      : 0.07;

    matAmber.emissiveIntensity = powered
      ? 0.9 + Math.sin(zeit * 2.6 + 1.4) * 0.28
      : 0.035;

    if (powered) {
      scanLine.position.y = 1.25 + (Math.sin(zeit * 1.25) * 0.5 + 0.5) * 0.82;
      scanLineMat.opacity = scanning
        ? 0.88
        : 0.4 + Math.sin(zeit * 3.2) * 0.11;
    } else {
      scanLineMat.opacity = 0;
    }
  }

  displayScreen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;
  drawAncientDisplay();

  return root;
}

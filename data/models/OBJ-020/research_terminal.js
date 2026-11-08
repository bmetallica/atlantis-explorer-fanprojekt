// research_terminal.js
// Antike Forschungskonsole: 2,00 × 1,00 m Arbeitstisch mit hinterleuchteten,
// ornamentierten Kristallfeldern, integriertem Daten-Display sowie irdischen
// Geräten (Laptop, Oszilloskop, Messgerät, Schreibtischlampe).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'research_terminal',
  art: 'Standobjekt',
  masse: '2,00 × 1,00 × 1,50 m (B × T × H inkl. Rückdisplay)',
  benutzen: 'INT_terminal, INT_datenbank, INT_simulator',
  lichter: 'LAMP_kristall, LAMP_bildschirm, LAMP_lampe',
  animation: 'Kristallfelder pulsieren, Scanbalken läuft über die Tafel, Datenbalken und Laptop-Display animiert, Lampe flackert sanft',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'research_terminal';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const matDark = kit('wallDark');
  const matMetal = kit('wall');
  const matPearl = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');

  const matCrystal = new THREE.MeshStandardMaterial({
    name: 'ancient_crystal',
    color: 0xe9e2b8,
    emissive: 0xffe6a0,
    emissiveIntensity: 0.45,
    metalness: 0.16,
    roughness: 0.28
  });

  const matCrystalWarm = new THREE.MeshStandardMaterial({
    name: 'ancient_crystal_warm',
    color: 0xf2e7bc,
    emissive: 0xffd77b,
    emissiveIntensity: 0.38,
    metalness: 0.14,
    roughness: 0.32
  });

  const matPattern = new THREE.MeshStandardMaterial({
    name: 'ancient_dark_pattern',
    color: 0x101923,
    emissive: 0x061019,
    emissiveIntensity: 0.22,
    metalness: 0.55,
    roughness: 0.42
  });

  const matLaptop = new THREE.MeshStandardMaterial({
    name: 'earth_laptop',
    color: 0x23282d,
    metalness: 0.38,
    roughness: 0.55
  });

  const matLaptopLight = new THREE.MeshStandardMaterial({
    name: 'earth_laptop_edge',
    color: 0x5b636b,
    metalness: 0.62,
    roughness: 0.36
  });

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'earth_screen',
    color: 0x06111c,
    emissive: 0x075f91,
    emissiveIntensity: 0.75,
    metalness: 0.06,
    roughness: 0.26
  });

  const matScreenLine = new THREE.MeshStandardMaterial({
    name: 'earth_screen_line',
    color: 0x55d8ff,
    emissive: 0x20bfff,
    emissiveIntensity: 1.35,
    metalness: 0.04,
    roughness: 0.24
  });

  const matRubber = new THREE.MeshStandardMaterial({
    name: 'earth_rubber',
    color: 0x090b0d,
    metalness: 0.04,
    roughness: 0.84
  });

  const matCable = new THREE.MeshStandardMaterial({
    name: 'earth_cable',
    color: 0x11161a,
    metalness: 0.02,
    roughness: 0.86
  });

  const matBulb = new THREE.MeshStandardMaterial({
    name: 'earth_lamp_bulb',
    color: 0xffe9b0,
    emissive: 0xffc96b,
    emissiveIntensity: 2.3,
    roughness: 0.22
  });

  // ------------------------------------------------------------
  // Geometrie-Helfer
  // ------------------------------------------------------------
  const unitBox = new THREE.BoxGeometry(1, 1, 1);

  function addBox(parent, size, position, material, rotation = null) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(size[0], size[1], size[2]);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, rTop, rBottom, height, position, material, rotation = null, segments = 14) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, height, segments),
      material
    );
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
  }

  const upVec = new THREE.Vector3(0, 1, 0);
  function addRod(parent, p1, p2, radius, material, segments = 10) {
    const a = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const b = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, len, segments),
      material
    );
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
    parent.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------
  // Antiker Tisch (Ursprung: Mitte der Unterseite, y = 0 ist Boden)
  // ------------------------------------------------------------
  const table = new THREE.Group();
  table.name = 'antiker_tisch';
  root.add(table);

  // Beine, Füße, bronzene Kragen
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(table, [0.24, 0.05, 0.24], [sx * 0.79, 0.025, sz * 0.32], matDark);
      addBox(table, [0.185, 0.03, 0.185], [sx * 0.79, 0.065, sz * 0.32], matCopper);
      addBox(table, [0.16, 0.62, 0.16], [sx * 0.79, 0.39, sz * 0.32], matPearl);
    }
  }

  // Unterrahmen und Streben
  addBox(table, [1.80, 0.09, 0.80], [0, 0.745, 0], matMetal);
  addBox(table, [1.58, 0.07, 0.08], [0, 0.22, -0.32], matDark);
  addBox(table, [0.08, 0.07, 0.64], [-0.79, 0.22, 0], matDark);
  addBox(table, [0.08, 0.07, 0.64], [0.79, 0.22, 0], matDark);

  // Hauptplatte: Oberkante bei y = 0,86
  addBox(table, [2.00, 0.07, 1.00], [0, 0.825, 0], matDark);

  // Bronzene Randleisten (Oberkante y = 0,888)
  addBox(table, [2.00, 0.028, 0.045], [0, 0.874, 0.4775], matRail);
  addBox(table, [2.00, 0.028, 0.045], [0, 0.874, -0.4775], matRail);
  addBox(table, [0.045, 0.028, 0.91], [-0.9775, 0.874, 0], matRail);
  addBox(table, [0.045, 0.028, 0.91], [0.9775, 0.874, 0], matRail);

  // ------------------------------------------------------------
  // Leuchtende Kristallfelder (Oberkante y = 0,89)
  // ------------------------------------------------------------
  const panelPositions = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      panelPositions.push({
        x: (col - 1) * 0.62,
        z: (row - 0.5) * 0.42
      });
    }
  }

  const panels = [];
  panelPositions.forEach((p, i) => {
    const panel = addBox(
      table,
      [0.56, 0.03, 0.36],
      [p.x, 0.875, p.z],
      (i % 2 === 0) ? matCrystal : matCrystalWarm
    );
    panels.push(panel);
  });

  // Ornamentale Muster: dunkle Linien und Glyphen als InstancedMesh
  const stripGeo = new THREE.BoxGeometry(1, 0.006, 1);
  stripGeo.translate(0, 0.003, 0);

  const stripDefs = [];
  for (const p of panelPositions) {
    // Rahmen
    stripDefs.push({ x: p.x, z: p.z - 0.18, sx: 0.56, sz: 0.018, a: 0 });
    stripDefs.push({ x: p.x, z: p.z + 0.18, sx: 0.56, sz: 0.018, a: 0 });
    stripDefs.push({ x: p.x - 0.28, z: p.z, sx: 0.018, sz: 0.36, a: 0 });
    stripDefs.push({ x: p.x + 0.28, z: p.z, sx: 0.018, sz: 0.36, a: 0 });
    // Glyphen
    stripDefs.push({ x: p.x - 0.12, z: p.z + 0.02, sx: 0.13, sz: 0.022, a: Math.PI / 4 });
    stripDefs.push({ x: p.x + 0.12, z: p.z + 0.02, sx: 0.13, sz: 0.022, a: -Math.PI / 4 });
    stripDefs.push({ x: p.x, z: p.z + 0.10, sx: 0.022, sz: 0.12, a: 0 });
    stripDefs.push({ x: p.x - 0.11, z: p.z - 0.09, sx: 0.014, sz: 0.10, a: Math.PI / 4 });
    stripDefs.push({ x: p.x + 0.11, z: p.z - 0.09, sx: 0.014, sz: 0.10, a: -Math.PI / 4 });
    stripDefs.push({ x: p.x, z: p.z - 0.12, sx: 0.12, sz: 0.02, a: 0 });
  }

  const patternStrips = new THREE.InstancedMesh(stripGeo, matPattern, stripDefs.length);
  patternStrips.name = 'ancient_ornament_strips';
  const m4 = new THREE.Matrix4();
  const vPos = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const vScale = new THREE.Vector3();
  const euler = new THREE.Euler();
  stripDefs.forEach((s, i) => {
    vPos.set(s.x, 0.891, s.z);
    euler.set(0, s.a, 0);
    q.setFromEuler(euler);
    vScale.set(s.sx, 1, s.sz);
    m4.compose(vPos, q, vScale);
    patternStrips.setMatrixAt(i, m4);
  });
  patternStrips.instanceMatrix.needsUpdate = true;
  table.add(patternStrips);

  // Emblem auf dem vorderen mittleren Feld
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.008, 6, 24), matRail);
  emblem.rotation.x = -Math.PI / 2;
  emblem.position.set(0, 0.894, 0.21);
  table.add(emblem);

  const emblemInner = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.005, 6, 20), matPattern);
  emblemInner.rotation.x = -Math.PI / 2;
  emblemInner.position.set(0, 0.896, 0.21);
  table.add(emblemInner);

  // Scanbalken, der bei einem Datenbankscan über die Felder läuft
  const scanBar = addBox(table, [0.54, 0.005, 0.03], [0, 0.897, -0.34], matScreenLine);
  scanBar.visible = false;

  // ------------------------------------------------------------
  // Integriertes Rückdisplay (blaue Datenmuster)
  // ------------------------------------------------------------
  const display = new THREE.Group();
  display.name = 'antiker_datenmonitor';
  root.add(display);

  // Stützen stehen auf der Tischplatte (y = 0,86)
  addCylinder(display, 0.018, 0.018, 0.20, [-0.30, 0.96, -0.44], matCopper, null, 10);
  addCylinder(display, 0.018, 0.018, 0.20, [0.30, 0.96, -0.44], matCopper, null, 10);

  addBox(display, [0.86, 0.46, 0.06], [0, 1.27, -0.44], matDark);
  addBox(display, [0.90, 0.035, 0.09], [0, 1.505, -0.44], matRail);
  addBox(display, [0.78, 0.38, 0.01], [0, 1.27, -0.405], matScreen);

  // Datenbalken
  const dataBars = [];
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.078;
    const h = 0.06 + ((i * 7) % 5) * 0.035;
    const bar = addBox(display, [0.038, h, 0.006], [x, 1.09 + h / 2, -0.396], matScreenLine);
    bar.userData.baseH = h;
    bar.userData.phase = i * 0.7;
    dataBars.push(bar);
  }

  // Horizontale Datenlinien
  for (let i = 0; i < 3; i++) {
    addBox(display, [0.70 - i * 0.09, 0.008, 0.005], [-0.02, 1.45 - i * 0.05, -0.395], matScreenLine);
  }

  // Scanzeile im Display
  const displayScan = addBox(display, [0.72, 0.009, 0.005], [0, 1.14, -0.393], matScreenLine);

  // ------------------------------------------------------------
  // Irdischer Laptop
  // ------------------------------------------------------------
  const laptop = new THREE.Group();
  laptop.name = 'earth_laptop';
  laptop.position.set(0.42, 0.89, -0.05);
  root.add(laptop);

  addBox(laptop, [0.43, 0.026, 0.29], [0, 0.013, 0], matLaptop);
  addBox(laptop, [0.40, 0.008, 0.25], [0, 0.029, 0.008], matRubber);
  addBox(laptop, [0.12, 0.006, 0.065], [0, 0.033, 0.095], matLaptopLight);

  // Tastatur
  const keyGeo = new THREE.BoxGeometry(0.026, 0.006, 0.018);
  const keys = new THREE.InstancedMesh(keyGeo, matLaptopLight, 40);
  keys.name = 'earth_laptop_keys';
  const km = new THREE.Matrix4();
  const kPos = new THREE.Vector3();
  const kScale = new THREE.Vector3(1, 1, 1);
  const kQuat = new THREE.Quaternion();
  let keyIndex = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 10; c++) {
      kPos.set((c - 4.5) * 0.032, 0.036, (r - 1.5) * 0.025 - 0.025);
      km.compose(kPos, kQuat, kScale);
      keys.setMatrixAt(keyIndex++, km);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  // Bildschirm
  const screenPivot = new THREE.Group();
  screenPivot.position.set(0, 0.026, -0.135);
  screenPivot.rotation.x = -0.15;
  laptop.add(screenPivot);

  addBox(screenPivot, [0.40, 0.255, 0.026], [0, 0.1275, 0], matLaptop);
  addBox(screenPivot, [0.355, 0.205, 0.008], [0, 0.13, 0.017], matScreen);

  for (let i = 0; i < 6; i++) {
    addBox(
      screenPivot,
      [0.19 - (i % 3) * 0.025, 0.006, 0.004],
      [-0.055 + (i % 2) * 0.05, 0.18 - i * 0.032, 0.024],
      matScreenLine
    );
  }
  addBox(screenPivot, [0.07, 0.006, 0.004], [0.095, 0.055, 0.024], matScreenLine);
  addBox(screenPivot, [0.055, 0.006, 0.004], [-0.10, 0.065, 0.024], matScreenLine);

  // ------------------------------------------------------------
  // Irdisches Oszilloskop
  // ------------------------------------------------------------
  const scope = new THREE.Group();
  scope.name = 'earth_oscilloscope';
  scope.position.set(-0.70, 1.00, -0.17);
  root.add(scope);

  addBox(scope, [0.34, 0.22, 0.26], [0, 0, 0], matLaptop);
  addBox(scope, [0.25, 0.15, 0.008], [-0.03, 0.022, 0.134], matScreen);

  // Oszilloskop-Kurve
  for (let i = 0; i < 6; i++) {
    addBox(
      scope,
      [0.036, 0.006, 0.004],
      [-0.115 + i * 0.038, 0.025 + (i % 2 === 0 ? 0.020 : -0.018), 0.140],
      matScreenLine
    );
  }

  // Drehregler
  for (let i = 0; i < 3; i++) {
    addCylinder(
      scope,
      0.017,
      0.017,
      0.022,
      [0.085 + (i % 2) * 0.042, -0.055 + Math.floor(i / 2) * 0.045, 0.140],
      matLaptopLight,
      [Math.PI / 2, 0, 0],
      12
    );
  }

  // Messleitungen (liegen auf der Tischplatte)
  const cableArc = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.006, 6, 18, Math.PI * 1.2), matCable);
  cableArc.rotation.x = -Math.PI / 2;
  cableArc.rotation.z = 0.5;
  cableArc.position.set(-0.52, 0.894, -0.05);
  root.add(cableArc);

  const cableArc2 = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.005, 6, 16, Math.PI * 1.1), matCable);
  cableArc2.rotation.x = -Math.PI / 2;
  cableArc2.rotation.z = -0.7;
  cableArc2.position.set(0.66, 0.894, 0.12);
  root.add(cableArc2);

  addRod(scope, [0.14, -0.07, 0.06], [0.22, -0.10, -0.02], 0.006, matCable, 8);

  // ------------------------------------------------------------
  // Kompaktes Messgerät
  // ------------------------------------------------------------
  const meter = new THREE.Group();
  meter.name = 'earth_meter';
  meter.position.set(0.80, 0.97, 0.30);
  root.add(meter);

  addBox(meter, [0.25, 0.16, 0.22], [0, 0, 0], matLaptop);
  addBox(meter, [0.18, 0.08, 0.008], [0, 0.025, 0.114], matScreen);
  addBox(meter, [0.10, 0.006, 0.004], [0, 0.025, 0.121], matScreenLine);
  addCylinder(meter, 0.018, 0.018, 0.018, [-0.075, -0.042, 0.12], matLaptopLight,
    [Math.PI / 2, 0, 0], 12);
  addCylinder(meter, 0.018, 0.018, 0.018, [0.075, -0.042, 0.12], matLaptopLight,
    [Math.PI / 2, 0, 0], 12);

  // ------------------------------------------------------------
  // Irdische Schreibtischlampe
  // ------------------------------------------------------------
  const lamp = new THREE.Group();
  lamp.name = 'earth_desk_lamp';
  lamp.position.set(-0.85, 0.89, 0.29);
  root.add(lamp);

  addCylinder(lamp, 0.105, 0.115, 0.032, [0, 0.016, 0], matLaptop);
  addCylinder(lamp, 0.018, 0.024, 0.035, [0, 0.048, 0], matLaptopLight);

  addRod(lamp, [0.0, 0.05, 0.0], [0.10, 0.30, -0.02], 0.012, matLaptopLight, 10);
  addRod(lamp, [0.10, 0.30, -0.02], [0.22, 0.47, -0.10], 0.011, matLaptopLight, 10);
  addCylinder(lamp, 0.016, 0.016, 0.035, [0.10, 0.30, -0.02], matLaptopLight, [Math.PI / 2, 0, 0], 10);

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.12, 0.13, 16, 1, false),
    matLaptopLight
  );
  shade.position.set(0.245, 0.495, -0.115);
  shade.rotation.z = -0.34;
  shade.rotation.x = 0.14;
  lamp.add(shade);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), matBulb);
  bulb.position.set(0.248, 0.452, -0.092);
  lamp.add(bulb);

  // ------------------------------------------------------------
  // Kollision, Benutzen-Punkte, Lichtquellen
  // ------------------------------------------------------------
  const colMaterial = new THREE.MeshBasicMaterial({
    name: 'col_invisible',
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false
  });
  const collision = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.89, 1.00), colMaterial);
  collision.name = 'COL_research_terminal';
  collision.position.set(0, 0.445, 0);
  root.add(collision);

  const useTerminal = new THREE.Object3D();
  useTerminal.name = 'INT_terminal';
  useTerminal.position.set(0, 1.02, 0.66);
  useTerminal.userData = { label: 'Antike Forschungskonsole bedienen', radius: 0.8 };
  root.add(useTerminal);

  const useDatabase = new THREE.Object3D();
  useDatabase.name = 'INT_datenbank';
  useDatabase.position.set(-0.64, 1.00, 0.58);
  useDatabase.userData = { label: 'Antike Datenbank auslesen', radius: 0.7 };
  root.add(useDatabase);

  const useSimulator = new THREE.Object3D();
  useSimulator.name = 'INT_simulator';
  useSimulator.position.set(0.50, 1.02, 0.58);
  useSimulator.userData = { label: 'Forschungssimulation bedienen', radius: 0.7 };
  root.add(useSimulator);

  const lampCrystal = new THREE.Object3D();
  lampCrystal.name = 'LAMP_kristall';
  lampCrystal.position.set(0, 0.94, 0.05);
  lampCrystal.userData = { color: '#ffd98f', intensity: 5, distance: 3.5 };
  root.add(lampCrystal);

  const lampScreen = new THREE.Object3D();
  lampScreen.name = 'LAMP_bildschirm';
  lampScreen.position.set(0, 1.27, -0.28);
  lampScreen.userData = { color: '#2c9dff', intensity: 4, distance: 3 };
  root.add(lampScreen);

  const lampDesk = new THREE.Object3D();
  lampDesk.name = 'LAMP_lampe';
  lampDesk.position.set(-0.60, 1.33, 0.20);
  lampDesk.userData = { color: '#ffd17a', intensity: 6, distance: 3.2 };
  root.add(lampDesk);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let aktiv = false;
  let simulationLaeuft = false;
  let scanAktiv = false;
  let scanFortschritt = 0;
  let scanStatus = 'Bereit';
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const sdt = Math.min(dt, 0.1);
    zeit += sdt;

    const grund = aktiv ? 0.82 : 0.30;
    const puls = 0.07 * Math.sin(zeit * 2.1);
    matCrystal.emissiveIntensity +=
      ((aktiv ? grund + puls : grund) - matCrystal.emissiveIntensity) * Math.min(1, sdt * 5);
    matCrystalWarm.emissiveIntensity +=
      ((aktiv ? grund * 0.82 + puls * 0.7 : grund * 0.8) - matCrystalWarm.emissiveIntensity) *
      Math.min(1, sdt * 5);

    // Sanftes Flackern der irdischen Lampe (dauerhaft an)
    matBulb.emissiveIntensity =
      2.2 + 0.10 * Math.sin(zeit * 11.0) + 0.035 * Math.sin(zeit * 27.0);

    // Displays
    matScreen.emissiveIntensity = aktiv ? 0.85 + 0.20 * Math.sin(zeit * 3.4) : 0.55;
    matScreenLine.emissiveIntensity = simulationLaeuft
      ? 1.7 + 0.45 * Math.sin(zeit * 8.0)
      : 1.15;

    // Datenbalken im Rückdisplay
    dataBars.forEach((bar, i) => {
      const base = bar.userData.baseH;
      const factor = simulationLaeuft
        ? 0.55 + 0.45 * Math.abs(Math.sin(zeit * 2.6 + bar.userData.phase))
        : 0.85;
      const h = base * factor;
      bar.scale.y = h / base;
      bar.position.y = 1.09 + h / 2;
    });

    // Horizontale Scanzeile im Rückdisplay
    const frac = (zeit * 0.28) % 1;
    displayScan.position.y = 1.10 + frac * 0.32;

    // Scanbalken über den Kristallfeldern
    if (scanAktiv) {
      scanFortschritt = Math.min(1, scanFortschritt + sdt * 0.32);
      const t = scanFortschritt;
      scanBar.visible = true;
      scanBar.position.z = -0.34 + t * 0.68;
      scanBar.position.x = (t < 0.5 ? 0 : (t < 0.75 ? 0.62 : -0.62));
      if (scanFortschritt >= 1) {
        scanAktiv = false;
        scanBar.visible = false;
        scanStatus = 'Datenbank vollständig ausgelesen';
      }
    } else {
      scanBar.visible = false;
    }
  }

  panels[0].onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    aktivieren() {
      aktiv = true;
      scanStatus = 'Antiker Kern aktiv';
    },
    deaktivieren() {
      aktiv = false;
      simulationLaeuft = false;
      scanAktiv = false;
      scanFortschritt = 0;
      scanBar.visible = false;
      scanStatus = 'Antiker Kern deaktiviert';
    },
    datenbankAuslesen() {
      if (!aktiv) {
        scanStatus = 'Antiker Kern zuerst aktivieren';
        return;
      }
      scanAktiv = true;
      scanFortschritt = 0;
      scanStatus = 'Datenbank wird ausgelesen';
    },
    scanGeraet() {
      if (!aktiv) {
        scanStatus = 'Antiker Kern zuerst aktivieren';
        return;
      }
      scanAktiv = true;
      scanFortschritt = 0;
      scanStatus = 'Angeschlossenes Gerät wird untersucht';
    },
    simulationStarten() {
      if (!aktiv) {
        scanStatus = 'Antiker Kern zuerst aktivieren';
        return;
      }
      simulationLaeuft = true;
      scanStatus = 'Simulation läuft';
    },
    simulationStoppen() {
      simulationLaeuft = false;
      scanStatus = 'Simulation angehalten';
    },
    get aktiv() { return aktiv; },
    get simulationLaeuft() { return simulationLaeuft; },
    get scanAktiv() { return scanAktiv; },
    get scanFortschritt() { return scanFortschritt; },
    get scanStatus() { return scanStatus; }
  };

  root.userData.api = api;

  root.userData.actions = [
    { id: 'aktivieren', label: 'Antiker Kern aktivieren', run: () => api.aktivieren() },
    { id: 'deaktivieren', label: 'Antiker Kern deaktivieren', run: () => api.deaktivieren() },
    { id: 'datenbank', label: 'Datenbank auslesen', run: () => api.datenbankAuslesen() },
    { id: 'scan', label: 'Angeschlossenes Gerät untersuchen', run: () => api.scanGeraet() },
    { id: 'simulation-start', label: 'Forschungssimulation starten', run: () => api.simulationStarten() },
    { id: 'simulation-stop', label: 'Forschungssimulation stoppen', run: () => api.simulationStoppen() }
  ];

  // ------------------------------------------------------------
  // Schatten
  // ------------------------------------------------------------
  root.traverse((object) => {
    if (object.isMesh && object.name !== 'COL_research_terminal') {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return root;
}

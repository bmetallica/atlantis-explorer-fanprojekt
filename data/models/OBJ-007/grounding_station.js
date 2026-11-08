import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

function cylinderBetween(a, b, radius, material, segments = 8) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, segments),
    material
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  return mesh;
}

function createScreen(number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  function draw(online) {
    ctx.fillStyle = '#061923';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = online ? '#4dbbd8' : '#d78632';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = online ? '#6fe3ff' : '#ffb257';
    ctx.font = 'bold 25px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`GROUNDING STATION ${number}`, 256, 43);

    ctx.font = 'bold 54px monospace';
    ctx.fillText('031547', 256, 111);

    ctx.font = 'bold 23px monospace';
    ctx.fillText(online ? 'STATUS: CONNECTED' : 'STATUS: ISOLATED', 256, 158);

    ctx.font = '20px monospace';
    ctx.fillText(
      online ? 'LIGHTNING PATH: TO SEA' : 'LIGHTNING PATH: CITY NETWORK',
      256,
      195
    );

    ctx.fillStyle = online ? '#8edfff' : '#ffc47a';
    ctx.fillText(
      online ? 'GROUNDING ACTIVE' : 'SHIELD TRANSFER ENABLED',
      256,
      226
    );

    texture.needsUpdate = true;
  }

  draw(true);
  return { texture, draw };
}

export const steckbrief = {
  name: 'grounding_station',
  art: 'Standobjekt',
  masse: '3,50 × 6,00 × 2,50 m (B × H × T); Säulendurchmesser ca. 1,84 m',
  benutzen: 'INT_abschaltkonsole → Abschaltcode 031547',
  lichter: 'LAMP_kupplung und LAMP_konsole (eisblau)',
  animation:
    'Kupplung und Konsole pulsieren; bei Abschaltung hebt und verschiebt sich die obere Säulenhälfte, der freiliegende Energiekern pulsiert bernsteinfarben',
  quelle: 'selbst gebaut nach Referenzbildern',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'grounding_station';

  const stationNumber = Number(opts.nummer ?? opts.station ?? 1);

  const material = {
    wall: kit('wall'),
    wallDark: kit('wallDark'),
    copper: kit('copper'),
    pillar: kit('pillar'),
    hull: kit('hull'),
    floor: kit('floor'),
    rail: kit('rail'),
    glass: kit('glass'),
    bronze: new THREE.MeshStandardMaterial({
      name: 'grounding_bronze',
      color: 0x5c4034,
      emissive: 0x120a07,
      emissiveIntensity: 0.08,
      metalness: 0.76,
      roughness: 0.39,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      name: 'grounding_dark_metal',
      color: 0x263239,
      metalness: 0.82,
      roughness: 0.38,
    }),
    cable: new THREE.MeshStandardMaterial({
      name: 'grounding_cable',
      color: 0x151b1e,
      metalness: 0.34,
      roughness: 0.68,
    }),
    glow: new THREE.MeshStandardMaterial({
      name: 'grounding_glow',
      color: 0x0b2835,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.2,
      metalness: 0.18,
      roughness: 0.3,
    }),
    amber: new THREE.MeshStandardMaterial({
      name: 'grounding_amber',
      color: 0x3b210b,
      emissive: 0xffa52e,
      emissiveIntensity: 0.5,
      metalness: 0.24,
      roughness: 0.36,
    }),
  };

  // --- Metallplattform
  const platformEdge = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.08, 2.5),
    material.wallDark
  );
  platformEdge.position.set(0.35, 0.04, 0);
  root.add(platformEdge);

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(3.38, 0.12, 2.38),
    material.floor
  );
  platform.position.set(0.35, 0.1, 0);
  root.add(platform);

  const platformFrontTrim = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.055, 0.055),
    material.copper
  );
  platformFrontTrim.position.set(0.35, 0.13, 1.195);
  root.add(platformFrontTrim);

  // --- Breiter, technischer Sockel
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.02, 0.46, 12),
    material.wallDark
  );
  base.position.y = 0.39;
  root.add(base);

  const baseUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.94, 0.15, 12),
    material.bronze
  );
  baseUpper.position.y = 0.67;
  root.add(baseUpper);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.94, 0.065, 8, 36),
    material.copper
  );
  baseRing.position.y = 0.61;
  baseRing.rotation.x = Math.PI / 2;
  root.add(baseRing);

  const dummy = new THREE.Object3D();

  // Lüftungsklappen am Sockel
  const ventGeometry = new THREE.BoxGeometry(0.15, 0.14, 0.035);
  const vents = new THREE.InstancedMesh(ventGeometry, material.amber, 12);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    dummy.position.set(
      Math.sin(angle) * 0.985,
      0.39,
      Math.cos(angle) * 0.985
    );
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    vents.setMatrixAt(i, dummy.matrix);
  }
  vents.instanceMatrix.needsUpdate = true;
  root.add(vents);

  // --- Untere Säulenhälfte
  const lowerGroup = new THREE.Group();
  lowerGroup.name = 'grounding_lower_half';
  root.add(lowerGroup);

  const lowerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.79, 2.64, 32),
    material.bronze
  );
  lowerShaft.position.y = 1.9;
  lowerGroup.add(lowerShaft);

  // Subtile vertikale Rillen
  const lowerFluteGeometry = new THREE.BoxGeometry(0.042, 2.16, 0.035);
  const lowerFlutes = new THREE.InstancedMesh(
    lowerFluteGeometry,
    material.darkMetal,
    14
  );
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 0.76 - (1.9 - 1.0) * 0.018;
    dummy.position.set(
      Math.cos(angle) * radius,
      1.86,
      Math.sin(angle) * radius
    );
    dummy.rotation.set(0, Math.PI / 2 - angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lowerFlutes.setMatrixAt(i, dummy.matrix);
  }
  lowerFlutes.instanceMatrix.needsUpdate = true;
  lowerGroup.add(lowerFlutes);

  [0.8, 1.67, 2.53].forEach((y, index) => {
    const radius = 0.77 - index * 0.008;
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.047, 8, 32),
      index === 1 ? material.copper : material.darkMetal
    );
    rib.position.y = y;
    rib.rotation.x = Math.PI / 2;
    lowerGroup.add(rib);
  });

  const lowerCoupling = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.84, 0.36, 32),
    material.wallDark
  );
  lowerCoupling.position.y = 3.18;
  lowerGroup.add(lowerCoupling);

  const couplingRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.07, 8, 36),
    material.copper
  );
  couplingRing.position.y = 3.18;
  couplingRing.rotation.x = Math.PI / 2;
  lowerGroup.add(couplingRing);

  const lowerGlowBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.835, 0.835, 0.055, 32),
    material.glow
  );
  lowerGlowBand.position.y = 3.345;
  lowerGroup.add(lowerGlowBand);

  // --- Obere, mechanisch trennbare Säulenhälfte
  const upperGroup = new THREE.Group();
  upperGroup.name = 'grounding_upper_half';
  upperGroup.position.set(0, 3.18, 0);
  root.add(upperGroup);

  const upperCoupling = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.9, 0.28, 32),
    material.bronze
  );
  upperCoupling.position.y = 0.08;
  upperGroup.add(upperCoupling);

  const upperShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.69, 0.75, 1.55, 32),
    material.bronze
  );
  upperShaft.position.y = 0.9;
  upperGroup.add(upperShaft);

  const upperFluteGeometry = new THREE.BoxGeometry(0.034, 1.3, 0.03);
  const upperFlutes = new THREE.InstancedMesh(
    upperFluteGeometry,
    material.copper,
    12
  );
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * 0.722,
      0.91,
      Math.sin(angle) * 0.722
    );
    dummy.rotation.set(0, Math.PI / 2 - angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    upperFlutes.setMatrixAt(i, dummy.matrix);
  }
  upperFlutes.instanceMatrix.needsUpdate = true;
  upperGroup.add(upperFlutes);

  // --- Verbreiterter, gerippter Kopf
  const headLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.78, 0.17, 32),
    material.wallDark
  );
  headLower.position.y = 1.7;
  upperGroup.add(headLower);

  const headBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.9, 0.33, 32),
    material.bronze
  );
  headBody.position.y = 1.94;
  upperGroup.add(headBody);

  const headUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.83, 0.17, 32),
    material.wallDark
  );
  headUpper.position.y = 2.18;
  upperGroup.add(headUpper);

  const headBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.845, 0.845, 0.055, 32),
    material.glow
  );
  headBand.position.y = 1.95;
  upperGroup.add(headBand);

  const headRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.055, 8, 36),
    material.copper
  );
  headRing.position.y = 2.18;
  headRing.rotation.x = Math.PI / 2;
  upperGroup.add(headRing);

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.58, 0.19, 24),
    material.darkMetal
  );
  crown.position.y = 2.34;
  upperGroup.add(crown);

  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.49, 0.045, 8, 32),
    material.copper
  );
  crownRing.position.y = 2.41;
  crownRing.rotation.x = Math.PI / 2;
  upperGroup.add(crownRing);

  // Radiale Ausleger und angeschlossene Blitzableiter-Kabel
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

    const spokeStart = radial.clone().multiplyScalar(0.34).setY(2.37);
    const spokeEnd = radial.clone().multiplyScalar(0.9).setY(2.37);
    upperGroup.add(
      cylinderBetween(spokeStart, spokeEnd, 0.024, material.copper, 8)
    );

    const terminalBottom = radial.clone().multiplyScalar(0.9).setY(2.64);
    const terminalTop = radial.clone().multiplyScalar(0.9).setY(2.82);
    upperGroup.add(
      cylinderBetween(
        terminalBottom,
        terminalTop,
        0.022,
        material.darkMetal,
        8
      )
    );

    const start = radial.clone().multiplyScalar(0.25).setY(2.42);
    const middle = radial.clone().multiplyScalar(0.62).setY(2.67);
    const end = radial.clone().multiplyScalar(0.9).setY(2.64);
    const curve = new THREE.CatmullRomCurve3([start, middle, end]);
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, 0.027, 5, false),
      material.cable
    );
    upperGroup.add(cable);
  }

  // --- In der Trennfuge sichtbarer Energiekern
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.49, 0.48, 24),
    material.glow
  );
  core.position.y = 3.28;
  root.add(core);

  const coreOuter = new THREE.Mesh(
    new THREE.TorusGeometry(0.61, 0.045, 8, 32),
    material.amber
  );
  coreOuter.position.y = 3.28;
  coreOuter.rotation.x = Math.PI / 2;
  root.add(coreOuter);

  // Bolzen an der unteren Kupplung
  const boltGeometry = new THREE.CylinderGeometry(0.058, 0.058, 0.052, 8);
  const bolts = new THREE.InstancedMesh(boltGeometry, material.copper, 16);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * 0.905,
      3.18,
      Math.sin(angle) * 0.905
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bolts.setMatrixAt(i, dummy.matrix);
  }
  bolts.instanceMatrix.needsUpdate = true;
  lowerGroup.add(bolts);

  // --- Seitliches Gittergeländer
  const postGeometry = new THREE.CylinderGeometry(0.031, 0.036, 0.95, 8);
  const postPositions = [
    [-1.22, 0.61, -1.02],
    [-1.22, 0.61, -0.34],
    [-1.22, 0.61, 0.34],
    [-1.22, 0.61, 1.02],
    [-0.55, 0.61, 1.08],
    [0.12, 0.61, 1.08],
    [0.62, 0.61, 1.08],
  ];
  const posts = new THREE.InstancedMesh(
    postGeometry,
    material.rail,
    postPositions.length
  );
  postPositions.forEach((p, i) => {
    dummy.position.set(p[0], p[1], p[2]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
  });
  posts.instanceMatrix.needsUpdate = true;
  root.add(posts);

  const railSegments = [
    [new THREE.Vector3(-1.22, 1.08, -1.02), new THREE.Vector3(-1.22, 1.08, 1.02)],
    [new THREE.Vector3(-1.22, 0.61, -1.02), new THREE.Vector3(-1.22, 0.61, 1.02)],
    [new THREE.Vector3(-1.22, 1.08, 1.08), new THREE.Vector3(0.62, 1.08, 1.08)],
    [new THREE.Vector3(-1.22, 0.61, 1.08), new THREE.Vector3(0.62, 0.61, 1.08)],
    [new THREE.Vector3(-1.22, 1.08, -1.02), new THREE.Vector3(0.3, 1.08, -1.08)],
  ];
  railSegments.forEach(([a, b]) => {
    root.add(cylinderBetween(a, b, 0.026, material.rail, 8));
  });

  // --- Antiker Bedienkonsole rechts neben der Säule
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'grounding_console';
  consoleGroup.position.set(1.35, 0, 0.15);
  root.add(consoleGroup);

  const consoleFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.18, 0.68),
    material.wallDark
  );
  consoleFoot.position.y = 0.24;
  consoleGroup.add(consoleFoot);

  const consolePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.31, 1.08, 8),
    material.bronze
  );
  consolePedestal.position.y = 0.84;
  consoleGroup.add(consolePedestal);

  const consoleCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.29, 0.13, 12),
    material.copper
  );
  consoleCollar.position.y = 1.36;
  consoleGroup.add(consoleCollar);

  const consolePanel = new THREE.Group();
  consolePanel.position.set(0, 1.43, 0.18);
  consolePanel.rotation.x = -0.3;
  consoleGroup.add(consolePanel);

  const panelBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.62, 0.22),
    material.wallDark
  );
  consolePanel.add(panelBody);

  const panelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.71, 0.48, 0.035),
    material.copper
  );
  panelFrame.position.z = 0.125;
  consolePanel.add(panelFrame);

  const screenData = createScreen(stationNumber);
  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'grounding_screen',
    map: screenData.texture,
    emissiveMap: screenData.texture,
    emissive: 0xffffff,
    emissiveIntensity: 0.82,
    metalness: 0.05,
    roughness: 0.25,
  });

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.63, 0.315),
    screenMaterial
  );
  screen.position.set(0, 0.06, 0.147);
  consolePanel.add(screen);

  const buttonGeometry = new THREE.BoxGeometry(0.075, 0.043, 0.032);
  const buttons = new THREE.InstancedMesh(buttonGeometry, material.amber, 8);
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 4; column++) {
      dummy.position.set(
        -0.235 + column * 0.157,
        -0.18 - row * 0.062,
        0.15
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      buttons.setMatrixAt(row * 4 + column, dummy.matrix);
    }
  }
  buttons.instanceMatrix.needsUpdate = true;
  consolePanel.add(buttons);

  // Kleine seitliche Schulter der Konsole
  const consoleShoulder = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.48, 0.38),
    material.copper
  );
  consoleShoulder.position.set(0.43, 1.08, 0.02);
  consoleGroup.add(consoleShoulder);

  // --- Kollisionskörper; bewegte obere Hälfte bleibt ohne COL_
  const colLower = new THREE.Mesh(new THREE.BoxGeometry(1.94, 3.42, 1.94));
  colLower.name = 'COL_erdungsstation_untere_haelfte';
  colLower.position.y = 1.71;
  root.add(colLower);

  const colConsole = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.66, 0.76));
  colConsole.name = 'COL_abschaltkonsole';
  colConsole.position.set(1.35, 0.83, 0.15);
  root.add(colConsole);

  // --- Benutzen-Punkt vor der Konsole
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_abschaltkonsole';
  usePoint.position.set(1.35, 1.3, 0.95);
  usePoint.userData = {
    label: 'Abschaltkonsole der Erdungsstation bedienen',
    radius: 0.9,
  };
  root.add(usePoint);

  // --- Dauerhaft eingeschaltete Lichter
  const lampCore = new THREE.Object3D();
  lampCore.name = 'LAMP_kupplung';
  lampCore.position.set(0, 3.28, 0);
  lampCore.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  root.add(lampCore);

  const lampConsole = new THREE.Object3D();
  lampConsole.name = 'LAMP_konsole';
  lampConsole.position.set(1.35, 1.47, 0.62);
  lampConsole.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 3.5,
  };
  root.add(lampConsole);

  // --- Zustand und Animation
  let verbunden = true;
  let geteilt = false;
  let trennungsgrad = 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    zeit += dt;

    const ziel = geteilt ? 1 : 0;
    trennungsgrad += (ziel - trennungsgrad) * Math.min(1, dt * 2.2);
    const weiche =
      trennungsgrad * trennungsgrad * (3 - 2 * trennungsgrad);

    upperGroup.position.set(
      weiche * 0.34,
      3.18 + weiche * 0.54,
      weiche * 0.1
    );

    const puls = 0.5 + 0.5 * Math.sin(zeit * 3.1);

    material.glow.emissive.setHex(verbunden ? 0x6fe3ff : 0xffa52e);
    material.glow.emissiveIntensity = verbunden
      ? 0.85 + puls * 0.65
      : 1.75 + puls * 1.15;

    material.amber.emissiveIntensity = verbunden
      ? 0.38 + puls * 0.25
      : 0.95 + puls * 0.65;

    screenMaterial.emissiveIntensity = verbunden
      ? 0.7 + puls * 0.16
      : 1.05 + puls * 0.3;

    core.scale.y = 1 + weiche * 0.38;
    coreOuter.scale.setScalar(1 + weiche * 0.16);
    coreOuter.visible = weiche > 0.015 || !verbunden;
  }

  const updateTrigger = lowerGlowBand;
  updateTrigger.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };
  root.userData.update = update;

  // --- Öffentliche API
  const api = {
    abschalten(code = '031547') {
      const normalized = String(code).replace(/\s+/g, '');
      if (normalized !== '031547') {
        return false;
      }

      verbunden = false;
      geteilt = true;
      screenData.draw(false);
      return true;
    },

    verbinden() {
      verbunden = true;
      geteilt = false;
      screenData.draw(true);
      return true;
    },

    get verbunden() {
      return verbunden;
    },

    get geteilt() {
      return geteilt;
    },

    get trennungsgrad() {
      return trennungsgrad;
    },

    get stationNumber() {
      return stationNumber;
    },
  };

  root.userData.api = api;
  root.userData.stationNumber = stationNumber;
  root.userData.actions = [
    {
      id: 'abschalten',
      label: 'Abschaltcode 031547 eingeben und Erdungsstation abschalten',
      run: () => api.abschalten('031547'),
    },
    {
      id: 'verbinden',
      label: 'Erdungsstation wieder mit dem Meer verbinden',
      run: () => api.verbinden(),
    },
  ];

  return root;
}

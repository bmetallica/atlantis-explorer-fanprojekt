import * as THREE from 'three';

export const steckbrief = {
  name: 'containment_chamber',
  art: 'Standobjekt',
  masse: '4,77 × 3,12 × 1,33 m (B × H × T), ca. 3,5 t',
  wohin: 'ATL-012 – Kontenainment-Kammer / Containment Chamber Room',
  benutzen: 'INT_bedienen für das Arcturus-Experiment; INT_notfall für Überlast und Notabschaltung',
  lichter: 'LAMP_kern (gelb-weiß), LAMP_segmente (grün), LAMP_konsole (bernstein), LAMP_displays (eisblau)',
  animation: 'Kern, Feldringe und Anzeigen pulsieren; grüne Ringsegmente laufen als Lichtwelle; Überlast lässt den Kern rot-orange glühen und flackern',
  quelle: 'selbst gebaut, angelehnt an die Arcturus-Eindämmungskammer und die Ancient-Technik von Stargate Atlantis',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'containment_chamber';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const matFrame = kit('wallDark');
  const matPearl = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matHull = kit('hull');

  const matDark = new THREE.MeshStandardMaterial({
    name: 'containment_darkmetal',
    color: 0x344654,
    metalness: 0.86,
    roughness: 0.34,
  });

  const matGreen = new THREE.MeshStandardMaterial({
    name: 'containment_green_glow',
    color: 0xffffff,
    emissive: 0x18ff72,
    emissiveIntensity: 2.0,
    metalness: 0.18,
    roughness: 0.28,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'containment_amber_glow',
    color: 0xffa044,
    emissive: 0xff761c,
    emissiveIntensity: 1.8,
    metalness: 0.16,
    roughness: 0.3,
  });

  const matWhiteGlow = new THREE.MeshStandardMaterial({
    name: 'containment_white_glow',
    color: 0xfff7dc,
    emissive: 0xffe9a2,
    emissiveIntensity: 3.0,
    metalness: 0.04,
    roughness: 0.22,
  });

  const matCore = new THREE.MeshStandardMaterial({
    name: 'containment_core',
    color: 0xffedaa,
    emissive: 0xffdd62,
    emissiveIntensity: 3.8,
    metalness: 0.0,
    roughness: 0.2,
  });

  const matCoreShell = new THREE.MeshStandardMaterial({
    name: 'containment_core_shell',
    color: 0x6c5922,
    emissive: 0x9c7618,
    emissiveIntensity: 0.38,
    metalness: 0.52,
    roughness: 0.42,
    flatShading: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const matBlueGlow = new THREE.MeshStandardMaterial({
    name: 'containment_blue_glow',
    color: 0x70e5ff,
    emissive: 0x35cfff,
    emissiveIntensity: 1.7,
    metalness: 0.12,
    roughness: 0.25,
  });

  const matStrip = new THREE.MeshStandardMaterial({
    name: 'containment_white_strip',
    color: 0xe2fbff,
    emissive: 0xa5eaff,
    emissiveIntensity: 1.9,
    metalness: 0.04,
    roughness: 0.24,
  });

  // ---------------------------------------------------------
  // Anzeigetexturen für die großen Wanddisplays
  // ---------------------------------------------------------
  function createDisplayTexture(title, warning = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;

    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, warning ? '#321609' : '#062b37');
    bg.addColorStop(1, warning ? '#0d0704' : '#020b11');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = warning
      ? 'rgba(255,135,40,0.18)'
      : 'rgba(70,220,255,0.18)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = warning ? '#ff9c42' : '#75e9ff';
    ctx.fillRect(0, 0, canvas.width, 54);
    ctx.fillStyle = warning ? '#251006' : '#03151d';
    ctx.font = 'bold 27px monospace';
    ctx.fillText(title, 22, 37);

    ctx.font = '16px monospace';
    for (let i = 0; i < 9; i++) {
      const y = 88 + i * 29;
      const width = 130 + ((i * 79) % 280);
      ctx.fillStyle = warning
        ? `rgba(255,150,55,${0.35 + (i % 3) * 0.12})`
        : `rgba(85,225,255,${0.32 + (i % 3) * 0.12})`;
      ctx.fillRect(24, y, width, 6);
      ctx.fillRect(332, y, 110 + ((i * 31) % 42), 6);
    }

    ctx.strokeStyle = warning ? '#ff6a24' : '#59e6ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const screenTexture = createDisplayTexture('ARCTURUS // BRIDGE');
  const warningTexture = createDisplayTexture('EXOTIC FLUX // WARNING', true);

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'containment_display',
    color: 0xc7f4ff,
    map: screenTexture,
    emissive: 0xffffff,
    emissiveMap: screenTexture,
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.4,
  });

  const matWarningScreen = new THREE.MeshStandardMaterial({
    name: 'containment_warning_display',
    color: 0xffc79a,
    map: warningTexture,
    emissive: 0xffffff,
    emissiveMap: warningTexture,
    emissiveIntensity: 1.1,
    metalness: 0.0,
    roughness: 0.4,
  });

  // ---------------------------------------------------------
  // Bodenplattform und tragende Stützen
  // ---------------------------------------------------------
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(2.24, 0.16, 0.82),
    matFrame,
  );
  plinth.position.set(0, 0.08, 0.06);
  root.add(plinth);

  const plinthTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 0.055, 0.68),
    matCopper,
  );
  plinthTrim.position.set(0, 0.18, 0.08);
  root.add(plinthTrim);

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.48, 0.52),
    matPearl,
  );
  pedestal.position.set(0, 0.42, -0.03);
  root.add(pedestal);

  const pedestalInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.28, 0.55),
    matDark,
  );
  pedestalInset.position.set(0, 0.4, 0.04);
  root.add(pedestalInset);

  const forkLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.66, 0.42),
    matPearl,
  );
  forkLeft.position.set(-0.57, 0.72, -0.04);
  forkLeft.rotation.z = -0.13;
  root.add(forkLeft);

  const forkRight = forkLeft.clone();
  forkRight.position.x = 0.57;
  forkRight.rotation.z = 0.13;
  root.add(forkRight);

  const forkCopperLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.58, 0.445),
    matRail,
  );
  forkCopperLeft.position.set(-0.57, 0.73, -0.035);
  forkCopperLeft.rotation.z = -0.13;
  root.add(forkCopperLeft);

  const forkCopperRight = forkCopperLeft.clone();
  forkCopperRight.position.x = 0.57;
  forkCopperRight.rotation.z = 0.13;
  root.add(forkCopperRight);

  // ---------------------------------------------------------
  // Kammerring, Rückwand, radiale Rippen und Kern
  // ---------------------------------------------------------
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, 1.58, 0);
  root.add(ringGroup);

  const rearHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(1.31, 1.31, 0.34, 64),
    matDark,
  );
  rearHousing.rotation.x = Math.PI / 2;
  rearHousing.position.z = -0.17;
  ringGroup.add(rearHousing);

  const rearFace = new THREE.Mesh(
    new THREE.CylinderGeometry(1.22, 1.22, 0.055, 64),
    matFrame,
  );
  rearFace.rotation.x = Math.PI / 2;
  rearFace.position.z = -0.37;
  ringGroup.add(rearFace);

  const rearHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.57, 0.57, 0.12, 48),
    matCopper,
  );
  rearHub.rotation.x = Math.PI / 2;
  rearHub.position.z = 0.01;
  ringGroup.add(rearHub);

  const rearHubCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.08, 48),
    matPearl,
  );
  rearHubCap.rotation.x = Math.PI / 2;
  rearHubCap.position.z = 0.09;
  ringGroup.add(rearHubCap);

  const rearTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.055, 10, 64),
    matCopper,
  );
  rearTrim.position.z = -0.405;
  ringGroup.add(rearTrim);

  const outerHousing = new THREE.Mesh(
    new THREE.TorusGeometry(1.28, 0.22, 18, 72),
    matFrame,
  );
  outerHousing.position.z = 0.02;
  ringGroup.add(outerHousing);

  const outerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(1.47, 0.07, 12, 72),
    matCopper,
  );
  outerTrim.position.z = 0.08;
  ringGroup.add(outerTrim);

  const innerHousing = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.13, 14, 64),
    matPearl,
  );
  innerHousing.position.z = 0.24;
  ringGroup.add(innerHousing);

  const innerShadow = new THREE.Mesh(
    new THREE.TorusGeometry(0.69, 0.055, 10, 64),
    matDark,
  );
  innerShadow.position.z = 0.31;
  ringGroup.add(innerShadow);

  const whiteRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.605, 0.062, 12, 64),
    matWhiteGlow,
  );
  whiteRing.position.z = 0.43;
  ringGroup.add(whiteRing);

  // Radiale Rippen als InstancedMesh.
  const ribCount = 36;
  const ribGeometry = new THREE.BoxGeometry(0.105, 0.44, 0.27);
  const ribs = new THREE.InstancedMesh(ribGeometry, matDark, ribCount);
  ribs.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < ribCount; i++) {
    const a = (i / ribCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 1.075, Math.sin(a) * 1.075, 0.11);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate = true;
  ringGroup.add(ribs);

  // Grüne Segmente am äußeren Ring.
  const segmentCount = 24;
  const segmentGeometry = new THREE.BoxGeometry(0.245, 0.105, 0.125);
  const segments = new THREE.InstancedMesh(
    segmentGeometry,
    matGreen,
    segmentCount,
  );
  segments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let i = 0; i < segmentCount; i++) {
    const a = (i / segmentCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 1.535, Math.sin(a) * 1.535, 0.09);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    segments.setMatrixAt(i, dummy.matrix);
    segments.setColorAt(i, new THREE.Color(0x72ff9f));
  }
  segments.instanceMatrix.needsUpdate = true;
  segments.instanceColor.needsUpdate = true;
  ringGroup.add(segments);

  // Kleine bernsteinfarbene Statusdioden zwischen den Segmenten.
  const diodeCount = 24;
  const diodeGeometry = new THREE.BoxGeometry(0.075, 0.035, 0.052);
  const diodes = new THREE.InstancedMesh(diodeGeometry, matAmber, diodeCount);

  for (let i = 0; i < diodeCount; i++) {
    const a = ((i + 0.5) / diodeCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 1.535, Math.sin(a) * 1.535, 0.17);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    diodes.setMatrixAt(i, dummy.matrix);
  }
  diodes.instanceMatrix.needsUpdate = true;
  ringGroup.add(diodes);

  // Leuchtender, kugelförmiger Kern.
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 32, 24),
    matCore,
  );
  core.position.z = 0.47;
  ringGroup.add(core);

  const coreShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.49, 2),
    matCoreShell,
  );
  coreShell.position.z = 0.47;
  coreShell.rotation.set(0.3, 0.5, 0.1);
  ringGroup.add(coreShell);

  // Schwebende Energieringe um den Kern.
  const energyRings = [];
  const energySpecs = [
    { radius: 0.535, tube: 0.014, rx: 0.2, ry: 0.9 },
    { radius: 0.575, tube: 0.012, rx: 1.1, ry: 0.35 },
    { radius: 0.475, tube: 0.009, rx: 0.7, ry: 1.2 },
  ];

  for (const spec of energySpecs) {
    const material = new THREE.MeshStandardMaterial({
      name: 'containment_energy_arc',
      color: 0xeaffff,
      emissive: 0x9eeeff,
      emissiveIntensity: 2.4,
      metalness: 0.0,
      roughness: 0.2,
    });

    const energyRing = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 8, 48),
      material,
    );
    energyRing.position.z = 0.48;
    energyRing.rotation.set(spec.rx, spec.ry, 0);
    ringGroup.add(energyRing);
    energyRings.push(energyRing);
  }

  // Weiße Leuchtleisten links und rechts der Kammeröffnung.
  for (const side of [-1, 1]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 1.52, 0.048),
      matStrip,
    );
    strip.position.set(side * 0.89, 1.58, 0.31);
    root.add(strip);
  }

  // ---------------------------------------------------------
  // Linker Anzeigepylon mit großem Wanddisplay
  // ---------------------------------------------------------
  const displayPylon = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 2.42, 0.34),
    matPearl,
  );
  displayPylon.position.set(-1.88, 1.29, -0.08);
  root.add(displayPylon);

  const pylonFoot = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.14, 0.52),
    matDark,
  );
  pylonFoot.position.set(-1.88, 0.07, -0.04);
  root.add(pylonFoot);

  const pylonInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 2.14, 0.06),
    matFrame,
  );
  pylonInset.position.set(-1.88, 1.29, 0.11);
  root.add(pylonInset);

  const displayFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.86, 0.09),
    matDark,
  );
  displayFrame.position.set(-1.88, 1.92, 0.16);
  root.add(displayFrame);

  const largeScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.76, 0.022),
    matScreen,
  );
  largeScreen.position.set(-1.88, 1.92, 0.218);
  root.add(largeScreen);

  const screenBevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.045, 0.065),
    matCopper,
  );
  screenBevel.position.set(-1.88, 1.45, 0.17);
  root.add(screenBevel);

  const lowerScreenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.5, 0.075),
    matDark,
  );
  lowerScreenFrame.position.set(-1.88, 1.08, 0.145);
  root.add(lowerScreenFrame);

  const lowerScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.4, 0.022),
    matWarningScreen,
  );
  lowerScreen.position.set(-1.88, 1.08, 0.195);
  root.add(lowerScreen);

  const pylonLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 1.46, 0.045),
    matStrip,
  );
  pylonLight.position.set(-2.31, 1.2, 0.16);
  root.add(pylonLight);

  // ---------------------------------------------------------
  // Rechtes Bedienpult mit großem Display und bernsteinfarbenen Anzeigen
  // ---------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(1.88, 0, 0);
  root.add(consoleGroup);

  const consoleFoot = new THREE.Mesh(
    new THREE.BoxGeometry(1.13, 0.13, 0.76),
    matDark,
  );
  consoleFoot.position.set(0, 0.065, 0.12);
  consoleGroup.add(consoleFoot);

  const consoleBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.8, 0.62),
    matFrame,
  );
  consoleBody.position.set(0, 0.42, 0.14);
  consoleGroup.add(consoleBody);

  const consoleTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.035, 0.04),
    matCopper,
  );
  consoleTrim.position.set(0, 0.69, 0.465);
  consoleGroup.add(consoleTrim);

  const consoleTower = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 1.5, 0.3),
    matPearl,
  );
  consoleTower.position.set(0, 1.61, -0.16);
  consoleGroup.add(consoleTower);

  const consoleScreenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.69, 0.08),
    matDark,
  );
  consoleScreenFrame.position.set(0, 1.9, 0.015);
  consoleGroup.add(consoleScreenFrame);

  const consoleScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.59, 0.022),
    matScreen,
  );
  consoleScreen.position.set(0, 1.9, 0.066);
  consoleGroup.add(consoleScreen);

  const consoleTop = new THREE.Group();
  consoleTop.position.set(0, 0.88, 0.16);
  consoleTop.rotation.x = -0.42;
  consoleGroup.add(consoleTop);

  const consolePlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.06, 0.58),
    matPearl,
  );
  consoleTop.add(consolePlate);

  const amberDisplayBorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.025, 0.33),
    matDark,
  );
  amberDisplayBorder.position.set(0, 0.038, -0.075);
  consoleTop.add(amberDisplayBorder);

  const amberDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.028, 0.25),
    matAmber,
  );
  amberDisplay.position.set(0, 0.056, -0.075);
  consoleTop.add(amberDisplay);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const keyMaterial = row === 0 && col < 2 ? matBlueGlow : matAmber;
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.035, 0.055),
        keyMaterial,
      );
      key.position.set(
        -0.29 + col * 0.145,
        0.06,
        0.12 + row * 0.09,
      );
      consoleTop.add(key);
    }
  }

  // Technische Leitung liegt sichtbar auf dem Boden.
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.42, 0.075, 0.36),
    new THREE.Vector3(1.12, 0.07, 0.47),
    new THREE.Vector3(0.82, 0.07, 0.48),
    new THREE.Vector3(0.62, 0.075, 0.38),
  ]);

  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 24, 0.035, 8, false),
    matDark,
  );
  root.add(cable);

  const cableClamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.1, 0.16),
    matCopper,
  );
  cableClamp.position.set(1.12, 0.05, 0.47);
  root.add(cableClamp);

  // ---------------------------------------------------------
  // Kollisionskörper
  // ---------------------------------------------------------
  const colChamber = new THREE.Mesh(
    new THREE.BoxGeometry(3.22, 3.12, 0.86),
  );
  colChamber.name = 'COL_kammerring';
  colChamber.position.set(0, 1.56, 0.03);
  colChamber.visible = false;
  root.add(colChamber);

  const colDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 2.42, 0.46),
  );
  colDisplay.name = 'COL_anzeigepylon';
  colDisplay.position.set(-1.88, 1.29, -0.04);
  colDisplay.visible = false;
  root.add(colDisplay);

  const colConsole = new THREE.Mesh(
    new THREE.BoxGeometry(1.13, 2.36, 0.8),
  );
  colConsole.name = 'COL_bedienpult';
  colConsole.position.set(1.88, 1.18, 0.02);
  colConsole.visible = false;
  root.add(colConsole);

  // ---------------------------------------------------------
  // Benutzen-Punkte und Lichter
  // ---------------------------------------------------------
  const useConsole = new THREE.Object3D();
  useConsole.name = 'INT_bedienen';
  useConsole.position.set(1.88, 1.05, 0.92);
  useConsole.userData = {
    label: 'Arcturus-Kammer bedienen',
    radius: 0.8,
  };
  root.add(useConsole);

  const useEmergency = new THREE.Object3D();
  useEmergency.name = 'INT_notfall';
  useEmergency.position.set(0, 1.55, 1.08);
  useEmergency.userData = {
    label: 'Notfallsteuerung der Eindämmung',
    radius: 0.8,
  };
  root.add(useEmergency);

  const lampCore = new THREE.Object3D();
  lampCore.name = 'LAMP_kern';
  lampCore.position.set(0, 1.58, 0.58);
  lampCore.userData = {
    color: '#fff0a6',
    intensity: 12,
    distance: 7,
  };
  root.add(lampCore);

  const lampSegments = new THREE.Object3D();
  lampSegments.name = 'LAMP_segmente';
  lampSegments.position.set(0, 1.58, 0.26);
  lampSegments.userData = {
    color: '#32ff88',
    intensity: 6,
    distance: 5,
  };
  root.add(lampSegments);

  const lampConsole = new THREE.Object3D();
  lampConsole.name = 'LAMP_konsole';
  lampConsole.position.set(1.88, 1.35, 0.36);
  lampConsole.userData = {
    color: '#ff9b35',
    intensity: 4,
    distance: 3,
  };
  root.add(lampConsole);

  const lampDisplays = new THREE.Object3D();
  lampDisplays.name = 'LAMP_displays';
  lampDisplays.position.set(-1.88, 1.92, 0.31);
  lampDisplays.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 4,
  };
  root.add(lampDisplays);

  // ---------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------
  let zustand = 'aus';
  let zeit = 0;
  let letzte = null;
  let smoothAktiv = 0;
  let smoothUeberlast = 0;

  const normalCoreColor = new THREE.Color(0xffdd62);
  const overloadCoreColor = new THREE.Color(0xff3b08);
  const white = new THREE.Color(0xffffff);
  const dimGreen = new THREE.Color(0x1b8f46);
  const brightGreen = new THREE.Color(0x8affb0);

  function setZustand(neu) {
    zustand = neu;
  }

  function update(dt) {
    zeit += dt;

    const zielAktiv = zustand === 'aus' ? 0 : 1;
    const zielUeberlast = zustand === 'ueberlast' ? 1 : 0;

    smoothAktiv += (zielAktiv - smoothAktiv) * Math.min(1, dt * 3.2);
    smoothUeberlast +=
      (zielUeberlast - smoothUeberlast) * Math.min(1, dt * 4.0);

    const puls = 0.5 + 0.5 * Math.sin(zeit * 3.4);
    const flackern = smoothUeberlast > 0.02
      ? 0.72 + 0.28 * Math.sin(zeit * 31) * Math.sin(zeit * 11)
      : 1;

    matCore.emissive.copy(normalCoreColor).lerp(
      overloadCoreColor,
      smoothUeberlast,
    );
    matCore.emissiveIntensity =
      (0.12 + smoothAktiv * (3.5 + puls * 1.7)) * flackern;
    matCore.color
      .copy(matCore.emissive)
      .lerp(white, 0.35);

    matCoreShell.emissive.copy(
      normalCoreColor,
    ).lerp(overloadCoreColor, smoothUeberlast);
    matCoreShell.emissiveIntensity =
      0.12 + smoothAktiv * (0.38 + puls * 0.28);
    matCoreShell.opacity = 0.16 + smoothAktiv * 0.3;

    const coreScale =
      1 +
      smoothAktiv * (0.025 + puls * 0.035) +
      smoothUeberlast * 0.075;
    core.scale.setScalar(coreScale);
    coreShell.scale.setScalar(
      1 + smoothAktiv * 0.018 + smoothUeberlast * 0.05,
    );
    coreShell.rotation.y += dt * (0.16 + smoothUeberlast * 0.65);
    coreShell.rotation.z += dt * 0.08;

    energyRings.forEach((ring, i) => {
      ring.material.emissiveIntensity =
        0.12 + smoothAktiv * (1.9 + puls * 1.15);
      ring.material.emissive.setHex(
        smoothUeberlast > 0.5 ? 0xff5a16 : 0x9eeeff,
      );
      ring.rotation.x += dt * (0.22 + i * 0.11) * smoothAktiv;
      ring.rotation.y += dt * (0.18 + i * 0.07) * smoothAktiv;
    });

    // Lichtwelle über die grünen Segmente.
    for (let i = 0; i < segmentCount; i++) {
      const phase = (i / segmentCount) * Math.PI * 2 - zeit * 1.8;
      const wave = Math.max(0, Math.sin(phase));
      const brightness = 0.16 + wave * 0.84 * smoothAktiv;

      const a = (i / segmentCount) * Math.PI * 2;
      dummy.position.set(
        Math.cos(a) * 1.535,
        Math.sin(a) * 1.535,
        0.09,
      );
      dummy.rotation.set(0, 0, a - Math.PI / 2);
      dummy.scale.set(1, 1, 1 + wave * smoothAktiv * 0.45);
      dummy.updateMatrix();
      segments.setMatrixAt(i, dummy.matrix);

      const color = dimGreen.clone().lerp(
        brightGreen,
        brightness,
      );
      segments.setColorAt(i, color);
    }
    segments.instanceMatrix.needsUpdate = true;
    segments.instanceColor.needsUpdate = true;

    matGreen.emissiveIntensity =
      0.18 + smoothAktiv * (1.65 + puls * 0.45);

    matAmber.emissiveIntensity = zustand === 'ueberlast'
      ? 1.3 + 1.2 * Math.max(0, Math.sin(zeit * 14))
      : 0.18 + smoothAktiv * 1.55;

    matScreen.emissiveIntensity = 0.15 + smoothAktiv * 0.95;
    matWarningScreen.emissiveIntensity =
      0.1 +
      smoothAktiv * 0.62 +
      smoothUeberlast * (1.25 + puls * 0.75);
    matStrip.emissiveIntensity = 0.18 + smoothAktiv * 1.75;

    lampCore.userData.intensity =
      1.1 + smoothAktiv * 10.9 * flackern;
    lampCore.userData.color =
      smoothUeberlast > 0.5 ? '#ff4a16' : '#fff0a6';

    lampSegments.userData.intensity = 0.45 + smoothAktiv * 5.55;
    lampConsole.userData.intensity = 0.35 + smoothAktiv * 3.65;
    lampDisplays.userData.intensity = 0.45 + smoothAktiv * 4.55;
  }

  outerHousing.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // ---------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // ---------------------------------------------------------
  const api = {
    starten() {
      setZustand('aktiv');
    },
    stoppen() {
      setZustand('aus');
    },
    ueberlast() {
      setZustand('ueberlast');
    },
    notabschaltung() {
      setZustand('aus');
    },
    zuruecksetzen() {
      setZustand('aus');
    },
    get zustand() {
      return zustand;
    },
    get aktiv() {
      return zustand !== 'aus';
    },
    get ueberlastAktiv() {
      return zustand === 'ueberlast';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'experiment_starten',
      label: 'Arcturus-Experiment starten',
      run: () => api.starten(),
    },
    {
      id: 'experiment_stoppen',
      label: 'Experiment stoppen',
      run: () => api.stoppen(),
    },
    {
      id: 'ueberlast_ausloesen',
      label: 'Überlast-Event auslösen – WARNUNG',
      run: () => api.ueberlast(),
    },
    {
      id: 'notfallabschaltung',
      label: 'Notfallabschaltung der Kammer',
      run: () => api.notabschaltung(),
    },
    {
      id: 'kammer_zuruecksetzen',
      label: 'Kammer kontrolliert zurücksetzen',
      run: () => api.zuruecksetzen(),
    },
  ];

  if (
    opts &&
    opts.zustand &&
    ['aus', 'aktiv', 'ueberlast'].includes(opts.zustand)
  ) {
    setZustand(opts.zustand);
  }

  return root;
}

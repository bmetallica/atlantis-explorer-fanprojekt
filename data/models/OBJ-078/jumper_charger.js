import * as THREE from 'three';

export const steckbrief = {
  name: 'jumper_charger',
  art: 'Standobjekt',
  masse: '1,51 × 0,98 × 1,30 m (B × T × H; Schlauch ragt nach vorn)',
  wohin: 'ATL-040 (Jumper-Bay), ATL-041 (Hangar)',
  benutzen: 'INT_laden → Menü zum Starten, Abbrechen und Zurücksetzen der Kernladung',
  lichter: 'LAMP_ladeanzeige (eisblau, dauerhaft an)',
  animation: 'Ladeanzeige, Statusringe und Konsolenlichter pulsieren während der Ladung; das HUD zeigt Status und Ladestand',
  quelle: 'selbst gebaut, Spielergänzung',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'jumper_charger';

  const scale = Number.isFinite(opts.scale) ? opts.scale : 1;
  root.scale.setScalar(scale);

  // ------------------------------------------------------------
  // Canvas-Texturen
  // ------------------------------------------------------------
  const plateTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#303631';
    ctx.fillRect(0, 0, 512, 512);

    const shades = [
      '#818c80',
      '#899388',
      '#7b867b',
      '#90998d',
      '#869084',
    ];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * 128 + 4;
        const y = row * 128 + 4;
        ctx.fillStyle = shades[(row * 3 + col * 2) % shades.length];
        ctx.fillRect(x, y, 120, 120);

        ctx.strokeStyle = 'rgba(31,38,33,0.82)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 120, 120);

        ctx.fillStyle = 'rgba(28,34,30,0.72)';
        for (const [bx, by] of [
          [x + 11, y + 11],
          [x + 109, y + 11],
          [x + 11, y + 109],
          [x + 109, y + 109],
        ]) {
          ctx.beginPath();
          ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 4;
    return texture;
  })();

  const warningTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#242824';
    ctx.fillRect(0, 0, 512, 128);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 512, 128);
    ctx.clip();
    ctx.fillStyle = '#d4a12c';
    for (let x = -180; x < 700; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 48, 0);
      ctx.lineTo(x + 176, 128);
      ctx.lineTo(x + 128, 128);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  })();

  const hudCanvas = document.createElement('canvas');
  hudCanvas.width = 512;
  hudCanvas.height = 256;
  const hudContext = hudCanvas.getContext('2d');
  const hudTexture = new THREE.CanvasTexture(hudCanvas);
  hudTexture.colorSpace = THREE.SRGBColorSpace;

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 768;
  labelCanvas.height = 192;
  const labelContext = labelCanvas.getContext('2d');
  labelContext.fillStyle = '#cbd1c8';
  labelContext.fillRect(0, 0, 768, 192);
  labelContext.fillStyle = '#29312c';
  labelContext.font = 'bold 48px monospace';
  labelContext.textAlign = 'center';
  labelContext.fillText('MOBILE CORE CHARGER', 384, 72);
  labelContext.font = '29px monospace';
  labelContext.fillText('ATC-04  /  ENERGY CORE LINK', 384, 126);
  labelContext.fillStyle = '#8e632c';
  labelContext.fillRect(90, 151, 588, 5);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const hullMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_hull',
    color: 0x8a948a,
    map: plateTexture,
    metalness: 0.55,
    roughness: 0.55,
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_dark',
    color: 0x2c312d,
    metalness: 0.62,
    roughness: 0.58,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_frame',
    color: 0x3a403b,
    metalness: 0.7,
    roughness: 0.46,
  });

  const rubberMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_rubber',
    color: 0x151918,
    metalness: 0.05,
    roughness: 0.92,
  });

  const copperMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_copper',
    color: 0x9c7442,
    metalness: 0.82,
    roughness: 0.34,
  });

  const warningMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_warning',
    map: warningTexture,
    metalness: 0.12,
    roughness: 0.68,
  });

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_hud',
    color: 0xffffff,
    map: hudTexture,
    emissive: 0x6fd0ff,
    emissiveMap: hudTexture,
    emissiveIntensity: 0.55,
    metalness: 0.15,
    roughness: 0.28,
  });

  const amberMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_amber',
    color: 0x5a3518,
    emissive: 0xffa040,
    emissiveIntensity: 0.35,
    metalness: 0.25,
    roughness: 0.38,
  });

  const blueRingMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_charge_ring',
    color: 0x12384b,
    emissive: 0x6fd0ff,
    emissiveIntensity: 0.75,
    metalness: 0.45,
    roughness: 0.3,
  });

  const labelMaterial = new THREE.MeshStandardMaterial({
    name: 'jumper_charger_label',
    map: labelTexture,
    metalness: 0.1,
    roughness: 0.72,
  });

  // ------------------------------------------------------------
  // Geometrie-Hilfsfunktionen
  // ------------------------------------------------------------
  function roundedBoxGeometry(width, height, depth, radius = 0.04) {
    const w = width / 2;
    const h = height / 2;
    const r = Math.min(radius, w * 0.9, h * 0.9);
    const shape = new THREE.Shape();

    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      curveSegments: 4,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: Math.min(0.018, r * 0.35),
      bevelThickness: Math.min(0.018, depth * 0.2),
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }

  function addMesh(geometry, material, position, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  }

  function cylinderAlongZ(radius, length, material, position, name, segments = 20) {
    const mesh = addMesh(
      new THREE.CylinderGeometry(radius, radius, length, segments),
      material,
      position,
      name,
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // ------------------------------------------------------------
  // Fahrwerk, Räder und Stoßfänger
  // ------------------------------------------------------------
  const chassis = addMesh(
    roundedBoxGeometry(1.42, 0.15, 0.66, 0.045),
    darkMaterial,
    new THREE.Vector3(0, 0.285, 0),
    'chassis',
  );

  addMesh(
    roundedBoxGeometry(1.18, 0.075, 0.55, 0.025),
    frameMaterial,
    new THREE.Vector3(0, 0.385, 0),
    'unterer_rahmen',
  );

  for (const side of [-1, 1]) {
    for (const z of [-0.255, 0.255]) {
      const wheel = addMesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.105, 24),
        rubberMaterial,
        new THREE.Vector3(side * 0.702, 0.15, z),
        `rad_${side}_${z}`,
      );
      wheel.rotation.z = Math.PI / 2;

      const tread = addMesh(
        new THREE.TorusGeometry(0.115, 0.036, 8, 24),
        rubberMaterial,
        new THREE.Vector3(side * 0.704, 0.15, z),
        `reifenprofil_${side}_${z}`,
      );
      tread.rotation.y = Math.PI / 2;

      const hub = addMesh(
        new THREE.CylinderGeometry(0.059, 0.059, 0.118, 16),
        frameMaterial,
        new THREE.Vector3(side * 0.702, 0.15, z),
        `radnabe_${side}_${z}`,
      );
      hub.rotation.z = Math.PI / 2;

      const cap = addMesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.125, 12),
        copperMaterial,
        new THREE.Vector3(side * 0.702, 0.15, z),
        `nabenkappe_${side}_${z}`,
      );
      cap.rotation.z = Math.PI / 2;

      addMesh(
        new THREE.BoxGeometry(0.15, 0.08, 0.13),
        frameMaterial,
        new THREE.Vector3(side * 0.62, 0.285, z),
        `radhalter_${side}_${z}`,
      );
    }
  }

  for (const z of [-0.375, 0.375]) {
    addMesh(
      roundedBoxGeometry(1.44, 0.09, 0.09, 0.025),
      frameMaterial,
      new THREE.Vector3(0, 0.255, z),
      z > 0 ? 'stossfanger_vorne' : 'stossfanger_hinten',
    );
  }

  addMesh(
    new THREE.BoxGeometry(1.22, 0.105, 0.014),
    warningMaterial,
    new THREE.Vector3(0, 0.255, 0.423),
    'warnstreifen_vorne',
  );

  // ------------------------------------------------------------
  // Hauptgehäuse und Panzerplatten
  // ------------------------------------------------------------
  addMesh(
    roundedBoxGeometry(1.12, 0.51, 0.60, 0.055),
    darkMaterial,
    new THREE.Vector3(0, 0.655, 0),
    'hauptgehaeuse',
  );

  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.035, 0.43, 0.49),
      hullMaterial,
      new THREE.Vector3(side * 0.575, 0.655, -0.005),
      `panzerplatte_${side}`,
    );

    addMesh(
      roundedBoxGeometry(0.07, 0.48, 0.51, 0.02),
      frameMaterial,
      new THREE.Vector3(side * 0.545, 0.655, -0.01),
      `seitenrahmen_${side}`,
    );
  }

  addMesh(
    roundedBoxGeometry(1.02, 0.405, 0.035, 0.025),
    hullMaterial,
    new THREE.Vector3(0, 0.635, 0.313),
    'front_serviceklappe',
  );

  addMesh(
    new THREE.BoxGeometry(0.76, 0.155, 0.014),
    labelMaterial,
    new THREE.Vector3(0, 0.705, 0.338),
    'typenschild',
  );

  // Scharniere und Verriegelung der Serviceklappe.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.035, 0.18, 0.035),
      copperMaterial,
      new THREE.Vector3(side * 0.49, 0.635, 0.335),
      `scharnier_${side}`,
    );
  }

  addMesh(
    new THREE.BoxGeometry(0.06, 0.11, 0.045),
    copperMaterial,
    new THREE.Vector3(0.43, 0.635, 0.348),
    'serviceverriegelung',
  );

  // ------------------------------------------------------------
  // Belüftungsschlitze als InstancedMesh
  // ------------------------------------------------------------
  const ventGeometry = new THREE.BoxGeometry(0.018, 0.025, 0.29);
  const vents = new THREE.InstancedMesh(ventGeometry, darkMaterial, 10);
  vents.name = 'seitliche_ventilschlitze';
  const ventMatrix = new THREE.Matrix4();
  let ventIndex = 0;

  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      ventMatrix.makeTranslation(side * 0.596, 0.53 + i * 0.058, -0.02);
      vents.setMatrixAt(ventIndex++, ventMatrix);
    }
  }
  vents.instanceMatrix.needsUpdate = true;
  root.add(vents);

  // ------------------------------------------------------------
  // Schräg stehende Frontkonsole
  // ------------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'frontkonsole';
  consoleGroup.position.set(0, 0.995, 0.025);
  consoleGroup.rotation.x = -0.32;
  root.add(consoleGroup);

  const consoleHousing = new THREE.Mesh(
    roundedBoxGeometry(0.94, 0.36, 0.22, 0.045),
    frameMaterial,
  );
  consoleHousing.name = 'konsole_gehaeuse';
  consoleHousing.position.set(0, 0, -0.025);
  consoleGroup.add(consoleHousing);

  const displayFrame = new THREE.Mesh(
    roundedBoxGeometry(0.68, 0.235, 0.035, 0.018),
    darkMaterial,
  );
  displayFrame.name = 'display_rahmen';
  displayFrame.position.set(0, 0.01, 0.105);
  consoleGroup.add(displayFrame);

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.60, 0.185),
    screenMaterial,
  );
  display.name = 'ladeanzeige';
  display.position.set(0, 0.01, 0.126);
  consoleGroup.add(display);

  for (const side of [-1, 1]) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 18),
      amberMaterial,
    );
    button.name = `bernstein_taste_${side}`;
    button.position.set(side * 0.365, -0.055, 0.11);
    button.rotation.x = Math.PI / 2;
    consoleGroup.add(button);
  }

  // Bronze-Konsole für den Energiekern.
  addMesh(
    roundedBoxGeometry(0.36, 0.11, 0.30, 0.025),
    copperMaterial,
    new THREE.Vector3(0, 0.435, -0.015),
    'kernanschluss_oberhalb',
  );

  // ------------------------------------------------------------
  // Schiebegriff, Eckprotektoren und obere Leiste
  // ------------------------------------------------------------
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.31, 14),
      frameMaterial,
      new THREE.Vector3(side * 0.47, 1.095, -0.225),
      `buegel_${side}`,
    );

    addMesh(
      roundedBoxGeometry(0.11, 0.42, 0.11, 0.025),
      frameMaterial,
      new THREE.Vector3(side * 0.56, 0.63, 0.29),
      `eckprotektor_${side}`,
    );
  }

  const handle = addMesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.0, 16),
    copperMaterial,
    new THREE.Vector3(0, 1.245, -0.225),
    'schiebegriff',
  );
  handle.rotation.z = Math.PI / 2;

  for (const side of [-1, 1]) {
    addMesh(
      new THREE.SphereGeometry(0.028, 14, 10),
      copperMaterial,
      new THREE.Vector3(side * 0.5, 1.245, -0.225),
      `griffkappe_${side}`,
    );
  }

  // ------------------------------------------------------------
  // Ladeanschluss, Statusring und Ladeadapter
  // ------------------------------------------------------------
  cylinderAlongZ(
    0.087,
    0.075,
    copperMaterial,
    new THREE.Vector3(0.39, 0.48, 0.35),
    'ladeanschluss',
    24,
  );

  const statusRing = addMesh(
    new THREE.TorusGeometry(0.081, 0.013, 10, 28),
    blueRingMaterial,
    new THREE.Vector3(0.39, 0.48, 0.391),
    'statusring',
  );

  addMesh(
    roundedBoxGeometry(0.22, 0.11, 0.24, 0.025),
    darkMaterial,
    new THREE.Vector3(-0.37, 0.995, 0.035),
    'adapterdock',
  );

  const adapter = addMesh(
    new THREE.CylinderGeometry(0.058, 0.071, 0.16, 20),
    copperMaterial,
    new THREE.Vector3(-0.37, 1.08, 0.035),
    'ladeadapter',
  );

  const adapterRing = addMesh(
    new THREE.TorusGeometry(0.064, 0.011, 8, 24),
    blueRingMaterial,
    new THREE.Vector3(-0.37, 1.162, 0.035),
    'adapter_statusring',
  );
  adapterRing.rotation.x = Math.PI / 2;

  // Kleine Frontbolzen als InstancedMesh.
  const boltGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 10);
  const bolts = new THREE.InstancedMesh(boltGeometry, copperMaterial, 8);
  bolts.name = 'frontbolzen';
  const boltMatrix = new THREE.Matrix4();
  const boltQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(Math.PI / 2, 0, 0),
  );
  const boltScale = new THREE.Vector3(1, 1, 1);
  const boltPositions = [
    [-0.46, 0.46], [0.46, 0.46],
    [-0.46, 0.80], [0.46, 0.80],
    [-0.46, 0.50], [0.46, 0.50],
    [-0.46, 0.76], [0.46, 0.76],
  ];
  boltPositions.forEach(([x, y], index) => {
    boltMatrix.compose(
      new THREE.Vector3(x, y, 0.337),
      boltQuaternion,
      boltScale,
    );
    bolts.setMatrixAt(index, boltMatrix);
  });
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  // ------------------------------------------------------------
  // Ladeschlauch: Frontanschluss → Bodenschleife → oberer Adapter
  // ------------------------------------------------------------
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.39, 0.48, 0.405),
    new THREE.Vector3(0.43, 0.38, 0.47),
    new THREE.Vector3(0.39, 0.19, 0.51),
    new THREE.Vector3(0.18, 0.10, 0.54),
    new THREE.Vector3(-0.08, 0.10, 0.52),
    new THREE.Vector3(-0.31, 0.20, 0.43),
    new THREE.Vector3(-0.42, 0.46, 0.31),
    new THREE.Vector3(-0.41, 0.78, 0.17),
    new THREE.Vector3(-0.37, 0.99, 0.06),
  ]);

  addMesh(
    new THREE.TubeGeometry(hoseCurve, 72, 0.027, 10, false),
    rubberMaterial,
    new THREE.Vector3(0, 0, 0),
    'ladeschlauch',
  );

  cylinderAlongZ(
    0.045,
    0.085,
    darkMaterial,
    new THREE.Vector3(0.39, 0.48, 0.425),
    'schlauchkupplung',
    18,
  );

  // Rippen am oberen Schlauchende.
  for (let i = 0; i < 3; i++) {
    const rib = addMesh(
      new THREE.TorusGeometry(0.034, 0.006, 6, 16),
      frameMaterial,
      new THREE.Vector3(-0.38, 0.93 + i * 0.045, 0.095),
      `schlauchrippe_${i}`,
    );
    rib.rotation.x = 0.15;
  }

  // ------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(1.50, 1.12, 0.72),
    new THREE.MeshBasicMaterial(),
  );
  collision.name = 'COL_gehaeuse';
  collision.position.set(0, 0.66, 0);
  collision.userData.aktiv = true;
  root.add(collision);

  // ------------------------------------------------------------
  // Benutzen-Punkt und dauerhaftes Licht
  // ------------------------------------------------------------
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_laden';
  usePoint.position.set(0, 1.02, 0.70);
  usePoint.userData = {
    label: 'Energiekern-Lader bedienen',
    radius: 0.85,
  };
  root.add(usePoint);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_ladeanzeige';
  lamp.position.set(0, 1.08, 0.48);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 6,
    distance: 4,
  };
  root.add(lamp);

  // ------------------------------------------------------------
  // HUD, Ladezustand und Animation
  // ------------------------------------------------------------
  let charging = false;
  let completed = false;
  let chargeLevel = 0;
  let clock = 0;
  let hudTimer = 0;
  let lastTime = null;

  function drawHud() {
    const ctx = hudContext;
    ctx.fillStyle = '#06131b';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#6fd0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = '#6fd0ff';
    ctx.font = 'bold 27px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CORE LINK / ATC-04', 28, 47);

    ctx.font = 'bold 47px monospace';
    const status = charging ? 'CHARGING' : completed ? 'COMPLETE' : 'STANDBY';
    ctx.fillText(status, 28, 115);

    const barX = 28;
    const barY = 147;
    const barW = 456;
    const barH = 39;
    ctx.strokeStyle = '#6fd0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = completed ? '#91ffcb' : '#6fd0ff';
    ctx.fillRect(
      barX + 4,
      barY + 4,
      Math.max(0, (barW - 8) * chargeLevel),
      barH - 8,
    );

    ctx.strokeStyle = 'rgba(111,208,255,0.42)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(barX + (barW / 10) * i, barY);
      ctx.lineTo(barX + (barW / 10) * i, barY + barH);
      ctx.stroke();
    }

    ctx.fillStyle = '#6fd0ff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(chargeLevel * 100)}%`, 484, 224);
    hudTexture.needsUpdate = true;
  }

  drawHud();

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    clock += step;

    if (charging) {
      chargeLevel = Math.min(1, chargeLevel + step / 24);
      if (chargeLevel >= 1) {
        charging = false;
        completed = true;
      }
    }

    const pulse = 0.5 + 0.5 * Math.sin(clock * 4.2);

    if (charging) {
      screenMaterial.emissiveIntensity = 1.0 + pulse * 0.9;
      amberMaterial.emissiveIntensity = 1.0 + pulse * 1.15;
      blueRingMaterial.emissiveIntensity = 1.1 + pulse * 1.25;
      lamp.userData.intensity = 7 + pulse * 3;
    } else if (completed) {
      screenMaterial.emissiveIntensity = 0.95;
      amberMaterial.emissiveIntensity = 0.48;
      blueRingMaterial.emissiveIntensity = 1.05;
      lamp.userData.intensity = 6;
    } else {
      screenMaterial.emissiveIntensity = 0.46 + pulse * 0.12;
      amberMaterial.emissiveIntensity = 0.3;
      blueRingMaterial.emissiveIntensity = 0.62 + pulse * 0.18;
      lamp.userData.intensity = 5;
    }

    hudTimer += step;
    if (hudTimer >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      hudTimer = 0;
      drawHud();
    }
  }

  chassis.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(now - lastTime);
    }
    lastTime = now;
  };

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    startCharging() {
      if (completed || chargeLevel >= 1) {
        completed = false;
        chargeLevel = 0;
      }
      charging = true;
    },
    stopCharging() {
      charging = false;
    },
    toggleCharging() {
      if (charging) {
        api.stopCharging();
      } else {
        api.startCharging();
      }
    },
    reset() {
      charging = false;
      completed = false;
      chargeLevel = 0;
      drawHud();
    },
    setChargeLevel(value) {
      chargeLevel = Math.min(1, Math.max(0, Number(value) || 0));
      completed = chargeLevel >= 1;
      charging = false;
      drawHud();
    },
    update,
    get isCharging() {
      return charging;
    },
    get chargeLevel() {
      return chargeLevel;
    },
    get completed() {
      return completed;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'laden_start',
      label: 'Ladevorgang starten',
      run: () => api.startCharging(),
    },
    {
      id: 'laden_stop',
      label: 'Ladevorgang abbrechen',
      run: () => api.stopCharging(),
    },
    {
      id: 'laden_reset',
      label: 'Ladeanzeige zurücksetzen',
      run: () => api.reset(),
    },
  ];

  return root;
}

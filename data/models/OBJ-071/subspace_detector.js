// OBJ-071: Subraum-Partikeldetektor
// Kompaktes, robustes Handmessgerät für Subraum- und exotische Strahlung.
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'subspace_detector',
  art: 'Standobjekt / tragbares Labor-Messgerät',
  masse: '0,20 × 0,34 × 0,11 m (Gesamt; Gehäuse 0,155 × 0,23 m)',
  wohin: 'Wissenschaftslabor (ATL-014), Aufstiegs-Labor (ATL-021)',
  benutzen: 'INT_scanner → Anomaliescan starten/beenden oder Messfilter wechseln',
  lichter: 'LAMP_display (eisblau), LAMP_antenne (bernsteinfarben)',
  animation: 'Display, Messbalken, Statusanzeige und Antennenkopf reagieren weich auf den Scanstatus',
  quelle: 'Spielergänzung, selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'subspace_detector';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  // Irdisches, mattes Laborgerät mit sparsamen Atlantis-Akzenten.
  const matGehaeuse = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_case',
    color: 0x555b5d,
    metalness: 0.28,
    roughness: 0.68,
  });
  const matFront = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_front',
    color: 0x737a7c,
    metalness: 0.34,
    roughness: 0.58,
  });
  const matGummi = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_rubber',
    color: 0x171b1d,
    metalness: 0.03,
    roughness: 0.9,
  });
  const matSchwarz = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_blackTrim',
    color: 0x252a2c,
    metalness: 0.32,
    roughness: 0.72,
  });
  const matWarnung = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_warning',
    color: 0xf2c438,
    metalness: 0.18,
    roughness: 0.5,
  });
  const matBronze = kit('copper');
  const matEisblau = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_iceGlow',
    color: 0x8beaff,
    emissive: 0x4ddaff,
    emissiveIntensity: 1.6,
    metalness: 0.1,
    roughness: 0.25,
  });
  const matBernstein = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_amberGlow',
    color: 0xffc05a,
    emissive: 0xff9b28,
    emissiveIntensity: 1.2,
    metalness: 0.12,
    roughness: 0.3,
  });

  function roundedRectShape(width, height, radius) {
    const w = width / 2;
    const h = height / 2;
    const r = Math.min(radius, w, h);
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
    shape.closePath();
    return shape;
  }

  function zylinderZwischen(a, b, radius, material, name) {
    const av = new THREE.Vector3(...a);
    const bv = new THREE.Vector3(...b);
    const direction = bv.clone().sub(av);
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      direction.length(),
      10,
      1
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(av).add(bv).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    mesh.castShadow = true;
    return mesh;
  }

  // ---------- Anzeige ----------
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(canvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = 4;

  const matDisplay = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_display',
    color: 0xffffff,
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.58,
    metalness: 0.04,
    roughness: 0.28,
  });

  // ---------- Gehäuse ----------
  const bodyDepth = 0.068;
  const bodyHeight = 0.23;
  const bodyCenterY = 0.139;
  const bodyGeometry = new THREE.ExtrudeGeometry(
    roundedRectShape(0.155, bodyHeight, 0.018),
    {
      depth: bodyDepth,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 8,
      steps: 1,
    }
  );
  bodyGeometry.translate(0, 0, -bodyDepth / 2);

  const body = new THREE.Mesh(bodyGeometry, matGehaeuse);
  body.name = 'DETECTOR_body';
  body.position.y = bodyCenterY;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const frontGeometry = new THREE.ExtrudeGeometry(
    roundedRectShape(0.141, 0.213, 0.013),
    {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 1,
      curveSegments: 7,
      steps: 1,
    }
  );
  frontGeometry.translate(0, 0, -0.003);
  const front = new THREE.Mesh(frontGeometry, matFront);
  front.name = 'DETECTOR_frontPanel';
  front.position.set(0, bodyCenterY, 0.034);
  front.castShadow = true;
  root.add(front);

  // Seitliche Stoßschutzleisten.
  for (const side of [-1, 1]) {
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.181, 0.074),
      matGummi
    );
    bumper.name = 'DETECTOR_sideBumper';
    bumper.position.set(side * 0.0805, 0.137, 0);
    bumper.castShadow = true;
    root.add(bumper);
  }

  // Standfüße: Der tiefste sichtbare Punkt liegt bei y = 0.
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.024, 0.078),
      matGummi
    );
    foot.name = 'DETECTOR_foot';
    foot.position.set(side * 0.051, 0.012, 0);
    foot.castShadow = true;
    root.add(foot);
  }

  // Schmale Bodenplatte verbindet die Füße mit dem Gehäuse.
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.142, 0.014, 0.075),
    matSchwarz
  );
  basePlate.name = 'DETECTOR_base';
  basePlate.position.set(0, 0.031, 0);
  basePlate.castShadow = true;
  root.add(basePlate);

  // ---------- Display und Anzeigen ----------
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.127, 0.067, 0.009),
    matSchwarz
  );
  bezel.name = 'DETECTOR_bezel';
  bezel.position.set(0, 0.178, 0.040);
  root.add(bezel);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.112, 0.055),
    matDisplay
  );
  screen.name = 'DETECTOR_screen';
  screen.position.set(0, 0.178, 0.0452);
  root.add(screen);

  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0045, 10, 8),
    matBernstein
  );
  statusLed.name = 'DETECTOR_statusLED';
  statusLed.position.set(0.058, 0.206, 0.042);
  root.add(statusLed);

  // ---------- Tasten ----------
  const buttonGeometry = new THREE.CylinderGeometry(0.0105, 0.0115, 0.009, 14);
  const buttonMaterial = new THREE.MeshStandardMaterial({
    name: 'DETECTOR_button',
    color: 0x34393b,
    emissive: 0x3f6870,
    emissiveIntensity: 0.08,
    metalness: 0.35,
    roughness: 0.55,
  });
  const buttons = new THREE.InstancedMesh(buttonGeometry, buttonMaterial, 5);
  buttons.name = 'DETECTOR_buttons';
  buttons.castShadow = true;

  const dummy = new THREE.Object3D();
  const buttonPositions = [-0.052, -0.026, 0, 0.026, 0.052];
  for (let i = 0; i < buttonPositions.length; i++) {
    dummy.position.set(buttonPositions[i], 0.083, 0.042);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    buttons.setMatrixAt(i, dummy.matrix);
  }
  buttons.instanceMatrix.needsUpdate = true;
  root.add(buttons);

  // Kleine gelbe Starttaste, deutlich vom übrigen Tastenfeld abgesetzt.
  const scanButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0115, 0.0115, 0.009, 16),
    matWarnung
  );
  scanButton.name = 'DETECTOR_scanButton';
  scanButton.position.set(0, 0.083, 0.043);
  scanButton.rotation.x = Math.PI / 2;
  scanButton.castShadow = true;
  root.add(scanButton);

  // Gelbes Warnband mit schrägen Markierungen.
  const warningBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.128, 0.018, 0.003),
    matSchwarz
  );
  warningBase.name = 'DETECTOR_warningBase';
  warningBase.position.set(0, 0.048, 0.041);
  root.add(warningBase);

  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.021, 0.002),
      matWarnung
    );
    stripe.name = 'DETECTOR_warningStripe';
    stripe.position.set(-0.05 + i * 0.02, 0.048, 0.043);
    stripe.rotation.z = 0.48;
    root.add(stripe);
  }

  // ---------- Physische Messbalken ----------
  const meterCount = 10;
  const meterGeometry = new THREE.BoxGeometry(0.006, 1, 0.002);
  const meterMaterial = new THREE.MeshBasicMaterial({
    name: 'DETECTOR_meterBars',
    color: 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
  });
  const meterBars = new THREE.InstancedMesh(
    meterGeometry,
    meterMaterial,
    meterCount
  );
  meterBars.name = 'DETECTOR_meter';
  meterBars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meterBars.frustumCulled = false;

  for (let i = 0; i < meterCount; i++) {
    const color = new THREE.Color(i < 7 ? 0x63dff4 : 0xffb83e);
    meterBars.setColorAt(i, color);
  }
  if (meterBars.instanceColor) meterBars.instanceColor.needsUpdate = true;
  root.add(meterBars);

  // ---------- Antennenkopf ----------
  const antennaStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.012, 0.027, 12),
    matBronze
  );
  antennaStem.name = 'DETECTOR_antennaStem';
  antennaStem.position.set(0, 0.266, -0.006);
  antennaStem.castShadow = true;
  root.add(antennaStem);

  const antennaHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.033, 0.038, 0.039, 16),
    matGehaeuse
  );
  antennaHead.name = 'DETECTOR_antennaHead';
  antennaHead.position.set(0, 0.296, -0.006);
  antennaHead.castShadow = true;
  root.add(antennaHead);

  const antennaCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.031, 0.033, 0.007, 16),
    matBronze
  );
  antennaCap.name = 'DETECTOR_antennaCap';
  antennaCap.position.set(0, 0.318, -0.006);
  root.add(antennaCap);

  const antennaRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.0028, 8, 28),
    matEisblau
  );
  antennaRing.name = 'DETECTOR_antennaRing';
  antennaRing.position.set(0, 0.309, -0.006);
  antennaRing.rotation.x = Math.PI / 2;
  root.add(antennaRing);

  // Kurze flexible Antenne, mit dem Kopf verbunden.
  const whip = zylinderZwischen(
    [0.024, 0.307, -0.006],
    [0.044, 0.337, -0.006],
    0.0025,
    matSchwarz,
    'DETECTOR_whip'
  );
  root.add(whip);

  const whipTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.0045, 10, 8),
    matEisblau
  );
  whipTip.name = 'DETECTOR_whipTip';
  whipTip.position.set(0.044, 0.337, -0.006);
  root.add(whipTip);

  // ---------- Tragegriff ----------
  for (const y of [0.082, 0.201]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.014, 0.019),
      matSchwarz
    );
    bracket.name = 'DETECTOR_handleBracket';
    bracket.position.set(0.089, y, -0.009);
    bracket.castShadow = true;
    root.add(bracket);
  }

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.119, 10),
    matGummi
  );
  handle.name = 'DETECTOR_carryHandle';
  handle.position.set(0.098, 0.142, -0.009);
  handle.castShadow = true;
  root.add(handle);

  // ---------- Seitliche Lüftungsschlitze ----------
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.052, 0.009),
      matSchwarz
    );
    vent.name = 'DETECTOR_vent';
    vent.position.set(-0.0855, 0.139, -0.021 + i * 0.014);
    root.add(vent);
  }

  // ---------- Rückseitiger Sensoranschluss ----------
  const rearSocket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.026, 12),
    matSchwarz
  );
  rearSocket.name = 'DETECTOR_rearSocket';
  rearSocket.position.set(0, 0.233, -0.044);
  rearSocket.rotation.x = Math.PI / 2;
  root.add(rearSocket);

  const rearCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12),
    matBronze
  );
  rearCap.name = 'DETECTOR_rearCap';
  rearCap.position.set(0, 0.233, -0.060);
  rearCap.rotation.x = Math.PI / 2;
  root.add(rearCap);

  // ---------- Kollision ----------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.34, 0.11)
  );
  col.name = 'COL_detector';
  col.position.set(0.006, 0.17, -0.008);
  root.add(col);

  // ---------- Benutzen-Punkt ----------
  const use = new THREE.Object3D();
  use.name = 'INT_scanner';
  use.position.set(0, 0.15, 0.18);
  use.userData = {
    label: 'Subraum-Partikeldetektor bedienen',
    radius: 0.8,
  };
  root.add(use);

  // ---------- Lichter ----------
  const lampDisplay = new THREE.Object3D();
  lampDisplay.name = 'LAMP_display';
  lampDisplay.position.set(0, 0.18, 0.105);
  lampDisplay.userData = {
    color: '#6fe3ff',
    intensity: 3.2,
    distance: 1.6,
  };
  root.add(lampDisplay);

  const lampAntenna = new THREE.Object3D();
  lampAntenna.name = 'LAMP_antenne';
  lampAntenna.position.set(0, 0.309, 0.035);
  lampAntenna.userData = {
    color: '#ffb03a',
    intensity: 1.8,
    distance: 1.1,
  };
  root.add(lampAntenna);

  // ---------- Zustand und Anzeige ----------
  const modes = ['SUBSPACE', 'EXOTIC', 'PARTICLE'];
  let modeIndex = 0;
  let scanActive = false;
  let signalStrength = 0.45;
  let signal = 0.025;
  let elapsed = 0;
  let previousTime = null;
  let textureTimer = 0;

  function drawDisplay() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#06171d';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(70, 185, 210, 0.17)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#a0efff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PARTICLE DETECTOR', 13, 28);

    ctx.fillStyle = scanActive ? '#ffd36e' : '#648f99';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(modes[modeIndex], 13, 55);

    ctx.textAlign = 'right';
    ctx.fillText(scanActive ? 'SCAN ACTIVE' : 'STANDBY', w - 13, 55);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#e7bd3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.77, 66);
    ctx.lineTo(w * 0.77, h - 12);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(111, 227, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const y =
        137 +
        Math.sin(x * 0.027 + elapsed * 1.7) * 8 +
        Math.sin(x * 0.071) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#86aeb7';
    ctx.font = '15px monospace';
    ctx.fillText('SUBSPACE / EXOTIC FIELD', 13, 243);
    ctx.textAlign = 'right';
    ctx.fillText(`SIG ${Math.round(signal * 100)}%`, w - 13, 243);
    ctx.textAlign = 'left';

    screenTexture.needsUpdate = true;
  }

  function updateMeter() {
    for (let i = 0; i < meterCount; i++) {
      const phase = elapsed * (3.2 + modeIndex * 0.6) - i * 0.48;
      const wave = 0.5 + 0.5 * Math.sin(phase);
      const detail = 0.5 + 0.5 * Math.sin(phase * 1.83 + i * 0.31);
      let height = 0.0015;

      if (scanActive) {
        height = 0.004 + signal * (0.012 + wave * 0.013 + detail * 0.006);
      }

      dummy.position.set(
        -0.0495 + i * 0.011,
        0.112 + height / 2,
        0.043
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      meterBars.setMatrixAt(i, dummy.matrix);
    }
    meterBars.instanceMatrix.needsUpdate = true;
  }

  function update(dt) {
    elapsed += dt;

    const modeFactor = [1.0, 1.3, 0.8][modeIndex];
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.8);
    const targetSignal = scanActive
      ? Math.min(
          1,
          0.12 + signalStrength * 0.48 * modeFactor + pulse * 0.18
        )
      : 0.025;

    signal += (targetSignal - signal) * Math.min(1, dt * 4.5);

    matDisplay.emissiveIntensity = scanActive
      ? 0.64 + 0.14 * Math.sin(elapsed * 3.2)
      : 0.2;

    matBernstein.emissiveIntensity = scanActive
      ? 1.1 + 1.1 * (0.5 + 0.5 * Math.sin(elapsed * 4.4))
      : 0.48;

    matEisblau.emissiveIntensity = scanActive ? 2.5 : 0.9;
    buttonMaterial.emissiveIntensity = scanActive ? 0.35 : 0.08;
    statusLed.scale.setScalar(
      scanActive ? 1 + 0.16 * Math.sin(elapsed * 5.5) : 0.82
    );

    updateMeter();

    textureTimer += dt;
    if (textureTimer >= 0.2) {
      textureTimer = 0;
      drawDisplay();
    }
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (previousTime !== null) {
      update(Math.min(Math.max(now - previousTime, 0), 0.1));
    }
    previousTime = now;
  };

  drawDisplay();
  updateMeter();

  // ---------- Öffentliche API und Aktionen ----------
  const api = {
    startScan() {
      scanActive = true;
      drawDisplay();
    },
    stopScan() {
      scanActive = false;
      drawDisplay();
    },
    toggleScan() {
      scanActive = !scanActive;
      drawDisplay();
    },
    nextMode() {
      modeIndex = (modeIndex + 1) % modes.length;
      drawDisplay();
    },
    setMode(index) {
      if (Number.isInteger(index) && index >= 0 && index < modes.length) {
        modeIndex = index;
        drawDisplay();
      }
    },
    setSignalStrength(value) {
      const number = Number(value);
      if (Number.isFinite(number)) {
        signalStrength = THREE.MathUtils.clamp(number, 0, 1);
      }
    },
    update(dt) {
      const step = Number(dt);
      if (Number.isFinite(step) && step > 0) {
        update(Math.min(step, 0.1));
      }
    },
    get scanActive() {
      return scanActive;
    },
    get signalLevel() {
      return signal;
    },
    get mode() {
      return modes[modeIndex];
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'scan_start',
      label: 'Anomaliescan starten',
      run: () => api.startScan(),
    },
    {
      id: 'scan_stop',
      label: 'Anomaliescan beenden',
      run: () => api.stopScan(),
    },
    {
      id: 'mode_next',
      label: 'Messfilter wechseln',
      run: () => api.nextMode(),
    },
  ];

  return root;
}

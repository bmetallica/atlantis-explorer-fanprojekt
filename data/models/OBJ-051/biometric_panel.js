// biometric_panel.js
// Antiker biometrischer Wandleser / Lantean Biometric Sensor Panel
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'biometric_panel',
  art: 'Wandobjekt',
  masse: '0,15 × 0,50 × 0,09 (B × H × T, m)',
  wohin: 'ATL-001, ATL-002, ATL-004, ATL-009, ATL-030',
  benutzen: 'INT_bedienen → Menü mit Gen-Scan und Zurücksetzen',
  lichter: 'LAMP_kristall (eisblau, dauerhaft an)',
  animation: 'Kristall pulsiert; beim Gen-Scan läuft ein Lichtimpuls durch die DNA-Signatur, Erfolg eisblau, Fehler bernsteinfarben',
  quelle: 'selbst gebaut, Spielergänzung im Stil der Ancient-Wandkristalle',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'biometric_panel';

  // ------------------------------------------------------------
  // Zustand
  // ------------------------------------------------------------
  let ataGen = !!opts.ataGen;
  let scanning = false;
  let authorized = false;
  let scanResult = null;
  let scanProgress = 0;
  let zeit = 0;
  let letzte = null;

  const blau = new THREE.Color(0x38bfff);
  const hellblau = new THREE.Color(0x8cecff);
  const bernstein = new THREE.Color(0xffa938);

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const housingMaterial = kit('wallDark');

  const recessMaterial = new THREE.MeshStandardMaterial({
    name: 'biometric_recess',
    color: 0x0b1118,
    metalness: 0.72,
    roughness: 0.46,
  });

  const crystalMaterial = new THREE.MeshStandardMaterial({
    name: 'biometric_crystal',
    color: 0x06243c,
    emissive: 0x168cff,
    emissiveIntensity: 0.08,
    metalness: 0.12,
    roughness: 0.16,
    transparent: true,
    opacity: 0.9,
  });

  const dnaMaterial = new THREE.MeshStandardMaterial({
    name: 'biometric_dna',
    color: 0x123f58,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.18,
    metalness: 0.18,
    roughness: 0.25,
  });

  const statusMaterial = new THREE.MeshStandardMaterial({
    name: 'biometric_status',
    color: 0x24190b,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.16,
    metalness: 0.3,
    roughness: 0.3,
  });

  const beamMaterial = new THREE.MeshStandardMaterial({
    name: 'biometric_scan_beam',
    color: 0x8cecff,
    emissive: 0x8cecff,
    emissiveIntensity: 0.04,
    metalness: 0,
    roughness: 0.3,
  });

  const frameMaterial = kit('rail');
  const accentMaterial = kit('copper');

  // ------------------------------------------------------------
  // Geometrie-Helfer
  // Gehäuseform: geschlossener, achteckig gefaster Körper.
  // Formen werden in X/Y gebaut und entlang +Z extrudiert.
  // ------------------------------------------------------------
  function chamferedShape(width, height, chamfer) {
    const w = width / 2;
    const h = height / 2;
    const c = chamfer;

    const shape = new THREE.Shape();
    shape.moveTo(-w + c, -h);
    shape.lineTo(w - c, -h);
    shape.lineTo(w, -h + c);
    shape.lineTo(w, h - c);
    shape.lineTo(w - c, h);
    shape.lineTo(-w + c, h);
    shape.lineTo(-w, h - c);
    shape.lineTo(-w, -h + c);
    shape.closePath();
    return shape;
  }

  function chamferedHole(width, height, chamfer) {
    const w = width / 2;
    const h = height / 2;
    const c = chamfer;
    const path = new THREE.Path();

    // Gegen Uhrzeigersinn, damit es als echtes Loch fungiert.
    path.moveTo(-w + c, -h);
    path.lineTo(-w, -h + c);
    path.lineTo(-w, h - c);
    path.lineTo(-w + c, h);
    path.lineTo(w - c, h);
    path.lineTo(w, h - c);
    path.lineTo(w, -h + c);
    path.lineTo(w - c, -h);
    path.closePath();
    return path;
  }

  function extrudeClosed(shape, depth, bevelSize = 0.003) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      curveSegments: 1,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize,
      bevelThickness: bevelSize,
    });

    // Die Rückseite wird unabhängig von den Extrusionsbevels exakt auf z = 0 gelegt.
    geometry.computeBoundingBox();
    geometry.translate(0, 0, -geometry.boundingBox.min.z);
    geometry.computeVertexNormals();
    return geometry;
  }

  // ------------------------------------------------------------
  // Gehäuse
  // Ursprung: Mitte der Unterkante der Rückseite.
  // Rückseite bei z = 0, Vorderseite zeigt nach +Z.
  // ------------------------------------------------------------
  const housing = new THREE.Mesh(
    extrudeClosed(chamferedShape(0.15, 0.5, 0.017), 0.064, 0.004),
    housingMaterial
  );
  housing.name = 'gehaeuse';
  housing.position.set(0, 0.25, 0);
  root.add(housing);

  // Dunkle, geschlossene Aufnahme hinter dem Kristall.
  const recess = new THREE.Mesh(
    extrudeClosed(chamferedShape(0.122, 0.445, 0.012), 0.005, 0.0015),
    recessMaterial
  );
  recess.name = 'kristallaufnahme';
  recess.position.set(0, 0.25, 0.071);
  root.add(recess);

  // Geschlossener Metallrahmen mit echter Aussparung.
  const bezelShape = chamferedShape(0.134, 0.458, 0.014);
  bezelShape.holes.push(chamferedHole(0.07, 0.365, 0.007));

  const bezel = new THREE.Mesh(
    extrudeClosed(bezelShape, 0.008, 0.002),
    frameMaterial
  );
  bezel.name = 'metallfassung';
  bezel.position.set(0, 0.25, 0.073);
  root.add(bezel);

  // ------------------------------------------------------------
  // Kristallstreifen
  // ------------------------------------------------------------
  const crystal = new THREE.Mesh(
    extrudeClosed(chamferedShape(0.058, 0.34, 0.009), 0.008, 0.0025),
    crystalMaterial
  );
  crystal.name = 'kristall';
  crystal.position.set(0, 0.25, 0.077);
  root.add(crystal);

  // Feine doppelhelixartige Signatur im Kristall.
  const dnaLines = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.027, 0.0024, 0.002),
    dnaMaterial,
    11
  );
  dnaLines.name = 'dna_signatur';
  dnaLines.position.z = 0.091;

  const instanceMatrix = new THREE.Matrix4();
  const instancePosition = new THREE.Vector3();
  const instanceScale = new THREE.Vector3(1, 1, 1);
  const instanceQuaternion = new THREE.Quaternion();
  const rotationAxis = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const angle = (i % 2 === 0 ? 1 : -1) * (0.48 + 0.12 * Math.sin(t * Math.PI));
    instancePosition.set(
      Math.sin(t * Math.PI * 2) * 0.003,
      0.105 + i * 0.028,
      0
    );
    instanceQuaternion.setFromAxisAngle(rotationAxis, angle);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    dnaLines.setMatrixAt(i, instanceMatrix);
  }
  dnaLines.instanceMatrix.needsUpdate = true;
  root.add(dnaLines);

  // Seitliche Ancient-Markierungen als InstancedMesh.
  const sideMarkers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.009, 0.003, 0.0025),
    accentMaterial,
    10
  );
  sideMarkers.name = 'seitenmarkierungen';
  sideMarkers.position.z = 0.084;

  for (let i = 0; i < 5; i++) {
    const y = 0.115 + i * 0.043;

    instancePosition.set(-0.051, y, 0);
    instanceQuaternion.identity();
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    sideMarkers.setMatrixAt(i * 2, instanceMatrix);

    instancePosition.set(0.051, y, 0);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    sideMarkers.setMatrixAt(i * 2 + 1, instanceMatrix);
  }
  sideMarkers.instanceMatrix.needsUpdate = true;
  root.add(sideMarkers);

  // ------------------------------------------------------------
  // Statusanzeige und Berührsensor
  // ------------------------------------------------------------
  const statusSocket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.005, 20),
    accentMaterial
  );
  statusSocket.rotation.x = Math.PI / 2;
  statusSocket.position.set(0, 0.45, 0.083);
  root.add(statusSocket);

  const statusLight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, 0.0035, 20),
    statusMaterial
  );
  statusLight.rotation.x = Math.PI / 2;
  statusLight.position.set(0, 0.45, 0.087);
  statusLight.name = 'statusanzeige';
  root.add(statusLight);

  const touchRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.012, 0.003, 8, 24),
    accentMaterial
  );
  touchRing.position.set(0, 0.045, 0.084);
  root.add(touchRing);

  const touchPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.004, 20),
    crystalMaterial
  );
  touchPad.rotation.x = Math.PI / 2;
  touchPad.position.set(0, 0.045, 0.084);
  touchPad.name = 'beruehrsensor';
  root.add(touchPad);

  // Lichtimpuls, der während des Scans durch den Kristall läuft.
  const scanBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.006, 0.0025),
    beamMaterial
  );
  scanBeam.name = 'scan_impuls';
  scanBeam.position.set(0, 0.105, 0.096);
  root.add(scanBeam);

  // ------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.5, 0.09)
  );
  collision.name = 'COL_biometric_panel';
  collision.position.set(0, 0.25, 0.045);
  collision.userData.aktiv = true;
  root.add(collision);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Licht
  // ------------------------------------------------------------
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_bedienen';
  usePoint.position.set(0, 0.285, 0.19);
  usePoint.userData = {
    label: 'Biometrischen Wandleser bedienen',
    radius: 0.8,
  };
  root.add(usePoint);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_kristall';
  lamp.position.set(0, 0.25, 0.16);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 3,
    distance: 2.4,
  };
  root.add(lamp);

  // ------------------------------------------------------------
  // Animation
  // ------------------------------------------------------------
  function update(dt) {
    zeit += dt;

    if (scanning) {
      scanProgress = Math.min(1, scanProgress + dt * 1.6);
      if (scanProgress >= 1) {
        scanning = false;
        authorized = scanResult === true;
      }
    }

    let targetCrystal = 0.08;
    let targetDna = 0.12;
    let targetStatus = 0.12;
    let targetBeam = 0.025;
    let targetColor = blau;

    if (scanning) {
      const pulse = 0.5 + 0.5 * Math.sin(zeit * 17);
      targetCrystal = 0.5 + pulse * 0.85;
      targetDna = 0.75 + pulse * 1.15;
      targetStatus = 0.55 + pulse * 0.8;
      targetBeam = 1.8 + pulse * 1.2;
      targetColor = hellblau;
    } else if (authorized) {
      targetCrystal = 0.38 + Math.sin(zeit * 2.8) * 0.06;
      targetDna = 0.78 + Math.sin(zeit * 3.4) * 0.12;
      targetStatus = 1.05;
      targetBeam = 0.08;
      targetColor = blau;
    } else if (scanResult === false) {
      targetCrystal = 0.18 + Math.sin(zeit * 2.2) * 0.025;
      targetDna = 0.35;
      targetStatus = 0.72;
      targetBeam = 0.03;
      targetColor = bernstein;
    } else {
      targetCrystal = 0.08 + Math.sin(zeit * 1.45) * 0.018;
      targetDna = 0.12 + Math.sin(zeit * 1.8) * 0.025;
      targetStatus = 0.12;
      targetBeam = 0.025;
      targetColor = blau;
    }

    const ease = Math.min(1, dt * 7);

    crystalMaterial.emissiveIntensity +=
      (targetCrystal - crystalMaterial.emissiveIntensity) * ease;
    dnaMaterial.emissiveIntensity +=
      (targetDna - dnaMaterial.emissiveIntensity) * ease;
    statusMaterial.emissiveIntensity +=
      (targetStatus - statusMaterial.emissiveIntensity) * ease;
    beamMaterial.emissiveIntensity +=
      (targetBeam - beamMaterial.emissiveIntensity) * ease;

    crystalMaterial.emissive.lerp(targetColor, ease);
    dnaMaterial.emissive.lerp(targetColor, ease);
    statusMaterial.emissive.lerp(targetColor, ease);

    if (scanning) {
      scanBeam.position.y = 0.105 + scanProgress * 0.29;
      statusLight.scale.setScalar(1 + Math.sin(zeit * 17) * 0.12);
    } else {
      const statusPulse = authorized
        ? 1 + Math.sin(zeit * 3.4) * 0.05
        : 1;
      statusLight.scale.setScalar(statusPulse);
    }
  }

  housing.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  function scan(explicitGenStatus) {
    const genStatus =
      typeof explicitGenStatus === 'boolean' ? explicitGenStatus : ataGen;

    scanResult = genStatus;
    authorized = false;
    scanning = true;
    scanProgress = 0;
    return genStatus;
  }

  function reset() {
    scanning = false;
    authorized = false;
    scanResult = null;
    scanProgress = 0;
  }

  function setATAgen(value) {
    ataGen = !!value;
    return ataGen;
  }

  const api = {
    scan,
    reset,
    setATAgen,
    get ataGen() {
      return ataGen;
    },
    get authorized() {
      return authorized;
    },
    get scanning() {
      return scanning;
    },
    get scanProgress() {
      return scanProgress;
    },
    get status() {
      if (scanning) return 'scan';
      if (authorized) return 'authorized';
      if (scanResult === false) return 'unauthorized';
      return 'idle';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'gen-scan',
      label: 'Gen-Scan durchführen (ATA-Gen erforderlich)',
      run: () => api.scan(api.ataGen),
    },
    {
      id: 'reset',
      label: 'Gen-Prüfung zurücksetzen',
      run: () => api.reset(),
    },
  ];

  return root;
}

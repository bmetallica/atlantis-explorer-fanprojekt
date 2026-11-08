import * as THREE from 'three';

export const steckbrief = {
  name: 'surgical_table',
  art: 'Standobjekt',
  masse: 'ca. 145 kg',
  wohin: 'ATL-010 – Operationsraum',
  benutzen: 'INT_behandeln → Operation starten/beenden, Tischhöhe verstellen',
  lichter: 'LAMP_op_links und LAMP_op_rechts (eisblau, dauerhaft an)',
  animation: 'Tischhöhe fährt weich zwischen 0,70 und 1,10 m; bei aktiver Operation pulsieren Statusanzeige und OP-Leuchten leicht',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'surgical_table';

  const mats = {
    steel: new THREE.MeshStandardMaterial({
      name: 'OP_edelstahl',
      color: 0xc7d0d4,
      metalness: 0.9,
      roughness: 0.24,
    }),
    steelDark: new THREE.MeshStandardMaterial({
      name: 'OP_stahl_dunkel',
      color: 0x35434b,
      metalness: 0.78,
      roughness: 0.34,
    }),
    bronze: new THREE.MeshStandardMaterial({
      name: 'OP_bronze',
      color: 0x987044,
      metalness: 0.82,
      roughness: 0.3,
    }),
    rubber: new THREE.MeshStandardMaterial({
      name: 'OP_rutschmatte',
      color: 0x14191d,
      metalness: 0.02,
      roughness: 0.86,
    }),
    padding: new THREE.MeshStandardMaterial({
      name: 'OP_polster',
      color: 0x0b1014,
      metalness: 0.01,
      roughness: 0.78,
    }),
    drape: new THREE.MeshStandardMaterial({
      name: 'OP_tuch_gruen',
      color: 0x245e50,
      metalness: 0,
      roughness: 0.94,
    }),
    drapeLight: new THREE.MeshStandardMaterial({
      name: 'OP_tuch_saum',
      color: 0x4b9278,
      metalness: 0,
      roughness: 0.9,
    }),
    blue: new THREE.MeshStandardMaterial({
      name: 'OP_status_blau',
      color: 0x17404d,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.25,
      metalness: 0.3,
      roughness: 0.3,
    }),
    amber: new THREE.MeshStandardMaterial({
      name: 'OP_status_bernstein',
      color: 0x5b3510,
      emissive: 0xffb45c,
      emissiveIntensity: 0.05,
      metalness: 0.25,
      roughness: 0.35,
    }),
    lens: new THREE.MeshStandardMaterial({
      name: 'OP_leuchte_linsensystem',
      color: 0xe5fbff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 2.2,
      metalness: 0.05,
      roughness: 0.16,
    }),
    screen: new THREE.MeshStandardMaterial({
      name: 'OP_monitor_display',
      color: 0x102c35,
      emissive: 0x4bbac5,
      emissiveIntensity: 0.85,
      metalness: 0.1,
      roughness: 0.25,
    }),
    collision: new THREE.MeshBasicMaterial({
      name: 'COL_invisible',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  };

  const box = (w, h, d, material, x = 0, y = 0, z = 0, parent = root) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const cylinder = (radius, height, material, x = 0, y = 0, z = 0, parent = root, segments = 20) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, segments),
      material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const sphere = (radius, material, x, y, z, parent = root) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const rodBetween = (a, b, radius, material, parent = root) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
      material
    );
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const collider = (w, h, d, x, y, z, name) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.collision);
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };

  // --- Bodenplatte und zentrale Hubsäule
  const basePlate = cylinder(0.29, 0.08, mats.steel, 0, 0.04, 0, root, 32);
  basePlate.scale.set(1.16, 1, 1.62);

  const baseTrim = cylinder(0.255, 0.018, mats.bronze, 0, 0.087, 0, root, 32);
  baseTrim.scale.set(1.12, 1, 1.58);

  cylinder(0.195, 0.14, mats.steelDark, 0, 0.16, 0, root, 28);
  cylinder(0.115, 0.07, mats.steel, 0, 0.255, 0, root, 24);

  const columnInner = cylinder(0.075, 1, mats.steel, 0, 0.52, 0, root, 24);
  columnInner.scale.y = 0.45;

  const columnCollar = cylinder(0.125, 0.065, mats.bronze, 0, 0.66, 0, root, 24);

  // Kleine Sockelschrauben
  const boltGeometry = new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8);
  const bolts = new THREE.InstancedMesh(boltGeometry, mats.steelDark, 8);
  const boltMatrix = new THREE.Matrix4();
  const boltPositions = [
    [-0.18, -0.31], [0.18, -0.31],
    [-0.22, -0.11], [0.22, -0.11],
    [-0.22, 0.11], [0.22, 0.11],
    [-0.18, 0.31], [0.18, 0.31],
  ];
  boltPositions.forEach(([x, z], i) => {
    boltMatrix.makeTranslation(x, 0.087, z);
    bolts.setMatrixAt(i, boltMatrix);
  });
  bolts.instanceMatrix.needsUpdate = true;
  bolts.castShadow = true;
  root.add(bolts);

  // --- Beweglicher Tischaufsatz
  const carrier = new THREE.Group();
  carrier.name = 'OP_tischaufsatz';
  root.add(carrier);

  // Metallrahmen mit abgerundeten Ecken durch zwei übereinanderliegende Platten
  box(0.60, 0.055, 2.0, mats.steel, 0, -0.055, 0, carrier);
  box(0.54, 0.028, 1.94, mats.steelDark, 0, -0.019, 0, carrier);

  // Gelenkige Kopf-, Rücken- und Beinpolster
  const padHead = box(0.54, 0.095, 0.49, mats.padding, 0, 0.025, -0.70, carrier);
  padHead.rotation.x = -0.035;

  const padBack = box(0.54, 0.10, 0.69, mats.padding, 0, 0.025, 0.02, carrier);
  padBack.rotation.x = 0.018;

  const padLeg = box(0.54, 0.095, 0.61, mats.padding, 0, 0.025, 0.70, carrier);
  padLeg.rotation.x = 0.025;

  // Grünes steriles Tuch, mittig über dem Patientenbereich
  box(0.66, 0.022, 1.04, mats.drape, 0, 0.088, 0.12, carrier);
  box(0.022, 0.15, 1.04, mats.drape, -0.332, 0.025, 0.12, carrier);
  box(0.022, 0.15, 1.04, mats.drape, 0.332, 0.025, 0.12, carrier);
  box(0.66, 0.15, 0.022, mats.drape, 0, 0.025, 0.63, carrier);

  // Saum und kleine sterile Instrumentenauflage
  box(0.67, 0.012, 0.035, mats.drapeLight, 0, 0.101, -0.395, carrier);
  box(0.43, 0.018, 0.29, mats.drapeLight, 0, 0.108, 0.21, carrier);
  box(0.23, 0.012, 0.17, mats.steel, 0, 0.123, 0.21, carrier);

  // Seitliche Metallschienen
  [-0.345, 0.345].forEach((x) => {
    const rail = cylinder(0.012, 1.88, mats.steel, x, -0.01, 0, carrier, 12);
    rail.rotation.x = Math.PI / 2;
  });

  // Kleine seitliche Stützen unter dem Kopfende
  rodBetween([-0.22, -0.13, -0.72], [-0.22, -0.34, -0.72], 0.018, mats.steel, carrier);
  rodBetween([0.22, -0.13, -0.72], [0.22, -0.34, -0.72], 0.018, mats.steel, carrier);

  // Bedien- und Statuskonsole an der Säule
  box(0.18, 0.13, 0.045, mats.steelDark, 0, 0.46, 0.115, root);
  const statusMaterial = mats.blue.clone();
  statusMaterial.name = 'OP_status_anzeige';
  box(0.125, 0.06, 0.009, statusMaterial, 0, 0.475, 0.142, root);

  const buttonMaterial = mats.amber.clone();
  buttonMaterial.name = 'OP_tisch_bedienknopf';
  box(0.024, 0.024, 0.012, buttonMaterial, 0.065, 0.415, 0.142, root);

  // Fußpedal mit Kabel, an der Basis
  const pedal = box(0.16, 0.045, 0.22, mats.steelDark, 0.27, 0.028, 0.14, root);
  pedal.rotation.y = -0.18;
  rodBetween([0.24, 0.04, 0.05], [0.08, 0.06, 0.02], 0.012, mats.rubber, root);

  // --- Kompaktes Anästhesiemonitor an einem kurzen Arm
  const monitorArm = new THREE.Group();
  monitorArm.name = 'OP_anpaesthesie_monitor';
  monitorArm.position.set(0.23, 0.36, -0.22);
  root.add(monitorArm);

  rodBetween([0, 0, 0], [0, 0.58, 0], 0.026, mats.steel, monitorArm);
  rodBetween([0, 0.58, 0], [0.34, 0.58, 0.08], 0.022, mats.steel, monitorArm);

  const monitorBody = box(0.34, 0.25, 0.095, mats.steelDark, 0.34, 0.69, 0.09, monitorArm);
  monitorBody.rotation.y = 0.08;
  const monitorScreen = box(0.28, 0.17, 0.012, mats.screen, 0.34, 0.70, 0.144, monitorArm);
  monitorScreen.rotation.y = 0.08;

  // Kleine Knöpfe unterhalb des Displays
  box(0.035, 0.018, 0.014, mats.amber, 0.27, 0.57, 0.147, monitorArm);
  box(0.035, 0.018, 0.014, mats.steel, 0.31, 0.57, 0.147, monitorArm);
  box(0.035, 0.018, 0.014, mats.steel, 0.35, 0.57, 0.147, monitorArm);

  // --- Kleines Instrumententischchen rechts neben dem OP-Tisch
  const instrumentCart = new THREE.Group();
  instrumentCart.name = 'OP_instrumententisch';
  instrumentCart.position.set(0.61, 0, 0.42);
  root.add(instrumentCart);

  box(0.43, 0.045, 0.63, mats.steel, 0, 0.84, 0, instrumentCart);
  box(0.39, 0.018, 0.57, mats.drapeLight, 0, 0.87, 0, instrumentCart);

  [-0.17, 0.17].forEach((x) => {
    [-0.25, 0.25].forEach((z) => {
      rodBetween([x, 0.10, z], [x, 0.81, z], 0.014, mats.steel, instrumentCart);
      const wheel = cylinder(0.035, 0.028, mats.rubber, x, 0.035, z, instrumentCart, 16);
      wheel.rotation.z = Math.PI / 2;
    });
  });

  box(0.35, 0.025, 0.48, mats.steelDark, 0, 0.20, 0, instrumentCart);
  box(0.30, 0.018, 0.42, mats.steel, 0, 0.24, 0, instrumentCart);

  // Kleine Schalen und Instrumente auf dem Instrumententisch
  const tray = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.075, 0.035, 24),
    mats.steel
  );
  tray.position.set(-0.075, 0.90, -0.11);
  tray.castShadow = true;
  instrumentCart.add(tray);

  rodBetween([0.08, 0.90, 0.10], [0.08, 0.90, 0.24], 0.007, mats.steel, instrumentCart);
  rodBetween([0.08, 0.90, 0.15], [0.18, 0.90, 0.15], 0.007, mats.steel, instrumentCart);

  // --- Hinterer Mast für die beiden OP-Leuchten
  const mastZ = -1.13;
  const mastBase = cylinder(0.145, 0.055, mats.steelDark, 0, 0.0275, mastZ, root, 24);
  mastBase.scale.set(1.35, 1, 1);
  cylinder(0.046, 2.32, mats.steel, 0, 1.19, mastZ, root, 20);
  cylinder(0.068, 0.095, mats.bronze, 0, 2.31, mastZ, root, 20);

  // Umlenkrollen und Gelenke
  const leftJoint = [-0.56, 2.43, -0.79];
  const rightJoint = [0.56, 2.43, -0.79];

  rodBetween([0, 2.34, mastZ], leftJoint, 0.028, mats.steel);
  rodBetween([0, 2.34, mastZ], rightJoint, 0.028, mats.steel);
  sphere(0.064, mats.steelDark, ...leftJoint);
  sphere(0.064, mats.steelDark, ...rightJoint);

  // Geschlossenes, tiefes Tellerprofil der OP-Leuchten
  const dishProfile = [
    new THREE.Vector2(0.000, -0.060),
    new THREE.Vector2(0.075, -0.060),
    new THREE.Vector2(0.145, -0.052),
    new THREE.Vector2(0.225, -0.030),
    new THREE.Vector2(0.290, 0.005),
    new THREE.Vector2(0.340, 0.052),
    new THREE.Vector2(0.345, 0.070),
    new THREE.Vector2(0.328, 0.078),
    new THREE.Vector2(0.270, 0.033),
    new THREE.Vector2(0.195, 0.004),
    new THREE.Vector2(0.105, -0.020),
    new THREE.Vector2(0.000, -0.028),
  ];
  const dishGeometry = new THREE.LatheGeometry(dishProfile, 40);
  dishGeometry.computeVertexNormals();

  const rimGeometry = new THREE.TorusGeometry(0.332, 0.016, 8, 36);
  const lensGeometry = new THREE.CylinderGeometry(0.052, 0.052, 0.014, 16);
  const reflectorGeometry = new THREE.TorusGeometry(0.061, 0.008, 6, 18);

  const makeLamp = (side, x, z) => {
    const lampGroup = new THREE.Group();
    lampGroup.name = `OP_leuchte_${side}`;
    lampGroup.position.set(x, 2.06, z);
    lampGroup.rotation.z = side === 'links' ? 0.16 : -0.16;
    lampGroup.rotation.x = 0.045;
    root.add(lampGroup);

    const dish = new THREE.Mesh(dishGeometry, mats.steel);
    dish.castShadow = true;
    dish.receiveShadow = true;
    lampGroup.add(dish);

    const rim = new THREE.Mesh(rimGeometry, mats.bronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.067;
    rim.castShadow = true;
    lampGroup.add(rim);

    const hub = cylinder(0.054, 0.09, mats.steelDark, 0, 0.085, 0, lampGroup, 16);
    hub.castShadow = true;

    // Acht Linsenfelder mit kleinen Reflektorringen
    const lenses = new THREE.InstancedMesh(lensGeometry, mats.lens, 8);
    const reflectors = new THREE.InstancedMesh(reflectorGeometry, mats.bronze, 8);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const lx = Math.cos(angle) * 0.155;
      const lz = Math.sin(angle) * 0.155;

      matrix.makeTranslation(lx, -0.063, lz);
      lenses.setMatrixAt(i, matrix);

      matrix.makeTranslation(lx, -0.071, lz);
      reflectors.setMatrixAt(i, matrix);
    }

    lenses.instanceMatrix.needsUpdate = true;
    reflectors.instanceMatrix.needsUpdate = true;
    lampGroup.add(lenses);
    lampGroup.add(reflectors);

    // Steriler Handgriff
    cylinder(0.017, 0.13, mats.steel, 0, -0.115, 0, lampGroup, 12);
    cylinder(0.027, 0.07, mats.drape, 0, -0.175, 0, lampGroup, 14);

    // Verbindungsstange zum Gelenkarm
    const topPoint = new THREE.Vector3(x, 2.16, z);
    const jointPoint = new THREE.Vector3(
      side === 'links' ? leftJoint[0] : rightJoint[0],
      leftJoint[1],
      leftJoint[2]
    );
    rodBetween(topPoint.toArray(), jointPoint.toArray(), 0.025, mats.steel);
    sphere(0.055, mats.steelDark, topPoint.x, topPoint.y, topPoint.z);

    const lamp = new THREE.Object3D();
    lamp.name = `LAMP_op_${side}`;
    lamp.position.set(0, -0.13, 0);
    lamp.userData = {
      color: '#6fe3ff',
      intensity: 8,
      distance: 5,
    };
    lampGroup.add(lamp);

    const light = new THREE.PointLight(0x6fe3ff, 8, 5, 2);
    light.position.set(0, -0.13, 0);
    lampGroup.add(light);

    return { lampGroup, light };
  };

  const leftLamp = makeLamp('links', -0.47, 0.05);
  const rightLamp = makeLamp('rechts', 0.47, 0.05);

  // --- Kollisionskörper
  const baseCol = collider(0.62, 0.10, 0.92, 0, 0.05, 0, 'COL_tischbasis');
  const columnCol = collider(0.22, 0.48, 0.22, 0, 0.43, 0, 'COL_tischsaeule');
  const topCol = collider(0.68, 0.18, 2.02, 0, 0.86, 0, 'COL_tischplatte');
  const mastCol = collider(0.14, 2.36, 0.14, 0, 1.18, mastZ, 'COL_leuchtenmast');

  // Instrumententisch und Monitor bleiben bewegliche Zusatzteile ohne starre Kollision.

  // --- Benutzen-Punkt vor der Tischfußseite
  const use = new THREE.Object3D();
  use.name = 'INT_behandeln';
  use.position.set(0, 1.02, 1.22);
  use.userData = {
    label: 'Schwere Verletzung behandeln',
    radius: 0.9,
  };
  root.add(use);

  // --- Zustand und öffentliche API
  let currentHeight = THREE.MathUtils.clamp(Number(opts.hoehe) || 0.9, 0.7, 1.1);
  let targetHeight = currentHeight;
  let operationActive = false;
  let time = 0;

  const api = {
    startOperation() {
      operationActive = true;
    },
    endOperation() {
      operationActive = false;
    },
    behandeln() {
      operationActive = true;
    },
    raiseTable() {
      targetHeight = THREE.MathUtils.clamp(targetHeight + 0.1, 0.7, 1.1);
    },
    lowerTable() {
      targetHeight = THREE.MathUtils.clamp(targetHeight - 0.1, 0.7, 1.1);
    },
    setHeight(value) {
      targetHeight = THREE.MathUtils.clamp(Number(value) || 0.9, 0.7, 1.1);
    },
    get operationActive() {
      return operationActive;
    },
    get height() {
      return currentHeight;
    },
    get targetHeight() {
      return targetHeight;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'operation_starten',
      label: 'Operation starten',
      run: () => api.startOperation(),
    },
    {
      id: 'operation_beenden',
      label: 'Operation beenden',
      run: () => api.endOperation(),
    },
    {
      id: 'hoehe_erhoehen',
      label: 'Tischhöhe erhöhen',
      run: () => api.raiseTable(),
    },
    {
      id: 'hoehe_senken',
      label: 'Tischhöhe senken',
      run: () => api.lowerTable(),
    },
  ];

  // --- Weiche Animation
  function update(dt) {
    time += dt;

    currentHeight += (targetHeight - currentHeight) * Math.min(1, dt * 4.5);
    carrier.position.y = currentHeight;

    const innerBottom = 0.30;
    const innerTop = currentHeight - 0.11;
    const innerLength = Math.max(0.28, innerTop - innerBottom);
    columnInner.scale.y = innerLength;
    columnInner.position.y = innerBottom + innerLength * 0.5;

    topCol.position.y = currentHeight - 0.04;

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);

    statusMaterial.emissive.set(operationActive ? 0xffb45c : 0x6fe3ff);
    statusMaterial.emissiveIntensity = operationActive
      ? 1.1 + pulse * 1.2
      : 0.9 + pulse * 0.25;

    buttonMaterial.emissiveIntensity = operationActive
      ? 0.9 + pulse * 1.0
      : 0.08;

    mats.lens.emissiveIntensity = operationActive
      ? 2.0 + pulse * 0.7
      : 1.85 + pulse * 0.2;

    leftLamp.light.intensity = 8 + (operationActive ? pulse * 0.8 : 0.15);
    rightLamp.light.intensity = 8 + (operationActive ? pulse * 0.8 : 0.15);
  }

  root.userData.update = update;

  let lastTime = null;
  leftLamp.lampGroup.children[0].onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(Math.min(now - lastTime, 0.1));
    }
    lastTime = now;
  };

  // Sicherstellen, dass kein sichtbares Teil unter den Boden reicht.
  root.updateMatrixWorld(true);
  const temporaryBox = new THREE.Box3();
  const temporaryVector = new THREE.Vector3();
  const temporaryQuaternion = new THREE.Quaternion();

  root.traverse((object) => {
    if (!object.isMesh || object.name.startsWith('COL_')) return;
    if (object.material && object.material.opacity === 0) return;

    temporaryBox.setFromObject(object);
    if (temporaryBox.min.y < -0.001) {
      const correction = -temporaryBox.min.y;
      object.parent.getWorldQuaternion(temporaryQuaternion);
      temporaryVector.set(0, correction, 0).applyQuaternion(
        temporaryQuaternion.invert()
      );
      object.position.add(temporaryVector);
    }
  });

  root.updateMatrixWorld(true);

  return root;
}

// OBJ-084: Kraftstation & Hantelset der Erde
// Realmaßstab: ca. 2,74 × 1,56 × 1,26 m (B × H × T)
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'weight_bench',
  art: 'Standobjekt',
  masse: '2,74 × 1,56 × 1,26 m (B × H × T)',
  wohin: 'ATL-026 Fitnessraum / Gym, auf dem Holzboden',
  benutzen: 'INT_trainieren → Menü mit userData.actions',
  lichter: 'LAMP_trainingsanzeige (eisblau, dauerhaft an)',
  animation: 'Trainingsanzeige pulsiert; Stärke, Aktivstatus und Fortschritt werden während des Trainings aktualisiert',
  quelle: 'selbst gebaut nach OBJ-084, reale Referenz',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'weight_bench';

  const mat = {
    steel: new THREE.MeshStandardMaterial({
      name: 'weight_blackSteel',
      color: 0x15191d,
      metalness: 0.88,
      roughness: 0.34,
    }),
    blueSteel: new THREE.MeshStandardMaterial({
      name: 'weight_steelBlue',
      color: 0x253746,
      metalness: 0.82,
      roughness: 0.38,
    }),
    rubber: new THREE.MeshStandardMaterial({
      name: 'weight_blackRubber',
      color: 0x08090a,
      metalness: 0.0,
      roughness: 0.94,
    }),
    rubberEdge: new THREE.MeshStandardMaterial({
      name: 'weight_rubberEdge',
      color: 0x111417,
      metalness: 0.0,
      roughness: 0.88,
    }),
    vinyl: new THREE.MeshStandardMaterial({
      name: 'weight_blackVinyl',
      color: 0x101214,
      metalness: 0.02,
      roughness: 0.56,
    }),
    chrome: new THREE.MeshStandardMaterial({
      name: 'weight_chrome',
      color: 0x909ba3,
      metalness: 1.0,
      roughness: 0.2,
    }),
    bronze: new THREE.MeshStandardMaterial({
      name: 'weight_bronze',
      color: 0x855426,
      metalness: 0.85,
      roughness: 0.31,
    }),
    seam: new THREE.MeshStandardMaterial({
      name: 'weight_vinylSeam',
      color: 0x363a3e,
      metalness: 0.08,
      roughness: 0.62,
    }),
  };

  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const dummy = new THREE.Object3D();

  function box(name, w, h, d, x, y, z, material, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function tube(name, a, b, radius, material, segments = 12, parent = root) {
    const start = v(a[0], a[1], a[2]);
    const end = v(b[0], b[1], b[2]);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(v(0, 1, 0), direction.normalize());
    parent.add(mesh);
    return mesh;
  }

  function cylinderX(name, radius, length, x, y, z, material, segments = 24, parent = root) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
    geometry.rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function cylinderZ(name, radius, length, x, y, z, material, segments = 18, parent = root) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
    geometry.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function instanceMesh(name, geometry, material, positions, parent = root) {
    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    mesh.name = name;

    positions.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }

  function roundedCushion(name, width, depth, height, radius, x, y, z, material, parent = root) {
    const w = width / 2;
    const d = depth / 2;
    const r = Math.min(radius, w, d);
    const shape = new THREE.Shape();

    shape.moveTo(-w + r, -d);
    shape.lineTo(w - r, -d);
    shape.quadraticCurveTo(w, -d, w, -d + r);
    shape.lineTo(w, d - r);
    shape.quadraticCurveTo(w, d, w - r, d);
    shape.lineTo(-w + r, d);
    shape.quadraticCurveTo(-w, d, -w, d - r);
    shape.lineTo(-w, -d + r);
    shape.quadraticCurveTo(-w, -d, -w + r, -d);

    const bevel = 0.012;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 8,
      steps: 1,
    });

    geometry.translate(0, 0, bevel);
    geometry.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // Riffelung des Langhantelgriffs als echte Canvas-Textur.
  const knurlCanvas = document.createElement('canvas');
  knurlCanvas.width = 128;
  knurlCanvas.height = 128;
  const knurlContext = knurlCanvas.getContext('2d');
  knurlContext.fillStyle = '#737b80';
  knurlContext.fillRect(0, 0, 128, 128);
  knurlContext.lineWidth = 3;
  knurlContext.strokeStyle = '#30363a';

  for (let i = -128; i < 256; i += 12) {
    knurlContext.beginPath();
    knurlContext.moveTo(i, 0);
    knurlContext.lineTo(i + 128, 128);
    knurlContext.stroke();

    knurlContext.beginPath();
    knurlContext.moveTo(i + 5, 0);
    knurlContext.lineTo(i + 133, 128);
    knurlContext.stroke();
  }

  const knurlTexture = new THREE.CanvasTexture(knurlCanvas);
  knurlTexture.colorSpace = THREE.SRGBColorSpace;
  knurlTexture.wrapS = THREE.RepeatWrapping;
  knurlTexture.wrapT = THREE.RepeatWrapping;
  knurlTexture.repeat.set(10, 2);

  const matKnurl = new THREE.MeshStandardMaterial({
    name: 'weight_barKnurl',
    map: knurlTexture,
    color: 0xffffff,
    metalness: 0.92,
    roughness: 0.43,
  });

  // ---------------------------------------------------------------------
  // Flache Hantelbank
  // ---------------------------------------------------------------------
  const bench = new THREE.Group();
  bench.name = 'weight_bench_bank';
  root.add(bench);

  for (const z of [-0.44, 0.44]) {
    tube(
      'weight_bank_fuss',
      [-0.36, 0.038, z],
      [0.36, 0.038, z],
      0.038,
      mat.steel,
      14,
      bench,
    );

    for (const x of [-0.29, 0.29]) {
      tube(
        'weight_bank_schenkel',
        [x, 0.065, z],
        [0, 0.385, z],
        0.032,
        mat.steel,
        14,
        bench,
      );
    }

    tube(
      'weight_bank_querholm',
      [-0.25, 0.115, z],
      [0.25, 0.115, z],
      0.026,
      mat.blueSteel,
      12,
      bench,
    );
  }

  tube(
    'weight_bank_mittellange',
    [0, 0.115, -0.44],
    [0, 0.115, 0.44],
    0.026,
    mat.steel,
    12,
    bench,
  );

  box(
    'weight_bank_traegerplatte',
    0.46,
    0.04,
    1.26,
    0,
    0.405,
    0,
    mat.blueSteel,
    bench,
  );

  // Drei getrennte, abgerundete Vinylpolster.
  roundedCushion(
    'weight_bank_polster_hinten',
    0.44,
    0.30,
    0.11,
    0.055,
    0,
    0.425,
    -0.465,
    mat.vinyl,
    bench,
  );
  roundedCushion(
    'weight_bank_polster_mitte',
    0.44,
    0.45,
    0.11,
    0.055,
    0,
    0.425,
    -0.08,
    mat.vinyl,
    bench,
  );
  roundedCushion(
    'weight_bank_polster_beine',
    0.44,
    0.37,
    0.11,
    0.055,
    0,
    0.425,
    0.40,
    mat.vinyl,
    bench,
  );

  // Schmale Nahtkanten auf den Polstern.
  for (const z of [-0.465, -0.08, 0.40]) {
    const seamLength = z === -0.08 ? 0.40 : z === -0.465 ? 0.25 : 0.32;
    box(
      'weight_bank_naht_links',
      0.008,
      0.002,
      seamLength,
      -0.207,
      0.536,
      z,
      mat.seam,
      bench,
    );
    box(
      'weight_bank_naht_rechts',
      0.008,
      0.002,
      seamLength,
      0.207,
      0.536,
      z,
      mat.seam,
      bench,
    );
  }

  // Justierclips und sichtbare Befestigungsschrauben.
  for (const z of [-0.40, 0.40]) {
    for (const x of [-0.245, 0.245]) {
      cylinderX(
        'weight_bank_clip',
        0.043,
        0.018,
        x,
        0.402,
        z,
        mat.bronze,
        18,
        bench,
      );
      cylinderX(
        'weight_bank_schraube',
        0.018,
        0.022,
        x,
        0.405,
        z,
        mat.chrome,
        12,
        bench,
      );
    }
  }

  // ---------------------------------------------------------------------
  // Kraftständer / Squat-Rack
  // ---------------------------------------------------------------------
  const rack = new THREE.Group();
  rack.name = 'weight_bench_rack';
  root.add(rack);

  for (const x of [-0.62, 0.62]) {
    tube(
      'weight_rack_sockel',
      [x, 0.045, -0.46],
      [x, 0.045, 0.46],
      0.045,
      mat.steel,
      14,
      rack,
    );

    for (const z of [-0.46, 0.46]) {
      tube(
        'weight_rack_pfosten',
        [x, 0.05, z],
        [x, 1.49, z],
        0.036,
        mat.steel,
        16,
        rack,
      );
      box(
        'weight_rack_fussplatte',
        0.17,
        0.035,
        0.18,
        x,
        0.0175,
        z,
        mat.blueSteel,
        rack,
      );
    }

    tube(
      'weight_rack_oberseite',
      [x, 1.49, -0.46],
      [x, 1.49, 0.46],
      0.034,
      mat.steel,
      16,
      rack,
    );

    // J-Haken: flacher Auflageteil mit kurzer aufgerichteter Lippe.
    const inward = x > 0 ? -1 : 1;
    tube(
      'weight_rack_haken',
      [x, 1.09, -0.18],
      [x + inward * 0.155, 1.09, -0.18],
      0.028,
      mat.steel,
      14,
      rack,
    );
    tube(
      'weight_rack_hakenlippe',
      [x + inward * 0.155, 1.09, -0.18],
      [x + inward * 0.155, 1.15, -0.18],
      0.026,
      mat.bronze,
      12,
      rack,
    );
    cylinderX(
      'weight_rack_hakenauflage',
      0.031,
      0.09,
      x + inward * 0.105,
      1.09,
      -0.18,
      mat.rubberEdge,
      14,
      rack,
    );
  }

  tube(
    'weight_rack_rueckstrebe',
    [-0.62, 1.49, -0.46],
    [0.62, 1.49, -0.46],
    0.034,
    mat.steel,
    16,
    rack,
  );

  // Dezente bronzefarbene Lantianer-Kappen.
  for (const x of [-0.62, 0.62]) {
    for (const z of [-0.46, 0.46]) {
      cylinderX(
        'weight_rack_bronze_kappe',
        0.043,
        0.035,
        x,
        1.515,
        z,
        mat.bronze,
        18,
        rack,
      );
    }
  }

  // ---------------------------------------------------------------------
  // Langhantel auf den Rack-Haken
  // ---------------------------------------------------------------------
  const barbell = new THREE.Group();
  barbell.name = 'weight_barbell';
  root.add(barbell);

  const barY = 1.135;
  const barZ = -0.18;

  cylinderX(
    'weight_bar_stange',
    0.022,
    2.16,
    0,
    barY,
    barZ,
    mat.chrome,
    24,
    barbell,
  );
  cylinderX(
    'weight_bar_griff',
    0.027,
    1.02,
    0,
    barY,
    barZ,
    matKnurl,
    28,
    barbell,
  );

  const barPlatePositions = [
    [-0.80, barY, barZ],
    [-0.90, barY, barZ],
    [0.80, barY, barZ],
    [0.90, barY, barZ],
  ];

  const barPlateGeometry = new THREE.CylinderGeometry(0.225, 0.225, 0.065, 32);
  barPlateGeometry.rotateZ(Math.PI / 2);
  instanceMesh(
    'weight_bar_scheiben',
    barPlateGeometry,
    mat.rubber,
    barPlatePositions,
    barbell,
  );

  const barRimGeometry = new THREE.TorusGeometry(0.203, 0.016, 8, 30);
  barRimGeometry.rotateY(Math.PI / 2);
  instanceMesh(
    'weight_bar_scheibenraender',
    barRimGeometry,
    mat.rubberEdge,
    barPlatePositions,
    barbell,
  );

  const barHubGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.086, 18);
  barHubGeometry.rotateZ(Math.PI / 2);
  instanceMesh(
    'weight_bar_scheibennaben',
    barHubGeometry,
    mat.chrome,
    barPlatePositions,
    barbell,
  );

  for (const side of [-1, 1]) {
    cylinderX(
      'weight_bar_huelle',
      0.036,
      0.32,
      side * 0.92,
      barY,
      barZ,
      mat.chrome,
      24,
      barbell,
    );
    cylinderX(
      'weight_bar_klemmring',
      0.046,
      0.045,
      side * 1.055,
      barY,
      barZ,
      mat.blueSteel,
      18,
      barbell,
    );
    cylinderX(
      'weight_bar_endkappe',
      0.025,
      0.018,
      side * 1.095,
      barY,
      barZ,
      mat.chrome,
      18,
      barbell,
    );
  }

  // ---------------------------------------------------------------------
  // Kurzhantel-Ständer links, zwei Ebenen mit je drei Hanteln
  // ---------------------------------------------------------------------
  const dumbbellStand = new THREE.Group();
  dumbbellStand.name = 'weight_dumbbell_stand';
  root.add(dumbbellStand);

  for (const x of [-1.31, -0.69]) {
    for (const z of [-0.16, 0.36]) {
      tube(
        'weight_hantelstange_stuetze',
        [x, 0.03, z],
        [x, 0.86, z],
        0.025,
        mat.steel,
        12,
        dumbbellStand,
      );
      box(
        'weight_hantelstange_fuss',
        0.12,
        0.025,
        0.12,
        x,
        0.0125,
        z,
        mat.blueSteel,
        dumbbellStand,
      );
    }
  }

  const shelfCenters = [0.31, 0.69];
  for (const y of shelfCenters) {
    box(
      'weight_hantelablage',
      0.68,
      0.05,
      0.60,
      -1.0,
      y,
      0.10,
      mat.blueSteel,
      dumbbellStand,
    );
    box(
      'weight_hantelablage_kante',
      0.68,
      0.045,
      0.035,
      -1.0,
      y + 0.015,
      -0.183,
      mat.steel,
      dumbbellStand,
    );
    box(
      'weight_hantelablage_kante_hinten',
      0.68,
      0.045,
      0.035,
      -1.0,
      y + 0.015,
      0.383,
      mat.steel,
      dumbbellStand,
    );
  }

  const dumbbellHandles = [];
  const dumbbellPlates = [];
  const dumbbellHubs = [];
  const dumbbellRims = [];

  for (const shelfCenter of shelfCenters) {
    const shelfTop = shelfCenter + 0.025;
    const centerY = shelfTop + 0.092;

    for (let column = 0; column < 3; column++) {
      const x = -1.19 + column * 0.21;

      dumbbellHandles.push([x, centerY, 0.10]);
      dumbbellPlates.push([x, centerY, -0.08]);
      dumbbellPlates.push([x, centerY, 0.28]);
      dumbbellHubs.push([x, centerY, -0.08]);
      dumbbellHubs.push([x, centerY, 0.28]);
      dumbbellRims.push([x, centerY, -0.08]);
      dumbbellRims.push([x, centerY, 0.28]);
    }
  }

  const dumbbellHandleGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.30, 14);
  dumbbellHandleGeometry.rotateX(Math.PI / 2);
  instanceMesh(
    'weight_kurzhantel_griffe',
    dumbbellHandleGeometry,
    mat.chrome,
    dumbbellHandles,
    dumbbellStand,
  );

  const dumbbellPlateGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.055, 20);
  dumbbellPlateGeometry.rotateX(Math.PI / 2);
  instanceMesh(
    'weight_kurzhantel_scheiben',
    dumbbellPlateGeometry,
    mat.rubber,
    dumbbellPlates,
    dumbbellStand,
  );

  const dumbbellRimGeometry = new THREE.TorusGeometry(0.073, 0.011, 7, 24);
  instanceMesh(
    'weight_kurzhantel_scheibenraender',
    dumbbellRimGeometry,
    mat.rubberEdge,
    dumbbellRims,
    dumbbellStand,
  );

  const dumbbellHubGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.070, 14);
  dumbbellHubGeometry.rotateX(Math.PI / 2);
  instanceMesh(
    'weight_kurzhantel_naben',
    dumbbellHubGeometry,
    mat.chrome,
    dumbbellHubs,
    dumbbellStand,
  );

  // ---------------------------------------------------------------------
  // Scheibenablage rechts
  // ---------------------------------------------------------------------
  const plateStand = new THREE.Group();
  plateStand.name = 'weight_plate_stand';
  root.add(plateStand);

  for (const x of [0.765, 1.335]) {
    tube(
      'weight_scheibenablage_fuss',
      [x, 0.035, 0.04],
      [x, 0.035, 0.58],
      0.035,
      mat.steel,
      12,
      plateStand,
    );
    tube(
      'weight_scheibenablage_steg',
      [x, 0.035, 0.31],
      [x, 0.32, 0.31],
      0.025,
      mat.steel,
      12,
      plateStand,
    );
  }

  cylinderX(
    'weight_scheibenablage_achse',
    0.024,
    0.60,
    1.05,
    0.32,
    0.31,
    mat.chrome,
    18,
    plateStand,
  );

  const storedPlatePositions = [
    [0.90, 0.32, 0.31],
    [1.03, 0.32, 0.31],
    [1.16, 0.32, 0.31],
  ];

  const storedPlateGeometry = new THREE.CylinderGeometry(0.23, 0.23, 0.055, 28);
  storedPlateGeometry.rotateZ(Math.PI / 2);
  instanceMesh(
    'weight_lager_scheiben',
    storedPlateGeometry,
    mat.rubber,
    storedPlatePositions,
    plateStand,
  );

  const storedRimGeometry = new THREE.TorusGeometry(0.208, 0.015, 8, 28);
  storedRimGeometry.rotateY(Math.PI / 2);
  instanceMesh(
    'weight_lager_scheibenraender',
    storedRimGeometry,
    mat.rubberEdge,
    storedPlatePositions,
    plateStand,
  );

  const storedHubGeometry = new THREE.CylinderGeometry(0.058, 0.058, 0.069, 16);
  storedHubGeometry.rotateZ(Math.PI / 2);
  instanceMesh(
    'weight_lager_scheibennaben',
    storedHubGeometry,
    mat.chrome,
    storedPlatePositions,
    plateStand,
  );

  cylinderX(
    'weight_scheibenablage_endstopp',
    0.034,
    0.035,
    1.35,
    0.32,
    0.31,
    mat.bronze,
    16,
    plateStand,
  );

  // ---------------------------------------------------------------------
  // Integrierte Trainingsanzeige am vorderen rechten Rackpfosten
  // ---------------------------------------------------------------------
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 256;
  displayCanvas.height = 128;
  const displayContext = displayCanvas.getContext('2d');
  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;

  const displayMaterial = new THREE.MeshStandardMaterial({
    name: 'weight_training_display',
    map: displayTexture,
    emissiveMap: displayTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.58,
    metalness: 0.08,
    roughness: 0.48,
  });

  box(
    'weight_anzeige_rahmen',
    0.33,
    0.22,
    0.055,
    0.62,
    1.18,
    0.505,
    mat.bronze,
  );
  box(
    'weight_anzeige_gehaeuse',
    0.305,
    0.195,
    0.060,
    0.62,
    1.18,
    0.507,
    mat.blueSteel,
  );

  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.282, 0.145), displayMaterial);
  display.name = 'weight_anzeige_bildschirm';
  display.position.set(0.62, 1.18, 0.539);
  root.add(display);

  // ---------------------------------------------------------------------
  // Benutzen-Punkt und Licht
  // ---------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_trainieren';
  use.position.set(0.58, 1.12, 0.91);
  use.userData = {
    label: 'Krafttraining',
    radius: 0.9,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_trainingsanzeige';
  lamp.position.set(0.62, 1.18, 0.68);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 3.5,
    distance: 2.4,
  };
  root.add(lamp);

  // ---------------------------------------------------------------------
  // Kollisionskörper: ausschließlich einfache Boxen mit COL_-Namen
  // ---------------------------------------------------------------------
  function collider(name, w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  collider('COL_bank', 0.58, 0.45, 1.28, 0, 0.225, 0);
  collider('COL_rack_links', 0.14, 1.50, 1.16, -0.62, 0.75, 0);
  collider('COL_rack_rechts', 0.14, 1.50, 1.16, 0.62, 0.75, 0);
  collider('COL_barbell', 2.20, 0.48, 0.50, 0, barY, barZ);
  collider('COL_hantelstange', 0.74, 0.88, 0.64, -1.0, 0.44, 0.10);
  collider('COL_scheibenablage', 0.64, 0.58, 0.58, 1.05, 0.29, 0.31);

  // ---------------------------------------------------------------------
  // Trainingszustand und Anzeige
  // ---------------------------------------------------------------------
  let training = false;
  let strength = 10;
  let trainingTime = 0;
  let lastFrame = null;
  let displayedState = '';

  function drawDisplay() {
    const progress = training ? (trainingTime % 12) / 12 : 0;
    const stateKey = `${strength}|${Math.floor(progress * 40)}|${training}`;
    if (stateKey === displayedState) return;
    displayedState = stateKey;

    const ctx = displayContext;
    ctx.fillStyle = '#061016';
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = training ? '#6fe3ff' : '#365d68';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 120);

    ctx.fillStyle = training ? '#bcefff' : '#7d9ba5';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STÄRKE', 17, 29);

    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = training ? '#6fe3ff' : '#8baab3';
    ctx.fillText(String(strength).padStart(3, '0'), 17, 76);

    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = training ? '#ffb65c' : '#506a74';
    ctx.fillText(training ? 'AKTIV' : 'BEREIT', 238, 29);

    const filled = Math.ceil((strength / 100) * 10);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i < filled
        ? (training ? '#6fe3ff' : '#568894')
        : '#172d34';
      ctx.fillRect(17 + i * 22.3, 91, 17, 15);
    }

    ctx.fillStyle = '#142a32';
    ctx.fillRect(17, 113, 220, 4);
    ctx.fillStyle = training ? '#ffb65c' : '#365d68';
    ctx.fillRect(17, 113, 220 * progress, 4);

    displayTexture.needsUpdate = true;
  }

  function update(dt) {
    if (training) {
      trainingTime += dt;
      strength = Math.min(100, 10 + Math.floor(trainingTime / 12));
    }

    const pulse = training
      ? 0.88 + Math.sin(trainingTime * 5.2) * 0.22
      : 0.54;

    displayMaterial.emissiveIntensity +=
      (pulse - displayMaterial.emissiveIntensity) * Math.min(1, dt * 8);

    drawDisplay();
  }

  display.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastFrame !== null) {
      const dt = Math.min(now - lastFrame, 0.1);
      update(dt);
    }
    lastFrame = now;
  };

  drawDisplay();

  // ---------------------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // ---------------------------------------------------------------------
  const api = {
    startTraining() {
      training = true;
      drawDisplay();
    },
    stopTraining() {
      training = false;
      drawDisplay();
    },
    resetProgress() {
      training = false;
      trainingTime = 0;
      strength = 10;
      drawDisplay();
    },
    get training() {
      return training;
    },
    get strength() {
      return strength;
    },
    get progress() {
      return training ? (trainingTime % 12) / 12 : 0;
    },
    get trainingTime() {
      return trainingTime;
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'training_start',
      label: 'Trainingsprogramm starten',
      run: () => api.startTraining(),
    },
    {
      id: 'training_stop',
      label: 'Trainingsprogramm beenden',
      run: () => api.stopTraining(),
    },
  ];

  return root;
}

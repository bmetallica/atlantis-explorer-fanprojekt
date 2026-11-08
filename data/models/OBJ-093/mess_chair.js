// Kantinenstuhl – stapelbarer Expeditionsstuhl mit schwarzer Kunststoffschale
// und dunklem Metallrohrgestell. Standobjekt, Sitzseite / Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'mess_chair',
  art: 'Standobjekt',
  masse: '0,48 × 0,82 × 0,52 (B × H × T, m)',
  wohin: 'Kantine, Messraum, Aufenthaltsraum',
  benutzen: 'INT_hinsetzen → Auf den Kantinenstuhl setzen',
  lichter: 'keine',
  animation: 'keine',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'mess_chair';

  const shellMaterial = new THREE.MeshStandardMaterial({
    name: 'stuhl_schale',
    color: 0x090a0c,
    roughness: 0.72,
    metalness: 0.02,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    name: 'stuhl_gestell',
    color: 0x15171a,
    roughness: 0.4,
    metalness: 0.78,
  });

  const glideMaterial = new THREE.MeshStandardMaterial({
    name: 'stuhl_gleiter',
    color: 0x050506,
    roughness: 0.95,
    metalness: 0.0,
  });

  // --- Geschlossene, ergonomisch gewölbte Kunststoffschale ---
  // Der Pfad läuft von der Sitzvorderkante bei +Z über den Sitz zur
  // leicht nach hinten geneigten Rückenlehne bei -Z.
  const rows = [
    { y: 0.455, z:  0.245, w: 0.448, seat: true  },
    { y: 0.460, z:  0.190, w: 0.458, seat: true  },
    { y: 0.462, z:  0.130, w: 0.462, seat: true  },
    { y: 0.461, z:  0.065, w: 0.460, seat: true  },
    { y: 0.458, z:  0.000, w: 0.458, seat: true  },
    { y: 0.455, z: -0.065, w: 0.455, seat: true  },
    { y: 0.452, z: -0.130, w: 0.452, seat: true  },
    { y: 0.462, z: -0.175, w: 0.450, seat: false },
    { y: 0.505, z: -0.198, w: 0.448, seat: false },
    { y: 0.570, z: -0.218, w: 0.445, seat: false },
    { y: 0.645, z: -0.238, w: 0.442, seat: false },
    { y: 0.730, z: -0.256, w: 0.438, seat: false },
    { y: 0.815, z: -0.270, w: 0.432, seat: false },
  ];

  const columns = 5;
  const rowCount = rows.length;
  const layerSize = rowCount * columns;
  const positions = [];
  const indices = [];

  function pointIndex(layer, row, column) {
    return layer * layerSize + row * columns + column;
  }

  for (let layer = 0; layer < 2; layer++) {
    for (let r = 0; r < rowCount; r++) {
      const data = rows[r];

      for (let c = 0; c < columns; c++) {
        const u = c / (columns - 1) * 2 - 1;
        const sideRise = data.seat ? 0.014 * u * u : 0.006 * u * u;
        const seatBowl = data.seat ? 0.008 * (1 - u * u) : 0;
        const backCurve = data.seat ? 0 : 0.012 * (1 - u * u);

        const x = u * data.w * 0.5;
        const y = data.y + sideRise - seatBowl;
        const z = data.z + backCurve;

        if (layer === 0) {
          positions.push(x, y, z);
        } else {
          // Geschlossene Rückseite: unter dem Sitz 9 mm nach unten,
          // hinter der Lehne 9 mm nach hinten.
          const dy = data.seat ? -0.009 : 0;
          const dz = data.seat ? 0 : -0.009;
          positions.push(x, y + dy, z + dz);
        }
      }
    }
  }

  function addQuad(a, b, c, d, reverse = false) {
    if (reverse) {
      indices.push(a, d, b, b, d, c);
    } else {
      indices.push(a, b, d, b, c, d);
    }
  }

  // Vorder- und Rückseite der Formschale.
  for (let layer = 0; layer < 2; layer++) {
    for (let r = 0; r < rowCount - 1; r++) {
      for (let c = 0; c < columns - 1; c++) {
        const a = pointIndex(layer, r, c);
        const b = pointIndex(layer, r, c + 1);
        const cIndex = pointIndex(layer, r + 1, c + 1);
        const d = pointIndex(layer, r + 1, c);
        addQuad(a, b, cIndex, d, layer === 1);
      }
    }
  }

  // Geschlossener Rand rund um Sitz, Seiten und Lehne.
  const perimeter = [];
  for (let c = 0; c < columns; c++) perimeter.push([0, c]);
  for (let r = 1; r < rowCount; r++) perimeter.push([r, columns - 1]);
  for (let c = columns - 2; c >= 0; c--) perimeter.push([rowCount - 1, c]);
  for (let r = rowCount - 2; r >= 1; r--) perimeter.push([r, 0]);

  for (let i = 0; i < perimeter.length; i++) {
    const next = (i + 1) % perimeter.length;
    const a = pointIndex(0, perimeter[i][0], perimeter[i][1]);
    const b = pointIndex(1, perimeter[i][0], perimeter[i][1]);
    const c = pointIndex(0, perimeter[next][0], perimeter[next][1]);
    const d = pointIndex(1, perimeter[next][0], perimeter[next][1]);
    indices.push(a, b, c, c, b, d);
  }

  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  shellGeometry.setIndex(indices);
  shellGeometry.computeVertexNormals();
  shellGeometry.computeBoundingBox();
  shellGeometry.computeBoundingSphere();

  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.name = 'sitzschale';
  shell.castShadow = true;
  shell.receiveShadow = true;
  root.add(shell);

  // --- Schlankes Metallrohrgestell als eine InstancedMesh ---
  const tubeGeometry = new THREE.CylinderGeometry(
    0.0105,
    0.0105,
    1,
    8,
    1,
    false
  );

  const tubeParts = [
    // Vorderbeine, leicht nach innen geneigt.
    [[-0.208, 0.014,  0.220], [-0.185, 0.432,  0.160]],
    [[ 0.208, 0.014,  0.220], [ 0.185, 0.432,  0.160]],

    // Hinterbeine, nach hinten ausgestellt.
    [[-0.220, 0.014, -0.250], [-0.185, 0.432, -0.145]],
    [[ 0.220, 0.014, -0.250], [ 0.185, 0.432, -0.145]],

    // Umlaufender Holm unter der Sitzschale.
    [[-0.185, 0.428,  0.160], [ 0.185, 0.428,  0.160]],
    [[-0.185, 0.428, -0.145], [ 0.185, 0.428, -0.145]],
    [[-0.185, 0.428,  0.160], [-0.185, 0.428, -0.145]],
    [[ 0.185, 0.428,  0.160], [ 0.185, 0.428, -0.145]],

    // Rückenholme hinter der Kunststofflehne.
    [[-0.185, 0.428, -0.155], [-0.180, 0.798, -0.278]],
    [[ 0.185, 0.428, -0.155], [ 0.180, 0.798, -0.278]],

    // Schmaler Querholm unmittelbar hinter der oberen Lehne.
    [[-0.180, 0.788, -0.276], [0.180, 0.788, -0.276]],
  ];

  const frame = new THREE.InstancedMesh(
    tubeGeometry,
    frameMaterial,
    tubeParts.length
  );
  frame.name = 'gestell_rohr';
  frame.castShadow = true;
  frame.receiveShadow = true;

  const up = new THREE.Vector3(0, 1, 0);
  const helperMatrix = new THREE.Matrix4();
  const helperPosition = new THREE.Vector3();
  const helperDirection = new THREE.Vector3();
  const helperQuaternion = new THREE.Quaternion();
  const helperScale = new THREE.Vector3(1, 1, 1);

  tubeParts.forEach((part, index) => {
    const start = new THREE.Vector3(...part[0]);
    const end = new THREE.Vector3(...part[1]);

    helperPosition.copy(start).add(end).multiplyScalar(0.5);
    helperDirection.copy(end).sub(start);
    const length = helperDirection.length();
    helperDirection.normalize();
    helperQuaternion.setFromUnitVectors(up, helperDirection);
    helperScale.set(1, length, 1);

    helperMatrix.compose(
      helperPosition,
      helperQuaternion,
      helperScale
    );
    frame.setMatrixAt(index, helperMatrix);
  });

  frame.instanceMatrix.needsUpdate = true;
  root.add(frame);

  // --- Schwarze, runde Bodengleiter als eine InstancedMesh ---
  const glideGeometry = new THREE.CylinderGeometry(
    0.019,
    0.019,
    0.014,
    8,
    1,
    false
  );

  const glides = new THREE.InstancedMesh(
    glideGeometry,
    glideMaterial,
    4
  );
  glides.name = 'boden_gleiter';
  glides.castShadow = true;

  const glidePositions = [
    [-0.208, 0.007,  0.220],
    [ 0.208, 0.007,  0.220],
    [-0.220, 0.007, -0.250],
    [ 0.220, 0.007, -0.250],
  ];

  glidePositions.forEach((position, index) => {
    helperMatrix.makeTranslation(...position);
    glides.setMatrixAt(index, helperMatrix);
  });

  glides.instanceMatrix.needsUpdate = true;
  root.add(glides);

  // --- Unsichtbarer Kollisionskörper ---
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });

  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.82, 0.52),
    collisionMaterial
  );
  collision.name = 'COL_mess_chair';
  collision.position.set(0, 0.41, -0.005);
  collision.userData.aktiv = true;
  root.add(collision);

  // --- Benutzen-Punkt zum Hinsetzen ---
  const use = new THREE.Object3D();
  use.name = 'INT_hinsetzen';
  use.position.set(0, 0.51, 0.10);
  use.userData = {
    label: 'Auf den Kantinenstuhl setzen',
    radius: 0.8,
  };
  root.add(use);

  // Der Stuhl besitzt keine eigene technische Funktion. Das Hinsetzen und
  // Verschieben übernimmt die Spiellogik am INT-Punkt.
  root.userData.api = {};
  root.userData.actions = [];

  return root;
}

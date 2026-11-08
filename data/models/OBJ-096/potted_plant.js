// potted_plant.js
// Topfpflanze (Ficus) – Standobjekt, 1 Einheit = 1 Meter
import * as THREE from 'three';

export const steckbrief = {
  name: 'potted_plant',
  art: 'Standobjekt',
  masse: 'Ø 0,90 × 1,80 m (Krone bzw. Gesamthöhe); Kübel Ø 0,47 × 0,55 m',
  benutzen: '— (Dekoration)',
  lichter: 'keine',
  animation: 'Die Blattkrone wiegt sich sehr leicht; gedämpfte, versetzte Schwingbewegung.',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'potted_plant';

  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const tempDir = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();
  const tempTwist = new THREE.Quaternion();
  const tempPos = new THREE.Vector3();
  const tempScale = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const potMat = new THREE.MeshStandardMaterial({
    name: 'pflanzenkuebel',
    color: 0x25282a,
    roughness: 0.9,
    metalness: 0.04,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    name: 'pflanzenkuebel_rand',
    color: 0x171a1c,
    roughness: 0.76,
    metalness: 0.08,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    name: 'erde',
    color: 0x2b2119,
    roughness: 1,
    metalness: 0,
  });

  const barkMat = new THREE.MeshStandardMaterial({
    name: 'ficus_rinde',
    color: 0x594633,
    roughness: 0.94,
    metalness: 0,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    name: 'ficus_blatt',
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  // ------------------------------------------------------------
  // Pflanzenkübel: geschlossener, leicht konischer Zylinder
  // Ursprung liegt auf der Unterseite bei y = 0.
  // ------------------------------------------------------------
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.205, 0.55, 28),
    potMat
  );
  pot.name = 'pflanzenkuebel';
  pot.position.y = 0.275;
  pot.castShadow = true;
  pot.receiveShadow = true;
  root.add(pot);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.232, 0.021, 8, 28),
    rimMat
  );
  rim.name = 'pflanzenkuebel_rand';
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.535;
  rim.castShadow = true;
  rim.receiveShadow = true;
  root.add(rim);

  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.208, 0.208, 0.035, 24),
    rimMat
  );
  foot.name = 'pflanzenkuebel_sockel';
  foot.position.y = 0.0175;
  foot.castShadow = true;
  foot.receiveShadow = true;
  root.add(foot);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.218, 0.218, 0.024, 24),
    soilMat
  );
  soil.name = 'pflanzenerde';
  soil.position.y = 0.526;
  soil.receiveShadow = true;
  root.add(soil);

  // Kleine unregelmäßige Erdhöhen verhindern eine vollkommen glatte Fläche.
  const soilClodGeometry = new THREE.SphereGeometry(0.022, 5, 2);
  const soilClods = new THREE.InstancedMesh(soilClodGeometry, soilMat, 14);
  soilClods.name = 'pflanzenerde_huegel';
  soilClods.receiveShadow = true;

  for (let i = 0; i < 14; i++) {
    const angle = i * 2.399963;
    const radius = 0.035 + (i % 5) * 0.034;
    tempPos.set(
      Math.cos(angle) * radius,
      0.536,
      Math.sin(angle) * radius
    );
    tempQuat.setFromAxisAngle(Y_AXIS, angle);
    const s = 0.55 + (i % 4) * 0.12;
    tempScale.set(s, s * 0.45, s);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    soilClods.setMatrixAt(i, tempMatrix);
  }
  soilClods.instanceMatrix.needsUpdate = true;
  root.add(soilClods);

  // ------------------------------------------------------------
  // Schlanker, leicht gebogener Stamm
  // ------------------------------------------------------------
  const trunkPoints = [
    new THREE.Vector3(0, 0.54, 0),
    new THREE.Vector3(0.014, 0.75, 0.006),
    new THREE.Vector3(-0.009, 0.98, 0.009),
    new THREE.Vector3(0.007, 1.19, -0.004),
  ];

  function addTrunkSegment(a, b, radiusBottom, radiusTop) {
    const direction = new THREE.Vector3().subVectors(b, a);
    const length = direction.length();

    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 8),
      barkMat
    );
    segment.name = 'ficus_stamm';
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
    segment.castShadow = true;
    segment.receiveShadow = true;
    root.add(segment);
    return segment;
  }

  addTrunkSegment(trunkPoints[0], trunkPoints[1], 0.052, 0.045);
  addTrunkSegment(trunkPoints[1], trunkPoints[2], 0.045, 0.036);
  addTrunkSegment(trunkPoints[2], trunkPoints[3], 0.036, 0.025);

  // ------------------------------------------------------------
  // Astverteilung
  // Die Äste laufen radial in die kompakte, rundliche Krone.
  // ------------------------------------------------------------
  const branchTips = [];
  const branchCount = 16;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < branchCount; i++) {
    const angle = i * goldenAngle + 0.22;
    const tier = i % 6;
    const radialDistance = 0.285 + 0.045 * Math.sin(i * 1.73);
    const tipHeight = 1.22 + tier * 0.072 + 0.028 * Math.sin(i * 0.91);

    const start = new THREE.Vector3(
      0.004 * Math.sin(i * 2.1),
      0.91 + (i % 5) * 0.052,
      0.004 * Math.cos(i * 1.7)
    );

    const tip = new THREE.Vector3(
      Math.cos(angle) * radialDistance,
      tipHeight,
      Math.sin(angle) * radialDistance
    );

    branchTips.push({ start, tip, angle });
  }

  const branchGeometry = new THREE.CylinderGeometry(
    0.009,
    0.017,
    1,
    6
  );

  const branches = new THREE.InstancedMesh(
    branchGeometry,
    barkMat,
    branchCount
  );
  branches.name = 'ficus_aeste';
  branches.castShadow = true;

  for (let i = 0; i < branchCount; i++) {
    const { start, tip } = branchTips[i];

    tempDir.subVectors(tip, start);
    const length = tempDir.length();

    tempPos.copy(start).add(tip).multiplyScalar(0.5);
    tempQuat.setFromUnitVectors(Y_AXIS, tempDir.normalize());
    tempScale.set(1, length, 1);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    branches.setMatrixAt(i, tempMatrix);
  }
  branches.instanceMatrix.needsUpdate = true;
  root.add(branches);

  // ------------------------------------------------------------
  // Geschlossenes, flaches, zugespitztes Ficusblatt
  // Acht Dreiecke pro Blatt; die Geometrie wird anschließend skaliert.
  // ------------------------------------------------------------
  function createLeafGeometry() {
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
      // Basis, Spitze, linker und rechter Rand, Vorder- und Rückengrat
      0.00, -0.50, 0.000,
      0.00, 0.50, 0.000,
      -0.50, 0.02, 0.000,
      0.50, 0.02, 0.000,
      0.00, 0.02, 0.055,
      0.00, 0.02, -0.025,
    ]);

    const indices = [
      0, 2, 4,
      2, 1, 4,
      1, 3, 4,
      3, 0, 4,
      4, 2, 0,
      4, 1, 2,
      4, 3, 1,
      4, 0, 3,
    ];

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  const leavesPerBranch = 13;
  const innerLeafCount = 28;
  const leafCount = branchCount * leavesPerBranch + innerLeafCount;

  const leaves = new THREE.InstancedMesh(
    createLeafGeometry(),
    leafMat,
    leafCount
  );
  leaves.name = 'ficus_blattkrone';
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  const crownPivot = new THREE.Group();
  crownPivot.name = 'ficus_kronen_wippen';
  crownPivot.position.set(0, 1.02, 0);
  crownPivot.add(leaves);
  root.add(crownPivot);

  const crownCenter = new THREE.Vector3(0, 1.39, 0);
  const leafColor = new THREE.Color();
  let leafIndex = 0;

  function limitCrownRadius(position, maximumRadius = 0.395) {
    const radius = Math.hypot(position.x, position.z);
    if (radius > maximumRadius) {
      const factor = maximumRadius / radius;
      position.x *= factor;
      position.z *= factor;
    }
  }

  // Blattbüschel an den Astenden und entlang der oberen Astabschnitte.
  for (let branchIndex = 0; branchIndex < branchTips.length; branchIndex++) {
    const { start, tip, angle } = branchTips[branchIndex];

    for (let j = 0; j < leavesPerBranch; j++) {
      const alongBranch = 0.66 + 0.31 * ((j + 0.5) / leavesPerBranch);
      const localAngle = angle + (j % 3 - 1) * 0.46;
      const spread = 0.045 + 0.065 * ((j * 7 % 5) / 4);

      tempPos.copy(start).lerp(tip, alongBranch);
      tempPos.x += Math.cos(localAngle) * spread;
      tempPos.z += Math.sin(localAngle) * spread;
      tempPos.y += Math.sin(j * 2.17 + branchIndex * 0.73) * 0.065;

      tempPos.y = THREE.MathUtils.clamp(tempPos.y, 1.06, 1.715);
      limitCrownRadius(tempPos);

      tempDir.subVectors(tempPos, crownCenter);
      if (tempDir.lengthSq() < 0.0001) {
        tempDir.set(0, 1, 0);
      }
      tempDir.normalize();

      tempQuat.setFromUnitVectors(Y_AXIS, tempDir);
      tempTwist.setFromAxisAngle(
        Y_AXIS,
        j * 1.31 + branchIndex * 0.79
      );
      tempQuat.multiply(tempTwist);

      const leafLength = 0.105 + 0.022 * Math.abs(Math.sin(j * 0.91 + branchIndex));
      const leafWidth = 0.070 + 0.012 * Math.cos(j * 1.17 + branchIndex * 0.4);

      tempPos.y -= crownPivot.position.y;
      tempScale.set(leafWidth, leafLength, 0.085);

      tempMatrix.compose(tempPos, tempQuat, tempScale);
      leaves.setMatrixAt(leafIndex, tempMatrix);

      const lightness = 0.145 + 0.055 * Math.abs(Math.sin(j * 1.47 + branchIndex * 0.61));
      leafColor.setHSL(0.315 + 0.018 * Math.sin(branchIndex), 0.48, lightness);
      leaves.setColorAt(leafIndex, leafColor);
      leafIndex++;
    }
  }

  // Zusätzliche Blätter füllen die Krone auch im Inneren dichter auf.
  for (let i = 0; i < innerLeafCount; i++) {
    const angle = i * goldenAngle;
    const radius = 0.045 + (i % 7) * 0.025;
    const height = 1.16 + (i % 9) * 0.058;

    tempPos.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    limitCrownRadius(tempPos, 0.24);

    tempDir.set(
      Math.cos(angle) * 0.55,
      0.25 + (i % 4) * 0.12,
      Math.sin(angle) * 0.55
    ).normalize();

    tempQuat.setFromUnitVectors(Y_AXIS, tempDir);
    tempTwist.setFromAxisAngle(Y_AXIS, i * 1.73);
    tempQuat.multiply(tempTwist);

    const leafLength = 0.11 + (i % 3) * 0.012;
    const leafWidth = 0.072 + (i % 4) * 0.006;

    tempPos.y -= crownPivot.position.y;
    tempScale.set(leafWidth, leafLength, 0.085);

    tempMatrix.compose(tempPos, tempQuat, tempScale);
    leaves.setMatrixAt(leafIndex, tempMatrix);

    leafColor.setHSL(0.31 + (i % 5) * 0.006, 0.5, 0.14 + (i % 4) * 0.013);
    leaves.setColorAt(leafIndex, leafColor);
    leafIndex++;
  }

  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) {
    leaves.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------
  // Kollision: nur der Kübel blockiert die Bewegung.
  // ------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.215, 0.56, 12)
  );
  col.name = 'COL_kuebel';
  col.position.set(0, 0.28, 0);
  col.userData.aktiv = true;
  root.add(col);

  // ------------------------------------------------------------
  // Leichtes, gedämpftes Wiegen der Blattkrone
  // ------------------------------------------------------------
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    const targetX =
      Math.sin(zeit * 0.58) * 0.009 +
      Math.sin(zeit * 1.07 + 0.8) * 0.003;

    const targetZ =
      Math.cos(zeit * 0.51 + 0.45) * 0.008 +
      Math.cos(zeit * 0.96) * 0.0025;

    const blend = Math.min(1, step * 3.2);
    crownPivot.rotation.x += (targetX - crownPivot.rotation.x) * blend;
    crownPivot.rotation.z += (targetZ - crownPivot.rotation.z) * blend;
  }

  leaves.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(now - letzte);
    }
    letzte = now;
  };

  // Für optionale manuelle Aktualisierung durch die Spiel-Engine.
  root.userData.update = update;

  // Reine Dekoration: keine erfundenen Benutzen- oder Aktionsfunktionen.
  root.userData.api = {};
  root.userData.actions = [];

  return root;
}

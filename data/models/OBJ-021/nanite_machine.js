// OBJ-021: Naniten-Erzeugungsmaschine
// Großer, flacher achteckiger Forschungstisch mit dunkler Naniten-Masse.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'nanite_machine',
  art: 'Standobjekt',
  masse: '2.50 × 0.88 × 1.50 (B × H × T, m)',
  wohin: 'ATL-015 – Naniten-Labor',
  benutzen: 'INT_naniten → Menü aus userData.actions',
  lichter: 'LAMP_naniten_tisch (eisblau), LAMP_naniten_rim (bernstein)',
  animation: 'Die geschlossene Naniten-Masse wölbt sich weich, Bernstein- und Blauleuchten pulsieren; bei aktivem Replikatorprogramm beschleunigt sich der Zyklus',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'nanite_machine';

  const darkMetal = new THREE.MeshStandardMaterial({
    name: 'nanite_dark_metal',
    color: 0x111820,
    metalness: 0.82,
    roughness: 0.31,
  });
  const darkWood = new THREE.MeshStandardMaterial({
    name: 'nanite_dark_wood',
    color: 0x281b18,
    metalness: 0.18,
    roughness: 0.5,
  });
  const silver = kit('pillar');
  const bronze = kit('copper');
  const deckMaterial = kit('hull');
  const amber = new THREE.MeshStandardMaterial({
    name: 'nanite_amber',
    color: 0x713d0c,
    emissive: 0xffa323,
    emissiveIntensity: 1.25,
    metalness: 0.12,
    roughness: 0.3,
  });
  const blueGlow = new THREE.MeshStandardMaterial({
    name: 'nanite_blue_glow',
    color: 0x07344e,
    emissive: 0x278fff,
    emissiveIntensity: 1.5,
    metalness: 0.08,
    roughness: 0.32,
  });
  const lineMaterial = new THREE.MeshStandardMaterial({
    name: 'nanite_blue_engraving',
    color: 0x244b62,
    emissive: 0x0c2634,
    emissiveIntensity: 0.18,
    metalness: 0.45,
    roughness: 0.4,
  });
  const poolMaterial = new THREE.MeshStandardMaterial({
    name: 'nanite_pool',
    color: 0x030507,
    emissive: 0x07121b,
    emissiveIntensity: 0.14,
    metalness: 0.58,
    roughness: 0.045,
  });

  function octagonShape(halfWidth, halfDepth, chamfer) {
    const points = [
      [-halfWidth + chamfer, halfDepth],
      [halfWidth - chamfer, halfDepth],
      [halfWidth, halfDepth - chamfer],
      [halfWidth, -halfDepth + chamfer],
      [halfWidth - chamfer, -halfDepth],
      [-halfWidth + chamfer, -halfDepth],
      [-halfWidth, -halfDepth + chamfer],
      [-halfWidth, halfDepth - chamfer],
    ];
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    return shape;
  }

  function octagonPath(halfWidth, halfDepth, chamfer, reverse = false) {
    const points = [
      [-halfWidth + chamfer, halfDepth],
      [halfWidth - chamfer, halfDepth],
      [halfWidth, halfDepth - chamfer],
      [halfWidth, -halfDepth + chamfer],
      [halfWidth - chamfer, -halfDepth],
      [-halfWidth + chamfer, -halfDepth],
      [-halfWidth, -halfDepth + chamfer],
      [-halfWidth, halfDepth - chamfer],
    ];
    if (reverse) points.reverse();
    const path = new THREE.Path();
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) path.lineTo(points[i][0], points[i][1]);
    path.closePath();
    return path;
  }

  function horizontalExtrusion(shape, depth) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  // Standfuß: geschlossener achteckiger Sockel.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.81, 0.09, 8, 1, false),
    darkMetal
  );
  base.rotation.y = Math.PI / 8;
  base.position.y = 0.045;
  root.add(base);

  const baseInset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.57, 0.57, 0.028, 8),
    silver
  );
  baseInset.rotation.y = Math.PI / 8;
  baseInset.position.y = 0.101;
  root.add(baseInset);

  // Kompakter, nach oben verjüngter Sockel; endet bündig an der Platte.
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.61, 0.46, 8, 1, false),
    darkWood
  );
  pedestal.rotation.y = Math.PI / 8;
  pedestal.position.y = 0.335;
  root.add(pedestal);

  const pedestalInset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.445, 0.445, 0.035, 8),
    bronze
  );
  pedestalInset.rotation.y = Math.PI / 8;
  pedestalInset.position.y = 0.50;
  root.add(pedestalInset);

  const pedestalCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.43, 0.055, 8),
    darkMetal
  );
  pedestalCap.rotation.y = Math.PI / 8;
  pedestalCap.position.y = 0.5525;
  root.add(pedestalCap);

  // Hauptplatte: exakt 2,50 × 1,50 m, geschlossen extrudiert.
  const top = new THREE.Mesh(
    horizontalExtrusion(octagonShape(1.25, 0.75, 0.28), 0.12),
    darkWood
  );
  top.position.y = 0.58;
  root.add(top);

  const underside = new THREE.Mesh(
    horizontalExtrusion(octagonShape(1.16, 0.66, 0.24), 0.035),
    darkMetal
  );
  underside.position.y = 0.545;
  root.add(underside);

  // Helle technische Nutzfläche mit silbernem Antikerrahmen.
  const deck = new THREE.Mesh(
    horizontalExtrusion(octagonShape(1.075, 0.575, 0.22), 0.022),
    deckMaterial
  );
  deck.position.y = 0.702;
  root.add(deck);

  const rimShape = octagonShape(1.25, 0.75, 0.28);
  rimShape.holes.push(octagonPath(1.075, 0.575, 0.22, true));
  const rim = new THREE.Mesh(
    horizontalExtrusion(rimShape, 0.16),
    darkMetal
  );
  rim.position.y = 0.70;
  root.add(rim);

  // Schmale bronzene Innenkante.
  const innerTrimShape = octagonShape(1.092, 0.592, 0.225);
  innerTrimShape.holes.push(octagonPath(1.075, 0.575, 0.22, true));
  const innerTrim = new THREE.Mesh(
    horizontalExtrusion(innerTrimShape, 0.018),
    bronze
  );
  innerTrim.position.y = 0.848;
  root.add(innerTrim);

  // Silberne Randverkleidung: lange Seiten und abgeschrägte Ecken.
  const trimGeometry = new THREE.BoxGeometry(1, 0.018, 0.035);
  const trim = new THREE.InstancedMesh(trimGeometry, silver, 8);
  trim.name = 'nanite_silberrand';
  trim.castShadow = true;
  trim.receiveShadow = true;
  const dummy = new THREE.Object3D();

  const trimParts = [
    { x: 0, z: 0.735, length: 1.90, angle: 0 },
    { x: 0, z: -0.735, length: 1.90, angle: 0 },
    { x: 1.235, z: 0, length: 0.39, angle: Math.PI / 2 },
    { x: -1.235, z: 0, length: 0.39, angle: Math.PI / 2 },
    { x: 1.112, z: 0.612, length: 0.39, angle: Math.PI / 4 },
    { x: -1.112, z: 0.612, length: 0.39, angle: -Math.PI / 4 },
    { x: 1.112, z: -0.612, length: 0.39, angle: -Math.PI / 4 },
    { x: -1.112, z: -0.612, length: 0.39, angle: Math.PI / 4 },
  ];

  trimParts.forEach((part, index) => {
    dummy.position.set(part.x, 0.861, part.z);
    dummy.rotation.set(0, part.angle, 0);
    dummy.scale.set(part.length, 1, 1);
    dummy.updateMatrix();
    trim.setMatrixAt(index, dummy.matrix);
  });
  trim.instanceMatrix.needsUpdate = true;
  root.add(trim);

  // Bernsteinfarbene Bleiglas-Segmente, bündig in der Außenwand des Rahmens.
  const amberGeometry = new THREE.BoxGeometry(1, 0.072, 0.024);
  const amberSegments = new THREE.InstancedMesh(amberGeometry, amber, 10);
  amberSegments.name = 'nanite_bernsteinglas';
  amberSegments.castShadow = true;

  const amberParts = [];
  for (const z of [0.735, -0.735]) {
    amberParts.push(
      { x: -0.62, z, length: 0.54, angle: 0 },
      { x: 0, z, length: 0.54, angle: 0 },
      { x: 0.62, z, length: 0.54, angle: 0 }
    );
  }
  amberParts.push(
    { x: 1.112, z: 0.612, length: 0.25, angle: Math.PI / 4 },
    { x: -1.112, z: 0.612, length: 0.25, angle: -Math.PI / 4 },
    { x: 1.112, z: -0.612, length: 0.25, angle: -Math.PI / 4 },
    { x: -1.112, z: -0.612, length: 0.25, angle: Math.PI / 4 }
  );

  amberParts.forEach((part, index) => {
    dummy.position.set(part.x, 0.782, part.z);
    dummy.rotation.set(0, part.angle, 0);
    dummy.scale.set(part.length, 1, 1);
    dummy.updateMatrix();
    amberSegments.setMatrixAt(index, dummy.matrix);
  });
  amberSegments.instanceMatrix.needsUpdate = true;
  root.add(amberSegments);

  // Silberne Trennsteg zwischen den Bernsteinglassegmenten.
  const dividerGeometry = new THREE.BoxGeometry(0.014, 0.084, 0.03);
  const dividers = new THREE.InstancedMesh(dividerGeometry, silver, 8);
  dividers.name = 'nanite_segmenttrenner';

  const dividerParts = [
    { x: -0.93, z: 0.735, angle: 0 },
    { x: -0.31, z: 0.735, angle: 0 },
    { x: 0.31, z: 0.735, angle: 0 },
    { x: 0.93, z: 0.735, angle: 0 },
    { x: -0.93, z: -0.735, angle: 0 },
    { x: -0.31, z: -0.735, angle: 0 },
    { x: 0.31, z: -0.735, angle: 0 },
    { x: 0.93, z: -0.735, angle: 0 },
  ];

  dividerParts.forEach((part, index) => {
    dummy.position.set(part.x, 0.782, part.z);
    dummy.rotation.set(0, part.angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dividers.setMatrixAt(index, dummy.matrix);
  });
  dividers.instanceMatrix.needsUpdate = true;
  root.add(dividers);

  // Feine technische Gravuren auf der hellen Nutzfläche.
  const engravingParts = [
    { x: -0.72, z: 0.44, length: 0.52, angle: 0 },
    { x: 0.72, z: 0.44, length: 0.52, angle: 0 },
    { x: -0.72, z: -0.44, length: 0.52, angle: 0 },
    { x: 0.72, z: -0.44, length: 0.52, angle: 0 },
    { x: -0.93, z: 0.10, length: 0.33, angle: Math.PI / 2 },
    { x: 0.93, z: 0.10, length: 0.33, angle: Math.PI / 2 },
    { x: -0.93, z: -0.10, length: 0.33, angle: Math.PI / 2 },
    { x: 0.93, z: -0.10, length: 0.33, angle: Math.PI / 2 },
  ];

  for (const part of engravingParts) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(part.length, 0.007, 0.018),
      lineMaterial
    );
    line.position.set(part.x, 0.727, part.z);
    line.rotation.y = part.angle;
    root.add(line);
  }

  // Bordierte Kreisbögen als Replikationsdiagramme.
  const arcMaterial = lineMaterial.clone();
  arcMaterial.name = 'nanite_replikationsbogen';
  const arcs = [
    { x: -0.76, z: 0.05, radius: 0.145, arc: Math.PI * 1.25 },
    { x: 0.76, z: 0.05, radius: 0.145, arc: Math.PI * 1.25 },
    { x: -0.76, z: -0.29, radius: 0.095, arc: Math.PI * 0.85 },
    { x: 0.76, z: -0.29, radius: 0.095, arc: Math.PI * 0.85 },
  ];
  for (const arc of arcs) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(arc.radius, 0.006, 5, 30, arc.arc),
      arcMaterial
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(arc.x, 0.728, arc.z);
    root.add(mesh);
  }

  // Geschlossene, unregelmäßige Naniten-Masse.
  // Die Oberfläche besteht aus einem triangulierten organischen Gitter.
  const poolSegments = 64;
  const poolRings = 7;
  const poolPositions = [];
  const poolIndices = [];

  const boundaryRadius = (angle) =>
    1 + 0.065 * Math.sin(angle * 3 + 0.4) +
    0.035 * Math.cos(angle * 7 - 0.8) +
    0.02 * Math.sin(angle * 11 + 1.2);

  // Oberflächen-Mittelpunkt.
  poolPositions.push(0, 0.030, 0);

  // Oberflächenringe.
  for (let ring = 1; ring <= poolRings; ring++) {
    const radial = ring / poolRings;
    for (let i = 0; i < poolSegments; i++) {
      const angle = (i / poolSegments) * Math.PI * 2;
      const radius = boundaryRadius(angle) * radial;
      const x = Math.cos(angle) * radius * 0.90;
      const z = Math.sin(angle) * radius * 0.43;
      const y = 0.030 + 0.003 * Math.sin(angle * 4 + ring * 0.8);
      poolPositions.push(x, y, z);
    }
  }

  const topVertexCount = poolPositions.length / 3;

  for (let i = 0; i < poolSegments; i++) {
    const next = (i + 1) % poolSegments;
    poolIndices.push(0, 1 + next, 1 + i);
  }

  for (let ring = 1; ring < poolRings; ring++) {
    const innerStart = 1 + (ring - 1) * poolSegments;
    const outerStart = 1 + ring * poolSegments;
    for (let i = 0; i < poolSegments; i++) {
      const next = (i + 1) % poolSegments;
      const inner = innerStart + i;
      const innerNext = innerStart + next;
      const outer = outerStart + i;
      const outerNext = outerStart + next;
      poolIndices.push(inner, outerNext, outer);
      poolIndices.push(inner, innerNext, outerNext);
    }
  }

  const outerStart = 1 + (poolRings - 1) * poolSegments;
  const bottomBoundaryStart = poolPositions.length / 3;

  for (let i = 0; i < poolSegments; i++) {
    const angle = (i / poolSegments) * Math.PI * 2;
    const radius = boundaryRadius(angle);
    poolPositions.push(
      Math.cos(angle) * radius * 0.90,
      -0.012,
      Math.sin(angle) * radius * 0.43
    );
  }

  const bottomCenter = poolPositions.length / 3;
  poolPositions.push(0, -0.012, 0);

  for (let i = 0; i < poolSegments; i++) {
    const next = (i + 1) % poolSegments;
    poolIndices.push(
      bottomCenter,
      bottomBoundaryStart + i,
      bottomBoundaryStart + next
    );

    const top = outerStart + i;
    const topNext = outerStart + next;
    const bottom = bottomBoundaryStart + i;
    const bottomNext = bottomBoundaryStart + next;
    poolIndices.push(bottom, top, topNext);
    poolIndices.push(bottom, topNext, bottomNext);
  }

  const poolGeometry = new THREE.BufferGeometry();
  poolGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(poolPositions, 3)
  );
  poolGeometry.setIndex(poolIndices);
  poolGeometry.computeVertexNormals();

  const poolBasePositions = new Float32Array(poolPositions);
  const pool = new THREE.Mesh(poolGeometry, poolMaterial);
  pool.name = 'nanitenmasse';
  pool.position.y = 0.72;
  pool.castShadow = true;
  pool.receiveShadow = true;
  root.add(pool);

  // Blaue Statusanzeigen an der vorderen Unterkante; Vorderseite ist +Z.
  const indicatorGeometry = new THREE.BoxGeometry(0.068, 0.026, 0.016);
  const indicators = new THREE.InstancedMesh(indicatorGeometry, blueGlow, 7);
  indicators.name = 'nanite_statusanzeigen';
  for (let i = 0; i < 7; i++) {
    dummy.position.set(-0.27 + i * 0.09, 0.642, 0.741);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    indicators.setMatrixAt(i, dummy.matrix);
  }
  indicators.instanceMatrix.needsUpdate = true;
  root.add(indicators);

  // Kleine bronzene Bedienflächen an den hinteren Ecken.
  for (const side of [-1, 1]) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.012, 0.095),
      bronze
    );
    plate.position.set(side * 0.72, 0.731, 0.465);
    plate.rotation.y = side * 0.16;
    root.add(plate);

    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.012, 0.025),
        i === 1 ? amber : silver
      );
      button.position.set(
        side * 0.72 + (i - 1) * 0.065,
        0.741,
        0.465
      );
      button.rotation.y = side * 0.16;
      root.add(button);
    }
  }

  // Unsichtbarer Kollisionskörper.
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(2.50, 0.88, 1.50)
  );
  collision.name = 'COL_nanitenmaschine';
  collision.position.set(0, 0.44, 0);
  root.add(collision);

  // Benutzen-Punkt vor dem Objekt in bequemer Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_naniten';
  use.position.set(0, 1.02, 1.02);
  use.userData = {
    label: 'Naniten-Erzeugungsmaschine bedienen',
    radius: 0.85,
  };
  root.add(use);

  // Lichtquellen als benannte LAMP-Objekte.
  const lampPool = new THREE.Object3D();
  lampPool.name = 'LAMP_naniten_tisch';
  lampPool.position.set(0, 1.04, 0.08);
  lampPool.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 3.2,
  };
  root.add(lampPool);

  const lampRim = new THREE.Object3D();
  lampRim.name = 'LAMP_naniten_rim';
  lampRim.position.set(0, 0.94, 0.66);
  lampRim.userData = {
    color: '#ffae3b',
    intensity: 6,
    distance: 2.6,
  };
  root.add(lampRim);

  // Zustand und weiche Selbstanimation.
  let running = false;
  let program = 'naniten';
  let time = 0;
  let lastTime = null;

  function update(dt) {
    time += dt;

    const replicator = program === 'replikator';
    const speed = running ? (replicator ? 3.4 : 2.35) : 0.85;
    const pulse = 0.5 + 0.5 * Math.sin(time * speed);
    const blend = Math.min(1, dt * 5);

    const desiredAmber = running
      ? 0.85 + pulse * 1.45
      : 0.52 + pulse * 0.28;
    amber.emissiveIntensity +=
      (desiredAmber - amber.emissiveIntensity) * blend;

    const desiredBlue = running
      ? 1.15 + pulse * (replicator ? 2.0 : 1.25)
      : 0.62 + pulse * 0.32;
    blueGlow.emissiveIntensity +=
      (desiredBlue - blueGlow.emissiveIntensity) * blend;

    poolMaterial.emissiveIntensity +=
      ((running ? 0.20 + pulse * 0.18 : 0.08) -
        poolMaterial.emissiveIntensity) * blend;

    const position = poolGeometry.getAttribute('position');
    const amplitude = running ? (replicator ? 0.015 : 0.009) : 0.0035;

    for (let i = 0; i < topVertexCount; i++) {
      const x = poolBasePositions[i * 3];
      const z = poolBasePositions[i * 3 + 2];
      const radial = Math.min(1, Math.hypot(x / 0.9, z / 0.43));
      const edgeMask = Math.sin(radial * Math.PI * 0.5);
      const wave =
        Math.sin(time * speed * 1.7 + x * 5.2 + z * 7.4) * 0.55 +
        Math.cos(time * speed * 1.1 - x * 8.1 + z * 3.3) * 0.45;
      position.setY(
        i,
        poolBasePositions[i * 3 + 1] + wave * amplitude * edgeMask
      );
    }
    position.needsUpdate = true;
    poolGeometry.computeVertexNormals();

    const desiredScaleX = 1 + (running ? 0.012 : 0.003) * Math.sin(time * speed);
    const desiredScaleZ = 1 + (running ? 0.008 : 0.002) * Math.cos(time * speed * 0.83);
    pool.scale.x += (desiredScaleX - pool.scale.x) * blend;
    pool.scale.z += (desiredScaleZ - pool.scale.z) * blend;
  }

  top.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  const api = {
    start() {
      running = true;
    },
    stop() {
      running = false;
    },
    setProgramm(nextProgram) {
      if (nextProgram === 'naniten' || nextProgram === 'replikator') {
        program = nextProgram;
        running = true;
      }
    },
    get running() {
      return running;
    },
    get program() {
      return program;
    },
    update,
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.animation =
    'Naniten-Oberfläche wölbt sich weich; Leuchten pulsieren im Erzeugungszyklus.';
  root.userData.actions = [
    {
      id: 'start',
      label: 'Naniten-Erzeugungszyklus starten',
      run: () => api.start(),
    },
    {
      id: 'stop',
      label: 'Naniten-Erzeugungszyklus stoppen',
      run: () => api.stop(),
    },
    {
      id: 'replikator',
      label: 'Gefährliches Replikator-Programm aktivieren',
      run: () => api.setProgramm('replikator'),
    },
    {
      id: 'naniten',
      label: 'Standard-Naniten-Programm aktivieren',
      run: () => api.setProgramm('naniten'),
    },
  ];

  return root;
}

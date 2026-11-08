import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({
  name: `KIT_${name}`,
});

export const steckbrief = {
  name: 'city_central_island',
  art: 'Stadt-Außenmodul (statisch)',
  masse: 'Ø 460 m; sichtbare Höhe 31,36 m; Deckoberkante 0 m; Wasserlinie −6 m; Rumpf bis −30 m',
  wohin: 'Stadtzentrum von Atlantis; freier Bereich für den Kontrollturm bis Radius 40 m',
  benutzen: 'keine Benutzen-Punkte; statisches Außenmodul',
  lichter: '6 LAMP_deck (eisblau, dauerhaft an)',
  animation: 'keine',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'city_central_island';

  // Acht Spielmaterialien, keine eigenen Materialien.
  const matFloor = kit('floor');
  const matFloorUpper = kit('floorUpper');
  const matPillar = kit('pillar');
  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');

  const RADIUS = 230;
  const DECK_SEGMENTS = 48;
  const HULL_SEGMENTS = 24;
  const CENTER_CLEARANCE = 40;
  const WATERLINE_Y = -6;
  const HULL_BOTTOM_Y = -30;

  const RAIL_RADIUS = 228;
  const RAIL_HEIGHT = 1.1;

  // Breite ist die tangentiale Breite der Pier-Anschlussöffnung.
  const piers = [
    { angle: 30, width: 95 },
    { angle: 90, width: 150 },
    { angle: 150, width: 95 },
    { angle: 210, width: 150 },
    { angle: 270, width: 95 },
    { angle: 330, width: 150 },
  ];

  // Mittelpunkte der Felder zwischen den sechs Hauptachsen.
  const fieldCenters = [0, 60, 120, 180, 240, 300];

  const compassDirection = (degrees, radius = 1) => {
    const a = THREE.MathUtils.degToRad(degrees);
    return new THREE.Vector3(
      Math.sin(a) * radius,
      0,
      -Math.cos(a) * radius
    );
  };

  function isInPierOpening(x, z) {
    for (const pier of piers) {
      const a = THREE.MathUtils.degToRad(pier.angle);
      const radial = new THREE.Vector2(Math.sin(a), -Math.cos(a));
      const tangent = new THREE.Vector2(Math.cos(a), Math.sin(a));
      const point = new THREE.Vector2(x, z);

      const alongAxis = point.dot(radial);
      const acrossAxis = Math.abs(point.dot(tangent));

      if (alongAxis > 205 && acrossAxis < pier.width * 0.5) {
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Geschlossener Rumpf.
  //
  // Die Deckunterkante überlappt den oberen Rumpf um 0,02 m.
  // Dadurch entsteht kein Spalt und keine konkurrierende Fläche bei y = 0.
  // ------------------------------------------------------------------
  const hullUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(
      RADIUS,
      218,
      5.47,
      HULL_SEGMENTS,
      1,
      false
    ),
    matWallDark
  );
  hullUpper.name = 'rumpf_obere_schragewand';
  hullUpper.position.y = -3.315;
  hullUpper.castShadow = true;
  hullUpper.receiveShadow = true;
  root.add(hullUpper);

  const hullLower = new THREE.Mesh(
    new THREE.CylinderGeometry(
      218,
      76,
      24,
      HULL_SEGMENTS,
      1,
      false
    ),
    matWallDark
  );
  hullLower.name = 'rumpf_schiffskegel';
  hullLower.position.y = -18;
  hullLower.castShadow = true;
  hullLower.receiveShadow = true;
  root.add(hullLower);

  // Einzige sichtbare Grundfläche bei y = 0.
  const deckBase = new THREE.Mesh(
    new THREE.CylinderGeometry(
      RADIUS,
      RADIUS,
      0.6,
      DECK_SEGMENTS,
      1,
      false
    ),
    matFloor
  );
  deckBase.name = 'deck_grundkoerper';
  deckBase.position.y = -0.3;
  deckBase.receiveShadow = true;
  root.add(deckBase);

  // ------------------------------------------------------------------
  // Sektorgeometrie für Plattenfelder und Pier-Anbauplatten.
  //
  // Die Extrusion beginnt bei y = 0. Ihre Oberfläche liegt exakt auf
  // der angegebenen Höhe. Alle radialen Begrenzungen bleiben unter
  // Radius 228 m.
  // ------------------------------------------------------------------
  function makeAngularBandGeometry(
    rInner,
    rOuter,
    centerAngle,
    minRelativeAngle,
    maxRelativeAngle,
    depth,
    steps = 10
  ) {
    const shape = new THREE.Shape();
    const center = THREE.MathUtils.degToRad(centerAngle);
    const minAngle = center + THREE.MathUtils.degToRad(minRelativeAngle);
    const maxAngle = center + THREE.MathUtils.degToRad(maxRelativeAngle);

    for (let i = 0; i <= steps; i++) {
      const a = THREE.MathUtils.lerp(minAngle, maxAngle, i / steps);
      const x = Math.sin(a) * rOuter;
      const y = Math.cos(a) * rOuter;

      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    for (let i = steps; i >= 0; i--) {
      const a = THREE.MathUtils.lerp(minAngle, maxAngle, i / steps);
      shape.lineTo(
        Math.sin(a) * rInner,
        Math.cos(a) * rInner
      );
    }

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 4,
    });

    // X/Y-Erzeugung nach X/Z legen; +Z der Extrusion wird zu +Y.
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }

  // Innere Felder: conservative Winkelgrenze hält mindestens 0,4 m
  // Abstand zu den 18 m breiten Radialwegen.
  const innerFieldHalfAngle = 18.6;

  // Mittlere Felder: ab Radius 128 m ist der Abstand zu den
  // Radialwegen deutlich größer.
  const middleFieldHalfAngle = 25;

  // Äußere Felder müssen zusätzlich die breiten Pier-Mundungen
  // freihalten. Jede Feldzone grenzt an zwei unterschiedlich breite
  // Anschlüsse; deshalb wird konservativ die größere Öffnung berücksichtigt.
  const widestPierHalfAngle = THREE.MathUtils.radToDeg(
    Math.asin(75 / 228)
  );
  const outerFieldHalfAngle = 30 - widestPierHalfAngle;

  const fieldBands = [
    {
      name: 'feld_innen',
      inner: 46,
      outer: 112,
      half: innerFieldHalfAngle,
      material: matFloor,
    },
    {
      name: 'feld_mittel',
      inner: 128,
      outer: 200,
      half: middleFieldHalfAngle,
      material: matFloorUpper,
    },
    {
      name: 'feld_aussen',
      inner: 205.02,
      outer: 228,
      half: outerFieldHalfAngle,
      material: matFloor,
    },
  ];

  for (const centerAngle of fieldCenters) {
    for (const band of fieldBands) {
      const mesh = new THREE.Mesh(
        makeAngularBandGeometry(
          band.inner,
          band.outer,
          centerAngle,
          -band.half,
          band.half,
          0.04
        ),
        band.material
      );
      mesh.name = `deck_${band.name}_${centerAngle}`;
      mesh.receiveShadow = true;
      root.add(mesh);
    }
  }

  // ------------------------------------------------------------------
  // Breite Pier-Anbauplatten.
  //
  // Der 18 m breite Radialweg bleibt in der Mitte frei. Die beiden
  // seitlichen Platten beginnen erst 9 m von der Achse entfernt.
  // Dadurch überlappen sie weder den Weg noch die äußeren Felder.
  // ------------------------------------------------------------------
  const connectorInnerRadius = 208;
  const connectorOuterRadius = 228;
  const pathHalfWidth = 9;

  for (const pier of piers) {
    const connectorMinAngle = THREE.MathUtils.radToDeg(
      Math.asin(pathHalfWidth / connectorInnerRadius)
    );
    const connectorMaxAngle = THREE.MathUtils.radToDeg(
      Math.asin((pier.width * 0.5) / connectorOuterRadius)
    );

    for (const side of [-1, 1]) {
      const minAngle = side < 0
        ? -connectorMaxAngle
        : connectorMinAngle;
      const maxAngle = side < 0
        ? -connectorMinAngle
        : connectorMaxAngle;

      const connector = new THREE.Mesh(
        makeAngularBandGeometry(
          connectorInnerRadius,
          connectorOuterRadius,
          pier.angle,
          minAngle,
          maxAngle,
          0.04,
          6
        ),
        matFloorUpper
      );
      connector.name = `pier_platte_${pier.angle}_${side}`;
      connector.receiveShadow = true;
      root.add(connector);
    }
  }

  // ------------------------------------------------------------------
  // Erhöhter Ringweg bei Radius 120 m, Breite 14 m.
  // Oberkante exakt y = 0,30 m.
  // ------------------------------------------------------------------
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, 127, 0, Math.PI * 2, false);

  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, 113, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const ringGeometry = new THREE.ExtrudeGeometry(ringShape, {
    depth: 0.3,
    bevelEnabled: false,
    curveSegments: 48,
  });
  ringGeometry.rotateX(-Math.PI / 2);

  const ringWalk = new THREE.Mesh(ringGeometry, matPillar);
  ringWalk.name = 'ringweg_r120';
  ringWalk.castShadow = true;
  ringWalk.receiveShadow = true;
  root.add(ringWalk);

  for (const [name, radius] of [
    ['ringweg_kante_innen', 113],
    ['ringweg_kante_aussen', 127],
  ]) {
    const edge = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.045, 5, 72),
      matCopper
    );
    edge.name = name;
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.305;
    edge.castShadow = true;
    root.add(edge);
  }

  const ringMarkers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.03, 3.2),
    matGlow,
    12
  );
  ringMarkers.name = 'ringweg_leuchtmarken';

  const dummy = new THREE.Object3D();

  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI * 2 / 12 + Math.PI / 12;

    dummy.position.set(
      Math.cos(angle) * 120,
      0.31,
      Math.sin(angle) * 120
    );
    dummy.rotation.set(0, Math.PI / 2 - angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ringMarkers.setMatrixAt(i, dummy.matrix);
  }

  ringMarkers.instanceMatrix.needsUpdate = true;
  root.add(ringMarkers);

  // ------------------------------------------------------------------
  // Sechs radiale Hauptwege, 18 m breit.
  // Oberkante exakt y = 0,08 m; Unterkante bei y = 0.
  // ------------------------------------------------------------------
  const radialEnd = 229;
  const radialStart = CENTER_CLEARANCE;
  const radialLength = radialEnd - radialStart;
  const radialCenter = -(radialEnd + radialStart) * 0.5;

  for (const pier of piers) {
    const axis = new THREE.Group();
    axis.name = `hauptachse_${pier.angle}`;
    axis.rotation.y = -THREE.MathUtils.degToRad(pier.angle);

    const path = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.08, radialLength),
      matPillar
    );
    path.name = `radialweg_${pier.angle}`;
    path.position.set(0, 0.04, radialCenter);
    path.castShadow = true;
    path.receiveShadow = true;
    axis.add(path);

    // Schmale Bronzeführungen liegen als flache Aufbauten auf dem Weg.
    for (const side of [-1, 1]) {
      const guide = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.025, 163),
        matCopper
      );
      guide.name = `wegfuehrung_${pier.angle}_${side}`;
      guide.position.set(side * 8.2, 0.0925, -123.5);
      guide.castShadow = true;
      axis.add(guide);
    }

    root.add(axis);
  }

  // ------------------------------------------------------------------
  // Flache Sockel und Treppenstufen.
  // Die unterste Stufe beginnt auf der Plattenoberfläche y = 0,04.
  // ------------------------------------------------------------------
  for (const angle of fieldCenters) {
    const position = compassDirection(angle, 165);

    const lowerStep = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 11, 0.5, 6),
      matWallDark
    );
    lowerStep.name = `sockel_untere_stufe_${angle}`;
    lowerStep.position.set(position.x, 0.29, position.z);
    lowerStep.castShadow = true;
    lowerStep.receiveShadow = true;
    root.add(lowerStep);

    const upperStep = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 9.2, 0.5, 6),
      matPillar
    );
    upperStep.name = `sockel_obere_stufe_${angle}`;
    upperStep.position.set(position.x, 0.79, position.z);
    upperStep.castShadow = true;
    upperStep.receiveShadow = true;
    root.add(upperStep);

    const inset = new THREE.Mesh(
      new THREE.CylinderGeometry(6.4, 6.4, 0.04, 6),
      matCopper
    );
    inset.name = `sockel_akzent_${angle}`;
    inset.position.set(position.x, 1.06, position.z);
    inset.castShadow = true;
    root.add(inset);
  }

  // ------------------------------------------------------------------
  // Rumpfrippen, Fensterbänder und Wasserlinie.
  // ------------------------------------------------------------------
  function hullRadiusAt(y) {
    if (y >= WATERLINE_Y) {
      const t = THREE.MathUtils.clamp(
        (y + 0.58) / (-6.05 + 0.58),
        0,
        1
      );
      return THREE.MathUtils.lerp(RADIUS, 218, t);
    }

    const t = THREE.MathUtils.clamp(
      (y - WATERLINE_Y) / (HULL_BOTTOM_Y - WATERLINE_Y),
      0,
      1
    );
    return THREE.MathUtils.lerp(218, 76, t);
  }

  const ribGeometry = new THREE.CylinderGeometry(0.62, 0.82, 1, 6);
  const ribs = new THREE.InstancedMesh(
    ribGeometry,
    matPillar,
    HULL_SEGMENTS
  );
  ribs.name = 'rumpfrippen';
  ribs.castShadow = true;
  ribs.receiveShadow = true;

  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < HULL_SEGMENTS; i++) {
    const theta = (i + 0.5) * Math.PI * 2 / HULL_SEGMENTS;

    const startRadius = hullRadiusAt(-6.35) + 0.15;
    const endRadius = hullRadiusAt(-28.2) + 0.15;

    const start = new THREE.Vector3(
      Math.sin(theta) * startRadius,
      -6.35,
      Math.cos(theta) * startRadius
    );

    const end = new THREE.Vector3(
      Math.sin(theta) * endRadius,
      -28.2,
      Math.cos(theta) * endRadius
    );

    const direction = end.clone().sub(start);
    const length = direction.length();

    dummy.position.copy(start).add(end).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    dummy.scale.set(1, length, 1);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }

  ribs.instanceMatrix.needsUpdate = true;
  root.add(ribs);

  function makeFacetedBandGeometry(y0, y1, offset, thickness) {
    const positions = [];
    const indices = [];

    const r0 = hullRadiusAt(y0) + offset;
    const r1 = hullRadiusAt(y1) + offset;
    const halfAngle = Math.PI / HULL_SEGMENTS;

    const h0 = r0 * Math.sin(halfAngle);
    const h1 = r1 * Math.sin(halfAngle);
    const d0 = r0 * Math.cos(halfAngle);
    const d1 = r1 * Math.cos(halfAngle);

    positions.push(
      -h0, y0, d0,
       h0, y0, d0,
       h1, y1, d1,
      -h1, y1, d1,

      -h0, y0, d0 - thickness,
       h0, y0, d0 - thickness,
       h1, y1, d1 - thickness,
      -h1, y1, d1 - thickness
    );

    const localIndices = [
      0, 1, 2, 0, 2, 3,
      4, 7, 6, 4, 6, 5,
      0, 4, 5, 0, 5, 1,
      3, 2, 6, 3, 6, 7
    ];

    for (const index of localIndices) indices.push(index);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const glassBands = [
    { name: 'rumpf_fensterband_oben', y0: -1, y1: -2.15 },
    { name: 'rumpf_fensterband_unten', y0: -3.15, y1: -4.45 },
  ];

  for (const band of glassBands) {
    const mesh = new THREE.InstancedMesh(
      makeFacetedBandGeometry(band.y0, band.y1, 0.2, 0.25),
      matGlass,
      HULL_SEGMENTS
    );
    mesh.name = band.name;

    for (let i = 0; i < HULL_SEGMENTS; i++) {
      const angle = (i + 0.5) * Math.PI * 2 / HULL_SEGMENTS;

      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
  }

  const waterline = new THREE.InstancedMesh(
    makeFacetedBandGeometry(-5.35, -5.65, 0.22, 0.14),
    matCopper,
    HULL_SEGMENTS
  );
  waterline.name = 'wasserlinie_bronze';

  for (let i = 0; i < HULL_SEGMENTS; i++) {
    const angle = (i + 0.5) * Math.PI * 2 / HULL_SEGMENTS;

    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    waterline.setMatrixAt(i, dummy.matrix);
  }

  waterline.instanceMatrix.needsUpdate = true;
  root.add(waterline);

  const glowRows = new THREE.InstancedMesh(
    makeFacetedBandGeometry(-3.35, -4.25, 0.38, 0.12),
    matGlow,
    HULL_SEGMENTS / 2
  );
  glowRows.name = 'rumpf_leuchtfenster';

  for (let i = 0; i < HULL_SEGMENTS / 2; i++) {
    const angle = (i * 2 + 0.5) * Math.PI * 2 / HULL_SEGMENTS;

    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(0.52, 1, 1);
    dummy.updateMatrix();
    glowRows.setMatrixAt(i, dummy.matrix);
  }

  glowRows.instanceMatrix.needsUpdate = true;
  root.add(glowRows);

  // ------------------------------------------------------------------
  // Randbrüstung mit exakt 1,10 m Gesamthöhe.
  // Die Brüstung ist an allen sechs Pier-Mundungen unterbrochen.
  // ------------------------------------------------------------------
  const parapetRecords = [];
  const capRecords = [];
  const perimeterSegments = 120;

  for (let i = 0; i < perimeterSegments; i++) {
    const a0 = i * Math.PI * 2 / perimeterSegments;
    const a1 = (i + 1) * Math.PI * 2 / perimeterSegments;

    const p0 = new THREE.Vector3(
      Math.sin(a0) * RAIL_RADIUS,
      0,
      Math.cos(a0) * RAIL_RADIUS
    );

    const p1 = new THREE.Vector3(
      Math.sin(a1) * RAIL_RADIUS,
      0,
      Math.cos(a1) * RAIL_RADIUS
    );

    const mx = (p0.x + p1.x) * 0.5;
    const mz = (p0.z + p1.z) * 0.5;

    if (isInPierOpening(mx, mz)) continue;

    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const length = Math.hypot(dx, dz);
    const rotationY = Math.atan2(dx, dz);

    parapetRecords.push({ x: mx, z: mz, rotationY, length });
    capRecords.push({ x: mx, z: mz, rotationY, length: length + 0.03 });
  }

  const parapet = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    matWall,
    parapetRecords.length
  );
  parapet.name = 'bruestung';
  parapet.castShadow = true;
  parapet.receiveShadow = true;

  const cap = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    matCopper,
    capRecords.length
  );
  cap.name = 'bruestung_kupferkappe';
  cap.castShadow = true;

  for (let i = 0; i < parapetRecords.length; i++) {
    const record = parapetRecords[i];

    dummy.position.set(record.x, 0.5, record.z);
    dummy.rotation.set(0, record.rotationY, 0);
    dummy.scale.set(0.52, 1, record.length);
    dummy.updateMatrix();
    parapet.setMatrixAt(i, dummy.matrix);
  }

  for (let i = 0; i < capRecords.length; i++) {
    const record = capRecords[i];

    dummy.position.set(record.x, 1.05, record.z);
    dummy.rotation.set(0, record.rotationY, 0);
    dummy.scale.set(0.66, 0.1, record.length);
    dummy.updateMatrix();
    cap.setMatrixAt(i, dummy.matrix);
  }

  parapet.instanceMatrix.needsUpdate = true;
  cap.instanceMatrix.needsUpdate = true;
  root.add(parapet, cap);

  // ------------------------------------------------------------------
  // Sechs dauerhaft eingeschaltete Deckleuchten.
  // ------------------------------------------------------------------
  const postMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.18, 1.2, 8),
    matWall,
    fieldCenters.length
  );
  postMesh.name = 'lichtpfosten';
  postMesh.castShadow = true;

  const headMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.5, 0.16, 0.5),
    matGlow,
    fieldCenters.length
  );
  headMesh.name = 'lichtkopf';

  fieldCenters.forEach((angle, index) => {
    const position = compassDirection(angle, 145);

    dummy.position.set(position.x, 0.63, position.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    postMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(position.x, 1.28, position.z);
    dummy.updateMatrix();
    headMesh.setMatrixAt(index, dummy.matrix);

    const lamp = new THREE.Object3D();
    lamp.name = `LAMP_deck_${index}`;
    lamp.position.set(position.x, 1.45, position.z);
    lamp.userData = {
      color: '#6fe3ff',
      intensity: 8,
      distance: 20,
    };
    root.add(lamp);
  });

  postMesh.instanceMatrix.needsUpdate = true;
  headMesh.instanceMatrix.needsUpdate = true;
  root.add(postMesh, headMesh);

  // ------------------------------------------------------------------
  // Kollision: zwölf große, flache Radialboxen.
  //
  // Die innere Kante bleibt außerhalb des freien Turmfelds.
  // Die äußeren Boxecken bleiben unter Radius 230 m.
  // ------------------------------------------------------------------
  const collisionGeometry = new THREE.BoxGeometry(126, 0.3, 180);

  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const position = compassDirection(angle, 130);

    const collision = new THREE.Mesh(collisionGeometry);
    collision.name = `COL_deck_${String(i).padStart(2, '0')}`;
    collision.position.set(position.x, -0.15, position.z);
    collision.rotation.y = -THREE.MathUtils.degToRad(angle);
    root.add(collision);
  }

  // Kollision des erhöhten Ringwegs als zwölf flache Tangentialboxen.
  const ringCollisionGeometry = new THREE.BoxGeometry(14, 0.3, 60.8);

  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI * 2 / 12 + Math.PI / 12;
    const position = new THREE.Vector3(
      Math.cos(angle) * 120,
      0.15,
      Math.sin(angle) * 120
    );

    const collision = new THREE.Mesh(ringCollisionGeometry);
    collision.name = `COL_ringweg_${String(i).padStart(2, '0')}`;
    collision.position.copy(position);
    collision.rotation.y = -angle + Math.PI / 2;
    root.add(collision);
  }

  return root;
}

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_control_tower',
  art: 'Stadt-Außenmodul (statisch)',
  masse: 'ca. 85,3 × 56,9 × 140,0 m (B × T × H); Schaft 44 × 44 m; Kommandoebene 66 × 45 m',
  wohin: 'Stadtdeck, zentrale Außenstadt / erhöhte Kontrollplattform',
  benutzen: 'keine Benutzen-Punkte',
  lichter: 'keine Lichtquellen; nur passive blaue und bernsteinfarbene Fensterleuchten',
  animation: 'keine Animation',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'city_control_tower';

  // Acht Materialien: sieben Spielmaterialien und ein eigenes Buntglas.
  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matHull = kit('hull');
  const matGlass = kit('glass');
  const matGlow = kit('glow');

  const matAmberGlass = new THREE.MeshStandardMaterial({
    name: 'buntglas_bernstein',
    color: 0xc46a2c,
    emissive: 0xff7c24,
    emissiveIntensity: 1.45,
    metalness: 0.08,
    roughness: 0.2,
    transparent: true,
    opacity: 0.94,
  });

  function box(size, position, material, name = null, parent = root) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      material
    );
    mesh.position.set(position[0], position[1], position[2]);
    if (name) mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function collider(size, position, name) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      matWallDark
    );
    mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
    return mesh;
  }

  function instancedBoxes(entries, material, name) {
    if (!entries.length) return null;

    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      material,
      entries.length
    );
    mesh.name = name;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    entries.forEach((entry, index) => {
      position.set(entry.position[0], entry.position[1], entry.position[2]);
      euler.set(0, entry.rotationY || 0, 0);
      quaternion.setFromEuler(euler);
      scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  // Geschlossener Körper zwischen zwei X/Z-Polygonen.
  // Die Polygone laufen gegen den Uhrzeigersinn, damit die Normalen außen zeigen.
  function prism(bottom, top, y0, y1, material, name) {
    const positions = [];
    const count = bottom.length;

    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const b1 = bottom[i];
      const b2 = bottom[j];
      const t1 = top[i];
      const t2 = top[j];

      positions.push(
        b1[0], y0, b1[1],
        t1[0], y1, t1[1],
        b2[0], y0, b2[1],

        t1[0], y1, t1[1],
        t2[0], y1, t2[1],
        b2[0], y0, b2[1]
      );
    }

    const bottomCenter = bottom.reduce(
      (sum, p) => [sum[0] + p[0] / count, sum[1] + p[1] / count],
      [0, 0]
    );
    const topCenter = top.reduce(
      (sum, p) => [sum[0] + p[0] / count, sum[1] + p[1] / count],
      [0, 0]
    );

    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;

      positions.push(
        bottomCenter[0], y0, bottomCenter[1],
        bottom[j][0], y0, bottom[j][1],
        bottom[i][0], y0, bottom[i][1]
      );

      positions.push(
        topCenter[0], y1, topCenter[1],
        top[i][0], y1, top[i][1],
        top[j][0], y1, top[j][1]
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  function scaleFootprint(points, scaleX, scaleZ, centerX = 0, centerZ = 0) {
    return points.map(([x, z]) => [
      centerX + (x - centerX) * scaleX,
      centerZ + (z - centerZ) * scaleZ,
    ]);
  }

  function rotateFootprint(points, angle, centerX, centerZ) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return points.map(([x, z]) => [
      centerX + x * c + z * s,
      centerZ - x * s + z * c
    ]);
  }

  function octagon(centerX, centerZ, halfWidth, halfDepth) {
    const ax = halfWidth * 0.68;
    const az = halfDepth * 0.68;
    return [
      [centerX - ax, centerZ - halfDepth],
      [centerX + ax, centerZ - halfDepth],
      [centerX + halfWidth, centerZ - az],
      [centerX + halfWidth, centerZ + az],
      [centerX + ax, centerZ + halfDepth],
      [centerX - ax, centerZ + halfDepth],
      [centerX - halfWidth, centerZ + az],
      [centerX - halfWidth, centerZ - az],
    ];
  }

  function edgeBandEntries(
    points,
    heights,
    height,
    offset = 0.18,
    lengthScale = 0.9,
    thickness = 0.24
  ) {
    const entries = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const length = Math.hypot(dx, dz) || 1;
      const nx = dz / length;
      const nz = -dx / length;
      const mx = (p1[0] + p2[0]) * 0.5;
      const mz = (p1[1] + p2[1]) * 0.5;

      for (const y of heights) {
        entries.push({
          position: [mx + nx * offset, y, mz + nz * offset],
          rotationY: -Math.atan2(dz, dx),
          scale: [length * lengthScale, height, thickness],
        });
      }
    }

    return entries;
  }

  function cornerRibEntries(points, y, height, width = 1.2, offset = 0) {
    return points.map(([x, z], index) => {
      const previous = points[(index - 1 + points.length) % points.length];
      const next = points[(index + 1) % points.length];
      const dx = next[0] - previous[0];
      const dz = next[1] - previous[1];
      const length = Math.hypot(dx, dz) || 1;
      const nx = dz / length;
      const nz = -dx / length;

      return {
        position: [x + nx * offset, y, z + nz * offset],
        rotationY: -Math.atan2(dz, dx),
        scale: [width, height, width],
      };
    });
  }

  // --------------------------------------------------------------------------
  // 1. Abgefaster Schaft, y = 0 ... 50
  // --------------------------------------------------------------------------
  const shaftBase = octagon(0, 0, 24.5, 24.5);
  const shaftLower = octagon(0, 0, 23.2, 23.2);
  const shaftFootprint = octagon(0, 0, 22, 22);

  prism(shaftBase, shaftLower, 0, 6.2, matWall, 'schacht_broad_foundation');
  prism(shaftLower, shaftFootprint, 6.2, 50, matHull, 'schacht_faceted_body');

  prism(
    scaleFootprint(shaftBase, 1.015, 1.015),
    scaleFootprint(shaftBase, 1.015, 1.015),
    0.2,
    0.85,
    matCopper,
    'foundation_copper_band'
  );

  prism(
    scaleFootprint(shaftLower, 1.025, 1.025),
    scaleFootprint(shaftLower, 1.025, 1.025),
    5.7,
    6.2,
    matCopper,
    'foundation_upper_band'
  );

  prism(
    scaleFootprint(shaftFootprint, 1.025, 1.025),
    scaleFootprint(shaftFootprint, 1.025, 1.025),
    49.35,
    50,
    matCopper,
    'shaft_top_band'
  );

  const shaftBands = edgeBandEntries(
    shaftFootprint,
    [12.5, 22.5, 32.5, 42.5],
    3.1,
    0.22,
    0.9
  );
  instancedBoxes(shaftBands, matGlass, 'shaft_window_bands');

  const shaftRibs = cornerRibEntries(
    shaftFootprint,
    27.5,
    43,
    1.85,
    0.26
  );
  instancedBoxes(shaftRibs, matPillar, 'shaft_corner_ribs');

  // Zusätzliche schlanke, ausschließlich senkrechte Gliederung.
  const shaftDividers = [];
  for (let i = 0; i < shaftFootprint.length; i++) {
    const p1 = shaftFootprint[i];
    const p2 = shaftFootprint[(i + 1) % shaftFootprint.length];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const length = Math.hypot(dx, dz) || 1;

    shaftDividers.push({
      position: [
        (p1[0] + p2[0]) * 0.5 + (dz / length) * 0.24,
        27.5,
        (p1[1] + p2[1]) * 0.5 - (dx / length) * 0.24
      ],
      rotationY: -Math.atan2(dz, dx),
      scale: [0.48, 42.5, 0.56],
    });
  }
  instancedBoxes(shaftDividers, matCopper, 'shaft_vertical_copper_dividers');

  const shaftGlow = [
    { position: [-12, 34.15, 22.28], scale: [2.8, 0.48, 0.2] },
    { position: [-7.5, 34.15, 22.28], scale: [2.8, 0.48, 0.2] },
    { position: [8, 34.15, 22.28], scale: [2.8, 0.48, 0.2] },
    { position: [-9, 24.15, -22.28], scale: [2.5, 0.46, 0.2] },
    { position: [10, 24.15, -22.28], scale: [2.5, 0.46, 0.2] },
  ];
  instancedBoxes(shaftGlow, matGlow, 'shaft_lit_windows');

  collider([49, 6.2, 49], [0, 3.1, 0], 'COL_shaft_foundation');
  collider([45.4, 43.8, 45.4], [0, 27.4, 0], 'COL_shaft_body');

  // --------------------------------------------------------------------------
  // 2. Kommandoebene, y = 50 ... 76
  // Umschlossener Innenraum: x -24 ... +38, z -21 ... +20, y 53 ... 75.
  // --------------------------------------------------------------------------
  const commandBase = [
    [-26, -23], [40, -23], [40, 22], [-26, 22]
  ];
  prism(commandBase, commandBase, 50, 53, matWall, 'command_level_plinth');
  collider([66, 3, 45], [7, 51.5, -0.5], 'COL_command_plinth');

  const wallBottom = 53;
  const wallTop = 76;
  const wallHeight = wallTop - wallBottom;
  const wallCenterY = (wallBottom + wallTop) * 0.5;

  box([1, wallHeight, 43], [-25, wallCenterY, -0.5], matWall, 'command_wall_west');
  collider([1, wallHeight, 43], [-25, wallCenterY, -0.5], 'COL_command_wall_west');

  box([1, wallHeight, 43], [39, wallCenterY, -0.5], matWall, 'command_wall_east');
  collider([1, wallHeight, 43], [39, wallCenterY, -0.5], 'COL_command_wall_east');

  const chamferedCorners = [
    { position: [-24.3, wallCenterY, -21.3], rotationY: Math.PI / 4 },
    { position: [38.3, wallCenterY, -21.3], rotationY: -Math.PI / 4 },
    { position: [38.3, wallCenterY, 20.3], rotationY: Math.PI / 4 },
    { position: [-24.3, wallCenterY, 20.3], rotationY: -Math.PI / 4 }
  ];

  chamferedCorners.forEach((corner, index) => {
    const mesh = box(
      [4.4, wallHeight, 1],
      corner.position,
      matWall,
      `command_chamfered_corner_${index + 1}`
    );
    mesh.rotation.y = corner.rotationY;

    const col = collider(
      [4.4, wallHeight, 1],
      corner.position,
      `COL_command_chamfered_corner_${index + 1}`
    );
    col.rotation.y = corner.rotationY;
  });

  // Südfassade mit großem Buntglasfenster x -6 ... +6, y 54 ... 65.
  const southWalls = [
    { size: [19, wallHeight, 1], pos: [-15.5, wallCenterY, 21] },
    { size: [34, wallHeight, 1], pos: [23, wallCenterY, 21] },
    { size: [12, 1, 1], pos: [0, 53.5, 21] },
    { size: [12, 11, 1], pos: [0, 70.5, 21] }
  ];

  southWalls.forEach((wall, index) => {
    box(wall.size, wall.pos, matWall, `command_south_wall_${index + 1}`);
    collider(wall.size, wall.pos, `COL_command_south_wall_${index + 1}`);
  });

  const amberWindow = box(
    [11.8, 10.8, 0.26],
    [0, 59.5, 21.08],
    matAmberGlass,
    'south_amber_stained_glass_window'
  );
  amberWindow.castShadow = false;

  collider(
    [12, 11, 0.3],
    [0, 59.5, 21.08],
    'COL_south_amber_window'
  );

  box([12.8, 0.72, 0.72], [0, 53.65, 21.28], matCopper, 'amber_frame_bottom');
  box([12.8, 0.72, 0.72], [0, 65.35, 21.28], matCopper, 'amber_frame_top');
  box([0.72, 12.4, 0.72], [-6.35, 59.5, 21.28], matCopper, 'amber_frame_left');
  box([0.72, 12.4, 0.72], [6.35, 59.5, 21.28], matCopper, 'amber_frame_right');
  box([0.3, 11.2, 0.76], [0, 59.5, 21.29], matCopper, 'amber_frame_center');

  for (const x of [-4, -2, 2, 4]) {
    box([0.16, 10.9, 0.72], [x, 59.5, 21.3], matCopper, `amber_mullion_${x}`);
  }

  // Nordfassade mit Balkonöffnung x 0 ... +7, y 58 ... 61.
  const northWalls = [
    { size: [25, wallHeight, 1], pos: [-12.5, wallCenterY, -22] },
    { size: [33, wallHeight, 1], pos: [23.5, wallCenterY, -22] },
    { size: [7, 5, 1], pos: [3.5, 55.5, -22] },
    { size: [7, 15, 1], pos: [3.5, 68.5, -22] }
  ];

  northWalls.forEach((wall, index) => {
    box(wall.size, wall.pos, matWall, `command_north_wall_${index + 1}`);
    collider(wall.size, wall.pos, `COL_command_north_wall_${index + 1}`);
  });

  box([7.8, 0.5, 0.72], [3.5, 57.75, -22.28], matCopper, 'balcony_opening_sill');
  box([7.8, 0.5, 0.72], [3.5, 61.25, -22.28], matCopper, 'balcony_opening_lintel');
  box([0.5, 3.8, 0.72], [-0.25, 59.5, -22.28], matCopper, 'balcony_opening_left');
  box([0.5, 3.8, 0.72], [7.25, 59.5, -22.28], matCopper, 'balcony_opening_right');

  // Umlaufendes, schmales Fensterband oberhalb der Öffnungen.
  box([63.4, 3, 0.24], [7, 69.1, 21.16], matGlass, 'command_glass_band_south');
  box([63.4, 3, 0.24], [7, 69.1, -22.16], matGlass, 'command_glass_band_north');
  box([0.24, 3, 42], [-25.16, 69.1, -0.5], matGlass, 'command_glass_band_west');
  box([0.24, 3, 42], [39.16, 69.1, -0.5], matGlass, 'command_glass_band_east');

  const commandGlow = [
    { position: [-16, 69.1, 21.3], scale: [3.2, 0.5, 0.18] },
    { position: [14, 69.1, 21.3], scale: [2.8, 0.5, 0.18] },
    { position: [30, 69.1, 21.3], scale: [2.2, 0.5, 0.18] },
    { position: [-15, 69.1, -22.3], scale: [3.1, 0.5, 0.18] },
    { position: [18, 69.1, -22.3], scale: [2.7, 0.5, 0.18] }
  ];
  instancedBoxes(commandGlow, matGlow, 'command_lit_window_rows');

  const commandCopper = [
    { position: [7, 50.3, 21.5], scale: [65, 0.8, 0.5] },
    { position: [7, 50.3, -22.5], scale: [65, 0.8, 0.5] },
    { position: [39.5, 50.3, -0.5], scale: [0.5, 0.8, 44] },
    { position: [-25.5, 50.3, -0.5], scale: [0.5, 0.8, 44] },
    { position: [7, 75.45, 21.35], scale: [64, 0.55, 0.45] },
    { position: [7, 75.45, -22.35], scale: [64, 0.55, 0.45] },
    { position: [-24.6, 64.5, 19.7], scale: [0.9, 21, 1] },
    { position: [-24.6, 64.5, -20.7], scale: [0.9, 21, 1] },
    { position: [38.6, 64.5, 19.7], scale: [0.9, 21, 1] },
    { position: [38.6, 64.5, -20.7], scale: [0.9, 21, 1] }
  ];
  instancedBoxes(commandCopper, matCopper, 'command_copper_trim');

  // --------------------------------------------------------------------------
  // 3. Dach y = 76 mit kreisrunder Jumper-Luke, Ø 10 m, x 0 / z +4
  // --------------------------------------------------------------------------
  const roofOutline = [
    [-25.5, -19.5],
    [-22.5, -22.5],
    [36.5, -22.5],
    [39.5, -19.5],
    [39.5, 19.5],
    [36.5, 21.5],
    [-22.5, 21.5],
    [-25.5, 19.5]
  ];

  const roofShape = new THREE.Shape();
  const roofShapePoints = roofOutline
    .map(([x, z]) => [x, -z])
    .reverse();

  roofShape.moveTo(roofShapePoints[0][0], roofShapePoints[0][1]);
  for (let i = 1; i < roofShapePoints.length; i++) {
    roofShape.lineTo(roofShapePoints[i][0], roofShapePoints[i][1]);
  }
  roofShape.closePath();

  const hatchHole = new THREE.Path();
  hatchHole.absarc(0, -4, 5, 0, Math.PI * 2, true);
  roofShape.holes.push(hatchHole);

  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: 1,
    bevelEnabled: false,
    curveSegments: 32,
  });
  roofGeometry.rotateX(-Math.PI / 2);

  const roof = new THREE.Mesh(roofGeometry, matWall);
  roof.name = 'command_roof_with_jumper_hatch';
  roof.position.y = 75;
  roof.castShadow = true;
  roof.receiveShadow = true;
  root.add(roof);

  const hatchDark = new THREE.Mesh(
    new THREE.CylinderGeometry(4.9, 4.9, 0.32, 32),
    matWallDark
  );
  hatchDark.name = 'jumper_hatch_dark_opening';
  hatchDark.position.set(0, 75.55, 4);
  hatchDark.castShadow = false;
  root.add(hatchDark);

  const hatchRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.15, 0.42, 8, 40),
    matCopper
  );
  hatchRing.name = 'jumper_hatch_copper_ring';
  hatchRing.rotation.x = Math.PI / 2;
  hatchRing.position.set(0, 76.04, 4);
  hatchRing.castShadow = true;
  root.add(hatchRing);

  collider([20.3, 1, 44], [-15.35, 75.5, -0.5], 'COL_roof_west');
  collider([34.3, 1, 44], [22.35, 75.5, -0.5], 'COL_roof_east');
  collider([10.4, 1, 21.3], [0, 75.5, -11.85], 'COL_roof_hatch_north');
  collider([10.4, 1, 12.3], [0, 75.5, 15.35], 'COL_roof_hatch_south');

  // --------------------------------------------------------------------------
  // 4. Geschlossener oberer Turmkörper, y = 76 ... 120
  // Nach Norden versetzt: x -15 ... +15, z -22 ... -5.
  // Die Luke bei x 0 / z +4 und ihr Startbereich bleiben frei.
  // --------------------------------------------------------------------------
  const upperBottom = octagon(0, -13.5, 15, 8.5);
  const upperMiddle = octagon(0, -13.5, 14, 8);
  const upperTop = octagon(0, -13.5, 12.5, 7.5);

  prism(upperBottom, upperMiddle, 76, 98, matHull, 'upper_body_lower_solid');
  prism(upperMiddle, upperTop, 98, 112, matHull, 'upper_body_middle_solid');
  prism(upperTop, upperTop, 112, 120, matHull, 'upper_body_upper_solid');

  // Glas ist ausschließlich schmales Band auf der geschlossenen hellen Fassade.
  const upperGlass = [
    ...edgeBandEntries(upperBottom, [82.5, 91.5], 1.65, 0.18, 0.9),
    ...edgeBandEntries(upperMiddle, [104.5], 1.55, 0.18, 0.9),
    ...edgeBandEntries(upperTop, [115.5], 1.45, 0.18, 0.9)
  ];
  instancedBoxes(upperGlass, matGlass, 'upper_body_glass_bands');

  // Massive, senkrechte Rippen. Keine transparenten Fassaden und keine Streben.
  const upperRibs = [
    ...cornerRibEntries(upperBottom, 87, 21.5, 1.05, 0.2),
    ...cornerRibEntries(upperMiddle, 105, 13.5, 0.86, 0.2),
    ...cornerRibEntries(upperTop, 116, 7.5, 0.72, 0.2)
  ];

  for (const x of [-9.5, -3.2, 3.2, 9.5]) {
    upperRibs.push({
      position: [x, 87, -4.77],
      scale: [0.6, 21, 0.62]
    });
    upperRibs.push({
      position: [x, 87, -22.23],
      scale: [0.6, 21, 0.62]
    });
  }

  for (const x of [-7.8, 0, 7.8]) {
    upperRibs.push({
      position: [x, 116, -5.77],
      scale: [0.5, 7.2, 0.56]
    });
    upperRibs.push({
      position: [x, 116, -21.23],
      scale: [0.5, 7.2, 0.56]
    });
  }

  instancedBoxes(upperRibs, matPillar, 'upper_body_vertical_ribs');

  const upperGlow = [
    { position: [-8.5, 91.5, -4.68], scale: [2.5, 0.42, 0.18] },
    { position: [-2.5, 91.5, -4.68], scale: [2.5, 0.42, 0.18] },
    { position: [5.5, 91.5, -4.68], scale: [2.5, 0.42, 0.18] },
    { position: [-6, 104.5, -5.28], scale: [2.2, 0.4, 0.18] },
    { position: [3, 104.5, -5.28], scale: [2.2, 0.4, 0.18] },
    { position: [-4, 115.5, -5.88], scale: [1.9, 0.38, 0.18] }
  ];
  instancedBoxes(upperGlow, matGlow, 'upper_body_lit_windows');

  collider([30, 44, 17], [0, 98, -13.5], 'COL_upper_body');

  // --------------------------------------------------------------------------
  // 5. Geschlossene Hauptkrone, y = 120 ... 140
  // --------------------------------------------------------------------------
  const crownCenterZ = -13.5;
  const crownBottom = [
    [-3.3, crownCenterZ - 3.3],
    [3.3, crownCenterZ - 3.3],
    [3.3, crownCenterZ + 3.3],
    [-3.3, crownCenterZ + 3.3]
  ];
  const crownTop = [
    [-0.3, crownCenterZ - 0.3],
    [0.3, crownCenterZ - 0.3],
    [0.3, crownCenterZ + 0.3],
    [-0.3, crownCenterZ + 0.3]
  ];

  const crownPlatform = octagon(0, crownCenterZ, 7.1, 7.1);
  prism(crownPlatform, crownPlatform, 119.4, 121.6, matWall, 'crown_platform');
  prism(crownBottom, crownTop, 120, 137.5, matHull, 'main_crown_spire');

  const crownCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 6.4, 1.35, 8),
    matCopper
  );
  crownCollar.name = 'crown_copper_collar';
  crownCollar.position.set(0, 121.7, crownCenterZ);
  crownCollar.rotation.y = Math.PI / 8;
  crownCollar.castShadow = true;
  root.add(crownCollar);

  const finLocal = [
    [-0.85, -0.85],
    [0.85, -0.85],
    [0.85, 0.85],
    [-0.85, 0.85]
  ];
  const finTipLocal = [
    [-0.08, -0.08],
    [0.08, -0.08],
    [0.08, 0.08],
    [-0.08, 0.08]
  ];
  const finAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const finHeights = [134, 136, 133.5, 135];

  finAngles.forEach((angle, index) => {
    const radius = 5.5;
    const centerX = Math.cos(angle) * radius;
    const centerZ = crownCenterZ + Math.sin(angle) * radius;
    const bottom = rotateFootprint(finLocal, angle, centerX, centerZ);
    const top = rotateFootprint(finTipLocal, angle, centerX, centerZ);

    prism(
      bottom,
      top,
      121.6,
      finHeights[index],
      index % 2 === 0 ? matWallDark : matPillar,
      `crown_fin_${index + 1}`
    );
  });

  const copperTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.44, 2.5, 6),
    matCopper
  );
  copperTip.name = 'main_antenna_tip';
  copperTip.position.set(0, 138.75, crownCenterZ);
  copperTip.castShadow = true;
  root.add(copperTip);

  collider([14.2, 20, 14.2], [0, 130, crownCenterZ], 'COL_main_crown');

  // --------------------------------------------------------------------------
  // 6. Drei direkt angesetzte Nebentürme mit eigenen spitzen Kronen
  // --------------------------------------------------------------------------
  function createSideTower(name, centerX, centerZ, halfWidth, bodyTop, totalTop) {
    const footprint = octagon(centerX, centerZ, halfWidth, halfWidth);

    prism(
      footprint,
      footprint,
      0,
      bodyTop,
      matHull,
      `${name}_solid_shaft`
    );

    const bandHeights = [];
    for (let y = 12; y < bodyTop - 5; y += 11) {
      bandHeights.push(y);
    }

    const bands = edgeBandEntries(
      footprint,
      bandHeights,
      2.05,
      0.2,
      0.86,
      0.24
    );
    instancedBoxes(bands, matGlass, `${name}_glass_bands`);

    const ribs = cornerRibEntries(
      footprint,
      bodyTop * 0.5,
      bodyTop - 1,
      0.82,
      0.2
    );
    instancedBoxes(ribs, matPillar, `${name}_vertical_ribs`);

    const glow = [];
    for (const y of bandHeights) {
      glow.push({
        position: [centerX - halfWidth * 0.42, y, centerZ + halfWidth + 0.27],
        scale: [2, 0.4, 0.18]
      });
      glow.push({
        position: [centerX + halfWidth * 0.32, y, centerZ - halfWidth - 0.27],
        scale: [1.8, 0.4, 0.18]
      });
    }
    instancedBoxes(glow, matGlow, `${name}_lit_windows`);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(
        halfWidth * 0.7,
        halfWidth * 0.82,
        1.4,
        8
      ),
      matCopper
    );
    collar.name = `${name}_copper_collar`;
    collar.position.set(centerX, bodyTop + 0.7, centerZ);
    collar.rotation.y = Math.PI / 8;
    collar.castShadow = true;
    root.add(collar);

    const spireBottom = scaleFootprint(
      footprint,
      0.72,
      0.72,
      centerX,
      centerZ
    );
    const spireTop = scaleFootprint(
      footprint,
      0.07,
      0.07,
      centerX,
      centerZ
    );

    prism(
      spireBottom,
      spireTop,
      bodyTop + 1.4,
      totalTop - 3.2,
      matWall,
      `${name}_closed_spire`
    );

    const needle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.3, 3.2, 6),
      matCopper
    );
    needle.name = `${name}_antenna`;
    needle.position.set(centerX, totalTop - 1.6, centerZ);
    needle.castShadow = true;
    root.add(needle);

    collider(
      [halfWidth * 2, bodyTop, halfWidth * 2],
      [centerX, bodyTop * 0.5, centerZ],
      `COL_${name}_shaft`
    );
    collider(
      [halfWidth * 1.6, totalTop - bodyTop, halfWidth * 1.6],
      [centerX, (bodyTop + totalTop) * 0.5, centerZ],
      `COL_${name}_crown`
    );
  }

  createSideTower('side_tower_west', -30.5, 4, 4.8, 58, 72);
  createSideTower('side_tower_east', 44, -5, 4.6, 70, 86);
  createSideTower('side_tower_north', -12, -26.8, 4.5, 82, 98);

  // Sichtbare Verbindungsblöcke: keine schwebenden Nebentürme.
  box([1.8, 20, 5], [-25.1, 61, 4], matWall, 'west_tower_connection');
  box([1.8, 22, 5], [39.1, 63, -5], matWall, 'east_tower_connection');
  box([5, 14, 1.8], [-12, 65, -22.1], matWall, 'north_tower_connection');

  return root;
}

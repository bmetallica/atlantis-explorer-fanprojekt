// city_pier_small.js
// Kleiner Atlantis-Pier / Stadtarm.
// Ursprung: Mitte der Pierwurzel, y = 0 = Oberkante Deck.
// Ausdehnung: z = 0 bis z = 280 m, Wasserlinie bei y = -6 m.

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_pier_small',
  art: 'Stadt-Außenmodul (statisch)',
  masse: '95 × 280 × 26 (B × L × T inkl. Aufbauten, m)',
  wohin: 'Stadt-Außenbereich an einer Stadtplattform oder höher gelegenen Küstenplattform',
  benutzen: 'Nicht interaktiv; kein INT-Punkt',
  lichter: 'Keine LAMP-Lichtquellen; sparsame eisblaue Leuchtlinien und Glasbänder',
  animation: 'Statisch, keine Animation',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'city_pier_small';

  const matHull = kit('wallDark');
  const matFloor = kit('floor');
  const matWall = kit('wall');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');

  // Grundriss in X/Z. Die Pierwurzel ist 95 m breit.
  // Ab z = 205 m läuft die Kontur in einen klar abgesetzten dreieckigen Bug.
  const outline = [
    [-47.5, 0],
    [47.5, 0],
    [47.5, 22],
    [30, 205],
    [27, 225],
    [25, 238],
    [12, 264],
    [0, 280],
    [-12, 264],
    [-25, 238],
    [-27, 225],
    [-30, 205],
    [-47.5, 22],
  ];

  function halfWidthAt(z) {
    if (z <= 22) return 47.5;

    if (z <= 205) {
      const t = (z - 22) / 183;
      return 47.5 + (30 - 47.5) * t;
    }

    if (z <= 225) {
      const t = (z - 205) / 20;
      return 30 + (27 - 30) * t;
    }

    if (z <= 238) {
      const t = (z - 225) / 13;
      return 27 + (25 - 27) * t;
    }

    if (z <= 264) {
      const t = (z - 238) / 26;
      return 25 + (12 - 25) * t;
    }

    const t = Math.min(1, (z - 264) / 16);
    return 12 * (1 - t);
  }

  // Extrudiert einen geschlossenen Grundriss nach unten.
  // Die Deckoberseite liegt bei lokal y = 0.
  function makePrism(points, depth, material, name) {
    const shape = new THREE.Shape();

    points.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });

    // X/Y-Fläche nach X/Z legen; die Extrusion zeigt danach nach -Y.
    geometry.rotateX(Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  }

  // Erzeugt einen geschlossenen, konisch geneigten Rumpf.
  // Jeder Ring besteht aus { y, points }; die Punkte liegen in X/Z.
  function makeLoft(rings, material, name) {
    const positions = [];
    const indices = [];
    const count = rings[0].points.length;

    for (const ring of rings) {
      for (const [x, z] of ring.points) {
        positions.push(x, ring.y, z);
      }
    }

    for (let r = 0; r < rings.length - 1; r++) {
      const lower = r * count;
      const upper = (r + 1) * count;

      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        const a = lower + i;
        const b = lower + next;
        const c = upper + i;
        const d = upper + next;

        indices.push(a, c, d);
        indices.push(a, d, b);
      }
    }

    let centerX = 0;
    let centerZ = 0;

    for (const [x, z] of rings[0].points) {
      centerX += x;
      centerZ += z;
    }

    centerX /= count;
    centerZ /= count;

    const bottomCenter = positions.length / 3;
    positions.push(centerX, rings[0].y, centerZ);

    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      indices.push(bottomCenter, i, next);
    }

    const topCenter = positions.length / 3;
    positions.push(centerX, rings[rings.length - 1].y, centerZ);

    const topOffset = (rings.length - 1) * count;

    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      indices.push(topCenter, topOffset + next, topOffset + i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  }

  // Einheitsmaß 1 × 1 × 1 für InstancedMesh-Aufbauten.
  // Die Oberseite liegt bei lokal y = 0, die Unterseite bei y = -1.
  function makeChamferedUnitPrism(chamfer = 0.12) {
    const c = chamfer;
    const shape = new THREE.Shape();

    const points = [
      [-0.5 + c, -0.5],
      [0.5 - c, -0.5],
      [0.5, -0.5 + c],
      [0.5, 0.5 - c],
      [0.5 - c, 0.5],
      [-0.5 + c, 0.5],
      [-0.5, 0.5 - c],
      [-0.5, -0.5 + c],
    ];

    points.forEach(([x, y], i) => {
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 1,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });

    geometry.rotateX(Math.PI / 2);
    return geometry;
  }

  const dummy = new THREE.Object3D();

  function pushMatrix(list, x, y, z, sx = 1, sy = 1, sz = 1, rotY = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    list.push(dummy.matrix.clone());
  }

  function createInstances(geometry, material, matrices, name) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;

    root.add(mesh);
    return mesh;
  }

  // ---------------------------------------------------------------------
  // Rumpf und Deck
  // ---------------------------------------------------------------------

  const hullTop = {
    y: -0.18,
    points: outline.map(([x, z]) => [x, z]),
  };

  // Wasserlinie: Rumpf etwas schmaler als das Deck.
  const hullWater = {
    y: -6,
    points: outline.map(([x, z]) => [x * 0.958, 140 + (z - 140) * 0.995]),
  };

  // Tiefster Rumpfring: stärker verjüngt und nach innen gezogen.
  // Dadurch liegt auch der Bug nicht auf einer senkrechten Schnittfläche.
  const hullBottom = {
    y: -20,
    points: outline.map(([x, z]) => [x * 0.82, 140 + (z - 140) * 0.965]),
  };

  const hull = makeLoft(
    [hullBottom, hullWater, hullTop],
    matHull,
    'rumpf',
  );
  root.add(hull);

  const deck = makePrism(outline, 0.18, matFloor, 'deck');
  deck.position.y = 0;
  root.add(deck);

  // Helle, dreieckige Landefläche im Bug. Sie folgt exakt der Bugkontur.
  const bugOutline = [
    [-25, 238],
    [25, 238],
    [12, 264],
    [0, 280],
    [-12, 264],
  ];

  const bugInlay = makePrism(bugOutline, 0.08, matWall, 'bug_landeflaeche');
  bugInlay.position.y = 0.08;
  root.add(bugInlay);

  // Mittelweg als verjüngte Folge von Instanzen.
  const pathMatrices = [];

  for (let z = 0; z < 276; z += 10) {
    const zEnd = Math.min(z + 10, 276);
    const centerZ = (z + zEnd) / 2;
    const half = halfWidthAt(centerZ);
    const width = Math.max(2.8, Math.min(14, half * 2 - 6));

    pushMatrix(
      pathMatrices,
      0,
      0.055,
      centerZ,
      width,
      0.1,
      zEnd - z + 0.04,
    );
  }

  createInstances(
    new THREE.BoxGeometry(1, 1, 1),
    matWall,
    pathMatrices,
    'mittelweg',
  );

  const mittelstreifen = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.06, 276),
    matCopper,
  );
  mittelstreifen.name = 'mittelstreifen';
  mittelstreifen.position.set(0, 0.13, 138);
  root.add(mittelstreifen);

  // ---------------------------------------------------------------------
  // Flache, gefaste Aufbauten entlang der Längsseiten
  // ---------------------------------------------------------------------

  const gebaeudeDaten = [
    { x: -40, z: 28, w: 8, d: 12, h: 2.8 },
    { x: 39, z: 32, w: 7, d: 10, h: 3.6 },
    { x: -36, z: 62, w: 7, d: 14, h: 4.2 },
    { x: 34, z: 70, w: 9, d: 12, h: 3.0 },
    { x: -31, z: 101, w: 8, d: 13, h: 3.8 },
    { x: 30, z: 110, w: 7, d: 12, h: 4.5 },
    { x: -27, z: 140, w: 8, d: 14, h: 3.2 },
    { x: 26, z: 151, w: 9, d: 13, h: 4.0 },
    { x: -23, z: 180, w: 8, d: 12, h: 3.5 },
    { x: 23, z: 190, w: 7, d: 14, h: 4.3 },
    { x: -19, z: 215, w: 7, d: 10, h: 3.0 },
    { x: 19, z: 220, w: 8, d: 11, h: 3.7 },
  ];

  const glowAuswahl = new Set([1, 4, 6, 9, 11]);

  const bodyMatrices = [];
  const roofMatrices = [];
  const glassMatrices = [];
  const glowMatrices = [];
  const accentMatrices = [];

  for (let index = 0; index < gebaeudeDaten.length; index++) {
    const d = gebaeudeDaten[index];
    const inward = d.x > 0 ? -1 : 1;

    pushMatrix(bodyMatrices, d.x, d.h, d.z, d.w, d.h, d.d);
    pushMatrix(
      roofMatrices,
      d.x,
      d.h + 0.3,
      d.z,
      d.w + 0.8,
      0.3,
      d.d + 0.8,
    );

    // Glasband an der zum Mittelweg gerichteten Seite.
    pushMatrix(
      glassMatrices,
      d.x + inward * (d.w / 2 + 0.03),
      d.h * 0.58,
      d.z,
      0.16,
      1.25,
      d.d * 0.7,
    );

    // Glasband an der Bugseite.
    pushMatrix(
      glassMatrices,
      d.x,
      d.h * 0.58,
      d.z + d.d / 2 + 0.03,
      d.w * 0.68,
      1.05,
      0.16,
    );

    if (glowAuswahl.has(index)) {
      pushMatrix(
        glowMatrices,
        d.x + inward * (d.w / 2 + 0.13),
        d.h * 0.58,
        d.z,
        0.12,
        0.52,
        d.d * 0.52,
      );
    }

    for (const side of [-1, 1]) {
      pushMatrix(
        accentMatrices,
        d.x + side * (d.w / 2 - 0.65),
        d.h * 0.4,
        d.z + d.d / 2 - 0.04,
        0.24,
        d.h * 0.8,
        0.24,
      );
    }
  }

  createInstances(
    makeChamferedUnitPrism(0.12),
    matWall,
    bodyMatrices,
    'flaeche_aufbauten',
  );

  createInstances(
    makeChamferedUnitPrism(0.14),
    matCopper,
    roofMatrices,
    'aufbau_kappen',
  );

  createInstances(
    new THREE.BoxGeometry(1, 1, 1),
    matGlass,
    glassMatrices,
    'aufbau_glasbaender',
  );

  createInstances(
    new THREE.BoxGeometry(1, 1, 1),
    matGlow,
    glowMatrices,
    'aufbau_leuchtfenster',
  );

  createInstances(
    new THREE.BoxGeometry(1, 1, 1),
    matCopper,
    accentMatrices,
    'aufbau_kupfer_akzente',
  );

  // ---------------------------------------------------------------------
  // Runde Aussichtsplattform nahe der Spitze
  // ---------------------------------------------------------------------

  const platformZ = 244;

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 1, 24),
    matFloor,
  );
  platform.name = 'aussichtsplattform';
  platform.position.set(0, 0.5, platformZ);
  root.add(platform);

  const platformUnterbau = new THREE.Mesh(
    new THREE.CylinderGeometry(9.6, 8.55, 1.4, 24),
    matHull,
  );
  platformUnterbau.name = 'plattform_unterbau';
  platformUnterbau.position.set(0, -0.7, platformZ);
  root.add(platformUnterbau);

  const platformRand = new THREE.Mesh(
    new THREE.CylinderGeometry(10.08, 10.08, 0.18, 24),
    matCopper,
  );
  platformRand.name = 'plattform_rand';
  platformRand.position.set(0, 1, platformZ);
  root.add(platformRand);

  const platformGlow = new THREE.Mesh(
    new THREE.TorusGeometry(9.72, 0.08, 5, 28),
    matGlow,
  );
  platformGlow.name = 'plattform_leuchtlinie';
  platformGlow.rotation.x = Math.PI / 2;
  platformGlow.position.set(0, 1.06, platformZ);
  root.add(platformGlow);

  // Fünf Stufen vom Deck auf die erhöhte Plattform.
  for (let i = 0; i < 5; i++) {
    const top = (i + 1) * 0.2;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(8, top, 0.82),
      matWall,
    );
    step.name = 'plattform_stufe';
    step.position.set(0, top / 2, 229.6 + i * 0.8);
    root.add(step);
  }

  // Kleine zentrale Laterne als vertikaler Akzent.
  const laterne = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.35, 3.2, 8),
    matWall,
  );
  laterne.name = 'plattform_laterne';
  laterne.position.set(0, 2.6, platformZ);
  root.add(laterne);

  const laterneGlas = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.08, 1.65, 8),
    matGlass,
  );
  laterneGlas.name = 'laternen_glas';
  laterneGlas.position.set(0, 3.15, platformZ);
  root.add(laterneGlas);

  const laterneKrone = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 1.5, 8),
    matCopper,
  );
  laterneKrone.name = 'laternen_krone';
  laterneKrone.position.set(0, 5.15, platformZ);
  root.add(laterneKrone);

  const laterneLicht = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.2, 0.16),
    matGlow,
  );
  laterneLicht.name = 'laternen_leuchtlinie';
  laterneLicht.position.set(0, 3.15, platformZ + 1.1);
  root.add(laterneLicht);

  // Kleine Bugmarke, die die dreieckige Spitze auch von vorn betont.
  const bugSockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.25, 0.55, 8),
    matCopper,
  );
  bugSockel.name = 'bug_sockel';
  bugSockel.position.set(0, 0.275, 274);
  root.add(bugSockel);

  const bugFinne = new THREE.Mesh(
    new THREE.ConeGeometry(0.85, 2.6, 4),
    matWall,
  );
  bugFinne.name = 'bug_finne';
  bugFinne.position.set(0, 1.75, 274);
  bugFinne.rotation.y = Math.PI / 4;
  root.add(bugFinne);

  const bugLicht = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.75, 0.18),
    matGlow,
  );
  bugLicht.name = 'bug_leuchtlinie';
  bugLicht.position.set(0, 1.3, 274);
  root.add(bugLicht);

  // ---------------------------------------------------------------------
  // Brüstung entlang der gesamten Außenkontur
  // ---------------------------------------------------------------------

  const postMatrices = [];
  const railMatrices = [];
  const panelMatrices = [];
  const plinthMatrices = [];

  function pushPost(list, x, z, baseY = 0) {
    pushMatrix(list, x, baseY + 0.55, z);
  }

  function addRailingSegment(ax, az, bx, bz, baseY = 0) {
    const dx = bx - ax;
    const dz = bz - az;
    const length = Math.hypot(dx, dz);
    const angle = -Math.atan2(dz, dx);

    pushMatrix(
      railMatrices,
      (ax + bx) / 2,
      baseY + 0.96,
      (az + bz) / 2,
      length,
      1,
      1,
      angle,
    );

    pushMatrix(
      panelMatrices,
      (ax + bx) / 2,
      baseY + 0.6,
      (az + bz) / 2,
      length,
      1,
      1,
      angle,
    );

    pushMatrix(
      plinthMatrices,
      (ax + bx) / 2,
      baseY + 0.12,
      (az + bz) / 2,
      length,
      1,
      1,
      angle,
    );
  }

  function addRailingEdge(ax, az, bx, bz, baseY = 0) {
    const dx = bx - ax;
    const dz = bz - az;
    const length = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(length / 12));

    pushPost(postMatrices, ax, az, baseY);

    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;

      const x0 = ax + dx * t0;
      const z0 = az + dz * t0;
      const x1 = ax + dx * t1;
      const z1 = az + dz * t1;

      addRailingSegment(x0, z0, x1, z1, baseY);
      pushPost(postMatrices, x1, z1, baseY);
    }
  }

  // Die Wurzelkante bei z = 0 bleibt frei, damit der Pier
  // bündig an eine Stadtplattform angeschlossen werden kann.
  for (let i = 1; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    addRailingEdge(a[0], a[1], b[0], b[1]);
  }

  const postGeo = new THREE.BoxGeometry(0.28, 1.1, 0.28);
  const railGeo = new THREE.BoxGeometry(1, 0.26, 0.3);
  const panelGeo = new THREE.BoxGeometry(1, 0.72, 0.12);
  const plinthGeo = new THREE.BoxGeometry(1, 0.24, 0.42);

  createInstances(postGeo, matCopper, postMatrices, 'bruestung_pfosten');
  createInstances(railGeo, matCopper, railMatrices, 'bruestung_handlauf');
  createInstances(panelGeo, matGlass, panelMatrices, 'bruestung_glasfelder');
  createInstances(plinthGeo, matHull, plinthMatrices, 'bruestung_sockel');

  // Ringförmige Brüstung auf der Aussichtsplattform.
  // An der Rückseite bleibt eine schmale Zugangsöffnung zum Mittelweg.
  const platformPosts = [];
  const platformRails = [];
  const platformPanels = [];
  const platformSteps = 24;
  const gap = 0.2;

  for (let i = 0; i < platformSteps; i++) {
    const a0 = -Math.PI / 2 + gap + (i / platformSteps) * (Math.PI * 2 - gap * 2);
    const a1 = -Math.PI / 2 + gap + ((i + 1) / platformSteps) * (Math.PI * 2 - gap * 2);

    const ax = Math.cos(a0) * 9.65;
    const az = platformZ + Math.sin(a0) * 9.65;
    const bx = Math.cos(a1) * 9.65;
    const bz = platformZ + Math.sin(a1) * 9.65;

    const dx = bx - ax;
    const dz = bz - az;
    const length = Math.hypot(dx, dz);
    const angle = -Math.atan2(dz, dx);

    pushMatrix(
      platformRails,
      (ax + bx) / 2,
      1.96,
      (az + bz) / 2,
      length,
      1,
      1,
      angle,
    );

    pushMatrix(
      platformPanels,
      (ax + bx) / 2,
      1.6,
      (az + bz) / 2,
      length,
      1,
      1,
      angle,
    );

    pushMatrix(platformPosts, ax, 1.55, az);
  }

  createInstances(postGeo, matCopper, platformPosts, 'plattform_pfosten');
  createInstances(railGeo, matCopper, platformRails, 'plattform_handlauf');
  createInstances(panelGeo, matGlass, platformPanels, 'plattform_glasfelder');

  // ---------------------------------------------------------------------
  // Rumpfrippen, Glasbänder und Wasserlinienakzente
  // ---------------------------------------------------------------------

  function hullFactorAt(y) {
    if (y <= -20) return 0.82;

    if (y <= -6) {
      const t = (y + 20) / 14;
      return 0.82 + (0.958 - 0.82) * t;
    }

    const t = Math.min(1, (y + 6) / 5.82);
    return 0.958 + (1 - 0.958) * t;
  }

  const ribMatrices = [];

  for (const z of [32, 60, 90, 120, 150, 180, 205]) {
    const half = halfWidthAt(z) * hullFactorAt(-10.5);

    for (const side of [-1, 1]) {
      pushMatrix(ribMatrices, side * (half + 0.26), -10.5, z);
    }
  }

  createInstances(
    new THREE.BoxGeometry(1.15, 9, 1.15),
    matWall,
    ribMatrices,
    'rumpfrippen',
  );

  const hullWindowMatrices = [];
  const hullSideAngle = Math.atan((47.5 - 30) / 183);

  for (const z of [35, 65, 95, 125, 155, 185, 202]) {
    const half = halfWidthAt(z) * hullFactorAt(-2.4);

    for (const side of [-1, 1]) {
      pushMatrix(
        hullWindowMatrices,
        side * (half + 0.09),
        -2.4,
        z,
        1,
        1,
        1,
        -side * hullSideAngle,
      );
    }
  }

  createInstances(
    new THREE.BoxGeometry(0.14, 2.3, 6.2),
    matGlass,
    hullWindowMatrices,
    'rumpf_glasbaender',
  );

  const waterAccentMatrices = [];

  for (let z = 30; z <= 200; z += 20) {
    const half = halfWidthAt(z) * hullFactorAt(-6);

    for (const side of [-1, 1]) {
      pushMatrix(
        waterAccentMatrices,
        side * (half + 0.1),
        -6,
        z,
        1,
        1,
        1,
        -side * hullSideAngle,
      );
    }
  }

  createInstances(
    new THREE.BoxGeometry(0.32, 0.28, 4.6),
    matCopper,
    waterAccentMatrices,
    'wasserlinie_akzente',
  );

  // ---------------------------------------------------------------------
  // Deckfugen und sparsame Leuchtmarkierungen
  // ---------------------------------------------------------------------

  const seamMatrices = [];

  for (let z = 12; z <= 244; z += 14) {
    const half = halfWidthAt(z);
    const length = half * 1.84;

    pushMatrix(seamMatrices, 0, 0.13, z, length, 1, 1);
  }

  createInstances(
    new THREE.BoxGeometry(1, 0.035, 0.22),
    matHull,
    seamMatrices,
    'deckfugen',
  );

  const markerMatrices = [];

  for (const z of [35, 75, 115, 155, 195, 225, 258]) {
    pushMatrix(markerMatrices, 0, 0.17, z);
  }

  createInstances(
    new THREE.BoxGeometry(2.2, 0.045, 0.16),
    matGlow,
    markerMatrices,
    'wegmarkierungen',
  );

  // ---------------------------------------------------------------------
  // Kollisionskörper: flache Deckboxen, Aufbauten und Plattform
  // ---------------------------------------------------------------------

  const collisionMaterial = new THREE.MeshBasicMaterial({
    name: 'COL_invisible',
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  function addDeckCollision(name, width, startZ, endZ) {
    const length = endZ - startZ;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.6, length),
      collisionMaterial,
    );
    col.name = name;
    col.position.set(0, -0.3, startZ + length / 2);
    col.userData.aktiv = true;
    root.add(col);
  }

  addDeckCollision('COL_deck_01', 95, 0, 25);
  addDeckCollision('COL_deck_02', 84, 25, 80);
  addDeckCollision('COL_deck_03', 74, 80, 140);
  addDeckCollision('COL_deck_04', 64, 140, 190);
  addDeckCollision('COL_deck_05', 56, 190, 230);
  addDeckCollision('COL_deck_06', 44, 230, 255);
  addDeckCollision('COL_deck_07', 24, 255, 280);

  for (let i = 0; i < gebaeudeDaten.length; i++) {
    const d = gebaeudeDaten[i];
    const totalHeight = d.h + 0.3;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(d.w + 0.8, totalHeight, d.d + 0.8),
      collisionMaterial,
    );
    col.name = `COL_aufbau_${String(i + 1).padStart(2, '0')}`;
    col.position.set(d.x, totalHeight / 2, d.z);
    col.userData.aktiv = true;
    root.add(col);
  }

  const platformCol = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1, 20),
    collisionMaterial,
  );
  platformCol.name = 'COL_aussichtsplattform';
  platformCol.position.set(0, 0.5, platformZ);
  platformCol.userData.aktiv = true;
  root.add(platformCol);

  for (let i = 0; i < 5; i++) {
    const top = (i + 1) * 0.2;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 0.82),
      collisionMaterial,
    );
    col.name = `COL_plattform_stufe_${i + 1}`;
    col.position.set(0, top - 0.25, 229.6 + i * 0.8);
    col.userData.aktiv = true;
    root.add(col);
  }

  // Statisches Modul: keine Aktionen, keine Animation, kein Update-Callback.
  root.userData.actions = [];
  root.userData.api = {};

  return root;
}

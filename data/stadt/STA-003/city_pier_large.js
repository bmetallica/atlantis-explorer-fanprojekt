// city_pier_large.js — Großer Pier / Stadtarm für Stargate Atlantis
// Ursprung: Mitte der Pierwurzel, y = 0 = Oberkante Deck.
// Pierrichtung: +Z, Länge 450 m; Wasserlinie bei y = -6 m.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_pier_large',
  art: 'Stadt-Außenmodell (statisch)',
  masse: '150 × 33 × 450 m (B × H × L); Bugbreite 80 m',
  wohin: 'Als breiter Stadtarm vom Inselrand in das offene Wasser setzen',
  benutzen: 'Kein Benutzen-Punkt; statisches Außenmodell',
  lichter: 'LAMP_landing sowie emissive Randmarker der Landeplattform',
  animation: 'Keine; vollständig statisch',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'city_pier_large';

  const M = {
    hull: kit('hull'),
    wall: kit('wall'),
    wallDark: kit('wallDark'),
    copper: kit('copper'),
    pillar: kit('pillar'),
    glass: kit('glass'),
    glow: kit('glow'),
    floor: kit('floor'),
  };

  // ------------------------------------------------------------
  // Grundriss: 150 m an der Wurzel, Verjüngung auf 80 m,
  // anschließend ein deutlich sichtbarer dreieckiger Bug.
  // ------------------------------------------------------------
  const footprint = [
    { x: -75, z: 0 },
    { x: 75, z: 0 },
    { x: 65, z: 100 },
    { x: 54, z: 220 },
    { x: 46, z: 320 },
    { x: 40, z: 400 },
    { x: 0, z: 450 },
    { x: -40, z: 400 },
    { x: -46, z: 320 },
    { x: -54, z: 220 },
    { x: -65, z: 100 },
  ];

  function scaledPoints(points, sx, sz) {
    return points.map((p) => ({ x: p.x * sx, z: p.z * sz }));
  }

  // Geschlossener Prismenkörper mit Deck-, Boden- und geneigten
  // Seitenflächen.
  function prismGeometry(topPoints, bottomPoints, yTop, yBottom) {
    const contour = topPoints.map((p) => new THREE.Vector2(p.x, p.z));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
    const positions = [];

    const vertex = (p, y) => ({ x: p.x, y, z: p.z });

    const crossY = (a, b, c) => {
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const acx = c.x - a.x;
      const acz = c.z - a.z;
      return abz * acx - abx * acz;
    };

    const pushTriangle = (a, b, c) => {
      positions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
      );
    };

    for (const tri of triangles) {
      let [a, b, c] = tri;
      const pa = vertex(topPoints[a], yTop);
      const pb = vertex(topPoints[b], yTop);
      const pc = vertex(topPoints[c], yTop);

      if (crossY(pa, pb, pc) < 0) [b, c] = [c, b];

      pushTriangle(
        vertex(topPoints[a], yTop),
        vertex(topPoints[b], yTop),
        vertex(topPoints[c], yTop)
      );
    }

    for (const tri of triangles) {
      let [a, b, c] = tri;
      const pa = vertex(bottomPoints[a], yBottom);
      const pb = vertex(bottomPoints[b], yBottom);
      const pc = vertex(bottomPoints[c], yBottom);

      if (crossY(pa, pb, pc) > 0) [b, c] = [c, b];

      pushTriangle(
        vertex(bottomPoints[a], yBottom),
        vertex(bottomPoints[b], yBottom),
        vertex(bottomPoints[c], yBottom)
      );
    }

    for (let i = 0; i < topPoints.length; i++) {
      const j = (i + 1) % topPoints.length;

      const ta = vertex(topPoints[i], yTop);
      const tb = vertex(topPoints[j], yTop);
      const ba = vertex(bottomPoints[i], yBottom);
      const bb = vertex(bottomPoints[j], yBottom);

      const dx = tb.x - ta.x;
      const dz = tb.z - ta.z;
      const length = Math.hypot(dx, dz) || 1;
      const outwardX = dz / length;
      const outwardZ = -dx / length;

      for (const tri of [
        [ta, ba, bb],
        [ta, bb, tb],
      ]) {
        let [a, b, c] = tri;

        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const abz = b.z - a.z;
        const acx = c.x - a.x;
        const acy = c.y - a.y;
        const acz = c.z - a.z;

        const nX = aby * acz - abz * acy;
        const nZ = abx * acy - aby * acx;

        if (nX * outwardX + nZ * outwardZ < 0) [b, c] = [c, b];
        pushTriangle(a, b, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.computeVertexNormals();
    return geometry;
  }

  // Geschlossene, abgeschrägte Box.
  function chamferedBoxGeometry(width, height, depth, bevel = 0.25) {
    const b = Math.min(bevel, width * 0.2, height * 0.2, depth * 0.2);
    const halfX = width / 2 - b;
    const halfY = height / 2 - b;
    const shape = new THREE.Shape();

    shape.moveTo(-halfX, -halfY);
    shape.lineTo(halfX, -halfY);
    shape.lineTo(halfX, halfY);
    shape.lineTo(-halfX, halfY);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - b * 2,
      steps: 1,
      curveSegments: 1,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: b,
      bevelThickness: b,
    });

    geometry.translate(0, 0, -(depth - b * 2) / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  // Horizontaler Balken zwischen zwei Punkten in der X/Z-Ebene.
  function horizontalBeam(name, a, b, width, height, material, y) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, width),
      material
    );
    mesh.name = name;
    mesh.position.set(
      (a.x + b.x) / 2,
      y,
      (a.z + b.z) / 2
    );
    mesh.rotation.y = -Math.atan2(dz, dx);
    root.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------
  // Rumpf: heller, leicht verjüngter Oberteil bis zur Wasserlinie,
  // dunkler Unterteil bis y = -25.
  // ------------------------------------------------------------
  const upperBottom = scaledPoints(footprint, 0.975, 0.990);
  const lowerBottom = scaledPoints(footprint, 0.880, 0.985);

  const hullUpper = new THREE.Mesh(
    prismGeometry(footprint, upperBottom, -0.12, -7),
    M.hull
  );
  hullUpper.name = 'rumpf_oberteil';
  root.add(hullUpper);

  const hullLower = new THREE.Mesh(
    prismGeometry(upperBottom, lowerBottom, -7, -25),
    M.wallDark
  );
  hullLower.name = 'rumpf_unterteil';
  root.add(hullLower);

  const deck = new THREE.Mesh(
    prismGeometry(footprint, footprint, 0, -0.12),
    M.floor
  );
  deck.name = 'deck_haupt';
  root.add(deck);

  const waterlineTop = scaledPoints(footprint, 0.979, 0.993);
  const waterlineBottom = scaledPoints(footprint, 0.979, 0.993);
  const waterlineBand = new THREE.Mesh(
    prismGeometry(waterlineTop, waterlineBottom, -5.5, -6.6),
    M.wall
  );
  waterlineBand.name = 'rumpf_wasserlinie';
  root.add(waterlineBand);

  // ------------------------------------------------------------
  // Breiter Mittelweg von der Wurzel bis vor die Landeplattform.
  // ------------------------------------------------------------
  const centralPath = new THREE.Mesh(
    chamferedBoxGeometry(28, 0.10, 358, 0.025),
    M.wall
  );
  centralPath.name = 'mittelweg';
  centralPath.position.set(0, 0.05, 179);
  root.add(centralPath);

  for (const side of [-1, 1]) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, 358),
      M.copper
    );
    line.name = 'mittelweg_leitlinie';
    line.position.set(side * 14.1, 0.06, 179);
    root.add(line);
  }

  // ------------------------------------------------------------
  // Dreieckiger Bug: eigenständiges helles Feld, kupferne Außenkanten
  // und zwei klare Richtungsmarkierungen.
  // ------------------------------------------------------------
  const bowPoints = [
    { x: -40, z: 400 },
    { x: 40, z: 400 },
    { x: 0, z: 450 },
  ];

  const bowField = new THREE.Mesh(
    prismGeometry(bowPoints, bowPoints, 0.12, 0.015),
    M.pillar
  );
  bowField.name = 'deck_bug_feld';
  root.add(bowField);

  horizontalBeam(
    'bug_kante_links',
    { x: -40, z: 400 },
    { x: 0, z: 450 },
    0.70, 0.18, M.copper, 0.15
  );
  horizontalBeam(
    'bug_kante_rechts',
    { x: 40, z: 400 },
    { x: 0, z: 450 },
    0.70, 0.18, M.copper, 0.15
  );

  horizontalBeam(
    'bug_richtungsmarkierung_links',
    { x: -12, z: 407 },
    { x: 0, z: 421 },
    0.75, 0.13, M.glow, 0.17
  );
  horizontalBeam(
    'bug_richtungsmarkierung_rechts',
    { x: 12, z: 407 },
    { x: 0, z: 421 },
    0.75, 0.13, M.glow, 0.17
  );

  horizontalBeam(
    'bug_mittellinie',
    { x: 0, z: 424 },
    { x: 0, z: 443 },
    0.45, 0.13, M.copper, 0.17
  );

  // ------------------------------------------------------------
  // Seitliche Plattformen mit abgeschrägten Kanten.
  // ------------------------------------------------------------
  const platforms = [
    { x: -39, z: 48, w: 44, d: 58 },
    { x: 39, z: 48, w: 44, d: 58 },
    { x: -34, z: 148, w: 32, d: 62 },
    { x: 34, z: 148, w: 32, d: 62 },
    { x: -28, z: 250, w: 27, d: 60 },
    { x: 28, z: 250, w: 27, d: 60 },
  ];

  platforms.forEach((p, index) => {
    const slab = new THREE.Mesh(
      chamferedBoxGeometry(p.w, 0.40, p.d, 0.30),
      M.pillar
    );
    slab.name = `plattform_${index}`;
    slab.position.set(p.x, 0.20, p.z);
    root.add(slab);

    const outerX = p.x + Math.sign(p.x) * (p.w / 2 - 0.18);
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.24, p.d - 0.6),
      M.copper
    );
    trim.name = `plattform_kante_${index}`;
    trim.position.set(outerX, 0.39, p.z);
    root.add(trim);

    const platformCol = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, 0.40, p.d)
    );
    platformCol.name = `COL_plattform_${index}`;
    platformCol.position.set(p.x, 0.20, p.z);
    root.add(platformCol);
  });

  // ------------------------------------------------------------
  // Flache Aufbauten: Gesamthöhe 2–6 m, dunkles Glasband,
  // abgeschrägte Kanten und kleine vierkantige Kronen.
  // ------------------------------------------------------------
  const buildings = [
    { x: -43, z: 40, w: 17, d: 28, h: 2.2, glow: true },
    { x: 43, z: 42, w: 16, d: 33, h: 4.5, glow: false },
    { x: -37, z: 142, w: 13, d: 27, h: 3.1, glow: false },
    { x: 37, z: 146, w: 14, d: 29, h: 5.4, glow: true },
    { x: -30, z: 244, w: 12, d: 24, h: 5.8, glow: true },
    { x: 30, z: 248, w: 13, d: 25, h: 2.8, glow: false },
  ];

  const platformTop = 0.40;

  buildings.forEach((b, index) => {
    const crownHeight = b.h > 4.5 ? 0.90 : 0.55;
    const roofHeight = 0.30;
    const plinthHeight = Math.min(0.42, b.h * 0.11);
    const bandHeight = Math.max(0.32, b.h * 0.17);
    const upperHeight = Math.max(0.26, b.h * 0.11);
    const lowerHeight = b.h - crownHeight - roofHeight - plinthHeight - bandHeight - upperHeight;
    const bevel = Math.min(0.55, b.w * 0.13);
    const base = platformTop;

    const plinth = new THREE.Mesh(
      chamferedBoxGeometry(b.w + 2, plinthHeight, b.d + 2, 0.24),
      M.wallDark
    );
    plinth.name = `sockel_${index}_plinth`;
    plinth.position.set(b.x, base + plinthHeight / 2, b.z);
    root.add(plinth);

    const lower = new THREE.Mesh(
      chamferedBoxGeometry(b.w, lowerHeight, b.d, bevel),
      M.wall
    );
    lower.name = `sockel_${index}_unterteil`;
    lower.position.set(
      b.x,
      base + plinthHeight + lowerHeight / 2,
      b.z
    );
    root.add(lower);

    const band = new THREE.Mesh(
      chamferedBoxGeometry(b.w + 0.25, bandHeight, b.d + 0.25, 0.10),
      M.glass
    );
    band.name = `sockel_${index}_glasband`;
    band.position.set(
      b.x,
      base + plinthHeight + lowerHeight + bandHeight / 2,
      b.z
    );
    root.add(band);

    const upper = new THREE.Mesh(
      chamferedBoxGeometry(b.w - 0.5, upperHeight, b.d - 0.5, bevel * 0.6),
      M.wall
    );
    upper.name = `sockel_${index}_oberteil`;
    upper.position.set(
      b.x,
      base + plinthHeight + lowerHeight + bandHeight + upperHeight / 2,
      b.z
    );
    root.add(upper);

    const roof = new THREE.Mesh(
      chamferedBoxGeometry(b.w + 0.7, roofHeight, b.d + 0.7, 0.18),
      M.pillar
    );
    roof.name = `sockel_${index}_dach`;
    roof.position.set(
      b.x,
      base + b.h - crownHeight - roofHeight + roofHeight / 2,
      b.z
    );
    root.add(roof);

    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.95, 0.14, b.d + 0.95),
      M.copper
    );
    roofTrim.name = `sockel_${index}_kupferkante`;
    roofTrim.position.set(
      b.x,
      base + b.h - crownHeight - roofHeight + 0.07,
      b.z
    );
    root.add(roofTrim);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 0.95, crownHeight, 4),
      M.copper
    );
    crown.name = `sockel_${index}_krone`;
    crown.rotation.y = Math.PI / 4;
    crown.scale.x = 1.15;
    crown.position.set(
      b.x,
      base + b.h - crownHeight / 2,
      b.z
    );
    root.add(crown);

    if (b.glow) {
      const windowRow = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.64, 0.38, 0.14),
        M.glow
      );
      windowRow.name = `sockel_${index}_leuchtfenster`;
      windowRow.position.set(
        b.x,
        base + plinthHeight + lowerHeight + bandHeight * 0.5,
        b.z + b.d / 2 + 0.17
      );
      root.add(windowRow);

      const sideWindow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.34, b.d * 0.62),
        M.glow
      );
      sideWindow.name = `sockel_${index}_seitenfenster`;
      sideWindow.position.set(
        b.x + Math.sign(b.x) * (b.w / 2 + 0.17),
        base + plinthHeight + lowerHeight + bandHeight * 0.5,
        b.z
      );
      root.add(sideWindow);
    }

    const buildingCol = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 2, b.h, b.d + 2)
    );
    buildingCol.name = `COL_sockel_${index}`;
    buildingCol.position.set(
      b.x,
      base + b.h / 2,
      b.z
    );
    root.add(buildingCol);
  });

  // ------------------------------------------------------------
  // Landeplattform: Kreis Ø 40 m, Mittelpunkt z = 380,
  // genau 1 m über dem Pierdeck.
  // ------------------------------------------------------------
  const landing = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20.35, 1.0, 48),
    M.pillar
  );
  landing.name = 'landeplattform';
  landing.position.set(0, 0.5, 380);
  root.add(landing);

  const landingSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(19.5, 19.5, 0.12, 48),
    M.floor
  );
  landingSurface.name = 'landeplattform_oberflaeche';
  landingSurface.position.set(0, 1.06, 380);
  root.add(landingSurface);

  const landingDarkField = new THREE.Mesh(
    new THREE.CylinderGeometry(12.5, 12.5, 0.13, 40),
    M.wallDark
  );
  landingDarkField.name = 'landeplattform_zentralfeld';
  landingDarkField.position.set(0, 1.12, 380);
  root.add(landingDarkField);

  const landingRing = new THREE.Mesh(
    new THREE.TorusGeometry(16.5, 1.05, 8, 64),
    M.glow
  );
  landingRing.name = 'landeplattform_heller_markierungsring';
  landingRing.rotation.x = Math.PI / 2;
  landingRing.position.set(0, 1.18, 380);
  root.add(landingRing);

  const landingRingCopper = new THREE.Mesh(
    new THREE.TorusGeometry(18.8, 0.48, 8, 64),
    M.copper
  );
  landingRingCopper.name = 'landeplattform_aussenring';
  landingRingCopper.rotation.x = Math.PI / 2;
  landingRing.position.z = 380;
  landingRingCopper.position.set(0, 1.19, 380);
  root.add(landingRingCopper);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(7.2, 0.32, 8, 48),
    M.copper
  );
  innerRing.name = 'landeplattform_innenring';
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.set(0, 1.20, 380);
  root.add(innerRing);

  // Vier breite, kreuzförmige Markierungen im Zentrum.
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.14, 8.5),
      M.glow
    );
    marker.name = `landeplattform_zentrumsmarke_${i}`;
    marker.position.set(
      Math.sin(angle) * 4.5,
      1.22,
      380 + Math.cos(angle) * 4.5
    );
    marker.rotation.y = angle;
    root.add(marker);
  }

  const landingCol = new THREE.Mesh(
    new THREE.BoxGeometry(40, 1.15, 40)
  );
  landingCol.name = 'COL_landeplattform';
  landingCol.position.set(0, 0.575, 380);
  root.add(landingCol);

  const dummy = new THREE.Object3D();

  const lightGeometry = new THREE.CylinderGeometry(0.42, 0.55, 1.05, 8);
  const landingLights = new THREE.InstancedMesh(
    lightGeometry,
    M.glow,
    24
  );
  landingLights.name = 'landeplattform_randlichter';

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * 18.8,
      1.70,
      380 + Math.sin(angle) * 18.8
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    landingLights.setMatrixAt(i, dummy.matrix);
  }

  landingLights.instanceMatrix.needsUpdate = true;
  root.add(landingLights);

  const landingLamp = new THREE.Object3D();
  landingLamp.name = 'LAMP_landing';
  landingLamp.position.set(0, 4.0, 380);
  landingLamp.userData = {
    color: '#6fe3ff',
    intensity: 22,
    distance: 38,
  };
  root.add(landingLamp);

  // ------------------------------------------------------------
  // Drohnen-Startschächte: runde Lukendeckel Ø 4 m.
  // ------------------------------------------------------------
  const hatches = [
    { x: -28, z: 78 },
    { x: 24, z: 188 },
    { x: -21, z: 305 },
  ];

  hatches.forEach((h, index) => {
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.15, 0.5, 24),
      M.wallDark
    );
    lid.name = `drohnenluke_${index}`;
    lid.position.set(h.x, 0.25, h.z);
    root.add(lid);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.28, 8, 28),
      M.copper
    );
    rim.name = `drohnenluke_${index}_rand`;
    rim.rotation.x = Math.PI / 2;
    rim.position.set(h.x, 0.56, h.z);
    root.add(rim);

    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.09, 24),
      M.glow
    );
    center.name = `drohnenluke_${index}_zentrumsmarke`;
    center.position.set(h.x, 0.56, h.z);
    root.add(center);

    const barA = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.10, 0.26),
      M.copper
    );
    barA.name = `drohnenluke_${index}_markierung_a`;
    barA.position.set(h.x, 0.58, h.z);
    root.add(barA);

    const barB = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.10, 3.3),
      M.copper
    );
    barB.name = `drohnenluke_${index}_markierung_b`;
    barB.position.set(h.x, 0.58, h.z);
    root.add(barB);
  });

  // ------------------------------------------------------------
  // Seitliche Brüstung an beiden Längsrändern und am Bug.
  // Gesamthöhe 1,1 m; heller Sockel, dunkle Glasfelder,
  // kupferne Oberholme und regelmäßige Pfosten.
  // ------------------------------------------------------------
  const railPath = [
    { x: -75, z: 0 },
    { x: -65, z: 100 },
    { x: -54, z: 220 },
    { x: -46, z: 320 },
    { x: -40, z: 400 },
    { x: 0, z: 450 },
    { x: 40, z: 400 },
    { x: 46, z: 320 },
    { x: 54, z: 220 },
    { x: 65, z: 100 },
    { x: 75, z: 0 },
  ];

  const postPositions = [];
  const panelInstances = [];
  const postSpacing = 6.5;

  for (let i = 0; i < railPath.length - 1; i++) {
    const a = railPath[i];
    const b = railPath[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(length / postSpacing));

    for (let j = 0; j <= steps; j++) {
      if (i > 0 && j === 0) continue;
      const t = j / steps;
      postPositions.push({
        x: a.x + dx * t,
        z: a.z + dz * t,
      });
    }

    for (let j = 0; j < steps; j++) {
      const t0 = j / steps;
      const t1 = (j + 1) / steps;
      panelInstances.push({
        ax: a.x + dx * t0,
        az: a.z + dz * t0,
        bx: a.x + dx * t1,
        bz: a.z + dz * t1,
      });
    }
  }

  const postGeometry = new THREE.BoxGeometry(0.50, 1.1, 0.50);
  const posts = new THREE.InstancedMesh(
    postGeometry,
    M.pillar,
    postPositions.length
  );
  posts.name = 'brue_stung_pfosten';

  postPositions.forEach((p, index) => {
    dummy.position.set(p.x, 0.55, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(index, dummy.matrix);
  });

  posts.instanceMatrix.needsUpdate = true;
  root.add(posts);

  const panelGeometry = new THREE.BoxGeometry(1, 0.48, 0.20);
  const panels = new THREE.InstancedMesh(
    panelGeometry,
    M.glass,
    panelInstances.length
  );
  panels.name = 'brue_stung_glasfelder';

  panelInstances.forEach((p, index) => {
    const dx = p.bx - p.ax;
    const dz = p.bz - p.az;
    const length = Math.max(0.1, Math.hypot(dx, dz) - 0.90);

    dummy.position.set(
      (p.ax + p.bx) / 2,
      0.69,
      (p.az + p.bz) / 2
    );
    dummy.rotation.set(0, -Math.atan2(dz, dx), 0);
    dummy.scale.set(length, 1, 1);
    dummy.updateMatrix();
    panels.setMatrixAt(index, dummy.matrix);
  });

  panels.instanceMatrix.needsUpdate = true;
  root.add(panels);

  for (let i = 0; i < railPath.length - 1; i++) {
    const a = railPath[i];
    const b = railPath[i + 1];

    horizontalBeam(
      `brue_stung_sockel_${i}`,
      a, b, 0.56, 0.36, M.wall, 0.18
    );
    horizontalBeam(
      `brue_stung_oberholm_${i}`,
      a, b, 0.68, 0.26, M.copper, 1.0
    );

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);

    const railCol = new THREE.Mesh(
      new THREE.BoxGeometry(length, 1.1, 0.36)
    );
    railCol.name = `COL_brue_stung_${i}`;
    railCol.position.set(
      (a.x + b.x) / 2,
      0.55,
      (a.z + b.z) / 2
    );
    railCol.rotation.y = -Math.atan2(dz, dx);
    root.add(railCol);
  }

  // ------------------------------------------------------------
  // Vertikale Rumpfrippen als InstancedMesh.
  // ------------------------------------------------------------
  const halfWidthProfile = [
    { z: 0, half: 75 },
    { z: 100, half: 65 },
    { z: 220, half: 54 },
    { z: 320, half: 46 },
    { z: 400, half: 40 },
    { z: 450, half: 0 },
  ];

  function halfWidthAt(z) {
    for (let i = 0; i < halfWidthProfile.length - 1; i++) {
      const a = halfWidthProfile[i];
      const b = halfWidthProfile[i + 1];
      if (z >= a.z && z <= b.z) {
        const t = (z - a.z) / (b.z - a.z);
        return a.half + (b.half - a.half) * t;
      }
    }
    return 0;
  }

  const ribPositions = [];
  for (let z = 24; z <= 390; z += 18) {
    const half = halfWidthAt(z);
    ribPositions.push({ x: -half + 0.6, z });
    ribPositions.push({ x: half - 0.6, z });
  }

  const ribGeometry = new THREE.BoxGeometry(1.25, 4.4, 1.5);
  const ribs = new THREE.InstancedMesh(
    ribGeometry,
    M.wallDark,
    ribPositions.length
  );
  ribs.name = 'rumpf_vertikalrippen';

  ribPositions.forEach((p, index) => {
    dummy.position.set(p.x, -3.5, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ribs.setMatrixAt(index, dummy.matrix);
  });

  ribs.instanceMatrix.needsUpdate = true;
  root.add(ribs);

  // ------------------------------------------------------------
  // Deckkollision: wenige flache Boxen entlang des Piers.
  // ------------------------------------------------------------
  const deckCollisionSegments = [
    { z0: 0, z1: 80, width: 146 },
    { z0: 80, z1: 160, width: 132 },
    { z0: 160, z1: 240, width: 116 },
    { z0: 240, z1: 320, width: 102 },
    { z0: 320, z1: 400, width: 86 },
    { z0: 400, z1: 425, width: 72 },
    { z0: 425, z1: 448, width: 34 },
    { z0: 448, z1: 450, width: 6 },
  ];

  deckCollisionSegments.forEach((segment, index) => {
    const length = segment.z1 - segment.z0;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(segment.width, 0.30, length)
    );
    col.name = `COL_deck_${index}`;
    col.position.set(
      0,
      -0.15,
      (segment.z0 + segment.z1) / 2
    );
    root.add(col);
  });

  // ------------------------------------------------------------
  // Rumpfkollision als grobe Boxen. Alle COL_-Objekte sind
  // bewusst einfache Boxen.
  // ------------------------------------------------------------
  const hullCollisionSegments = [
    { z0: 0, z1: 80, width: 146 },
    { z0: 80, z1: 160, width: 132 },
    { z0: 160, z1: 240, width: 116 },
    { z0: 240, z1: 320, width: 102 },
    { z0: 320, z1: 400, width: 86 },
    { z0: 400, z1: 430, width: 66 },
    { z0: 430, z1: 450, width: 26 },
  ];

  hullCollisionSegments.forEach((segment, index) => {
    const length = segment.z1 - segment.z0;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(segment.width, 25, length)
    );
    col.name = `COL_rumpf_${index}`;
    col.position.set(
      0,
      -12.5,
      (segment.z0 + segment.z1) / 2
    );
    root.add(col);
  });

  // Statisches Außenmodell ohne Benutzen-Punkte, Aktionen,
  // API-Methoden oder Laufzeitanimation.
  return root;
}

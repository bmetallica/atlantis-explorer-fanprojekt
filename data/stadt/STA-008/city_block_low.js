import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_block_low',
  art: 'Stadt-Außenmodell (statisch)',
  masse: '60 × 30 × 14 (B × T × H, m)',
  wohin: 'Stadtplattform, Hafenumschlag oder großflächige begehbare Stadtterrasse',
  benutzen: 'keine',
  lichter: 'keine',
  animation: 'keine',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'city_block_low';

  // --- Materialien
  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matFloor = kit('floor');
  const matPillar = kit('pillar');

  // --- Geometrie-Helfer

  // Acht Eckpunkte eines abgeschrägten Rechtecks.
  function chamferPoints(width, depth, cut) {
    const x = width / 2;
    const z = depth / 2;
    return [
      new THREE.Vector2(-x + cut, -z),
      new THREE.Vector2(x - cut, -z),
      new THREE.Vector2(x, -z + cut),
      new THREE.Vector2(x, z - cut),
      new THREE.Vector2(x - cut, z),
      new THREE.Vector2(-x + cut, z),
      new THREE.Vector2(-x, z - cut),
      new THREE.Vector2(-x, -z + cut),
    ];
  }

  // Geschlossener Körper mit acht Seiten, optional leicht konischer Krone.
  function chamferedPrism(
    bottomWidth, bottomDepth, bottomCut,
    topWidth, topDepth, topCut,
    y0, y1
  ) {
    const bp = chamferPoints(bottomWidth, bottomDepth, bottomCut);
    const tp = chamferPoints(topWidth, topDepth, topCut);
    const positions = [];

    const bottom = bp.map((p) => new THREE.Vector3(p.x, y0, p.y));
    const top = tp.map((p) => new THREE.Vector3(p.x, y1, p.y));

    function tri(a, b, c) {
      positions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
      );
    }

    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;

      // Seitenflächen, nach außen gerichtet.
      tri(bottom[i], top[i], top[j]);
      tri(bottom[i], top[j], bottom[j]);
    }

    const bottomCenter = new THREE.Vector3(0, y0, 0);
    const topCenter = new THREE.Vector3(0, y1, 0);

    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      tri(topCenter, top[j], top[i]);
      tri(bottomCenter, bottom[i], bottom[j]);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  function instanceAt(mesh, index, x, y, z, sx, sy, sz, rotY = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  // --- Hauptkörper: Sockel, Fassade und abgeschrägte Dachkante

  const sockel = new THREE.Mesh(
    chamferedPrism(60, 30, 4, 60, 30, 4, 0, 0.45),
    matDark
  );
  sockel.name = 'sockel';
  sockel.castShadow = true;
  sockel.receiveShadow = true;
  root.add(sockel);

  const fassade = new THREE.Mesh(
    chamferedPrism(60, 30, 4, 60, 30, 4, 0.45, 13.0),
    matWall
  );
  fassade.name = 'fassade';
  fassade.castShadow = true;
  fassade.receiveShadow = true;
  root.add(fassade);

  const dachkante = new THREE.Mesh(
    chamferedPrism(60, 30, 4, 58, 28, 4.5, 13.0, 13.25),
    matDark
  );
  dachkante.name = 'dachkante';
  dachkante.castShadow = true;
  dachkante.receiveShadow = true;
  root.add(dachkante);

  const dachflaeche = new THREE.Mesh(
    chamferedPrism(58, 28, 4.5, 58, 28, 4.5, 13.25, 13.33),
    matFloor
  );
  dachflaeche.name = 'dachflaeche';
  dachflaeche.receiveShadow = true;
  root.add(dachflaeche);

  // --- Fassadenkanten und Fensterpositionen

  const footprint = chamferPoints(60, 30, 4);

  function edgeData(index) {
    const a = footprint[index];
    const b = footprint[(index + 1) % 8];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const length = Math.hypot(dx, dz);

    return {
      a,
      b,
      dx,
      dz,
      length,
      rotation: -Math.atan2(dz, dx),
      // Rechte Normale zeigt bei dieser Eckpunktfolge nach außen.
      normalX: dz / length,
      normalZ: -dx / length
    };
  }

  const edges = footprint.map((_, index) => edgeData(index));

  function panelCount(edge) {
    if (edge.length > 40) return 14;
    if (edge.length > 15) return 6;
    return 1;
  }

  function pointOnEdge(edge, t, offset) {
    return {
      x: edge.a.x + edge.dx * t + edge.normalX * offset,
      z: edge.a.y + edge.dz * t + edge.normalZ * offset
    };
  }

  // Zwei durchgehende Fensterbänder aus dunkelblauem Glas.
  const windowDescriptions = [];
  const glowDescriptions = [];
  const bandCenters = [4.05, 8.85];
  const bandHeight = 1.75;

  for (const y of bandCenters) {
    for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
      const edge = edges[edgeIndex];
      const count = panelCount(edge);
      const width = edge.length / count - (count > 1 ? 0.1 : 0.2);

      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const p = pointOnEdge(edge, t, 0.035);

        const description = {
          x: p.x,
          y,
          z: p.z,
          width,
          rotation: edge.rotation
        };

        windowDescriptions.push(description);

        // Sparsame helle Fensterreihen an den beiden langen Fassaden.
        const leuchtet =
          (edgeIndex === 0 && i % 5 === 1) ||
          (edgeIndex === 4 && i % 6 === 2);

        if (leuchtet) glowDescriptions.push(description);
      }
    }
  }

  const glass = new THREE.InstancedMesh(
    unitBox,
    matGlass,
    windowDescriptions.length
  );
  glass.name = 'INST_fensterbaender';
  glass.castShadow = false;
  glass.receiveShadow = true;

  windowDescriptions.forEach((w, i) => {
    instanceAt(glass, i, w.x, w.y, w.z, w.width, bandHeight, 0.12, w.rotation);
  });
  glass.instanceMatrix.needsUpdate = true;
  root.add(glass);

  const glowWindows = new THREE.InstancedMesh(
    unitBox,
    matGlow,
    glowDescriptions.length
  );
  glowWindows.name = 'INST_leuchtfenster';
  glowWindows.castShadow = false;
  glowWindows.receiveShadow = false;

  glowDescriptions.forEach((w, i) => {
    instanceAt(glowWindows, i, w.x, w.y, w.z, w.width, bandHeight, 0.15, w.rotation);
  });
  glowWindows.instanceMatrix.needsUpdate = true;
  root.add(glowWindows);

  // --- Vertikale Fassadenrippen auf den geraden Seiten

  const ribDescriptions = [];

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
    const edge = edges[edgeIndex];
    const count = edge.length > 40 ? 13 : edge.length > 15 ? 5 : 0;

    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const p = pointOnEdge(edge, t, 0.12);
      ribDescriptions.push({
        x: p.x,
        z: p.z,
        rotation: edge.rotation
      });
    }
  }

  const ribs = new THREE.InstancedMesh(
    unitBox,
    matDark,
    ribDescriptions.length
  );
  ribs.name = 'INST_fassadenrippen';
  ribs.castShadow = true;
  ribs.receiveShadow = true;

  ribDescriptions.forEach((r, i) => {
    instanceAt(
      ribs,
      i,
      r.x,
      6.55,
      r.z,
      0.34,
      12.3,
      0.36,
      r.rotation
    );
  });
  ribs.instanceMatrix.needsUpdate = true;
  root.add(ribs);

  // --- Helle vertikale Eckpfeiler an den abgeschrägten Fassaden

  const cornerPillars = [];

  for (let edgeIndex = 1; edgeIndex < edges.length; edgeIndex += 2) {
    const edge = edges[edgeIndex];
    const p = pointOnEdge(edge, 0.5, 0.04);
    cornerPillars.push({
      x: p.x,
      z: p.z,
      rotation: edge.rotation
    });
  }

  const pillars = new THREE.InstancedMesh(
    unitBox,
    matPillar,
    cornerPillars.length
  );
  pillars.name = 'INST_eckpfeiler';
  pillars.castShadow = true;
  pillars.receiveShadow = true;

  cornerPillars.forEach((p, i) => {
    instanceAt(pillars, i, p.x, 6.55, p.z, 0.68, 12.3, 0.68, p.rotation);
  });
  pillars.instanceMatrix.needsUpdate = true;
  root.add(pillars);

  // --- Schmale bronzene Horizontalleisten als Rahmen der Fensterbänder

  const trimDescriptions = [];
  const trimHeights = [3.05, 5.05, 7.85, 9.85];

  for (const y of trimHeights) {
    for (const edge of edges) {
      const p = pointOnEdge(edge, 0.5, 0.12);
      trimDescriptions.push({
        x: p.x,
        y,
        z: p.z,
        length: edge.length,
        rotation: edge.rotation
      });
    }
  }

  const trims = new THREE.InstancedMesh(
    unitBox,
    matCopper,
    trimDescriptions.length
  );
  trims.name = 'INST_bronze_leisten';
  trims.castShadow = true;
  trims.receiveShadow = true;

  trimDescriptions.forEach((t, i) => {
    instanceAt(trims, i, t.x, t.y, t.z, t.length + 0.08, 0.14, 0.18, t.rotation);
  });
  trims.instanceMatrix.needsUpdate = true;
  root.add(trims);

  // --- Begehbare Dachfläche, Brüstung und bronzene Abdeckung

  const roofPolygon = chamferPoints(58, 28, 4.5);
  const parapetParts = [];

  for (let i = 0; i < roofPolygon.length; i++) {
    const a = roofPolygon[i];
    const b = roofPolygon[(i + 1) % roofPolygon.length];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const length = Math.hypot(dx, dz);

    parapetParts.push({
      x: (a.x + b.x) / 2,
      z: (a.y + b.y) / 2,
      length,
      rotation: -Math.atan2(dz, dx)
    });
  }

  const parapet = new THREE.InstancedMesh(
    unitBox,
    matWall,
    parapetParts.length
  );
  parapet.name = 'INST_dachbrüstung';
  parapet.castShadow = true;
  parapet.receiveShadow = true;

  parapetParts.forEach((p, i) => {
    instanceAt(parapet, i, p.x, 13.64, p.z, p.length + 0.12, 0.72, 0.3, p.rotation);
  });
  parapet.instanceMatrix.needsUpdate = true;
  root.add(parapet);

  const roofCopings = new THREE.InstancedMesh(
    unitBox,
    matCopper,
    parapetParts.length
  );
  roofCopings.name = 'INST_dachabdeckung';
  roofCopings.castShadow = true;
  roofCopings.receiveShadow = true;

  parapetParts.forEach((p, i) => {
    instanceAt(roofCopings, i, p.x, 13.94, p.z, p.length + 0.16, 0.12, 0.38, p.rotation);
  });
  roofCopings.instanceMatrix.needsUpdate = true;
  root.add(roofCopings);

  // --- Kleine Dachaufbauten

  const techblock = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.62, 3),
    matDark
  );
  techblock.name = 'dach_technikblock_a';
  techblock.position.set(-15, 13.64, 5);
  techblock.castShadow = true;
  techblock.receiveShadow = true;
  root.add(techblock);

  const controlBlock = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.55, 2.2),
    matWall
  );
  controlBlock.name = 'dach_steuerblock';
  controlBlock.position.set(10, 13.605, -5);
  controlBlock.castShadow = true;
  controlBlock.receiveShadow = true;
  root.add(controlBlock);

  const ventGeometry = new THREE.CylinderGeometry(0.55, 0.7, 0.52, 10);
  const ventA = new THREE.Mesh(ventGeometry, matCopper);
  ventA.name = 'dach_luefter_a';
  ventA.position.set(-4, 13.59, -6);
  ventA.castShadow = true;
  ventA.receiveShadow = true;
  root.add(ventA);

  const ventB = new THREE.Mesh(ventGeometry, matCopper);
  ventB.name = 'dach_luefter_b';
  ventB.position.set(17, 13.59, 6);
  ventB.castShadow = true;
  ventB.receiveShadow = true;
  root.add(ventB);

  const skylight = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.22, 2.4),
    matGlass
  );
  skylight.name = 'dach_skyline';
  skylight.position.set(0, 13.44, 7);
  skylight.castShadow = false;
  skylight.receiveShadow = true;
  root.add(skylight);

  // --- Kollision: Gebäudekörper und flache begehbare Dachbox

  const colBody = new THREE.Mesh(
    new THREE.BoxGeometry(60, 13.25, 30),
    matDark
  );
  colBody.name = 'COL_gebaeude';
  colBody.position.set(0, 6.625, 0);
  root.add(colBody);

  const colRoof = new THREE.Mesh(
    new THREE.BoxGeometry(57.5, 0.12, 27.5),
    matFloor
  );
  colRoof.name = 'COL_dach';
  colRoof.position.set(0, 13.27, 0);
  root.add(colRoof);

  return root;
}

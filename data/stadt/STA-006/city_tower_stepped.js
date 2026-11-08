// city_tower_stepped.js
// Gestuftes Hochhaus der Atlantis-Stadt, statisches Außenmodul.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_tower_stepped',
  art: 'Stadt-Außenmodul',
  masse: '36 × 55 × 36 m (B × H × T)',
  wohin: 'Stadtplatzierung / Außenbereich',
  benutzen: 'keine Benutzen-Punkte; statisches Architekturmodul',
  lichter: 'keine LAMP_-Lichtquellen; sparsame KIT_glow-Fenster und Antennenlicht',
  animation: 'keine Animation',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'city_tower_stepped';

  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matFloor = kit('floor');
  const matPillar = kit('pillar');

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  function setInstance(mesh, index, x, y, z, sx, sy, sz, rotY = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  // Geschlossener, achteckiger Grundkörper. Die Ecken sind abgeschrägt,
  // sodass keine runden Bögen oder instabilen Eckpyramiden entstehen.
  function octagonGeometry(width, depth, cut, height) {
    const hw = width * 0.5;
    const hd = depth * 0.5;
    const shape = new THREE.Shape();

    shape.moveTo(-hw + cut, -hd);
    shape.lineTo(hw - cut, -hd);
    shape.lineTo(hw, -hd + cut);
    shape.lineTo(hw, hd - cut);
    shape.lineTo(hw - cut, hd);
    shape.lineTo(-hw + cut, hd);
    shape.lineTo(-hw, hd - cut);
    shape.lineTo(-hw, -hd + cut);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1,
    });

    // Das extrudierte Profil liegt anschließend in der X/Z-Ebene,
    // die Höhe verläuft von y = 0 bis y = height.
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  // Die acht Außenseiten eines achteckigen Körpers.
  // nx/nz ist die nach außen zeigende Normale.
  function facadeEdges(width, depth, cut) {
    const hw = width * 0.5;
    const hd = depth * 0.5;
    const diag = Math.SQRT1_2;
    const diagonalLength = cut * Math.SQRT2;

    return [
      { x: 0, z: -hd, nx: 0, nz: -1, len: width - cut * 2 },
      { x: hw - cut * 0.5, z: -hd + cut * 0.5, nx: diag, nz: -diag, len: diagonalLength },
      { x: hw, z: 0, nx: 1, nz: 0, len: depth - cut * 2 },
      { x: hw - cut * 0.5, z: hd - cut * 0.5, nx: diag, nz: diag, len: diagonalLength },
      { x: 0, z: hd, nx: 0, nz: 1, len: width - cut * 2 },
      { x: -hw + cut * 0.5, z: hd - cut * 0.5, nx: -diag, nz: diag, len: diagonalLength },
      { x: -hw, z: 0, nx: -1, nz: 0, len: depth - cut * 2 },
      { x: -hw + cut * 0.5, z: -hd + cut * 0.5, nx: -diag, nz: -diag, len: diagonalLength },
    ];
  }

  function edgeRotation(edge) {
    // Die lokale Z-Achse der Instanz muss zur Außennormale zeigen.
    return Math.atan2(edge.nx, edge.nz);
  }

  // Grundplatte: geschlossenes, dunkles Fundament von y = 0 bis y = 0,25.
  const foundation = new THREE.Mesh(
    octagonGeometry(36, 36, 1.4, 0.25),
    matDark
  );
  foundation.position.y = 0;
  foundation.name = 'fundament';
  foundation.receiveShadow = true;
  root.add(foundation);

  // Vier kurze kupferne Eckpfeiler auf dem Fundament.
  const basePylons = new THREE.InstancedMesh(unitBox, matCopper, 4);
  basePylons.name = 'fundamenteckpfeiler';
  basePylons.castShadow = true;
  basePylons.receiveShadow = true;

  let basePylonIndex = 0;
  for (const x of [-16.9, 16.9]) {
    for (const z of [-16.9, 16.9]) {
      setInstance(basePylons, basePylonIndex++, x, 0.95, z, 0.32, 1.4, 0.32);
    }
  }
  basePylons.instanceMatrix.needsUpdate = true;
  root.add(basePylons);

  // Vier geschlossene Stufen mit Terrassen. Jede Terrasse ist für sich
  // begehbar; die nächste Stufe sitzt direkt auf der Deckplatte.
  const tiers = [
    { width: 35.6, depth: 35.6, cut: 1.3, y0: 0.25, y1: 14.2, rows: 4, lit: 3 },
    { width: 28.8, depth: 28.8, cut: 1.2, y0: 14.45, y1: 27.0, rows: 4, lit: 4 },
    { width: 22.0, depth: 22.0, cut: 1.1, y0: 27.25, y1: 38.2, rows: 3, lit: 3 },
    { width: 15.2, depth: 15.2, cut: 1.0, y0: 38.45, y1: 48.3, rows: 3, lit: 2 },
  ];

  tiers.forEach((tier, tierIndex) => {
    const height = tier.y1 - tier.y0;
    const centerY = (tier.y0 + tier.y1) * 0.5;
    const edges = facadeEdges(tier.width, tier.depth, tier.cut);

    // Geschlossener Fassadenkörper ohne ausgebauten Innenraum.
    const body = new THREE.Mesh(
      octagonGeometry(tier.width, tier.depth, tier.cut, height),
      matWall
    );
    body.position.y = tier.y0;
    body.name = `stufe_${tierIndex + 1}_fassade`;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    const rowHeight = (height - 1.2) / tier.rows;
    const paneHeight = Math.min(1.15, rowHeight * 0.44);
    const totalBands = tier.rows * edges.length;

    // Dunkle, umlaufende Fensterbänder. Auch die abgeschrägten
    // Eckflächen werden von einem Band umschlossen.
    const frames = new THREE.InstancedMesh(unitBox, matDark, totalBands);
    frames.name = `stufe_${tierIndex + 1}_bandrahmen`;
    frames.castShadow = false;
    frames.receiveShadow = true;

    const panes = new THREE.InstancedMesh(unitBox, matGlass, totalBands);
    panes.name = `stufe_${tierIndex + 1}_fensterband`;
    panes.castShadow = false;
    panes.receiveShadow = true;

    let bandIndex = 0;
    for (let row = 0; row < tier.rows; row++) {
      const paneY = tier.y0 + 0.6 + row * rowHeight + rowHeight * 0.5;
      const frameY = paneY - paneHeight * 0.5 - 0.10;

      for (const edge of edges) {
        const rotationY = edgeRotation(edge);

        setInstance(
          frames,
          bandIndex,
          edge.x + edge.nx * 0.04,
          frameY,
          edge.z + edge.nz * 0.04,
          Math.max(0.25, edge.len - 0.10),
          0.16,
          0.11,
          rotationY
        );

        setInstance(
          panes,
          bandIndex,
          edge.x + edge.nx * 0.065,
          paneY,
          edge.z + edge.nz * 0.065,
          Math.max(0.20, edge.len - 0.42),
          paneHeight,
          0.07,
          rotationY
        );

        bandIndex++;
      }
    }

    frames.instanceMatrix.needsUpdate = true;
    panes.instanceMatrix.needsUpdate = true;
    root.add(frames, panes);

    // Kupferne vertikale Rippen gliedern die Fassaden und betonen
    // die schlanke Höhenrichtung. Hauptflächen erhalten drei Rippen,
    // die schrägen Eckflächen jeweils eine.
    const fins = new THREE.InstancedMesh(unitBox, matCopper, 16);
    fins.name = `stufe_${tierIndex + 1}_vertikalrippen`;
    fins.castShadow = true;
    fins.receiveShadow = true;

    let finIndex = 0;
    for (const edge of edges) {
      const rotationY = edgeRotation(edge);
      const tangentX = edge.nz;
      const tangentZ = -edge.nx;
      const isMainFace = edge.nx === 0 || edge.nz === 0;
      const positions = isMainFace ? [-0.31, 0, 0.31] : [0];

      for (const factor of positions) {
        const distance = edge.len * factor;
        setInstance(
          fins,
          finIndex++,
          edge.x + tangentX * distance + edge.nx * 0.085,
          centerY,
          edge.z + tangentZ * distance + edge.nz * 0.085,
          0.10,
          height - 0.4,
          0.18,
          rotationY
        );
      }
    }
    fins.instanceMatrix.needsUpdate = true;
    root.add(fins);

    // Sparsam verteilte, einzelne erleuchtete Fenster.
    const lit = new THREE.InstancedMesh(unitBox, matGlow, tier.lit);
    lit.name = `stufe_${tierIndex + 1}_erleuchtete_fenster`;
    lit.castShadow = false;
    lit.receiveShadow = false;

    for (let n = 0; n < tier.lit; n++) {
      const edge = edges[(n * 3 + tierIndex) % edges.length];
      const row = (n + tierIndex * 2) % tier.rows;
      const paneY = tier.y0 + 0.6 + row * rowHeight + rowHeight * 0.5;
      const rotationY = edgeRotation(edge);
      const tangentX = edge.nz;
      const tangentZ = -edge.nx;
      const distance = (((n + 1) * 0.23) % 0.62 - 0.31) * edge.len;

      const alongX = edge.x + tangentX * distance;
      const alongZ = edge.z + tangentZ * distance;
      const isMainFace = edge.nx === 0 || edge.nz === 0;

      setInstance(
        lit,
        n,
        alongX + edge.nx * 0.105,
        paneY,
        alongZ + edge.nz * 0.105,
        isMainFace ? 1.15 : 0.72,
        paneHeight * 0.72,
        0.025,
        rotationY
      );
    }
    lit.instanceMatrix.needsUpdate = true;
    root.add(lit);

    // Terrasse: geschlossene kupferne Unterplatte und flache,
    // helle Deckplatte. Zusammen 25 cm hoch.
    const terraceCopper = new THREE.Mesh(
      octagonGeometry(
        tier.width + 0.4,
        tier.depth + 0.4,
        tier.cut + 0.2,
        0.13
      ),
      matCopper
    );
    terraceCopper.position.y = tier.y1;
    terraceCopper.name = `stufe_${tierIndex + 1}_terrassenkante`;
    terraceCopper.castShadow = true;
    terraceCopper.receiveShadow = true;
    root.add(terraceCopper);

    const terraceFloor = new THREE.Mesh(
      octagonGeometry(
        tier.width + 0.28,
        tier.depth + 0.28,
        tier.cut + 0.14,
        0.12
      ),
      matFloor
    );
    terraceFloor.position.y = tier.y1 + 0.13;
    terraceFloor.name = `stufe_${tierIndex + 1}_terrasse`;
    terraceFloor.receiveShadow = true;
    root.add(terraceFloor);

    // Ein grober Kollisionskörper je Fassadenstufe.
    const colBody = new THREE.Mesh(
      new THREE.BoxGeometry(tier.width, height, tier.depth)
    );
    colBody.name = `COL_stufe_${tierIndex + 1}`;
    colBody.position.set(0, centerY, 0);
    root.add(colBody);

    // Flacher Kollisionskörper für die begehbare Terrasse.
    const colTerrace = new THREE.Mesh(
      new THREE.BoxGeometry(tier.width + 0.4, 0.25, tier.depth + 0.4)
    );
    colTerrace.name = `COL_terrasse_${tierIndex + 1}`;
    colTerrace.position.set(0, tier.y1 + 0.125, 0);
    root.add(colTerrace);
  });

  // Flaches Dach der obersten Stufe: dieselbe kupferne Randzone und
  // eine helle, geschlossene Dachplatte.
  const roofCopper = new THREE.Mesh(
    octagonGeometry(15.6, 15.6, 1.2, 0.13),
    matCopper
  );
  roofCopper.position.y = 48.3;
  roofCopper.name = 'dachkante';
  roofCopper.castShadow = true;
  roofCopper.receiveShadow = true;
  root.add(roofCopper);

  const roofFloor = new THREE.Mesh(
    octagonGeometry(15.48, 15.48, 1.14, 0.12),
    matFloor
  );
  roofFloor.position.y = 48.43;
  roofFloor.name = 'dachplatte';
  roofFloor.receiveShadow = true;
  root.add(roofFloor);

  // Kleiner geschlossener Dachaufbau.
  const penthouse = new THREE.Mesh(
    octagonGeometry(6.6, 6.6, 0.8, 2.55),
    matWall
  );
  penthouse.position.y = 48.55;
  penthouse.name = 'dachaufbau';
  penthouse.castShadow = true;
  penthouse.receiveShadow = true;
  root.add(penthouse);

  // Umlaufendes Glasband am Dachaufbau.
  const penthouseEdges = facadeEdges(6.6, 6.6, 0.8);
  const penthouseGlass = new THREE.InstancedMesh(unitBox, matGlass, 8);
  penthouseGlass.name = 'dachaufbau_fensterband';
  penthouseGlass.castShadow = false;

  penthouseEdges.forEach((edge, index) => {
    setInstance(
      penthouseGlass,
      index,
      edge.x + edge.nx * 0.035,
      50.05,
      edge.z + edge.nz * 0.035,
      Math.max(0.25, edge.len - 0.38),
      0.72,
      0.07,
      edgeRotation(edge)
    );
  });
  penthouseGlass.instanceMatrix.needsUpdate = true;
  root.add(penthouseGlass);

  // Flache kupferne Krone des Dachaufbaus.
  const penthouseCap = new THREE.Mesh(
    octagonGeometry(7.0, 7.0, 0.9, 0.35),
    matCopper
  );
  penthouseCap.position.y = 51.1;
  penthouseCap.name = 'dachaufbau_krone';
  penthouseCap.castShadow = true;
  penthouseCap.receiveShadow = true;
  root.add(penthouseCap);

  // Vierkantige, geschlossene Spitzkrone statt einer runden Rundform.
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(2.0, 2.2, 4, 1, false),
    matPillar
  );
  crown.position.y = 52.55;
  crown.rotation.y = Math.PI * 0.25;
  crown.name = 'spitzkrone';
  crown.castShadow = true;
  crown.receiveShadow = true;
  root.add(crown);

  // Kupferne Antenne beginnt unmittelbar an der Kronenspitze.
  const antenna = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 1.17, 0.18),
    matCopper
  );
  antenna.position.y = 54.235;
  antenna.name = 'antenne';
  antenna.castShadow = true;
  root.add(antenna);

  // Kleines eisblaues Antennenlicht; die äußerste Höhe bleibt 55 m.
  const antennaLight = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    matGlow
  );
  antennaLight.position.y = 54.9;
  antennaLight.scale.y = 0.5;
  antennaLight.name = 'antennenspitze';
  root.add(antennaLight);

  // Kollisionskörper für Dachaufbau und grobe Spitzkrone.
  const colRoof = new THREE.Mesh(
    new THREE.BoxGeometry(15.6, 0.25, 15.6)
  );
  colRoof.name = 'COL_dach';
  colRoof.position.set(0, 48.425, 0);
  root.add(colRoof);

  const colPenthouse = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 2.55, 6.6)
  );
  colPenthouse.name = 'COL_dachaufbau';
  colPenthouse.position.set(0, 49.825, 0);
  root.add(colPenthouse);

  const colCrown = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.2, 3.4)
  );
  colCrown.name = 'COL_spitzkrone';
  colCrown.position.set(0, 52.55, 0);
  root.add(colCrown);

  // Kein INT_, kein LAMP_, keine userData.actions und keine Animation.
  // Sämtliche sichtbaren Körper sind geschlossen und vollständig statisch.
  return root;
}

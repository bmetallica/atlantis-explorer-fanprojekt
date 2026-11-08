// city_tower_slender.js
// Schlanker antiker Stadtturm, statisches Außenmodul für Atlantis.
// 1 Einheit = 1 Meter, Ursprung: Mitte des Fußes, y = 0 = Deck.

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_tower_slender',
  art: 'Stadt-Außenmodul',
  masse: '24 × 90 × 24 m',
  wohin: 'Freie Stadtplätze, Uferpromenaden, große Plätze und Außenbereiche der Stadt',
  benutzen: 'Kein Benutzen-Punkt; statisches Architekturmodul',
  lichter: 'Keine',
  animation: 'Keine, statisches Modul',
  quelle: 'selbst gebaut',
};

// Grundriss eines achteckig gefasten Prismas.
function chamferedPoints(half, chamferRatio = 0.13) {
  const c = half * chamferRatio;
  return [
    [-half + c, -half],
    [ half - c, -half],
    [ half, -half + c],
    [ half,  half - c],
    [ half - c,  half],
    [-half + c,  half],
    [-half,  half - c],
    [-half, -half + c],
  ];
}

// Geschlossener achteckig gefaster Körper mit linearer Verjüngung.
// Der Körper beginnt bei lokal y = 0.
function createChamferedPrism(bottomHalf, topHalf, height, material) {
  const bottom = chamferedPoints(bottomHalf);
  const top = chamferedPoints(topHalf);
  const positions = [];
  const indices = [];

  for (const p of bottom) positions.push(p[0], 0, p[1]);
  for (const p of top) positions.push(p[0], height, p[1]);

  const n = bottom.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = i;
    const b = j;
    const at = i + n;
    const bt = j + n;

    // Außen liegende Normale der Seitenflächen.
    indices.push(a, at, bt);
    indices.push(a, bt, b);
  }

  // Geschlossene Unterseite, Normale nach -Y.
  for (let i = 1; i < n - 1; i++) {
    indices.push(0, i, i + 1);
  }

  // Geschlossene Oberseite, Normale nach +Y.
  for (let i = 1; i < n - 1; i++) {
    indices.push(n, n + i + 1, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, material);
}

// Rippe mit Fußpunkt bei lokal y = 0.
// Sie ragt zunächst nach lokal +Z und wird anschließend zur Turmachse geneigt.
function createRibGeometry(height) {
  const geometry = new THREE.BoxGeometry(0.54, height, 0.34);
  geometry.translate(0, height / 2, 0.17);
  return geometry;
}

// Geschlossene, dreidimensionale Kronenfinne.
// Die Basis liegt bei y = 0, radial erstreckt sich die Finne von innerR bis outerR.
function createBladeGeometry(width, innerR, outerR, height) {
  const w = width / 2;
  const midR = (innerR + outerR) / 2;

  const positions = [
    -w, 0, innerR,
     w, 0, innerR,
     w, 0, outerR,
    -w, 0, outerR,
     0, height, midR,
  ];

  const indices = [
    // Basis, Außenseite nach -Y.
    0, 3, 2,
    0, 2, 1,
    // Innenseite, Außenseite nach -Z.
    0, 4, 1,
    // Außenseite, Außenseite nach +Z.
    3, 2, 4,
    // Linke Seitenfläche, Außenseite nach -X.
    0, 3, 4,
    // Rechte Seitenfläche, Außenseite nach +X.
    1, 4, 2,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function create() {
  const root = new THREE.Group();
  root.name = 'city_tower_slender';

  const matHull = kit('hull');
  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matPillar = kit('pillar');

  const shaftBottomY = 2.0;
  const shaftTopY = 64.0;
  const shaftBottomHalf = 11.6;
  const shaftTopHalf = 6.2;
  const shaftHeight = shaftTopY - shaftBottomY;

  function shaftHalfAt(y) {
    const t = THREE.MathUtils.clamp((y - shaftBottomY) / shaftHeight, 0, 1);
    return THREE.MathUtils.lerp(shaftBottomHalf, shaftTopHalf, t);
  }

  // --- Geschlossener Sockel mit gestufter Basis.
  const fundament = createChamferedPrism(12.0, 11.82, 1.2, matHull);
  fundament.name = 'Turm_Fundament';
  root.add(fundament);

  const sockel = createChamferedPrism(11.82, 11.62, 1.05, matWall);
  sockel.position.y = 1.15;
  sockel.name = 'Turm_Sockel';
  root.add(sockel);

  const sockelkante = createChamferedPrism(11.93, 11.93, 0.22, matCopper);
  sockelkante.position.y = 1.1;
  sockelkante.name = 'Turm_Sockelkante';
  root.add(sockelkante);

  // --- Hauptschaft: geschlossener, nach oben verjüngter Turmkörper.
  const schaft = createChamferedPrism(
    shaftBottomHalf,
    shaftTopHalf,
    shaftHeight,
    matWall,
  );
  schaft.name = 'Turm_Schaft';
  schaft.position.y = shaftBottomY;
  root.add(schaft);

  // --- Senkrechte helle Fassadenrippen.
  // Die Rippen folgen der Verjüngung und liegen auf den vier Hauptfassaden.
  const ribBottomY = 2.02;
  const ribTopY = 63.5;
  const ribHeight = ribTopY - ribBottomY;
  const ribBottomHalf = shaftHalfAt(ribBottomY);
  const ribTopHalf = shaftHalfAt(ribTopY);
  const tangentRatio = ribTopHalf / ribBottomHalf;

  const rippenGeo = createRibGeometry(ribHeight);
  const rippen = new THREE.InstancedMesh(rippenGeo, matPillar, 20);
  rippen.name = 'Fassade_Rippen';
  rippen.castShadow = true;
  rippen.receiveShadow = true;

  const yAxis = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const qFace = new THREE.Quaternion();
  const qTiltX = new THREE.Quaternion();
  const qTiltZ = new THREE.Quaternion();
  const qLocal = new THREE.Quaternion();
  const qRib = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);

  const rippenOffsets = [-8, -4, 0, 4, 8];
  let instanceIndex = 0;

  for (let face = 0; face < 4; face++) {
    qFace.setFromAxisAngle(yAxis, face * Math.PI / 2);

    for (const offset of rippenOffsets) {
      // Gewünschte Verschiebung der Rippenmitte am oberen Ende.
      const topTangentShift = offset * (tangentRatio - 1);
      const topRadialShift = ribTopHalf - ribBottomHalf;

      // Rotation um Z bewegt die lokale Y-Achse nach -X.
      const tiltZ = -Math.asin(
        THREE.MathUtils.clamp(topTangentShift / ribHeight, -0.99, 0.99),
      );

      // Rotation um X bewegt die lokale Y-Achse nach +Z.
      const tiltX = Math.asin(
        THREE.MathUtils.clamp(topRadialShift / ribHeight, -0.99, 0.99),
      );

      qTiltX.setFromAxisAngle(xAxis, tiltX);
      qTiltZ.setFromAxisAngle(zAxis, tiltZ);
      qLocal.copy(qTiltZ).multiply(qTiltX);
      qRib.copy(qFace).multiply(qLocal);

      const half = ribBottomHalf;

      if (face === 0) position.set(offset, ribBottomY, half);
      if (face === 1) position.set(half, ribBottomY, -offset);
      if (face === 2) position.set(-offset, ribBottomY, -half);
      if (face === 3) position.set(-half, ribBottomY, offset);

      matrix.compose(position, qRib, scale);
      rippen.setMatrixAt(instanceIndex++, matrix);
    }
  }
  rippen.instanceMatrix.needsUpdate = true;
  root.add(rippen);

  // --- Dunkelblaue Glasbänder zwischen den Fassadenrippen.
  const bandLevels = [8, 15, 22, 29, 36, 43, 50, 57, 61.5];
  const bandGeo = createChamferedPrism(1, 1, 1).geometry;
  const bands = new THREE.InstancedMesh(bandGeo, matGlass, bandLevels.length);
  bands.name = 'Glasbaender';
  bands.receiveShadow = true;

  bandLevels.forEach((level, i) => {
    const half = shaftHalfAt(level) + 0.12;
    const bandMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(0, level - 0.42, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(half, 0.84, half),
    );
    bands.setMatrixAt(i, bandMatrix);
  });
  bands.instanceMatrix.needsUpdate = true;
  root.add(bands);

  // --- Sparsame, einzelne leuchtende Fensterreihen.
  const glowGeo = new THREE.BoxGeometry(1, 1, 1);
  const glowRows = [
    { y: 18.5, face: 0 },
    { y: 32.0, face: 1 },
    { y: 47.0, face: 2 },
    { y: 59.0, face: 3 },
  ];
  const glowOffsets = [-3, -1, 1, 3];
  const glowCount = glowRows.length * glowOffsets.length;

  const glow = new THREE.InstancedMesh(glowGeo, matGlow, glowCount);
  glow.name = 'Leuchtende_Fensterreihen';

  let glowIndex = 0;

  for (const row of glowRows) {
    const half = shaftHalfAt(row.y);
    const q = new THREE.Quaternion().setFromAxisAngle(
      yAxis,
      row.face * Math.PI / 2,
    );

    for (const offset of glowOffsets) {
      let p;

      if (row.face === 0) p = new THREE.Vector3(offset, row.y, half + 0.17);
      if (row.face === 1) p = new THREE.Vector3(half + 0.17, row.y, -offset);
      if (row.face === 2) p = new THREE.Vector3(-offset, row.y, -half - 0.17);
      if (row.face === 3) p = new THREE.Vector3(-half - 0.17, row.y, offset);

      const m = new THREE.Matrix4().compose(
        p,
        q,
        new THREE.Vector3(1.1, 0.48, 0.14),
      );
      glow.setMatrixAt(glowIndex++, m);
    }
  }
  glow.instanceMatrix.needsUpdate = true;
  root.add(glow);

  // --- Übergang vom Schaft zur spitzen Krone.
  const kronenansatz = createChamferedPrism(6.45, 6.75, 1.1, matWall);
  kronenansatz.position.y = 63.9;
  kronenansatz.name = 'Turm_Kronenansatz';
  root.add(kronenansatz);

  const kronenband = createChamferedPrism(6.82, 6.82, 0.24, matCopper);
  kronenband.position.y = 64.82;
  kronenband.name = 'Turm_Kronenband';
  root.add(kronenband);

  const krone = createChamferedPrism(6.55, 5.9, 4.0, matWall);
  krone.position.y = 65.0;
  krone.name = 'Turm_Krone';
  root.add(krone);

  const kern = createChamferedPrism(5.9, 1.45, 16.5, matHull);
  kern.position.y = 69.0;
  kern.name = 'Turm_Kronenkern';
  root.add(kern);

  const kronenkragen = createChamferedPrism(3.12, 2.72, 0.46, matCopper);
  kronenkragen.position.y = 81.55;
  kronenkragen.name = 'Turm_Kronenkragen';
  root.add(kronenkragen);

  // --- Vier große Kronenfinnen, radial in die Turmkrone eingebunden.
  const grosseFinneGeo = createBladeGeometry(1.35, 1.55, 6.75, 18.2);
  const grosseFinnen = new THREE.InstancedMesh(grosseFinneGeo, matCopper, 4);
  grosseFinnen.name = 'Kronenfinnen_gross';

  for (let i = 0; i < 4; i++) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 66.2, 0),
      new THREE.Quaternion().setFromAxisAngle(yAxis, i * Math.PI / 2),
      new THREE.Vector3(1, 1, 1),
    );
    grosseFinnen.setMatrixAt(i, m);
  }
  grosseFinnen.instanceMatrix.needsUpdate = true;
  grosseFinnen.castShadow = true;
  root.add(grosseFinnen);

  // --- Vier kürzere diagonale Kronenfinnen.
  const kleineFinneGeo = createBladeGeometry(0.95, 1.45, 6.25, 14.3);
  const kleineFinnen = new THREE.InstancedMesh(kleineFinneGeo, matCopper, 4);
  kleineFinnen.name = 'Kronenfinnen_klein';

  for (let i = 0; i < 4; i++) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 66.2, 0),
      new THREE.Quaternion().setFromAxisAngle(
        yAxis,
        Math.PI / 4 + i * Math.PI / 2,
      ),
      new THREE.Vector3(1, 1, 1),
    );
    kleineFinnen.setMatrixAt(i, m);
  }
  kleineFinnen.instanceMatrix.needsUpdate = true;
  kleineFinnen.castShadow = true;
  root.add(kleineFinnen);

  // --- Dunkelblaue zentrale Turmspitze, exakt bis y = 90 m.
  const spitze = new THREE.Mesh(
    new THREE.ConeGeometry(2.15, 8, 4),
    matDark,
  );
  spitze.name = 'Turmspitze';
  spitze.position.set(0, 86, 0);
  spitze.rotation.y = Math.PI / 4;
  spitze.castShadow = true;
  root.add(spitze);

  // --- Kleine bronzene Endkappe auf der Turmspitze.
  const spitzkappe = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 1.0, 4),
    matCopper,
  );
  spitzkappe.name = 'Turmspitze_Kappe';
  spitzkappe.position.set(0, 89.5, 0);
  spitzkappe.rotation.y = Math.PI / 4;
  root.add(spitzkappe);

  // --- Eine grobe Kollisionsbox für Sockel und Hauptschaft.
  const col = new THREE.Mesh(new THREE.BoxGeometry(24, 88, 24));
  col.name = 'COL_turm_schaft';
  col.position.set(0, 44, 0);
  col.userData.aktiv = true;
  root.add(col);

  return root;
}

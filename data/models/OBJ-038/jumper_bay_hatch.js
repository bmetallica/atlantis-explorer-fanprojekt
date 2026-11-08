// jumper_bay_hatch.js
// Jumper-Bay-Dachluke mit irisartig segmentierten Klappen.
// Deckenobjekt: Ursprung = Mitte der Deckenfläche bei y = 0, Objekt hängt nach -Y.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'jumper_bay_hatch',
  art: 'Deckenobjekt',
  masse: '10,0 m Durchmesser, 3,8 m Schachttiefe',
  wohin: 'ATL-040 Jumper-Bay / Puddle-Jumper-Hangar',
  benutzen: 'INT_startschacht → Menü zum Öffnen und Schließen der Dachluke',
  lichter: 'LAMP_aussenlicht (warmgelb), LAMP_leuchtbaender (eisblau)',
  animation: 'Acht dreieckige Segmentklappen öffnen sich irisartig; Leuchtbänder pulsieren',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'jumper_bay_hatch';

  // --- Materialien
  const matPillar = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matHull = kit('hull');

  const matShaft = new THREE.MeshStandardMaterial({
    name: 'schachtwand',
    color: 0x45413d,
    metalness: 0.7,
    roughness: 0.52,
  });

  const matPanel = new THREE.MeshStandardMaterial({
    name: 'klappenpanel',
    color: 0x3b3937,
    emissive: 0x102a34,
    emissiveIntensity: 0.14,
    metalness: 0.76,
    roughness: 0.43,
  });

  const matBand = new THREE.MeshStandardMaterial({
    name: 'leuchtband',
    color: 0xc2e9ee,
    emissive: 0x6fe3ff,
    emissiveIntensity: 2.0,
    metalness: 0.2,
    roughness: 0.3,
  });

  const matTrim = new THREE.MeshStandardMaterial({
    name: 'panelkante',
    color: 0x93a8ad,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.65,
    metalness: 0.86,
    roughness: 0.29,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'aussenlichtflaeche',
    color: 0x8a6325,
    emissive: 0xffb43c,
    emissiveIntensity: 1.65,
    metalness: 0.02,
    roughness: 0.82,
  });

  // --- Grundmaße
  const panelCount = 8;
  const outerRadius = 5.0;
  const innerRadius = 4.0;
  const shaftDepth = 3.8;
  const innerApothem = innerRadius * Math.cos(Math.PI / panelCount);
  const innerSide = 2 * innerRadius * Math.sin(Math.PI / panelCount);
  const wallRadius = innerApothem + 0.17;
  const wallWidth = innerSide + 0.04;
  const wallTop = -0.28;
  const wallHeight = shaftDepth - 0.28;
  const panelY = -0.28;

  // --- Geschlossener achteckiger Deckenflansch
  function polygonPoints(radius, reverse = false) {
    const points = [];
    for (let i = 0; i < panelCount; i++) {
      const a = Math.PI / panelCount + (i * Math.PI * 2) / panelCount;
      points.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius));
    }
    return reverse ? points.reverse() : points;
  }

  const flangeShape = new THREE.Shape();
  const outerPoints = polygonPoints(outerRadius);
  flangeShape.moveTo(outerPoints[0].x, outerPoints[0].y);
  for (let i = 1; i < outerPoints.length; i++) {
    flangeShape.lineTo(outerPoints[i].x, outerPoints[i].y);
  }
  flangeShape.closePath();

  const flangeHole = new THREE.Path();
  const innerPoints = polygonPoints(innerRadius, true);
  flangeHole.moveTo(innerPoints[0].x, innerPoints[0].y);
  for (let i = 1; i < innerPoints.length; i++) {
    flangeHole.lineTo(innerPoints[i].x, innerPoints[i].y);
  }
  flangeHole.closePath();
  flangeShape.holes.push(flangeHole);

  const flangeGeometry = new THREE.ExtrudeGeometry(flangeShape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.035,
    bevelSegments: 1,
    curveSegments: 1,
  });
  flangeGeometry.rotateX(-Math.PI / 2);
  flangeGeometry.translate(0, -0.3, 0);

  const topRing = new THREE.Mesh(flangeGeometry, matPillar);
  topRing.name = 'oberer_lukenrand';
  topRing.castShadow = true;
  topRing.receiveShadow = true;
  root.add(topRing);

  // --- Bronzene Außenkante und leuchtende Innenkante
  const outerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(4.94, 0.075, 6, panelCount * 6),
    matRail
  );
  outerTrim.rotation.x = Math.PI / 2;
  outerTrim.position.y = -0.025;
  root.add(outerTrim);

  const innerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(3.71, 0.055, 6, panelCount * 6),
    matTrim
  );
  innerTrim.rotation.x = Math.PI / 2;
  innerTrim.position.y = -0.29;
  root.add(innerTrim);

  const lowerRim = new THREE.Mesh(
    new THREE.TorusGeometry(3.78, 0.11, 6, panelCount * 6),
    matRail
  );
  lowerRim.rotation.x = Math.PI / 2;
  lowerRim.position.y = -shaftDepth - 0.02;
  root.add(lowerRim);

  // --- Schachtwände als geschlossene Boxsegmente
  const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, 0.34);
  const wallsEven = new THREE.InstancedMesh(wallGeometry, matShaft, 4);
  const wallsOdd = new THREE.InstancedMesh(wallGeometry, matHull, 4);
  wallsEven.name = 'schachtwände_even';
  wallsOdd.name = 'schachtwände_odd';
  wallsEven.castShadow = true;
  wallsEven.receiveShadow = true;
  wallsOdd.castShadow = true;
  wallsOdd.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let evenIndex = 0;
  let oddIndex = 0;

  for (let i = 0; i < panelCount; i++) {
    const a = (i / panelCount) * Math.PI * 2;
    dummy.position.set(
      Math.cos(a) * wallRadius,
      wallTop - wallHeight / 2,
      Math.sin(a) * wallRadius
    );
    dummy.rotation.set(0, Math.PI / 2 - a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();

    if (i % 2 === 0) {
      wallsEven.setMatrixAt(evenIndex++, dummy.matrix);
    } else {
      wallsOdd.setMatrixAt(oddIndex++, dummy.matrix);
    }
  }
  wallsEven.instanceMatrix.needsUpdate = true;
  wallsOdd.instanceMatrix.needsUpdate = true;
  root.add(wallsEven, wallsOdd);

  // --- Eckrippen des Schachts
  const ribGeometry = new THREE.BoxGeometry(0.22, wallHeight, 0.22);
  const ribs = new THREE.InstancedMesh(ribGeometry, matCopper, panelCount);
  ribs.name = 'schachtrippen';
  ribs.castShadow = true;

  for (let i = 0; i < panelCount; i++) {
    const a = Math.PI / panelCount + (i * Math.PI * 2) / panelCount;
    dummy.position.set(
      Math.cos(a) * 3.97,
      wallTop - wallHeight / 2,
      Math.sin(a) * 3.97
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate = true;
  root.add(ribs);

  // --- Horizontale Leuchtbänder
  const bandGeometry = new THREE.BoxGeometry(innerSide - 0.2, 0.075, 0.05);
  const bandCount = panelCount * 3;
  const bands = new THREE.InstancedMesh(bandGeometry, matBand, bandCount);
  bands.name = 'wandleuchtbaender';

  let bandIndex = 0;
  for (let row = 0; row < 3; row++) {
    const y = -0.82 - row * 1.1;
    for (let i = 0; i < panelCount; i++) {
      const a = (i / panelCount) * Math.PI * 2;
      dummy.position.set(
        Math.cos(a) * (innerApothem - 0.035),
        y,
        Math.sin(a) * (innerApothem - 0.035)
      );
      dummy.rotation.set(0, Math.PI / 2 - a, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bands.setMatrixAt(bandIndex++, dummy.matrix);
    }
  }
  bands.instanceMatrix.needsUpdate = true;
  root.add(bands);

  // --- Technische Fugenleisten
  const seamGeometry = new THREE.BoxGeometry(innerSide - 0.14, 0.035, 0.025);
  const seamCount = panelCount * 4;
  const seams = new THREE.InstancedMesh(seamGeometry, matRail, seamCount);
  seams.name = 'wandfugen';

  let seamIndex = 0;
  for (let row = 0; row < 4; row++) {
    const y = -0.48 - row * 0.92;
    for (let i = 0; i < panelCount; i++) {
      const a = (i / panelCount) * Math.PI * 2;
      dummy.position.set(
        Math.cos(a) * (innerApothem - 0.025),
        y,
        Math.sin(a) * (innerApothem - 0.025)
      );
      dummy.rotation.set(0, Math.PI / 2 - a, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      seams.setMatrixAt(seamIndex++, dummy.matrix);
    }
  }
  seams.instanceMatrix.needsUpdate = true;
  root.add(seams);

  // --- Warmes Außenlicht hinter der Luke
  const outsideGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(3.96, 3.96, 0.04, panelCount),
    matAmber
  );
  outsideGlow.position.y = -0.025;
  outsideGlow.name = 'aussenlichtflaeche';
  root.add(outsideGlow);

  // --- Irisartige Segmentklappen
  const leaves = [];
  const leafShape = new THREE.Shape();
  const leafBaseWidth = innerSide - 0.055;
  leafShape.moveTo(-leafBaseWidth / 2, 0);
  leafShape.lineTo(leafBaseWidth / 2, 0);
  leafShape.lineTo(0, innerApothem - 0.025);
  leafShape.closePath();

  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.025,
    bevelSegments: 1,
    curveSegments: 1,
  });
  leafGeometry.rotateX(-Math.PI / 2);
  leafGeometry.translate(0, -0.08, 0);

  for (let i = 0; i < panelCount; i++) {
    const a = (i / panelCount) * Math.PI * 2;

    const hinge = new THREE.Group();
    hinge.position.set(
      Math.cos(a) * innerApothem,
      panelY,
      Math.sin(a) * innerApothem
    );
    hinge.rotation.y = Math.PI / 2 - a;
    root.add(hinge);

    const pivot = new THREE.Group();
    hinge.add(pivot);

    const leaf = new THREE.Mesh(leafGeometry, matPanel);
    leaf.name = `segmentklappe_${i}`;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    pivot.add(leaf);

    // Leuchtstreifen entlang der Scharnierkante
    const leafStrip = new THREE.Mesh(
      new THREE.BoxGeometry(leafBaseWidth - 0.12, 0.025, 0.045),
      matTrim
    );
    leafStrip.position.set(0, 0.105, -0.11);
    pivot.add(leafStrip);

    // Bronzene Scharnierblöcke als InstancedMesh
    const bracketGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.42);
    const brackets = new THREE.InstancedMesh(bracketGeometry, matCopper, 2);
    brackets.name = `scharnierbloecke_${i}`;

    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      dummy.position.set(sideIndex === 0 ? -0.55 : 0.55, -0.055, -0.04);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      brackets.setMatrixAt(sideIndex, dummy.matrix);
    }
    brackets.instanceMatrix.needsUpdate = true;
    pivot.add(brackets);

    leaves.push({ hinge, pivot, index: i });
  }

  // --- Zentraler Schließkranz
  const centerCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, panelCount),
    matCopper
  );
  centerCap.position.y = panelY - 0.01;
  centerCap.name = 'zentraler_schliesskranz';
  root.add(centerCap);

  // --- Kollisionskörper der festen Schachtwände
  for (let i = 0; i < panelCount; i++) {
    const a = (i / panelCount) * Math.PI * 2;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, wallHeight, 0.36)
    );
    col.name = `COL_schachtwand_${i}`;
    col.position.set(
      Math.cos(a) * wallRadius,
      wallTop - wallHeight / 2,
      Math.sin(a) * wallRadius
    );
    col.rotation.y = Math.PI / 2 - a;
    col.userData.aktiv = true;
    root.add(col);
  }

  // Geschlossene Luke blockiert; beim Öffnen wird die Kollision deaktiviert.
  const hatchCol = new THREE.Mesh(
    new THREE.CylinderGeometry(3.88, 3.88, 0.24, panelCount)
  );
  hatchCol.name = 'COL_luke';
  hatchCol.position.y = panelY;
  hatchCol.userData.aktiv = true;
  root.add(hatchCol);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_startschacht';
  use.position.set(0, -1.35, 4.35);
  use.userData = {
    label: 'Jumper-Startschacht bedienen',
    radius: 1.0,
  };
  root.add(use);

  // --- Lichter
  const outerLamp = new THREE.Object3D();
  outerLamp.name = 'LAMP_aussenlicht';
  outerLamp.position.set(0, 0.03, 0);
  outerLamp.userData = {
    color: '#ffbd55',
    intensity: 12,
    distance: 10,
  };
  root.add(outerLamp);

  const bandLamp = new THREE.Object3D();
  bandLamp.name = 'LAMP_leuchtbaender';
  bandLamp.position.set(0, -2.0, 0);
  bandLamp.userData = {
    color: '#6fe3ff',
    intensity: 7,
    distance: 8,
  };
  root.add(bandLamp);

  // --- Zustand und weiche Animation
  let open = opts.open === true;
  let openness = open ? 1 : 0;
  let time = 0;
  let last = null;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    time += step;

    const target = open ? 1 : 0;
    openness += (target - openness) * Math.min(1, step * 2.8);

    for (const leaf of leaves) {
      const phase = Math.sin(time * 0.85 + leaf.index * 0.3) * 0.018;
      leaf.pivot.rotation.x = -openness * (1.48 + phase);
      leaf.pivot.rotation.z =
        openness * (leaf.index % 2 === 0 ? 0.055 : -0.055);
    }

    const pulse = 1.7 + Math.sin(time * 2.05) * 0.32;
    matBand.emissiveIntensity = pulse + openness * 0.65;
    matTrim.emissiveIntensity = 0.48 + openness * 1.05;
    matAmber.emissiveIntensity = 1.25 + openness * 1.7;

    hatchCol.userData.aktiv = openness < 0.55;
  }

  topRing.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) {
      update(now - last);
    }
    last = now;
  };

  const api = {
    open() {
      open = true;
    },
    close() {
      open = false;
    },
    toggle() {
      open = !open;
    },
    get isOpen() {
      return open;
    },
    get openness() {
      return openness;
    },
    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'oeffnen',
      label: 'Startschacht öffnen',
      run: () => api.open(),
    },
    {
      id: 'schliessen',
      label: 'Startschacht schließen',
      run: () => api.close(),
    },
    {
      id: 'umschalten',
      label: 'Startschacht umschalten',
      run: () => api.toggle(),
    },
  ];

  return root;
}

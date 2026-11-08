import * as THREE from 'three';

export const steckbrief = {
  name: 'particle_magnum',
  art: 'Kleinobjekt / liegende Handwaffe',
  masse: 'ca. 0,15 × 0,08 × 0,36 (B × H × T, m)',
  wohin: 'ATL-024 Crew-Quartiere / Wohnbereich; ATL-030 Waffenkammer / Armory',
  benutzen: 'INT_modus → Menü mit den drei Feuermodi',
  lichter: 'LAMP_modus (orange, rot oder grün entsprechend dem gewählten Modus)',
  animation: 'Moduslichter pulsieren, Laufkristalle wechseln ihre Farbe weich, Wählerhebel bewegt sich, Energiezellkuppel glimmt',
  quelle: 'selbst gebaut nach der Ronon-Dex-Requisite und der Konzeptzeichnung',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'particle_magnum';

  const weapon = new THREE.Group();
  weapon.name = 'magnum_gehaeuse';
  root.add(weapon);

  const darkMetal = new THREE.MeshStandardMaterial({
    name: 'magnum_dunkelmetall',
    color: 0x111925,
    metalness: 0.88,
    roughness: 0.32,
  });

  const edgeMetal = new THREE.MeshStandardMaterial({
    name: 'magnum_kantenmetall',
    color: 0x29374b,
    metalness: 0.92,
    roughness: 0.24,
  });

  const blackMetal = new THREE.MeshStandardMaterial({
    name: 'magnum_schwarzmetall',
    color: 0x070c13,
    metalness: 0.78,
    roughness: 0.42,
  });

  const bronze = new THREE.MeshStandardMaterial({
    name: 'magnum_bronze',
    color: 0x9a662f,
    metalness: 0.84,
    roughness: 0.28,
  });

  const wood = new THREE.MeshStandardMaterial({
    name: 'magnum_holzgriff',
    color: 0x5a2d18,
    metalness: 0.02,
    roughness: 0.67,
  });

  const cord = new THREE.MeshStandardMaterial({
    name: 'magnum_schnurwicklung',
    color: 0x18130f,
    metalness: 0.01,
    roughness: 0.94,
  });

  const modeColors = [
    new THREE.Color(0xff7926),
    new THREE.Color(0xff2424),
    new THREE.Color(0x39ff70),
  ];

  const modeNames = ['Betäuben', 'Töten', 'Verbrennen'];
  let modusIndex = 0;

  function addMesh(geometry, material, parent = weapon) {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }

  // Die Waffe wird direkt in ihrer liegenden Position aufgebaut.
  // Laufrichtung: +Z; Waffe liegt auf ihrer rechten Seite.

  // --- Hauptrahmen
  const receiver = addMesh(
    new THREE.BoxGeometry(0.052, 0.046, 0.17),
    darkMetal
  );
  receiver.position.set(0, 0.027, 0.005);

  const upperRail = addMesh(
    new THREE.BoxGeometry(0.045, 0.016, 0.205),
    edgeMetal
  );
  upperRail.position.set(0, 0.054, 0.018);

  const lowerFrame = addMesh(
    new THREE.BoxGeometry(0.042, 0.019, 0.118),
    blackMetal
  );
  lowerFrame.position.set(0, 0.003, 0.035);

  const frontShoulder = addMesh(
    new THREE.BoxGeometry(0.058, 0.053, 0.025),
    darkMetal
  );
  frontShoulder.position.set(0, 0.026, 0.078);

  const sidePanel = addMesh(
    new THREE.BoxGeometry(0.004, 0.032, 0.096),
    edgeMetal
  );
  sidePanel.position.set(0.028, 0.025, 0.013);

  // --- Hintere Energiezellen-Trommel
  const drum = addMesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.064, 20),
    darkMetal
  );
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0, 0.026, -0.125);

  const drumFront = addMesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.012, 20),
    edgeMetal
  );
  drumFront.rotation.x = Math.PI / 2;
  drumFront.position.set(0, 0.026, -0.087);

  const drumRear = addMesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.012, 20),
    blackMetal
  );
  drumRear.rotation.x = Math.PI / 2;
  drumRear.position.set(0, 0.026, -0.163);

  const drumConnector = addMesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.026, 14),
    edgeMetal
  );
  drumConnector.rotation.x = Math.PI / 2;
  drumConnector.position.set(0, 0.026, -0.073);

  const cellRibs = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.0382, 0.0022, 6, 16),
    edgeMetal,
    3
  );
  cellRibs.name = 'magnum_zellrippen';
  const cellMatrix = new THREE.Matrix4();
  for (let i = 0; i < 3; i++) {
    cellMatrix.makeTranslation(0, 0.026, -0.145 + i * 0.019);
    cellRibs.setMatrixAt(i, cellMatrix);
  }
  cellRibs.instanceMatrix.needsUpdate = true;
  weapon.add(cellRibs);

  // --- Nachladbare Energiezelle mit bronzefarbener, leuchtender Kuppel
  const cellBody = addMesh(
    new THREE.CylinderGeometry(0.027, 0.027, 0.022, 18),
    bronze
  );
  cellBody.rotation.x = Math.PI / 2;
  cellBody.position.set(0, 0.026, -0.176);

  const domeMaterial = new THREE.MeshStandardMaterial({
    name: 'magnum_energiedom',
    color: 0xffd28a,
    emissive: 0xffa43d,
    emissiveIntensity: 1.35,
    metalness: 0.18,
    roughness: 0.2,
  });

  const dome = addMesh(
    new THREE.SphereGeometry(0.027, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    domeMaterial
  );
  dome.rotation.x = -Math.PI / 2;
  dome.position.set(0, 0.026, -0.187);

  const cellPin = addMesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.007, 12),
    blackMetal
  );
  cellPin.rotation.x = Math.PI / 2;
  cellPin.position.set(0, 0.026, -0.205);

  // --- Vorderer Lauf und großer, gerippter Laufmantel
  const barrel = addMesh(
    new THREE.CylinderGeometry(0.014, 0.017, 0.09, 16),
    darkMetal
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.026, 0.122);

  const barrelShroud = addMesh(
    new THREE.BoxGeometry(0.061, 0.054, 0.075),
    darkMetal
  );
  barrelShroud.position.set(0, 0.026, 0.126);

  const muzzleRing = addMesh(
    new THREE.CylinderGeometry(0.022, 0.019, 0.014, 18),
    edgeMetal
  );
  muzzleRing.rotation.x = Math.PI / 2;
  muzzleRing.position.set(0, 0.026, 0.168);

  const muzzleBore = addMesh(
    new THREE.CylinderGeometry(0.0125, 0.0125, 0.004, 16),
    blackMetal
  );
  muzzleBore.rotation.x = Math.PI / 2;
  muzzleBore.position.set(0, 0.026, 0.176);

  // Schräge Rillenkanten auf beiden Seiten des Laufmantels.
  const shroudRibs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.004, 0.036, 0.006),
    edgeMetal,
    8
  );
  shroudRibs.name = 'magnum_laufrillen';
  const shroudMatrix = new THREE.Matrix4();
  const shroudQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.22, 0, 0)
  );
  const shroudScale = new THREE.Vector3(1, 1, 1);
  let shroudIndex = 0;

  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      shroudMatrix.compose(
        new THREE.Vector3(side * 0.0315, 0.027, 0.099 + i * 0.018),
        shroudQuaternion,
        shroudScale
      );
      shroudRibs.setMatrixAt(shroudIndex, shroudMatrix);
      shroudIndex++;
    }
  }
  shroudRibs.instanceMatrix.needsUpdate = true;
  weapon.add(shroudRibs);

  // --- Wählschalter mit drei farbigen Anzeigen vor der Trommel
  const selectorPanel = addMesh(
    new THREE.BoxGeometry(0.007, 0.029, 0.068),
    blackMetal
  );
  selectorPanel.position.set(0.029, 0.027, -0.049);

  const indicatorMaterials = [];

  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshStandardMaterial({
      name: `magnum_moduslicht_${i + 1}`,
      color: modeColors[i].clone().multiplyScalar(i === modusIndex ? 0.95 : 0.32),
      emissive: modeColors[i].clone(),
      emissiveIntensity: i === modusIndex ? 2.1 : 0.1,
      metalness: 0.12,
      roughness: 0.24,
    });
    indicatorMaterials.push(material);

    const indicator = addMesh(
      new THREE.SphereGeometry(0.0042, 10, 6),
      material
    );
    indicator.scale.set(0.55, 1, 1);
    indicator.position.set(0.0335, 0.031, -0.068 + i * 0.019);
  }

  const leverPivot = new THREE.Group();
  leverPivot.position.set(0.032, 0.014, -0.047);
  weapon.add(leverPivot);

  const lever = addMesh(
    new THREE.BoxGeometry(0.006, 0.006, 0.024),
    bronze,
    leverPivot
  );
  lever.position.z = 0.01;
  leverPivot.rotation.x = -0.42;

  // --- Drei aufsteigende Kristalle im vorderen Lauf
  const crystalMaterial = new THREE.MeshStandardMaterial({
    name: 'magnum_laufkristalle',
    color: modeColors[0].clone(),
    emissive: modeColors[0].clone(),
    emissiveIntensity: 1.65,
    metalness: 0.28,
    roughness: 0.14,
  });

  const crystalSizes = [0.0048, 0.0062, 0.0078];
  const crystalPositions = [0.026, 0.052, 0.078];

  for (let i = 0; i < 3; i++) {
    const socket = addMesh(
      new THREE.CylinderGeometry(crystalSizes[i] * 0.78, crystalSizes[i] * 0.9, 0.005, 8),
      blackMetal
    );
    socket.position.set(0, 0.062, crystalPositions[i]);

    const crystal = addMesh(
      new THREE.OctahedronGeometry(crystalSizes[i], 0),
      crystalMaterial
    );
    crystal.position.set(0, 0.068 + crystalSizes[i] * 0.55, crystalPositions[i]);
    crystal.scale.set(0.8, 1.15, 0.8);
    crystal.rotation.y = Math.PI / 4;
  }

  // --- Liegend liegender Holzgriff mit Schnurwicklung
  const gripGroup = new THREE.Group();
  gripGroup.position.set(0.006, 0.014, -0.077);
  gripGroup.rotation.y = 0.5;
  weapon.add(gripGroup);

  const grip = addMesh(
    new THREE.BoxGeometry(0.128, 0.034, 0.044),
    wood,
    gripGroup
  );
  grip.position.x = 0.067;

  const gripCap = addMesh(
    new THREE.BoxGeometry(0.009, 0.039, 0.049),
    edgeMetal,
    gripGroup
  );
  gripCap.position.x = 0.134;

  const wraps = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.0225, 0.0022, 6, 12),
    cord,
    6
  );
  wraps.name = 'magnum_schnurwicklung';
  const wrapMatrix = new THREE.Matrix4();
  const wrapQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, Math.PI / 2, 0)
  );
  const wrapScale = new THREE.Vector3(1.06, 1.2, 1);

  for (let i = 0; i < 6; i++) {
    wrapMatrix.compose(
      new THREE.Vector3(0.023 + i * 0.019, 0, 0),
      wrapQuaternion,
      wrapScale
    );
    wraps.setMatrixAt(i, wrapMatrix);
  }
  wraps.instanceMatrix.needsUpdate = true;
  gripGroup.add(wraps);

  // --- Abzugbügel und Abzug
  const triggerGuard = addMesh(
    new THREE.TorusGeometry(0.019, 0.0036, 7, 18),
    darkMetal
  );
  triggerGuard.scale.set(1.12, 0.78, 1);
  triggerGuard.position.set(0.027, 0.006, -0.065);

  const trigger = addMesh(
    new THREE.BoxGeometry(0.007, 0.023, 0.006),
    edgeMetal
  );
  trigger.position.set(0.029, 0.006, -0.065);
  trigger.rotation.z = -0.13;

  // --- Visuelle Kleinigkeiten
  const rearSight = addMesh(
    new THREE.BoxGeometry(0.019, 0.012, 0.013),
    edgeMetal
  );
  rearSight.position.set(0, 0.068, -0.073);

  const rearSightNotch = addMesh(
    new THREE.BoxGeometry(0.005, 0.014, 0.014),
    blackMetal
  );
  rearSightNotch.position.set(0, 0.074, -0.073);

  const frontSight = addMesh(
    new THREE.BoxGeometry(0.005, 0.014, 0.006),
    edgeMetal
  );
  frontSight.position.set(0, 0.06, 0.146);

  const screws = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 10),
    bronze,
    4
  );
  screws.name = 'magnum_schrauben';
  const screwMatrix = new THREE.Matrix4();
  const screwQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, 0, Math.PI / 2)
  );
  const screwScale = new THREE.Vector3(1, 1, 1);
  const screwPositions = [
    [0.027, 0.03, -0.03],
    [0.027, 0.03, 0.052],
    [-0.027, 0.03, -0.03],
    [-0.027, 0.03, 0.052],
  ];

  screwPositions.forEach((position, index) => {
    screwMatrix.compose(
      new THREE.Vector3(...position),
      screwQuaternion,
      screwScale
    );
    screws.setMatrixAt(index, screwMatrix);
  });
  screws.instanceMatrix.needsUpdate = true;
  weapon.add(screws);

  // --- Ursprung: Mitte der Unterseite, in X/Z mittig
  weapon.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(weapon);
  const centerX = (initialBounds.min.x + initialBounds.max.x) * 0.5;
  const centerZ = (initialBounds.min.z + initialBounds.max.z) * 0.5;

  weapon.position.x -= centerX;
  weapon.position.y -= initialBounds.min.y;
  weapon.position.z -= centerZ;
  weapon.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(weapon);
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  const depth = bounds.max.z - bounds.min.z;
  const finalCenterX = (bounds.min.x + bounds.max.x) * 0.5;
  const finalCenterZ = (bounds.min.z + bounds.max.z) * 0.5;

  // --- Kollisionskörper
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  col.name = 'COL_partikel_magnum';
  col.position.set(finalCenterX, height * 0.5, finalCenterZ);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_modus';
  use.position.set(finalCenterX, height + 0.055, finalCenterZ - 0.035);
  use.userData = {
    label: 'Partikel-Magnum: Feuermodus wählen',
    radius: 0.55,
  };
  root.add(use);

  // --- Lichtpunkt; Farbe und Intensität folgen dem gewählten Modus
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_modus';
  lamp.position.set(finalCenterX, height + 0.025, finalCenterZ - 0.012);
  lamp.userData = {
    color: '#ff7926',
    intensity: 1.15,
    distance: 0.75,
  };
  root.add(lamp);

  // --- Zustand und Animation
  let zeit = 0;
  let letzte = null;
  let waehlerWinkel = leverPivot.rotation.x;

  function normalisiereModus(index) {
    if (typeof index === 'string') {
      const name = index.toLowerCase();
      if (name.includes('bet')) return 0;
      if (name.includes('töt') || name.includes('tot') || name.includes('kill')) return 1;
      if (name.includes('verb') || name.includes('burn')) return 2;
      return null;
    }

    const number = Number(index);
    if (!Number.isFinite(number) || number < 0 || number > 2) return null;
    return Math.floor(number);
  }

  function setModus(index) {
    const neuerModus = normalisiereModus(index);
    if (neuerModus === null) return false;
    modusIndex = neuerModus;
    return true;
  }

  function update(dt) {
    zeit += dt;

    const zielFarbe = modeColors[modusIndex];
    const farbAnteil = Math.min(1, dt * 7);

    crystalMaterial.color.lerp(zielFarbe, farbAnteil);
    crystalMaterial.emissive.lerp(zielFarbe, farbAnteil);
    crystalMaterial.emissiveIntensity +=
      ((modusIndex === 2 ? 2.15 : 1.6) - crystalMaterial.emissiveIntensity) *
      farbAnteil;

    for (let i = 0; i < indicatorMaterials.length; i++) {
      const material = indicatorMaterials[i];
      const aktiv = i === modusIndex;
      const puls = aktiv ? 1.9 + Math.sin(zeit * 4.2) * 0.5 : 0.08;

      material.emissiveIntensity +=
        (puls - material.emissiveIntensity) * Math.min(1, dt * 10);

      const zielAnzeigefarbe = modeColors[i].clone().multiplyScalar(aktiv ? 0.95 : 0.3);
      material.color.lerp(zielAnzeigefarbe, farbAnteil);
    }

    const zielWinkel = (modusIndex - 1) * 0.42;
    waehlerWinkel += (zielWinkel - waehlerWinkel) * Math.min(1, dt * 10);
    leverPivot.rotation.x = waehlerWinkel;

    domeMaterial.emissiveIntensity =
      1.2 + Math.sin(zeit * 2.3) * 0.13;

    lamp.userData.color = `#${zielFarbe.getHexString()}`;
    lamp.userData.intensity = 1.05 + Math.sin(zeit * 4.2) * 0.16;
  }

  receiver.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;
  root.userData.api = {
    modusSetzen(index) {
      return setModus(index);
    },
    modusWechseln() {
      modusIndex = (modusIndex + 1) % 3;
      return modeNames[modusIndex];
    },
    get modus() {
      return modeNames[modusIndex];
    },
    get modusIndex() {
      return modusIndex;
    },
    get energiezelleGeladen() {
      return true;
    },
  };

  root.userData.actions = [
    {
      id: 'modus_betäuben',
      label: 'Betäubungsmodus (orange)',
      run: () => setModus(0),
    },
    {
      id: 'modus_toeten',
      label: 'Tötungsmodus (rot)',
      run: () => setModus(1),
    },
    {
      id: 'modus_verbrennen',
      label: 'Verbrennungsmodus (grün)',
      run: () => setModus(2),
    },
    {
      id: 'modus_wechseln',
      label: 'Nächsten Feuermodus wählen',
      run: () => root.userData.api.modusWechseln(),
    },
  ];

  if (opts && opts.modus !== undefined) {
    setModus(opts.modus);
  }

  return root;
}

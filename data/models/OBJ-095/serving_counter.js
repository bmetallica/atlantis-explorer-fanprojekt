import * as THREE from 'three';

export const steckbrief = {
  name: 'serving_counter',
  art: 'Standobjekt an der Wand',
  masse: '4,80 × 0,90 × 0,90 m (Korpus B × H × T), Spuckschutz bis ca. 1,45 m',
  benutzen: 'INT_tablett → Tablett nehmen; INT_essen → Essen holen; INT-Punkte öffnen ein Aktionsmenü',
  lichter: 'LAMP_warm_links, LAMP_warm_mitte, LAMP_warm_rechts (bernsteinfarben, zuschaltbar), LAMP_front_slots (eisblau)',
  animation: 'Wärmelampen blenden weich ein und aus; Warmhaltebecken-Deckel öffnen und schließen',
  quelle: 'selbst gebaut nach Beschreibung',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'serving_counter';

  // Ursprung: Mitte der Unterseite, Rückseite bei z = -0,45 m, Bedienseite bei +Z.
  const kit = (name, options = {}) => new THREE.MeshStandardMaterial({
    name: `KIT_${name}`,
    ...options,
  });

  const steel = new THREE.MeshStandardMaterial({
    name: 'stainless_steel',
    color: 0xb8c4cb,
    metalness: 0.88,
    roughness: 0.26,
  });

  const darkSteel = new THREE.MeshStandardMaterial({
    name: 'dark_stainless_steel',
    color: 0x394b59,
    metalness: 0.82,
    roughness: 0.34,
  });

  const black = new THREE.MeshStandardMaterial({
    name: 'dark_interior',
    color: 0x071017,
    metalness: 0.25,
    roughness: 0.62,
  });

  const amberMat = new THREE.MeshStandardMaterial({
    name: 'amber_heat_lamp',
    color: 0x4a2410,
    emissive: 0xff9d42,
    emissiveIntensity: 2.2,
    metalness: 0.25,
    roughness: 0.3,
  });

  const iceGlow = new THREE.MeshStandardMaterial({
    name: 'ice_blue_light_slot',
    color: 0x173b4d,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.6,
    metalness: 0.2,
    roughness: 0.28,
  });

  const glass = kit('glass', {
    color: 0x8bcde0,
    transparent: true,
    opacity: 0.32,
    metalness: 0.1,
    roughness: 0.12,
    side: THREE.DoubleSide,
  });

  const addBox = (w, h, d, x, y, z, material, parent = root) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (radius, height, x, y, z, material, parent = root, radialSegments = 16) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, radialSegments),
      material,
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // --- Korpus und Edelstahl-Arbeitsfläche
  addBox(4.72, 0.78, 0.78, 0, 0.39, 0, kit('wallDark'));
  addBox(4.80, 0.08, 0.90, 0, 0.86, 0, steel);
  addBox(4.74, 0.06, 0.08, 0, 0.08, 0.33, kit('copper'));
  addBox(4.74, 0.06, 0.08, 0, 0.08, -0.33, kit('copper'));

  // Schattenfuge unter der Arbeitsplatte.
  addBox(4.66, 0.045, 0.82, 0, 0.805, 0, darkSteel);

  // --- Frontseite: bronzene Atlantis-Paneele mit eisblauen Lichtschlitzen
  const frontPanel = addBox(4.70, 0.66, 0.055, 0, 0.44, 0.405, kit('copper'));
  frontPanel.name = 'Frontpaneele_Bronze';

  const slotCount = 11;
  const slotGeometry = new THREE.BoxGeometry(0.032, 0.48, 0.014);
  const slots = new THREE.InstancedMesh(slotGeometry, iceGlow, slotCount);
  slots.name = 'Lichtschlitze_Front';
  const dummy = new THREE.Object3D();
  for (let i = 0; i < slotCount; i++) {
    dummy.position.set(-2.0 + i * 0.40, 0.45, 0.442);
    dummy.updateMatrix();
    slots.setMatrixAt(i, dummy.matrix);
  }
  slots.instanceMatrix.needsUpdate = true;
  root.add(slots);

  // Vertikale Paneeltrenner als feine Stahlkanten.
  for (let i = 0; i < 6; i++) {
    const x = -2.0 + i * 0.80;
    addBox(0.014, 0.60, 0.064, x, 0.44, 0.418, steel);
  }

  // --- Seitentrisse und Sockel
  addBox(0.07, 0.78, 0.82, -2.365, 0.39, 0, kit('wallDark'));
  addBox(0.07, 0.78, 0.82, 2.365, 0.39, 0, kit('wallDark'));
  addBox(4.55, 0.10, 0.66, 0, 0.05, 0, darkSteel);

  // --- Sechs Warmhaltebecken (GN-Behälter)
  const panCenters = [-1.90, -1.14, -0.38, 0.38, 1.14, 1.90];
  const lids = [];
  const panFood = new THREE.MeshStandardMaterial({
    name: 'warm_food',
    color: 0x8a5425,
    emissive: 0x2b1204,
    emissiveIntensity: 0.15,
    roughness: 0.85,
  });

  panCenters.forEach((x, index) => {
    const panZ = -0.07;

    // Metallischer Beckenrand, dunkle Innenwanne und flacher Inhalt.
    addBox(0.61, 0.035, 0.55, x, 0.905, panZ, steel);
    addBox(0.54, 0.025, 0.47, x, 0.925, panZ, black);
    addBox(0.47, 0.014, 0.39, x, 0.942, panZ + 0.01, panFood);

    // Kleine Führungsnasen an den Seiten.
    addBox(0.035, 0.035, 0.48, x - 0.315, 0.92, panZ, steel);
    addBox(0.035, 0.035, 0.48, x + 0.315, 0.92, panZ, steel);

    // Deckel mit hinterer Scharnierachse. Die Achse liegt bei z = -0,34.
    const lidGroup = new THREE.Group();
    lidGroup.position.set(x, 0.952, panZ - 0.27);
    root.add(lidGroup);

    const lid = addBox(0.585, 0.025, 0.50, 0, 0, 0.25, steel, lidGroup);
    lid.name = `Warmhaltebecken_Deckel_${index + 1}`;

    const handle = addBox(0.22, 0.035, 0.045, 0, 0.045, 0.49, darkSteel, lidGroup);
    handle.name = `Deckelgriff_${index + 1}`;

    const hinge = addCylinder(0.018, 0.60, x, 0.952, panZ - 0.27, darkSteel);
    hinge.rotation.z = Math.PI / 2;

    // Deckel öffnen nach hinten/oben.
    const initialOpen = index % 2 === 0;
    lidGroup.rotation.x = initialOpen ? -1.02 : 0;
    lids.push({ group: lidGroup, open: initialOpen, target: initialOpen ? -1.02 : 0 });

    // Schöpfkelle: flacher Griff und Kellenkopf.
    const spoon = new THREE.Group();
    spoon.position.set(x + 0.16, 0.965, panZ + 0.02);
    spoon.rotation.y = (index % 2 === 0 ? 1 : -1) * 0.12;
    root.add(spoon);

    const handleSpoon = addCylinder(0.009, 0.19, 0, 0, 0, steel, spoon, 10);
    handleSpoon.rotation.x = Math.PI / 2;

    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), steel);
    bowl.scale.set(0.72, 0.28, 1.0);
    bowl.position.set(0, -0.008, 0.11);
    spoon.add(bowl);
  });

  // --- Schräger Glas-Spuckschutz
  const guard = addBox(4.52, 0.58, 0.018, 0, 1.24, -0.10, glass);
  guard.name = 'Glas_Spuckschutz';
  guard.rotation.x = 0.55;

  // Stahlstützen und Querstreben.
  const supportXs = [-2.27, -0.76, 0.76, 2.27];
  supportXs.forEach((x) => {
    const post = addCylinder(0.024, 0.54, x, 1.16, 0.01, steel);
    post.name = 'Spuckschutz_Stuetze';
  });

  addBox(4.60, 0.035, 0.035, 0, 1.415, 0.035, steel);
  addBox(4.60, 0.035, 0.035, 0, 1.055, -0.235, steel);

  // --- Wärmelampenleiste unter dem Spuckschutz
  const lampMeshes = [];
  [-1.42, 0, 1.42].forEach((x, index) => {
    const housing = addBox(1.24, 0.075, 0.12, x, 1.075, -0.06, darkSteel);
    housing.name = `Waermelampen_Gehaeuse_${index + 1}`;
    const tube = addBox(1.08, 0.028, 0.075, x, 1.03, -0.035, amberMat);
    tube.name = `Waermelampe_${index + 1}`;
    lampMeshes.push(tube);
  });

  // --- Vordere Tablett-Rutsche aus Edelstahlrohren
  const railGeometry = new THREE.CylinderGeometry(0.026, 0.026, 4.56, 16);
  [0.54, 0.68].forEach((z, index) => {
    const rail = new THREE.Mesh(railGeometry, steel);
    rail.name = `Tablett_Rutschrohr_${index + 1}`;
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0.80, z);
    root.add(rail);
  });

  // Querstreben und Halterungen.
  [-2.18, -0.73, 0.73, 2.18].forEach((x) => {
    addBox(0.035, 0.035, 0.18, x, 0.80, 0.61, steel);
    addBox(0.035, 0.12, 0.035, x, 0.855, 0.54, steel);
  });
  addBox(4.45, 0.03, 0.03, 0, 0.745, 0.61, darkSteel);

  // --- Links: Stapel aus Tabletts
  for (let i = 0; i < 4; i++) {
    const tray = addBox(0.38, 0.028, 0.31, -2.22, 0.923 + i * 0.032, -0.04, steel);
    tray.name = `Tablett_Stapel_${i + 1}`;
    addBox(0.32, 0.006, 0.25, -2.22, 0.941 + i * 0.032, -0.04, darkSteel);
  }

  // Besteckbehälter neben den Tabletts.
  const cutlery = addBox(0.18, 0.15, 0.18, -2.20, 1.035, 0.27, darkSteel);
  cutlery.name = 'Besteckbehaelter';
  for (let i = 0; i < 5; i++) {
    const utensil = addBox(0.012, 0.15, 0.018, -2.27 + i * 0.035, 1.10, 0.27, steel);
    utensil.rotation.z = (i - 2) * 0.04;
  }

  // --- Rechts: Getränkeschale und Becher
  const bowl = addCylinder(0.17, 0.095, 2.22, 0.955, -0.04, steel);
  bowl.name = 'Getraenkeschale';
  const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 8, 24), steel);
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.set(2.22, 1.003, -0.04);
  root.add(bowlRim);

  for (let i = 0; i < 3; i++) {
    const cup = addCylinder(0.052, 0.12, 2.10 + i * 0.11, 1.03, 0.27, kit('hull'));
    cup.name = `Becher_${i + 1}`;
  }

  // --- Kollisionskörper
  const col = new THREE.Mesh(new THREE.BoxGeometry(4.80, 1.46, 1.14));
  col.name = 'COL_serving_counter';
  col.position.set(0, 0.73, 0.12);
  col.userData.aktiv = true;
  root.add(col);

  // --- Lichtquellen
  const warmLamps = [];
  [-1.42, 0, 1.42].forEach((x, index) => {
    const lamp = new THREE.Object3D();
    lamp.name = `LAMP_warm_${['links', 'mitte', 'rechts'][index]}`;
    lamp.position.set(x, 1.02, 0.10);
    lamp.userData = {
      color: '#ffb35c',
      intensity: 5,
      distance: 2.8,
    };
    root.add(lamp);
    warmLamps.push(lamp);
  });

  // Eisblaues Licht für die Frontschlitzen.
  const frontLamp = new THREE.Object3D();
  frontLamp.name = 'LAMP_front_slots';
  frontLamp.position.set(0, 0.50, 0.58);
  frontLamp.userData = {
    color: '#6fe3ff',
    intensity: 2.5,
    distance: 2.0,
  };
  root.add(frontLamp);

  // --- Benutzen-Punkte auf der Bedienseite
  const useTray = new THREE.Object3D();
  useTray.name = 'INT_tablett';
  useTray.position.set(-1.75, 0.96, 0.91);
  useTray.userData = { label: 'Tablett nehmen', radius: 0.8 };
  root.add(useTray);

  const useFood = new THREE.Object3D();
  useFood.name = 'INT_essen';
  useFood.position.set(0.25, 1.00, 0.91);
  useFood.userData = { label: 'Essen holen', radius: 0.9 };
  root.add(useFood);

  // --- Zustand und Animation
  let warmOn = true;
  let warmLevel = 1;
  let lastTime = null;

  function setLids(open) {
    lids.forEach((lid) => {
      lid.open = open;
      lid.target = open ? -1.02 : 0;
    });
  }

  function setWarmLamps(on) {
    warmOn = Boolean(on);
  }

  function update(dt) {
    const blend = Math.min(1, dt * 6);
    const targetLevel = warmOn ? 1 : 0;
    warmLevel += (targetLevel - warmLevel) * blend;

    amberMat.emissiveIntensity = 0.04 + warmLevel * 2.35;
    warmLamps.forEach((lamp) => {
      lamp.userData.intensity = 0.15 + warmLevel * 4.85;
    });

    lids.forEach((lid) => {
      lid.group.rotation.x += (lid.target - lid.group.rotation.x) * Math.min(1, dt * 5.5);
    });
  }

  const antrieb = root.getObjectByName('Frontpaneele_Bronze');
  antrieb.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  const api = {
    // Eindeutige Methodennamen vermeiden die Kollision mit dem Getter
    // "waermelampenAn".
    setWaermelampen(on = true) {
      setWarmLamps(on);
    },
    einschalten() {
      setWarmLamps(true);
    },
    ausschalten() {
      setWarmLamps(false);
    },
    deckelOeffnen() {
      setLids(true);
    },
    deckelSchliessen() {
      setLids(false);
    },
    get waermelampenAn() {
      return warmOn;
    },
    get deckelOffen() {
      return lids.some((lid) => lid.open);
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'waermelampen_an',
      label: 'Wärmelampen einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'waermelampen_aus',
      label: 'Wärmelampen ausschalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'deckel_auf',
      label: 'Warmhaltebecken-Deckel öffnen',
      run: () => api.deckelOeffnen(),
    },
    {
      id: 'deckel_zu',
      label: 'Warmhaltebecken-Deckel schließen',
      run: () => api.deckelSchliessen(),
    },
  ];

  return root;
}

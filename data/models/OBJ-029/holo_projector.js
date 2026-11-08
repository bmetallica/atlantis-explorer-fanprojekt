// Antiker Hologramm-Projektor, OBJ-029
// Standobjekt: Ursprung = Mitte der Unterseite, Vorderseite nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'holo_projector',
  art: 'Standobjekt',
  masse: 'Podest 1,30 × 1,30 × 1,30 m; Projektionsvolumen ca. 6,90 × 4,30 × 6,90 m',
  wohin: 'ATL-029 (Holo-Raum), zentrale Projektionszone',
  benutzen: 'INT_programm → Menü für Geschichtsprogramm, Sternkarte und Zukunftslehrprogramm',
  lichter: 'LAMP_hologramm (weiß-gold), LAMP_sternenraum (violett-blau)',
  animation: 'Sanftes Ein- und Ausblenden, weiche Programmwechsel, langsam rotierendes Sternfeld, pulsierender Projektorring',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'holo_projector';

  const matSteel = kit('wallDark');
  const matPearl = kit('pillar');
  const matBronze = kit('copper');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');

  const physical = (geometry, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  // -------------------------------------------------------------------------
  // Pultartiges Projektionspodest
  // -------------------------------------------------------------------------
  const base = physical(
    new THREE.CylinderGeometry(0.64, 0.68, 0.14, 48),
    matSteel,
    0,
    0.07,
    0
  );

  physical(
    new THREE.CylinderGeometry(0.57, 0.52, 0.12, 48),
    matBronze,
    0,
    0.20,
    0
  );

  const column = physical(
    new THREE.CylinderGeometry(0.47, 0.55, 0.72, 48),
    matPearl,
    0,
    0.62,
    0
  );

  physical(
    new THREE.CylinderGeometry(0.49, 0.49, 0.09, 48),
    matBronze,
    0,
    1.015,
    0
  );

  physical(
    new THREE.CylinderGeometry(0.52, 0.50, 0.08, 48),
    matSteel,
    0,
    1.10,
    0
  );

  // Umlaufende Leuchtringe.
  const amberRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.565, 0.017, 8, 64),
    matAmber
  );
  amberRing.rotation.x = Math.PI / 2;
  amberRing.position.y = 0.27;
  root.add(amberRing);

  const upperRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.492, 0.012, 6, 64),
    matGlow
  );
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = 0.91;
  root.add(upperRing);

  // Vertikale Bernsteineinlagen an der Säule.
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.48, 0.018),
      i % 2 === 0 ? matAmber : matBronze
    );
    strip.position.set(
      Math.sin(angle) * 0.515,
      0.61,
      Math.cos(angle) * 0.515
    );
    strip.rotation.y = angle;
    root.add(strip);
  }

  // Angekippte Bedienkonsole: zuerst flach, danach als Gruppe neigen.
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, 1.16, 0.13);
  consoleGroup.rotation.x = -0.48;
  root.add(consoleGroup);

  const consoleFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.70, 0.36, 0.09),
    matSteel
  );
  consoleFrame.castShadow = true;
  consoleGroup.add(consoleFrame);

  const consoleBorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.30, 0.018),
    matBronze
  );
  consoleBorder.position.z = 0.047;
  consoleGroup.add(consoleBorder);

  const screenMaterial = new THREE.MeshBasicMaterial({
    name: 'holo_console_screen',
    color: 0x8feaff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const consoleScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.215, 0.012),
    screenMaterial
  );
  consoleScreen.position.z = 0.061;
  consoleGroup.add(consoleScreen);

  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.020, 0.026),
      i === 1 ? matGlow : matBronze
    );
    button.position.set((i - 1) * 0.115, -0.143, 0.065);
    consoleGroup.add(button);
  }

  // Kompakter Projektionskopf hinter der Konsole.
  const emitterStem = physical(
    new THREE.CylinderGeometry(0.085, 0.11, 0.16, 20),
    matBronze,
    0,
    1.20,
    -0.24
  );

  const emitterLensMaterial = new THREE.MeshStandardMaterial({
    name: 'KIT_glow',
    color: 0x6fe3ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.6,
    metalness: 0.15,
    roughness: 0.25,
  });
  const emitterLens = physical(
    new THREE.CylinderGeometry(0.13, 0.13, 0.035, 28),
    emitterLensMaterial,
    0,
    1.30,
    -0.24
  );

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const prong = physical(
      new THREE.BoxGeometry(0.035, 0.21, 0.045),
      matBronze,
      Math.cos(angle) * 0.16,
      1.28,
      -0.24 + Math.sin(angle) * 0.16
    );
    prong.rotation.z = Math.cos(angle) * -0.20;
    prong.rotation.x = Math.sin(angle) * 0.20;
  }

  // -------------------------------------------------------------------------
  // Holografische Materialien
  // -------------------------------------------------------------------------
  const holoGroups = {};

  function holoMaterial(name, color, opacity = 0.5, wireframe = false) {
    return new THREE.MeshBasicMaterial({
      name,
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      wireframe,
    });
  }

  function registerHolo(group, material, maxOpacity) {
    if (!group.userData.holoMats) group.userData.holoMats = [];
    if (!group.userData.holoMats.some((entry) => entry.material === material)) {
      group.userData.holoMats.push({ material, maxOpacity });
    }
  }

  function applyGroupAlpha(group, alpha) {
    group.visible = alpha > 0.002;
    const entries = group.userData.holoMats || [];
    for (const entry of entries) {
      entry.material.opacity = entry.maxOpacity * alpha;
    }
  }

  // -------------------------------------------------------------------------
  // Violett-blauer Sternenhimmel über der gesamten Kuppel
  // -------------------------------------------------------------------------
  const world = new THREE.Group();
  world.name = 'holo_sternenhimmel';
  root.add(world);
  holoGroups.welt = world;

  let seed = 29031;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const starPositions = [];
  const starColors = [];
  const centerY = 0.76;
  const domeRadius = 3.42;

  for (let i = 0; i < 1450; i++) {
    const theta = random() * Math.PI * 0.5;
    const phi = random() * Math.PI * 2;
    const radius = domeRadius * (0.91 + random() * 0.09);
    const horizontal = Math.sin(theta) * radius;

    starPositions.push(
      Math.cos(phi) * horizontal,
      centerY + Math.cos(theta) * radius,
      Math.sin(phi) * horizontal
    );

    const warm = random() > 0.84;
    const brightness = 0.48 + random() * 0.52;
    if (warm) {
      starColors.push(brightness, brightness * 0.76, brightness * 0.52);
    } else {
      starColors.push(brightness * 0.72, brightness * 0.61, brightness);
    }
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(starColors, 3)
  );

  const starMaterial = new THREE.PointsMaterial({
    name: 'holo_stars',
    size: 0.038,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  registerHolo(world, starMaterial, 0.92);

  const stars = new THREE.Points(starGeometry, starMaterial);
  world.add(stars);

  // Geografische Rasterlinien der projizierten Kuppel.
  const domeLineMaterial = holoMaterial('holo_dome_grid', 0x9b83ff, 0.13);
  registerHolo(world, domeLineMaterial, 0.13);

  for (let level = 0; level < 7; level++) {
    const dy = 0.16 + level * 0.34;
    const radius = Math.sqrt(
      Math.max(0.01, domeRadius * domeRadius - dy * dy)
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.006, 4, 72),
      domeLineMaterial
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = centerY + dy;
    world.add(ring);
  }

  // -------------------------------------------------------------------------
  // Geschichtsprogramm: Melia und Ganos Lals Lehrprogramm
  // -------------------------------------------------------------------------
  const geschichte = new THREE.Group();
  geschichte.name = 'holo_programm_geschichte';
  root.add(geschichte);
  holoGroups.geschichte = geschichte;

  const paleGold = holoMaterial('holo_white_gold', 0xffe6a3, 0.54);
  const warmGold = holoMaterial('holo_gold', 0xffc96b, 0.48);
  const childViolet = holoMaterial('holo_child_violet', 0xc9adff, 0.42);
  registerHolo(geschichte, paleGold, 0.54);
  registerHolo(geschichte, warmGold, 0.48);
  registerHolo(geschichte, childViolet, 0.42);

  // Geschlossene holografische Projektionsbasis.
  const historyBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.67, 0.67, 0.018, 64),
    warmGold
  );
  historyBase.position.set(0.15, 1.245, 0.10);
  geschichte.add(historyBase);

  const historyRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.61, 0.011, 4, 64),
    paleGold
  );
  historyRing.rotation.x = Math.PI / 2;
  historyRing.position.set(0.15, 1.258, 0.10);
  geschichte.add(historyRing);

  function buildHumanoid(group, options) {
    const {
      x = 0,
      y = 1.26,
      z = 0,
      scale = 1,
      robeMaterial,
      skinMaterial,
      child = false,
    } = options;

    const figure = new THREE.Group();
    figure.position.set(x, y, z);
    figure.scale.setScalar(scale);
    group.add(figure);

    const profile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(child ? 0.27 : 0.32, 0.012),
      new THREE.Vector2(child ? 0.25 : 0.30, 0.07),
      new THREE.Vector2(child ? 0.22 : 0.26, 0.38),
      new THREE.Vector2(child ? 0.17 : 0.20, 0.78),
      new THREE.Vector2(child ? 0.13 : 0.17, 1.08),
      new THREE.Vector2(child ? 0.105 : 0.135, 1.23),
      new THREE.Vector2(0.0, 1.28),
    ];

    const robe = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 32),
      robeMaterial
    );
    figure.add(robe);

    const shoulders = new THREE.Mesh(
      new THREE.SphereGeometry(child ? 0.13 : 0.17, 16, 10),
      robeMaterial
    );
    shoulders.position.y = child ? 1.02 : 1.18;
    shoulders.scale.set(1.0, 0.48, 0.66);
    figure.add(shoulders);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(
        child ? 0.035 : 0.046,
        child ? 0.045 : 0.058,
        child ? 0.10 : 0.13,
        10
      ),
      skinMaterial
    );
    neck.position.y = child ? 1.16 : 1.33;
    figure.add(neck);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(child ? 0.115 : 0.145, 20, 14),
      skinMaterial
    );
    head.position.y = child ? 1.31 : 1.49;
    head.scale.set(0.90, 1.08, 0.92);
    figure.add(head);

    // Kleine Haube und ein nach +Z gerichtetes Profil.
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(child ? 0.118 : 0.148, 16, 10),
      robeMaterial
    );
    hair.position.set(0, child ? 1.345 : 1.525, -0.015);
    hair.scale.set(0.93, 0.68, 0.94);
    figure.add(hair);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(child ? 0.018 : 0.024, child ? 0.05 : 0.065, 8),
      skinMaterial
    );
    nose.position.set(0, child ? 1.31 : 1.49, child ? 0.112 : 0.138);
    nose.rotation.x = Math.PI / 2;
    figure.add(nose);

    for (const eyeX of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 8, 6),
        paleGold
      );
      eye.position.set(
        eyeX * (child ? 0.037 : 0.048),
        child ? 1.345 : 1.525,
        child ? 0.118 : 0.143
      );
      figure.add(eye);
    }

    const armGeometry = new THREE.CapsuleGeometry(
      child ? 0.035 : 0.047,
      child ? 0.27 : 0.39,
      4,
      8
    );

    const leftArm = new THREE.Mesh(armGeometry, robeMaterial);
    leftArm.position.set(child ? -0.18 : -0.235, child ? 0.76 : 0.96, 0.015);
    leftArm.rotation.z = child ? -0.13 : -0.17;
    figure.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, robeMaterial);
    rightArm.position.set(child ? 0.18 : 0.235, child ? 0.76 : 0.96, 0.015);
    rightArm.rotation.z = child ? 0.13 : 0.17;
    figure.add(rightArm);

    const handGeometry = new THREE.SphereGeometry(child ? 0.045 : 0.057, 12, 8);
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(child ? -0.225 : -0.315, child ? 0.60 : 0.74, 0.03);
    figure.add(leftHand);

    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(child ? 0.225 : 0.315, child ? 0.60 : 0.74, 0.03);
    figure.add(rightHand);

    return { figure, leftArm, rightArm };
  }

  const melia = buildHumanoid(geschichte, {
    x: -0.24,
    y: 1.26,
    z: 0.18,
    scale: 1,
    robeMaterial: paleGold,
    skinMaterial: warmGold,
  });
  melia.figure.rotation.y = 0.12;

  const child = buildHumanoid(geschichte, {
    x: 0.60,
    y: 1.26,
    z: 0.04,
    scale: 0.70,
    robeMaterial: childViolet,
    skinMaterial: paleGold,
    child: true,
  });
  child.figure.rotation.y = -0.18;

  // Feine Datenringe um die historische Szene.
  const dataRingMaterial = holoMaterial('holo_history_data', 0xffd785, 0.28);
  registerHolo(geschichte, dataRingMaterial, 0.28);
  for (let i = 0; i < 3; i++) {
    const dataRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88 + i * 0.17, 0.006, 4, 64),
      dataRingMaterial
    );
    dataRing.rotation.x = Math.PI / 2;
    dataRing.position.set(0.15, 1.30 + i * 0.32, 0.10);
    geschichte.add(dataRing);
  }

  // -------------------------------------------------------------------------
  // Sternkarte des Lantea-Systems
  // -------------------------------------------------------------------------
  const sternkarte = new THREE.Group();
  sternkarte.name = 'holo_programm_sternkarte';
  root.add(sternkarte);
  holoGroups.sternkarte = sternkarte;

  const planetViolet = holoMaterial('holo_planet_violet', 0xb98cff, 0.64);
  const planetBlue = holoMaterial('holo_planet_blue', 0x6cc8ff, 0.62);
  const planetGold = holoMaterial('holo_planet_gold', 0xffd58a, 0.64);
  const orbitMaterial = holoMaterial('holo_orbits', 0xd1baff, 0.38);
  registerHolo(sternkarte, planetViolet, 0.64);
  registerHolo(sternkarte, planetBlue, 0.62);
  registerHolo(sternkarte, planetGold, 0.64);
  registerHolo(sternkarte, orbitMaterial, 0.38);

  function addPlanet(group, radius, x, y, z, material, ring = false) {
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      material
    );
    planet.position.set(x, y, z);
    group.add(planet);

    if (ring) {
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.65, radius * 0.035, 5, 56),
        material
      );
      ringMesh.position.copy(planet.position);
      ringMesh.rotation.set(1.08, 0.15, 0.20);
      group.add(ringMesh);
    }
  }

  addPlanet(sternkarte, 0.43, 0, 2.30, -0.72, planetViolet, true);
  addPlanet(sternkarte, 0.23, -1.36, 1.97, -0.43, planetBlue);
  addPlanet(sternkarte, 0.17, 1.30, 2.42, -0.58, planetGold);

  for (let i = 0; i < 4; i++) {
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.91 + i * 0.36, 0.008, 4, 72),
      orbitMaterial
    );
    orbit.position.set(0, 2.24 + (i - 1) * 0.10, -0.72);
    orbit.rotation.x = Math.PI / 2;
    orbit.rotation.y = (i - 1) * 0.18;
    sternkarte.add(orbit);
  }

  // -------------------------------------------------------------------------
  // McKay-Programm: 48.000 Jahre in der Zukunft
  // -------------------------------------------------------------------------
  const zukunft = new THREE.Group();
  zukunft.name = 'holo_programm_zukunft';
  root.add(zukunft);
  holoGroups.zukunft = zukunft;

  const futureBlue = holoMaterial('holo_future_blue', 0x8edcff, 0.60);
  const futureWhite = holoMaterial('holo_future_white', 0xeaf7ff, 0.62);
  const futureOrbit = holoMaterial('holo_future_orbit', 0xb296ff, 0.42);
  const futureGrid = holoMaterial('holo_future_grid', 0xd8cbff, 0.28, true);
  registerHolo(zukunft, futureBlue, 0.60);
  registerHolo(zukunft, futureWhite, 0.62);
  registerHolo(zukunft, futureOrbit, 0.42);
  registerHolo(zukunft, futureGrid, 0.28);

  const futureGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 24, 16),
    futureBlue
  );
  futureGlobe.position.set(0, 2.25, -0.72);
  zukunft.add(futureGlobe);

  const futureGlobeGrid = new THREE.Mesh(
    new THREE.SphereGeometry(0.535, 16, 10),
    futureGrid
  );
  futureGlobeGrid.position.copy(futureGlobe.position);
  zukunft.add(futureGlobeGrid);

  for (let i = 0; i < 3; i++) {
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.76 + i * 0.25, 0.009, 4, 64),
      futureOrbit
    );
    orbit.position.copy(futureGlobe.position);
    orbit.rotation.set(
      Math.PI / 2 + (i - 1) * 0.25,
      i * 0.34,
      (i - 1) * 0.12
    );
    zukunft.add(orbit);
  }

  const futurePerson = buildHumanoid(zukunft, {
    x: -1.08,
    y: 1.26,
    z: 0.18,
    scale: 1,
    robeMaterial: futureWhite,
    skinMaterial: futureBlue,
  });
  futurePerson.figure.rotation.y = 0.42;

  const markerMaterial = holoMaterial('holo_future_markers', 0xc7b5ff, 0.40);
  registerHolo(zukunft, markerMaterial, 0.40);
  for (let i = 0; i < 10; i++) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.15 + (i % 3) * 0.035, 0.022),
      markerMaterial
    );
    const angle = (i / 10) * Math.PI * 2;
    marker.position.set(
      Math.cos(angle) * 1.48,
      1.75 + (i % 4) * 0.27,
      -0.26 + Math.sin(angle) * 0.60
    );
    zukunft.add(marker);
  }

  // -------------------------------------------------------------------------
  // Kollision, Benutzen-Punkt und Licht
  // -------------------------------------------------------------------------
  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(1.30, 1.30, 1.30),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  collider.name = 'COL_podest';
  collider.position.set(0, 0.65, 0);
  root.add(collider);

  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_programm';
  usePoint.position.set(0, 1.08, 1.05);
  usePoint.userData = {
    label: 'Hologramm-Programme bedienen',
    radius: 0.9,
  };
  root.add(usePoint);

  const lampHologram = new THREE.Object3D();
  lampHologram.name = 'LAMP_hologramm';
  lampHologram.position.set(0, 1.65, 0.20);
  lampHologram.userData = {
    color: '#ffd99a',
    intensity: 7,
    distance: 5.5,
  };
  root.add(lampHologram);

  const lampStar = new THREE.Object3D();
  lampStar.name = 'LAMP_sternenraum';
  lampStar.position.set(0, 2.55, -0.35);
  lampStar.userData = {
    color: '#9d82ff',
    intensity: 4,
    distance: 5.0,
  };
  root.add(lampStar);

  // -------------------------------------------------------------------------
  // Zustand, Übergänge und selbstständige Animation
  // -------------------------------------------------------------------------
  let active = true;
  let intensity = 1;
  let desiredMode = 'geschichte';
  let time = 0;
  let lastTime = null;

  const modeNames = {
    geschichte: 'Geschichte Atlantis',
    sternkarte: 'Lantea-Sternkarte',
    zukunft: 'McKay-Programm',
  };

  const modeAlpha = {
    geschichte: 1,
    sternkarte: 0,
    zukunft: 0,
  };

  function approach(value, target, dt, speed) {
    return value + (target - value) * Math.min(1, dt * speed);
  }

  function update(dt) {
    time += dt;

    intensity = approach(intensity, active ? 1 : 0, dt, 3.2);

    for (const mode of Object.keys(modeAlpha)) {
      const target = active && mode === desiredMode ? 1 : 0;
      modeAlpha[mode] = approach(modeAlpha[mode], target, dt, 3.8);
    }

    applyGroupAlpha(world, intensity * 0.78);
    applyGroupAlpha(geschichte, modeAlpha.geschichte * intensity);
    applyGroupAlpha(sternkarte, modeAlpha.sternkarte * intensity);
    applyGroupAlpha(zukunft, modeAlpha.zukunft * intensity);

    stars.rotation.y += dt * 0.016;

    geschichte.rotation.y = Math.sin(time * 0.18) * 0.035;
    sternkarte.rotation.y = Math.sin(time * 0.13) * 0.050;
    zukunft.rotation.y = Math.sin(time * 0.16) * 0.035;

    // Melia führt während des Geschichtsprogramms langsam eine Geste aus.
    melia.rightArm.rotation.x = Math.sin(time * 0.75) * 0.12;
    melia.leftArm.rotation.x = -Math.sin(time * 0.75 + 0.6) * 0.08;
    child.rightArm.rotation.x = Math.sin(time * 1.1) * 0.18;

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    screenMaterial.opacity = 0.16 + intensity * (0.38 + pulse * 0.20);
    amberRing.material.emissiveIntensity = 0.65 + pulse * 0.55;
    upperRing.material.emissiveIntensity = 0.45 + intensity * 0.75;
    emitterLensMaterial.emissiveIntensity = 0.35 + intensity * (1.35 + pulse * 0.45);
  }

  base.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(Math.min(Math.max(now - lastTime, 0), 0.1));
    }
    lastTime = now;
  };

  root.userData.update = update;

  // -------------------------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // -------------------------------------------------------------------------
  const api = {
    einschalten() {
      active = true;
    },
    ausschalten() {
      active = false;
    },
    umschalten() {
      active = !active;
    },
    programmWaehlen(mode) {
      if (!Object.prototype.hasOwnProperty.call(modeNames, mode)) return false;
      desiredMode = mode;
      return true;
    },
    get aktiv() {
      return active;
    },
    get programm() {
      return desiredMode;
    },
    get programmname() {
      return modeNames[desiredMode];
    },
    get energieleistung() {
      return intensity;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'geschichte',
      label: 'Geschichte Atlantis abspielen',
      run: () => api.programmWaehlen('geschichte'),
    },
    {
      id: 'sternkarte',
      label: 'Lantea-Sternkarte anzeigen',
      run: () => api.programmWaehlen('sternkarte'),
    },
    {
      id: 'zukunft',
      label: 'McKay-Programm starten',
      run: () => api.programmWaehlen('zukunft'),
    },
    {
      id: 'start',
      label: 'Hologramm-Projektor einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'stopp',
      label: 'Hologramm-Projektor ausschalten',
      run: () => api.ausschalten(),
    },
  ];

  return root;
}

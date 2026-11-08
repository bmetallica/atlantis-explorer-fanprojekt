// Hydrokultur-Zuchtbehälter – OBJ-022
// Standobjekt: 2,80 × 1,72 × 0,95 m (B × H × T)
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'hydroponic_table',
  art: 'Standobjekt',
  masse: '2,80 × 1,72 × 0,95 (B × H × T, m)',
  wohin: 'ATL-016 Botanik-Labor, ATL-017 Pflanzenraum',
  benutzen: 'INT_bedienen, INT_ernten, INT_nachfuellen',
  lichter: 'LAMP_zuchtlicht_links, LAMP_zuchtlicht_rechts, LAMP_statusanzeige',
  animation: 'Zuchtleuchten pulsieren, Pflanzen schwingen sanft, Ernte- und Nährstoffanzeige reagieren',
  quelle: 'selbst gebaut, Spielergänzung im Ancient-Stil',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'hydroponic_table';

  const kit = (name, extra = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ name: `KIT_${name}` }, extra));

  const matHull = kit('hull', { color: 0xe8edf0, roughness: 0.48 });
  const matWall = kit('wall', { color: 0xaebbc5, roughness: 0.42, metalness: 0.28 });
  const matDark = kit('wallDark', { color: 0x243c50, roughness: 0.4, metalness: 0.55 });
  const matCopper = kit('copper', { color: 0x9a6a32, roughness: 0.3, metalness: 0.78 });
  const matRail = kit('rail', { color: 0xb6813d, roughness: 0.22, metalness: 0.85 });

  const matSoil = new THREE.MeshStandardMaterial({
    name: 'hydro_erde', color: 0x211b14, roughness: 0.95
  });
  const matLeaf = new THREE.MeshStandardMaterial({
    name: 'hydro_blatt', color: 0x1f7229, roughness: 0.62, metalness: 0.02
  });
  const matLeafLight = new THREE.MeshStandardMaterial({
    name: 'hydro_blatt_hell', color: 0x4c9b32, roughness: 0.65
  });
  const matStem = new THREE.MeshStandardMaterial({
    name: 'hydro_stamm', color: 0x347527, roughness: 0.8
  });
  const matGlow = new THREE.MeshStandardMaterial({
    name: 'hydro_glow',
    color: 0x8beeff,
    emissive: 0x38c8ff,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.12
  });
  const matAmber = new THREE.MeshStandardMaterial({
    name: 'hydro_amber',
    color: 0xd5a51e,
    emissive: 0xffa915,
    emissiveIntensity: 0.38,
    roughness: 0.24
  });
  const matGlass = new THREE.MeshStandardMaterial({
    name: 'hydro_glass',
    color: 0xc8e7ee,
    transparent: true,
    opacity: 0.28,
    roughness: 0.08,
    metalness: 0.05,
    depthWrite: false
  });
  const matScreen = new THREE.MeshStandardMaterial({
    name: 'hydro_screen',
    color: 0x071d28,
    emissive: 0x55d9ff,
    emissiveIntensity: 0.65,
    roughness: 0.28
  });

  // ------------------------------------------------------------------
  // Labortisch: 2,80 m breit, 0,95 m tief, Arbeitshöhe 0,75 m
  // ------------------------------------------------------------------
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.80, 0.08, 0.95), matHull);
  top.position.set(0, 0.71, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  root.add(top);

  const frontEdge = new THREE.Mesh(new THREE.BoxGeometry(2.80, 0.10, 0.035), matCopper);
  frontEdge.position.set(0, 0.71, 0.4825);
  root.add(frontEdge);

  const legGeo = new THREE.BoxGeometry(0.07, 0.67, 0.07);
  for (const x of [-1.31, 1.31]) {
    for (const z of [-0.38, 0.38]) {
      const leg = new THREE.Mesh(legGeo, matWall);
      leg.position.set(x, 0.335, z);
      leg.castShadow = true;
      root.add(leg);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.035, 12), matDark);
      foot.position.set(x, 0.0175, z);
      root.add(foot);
    }
  }

  const stretcher = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.06, 0.06), matDark);
  stretcher.position.set(0, 0.27, -0.38);
  root.add(stretcher);

  const underShelf = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.035, 0.76), matDark);
  underShelf.position.set(0, 0.30, 0);
  root.add(underShelf);

  // ------------------------------------------------------------------
  // Hydrokultur-Schalen auf der linken Hälfte
  // ------------------------------------------------------------------
  const trayPositions = [];
  for (const x of [-0.96, -0.16]) {
    for (const z of [-0.19, 0.19]) trayPositions.push(new THREE.Vector3(x, 0.75, z));
  }

  const trays = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.70, 0.12, 0.31),
    matHull,
    trayPositions.length
  );
  trays.name = 'hydro_anuchtschalen';
  trays.castShadow = true;
  trays.receiveShadow = true;

  const soilPatches = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.62, 0.018, 0.235),
    matSoil,
    trayPositions.length
  );
  soilPatches.name = 'hydro_substrat';

  const trayGlows = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.66, 0.012, 0.018),
    matGlow,
    trayPositions.length
  );
  trayGlows.name = 'hydro_schalen_leuchtlinie';

  const dummy = new THREE.Object3D();
  trayPositions.forEach((p, i) => {
    dummy.position.set(p.x, 0.81, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trays.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 0.867, p.z);
    dummy.updateMatrix();
    soilPatches.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 0.792, p.z + 0.151);
    dummy.updateMatrix();
    trayGlows.setMatrixAt(i, dummy.matrix);
  });
  trays.instanceMatrix.needsUpdate = true;
  soilPatches.instanceMatrix.needsUpdate = true;
  trayGlows.instanceMatrix.needsUpdate = true;
  root.add(trays, soilPatches, trayGlows);

  // ------------------------------------------------------------------
  // Weiße Pflanztöpfe auf der rechten Hälfte
  // ------------------------------------------------------------------
  const potPositions = [
    new THREE.Vector3(0.54, 0.75, -0.27),
    new THREE.Vector3(0.84, 0.75, -0.27),
    new THREE.Vector3(1.14, 0.75, -0.27),
    new THREE.Vector3(0.54, 0.75, 0.19),
  ];

  const pots = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.115, 0.085, 0.17, 18),
    matHull,
    potPositions.length
  );
  pots.name = 'hydro_pflanztoepfe';
  pots.castShadow = true;

  // Die Rotation gehört in die Geometrie, nicht auf das InstancedMesh:
  // Eine Objektrotation würde die实例-Positionen um den Ursprung verschieben.
  const potRimGeo = new THREE.TorusGeometry(0.111, 0.012, 6, 20);
  potRimGeo.rotateX(Math.PI / 2);

  const potRims = new THREE.InstancedMesh(potRimGeo, matCopper, potPositions.length);
  potRims.name = 'hydro_topfrand';

  const potSoil = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.097, 0.097, 0.012, 18),
    matSoil,
    potPositions.length
  );

  potPositions.forEach((p, i) => {
    dummy.position.set(p.x, p.y + 0.085, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pots.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, p.y + 0.173, p.z);
    dummy.updateMatrix();
    potRims.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, p.y + 0.165, p.z);
    dummy.updateMatrix();
    potSoil.setMatrixAt(i, dummy.matrix);
  });
  pots.instanceMatrix.needsUpdate = true;
  potRims.instanceMatrix.needsUpdate = true;
  potSoil.instanceMatrix.needsUpdate = true;
  root.add(pots, potRims, potSoil);

  // ------------------------------------------------------------------
  // Pflanzen: Setzlinge in Schalen und Jungpflanzen in Töpfen
  // ------------------------------------------------------------------
  const plants = [];
  for (const tray of trayPositions) {
    for (const dx of [-0.17, 0.17]) {
      plants.push({
        base: new THREE.Vector3(tray.x + dx, 0.878, tray.z),
        size: 0.72,
        phase: plants.length * 0.71
      });
    }
  }
  for (const pot of potPositions) {
    plants.push({
      base: new THREE.Vector3(pot.x, 0.915, pot.z),
      size: 1.0,
      phase: plants.length * 0.63
    });
  }

  const leavesPerPlant = 6;
  const leaves = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    matLeaf,
    plants.length * leavesPerPlant
  );
  leaves.name = 'hydro_pflanzenblaetter';
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  const stems = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.012, 0.018, 1, 7),
    matStem,
    plants.length
  );
  stems.name = 'hydro_pflanzenstiele';

  const leafRecords = [];
  plants.forEach((plant, pi) => {
    const stemHeight = 0.13 * plant.size;
    dummy.position.set(plant.base.x, plant.base.y + stemHeight / 2, plant.base.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, stemHeight, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(pi, dummy.matrix);

    for (let l = 0; l < leavesPerPlant; l++) {
      leafRecords.push({
        plant,
        angle: (l / leavesPerPlant) * Math.PI * 2 + plant.phase,
        elevation: 0.30 + (l % 3) * 0.12,
        length: (0.27 + (l % 2) * 0.055) * plant.size,
        width: (0.09 + (l % 3) * 0.012) * plant.size
      });
    }
  });
  stems.instanceMatrix.needsUpdate = true;
  root.add(stems, leaves);

  const leafColor = new THREE.Color();
  function updateLeaves(time) {
    leafRecords.forEach((record, i) => {
      const { plant, angle, elevation, length, width } = record;
      const sway = Math.sin(time * 0.85 + plant.phase) * 0.075;
      const az = angle + sway;
      const horizontal = Math.cos(elevation);
      const dir = new THREE.Vector3(
        Math.cos(az) * horizontal,
        Math.sin(elevation),
        Math.sin(az) * horizontal
      ).normalize();

      dummy.position.copy(plant.base).addScaledVector(dir, length * 0.50 + 0.07 * plant.size);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      dummy.scale.set(width, length * 0.5, 0.026);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);

      leafColor.setHex(i % 4 === 0 ? 0x4c9b32 : 0x1f7229);
      leaves.setColorAt(i, leafColor);
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  }
  updateLeaves(0);

  // ------------------------------------------------------------------
  // Nährlösungsflaschen mit bernsteinfarbener Flüssigkeit
  // ------------------------------------------------------------------
  const bottleProfile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.080, 0),
    new THREE.Vector2(0.080, 0.30),
    new THREE.Vector2(0.062, 0.36),
    new THREE.Vector2(0.030, 0.405),
    new THREE.Vector2(0.030, 0.47),
    new THREE.Vector2(0.001, 0.47)
  ];
  const bottleGeo = new THREE.LatheGeometry(bottleProfile, 20);
  const bottlePositions = [
    new THREE.Vector3(0.86, 0.75, 0.18),
    new THREE.Vector3(1.10, 0.75, 0.18),
    new THREE.Vector3(1.26, 0.75, -0.02),
    new THREE.Vector3(0.98, 0.75, 0.30)
  ];

  bottlePositions.forEach((p, i) => {
    const bottle = new THREE.Mesh(bottleGeo, matGlass);
    bottle.position.copy(p);
    bottle.castShadow = true;
    root.add(bottle);

    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.066, 0.070, 0.29, 18),
      matAmber
    );
    liquid.position.set(p.x, p.y + 0.147, p.z);
    root.add(liquid);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.035, 12), matCopper);
    cap.position.set(p.x, p.y + 0.485, p.z);
    root.add(cap);

    const label = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.006), matHull);
    label.position.set(p.x, p.y + 0.17, p.z + 0.078);
    root.add(label);

    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.008), matGlow);
    mark.position.set(p.x, p.y + 0.19, p.z + 0.083);
    root.add(mark);
  });

  // ------------------------------------------------------------------
  // Kleines Bedienpanel auf der Tischplatte
  // ------------------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(1.13, 0.75, -0.36);
  root.add(consoleGroup);

  const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.06, 0.20), matDark);
  consoleBase.position.y = 0.03;
  consoleGroup.add(consoleBase);

  const panelGroup = new THREE.Group();
  panelGroup.position.set(0, 0.06, 0);
  panelGroup.rotation.x = -0.42;
  consoleGroup.add(panelGroup);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.18), matWall);
  panelGroup.add(panel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.09), matScreen);
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, 0.014, 0.025);
  panelGroup.add(screen);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.034, 0.009, 0.026),
        col === 2 ? matAmber : matGlow
      );
      button.position.set(
        (col - 1) * 0.065,
        0.018,
        -0.047 - row * 0.032
      );
      panelGroup.add(button);
    }
  }

  // ------------------------------------------------------------------
  // Leuchtbügel über den Pflanzen
  // ------------------------------------------------------------------
  const postGeo = new THREE.CylinderGeometry(0.027, 0.032, 1.05, 10);
  for (const x of [-1.34, 1.34]) {
    const post = new THREE.Mesh(postGeo, matWall);
    post.position.set(x, 1.16, -0.41);
    post.castShadow = true;
    root.add(post);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.04, 14), matCopper);
    base.position.set(x, 0.77, -0.41);
    root.add(base);
  }

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.07, 0.09), matWall);
  bridge.position.set(0, 1.665, -0.41);
  root.add(bridge);

  const lightBars = [];
  for (const x of [-0.70, 0.70]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.075, 0.15), matDark);
    housing.position.set(x, 1.58, -0.41);
    root.add(housing);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.025, 0.075), matGlow);
    bar.position.set(x, 1.535, -0.395);
    root.add(bar);
    lightBars.push(bar);
  }

  // ------------------------------------------------------------------
  // Kollision, Benutzen-Punkte und Lichter
  // ------------------------------------------------------------------
  const collision = new THREE.Mesh(new THREE.BoxGeometry(2.80, 0.78, 0.95));
  collision.name = 'COL_tisch';
  collision.position.set(0, 0.39, 0);
  root.add(collision);

  function addUsePoint(name, label, position, radius = 0.8) {
    const point = new THREE.Object3D();
    point.name = name;
    point.position.copy(position);
    point.userData = { label, radius };
    root.add(point);
    return point;
  }

  addUsePoint(
    'INT_bedienen',
    'Hydrokultursteuerung bedienen',
    new THREE.Vector3(1.10, 0.98, 0.62)
  );
  addUsePoint(
    'INT_ernten',
    'Pegasus-Pflanzen ernten',
    new THREE.Vector3(-0.58, 0.98, 0.62)
  );
  addUsePoint(
    'INT_nachfuellen',
    'Nährlösung nachfüllen',
    new THREE.Vector3(0.88, 1.00, 0.48)
  );

  for (const [name, x] of [
    ['LAMP_zuchtlicht_links', -0.70],
    ['LAMP_zuchtlicht_rechts', 0.70]
  ]) {
    const lamp = new THREE.Object3D();
    lamp.name = name;
    lamp.position.set(x, 1.48, -0.22);
    lamp.userData = { color: '#6fe3ff', intensity: 4.5, distance: 3.2 };
    root.add(lamp);
  }

  const statusLamp = new THREE.Object3D();
  statusLamp.name = 'LAMP_statusanzeige';
  statusLamp.position.set(1.13, 1.00, 0.03);
  statusLamp.userData = { color: '#ffb13b', intensity: 2.0, distance: 1.8 };
  root.add(statusLamp);

  // ------------------------------------------------------------------
  // Zustand, Aktionen und Animation
  // ------------------------------------------------------------------
  let lichtAn = true;
  let ernteZahl = 0;
  let naehrstoff = 0.72;
  let wachstum = 0.43;
  let scanErgebnis = 'Keine Analyse gestartet';
  let zeit = 0;
  let letzte = null;
  let ernteImpuls = 0;
  let scanImpuls = 0;

  const api = {
    ernten() {
      ernteZahl += 1;
      wachstum = Math.max(0.05, wachstum - 0.12);
      ernteImpuls = 1;
      return { ernteZahl, wachstum };
    },
    befuellen() {
      naehrstoff = 1;
      return { naehrstoff };
    },
    umschaltenLicht() {
      lichtAn = !lichtAn;
      return { lichtAn };
    },
    scannen() {
      scanErgebnis = `Pegasus-Analyse: ${Math.round(wachstum * 100)} % Wachstum, ${Math.round(naehrstoff * 100)} % Nährstoffe`;
      scanImpuls = 1;
      return scanErgebnis;
    },
    get ernteZahl() { return ernteZahl; },
    get naehrstoff() { return naehrstoff; },
    get wachstum() { return wachstum; },
    get lichtAn() { return lichtAn; },
    get scanErgebnis() { return scanErgebnis; }
  };

  const actions = [
    {
      id: 'bedienen',
      label: 'Steuerung bedienen',
      run: () => api.umschaltenLicht()
    },
    {
      id: 'ernten',
      label: 'Pegasus-Pflanzen ernten',
      run: () => api.ernten()
    },
    {
      id: 'scannen',
      label: 'Pflanzen untersuchen',
      run: () => api.scannen()
    },
    {
      id: 'nachfuellen',
      label: 'Nährlösung nachfüllen',
      run: () => api.befuellen()
    }
  ];

  root.userData.api = api;
  root.userData.actions = actions;

  function update(dt) {
    zeit += dt;
    const pulse = 0.5 + 0.5 * Math.sin(zeit * 2.1);
    const target = lichtAn ? 1.25 + pulse * 0.55 : 0.08;

    matGlow.emissiveIntensity += (target - matGlow.emissiveIntensity) * Math.min(1, dt * 5);
    matScreen.emissiveIntensity = lichtAn ? 0.55 + pulse * 0.35 : 0.08;

    ernteImpuls = Math.max(0, ernteImpuls - dt * 1.4);
    scanImpuls = Math.max(0, scanImpuls - dt * 1.1);

    matAmber.emissiveIntensity = 0.25 + naehrstoff * 0.25 + ernteImpuls * 1.2 + scanImpuls * 0.8;
    matSoil.color.setHex(ernteImpuls > 0.2 ? 0x30261a : 0x211b14);

    updateLeaves(zeit);
  }

  // Selbstständige Animation über ein sichtbares Mesh.
  top.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;
  root.userData.masse = '2,80 × 1,72 × 0,95 m';
  root.userData.hinweis = 'Ressourcenquelle: Nahrung und Medizin';

  return root;
}

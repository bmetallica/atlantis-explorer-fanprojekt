// bed_quarters.js
// Antikes Lantianisches Schlafpodest für ein Crew-Quartier.
// Standobjekt: Ursprung = Mitte der Unterseite, Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'bed_quarters',
  art: 'Standobjekt',
  masse: '2,02 × 1,42 × 1,41 m (B × T × H)',
  wohin: 'ATL-024 – Crew-Quartiere / Wohnbereich',
  benutzen: 'INT_schlafen → Schlafen, Ruhepunkt aktivieren/deaktivieren, Licht umschalten',
  lichter: 'LAMP_bett – eisblaues Licht an der Kopfleiste',
  animation: 'Leuchtleisten pulsieren sanft; im Schlafzustand dimmen sie und werden wärmer',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'bed_quarters';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const mats = {
    dark: kit('wallDark'),
    pillar: kit('pillar'),
    copper: kit('copper'),
    rail: kit('rail'),
    glass: kit('glass'),
  };

  const glowMat = new THREE.MeshStandardMaterial({
    name: 'bett_leuchtstreifen',
    color: 0xd8fbff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.05,
  });

  const amberMat = new THREE.MeshStandardMaterial({
    name: 'bett_bernstein',
    color: 0xffd28a,
    emissive: 0xffa23c,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.08,
  });

  const mattressMat = new THREE.MeshStandardMaterial({
    name: 'bett_matratze_braun',
    color: 0x674838,
    roughness: 0.93,
    metalness: 0.01,
  });

  const blanketMat = new THREE.MeshStandardMaterial({
    name: 'bett_decke_rot',
    color: 0x7e3030,
    roughness: 0.9,
    metalness: 0.01,
  });

  const blanketTrimMat = new THREE.MeshStandardMaterial({
    name: 'bett_decke_braun',
    color: 0x493126,
    roughness: 0.92,
    metalness: 0.01,
  });

  const pillowMat = new THREE.MeshStandardMaterial({
    name: 'bett_kissen_creme',
    color: 0xc8b89d,
    roughness: 0.96,
    metalness: 0.01,
  });

  const blueGlassMat = new THREE.MeshStandardMaterial({
    name: 'bett_buntglas_blau',
    color: 0x287f9f,
    emissive: 0x0a4560,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.16,
  });

  const redGlassMat = new THREE.MeshStandardMaterial({
    name: 'bett_buntglas_bernstein',
    color: 0xb86b32,
    emissive: 0x63300e,
    emissiveIntensity: 0.4,
    roughness: 0.22,
    metalness: 0.14,
  });

  const colMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // ------------------------------------------------------------
  // Geometrie-Helfer
  // ------------------------------------------------------------
  function box(name, width, height, depth, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function setInstance(mesh, index, x, y, z) {
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(x, y, z);
    mesh.setMatrixAt(index, matrix);
  }

  // ------------------------------------------------------------
  // Podest
  // ------------------------------------------------------------
  const sockel = box('sockel', 2.02, 0.18, 1.42, mats.dark, 0, 0.09, 0);
  box('sockel_bronze_fassung', 2.04, 0.035, 1.44, mats.copper, 0, 0.195, 0);

  const rahmen = box('bettrahmen', 1.94, 0.18, 1.34, mats.pillar, 0, 0.29, 0);
  box('bettrahmen_frontblende', 1.94, 0.12, 0.04, mats.dark, 0, 0.29, 0.685);
  box('bettrahmen_bronze_kante', 1.98, 0.028, 0.055, mats.rail, 0, 0.375, 0.685);

  for (const side of [-1, 1]) {
    box(`bettblende_${side}`, 0.045, 0.15, 1.25, mats.dark, side * 0.985, 0.29, 0);
    box(`bettfuess_${side}_vorne`, 0.12, 0.08, 0.12, mats.copper, side * 0.88, 0.04, 0.58);
    box(`bettfuess_${side}_hinten`, 0.12, 0.08, 0.12, mats.copper, side * 0.88, 0.04, -0.58);
  }

  // ------------------------------------------------------------
  // Matratze, Decke, Kissen
  // ------------------------------------------------------------
  box('matratze', 1.86, 0.16, 1.26, mattressMat, 0, 0.46, 0);

  // Die Decke liegt bündig auf der Matratze und reicht fast bis zur Fußseite.
  box('bettdecke', 1.84, 0.065, 0.99, blanketMat, 0, 0.5725, 0.105);
  box('decken_brauner_rand', 1.85, 0.026, 0.10, blanketTrimMat, 0, 0.613, 0.585);

  // Dezente textile Streifen auf der roten Decke.
  for (const x of [-0.56, 0.56]) {
    box(`deckenstreifen_${x}`, 0.035, 0.016, 0.91, blanketTrimMat, x, 0.613, 0.10);
  }

  // Weiche, abgerundete Kissenform.
  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12), pillowMat);
  pillow.name = 'kissen';
  pillow.scale.set(1.0, 0.38, 0.56);
  pillow.position.set(0, 0.615, -0.39);
  root.add(pillow);

  box('kissen_nahaht', 0.52, 0.014, 0.012, blanketTrimMat, 0, 0.672, -0.39);

  // ------------------------------------------------------------
  // Kopfstütze
  // ------------------------------------------------------------
  const headboard = box('kopfstuetze', 1.98, 1.06, 0.12, mats.dark, 0, 0.88, -0.67);
  box('kopfstuetze_oberer_rahmen', 2.02, 0.055, 0.15, mats.copper, 0, 1.41, -0.67);
  box('kopfstuetze_unterer_rahmen', 2.02, 0.045, 0.15, mats.copper, 0, 0.365, -0.67);

  // Senkrechte eisblaue Leuchtleisten als InstancedMesh.
  const stripXs = [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78];
  const strips = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.032, 0.74, 0.018),
    glowMat,
    stripXs.length,
  );
  strips.name = 'kopfleiste_vertical';
  stripXs.forEach((x, i) => setInstance(strips, i, x, 0.89, -0.598));
  strips.instanceMatrix.needsUpdate = true;
  root.add(strips);

  // Warmes Licht an den beiden Kopfstützenecken.
  for (const side of [-1, 1]) {
    box(
      `kopfleiste_bernstein_${side}`,
      0.028,
      0.62,
      0.02,
      amberMat,
      side * 0.91,
      0.89,
      -0.598,
    );
  }

  // ------------------------------------------------------------
  // Seitliche Buntglasfelder
  // ------------------------------------------------------------
  const blueTiles = [];
  const redTiles = [];

  for (const side of [-1, 1]) {
    const panelX = side * 1.005;
    const panelZ = -0.13;
    const panelY = 0.79;

    box(`buntglas_${side}`, 0.035, 0.68, 0.94, mats.glass, panelX, panelY, panelZ);

    box(`buntglas_rahmen_oben_${side}`, 0.055, 0.04, 0.98, mats.rail, panelX, panelY + 0.36, panelZ);
    box(`buntglas_rahmen_unten_${side}`, 0.055, 0.04, 0.98, mats.rail, panelX, panelY - 0.36, panelZ);
    box(`buntglas_rahmen_vorne_${side}`, 0.055, 0.72, 0.04, mats.rail, panelX, panelY, panelZ + 0.49);
    box(`buntglas_rahmen_hinten_${side}`, 0.055, 0.72, 0.04, mats.rail, panelX, panelY, panelZ - 0.49);

    const tileZs = [-0.30, -0.10, 0.10, 0.30];
    const tileYs = [-0.22, 0.04, 0.30];

    for (let row = 0; row < tileYs.length; row++) {
      for (let col = 0; col < tileZs.length; col++) {
        const item = {
          x: panelX + side * 0.008,
          y: panelY + tileYs[row],
          z: panelZ + tileZs[col],
        };

        if ((row + col) % 3 === 0) {
          redTiles.push(item);
        } else {
          blueTiles.push(item);
        }
      }
    }
  }

  function addGlassTiles(name, material, tiles) {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.045, 0.22, 0.17),
      material,
      tiles.length,
    );
    mesh.name = name;
    tiles.forEach((tile, i) => setInstance(mesh, i, tile.x, tile.y, tile.z));
    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
  }

  addGlassTiles('buntglas_felder_blau', blueGlassMat, blueTiles);
  addGlassTiles('buntglas_felder_bernstein', redGlassMat, redTiles);

  // ------------------------------------------------------------
  // Frontseitige Zierleisten
  // ------------------------------------------------------------
  box('frontleiste_bronze', 1.52, 0.025, 0.035, mats.rail, 0, 0.235, 0.715);
  box('frontleiste_bernstein', 0.82, 0.018, 0.024, amberMat, 0, 0.235, 0.735);

  // ------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------
  const colBed = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 0.62, 1.42),
    colMat,
  );
  colBed.name = 'COL_bettpodium';
  colBed.position.set(0, 0.31, 0);
  root.add(colBed);

  const colHeadboard = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 1.06, 0.16),
    colMat,
  );
  colHeadboard.name = 'COL_kopfstuetze';
  colHeadboard.position.set(0, 0.88, -0.67);
  root.add(colHeadboard);

  // ------------------------------------------------------------
  // Benutzen-Punkt
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_schlafen';
  use.position.set(0, 0.88, 1.02);
  use.userData = {
    label: 'Schlafpodest bedienen',
    radius: 0.8,
  };
  root.add(use);

  // ------------------------------------------------------------
  // Licht
  // ------------------------------------------------------------
  const lamp = new THREE.PointLight(0x8cecff, 3.2, 4.2, 2);
  lamp.name = 'LAMP_bett';
  lamp.position.set(0, 1.08, -0.36);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  root.add(lamp);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let sleeping = false;
  let lightOn = true;
  let restPointActive = false;
  let zeit = 0;
  let letzte = null;
  let currentGlow = 2.0;
  let currentAmber = 1.5;

  function update(dt) {
    zeit += dt;
    const smooth = Math.min(1, dt * 5);

    let targetGlow;
    let targetAmber;

    if (sleeping) {
      targetGlow = lightOn ? 0.9 : 0.16;
      targetAmber = lightOn ? 1.9 : 0.22;
    } else {
      targetGlow = lightOn ? 2.0 + Math.sin(zeit * 1.7) * 0.18 : 0.16;
      targetAmber = lightOn ? 1.5 + Math.sin(zeit * 1.25 + 0.7) * 0.1 : 0.22;
    }

    currentGlow += (targetGlow - currentGlow) * smooth;
    currentAmber += (targetAmber - currentAmber) * smooth;

    glowMat.emissiveIntensity = currentGlow;
    amberMat.emissiveIntensity = currentAmber;
    lamp.intensity = lightOn ? 2.2 + currentGlow * 0.6 : 0.22;
  }

  // Der Antrieb hängt an einem sichtbaren Mesh, damit die Animation
  // auch dann weiterläuft, wenn das Objekt gerade nicht ausgewählt ist.
  headboard.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    sleep() {
      sleeping = true;
      restPointActive = true;
    },

    wake() {
      sleeping = false;
      if (!restPointActive) {
        restPointActive = false;
      }
    },

    activateRestPoint() {
      restPointActive = true;
      sleeping = true;
    },

    deactivateRestPoint() {
      restPointActive = false;
      sleeping = false;
    },

    toggleLight() {
      lightOn = !lightOn;
    },

    get sleeping() {
      return sleeping;
    },

    get lightOn() {
      return lightOn;
    },

    get restPointActive() {
      return restPointActive;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'schlafen',
      label: 'Schlafen – Ruhepunkt aktivieren',
      run: () => api.sleep(),
    },
    {
      id: 'aufstehen',
      label: 'Aufstehen',
      run: () => api.wake(),
    },
    {
      id: 'ruhe',
      label: 'Ruhepunkt deaktivieren',
      run: () => api.deactivateRestPoint(),
    },
    {
      id: 'licht',
      label: 'Podestlicht umschalten',
      run: () => api.toggleLight(),
    },
  ];

  return root;
}

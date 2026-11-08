// OBJ-030: Waffen-Sicherheitsschränke, Gewehrständer, P90-Gestell und Ausrüstungstisch
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'armory_locker',
  art: 'Standobjekt / Waffenlager',
  masse: '5,08 × 2,28 × 1,46 m; ca. 620 kg',
  wohin: 'ATL-030 Waffenkammer, Gearing-up-Room, Schießstand',
  benutzen: 'INT_ausruesten → Loadout-Menü',
  lichter: 'LAMP_schrank (eisblau), LAMP_p90 (bernstein), LAMP_tisch (bernstein)',
  animation: 'Schranktür öffnet weich; Auswahlmarkierung pulsiert; Glasflächen und Statusanzeige leuchten',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'armory_locker';

  const matSchrank = kit('wallDark');
  const matRahmen = kit('wall');
  const matRail = kit('rail');
  const matGlas = kit('glass');

  const matWaffenMetall = new THREE.MeshStandardMaterial({
    name: 'Waffenmetall',
    color: 0x111419,
    metalness: 0.72,
    roughness: 0.42,
  });
  const matWaffenGummi = new THREE.MeshStandardMaterial({
    name: 'Waffengummi',
    color: 0x202429,
    metalness: 0.04,
    roughness: 0.9,
  });
  const matWesten = new THREE.MeshStandardMaterial({
    name: 'Westenstoff',
    color: 0x33403f,
    metalness: 0.02,
    roughness: 0.94,
  });
  const matKiste = new THREE.MeshStandardMaterial({
    name: 'Ausrüstungskiste',
    color: 0x60675e,
    metalness: 0.34,
    roughness: 0.7,
  });
  const matCyan = new THREE.MeshStandardMaterial({
    name: 'Eisblaues Ruecklicht',
    color: 0x164954,
    emissive: 0x29d7ef,
    emissiveIntensity: 0.7,
    metalness: 0.1,
    roughness: 0.26,
  });
  const matAmber = new THREE.MeshStandardMaterial({
    name: 'Bernsteinfarbenes Ruecklicht',
    color: 0x694019,
    emissive: 0xffa63d,
    emissiveIntensity: 0.72,
    metalness: 0.1,
    roughness: 0.26,
  });
  const matWraith = new THREE.MeshStandardMaterial({
    name: 'Wraithwaffe',
    color: 0x766143,
    metalness: 0.82,
    roughness: 0.32,
  });
  const matWraithDunkel = new THREE.MeshStandardMaterial({
    name: 'Wraithwaffe dunkel',
    color: 0x202b30,
    metalness: 0.76,
    roughness: 0.4,
  });
  const matBeacon = new THREE.MeshStandardMaterial({
    name: 'Auswahlmarkierung',
    color: 0xa2f7ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 2.3,
    metalness: 0.15,
    roughness: 0.25,
  });

  const addBox = (parent, w, h, d, material, x, y, z, name = '') => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (
    parent,
    radiusTop,
    radiusBottom,
    height,
    material,
    x,
    y,
    z,
    name = '',
    segments = 14,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      material,
    );
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  const addInstances = (parent, geometry, material, transforms, name = '') => {
    if (!transforms.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    if (name) mesh.name = name;
    const dummy = new THREE.Object3D();

    transforms.forEach((t, i) => {
      dummy.position.set(t.x || 0, t.y || 0, t.z || 0);
      dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
      dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------
  // Rückwand, hinterleuchtete Glasflächen und Rahmenträger
  // ---------------------------------------------------------
  const rackStart = 0.22;
  const rackEnd = 2.52;

  addBox(root, 2.4, 2.12, 0.05, matSchrank, 1.36, 1.09, -0.675, 'Rueckwand_Gestell');

  const cyanGlas = addBox(
    root,
    1.62,
    1.83,
    0.045,
    matCyan,
    1.04,
    1.25,
    -0.638,
    'Glas_Gewehrregal',
  );
  cyanGlas.renderOrder = 1;

  const amberGlas = addBox(
    root,
    0.62,
    1.83,
    0.045,
    matAmber,
    2.18,
    1.25,
    -0.638,
    'Glas_P90_Regal',
  );
  amberGlas.renderOrder = 1;

  addBox(root, 2.42, 0.1, 0.13, matRahmen, 1.37, 2.25, -0.62, 'Gestell_Obenleiste');
  addBox(root, 2.42, 0.11, 0.13, matRahmen, 1.37, 0.065, -0.62, 'Gestell_Bodenleiste');

  [0.22, 1.87, 2.52].forEach((x, i) => {
    addBox(root, 0.075, 2.22, 0.13, matRahmen, x, 1.14, -0.62, `Gestell_Pfosten_${i}`);
  });

  [0.22, 1.87, 2.52].forEach((x, i) => {
    addBox(root, 0.1, 0.1, 0.045, matRail, x, 2.21, -0.585, `Gestell_Fassung_${i}`);
  });

  // ---------------------------------------------------------
  // Drei mannshohe Metallspinde
  // ---------------------------------------------------------
  const lockerXs = [-2.12, -1.18, -0.24];
  const lockerWidth = 0.88;
  const lockerHeight = 2.05;
  const lockerBack = -0.675;
  const lockerFront = -0.025;

  lockerXs.forEach((x, index) => {
    const name = `Sicherheitsspind_${index + 1}`;

    addBox(root, lockerWidth, lockerHeight, 0.05, matSchrank, x, 1.025, lockerBack, `${name}_Rueck`);
    addBox(root, 0.045, lockerHeight, 0.65, matSchrank, x - lockerWidth / 2, 1.025, -0.35, `${name}_Seite_L`);
    addBox(root, 0.045, lockerHeight, 0.65, matSchrank, x + lockerWidth / 2, 1.025, -0.35, `${name}_Seite_R`);
    addBox(root, lockerWidth, 0.06, 0.65, matSchrank, x, 0.03, -0.35, `${name}_Boden`);
    addBox(root, lockerWidth, 0.06, 0.65, matSchrank, x, 2.02, -0.35, `${name}_Deckel`);

    // Geschlossene Fächer bleiben verdeckt; der mittlere Spind ist als Innenraum aufgebaut.
    if (index === 1) {
      addBox(root, 0.79, 0.035, 0.58, matRahmen, x, 0.68, -0.35, 'Spind_Fach_unten');
      addBox(root, 0.79, 0.035, 0.58, matRahmen, x, 1.32, -0.35, 'Spind_Fach_oben');

      addBox(root, 0.39, 0.23, 0.29, matKiste, x - 0.18, 0.81, -0.38, 'Munitionsbox_Spind');
      addBox(root, 0.39, 0.23, 0.29, matKiste, x - 0.18, 0.81, -0.38, 'Munitionsbox_Deckel');
      addBox(root, 0.35, 0.19, 0.27, matKiste, x + 0.21, 0.81, -0.4, 'Granatenbox');

      // Weste liegt auf dem oberen Fach.
      const weste = new THREE.Group();
      weste.name = 'Weste_Im_Spind';
      weste.position.set(x, 1.55, -0.39);
      root.add(weste);

      addBox(weste, 0.34, 0.4, 0.1, matWesten, 0, 0, 0, 'Weste_Koerper');
      addBox(weste, 0.055, 0.28, 0.075, matWaffenGummi, -0.12, 0.22, -0.02, 'Weste_Gurt_L');
      addBox(weste, 0.055, 0.28, 0.075, matWaffenGummi, 0.12, 0.22, -0.02, 'Weste_Gurt_R');
      addBox(weste, 0.25, 0.12, 0.055, matKiste, 0, -0.07, 0.07, 'Weste_Tasche');

      // Eine erbeutete Wraith-Waffe steht in einer Halterung am Spind.
      const wraith = new THREE.Group();
      wraith.name = 'Wraith_Waffe';
      wraith.position.set(x + 0.18, 0.98, -0.41);
      root.add(wraith);

      const wraithBody = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.055, 0.25, 5, 12),
        matWraith,
      );
      wraith.add(wraithBody);

      addBox(wraith, 0.04, 0.23, 0.04, matWraithDunkel, -0.045, 0.23, 0, 'Wraith_Gabel_L');
      addBox(wraith, 0.04, 0.23, 0.04, matWraithDunkel, 0.045, 0.23, 0, 'Wraith_Gabel_R');
      addBox(wraith, 0.045, 0.045, 0.045, matCyan, 0, 0.25, 0.045, 'Wraith_Energieknoten');
      addBox(wraith, 0.17, 0.035, 0.1, matSchrank, 0, -0.18, -0.09, 'Wraith_Halterung');
    }
  });

  function buildLockerDoor(hingeX, movable = false) {
    const pivot = new THREE.Group();
    pivot.name = movable ? 'Tuer_Animiert' : 'Schranktuer_geschlossen';
    pivot.position.set(hingeX, 0, -0.005);
    root.add(pivot);

    const door = addBox(
      pivot,
      0.84,
      1.96,
      0.055,
      matSchrank,
      0.42,
      1.025,
      0,
      movable ? 'Schranktuer' : 'Schranktuer_Flaeche',
    );

    addBox(pivot, 0.045, 0.24, 0.045, matRail, 0.73, 1.04, 0.055, 'Schranktuer_Griff');

    const vents = [];
    for (let i = 0; i < 6; i++) {
      vents.push({ x: 0.42, y: 1.5 + i * 0.045, z: 0.035 });
    }
    addInstances(
      pivot,
      new THREE.BoxGeometry(0.4, 0.014, 0.012),
      matWaffenMetall,
      vents,
      'Schranktuer_Lueftung',
    );

    const statusMaterial = new THREE.MeshStandardMaterial({
      name: 'Spindstatus',
      color: 0x173d44,
      emissive: 0x6fe3ff,
      emissiveIntensity: 0.85,
    });
    addBox(pivot, 0.23, 0.05, 0.018, statusMaterial, 0.42, 1.76, 0.038, 'Spindstatus');

    return { pivot, door };
  }

  const leftDoor = buildLockerDoor(lockerXs[0] - lockerWidth / 2, false);
  const middleDoor = buildLockerDoor(lockerXs[1] - lockerWidth / 2, true);
  const rightDoor = buildLockerDoor(lockerXs[2] - lockerWidth / 2, false);

  // ---------------------------------------------------------
  // Senkrechtes Gewehrgestell
  // ---------------------------------------------------------
  const rifleXs = [0.48, 0.88, 1.28, 1.68];

  const rifleHooks = [];
  rifleXs.forEach((x) => {
    rifleHooks.push({ x, y: 1.72, z: -0.51 });
    rifleHooks.push({ x, y: 1.25, z: -0.51 });
  });

  addInstances(
    root,
    new THREE.BoxGeometry(0.035, 0.045, 0.25),
    matRail,
    rifleHooks,
    'Gewehr_Halterungen',
  );

  rifleXs.forEach((x, index) => {
    const rifle = new THREE.Group();
    rifle.name = `Gewehr_${index + 1}`;
    rifle.position.set(x, 0, -0.39);
    root.add(rifle);

    addBox(rifle, 0.105, 0.3, 0.085, matWaffenMetall, 0, 1.52, 0, 'Gewehr_Empfaenger');
    addBox(rifle, 0.085, 0.34, 0.075, matWaffenMetall, 0, 1.8, 0, 'Gewehr_Handguard');
    addCylinder(rifle, 0.014, 0.014, 0.5, matWaffenMetall, 0, 2.06, 0, 'Gewehr_Lauf');
    addBox(rifle, 0.09, 0.31, 0.075, matWaffenMetall, 0, 1.19, 0, 'Gewehr_Schaft');
    addBox(rifle, 0.065, 0.22, 0.055, matWaffenMetall, 0.06, 1.34, 0.015, 'Gewehr_Magazin');
    addBox(rifle, 0.055, 0.17, 0.06, matWaffenGummi, -0.055, 1.37, 0.065, 'Gewehr_Griff');
    addCylinder(rifle, 0.032, 0.032, 0.19, matWaffenMetall, 0, 1.69, 0, 'Gewehr_Optik');
    addBox(rifle, 0.045, 0.045, 0.06, matWaffenMetall, 0, 1.23, -0.055, 'Gewehr_Schafthalter');
  });

  // ---------------------------------------------------------
  // P90-Gestell
  // ---------------------------------------------------------
  const p90Xs = [2.04, 2.35];
  const p90Hooks = [];
  p90Xs.forEach((x) => {
    p90Hooks.push({ x, y: 1.79, z: -0.51 });
    p90Hooks.push({ x, y: 1.35, z: -0.51 });
  });

  addInstances(
    root,
    new THREE.BoxGeometry(0.035, 0.045, 0.25),
    matRail,
    p90Hooks,
    'P90_Halterungen',
  );

  p90Xs.forEach((x, index) => {
    const p90 = new THREE.Group();
    p90.name = `P90_${index + 1}`;
    p90.position.set(x, 0, -0.39);
    root.add(p90);

    addBox(p90, 0.14, 0.34, 0.1, matWaffenMetall, 0, 1.66, 0, 'P90_Empfaenger');
    addCylinder(p90, 0.018, 0.018, 0.52, matWaffenMetall, 0, 2.06, 0, 'P90_Lauf');
    addBox(p90, 0.07, 0.23, 0.065, matWaffenGummi, -0.07, 1.43, 0.06, 'P90_Griff');
    addBox(p90, 0.075, 0.3, 0.055, matWaffenMetall, 0.12, 1.59, 0.015, 'P90_Magazin');
    addBox(p90, 0.085, 0.22, 0.075, matWaffenMetall, 0, 1.31, 0, 'P90_Schaft');
    addBox(p90, 0.04, 0.05, 0.065, matWaffenMetall, 0, 1.9, -0.045, 'P90_Schafthalter');
  });

  // ---------------------------------------------------------
  // Klapptisch mit Pistolen, Magazinen und Munition
  // ---------------------------------------------------------
  const table = new THREE.Group();
  table.name = 'Ausrüstungstisch';
  table.position.set(0.15, 0, 0.3);
  root.add(table);

  addBox(table, 2.75, 0.08, 0.9, matRahmen, 0, 0.75, 0, 'Tischplatte');
  addBox(table, 2.62, 0.045, 0.7, matSchrank, 0, 0.25, 0, 'Tisch_Ablageboden');

  [-1.16, 1.16].forEach((x) => {
    [0.32, -0.32].forEach((z) => {
      addBox(table, 0.075, 0.71, 0.075, matSchrank, x, 0.355, z, 'Tisch_Bein');
    });
  });

  addBox(table, 2.66, 0.055, 0.055, matRail, 0, 0.34, 0.36, 'Tisch_Querstrebe');

  function addPistol(x, z, rotationY, name) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0.812, z);
    group.rotation.y = rotationY;
    table.add(group);

    addBox(group, 0.23, 0.044, 0.052, matWaffenMetall, 0, 0.022, 0, 'Pistole_Verschluss');
    addBox(group, 0.17, 0.038, 0.056, matWaffenMetall, -0.02, 0.019, 0, 'Pistole_Rahmen');
    addBox(group, 0.06, 0.04, 0.13, matWaffenGummi, -0.075, 0.02, 0.075, 'Pistole_Griff');

    const guard = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 8, 16, Math.PI),
      matWaffenMetall,
    );
    guard.rotation.set(-Math.PI / 2, 0, 0);
    guard.position.set(0.018, 0.02, 0);
    group.add(guard);
  }

  addPistol(-0.95, -0.08, -0.18, 'Pistole_1');
  addPistol(-0.51, 0.1, 0.14, 'Pistole_2');
  addPistol(-0.08, -0.12, -0.32, 'Pistole_3');

  const magTransforms = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      magTransforms.push({
        x: 0.34 + col * 0.095,
        y: 0.85,
        z: -0.18 + row * 0.13,
        ry: (col - 1.5) * 0.05,
      });
    }
  }
  addInstances(
    table,
    new THREE.BoxGeometry(0.045, 0.12, 0.075),
    matWaffenMetall,
    magTransforms,
    'Tisch_Magazine',
  );

  addBox(table, 0.31, 0.12, 0.22, matKiste, 0.97, 0.85, -0.19, 'Munitionskiste_Tisch');
  addBox(table, 0.32, 0.018, 0.23, matWaffenGummi, 0.97, 0.919, -0.19, 'Munitionskiste_Deckel');

  // ---------------------------------------------------------
  // Ladekonsole mit Canvas-Anzeige
  // ---------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'Loadout_Display',
    color: 0xffffff,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 1.05,
    metalness: 0.08,
    roughness: 0.34,
  });

  function drawScreen(text) {
    ctx.fillStyle = '#06171c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#2fd8ee';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.fillStyle = '#72e8f7';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOADOUT', canvas.width / 2, 76);

    ctx.fillStyle = '#ffb04e';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(text, canvas.width / 2, 155);

    ctx.fillStyle = '#7e9ca1';
    ctx.font = '24px monospace';
    ctx.fillText('EXPEDITION ARMORY', canvas.width / 2, 205);

    texture.needsUpdate = true;
  }
  drawScreen('BEREIT');

  const konsole = new THREE.Group();
  konsole.name = 'Loadoutkonsole';
  konsole.position.set(1.02, 0.79, 0.15);
  konsole.rotation.x = -0.18;
  table.add(konsole);

  addBox(konsole, 0.2, 0.25, 0.17, matWaffenMetall, 0, 0.125, 0, 'Konsole_Sockel');
  addBox(konsole, 0.54, 0.27, 0.045, matWaffenMetall, 0, 0.3, 0, 'Konsole_Gehaeuse');
  addBox(konsole, 0.47, 0.21, 0.012, matScreen, 0, 0.3, 0.029, 'Konsole_Anzeige');

  // ---------------------------------------------------------
  // Auswahlmarkierung
  // ---------------------------------------------------------
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), matBeacon);
  beacon.name = 'Auswahlmarkierung';
  beacon.position.set(0.48, 1.52, -0.29);
  beacon.visible = false;
  root.add(beacon);

  // ---------------------------------------------------------
  // Kollisionskörper
  // ---------------------------------------------------------
  const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });

  lockerXs.forEach((x, index) => {
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 2.05, 0.66),
      collisionMaterial,
    );
    col.name = `COL_Sicherheitsspind_${index + 1}`;
    col.position.set(x, 1.025, -0.35);
    root.add(col);
  });

  const colRack = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.25, 0.2),
    collisionMaterial,
  );
  colRack.name = 'COL_Waffengestell';
  colRack.position.set(1.37, 1.125, -0.59);
  root.add(colRack);

  const colTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.79, 0.9),
    collisionMaterial,
  );
  colTable.name = 'COL_Ausruestungstisch';
  colTable.position.set(0.15, 0.395, 0.3);
  root.add(colTable);

  // ---------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ---------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_ausruesten';
  use.position.set(0.15, 1.06, 1.02);
  use.userData = { label: 'Loadout wählen', radius: 0.95 };
  root.add(use);

  const lampSchrank = new THREE.Object3D();
  lampSchrank.name = 'LAMP_schrank';
  lampSchrank.position.set(1.02, 1.72, -0.42);
  lampSchrank.userData = { color: '#6fe3ff', intensity: 7, distance: 5 };
  root.add(lampSchrank);

  const lampP90 = new THREE.Object3D();
  lampP90.name = 'LAMP_p90';
  lampP90.position.set(2.17, 1.8, -0.42);
  lampP90.userData = { color: '#ffad4a', intensity: 6, distance: 4 };
  root.add(lampP90);

  const lampTisch = new THREE.Object3D();
  lampTisch.name = 'LAMP_tisch';
  lampTisch.position.set(0.8, 1.2, 0.28);
  lampTisch.userData = { color: '#ffad4a', intensity: 5, distance: 4 };
  root.add(lampTisch);

  // ---------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------
  let tuerOffen = false;
  let tuerZiel = 0;
  let auswahl = null;
  let zeit = 0;
  let letzte = null;
  const zielPosition = new THREE.Vector3();

  const auswahlZiele = {
    gewehr: new THREE.Vector3(0.48, 1.52, -0.29),
    p90: new THREE.Vector3(2.04, 1.66, -0.29),
    pistole: new THREE.Vector3(-0.8, 0.87, 0.22),
    weste: new THREE.Vector3(-1.18, 1.55, -0.28),
    wraith: new THREE.Vector3(-1.0, 1.0, -0.28),
  };

  const auswahlNamen = {
    gewehr: 'GEWEHR',
    p90: 'P90',
    pistole: 'PISTOLE',
    weste: 'WESTE',
    wraith: 'WRAITH-WAFFE',
  };

  function waehlen(typ) {
    if (!auswahlZiele[typ]) return false;
    auswahl = typ;
    zielPosition.copy(auswahlZiele[typ]);
    beacon.visible = true;
    drawScreen(auswahlNamen[typ]);
    return true;
  }

  function tuerOeffnen() {
    tuerOffen = true;
    tuerZiel = -1.35;
  }

  function tuerSchliessen() {
    tuerOffen = false;
    tuerZiel = 0;
  }

  function update(dt) {
    zeit += dt;

    middleDoor.pivot.rotation.y +=
      (tuerZiel - middleDoor.pivot.rotation.y) * Math.min(1, dt * 5.5);

    matCyan.emissiveIntensity = 0.64 + Math.sin(zeit * 1.4) * 0.09;
    matAmber.emissiveIntensity = 0.66 + Math.sin(zeit * 1.4 + 1.7) * 0.08;

    if (auswahl) {
      beacon.position.lerp(zielPosition, Math.min(1, dt * 9));
      const puls = 0.9 + Math.sin(zeit * 5.5) * 0.1;
      beacon.scale.setScalar(puls);
      beacon.rotation.y += dt * 1.8;
      matBeacon.emissiveIntensity = 1.9 + Math.sin(zeit * 5.5) * 0.55;
    }
  }

  middleDoor.door.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;
  root.userData.api = {
    waehlen,
    tuerOeffnen,
    tuerSchliessen,
    get auswahl() {
      return auswahl;
    },
    get auswahlName() {
      return auswahl ? auswahlNamen[auswahl] : null;
    },
    get tuerOffen() {
      return tuerOffen;
    },
    get ausruestungsstatus() {
      return auswahl
        ? `${auswahlNamen[auswahl]} – bereit zur Ausrüstung`
        : 'Keine Auswahl';
    },
  };

  root.userData.actions = [
    {
      id: 'loadout_gewehr',
      label: 'Gewehr für Loadout auswählen',
      run: () => waehlen('gewehr'),
    },
    {
      id: 'loadout_p90',
      label: 'P90 für Loadout auswählen',
      run: () => waehlen('p90'),
    },
    {
      id: 'loadout_pistole',
      label: 'Pistole für Loadout auswählen',
      run: () => waehlen('pistole'),
    },
    {
      id: 'loadout_weste',
      label: 'Weste für Loadout auswählen',
      run: () => waehlen('weste'),
    },
    {
      id: 'loadout_wraith',
      label: 'Wraith-Waffe für Loadout auswählen',
      run: () => waehlen('wraith'),
    },
    {
      id: 'schrank_oeffnen',
      label: 'Sicherheitsschrank öffnen',
      run: () => tuerOeffnen(),
    },
    {
      id: 'schrank_schliessen',
      label: 'Sicherheitsschrank schließen',
      run: () => tuerSchliessen(),
    },
  ];

  return root;
}

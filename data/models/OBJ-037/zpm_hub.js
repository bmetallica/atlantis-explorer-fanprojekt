import * as THREE from 'three';

export const steckbrief = {
  name: 'zpm_hub',
  art: 'Standobjekt',
  masse: '1,48 × 1,36 × 1,00 m (B × T × H, ohne eingesetztes ZPM)',
  wohin: 'ATL-038 · ZPM-Raum, an der Basis des Zentralturms',
  benutzen: 'INT_zpm_hub → ZPM in Schacht 1–3 einsetzen, entnehmen oder Notabschaltung auslösen',
  lichter: 'LAMP_zpm_slots (bernsteinfarben), LAMP_kanten (weiß)',
  animation: 'Eingesetzte ZPMs leuchten bernsteinfarben; nach Terminalfreigabe sinken sie weich bündig in ihre Schächte',
  quelle: 'selbst gebaut nach OBJ-037',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'zpm_hub';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const matBronze = new THREE.MeshStandardMaterial({
    name: 'zpm_hub_darkBronze',
    color: 0x503828,
    metalness: 0.82,
    roughness: 0.44,
  });

  const matBronzeEdge = new THREE.MeshStandardMaterial({
    name: 'zpm_hub_bronzeEdge',
    color: 0x805332,
    metalness: 0.86,
    roughness: 0.32,
  });

  const matSteel = kit('wallDark');
  const matCopper = kit('copper');
  const matPearl = kit('pillar');

  const matPanel = new THREE.MeshStandardMaterial({
    name: 'zpm_hub_panel',
    color: 0x485568,
    metalness: 0.74,
    roughness: 0.38,
  });

  const matInset = new THREE.MeshStandardMaterial({
    name: 'zpm_hub_darkInset',
    color: 0x151a21,
    metalness: 0.65,
    roughness: 0.55,
  });

  const matWhiteGlow = new THREE.MeshStandardMaterial({
    name: 'zpm_hub_weissLeucht',
    color: 0xeaf8ff,
    emissive: 0xdff6ff,
    emissiveIntensity: 2.6,
    metalness: 0.12,
    roughness: 0.26,
  });

  // ------------------------------------------------------------
  // Geometrie des dreilobigen Grundkörpers
  // ------------------------------------------------------------
  const TAU = Math.PI * 2;
  const lobeAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

  function hubPolygon(outerRadius, innerRadius) {
    const points = [];

    for (let i = 0; i < 3; i++) {
      const a = lobeAngles[i];
      points.push(
        new THREE.Vector2(
          Math.cos(a - 0.42) * outerRadius,
          Math.sin(a - 0.42) * outerRadius,
        ),
        new THREE.Vector2(
          Math.cos(a + 0.42) * outerRadius,
          Math.sin(a + 0.42) * outerRadius,
        ),
        new THREE.Vector2(
          Math.cos(a + 0.72) * innerRadius,
          Math.sin(a + 0.72) * innerRadius,
        ),
      );
    }

    return points;
  }

  function makeShape(outerRadius, innerRadius, withHoles = false, slotPoints = []) {
    const points = hubPolygon(outerRadius, innerRadius);
    const shape = new THREE.Shape();

    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();

    if (withHoles) {
      for (const point of slotPoints) {
        const hole = new THREE.Path();
        hole.absarc(point.x, point.y, 0.137, 0, TAU, true);
        shape.holes.push(hole);
      }
    }

    return shape;
  }

  function makePrism(shape, height, material, y, name) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 18,
    });

    // Die Shape-Ebene wird nach dem Drehen auf X/Z gelegt.
    geometry.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function cylinderBetween(a, b, radius, material, radialSegments = 8) {
    const delta = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, delta.length(), radialSegments),
      material,
    );

    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize(),
    );
    mesh.castShadow = true;
    return mesh;
  }

  // Geschlossene rotationssymmetrische Hülle für die Schachtwände.
  function makeAnnularSleeve(outerRadius, innerRadius, height, material, name) {
    const profile = [
      new THREE.Vector2(outerRadius, 0),
      new THREE.Vector2(outerRadius, height),
      new THREE.Vector2(innerRadius, height),
      new THREE.Vector2(innerRadius, 0),
      new THREE.Vector2(outerRadius, 0),
    ];

    const geometry = new THREE.LatheGeometry(profile, 28);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const slotShapePoints = lobeAngles.map((a) => new THREE.Vector2(
    Math.cos(a) * 0.355,
    Math.sin(a) * 0.355,
  ));

  const slotPositions = slotShapePoints.map((point) => new THREE.Vector3(
    point.x,
    0,
    -point.y,
  ));

  const polygonWorld = hubPolygon(0.73, 0.50).map((point) => new THREE.Vector2(
    point.x,
    -point.y,
  ));

  function boundaryRadius(angle) {
    const direction = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    let best = Infinity;

    for (let i = 0; i < polygonWorld.length; i++) {
      const a = polygonWorld[i];
      const b = polygonWorld[(i + 1) % polygonWorld.length];
      const edge = new THREE.Vector2().subVectors(b, a);
      const denominator = direction.x * edge.y - direction.y * edge.x;

      if (Math.abs(denominator) < 1e-6) continue;

      const t = (a.x * edge.y - a.y * edge.x) / denominator;
      const u = (
        direction.x * (a.y - b.y) +
        direction.y * (b.x - a.x)
      ) / denominator;

      if (t > 0 && u >= -0.001 && u <= 1.001) {
        best = Math.min(best, t);
      }
    }

    return Number.isFinite(best) ? best : 0.5;
  }

  // ------------------------------------------------------------
  // Gestufter Hauptkörper
  // ------------------------------------------------------------
  const sockel = makePrism(
    makeShape(0.69, 0.49),
    0.13,
    matBronze,
    0,
    'sockel',
  );
  root.add(sockel);

  const stufeUnten = makePrism(
    makeShape(0.665, 0.48),
    0.07,
    matBronzeEdge,
    0.13,
    'stufe_unten',
  );
  root.add(stufeUnten);

  const koerper = makePrism(
    makeShape(0.625, 0.46, true, slotShapePoints),
    0.58,
    matBronze,
    0.20,
    'hauptkoerper',
  );
  root.add(koerper);

  const schulter = makePrism(
    makeShape(0.655, 0.475, true, slotShapePoints),
    0.04,
    matBronzeEdge,
    0.78,
    'schulterstufe',
  );
  root.add(schulter);

  const deck = makePrism(
    makeShape(0.73, 0.50, true, slotShapePoints),
    0.12,
    matSteel,
    0.82,
    'deckplatte',
  );
  root.add(deck);

  // ------------------------------------------------------------
  // Schachtwangen, Ringe und ZPM-Module
  // ------------------------------------------------------------
  const slotStates = [];
  const zpmRiseY = 0.79;
  const zpmSinkY = 0.628;

  function buildZPM(index) {
    const group = new THREE.Group();
    group.name = `zpm_modul_${index + 1}`;

    const coreMat = new THREE.MeshStandardMaterial({
      name: `zpm_kern_${index + 1}`,
      color: 0xa5480b,
      emissive: 0xff7b12,
      emissiveIntensity: 0,
      metalness: 0.15,
      roughness: 0.23,
      transparent: true,
      opacity: 0.9,
    });

    const innerMat = new THREE.MeshStandardMaterial({
      name: `zpm_inner_${index + 1}`,
      color: 0xffbd58,
      emissive: 0xffa52e,
      emissiveIntensity: 0,
      metalness: 0.05,
      roughness: 0.18,
      transparent: true,
      opacity: 0.94,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      name: `zpm_leuchtring_${index + 1}`,
      color: 0xffdc91,
      emissive: 0xff941e,
      emissiveIntensity: 0,
      metalness: 0.2,
      roughness: 0.24,
    });

    const lowerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.122, 0.04, 20),
      matCopper,
    );
    lowerCap.position.y = 0.02;
    lowerCap.castShadow = true;
    group.add(lowerCap);

    const lowerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.087, 0.009, 8, 24),
      glowMat,
    );
    lowerRing.rotation.x = Math.PI / 2;
    lowerRing.position.y = 0.046;
    group.add(lowerRing);

    const outerCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.094, 0.094, 0.235, 20),
      coreMat,
    );
    outerCore.position.y = 0.148;
    outerCore.castShadow = true;
    group.add(outerCore);

    const innerCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.216, 16),
      innerMat,
    );
    innerCore.position.y = 0.146;
    group.add(innerCore);

    const upperCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.121, 0.038, 20),
      matBronze,
    );
    upperCollar.position.y = 0.283;
    upperCollar.castShadow = true;
    group.add(upperCollar);

    // Schutzstreben und Zwischenringe erzeugen den ZPM-Käfig.
    const ribGeometry = new THREE.BoxGeometry(0.017, 0.222, 0.027);
    const ribs = new THREE.InstancedMesh(ribGeometry, matPearl, 6);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      dummy.position.set(Math.sin(a) * 0.105, 0.149, Math.cos(a) * 0.105);
      dummy.rotation.set(0, a, 0);
      dummy.updateMatrix();
      ribs.setMatrixAt(i, dummy.matrix);
    }

    ribs.instanceMatrix.needsUpdate = true;
    ribs.castShadow = true;
    group.add(ribs);

    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.071, 0.011, 8, 24),
      glowMat,
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.303;
    group.add(topRing);

    const topGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.067, 0.067, 0.012, 20),
      glowMat,
    );
    topGlow.position.y = 0.305;
    group.add(topGlow);

    group.visible = false;
    return { group, coreMat, innerMat, glowMat };
  }

  slotPositions.forEach((position, index) => {
    const sleeve = makeAnnularSleeve(
      0.142,
      0.127,
      0.74,
      matInset,
      `schachtwange_${index + 1}`,
    );
    sleeve.position.set(position.x, 0.20, position.z);
    root.add(sleeve);

    const bottom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.127, 0.127, 0.028, 24),
      matInset,
    );
    bottom.position.set(position.x, 0.214, position.z);
    root.add(bottom);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.021, 8, 32),
      matCopper,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(position.x, 0.945, position.z);
    rim.castShadow = true;
    root.add(rim);

    const whiteRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.126, 0.006, 6, 32),
      matWhiteGlow,
    );
    whiteRing.rotation.x = Math.PI / 2;
    whiteRing.position.set(position.x, 0.955, position.z);
    root.add(whiteRing);

    const zpm = buildZPM(index);
    zpm.group.position.set(position.x, zpmRiseY, position.z);
    root.add(zpm.group);

    slotStates.push({
      index,
      present: false,
      connected: false,
      engaged: false,
      group: zpm.group,
      coreMat: zpm.coreMat,
      innerMat: zpm.innerMat,
      glowMat: zpm.glowMat,
    });
  });

  // ------------------------------------------------------------
  // Weiß leuchtende Kante der Deckplatte
  // ------------------------------------------------------------
  const edgePoints = polygonWorld.map((point) => new THREE.Vector3(
    point.x,
    0.944,
    point.y,
  ));

  for (let i = 0; i < edgePoints.length; i++) {
    const a = edgePoints[i];
    const b = edgePoints[(i + 1) % edgePoints.length];
    root.add(cylinderBetween(a, b, 0.008, matWhiteGlow, 8));
  }

  // ------------------------------------------------------------
  // Bronzene Eckpfosten an den Außenflanken
  // ------------------------------------------------------------
  const cornerAngles = [];

  for (let i = 0; i < 3; i++) {
    cornerAngles.push(-lobeAngles[i] + 0.42);
    cornerAngles.push(-lobeAngles[i] - 0.42);
  }

  for (const phi of cornerAngles) {
    const radius = boundaryRadius(phi) + 0.014;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.032, 0.61, 10),
      matBronzeEdge,
    );
    pillar.position.set(Math.cos(phi) * radius, 0.49, Math.sin(phi) * radius);
    pillar.castShadow = true;
    root.add(pillar);
  }

  // ------------------------------------------------------------
  // Kammartige Rippen unter der oberen Kante
  // ------------------------------------------------------------
  const finCount = 27;
  const finGeometry = new THREE.BoxGeometry(0.036, 0.20, 0.072);
  const fins = new THREE.InstancedMesh(finGeometry, matBronze, finCount);
  const finDummy = new THREE.Object3D();
  let finIndex = 0;

  for (const shapeAngle of lobeAngles) {
    const centerPhi = -shapeAngle;

    for (let i = 0; i < 9; i++) {
      const phi = centerPhi + (i / 8 - 0.5) * 0.72;
      const radius = boundaryRadius(phi) + 0.026;

      finDummy.position.set(
        Math.cos(phi) * radius,
        0.842,
        Math.sin(phi) * radius,
      );
      finDummy.rotation.set(0, Math.PI / 2 - phi, 0);
      finDummy.updateMatrix();
      fins.setMatrixAt(finIndex++, finDummy.matrix);
    }
  }

  fins.instanceMatrix.needsUpdate = true;
  fins.castShadow = true;
  root.add(fins);

  // ------------------------------------------------------------
  // Eingelassene Ancient-Ornamente auf den drei Außenseiten
  // ------------------------------------------------------------
  function addSidePanel(phi) {
    const radius = boundaryRadius(phi) + 0.004;
    const panel = new THREE.Group();
    panel.position.set(
      Math.cos(phi) * radius,
      0.47,
      Math.sin(phi) * radius,
    );
    panel.rotation.y = Math.PI / 2 - phi;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.45, 0.04),
      matPanel,
    );
    plate.castShadow = true;
    panel.add(plate);

    const inset = new THREE.Mesh(
      new THREE.BoxGeometry(0.33, 0.38, 0.012),
      matInset,
    );
    inset.position.z = 0.026;
    panel.add(inset);

    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.018, 0.018),
      matCopper,
    );
    frameTop.position.set(0, 0.205, 0.032);
    panel.add(frameTop);

    const frameBottom = frameTop.clone();
    frameBottom.position.y = -0.205;
    panel.add(frameBottom);

    const addBar = (x, y, width, height) => {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.014),
        matCopper,
      );
      bar.position.set(x, y, 0.038);
      panel.add(bar);
    };

    addBar(0, 0.125, 0.22, 0.018);
    addBar(-0.092, 0.055, 0.018, 0.145);
    addBar(-0.046, -0.02, 0.115, 0.018);
    addBar(0.012, -0.068, 0.018, 0.10);
    addBar(0.092, -0.115, 0.19, 0.018);
    addBar(0.102, -0.046, 0.018, 0.14);
    addBar(0.102, 0.022, 0.085, 0.018);

    root.add(panel);
  }

  const sidePanelAngles = lobeAngles.map((a) => -a);
  sidePanelAngles.forEach(addSidePanel);

  // ------------------------------------------------------------
  // Deckverzierung zwischen den drei Schächten
  // ------------------------------------------------------------
  const betweenAngles = [
    -Math.PI / 2,
    Math.PI / 6,
    (5 * Math.PI) / 6,
  ];

  for (const phi of betweenAngles) {
    const group = new THREE.Group();
    group.position.set(
      Math.cos(phi) * 0.19,
      0.946,
      Math.sin(phi) * 0.19,
    );
    group.rotation.y = Math.PI / 2 - phi;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.025, 0.22),
      matCopper,
    );
    plate.castShadow = true;
    group.add(plate);

    const inlay = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.012, 0.15),
      matInset,
    );
    inlay.position.y = 0.018;
    group.add(inlay);

    root.add(group);
  }

  // ------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 1.0, 1.36),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  collision.name = 'COL_zpm_hub';
  collision.position.y = 0.5;
  root.add(collision);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_zpm_hub';
  use.position.set(0, 1.02, 0.79);
  use.userData = {
    label: 'ZPM-Aufnahme bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_zpm_slots';
  lampAmber.position.set(0, 1.04, 0.355);
  lampAmber.userData = {
    color: '#ff9b32',
    intensity: 5,
    distance: 3,
  };
  root.add(lampAmber);

  const lampWhite = new THREE.Object3D();
  lampWhite.name = 'LAMP_kanten';
  lampWhite.position.set(0, 0.97, 0);
  lampWhite.userData = {
    color: '#dff6ff',
    intensity: 4,
    distance: 2.5,
  };
  root.add(lampWhite);

  // ------------------------------------------------------------
  // Zustand und öffentliche API
  // ------------------------------------------------------------
  const state = {
    energie: false,
    ausgeglichen: false,
    aktiverSchacht: null,
  };

  function firstPresentSlot() {
    const slot = slotStates.find((candidate) => candidate.present);
    return slot ? slot.index : -1;
  }

  function insertZPM(index = null) {
    const slot = Number.isInteger(index)
      ? slotStates[index]
      : slotStates.find((candidate) => !candidate.present);

    if (!slot || slot.present) return false;

    slot.present = true;
    slot.connected = true;
    slot.engaged = false;
    slot.group.visible = true;
    slot.group.position.y = zpmRiseY;
    slot.group.scale.set(1, 1, 1);
    return true;
  }

  function removeZPM(index = null) {
    let target = Number.isInteger(index) ? index : state.aktiverSchacht;

    if (target === null || target === undefined || target < 0) {
      target = firstPresentSlot();
    }

    if (target < 0) return false;

    const slot = slotStates[target];
    if (!slot || !slot.present) return false;

    slot.present = false;
    slot.connected = false;
    slot.engaged = false;
    slot.group.visible = false;

    if (state.aktiverSchacht === target) {
      state.aktiverSchacht = null;
    }

    return true;
  }

  function balanceEnergy() {
    const presentSlots = slotStates.filter((slot) => slot.present);
    if (presentSlots.length === 0) return false;

    state.energie = true;
    state.ausgeglichen = true;
    state.aktiverSchacht = null;

    for (const slot of presentSlots) {
      slot.engaged = true;
    }

    return true;
  }

  function switchEnergy() {
    const presentSlots = slotStates.filter((slot) => slot.present);
    if (presentSlots.length === 0) return false;

    state.energie = true;
    state.ausgeglichen = false;

    const currentPosition = presentSlots.findIndex(
      (slot) => slot.index === state.aktiverSchacht,
    );
    const nextSlot = presentSlots[(currentPosition + 1) % presentSlots.length];

    state.aktiverSchacht = nextSlot.index;

    for (const slot of presentSlots) {
      slot.engaged = slot.index === nextSlot.index;
    }

    return true;
  }

  function emergencyShutdown() {
    state.energie = false;
    state.ausgeglichen = false;
    state.aktiverSchacht = null;

    // Bereits abgesenkte Module bleiben mechanisch verriegelt.
    return true;
  }

  const api = {
    einsetzen: insertZPM,
    zpmEinsetzen: insertZPM,
    entnehmen: removeZPM,
    zpmEntnehmen: removeZPM,
    energieAusgleichen: balanceEnergy,
    energieFreigeben: balanceEnergy,
    wechseln: switchEnergy,
    notabschaltung: emergencyShutdown,

    get energie() {
      return state.energie;
    },

    get ausgeglichen() {
      return state.ausgeglichen;
    },

    get aktiverSchacht() {
      return state.aktiverSchacht;
    },

    get slots() {
      return slotStates.map((slot) => ({
        index: slot.index,
        belegt: slot.present,
        verbunden: slot.present && slot.connected,
        gesenkt: slot.present && slot.engaged,
        aktiv: state.energie && (
          state.ausgeglichen
            ? slot.present
            : slot.index === state.aktiverSchacht
        ),
      }));
    },

    zustand() {
      return {
        energie: state.energie,
        ausgeglichen: state.ausgeglichen,
        aktiverSchacht: state.aktiverSchacht,
        slots: api.slots,
      };
    },
  };

  root.userData.api = api;

  root.userData.actions = [
    {
      id: 'zpm_einsetzen_1',
      label: 'ZPM in Schacht 1 einsetzen',
      run: () => insertZPM(0),
    },
    {
      id: 'zpm_einsetzen_2',
      label: 'ZPM in Schacht 2 einsetzen',
      run: () => insertZPM(1),
    },
    {
      id: 'zpm_einsetzen_3',
      label: 'ZPM in Schacht 3 einsetzen',
      run: () => insertZPM(2),
    },
    {
      id: 'zpm_entnehmen',
      label: 'ZPM aus aktivem Schacht entnehmen',
      run: () => removeZPM(state.aktiverSchacht ?? firstPresentSlot()),
    },
    {
      id: 'notabschaltung',
      label: 'ZPM-Notabschaltung auslösen',
      run: () => emergencyShutdown(),
    },
  ];

  // ------------------------------------------------------------
  // Animation
  // ------------------------------------------------------------
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    for (const slot of slotStates) {
      const active = state.energie && (
        state.ausgeglichen
          ? slot.present
          : slot.index === state.aktiverSchacht
      );

      const targetY = slot.present && slot.engaged ? zpmSinkY : zpmRiseY;
      slot.group.position.y += (
        targetY - slot.group.position.y
      ) * Math.min(1, step * 3.8);

      const connected = slot.present && slot.connected;
      const pulse = 0.5 + 0.5 * Math.sin(zeit * 3.1 + slot.index * 1.7);

      const targetCore = connected ? 1.15 + pulse * 0.4 : 0;
      const targetInner = connected
        ? (active ? 2.8 + pulse * 0.8 : 0.9)
        : 0;
      const targetRing = connected
        ? (active ? 2.7 + pulse * 0.55 : 1.15)
        : 0;

      slot.coreMat.emissiveIntensity += (
        targetCore - slot.coreMat.emissiveIntensity
      ) * Math.min(1, step * 6);

      slot.innerMat.emissiveIntensity += (
        targetInner - slot.innerMat.emissiveIntensity
      ) * Math.min(1, step * 6);

      slot.glowMat.emissiveIntensity += (
        targetRing - slot.glowMat.emissiveIntensity
      ) * Math.min(1, step * 6);
    }

    matWhiteGlow.emissiveIntensity = (
      2.45 + Math.sin(zeit * 1.4) * 0.3
    );
  }

  deck.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  return root;
}

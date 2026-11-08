import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'desalination_tank',
  art: 'Standobjekt',
  masse: '7,58 × 5,95 × 7,60 (B × T × H, m)',
  wohin: 'ATL-047 – Entsalzungstanks',
  benutzen: 'INT_zufuhrventil → Menü mit userData.actions',
  lichter: 'LAMP_status_links, LAMP_status_rechts, LAMP_ventil',
  animation: 'Blau leuchtende Statusstreifen, aufsteigende Flusspunkte; Ventilrad öffnet weich',
  quelle: 'Spielergänzung, selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'desalination_tank';

  // Alle Bauteile liegen in dieser Gruppe. Sie wird anschließend so versetzt,
  // dass der Standursprung in X und Z mittig unter dem Objekt liegt.
  const assembly = new THREE.Group();
  root.add(assembly);

  const mats = {
    body: new THREE.MeshStandardMaterial({
      name: 'bronze_dark',
      color: 0x67492f,
      metalness: 0.58,
      roughness: 0.42,
    }),
    dark: kit('wallDark'),
    pearl: kit('pillar'),
    copper: kit('copper'),
    rail: kit('rail'),
    pipe: kit('wall'),
    glow: new THREE.MeshStandardMaterial({
      name: 'status_glow',
      color: 0xa8efff,
      emissive: 0x28bfff,
      emissiveIntensity: 1.1,
      metalness: 0.08,
      roughness: 0.22,
    }),
    amber: new THREE.MeshStandardMaterial({
      name: 'valve_amber_glow',
      color: 0xffc47a,
      emissive: 0xff941f,
      emissiveIntensity: 0.3,
      metalness: 0.08,
      roughness: 0.25,
    }),
  };

  const tankBodies = [];
  const boltMatrices = [];
  const flowDefinitions = [];
  const dummy = new THREE.Object3D();

  function addBolt(position) {
    dummy.position.copy(position);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    boltMatrices.push(dummy.matrix.clone());
  }

  function pipeBetween(a, b, radius, material) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      16,
      1,
      false
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    assembly.add(mesh);
    return mesh;
  }

  function addVerticalTank(x, z, radius, height, phase) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    assembly.add(group);

    const plinthHeight = 0.28;
    const bodyBottom = plinthHeight;
    const bodyTop = height - 0.55;
    const bodyHeight = bodyTop - bodyBottom;

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.06, radius * 1.09, plinthHeight, 48),
      mats.dark
    );
    plinth.position.y = plinthHeight / 2;
    group.add(plinth);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, bodyHeight, 48, 1, false),
      mats.body
    );
    body.position.y = bodyBottom + bodyHeight / 2;
    group.add(body);
    tankBodies.push(body);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(
        radius,
        48,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      mats.body
    );
    dome.position.y = bodyTop;
    dome.scale.y = 0.55 / radius;
    group.add(dome);

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.025, 0.11, 8, 32),
      mats.rail
    );
    baseRing.position.y = 0.42;
    baseRing.rotation.x = Math.PI / 2;
    group.add(baseRing);

    const bandHeights = [
      1.15,
      height * 0.43,
      height * 0.68,
      height - 0.86,
    ];

    for (const y of bandHeights) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.025, 0.085, 8, 32),
        mats.rail
      );
      band.position.y = y;
      band.rotation.x = Math.PI / 2;
      group.add(band);

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        addBolt(new THREE.Vector3(
          x + Math.cos(angle) * (radius + 0.09),
          y,
          z + Math.sin(angle) * (radius + 0.09)
        ));
      }
    }

    // Lantianische, längliche Wandfelder brechen die glatte Tankfläche auf.
    const panelHeight = bodyHeight - 1.42;
    const panelY = bodyBottom + bodyHeight * 0.52;
    const panelAngles = [-1.58, -0.78, 0.78, 1.58, 2.42, -2.42];

    for (const angle of panelAngles) {
      const panelBorder = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, panelHeight, 0.045),
        mats.copper
      );
      panelBorder.position.set(
        Math.sin(angle) * (radius + 0.012),
        panelY,
        Math.cos(angle) * (radius + 0.012)
      );
      panelBorder.rotation.y = angle;
      group.add(panelBorder);

      const panelInset = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, panelHeight - 0.09, 0.055),
        mats.dark
      );
      panelInset.position.set(
        Math.sin(angle) * (radius + 0.035),
        panelY,
        Math.cos(angle) * (radius + 0.035)
      );
      panelInset.rotation.y = angle;
      group.add(panelInset);
    }

    const stripBottom = 0.72;
    const stripHeight = height - 1.78;

    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, stripHeight, 0.065),
      mats.dark
    );
    channel.position.set(0, stripBottom + stripHeight / 2, radius + 0.018);
    group.add(channel);

    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, stripHeight - 0.06, 0.035),
      mats.glow
    );
    strip.position.set(0, stripBottom + stripHeight / 2, radius + 0.061);
    group.add(strip);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 0.16, 24),
      mats.copper
    );
    cap.position.y = bodyTop + 0.50;
    group.add(cap);

    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.73, 0.065, 8, 32),
      mats.rail
    );
    topRing.position.y = bodyTop + 0.14;
    topRing.rotation.x = Math.PI / 2;
    group.add(topRing);

    for (let i = 0; i < 8; i++) {
      flowDefinitions.push({
        x,
        z: z + radius + 0.095,
        y0: stripBottom + 0.08,
        height: stripHeight - 0.16,
        offset: (i / 8 + phase) % 1,
        speed: 0.19 + (i % 3) * 0.015,
      });
    }

    return group;
  }

  addVerticalTank(-2.2, -0.65, 1.4, 6.6, 0.0);
  addVerticalTank(2.2, -0.65, 1.5, 7.4, 0.5);

  // Liegender Membranzylinder vor den Hochbehältern.
  const horizontal = new THREE.Group();
  horizontal.position.set(0, 1.35, 1.65);
  assembly.add(horizontal);

  const horizontalLength = 4.9;
  const horizontalRadius = 1.08;

  const horizontalBody = new THREE.Mesh(
    new THREE.CylinderGeometry(
      horizontalRadius,
      horizontalRadius,
      horizontalLength,
      48,
      1,
      false
    ),
    mats.body
  );
  horizontalBody.rotation.z = Math.PI / 2;
  horizontal.add(horizontalBody);
  tankBodies.push(horizontalBody);

  for (const side of [-1, 1]) {
    const flange = new THREE.Mesh(
      new THREE.CylinderGeometry(horizontalRadius * 1.1, horizontalRadius * 1.1, 0.16, 40),
      mats.rail
    );
    flange.rotation.z = Math.PI / 2;
    flange.position.x = side * (horizontalLength / 2 + 0.04);
    horizontal.add(flange);

    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(horizontalRadius * 0.72, horizontalRadius * 0.88, 0.18, 36),
      mats.copper
    );
    endCap.rotation.z = Math.PI / 2;
    endCap.position.x = side * (horizontalLength / 2 + 0.16);
    horizontal.add(endCap);
  }

  for (const offset of [-1.65, 0, 1.65]) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(horizontalRadius + 0.025, 0.085, 8, 32),
      mats.rail
    );
    band.rotation.y = Math.PI / 2;
    band.position.x = offset;
    horizontal.add(band);

    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(horizontalRadius + 0.105, 0.026, 6, 32),
      offset === 0 ? mats.amber : mats.glow
    );
    glowRing.rotation.y = Math.PI / 2;
    glowRing.position.x = offset;
    horizontal.add(glowRing);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      addBolt(new THREE.Vector3(
        offset,
        1.35 + Math.sin(angle) * (horizontalRadius + 0.09),
        1.65 + Math.cos(angle) * (horizontalRadius + 0.09)
      ));
    }
  }

  // Geschlossene Sattelstützen mit umlaufendem Bronzering.
  for (const x of [-1.65, 1.65]) {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.32, 1.36),
      mats.dark
    );
    pedestal.position.set(x, 0.16, 1.65);
    assembly.add(pedestal);

    const cradle = new THREE.Mesh(
      new THREE.TorusGeometry(1.16, 0.12, 8, 32),
      mats.copper
    );
    cradle.rotation.y = Math.PI / 2;
    cradle.position.set(x, 1.35, 1.65);
    assembly.add(cradle);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.12, 1.62),
      mats.rail
    );
    foot.position.set(x, 0.06, 1.65);
    assembly.add(foot);
  }

  // Rohrverbindungen zwischen Hochbehältern und Membranzylinder.
  pipeBetween([-2.2, 5.3, -1.72], [-0.36, 5.3, -1.72], 0.16, mats.pipe);
  pipeBetween([2.2, 5.85, -1.82], [0.36, 5.85, -1.82], 0.16, mats.pipe);
  pipeBetween([-0.36, 5.3, -1.72], [0.36, 5.3, -1.72], 0.16, mats.pipe);
  pipeBetween([0, 5.3, -1.72], [0, 5.85, -1.72], 0.16, mats.pipe);
  pipeBetween([-0.36, 1.35, -1.72], [-0.36, 5.3, -1.72], 0.16, mats.pipe);
  pipeBetween([0.36, 1.35, -1.82], [0.36, 5.85, -1.82], 0.16, mats.pipe);
  pipeBetween([0, 1.35, -1.72], [0, 1.35, 1.65], 0.16, mats.pipe);
  pipeBetween([-1.7, 1.35, 1.65], [-1.7, 0.32, 1.65], 0.13, mats.pipe);

  // Rohrschellen an den sichtbaren Verbindungsstellen.
  for (const [x, y, z] of [
    [-0.36, 5.3, -1.72],
    [0.36, 5.85, -1.82],
    [0, 1.35, 0.08],
    [0, 1.35, 1.25],
  ]) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.045, 8, 24),
      mats.copper
    );
    collar.position.set(x, y, z);
    collar.rotation.x = Math.PI / 2;
    assembly.add(collar);
  }

  // Entnahmeventil an der Vorderseite des Membranzylinders.
  const valveX = 1.45;
  const valveZ = 3.18;

  const valvePipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.62, 20),
    mats.pipe
  );
  valvePipe.rotation.x = Math.PI / 2;
  valvePipe.position.set(valveX, 1.35, 2.95);
  assembly.add(valvePipe);

  const valveBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.32, 24),
    mats.copper
  );
  valveBody.rotation.x = Math.PI / 2;
  valveBody.position.set(valveX, 1.35, valveZ);
  assembly.add(valveBody);

  const valveStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.34, 16),
    mats.rail
  );
  valveStem.rotation.x = Math.PI / 2;
  valveStem.position.set(valveX, 1.35, valveZ + 0.25);
  assembly.add(valveStem);

  const valveWheel = new THREE.Group();
  valveWheel.position.set(valveX, 1.35, valveZ + 0.43);
  assembly.add(valveWheel);

  const wheelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.055, 8, 28),
    mats.rail
  );
  valveWheel.add(wheelRing);

  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.045, 0.045),
      mats.rail
    );
    spoke.rotation.z = (i / 4) * Math.PI;
    valveWheel.add(spoke);
  }

  const valveHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16),
    mats.copper
  );
  valveHub.rotation.x = Math.PI / 2;
  valveWheel.add(valveHub);

  // Kleine Serviceblende an der linken Fronttankseite.
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.9, 0.09),
    mats.dark
  );
  panel.position.set(-2.2, 2.15, 0.78);
  assembly.add(panel);

  const panelRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.82, 0.035),
    mats.copper
  );
  panelRim.position.set(-2.2, 2.15, 0.835);
  assembly.add(panelRim);

  const panelGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.055, 0.025),
    mats.amber
  );
  panelGlow.position.set(-2.2, 2.32, 0.86);
  assembly.add(panelGlow);

  // Schraubenköpfe als InstancedMesh.
  const boltGeometry = new THREE.SphereGeometry(0.052, 6, 4);
  const bolts = new THREE.InstancedMesh(
    boltGeometry,
    mats.copper,
    boltMatrices.length
  );
  bolts.name = 'Tank_Schraubenköpfe';
  boltMatrices.forEach((matrix, i) => bolts.setMatrixAt(i, matrix));
  bolts.instanceMatrix.needsUpdate = true;
  assembly.add(bolts);

  // Aufsteigende Flusspunkte innerhalb der Statusleisten.
  const flowGeometry = new THREE.SphereGeometry(0.038, 6, 4);
  const flowBeads = new THREE.InstancedMesh(
    flowGeometry,
    mats.glow,
    flowDefinitions.length
  );
  flowBeads.name = 'Status_Flusspunkte';
  flowBeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  assembly.add(flowBeads);

  // Kollisionskörper: nur diese Meshes werden vom Spiel kollidiert.
  function addCollisionCylinder(name, radius, height, position, rotationZ = 0) {
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      16,
      1,
      false
    );
    const collision = new THREE.Mesh(geometry);
    collision.name = name;
    collision.position.copy(position);
    collision.rotation.z = rotationZ;
    collision.userData.aktiv = true;
    assembly.add(collision);
  }

  addCollisionCylinder(
    'COL_tank_links',
    1.46,
    6.6,
    new THREE.Vector3(-2.2, 3.3, -0.65)
  );
  addCollisionCylinder(
    'COL_tank_rechts',
    1.56,
    7.4,
    new THREE.Vector3(2.2, 3.7, -0.65)
  );
  addCollisionCylinder(
    'COL_membranzylinder',
    1.12,
    5.5,
    new THREE.Vector3(0, 1.35, 1.65),
    Math.PI / 2
  );

  // Benutzen-Punkt vor dem Ventil in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_zufuhrventil';
  use.position.set(valveX, 1.55, 3.85);
  use.userData = {
    label: 'Wasserzuflussventil bedienen',
    radius: 0.8,
  };
  assembly.add(use);

  // Dauerhaft aktive Lichter.
  const lampLeft = new THREE.Object3D();
  lampLeft.name = 'LAMP_status_links';
  lampLeft.position.set(-2.2, 4.7, 1.0);
  lampLeft.userData = { color: '#6fe3ff', intensity: 5, distance: 5 };
  assembly.add(lampLeft);

  const lampRight = new THREE.Object3D();
  lampRight.name = 'LAMP_status_rechts';
  lampRight.position.set(2.2, 5.2, 1.1);
  lampRight.userData = { color: '#6fe3ff', intensity: 5, distance: 5 };
  assembly.add(lampRight);

  const lampValve = new THREE.Object3D();
  lampValve.name = 'LAMP_ventil';
  lampValve.position.set(valveX, 1.35, 3.55);
  lampValve.userData = { color: '#ffb35e', intensity: 3, distance: 3 };
  assembly.add(lampValve);

  // Ausrichtung des gesamten Ensembles: Standpunkt mittig, Boden bei y = 0.
  assembly.position.set(-0.05, 0, -0.69);

  // Zustand und selbstständige Animation.
  let valveOpen = false;
  let valveAmount = 0;
  let time = 0;
  let lastTime = null;

  function update(dt) {
    time += dt;

    const target = valveOpen ? 1 : 0;
    valveAmount += (target - valveAmount) * Math.min(1, dt * 4.5);

    valveWheel.rotation.z = -valveAmount * Math.PI * 0.5;
    valveWheel.rotation.y = valveAmount * 0.08;

    mats.glow.emissiveIntensity =
      0.72 + valveAmount * 1.05 + Math.sin(time * 2.6) * 0.16;

    mats.amber.emissiveIntensity =
      0.25 + valveAmount * 1.25 + Math.sin(time * 4.0) * 0.08;

    flowDefinitions.forEach((flow, i) => {
      const progress = (
        time * flow.speed * (0.35 + valveAmount) + flow.offset
      ) % 1;

      dummy.position.set(
        flow.x,
        flow.y0 + progress * flow.height,
        flow.z
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.7 + valveAmount * 0.55);
      dummy.updateMatrix();
      flowBeads.setMatrixAt(i, dummy.matrix);
    });

    flowBeads.instanceMatrix.needsUpdate = true;
  }

  tankBodies[0].onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(Math.min(Math.max(now - lastTime, 0), 0.1));
    }
    lastTime = now;
  };

  // Initiale Positionen der Instanzen, damit im ersten Frame nichts am Ursprung erscheint.
  update(0);

  const api = {
    setValveOpen(open) {
      valveOpen = Boolean(open);
    },
    toggleValve() {
      valveOpen = !valveOpen;
    },
    get valveOpen() {
      return valveOpen;
    },
    get valveAmount() {
      return valveAmount;
    },
    get flowActive() {
      return valveAmount > 0.08;
    },
    get flowRate() {
      return Math.round(valveAmount * 100);
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'ventil_oeffnen',
      label: 'Wasserzufluss öffnen',
      run: () => api.setValveOpen(true),
    },
    {
      id: 'ventil_schliessen',
      label: 'Wasserzufluss schließen',
      run: () => api.setValveOpen(false),
    },
  ];

  return root;
}

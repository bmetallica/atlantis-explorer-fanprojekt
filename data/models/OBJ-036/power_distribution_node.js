// OBJ-036: Primäre Energieverteiler-Knoten
// Hauptstromraum / Main Power Room, Wandobjekt
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

const ownMaterial = (
  name,
  color,
  metalness,
  roughness,
  emissive = 0x000000,
  emissiveIntensity = 0
) =>
  new THREE.MeshStandardMaterial({
    name,
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity,
  });

const TAU = Math.PI * 2;

function makeBeam(a, b, material, radius = 0.02) {
  const va = new THREE.Vector3(a[0], a[1], a[2]);
  const vb = new THREE.Vector3(b[0], b[1], b[2]);
  const direction = new THREE.Vector3().subVectors(vb, va);
  const length = direction.length();

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 8),
    material
  );
  mesh.position.copy(va).add(vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  return mesh;
}

function makeStatusTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#041019';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#20576a';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.fillStyle = '#ff9b32';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('CITY GRID // PRIMARY', 22, 44);

  ctx.fillStyle = '#58d9ea';
  ctx.font = '19px monospace';
  ctx.fillText('CENTRAL BUS     ONLINE', 22, 86);
  ctx.fillText('EAST PIER       READY', 22, 119);
  ctx.fillText('WEST PIER       READY', 22, 152);

  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      ctx.fillStyle =
        row === 0 && column === 0 ? '#ff9b32' : '#267c8e';
      ctx.fillRect(
        360 + column * 30,
        78 + row * 24,
        21,
        10
      );
    }
  }

  ctx.strokeStyle = '#15576a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(22, 182 + i * 15);
    ctx.lineTo(150 + i * 24, 182 + i * 15);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export const steckbrief = {
  name: 'power_distribution_node',
  art: 'Wandobjekt',
  masse: '6,40 × 3,60 × 1,52 (B × H × T, m)',
  benutzen: 'INT_bedienen → Menü aus userData.actions',
  lichter: 'LAMP_schaltblau, LAMP_console, LAMP_snowflake',
  animation:
    'Schneeflockenschema, Hauptschalter und türkise Bodenkonsolen pulsieren; bei Umleitung und Notabschaltung wechseln die Statusfarben',
  quelle:
    'selbst gebaut, nach Atlantis-Hauptstromraum und Referenzbildern',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'power_distribution_node';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------
  const wallMat = kit('wall');
  const darkMat = kit('wallDark');
  const hullMat = kit('hull');
  const copperMat = kit('copper');
  const railMat = kit('rail');

  const screenMat = ownMaterial(
    'screen_dark',
    0x06131d,
    0.72,
    0.24,
    0x072331,
    0.28
  );

  const orangeMat = ownMaterial(
    'orange_energy',
    0xff8a25,
    0.3,
    0.22,
    0xff6500,
    2.4
  );

  const orangeDimMat = ownMaterial(
    'orange_dim',
    0x783615,
    0.4,
    0.34,
    0x6b2100,
    0.45
  );

  const blueMat = ownMaterial(
    'switch_blue',
    0x55dcff,
    0.18,
    0.2,
    0x159fff,
    3.1
  );

  const turquoiseMat = ownMaterial(
    'console_turquoise',
    0x31efd2,
    0.22,
    0.24,
    0x00c7b3,
    2.5
  );

  const redMat = ownMaterial(
    'emergency_red',
    0xff304c,
    0.25,
    0.24,
    0xd90024,
    0.16
  );

  // ------------------------------------------------------------------
  // Hauptpaneel
  // Rückseite bei z = 0, Vorderseite nach +Z.
  // Oberkante bei y = 3.60; alle sichtbaren Teile bleiben an diesem
  // Paneel montiert und ragen nicht darüber hinaus.
  // ------------------------------------------------------------------
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.6, 0.38),
    wallMat
  );
  panel.position.set(0, 1.8, 0.19);
  root.add(panel);

  const lowerPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(6.15, 0.28, 0.55),
    darkMat
  );
  lowerPlinth.position.set(0, 0.14, 0.285);
  root.add(lowerPlinth);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(6.02, 3.28, 0.065),
    darkMat
  );
  inset.position.set(0, 1.8, 0.4075);
  root.add(inset);

  const frameParts = [
    [-3.03, 1.8, 0.47, 0.14, 3.3, 0.14],
    [3.03, 1.8, 0.47, 0.14, 3.3, 0.14],
    [0, 3.51, 0.47, 6.2, 0.16, 0.14],
    [0, 0.34, 0.47, 6.2, 0.14, 0.14],
  ];

  for (const [x, y, z, sx, sy, sz] of frameParts) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      railMat
    );
    frame.position.set(x, y, z);
    root.add(frame);
  }

  for (const side of [-1, 1]) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.78, 0.12),
      copperMat
    );
    rib.position.set(side * 2.82, 1.78, 0.49);
    root.add(rib);
  }

  // Vollständig in die obere Rahmenleiste integrierte Kühlblende.
  const topHood = new THREE.Mesh(
    new THREE.BoxGeometry(5.72, 0.16, 0.28),
    hullMat
  );
  topHood.position.set(0, 3.45, 0.55);
  root.add(topHood);

  const ventGeometry = new THREE.BoxGeometry(0.32, 0.035, 0.055);
  const vents = new THREE.InstancedMesh(
    ventGeometry,
    darkMat,
    9
  );

  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 9; i++) {
    matrix.makeTranslation(-2.2 + i * 0.55, 3.45, 0.705);
    vents.setMatrixAt(i, matrix);
  }
  vents.instanceMatrix.needsUpdate = true;
  root.add(vents);

  // ------------------------------------------------------------------
  // Hauptbildschirm und goldenes Schneeflockenschema
  // ------------------------------------------------------------------
  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.28, 2.2, 0.1),
    copperMat
  );
  screenFrame.position.set(0, 2.38, 0.49);
  root.add(screenFrame);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(4.02, 1.94, 0.075),
    screenMat
  );
  screen.position.set(0, 2.38, 0.565);
  root.add(screen);

  const snowGroup = new THREE.Group();
  snowGroup.position.set(0, 2.38, 0.64);
  root.add(snowGroup);

  // Der Torus liegt in der XY-Ebene und zeigt damit direkt nach +Z.
  const hub = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.045, 10, 28),
    orangeMat
  );
  snowGroup.add(hub);

  const hubCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 14, 10),
    orangeMat
  );
  snowGroup.add(hubCore);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * TAU;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const tx = -uy;
    const ty = ux;

    snowGroup.add(
      makeBeam([0, 0, 0], [ux * 0.86, uy * 0.86, 0], orangeMat, 0.025)
    );

    for (let branch = 0; branch < 3; branch++) {
      const radius = 0.25 + branch * 0.2;
      const bx = ux * radius;
      const by = uy * radius;
      const spread = 0.23 - branch * 0.025;

      snowGroup.add(
        makeBeam(
          [bx, by, 0],
          [bx + tx * spread, by + ty * spread, 0],
          orangeMat,
          0.016
        )
      );

      snowGroup.add(
        makeBeam(
          [bx, by, 0],
          [bx - tx * spread, by - ty * spread, 0],
          orangeMat,
          0.016
        )
      );

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 6),
        orangeDimMat
      );
      node.position.set(bx, by, 0);
      snowGroup.add(node);
    }

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 10, 7),
      orangeMat
    );
    tip.position.set(ux * 0.86, uy * 0.86, 0);
    snowGroup.add(tip);
  }

  // Orange Statusbalken links im Bildschirm.
  // Die Koordinaten sind relativ zur Mitte des Schneeflockenschemas
  // und liegen vollständig innerhalb des Displays.
  for (let i = 0; i < 5; i++) {
    const read = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.025, 0.018),
      orangeDimMat
    );
    read.position.set(-1.72, 0.73 - i * 0.115, 0.01);
    snowGroup.add(read);
  }

  // Blaue technische Anzeigen rechts im Bildschirm.
  for (let i = 0; i < 4; i++) {
    const read = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.025, 0.018),
      blueMat
    );
    read.position.set(1.73, 0.62 - i * 0.145, 0.01);
    snowGroup.add(read);
  }

  // Kompakte Statusanzeige, vollständig auf dem Bildschirm montiert.
  const labelMat = new THREE.MeshBasicMaterial({
    map: makeStatusTexture(),
    toneMapped: false,
  });
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.28),
    labelMat
  );
  label.position.set(1.42, -0.7, 0.012);
  snowGroup.add(label);

  // ------------------------------------------------------------------
  // Untere Hauptschalterreihe
  // ------------------------------------------------------------------
  const switchCount = 16;
  const switchXs = [];

  for (let i = 0; i < switchCount; i++) {
    switchXs.push(-2.5 + i * (5.0 / (switchCount - 1)));
  }

  const switchHousing = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.235, 0.64, 0.13),
    darkMat,
    switchCount
  );

  const switchBlades = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.095, 0.45, 0.075),
    blueMat,
    switchCount
  );

  const switchCaps = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 0.055, 0.1),
    copperMat,
    switchCount
  );

  for (let i = 0; i < switchCount; i++) {
    matrix.makeTranslation(switchXs[i], 1.07, 0.505);
    switchHousing.setMatrixAt(i, matrix);

    matrix.makeTranslation(switchXs[i], 1.08, 0.585);
    switchBlades.setMatrixAt(i, matrix);

    matrix.makeTranslation(switchXs[i], 1.34, 0.585);
    switchCaps.setMatrixAt(i, matrix);
  }

  switchHousing.instanceMatrix.needsUpdate = true;
  switchBlades.instanceMatrix.needsUpdate = true;
  switchCaps.instanceMatrix.needsUpdate = true;
  root.add(switchHousing, switchBlades, switchCaps);

  const switchRail = new THREE.Mesh(
    new THREE.BoxGeometry(5.3, 0.11, 0.18),
    railMat
  );
  switchRail.position.set(0, 0.73, 0.5);
  root.add(switchRail);

  const separatorGeometry = new THREE.BoxGeometry(0.018, 0.54, 0.032);
  const separators = new THREE.InstancedMesh(
    separatorGeometry,
    copperMat,
    switchCount - 1
  );

  for (let i = 0; i < switchCount - 1; i++) {
    matrix.makeTranslation(switchXs[i] + 0.156, 1.07, 0.57);
    separators.setMatrixAt(i, matrix);
  }
  separators.instanceMatrix.needsUpdate = true;
  root.add(separators);

  // Notabschaltungsanzeigen sind in der Paneelfläche eingelassen.
  const indicatorXs = [-2.45, 0, 2.45];

  for (const x of indicatorXs) {
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.11, 0.07),
      copperMat
    );
    bezel.position.set(x, 1.52, 0.55);
    root.add(bezel);

    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.055, 0.045),
      redMat
    );
    indicator.position.set(x, 1.52, 0.605);
    root.add(indicator);
  }

  // ------------------------------------------------------------------
  // Türkise Bodenkonsolen
  // ------------------------------------------------------------------
  const consoleXs = [-2.08, 0, 2.08];
  const consoleStrips = [];

  for (const x of consoleXs) {
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(x, 0, 1.02);
    root.add(consoleGroup);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 0.7, 0.78),
      hullMat
    );
    pedestal.position.set(0, 0.35, 0);
    consoleGroup.add(pedestal);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.12, 0.92),
      railMat
    );
    base.position.set(0, 0.06, 0);
    consoleGroup.add(base);

    const frontInset = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.35, 0.035),
      darkMat
    );
    frontInset.position.set(0, 0.39, 0.4075);
    consoleGroup.add(frontInset);

    // Bedienfläche zuerst flach bauen, danach als Gruppe neigen.
    const topGroup = new THREE.Group();
    topGroup.position.set(0, 0.77, 0.05);
    topGroup.rotation.x = -0.28;
    consoleGroup.add(topGroup);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.075, 0.72),
      darkMat
    );
    topGroup.add(top);

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 5; column++) {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.115, 0.018, 0.38),
          turquoiseMat
        );
        strip.position.set(
          -0.4 + column * 0.2,
          0.048,
          -0.025 + row * 0.2
        );
        topGroup.add(strip);
        consoleStrips.push(strip);
      }
    }

    for (const side of [-1, 1]) {
      const sideLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.42, 0.035),
        turquoiseMat
      );
      sideLight.position.set(side * 0.605, 0.39, 0.425);
      consoleGroup.add(sideLight);
      consoleStrips.push(sideLight);
    }
  }

  // Geschlossene Energiekanäle vom Paneel zu den Konsolen.
  for (const x of consoleXs) {
    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.035, 0.56),
      turquoiseMat
    );
    channel.position.set(x, 0.028, 0.47);
    root.add(channel);
  }

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const colPanel = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.6, 0.58),
    collisionMaterial
  );
  colPanel.name = 'COL_verteilerpaneel';
  colPanel.position.set(0, 1.8, 0.29);
  root.add(colPanel);

  for (let i = 0; i < consoleXs.length; i++) {
    const colConsole = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.86, 0.92),
      collisionMaterial
    );
    colConsole.name = `COL_bodenkonsole_${i + 1}`;
    colConsole.position.set(consoleXs[i], 0.43, 1.02);
    root.add(colConsole);
  }

  // ------------------------------------------------------------------
  // Benutzen-Punkt und Lichtquellen
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.3, 1.65);
  use.userData = {
    label: 'Energieverteiler bedienen',
    radius: 0.9,
  };
  root.add(use);

  // LAMP-Punkte liegen unmittelbar an den beleuchteten Bauteilen.
  const lampSwitch = new THREE.Object3D();
  lampSwitch.name = 'LAMP_schaltblau';
  lampSwitch.position.set(0, 1.08, 0.7);
  lampSwitch.userData = {
    color: '#42d8ff',
    intensity: 8,
    distance: 6,
  };
  root.add(lampSwitch);

  const lampConsole = new THREE.Object3D();
  lampConsole.name = 'LAMP_console';
  lampConsole.position.set(0, 0.82, 1.28);
  lampConsole.userData = {
    color: '#24f0d0',
    intensity: 7,
    distance: 5,
  };
  root.add(lampConsole);

  const lampSnow = new THREE.Object3D();
  lampSnow.name = 'LAMP_snowflake';
  lampSnow.position.set(0, 2.38, 0.76);
  lampSnow.userData = {
    color: '#ff8a2a',
    intensity: 6,
    distance: 5,
  };
  root.add(lampSnow);

  // ------------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------------
  let notaus = false;
  let energie = 100;
  let verteilerZentrale = true;
  let verteilerOst = true;
  let verteilerWest = true;
  let umleitung = 'Zentrale';
  let zeit = 0;
  let letzte = null;
  let pulsGroesse = 1;

  function update(dt) {
    zeit += dt;

    const fluss = THREE.MathUtils.clamp(
      notaus ? 0 : energie / 100,
      0,
      1
    );
    const puls = 0.5 + 0.5 * Math.sin(zeit * 2.15);
    const flackern = 0.96 + 0.04 * Math.sin(zeit * 10.7);

    screenMat.emissiveIntensity = notaus
      ? 0.08 + puls * 0.1
      : 0.22 + puls * 0.2;

    orangeMat.emissiveIntensity = notaus
      ? 0.22 + puls * 0.28
      : 1.65 + puls * 1.25;

    orangeDimMat.emissiveIntensity = notaus
      ? 0.12
      : 0.35 + puls * 0.25;

    if (notaus) {
      blueMat.emissiveIntensity =
        0.06 + Math.max(0, Math.sin(zeit * 15)) * 0.18;
      turquoiseMat.emissiveIntensity = 0.035;
      redMat.emissiveIntensity = 1.7 + puls * 1.8;
    } else {
      blueMat.emissiveIntensity =
        fluss * (2.1 + puls * 1.45) * flackern;
      turquoiseMat.emissiveIntensity =
        fluss * (1.45 + puls * 1.05);
      redMat.emissiveIntensity = 0.12;
    }

    const zielGroesse = 1 + Math.sin(zeit * 0.9) * 0.012;
    pulsGroesse +=
      (zielGroesse - pulsGroesse) * Math.min(1, dt * 4);

    snowGroup.scale.setScalar(pulsGroesse);
    snowGroup.rotation.z = Math.sin(zeit * 0.16) * 0.012;

    consoleStrips.forEach((strip, index) => {
      const phase = Math.sin(zeit * 3.05 - index * 0.34);
      strip.material.emissiveIntensity = notaus
        ? 0.035
        : fluss * (1.05 + Math.max(0, phase) * 1.75);
    });
  }

  panel.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------------
  const api = {
    get notaus() {
      return notaus;
    },
    get energie() {
      return energie;
    },
    get verteilerZentrale() {
      return verteilerZentrale;
    },
    get verteilerOst() {
      return verteilerOst;
    },
    get verteilerWest() {
      return verteilerWest;
    },
    get umleitung() {
      return umleitung;
    },

    notausEinschalten() {
      notaus = true;
    },

    notausAufheben() {
      notaus = false;
    },

    verteilungWiederherstellen() {
      verteilerZentrale = true;
      verteilerOst = true;
      verteilerWest = true;
      umleitung = 'Zentrale';
      energie = 100;
      notaus = false;
    },

    umleitungOst() {
      verteilerZentrale = false;
      verteilerOst = true;
      verteilerWest = false;
      umleitung = 'Ostpier';
      energie = 78;
      notaus = false;
    },

    umleitungWest() {
      verteilerZentrale = false;
      verteilerOst = false;
      verteilerWest = true;
      umleitung = 'Westpier';
      energie = 78;
      notaus = false;
    },

    energieSetzen(wert) {
      energie = THREE.MathUtils.clamp(Number(wert) || 0, 0, 100);
      if (energie > 0) {
        notaus = false;
      }
    },

    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'notaus_ein',
      label: 'Notabschaltung der Stadtenergie aktivieren',
      run: () => api.notausEinschalten(),
    },
    {
      id: 'notaus_aus',
      label: 'Notabschaltung aufheben',
      run: () => api.notausAufheben(),
    },
    {
      id: 'umleitung_ost',
      label: 'Energie über den Ostpier umleiten',
      run: () => api.umleitungOst(),
    },
    {
      id: 'umleitung_west',
      label: 'Energie über den Westpier umleiten',
      run: () => api.umleitungWest(),
    },
    {
      id: 'verteilung_wiederherstellen',
      label: 'Zentrale Verteilung wiederherstellen',
      run: () => api.verteilungWiederherstellen(),
    },
  ];

  return root;
}

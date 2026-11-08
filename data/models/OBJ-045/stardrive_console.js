// stardrive_console.js
// Antiker Sternenantrieb – Steuerkonsole für Unterlicht- und Hyperraumfahrt
import * as THREE from 'three';

export const steckbrief = {
  name: 'stardrive_console',
  art: 'Standobjekt',
  masse: '1,50 × 1,40 × 0,76 (B × H × T, m)',
  wohin: 'ATL-036 Hauptstromraum, ATL-038 ZPM-Raum',
  benutzen: 'INT_bedienen → Antrieb vorheizen, zünden oder abschalten',
  lichter: 'LAMP_schirm und LAMP_antrieb, eisblau',
  animation: 'Statusanzeigen und Ringsegmente leuchten pulsierend; Vorheizen glüht bernsteinfarben, die Zündung weiß-blau; Antriebsringe drehen sich',
  quelle: 'selbst gebaut'
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'stardrive_console';

  // Alle Zustände und Materialien sind instanzlokal, damit mehrere Konsolen
  // unabhängig voneinander animiert werden können.
  const kit = (name) => new THREE.MeshStandardMaterial({
    name: `KIT_${name}`
  });

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'stardrive_screen',
    color: 0x03111b,
    emissive: 0x176f91,
    emissiveIntensity: 0.12,
    metalness: 0.32,
    roughness: 0.24
  });

  const matCyan = new THREE.MeshStandardMaterial({
    name: 'stardrive_cyan',
    color: 0x7bcde1,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.08,
    metalness: 0.18,
    roughness: 0.2
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'stardrive_amber',
    color: 0x8a4819,
    emissive: 0xffa23c,
    emissiveIntensity: 0.06,
    metalness: 0.22,
    roughness: 0.3
  });

  const matCore = new THREE.MeshStandardMaterial({
    name: 'stardrive_core',
    color: 0xccefff,
    emissive: 0xa5eaff,
    emissiveIntensity: 0.08,
    metalness: 0.08,
    roughness: 0.16
  });

  const matDarkMetal = new THREE.MeshStandardMaterial({
    name: 'stardrive_darkMetal',
    color: 0x172733,
    metalness: 0.78,
    roughness: 0.38
  });

  const matGlass = new THREE.MeshStandardMaterial({
    name: 'stardrive_glass',
    color: 0x4c9eb4,
    emissive: 0x0b4560,
    emissiveIntensity: 0.18,
    metalness: 0.12,
    roughness: 0.12,
    transparent: true,
    opacity: 0.32
  });

  // ------------------------------------------------------------------
  // Grundkörper
  // Ursprung: Mitte der Unterseite, x/z mittig, Vorderseite nach +Z
  // ------------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.14, 0.74),
    matDarkMetal
  );
  base.position.set(0, 0.07, 0);
  root.add(base);

  const baseTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.055, 0.64),
    kit('copper')
  );
  baseTrim.position.set(0, 0.165, 0.005);
  root.add(baseTrim);

  const baseFoot = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.035, 0.68),
    kit('wallDark')
  );
  baseFoot.position.set(0, 0.0175, 0);
  root.add(baseFoot);

  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.68, 0.48),
    kit('pillar')
  );
  cabinet.position.set(0, 0.51, -0.055);
  root.add(cabinet);

  const frontInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.47, 0.035),
    kit('wall')
  );
  frontInset.position.set(0, 0.49, 0.202);
  root.add(frontInset);

  const lowerBrass = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.045, 0.05),
    kit('copper')
  );
  lowerBrass.position.set(0, 0.245, 0.225);
  root.add(lowerBrass);

  // Geschlossene Kabelkanäle an beiden Seiten
  for (const side of [-1, 1]) {
    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.63, 12),
      kit('copper')
    );
    conduit.position.set(side * 0.49, 0.47, 0.245);
    root.add(conduit);

    const conduitCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.063, 0.063, 0.045, 12),
      kit('wallDark')
    );
    conduitCap.position.set(side * 0.49, 0.755, 0.245);
    root.add(conduitCap);

    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.19, 0.56),
      kit('wallDark')
    );
    shoulder.position.set(side * 0.59, 0.27, 0.005);
    root.add(shoulder);
  }

  // Übergang zwischen Unterbau und rückwärtiger Anzeigetafel
  const riser = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.14, 0.38),
    kit('wallDark')
  );
  riser.position.set(0, 0.86, -0.14);
  root.add(riser);

  // Rückwärtige, aufrechte Antriebsanzeige
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.48, 0.19),
    kit('wall')
  );
  housing.position.set(0, 1.12, -0.255);
  root.add(housing);

  const housingFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.38, 0.035),
    kit('wallDark')
  );
  housingFrame.position.set(0, 1.12, -0.145);
  root.add(housingFrame);

  const topCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.06, 0.28),
    kit('copper')
  );
  topCap.position.set(0, 1.37, -0.225);
  root.add(topCap);

  // Rückseitige Verstärkungsrippen
  for (let i = -2; i <= 2; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.39, 0.035),
      kit('wallDark')
    );
    rib.position.set(i * 0.235, 1.12, -0.373);
    root.add(rib);
  }

  // ------------------------------------------------------------------
  // Schräge Bedienfläche
  // Flach in X/Z aufgebaut und anschließend als Gruppe geneigt.
  // +Z ist die zur Spieler gewandte Vorderseite.
  // ------------------------------------------------------------------
  const panelGroup = new THREE.Group();
  panelGroup.position.set(0, 0.9, 0.085);
  panelGroup.rotation.x = 0.43;
  root.add(panelGroup);

  const panelSlab = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.075, 0.52),
    kit('wallDark')
  );
  panelGroup.add(panelSlab);

  const panelInset = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.018, 0.43),
    kit('copper')
  );
  panelInset.position.y = 0.046;
  panelGroup.add(panelInset);

  const mainDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.022, 0.29),
    matScreen
  );
  mainDisplay.position.set(0, 0.065, 0.005);
  panelGroup.add(mainDisplay);

  // Raster auf dem Hauptdisplay: zwei Schleifen für Reihen und Spalten
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 5; column++) {
      const x = (column - 2) * 0.085;
      const z = (row - 1) * 0.07;
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.062, 0.006, 0.009),
        matCyan
      );
      line.position.set(x, 0.079, z);
      panelGroup.add(line);
    }
  }

  const displayHeader = new THREE.Mesh(
    new THREE.BoxGeometry(0.43, 0.008, 0.017),
    matAmber
  );
  displayHeader.position.set(0, 0.079, 0.117);
  panelGroup.add(displayHeader);

  // Zwei Tastenfelder als InstancedMesh
  const buttonGeometry = new THREE.CylinderGeometry(0.024, 0.029, 0.035, 12);
  const buttonMaterial = new THREE.MeshStandardMaterial({
    name: 'stardrive_buttons',
    color: 0x704018,
    emissive: 0xff8a22,
    emissiveIntensity: 0.035,
    metalness: 0.24,
    roughness: 0.36
  });

  const buttons = new THREE.InstancedMesh(buttonGeometry, buttonMaterial, 16);
  buttons.name = 'stardrive_tasten';
  const buttonMatrix = new THREE.Matrix4();
  let buttonIndex = 0;

  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 4; column++) {
        const x = side * (0.37 + column * 0.087);
        const z = (row - 0.5) * 0.13;
        buttonMatrix.makeTranslation(x, 0.093, z);
        buttons.setMatrixAt(buttonIndex, buttonMatrix);
        buttonIndex++;
      }
    }
  }
  buttons.instanceMatrix.needsUpdate = true;
  panelGroup.add(buttons);

  // Kleine runde Statusleuchten neben dem Display
  for (const side of [-1, 1]) {
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.048, 0.038, 16),
      kit('copper')
    );
    bezel.position.set(side * 0.25, 0.089, 0);
    panelGroup.add(bezel);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.027, 0.012, 16),
      side < 0 ? matAmber : matCyan
    );
    lens.position.set(side * 0.25, 0.115, 0);
    panelGroup.add(lens);
  }

  // Untere Bedienkante mit Griffmulden
  const frontEdge = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.065, 0.075),
    kit('copper')
  );
  frontEdge.position.set(0, -0.015, 0.225);
  panelGroup.add(frontEdge);

  // ------------------------------------------------------------------
  // Zentraler Hyperantriebsring auf der Rückwand
  // ------------------------------------------------------------------
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, 1.14, -0.095);
  root.add(ringGroup);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.028, 10, 40),
    kit('copper')
  );
  ringGroup.add(outerRing);

  const outerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.212, 0.012, 8, 40),
    matDarkMetal
  );
  outerRim.position.z = -0.018;
  ringGroup.add(outerRim);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.132, 0.017, 8, 32),
    matCyan
  );
  innerRing.position.z = 0.016;
  ringGroup.add(innerRing);

  // Segmentierter, drehbarer Innenring
  const segmentGroup = new THREE.Group();
  segmentGroup.position.z = 0.028;
  ringGroup.add(segmentGroup);

  const segmentMaterials = [];
  for (let i = 0; i < 8; i++) {
    const segmentMaterial = new THREE.MeshStandardMaterial({
      name: `stardrive_ringsegment_${i}`,
      color: 0x425866,
      emissive: i % 2 === 0 ? 0x6fe3ff : 0xffa23c,
      emissiveIntensity: 0.04,
      metalness: 0.38,
      roughness: 0.24
    });
    segmentMaterials.push(segmentMaterial);

    const segment = new THREE.Mesh(
      new THREE.TorusGeometry(0.096, 0.009, 6, 7, Math.PI / 4 - 0.07),
      segmentMaterial
    );
    segment.rotation.z = i * Math.PI / 4;
    segmentGroup.add(segment);
  }

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.065, 24),
    kit('wallDark')
  );
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.01;
  ringGroup.add(hub);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.057, 0.057, 0.024, 24),
    matCore
  );
  core.rotation.x = Math.PI / 2;
  core.position.z = 0.052;
  ringGroup.add(core);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.077, 0.077, 0.012, 24),
    matGlass
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.072;
  ringGroup.add(lens);

  // ------------------------------------------------------------------
  // Statusanzeigen der Rückwand
  // ------------------------------------------------------------------
  const statusMaterials = [];
  const statusPositions = [-0.49, -0.39, 0.39, 0.49];

  for (let i = 0; i < statusPositions.length; i++) {
    const material = new THREE.MeshStandardMaterial({
      name: `stardrive_status_${i}`,
      color: 0x1a2830,
      emissive: i < 2 ? 0xffa23c : 0x6fe3ff,
      emissiveIntensity: 0.025,
      metalness: 0.18,
      roughness: 0.26
    });
    statusMaterials.push(material);

    const status = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.13, 0.018),
      material
    );
    status.position.set(statusPositions[i], 1.14, -0.116);
    root.add(status);
  }

  // Kleine Statusfächer über dem Ring
  const headerStatus = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.032, 0.018),
    matCyan
  );
  headerStatus.position.set(0, 1.295, -0.113);
  root.add(headerStatus);

  // ------------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------------
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.4, 0.76)
  );
  collision.name = 'COL_stardrive_console';
  collision.position.set(0, 0.7, 0);
  collision.userData.aktiv = true;
  root.add(collision);

  // ------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.02, 0.64);
  use.userData = {
    label: 'Sternenantrieb bedienen',
    radius: 0.8
  };
  root.add(use);

  const screenLamp = new THREE.Object3D();
  screenLamp.name = 'LAMP_schirm';
  screenLamp.position.set(0, 1.14, 0.08);
  screenLamp.userData = {
    color: '#6fe3ff',
    intensity: 6,
    distance: 4
  };
  const screenPoint = new THREE.PointLight(0x6fe3ff, 1.1, 4);
  screenLamp.add(screenPoint);
  root.add(screenLamp);

  const driveLamp = new THREE.Object3D();
  driveLamp.name = 'LAMP_antrieb';
  driveLamp.position.set(0, 1.14, 0.13);
  driveLamp.userData = {
    color: '#b9f4ff',
    intensity: 8,
    distance: 5
  };
  const drivePoint = new THREE.PointLight(0xb9f4ff, 0.35, 5);
  driveLamp.add(drivePoint);
  root.add(driveLamp);

  // ------------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------------
  let phase = 'aus'; // aus | vorheizen | laeuft
  let zeit = 0;
  let letzte = null;

  let screenIntensity = 0.12;
  let cyanIntensity = 0.08;
  let amberIntensity = 0.06;
  let coreIntensity = 0.08;
  let driveLightIntensity = 0.35;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    const vorheizen = phase === 'vorheizen';
    const laeuft = phase === 'laeuft';

    const zielScreen = laeuft ? 2.15 : vorheizen ? 0.62 : 0.12;
    const zielCyan = laeuft ? 3.1 : vorheizen ? 0.3 : 0.08;
    const zielAmber = laeuft ? 0.7 : vorheizen ? 1.8 : 0.06;
    const zielCore = laeuft ? 5.2 : vorheizen ? 0.28 : 0.08;
    const zielLicht = laeuft ? 4.8 : vorheizen ? 1.2 : 0.35;

    const k = Math.min(1, step * 6);
    screenIntensity += (zielScreen - screenIntensity) * k;
    cyanIntensity += (zielCyan - cyanIntensity) * k;
    amberIntensity += (zielAmber - amberIntensity) * k;
    coreIntensity += (zielCore - coreIntensity) * k;
    driveLightIntensity += (zielLicht - driveLightIntensity) * k;

    const screenPulse = 0.88 + 0.12 * Math.sin(zeit * 4.2);
    const cyanPulse = 0.9 + 0.1 * Math.sin(zeit * 5.1);
    const amberPulse = 0.87 + 0.13 * Math.sin(zeit * 3.4);

    matScreen.emissiveIntensity = screenIntensity * screenPulse;
    matCyan.emissiveIntensity = cyanIntensity * cyanPulse;
    matAmber.emissiveIntensity = amberIntensity * amberPulse;
    matCore.emissiveIntensity = coreIntensity * (0.94 + 0.06 * Math.sin(zeit * 8));

    buttonMaterial.emissiveIntensity = phase === 'aus'
      ? 0.035
      : (vorheizen ? 0.52 : 1.15) * (0.8 + 0.2 * Math.sin(zeit * 4));

    segmentMaterials.forEach((material, i) => {
      const wave = 0.5 + 0.5 * Math.sin(zeit * 5.2 - i * 0.75);
      if (laeuft) {
        material.emissiveIntensity = 0.55 + 2.2 * wave;
      } else if (vorheizen) {
        material.emissiveIntensity = 0.12 + 1.25 * wave;
      } else {
        material.emissiveIntensity = 0.04;
      }
    });

    statusMaterials.forEach((material, i) => {
      let value = 0.025;
      if (vorheizen) {
        value = i < 2 ? 1.5 : 0.14;
      } else if (laeuft) {
        value = i < 2 ? 0.45 : 1.85;
      }
      material.emissiveIntensity = value * (0.82 + 0.18 * Math.sin(zeit * 4 - i * 0.6));
    });

    const ringSpeed = laeuft ? 0.9 : vorheizen ? 0.28 : 0.055;
    ringGroup.rotation.z = zeit * ringSpeed;
    segmentGroup.rotation.z = -zeit * ringSpeed * 1.55;
    innerRing.rotation.z = zeit * ringSpeed * 0.7;

    const coreScale = laeuft
      ? 1 + 0.035 * Math.sin(zeit * 9)
      : vorheizen
        ? 1 + 0.075 * Math.sin(zeit * 3.8)
        : 1;
    core.scale.set(coreScale, coreScale, coreScale);

    screenPoint.intensity = 0.8 + screenIntensity * 0.2;
    drivePoint.intensity = driveLightIntensity;
  }

  // Sichtbares Mesh als zusätzlicher Animationstreiber.
  core.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  // Öffentliche Update-Funktion für Renderer oder Schaukasten.
  root.userData.update = update;

  // ------------------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // ------------------------------------------------------------------
  const api = {
    vorheizen() {
      if (phase === 'aus') {
        phase = 'vorheizen';
      }
    },

    zünden() {
      if (phase === 'vorheizen' || phase === 'laeuft') {
        phase = 'laeuft';
      }
    },

    abschalten() {
      phase = 'aus';
    },

    get phase() {
      return phase;
    },

    get vorbereitet() {
      return phase === 'vorheizen' || phase === 'laeuft';
    },

    get laeuft() {
      return phase === 'laeuft';
    }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'vorheizen',
      label: 'Antrieb vorheizen',
      run: () => api.vorheizen()
    },
    {
      id: 'zünden',
      label: 'Antrieb zünden',
      run: () => api.zünden()
    },
    {
      id: 'abschalten',
      label: 'Antrieb abschalten',
      run: () => api.abschalten()
    }
  ];

  return root;
}

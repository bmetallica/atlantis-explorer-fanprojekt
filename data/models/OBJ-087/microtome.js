// Antiker Mikrotom-Gewebeschneider / Lantean Tissue Microtome
// Tischgerät auf einem Kompakt-Stativ, ca. 47 × 28 × 38 cm.
// Ursprung: Mitte der Unterseite. Vorderseite zeigt nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'microtome',
  art: 'Tischgerät',
  masse: '0,47 × 0,28 × 0,38 (B × H × T, m)',
  wohin: 'ATL-013 (Biolabor), ATL-015 (Nanite-Labor)',
  benutzen: 'INT_schneiden → Menü aus userData.actions',
  lichter: 'LAMP_schnittleiste (eisblau), LAMP_anzeige (bernstein)',
  animation: 'Handrad dreht beim Schneiden, Messer und Probenhalter bewegen sich sanft, ein fertiger Gewebeschnitt erscheint in der Auffangschale',
  quelle: 'selbst gebaut; reale Referenz: Rotationsmikrotom',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'microtome';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------
  const hull = kit('hull');
  const dark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const rail = kit('rail');

  const steel = new THREE.MeshStandardMaterial({
    name: 'stainless_steel',
    color: 0xb9c4ca,
    metalness: 0.94,
    roughness: 0.23,
  });

  const darkSteel = new THREE.MeshStandardMaterial({
    name: 'dark_steel',
    color: 0x263640,
    metalness: 0.82,
    roughness: 0.3,
  });

  const black = new THREE.MeshStandardMaterial({
    name: 'black_insert',
    color: 0x11181d,
    metalness: 0.38,
    roughness: 0.42,
  });

  const amber = new THREE.MeshStandardMaterial({
    name: 'amber_sample',
    color: 0xb66a28,
    emissive: 0x743608,
    emissiveIntensity: 0.3,
    metalness: 0.04,
    roughness: 0.38,
  });

  const amberGlass = new THREE.MeshStandardMaterial({
    name: 'amber_sample_glass',
    color: 0xe3a25a,
    emissive: 0xff9e42,
    emissiveIntensity: 0.38,
    metalness: 0.02,
    roughness: 0.17,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    name: 'microtome_glow',
    color: 0x8deaff,
    emissive: 0x4bcfff,
    emissiveIntensity: 1.35,
    metalness: 0.08,
    roughness: 0.26,
  });

  const amberGlowMat = new THREE.MeshStandardMaterial({
    name: 'microtome_amber_glow',
    color: 0xffc273,
    emissive: 0xff8c32,
    emissiveIntensity: 1.0,
    metalness: 0.08,
    roughness: 0.3,
  });

  // ------------------------------------------------------------------
  // Grundplatte und Füße
  // ------------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.035, 0.34),
    hull,
  );
  base.position.set(0, 0.0175, 0);
  root.add(base);

  const lowerInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.012, 0.29),
    dark,
  );
  lowerInset.position.set(0, 0.041, -0.005);
  root.add(lowerInset);

  const footGeometry = new THREE.CylinderGeometry(0.022, 0.024, 0.012, 16);
  for (const x of [-0.145, 0.145]) {
    for (const z of [-0.135, 0.135]) {
      const foot = new THREE.Mesh(footGeometry, darkSteel);
      foot.position.set(x, 0.006, z);
      root.add(foot);
    }
  }

  // Bronze-Kanten an der Grundplatte
  for (const z of [-0.168, 0.168]) {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.33, 0.008, 0.012),
      copper,
    );
    trim.position.set(0, 0.044, z);
    root.add(trim);
  }

  // ------------------------------------------------------------------
  // Rückwärtiges Gehäuse und Führungssäule
  // ------------------------------------------------------------------
  const rearHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.335, 0.175, 0.095),
    hull,
  );
  rearHousing.position.set(-0.012, 0.135, -0.122);
  root.add(rearHousing);

  const rearTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.335, 0.018, 0.108),
    dark,
  );
  rearTop.position.set(-0.012, 0.2315, -0.122);
  root.add(rearTop);

  const rearInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.245, 0.095, 0.012),
    dark,
  );
  rearInset.position.set(-0.012, 0.14, -0.070);
  root.add(rearInset);

  // Senkrechte Trägerstütze links hinten
  const column = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.20, 0.085),
    pillar,
  );
  column.position.set(-0.132, 0.145, -0.035);
  root.add(column);

  const columnCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.018, 0.10),
    copper,
  );
  columnCap.position.set(-0.132, 0.254, -0.035);
  root.add(columnCap);

  // Kleine seitliche Einstellschraube am Gehäuse
  const sideKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.024, 16),
    copper,
  );
  sideKnob.rotation.z = Math.PI / 2;
  sideKnob.position.set(-0.174, 0.178, -0.105);
  root.add(sideKnob);

  // Schmale Führungsschiene unter Messer und Probenhalter
  const guide = new THREE.Mesh(
    new THREE.BoxGeometry(0.285, 0.022, 0.075),
    steel,
  );
  guide.position.set(0.018, 0.083, 0.012);
  root.add(guide);

  const guideInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.235, 0.007, 0.042),
    darkSteel,
  );
  guideInset.position.set(0.018, 0.097, 0.012);
  root.add(guideInset);

  // ------------------------------------------------------------------
  // Probenhalter
  // ------------------------------------------------------------------
  const sampleAssembly = new THREE.Group();
  sampleAssembly.position.set(-0.067, 0.108, 0.052);
  root.add(sampleAssembly);

  const holderBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.034, 0.095),
    darkSteel,
  );
  holderBase.position.y = 0.017;
  sampleAssembly.add(holderBase);

  const holderPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.052, 16),
    steel,
  );
  holderPost.position.set(0, 0.052, 0);
  sampleAssembly.add(holderPost);

  const holderJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.064, 0.068),
    black,
  );
  holderJaw.position.set(0, 0.092, 0);
  sampleAssembly.add(holderJaw);

  const jawLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.052, 0.075),
    steel,
  );
  jawLeft.position.set(-0.026, 0.105, 0);
  sampleAssembly.add(jawLeft);

  const jawRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.052, 0.075),
    steel,
  );
  jawRight.position.set(0.026, 0.105, 0);
  sampleAssembly.add(jawRight);

  const sample = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.046, 0.03),
    amber,
  );
  sample.position.set(0, 0.106, 0.003);
  sampleAssembly.add(sample);

  const sampleTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.004, 0.032),
    amberGlass,
  );
  sampleTop.position.set(0, 0.131, 0.003);
  sampleAssembly.add(sampleTop);

  // Klemmschraube rechts am Probenhalter
  const clampScrew = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.027, 16),
    copper,
  );
  clampScrew.rotation.z = Math.PI / 2;
  clampScrew.position.set(0.043, 0.055, 0);
  sampleAssembly.add(clampScrew);

  const clampCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.008, 16),
    darkSteel,
  );
  clampCap.rotation.z = Math.PI / 2;
  clampCap.position.set(0.061, 0.055, 0);
  sampleAssembly.add(clampCap);

  // ------------------------------------------------------------------
  // Messerhalter und Klinge
  // ------------------------------------------------------------------
  const knifeAssembly = new THREE.Group();
  knifeAssembly.position.set(0.018, 0.184, 0.046);
  root.add(knifeAssembly);

  const knifeCarrier = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.045, 0.038),
    steel,
  );
  knifeAssembly.add(knifeCarrier);

  const knifeBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.215, 0.016, 0.044),
    darkSteel,
  );
  knifeBack.position.set(0, 0.024, -0.002);
  knifeAssembly.add(knifeBack);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.011, 0.025),
    steel,
  );
  blade.position.set(0, -0.021, 0.005);
  knifeAssembly.add(blade);

  const bladeEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.004, 0.006),
    pillar,
  );
  bladeEdge.position.set(0, -0.0265, 0.015);
  knifeAssembly.add(bladeEdge);

  // Messerhalter-Klemmung links
  const clamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.07, 0.062),
    darkSteel,
  );
  clamp.position.set(-0.103, 0.012, -0.008);
  knifeAssembly.add(clamp);

  const clampKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.032, 16),
    copper,
  );
  clampKnob.rotation.z = Math.PI / 2;
  clampKnob.position.set(-0.132, 0.012, -0.008);
  knifeAssembly.add(clampKnob);

  // Messerführung und Anschlag
  const guidePost = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.075, 0.035),
    pillar,
  );
  guidePost.position.set(0.105, -0.038, -0.018);
  knifeAssembly.add(guidePost);

  const guideStop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.018, 16),
    copper,
  );
  guideStop.rotation.x = Math.PI / 2;
  guideStop.position.set(0.105, 0.013, -0.018);
  knifeAssembly.add(guideStop);

  // ------------------------------------------------------------------
  // Seitliches Handrad
  // ------------------------------------------------------------------
  const wheelAssembly = new THREE.Group();
  wheelAssembly.position.set(0.202, 0.162, -0.052);
  root.add(wheelAssembly);

  const wheelDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.083, 0.083, 0.024, 32),
    hull,
  );
  wheelDisc.rotation.z = Math.PI / 2;
  wheelAssembly.add(wheelDisc);

  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.078, 0.011, 12, 36),
    copper,
  );
  wheelRim.rotation.y = Math.PI / 2;
  wheelAssembly.add(wheelRim);

  const wheelHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.041, 24),
    steel,
  );
  wheelHub.rotation.z = Math.PI / 2;
  wheelAssembly.add(wheelHub);

  const wheelAxle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.09, 16),
    darkSteel,
  );
  wheelAxle.rotation.z = Math.PI / 2;
  wheelAxle.position.x = -0.029;
  wheelAssembly.add(wheelAxle);

  // Radiale Speichen
  const spokeGeometry = new THREE.BoxGeometry(0.014, 0.15, 0.01);
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(spokeGeometry, darkSteel);
    spoke.position.x = 0.014;
    spoke.rotation.x = i * Math.PI / 2;
    wheelAssembly.add(spoke);
  }

  // Handgriff am Rad
  const handleStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.068, 12),
    steel,
  );
  handleStem.position.set(0.041, 0.058, 0);
  handleStem.rotation.z = -0.34;
  wheelAssembly.add(handleStem);

  const handleGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.019, 0.067, 16),
    black,
  );
  handleGrip.position.set(0.053, 0.096, 0);
  handleGrip.rotation.z = -0.34;
  wheelAssembly.add(handleGrip);

  // ------------------------------------------------------------------
  // Auffangschale und Gewebeschnitt
  // ------------------------------------------------------------------
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.012, 0.072),
    darkSteel,
  );
  tray.position.set(0.047, 0.059, 0.133);
  root.add(tray);

  const trayInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.108, 0.004, 0.05),
    black,
  );
  trayInset.position.set(0.047, 0.067, 0.133);
  root.add(trayInset);

  const slice = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.003, 0.027),
    amberGlass,
  );
  slice.position.set(0.047, 0.071, 0.133);
  slice.visible = false;
  root.add(slice);

  // Kleine Schubladenfront und Griff an der Vorderseite
  const drawer = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.026, 0.012),
    dark,
  );
  drawer.position.set(0.055, 0.028, 0.171);
  root.add(drawer);

  const drawerHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.009, 0.018),
    copper,
  );
  drawerHandle.position.set(0.055, 0.028, 0.181);
  root.add(drawerHandle);

  // ------------------------------------------------------------------
  // Anzeigen, Beleuchtung und Beschriftungsträger
  // ------------------------------------------------------------------
  const display = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.026, 0.012),
    dark,
  );
  display.position.set(-0.132, 0.21, -0.069);
  root.add(display);

  const displayLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.004, 0.004),
    amberGlowMat,
  );
  displayLine.position.set(-0.132, 0.21, -0.061);
  root.add(displayLine);

  const lightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.007, 0.012),
    glowMat,
  );
  lightStrip.position.set(0.018, 0.244, -0.065);
  root.add(lightStrip);

  // Kleine Anzeigefelder neben dem Lichtstreifen
  for (let i = 0; i < 3; i++) {
    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.012, 0.006),
      i === 1 ? amberGlowMat : glowMat,
    );
    indicator.position.set(-0.045 + i * 0.028, 0.219, -0.064);
    root.add(indicator);
  }

  // ------------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.28, 0.36),
  );
  col.name = 'COL_microtome';
  col.position.set(0.02, 0.14, 0);
  root.add(col);

  // ------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_schneiden';
  use.position.set(0.015, 0.25, 0.28);
  use.userData = {
    label: 'Mikrotom bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_schnittleiste';
  lamp.position.set(0.018, 0.255, -0.035);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 3,
    distance: 1.5,
  };
  root.add(lamp);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_anzeige';
  lampAmber.position.set(-0.132, 0.214, -0.045);
  lampAmber.userData = {
    color: '#ffb45c',
    intensity: 1.5,
    distance: 0.9,
  };
  root.add(lampAmber);

  // ------------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------------
  let run = 0;
  let targetRun = 0;
  let completedCuts = 0;
  let sliceAmount = 0;
  let statusPulse = 0;

  function update(dt) {
    const step = Math.min(1, dt * 4.5);

    run += (targetRun - run) * step;

    if (targetRun > 0 && Math.abs(targetRun - run) < 0.002) {
      run = targetRun;
      completedCuts = targetRun;
    }

    // Das Handrad treibt Messer und Probenhalter an.
    wheelAssembly.rotation.x = run * Math.PI * 3;
    knifeAssembly.position.y = 0.184 - Math.sin(run * Math.PI) * 0.004;
    sampleAssembly.position.y = 0.108 - Math.max(0, Math.sin(run * Math.PI)) * 0.008;

    // Ein fertiger Schnitt erscheint weich in der Schale.
    const wantedSlice = completedCuts > 0 ? 1 : 0;
    sliceAmount += (wantedSlice - sliceAmount) * Math.min(1, dt * 5);
    slice.visible = sliceAmount > 0.02;
    slice.scale.x = Math.max(0.01, sliceAmount);
    slice.scale.z = Math.max(0.01, sliceAmount);
    slice.material.emissiveIntensity = 0.25 + sliceAmount * 0.35;

    // Bernsteinanzeige und eisblaue Statusleiste.
    statusPulse += dt * 4;
    const active = Math.abs(targetRun - run) > 0.002;
    amberGlowMat.emissiveIntensity = active
      ? 0.8 + Math.max(0, Math.sin(statusPulse)) * 1.4
      : 0.55 + Math.max(0, Math.sin(statusPulse * 0.45)) * 0.18;

    glowMat.emissiveIntensity = active
      ? 1.2 + Math.max(0, Math.sin(statusPulse * 0.8)) * 0.8
      : 1.15;
  }

  const antrieb = base;
  antrieb.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (antrieb.userData.letzteZeit === undefined) {
      antrieb.userData.letzteZeit = now;
    }
    const dt = Math.min(now - antrieb.userData.letzteZeit, 0.1);
    antrieb.userData.letzteZeit = now;
    update(dt);
  };

  // ------------------------------------------------------------------
  // Öffentliche API
  // ------------------------------------------------------------------
  const api = {
    schneiden() {
      targetRun += 1;
      return true;
    },
    probeWechseln() {
      targetRun = 0;
      run = 0;
      completedCuts = 0;
      sliceAmount = 0;
      slice.visible = false;
      sample.scale.y = 1;
      sampleTop.visible = true;
      return true;
    },
    get schneidet() {
      return Math.abs(targetRun - run) > 0.002;
    },
    get geschnitteneSchnitte() {
      return completedCuts;
    },
    get fortschritt() {
      if (targetRun <= 0) return 0;
      return Math.min(1, run / targetRun);
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'schneiden',
      label: 'Gewebeschnitt herstellen',
      run: () => api.schneiden(),
    },
    {
      id: 'probewechseln',
      label: 'Neue Probe einsetzen',
      run: () => api.probeWechseln(),
    },
  ];

  return root;
}

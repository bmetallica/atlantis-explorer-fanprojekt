import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'ult_freezer',
  art: 'Standobjekt',
  masse: '0,80 × 2,00 × 0,90 m (B × H × T)',
  wohin: 'ATL-013 Biolabor, ATL-015 Nanite-Labor',
  benutzen: 'INT_tuer → Menü aus userData.actions',
  lichter: 'LAMP_anzeige (eisblau), LAMP_innen (eisblau, dauerhaft an)',
  animation: 'Tür öffnet weich nach +Z; Anzeige pulsiert; bei offener Tür tritt kalter Nebel aus',
  quelle: 'selbst gebaut, reale −80-°C-Laborreferenz',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'ult_freezer';

  const matHull = kit('hull');
  const matPearl = kit('pillar');
  const matDark = kit('wallDark');
  const matDoor = kit('door');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matGlass = kit('glass');

  const matSteelBlue = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_steel_blue',
    color: 0x426f86,
    metalness: 0.72,
    roughness: 0.34,
  });

  const matRubber = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_rubber',
    color: 0x20272b,
    metalness: 0.05,
    roughness: 0.82,
  });

  const matInterior = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_interior',
    color: 0xaebfc4,
    metalness: 0.78,
    roughness: 0.42,
  });

  const matInnerBlue = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_inner_blue',
    color: 0x183e54,
    metalness: 0.35,
    roughness: 0.5,
  });

  const matAlarm = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_alarm',
    color: 0x7d1111,
    emissive: 0xff2424,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });

  const matWarning = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_warning',
    color: 0xc58b1e,
    emissive: 0xffa52c,
    emissiveIntensity: 0.45,
    metalness: 0.25,
    roughness: 0.42,
  });

  const matColdGlow = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_cold_glow',
    color: 0xbfefff,
    emissive: 0x72dcff,
    emissiveIntensity: 1.35,
    roughness: 0.28,
  });

  function box(parent, name, w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, name, radius, height, x, y, z, material, segments = 12) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, segments),
      material
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // --- Gehäuse: 0,80 m breit, 2,00 m hoch, 0,90 m tief
  box(root, 'korpus_sockel', 0.80, 0.10, 0.90, 0, 0.05, 0, matDark);
  box(root, 'korpus_links', 0.05, 1.82, 0.90, -0.375, 1.01, 0, matHull);
  box(root, 'korpus_rechts', 0.05, 1.82, 0.90, 0.375, 1.01, 0, matHull);
  box(root, 'korpus_rueckwand', 0.70, 1.82, 0.05, 0, 1.01, -0.425, matHull);
  box(root, 'korpus_oben', 0.80, 0.08, 0.90, 0, 1.96, 0, matPearl);

  // Geschlossene Oberseite mit flacher Servicekante
  box(root, 'decken_servicekante', 0.66, 0.025, 0.72, 0, 1.985, 0, matSteelBlue);

  // Feste Frontblende des Maschinenfachs
  box(root, 'basisblende', 0.80, 0.20, 0.055, 0, 0.18, 0.422, matPearl);
  box(root, 'basisblende_boden', 0.80, 0.03, 0.065, 0, 0.105, 0.428, matDark);

  // Türrahmen: links, rechts und oben
  box(root, 'rahmen_links', 0.055, 1.70, 0.07, -0.362, 1.10, 0.438, matPearl);
  box(root, 'rahmen_rechts', 0.055, 1.70, 0.07, 0.362, 1.10, 0.438, matPearl);
  box(root, 'rahmen_oben', 0.67, 0.065, 0.07, 0, 1.90, 0.438, matPearl);
  box(root, 'schwellenleiste', 0.67, 0.035, 0.09, 0, 0.295, 0.435, matSteelBlue);

  // Innenraum mit geschlossenen Wänden
  box(root, 'innen_rueck', 0.64, 1.58, 0.025, 0, 1.10, -0.386, matInterior);
  box(root, 'innen_links', 0.025, 1.58, 0.78, -0.327, 1.10, 0, matInnerBlue);
  box(root, 'innen_rechts', 0.025, 1.58, 0.78, 0.327, 1.10, 0, matInnerBlue);
  box(root, 'innen_boden', 0.64, 0.04, 0.78, 0, 0.325, 0, matSteelBlue);
  box(root, 'innen_deckel', 0.64, 0.035, 0.78, 0, 1.885, 0, matInterior);

  // Dezente bronzefarbene Kanten und kalte Statusleiste
  box(root, 'akzent_boden', 0.66, 0.018, 0.016, 0, 0.285, 0.463, matCopper);
  box(root, 'akzent_oben', 0.60, 0.014, 0.016, 0, 1.865, 0.463, matRail);
  box(root, 'statusleiste', 0.38, 0.012, 0.012, 0, 1.866, 0.475, matColdGlow);

  // --- Probenregale mit Führungsschienen
  const shelfY = [0.52, 0.91, 1.30, 1.66];

  for (let i = 0; i < shelfY.length; i++) {
    box(root, `probenregal_${i + 1}`, 0.62, 0.022, 0.58, 0, shelfY[i], -0.015, matGlass);

    box(root, `regalschiene_links_${i + 1}`, 0.025, 0.035, 0.58, -0.305, shelfY[i] - 0.022, -0.015, matRail);
    box(root, `regalschiene_rechts_${i + 1}`, 0.025, 0.035, 0.58, 0.305, shelfY[i] - 0.022, -0.015, matRail);
    box(root, `regalleiste_${i + 1}`, 0.61, 0.026, 0.018, 0, shelfY[i] - 0.012, 0.276, matRail);
  }

  // Innenraumleuchte und rückwärtige Leitungen
  box(root, 'innen_leuchtbalken', 0.54, 0.018, 0.026, 0, 1.825, -0.355, matColdGlow);

  for (let i = 0; i < 4; i++) {
    box(
      root,
      `innen_leitung_${i + 1}`,
      0.43,
      0.012,
      0.014,
      0,
      1.57 + i * 0.038,
      -0.365,
      matCopper
    );
  }

  // --- Probenröhrchen als InstancedMesh
  const vialCount = 32;
  const vialBody = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.105, 10),
    matGlass,
    vialCount
  );
  vialBody.name = 'probenroehrchen';

  const vialCap = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.018, 10),
    matSteelBlue,
    vialCount
  );
  vialCap.name = 'probenkappen';

  const dummy = new THREE.Object3D();
  let vialIndex = 0;

  for (let shelf = 0; shelf < shelfY.length; shelf++) {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const x = -0.225 + col * 0.15;
        const z = -0.19 + row * 0.24;
        const y = shelfY[shelf] + 0.064;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        vialBody.setMatrixAt(vialIndex, dummy.matrix);

        dummy.position.set(x, y + 0.059, z);
        dummy.updateMatrix();
        vialCap.setMatrixAt(vialIndex, dummy.matrix);
        vialIndex++;
      }
    }
  }

  vialBody.instanceMatrix.needsUpdate = true;
  vialCap.instanceMatrix.needsUpdate = true;
  root.add(vialBody, vialCap);

  // Kleine cryo-Boxen auf dem mittleren Regal
  const cryoBoxes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.115, 0.055, 0.115),
    matPearl,
    6
  );
  cryoBoxes.name = 'cryoboxen';

  for (let i = 0; i < 6; i++) {
    dummy.position.set(-0.225 + (i % 3) * 0.15, 0.954, -0.19 + Math.floor(i / 3) * 0.24);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    cryoBoxes.setMatrixAt(i, dummy.matrix);
  }
  cryoBoxes.instanceMatrix.needsUpdate = true;
  root.add(cryoBoxes);

  // --- Tür mit linksseitigem Scharnier
  const doorPivot = new THREE.Group();
  doorPivot.name = 'tuer_scharnier';
  doorPivot.position.set(-0.39, 0, 0.455);
  root.add(doorPivot);

  box(doorPivot, 'tuerblatt', 0.78, 1.66, 0.060, 0.39, 1.10, 0, matDoor);
  box(doorPivot, 'tuer_innenfutter', 0.67, 1.53, 0.018, 0.39, 1.10, -0.039, matInnerBlue);
  box(doorPivot, 'tuer_aussenverkleidung', 0.70, 1.52, 0.012, 0.39, 1.10, 0.036, matHull);

  // Dichtung
  box(doorPivot, 'dichtung_links', 0.035, 1.51, 0.020, 0.045, 1.10, -0.051, matRubber);
  box(doorPivot, 'dichtung_rechts', 0.035, 1.51, 0.020, 0.735, 1.10, -0.051, matRubber);
  box(doorPivot, 'dichtung_oben', 0.72, 0.035, 0.020, 0.39, 1.85, -0.051, matRubber);
  box(doorPivot, 'dichtung_unten', 0.72, 0.035, 0.020, 0.39, 0.35, -0.051, matRubber);

  // Innenrippen und Rückwandkanal
  for (let i = 0; i < 3; i++) {
    box(
      doorPivot,
      `tuerrippe_${i + 1}`,
      0.53,
      0.022,
      0.022,
      0.39,
      0.57 + i * 0.43,
      -0.055,
      matRail
    );
  }

  box(doorPivot, 'tuer_lichtkante', 0.014, 0.82, 0.012, 0.115, 0.76, 0.048, matGlow);

  // --- Digitale Temperaturanzeige
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 512;
  displayCanvas.height = 320;
  const ctx = displayCanvas.getContext('2d');

  ctx.fillStyle = '#07131b';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#24718b';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 304);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8bdcff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('ULTRA LOW TEMP', 256, 54);

  ctx.fillStyle = '#ff4949';
  ctx.font = 'bold 112px monospace';
  ctx.fillText('-80°C', 256, 176);

  ctx.fillStyle = '#63dfff';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('CRYOSTORAGE', 256, 228);

  ctx.fillStyle = '#ffb23e';
  ctx.font = '24px monospace';
  ctx.fillText('STABLE  •  DOOR ALARM', 256, 282);

  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  displayTexture.anisotropy = 4;

  const displayMaterial = new THREE.MeshStandardMaterial({
    name: 'ult_freezer_display',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0xffffff,
    emissiveMap: displayTexture,
    emissiveIntensity: 1.15,
    metalness: 0.05,
    roughness: 0.25,
  });

  box(doorPivot, 'anzeige_blaufeld', 0.43, 0.285, 0.035, 0.39, 1.62, 0.051, matSteelBlue);
  box(doorPivot, 'anzeige_innenrahmen', 0.405, 0.26, 0.038, 0.39, 1.62, 0.062, matDark);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.215), displayMaterial);
  screen.name = 'temperaturanzeige';
  screen.position.set(0.39, 1.62, 0.084);
  doorPivot.add(screen);

  const alarmLamp = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), matAlarm);
  alarmLamp.name = 'alarmkontrollleuchte';
  alarmLamp.position.set(0.565, 1.73, 0.077);
  doorPivot.add(alarmLamp);

  // Warnschild als eigenständiges, geschlossenes Schild
  box(doorPivot, 'warnschild_halter', 0.24, 0.115, 0.018, 0.38, 1.31, 0.048, matPearl);
  box(doorPivot, 'warnschild', 0.20, 0.078, 0.012, 0.38, 1.31, 0.061, matWarning);

  // Typenschild
  box(doorPivot, 'typenschild', 0.17, 0.075, 0.010, 0.38, 1.16, 0.055, matSteelBlue);

  // Türgriff, rechts montiert
  box(doorPivot, 'griffhalter_oben', 0.050, 0.055, 0.060, 0.695, 1.04, 0.078, matRail);
  box(doorPivot, 'griffhalter_unten', 0.050, 0.055, 0.060, 0.695, 0.72, 0.078, matRail);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.36, 12),
    matRail
  );
  handle.name = 'tuergriff';
  handle.position.set(0.695, 0.88, 0.135);
  doorPivot.add(handle);

  // Scharniere am festen Korpus
  for (let i = 0; i < 2; i++) {
    cylinder(root, `tuerband_${i + 1}`, 0.024, 0.15, -0.402, 0.47 + i * 1.18, 0.452, matCopper);
    box(root, `tuerband_halter_${i + 1}`, 0.075, 0.045, 0.045, -0.365, 0.47 + i * 1.18, 0.432, matSteelBlue);
  }

  // --- Maschinenfach: festes Lüftungsgitter an der Basis
  box(root, 'ventilrahmen', 0.54, 0.125, 0.020, 0, 0.18, 0.458, matDark);

  const ventSlats = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.47, 0.011, 0.014),
    matPearl,
    6
  );
  ventSlats.name = 'ventilschlitze';

  for (let i = 0; i < 6; i++) {
    dummy.position.set(0, 0.137 + i * 0.018, 0.474);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    ventSlats.setMatrixAt(i, dummy.matrix);
  }
  ventSlats.instanceMatrix.needsUpdate = true;
  root.add(ventSlats);

  // Kompressor-Kontrolllampe
  const compressorLamp = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 6), matColdGlow);
  compressorLamp.name = 'kompressor_statusleuchte';
  compressorLamp.position.set(0.255, 0.18, 0.467);
  root.add(compressorLamp);

  // --- Kalter Nebel: weich texturierte Punkte, dringen aus dem Innenraum
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 64;
  mistCanvas.height = 64;
  const mistCtx = mistCanvas.getContext('2d');
  const gradient = mistCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(230,250,255,0.9)');
  gradient.addColorStop(0.45, 'rgba(200,238,255,0.38)');
  gradient.addColorStop(1, 'rgba(185,232,255,0)');
  mistCtx.fillStyle = gradient;
  mistCtx.fillRect(0, 0, 64, 64);

  const mistTexture = new THREE.CanvasTexture(mistCanvas);
  const mistCount = 32;
  const mistPositions = new Float32Array(mistCount * 3);
  const mistPhase = new Float32Array(mistCount);

  for (let i = 0; i < mistCount; i++) {
    const x = ((i * 37) % 101) / 101 - 0.5;
    mistPhase[i] = ((i * 53) % 97) / 97;
    mistPositions[i * 3] = x * 0.56;
    mistPositions[i * 3 + 1] = 0.35 + mistPhase[i] * 1.35;
    mistPositions[i * 3 + 2] = 0.45 + ((i * 71) % 89) / 89 * 0.20;
  }

  const mistGeometry = new THREE.BufferGeometry();
  mistGeometry.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));

  const mistMaterial = new THREE.PointsMaterial({
    name: 'ult_freezer_mist',
    color: 0xdaf7ff,
    map: mistTexture,
    size: 0.20,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    alphaTest: 0.01,
    sizeAttenuation: true,
  });

  const mist = new THREE.Points(mistGeometry, mistMaterial);
  mist.name = 'kaeltenebel';
  mist.frustumCulled = false;
  root.add(mist);

  // --- Statischer Kollisionskörper
  const collision = new THREE.Mesh(new THREE.BoxGeometry(0.80, 2.00, 0.90));
  collision.name = 'COL_gehaeuse';
  collision.position.set(0, 1.00, 0);
  root.add(collision);

  // --- Benutzen-Punkt
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_tuer';
  usePoint.position.set(0.22, 1.02, 0.82);
  usePoint.userData = { label: 'Probenkühlkammer bedienen', radius: 0.85 };
  root.add(usePoint);

  // --- Lichtquellen
  const displayLamp = new THREE.Object3D();
  displayLamp.name = 'LAMP_anzeige';
  displayLamp.position.set(0.39, 1.62, 0.15);
  displayLamp.userData = { color: '#6fe3ff', intensity: 4.5, distance: 1.8 };
  doorPivot.add(displayLamp);

  const innerLamp = new THREE.Object3D();
  innerLamp.name = 'LAMP_innen';
  innerLamp.position.set(0, 1.55, 0.20);
  innerLamp.userData = { color: '#9feaff', intensity: 3.2, distance: 1.5 };
  root.add(innerLamp);

  // --- Zustand und weiche Animation
  let zielOffen = false;
  let winkel = 0;
  let zeit = 0;
  let letzte = null;
  const offenerWinkel = -1.76;

  function update(dt) {
    dt = Math.min(Math.max(dt, 0), 0.1);
    zeit += dt;

    const zielWinkel = zielOffen ? offenerWinkel : 0;
    winkel += (zielWinkel - winkel) * Math.min(1, dt * 4.2);
    doorPivot.rotation.y = winkel;

    const oeffnungsgrad = Math.min(1, Math.abs(winkel) / Math.abs(offenerWinkel));

    displayMaterial.emissiveIntensity = 1.08 + Math.sin(zeit * 2.2) * 0.13;
    matColdGlow.emissiveIntensity = 1.22 + Math.sin(zeit * 1.7) * 0.10;
    matWarning.emissiveIntensity = 0.40 + Math.sin(zeit * 3.1) * 0.08;
    matAlarm.emissiveIntensity = 0.85 + Math.sin(zeit * 3.4) * 0.20;
    mistMaterial.opacity = oeffnungsgrad * 0.20;

    if (oeffnungsgrad > 0.02) {
      const position = mistGeometry.attributes.position;

      for (let i = 0; i < mistCount; i++) {
        let y = position.getY(i);
        let z = position.getZ(i);

        y -= dt * (0.035 + (i % 5) * 0.006);
        z += dt * (0.055 + (i % 4) * 0.008);

        if (y < 0.28) y = 1.72 - (i % 4) * 0.035;
        if (z > 1.10) z = 0.48 + (i % 5) * 0.025;

        position.setXYZ(
          i,
          Math.sin(zeit * 0.75 + i) * 0.055 + ((i * 37) % 101) / 101 * 0.28 - 0.14,
          y,
          z
        );
      }

      position.needsUpdate = true;
    }
  }

  const trigger = root.getObjectByName('korpus_links');
  trigger.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  // --- Öffentliche Funktionen
  const api = {
    tuerOeffnen() {
      zielOffen = true;
    },
    tuerSchliessen() {
      zielOffen = false;
    },
    tuerUmschalten() {
      zielOffen = !zielOffen;
    },
    get istOffen() {
      return Math.abs(winkel) > 0.12;
    },
    get zielOffen() {
      return zielOffen;
    },
    get tuerWinkel() {
      return winkel;
    },
    get temperatur() {
      return -80;
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'tuer_oeffnen',
      label: 'Kammertür öffnen',
      run: () => api.tuerOeffnen(),
    },
    {
      id: 'tuer_schliessen',
      label: 'Kammertür schließen',
      run: () => api.tuerSchliessen(),
    },
    {
      id: 'tuer_umschalten',
      label: 'Kammertür umschalten',
      run: () => api.tuerUmschalten(),
    },
  ];

  return root;
}

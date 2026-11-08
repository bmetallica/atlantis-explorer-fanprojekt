// Mark-II-Naquadah-Generator
// Tragbare irdische Notstromquelle der Tau'ri für Sektion Sieben.
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'naquadah_generator_mk2',
  art: 'Standobjekt / tragbares irdisches Gerät',
  masse: '0,87 × 0,48 × 0,32 (L × H × B, m)',
  wohin: 'Hauptstromraum, Sektion Sieben (ATL-043); zusätzlich als mobile Energiequelle für Tore, Schilde, Labore und Außenposten',
  benutzen: 'INT_bedienen → Menü aus userData.actions',
  lichter: 'LAMP_status (eisblau, dauerhaft aktiv), LAMP_hotzone (bernsteinfarben, dauerhaft aktiv)',
  animation: 'Blauer Statusring und Lauflicht pulsieren; Kapazitätsanzeige aktualisiert sich; Hot Zone erzeugt einen weichen bernsteinfarbenen Entladungsblitz',
  quelle: 'selbst gebaut nach den Referenzbildern der Tau\'ri-Naquadah-Generatoren',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'naquadah_generator_mk2';

  const matSilber = new THREE.MeshStandardMaterial({
    name: 'generator_silber',
    color: 0xaeb6bc,
    metalness: 0.78,
    roughness: 0.38,
  });
  const matChrom = new THREE.MeshStandardMaterial({
    name: 'generator_chrom',
    color: 0xd8dee1,
    metalness: 0.94,
    roughness: 0.22,
  });
  const matDunkel = new THREE.MeshStandardMaterial({
    name: 'generator_dunkel',
    color: 0x20262b,
    metalness: 0.72,
    roughness: 0.43,
  });
  const matGummi = new THREE.MeshStandardMaterial({
    name: 'generator_gummi',
    color: 0x0d1114,
    metalness: 0.08,
    roughness: 0.86,
  });
  const matBlau = new THREE.MeshStandardMaterial({
    name: 'generator_statusblau',
    color: 0x174f82,
    emissive: 0x42baff,
    emissiveIntensity: 0.12,
    metalness: 0.3,
    roughness: 0.28,
  });
  const matLed = new THREE.MeshStandardMaterial({
    name: 'generator_led',
    color: 0xffffff,
    emissive: 0x42baff,
    emissiveIntensity: 1.15,
    metalness: 0.15,
    roughness: 0.25,
  });
  const matBernstein = new THREE.MeshStandardMaterial({
    name: 'generator_bernstein',
    color: 0x5a2805,
    emissive: 0xff8a24,
    emissiveIntensity: 0.08,
    metalness: 0.28,
    roughness: 0.34,
  });

  const body = new THREE.Group();
  body.name = 'generator_gehaeuse';
  root.add(body);

  // Zentraler, horizontal liegender Kern.
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.112, 0.112, 0.34, 24),
    matDunkel
  );
  core.rotation.z = Math.PI / 2;
  core.position.set(0, 0.2, 0);
  body.add(core);

  for (const x of [-0.115, 0.115]) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.116, 0.034, 24),
      matChrom
    );
    band.rotation.z = Math.PI / 2;
    band.position.set(x, 0.2, 0);
    body.add(band);
  }

  // Kugelige Endkappen und kurze, geschlossene Leistungsanschlüsse.
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 18, 10),
      matSilber
    );
    cap.scale.set(0.95, 0.97, 0.94);
    cap.position.set(side * 0.265, 0.2, 0);
    body.add(cap);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.11, 18),
      matChrom
    );
    neck.rotation.z = Math.PI / 2;
    neck.position.set(side * 0.185, 0.2, 0);
    body.add(neck);

    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(0.132, 0.0045, 5, 16),
      matDunkel
    );
    seam.rotation.y = Math.PI / 2;
    seam.position.set(side * 0.198, 0.2, 0);
    body.add(seam);

    const connector = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.035, 14),
      matDunkel
    );
    connector.rotation.z = Math.PI / 2;
    connector.position.set(side * 0.417, 0.2, 0);
    body.add(connector);

    const connectorCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.014, 12),
      matGummi
    );
    connectorCap.rotation.z = Math.PI / 2;
    connectorCap.position.set(side * 0.439, 0.2, 0);
    body.add(connectorCap);
  }

  // Kühlrippen an beiden Halsstücken als InstancedMesh.
  const ribGeometry = new THREE.TorusGeometry(0.076, 0.0055, 5, 12);
  const ribs = new THREE.InstancedMesh(ribGeometry, matDunkel, 8);
  ribs.name = 'generator_kuehlrippen';
  const ribMatrix = new THREE.Matrix4();
  const ribQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, Math.PI / 2, 0)
  );
  const ribScale = new THREE.Vector3(1, 1, 1);
  let ribIndex = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      ribMatrix.compose(
        new THREE.Vector3(side * (0.15 + i * 0.018), 0.2, 0),
        ribQuaternion,
        ribScale
      );
      ribs.setMatrixAt(ribIndex++, ribMatrix);
    }
  }
  ribs.instanceMatrix.needsUpdate = true;
  body.add(ribs);

  // Unterer Tragrahmen, Kufen und zwei geschlossene Stützschalen.
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.045, 0.28),
    matDunkel
  );
  base.position.set(0, 0.0625, 0);
  body.add(base);

  for (const x of [-0.155, 0.155]) {
    const skid = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.04, 0.29),
      matGummi
    );
    skid.position.set(x, 0.02, 0);
    body.add(skid);

    const cradle = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.09, 0.19),
      matChrom
    );
    cradle.position.set(x, 0.115, 0);
    body.add(cradle);
  }

  const frontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.39, 0.022, 0.026),
    matChrom
  );
  frontRail.position.set(0, 0.103, 0.139);
  body.add(frontRail);

  // Oberer Steuerblock auf dem Kern.
  const podBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.136, 0.06, 24),
    matSilber
  );
  podBase.position.set(0, 0.302, 0);
  body.add(podBase);

  const podShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.112, 0.126, 0.072, 24),
    matChrom
  );
  podShoulder.position.set(0, 0.35, 0);
  body.add(podShoulder);

  const podDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 18, 10),
    matSilber
  );
  podDome.scale.set(1, 0.48, 1);
  podDome.position.set(0, 0.382, 0);
  body.add(podDome);

  // Blauer Statusring.
  const statusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.108, 0.007, 6, 32),
    matBlau
  );
  statusRing.rotation.x = Math.PI / 2;
  statusRing.position.set(0, 0.347, 0);
  body.add(statusRing);

  // Zwölf einzelne Statusleuchten als InstancedMesh.
  const ledGeometry = new THREE.CylinderGeometry(0.0075, 0.0075, 0.012, 8);
  const leds = new THREE.InstancedMesh(ledGeometry, matLed, 12);
  leds.name = 'generator_statusleuchten';
  const ledMatrix = new THREE.Matrix4();
  const ledQuaternion = new THREE.Quaternion();
  const ledScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ledMatrix.compose(
      new THREE.Vector3(Math.cos(a) * 0.108, 0.347, Math.sin(a) * 0.108),
      ledQuaternion,
      ledScale
    );
    leds.setMatrixAt(i, ledMatrix);
    leds.setColorAt(i, new THREE.Color(0x194d78));
  }
  leds.instanceMatrix.needsUpdate = true;
  if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
  body.add(leds);

  // Bedienpanel an der Vorderseite (+Z), leicht zur Decke geneigt.
  const panelGroup = new THREE.Group();
  panelGroup.name = 'generator_bedienpanel';
  panelGroup.position.set(0, 0.347, 0.136);
  panelGroup.rotation.x = -0.18;
  body.add(panelGroup);

  const panelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.155, 0.1, 0.028),
    matDunkel
  );
  panelGroup.add(panelFrame);

  const panelRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.141, 0.086, 0.008),
    matChrom
  );
  panelRim.position.z = 0.016;
  panelGroup.add(panelRim);

  // Anzeige mit dynamischer Canvas-Textur.
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256;
  screenCanvas.height = 128;
  const ctx = screenCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D ist für den Generator nicht verfügbar.');

  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'generator_display',
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    metalness: 0.05,
    roughness: 0.42,
  });

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.124, 0.061),
    screenMat
  );
  screen.position.set(-0.005, 0.002, 0.021);
  panelGroup.add(screen);

  const statusLens = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.016, 0.008),
    matBernstein
  );
  statusLens.position.set(0.059, -0.032, 0.021);
  panelGroup.add(statusLens);

  // Eckiger Transportbügel aus geschlossenen Zylindern und Kugelgelenken.
  for (const x of [-0.125, 0.125]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.085, 12),
      matDunkel
    );
    post.position.set(x, 0.437, 0);
    body.add(post);

    for (const y of [0.402, 0.474]) {
      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 10, 6),
        matChrom
      );
      joint.position.set(x, y, 0);
      body.add(joint);
    }
  }

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.25, 12),
    matDunkel
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.474, 0);
  body.add(handle);

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.145, 12),
    matGummi
  );
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, 0.474, 0);
  body.add(grip);

  // Kleine seitliche Lager, die zugleich als Tragegriffe erkennbar sind.
  for (const side of [-1, 1]) {
    const sideHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.009, 6, 18, Math.PI),
      matChrom
    );
    sideHandle.rotation.y = Math.PI / 2;
    sideHandle.rotation.z = Math.PI / 2;
    sideHandle.position.set(side * 0.145, 0.205, -0.135);
    body.add(sideHandle);
  }

  // Unsichtbarer Kollisionskörper für das gesamte Standgerät.
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.48, 0.32));
  col.name = 'COL_generator';
  col.position.set(0, 0.24, 0);
  root.add(col);

  // Benutzen-Punkte.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.54, 0.3);
  use.userData = {
    label: 'Naquadah-Generator bedienen',
    radius: 0.8,
  };
  root.add(use);

  const empUse = new THREE.Object3D();
  empUse.name = 'INT_hotzone';
  empUse.position.set(0.16, 0.4, 0.27);
  empUse.userData = {
    label: 'Generator-Hot-Zone auslösen',
    radius: 0.55,
  };
  root.add(empUse);

  // Lichtquellen bleiben dauerhaft aktiv; ihre Intensität wird animiert.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_status';
  lamp.position.set(0, 0.37, 0.19);
  lamp.userData = {
    color: '#42baff',
    intensity: 0.35,
    distance: 3.2,
  };
  root.add(lamp);

  const hotLamp = new THREE.Object3D();
  hotLamp.name = 'LAMP_hotzone';
  hotLamp.position.set(0, 0.42, 0.2);
  hotLamp.userData = {
    color: '#ff9b36',
    intensity: 0.12,
    distance: 3.6,
  };
  root.add(hotLamp);

  // Zustand.
  let an = false;
  let kapazitaet = 1;
  let hotZoneAktiv = false;
  let hotZoneTimer = 0;
  let zeit = 0;
  let letzte = null;
  let anzeigeTimer = 0;
  let statusStaerke = 0.12;
  let bernsteinStaerke = 0.08;
  const ledColor = new THREE.Color();

  function zeichneAnzeige() {
    const status = hotZoneAktiv
      ? 'HOT ZONE'
      : an
        ? 'ONLINE'
        : 'OFFLINE';
    const prozent = Math.round(kapazitaet * 100);

    ctx.fillStyle = '#04121e';
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = hotZoneAktiv ? '#ffae49' : '#67dcff';
    ctx.font = 'bold 21px monospace';
    ctx.fillText('NAQUADAH MK-II', 12, 25);

    ctx.fillStyle = hotZoneAktiv ? '#ff8b24' : '#b9efff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(status, 12, 52);

    ctx.fillStyle = '#7ba9bd';
    ctx.font = '12px monospace';
    ctx.fillText('CAPACITY', 12, 76);
    ctx.textAlign = 'right';
    ctx.fillText(prozent + '%', 244, 76);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#193347';
    ctx.fillRect(12, 86, 232, 14);
    ctx.fillStyle = hotZoneAktiv ? '#ff982e' : '#48bfff';
    ctx.fillRect(12, 86, 232 * Math.max(0, kapazitaet), 14);

    ctx.fillStyle = '#08131c';
    ctx.fillRect(12, 106, 232, 2);
    ctx.fillStyle = '#7ba9bd';
    ctx.font = '10px monospace';
    ctx.fillText('TOR / SHIELD / LAB / OUTPOST', 12, 120);

    screenTexture.needsUpdate = true;
  }

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;
    anzeigeTimer += step;

    if (an && !hotZoneAktiv) {
      kapazitaet = Math.max(0, kapazitaet - step * 0.004);
    }

    if (hotZoneAktiv) {
      hotZoneTimer += step;
      const rest = Math.max(0, 1 - hotZoneTimer / 1.35);
      const blitz = Math.pow(rest, 1.7);
      bernsteinStaerke = 0.08 + blitz * 4.2;
      statusStaerke = 0.2 + blitz * 2.8;

      if (hotZoneTimer >= 1.35) {
        hotZoneAktiv = false;
        hotZoneTimer = 0;
        kapazitaet = Math.max(0, kapazitaet - 0.22);
      }
    } else {
      bernsteinStaerke +=
        (0.08 - bernsteinStaerke) * Math.min(1, step * 6);
    }

    const zielStatus = an
      ? 1.35 + 0.38 * Math.sin(zeit * 3.2)
      : 0.12;
    statusStaerke +=
      (zielStatus - statusStaerke) * Math.min(1, step * 7);

    matBlau.emissiveIntensity = statusStaerke;
    matBernstein.emissiveIntensity = bernsteinStaerke;
    matLed.emissiveIntensity = an ? 1.05 : 0.18;
    screenMat.emissiveIntensity = hotZoneAktiv
      ? 1.15
      : an
        ? 0.72 + 0.12 * Math.sin(zeit * 2.4)
        : 0.22;

    lamp.userData.intensity = an
      ? 1.5 + 0.28 * Math.sin(zeit * 3.2)
      : 0.35;
    hotLamp.userData.intensity = hotZoneAktiv
      ? 1.2 + 4.1 * Math.max(0, 1 - hotZoneTimer / 1.35)
      : 0.12;

    // Lauflicht über die zwölf blauen Statusleuchten.
    for (let i = 0; i < 12; i++) {
      const phase = Math.sin(zeit * 4.2 - i * 0.72);
      let helligkeit = 0;
      if (an) helligkeit = 0.38 + Math.max(0, phase) * 0.62;
      if (hotZoneAktiv) helligkeit = 0.55 + 0.45 * Math.sin(zeit * 18 - i);

      ledColor.setRGB(
        0.08 + helligkeit * 0.16,
        0.25 + helligkeit * 0.52,
        0.42 + helligkeit * 0.58
      );
      leds.setColorAt(i, ledColor);
    }
    if (leds.instanceColor) leds.instanceColor.needsUpdate = true;

    if (anzeigeTimer >= 0.2) {
      anzeigeTimer = 0;
      zeichneAnzeige();
    }
  }

  zeichneAnzeige();

  // onBeforeRender liegt auf einem sichtbaren Mesh, damit die Animation
  // auch ohne separaten Spiel-Update-Tick zuverlässig läuft.
  screen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(Math.max(now - letzte, 0), 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    einschalten() {
      if (!hotZoneAktiv) an = true;
      return an;
    },
    ausschalten() {
      an = false;
      return an;
    },
    umschalten() {
      an = !an && !hotZoneAktiv;
      return an;
    },
    hotZone() {
      if (!an || hotZoneAktiv || kapazitaet < 0.05) return false;
      hotZoneAktiv = true;
      hotZoneTimer = 0;
      return true;
    },
    get an() {
      return an;
    },
    get kapazitaet() {
      return kapazitaet;
    },
    get kapazitaetProzent() {
      return Math.round(kapazitaet * 100);
    },
    get hotZoneAktiv() {
      return hotZoneAktiv;
    },
    get status() {
      if (hotZoneAktiv) return 'HOT ZONE';
      if (!an) return 'OFFLINE';
      if (kapazitaet <= 0.001) return 'EMPTY';
      return 'ONLINE';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'einschalten',
      label: 'Naquadah-Generator einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'ausschalten',
      label: 'Naquadah-Generator ausschalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'umschalten',
      label: 'Ein-/Ausschalten',
      run: () => api.umschalten(),
    },
    {
      id: 'hotzone',
      label: 'Hot Zone / EMP auslösen',
      run: () => api.hotZone(),
    },
  ];

  return root;
}

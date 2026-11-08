import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'cargo_transporter_pad',
  art: 'Standobjekt',
  masse: 'Transporterplattform Ø 4,00 m; Wandpaneel 1,60 × 2,20 × 0,20 m; Terminal 1,02 × 1,74 × 0,42 m',
  wohin: 'ATL-034 Ladungshalt',
  benutzen: 'INT_bedienen und INT_plattform → Terminal bedienen bzw. Transport aktivieren',
  lichter: 'LAMP_ring und LAMP_terminal (eisblau), LAMP_status (bernstein)',
  animation: 'Leuchtring pulsiert, zwölf Ringsegmente laufen im Kreis, Zentralring rotiert, Terminalanzeige flackert',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'cargo_transporter_pad';

  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matPillar = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');

  const dummy = new THREE.Object3D();

  // ---------------------------------------------------------
  // Schwerlast-Transporterplattform
  // Die Gesamtanordnung ist in X um den Ursprung ausgewogen.
  // Der Ursprung bleibt auf der Bodenebene.
  // ---------------------------------------------------------
  const transporter = new THREE.Group();
  transporter.position.set(-1.15, 0, 0);
  root.add(transporter);

  // Flacher, geschlossener Sockel: nahezu bündig mit dem Hallenboden.
  const sockel = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.07, 48),
    matDark
  );
  sockel.position.y = 0.035;
  transporter.add(sockel);

  // Dunkle äußere Fahrbahn.
  const fahrbahn = new THREE.Mesh(
    new THREE.CylinderGeometry(1.83, 1.83, 0.035, 48),
    matWall
  );
  fahrbahn.position.y = 0.0725;
  transporter.add(fahrbahn);

  // Perlgraue, leicht vertiefte Innenplatte.
  const innenplatte = new THREE.Mesh(
    new THREE.CylinderGeometry(1.71, 1.71, 0.035, 48),
    matPillar
  );
  innenplatte.position.y = 0.0875;
  transporter.add(innenplatte);

  // Hauptleuchtring.
  const ringMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_leuchtring',
    color: 0x082b3d,
    emissive: 0x38cfff,
    emissiveIntensity: 1.35,
    metalness: 0.3,
    roughness: 0.25
  });

  const leuchtring = new THREE.Mesh(
    new THREE.TorusGeometry(1.86, 0.045, 8, 64),
    ringMaterial
  );
  leuchtring.rotation.x = Math.PI / 2;
  leuchtring.position.y = 0.105;
  transporter.add(leuchtring);

  // Dezente innere Energiespur.
  const innenRingMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_innenspur',
    color: 0x0a3446,
    emissive: 0x5bd9ff,
    emissiveIntensity: 0.75,
    metalness: 0.2,
    roughness: 0.3
  });

  const innenring = new THREE.Mesh(
    new THREE.TorusGeometry(1.47, 0.018, 5, 64),
    innenRingMaterial
  );
  innenring.rotation.x = Math.PI / 2;
  innenring.position.y = 0.108;
  transporter.add(innenring);

  // Radiale Transportmarkierungen als InstancedMesh.
  const segmentGeometry = new THREE.BoxGeometry(0.22, 0.026, 0.54);
  const segmentMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_segmente',
    color: 0x345368,
    emissive: 0x167d9f,
    emissiveIntensity: 0.22,
    metalness: 0.72,
    roughness: 0.32
  });

  const segmente = new THREE.InstancedMesh(segmentGeometry, segmentMaterial, 12);
  segmente.name = 'transporter_radialsegmente';
  segmente.frustumCulled = false;
  transporter.add(segmente);

  // Sechseckiger Zentralring mit bronzener Abdeckung.
  const zentralring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.39, 0.035, 6),
    matDark
  );
  zentralring.position.y = 0.118;
  transporter.add(zentralring);

  const zentraldeckel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.025, 6),
    matCopper
  );
  zentraldeckel.position.y = 0.145;
  transporter.add(zentraldeckel);

  const zentralLeuchtMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_zentralleuchte',
    color: 0x16323d,
    emissive: 0xffb45c,
    emissiveIntensity: 1.0,
    metalness: 0.25,
    roughness: 0.35
  });

  const zentralleuchte = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.022, 6, 6),
    zentralLeuchtMaterial
  );
  zentralleuchte.rotation.x = Math.PI / 2;
  zentralleuchte.position.y = 0.146;
  transporter.add(zentralleuchte);

  // Vier bronzene Frachtklemmen.
  const klammerGeometry = new THREE.BoxGeometry(0.34, 0.065, 0.18);
  const klammern = new THREE.InstancedMesh(klammerGeometry, matRail, 4);
  klammern.name = 'transporter_klammern';
  for (let i = 0; i < 4; i++) {
    const winkel = i * Math.PI / 2 + Math.PI / 4;
    dummy.position.set(
      Math.sin(winkel) * 1.93,
      0.088,
      Math.cos(winkel) * 1.93
    );
    dummy.rotation.set(0, winkel, 0);
    dummy.updateMatrix();
    klammern.setMatrixAt(i, dummy.matrix);
  }
  klammern.instanceMatrix.needsUpdate = true;
  transporter.add(klammern);

  // Kleine Schrauben auf dem äußeren Rand.
  const schraubeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 8);
  const schrauben = new THREE.InstancedMesh(schraubeGeometry, matRail, 16);
  schrauben.name = 'transporter_schrauben';
  for (let i = 0; i < 16; i++) {
    const winkel = (i / 16) * Math.PI * 2;
    dummy.position.set(
      Math.sin(winkel) * 1.955,
      0.082,
      Math.cos(winkel) * 1.955
    );
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    schrauben.setMatrixAt(i, dummy.matrix);
  }
  schrauben.instanceMatrix.needsUpdate = true;
  transporter.add(schrauben);

  // ---------------------------------------------------------
  // Wandterminal auf kompaktem Wandpaneel
  // Vorderseite des Terminals zeigt nach +Z.
  // ---------------------------------------------------------
  const terminal = new THREE.Group();
  terminal.position.set(2.35, 0, -0.52);
  root.add(terminal);

  // Geschlossenes Wandpaneel als Träger des Terminals.
  const wandpaneel = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.2, 0.2),
    matDark
  );
  wandpaneel.position.set(2.35, 1.1, -0.78);
  root.add(wandpaneel);

  // Bronzene Randverstärkung des Wandpaneels.
  const paneelRandOben = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.07, 0.225),
    matRail
  );
  paneelRandOben.position.set(2.35, 2.12, -0.775);
  root.add(paneelRandOben);

  const paneelRandUnten = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.07, 0.225),
    matRail
  );
  paneelRandUnten.position.set(2.35, 0.08, -0.775);
  root.add(paneelRandUnten);

  // Sockel des Terminals.
  const terminalSockel = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.18, 0.42),
    matDark
  );
  terminalSockel.position.y = 0.09;
  terminal.add(terminalSockel);

  // Hauptgehäuse.
  const terminalGehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 1.6, 0.34),
    matWall
  );
  terminalGehaeuse.position.y = 0.98;
  terminal.add(terminalGehaeuse);

  // Perlgrauer, leicht vorstehender Kopf.
  const terminalKopf = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.16, 0.38),
    matPillar
  );
  terminalKopf.position.y = 1.84;
  terminal.add(terminalKopf);

  // Seitliche bronzene Führungsschienen.
  const schieneGeometry = new THREE.BoxGeometry(0.055, 1.3, 0.37);
  const schienen = new THREE.InstancedMesh(schieneGeometry, matRail, 2);
  schienen.name = 'terminal_führungsschienen';
  for (let i = 0; i < 2; i++) {
    dummy.position.set(i === 0 ? -0.45 : 0.45, 0.95, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    schienen.setMatrixAt(i, dummy.matrix);
  }
  schienen.instanceMatrix.needsUpdate = true;
  terminal.add(schienen);

  // Bronzener Bildschirmrahmen.
  const schirmRahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.56, 0.045),
    matCopper
  );
  schirmRahmen.position.set(0, 1.24, 0.19);
  terminal.add(schirmRahmen);

  // Statische, ancient-artige Terminalgrafik auf einer Canvas-Textur.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#03131d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#0d607c';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#73e5ff';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, 464, 336);

  ctx.strokeStyle = '#44c8eb';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 78 + i * 49;
    ctx.beginPath();
    ctx.moveTo(52, y);
    ctx.lineTo(82 + i * 13, y);
    ctx.lineTo(98 + i * 13, y - 16);
    ctx.lineTo(122 + i * 13, y + 12);
    ctx.lineTo(156 + i * 13, y - 8);
    ctx.lineTo(188 + i * 13, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffb35e';
  ctx.fillRect(258, 82, 190, 20);
  ctx.fillStyle = '#6fe3ff';
  ctx.fillRect(258, 122, 145, 14);
  ctx.fillRect(258, 150, 172, 14);
  ctx.fillRect(258, 178, 108, 14);

  ctx.strokeStyle = '#a5efff';
  ctx.lineWidth = 4;
  ctx.strokeRect(258, 238, 190, 70);
  ctx.beginPath();
  ctx.moveTo(274, 290);
  ctx.lineTo(316, 260);
  ctx.lineTo(354, 282);
  ctx.lineTo(394, 248);
  ctx.lineTo(432, 266);
  ctx.stroke();

  const bildschirmTextur = new THREE.CanvasTexture(canvas);
  bildschirmTextur.colorSpace = THREE.SRGBColorSpace;

  const schirmMaterial = new THREE.MeshStandardMaterial({
    name: 'terminal_bildschirm',
    color: 0xffffff,
    map: bildschirmTextur,
    emissive: 0x6fe3ff,
    emissiveMap: bildschirmTextur,
    emissiveIntensity: 0.78,
    metalness: 0.08,
    roughness: 0.32
  });

  const schirm = new THREE.Mesh(
    new THREE.PlaneGeometry(0.61, 0.47),
    schirmMaterial
  );
  schirm.position.set(0, 1.24, 0.216);
  terminal.add(schirm);

  // Tastenfeld als InstancedMesh.
  const tastenMaterial = new THREE.MeshStandardMaterial({
    name: 'terminal_tasten',
    color: 0x4a341b,
    emissive: 0xffa54b,
    emissiveIntensity: 0.35,
    metalness: 0.4,
    roughness: 0.4
  });

  const tasten = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.09, 0.065, 0.035),
    tastenMaterial,
    6
  );
  tasten.name = 'terminal_tasten';
  for (let i = 0; i < 6; i++) {
    const spalte = i % 3;
    const reihe = Math.floor(i / 3);
    dummy.position.set(
      -0.17 + spalte * 0.17,
      0.66 - reihe * 0.14,
      0.19
    );
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    tasten.setMatrixAt(i, dummy.matrix);
  }
  tasten.instanceMatrix.needsUpdate = true;
  terminal.add(tasten);

  // Untere Statusleiste.
  const statusMaterial = new THREE.MeshStandardMaterial({
    name: 'terminal_statusleiste',
    color: 0x3c2a14,
    emissive: 0xffa64d,
    emissiveIntensity: 0.6,
    metalness: 0.25,
    roughness: 0.4
  });

  const statusleiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.045, 0.025),
    statusMaterial
  );
  statusleiste.position.set(0, 0.39, 0.19);
  terminal.add(statusleiste);

  // Schmale bernsteinfarbene Statuslampe am Wandpaneel.
  const statusLampeMaterial = new THREE.MeshStandardMaterial({
    name: 'terminal_statuslampe',
    color: 0x3b260d,
    emissive: 0xffa54b,
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.4
  });

  const statusLampe = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 1.5, 0.025),
    statusLampeMaterial
  );
  statusLampe.position.set(3.01, 1.18, -0.665);
  root.add(statusLampe);

  // ---------------------------------------------------------
  // Kollisionskörper
  // Nur COL_-Meshes kollidieren. Die bodenbündige Plattform
  // bleibt als statische, begehbare Fläche ohne eigenes COL.
  // ---------------------------------------------------------
  const colTerminal = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.2, 0.68),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  colTerminal.name = 'COL_wandterminal';
  colTerminal.position.set(2.35, 1.1, -0.45);
  root.add(colTerminal);

  // ---------------------------------------------------------
  // Benutzen-Punkte und Lichter
  // ---------------------------------------------------------
  const intTerminal = new THREE.Object3D();
  intTerminal.name = 'INT_bedienen';
  intTerminal.position.set(2.35, 1.1, 0.02);
  intTerminal.userData = {
    label: 'Schwerlast-Transporter bedienen',
    radius: 0.8
  };
  root.add(intTerminal);

  const intPlattform = new THREE.Object3D();
  intPlattform.name = 'INT_plattform';
  intPlattform.position.set(-1.15, 0.58, 1.32);
  intPlattform.userData = {
    label: 'Transporterplattform aktivieren',
    radius: 0.8
  };
  root.add(intPlattform);

  const lampRing = new THREE.Object3D();
  lampRing.name = 'LAMP_ring';
  lampRing.position.set(-1.15, 0.38, 0);
  lampRing.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5
  };
  root.add(lampRing);

  const lampTerminal = new THREE.Object3D();
  lampTerminal.name = 'LAMP_terminal';
  lampTerminal.position.set(2.35, 1.3, 0.18);
  lampTerminal.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 3.5
  };
  root.add(lampTerminal);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(3.01, 1.18, -0.56);
  lampStatus.userData = {
    color: '#ffb15c',
    intensity: 2,
    distance: 2.2
  };
  root.add(lampStatus);

  // ---------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------
  let aktiv = false;
  let hub = 0;
  let zeit = 0;
  let letzte = null;
  let ringHelligkeit = ringMaterial.emissiveIntensity;

  function update(dt) {
    zeit += dt;

    const puls = 0.5 + 0.5 * Math.sin(zeit * 2.4);
    const zielRing = aktiv
      ? 2.2 + puls * 0.85
      : 0.85 + puls * 0.35;

    ringHelligkeit +=
      (zielRing - ringHelligkeit) * Math.min(1, dt * 6);
    ringMaterial.emissiveIntensity = ringHelligkeit;

    innenRingMaterial.emissiveIntensity = aktiv
      ? 1.25 + puls * 0.45
      : 0.55 + puls * 0.2;

    segmentMaterial.emissiveIntensity = aktiv
      ? 0.75 + 0.4 * Math.sin(zeit * 4)
      : 0.16 + puls * 0.08;

    zentralLeuchtMaterial.emissiveIntensity = aktiv
      ? 1.45 + puls * 0.5
      : 0.65 + puls * 0.2;

    tastenMaterial.emissiveIntensity = aktiv
      ? 0.9 + 0.55 * Math.max(0, Math.sin(zeit * 3.6))
      : 0.25;

    statusMaterial.emissiveIntensity = aktiv
      ? 1.55 + puls * 0.3
      : 0.5;

    statusLampeMaterial.emissiveIntensity = aktiv
      ? 1.25 + 0.25 * Math.sin(zeit * 2.1)
      : 0.55;

    // Sanftes, leichtes Flackern der Terminalanzeige.
    const flackern = 0.97 + Math.sin(zeit * 21.0) * 0.025;
    schirmMaterial.emissiveIntensity = (aktiv ? 1.05 : 0.62) * flackern;

    // Die Segmentmarkierungen laufen als Frachtindikator im Kreis.
    hub += dt * (aktiv ? 0.72 : 0.08);
    for (let i = 0; i < 12; i++) {
      const winkel = (i / 12) * Math.PI * 2 + hub;
      dummy.position.set(
        Math.sin(winkel) * 1.64,
        0.104,
        Math.cos(winkel) * 1.64
      );
      dummy.rotation.set(0, winkel, 0);
      dummy.updateMatrix();
      segmente.setMatrixAt(i, dummy.matrix);
    }
    segmente.instanceMatrix.needsUpdate = true;

    zentralring.rotation.y = hub * 0.42;
    zentraldeckel.rotation.y = hub * 0.42;
    zentralleuchte.rotation.z = hub * 0.42;
  }

  sockel.onBeforeRender = () => {
    const jetzt = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(Math.max(jetzt - letzte, 0), 0.1));
    }
    letzte = jetzt;
  };

  root.userData.update = update;

  // ---------------------------------------------------------
  // Öffentliche API
  // ---------------------------------------------------------
  const api = {
    aktivieren() {
      aktiv = true;
    },
    deaktivieren() {
      aktiv = false;
    },
    umschalten() {
      aktiv = !aktiv;
    },
    get aktiv() {
      return aktiv;
    }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'transport_start',
      label: 'Schwerlast-Transport starten',
      run: () => api.aktivieren()
    },
    {
      id: 'transport_stop',
      label: 'Schwerlast-Transport stoppen',
      run: () => api.deaktivieren()
    }
  ];

  return root;
}

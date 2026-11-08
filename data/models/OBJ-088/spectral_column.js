import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'spectral_column',
  art: 'Standobjekt',
  masse: '1,80 × Ø 0,40 (H × Ø, m)',
  wohin: 'Wissenschaftslabor (ATL-014), Labor 3 (ATL-023)',
  benutzen: 'INT_analyse → Menü aus userData.actions',
  lichter: 'LAMP_spektrum (eisblau), LAMP_anzeige (bernstein)',
  animation: 'Spektralstrahlen fächern bei aktiver Analyse weich auf und drehen sich langsam; Anzeige und Emitter pulsieren',
  quelle: 'selbst gebaut – Spielergänzung',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'spectral_column';

  const matPearl = kit('pillar');
  const matHull = kit('hull');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');

  const matGlass = new THREE.MeshStandardMaterial({
    name: 'KIT_glass',
    color: 0xa8d9e8,
    metalness: 0.08,
    roughness: 0.08,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const matEmitter = new THREE.MeshStandardMaterial({
    name: 'spektralemitter',
    color: 0xdffcff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.85,
    metalness: 0.12,
    roughness: 0.2,
  });

  const matScreen = new THREE.MeshStandardMaterial({
    name: 'spektralanzeige',
    color: 0xffffff,
    emissive: 0x2b94b5,
    emissiveIntensity: 0.42,
    metalness: 0.05,
    roughness: 0.38,
  });

  const matSpektralGlow = new THREE.MeshStandardMaterial({
    name: 'spektralglow',
    color: 0xffffff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.3,
    metalness: 0.05,
    roughness: 0.3,
  });

  const add = (geometry, material, x, y, z, name) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const ring = (radius, tube, y, material, name, segments = 24) => {
    const mesh = add(
      new THREE.TorusGeometry(radius, tube, 6, segments),
      material,
      0,
      y,
      0,
      name
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };

  // --- Fundament und Sockel -------------------------------------------------
  add(
    new THREE.CylinderGeometry(0.235, 0.25, 0.12, 24),
    matPearl,
    0,
    0.06,
    0,
    'sockel'
  );
  ring(0.218, 0.014, 0.125, matRail, 'sockelring');

  add(
    new THREE.CylinderGeometry(0.16, 0.19, 0.34, 20),
    matHull,
    0,
    0.29,
    0,
    'unterer_schaft'
  );
  add(
    new THREE.CylinderGeometry(0.115, 0.135, 0.12, 20),
    matDark,
    0,
    0.52,
    0,
    'engstelle'
  );
  ring(0.12, 0.011, 0.575, matRail, 'halsring');

  add(
    new THREE.CylinderGeometry(0.165, 0.155, 0.075, 20),
    matCopper,
    0,
    0.62,
    0,
    'kammerunterteile'
  );

  // --- Transparente, geschlossene Probenkammer ------------------------------
  const kammer = add(
    new THREE.CylinderGeometry(0.155, 0.155, 0.64, 24),
    matGlass,
    0,
    1.0,
    0,
    'probenkammer'
  );
  kammer.renderOrder = 2;

  ring(0.157, 0.012, 0.68, matRail, 'kammerring_unten');
  ring(0.157, 0.012, 1.32, matRail, 'kammerring_oben');

  // Innere dunkle Führung und leuchtender Probenkanal.
  add(
    new THREE.CylinderGeometry(0.017, 0.017, 0.47, 10),
    matDark,
    0,
    1.0,
    0,
    'probenkanal'
  );
  add(
    new THREE.CylinderGeometry(0.009, 0.009, 0.43, 8),
    matSpektralGlow,
    0,
    0.98,
    0,
    'spektralachse'
  );

  // Emitter, Probenhalter und optischer Keil.
  add(
    new THREE.CylinderGeometry(0.038, 0.048, 0.06, 16),
    matCopper,
    0,
    0.725,
    0,
    'emitter'
  );
  const emitterKern = add(
    new THREE.SphereGeometry(0.036, 12, 8),
    matEmitter,
    0,
    0.765,
    0,
    'emitterkern'
  );

  add(
    new THREE.CylinderGeometry(0.023, 0.023, 0.09, 10),
    matDark,
    0,
    0.81,
    0,
    'probenhalter'
  );
  const probe = add(
    new THREE.OctahedronGeometry(0.052, 0),
    new THREE.MeshStandardMaterial({
      name: 'spektralprobe',
      color: 0x5bbbd0,
      emissive: 0x184f68,
      emissiveIntensity: 0.5,
      metalness: 0.35,
      roughness: 0.2,
    }),
    0,
    0.89,
    0,
    'probe'
  );
  probe.rotation.y = Math.PI / 4;

  // --- Spektralfächer --------------------------------------------------------
  // Die Strahlen liegen vollständig in der Probenkammer und starten am Emitter.
  const spektralGruppe = new THREE.Group();
  spektralGruppe.name = 'spektralstrahlen';
  root.add(spektralGruppe);

  const spektralFarben = [
    0xff3838,
    0xff8b26,
    0xffd52e,
    0x6ce35b,
    0x32e2d4,
    0x42a4ff,
    0xa05cff,
  ];
  const strahlMaterialien = [];
  const strahlQuelle = new THREE.Vector3(0, 0.765, 0);
  const strahlRichtung = new THREE.Vector3();
  const strahlMitte = new THREE.Vector3();
  const strahlQuaternion = new THREE.Quaternion();
  const xAchse = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i < 9; i++) {
    const farbe = spektralFarben[i % spektralFarben.length];
    const material = new THREE.MeshStandardMaterial({
      name: `spektral_${i}`,
      color: farbe,
      emissive: farbe,
      emissiveIntensity: 0.2,
      metalness: 0.08,
      roughness: 0.25,
    });
    strahlMaterialien.push(material);

    const winkel = (i / 9) * Math.PI * 2 + 0.22;
    const ende = new THREE.Vector3(
      Math.cos(winkel) * 0.125,
      0.87 + (i % 3) * 0.125,
      Math.sin(winkel) * 0.125
    );
    strahlRichtung.subVectors(ende, strahlQuelle);
    const laenge = strahlRichtung.length();
    strahlMitte.copy(strahlQuelle).add(ende).multiplyScalar(0.5);
    strahlQuaternion.setFromUnitVectors(xAchse, strahlRichtung.normalize());

    const strahl = new THREE.Mesh(
      new THREE.BoxGeometry(laenge, 0.009, 0.009),
      material
    );
    strahl.position.copy(strahlMitte);
    strahl.quaternion.copy(strahlQuaternion);
    spektralGruppe.add(strahl);

    const endPunkt = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 8, 5),
      material
    );
    endPunkt.position.copy(ende);
    spektralGruppe.add(endPunkt);
  }

  ring(0.082, 0.004, 0.93, matGlow, 'spektralring', 20);

  // --- Oberer Geräteblock ----------------------------------------------------
  add(
    new THREE.CylinderGeometry(0.165, 0.15, 0.075, 20),
    matCopper,
    0,
    1.36,
    0,
    'kammeroberteil'
  );
  add(
    new THREE.CylinderGeometry(0.135, 0.145, 0.24, 20),
    matHull,
    0,
    1.52,
    0,
    'oberkoerper'
  );
  add(
    new THREE.CylinderGeometry(0.19, 0.16, 0.1, 20),
    matPearl,
    0,
    1.69,
    0,
    'kopf'
  );
  ring(0.176, 0.011, 1.745, matRail, 'kopfring');

  add(
    new THREE.CylinderGeometry(0.052, 0.064, 0.045, 16),
    matCopper,
    0,
    1.765,
    0,
    'kopfkern'
  );
  const kopfkugel = add(
    new THREE.SphereGeometry(0.035, 12, 8),
    matGlow,
    0,
    1.765,
    0,
    'kopfleuchte'
  );

  // --- Frontanzeige ----------------------------------------------------------
  const anzeigeGehaeuse = add(
    new THREE.BoxGeometry(0.27, 0.2, 0.035),
    matDark,
    0,
    1.51,
    0.142,
    'anzeigegehaeuse'
  );

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const zeichneAnzeige = (aktiv) => {
    ctx.fillStyle = '#06131e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#8cecff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('SPECTRAL ANALYSIS', 32, 65);

    ctx.fillStyle = aktiv ? '#ffb65c' : '#4ca6c0';
    ctx.font = '24px monospace';
    ctx.fillText(aktiv ? 'SCANNING: ACTIVE' : 'SAMPLE: READY', 32, 115);

    ctx.fillStyle = '#6fe3ff';
    ctx.font = '18px monospace';
    ctx.fillText('OPTICAL ARRAY  /  07', 32, 160);

    ctx.fillStyle = '#24566a';
    ctx.fillRect(32, 195, 420, 8);
    ctx.fillStyle = aktiv ? '#6fe3ff' : '#4ca6c0';
    ctx.fillRect(32, 195, aktiv ? 360 : 130, 8);
  };

  zeichneAnzeige(false);
  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  matScreen.map = textur;
  matScreen.emissiveMap = textur;

  add(
    new THREE.PlaneGeometry(0.225, 0.145),
    matScreen,
    0,
    1.51,
    0.162,
    'anzeige'
  );

  // --- Seitliche Kontrollflächen ---------------------------------------------
  for (const seite of [-1, 1]) {
    const platte = add(
      new THREE.BoxGeometry(0.035, 0.13, 0.11),
      matCopper,
      seite * 0.145,
      1.51,
      0.015,
      'kontrollplatte'
    );
    platte.rotation.y = seite * Math.PI * 0.5;

    const knopf = add(
      new THREE.SphereGeometry(0.018, 8, 6),
      matAmber,
      seite * 0.171,
      1.535,
      0.025,
      'kontrollknopf'
    );
    knopf.scale.set(0.7, 1, 1);
  }

  // --- Wiederholte Details als InstancedMesh --------------------------------
  const stiftGeometrie = new THREE.CylinderGeometry(0.012, 0.012, 0.014, 8);
  const stifte = new THREE.InstancedMesh(stiftGeometrie, matRail, 12);
  stifte.name = 'sockelstifte';
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const position = new THREE.Vector3();

  for (let i = 0; i < 12; i++) {
    const winkel = (i / 12) * Math.PI * 2;
    position.set(Math.cos(winkel) * 0.205, 0.135, Math.sin(winkel) * 0.205);
    matrix.compose(position, quaternion, scale);
    stifte.setMatrixAt(i, matrix);
  }
  stifte.instanceMatrix.needsUpdate = true;
  root.add(stifte);

  const slitGeometrie = new THREE.BoxGeometry(0.012, 0.15, 0.008);
  const slits = new THREE.InstancedMesh(slitGeometrie, matGlow, 8);
  slits.name = 'schaftleuchten';
  for (let i = 0; i < 8; i++) {
    const winkel = (i / 8) * Math.PI * 2;
    position.set(
      Math.sin(winkel) * 0.169,
      0.30,
      Math.cos(winkel) * 0.169
    );
    quaternion.setFromEuler(new THREE.Euler(0, winkel, 0));
    matrix.compose(position, quaternion, scale);
    slits.setMatrixAt(i, matrix);
  }
  slits.instanceMatrix.needsUpdate = true;
  root.add(slits);

  // --- Kollision -------------------------------------------------------------
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.8, 0.48));
  col.name = 'COL_spectral_column';
  col.position.set(0, 0.9, 0);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt --------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_analyse';
  use.position.set(0, 1.08, 0.46);
  use.userData = {
    label: 'Spektralanalyse durchführen',
    radius: 0.8,
  };
  root.add(use);

  // --- Lichter ---------------------------------------------------------------
  const lampSpektrum = new THREE.Object3D();
  lampSpektrum.name = 'LAMP_spektrum';
  lampSpektrum.position.set(0, 1.0, 0.03);
  lampSpektrum.userData = {
    color: '#6fe3ff',
    intensity: 6,
    distance: 3.5,
  };
  root.add(lampSpektrum);

  const lampAnzeige = new THREE.Object3D();
  lampAnzeige.name = 'LAMP_anzeige';
  lampAnzeige.position.set(0, 1.51, 0.2);
  lampAnzeige.userData = {
    color: '#ffb65c',
    intensity: 3,
    distance: 2.2,
  };
  root.add(lampAnzeige);

  // --- Zustand und Animation ------------------------------------------------
  let aktiv = false;
  let zeit = 0;
  let letzte = null;
  let strahlEnergie = 0.15;
  let anzeigeEnergie = 0.35;
  let angezeigterStatus = false;

  function update(dt) {
    const sicheresDt = Math.min(Math.max(dt, 0), 0.1);
    zeit += sicheresDt;

    const zielStrahl = aktiv ? 1.45 + Math.sin(zeit * 4.2) * 0.22 : 0.16;
    strahlEnergie +=
      (zielStrahl - strahlEnergie) * Math.min(1, sicheresDt * 5);

    for (let i = 0; i < strahlMaterialien.length; i++) {
      const phase = Math.sin(zeit * 5.2 - i * 0.42);
      strahlMaterialien[i].emissiveIntensity =
        strahlEnergie * (0.7 + 0.3 * Math.max(0, phase));
    }

    const zielAnzeige = aktiv ? 1.15 + Math.sin(zeit * 3.4) * 0.16 : 0.35;
    anzeigeEnergie +=
      (zielAnzeige - anzeigeEnergie) * Math.min(1, sicheresDt * 6);
    matScreen.emissiveIntensity = anzeigeEnergie;
    matSpektralGlow.emissiveIntensity = aktiv ? 1.45 : 0.42;
    matEmitter.emissiveIntensity =
      (aktiv ? 2.15 : 0.65) +
      Math.sin(zeit * 6.0) * (aktiv ? 0.35 : 0.08);

    kopfkugel.scale.setScalar(
      1 + Math.sin(zeit * 2.5) * (aktiv ? 0.08 : 0.025)
    );
    probe.rotation.y = Math.PI / 4 + zeit * (aktiv ? 0.55 : 0.08);

    if (aktiv) {
      spektralGruppe.rotation.y += sicheresDt * 0.32;
      spektralGruppe.rotation.z = Math.sin(zeit * 1.4) * 0.025;
    }
  }

  // Selbstständige Animation an einem sichtbaren Objekt.
  kammer.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // --- Öffentliche API und Aktionen -----------------------------------------
  const api = {
    analyse_starten() {
      aktiv = true;
      if (!angezeigterStatus) {
        zeichneAnzeige(true);
        textur.needsUpdate = true;
        angezeigterStatus = true;
      }
      return aktiv;
    },
    analyse_stoppen() {
      aktiv = false;
      if (angezeigterStatus) {
        zeichneAnzeige(false);
        textur.needsUpdate = true;
        angezeigterStatus = false;
      }
      return aktiv;
    },
    analyse_umschalten() {
      return aktiv ? !api.analyse_stoppen() : api.analyse_starten();
    },
    get aktiv() {
      return aktiv;
    },
    get status() {
      return aktiv ? 'Analyse läuft' : 'Bereitschaft';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'analyse_starten',
      label: 'Materialanalyse starten',
      run: () => api.analyse_starten(),
    },
    {
      id: 'analyse_stoppen',
      label: 'Materialanalyse beenden',
      run: () => api.analyse_stoppen(),
    },
  ];

  return root;
}

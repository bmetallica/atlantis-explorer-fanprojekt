// OBJ-005 — Zero-Point-Modul (ZPM)
// Kleinobjekt: ca. Ø 0,11 m × 0,29 m. Ursprung: Mitte der Unterseite.
import * as THREE from 'three';

export const steckbrief = {
  name: 'zpm',
  art: 'Kleinobjekt',
  masse: '0,11 × 0,29 × 0,11 (B × H × T, m)',
  wohin: 'ATL-038 ZPM-Raum; in die Dreifach-Aufnahme OBJ-037 einsetzen und absenken',
  benutzen: 'INT_zpm → Aktivzustand umschalten und Ladestand prüfen',
  lichter: 'LAMP_zpm_innen (gelb/bernsteinfarben), LAMP_zpm_kopplung (rot); Intensität folgt dem Modulzustand',
  animation: 'Aktives Modul: gelbes Innenleuchten pulsiert, roter Kopplungspunkt leuchtet; leeres Modul bleibt dunkel und trüb',
  quelle: 'selbst gebaut nach Referenzbildern',
};

function createSegmentGeometry() {
  // Fünfseitiges Kristallsegment. Höhe 1, damit die Instanzen
  // unabhängig in ihrer Länge skaliert werden können.
  const geometry = new THREE.CylinderGeometry(0.018, 0.022, 1, 5, 1, false);
  geometry.computeVertexNormals();
  return geometry;
}

function createIrregularRing(radius, variation, tubeRadius) {
  // Geschlossener, leicht unregelmäßiger dunkler Metallring.
  const points = [];
  const anzahl = 14;

  for (let i = 0; i < anzahl; i++) {
    const winkel = (i / anzahl) * Math.PI * 2;
    const r = radius + Math.sin(i * 2.37) * variation;
    points.push(
      new THREE.Vector3(
        Math.cos(winkel) * r,
        Math.sin(i * 1.81) * 0.0014,
        Math.sin(winkel) * r,
      ),
    );
  }

  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.35);
  return new THREE.TubeGeometry(curve, 56, tubeRadius, 5, true);
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'zpm';

  const dummy = new THREE.Object3D();

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const frameMat = new THREE.MeshStandardMaterial({
    name: 'zpm_dunkleFugen',
    color: 0x2a1a10,
    metalness: 0.35,
    roughness: 0.8,
  });

  const amberMat = new THREE.MeshStandardMaterial({
    name: 'zpm_bernsteinkristall',
    color: 0xd2691e,
    emissive: 0xd2691e,
    emissiveIntensity: 0.15,
    metalness: 0.02,
    roughness: 0.25,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    flatShading: true,
  });

  const redMat = new THREE.MeshStandardMaterial({
    name: 'zpm_roterSteuerkristall',
    color: 0xb22222,
    emissive: 0xb22222,
    emissiveIntensity: 0.15,
    metalness: 0.02,
    roughness: 0.25,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    flatShading: true,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    name: 'zpm_gelberUeberlastkristall',
    color: 0xffc040,
    emissive: 0xffc040,
    emissiveIntensity: 0.15,
    metalness: 0.02,
    roughness: 0.25,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    flatShading: true,
  });

  const coreMat = new THREE.MeshStandardMaterial({
    name: 'zpm_innenkern',
    color: 0x9a4a08,
    emissive: 0xffb000,
    emissiveIntensity: 2.4,
    metalness: 0,
    roughness: 0.28,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });

  const topDotMat = new THREE.MeshStandardMaterial({
    name: 'zpm_kopplungspunkt',
    color: 0x650806,
    emissive: 0xff1608,
    emissiveIntensity: 2.8,
    metalness: 0.06,
    roughness: 0.2,
  });

  const topDiskMat = new THREE.MeshStandardMaterial({
    name: 'zpm_abschluss',
    color: 0xb84f0b,
    emissive: 0xff7a08,
    emissiveIntensity: 0.12,
    metalness: 0.02,
    roughness: 0.28,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    flatShading: true,
  });

  // ------------------------------------------------------------
  // Dunkler Fußring
  // ------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.058, 0.018, 20),
    frameMat,
  );
  base.position.y = 0.009;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  const footRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0555, 0.0034, 6, 24),
    frameMat,
  );
  footRing.rotation.x = Math.PI / 2;
  footRing.position.y = 0.017;
  footRing.castShadow = true;
  root.add(footRing);

  // ------------------------------------------------------------
  // Schmaler innerer Leuchtkern. Er bleibt bewusst kleiner als
  // der Kristallbund, damit die Fugen und Facetten sichtbar bleiben.
  // ------------------------------------------------------------
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.020, 0.225, 14),
    coreMat,
  );
  core.position.y = 0.141;
  root.add(core);

  // ------------------------------------------------------------
  // Zwölf einzelne, kantige Kristallsegmente.
  // Jedes Segment ist ein geschlossener fünfseitiger Körper. Die
  // Querabmessungen werden leicht verkleinert, sodass zwischen den
  // Segmenten echte, dunkle Fugen sichtbar bleiben.
  // ------------------------------------------------------------
  const segmentGeometry = createSegmentGeometry();

  const amberSegments = new THREE.InstancedMesh(segmentGeometry, amberMat, 7);
  const redSegments = new THREE.InstancedMesh(segmentGeometry, redMat, 3);
  const yellowSegments = new THREE.InstancedMesh(segmentGeometry, yellowMat, 2);

  const segmentMeshes = [amberSegments, redSegments, yellowSegments];
  const segmentCounts = { amber: 0, red: 0, yellow: 0 };

  const segmentData = [
    { color: 'amber', height: 0.242, radial: -0.0018, tilt: 0.035, yaw: 0.00 },
    { color: 'amber', height: 0.258, radial: 0.0014, tilt: -0.042, yaw: 0.17 },
    { color: 'yellow', height: 0.231, radial: 0.0022, tilt: 0.028, yaw: -0.13 },
    { color: 'red', height: 0.250, radial: -0.0024, tilt: -0.034, yaw: 0.09 },
    { color: 'amber', height: 0.263, radial: 0.0007, tilt: 0.047, yaw: -0.21 },
    { color: 'amber', height: 0.225, radial: -0.0009, tilt: -0.025, yaw: 0.14 },
    { color: 'red', height: 0.247, radial: 0.0024, tilt: 0.038, yaw: -0.08 },
    { color: 'amber', height: 0.255, radial: -0.0020, tilt: -0.045, yaw: 0.20 },
    { color: 'yellow', height: 0.236, radial: 0.0010, tilt: 0.031, yaw: -0.16 },
    { color: 'amber', height: 0.261, radial: 0.0020, tilt: -0.030, yaw: 0.05 },
    { color: 'red', height: 0.229, radial: -0.0025, tilt: 0.043, yaw: -0.19 },
    { color: 'amber', height: 0.246, radial: 0.0016, tilt: -0.036, yaw: 0.11 },
  ];

  const segmentStep = (Math.PI * 2) / segmentData.length;
  const segmentRingRadius = 0.0375;

  for (let i = 0; i < segmentData.length; i++) {
    const data = segmentData[i];
    const angle = i * segmentStep;
    const radius = segmentRingRadius + data.radial;

    let mesh;
    if (data.color === 'red') mesh = redSegments;
    else if (data.color === 'yellow') mesh = yellowSegments;
    else mesh = amberSegments;

    const index = segmentCounts[data.color]++;

    dummy.position.set(
      Math.cos(angle) * radius,
      0.019 + data.height * 0.5,
      Math.sin(angle) * radius,
    );

    dummy.rotation.set(
      data.tilt,
      angle + data.yaw,
      Math.sin(i * 1.73) * 0.038,
    );

    // Unterschiedliche Querbreiten verstärken die unregelmäßige,
    // kristalline Kontur. Die Geometrie selbst behält ihre
    // fünfseitigen Radien von 0,018 / 0,022 m.
    const querBreite = 0.47 + (i % 3) * 0.018;
    dummy.scale.set(querBreite, data.height, querBreite * 0.92);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  for (const mesh of segmentMeshes) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  // ------------------------------------------------------------
  // Zwölf dunkle, senkrechte Fugen zwischen den Kristallsegmenten.
  // ------------------------------------------------------------
  const seamGeometry = new THREE.BoxGeometry(0.0032, 0.235, 0.0045);
  const seams = new THREE.InstancedMesh(seamGeometry, frameMat, 12);
  seams.castShadow = true;

  for (let i = 0; i < 12; i++) {
    const angle = (i + 0.5) * segmentStep;
    const radius = 0.0475 + (i % 2) * 0.0006;
    const seamHeight = 0.224 + (i % 4) * 0.005;

    dummy.position.set(
      Math.cos(angle) * radius,
      0.019 + seamHeight * 0.5,
      Math.sin(angle) * radius,
    );

    dummy.rotation.set(
      Math.sin(i * 2.03) * 0.012,
      Math.PI * 0.5 - angle,
      Math.cos(i * 1.61) * 0.015,
    );

    dummy.scale.set(1, seamHeight / 0.235, 1);
    dummy.updateMatrix();
    seams.setMatrixAt(i, dummy.matrix);
  }

  seams.instanceMatrix.needsUpdate = true;
  root.add(seams);

  // ------------------------------------------------------------
  // Drei dunkle, unregelmäßige Querstreben.
  // ------------------------------------------------------------
  const crossbars = [
    { y: 0.069, radius: 0.0480, variation: 0.0012, tube: 0.0018 },
    { y: 0.145, radius: 0.0492, variation: 0.0016, tube: 0.0016 },
    { y: 0.221, radius: 0.0476, variation: 0.0013, tube: 0.0017 },
  ];

  for (const bar of crossbars) {
    const crossbar = new THREE.Mesh(
      createIrregularRing(bar.radius, bar.variation, bar.tube),
      frameMat,
    );
    crossbar.position.y = bar.y;
    crossbar.castShadow = true;
    root.add(crossbar);
  }

  // ------------------------------------------------------------
  // Flacher, unregelmäßiger Abschluss aus kurzen Segmentenden.
  // ------------------------------------------------------------
  const topGeometry = new THREE.CylinderGeometry(
    0.018,
    0.022,
    1,
    5,
    1,
    false,
  );

  const topAmber = new THREE.InstancedMesh(topGeometry, amberMat, 5);
  const topYellow = new THREE.InstancedMesh(topGeometry, yellowMat, 3);
  const topRed = new THREE.InstancedMesh(topGeometry, redMat, 2);

  const topMeshes = [topAmber, topYellow, topRed];
  const topCounts = { amber: 0, red: 0, yellow: 0 };

  const topData = [
    { color: 'amber', angle: 0.00, height: 0.017 },
    { color: 'yellow', angle: 0.63, height: 0.020 },
    { color: 'amber', angle: 1.26, height: 0.016 },
    { color: 'red', angle: 1.89, height: 0.019 },
    { color: 'amber', angle: 2.52, height: 0.018 },
    { color: 'yellow', angle: 3.14, height: 0.016 },
    { color: 'amber', angle: 3.77, height: 0.020 },
    { color: 'red', angle: 4.40, height: 0.017 },
    { color: 'amber', angle: 5.03, height: 0.019 },
    { color: 'yellow', angle: 5.66, height: 0.016 },
  ];

  for (let i = 0; i < topData.length; i++) {
    const data = topData[i];
    const angle = data.angle;

    let mesh;
    if (data.color === 'red') mesh = topRed;
    else if (data.color === 'yellow') mesh = topYellow;
    else mesh = topAmber;

    const index = topCounts[data.color]++;

    dummy.position.set(
      Math.cos(angle) * 0.025,
      0.268 + data.height * 0.5,
      Math.sin(angle) * 0.025,
    );

    dummy.rotation.set(
      Math.sin(angle * 1.8) * 0.026,
      angle + 0.30,
      Math.cos(angle * 1.5) * 0.024,
    );

    dummy.scale.set(0.43, data.height, 0.41);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  for (const mesh of topMeshes) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    root.add(mesh);
  }

  // Kleine mittige Abschlussplatte unter dem Kopplungspunkt.
  const topDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.014, 6),
    topDiskMat,
  );
  topDisk.position.y = 0.278;
  topDisk.castShadow = true;
  root.add(topDisk);

  // ------------------------------------------------------------
  // Roter Kopplungspunkt auf der Oberseite
  // ------------------------------------------------------------
  const dotBezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.0105, 0.0018, 6, 16),
    frameMat,
  );
  dotBezel.rotation.x = Math.PI / 2;
  dotBezel.position.y = 0.286;
  root.add(dotBezel);

  const topDot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.005, 20),
    topDotMat,
  );
  topDot.position.y = 0.2885;
  root.add(topDot);

  // ------------------------------------------------------------
  // Unsichtbarer Kollisionskörper
  // ------------------------------------------------------------
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.30, 0.12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  collision.name = 'COL_zpm';
  collision.position.y = 0.15;
  root.add(collision);

  // ------------------------------------------------------------
  // Benutzen-Punkt vor dem Modul
  // ------------------------------------------------------------
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_zpm';
  usePoint.position.set(0, 0.18, 0.13);
  usePoint.userData = {
    label: 'Zero-Point-Modul bedienen',
    radius: 0.6,
  };
  root.add(usePoint);

  // ------------------------------------------------------------
  // Lichtmarker
  // ------------------------------------------------------------
  const innerLamp = new THREE.Object3D();
  innerLamp.name = 'LAMP_zpm_innen';
  innerLamp.position.set(0, 0.15, 0);
  innerLamp.userData = {
    color: '#ffb524',
    intensity: 3.2,
    distance: 1.25,
  };
  root.add(innerLamp);

  const couplingLamp = new THREE.Object3D();
  couplingLamp.name = 'LAMP_zpm_kopplung';
  couplingLamp.position.set(0, 0.289, 0);
  couplingLamp.userData = {
    color: '#ff1c10',
    intensity: 1.4,
    distance: 0.55,
  };
  root.add(couplingLamp);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let aktiv = opts.active !== false;
  let ladestand = THREE.MathUtils.clamp(
    opts.ladestand === undefined ? 1 : Number(opts.ladestand),
    0,
    1,
  );

  if (opts.leer === true) {
    ladestand = 0;
    aktiv = false;
  }

  let zeit = 0;
  let letzte = null;
  let glut = aktiv && ladestand > 0.001 ? 1 : 0;
  let punkt = glut;

  const amberAktiv = new THREE.Color(0xd2691e);
  const amberLeer = new THREE.Color(0x4b2918);
  const rotAktiv = new THREE.Color(0xb22222);
  const rotLeer = new THREE.Color(0x421616);
  const gelbAktiv = new THREE.Color(0xffc040);
  const gelbLeer = new THREE.Color(0x55461e);

  function update(dt) {
    zeit += dt;

    const d = Math.min(1, dt * 7);
    const leer = ladestand <= 0.001;
    const leuchtet = aktiv && !leer;
    const puls = 0.5 + 0.5 * Math.sin(zeit * 2.4);

    const glutZiel = leuchtet ? 1 : 0;
    const punktZiel = leuchtet ? 1 : 0;

    glut += (glutZiel - glut) * d;
    punkt += (punktZiel - punkt) * d;

    amberMat.color.lerp(leuchtet ? amberAktiv : amberLeer, d);
    redMat.color.lerp(leuchtet ? rotAktiv : rotLeer, d);
    yellowMat.color.lerp(leuchtet ? gelbAktiv : gelbLeer, d);

    amberMat.emissiveIntensity = 0.015 + glut * (
      0.15 + ladestand * 0.35 + puls * 0.08
    );
    redMat.emissiveIntensity = 0.015 + glut * (
      0.10 + ladestand * 0.30
    );
    yellowMat.emissiveIntensity = 0.015 + glut * (
      0.15 + ladestand * 0.38 + puls * 0.08
    );

    amberMat.opacity += ((leuchtet ? 0.85 : 0.62) - amberMat.opacity) * d;
    redMat.opacity += ((leuchtet ? 0.85 : 0.60) - redMat.opacity) * d;
    yellowMat.opacity += ((leuchtet ? 0.85 : 0.60) - yellowMat.opacity) * d;

    coreMat.opacity += ((leuchtet ? 0.78 : 0.40) - coreMat.opacity) * d;
    coreMat.emissiveIntensity = 0.012 + glut * (
      0.8 + ladestand * 2.3 + puls * 0.38
    );

    topDiskMat.emissiveIntensity = 0.01 + glut * (
      0.2 + ladestand * 0.55
    );

    topDotMat.emissiveIntensity = 0.02 + punkt * (
      1.25 + ladestand * 2.15 + puls * 0.42
    );

    innerLamp.userData.intensity = 0.08 + glut * (
      0.65 + ladestand * 2.45 + puls * 0.22
    );

    couplingLamp.userData.intensity = 0.02 + punkt * (
      0.45 + ladestand * 0.95 + puls * 0.12
    );
  }

  base.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }

    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API
  // ------------------------------------------------------------
  const api = {
    setAktiv(wert) {
      if (!wert || ladestand > 0.001) {
        aktiv = Boolean(wert);
      }
      return aktiv;
    },

    setLadestand(wert) {
      const vorherLeer = ladestand <= 0.001;
      ladestand = THREE.MathUtils.clamp(Number(wert) || 0, 0, 1);

      if (ladestand <= 0.001) {
        aktiv = false;
      } else if (vorherLeer) {
        aktiv = true;
      }

      return ladestand;
    },

    entladen() {
      ladestand = 0;
      aktiv = false;
      return api.status;
    },

    get aktiv() {
      return aktiv;
    },

    get ladestand() {
      return ladestand;
    },

    get leer() {
      return ladestand <= 0.001;
    },

    get status() {
      if (api.leer) return 'leer';
      return aktiv ? 'aktiv' : 'bereit';
    },

    get info() {
      return `Zero-Point-Modul: ${api.status}, Ladestand ${Math.round(ladestand * 100)} %`;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'zpm_aktivieren',
      label: 'ZPM aktivieren',
      run: () => api.setAktiv(true),
    },
    {
      id: 'zpm_deaktivieren',
      label: 'ZPM deaktivieren',
      run: () => api.setAktiv(false),
    },
    {
      id: 'zpm_ladestand',
      label: 'Ladestand prüfen',
      run: () => api.info,
    },
    {
      id: 'zpm_entladen',
      label: 'ZPM entladen und als leer melden',
      run: () => api.entladen(),
    },
  ];

  update(1);
  return root;
}

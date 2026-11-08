// OBJ-066: Defibrillator der Erde
// Tragbares Notfall-Defibrillator mit EKG-Display und zwei Handpaddeln.
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'defibrillator',
  art: 'Standobjekt / tragbares Medizingerät',
  masse: '0,31 × 0,25 × 0,15 m (B × H × T, Gehäuse; Kabel etwas überstehend)',
  wohin: 'ATL-009 Krankenstation, ATL-010 Operationsraum',
  benutzen: 'INT_bedienen → Gerät einschalten, EKG analysieren, aufladen und Schock auslösen',
  lichter: 'LAMP_display (grün), LAMP_status (bernsteinfarben)',
  animation: 'EKG-Lauf auf dem Display; Statusleuchte pulsiert; Analyse, Ladezustand und Schock werden angezeigt',
  quelle: 'selbst gebaut nach Auftragsbeschreibung und Referenzbild',
};

function material(color, roughness = 0.55, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function canvasTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, context, texture };
}

function box(root, mat, size, position, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  root.add(mesh);
  return mesh;
}

function setInstance(mesh, index, x, y, z) {
  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(x, y, z);
  mesh.setMatrixAt(index, matrix);
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'defibrillator';

  // ------------------------------------------------------------
  // Geschlossenes Gehäuse, Stoßecken und Tragebügel
  // ------------------------------------------------------------
  const caseYellow = material(0xb99a35, 0.6, 0.08);
  const caseDark = material(0x2a2d30, 0.76, 0.08);
  const rubber = material(0x101214, 0.92, 0.02);
  const steel = material(0x8e969c, 0.34, 0.78);
  const black = material(0x15181b, 0.82, 0.04);

  const housing = box(root, caseYellow, [0.3, 0.19, 0.135], [0, 0.107, 0], 'gehaeuse');

  // Unterseite bildet den Standpunkt bei y = 0.
  box(root, caseDark, [0.304, 0.025, 0.139], [0, 0.0125, 0], 'unterer_stossschutz');
  box(root, caseYellow, [0.302, 0.018, 0.138], [0, 0.211, 0], 'deckel');
  box(root, rubber, [0.306, 0.009, 0.142], [0, 0.222, 0], 'deckel_dichtung');

  for (const x of [-0.149, 0.149]) {
    box(root, rubber, [0.012, 0.148, 0.139], [x, 0.11, 0], 'seitenschutz');
  }

  for (const x of [-0.136, 0.136]) {
    for (const y of [0.037, 0.198]) {
      const corner = box(root, rubber, [0.028, 0.028, 0.146], [x, y, 0]);
      corner.castShadow = true;
    }
  }

  // Geschlossener, fester Tragebügel; kein schwebender Halbkreis.
  box(root, steel, [0.018, 0.031, 0.024], [-0.099, 0.231, -0.004], 'griffhalter_links');
  box(root, steel, [0.018, 0.031, 0.024], [0.099, 0.231, -0.004], 'griffhalter_rechts');
  box(root, rubber, [0.198, 0.017, 0.025], [0, 0.244, -0.004], 'tragegriff');

  // Scharniere an der Rückseite.
  for (const x of [-0.105, 0.105]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0085, 0.026, 12),
      steel
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 0.211, -0.067);
    hinge.castShadow = true;
    root.add(hinge);
  }

  // ------------------------------------------------------------
  // Bedienpanel
  // ------------------------------------------------------------
  const panel = box(root, caseDark, [0.278, 0.163, 0.012], [0, 0.113, 0.073], 'bedienpanel');
  box(root, rubber, [0.284, 0.007, 0.015], [0, 0.026, 0.073], 'panel_unterkante');

  // Frontseitige Verschlüsse.
  for (const x of [-0.126, 0.126]) {
    box(root, steel, [0.018, 0.025, 0.009], [x, 0.198, 0.076], 'verschluss');
  }

  // ------------------------------------------------------------
  // Display mit dynamischer EKG-Anzeige
  // ------------------------------------------------------------
  box(root, rubber, [0.157, 0.094, 0.014], [0, 0.147, 0.083], 'displayrahmen');

  const screenData = canvasTexture(512, 288);
  const screenMat = new THREE.MeshStandardMaterial({
    name: 'defibrillator_display',
    color: 0xffffff,
    map: screenData.texture,
    emissiveMap: screenData.texture,
    emissive: 0xffffff,
    emissiveIntensity: 0.68,
    roughness: 0.26,
    metalness: 0,
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.079), screenMat);
  screen.position.set(0, 0.147, 0.0905);
  screen.name = 'display';
  root.add(screen);

  // Serien- und Typenschild auf dem Deckelsteg.
  const labelData = canvasTexture(512, 72);
  const labelContext = labelData.context;
  labelContext.clearRect(0, 0, 512, 72);
  labelContext.fillStyle = '#17191a';
  labelContext.font = 'bold 29px sans-serif';
  labelContext.textAlign = 'center';
  labelContext.textBaseline = 'middle';
  labelContext.fillText('EMERGENCY AED', 256, 37);
  labelData.texture.needsUpdate = true;

  const labelMat = new THREE.MeshStandardMaterial({
    map: labelData.texture,
    transparent: true,
    alphaTest: 0.05,
    roughness: 0.62,
    metalness: 0.08,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.0155), labelMat);
  label.position.set(0, 0.207, 0.0692);
  root.add(label);

  // ------------------------------------------------------------
  // Vier getrennte Tasten mit eindeutiger Beschriftung
  // ------------------------------------------------------------
  const buttonGeometry = new THREE.CylinderGeometry(0.0105, 0.0115, 0.008, 20);
  buttonGeometry.rotateX(Math.PI / 2);

  const powerMat = new THREE.MeshStandardMaterial({
    color: 0x267a46,
    emissive: 0x43e574,
    emissiveIntensity: 0.16,
    roughness: 0.48,
  });
  const analysisMat = new THREE.MeshStandardMaterial({
    color: 0x235e7f,
    emissive: 0x46bff0,
    emissiveIntensity: 0.12,
    roughness: 0.48,
  });
  const chargeMat = new THREE.MeshStandardMaterial({
    color: 0x855a18,
    emissive: 0xffa62e,
    emissiveIntensity: 0.12,
    roughness: 0.48,
  });
  const shockMat = new THREE.MeshStandardMaterial({
    color: 0x821b1b,
    emissive: 0xff3030,
    emissiveIntensity: 0.12,
    roughness: 0.48,
  });

  const buttonData = [
    [-0.061, analysisMat],
    [-0.021, powerMat],
    [0.021, chargeMat],
    [0.061, shockMat],
  ];
  const buttons = [];

  for (const [x, mat] of buttonData) {
    const button = new THREE.Mesh(buttonGeometry, mat);
    button.position.set(x, 0.058, 0.0835);
    button.castShadow = true;
    root.add(button);
    buttons.push(button);
  }

  // Flache Tastenbeschriftung.
  const legendData = canvasTexture(512, 64);
  const legendContext = legendData.context;
  legendContext.clearRect(0, 0, 512, 64);
  legendContext.font = 'bold 22px monospace';
  legendContext.textAlign = 'center';
  legendContext.textBaseline = 'middle';
  legendContext.fillStyle = '#d4d8d6';
  legendContext.fillText('ANALYSE', 64, 33);
  legendContext.fillText('POWER', 192, 33);
  legendContext.fillText('LADEN', 320, 33);
  legendContext.fillText('SCHOCK', 445, 33);
  legendData.texture.needsUpdate = true;

  const legendMat = new THREE.MeshStandardMaterial({
    map: legendData.texture,
    transparent: true,
    alphaTest: 0.05,
    roughness: 0.66,
  });
  const legend = new THREE.Mesh(new THREE.PlaneGeometry(0.162, 0.0203), legendMat);
  legend.position.set(0, 0.033, 0.0805);
  root.add(legend);

  // Kleine bernsteinfarbene Statusleuchte.
  const statusMat = new THREE.MeshStandardMaterial({
    color: 0x8e6526,
    emissive: 0xffa62e,
    emissiveIntensity: 0.18,
    roughness: 0.38,
  });
  const statusLamp = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 12, 8), statusMat);
  statusLamp.position.set(-0.089, 0.058, 0.085);
  root.add(statusLamp);

  // Lüftungsschlitze als InstancedMesh.
  const ventGeometry = new THREE.BoxGeometry(0.022, 0.0035, 0.003);
  const ventMesh = new THREE.InstancedMesh(ventGeometry, black, 5);
  ventMesh.name = 'lueftung';
  for (let i = 0; i < 5; i++) {
    setInstance(ventMesh, i, 0.092, 0.096 + i * 0.009, 0.0805);
  }
  ventMesh.instanceMatrix.needsUpdate = true;
  root.add(ventMesh);

  // ------------------------------------------------------------
  // Zwei Handpaddles mit Halterungen, roten Griffen und Spiralkabeln
  // ------------------------------------------------------------
  const paddleMetal = material(0x969da2, 0.32, 0.8);
  const paddleBlack = material(0x111315, 0.86, 0.03);
  const gripRed = material(0xb51d20, 0.5, 0.04);
  const cableMaterial = material(0x090b0d, 0.88, 0.02);

  const paddleGroups = [];

  for (const side of [-1, 1]) {
    const x = side * 0.112;

    // Fest an der Vorderseite montierte Aufnahme.
    box(root, paddleBlack, [0.066, 0.077, 0.019], [x, 0.132, 0.0815], 'paddelhalter');

    const paddle = new THREE.Group();
    paddle.name = side < 0 ? 'paddle_links' : 'paddle_rechts';

    const paddleBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.031, 0.011, 28),
      paddleMetal
    );
    paddleBack.rotation.x = Math.PI / 2;
    paddleBack.position.set(x, 0.132, 0.096);
    paddleBack.castShadow = true;
    paddle.add(paddleBack);

    const electrode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0275, 0.0275, 0.007, 28),
      paddleBlack
    );
    electrode.rotation.x = Math.PI / 2;
    electrode.position.set(x, 0.132, 0.105);
    electrode.castShadow = true;
    paddle.add(electrode);

    const electrodeInset = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0155, 0.0155, 0.003, 24),
      material(0x3c4144, 0.6, 0.35)
    );
    electrodeInset.rotation.x = Math.PI / 2;
    electrodeInset.position.set(x, 0.132, 0.110);
    paddle.add(electrodeInset);

    const grip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.011, 0.042, 4, 12),
      gripRed
    );
    grip.position.set(x, 0.075, 0.104);
    grip.castShadow = true;
    paddle.add(grip);

    const gripCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0135, 0.0135, 0.011, 16),
      paddleMetal
    );
    gripCollar.position.set(x, 0.102, 0.104);
    paddle.add(gripCollar);

    const gripEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0135, 0.0115, 0.009, 16),
      paddleBlack
    );
    gripEnd.position.set(x, 0.044, 0.104);
    paddle.add(gripEnd);

    root.add(paddle);
    paddleGroups.push(paddle);

    // Steckdose am unteren Gehäuse.
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0085, 0.009, 16),
      paddleMetal
    );
    socket.rotation.x = Math.PI / 2;
    socket.position.set(side * 0.098, 0.019, 0.079);
    socket.castShadow = true;
    root.add(socket);

    // Spiralkabel: beginnt sichtbar am Griffende und endet in der Dose.
    const points = [];
    points.push(new THREE.Vector3(x, 0.039, 0.104));

    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const angle = t * Math.PI * 5;
      const radius = 0.0075 + 0.0025 * (1 - t);
      const centerX = side * (0.112 + 0.012 * t);
      const centerY = 0.036 - 0.018 * t;
      const centerZ = 0.111 - 0.024 * t;
      points.push(
        new THREE.Vector3(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          centerZ
        )
      );
    }

    points.push(new THREE.Vector3(side * 0.101, 0.020, 0.085));
    points.push(new THREE.Vector3(side * 0.098, 0.019, 0.0835));

    const curve = new THREE.CatmullRomCurve3(points);
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 72, 0.0032, 6, false),
      cableMaterial
    );
    cable.name = side < 0 ? 'kabel_links' : 'kabel_rechts';
    cable.castShadow = true;
    root.add(cable);
  }

  // ------------------------------------------------------------
  // Kollision, Benutzen-Punkt und Lichtquellen
  // ------------------------------------------------------------
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.225, 0.142));
  col.name = 'COL_gehaeuse';
  col.position.set(0, 0.1125, 0);
  col.userData.aktiv = true;
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.205, 0.34);
  use.userData = { label: 'Defibrillator bedienen', radius: 0.8 };
  root.add(use);

  const screenLight = new THREE.Object3D();
  screenLight.name = 'LAMP_display';
  screenLight.position.set(0, 0.147, 0.18);
  screenLight.userData = { color: '#58ff78', intensity: 2.2, distance: 1.1 };
  root.add(screenLight);

  const statusLight = new THREE.Object3D();
  statusLight.name = 'LAMP_status';
  statusLight.position.set(-0.089, 0.058, 0.14);
  statusLight.userData = { color: '#ffb347', intensity: 0.8, distance: 0.65 };
  root.add(statusLight);

  // ------------------------------------------------------------
  // Zustandsmaschine und Displayanimation
  // ------------------------------------------------------------
  let an = false;
  let analysing = false;
  let bereit = false;
  let analysingRemaining = 0;
  let shockFlash = 0;
  let zeit = 0;
  let letzte = null;
  let canvasAccumulator = 0;

  function gaussian(center, width, amplitude, p) {
    const d = p - center;
    return amplitude * Math.exp(-(d * d) / (2 * width * width));
  }

  function ecgValue(p) {
    return (
      0.07 * Math.sin(p * Math.PI * 2) +
      gaussian(0.17, 0.018, -0.12, p) +
      gaussian(0.21, 0.009, 0.98, p) +
      gaussian(0.245, 0.018, -0.28, p) +
      gaussian(0.53, 0.065, 0.17, p)
    );
  }

  function drawDisplay() {
    const ctx = screenData.context;
    const width = screenData.canvas.width;
    const height = screenData.canvas.height;

    ctx.fillStyle = '#031108';
    ctx.fillRect(0, 0, width, height);

    if (shockFlash > 0) {
      ctx.fillStyle = '#15251a';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#ff4a42';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, width - 12, height - 12);
    }

    // EKG-Raster.
    ctx.strokeStyle = 'rgba(54, 174, 78, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    let status = 'STANDBY';
    let statusColor = '#6e8d76';

    if (an) {
      status = bereit ? 'SCHOCKBEREIT' : 'EKG AKTIV';
      statusColor = bereit ? '#ffc04d' : '#66ff7d';
      if (analysing) {
        status = 'ANALYSE...';
        statusColor = '#68ddff';
      }
    }

    if (shockFlash > 0) {
      status = 'SCHOCK AUSGELÖST';
      statusColor = '#ff5a4e';
    }

    ctx.font = 'bold 27px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = statusColor;
    ctx.fillText(status, 17, 15);

    ctx.font = '20px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#82bd8c';
    ctx.fillText('AED-300', width - 17, 17);

    if (an && !analysing && shockFlash <= 0) {
      ctx.strokeStyle = bereit ? '#ffc04d' : '#66ff7d';
      ctx.lineWidth = 3.4;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 7;
      ctx.beginPath();

      const phase = (zeit * 0.58) % 1;
      for (let x = 0; x <= width; x += 3) {
        const p = ((x / width) * 4 + phase) % 1;
        const y = height * 0.60 - ecgValue(p) * height * 0.36;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '20px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = bereit ? '#ffc04d' : '#78d888';
      ctx.fillText(bereit ? 'ENERGIE BEREIT' : 'MONITOR', 17, height - 35);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#78d888';
      ctx.fillText('72', width - 43, height - 35);
      ctx.textAlign = 'left';
      ctx.fillText('BPM', width - 36, height - 35);
    } else if (!an) {
      ctx.strokeStyle = '#295a34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.60);
      ctx.lineTo(width, height * 0.60);
      ctx.stroke();

      ctx.font = '21px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#617c67';
      ctx.fillText('GERÄT AUS', 17, height - 36);
    }

    screenData.texture.needsUpdate = true;
  }

  function update(dt) {
    zeit += dt;

    if (analysing) {
      analysingRemaining -= dt;
      if (analysingRemaining <= 0) {
        analysing = false;
        bereit = true;
      }
    }

    if (shockFlash > 0) {
      shockFlash = Math.max(0, shockFlash - dt);
    }

    const targetEmission = an
      ? 0.92 + 0.1 * Math.sin(zeit * 4.2)
      : 0.1;
    screenMat.emissiveIntensity +=
      (targetEmission - screenMat.emissiveIntensity) * Math.min(1, dt * 5);

    powerMat.emissiveIntensity = an
      ? 0.8 + 0.3 * Math.sin(zeit * 3.4)
      : 0.12;
    analysisMat.emissiveIntensity = analysing ? 1.45 : 0.12;
    chargeMat.emissiveIntensity = bereit ? 1.35 : 0.12;
    shockMat.emissiveIntensity = bereit ? 1.7 : 0.12;

    statusMat.emissiveIntensity = bereit
      ? 1.6 + 0.35 * Math.sin(zeit * 6)
      : analysing
        ? 0.75
        : 0.18;

    canvasAccumulator += dt;
    if (canvasAccumulator >= 1 / 5   /* Display-Takt max. 5 Hz (Leistung) */) {
      canvasAccumulator = 0;
      drawDisplay();
    }
  }

  screen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  drawDisplay();

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    einschalten() {
      an = true;
      analysing = false;
      analysingRemaining = 0;
      bereit = false;
      shockFlash = 0;
      return true;
    },

    ausschalten() {
      an = false;
      analysing = false;
      analysingRemaining = 0;
      bereit = false;
      shockFlash = 0;
      return true;
    },

    analysieren() {
      if (!an) return false;
      analysing = true;
      bereit = false;
      analysingRemaining = 2.5;
      return true;
    },

    aufladen() {
      if (!an || analysing) return false;
      bereit = true;
      return true;
    },

    schock() {
      if (!an || !bereit) return false;
      bereit = false;
      shockFlash = 0.85;
      return true;
    },

    get an() {
      return an;
    },

    get analysing() {
      return analysing;
    },

    get bereit() {
      return bereit;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'einschalten',
      label: 'Defibrillator einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'ausschalten',
      label: 'Defibrillator ausschalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'analysieren',
      label: 'EKG analysieren',
      run: () => api.analysieren(),
    },
    {
      id: 'aufladen',
      label: 'Defibrillator aufladen',
      run: () => api.aufladen(),
    },
    {
      id: 'schock',
      label: 'Schock auslösen',
      run: () => api.schock(),
    },
  ];

  return root;
}

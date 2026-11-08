// c4_charge.js — C-4-Sprengstoffblock mit Funkzünder und Countdown-Anzeige
// Spielobjekt: keine realitätsbezogene Zündanleitung.
// 1 Einheit = 1 Meter; Ursprung = Mitte der Unterseite, Vorderseite zeigt nach +Z.

import * as THREE from 'three';

export const steckbrief = {
  name: 'c4_charge',
  art: 'Standobjekt',
  masse: 'ca. 0,57 kg',
  wohin: 'Waffenkammer / Armory',
  benutzen: 'INT_zuenden → Menü mit Countdown starten, entschärfen und Zündung auslösen',
  lichter: 'LAMP_countdown (rote LED, dauerhaft aktiv)',
  animation: 'Countdown-Anzeige blinkt; verbleibende Sekunden werden live aktualisiert',
  quelle: 'selbst gebaut, frei modelliert nach den Referenzbildern'
};

function makeCanvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  draw(ctx, width, height);
  texture.needsUpdate = true;

  return { canvas, ctx, texture };
}

function makeStandardMaterial(name, options = {}) {
  return new THREE.MeshStandardMaterial({
    name,
    roughness: 0.8,
    metalness: 0.02,
    ...options
  });
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'c4_charge';

  // --- Materialien ---
  const wrapperMat = makeStandardMaterial('c4_wrapper', {
    color: 0xb99b6c,
    roughness: 0.94
  });

  const wrapperEdgeMat = makeStandardMaterial('c4_wrapper_fold', {
    color: 0x92764f,
    roughness: 0.97
  });

  const plasticMat = makeStandardMaterial('c4_detonator_plastic', {
    color: 0x15171a,
    roughness: 0.56,
    metalness: 0.12
  });

  const darkPlasticMat = makeStandardMaterial('c4_detonator_detail', {
    color: 0x08090b,
    roughness: 0.46,
    metalness: 0.18
  });

  const wireRedMat = makeStandardMaterial('c4_wire_red', {
    color: 0x7d1714,
    roughness: 0.62
  });

  const wireBlackMat = makeStandardMaterial('c4_wire_black', {
    color: 0x111214,
    roughness: 0.68
  });

  const brassMat = makeStandardMaterial('c4_brass', {
    color: 0xb98a43,
    roughness: 0.3,
    metalness: 0.82
  });

  const ledMat = makeStandardMaterial('c4_led', {
    color: 0x5a0805,
    emissive: 0xff241c,
    emissiveIntensity: 1.2,
    roughness: 0.25
  });

  // --- Sprengstoffblock: 0,28 × 0,05 × 0,05 m ---
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.05, 0.05),
    wrapperMat
  );
  block.name = 'sprengstoffblock';
  block.position.set(0, 0.025, 0);
  root.add(block);

  // Dezente Verpackungsfalten an beiden Stirnseiten.
  for (const side of [-1, 1]) {
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.047, 0.051),
      wrapperEdgeMat
    );
    fold.position.set(side * 0.137, 0.025, 0);
    root.add(fold);
  }

  // --- Aufdruck auf der Oberseite ---
  const topLabel = makeCanvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b99b6c';
    ctx.fillRect(0, 0, w, h);

    // Leichte unregelmäßige Papier-/Druckfarbe.
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect((i * 137) % w, (i * 53) % h, 90, 2);
    }

    ctx.fillStyle = '#171717';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 112px Arial, sans-serif';
    ctx.fillText('C4', 34, 91);

    ctx.font = 'bold 31px Arial, sans-serif';
    ctx.fillText('BLOCK, DEMOLITION, M4', 265, 47);
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('COMPOSITION C4', 265, 91);
    ctx.fillText('LOT #83289-9431-3', 265, 135);
    ctx.fillText('MFG DATE 7/28/99', 265, 178);

    ctx.strokeStyle = 'rgba(48, 34, 20, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, 20);
    ctx.lineTo(250, 232);
    ctx.stroke();
  });

  const topPrintMat = makeStandardMaterial('c4_top_print', {
    map: topLabel.texture,
    roughness: 0.95
  });

  const topPrint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.276, 0.048),
    topPrintMat
  );
  topPrint.position.set(0, 0.05025, 0);
  topPrint.rotation.x = -Math.PI / 2;
  root.add(topPrint);

  // --- Frontaufdruck: großes C4 und schwarzer EXPLOSIVE-Streifen ---
  const frontLabel = makeCanvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b99b6c';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#181818';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 142px Arial, sans-serif';
    ctx.fillText('C4', w / 2, 94);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 178, w, 78);

    ctx.fillStyle = '#eeeeee';
    ctx.font = 'bold 47px Arial, sans-serif';
    ctx.fillText('EXPLOSIVE', w / 2, 218);
  });

  const frontPrintMat = makeStandardMaterial('c4_front_print', {
    map: frontLabel.texture,
    roughness: 0.95
  });

  const frontPrint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.276, 0.048),
    frontPrintMat
  );
  frontPrint.position.set(0, 0.025, 0.02525);
  root.add(frontPrint);

  // Rückseite erhält denselben schematischen Aufdruck.
  const rearPrint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.276, 0.048),
    frontPrintMat
  );
  rearPrint.position.set(0, 0.025, -0.02525);
  rearPrint.rotation.y = Math.PI;
  root.add(rearPrint);

  // --- Funkzünder auf dem Block ---
  const detonator = new THREE.Group();
  detonator.name = 'funkzuender';
  detonator.position.set(0.073, 0.05, 0);
  root.add(detonator);

  const detBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.035, 0.056),
    plasticMat
  );
  detBody.position.y = 0.0175;
  detonator.add(detBody);

  // Abgerundete optische Kanten durch schmale Gehäuseauflagen.
  const topLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.096, 0.004, 0.052),
    darkPlasticMat
  );
  topLip.position.y = 0.036;
  detonator.add(topLip);

  // Kleine Lüftungs-/Griffleisten auf dem Gehäusedeckel.
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.009, 0.0025, 0.035),
      darkPlasticMat
    );
    rib.position.set(-0.025 + i * 0.025, 0.039, 0);
    detonator.add(rib);
  }

  // Schmale Antenne.
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.019, 8),
    darkPlasticMat
  );
  antenna.position.set(0.039, 0.046, 0);
  detonator.add(antenna);

  // Messingfarbene Kontakte an der Rückseite.
  for (const x of [-0.026, 0, 0.026]) {
    const contact = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.007, 8),
      brassMat
    );
    contact.rotation.x = Math.PI / 2;
    contact.position.set(x, 0.013, -0.030);
    detonator.add(contact);
  }

  // --- Rotes Digitaldisplay an der Vorderseite des Zünders ---
  const display = makeCanvasTexture(512, 96, () => {});
  const displayMat = new THREE.MeshBasicMaterial({
    name: 'c4_countdown_display',
    map: display.texture,
    transparent: true,
    opacity: 0.92,
    toneMapped: false
  });

  const displayBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.025, 0.003),
    darkPlasticMat
  );
  displayBezel.position.set(0, 0.018, 0.029);
  detonator.add(displayBezel);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.079, 0.018),
    displayMat
  );
  screen.position.set(0, 0.018, 0.0308);
  detonator.add(screen);

  // Kleine separate Status-LED neben dem Display.
  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0028, 10, 8),
    ledMat
  );
  statusLed.position.set(0.044, 0.018, 0.0295);
  detonator.add(statusLed);

  // --- Zwei schlichte Kabel zwischen Zünder und Block ---
  function makeWire(points, material, radius = 0.0024) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(...p))
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, radius, 6, false),
      material
    );
    root.add(mesh);
    return mesh;
  }

  makeWire([
    [-0.100, 0.058, 0.018],
    [-0.045, 0.055, 0.023],
    [0.018, 0.055, 0.020]
  ], wireBlackMat);

  makeWire([
    [0.046, 0.053, -0.026],
    [0.038, 0.053, -0.041],
    [0.004, 0.051, -0.039]
  ], wireRedMat);

  // --- Kollisionskörper ---
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.05, 0.05)
  );
  col.name = 'COL_sprengstoffblock';
  col.position.set(0, 0.025, 0);
  root.add(col);

  // --- Benutzen-Punkt ---
  const use = new THREE.Object3D();
  use.name = 'INT_zuenden';
  use.position.set(0.07, 0.13, 0.09);
  use.userData = {
    label: 'C-4 Zünder bedienen',
    radius: 0.55
  };
  root.add(use);

  // --- Lichtpunkt für das rote Blinken ---
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_countdown';
  lamp.position.set(0.073, 0.09, 0.045);
  lamp.userData = {
    color: '#ff3028',
    intensity: 1.2,
    distance: 1.4
  };
  root.add(lamp);

  // --- Zustand und Anzeige ---
  let armed = false;
  let detonated = false;
  let countdownSeconds = 10;
  let blinkTime = 0;
  let flashTime = 0;
  let lastDisplayText = '';
  let lastSecond = -1;

  function formatDisplay(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(hours)} ${pad(minutes)} ${pad(secs)}`;
  }

  function drawDisplay(text) {
    if (text === lastDisplayText) return;
    lastDisplayText = text;

    const ctx = display.ctx;
    const w = display.canvas.width;
    const h = display.canvas.height;

    ctx.fillStyle = '#100303';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 20, 10, 0.12)';
    ctx.fillRect(12, 8, w - 24, h - 16);

    ctx.fillStyle = '#ff2118';
    ctx.font = 'bold 61px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.fillText(text, w / 2, h / 2 + 2);
    ctx.shadowBlur = 0;

    display.texture.needsUpdate = true;
  }

  function setArmed(value) {
    if (detonated && value) return;
    armed = value;

    if (!armed) {
      countdownSeconds = 0;
      drawDisplay('00 00 00');
    } else {
      countdownSeconds = Number.isFinite(opts.countdown)
        ? Math.max(1, opts.countdown)
        : 10;
      lastSecond = -1;
      drawDisplay(formatDisplay(countdownSeconds));
    }
  }

  function arm() {
    if (detonated) return;
    setArmed(true);
  }

  function disarm() {
    if (detonated) return;
    setArmed(false);
  }

  function detonate() {
    if (detonated) return;
    armed = false;
    detonated = true;
    countdownSeconds = 0;
    flashTime = 0.8;
    drawDisplay('00 00 00');
  }

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    blinkTime += step;

    if (armed) {
      countdownSeconds = Math.max(0, countdownSeconds - step);
      const wholeSecond = Math.ceil(countdownSeconds);

      if (wholeSecond !== lastSecond) {
        lastSecond = wholeSecond;
        drawDisplay(formatDisplay(wholeSecond));
      }

      if (countdownSeconds <= 0) {
        detonate();
      }
    }

    const blinkOn = Math.sin(blinkTime * 11) > -0.15;

    displayMat.opacity = armed
      ? (blinkOn ? 1 : 0.28)
      : (detonated ? 0.55 : 0.9);

    ledMat.emissiveIntensity = armed
      ? (blinkOn ? 4.5 : 0.25)
      : (detonated ? 0.6 : 1.2);

    lamp.userData.intensity = armed
      ? (blinkOn ? 5 : 0.8)
      : 0.45;

    if (flashTime > 0) {
      flashTime = Math.max(0, flashTime - step);
      const flash = flashTime / 0.8;
      ledMat.emissiveIntensity = 2 + flash * 7;
      lamp.userData.intensity = 1 + flash * 8;
    }
  }

  drawDisplay('00 00 00');

  // Sichtbares Mesh als Animations-Treiber.
  block.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (root.userData._lastFrame === undefined) {
      root.userData._lastFrame = now;
      return;
    }

    const dt = Math.min(now - root.userData._lastFrame, 0.1);
    root.userData._lastFrame = now;
    update(dt);
  };

  root.userData.update = update;

  const api = {
    arm,
    disarm,
    detonate,

    setCountdown(seconds) {
      if (!Number.isFinite(seconds)) return;
      countdownSeconds = Math.max(1, Math.floor(seconds));

      if (armed) {
        lastSecond = -1;
        drawDisplay(formatDisplay(countdownSeconds));
      }
    },

    get armed() {
      return armed;
    },

    get detonated() {
      return detonated;
    },

    get countdownSeconds() {
      return Math.ceil(countdownSeconds);
    }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'countdown_start',
      label: 'Countdown starten — scharf schalten',
      run: () => api.arm()
    },
    {
      id: 'countdown_cancel',
      label: 'Countdown abbrechen — entschärfen',
      run: () => api.disarm()
    },
    {
      id: 'detonate',
      label: 'Zündung auslösen',
      run: () => api.detonate()
    }
  ];

  return root;
}

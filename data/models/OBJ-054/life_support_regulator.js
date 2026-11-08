// Lebenserhaltungs-Atmosphärenregler – Ancient / Atlantis
// Wandobjekt, ca. 1,00 × 2,00 × 0,35 m
// Ursprung: Mitte der Unterkante der Rückseite, Vorderseite nach +Z
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'life_support_regulator',
  art: 'Wandobjekt',
  masse: '1.00 × 2.00 × 0.35 (B × H × T, m)',
  wohin: 'Wandfläche, Rückseite bündig an der Wand',
  benutzen: 'INT_bedienen → Menü mit Reglerfunktionen',
  lichter: 'LAMP_status (türkise Statusanzeige)',
  animation: 'Statusanzeige pulsiert; Lauflicht wandert über die Lüftungsschlitze; Messnadeln folgen weich dem Sollwert',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'life_support_regulator';

  const matDark = kit('wallDark');
  const matPearl = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');

  // ------------------------------------------------------------------
  // Grundkörper
  // ------------------------------------------------------------------
  const housing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.22), matDark);
  housing.position.set(0, 1.0, 0.11);
  housing.name = 'Gehäuse';
  root.add(housing);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.88, 0.035), matPearl);
  face.position.set(0, 1.0, 0.2375);
  root.add(face);

  // Bronze-Rahmenleisten
  const sideRailGeo = new THREE.BoxGeometry(0.05, 1.88, 0.03);
  for (const x of [-0.42, 0.42]) {
    const rail = new THREE.Mesh(sideRailGeo, matRail);
    rail.position.set(x, 1.0, 0.27);
    root.add(rail);
  }
  const hRailGeo = new THREE.BoxGeometry(0.84, 0.045, 0.03);
  for (const y of [1.955, 0.045]) {
    const rail = new THREE.Mesh(hRailGeo, matRail);
    rail.position.set(0, y, 0.27);
    root.add(rail);
  }
  // Trennstege zwischen den Funktionszonen
  for (const y of [1.11, 0.71]) {
    const sep = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.035, 0.025), matRail);
    sep.position.set(0, y, 0.262);
    root.add(sep);
  }

  // ------------------------------------------------------------------
  // Schmale vertikale Statusanzeige (Türkis)
  // ------------------------------------------------------------------
  const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.78, 0.03), matDark);
  screenFrame.position.set(0.285, 1.52, 0.27);
  root.add(screenFrame);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const displayTexture = new THREE.CanvasTexture(canvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  displayTexture.anisotropy = 4;

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'status_screen',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0x0a2630,
    emissiveIntensity: 0.85,
    emissiveMap: displayTexture,
    roughness: 0.25,
    metalness: 0.05,
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.72), screenMaterial);
  screen.position.set(0.285, 1.52, 0.288);
  root.add(screen);

  // ------------------------------------------------------------------
  // Lüftungsgitter (oben links, unten links)
  // ------------------------------------------------------------------
  const louverBase = new THREE.MeshStandardMaterial({
    name: 'louver',
    color: 0x9fb8c6,
    metalness: 0.62,
    roughness: 0.34,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.0,
  });

  const upperSlats = [];
  const upperBacking = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.02), matDark);
  upperBacking.position.set(-0.17, 1.5, 0.262);
  root.add(upperBacking);
  for (let i = 0; i < 6; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.032, 0.05), louverBase.clone());
    slat.position.set(-0.17, 1.28 + i * 0.088, 0.29);
    root.add(slat);
    upperSlats.push(slat);
  }

  const lowerSlats = [];
  const lowerBacking = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.02), matDark);
  lowerBacking.position.set(-0.13, 0.3, 0.262);
  root.add(lowerBacking);
  for (let i = 0; i < 4; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.05), louverBase.clone());
    slat.position.set(-0.13, 0.18 + i * 0.08, 0.29);
    root.add(slat);
    lowerSlats.push(slat);
  }

  // Lauflichter über den Gittern
  const sweepUpper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.014, 0.008), matGlow);
  sweepUpper.position.set(-0.17, 1.28, 0.318);
  root.add(sweepUpper);
  const sweepLower = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.012, 0.008), matGlow);
  sweepLower.position.set(-0.13, 0.18, 0.318);
  root.add(sweepLower);

  // ------------------------------------------------------------------
  // Analoge Messuhren: Sauerstoff, Temperatur, Druck
  // ------------------------------------------------------------------
  function gaugeTexture(label) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#081820';
    g.beginPath();
    g.arc(128, 128, 126, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#c08a3e';
    g.lineWidth = 8;
    g.stroke();
    g.strokeStyle = '#7fd8e6';
    g.lineWidth = 3;
    for (let i = 0; i <= 10; i++) {
      const a = (150 - (i * 120) / 10) * Math.PI / 180;
      const r1 = i % 5 === 0 ? 88 : 100;
      const x1 = 128 + Math.cos(a) * r1;
      const y1 = 128 - Math.sin(a) * r1;
      const x2 = 128 + Math.cos(a) * 112;
      const y2 = 128 - Math.sin(a) * 112;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    g.fillStyle = '#9fe9f5';
    g.font = 'bold 30px monospace';
    g.textAlign = 'center';
    g.fillText(label, 128, 214);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function addGauge(x, label, min, max) {
    const bez = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 24), matRail);
    bez.rotation.x = Math.PI / 2;
    bez.position.set(x, 0.92, 0.278);
    root.add(bez);

    const dial = new THREE.Mesh(
      new THREE.CircleGeometry(0.082, 32),
      new THREE.MeshStandardMaterial({
        name: 'gauge_dial_' + label,
        map: gaugeTexture(label),
        emissive: 0x1b4650,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.1,
      })
    );
    dial.position.set(x, 0.92, 0.306);
    root.add(dial);

    const pivot = new THREE.Group();
    pivot.position.set(x, 0.92, 0.312);
    root.add(pivot);

    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.066, 0.011, 0.006),
      new THREE.MeshStandardMaterial({
        name: 'gauge_needle_' + label,
        color: 0xffb45a,
        emissive: 0xff9a3c,
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.3,
      })
    );
    needle.position.x = 0.028;
    pivot.add(needle);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12), matCopper);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.92, 0.316);
    root.add(hub);

    return {
      pivot,
      min,
      max,
      target: Math.PI * (150 / 180),
      current: Math.PI * (150 / 180),
      set(value) {
        const t = THREE.MathUtils.clamp((value - this.min) / (this.max - this.min), 0, 1);
        this.target = Math.PI * ((150 - t * 120) / 180);
      },
    };
  }

  const gaugeO2 = addGauge(-0.28, 'O2', 70, 100);
  const gaugeTemp = addGauge(0.0, 'TEMP', 15, 30);
  const gaugePress = addGauge(0.28, 'kPa', 90, 115);

  // ------------------------------------------------------------------
  // Betriebs- und Warnanzeige
  // ------------------------------------------------------------------
  const powerMaterial = new THREE.MeshStandardMaterial({
    name: 'power_indicator',
    color: 0x0a1b22,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.2,
  });
  const warningMaterial = new THREE.MeshStandardMaterial({
    name: 'warning_indicator',
    color: 0x24180a,
    emissive: 0xffa23d,
    emissiveIntensity: 0.05,
    roughness: 0.35,
    metalness: 0.2,
  });

  const lampGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.022, 16);
  const powerLamp = new THREE.Mesh(lampGeo, powerMaterial);
  powerLamp.rotation.x = Math.PI / 2;
  powerLamp.position.set(-0.33, 0.765, 0.28);
  root.add(powerLamp);

  const warningLamp = new THREE.Mesh(lampGeo, warningMaterial);
  warningLamp.rotation.x = Math.PI / 2;
  warningLamp.position.set(0.33, 0.765, 0.28);
  root.add(warningLamp);

  const powerRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 8, 20), matRail);
  powerRing.position.set(-0.33, 0.765, 0.283);
  root.add(powerRing);
  const warningRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 8, 20), matRail);
  warningRing.position.set(0.33, 0.765, 0.283);
  root.add(warningRing);

  // ------------------------------------------------------------------
  // Rohranschlüsse, Sammelleitung und Ventile
  // ------------------------------------------------------------------
  const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 14);
  const collarGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.06, 14);
  const valveKnobs = [];
  for (const x of [-0.34, 0.34]) {
    const pipe = new THREE.Mesh(pipeGeo, matCopper);
    pipe.position.set(x, 0.37, 0.275);
    root.add(pipe);

    for (const y of [0.1, 0.64]) {
      const collar = new THREE.Mesh(collarGeo, matRail);
      collar.position.set(x, y, 0.275);
      root.add(collar);
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.035, 14), matCopper);
    cap.position.set(x, 0.062, 0.275);
    root.add(cap);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.055, 10), matRail);
    stem.rotation.x = Math.PI / 2;
    stem.position.set(x, 0.38, 0.3);
    root.add(stem);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.028, 18), matRail);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, 0.38, 0.331);
    root.add(knob);
    valveKnobs.push(knob);
  }

  const manifold = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.06), matCopper);
  manifold.position.set(0, 0.68, 0.275);
  root.add(manifold);

  const lowerManifold = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.055), matCopper);
  lowerManifold.position.set(0, 0.115, 0.275);
  root.add(lowerManifold);

  // ------------------------------------------------------------------
  // Kollisionskörper, Benutzen-Punkt und Licht
  // ------------------------------------------------------------------
  const col = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.35), new THREE.MeshBasicMaterial());
  col.name = 'COL_gehaeuse';
  col.position.set(0, 1.0, 0.175);
  col.userData = { aktiv: true };
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.15, 0.65);
  use.userData = { label: 'Atmosphärenregler bedienen', radius: 0.8 };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_status';
  lamp.position.set(0.285, 1.52, 0.46);
  lamp.userData = { color: '#6fe3ff', intensity: 5, distance: 3.2 };
  root.add(lamp);

  // ------------------------------------------------------------------
  // Zustand und Anzeige
  // ------------------------------------------------------------------
  let powered = true;
  let emergency = false;
  let section = 'A-07';
  let oxygen = 98.4;
  let temperature = 21.5;
  let pressure = 101.3;
  let glow = 0.7;
  let phase = 0;
  let lastTime = performance.now() / 1000;
  let lastDraw = -1;

  function drawDisplay() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#041218';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = powered ? '#1a9db0' : '#12343b';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

    const main = powered ? '#8ff7ff' : '#456269';
    ctx.fillStyle = main;
    ctx.font = 'bold 34px monospace';
    ctx.fillText('ATMOS', 18, 48);
    ctx.font = '24px monospace';
    ctx.fillText('SECT ' + section, 18, 84);

    const status = powered ? (emergency ? 'EMERGENCY' : 'NOMINAL') : 'OFFLINE';
    ctx.fillStyle = emergency && powered ? '#ffae46' : main;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(status, 18, 126);

    ctx.strokeStyle = powered ? '#17636f' : '#12343b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 146);
    ctx.lineTo(238, 146);
    ctx.stroke();

    const rows = [
      ['OXYGEN', oxygen.toFixed(1) + ' %', oxygen, 70, 100, 180],
      ['TEMP', temperature.toFixed(1) + ' C', temperature, 15, 30, 340],
      ['PRESSURE', pressure.toFixed(1) + ' kPa', pressure, 90, 115, 500],
    ];
    for (const [title, value, val, min, max, y] of rows) {
      ctx.fillStyle = main;
      ctx.font = '22px monospace';
      ctx.fillText(title, 18, y);
      ctx.font = 'bold 34px monospace';
      ctx.fillText(value, 18, y + 34);
      const t = THREE.MathUtils.clamp((val - min) / (max - min), 0, 1);
      ctx.fillStyle = '#0d2c34';
      ctx.fillRect(18, y + 48, 220, 22);
      const ok = val >= min + (max - min) * 0.25;
      ctx.fillStyle = powered ? (ok ? '#37d7ea' : '#ffae46') : '#31545a';
      ctx.fillRect(18, y + 48, 220 * t, 22);
    }

    ctx.fillStyle = powered ? '#4fb6c4' : '#31545a';
    ctx.font = '16px monospace';
    ctx.fillText('ATLANTIS LIFE SUPPORT', 18, 720);

    if (emergency && powered) {
      ctx.fillStyle = '#ffae46';
      ctx.fillRect(canvas.width - 54, 16, 36, 36);
      ctx.fillStyle = '#301c05';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('!', canvas.width - 43, 45);
    }

    displayTexture.needsUpdate = true;
  }

  drawDisplay();

  function updateDisplay() {
    powerMaterial.emissiveIntensity = powered ? 0.7 + glow * 0.35 : 0.04;
    warningMaterial.emissiveIntensity = emergency && powered ? 1.6 : 0.04;
    screenMaterial.emissiveIntensity = powered ? 0.65 + glow * 0.4 : 0.08;
  }

  function refresh() {
    gaugeO2.set(oxygen);
    gaugeTemp.set(temperature);
    gaugePress.set(pressure);
    drawDisplay();
    updateDisplay();
  }

  // ------------------------------------------------------------------
  // Funktionen
  // ------------------------------------------------------------------
  const api = {
    einschalten() {
      powered = true;
      refresh();
    },

    ausschalten() {
      powered = false;
      refresh();
    },

    umschalten() {
      powered = !powered;
      refresh();
    },

    kalibrieren() {
      if (!powered) return;
      oxygen = 100.0;
      temperature = 21.5;
      pressure = 101.3;
      emergency = false;
      refresh();
    },

    sauerstoffAendern(delta) {
      if (!powered) return;
      oxygen = Math.max(70, Math.min(100, oxygen + delta));
      refresh();
    },

    temperaturAendern(delta) {
      if (!powered) return;
      temperature = Math.max(15, Math.min(30, temperature + delta));
      refresh();
    },

    druckAendern(delta) {
      if (!powered) return;
      pressure = Math.max(90, Math.min(115, pressure + delta));
      refresh();
    },

    notventilationSetzen(aktiv) {
      powered = true;
      emergency = !!aktiv;
      if (emergency) {
        oxygen = Math.min(oxygen, 92.0);
        pressure = Math.max(pressure, 103.0);
      }
      refresh();
    },

    sektionSetzen(neueSektion) {
      section = String(neueSektion);
      refresh();
    },

    get an() {
      return powered;
    },
    get notventilation() {
      return emergency;
    },
    get sektion() {
      return section;
    },
    get sauerstoff() {
      return oxygen;
    },
    get temperatur() {
      return temperature;
    },
    get druck() {
      return pressure;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    { id: 'ein', label: 'Regler einschalten', run: () => api.einschalten() },
    { id: 'aus', label: 'Regler ausschalten', run: () => api.ausschalten() },
    { id: 'kalibrieren', label: 'Atmosphäre kalibrieren', run: () => api.kalibrieren() },
    { id: 'o2_plus', label: 'Sauerstoff um 2 % erhöhen', run: () => api.sauerstoffAendern(2) },
    { id: 'temp_minus', label: 'Temperatur um 0,5 °C senken', run: () => api.temperaturAendern(-0.5) },
    { id: 'druck_plus', label: 'Druck um 1,0 kPa erhöhen', run: () => api.druckAendern(1.0) },
    {
      id: 'sektion',
      label: 'Überwachungssektion wechseln',
      run: () => {
        const reihenfolge = ['A-07', 'B-12', 'C-03'];
        const index = reihenfolge.indexOf(api.sektion);
        api.sektionSetzen(reihenfolge[(index + 1) % reihenfolge.length]);
      },
    },
    { id: 'notventilation_an', label: 'Notventilation aktivieren', run: () => api.notventilationSetzen(true) },
    { id: 'notventilation_aus', label: 'Notventilation beenden', run: () => api.notventilationSetzen(false) },
  ];

  // ------------------------------------------------------------------
  // Selbstständige Animation
  // ------------------------------------------------------------------
  function update(dt) {
    phase += dt;

    const target = powered ? 0.65 + Math.sin(phase * 2.7) * 0.25 : 0;
    glow += (target - glow) * Math.min(1, dt * 5);

    // Lauflicht über den Lüftungsgittern
    const sweep = powered ? (Math.sin(phase * 2.2) * 0.5 + 0.5) : 0;
    sweepUpper.position.y = 1.28 + sweep * 0.44;
    sweepLower.position.y = 0.18 + ((phase * 0.18) % 1) * 0.24;
    sweepUpper.visible = powered;
    sweepLower.visible = powered;

    upperSlats.forEach((slat, i) => {
      const wave = powered ? Math.max(0, Math.sin(phase * 4.0 - i * 0.7)) : 0;
      slat.material.emissiveIntensity = wave * 0.85;
    });
    lowerSlats.forEach((slat, i) => {
      const wave = powered ? Math.max(0, Math.sin(phase * 3.2 - i * 0.6 + 1.2)) : 0;
      slat.material.emissiveIntensity = wave * 0.7;
    });

    // Messnadeln folgen weich
    for (const g of [gaugeO2, gaugeTemp, gaugePress]) {
      g.current += (g.target - g.current) * Math.min(1, dt * 4);
      g.pivot.rotation.z = g.current;
    }

    // Ventile drehen im Notbetrieb leicht
    valveKnobs.forEach((knob, i) => {
      const ziel = emergency && powered ? (i === 0 ? 0.9 : -0.9) : 0;
      knob.rotation.z += (ziel - knob.rotation.z) * Math.min(1, dt * 3);
    });

    if (emergency && powered) {
      warningMaterial.emissiveIntensity = 0.8 + Math.sin(phase * 8) * 0.8;
    }

    updateDisplay();

    if (phase - lastDraw > 0.25) {
      lastDraw = phase;
      drawDisplay();
    }
  }

  housing.onBeforeRender = () => {
    const now = performance.now() / 1000;
    const dt = Math.min(Math.max(now - lastTime, 0), 0.1);
    lastTime = now;
    update(dt);
  };

  root.userData.update = update;
  refresh();

  return root;
}

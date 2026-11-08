import * as THREE from 'three';

export const steckbrief = {
  name: 'patient_monitor',
  art: 'Wandobjekt',
  masse: '0,40 × 0,54 × 0,12 m (B × H × T); Bildschirmdiag. ca. 40 cm',
  wohin: 'Krankenstation / Infirmary und Isolationsraum',
  benutzen: 'INT_bedienen → Menü aus userData.actions',
  lichter: 'LAMP_bildschirm (eisblau, dauerhaft an)',
  animation: 'EKG-, Puls- und EEG-Kurven laufen kontinuierlich; Vital- und Neural-Ansicht wechseln weich, der Ancient-Scan pulsiert und zeigt seinen Fortschritt',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'patient_monitor';

  // Wandobjekt:
  // Ursprung = Mitte der unteren Rückkante. Rückseite bei z = 0, Vorderseite bei +Z.
  const breite = 0.40;
  const hoehe = 0.27;
  const tiefe = 0.065;
  const monitorY = 0.385;
  const monitorZ = 0.078;

  const matHalterung = new THREE.MeshStandardMaterial({
    name: 'KIT_wall',
    color: 0xb9c4c8,
    metalness: 0.68,
    roughness: 0.36,
  });

  const matHalterungInlay = new THREE.MeshStandardMaterial({
    name: 'KIT_wallDark',
    color: 0x283f50,
    metalness: 0.76,
    roughness: 0.32,
  });

  const matBronze = new THREE.MeshStandardMaterial({
    name: 'KIT_rail',
    color: 0xa46c38,
    metalness: 0.82,
    roughness: 0.25,
  });

  const matGehaeuse = new THREE.MeshStandardMaterial({
    name: 'monitor_gehaeuse',
    color: 0x080a0d,
    metalness: 0.22,
    roughness: 0.44,
  });

  const matRahmen = new THREE.MeshStandardMaterial({
    name: 'monitor_rahmen',
    color: 0x263845,
    metalness: 0.66,
    roughness: 0.31,
  });

  const matDunkel = new THREE.MeshStandardMaterial({
    name: 'monitor_dunkel',
    color: 0x11171c,
    metalness: 0.28,
    roughness: 0.56,
  });

  const matKabel = new THREE.MeshStandardMaterial({
    name: 'monitor_kabel',
    color: 0x08090b,
    metalness: 0.04,
    roughness: 0.9,
  });

  // Kompakte Wandplatte. Sie reicht vom Boden desObjekts bis knapp über
  // das Display und trägt Halterung sowie Kabelkanal.
  const wandplatte = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.54, 0.026),
    matHalterung
  );
  wandplatte.position.set(0, 0.27, 0.013);
  root.add(wandplatte);

  const wandInlay = new THREE.Mesh(
    new THREE.BoxGeometry(0.245, 0.465, 0.008),
    matHalterungInlay
  );
  wandInlay.position.set(0, 0.275, 0.030);
  root.add(wandInlay);

  // Zwei bronzefarbene, senkrechte Leisten rahmen die Ancient-Steintafel.
  for (const x of [-0.132, 0.132]) {
    const leiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, 0.49, 0.011),
      matBronze
    );
    leiste.position.set(x, 0.27, 0.037);
    root.add(leiste);
  }

  // Flache Ancient-Symbolplatte im unteren Bereich.
  const symbolRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.039, 0.005, 8, 32),
    matBronze
  );
  symbolRing.position.set(0, 0.112, 0.041);
  root.add(symbolRing);

  const symbolKernMat = new THREE.MeshStandardMaterial({
    name: 'monitor_symbol',
    color: 0x0c4350,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.75,
    metalness: 0.18,
    roughness: 0.3,
  });

  const symbolKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.006, 24),
    symbolKernMat
  );
  symbolKern.rotation.x = Math.PI / 2;
  symbolKern.position.set(0, 0.112, 0.041);
  root.add(symbolKern);

  // Kabelkanal liegt flach an der Wandplatte und endet am Monitor.
  const kanal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.265, 12),
    matKabel
  );
  kanal.position.set(-0.112, 0.2725, 0.046);
  root.add(kanal);

  const kanalVerbinder = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.040, 0.025),
    matDunkel
  );
  kanalVerbinder.position.set(-0.112, 0.385, 0.043);
  root.add(kanalVerbinder);

  // Schwenkhalterung: Wandplatte -> Drehzapfen -> kurzer Arm -> Monitor.
  const drehzapfen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, 0.052, 24),
    matBronze
  );
  drehzapfen.rotation.z = Math.PI / 2;
  drehzapfen.position.set(0, monitorY, 0.047);
  root.add(drehzapfen);

  const halterungsarm = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.070, 0.065),
    matRahmen
  );
  halterungsarm.position.set(0, monitorY, 0.052);
  root.add(halterungsarm);

  // Das Display ist leicht nach oben geneigt, seine Front zeigt weiterhin +Z.
  const gehaeuseGruppe = new THREE.Group();
  gehaeuseGruppe.position.set(0, monitorY, monitorZ);
  gehaeuseGruppe.rotation.x = -0.045;
  root.add(gehaeuseGruppe);

  const gehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(breite, hoehe, tiefe),
    matGehaeuse
  );
  gehaeuseGruppe.add(gehaeuse);

  // Geschlossene Rückabdeckung und sichtbare untere Gehäuseschale.
  const rueckabdeckung = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.225, 0.014),
    matDunkel
  );
  rueckabdeckung.position.z = -0.0365;
  gehaeuseGruppe.add(rueckabdeckung);

  const untereSchale = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.034, 0.012),
    matDunkel
  );
  untereSchale.position.set(0, -0.116, 0.036);
  gehaeuseGruppe.add(untereSchale);

  // Schmale bronze und stahlblaue Zierleisten am Gehäuserand.
  const bronzeLeisteLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.010, 0.232, 0.010),
    matBronze
  );
  bronzeLeisteLinks.position.set(-0.192, 0.006, 0.036);
  gehaeuseGruppe.add(bronzeLeisteLinks);

  const bronzeLeisteRechts = new THREE.Mesh(
    new THREE.BoxGeometry(0.010, 0.232, 0.010),
    matBronze
  );
  bronzeLeisteRechts.position.set(0.192, 0.006, 0.036);
  gehaeuseGruppe.add(bronzeLeisteRechts);

  const obereLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.008, 0.009),
    matBronze
  );
  obereLeiste.position.set(0, 0.127, 0.036);
  gehaeuseGruppe.add(obereLeiste);

  // Dynamische Bildschirmtextur.
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 432;
  const ctx = canvas.getContext('2d');

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.minFilter = THREE.LinearFilter;
  textur.magFilter = THREE.LinearFilter;

  const matSchirm = new THREE.MeshStandardMaterial({
    name: 'monitor_bildschirm',
    color: 0xffffff,
    map: textur,
    emissive: 0xffffff,
    emissiveMap: textur,
    emissiveIntensity: 0.78,
    metalness: 0.02,
    roughness: 0.32,
  });

  const matBildschirmSeiten = new THREE.MeshStandardMaterial({
    name: 'monitor_bildschirmrand',
    color: 0x05080b,
    metalness: 0.18,
    roughness: 0.5,
  });

  // Dünner geschlossener Quader statt einer offenen Bildschirmfläche.
  const schirm = new THREE.Mesh(
    new THREE.BoxGeometry(0.352, 0.198, 0.0025),
    [
      matBildschirmSeiten,
      matBildschirmSeiten,
      matBildschirmSeiten,
      matBildschirmSeiten,
      matSchirm,
      matBildschirmSeiten,
    ]
  );
  schirm.position.set(0, 0.014, 0.0337);
  gehaeuseGruppe.add(schirm);

  const schirmglas = new THREE.Mesh(
    new THREE.BoxGeometry(0.357, 0.203, 0.0015),
    new THREE.MeshStandardMaterial({
      name: 'monitor_glas',
      color: 0x9bc8d9,
      transparent: true,
      opacity: 0.035,
      metalness: 0.04,
      roughness: 0.12,
      depthWrite: false,
    })
  );
  schirmglas.position.set(0, 0.014, 0.0357);
  gehaeuseGruppe.add(schirmglas);

  // Statusleuchte und Tasten.
  const statusMaterial = new THREE.MeshStandardMaterial({
    name: 'monitor_status',
    color: 0x0a343c,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.8,
    metalness: 0.08,
    roughness: 0.24,
  });

  const statusLeuchte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16),
    statusMaterial
  );
  statusLeuchte.rotation.x = Math.PI / 2;
  statusLeuchte.position.set(0.174, -0.113, 0.043);
  gehaeuseGruppe.add(statusLeuchte);

  const knopfMaterial = new THREE.MeshStandardMaterial({
    name: 'monitor_knoepfe',
    color: 0x1b2b35,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.08,
    metalness: 0.48,
    roughness: 0.4,
  });

  const knoepfe = [];
  for (let i = 0; i < 4; i++) {
    const knopf = new THREE.Mesh(
      new THREE.BoxGeometry(0.027, 0.014, 0.009),
      knopfMaterial.clone()
    );
    knopf.position.set(-0.108 + i * 0.056, -0.113, 0.042);
    gehaeuseGruppe.add(knopf);
    knoepfe.push(knopf);
  }

  // Statische Kollisionskörper.
  const colMonitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.40, 0.28, 0.12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  colMonitor.name = 'COL_monitor';
  colMonitor.position.set(0, monitorY, 0.078);
  colMonitor.userData.aktiv = true;
  root.add(colMonitor);

  const colHalterung = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.54, 0.065),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  colHalterung.name = 'COL_halterung';
  colHalterung.position.set(0, 0.27, 0.0325);
  colHalterung.userData.aktiv = true;
  root.add(colHalterung);

  // Benutzen-Punkt vor dem Display.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.40, 0.34);
  use.userData = {
    label: 'Koma- und Narkosemonitor bedienen',
    radius: 0.7,
  };
  root.add(use);

  // Dauerhaft eingeschaltetes, weiches Bildschirmlicht.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_bildschirm';
  lamp.position.set(0, 0.40, 0.20);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 3,
    distance: 2.4,
  };
  root.add(lamp);

  // Zustand und Anzeigelogik.
  let modus = 'vital';
  let scanne = false;
  let scanFortschritt = 0;
  let zeit = 0;
  let letzteZeit = null;
  let letzteZeichnung = -Infinity;

  const gruen = '#62e878';
  const gelb = '#f4cf54';
  const blau = '#67b9ff';
  const bernstein = '#ffb45d';

  function zeichneRaster(x, y, breite, hoehe) {
    ctx.save();
    ctx.strokeStyle = '#0b2831';
    ctx.lineWidth = 1;
    for (let gx = x; gx <= x + breite; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + hoehe);
      ctx.stroke();
    }
    for (let gy = y; gy <= y + hoehe; gy += 24) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + breite, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function zeichneKopf(t) {
    ctx.fillStyle = '#02080b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#07171e';
    ctx.fillRect(0, 0, canvas.width, 49);
    ctx.fillStyle = '#123640';
    ctx.fillRect(0, 48, canvas.width, 2);

    ctx.fillStyle = '#a4d7e4';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(
      modus === 'eeg' ? 'ANCIENT NEURAL MONITOR' : 'PATIENT VITALS',
      18,
      21
    );

    ctx.font = '12px monospace';
    ctx.fillStyle = '#4f97a8';
    ctx.fillText('ATLANTIS INFIRMARY  //  BED 04', 18, 40);

    const blink = 0.5 + 0.5 * Math.sin(t * 3.8);
    ctx.fillStyle = scanne ? bernstein : '#6fe3ff';
    ctx.beginPath();
    ctx.arc(738, 23, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18 + blink * 0.22;
    ctx.beginPath();
    ctx.arc(738, 23, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function zeichneEkg(x, y, breite, hoehe, t) {
    const grundlinie = y + hoehe * 0.55;
    ctx.strokeStyle = gruen;
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const periode = 118;
    for (let px = 0; px <= breite; px += 2) {
      const phase = ((px + t * 104) % periode) / periode;
      const p = Math.exp(-Math.pow((phase - 0.16) / 0.035, 2)) * 5;
      const q = Math.exp(-Math.pow((phase - 0.38) / 0.020, 2)) * 8;
      const r = Math.exp(-Math.pow((phase - 0.43) / 0.018, 2)) * 38;
      const s = Math.exp(-Math.pow((phase - 0.48) / 0.023, 2)) * 14;
      const tWelle = Math.exp(-Math.pow((phase - 0.68) / 0.075, 2)) * 8;
      const py = grundlinie - p + q - r + s - tWelle;

      if (px === 0) ctx.moveTo(x + px, py);
      else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
  }

  function zeichnePuls(x, y, breite, hoehe, t) {
    const grundlinie = y + hoehe * 0.58;
    ctx.strokeStyle = gelb;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const periode = 170;
    for (let px = 0; px <= breite; px += 2) {
      const phase = ((px + t * 70) % periode) / periode;
      const a = Math.exp(-Math.pow((phase - 0.28) / 0.045, 2)) * 30;
      const b = Math.exp(-Math.pow((phase - 0.40) / 0.070, 2)) * 7;
      const py = grundlinie - a + b;

      if (px === 0) ctx.moveTo(x + px, py);
      else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
  }

  function zeichneEeg(x, y, breite, hoehe, t) {
    const grundlinie = y + hoehe * 0.52;
    ctx.strokeStyle = blau;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let px = 0; px <= breite; px += 2) {
      const a = Math.sin(px * 0.058 + t * 5.1) * 7;
      const b = Math.sin(px * 0.019 - t * 2.7) * 10;
      const c = Math.sin(px * 0.231 + t * 8.4) * 2.4;
      const spike =
        Math.pow(Math.max(0, Math.sin(px * 0.036 + t * 3.4)), 18) * 25;
      const py = grundlinie + a + b + c - spike;

      if (px === 0) ctx.moveTo(x + px, py);
      else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
  }

  function zeichneVitalbereich(t) {
    zeichneRaster(18, 61, 510, 128);
    zeichneRaster(18, 198, 510, 111);
    zeichneRaster(18, 318, 510, 69);

    ctx.fillStyle = gruen;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ECG', 26, 78);
    ctx.fillText('PULSE', 26, 215);
    ctx.fillStyle = blau;
    ctx.fillText('EEG', 26, 335);

    zeichneEkg(20, 79, 506, 106, t);
    zeichnePuls(20, 217, 506, 88, t * 0.85);
    zeichneEeg(20, 337, 506, 46, t * 0.48);
  }

  function zeichneNeuralbereich(t) {
    zeichneRaster(18, 61, 510, 248);
    zeichneRaster(18, 318, 510, 69);

    ctx.fillStyle = blau;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('NEURAL ACTIVITY / EEG', 26, 78);
    ctx.fillText('ECG OVERLAY', 26, 335);

    zeichneEeg(20, 81, 506, 222, t);
    zeichneEkg(20, 337, 506, 46, t * 0.65);
  }

  function zeichneWertebereich(t) {
    zeichneRaster(540, 61, 210, 326);

    ctx.fillStyle = '#6f9eaa';
    ctx.font = '12px monospace';
    ctx.fillText('HEART RATE', 554, 82);
    ctx.fillText('SpO2', 554, 142);
    ctx.fillText('BLOOD PRESSURE', 554, 202);
    ctx.fillText('NEURAL LINK', 554, 266);

    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = gruen;
    ctx.fillText('72', 554, 118);
    ctx.font = '13px monospace';
    ctx.fillText('bpm', 603, 118);

    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#6fe3ff';
    ctx.fillText('98', 554, 178);
    ctx.font = '13px monospace';
    ctx.fillText('%', 603, 178);

    ctx.font = 'bold 23px monospace';
    ctx.fillStyle = bernstein;
    ctx.fillText('118/74', 554, 234);
    ctx.font = '12px monospace';
    ctx.fillText('mmHg', 654, 234);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = blau;
    ctx.fillText(scanne ? 'SCANNING' : 'STABLE', 554, 294);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#6693a1';
    ctx.fillText('DELTA 2.4  ALPHA 8.1', 554, 317);
    ctx.fillText('ARTIFACT: LOW', 554, 340);

    if (scanne) {
      const p = Math.min(1, scanFortschritt);
      ctx.fillStyle = '#14252b';
      ctx.fillRect(554, 352, 172, 8);
      ctx.fillStyle = bernstein;
      ctx.fillRect(554, 352, 172 * p, 8);
      ctx.fillStyle = '#ffc47b';
      ctx.fillText(`SCAN ${Math.round(p * 100)}%`, 554, 377);
    } else {
      const puls = 0.55 + 0.45 * Math.sin(t * 3.2);
      ctx.fillStyle = `rgba(103,185,255,${0.3 + puls * 0.7})`;
      ctx.beginPath();
      ctx.arc(708, 368, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function zeichneFusszeile(t) {
    ctx.fillStyle = '#061219';
    ctx.fillRect(0, 396, canvas.width, 36);
    ctx.fillStyle = '#123640';
    ctx.fillRect(0, 396, canvas.width, 1);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = scanne ? bernstein : gruen;
    ctx.fillText(
      scanne
        ? 'ANCIENT SCAN IN PROGRESS'
        : 'PATIENT STATUS: COMATOSE / STABLE',
      18,
      419
    );

    ctx.font = '11px monospace';
    ctx.fillStyle = '#4f8998';
    ctx.fillText('LINK: STABLE', 614, 419);
  }

  function zeichneMonitor(t) {
    zeichneKopf(t);

    if (modus === 'vital') {
      zeichneVitalbereich(t);
    } else {
      zeichneNeuralbereich(t);
    }

    zeichneWertebereich(t);
    zeichneFusszeile(t);
    textur.needsUpdate = true;
  }

  function update(dt) {
    zeit += dt;

    if (scanne) {
      scanFortschritt += dt * 0.24;
      if (scanFortschritt >= 1) {
        scanFortschritt = 1;
        scanne = false;
      }
    }

    const pulsZiel = scanne ? 2.4 : modus === 'eeg' ? 1.15 : 0.8;
    statusMaterial.emissiveIntensity +=
      (pulsZiel - statusMaterial.emissiveIntensity) * Math.min(1, dt * 6);

    symbolKernMat.emissiveIntensity +=
      ((scanne ? 1.8 : 0.55) - symbolKernMat.emissiveIntensity) *
      Math.min(1, dt * 5);

    knoepfe.forEach((knopf, i) => {
      let ziel = 0.07;
      if (i === 0 && modus === 'vital') ziel = 0.9;
      if (i === 1 && modus === 'eeg') ziel = 0.9;
      if (i === 3 && scanne) ziel = 1.5;

      knopf.material.emissiveIntensity +=
        (ziel - knopf.material.emissiveIntensity) * Math.min(1, dt * 7);
    });

    if (zeit - letzteZeichnung >= 1 / 5   /* Display-Takt max. 5 Hz (Leistung) */) {
      zeichneMonitor(zeit);
      letzteZeichnung = zeit;
    }
  }

  // Selbstständige Animation ohne Zugriff auf globale Spielobjekte.
  gehaeuse.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzteZeit !== null) {
      update(Math.min(now - letzteZeit, 0.1));
    }
    letzteZeit = now;
  };

  zeichneMonitor(0);

  // Öffentliche API.
  const api = {
    vitalanzeige() {
      modus = 'vital';
      scanne = false;
      scanFortschritt = 0;
    },
    eegAnzeige() {
      modus = 'eeg';
      scanne = false;
      scanFortschritt = 0;
    },
    scannerStarten() {
      modus = 'eeg';
      scanne = true;
      scanFortschritt = 0;
    },
    scannerStoppen() {
      scanne = false;
      scanFortschritt = 0;
    },
    get modus() {
      return modus;
    },
    get scanne() {
      return scanne;
    },
    get status() {
      return scanne ? 'SCANNING' : 'COMATOSE / STABLE';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'vital',
      label: 'Vitalwerte anzeigen',
      run: () => api.vitalanzeige(),
    },
    {
      id: 'eeg',
      label: 'EEG / Neural Monitor anzeigen',
      run: () => api.eegAnzeige(),
    },
    {
      id: 'scan_start',
      label: 'Antiker-Scanner starten',
      run: () => api.scannerStarten(),
    },
    {
      id: 'scan_stop',
      label: 'Scanvorgang beenden',
      run: () => api.scannerStoppen(),
    },
  ];

  return root;
}

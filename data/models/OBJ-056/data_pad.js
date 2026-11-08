// data_pad.js
// Antikes Daten-Pad / Lantean Data Pad
// Mobile Datenanzeige im Stil des Lebenszeichendetektors.
// Ursprung: Standobjekt, Mitte der Unterseite, Vorderseite nach +Z.

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'data_pad',
  art: 'Standobjekt',
  masse: '0,34 × 0,036 × 0,24 (B × H × T, m)',
  wohin: 'Kontrollraum, Büro Dr. Elizabeth Weir, Krankenstation, Wissenschaftslabor, Lesezimmer',
  benutzen: 'INT_bedienen → Datendisplay, Inventar und Log',
  lichter: 'LAMP_display (eisblau, dauerhaft an)',
  animation: 'Display pulsiert weich; Seitenwechsel mit kurzer Aufhellung; Statusanzeige läuft',
  quelle: 'Spielergänzung im Ancient-/Lantianer-Stil',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'data_pad';

  const breite = 0.34;
  const tiefe = 0.24;
  const hoehe = 0.036;

  // Abgerundete Platte als geschlossener Extrusionskörper.
  // Das Shape liegt in X/Y; nach der Drehung liegt es waagerecht in X/Z.
  function abgerundeteForm(w, d, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -d / 2;

    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function abgerundeterKoerper(w, d, h, r, material, yBasis) {
    const geo = new THREE.ExtrudeGeometry(abgerundeteForm(w, d, r), {
      depth: h,
      bevelEnabled: false,
      curveSegments: 8,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = yBasis;
    return mesh;
  }

  // --- Dunkles Untergehäuse
  const gehaeuseMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_gehaeuse',
    color: 0x17242e,
    metalness: 0.72,
    roughness: 0.34,
  });
  const gehaeuse = abgerundeterKoerper(
    0.332,
    0.232,
    0.020,
    0.025,
    gehaeuseMat,
    0
  );
  root.add(gehaeuse);

  // Untere Fuge als feine bronze- bzw. dunkelblaue Trennlinie.
  const fugenMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_fuge',
    color: 0x263f50,
    metalness: 0.85,
    roughness: 0.27,
  });
  const fuge = new THREE.Mesh(
    new THREE.BoxGeometry(0.318, 0.004, 0.218),
    fugenMat
  );
  fuge.position.set(0, 0.0185, 0);
  root.add(fuge);

  // --- Milchig-transparente Deckplatte
  const milchglasMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_milchglas',
    color: 0xb9dbe3,
    metalness: 0.08,
    roughness: 0.22,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const milchglas = abgerundeterKoerper(
    breite,
    tiefe,
    0.012,
    0.028,
    milchglasMat,
    0.020
  );
  root.add(milchglas);

  // --- Bronze-Rahmen entlang der Oberkante
  const bronze = kit('copper');
  const rahmenHoehe = 0.005;
  const rahmenY = 0.031;
  const randBreite = 0.009;

  const rahmenTeile = [
    [breite - 0.035, randBreite, 0, -tiefe / 2 + randBreite / 2],
    [breite - 0.035, randBreite, 0, tiefe / 2 - randBreite / 2],
    [randBreite, tiefe - 0.035, -breite / 2 + randBreite / 2, 0],
    [randBreite, tiefe - 0.035, breite / 2 - randBreite / 2, 0],
  ];

  for (const [w, d, x, z] of rahmenTeile) {
    const teil = new THREE.Mesh(
      new THREE.BoxGeometry(w, rahmenHoehe, d),
      bronze
    );
    teil.position.set(x, rahmenY, z);
    root.add(teil);
  }

  // Eckbeschläge
  const eckMat = kit('rail');
  const ecken = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [sx, sz] of ecken) {
    const ecke = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.007, 0.024),
      eckMat
    );
    ecke.position.set(
      sx * (breite / 2 - 0.016),
      0.032,
      sz * (tiefe / 2 - 0.015)
    );
    root.add(ecke);
  }

  // --- Display: dunkle Einlage und leuchtende Anzeige
  const bezelMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_bezel',
    color: 0x08131c,
    metalness: 0.55,
    roughness: 0.28,
  });
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.286, 0.004, 0.176),
    bezelMat
  );
  bezel.position.set(0, 0.031, -0.006);
  root.add(bezel);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Zweite Textur: enthält nur die leuchtenden Elemente.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 1024;
  glowCanvas.height = 640;
  const glowCtx = glowCanvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  glowTexture.minFilter = THREE.LinearFilter;
  glowTexture.magFilter = THREE.LinearFilter;

  const displayMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_display',
    color: 0xffffff,
    map: texture,
    emissive: 0x69d8ff,
    emissiveMap: glowTexture,
    emissiveIntensity: 1.25,
    metalness: 0.05,
    roughness: 0.22,
  });

  const displayGeo = new THREE.ShapeGeometry(
    abgerundeteForm(0.270, 0.160, 0.010),
    8
  );
  displayGeo.rotateX(-Math.PI / 2);
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, 0.0332, -0.006);
  root.add(display);

  // --- Kontrolltasten an der Vorderseite (+Z)
  const tastenMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_tasten',
    color: 0x6e8492,
    metalness: 0.82,
    roughness: 0.24,
  });
  const tastenGlowMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_tastenGlow',
    color: 0x0d4156,
    emissive: 0x46c8f4,
    emissiveIntensity: 0.8,
    metalness: 0.25,
    roughness: 0.26,
  });

  for (let i = 0; i < 3; i++) {
    const taste = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.006, 0.017),
      i === 1 ? tastenGlowMat : tastenMat
    );
    taste.position.set(-0.034 + i * 0.034, 0.033, tiefe / 2 - 0.027);
    root.add(taste);
  }

  // Schmale Statusleiste an der Vorderkante.
  const statusMat = new THREE.MeshStandardMaterial({
    name: 'data_pad_statusleiste',
    color: 0x0a2f41,
    emissive: 0x38b9ea,
    emissiveIntensity: 1.0,
    metalness: 0.15,
    roughness: 0.3,
  });
  const statusleiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.086, 0.0025, 0.004),
    statusMat
  );
  statusleiste.position.set(0, 0.025, tiefe / 2 + 0.0005);
  root.add(statusleiste);

  // Kleine bronzene Seitengriffe
  const griffMat = kit('rail');
  for (const sx of [-1, 1]) {
    const griff = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.013, 0.070),
      griffMat
    );
    griff.position.set(
      sx * (breite / 2 + 0.001),
      0.016,
      0.018
    );
    root.add(griff);
  }

  // --- Kollisionskörper
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(breite, hoehe, tiefe)
  );
  col.name = 'COL_data_pad';
  col.position.set(0, hoehe / 2, 0);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.19, 0.20);
  use.userData = {
    label: 'Datenpad bedienen',
    radius: 0.65,
  };
  root.add(use);

  // --- Dauerhaft eingeschaltetes Licht
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_display';
  lamp.position.set(0, 0.065, 0.025);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 2.6,
    distance: 1.5,
  };
  root.add(lamp);

  // --- Anzeigeinhalt
  let screenOn = true;
  let page = 0;
  let zeit = 0;
  let letzte = null;
  let helligkeit = 1.2;
  let textureUhr = 0;

  const seiten = [
    {
      titel: 'ATLANTIS',
      unterzeile: 'CITY DATA / ARCHIVE ACCESS',
      typ: 'city',
    },
    {
      titel: 'INVENTORY',
      unterzeile: 'EXPEDITION EQUIPMENT',
      typ: 'inventory',
    },
    {
      titel: 'LOG',
      unterzeile: 'PERSONAL OPERATIONS LOG',
      typ: 'log',
    },
  ];

  function zeichneDisplay() {
    const w = canvas.width;
    const h = canvas.height;
    const seite = seiten[page];

    // Farbige Textur
    ctx.fillStyle = '#06141f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#10394d';
    ctx.lineWidth = 2;
    for (let x = 40; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 36; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#0b2939';
    ctx.fillRect(32, 28, w - 64, 92);
    ctx.fillStyle = '#7bdcff';
    ctx.font = 'bold 43px monospace';
    ctx.fillText(seite.titel, 54, 78);
    ctx.fillStyle = '#4db8d8';
    ctx.font = '21px monospace';
    ctx.fillText(seite.unterzeile, 56, 106);
    ctx.fillStyle = '#3fa9cb';
    ctx.fillRect(32, 122, w - 64, 3);

    if (seite.typ === 'city') {
      ctx.strokeStyle = '#2d7d9d';
      ctx.lineWidth = 3;
      ctx.strokeRect(58, 160, 430, 286);

      ctx.fillStyle = '#a8e9ff';
      ctx.font = '25px monospace';
      ctx.fillText('SECTOR 07', 84, 202);
      ctx.fillText('POWER GRID', 84, 252);
      ctx.fillText('COMMS RELAY', 84, 302);
      ctx.fillText('ANCIENT NETWORK', 84, 352);
      ctx.fillText('CITY ARCHIVE', 84, 402);

      ctx.fillStyle = '#0a2535';
      ctx.fillRect(536, 160, 420, 286);
      ctx.fillStyle = '#73d9f7';
      ctx.font = 'bold 27px monospace';
      ctx.fillText('STATUS: ONLINE', 564, 212);
      ctx.font = '23px monospace';
      ctx.fillText('DATA LINKS: 12', 564, 266);
      ctx.fillText('LOCAL TIME: 09:42', 564, 320);
      ctx.fillText('LAST UPDATE', 564, 374);
      ctx.fillText('09:41', 564, 418);
    } else if (seite.typ === 'inventory') {
      const eintraege = [
        '01  FIELD COMMUNICATOR',
        '02  MEDICAL SCANNER',
        '03  EXPEDITION LOGS',
        '04  ARCHIVE ACCESS KEY',
        '05  EMERGENCY BEACON',
      ];

      ctx.strokeStyle = '#2d7d9d';
      ctx.lineWidth = 3;
      ctx.strokeRect(42, 154, 940, 330);

      ctx.font = '26px monospace';
      eintraege.forEach((text, i) => {
        const y = 204 + i * 54;
        ctx.fillStyle = i === 3 ? '#a5f0ff' : '#8ddcf6';
        ctx.fillText(text, 70, y);
        ctx.fillStyle = i === 3 ? '#5fdcff' : '#2c89a8';
        ctx.fillRect(70, y + 14, 780 - i * 34, 2);
      });
    } else {
      const eintraege = [
        '> LOCAL TIME       09:42',
        '> COMMUNICATIONS   4 CHANNELS',
        '> ARCHIVE LINK    STABLE',
        '> SECTOR STATUS   NOMINAL',
        '> LAST ENTRY      08:17',
      ];

      ctx.font = '27px monospace';
      eintraege.forEach((text, i) => {
        ctx.fillStyle = i === 3 ? '#a5f0ff' : '#8ddcf6';
        ctx.fillText(text, 76, 202 + i * 58);
      });

      ctx.fillStyle = '#2d7d9d';
      ctx.fillRect(76, 500, 590, 3);
      ctx.fillStyle = '#54bad8';
      ctx.font = '20px monospace';
      ctx.fillText('NO ERRORS RECORDED', 76, 542);
    }

    ctx.fillStyle = '#10394d';
    ctx.fillRect(32, 580, 960, 32);
    ctx.fillStyle = '#5cc9ec';
    ctx.fillRect(32, 580, 690, 32);
    ctx.fillStyle = '#c1f3ff';
    ctx.font = '17px monospace';
    ctx.fillText('LANTIAN DATA NETWORK', 46, 602);

    // Leuchttextur: schwarzer Grund, nur UI-Elemente leuchten.
    glowCtx.fillStyle = '#000000';
    glowCtx.fillRect(0, 0, w, h);

    glowCtx.strokeStyle = '#0b3345';
    glowCtx.lineWidth = 2;
    for (let x = 40; x < w; x += 48) {
      glowCtx.beginPath();
      glowCtx.moveTo(x, 0);
      glowCtx.lineTo(x, h);
      glowCtx.stroke();
    }
    for (let y = 36; y < h; y += 48) {
      glowCtx.beginPath();
      glowCtx.moveTo(0, y);
      glowCtx.lineTo(w, y);
      glowCtx.stroke();
    }

    glowCtx.fillStyle = '#123d52';
    glowCtx.fillRect(32, 28, w - 64, 92);
    glowCtx.fillStyle = '#a6eaff';
    glowCtx.font = 'bold 43px monospace';
    glowCtx.fillText(seite.titel, 54, 78);
    glowCtx.fillStyle = '#3ba7cd';
    glowCtx.font = '21px monospace';
    glowCtx.fillText(seite.unterzeile, 56, 106);
    glowCtx.fillStyle = '#4ac7f0';
    glowCtx.fillRect(32, 122, w - 64, 3);

    if (seite.typ === 'city') {
      glowCtx.strokeStyle = '#3b9fc4';
      glowCtx.lineWidth = 3;
      glowCtx.strokeRect(58, 160, 430, 286);
      glowCtx.fillStyle = '#72d6f5';
      glowCtx.font = '25px monospace';
      glowCtx.fillText('SECTOR 07', 84, 202);
      glowCtx.fillText('POWER GRID', 84, 252);
      glowCtx.fillText('COMMS RELAY', 84, 302);
      glowCtx.fillText('ANCIENT NETWORK', 84, 352);
      glowCtx.fillText('CITY ARCHIVE', 84, 402);

      glowCtx.fillStyle = '#5ed6fa';
      glowCtx.font = 'bold 27px monospace';
      glowCtx.fillText('STATUS: ONLINE', 564, 212);
      glowCtx.font = '23px monospace';
      glowCtx.fillText('DATA LINKS: 12', 564, 266);
      glowCtx.fillText('LOCAL TIME: 09:42', 564, 320);
      glowCtx.fillText('LAST UPDATE', 564, 374);
      glowCtx.fillText('09:41', 564, 418);
    } else if (seite.typ === 'inventory') {
      const eintraege = [
        '01  FIELD COMMUNICATOR',
        '02  MEDICAL SCANNER',
        '03  EXPEDITION LOGS',
        '04  ARCHIVE ACCESS KEY',
        '05  EMERGENCY BEACON',
      ];
      glowCtx.strokeStyle = '#3b9fc4';
      glowCtx.lineWidth = 3;
      glowCtx.strokeRect(42, 154, 940, 330);
      glowCtx.font = '26px monospace';
      eintraege.forEach((text, i) => {
        glowCtx.fillStyle = i === 3 ? '#b8f4ff' : '#82d8f2';
        glowCtx.fillText(text, 70, 204 + i * 54);
      });
    } else {
      const eintraege = [
        '> LOCAL TIME       09:42',
        '> COMMUNICATIONS   4 CHANNELS',
        '> ARCHIVE LINK    STABLE',
        '> SECTOR STATUS   NOMINAL',
        '> LAST ENTRY      08:17',
      ];
      glowCtx.font = '27px monospace';
      eintraege.forEach((text, i) => {
        glowCtx.fillStyle = i === 3 ? '#b8f4ff' : '#82d8f2';
        glowCtx.fillText(text, 76, 202 + i * 58);
      });
      glowCtx.fillStyle = '#3b9fc4';
      glowCtx.fillRect(76, 500, 590, 3);
      glowCtx.fillStyle = '#48b4d4';
      glowCtx.font = '20px monospace';
      glowCtx.fillText('NO ERRORS RECORDED', 76, 542);
    }

    glowCtx.fillStyle = '#12617e';
    glowCtx.fillRect(32, 580, 960, 32);
    glowCtx.fillStyle = '#35bde9';
    glowCtx.fillRect(32, 580, 690, 32);
    glowCtx.fillStyle = '#c8f6ff';
    glowCtx.font = '17px monospace';
    glowCtx.fillText('LANTIAN DATA NETWORK', 46, 602);

    texture.needsUpdate = true;
    glowTexture.needsUpdate = true;
  }

  zeichneDisplay();

  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    const ziel = screenOn
      ? 1.18 + 0.16 * Math.sin(zeit * 2.2)
      : 0.04;

    helligkeit += (ziel - helligkeit) * Math.min(1, d * 7);
    displayMat.emissiveIntensity = helligkeit;

    tastenGlowMat.emissiveIntensity = screenOn
      ? 0.68 + 0.22 * Math.sin(zeit * 3.1)
      : 0.05;

    statusMat.emissiveIntensity = screenOn
      ? 0.85 + 0.25 * Math.sin(zeit * 2.7)
      : 0.05;

    // Die Textur nur zeitweise aktualisieren, nicht in jedem Frame.
    textureUhr += d;
    if (textureUhr >= 0.5) {
      textureUhr = 0;
      if (screenOn) zeichneDisplay();
    }
  }

  display.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(now - letzte);
    }
    letzte = now;
  };

  root.userData.update = update;

  function setPage(neueSeite) {
    page = (neueSeite + seiten.length) % seiten.length;
    helligkeit = Math.max(helligkeit, 1.75);
    zeichneDisplay();
  }

  const api = {
    einschalten() {
      screenOn = true;
      helligkeit = Math.max(helligkeit, 1.4);
      zeichneDisplay();
    },
    ausschalten() {
      screenOn = false;
    },
    umschalten() {
      screenOn = !screenOn;
      if (screenOn) {
        helligkeit = Math.max(helligkeit, 1.4);
        zeichneDisplay();
      }
    },
    nextPage() {
      setPage(page + 1);
    },
    previousPage() {
      setPage(page - 1);
    },
    showCityData() {
      setPage(0);
    },
    showInventory() {
      setPage(1);
    },
    showLog() {
      setPage(2);
    },
    get an() {
      return screenOn;
    },
    get seite() {
      return seiten[page].titel;
    },
    get pages() {
      return seiten.map((s) => s.titel);
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'screen',
      label: 'Display ein-/ausschalten',
      run: () => api.umschalten(),
    },
    {
      id: 'city',
      label: 'Stadtdaten öffnen',
      run: () => api.showCityData(),
    },
    {
      id: 'inventory',
      label: 'Inventar öffnen',
      run: () => api.showInventory(),
    },
    {
      id: 'log',
      label: 'Log öffnen',
      run: () => api.showLog(),
    },
    {
      id: 'next',
      label: 'Nächste Seite',
      run: () => api.nextPage(),
    },
    {
      id: 'previous',
      label: 'Vorherige Seite',
      run: () => api.previousPage(),
    },
  ];

  return root;
}

// Taktische Gefechtsweste & Funkheadset – Standobjekt
import * as THREE from 'three';

const CORDURA = new THREE.MeshStandardMaterial({
  name: 'Cordura_dunkeloliv',
  color: 0x252a24,
  roughness: 0.94,
  metalness: 0.02,
});

const CORDURA_SCHWARZ = new THREE.MeshStandardMaterial({
  name: 'Cordura_schwarz',
  color: 0x101215,
  roughness: 0.96,
  metalness: 0.02,
});

const WEBBING = new THREE.MeshStandardMaterial({
  name: 'Webbing',
  color: 0x181c19,
  roughness: 0.9,
  metalness: 0.03,
});

const STEIN = new THREE.MeshStandardMaterial({
  name: 'Stahl_gestand',
  color: 0x3d454b,
  roughness: 0.55,
  metalness: 0.68,
});

const KUNSTSTOFF = new THREE.MeshStandardMaterial({
  name: 'Torso_Kunststoff',
  color: 0x20252a,
  roughness: 0.78,
  metalness: 0.08,
});

const BRONZE = new THREE.MeshStandardMaterial({
  name: 'Bronze_Akzente',
  color: 0x8a6036,
  roughness: 0.34,
  metalness: 0.82,
});

const SCHWARZ_METALL = new THREE.MeshStandardMaterial({
  name: 'Geraet_Metall',
  color: 0x1a1d20,
  roughness: 0.46,
  metalness: 0.48,
});

const LED_MAT = new THREE.MeshStandardMaterial({
  name: 'Funk_Status_LED',
  color: 0x0a1518,
  emissive: 0x42dfff,
  emissiveIntensity: 0.15,
  roughness: 0.3,
});

function box(parent, material, size, position, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function cylinderBetween(parent, material, a, b, radius = 0.008) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  parent.add(mesh);
  return mesh;
}

function makePanelGeometry(width, height, depth, shoulder = 0.08, waist = 0.035) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;

  shape.moveTo(-hw + waist, -hh);
  shape.lineTo(hw - waist, -hh);
  shape.lineTo(hw, -hh + 0.12);
  shape.lineTo(hw, hh - 0.08);
  shape.lineTo(hw - shoulder, hh);
  shape.lineTo(-hw + shoulder, hh);
  shape.lineTo(-hw, hh - 0.08);
  shape.lineTo(-hw, -hh + 0.12);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.computeVertexNormals();
  return geometry;
}

function makePatchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#17212c';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#58d9f4';
  ctx.lineWidth = 12;
  ctx.strokeRect(14, 14, 228, 228);

  ctx.fillStyle = '#58d9f4';
  ctx.beginPath();
  ctx.moveTo(128, 42);
  ctx.lineTo(211, 112);
  ctx.lineTo(128, 182);
  ctx.lineTo(45, 112);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#17212c';
  ctx.beginPath();
  ctx.moveTo(128, 78);
  ctx.lineTo(175, 112);
  ctx.lineTo(128, 146);
  ctx.lineTo(81, 112);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c9954d';
  ctx.fillRect(78, 196, 100, 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture };
}

export const steckbrief = {
  name: 'tactical_vest',
  art: 'Standobjekt',
  masse: '0,95 × 1,62 × 0,55 (B × H × T, m)',
  wohin: 'ATL-001 (Gate-Raum), ATL-030 (Waffenkammer)',
  benutzen: 'INT_weste und INT_headset → Ausrüstungs- und Kommunikationsmenü',
  lichter: 'LAMP_funk (eisblau, Statusleuchte)',
  animation: 'Funk-LED pulsiert, Kanalanzeige leuchtet, Prüflicht antwortet grün',
  quelle: 'selbst gebaut nach OBJ-064',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'tactical_vest';

  // ------------------------------------------------------------------
  // Ständer und Torso
  // ------------------------------------------------------------------
  const stand = new THREE.Group();
  stand.name = 'Staender_Torso';
  stand.position.x = 0.13;
  root.add(stand);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.32, 0.075, 32),
    STEIN,
  );
  base.position.y = 0.0375;
  base.name = 'Standfuss';
  stand.add(base);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.275, 0.014, 8, 36),
    BRONZE,
  );
  baseRing.position.y = 0.073;
  baseRing.rotation.x = Math.PI / 2;
  stand.add(baseRing);

  box(stand, STEIN, [0.11, 0.62, 0.11], [0, 0.38, 0], 'Standrohr');

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.25, 0.78, 20),
    KUNSTSTOFF,
  );
  torso.position.set(0, 1.08, -0.015);
  torso.scale.z = 0.68;
  torso.name = 'Torso_Mannequin';
  stand.add(torso);

  const hals = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.105, 0.14, 16),
    KUNSTSTOFF,
  );
  hals.position.set(0, 1.52, -0.015);
  stand.add(hals);

  const schulterform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24),
    KUNSTSTOFF,
  );
  schulterform.position.set(0, 1.435, -0.015);
  schulterform.scale.z = 0.72;
  stand.add(schulterform);

  // ------------------------------------------------------------------
  // Gefechtsweste
  // ------------------------------------------------------------------
  const vest = new THREE.Group();
  vest.name = 'Gefechtsweste';
  vest.position.x = 0.13;
  root.add(vest);

  const frontPanel = new THREE.Mesh(
    makePanelGeometry(0.56, 0.72, 0.075, 0.08, 0.035),
    CORDURA,
  );
  frontPanel.position.set(0, 1.16, 0.125);
  frontPanel.name = 'Weste_Frontplatte';
  vest.add(frontPanel);

  const backPanel = new THREE.Mesh(
    makePanelGeometry(0.50, 0.66, 0.065, 0.07, 0.035),
    CORDURA_SCHWARZ,
  );
  backPanel.position.set(0, 1.15, -0.215);
  backPanel.name = 'Weste_Rueckenplatte';
  vest.add(backPanel);

  // Seitliche, nach hinten umlaufende Westenteile
  box(vest, CORDURA, [0.075, 0.65, 0.25], [-0.285, 1.16, -0.01], 'Weste_Seite_links');
  box(vest, CORDURA, [0.075, 0.65, 0.25], [0.285, 1.16, -0.01], 'Weste_Seite_rechts');

  // Schulterpolster und Schultergurte
  box(vest, CORDURA_SCHWARZ, [0.205, 0.16, 0.31], [-0.205, 1.465, -0.01], 'Schulterpolster_links');
  box(vest, CORDURA_SCHWARZ, [0.205, 0.16, 0.31], [0.205, 1.465, -0.01], 'Schulterpolster_rechts');
  box(vest, WEBBING, [0.075, 0.31, 0.315], [-0.205, 1.365, -0.01], 'Schultergurt_links');
  box(vest, WEBBING, [0.075, 0.31, 0.315], [0.205, 1.365, -0.01], 'Schultergurt_rechts');

  // Kragen
  box(vest, WEBBING, [0.34, 0.075, 0.25], [0, 1.515, -0.04], 'Kragen');

  // Brustabschluss und Flankenverschluss
  box(vest, WEBBING, [0.51, 0.065, 0.09], [0, 0.845, 0.19], 'Unterer_Westengurt');
  for (const x of [-0.235, 0.235]) {
    box(vest, WEBBING, [0.07, 0.55, 0.285], [x, 1.14, -0.005], 'Flankenlasche');
    box(vest, BRONZE, [0.045, 0.055, 0.012], [x, 1.04, 0.145], 'Gurtverschluss');
  }

  // MOLLE-Webbing: horizontale Bänder und Querlaschen
  for (let row = 0; row < 4; row++) {
    const y = 0.94 + row * 0.125;
    box(vest, WEBBING, [0.49, 0.028, 0.018], [0, y, 0.212], `MOLLE_Band_${row}`);
    for (let col = 0; col < 7; col++) {
      const x = -0.21 + col * 0.07;
      box(vest, WEBBING, [0.018, 0.075, 0.019], [x, y + 0.012, 0.217], `MOLLE_Lasche_${row}_${col}`);
    }
  }

  // Magazintaschen
  const magColors = [0x1d211d, 0x262b24, 0x191d1b];
  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshStandardMaterial({
      name: `Magazintasche_${i}`,
      color: magColors[i],
      roughness: 0.92,
      metalness: 0.02,
    });
    const x = -0.175 + i * 0.145;
    box(vest, material, [0.125, 0.205, 0.09], [x, 1.00, 0.265], `Magazintasche_${i}`);
    box(vest, WEBBING, [0.125, 0.045, 0.095], [x, 1.083, 0.268], `Magazinverschluss_${i}`);
    box(vest, BRONZE, [0.022, 0.028, 0.012], [x, 1.025, 0.315], `Magazinklammer_${i}`);
  }

  // Allgemeine Utility-Tasche
  box(vest, CORDURA_SCHWARZ, [0.16, 0.18, 0.085], [-0.175, 1.285, 0.235], 'Utility_Tasche');
  box(vest, WEBBING, [0.16, 0.04, 0.09], [-0.175, 1.355, 0.24], 'Utility_Verschluss');
  box(vest, BRONZE, [0.035, 0.028, 0.012], [-0.175, 1.305, 0.285], 'Utility_Schliesse');

  // Erste-Hilfe-Pouch
  const medMat = new THREE.MeshStandardMaterial({
    name: 'Erste_Hilfe_Tasche',
    color: 0x26342f,
    roughness: 0.88,
    metalness: 0.02,
  });
  box(vest, medMat, [0.14, 0.115, 0.07], [0.18, 1.30, 0.23], 'Erste_Hilfe_Tasche');
  box(vest, WEBBING, [0.14, 0.025, 0.075], [0.18, 1.342, 0.234], 'Medizin_Verschluss');
  box(vest, BRONZE, [0.045, 0.018, 0.01], [0.18, 1.305, 0.27], 'Medizin_Kreuz');

  // Funkgerät auf der Weste
  const radio = new THREE.Group();
  radio.name = 'Funkgeraet';
  radio.position.set(0.185, 1.435, 0.235);
  vest.add(radio);

  box(radio, SCHWARZ_METALL, [0.10, 0.17, 0.065], [0, 0, 0], 'Funkgeraet_Gehaeuse');
  box(radio, WEBBING, [0.045, 0.08, 0.025], [0, 0.055, 0.043], 'Funkgeraet_Taste');
  cylinderBetween(radio, SCHWARZ_METALL, [-0.025, 0.085, 0], [-0.035, 0.205, 0], 0.006);

  const radioLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 10, 8),
    LED_MAT,
  );
  radioLed.position.set(0.025, 0.058, 0.047);
  radio.add(radioLed);

  // Kleines Messer in seitlicher Scherbe
  const knife = new THREE.Group();
  knife.position.set(-0.325, 1.02, -0.005);
  knife.rotation.z = -0.14;
  vest.add(knife);
  box(knife, CORDURA_SCHWARZ, [0.055, 0.13, 0.025], [0, 0, 0], 'Messerscheide');
  box(knife, SCHWARZ_METALL, [0.026, 0.075, 0.014], [0, 0.095, 0], 'Messergriff');
  box(knife, BRONZE, [0.06, 0.012, 0.027], [0, 0.128, 0], 'Messerquerschnitt');

  // Atlantis-/Team-Patch
  const patchMaterial = new THREE.MeshStandardMaterial({
    name: 'Atlantis_Patch',
    map: makePatchTexture(),
    roughness: 0.92,
    metalness: 0,
  });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.115), patchMaterial);
  patch.position.set(-0.165, 1.435, 0.202);
  patch.name = 'Atlantis_Patch';
  vest.add(patch);

  // Schulterabzeichen
  const shoulderBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.047, 0.047, 0.008, 20),
    BRONZE,
  );
  shoulderBadge.rotation.x = Math.PI / 2;
  shoulderBadge.position.set(0.205, 1.465, 0.155);
  vest.add(shoulderBadge);

  // ------------------------------------------------------------------
  // Funkheadset neben der Weste, mit eigenem kleinen Ständer
  // ------------------------------------------------------------------
  const headsetStand = new THREE.Group();
  headsetStand.name = 'Headset_Staender';
  headsetStand.position.set(-0.30, 0, 0.015);
  root.add(headsetStand);

  const headsetBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.055, 28),
    STEIN,
  );
  headsetBase.position.y = 0.0275;
  headsetBase.name = 'Headset_Standfuss';
  headsetStand.add(headsetBase);

  const headsetBaseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.01, 8, 28),
    BRONZE,
  );
  headsetBaseRing.position.y = 0.054;
  headsetBaseRing.rotation.x = Math.PI / 2;
  headsetStand.add(headsetBaseRing);

  cylinderBetween(headsetStand, STEIN, [0, 0.05, 0], [0, 1.08, 0], 0.018);
  cylinderBetween(headsetStand, BRONZE, [0, 1.08, 0], [0.045, 1.14, 0], 0.012);

  const headset = new THREE.Group();
  headset.name = 'Funkheadset';
  headset.position.set(-0.30, 1.18, 0.015);
  root.add(headset);

  // Geschlossener, weicher Kopfbogen
  const bandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.095, -0.045, 0),
    new THREE.Vector3(-0.10, 0.045, 0),
    new THREE.Vector3(-0.065, 0.115, 0),
    new THREE.Vector3(0, 0.145, 0),
    new THREE.Vector3(0.065, 0.115, 0),
    new THREE.Vector3(0.10, 0.045, 0),
    new THREE.Vector3(0.095, -0.045, 0),
  ]);
  const band = new THREE.Mesh(
    new THREE.TubeGeometry(bandCurve, 24, 0.011, 8, false),
    CORDURA_SCHWARZ,
  );
  band.name = 'Headset_Kopfbogen';
  headset.add(band);

  // Ohrstück
  box(headset, CORDURA_SCHWARZ, [0.075, 0.12, 0.07], [0.015, -0.065, 0], 'Ohrstueck');

  const earPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.041, 0.041, 0.022, 16),
    CORDURA_SCHWARZ,
  );
  earPad.rotation.z = Math.PI / 2;
  earPad.position.set(-0.03, -0.065, 0);
  headset.add(earPad);

  // Bügelmikrofon
  cylinderBetween(headset, SCHWARZ_METALL, [-0.025, -0.09, 0.01], [-0.09, -0.18, 0.045], 0.007);
  cylinderBetween(headset, SCHWARZ_METALL, [-0.09, -0.18, 0.045], [-0.155, -0.205, 0.055], 0.006);
  const microphone = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.017, 0.035, 4, 10),
    CORDURA_SCHWARZ,
  );
  microphone.position.set(-0.17, -0.21, 0.055);
  microphone.rotation.z = Math.PI / 2;
  headset.add(microphone);

  // Kleine Kontroll- und Anzeigeeinheit
  box(headset, SCHWARZ_METALL, [0.075, 0.045, 0.045], [0.065, 0.015, 0], 'Headset_Steuereinheit');

  const display = makeDisplayTexture();
  const displayMaterial = new THREE.MeshStandardMaterial({
    name: 'Headset_Display',
    color: 0xffffff,
    map: display.texture,
    emissiveMap: display.texture,
    emissive: 0x58dfff,
    emissiveIntensity: 0.05,
    roughness: 0.45,
    metalness: 0,
  });
  const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.029), displayMaterial);
  displayMesh.position.set(0.065, 0.016, 0.024);
  headset.add(displayMesh);

  // Kleiner Sendeclip am Ohrstück
  const headsetLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 10, 8),
    LED_MAT,
  );
  headsetLed.position.set(0.045, -0.045, 0.042);
  headset.add(headsetLed);

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  const colStand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.65, 0.42));
  colStand.name = 'COL_staender';
  colStand.position.set(0.13, 0.825, -0.015);
  root.add(colStand);

  const colVest = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.76, 0.50));
  colVest.name = 'COL_weste';
  colVest.position.set(0.13, 1.16, 0.08);
  root.add(colVest);

  const colHeadset = new THREE.Mesh(new THREE.BoxGeometry(0.29, 1.30, 0.22));
  colHeadset.name = 'COL_headset';
  colHeadset.position.set(-0.30, 0.65, 0.015);
  root.add(colHeadset);

  // ------------------------------------------------------------------
  // Benutzen-Punkte und Licht
  // ------------------------------------------------------------------
  const useVest = new THREE.Object3D();
  useVest.name = 'INT_weste';
  useVest.position.set(0.13, 1.12, 0.58);
  useVest.userData = { label: 'Gefechtsweste prüfen und ausrüsten', radius: 0.8 };
  root.add(useVest);

  const useHeadset = new THREE.Object3D();
  useHeadset.name = 'INT_headset';
  useHeadset.position.set(-0.30, 1.18, 0.38);
  useHeadset.userData = { label: 'Funkheadset bedienen', radius: 0.65 };
  root.add(useHeadset);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_funk';
  lamp.position.set(0.315, 1.48, 0.30);
  lamp.userData = { color: '#6fe3ff', intensity: 2.2, distance: 1.5 };
  root.add(lamp);

  // ------------------------------------------------------------------
  // Zustand, Anzeige und Funktionen
  // ------------------------------------------------------------------
  let radioOn = true;
  let channel = 1;
  let pruefzeit = -10;
  let zeit = 0;
  let letzte = null;
  let angezeigterText = '';

  function zeichneAnzeige() {
    const text = radioOn ? `CH ${channel}` : 'OFF';
    if (text === angezeigterText) return;
    angezeigterText = text;

    const ctx = display.canvas.getContext('2d');
    ctx.clearRect(0, 0, display.canvas.width, display.canvas.height);
    ctx.fillStyle = radioOn ? '#071a1c' : '#180b0b';
    ctx.fillRect(0, 0, display.canvas.width, display.canvas.height);
    ctx.fillStyle = radioOn ? '#78eaff' : '#ff6655';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 65);
    display.texture.needsUpdate = true;
  }

  function update(dt) {
    zeit += dt;

    let ledZiel = 0.08;
    let emissiveFarbe = 0x42dfff;

    if (radioOn) {
      ledZiel = 1.6 + Math.sin(zeit * 3.4) * 0.55;
    }

    if (zeit - pruefzeit < 2.5) {
      const remaining = 2.5 - (zeit - pruefzeit);
      ledZiel = 2.4 * Math.max(0, Math.sin(remaining * 9));
      emissiveFarbe = 0x54ff82;
    }

    LED_MAT.emissive.setHex(emissiveFarbe);
    LED_MAT.emissiveIntensity +=
      (ledZiel - LED_MAT.emissiveIntensity) * Math.min(1, dt * 9);

    displayMaterial.emissiveIntensity +=
      ((radioOn ? 1.25 + Math.sin(zeit * 2.2) * 0.18 : 0.04) -
        displayMaterial.emissiveIntensity) * Math.min(1, dt * 6);
  }

  zeichneAnzeige();

  const antrieb = frontPanel;
  antrieb.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  const api = {
    get funkAktiv() {
      return radioOn;
    },
    get kanal() {
      return channel;
    },
    get schutzwesteBereit() {
      return true;
    },
    funkEinschalten() {
      radioOn = true;
      zeichneAnzeige();
    },
    funkAusschalten() {
      radioOn = false;
      zeichneAnzeige();
    },
    funkUmschalten() {
      radioOn = !radioOn;
      zeichneAnzeige();
    },
    kanalWechseln() {
      channel = channel % 4 + 1;
      zeichneAnzeige();
    },
    schutzwestePruefen() {
      pruefzeit = zeit;
    },
    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'funk_ein',
      label: 'Funkgerät einschalten',
      run: () => api.funkEinschalten(),
    },
    {
      id: 'funk_aus',
      label: 'Funkgerät ausschalten',
      run: () => api.funkAusschalten(),
    },
    {
      id: 'funk_umschalten',
      label: 'Funkgerät ein/aus',
      run: () => api.funkUmschalten(),
    },
    {
      id: 'kanal_wechseln',
      label: 'Funkkanal wechseln',
      run: () => api.kanalWechseln(),
    },
    {
      id: 'weste_pruefen',
      label: 'Schutzweste prüfen',
      run: () => api.schutzwestePruefen(),
    },
  ];

  return root;
}

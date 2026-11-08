// cloak_generator.js
// Antiker Tarnfeld-Generator – Standobjekt, ca. 1,50 × 2,50 × 1,50 m
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'cloak_generator',
  art: 'Standobjekt',
  masse: '1,50 × 2,50 × 1,50 (B × H × T, m)',
  wohin: 'ATL-002 Kontrollraum/Kommandozentrale, ATL-038 ZPM-Raum',
  benutzen: 'INT_bedienen → Tarnfeld aktivieren, deaktivieren oder umschalten',
  lichter: 'LAMP_tarnfeld (eisblau, dauerhaft aktiv)',
  animation: 'Tarnfeld flimmert beim Aktivieren; prismatische Kranzringe rotieren, Regenbogensäume und Energieanzeige reagieren',
  quelle: 'selbst gebaut nach der Atlantis-Tarnfeld-Technik; Ancient-Stilinterpretation'
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'cloak_generator';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const matPearl = kit('pillar');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');

  const emitterMat = new THREE.MeshStandardMaterial({
    name: 'tarnfeld_emitter',
    color: 0x17364c,
    emissive: 0x39bde8,
    emissiveIntensity: 0.22,
    metalness: 0.78,
    roughness: 0.24
  });

  const prismMat = new THREE.MeshStandardMaterial({
    name: 'tarnfeld_prisma',
    color: 0xffffff,
    emissive: 0x247ca5,
    emissiveIntensity: 0.32,
    metalness: 0.38,
    roughness: 0.18,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    vertexColors: true
  });

  const fieldMat = new THREE.MeshStandardMaterial({
    name: 'tarnfeld_feldhuelle',
    color: 0x9ce8ff,
    emissive: 0x55c9f5,
    emissiveIntensity: 0.14,
    metalness: 0.05,
    roughness: 0.12,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

  const warningMat = new THREE.MeshStandardMaterial({
    name: 'tarnfeld_warnung',
    color: 0x4b2d08,
    emissive: 0xff9d32,
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.3
  });

  const haloMaterials = [
    new THREE.MeshStandardMaterial({
      name: 'tarnfeld_saum_cyan',
      color: 0x65eaff,
      emissive: 0x2abfe8,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }),
    new THREE.MeshStandardMaterial({
      name: 'tarnfeld_saum_magenta',
      color: 0xd66cff,
      emissive: 0x8d35c7,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }),
    new THREE.MeshStandardMaterial({
      name: 'tarnfeld_saum_bernstein',
      color: 0xffb85e,
      emissive: 0xc46c18,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  ];

  // ------------------------------------------------------------
  // Mehrstufiger Sockel
  // ------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.70, 0.72, 0.18, 32),
    matDark
  );
  base.position.y = 0.09;
  root.add(base);

  const baseTier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.75, 0.16, 32),
    matPearl
  );
  baseTier.position.y = 0.26;
  root.add(baseTier);

  const baseRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.71, 0.03, 6, 32),
    matRail
  );
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.35;
  root.add(baseRim);

  const baseInlay = new THREE.Mesh(
    new THREE.TorusGeometry(0.61, 0.018, 6, 28),
    matCopper
  );
  baseInlay.rotation.x = Math.PI / 2;
  baseInlay.position.y = 0.345;
  root.add(baseInlay);

  const boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8);
  const bolts = new THREE.InstancedMesh(boltGeo, matRail, 16);
  bolts.name = 'INST_sockelschrauben';
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 0.65, 0.352, Math.cos(a) * 0.65);
    dummy.rotation.set(0, a, 0);
    dummy.updateMatrix();
    bolts.setMatrixAt(i, dummy.matrix);
  }
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  const lowerDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.58, 0.28, 24),
    matPearl
  );
  lowerDrum.position.y = 0.50;
  root.add(lowerDrum);

  const lowerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.50, 0.035, 6, 28),
    matCopper
  );
  lowerRim.rotation.x = Math.PI / 2;
  lowerRim.position.y = 0.64;
  root.add(lowerRim);

  // ------------------------------------------------------------
  // Zentrales Energiesockel-Modul
  // ------------------------------------------------------------
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.29, 0.90, 24),
    matPearl
  );
  column.position.y = 1.09;
  root.add(column);

  for (const y of [0.67, 1.51]) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.032, 6, 24),
      y > 1 ? matRail : matCopper
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    root.add(collar);
  }

  const frontSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.76, 0.075),
    matDark
  );
  frontSpine.position.set(0, 1.07, 0.255);
  root.add(frontSpine);

  for (const x of [-0.055, 0.055]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.62, 0.016),
      matGlow
    );
    strip.position.set(x, 1.07, 0.301);
    root.add(strip);
  }

  // ------------------------------------------------------------
  // Integrierte Seitenstreben
  // ------------------------------------------------------------
  const pylonGeo = new THREE.CylinderGeometry(0.085, 0.105, 1.18, 16);
  const footGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.12, 16);
  const capGeo = new THREE.CylinderGeometry(0.12, 0.085, 0.12, 16);

  for (const side of [-1, 1]) {
    const pylon = new THREE.Mesh(pylonGeo, matDark);
    pylon.position.set(side * 0.54, 1.04, 0);
    root.add(pylon);

    const foot = new THREE.Mesh(footGeo, matCopper);
    foot.position.set(side * 0.54, 0.42, 0);
    root.add(foot);

    const cap = new THREE.Mesh(capGeo, matPearl);
    cap.position.set(side * 0.54, 1.67, 0);
    root.add(cap);

    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.075, 0.09),
      matDark
    );
    brace.position.set(side * 0.33, 0.77, 0);
    brace.rotation.z = side * 0.64;
    root.add(brace);
  }

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.14, 0.16),
    matDark
  );
  crossbar.position.set(0, 1.66, 0);
  root.add(crossbar);

  const crossbarTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.025, 0.018),
    matGlow
  );
  crossbarTrim.position.set(0, 1.66, 0.09);
  root.add(crossbarTrim);

  // ------------------------------------------------------------
  // Oberer Tarnfeld-Emitter
  // ------------------------------------------------------------
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.30, 0.22, 16),
    matCopper
  );
  neck.position.y = 1.71;
  root.add(neck);

  const emitter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.32, 0.40, 16),
    emitterMat
  );
  emitter.position.y = 2.01;
  root.add(emitter);

  for (const y of [1.84, 2.18]) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.365, 0.024, 6, 24),
      matRail
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    root.add(band);
  }

  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.29, 0.22, 16),
    matPearl
  );
  canopy.position.y = 2.31;
  root.add(canopy);

  const canopyRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.025, 6, 24),
    matCopper
  );
  canopyRim.rotation.x = Math.PI / 2;
  canopyRim.position.y = 2.21;
  root.add(canopyRim);

  const finial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.055, 0.08, 8),
    matRail
  );
  finial.position.y = 2.46;
  root.add(finial);

  // ------------------------------------------------------------
  // Regenbogen-Prismalamellen
  // ------------------------------------------------------------
  const rainbow = [
    0x55eaff, 0x4e8cff, 0x8e72ff, 0xd46cff,
    0xff6f91, 0xffb85c, 0x83f6a7, 0x67e3ff
  ];

  function addWhiteVertexColors(geometry) {
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    colors.fill(1);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  const finGeo = new THREE.BoxGeometry(0.055, 0.48, 0.03);
  addWhiteVertexColors(finGeo);

  const fins = new THREE.InstancedMesh(finGeo, prismMat, rainbow.length);
  fins.name = 'INST_prismalamellen';
  const color = new THREE.Color();

  for (let i = 0; i < rainbow.length; i++) {
    const a = (i / rainbow.length) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 0.41, 2.00, Math.cos(a) * 0.41);
    dummy.rotation.set(0, a, 0);
    dummy.updateMatrix();
    fins.setMatrixAt(i, dummy.matrix);
    fins.setColorAt(i, color.setHex(rainbow[i]));
  }
  fins.instanceMatrix.needsUpdate = true;
  if (fins.instanceColor) fins.instanceColor.needsUpdate = true;
  root.add(fins);

  const nodeGeo = new THREE.OctahedronGeometry(0.043, 0);
  addWhiteVertexColors(nodeGeo);

  const nodes = new THREE.InstancedMesh(nodeGeo, prismMat, rainbow.length);
  nodes.name = 'INST_energieknoten';

  for (let i = 0; i < rainbow.length; i++) {
    const a = (i / rainbow.length) * Math.PI * 2 + Math.PI / 8;
    dummy.position.set(Math.sin(a) * 0.46, 1.55, Math.cos(a) * 0.46);
    dummy.rotation.set(0, a, 0);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
    nodes.setColorAt(i, color.setHex(rainbow[i]));
  }
  nodes.instanceMatrix.needsUpdate = true;
  if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
  root.add(nodes);

  // ------------------------------------------------------------
  // Holografische Feldhülle und Kranzringe
  // ------------------------------------------------------------
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 20, 10),
    fieldMat
  );
  dome.scale.set(1, 0.48, 1);
  dome.position.y = 2.07;
  root.add(dome);

  const ringGroups = [];
  const ringTilts = [
    [0.10, 0.00, 0.00],
    [0.58, 0.18, 0.24],
    [1.00, 0.46, -0.18]
  ];

  for (let i = 0; i < 3; i++) {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.48 + i * 0.018, 0.009, 6, 32),
      haloMaterials[i]
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.y = 2.02 + i * 0.025;
    group.rotation.set(...ringTilts[i]);
    group.userData.richtung = i % 2 === 0 ? 1 : -1;
    root.add(group);
    ringGroups.push(group);
  }

  const prismCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    fieldMat
  );
  prismCore.position.y = 2.08;
  root.add(prismCore);

  // ------------------------------------------------------------
  // Frontseitiges Bedienfeld, Vorderseite +Z
  // ------------------------------------------------------------
  const consoleSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.13, 0.20),
    matDark
  );
  consoleSupport.position.set(0, 1.10, 0.25);
  root.add(consoleSupport);

  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.35, 0.085),
    matCopper
  );
  screenFrame.position.set(0, 1.14, 0.345);
  root.add(screenFrame);

  const screenHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.47, 0.30, 0.10),
    matDark
  );
  screenHousing.position.set(0, 1.14, 0.385);
  root.add(screenHousing);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const screenCtx = screenCanvas.getContext('2d');

  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'tarnfeld_anzeige',
    color: 0xffffff,
    map: screenTexture,
    emissive: 0x6fe3ff,
    emissiveMap: screenTexture,
    emissiveIntensity: 0.65,
    metalness: 0.05,
    roughness: 0.34
  });

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.25),
    screenMat
  );
  screen.position.set(0, 1.14, 0.437);
  root.add(screen);

  const warningLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.025, 0.018),
    warningMat
  );
  warningLamp.position.set(0.18, 1.305, 0.405);
  root.add(warningLamp);

  function drawScreen() {
    const w = screenCanvas.width;
    const h = screenCanvas.height;
    const ctx = screenCtx;

    ctx.fillStyle = '#04111f';
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 280);
    glow.addColorStop(0, 'rgba(31, 120, 160, 0.20)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(9, 9, w - 18, h - 18);

    // Lantianische Randzeichen
    ctx.strokeStyle = 'rgba(111, 227, 255, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = 26 + i * 66;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x + 12, 29);
      ctx.lineTo(x, 40);
      ctx.moveTo(x + 5, 29);
      ctx.lineTo(x + 22, 29);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#bdefff';
    ctx.font = 'bold 33px monospace';
    ctx.fillText('CLOAK FIELD', w / 2, 72);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#79bdd4';
    ctx.font = '21px monospace';
    ctx.fillText('ENERGY', 30, 112);

    ctx.textAlign = 'right';
    ctx.fillText(energie.toFixed(0) + '%', w - 30, 112);

    ctx.fillStyle = '#102b40';
    ctx.fillRect(30, 130, w - 60, 28);

    const barWidth = (w - 60) * Math.max(0, Math.min(100, energie)) / 100;
    const gradient = ctx.createLinearGradient(30, 0, w - 30, 0);
    gradient.addColorStop(0, '#3b7cff');
    gradient.addColorStop(0.35, '#8b68ff');
    gradient.addColorStop(0.65, '#e36fff');
    gradient.addColorStop(1, '#6fe3ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(30, 130, barWidth, 28);

    ctx.textAlign = 'center';
    ctx.font = 'bold 25px monospace';
    ctx.fillStyle = aktiv ? '#83f2ff' : '#ffbb66';
    ctx.fillText(aktiv ? 'FIELD ONLINE' : 'STANDBY', w / 2, 205);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#5e9fb8';
    ctx.fillText(aktiv ? 'DRAW 0.90 %/s' : 'CHARGE 0.25 %/s', w / 2, 240);

    ctx.strokeStyle = 'rgba(111, 227, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 264);
    ctx.lineTo(w - 30, 264);
    ctx.stroke();

    ctx.fillStyle = '#4d879d';
    ctx.font = '15px monospace';
    ctx.fillText('OPTICAL / SENSOR CLOCK', w / 2, 288);

    screenTexture.needsUpdate = true;
  }

  // ------------------------------------------------------------
  // Kollision, Benutzen-Punkt und Licht
  // ------------------------------------------------------------
  const col = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5));
  col.name = 'COL_gehaeuse';
  col.position.set(0, 1.25, 0);
  col.userData.aktiv = true;
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.14, 0.78);
  use.userData = { label: 'Tarnfeld-Generator bedienen', radius: 0.8 };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_tarnfeld';
  lamp.position.set(0, 2.04, 0.43);
  lamp.userData = { color: '#6fe3ff', intensity: 8, distance: 5 };
  root.add(lamp);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  const startEnergie = Number.isFinite(opts.energie) ? opts.energie : 100;
  let energie = THREE.MathUtils.clamp(startEnergie, 0, 100);
  let aktiv = Boolean(opts.aktiv) && energie > 0;
  let feldStaerke = aktiv ? 1 : 0;
  let zeit = 0;
  let letzte = null;
  let bildTimer = 0;

  function einschalten() {
    if (energie > 0.5) aktiv = true;
  }

  function ausschalten() {
    aktiv = false;
  }

  function umschalten() {
    if (aktiv) ausschalten();
    else einschalten();
  }

  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    if (aktiv) {
      energie = Math.max(0, energie - d * 0.9);
      if (energie <= 0) aktiv = false;
    } else {
      energie = Math.min(100, energie + d * 0.25);
    }

    const ziel = aktiv ? 1 : 0;
    feldStaerke += (ziel - feldStaerke) * Math.min(1, d * 2.6);

    const flimmern =
      0.80 +
      0.13 * Math.sin(zeit * 7.3) +
      0.07 * Math.sin(zeit * 13.7 + 1.2);

    emitterMat.emissiveIntensity = 0.18 + feldStaerke * (1.15 + flimmern * 0.45);
    prismMat.opacity = 0.02 + feldStaerke * 0.24 * flimmern;
    prismMat.emissiveIntensity = 0.25 + feldStaerke * 1.5;

    fieldMat.opacity = feldStaerke * 0.10 * flimmern;
    fieldMat.emissiveIntensity = 0.12 + feldStaerke * 1.3;

    haloMaterials.forEach((material, i) => {
      material.opacity = feldStaerke * (0.18 + 0.10 * Math.sin(zeit * 3.2 + i)) * flimmern;
      material.emissiveIntensity = 0.35 + feldStaerke * (1.3 + i * 0.15);
    });

    ringGroups.forEach((group, i) => {
      group.rotation.y += d * group.userData.richtung * (0.42 + i * 0.28) * (0.2 + feldStaerke);
      const s = 1 + feldStaerke * 0.025 * Math.sin(zeit * 4.2 + i);
      group.scale.setScalar(s);
    });

    prismCore.rotation.y += d * 0.9;
    prismCore.rotation.x += d * 0.38;
    prismCore.scale.setScalar(
      0.84 + feldStaerke * 0.24 + Math.sin(zeit * 5) * 0.035
    );

    screenMat.emissiveIntensity =
      0.42 + feldStaerke * 0.65 + Math.sin(zeit * 3.5) * 0.07;

    warningMat.emissiveIntensity =
      energie < 15
        ? 0.5 + 2.0 * Math.max(0, Math.sin(zeit * 6.5))
        : 0.28;

    lamp.userData.intensity = 6.5 + feldStaerke * 2.0;

    bildTimer += d;
    if (bildTimer >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      bildTimer = 0;
      drawScreen();
    }
  }

  emitter.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(now - letzte);
    letzte = now;
  };

  // Direkte Aktualisierung durch das Spiel ebenfalls ermöglichen.
  root.userData.update = update;

  drawScreen();

  // ------------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // ------------------------------------------------------------
  root.userData.api = {
    einschalten,
    ausschalten,
    umschalten,
    get aktiv() { return aktiv; },
    get feldStaerke() { return feldStaerke; },
    get energie() { return energie; },
    get energieProzent() { return energie; },
    get verbrauchProzentProSekunde() { return aktiv ? 0.9 : 0; },
    get ladezustand() {
      if (aktiv) return 'Tarnfeld aktiv';
      if (energie < 15) return 'Energie kritisch';
      return 'Tarnfeld deaktiviert';
    }
  };

  root.userData.actions = [
    {
      id: 'tarnfeld_ein',
      label: 'Tarnfeld aktivieren – Verbrauch 0,9 %/s',
      run: () => root.userData.api.einschalten()
    },
    {
      id: 'tarnfeld_aus',
      label: 'Tarnfeld deaktivieren – Energie lädt mit 0,25 %/s',
      run: () => root.userData.api.ausschalten()
    },
    {
      id: 'tarnfeld_umschalten',
      label: 'Tarnmodus umschalten',
      run: () => root.userData.api.umschalten()
    }
  ];

  return root;
}

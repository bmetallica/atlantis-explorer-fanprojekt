import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'sensor_display',
  art: 'Standobjekt',
  masse: '1,20 × 2,03 × 0,46 (B × H × T, m)',
  benutzen: 'INT_bedienen → Sensoransichten und Umgebungsscan',
  lichter: 'LAMP_display (eisblau)',
  animation: 'Animierte Canvas-Sensorkarte, wechselnde Schichten, Radar-Sweep, Datenfluss und pulsierende Sensorkontakte',
  quelle: 'selbst gebaut nach Ancient Sensor Display / Supplemental View Screens',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'sensor_display';

  // --- Materialien
  const darkMetal = kit('wallDark');
  const pearl = kit('pillar');
  const hull = kit('hull');
  const bronze = kit('copper');

  const blackGlass = new THREE.MeshStandardMaterial({
    name: 'sensor_black_glass',
    color: 0x02070c,
    metalness: 0.38,
    roughness: 0.22,
  });

  const glowMaterial = new THREE.MeshStandardMaterial({
    name: 'ancient_display_glow',
    color: 0x82eaff,
    emissive: 0x45dfff,
    emissiveIntensity: 1.25,
    metalness: 0.12,
    roughness: 0.34,
  });

  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'ancient_display_amber',
    color: 0xffb34f,
    emissive: 0xff8b22,
    emissiveIntensity: 1.15,
    metalness: 0.08,
    roughness: 0.38,
  });

  const box = (width, height, depth, material, x, y, z, name = '') => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // --- Hauptgehäuse: Vorderseite nach +Z
  const housing = box(1.2, 1.45, 0.16, darkMetal, 0, 1.305, 0);

  // Geschlossene Rückseite mit Wartungsblende, Rückenskelett und Kühlrippen
  box(0.94, 1.22, 0.026, hull, 0, 1.34, -0.092);
  box(0.19, 1.2, 0.045, darkMetal, 0, 1.33, -0.112);
  box(0.12, 0.74, 0.065, bronze, 0, 1.34, -0.137);

  const ribGeometry = new THREE.BoxGeometry(0.64, 0.018, 0.026);
  const rearRibs = new THREE.InstancedMesh(ribGeometry, darkMetal, 7);
  const ribMatrix = new THREE.Matrix4();
  for (let i = 0; i < 7; i++) {
    ribMatrix.makeTranslation(0, 0.84 + i * 0.17, -0.121);
    rearRibs.setMatrixAt(i, ribMatrix);
  }
  rearRibs.instanceMatrix.needsUpdate = true;
  root.add(rearRibs);

  const ventGeometry = new THREE.BoxGeometry(0.46, 0.012, 0.018);
  const rearVents = new THREE.InstancedMesh(ventGeometry, bronze, 5);
  const ventMatrix = new THREE.Matrix4();
  for (let i = 0; i < 5; i++) {
    ventMatrix.makeTranslation(0, 0.96 + i * 0.055, -0.143);
    rearVents.setMatrixAt(i, ventMatrix);
  }
  rearVents.instanceMatrix.needsUpdate = true;
  root.add(rearVents);

  // Schmaler, dunkler Anzeigebackground hinter dem holografischen Sensorbild
  box(0.965, 1.255, 0.018, blackGlass, 0, 1.36, 0.088);

  // --- Schlanker Ancient-Rahmen
  const leftFrame = box(0.105, 1.34, 0.205, pearl, -0.5475, 1.31, 0.012);
  const rightFrame = box(0.105, 1.34, 0.205, pearl, 0.5475, 1.31, 0.012);

  box(1.09, 0.075, 0.205, pearl, 0, 1.9925, 0.012);
  box(1.09, 0.2, 0.205, darkMetal, 0, 0.68, 0.012);

  // Bronze-Kanten und Ancient-Akzente
  box(0.016, 1.42, 0.215, bronze, -0.587, 1.30, 0.016);
  box(0.016, 1.42, 0.215, bronze, 0.587, 1.30, 0.016);
  box(1.05, 0.018, 0.215, bronze, 0, 2.027, 0.016);
  box(1.05, 0.018, 0.215, bronze, 0, 0.787, 0.016);

  const centerPlate = box(0.17, 0.085, 0.025, bronze, 0, 0.68, 0.122);
  for (let i = 0; i < 3; i++) {
    box(0.022, 0.045, 0.009, pearl, -0.045 + i * 0.045, 0.68, 0.139);
  }

  // Eisblaue Leuchtlinien innerhalb des Rahmens
  box(0.92, 0.012, 0.012, glowMaterial, 0, 1.947, 0.104);
  box(0.92, 0.009, 0.012, glowMaterial, 0, 0.772, 0.108);
  box(0.009, 1.17, 0.012, glowMaterial, -0.491, 1.36, 0.104);
  box(0.009, 1.17, 0.012, glowMaterial, 0.491, 1.36, 0.104);

  // Kleine bernsteinfarbene Betriebsanzeige
  box(0.055, 0.012, 0.012, amberGlow, 0.47, 0.772, 0.108);

  // --- Ständer und sechseckiger Standfuß
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.43, 0.075, 6),
    darkMetal
  );
  base.position.set(0, 0.0375, -0.015);
  base.rotation.y = Math.PI / 6;
  root.add(base);

  const baseInset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.32, 0.014, 6),
    blackGlass
  );
  baseInset.position.set(0, 0.082, -0.015);
  baseInset.rotation.y = Math.PI / 6;
  root.add(baseInset);

  const post = box(0.16, 0.48, 0.16, darkMetal, 0, 0.32, -0.015);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.08, 24),
    bronze
  );
  collar.position.set(0, 0.54, -0.012);
  root.add(collar);

  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.113, 0.009, 8, 32),
    bronze
  );
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(0, 0.555, -0.012);
  root.add(collarRing);

  box(0.025, 0.29, 0.012, glowMaterial, 0, 0.31, 0.072);

  // Rückseitige Stabilisierungsstreben zwischen Ständer und Gehäuse
  for (const x of [-0.19, 0.19]) {
    const brace = box(0.025, 0.31, 0.035, bronze, x, 0.43, -0.105);
    brace.rotation.z = x < 0 ? -0.34 : 0.34;
  }

  // --- Dynamische Canvas-Texturen
  function createCanvasTexture(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, ctx, texture };
  }

  const sensor = createCanvasTexture(768, 1024);
  const auxiliaryLeft = createCanvasTexture(512, 288);
  const auxiliaryRight = createCanvasTexture(512, 288);

  const sensorMaterial = new THREE.MeshBasicMaterial({
    name: 'ancient_sensor_hologram',
    map: sensor.texture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
  });

  const sensorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.2),
    sensorMaterial
  );
  sensorScreen.position.set(0, 1.36, 0.106);
  root.add(sensorScreen);

  const auxiliaryMaterialLeft = new THREE.MeshBasicMaterial({
    name: 'expedition_view_left',
    map: auxiliaryLeft.texture,
    toneMapped: false,
  });

  const auxiliaryMaterialRight = new THREE.MeshBasicMaterial({
    name: 'expedition_view_right',
    map: auxiliaryRight.texture,
    toneMapped: false,
  });

  // --- Zwei schwarze irdische Supplemental View Screens
  const auxiliaryData = [
    { x: -0.285, material: auxiliaryMaterialLeft, texture: auxiliaryLeft },
    { x: 0.285, material: auxiliaryMaterialRight, texture: auxiliaryRight },
  ];

  for (const data of auxiliaryData) {
    const monitorHousing = box(
      0.37,
      0.165,
      0.052,
      blackGlass,
      data.x,
      0.677,
      0.122
    );

    const monitor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.335, 0.142),
      data.material
    );
    monitor.position.set(data.x, 0.681, 0.151);
    root.add(monitor);

    box(0.355, 0.009, 0.012, bronze, data.x, 0.599, 0.152);
    box(0.012, 0.012, 0.012, amberGlow, data.x + 0.16, 0.744, 0.153);

    // Kleine Halterungen unter den Supplemental Monitors
    for (const dx of [-0.115, 0.115]) {
      box(0.018, 0.048, 0.028, darkMetal, data.x + dx, 0.585, 0.108);
    }
  }

  // --- Zeichenhilfen
  function strokePolyline(ctx, points, color, width = 1) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawPanel(ctx, x, y, w, h, title, accent = '#6fe3ff') {
    ctx.fillStyle = 'rgba(2, 14, 24, 0.84)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(111, 227, 255, 0.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, w, 28);
    ctx.fillStyle = '#d8f7ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 20);
  }

  function drawGrid(ctx, x, y, w, h, spacing = 32) {
    ctx.strokeStyle = 'rgba(69, 151, 185, 0.16)';
    ctx.lineWidth = 1;
    for (let gx = x; gx <= x + w; gx += spacing) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y; gy <= y + h; gy += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
  }

  function drawStatusPanel(ctx, time) {
    drawPanel(ctx, 538, 158, 198, 570, 'SYSTEM STATUS');

    const rows = [
      ['CITY CORE', 'ONLINE', '#73efb0'],
      ['LIFE SIGNS', '3,842', '#6fe3ff'],
      ['GATE ALPHA', 'SEALED', '#ffad42'],
      ['GATE BETA', 'OPEN', '#73efb0'],
      ['ENERGY', '87%', '#6fe3ff'],
      ['ARRAY', 'ACTIVE', '#73efb0'],
    ];

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    let sy = 214;

    for (const [label, value, color] of rows) {
      ctx.fillStyle = '#75a9bd';
      ctx.fillText(label, 554, sy);
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(value, 720, sy);
      ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(100, 180, 205, 0.28)';
      ctx.beginPath();
      ctx.moveTo(554, sy + 12);
      ctx.lineTo(720, sy + 12);
      ctx.stroke();
      sy += 50;
    }

    ctx.fillStyle = '#d8f7ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SENSOR CONTACTS', 554, 534);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffad42';
    ctx.fillText('> UNKNOWN CLASS', 554, 562);
    ctx.fillStyle = '#88b7c8';
    ctx.fillText('  BEARING 074.2', 554, 584);
    ctx.fillText('  DISTANCE  8.4 KM', 554, 606);
    ctx.fillStyle = '#ff7748';
    ctx.fillText('> WRAITH CLASS 2', 554, 640);
    ctx.fillStyle = '#88b7c8';
    ctx.fillText('  BEARING 221.8', 554, 662);
    ctx.fillText('  ETA       04:17', 554, 684);

    const signal = 0.55 + 0.45 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(255, 173, 66, ${signal.toFixed(3)})`;
    ctx.fillRect(554, 698, 166, 4);
  }

  function drawCityView(ctx, time) {
    drawPanel(ctx, 32, 158, 486, 570, 'ATLANTIS SECTOR MAP');
    drawGrid(ctx, 32, 186, 486, 542, 34);

    const cx = 275;
    const cy = 446;

    ctx.save();
    ctx.translate(cx, cy);

    for (const radius of [78, 145, 218]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(91, 206, 242, 0.38)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 38, Math.sin(angle) * 38);
      ctx.lineTo(Math.cos(angle) * 218, Math.sin(angle) * 218);
      ctx.strokeStyle = 'rgba(76, 174, 210, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const sweep = time * 0.7;
    const sweepGradient = ctx.createLinearGradient(
      0,
      0,
      Math.cos(sweep) * 220,
      Math.sin(sweep) * 220
    );
    sweepGradient.addColorStop(0, 'rgba(111, 227, 255, 0.78)');
    sweepGradient.addColorStop(1, 'rgba(111, 227, 255, 0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweep) * 220, Math.sin(sweep) * 220);
    ctx.strokeStyle = sweepGradient;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#e9fbff';
    ctx.beginPath();
    ctx.moveTo(-16, 42);
    ctx.lineTo(0, -62);
    ctx.lineTo(16, 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5edaff';
    ctx.fillRect(-24, 38, 48, 12);
    ctx.restore();

    const buildings = [
      [-124, -92, 48, 28], [-78, -158, 65, 30], [24, -170, 75, 30],
      [118, -116, 54, 28], [152, -35, 35, 62], [132, 94, 60, 32],
      [55, 136, 86, 28], [-68, 142, 74, 30], [-165, 64, 44, 58],
      [-44, -62, 38, 24], [48, -48, 42, 25], [46, 72, 50, 25],
    ];

    for (let i = 0; i < buildings.length; i++) {
      const [x, y, bw, bh] = buildings[i];
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 173, 70, 0.72)' : 'rgba(111, 227, 255, 0.62)';
      ctx.fillRect(cx + x - bw / 2, cy + y - bh / 2, bw, bh);
      ctx.strokeStyle = 'rgba(220, 250, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + x - bw / 2, cy + y - bh / 2, bw, bh);
    }

    const contacts = [
      { x: 402, y: 252, color: '#ffad42', phase: 0.8 },
      { x: 139, y: 302, color: '#ff7448', phase: 1.4 },
      { x: 405, y: 584, color: '#6fe3ff', phase: 2.1 },
    ];

    for (const contact of contacts) {
      const pulse = 0.55 + 0.45 * Math.sin(time * 4 + contact.phase);
      ctx.strokeStyle = contact.color;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, 10 + pulse * 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = contact.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#d8f7ff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOWER GRID / 12 SECTORS NOMINAL', 48, 704);
  }

  function drawEnergyView(ctx, time) {
    drawPanel(ctx, 32, 158, 486, 570, 'ENERGY DISTRIBUTION');
    drawGrid(ctx, 32, 186, 486, 542, 34);

    const nodes = [
      { x: 275, y: 248, label: 'REACTOR', level: 0.96 },
      { x: 135, y: 378, label: 'CITY GRID', level: 0.78 },
      { x: 415, y: 378, label: 'GATE ARRAY', level: 0.83 },
      { x: 95, y: 565, label: 'SECTOR 04', level: 0.66 },
      { x: 275, y: 615, label: 'CITY CORE', level: 0.91 },
      { x: 455, y: 565, label: 'SENSOR ARRAY', level: 0.72 },
    ];

    const links = [
      [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [4, 5],
    ];

    for (const [from, to] of links) {
      const a = nodes[from];
      const b = nodes[to];
      ctx.strokeStyle = 'rgba(74, 184, 218, 0.42)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const progress = (time * 0.22 + from * 0.13) % 1;
      const px = a.x + (b.x - a.x) * progress;
      const py = a.y + (b.y - a.y) * progress;
      ctx.fillStyle = '#8cecff';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const pulse = 0.82 + 0.18 * Math.sin(time * 3 + i);
      ctx.strokeStyle = i === 0 ? '#ffad42' : '#6fe3ff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = i === 0 ? 'rgba(255, 173, 70, 0.8)' : 'rgba(111, 227, 255, 0.65)';
      ctx.fillRect(node.x - 12, node.y - 12, 24, 24);
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#d8f7ff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 39);
      ctx.fillStyle = '#75a9bd';
      ctx.fillText(`${Math.round(node.level * 100)}%`, node.x, node.y + 54);
    }

    ctx.fillStyle = '#d8f7ff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('REACTOR OUTPUT / 42.8 TW', 48, 704);
  }

  function drawContactView(ctx, time) {
    drawPanel(ctx, 32, 158, 486, 570, 'LONG-RANGE CONTACTS');
    drawGrid(ctx, 32, 186, 486, 542, 34);

    const cx = 275;
    const cy = 442;

    ctx.save();
    ctx.translate(cx, cy);

    for (const radius of [55, 110, 165, 220]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(85, 202, 236, 0.34)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 220, Math.sin(angle) * 220);
      ctx.strokeStyle = 'rgba(76, 174, 210, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const sweep = -time * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweep) * 220, Math.sin(sweep) * 220);
    ctx.strokeStyle = '#79e8ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    const blips = [
      { x: 380, y: 327, color: '#ffad42', label: 'UNKNOWN', size: 11 },
      { x: 162, y: 490, color: '#ff7048', label: 'WRAITH', size: 14 },
      { x: 410, y: 540, color: '#6fe3ff', label: 'DEEP SPACE', size: 8 },
    ];

    for (let i = 0; i < blips.length; i++) {
      const blip = blips[i];
      const pulse = 0.5 + 0.5 * Math.sin(time * 4.5 + i);
      ctx.strokeStyle = blip.color;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(blip.x, blip.y, blip.size + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = blip.color;
      ctx.fillRect(blip.x - 3, blip.y - 3, 6, 6);
      ctx.fillStyle = '#d8f7ff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(blip.label, blip.x + 12, blip.y + 4);
    }

    ctx.fillStyle = '#d8f7ff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('3 CONTACTS / 1 HOSTILE', 48, 704);
  }

  function drawSummary(ctx, time, mode) {
    drawPanel(ctx, 32, 748, 704, 142, 'SYSTEM SUMMARY');

    const energy = [0.92, 0.76, 0.88, 0.64, 0.83, 0.71, 0.95, 0.69];

    for (let i = 0; i < energy.length; i++) {
      const x = 54 + i * 84;
      ctx.fillStyle = 'rgba(48, 83, 100, 0.65)';
      ctx.fillRect(x, 802, 54, 58);
      const barHeight = 58 * energy[i] * (0.92 + 0.08 * Math.sin(time * 2 + i));
      ctx.fillStyle = i === 6 ? '#ffad42' : '#6fe3ff';
      ctx.fillRect(x + 4, 860 - barHeight, 46, barHeight);
      ctx.fillStyle = '#ccefff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1).padStart(2, '0'), x + 27, 882);
    }

    ctx.fillStyle = '#6fe3ff';
    ctx.fillRect(32, 912, 704, 3);
    ctx.fillStyle = '#bdefff';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ANCIENT SYSTEMS ONLINE / ${mode.toUpperCase()}`, 40, 952);

    ctx.fillStyle = '#ffad42';
    ctx.textAlign = 'right';
    ctx.fillText('LONG-RANGE ARRAY: ACTIVE', 720, 952);

    ctx.fillStyle = '#65a9bf';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SGC LINK / QUANTUM RELAY / NO ANOMALIES', 40, 984);
  }

  function drawSensorCanvas(ctx, time, mode, scanAge) {
    const w = 768;
    const h = 1024;
    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, 'rgba(0, 18, 36, 0.96)');
    gradient.addColorStop(0.55, 'rgba(0, 8, 22, 0.92)');
    gradient.addColorStop(1, 'rgba(0, 25, 38, 0.96)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, w - 30, h - 30);

    ctx.fillStyle = '#7ceaff';
    ctx.fillRect(18, 18, w - 36, 58);
    ctx.fillStyle = '#02101d';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ATLANTIS // SENSOR NETWORK', 34, 55);

    ctx.textAlign = 'right';
    ctx.fillText('LIVE', w - 36, 55);
    ctx.textAlign = 'left';

    const tabs = [
      ['stadt', 'STADTNETZ'],
      ['energie', 'ENERGIE'],
      ['kontakte', 'KONTAKTE'],
    ];

    let tabX = 32;
    for (const [id, label] of tabs) {
      const active = mode === id;
      ctx.fillStyle = active ? 'rgba(111, 227, 255, 0.34)' : 'rgba(0, 20, 35, 0.9)';
      ctx.fillRect(tabX, 94, 220, 44);
      ctx.strokeStyle = active ? '#8cecff' : 'rgba(111, 227, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tabX, 94, 220, 44);
      ctx.fillStyle = active ? '#ffffff' : '#67b8d2';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, tabX + 110, 122);
      tabX += 236;
    }

    if (mode === 'energie') drawEnergyView(ctx, time);
    else if (mode === 'kontakte') drawContactView(ctx, time);
    else drawCityView(ctx, time);

    drawStatusPanel(ctx, time);
    drawSummary(ctx, time, mode);

    if (scanAge >= 0 && scanAge < 2.6) {
      const progress = scanAge / 2.6;
      ctx.strokeStyle = `rgba(255, 173, 66, ${1 - progress})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(275, 446, 40 + progress * 260, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 220, 160, ${1 - progress})`;
      ctx.font = 'bold 23px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENVIRONMENTAL SCAN', 275, 186);
    }
  }

  function drawAuxiliaryCanvas(ctx, time, phase, title, target) {
    const w = 512;
    const h = 288;

    ctx.fillStyle = '#020609';
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, 0, 32, w, h - 32, 32);

    ctx.fillStyle = '#6fe3ff';
    ctx.fillRect(0, 0, w, 32);
    ctx.fillStyle = '#021019';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, 12, 22);

    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 52, 280, 190);

    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      ctx.ellipse(160, 147, ring * 34, ring * 24, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(111, 227, 255, ${0.75 - ring * 0.12})`;
      ctx.stroke();
    }

    const contour = [
      [55, 116], [82, 92], [121, 101], [143, 78], [183, 87],
      [214, 118], [247, 111], [270, 148], [242, 176], [205, 166],
      [183, 195], [143, 183], [113, 206], [74, 182], [55, 148],
    ];
    strokePolyline(ctx, contour, '#8cecff', 2);

    const targetX = 160 + Math.sin(time * 0.7 + phase) * 55;
    const targetY = 143 + Math.cos(time * 0.55 + phase) * 42;
    ctx.strokeStyle = '#ff9e42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(targetX - 22, targetY);
    ctx.lineTo(targetX + 22, targetY);
    ctx.moveTo(targetX, targetY - 22);
    ctx.lineTo(targetX, targetY + 22);
    ctx.stroke();

    ctx.fillStyle = '#b9eaff';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(target, 322, 78);
    ctx.fillStyle = '#6c9bad';
    ctx.fillText('RANGE  08.4 KM', 322, 108);
    ctx.fillText('BEARING 074.2', 322, 132);
    ctx.fillText('SIGNAL  67%', 322, 156);
    ctx.fillStyle = Math.sin(time * 5) > 0 ? '#ff9e42' : '#744725';
    ctx.fillText('CONTACT TRACKED', 322, 202);

    const scanY = ((time * 38 + phase * 90) % (h + 50)) - 25;
    ctx.fillStyle = 'rgba(111, 227, 255, 0.12)';
    ctx.fillRect(0, scanY, w, 3);
  }

  // --- Kollisionskörper
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });

  const mainCollision = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.45, 0.22),
    collisionMaterial
  );
  mainCollision.name = 'COL_hauptgehaeuse';
  mainCollision.position.set(0, 1.305, 0.01);
  root.add(mainCollision);

  const postCollision = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.49, 0.17),
    collisionMaterial
  );
  postCollision.name = 'COL_staender';
  postCollision.position.set(0, 0.325, -0.015);
  root.add(postCollision);

  const baseCollision = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.075, 6),
    collisionMaterial
  );
  baseCollision.name = 'COL_standfuss';
  baseCollision.position.set(0, 0.0375, -0.015);
  baseCollision.rotation.y = Math.PI / 6;
  root.add(baseCollision);

  // --- Benutzen-Punkt
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_bedienen';
  usePoint.position.set(0, 1.28, 0.82);
  usePoint.userData = {
    label: 'Ancient Sensor Display bedienen',
    radius: 0.8,
  };
  root.add(usePoint);

  // --- Dauerhaft eingeschaltetes Licht
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_display';
  lamp.position.set(0, 1.38, 0.42);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  root.add(lamp);

  // --- Zustand und Animation
  let mode = opts.mode && ['stadt', 'energie', 'kontakte'].includes(opts.mode)
    ? opts.mode
    : 'stadt';
  let time = 0;
  let lastTime = null;
  let lastCanvasUpdate = -1;
  let scanStart = -100;

  function update(dt) {
    time += Math.min(0.1, Math.max(0, dt));
    const scanAge = time - scanStart;

    glowMaterial.emissiveIntensity =
      1.15 + 0.3 * Math.sin(time * 2.2) + (scanAge >= 0 && scanAge < 2.6 ? 0.9 : 0);

    amberGlow.emissiveIntensity =
      1.0 + 0.55 * Math.max(0, Math.sin(time * 3.1));

    if (time - lastCanvasUpdate >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      lastCanvasUpdate = time;

      drawSensorCanvas(sensor.ctx, time, mode, scanAge);
      sensor.texture.needsUpdate = true;

      drawAuxiliaryCanvas(
        auxiliaryLeft.ctx,
        time,
        0.4,
        'SUPPLEMENTAL VIEW / SECTOR 04',
        'UNKNOWN CONTACT'
      );
      auxiliaryLeft.texture.needsUpdate = true;

      drawAuxiliaryCanvas(
        auxiliaryRight.ctx,
        time,
        2.1,
        'SUPPLEMENTAL VIEW / DEEP SPACE',
        'CLASS 2 SIGNATURE'
      );
      auxiliaryRight.texture.needsUpdate = true;
    }
  }

  sensorScreen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime === null) lastTime = now;
    const dt = Math.min(0.1, Math.max(0, now - lastTime));
    lastTime = now;
    update(dt);
  };

  root.userData.update = update;

  const api = {
    setMode(nextMode) {
      if (['stadt', 'energie', 'kontakte'].includes(nextMode)) {
        mode = nextMode;
        lastCanvasUpdate = -1;
      }
    },
    nextMode() {
      const modes = ['stadt', 'energie', 'kontakte'];
      mode = modes[(modes.indexOf(mode) + 1) % modes.length];
      lastCanvasUpdate = -1;
    },
    scan() {
      scanStart = time;
    },
    get mode() {
      return mode;
    },
    get scanning() {
      return time - scanStart < 2.6;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'ansicht-stadt',
      label: 'Sensoransicht: Stadtnetz',
      run: () => api.setMode('stadt'),
    },
    {
      id: 'ansicht-energie',
      label: 'Sensoransicht: Energieverteilung',
      run: () => api.setMode('energie'),
    },
    {
      id: 'ansicht-kontakte',
      label: 'Sensoransicht: Sensorkontakte',
      run: () => api.setMode('kontakte'),
    },
    {
      id: 'umgebungsscan',
      label: 'Umgebungsscan auslösen',
      run: () => api.scan(),
    },
  ];

  return root;
}

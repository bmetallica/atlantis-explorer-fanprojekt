import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

function roundedRectShape(width, depth, radius) {
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(radius, w, d);
  const shape = new THREE.Shape();

  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);
  shape.closePath();
  return shape;
}

function roundedSlabGeometry(width, depth, height, radius) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, depth, radius), {
    depth: height,
    bevelEnabled: false,
    curveSegments: 5,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function taperedBoxGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height) {
  const geometry = new THREE.BufferGeometry();
  const hw0 = bottomWidth / 2;
  const hd0 = bottomDepth / 2;
  const hw1 = topWidth / 2;
  const hd1 = topDepth / 2;
  const hy = height / 2;

  const vertices = new Float32Array([
    -hw0, -hy, -hd0,
     hw0, -hy, -hd0,
     hw0, -hy,  hd0,
    -hw0, -hy,  hd0,
    -hw1,  hy, -hd1,
     hw1,  hy, -hd1,
     hw1,  hy,  hd1,
    -hw1,  hy,  hd1,
  ]);

  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    3, 2, 6, 3, 6, 7,
    0, 4, 5, 0, 5, 1,
    0, 3, 7, 0, 7, 4,
    1, 5, 6, 1, 6, 2,
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeAncientDisplayTexture(rows, seed = 1, vertical = false) {
  const canvas = document.createElement('canvas');
  canvas.width = vertical ? 512 : 512;
  canvas.height = vertical ? 128 : 320;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  const background = ctx.createLinearGradient(0, 0, 0, h);
  background.addColorStop(0, '#351407');
  background.addColorStop(0.48, '#160904');
  background.addColorStop(1, '#441707');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 104, 25, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 16; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, h - 8);
    ctx.stroke();
  }
  for (let y = 16; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.lineTo(w - 8, y);
    ctx.stroke();
  }

  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const glyph = (x, y, size) => {
    const points = [
      [0.04, 0.78], [0.25, 0.03], [0.48, 0.54],
      [0.66, 0.09], [0.94, 0.76],
    ];
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      const gx = x + px * size;
      const gy = y + py * size;
      if (index === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    });
    ctx.stroke();

    if (random() > 0.25) {
      ctx.beginPath();
      ctx.moveTo(x + size * 0.48, y + size * 0.54);
      ctx.lineTo(x + size * 0.48, y + size * 0.96);
      ctx.stroke();
    }
    if (random() > 0.48) {
      ctx.beginPath();
      ctx.moveTo(x + size * 0.25, y + size * 0.03);
      ctx.lineTo(x + size * 0.83, y + size * 0.30);
      ctx.stroke();
    }
    if (random() > 0.68) {
      ctx.beginPath();
      ctx.arc(x + size * 0.66, y + size * 0.09, size * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  ctx.strokeStyle = '#ff9b3d';
  ctx.fillStyle = '#ffb35a';
  ctx.lineWidth = vertical ? 2.5 : 3;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.beginPath();
  ctx.moveTo(20, h - 18);
  ctx.lineTo(w - 20, h - 18);
  ctx.stroke();

  const rowCount = Math.max(1, rows);
  const usableHeight = h - 54;
  for (let row = 0; row < rowCount; row++) {
    const count = vertical ? 24 : 11 + Math.floor(random() * 4);
    const gap = (w - 50) / count;
    const y = vertical
      ? 24
      : 25 + row * (usableHeight / Math.max(1, rowCount - 1 || 1));

    for (let column = 0; column < count; column++) {
      const x = 26 + column * gap + random() * 3;
      const size = vertical
        ? 10 + random() * 10
        : 16 + random() * 15;
      glyph(x, y, size);
    }
  }

  for (let i = 0; i < 16; i++) {
    ctx.fillRect(24 + i * 29, h - 12, 17, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export const steckbrief = {
  name: 'sensor_console',
  art: 'Standobjekt',
  masse: '1,40 × 0,95 × 0,80 (B × H × T, m)',
  wohin: 'ATL-002 – Kontrollraum / Kommandozentrale',
  benutzen: 'INT_bedienen → Menü mit Ein/Aus, Reichweitenwahl und Langstreckenscan',
  lichter: 'LAMP_display (eisblau), LAMP_indicator (bernstein)',
  animation: 'Radar-Sweep, pulsierende Tasten, laufender Scan mit Kontaktmarken und Fortschrittsanzeige',
  quelle: 'selbst gebaut nach OBJ-012',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'sensor_console';

  const copper = kit('copper');
  const darkMetal = kit('wallDark');
  const pearl = kit('pillar');

  const bronzeMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_dark_bronze',
    color: 0x63391f,
    metalness: 0.78,
    roughness: 0.38,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_glass',
    color: 0x102b36,
    emissive: 0x123e4c,
    emissiveIntensity: 0.55,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });

  const blueGlow = new THREE.MeshStandardMaterial({
    name: 'sensor_blue_glow',
    color: 0x8cecff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.4,
    metalness: 0.1,
    roughness: 0.25,
  });

  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'sensor_amber_glow',
    color: 0xffc36b,
    emissive: 0xffa33c,
    emissiveIntensity: 1.2,
    metalness: 0.1,
    roughness: 0.3,
  });

  const darkIndicator = new THREE.MeshStandardMaterial({
    name: 'sensor_dark_indicator',
    color: 0x241009,
    emissive: 0xff6b1a,
    emissiveIntensity: 0.25,
    roughness: 0.45,
    metalness: 0.25,
  });

  const circuitMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_circuit',
    color: 0x7bcbd8,
    emissive: 0x4bb8cc,
    emissiveIntensity: 0.65,
    metalness: 0.4,
    roughness: 0.35,
  });

  // --- Sockel
  const plinth = new THREE.Mesh(
    roundedSlabGeometry(1.20, 0.62, 0.10, 0.07),
    copper
  );
  plinth.position.y = 0;
  root.add(plinth);

  const plinthInset = new THREE.Mesh(
    roundedSlabGeometry(1.08, 0.51, 0.012, 0.045),
    darkMetal
  );
  plinthInset.position.y = 0.098;
  root.add(plinthInset);

  // Konischer, geschlossener Unterbau; Vorderseite liegt bei +Z.
  const pedestal = new THREE.Mesh(
    taperedBoxGeometry(0.86, 0.42, 1.00, 0.36, 0.58),
    bronzeMaterial
  );
  pedestal.position.set(0, 0.39, -0.06);
  root.add(pedestal);

  const pedestalTop = new THREE.Mesh(
    roundedSlabGeometry(1.02, 0.38, 0.035, 0.045),
    copper
  );
  pedestalTop.position.set(0, 0.662, -0.06);
  root.add(pedestalTop);

  // Hintere Stütze verbindet Unterbau und schräge Oberseite.
  const rearSupport = new THREE.Mesh(
    taperedBoxGeometry(0.94, 0.18, 0.86, 0.15, 0.22),
    darkMetal
  );
  rearSupport.position.set(0, 0.69, -0.205);
  root.add(rearSupport);

  // Seitliche Bronzeverstrebungen.
  for (const x of [-0.44, 0.44]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.27), copper);
    brace.position.set(x, 0.40, -0.055);
    brace.rotation.x = -0.08;
    root.add(brace);
  }

  // Frontale Anzeige des Unterbaus.
  const fasciaFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.25, 0.025), copper);
  fasciaFrame.position.set(0, 0.39, 0.175);
  root.add(fasciaFrame);

  const fasciaTexture = makeAncientDisplayTexture(1, 409, true);
  const fasciaMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_front_fascia',
    color: 0xffffff,
    map: fasciaTexture,
    emissive: 0xff6818,
    emissiveMap: fasciaTexture,
    emissiveIntensity: 0.8,
    metalness: 0.1,
    roughness: 0.4,
  });

  const fascia = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.19), fasciaMaterial);
  fascia.position.set(0, 0.39, 0.189);
  root.add(fascia);

  const fasciaDivider = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.018, 0.012), copper);
  fasciaDivider.position.set(0, 0.285, 0.193);
  root.add(fasciaDivider);

  // --- Schräge Bedienfläche, vollständig in X/Z aufgebaut.
  const deck = new THREE.Group();
  deck.position.set(0, 0.67, -0.02);
  deck.rotation.x = 0.40;
  root.add(deck);

  const housing = new THREE.Mesh(
    roundedSlabGeometry(1.40, 0.68, 0.09, 0.065),
    copper
  );
  housing.name = 'sensor_deck_housing';
  deck.add(housing);

  const topInset = new THREE.Mesh(
    roundedSlabGeometry(1.30, 0.58, 0.012, 0.04),
    darkMetal
  );
  topInset.position.y = 0.09;
  deck.add(topInset);

  // Schmale Perl- und Bronzeleisten.
  const rimLongGeometry = new THREE.BoxGeometry(0.03, 0.035, 0.64);
  const rimShortGeometry = new THREE.BoxGeometry(1.34, 0.035, 0.03);

  for (const x of [-0.685, 0.685]) {
    const rim = new THREE.Mesh(rimLongGeometry, pearl);
    rim.position.set(x, 0.098, 0);
    deck.add(rim);
  }
  for (const z of [-0.325, 0.325]) {
    const rim = new THREE.Mesh(rimShortGeometry, pearl);
    rim.position.set(0, 0.098, z);
    deck.add(rim);
  }

  // Erhöhte hintere Blende als optischer Abschluss.
  const rearBezel = new THREE.Mesh(new THREE.BoxGeometry(1.27, 0.07, 0.045), copper);
  rearBezel.position.set(0, 0.135, -0.312);
  deck.add(rearBezel);

  // --- Linkes Glasfeld: Radar und Schaltkreise.
  const radarFrame = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.022, 0.44), copper);
  radarFrame.position.set(-0.34, 0.099, -0.05);
  deck.add(radarFrame);

  const radarGlass = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.012, 0.40), glassMaterial);
  radarGlass.position.set(-0.34, 0.112, -0.05);
  radarGlass.renderOrder = 1;
  deck.add(radarGlass);

  const circuitPaths = [
    [[-0.60, -0.20], [-0.48, -0.20]],
    [[-0.48, -0.20], [-0.48, -0.10]],
    [[-0.48, -0.10], [-0.31, -0.10]],
    [[-0.31, -0.10], [-0.31, 0.01]],
    [[-0.31, 0.01], [-0.17, 0.01]],
    [[-0.17, 0.01], [-0.17, 0.11]],
    [[-0.60, 0.12], [-0.45, 0.12]],
    [[-0.45, 0.12], [-0.45, 0.02]],
    [[-0.45, 0.02], [-0.54, 0.02]],
    [[-0.21, -0.20], [-0.21, -0.13]],
    [[-0.21, -0.13], [-0.10, -0.13]],
    [[-0.10, -0.13], [-0.10, -0.03]],
    [[-0.10, -0.03], [-0.19, -0.03]],
    [[-0.39, -0.23], [-0.39, -0.15]],
    [[-0.39, -0.15], [-0.27, -0.15]],
    [[-0.59, 0.03], [-0.52, 0.03]],
    [[-0.52, 0.03], [-0.52, -0.08]],
    [[-0.52, -0.08], [-0.41, -0.08]],
  ];

  for (const [[x1, z1], [x2, z2]] of circuitPaths) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const line = new THREE.Mesh(new THREE.BoxGeometry(length, 0.005, 0.009), circuitMaterial);
    line.position.set((x1 + x2) * 0.5, 0.123, (z1 + z2) * 0.5);
    line.rotation.y = -Math.atan2(dz, dx);
    deck.add(line);
  }

  const viaGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.006, 10);
  const viaPositions = [
    [-0.48, -0.20], [-0.31, -0.10], [-0.17, 0.11],
    [-0.45, 0.12], [-0.54, 0.02], [-0.21, -0.13],
    [-0.39, -0.23], [-0.52, -0.08],
  ];
  for (const [x, z] of viaPositions) {
    const via = new THREE.Mesh(viaGeometry, blueGlow);
    via.position.set(x, 0.125, z);
    deck.add(via);
  }

  const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.006, 0.012), blueGlow);
  sweep.position.set(-0.34, 0.129, -0.20);
  deck.add(sweep);

  const contacts = [];
  const contactPositions = [
    [-0.55, 0.08],
    [-0.44, -0.15],
    [-0.35, -0.04],
    [-0.25, 0.08],
    [-0.13, -0.11],
    [-0.52, -0.02],
  ];

  for (const [x, z] of contactPositions) {
    const contact = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), amberGlow);
    contact.position.set(x, 0.132, z);
    contact.visible = false;
    deck.add(contact);
    contacts.push(contact);
  }

  // --- Rechtes Feld: oranges Anzeigefeld mit antiker Schrift.
  const displayFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.022, 0.38), copper);
  displayFrame.position.set(0.37, 0.099, -0.05);
  deck.add(displayFrame);

  const displayTexture = makeAncientDisplayTexture(4, 812, false);
  const displayMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_ancient_display',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0xff6a1a,
    emissiveMap: displayTexture,
    emissiveIntensity: 1,
    metalness: 0.1,
    roughness: 0.35,
  });

  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.33), displayMaterial);
  display.geometry.rotateX(-Math.PI / 2);
  display.position.set(0.37, 0.113, -0.05);
  deck.add(display);

  // --- Tastenreihen als InstancedMesh.
  const keyGeometry = new THREE.BoxGeometry(0.038, 0.028, 0.038);
  const keyMaterial = new THREE.MeshStandardMaterial({
    name: 'sensor_keys',
    color: 0xffffff,
    emissive: 0xffd38a,
    emissiveIntensity: 1,
    metalness: 0.05,
    roughness: 0.35,
  });

  const keyCount = 30;
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, keyCount);
  keys.name = 'sensor_key_bank';
  const keyDummy = new THREE.Object3D();
  const keyColor = new THREE.Color();

  for (let i = 0; i < keyCount; i++) {
    const row = i < 20 ? 0 : 1;
    const index = row === 0 ? i : i - 20;
    const count = row === 0 ? 20 : 10;
    const x = -0.565 + index * ((1.13) / Math.max(1, count - 1));
    const z = row === 0 ? 0.265 : 0.215;

    keyDummy.position.set(x, 0.106, z);
    keyDummy.rotation.set(0, 0, 0);
    keyDummy.updateMatrix();
    keys.setMatrixAt(i, keyDummy.matrix);

    keyColor.setHex((i % 4 === 0 || (row === 1 && index % 2 === 0)) ? 0xffd98a : 0xdff7ff);
    keys.setColorAt(i, keyColor);
  }
  keys.instanceMatrix.needsUpdate = true;
  if (keys.instanceColor) keys.instanceColor.needsUpdate = true;
  deck.add(keys);

  // Scan-Fortschritt.
  const progressRail = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.009, 0.018), darkIndicator);
  progressRail.position.set(0.37, 0.105, 0.17);
  deck.add(progressRail);

  const progressBar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.01, 0.012), amberGlow);
  progressBar.position.set(0.13, 0.111, 0.17);
  progressBar.scale.x = 0.001;
  deck.add(progressBar);

  // Kleine bernsteinfarbene Statuslampen am rechten Rand.
  const statusGeometry = new THREE.CylinderGeometry(0.017, 0.017, 0.009, 12);
  for (let i = 0; i < 4; i++) {
    const status = new THREE.Mesh(statusGeometry, amberGlow);
    status.position.set(0.18 + i * 0.115, 0.107, 0.295);
    deck.add(status);
  }

  // --- Kollisionskörper.
  const collisionMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  const collision = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.98, 0.80), collisionMaterial);
  collision.name = 'COL_sensor_console';
  collision.position.set(0, 0.49, -0.02);
  root.add(collision);

  // --- Benutzen-Punkt.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.98, 0.72);
  use.userData = { label: 'Langstreckensensoren bedienen', radius: 0.85 };
  root.add(use);

  // --- Lichter.
  const displayLamp = new THREE.Object3D();
  displayLamp.name = 'LAMP_display';
  displayLamp.position.set(-0.34, 1.02, 0.08);
  displayLamp.userData = { color: '#6fe3ff', intensity: 4, distance: 2.4 };
  root.add(displayLamp);

  const indicatorLamp = new THREE.Object3D();
  indicatorLamp.name = 'LAMP_indicator';
  indicatorLamp.position.set(0.37, 1.01, 0.10);
  indicatorLamp.userData = { color: '#ff9a3c', intensity: 2.5, distance: 1.8 };
  root.add(indicatorLamp);

  // --- Zustand und Animation.
  let powered = true;
  let powerLevel = 1;
  let scanning = false;
  let scanProgress = 0;
  let detectedCount = 0;
  let rangeIndex = 1;
  let time = 0;
  let lastTime = null;

  const ranges = [
    { name: 'System', count: 1 },
    { name: 'Lantea', count: 3 },
    { name: 'Extragalaktisch', count: 5 },
  ];

  function update(dt) {
    const delta = Math.min(Math.max(dt, 0), 0.1);
    time += delta;

    const targetPower = powered ? 1 : 0;
    powerLevel += (targetPower - powerLevel) * Math.min(1, delta * 5);

    glassMaterial.emissiveIntensity = 0.04 + powerLevel * 0.52;
    circuitMaterial.emissiveIntensity = 0.03 + powerLevel * 0.68;
    blueGlow.emissiveIntensity = powerLevel * (1.25 + Math.sin(time * 4) * 0.18);
    amberGlow.emissiveIntensity = powerLevel * (1 + Math.sin(time * 3.2 + 0.8) * 0.16);
    darkIndicator.emissiveIntensity = 0.06 + powerLevel * 0.24;
    keyMaterial.emissiveIntensity = powerLevel * (0.9 + Math.sin(time * 3.6) * 0.12);
    displayMaterial.emissiveIntensity = powerLevel * (1 + Math.sin(time * 2.4) * 0.08);
    fasciaMaterial.emissiveIntensity = powerLevel * 0.82;

    if (powered) {
      const sweepZ = -0.215 + ((Math.sin(time * 2.3) + 1) * 0.5) * 0.33;
      sweep.position.z = sweepZ;
    }

    if (scanning) {
      scanProgress = Math.min(1, scanProgress + delta / 2.4);
      detectedCount = Math.floor(scanProgress * ranges[rangeIndex].count);
    }

    const visibleContacts = powered ? detectedCount : 0;
    for (let i = 0; i < contacts.length; i++) {
      contacts[i].visible = i < visibleContacts;
      const pulse = 0.85 + Math.sin(time * 8 + i) * 0.15;
      contacts[i].scale.setScalar(pulse);
    }

    if (scanProgress > 0) {
      progressBar.scale.x = Math.max(0.001, scanProgress);
      progressBar.position.x = 0.13 + 0.24 * scanProgress;
    } else {
      progressBar.scale.x = 0.001;
      progressBar.position.x = 0.13;
    }

    if (scanning && scanProgress >= 1) {
      scanning = false;
    }
  }

  housing.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };

  root.userData.update = update;

  // --- Öffentliche API.
  const api = {
    einschalten() {
      powered = true;
    },
    ausschalten() {
      powered = false;
      scanning = false;
      scanProgress = 0;
      detectedCount = 0;
    },
    umschalten() {
      if (powered) api.ausschalten();
      else api.einschalten();
    },
    scan() {
      powered = true;
      scanning = true;
      scanProgress = 0;
      detectedCount = 0;
    },
    reichweiteSetzen(index) {
      rangeIndex = Math.max(0, Math.min(ranges.length - 1, Number(index) || 0));
      if (scanning) {
        scanProgress = 0;
        detectedCount = 0;
      }
    },
    reichweiteWechseln() {
      rangeIndex = (rangeIndex + 1) % ranges.length;
      if (scanning) {
        scanProgress = 0;
        detectedCount = 0;
      }
    },
    get an() {
      return powered;
    },
    get scanLaeuft() {
      return scanning;
    },
    get scanFortschritt() {
      return scanProgress;
    },
    get reichweite() {
      return ranges[rangeIndex].name;
    },
    get reichweitenIndex() {
      return rangeIndex;
    },
    get Kontaktzahl() {
      return detectedCount;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    { id: 'ein', label: 'Sensorpult einschalten', run: () => api.einschalten() },
    { id: 'aus', label: 'Sensorpult ausschalten', run: () => api.ausschalten() },
    { id: 'reichweite', label: 'Reichweite wechseln', run: () => api.reichweiteWechseln() },
    { id: 'scan', label: 'Langstreckenscan starten', run: () => api.scan() },
  ];

  return root;
}

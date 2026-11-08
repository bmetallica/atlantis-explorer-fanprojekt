import * as THREE from 'three';

export const steckbrief = {
  name: 'equipment_case',
  art: 'Standobjekt',
  masse: '0,78 × 0,34 × 0,42 m (B × H × T); 12–22 kg je nach Variante',
  wohin: 'ATL-001 (Gate-Raum), ATL-034 (Ladungshalt)',
  benutzen: 'INT_benutzen → Transportkoffer öffnen, schließen oder Deckel umschalten',
  lichter: 'keine',
  animation: 'Deckel öffnet sich weich um die hintere Scharnierachse; Schnappverschlüsse heben sich dabei leicht ab',
  quelle: 'selbst gebaut nach Peli-Case-Referenz',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function material(name, color, roughness = 0.45, metalness = 0.15, extra = {}) {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    roughness,
    metalness,
    ...extra,
  });
}

function makeLabelTexture(title = 'CATALOGUED ITEMS') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#deddd4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#30383b';
  ctx.lineWidth = 12;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  ctx.fillStyle = '#30383b';
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATLANTIS EXPEDITION', 256, 58);

  ctx.fillStyle = '#9a4527';
  ctx.font = 'bold 33px Arial, sans-serif';
  ctx.fillText(title, 256, 112);

  ctx.fillStyle = '#30383b';
  ctx.font = '21px monospace';
  ctx.fillText('FIELD EQUIPMENT / ARCHIVE', 256, 153);
  ctx.fillText('ATL-EXP-08 / 2004', 256, 185);

  ctx.fillStyle = '#68706f';
  ctx.fillRect(34, 210, 444, 3);

  ctx.textAlign = 'left';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('LOT 008', 38, 233);
  ctx.textAlign = 'right';
  ctx.fillText('SEALED', 474, 233);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundedBoxGeometry(width, height, depth, radius = 0.025, bevel = 0.006) {
  const b = Math.min(bevel, depth * 0.2, radius * 0.45);
  const sw = Math.max(0.01, width - b * 2);
  const sh = Math.max(0.01, height - b * 2);
  const sd = Math.max(0.01, depth - b * 2);
  const r = Math.max(0.001, radius - b);

  const shape = new THREE.Shape();
  shape.moveTo(-sw / 2 + r, -sh / 2);
  shape.lineTo(sw / 2 - r, -sh / 2);
  shape.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + r);
  shape.lineTo(sw / 2, sh / 2 - r);
  shape.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - r, sh / 2);
  shape.lineTo(-sw / 2 + r, sh / 2);
  shape.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - r);
  shape.lineTo(-sw / 2, -sh / 2 + r);
  shape.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + r, -sh / 2);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: sd,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 3,
    steps: 1,
  });
  geometry.translate(0, 0, -sd / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addBox(parent, size, pos, mat, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  mesh.position.copy(pos);
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'equipment_case';

  const W = clamp(opts.breite ?? 0.78, 0.5, 1.2);
  const H = clamp(opts.hoehe ?? 0.34, 0.2, 0.5);
  const D = clamp(opts.tiefe ?? 0.42, 0.35, 0.6);

  const colorName = opts.farbe ?? 'oliv';
  const aluminium = opts.material === 'aluminium' || opts.material === 'aluminum';
  const mitRollen = opts.rollen ?? !aluminium;

  const shellW = W - 0.04;
  const shellD = D - 0.03;
  const baseY = mitRollen ? 0.035 : 0.022;
  const lidH = Math.min(0.14, H * 0.34);
  const bodyH = Math.max(0.08, H - baseY - lidH);
  const bodyTop = baseY + bodyH;

  const colors = {
    gelb: 0xb5a12a,
    oliv: 0x59604a,
    grau: 0x687176,
    schwarz: 0x171b1d,
  };

  const bodyColor = aluminium ? 0xa4abad : (colors[colorName] ?? colors.oliv);
  const shellMat = material(`case_shell_${colorName}`, bodyColor, aluminium ? 0.27 : 0.42, aluminium ? 0.82 : 0.16);
  const lidMat = material('case_lid_shell', bodyColor, aluminium ? 0.24 : 0.38, aluminium ? 0.86 : 0.18);
  const rubberMat = material('case_rubber', 0x111416, 0.74, 0.06);
  const darkMetalMat = material('case_dark_metal', 0x252b2e, 0.31, 0.72);
  const aluminumMat = material('case_aluminum', 0xa6adb0, 0.27, 0.82);
  const bronzeMat = material('case_bronze', 0x8a5a28, 0.36, 0.65);
  const interiorMat = material('case_interior', 0x252c2e, 0.9, 0.02);
  const foamMat = material('case_foam', 0x171b1c, 0.96, 0.01);
  const strapMat = material('case_strap', 0x111416, 0.58, 0.14);
  const ribMat = material('case_rib', bodyColor, aluminium ? 0.3 : 0.5, aluminium ? 0.8 : 0.14);

  const labelMat = new THREE.MeshStandardMaterial({
    name: 'case_label',
    map: makeLabelTexture(opts.etikett ?? 'CATALOGUED ITEMS'),
    roughness: 0.82,
    metalness: 0,
    emissive: 0x332717,
    emissiveIntensity: 0.025,
  });

  // Geschlossenes, abgerundetes Unterteil.
  const body = new THREE.Mesh(
    roundedBoxGeometry(shellW, bodyH, shellD, Math.min(0.035, bodyH * 0.25), 0.006),
    shellMat
  );
  body.name = 'koffer_unterteil';
  body.position.set(0, baseY + bodyH / 2, 0);
  root.add(body);

  // Dunkle Innenwanne, knapp unter der Deckelfuge.
  const innerTray = addBox(
    root,
    new THREE.Vector3(shellW - 0.055, 0.014, shellD - 0.055),
    new THREE.Vector3(0, bodyTop - 0.003, 0),
    interiorMat,
    'koffer_innenwanne'
  );

  // Geschützte Aufnahmeplätze im Inneren.
  const slotGeo = new THREE.BoxGeometry(
    Math.min(0.13, shellW * 0.2),
    0.012,
    Math.min(0.13, shellD * 0.27)
  );
  const slots = new THREE.InstancedMesh(slotGeo, foamMat, 6);
  slots.name = 'schaumfacher';
  const slotMatrix = new THREE.Matrix4();
  let slotIndex = 0;
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 3; column++) {
      const x = (column - 1) * shellW * 0.23;
      const z = (row - 0.5) * shellD * 0.34;
      slotMatrix.makeTranslation(x, bodyTop + 0.009, z);
      slots.setMatrixAt(slotIndex++, slotMatrix);
    }
  }
  slots.instanceMatrix.needsUpdate = true;
  root.add(slots);

  // Deckel mit hinterer Scharnierachse.
  const hinge = new THREE.Group();
  hinge.name = 'deckel_scharnier';
  hinge.position.set(0, bodyTop, -shellD / 2);
  root.add(hinge);

  const lid = new THREE.Mesh(
    roundedBoxGeometry(shellW, lidH, shellD, Math.min(0.032, lidH * 0.28), 0.005),
    lidMat
  );
  lid.name = 'koffer_deckel';
  lid.position.set(0, lidH / 2, shellD / 2);
  hinge.add(lid);

  // Dunkle Innenseite des Deckels.
  addBox(
    hinge,
    new THREE.Vector3(shellW - 0.055, 0.012, shellD - 0.055),
    new THREE.Vector3(0, -0.004, shellD / 2),
    interiorMat,
    'deckel_innenfutter'
  );

  // Schwarze Deckelbänder wie beim Referenz-Peli-Case.
  const strapW = 0.038;
  const strapX = shellW * 0.3;
  for (const side of [-1, 1]) {
    addBox(
      hinge,
      new THREE.Vector3(strapW, 0.012, shellD * 0.9),
      new THREE.Vector3(side * strapX, lidH + 0.004, shellD / 2),
      strapMat,
      'deckel_band'
    );
    addBox(
      hinge,
      new THREE.Vector3(strapW, lidH * 0.82, 0.012),
      new THREE.Vector3(side * strapX, lidH * 0.48, shellD + 0.006),
      strapMat,
      'deckel_band_vorne'
    );
  }

  // Katalogetikett auf dem Deckel.
  const topLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(0.34, shellW * 0.46), 0.16),
    labelMat
  );
  topLabel.name = 'etikett_deckel';
  topLabel.rotation.x = -Math.PI / 2;
  topLabel.position.set(0, lidH + 0.012, shellD * 0.53);
  hinge.add(topLabel);

  // Kleine Inventarplatte vorne oberhalb des Griffs.
  const frontPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(0.2, shellW * 0.3), 0.055),
    labelMat
  );
  frontPlate.name = 'inventarplatte';
  frontPlate.position.set(0, bodyTop - 0.035, shellD / 2 + 0.009);
  root.add(frontPlate);

  // Zwei Schnappverschlüsse als InstancedMesh.
  const latchGeo = roundedBoxGeometry(0.065, 0.105, 0.028, 0.009, 0.003);
  const latchMesh = new THREE.InstancedMesh(latchGeo, darkMetalMat, 2);
  latchMesh.name = 'schnappverschluesse';
  const latchMatrix = new THREE.Matrix4();
  [-1, 1].forEach((side, i) => {
    latchMatrix.makeTranslation(side * shellW * 0.27, bodyTop - 0.012, shellD / 2 + 0.014);
    latchMesh.setMatrixAt(i, latchMatrix);
  });
  latchMesh.instanceMatrix.needsUpdate = true;
  root.add(latchMesh);

  // Bronzefarbene Verriegelungsdetails.
  const lockGeo = new THREE.BoxGeometry(0.044, 0.02, 0.01);
  const locks = new THREE.InstancedMesh(lockGeo, bronzeMat, 2);
  locks.name = 'verriegelungsdetails';
  [-1, 1].forEach((side, i) => {
    latchMatrix.makeTranslation(side * shellW * 0.27, bodyTop - 0.066, shellD / 2 + 0.031);
    locks.setMatrixAt(i, latchMatrix);
  });
  locks.instanceMatrix.needsUpdate = true;
  root.add(locks);

  // Frontgriff: zwei feststehende Halter und ein verbindender Griff.
  const handleY = baseY + bodyH * 0.43;
  const handleWidth = Math.min(0.31, shellW * 0.45);
  const handleHalf = handleWidth * 0.5;

  addBox(
    root,
    new THREE.Vector3(0.07, 0.038, 0.06),
    new THREE.Vector3(-handleHalf * 0.82, handleY, shellD / 2 + 0.005),
    darkMetalMat,
    'griff_halter'
  );
  addBox(
    root,
    new THREE.Vector3(0.07, 0.038, 0.06),
    new THREE.Vector3(handleHalf * 0.82, handleY, shellD / 2 + 0.005),
    darkMetalMat,
    'griff_halter'
  );
  addBox(
    root,
    new THREE.Vector3(handleWidth, 0.038, 0.05),
    new THREE.Vector3(0, handleY, D / 2 - 0.025),
    rubberMat,
    'transportgriff'
  );

  // Seitliche Druckausgleichsventile.
  for (const side of [-1, 1]) {
    const valve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.022, 16),
      aluminumMat
    );
    valve.name = 'druckausgleichsventil';
    valve.rotation.z = Math.PI / 2;
    valve.position.set(side * (shellW / 2 + 0.006), bodyTop - 0.055, -shellD * 0.14);
    root.add(valve);

    const valveInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.026, 12),
      rubberMat
    );
    valveInner.name = 'ventil_membran';
    valveInner.rotation.z = Math.PI / 2;
    valveInner.position.set(side * (shellW / 2 + 0.02), bodyTop - 0.055, -shellD * 0.14);
    root.add(valveInner);
  }

  // Schützende Seitenrippen.
  for (const side of [-1, 1]) {
    for (const z of [-shellD * 0.25, shellD * 0.25]) {
      addBox(
        root,
        new THREE.Vector3(0.012, bodyH * 0.62, 0.032),
        new THREE.Vector3(side * (shellW / 2 + 0.003), baseY + bodyH * 0.48, z),
        ribMat,
        'schutzrippe'
      );
    }
  }

  // Gummifüße als InstancedMesh.
  const footGeo = new THREE.BoxGeometry(0.07, baseY, 0.07);
  const feet = new THREE.InstancedMesh(footGeo, rubberMat, 4);
  feet.name = 'gummifuesse';
  const footMatrix = new THREE.Matrix4();
  const footPositions = [
    [-shellW * 0.36, baseY / 2, -shellD * 0.34],
    [shellW * 0.36, baseY / 2, -shellD * 0.34],
    [-shellW * 0.36, baseY / 2, shellD * 0.34],
    [shellW * 0.36, baseY / 2, shellD * 0.34],
  ];
  footPositions.forEach((position, i) => {
    footMatrix.makeTranslation(position[0], position[1], position[2]);
    feet.setMatrixAt(i, footMatrix);
  });
  feet.instanceMatrix.needsUpdate = true;
  root.add(feet);

  // Integrierte Rollen an den hinteren Ecken.
  if (mitRollen) {
    const wheelGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.036, 18);
    wheelGeo.rotateZ(Math.PI / 2);

    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(wheelGeo, rubberMat);
      wheel.name = 'rolle';
      wheel.position.set(side * (shellW / 2 - 0.045), 0.038, -shellD / 2 + 0.055);
      root.add(wheel);

      const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.055, 12),
        aluminumMat
      );
      axle.name = 'rollenachse';
      axle.rotation.z = Math.PI / 2;
      axle.position.copy(wheel.position);
      root.add(axle);
    }
  }

  // Aluminiumprofile an den vier unteren Ecken.
  for (const side of [-1, 1]) {
    for (const z of [-shellD / 2 + 0.028, shellD / 2 - 0.028]) {
      addBox(
        root,
        new THREE.Vector3(0.022, bodyH * 0.82, 0.022),
        new THREE.Vector3(side * (shellW / 2 - 0.008), baseY + bodyH * 0.43, z),
        aluminumMat,
        'aluminiumecke'
      );
    }
  }

  // Zwei sichtbare Scharnierstifte an der Rückseite.
  for (const side of [-1, 1]) {
    const hingePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12),
      aluminumMat
    );
    hingePin.name = 'scharnierstift';
    hingePin.rotation.z = Math.PI / 2;
    hingePin.position.set(side * shellW * 0.24, bodyTop, -shellD / 2 - 0.006);
    root.add(hingePin);
  }

  // Fester Kollisionskörper; der bewegte Deckel ist bewusst kein COL_-Mesh.
  const col = new THREE.Mesh(new THREE.BoxGeometry(shellW, H - 0.005, shellD));
  col.name = 'COL_koffer';
  col.position.set(0, (H - 0.005) / 2, 0);
  col.userData.aktiv = true;
  root.add(col);

  // Benutzen-Punkt in Griffhöhe vor dem Koffer.
  const use = new THREE.Object3D();
  use.name = 'INT_benutzen';
  use.position.set(0, clamp(handleY + 0.08, 0.18, H - 0.05), D / 2 + 0.18);
  use.userData = {
    label: 'Transportkoffer öffnen',
    radius: 0.8,
  };
  root.add(use);

  let offen = false;
  let winkel = 0;
  let zielwinkel = 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const step = clamp(dt, 0, 0.1);
    zeit += step;

    const winkelGleichung = Math.min(1, step * 5.5);
    winkel += (zielwinkel - winkel) * winkelGleichung;
    hinge.rotation.x = -winkel;

    const latchLift = clamp(winkel / 0.65, 0, 1);
    latchMesh.position.y = latchLift * 0.012;
    latchMesh.rotation.x = latchLift * 0.1;

    const pulse = 0.9 + Math.sin(zeit * 1.7) * 0.08;
    labelMat.emissiveIntensity = 0.022 * pulse;
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    oeffnen() {
      offen = true;
      zielwinkel = 1.28;
    },
    schliessen() {
      offen = false;
      zielwinkel = 0;
    },
    umschalten() {
      if (offen) api.schliessen();
      else api.oeffnen();
    },
    get offen() {
      return offen;
    },
    get ausrichtung() {
      return 'Vorderseite +Z';
    },
    get masse() {
      return aluminium ? 22 : 18;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    { id: 'oeffnen', label: 'Transportkoffer öffnen', run: () => api.oeffnen() },
    { id: 'schliessen', label: 'Transportkoffer schließen', run: () => api.schliessen() },
    { id: 'umschalten', label: 'Deckel umschalten', run: () => api.umschalten() },
  ];

  return root;
}

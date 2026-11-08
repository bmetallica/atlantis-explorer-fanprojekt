// Halon-Feuerlöschsystem für das HAZMAT-Lager.
// 1 Einheit = 1 Meter. Ursprung: Mitte der Unterkante der Rückseite bei z = 0.
// Die sichtbare Vorderseite zeigt nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, ctx, texture };
}

function makeWarningTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#e5e5dc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a7191d';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.fillStyle = '#a7191d';
    ctx.fillRect(17, 17, w - 34, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DANGER', w / 2, 66);

    ctx.fillStyle = '#17191c';
    ctx.font = 'bold 35px Arial';
    ctx.fillText('HALON 1301', w / 2, 135);
    ctx.font = '25px Arial';
    ctx.fillText('FIRE SUPPRESSION SYSTEM', w / 2, 176);
    ctx.fillText('DO NOT ENTER WHEN ALARM', w / 2, 214);
    ctx.fillText('IS ACTIVE', w / 2, 247);
    ctx.font = '19px Arial';
    ctx.fillText('AUTHORIZED PERSONNEL ONLY', w / 2, 288);
  }).texture;
}

function makeHazardTexture() {
  const result = canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#151719';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e0b72b';
    ctx.save();
    ctx.translate(-32, 0);
    for (let x = 0; x < w + 64; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 32, h);
      ctx.lineTo(x + 64, 0);
      ctx.lineTo(x + 32, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
  result.texture.wrapS = THREE.RepeatWrapping;
  result.texture.repeat.set(5, 1);
  return result.texture;
}

function cylinderBetween(a, b, radius, material, radialSegments = 12) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeFlange(position, axis, radius, thickness, material) {
  const flange = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, thickness, 12),
    material
  );
  flange.position.copy(position);
  if (axis === 'x') flange.rotation.z = Math.PI / 2;
  if (axis === 'z') flange.rotation.x = Math.PI / 2;
  return flange;
}

export const steckbrief = {
  name: 'halon_system',
  art: 'Wandobjekt',
  masse: '2,82 × 2,75 × 0,62 (B × H × T, m)',
  benutzen: 'INT_steuerung → Halon-System bedienen; INT_sabotage → Sabotagepunkt',
  lichter: 'LAMP_status und LAMP_ventil (schwaches Blaugrau, dauerhaft an)',
  animation: 'Anzeige und Statusleuchte pulsieren; bei Löschung dreht sich das Ventilrad und blaugrauer Löschnebel erscheint',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'halon_system';

  const wallDarkMat = kit('wallDark');
  const steelKitMat = kit('wall');
  const copperMat = kit('copper');
  const hullMat = kit('hull');

  const steelMat = new THREE.MeshStandardMaterial({
    name: 'halon_industrial_steel',
    color: 0x737d84,
    metalness: 0.82,
    roughness: 0.32,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    name: 'halon_dark_steel',
    color: 0x191e23,
    metalness: 0.76,
    roughness: 0.4,
  });

  const tankMat = new THREE.MeshStandardMaterial({
    name: 'halon_pressure_vessel',
    color: 0x59636a,
    metalness: 0.88,
    roughness: 0.25,
  });

  const redMat = new THREE.MeshStandardMaterial({
    name: 'halon_warning_red',
    color: 0xb51d23,
    emissive: 0x4d080b,
    emissiveIntensity: 0.12,
    metalness: 0.16,
    roughness: 0.48,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    name: 'halon_safety_yellow',
    color: 0xd8aa20,
    metalness: 0.18,
    roughness: 0.44,
  });

  // ---------------------------------------------------------
  // Tragrahmen und Montageflächen. Rückseite bei z = 0.
  // ---------------------------------------------------------
  for (const x of [-1.34, 1.34]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.75, 0.11), wallDarkMat);
    rail.position.set(x, 1.375, 0.055);
    root.add(rail);

    for (const y of [0.22, 1.36, 2.48]) {
      const anchor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.07), steelMat);
      anchor.position.set(x, y, 0.015);
      root.add(anchor);
    }
  }

  for (const y of [0.20, 1.35, 2.52]) {
    const crossRail = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.07, 0.09), wallDarkMat);
    crossRail.position.set(0, y, 0.045);
    root.add(crossRail);
  }

  const tankBacking = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.70, 0.035), wallDarkMat);
  tankBacking.position.set(-0.72, 0.92, 0.0175);
  root.add(tankBacking);

  const cabinetBacking = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.64, 0.035), wallDarkMat);
  cabinetBacking.position.set(0.72, 1.06, 0.0175);
  root.add(cabinetBacking);

  // ---------------------------------------------------------
  // Halon-Druckbehälter links.
  // ---------------------------------------------------------
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.48), steelMat);
  shelf.position.set(-0.72, 0.04, 0.25);
  root.add(shelf);

  const tankFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.12, 14), darkSteelMat);
  tankFoot.position.set(-0.72, 0.14, 0.28);
  root.add(tankFoot);

  const vessel = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.04, 5, 12), tankMat);
  vessel.position.set(-0.72, 0.88, 0.28);
  root.add(vessel);

  const vesselNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.14, 0.17, 12), copperMat);
  vesselNeck.position.set(-0.72, 1.64, 0.28);
  root.add(vesselNeck);

  for (const y of [0.54, 1.20]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.184, 0.021, 6, 24), copperMat);
    band.position.set(-0.72, y, 0.28);
    band.rotation.x = Math.PI / 2;
    root.add(band);

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.13), darkSteelMat);
    bracket.position.set(-0.72, y, 0.09);
    root.add(bracket);
  }

  // Typenschild am Druckbehälter.
  const tankPlate = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.15, 0.018), steelMat);
  tankPlate.position.set(-0.72, 1.00, 0.473);
  root.add(tankPlate);

  const tankPlateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.29, 0.105),
    new THREE.MeshStandardMaterial({ color: 0xd3d4cd, roughness: 0.72, metalness: 0.08 })
  );
  tankPlateFace.position.set(-0.72, 1.00, 0.484);
  root.add(tankPlateFace);

  // ---------------------------------------------------------
  // Hauptleitungen, Verteilerring und Flansche.
  // ---------------------------------------------------------
  const pipeMat = steelMat;

  const riser = cylinderBetween(
    new THREE.Vector3(-0.72, 1.68, 0.28),
    new THREE.Vector3(-0.72, 2.38, 0.26),
    0.075,
    pipeMat,
    14
  );
  root.add(riser);

  const header = cylinderBetween(
    new THREE.Vector3(-1.16, 2.38, 0.26),
    new THREE.Vector3(1.27, 2.38, 0.26),
    0.085,
    pipeMat,
    14
  );
  root.add(header);

  const lowerFeed = cylinderBetween(
    new THREE.Vector3(-0.54, 0.72, 0.28),
    new THREE.Vector3(0.32, 0.72, 0.28),
    0.055,
    pipeMat,
    12
  );
  root.add(lowerFeed);

  const valveFeed = cylinderBetween(
    new THREE.Vector3(-0.72, 1.82, 0.30),
    new THREE.Vector3(0.31, 1.82, 0.30),
    0.07,
    pipeMat,
    14
  );
  root.add(valveFeed);

  const rightDrop = cylinderBetween(
    new THREE.Vector3(1.27, 2.38, 0.26),
    new THREE.Vector3(1.27, 1.82, 0.30),
    0.075,
    pipeMat,
    14
  );
  root.add(rightDrop);

  const cabinetFeed = cylinderBetween(
    new THREE.Vector3(1.27, 1.82, 0.30),
    new THREE.Vector3(1.08, 1.82, 0.30),
    0.075,
    pipeMat,
    14
  );
  root.add(cabinetFeed);

  const flangeSpecs = [
    { p: [-0.72, 2.10, 0.267], axis: 'y', r: 0.115, t: 0.055 },
    { p: [-0.72, 1.99, 0.30], axis: 'y', r: 0.115, t: 0.05 },
    { p: [-1.00, 2.38, 0.26], axis: 'x', r: 0.125, t: 0.06 },
    { p: [1.08, 2.38, 0.26], axis: 'x', r: 0.125, t: 0.06 },
    { p: [1.27, 2.13, 0.277], axis: 'y', r: 0.115, t: 0.055 },
    { p: [-0.43, 1.82, 0.30], axis: 'x', r: 0.105, t: 0.05 },
  ];

  for (const spec of flangeSpecs) {
    root.add(makeFlange(
      new THREE.Vector3(spec.p[0], spec.p[1], spec.p[2]),
      spec.axis,
      spec.r,
      spec.t,
      darkSteelMat
    ));
  }

  // Rohrschellen und Abstandshalter.
  for (const x of [-1.05, 1.05]) {
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 6, 20), darkSteelMat);
    clamp.position.set(x, 2.38, 0.26);
    clamp.rotation.y = Math.PI / 2;
    root.add(clamp);

    const standOff = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.16), darkSteelMat);
    standOff.position.set(x, 2.38, 0.12);
    root.add(standOff);
  }

  // ---------------------------------------------------------
  // Handventil mit Speichenrad.
  // ---------------------------------------------------------
  const valveBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.19, 14), darkSteelMat);
  valveBody.position.set(-0.72, 1.82, 0.34);
  valveBody.rotation.x = Math.PI / 2;
  root.add(valveBody);

  const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.19, 10), copperMat);
  valveStem.position.set(-0.72, 1.82, 0.46);
  valveStem.rotation.x = Math.PI / 2;
  root.add(valveStem);

  const valveWheel = new THREE.Group();
  valveWheel.name = 'ventilrad';
  valveWheel.position.set(-0.72, 1.82, 0.56);
  root.add(valveWheel);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.029, 6, 24), copperMat);
  valveWheel.add(wheelRim);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spoke = cylinderBetween(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * 0.215, Math.sin(angle) * 0.215, 0),
      0.016,
      copperMat,
      8
    );
    valveWheel.add(spoke);
  }

  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.07, 10), darkSteelMat);
  wheelHub.rotation.x = Math.PI / 2;
  valveWheel.add(wheelHub);

  // Manometer.
  const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.075, 16), darkSteelMat);
  gaugeBody.position.set(-0.25, 1.82, 0.41);
  gaugeBody.rotation.x = Math.PI / 2;
  root.add(gaugeBody);

  const gaugeFaceMat = new THREE.MeshStandardMaterial({
    name: 'halon_gauge_face',
    color: 0xc6ced0,
    roughness: 0.62,
    metalness: 0.08,
  });
  const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.112, 20), gaugeFaceMat);
  gaugeFace.position.set(-0.25, 1.82, 0.452);
  root.add(gaugeFace);

  const gaugeNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.083, 0.008), redMat);
  gaugeNeedle.position.set(-0.238, 1.846, 0.459);
  gaugeNeedle.rotation.z = -0.58;
  root.add(gaugeNeedle);

  const gaugeHub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10), darkSteelMat);
  gaugeHub.position.set(-0.25, 1.82, 0.463);
  gaugeHub.rotation.x = Math.PI / 2;
  root.add(gaugeHub);

  // ---------------------------------------------------------
  // Deckenverteiler und zwei geschlossene Löschdüsen.
  // ---------------------------------------------------------
  const nozzleXs = [-1.05, 1.05];
  for (const x of nozzleXs) {
    const drop = cylinderBetween(
      new THREE.Vector3(x, 2.38, 0.26),
      new THREE.Vector3(x, 2.16, 0.26),
      0.05,
      pipeMat,
      12
    );
    root.add(drop);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.095, 0.15, 12), copperMat);
    nozzle.position.set(x, 2.075, 0.26);
    root.add(nozzle);

    const nozzleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.025, 12), darkSteelMat);
    nozzleCap.position.set(x, 1.995, 0.26);
    root.add(nozzleCap);
  }

  // ---------------------------------------------------------
  // Schaltkasten rechts.
  // ---------------------------------------------------------
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.52, 0.28), darkSteelMat);
  cabinet.position.set(0.72, 1.06, 0.18);
  root.add(cabinet);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.44, 0.035), wallDarkMat);
  door.position.set(0.72, 1.06, 0.335);
  root.add(door);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.89, 1.49, 0.022), steelKitMat);
  doorFrame.position.set(0.72, 1.06, 0.325);
  root.add(doorFrame);

  const hazardTexture = makeHazardTexture();
  const hazardMat = new THREE.MeshStandardMaterial({
    name: 'halon_hazard_stripes',
    map: hazardTexture,
    metalness: 0.26,
    roughness: 0.54,
  });

  for (const y of [0.39, 1.73]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.068, 0.016), hazardMat);
    strip.position.set(0.72, y, 0.361);
    root.add(strip);
  }

  // Dynamisches Bedien- und Statusdisplay.
  const displayData = canvasTexture(512, 256, () => {});
  const displayMat = new THREE.MeshStandardMaterial({
    name: 'halon_control_display',
    map: displayData.texture,
    emissiveMap: displayData.texture,
    emissive: 0x6f9fb5,
    emissiveIntensity: 0.65,
    roughness: 0.32,
    metalness: 0.05,
  });

  const displayFrame = new THREE.Mesh(new THREE.BoxGeometry(0.67, 0.36, 0.025), darkSteelMat);
  displayFrame.position.set(0.72, 1.43, 0.351);
  root.add(displayFrame);

  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.61, 0.305), displayMat);
  display.position.set(0.72, 1.43, 0.367);
  root.add(display);

  // Warnschild am Schaltkasten.
  const warningTexture = makeWarningTexture();
  const warningMat = new THREE.MeshStandardMaterial({
    name: 'halon_warning_sign',
    map: warningTexture,
    emissiveMap: warningTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.07,
    roughness: 0.68,
    metalness: 0.04,
  });

  const warning = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.27), warningMat);
  warning.position.set(0.72, 1.04, 0.357);
  root.add(warning);

  const redSticker = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.095), redMat);
  redSticker.position.set(0.72, 0.68, 0.357);
  root.add(redSticker);

  const stickerText = new THREE.Mesh(
    new THREE.PlaneGeometry(0.29, 0.055),
    new THREE.MeshStandardMaterial({
      color: 0xe7e4dc,
      roughness: 0.72,
      metalness: 0.05,
    })
  );
  stickerText.position.set(0.72, 0.68, 0.361);
  root.add(stickerText);

  // Schalt- und Quittierungstasten.
  const buttonXs = [0.49, 0.72, 0.95];
  const buttonMaterials = [];

  for (let i = 0; i < buttonXs.length; i++) {
    const material = new THREE.MeshStandardMaterial({
      name: `halon_button_${i}`,
      color: i === 0 ? 0x6a2624 : i === 1 ? 0x273844 : 0x263d30,
      emissive: i === 2 ? 0x2f8057 : 0x000000,
      emissiveIntensity: i === 2 ? 0.3 : 0,
      metalness: 0.25,
      roughness: 0.43,
    });

    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.024, 12), steelMat);
    bezel.position.set(buttonXs[i], 0.51, 0.364);
    bezel.rotation.x = Math.PI / 2;
    root.add(bezel);

    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.045, 12), material);
    button.position.set(buttonXs[i], 0.51, 0.397);
    button.rotation.x = Math.PI / 2;
    root.add(button);

    buttonMaterials.push(material);
  }

  const statusMat = new THREE.MeshStandardMaterial({
    name: 'halon_status_lamp',
    color: 0x64899c,
    emissive: 0x6f9fb5,
    emissiveIntensity: 0.12,
    metalness: 0.2,
    roughness: 0.28,
  });

  const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 7), statusMat);
  statusLight.position.set(0.49, 0.73, 0.372);
  root.add(statusLight);

  const statusBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.025, 10), darkSteelMat);
  statusBezel.position.set(0.49, 0.73, 0.36);
  statusBezel.rotation.x = Math.PI / 2;
  root.add(statusBezel);

  // Schrauben als InstancedMesh.
  const boltGeometry = new THREE.CylinderGeometry(0.016, 0.016, 0.022, 8);
  boltGeometry.rotateX(Math.PI / 2);

  const bolts = new THREE.InstancedMesh(boltGeometry, steelMat, 16);
  const matrix = new THREE.Matrix4();
  let boltIndex = 0;

  for (const y of [0.43, 1.69]) {
    for (const x of [0.34, 1.10]) {
      matrix.makeTranslation(x, y, 0.367);
      bolts.setMatrixAt(boltIndex++, matrix);
    }
  }

  for (const x of [0.34, 1.10]) {
    for (const y of [0.83, 1.25]) {
      matrix.makeTranslation(x, y, 0.367);
      bolts.setMatrixAt(boltIndex++, matrix);
    }
  }

  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  // Kabelkanal zwischen Schaltkasten und Ventil.
  const conduit = cylinderBetween(
    new THREE.Vector3(0.29, 1.42, 0.13),
    new THREE.Vector3(-0.58, 1.42, 0.13),
    0.026,
    darkSteelMat,
    8
  );
  root.add(conduit);

  // ---------------------------------------------------------
  // Sichtbarer Löschnebel, nur während der Flutung sichtbar.
  // ---------------------------------------------------------
  const gasMat = new THREE.MeshStandardMaterial({
    name: 'halon_discharge_fog',
    color: 0x8faec0,
    emissive: 0x496c80,
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    roughness: 1,
  });

  const gasClouds = [];
  for (const x of nozzleXs) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), gasMat);
    cloud.position.set(x, 1.78, 0.26);
    cloud.visible = false;
    root.add(cloud);
    gasClouds.push(cloud);
  }

  // ---------------------------------------------------------
  // Kollisionskörper.
  // ---------------------------------------------------------
  const collisionMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const colTank = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.66, 0.50), collisionMat);
  colTank.name = 'COL_druckbehaelter';
  colTank.position.set(-0.72, 0.87, 0.27);
  root.add(colTank);

  const colCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.56, 0.36), collisionMat);
  colCabinet.name = 'COL_schaltkasten';
  colCabinet.position.set(0.72, 1.06, 0.18);
  root.add(colCabinet);

  const colPipes = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.35, 0.38), collisionMat);
  colPipes.name = 'COL_verteilerleitung';
  colPipes.position.set(0.055, 2.38, 0.26);
  root.add(colPipes);

  // ---------------------------------------------------------
  // Benutzen- und Sabotagepunkte.
  // ---------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_steuerung';
  use.position.set(0.72, 1.10, 0.78);
  use.userData = { label: 'Halon-System bedienen', radius: 0.8 };
  root.add(use);

  const sabotage = new THREE.Object3D();
  sabotage.name = 'INT_sabotage';
  sabotage.position.set(0.72, 0.76, 0.78);
  sabotage.userData = { label: 'Halon-Steuerung sabotieren', radius: 0.65 };
  root.add(sabotage);

  // ---------------------------------------------------------
  // Dauerhaft eingeschaltete, schwache blaugraue Lichter.
  // ---------------------------------------------------------
  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0.62, 1.44, 0.50);
  lampStatus.userData = { color: '#6f9fb5', intensity: 2.4, distance: 2.2 };
  root.add(lampStatus);

  const lampValve = new THREE.Object3D();
  lampValve.name = 'LAMP_ventil';
  lampValve.position.set(-0.58, 1.84, 0.62);
  lampValve.userData = { color: '#7f9fb5', intensity: 1.8, distance: 2.0 };
  root.add(lampValve);

  // ---------------------------------------------------------
  // Zustand, Anzeige und Animation.
  // ---------------------------------------------------------
  let armed = false;
  let sabotaged = false;
  let dischargeTime = 0;
  let valveAngle = 0;
  let zeit = 0;
  let letzte = null;
  let displayDirty = true;

  function drawDisplay() {
    const ctx = displayData.ctx;
    const w = displayData.canvas.width;
    const h = displayData.canvas.height;

    ctx.fillStyle = '#071219';
    ctx.fillRect(0, 0, w, h);

    const borderColor = sabotaged ? '#d13b3b' : armed ? '#e3b62c' : '#6f9fb5';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d5e9ee';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('HALON SYSTEM', w / 2, 65);

    let status = 'STANDBY';
    if (sabotaged) status = 'SABOTAGED';
    else if (dischargeTime > 0) status = 'DISCHARGE';
    else if (armed) status = 'ARMED';

    ctx.fillStyle = sabotaged ? '#ff6262' : armed ? '#f2cc4b' : '#8fc5da';
    ctx.font = 'bold 45px Arial';
    ctx.fillText(status, w / 2, 136);

    ctx.fillStyle = '#8da8b2';
    ctx.font = '23px Arial';
    ctx.fillText('HALON 1301 / ZONE HAZMAT-03', w / 2, 189);
    ctx.fillText('DO NOT ENTER DURING DISCHARGE', w / 2, 226);

    displayData.texture.needsUpdate = true;
    displayDirty = false;
  }

  function update(dt) {
    const step = Math.min(dt, 0.1);
    zeit += step;

    if (dischargeTime > 0) {
      dischargeTime = Math.max(0, dischargeTime - step);
    }

    const targetAngle = dischargeTime > 0 ? -1.25 : armed ? 0.18 : sabotaged ? -0.55 : 0;
    valveAngle += (targetAngle - valveAngle) * Math.min(1, step * 4.5);
    valveWheel.rotation.z = valveAngle;

    const pulse = 0.5 + 0.5 * Math.sin(zeit * 2.6);

    if (sabotaged) {
      statusMat.emissive.setHex(0xb51d24);
      statusMat.emissiveIntensity = 0.5 + pulse * 0.55;
      displayMat.emissive.setHex(0xb51d24);
      displayMat.emissiveIntensity = 0.4 + pulse * 0.2;
      buttonMaterials[2].emissiveIntensity = 0;
    } else if (dischargeTime > 0) {
      statusMat.emissive.setHex(0x8fc5da);
      statusMat.emissiveIntensity = 2.2 + pulse * 1.4;
      displayMat.emissive.setHex(0x8fc5da);
      displayMat.emissiveIntensity = 1.4 + pulse * 0.4;
      buttonMaterials[2].emissiveIntensity = 0;
    } else if (armed) {
      statusMat.emissive.setHex(0x6f9fb5);
      statusMat.emissiveIntensity = 0.8 + pulse * 1.1;
      displayMat.emissive.setHex(0x6f9fb5);
      displayMat.emissiveIntensity = 0.75 + pulse * 0.25;
      buttonMaterials[2].emissiveIntensity = 0.55 + pulse * 0.7;
    } else {
      statusMat.emissive.setHex(0x45616f);
      statusMat.emissiveIntensity = 0.12 + pulse * 0.12;
      displayMat.emissive.setHex(0x6f9fb5);
      displayMat.emissiveIntensity = 0.35;
      buttonMaterials[2].emissiveIntensity = 0.25;
    }

    const gasActive = dischargeTime > 0;
    for (const cloud of gasClouds) {
      cloud.visible = gasActive;
      if (gasActive) {
        const phase = 1 - dischargeTime / 5;
        const scale = 0.48 + phase * 1.45 + Math.sin(zeit * 4.2) * 0.07;
        cloud.scale.set(scale, scale * 0.82, scale);
      }
    }

    gasMat.opacity = gasActive
      ? Math.min(0.24, 0.07 + (5 - dischargeTime) * 0.042)
      : 0;

    if (displayDirty) drawDisplay();
  }

  const shelfMesh = shelf;
  shelfMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  // ---------------------------------------------------------
  // Öffentliche API und Aktionen.
  // ---------------------------------------------------------
  const api = {
    einschalten() {
      if (sabotaged) return false;
      armed = true;
      displayDirty = true;
      return true;
    },

    ausschalten() {
      armed = false;
      displayDirty = true;
      return true;
    },

    loeschungAusloesen() {
      if (!armed || sabotaged) return false;
      dischargeTime = 5;
      displayDirty = true;
      return true;
    },

    sabotieren() {
      sabotaged = true;
      armed = false;
      dischargeTime = 0;
      displayDirty = true;
      return true;
    },

    ventilSchliessen() {
      armed = false;
      dischargeTime = 0;
      displayDirty = true;
      return true;
    },

    get armed() {
      return armed;
    },

    get sabotaged() {
      return sabotaged;
    },

    get dischargeActive() {
      return dischargeTime > 0;
    },

    update(dt) {
      update(dt);
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'scharf',
      label: 'Halon-System scharf schalten',
      run: () => api.einschalten(),
    },
    {
      id: 'unscharf',
      label: 'Halon-System unschärf schalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'loeschung',
      label: 'Halon-Flutung sofort auslösen',
      run: () => api.loeschungAusloesen(),
    },
    {
      id: 'sabotage',
      label: 'Steuerung sabotieren und System deaktivieren',
      run: () => api.sabotieren(),
    },
  ];

  drawDisplay();
  return root;
}

// OBJ-015: Elektrisches Krankenbett der Krankenstation mit Vitalmonitor und Infusionsständer.
// Standobjekt; Ursprung = Mitte der Unterseite, Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'patient_bed',
  art: 'Standobjekt',
  masse: 'Bett 2,10 × 0,90 m; Liegehöhe ca. 0,90 m; Gesamtanlage ca. 2,43 × 1,97 × 2,28 m',
  wohin: 'ATL-009 Krankenstation / Infirmary, an einer Wand neben der Behandlungsecke',
  benutzen: 'INT_behandeln → Patienten behandeln, Respawn aktivieren, Vitalmonitor schalten und Kopfteil verstellen',
  lichter: 'LAMP_monitor (eisblau), LAMP_status (eisblau)',
  animation: 'Kopfteil fährt weich, Monitor pulsiert, Status- und Behandlungsleuchten reagieren',
  quelle: 'selbst gebaut nach OBJ-015-Beschreibung und Referenzbild',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'patient_bed';

  // ---------------------------------------------------------------
  // Materialien: irdische Medizintechnik, sauber und ohne Rost.
  // ---------------------------------------------------------------
  const weiss = new THREE.MeshStandardMaterial({
    name: 'bett_weiss', color: 0xe9eeec, metalness: 0.18, roughness: 0.38,
  });
  const hellgrau = new THREE.MeshStandardMaterial({
    name: 'bett_hellgrau', color: 0xc6cfce, metalness: 0.48, roughness: 0.32,
  });
  const stahl = new THREE.MeshStandardMaterial({
    name: 'bett_stahl', color: 0x718087, metalness: 0.78, roughness: 0.25,
  });
  const chrom = new THREE.MeshStandardMaterial({
    name: 'bett_chrom', color: 0xb8c5c8, metalness: 0.9, roughness: 0.18,
  });
  const gummi = new THREE.MeshStandardMaterial({
    name: 'bett_gummi', color: 0x171d20, metalness: 0.02, roughness: 0.88,
  });
  const matratzeMat = new THREE.MeshStandardMaterial({
    name: 'bett_matratze', color: 0xe2e8e4, metalness: 0, roughness: 0.88,
  });
  const bettzeug = new THREE.MeshStandardMaterial({
    name: 'bett_bettzeug', color: 0x78a5a8, metalness: 0, roughness: 0.94,
  });
  const deckenMat = new THREE.MeshStandardMaterial({
    name: 'bett_decken_falte', color: 0x8fb7b9, metalness: 0, roughness: 0.96,
  });
  const kissenMat = new THREE.MeshStandardMaterial({
    name: 'bett_kissen', color: 0xf1f1e9, metalness: 0, roughness: 0.97,
  });
  const statusMat = new THREE.MeshStandardMaterial({
    name: 'bett_status', color: 0x183038, emissive: 0x6fe3ff,
    emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.35,
  });
  const amberMat = new THREE.MeshStandardMaterial({
    name: 'bett_amber', color: 0x3a2913, emissive: 0xffb45b,
    emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.32,
  });
  const glasMat = new THREE.MeshStandardMaterial({
    name: 'bett_iv_glas', color: 0xb9e7e3, transparent: true, opacity: 0.46,
    metalness: 0.03, roughness: 0.18, depthWrite: false,
  });
  const fluessigkeitMat = new THREE.MeshStandardMaterial({
    name: 'infusion_fluessigkeit', color: 0x78b9bf, transparent: true,
    opacity: 0.72, metalness: 0, roughness: 0.25,
  });
  const schlauchMat = new THREE.MeshStandardMaterial({
    name: 'bett_schlauch', color: 0xd6e5e1, transparent: true,
    opacity: 0.78, metalness: 0, roughness: 0.3,
  });
  const kabelMat = new THREE.MeshStandardMaterial({
    name: 'bett_kabel', color: 0x263238, metalness: 0.05, roughness: 0.72,
  });
  const collisionMat = new THREE.MeshBasicMaterial({
    name: 'kollision', transparent: true, opacity: 0,
    depthWrite: false, colorWrite: false,
  });

  // ---------------------------------------------------------------
  // Geometrie-Hilfen
  // ---------------------------------------------------------------
  function box(w, h, d, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, material, x, y, z, parent = root, axis = 'y', segments = 20) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, segments);
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    if (axis === 'z') geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function roundedShape(w, h, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2;
    const x1 = w / 2;
    const y0 = -h / 2;
    const y1 = h / 2;
    const radius = Math.min(r, w * 0.45, h * 0.45);
    s.moveTo(x0 + radius, y0);
    s.lineTo(x1 - radius, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + radius);
    s.lineTo(x1, y1 - radius);
    s.quadraticCurveTo(x1, y1, x1 - radius, y1);
    s.lineTo(x0 + radius, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - radius);
    s.lineTo(x0, y0 + radius);
    s.quadraticCurveTo(x0, y0, x0 + radius, y0);
    return s;
  }

  // Flacher Körper mit abgerundeten Ecken: Breite X, Tiefe Z, Höhe Y.
  function roundedSlab(w, d, h, r, material, x, y, z, parent = root) {
    const bevel = Math.min(0.016, h * 0.18, r * 0.4);
    const geo = new THREE.ExtrudeGeometry(roundedShape(w, d, r), {
      depth: Math.max(0.001, h - bevel * 2),
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 5,
    });
    geo.translate(0, 0, -(h - bevel * 2) / 2);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // Senkrechtes Paneel: Breite X, Höhe Y, Dicke Z.
  function roundedPanel(w, h, d, r, material, x, y, z, parent = root) {
    const bevel = Math.min(0.012, d * 0.2, r * 0.35);
    const geo = new THREE.ExtrudeGeometry(roundedShape(w, h, r), {
      depth: Math.max(0.001, d - bevel * 2),
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 5,
    });
    geo.translate(0, 0, -(d - bevel * 2) / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function tube(points, radius, material, parent = root, segments = 30) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 7, false), material);
    parent.add(mesh);
    return mesh;
  }

  // ---------------------------------------------------------------
  // Untergestell, Hubsäule und Liegeflächenrahmen
  // ---------------------------------------------------------------
  box(0.58, 0.2, 0.58, hellgrau, 0, 0.43, 0);
  box(0.68, 0.11, 0.68, stahl, 0, 0.29, 0);
  box(0.52, 0.16, 0.82, weiss, 0, 0.55, 0);

  for (const side of [-1, 1]) {
    box(0.075, 0.1, 1.64, stahl, side * 0.355, 0.45, 0);
  }
  for (const z of [-0.69, 0.69]) {
    box(0.72, 0.09, 0.075, stahl, 0, 0.45, z);
  }

  roundedSlab(0.89, 2.02, 0.075, 0.055, hellgrau, 0, 0.715, 0);
  box(0.86, 0.025, 1.86, stahl, 0, 0.772, 0.03);

  // Geteilter Matratzenaufsatz: flacher Teil und separat verstellbarer Kopfteil.
  const matratze = roundedSlab(0.84, 1.48, 0.135, 0.07, matratzeMat, 0, 0.835, 0.28);
  matratze.name = 'Bett_Matratze';

  const kopfgruppe = new THREE.Group();
  kopfgruppe.name = 'Bett_Kopfteil_Verstellbar';
  kopfgruppe.position.set(0, 0.775, -0.47);
  root.add(kopfgruppe);

  roundedSlab(0.86, 0.56, 0.06, 0.045, hellgrau, 0, 0.015, -0.28, kopfgruppe);
  roundedSlab(0.84, 0.55, 0.135, 0.07, matratzeMat, 0, 0.07, -0.275, kopfgruppe);
  roundedSlab(0.61, 0.27, 0.105, 0.075, kissenMat, 0, 0.17, -0.455, kopfgruppe);
  roundedSlab(0.84, 0.17, 0.028, 0.025, bettzeug, 0, 0.151, -0.095, kopfgruppe);

  // Weiß-blaugrüne Bettwäsche, leicht über die Matratze gelegt.
  roundedSlab(0.855, 1.08, 0.043, 0.06, bettzeug, 0, 0.918, 0.45);
  roundedSlab(0.86, 0.27, 0.05, 0.045, deckenMat, 0, 0.941, 0.9);
  roundedSlab(0.82, 0.12, 0.018, 0.035, deckenMat, 0, 0.965, 0.72);

  // ---------------------------------------------------------------
  // Kopf- und Fußbord mit verdeckten Halterungen
  // ---------------------------------------------------------------
  for (const side of [-1, 1]) {
    cylinder(0.035, 0.49, stahl, side * 0.39, 0.69, -1.055);
    cylinder(0.035, 0.4, stahl, side * 0.39, 0.66, 1.055);
  }

  const kopfbord = roundedPanel(0.95, 0.47, 0.075, 0.075, weiss, 0, 0.915, -1.075);
  kopfbord.name = 'Bett_Kopfbord';
  roundedPanel(0.54, 0.11, 0.014, 0.035, statusMat, 0, 0.99, -1.031);

  const fussbord = roundedPanel(0.95, 0.38, 0.075, 0.075, weiss, 0, 0.875, 1.075);
  fussbord.name = 'Bett_Fussbord';
  roundedPanel(0.55, 0.085, 0.014, 0.028, statusMat, 0, 0.935, 1.119);

  // Kleine Bedienblende am Fußbord.
  roundedPanel(0.22, 0.11, 0.012, 0.02, stahl, 0.25, 0.79, 1.119);
  for (let i = 0; i < 3; i++) {
    cylinder(0.013, 0.009, i === 2 ? amberMat : statusMat,
      0.18 + i * 0.07, 0.79, 1.129, root, 'z', 12);
  }

  // Statusleiste unter der Liegefläche.
  roundedPanel(0.58, 0.035, 0.014, 0.014, statusMat, 0, 0.68, 1.005);

  // ---------------------------------------------------------------
  // Seitengitter: Rohrrahmen mit hellem Kunststoffpanel
  // ---------------------------------------------------------------
  for (const side of [-1, 1]) {
    const rail = new THREE.Group();
    rail.name = side > 0 ? 'Bett_Seitengitter_rechts' : 'Bett_Seitengitter_links';
    rail.position.x = side * 0.485;
    root.add(rail);

    for (const z of [-0.22, 0.72]) {
      cylinder(0.023, 0.42, chrom, 0, 0.96, z, rail);
    }
    cylinder(0.025, 1.02, chrom, 0, 1.17, 0.25, rail, 'z');
    cylinder(0.022, 1.02, chrom, 0, 0.84, 0.25, rail, 'z');

    roundedSlab(0.055, 0.86, 0.22, 0.045, weiss, 0, 1.015, 0.25, rail);
    roundedPanel(0.018, 0.075, 0.31, 0.025, statusMat,
      side * 0.031, 1.035, 0.31, rail);
  }

  // ---------------------------------------------------------------
  // Vier Rollen mit Gabeln und Bremshebeln
  // ---------------------------------------------------------------
  const wheelGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.065, 20);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = new THREE.InstancedMesh(wheelGeo, gummi, 4);
  wheels.name = 'Bett_Rollen';

  const forkGeo = new THREE.BoxGeometry(0.075, 0.13, 0.075);
  const forks = new THREE.InstancedMesh(forkGeo, stahl, 4);
  const brakeGeo = new THREE.BoxGeometry(0.1, 0.018, 0.055);
  const brakes = new THREE.InstancedMesh(brakeGeo, amberMat, 2);

  const dummy = new THREE.Object3D();
  let wi = 0;
  let bi = 0;
  for (const x of [-0.37, 0.37]) {
    for (const z of [-0.74, 0.74]) {
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(x, 0.085, z);
      dummy.updateMatrix();
      wheels.setMatrixAt(wi, dummy.matrix);

      dummy.position.set(x, 0.185, z);
      dummy.updateMatrix();
      forks.setMatrixAt(wi, dummy.matrix);

      if (z > 0) {
        dummy.position.set(x, 0.16, z + 0.045);
        dummy.updateMatrix();
        brakes.setMatrixAt(bi, dummy.matrix);
        bi++;
      }
      wi++;
    }
  }
  wheels.instanceMatrix.needsUpdate = true;
  forks.instanceMatrix.needsUpdate = true;
  brakes.instanceMatrix.needsUpdate = true;
  root.add(wheels, forks, brakes);

  // ---------------------------------------------------------------
  // Vitalmonitor auf einem echten fünfarmigen Rollständer
  // ---------------------------------------------------------------
  const monitor = new THREE.Group();
  monitor.name = 'Vitalmonitor';
  monitor.position.set(1.05, 0, -0.48);
  root.add(monitor);

  cylinder(0.11, 0.1, stahl, 0, 0.14, 0, monitor);

  const spokeGeo = new THREE.BoxGeometry(0.32, 0.038, 0.052);
  const monitorSpokes = new THREE.InstancedMesh(spokeGeo, stahl, 5);
  const monitorWheelGeo = new THREE.CylinderGeometry(0.037, 0.037, 0.035, 12);
  monitorWheelGeo.rotateZ(Math.PI / 2);
  const monitorWheels = new THREE.InstancedMesh(monitorWheelGeo, gummi, 5);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    dummy.rotation.set(0, a, 0);
    dummy.position.set(Math.sin(a) * 0.145, 0.085, Math.cos(a) * 0.145);
    dummy.updateMatrix();
    monitorSpokes.setMatrixAt(i, dummy.matrix);

    dummy.rotation.set(0, 0, 0);
    dummy.position.set(Math.sin(a) * 0.29, 0.038, Math.cos(a) * 0.29);
    dummy.updateMatrix();
    monitorWheels.setMatrixAt(i, dummy.matrix);
  }
  monitorSpokes.instanceMatrix.needsUpdate = true;
  monitorWheels.instanceMatrix.needsUpdate = true;
  monitor.add(monitorSpokes, monitorWheels);

  cylinder(0.026, 1.18, stahl, 0, 0.77, 0, monitor);
  cylinder(0.035, 0.18, hellgrau, 0, 1.38, 0, monitor);
  box(0.29, 0.035, 0.04, stahl, 0, 1.44, 0, monitor);

  const monitorBody = roundedPanel(0.58, 0.42, 0.11, 0.055, weiss, 0, 1.53, 0, monitor);
  monitorBody.name = 'Monitor_Gehäuse';
  roundedPanel(0.54, 0.035, 0.014, 0.012, stahl, 0, 1.302, 0.052, monitor);

  // Monitoranzeige mit gemaltem EKG, Kurven und Messwerten.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#06151a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#123a42';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#70ffb0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= 330; x += 4) {
    const phase = x % 64;
    let y = 165;
    if (phase >= 8 && phase < 14) y = 128;
    else if (phase >= 14 && phase < 20) y = 195;
    else if (phase >= 20 && phase < 26) y = 72;
    else if (phase >= 26 && phase < 32) y = 178;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#67dfff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= 330; x += 3) {
    const y = 55 + Math.sin(x * 0.065) * 22 + Math.sin(x * 0.021) * 8;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#d3c56b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= 330; x += 5) {
    const y = 235 + Math.sin(x * 0.035) * 18;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#83ffbd';
  ctx.font = 'bold 30px monospace';
  ctx.fillText('72', 355, 55);
  ctx.font = 'bold 23px monospace';
  ctx.fillText('98%', 355, 92);
  ctx.fillText('12', 355, 126);
  ctx.fillStyle = '#c3fff0';
  ctx.font = '16px monospace';
  ctx.fillText('ECG   SpO2   RESP', 18, 292);

  const screenTexture = new THREE.CanvasTexture(canvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshStandardMaterial({
    name: 'monitor_bildschirm',
    color: 0xffffff,
    map: screenTexture,
    emissive: 0x6fe3ff,
    emissiveMap: screenTexture,
    emissiveIntensity: 0.8,
    metalness: 0.04,
    roughness: 0.24,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.305), screenMat);
  screen.position.set(0, 1.53, 0.057);
  monitor.add(screen);

  const buttonGeo = new THREE.BoxGeometry(0.035, 0.022, 0.012);
  const monitorButtons = new THREE.InstancedMesh(buttonGeo, stahl, 4);
  for (let i = 0; i < 4; i++) {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(-0.225 + i * 0.075, 1.302, 0.063);
    dummy.updateMatrix();
    monitorButtons.setMatrixAt(i, dummy.matrix);
  }
  monitorButtons.instanceMatrix.needsUpdate = true;
  monitor.add(monitorButtons);
  box(0.045, 0.018, 0.012, amberMat, 0.225, 1.302, 0.064, monitor);

  // Kabel vom Monitor zum Bett, vollständig angeschlossen.
  tube([
    [1.05, 1.3, -0.54],
    [1.0, 0.95, -0.55],
    [0.84, 0.62, -0.48],
    [0.62, 0.72, -0.34],
    [0.5, 0.87, -0.2],
  ], 0.008, kabelMat);

  // ---------------------------------------------------------------
  // Infusionsständer neben dem Kopfende
  // ---------------------------------------------------------------
  const infusion = new THREE.Group();
  infusion.name = 'Infusionsstaender';
  infusion.position.set(-0.82, 0, -0.55);
  root.add(infusion);

  cylinder(0.105, 0.09, stahl, 0, 0.13, 0, infusion);

  const ivSpokeGeo = new THREE.BoxGeometry(0.29, 0.038, 0.05);
  const ivSpokes = new THREE.InstancedMesh(ivSpokeGeo, stahl, 5);
  const ivWheelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.032, 12);
  ivWheelGeo.rotateZ(Math.PI / 2);
  const ivWheels = new THREE.InstancedMesh(ivWheelGeo, gummi, 5);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    dummy.rotation.set(0, a, 0);
    dummy.position.set(Math.sin(a) * 0.135, 0.08, Math.cos(a) * 0.135);
    dummy.updateMatrix();
    ivSpokes.setMatrixAt(i, dummy.matrix);

    dummy.rotation.set(0, 0, 0);
    dummy.position.set(Math.sin(a) * 0.265, 0.036, Math.cos(a) * 0.265);
    dummy.updateMatrix();
    ivWheels.setMatrixAt(i, dummy.matrix);
  }
  ivSpokes.instanceMatrix.needsUpdate = true;
  ivWheels.instanceMatrix.needsUpdate = true;
  infusion.add(ivSpokes, ivWheels);

  cylinder(0.018, 1.78, stahl, 0, 1.02, 0, infusion);
  cylinder(0.016, 0.48, stahl, 0, 1.91, 0, infusion, 'x');
  cylinder(0.025, 0.1, hellgrau, 0, 1.82, 0, infusion);

  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 18), chrom);
    loop.position.set(side * 0.19, 1.93, 0);
    loop.rotation.y = Math.PI / 2;
    infusion.add(loop);
  }

  const bag = roundedPanel(0.17, 0.31, 0.065, 0.045, glasMat, -0.19, 1.73, 0, infusion);
  bag.name = 'Infusionsbeutel';
  roundedPanel(0.125, 0.16, 0.012, 0.02, fluessigkeitMat, -0.19, 1.675, 0.036, infusion);
  roundedPanel(0.095, 0.06, 0.008, 0.012, weiss, -0.19, 1.795, 0.038, infusion);
  cylinder(0.011, 0.07, weiss, -0.19, 1.895, 0, infusion);
  cylinder(0.008, 0.035, stahl, -0.19, 1.56, 0, infusion);

  // Infusionsschlauch vom Beutel bis zum Seitengitter.
  tube([
    [-1.01, 1.545, -0.55],
    [-0.99, 1.28, -0.51],
    [-0.85, 1.02, -0.4],
    [-0.65, 0.94, -0.27],
    [-0.5, 1.02, -0.13],
  ], 0.006, schlauchMat);

  // Kleine Klemmenbefestigung des Schlauchs am Gitter.
  roundedPanel(0.035, 0.045, 0.025, 0.01, weiss, -0.492, 1.02, -0.13);

  // ---------------------------------------------------------------
  // Kollisionskörper
  // ---------------------------------------------------------------
  const colBett = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.96, 2.22), collisionMat);
  colBett.name = 'COL_bett';
  colBett.position.set(0, 0.5, 0);
  root.add(colBett);

  const colMonitor = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.74, 0.58), collisionMat);
  colMonitor.name = 'COL_monitor_stander';
  colMonitor.position.set(1.05, 0.87, -0.48);
  root.add(colMonitor);

  const colInfusion = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), collisionMat);
  colInfusion.name = 'COL_infusionsstaender';
  colInfusion.position.set(-0.82, 0.07, -0.55);
  root.add(colInfusion);

  // ---------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ---------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_behandeln';
  use.position.set(0, 1.03, 1.32);
  use.userData = { label: 'Patient behandeln / Respawn-Punkt', radius: 0.9 };
  root.add(use);

  const lampMonitor = new THREE.Object3D();
  lampMonitor.name = 'LAMP_monitor';
  lampMonitor.position.set(1.05, 1.5, -0.36);
  lampMonitor.userData = { color: '#6fe3ff', intensity: 5, distance: 3.2 };
  root.add(lampMonitor);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0, 0.8, 0.93);
  lampStatus.userData = { color: '#6fe3ff', intensity: 2.2, distance: 2.0 };
  root.add(lampStatus);

  // ---------------------------------------------------------------
  // Zustand, API und selbstständige Animation
  // ---------------------------------------------------------------
  let zeit = 0;
  let letzte = null;
  let monitorAn = true;
  let heilEffekt = 0;
  let respawnAktiv = false;
  let behandlungen = 0;
  let kopfZiel = 0;
  let kopfIst = 0;

  function update(dt) {
    zeit += dt;

    kopfIst += (kopfZiel - kopfIst) * Math.min(1, dt * 4.5);
    kopfgruppe.rotation.x = kopfIst;

    const puls = 0.72
      + Math.sin(zeit * 3.2) * 0.12
      + Math.sin(zeit * 7.1) * 0.035;

    screenMat.emissiveIntensity = monitorAn ? puls : 0.025;
    screenMat.color.setHex(monitorAn ? 0xffffff : 0x10191c);
    amberMat.emissiveIntensity = monitorAn ? 0.4 + puls * 0.25 : 0.05;

    heilEffekt = Math.max(0, heilEffekt - dt * 0.3);
    const heilPuls = heilEffekt > 0
      ? 0.4 + Math.abs(Math.sin(zeit * 7.5)) * 3.2 * heilEffekt
      : 0.28 + Math.sin(zeit * 2.4) * 0.08;

    statusMat.emissiveIntensity = heilPuls;
    lampStatus.userData.intensity = 1.8 + heilEffekt * 2.5;
  }

  monitorBody.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.05));
    letzte = now;
  };

  const actions = [
    {
      id: 'behandeln',
      label: 'Patient behandeln und stabilisieren',
      run: () => api.behandeln(),
    },
    {
      id: 'respawn',
      label: 'Respawn-Punkt aktivieren',
      run: () => api.respawnAktivieren(),
    },
    {
      id: 'monitor',
      label: 'Vitalmonitor ausschalten',
      run: () => api.monitorSchalten(),
    },
    {
      id: 'kopf_hoch',
      label: 'Kopfteil anheben',
      run: () => api.kopfteilHoch(),
    },
    {
      id: 'kopf_runter',
      label: 'Kopfteil absenken',
      run: () => api.kopfteilRunter(),
    },
  ];

  const api = {
    behandeln() {
      behandlungen++;
      heilEffekt = 1;
      monitorAn = true;
      const monitorAction = actions.find((a) => a.id === 'monitor');
      if (monitorAction) monitorAction.label = 'Vitalmonitor ausschalten';
    },

    respawnAktivieren() {
      respawnAktiv = true;
      root.userData.respawnPoint = { x: 0, y: 0, z: 0.72 };
      if (typeof root.userData.onRespawn === 'function') {
        root.userData.onRespawn(root.userData.respawnPoint);
      }
    },

    monitorSchalten() {
      monitorAn = !monitorAn;
      const monitorAction = actions.find((a) => a.id === 'monitor');
      if (monitorAction) {
        monitorAction.label = monitorAn
          ? 'Vitalmonitor ausschalten'
          : 'Vitalmonitor einschalten';
      }
    },

    kopfteilHoch() {
      kopfZiel = 0.55;
    },

    kopfteilRunter() {
      kopfZiel = 0;
    },

    get monitorAn() { return monitorAn; },
    get respawnAktiv() { return respawnAktiv; },
    get behandlungen() { return behandlungen; },
    get kopfteilWinkel() { return kopfIst; },
  };

  root.userData.api = api;
  root.userData.actions = actions;
  root.userData.update = update;
  root.userData.respawnPoint = null;

  if (opts && typeof opts.onRespawn === 'function') {
    root.userData.onRespawn = opts.onRespawn;
  }

  return root;
}

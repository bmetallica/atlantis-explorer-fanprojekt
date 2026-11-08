// control_crystal.js
// Master-Steuerkristall für Atlantis / Ancient-Steuersysteme
import * as THREE from 'three';

export const steckbrief = {
  name: 'control_crystal',
  art: 'Kleinteil / Schlüssel-Item',
  masse: '0,12 × 0,08 × 0,015 (L × B × H, m)',
  wohin: 'Kontrollraum, Kommandozentrale, Archive, antiker Konsolen',
  benutzen: 'INT_master_crystal → Kristall aktivieren / Leuchtkontakt prüfen',
  lichter: 'LAMP_master_crystal (eisblau)',
  animation: 'Eingeschlossene Leiterbahnen pulsieren bläulich; Aktivierung erhöht die Leuchtstärke',
  quelle: 'selbst gebaut, orientiert an Pegasus-Antiker-Steuerkristallen',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'control_crystal';

  // ------------------------------------------------------------
  // Hauptform:
  // Flaches, unregelmäßiges Kristallplättchen in der XZ-Ebene.
  // Der Ursprung liegt in der Mitte der Unterseite.
  // Vorderseite / Leserichtung zeigt nach +Z.
  // ------------------------------------------------------------

  const kristallForm = new THREE.Shape();

  // Unregelmäßiger, abgeschnittener Handflächen-Umriss.
  kristallForm.moveTo(-0.060, -0.040);
  kristallForm.lineTo(0.026, -0.040);
  kristallForm.lineTo(0.026, -0.032);
  kristallForm.lineTo(0.048, -0.032);
  kristallForm.lineTo(0.048, 0.008);
  kristallForm.lineTo(0.059, 0.008);
  kristallForm.lineTo(0.059, 0.027);
  kristallForm.lineTo(0.012, 0.027);
  kristallForm.lineTo(0.012, 0.038);
  kristallForm.lineTo(-0.034, 0.038);
  kristallForm.lineTo(-0.034, 0.028);
  kristallForm.lineTo(-0.060, 0.028);
  kristallForm.lineTo(-0.060, 0.008);
  kristallForm.lineTo(-0.049, 0.008);
  kristallForm.lineTo(-0.049, -0.016);
  kristallForm.lineTo(-0.060, -0.016);
  kristallForm.closePath();

  const kristallGeo = new THREE.ExtrudeGeometry(kristallForm, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.0012,
    bevelThickness: 0.0012,
    curveSegments: 2,
  });

  // Die Form wird aus der XY-Ebene in die liegende XZ-Ebene gelegt.
  kristallGeo.rotateX(-Math.PI / 2);
  kristallGeo.computeBoundingBox();

  const bb = kristallGeo.boundingBox;
  const centerX = (bb.min.x + bb.max.x) * 0.5;
  const centerZ = (bb.min.z + bb.max.z) * 0.5;

  // Nach der Verschiebung liegt der tiefste Punkt bei y = 0.
  kristallGeo.translate(-centerX, -bb.min.y, -centerZ);

  const kristallMat = new THREE.MeshStandardMaterial({
    name: 'KIT_glass',
    color: 0xb9e8f2,
    metalness: 0.06,
    roughness: 0.10,
    transparent: true,
    opacity: 0.38,
    emissive: 0x164d68,
    emissiveIntensity: 0.30,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const kristall = new THREE.Mesh(kristallGeo, kristallMat);
  kristall.name = 'Kristallplättchen';
  kristall.castShadow = true;
  kristall.receiveShadow = true;
  root.add(kristall);

  // ------------------------------------------------------------
  // Eingeschlossene Leiterbahnen.
  // Sie liegen innerhalb des transparenten Kristalls.
  // ------------------------------------------------------------

  const leiterMatBlau = new THREE.MeshStandardMaterial({
    name: 'Leiterbahn_blau',
    color: 0x167dcc,
    metalness: 0.25,
    roughness: 0.22,
    emissive: 0x168cff,
    emissiveIntensity: 1.0,
  });

  const leiterMatGruen = new THREE.MeshStandardMaterial({
    name: 'Leiterbahn_gruen',
    color: 0x2b9d68,
    metalness: 0.22,
    roughness: 0.24,
    emissive: 0x28d47b,
    emissiveIntensity: 0.85,
  });

  const leiterMatRot = new THREE.MeshStandardMaterial({
    name: 'Leiterbahn_rot',
    color: 0xb33d42,
    metalness: 0.20,
    roughness: 0.24,
    emissive: 0xff3e49,
    emissiveIntensity: 0.80,
  });

  const leiterMatSilber = new THREE.MeshStandardMaterial({
    name: 'Leiterbahn_silber',
    color: 0x9bb6c2,
    metalness: 0.72,
    roughness: 0.24,
    emissive: 0x1b6c8a,
    emissiveIntensity: 0.30,
  });

  const spurGeo = new THREE.BoxGeometry(1, 0.0009, 0.0015);
  const spurLinien = [];

  function spur(x1, z1, x2, z2, material, breite = 0.0015) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const laenge = Math.sqrt(dx * dx + dz * dz);

    if (laenge < 0.0001) return;

    const mesh = new THREE.Mesh(spurGeo, material);
    mesh.scale.x = laenge;
    mesh.scale.z = breite / 0.0015;
    mesh.position.set(
      (x1 + x2) * 0.5,
      0.0075,
      (z1 + z2) * 0.5,
    );
    mesh.rotation.y = -Math.atan2(dz, dx);
    root.add(mesh);
    spurLinien.push(mesh);
  }

  // Hauptbus: blau, mit mehreren Abzweigen.
  spur(-0.045, -0.018, 0.038, -0.018, leiterMatBlau, 0.0022);
  spur(0.038, -0.018, 0.038, 0.012, leiterMatBlau, 0.0022);
  spur(0.038, 0.012, -0.025, 0.012, leiterMatBlau, 0.0022);
  spur(-0.025, 0.012, -0.025, 0.028, leiterMatBlau, 0.0018);

  // Grüne Steuerpfade.
  spur(-0.045, -0.018, -0.045, 0.005, leiterMatGruen, 0.0018);
  spur(-0.045, 0.005, -0.010, 0.005, leiterMatGruen, 0.0018);
  spur(-0.010, 0.005, -0.010, 0.026, leiterMatGruen, 0.0018);
  spur(-0.010, 0.026, 0.020, 0.026, leiterMatGruen, 0.0018);
  spur(0.020, 0.026, 0.020, 0.010, leiterMatGruen, 0.0016);

  // Rote Status- und Fehlerpfade.
  spur(-0.030, -0.025, -0.030, -0.005, leiterMatRot, 0.0016);
  spur(-0.030, -0.005, 0.008, -0.005, leiterMatRot, 0.0016);
  spur(0.008, -0.005, 0.008, -0.030, leiterMatRot, 0.0014);
  spur(0.008, -0.030, 0.035, -0.030, leiterMatRot, 0.0014);
  spur(0.025, -0.018, 0.025, -0.004, leiterMatRot, 0.0013);

  // Feine Querverbindungen und Steuerknoten.
  spur(-0.015, -0.025, -0.015, -0.018, leiterMatSilber, 0.0012);
  spur(-0.015, -0.025, -0.002, -0.025, leiterMatSilber, 0.0012);
  spur(0.000, -0.018, 0.000, -0.005, leiterMatSilber, 0.0012);
  spur(0.000, -0.005, -0.017, -0.005, leiterMatSilber, 0.0012);
  spur(0.014, 0.012, 0.014, 0.026, leiterMatSilber, 0.0011);
  spur(0.014, 0.019, 0.027, 0.019, leiterMatSilber, 0.0011);

  // ------------------------------------------------------------
  // Kleine Chip-Felder im Kristall.
  // ------------------------------------------------------------

  const chipMat = new THREE.MeshStandardMaterial({
    name: 'Steuerchip',
    color: 0x1b3445,
    metalness: 0.72,
    roughness: 0.30,
    emissive: 0x0b7c9f,
    emissiveIntensity: 0.35,
  });

  const chipGeo = new THREE.BoxGeometry(0.010, 0.0014, 0.007);
  const chips = [];

  const chipPositionen = [
    [-0.034, -0.020],
    [-0.012, -0.020],
    [0.012, -0.020],
    [0.030, -0.020],
    [-0.020, 0.018],
    [0.002, 0.018],
    [0.025, 0.018],
    [-0.006, 0.002],
  ];

  for (const [x, z] of chipPositionen) {
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(x, 0.0082, z);
    chip.rotation.y = Math.sin(x * 91 + z * 43) * 0.08;
    root.add(chip);
    chips.push(chip);
  }

  // Kleine Kontaktflächen an der vorderen Kante.
  const kontaktMat = new THREE.MeshStandardMaterial({
    name: 'Kontaktflaeche',
    color: 0xc0a06a,
    metalness: 0.88,
    roughness: 0.20,
    emissive: 0x8a5424,
    emissiveIntensity: 0.18,
  });

  const kontaktGeo = new THREE.BoxGeometry(0.008, 0.0012, 0.003);
  const kontakte = [];

  for (let i = 0; i < 4; i++) {
    const kontakt = new THREE.Mesh(kontaktGeo, kontaktMat);
    kontakt.position.set(-0.035 + i * 0.023, 0.0092, -0.034);
    root.add(kontakt);
    kontakte.push(kontakt);
  }

  // Kleine optische Statusmarkierung an der Rückseite.
  const statusMat = new THREE.MeshStandardMaterial({
    name: 'Statusmarkierung',
    color: 0x7de8ff,
    metalness: 0.15,
    roughness: 0.25,
    emissive: 0x27c8ff,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.9,
  });

  const statusGeo = new THREE.BoxGeometry(0.012, 0.0007, 0.0014);
  const statusMarkierung = new THREE.Mesh(statusGeo, statusMat);
  statusMarkierung.position.set(0.032, 0.0094, 0.024);
  statusMarkierung.rotation.y = -0.35;
  root.add(statusMarkierung);

  // ------------------------------------------------------------
  // Kollision, Benutzen-Punkt und Licht.
  // ------------------------------------------------------------

  const col = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.08));
  col.name = 'COL_control_crystal';
  col.position.set(0, 0.0075, 0);
  col.userData.aktiv = true;
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_master_crystal';
  use.position.set(0, 0.075, 0.015);
  use.userData = {
    label: 'Master-Steuerkristall',
    radius: 0.65,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_master_crystal';
  lamp.position.set(0, 0.035, 0);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 2.0,
    distance: 1.8,
  };
  root.add(lamp);

  // ------------------------------------------------------------
  // Zustand und Animation.
  // ------------------------------------------------------------

  let aktiviert = false;
  let puls = 0;
  let letzterZeitpunkt = null;

  function update(dt) {
    puls += dt;

    const zielIntensitaet = aktiviert ? 1.9 : 0.55;
    const pulsWert = 0.75 + 0.25 * Math.sin(puls * 3.4);

    kristallMat.emissiveIntensity +=
      (zielIntensitaet * 0.22 - kristallMat.emissiveIntensity) *
      Math.min(1, dt * 5);

    leiterMatBlau.emissiveIntensity =
      (aktiviert ? 1.8 : 0.65) * pulsWert;

    leiterMatGruen.emissiveIntensity =
      (aktiviert ? 1.35 : 0.48) *
      (0.72 + 0.28 * Math.sin(puls * 2.5 + 1.1));

    leiterMatRot.emissiveIntensity =
      (aktiviert ? 1.1 : 0.35) *
      (0.70 + 0.30 * Math.sin(puls * 2.1 + 2.4));

    leiterMatSilber.emissiveIntensity =
      (aktiviert ? 0.75 : 0.22) * pulsWert;

    chipMat.emissiveIntensity = aktiviert
      ? 0.65 + 0.35 * Math.sin(puls * 4.2)
      : 0.22;

    kontaktMat.emissiveIntensity = aktiviert ? 0.45 : 0.12;
    statusMat.emissiveIntensity = aktiviert
      ? 1.15 + 0.45 * Math.sin(puls * 4.8)
      : 0.35;

    // Dezente, zeitversetzte Bewegung der eingeschlossenen Leiterbahnen.
    for (let i = 0; i < spurLinien.length; i++) {
      spurLinien[i].scale.y =
        0.85 + 0.15 * Math.sin(puls * 2.8 + i * 0.31);
    }

    const leuchteStaerke = aktiviert ? 0.92 : 0.45;
    lamp.userData.intensity = aktiviert
      ? 4.2 * leuchteStaerke
      : 2.0 * leuchteStaerke;
  }

  kristall.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (letzterZeitpunkt !== null) {
      update(Math.min(now - letzterZeitpunkt, 0.1));
    }

    letzterZeitpunkt = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API.
  // ------------------------------------------------------------

  const api = {
    aktivieren() {
      aktiviert = true;
    },

    deaktivieren() {
      aktiviert = false;
    },

    umschalten() {
      aktiviert = !aktiviert;
    },

    get aktiviert() {
      return aktiviert;
    },

    get status() {
      return aktiviert
        ? 'Aktiv – Steuerkristall leuchtet'
        : 'Bereitschaft – Leuchtkontakt schwach';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'aktivieren',
      label: 'Steuerkristall aktivieren',
      run: () => api.aktivieren(),
    },
    {
      id: 'deaktivieren',
      label: 'Steuerkristall deaktivieren',
      run: () => api.deaktivieren(),
    },
    {
      id: 'status',
      label: 'Leuchtkontakt prüfen',
      run: () => api.status,
    },
  ];

  return root;
}

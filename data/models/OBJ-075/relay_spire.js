// Externe Relaisantenne des Kontrollturms – Spielergänzung, angelehnt an OBJ-047.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'relay_spire',
  art: 'Standobjekt',
  masse: '1,50 × 8,00 × 1,50 (B × H × T, m)',
  wohin: 'ATL-048 · Balkon / Außenbalkon, auf einer festen Plattform am Kontrollturm',
  benutzen: 'INT_senden → Menü mit Signalversand und Ein-/Ausschalten',
  lichter: 'LAMP_bake, LAMP_signal, LAMP_status (eisblau und bernsteinfarben)',
  animation: 'Bake pulsiert; beim Signalversand blinkt sie und sendet zwei horizontal expandierende Signalringe',
  quelle: 'selbst gebaut (Spielergänzung, angelehnt an OBJ-047)',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'relay_spire';

  const matPearl = kit('pillar');
  const matHull = kit('hull');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');

  const matBeacon = new THREE.MeshStandardMaterial({
    name: 'relay_bake',
    color: 0xb8f2ff,
    emissive: 0x42cfff,
    emissiveIntensity: 1.5,
    metalness: 0.08,
    roughness: 0.22,
  });

  const matStatus = new THREE.MeshStandardMaterial({
    name: 'relay_status',
    color: 0xffd39a,
    emissive: 0xff9d35,
    emissiveIntensity: 0.7,
    metalness: 0.12,
    roughness: 0.3,
  });

  const pulseMaterials = [0, 1].map((index) =>
    new THREE.MeshStandardMaterial({
      name: `relay_signalring_${index === 0 ? 'a' : 'b'}`,
      color: 0x9cecff,
      emissive: 0x42d7ff,
      emissiveIntensity: 3.2,
      metalness: 0.0,
      roughness: 0.25,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );

  const up = new THREE.Vector3(0, 1, 0);
  const tempDir = new THREE.Vector3();
  const tempPos = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();
  const tempScale = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();

  function setRodInstance(mesh, index, start, end) {
    tempDir.subVectors(end, start);
    const length = tempDir.length();
    tempDir.normalize();
    tempPos.addVectors(start, end).multiplyScalar(0.5);
    tempQuat.setFromUnitVectors(up, tempDir);
    tempScale.set(1, length, 1);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    mesh.setMatrixAt(index, tempMatrix);
  }

  // --- Sockel: Ursprung liegt in der Mitte der Unterseite bei y = 0.
  const sockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.72, 0.16, 40),
    matDark
  );
  sockel.position.y = 0.08;
  root.add(sockel);

  const sockelKante = new THREE.Mesh(
    new THREE.TorusGeometry(0.715, 0.032, 6, 32),
    matRail
  );
  sockelKante.rotation.x = Math.PI / 2;
  sockelKante.position.y = 0.155;
  root.add(sockelKante);

  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.69, 0.69, 0.07, 32),
    matHull
  );
  deck.position.y = 0.195;
  root.add(deck);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.48, 0.30, 32),
    matPearl
  );
  plinth.position.y = 0.38;
  root.add(plinth);

  const plinthRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.405, 0.035, 5, 24),
    matCopper
  );
  plinthRing.rotation.x = Math.PI / 2;
  plinthRing.position.y = 0.51;
  root.add(plinthRing);

  // --- Unterer Mast, Servicekragen und Bernstein-Statusanzeige.
  const lowerMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.19, 2.06, 24),
    matPearl
  );
  lowerMast.position.y = 1.47;
  root.add(lowerMast);

  const serviceCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.25, 0.25, 24),
    matHull
  );
  serviceCollar.position.y = 1.13;
  root.add(serviceCollar);

  const serviceInset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.252, 0.252, 0.085, 24),
    matDark
  );
  serviceInset.position.y = 1.13;
  root.add(serviceInset);

  const statusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.258, 0.026, 5, 20),
    matStatus
  );
  statusRing.rotation.x = Math.PI / 2;
  statusRing.position.y = 1.13;
  root.add(statusRing);

  // --- Mittiger Verteilerknoten.
  const node = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.31, 0.30, 24),
    matHull
  );
  node.position.y = 2.52;
  root.add(node);

  const nodeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.034, 5, 24),
    matRail
  );
  nodeRing.rotation.x = Math.PI / 2;
  nodeRing.position.y = 2.665;
  root.add(nodeRing);

  // Drei eingelassene Verteilerpaneele und eisblaue Leuchtstreifen.
  const panelMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.19, 0.15, 0.025),
    matCopper,
    3
  );
  const stripMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.105, 0.032, 0.012),
    matGlow,
    3
  );

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const rotationY = Math.PI / 2 - angle;

    tempPos.set(Math.cos(angle) * 0.347, 2.51, Math.sin(angle) * 0.347);
    tempQuat.setFromAxisAngle(up, rotationY);
    tempScale.set(1, 1, 1);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    panelMesh.setMatrixAt(i, tempMatrix);

    tempPos.set(Math.cos(angle) * 0.364, 2.51, Math.sin(angle) * 0.364);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    stripMesh.setMatrixAt(i, tempMatrix);
  }

  panelMesh.instanceMatrix.needsUpdate = true;
  stripMesh.instanceMatrix.needsUpdate = true;
  root.add(panelMesh, stripMesh);

  // --- Sechs radiale Aussteifungen vom festen Sockel zum Verteilerknoten.
  const braceMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.022, 0.027, 1, 8),
    matPearl,
    6
  );

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const start = new THREE.Vector3(
      Math.cos(angle) * 0.58,
      0.22,
      Math.sin(angle) * 0.58
    );
    const end = new THREE.Vector3(
      Math.cos(angle) * 0.335,
      2.38,
      Math.sin(angle) * 0.335
    );
    setRodInstance(braceMesh, i, start, end);
  }
  braceMesh.instanceMatrix.needsUpdate = true;
  root.add(braceMesh);

  // --- Oberer Hauptmast.
  const upperMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.13, 3.56, 20),
    matPearl
  );
  upperMast.position.y = 4.40;
  root.add(upperMast);

  const lowerUpperCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.15, 0.12, 20),
    matCopper
  );
  lowerUpperCollar.position.y = 2.75;
  root.add(lowerUpperCollar);

  const upperCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.092, 0.10, 0.13, 20),
    matHull
  );
  upperCollar.position.y = 5.87;
  root.add(upperCollar);

  const upperCollarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.101, 0.023, 5, 18),
    matRail
  );
  upperCollarRing.rotation.x = Math.PI / 2;
  upperCollarRing.position.y = 5.87;
  root.add(upperCollarRing);

  // --- Drei schlanke Nebenantennen am Verteiler.
  const sideRodMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.025, 0.044, 1, 12),
    matPearl,
    3
  );
  const sideTipMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.045, 0.22, 12),
    matCopper,
    3
  );

  const sideStarts = [];
  const sideEnds = [];
  const sideDirections = [];

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tilt = 0.16;

    const start = radial.clone().multiplyScalar(0.27);
    start.y = 2.60;

    const direction = radial
      .clone()
      .multiplyScalar(Math.sin(tilt))
      .addScaledVector(up, Math.cos(tilt))
      .normalize();

    const end = start.clone().addScaledVector(direction, 2.55);
    sideStarts.push(start);
    sideEnds.push(end);
    sideDirections.push(direction);

    setRodInstance(sideRodMesh, i, start, end);

    tempPos.copy(end).addScaledVector(direction, 0.10);
    tempQuat.setFromUnitVectors(up, direction);
    tempScale.set(1, 1, 1);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    sideTipMesh.setMatrixAt(i, tempMatrix);
  }

  sideRodMesh.instanceMatrix.needsUpdate = true;
  sideTipMesh.instanceMatrix.needsUpdate = true;
  root.add(sideRodMesh, sideTipMesh);

  // --- Vier zusätzliche schlanke Nadeln am oberen Mast.
  const needleMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.014, 0.025, 1, 10),
    matPearl,
    4
  );
  const needleTipMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.027, 0.15, 10),
    matRail,
    4
  );

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tilt = 0.105;

    const start = radial.clone().multiplyScalar(0.115);
    start.y = 3.08;

    const direction = radial
      .clone()
      .multiplyScalar(Math.sin(tilt))
      .addScaledVector(up, Math.cos(tilt))
      .normalize();

    const end = start.clone().addScaledVector(direction, 2.35);
    setRodInstance(needleMesh, i, start, end);

    tempPos.copy(end).addScaledVector(direction, 0.065);
    tempQuat.setFromUnitVectors(up, direction);
    tempScale.set(1, 1, 1);
    tempMatrix.compose(tempPos, tempQuat, tempScale);
    needleTipMesh.setMatrixAt(i, tempMatrix);
  }

  needleMesh.instanceMatrix.needsUpdate = true;
  needleTipMesh.instanceMatrix.needsUpdate = true;
  root.add(needleMesh, needleTipMesh);

  // --- Oberer Sender und Bake, Gesamthöhe 8,00 m.
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.18, 20),
    matHull
  );
  neck.position.y = 6.24;
  root.add(neck);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.17, 0.16, 20),
    matCopper
  );
  shoulder.position.y = 6.41;
  root.add(shoulder);

  const emitter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.13, 0.85, 20),
    matPearl
  );
  emitter.position.y = 6.915;
  root.add(emitter);

  const emitterCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.10, 16),
    matRail
  );
  emitterCollar.position.y = 7.39;
  root.add(emitterCollar);

  const bake = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 8),
    matBeacon
  );
  bake.position.y = 7.52;
  root.add(bake);

  const needle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.015, 0.39, 8),
    matRail
  );
  needle.position.y = 7.805;
  root.add(needle);

  // --- Horizontal liegende, expandierende Signalringe.
  const signalringe = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.009, 5, 24),
      pulseMaterials[i]
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 7.48;
    ring.scale.setScalar(0.8);
    root.add(ring);
    signalringe.push(ring);
  }

  // --- Kollisionskörper: Nur COL_-Meshes sind für das Spiel kollisionsrelevant.
  const colSockel = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 1.5)
  );
  colSockel.name = 'COL_sockel';
  colSockel.position.y = 0.25;
  root.add(colSockel);

  const colMast = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 7.55, 0.38)
  );
  colMast.name = 'COL_mast';
  colMast.position.y = 4.0;
  root.add(colMast);

  // --- Benutzen-Punkt vor dem Objekt in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_senden';
  use.position.set(0, 1.2, 0.82);
  use.userData = { label: 'Relaisantenne bedienen', radius: 0.8 };
  root.add(use);

  // --- Lichtquellen, dauerhaft vorhanden.
  const lampBake = new THREE.Object3D();
  lampBake.name = 'LAMP_bake';
  lampBake.position.set(0, 7.52, 0);
  lampBake.userData = { color: '#6fe3ff', intensity: 8, distance: 6 };
  root.add(lampBake);

  const lampSignal = new THREE.Object3D();
  lampSignal.name = 'LAMP_signal';
  lampSignal.position.set(0, 2.52, 0.42);
  lampSignal.userData = { color: '#6fe3ff', intensity: 5, distance: 4 };
  root.add(lampSignal);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0, 1.13, 0.27);
  lampStatus.userData = { color: '#ffb347', intensity: 3, distance: 3 };
  root.add(lampStatus);

  // --- Zustand und Animation.
  let enabled = true;
  let sendezeit = 0;
  let signalStart = 0;
  let zeit = 0;
  let letzte = null;
  let beaconStaerke = 1.5;
  let statusStaerke = 0.7;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;
    sendezeit = Math.max(0, sendezeit - step);

    const blinkt = sendezeit > 0 && Math.sin(zeit * 13) > 0;
    const zielBeacon = !enabled
      ? 0.04
      : sendezeit > 0
        ? (blinkt ? 5.0 : 0.22)
        : 1.45 + Math.sin(zeit * 2.4) * 0.22;

    const zielStatus = !enabled
      ? 0.02
      : sendezeit > 0
        ? 2.0 + Math.sin(zeit * 9) * 0.35
        : 0.65 + Math.sin(zeit * 1.8 + 1.2) * 0.12;

    const faktor = Math.min(1, step * 18);
    beaconStaerke += (zielBeacon - beaconStaerke) * faktor;
    statusStaerke += (zielStatus - statusStaerke) * faktor;

    matBeacon.emissiveIntensity = beaconStaerke;
    matStatus.emissiveIntensity = statusStaerke;

    signalringe.forEach((ring, i) => {
      if (!enabled || sendezeit <= 0) {
        pulseMaterials[i].opacity = 0;
        ring.scale.setScalar(0.8);
        return;
      }

      const phase = (zeit - signalStart) * 0.75 + i * 0.5;
      const localPhase = phase % 1;
      ring.scale.setScalar(0.8 + localPhase * 2.1);
      pulseMaterials[i].opacity = Math.sin(localPhase * Math.PI) * 0.9;
    });
  }

  bake.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // --- Öffentliche API.
  const api = {
    sendSignal() {
      if (!enabled) return false;
      sendezeit = 4.5;
      signalStart = zeit;
      return true;
    },
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled) sendezeit = 0;
    },
    togglePower() {
      api.setEnabled(!enabled);
      return enabled;
    },
    get enabled() {
      return enabled;
    },
    get sending() {
      return sendezeit > 0;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'signal_senden',
      label: 'Signal senden',
      run: () => api.sendSignal(),
    },
    {
      id: 'relais_schalten',
      label: 'Relais ein-/ausschalten',
      run: () => api.togglePower(),
    },
  ];

  return root;
}

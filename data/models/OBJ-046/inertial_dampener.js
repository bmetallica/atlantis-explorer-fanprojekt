// Trägheitsdämpfer-Hauptmatrix – Spielergänzung für ATL-036 / ATL-037.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'inertial_dampener',
  art: 'Standobjekt',
  masse: '1,95 × 3,00 × 0,82 (B × H × T, m)',
  wohin: 'ATL-036 Hauptstromraum, ATL-037 Stromverteilzentrum',
  benutzen: 'INT_matrix → Hauptmatrix ein- und ausschalten',
  lichter: 'LAMP_matrix und LAMP_status (violett-blau, dauerhaft aktiv)',
  animation: 'Kristallmodule und Energieleitungen pulsieren im gestaffelten Phasenlauf; Ausschalten fährt die Feldstärke weich herunter',
  quelle: 'selbst gebaut (Spielergänzung, in der Serie nicht gezeigt)',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'inertial_dampener';

  const matDark = kit('wallDark');
  const matPillar = kit('pillar');
  const matCopper = kit('copper');
  const matRail = kit('rail');

  const matRecess = new THREE.MeshStandardMaterial({
    name: 'matrix_recess',
    color: 0x091426,
    metalness: 0.76,
    roughness: 0.38
  });

  const matCrystal = new THREE.MeshStandardMaterial({
    name: 'kristallmodul',
    color: 0x6450bd,
    emissive: 0x7160ff,
    emissiveIntensity: 0.8,
    metalness: 0.22,
    roughness: 0.2,
    flatShading: true
  });

  const matCore = new THREE.MeshStandardMaterial({
    name: 'kristallkern',
    color: 0xd6d0ff,
    emissive: 0x9a8cff,
    emissiveIntensity: 1.6,
    metalness: 0.04,
    roughness: 0.28,
    flatShading: true
  });

  const matGlow = new THREE.MeshStandardMaterial({
    name: 'energieleitung_violett',
    color: 0x8072ef,
    emissive: 0x806cff,
    emissiveIntensity: 0.55,
    metalness: 0.25,
    roughness: 0.25
  });

  const dummy = new THREE.Object3D();

  function addBox(name, w, h, d, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addPipe(name, from, to, radius, material, radialSegments = 10) {
    const a = new THREE.Vector3().fromArray(from);
    const b = new THREE.Vector3().fromArray(to);
    const direction = new THREE.Vector3().subVectors(b, a);
    const length = direction.length();

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, false),
      material
    );
    mesh.name = name;
    mesh.position.copy(a).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  function setInstance(mesh, index, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  // --- Sockel: Füße, Hauptplatte und bronzefarbene Zierkante
  for (const x of [-0.73, 0.73]) {
    for (const z of [-0.25, 0.25]) {
      addBox('sockel_fuss', 0.28, 0.14, 0.26, matPillar, x, 0.07, z);
    }
  }

  const base = addBox('sockel', 1.95, 0.16, 0.80, matDark, 0, 0.22, 0);
  addBox('sockel_trim', 1.73, 0.035, 0.61, matCopper, 0, 0.317, 0);
  addBox('sockel_einsatz', 1.43, 0.025, 0.30, matRecess, 0, 0.315, 0.10);

  // --- Dunkle Rückplatte mit metallischem Innenrahmen
  addBox('matrix_rueckplatte', 1.72, 2.36, 0.10, matDark, 0, 1.54, -0.32);
  addBox('matrix_recess', 1.48, 2.19, 0.035, matRecess, 0, 1.54, -0.255);
  addBox('rueckplatte_rahmen', 1.56, 0.045, 0.045, matCopper, 0, 2.66, -0.235);
  addBox('rueckplatte_rahmen_unten', 1.56, 0.045, 0.045, matCopper, 0, 0.42, -0.235);

  // --- Vorderes tragendes Gerüst
  for (const x of [-0.88, 0.88]) {
    addBox('seitenpfosten', 0.15, 2.44, 0.25, matDark, x, 1.54, 0.19);
    addBox('seitenpfosten_kante', 0.024, 2.25, 0.024, matCopper, x - Math.sign(x) * 0.061, 1.54, 0.328);

    addPipe(
      'seitenergleitung',
      [x * 0.965, 0.34, 0.27],
      [x * 0.965, 2.73, 0.27],
      0.034,
      matCopper,
      10
    );
  }

  // Schräge Verstrebungen hinter dem Kristallfeld.
  addPipe('strebe_links', [-0.79, 0.38, -0.20], [-0.28, 2.63, -0.20], 0.019, matRail, 8);
  addPipe('strebe_rechts', [0.79, 0.38, -0.20], [0.28, 2.63, -0.20], 0.019, matRail, 8);

  // --- Oberer Träger und Statusmodul
  addBox('oberträger', 1.95, 0.18, 0.80, matDark, 0, 2.85, 0);
  addBox('oberträger_trim', 1.61, 0.035, 0.56, matCopper, 0, 2.955, 0);
  addBox('oberkappe', 1.72, 0.06, 0.64, matPillar, 0, 2.97, 0);

  // --- Fünf Kristallreihen in drei Säulen
  const columnX = [-0.58, 0, 0.58];
  const rowY = [0.62, 1.06, 1.50, 1.94, 2.38];
  const moduleCount = columnX.length * rowY.length;

  // Kontaktsockel, Fassungsringe, Kristalle und innere Kerne als Instanzen.
  const socketMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.185, 0.185, 0.10, 12, 1, false),
    matDark,
    moduleCount
  );
  socketMesh.name = 'kristallfassungen';
  socketMesh.castShadow = true;
  socketMesh.receiveShadow = true;

  const ringGeometry = new THREE.TorusGeometry(0.178, 0.018, 6, 12);
  ringGeometry.rotateX(Math.PI / 2);
  const ringMesh = new THREE.InstancedMesh(ringGeometry, matCopper, moduleCount);
  ringMesh.name = 'fassungsringe';
  ringMesh.castShadow = true;

  const crystalMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1, 0),
    matCrystal,
    moduleCount
  );
  crystalMesh.name = 'kristallmodule';
  crystalMesh.castShadow = true;

  const coreMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1, 0),
    matCore,
    moduleCount
  );
  coreMesh.name = 'kristallkerne';

  const crystals = [];

  let index = 0;
  for (let column = 0; column < columnX.length; column++) {
    for (let row = 0; row < rowY.length; row++) {
      const x = columnX[column];
      const y = rowY[row];
      const phase = column * 1.35 + row * 0.72;

      setInstance(socketMesh, index, x, y, 0.055);
      setInstance(ringMesh, index, x, y, 0.055);
      setInstance(crystalMesh, index, x, y, 0.065, 0.135, 0.20, 0.135);
      setInstance(coreMesh, index, x, y, 0.066, 0.067, 0.135, 0.067);

      crystals.push({ x, y, z: 0.065, phase });
      index++;
    }
  }

  socketMesh.instanceMatrix.needsUpdate = true;
  ringMesh.instanceMatrix.needsUpdate = true;
  crystalMesh.instanceMatrix.needsUpdate = true;
  coreMesh.instanceMatrix.needsUpdate = true;

  root.add(socketMesh, ringMesh, crystalMesh, coreMesh);

  // --- Energiekanäle hinter jeder Säule
  const conduitMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.034, 0.034, 2.22, 10, 1, false),
    matCopper,
    columnX.length
  );
  conduitMesh.name = 'kristallkanäle';
  conduitMesh.castShadow = true;

  const spineMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.025, 2.16, 0.025),
    matGlow,
    columnX.length
  );
  spineMesh.name = 'kristallspalten';

  for (let i = 0; i < columnX.length; i++) {
    setInstance(conduitMesh, i, columnX[i], 1.50, -0.17);
    setInstance(spineMesh, i, columnX[i], 1.50, -0.145);
  }
  conduitMesh.instanceMatrix.needsUpdate = true;
  spineMesh.instanceMatrix.needsUpdate = true;
  root.add(conduitMesh, spineMesh);

  // Querträger und dazwischenliegende Energieleitungen.
  const supportMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.62, 0.045, 0.075),
    matRail,
    rowY.length
  );
  supportMesh.name = 'quertraeger';

  const segmentMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.245, 0.022, 0.025),
    matGlow,
    rowY.length * 2
  );
  segmentMesh.name = 'energieleitungssegmente';

  let segmentIndex = 0;
  for (let row = 0; row < rowY.length; row++) {
    setInstance(supportMesh, row, 0, rowY[row], -0.09);
    for (const x of [-0.29, 0.29]) {
      setInstance(segmentMesh, segmentIndex, x, rowY[row], -0.10);
      segmentIndex++;
    }
  }
  supportMesh.instanceMatrix.needsUpdate = true;
  segmentMesh.instanceMatrix.needsUpdate = true;
  root.add(supportMesh, segmentMesh);

  // --- Statusschirm mit Canvas-Anzeige
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const statusTexture = new THREE.CanvasTexture(canvas);
  statusTexture.colorSpace = THREE.SRGBColorSpace;

  const matStatus = new THREE.MeshStandardMaterial({
    name: 'statusschirm',
    color: 0xffffff,
    map: statusTexture,
    emissive: 0x8f80ff,
    emissiveMap: statusTexture,
    emissiveIntensity: 1.1,
    metalness: 0.08,
    roughness: 0.38
  });

  addBox('statusrahmen', 0.76, 0.145, 0.05, matCopper, 0, 2.85, 0.375);
  addBox('statusschirm', 0.67, 0.105, 0.008, matStatus, 0, 2.85, 0.401);

  function drawStatus(active) {
    ctx.fillStyle = '#040916';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = active ? '#9e91ff' : '#484363';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.fillStyle = active ? '#d4ccff' : '#68627f';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INERTIAL DAMPENER', 256, 51);

    ctx.font = 'bold 25px sans-serif';
    ctx.fillStyle = active ? '#9fe8ff' : '#555065';
    ctx.fillText(active ? 'FIELD ACTIVE' : 'FIELD OFFLINE', 256, 91);

    statusTexture.needsUpdate = true;
  }

  // --- Kollision
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 3.00, 0.82),
    new THREE.MeshBasicMaterial()
  );
  col.name = 'COL_matrix';
  col.position.set(0, 1.50, 0);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_matrix';
  use.position.set(0, 1.35, 0.90);
  use.userData = {
    label: 'Trägheitsdämpfer-Hauptmatrix bedienen',
    radius: 0.9
  };
  root.add(use);

  // --- Lichtquellen: bewusst dauerhaft eingeschaltet
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_matrix';
  lamp.position.set(0, 1.50, 0.47);
  lamp.userData = {
    color: '#8f82ff',
    intensity: 5.5,
    distance: 5
  };
  root.add(lamp);

  const statusLamp = new THREE.Object3D();
  statusLamp.name = 'LAMP_status';
  statusLamp.position.set(0, 2.84, 0.46);
  statusLamp.userData = {
    color: '#9fcfff',
    intensity: 1.8,
    distance: 2.5
  };
  root.add(statusLamp);

  // --- Zustand und Animation
  let an = true;
  let feldstaerke = 1;
  let zeit = 0;
  let letzte = null;

  drawStatus(an);

  function update(dt) {
    zeit += dt;

    const zielFeld = an ? 1 : 0;
    feldstaerke += (zielFeld - feldstaerke) * Math.min(1, dt * 3.8);

    const grundPuls = 0.5 + 0.5 * Math.sin(zeit * 2.05);
    matCrystal.emissiveIntensity =
      0.06 + feldstaerke * (1.05 + grundPuls * 0.55);
    matCore.emissiveIntensity =
      0.04 + feldstaerke * (1.75 + grundPuls * 0.85);
    matGlow.emissiveIntensity =
      0.04 + feldstaerke * (0.7 + grundPuls * 0.35);
    matStatus.emissiveIntensity =
      0.08 + feldstaerke * (1.05 + grundPuls * 0.25);

    // Gestaffelte Feldwelle: jedes Modul pulsiert leicht versetzt.
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      const wave = 0.5 + 0.5 * Math.sin(zeit * 2.35 - c.phase);
      const scale = 1 + feldstaerke * wave * 0.055;
      setInstance(
        crystalMesh,
        i,
        c.x,
        c.y,
        c.z,
        0.135 * scale,
        0.20 * scale,
        0.135 * scale
      );
    }
    crystalMesh.instanceMatrix.needsUpdate = true;

    // Notlicht bleibt aktiv; nur die Feldintensität wird heruntergefahren.
    lamp.userData.intensity = 2.2 + feldstaerke * 3.3 + grundPuls * 0.25;
    statusLamp.userData.intensity = 1.1 + feldstaerke * 0.7;
  }

  base.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // --- Öffentliche Funktionen
  const api = {
    einschalten() {
      an = true;
      drawStatus(an);
    },
    ausschalten() {
      an = false;
      drawStatus(an);
    },
    umschalten() {
      an = !an;
      drawStatus(an);
    },
    get an() {
      return an;
    },
    get status() {
      return an ? 'aktiv' : 'inaktiv';
    },
    get feldstaerke() {
      return feldstaerke;
    }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'einschalten',
      label: 'Trägheitsdämpfer-Matrix einschalten',
      run: () => api.einschalten()
    },
    {
      id: 'ausschalten',
      label: 'Trägheitsdämpfer-Matrix ausschalten',
      run: () => api.ausschalten()
    },
    {
      id: 'umschalten',
      label: 'Trägheitsdämpfer-Matrix umschalten',
      run: () => api.umschalten()
    }
  ];

  return root;
}

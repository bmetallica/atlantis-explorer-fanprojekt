import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'subspace_comm_array',
  art: 'Standobjekt / Dachaufbau',
  masse: '2,00 × 6,00 × 2,00 (B × H × T, m)',
  wohin: 'ATL-002 Kontrollraum/Kommandozentrale, ATL-048 Außenbalkon',
  benutzen: 'INT_senden → Subraumverbindung herstellen, Datenburst senden oder Notruf empfangen',
  lichter: 'LAMP_signal (eisblau, dauerhaft an), LAMP_position (bernsteinfarben, dauerhaft an)',
  animation: 'Beim Senden laufen cyanfarbene Lichtimpulse und Signalringe durch den Mast; eingehende Notrufe werden als bernsteinfarbener Abwärtsimpuls angezeigt.',
  quelle: 'selbst gebaut; Spielergänzung',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'subspace_comm_array';

  const matSilber = kit('wall');
  const matDunkel = kit('wallDark');
  const matBronze = kit('copper');
  const matPerle = kit('pillar');
  const matPerlweiss = kit('hull');

  const matGlow = new THREE.MeshStandardMaterial({
    name: 'subraum_leitkern',
    color: 0x8ceaff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.22,
    metalness: 0.2,
    roughness: 0.28,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'positionslicht',
    color: 0xffc078,
    emissive: 0xffa23c,
    emissiveIntensity: 0.65,
    metalness: 0.05,
    roughness: 0.3,
  });

  const matDisplay = new THREE.MeshStandardMaterial({
    name: 'statusanzeige',
    color: 0x071b28,
    emissive: 0x287f9f,
    emissiveIntensity: 0.35,
    metalness: 0.15,
    roughness: 0.35,
  });

  const cylinderBetween = (
    parent,
    a,
    b,
    radius,
    material,
    segments = 10
  ) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const length = direction.length();

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, segments),
      material
    );
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    parent.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------
  // Fundament und Sockel
  // ---------------------------------------------------------------------

  const grundplatte = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.12, 1.25),
    matDunkel
  );
  grundplatte.name = 'Fundamentplatte';
  grundplatte.position.y = 0.06;
  root.add(grundplatte);

  const bronzering = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.035, 1.12),
    matBronze
  );
  bronzering.name = 'Fundament_Bronzering';
  bronzering.position.y = 0.1375;
  root.add(bronzering);

  const sockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.48, 0.52, 16),
    matPerle
  );
  sockel.name = 'Sockel';
  sockel.position.y = 0.42;
  root.add(sockel);

  const sockelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.405, 0.035, 5, 18),
    matBronze
  );
  sockelRing.name = 'Sockel_Ring';
  sockelRing.rotation.x = Math.PI / 2;
  sockelRing.position.y = 0.655;
  root.add(sockelRing);

  // Kleine Statuskonsole an der Vorderseite (+Z).
  const frontKonsole = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.2, 0.1),
    matDunkel
  );
  frontKonsole.name = 'Vorderseite_Statuskonsole';
  frontKonsole.position.set(0, 0.43, 0.365);
  root.add(frontKonsole);

  const frontAnzeige = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.075, 0.018),
    matDisplay
  );
  frontAnzeige.name = 'Vorderseite_Anzeige';
  frontAnzeige.position.set(0, 0.46, 0.427);
  root.add(frontAnzeige);

  const frontLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.018, 0.02),
    matAmber
  );
  frontLeiste.name = 'Vorderseite_Leiste';
  frontLeiste.position.set(0, 0.365, 0.43);
  root.add(frontLeiste);

  // Verankerungsschrauben als InstancedMesh.
  const bolzen = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.025, 6),
    matBronze,
    4
  );
  bolzen.name = 'Fundament_Verankerungen';

  const dummy = new THREE.Object3D();
  let bolzenIndex = 0;
  [-0.47, 0.47].forEach((x) => {
    [-0.47, 0.47].forEach((z) => {
      dummy.position.set(x, 0.1325, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bolzen.setMatrixAt(bolzenIndex, dummy.matrix);
      bolzenIndex += 1;
    });
  });
  bolzen.instanceMatrix.needsUpdate = true;
  root.add(bolzen);

  // ---------------------------------------------------------------------
  // Segmentierter Hauptmast
  // ---------------------------------------------------------------------

  const mastUnter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.19, 3.15, 20),
    matSilber
  );
  mastUnter.name = 'Mast_Untersegment';
  mastUnter.position.y = 2.235;
  root.add(mastUnter);

  const mastOber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.145, 0.9, 16),
    matDunkel
  );
  mastOber.name = 'Mast_Obersegment';
  mastOber.position.y = 4.23;
  root.add(mastOber);

  const mastKraenge = [
    { y: 1.04, radius: 0.176 },
    { y: 2.18, radius: 0.16 },
    { y: 3.43, radius: 0.146 },
    { y: 4.67, radius: 0.092 },
  ];

  mastKraenge.forEach((daten, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(daten.radius, 0.028, 5, 16),
      index === 3 ? matPerle : matBronze
    );
    ring.name = `Mast_Kraenge_${index}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.y = daten.y;
    root.add(ring);
  });

  // Kleine Serviceblenden am unteren Mast.
  const serviceGeometry = new THREE.BoxGeometry(0.028, 0.14, 0.085);
  const serviceblenden = new THREE.InstancedMesh(
    serviceGeometry,
    matDunkel,
    18
  );
  serviceblenden.name = 'Mast_Serviceblenden';

  let serviceIndex = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const angle = (column / 6) * Math.PI * 2;
      const y = 1.05 + row * 0.88;
      const radius = 0.19 + (0.145 - 0.19) * ((y - 0.64) / 3.19);

      dummy.position.set(
        Math.cos(angle) * (radius + 0.006),
        y,
        Math.sin(angle) * (radius + 0.006)
      );
      dummy.rotation.set(0, Math.PI / 2 - angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      serviceblenden.setMatrixAt(serviceIndex, dummy.matrix);
      serviceIndex += 1;
    }
  }
  serviceblenden.instanceMatrix.needsUpdate = true;
  root.add(serviceblenden);

  // ---------------------------------------------------------------------
  // Signalhub
  // ---------------------------------------------------------------------

  const hubUnter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.34, 0.15, 8),
    matDunkel
  );
  hubUnter.name = 'Signalhub_Unterteil';
  hubUnter.position.y = 4.025;
  root.add(hubUnter);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.4, 0.5, 8),
    matPerle
  );
  hub.name = 'Signalhub';
  hub.position.y = 4.32;
  root.add(hub);

  const hubRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.355, 0.034, 5, 18),
    matBronze
  );
  hubRing.name = 'Signalhub_Bronzering';
  hubRing.rotation.x = Math.PI / 2;
  hubRing.position.y = 4.565;
  root.add(hubRing);

  const hubRingUnten = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.028, 5, 18),
    matBronze
  );
  hubRingUnten.name = 'Signalhub_Unterring';
  hubRingUnten.rotation.x = Math.PI / 2;
  hubRingUnten.position.y = 4.09;
  root.add(hubRingUnten);

  // Acht Empfängerlamellen rund um den Hub.
  const hubPanelGeometry = new THREE.BoxGeometry(0.12, 0.25, 0.035);
  const hubPanels = new THREE.InstancedMesh(
    hubPanelGeometry,
    matBronze,
    8
  );
  hubPanels.name = 'Signalhub_Empfängerlamellen';

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;

    dummy.position.set(
      Math.cos(angle) * 0.385,
      4.33,
      Math.sin(angle) * 0.385
    );
    dummy.rotation.set(0, Math.PI / 2 - angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    hubPanels.setMatrixAt(i, dummy.matrix);
  }
  hubPanels.instanceMatrix.needsUpdate = true;
  root.add(hubPanels);

  // ---------------------------------------------------------------------
  // Radiale Trägerarme
  // ---------------------------------------------------------------------

  const armWinkel = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

  armWinkel.forEach((angle, index) => {
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    // Hauptarm vom Hub bis zum äußeren Träger.
    cylinderBetween(
      root,
      [x * 0.17, 4.48, z * 0.17],
      [x * 0.94, 4.48, z * 0.94],
      0.045,
      matDunkel,
      10
    );

    // Diagonale Verstrebung.
    cylinderBetween(
      root,
      [x * 0.13, 3.97, z * 0.13],
      [x * 0.87, 4.45, z * 0.87],
      0.024,
      matBronze,
      8
    );

    // Geschlossener Empfängerblock am Armende.
    const armGruppe = new THREE.Group();
    armGruppe.name = `Array_Arm_${index}`;
    armGruppe.position.set(x * 0.91, 4.48, z * 0.91);
    armGruppe.rotation.y = Math.PI / 2 - angle;
    root.add(armGruppe);

    const empfaenger = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.28, 0.18),
      matSilber
    );
    empfaenger.name = `Empfängerblock_${index}`;
    armGruppe.add(empfaenger);

    [-0.095, 0.095].forEach((localX, finIndex) => {
      const finne = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.22, 0.105),
        finIndex === 0 ? matPerle : matBronze
      );
      finne.name = `Empfängerfinne_${index}_${finIndex}`;
      finne.position.set(localX, 0.025, 0.015);
      armGruppe.add(finne);
    });

    const abdeckung = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.035, 0.14),
      matPerlweiss
    );
    abdeckung.name = `Empfängerabdeckung_${index}`;
    abdeckung.position.y = 0.155;
    armGruppe.add(abdeckung);
  });

  // ---------------------------------------------------------------------
  // Vier schlanke Außenantennen
  // ---------------------------------------------------------------------

  armWinkel.forEach((angle, index) => {
    const x = Math.cos(angle) * 0.72;
    const z = Math.sin(angle) * 0.72;

    cylinderBetween(
      root,
      [x, 4.44, z],
      [x, 5.72, z],
      0.024,
      matSilber,
      8
    );

    const isolator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.064, 0.12, 10),
      matPerlweiss
    );
    isolator.name = `Antenne_Isolator_${index}`;
    isolator.position.set(x, 4.51, z);
    root.add(isolator);

    const antennenRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 4, 10),
      matBronze
    );
    antennenRing.name = `Antenne_Ring_${index}`;
    antennenRing.rotation.x = Math.PI / 2;
    antennenRing.position.set(x, 5.08, z);
    root.add(antennenRing);

    const spitze = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 7),
      matAmber
    );
    spitze.name = `Positionslicht_${index}`;
    spitze.position.set(x, 5.72, z);
    root.add(spitze);
  });

  // ---------------------------------------------------------------------
  // Zentrale Leitantenne
  // ---------------------------------------------------------------------

  const leitkern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 1.14, 12),
    matGlow
  );
  leitkern.name = 'Leitkern';
  leitkern.position.y = 5.1;
  root.add(leitkern);

  const zentralDorn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.03, 1.37, 10),
    matBronze
  );
  zentralDorn.name = 'Zentraler_Dorn';
  zentralDorn.position.y = 5.235;
  root.add(zentralDorn);

  const zentralRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.012, 5, 12),
    matPerle
  );
  zentralRing.name = 'Zentraler_Ring';
  zentralRing.rotation.x = Math.PI / 2;
  zentralRing.position.y = 5.58;
  root.add(zentralRing);

  const zentralSpitze = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 8),
    matGlow
  );
  zentralSpitze.name = 'Zentrale_Signalspitze';
  zentralSpitze.position.y = 5.95;
  root.add(zentralSpitze);

  // ---------------------------------------------------------------------
  // Signalringe am Mast
  // ---------------------------------------------------------------------

  const signalBands = [];

  for (let i = 0; i < 8; i += 1) {
    const y = 0.95 + i * 0.48;
    let radius;

    if (y <= 3.83) {
      radius = 0.19 + (0.145 - 0.19) * ((y - 0.64) / 3.19);
    } else {
      radius = 0.145 + (0.09 - 0.145) * ((y - 3.78) / 0.9);
    }

    const material = new THREE.MeshStandardMaterial({
      name: `signalband_${i}`,
      color: 0x6fe3ff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 0.12,
      metalness: 0.2,
      roughness: 0.32,
    });

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.006, 0.012, 5, 16),
      material
    );
    band.name = `Signalband_${i}`;
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    root.add(band);
    signalBands.push(band);
  }

  const sendering = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.017, 5, 20),
    new THREE.MeshStandardMaterial({
      name: 'sendesignalring',
      color: 0xa8f4ff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.86,
      metalness: 0.15,
      roughness: 0.25,
    })
  );
  sendering.name = 'Sendersignalring';
  sendering.rotation.x = Math.PI / 2;
  sendering.position.y = 4.72;
  root.add(sendering);

  // Drei aufsteigende Lichtpakete.
  const sendBeads = [];

  for (let i = 0; i < 3; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      name: `sendimpuls_${i}`,
      color: 0xc7f9ff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 3.2,
      transparent: true,
      opacity: 0.92,
      metalness: 0.05,
      roughness: 0.2,
    });

    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 12, 8),
      material
    );
    bead.name = `Sendimpuls_${i}`;
    bead.visible = false;
    root.add(bead);
    sendBeads.push(bead);
  }

  // Bernsteinfarbenes Notrufpaket.
  const empfangsMaterial = new THREE.MeshStandardMaterial({
    name: 'notrufimpuls',
    color: 0xffd29b,
    emissive: 0xffa23c,
    emissiveIntensity: 3.2,
    transparent: true,
    opacity: 0.94,
    metalness: 0.05,
    roughness: 0.24,
  });

  const empfangsimpuls = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 12, 8),
    empfangsMaterial
  );
  empfangsimpuls.name = 'Notrufimpuls';
  empfangsimpuls.visible = false;
  root.add(empfangsimpuls);

  // ---------------------------------------------------------------------
  // Kollision
  // ---------------------------------------------------------------------

  const colSockel = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.68, 1.25)
  );
  colSockel.name = 'COL_sockel';
  colSockel.position.y = 0.34;
  root.add(colSockel);

  const colMast = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 4.0, 0.4)
  );
  colMast.name = 'COL_mast';
  colMast.position.y = 2.68;
  root.add(colMast);

  const colHub = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.72, 0.82)
  );
  colHub.name = 'COL_signalhub';
  colHub.position.y = 4.25;
  root.add(colHub);

  const colArmX = new THREE.Mesh(
    new THREE.BoxGeometry(1.98, 0.16, 0.18)
  );
  colArmX.name = 'COL_arm_x';
  colArmX.position.y = 4.48;
  root.add(colArmX);

  const colArmZ = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 1.98)
  );
  colArmZ.name = 'COL_arm_z';
  colArmZ.position.y = 4.48;
  root.add(colArmZ);

  // ---------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ---------------------------------------------------------------------

  const use = new THREE.Object3D();
  use.name = 'INT_senden';
  use.position.set(0, 1.25, 0.88);
  use.userData = {
    label: 'Subraum-Kommunikationsarray bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lampSignal = new THREE.PointLight(0x6fe3ff, 5, 4.5, 2);
  lampSignal.name = 'LAMP_signal';
  lampSignal.position.set(0, 5.5, 0);
  lampSignal.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 4.5,
  };
  root.add(lampSignal);

  const lampPosition = new THREE.PointLight(0xffa23c, 1.4, 2.5, 2);
  lampPosition.name = 'LAMP_position';
  lampPosition.position.set(0, 5.78, 0);
  lampPosition.userData = {
    color: '#ffa23c',
    intensity: 1.4,
    distance: 2.5,
  };
  root.add(lampPosition);

  // ---------------------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------------------

  let sendet = false;
  let empfaengt = false;
  let sendZeit = 0;
  let empfangsZeit = 0;
  let zeit = 0;
  let letzte = null;

  const cyan = new THREE.Color(0x6fe3ff);
  const bernstein = new THREE.Color(0xffa23c);

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    if (sendet) {
      sendZeit += step;
      if (sendZeit > 2.65) {
        sendet = false;
      }
    }

    if (empfaengt) {
      empfangsZeit += step;
      if (empfangsZeit > 2.25) {
        empfaengt = false;
      }
    }

    const zielFarbe = empfaengt ? bernstein : cyan;
    const farbBlend = Math.min(1, step * 7);

    const zielHelligkeit = sendet
      ? 1.75 + Math.sin(zeit * 17) * 0.3
      : empfaengt
        ? 1.25 + Math.sin(zeit * 9) * 0.15
        : 0.22;

    matGlow.emissiveIntensity +=
      (zielHelligkeit - matGlow.emissiveIntensity) * farbBlend;
    matGlow.color.lerp(zielFarbe, farbBlend);
    matGlow.emissive.lerp(zielFarbe, farbBlend);

    // Lichtimpulse laufen sichtbar vor dem Mast nach oben.
    sendBeads.forEach((bead, index) => {
      const progress = sendZeit / 2.1 - index * 0.19;

      if (sendet && progress >= 0 && progress <= 1) {
        bead.visible = true;
        bead.position.set(
          Math.sin(progress * Math.PI * 2 + index) * 0.018,
          0.95 + progress * 4.87,
          0.225
        );

        const pulse = 0.82 + Math.sin(progress * Math.PI) * 0.38;
        bead.scale.setScalar(pulse);
        bead.material.opacity = 0.55 + Math.sin(progress * Math.PI) * 0.4;
      } else {
        bead.visible = false;
      }
    });

    // Notrufimpuls läuft von der oberen Antenne zum Sockel.
    if (empfaengt) {
      const progress = Math.min(1, empfangsZeit / 1.95);
      empfangsimpuls.visible = true;
      empfangsimpuls.position.set(
        0,
        5.72 - progress * 4.72,
        0.235
      );
      empfangsimpuls.material.opacity =
        0.68 + Math.sin(progress * Math.PI) * 0.28;
    } else {
      empfangsimpuls.visible = false;
    }

    // Signalringe: beim Senden wandert eine helle Welle nach oben.
    signalBands.forEach((band, index) => {
      let ziel = 0.12;

      if (sendet) {
        const phase = (sendZeit * 2.2 - index * 0.1) % 1;
        const wrapped = phase < 0 ? phase + 1 : phase;
        const distance = Math.min(wrapped, 1 - wrapped);
        ziel = 0.16 + 3.1 * Math.exp(-distance * distance * 95);
      } else if (empfaengt) {
        ziel = 0.55 + Math.max(0, Math.sin(zeit * 8 - index * 0.5)) * 1.4;
      }

      const material = band.material;
      material.emissiveIntensity +=
        (ziel - material.emissiveIntensity) * Math.min(1, step * 10);
      material.color.lerp(zielFarbe, farbBlend);
      material.emissive.lerp(zielFarbe, farbBlend);
    });

    const zielRing = sendet ? 2.7 : empfaengt ? 1.8 : 0.7;
    sendering.material.emissiveIntensity +=
      (zielRing - sendering.material.emissiveIntensity) *
      Math.min(1, step * 8);
    sendering.material.emissive.lerp(zielFarbe, farbBlend);
    sendering.scale.setScalar(
      1 + (sendet ? Math.sin(zeit * 14) * 0.12 : 0)
    );

    matAmber.emissiveIntensity = empfaengt
      ? 2.25 + Math.sin(zeit * 11) * 0.35
      : 0.65;

    matDisplay.emissiveIntensity = sendet
      ? 1.1
      : empfaengt
        ? 0.9
        : 0.35;
  }

  grundplatte.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(now - letzte);
    }
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    senden() {
      sendet = true;
      sendZeit = 0;
      empfaengt = false;
      empfangsZeit = 0;
      return true;
    },
    empfangen() {
      empfaengt = true;
      empfangsZeit = 0;
      sendet = false;
      sendZeit = 0;
      return true;
    },
    stoppen() {
      sendet = false;
      empfaengt = false;
      sendZeit = 0;
      empfangsZeit = 0;
      return true;
    },
    get sendet() {
      return sendet;
    },
    get empfaengt() {
      return empfaengt;
    },
    get aktiv() {
      return sendet || empfaengt;
    },
    get status() {
      if (sendet) return 'sendet';
      if (empfaengt) return 'empfaengt';
      return 'bereit';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'senden',
      label: 'Subraumverbindung: Datenburst senden',
      run: () => api.senden(),
    },
    {
      id: 'empfangen',
      label: 'Subraumverbindung: Notruf empfangen',
      run: () => api.empfangen(),
    },
    {
      id: 'stoppen',
      label: 'Subraumverbindung: Datenübertragung beenden',
      run: () => api.stoppen(),
    },
  ];

  return root;
}

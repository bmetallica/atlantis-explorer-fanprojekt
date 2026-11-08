// OBJ-083: Athosisches Gedenk-Teeservice
// Traditionelles Teeservice für die athosische Gedenk-Teezeremonie.
import * as THREE from 'three';

export const steckbrief = {
  name: 'athosian_tea_set',
  art: 'Standobjekt',
  masse: '0,58 × 0,22 × 0,36 (B × H × T, m)',
  wohin: 'ATL-008 (Büro Kate Heightmeyer), ATL-024 (Crew-Quartiere), ATL-027 (Lesezimmer)',
  benutzen: 'INT_zeremonie → Menü aus userData.actions',
  lichter: 'keine dauerhafte Lampe; warm aufleuchtende Teeflächen während der Zeremonie',
  animation: 'Bei der Zeremonie hebt sich der Kannendeckel weich an, die Teeflächen leuchten bernsteinfarben und feine Dampfschwaden steigen auf.',
  quelle: 'selbst gebaut nach OBJ-083 und den Referenzbildern'
};

function holztextur() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, '#241914');
  gradient.addColorStop(0.45, '#503428');
  gradient.addColorStop(0.72, '#3a261e');
  gradient.addColorStop(1, '#211713');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 128);

  for (let i = 0; i < 46; i++) {
    const y = (i * 2.71) % 128;
    ctx.beginPath();
    ctx.moveTo(0, y);

    for (let x = 0; x <= 512; x += 16) {
      const phase = x * 0.028 + i * 0.63;
      ctx.lineTo(x, y + Math.sin(phase) * (1.1 + (i % 4) * 0.55));
    }

    ctx.strokeStyle = i % 4 === 0
      ? 'rgba(156,101,61,0.22)'
      : 'rgba(17,9,6,0.26)';
    ctx.lineWidth = i % 7 === 0 ? 1.5 : 0.7;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'athosian_tablet_holztextur';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.2, 1);
  return texture;
}

function brokatttextur() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#641419';
  ctx.fillRect(0, 0, 512, 512);

  const heller = 'rgba(194,79,72,0.55)';
  const dunkel = 'rgba(62,7,13,0.76)';
  const altrosa = 'rgba(231,143,129,0.38)';
  const golden = 'rgba(190,137,72,0.27)';

  // Große, floralartige Brokattmuster auf dunkelrotem Grund.
  for (let row = -1; row < 5; row++) {
    for (let col = -1; col < 5; col++) {
      const cx = col * 128 + (row % 2 ? 64 : 0);
      const cy = row * 128;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((row + col) % 2 ? 0.2 : -0.2);

      ctx.strokeStyle = heller;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-43, 27);
      ctx.bezierCurveTo(-31, -4, -8, -12, 0, -37);
      ctx.bezierCurveTo(10, -10, 31, -3, 43, 27);
      ctx.stroke();

      ctx.strokeStyle = golden;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-43, 27);
      ctx.bezierCurveTo(-24, 12, -12, 8, 0, -18);
      ctx.bezierCurveTo(13, 8, 26, 12, 43, 27);
      ctx.stroke();

      for (const side of [-1, 1]) {
        ctx.strokeStyle = side < 0 ? altrosa : heller;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(side * 28, 12);
        ctx.bezierCurveTo(side * 51, 7, side * 55, 32, side * 31, 40);
        ctx.bezierCurveTo(side * 35, 27, side * 34, 20, side * 28, 12);
        ctx.stroke();
      }

      ctx.fillStyle = dunkel;
      ctx.beginPath();
      ctx.ellipse(0, 40, 30, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = golden;
      ctx.beginPath();
      ctx.ellipse(0, 39, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Feine Gewebelinien geben dem Tuch eine textile Oberfläche.
  ctx.strokeStyle = 'rgba(255,214,198,0.11)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 512; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'athosian_brokkattuch';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.65, 1.2);
  return texture;
}

function gefaltetesTuch(breite, tiefe, segX, segZ) {
  const geometry = new THREE.BoxGeometry(breite, 0.006, tiefe, segX, 1, segZ);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    if (y > 0) {
      const welle =
        Math.sin(x * 31 + z * 9) * 0.0015 +
        Math.cos(z * 27 - x * 5) * 0.0010;

      const randAbfall = Math.max(
        0,
        Math.abs(x) / (breite * 0.5) - 0.9
      ) * 0.006;

      position.setY(i, y + welle - randAbfall);
    }
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function hängendesTuch(breite, hoehe, segX, segY) {
  const geometry = new THREE.BoxGeometry(breite, hoehe, 0.006, segX, segY, 1);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const falte = Math.sin(x * 25) * 0.0016 + Math.cos(x * 12.5) * 0.0009;
    position.setZ(i, z + falte);

    if (y < 0) {
      position.setY(i, y + Math.abs(falte) * 0.7);
    }
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'athosian_tea_set';

  const keramik = new THREE.MeshStandardMaterial({
    name: 'athosian_dunkelglasierte_keramik',
    color: 0x120d0b,
    metalness: 0.08,
    roughness: 0.23
  });

  const randMaterial = new THREE.MeshStandardMaterial({
    name: 'athosian_heller_keramikrand',
    color: 0x874526,
    metalness: 0.1,
    roughness: 0.34
  });

  const holzMaterial = new THREE.MeshStandardMaterial({
    name: 'dunkles_holz',
    color: 0x6a4c3b,
    map: holztextur(),
    metalness: 0,
    roughness: 0.7
  });

  const tuchMaterial = new THREE.MeshStandardMaterial({
    name: 'rotes_brokkattuch',
    color: 0xffffff,
    map: brokatttextur(),
    metalness: 0,
    roughness: 0.88
  });

  const innenMaterial = new THREE.MeshStandardMaterial({
    name: 'keramik_innen',
    color: 0x080605,
    metalness: 0.03,
    roughness: 0.36
  });

  const teeMaterial = new THREE.MeshStandardMaterial({
    name: 'tee_bernstein',
    color: 0x55200a,
    emissive: 0xff8b32,
    emissiveIntensity: 0,
    metalness: 0.02,
    roughness: 0.18,
    side: THREE.DoubleSide
  });

  // --- Tablett: Grundplatte mit dunklen, hochgezogenen Holzgriffen.
  const tablett = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.045, 0.34),
    holzMaterial
  );
  tablett.position.y = 0.0225;
  tablett.castShadow = true;
  tablett.receiveShadow = true;
  root.add(tablett);

  const griffProfil = new THREE.CylinderGeometry(0.014, 0.014, 0.3, 12);
  griffProfil.rotateX(Math.PI / 2);

  const stuetzenProfil = new THREE.CylinderGeometry(0.009, 0.011, 0.075, 10);

  for (const side of [-1, 1]) {
    const griff = new THREE.Mesh(griffProfil, holzMaterial);
    griff.position.set(side * 0.267, 0.086, 0);
    griff.rotation.x = side * 0.025;
    griff.castShadow = true;
    root.add(griff);

    for (const z of [-0.12, 0.12]) {
      const stuetze = new THREE.Mesh(stuetzenProfil, holzMaterial);
      stuetze.position.set(side * 0.257, 0.058, z);
      stuetze.rotation.z = side * -0.2;
      stuetze.castShadow = true;
      root.add(stuetze);
    }
  }

  // --- Rotes Brokattuch: gewellte Auflage und kurzer Überhang an der Vorderseite (+Z).
  const tuchOben = new THREE.Mesh(
    gefaltetesTuch(0.485, 0.325, 16, 10),
    tuchMaterial
  );
  tuchOben.position.y = 0.048;
  tuchOben.castShadow = true;
  tuchOben.receiveShadow = true;
  root.add(tuchOben);

  const tuchVorne = new THREE.Mesh(
    hängendesTuch(0.485, 0.048, 16, 5),
    tuchMaterial
  );
  tuchVorne.position.set(0, 0.024, 0.168);
  tuchVorne.castShadow = true;
  root.add(tuchVorne);

  // --- Teekanne: bauchiger, handgefertigter Keramikkorpus.
  const kanne = new THREE.Group();
  kanne.position.set(0, 0.052, -0.052);
  root.add(kanne);

  const kannenProfil = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.039, 0.0),
    new THREE.Vector2(0.052, 0.009),
    new THREE.Vector2(0.066, 0.031),
    new THREE.Vector2(0.072, 0.057),
    new THREE.Vector2(0.068, 0.087),
    new THREE.Vector2(0.056, 0.108),
    new THREE.Vector2(0.044, 0.12),
    new THREE.Vector2(0.042, 0.131),
    new THREE.Vector2(0.038, 0.131),
    new THREE.Vector2(0.038, 0.119),
    new THREE.Vector2(0.049, 0.105),
    new THREE.Vector2(0.061, 0.085),
    new THREE.Vector2(0.064, 0.057),
    new THREE.Vector2(0.058, 0.032),
    new THREE.Vector2(0.045, 0.012),
    new THREE.Vector2(0.0, 0.012)
  ];

  const kannenkoerper = new THREE.Mesh(
    new THREE.LatheGeometry(kannenProfil, 28),
    keramik
  );
  kannenkoerper.castShadow = true;
  kannenkoerper.receiveShadow = true;
  kanne.add(kannenkoerper);

  const kannenrand = new THREE.Mesh(
    new THREE.TorusGeometry(0.0405, 0.0035, 6, 24),
    randMaterial
  );
  kannenrand.rotation.x = Math.PI / 2;
  kannenrand.position.y = 0.131;
  kannenrand.castShadow = true;
  kanne.add(kannenrand);

  // Innerer Schattenring am Kannenmund.
  const mundInnen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.008, 24),
    innenMaterial
  );
  mundInnen.position.y = 0.126;
  kanne.add(mundInnen);

  // Kurzer konischer Ausguss nach vorne (+Z).
  const ausguss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.025, 0.068, 20),
    keramik
  );
  ausguss.rotation.x = Math.PI / 2;
  ausguss.position.set(0, 0.101, 0.081);
  ausguss.castShadow = true;
  kanne.add(ausguss);

  const ausgussrand = new THREE.Mesh(
    new THREE.TorusGeometry(0.015, 0.0026, 6, 20),
    randMaterial
  );
  ausgussrand.position.set(0, 0.101, 0.115);
  ausgussrand.castShadow = true;
  kanne.add(ausgussrand);

  // Geschlossener Henkel in der YZ-Ebene hinter dem Korpus.
  const henkel = new THREE.Mesh(
    new THREE.TorusGeometry(0.037, 0.0075, 8, 24),
    keramik
  );
  henkel.position.set(0, 0.075, -0.079);
  henkel.rotation.y = Math.PI / 2;
  henkel.scale.set(1, 1.08, 1);
  henkel.castShadow = true;
  kanne.add(henkel);

  // Deckel als eigene Gruppe für die weiche Hebung.
  const deckelgruppe = new THREE.Group();
  kanne.add(deckelgruppe);

  const deckelProfil = [
    new THREE.Vector2(0.0, 0.132),
    new THREE.Vector2(0.039, 0.132),
    new THREE.Vector2(0.046, 0.136),
    new THREE.Vector2(0.043, 0.142),
    new THREE.Vector2(0.027, 0.149),
    new THREE.Vector2(0.011, 0.152),
    new THREE.Vector2(0.0, 0.152)
  ];

  const deckel = new THREE.Mesh(
    new THREE.LatheGeometry(deckelProfil, 24),
    keramik
  );
  deckel.castShadow = true;
  deckelgruppe.add(deckel);

  const deckelknopf = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 12, 8),
    randMaterial
  );
  deckelknopf.position.y = 0.158;
  deckelknopf.scale.y = 0.78;
  deckelknopf.castShadow = true;
  deckelgruppe.add(deckelknopf);

  // --- Fünf henkellose Becher als InstancedMesh.
  const becherProfil = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.021, 0.0),
    new THREE.Vector2(0.028, 0.005),
    new THREE.Vector2(0.036, 0.023),
    new THREE.Vector2(0.039, 0.04),
    new THREE.Vector2(0.039, 0.045),
    new THREE.Vector2(0.0355, 0.046),
    new THREE.Vector2(0.0345, 0.041),
    new THREE.Vector2(0.032, 0.022),
    new THREE.Vector2(0.024, 0.011),
    new THREE.Vector2(0.0, 0.011)
  ];

  const becherPositionen = [
    [-0.175, -0.018],
    [-0.13, 0.087],
    [0.13, 0.087],
    [0.175, -0.018],
    [0.0, 0.132]
  ];

  const becherGeo = new THREE.LatheGeometry(becherProfil, 20);
  const becher = new THREE.InstancedMesh(becherGeo, keramik, 5);
  becher.name = 'fuenf_becher';
  becher.castShadow = true;
  becher.receiveShadow = true;

  const becherRandGeo = new THREE.TorusGeometry(0.0372, 0.0027, 6, 20);
  becherRandGeo.rotateX(Math.PI / 2);

  const becherraender = new THREE.InstancedMesh(
    becherRandGeo,
    randMaterial,
    5
  );
  becherraender.name = 'fuenf_becherrander';
  becherraender.castShadow = true;

  const dummy = new THREE.Object3D();

  becherPositionen.forEach(([x, z], index) => {
    dummy.position.set(x, 0.052, z);
    dummy.rotation.set(0, index * 0.37, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    becher.setMatrixAt(index, dummy.matrix);

    dummy.position.y = 0.097;
    dummy.updateMatrix();
    becherraender.setMatrixAt(index, dummy.matrix);
  });

  becher.instanceMatrix.needsUpdate = true;
  becherraender.instanceMatrix.needsUpdate = true;
  root.add(becher, becherraender);

  // Bernsteinfarbene Teeflächen werden erst während der Zeremonie sichtbar.
  const teeGeo = new THREE.CircleGeometry(0.0325, 20);
  teeGeo.rotateX(-Math.PI / 2);

  const tee = new THREE.InstancedMesh(teeGeo, teeMaterial, 5);
  tee.name = 'tee_in_fuenf_bechern';
  tee.visible = false;

  becherPositionen.forEach(([x, z], index) => {
    dummy.position.set(x, 0.0835, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    tee.setMatrixAt(index, dummy.matrix);
  });

  tee.instanceMatrix.needsUpdate = true;
  root.add(tee);

  // Dezente, geschlossene Dampfschwaden über der Kanne.
  const dampf = [];

  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshBasicMaterial({
      name: 'tee_dampf',
      color: 0xdceff3,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const wolkchen = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 10, 7),
      material
    );

    wolkchen.scale.set(0.75, 2.5, 0.75);
    wolkchen.position.set((i - 1) * 0.013, 0.17, (i % 2) * 0.005);
    wolkchen.visible = false;
    wolkchen.userData.phase = i * 0.72;

    kanne.add(wolkchen);
    dampf.push(wolkchen);
  }

  // Unsichtbarer Kollisionskörper für das gesamte Tablett.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.22, 0.36),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  col.name = 'COL_tablet';
  col.position.set(0, 0.11, 0);
  root.add(col);

  // Benutzen-Punkt vor dem Teeservice, in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_zeremonie';
  use.position.set(0, 0.13, 0.18);
  use.userData = {
    label: 'Athosische Gedenk-Teezeremonie',
    radius: 0.8
  };
  root.add(use);

  // Zustand und selbstständige Animation.
  let zeremonieLaeuft = false;
  let zeit = 0;
  let letzte = null;
  let deckelHebung = 0;
  let teeLicht = 0;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.05);
    zeit += step;

    const zielHebung = zeremonieLaeuft ? 0.017 : 0;
    deckelHebung +=
      (zielHebung - deckelHebung) * Math.min(1, step * 3.2);
    deckelgruppe.position.y = deckelHebung;

    const zielLicht = zeremonieLaeuft ? 0.55 : 0;
    teeLicht +=
      (zielLicht - teeLicht) * Math.min(1, step * 4);

    teeMaterial.emissiveIntensity = teeLicht;
    tee.visible = teeLicht > 0.015;

    dampf.forEach((wolkchen, index) => {
      const phase = (zeit * 0.34 + wolkchen.userData.phase) % 1;
      const sichtbar = zeremonieLaeuft && deckelHebung > 0.006;
      wolkchen.visible = sichtbar;

      if (sichtbar) {
        wolkchen.position.y = 0.171 + phase * 0.14;
        wolkchen.position.x =
          (index - 1) * 0.013 +
          Math.sin(zeit * 1.7 + index) * 0.007;
        wolkchen.position.z =
          (index % 2) * 0.005 +
          Math.cos(zeit * 1.3 + index) * 0.003;

        wolkchen.scale.x = 0.75 + phase * 0.65;
        wolkchen.scale.z = 0.75 + phase * 0.65;
        wolkchen.material.opacity = Math.sin(phase * Math.PI) * 0.2;
      }
    });
  }

  deckel.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (letzte !== null) {
      update(Math.min(now - letzte, 0.05));
    }

    letzte = now;
  };

  root.userData.update = update;

  const api = {
    ceremonieStarten() {
      zeremonieLaeuft = true;
    },

    ceremonieBeenden() {
      zeremonieLaeuft = false;
    },

    umschalten() {
      zeremonieLaeuft = !zeremonieLaeuft;
    },

    get ceremonieLaeuft() {
      return zeremonieLaeuft;
    },

    get deckelGehoben() {
      return deckelHebung > 0.008;
    }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'zeremonie_start',
      label: 'Gedenk-Teezeremonie beginnen',
      run: () => api.ceremonieStarten()
    },
    {
      id: 'zeremonie_beenden',
      label: 'Gedenk-Teezeremonie beenden',
      run: () => api.ceremonieBeenden()
    }
  ];

  return root;
}

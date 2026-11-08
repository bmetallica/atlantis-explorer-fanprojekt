// OBJ-067 — Tragbarer Notfall-Sanitätsrucksack
// 1 Einheit = 1 Meter; Standobjekt, Ursprung = Mitte der Unterseite, Vorderseite = +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'medkit_backpack',
  art: 'Standobjekt / tragbarer Sanitätsrucksack',
  masse: '0,52 × 0,38 × 0,31 (B × H × T, m); Leergewicht ca. 4,8 kg, mit Inhalt ca. 7,5 kg',
  wohin: 'ATL-009 Krankenstation / Infirmary, ATL-040 Jumper-Bay / Puddle-Jumper-Hangar',
  benutzen: 'INT_use → Rucksack öffnen bzw. schließen',
  lichter: 'keine',
  animation: 'Der obere Verschlussdeckel öffnet und schließt weich; Verbände, Medikamente, Infusionsbeutel und Schienen werden im geöffneten Hauptfach sichtbar',
  quelle: 'selbst gebaut nach OBJ-067',
};

function corduraMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#454a35';
  ctx.fillRect(0, 0, 128, 128);

  const image = ctx.getImageData(0, 0, 128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const weave =
        Math.sin(x * 1.7) * 2.2 +
        Math.sin(y * 1.45) * 1.8 +
        Math.sin((x + y) * 0.55) * 1.1;
      const grain = (Math.random() - 0.5) * 10 + weave;

      image.data[i] = Math.max(0, Math.min(255, 69 + grain));
      image.data[i + 1] = Math.max(0, Math.min(255, 74 + grain));
      image.data[i + 2] = Math.max(0, Math.min(255, 53 + grain));
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = 4;

  return new THREE.MeshStandardMaterial({
    name: 'cordura_oliv',
    color: 0xffffff,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.0012,
    metalness: 0.02,
    roughness: 0.94,
  });
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'medkit_backpack';

  const cordura = corduraMaterial();
  const corduraDark = new THREE.MeshStandardMaterial({
    name: 'cordura_dunkel',
    color: 0x282b22,
    metalness: 0.02,
    roughness: 0.96,
  });
  const webbingMat = new THREE.MeshStandardMaterial({
    name: 'gurtband',
    color: 0x20231c,
    metalness: 0.03,
    roughness: 0.88,
  });
  const zipperMat = new THREE.MeshStandardMaterial({
    name: 'reissverschluss',
    color: 0x8a8e83,
    metalness: 0.82,
    roughness: 0.34,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    name: 'bronze_schnalle',
    color: 0x8f683d,
    metalness: 0.7,
    roughness: 0.42,
  });
  const patchMat = new THREE.MeshStandardMaterial({
    name: 'sanitaetsaufnaher',
    color: 0xe8e3cf,
    metalness: 0,
    roughness: 0.92,
  });
  const redMat = new THREE.MeshStandardMaterial({
    name: 'sanitaetskreuz_rot',
    color: 0xc91f29,
    metalness: 0,
    roughness: 0.78,
  });
  const bandageMat = new THREE.MeshStandardMaterial({
    name: 'verbandstoff',
    color: 0xe7e2d5,
    metalness: 0,
    roughness: 0.98,
  });
  const pouchMat = new THREE.MeshStandardMaterial({
    name: 'medikamententasche',
    color: 0x8e2429,
    metalness: 0,
    roughness: 0.84,
  });
  const linerMat = new THREE.MeshStandardMaterial({
    name: 'innenfutter',
    color: 0x4a5044,
    metalness: 0,
    roughness: 0.96,
  });

  function box(name, w, h, d, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function roundedShape(w, h, r) {
    const radius = Math.max(0.001, Math.min(r, w * 0.49, h * 0.49));
    const x = -w / 2;
    const y = -h / 2;
    const shape = new THREE.Shape();

    shape.moveTo(x + radius, y);
    shape.lineTo(x + w - radius, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + radius);
    shape.lineTo(x + w, y + h - radius);
    shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    shape.lineTo(x + radius, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    shape.closePath();
    return shape;
  }

  // Erzeugt einen geschlossenen, abgerundeten Körper mit exakt vorgegebenen
  // Außenmaßen. Dadurch liegt der tiefste Punkt des Rucksacks sicher bei y = 0.
  function roundedSlab(name, w, h, d, radius, material, x, y, z, parent = root) {
    const bevel = Math.max(
      0.001,
      Math.min(radius * 0.55, w * 0.08, h * 0.08, d * 0.18)
    );
    const depth = Math.max(0.002, d * 0.55);

    const geometry = new THREE.ExtrudeGeometry(roundedShape(w, h, radius), {
      depth,
      steps: 1,
      curveSegments: 5,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: bevel,
      bevelThickness: bevel,
    });

    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    geometry.center();
    geometry.scale(w / size.x, h / size.y, d / size.z);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // --- Hauptkörper: geschlossener unterer Teil und hohles oberes Hauptfach.
  const body = roundedSlab(
    'rucksack_hauptkoerper',
    0.44,
    0.22,
    0.22,
    0.025,
    cordura,
    0,
    0.11,
    0
  );
  body.castShadow = true;
  body.receiveShadow = true;

  const backWall = box(
    'hauptfach_rueckwand',
    0.44,
    0.07,
    0.018,
    corduraDark,
    0,
    0.255,
    -0.101
  );
  const frontWall = box(
    'hauptfach_frontwand',
    0.44,
    0.07,
    0.018,
    corduraDark,
    0,
    0.255,
    0.101
  );
  const leftWall = box(
    'hauptfach_seitenwand_links',
    0.018,
    0.07,
    0.20,
    corduraDark,
    -0.211,
    0.255,
    0
  );
  const rightWall = box(
    'hauptfach_seitenwand_rechts',
    0.018,
    0.07,
    0.20,
    corduraDark,
    0.211,
    0.255,
    0
  );
  const innerFloor = box(
    'hauptfach_innenboden',
    0.39,
    0.006,
    0.18,
    linerMat,
    0,
    0.223,
    0
  );

  backWall.receiveShadow = true;
  frontWall.receiveShadow = true;
  leftWall.receiveShadow = true;
  rightWall.receiveShadow = true;

  // --- Vorderseite: große Sanitätstasche, Schnellzugriffstasche und Beschläge.
  const frontPocket = roundedSlab(
    'vordertasche',
    0.35,
    0.19,
    0.055,
    0.017,
    cordura,
    0,
    0.115,
    0.1125
  );
  frontPocket.castShadow = true;

  box(
    'vordertasche_reissverschluss',
    0.315,
    0.009,
    0.010,
    zipperMat,
    0,
    0.203,
    0.143
  );

  const frontPull = box(
    'vordertasche_griff',
    0.012,
    0.038,
    0.008,
    buckleMat,
    0.127,
    0.185,
    0.150
  );
  frontPull.rotation.z = -0.22;

  roundedSlab(
    'schnellzugriffstasche',
    0.21,
    0.06,
    0.038,
    0.012,
    corduraDark,
    0,
    0.239,
    0.105
  );
  box(
    'schnellzugriff_zip',
    0.18,
    0.007,
    0.008,
    zipperMat,
    0,
    0.266,
    0.127
  );

  // --- Schmale Seitentaschen für Verbandmaterial und Flaschen.
  const leftPocket = roundedSlab(
    'seitentasche_links',
    0.055,
    0.21,
    0.155,
    0.014,
    cordura,
    -0.2325,
    0.115,
    0.01
  );
  const rightPocket = roundedSlab(
    'seitentasche_rechts',
    0.055,
    0.21,
    0.155,
    0.014,
    cordura,
    0.2325,
    0.115,
    0.01
  );
  leftPocket.castShadow = true;
  rightPocket.castShadow = true;

  box(
    'seitentasche_links_zip',
    0.008,
    0.175,
    0.009,
    zipperMat,
    -0.262,
    0.12,
    0.023
  );
  box(
    'seitentasche_rechts_zip',
    0.008,
    0.175,
    0.009,
    zipperMat,
    0.262,
    0.12,
    0.023
  );

  // --- Rückseite: Rückenpolster, Abdeckung, Schultergurte und Tragegriff.
  roundedSlab(
    'rueckenpolster',
    0.39,
    0.245,
    0.025,
    0.018,
    corduraDark,
    0,
    0.16,
    -0.118
  );
  roundedSlab(
    'rueckenabdeckung',
    0.145,
    0.255,
    0.018,
    0.014,
    cordura,
    0,
    0.165,
    -0.13
  );

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'links' : 'rechts';

    const strap = box(
      `schultergurt_${suffix}`,
      0.05,
      0.265,
      0.016,
      webbingMat,
      side * 0.118,
      0.155,
      -0.137
    );
    strap.rotation.z = side * 0.11;
    strap.rotation.x = -0.025;

    const padding = roundedSlab(
      `schulterpolster_${suffix}`,
      0.066,
      0.205,
      0.022,
      0.014,
      corduraDark,
      side * 0.124,
      0.165,
      -0.149
    );
    padding.rotation.z = side * 0.11;

    box(
      `schultergurt_anker_${suffix}`,
      0.065,
      0.035,
      0.025,
      webbingMat,
      side * 0.145,
      0.272,
      -0.132
    );
    box(
      `schultergurt_schnalle_${suffix}`,
      0.068,
      0.034,
      0.022,
      buckleMat,
      side * 0.128,
      0.047,
      -0.147
    );
  }

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.072, 0.255, -0.13),
    new THREE.Vector3(-0.072, 0.335, -0.13),
    new THREE.Vector3(0, 0.365, -0.13),
    new THREE.Vector3(0.072, 0.335, -0.13),
    new THREE.Vector3(0.072, 0.255, -0.13),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 28, 0.01, 8, false),
    webbingMat
  );
  handle.name = 'tragegriff';
  handle.castShadow = true;
  root.add(handle);

  // --- Querlaufende Kompressionsgurte.
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'links' : 'rechts';

    box(
      `kompressionsgurt_${suffix}`,
      0.014,
      0.025,
      0.205,
      webbingMat,
      side * 0.254,
      0.19,
      0.012
    );
    box(
      `kompressionsschnalle_${suffix}`,
      0.016,
      0.037,
      0.038,
      buckleMat,
      side * 0.252,
      0.19,
      0.012
    );
  }

  // --- Oberer Verschlussdeckel mit Scharnier an der hinteren Oberkante.
  const flapPivot = new THREE.Group();
  flapPivot.name = 'verschlussdeckel_scharnier';
  flapPivot.position.set(0, 0.289, -0.103);
  root.add(flapPivot);

  roundedSlab(
    'verschlussdeckel',
    0.46,
    0.016,
    0.255,
    0.012,
    cordura,
    0,
    0.008,
    0.1275,
    flapPivot
  );
  roundedSlab(
    'verschlussdeckel_innenfutter',
    0.425,
    0.006,
    0.22,
    0.008,
    corduraDark,
    0,
    0.001,
    0.1275,
    flapPivot
  );
  box(
    'verschlussdeckel_zip',
    0.42,
    0.008,
    0.009,
    zipperMat,
    0,
    0.018,
    0.248,
    flapPivot
  );

  const flapPull = box(
    'verschlussdeckel_griff',
    0.013,
    0.04,
    0.009,
    buckleMat,
    0.13,
    0.001,
    0.255,
    flapPivot
  );
  flapPull.rotation.x = 0.35;

  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.43, 12),
    zipperMat
  );
  hinge.name = 'verschlussdeckel_scharnierstange';
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.289, -0.103);
  root.add(hinge);

  // --- MOLLE-Schlaufen auf der Vordertasche.
  for (let i = 0; i < 3; i++) {
    box(
      `molle_schlaufe_${i + 1}`,
      0.085,
      0.014,
      0.012,
      webbingMat,
      0.102,
      0.065 + i * 0.035,
      0.144
    );
  }

  // --- Roter Sanitätsaufnäher.
  box(
    'sanitaetsaufnaher_hintergrund',
    0.092,
    0.092,
    0.005,
    patchMat,
    -0.105,
    0.12,
    0.1425
  );
  box(
    'sanitaetskreuz_horizontal',
    0.061,
    0.020,
    0.003,
    redMat,
    -0.105,
    0.12,
    0.1465
  );
  box(
    'sanitaetskreuz_vertikal',
    0.020,
    0.061,
    0.003,
    redMat,
    -0.105,
    0.12,
    0.1465
  );

  // --- Etikettenhalter für Versand- und Chargendaten.
  box(
    'etikettenhalter',
    0.105,
    0.042,
    0.007,
    corduraDark,
    0.072,
    0.121,
    0.142
  );
  box(
    'etikett_oberkante',
    0.092,
    0.007,
    0.008,
    zipperMat,
    0.072,
    0.139,
    0.147
  );

  // --- Sanitätsinhalt im geöffneten Hauptfach.
  const contentGroup = new THREE.Group();
  contentGroup.name = 'sanitaetsinhalt';
  root.add(contentGroup);

  for (let i = 0; i < 3; i++) {
    const roll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.105, 18),
      bandageMat
    );
    roll.name = `verbandsrolle_${i + 1}`;
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0.055, 0.25, -0.05 + i * 0.05);
    roll.castShadow = true;
    contentGroup.add(roll);
  }

  const medPouch = box(
    'medikamententasche_rot',
    0.105,
    0.03,
    0.08,
    pouchMat,
    -0.135,
    0.241,
    0.028,
    contentGroup
  );
  medPouch.castShadow = true;

  box(
    'medikamententasche_verschluss',
    0.095,
    0.006,
    0.072,
    zipperMat,
    -0.135,
    0.258,
    0.028,
    contentGroup
  );

  const splint = box(
    'verbandschiene',
    0.028,
    0.014,
    0.15,
    bandageMat,
    0.16,
    0.233,
    0.018,
    contentGroup
  );
  splint.rotation.y = 0.08;

  // Flacher, halbtransparenter Infusionsbeutel im Hauptfach.
  const infusionMat = new THREE.MeshStandardMaterial({
    name: 'infusionsbeutel',
    color: 0xc5dbe0,
    roughness: 0.42,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
  });
  const infusionBag = roundedSlab(
    'infusionsbeutel',
    0.075,
    0.022,
    0.055,
    0.008,
    infusionMat,
    -0.105,
    0.239,
    -0.055,
    contentGroup
  );
  infusionBag.castShadow = true;

  box(
    'infusionsbeutel_etikett',
    0.044,
    0.014,
    0.002,
    patchMat,
    -0.105,
    0.239,
    -0.027,
    contentGroup
  );

  const tubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.105, 0.228, -0.055),
    new THREE.Vector3(-0.092, 0.231, -0.035),
    new THREE.Vector3(-0.08, 0.234, -0.012),
  ]);
  const infusionTube = new THREE.Mesh(
    new THREE.TubeGeometry(tubeCurve, 12, 0.002, 6, false),
    new THREE.MeshStandardMaterial({
      name: 'infusionsschlauch',
      color: 0xd8e5e8,
      roughness: 0.35,
      transparent: true,
      opacity: 0.8,
    })
  );
  infusionTube.name = 'infusionsschlauch';
  contentGroup.add(infusionTube);

  // --- Bernsteinfarbene Ampulle in der rechten Seitentasche.
  const vialMaterial = new THREE.MeshStandardMaterial({
    name: 'bernsteinampulle',
    color: 0xb97832,
    metalness: 0.05,
    roughness: 0.28,
    transparent: true,
    opacity: 0.9,
  });
  const vial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.046, 12),
    vialMaterial
  );
  vial.name = 'ampulle';
  vial.position.set(0.2325, 0.205, 0.075);
  root.add(vial);

  const vialCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.011, 12),
    new THREE.MeshStandardMaterial({
      name: 'ampullenkappe',
      color: 0xd9d6cb,
      metalness: 0.02,
      roughness: 0.72,
    })
  );
  vialCap.name = 'ampullenkappe';
  vialCap.position.set(0.2325, 0.233, 0.075);
  root.add(vialCap);

  const vialLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.014, 0.0025, 6, 16),
    webbingMat
  );
  vialLoop.name = 'ampullenhalteschlaufe';
  vialLoop.rotation.y = Math.PI / 2;
  vialLoop.position.set(0.2325, 0.204, 0.075);
  root.add(vialLoop);

  // --- Kollisionskörper für den feststehenden Rucksack.
  // Der bewegte Verschlussdeckel ist bewusst nicht Teil des Kollisionskörpers.
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.3));
  col.name = 'COL_rucksack';
  col.position.set(0, 0.18, -0.005);
  root.add(col);

  // --- Benutzen-Punkt vor dem Rucksack in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_use';
  use.position.set(0, 0.26, 0.24);
  use.userData = {
    label: 'Notfall-Sanitätsrucksack öffnen',
    radius: 0.8,
  };
  root.add(use);

  // --- Zustand und weiche Deckelbewegung.
  let offen = false;
  let winkel = 0;
  let letzte = null;

  function update(dt) {
    const ziel = offen ? -1.15 : 0;
    winkel += (ziel - winkel) * Math.min(1, dt * 6);
    flapPivot.rotation.x = winkel;
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  const api = {
    öffnen() {
      offen = true;
    },
    schließen() {
      offen = false;
    },
    umschalten() {
      offen = !offen;
    },
    get offen() {
      return offen;
    },
    get ausfuellgrad() {
      return 'voll';
    },
    get inhalt() {
      return 'Verbände, Medikamente, Infusionsbeutel und Schienen';
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.hinweis =
    'Heil-/Verbrauchsgegenstände: Verbände, Medikamente, Infusionen und Schienen.';
  root.userData.actions = [
    {
      id: 'open',
      label: 'Rucksack öffnen',
      run: () => api.öffnen(),
    },
    {
      id: 'close',
      label: 'Rucksack schließen',
      run: () => api.schließen(),
    },
  ];

  if (opts && opts.offen) {
    offen = true;
    winkel = -1.15;
    flapPivot.rotation.x = winkel;
  }

  return root;
}

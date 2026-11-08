// Stasis-Pod für die Stasis-Kammer (ATL-039)
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'stasis_pod',
  art: 'Standobjekt',
  masse: '0,90 × 2,34 × 0,75 (B × H × T, m)',
  wohin: 'ATL-039 (Stasis-Kammer / Stasis Chamber Room)',
  benutzen: 'INT_stasis → Stasis aktivieren, Notabschaltung, Zeitsprung, ZPM-Wechsel',
  lichter: 'LAMP_stasis (eisblau), LAMP_status (bernstein)',
  animation: 'Kraftfeld, Innenraum und Leuchtleisten pulsieren; Statusanzeige zeigt Betrieb, Abschaltung und Notfall',
  quelle: 'selbst gebaut nach den Referenzbildern der Atlantis-Stasiskapseln',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'stasis_pod';

  const mitInsasse = opts.insasse !== false;
  const startAktiv = opts.aktiv !== false;
  const startNotfall = opts.notfall === true;

  const material = (name, params = {}) => {
    const mat = new THREE.MeshStandardMaterial(params);
    mat.name = name;
    return mat;
  };

  const mats = {
    wall: material('KIT_wall', {
      color: 0x8998a3,
      metalness: 0.7,
      roughness: 0.36,
    }),
    dark: material('KIT_wallDark', {
      color: 0x132632,
      metalness: 0.78,
      roughness: 0.4,
    }),
    silver: material('KIT_pillar', {
      color: 0xb7c6ce,
      metalness: 0.82,
      roughness: 0.27,
    }),
    copper: material('KIT_copper', {
      color: 0x9b6435,
      metalness: 0.9,
      roughness: 0.28,
    }),
    glow: material('KIT_glow', {
      color: 0xc8f6ff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.7,
      metalness: 0.08,
      roughness: 0.22,
    }),
    amber: material('KIT_amberGlow', {
      color: 0xffc47c,
      emissive: 0xff9b35,
      emissiveIntensity: 1.05,
      metalness: 0.12,
      roughness: 0.3,
    }),
    glass: material('KIT_glass', {
      color: 0x87d3ef,
      emissive: 0x214b62,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.35,
      metalness: 0.06,
      roughness: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    garment: material('insasse_kleidung', {
      color: 0xdfe7e8,
      roughness: 0.86,
      metalness: 0.01,
    }),
    skin: material('insasse_haut', {
      color: 0xc69378,
      roughness: 0.72,
      metalness: 0,
    }),
    hair: material('insasse_haar', {
      color: 0x3b302d,
      roughness: 0.92,
      metalness: 0,
    }),
  };

  const addBox = (name, w, h, d, x, y, z, mat, parent = root) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (name, radius, height, x, y, z, mat, parent = root) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 12),
      mat
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const addSphere = (name, radius, x, y, z, mat, parent = root, scaleY = 1) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 12),
      mat
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.y = scaleY;
    parent.add(mesh);
    return mesh;
  };

  const addRectFrame = (
    name,
    cx,
    cy,
    width,
    height,
    thickness,
    depth,
    z,
    mat,
    parent
  ) => {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(cx, cy, z);
    parent.add(group);

    addBox(
      `${name}_links`,
      thickness,
      height,
      depth,
      -width / 2 + thickness / 2,
      0,
      0,
      mat,
      group
    );
    addBox(
      `${name}_rechts`,
      thickness,
      height,
      depth,
      width / 2 - thickness / 2,
      0,
      0,
      mat,
      group
    );
    addBox(
      `${name}_oben`,
      width,
      thickness,
      depth,
      0,
      height / 2 - thickness / 2,
      0,
      mat,
      group
    );
    addBox(
      `${name}_unten`,
      width,
      thickness,
      depth,
      0,
      -height / 2 + thickness / 2,
      0,
      mat,
      group
    );

    return group;
  };

  // --- Geschlossenes Gehäuse: 0,90 m breit, 2,34 m hoch, 0,75 m tief.
  const shell = new THREE.Group();
  shell.name = 'kapsel_gehaeuse';
  root.add(shell);

  addBox('sockel', 0.90, 0.14, 0.75, 0, 0.07, 0, mats.dark, shell);
  addBox('deckenabschluss', 0.90, 0.12, 0.75, 0, 2.28, 0, mats.wall, shell);

  addBox(
    'nische_seitenwand_links',
    0.09,
    2.08,
    0.70,
    -0.405,
    1.19,
    -0.01,
    mats.wall,
    shell
  );
  addBox(
    'nische_seitenwand_rechts',
    0.09,
    2.08,
    0.70,
    0.405,
    1.19,
    -0.01,
    mats.wall,
    shell
  );
  addBox(
    'nische_rueckwand',
    0.90,
    2.08,
    0.08,
    0,
    1.19,
    -0.335,
    mats.wall,
    shell
  );

  addBox('innenboden', 0.64, 0.08, 0.56, 0, 0.16, -0.025, mats.silver, shell);
  addBox('innendecke', 0.64, 0.05, 0.56, 0, 2.05, -0.025, mats.silver, shell);
  addBox('innenwand_links', 0.025, 1.86, 0.56, -0.335, 1.105, -0.025, mats.dark, shell);
  addBox('innenwand_rechts', 0.025, 1.86, 0.56, 0.335, 1.105, -0.025, mats.dark, shell);

  // --- Dunkles, flaches Gitterwerk an der Rückwand der Nische.
  const ornament = new THREE.Group();
  ornament.name = 'nischen_gitterwerk';
  root.add(ornament);

  addBox(
    'gitter_hintergrund',
    0.64,
    1.88,
    0.018,
    0,
    1.105,
    -0.282,
    mats.silver,
    ornament
  );

  addRectFrame(
    'gitter_outer',
    0,
    1.105,
    0.61,
    1.84,
    0.022,
    0.018,
    -0.264,
    mats.dark,
    ornament
  );
  addRectFrame(
    'gitter_inner',
    0,
    1.105,
    0.53,
    1.73,
    0.017,
    0.018,
    -0.254,
    mats.dark,
    ornament
  );

  const gridMatrix = new THREE.Matrix4();

  const verticalGrid = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.014, 1.70, 0.014),
    mats.dark,
    4
  );
  verticalGrid.name = 'gitter_vertikal';
  verticalGrid.castShadow = false;

  for (let i = 0; i < 4; i++) {
    gridMatrix.makeTranslation(-0.225 + i * 0.15, 1.105, -0.242);
    verticalGrid.setMatrixAt(i, gridMatrix);
  }
  verticalGrid.instanceMatrix.needsUpdate = true;
  ornament.add(verticalGrid);

  const horizontalGrid = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.58, 0.014, 0.014),
    mats.dark,
    6
  );
  horizontalGrid.name = 'gitter_horizontal';
  horizontalGrid.castShadow = false;

  for (let i = 0; i < 6; i++) {
    gridMatrix.makeTranslation(0, 0.36 + i * 0.295, -0.241);
    horizontalGrid.setMatrixAt(i, gridMatrix);
  }
  horizontalGrid.instanceMatrix.needsUpdate = true;
  ornament.add(horizontalGrid);

  // ZPM-Anschluss hinter dem Gitterwerk.
  const zpmPort = addCylinder(
    'zpm_anschluss',
    0.072,
    0.035,
    0,
    1.87,
    -0.205,
    mats.copper,
    ornament
  );
  zpmPort.rotation.x = Math.PI / 2;

  const zpmCore = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.009, 8, 24),
    mats.glow
  );
  zpmCore.name = 'zpm_leuchtring';
  zpmCore.position.set(0, 1.87, -0.184);
  ornament.add(zpmCore);

  // --- Dunkle Seitenpaneele und verschachtelte Rahmen an der Front.
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'links' : 'rechts';
    const x = side * 0.345;

    addBox(
      `seitenpaneel_${suffix}`,
      0.085,
      1.86,
      0.028,
      x,
      1.105,
      0.333,
      mats.dark,
      shell
    );

    addRectFrame(
      `seitenpaneel_${suffix}_rahmen_aussen`,
      x,
      1.105,
      0.071,
      1.80,
      0.010,
      0.014,
      0.352,
      mats.silver,
      shell
    );

    addRectFrame(
      `seitenpaneel_${suffix}_rahmen_innen`,
      x,
      1.105,
      0.050,
      1.62,
      0.009,
      0.014,
      0.358,
      mats.dark,
      shell
    );
  }

  // Weiß-blaue senkrechte Leuchtleisten links und rechts der Glasfront.
  addBox(
    'leuchtstreifen_links',
    0.024,
    1.88,
    0.024,
    -0.292,
    1.105,
    0.357,
    mats.glow,
    shell
  );
  addBox(
    'leuchtstreifen_rechts',
    0.024,
    1.88,
    0.024,
    0.292,
    1.105,
    0.357,
    mats.glow,
    shell
  );

  // Geschlossener unterer Frontrahmen mit Bronze- und Silberakzent.
  addBox('frontblende_unten', 0.72, 0.13, 0.03, 0, 0.255, 0.34, mats.dark, shell);
  addBox('sockelblende', 0.52, 0.11, 0.024, 0, 0.255, 0.361, mats.copper, shell);
  addBox('sockel_silberstreifen', 0.44, 0.012, 0.012, 0, 0.205, 0.375, mats.silver, shell);

  // Oberer Abschluss mit schmaler Kupferleiste.
  addBox('frontblende_oben', 0.72, 0.10, 0.028, 0, 2.20, 0.34, mats.dark, shell);
  addBox('decken_kupferleiste', 0.72, 0.025, 0.022, 0, 2.205, 0.356, mats.copper, shell);

  // --- Transparente, geschlossene Glas-/Kraftfeldfront.
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.555, 1.84, 0.018),
    mats.glass
  );
  glass.name = 'kraftfeld_front';
  glass.position.set(0, 1.105, 0.325);
  glass.renderOrder = 4;
  root.add(glass);

  // Dezentes Energienetz direkt hinter der Glasfront.
  const field = new THREE.Group();
  field.name = 'kraftfeld_gitter';
  field.position.set(0, 0, 0.306);
  root.add(field);

  const fieldVertical = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.007, 1.72, 0.007),
    mats.glow,
    3
  );
  fieldVertical.name = 'kraftfeld_vertikal';

  for (let i = 0; i < 3; i++) {
    gridMatrix.makeTranslation(-0.22 + i * 0.22, 1.105, 0);
    fieldVertical.setMatrixAt(i, gridMatrix);
  }
  fieldVertical.instanceMatrix.needsUpdate = true;
  field.add(fieldVertical);

  const fieldHorizontal = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.50, 0.006, 0.007),
    mats.glow,
    5
  );
  fieldHorizontal.name = 'kraftfeld_horizontal';

  for (let i = 0; i < 5; i++) {
    gridMatrix.makeTranslation(0, 0.46 + i * 0.32, 0);
    fieldHorizontal.setMatrixAt(i, gridMatrix);
  }
  fieldHorizontal.instanceMatrix.needsUpdate = true;
  field.add(fieldHorizontal);

  // --- Statusanzeige am unteren Rahmen.
  addBox('statusfeld', 0.29, 0.068, 0.02, 0, 0.255, 0.379, mats.dark, shell);

  const statusLeds = [];
  for (let i = 0; i < 5; i++) {
    const led = addBox(
      `status_led_${i}`,
      0.022,
      0.022,
      0.010,
      -0.088 + i * 0.044,
      0.255,
      0.392,
      mats.amber,
      shell
    );
    statusLeds.push(led);
  }

  // --- Optionaler Insasse als schlichte, helle Figur.
  if (mitInsasse) {
    const person = new THREE.Group();
    person.name = 'insasse';
    person.position.set(0, 0.19, -0.035);
    root.add(person);

    addBox('schuh_links', 0.105, 0.075, 0.18, -0.072, 0.037, 0.022, mats.garment, person);
    addBox('schuh_rechts', 0.105, 0.075, 0.18, 0.072, 0.037, 0.022, mats.garment, person);

    addCylinder('bein_links', 0.055, 0.70, -0.072, 0.425, 0, mats.garment, person);
    addCylinder('bein_rechts', 0.055, 0.70, 0.072, 0.425, 0, mats.garment, person);

    const torso = addCylinder(
      'rumpf',
      0.145,
      0.57,
      0,
      1.065,
      0,
      mats.garment,
      person
    );
    torso.scale.z = 0.68;

    addSphere('schultern', 0.155, 0, 1.31, 0, mats.garment, person, 0.55);
    addCylinder('arm_links', 0.041, 0.56, -0.178, 1.025, 0.004, mats.garment, person);
    addCylinder('arm_rechts', 0.041, 0.56, 0.178, 1.025, 0.004, mats.garment, person);
    addSphere('hand_links', 0.043, -0.178, 0.71, 0.006, mats.skin, person, 1.15);
    addSphere('hand_rechts', 0.043, 0.178, 0.71, 0.006, mats.skin, person, 1.15);

    addCylinder('hals', 0.044, 0.10, 0, 1.40, 0, mats.skin, person);
    addSphere('kopf', 0.102, 0, 1.535, 0, mats.skin, person, 1.18);
    addSphere('haar', 0.104, 0, 1.575, -0.012, mats.hair, person, 0.7);

    addBox('insassen_leuchte', 0.12, 0.012, 0.012, 0, 1.205, 0.102, mats.glow, person);
  }

  // --- Unsichtbarer Kollisionskörper.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 2.34, 0.75),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  col.name = 'COL_stasis_pod';
  col.position.set(0, 1.17, 0);
  root.add(col);

  // --- Benutzen-Punkt vor der Kapsel.
  const use = new THREE.Object3D();
  use.name = 'INT_stasis';
  use.position.set(0, 1.10, 0.64);
  use.userData = {
    label: 'Stasis-Kapsel bedienen',
    radius: 0.85,
  };
  root.add(use);

  // --- Dauerhaft vorhandene Lichter.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_stasis';
  lamp.position.set(0, 1.78, 0.12);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 6,
    distance: 3.6,
  };
  root.add(lamp);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0, 0.27, 0.44);
  lampStatus.userData = {
    color: '#ffb45c',
    intensity: 2,
    distance: 1.8,
  };
  root.add(lampStatus);

  // --- Zustand und Animation.
  let aktiv = startAktiv;
  let notfall = startNotfall;
  let stasisJahre = Number.isFinite(Number(opts.stasisjahre))
    ? Math.max(0, Number(opts.stasisjahre))
    : 0;
  let alterJahre = stasisJahre / 200;
  let zpmWechsel = 0;
  let zeit = 0;
  let letzte = null;
  let energie = aktiv ? 1 : 0;

  function setAktiv(neu) {
    aktiv = !!neu;
    if (aktiv) notfall = false;
    return aktiv;
  }

  function setNotfall() {
    notfall = true;
    aktiv = false;
    return notfall;
  }

  function zeitsprung(jahre) {
    const wert = Number(jahre);
    if (!Number.isFinite(wert) || wert <= 0 || !aktiv) return 0;
    stasisJahre += wert;
    alterJahre += wert / 200;
    return stasisJahre;
  }

  function wechselZpm() {
    if (!aktiv) return zpmWechsel;
    zpmWechsel += 1;
    return zpmWechsel;
  }

  function update(dt) {
    zeit += dt;
    const k = Math.min(1, dt * 5);
    const zielEnergie = aktiv ? 1 : 0;
    energie += (zielEnergie - energie) * k;

    mats.glow.emissiveIntensity =
      0.12 + energie * (1.65 + Math.sin(zeit * 3.1) * 0.20);

    mats.glass.opacity =
      0.30 + energie * 0.06 + Math.sin(zeit * 1.7) * 0.012;

    mats.glass.emissiveIntensity =
      0.10 + energie * (0.34 + Math.sin(zeit * 2.4) * 0.04);

    const amberZiel = notfall
      ? 1.8 + Math.sin(zeit * 5.2) * 0.65
      : aktiv
        ? 1.0 + Math.sin(zeit * 2.2) * 0.18
        : 0.07;

    mats.amber.emissiveIntensity +=
      (amberZiel - mats.amber.emissiveIntensity) * k;

    statusLeds.forEach((led, i) => {
      let sichtbar = 0.08;

      if (notfall) {
        sichtbar = Math.sin(zeit * 6 + i * 0.9) > 0 ? 1 : 0.15;
      } else if (aktiv) {
        sichtbar = i < 4 ? 1 : Math.sin(zeit * 3 + i) > 0 ? 1 : 0.25;
      }

      const s = 0.72 + sichtbar * 0.28;
      led.scale.set(s, s, 1);
    });
  }

  glass.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(Math.max(now - letzte, 0), 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    aktivieren() {
      return setAktiv(true);
    },
    abschalten() {
      notfall = false;
      return setAktiv(false);
    },
    notabschaltung() {
      return setNotfall();
    },
    zeitsprung(jahre) {
      return zeitsprung(jahre);
    },
    zpmWechseln() {
      return wechselZpm();
    },
    get aktiv() {
      return aktiv;
    },
    get notfall() {
      return notfall;
    },
    get stasisJahre() {
      return stasisJahre;
    },
    get alterJahre() {
      return alterJahre;
    },
    get zpmWechsel() {
      return zpmWechsel;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'stasis_einschalten',
      label: 'Stasis aktivieren',
      run: () => api.aktivieren(),
    },
    {
      id: 'stasis_ausschalten',
      label: 'Stasis-Kapsel ausschalten',
      run: () => api.abschalten(),
    },
    {
      id: 'notabschaltung',
      label: 'Notabschaltung auslösen',
      run: () => api.notabschaltung(),
    },
    {
      id: 'zeitsprung',
      label: 'Zeitsprung: 200 Stasisjahre',
      run: () => api.zeitsprung(200),
    },
    {
      id: 'zpm_wechsel',
      label: 'ZPM-Modul wechseln',
      run: () => api.zpmWechseln(),
    },
  ];

  return root;
}

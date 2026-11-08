import * as THREE from 'three';

export const steckbrief = {
  name: 'wraith_stunner_rifle',
  art: 'Standobjekt / Wraith-Fernwaffe',
  masse: 'ca. 4,2 kg; 1,18 × 0,20 × 0,17 m',
  wohin: 'ATL-030 Waffenkammer / Armory, ATL-031 Zellen / Arrest (Brig)',
  benutzen: 'INT_feuern → Betäubungspuls auslösen',
  lichter: 'LAMP_kammern (bernsteinfarben), blaue Leuchtfugen',
  animation: 'Energiespeicher pulsieren; beim Feuern läuft ein Impuls durch die Kapseln, die Mündung blitzt und das Gewehr stößt leicht zurück',
  quelle: 'selbst gebaut nach OBJ-061 und den Referenzbildern; Spielhinweis: Gegnerwaffe bzw. Beute',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'wraith_stunner_rifle';

  // Alle sichtbaren Teile liegen in dieser Gruppe. Das root bleibt für das
  // Spiel ortsfest, sodass sich nur das Gewehr beim Schuss zurückbewegt.
  const waffe = new THREE.Group();
  waffe.name = 'wraith_stunner_rifle_gehaeuse';
  root.add(waffe);

  // --- Materialien ---------------------------------------------------------
  const organisch = new THREE.MeshStandardMaterial({
    name: 'wraith_organisch',
    color: 0x39271e,
    metalness: 0.58,
    roughness: 0.44,
  });

  const organischHell = new THREE.MeshStandardMaterial({
    name: 'wraith_organisch_hell',
    color: 0x684632,
    metalness: 0.5,
    roughness: 0.47,
  });

  const organischDunkel = new THREE.MeshStandardMaterial({
    name: 'wraith_organisch_dunkel',
    color: 0x211713,
    metalness: 0.66,
    roughness: 0.38,
  });

  const stahl = new THREE.MeshStandardMaterial({
    name: 'wraith_stahl',
    color: 0x252b2f,
    metalness: 0.88,
    roughness: 0.29,
  });

  const bronzefassung = new THREE.MeshStandardMaterial({
    name: 'wraith_bronzefassung',
    color: 0x8a582f,
    metalness: 0.8,
    roughness: 0.34,
  });

  const blau = new THREE.MeshStandardMaterial({
    name: 'wraith_blau',
    color: 0x075269,
    emissive: 0x087f9e,
    emissiveIntensity: 0.82,
    metalness: 0.48,
    roughness: 0.26,
  });

  const kapselglas = new THREE.MeshStandardMaterial({
    name: 'wraith_kapselglas',
    color: 0xffedb0,
    emissive: 0xffbd3d,
    emissiveIntensity: 0.3,
    metalness: 0.05,
    roughness: 0.1,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
  });

  const dunkel = new THREE.MeshStandardMaterial({
    name: 'wraith_dunkel',
    color: 0x121619,
    metalness: 0.72,
    roughness: 0.36,
  });

  // --- Geschlossener organischer Grundkörper ------------------------------
  // Der Rotationskörper verläuft entlang Z. Die Profile beginnen und enden
  // bei Radius 0, sodass Vorder- und Rückseite geschlossen sind.
  const profil = [
    new THREE.Vector2(0, -0.29),
    new THREE.Vector2(0.036, -0.29),
    new THREE.Vector2(0.047, -0.265),
    new THREE.Vector2(0.061, -0.215),
    new THREE.Vector2(0.071, -0.135),
    new THREE.Vector2(0.076, -0.045),
    new THREE.Vector2(0.075, 0.055),
    new THREE.Vector2(0.068, 0.145),
    new THREE.Vector2(0.054, 0.215),
    new THREE.Vector2(0.038, 0.27),
    new THREE.Vector2(0, 0.3),
  ];

  const gehaeuseGeo = new THREE.LatheGeometry(profil, 16);
  gehaeuseGeo.rotateX(Math.PI / 2);

  const gehaeuse = new THREE.Mesh(gehaeuseGeo, organisch);
  gehaeuse.name = 'organischer_gehaeusekern';
  gehaeuse.position.set(0, 0.086, 0.015);
  waffe.add(gehaeuse);

  // Flache Unterschiene: Gewicht liegt auf y = 0.
  const schiene = new THREE.Mesh(
    new THREE.BoxGeometry(0.094, 0.026, 0.47),
    organischDunkel
  );
  schiene.name = 'unterseite_schiene';
  schiene.position.set(0, 0.013, 0.015);
  waffe.add(schiene);

  // Geschlossene seitliche Panzerplatten.
  for (const x of [-0.069, 0.069]) {
    const platte = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.064, 0.43),
      organischHell
    );
    platte.name = x < 0 ? 'panzerplatte_links' : 'panzerplatte_rechts';
    platte.position.set(x, 0.077, 0.005);
    waffe.add(platte);
  }

  // --- Segmentrippen --------------------------------------------------------
  const rippenGeo = new THREE.TorusGeometry(0.079, 0.009, 5, 10);
  const rippenZ = [-0.225, -0.15, -0.075, 0, 0.075, 0.15, 0.225];

  for (let i = 0; i < rippenZ.length; i++) {
    const rippe = new THREE.Mesh(rippenGeo, organischHell);
    rippe.name = `organische_segmentrippe_${i + 1}`;
    rippe.position.set(0, 0.086, rippenZ[i]);
    rippe.scale.y = 0.82;
    waffe.add(rippe);
  }

  // --- Sieben kristalline Energiespeicher -----------------------------------
  const kapselAnzahl = 7;
  const kapselAbstand = 0.065;
  const kapselY = 0.126;
  const kapselZ = [];

  const kapselGeo = new THREE.SphereGeometry(0.04, 10, 7);
  const kernGeo = new THREE.SphereGeometry(0.023, 8, 6);
  const ringGeo = new THREE.TorusGeometry(0.045, 0.0045, 5, 10);

  const kapselGlasMeshes = [];
  const kapselKernMeshes = [];

  for (let i = 0; i < kapselAnzahl; i++) {
    const z = -0.195 + i * kapselAbstand;
    kapselZ.push(z);

    const glas = new THREE.Mesh(kapselGeo, kapselglas);
    glas.name = `energiespeicher_glas_${i + 1}`;
    glas.position.set(0, kapselY, z);
    glas.scale.z = 1.16;
    glas.renderOrder = 2;
    waffe.add(glas);
    kapselGlasMeshes.push(glas);

    const kernMat = new THREE.MeshStandardMaterial({
      name: `wraith_kapselkern_${i + 1}`,
      color: 0xffdf8a,
      emissive: 0xffad24,
      emissiveIntensity: 0.78,
      metalness: 0.16,
      roughness: 0.22,
    });

    const kern = new THREE.Mesh(kernGeo, kernMat);
    kern.name = `energiespeicher_kern_${i + 1}`;
    kern.position.set(0, kapselY, z);
    kern.scale.z = 1.5;
    kern.renderOrder = 1;
    waffe.add(kern);
    kapselKernMeshes.push(kern);

    const ring = new THREE.Mesh(ringGeo, bronzefassung);
    ring.name = `energiespeicher_ring_${i + 1}`;
    ring.position.set(0, kapselY, z);
    waffe.add(ring);
  }

  // --- Blaue Leuchtfugen an beiden Flanken ---------------------------------
  for (const x of [-0.08, 0.08]) {
    for (let i = 0; i < 6; i++) {
      const akzent = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.011, 0.039),
        blau
      );
      akzent.name = 'blaue_leuchtfuge';
      akzent.position.set(x, 0.099, -0.215 + i * 0.086);
      waffe.add(akzent);
    }
  }

  // --- Vorderer Hals und spitz zulaufender Lauf nach +Z ---------------------
  const frontHalsGeo = new THREE.CylinderGeometry(0.031, 0.042, 0.09, 12);
  frontHalsGeo.rotateX(Math.PI / 2);

  const frontHals = new THREE.Mesh(frontHalsGeo, organischHell);
  frontHals.name = 'vorderer_hals';
  frontHals.position.set(0, 0.086, 0.295);
  waffe.add(frontHals);

  // radiusTop liegt nach der Drehung an +Z und bildet die Mündungsspitze.
  const laufGeo = new THREE.CylinderGeometry(0.006, 0.029, 0.25, 12);
  laufGeo.rotateX(Math.PI / 2);

  const lauf = new THREE.Mesh(laufGeo, organisch);
  lauf.name = 'vorderer_lauf';
  lauf.position.set(0, 0.086, 0.46);
  waffe.add(lauf);

  const laufRingGeo = new THREE.TorusGeometry(0.025, 0.004, 5, 10);
  const laufRingDaten = [
    { z: 0.35, radius: 0.029 },
    { z: 0.408, radius: 0.022 },
    { z: 0.465, radius: 0.0145 },
  ];

  for (let i = 0; i < laufRingDaten.length; i++) {
    const daten = laufRingDaten[i];
    const ring = new THREE.Mesh(laufRingGeo, stahl);
    ring.name = 'lauf_verstaerkung';
    ring.position.set(0, 0.086, daten.z);
    ring.scale.setScalar(daten.radius / 0.025);
    waffe.add(ring);
  }

  const blauerBasisring = new THREE.Mesh(
    new THREE.TorusGeometry(0.034, 0.004, 5, 12),
    blau
  );
  blauerBasisring.name = 'blauer_lauf_basisring';
  blauerBasisring.position.set(0, 0.086, 0.338);
  waffe.add(blauerBasisring);

  // Kleine blau leuchtende Laufmündung.
  const mundungsring = new THREE.Mesh(
    new THREE.TorusGeometry(0.0075, 0.0018, 5, 10),
    blau
  );
  mundungsring.name = 'leuchtende_laufmundung';
  mundungsring.position.set(0, 0.086, 0.584);
  waffe.add(mundungsring);

  // --- Hintere Fassung ------------------------------------------------------
  const hintereFassungGeo = new THREE.CylinderGeometry(0.043, 0.053, 0.11, 12);
  hintereFassungGeo.rotateX(Math.PI / 2);

  const hintereFassung = new THREE.Mesh(hintereFassungGeo, organischHell);
  hintereFassung.name = 'hintere_fassung';
  hintereFassung.position.set(0, 0.086, -0.285);
  waffe.add(hintereFassung);

  // --- Großes Bajonett nach -Z ---------------------------------------------
  // Das geschlossene Extrusionsprofil wird waagerecht ausgerichtet.
  const bajonettForm = new THREE.Shape();
  bajonettForm.moveTo(-0.058, 0);
  bajonettForm.lineTo(0.058, 0);
  bajonettForm.lineTo(0.049, 0.075);
  bajonettForm.lineTo(0.025, 0.19);
  bajonettForm.lineTo(0, 0.27);
  bajonettForm.lineTo(-0.025, 0.19);
  bajonettForm.lineTo(-0.049, 0.075);
  bajonettForm.closePath();

  const bajonettGeo = new THREE.ExtrudeGeometry(bajonettForm, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.003,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 1,
  });
  bajonettGeo.rotateX(-Math.PI / 2);

  const bajonett = new THREE.Mesh(bajonettGeo, stahl);
  bajonett.name = 'grosses_hinteres_bajonett';
  bajonett.position.set(0, 0.053, -0.327);
  waffe.add(bajonett);

  // Bronzene Mittelrippe und kleine Querverstärkungen.
  const bajonettRippe = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.026, 0.24),
    bronzefassung
  );
  bajonettRippe.name = 'bajonett_mittelrippe';
  bajonettRippe.position.set(0, 0.053, -0.458);
  waffe.add(bajonettRippe);

  for (const z of [-0.375, -0.435, -0.495, -0.545]) {
    const verstärkung = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.025, 0.007),
      organischDunkel
    );
    verstärkung.name = 'bajonett_querverstaerkung';
    verstärkung.position.set(0, 0.053, z);
    waffe.add(verstärkung);
  }

  // --- Griff, Auslöser und Schutzbügel ------------------------------------
  const griff = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.038, 0.115),
    organischHell
  );
  griff.name = 'griffstuetze';
  griff.position.set(0.064, 0.057, -0.19);
  waffe.add(griff);

  const ausloeser = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.036, 0.016),
    dunkel
  );
  ausloeser.name = 'ausloeser';
  ausloeser.position.set(0.072, 0.052, -0.125);
  waffe.add(ausloeser);

  const buegel = new THREE.Mesh(
    new THREE.TorusGeometry(0.027, 0.0045, 5, 12),
    stahl
  );
  buegel.name = 'ausloeser_schutzbuegel';
  buegel.position.set(0.067, 0.05, -0.125);
  buegel.rotation.y = Math.PI / 2;
  waffe.add(buegel);

  // --- Mündungsblitz --------------------------------------------------------
  const blitzMaterial = new THREE.MeshBasicMaterial({
    name: 'wraith_muendungsblitz',
    color: 0xffe59a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const muendungsBlitz = new THREE.Mesh(
    new THREE.SphereGeometry(1, 10, 6),
    blitzMaterial
  );
  muendungsBlitz.name = 'muendungsblitz';
  muendungsBlitz.position.set(0, 0.086, 0.6);
  muendungsBlitz.visible = false;
  waffe.add(muendungsBlitz);

  // --- Kollisionskörper -----------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.18, 1.22),
    new THREE.MeshBasicMaterial({
      name: 'kollisionsmaterial',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  col.name = 'COL_wraith_stunner_rifle';
  col.position.set(0, 0.09, -0.005);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt und Licht ---------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_feuern';
  use.position.set(0, 0.27, 0.17);
  use.userData = {
    label: 'Betäubungspuls feuern',
    radius: 0.8,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_kammern';
  lamp.position.set(0, 0.19, 0.035);
  lamp.userData = {
    color: '#ffc84d',
    intensity: 5,
    distance: 2.4,
  };
  root.add(lamp);

  // --- Zustand und Animation ------------------------------------------------
  let zeit = 0;
  let cooldown = 0;
  let feuerAlter = Number.POSITIVE_INFINITY;
  let ausloeserDruck = 0;
  let rueckstoss = 0;
  let letzte = null;

  function update(dt) {
    const schritt = Math.max(0, Math.min(dt, 0.1));
    zeit += schritt;
    cooldown = Math.max(0, cooldown - schritt);
    feuerAlter += schritt;

    ausloeserDruck +=
      (0 - ausloeserDruck) * Math.min(1, schritt * 12);

    rueckstoss +=
      (0 - rueckstoss) * Math.min(1, schritt * 8);

    waffe.position.z = -rueckstoss * 0.025;

    const grundPuls = 0.5 + 0.5 * Math.sin(zeit * 1.7);
    const feuerEnergie =
      feuerAlter < 0.55 ? Math.exp(-feuerAlter * 6.5) : 0;

    kapselglas.emissiveIntensity =
      0.26 + grundPuls * 0.08 + feuerEnergie * 1.25;
    blau.emissiveIntensity = 0.74 + feuerEnergie * 1.15;

    // Impulswelle läuft von der hinteren zur vorderen Energiespeicher-Kapsel.
    for (let i = 0; i < kapselAnzahl; i++) {
      const lokal = feuerAlter - i * 0.035;
      const welle =
        lokal >= 0 && lokal < 0.4
          ? Math.exp(-lokal * 8) * (1 - lokal / 0.4)
          : 0;

      const puls = grundPuls * 0.035 + welle;
      const glas = kapselGlasMeshes[i];
      const kern = kapselKernMeshes[i];

      glas.scale.set(
        1 + puls * 0.13,
        1 + puls * 0.13,
        1.16 * (1 + puls * 0.38)
      );

      kern.scale.set(
        1 + puls * 0.45,
        1 + puls * 0.45,
        1.5 * (1 + puls * 0.7)
      );

      kern.material.emissiveIntensity =
        0.72 + grundPuls * 0.14 + welle * 3.1;
    }

    ausloeser.position.x = 0.072 - ausloeserDruck * 0.011;

    muendungsBlitz.visible = feuerEnergie > 0.015;
    if (muendungsBlitz.visible) {
      const s = feuerEnergie;
      muendungsBlitz.scale.set(
        0.022 + s * 0.044,
        0.022 + s * 0.044,
        0.032 + s * 0.085
      );
      blitzMaterial.opacity = Math.min(0.88, s * 1.1);
    } else {
      blitzMaterial.opacity = 0;
    }
  }

  gehaeuse.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  // --- Öffentliche API ------------------------------------------------------
  const reloadzeit = 1.15;

  const api = {
    feuern() {
      if (cooldown > 0) return false;

      cooldown = reloadzeit;
      feuerAlter = 0;
      ausloeserDruck = 1;
      rueckstoss = 1;
      return true;
    },

    get bereit() {
      return cooldown <= 0;
    },

    get aufladung() {
      return Math.max(0, Math.min(1, 1 - cooldown / reloadzeit));
    },

    get cooldown() {
      return cooldown;
    },

    get feuert() {
      return feuerAlter < 0.55;
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'feuern',
      label: 'Betäubungspuls feuern',
      run: () => api.feuern(),
    },
  ];

  return root;
}

import * as THREE from 'three';

export const steckbrief = {
  name: 'door_panel',
  art: 'Wandobjekt',
  masse: '0,10 × 0,30 × 0,065 m (B × H × T)',
  wohin: 'Neben antiken Türen in ATL-001, ATL-003, ATL-024 und ATL-025; Unterkante bei ca. 1,20 m über Boden',
  benutzen: 'INT_bedienen → Tür öffnen/schließen, verriegeln/entriegeln, Kristalle umstecken',
  lichter: 'LAMP_leuchtfelder (eisblau, dauerhaft aktiv)',
  animation: 'Drei Leuchtfelder pulsieren weich entsprechend Türstatus; verriegelter Zustand blinkt; Hack-Kristalle werden sichtbar umgesteckt',
  quelle: 'selbst gebaut nach Referenzbildern ref1–ref3',
};

function ovalShape(width, height) {
  const r = width / 2;
  const bottom = -height / 2 + r;
  const top = height / 2 - r;

  const shape = new THREE.Shape();
  shape.moveTo(-r, bottom);
  shape.absarc(0, bottom, r, Math.PI, Math.PI * 2, false);
  shape.lineTo(r, top);
  shape.absarc(0, top, r, 0, Math.PI, false);
  shape.closePath();
  return shape;
}

function feldShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.lineTo(-width / 2, height * 0.28);
  shape.lineTo(-width / 2, -height * 0.28);
  shape.lineTo(0, -height / 2);
  shape.lineTo(width / 2, -height * 0.28);
  shape.lineTo(width / 2, height * 0.28);
  shape.closePath();
  return shape;
}

function extrude(shape, depth, bevel = 0.0012) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 14,
  });
  geo.translate(0, 0, bevel);
  return geo;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'door_panel';

  // Zustand: offen, verriegelt und Kristall-Überbrückung.
  let offen = false;
  let verriegelt = false;
  let kristalleUmgesteckt = false;
  let hackAnteil = 0;
  let zeit = 0;
  let letzte = null;

  const bronzeMat = new THREE.MeshStandardMaterial({
    name: 'paneel_dunkelbronze',
    color: 0x4a3520,
    metalness: 0.92,
    roughness: 0.38,
  });

  const bronzeGlanzMat = new THREE.MeshStandardMaterial({
    name: 'paneel_bronze_kante',
    color: 0x7a5527,
    metalness: 0.95,
    roughness: 0.24,
  });

  const frontMat = new THREE.MeshStandardMaterial({
    name: 'paneel_front_dunkel',
    color: 0x101820,
    metalness: 0.65,
    roughness: 0.48,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    name: 'paneel_feldrand',
    color: 0x6b4a22,
    metalness: 0.95,
    roughness: 0.22,
  });

  // --- Hauptkörper: geschlossenes ovales Bronzegehäuse, Rückseite bei z = 0.
  const body = new THREE.Mesh(
    extrude(ovalShape(0.10, 0.30), 0.040, 0.003),
    bronzeMat
  );
  body.name = 'Paneel_Gehaeuse';
  body.position.y = 0.15;
  root.add(body);

  // Schmaler, heller Bronzering als Frontfassung.
  const fassung = new THREE.Mesh(
    extrude(ovalShape(0.098, 0.298), 0.006, 0.0015),
    bronzeGlanzMat
  );
  fassung.name = 'Paneel_Fassung';
  fassung.position.set(0, 0.15, 0.039);
  root.add(fassung);

  // Dunkle, leicht vertiefte Frontschale.
  const front = new THREE.Mesh(
    extrude(ovalShape(0.084, 0.276), 0.007, 0.0012),
    frontMat
  );
  front.name = 'Paneel_Frontschale';
  front.position.set(0, 0.15, 0.040);
  root.add(front);

  // --- Drei längliche Leuchtfelder mit Bronzefassung.
  const feldMatten = [];
  const feldHoehen = [0.243, 0.150, 0.057];

  for (let i = 0; i < 3; i++) {
    const bezel = new THREE.Mesh(
      extrude(feldShape(0.040, 0.064), 0.004, 0.0010),
      bezelMat
    );
    bezel.name = `Leuchtfeld_${i + 1}_Fassung`;
    bezel.position.set(-0.008, feldHoehen[i], 0.046);
    root.add(bezel);

    const glowMat = new THREE.MeshStandardMaterial({
      name: `tuer_leuchtfeld_${i + 1}`,
      color: 0x07131f,
      emissive: 0x2f9dff,
      emissiveIntensity: 0.12,
      metalness: 0.05,
      roughness: 0.22,
    });

    const glow = new THREE.Mesh(
      extrude(feldShape(0.028, 0.050), 0.004, 0.0008),
      glowMat
    );
    glow.name = `Leuchtfeld_${i + 1}`;
    glow.position.set(-0.008, feldHoehen[i], 0.050);
    root.add(glow);
    feldMatten.push(glowMat);
  }

  // --- Seitliche Bronze-Riffelung als InstancedMeshes.
  const ribGeo = new THREE.BoxGeometry(0.0035, 0.0055, 0.030);

  for (const seite of [-1, 1]) {
    const ribs = new THREE.InstancedMesh(ribGeo, bronzeMat, 11);
    ribs.name = seite < 0
      ? 'Paneel_Rippen_links'
      : 'Paneel_Rippen_rechts';

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 11; i++) {
      matrix.makeTranslation(
        seite * 0.0505,
        0.052 + i * 0.0195,
        0.024
      );
      ribs.setMatrixAt(i, matrix);
    }
    ribs.instanceMatrix.needsUpdate = true;
    root.add(ribs);
  }

  // --- Schmaler Kanal rechts für drei kleine, umsteckbare Kontrollkristalle.
  const kristallKanal = new THREE.Mesh(
    new THREE.BoxGeometry(0.013, 0.210, 0.004),
    frontMat
  );
  kristallKanal.name = 'Kristallkanal';
  kristallKanal.position.set(0.030, 0.150, 0.049);
  root.add(kristallKanal);

  const kristallMat = new THREE.MeshStandardMaterial({
    name: 'kontrollkristall',
    color: 0x0d3150,
    emissive: 0x3fb8ff,
    emissiveIntensity: 0.20,
    metalness: 0.20,
    roughness: 0.18,
  });

  const kristallGeo = new THREE.OctahedronGeometry(0.0075, 0);
  const kristalle = [];

  for (let i = 0; i < 3; i++) {
    const kristall = new THREE.Mesh(kristallGeo, kristallMat);
    kristall.name = `Kristall_${i + 1}`;
    kristall.scale.set(0.70, 1.0, 0.36);
    kristall.position.set(0.030, feldHoehen[i], 0.054);
    kristall.userData.baseX = 0.030;
    kristall.userData.baseY = feldHoehen[i];
    kristall.userData.baseZ = 0.054;
    root.add(kristall);
    kristalle.push(kristall);

    const halter = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.0035, 0.006),
      bronzeGlanzMat
    );
    halter.name = `Kristallhalter_${i + 1}`;
    halter.position.set(0.030, feldHoehen[i] - 0.011, 0.051);
    root.add(halter);
  }

  // Kleine geometrische Zierkante an der Oberseite, passend zu den antiken Türrahmen.
  const zierKante = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.004, 0.007),
    bronzeGlanzMat
  );
  zierKante.name = 'Paneel_Zierkante_oben';
  zierKante.position.set(-0.008, 0.287, 0.041);
  root.add(zierKante);

  // --- Kollisionskörper: vom Spiel ausgeblendet, nie über visible schalten.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.30, 0.065),
    new THREE.MeshBasicMaterial()
  );
  col.name = 'COL_paneel';
  col.position.set(0, 0.15, 0.0325);
  root.add(col);

  // --- Benutzen-Punkt vor dem Paneel in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.15, 0.22);
  use.userData = {
    label: 'Türsteuerung bedienen',
    radius: 0.55,
  };
  root.add(use);

  // --- Lichtquelle am Bedienfeld.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_leuchtfelder';
  lamp.position.set(-0.008, 0.15, 0.075);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 1.6,
    distance: 1.1,
  };
  root.add(lamp);

  function zielstaerke(index) {
    if (index === 0) return offen ? 2.10 : 0.10;
    if (index === 1) return !offen && !verriegelt ? 1.45 : 0.10;
    return verriegelt ? 1.90 : 0.10;
  }

  function update(dt) {
    zeit += dt;
    const blend = Math.min(1, dt * 7);

    for (let i = 0; i < feldMatten.length; i++) {
      const ziel = zielstaerke(i);
      let puls = 0;

      if (i === 2 && verriegelt) {
        puls = 0.28 * (0.5 + 0.5 * Math.sin(zeit * 4.2));
      } else if (i === 0 && offen) {
        puls = 0.16 * Math.sin(zeit * 2.4);
      } else if (i === 1 && !offen && !verriegelt) {
        puls = 0.09 * Math.sin(zeit * 2.0 + 0.8);
      }

      feldMatten[i].emissiveIntensity +=
        (ziel + puls - feldMatten[i].emissiveIntensity) * blend;
    }

    const hackZiel = kristalleUmgesteckt ? 1 : 0;
    hackAnteil += (hackZiel - hackAnteil) * blend;

    for (let i = 0; i < kristalle.length; i++) {
      const k = kristalle[i];
      const seitlicherVersatz = (i - 1) * 0.0025 * hackAnteil;

      k.position.x =
        k.userData.baseX + 0.0045 * hackAnteil + seitlicherVersatz;
      k.position.y =
        k.userData.baseY + 0.002 * Math.sin(i * 2.1) * hackAnteil;
      k.position.z =
        k.userData.baseZ + 0.0025 * hackAnteil;
      k.rotation.y = 0.75 * hackAnteil;
      k.rotation.z =
        (i % 2 === 0 ? 1 : -1) * 0.35 * hackAnteil;
    }

    kristallMat.emissiveIntensity =
      0.20 +
      hackAnteil * 1.45 +
      (kristalleUmgesteckt ? 0.16 * Math.sin(zeit * 5) : 0);
  }

  front.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.05));
    }
    letzte = now;
  };

  root.userData.update = update;

  // --- Öffentliche API.
  const api = {
    tueroeffnen() {
      if (verriegelt && !kristalleUmgesteckt) return false;
      offen = true;
      return true;
    },

    tuerschliessen() {
      if (verriegelt) return false;
      offen = false;
      return true;
    },

    verriegeln() {
      if (offen) return false;
      verriegelt = true;
      return true;
    },

    entriegeln() {
      if (!verriegelt) return true;
      if (!kristalleUmgesteckt) return false;
      verriegelt = false;
      return true;
    },

    kristalleUmstecken() {
      kristalleUmgesteckt = !kristalleUmgesteckt;
      return kristalleUmgesteckt;
    },

    setzeTuereZustand(zustand = {}) {
      if (typeof zustand.offen === 'boolean') {
        offen = zustand.offen;
      }
      if (typeof zustand.verriegelt === 'boolean') {
        verriegelt = zustand.verriegelt;
      }
      if (typeof zustand.kristalleUmgesteckt === 'boolean') {
        kristalleUmgesteckt = zustand.kristalleUmgesteckt;
      }
      return api.zustand;
    },

    get zustand() {
      return {
        offen,
        verriegelt,
        kristalleUmgesteckt,
        hackBereit: !verriegelt || kristalleUmgesteckt,
      };
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'tueroeffnen',
      label: 'Tür öffnen',
      run: () => api.tueroeffnen(),
    },
    {
      id: 'tuerschliessen',
      label: 'Tür schließen',
      run: () => api.tuerschliessen(),
    },
    {
      id: 'verriegeln',
      label: 'Tür verriegeln',
      run: () => api.verriegeln(),
    },
    {
      id: 'entriegeln',
      label: 'Tür entriegeln',
      run: () => api.entriegeln(),
    },
    {
      id: 'kristalle',
      label: 'Kristalle umstecken (Hack)',
      run: () => api.kristalleUmstecken(),
    },
  ];

  return root;
}

// balcony_balustrade.js
// Wandobjekt (Kante): polygonal auskragende Aussichtsplattform.
// Ursprung: Mitte der Unterkante der Rückseite; Rückseite bei z = 0,
// Vorderseite/Außenbereich zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'balcony_balustrade',
  art: 'Wandobjekt (Kante / Balkon)',
  masse: '4,00 × 1,10 × 1,80 (B × H × T, m)',
  wohin: 'ATL-048 · Balkon / Außenbalkon am Kontrollraum bzw. an der Torhalle',
  benutzen: 'INT_aussicht → Story-Dialog am Aussichtspunkt',
  lichter: 'LAMP_balkon_vorne (eisblau), LAMP_balkon_bernstein (bernsteinfarben)',
  animation: 'Leuchtlinien pulsieren dezent; Glasreflexe und Bernsteinlicht verändern sich weich',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'balcony_balustrade';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const matDark = kit('wallDark');
  const matWall = kit('wall');
  const matPillar = kit('pillar');
  const matRail = kit('rail');
  const matFloor = kit('floorUpper');

  const matGlass = new THREE.MeshStandardMaterial({
    name: 'KIT_glass',
    color: 0x668fa5,
    metalness: 0.18,
    roughness: 0.1,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const matGlow = new THREE.MeshStandardMaterial({
    name: 'balcony_glow',
    color: 0x9aefff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.7,
    metalness: 0.08,
    roughness: 0.25,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'balcony_amber_glow',
    color: 0xffc584,
    emissive: 0xffa24d,
    emissiveIntensity: 1.45,
    metalness: 0.08,
    roughness: 0.28,
  });

  // --- Reale Maße
  const breite = 4.0;
  const tiefe = 1.8;
  const bodenstaerke = 0.16;
  const bruestungHoehe = 1.1;

  // Grundriss: Rückseite bei z = 0, polygonal auskragende Vorderseite bei +Z.
  const grundriss = [
    new THREE.Vector2(-2.0, 0.0),
    new THREE.Vector2(2.0, 0.0),
    new THREE.Vector2(2.0, 1.2),
    new THREE.Vector2(1.55, tiefe),
    new THREE.Vector2(-1.55, tiefe),
    new THREE.Vector2(-2.0, 1.2),
  ];

  // --- Geschlossener Plattformkörper
  const bodenShape = new THREE.Shape();
  grundriss.forEach((p, i) => {
    if (i === 0) bodenShape.moveTo(p.x, p.y);
    else bodenShape.lineTo(p.x, p.y);
  });
  bodenShape.closePath();

  const bodenGeo = new THREE.ExtrudeGeometry(bodenShape, {
    depth: bodenstaerke,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 1,
  });
  bodenGeo.rotateX(Math.PI / 2);

  const boden = new THREE.Mesh(bodenGeo, matFloor);
  boden.name = 'plattform_boden';
  boden.position.y = bodenstaerke;
  root.add(boden);

  // Eingesetzte Bodenplatten, dünn und vollständig auf dem Boden liegend.
  const bodenInset = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.008, 1.18),
    matDark,
  );
  bodenInset.name = 'boden_plattenfeld';
  bodenInset.position.set(0, bodenstaerke + 0.003, 0.91);
  root.add(bodenInset);

  for (const x of [-1.72, 1.72]) {
    const seitenInset = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.008, 1.08),
      matDark,
    );
    seitenInset.name = `boden_seitenfeld_${x < 0 ? 'links' : 'rechts'}`;
    seitenInset.position.set(x, bodenstaerke + 0.003, 0.59);
    root.add(seitenInset);
  }

  // Dezente bronzene Fugen im Boden.
  for (const x of [-0.82, 0, 0.82]) {
    const fuge = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.006, 1.16),
      matRail,
    );
    fuge.name = `bodenfuge_${x}`;
    fuge.position.set(x, bodenstaerke + 0.007, 0.91);
    root.add(fuge);
  }

  // --- Fassadenanschluss an der Rückseite
  const ruckplatte = new THREE.Mesh(
    new THREE.BoxGeometry(3.96, 0.78, 0.12),
    matWall,
  );
  ruckplatte.name = 'rueckplatte';
  ruckplatte.position.set(0, 0.39, 0.06);
  root.add(ruckplatte);

  const ruckband = new THREE.Mesh(
    new THREE.BoxGeometry(3.82, 0.075, 0.035),
    matDark,
  );
  ruckband.name = 'rueckband';
  ruckband.position.set(0, 0.57, 0.132);
  root.add(ruckband);

  // Zwei antike Befestigungspylone rahmen den offenen Zugang.
  for (const x of [-1.88, 1.88]) {
    const pylon = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.82, 0.20),
      matPillar,
    );
    pylon.name = `rueckpylon_${x < 0 ? 'links' : 'rechts'}`;
    pylon.position.set(x, 0.41, 0.11);
    root.add(pylon);

    const pylonKern = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.62, 0.025),
      matGlow,
    );
    pylonKern.name = `rueckpylon_leucht_${x < 0 ? 'links' : 'rechts'}`;
    pylonKern.position.set(x, 0.41, 0.223);
    root.add(pylonKern);
  }

  // Geschlossene Konsolen unterhalb der Platte und an der Wand.
  for (const x of [-1.62, 0, 1.62]) {
    const konsole = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.11, 0.86),
      matPillar,
    );
    konsole.name = `bodenstrebe_${x}`;
    konsole.position.set(x, 0.075, 0.48);
    konsole.rotation.x = -0.055;
    root.add(konsole);

    const wandanker = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.63, 0.13),
      matDark,
    );
    wandanker.name = `wandanker_${x}`;
    wandanker.position.set(x, 0.315, 0.085);
    root.add(wandanker);
  }

  // Vordere Blende schließt die Plattformkante sauber ab.
  const frontblende = new THREE.Mesh(
    new THREE.BoxGeometry(3.10, 0.145, 0.09),
    matDark,
  );
  frontblende.name = 'frontblende';
  frontblende.position.set(0, 0.075, 1.755);
  root.add(frontblende);

  const frontLeucht = new THREE.Mesh(
    new THREE.BoxGeometry(2.92, 0.022, 0.028),
    matGlow,
  );
  frontLeucht.name = 'leuchtlinie_vorne';
  frontLeucht.position.set(0, 0.105, 1.808);
  root.add(frontLeucht);

  // --- Brüstung: fünf äußere Segmente, Rückseite bleibt offen.
  const glassMeshes = [];

  function segmentGruppe(a, b, index) {
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const laenge = Math.sqrt(dx * dx + dz * dz);
    const winkel = -Math.atan2(dz, dx);

    const gruppe = new THREE.Group();
    gruppe.name = `bruestungssegment_${index}`;
    gruppe.position.set((a.x + b.x) / 2, 0, (a.y + b.y) / 2);
    gruppe.rotation.y = winkel;
    root.add(gruppe);

    // Durchgehende geschlossene Metallprofile.
    const handlauf = new THREE.Mesh(
      new THREE.BoxGeometry(laenge + 0.04, 0.09, 0.10),
      matRail,
    );
    handlauf.name = `handlauf_oben_${index}`;
    handlauf.position.set(0, 1.055, 0);
    gruppe.add(handlauf);

    const unterlauf = new THREE.Mesh(
      new THREE.BoxGeometry(laenge + 0.015, 0.075, 0.085),
      matDark,
    );
    unterlauf.name = `handlauf_unten_${index}`;
    unterlauf.position.set(0, 0.205, 0);
    gruppe.add(unterlauf);

    const mittellauf = new THREE.Mesh(
      new THREE.BoxGeometry(laenge - 0.04, 0.045, 0.07),
      matRail,
    );
    mittellauf.name = `handlauf_mitte_${index}`;
    mittellauf.position.set(0, 0.585, 0);
    gruppe.add(mittellauf);

    // Untere Metallfelder als InstancedMesh.
    const anzahlFelder = Math.max(1, Math.round((laenge - 0.14) / 1.02));
    const nutzbreite = laenge - 0.18;
    const feldbreite = nutzbreite / anzahlFelder;
    const feldGeo = new THREE.BoxGeometry(1, 1, 1);

    const felder = new THREE.InstancedMesh(feldGeo, matDark, anzahlFelder);
    felder.name = `metallfelder_${index}`;
    const einlagen = new THREE.InstancedMesh(feldGeo, matWall, anzahlFelder);
    einlagen.name = `metalleinlagen_${index}`;

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();

    for (let i = 0; i < anzahlFelder; i++) {
      const x = -nutzbreite / 2 + feldbreite * (i + 0.5);

      matrix.compose(
        new THREE.Vector3(x, 0.405, 0),
        quat,
        new THREE.Vector3(Math.max(0.08, feldbreite - 0.035), 0.30, 0.055),
      );
      felder.setMatrixAt(i, matrix);

      matrix.compose(
        new THREE.Vector3(x, 0.405, -0.032),
        quat,
        new THREE.Vector3(Math.max(0.04, feldbreite - 0.10), 0.205, 0.012),
      );
      einlagen.setMatrixAt(i, matrix);
    }

    felder.instanceMatrix.needsUpdate = true;
    einlagen.instanceMatrix.needsUpdate = true;
    gruppe.add(felder, einlagen);

    // Geschlossenes Glaspaneel zwischen den Metallfeldern und dem Handlauf.
    const glas = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.10, laenge - 0.15), 0.385, 0.035),
      matGlass,
    );
    glas.name = `brustglas_${index}`;
    glas.position.set(0, 0.795, 0);
    gruppe.add(glas);
    glassMeshes.push(glas);

    // Leuchtlinie an der inneren Handlaufkante.
    const leuchtMaterial = index === 3 ? matGlow : matAmber;
    const leuchtlinie = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.08, laenge - 0.13), 0.018, 0.018),
      leuchtMaterial,
    );
    leuchtlinie.name = `brust_leucht_${index}`;
    leuchtlinie.position.set(0, 0.985, 0.054);
    gruppe.add(leuchtlinie);

    const bernsteinKante = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.08, laenge - 0.20), 0.012, 0.014),
      matAmber,
    );
    bernsteinKante.name = `bernstein_kante_${index}`;
    bernsteinKante.position.set(0, 0.285, -0.036);
    gruppe.add(bernsteinKante);

    return { gruppe, laenge, winkel };
  }

  const segmente = [];
  for (let i = 1; i < grundriss.length; i++) {
    const j = (i + 1) % grundriss.length;
    segmente.push(segmentGruppe(grundriss[i], grundriss[j], i));
  }

  // Pfosten als gemeinsames InstancedMesh.
  const pfostenPositionen = [
    grundriss[1],
    grundriss[2],
    grundriss[3],
    grundriss[4],
    grundriss[5],
  ];

  const pfostenGeo = new THREE.BoxGeometry(0.082, 0.86, 0.082);
  const pfosten = new THREE.InstancedMesh(pfostenGeo, matRail, pfostenPositionen.length);
  pfosten.name = 'brustung_pfosten';

  const pfostenMatrix = new THREE.Matrix4();
  pfostenPositionen.forEach((p, i) => {
    pfostenMatrix.makeTranslation(p.x, 0.585, p.y);
    pfosten.setMatrixAt(i, pfostenMatrix);
  });
  pfosten.instanceMatrix.needsUpdate = true;
  root.add(pfosten);

  // Kleine bronzene Zierringe an den vorderen Hauptpfosten.
  for (const x of [-1.55, 1.55]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.011, 6, 12),
      matRail,
    );
    ring.name = `pfostenring_${x < 0 ? 'links' : 'rechts'}`;
    ring.position.set(x, 0.965, tiefe);
    ring.rotation.x = Math.PI / 2;
    root.add(ring);
  }

  // --- Kollisionskörper: ausschließlich unsichtbare COL_-Meshes.
  const collisionMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });

  const colBodenMitte = new THREE.Mesh(
    new THREE.BoxGeometry(3.10, bodenstaerke, 1.80),
    collisionMat,
  );
  colBodenMitte.name = 'COL_boden_mitte';
  colBodenMitte.position.set(0, bodenstaerke / 2, 0.90);
  root.add(colBodenMitte);

  for (const x of [-1.775, 1.775]) {
    const colBodenSeite = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, bodenstaerke, 1.20),
      collisionMat,
    );
    colBodenSeite.name = `COL_boden_seite_${x < 0 ? 'links' : 'rechts'}`;
    colBodenSeite.position.set(x, bodenstaerke / 2, 0.60);
    root.add(colBodenSeite);
  }

  // Brüstungskollision entlang der fünf Außenseiten.
  for (let i = 1; i < grundriss.length; i++) {
    const j = (i + 1) % grundriss.length;
    const a = grundriss[i];
    const b = grundriss[j];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const laenge = Math.sqrt(dx * dx + dz * dz);

    const col = new THREE.Mesh(
      new THREE.BoxGeometry(laenge, bruestungHoehe, 0.12),
      collisionMat,
    );
    col.name = `COL_brustung_${i}`;
    col.position.set((a.x + b.x) / 2, bruestungHoehe / 2, (a.y + b.y) / 2);
    col.rotation.y = -Math.atan2(dz, dx);
    root.add(col);
  }

  const colWand = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.78, 0.12),
    collisionMat,
  );
  colWand.name = 'COL_rueckseite';
  colWand.position.set(0, 0.39, 0.06);
  root.add(colWand);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_aussicht';
  use.position.set(0, 0.95, 1.14);
  use.userData = {
    label: 'Aussichtspunkt nutzen',
    radius: 0.9,
  };
  root.add(use);

  // --- Dauerhaft aktive Lichtquellen
  const lampFront = new THREE.Object3D();
  lampFront.name = 'LAMP_balkon_vorne';
  lampFront.position.set(0, 0.98, 1.70);
  lampFront.userData = {
    color: '#6fe3ff',
    intensity: 5,
    distance: 4.5,
  };
  root.add(lampFront);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_balkon_bernstein';
  lampAmber.position.set(0, 0.30, 1.70);
  lampAmber.userData = {
    color: '#ffb060',
    intensity: 2.5,
    distance: 2.8,
  };
  root.add(lampAmber);

  // --- Zustand und Animation
  let zeit = 0;
  let letzte = null;
  let storyRequested = false;

  function update(dt) {
    zeit += dt;
    const puls = 0.5 + 0.5 * Math.sin(zeit * 1.25);
    const langsam = 0.5 + 0.5 * Math.sin(zeit * 0.55 + 0.8);

    matGlow.emissiveIntensity = 1.35 + puls * 0.55 + langsam * 0.12;
    matAmber.emissiveIntensity = 1.05 + (1 - puls) * 0.55;
    matGlass.opacity = 0.44 + puls * 0.045;
  }

  const animAnchor = frontLeucht;
  animAnchor.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    requestStory() {
      storyRequested = true;
      return {
        event: 'story',
        id: 'balcony_viewpoint',
        location: 'ATL-048',
      };
    },
    clearStoryRequest() {
      storyRequested = false;
    },
    get storyRequested() {
      return storyRequested;
    },
    get platformWidth() {
      return breite;
    },
    get platformDepth() {
      return tiefe;
    },
    get railingHeight() {
      return bruestungHoehe;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'story_aussicht',
      label: 'Story-Dialog am Aussichtspunkt starten',
      run: () => api.requestStory(),
    },
  ];

  return root;
}

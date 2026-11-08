import * as THREE from 'three';

export const steckbrief = {
  name: 'hangar_door',
  art: 'Wandobjekt',
  masse: '15,88 × 8,46 × 0,50 m Außenmaß; Durchfahrt 15,00 × 8,00 m',
  benutzen: 'INT_tor_bedienen → Menü zum Öffnen, Schließen und Umschalten',
  lichter: 'LAMP_torfuge und LAMP_toroberkante (eisblau, dauerhaft an)',
  animation: 'Zweiflügeliges Schiebetor fährt weich auseinander; Leuchtfugen pulsieren, Statusanzeige wechselt bei Bewegung',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'hangar_door';

  const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

  const matPerl = kit('pillar');
  const matBronze = kit('copper');
  const matDunkel = kit('wallDark');
  const matFeld = kit('wall');
  const matGlow = new THREE.MeshStandardMaterial({
    name: 'KIT_glow',
    color: 0x4b9fb5,
    emissive: 0x6fe3ff,
    emissiveIntensity: 2.1,
    metalness: 0.1,
    roughness: 0.3,
  });

  const matStatus = new THREE.MeshStandardMaterial({
    name: 'hangar_status',
    color: 0x13262d,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.8,
    metalness: 0.2,
    roughness: 0.35,
  });

  const collMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  function box(geometrie, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(geometrie, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Wandobjekt: Rückseite bei z = 0, alle sichtbaren Teile ragen nach +Z.
  const rahmen = new THREE.Group();
  rahmen.name = 'tor_rahmen';
  root.add(rahmen);

  const pfostenBreite = 0.44;
  const rahmenTiefe = 0.46;
  const pfostenX = 7.72;
  const rahmenHoehe = 8.46;

  for (const sign of [-1, 1]) {
    // Massiver, durchgehender Seitenrahmen.
    box(
      new THREE.BoxGeometry(pfostenBreite, rahmenHoehe, rahmenTiefe),
      matPerl,
      sign * pfostenX,
      rahmenHoehe / 2,
      rahmenTiefe / 2,
      rahmen,
    );

    // Dunkle, vertikal eingelassene Spur im Perlrahmen.
    box(
      new THREE.BoxGeometry(0.13, 7.76, 0.045),
      matDunkel,
      sign * pfostenX,
      4.02,
      0.475,
      rahmen,
    );

    // Schmale Bronzefassung an der Torinnenkante.
    box(
      new THREE.BoxGeometry(0.075, 7.96, 0.055),
      matBronze,
      sign * 7.53,
      4.02,
      0.49,
      rahmen,
    );

    // Eisblaue Leuchtfuge am inneren Rahmenrand.
    box(
      new THREE.BoxGeometry(0.035, 7.58, 0.035),
      matGlow,
      sign * 7.47,
      3.96,
      0.505,
      rahmen,
    );

    // Verstärkte Bronzeplatten oben und unten.
    for (const y of [0.22, 8.19]) {
      box(
        new THREE.BoxGeometry(0.39, 0.24, 0.065),
        matBronze,
        sign * pfostenX,
        y,
        0.5,
        rahmen,
      );
    }
  }

  // Durchgehender Kopfbereich über der 8-Meter-Öffnung.
  box(
    new THREE.BoxGeometry(15.88, 0.48, rahmenTiefe),
    matPerl,
    0,
    8.22,
    rahmenTiefe / 2,
    rahmen,
  );

  box(
    new THREE.BoxGeometry(15.0, 0.075, 0.055),
    matBronze,
    0,
    8.05,
    0.495,
    rahmen,
  );

  box(
    new THREE.BoxGeometry(14.62, 0.045, 0.035),
    matGlow,
    0,
    8.27,
    0.505,
    rahmen,
  );

  // Segmentierte Bronzeplatten auf der Kopfleiste.
  for (let i = 0; i < 10; i++) {
    box(
      new THREE.BoxGeometry(0.82, 0.17, 0.055),
      matBronze,
      -6.66 + i * 1.48,
      8.22,
      0.495,
      rahmen,
    );
  }

  // Flache Bodenführung vor der Torunterkante.
  box(
    new THREE.BoxGeometry(15.0, 0.05, 0.13),
    matDunkel,
    0,
    0.025,
    0.31,
    rahmen,
  );

  // Kleine Statusanzeige am linken Rahmenpfosten.
  box(
    new THREE.BoxGeometry(0.25, 0.48, 0.07),
    matDunkel,
    -7.72,
    1.48,
    0.515,
    rahmen,
  );

  box(
    new THREE.BoxGeometry(0.12, 0.3, 0.035),
    matStatus,
    -7.72,
    1.48,
    0.565,
    rahmen,
  );

  function createLeaf(inwardSign) {
    const leaf = new THREE.Group();
    leaf.name = inwardSign > 0 ? 'torfluegel_links' : 'torfluegel_rechts';

    const breite = 7.55;
    const hoehe = 7.92;

    // Geschlossener Grundkörper des Flügels.
    box(
      new THREE.BoxGeometry(breite, hoehe, 0.18),
      matDunkel,
      0,
      hoehe / 2,
      0.22,
      leaf,
    );

    // 4 × 5 leicht erhöhte Stahlfelder als InstancedMesh.
    const spalten = 4;
    const reihen = 5;
    const felder = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.56, 1.12, 0.035),
      matFeld,
      spalten * reihen,
    );
    const dummy = new THREE.Object3D();

    for (let reihe = 0; reihe < reihen; reihe++) {
      for (let spalte = 0; spalte < spalten; spalte++) {
        dummy.position.set(
          -2.65 + spalte * 1.7667,
          0.95 + reihe * 1.34,
          0.33,
        );
        dummy.updateMatrix();
        felder.setMatrixAt(reihe * spalten + spalte, dummy.matrix);
      }
    }

    felder.instanceMatrix.needsUpdate = true;
    felder.castShadow = true;
    felder.receiveShadow = true;
    leaf.add(felder);

    // Acht bronzefarbene Längsrippen.
    const rippenAnzahl = 8;
    const rippen = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.085, 7.48, 0.07),
      matBronze,
      rippenAnzahl,
    );

    for (let i = 0; i < rippenAnzahl; i++) {
      dummy.position.set(-3.15 + i * 0.9, 3.96, 0.37);
      dummy.updateMatrix();
      rippen.setMatrixAt(i, dummy.matrix);
    }

    rippen.instanceMatrix.needsUpdate = true;
    rippen.castShadow = true;
    leaf.add(rippen);

    // Fünf horizontale Querverstrebungen.
    for (let i = 0; i < 5; i++) {
      box(
        new THREE.BoxGeometry(7.08, 0.085, 0.07),
        matPerl,
        0,
        0.65 + i * 1.49,
        0.375,
        leaf,
      );
    }

    // Verstärkte Randprofile.
    for (const sign of [-1, 1]) {
      box(
        new THREE.BoxGeometry(0.13, 7.78, 0.09),
        matBronze,
        sign * 3.71,
        3.96,
        0.365,
        leaf,
      );
    }

    for (const y of [0.08, 7.84]) {
      box(
        new THREE.BoxGeometry(7.4, 0.13, 0.09),
        matBronze,
        0,
        y,
        0.365,
        leaf,
      );
    }

    // Leuchtende Schließkante, obere und untere Torfuge.
    box(
      new THREE.BoxGeometry(0.04, 7.32, 0.035),
      matGlow,
      inwardSign * 3.64,
      3.96,
      0.425,
      leaf,
    );

    box(
      new THREE.BoxGeometry(6.9, 0.04, 0.035),
      matGlow,
      0,
      7.62,
      0.425,
      leaf,
    );

    box(
      new THREE.BoxGeometry(6.9, 0.04, 0.035),
      matGlow,
      0,
      0.3,
      0.425,
      leaf,
    );

    // Kompakte Statusmarkierung nahe der mittigen Kante.
    box(
      new THREE.BoxGeometry(0.14, 0.58, 0.04),
      matGlow,
      inwardSign * 3.47,
      3.62,
      0.43,
      leaf,
    );

    // Kleine bronze Beschlagplatten an den vier Eckfeldern.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        box(
          new THREE.BoxGeometry(0.32, 0.25, 0.055),
          matBronze,
          sx * 3.28,
          3.96 + sy * 3.28,
          0.415,
          leaf,
        );
      }
    }

    return leaf;
  }

  const links = createLeaf(1);
  const rechts = createLeaf(-1);

  const geschlossenLinks = -3.775;
  const geschlossenRechts = 3.775;
  const versatzWeg = 7.55;

  links.position.set(geschlossenLinks, 0, 0);
  rechts.position.set(geschlossenRechts, 0, 0);
  root.add(links, rechts);

  // Kollisionskörper für die unbeweglichen Rahmenprofile.
  const colLinks = new THREE.Mesh(
    new THREE.BoxGeometry(pfostenBreite, rahmenHoehe, rahmenTiefe),
    collMaterial,
  );
  colLinks.name = 'COL_rahmen_links';
  colLinks.position.set(-pfostenX, rahmenHoehe / 2, rahmenTiefe / 2);
  colLinks.userData.aktiv = true;
  root.add(colLinks);

  const colRechts = new THREE.Mesh(
    new THREE.BoxGeometry(pfostenBreite, rahmenHoehe, rahmenTiefe),
    collMaterial,
  );
  colRechts.name = 'COL_rahmen_rechts';
  colRechts.position.set(pfostenX, rahmenHoehe / 2, rahmenTiefe / 2);
  colRechts.userData.aktiv = true;
  root.add(colRechts);

  const colOben = new THREE.Mesh(
    new THREE.BoxGeometry(15.88, 0.48, rahmenTiefe),
    collMaterial,
  );
  colOben.name = 'COL_rahmen_oben';
  colOben.position.set(0, 8.22, rahmenTiefe / 2);
  colOben.userData.aktiv = true;
  root.add(colOben);

  // Bewegliche Kollisionskörper der beiden Torflügel.
  const colFluegelLinks = new THREE.Mesh(
    new THREE.BoxGeometry(7.55, 7.92, 0.18),
    collMaterial,
  );
  colFluegelLinks.name = 'COL_torfluegel_links';
  colFluegelLinks.position.set(geschlossenLinks, 3.96, 0.22);
  colFluegelLinks.userData.aktiv = true;
  root.add(colFluegelLinks);

  const colFluegelRechts = new THREE.Mesh(
    new THREE.BoxGeometry(7.55, 7.92, 0.18),
    collMaterial,
  );
  colFluegelRechts.name = 'COL_torfluegel_rechts';
  colFluegelRechts.position.set(geschlossenRechts, 3.96, 0.22);
  colFluegelRechts.userData.aktiv = true;
  root.add(colFluegelRechts);

  // Benutzen-Punkt vor dem Tor, in gut erreichbarer Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_tor_bedienen';
  use.position.set(0, 1.25, 1.0);
  use.userData = { label: 'Hangartor bedienen', radius: 1.0 };
  root.add(use);

  // Dauerhaft eingeschaltete Leuchten.
  const lampFuge = new THREE.Object3D();
  lampFuge.name = 'LAMP_torfuge';
  lampFuge.position.set(0, 4.0, 0.8);
  lampFuge.userData = { color: '#6fe3ff', intensity: 8, distance: 8 };
  root.add(lampFuge);

  const lampOberkante = new THREE.Object3D();
  lampOberkante.name = 'LAMP_toroberkante';
  lampOberkante.position.set(0, 8.15, 0.85);
  lampOberkante.userData = { color: '#6fe3ff', intensity: 6, distance: 7 };
  root.add(lampOberkante);

  let zielOffen = false;
  let fortschritt = 0;
  let zeit = 0;
  let letzte = null;

  const statusEisblau = new THREE.Color(0x6fe3ff);
  const statusBernstein = new THREE.Color(0xffb04a);
  const statusZiel = new THREE.Color();

  function update(dt) {
    zeit += dt;

    const ziel = zielOffen ? 1 : 0;
    fortschritt += (ziel - fortschritt) * Math.min(1, dt * 1.15);

    // Smoothstep macht Start und Ende der Torfahrt besonders weich.
    const ease = fortschritt * fortschritt * (3 - 2 * fortschritt);
    const versatz = versatzWeg * ease;

    links.position.x = geschlossenLinks - versatz;
    rechts.position.x = geschlossenRechts + versatz;

    colFluegelLinks.position.x = links.position.x;
    colFluegelRechts.position.x = rechts.position.x;

    const bewegung = Math.abs(fortschritt - ziel) > 0.001;
    statusZiel.copy(bewegung ? statusBernstein : statusEisblau);
    matStatus.emissive.lerp(statusZiel, Math.min(1, dt * 6));
    matStatus.emissiveIntensity = bewegung ? 2.3 : 1.7;

    const puls = 1.9 + Math.sin(zeit * 2.0) * 0.25;
    matGlow.emissiveIntensity = puls;
  }

  const antriebsMesh = links.children[0];
  antriebsMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    oeffnen() {
      zielOffen = true;
    },
    schliessen() {
      zielOffen = false;
    },
    umschalten() {
      zielOffen = !zielOffen;
    },
    get offen() {
      return zielOffen && fortschritt > 0.995;
    },
    get geschlossen() {
      return !zielOffen && fortschritt < 0.005;
    },
    get inBewegung() {
      return Math.abs(fortschritt - (zielOffen ? 1 : 0)) > 0.001;
    },
    get fortschritt() {
      return fortschritt;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'tor_oeffnen',
      label: 'Hangartor öffnen',
      run: () => api.oeffnen(),
    },
    {
      id: 'tor_schliessen',
      label: 'Hangartor schließen',
      run: () => api.schliessen(),
    },
    {
      id: 'tor_umschalten',
      label: 'Hangartor umschalten',
      run: () => api.umschalten(),
    },
  ];

  return root;
}

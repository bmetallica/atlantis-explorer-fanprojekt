// OBJ-024: Attero-Gerät – Steuerschlüssel
// Kleinobjekt, liegt flach. Ursprung: Mitte der Unterseite, Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'attero_control_key',
  art: 'Tischobjekt',
  masse: '0,31 × 0,08 × 0,20 m',
  wohin: 'ATL-019 – Janus’ geheimes Labor, auf dem Labortisch',
  benutzen: 'INT_aktivieren → Menü mit Aktivieren und Deaktivieren',
  lichter: 'LAMP_status (rot, dauerhaft an); eisblaue Bedienfelder bei Aktivierung',
  animation: 'Bedienfelder leuchten bei Aktivierung in einer weichen Welle; der rote Steuerkristall pulsiert',
  quelle: 'selbst gebaut nach OBJ-024 und den Referenzbildern',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'attero_control_key';
  root.userData.opts = opts;

  const darkMetal = new THREE.MeshStandardMaterial({
    name: 'attero_dark_metal',
    color: 0x292d32,
    metalness: 0.86,
    roughness: 0.42,
  });

  const edgeMetal = new THREE.MeshStandardMaterial({
    name: 'attero_edge_metal',
    color: 0x555b60,
    metalness: 0.9,
    roughness: 0.3,
  });

  const steelBlue = new THREE.MeshStandardMaterial({
    name: 'attero_steel_blue',
    color: 0x263d4d,
    metalness: 0.74,
    roughness: 0.4,
  });

  const bronze = new THREE.MeshStandardMaterial({
    name: 'attero_bronze',
    color: 0x87663a,
    metalness: 0.88,
    roughness: 0.33,
  });

  const panelColor = new THREE.MeshStandardMaterial({
    name: 'attero_control_panel',
    color: 0xc7c8c1,
    metalness: 0.22,
    roughness: 0.52,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.015,
  });

  const engravingMat = new THREE.MeshStandardMaterial({
    name: 'attero_engraving',
    color: 0x555b5d,
    metalness: 0.38,
    roughness: 0.76,
  });

  const lensMat = new THREE.MeshStandardMaterial({
    name: 'attero_red_lens',
    color: 0x8d0806,
    metalness: 0.16,
    roughness: 0.18,
    emissive: 0xff1710,
    emissiveIntensity: 1.6,
  });

  const panelMaterials = [];

  // Baut einen geschlossenen konvexen Prismen aus X/Z-Punkten.
  function prismGeometry(points, yBottom, yTop) {
    const positions = [];
    const centerY = (yBottom + yTop) * 0.5;

    function triangle(a, b, c) {
      const ab = new THREE.Vector3().subVectors(b, a);
      const ac = new THREE.Vector3().subVectors(c, a);
      const normal = new THREE.Vector3().crossVectors(ab, ac);
      const centroid = new THREE.Vector3()
        .add(a)
        .add(b)
        .add(c)
        .multiplyScalar(1 / 3);
      const outward = centroid.clone().sub(new THREE.Vector3(0, centerY, 0));

      if (normal.dot(outward) < 0) {
        const temp = b;
        b = c;
        c = temp;
      }

      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }

    const lower = points.map(([x, z]) => new THREE.Vector3(x, yBottom, z));
    const upper = points.map(([x, z]) => new THREE.Vector3(x, yTop, z));
    const bottomCenter = new THREE.Vector3(0, yBottom, 0);
    const topCenter = new THREE.Vector3(0, yTop, 0);

    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      triangle(bottomCenter, lower[i], lower[next]);
      triangle(topCenter, upper[i], upper[next]);
      triangle(lower[i], upper[i], upper[next]);
      triangle(lower[i], upper[next], lower[next]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  // Geschlossenes, facettiertes Gehäuse mit leicht ansteigender Oberseite.
  const footprint = [
    [-0.150, -0.030],
    [-0.125, -0.078],
    [-0.070, -0.100],
    [0.080, -0.098],
    [0.140, -0.060],
    [0.152, 0.010],
    [0.125, 0.075],
    [0.050, 0.100],
    [-0.075, 0.092],
    [-0.135, 0.050],
  ];

  function buildHull() {
    const positions = [];
    const center = new THREE.Vector3(0, 0.034, 0);

    const bottom = footprint.map(([x, z]) => [
      x * 0.90,
      0,
      z * 0.90,
    ]);
    const middle = footprint.map(([x, z]) => [x, 0.032, z]);
    const top = footprint.map(([x, z]) => [
      x * 0.87,
      0.058 + z * 0.18,
      z * 0.87,
    ]);

    const bottomCenter = new THREE.Vector3(0, 0, 0);
    const topCenter = new THREE.Vector3(0, 0.058, 0);

    function vec(p) {
      return new THREE.Vector3(p[0], p[1], p[2]);
    }

    function triangle(a, b, c) {
      const normal = new THREE.Vector3()
        .crossVectors(b.clone().sub(a), c.clone().sub(a));
      const centroid = new THREE.Vector3()
        .add(a)
        .add(b)
        .add(c)
        .multiplyScalar(1 / 3);
      const outward = centroid.clone().sub(center);

      if (normal.dot(outward) < 0) {
        const temp = b;
        b = c;
        c = temp;
      }

      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }

    function ringFaces(ringA, ringB) {
      for (let i = 0; i < ringA.length; i++) {
        const next = (i + 1) % ringA.length;
        const a = vec(ringA[i]);
        const b = vec(ringA[next]);
        const c = vec(ringB[next]);
        const d = vec(ringB[i]);
        triangle(a, b, c);
        triangle(a, c, d);
      }
    }

    for (let i = 0; i < footprint.length; i++) {
      const next = (i + 1) % footprint.length;
      triangle(bottomCenter, vec(bottom[i]), vec(bottom[next]));
      triangle(topCenter, vec(top[i]), vec(top[next]));
    }

    ringFaces(bottom, middle);
    ringFaces(middle, top);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.computeVertexNormals();
    return geometry;
  }

  const hull = new THREE.Mesh(buildHull(), darkMetal);
  hull.name = 'Gehaeuse_facettiert';
  root.add(hull);

  // Oberseite liegt in einer eigenen Gruppe und ist zur Vorderseite leicht
  // angestellt: lokale X/Z-Fläche, geneigt um die X-Achse.
  const deck = new THREE.Group();
  deck.position.set(0, 0.058, 0);
  deck.rotation.x = -Math.atan(0.18);
  root.add(deck);

  const deckPoints = footprint.map(([x, z]) => [x * 0.855, z * 0.855]);
  const deckMesh = new THREE.Mesh(
    prismGeometry(deckPoints, 0, 0.0035),
    steelBlue
  );
  deckMesh.name = 'Steuerdeck';
  deck.add(deckMesh);

  // Erhabene, helle Bedienfelder mit unterschiedlichen Ancient-Gravuren.
  const panelDefinitions = [
    {
      pos: [-0.079, 0.039],
      points: [
        [-0.027, -0.014],
        [0.009, -0.018],
        [0.026, -0.004],
        [0.017, 0.017],
        [-0.019, 0.015],
      ],
      strokes: [
        [[-0.015, -0.005], [-0.003, -0.010], [0.012, -0.004]],
        [[-0.010, 0.004], [-0.006, 0.011], [0.004, 0.009]],
        [[0.003, -0.004], [0.005, 0.006]],
      ],
    },
    {
      pos: [-0.029, 0.054],
      points: [
        [-0.022, -0.014],
        [0.016, -0.013],
        [0.025, 0.001],
        [0.014, 0.020],
        [-0.020, 0.017],
      ],
      strokes: [
        [[-0.013, -0.006], [-0.006, -0.011], [0.006, -0.008]],
        [[0.008, -0.007], [0.011, 0.003], [0.004, 0.011]],
        [[-0.013, 0.006], [-0.006, 0.010], [0.003, 0.008]],
      ],
    },
    {
      pos: [0.018, 0.046],
      points: [
        [-0.020, -0.018],
        [0.016, -0.014],
        [0.024, 0.002],
        [0.011, 0.021],
        [-0.017, 0.015],
      ],
      strokes: [
        [[-0.012, -0.009], [-0.003, -0.012], [0.011, -0.006]],
        [[-0.010, 0.002], [-0.004, 0.011], [0.010, 0.009]],
        [[0.001, -0.006], [0.003, 0.005], [0.013, 0.002]],
      ],
    },
    {
      pos: [-0.084, -0.009],
      points: [
        [-0.020, -0.014],
        [0.014, -0.017],
        [0.024, 0.000],
        [0.013, 0.017],
        [-0.017, 0.014],
      ],
      strokes: [
        [[-0.012, -0.005], [-0.002, -0.009], [0.011, -0.004]],
        [[-0.010, 0.005], [0.000, 0.010], [0.011, 0.005]],
      ],
    },
    {
      pos: [-0.031, 0.002],
      points: [
        [-0.024, -0.012],
        [0.017, -0.014],
        [0.025, 0.002],
        [0.012, 0.018],
        [-0.020, 0.015],
      ],
      strokes: [
        [[-0.015, -0.005], [-0.004, -0.008], [0.008, -0.003]],
        [[-0.010, 0.006], [-0.002, 0.010], [0.012, 0.005]],
        [[-0.006, -0.010], [-0.005, 0.010]],
      ],
    },
    {
      pos: [0.019, -0.012],
      points: [
        [-0.019, -0.018],
        [0.015, -0.015],
        [0.025, 0.002],
        [0.010, 0.020],
        [-0.019, 0.012],
      ],
      strokes: [
        [[-0.012, -0.008], [-0.002, -0.011], [0.010, -0.004]],
        [[-0.011, 0.002], [-0.005, 0.011], [0.007, 0.007]],
        [[0.000, -0.010], [0.002, 0.009]],
      ],
    },
    {
      pos: [-0.055, -0.055],
      points: [
        [-0.025, -0.010],
        [0.013, -0.014],
        [0.026, 0.002],
        [0.009, 0.018],
        [-0.020, 0.013],
      ],
      strokes: [
        [[-0.017, -0.003], [-0.006, -0.008], [0.010, -0.003]],
        [[-0.014, 0.007], [-0.005, 0.011], [0.014, 0.006]],
        [[0.000, -0.009], [0.002, 0.010]],
      ],
    },
  ];

  function addRune(parent, strokes, y) {
    for (const stroke of strokes) {
      for (let i = 0; i < stroke.length - 1; i++) {
        const [ax, az] = stroke[i];
        const [bx, bz] = stroke[i + 1];
        const dx = bx - ax;
        const dz = bz - az;
        const length = Math.hypot(dx, dz);
        if (length < 0.0005) continue;

        const line = new THREE.Mesh(
          new THREE.BoxGeometry(length, 0.001, 0.0024),
          engravingMat
        );
        line.position.set(
          (ax + bx) * 0.5,
          y,
          (az + bz) * 0.5
        );
        line.rotation.y = -Math.atan2(dz, dx);
        parent.add(line);
      }
    }
  }

  for (const definition of panelDefinitions) {
    const material = panelColor.clone();
    material.name = 'attero_control_panel';

    const panel = new THREE.Group();
    panel.position.set(definition.pos[0], 0, definition.pos[1]);
    deck.add(panel);

    const face = new THREE.Mesh(
      prismGeometry(definition.points, 0.0035, 0.010),
      material
    );
    panel.add(face);

    addRune(panel, definition.strokes, 0.01045);
    panelMaterials.push(material);
  }

  // Bronzene, diagonale Schulterverstärkung auf der rechten Seite.
  const bronzeRail = new THREE.Mesh(
    prismGeometry(
      [
        [0.065, -0.060],
        [0.087, -0.065],
        [0.128, 0.045],
        [0.110, 0.055],
      ],
      0.0035,
      0.0075
    ),
    bronze
  );
  deck.add(bronzeRail);

  // Bronze-Inlay an der vorderen linken Gehäuseschulter.
  const bronzeInlay = new THREE.Mesh(
    prismGeometry(
      [
        [-0.132, -0.030],
        [-0.119, -0.064],
        [-0.096, -0.074],
        [-0.088, -0.048],
        [-0.101, -0.022],
      ],
      0.0035,
      0.007
    ),
    bronze
  );
  deck.add(bronzeInlay);

  const bronzeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.012, 0.0022, 5, 10),
    engravingMat
  );
  bronzeRing.rotation.x = Math.PI / 2;
  bronzeRing.position.set(-0.111, 0.0078, -0.047);
  deck.add(bronzeRing);

  addRune(
    deck,
    [
      [[-0.111, -0.055], [-0.111, -0.039]],
      [[-0.120, -0.047], [-0.102, -0.047]],
    ],
    0.0076
  );

  // Kleine dunkle Taste neben dem Steuerkristall.
  const darkButton = new THREE.Mesh(
    prismGeometry(
      [
        [0.042, -0.047],
        [0.060, -0.049],
        [0.068, -0.038],
        [0.061, -0.027],
        [0.043, -0.028],
        [0.037, -0.037],
      ],
      0.0035,
      0.0085
    ),
    darkMetal
  );
  deck.add(darkButton);

  // Roter Steuerkristall in bronzenener Fassung.
  const crystalSocket = new THREE.Mesh(
    new THREE.TorusGeometry(0.0135, 0.0035, 6, 10),
    bronze
  );
  crystalSocket.rotation.x = Math.PI / 2;
  crystalSocket.position.set(0.051, 0.007, 0.008);
  deck.add(crystalSocket);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.0115, 0),
    lensMat
  );
  crystal.scale.set(1, 0.72, 1);
  crystal.position.set(0.051, 0.0105, 0.008);
  deck.add(crystal);

  // Helle Seitenblende rechts, bündig in das Gehäuse eingelassen.
  const sidePanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.024, 0.072),
    edgeMetal
  );
  sidePanel.position.set(0.145, 0.034, 0.004);
  root.add(sidePanel);

  // Schmaler dunkler Einschnitt neben der Seitenblende.
  const sideGroove = new THREE.Mesh(
    new THREE.BoxGeometry(0.010, 0.020, 0.090),
    engravingMat
  );
  sideGroove.position.set(0.149, 0.034, 0.001);
  root.add(sideGroove);

  // Kleine Lüftungsrippen an der unteren Vorderseite.
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.031, 0.0055, 0.0035),
      edgeMetal
    );
    rib.position.set(-0.065, 0.019, -0.091 + i * 0.002);
    root.add(rib);
  }

  // Dezente Kantenstreben an der unteren Rückseite.
  for (const x of [-0.060, 0.010, 0.072]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.030, 0.006, 0.006),
      edgeMetal
    );
    strip.position.set(x, 0.016, 0.080);
    root.add(strip);
  }

  // Kollisionskörper. Der sichtbare Aufbau ruht vollständig auf y = 0.
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.08, 0.20),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    })
  );
  collision.name = 'COL_gehaeuse';
  collision.position.set(0, 0.04, 0);
  root.add(collision);

  // Benutzen-Punkt in Griffhöhe vor dem Gerät.
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_aktivieren';
  usePoint.position.set(0, 0.17, 0.035);
  usePoint.userData = {
    label: 'Attero-Steuerschlüssel aktivieren',
    radius: 0.65,
  };
  root.add(usePoint);

  // Dauerhaft leuchtender roter Statuspunkt.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_status';
  lamp.position.set(0.051, 0.078, 0.008);
  lamp.userData = {
    color: '#ff2418',
    intensity: 1.2,
    distance: 0.7,
  };
  root.add(lamp);

  // Zustand und weiche Animation.
  let aktiv = false;
  let zeit = 0;
  let letzte = null;
  let feldStaerke = 0;
  let kristallStaerke = 1.6;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    const weich = Math.min(1, step * 6);
    const zielFeld = aktiv ? 1 : 0;
    feldStaerke += (zielFeld - feldStaerke) * weich;

    for (let i = 0; i < panelMaterials.length; i++) {
      const welle = 0.5 + 0.5 * Math.sin(zeit * 3.2 - i * 0.72);
      panelMaterials[i].emissiveIntensity =
        0.015 + feldStaerke * (0.38 + welle * 0.82);
    }

    const puls = 0.5 + 0.5 * Math.sin(zeit * 4.1);
    const zielKristall = aktiv
      ? 2.2 + puls * 1.15
      : 1.15 + puls * 0.55;
    kristallStaerke += (zielKristall - kristallStaerke) * weich;
    lensMat.emissiveIntensity = kristallStaerke;
  }

  deckMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  const api = {
    aktivieren() {
      aktiv = true;
    },
    deaktivieren() {
      aktiv = false;
    },
    umschalten() {
      aktiv = !aktiv;
    },
    get aktiv() {
      return aktiv;
    },
    update,
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.animation = update;
  root.userData.quest = {
    typ: 'quest-item',
    risiko: 'hoch',
    hinweis:
      'Der Attero-Steuerschlüssel kann aktive Stargates schwer beschädigen oder zerstören.',
  };
  root.userData.actions = [
    {
      id: 'aktivieren',
      label: 'Attero-Steuerschlüssel aktivieren (hohes Risiko)',
      run: () => api.aktivieren(),
    },
    {
      id: 'deaktivieren',
      label: 'Attero-Steuerschlüssel deaktivieren',
      run: () => api.deaktivieren(),
    },
    {
      id: 'umschalten',
      label: 'Attero-Steuerschlüssel umschalten',
      run: () => api.umschalten(),
    },
  ];

  return root;
}

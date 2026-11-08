import * as THREE from 'three';

export const steckbrief = {
  name: 'personal_shield',
  art: 'Standobjekt',
  masse: '0,07 × 0,02 × 0,05 (L × H × B, m)',
  wohin: 'ATL-014 Wissenschaftslabor, ATL-030 Waffenkammer',
  benutzen: 'INT_aktivieren → Schild aktivieren/deaktivieren',
  lichter: 'LAMP_kristall (hellgrün, dauerhaft an)',
  animation: 'Kristall und DNA-Probe pulsieren; bei Aktivierung blitzt eine dünne goldene Feldhülle auf',
  quelle: 'selbst gebaut nach OBJ-049 und den Referenzbildern',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'personal_shield';

  const frameMat = new THREE.MeshStandardMaterial({
    name: 'schild_dunkelfassung',
    color: 0x30353a,
    metalness: 0.82,
    roughness: 0.34,
  });

  const ribMat = new THREE.MeshStandardMaterial({
    name: 'schild_fassungsstege',
    color: 0x444b50,
    metalness: 0.86,
    roughness: 0.28,
  });

  const crystalMat = new THREE.MeshStandardMaterial({
    name: 'schild_dna_kristall',
    color: 0x9be86d,
    emissive: 0x4bc63a,
    emissiveIntensity: 0.62,
    metalness: 0.04,
    roughness: 0.16,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  });

  const dnaMat = new THREE.MeshStandardMaterial({
    name: 'schild_dna_probe',
    color: 0xd8fff0,
    emissive: 0x72ffd7,
    emissiveIntensity: 1.1,
    metalness: 0.05,
    roughness: 0.1,
    transparent: true,
    opacity: 0.94,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    name: 'KIT_copper',
    color: 0x8b6738,
    metalness: 0.88,
    roughness: 0.3,
  });

  const statusMat = new THREE.MeshStandardMaterial({
    name: 'schild_statusanzeige',
    color: 0xa8ff75,
    emissive: 0x62e83d,
    emissiveIntensity: 0.65,
    metalness: 0.05,
    roughness: 0.2,
  });

  // X/Z-Umriss. Die Form wird anschließend geschlossen nach oben extrudiert.
  const outerPoints = [
    [-0.035, 0.000],
    [-0.026, -0.022],
    [0.022, -0.024],
    [0.035, 0.000],
    [0.024, 0.022],
    [-0.023, 0.024],
  ];

  function shapeFromXZ(points) {
    // Das Minus dreht die X/Z-Kontur korrekt in das X/Y-Arbeitssystem.
    return new THREE.Shape(
      points.map(([x, z]) => new THREE.Vector2(x, -z))
    );
  }

  function extrudeUp(shape, depth) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }

  // Geschlossene, flache Hauptfassung: 7 cm lang, knapp 5 cm breit.
  const bodyGeometry = extrudeUp(shapeFromXZ(outerPoints), 0.0115);
  const body = new THREE.Mesh(bodyGeometry, frameMat);
  body.name = 'schild_fassung';
  root.add(body);

  // Erhöhter dunkler Außenrahmen. Der gesamte Rahmen ist ein geschlossener Körper.
  const innerPoints = outerPoints.map(([x, z]) => [x * 0.88, z * 0.86]);
  const frameShape = shapeFromXZ(outerPoints);
  frameShape.holes.push(shapeFromXZ(innerPoints));

  const topFrame = new THREE.Mesh(extrudeUp(frameShape, 0.0055), ribMat);
  topFrame.name = 'schild_aussenrahmen';
  topFrame.position.y = 0.0114;
  root.add(topFrame);

  // Vier große, transluzente Kristallsegmente wie im Referenzobjekt.
  const topCells = [
    [
      [-0.030, -0.002],
      [-0.023, -0.017],
      [-0.011, -0.018],
      [-0.008, -0.007],
      [-0.010, 0.006],
      [-0.018, 0.018],
      [-0.029, 0.012],
    ],
    [
      [-0.006, -0.016],
      [0.012, -0.019],
      [0.021, -0.015],
      [0.016, -0.004],
      [0.003, 0.002],
      [-0.004, -0.004],
    ],
    [
      [-0.005, 0.003],
      [0.003, 0.005],
      [0.013, 0.006],
      [0.016, 0.014],
      [0.008, 0.019],
      [-0.002, 0.017],
    ],
    [
      [0.006, 0.002],
      [0.019, 0.003],
      [0.029, 0.006],
      [0.021, 0.017],
      [0.010, 0.019],
      [0.004, 0.011],
    ],
  ];

  topCells.forEach((points, index) => {
    const cell = new THREE.Mesh(
      extrudeUp(shapeFromXZ(points), 0.0046),
      crystalMat
    );
    cell.name = `schild_kristallsegment_${index + 1}`;
    cell.position.y = 0.01135;
    root.add(cell);
  });

  // Dunkle, erhabene Stege zwischen den Kristallflächen.
  const ribPaths = [
    [[-0.009, -0.019], [-0.007, 0.018]],
    [[-0.008, -0.018], [0.016, -0.014]],
    [[0.004, -0.019], [0.003, 0.019]],
    [[0.017, -0.004], [0.029, 0.006]],
    [[-0.008, 0.006], [0.017, 0.004]],
  ];

  ribPaths.forEach(([start, end], index) => {
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const length = Math.hypot(dx, dz);
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.0015, 0.0021),
      ribMat
    );
    rib.name = `schild_kristallsteg_${index + 1}`;
    rib.position.set(
      (start[0] + end[0]) * 0.5,
      0.0166,
      (start[1] + end[1]) * 0.5
    );
    rib.rotation.y = -Math.atan2(dz, dx);
    root.add(rib);
  });

  // Geschlossene grüne Facetten an der Vorderseite (+Z).
  const frontPanels = [
    [
      [-0.020, 0.0032],
      [-0.009, 0.0032],
      [-0.008, 0.0088],
      [-0.019, 0.0092],
    ],
    [
      [-0.006, 0.0032],
      [0.004, 0.0032],
      [0.004, 0.0088],
      [-0.005, 0.0088],
    ],
    [
      [0.007, 0.0032],
      [0.019, 0.0034],
      [0.017, 0.0088],
      [0.007, 0.0088],
    ],
  ];

  frontPanels.forEach((points, index) => {
    const shape = new THREE.Shape(
      points.map(([x, y]) => new THREE.Vector2(x, y))
    );
    const panel = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.0012,
        bevelEnabled: false,
        curveSegments: 1,
      }),
      crystalMat
    );
    panel.name = `schild_frontsegment_${index + 1}`;
    panel.position.z = 0.0231;
    root.add(panel);
  });

  // DNA-Probe: heller, kleiner Kristall in der linken oberen Kristallfläche.
  const dnaCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.003, 0),
    dnaMat
  );
  dnaCrystal.name = 'schild_dna_probe';
  dnaCrystal.position.set(-0.020, 0.0162, 0.007);
  dnaCrystal.scale.set(0.75, 0.65, 0.75);
  dnaCrystal.rotation.set(0.16, 0.42, -0.2);
  root.add(dnaCrystal);

  // Schmale bronzefarbene Energieleiste an der Front.
  const energyRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.0014, 0.001),
    copperMat
  );
  energyRail.name = 'schild_energieleiste';
  energyRail.position.set(-0.001, 0.0101, 0.0239);
  root.add(energyRail);

  // Kleine Betriebsanzeige.
  const statusLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.0048, 0.0015, 0.0012),
    statusMat
  );
  statusLight.name = 'schild_statusanzeige';
  statusLight.position.set(0.013, 0.0102, 0.0241);
  root.add(statusLight);

  // Drei dunkle Befestigungsclips an der Rückseite.
  for (let i = 0; i < 3; i++) {
    const clip = new THREE.Mesh(
      new THREE.BoxGeometry(0.0033, 0.008, 0.002),
      frameMat
    );
    clip.name = `schild_clip_${i + 1}`;
    clip.position.set(-0.021 + i * 0.0105, 0.0065, -0.0234);
    root.add(clip);
  }

  // Goldene, hauchdünne Feldhülle. Sie bleibt inaktiv nahezu unsichtbar.
  const auraMat = new THREE.MeshStandardMaterial({
    name: 'schild_feldhuelle',
    color: 0xffe29a,
    emissive: 0xffb52e,
    emissiveIntensity: 0.8,
    metalness: 0,
    roughness: 0.18,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const aura = new THREE.Mesh(bodyGeometry, auraMat);
  aura.name = 'schild_feldhuelle';
  aura.position.y = 0.0004;
  aura.scale.set(1.02, 1.35, 1.02);
  aura.renderOrder = 3;
  root.add(aura);

  // Unsichtbarer Kollisionskörper exakt in den realen Abmessungen.
  const collision = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.02, 0.05)
  );
  collision.name = 'COL_schild';
  collision.position.set(0, 0.01, 0);
  root.add(collision);

  // Benutzen-Punkt unmittelbar vor dem Emitter.
  const usePoint = new THREE.Object3D();
  usePoint.name = 'INT_aktivieren';
  usePoint.position.set(0, 0.028, 0.048);
  usePoint.userData = {
    label: 'Persönlichen Schutzschild aktivieren',
    radius: 0.35,
  };
  root.add(usePoint);

  // Dauerhaft aktive grüne Lichtquelle.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_kristall';
  lamp.position.set(0, 0.027, 0.004);
  lamp.userData = {
    color: '#9cff6a',
    intensity: 2,
    distance: 0.35,
  };
  root.add(lamp);

  // Zustand: nicht wiederaufladbare Energiezelle, 180 Sekunden Gesamtlaufzeit.
  let aktiv = false;
  let energie = 180;
  let blitz = 0;
  let zeit = 0;
  let letzte = null;

  function aktivieren() {
    if (energie <= 0) return false;
    aktiv = true;
    blitz = 1;
    return true;
  }

  function deaktivieren() {
    aktiv = false;
    return true;
  }

  function update(dt) {
    zeit += dt;

    if (aktiv) {
      energie = Math.max(0, energie - dt);
      if (energie <= 0) {
        aktiv = false;
        blitz = 0;
      }
    }

    blitz *= Math.exp(-dt * 2.6);

    const puls = 0.5 + 0.5 * Math.sin(zeit * 3.1);
    crystalMat.emissiveIntensity = aktiv
      ? 0.95 + puls * 0.65
      : 0.5 + puls * 0.2;

    dnaMat.emissiveIntensity = aktiv
      ? 1.55 + puls * 0.7
      : 0.95 + puls * 0.25;

    statusMat.emissiveIntensity = aktiv
      ? 1.45 + puls * 0.75
      : 0.38 + puls * 0.12;

    const zielOpazitaet = aktiv ? 0.035 + blitz * 0.16 : 0;
    auraMat.opacity +=
      (zielOpazitaet - auraMat.opacity) * Math.min(1, dt * 8);
    auraMat.emissiveIntensity = 0.8 + blitz * 2.1;

    const pulsSkalierung = aktiv ? 1 + puls * 0.018 + blitz * 0.025 : 1;
    aura.scale.set(
      1.02 * pulsSkalierung,
      1.35 * pulsSkalierung,
      1.02 * pulsSkalierung
    );
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(Math.max(now - letzte, 0), 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    aktivieren,
    deaktivieren,
    get aktiv() {
      return aktiv;
    },
    get energie() {
      return energie;
    },
    get energieProzent() {
      return Math.max(0, Math.min(100, (energie / 180) * 100));
    },
    get buff() {
      if (!aktiv) return null;
      return {
        typ: 'unverwundbarkeit',
        dauer: energie,
        energielimit: 180,
        energie: energie,
        gegenSturz: true,
        gegenEnergiewaffen: true,
        gegenProjektile: true,
      };
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'schild_aktivieren',
      label: 'Schild aktivieren',
      run: () => api.aktivieren(),
    },
    {
      id: 'schild_deaktivieren',
      label: 'Schild deaktivieren',
      run: () => api.deaktivieren(),
    },
  ];

  return root;
}

// Raum ATL-012: Kontenainment-Kammer / Containment Chamber Room
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Raumhülle: Architektur (Wände, Decke, zentrale polygonale Barrierezelle aus
// Panzerglas, Kraftfeldschleusen, Paneele, Lichtleisten) + Platzhalter OBJ-018 / OBJ-091.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_containment_chamber_room',
  art: 'Raum',
  masse: '8,4 m × 8,4 m × 3,6 m (ca. 70,6 m² Grundfläche); zentrale Barrierezelle Ø 5,5 m, Bauhöhe 3,3 m',
  wohin: 'Inner City, Etage 4, medizinischer Hochsicherheitsbereich',
  benutzen: 'Sichere Kontainment von Bedrohungen und Infektionen; zentrale antike Eindämmungskammer (OBJ-018) hinter Panzerglas und Kraftfeldschleusen',
  lichter: '6 LAMP_-Punkte (eisblau, je 8 / Reichweite 9 m), zusätzlich eingebaute Wand-Lichtschlitze, Deckenlichtfelder, grüne Feldindikatoren und Bernstein-Akzentlinien an der Barrierezelle',
  animation: 'Kraftfelder, grüne Feldindikatoren und Lichtleisten pulsieren dezent und atmen',
  quelle: 'ATL-012, Quellenklasse A; Rekonstruktion nach Beschreibung, Setplänen und Screencaps der Kontenainment-Kammer',
};

export function create(opts = {}) {
  const W = 8.4;
  const D = 8.4;
  const H = 3.6;
  const T = 0.3;
  const HALF_W = W / 2;
  const HALF_D = D / 2;

  const DOOR_W = 2.4;
  const DOOR_H = 3.0;

  const CELL_R = 2.75;          // Radius der polygonalen Barrierezelle (Ø 5,5 m)
  const CELL_Z = 0.0;           // Zentrum der Zelle in Z
  const CELL_H = 3.3;           // Bauhöhe der Barrierezelle
  const CELL_SEGMENTS = 12;     // 30°-Raster gemäß Atlantis-Geometrie
  const CELL_APOTHEM = CELL_R * Math.cos(Math.PI / CELL_SEGMENTS);
  const PANEL_W = 2 * CELL_R * Math.sin(Math.PI / CELL_SEGMENTS);

  const root = new THREE.Group();
  root.name = 'raum_containment_chamber_room';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matHull = kit('hull');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');
  const matGlass = kit('glass');
  matGlass.transparent = true;
  matGlass.opacity = 0.3;
  matGlass.depthWrite = false;
  matGlass.side = THREE.DoubleSide;

  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina',
    color: 0x3f6b5c,
    metalness: 0.62,
    roughness: 0.44,
  });

  const matLine = new THREE.MeshStandardMaterial({
    name: 'lichtleiste',
    color: 0xdff4ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 1.65,
    roughness: 0.5,
  });

  const matGreen = new THREE.MeshStandardMaterial({
    name: 'feld_indikator',
    color: 0x9fffc9,
    emissive: 0x24d46a,
    emissiveIntensity: 1.9,
    roughness: 0.35,
  });

  const matField = new THREE.MeshStandardMaterial({
    name: 'kraftfeld',
    color: 0x7ddcff,
    emissive: 0x35bfff,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const addMesh = (geometry, material, x, y, z, name = '') => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const addBox = (w, h, d, material, x, y, z, name = '') =>
    addMesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, name);

  const addCollider = (name, w, h, d, x, y, z, ry = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.visible = false;
    root.add(mesh);
    return mesh;
  };

  const addEmpty = (name, x, y, z, ry = 0, userData = null) => {
    const object = new THREE.Object3D();
    object.name = name;
    object.position.set(x, y, z);
    object.rotation.y = ry;
    if (userData) object.userData = userData;
    root.add(object);
    return object;
  };

  const dummy = new THREE.Object3D();
  const addInstances = (geometry, material, entries, name) => {
    if (!entries.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    entries.forEach((entry, index) => {
      dummy.position.set(entry.x, entry.y, entry.z);
      dummy.rotation.set(0, entry.ry || 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------
  // Boden: Platte, grün-kupferner Rand, 1,2-m-Plattenraster, Kreisintarsie
  // ---------------------------------------------------------------------
  addBox(W, 0.2, D, matFloor, 0, -0.1, 0, 'boden');

  for (const s of [-1, 1]) {
    addBox(0.2, 0.014, D - 0.2, matPatina, s * (HALF_W - 0.1), 0.007, 0, 'boden_rand');
    addBox(W - 0.4, 0.014, 0.2, matPatina, 0, 0.007, s * (HALF_D - 0.1), 'boden_rand');
  }

  // Plattenfugen als kurze Einzelsegmente (je 1,2 m), damit nichts über die Hülle ragt
  const seamX = [];
  const seamZ = [];
  for (let g = -3.6; g <= 3.6 + 0.001; g += 1.2) {
    for (let i = 0; i < 7; i++) {
      const p = -3.6 + i * 1.2;
      seamX.push({ x: p, y: 0.006, z: g });
      seamZ.push({ x: g, y: 0.006, z: p });
    }
  }
  addInstances(new THREE.BoxGeometry(1.12, 0.006, 0.018), matCopper, seamX, 'boden_fugen_x');
  addInstances(new THREE.BoxGeometry(0.018, 0.006, 1.12), matCopper, seamZ, 'boden_fugen_z');

  const inlay = addMesh(
    new THREE.CylinderGeometry(3.02, 3.02, 0.018, 48),
    matCopper,
    0,
    0.009,
    CELL_Z,
    'boden_zentralintarsie'
  );
  inlay.receiveShadow = true;

  const inlayRing = addMesh(
    new THREE.RingGeometry(2.62, 2.84, 48),
    matPatina,
    0,
    0.019,
    CELL_Z,
    'boden_zentralfeld'
  );
  inlayRing.rotation.x = -Math.PI / 2;

  // ---------------------------------------------------------------------
  // Außenwände, 0,3 m dick; Haupteingang an -Z (2,4 × 3,0 m)
  // ---------------------------------------------------------------------
  const frontZ = -HALF_D - T / 2;
  const backZ = HALF_D + T / 2;
  const sideX = HALF_W + T / 2;
  const pierW = (W - DOOR_W) / 2;

  addBox(T, H, D + T * 2, matWall, -sideX, H / 2, 0, 'wand_links');
  addBox(T, H, D + T * 2, matWall, sideX, H / 2, 0, 'wand_rechts');
  addBox(W, H, T, matWall, 0, H / 2, backZ, 'wand_hinten');

  addBox(pierW, H, T, matWall, -(DOOR_W / 2 + pierW / 2), H / 2, frontZ, 'wand_vorne_links');
  addBox(pierW, H, T, matWall, DOOR_W / 2 + pierW / 2, H / 2, frontZ, 'wand_vorne_rechts');
  addBox(DOOR_W, H - DOOR_H, T, matWall, 0, DOOR_H + (H - DOOR_H) / 2, frontZ, 'wand_vorne_sturz');

  // Bronzeeinfassung der Türöffnung (Zarge später als OBJ-091)
  addBox(DOOR_W + 0.24, 0.12, 0.1, matCopper, 0, DOOR_H, -HALF_D + 0.05, 'tuer_einfassung_oben');
  for (const s of [-1, 1]) {
    addBox(0.12, DOOR_H, 0.1, matCopper, s * (DOOR_W / 2 + 0.06), DOOR_H / 2, -HALF_D + 0.05, 'tuer_einfassung_seite');
  }

  // ---------------------------------------------------------------------
  // Wandpaneele und senkrechte Lichtschlitze (InstancedMesh)
  // ---------------------------------------------------------------------
  const panels = [];
  const panelFrames = [];
  const wallSlots = [];

  for (let z = -3.6; z <= 3.6 + 0.001; z += 1.2) {
    for (const s of [-1, 1]) {
      const x = s * (HALF_W - 0.025);
      const ry = s < 0 ? Math.PI / 2 : -Math.PI / 2;
      const even = Math.round((z + 3.6) / 1.2) % 2 === 0;
      if (even) {
        panels.push({ x, y: 1.55, z, ry });
        panelFrames.push({ x: x - s * 0.025, y: 1.55, z, ry });
      } else {
        for (let k = 0; k < 4; k++) {
          wallSlots.push({ x: x - s * 0.012, y: 1.05 + k * 0.43, z, ry });
        }
      }
    }
  }

  for (let x = -3.6; x <= 3.6 + 0.001; x += 1.2) {
    const z = HALF_D - 0.025;
    const even = Math.round((x + 3.6) / 1.2) % 2 === 0;
    if (even) {
      panels.push({ x, y: 1.55, z, ry: 0 });
      panelFrames.push({ x, y: 1.55, z: z - 0.025, ry: 0 });
    } else {
      for (let k = 0; k < 4; k++) {
        wallSlots.push({ x, y: 1.05 + k * 0.43, z: HALF_D - 0.012, ry: 0 });
      }
    }
  }

  addInstances(new THREE.BoxGeometry(1.02, 2.58, 0.035), matWallDark, panels, 'wandpaneele');
  addInstances(new THREE.BoxGeometry(1.12, 2.72, 0.045), matCopper, panelFrames, 'wandpaneel_rahmen');
  const slotMesh = addInstances(
    new THREE.BoxGeometry(0.065, 0.29, 0.025),
    matLine,
    wallSlots,
    'wand_lichtschlitze'
  );

  // Sockelleisten und Gesimse
  for (const s of [-1, 1]) {
    addBox(0.05, 0.15, D, matCopper, s * (HALF_W - 0.025), 0.075, 0, 'sockelleiste');
    addBox(0.06, 0.1, D, matCopper, s * (HALF_W - 0.03), H - 0.05, 0, 'gesims');
  }
  addBox(W, 0.15, 0.05, matCopper, 0, 0.075, HALF_D - 0.025, 'sockelleiste');
  addBox(W, 0.1, 0.06, matCopper, 0, H - 0.05, HALF_D - 0.03, 'gesims');
  for (const s of [-1, 1]) {
    const x = s * (DOOR_W / 2 + pierW / 2);
    addBox(pierW, 0.15, 0.05, matCopper, x, 0.075, -HALF_D + 0.025, 'sockelleiste');
    addBox(pierW, 0.1, 0.06, matCopper, x, H - 0.05, -HALF_D + 0.03, 'gesims');
  }

  // ---------------------------------------------------------------------
  // Decke: eigene Meshes, Namen beginnen mit "decke"
  // ---------------------------------------------------------------------
  addBox(W + T * 2, 0.3, D + T * 2, matCeiling, 0, H + 0.15, 0, 'decke_haut');

  const ceilingFields = [];
  for (const x of [-3.6, -1.2, 1.2, 3.6]) {
    for (const z of [-3.6, -1.2, 0, 1.2, 3.6]) ceilingFields.push({ x, y: H - 0.02, z });
  }
  addInstances(new THREE.BoxGeometry(1.85, 0.035, 1.85), matWallDark, ceilingFields, 'decke_kassetten');
  addInstances(
    new THREE.BoxGeometry(1.55, 0.018, 1.55),
    matGlow,
    ceilingFields.map((p) => ({ ...p, y: H - 0.045 })),
    'decke_lichtfelder'
  );

  // ---------------------------------------------------------------------
  // Zentrale Barrierezelle: 12-seitiges Panzerglas-Pendel mit Kraftfeldportal
  // ---------------------------------------------------------------------
  // Sockel als Ring (kein massiver Zylinder – der Innenboden bleibt frei)
  addMesh(
    new THREE.CylinderGeometry(2.9, 2.93, 0.18, 12, 1, true),
    matHull,
    0,
    0.09,
    CELL_Z,
    'zelle_sockelring'
  ).rotation.y = Math.PI / 12;

  const baseTop = addMesh(
    new THREE.RingGeometry(2.58, 2.92, 12, 1),
    matHull,
    0,
    0.185,
    CELL_Z,
    'zelle_sockelplatte'
  );
  baseTop.rotation.x = -Math.PI / 2;
  baseTop.rotation.z = Math.PI / 12;

  const lowerPanels = [];
  const glassPanels = [];
  const upperPanels = [];
  const mullions = [];
  const roofBeams = [];
  const posts = [];
  const colliderPanels = [];
  const greenLamps = [];

  const seg = (Math.PI * 2) / CELL_SEGMENTS;
  for (let i = 0; i < CELL_SEGMENTS; i++) {
    const a0 = i * seg;
    const edgeCenter = a0 + seg / 2;
    const deg = THREE.MathUtils.radToDeg(edgeCenter);
    const isPortalOpening = deg > 240 && deg < 300; // zwei Segmente bleiben für das Portal offen

    const x = CELL_APOTHEM * Math.cos(edgeCenter);
    const z = CELL_Z + CELL_APOTHEM * Math.sin(edgeCenter);
    const ry = edgeCenter + Math.PI / 2;

    if (!isPortalOpening) {
      lowerPanels.push({ x, y: 0.95, z, ry });     // 0,20 – 1,70 m
      glassPanels.push({ x, y: 2.35, z, ry });      // 1,70 – 3,00 m
      upperPanels.push({ x, y: 3.15, z, ry });      // 3,00 – 3,30 m
      mullions.push({ x, y: 2.35, z, ry });
      roofBeams.push({ x, y: 3.28, z, ry });
      greenLamps.push({ x, y: 1.34, z, ry });
      colliderPanels.push({ x, y: CELL_H / 2, z, ry });
    }
  }

  for (let i = 0; i < CELL_SEGMENTS; i++) {
    const a = i * seg;
    const deg = THREE.MathUtils.radToDeg(a);
    if (Math.abs(deg - 270) < 0.01) continue; // Pfosten entfällt (Portalöffnung)
    posts.push({
      x: CELL_R * Math.cos(a),
      y: CELL_H / 2,
      z: CELL_Z + CELL_R * Math.sin(a),
      ry: a + Math.PI / 2,
    });
  }

  addInstances(new THREE.BoxGeometry(PANEL_W, 1.5, 0.1), matHull, lowerPanels, 'zelle_hullpaneele');
  addInstances(new THREE.BoxGeometry(PANEL_W - 0.14, 1.3, 0.06), matGlass, glassPanels, 'zelle_panzerglas');
  addInstances(new THREE.BoxGeometry(PANEL_W, 0.3, 0.1), matWallDark, upperPanels, 'zelle_oberteile');
  addInstances(new THREE.BoxGeometry(0.06, 1.3, 0.09), matCopper, mullions, 'zelle_beobachtungsfenster_mitte');
  addInstances(new THREE.BoxGeometry(PANEL_W, 0.13, 0.14), matCopper, roofBeams, 'zelle_dachring');
  addInstances(new THREE.BoxGeometry(0.15, CELL_H, 0.15), matPillar, posts, 'zelle_pfeiler');
  addInstances(new THREE.BoxGeometry(0.42, 0.1, 0.05), matGreen, greenLamps, 'zelle_feldindikatoren');

  // Horizontale Profile an Sockel-, Glas- und Dachfuge + Bernstein-Akzentlinie
  const profiles = [];
  const amberProfiles = [];
  for (const y of [0.22, 1.7, 3.0, 3.24]) {
    for (const p of lowerPanels) profiles.push({ x: p.x, y, z: p.z, ry: p.ry });
  }
  for (const p of lowerPanels) amberProfiles.push({ x: p.x, y: 0.32, z: p.z, ry: p.ry });
  addInstances(new THREE.BoxGeometry(PANEL_W, 0.055, 0.12), matCopper, profiles, 'zelle_horizontalprofil');
  addInstances(new THREE.BoxGeometry(PANEL_W - 0.2, 0.045, 0.08), matAmber, amberProfiles, 'zelle_bernsteinlinie');

  // Portal-Geometrie: Öffnung zwischen den Polygonecken bei 240° und 300° (2,75 m)
  const portalZ = CELL_Z + CELL_R * Math.sin(THREE.MathUtils.degToRad(240));
  const portalHalf = Math.abs(CELL_R * Math.cos(THREE.MathUtils.degToRad(240)));

  for (const s of [-1, 1]) {
    addBox(0.18, 3.05, 0.2, matCopper, s * (portalHalf + 0.07), 1.525, portalZ, 'schleuse_pforte');
    addBox(0.06, 2.72, 0.24, matLine, s * (portalHalf - 0.04), 1.4, portalZ, 'schleuse_leuchtstreifen');
    addBox(0.12, 0.3, 0.1, matGreen, s * (portalHalf + 0.07), 1.1, portalZ + 0.1, 'schleuse_feldmodul');
  }
  addBox(portalHalf * 2 + 0.32, 0.16, 0.2, matCopper, 0, 3.05, portalZ, 'schleuse_pforte');
  addBox(portalHalf * 2 - 0.1, 0.055, 0.24, matLine, 0, 2.94, portalZ, 'schleuse_leuchtstreifen');

  const fieldMesh = addMesh(
    new THREE.PlaneGeometry(portalHalf * 2 - 0.12, 2.78),
    matField,
    0,
    1.42,
    portalZ,
    'zelle_kraftfeld'
  );

  // Kleine Feldindikatoren an den Portalpfosten
  const fieldIndicators = [];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      fieldIndicators.push({
        x: s * (portalHalf + 0.19),
        y: 0.72 + k * 0.56,
        z: portalZ + 0.07,
        ry: 0,
      });
    }
  }
  const indicatorMesh = addInstances(
    new THREE.BoxGeometry(0.1, 0.16, 0.04),
    matGreen,
    fieldIndicators,
    'schleuse_feldindikatoren'
  );

  // ---------------------------------------------------------------------
  // Antike Kraftfeldschleuse direkt vor dem Haupteingang (eckiger Rahmen)
  // ---------------------------------------------------------------------
  const airlockZ = -HALF_D + 0.2;
  for (const s of [-1, 1]) {
    addBox(0.18, 3.1, 0.18, matCopper, s * 1.3, 1.55, airlockZ, 'schleuse_vorhalle_pforte');
    addBox(0.06, 2.78, 0.22, matLine, s * 1.21, 1.43, airlockZ, 'schleuse_vorhalle_leuchtstreifen');
    addBox(0.14, 0.26, 0.09, matGreen, s * 1.3, 1.28, airlockZ + 0.1, 'schleuse_vorhalle_feldmodul');
  }
  addBox(2.76, 0.16, 0.18, matCopper, 0, 3.1, airlockZ, 'schleuse_vorhalle_pforte');
  addBox(2.4, 0.055, 0.22, matLine, 0, 3.0, airlockZ, 'schleuse_vorhalle_leuchtstreifen');

  const airlockField = addMesh(
    new THREE.PlaneGeometry(2.32, 2.74),
    matField,
    0,
    1.41,
    airlockZ,
    'schleuse_vorhalle_feld'
  );

  // ---------------------------------------------------------------------
  // Objektplatzhalter und Türanschlüsse
  // ---------------------------------------------------------------------
  // Antike Eindämmungskammer (Arcturus-Typ), 4,87 × 3,17 × 1,70 m,
  // Fußpunkt auf dem Boden in der Zelle, Vorderseite (+Z des Objekts) zeigt zum Eingang (-Z).
  addEmpty('PLACE_OBJ-018', 0, 0, CELL_Z, Math.PI);

  // Antiker Schiebetür-Rahmen in der Haupttüröffnung (Ursprung in der Wandmitte).
  addEmpty('PLACE_OBJ-091', 0, 0, frontZ, 0);

  addEmpty('DOOR_haupt', 0, 0, frontZ, Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Sicherheitsflur / vorheriger Raum',
  });

  // ---------------------------------------------------------------------
  // Lichtpunkte (mit sichtbarer Deckenleuchte – nichts schwebt)
  // ---------------------------------------------------------------------
  const lampPositions = [
    [-3.6, -3.6],
    [3.6, -3.6],
    [-3.6, 3.6],
    [3.6, 3.6],
    [-3.6, 0],
    [3.6, 0],
  ];
  lampPositions.forEach((p, index) => {
    addBox(0.82, 0.12, 0.82, matWallDark, p[0], H - 0.06, p[1], `decke_leuchte_${index + 1}`);
    addBox(0.66, 0.05, 0.66, matGlow, p[0], H - 0.14, p[1], `decke_leuchte_${index + 1}_feld`);
    addEmpty(`LAMP_${index + 1}`, p[0], H - 0.3, p[1], 0, {
      color: '#9fd8ff',
      intensity: 8,
      distance: 9,
    });
  });

  // ---------------------------------------------------------------------
  // Kollisionen
  // ---------------------------------------------------------------------
  addCollider('COL_boden', W + T * 2, 0.2, D + T * 2, 0, -0.1, 0);
  addCollider('COL_decke', W + T * 2, 0.3, D + T * 2, 0, H + 0.15, 0);
  addCollider('COL_wand_links', T, H, D + T * 2, -sideX, H / 2, 0);
  addCollider('COL_wand_rechts', T, H, D + T * 2, sideX, H / 2, 0);
  addCollider('COL_wand_hinten', W, H, T, 0, H / 2, backZ);
  addCollider('COL_wand_vorne_links', pierW, H, T, -(DOOR_W / 2 + pierW / 2), H / 2, frontZ);
  addCollider('COL_wand_vorne_rechts', pierW, H, T, DOOR_W / 2 + pierW / 2, H / 2, frontZ);
  addCollider('COL_wand_vorne_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, frontZ);

  colliderPanels.forEach((p, index) => {
    addCollider(`COL_zelle_glas_${index + 1}`, PANEL_W, CELL_H, 0.14, p.x, p.y, p.z, p.ry);
  });
  posts.forEach((p, index) => {
    addCollider(`COL_zelle_pfeiler_${index + 1}`, 0.2, CELL_H, 0.2, p.x, p.y, p.z, p.ry);
  });
  addCollider('COL_zelle_kraftfeld', portalHalf * 2, 3.0, 0.12, 0, 1.5, portalZ);
  addCollider('COL_schleuse_vorhalle_links', 0.2, 3.1, 0.2, -1.3, 1.55, airlockZ);
  addCollider('COL_schleuse_vorhalle_rechts', 0.2, 3.1, 0.2, 1.3, 1.55, airlockZ);

  // ---------------------------------------------------------------------
  // Dezente Licht- und Feldanimation
  // ---------------------------------------------------------------------
  let elapsed = 0;
  let lastTime = null;

  root.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) elapsed += Math.min(now - lastTime, 0.1);
    lastTime = now;

    const pulse = Math.sin(elapsed * 0.85);
    matField.emissiveIntensity = 1.65 + pulse * 0.32;
    matField.opacity = 0.19 + (pulse + 1) * 0.018;
    matLine.emissiveIntensity = 1.58 + pulse * 0.12;
    matGreen.emissiveIntensity = 1.75 + Math.sin(elapsed * 1.6) * 0.35;
  };

  root.userData.raum = {
    id: 'ATL-012',
    breite: W,
    tiefe: D,
    hoehe: H,
    zellenRadius: CELL_R,
    zellenMitteZ: CELL_Z,
  };

  root.userData.api = {
    setForceField(active = true) {
      matField.opacity = active ? 0.2 : 0.04;
      matField.emissiveIntensity = active ? 1.8 : 0.15;
      fieldMesh.visible = active;
      airlockField.visible = active;
      if (indicatorMesh) indicatorMesh.visible = active;
      return active;
    },
    getLayout() {
      return {
        breite: W,
        tiefe: D,
        hoehe: H,
        haupttuer: { x: 0, z: frontZ, breite: DOOR_W, hoehe: DOOR_H },
        kontainment: { x: 0, z: CELL_Z, radius: CELL_R, hoehe: CELL_H },
        kraftfeldportal: { x: 0, z: portalZ, breite: portalHalf * 2, hoehe: 3.0 },
      };
    },
  };

  return root;
}

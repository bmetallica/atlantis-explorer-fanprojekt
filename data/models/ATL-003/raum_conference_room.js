// Raum ATL-003: Konferenzraum im Kontrollturm, Etage 6.
// Kreisrunder Raum, Innendurchmesser ca. 10 m, Deckenhöhe 4,5 m.
// Ursprung = Raummitte, Bodenoberkante y = 0. Haupteingang (Kontrollraum) bei −Z.
// Leere Raumhülle: nur Architektur und PLACE_-Punkte.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_conference_room',
  art: 'Raum',
  masse: 'kreisrund, ca. 10 m Innendurchmesser, lichte Höhe 4,50 m (ca. 80 m²)',
  wohin: 'Kontrollturm, Etage 6, nahe Stargateraum und Kontrollbereich',
  benutzen: 'Einsatzbesprechung, Lagebewertung und Expeditionskoordination',
  lichter: '6 LAMP_-Punkte (eisblau), zusätzlich Decken-Lichtring und Wandlichtschlitze',
  animation: 'Lichtring, Wand- und Deckenleisten atmen langsam und dezent',
  quelle: 'selbst gebaut nach Serienbildern der Konferenzszenen (Staffel 1–4) und Atlantis-Setplänen; Grundriss rekonstruiert',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_conference_room';

  // ------------------------------------------------------------------ Maße
  const H = 4.5;          // lichte Höhe
  const T = 0.3;          // Wanddicke
  const R_WALL = 4.85;    // Ebene der Glas-/Paneelwände
  const R_COL = 5.03;     // Umkreisradius des Kollisionspolygons (16 Segmente)
  const R_FLOOR = 5.06;   // Boden-/Deckenscheibe
  const DOOR_W = 2.4;
  const DOOR_H = 3.0;
  const SECTION = Math.PI / 4;          // 45° je Abschnitt (8 Abschnitte)
  const HALF = SECTION / 2;             // 22,5° je Kollisions-Box
  const PASSAGE_SECTIONS = new Set([0, 4]); // 0 = −Z (Kontrollraum), 4 = +Z (Galerie)
  const OPEN_HALF_ANGLE = Math.atan((DOOR_W / 2) / R_WALL); // Öffnungswinkel

  // ------------------------------------------------------------------ Materialien
  const wallMat = kit('wall');
  const wallDarkMat = kit('wallDark');
  const copperMat = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glassMat = kit('glass');
  const glowMat = kit('glow');

  const patinaMat = new THREE.MeshStandardMaterial({
    name: 'boden_patina',
    color: 0x3f6b5c,
    metalness: 0.62,
    roughness: 0.42,
  });
  const inlayMat = new THREE.MeshStandardMaterial({
    name: 'boden_kupferintarsie',
    color: 0xa36d3d,
    metalness: 0.78,
    roughness: 0.3,
  });
  const lineGlowMat = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_konferenz',
    color: 0xe4f7ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 1.7,
    roughness: 0.35,
  });
  const ringGlowMat = new THREE.MeshStandardMaterial({
    name: 'lichtring_decke',
    color: 0xe8f8ff,
    emissive: 0x9fd8ff,
    emissiveIntensity: 2.1,
    metalness: 0.1,
    roughness: 0.3,
  });

  // ------------------------------------------------------------------ Buntglas-Canvas
  const makeStainedGlass = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#143c52');
    gradient.addColorStop(0.5, '#25636c');
    gradient.addColorStop(1, '#12324a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // geometrische Randglieder
    ctx.strokeStyle = '#d79a4a';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.strokeStyle = '#49b9b2';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 204, 204);

    // verschneeflocken-artiges Motiv
    ctx.strokeStyle = '#e2b35c';
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = 128 + Math.cos(a) * 92;
      const y = 128 + Math.sin(a) * 92;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 20);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 16, y - 18);
      ctx.stroke();
    }

    ctx.fillStyle = '#54c9c0';
    ctx.beginPath();
    ctx.arc(128, 128, 15, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return new THREE.MeshStandardMaterial({
      name: 'buntglas_konferenz',
      map: texture,
      emissiveMap: texture,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      metalness: 0.1,
      roughness: 0.22,
    });
  };

  const stainedGlassMat = typeof document !== 'undefined' ? makeStainedGlass() : glassMat;

  // ------------------------------------------------------------------ Helfer
  const add = (geo, mat, x, y, z, name, parent = root) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  const box = (w, h, d, mat, x, y, z, name, parent = root) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, parent);

  const collision = (name, geo, x, y, z, rotY = 0) => {
    const mesh = add(geo, wallDarkMat, x, y, z, name);
    mesh.rotation.y = rotY;
    mesh.visible = false;
    return mesh;
  };

  // --------------------------------------------------------------- Instanzen
  const instancedLists = {
    glass: [],
    stained: [],
    kick: [],
    header: [],
    frameV: [],
    frameH: [],
    strips: [],
    posts: [],
    postBase: [],
    postCap: [],
    cassettes: [],
  };

  const dummy = new THREE.Object3D();

  const makeInstances = (geometry, material, entries, name) => {
    if (!entries.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    entries.forEach((e, i) => {
      dummy.position.set(e.x, e.y, e.z);
      dummy.rotation.set(0, e.rot || 0, 0);
      dummy.scale.set(e.sx || 1, e.sy || 1, e.sz || 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // Position/Rotation einer flachen Wandtafel auf einem Kreis.
  const polar = (angle, radius, y) => ({
    x: radius * Math.cos(angle),
    y,
    z: radius * Math.sin(angle),
    rot: Math.PI / 2 - angle,
  });

  // ------------------------------------------------------------------ Boden
  const floor = add(
    new THREE.CylinderGeometry(R_FLOOR, R_FLOOR, 0.3, 64),
    floorMat,
    0,
    -0.15,
    0,
    'boden',
  );
  floor.receiveShadow = true;

  // Grün-kupferner Außenring
  const patinaRing = add(
    new THREE.TorusGeometry(R_FLOOR - 0.16, 0.11, 8, 72),
    patinaMat,
    0,
    0.008,
    0,
    'boden_rand_patina',
  );
  patinaRing.rotation.x = Math.PI / 2;

  // Kupferringe als Intarsie
  for (const radius of [3.65, 4.42]) {
    const ring = add(
      new THREE.TorusGeometry(radius, 0.028, 6, 72),
      inlayMat,
      0,
      0.01,
      0,
      'boden_kupferring',
    );
    ring.rotation.x = Math.PI / 2;
  }

  // Schneeflocken-Intarsie in der Mitte (vollständig innerhalb des Kreises)
  const snow = (x1, z1, x2, z2, width) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const mesh = box(
      len,
      0.012,
      width,
      inlayMat,
      (x1 + x2) / 2,
      0.009,
      (z1 + z2) / 2,
      'boden_schneeflocke',
    );
    mesh.rotation.y = -Math.atan2(dz, dx);
  };

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    snow(0, 0, dx * 1.55, dz * 1.55, 0.05);
    for (const rr of [0.62, 1.08]) {
      snow(dx * rr, dz * rr, dx * rr - dz * 0.28, dz * rr + dx * 0.28, 0.032);
      snow(dx * rr, dz * rr, dx * rr + dz * 0.28, dz * rr - dx * 0.28, 0.032);
    }
  }

  // ------------------------------------------------------------------ Wände
  // 8 Abschnitte, je 3 senkrechte Paneele; zwei gegenüberliegende Durchgänge.
  for (let k = 0; k < 8; k++) {
    const c = -Math.PI / 2 + k * SECTION;
    const isPassage = PASSAGE_SECTIONS.has(k);

    const paneDefs = [];
    if (isPassage) {
      // Zwei schmale Seitenpaneele, mittig 2,4 m freie Öffnung.
      const sideAngle = OPEN_HALF_ANGLE + (HALF - OPEN_HALF_ANGLE) / 2;
      const sideWidth = 2 * R_WALL * Math.tan((HALF - OPEN_HALF_ANGLE) / 2);
      paneDefs.push({ angle: c - sideAngle, width: sideWidth });
      paneDefs.push({ angle: c + sideAngle, width: sideWidth });
    } else {
      const w = 2 * R_WALL * Math.tan(Math.PI / 24); // 15°-Paneele
      paneDefs.push({ angle: c - Math.PI / 12, width: w });
      paneDefs.push({ angle: c, width: w });
      paneDefs.push({ angle: c + Math.PI / 12, width: w });
    }

    paneDefs.forEach((pane, idx) => {
      const glassBottom = 0.6;
      const glassTop = 3.9;
      const target = (k + idx) % 2 === 0 ? instancedLists.stained : instancedLists.glass;

      target.push({
        ...polar(pane.angle, R_WALL, (glassBottom + glassTop) / 2),
        sx: pane.width,
        sy: glassTop - glassBottom,
      });

      instancedLists.kick.push({
        ...polar(pane.angle, R_WALL, 0.28),
        sx: pane.width,
        sy: 0.56,
      });

      instancedLists.header.push({
        ...polar(pane.angle, R_WALL, 4.22),
        sx: pane.width,
        sy: 0.56,
      });

      const edgeOffset = Math.atan((pane.width / 2) / R_WALL);
      for (const s of [-1, 1]) {
        instancedLists.frameV.push({
          ...polar(pane.angle + s * edgeOffset, R_WALL, (glassBottom + glassTop) / 2),
          sx: 0.09,
          sy: glassTop - glassBottom,
        });
      }

      for (const y of [glassBottom, glassTop]) {
        instancedLists.frameH.push({
          ...polar(pane.angle, R_WALL, y),
          sx: pane.width + 0.08,
          sy: 0.09,
        });
      }

      instancedLists.strips.push({
        ...polar(pane.angle, R_WALL - 0.02, 3.96),
        sx: Math.max(0.3, pane.width - 0.22),
        sy: 0.05,
      });
    });

    // schlanke Pfeiler zwischen den Paneelen und an den Abschnittsgrenzen
    const postAngles = isPassage
      ? [c - HALF, c - OPEN_HALF_ANGLE, c + OPEN_HALF_ANGLE, c + HALF]
      : [c - HALF, c - Math.PI / 12, c + Math.PI / 12, c + HALF];

    for (const angle of postAngles) {
      instancedLists.posts.push({ ...polar(angle, R_WALL, H / 2), sx: 0.16, sy: H, sz: 0.2 });
      instancedLists.postBase.push({ ...polar(angle, R_WALL, 0.07), sx: 0.26, sy: 0.14, sz: 0.3 });
      instancedLists.postCap.push({ ...polar(angle, R_WALL, H - 0.09), sx: 0.26, sy: 0.18, sz: 0.3 });
    }

    // Durchgang: Sturz, Oberlicht und offene Drehtür-Paneele
    if (isPassage) {
      const outward = k === 0 ? -1 : 1; // 0 = −Z, 4 = +Z
      const zc = outward * R_WALL;

      // Oberlicht über der Öffnung (3,0–3,9 m), darüber Paneel
      box(DOOR_W, 0.9, 0.1, glassMat, 0, 3.45, zc, `durchgang_${k}_oberlicht`);
      box(DOOR_W + 0.16, 0.12, 0.16, copperMat, 0, 3.0, zc, `durchgang_${k}_sturzrahmen`);
      box(DOOR_W + 0.16, 0.09, 0.16, copperMat, 0, 3.9, zc, `durchgang_${k}_oberlichtrahmen`);
      box(DOOR_W, 0.6, 0.14, wallDarkMat, 0, 4.2, zc, `durchgang_${k}_kopf`);
      for (const s of [-1, 1]) {
        box(0.12, DOOR_H, 0.16, copperMat, s * (DOOR_W / 2 + 0.05), DOOR_H / 2, zc, `durchgang_${k}_pfosten_${s}`);
      }

      // Zwei offene Drehtür-Paneele, vollständig in den Raum geklappt
      for (const s of [-1, 1]) {
        const leaf = box(
          0.06,
          2.88,
          1.15,
          stainedGlassMat,
          s * (DOOR_W / 2 + 0.03),
          1.44,
          zc - outward * 0.58,
          `durchgang_${k}_offenes_tuerpaneel_${s}`,
        );
        leaf.rotation.y = 0;
        const edge = box(
          0.09,
          2.94,
          0.09,
          copperMat,
          s * (DOOR_W / 2 + 0.03),
          1.44,
          zc - outward * 1.13,
          `durchgang_${k}_offenes_tuerpaneel_kante_${s}`,
        );
        edge.rotation.y = 0;
      }
    }
  }

  // Instanzen erzeugen
  makeInstances(new THREE.BoxGeometry(1, 1, 0.09), glassMat, instancedLists.glass, 'wandpaneele_glas');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.09), stainedGlassMat, instancedLists.stained, 'wandpaneele_buntglas');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.14), wallDarkMat, instancedLists.kick, 'wandpaneele_sockel');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.14), wallDarkMat, instancedLists.header, 'wandpaneele_kopf');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.15), copperMat, instancedLists.frameV, 'wandpaneele_rahmen_vertikal');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.15), copperMat, instancedLists.frameH, 'wandpaneele_rahmen_horizontal');
  makeInstances(new THREE.BoxGeometry(1, 1, 0.07), lineGlowMat, instancedLists.strips, 'wand_lichtschlitze');
  makeInstances(new THREE.BoxGeometry(1, 1, 1), pillarMat, instancedLists.posts, 'saeulen_pfeiler');
  makeInstances(new THREE.BoxGeometry(1, 1, 1), copperMat, instancedLists.postBase, 'saeulen_basis');
  makeInstances(new THREE.BoxGeometry(1, 1, 1), copperMat, instancedLists.postCap, 'saeulen_kapital');

  // ------------------------------------------------------------------ Kollision der Kreiswand: 16 Boxen
  let colIndex = 0;
  for (let k = 0; k < 8; k++) {
    const c = -Math.PI / 2 + k * SECTION;
    const isPassage = PASSAGE_SECTIONS.has(k);

    for (let side = 0; side < 2; side++) {
      const a0 = c - HALF + side * HALF;
      const a1 = a0 + HALF;
      const A = new THREE.Vector2(R_COL * Math.cos(a0), R_COL * Math.sin(a0));
      const B = new THREE.Vector2(R_COL * Math.cos(a1), R_COL * Math.sin(a1));

      let P0 = A;
      let P1 = B;

      if (isPassage) {
        // Tangentialkoordinate relativ zur Öffnungsmitte
        const tangent = new THREE.Vector2(Math.sin(c), -Math.cos(c));
        const sA = A.dot(tangent);
        const sB = B.dot(tangent);
        const outer = Math.abs(sA) > Math.abs(sB) ? A : B;
        const center = Math.abs(sA) > Math.abs(sB) ? B : A;
        const sOuter = Math.abs(outer.dot(tangent));
        const f = Math.min(0.98, (DOOR_W / 2) / sOuter);
        const cut = new THREE.Vector2(
          outer.x + (center.x - outer.x) * f,
          outer.y + (center.y - outer.y) * f,
        );
        P0 = outer;
        P1 = cut;
      }

      const dx = P1.x - P0.x;
      const dz = P1.y - P0.y;
      const len = Math.hypot(dx, dz);
      if (len < 0.02) continue;

      colIndex += 1;
      collision(
        `COL_wand_segment_${String(colIndex).padStart(2, '0')}`,
        new THREE.BoxGeometry(len, H, T),
        (P0.x + P1.x) / 2,
        H / 2,
        (P0.y + P1.y) / 2,
        -Math.atan2(dz, dx),
      );
    }
  }

  // ------------------------------------------------------------------ Decke
  const ceiling = add(
    new THREE.CylinderGeometry(R_FLOOR, R_FLOOR, 0.3, 64),
    ceilingMat,
    0,
    H + 0.15,
    0,
    'decke_hauptscheibe',
  );
  ceiling.receiveShadow = true;

  const lightRing = add(
    new THREE.TorusGeometry(3.0, 0.075, 10, 96),
    ringGlowMat,
    0,
    H - 0.06,
    0,
    'decke_lichtring',
  );
  lightRing.rotation.x = Math.PI / 2;

  const ringFrame = add(
    new THREE.TorusGeometry(3.0, 0.13, 8, 96),
    copperMat,
    0,
    H - 0.04,
    0,
    'decke_lichtring_rahmen',
  );
  ringFrame.rotation.x = Math.PI / 2;

  // Deckenkassetten: 12_radiale Segmente im Ringbereich
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    instancedLists.cassettes.push({
      ...polar(angle, 3.95, H - 0.09),
      sx: 1.5,
      sy: 0.18,
      sz: 0.9,
    });
  }
  makeInstances(new THREE.BoxGeometry(1, 1, 1), wallDarkMat, instancedLists.cassettes, 'decke_kassetten');

  const centerCassette = add(
    new THREE.CylinderGeometry(2.55, 2.55, 0.16, 48),
    wallDarkMat,
    0,
    H - 0.08,
    0,
    'decke_kassette_mitte',
  );
  centerCassette.receiveShadow = true;

  const centerGlow = add(
    new THREE.CylinderGeometry(2.25, 2.25, 0.04, 48),
    glowMat,
    0,
    H - 0.18,
    0,
    'decke_lichtfeld_mitte',
  );
  centerGlow.receiveShadow = true;

  // ------------------------------------------------------------------ Boden-/Deckenkollision
  collision(
    'COL_boden',
    new THREE.CylinderGeometry(R_FLOOR - 0.2, R_FLOOR - 0.2, 0.2, 48),
    0,
    -0.1,
    0,
  );
  collision(
    'COL_decke',
    new THREE.CylinderGeometry(R_FLOOR - 0.2, R_FLOOR - 0.2, 0.3, 48),
    0,
    H + 0.15,
    0,
  );

  // ------------------------------------------------------------------ Anschlüsse und Objektplätze
  const place = (name, x, y, z, rotY = 0, userData = {}) => {
    const object = new THREE.Object3D();
    object.name = name;
    object.position.set(x, y, z);
    object.rotation.y = rotY;
    object.userData = userData;
    root.add(object);
    return object;
  };

  // Durchgänge: rotation.y zeigt nach außen.
  place('DOOR_kontrollraum', 0, 0, -R_WALL, Math.PI, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Kontrollraum / Etage 6',
  });
  place('DOOR_galerie', 0, 0, R_WALL, 0, {
    breite: DOOR_W,
    hoehe: DOOR_H,
    ziel: 'Galerie / Terrasse über der Torhalle',
  });

  // Großer Besprechungstisch mittig, Vorderseite (+Z) zum Kontrollraum (−Z).
  place('PLACE_OBJ-010', 0, 0, 0, Math.PI, {
    typ: 'Besprechungstisch',
    masse: '4.70 × 0.75 × 4.00 m',
    ausrichtung: 'mittig im Kreis, Vorderseite zu DOOR_kontrollraum',
  });

  // Antike Türsteuerungspaneele neben dem Kontrollraum-Durchgang (Wandinnenfläche).
  place('PLACE_OBJ-052', -1.62, 1.2, -R_WALL + 0.02, 0, {
    typ: 'Antikes Türsteuerungspaneel',
    masse: '0.11 × 0.31 × 0.06 m',
  });
  place('PLACE_OBJ-052_2', 1.62, 1.2, -R_WALL + 0.02, 0, {
    typ: 'Antikes Türsteuerungspaneel',
    masse: '0.11 × 0.31 × 0.06 m',
  });
  place('PLACE_OBJ-052_3', 1.62, 1.2, R_WALL - 0.02, Math.PI, {
    typ: 'Antikes Türsteuerungspaneel',
    masse: '0.11 × 0.31 × 0.06 m',
  });

  // ------------------------------------------------------------------ Licht
  const lampAngles = [-150, -90, -30, 30, 90, 150];
  lampAngles.forEach((deg, i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const lamp = new THREE.Object3D();
    lamp.name = `LAMP_${i + 1}`;
    lamp.position.set(3.55 * Math.cos(a), H - 0.35, 3.55 * Math.sin(a));
    lamp.userData = {
      color: '#9fd8ff',
      intensity: 8,
      distance: 11,
    };
    root.add(lamp);
  });

  // ------------------------------------------------------------------ Animation
  let elapsed = 0;
  let lastTime = null;
  root.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) elapsed += Math.min(now - lastTime, 0.1);
    lastTime = now;
    lineGlowMat.emissiveIntensity = 1.62 + Math.sin(elapsed * 0.7) * 0.12;
    ringGlowMat.emissiveIntensity = 2.05 + Math.sin(elapsed * 0.55) * 0.16;
  };

  // ------------------------------------------------------------------ Aktionen
  const actionOptions = [
    { id: 'konferenzraum_betreten', label: 'Konferenzraum betreten', titel: 'Konferenzraum' },
    { id: 'tueranschluesse_pruefen', label: 'Türanschlüsse prüfen', titel: 'Anschlüsse' },
  ];

  root.userData.actions = actionOptions.map((action) => ({
    ...action,
    run: () => ({
      menu: {
        title: action.titel,
        options: actionOptions.map((o) => ({ id: o.id, label: o.label })),
      },
    }),
  }));

  root.userData.raum = {
    id: 'ATL-003',
    name: 'Konferenzraum',
    form: 'kreisrund (16-Eck-Wandsegmentierung)',
    innendurchmesser: 10,
    hoehe: H,
    wanddicke: T,
    abschnitte: 8,
    durchgaenge: ['DOOR_kontrollraum', 'DOOR_galerie'],
  };

  root.userData.api = {
    tueren: ['DOOR_kontrollraum', 'DOOR_galerie'],
    tuerobjekte: [],
    fenster: ['paneelring_buntglas', 'paneelring_glas'],
    objektplaetze: [
      'PLACE_OBJ-010',
      'PLACE_OBJ-052',
      'PLACE_OBJ-052_2',
      'PLACE_OBJ-052_3',
    ],
    funktionen: [
      'raum_betreten',
      'tueranschluesse_pruefen',
      'licht_atmen',
    ],
    lichtanimation: 'Lichtring und Wand-/Deckenleisten atmen langsam',
  };

  return root;
}

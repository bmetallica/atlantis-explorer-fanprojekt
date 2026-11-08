import * as THREE from 'three';

export const steckbrief = {
  name: 'drone',
  art: 'Standobjekt',
  masse: '0,24 × 0,24 × 0,93 (B × H × L, m)',
  benutzen: 'INT_aktivieren → Menü aus userData.actions',
  lichter: 'LAMP_kopf (bernsteinfarben, dauerhaft an; bei Aktivierung heller)',
  animation: 'Aktivierung erzeugt ein grell gelb-oranges Kopfglühen, schwachen Energieschweif entlang der sechs Schwanzranken und ein weiches Zusammenziehen der Rankenspitzen',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'drone';

  // Vorderseite und gelber Kopf zeigen nach +Z.
  // Ursprung: Mitte der Unterseite, tiefster Punkt bei y = 0.
  // Die Längsachse ist ungefähr um z = 0 zentriert.

  const matDunkelBronze = new THREE.MeshStandardMaterial({
    name: 'drone_dunkelBronze',
    color: 0x493425,
    metalness: 0.86,
    roughness: 0.31,
  });

  const matBronze = new THREE.MeshStandardMaterial({
    name: 'drone_bronze',
    color: 0x76502e,
    metalness: 0.8,
    roughness: 0.29,
  });

  const matStahlblau = new THREE.MeshStandardMaterial({
    name: 'drone_stahlblau',
    color: 0x273b46,
    metalness: 0.76,
    roughness: 0.34,
  });

  const matBauch = new THREE.MeshStandardMaterial({
    name: 'drone_bauchpanzer',
    color: 0x302822,
    metalness: 0.7,
    roughness: 0.42,
  });

  const matSchweif = new THREE.MeshStandardMaterial({
    name: 'drone_energieschweif',
    color: 0xffa313,
    emissive: 0xff8a00,
    emissiveIntensity: 3.2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const matSchweifKern = new THREE.MeshStandardMaterial({
    name: 'drone_energieschweifKern',
    color: 0xfff5c2,
    emissive: 0xffdf66,
    emissiveIntensity: 4.2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const matHalo = new THREE.MeshStandardMaterial({
    name: 'drone_energiehalo',
    color: 0xffc332,
    emissive: 0xff9b00,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  // Prozedurale Kopftextur: oliv-gelbe, organische Hülle mit leuchtenden Adern.
  function createHeadTextures() {
    const width = 512;
    const height = 256;

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = width;
    colorCanvas.height = height;
    const c = colorCanvas.getContext('2d');

    const gradient = c.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#716d22');
    gradient.addColorStop(0.28, '#a39a32');
    gradient.addColorStop(0.56, '#c0ae3d');
    gradient.addColorStop(0.8, '#8b7927');
    gradient.addColorStop(1, '#51451d');
    c.fillStyle = gradient;
    c.fillRect(0, 0, width, height);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = width;
    glowCanvas.height = height;
    const g = glowCanvas.getContext('2d');
    g.fillStyle = '#000000';
    g.fillRect(0, 0, width, height);

    const veins = [
      [[88, 128], [150, 116], [208, 132], [276, 108], [354, 122], [438, 102]],
      [[116, 176], [174, 156], [230, 168], [302, 146], [372, 158], [431, 142]],
      [[166, 92], [198, 112], [218, 132]],
      [[274, 108], [294, 72], [314, 46]],
      [[302, 146], [326, 188], [344, 220]],
      [[208, 132], [184, 178], [176, 226]],
      [[354, 122], [374, 82], [396, 54]],
      [[372, 158], [410, 196], [438, 214]],
    ];

    c.lineCap = 'round';
    c.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineJoin = 'round';

    veins.forEach((punkte, index) => {
      c.beginPath();
      g.beginPath();

      punkte.forEach((punkt, i) => {
        if (i === 0) {
          c.moveTo(punkt[0], punkt[1]);
          g.moveTo(punkt[0], punkt[1]);
        } else {
          c.lineTo(punkt[0], punkt[1]);
          g.lineTo(punkt[0], punkt[1]);
        }
      });

      c.strokeStyle = index % 2 === 0 ? '#d9b62d' : '#b58119';
      c.lineWidth = 5;
      c.stroke();

      g.strokeStyle = index % 2 === 0 ? '#ffb51c' : '#ff7a08';
      g.lineWidth = 3;
      g.stroke();
    });

    for (let i = 0; i < 18; i++) {
      const x = 90 + i * 18;
      const y = 118 + Math.sin(i * 1.73) * 38;
      const länge = 14 + (i % 4) * 7;
      const dy = i % 2 === 0 ? -länge : länge;

      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 9, y + dy * 0.45);
      c.lineTo(x + 17, y + dy);
      c.strokeStyle = '#d8aa27';
      c.lineWidth = 2;
      c.stroke();

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 9, y + dy * 0.45);
      g.lineTo(x + 17, y + dy);
      g.strokeStyle = '#ff9d0a';
      g.lineWidth = 1.5;
      g.stroke();
    }

    const map = new THREE.CanvasTexture(colorCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;

    const emissiveMap = new THREE.CanvasTexture(glowCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.anisotropy = 4;

    return { map, emissiveMap };
  }

  const kopfTexturen = createHeadTextures();
  const matKopf = new THREE.MeshStandardMaterial({
    name: 'drone_gelberKopf',
    color: 0xffffff,
    map: kopfTexturen.map,
    emissive: 0xff8a00,
    emissiveMap: kopfTexturen.emissiveMap,
    emissiveIntensity: 0.055,
    metalness: 0.18,
    roughness: 0.37,
  });

  const dummy = new THREE.Object3D();

  // Geschlossener, segmentierter Bronzerumpf.
  const rumpfGeo = new THREE.SphereGeometry(1, 10, 6);
  const rumpf = new THREE.InstancedMesh(rumpfGeo, matDunkelBronze, 7);
  rumpf.name = 'rumpfsegmente';

  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    dummy.position.set(0, 0.12 + Math.sin(t * Math.PI) * 0.012, 0.13 - i * 0.033);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(
      0.101 - t * 0.052,
      0.084 - t * 0.037,
      0.069 - t * 0.012
    );
    dummy.updateMatrix();
    rumpf.setMatrixAt(i, dummy.matrix);
  }

  rumpf.instanceMatrix.needsUpdate = true;
  root.add(rumpf);

  // Paarweise angeordnete Panzerplatten auf dem Rücken.
  const plattenGeo = new THREE.SphereGeometry(1, 10, 6);
  const platten = new THREE.InstancedMesh(plattenGeo, matBronze, 6);
  platten.name = 'panzerplatten';

  for (let i = 0; i < 6; i++) {
    const seite = i < 3 ? -1 : 1;
    const reihe = i % 3;

    dummy.position.set(
      seite * (0.040 + reihe * 0.003),
      0.181 - reihe * 0.005,
      0.112 - reihe * 0.050
    );
    dummy.rotation.set(0, seite * 0.09, seite * 0.12);
    dummy.scale.set(0.060, 0.029, 0.049);
    dummy.updateMatrix();
    platten.setMatrixAt(i, dummy.matrix);
  }

  platten.instanceMatrix.needsUpdate = true;
  root.add(platten);

  // Dunkler Bauchpanzer; seine Unterseite berührt den Boden bei y = 0.
  const bauch = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 7), matBauch);
  bauch.name = 'bauchpanzer';
  bauch.position.set(0, 0.053, 0.075);
  bauch.scale.set(0.083, 0.053, 0.115);
  root.add(bauch);

  // Stahlblauer Übergang zwischen Rumpf und Kopf.
  const keil = new THREE.Mesh(new THREE.ConeGeometry(0.081, 0.17, 10), matStahlblau);
  keil.name = 'stahlblauerKeil';
  keil.rotation.x = -Math.PI / 2;
  keil.position.set(0, 0.125, 0.175);
  root.add(keil);

  // Geschlossener, tropfenförmiger gelber Kopf.
  const kopfProfil = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.061, 0.035),
    new THREE.Vector2(0.101, 0.085),
    new THREE.Vector2(0.132, 0.145),
    new THREE.Vector2(0.143, 0.215),
    new THREE.Vector2(0.126, 0.278),
    new THREE.Vector2(0.082, 0.325),
    new THREE.Vector2(0.0, 0.35),
  ];

  const kopfGeo = new THREE.LatheGeometry(kopfProfil, 16);
  kopfGeo.rotateX(Math.PI / 2);

  const kopf = new THREE.Mesh(kopfGeo, matKopf);
  kopf.name = 'gelberKopf';
  kopf.position.set(0, 0.125, 0.10);
  kopf.scale.set(0.82, 0.78, 1);
  root.add(kopf);

  // Kleine nach hinten gerichtete Stacheln an der Unterseite des gelben Kopfes.
  const stachelGeo = new THREE.ConeGeometry(0.008, 0.05, 8);
  const stacheln = new THREE.InstancedMesh(stachelGeo, matBronze, 7);
  stacheln.name = 'kopfstacheln';

  const hoch = new THREE.Vector3(0, 1, 0);
  const stachelRichtung = new THREE.Vector3(0, -0.2, -1).normalize();

  for (let i = 0; i < 7; i++) {
    const x = -0.051 + i * 0.017;
    const y = 0.064 - Math.abs(x) * 0.16;
    const z = 0.185 + Math.abs(x) * 0.11;

    dummy.position.set(x, y, z);
    dummy.quaternion.setFromUnitVectors(hoch, stachelRichtung);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stacheln.setMatrixAt(i, dummy.matrix);
  }

  stacheln.instanceMatrix.needsUpdate = true;
  root.add(stacheln);

  // Dynamische, geschlossene Tube-Geometrie mit abnehmendem Radius.
  function createDynamicTubeGeometry(radialSegments = 5, tubularSegments = 12) {
    const geometry = new THREE.BufferGeometry();
    const vertexCount = (tubularSegments + 1) * (radialSegments + 1) + 2;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const indices = [];

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + j + 1;
        const d = i * (radialSegments + 1) + j + 1;
        indices.push(a, b, d, b, c, d);
      }
    }

    const firstCenter = (tubularSegments + 1) * (radialSegments + 1);
    const lastCenter = firstCenter + 1;

    for (let j = 0; j < radialSegments; j++) {
      const next = (j + 1) % radialSegments;
      indices.push(firstCenter, next, j);

      const lastRing = tubularSegments * (radialSegments + 1);
      indices.push(lastCenter, lastRing + j, lastRing + next);
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage)
    );
    geometry.setIndex(indices);
    geometry.userData.radialSegments = radialSegments;
    geometry.userData.tubularSegments = tubularSegments;

    return geometry;
  }

  function updateDynamicTube(mesh, curve, radiusStart, radiusEnd) {
    const geometry = mesh.geometry;
    const radialSegments = geometry.userData.radialSegments;
    const tubularSegments = geometry.userData.tubularSegments;
    const position = geometry.attributes.position.array;
    const frames = curve.computeFrenetFrames(tubularSegments, false);

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const point = curve.getPoint(t);
      const radius = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nx = normal.x * cos + binormal.x * sin;
        const ny = normal.y * cos + binormal.y * sin;
        const nz = normal.z * cos + binormal.z * sin;
        const index = (i * (radialSegments + 1) + j) * 3;

        position[index] = point.x + nx * radius;
        position[index + 1] = point.y + ny * radius;
        position[index + 2] = point.z + nz * radius;
      }
    }

    const first = curve.getPoint(0);
    const last = curve.getPoint(1);
    const firstIndex = (tubularSegments + 1) * (radialSegments + 1) * 3;
    const lastIndex = firstIndex + 3;

    position[firstIndex] = first.x;
    position[firstIndex + 1] = first.y;
    position[firstIndex + 2] = first.z;
    position[lastIndex] = last.x;
    position[lastIndex + 1] = last.y;
    position[lastIndex + 2] = last.z;

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
  }

  // Sechs schmale, organische Schwanzranken.
  // Sie starten in einem kompakten Bündel am Rumpf, verlaufen fast parallel
  // nach -Z und laufen zur Spitze hin zusammen. Aktiv enden alle Spitzen
  // exakt auf derselben Punkt.
  const ranken = [];
  const rankenWurzelZ = -0.055;
  const rankenLaenge = 0.425;
  const rankenMitteY = 0.12;
  const rankenBogen = 0.005;

  for (let i = 0; i < 6; i++) {
    const winkel = (i / 6) * Math.PI * 2;

    const rx = Math.cos(winkel) * 0.028;
    const ry = Math.sin(winkel) * 0.018;

    const wurzel = new THREE.Group();
    wurzel.name = `ranke_${i + 1}`;
    wurzel.position.set(rx, rankenMitteY + ry, rankenWurzelZ);
    root.add(wurzel);

    const mesh = new THREE.Mesh(
      createDynamicTubeGeometry(),
      i % 2 === 0 ? matDunkelBronze : matBronze
    );
    mesh.name = `rankenrohr_${i + 1}`;
    wurzel.add(mesh);

    const glow = new THREE.Mesh(
      createDynamicTubeGeometry(),
      i % 3 === 0 ? matSchweifKern : matSchweif
    );
    glow.name = `rankenglow_${i + 1}`;
    wurzel.add(glow);

    ranken.push({
      wurzel,
      mesh,
      glow,
      rx,
      ry,
      winkel,
    });
  }

  // Kleine segmentartige Verdickungen entlang der Ranken.
  const knottenGeo = new THREE.SphereGeometry(1, 5, 3);
  const knotten = new THREE.InstancedMesh(knottenGeo, matBronze, 42);
  knotten.name = 'rankensegmente';
  root.add(knotten);

  const knottenPositionen = [0.08, 0.22, 0.37, 0.53, 0.69, 0.84, 0.94];

  function updateRanken(gluth) {
    ranken.forEach((ranke, rankenIndex) => {
      const cos = Math.cos(ranke.winkel);
      const sin = Math.sin(ranke.winkel);

      // Inaktive Spitzen bleiben eng beieinander, aktive Spitzen treffen
      // sich vollständig auf der Mittelachse.
      const inaktiveSpitzeX = cos * 0.018;
      const inaktiveSpitzeY = sin * 0.011;

      const spitzeX = THREE.MathUtils.lerp(inaktiveSpitzeX, 0, gluth);
      const spitzeY = THREE.MathUtils.lerp(inaktiveSpitzeY, 0, gluth);

      const bogenX = -sin * rankenBogen;
      const bogenY = cos * rankenBogen * 0.72;

      const tWerte = [0, 0.18, 0.38, 0.60, 0.80, 1];
      const punkte = [];

      tWerte.forEach((t) => {
        const wölbung = Math.sin(t * Math.PI);
        const glättung = t * t * (3 - 2 * t);

        const globaleX =
          THREE.MathUtils.lerp(ranke.rx, spitzeX, glättung) +
          bogenX * wölbung * (1 - gluth * 0.35);

        const globaleY =
          THREE.MathUtils.lerp(ranke.ry, spitzeY, glättung) +
          bogenY * wölbung * (1 - gluth * 0.35);

        punkte.push(new THREE.Vector3(
          globaleX - ranke.rx,
          globaleY - ranke.ry,
          -t * rankenLaenge
        ));
      });

      const curve = new THREE.CatmullRomCurve3(punkte, false, 'centripetal', 0.5);
      updateDynamicTube(ranke.mesh, curve, 0.0115, 0.0025);
      updateDynamicTube(ranke.glow, curve, 0.0125, 0.0030);

      knottenPositionen.forEach((t, knottenIndex) => {
        const punkt = curve.getPoint(t);
        const radius = THREE.MathUtils.lerp(0.0115, 0.0025, t);

        dummy.position.set(
          ranke.rx + punkt.x,
          rankenMitteY + ranke.ry + punkt.y,
          rankenWurzelZ + punkt.z
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(radius * 1.15, radius * 0.85, radius * 1.35);
        dummy.updateMatrix();

        knotten.setMatrixAt(rankenIndex * knottenPositionen.length + knottenIndex, dummy.matrix);
      });
    });

    knotten.instanceMatrix.needsUpdate = true;
  }

  // Dezenter Energiehalo um den aktiven Kopf.
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), matHalo);
  halo.name = 'energiehalo';
  halo.position.set(0, 0.125, 0.28);
  halo.scale.set(0.118, 0.095, 0.175);
  root.add(halo);

  // Unsichtbarer Kollisionskörper für Rumpf und Kopf.
  const colMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.52), colMaterial);
  col.name = 'COL_drohne';
  col.position.set(0, 0.10, 0.17);
  root.add(col);

  // Benutzen-Punkt vor der Drohne in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_aktivieren';
  use.position.set(0, 0.66, 0.66);
  use.userData = {
    label: 'Drohne aktivieren',
    radius: 0.8,
  };
  root.add(use);

  // Dauerhaftes bernsteinfarbenes Licht im Kopfbereich.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_kopf';
  lamp.position.set(0, 0.18, 0.35);
  lamp.userData = {
    color: '#ffb23d',
    intensity: 2.6,
    distance: 2.2,
  };
  root.add(lamp);

  let aktiv = false;
  let gluth = 0;
  let zeit = 0;
  let letzteZeit = null;
  let letzteRankenGluth = null;

  function update(dt) {
    zeit += dt;
    const weich = Math.min(1, dt * 5.2);
    const zielGluth = aktiv ? 1 : 0;

    gluth += (zielGluth - gluth) * weich;

    const puls =
      0.86 +
      Math.sin(zeit * 7.2) * 0.10 +
      Math.sin(zeit * 12.6) * 0.04;

    matKopf.emissiveIntensity = 0.055 + gluth * (3.35 + puls * 0.65);
    matSchweif.opacity = gluth * 0.24;
    matSchweif.emissiveIntensity = 3.2 + puls * 1.1;
    matSchweifKern.opacity = gluth * 0.68;
    matSchweifKern.emissiveIntensity = 4.4 + puls * 1.3;
    matHalo.opacity = gluth * (0.065 + puls * 0.018);
    matHalo.emissiveIntensity = 1.8 + puls * 0.6;

    lamp.userData.intensity = 2.6 + gluth * 5.4;
    lamp.userData.distance = 2.2 + gluth * 1.8;

    if (
      letzteRankenGluth === null ||
      Math.abs(gluth - letzteRankenGluth) > 0.0005
    ) {
      updateRanken(gluth);
      letzteRankenGluth = gluth;
    }
  }

  // Initiale, kompakte Rankenform.
  updateRanken(0);
  letzteRankenGluth = 0;

  kopf.onBeforeRender = () => {
    const jetzt = performance.now() / 1000;

    if (letzteZeit !== null) {
      update(Math.min(Math.max(jetzt - letzteZeit, 0), 0.1));
    }

    letzteZeit = jetzt;
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
    get gluth() {
      return gluth;
    },
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'aktivieren',
      label: 'Drohne aktivieren',
      run: () => api.aktivieren(),
    },
    {
      id: 'deaktivieren',
      label: 'Drohne deaktivieren',
      run: () => api.deaktivieren(),
    },
    {
      id: 'umschalten',
      label: 'Drohne umschalten',
      run: () => api.umschalten(),
    },
  ];

  return root;
}

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'holding_cell',
  art: 'Großobjekt / Arrestzelle mit Kraftfeldbarriere',
  masse: '3,00 × 2,70 × 3,00 m (B × H × T)',
  benutzen: 'INT_zelle bedienen → Kraftfeld und Zellentür schalten',
  lichter: 'LAMP_spot (eisblau), LAMP_feld (eisblau)',
  animation:
    'Kraftfelder pulsieren halbtransparent (Opazität 0,18–0,30); beim Öffnen erlischt nur das vordere Feld, während das Vordergitter waagerecht bleibt und seitlich in den rechten Rahmen einfährt.',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'holding_cell';

  const breite = 3.0;
  const hoehe = 2.7;
  const tiefe = 3.0;
  const halbeB = breite / 2;
  const halbeT = tiefe / 2;

  const stahlBlau = new THREE.MeshStandardMaterial({
    name: 'stahlblau',
    color: 0x405869,
    metalness: 0.82,
    roughness: 0.34,
  });

  const stahlDunkel = new THREE.MeshStandardMaterial({
    name: 'stahl_dunkel',
    color: 0x202b33,
    metalness: 0.86,
    roughness: 0.3,
  });

  const bronze = kit('copper');
  const floorMat = kit('floor');

  // Transparente, schwach leuchtende Kraftfeldfläche.
  // Normales Blending verhindert, dass sich die blauen Flächen bei
  // Überlagerung zu einer weißen, undurchsichtigen Platte aufaddieren.
  const feldPanelMat = new THREE.MeshStandardMaterial({
    name: 'kraftfeld_blau',
    color: 0x7fc8ff,
    emissive: 0x1b5f86,
    emissiveIntensity: 0.16,
    metalness: 0,
    roughness: 0.9,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const feldVornePanelMat = feldPanelMat.clone();
  feldVornePanelMat.name = 'kraftfeld_blau_vorne';

  // Sehr dünne additive Scanlinien als zusätzliche Feldstruktur.
  const feldScanMat = new THREE.MeshBasicMaterial({
    name: 'kraftfeld_scan',
    color: 0x63cfff,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const feldVorneScanMat = feldScanMat.clone();
  feldVorneScanMat.name = 'kraftfeld_scan_vorne';

  const rasterMat = new THREE.MeshBasicMaterial({
    name: 'kraftfeld_raster',
    color: 0x8cdcff,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const rasterVorneMat = rasterMat.clone();
  rasterVorneMat.name = 'kraftfeld_raster_vorne';

  const displayMat = new THREE.MeshStandardMaterial({
    name: 'zell_display',
    color: 0x061c26,
    emissive: 0x38d8ff,
    emissiveIntensity: 0.8,
    metalness: 0.18,
    roughness: 0.25,
  });

  const statusMat = new THREE.MeshStandardMaterial({
    name: 'zell_status',
    color: 0x7fe8ff,
    emissive: 0x39d7ff,
    emissiveIntensity: 1.15,
    metalness: 0.12,
    roughness: 0.22,
  });

  function box(parent, width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material,
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  const dummy = new THREE.Object3D();

  function setInstance(mesh, index, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  function instanced(parent, geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }

  // Grundplatte: tiefster Punkt bei y = 0.
  const boden = box(root, breite, 0.1, tiefe, floorMat, 0, 0.05, 0);

  // Bronzefarbene Randstreben innerhalb des 3 × 3 m Fußabdrucks.
  box(root, 0.12, 0.08, tiefe, bronze, -halbeB + 0.06, 0.14, 0);
  box(root, 0.12, 0.08, tiefe, bronze, halbeB - 0.06, 0.14, 0);
  box(root, breite - 0.24, 0.08, 0.12, bronze, 0, 0.14, -halbeT + 0.06);
  box(root, breite - 0.24, 0.08, 0.12, bronze, 0, 0.14, halbeT - 0.06);

  // Vier tragende Eckpfosten.
  const pfostenGeo = new THREE.BoxGeometry(0.16, 2.5, 0.16);
  const pfosten = instanced(root, pfostenGeo, stahlBlau, 4);
  [
    [-1.42, 1.35, -1.42],
    [1.42, 1.35, -1.42],
    [-1.42, 1.35, 1.42],
    [1.42, 1.35, 1.42],
  ].forEach((p, i) => setInstance(pfosten, i, p[0], p[1], p[2]));
  pfosten.instanceMatrix.needsUpdate = true;

  // Oberer Rahmen.
  box(root, 3.0, 0.14, 0.14, stahlBlau, 0, 2.63, -1.43);
  box(root, 3.0, 0.14, 0.14, stahlBlau, 0, 2.63, 1.43);
  box(root, 0.14, 0.14, 2.72, stahlBlau, -1.43, 2.63, 0);
  box(root, 0.14, 0.14, 2.72, stahlBlau, 1.43, 2.63, 0);
  box(root, 3.0, 0.12, 0.14, bronze, 0, 2.63, 1.43);

  // Dachquerstreben.
  const dachGeo = new THREE.BoxGeometry(2.72, 0.1, 0.12);
  const dach = instanced(root, dachGeo, stahlDunkel, 3);
  [-1.0, 0, 1.0].forEach((z, i) => setInstance(dach, i, 0, 2.56, z));
  dach.instanceMatrix.needsUpdate = true;

  // Waagerechte Streben der drei geschlossenen Käfigseiten.
  const strebenY = [];
  for (let i = 0; i < 9; i++) strebenY.push(0.22 + i * 0.295);

  const hintereStreben = instanced(
    root,
    new THREE.BoxGeometry(2.68, 0.12, 0.08),
    stahlDunkel,
    strebenY.length,
  );
  strebenY.forEach((y, i) => setInstance(hintereStreben, i, 0, y, -1.42));
  hintereStreben.instanceMatrix.needsUpdate = true;

  const linkeStreben = instanced(
    root,
    new THREE.BoxGeometry(0.08, 0.12, 2.68),
    stahlDunkel,
    strebenY.length,
  );
  strebenY.forEach((y, i) => setInstance(linkeStreben, i, -1.42, y, 0));
  linkeStreben.instanceMatrix.needsUpdate = true;

  const rechteStreben = instanced(
    root,
    new THREE.BoxGeometry(0.08, 0.12, 2.68),
    stahlDunkel,
    strebenY.length,
  );
  strebenY.forEach((y, i) => setInstance(rechteStreben, i, 1.42, y, 0));
  rechteStreben.instanceMatrix.needsUpdate = true;

  // Vertikale Versteifungen an Rückwand und Seiten.
  const rippGeo = new THREE.BoxGeometry(0.1, 2.44, 0.1);

  const rueckRippen = instanced(root, rippGeo, stahlBlau, 3);
  [-0.9, 0, 0.9].forEach((x, i) => setInstance(rueckRippen, i, x, 1.35, -1.42));
  rueckRippen.instanceMatrix.needsUpdate = true;

  const linksRippen = instanced(root, rippGeo, stahlBlau, 3);
  [-0.9, 0, 0.9].forEach((z, i) => setInstance(linksRippen, i, -1.42, 1.35, z));
  linksRippen.instanceMatrix.needsUpdate = true;

  const rechtsRippen = instanced(root, rippGeo, stahlBlau, 3);
  [-0.9, 0, 0.9].forEach((z, i) => setInstance(rechtsRippen, i, 1.42, 1.35, z));
  rechtsRippen.instanceMatrix.needsUpdate = true;

  // Vorderes Gitter mit denselben waagerechten Stäben wie die übrigen Seiten.
  // Beim Öffnen gleitet es seitlich in den rechten Rahmen.
  const tor = new THREE.Group();
  tor.name = 'tor_gitter';
  tor.position.set(0, 0, 1.43);
  root.add(tor);

  const torStreben = instanced(
    tor,
    new THREE.BoxGeometry(2.68, 0.13, 0.09),
    stahlDunkel,
    strebenY.length,
  );
  strebenY.forEach((y, i) => setInstance(torStreben, i, 0, y, 0));
  torStreben.instanceMatrix.needsUpdate = true;

  const torRippen = instanced(tor, rippGeo, stahlBlau, 3);
  [-0.9, 0, 0.9].forEach((x, i) => setInstance(torRippen, i, x, 1.35, 0));
  torRippen.instanceMatrix.needsUpdate = true;

  // Führungsschiene für das seitlich einfahrende Gitter.
  box(root, 0.18, 2.46, 0.16, stahlDunkel, 1.36, 1.35, 1.4);
  box(root, 0.05, 2.3, 0.03, statusMat, 1.365, 1.35, 1.31);

  // Einfache, einseitig gerenderte Feldflächen statt quaderförmiger
  // Transparentkörper. Dadurch entsteht keine doppelte Lichtaddition.
  const feldRechts = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 2.42),
    feldPanelMat,
  );
  feldRechts.position.set(1.365, 1.35, 0);
  feldRechts.rotation.y = -Math.PI / 2;
  feldRechts.renderOrder = 2;
  root.add(feldRechts);

  const feldLinks = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 2.42),
    feldPanelMat,
  );
  feldLinks.position.set(-1.365, 1.35, 0);
  feldLinks.rotation.y = Math.PI / 2;
  feldLinks.renderOrder = 2;
  root.add(feldLinks);

  const feldHinten = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 2.42),
    feldPanelMat,
  );
  feldHinten.position.set(0, 1.35, -1.365);
  feldHinten.renderOrder = 2;
  root.add(feldHinten);

  // Vorderes Kraftfeld liegt unmittelbar hinter dem Vordergitter.
  const feldVorne = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 2.42),
    feldVornePanelMat,
  );
  feldVorne.position.set(0, 1.35, 1.375);
  feldVorne.renderOrder = 2;
  root.add(feldVorne);

  // Horizontale Scanlinien.
  const scanY = [];
  for (let i = 0; i < 12; i++) scanY.push(0.24 + i * 0.2);

  const scanSeiten = instanced(
    root,
    new THREE.BoxGeometry(0.008, 0.008, 2.54),
    feldScanMat,
    scanY.length * 2,
  );
  scanY.forEach((y, i) => {
    setInstance(scanSeiten, i, -1.345, y, 0);
    setInstance(scanSeiten, i + scanY.length, 1.345, y, 0);
  });
  scanSeiten.instanceMatrix.needsUpdate = true;

  const scanHinten = instanced(
    root,
    new THREE.BoxGeometry(2.58, 0.008, 0.008),
    feldScanMat,
    scanY.length,
  );
  scanY.forEach((y, i) => setInstance(scanHinten, i, 0, y, -1.345));
  scanHinten.instanceMatrix.needsUpdate = true;

  const scanVorne = instanced(
    root,
    new THREE.BoxGeometry(2.58, 0.008, 0.008),
    feldVorneScanMat,
    scanY.length,
  );
  scanY.forEach((y, i) => setInstance(scanVorne, i, 0, y, 1.355));
  scanVorne.instanceMatrix.needsUpdate = true;

  // Vertikale Rasterlinien.
  const rasterGeo = new THREE.BoxGeometry(0.007, 2.36, 0.007);
  const rasterX = [-1.1, -0.66, -0.22, 0.22, 0.66, 1.1];
  const rasterZ = [-1.1, -0.66, -0.22, 0.22, 0.66, 1.1];

  const rasterSeiten = instanced(root, rasterGeo, rasterMat, rasterZ.length * 2);
  rasterZ.forEach((z, i) => {
    setInstance(rasterSeiten, i, -1.35, 1.35, z);
    setInstance(rasterSeiten, i + rasterZ.length, 1.35, 1.35, z);
  });
  rasterSeiten.instanceMatrix.needsUpdate = true;

  const rasterHinten = instanced(root, rasterGeo, rasterMat, rasterX.length);
  rasterX.forEach((x, i) => setInstance(rasterHinten, i, x, 1.35, -1.35));
  rasterHinten.instanceMatrix.needsUpdate = true;

  const rasterVorne = instanced(root, rasterGeo, rasterVorneMat, rasterX.length);
  rasterX.forEach((x, i) => setInstance(rasterVorne, i, x, 1.35, 1.36));
  rasterVorne.instanceMatrix.needsUpdate = true;

  // Leuchtende untere Feldmarkierungen.
  const kantenGeo = new THREE.BoxGeometry(0.025, 0.025, 2.58);
  const kanteLinks = new THREE.Mesh(kantenGeo, statusMat);
  kanteLinks.position.set(-1.345, 0.2, 0);
  root.add(kanteLinks);

  const kanteRechts = new THREE.Mesh(kantenGeo, statusMat);
  kanteRechts.position.set(1.345, 0.2, 0);
  root.add(kanteRechts);

  const kanteHinten = new THREE.Mesh(
    new THREE.BoxGeometry(2.58, 0.025, 0.025),
    statusMat,
  );
  kanteHinten.position.set(0, 0.2, -1.345);
  root.add(kanteHinten);

  // Kompakte Bedienblende am vorderen rechten Pfosten.
  box(root, 0.24, 0.44, 0.06, stahlDunkel, 1.35, 1.28, 1.43);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.22), displayMat);
  display.position.set(1.35, 1.37, 1.462);
  root.add(display);

  box(root, 0.14, 0.025, 0.008, statusMat, 1.35, 1.19, 1.462);
  box(root, 0.09, 0.018, 0.008, statusMat, 1.325, 1.13, 1.462);

  // Statische Kollisionskörper der festen Käfigseiten.
  const colHinten = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 0.12));
  colHinten.name = 'COL_rueckwand';
  colHinten.position.set(0, 1.35, -1.44);
  root.add(colHinten);

  const colLinks = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 3.0));
  colLinks.name = 'COL_linke_wand';
  colLinks.position.set(-1.44, 1.35, 0);
  root.add(colLinks);

  const colRechts = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 3.0));
  colRechts.name = 'COL_rechte_wand';
  colRechts.position.set(1.44, 1.35, 0);
  root.add(colRechts);

  // Fester Kollisionskörper der Öffnungsseite.
  // Er wird erst deaktiviert, wenn das Gitter weit genug zur Seite gefahren ist.
  const colVorne = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 0.12));
  colVorne.name = 'COL_oeffnungsseite';
  colVorne.position.set(0, 1.35, 1.44);
  root.add(colVorne);

  // Benutzen-Punkt vor der Öffnungsseite.
  const use = new THREE.Object3D();
  use.name = 'INT_zelle';
  use.position.set(0.85, 1.15, 2.0);
  use.userData = { label: 'Arrestzelle bedienen', radius: 0.95 };
  root.add(use);

  // Gezieltes blaues Licht im Inneren der Zelle.
  const spot = new THREE.SpotLight(0x6fcfff, 9, 9, 0.92, 0.58, 1.6);
  spot.name = 'LAMP_spot';
  spot.position.set(0, 2.46, 0.32);
  spot.userData = { color: '#6fe3ff', intensity: 9, distance: 9 };
  root.add(spot);

  const spotZiel = new THREE.Object3D();
  spotZiel.name = 'spot_ziel';
  spotZiel.position.set(0, 0.12, 0.12);
  root.add(spotZiel);
  spot.target = spotZiel;

  const feldLampe = new THREE.PointLight(0x54d8ff, 1.8, 5.5, 2);
  feldLampe.name = 'LAMP_feld';
  feldLampe.position.set(0, 1.45, 0);
  feldLampe.userData = { color: '#6fe3ff', intensity: 1.8, distance: 5.5 };
  root.add(feldLampe);

  // Zustand und weiche Animation.
  let kraftfeldAktiv = true;
  let tuerOffen = false;
  let seitenStaerke = 1;
  let vorneStaerke = 1;
  let torOeffnung = 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    zeit += dt;
    const schritt = Math.min(1, dt * 5);

    const zielSeiten = kraftfeldAktiv ? 1 : 0;
    const zielVorne = kraftfeldAktiv && !tuerOffen ? 1 : 0;

    seitenStaerke += (zielSeiten - seitenStaerke) * schritt;
    vorneStaerke += (zielVorne - vorneStaerke) * schritt;

    // Opazität bleibt im gewünschten Bereich von etwa 0,18–0,30.
    const flimmern =
      0.24 +
      Math.sin(zeit * 2.25) * 0.045 +
      Math.sin(zeit * 7.1) * 0.015;

    feldPanelMat.opacity = Math.max(0, flimmern * seitenStaerke);
    feldPanelMat.emissiveIntensity = 0.16 * seitenStaerke;
    feldScanMat.opacity = Math.max(
      0,
      (0.14 + Math.sin(zeit * 5.0) * 0.035) * seitenStaerke,
    );
    rasterMat.opacity = Math.max(
      0,
      (0.1 + Math.sin(zeit * 3.4) * 0.025) * seitenStaerke,
    );

    feldVornePanelMat.opacity = Math.max(0, flimmern * vorneStaerke);
    feldVornePanelMat.emissiveIntensity = 0.16 * vorneStaerke;
    feldVorneScanMat.opacity = Math.max(
      0,
      (0.14 + Math.sin(zeit * 5.0) * 0.035) * vorneStaerke,
    );
    rasterVorneMat.opacity = Math.max(
      0,
      (0.1 + Math.sin(zeit * 3.4) * 0.025) * vorneStaerke,
    );

    const sichtbar = seitenStaerke > 0.005;
    feldLinks.visible = feldRechts.visible = feldHinten.visible = sichtbar;
    scanSeiten.visible = scanHinten.visible = sichtbar;
    rasterSeiten.visible = rasterHinten.visible = sichtbar;

    const sichtbarVorne = vorneStaerke > 0.005;
    feldVorne.visible = scanVorne.visible = rasterVorne.visible = sichtbarVorne;

    // Das Gitter fährt zur Seite und wird dabei in die rechte Führung
    // eingezogen, ohne den äußeren 3 × 3 m Fußabdruck zu verlassen.
    const zielTor = tuerOffen ? 1 : 0;
    torOeffnung += (zielTor - torOeffnung) * Math.min(1, dt * 3.2);

    const scaleX = 1 - torOeffnung * 0.88;
    const zielX = 1.26 * torOeffnung;
    tor.position.x += (zielX - tor.position.x) * Math.min(1, dt * 4);
    tor.scale.x += (scaleX - tor.scale.x) * Math.min(1, dt * 4);

    colVorne.userData.aktiv = !(tuerOffen && torOeffnung > 0.65); // COL_ bleibt unsichtbar; das Spiel liest userData.aktiv

    displayMat.emissiveIntensity =
      0.32 + (kraftfeldAktiv ? 0.6 : 0.08) + Math.sin(zeit * 2.6) * 0.08;

    spot.intensity = 8.2 + seitenStaerke * 1.2 + Math.sin(zeit * 1.8) * 0.25;
    feldLampe.intensity = 0.4 + seitenStaerke * 1.5 + Math.sin(zeit * 2.2) * 0.15;
  }

  // Selbstständige Animation über ein sichtbares Mesh.
  boden.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  const api = {
    get kraftfeldAktiv() {
      return kraftfeldAktiv;
    },
    get tuerOffen() {
      return tuerOffen;
    },
    get torOffnung() {
      return torOeffnung;
    },
    kraftfeldEinschalten() {
      kraftfeldAktiv = true;
    },
    kraftfeldAusschalten() {
      kraftfeldAktiv = false;
    },
    kraftfeldUmschalten() {
      kraftfeldAktiv = !kraftfeldAktiv;
    },
    tuereOeffnen() {
      tuerOffen = true;
    },
    tuereSchliessen() {
      tuerOffen = false;
    },
    tuereUmschalten() {
      tuerOffen = !tuerOffen;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'kraftfeld_an',
      label: 'Kraftfeld einschalten',
      run: () => api.kraftfeldEinschalten(),
    },
    {
      id: 'kraftfeld_aus',
      label: 'Kraftfeld ausschalten',
      run: () => api.kraftfeldAusschalten(),
    },
    {
      id: 'tuere_auf',
      label: 'Zellentür öffnen',
      run: () => api.tuereOeffnen(),
    },
    {
      id: 'tuere_zu',
      label: 'Zellentür schließen',
      run: () => api.tuereSchliessen(),
    },
  ];

  return root;
}

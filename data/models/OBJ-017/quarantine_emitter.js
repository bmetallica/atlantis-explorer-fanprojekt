// OBJ-017 — Quarantäne-Kraftfeldemitter
// Wandobjekt: Ursprung = Mitte der Unterkante der Rückseite (z = 0).
// Vorderseite zeigt nach +Z. 1 Einheit = 1 Meter.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'quarantine_emitter',
  art: 'Wandobjekt / Türrahmenmodul',
  masse: '1,90 × 2,85 × 0,62 (B × H × T, m)',
  wohin: 'ATL-011 — Isolationsraum, Kraftfeldschleuse',
  benutzen: 'INT_schalter → Menü zum Ein- und Ausschalten des Kraftfelds',
  lichter: 'LAMP_kraftfeld (dauerhaft eisblau), LAMP_bedienfeld (dauerhaft bernsteinfarben)',
  animation: 'Kraftfeld flimmert und flackert; Lichtfasern und Scanbänder laufen aufwärts; Emitterringe pulsieren; Schalter bewegt sich weich',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'quarantine_emitter';

  const matWand = kit('wallDark');
  const matPerl = kit('pillar');
  const matBronze = kit('copper');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');

  const panelMat = new THREE.MeshStandardMaterial({
    name: 'anthracite_panel',
    color: 0x172d3d,
    metalness: 0.82,
    roughness: 0.34,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    name: 'anthracite_recess',
    color: 0x07131c,
    metalness: 0.72,
    roughness: 0.42,
  });

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'quarantine_screen',
    color: 0x06131d,
    emissive: 0x216f8c,
    emissiveIntensity: 0.65,
    metalness: 0.25,
    roughness: 0.32,
  });

  const viewportMat = new THREE.MeshStandardMaterial({
    name: 'observation_glass',
    color: 0x123e55,
    emissive: 0x0d5675,
    emissiveIntensity: 0.42,
    metalness: 0.1,
    roughness: 0.18,
    transparent: true,
    opacity: 0.88,
  });

  // ------------------------------------------------------------
  // Hauptrahmen: geschlossene tragende Geometrie
  // ------------------------------------------------------------
  const rahmen = new THREE.Group();
  rahmen.name = 'Kraftfeldrahmen';
  root.add(rahmen);

  const seitenGeo = new THREE.BoxGeometry(0.30, 2.85, 0.38);
  const linkeSeite = new THREE.Mesh(seitenGeo, matWand);
  linkeSeite.position.set(-0.80, 1.425, 0.19);
  linkeSeite.castShadow = true;
  linkeSeite.receiveShadow = true;
  rahmen.add(linkeSeite);

  const rechteSeite = new THREE.Mesh(seitenGeo, matWand);
  rechteSeite.position.set(0.80, 1.425, 0.19);
  rechteSeite.castShadow = true;
  rechteSeite.receiveShadow = true;
  rahmen.add(rechteSeite);

  const oberrahmen = new THREE.Mesh(
    new THREE.BoxGeometry(1.90, 0.28, 0.40),
    matWand
  );
  oberrahmen.position.set(0, 2.71, 0.20);
  oberrahmen.castShadow = true;
  oberrahmen.receiveShadow = true;
  rahmen.add(oberrahmen);

  const kopfweste = new THREE.Mesh(
    new THREE.BoxGeometry(1.66, 0.17, 0.44),
    matPerl
  );
  kopfweste.position.set(0, 2.70, 0.215);
  kopfweste.castShadow = true;
  rahmen.add(kopfweste);

  const schwelle = new THREE.Mesh(
    new THREE.BoxGeometry(1.90, 0.16, 0.50),
    matWand
  );
  schwelle.position.set(0, 0.08, 0.25);
  schwelle.castShadow = true;
  schwelle.receiveShadow = true;
  rahmen.add(schwelle);

  const schwellenaufsatz = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.07, 0.43),
    matBronze
  );
  schwellenaufsatz.position.set(0, 0.195, 0.235);
  schwellenaufsatz.castShadow = true;
  rahmen.add(schwellenaufsatz);

  // Dunkle Innenkanäle hinter dem Kraftfeld.
  const kanalGeo = new THREE.BoxGeometry(0.07, 2.42, 0.10);
  for (const seite of [-1, 1]) {
    const kanal = new THREE.Mesh(kanalGeo, recessMat);
    kanal.position.set(seite * 0.642, 1.37, 0.285);
    rahmen.add(kanal);
  }

  const kanalOben = new THREE.Mesh(
    new THREE.BoxGeometry(1.31, 0.07, 0.10),
    recessMat
  );
  kanalOben.position.set(0, 2.585, 0.285);
  rahmen.add(kanalOben);

  // ------------------------------------------------------------
  // Panzerplatten und Einlagen
  // ------------------------------------------------------------
  const panzerGeo = new THREE.BoxGeometry(0.235, 0.48, 0.075);
  const panzer = new THREE.InstancedMesh(panzerGeo, matPerl, 6);
  panzer.name = 'Pfostenpanzer';
  panzer.castShadow = true;

  const einlageGeo = new THREE.BoxGeometry(0.145, 0.27, 0.018);
  const einlage = new THREE.InstancedMesh(einlageGeo, panelMat, 6);
  einlage.name = 'Pfosteneinlagen';

  const panzerMatrix = new THREE.Matrix4();
  const einlageMatrix = new THREE.Matrix4();

  const plattenpositionen = [
    [-1, 0.39],
    [-1, 0.98],
    [-1, 1.57],
    [-1, 2.16],
    [1, 0.39],
    [1, 2.16],
  ];

  plattenpositionen.forEach(([seite, y], index) => {
    panzerMatrix.makeTranslation(seite * 0.80, y, 0.415);
    panzer.setMatrixAt(index, panzerMatrix);

    einlageMatrix.makeTranslation(seite * 0.80, y, 0.458);
    einlage.setMatrixAt(index, einlageMatrix);
  });

  panzer.instanceMatrix.needsUpdate = true;
  einlage.instanceMatrix.needsUpdate = true;
  rahmen.add(panzer, einlage);

  // ------------------------------------------------------------
  // Bronze-Kanten, Kopfrillen und Warnzeichen
  // ------------------------------------------------------------
  const innenkanteGeo = new THREE.BoxGeometry(0.038, 2.42, 0.060);
  for (const seite of [-1, 1]) {
    const innenkante = new THREE.Mesh(innenkanteGeo, matBronze);
    innenkante.position.set(seite * 0.635, 1.37, 0.395);
    innenkante.castShadow = true;
    rahmen.add(innenkante);
  }

  const innenkanteOben = new THREE.Mesh(
    new THREE.BoxGeometry(1.31, 0.038, 0.060),
    matBronze
  );
  innenkanteOben.position.set(0, 2.595, 0.395);
  rahmen.add(innenkanteOben);

  const rippeGeo = new THREE.BoxGeometry(0.055, 0.13, 0.035);
  const rippen = new THREE.InstancedMesh(rippeGeo, matBronze, 7);
  rippen.name = 'Kopfrillen';
  const rippenMatrix = new THREE.Matrix4();
  for (let i = 0; i < 7; i++) {
    rippenMatrix.makeTranslation((i - 3) * 0.20, 2.70, 0.452);
    rippen.setMatrixAt(i, rippenMatrix);
  }
  rippen.instanceMatrix.needsUpdate = true;
  rahmen.add(rippen);

  const zierForm = new THREE.Shape();
  zierForm.moveTo(-0.14, -0.105);
  zierForm.lineTo(0.14, -0.105);
  zierForm.lineTo(0, 0.135);
  zierForm.closePath();

  const zierGeo = new THREE.ExtrudeGeometry(zierForm, {
    depth: 0.038,
    bevelEnabled: false,
  });
  const zier = new THREE.Mesh(zierGeo, matBronze);
  zier.position.set(0, 2.635, 0.455);
  zier.castShadow = true;
  rahmen.add(zier);

  const zierKern = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.047, 0),
    matGlow
  );
  zierKern.position.set(0, 2.625, 0.512);
  rahmen.add(zierKern);

  // ------------------------------------------------------------
  // Emitterknoten: Gehäuse, Spulen und leuchtende Kerne
  // ------------------------------------------------------------
  const emitterMaterialien = [];
  const spulenGeo = new THREE.TorusGeometry(0.082, 0.017, 6, 16);
  const kernGeo = new THREE.CylinderGeometry(0.043, 0.043, 0.075, 10);
  const gehaeuseGeo = new THREE.CylinderGeometry(0.066, 0.074, 0.045, 10);
  const lagerGeo = new THREE.CylinderGeometry(0.090, 0.090, 0.022, 12);

  for (const seite of [-1, 1]) {
    for (const y of [0.68, 1.57, 2.36]) {
      const sockel = new THREE.Mesh(gehaeuseGeo, matWand);
      sockel.position.set(seite * 0.635, y, 0.435);
      sockel.rotation.x = Math.PI / 2;
      sockel.castShadow = true;
      rahmen.add(sockel);

      const lager = new THREE.Mesh(lagerGeo, matBronze);
      lager.position.set(seite * 0.635, y, 0.462);
      lager.rotation.x = Math.PI / 2;
      rahmen.add(lager);

      const spulenMat = new THREE.MeshStandardMaterial({
        name: 'emitter_coil',
        color: 0xa66b2d,
        emissive: 0x6fe3ff,
        emissiveIntensity: 0.15,
        metalness: 0.88,
        roughness: 0.24,
      });
      const spule = new THREE.Mesh(spulenGeo, spulenMat);
      spule.position.set(seite * 0.635, y, 0.484);
      rahmen.add(spule);

      const kernMat = new THREE.MeshStandardMaterial({
        name: 'emitter_core',
        color: 0x8adfff,
        emissive: 0x6fe3ff,
        emissiveIntensity: 1.1,
        metalness: 0.1,
        roughness: 0.18,
      });
      const kern = new THREE.Mesh(kernGeo, kernMat);
      kern.position.set(seite * 0.635, y, 0.484);
      kern.rotation.x = Math.PI / 2;
      rahmen.add(kern);

      emitterMaterialien.push({ spule: spulenMat, kern: kernMat, offset: y + seite });
    }
  }

  // ------------------------------------------------------------
  // Beobachtungsfenster im rechten Pfosten
  // ------------------------------------------------------------
  const fensterRahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.215, 0.43, 0.040),
    matBronze
  );
  fensterRahmen.position.set(0.80, 1.77, 0.405);
  fensterRahmen.castShadow = true;
  rahmen.add(fensterRahmen);

  const fensterAusschnitt = new THREE.Mesh(
    new THREE.BoxGeometry(0.174, 0.385, 0.018),
    recessMat
  );
  fensterAusschnitt.position.set(0.80, 1.77, 0.432);
  rahmen.add(fensterAusschnitt);

  const fensterGlas = new THREE.Mesh(
    new THREE.BoxGeometry(0.145, 0.345, 0.020),
    viewportMat
  );
  fensterGlas.position.set(0.80, 1.77, 0.447);
  rahmen.add(fensterGlas);

  const fensterSchimmer = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.285, 0.008),
    matGlow
  );
  fensterSchimmer.position.set(0.80, 1.77, 0.462);
  fensterSchimmer.scale.set(0.35, 1, 1);
  rahmen.add(fensterSchimmer);

  const schraubenGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 8);
  const schrauben = new THREE.InstancedMesh(schraubenGeo, matRail, 4);
  const schraubenMatrix = new THREE.Matrix4();
  const schraubenPositionen = [
    [-0.073, 1.612],
    [0.073, 1.612],
    [-0.073, 1.928],
    [0.073, 1.928],
  ];
  schraubenPositionen.forEach(([dx, y], index) => {
    schraubenMatrix.makeTranslation(0.80 + dx, y, 0.461);
    schrauben.setMatrixAt(index, schraubenMatrix);
  });
  schrauben.instanceMatrix.needsUpdate = true;
  rahmen.add(schrauben);

  // ------------------------------------------------------------
  // Statusmarkierungen auf der Schwelle
  // ------------------------------------------------------------
  const statusGeo = new THREE.BoxGeometry(0.17, 0.024, 0.032);
  const statusMarken = new THREE.InstancedMesh(statusGeo, matAmber, 5);
  statusMarken.name = 'Quarantaenestatus';
  const statusMatrix = new THREE.Matrix4();
  for (let i = 0; i < 5; i++) {
    statusMatrix.makeTranslation((i - 2) * 0.26, 0.225, 0.468);
    statusMarken.setMatrixAt(i, statusMatrix);
  }
  statusMarken.instanceMatrix.needsUpdate = true;
  rahmen.add(statusMarken);

  // ------------------------------------------------------------
  // Kabel und Anschlussgehäuse am linken Pfosten
  // ------------------------------------------------------------
  const kastenGeo = new THREE.BoxGeometry(0.23, 0.31, 0.14);
  const anschlussLinks = new THREE.Mesh(kastenGeo, matWand);
  anschlussLinks.position.set(-0.80, 0.29, 0.475);
  anschlussLinks.castShadow = true;
  rahmen.add(anschlussLinks);

  const anschlussRechts = new THREE.Mesh(kastenGeo, matWand);
  anschlussRechts.position.set(0.80, 0.29, 0.475);
  anschlussRechts.castShadow = true;
  rahmen.add(anschlussRechts);

  const kabelPunkte = [
    new THREE.Vector3(-0.80, 0.28, 0.50),
    new THREE.Vector3(-0.90, 0.16, 0.48),
    new THREE.Vector3(-0.92, 0.055, 0.35),
    new THREE.Vector3(-0.78, 0.045, 0.20),
  ];
  const kabelLinks = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(kabelPunkte),
      24,
      0.022,
      6,
      false
    ),
    matRail
  );
  kabelLinks.castShadow = true;
  rahmen.add(kabelLinks);

  const kabelRechtsPunkte = [
    new THREE.Vector3(0.80, 0.28, 0.50),
    new THREE.Vector3(0.90, 0.16, 0.48),
    new THREE.Vector3(0.92, 0.055, 0.35),
    new THREE.Vector3(0.78, 0.045, 0.20),
  ];
  const kabelRechts = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(kabelRechtsPunkte),
      24,
      0.022,
      6,
      false
    ),
    matRail
  );
  kabelRechts.castShadow = true;
  rahmen.add(kabelRechts);

  // ------------------------------------------------------------
  // Kraftfeld: geschlossene, halbtransparente Volumenfläche
  // ------------------------------------------------------------
  const feldMaterial = new THREE.MeshStandardMaterial({
    name: 'kraftfeld',
    color: 0x168fc4,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const kraftfeld = new THREE.Mesh(
    new THREE.BoxGeometry(1.27, 2.34, 0.020),
    feldMaterial
  );
  kraftfeld.name = 'KraftfeldFlaeche';
  kraftfeld.position.set(0, 1.38, 0.245);
  root.add(kraftfeld);

  // Flimmernde vertikale Lichtfasern.
  const faserMaterialien = [];
  const faserGeo = new THREE.BoxGeometry(0.008, 2.30, 0.012);
  for (let i = 0; i < 11; i++) {
    const material = new THREE.MeshBasicMaterial({
      name: `kraftfaser_${i}`,
      color: 0x9cecff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const faser = new THREE.Mesh(faserGeo, material);
    faser.position.set(-0.52 + i * 0.104, 1.38, 0.267);
    root.add(faser);
    faserMaterialien.push({ material, offset: i * 1.37 });
  }

  // Aufwärts laufende Scanbänder.
  const scanMaterialien = [];
  const scanGeo = new THREE.BoxGeometry(1.24, 0.024, 0.014);
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshBasicMaterial({
      name: `scanband_${i}`,
      color: 0xbaf4ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const band = new THREE.Mesh(scanGeo, material);
    band.position.set(0, 0.30 + i * 0.48, 0.274);
    root.add(band);
    scanMaterialien.push({ mesh: band, material, offset: i / 5 });
  }

  // Kontaktlinie des Feldes auf der Schwelle.
  const kontaktMaterial = new THREE.MeshBasicMaterial({
    name: 'kraftfeldkontakt',
    color: 0x8beaff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const kontaktlinie = new THREE.Mesh(
    new THREE.BoxGeometry(1.27, 0.018, 0.035),
    kontaktMaterial
  );
  kontaktlinie.position.set(0, 0.235, 0.276);
  root.add(kontaktlinie);

  // ------------------------------------------------------------
  // Bedienfeld mit Monitor und mechanischem Schalter
  // ------------------------------------------------------------
  const bedienfeld = new THREE.Mesh(
    new THREE.BoxGeometry(0.225, 0.48, 0.09),
    matWand
  );
  bedienfeld.position.set(0.80, 1.05, 0.425);
  bedienfeld.castShadow = true;
  root.add(bedienfeld);

  const blende = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.39, 0.022),
    matRail
  );
  blende.position.set(0.80, 1.05, 0.482);
  root.add(blende);

  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.132, 0.115, 0.014),
    screenMat
  );
  monitor.position.set(0.80, 1.165, 0.500);
  root.add(monitor);

  const monitorBalkenGeo = new THREE.BoxGeometry(0.018, 0.050, 0.008);
  const monitorBalken = new THREE.InstancedMesh(monitorBalkenGeo, matAmber, 3);
  const balkenMatrix = new THREE.Matrix4();
  for (let i = 0; i < 3; i++) {
    balkenMatrix.makeTranslation(
      0.765 + i * 0.035,
      1.152 + i * 0.012,
      0.512
    );
    monitorBalken.setMatrixAt(i, balkenMatrix);
  }
  monitorBalken.instanceMatrix.needsUpdate = true;
  root.add(monitorBalken);

  const schalterGelenk = new THREE.Group();
  schalterGelenk.name = 'SchalterGelenk';
  schalterGelenk.position.set(0.80, 0.985, 0.500);
  root.add(schalterGelenk);

  const schalterHebel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.020, 0.028, 0.115, 10),
    matBronze
  );
  schalterHebel.rotation.x = Math.PI / 2;
  schalterHebel.position.z = 0.047;
  schalterGelenk.add(schalterHebel);

  const schalterKopfMat = new THREE.MeshStandardMaterial({
    name: 'switch_indicator',
    color: 0x8adfff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.0,
    metalness: 0.12,
    roughness: 0.22,
  });
  const schalterKopf = new THREE.Mesh(
    new THREE.SphereGeometry(0.033, 12, 8),
    schalterKopfMat
  );
  schalterKopf.position.z = 0.103;
  schalterGelenk.add(schalterKopf);

  const schalterText = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.030, 0.010),
    matAmber
  );
  schalterText.position.set(0.80, 0.908, 0.500);
  root.add(schalterText);

  // ------------------------------------------------------------
  // Kollision: nur feste Rahmenteile, niemals Feld oder Schalter
  // ------------------------------------------------------------
  const colLinks = new THREE.Mesh(new THREE.BoxGeometry(0.30, 2.85, 0.38));
  colLinks.name = 'COL_linker_pfosten';
  colLinks.position.copy(linkeSeite.position);
  colLinks.visible = false;
  root.add(colLinks);

  const colRechts = new THREE.Mesh(new THREE.BoxGeometry(0.30, 2.85, 0.38));
  colRechts.name = 'COL_rechter_pfosten';
  colRechts.position.copy(rechteSeite.position);
  colRechts.visible = false;
  root.add(colRechts);

  const colOben = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.28, 0.40));
  colOben.name = 'COL_oberrahmen';
  colOben.position.copy(oberrahmen.position);
  colOben.visible = false;
  root.add(colOben);

  const colSchwelle = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.16, 0.50));
  colSchwelle.name = 'COL_schwelle';
  colSchwelle.position.copy(schwelle.position);
  colSchwelle.visible = false;
  root.add(colSchwelle);

  // ------------------------------------------------------------
  // Benutzen-Punkte und dauerhaft eingeschaltete Lichter
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_schalter';
  use.position.set(0.78, 1.08, 0.72);
  use.userData = {
    label: 'Quarantäne-Kraftfeld schalten',
    radius: 0.8,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_kraftfeld';
  lamp.position.set(0, 1.48, 0.50);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  root.add(lamp);

  const bedienLamp = new THREE.Object3D();
  bedienLamp.name = 'LAMP_bedienfeld';
  bedienLamp.position.set(0.80, 1.15, 0.54);
  bedienLamp.userData = {
    color: '#ffb85c',
    intensity: 2,
    distance: 1.8,
  };
  root.add(bedienLamp);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let feldAktiv = opts.startActive !== false;
  let feldstaerke = feldAktiv ? 1 : 0;
  let zeit = 0;
  let letzte = null;

  const update = (dt) => {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    const zielstaerke = feldAktiv ? 1 : 0;
    feldstaerke +=
      (zielstaerke - feldstaerke) * Math.min(1, step * 4.5);

    const flimmern =
      0.90 +
      0.06 * Math.sin(zeit * 15.7) +
      0.04 * Math.sin(zeit * 29.3 + 1.2);

    kraftfeld.visible = feldstaerke > 0.012;
    kraftfeld.scale.x = 1 + Math.sin(zeit * 6.1) * 0.003 * feldstaerke;
    kraftfeld.scale.y = 1 + Math.sin(zeit * 4.7 + 0.8) * 0.002 * feldstaerke;

    feldMaterial.opacity = 0.18 * feldstaerke * flimmern;
    feldMaterial.emissiveIntensity =
      0.10 + 1.25 * feldstaerke * flimmern;

    faserMaterialien.forEach(({ material, offset }) => {
      material.opacity =
        feldstaerke *
        (0.07 + 0.11 * Math.max(0, Math.sin(zeit * 3.1 + offset)));
    });

    for (const eintrag of scanMaterialien) {
      const lauf = (zeit * 0.28 + eintrag.offset) % 1;
      eintrag.mesh.position.y = 0.25 + lauf * 2.25;
      eintrag.material.opacity =
        feldstaerke * 0.26 * (0.55 + 0.45 * Math.sin(lauf * Math.PI));
    }

    kontaktMaterial.opacity =
      feldstaerke * (0.42 + 0.16 * Math.sin(zeit * 6.4));

    emitterMaterialien.forEach(({ spule, kern, offset }) => {
      const puls = 0.5 + 0.5 * Math.sin(zeit * 4.2 - offset);
      spule.emissiveIntensity =
        0.08 + feldstaerke * (0.48 + 0.38 * puls);
      kern.emissiveIntensity =
        0.18 + feldstaerke * (0.85 + 0.55 * puls);
    });

    screenMat.emissiveIntensity = feldAktiv
      ? 0.62 + 0.14 * Math.sin(zeit * 3.2)
      : 0.10;

    viewportMat.emissiveIntensity = feldAktiv
      ? 0.42 + 0.12 * Math.sin(zeit * 2.3)
      : 0.18;

    schalterKopfMat.emissive.setHex(feldAktiv ? 0x6fe3ff : 0xffb85c);
    schalterKopfMat.emissiveIntensity = feldAktiv
      ? 1.0 + 0.35 * Math.sin(zeit * 4.8)
      : 0.45;

    const zielwinkel = feldAktiv ? -0.58 : 0.58;
    schalterGelenk.rotation.x +=
      (zielwinkel - schalterGelenk.rotation.x) * Math.min(1, step * 8);
  };

  // Der stets sichtbare Oberrahmen treibt die Animation auch dann,
  // wenn das Kraftfeld selbst bereits ausgeblendet ist.
  oberrahmen.onBeforeRender = () => {
    const jetzt = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(jetzt - letzte, 0.1));
    }
    letzte = jetzt;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------
  const api = {
    feldEinschalten() {
      feldAktiv = true;
    },
    feldAusschalten() {
      feldAktiv = false;
    },
    feldUmschalten() {
      feldAktiv = !feldAktiv;
    },
    get feldAktiv() {
      return feldAktiv;
    },
    get feldstaerke() {
      return feldstaerke;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'kraftfeld_ein',
      label: 'Quarantäne-Kraftfeld aktivieren',
      run: () => api.feldEinschalten(),
    },
    {
      id: 'kraftfeld_aus',
      label: 'Quarantäne-Kraftfeld deaktivieren',
      run: () => api.feldAusschalten(),
    },
    {
      id: 'kraftfeld_umschalten',
      label: 'Quarantäne-Kraftfeld umschalten',
      run: () => api.feldUmschalten(),
    },
  ];

  return root;
}

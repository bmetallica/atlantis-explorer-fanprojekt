// FN P90 Personal Defense Weapon – liegend auf der rechten Seite.
// Lokales X = Waffenlänge (Mündung bei +X), lokales Y = Waffenprofil,
// lokales Z = Waffenbreite (Dicke). Die Waffengruppe wird so ausgerichtet,
// dass die Seitenansicht der Waffe nach +Y zeigt, die Länge entlang Z liegt
// und die Mündung nach +Z weist. Ursprung: Mitte der Unterseite.
import * as THREE from 'three';

export const steckbrief = {
  name: 'p90',
  art: 'Waffe / Standobjekt',
  masse: '0,50 × 0,20 × 0,055 m (Länge × Profilhöhe × Dicke); ca. 2,6 kg',
  wohin: 'ATL-001 (Gate-Raum / Stargate-Bereitschaft), ATL-030 (Waffenkammer / Armory)',
  benutzen: 'INT_waffe → Menü mit Waffeninformationen, Taktiklampe und Magazinzustand',
  lichter: 'LAMP_taktiklampe (warmweiß, abschaltbar)',
  animation: 'Taktiklampe und Reflexglas blenden weich ein und aus',
  quelle: 'selbst gebaut nach FN P90',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'p90';

  const weapon = new THREE.Group();
  weapon.name = 'p90_bauteile';
  weapon.matrixAutoUpdate = false;

  // Lokal: X = Länge, Y = Profilhöhe, Z = Dicke.
  // Welt:  X = Profilhöhe, Y = Dicke, Z = Länge (Mündung bei +Z).
  const basis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0)
  );
  weapon.matrix
    .copy(basis)
    .multiply(new THREE.Matrix4().makeTranslation(-0.25, -0.0975, 0.0275));
  weapon.matrixWorldNeedsUpdate = true;
  root.add(weapon);

  const matPolymer = new THREE.MeshStandardMaterial({
    name: 'p90_polymer',
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.03,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    name: 'p90_schwarz',
    color: 0x0b0c0d,
    roughness: 0.62,
    metalness: 0.12,
  });
  const matMetal = new THREE.MeshStandardMaterial({
    name: 'p90_metall',
    color: 0x303438,
    roughness: 0.34,
    metalness: 0.86,
  });
  const matSteel = new THREE.MeshStandardMaterial({
    name: 'p90_stahl',
    color: 0x8a9296,
    roughness: 0.22,
    metalness: 0.95,
  });
  const matBrass = new THREE.MeshStandardMaterial({
    name: 'p90_messing',
    color: 0xb98b3b,
    roughness: 0.28,
    metalness: 0.9,
  });
  const matCopper = new THREE.MeshStandardMaterial({
    name: 'p90_kupfer',
    color: 0x9c5b2a,
    roughness: 0.32,
    metalness: 0.9,
  });
  const matMagazine = new THREE.MeshStandardMaterial({
    name: 'p90_magazin_glas',
    color: 0x73787c,
    roughness: 0.17,
    metalness: 0.06,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const matSight = new THREE.MeshStandardMaterial({
    name: 'p90_reflexglas',
    color: 0x102b34,
    emissive: 0x55b7d5,
    emissiveIntensity: 0.38,
    roughness: 0.09,
    metalness: 0.3,
  });
  const matLamp = new THREE.MeshStandardMaterial({
    name: 'p90_taktiklampe',
    color: 0xffefd0,
    emissive: 0xffd58a,
    emissiveIntensity: 1.8,
    roughness: 0.16,
    metalness: 0.04,
  });

  function boxLocal(w, h, d, material, x, y, z, name = '') {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    weapon.add(mesh);
    return mesh;
  }

  function cylinderX(radius, length, material, x, y, z, segments = 16, name = '') {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
    geometry.rotateZ(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    weapon.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------------
  // Durchgehendes Seitenprofil (Bullpup) als eine Shape.
  // Hinten: abgerundeter Schaft. Mitte: geschlossener Pistolengriff mit
  // großem Daumenloch und ovalem Durchbruch des Triggerbügels.
  // Vorne: kurzer Lauf, flacher Fingerstützbereich.
  // ------------------------------------------------------------------
  const profile = new THREE.Shape();

  // Rückseite / Schaft
  profile.moveTo(0.005, 0.075);
  profile.lineTo(0.0, 0.1);
  profile.quadraticCurveTo(0.008, 0.132, 0.07, 0.148);
  // Oberseite bis zur Mündung
  profile.lineTo(0.4, 0.15);
  profile.quadraticCurveTo(0.445, 0.148, 0.47, 0.122);
  // Stirnseite
  profile.lineTo(0.47, 0.096);
  profile.quadraticCurveTo(0.462, 0.083, 0.44, 0.081);
  // Untere Kante vorne / Fingerstützung
  profile.lineTo(0.3, 0.078);
  profile.quadraticCurveTo(0.284, 0.076, 0.276, 0.066);
  // Vorderer Abzugsbügelholm
  profile.quadraticCurveTo(0.272, 0.04, 0.256, 0.022);
  // Untere Kante des Abzugsbügels
  profile.quadraticCurveTo(0.21, 0.014, 0.155, 0.016);
  // Hinterer Abzugsbügelholm
  profile.quadraticCurveTo(0.128, 0.02, 0.122, 0.07);
  // Pistolengriff
  profile.quadraticCurveTo(0.116, 0.052, 0.098, 0.008);
  profile.quadraticCurveTo(0.08, -0.002, 0.052, 0.0);
  profile.quadraticCurveTo(0.022, 0.006, 0.009, 0.04);
  profile.closePath();

  // Großes ovales Daumenloch im hinteren Griffbereich.
  const thumbHole = new THREE.Path();
  thumbHole.absellipse(0.075, 0.062, 0.026, 0.021, 0, Math.PI * 2, false, 0);
  profile.holes.push(thumbHole);

  // Ovaler Durchbruch des Triggerbügels.
  const triggerGuardHole = new THREE.Path();
  triggerGuardHole.absellipse(0.199, 0.047, 0.052, 0.026, 0, Math.PI * 2, false, 0);
  profile.holes.push(triggerGuardHole);

  const bodyGeometry = new THREE.ExtrudeGeometry(profile, {
    depth: 0.055,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.001,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 14,
  });

  // Fase exakt um die lokale Z-Mitte legen.
  bodyGeometry.computeBoundingBox();
  const bodyZ =
    (bodyGeometry.boundingBox.min.z + bodyGeometry.boundingBox.max.z) / 2;
  bodyGeometry.translate(0, 0, -bodyZ);
  bodyGeometry.computeBoundingBox();
  const halfDepth = bodyGeometry.boundingBox.max.z; // ca. 0.0288

  const body = new THREE.Mesh(bodyGeometry, matPolymer);
  body.name = 'p90_gehaeuse';
  weapon.add(body);

  const sideZ = halfDepth + 0.0012;

  // Abzug im hinteren Teil des Triggerbügels.
  boxLocal(0.008, 0.024, 0.014, matSteel, 0.163, 0.046, 0, 'p90_abzug');

  // Seitliche Wartungsplatte, Auswurfdeckel und Ladehebel.
  boxLocal(0.062, 0.026, 0.0025, matBlack, 0.165, 0.132, sideZ, 'p90_wartungsplatte');
  boxLocal(0.036, 0.017, 0.0025, matBlack, 0.112, 0.118, sideZ, 'p90_auswurfdeckel');
  boxLocal(0.03, 0.009, 0.006, matSteel, 0.262, 0.142, sideZ, 'p90_ladehebel');

  // Feine Griffrippen am hinteren Polymergriff.
  for (let i = 0; i < 5; i++) {
    boxLocal(
      0.0035,
      0.026,
      0.0025,
      matBlack,
      0.043 + i * 0.007,
      0.035,
      sideZ,
      `p90_griprippe_${i}`
    );
  }

  // Schrauben als InstancedMesh.
  const screwGeometry = new THREE.CylinderGeometry(0.0026, 0.0026, 0.0016, 8);
  screwGeometry.rotateX(Math.PI / 2);
  const screws = new THREE.InstancedMesh(screwGeometry, matSteel, 10);
  const screwDummy = new THREE.Object3D();
  const screwPositions = [
    [0.022, 0.126],
    [0.088, 0.14],
    [0.03, 0.086],
    [0.11, 0.086],
    [0.158, 0.128],
    [0.34, 0.138],
    [0.43, 0.13],
    [0.286, 0.072],
    [0.132, 0.068],
    [0.072, 0.058],
  ];
  screwPositions.forEach(([x, y], index) => {
    screwDummy.position.set(x, y, sideZ + 0.0008);
    screwDummy.updateMatrix();
    screws.setMatrixAt(index, screwDummy.matrix);
  });
  screws.instanceMatrix.needsUpdate = true;
  screws.name = 'p90_schrauben';
  weapon.add(screws);

  // ------------------------------------------------------------------
  // Oberes, durchsichtiges 50-Schuss-Magazin (0,30 × 0,035 × 0,05 m).
  // ------------------------------------------------------------------
  const magazine = boxLocal(
    0.3,
    0.035,
    0.05,
    matMagazine,
    0.255,
    0.1675,
    0,
    'p90_magazin'
  );
  magazine.renderOrder = 2;

  boxLocal(0.304, 0.006, 0.052, matBlack, 0.255, 0.1495, 0, 'p90_magazinschiene');
  boxLocal(0.007, 0.037, 0.052, matBlack, 0.103, 0.1675, 0, 'p90_magazinendkappe_hinten');
  boxLocal(0.007, 0.037, 0.052, matBlack, 0.407, 0.1675, 0, 'p90_magazinendkappe_vorne');

  // Sichtbare Patronen: 4 Lagen (2 × 2) × 10 Plätze = 40 sichtbare Patronen.
  const roundGeometry = new THREE.CylinderGeometry(0.0036, 0.0036, 0.017, 7);
  roundGeometry.rotateZ(-Math.PI / 2);
  const rounds = new THREE.InstancedMesh(roundGeometry, matBrass, 40);
  const roundDummy = new THREE.Object3D();
  let roundIndex = 0;

  for (let rowY = 0; rowY < 2; rowY++) {
    for (let rowZ = 0; rowZ < 2; rowZ++) {
      for (let slot = 0; slot < 10; slot++) {
        roundDummy.position.set(
          0.125 + slot * 0.03,
          0.159 + rowY * 0.012,
          -0.012 + rowZ * 0.024
        );
        roundDummy.updateMatrix();
        rounds.setMatrixAt(roundIndex, roundDummy.matrix);
        roundIndex++;
      }
    }
  }
  rounds.instanceMatrix.needsUpdate = true;
  rounds.name = 'p90_patronen';
  weapon.add(rounds);

  // Kleine Messingtüten (Zünder) vorn an den Patronen.
  const tipGeometry = new THREE.CylinderGeometry(0.0037, 0.0037, 0.004, 7);
  tipGeometry.rotateZ(-Math.PI / 2);
  const tips = new THREE.InstancedMesh(tipGeometry, matCopper, 40);
  const tipDummy = new THREE.Object3D();
  let tipIndex = 0;
  for (let rowY = 0; rowY < 2; rowY++) {
    for (let rowZ = 0; rowZ < 2; rowZ++) {
      for (let slot = 0; slot < 10; slot++) {
        tipDummy.position.set(
          0.1335 + slot * 0.03,
          0.159 + rowY * 0.012,
          -0.012 + rowZ * 0.024
        );
        tipDummy.updateMatrix();
        tips.setMatrixAt(tipIndex, tipDummy.matrix);
        tipIndex++;
      }
    }
  }
  tips.instanceMatrix.needsUpdate = true;
  tips.name = 'p90_zuender';
  weapon.add(tips);

  // ------------------------------------------------------------------
  // Kurzer Lauf mit Mündungsbremse, Gesamtlänge bis X = 0,50 m.
  // ------------------------------------------------------------------
  cylinderX(0.0095, 0.05, matMetal, 0.472, 0.104, 0, 16, 'p90_lauf');
  cylinderX(0.011, 0.016, matBlack, 0.492, 0.104, 0, 16, 'p90_muendungsbremse');
  cylinderX(0.0048, 0.0018, matBlack, 0.5005, 0.104, 0, 12, 'p90_laufbohrung');

  // Kleines Reflexvisier vor dem Magazin.
  boxLocal(0.05, 0.026, 0.032, matBlack, 0.432, 0.155, 0, 'p90_reflexvisier');
  boxLocal(0.038, 0.016, 0.0025, matSight, 0.432, 0.157, 0.0168, 'p90_reflexglas');
  boxLocal(0.0025, 0.017, 0.026, matSight, 0.4068, 0.157, 0, 'p90_reflexglas_hinten');
  boxLocal(0.018, 0.004, 0.034, matSteel, 0.418, 0.1415, 0, 'p90_visiersteg');

  // Gurtclip an der hinteren rechten Seite (ohne Gurt).
  boxLocal(0.024, 0.008, 0.004, matMetal, 0.038, 0.112, sideZ, 'p90_gurtclip');

  // Taktiklampe unter dem Lauf mit sichtbarer Halteschelle.
  boxLocal(0.02, 0.017, 0.026, matMetal, 0.438, 0.079, 0, 'p90_lampenhalter');
  cylinderX(0.0085, 0.047, matBlack, 0.442, 0.07, 0, 14, 'p90_taktiklampe');
  cylinderX(0.0095, 0.005, matMetal, 0.466, 0.07, 0, 14, 'p90_lampenfassung');

  const lampLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0082, 0.0082, 0.0025, 14),
    matLamp
  );
  lampLens.rotation.z = -Math.PI / 2;
  lampLens.position.set(0.468, 0.07, 0);
  lampLens.name = 'p90_taktiklampenlinse';
  weapon.add(lampLens);

  const spot = new THREE.SpotLight(0xffe1aa, 4, 3.5, 0.24, 0.58, 1.2);
  spot.name = 'LAMP_taktiklampe';
  spot.position.set(0.47, 0.07, 0);
  spot.target.position.set(0.72, 0.07, 0);
  spot.userData = {
    label: 'Taktiklampe',
    color: '#ffe1aa',
    intensity: 4,
    distance: 3.5,
  };
  weapon.add(spot, spot.target);

  // Statischer Kollisionskörper in Weltkoordinaten.
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.062, 0.5));
  col.name = 'COL_p90';
  col.position.set(0, 0.031, 0);
  col.userData.aktiv = true;
  root.add(col);

  // Benutzen-Punkt vor der Waffe in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_waffe';
  use.position.set(0, 0.28, 0.36);
  use.userData = {
    label: 'FN P90 prüfen',
    radius: 0.55,
  };
  root.add(use);

  let tacticalOn = true;
  let magazineFull = true;
  let lampLevel = 1;
  let sightLevel = 1;
  let lastTime = null;

  function update(dt) {
    const lampTarget = tacticalOn ? 1 : 0;
    lampLevel += (lampTarget - lampLevel) * Math.min(1, dt * 8);

    spot.intensity = 4 * lampLevel;
    spot.userData.intensity = spot.intensity;
    matLamp.emissiveIntensity = 0.05 + 1.8 * lampLevel;

    const sightTarget = tacticalOn ? 1 : 0.4;
    sightLevel += (sightTarget - sightLevel) * Math.min(1, dt * 6);
    matSight.emissiveIntensity =
      0.18 + sightLevel * 0.2 + Math.sin(performance.now() * 0.0018) * 0.03;
  }

  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) update(Math.min(now - lastTime, 0.1));
    lastTime = now;
  };
  root.userData.update = update;

  const api = {
    taktiklampeEin() {
      tacticalOn = true;
    },
    taktiklampeAus() {
      tacticalOn = false;
    },
    taktiklampeUmschalten() {
      tacticalOn = !tacticalOn;
    },
    magazinLeer() {
      magazineFull = false;
      rounds.visible = false;
      tips.visible = false;
    },
    magazinVollFuellen() {
      magazineFull = true;
      rounds.visible = true;
      tips.visible = true;
    },
    get taktiklampe() {
      return tacticalOn;
    },
    get magazinVoll() {
      return magazineFull;
    },
  };
  root.userData.api = api;

  root.userData.actions = [
    {
      id: 'taktiklampe_ein',
      label: 'Taktiklampe einschalten',
      run: () => api.taktiklampeEin(),
    },
    {
      id: 'taktiklampe_aus',
      label: 'Taktiklampe ausschalten',
      run: () => api.taktiklampeAus(),
    },
    {
      id: 'taktiklampe_um',
      label: 'Taktiklampe umschalten',
      run: () => api.taktiklampeUmschalten(),
    },
    {
      id: 'magazin_leer',
      label: 'Magazin als leer markieren',
      run: () => api.magazinLeer(),
    },
    {
      id: 'magazin_voll',
      label: 'Magazin als voll markieren',
      run: () => api.magazinVollFuellen(),
    },
  ];

  return root;
}

// wraith_handblaster.js
// Wraith-Handblaster – organisch geschwungene Betäubungswaffe.
// Ursprung: Mitte der Unterseite, Laufrichtung nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'wraith_handblaster',
  art: 'Kleinobjekt / Betäubungswaffe',
  masse: '0,11 × 0,12 × 0,27 (B × H × T, m)',
  wohin: 'ATL-030 (Waffenkammer / Armory), ATL-031 (Zellen / Arrest (Brig))',
  benutzen: 'INT_bedienen → Energiezelle laden, entladen und Betäubungsimpuls auslösen',
  lichter: 'LAMP_energie (bernsteinfarben), LAMP_mundung (kurzer bernsteinfarbener Impuls)',
  animation: 'Energiefenster pulsiert; beim Feuern kurzer heller Impuls mit sanftem Nachglimmen',
  quelle: 'selbst gebaut nach OBJ-060-Beschreibung und Referenzbildern',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'wraith_handblaster';

  // Eigene Materialien pro Instanz, damit die Leuchtanimation unabhängig bleibt.
  const matPearl = new THREE.MeshStandardMaterial({
    name: 'wraith_perlmutt',
    color: 0xb9b7aa,
    metalness: 0.7,
    roughness: 0.32,
  });

  const matBlue = new THREE.MeshStandardMaterial({
    name: 'wraith_stahlblau',
    color: 0x193b68,
    metalness: 0.58,
    roughness: 0.31,
  });

  const matDark = new THREE.MeshStandardMaterial({
    name: 'wraith_dunkelblau',
    color: 0x081a2c,
    metalness: 0.48,
    roughness: 0.38,
  });

  const matBronze = new THREE.MeshStandardMaterial({
    name: 'wraith_bronze',
    color: 0x80603c,
    metalness: 0.8,
    roughness: 0.3,
  });

  const matEnergy = new THREE.MeshStandardMaterial({
    name: 'wraith_energiezelle',
    color: 0xffb329,
    emissive: 0xff8b08,
    emissiveIntensity: 0.25,
    metalness: 0.18,
    roughness: 0.23,
  });

  const matMuzzle = new THREE.MeshStandardMaterial({
    name: 'wraith_mundungsimpuls',
    color: 0xffd46b,
    emissive: 0xffb52c,
    emissiveIntensity: 0.03,
    metalness: 0.08,
    roughness: 0.18,
  });

  // Das Modell wird direkt liegend aufgebaut: Lauf nach +Z, Griff nach -Z.
  const model = new THREE.Group();
  model.name = 'wraith_handblaster_modell';
  root.add(model);

  const add = (geometry, material, position, scale = null, name = '') => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    if (scale) mesh.scale.copy(scale);
    if (name) mesh.name = name;
    model.add(mesh);
    return mesh;
  };

  // --- Hauptkörper: aufgetriebene, perlmuttfarbene Waffenhülle
  const body = add(
    new THREE.SphereGeometry(1, 16, 10),
    matPearl,
    new THREE.Vector3(0, 0.038, 0.015),
    new THREE.Vector3(0.047, 0.029, 0.07),
    'koerper'
  );

  add(
    new THREE.SphereGeometry(1, 12, 8),
    matPearl,
    new THREE.Vector3(0, 0.064, -0.006),
    new THREE.Vector3(0.043, 0.018, 0.055),
    'oberer_ruecken'
  );

  // Stahlblaue, flache Verkleidung unter dem Energiefenster.
  add(
    new THREE.SphereGeometry(1, 12, 8),
    matBlue,
    new THREE.Vector3(0, 0.031, 0.017),
    new THREE.Vector3(0.048, 0.014, 0.061),
    'blaue_verkleidung'
  );

  // --- Fischkopfartiger Lauf
  const snout = add(
    new THREE.SphereGeometry(1, 16, 10),
    matPearl,
    new THREE.Vector3(0, 0.048, 0.092),
    new THREE.Vector3(0.039, 0.028, 0.045),
    'fischkopf'
  );

  add(
    new THREE.SphereGeometry(1, 12, 8),
    matPearl,
    new THREE.Vector3(0, 0.045, 0.132),
    new THREE.Vector3(0.027, 0.019, 0.016),
    'laufspitze'
  );

  // Bronzering zwischen Rumpf und Fischkopf.
  add(
    new THREE.TorusGeometry(0.037, 0.005, 6, 18),
    matBronze,
    new THREE.Vector3(0, 0.049, 0.066),
    null,
    'lauftring'
  );

  // Kleine, dunkle seitliche Mundspalte als geschlossenes aufgesetztes Detail.
  for (const side of [-1, 1]) {
    add(
      new THREE.BoxGeometry(0.0035, 0.01, 0.035),
      matDark,
      new THREE.Vector3(side * 0.037, 0.045, 0.112),
      null,
      'mundspalte'
    );
  }

  // Augenpunkte mit kleinem bernsteinfarbenem Glanz.
  for (const side of [-1, 1]) {
    add(
      new THREE.SphereGeometry(0.0085, 8, 6),
      matDark,
      new THREE.Vector3(side * 0.035, 0.063, 0.12),
      null,
      'laufauge'
    );
    add(
      new THREE.SphereGeometry(0.0037, 8, 5),
      matEnergy,
      new THREE.Vector3(side * 0.039, 0.065, 0.121),
      null,
      'laufauge_glanz'
    );
  }

  // --- Seitliche Kiemenrippen als InstancedMesh
  const gillGeometry = new THREE.BoxGeometry(0.003, 0.0045, 0.031);
  const gills = new THREE.InstancedMesh(gillGeometry, matDark, 8);
  gills.name = 'kiemenrippen';
  const dummy = new THREE.Object3D();

  let gillIndex = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      dummy.position.set(side * 0.0355, 0.057, 0.082 + i * 0.011);
      dummy.rotation.set(0, side * 0.08, side * 0.12);
      dummy.scale.set(1, 1, 1 - i * 0.09);
      dummy.updateMatrix();
      gills.setMatrixAt(gillIndex, dummy.matrix);
      gillIndex++;
    }
  }
  gills.instanceMatrix.needsUpdate = true;
  model.add(gills);

  // --- Geschwungener, geschlossener Griff
  const gripCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.031, -0.026),
    new THREE.Vector3(0, 0.017, -0.055),
    new THREE.Vector3(0, -0.009, -0.08),
    new THREE.Vector3(0, -0.019, -0.059),
    new THREE.Vector3(0, -0.007, -0.022),
  ]);

  add(
    new THREE.TubeGeometry(gripCurve, 16, 0.019, 6, false),
    matPearl,
    new THREE.Vector3(0, 0, 0),
    null,
    'geschwungener_griff'
  );

  // Geschlossene Endkappen verdecken die offenen Rohrenden.
  const gripStart = gripCurve.getPoint(0);
  const gripEnd = gripCurve.getPoint(1);

  add(
    new THREE.SphereGeometry(0.019, 8, 6),
    matPearl,
    gripStart,
    null,
    'griffansatz'
  );
  add(
    new THREE.SphereGeometry(0.019, 8, 6),
    matPearl,
    gripEnd,
    null,
    'griffende'
  );

  // Blaue Griffrippen als InstancedMesh.
  const ribGeometry = new THREE.SphereGeometry(1, 8, 5);
  const ribs = new THREE.InstancedMesh(ribGeometry, matBlue, 8);
  ribs.name = 'griffrippen';

  for (let i = 0; i < 8; i++) {
    const t = 0.08 + i * 0.105;
    const p = gripCurve.getPoint(t);
    const tangent = gripCurve.getTangent(t);

    dummy.position.set(0, p.y + 0.016, p.z);
    dummy.rotation.set(Math.atan2(tangent.y, tangent.z) * 0.5, 0, 0);
    dummy.scale.set(0.036, 0.007, 0.014);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate = true;
  model.add(ribs);

  // --- Zentrales ovales Energiefenster auf der Oberseite
  add(
    new THREE.SphereGeometry(1, 12, 8),
    matDark,
    new THREE.Vector3(0, 0.078, 0.016),
    new THREE.Vector3(0.032, 0.01, 0.048),
    'energiefenster_einfassung'
  );

  add(
    new THREE.SphereGeometry(1, 12, 8),
    matEnergy,
    new THREE.Vector3(0, 0.083, 0.016),
    new THREE.Vector3(0.027, 0.011, 0.041),
    'energiefenster'
  );

  // Kleine seitliche Energiefenster, wie an der Waffe im Handbild.
  for (const side of [-1, 1]) {
    add(
      new THREE.SphereGeometry(1, 12, 8),
      matEnergy,
      new THREE.Vector3(side * 0.044, 0.046, 0.014),
      new THREE.Vector3(0.007, 0.017, 0.033),
      'seitenenergiefenster'
    );
  }

  // Fünf leuchtende Segmentbalken im ovalen Fenster.
  const barGeometry = new THREE.BoxGeometry(0.044, 0.003, 0.0035);
  const bars = new THREE.InstancedMesh(barGeometry, matEnergy, 5);
  bars.name = 'energiefenster_segmente';

  for (let i = 0; i < 5; i++) {
    dummy.position.set(0, 0.091, -0.014 + i * 0.015);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bars.setMatrixAt(i, dummy.matrix);
  }
  bars.instanceMatrix.needsUpdate = true;
  model.add(bars);

  // --- Auslöser und bronze Zierleiste
  add(
    new THREE.SphereGeometry(0.008, 8, 6),
    matDark,
    new THREE.Vector3(0, -0.002, -0.035),
    null,
    'ausloeser'
  );

  add(
    new THREE.BoxGeometry(0.008, 0.005, 0.032),
    matBronze,
    new THREE.Vector3(0, 0.082, -0.04),
    null,
    'bronze_ladeleiste'
  );

  // --- Mundungsimpuls: geschlossener, zunächst sehr kleiner Lichtkörper
  const muzzle = add(
    new THREE.SphereGeometry(0.018, 8, 6),
    matMuzzle,
    new THREE.Vector3(0, 0.045, 0.155),
    new THREE.Vector3(0.6, 0.6, 1),
    'mundungsimpuls'
  );

  // --- Modell exakt auf den Ursprung ausrichten
  model.updateMatrixWorld(true);
  const rawBounds = new THREE.Box3().setFromObject(model);
  const rawCenter = rawBounds.getCenter(new THREE.Vector3());

  model.position.set(
    -rawCenter.x,
    -rawBounds.min.y,
    -rawCenter.z
  );
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  // --- Unsichtbarer Kollisionskörper
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(size.x + 0.008, size.y + 0.008, size.z + 0.008),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  col.name = 'COL_wraith_handblaster';
  col.position.copy(center);
  root.add(col);

  // --- Benutzen-Punkt vor der Waffe
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(
    model.position.x,
    model.position.y + 0.085,
    model.position.z + 0.165
  );
  use.userData = {
    label: 'Wraith-Handblaster bedienen',
    radius: 0.75,
  };
  root.add(use);

  // --- Dauerhaft vorhandene LAMP-Objekte
  const lampEnergy = new THREE.Object3D();
  lampEnergy.name = 'LAMP_energie';
  lampEnergy.position.set(
    model.position.x,
    model.position.y + 0.095,
    model.position.z + 0.016
  );
  lampEnergy.userData = {
    color: '#ffb04a',
    intensity: 0.55,
    distance: 1.7,
  };
  root.add(lampEnergy);

  const lampMuzzle = new THREE.Object3D();
  lampMuzzle.name = 'LAMP_mundung';
  lampMuzzle.position.set(
    model.position.x,
    model.position.y + 0.045,
    model.position.z + 0.17
  );
  lampMuzzle.userData = {
    color: '#ffd06a',
    intensity: 0.08,
    distance: 1.5,
  };
  root.add(lampMuzzle);

  // --- Zustand und weiche Animation
  let geladen = Boolean(opts.geladen);
  let cooldown = 0;
  let flash = 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;
    cooldown = Math.max(0, cooldown - step);
    flash = Math.max(0, flash - step * 3.6);

    const puls = 0.5 + 0.5 * Math.sin(zeit * 3.1);
    const energieZiel = geladen ? 1.25 + puls * 0.5 : 0.2;

    matEnergy.emissiveIntensity +=
      (energieZiel + flash * 4.2 - matEnergy.emissiveIntensity) *
      Math.min(1, step * 10);

    matMuzzle.emissiveIntensity +=
      (flash * 7 - matMuzzle.emissiveIntensity) *
      Math.min(1, step * 18);

    const lampZiel = geladen
      ? 1.8 + puls * 0.7 + flash * 5
      : 0.55 + flash * 4;

    lampEnergy.userData.intensity +=
      (lampZiel - lampEnergy.userData.intensity) *
      Math.min(1, step * 12);

    lampMuzzle.userData.intensity +=
      (flash * 7.5 - lampMuzzle.userData.intensity) *
      Math.min(1, step * 16);

    // Der Impuls wächst kurz aus der Laufspitze heraus.
    muzzle.scale.set(
      0.6 + flash * 0.75,
      0.6 + flash * 0.75,
      1 + flash * 1.8
    );
  }

  // Selbstständige Animation über das sichtbare Hauptteil.
  body.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;
  root.userData.animation = 'energiezelle_puls_und_mundungsimpuls';

  const api = {
    laden() {
      geladen = true;
      cooldown = 0;
      return true;
    },

    entladen() {
      geladen = false;
      return true;
    },

    feuern() {
      if (!geladen || cooldown > 0) return false;

      cooldown = 0.7;
      flash = 1;
      geladen = false;
      return true;
    },

    get geladen() {
      return geladen;
    },

    get cooldown() {
      return cooldown;
    },

    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'laden',
      label: 'Energiezelle laden',
      run: () => api.laden(),
    },
    {
      id: 'entladen',
      label: 'Energiezelle entladen',
      run: () => api.entladen(),
    },
    {
      id: 'feuern',
      label: 'Betäubungsimpuls auslösen',
      run: () => api.feuern(),
    },
  ];

  return root;
}

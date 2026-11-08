// Antigravitations-Hubwagen – Ancient-/Lantianer-Stil
// Standobjekt: Ursprung = Mitte der Unterseite, tiefster Punkt bei y = 0.
// Die Bedienseite mit Deichsel zeigt nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'pallet_jack',
  art: 'Standobjekt',
  masse: '1,20 × 1,30 × 1,02 (B × H × T, m)',
  wohin: 'ATL-034 Ladungshalt und ATL-041 Hangar',
  benutzen: 'INT_bedienen → Tragfeld bedienen',
  lichter: 'LAMP_feld (eisblau, dauerhaft aktiv)',
  animation: 'Antigravitationsfeld pulsiert; Feldstreifen, Statusbalken und Abtastlinie folgen der Feldstärke',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'pallet_jack';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const metall = new THREE.MeshStandardMaterial({
    name: 'hubwagen_metall',
    color: 0x142633,
    metalness: 0.84,
    roughness: 0.31,
  });

  const obflaeche = new THREE.MeshStandardMaterial({
    name: 'hubwagen_obflaeche',
    color: 0x263c4a,
    metalness: 0.66,
    roughness: 0.48,
  });

  const gummi = new THREE.MeshStandardMaterial({
    name: 'hubwagen_griffpolster',
    color: 0x101820,
    metalness: 0.18,
    roughness: 0.76,
  });

  const feldMat = new THREE.MeshStandardMaterial({
    name: 'hubwagen_feld',
    color: 0x0b5a7a,
    emissive: 0x25c9ff,
    emissiveIntensity: 1.5,
    metalness: 0.15,
    roughness: 0.26,
  });

  const feldProjektionMat = new THREE.MeshStandardMaterial({
    name: 'hubwagen_feldprojektion',
    color: 0x1b8fbd,
    emissive: 0x30cfff,
    emissiveIntensity: 0.9,
    metalness: 0,
    roughness: 0.18,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const schirmMat = new THREE.MeshStandardMaterial({
    name: 'hubwagen_display',
    color: 0x061821,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.82,
    metalness: 0.12,
    roughness: 0.32,
  });

  const balkenMat = new THREE.MeshStandardMaterial({
    name: 'hubwagen_statusbalken',
    color: 0x0b4355,
    emissive: 0x57dcff,
    emissiveIntensity: 1.1,
    metalness: 0.1,
    roughness: 0.28,
  });

  const abtastMat = new THREE.MeshStandardMaterial({
    name: 'hubwagen_abtastlinie',
    color: 0x9b5c18,
    emissive: 0xffb347,
    emissiveIntensity: 1.4,
    metalness: 0.05,
    roughness: 0.3,
  });

  const bronze = kit('copper');

  // ------------------------------------------------------------
  // Schwebefeld unmittelbar über dem Boden
  // ------------------------------------------------------------
  const feldProjektion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.50, 0.04, 32),
    feldProjektionMat
  );
  feldProjektion.name = 'antigravitationsprojektion';
  feldProjektion.position.set(0, 0.02, 0);
  root.add(feldProjektion);

  const feldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.49, 0.018, 8, 48),
    feldMat
  );
  feldRing.name = 'feldring';
  feldRing.rotation.x = Math.PI / 2;
  feldRing.position.set(0, 0.025, 0);
  root.add(feldRing);

  // ------------------------------------------------------------
  // Lastplattform: 1,20 × 0,80 m
  // ------------------------------------------------------------
  const feldgehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.08, 0.66),
    metall
  );
  feldgehaeuse.name = 'feldgehaeuse';
  feldgehaeuse.position.set(0, 0.13, 0);
  root.add(feldgehaeuse);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, 0.15, 0.80),
    kit('wallDark')
  );
  chassis.name = 'chassis';
  chassis.position.set(0, 0.245, 0);
  root.add(chassis);

  const ladeflaeche = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.035, 0.69),
    obflaeche
  );
  ladeflaeche.name = 'ladeflaeche';
  ladeflaeche.position.set(0, 0.337, 0);
  root.add(ladeflaeche);

  // Kompakte, flache Führungskanten statt hoher Gitterwände
  for (const x of [-0.575, 0.575]) {
    const fuehrung = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.09, 0.80),
      metall
    );
    fuehrung.name = 'seitenfuehrung';
    fuehrung.position.set(x, 0.375, 0);
    root.add(fuehrung);
  }

  const rueckfuehrung = new THREE.Mesh(
    new THREE.BoxGeometry(1.10, 0.09, 0.05),
    metall
  );
  rueckfuehrung.name = 'rueckfuehrung';
  rueckfuehrung.position.set(0, 0.375, -0.375);
  root.add(rueckfuehrung);

  // Flache Anti-Rutsch-Lamellen als InstancedMesh
  const lamellenGeo = new THREE.BoxGeometry(1.00, 0.012, 0.025);
  const lamellen = new THREE.InstancedMesh(lamellenGeo, bronze, 7);
  lamellen.name = 'ladeflaeche_lamellen';

  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 7; i++) {
    const z = -0.27 + i * 0.09;
    matrix.makeTranslation(0, 0.362, z);
    lamellen.setMatrixAt(i, matrix);
  }
  lamellen.instanceMatrix.needsUpdate = true;
  root.add(lamellen);

  // Integrierte Feldemitter an der Unterseite
  const emitterGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.025, 16);
  const emitter = new THREE.InstancedMesh(emitterGeo, feldMat, 4);
  emitter.name = 'feldemitter';

  let emitterIndex = 0;
  for (const x of [-0.41, 0.41]) {
    for (const z of [-0.23, 0.23]) {
      matrix.makeTranslation(x, 0.087, z);
      emitter.setMatrixAt(emitterIndex++, matrix);
    }
  }
  emitter.instanceMatrix.needsUpdate = true;
  root.add(emitter);

  // Zwei durchgehende Leuchtfelder an den Längsseiten
  for (const x of [-0.51, 0.51]) {
    const feldstreifen = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.026, 0.58),
      feldMat
    );
    feldstreifen.name = 'feldstreifen';
    feldstreifen.position.set(x, 0.083, 0);
    root.add(feldstreifen);
  }

  // Frontschutzblech unterhalb der Ladefläche
  const frontschutz = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.055, 0.035),
    metall
  );
  frontschutz.name = 'frontschutz';
  frontschutz.position.set(0, 0.16, 0.407);
  root.add(frontschutz);

  // ------------------------------------------------------------
  // Deichsel / Bedienmast
  // ------------------------------------------------------------
  function strebeZwischen(p1, p2, radius = 0.032, material = metall) {
    const start = new THREE.Vector3(...p1);
    const ende = new THREE.Vector3(...p2);
    const richtung = ende.clone().sub(start);
    const laenge = richtung.length();
    const geo = new THREE.CylinderGeometry(radius, radius * 1.08, laenge, 10);

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(start).add(ende).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      richtung.normalize()
    );
    root.add(mesh);
    return mesh;
  }

  strebeZwischen([-0.24, 0.24, 0.27], [-0.24, 1.20, 0.56]);
  strebeZwischen([0.24, 0.24, 0.27], [0.24, 1.20, 0.56]);

  // Untere Verstrebung
  const unterstrebe = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.055, 0.075),
    metall
  );
  unterstrebe.name = 'deichsel_unterstrebe';
  unterstrebe.position.set(0, 0.52, 0.36);
  unterstrebe.rotation.x = 0.31;
  root.add(unterstrebe);

  // Drehgelenk zwischen Deichsel und Plattform
  const gelenk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.58, 16),
    bronze
  );
  gelenk.name = 'deichsel_gelenk';
  gelenk.rotation.z = Math.PI / 2;
  gelenk.position.set(0, 0.25, 0.275);
  root.add(gelenk);

  // Griffquerholm
  const griff = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.10, 0.12),
    metall
  );
  griff.name = 'deichsel_griff';
  griff.position.set(0, 1.235, 0.575);
  root.add(griff);

  for (const x of [-0.245, 0.245]) {
    const griffauflage = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.115, 0.135),
      gummi
    );
    griffauflage.name = 'griffpolster';
    griffauflage.position.set(x, 1.235, 0.575);
    root.add(griffauflage);
  }

  // Bronze-Endkappen
  for (const x of [-0.345, 0.345]) {
    const endkappe = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.105, 0.125),
      bronze
    );
    endkappe.name = 'griff_endkappe';
    endkappe.position.set(x, 1.235, 0.575);
    root.add(endkappe);
  }

  // ------------------------------------------------------------
  // Bedienkonsole
  // ------------------------------------------------------------
  const konsole = new THREE.Group();
  konsole.name = 'bedienkonsole';
  konsole.position.set(0, 1.085, 0.505);
  konsole.rotation.x = -0.38;

  const konsoleGehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(0.50, 0.28, 0.075),
    kit('wallDark')
  );
  konsoleGehaeuse.name = 'konsole_gehaeuse';
  konsole.add(konsoleGehaeuse);

  const rahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.445, 0.205, 0.014),
    bronze
  );
  rahmen.name = 'konsole_rahmen';
  rahmen.position.set(0, 0.025, 0.042);
  konsole.add(rahmen);

  const schirm = new THREE.Mesh(
    new THREE.BoxGeometry(0.405, 0.165, 0.012),
    schirmMat
  );
  schirm.name = 'konsole_display';
  schirm.position.set(0, 0.025, 0.054);
  konsole.add(schirm);

  // Vier Statusbalken als InstancedMesh
  const balkenGeo = new THREE.BoxGeometry(0.052, 0.012, 0.006);
  const balken = new THREE.InstancedMesh(balkenGeo, balkenMat, 4);
  balken.name = 'konsole_statusbalken';

  for (let i = 0; i < 4; i++) {
    matrix.makeTranslation(-0.135 + i * 0.09, -0.045, 0.063);
    balken.setMatrixAt(i, matrix);
  }
  balken.instanceMatrix.needsUpdate = true;
  konsole.add(balken);

  // Abtastlinie läuft sichtbar über das Display
  const abtastlinie = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.009, 0.005),
    abtastMat
  );
  abtastlinie.name = 'konsole_abtastlinie';
  abtastlinie.position.set(0, 0.025, 0.066);
  konsole.add(abtastlinie);

  // Große, eindeutig erkennbare Tragfeldtaste
  const taste = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.04, 0.018),
    bronze
  );
  taste.name = 'feldtaste';
  taste.position.set(0, -0.095, 0.047);
  konsole.add(taste);

  const tastenKappe = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.022, 0.021),
    feldMat
  );
  tastenKappe.name = 'feldtaste_kappe';
  tastenKappe.position.set(0, -0.095, 0.058);
  konsole.add(tastenKappe);

  root.add(konsole);

  // ------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------
  const colPlattform = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, 0.33, 0.80)
  );
  colPlattform.name = 'COL_lastplattform';
  colPlattform.position.set(0, 0.255, 0);
  root.add(colPlattform);

  const colDeichsel = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 1.08, 0.24)
  );
  colDeichsel.name = 'COL_deichsel';
  colDeichsel.position.set(0, 0.76, 0.43);
  colDeichsel.rotation.x = 0.33;
  root.add(colDeichsel);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Licht
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.08, 0.78);
  use.userData = {
    label: 'Antigravitations-Hubwagen bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_feld';
  lamp.position.set(0, 0.055, 0);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 4.2,
  };
  root.add(lamp);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------
  let feldAktiv = true;
  let feldStaerke = 1;
  let geglaetteteStaerke = 1;
  let zeit = 0;
  let letzteZeit = null;

  function update(dt) {
    const d = Math.min(Math.max(Number(dt) || 0, 0), 0.1);
    zeit += d;

    const ziel = feldAktiv ? feldStaerke : 0.06;
    geglaetteteStaerke +=
      (ziel - geglaetteteStaerke) * Math.min(1, d * 5);

    const puls = 1 + 0.13 * Math.sin(zeit * 3.2);

    feldMat.emissiveIntensity =
      0.16 + geglaetteteStaerke * 1.42 * puls;

    feldProjektionMat.emissiveIntensity =
      0.08 + geglaetteteStaerke * 0.95 * puls;

    feldProjektionMat.opacity =
      0.05 + geglaetteteStaerke * 0.20;

    schirmMat.emissiveIntensity = feldAktiv
      ? 0.68 + 0.17 * Math.sin(zeit * 2.4)
      : 0.14;

    balkenMat.emissiveIntensity = feldAktiv
      ? 0.65 + geglaetteteStaerke * 0.75
      : 0.16;

    abtastMat.emissiveIntensity = feldAktiv
      ? 0.9 + 0.65 * Math.max(0, Math.sin(zeit * 5.0))
      : 0.12;

    abtastlinie.position.x =
      Math.sin(zeit * 2.1) * 0.13;

    feldRing.scale.setScalar(
      0.98 + geglaetteteStaerke * 0.025 +
      Math.sin(zeit * 3.2) * 0.008
    );
  }

  chassis.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzteZeit !== null) {
      update(Math.min(now - letzteZeit, 0.1));
    }
    letzteZeit = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API
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
    kalibrieren() {
      feldStaerke = 1;
      feldAktiv = true;
    },
    staerkeSetzen(wert) {
      const begrenzt = Math.max(0.25, Math.min(1.5, Number(wert) || 1));
      feldStaerke = begrenzt;
    },
    get feldAktiv() {
      return feldAktiv;
    },
    get feldStaerke() {
      return feldStaerke;
    },
    get status() {
      return feldAktiv
        ? `Tragfeld aktiv, Stärke ${feldStaerke.toFixed(2)}`
        : 'Tragfeld pausiert';
    },
  };

  root.userData.api = api;
  root.userData.hinweis =
    'Transport-Werkzeug: schwere Lasten mit dem Antigravitationsfeld bewegen.';

  root.userData.actions = [
    {
      id: 'feld_ein',
      label: 'Tragfeld einschalten',
      run: () => api.feldEinschalten(),
    },
    {
      id: 'feld_aus',
      label: 'Tragfeld pausieren',
      run: () => api.feldAusschalten(),
    },
    {
      id: 'feld_um',
      label: 'Tragfeld umschalten',
      run: () => api.feldUmschalten(),
    },
    {
      id: 'kalibrieren',
      label: 'Tragfeld kalibrieren',
      run: () => api.kalibrieren(),
    },
  ];

  return root;
}

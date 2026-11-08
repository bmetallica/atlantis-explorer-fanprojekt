// jumper_ramp.js — Absenkbare Heckrampe eines Puddle Jumpers
// Standobjekt. Ursprung: Mitte der Unterseite.
// Vorderseite / Rampenrichtung: +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'jumper_ramp',
  art: 'Standobjekt',
  masse: '2,60 × 2,45 × 2,55 (B × H × T im geöffneten Zustand, m)',
  wohin: 'ATL-040 — Jumper-Bay / Puddle-Jumper-Hangar, Heckwand',
  benutzen: 'INT_fahrzeug bzw. INT_rampe → Menü aus userData.actions',
  lichter: 'LAMP_rampe (eisblau), LAMP_status (bernstein)',
  animation: 'Hydraulisch klappt die Rampe weich aus und ein; Leuchtstreifen und Statusanzeige pulsieren',
  quelle: 'selbst gebaut nach OBJ-077',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'jumper_ramp';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------
  const matRahmen = new THREE.MeshStandardMaterial({
    name: 'jumper_ramp_frame',
    color: 0x3a403b,
    metalness: 0.72,
    roughness: 0.44,
  });

  const matFuge = new THREE.MeshStandardMaterial({
    name: 'jumper_dark_seams',
    color: 0x2c312d,
    metalness: 0.64,
    roughness: 0.58,
  });

  const matMetall = new THREE.MeshStandardMaterial({
    name: 'jumper_metal',
    color: 0x737b75,
    metalness: 0.76,
    roughness: 0.36,
  });

  const matHuelle = new THREE.MeshStandardMaterial({
    name: 'jumper_hull',
    color: 0x8a948a,
    metalness: 0.55,
    roughness: 0.55,
  });

  const matGlow = new THREE.MeshStandardMaterial({
    name: 'jumper_glow',
    color: 0x6fe3ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.15,
    metalness: 0.22,
    roughness: 0.3,
  });

  const matStatus = new THREE.MeshStandardMaterial({
    name: 'jumper_amber',
    color: 0xffa040,
    emissive: 0xffa040,
    emissiveIntensity: 0.35,
    metalness: 0.18,
    roughness: 0.34,
  });

  const matColl = new THREE.MeshBasicMaterial({
    name: 'collision',
    visible: false,
  });

  // Panzerplatten-Textur für das Rampenblatt.
  function createPlateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#303632';
    ctx.fillRect(0, 0, 512, 512);

    const platten = [
      [0, 0, 250, 126],
      [254, 0, 258, 126],
      [0, 130, 168, 124],
      [172, 130, 340, 124],
      [0, 258, 250, 254],
      [254, 258, 258, 254],
    ];

    for (const [x, y, w, h] of platten) {
      const helligkeit = 49 + ((x * 7 + y * 3) % 14);
      ctx.fillStyle = `rgb(${helligkeit},${helligkeit + 4},${helligkeit + 1})`;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      ctx.strokeStyle = 'rgba(160, 170, 160, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);

      ctx.fillStyle = 'rgba(12, 16, 14, 0.38)';
      ctx.fillRect(x + 11, y + 12, 27, 3);
      ctx.fillRect(x + 11, y + 19, 18, 2);
    }

    ctx.strokeStyle = '#171b19';
    ctx.lineWidth = 5;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    const textur = new THREE.CanvasTexture(canvas);
    textur.colorSpace = THREE.SRGBColorSpace;
    textur.wrapS = THREE.RepeatWrapping;
    textur.wrapT = THREE.RepeatWrapping;
    textur.repeat.set(1.25, 1.65);
    textur.anisotropy = 4;
    return textur;
  }

  const matRampe = new THREE.MeshStandardMaterial({
    name: 'jumper_ramp_plates',
    color: 0x737a73,
    map: createPlateTexture(),
    metalness: 0.58,
    roughness: 0.56,
  });

  // ------------------------------------------------------------------
  // Fester Rahmen an der Heckwand
  // ------------------------------------------------------------------
  const rahmen = new THREE.Group();
  rahmen.name = 'jumper_ramp_frame';
  root.add(rahmen);

  // Die äußere Rahmenbreite beträgt exakt 2,60 m.
  const postLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 2.32, 0.38),
    matRahmen
  );
  postLinks.position.set(-1.20, 1.18, 0.17);
  rahmen.add(postLinks);

  const postRechts = postLinks.clone();
  postRechts.position.x = 1.20;
  rahmen.add(postRechts);

  // Verstärkungsleisten auf den nach vorn gerichteten Flächen.
  for (const x of [-1.20, 1.20]) {
    const leiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 2.04, 0.035),
      matMetall
    );
    leiste.position.set(x, 1.14, 0.375);
    rahmen.add(leiste);

    const senkrechteFuge = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 1.84, 0.028),
      matFuge
    );
    senkrechteFuge.position.set(x + 0.055, 1.14, 0.399);
    rahmen.add(senkrechteFuge);
  }

  const oberrahmen = new THREE.Mesh(
    new THREE.BoxGeometry(2.60, 0.20, 0.42),
    matRahmen
  );
  oberrahmen.position.set(0, 2.36, 0.17);
  rahmen.add(oberrahmen);

  // Panzerungskappe über dem Rahmen.
  const kappe = new THREE.Mesh(
    new THREE.BoxGeometry(2.34, 0.11, 0.30),
    matHuelle
  );
  kappe.position.set(0, 2.485, 0.13);
  rahmen.add(kappe);

  const schwelle = new THREE.Mesh(
    new THREE.BoxGeometry(2.60, 0.10, 0.44),
    matFuge
  );
  schwelle.position.set(0, 0.05, 0.16);
  rahmen.add(schwelle);

  // Vordere Kante der Schwelle.
  const schwellenkante = new THREE.Mesh(
    new THREE.BoxGeometry(2.56, 0.035, 0.035),
    matMetall
  );
  schwellenkante.position.set(0, 0.10, 0.375);
  rahmen.add(schwellenkante);

  // Seitliche Hydraulik- und Antriebsgehäuse.
  for (const x of [-1.20, 1.20]) {
    const gehaeuse = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.62, 0.32),
      matFuge
    );
    gehaeuse.position.set(x, 1.76, 0.10);
    rahmen.add(gehaeuse);

    const gehaeuseKappe = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.10, 0.34),
      matHuelle
    );
    gehaeuseKappe.position.set(x, 2.10, 0.10);
    rahmen.add(gehaeuseKappe);

    const lager = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.22, 16),
      matMetall
    );
    lager.rotation.z = Math.PI / 2;
    lager.position.set(x, 0.10, 0.18);
    rahmen.add(lager);
  }

  // Scharnierbolzen an der unteren Kante.
  const scharnierLinks = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.20, 16),
    matMetall
  );
  scharnierLinks.rotation.z = Math.PI / 2;
  scharnierLinks.position.set(-1.02, 0.10, 0.18);
  rahmen.add(scharnierLinks);

  const scharnierRechts = scharnierLinks.clone();
  scharnierRechts.position.x = 1.02;
  rahmen.add(scharnierRechts);

  // Bernsteinfarbene Statusleiste im oberen Rahmen.
  const statusleiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.055, 0.025),
    matStatus
  );
  statusleiste.position.set(0, 2.38, 0.395);
  rahmen.add(statusleiste);

  // Kleine Statussymbole links und rechts der Hauptleiste.
  for (const x of [-0.52, 0.52]) {
    const symbol = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.045, 0.025),
      matStatus
    );
    symbol.position.set(x, 2.38, 0.395);
    rahmen.add(symbol);
  }

  // ------------------------------------------------------------------
  // Bewegliches Rampenblatt
  // ------------------------------------------------------------------
  const scharniergruppe = new THREE.Group();
  scharniergruppe.name = 'jumper_ramp_blade_pivot';
  scharniergruppe.position.set(0, 0.10, 0.18);
  root.add(scharniergruppe);

  const rampenblatt = new THREE.Mesh(
    new THREE.BoxGeometry(2.30, 2.34, 0.10),
    matRampe
  );
  rampenblatt.position.set(0, 1.17, 0);
  scharniergruppe.add(rampenblatt);

  // Seitliche Führungsschienen.
  for (const x of [-1.07, 1.07]) {
    const schiene = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 2.34, 0.15),
      matRahmen
    );
    schiene.position.set(x, 1.17, -0.015);
    scharniergruppe.add(schiene);

    const kantenleiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 2.26, 0.025),
      matMetall
    );
    kantenleiste.position.set(x, 1.17, 0.066);
    scharniergruppe.add(kantenleiste);
  }

  // Querrillen auf der Oberseite der geöffneten Rampe.
  // Die lokale -Z-Seite wird durch die Öffnungsdrehung zur Oberseite.
  const rillenGeo = new THREE.BoxGeometry(2.08, 0.045, 0.038);
  const rillen = new THREE.InstancedMesh(rillenGeo, matFuge, 16);
  rillen.name = 'jumper_ramp_grooves_top';
  const rillenMatrix = new THREE.Matrix4();
  for (let i = 0; i < 16; i++) {
    rillenMatrix.makeTranslation(0, 0.18 + i * 0.138, -0.068);
    rillen.setMatrixAt(i, rillenMatrix);
  }
  rillen.instanceMatrix.needsUpdate = true;
  scharniergruppe.add(rillen);

  // Schmalere Rillen auf der geschlossenen Vorderseite.
  const frontRillen = new THREE.InstancedMesh(rillenGeo, matFuge, 16);
  frontRillen.name = 'jumper_ramp_grooves_front';
  for (let i = 0; i < 16; i++) {
    rillenMatrix.makeTranslation(0, 0.18 + i * 0.138, 0.068);
    frontRillen.setMatrixAt(i, rillenMatrix);
  }
  frontRillen.instanceMatrix.needsUpdate = true;
  scharniergruppe.add(frontRillen);

  // Innere Leuchtstreifen entlang der Rampenlänge.
  for (const x of [-0.98, 0.98]) {
    const streifen = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 2.18, 0.022),
      matGlow
    );
    streifen.position.set(x, 1.17, -0.096);
    scharniergruppe.add(streifen);
  }

  // Kleine Querstreben an der Blattunterseite.
  for (const y of [0.55, 1.70]) {
    const strebe = new THREE.Mesh(
      new THREE.BoxGeometry(1.94, 0.07, 0.06),
      matMetall
    );
    strebe.position.set(0, y, 0.075);
    scharniergruppe.add(strebe);
  }

  // Zwei zusätzliche Längsstreben für eine robustere Unterseite.
  for (const x of [-0.58, 0.58]) {
    const laengsstrebe = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 1.96, 0.045),
      matFuge
    );
    laengsstrebe.position.set(x, 1.17, 0.072);
    scharniergruppe.add(laengsstrebe);
  }

  // ------------------------------------------------------------------
  // Hydraulikzylinder
  // ------------------------------------------------------------------
  const hydraulik = [];
  const zylinderGeo = new THREE.CylinderGeometry(0.052, 0.052, 1, 12);
  const kolbenGeo = new THREE.CylinderGeometry(0.026, 0.026, 1, 10);

  for (const side of [-1, 1]) {
    const barrel = new THREE.Mesh(zylinderGeo, matFuge);
    const rod = new THREE.Mesh(kolbenGeo, matMetall);

    barrel.name = `jumper_hydraulic_barrel_${side < 0 ? 'links' : 'rechts'}`;
    rod.name = `jumper_hydraulic_rod_${side < 0 ? 'links' : 'rechts'}`;

    root.add(barrel, rod);

    hydraulik.push({
      barrel,
      rod,
      fest: new THREE.Vector3(side * 1.19, 1.86, 0.08),
      beweglich: new THREE.Vector3(side * 1.03, 1.48, -0.08),
    });
  }

  const hoch = new THREE.Vector3(0, 1, 0);
  const richtung = new THREE.Vector3();
  const mitte = new THREE.Vector3();

  function setCylinderBetween(mesh, a, b, anteil) {
    richtung.subVectors(b, a);
    const laenge = Math.max(0.01, richtung.length());
    richtung.normalize();

    mitte.copy(a).addScaledVector(richtung, laenge * anteil * 0.5);
    mesh.position.copy(mitte);
    mesh.quaternion.setFromUnitVectors(hoch, richtung);
    mesh.scale.set(1, Math.max(0.01, laenge * anteil), 1);
  }

  function aktualisiereHydraulik() {
    for (const h of hydraulik) {
      const bewegt = h.beweglich.clone()
        .applyQuaternion(scharniergruppe.quaternion)
        .add(scharniergruppe.position);

      richtung.subVectors(bewegt, h.fest);
      const laenge = Math.max(0.01, richtung.length());
      const barrelAnteil = Math.min(0.62, 0.55 / laenge);
      const rodAnteil = Math.min(1, laenge - barrelAnteil * laenge);

      setCylinderBetween(h.barrel, h.fest, bewegt, barrelAnteil);

      const richtungNormalisiert = richtung.clone().normalize();
      const kolbenStart = h.fest.clone().addScaledVector(
        richtungNormalisiert,
        laenge * barrelAnteil
      );

      setCylinderBetween(h.rod, kolbenStart, bewegt, rodAnteil);
    }
  }

  // ------------------------------------------------------------------
  // Kollisionskörper: nur feste Rahmenteile
  // ------------------------------------------------------------------
  const colLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 2.32, 0.38),
    matColl
  );
  colLinks.name = 'COL_rahmen_links';
  colLinks.position.copy(postLinks.position);
  colLinks.userData.aktiv = true;
  root.add(colLinks);

  const colRechts = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 2.32, 0.38),
    matColl
  );
  colRechts.name = 'COL_rahmen_rechts';
  colRechts.position.copy(postRechts.position);
  colRechts.userData.aktiv = true;
  root.add(colRechts);

  const colOben = new THREE.Mesh(
    new THREE.BoxGeometry(2.60, 0.20, 0.42),
    matColl
  );
  colOben.name = 'COL_rahmen_oben';
  colOben.position.copy(oberrahmen.position);
  colOben.userData.aktiv = true;
  root.add(colOben);

  const colSchwelle = new THREE.Mesh(
    new THREE.BoxGeometry(2.60, 0.10, 0.44),
    matColl
  );
  colSchwelle.name = 'COL_schwelle';
  colSchwelle.position.copy(schwelle.position);
  colSchwelle.userData.aktiv = true;
  root.add(colSchwelle);

  // Das bewegte Rampenblatt erhält bewusst keinen COL_-Körper.

  // ------------------------------------------------------------------
  // Benutzen-Punkte und Licht
  // ------------------------------------------------------------------
  const intFahrzeug = new THREE.Object3D();
  intFahrzeug.name = 'INT_fahrzeug';
  intFahrzeug.position.set(0, 1.02, 2.78);
  intFahrzeug.userData = {
    label: 'Puddle Jumper beladen / entladen',
    radius: 0.9,
  };
  root.add(intFahrzeug);

  const intRampe = new THREE.Object3D();
  intRampe.name = 'INT_rampe';
  intRampe.position.set(0, 1.04, 0.62);
  intRampe.userData = {
    label: 'Heckrampe bedienen',
    radius: 0.8,
  };
  root.add(intRampe);

  const lampRampe = new THREE.Object3D();
  lampRampe.name = 'LAMP_rampe';
  lampRampe.position.set(0, 1.55, 0.48);
  lampRampe.userData = {
    color: '#6fe3ff',
    intensity: 7,
    distance: 4.5,
  };
  root.add(lampRampe);

  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0, 2.36, 0.48);
  lampStatus.userData = {
    color: '#ffa040',
    intensity: 3,
    distance: 2.4,
  };
  root.add(lampStatus);

  // ------------------------------------------------------------------
  // Zustand, Bewegung und öffentliche API
  // ------------------------------------------------------------------
  const OFFEN = Math.PI / 2;
  let winkel = 0;
  let ziel = opts.startOpen === true ? OFFEN : 0;
  let zeit = 0;
  let letzte = null;

  if (opts.startOpen === true) {
    winkel = ziel;
    scharniergruppe.rotation.x = winkel;
  }

  const api = {
    oeffnen() {
      ziel = OFFEN;
    },
    schliessen() {
      ziel = 0;
    },
    umschalten() {
      ziel = ziel > OFFEN * 0.5 ? 0 : OFFEN;
    },
    setOffen(wert) {
      ziel = Boolean(wert) ? OFFEN : 0;
    },
    get offen() {
      return ziel > OFFEN * 0.5;
    },
    get winkel() {
      return winkel;
    },
    get status() {
      if (winkel < 0.03) return 'geschlossen';
      if (winkel > OFFEN - 0.03) return 'offen';
      return 'in Bewegung';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'rampe_oeffnen',
      label: 'Heckrampe öffnen',
      run: () => api.oeffnen(),
    },
    {
      id: 'rampe_schliessen',
      label: 'Heckrampe schließen',
      run: () => api.schliessen(),
    },
    {
      id: 'rampe_umschalten',
      label: 'Heckrampe umschalten',
      run: () => api.umschalten(),
    },
  ];

  function update(dt) {
    zeit += dt;

    const factor = Math.min(1, dt * 2.1);
    winkel += (ziel - winkel) * factor;

    if (Math.abs(ziel - winkel) < 0.001) {
      winkel = ziel;
    }

    scharniergruppe.rotation.x = winkel;
    aktualisiereHydraulik();

    const puls = 0.85 + Math.sin(zeit * 3.2) * 0.18;
    matGlow.emissiveIntensity = (ziel > 0.05 ? 1.8 : 0.85) * puls;

    matStatus.emissiveIntensity =
      ziel > OFFEN * 0.5
        ? 1.8
        : 0.28 + Math.sin(zeit * 2.4) * 0.12;

    root.userData.update = update;
  }

  // update auch außerhalb des Renderloops verfügbar machen.
  root.userData.update = update;

  oberrahmen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  aktualisiereHydraulik();

  return root;
}

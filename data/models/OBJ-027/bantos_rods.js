// OBJ-027: Bantos-Kampfstangen – zwei Athosianische Eskrima-Trainingsstäcke.
// Ursprung: Mitte der Unterseite des gesamten Paars, tiefster Punkt bei y = 0.
// Die Stäcke liegen parallel nebeneinander; ihre Längsachse verläuft entlang X.
// Die lokale Vorderseite der Szene zeigt nach +Z.

import * as THREE from 'three';

export const steckbrief = {
  name: 'bantos_rods',
  art: 'Bodenobjekt / Nahkampf-Trainingsausrüstung',
  masse: '2 × 0,76 × 0,028 m; Paar ca. 0,78 × 0,11 × 0,038 m',
  wohin: 'ATL-026 Fitnessraum / Gym, am Rand der Trainingsfläche',
  benutzen: 'Kein eigener Benutzen-Punkt; dient als Nahkampfwaffe und Trainingsgerät',
  lichter: 'keine',
  animation: 'keine',
  quelle: 'selbst gebaut nach Serien-Requisiten und Auftragsbildern',
};

function erzeugeRauschen(seed) {
  let wert = seed >>> 0;
  return function () {
    wert = (wert * 1664525 + 1013904223) >>> 0;
    return wert / 4294967296;
  };
}

function erzeugeHolzTextur(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const rnd = erzeugeRauschen(seed);

  ctx.fillStyle = '#100d0b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Längslaufende, unregelmäßige Maserung des dunklen Hartholzes.
  for (let i = 0; i < 95; i++) {
    const x = rnd() * canvas.width;
    const breite = 0.35 + rnd() * 1.9;
    const helligkeit = 13 + Math.floor(rnd() * 27);

    ctx.strokeStyle = `rgba(${helligkeit + 9}, ${helligkeit + 5}, ${helligkeit}, 0.34)`;
    ctx.lineWidth = breite;
    ctx.beginPath();

    for (let y = -12; y <= canvas.height + 12; y += 12) {
      const drift =
        Math.sin(y * 0.022 + i * 1.73) * (1.0 + rnd() * 2.5) +
        Math.sin(y * 0.061 + i * 0.37) * 0.65;

      if (y === -12) ctx.moveTo(x + drift, y);
      else ctx.lineTo(x + drift, y);
    }
    ctx.stroke();
  }

  // Wenige schmale Glanzlinien, ohne Rost oder Schmutz.
  for (let i = 0; i < 18; i++) {
    const x = rnd() * canvas.width;
    ctx.strokeStyle = `rgba(112, 92, 72, ${0.08 + rnd() * 0.12})`;
    ctx.lineWidth = 0.5 + rnd() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + rnd() * 7,
      canvas.height * 0.3,
      x - rnd() * 8,
      canvas.height * 0.7,
      x + rnd() * 5,
      canvas.height,
    );
    ctx.stroke();
  }

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.wrapS = THREE.RepeatWrapping;
  textur.wrapT = THREE.RepeatWrapping;
  textur.repeat.set(1, 1);
  textur.anisotropy = 4;
  return textur;
}

function erzeugeUmwicklungstextur(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rnd = erzeugeRauschen(seed);

  ctx.fillStyle = '#d9cfb6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Feine, helle Stofffasern.
  for (let i = 0; i < 240; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    const laenge = 4 + rnd() * 18;

    ctx.strokeStyle = `rgba(255, 249, 226, ${0.08 + rnd() * 0.15})`;
    ctx.lineWidth = 0.45 + rnd() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + laenge, y + (rnd() - 0.5) * 2.5);
    ctx.stroke();
  }

  // Dunkle Bantos-Muster auf dem beigen Wickelband.
  for (let i = 0; i < 34; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    const w = 9 + rnd() * 25;
    const h = 4 + rnd() * 9;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.8);
    ctx.fillStyle = `rgba(48, 36, 25, ${0.55 + rnd() * 0.28})`;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(-w * 0.12, -h);
    ctx.lineTo(w * 0.5, -h * 0.32);
    ctx.lineTo(w * 0.25, h * 0.72);
    ctx.lineTo(-w * 0.36, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Längliche dunkle Akzente, entsprechend der Requisite.
  for (let i = 0; i < 14; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;

    ctx.strokeStyle = 'rgba(55, 40, 27, 0.58)';
    ctx.lineWidth = 1.6 + rnd() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + 12,
      y - 7,
      x + 24,
      y + 7,
      x + 39,
      y - 3,
    );
    ctx.stroke();
  }

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.wrapS = THREE.RepeatWrapping;
  textur.wrapT = THREE.RepeatWrapping;
  textur.repeat.set(2, 1);
  textur.anisotropy = 4;
  return textur;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'bantos_rods';

  const seed = Number.isFinite(opts.seed) ? opts.seed : 2718;

  const holzTextur = erzeugeHolzTextur(seed);
  const umwicklungTextur = erzeugeUmwicklungstextur(seed + 97);

  const holzMaterial = new THREE.MeshStandardMaterial({
    name: 'bantos_hartholz',
    color: 0xffffff,
    map: holzTextur,
    roughness: 0.82,
    metalness: 0.01,
  });

  const umwicklungMaterial = new THREE.MeshStandardMaterial({
    name: 'bantos_umwicklung',
    color: 0xffffff,
    map: umwicklungTextur,
    roughness: 0.94,
    metalness: 0,
  });

  const wickelMaterial = new THREE.MeshStandardMaterial({
    name: 'bantos_wickelmuster',
    color: 0x30251c,
    roughness: 0.9,
    metalness: 0,
  });

  const ringMaterial = new THREE.MeshStandardMaterial({
    name: 'bantos_schliessring',
    color: 0x8b8274,
    roughness: 0.42,
    metalness: 0.62,
  });

  const stabAnordnung = [
    { z: -0.043, yaw: 0.032 },
    { z: 0.043, yaw: -0.021 },
  ];

  // Alle sichtbaren Teile liegen so, dass die Unterkante bei y = 0 beginnt.
  const achshoehe = 0.0172;
  const ringInstanzen = [];

  for (let index = 0; index < stabAnordnung.length; index++) {
    const anordnung = stabAnordnung[index];
    const stab = new THREE.Group();
    stab.name = `bantos_stab_${index + 1}`;
    stab.position.set(0, 0, anordnung.z);
    stab.rotation.y = anordnung.yaw;
    root.add(stab);

    // Geschlossener, dunkler Holzkörper, 75 cm lang.
    const schaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.724, 18, 1, false),
      holzMaterial,
    );
    schaft.name = `bantos_schaft_${index + 1}`;
    schaft.rotation.z = Math.PI / 2;
    schaft.position.y = achshoehe;
    stab.add(schaft);

    // Abgerundete Enden des dunklen Schafts.
    for (const ende of [-1, 1]) {
      const kappe = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 8),
        holzMaterial,
      );
      kappe.name =
        `bantos_holzkappe_${index + 1}_${ende < 0 ? 'hinten' : 'vorne'}`;
      kappe.scale.set(0.9, 1, 1);
      kappe.position.set(ende * 0.362, achshoehe, 0);
      stab.add(kappe);
    }

    // Geschlossene helle Umwicklung im unteren Griffbereich.
    // Der Griff reicht bis zum hinteren Anschlag und umschließt den Schaft.
    const griff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0162, 0.0162, 0.33, 20, 1, false),
      umwicklungMaterial,
    );
    griff.name = `bantos_griff_umwicklung_${index + 1}`;
    griff.rotation.z = Math.PI / 2;
    griff.position.set(-0.21, achshoehe, 0);
    stab.add(griff);

    // Abgerundeter heller Endabschluss am Griff.
    const endknauf = new THREE.Mesh(
      new THREE.SphereGeometry(0.0172, 14, 9),
      umwicklungMaterial,
    );
    endknauf.name = `bantos_griffende_${index + 1}`;
    endknauf.scale.set(0.62, 1, 1);
    endknauf.position.set(-0.375, achshoehe, 0);
    stab.add(endknauf);

    // Metallischer Abschlussring zwischen Wicklung und dunklem Schaft.
    const abschluss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0183, 0.0183, 0.014, 20, 1, false),
      ringMaterial,
    );
    abschluss.name = `bantos_abschluss_${index + 1}`;
    abschluss.rotation.z = Math.PI / 2;
    abschluss.position.set(-0.041, achshoehe, 0);
    stab.add(abschluss);

    // Dunkle Wickelkanten als wiederholte Instanzen.
    for (let r = 0; r < 7; r++) {
      const lokalX = -0.33 + r * 0.047;
      ringInstanzen.push({
        x: lokalX,
        z: anordnung.z,
        yaw: anordnung.yaw,
      });
    }

    // Unsichtbarer Kollisionskörper für den jeweiligen Stab.
    const kollision = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.0344, 0.037),
    );
    kollision.name = `COL_bantos_stab_${index + 1}`;
    kollision.position.set(0, 0.0172, 0);
    stab.add(kollision);
  }

  // Gemeinsames InstancedMesh für alle dunklen Wickelkanten.
  const ringGeometrie = new THREE.TorusGeometry(
    0.0164,
    0.0011,
    5,
    16,
  );
  ringGeometrie.rotateY(Math.PI / 2);

  const ringe = new THREE.InstancedMesh(
    ringGeometrie,
    wickelMaterial,
    ringInstanzen.length,
  );
  ringe.name = 'bantos_wickelringe';
  ringe.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const skala = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();

  ringInstanzen.forEach((instanz, i) => {
    const c = Math.cos(instanz.yaw);
    const s = Math.sin(instanz.yaw);

    // Lokale X-Position wird mit derselben Drehung transformiert wie der Stab.
    position.set(
      instanz.x * c,
      achshoehe,
      instanz.z - instanz.x * s,
    );
    euler.set(0, instanz.yaw, 0);
    quat.setFromEuler(euler);
    matrix.compose(position, quat, skala);
    ringe.setMatrixAt(i, matrix);
  });

  ringe.instanceMatrix.needsUpdate = true;
  ringe.castShadow = true;
  ringe.receiveShadow = true;
  root.add(ringe);

  root.traverse((objekt) => {
    if (objekt.isMesh && !objekt.name.startsWith('COL_')) {
      objekt.castShadow = true;
      objekt.receiveShadow = true;
    }
  });

  // Passives Trainingsrequisit; keine serienfremde Sonderfunktion.
  root.userData.api = Object.freeze({
    get waffentyp() {
      return 'Bantos-Kampfstange';
    },
    get trainingsgeraet() {
      return true;
    },
    get anzahl() {
      return 2;
    },
    get laenge() {
      return 0.76;
    },
  });

  root.userData.actions = [];

  return root;
}

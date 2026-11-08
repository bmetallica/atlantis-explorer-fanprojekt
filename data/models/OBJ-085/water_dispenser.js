// water_dispenser.js
// Lantean Freshwater Dispenser — antike, wandintegrierte Trinkwasser-Nische.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'water_dispenser',
  art: 'Wandobjekt',
  masse: '0,60 × 0,40 × 0,20 (B × H × T, m)',
  wohin: 'Wand / Nische',
  benutzen: 'INT_trinken → Trinkwasser entnehmen',
  lichter: 'LAMP_sensor (eisblau)',
  animation: 'Sensor pulsiert; bei Entnahme läuft ein Wasserstrahl ins Becken',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'water_dispenser';

  // --- Zustand
  let dispensing = false;
  let flowTime = 0;
  let hahnOff = false;
  let flowStrength = 0;
  let helligkeit = 0.45;
  let zeit = 0;
  let letzte = null;
  let letzteEntnahme = 0;

  // --- Materialien
  const matMetall = kit('wallDark');
  const matBronze = kit('copper');
  const matPerl = kit('pillar');

  const matSensor = new THREE.MeshStandardMaterial({
    name: 'sensorfläche',
    color: 0x071d2a,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.45,
    metalness: 0.45,
    roughness: 0.28,
  });

  const matSensorMark = new THREE.MeshStandardMaterial({
    name: 'sensorzeichen',
    color: 0x8ceaff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.25,
    metalness: 0.15,
    roughness: 0.2,
  });

  const matWasser = new THREE.MeshStandardMaterial({
    name: 'wasser',
    color: 0x55cbe8,
    emissive: 0x197d9e,
    emissiveIntensity: 0.45,
    metalness: 0.05,
    roughness: 0.12,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });

  const matStrahl = new THREE.MeshStandardMaterial({
    name: 'wasserstrahl',
    color: 0xb8f4ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.9,
    metalness: 0.02,
    roughness: 0.08,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });

  // --- Rückwand: liegt vollständig hinter der Objektebene
  const rueckwand = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.40, 0.030),
    matMetall
  );
  rueckwand.position.set(0, 0.20, 0.015);
  root.add(rueckwand);

  // Dunkle Nischenrückfläche
  const nischenrueck = new THREE.Mesh(
    new THREE.BoxGeometry(0.49, 0.32, 0.014),
    matMetall
  );
  nischenrueck.position.set(0, 0.20, 0.037);
  root.add(nischenrueck);

  // Seitenwände der Nische
  for (const x of [-0.2725, 0.2725]) {
    const seitenwand = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.34, 0.16),
      matMetall
    );
    seitenwand.position.set(x, 0.20, 0.11);
    root.add(seitenwand);

    // Schmale Innenrippen
    const rippe = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.27, 0.115),
      matBronze
    );
    rippe.position.set(x < 0 ? -0.248 : 0.248, 0.20, 0.105);
    root.add(rippe);
  }

  // Deck- und Bodenleiste der Nische
  const nischendecke = new THREE.Mesh(
    new THREE.BoxGeometry(0.49, 0.040, 0.16),
    matMetall
  );
  nischendecke.position.set(0, 0.38, 0.11);
  root.add(nischendecke);

  const nischenboden = new THREE.Mesh(
    new THREE.BoxGeometry(0.49, 0.040, 0.16),
    matMetall
  );
  nischenboden.position.set(0, 0.02, 0.11);
  root.add(nischenboden);

  // --- Bronze-Rahmen an der Vorderseite
  const rahmenLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.030, 0.40, 0.030),
    matBronze
  );
  rahmenLinks.position.set(-0.285, 0.20, 0.185);
  root.add(rahmenLinks);

  const rahmenRechts = rahmenLinks.clone();
  rahmenRechts.position.x = 0.285;
  root.add(rahmenRechts);

  const rahmenOben = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.030, 0.030),
    matBronze
  );
  rahmenOben.position.set(0, 0.385, 0.185);
  root.add(rahmenOben);

  const rahmenUnten = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.030, 0.030),
    matBronze
  );
  rahmenUnten.position.set(0, 0.015, 0.185);
  root.add(rahmenUnten);

  // Kleine bronzene Kreuzeckplatten an den oberen Rahmenecken
  for (const x of [-0.285, 0.285]) {
    const eckplatte = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.006, 8),
      matBronze
    );
    eckplatte.rotation.x = Math.PI / 2;
    eckplatte.position.set(x, 0.385, 0.197);
    root.add(eckplatte);
  }

  // --- Becken aus Perlgrau
  const beckenBoden = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.025, 0.105),
    matPerl
  );
  beckenBoden.position.set(0, 0.075, 0.11);
  root.add(beckenBoden);

  const beckenVorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.070, 0.018),
    matPerl
  );
  beckenVorder.position.set(0, 0.110, 0.159);
  root.add(beckenVorder);

  const beckenLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.070, 0.095),
    matPerl
  );
  beckenLinks.position.set(-0.211, 0.110, 0.1115);
  root.add(beckenLinks);

  const beckenRechts = beckenLinks.clone();
  beckenRechts.position.x = 0.211;
  root.add(beckenRechts);

  // Schmale bronzene Kante über der Beckenvorderseite
  const beckenKante = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.006, 0.022),
    matBronze
  );
  beckenKante.position.set(0, 0.148, 0.158);
  root.add(beckenKante);

  // Ruhige Wasseroberfläche im Becken
  const wasserflaeche = new THREE.Mesh(
    new THREE.BoxGeometry(0.386, 0.008, 0.074),
    matWasser
  );
  wasserflaeche.position.set(0, 0.128, 0.1115);
  root.add(wasserflaeche);

  // --- Auslauf: waagerechter Arm, Bogen und senkrechte Düse
  const auslaufArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.110, 12),
    matBronze
  );
  auslaufArm.rotation.x = Math.PI / 2;
  auslaufArm.position.set(0, 0.285, 0.090);
  root.add(auslaufArm);

  const auslaufBogen = new THREE.Mesh(
    new THREE.SphereGeometry(0.020, 12, 8),
    matBronze
  );
  auslaufBogen.position.set(0, 0.285, 0.145);
  root.add(auslaufBogen);

  const auslaufDuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.017, 0.050, 12),
    matPerl
  );
  auslaufDuse.position.set(0, 0.260, 0.145);
  root.add(auslaufDuse);

  // Kleine Düsenkante
  const duesenRand = new THREE.Mesh(
    new THREE.TorusGeometry(0.014, 0.003, 8, 16),
    matBronze
  );
  duesenRand.rotation.x = Math.PI / 2;
  duesenRand.position.set(0, 0.234, 0.145);
  root.add(duesenRand);

  // --- Leuchtende Sensorfläche, bündig in der Nischenrückwand
  const sensor = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.042, 0.016),
    matSensor
  );
  sensor.position.set(0, 0.332, 0.038);
  root.add(sensor);

  // Drei geometrische Sensorzeichen
  for (let i = 0; i < 3; i++) {
    const zeichen = new THREE.Mesh(
      new THREE.BoxGeometry(0.017, 0.004, 0.003),
      matSensorMark
    );
    zeichen.position.set(-0.034 + i * 0.034, 0.332, 0.047);
    root.add(zeichen);
  }

  // --- Wasserstrahl: wächst weich aus der Düse in das Becken
  const strahlHoehe = 0.102;
  const strahl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.011, strahlHoehe, 12),
    matStrahl
  );
  strahl.position.set(0, 0.183, 0.145);
  strahl.scale.y = 0.001;
  strahl.visible = false;
  root.add(strahl);

  // Kleiner Tropfen am Ende des Strahls
  const tropfen = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 10, 8),
    matStrahl
  );
  tropfen.scale.y = 1.4;
  tropfen.position.set(0, 0.133, 0.145);
  tropfen.visible = false;
  root.add(tropfen);

  // --- Kollisionskörper: verdeckt, wird vom Spiel ausgeblendet
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.40, 0.20),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  col.name = 'COL_nische';
  col.position.set(0, 0.20, 0.10);
  col.userData.aktiv = true;
  root.add(col);

  // --- Benutzen-Punkt vor dem Becken
  const use = new THREE.Object3D();
  use.name = 'INT_trinken';
  use.position.set(0, 0.25, 0.42);
  use.userData = {
    label: 'Trinkwasser entnehmen',
    radius: 0.8,
    resource: 'wasser',
  };
  root.add(use);

  // --- Lichtquelle
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_sensor';
  lamp.position.set(0, 0.32, 0.12);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 4,
    distance: 2.2,
  };
  root.add(lamp);

  // --- Animation
  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    if (dispensing) {
      flowTime -= d;
      if (flowTime <= 0) {
        dispensing = false;
      }
    }

    const zielHelligkeit = dispensing
      ? 1.8 + 0.25 * Math.sin(zeit * 7)
      : 0.42 + 0.14 * Math.sin(zeit * 2.3);

    helligkeit += (zielHelligkeit - helligkeit) * Math.min(1, d * 7);
    matSensor.emissiveIntensity = helligkeit;
    matSensorMark.emissiveIntensity = dispensing
      ? 1.7 + 0.35 * Math.sin(zeit * 8)
      : 0.85 + 0.18 * Math.sin(zeit * 2.3);

    const flussZiel = dispensing && !hahnOff ? 1 : 0;
    flowStrength += (flussZiel - flowStrength) * Math.min(1, d * 11);

    const sichtbareLaenge = Math.max(0.001, flowStrength);
    strahl.scale.y = sichtbareLaenge;
    strahl.visible = flowStrength > 0.025;

    // Der Strahl wächst nach unten aus der Düse.
    strahl.position.y = 0.233 - (strahlHoehe * sichtbareLaenge) / 2;
    strahl.position.y = Math.max(0.183, strahl.position.y);

    tropfen.visible = strahl.visible;
    tropfen.position.y = 0.133 + Math.sin(zeit * 12) * 0.0015;
    tropfen.scale.x = 0.8 + Math.sin(zeit * 9) * 0.12;
    tropfen.scale.z = 0.8 + Math.cos(zeit * 9) * 0.12;

    matStrahl.opacity = 0.74 + 0.12 * Math.sin(zeit * 10);
    matWasser.emissiveIntensity = 0.40 + 0.10 * Math.sin(zeit * 2.0);
  }

  // Selbstständige Animation über ein sichtbares Mesh
  sensor.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(now - letzte);
    }
    letzte = now;
  };

  root.userData.update = update;
  root.userData.resource = 'wasser';

  // --- Öffentliche API
  const api = {
    entnehmen() {
      if (hahnOff) {
        return {
          message: 'Der Wasserhahn ist geschlossen.',
          resource: null,
          amount: 0,
        };
      }

      dispensing = true;
      flowTime = 1.6;
      letzteEntnahme = zeit;

      return {
        message: 'Frisches Trinkwasser entnommen.',
        resource: 'wasser',
        amount: 1,
      };
    },
    hahnSchalten() {
      hahnOff = !hahnOff;
      if (hahnOff) {
        dispensing = false;
      }
      return {
        message: hahnOff
          ? 'Wasserhahn geschlossen.'
          : 'Wasserhahn geöffnet.',
        resource: null,
      };
    },
    hahnOeffnen() {
      if (!hahnOff) {
        return { message: 'Der Wasserhahn ist bereits geöffnet.', resource: null };
      }
      hahnOff = false;
      return { message: 'Wasserhahn geöffnet.', resource: null };
    },
    hahnSchliessen() {
      if (hahnOff) {
        return { message: 'Der Wasserhahn ist bereits geschlossen.', resource: null };
      }
      hahnOff = true;
      dispensing = false;
      return { message: 'Wasserhahn geschlossen.', resource: null };
    },
    get hahnOff() {
      return hahnOff;
    },
    get dispensing() {
      return dispensing;
    },
    get letzteEntnahme() {
      return letzteEntnahme;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'trinken',
      label: 'Frisches Trinkwasser entnehmen',
      run: () => api.entnehmen(),
    },
    {
      id: 'hahn_oeffnen',
      label: 'Wasserhahn öffnen',
      run: () => api.hahnOeffnen(),
    },
    {
      id: 'hahn_schliessen',
      label: 'Wasserhahn schließen',
      run: () => api.hahnSchliessen(),
    },
  ];

  return root;
}

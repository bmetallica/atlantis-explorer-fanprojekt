// alert_beacon.js
// Antiker Alarmierungs-Beacon / Code-Red-Wandleuchte
// Wandobjekt, Ursprung: Mitte der Unterkante der Rückseite (z = 0), Vorderseite nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'alert_beacon',
  art: 'Wandobjekt',
  masse: '0,80 × 0,12 × 0,12 (B × H × T, m)',
  wohin: 'Wand',
  benutzen: 'INT_bedienen → Alarm ein-/ausschalten',
  lichter: 'LAMP_beacon (weißblau normal, rot pulsierend im Alarm)',
  animation: 'Weicher Farbwechsel; im Alarm rote pulsierende Segmentfolge und Aufblenden des Lichts',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'alert_beacon';

  const breite = 0.80;
  const hoehe = 0.12;
  const tiefe = 0.12;

  const gehaeuseMat = kit('wallDark');
  const rueckMat = kit('wall');
  const perlMat = kit('pillar');
  const bronzeMat = kit('copper');

  const normalEmission = new THREE.Color(0x9fdcff);
  const normalBase = new THREE.Color(0xd9f6ff);
  const alarmEmission = new THREE.Color(0xff1408);
  const alarmBase = new THREE.Color(0x760703);
  const temporaereFarbe = new THREE.Color();
  const temporaereBasis = new THREE.Color();

  // Rückseitige Befestigungsplatte: liegt geschlossen an der Wand bei z = 0.
  const rueckplatte = new THREE.Mesh(
    new THREE.BoxGeometry(0.70, 0.105, 0.014),
    rueckMat
  );
  rueckplatte.position.set(0, hoehe / 2, 0.007);
  root.add(rueckplatte);

  // Hauptgehäuse; Bronze-Kappen überdecken die seitlichen Gehäuseenden.
  const gehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.116, 0.072),
    gehaeuseMat
  );
  gehaeuse.position.set(0, hoehe / 2, 0.036);
  root.add(gehaeuse);

  // Achtkantige bronzene Endkappen, entlang X ausgerichtet.
  for (const seite of [-1, 1]) {
    const kappe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.08, 8, 1, false),
      bronzeMat
    );
    kappe.rotation.z = Math.PI / 2;
    kappe.position.set(seite * 0.36, hoehe / 2, 0.060);
    root.add(kappe);
  }

  // Geschlossene Schrauben auf der Rückplatte.
  for (const x of [-0.31, 0.31]) {
    for (const y of [0.021, 0.099]) {
      const schraube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.006, 8),
        bronzeMat
      );
      schraube.rotation.x = Math.PI / 2;
      schraube.position.set(x, y, 0.017);
      root.add(schraube);
    }
  }

  // Drei eigenständige Leuchtsegmente mit jeweils eigener Materialinstanz.
  const segmentBreite = 0.192;
  const segmentAbstand = 0.021;
  const startX = -(segmentBreite + segmentAbstand);
  const segmente = [];

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (segmentBreite + segmentAbstand);

    const rahmen = new THREE.Mesh(
      new THREE.BoxGeometry(0.202, 0.082, 0.012),
      bronzeMat
    );
    rahmen.position.set(x, hoehe / 2, 0.076);
    root.add(rahmen);

    const linsenMat = new THREE.MeshStandardMaterial({
      name: 'beacon_lens',
      color: 0xd9f6ff,
      emissive: 0x9fdcff,
      emissiveIntensity: 1.0,
      metalness: 0.08,
      roughness: 0.18,
      transparent: true,
      opacity: 0.96,
    });

    const linse = new THREE.Mesh(
      new THREE.BoxGeometry(0.182, 0.062, 0.014),
      linsenMat
    );
    linse.position.set(x, hoehe / 2, 0.088);
    root.add(linse);

    const leuchtMat = new THREE.MeshStandardMaterial({
      name: 'beacon_glow',
      color: 0xd9f6ff,
      emissive: 0x9fdcff,
      emissiveIntensity: 1.4,
      metalness: 0.02,
      roughness: 0.22,
    });

    const leuchtfeld = new THREE.Mesh(
      new THREE.BoxGeometry(0.162, 0.042, 0.005),
      leuchtMat
    );
    leuchtfeld.position.set(x, hoehe / 2, 0.097);
    root.add(leuchtfeld);

    segmente.push({ linsenMat, leuchtMat });
  }

  // Schmale bronzene Zierleisten oben und unten.
  for (const y of [0.007, 0.113]) {
    const leiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.006, 0.006),
      bronzeMat
    );
    leiste.position.set(0, y, 0.075);
    root.add(leiste);
  }

  // Perlgraue Trennsteg zwischen den seitlichen Statusanzeigen und dem Leuchtfeld.
  const statusMat = new THREE.MeshStandardMaterial({
    name: 'beacon_status',
    color: 0xd9f6ff,
    emissive: 0x9fdcff,
    emissiveIntensity: 1.1,
    metalness: 0.05,
    roughness: 0.25,
  });

  for (const seite of [-1, 1]) {
    const markierung = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.018, 0.005),
      statusMat
    );
    markierung.position.set(seite * 0.292, hoehe / 2, 0.094);
    root.add(markierung);
  }

  // Kollisionskörper für die Wandmontage.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(breite, hoehe, tiefe),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  col.name = 'COL_beacon';
  col.position.set(0, hoehe / 2, tiefe / 2);
  col.userData.aktiv = true;
  root.add(col);

  // Benutzen-Punkt vor der Leuchte in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, hoehe / 2, 0.42);
  use.userData = {
    label: 'Alarm-Beacon bedienen',
    radius: 0.8,
  };
  root.add(use);

  // Dauerhaft eingeschaltete, farblich animierte Spiel-Lichtquelle.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_beacon';
  lamp.position.set(0, hoehe / 2, 0.13);
  lamp.userData = {
    color: '#9fdcff',
    intensity: 2.2,
    distance: 3.5,
  };
  root.add(lamp);

  let alarm = false;
  let zeit = 0;
  let letzte = null;
  let gemischterAlarmanteil = 0;
  let gemischteHelligkeit = 1.35;
  let gemischteLampHelligkeit = 2.2;

  function setzeAlarm(neu, ausloesen = true) {
    const alterZustand = alarm;
    alarm = !!neu;

    if (ausloesen && alterZustand !== alarm) {
      // Globales Alarm-Event für Lockdown, Durchsagen und andere Lichtanlagen.
      try {
        if (typeof globalThis.CustomEvent === 'function' &&
            typeof globalThis.dispatchEvent === 'function') {
          globalThis.dispatchEvent(new globalThis.CustomEvent('atlantis_alarm', {
            detail: {
              type: 'code_red',
              active: alarm,
              source: root.name,
            },
          }));
        }
      } catch (e) {
        // Die lokale Alarmfunktion bleibt auch ohne Event-Bus nutzbar.
      }
    }
  }

  function update(dt) {
    const schritt = Math.min(1, dt * 8);
    zeit += dt;

    const zielAlarmanteil = alarm ? 1 : 0;
    gemischterAlarmanteil +=
      (zielAlarmanteil - gemischterAlarmanteil) * schritt;

    const puls = alarm
      ? 0.5 + 0.5 * Math.sin(zeit * 7.2)
      : 0.9 + 0.1 * Math.sin(zeit * 1.7);

    const zielHelligkeit = alarm
      ? 1.65 + puls * 2.05
      : 1.25 + puls * 0.16;

    gemischteHelligkeit +=
      (zielHelligkeit - gemischteHelligkeit) * Math.min(1, dt * 10);

    temporaereFarbe
      .copy(normalEmission)
      .lerp(alarmEmission, gemischterAlarmanteil);

    temporaereBasis
      .copy(normalBase)
      .lerp(alarmBase, gemischterAlarmanteil);

    for (let i = 0; i < segmente.length; i++) {
      const phase = alarm
        ? Math.pow(Math.max(0, Math.sin(zeit * 7.2 - i * 0.9)), 1.25)
        : 0.94 + 0.06 * Math.sin(zeit * 1.7 - i * 0.55);

      const segmentFaktor = alarm ? 0.58 + phase * 0.82 : phase;

      const { linsenMat, leuchtMat } = segmente[i];

      linsenMat.emissive.copy(temporaereFarbe);
      linsenMat.color.copy(temporaereBasis);
      linsenMat.emissiveIntensity =
        gemischteHelligkeit * 0.72 * segmentFaktor;

      leuchtMat.emissive.copy(temporaereFarbe);
      leuchtMat.color.copy(temporaereBasis);
      leuchtMat.emissiveIntensity =
        gemischteHelligkeit * segmentFaktor;
    }

    statusMat.emissive.copy(temporaereFarbe);
    statusMat.color.copy(temporaereBasis);
    statusMat.emissiveIntensity =
      0.65 + gemischterAlarmanteil * (1.1 + puls * 1.4);

    const zielLampHelligkeit = alarm
      ? 4.0 + puls * 4.0
      : 2.0 + puls * 0.4;

    gemischteLampHelligkeit +=
      (zielLampHelligkeit - gemischteLampHelligkeit) * Math.min(1, dt * 10);

    lamp.userData.color = `#${temporaereFarbe.getHexString()}`;
    lamp.userData.intensity = gemischteLampHelligkeit;
    lamp.userData.distance = 3.5 + gemischterAlarmanteil * 1.8;
  }

  // Sichtbares Hauptgehäuse als Animationsträger.
  gehaeuse.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  // Öffentliche Update-Funktion für optionale Spiel- oder Testaufrufe.
  root.userData.update = update;

  setzeAlarm(opts.alarm === true, false);

  root.userData.api = {
    alarmAn() {
      setzeAlarm(true);
    },
    alarmAus() {
      setzeAlarm(false);
    },
    umschalten() {
      setzeAlarm(!alarm);
    },
    get alarm() {
      return alarm;
    },
    get status() {
      return alarm ? 'Code Red aktiv' : 'Normalbetrieb';
    },
  };

  root.userData.actions = [
    {
      id: 'alarm_an',
      label: 'Code Red aktivieren',
      run: () => root.userData.api.alarmAn(),
    },
    {
      id: 'alarm_aus',
      label: 'Alarm deaktivieren',
      run: () => root.userData.api.alarmAus(),
    },
    {
      id: 'alarm_umschalten',
      label: 'Alarmstatus umschalten',
      run: () => root.userData.api.umschalten(),
    },
  ];

  return root;
}

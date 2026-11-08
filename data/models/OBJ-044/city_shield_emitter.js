// OBJ-044: Stadtschild von Atlantis – einzelner Schild-Emitter
// Standobjekt: Ursprung = Mitte der Unterseite, Vorderseite nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_shield_emitter',
  art: 'Standobjekt',
  masse: '1,12 × 3,08 × 1,12 m',
  wohin: 'ATL-002 Kontrollraum / Kommandozentrale; ATL-036 Hauptstromraum; ATL-038 ZPM-Raum',
  benutzen: 'INT_schildsteuerung → Schild aktivieren, deaktivieren oder Status abfragen',
  lichter: 'LAMP_emitter (dauerhaft eisblau), pulsierende Energieknoten',
  animation: 'Bei aktivem Schild pulsieren Energiekuppel, Emitterringe und Lauflicht; im Standby bleibt der Knoten schwach beleuchtet',
  quelle: 'selbst gebaut nach OBJ-044 und Atlantis-Schild-Referenzen',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'city_shield_emitter';

  const startAktiv = opts.startAktiv !== false;
  const startEnergie = Number.isFinite(opts.energie)
    ? Math.max(0, Math.min(100, opts.energie))
    : 100;

  const matPearl = kit('pillar');
  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');

  const matShield = new THREE.MeshStandardMaterial({
    name: 'Emitter_schildenergie',
    color: 0x9be8ff,
    emissive: 0x35cfff,
    emissiveIntensity: 1.4,
    metalness: 0.08,
    roughness: 0.18,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const matRing = [];
  for (let i = 0; i < 3; i++) {
    matRing.push(new THREE.MeshStandardMaterial({
      name: `Emitter_lauflicht_${i}`,
      color: 0xc1f5ff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 1.2,
      metalness: 0.18,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    }));
  }

  const matStandby = new THREE.MeshStandardMaterial({
    name: 'Emitter_bereitschaft',
    color: 0x8a4d13,
    emissive: 0xff9d32,
    emissiveIntensity: 0.45,
    metalness: 0.3,
    roughness: 0.32,
  });

  const dummy = new THREE.Object3D();

  // ---------------------------------------------------------------------
  // Sockel: geschlossener, abgestufter Aufbau bis maximal 1,12 m Breite
  // ---------------------------------------------------------------------
  const sockelUnter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 0.12, 32),
    matWall
  );
  sockelUnter.position.y = 0.06;
  root.add(sockelUnter);

  const sockelMitte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.54, 0.10, 32),
    matPearl
  );
  sockelMitte.position.y = 0.17;
  root.add(sockelMitte);

  const sockelOber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.51, 0.14, 32),
    matDark
  );
  sockelOber.position.y = 0.29;
  root.add(sockelOber);

  const sockelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.455, 0.028, 8, 32),
    matRail
  );
  sockelRing.rotation.x = Math.PI / 2;
  sockelRing.position.y = 0.235;
  root.add(sockelRing);

  // Innerer Zentralkern verbindet alle Segmente und verhindert schwebende
  // Bauteile im Bereich der Säule.
  const kern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.225, 0.25, 2.16, 32),
    matDark
  );
  kern.position.y = 1.37;
  root.add(kern);

  // ---------------------------------------------------------------------
  // Segmentierte Säule: wiederholte Teile als InstancedMesh
  // ---------------------------------------------------------------------
  const segmentGeo = new THREE.CylinderGeometry(0.285, 0.305, 0.235, 32);
  const segmentePearl = new THREE.InstancedMesh(segmentGeo, matPearl, 4);
  const segmenteDark = new THREE.InstancedMesh(segmentGeo, matDark, 4);
  segmentePearl.name = 'Emitter_saeulenperlensegmente';
  segmenteDark.name = 'Emitter_saeulenstahlsegmente';
  segmentePearl.castShadow = true;
  segmenteDark.castShadow = true;

  let pearlIndex = 0;
  let darkIndex = 0;

  for (let i = 0; i < 8; i++) {
    dummy.position.set(0, 0.53 + i * 0.265, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();

    if (i % 2 === 0) {
      segmentePearl.setMatrixAt(pearlIndex++, dummy.matrix);
    } else {
      segmenteDark.setMatrixAt(darkIndex++, dummy.matrix);
    }
  }

  segmentePearl.instanceMatrix.needsUpdate = true;
  segmenteDark.instanceMatrix.needsUpdate = true;
  root.add(segmentePearl, segmenteDark);

  // ---------------------------------------------------------------------
  // Bronze-Zierleisten: zwölf Rippen je Ebene, in drei Ebenen
  // ---------------------------------------------------------------------
  const ripGeo = new THREE.BoxGeometry(0.07, 0.15, 0.12);
  const rippen = new THREE.InstancedMesh(ripGeo, matCopper, 36);
  rippen.name = 'Emitter_radialrippen';
  rippen.castShadow = true;

  let ripIndex = 0;
  for (let reihe = 0; reihe < 3; reihe++) {
    const y = 0.70 + reihe * 0.64;

    for (let spalte = 0; spalte < 12; spalte++) {
      const winkel = (spalte / 12) * Math.PI * 2 + reihe * 0.13;

      dummy.position.set(
        Math.sin(winkel) * 0.315,
        y,
        Math.cos(winkel) * 0.315
      );
      dummy.rotation.set(0, winkel, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      rippen.setMatrixAt(ripIndex++, dummy.matrix);
    }
  }

  rippen.instanceMatrix.needsUpdate = true;
  root.add(rippen);

  // ---------------------------------------------------------------------
  // Vorderseite: Bedien- und Statuskonsole, nach +Z ausgerichtet
  // ---------------------------------------------------------------------
  const frontRahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 1.48, 0.055),
    matCopper
  );
  frontRahmen.position.set(0, 1.36, 0.292);
  root.add(frontRahmen);

  const frontLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 1.36, 0.028),
    matStandby
  );
  frontLeiste.position.set(0, 1.36, 0.333);
  root.add(frontLeiste);

  // Kleines, sichtbares Statusfenster am oberen Ende der Frontleiste.
  const statusGehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.19, 0.07),
    matDark
  );
  statusGehaeuse.position.set(0, 1.93, 0.30);
  root.add(statusGehaeuse);

  const statusAnzeige = new THREE.Mesh(
    new THREE.BoxGeometry(0.245, 0.095, 0.018),
    matRing[0]
  );
  statusAnzeige.position.set(0, 1.93, 0.348);
  root.add(statusAnzeige);

  // Kleine Statusleuchten unterhalb des Fensters.
  const statusLichtGeo = new THREE.BoxGeometry(0.055, 0.055, 0.02);
  const statusLichter = new THREE.InstancedMesh(statusLichtGeo, matRing[1], 3);
  statusLichter.name = 'Emitter_statusleuchten';

  for (let i = 0; i < 3; i++) {
    dummy.position.set(-0.09 + i * 0.09, 1.77, 0.35);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    statusLichter.setMatrixAt(i, dummy.matrix);
  }

  statusLichter.instanceMatrix.needsUpdate = true;
  root.add(statusLichter);

  // ---------------------------------------------------------------------
  // Emitterkopf: geschlossene Energiekugel in einem tragenden Bronze-Käfig
  // ---------------------------------------------------------------------
  const kopfHals = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.38, 0.22, 32),
    matWall
  );
  kopfHals.position.y = 2.49;
  root.add(kopfHals);

  const kopfRingUnten = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.032, 8, 32),
    matRail
  );
  kopfRingUnten.rotation.x = Math.PI / 2;
  kopfRingUnten.position.y = 2.56;
  root.add(kopfRingUnten);

  // Die Kugel ist vollständig geschlossen und bildet den Energieknoten.
  const energieKugel = new THREE.Mesh(
    new THREE.SphereGeometry(0.275, 24, 16),
    matShield
  );
  energieKugel.position.y = 2.76;
  root.add(energieKugel);

  // Horizontale Energieringe: leicht wellenförmig durch die pulsierende
  // Skalierung, aber stets am Käfig befestigt.
  const ringMeshes = [];
  const ringRadien = [0.325, 0.305, 0.285];
  const ringHoehen = [2.62, 2.78, 2.94];

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadien[i], 0.013, 6, 32),
      matRing[i]
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ringHoehen[i];
    ring.userData.grundradius = ringRadien[i];
    ring.userData.phase = i * 1.55;
    ringMeshes.push(ring);
    root.add(ring);
  }

  // Vier vertikale Führungsstäbe, radial um den Energieknoten.
  const stabGeo = new THREE.BoxGeometry(0.045, 0.52, 0.045);
  const staebe = new THREE.InstancedMesh(stabGeo, matCopper, 4);
  staebe.name = 'Emitter_kuppelstaebe';
  staebe.castShadow = true;

  for (let i = 0; i < 4; i++) {
    const winkel = (i / 4) * Math.PI * 2 + Math.PI / 4;

    dummy.position.set(
      Math.sin(winkel) * 0.335,
      2.76,
      Math.cos(winkel) * 0.335
    );
    dummy.rotation.set(0, winkel, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();

    staebe.setMatrixAt(i, dummy.matrix);
  }

  staebe.instanceMatrix.needsUpdate = true;
  root.add(staebe);

  const spitze = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.16, 8),
    matRail
  );
  spitze.position.y = 3.0;
  root.add(spitze);

  // ---------------------------------------------------------------------
  // Kollision
  // ---------------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 3.08, 1.12)
  );
  col.name = 'COL_city_shield_emitter';
  col.position.set(0, 1.54, 0);
  col.userData.aktiv = true;
  root.add(col);

  // ---------------------------------------------------------------------
  // Benutzen-Punkt und dauerhaftes Licht
  // ---------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_schildsteuerung';
  use.position.set(0, 1.25, 0.84);
  use.userData = {
    label: 'Stadtschild-Emitter bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_emitter';
  lamp.position.set(0, 2.76, 0.28);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  root.add(lamp);

  // ---------------------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------------------
  let aktiv = startAktiv && startEnergie > 0;
  let energie = startEnergie;
  let zeit = 0;
  let letzte = null;
  let puls = aktiv ? 1 : 0;

  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    const zielPuls = aktiv && energie > 0 ? 1 : 0;
    puls += (zielPuls - puls) * Math.min(1, d * 4.2);

    const welle = 0.62 + 0.38 * Math.sin(zeit * 3.1);
    const atem = 0.9 + 0.1 * Math.sin(zeit * 1.35);

    matShield.emissiveIntensity =
      0.12 + puls * (1.35 + welle * 1.25) * atem;

    matShield.opacity =
      0.12 + puls * (0.28 + welle * 0.14) * atem;

    matStandby.emissiveIntensity =
      0.26 + puls * (0.7 + welle * 0.55);

    matRing[0].emissiveIntensity =
      0.25 + puls * (0.85 + welle * 0.8);

    matRing[1].emissiveIntensity =
      0.2 + puls * (0.65 + Math.sin(zeit * 4.2) * 0.25);

    matRing[2].emissiveIntensity =
      0.2 + puls * (0.65 + Math.sin(zeit * 4.2 + 1.2) * 0.25);

    for (let i = 0; i < ringMeshes.length; i++) {
      const ring = ringMeshes[i];
      const phase = ring.userData.phase;
      const wert = 0.5 + 0.5 * Math.sin(zeit * 3.1 - phase);
      const skala = 1 + puls * 0.035 * wert;
      ring.scale.setScalar(skala);
    }

    if (aktiv) {
      energie = Math.max(0, energie - d * 0.035);
      if (energie <= 0) {
        aktiv = false;
      }
    }

    energieKugel.rotation.y = zeit * 0.08 * (0.25 + puls * 0.75);
    energieKugel.rotation.x = Math.sin(zeit * 0.35) * 0.025 * puls;
  }

  kopfHals.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(now - letzte);
    }
    letzte = now;
  };

  root.userData.update = update;

  root.userData.api = {
    aktivieren() {
      if (energie > 0) {
        aktiv = true;
      }
      return this.status();
    },

    deaktivieren() {
      aktiv = false;
      return this.status();
    },

    umschalten() {
      if (aktiv) {
        aktiv = false;
      } else if (energie > 0) {
        aktiv = true;
      }
      return this.status();
    },

    energieSetzen(wert) {
      energie = Math.max(0, Math.min(100, Number(wert) || 0));
      if (energie <= 0) {
        aktiv = false;
      }
      return energie;
    },

    get aktiv() {
      return aktiv;
    },

    get energie() {
      return energie;
    },

    get energieverbrauch() {
      return aktiv ? 1 : 0.05;
    },

    status() {
      return {
        aktiv,
        energie,
        energieverbrauch: aktiv ? 1 : 0.05,
        empfangsraum: 'ATL-002 / ATL-036 / ATL-038',
        schildstatus: aktiv ? 'Stadtschild aktiv' : 'Stadtschild im Standby',
      };
    },
  };

  root.userData.actions = [
    {
      id: 'schild_aktivieren',
      label: 'Stadtschild aktivieren',
      run: () => root.userData.api.aktivieren(),
    },
    {
      id: 'schild_deaktivieren',
      label: 'Stadtschild deaktivieren',
      run: () => root.userData.api.deaktivieren(),
    },
    {
      id: 'schild_status',
      label: 'Schildstatus abfragen',
      run: () => root.userData.api.status(),
    },
  ];

  return root;
}

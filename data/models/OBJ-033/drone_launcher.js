import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'drone_launcher',
  art: 'Bodenobjekt',
  masse: 'Ø 6,00 × 0,40 m, geschlossene Plattform mit zentralem Startschacht',
  wohin: 'ATL-033 · Drohnen-Startplattform',
  benutzen: 'INT_bedienen → Klappen öffnen/schließen, Drohnenschwarm starten oder zurückrufen',
  lichter: 'LAMP_schacht (bernsteinfarben), segmentierte Startbefeuerung',
  animation: 'Acht radial ausfahrende Klappen, pulsierendes Schachtlicht, aufsteigender und landender Drohnenschwarm',
  quelle: 'selbst gebaut'
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'drone_launcher';

  const matDeck = new THREE.MeshStandardMaterial({
    name: 'plattformdeck',
    color: 0x252a30,
    metalness: 0.72,
    roughness: 0.48
  });

  const matRing = new THREE.MeshStandardMaterial({
    name: 'plattformring',
    color: 0x303843,
    metalness: 0.78,
    roughness: 0.4
  });

  const matSchacht = kit('wallDark');

  const matKlappe = new THREE.MeshStandardMaterial({
    name: 'klappenmetall',
    color: 0x353b43,
    metalness: 0.82,
    roughness: 0.36
  });

  const matBronze = kit('rail');

  const matSchachtGlow = new THREE.MeshStandardMaterial({
    name: 'schachtglut',
    color: 0x4d1b05,
    emissive: 0xff741f,
    emissiveIntensity: 0.08,
    metalness: 0.2,
    roughness: 0.4
  });

  const matIndikator = new THREE.MeshStandardMaterial({
    name: 'startbefeuerung',
    color: 0x6a2808,
    emissive: 0xff8b32,
    emissiveIntensity: 1.2,
    metalness: 0.35,
    roughness: 0.3
  });

  const matDrohne = new THREE.MeshStandardMaterial({
    name: 'drohnenrumpf',
    color: 0x343c47,
    metalness: 0.9,
    roughness: 0.3
  });

  const matDrohnenlicht = new THREE.MeshStandardMaterial({
    name: 'drohnenlicht',
    color: 0x10242b,
    emissive: 0x6fe3ff,
    emissiveIntensity: 3.2
  });

  // Geschlossener Rotationskörper mit hohlem Innerem.
  function annulus(rInner, rOuter, yBottom, yTop, material, segments = 72) {
    const points = [
      new THREE.Vector2(rOuter, yBottom),
      new THREE.Vector2(rOuter, yTop),
      new THREE.Vector2(rInner, yTop),
      new THREE.Vector2(rInner, yBottom),
      new THREE.Vector2(rOuter, yBottom)
    ];

    const mesh = new THREE.Mesh(
      new THREE.LatheGeometry(points, segments),
      material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  // Grundplatte: tiefster sichtbarer Punkt liegt bei y = 0.
  const basis = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 0.12, 72),
    matDeck
  );
  basis.position.y = 0.06;
  basis.castShadow = true;
  basis.receiveShadow = true;
  root.add(basis);

  // Mehrstufig abgesenkte, konzentrische Deckflächen.
  annulus(2.55, 3.0, 0.12, 0.27, matDeck);
  annulus(1.52, 2.55, 0.14, 0.31, matRing);
  annulus(1.17, 1.52, 0.19, 0.34, matDeck);

  // Innenwand des Startschachts.
  annulus(1.0, 1.17, 0.045, 0.34, matSchacht, 64);

  const schachtboden = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.045, 48),
    matSchacht
  );
  schachtboden.position.y = 0.1375;
  schachtboden.receiveShadow = true;
  root.add(schachtboden);

  // Leuchtfläche liegt unterhalb der geschlossenen Klappen.
  const glutScheibe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.94, 0.94, 0.018, 48),
    matSchachtGlow
  );
  glutScheibe.position.y = 0.166;
  root.add(glutScheibe);

  const glutRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.022, 8, 64),
    matSchachtGlow
  );
  glutRing.rotation.x = Math.PI / 2;
  glutRing.position.y = 0.18;
  root.add(glutRing);

  // Dezente bronzefarbene Kantenakzente.
  for (const [radius, y, tube] of [
    [2.72, 0.278, 0.021],
    [1.535, 0.318, 0.018]
  ]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 72),
      matBronze
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.castShadow = true;
    root.add(ring);
  }

  // Radiale Fugen auf der mittleren Deckstufe.
  const fugenGeo = new THREE.BoxGeometry(0.73, 0.012, 0.028);
  const fugen = new THREE.InstancedMesh(fugenGeo, matBronze, 12);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 2.035, 0.316, Math.sin(a) * 2.035);
    dummy.rotation.set(0, -a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    fugen.setMatrixAt(i, dummy.matrix);
  }

  fugen.instanceMatrix.needsUpdate = true;
  fugen.receiveShadow = true;
  root.add(fugen);

  // Kleine Schraubenköpfe auf dem äußeren Ring.
  const schrauben = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.042, 0.048, 0.03, 12),
    matBronze,
    12
  );

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    dummy.position.set(Math.cos(a) * 2.87, 0.285, Math.sin(a) * 2.87);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    schrauben.setMatrixAt(i, dummy.matrix);
  }

  schrauben.instanceMatrix.needsUpdate = true;
  schrauben.castShadow = true;
  root.add(schrauben);

  // Segmentierte bernsteinfarbene Startbefeuerung.
  const indicatorGeo = new THREE.BoxGeometry(0.04, 0.018, 0.16);
  const indicatoren = new THREE.InstancedMesh(indicatorGeo, matIndikator, 16);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    dummy.position.set(Math.cos(a) * 2.96, 0.284, Math.sin(a) * 2.96);
    dummy.rotation.set(0, -a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    indicatoren.setMatrixAt(i, dummy.matrix);
  }

  indicatoren.instanceMatrix.needsUpdate = true;
  root.add(indicatoren);

  // Bündige Kontrollplatte auf der Vorderseite (+Z).
  const kontrollplatte = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.022, 0.16),
    matBronze
  );
  kontrollplatte.position.set(0, 0.281, 2.24);
  kontrollplatte.castShadow = true;
  root.add(kontrollplatte);

  const kontrollLeuchte = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.012, 0.032),
    matIndikator
  );
  kontrollLeuchte.position.set(0, 0.298, 2.24);
  root.add(kontrollLeuchte);

  // Acht segmentförmige Klappen.
  // Lokale X-Achse zeigt radial nach außen; der Drehpunkt liegt am äußeren Rand.
  const klappenAnzahl = 8;
  const klappenRadius = 1.16;
  const klappenwinkel = (Math.PI * 2) / klappenAnzahl;
  const halbwinkel = klappenwinkel / 2 + 0.025;
  const form = new THREE.Shape();

  for (let i = 0; i <= 6; i++) {
    const a = -halbwinkel + (i / 6) * halbwinkel * 2;
    const x = klappenRadius * Math.cos(a) - klappenRadius;
    const y = klappenRadius * Math.sin(a);
    if (i === 0) form.moveTo(x, y);
    else form.lineTo(x, y);
  }

  for (let i = 6; i >= 0; i--) {
    const a = -halbwinkel + (i / 6) * halbwinkel * 2;
    const r = 0.055;
    form.lineTo(r * Math.cos(a) - klappenRadius, r * Math.sin(a));
  }

  form.closePath();

  const klappenGeo = new THREE.ExtrudeGeometry(form, {
    depth: 0.045,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1
  });
  klappenGeo.rotateX(-Math.PI / 2);

  const klappen = new THREE.InstancedMesh(
    klappenGeo,
    matKlappe,
    klappenAnzahl
  );
  klappen.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  klappen.castShadow = true;
  klappen.receiveShadow = true;
  klappen.frustumCulled = false;
  root.add(klappen);

  // Bronzefarbene Griffleisten auf den Klappen.
  const griffGeo = new THREE.BoxGeometry(0.55, 0.018, 0.032);
  const griffe = new THREE.InstancedMesh(
    griffGeo,
    matBronze,
    klappenAnzahl
  );
  griffe.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  griffe.castShadow = true;
  griffe.frustumCulled = false;
  root.add(griffe);

  // Mittlerer Verschlussdeckel; öffnet und sinkt gemeinsam mit den Klappen ab.
  const hubGruppe = new THREE.Group();
  root.add(hubGruppe);

  const hubDeckel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.055, 24),
    matKlappe
  );
  hubDeckel.position.y = 0.312;
  hubDeckel.castShadow = true;
  hubGruppe.add(hubDeckel);

  const hubStiel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.18, 16),
    matSchacht
  );
  hubStiel.position.y = 0.195;
  hubGruppe.add(hubStiel);

  // Kleine Drohnen für den aufsteigenden Schwarm.
  const anzahlDrohnen = 6;

  const drohnenRumpf = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.105, 0.19, 4, 8),
    matDrohne,
    anzahlDrohnen
  );

  const drohnenRotor = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.24, 0.022, 6, 24),
    matDrohne,
    anzahlDrohnen
  );

  const drohnenArme = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.49, 0.022, 0.03),
    matDrohne,
    anzahlDrohnen
  );

  const drohnenLicht = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.048, 10, 6),
    matDrohnenlicht,
    anzahlDrohnen
  );

  for (const mesh of [
    drohnenRumpf,
    drohnenRotor,
    drohnenArme,
    drohnenLicht
  ]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.visible = false;
    root.add(mesh);
  }

  // Einziger Kollisionskörper: die feste Plattform.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.4, 6.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  col.name = 'COL_plattform';
  col.position.y = 0.2;
  root.add(col);

  // Benutzen-Punkt vor der Kontrollplatte in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 0.85, 2.45);
  use.userData = {
    label: 'Drohnenstartrampe bedienen',
    radius: 0.8
  };
  root.add(use);

  // Dauerhaft vorhandene Lichtquelle; Intensität steigt beim Öffnen.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_schacht';
  lamp.position.set(0, 0.55, 0);
  lamp.userData = {
    color: '#ff7b28',
    intensity: 2,
    distance: 9
  };
  root.add(lamp);

  let zeit = 0;
  let letzte = null;
  let offenerZustand = false;
  let offeneMenge = 0;
  let schwarmPending = false;
  let schwarmStart = null;
  let landeStart = null;

  const drohnenDaten = Array.from({ length: anzahlDrohnen }, (_, i) => ({
    winkel: (i / anzahlDrohnen) * Math.PI * 2,
    versatz: 0.2 + (i % 3) * 0.065,
    hoehe: 6.8 + (i % 4) * 0.85,
    verzoegerung: i * 0.16
  }));

  const klappenDummy = new THREE.Object3D();
  const griffDummy = new THREE.Object3D();
  const lokalMatrix = new THREE.Matrix4();

  function setKlappen() {
    const radius = THREE.MathUtils.lerp(1.16, 2.31, offeneMenge);
    const y = 0.295;

    for (let i = 0; i < klappenAnzahl; i++) {
      const a = i * klappenwinkel;

      klappenDummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      klappenDummy.rotation.set(0, -a, 0);
      klappenDummy.scale.set(1, 1, 1);
      klappenDummy.updateMatrix();
      klappen.setMatrixAt(i, klappenDummy.matrix);

      // Griffleiste als lokaler Bestandteil der Klappe.
      lokalMatrix.makeTranslation(-0.6, 0.052, 0);
      griffDummy.position.set(0, 0, 0);
      griffDummy.rotation.set(0, 0, 0);
      griffDummy.scale.set(1, 1, 1);
      griffDummy.updateMatrix();
      lokalMatrix.multiply(griffDummy.matrix);

      const griffMatrix = klappenDummy.matrix.clone().multiply(lokalMatrix);
      griffe.setMatrixAt(i, griffMatrix);
    }

    hubGruppe.position.y = THREE.MathUtils.lerp(0, -0.22, offeneMenge);

    klappen.instanceMatrix.needsUpdate = true;
    griffe.instanceMatrix.needsUpdate = true;
  }

  function setDrohnen() {
    const aktiv = schwarmStart !== null || landeStart !== null;

    for (let i = 0; i < anzahlDrohnen; i++) {
      const d = drohnenDaten[i];
      let hoehe = 0;
      let skalenwert = 0.0001;

      if (landeStart !== null) {
        const p = THREE.MathUtils.clamp((zeit - landeStart) / 3.4, 0, 1);
        const eased = p * p * (3 - 2 * p);
        hoehe = d.hoehe * (1 - eased);
        skalenwert = p > 0.92 ? (1 - p) / 0.08 : 1;

        if (p >= 1) {
          landeStart = null;
          skalenwert = 0.0001;
        }
      } else if (schwarmStart !== null) {
        const p = THREE.MathUtils.clamp(
          (zeit - schwarmStart - d.verzoegerung) / 3.8,
          0,
          1
        );
        const eased = 1 - Math.pow(1 - p, 3);
        hoehe = d.hoehe * eased;
        skalenwert = THREE.MathUtils.clamp(p / 0.12, 0.0001, 1);
      }

      const orbit = aktiv
        ? Math.sin(zeit * 0.8 + i) * 0.065
        : 0;
      const radius = d.versatz + orbit;
      const x = Math.cos(d.winkel) * radius;
      const z = Math.sin(d.winkel) * radius;
      const y = 0.2 + hoehe;

      klappenDummy.position.set(x, y, z);
      klappenDummy.rotation.set(0, -d.winkel, 0);
      klappenDummy.scale.setScalar(skalenwert);
      klappenDummy.updateMatrix();
      drohnenRumpf.setMatrixAt(i, klappenDummy.matrix);

      klappenDummy.position.set(x, y + 0.12, z);
      klappenDummy.rotation.set(Math.PI / 2, -d.winkel, 0);
      klappenDummy.scale.setScalar(skalenwert);
      klappenDummy.updateMatrix();
      drohnenRotor.setMatrixAt(i, klappenDummy.matrix);

      klappenDummy.position.set(x, y + 0.12, z);
      klappenDummy.rotation.set(0, -d.winkel, 0);
      klappenDummy.scale.setScalar(skalenwert);
      klappenDummy.updateMatrix();
      drohnenArme.setMatrixAt(i, klappenDummy.matrix);

      klappenDummy.position.set(x, y - 0.11, z);
      klappenDummy.rotation.set(0, 0, 0);
      klappenDummy.scale.setScalar(skalenwert);
      klappenDummy.updateMatrix();
      drohnenLicht.setMatrixAt(i, klappenDummy.matrix);
    }

    drohnenRumpf.visible = aktiv;
    drohnenRotor.visible = aktiv;
    drohnenArme.visible = aktiv;
    drohnenLicht.visible = aktiv;

    drohnenRumpf.instanceMatrix.needsUpdate = true;
    drohnenRotor.instanceMatrix.needsUpdate = true;
    drohnenArme.instanceMatrix.needsUpdate = true;
    drohnenLicht.instanceMatrix.needsUpdate = true;
  }

  function update(dt) {
    const step = Math.min(1, Math.max(0, dt));
    zeit += step;

    const zielOffen = offenerZustand ? 1 : 0;
    offeneMenge +=
      (zielOffen - offeneMenge) * Math.min(1, step * 3.1);

    if (schwarmPending && offeneMenge > 0.78) {
      schwarmPending = false;
      schwarmStart = zeit;
      landeStart = null;
    }

    const puls = 0.9 + Math.sin(zeit * 3.1) * 0.1;

    matSchachtGlow.emissiveIntensity = THREE.MathUtils.lerp(
      0.08,
      4.5 * puls,
      offeneMenge
    );

    matIndikator.emissiveIntensity = THREE.MathUtils.lerp(
      1.1,
      3.2 * puls,
      offeneMenge
    );

    const lampZiel = 2 + offeneMenge * 12;
    lamp.userData.intensity +=
      (lampZiel - lamp.userData.intensity) * Math.min(1, step * 4);

    setKlappen();
    setDrohnen();
  }

  setKlappen();
  setDrohnen();

  basis.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  const api = {
    oeffnen() {
      offenerZustand = true;
    },

    schliessen() {
      offenerZustand = false;
    },

    umschalten() {
      offenerZustand = !offenerZustand;
    },

    starten() {
      offenerZustand = true;
      schwarmPending = true;
      schwarmStart = null;
      landeStart = null;
    },

    zurueckrufen() {
      schwarmPending = false;

      if (schwarmStart !== null || landeStart !== null) {
        schwarmStart = null;
        landeStart = zeit;
      }
    },

    get offen() {
      return offenerZustand;
    },

    get offeneMenge() {
      return offeneMenge;
    },

    get schwarmAktiv() {
      return schwarmPending || schwarmStart !== null || landeStart !== null;
    },

    get anzahlDrohnen() {
      return anzahlDrohnen;
    }
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.animation = {
    typ: 'radiale-klappen-und-drohnenschwarm',
    update
  };

  root.userData.actions = [
    {
      id: 'plattform-oeffnen',
      label: 'Startplattform öffnen',
      run: () => api.oeffnen()
    },
    {
      id: 'plattform-schliessen',
      label: 'Startplattform schließen',
      run: () => api.schliessen()
    },
    {
      id: 'schwarm-starten',
      label: 'Drohnenschwarm starten',
      run: () => api.starten()
    },
    {
      id: 'schwarm-zurueck',
      label: 'Drohnenschwarm zurückrufen',
      run: () => api.zurueckrufen()
    }
  ];

  if (opts && typeof opts.onCreated === 'function') {
    opts.onCreated(root);
  }

  return root;
}

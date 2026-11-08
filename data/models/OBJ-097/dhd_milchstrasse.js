// DHD der Milchstraßen-Bauart
// Standobjekt für Fremdwelten, ca. 6–8 m vor dem Stargate.
// Ursprung: Mitte der Unterseite, y = 0 ist der Boden, Bedienerseite = +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'dhd_milchstrasse',
  art: 'Standobjekt mit Funktionen',
  masse: 'ca. 1,30 × 1,05 × 1,24 (B × H × T, m)',
  wohin: 'Fremdwelten, 6–8 m vor dem Stargate',
  benutzen: 'INT_dhd → Stargate-Funktionen',
  lichter: 'keine zusätzliche Lichtquelle; rote Mitteltaste und orange leuchtende Glyphen',
  animation: 'Glyphen und Mitteltaste leuchten weich auf und ab; Tasten und Mitteltaste blinken kurz',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'dhd_milchstrasse';

  // --- Materialien
  const koerperMat = new THREE.MeshStandardMaterial({
    name: 'dhd_anthrazit',
    color: 0x3a3d42,
    metalness: 0.5,
    roughness: 0.55,
  });

  // Weiße Grundfarbe, damit die Instanzfarben der Tasten frei steuerbar sind.
  const tasteMat = new THREE.MeshStandardMaterial({
    name: 'dhd_tasten',
    color: 0xffffff,
    metalness: 0.42,
    roughness: 0.62,
  });

  const mittelMat = new THREE.MeshStandardMaterial({
    name: 'dhd_mitteltaste',
    color: 0xc50e16,
    emissive: 0xff1010,
    emissiveIntensity: 0.08,
    metalness: 0.18,
    roughness: 0.12,
  });

  // Unlit-Material: Die hellgrauen Glyphen wirken eingraviert und können
  // unabhängig vom Raumlicht farblich auf Orange geschaltet werden.
  const glyphMat = new THREE.MeshBasicMaterial({
    name: 'dhd_glyphen',
    color: 0xffffff,
    toneMapped: false,
    side: THREE.DoubleSide,
  });

  const dummy = new THREE.Object3D();

  // Flache, leicht zur Mitte ansteigende Kuppelfläche.
  // Rechnerisch: y = 0,300 - 0,22 r².
  function domeY(r) {
    const radius = Math.min(r, 0.5);
    return 0.3 - 0.22 * radius * radius;
  }

  // Oberflächenanstieg für die tangentiale Ausrichtung der Glyphen.
  function domeSteigung(r) {
    return 0.44 * r;
  }

  // --- Fünf eng zusammengewachsene, unten leicht ausgestellte Säulen
  const fussProfil = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.125, 0),
    new THREE.Vector2(0.121, 0.065),
    new THREE.Vector2(0.108, 0.31),
    new THREE.Vector2(0.097, 0.54),
    new THREE.Vector2(0.09, 0.62),
    new THREE.Vector2(0, 0.62),
  ];

  const fussGeo = new THREE.LatheGeometry(fussProfil, 20);
  const fuesse = new THREE.InstancedMesh(fussGeo, koerperMat, 5);
  fuesse.name = 'Fuss_saeulen';
  fuesse.castShadow = true;
  fuesse.receiveShadow = true;

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI * 0.5;
    dummy.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    fuesse.setMatrixAt(i, dummy.matrix);
  }
  fuesse.instanceMatrix.needsUpdate = true;
  root.add(fuesse);

  // Kompakter Kern schließt die Pilzwurzel zwischen den Säulen.
  const fussKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.142, 0.15, 0.62, 20),
    koerperMat,
  );
  fussKern.name = 'Fuss_kern';
  fussKern.position.y = 0.31;
  fussKern.castShadow = true;
  fussKern.receiveShadow = true;
  root.add(fussKern);

  // --- Konsolenschale, 8° zur Bedienerseite (+Z) geneigt
  const schaleGruppe = new THREE.Group();
  schaleGruppe.name = 'Schale_Gruppe';
  schaleGruppe.position.set(0, 0.62, 0);
  schaleGruppe.rotation.x = THREE.MathUtils.degToRad(8);
  root.add(schaleGruppe);

  // Geschlossenes Rotationsprofil:
  // Unterseite → Außenrand → glatter Randbereich → erhöhte Tastenfläche → Mitte.
  const schalenProfil = [
    new THREE.Vector2(0, 0.025),
    new THREE.Vector2(0.20, 0.018),
    new THREE.Vector2(0.40, 0.005),
    new THREE.Vector2(0.52, 0),
    new THREE.Vector2(0.58, 0.04),
    new THREE.Vector2(0.615, 0.095),
    new THREE.Vector2(0.62, 0.125),
    new THREE.Vector2(0.615, 0.155),
    new THREE.Vector2(0.59, 0.175),
    new THREE.Vector2(0.55, 0.205),
    new THREE.Vector2(0.52, 0.235),
    new THREE.Vector2(0.50, domeY(0.50)),
    new THREE.Vector2(0.48, domeY(0.48)),
    new THREE.Vector2(0.46, domeY(0.46)),
    new THREE.Vector2(0.42, domeY(0.42)),
    new THREE.Vector2(0.38, domeY(0.38)),
    new THREE.Vector2(0.34, domeY(0.34)),
    new THREE.Vector2(0.30, domeY(0.30)),
    new THREE.Vector2(0.24, domeY(0.24)),
    new THREE.Vector2(0.16, domeY(0.16)),
    new THREE.Vector2(0.12, domeY(0.12)),
    new THREE.Vector2(0, domeY(0)),
  ];

  const schale = new THREE.Mesh(
    new THREE.LatheGeometry(schalenProfil, 48),
    koerperMat,
  );
  schale.name = 'Konsolenschale';
  schale.castShadow = true;
  schale.receiveShadow = true;
  schaleGruppe.add(schale);

  // Äußerster Rand: Wulst-Krempe mit Rohrradius 0,06 m.
  const krempe = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.06, 10, 48),
    koerperMat,
  );
  krempe.name = 'Krempe';
  krempe.rotation.x = Math.PI / 2;
  krempe.position.y = 0.16;
  krempe.castShadow = true;
  krempe.receiveShadow = true;
  schaleGruppe.add(krempe);

  // --- Zwei flache Klammerbügel knapp über der Krempe
  // Jeder Bügel ist ein geschlossener Torus-Bogen mit frei stehenden,
  // gerundeten Enden. Die Bögen liegen flach knapp über dem Wulst.
  const buegelGeo = new THREE.TorusGeometry(0.575, 0.043, 10, 44, 2.1);
  const buegelKappenGeo = new THREE.SphereGeometry(0.043, 12, 8);

  function klammer(name, mitteWinkel) {
    // Torus liegt flach (x −90°), die Hülle dreht ihn um die Hochachse auf den Bogenanfang (Korrektur Claude)
    const huelle = new THREE.Group();
    huelle.name = name;
    huelle.rotation.y = mitteWinkel - 1.05;
    huelle.position.y = 0.255;
    const buegel = new THREE.Mesh(buegelGeo, koerperMat);
    buegel.rotation.x = -Math.PI / 2;
    buegel.castShadow = true;
    buegel.receiveShadow = true;
    huelle.add(buegel);
    schaleGruppe.add(huelle);

    for (const winkel of [mitteWinkel - 1.05, mitteWinkel + 1.05]) {
      const kappe = new THREE.Mesh(buegelKappenGeo, koerperMat);
      kappe.position.set(
        Math.cos(winkel) * 0.575,
        0.255,
        -Math.sin(winkel) * 0.575,
      );
      kappe.castShadow = true;
      schaleGruppe.add(kappe);
    }
  }

  klammer('Klammer_links', Math.PI);
  klammer('Klammer_rechts', 0);

  // --- Flache, geschlossene Trapezfelder
  // Jede Taste ist ein geschlossener, leicht angehobener Trapezkörper.
  // Sie liegt vollständig auf der Kuppelfläche und reicht nie über Radius 0,50 m.
  function tastenGeo(innenRadius, aussenRadius, innenBreite, aussenBreite) {
    const positionen = [];

    const halbInnen = (innenBreite * 0.5) / innenRadius;
    const halbAussen = (aussenBreite * 0.5) / aussenRadius;
    const teilungen = 2;

    const innen = [];
    const aussen = [];

    for (let i = 0; i <= teilungen; i++) {
      const t = i / teilungen;
      const winkel = -1 + t * 2;

      const ai = winkel * halbInnen;
      const ao = winkel * halbAussen;

      const pi = new THREE.Vector2(
        Math.cos(ai) * innenRadius,
        Math.sin(ai) * innenRadius,
      );
      const po = new THREE.Vector2(
        Math.cos(ao) * aussenRadius,
        Math.sin(ao) * aussenRadius,
      );

      innen.push({
        p: pi,
        oben: new THREE.Vector3(pi.x, domeY(innenRadius) + 0.010, pi.y),
        unten: new THREE.Vector3(pi.x, domeY(innenRadius) - 0.006, pi.y),
      });

      aussen.push({
        p: po,
        oben: new THREE.Vector3(po.x, domeY(aussenRadius) + 0.010, po.y),
        unten: new THREE.Vector3(po.x, domeY(aussenRadius) - 0.006, po.y),
      });
    }

    function dreieck(a, b, c) {
      positionen.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z,
      );
    }

    // Oberseite, Normale nach +Y.
    for (let i = 0; i < teilungen; i++) {
      dreieck(aussen[i].oben, innen[i].oben, innen[i + 1].oben);
      dreieck(aussen[i].oben, innen[i + 1].oben, aussen[i + 1].oben);
    }

    // Unterseite, Normale nach -Y.
    for (let i = 0; i < teilungen; i++) {
      dreieck(aussen[i].unten, aussen[i + 1].unten, innen[i + 1].unten);
      dreieck(aussen[i].unten, innen[i + 1].unten, innen[i].unten);
    }

    // Geschlossene Außen- und Innenwände.
    for (let i = 0; i < teilungen; i++) {
      dreieck(aussen[i].oben, aussen[i + 1].oben, aussen[i + 1].unten);
      dreieck(aussen[i].oben, aussen[i + 1].unten, aussen[i].unten);

      dreieck(innen[i].oben, innen[i].unten, innen[i + 1].unten);
      dreieck(innen[i].oben, innen[i + 1].unten, innen[i + 1].oben);
    }

    // Geschlossene Stirnseiten an beiden Enden des Trapezes.
    dreieck(aussen[0].oben, aussen[0].unten, innen[0].unten);
    dreieck(aussen[0].oben, innen[0].unten, innen[0].oben);

    const letzter = teilungen;
    dreieck(aussen[letzter].oben, innen[letzter].oben, innen[letzter].unten);
    dreieck(aussen[letzter].oben, innen[letzter].unten, aussen[letzter].unten);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positionen, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }

  const anzahlTasten = 19;

  // Äußerer Ring: Radius 0,30–0,48 m.
  // Innerer Ring: Radius 0,16–0,29 m.
  // Zwischen beiden Ringen bleibt eine Fuge von 1 cm.
  const aussenGeo = tastenGeo(0.30, 0.48, 0.080, 0.120);
  const innenGeo = tastenGeo(0.16, 0.29, 0.045, 0.072);

  const aussenTasten = new THREE.InstancedMesh(aussenGeo, tasteMat, anzahlTasten);
  const innenTasten = new THREE.InstancedMesh(innenGeo, tasteMat, anzahlTasten);

  aussenTasten.name = 'Tastenring_aussen';
  innenTasten.name = 'Tastenring_innen';

  aussenTasten.castShadow = true;
  aussenTasten.receiveShadow = true;
  innenTasten.castShadow = true;
  innenTasten.receiveShadow = true;

  const tastenInfos = [];

  for (let i = 0; i < anzahlTasten; i++) {
    const a = (i / anzahlTasten) * Math.PI * 2;

    // Das einzelne Trapezsegment ist um die X-Achse lokalisiert.
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, -a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    aussenTasten.setMatrixAt(i, dummy.matrix);

    // Der innere Ring ist um einen halben Tastenschritt versetzt.
    const ai = a + Math.PI / anzahlTasten;

    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, -ai, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    innenTasten.setMatrixAt(i, dummy.matrix);

    tastenInfos.push({
      n: i,
      a,
      r: 0.39,
      innen: false,
      skalierung: 0.9,
    });

    tastenInfos.push({
      n: anzahlTasten + i,
      a: ai,
      r: 0.225,
      innen: true,
      skalierung: 0.65,
    });
  }

  aussenTasten.instanceMatrix.needsUpdate = true;
  innenTasten.instanceMatrix.needsUpdate = true;
  schaleGruppe.add(aussenTasten, innenTasten);

  // --- Erhabene geometrische Glyphen
  // Vier Zeichenfamilien; jede Familie besitzt nur eine gemeinsame Geometrie.
  function glyphGeoErzeugen(familie) {
    const positionen = [];
    const hoehe = 0.005;

    function dreieck(a, b, c) {
      positionen.push(a[0], a[1], a[2]);
      positionen.push(b[0], b[1], b[2]);
      positionen.push(c[0], c[1], c[2]);
    }

    function strecke(ax, az, bx, bz, breite) {
      const dx = bx - ax;
      const dz = bz - az;
      const laenge = Math.hypot(dx, dz);

      if (laenge < 0.00001) return;

      const nx = -dz / laenge * breite * 0.5;
      const nz = dx / laenge * breite * 0.5;

      const e0 = [ax + nx, az + nz];
      const e1 = [bx + nx, bz + nz];
      const e2 = [bx - nx, bz - nz];
      const e3 = [ax - nx, az - nz];

      const b0 = [e0[0], 0, e0[1]];
      const b1 = [e1[0], 0, e1[1]];
      const b2 = [e2[0], 0, e2[1]];
      const b3 = [e3[0], 0, e3[2] ?? e3[1]];

      const t0 = [e0[0], hoehe, e0[1]];
      const t1 = [e1[0], hoehe, e1[1]];
      const t2 = [e2[0], hoehe, e2[1]];
      const t3 = [e3[0], hoehe, e3[1]];

      dreieck(b0, b1, b2);
      dreieck(b0, b2, b3);
      dreieck(t0, t2, t1);
      dreieck(t0, t3, t2);
      dreieck(b0, t0, t1);
      dreieck(b0, t1, b1);
      dreieck(b1, t1, t2);
      dreieck(b1, t2, b2);
      dreieck(b2, t2, t3);
      dreieck(b2, t3, b3);
      dreieck(b3, t3, t0);
      dreieck(b3, t0, b0);
    }

    if (familie === 0) {
      strecke(-0.037, -0.028, 0, 0.034, 0.008);
      strecke(0, 0.034, 0.037, -0.028, 0.008);
      strecke(-0.021, 0.007, 0.021, 0.007, 0.006);
    } else if (familie === 1) {
      strecke(-0.034, 0, 0, 0.035, 0.007);
      strecke(0, 0.035, 0.034, 0, 0.007);
      strecke(0.034, 0, 0, -0.035, 0.007);
      strecke(0, -0.035, -0.034, 0, 0.007);
      strecke(-0.011, 0, 0.011, 0, 0.006);
    } else if (familie === 2) {
      strecke(0, -0.039, 0, 0.024, 0.008);
      strecke(-0.037, 0.029, 0, 0.011, 0.008);
      strecke(0.037, 0.029, 0, 0.011, 0.008);
      strecke(-0.023, -0.015, 0.023, -0.015, 0.006);
    } else {
      const punkte = [];

      for (let i = 0; i < 8; i++) {
        const a = 0.15 + i * 0.61;
        punkte.push([Math.cos(a) * 0.034, Math.sin(a) * 0.034]);
      }

      for (let i = 0; i < punkte.length - 1; i++) {
        strecke(
          punkte[i][0], punkte[i][1],
          punkte[i + 1][0], punkte[i + 1][1],
          0.006,
        );
      }

      strecke(-0.031, -0.024, 0.034, 0.025, 0.006);
      strecke(-0.024, 0.025, 0.024, 0.025, 0.005);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positionen, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }

  const familienAnzahl = [10, 10, 9, 9];
  const glyphMeshes = [];

  for (let familie = 0; familie < 4; familie++) {
    const mesh = new THREE.InstancedMesh(
      glyphGeoErzeugen(familie),
      glyphMat,
      familienAnzahl[familie],
    );

    mesh.name = 'Glyphen_' + familie;
    schaleGruppe.add(mesh);
    glyphMeshes.push(mesh);
  }

  const glyphEintraege = new Array(38);
  const familienZaehler = [0, 0, 0, 0];

  const basis = new THREE.Matrix4();
  const xAchse = new THREE.Vector3();
  const yAchse = new THREE.Vector3();
  const zAchse = new THREE.Vector3();

  for (const info of tastenInfos) {
    const familie = info.n % 4;
    const instanz = familienZaehler[familie];
    familienZaehler[familie]++;

    const c = Math.cos(info.a);
    const s = Math.sin(info.a);
    const steigung = domeSteigung(info.r);
    const normLaenge = Math.sqrt(1 + steigung * steigung);

    // Lokale Glyphenebene:
    // X = tangential, Y = Oberflächennormale, Z = radial.
    xAchse.set(s, 0, -c).normalize();
    yAchse.set(
      steigung * c / normLaenge,
      1 / normLaenge,
      steigung * s / normLaenge,
    );
    zAchse.set(
      c / normLaenge,
      -steigung / normLaenge,
      s / normLaenge,
    );

    basis.makeBasis(xAchse, yAchse, zAchse);
    dummy.quaternion.setFromRotationMatrix(basis);

    dummy.position.set(
      c * info.r + yAchse.x * 0.016,
      domeY(info.r) + yAchse.y * 0.016,
      s * info.r + yAchse.z * 0.016,
    );

    dummy.scale.setScalar(info.skalierung);
    dummy.updateMatrix();
    glyphMeshes[familie].setMatrixAt(instanz, dummy.matrix);

    glyphEintraege[info.n] = {
      mesh: glyphMeshes[familie],
      index: instanz,
    };
  }

  for (const mesh of glyphMeshes) {
    mesh.instanceMatrix.needsUpdate = true;
  }

  // --- Rote Mitteltaste in einem Zahnkranz
  const mittelSockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.142, 0.146, 0.026, 28),
    koerperMat,
  );
  mittelSockel.name = 'Mitteltaste_Sockel';
  mittelSockel.position.y = domeY(0.13) + 0.004;
  mittelSockel.castShadow = true;
  mittelSockel.receiveShadow = true;
  schaleGruppe.add(mittelSockel);

  const zahnGeo = new THREE.BoxGeometry(0.025, 0.018, 0.026);
  const zaehne = new THREE.InstancedMesh(zahnGeo, koerperMat, 28);
  zaehne.name = 'Zahnkranz';
  zaehne.castShadow = true;

  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;

    dummy.position.set(
      Math.cos(a) * 0.122,
      domeY(0.122) + 0.018,
      Math.sin(a) * 0.122,
    );
    dummy.rotation.set(0, -a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    zaehne.setMatrixAt(i, dummy.matrix);
  }

  zaehne.instanceMatrix.needsUpdate = true;
  schaleGruppe.add(zaehne);

  const mitteltaste = new THREE.Mesh(
    new THREE.SphereGeometry(0.108, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mittelMat,
  );
  mitteltaste.name = 'Mitteltaste';
  mitteltaste.position.y = domeY(0.11) + 0.014;
  mitteltaste.castShadow = true;
  mitteltaste.receiveShadow = true;
  schaleGruppe.add(mitteltaste);

  // --- Kollisionskörper
  const colFuss = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.62, 0.58),
  );
  colFuss.name = 'COL_fuss';
  colFuss.position.y = 0.31;
  root.add(colFuss);

  const colSchale = new THREE.Mesh(
    new THREE.BoxGeometry(1.30, 0.46, 1.24),
  );
  colSchale.name = 'COL_schale';
  colSchale.position.y = 0.83;
  root.add(colSchale);

  // --- Benutzen-Punkt über der Schale auf der Bedienerseite
  const use = new THREE.Object3D();
  use.name = 'INT_dhd';
  use.position.set(0, 1.0, 0.34);
  use.userData = { label: 'DHD', radius: 1.0 };
  root.add(use);

  // --- Zustand und selbstlaufende Animation
  let leuchtenAn = false;
  let master = 0;
  let zeit = 0;
  let mittelLauf = 0;
  const tastenLauf = new Float32Array(38);

  const farbeAus = new THREE.Color(0xb8bcc2);
  const farbeAn = new THREE.Color(0xd96718);
  const farbeBlitz = new THREE.Color(0xff861b);
  const tastenAus = new THREE.Color(0x3a3d42);
  const tastenGedimmt = new THREE.Color(0x4a423b);
  const tastenBlitz = new THREE.Color(0xff861b);
  const tempFarbe = new THREE.Color();

  function glyphFarbeSetzen(n, farbe) {
    const eintrag = glyphEintraege[n];
    if (!eintrag) return;
    eintrag.mesh.setColorAt(eintrag.index, farbe);
  }

  function tastenFarbeSetzen(n, farbe) {
    if (n < 19) {
      aussenTasten.setColorAt(n, farbe);
    } else {
      innenTasten.setColorAt(n - 19, farbe);
    }
  }

  for (let i = 0; i < 38; i++) {
    glyphFarbeSetzen(i, farbeAus);
    tastenFarbeSetzen(i, tastenAus);
  }

  for (const mesh of glyphMeshes) {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  if (aussenTasten.instanceColor) aussenTasten.instanceColor.needsUpdate = true;
  if (innenTasten.instanceColor) innenTasten.instanceColor.needsUpdate = true;

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    const ziel = leuchtenAn ? 1 : 0;
    master += (ziel - master) * Math.min(1, step * 7);

    mittelLauf = Math.max(0, mittelLauf - step * 1.6);

    for (let i = 0; i < 38; i++) {
      tastenLauf[i] = Math.max(0, tastenLauf[i] - step * 4.5);

      tempFarbe.copy(farbeAus).lerp(farbeAn, master * 0.85);

      if (tastenLauf[i] > 0) {
        tempFarbe.lerp(farbeBlitz, Math.min(1, tastenLauf[i]));
      }

      glyphFarbeSetzen(i, tempFarbe);

      tempFarbe.copy(tastenAus).lerp(tastenGedimmt, master * 0.45);

      if (tastenLauf[i] > 0) {
        tempFarbe.lerp(tastenBlitz, Math.min(1, tastenLauf[i] * 0.9));
      }

      tastenFarbeSetzen(i, tempFarbe);
    }

    for (const mesh of glyphMeshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    if (aussenTasten.instanceColor) aussenTasten.instanceColor.needsUpdate = true;
    if (innenTasten.instanceColor) innenTasten.instanceColor.needsUpdate = true;

    const grundHelligkeit = 0.08 + master * 2.2;
    const blitz = mittelLauf > 0
      ? mittelLauf * (5.8 + Math.sin(zeit * 20) * 2.4)
      : 0;

    mittelMat.emissiveIntensity = grundHelligkeit + blitz;
  }

  mitteltaste.onBeforeRender = () => {
    const jetzt = performance.now() / 1000;

    if (update._letzte === undefined) {
      update._letzte = jetzt;
      return;
    }

    const dt = Math.min(Math.max(jetzt - update._letzte, 0), 0.1);
    update._letzte = jetzt;
    update(dt);
  };

  // --- Öffentliche API für das Stargate
  const api = {
    leuchten(an) {
      leuchtenAn = Boolean(an);
    },

    tasteDruecken(n) {
      const index = Number(n);

      if (!Number.isInteger(index) || index < 0 || index > 37) {
        return false;
      }

      tastenLauf[index] = 1;
      return true;
    },

    mitteltaste() {
      mittelLauf = 1;
    },

    get leuchtet() {
      return leuchtenAn;
    },
  };

  root.userData.api = api;
  root.userData.actions = [];
  root.userData.update = update;

  return root;
}

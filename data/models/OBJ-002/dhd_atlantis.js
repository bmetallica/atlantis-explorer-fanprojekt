// DHD (Dialing Home Device) für Stargate Atlantis — OBJ-002
// In ein hüfthohes Antiker-Kommandopult eingelassenes Kristallwählfeld.
// Ursprung: Mitte der Unterseite (tiefster Punkt y = 0), Vorderseite zeigt nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

const GLYPHEN = [
  'Aqessis', 'Leontian', 'Alara', 'Ca Po', 'Laylos', 'Eurumig',
  'Avarnin', 'Rygel', 'Azar', 'Aldana', 'Setas', 'Arami',
  'Danami', 'Unbekannte Konstellation', 'Robandos', 'Rochbe',
  'Zamithor', 'Sabido', 'Dware', 'Salna', 'Hamilto', 'Ekanam',
  'Tahan', 'Zeo', 'Rochi', 'Orce d', 'Bandu', 'Sandovi',
  'Blane', 'Amnuli', 'Salkind', 'Githin', 'Unbekannte Konstellation',
  'Rammor', 'Clavi', 'Hacemil'
];

export const steckbrief = {
  name: 'dhd_atlantis',
  art: 'Standobjekt / Einbauteil',
  masse: '1,40 × 1,00 × 0,70 (B × H × T, m); DHD-Feld 0,49 × 0,54 m',
  wohin: 'ATL-002 Kontrollraum / Kommandozentrale, in das zentrale Kommandopult eingelassen',
  benutzen: 'INT_anwaehlen → Menü zur Glyphenwahl, zum 8. Chevron, zum Sperren von Adressen und zur Torschildsteuerung',
  lichter: 'LAMP_panel (eisblau, 1,6), LAMP_chevron (bernstein, 1,2), LAMP_pult (eisblau, 0,8)',
  animation: 'Gewählte Glyphen leuchten weiß-blau auf; Bernsteinkristalle glimmen; bei aktiviertem Torschild pulsiert ein eisblauer Sechseckrand',
  quelle: 'selbst gebaut nach Atlantis-DHD-Setplan und Puddle-Jumper-Wählfeld'
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'dhd_atlantis';

  const bernstein = opts.farbe === 'bernstein' ? 0xff9a32 : 0xffa53d;

  // ------------------------------------------------------------
  // Pultmaße
  // ------------------------------------------------------------
  const pultBreite = 1.40;
  const pultTiefe = 0.70;
  const hoeheVorne = 0.90;
  const hoeheHinten = 1.00;
  const sockelHoehe = 0.12;

  // Die Oberseite fällt von hinten (+1,00 m) nach vorn (+0,90 m) ab.
  const neigung = Math.atan2(hoeheHinten - hoeheVorne, pultTiefe);
  const deckMitteY = (hoeheVorne + hoeheHinten) / 2;

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const korpusMat = kit('wall');
  const dunkelMat = kit('wallDark');
  const kupferMat = kit('copper');
  const leuchtMat = kit('glow');

  const glasMat = new THREE.MeshStandardMaterial({
    name: 'dhd_glas',
    color: 0x14212a,
    metalness: 0.16,
    roughness: 0.24,
    transparent: true,
    opacity: 0.9,
    emissive: 0x0b2029,
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide
  });

  const kristallMat = new THREE.MeshStandardMaterial({
    name: 'steuerkristall_chevron',
    color: 0x74300a,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.94,
    emissive: bernstein,
    emissiveIntensity: 1.05
  });

  const sperrMat = new THREE.MeshStandardMaterial({
    name: 'steuerkristall_sperre',
    color: 0x682207,
    metalness: 0.1,
    roughness: 0.24,
    transparent: true,
    opacity: 0.94,
    emissive: 0xff7c25,
    emissiveIntensity: 0.75
  });

  const haloMat = new THREE.MeshBasicMaterial({
    name: 'schild_aktiv',
    color: 0x91ebff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });

  // ------------------------------------------------------------
  // Geschlossener Pultkorpus: Seitenprofil -> Extrude entlang X
  // ------------------------------------------------------------
  // Das Shape wird in (u = -z, v = y) aufgebaut und anschließend
  // um +90° um Y gedreht. Dadurch liegt die Vorderseite bei +Z.
  const profil = new THREE.Shape();
  const profilPunkte = [
    [-pultTiefe / 2, sockelHoehe],
    [pultTiefe / 2, sockelHoehe],
    [pultTiefe / 2, hoeheHinten],
    [-pultTiefe / 2, hoeheVorne]
  ];

  profil.moveTo(profilPunkte[0][0], profilPunkte[0][1]);
  for (let i = 1; i < profilPunkte.length; i++) {
    profil.lineTo(profilPunkte[i][0], profilPunkte[i][1]);
  }
  profil.closePath();

  const korpusGeo = new THREE.ExtrudeGeometry(profil, {
    depth: pultBreite,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 1
  });
  korpusGeo.rotateY(Math.PI / 2);
  korpusGeo.translate(-pultBreite / 2, 0, 0);

  const korpus = new THREE.Mesh(korpusGeo, korpusMat);
  korpus.name = 'Pult_Korpus';
  root.add(korpus);

  // Eingezogener Sockel; tiefster Punkt liegt bei y = 0.
  const sockel = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, sockelHoehe, 0.50),
    dunkelMat
  );
  sockel.name = 'Pult_Sockel';
  sockel.position.set(0, sockelHoehe / 2, 0);
  root.add(sockel);

  const sockelKante = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.012, 0.52),
    kupferMat
  );
  sockelKante.name = 'Pult_Sockelkante';
  sockelKante.position.set(0, sockelHoehe - 0.006, 0);
  root.add(sockelKante);

  // ------------------------------------------------------------
  // Schräge Deckfläche. Alle Aufbauten liegen in X/Z und werden
  // gemeinsam mit dieser Gruppe geneigt, sodass die Vorderseite
  // nach +Z zeigt und dort tiefer liegt.
  // ------------------------------------------------------------
  const deck = new THREE.Group();
  deck.name = 'Pult_Oberflaeche_geneigt';
  deck.position.set(0, deckMitteY, 0);
  deck.rotation.x = neigung;
  root.add(deck);

  const leisteVorne = new THREE.Mesh(
    new THREE.BoxGeometry(pultBreite - 0.01, 0.012, 0.020),
    kupferMat
  );
  leisteVorne.name = 'Pult_Kupferleiste_Vorne';
  leisteVorne.position.set(0, 0.004, pultTiefe / 2 - 0.012);
  deck.add(leisteVorne);

  const leisteHinten = new THREE.Mesh(
    new THREE.BoxGeometry(pultBreite - 0.01, 0.012, 0.020),
    kupferMat
  );
  leisteHinten.name = 'Pult_Kupferleiste_Hinten';
  leisteHinten.position.set(0, 0.004, -pultTiefe / 2 + 0.012);
  deck.add(leisteHinten);

  for (const sx of [-1, 1]) {
    const seitenleiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.020, 0.012, pultTiefe - 0.02),
      kupferMat
    );
    seitenleiste.name = sx < 0 ? 'Pult_Kupferleiste_Links' : 'Pult_Kupferleiste_Rechts';
    seitenleiste.position.set(sx * (pultBreite / 2 - 0.012), 0.004, 0);
    deck.add(seitenleiste);
  }

  // Eisblaue Leuchtlinie vorne knapp unter der Kante.
  const frontLinie = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.014, 0.008),
    leuchtMat
  );
  frontLinie.name = 'Pult_Leuchtlinie';
  frontLinie.position.set(0, hoeheVorne - 0.045, pultTiefe / 2 + 0.004);
  root.add(frontLinie);

  // Flache Zierpaneele an den Seiten der Frontfläche.
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const paneel = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.26, 0.006),
        dunkelMat
      );
      paneel.name = `Pult_Zierpaneel_${sx > 0 ? 'rechts' : 'links'}_${i + 1}`;
      paneel.position.set(sx * (0.44 + i * 0.19), 0.56, pultTiefe / 2 + 0.003);
      root.add(paneel);

      const paneelLinie = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.008, 0.004),
        leuchtMat
      );
      paneelLinie.name = `Pult_Zierpaneel_Linie_${sx > 0 ? 'rechts' : 'links'}_${i + 1}`;
      paneelLinie.position.set(
        sx * (0.44 + i * 0.19),
        0.66,
        pultTiefe / 2 + 0.008
      );
      root.add(paneelLinie);
    }
  }

  // ------------------------------------------------------------
  // Linkes Kristallpaneel mit Leiterbahnen
  // ------------------------------------------------------------
  function leiterbahnTextur() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 320);
    gradient.addColorStop(0, '#0a2233');
    gradient.addColorStop(0.5, '#123a52');
    gradient.addColorStop(1, '#081724');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 320);

    ctx.strokeStyle = '#bfeaff';
    ctx.shadowColor = '#6fe3ff';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 13; i++) {
      let x = 18 + Math.floor(rnd() * 8) * 28;
      let y = 16;
      ctx.beginPath();
      ctx.moveTo(x, y);

      const segmente = 4 + Math.floor(rnd() * 5);
      for (let s = 0; s < segmente; s++) {
        if (s % 2 === 0) {
          y += 18 + rnd() * 20;
        } else {
          x += (rnd() - 0.5) * 90;
          x = Math.max(14, Math.min(242, x));
        }
        ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 3;
    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(16, 40 + i * 56);
      ctx.lineTo(240, 40 + i * 56);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  const panelGruppe = new THREE.Group();
  panelGruppe.name = 'DHD_Seitenpaneel';
  panelGruppe.position.set(-0.52, 0, 0);
  deck.add(panelGruppe);

  const panelRahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.006, 0.37),
    dunkelMat
  );
  panelRahmen.name = 'DHD_Seitenpaneel_Rahmen';
  panelRahmen.position.y = 0.001;
  panelGruppe.add(panelRahmen);

  const panelRand = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.006, 0.39),
    kupferMat
  );
  panelRand.name = 'DHD_Seitenpaneel_Bronzerand';
  panelRand.position.y = -0.001;
  panelGruppe.add(panelRand);

  const panelTextur = leiterbahnTextur();
  const panelMaterial = new THREE.MeshStandardMaterial({
    name: 'dhd_seitenpaneel',
    color: 0x8fb8c8,
    map: panelTextur,
    emissive: 0x6fe3ff,
    emissiveMap: panelTextur,
    emissiveIntensity: 0.55,
    metalness: 0.1,
    roughness: 0.35
  });

  const panelFlaeche = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.34),
    panelMaterial
  );
  panelFlaeche.name = 'DHD_Seitenpaneel_Flaeche';
  panelFlaeche.rotation.x = -Math.PI / 2;
  panelFlaeche.position.y = 0.0045;
  panelGruppe.add(panelFlaeche);

  // ------------------------------------------------------------
  // DHD-Feld: vollständiges, symmetrisches Sechseck aus 36
  // gleichseitigen Dreieckskacheln.
  // ------------------------------------------------------------
  const feld = new THREE.Group();
  feld.name = 'DHD_Waehlfeld';
  deck.add(feld);

  const seitenlaenge = 0.10;
  const dreieckshoehe = seitenlaenge * Math.sqrt(3) / 2;
  const reihen = [4, 6, 8, 8, 6, 4];
  const glasdicke = 0.004;
  const glasUnterkante = 0.003;
  const glasOberkante = glasUnterkante + glasdicke;

  const halbBreite = 0.24;
  const halbTiefe = 0.272;

  const hexPunkte = [
    new THREE.Vector3(-halbBreite, 0, 0),
    new THREE.Vector3(-halbBreite / 2, 0, halbTiefe),
    new THREE.Vector3(halbBreite / 2, 0, halbTiefe),
    new THREE.Vector3(halbBreite, 0, 0),
    new THREE.Vector3(halbBreite / 2, 0, -halbTiefe),
    new THREE.Vector3(-halbBreite / 2, 0, -halbTiefe)
  ];

  // Geschlossene sechseckige Rückplatte.
  const hexForm = new THREE.Shape();
  hexPunkte.forEach((p, i) => {
    const x = p.x;
    const y = -p.z;
    if (i === 0) hexForm.moveTo(x, y);
    else hexForm.lineTo(x, y);
  });
  hexForm.closePath();

  const plattenGeo = new THREE.ExtrudeGeometry(hexForm, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 1,
    curveSegments: 1
  });
  plattenGeo.rotateX(-Math.PI / 2);

  const rueckplatte = new THREE.Mesh(plattenGeo, dunkelMat);
  rueckplatte.name = 'DHD_Sechseckplatte';
  rueckplatte.position.y = -0.001;
  feld.add(rueckplatte);

  // Geschlossenes gleichseitiges Dreiecksprisma.
  function dreiecksPrisma(s, h, dicke) {
    const vertices = new Float32Array([
      -s / 2, dicke, -h / 3,
       s / 2, dicke, -h / 3,
       0,      dicke,  2 * h / 3,
      -s / 2, 0, -h / 3,
       s / 2, 0, -h / 3,
       0,      0,  2 * h / 3
    ]);

    const indices = [
      0, 2, 1, 3, 4, 5,
      0, 3, 1, 1, 3, 4, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  // Deterministische Ancient-Glyphen als Canvas-Texturen.
  function pseudoZufall(seed) {
    let s = seed + 0x6D2B79F5;
    return () => {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
  }

  function glyphenTextur(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    const rnd = pseudoZufall(index * 9173 + 47);

    ctx.clearRect(0, 0, 192, 192);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e4f8ff';
    ctx.shadowColor = '#6fe3ff';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 6;

    const anzahl = 2 + Math.floor(rnd() * 3);
    for (let strich = 0; strich < anzahl; strich++) {
      const punkte = [];
      let x = 40 + rnd() * 112;
      let y = 42 + rnd() * 108;
      punkte.push([x, y]);

      const teilstuecke = 2 + Math.floor(rnd() * 3);
      for (let p = 1; p <= teilstuecke; p++) {
        x = Math.max(34, Math.min(158, x + (rnd() - 0.5) * 64));
        y = Math.max(38, Math.min(154, y + (rnd() - 0.5) * 58));
        punkte.push([x, y]);
      }

      ctx.beginPath();
      ctx.moveTo(punkte[0][0], punkte[0][1]);
      for (let p = 1; p < punkte.length; p++) {
        ctx.lineTo(punkte[p][0], punkte[p][1]);
      }
      ctx.stroke();
    }

    if (index % 4 === 0) {
      ctx.beginPath();
      ctx.arc(
        74 + (rnd() - 0.5) * 44,
        88 + (rnd() - 0.5) * 38,
        8 + rnd() * 6,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (index % 5 === 0) {
      ctx.beginPath();
      ctx.moveTo(48, 136);
      ctx.lineTo(74, 142);
      ctx.lineTo(67, 119);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function glyphenFlaeche(punkte, nachOben) {
    const positions = [];
    const uvs = [];

    for (const p of punkte) positions.push(p.x, 0, p.z);
    if (nachOben) uvs.push(0, 0, 1, 0, 0.5, 1);
    else uvs.push(0, 1, 1, 1, 0.5, 0);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(nachOben ? [0, 2, 1] : [0, 1, 2]);
    geo.computeVertexNormals();
    return geo;
  }

  const felder = [];
  const kanten = [];
  const kantenSchluessel = new Set();

  function kanteHinzufuegen(a, b) {
    const ak = `${a.x.toFixed(5)},${a.z.toFixed(5)}`;
    const bk = `${b.x.toFixed(5)},${b.z.toFixed(5)}`;
    const key = [ak, bk].sort().join('|');
    if (kantenSchluessel.has(key)) return;
    kantenSchluessel.add(key);
    kanten.push([a.clone(), b.clone()]);
  }

  const prismenGeo = dreiecksPrisma(seitenlaenge, dreieckshoehe, glasdicke);
  const feldInstanz = new THREE.InstancedMesh(prismenGeo, glasMat, 36);
  feldInstanz.name = 'Kristallfelder_36';
  feldInstanz.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  feld.add(feldInstanz);

  const dummy = new THREE.Object3D();
  let feldIndex = 0;
  const feldTiefe = reihen.length * dreieckshoehe;

  for (let reihe = 0; reihe < reihen.length; reihe++) {
    const anzahl = reihen[reihe];
    const bandBreite = (anzahl / 2 + 0.5) * seitenlaenge;
    const startX = -bandBreite / 2;
    const zUnten = -feldTiefe / 2 + reihe * dreieckshoehe;
    const zOben = zUnten + dreieckshoehe;

    for (let k = 0; k < anzahl; k++) {
      const nachOben = k % 2 === 0;

      // Alternierende Kacheln; jede Kachel ist um s/2 versetzt.
      const x0 = startX + (k * seitenlaenge) / 2;
      const x1 = x0 + seitenlaenge;

      let punkte;
      let centroid;

      if (nachOben) {
        punkte = [
          new THREE.Vector3(x0, 0, zUnten),
          new THREE.Vector3(x1, 0, zUnten),
          new THREE.Vector3((x0 + x1) / 2, 0, zOben)
        ];
        centroid = new THREE.Vector3(
          (x0 + x1) / 2,
          0,
          zUnten + dreieckshoehe / 3
        );
      } else {
        punkte = [
          new THREE.Vector3(x0, 0, zOben),
          new THREE.Vector3(x1, 0, zOben),
          new THREE.Vector3((x0 + x1) / 2, 0, zUnten)
        ];
        centroid = new THREE.Vector3(
          (x0 + x1) / 2,
          0,
          zOben - dreieckshoehe / 3
        );
      }

      dummy.position.set(centroid.x, glasUnterkante, centroid.z);
      dummy.rotation.set(0, nachOben ? 0 : Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      feldInstanz.setMatrixAt(feldIndex, dummy.matrix);

      // Glyphenfläche leicht verkleinert, damit feine Fugen sichtbar bleiben.
      const shrunk = punkte.map((p) => p.clone().lerp(centroid, 0.055));
      const textur = glyphenTextur(feldIndex);

      const material = new THREE.MeshStandardMaterial({
        name: 'glyphe',
        color: 0x8fb8c8,
        map: textur,
        emissive: 0x6fe3ff,
        emissiveMap: textur,
        emissiveIntensity: 0.13,
        metalness: 0.05,
        roughness: 0.45,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: true
      });

      const glyphe = new THREE.Mesh(glyphenFlaeche(shrunk, nachOben), material);
      glyphe.name = `GLYPH_${String(feldIndex + 1).padStart(2, '0')}`;
      glyphe.position.y = glasOberkante + 0.0006;
      feld.add(glyphe);

      felder.push({
        index: feldIndex,
        name: GLYPHEN[feldIndex],
        material,
        intensitaet: 0.13,
        zielIntensitaet: 0.13,
        farbe: new THREE.Color(0x6fe3ff),
        zielFarbe: new THREE.Color(0x6fe3ff)
      });

      kanteHinzufuegen(punkte[0], punkte[1]);
      kanteHinzufuegen(punkte[1], punkte[2]);
      kanteHinzufuegen(punkte[2], punkte[0]);

      feldIndex++;
    }
  }

  feldInstanz.instanceMatrix.needsUpdate = true;

  // Feine bronzefarbene Fugen zwischen den Kristallsegmenten.
  const kantenGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 1, 5, 1, false);
  const kantenInstanz = new THREE.InstancedMesh(
    kantenGeo,
    kupferMat,
    kanten.length
  );
  kantenInstanz.name = 'Glyphenraster_Bronzefugen';

  const richtung = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const yAchse = new THREE.Vector3(0, 1, 0);

  kanten.forEach(([a, b], i) => {
    const av = new THREE.Vector3(a.x, glasOberkante - 0.0008, a.z);
    const bv = new THREE.Vector3(b.x, glasOberkante - 0.0008, b.z);
    const laenge = av.distanceTo(bv);

    richtung.subVectors(bv, av).normalize();
    quaternion.setFromUnitVectors(yAchse, richtung);
    dummy.position.copy(av).add(bv).multiplyScalar(0.5);
    dummy.quaternion.copy(quaternion);
    dummy.scale.set(1, laenge, 1);
    dummy.updateMatrix();

    kantenInstanz.setMatrixAt(i, dummy.matrix);
  });
  kantenInstanz.instanceMatrix.needsUpdate = true;
  feld.add(kantenInstanz);

  // Äußerer Sechseckrahmen.
  const randGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 1, 6, 1, false);
  const randInstanz = new THREE.InstancedMesh(randGeo, kupferMat, 6);
  randInstanz.name = 'Aussenrahmen_Bronze';

  for (let i = 0; i < hexPunkte.length; i++) {
    const a = hexPunkte[i];
    const b = hexPunkte[(i + 1) % hexPunkte.length];
    const av = new THREE.Vector3(a.x, 0.005, a.z);
    const bv = new THREE.Vector3(b.x, 0.005, b.z);
    const laenge = av.distanceTo(bv);

    richtung.subVectors(bv, av).normalize();
    quaternion.setFromUnitVectors(yAchse, richtung);
    dummy.position.copy(av).add(bv).multiplyScalar(0.5);
    dummy.quaternion.copy(quaternion);
    dummy.scale.set(1, laenge, 1);
    dummy.updateMatrix();

    randInstanz.setMatrixAt(i, dummy.matrix);
  }
  randInstanz.instanceMatrix.needsUpdate = true;
  feld.add(randInstanz);

  // ------------------------------------------------------------
  // Bernsteinfarbene Steuerkristalle
  // ------------------------------------------------------------
  function bipyramidenKristall(radius, ringY, obenY, untenY) {
    const vertices = [];
    const indices = [];

    vertices.push(0, obenY, 0);
    vertices.push(0, untenY, 0);

    for (let i = 0; i < 6; i++) {
      const w = (i / 6) * Math.PI * 2;
      vertices.push(Math.cos(w) * radius, ringY, Math.sin(w) * radius);
    }

    for (let i = 0; i < 6; i++) {
      const a = 2 + i;
      const b = 2 + ((i + 1) % 6);
      indices.push(0, b, a);
      indices.push(1, a, b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  const kristallGeo = bipyramidenKristall(0.023, 0.030, 0.062, 0.002);
  const kristallX = 0.285;

  const chevronKristall = new THREE.Mesh(kristallGeo, kristallMat);
  chevronKristall.name = 'Steuerkristall_Chevron_08';
  chevronKristall.position.set(kristallX, 0, 0);
  chevronKristall.rotation.y = Math.PI / 6;
  feld.add(chevronKristall);

  const sperrKristall = new THREE.Mesh(kristallGeo, sperrMat);
  sperrKristall.name = 'Steuerkristall_Sperre';
  sperrKristall.position.set(-kristallX, 0, 0);
  sperrKristall.rotation.y = -Math.PI / 6;
  feld.add(sperrKristall);

  const kristallSockelGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.010, 8);
  for (const sx of [-kristallX, kristallX]) {
    const kristallSockel = new THREE.Mesh(kristallSockelGeo, dunkelMat);
    kristallSockel.name = sx < 0
      ? 'Steuerkristall_Sperre_Sockel'
      : 'Steuerkristall_Chevron_Sockel';
    kristallSockel.position.set(sx, 0.005, 0);
    feld.add(kristallSockel);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.027, 0.0035, 5, 16),
      kupferMat
    );
    ring.name = sx < 0
      ? 'Steuerkristall_Sperre_Ring'
      : 'Steuerkristall_Chevron_Ring';
    ring.position.set(sx, 0.012, 0);
    ring.rotation.x = Math.PI / 2;
    feld.add(ring);
  }

  // Eisblauer Randpuls bei aktiviertem Torschild.
  const haloGruppe = new THREE.Group();
  haloGruppe.name = 'Torschild_Randpuls';
  feld.add(haloGruppe);

  const haloGeo = new THREE.BoxGeometry(1, 0.0025, 0.005);
  for (let i = 0; i < hexPunkte.length; i++) {
    const a = hexPunkte[i];
    const b = hexPunkte[(i + 1) % hexPunkte.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const laenge = Math.hypot(dx, dz);

    const streifen = new THREE.Mesh(haloGeo, haloMat);
    streifen.position.set((a.x + b.x) / 2, 0.010, (a.z + b.z) / 2);
    streifen.rotation.y = -Math.atan2(dz, dx);
    streifen.scale.x = laenge * 0.98;
    haloGruppe.add(streifen);
  }

  // ------------------------------------------------------------
  // Kollision: eine Box über dem gesamten Pultkorpus
  // ------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(pultBreite, hoeheHinten, pultTiefe),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  col.name = 'COL_pult';
  col.position.set(0, hoeheHinten / 2, 0);
  col.visible = false;
  root.add(col);

  // ------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_anwaehlen';
  use.position.set(0, 1.0, 0.45);
  use.userData = { label: 'DHD: Toradresse wählen', radius: 0.9 };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_panel';
  lamp.position.set(0, 0.99, 0);
  lamp.userData = { color: '#6fe3ff', intensity: 1.6, distance: 1.6 };
  root.add(lamp);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_chevron';
  lampAmber.position.set(kristallX, 0.99, 0);
  lampAmber.userData = { color: '#ffa33d', intensity: 1.2, distance: 1.2 };
  root.add(lampAmber);

  const lampPult = new THREE.Object3D();
  lampPult.name = 'LAMP_pult';
  lampPult.position.set(0, 0.85, 0.34);
  lampPult.userData = { color: '#6fe3ff', intensity: 0.8, distance: 1.1 };
  root.add(lampPult);

  // ------------------------------------------------------------
  // Zustand und Bedienlogik
  // ------------------------------------------------------------
  let auswahl = [];
  let aktivesChevron = 0;
  let schildAktiv = false;
  const sperrAdressen = new Set();
  let zeit = 0;
  let letzte = null;

  function adresseAusAuswahl() {
    return auswahl.map((i) => GLYPHEN[i]).join(' / ');
  }

  function adresseNormalisieren(adresse) {
    return String(adresse ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s*\/\s*/g, '_')
      .replace(/\s+/g, '_');
  }

  function waehlen(index) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= felder.length) return false;
    if (auswahl.includes(i)) return false;

    if (auswahl.length >= 8) auswahl.shift();
    auswahl.push(i);

    aktivesChevron = auswahl.length === 8 ? 8 : auswahl.length;
    return true;
  }

  function waehleChevron(chevron = 8) {
    if (Number(chevron) !== 8) return false;
    auswahl = [];
    aktivesChevron = 8;
    return true;
  }

  function abbrechen() {
    auswahl = [];
    aktivesChevron = 0;
    return true;
  }

  function sperren(adresse = adresseAusAuswahl()) {
    const norm = adresseNormalisieren(adresse);
    if (!norm) return false;
    sperrAdressen.add(norm);
    return true;
  }

  function sperreAufheben(adresse = adresseAusAuswahl()) {
    const norm = adresseNormalisieren(adresse);
    if (!norm) return false;
    return sperrAdressen.delete(norm);
  }

  function istGesperrt(adresse = adresseAusAuswahl()) {
    const norm = adresseNormalisieren(adresse);
    return !!norm && sperrAdressen.has(norm);
  }

  function schildSchalten(aktiv = !schildAktiv) {
    schildAktiv = !!aktiv;
    return schildAktiv;
  }

  function torAktivieren() {
    const adresse = adresseNormalisieren(adresseAusAuswahl());
    if (!adresse) return { ok: false, grund: 'Keine Toradresse gewählt' };
    if (sperrAdressen.has(adresse)) {
      return { ok: false, grund: 'Diese Toradresse ist gesperrt' };
    }
    if (auswahl.length !== 7 && auswahl.length !== 8) {
      return { ok: false, grund: 'Sieben oder acht Glyphen sind erforderlich' };
    }
    return {
      ok: true,
      adresse,
      chevron: auswahl.length === 8 ? 8 : aktivesChevron
    };
  }

  // ------------------------------------------------------------
  // Weiche, eigenständige Animation
  // ------------------------------------------------------------
  const normalFarbe = new THREE.Color(0x6fe3ff);
  const gewaehltFarbe = new THREE.Color(0xa7f2ff);
  const gesperrtFarbe = new THREE.Color(0xff8c32);

  function update(dt) {
    zeit += dt;
    const blend = Math.min(1, dt * 8);
    const aktuelleAdresse = adresseNormalisieren(adresseAusAuswahl());
    const adresseIstGesperrt =
      !!aktuelleAdresse && sperrAdressen.has(aktuelleAdresse);

    for (const feld of felder) {
      const gewaehlt = auswahl.includes(feld.index);

      if (gewaehlt && adresseIstGesperrt) {
        feld.zielFarbe.copy(gesperrtFarbe);
        feld.zielIntensitaet = 0.8 + Math.sin(zeit * 5.2) * 0.12;
      } else if (gewaehlt) {
        feld.zielFarbe.copy(gewaehltFarbe);
        feld.zielIntensitaet =
          1.7 + Math.sin(zeit * 5.2 - feld.index * 0.24) * 0.45;
      } else {
        feld.zielFarbe.copy(normalFarbe);
        feld.zielIntensitaet =
          0.13 + Math.sin(zeit * 1.8 - feld.index * 0.17) * 0.025;
      }

      feld.farbe.lerp(feld.zielFarbe, blend);
      feld.material.emissive.copy(feld.farbe);
      feld.intensitaet +=
        (feld.zielIntensitaet - feld.intensitaet) * blend;
      feld.material.emissiveIntensity = feld.intensitaet;
    }

    const kristallPuls = 1 + Math.sin(zeit * 3.1) * 0.1;
    kristallMat.emissiveIntensity =
      (schildAktiv ? 1.9 : 1.05) * kristallPuls;
    sperrMat.emissiveIntensity =
      (adresseIstGesperrt || sperrAdressen.size > 0 ? 1.6 : 0.75) *
      kristallPuls;

    glasMat.emissiveIntensity = schildAktiv
      ? 0.20 + Math.sin(zeit * 2.4) * 0.05
      : 0.08 + Math.sin(zeit * 1.7) * 0.015;

    panelMaterial.emissiveIntensity =
      0.55 + Math.sin(zeit * 1.4) * 0.12;

    const haloZiel = schildAktiv
      ? 0.68 + Math.sin(zeit * 4.1) * 0.2
      : 0;
    haloMat.opacity += (haloZiel - haloMat.opacity) * blend;
  }

  korpus.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API
  // ------------------------------------------------------------
  const api = {
    waehlen,
    waehleChevron,
    abbrechen,
    sperren,
    sperreAufheben,
    istGesperrt,
    schildSchalten,
    torAktivieren,
    torAnfordern: torAktivieren,
    get auswahl() { return [...auswahl]; },
    get auswahlText() { return adresseAusAuswahl(); },
    get aktivesChevron() { return aktivesChevron; },
    get schildAktiv() { return schildAktiv; },
    get sperrAdressen() { return [...sperrAdressen]; },
    get adresseGesperrt() { return istGesperrt(); }
  };
  root.userData.api = api;

  // ------------------------------------------------------------
  // Aktionsmenü am Benutzen-Punkt
  // ------------------------------------------------------------
  const actions = [];

  felder.forEach((feld) => {
    actions.push({
      id: `glyphe_${feld.index + 1}`,
      label: `${String(feld.index + 1).padStart(2, '0')} – ${feld.name} wählen`,
      run: () => api.waehlen(feld.index)
    });
  });

  actions.push(
    {
      id: 'chevron_08',
      label: 'Spezialsteuerung: 8. Chevron / Intergalaxie',
      run: () => api.waehleChevron(8)
    },
    {
      id: 'abbruch',
      label: 'Torwahl abbrechen',
      run: () => api.abbrechen()
    },
    {
      id: 'sperren',
      label: 'Aktuelle Toradresse für eingehende Anfragen sperren',
      run: () => api.sperren()
    },
    {
      id: 'sperre_aufheben',
      label: 'Sperre der aktuellen Toradresse aufheben',
      run: () => api.sperreAufheben()
    },
    {
      id: 'schild_ein',
      label: 'Torschild aktivieren',
      run: () => api.schildSchalten(true)
    },
    {
      id: 'schild_aus',
      label: 'Torschild deaktivieren',
      run: () => api.schildSchalten(false)
    },
    {
      id: 'aktivieren',
      label: 'Gewählte Toradresse anfordern',
      run: () => api.torAktivieren()
    }
  );

  root.userData.actions = actions;
  return root;
}

// OBJ-089: Botanischer Nährstoffmischer
// Wandgerät mit drei Nährstofftanks, Mischkammer, Dosierschläuchen und grünen Statusleuchten.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'nutrient_mixer',
  art: 'Wandobjekt',
  masse: '1,90 × 1,60 × 0,78 (B × H × T, m)',
  wohin: 'ATL-016 Botanik-Labor / ATL-017 Pflanzenkammer',
  benutzen: 'INT_bedienen → Dosierung starten, stoppen, Leistung ändern, Mischprofil wählen oder spülen',
  lichter: 'LAMP_status (grün, dauerhaft), LAMP_anzeige (eisblau, dauerhaft)',
  animation: 'Schlauchfluss und Anzeige laufen weich an; grüne Kanalleuchten pulsieren; Dosiertröpfchen wandern zur Mischkammer',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'nutrient_mixer';

  const perl = kit('pillar');
  const blau = kit('wallDark');
  const bronze = kit('copper');
  const silber = kit('wall');

  const glasMat = new THREE.MeshStandardMaterial({
    name: 'glas',
    color: 0xc6eef4,
    metalness: 0.04,
    roughness: 0.1,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  const schlauchMat = new THREE.MeshStandardMaterial({
    name: 'schlauch_huelle',
    color: 0x173c39,
    metalness: 0.25,
    roughness: 0.28,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });

  const weiss = new THREE.MeshStandardMaterial({
    name: 'Kunststoff_Behaelter',
    color: 0xe7ebe8,
    metalness: 0,
    roughness: 0.58,
  });

  const statusGrundMat = new THREE.MeshStandardMaterial({
    name: 'status_gruen',
    color: 0x287d43,
    emissive: 0x59ff84,
    emissiveIntensity: 0.32,
    roughness: 0.28,
  });

  const tropfenMat = new THREE.MeshStandardMaterial({
    name: 'naehrstoff_tropfen',
    color: 0xc9e867,
    emissive: 0x70ff55,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // --- Korpus: Rückseite bei z = 0, Vorderseite nach +Z.
  const korpus = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.6, 0.16), silber);
  korpus.position.set(0, 0.8, 0.08);
  root.add(korpus);

  const rueckplatte = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.38, 0.035), blau);
  rueckplatte.position.set(0, 0.8, 0.1775);
  root.add(rueckplatte);

  // Geschlossene Innenwanne als optische Tiefe vor der Rückplatte.
  const innenwanne = new THREE.Mesh(new THREE.BoxGeometry(1.73, 1.4, 0.06), blau);
  innenwanne.position.set(0, 0.8, 0.225);
  root.add(innenwanne);

  const frontblende = new THREE.Mesh(new THREE.BoxGeometry(1.71, 1.37, 0.035), blau);
  frontblende.position.set(0, 0.8, 0.2725);
  root.add(frontblende);

  // --- Perl-/Bronzefarbener Außenrahmen.
  const rahmenTeile = [
    [0, 1.545, 1.82, 0.07, 0.14],
    [0, 0.055, 1.82, 0.07, 0.14],
    [-0.885, 0.8, 0.07, 1.42, 0.14],
    [0.885, 0.8, 0.07, 1.42, 0.14],
  ];
  rahmenTeile.forEach(([x, y, w, h, d]) => {
    const teil = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bronze);
    teil.position.set(x, y, 0.27);
    root.add(teil);
  });

  // Schmale Perlleisten innen neben dem Rahmen.
  [-0.825, 0.825].forEach((x) => {
    const leiste = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.28, 0.035), perl);
    leiste.position.set(x, 0.8, 0.315);
    root.add(leiste);
  });

  // Befestigungsbolzen als InstancedMesh.
  const bolzen = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.018, 10),
    perl,
    12
  );
  const dummy = new THREE.Object3D();
  const bolzenPositionen = [
    [-0.82, 0.14], [0.82, 0.14], [-0.82, 1.46], [0.82, 1.46],
    [-0.46, 0.14], [0.46, 0.14], [-0.46, 1.46], [0.46, 1.46],
    [-0.82, 0.8], [0.82, 0.8], [-0.46, 0.8], [0.46, 0.8],
  ];
  bolzenPositionen.forEach(([x, y], i) => {
    dummy.position.set(x, y, 0.35);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bolzen.setMatrixAt(i, dummy.matrix);
  });
  bolzen.instanceMatrix.needsUpdate = true;
  root.add(bolzen);

  // --- Dynamische Anzeige mit Canvas-Textur.
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;

  const displayMat = new THREE.MeshStandardMaterial({
    name: 'anzeige',
    color: 0xffffff,
    map: textur,
    emissive: 0xffffff,
    emissiveMap: textur,
    emissiveIntensity: 0.9,
    metalness: 0.08,
    roughness: 0.28,
  });

  const displayGehaeuse = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.28, 0.13), perl);
  displayGehaeuse.position.set(0, 1.395, 0.275);
  root.add(displayGehaeuse);

  const display = new THREE.Mesh(new THREE.BoxGeometry(1.43, 0.23, 0.025), displayMat);
  display.position.set(0, 1.395, 0.353);
  root.add(display);

  const profilNamen = ['BLATTWACHSTUM', 'AUSGEWOGEN', 'FRUCHTBILDUNG'];
  const profile = [
    { name: profilNamen[0], werte: [0.5, 0.35, 0.15] },
    { name: profilNamen[1], werte: [0.4, 0.35, 0.25] },
    { name: profilNamen[2], werte: [0.25, 0.25, 0.5] },
  ];
  let profilIndex = 0;

  function zeichneAnzeige() {
    const anteile = aktuelleAnteile();
    ctx.fillStyle = '#061a22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#65d9ee';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    ctx.fillStyle = '#c2f7ff';
    ctx.font = 'bold 27px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('NUTRIENT MIX', 20, 29);

    ctx.fillStyle = '#75ff9c';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(power * 100)}%`, 618, 29);

    const spaltenX = [78, 285, 492];
    const kanalNamen = ['A', 'B', 'C'];
    const farben = ['#e6d45b', '#f0aa4a', '#8de66b'];

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = farben[i];
      ctx.font = 'bold 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(kanalNamen[i], spaltenX[i], 77);

      ctx.fillStyle = '#173744';
      ctx.fillRect(spaltenX[i] - 65, 98, 130, 12);
      ctx.fillStyle = farben[i];
      ctx.fillRect(spaltenX[i] - 65, 98, 130 * anteile[i], 12);

      ctx.fillStyle = '#bfeef4';
      ctx.font = '19px sans-serif';
      ctx.fillText(`${Math.round(anteile[i] * 100)}%`, spaltenX[i], 132);
    }
    textur.needsUpdate = true;
  }

  // --- Drei Nährstofftanks mit eigenständig animierter Flüssigkeit.
  const tankXs = [-0.54, 0, 0.54];
  const tankfluesse = [];
  const statusMats = [];
  const schlauchMats = [];
  const kanalLeitungen = [];
  const tropfen = [];

  const flüssigkeitsFarben = [0xb9ad35, 0xc99a37, 0x8fae3c];

  tankXs.forEach((x, index) => {
    const fluidMat = new THREE.MeshStandardMaterial({
      name: `naehrstoff_${'ABC'[index]}`,
      color: flüssigkeitsFarben[index],
      metalness: 0.02,
      roughness: 0.3,
      emissive: flüssigkeitsFarben[index],
      emissiveIntensity: 0.12,
    });
    tankfluesse.push(fluidMat);

    // Halterung verbindet den Tank sichtbar mit der Gerätewand.
    const halterung = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.34), bronze);
    halterung.position.set(x, 0.605, 0.42);
    root.add(halterung);

    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.62, 28),
      glasMat
    );
    tank.position.set(x, 0.925, 0.53);
    root.add(tank);

    const fluess = new THREE.Mesh(
      new THREE.CylinderGeometry(0.151, 0.151, 0.36, 28),
      fluidMat
    );
    fluess.position.set(x, 0.83, 0.53);
    root.add(fluess);

    const deckel = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.055, 28), bronze);
    deckel.position.set(x, 1.265, 0.53);
    root.add(deckel);

    const deckelInnen = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 24), perl);
    deckelInnen.position.set(x, 1.302, 0.53);
    root.add(deckelInnen);

    const bodenring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 28), perl);
    bodenring.position.set(x, 0.622, 0.53);
    bodenring.rotation.x = Math.PI / 2;
    root.add(bodenring);

    const tankanschluss = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.09, 14), bronze);
    tankanschluss.position.set(x, 0.585, 0.53);
    root.add(tankanschluss);

    // Kanalmarke auf der Tankvorderseite.
    const marke = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.105, 0.018), perl);
    marke.position.set(x, 0.84, 0.729);
    root.add(marke);

    const markenStreifen = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.012, 0.012),
      new THREE.MeshStandardMaterial({
        name: `kanal_${'ABC'[index]}`,
        color: flüssigkeitsFarben[index],
        emissive: flüssigkeitsFarben[index],
        emissiveIntensity: 0.65,
      })
    );
    markenStreifen.position.set(x, 0.84, 0.744);
    root.add(markenStreifen);

    const statusMat = statusGrundMat.clone();
    statusMat.name = `status_${'ABC'[index]}`;
    const status = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), statusMat);
    status.position.set(x, 1.115, 0.735);
    root.add(status);
    statusMats.push(statusMat);

    // Schlauch vom Tankboden zur gemeinsamen Mischkammer.
    const kurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.55, 0.53),
      new THREE.Vector3(x, 0.48, 0.64),
      new THREE.Vector3(x, 0.405, 0.72),
      new THREE.Vector3(x, 0.355, 0.70),
    ]);

    const huelle = new THREE.Mesh(
      new THREE.TubeGeometry(kurve, 32, 0.024, 8, false),
      schlauchMat
    );
    root.add(huelle);

    const leitungMat = new THREE.MeshStandardMaterial({
      name: `dosierleitung_${'ABC'[index]}`,
      color: 0x79d86d,
      emissive: 0x62ff55,
      emissiveIntensity: 0.12,
      roughness: 0.24,
      metalness: 0.08,
    });
    const leitung = new THREE.Mesh(
      new THREE.TubeGeometry(kurve, 32, 0.011, 7, false),
      leitungMat
    );
    root.add(leitung);
    schlauchMats.push(leitungMat);
    kanalLeitungen.push(kurve);

    // Die offenen Rohrenden werden durch Anschlüsse geschlossen.
    const anschlussOben = new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 8), bronze);
    anschlussOben.position.set(x, 0.55, 0.53);
    root.add(anschlussOben);

    const anschlussUnten = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), bronze);
    anschlussUnten.position.set(x, 0.355, 0.70);
    root.add(anschlussUnten);

    const tropf = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 7), tropfenMat);
    tropf.position.copy(kurve.getPointAt(0.5));
    root.add(tropf);
    tropfen.push(tropf);
  });

  // --- Geschlossene Mischkammer und zentraler Auslass.
  const mischkammer = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 1.34, 20), blau);
  mischkammer.position.set(0, 0.34, 0.70);
  mischkammer.rotation.z = Math.PI / 2;
  root.add(mischkammer);

  tankXs.forEach((x) => {
    const kollaring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 8, 20), bronze);
    kollaring.position.set(x, 0.34, 0.70);
    kollaring.rotation.y = Math.PI / 2;
    root.add(kollaring);
  });

  const auslass = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.2, 16), bronze);
  auslass.position.set(0, 0.225, 0.70);
  root.add(auslass);

  const auslassRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 8, 20), perl);
  auslassRing.position.set(0, 0.32, 0.70);
  auslassRing.rotation.x = Math.PI / 2;
  root.add(auslassRing);

  const auslassspitze = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.07, 16), perl);
  auslassspitze.position.set(0, 0.09, 0.70);
  auslassspitze.rotation.z = Math.PI;
  root.add(auslassspitze);

  // --- Füllstandsanzeige rechts.
  const füllstandHalterung = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.72, 0.055), blau);
  füllstandHalterung.position.set(0.79, 0.89, 0.32);
  root.add(füllstandHalterung);

  const füllstandRohr = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.57, 14),
    glasMat
  );
  füllstandRohr.position.set(0.79, 0.89, 0.363);
  root.add(füllstandRohr);

  const füllstandInnen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.42, 12),
    new THREE.MeshStandardMaterial({
      name: 'fuellstand_fluess',
      color: 0xd3bf44,
      emissive: 0x8d7420,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    })
  );
  füllstandInnen.position.set(0.79, 0.83, 0.363);
  root.add(füllstandInnen);

  const skala = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.042, 0.009, 0.012),
    bronze,
    7
  );
  for (let i = 0; i < 7; i++) {
    dummy.position.set(0.79, 0.63 + i * 0.087, 0.385);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(i % 2 === 0 ? 1 : 0.65, 1, 1);
    dummy.updateMatrix();
    skala.setMatrixAt(i, dummy.matrix);
  }
  dummy.scale.set(1, 1, 1);
  skala.instanceMatrix.needsUpdate = true;
  root.add(skala);

  // --- Drehbarer Wahlschalter für das Mischprofil.
  const schalterBasis = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.04, 20), bronze);
  schalterBasis.position.set(0.76, 0.43, 0.34);
  schalterBasis.rotation.x = Math.PI / 2;
  root.add(schalterBasis);

  const schalterZeigerGruppe = new THREE.Group();
  schalterZeigerGruppe.position.set(0.76, 0.43, 0.367);
  root.add(schalterZeigerGruppe);

  const schalterZeiger = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.013, 0.012), perl);
  schalterZeiger.position.x = 0.022;
  schalterZeigerGruppe.add(schalterZeiger);

  // --- Regal mit weißen Kunststoffflaschen links unten.
  const regal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.25), perl);
  regal.position.set(-0.65, 0.09, 0.39);
  root.add(regal);

  const regalLippe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.035, 0.018), bronze);
  regalLippe.position.set(-0.65, 0.1275, 0.515);
  root.add(regalLippe);

  const regalWinkel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.22), bronze);
  regalWinkel.position.set(-0.82, 0.05, 0.39);
  root.add(regalWinkel);

  const flaschenKoerper = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.047, 0.056, 0.18, 16),
    weiss,
    3
  );
  const flaschenHals = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.027, 0.04, 0.065, 14),
    weiss,
    3
  );
  const flaschenKappen = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.032, 14),
    bronze,
    3
  );

  [-0.77, -0.65, -0.53].forEach((x, i) => {
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(x, 0.20, 0.385);
    dummy.updateMatrix();
    flaschenKoerper.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 0.3225, 0.385);
    dummy.updateMatrix();
    flaschenHals.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 0.371, 0.385);
    dummy.updateMatrix();
    flaschenKappen.setMatrixAt(i, dummy.matrix);
  });

  flaschenKoerper.instanceMatrix.needsUpdate = true;
  flaschenHals.instanceMatrix.needsUpdate = true;
  flaschenKappen.instanceMatrix.needsUpdate = true;
  root.add(flaschenKoerper, flaschenHals, flaschenKappen);

  // --- Rückseitige Befestigungsprofile, vollständig innerhalb von z >= 0.
  [-0.62, 0.62].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.28, 0.025), blau);
    rail.position.set(x, 0.8, 0.014);
    root.add(rail);
  });

  // --- Kollisionskörper. Sichtbarkeit wird nicht verändert.
  const col = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.6, 0.78));
  col.name = 'COL_gehaeuse';
  col.position.set(0, 0.8, 0.39);
  root.add(col);

  // --- Benutzen-Punkt vor dem Gerät.
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.03, 1.02);
  use.userData = { label: 'Nährstoffmischer bedienen', radius: 0.9 };
  root.add(use);

  // --- Dauerhaft aktive Lichtquellen.
  const lampStatus = new THREE.Object3D();
  lampStatus.name = 'LAMP_status';
  lampStatus.position.set(0, 1.115, 0.79);
  lampStatus.userData = { color: '#63ff8a', intensity: 4.5, distance: 2.5 };
  root.add(lampStatus);

  const lampAnzeige = new THREE.Object3D();
  lampAnzeige.name = 'LAMP_anzeige';
  lampAnzeige.position.set(0, 1.395, 0.57);
  lampAnzeige.userData = { color: '#6fe3ff', intensity: 2.8, distance: 1.8 };
  root.add(lampAnzeige);

  // --- Zustand und Animation.
  let running = false;
  let power = 0.65;
  let flow = 0;
  let flushRemaining = 0;
  let time = 0;
  let last = null;
  let displayTimer = 0;

  function aktuelleAnteile() {
    if (flushRemaining > 0) return [1 / 3, 1 / 3, 1 / 3];
    return profile[profilIndex].werte;
  }

  function update(dt) {
    time += dt;
    displayTimer += dt;

    if (flushRemaining > 0) {
      flushRemaining = Math.max(0, flushRemaining - dt);
      if (flushRemaining === 0 && !running) flow = 0;
    }

    const targetFlow = running ? power : 0;
    flow += (targetFlow - flow) * Math.min(1, dt * 3.2);

    const ratios = aktuelleAnteile();
    const puls = 0.5 + 0.5 * Math.sin(time * 4.1);

    for (let i = 0; i < 3; i++) {
      const channelFlow = flow * ratios[i];

      statusMats[i].emissiveIntensity = 0.25 + channelFlow * (2.5 + puls * 1.2);
      schlauchMats[i].emissiveIntensity = 0.1 + channelFlow * (1.6 + puls * 0.75);
      tankfluesse[i].emissiveIntensity = 0.1 + channelFlow * 0.32;

      const t = (time * (0.22 + channelFlow * 0.8) + i * 0.31) % 1;
      tropfen[i].position.copy(kanalLeitungen[i].getPointAt(t));
      const s = channelFlow > 0.015 ? 0.65 + channelFlow * 0.65 : 0.001;
      tropfen[i].scale.setScalar(s);
    }

    const targetAngle = -0.9 + profilIndex * 0.9;
    const currentAngle = schalterZeigerGruppe.rotation.z;
    schalterZeigerGruppe.rotation.z +=
      (targetAngle - currentAngle) * Math.min(1, dt * 5);

    displayMat.emissiveIntensity = running || flushRemaining > 0
      ? 0.85 + puls * 0.38
      : 0.48;

    if (displayTimer >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      displayTimer = 0;
      zeichneAnzeige();
    }
  }

  frontblende.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) update(Math.min(now - last, 0.1));
    last = now;
  };

  zeichneAnzeige();

  // --- Öffentliche API.
  const api = {
    starten() {
      running = true;
    },
    stoppen() {
      running = false;
      flushRemaining = 0;
    },
    erhoehen() {
      power = Math.min(1, Math.round((power + 0.25) * 100) / 100);
    },
    verringern() {
      power = Math.max(0.25, Math.round((power - 0.25) * 100) / 100);
    },
    setLeistung(wert) {
      const zahl = Number(wert);
      if (Number.isFinite(zahl)) {
        power = Math.max(0.25, Math.min(1, Math.round(zahl * 100) / 100));
      }
    },
    spuelen() {
      flushRemaining = 2.6;
      running = true;
    },
    setProfil(index) {
      profilIndex = Math.max(0, Math.min(profile.length - 1, index));
    },
    profilWechseln() {
      profilIndex = (profilIndex + 1) % profile.length;
    },
    get an() {
      return running;
    },
    get leistung() {
      return power;
    },
    get fluss() {
      return flow;
    },
    get spuelt() {
      return flushRemaining > 0;
    },
    get profil() {
      return profile[profilIndex].name;
    },
    get anteile() {
      return aktuelleAnteile().slice();
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    { id: 'start', label: 'Dosierung starten', run: () => api.starten() },
    { id: 'stop', label: 'Dosierung stoppen', run: () => api.stoppen() },
    { id: 'mehr', label: 'Förderleistung erhöhen', run: () => api.erhoehen() },
    { id: 'weniger', label: 'Förderleistung verringern', run: () => api.verringern() },
    { id: 'profil', label: 'Mischprofil wechseln', run: () => api.profilWechseln() },
    { id: 'spuelen', label: 'Dosiersystem spülen', run: () => api.spuelen() },
  ];

  root.userData.update = update;
  return root;
}

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'society_console',
  art: 'Standobjekt',
  masse: 'ca. 2,86 × 2,52 × 2,42 (B × H × T, m)',
  wohin: 'ATL-020 – Gesellschaftsforschungs-Labor',
  benutzen: 'INT_bedienen → Strategie-Menü; INT_studium → Beobachtung und Lenkung',
  lichter: 'LAMP_bildschirme, LAMP_vertikal, LAMP_warm',
  animation: 'Live-Kartendarstellung mit Scanlinie, Telemetriekurve, pulsierende Tasten und Befehlsimpuls',
  quelle: 'selbst gebaut nach OBJ-025, angelehnt an die Referenzaufnahme',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'society_console';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------

  const matHull = kit('hull');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matRail = kit('rail');

  const matMetal = new THREE.MeshStandardMaterial({
    name: 'dunkles_Metall',
    color: 0x111a22,
    metalness: 0.84,
    roughness: 0.29,
  });

  const matPanel = new THREE.MeshStandardMaterial({
    name: 'Konsolenblech',
    color: 0x202c34,
    metalness: 0.72,
    roughness: 0.38,
  });

  const matBlack = new THREE.MeshStandardMaterial({
    name: 'tiefschwarzes_Glas',
    color: 0x03080c,
    metalness: 0.42,
    roughness: 0.16,
  });

  const matWarmGlow = new THREE.MeshStandardMaterial({
    name: 'warmer_Leuchtstreifen',
    color: 0xfff1cf,
    emissive: 0xffdfaa,
    emissiveIntensity: 1.8,
    roughness: 0.35,
  });

  const matBlueGlow = new THREE.MeshStandardMaterial({
    name: 'eisblauer_Leuchtstreifen',
    color: 0x8ceaff,
    emissive: 0x63dfff,
    emissiveIntensity: 1.25,
    roughness: 0.3,
  });

  const matCable = new THREE.MeshStandardMaterial({
    name: 'Kabelmantel',
    color: 0x090d10,
    metalness: 0.12,
    roughness: 0.78,
  });

  const matSeat = new THREE.MeshStandardMaterial({
    name: 'Sitzbezug',
    color: 0x141b22,
    metalness: 0.08,
    roughness: 0.72,
  });

  const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });

  // ------------------------------------------------------------------
  // Canvas-Texturen: Karte und Telemetrie
  // ------------------------------------------------------------------

  function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  const mapCanvas = makeCanvas(1024, 512);
  const mapCtx = mapCanvas.getContext('2d');
  const mapTexture = new THREE.CanvasTexture(mapCanvas);
  mapTexture.colorSpace = THREE.SRGBColorSpace;
  mapTexture.anisotropy = 4;

  const telemetryCanvas = makeCanvas(768, 448);
  const telemetryCtx = telemetryCanvas.getContext('2d');
  const telemetryTexture = new THREE.CanvasTexture(telemetryCanvas);
  telemetryTexture.colorSpace = THREE.SRGBColorSpace;
  telemetryTexture.anisotropy = 4;

  const mapMaterial = new THREE.MeshStandardMaterial({
    name: 'Kartenbildschirm',
    color: 0xffffff,
    map: mapTexture,
    emissive: 0xffffff,
    emissiveMap: mapTexture,
    emissiveIntensity: 0.88,
    metalness: 0.08,
    roughness: 0.23,
    side: THREE.FrontSide,
  });

  const telemetryMaterial = new THREE.MeshStandardMaterial({
    name: 'Vertikale_Telemetrie',
    color: 0xffffff,
    map: telemetryTexture,
    emissive: 0xffffff,
    emissiveMap: telemetryTexture,
    emissiveIntensity: 0.95,
    metalness: 0.06,
    roughness: 0.21,
    side: THREE.FrontSide,
  });

  // ------------------------------------------------------------------
  // Simulationszustand
  // ------------------------------------------------------------------

  let modus = 'beobachtung';
  let wetter = 'stabil';
  let versorgung = 'gleichverteilt';
  let befehle = 0;
  let moral = 50;
  let stabilitaet = 72;
  let befehlImpuls = 0;
  let zeit = 0;
  let letzteKarte = -1;
  let letzteTelemetrie = -1;
  let updateKarte = true;
  let updateTelemetrie = true;

  const wertFraktion = (v) => Math.max(0, Math.min(100, v));

  function zeichneKarte(t) {
    const w = mapCanvas.width;
    const h = mapCanvas.height;

    const g = mapCtx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, wetter === 'regen' ? '#0b3140' : wetter === 'dürre' ? '#303014' : '#0a302b');
    g.addColorStop(0.48, '#123d3b');
    g.addColorStop(1, '#071f2e');
    mapCtx.fillStyle = g;
    mapCtx.fillRect(0, 0, w, h);

    const nx = 18;
    const ny = 10;
    const cw = w / nx;
    const ch = h / ny;

    // Geländesektoren
    for (let row = 0; row < ny; row++) {
      for (let col = 0; col < nx; col++) {
        const n = Math.sin(col * 1.73 + row * 2.11) * 0.5
          + Math.cos(col * 0.47 - row * 1.17) * 0.3
          + Math.sin((col + row) * 0.31) * 0.2;
        const x = col * cw;
        const y = row * ch;
        const j = ((Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1 + 1) % 1;

        mapCtx.beginPath();
        mapCtx.moveTo(x + j * cw * 0.15, y + j * ch * 0.12);
        mapCtx.lineTo(x + cw * (0.78 + j * 0.12), y + j * ch * 0.18);
        mapCtx.lineTo(x + cw * (0.9 - j * 0.08), y + ch * (0.78 + j * 0.08));
        mapCtx.lineTo(x + j * cw * 0.08, y + ch * (0.84 - j * 0.14));
        mapCtx.closePath();

        const tone = Math.round(42 + (n + 1) * 22);
        mapCtx.fillStyle = `rgb(${Math.round(tone * 0.28)}, ${tone}, ${Math.round(tone * 0.82)})`;
        mapCtx.fill();

        mapCtx.strokeStyle = 'rgba(92,190,192,0.15)';
        mapCtx.lineWidth = 1;
        mapCtx.stroke();
      }
    }

    // Beobachtungsgitter
    mapCtx.strokeStyle = 'rgba(102,226,255,0.22)';
    mapCtx.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 12) {
      mapCtx.beginPath();
      mapCtx.moveTo(x, 0);
      mapCtx.lineTo(x, h);
      mapCtx.stroke();
    }
    for (let y = 0; y <= h; y += h / 6) {
      mapCtx.beginPath();
      mapCtx.moveTo(0, y);
      mapCtx.lineTo(w, y);
      mapCtx.stroke();
    }

    // Fluss
    mapCtx.beginPath();
    mapCtx.moveTo(-20, h * 0.28);
    mapCtx.bezierCurveTo(w * 0.22, h * 0.12, w * 0.28, h * 0.64, w * 0.52, h * 0.46);
    mapCtx.bezierCurveTo(w * 0.71, h * 0.31, w * 0.73, h * 0.76, w + 20, h * 0.67);
    mapCtx.strokeStyle = 'rgba(64,190,255,0.82)';
    mapCtx.lineWidth = 17;
    mapCtx.stroke();
    mapCtx.strokeStyle = 'rgba(172,234,255,0.62)';
    mapCtx.lineWidth = 5;
    mapCtx.stroke();

    // Satelliten im Gitter
    const satelliten = [
      [w * 0.15, h * 0.20],
      [w * 0.54, h * 0.28],
      [w * 0.84, h * 0.51],
    ];
    for (const [sx, sy] of satelliten) {
      mapCtx.strokeStyle = 'rgba(255,214,136,0.72)';
      mapCtx.lineWidth = 2;
      mapCtx.beginPath();
      mapCtx.arc(sx, sy, 18 + Math.sin(t * 2.2) * 4, 0, Math.PI * 2);
      mapCtx.stroke();
      mapCtx.fillStyle = '#ffe1a0';
      mapCtx.beginPath();
      mapCtx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      mapCtx.fill();
    }

    // Zwei Städte
    const staedte = [
      { x: w * 0.29, y: h * 0.61, name: 'TERA' },
      { x: w * 0.72, y: h * 0.39, name: 'NARA' },
    ];

    for (let i = 0; i < staedte.length; i++) {
      const s = staedte[i];
      mapCtx.strokeStyle = i === 0 ? '#8ffff1' : '#ffcf75';
      mapCtx.fillStyle = i === 0 ? '#8ffff1' : '#ffcf75';
      mapCtx.lineWidth = 3;
      mapCtx.beginPath();
      mapCtx.arc(s.x, s.y, 13, 0, Math.PI * 2);
      mapCtx.stroke();
      mapCtx.beginPath();
      mapCtx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      mapCtx.fill();

      mapCtx.font = 'bold 18px sans-serif';
      mapCtx.textAlign = 'center';
      mapCtx.fillStyle = '#dffcff';
      mapCtx.fillText(s.name, s.x, s.y - 22);
    }

    // Wetterlage
    if (wetter === 'regen') {
      mapCtx.strokeStyle = 'rgba(137,218,255,0.55)';
      mapCtx.lineWidth = 2;
      for (let i = 0; i < 42; i++) {
        const x = (i * 97) % w;
        const y = (i * 53 + t * 130) % h;
        mapCtx.beginPath();
        mapCtx.moveTo(x, y);
        mapCtx.lineTo(x - 7, y + 19);
        mapCtx.stroke();
      }
    } else if (wetter === 'dürre') {
      mapCtx.fillStyle = 'rgba(255,177,54,0.18)';
      mapCtx.fillRect(w * 0.48, h * 0.44, w * 0.44, h * 0.43);
    }

    // Ressourcenumleitung
    if (versorgung === 'küste') {
      mapCtx.strokeStyle = '#ffb95f';
      mapCtx.lineWidth = 5;
      mapCtx.setLineDash([12, 8]);
      mapCtx.beginPath();
      mapCtx.moveTo(staedte[0].x, staedte[0].y);
      mapCtx.quadraticCurveTo(w * 0.53, h * 0.22, staedte[1].x, staedte[1].y);
      mapCtx.stroke();
      mapCtx.setLineDash([]);
    }

    // Scanlinie
    const scanY = ((t * 0.075) % 1) * h;
    const scanGradient = mapCtx.createLinearGradient(0, scanY - 18, 0, scanY + 18);
    scanGradient.addColorStop(0, 'rgba(100,230,255,0)');
    scanGradient.addColorStop(0.5, 'rgba(100,230,255,0.32)');
    scanGradient.addColorStop(1, 'rgba(100,230,255,0)');
    mapCtx.fillStyle = scanGradient;
    mapCtx.fillRect(0, scanY - 18, w, 36);
    mapCtx.fillStyle = 'rgba(140,245,255,0.85)';
    mapCtx.fillRect(0, scanY, w, 1.5);

    mapCtx.textAlign = 'left';
    mapCtx.font = 'bold 20px sans-serif';
    mapCtx.fillStyle = '#c9fbff';
    mapCtx.fillText('SUBSPACE OBSERVATION GRID / CIV-02', 24, 34);

    mapCtx.font = '16px sans-serif';
    mapCtx.fillStyle = '#8bdde7';
    mapCtx.fillText(`MODUS: ${modus.toUpperCase()}`, 24, 58);
    mapCtx.fillText(`BEFEHLE: ${befehle}   STABILITÄT: ${Math.round(stabilitaet)}%`, 24, 82);

    mapCtx.textAlign = 'right';
    mapCtx.fillStyle = '#9debf1';
    mapCtx.fillText('LIVE  •  12.440 KM', w - 24, 34);

    mapTexture.needsUpdate = true;
  }

  function zeichneTelemetrie(t) {
    const w = telemetryCanvas.width;
    const h = telemetryCanvas.height;

    telemetryCtx.fillStyle = '#061018';
    telemetryCtx.fillRect(0, 0, w, h);

    telemetryCtx.strokeStyle = 'rgba(89,214,236,0.16)';
    telemetryCtx.lineWidth = 1;
    for (let y = 0; y < h; y += 28) {
      telemetryCtx.beginPath();
      telemetryCtx.moveTo(0, y);
      telemetryCtx.lineTo(w, y);
      telemetryCtx.stroke();
    }

    telemetryCtx.fillStyle = '#82e9f5';
    telemetryCtx.font = 'bold 25px sans-serif';
    telemetryCtx.fillText('CIVILISATION CONTROL', 30, 45);

    telemetryCtx.fillStyle = '#3a8c99';
    telemetryCtx.font = '17px sans-serif';
    telemetryCtx.fillText('SUBSPACE LINK / PLANETARY COMMAND ARRAY', 30, 73);

    const staedte = [
      {
        name: 'TERA',
        x: 40,
        wert: wertFraktion(stabilitaet + 7),
        farbe: '#6fe3ff',
      },
      {
        name: 'NARA',
        x: 390,
        wert: wertFraktion(
          stabilitaet - 4 + (wetter === 'regen' ? 8 : wetter === 'dürre' ? -8 : 0),
        ),
        farbe: '#ffca72',
      },
    ];

    for (const s of staedte) {
      telemetryCtx.fillStyle = '#bdeef3';
      telemetryCtx.font = 'bold 19px sans-serif';
      telemetryCtx.fillText(s.name, s.x, 128);
      telemetryCtx.fillStyle = '#112a34';
      telemetryCtx.fillRect(s.x, 146, 290, 28);
      telemetryCtx.fillStyle = s.farbe;
      telemetryCtx.fillRect(s.x, 146, 290 * s.wert / 100, 28);
      telemetryCtx.fillStyle = '#d8faff';
      telemetryCtx.font = '16px sans-serif';
      telemetryCtx.fillText(`${Math.round(s.wert)}%`, s.x + 232, 195);
    }

    telemetryCtx.strokeStyle = '#6fe3ff';
    telemetryCtx.lineWidth = 3;
    telemetryCtx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = 35 + i * 11.5;
      const y = 300
        - (0.5 + 0.5 * Math.sin(i * 0.36 + t * 0.55)) * 56
        - Math.sin(i * 0.11) * 12;
      if (i === 0) telemetryCtx.moveTo(x, y);
      else telemetryCtx.lineTo(x, y);
    }
    telemetryCtx.stroke();

    telemetryCtx.fillStyle = '#92dde5';
    telemetryCtx.font = '16px sans-serif';
    telemetryCtx.fillText('GEMEINSAME AKTIVITÄT', 35, 234);

    telemetryCtx.fillStyle = '#102a34';
    telemetryCtx.fillRect(30, 336, w - 60, 78);
    telemetryCtx.strokeStyle = befehlImpuls > 0 ? '#fff0bb' : '#2e7988';
    telemetryCtx.strokeRect(30, 336, w - 60, 78);

    telemetryCtx.fillStyle = '#ddfbff';
    telemetryCtx.font = 'bold 19px sans-serif';
    telemetryCtx.fillText(`AKTIVER BEFEHL: ${modus.toUpperCase()}`, 50, 368);

    const moralText = moral < 35
      ? 'TIEF PUNKT'
      : moral < 60
        ? 'ANGESPANNT'
        : 'HOFFNUNGSVOLL';

    telemetryCtx.font = '16px sans-serif';
    telemetryCtx.fillStyle = moral < 35
      ? '#ffae83'
      : moral < 60
        ? '#ffd37d'
        : '#8ffff1';
    telemetryCtx.fillText(
      `MORALISCHE RESONANZ: ${moralText}   WETTER: ${wetter.toUpperCase()}`,
      50,
      397,
    );

    telemetryTexture.needsUpdate = true;
  }

  zeichneKarte(0);
  zeichneTelemetrie(0);

  // ------------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------------

  function addCable(points, radius = 0.018) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, radius, 6, false),
      matCable,
    );
    root.add(mesh);
    return mesh;
  }

  function addCollision(name, size, position) {
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      collisionMaterial,
    );
    col.name = name;
    col.position.set(...position);
    root.add(col);
    return col;
  }

  // ------------------------------------------------------------------
  // Zwei gegenüberliegende Pulte mit liegenden Kartenbildschirmen
  // ------------------------------------------------------------------

  function createStation(x, rotationY, suffix) {
    const g = new THREE.Group();
    g.name = `Pult_${suffix}`;
    g.position.set(x, 0, 0);
    g.rotation.y = rotationY;

    // Unterbau / Sockel
    const sockel = new THREE.Mesh(
      new THREE.BoxGeometry(1.72, 0.64, 0.60),
      matMetal,
    );
    sockel.position.set(0, 0.38, 0);
    g.add(sockel);

    const sockelblende = new THREE.Mesh(
      new THREE.BoxGeometry(1.60, 0.46, 0.025),
      matPanel,
    );
    sockelblende.position.set(0, 0.38, 0.312);
    g.add(sockelblende);

    const sockelblendeWest = new THREE.Mesh(
      new THREE.BoxGeometry(1.60, 0.46, 0.025),
      matPanel,
    );
    sockelblendeWest.position.set(0, 0.38, -0.312);
    g.add(sockelblendeWest);

    const untererSockel = new THREE.Mesh(
      new THREE.BoxGeometry(1.94, 0.08, 0.78),
      matDark,
    );
    untererSockel.position.set(0, 0.04, 0);
    g.add(untererSockel);

    // Längsseitige Bronzekanten
    for (const sz of [-1, 1]) {
      const side = new THREE.Mesh(
        new THREE.BoxGeometry(1.76, 0.025, 0.025),
        matCopper,
      );
      side.position.set(0, 0.52, sz * 0.315);
      g.add(side);
    }

    // Arbeitsfläche
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 0.10, 0.86),
      matPanel,
    );
    deck.position.set(0, 0.75, 0);
    g.add(deck);

    const deckKante = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 0.035, 0.035),
      matCopper,
    );
    deckKante.position.set(0, 0.735, 0.425);
    g.add(deckKante);

    const deckKanteHinten = deckKante.clone();
    deckKanteHinten.position.z = -0.425;
    g.add(deckKanteHinten);

    // Liegender Bildschirm: flach aufgebaut, anschließend nur die Gruppe gekippt.
    const schirmGruppe = new THREE.Group();
    schirmGruppe.name = `Kartenbildschirm_${suffix}`;
    schirmGruppe.position.set(0, 0.90, -0.065);
    schirmGruppe.rotation.x = -0.46;
    g.add(schirmGruppe);

    const gehaeuse = new THREE.Mesh(
      new THREE.BoxGeometry(1.72, 0.79, 0.09),
      matMetal,
    );
    schirmGruppe.add(gehaeuse);

    const ruckwand = new THREE.Mesh(
      new THREE.BoxGeometry(1.60, 0.66, 0.022),
      matPanel,
    );
    ruckwand.position.set(0, 0, -0.055);
    schirmGruppe.add(ruckwand);

    const rahmen = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.69, 0.018),
      matBlack,
    );
    rahmen.position.set(0, 0, 0.052);
    schirmGruppe.add(rahmen);

    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(1.52, 0.59),
      mapMaterial,
    );
    display.position.set(0, 0, 0.069);
    schirmGruppe.add(display);

    const leiste = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.018, 0.018),
      matBlueGlow,
    );
    leiste.position.set(0, -0.352, 0.063);
    schirmGruppe.add(leiste);

    // Kompakte Aufstellung hinter dem Display
    const stuetze = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.28, 0.20),
      matMetal,
    );
    stuetze.position.set(0, 0.79, -0.11);
    g.add(stuetze);

    // Seitliche Träger mit Lüftungsschlitzen
    for (const sx of [-1, 1]) {
      const seitenteil = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.52, 0.035),
        matRail,
      );
      seitenteil.position.set(sx * 0.92, 0.40, 0.325);
      g.add(seitenteil);

      const fuss = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, 0.74),
        matDark,
      );
      fuss.position.set(sx * 0.78, 0.04, 0);
      g.add(fuss);

      const warmStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.34, 0.012),
        matWarmGlow,
      );
      warmStripe.position.set(sx * 0.93, 0.44, 0.347);
      g.add(warmStripe);
    }

    // Bedienleiste
    const bedienleiste = new THREE.Mesh(
      new THREE.BoxGeometry(1.50, 0.05, 0.18),
      matBlack,
    );
    bedienleiste.position.set(0, 0.825, 0.30);
    g.add(bedienleiste);

    const tastenMaterial = new THREE.MeshStandardMaterial({
      name: 'Konsolentasten',
      color: 0xffffff,
      emissive: 0x62dcff,
      emissiveIntensity: 0.85,
      metalness: 0.14,
      roughness: 0.3,
    });

    const tasten = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.072, 0.028, 0.068),
      tastenMaterial,
      12,
    );
    tasten.name = `Tastenfeld_${suffix}`;
    tasten.position.set(0, 0.862, 0.30);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      dummy.position.set((i - 5.5) * 0.116, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tasten.setMatrixAt(i, dummy.matrix);
      tasten.setColorAt(i, new THREE.Color(0x6fe3ff));
    }
    tasten.instanceMatrix.needsUpdate = true;
    if (tasten.instanceColor) tasten.instanceColor.needsUpdate = true;
    g.add(tasten);

    const drehregler = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.035, 0.042, 0.04, 12),
      matRail,
      3,
    );
    drehregler.name = `Regler_${suffix}`;
    drehregler.position.set(0, 0.87, 0.385);

    for (let i = 0; i < 3; i++) {
      dummy.position.set((i - 1) * 0.19, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      drehregler.setMatrixAt(i, dummy.matrix);
    }
    drehregler.instanceMatrix.needsUpdate = true;
    g.add(drehregler);

    // Kleine Statusanzeige am Pultende
    const status = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.12, 0.02),
      matBlack,
    );
    status.position.set(0.62, 0.66, 0.316);
    g.add(status);

    const statusLicht = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.055, 0.012),
      matBlueGlow,
    );
    statusLicht.position.set(0.62, 0.66, 0.329);
    g.add(statusLicht);

    // Geschlossene rückwärtige Abdeckung des Sockels
    const ruckabdeckung = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 0.48, 0.018),
      matDark,
    );
    ruckabdeckung.position.set(0, 0.38, -0.323);
    g.add(ruckabdeckung);

    root.add(g);
    return { gruppe: g, tasten };
  }

  // Westliches Pult zeigt nach −X, östliches Pult nach +X.
  const west = createStation(-0.62, -Math.PI / 2, 'west');
  const ost = createStation(0.62, Math.PI / 2, 'ost');

  // ------------------------------------------------------------------
  // Gemeinsamer Kern, Sockelkanal und Kabel
  // ------------------------------------------------------------------

  const zentralerKern = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.58, 0.74),
    matMetal,
  );
  zentralerKern.position.set(0, 0.29, 0);
  root.add(zentralerKern);

  const kernBlende = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.34, 0.025),
    matPanel,
  );
  kernBlende.position.set(0, 0.31, 0.385);
  root.add(kernBlende);

  const kernLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.025, 0.02),
    matBlueGlow,
  );
  kernLeiste.position.set(0, 0.45, 0.40);
  root.add(kernLeiste);

  const bodenkanal = new THREE.Mesh(
    new THREE.BoxGeometry(1.40, 0.025, 0.16),
    matDark,
  );
  bodenkanal.position.set(0, 0.0125, 0);
  root.add(bodenkanal);

  addCable([
    [-0.55, 0.62, 0.30],
    [-0.40, 0.30, 0.40],
    [-0.20, 0.06, 0.34],
    [-0.10, 0.04, 0.16],
  ]);

  addCable([
    [0.55, 0.62, -0.30],
    [0.40, 0.30, -0.40],
    [0.20, 0.06, -0.34],
    [0.10, 0.04, -0.16],
  ]);

  // ------------------------------------------------------------------
  // Großes vertikales Hauptdisplay hinter den Pulten
  // ------------------------------------------------------------------

  const displayGruppe = new THREE.Group();
  displayGruppe.name = 'Vertikales_Hauptdisplay';
  displayGruppe.position.set(0, 0, -1.18);
  root.add(displayGruppe);

  const displaySockel = new THREE.Mesh(
    new THREE.BoxGeometry(1.78, 0.16, 0.36),
    matDark,
  );
  displaySockel.position.set(0, 0.08, 0);
  displayGruppe.add(displaySockel);

  for (const sx of [-1, 1]) {
    const stuetze = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 2.42, 0.13),
      matMetal,
    );
    stuetze.position.set(sx * 0.78, 1.21, -0.025);
    displayGruppe.add(stuetze);

    const bronzeKante = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 2.42, 0.018),
      matCopper,
    );
    bronzeKante.position.set(sx * 0.78, 1.21, 0.048);
    displayGruppe.add(bronzeKante);
  }

  const querträger = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.11, 0.16),
    matMetal,
  );
  querträger.position.set(0, 1.22, -0.02);
  displayGruppe.add(querträger);

  const displayGehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(2.04, 1.25, 0.17),
    matMetal,
  );
  displayGehaeuse.position.set(0, 1.88, 0);
  displayGruppe.add(displayGehaeuse);

  const displayRahmen = new THREE.Mesh(
    new THREE.BoxGeometry(1.93, 1.14, 0.028),
    matBlack,
  );
  displayRahmen.position.set(0, 1.88, 0.099);
  displayGruppe.add(displayRahmen);

  const vertikalesDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(1.81, 1.02),
    telemetryMaterial,
  );
  vertikalesDisplay.name = 'Display_Telemetrie';
  vertikalesDisplay.position.set(0, 1.88, 0.121);
  displayGruppe.add(vertikalesDisplay);

  const displayLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(1.70, 0.025, 0.02),
    matBlueGlow,
  );
  displayLeiste.position.set(0, 1.255, 0.13);
  displayGruppe.add(displayLeiste);

  const displayFuss = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.34, 0.32),
    matPanel,
  );
  displayFuss.position.set(0, 0.29, 0);
  displayGruppe.add(displayFuss);

  // Warmweiße Leuchtkante gehört zum Gerät, nicht zur Raumarchitektur.
  const displayWarm = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.018, 0.016),
    matWarmGlow,
  );
  displayWarm.position.set(0, 2.48, 0.10);
  displayGruppe.add(displayWarm);

  // Geschlossene Rückseite mit Serviceblenden und Lüftungsschlitzen.
  const rueckgehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 1.06, 0.035),
    matPanel,
  );
  rueckgehaeuse.position.set(0, 1.88, -0.10);
  displayGruppe.add(rueckgehaeuse);

  for (let i = 0; i < 7; i++) {
    const schlitz = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.018, 0.012),
      matBlack,
    );
    schlitz.position.set(0, 1.56 + i * 0.10, -0.122);
    displayGruppe.add(schlitz);
  }

  // ------------------------------------------------------------------
  // Zwei Sessel, jeweils zum Pult gedreht
  // ------------------------------------------------------------------

  function createChair(x, z, rotationY, suffix) {
    const g = new THREE.Group();
    g.name = `Stuhl_${suffix}`;
    g.position.set(x, 0, z);
    g.rotation.y = rotationY;

    const sitz = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.12, 0.50),
      matSeat,
    );
    sitz.position.set(0, 0.58, 0);
    g.add(sitz);

    const sitzrahmen = new THREE.Mesh(
      new THREE.BoxGeometry(0.57, 0.05, 0.53),
      matMetal,
    );
    sitzrahmen.position.set(0, 0.505, 0);
    g.add(sitzrahmen);

    const lehne = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.61, 0.10),
      matSeat,
    );
    lehne.position.set(0, 0.88, 0.235);
    lehne.rotation.x = -0.1;
    g.add(lehne);

    const lehnenrahmen = new THREE.Mesh(
      new THREE.BoxGeometry(0.57, 0.64, 0.036),
      matMetal,
    );
    lehnenrahmen.position.set(0, 0.88, 0.295);
    lehnenrahmen.rotation.x = -0.1;
    g.add(lehnenrahmen);

    const kopfstuetze = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.17, 0.08),
      matSeat,
    );
    kopfstuetze.position.set(0, 1.22, 0.285);
    kopfstuetze.rotation.x = -0.1;
    g.add(kopfstuetze);

    for (const sx of [-1, 1]) {
      const armstuetze = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.27, 0.06),
        matMetal,
      );
      armstuetze.position.set(sx * 0.31, 0.73, 0.05);
      g.add(armstuetze);

      const armlehne = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.055, 0.36),
        matPanel,
      );
      armlehne.position.set(sx * 0.31, 0.875, 0.04);
      g.add(armlehne);
    }

    const saeule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.065, 0.42, 16),
      matRail,
    );
    saeule.position.set(0, 0.29, 0);
    g.add(saeule);

    const gashebel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.13, 16),
      matMetal,
    );
    gashebel.position.set(0, 0.46, 0);
    g.add(gashebel);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.035, 0.045),
        matMetal,
      );
      arm.position.set(Math.cos(a) * 0.15, 0.075, Math.sin(a) * 0.15);
      arm.rotation.y = -a;
      g.add(arm);

      const rolle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.045, 12),
        matBlack,
      );
      rolle.rotation.z = Math.PI / 2;
      rolle.position.set(Math.cos(a) * 0.29, 0.035, Math.sin(a) * 0.29);
      g.add(rolle);
    }

    root.add(g);
    return g;
  }

  // Westlicher Stuhl blickt nach +X, östlicher nach −X.
  createChair(-1.10, 0.02, Math.PI / 2, 'west');
  createChair(1.10, -0.02, -Math.PI / 2, 'ost');

  // ------------------------------------------------------------------
  // Kollisionskörper: ausschließlich COL_-Meshes kollidieren
  // ------------------------------------------------------------------

  addCollision('COL_pult_west', [0.92, 0.90, 2.00], [-0.62, 0.45, 0]);
  addCollision('COL_pult_ost', [0.92, 0.90, 2.00], [0.62, 0.45, 0]);
  addCollision('COL_stuhl_west', [0.64, 1.30, 0.64], [-1.10, 0.65, 0.02]);
  addCollision('COL_stuhl_ost', [0.64, 1.30, 0.64], [1.10, 0.65, -0.02]);
  addCollision('COL_vertikales_display', [2.04, 2.50, 0.42], [0, 1.25, -1.18]);
  addCollision('COL_kabeltrichter', [0.34, 0.58, 0.74], [0, 0.29, 0]);

  // ------------------------------------------------------------------
  // Benutzen-Punkte und Lichter
  // ------------------------------------------------------------------

  const useBedienen = new THREE.Object3D();
  useBedienen.name = 'INT_bedienen';
  useBedienen.position.set(1.03, 1.02, 0.48);
  useBedienen.userData = {
    label: 'Zivilisations-Simulator bedienen',
    radius: 0.85,
  };
  root.add(useBedienen);

  const useStudium = new THREE.Object3D();
  useStudium.name = 'INT_studium';
  useStudium.position.set(-0.18, 1.16, 0.58);
  useStudium.userData = {
    label: 'Zivilisationen beobachten und lenken',
    radius: 0.85,
  };
  root.add(useStudium);

  const lampBildschirme = new THREE.Object3D();
  lampBildschirme.name = 'LAMP_bildschirme';
  lampBildschirme.position.set(0, 1.30, 0);
  lampBildschirme.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 6,
  };
  root.add(lampBildschirme);

  const lampVertikal = new THREE.Object3D();
  lampVertikal.name = 'LAMP_vertikal';
  lampVertikal.position.set(0, 1.90, -0.82);
  lampVertikal.userData = {
    color: '#6fe3ff',
    intensity: 7,
    distance: 5,
  };
  root.add(lampVertikal);

  const lampWarm = new THREE.Object3D();
  lampWarm.name = 'LAMP_warm';
  lampWarm.position.set(0, 2.30, -0.96);
  lampWarm.userData = {
    color: '#ffe3b0',
    intensity: 4,
    distance: 3.5,
  };
  root.add(lampWarm);

  // ------------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------------

  const api = {
    beobachten() {
      modus = 'beobachtung';
      updateKarte = true;
      updateTelemetrie = true;
    },

    wetterAusloesen() {
      modus = 'regen_befehl';
      wetter = 'regen';
      befehle++;
      stabilitaet = wertFraktion(stabilitaet + 5);
      moral = wertFraktion(moral - 3);
      befehlImpuls = 1;
      updateKarte = true;
      updateTelemetrie = true;
    },

    duerreAusloesen() {
      modus = 'duerre_befehl';
      wetter = 'dürre';
      befehle++;
      stabilitaet = wertFraktion(stabilitaet - 6);
      moral = wertFraktion(moral - 5);
      befehlImpuls = 1;
      updateKarte = true;
      updateTelemetrie = true;
    },

    gesetzErlassen() {
      modus = 'versorgungsgerechtigkeit';
      versorgung = 'gleichverteilt';
      wetter = 'stabil';
      befehle++;
      stabilitaet = wertFraktion(stabilitaet - 3);
      moral = wertFraktion(moral + 9);
      befehlImpuls = 1;
      updateKarte = true;
      updateTelemetrie = true;
    },

    ressourcenUmleiten() {
      modus = 'ressourcenumleitung';
      versorgung = 'küste';
      befehle++;
      stabilitaet = wertFraktion(stabilitaet + 2);
      moral = wertFraktion(moral - 7);
      befehlImpuls = 1;
      updateKarte = true;
      updateTelemetrie = true;
    },

    zuruecksetzen() {
      modus = 'beobachtung';
      wetter = 'stabil';
      versorgung = 'gleichverteilt';
      befehle = 0;
      moral = 50;
      stabilitaet = 72;
      befehlImpuls = 0;
      updateKarte = true;
      updateTelemetrie = true;
    },

    get modus() { return modus; },
    get wetter() { return wetter; },
    get versorgung() { return versorgung; },
    get moral() { return moral; },
    get stabilitaet() { return stabilitaet; },
    get anzahlBefehle() { return befehle; },
    get moralischerZustand() {
      if (moral < 35) return 'Tiefpunkt';
      if (moral < 60) return 'angespannt';
      return 'hoffnungsvoll';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'beobachten',
      label: 'Beobachtungsmodus aktivieren',
      run: () => api.beobachten(),
    },
    {
      id: 'regen',
      label: 'Regen über den Nordfeldern auslösen',
      run: () => api.wetterAusloesen(),
    },
    {
      id: 'duerre',
      label: 'Dürre über den Südfeldern auslösen',
      run: () => api.duerreAusloesen(),
    },
    {
      id: 'gesetz',
      label: 'Versorgungsgerechtigkeit verordnen',
      run: () => api.gesetzErlassen(),
    },
    {
      id: 'ressourcen',
      label: 'Ressourcen zur Küstenstadt umleiten',
      run: () => api.ressourcenUmleiten(),
    },
    {
      id: 'reset',
      label: 'Simulation zurücksetzen',
      run: () => api.zuruecksetzen(),
    },
  ];

  // ------------------------------------------------------------------
  // Animation
  // ------------------------------------------------------------------

  const tastenFarbe = new THREE.Color();
  const kameraBlaue = new THREE.Color(0x6fe3ff);
  const kameraBernstein = new THREE.Color(0xffc66e);

  function update(dt) {
    zeit += dt;
    befehlImpuls = Math.max(0, befehlImpuls - dt * 0.8);

    if (zeit - letzteKarte > 0.2   /* Display-Takt max. 5 Hz (Leistung) */ || updateKarte) {
      zeichneKarte(zeit);
      letzteKarte = zeit;
      updateKarte = false;
    }

    if (zeit - letzteTelemetrie > 0.25 || updateTelemetrie) {
      zeichneTelemetrie(zeit);
      letzteTelemetrie = zeit;
      updateTelemetrie = false;
    }

    mapMaterial.emissiveIntensity = 0.82
      + Math.sin(zeit * 2.1) * 0.07
      + befehlImpuls * 0.35;

    telemetryMaterial.emissiveIntensity = 0.90
      + Math.sin(zeit * 1.7 + 0.8) * 0.08
      + befehlImpuls * 0.30;

    matWarmGlow.emissiveIntensity = 1.72 + Math.sin(zeit * 1.4) * 0.12;

    for (const station of [west, ost]) {
      for (let i = 0; i < 12; i++) {
        const phase = Math.sin(zeit * 4.2 - i * 0.7);
        const hell = 0.25 + Math.max(0, phase) * 0.75;

        tastenFarbe.copy(kameraBlaue).lerp(kameraBernstein, befehlImpuls * 0.65);
        tastenFarbe.multiplyScalar(hell);
        station.tasten.setColorAt(i, tastenFarbe);
      }
      if (station.tasten.instanceColor) {
        station.tasten.instanceColor.needsUpdate = true;
      }
    }
  }

  let letzteZeit = null;
  vertikalesDisplay.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzteZeit !== null) {
      update(Math.min(now - letzteZeit, 0.1));
    }
    letzteZeit = now;
  };

  root.userData.update = update;
  return root;
}

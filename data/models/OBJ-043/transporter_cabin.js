import * as THREE from 'three';

const kit = (name, color = 0xffffff, metalness = 0.72, roughness = 0.34) =>
  new THREE.MeshStandardMaterial({
    name: `KIT_${name}`,
    color,
    metalness,
    roughness,
  });

export const steckbrief = {
  name: 'transporter_cabin',
  art: 'Standobjekt',
  masse: '1,80 × 2,60 × 1,80 (B × H × T, m)',
  benutzen: 'INT_bedienen → Menü aus userData.actions',
  lichter: 'LAMP_panel, LAMP_tuer, LAMP_ausgang (eisblau und bernsteinfarben)',
  animation: 'Doppelschiebetür öffnet und schließt sich weich; Stadtplan pulsiert; Transport löst einen hellen Lichtblitz aus',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'transporter_cabin';

  const B = 1.8;
  const H = 2.6;
  const D = 1.8;
  const WAND = 0.1;
  const BODEN = 0.12;
  const OEFFNUNG_BREITE = 1.55;
  const OEFFNUNG_HOEHE = 2.3;

  const matKupfer = kit('copper', 0x754224, 0.88, 0.31);
  const matDunkel = kit('wallDark', 0x182b3b, 0.82, 0.35);
  const matPerle = kit('pillar', 0xc5d0d5, 0.65, 0.29);
  const matBoden = kit('floor', 0x273640, 0.76, 0.38);
  const matSchiene = kit('rail', 0xb07a3d, 0.96, 0.2);

  const matInnenboden = new THREE.MeshStandardMaterial({
    name: 'transporter_innenboden',
    color: 0x263743,
    metalness: 0.84,
    roughness: 0.27,
  });

  const matTuer = new THREE.MeshStandardMaterial({
    name: 'transporter_tuer',
    color: 0x3b251c,
    metalness: 0.91,
    roughness: 0.26,
  });

  const matTuerInset = new THREE.MeshStandardMaterial({
    name: 'transporter_tuer_einsatz',
    color: 0x2b1b16,
    metalness: 0.85,
    roughness: 0.33,
  });

  const matStreifen = new THREE.MeshStandardMaterial({
    name: 'KIT_glow',
    color: 0xd9f8ff,
    emissive: 0xb7efff,
    emissiveIntensity: 1.7,
    metalness: 0.08,
    roughness: 0.22,
  });

  const matTuerStreifen = new THREE.MeshStandardMaterial({
    name: 'KIT_glow',
    color: 0x9ceeff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.45,
    metalness: 0.08,
    roughness: 0.2,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'KIT_amberGlow',
    color: 0xffd08a,
    emissive: 0xffad4d,
    emissiveIntensity: 1.35,
    metalness: 0.08,
    roughness: 0.25,
  });

  const box = (w, h, d, material) =>
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  // ------------------------------------------------------------
  // Sockel und Boden
  // ------------------------------------------------------------

  const sockel = box(B, BODEN, D, matDunkel);
  sockel.position.set(0, BODEN / 2, 0);
  root.add(sockel);

  const sockelKante = box(B + 0.015, 0.055, D + 0.015, matSchiene);
  sockelKante.position.set(0, 0.105, 0);
  root.add(sockelKante);

  const innenBoden = box(1.58, 0.03, 1.58, matInnenboden);
  innenBoden.position.set(0, BODEN + 0.015, 0);
  root.add(innenBoden);

  // ------------------------------------------------------------
  // Kabinenkorpus
  // ------------------------------------------------------------

  const rueckwand = box(B, H, WAND, matKupfer);
  rueckwand.position.set(0, H / 2, -D / 2 + WAND / 2);
  root.add(rueckwand);

  const linksWand = box(WAND, H, D - WAND * 2, matDunkel);
  linksWand.position.set(-B / 2 + WAND / 2, H / 2, 0);
  root.add(linksWand);

  const rechtsWand = box(WAND, H, D - WAND * 2, matDunkel);
  rechtsWand.position.set(B / 2 - WAND / 2, H / 2, 0);
  root.add(rechtsWand);

  const dach = box(B, WAND, D, matDunkel);
  dach.position.set(0, H - WAND / 2, 0);
  root.add(dach);

  const dachKranz = box(B - 0.04, 0.07, D - 0.04, matKupfer);
  dachKranz.position.set(0, H - 0.145, 0);
  root.add(dachKranz);

  const dachLeiste = box(B - 0.18, 0.025, D - 0.18, matSchiene);
  dachLeiste.position.set(0, H - 0.105, 0);
  root.add(dachLeiste);

  // ------------------------------------------------------------
  // Vorderer Rahmen
  // ------------------------------------------------------------

  const seitenspalte = (B - OEFFNUNG_BREITE) / 2;
  const frontZ = D / 2 - 0.06;

  const frontLinks = box(seitenspalte, H, 0.12, matKupfer);
  frontLinks.position.set(-B / 2 + seitenspalte / 2, H / 2, frontZ);
  root.add(frontLinks);

  const frontRechts = box(seitenspalte, H, 0.12, matKupfer);
  frontRechts.position.set(B / 2 - seitenspalte / 2, H / 2, frontZ);
  root.add(frontRechts);

  const frontKopf = box(
    OEFFNUNG_BREITE,
    H - OEFFNUNG_HOEHE,
    0.12,
    matKupfer
  );
  frontKopf.position.set(
    0,
    OEFFNUNG_HOEHE + (H - OEFFNUNG_HOEHE) / 2,
    frontZ
  );
  root.add(frontKopf);

  // Perlgraue Kantenprofile an der Öffnung
  const profilLinks = box(0.055, OEFFNUNG_HOEHE, 0.035, matPerle);
  profilLinks.position.set(-0.8025, OEFFNUNG_HOEHE / 2, D / 2 - 0.015);
  root.add(profilLinks);

  const profilRechts = box(0.055, OEFFNUNG_HOEHE, 0.035, matPerle);
  profilRechts.position.set(0.8025, OEFFNUNG_HOEHE / 2, D / 2 - 0.015);
  root.add(profilRechts);

  const profilOben = box(1.66, 0.055, 0.035, matPerle);
  profilOben.position.set(0, OEFFNUNG_HOEHE, D / 2 - 0.015);
  root.add(profilOben);

  // Schiene und Laufwerk
  const schiene = box(1.74, 0.045, 0.065, matSchiene);
  schiene.position.set(0, 2.26, D / 2 - 0.09);
  root.add(schiene);

  for (const x of [-0.69, -0.23, 0.23, 0.69]) {
    const lager = box(0.11, 0.09, 0.09, matPerle);
    lager.position.set(x, 2.26, D / 2 - 0.09);
    root.add(lager);
  }

  // ------------------------------------------------------------
  // Doppelschiebetür
  // ------------------------------------------------------------

  const tuerBreite = 0.765;
  const tuerHoehe = 2.14;
  const tuerMitteY = BODEN + 0.03 + tuerHoehe / 2;
  const tuerStartX = 0.39;
  const tuerWeg = 0.76;

  function createDoorLeaf(side) {
    const gruppe = new THREE.Group();

    const blatt = box(tuerBreite, tuerHoehe, 0.07, matTuer);
    blatt.position.y = tuerMitteY;
    gruppe.add(blatt);

    const inset = box(tuerBreite - 0.12, tuerHoehe - 0.18, 0.012, matTuerInset);
    inset.position.set(0, tuerMitteY, 0.041);
    gruppe.add(inset);

    const senkrecht = box(0.026, 1.83, 0.016, matTuerStreifen);
    senkrecht.position.set(side * 0.265, tuerMitteY + 0.04, 0.052);
    gruppe.add(senkrecht);

    const obereLeiste = box(0.53, 0.026, 0.018, matSchiene);
    obereLeiste.position.set(0, tuerMitteY + 0.93, 0.052);
    gruppe.add(obereLeiste);

    const untereLeiste = box(0.53, 0.026, 0.018, matSchiene);
    untereLeiste.position.set(0, tuerMitteY - 0.93, 0.052);
    gruppe.add(untereLeiste);

    const diagonale = box(0.026, 1.42, 0.016, matSchiene);
    diagonale.position.set(side * 0.06, tuerMitteY, 0.053);
    diagonale.rotation.z = side * 0.46;
    gruppe.add(diagonale);

    const griff = box(0.035, 0.38, 0.04, matPerle);
    griff.position.set(-side * 0.275, 1.24, 0.06);
    gruppe.add(griff);

    return gruppe;
  }

  const tuerLinks = createDoorLeaf(-1);
  const tuerRechts = createDoorLeaf(1);
  tuerLinks.position.set(-tuerStartX, 0, D / 2 - 0.14);
  tuerRechts.position.set(tuerStartX, 0, D / 2 - 0.14);
  root.add(tuerLinks, tuerRechts);

  // ------------------------------------------------------------
  // Innenraumdetails
  // ------------------------------------------------------------

  const innenRueck = box(1.56, 2.36, 0.035, matDunkel);
  innenRueck.position.set(0, 1.31, -0.782);
  root.add(innenRueck);

  for (const x of [-0.79, 0.79]) {
    const seitenverkleidung = box(0.035, 2.36, 1.56, matKupfer);
    seitenverkleidung.position.set(x, 1.31, 0);
    root.add(seitenverkleidung);

    for (const z of [-0.43, 0, 0.43]) {
      const rippe = box(0.022, 2.12, 0.045, matPerle);
      rippe.position.set(x + (x < 0 ? 0.024 : -0.024), 1.32, z);
      root.add(rippe);
    }
  }

  for (const x of [-0.71, 0.71]) {
    const innenStreifen = box(0.025, 1.82, 0.025, matStreifen);
    innenStreifen.position.set(x, 1.43, -0.72);
    root.add(innenStreifen);
  }

  const ausgangStreifen = box(1.35, 0.035, 0.035, matStreifen);
  ausgangStreifen.position.set(0, 2.38, -0.7);
  root.add(ausgangStreifen);

  const ausgangPfeil = new THREE.Mesh(
    new THREE.ConeGeometry(0.105, 0.18, 3),
    matAmber
  );
  ausgangPfeil.position.set(0, 2.18, -0.685);
  ausgangPfeil.rotation.z = Math.PI;
  root.add(ausgangPfeil);

  // ------------------------------------------------------------
  // Kartenpaneel an der Rückwand
  // ------------------------------------------------------------

  const paneel = new THREE.Group();
  root.add(paneel);

  const paneelAusschnitt = box(1.31, 1.47, 0.035, matDunkel);
  paneelAusschnitt.position.set(0, 1.54, -0.748);
  paneel.add(paneelAusschnitt);

  const paneelRahmen = box(1.39, 1.55, 0.075, matKupfer);
  paneelRahmen.position.set(0, 1.54, -0.775);
  paneel.add(paneelRahmen);

  const paneelKante = box(1.25, 1.41, 0.018, matSchiene);
  paneelKante.position.set(0, 1.54, -0.71);
  paneel.add(paneelKante);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  const verlauf = ctx.createLinearGradient(0, 0, 0, canvas.height);
  verlauf.addColorStop(0, '#061a2a');
  verlauf.addColorStop(0.52, '#0a3044');
  verlauf.addColorStop(1, '#05131f');
  ctx.fillStyle = verlauf;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(104, 216, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Zentraler Hauptverteiler
  ctx.strokeStyle = '#6fe3ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 320, 151, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 320, 88, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const winkel = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(winkel) * 88, 320 + Math.sin(winkel) * 88);
    ctx.lineTo(256 + Math.cos(winkel) * 151, 320 + Math.sin(winkel) * 151);
    ctx.stroke();
  }

  // Stadtbezirke
  const bezirke = [
    [256, 169], [363, 217], [407, 320], [363, 423],
    [256, 471], [149, 423], [105, 320], [149, 217],
  ];

  ctx.lineWidth = 3;
  for (const [x, y] of bezirke) {
    ctx.strokeStyle = '#73ddf7';
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 17);
    ctx.lineTo(x, y - 22);
    ctx.lineTo(x + 13, y + 17);
    ctx.lineTo(x, y + 5);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 186, 95, 0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 320);
  ctx.lineTo(256, 169);
  ctx.stroke();

  const punkte = [
    [256, 169, '#ffbd63'],
    [363, 217, '#6fe3ff'],
    [407, 320, '#6fe3ff'],
    [363, 423, '#6fe3ff'],
    [256, 471, '#6fe3ff'],
    [149, 423, '#6fe3ff'],
    [105, 320, '#6fe3ff'],
    [149, 217, '#6fe3ff'],
  ];

  for (const [x, y, farbe] of punkte) {
    ctx.fillStyle = farbe;
    ctx.shadowColor = farbe;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#d8f7ff';
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText('ATLANTIS', 24, 42);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#6fe3ff';
  ctx.fillText('INTERNES TRANSPORTERNETZ', 24, 69);
  ctx.fillStyle = '#ffbd63';
  ctx.fillText('AKTIV', 416, 42);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#84a9ba';
  ctx.fillText('ATL-001  /  ATL-002  /  ATL-024  /  ATL-042', 24, 611);

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 4;

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_stadtplan',
    color: 0xffffff,
    map: textur,
    emissive: 0x5ac7ec,
    emissiveMap: textur,
    emissiveIntensity: 1.15,
    metalness: 0.12,
    roughness: 0.22,
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.16), screenMaterial);
  screen.position.set(0, 1.55, -0.69);
  paneel.add(screen);

  // Etagenwahl links neben dem Stadtplan
  const etagenMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_etagentaste',
    color: 0x172630,
    metalness: 0.78,
    roughness: 0.3,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.12,
  });

  for (let i = 0; i < 5; i++) {
    const taste = box(0.1, 0.085, 0.035, etagenMaterial);
    taste.position.set(-0.565, 1.03 + i * 0.18, -0.676);
    paneel.add(taste);
  }

  const statusMaterial = new THREE.MeshStandardMaterial({
    name: 'transporter_status',
    color: 0x6fe3ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.5,
    metalness: 0.08,
    roughness: 0.2,
  });

  for (let i = 0; i < 3; i++) {
    const status = box(0.055, 0.055, 0.025, statusMaterial);
    status.position.set(0.43 + i * 0.095, 0.91, -0.675);
    paneel.add(status);
  }

  const statusBeschriftung = box(0.3, 0.035, 0.025, matAmber);
  statusBeschriftung.position.set(0.49, 0.8, -0.675);
  paneel.add(statusBeschriftung);

  // ------------------------------------------------------------
  // Äußere Dekorprofile und Typenschild
  // ------------------------------------------------------------

  for (const x of [-0.855, 0.855]) {
    const vertikalprofil = box(0.055, 2.16, 0.035, matSchiene);
    vertikalprofil.position.set(x, 1.18, D / 2 - 0.025);
    root.add(vertikalprofil);
  }

  const typenschild = box(0.43, 0.16, 0.025, matDunkel);
  typenschild.position.set(0, 2.43, D / 2 - 0.01);
  root.add(typenschild);

  const typenschildLeiste = box(0.33, 0.025, 0.03, matAmber);
  typenschildLeiste.position.set(0, 2.43, D / 2 + 0.008);
  root.add(typenschildLeiste);

  // ------------------------------------------------------------
  // Kollision
  // ------------------------------------------------------------

  function addCollision(name, mesh) {
    mesh.name = name;
    root.add(mesh);
    return mesh;
  }

  addCollision(
    'COL_rueckwand',
    box(B, H, WAND).translateY(H / 2).translateZ(-D / 2 + WAND / 2)
  );
  addCollision(
    'COL_linkswand',
    box(WAND, H, D - WAND * 2).translateX(-B / 2 + WAND / 2).translateY(H / 2)
  );
  addCollision(
    'COL_rechtswand',
    box(WAND, H, D - WAND * 2).translateX(B / 2 - WAND / 2).translateY(H / 2)
  );
  addCollision(
    'COL_front_links',
    box(seitenspalte, H, 0.12).translateX(-B / 2 + seitenspalte / 2).translateY(H / 2).translateZ(frontZ)
  );
  addCollision(
    'COL_front_rechts',
    box(seitenspalte, H, 0.12).translateX(B / 2 - seitenspalte / 2).translateY(H / 2).translateZ(frontZ)
  );
  addCollision(
    'COL_front_kopf',
    box(OEFFNUNG_BREITE, H - OEFFNUNG_HOEHE, 0.12)
      .translateY(OEFFNUNG_HOEHE + (H - OEFFNUNG_HOEHE) / 2)
      .translateZ(frontZ)
  );
  addCollision(
    'COL_dach',
    box(B, WAND, D).translateY(H - WAND / 2)
  );

  // ------------------------------------------------------------
  // Benutzen-Punkt und Lampen
  // ------------------------------------------------------------

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.25, 1.25);
  use.userData = {
    label: 'Transporter bedienen',
    radius: 0.8,
  };
  root.add(use);

  const lampPanel = new THREE.Object3D();
  lampPanel.name = 'LAMP_panel';
  lampPanel.position.set(0, 1.55, -0.58);
  lampPanel.userData = {
    color: '#6fe3ff',
    intensity: 6,
    distance: 3.5,
  };
  root.add(lampPanel);

  const lampTuer = new THREE.Object3D();
  lampTuer.name = 'LAMP_tuer';
  lampTuer.position.set(0, 1.3, 0.57);
  lampTuer.userData = {
    color: '#b7efff',
    intensity: 5,
    distance: 2.8,
  };
  root.add(lampTuer);

  const lampAusgang = new THREE.Object3D();
  lampAusgang.name = 'LAMP_ausgang';
  lampAusgang.position.set(0, 2.28, 0.4);
  lampAusgang.userData = {
    color: '#ffbd63',
    intensity: 3,
    distance: 2.4,
  };
  root.add(lampAusgang);

  // ------------------------------------------------------------
  // Transportblitz
  // ------------------------------------------------------------

  const blitzMaterial = new THREE.MeshBasicMaterial({
    name: 'transporter_blitz',
    color: 0xc9f7ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const blitz = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 2.25), blitzMaterial);
  blitz.position.set(0, 1.3, -0.64);
  paneel.add(blitz);

  // ------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------

  let powered = opts.powered !== false;
  let energie = THREE.MathUtils.clamp(
    opts.energie === undefined ? 0.92 : Number(opts.energie),
    0,
    1
  );
  let doorOpen = Boolean(opts.tuerOffen);
  let doorAmount = doorOpen ? 1 : 0;
  let transportPending = false;
  let transportElapsed = 0;
  let transportFlash = 0;
  let transportZiel = opts.ziel ?? null;
  let elapsed = 0;
  let lastTime = null;
  let transportAusgefuehrt = false;

  function update(dt) {
    elapsed += dt;

    if (transportPending) {
      transportElapsed += dt;

      if (!transportAusgefuehrt && transportElapsed >= 0.58) {
        transportAusgefuehrt = true;
        transportFlash = 1;

        if (typeof opts.onTransport === 'function') {
          opts.onTransport({
            quelle: root.name,
            ziel: transportZiel,
          });
        }
      }

      if (transportAusgefuehrt) {
        const flashPhase = (transportElapsed - 0.58) / 0.68;
        transportFlash = Math.max(0, 1 - flashPhase);
      }

      if (transportElapsed >= 1.48) {
        transportPending = false;
        transportFlash = 0;
        transportAusgefuehrt = false;
      }
    }

    const doorTarget = powered && !transportPending ? (doorOpen ? 1 : 0) : 0;
    doorAmount += (doorTarget - doorAmount) * Math.min(1, dt * 5.2);

    tuerLinks.position.x = -tuerStartX - doorAmount * tuerWeg;
    tuerRechts.position.x = tuerStartX + doorAmount * tuerWeg;

    const puls = 0.5 + 0.5 * Math.sin(elapsed * 2.25);
    const active = powered ? 1 : 0.07;

    screenMaterial.emissiveIntensity =
      active * (0.95 + puls * 0.32 + transportFlash * 4.2);

    statusMaterial.emissiveIntensity =
      active * (1.2 + puls * 0.55 + transportFlash * 3.1);

    etagenMaterial.emissiveIntensity =
      active * (0.08 + (puls > 0.52 ? 0.28 : 0.05));

    matTuerStreifen.emissiveIntensity =
      active * (1.15 + puls * 0.45 + transportFlash * 4.8);

    matStreifen.emissiveIntensity =
      active * (1.3 + puls * 0.34 + transportFlash * 3.8);

    matAmber.emissiveIntensity =
      active * (1.05 + puls * 0.3 + transportFlash * 2.8);

    blitzMaterial.opacity = transportFlash * 0.82;

    lampPanel.userData.intensity =
      powered ? 5.5 + puls * 1.4 + transportFlash * 17 : 0.15;

    lampTuer.userData.intensity =
      powered ? 4.4 + puls * 0.7 + transportFlash * 20 : 0.15;

    lampAusgang.userData.intensity =
      powered ? 2.1 + puls * 0.75 + transportFlash * 8 : 0.08;
  }

  screen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(Math.min(now - lastTime, 0.1));
    }
    lastTime = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------
  // Öffentliche API und Aktionen
  // ------------------------------------------------------------

  const api = {
    oeffnen() {
      if (!powered || transportPending) return false;
      doorOpen = true;
      return true;
    },

    schliessen() {
      if (transportPending) return false;
      doorOpen = false;
      return true;
    },

    transport(ziel = transportZiel) {
      if (!powered || transportPending) return false;

      transportZiel = ziel;
      transportPending = true;
      transportElapsed = 0;
      transportAusgefuehrt = false;
      transportFlash = 0;
      doorOpen = false;

      energie = Math.max(0, energie - 0.12);
      if (energie < 0.08) powered = false;

      return true;
    },

    transportieren(ziel = transportZiel) {
      return api.transport(ziel);
    },

    setPower(value) {
      powered = Boolean(value);
      if (powered && energie < 0.08) energie = 0.15;
      if (!powered) doorOpen = false;
    },

    setEnergy(value) {
      energie = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
      if (energie < 0.08) powered = false;
    },

    setTarget(ziel) {
      transportZiel = ziel;
    },

    get an() {
      return powered;
    },

    get energie() {
      return energie;
    },

    get tuerOffen() {
      return doorOpen;
    },

    get transportiert() {
      return transportPending;
    },

    get ziel() {
      return transportZiel;
    },
  };

  root.userData.api = api;

  root.userData.actions = [
    {
      id: 'tuer_oeffnen',
      label: 'Transportertür öffnen',
      run: () => api.oeffnen(),
    },
    {
      id: 'tuer_schliessen',
      label: 'Transportertür schließen',
      run: () => api.schliessen(),
    },
    {
      id: 'transport',
      label: 'Personentransport starten',
      run: () => api.transport(),
    },
    {
      id: 'abschalten',
      label: 'Transporter abschalten',
      run: () => api.setPower(false),
    },
    {
      id: 'einschalten',
      label: 'Transporter einschalten',
      run: () => api.setPower(true),
    },
  ];

  return root;
}

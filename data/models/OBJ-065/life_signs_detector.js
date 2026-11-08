import * as THREE from 'three';

export const steckbrief = {
  name: 'life_signs_detector',
  art: 'Standobjekt',
  masse: '0,15 × 0,09 × 0,02 (B × T × H, m)',
  wohin: 'Krankenstation / Infirmary, Operationsraum / OP',
  benutzen: 'INT_aktivieren und INT_modus',
  lichter: 'LAMP_anzeige (eisblau, dauerhaft schwach)',
  animation: 'Canvas-Radar mit wandernden Lebenszeichen, Scanimpuls, Statusanzeige und weich pulsierendem Display',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'life_signs_detector';

  // ------------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------------
  const huelleMat = new THREE.MeshStandardMaterial({
    name: 'detektor_huelle',
    color: 0xc8d5d8,
    transparent: true,
    opacity: 0.88,
    roughness: 0.3,
    metalness: 0.1,
    depthWrite: true,
  });

  const innenMat = new THREE.MeshStandardMaterial({
    name: 'detektor_innenschicht',
    color: 0x304c5b,
    transparent: true,
    opacity: 0.72,
    roughness: 0.46,
    metalness: 0.24,
    depthWrite: true,
  });

  const rahmenMat = new THREE.MeshStandardMaterial({
    name: 'detektor_rahmen',
    color: 0x172832,
    roughness: 0.4,
    metalness: 0.52,
  });

  const leiterMat = new THREE.MeshStandardMaterial({
    name: 'detektor_leiterbahn',
    color: 0x249fc8,
    emissive: 0x0b759f,
    emissiveIntensity: 0.62,
    roughness: 0.32,
    metalness: 0.28,
  });

  const akzentMat = new THREE.MeshStandardMaterial({
    name: 'detektor_akzent',
    color: 0xf0a52b,
    emissive: 0xa54a06,
    emissiveIntensity: 0.32,
    roughness: 0.44,
    metalness: 0.22,
  });

  const knopfMat = new THREE.MeshStandardMaterial({
    name: 'detektor_knopf',
    color: 0x34444d,
    roughness: 0.58,
    metalness: 0.34,
  });

  const metallMat = new THREE.MeshStandardMaterial({
    name: 'KIT_pillar',
    color: 0xc0cdd0,
    roughness: 0.34,
    metalness: 0.48,
  });

  const bronzeMat = new THREE.MeshStandardMaterial({
    name: 'KIT_rail',
    color: 0xb7833e,
    roughness: 0.28,
    metalness: 0.78,
  });

  const glasMat = new THREE.MeshStandardMaterial({
    name: 'detektor_glas',
    color: 0x9dd8ee,
    transparent: true,
    opacity: 0.11,
    roughness: 0.14,
    metalness: 0.04,
    depthWrite: false,
  });

  // ------------------------------------------------------------------
  // Geschlossenes, flaches Gehäuse
  // Ursprung: Mitte der Unterseite. Die Gehäuseoberseite zeigt nach +Y,
  // das Bedienende und damit die Gerätevorderseite nach +Z.
  // ------------------------------------------------------------------
  const gehaeuseForm = new THREE.Shape();
  gehaeuseForm.moveTo(-0.058, 0.039);
  gehaeuseForm.lineTo(-0.068, 0.030);
  gehaeuseForm.lineTo(-0.072, -0.024);
  gehaeuseForm.lineTo(-0.062, -0.040);
  gehaeuseForm.lineTo(0.062, -0.040);
  gehaeuseForm.lineTo(0.072, -0.024);
  gehaeuseForm.lineTo(0.068, 0.030);
  gehaeuseForm.lineTo(0.058, 0.039);
  gehaeuseForm.closePath();

  const gehaeuseGeo = new THREE.ExtrudeGeometry(gehaeuseForm, {
    depth: 0.0115,
    bevelEnabled: true,
    bevelThickness: 0.0011,
    bevelSize: 0.0012,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 1,
  });
  gehaeuseGeo.rotateX(-Math.PI / 2);
  gehaeuseGeo.translate(0, 0.001, 0);
  gehaeuseGeo.computeVertexNormals();

  const gehaeuse = new THREE.Mesh(gehaeuseGeo, huelleMat);
  gehaeuse.name = 'Gehaeuse';
  root.add(gehaeuse);

  // Geschlossene dunkle Innenschicht, durch den gefrosteten Kristall sichtbar.
  const innenschicht = new THREE.Mesh(
    new THREE.BoxGeometry(0.116, 0.0075, 0.066),
    innenMat
  );
  innenschicht.position.set(0, 0.0062, -0.0085);
  root.add(innenschicht);

  // Geschlossene untere Abdeckung.
  const unterplatte = new THREE.Mesh(
    new THREE.BoxGeometry(0.116, 0.002, 0.064),
    metallMat
  );
  unterplatte.position.set(0, 0.0018, -0.008);
  root.add(unterplatte);

  // ------------------------------------------------------------------
  // Displayrahmen und Anzeige
  // ------------------------------------------------------------------
  const rahmen = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.0026, 0.065),
    rahmenMat
  );
  rahmen.position.set(0, 0.0142, -0.0095);
  root.add(rahmen);

  // Vier geschlossene Metalllaschen unter dem Rahmen.
  const laschenGeo = new THREE.BoxGeometry(0.008, 0.0018, 0.008);
  for (const [x, z] of [
    [-0.048, -0.035],
    [0.048, -0.035],
    [-0.048, 0.016],
    [0.048, 0.016],
  ]) {
    const lasche = new THREE.Mesh(laschenGeo, metallMat);
    lasche.position.set(x, 0.0141, z);
    root.add(lasche);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  const displayTexture = new THREE.CanvasTexture(canvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  displayTexture.minFilter = THREE.LinearFilter;
  displayTexture.magFilter = THREE.LinearFilter;
  displayTexture.generateMipmaps = false;

  const displayMat = new THREE.MeshStandardMaterial({
    name: 'detektor_display',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0xffffff,
    emissiveMap: displayTexture,
    emissiveIntensity: 0.92,
    roughness: 0.36,
    metalness: 0,
    toneMapped: false,
  });

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.096, 0.056),
    displayMat
  );
  display.name = 'Anzeige';
  display.rotation.x = -Math.PI / 2;
  display.position.set(0, 0.01562, -0.0095);
  root.add(display);

  const glas = new THREE.Mesh(
    new THREE.PlaneGeometry(0.098, 0.058),
    glasMat
  );
  glas.rotation.x = -Math.PI / 2;
  glas.position.set(0, 0.01592, -0.0095);
  root.add(glas);

  // ------------------------------------------------------------------
  // Orangefarbene Eckmarkierungen
  // ------------------------------------------------------------------
  const eckForm = new THREE.Shape();
  eckForm.moveTo(0, 0);
  eckForm.lineTo(0.0125, 0);
  eckForm.lineTo(0, 0.0125);
  eckForm.closePath();

  const eckGeo = new THREE.ExtrudeGeometry(eckForm, {
    depth: 0.0007,
    bevelEnabled: false,
  });
  eckGeo.rotateX(-Math.PI / 2);
  eckGeo.computeVertexNormals();

  const ecken = [
    { x: -0.053, z: -0.040, ry: -Math.PI / 2 },
    { x: 0.053, z: -0.040, ry: Math.PI },
    { x: -0.053, z: 0.021, ry: 0 },
    { x: 0.053, z: 0.021, ry: Math.PI / 2 },
  ];

  for (const e of ecken) {
    const ecke = new THREE.Mesh(eckGeo, akzentMat);
    ecke.position.set(e.x, 0.01465, e.z);
    ecke.rotation.y = e.ry;
    root.add(ecke);
  }

  // ------------------------------------------------------------------
  // Blaue Leiterbahnen im Gehäuse
  // ------------------------------------------------------------------
  function addLeiter(x, z, laenge, achse = 'z') {
    const geo = achse === 'z'
      ? new THREE.BoxGeometry(0.0009, 0.0004, laenge)
      : new THREE.BoxGeometry(laenge, 0.0004, 0.0009);

    const teil = new THREE.Mesh(geo, leiterMat);
    teil.position.set(x, 0.01435, z);
    root.add(teil);
  }

  addLeiter(-0.0615, -0.026, 0.018, 'z');
  addLeiter(-0.0615, 0.006, 0.012, 'z');
  addLeiter(-0.048, 0.0115, 0.026, 'x');
  addLeiter(0.0615, -0.024, 0.020, 'z');
  addLeiter(0.0595, 0.010, 0.016, 'z');
  addLeiter(0.047, 0.0115, 0.022, 'x');
  addLeiter(-0.025, -0.0405, 0.029, 'x');
  addLeiter(0.023, -0.0405, 0.034, 'x');

  // Kleine Kontaktfelder an der linken Gehäuseseite.
  for (let i = 0; i < 3; i++) {
    const kontakt = new THREE.Mesh(
      new THREE.BoxGeometry(0.0013, 0.0042, 0.009),
      leiterMat
    );
    kontakt.position.set(-0.0712, 0.0085, -0.014 + i * 0.012);
    root.add(kontakt);
  }

  // Geschlossene Seitenblende mit eingelassenen Kontakten.
  const seitenblende = new THREE.Mesh(
    new THREE.BoxGeometry(0.0025, 0.0065, 0.039),
    rahmenMat
  );
  seitenblende.position.set(-0.0722, 0.0085, -0.008);
  root.add(seitenblende);

  // ------------------------------------------------------------------
  // Bedienknöpfe
  // ------------------------------------------------------------------
  const knopfSockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0108, 0.0118, 0.0036, 24),
    metallMat
  );
  knopfSockel.position.set(0, 0.0151, 0.031);
  root.add(knopfSockel);

  const knopfRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.0085, 0.00125, 8, 28),
    bronzeMat
  );
  knopfRing.rotation.x = -Math.PI / 2;
  knopfRing.position.set(0, 0.01715, 0.031);
  root.add(knopfRing);

  const knopf = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0074, 0.0079, 0.0024, 24),
    knopfMat
  );
  knopf.position.set(0, 0.01745, 0.031);
  root.add(knopf);

  const knopfKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0034, 0.0037, 0.0007, 20),
    metallMat
  );
  knopfKern.position.set(0, 0.0189, 0.031);
  root.add(knopfKern);

  const nebenknopf = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0048, 0.0052, 0.003, 20),
    knopfMat
  );
  nebenknopf.position.set(0.0205, 0.0156, 0.0305);
  root.add(nebenknopf);

  const statusLampe = new THREE.Mesh(
    new THREE.SphereGeometry(0.0016, 10, 8),
    new THREE.MeshStandardMaterial({
      name: 'detektor_statusled',
      color: 0x80eaff,
      emissive: 0x6fe3ff,
      emissiveIntensity: 2,
      roughness: 0.2,
    })
  );
  statusLampe.position.set(-0.0205, 0.01535, 0.0305);
  root.add(statusLampe);

  // Kleine Verstärkungsrippen an der hinteren Gehäusekante.
  for (let i = -1; i <= 1; i++) {
    const rippe = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.0025, 0.003),
      metallMat
    );
    rippe.position.set(i * 0.020, 0.0137, -0.040);
    root.add(rippe);
  }

  // Kristallartige obere Grifflasche.
  const griff = new THREE.Mesh(
    new THREE.BoxGeometry(0.050, 0.0034, 0.009),
    huelleMat
  );
  griff.position.set(0, 0.014, -0.039);
  root.add(griff);

  // ------------------------------------------------------------------
  // Kollisionskörper
  // ------------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.02, 0.09)
  );
  col.name = 'COL_gehaeuse';
  col.position.set(0, 0.01, 0);
  col.userData.aktiv = true;
  root.add(col);

  // ------------------------------------------------------------------
  // Benutzen-Punkte und Licht
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_aktivieren';
  use.position.set(-0.015, 0.082, 0.094);
  use.userData = {
    label: 'Lebenszeichendetektor aktivieren',
    radius: 0.2,
  };
  root.add(use);

  const modusUse = new THREE.Object3D();
  modusUse.name = 'INT_modus';
  modusUse.position.set(0.045, 0.075, 0.094);
  modusUse.userData = {
    label: 'Detektor-Modus wechseln',
    radius: 0.16,
  };
  root.add(modusUse);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_anzeige';
  lamp.position.set(0, 0.055, -0.0095);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 2.4,
    distance: 0.85,
  };
  root.add(lamp);

  // ------------------------------------------------------------------
  // Anzeigezustand und Canvas-Radar
  // ------------------------------------------------------------------
  const modi = [
    { key: 'life', label: 'Lebenszeichen' },
    { key: 'energy', label: 'Energiesignaturen' },
    { key: 'ata', label: 'ATA-Gen' },
    { key: 'dna', label: 'DNA' },
  ];

  let aktiv = false;
  let modusIndex = 0;
  let zeit = 0;
  let letzte = null;
  let letzteZeichnung = -1;
  let scanImpuls = 0;

  // Reproduzierbare Startpositionen für ein stabiles Radar.
  let seed = 9371;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const signaturen = Array.from({ length: 17 }, (_, i) => ({
    x: random() * 0.78 - 0.39,
    y: random() * 0.6 - 0.3,
    phase: random() * Math.PI * 2,
    speed: 0.35 + random() * 0.9,
    typ: i % 9 === 0 ? 'wraith' : i % 5 === 0 ? 'animal' : 'human',
  }));

  function punktFarbe(typ) {
    if (typ === 'wraith') return '#c993ff';
    if (typ === 'animal') return '#87f2bd';
    return '#8feaff';
  }

  function zeichneAnzeige(t) {
    const w = canvas.width;
    const h = canvas.height;
    const mode = modi[modusIndex].key;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#031526';
    ctx.fillRect(0, 0, w, h);

    // Grundrissgitter.
    ctx.strokeStyle = '#0c4960';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#14627c';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Radar-Ringe.
    ctx.strokeStyle = '#1b7287';
    ctx.lineWidth = 1.5;
    for (const radius of [58, 108, 150]) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 10, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#287c8d';
    ctx.beginPath();
    ctx.moveTo(w / 2, 28);
    ctx.lineTo(w / 2, h - 28);
    ctx.moveTo(22, h / 2 + 10);
    ctx.lineTo(w - 22, h / 2 + 10);
    ctx.stroke();

    // Kopfleiste.
    ctx.fillStyle = 'rgba(10, 53, 76, 0.92)';
    ctx.fillRect(8, 8, w - 16, 42);
    ctx.strokeStyle = '#4bc5e8';
    ctx.strokeRect(8, 8, w - 16, 42);

    ctx.font = 'bold 19px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (!aktiv) {
      ctx.fillStyle = '#79d9ef';
      ctx.fillText('STANDBY', 22, 29);
      ctx.font = '17px monospace';
      ctx.fillStyle = '#f3b65c';
      ctx.fillText('ATA GENE REQUIRED', 22, 83);
      ctx.fillStyle = '#74c5dc';
      ctx.fillText('INSERT EXPEDITION ATA GENE', 22, 112);

      ctx.globalAlpha = 0.25 + Math.sin(t * 2.2) * 0.08;
      ctx.strokeStyle = '#8feaff';
      ctx.strokeRect(112, 134, 288, 104);
      ctx.globalAlpha = 1;
    } else {
      const titel = mode === 'life'
        ? 'LIFE SIGNS'
        : mode === 'energy'
          ? 'ENERGY SIGNATURES'
          : mode === 'ata'
            ? 'ATA GENE ANALYSIS'
            : 'DNA ANALYSIS';

      ctx.fillStyle = '#a6f0ff';
      ctx.fillText(titel, 20, 29);

      ctx.font = '15px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#70d5ee';
      ctx.fillText('SCAN ACTIVE', w - 20, 29);
      ctx.textAlign = 'left';

      if (mode === 'life') {
        let contacts = 0;

        for (const s of signaturen) {
          const px = w / 2 + (
            s.x + Math.sin(t * s.speed + s.phase) * 0.018
          ) * w;

          const py = h / 2 + 8 + (
            s.y + Math.cos(t * s.speed * 0.75 + s.phase) * 0.016
          ) * h;

          const puls = 1.4 + Math.max(
            0,
            Math.sin(t * 2.6 + s.phase)
          ) * 1.5;

          const farbe = punktFarbe(s.typ);

          ctx.globalCompositeOperation = 'lighter';
          ctx.shadowBlur = 12;
          ctx.shadowColor = farbe;
          ctx.fillStyle = farbe;
          ctx.beginPath();
          ctx.arc(px, py, puls, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
          contacts++;
        }

        ctx.font = '14px monospace';
        ctx.fillStyle = '#8dd9ea';
        ctx.fillText(`${contacts} CONTACTS`, 22, h - 28);
        ctx.fillStyle = '#c993ff';
        ctx.fillText('WRAITH', w - 210, h - 28);
        ctx.fillStyle = '#8feaff';
        ctx.fillText('HUMAN', w - 95, h - 28);
      } else if (mode === 'energy') {
        const energie = signaturen.filter(
          (s) => s.typ === 'wraith' || s.typ === 'animal'
        );

        for (const s of energie) {
          const px = w / 2 + (
            s.x + Math.sin(t * s.speed + s.phase) * 0.025
          ) * w;

          const py = h / 2 + 8 + (
            s.y + Math.cos(t * s.speed + s.phase) * 0.02
          ) * h;

          const puls = 2.2 + Math.max(
            0,
            Math.sin(t * 4 + s.phase)
          ) * 1.8;

          ctx.globalCompositeOperation = 'lighter';
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#ffb64c';
          ctx.fillStyle = '#ffb64c';
          ctx.beginPath();
          ctx.arc(px, py, puls, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.font = '14px monospace';
        ctx.fillStyle = '#ffbf61';
        ctx.fillText(`${energie.length} ENERGY SOURCES`, 22, h - 28);
      } else if (mode === 'ata') {
        const cx = w / 2;
        const cy = h / 2 + 10;

        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#c993ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#a64fff';

        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 8 + t * 0.35;
          const r = 4 + i * 0.73;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r * 0.58;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';

        ctx.font = '14px monospace';
        ctx.fillStyle = '#d6b5ff';
        ctx.fillText('ATA SEQUENCE MATCHED', 22, h - 28);
      } else {
        const cx = w / 2;
        const cy = h / 2 + 10;

        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#84edff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 9;
        ctx.shadowColor = '#42cfff';

        ctx.beginPath();
        ctx.moveTo(cx - 95, cy + 80);
        for (let i = 0; i <= 70; i++) {
          const p = i / 70;
          const px = cx - 95 + p * 190;
          const py = cy + Math.sin(p * Math.PI * 6 + t * 1.4) * 62;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i <= 70; i++) {
          const p = i / 70;
          const px = cx - 95 + p * 190;
          const py = cy + Math.sin(p * Math.PI * 6 + t * 1.4 + Math.PI) * 62;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';

        for (let i = 0; i <= 10; i++) {
          const p = i / 10;
          const px = cx - 95 + p * 190;
          const py = cy + Math.sin(p * Math.PI * 6 + t * 1.4) * 62;

          ctx.fillStyle = '#c7f8ff';
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = '14px monospace';
        ctx.fillStyle = '#9feaff';
        ctx.fillText('DNA FRAGMENT 23 / 46', 22, h - 28);
      }
    }

    // Expandierender Scanimpuls.
    if (aktiv && scanImpuls > 0) {
      const p = Math.min(1, scanImpuls / 1.8);
      const radius = 10 + p * 235;

      ctx.strokeStyle = `rgba(143,234,255,${(1 - p) * 0.85})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 + 10, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Untere Statusleiste.
    ctx.fillStyle = 'rgba(6, 42, 62, 0.9)';
    ctx.fillRect(8, h - 44, w - 16, 34);
    ctx.strokeStyle = '#2f7e96';
    ctx.strokeRect(8, h - 44, w - 16, 34);

    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#72cfe6';
    ctx.fillText('EXPEDITION // LANTIAN', 20, h - 27);
    ctx.textAlign = 'right';
    ctx.fillStyle = aktiv ? '#92ef9f' : '#f0ac51';
    ctx.fillText(aktiv ? 'LINKED' : 'LOCKED', w - 20, h - 27);

    displayTexture.needsUpdate = true;
  }

  function update(dt) {
    zeit += dt;

    if (scanImpuls > 0) {
      scanImpuls = Math.max(0, scanImpuls - dt);
    }

    displayMat.emissiveIntensity = aktiv
      ? 0.92 + Math.sin(zeit * 2.4) * 0.12
      : 0.48 + Math.sin(zeit * 1.4) * 0.06;

    statusLampe.material.emissiveIntensity = aktiv
      ? 1.7 + Math.sin(zeit * 3.2) * 0.7
      : 0.65;

    if (zeit - letzteZeichnung >= 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      letzteZeichnung = zeit;
      zeichneAnzeige(zeit);
    }
  }

  display.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (letzte !== null) {
      update(Math.min(0.1, Math.max(0, now - letzte)));
    }

    letzte = now;
  };

  zeichneAnzeige(0);

  // ------------------------------------------------------------------
  // Öffentliche API und Menüaktionen
  // ------------------------------------------------------------------
  const api = {
    aktivieren(mitAtaGen = false) {
      if (!mitAtaGen && !aktiv) return false;

      aktiv = true;
      scanImpuls = 1.8;
      return true;
    },

    deaktivieren() {
      aktiv = false;
      return true;
    },

    modusSetzen(name) {
      const index = modi.findIndex((m) => m.key === name);

      if (index >= 0) {
        modusIndex = index;
        scanImpuls = 1.4;
        return true;
      }

      return false;
    },

    naechsterModus() {
      modusIndex = (modusIndex + 1) % modi.length;
      scanImpuls = 1.4;
      return modi[modusIndex].label;
    },

    scanimpuls() {
      scanImpuls = 1.8;
    },

    get aktiv() {
      return aktiv;
    },

    get modus() {
      return modi[modusIndex].key;
    },

    get modusLabel() {
      return modi[modusIndex].label;
    },

    update,
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'ata_aktivieren',
      label: 'Mit ATA-Gen aktivieren',
      run: () => api.aktivieren(true),
    },
    {
      id: 'deaktivieren',
      label: 'Detektor deaktivieren',
      run: () => api.deaktivieren(),
    },
    {
      id: 'modus_life',
      label: 'Modus: Lebenszeichen',
      run: () => api.modusSetzen('life'),
    },
    {
      id: 'modus_energy',
      label: 'Modus: Energiesignaturen',
      run: () => api.modusSetzen('energy'),
    },
    {
      id: 'modus_ata',
      label: 'Modus: ATA-Gen',
      run: () => api.modusSetzen('ata'),
    },
    {
      id: 'modus_dna',
      label: 'Modus: DNA',
      run: () => api.modusSetzen('dna'),
    },
    {
      id: 'modus_wechseln',
      label: 'Nächsten Modus wechseln',
      run: () => api.naechsterModus(),
    },
    {
      id: 'scanimpuls',
      label: 'Scanimpuls senden',
      run: () => api.scanimpuls(),
    },
  ];

  if (opts.aktiv === true) {
    api.aktivieren(true);
  }

  return root;
}

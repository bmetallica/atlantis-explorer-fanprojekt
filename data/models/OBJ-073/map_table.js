// OBJ-073: Taktischer Kartentisch
// Standobjekt, Ursprung = Mitte der Unterseite. 1 Einheit = 1 Meter.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'map_table',
  art: 'Standobjekt',
  masse: '1,80 × 1,35 × 1,80 m (B × H × T)',
  wohin: 'ATL-001 (Stargate-Bereitschaft / Gate-Raum), ATL-002 (Kontrollraum / Kommandozentrale)',
  benutzen: 'INT_bedienen → taktische Lagebesprechung, Kartenebenen und Zielmarkierung',
  lichter: 'LAMP_hologramm (eisblau), LAMP_tischkante (bernstein)',
  animation: 'Hologramm pulsiert und dreht sich langsam; Stadtvolumen, Leitlinien und Zielmarkierung werden weich aktualisiert',
  quelle: 'selbst gebaut (Spielergänzung; Atlantis-Kartenstadt mit Grundriss der Stargate Operations als Karteneinsatz)',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'map_table';

  const matWand = kit('wall');
  const matDunkel = kit('wallDark');
  const matPerl = kit('pillar');
  const matBronze = kit('copper');

  const matGlas = new THREE.MeshStandardMaterial({
    name: 'tischglas',
    color: 0x8ac9df,
    metalness: 0.12,
    roughness: 0.16,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });

  const matHolm = new THREE.MeshStandardMaterial({
    name: 'holo_stadtvolumen',
    color: 0xd8f7ff,
    emissive: 0x45d5ff,
    emissiveIntensity: 1.35,
    metalness: 0.05,
    roughness: 0.24,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });

  const matRoute = new THREE.LineBasicMaterial({
    name: 'holo_leitlinien',
    color: 0x8eeeff,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const matStrahl = new THREE.MeshBasicMaterial({
    name: 'holo_projektionsvolumen',
    color: 0x45d9ff,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const matEmitter = new THREE.MeshBasicMaterial({
    name: 'holo_emitterstrahl',
    color: 0x7be8ff,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const matScan = new THREE.MeshBasicMaterial({
    name: 'holo_scanring',
    color: 0x65e2ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const matMarker = new THREE.MeshBasicMaterial({
    name: 'holo_zielmarkierung',
    color: 0xffbd62,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const dummy = new THREE.Object3D();

  // ------------------------------------------------------------------
  // Tischkörper: sechseckige Platte auf zentralem Stützpfeiler
  // ------------------------------------------------------------------
  const sockel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.68, 0.12, 48),
    matDunkel
  );
  sockel.position.y = 0.06;
  sockel.castShadow = true;
  sockel.receiveShadow = true;
  root.add(sockel);

  const sockelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.615, 0.022, 8, 48),
    matBronze
  );
  sockelRing.position.y = 0.125;
  sockelRing.rotation.x = Math.PI / 2;
  root.add(sockelRing);

  const saeule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.43, 0.56, 32),
    matPerl
  );
  saeule.position.y = 0.42;
  saeule.castShadow = true;
  saeule.receiveShadow = true;
  root.add(saeule);

  const saeulenKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.225, 0.225, 0.48, 6),
    matDunkel
  );
  saeulenKern.position.y = 0.42;
  saeulenKern.rotation.y = Math.PI / 6;
  root.add(saeulenKern);

  // Sechs vertikale Verstärkungsrippen am Pfeiler.
  const rippen = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 0.43, 0.12),
    matBronze,
    6
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    dummy.position.set(Math.sin(a) * 0.365, 0.42, Math.cos(a) * 0.365);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rippen.setMatrixAt(i, dummy.matrix);
  }
  rippen.instanceMatrix.needsUpdate = true;
  rippen.frustumCulled = false;
  root.add(rippen);

  const lager = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.62, 0.13, 48),
    matDunkel
  );
  lager.position.y = 0.765;
  lager.castShadow = true;
  root.add(lager);

  const lagerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.675, 0.019, 8, 48),
    matBronze
  );
  lagerRing.position.y = 0.827;
  lagerRing.rotation.x = Math.PI / 2;
  root.add(lagerRing);

  const tischplatte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.12, 6),
    matWand
  );
  tischplatte.position.y = 0.89;
  tischplatte.rotation.y = Math.PI / 6;
  tischplatte.castShadow = true;
  tischplatte.receiveShadow = true;
  root.add(tischplatte);

  const unterplatte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.79, 0.79, 0.035, 6),
    matBronze
  );
  unterplatte.position.y = 0.818;
  unterplatte.rotation.y = Math.PI / 6;
  root.add(unterplatte);

  const bronzering = new THREE.Mesh(
    new THREE.CylinderGeometry(0.815, 0.815, 0.032, 64),
    matBronze
  );
  bronzering.position.y = 0.946;
  root.add(bronzering);

  const glasplatte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.765, 0.765, 0.042, 64),
    matGlas
  );
  glasplatte.position.y = 0.969;
  root.add(glasplatte);

  // Sechzehn Leuchtsegmente am äußeren Tischrand.
  const randsegmente = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.125, 0.022, 0.027),
    new THREE.MeshStandardMaterial({
      name: 'tischkanten_leuchte',
      color: 0xc58b45,
      emissive: 0xffa54f,
      emissiveIntensity: 0.65,
      metalness: 0.78,
      roughness: 0.28,
    }),
    16
  );
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 0.846, 0.963, Math.cos(a) * 0.846);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    randsegmente.setMatrixAt(i, dummy.matrix);
  }
  randsegmente.instanceMatrix.needsUpdate = true;
  randsegmente.frustumCulled = false;
  root.add(randsegmente);

  // Angestellte Bedienkonsole auf der Vorderseite (+Z).
  const konsole = new THREE.Group();
  konsole.position.set(0, 0.984, 0.735);
  konsole.rotation.x = 0.38;
  root.add(konsole);

  const konsoleGehaeuse = new THREE.Mesh(
    new THREE.BoxGeometry(0.69, 0.045, 0.205),
    matDunkel
  );
  konsole.add(konsoleGehaeuse);

  const konsoleRand = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.025, 0.225),
    matBronze
  );
  konsoleRand.position.y = -0.025;
  konsole.add(konsoleRand);

  const konsoleDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.125),
    new THREE.MeshBasicMaterial({
      name: 'tastatur_display',
      color: 0x4fcfff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  konsoleDisplay.rotation.x = -Math.PI / 2;
  konsoleDisplay.position.set(-0.17, 0.026, 0);
  konsole.add(konsoleDisplay);

  const tasten = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.025, 0.029, 0.019, 12),
    new THREE.MeshStandardMaterial({
      name: 'taktische_taste',
      color: 0x9a6936,
      emissive: 0xffa04a,
      emissiveIntensity: 0.8,
      metalness: 0.7,
      roughness: 0.3,
    }),
    9
  );
  for (let i = 0; i < 9; i++) {
    const spalte = i % 3;
    const reihe = Math.floor(i / 3);
    dummy.position.set(0.055 + spalte * 0.085, 0.034, -0.043 + reihe * 0.06);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    tasten.setMatrixAt(i, dummy.matrix);
  }
  tasten.instanceMatrix.needsUpdate = true;
  tasten.frustumCulled = false;
  konsole.add(tasten);

  // ------------------------------------------------------------------
  // Holografische Projektion
  // ------------------------------------------------------------------
  const projektion = new THREE.Group();
  root.add(projektion);

  const layers = [
    {
      name: 'Stadtstruktur',
      farbe: 0x45d5ff,
      akzent: 0xd9f8ff,
      canvasFarbe: '#79e6ff',
    },
    {
      name: 'Verkehrsnetz',
      farbe: 0xffb45c,
      akzent: 0xffe0a4,
      canvasFarbe: '#ffc06a',
    },
    {
      name: 'Energieverteilung',
      farbe: 0x8b84ff,
      akzent: 0xe0ddff,
      canvasFarbe: '#a69fff',
    },
  ];

  let layerIndex = 0;

  // Canvas-Grundriss: Atlantis-Kartenstadt mit SGC-Operationseinsatz.
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  function pfad(points, close = true) {
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    if (close) ctx.closePath();
  }

  function linie(points) {
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.stroke();
  }

  function text(value, x, y, size = 18, align = 'left', farbe = '#bcefff') {
    ctx.textAlign = align;
    ctx.font = `600 ${size}px sans-serif`;
    ctx.fillStyle = farbe;
    ctx.fillText(value, x, y);
  }

  function drawPlan(index) {
    const layer = layers[index];
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Technical grid.
    ctx.strokeStyle = 'rgba(80, 205, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1024; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Coastal water area.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1024, 0);
    ctx.lineTo(1024, 1024);
    ctx.lineTo(0, 1024);
    ctx.closePath();
    ctx.fillStyle = 'rgba(24, 132, 185, 0.08)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(82, 213, 255, 0.58)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38cfff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-25, 120);
    ctx.bezierCurveTo(150, 80, 230, 150, 385, 125);
    ctx.bezierCurveTo(535, 100, 640, 155, 780, 120);
    ctx.bezierCurveTo(900, 90, 960, 120, 1050, 75);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-20, 895);
    ctx.bezierCurveTo(150, 820, 260, 890, 400, 850);
    ctx.bezierCurveTo(565, 800, 690, 865, 840, 830);
    ctx.bezierCurveTo(930, 810, 980, 825, 1050, 790);
    ctx.stroke();

    // Main city sectors.
    const sektoren = [
      [170, 215, 215, 150],
      [405, 185, 190, 135],
      [620, 220, 220, 160],
      [160, 405, 245, 155],
      [440, 370, 195, 135],
      [660, 420, 205, 150],
      [245, 600, 200, 125],
      [495, 570, 235, 145],
    ];

    sektoren.forEach(([x, y, w, h], i) => {
      ctx.strokeStyle = i % 3 === 0
        ? 'rgba(175, 244, 255, 0.88)'
        : 'rgba(85, 220, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = 'rgba(65, 195, 235, 0.08)';
      ctx.fillRect(x, y, w, h);

      for (let n = 0; n < 5; n++) {
        const bx = x + 18 + (n % 3) * ((w - 42) / 2);
        const by = y + 25 + Math.floor(n / 3) * ((h - 55) / 2);
        ctx.strokeStyle = 'rgba(142, 236, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, Math.min(45, w * 0.17), Math.min(30, h * 0.22));
      }
    });

    // Main transit routes.
    ctx.strokeStyle = layer.canvasFarbe;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 5;
    const routen = [
      [[70, 350], [230, 330], [390, 300], [525, 285], [690, 270], [920, 245]],
      [[350, 150], [370, 280], [360, 440], [400, 560], [470, 720]],
      [[110, 500], [260, 485], [430, 500], [610, 520], [820, 500]],
      [[185, 245], [220, 400], [275, 585], [350, 680]],
      [[605, 240], [630, 395], [665, 545], [720, 690]],
    ];
    routen.forEach((punkte) => linie(punkte));

    // Layer-specific overlays.
    if (index === 1) {
      ctx.strokeStyle = '#ffbd66';
      ctx.lineWidth = 6;
      [
        [[70, 350], [360, 440], [610, 520], [920, 245]],
        [[185, 245], [275, 585], [470, 720]],
      ].forEach((punkte) => linie(punkte));

      ctx.fillStyle = '#ffd28b';
      [[70, 350], [360, 440], [610, 520], [920, 245], [275, 585]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (index === 2) {
      ctx.strokeStyle = '#aaa5ff';
      ctx.lineWidth = 2;
      [[205, 285], [500, 250], [770, 300], [280, 470], [540, 435], [760, 490]]
        .forEach(([x, y], i, arr) => {
          if (i < arr.length - 1) {
            linie([[x, y], [arr[i + 1][0], arr[i + 1][1]]]);
          }
        });

      ctx.fillStyle = '#e3e0ff';
      [[205, 285], [500, 250], [770, 300], [280, 470], [540, 435], [760, 490]]
        .forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        });
    }

    // Operations floor-plan inset, based on the supplied reference.
    const ox = 590;
    const oy = 585;
    const ow = 395;
    const oh = 395;

    ctx.fillStyle = 'rgba(4, 25, 42, 0.72)';
    ctx.fillRect(ox, oy, ow, oh);
    ctx.strokeStyle = 'rgba(130, 232, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, ow, oh);

    ctx.save();
    ctx.translate(ox + 18, oy + 42);
    ctx.scale(0.33, 0.33);
    ctx.strokeStyle = 'rgba(186, 246, 255, 0.9)';
    ctx.lineWidth = 4;

    // Conference room.
    ctx.beginPath();
    ctx.arc(170, 95, 105, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(170, 95, 48, 30, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.strokeRect(170 + Math.cos(a) * 68 - 7, 95 + Math.sin(a) * 47 - 7, 14, 14);
    }

    // Control room.
    pfad([
      [480, 225], [620, 185], [760, 285], [735, 455],
      [565, 495], [470, 390], [505, 280],
    ]);
    ctx.stroke();

    // Gate room.
    pfad([
      [35, 440], [145, 390], [245, 455], [285, 590],
      [200, 700], [70, 665], [10, 555],
    ]);
    ctx.stroke();

    // Carter's office.
    pfad([
      [330, 700], [430, 640], [555, 690], [590, 840],
      [465, 920], [330, 870], [295, 775],
    ]);
    ctx.stroke();

    // Stairwell and connecting corridors.
    ctx.strokeRect(350, 330, 125, 130);
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(358, 340 + i * 10);
      ctx.lineTo(467, 340 + i * 10);
      ctx.stroke();
    }

    [
      [[255, 195], [325, 270], [350, 330]],
      [[470, 390], [505, 280]],
      [[285, 590], [330, 700]],
      [[555, 690], [620, 500]],
      [[200, 700], [295, 775]],
      [[350, 460], [330, 700]],
    ].forEach((punkte) => {
      pfad(punkte, false);
      ctx.stroke();
    });
    ctx.restore();

    text('SGC OPERATIONS', ox + 18, oy + 27, 18, 'left', '#c8f5ff');
    text('ATLANTIS / SECTOR 07', 44, 62, 25);
    text(layer.name.toUpperCase(), 44, 92, 19, 'left', layer.canvasFarbe);
    text('CONFERENCE ROOM', 173, 172, 14, 'center');
    text('CONTROL ROOM', 620, 292, 14, 'center');
    text('GATE ROOM', 150, 505, 14, 'center');
    text("CARTER'S OFFICE", 445, 770, 14, 'center');
    text('LIVE TACTICAL OVERLAY', 44, 990, 14, 'left', layer.canvasFarbe);
    ctx.restore();
  }

  drawPlan(layerIndex);

  const textur = new THREE.CanvasTexture(canvas);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 4;

  const matKarte = new THREE.MeshBasicMaterial({
    name: 'holo_grundriss',
    color: 0xffffff,
    map: textur,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const grundriss = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, 1.34),
    matKarte
  );
  grundriss.rotation.x = -Math.PI / 2;
  grundriss.position.y = 0.998;
  projektion.add(grundriss);

  // Geschlossener, schwacher Projektionskörper über der Glasplatte.
  const strahl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.71, 0.34, 48, 1, false),
    matStrahl
  );
  strahl.position.y = 1.19;
  projektion.add(strahl);

  const emitterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.67, 0.011, 6, 48),
    matEmitter
  );
  emitterRing.position.y = 1.008;
  emitterRing.rotation.x = Math.PI / 2;
  projektion.add(emitterRing);

  // Drei Scanringe und schlanke Emitterstrahlen.
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.61 - i * 0.025, 0.0035, 5, 40),
      matScan
    );
    ring.position.y = 1.055 + i * 0.115;
    ring.rotation.x = Math.PI / 2;
    projektion.add(ring);
  }

  const emitterStrahlen = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, 0.32, 8),
    matEmitter,
    12
  );
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 0.62, 1.16, Math.cos(a) * 0.62);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    emitterStrahlen.setMatrixAt(i, dummy.matrix);
  }
  emitterStrahlen.instanceMatrix.needsUpdate = true;
  emitterStrahlen.frustumCulled = false;
  projektion.add(emitterStrahlen);

  // 3D-Stadtvolumen, auf der Kartenebene verankert.
  const gebaeudeAnzahl = 48;
  const gebaeude = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    matHolm,
    gebaeudeAnzahl
  );

  const gebaeudeDaten = [];
  let seed = 7331;

  function zufall() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const bereiche = [
    { x: -0.39, z: -0.38, sx: 0.2, sz: 0.14, n: 7 },
    { x: -0.12, z: -0.41, sx: 0.17, sz: 0.12, n: 6 },
    { x: 0.2, z: -0.38, sx: 0.21, sz: 0.14, n: 7 },
    { x: 0.47, z: -0.32, sx: 0.14, sz: 0.12, n: 5 },
    { x: -0.43, z: -0.08, sx: 0.19, sz: 0.13, n: 6 },
    { x: -0.13, z: -0.06, sx: 0.13, sz: 0.1, n: 5 },
    { x: 0.17, z: -0.03, sx: 0.15, sz: 0.11, n: 5 },
    { x: 0.47, z: 0.02, sx: 0.12, sz: 0.1, n: 7 },
  ];

  for (const bereich of bereiche) {
    for (let i = 0; i < bereich.n; i++) {
      const w = 0.025 + zufall() * 0.047;
      const d = 0.025 + zufall() * 0.047;
      const h = 0.035 + Math.pow(zufall(), 1.8) * 0.205;
      const x = bereich.x + (zufall() - 0.5) * bereich.sx * 2;
      const z = bereich.z + (zufall() - 0.5) * bereich.sz * 2;
      gebaeudeDaten.push({ x, z, w, d, h });
    }
  }

  gebaeudeDaten.forEach((d, i) => {
    dummy.position.set(d.x, 1.006 + d.h / 2, d.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(d.w, d.h, d.d);
    dummy.updateMatrix();
    gebaeude.setMatrixAt(i, dummy.matrix);
    gebaeude.setColorAt(i, new THREE.Color(i % 7 === 0 ? 0xe4fbff : 0x70ddff));
  });
  gebaeude.instanceMatrix.needsUpdate = true;
  gebaeude.instanceColor.needsUpdate = true;
  gebaeude.frustumCulled = false;
  projektion.add(gebaeude);

  // Leuchtende Hauptleitungen knapp über dem Grundriss.
  const routePunkte = [];
  const routen = [
    [[-0.55, -0.31], [-0.28, -0.27], [-0.02, -0.23], [0.31, -0.19], [0.58, -0.12]],
    [[-0.3, -0.5], [-0.26, -0.28], [-0.2, -0.04], [-0.11, 0.25]],
    [[-0.55, -0.02], [-0.28, 0], [0, 0.03], [0.29, 0.07], [0.58, 0.11]],
    [[-0.24, -0.5], [-0.18, -0.28], [-0.11, -0.05], [-0.04, 0.19], [0.06, 0.4]],
    [[0.26, -0.49], [0.3, -0.27], [0.33, -0.04], [0.39, 0.2], [0.46, 0.39]],
  ];

  routen.forEach((route) => {
    for (let i = 0; i < route.length - 1; i++) {
      routePunkte.push(
        new THREE.Vector3(route[i][0], 1.013, route[i][1]),
        new THREE.Vector3(route[i + 1][0], 1.013, route[i + 1][1])
      );
    }
  });

  const routenGeo = new THREE.BufferGeometry().setFromPoints(routePunkte);
  const routenLinien = new THREE.LineSegments(routenGeo, matRoute);
  projektion.add(routenLinien);

  // Bewegliche taktische Zielmarkierung.
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.007, 6, 32),
    matMarker
  );
  marker.rotation.x = Math.PI / 2;
  marker.position.set(0.47, 1.075, 0.02);
  projektion.add(marker);

  const markerSpitze = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.045, 8),
    matMarker
  );
  markerSpitze.position.y = 0.048;
  marker.add(markerSpitze);

  const markerZiel = marker.position.clone();
  const markerPositionen = [
    new THREE.Vector3(0.47, 1.075, 0.02),
    new THREE.Vector3(-0.43, 1.075, -0.08),
    new THREE.Vector3(-0.04, 1.075, 0.4),
  ];

  // ------------------------------------------------------------------
  // Kollision und Benutzen-Punkt
  // ------------------------------------------------------------------
  const col = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.95, 1.70));
  col.name = 'COL_tisch';
  col.position.set(0, 0.475, 0);
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.01, 0.85);
  use.userData = {
    label: 'Taktische Lagebesprechung',
    radius: 0.85,
  };
  root.add(use);

  // ------------------------------------------------------------------
  // Lichter
  // ------------------------------------------------------------------
  const lampHolo = new THREE.Object3D();
  lampHolo.name = 'LAMP_hologramm';
  lampHolo.position.set(0, 1.25, 0);
  lampHolo.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5,
  };
  const holoLicht = new THREE.PointLight(0x6fe3ff, 4.5, 5, 2);
  lampHolo.add(holoLicht);
  root.add(lampHolo);

  const lampRand = new THREE.Object3D();
  lampRand.name = 'LAMP_tischkante';
  lampRand.position.set(0, 1.0, 0.7);
  lampRand.userData = {
    color: '#ffb45c',
    intensity: 2.5,
    distance: 2.6,
  };
  const randLicht = new THREE.PointLight(0xffad55, 1.4, 2.6, 2);
  lampRand.add(randLicht);
  root.add(lampRand);

  // ------------------------------------------------------------------
  // Zustand und Animation
  // ------------------------------------------------------------------
  let aktiv = true;
  let automatisch = true;
  let markierung = 0;
  let winkel = 0;
  let helligkeit = 1;
  let zeit = 0;
  let letzte = null;

  function ebeneSetzen(index) {
    layerIndex = ((index % layers.length) + layers.length) % layers.length;
    const layer = layers[layerIndex];

    matHolm.emissive.setHex(layer.farbe);
    matRoute.color.setHex(layer.farbe);
    matScan.color.setHex(layer.akzent);

    gebaeudeDaten.forEach((_, i) => {
      const farbe = i % 7 === 0 ? layer.akzent : layer.farbe;
      gebaeude.setColorAt(i, new THREE.Color(farbe));
    });
    gebaeude.instanceColor.needsUpdate = true;

    drawPlan(layerIndex);
    textur.needsUpdate = true;
    return layer.name;
  }

  function update(dt) {
    const step = Math.min(Math.max(dt, 0), 0.1);
    zeit += step;

    if (aktiv && automatisch) {
      winkel += step * 0.075;
    }
    projektion.rotation.y = winkel;

    const ziel = aktiv ? 1 : 0;
    helligkeit += (ziel - helligkeit) * Math.min(1, step * 5.5);

    const puls = 0.9 + Math.sin(zeit * 2.4) * 0.1;
    matHolm.emissiveIntensity = (0.08 + 1.42 * helligkeit) * puls;
    matHolm.opacity = 0.03 + 0.66 * helligkeit;
    matKarte.opacity = 0.02 + 0.8 * helligkeit;
    matRoute.opacity = (0.03 + 0.82 * helligkeit) * puls;
    matStrahl.opacity = 0.004 + 0.036 * helligkeit;
    matEmitter.opacity = (0.015 + 0.115 * helligkeit) * puls;
    matScan.opacity = (0.025 + 0.18 * helligkeit) * puls;
    matMarker.opacity = 0.2 + 0.75 * helligkeit;

    grundriss.visible = helligkeit > 0.005;
    gebaeude.visible = helligkeit > 0.005;
    routenLinien.visible = helligkeit > 0.005;
    strahl.visible = helligkeit > 0.005;
    emitterRing.visible = helligkeit > 0.005;
    emitterStrahlen.visible = helligkeit > 0.005;
    marker.visible = aktiv;

    const skala = 0.97 + 0.03 * helligkeit;
    projektion.scale.set(skala, skala, skala);

    marker.position.lerp(markerZiel, Math.min(1, step * 7));
    marker.rotation.z += step * 0.9;
    markerSpitze.rotation.y += step * 1.4;
  }

  tischplatte.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  function markierungSetzen(index) {
    markierung = ((index % markerPositionen.length) + markerPositionen.length)
      % markerPositionen.length;
    markerZiel.copy(markerPositionen[markierung]);
    return markierung;
  }

  const api = {
    einschalten() {
      aktiv = true;
    },
    ausschalten() {
      aktiv = false;
    },
    umschalten() {
      aktiv = !aktiv;
      return aktiv;
    },
    ebeneSetzen(index) {
      return ebeneSetzen(index);
    },
    ebeneWechseln() {
      return ebeneSetzen(layerIndex + 1);
    },
    automatischeDrehungSetzen(an) {
      automatisch = !!an;
    },
    ansichtDrehen(delta) {
      winkel += delta;
    },
    markierungSetzen,
    markierungWechseln() {
      return markierungSetzen(markierung + 1);
    },
    get aktiv() {
      return aktiv;
    },
    get ebene() {
      return layerIndex;
    },
    get ebenenname() {
      return layers[layerIndex].name;
    },
    get automatisch() {
      return automatisch;
    },
    get markierung() {
      return markierung;
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'hologramm',
      label: 'Hologramm ein-/ausschalten',
      run: () => {
        const an = api.umschalten();
        return {
          message: an
            ? 'Hologramm aktiviert.'
            : 'Hologramm deaktiviert.',
        };
      },
    },
    {
      id: 'ebene',
      label: 'Kartenebene wechseln',
      run: () => {
        const name = api.ebeneWechseln();
        return { message: `Kartenebene: ${name}.` };
      },
    },
    {
      id: 'drehung',
      label: 'Ansicht um 45° drehen',
      run: () => {
        api.ansichtDrehen(Math.PI / 4);
        return { message: 'Kartenansicht gedreht.' };
      },
    },
    {
      id: 'auto',
      label: 'Automatische Kartendrehung umschalten',
      run: () => {
        api.automatischeDrehungSetzen(!api.automatisch);
        return {
          message: api.automatisch
            ? 'Automatische Kartendrehung aktiv.'
            : 'Automatische Kartendrehung pausiert.',
        };
      },
    },
    {
      id: 'markierung',
      label: 'Nächstes taktisches Ziel markieren',
      run: () => {
        const index = api.markierungWechseln();
        return { message: `Zielmarkierung ${index + 1} gesetzt.` };
      },
    },
  ];

  return root;
}

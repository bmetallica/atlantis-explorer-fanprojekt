// Hilfs-Steuerkonsole – Ancient/Lantianischer Stil
// Freistehende Kombination aus Schrägpult und Rückwand mit Milchglaspaneelen.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'aux_console',
  art: 'Standobjekt / wandnahe Steuerkonsole',
  masse: '2,62 × 2,39 × 1,10 (B × H × T, m)',
  wohin: 'ATL-006 Hilfs-Kontrollzentrum, vor einer Rückwand',
  benutzen: 'INT_bedienen → Menü für ATA-Aktivierung und Systemauswahl',
  lichter: 'LAMP_paneele, LAMP_tasten, LAMP_bernstein (dauerhaft aktiv)',
  animation: 'Paneele leuchten sanft, Display pulsiert, Scanbalken und Tasten laufen',
  quelle: 'selbst gebaut nach Auftrag und Referenzbild',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'aux_console';

  // ------------------------------------------------------------
  // Materialien
  // ------------------------------------------------------------
  const matDark = kit('wallDark');
  const matMetal = kit('wall');
  const matCopper = kit('copper');
  const matPearl = kit('pillar');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmberGlow = kit('amberGlow');

  const matKeyWhite = new THREE.MeshStandardMaterial({
    name: 'tastenWeiss',
    color: 0xeafaff,
    emissive: 0xa9efff,
    emissiveIntensity: 0.42,
    metalness: 0.08,
    roughness: 0.3,
  });

  const matKeyAmber = new THREE.MeshStandardMaterial({
    name: 'tastenBernstein',
    color: 0xffd28c,
    emissive: 0xffa43c,
    emissiveIntensity: 0.48,
    metalness: 0.08,
    roughness: 0.3,
  });

  function box(geometrie, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(geometrie, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // ------------------------------------------------------------
  // Milchig hinterleuchtetes Glas mit dunklen Ancient-Ornamenten.
  // Die Textur dient zugleich als map und emissiveMap.
  // Es werden ausschließlich offene Konturen gezeichnet, keine gefüllten Punkte.
  // ------------------------------------------------------------
  function createPaneTexture(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;

    const ctx = canvas.getContext('2d');
    const ornamentColor = '#2a3a4a';
    const accentColor = '#405565';

    ctx.fillStyle = '#cfe6ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sehr dezente milchige Wolken; bewusst ohne dunkle Sprenkel.
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 18; i++) {
      const x = (i * 137 + index * 71) % canvas.width;
      const y = (i * 89 + index * 113) % canvas.height;
      const r = 26 + ((i * 17) % 62);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.68, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = ornamentColor;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    // Äußerer und innerer Rahmen.
    ctx.lineWidth = 7;
    ctx.strokeRect(28, 28, 456, 712);
    ctx.lineWidth = 3;
    ctx.strokeRect(47, 47, 418, 674);

    // Randstruktur der Paneele.
    ctx.lineWidth = 6;
    for (let i = 0; i < 5; i++) {
      const y = 110 + i * 137;
      const inset = 25 + ((i + index) % 3) * 18;

      ctx.beginPath();
      ctx.moveTo(inset, y);
      ctx.lineTo(145, y);
      ctx.lineTo(167, y + 22);
      ctx.lineTo(345, y + 22);
      ctx.lineTo(367, y);
      ctx.lineTo(512 - inset, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(62, y - 20);
      ctx.lineTo(112, y - 20);
      ctx.moveTo(400, y + 42);
      ctx.lineTo(450, y + 42);
      ctx.stroke();
    }

    // Offene technische Symbole an den Seiten.
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < 6; i++) {
        const x = side === 0 ? 64 : 448;
        const y = 96 + i * 108;
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 18);
        ctx.lineTo(x + 12, y - 18);
        ctx.lineTo(x + 12, y + 8);
        ctx.lineTo(x - 12, y + 8);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Schneeflockenartiges Ornament:
    // radiale Hauptarme, rechtwinklige Abzweigungen und offene Ringe.
    function drawAngularFlake(cx, cy, radius, arms, phase, branchCount) {
      ctx.strokeStyle = ornamentColor;

      for (let arm = 0; arm < arms; arm++) {
        const angle = phase + (arm / arms) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const px = -dy;
        const py = dx;

        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * radius, cy + dy * radius);
        ctx.stroke();

        for (let b = 1; b <= branchCount; b++) {
          const t = 0.25 + b * (0.66 / (branchCount + 1));
          const bx = cx + dx * radius * t;
          const by = cy + dy * radius * t;
          const branchLength = radius * (0.22 + 0.025 * (b % 2));

          for (const side of [-1, 1]) {
            const tx = bx + px * branchLength * side;
            const ty = by + py * branchLength * side;

            // Rechtwinklige Verzweigung.
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(tx, ty);
            ctx.lineTo(tx + dx * branchLength * 0.55, ty + dy * branchLength * 0.55);
            ctx.stroke();
          }

          // Kleine offene Ringe statt dunkler Punkte.
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(bx, by, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = ornamentColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, 34 + (index % 3) * 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Je Paneel ein eigenes, symmetrisches Hauptmuster.
    if (index === 0) {
      drawAngularFlake(256, 385, 205, 8, Math.PI / 8, 4);
      drawAngularFlake(256, 385, 88, 8, Math.PI / 8 + 0.12, 2);
    } else if (index === 1) {
      drawAngularFlake(256, 385, 215, 6, -Math.PI / 2, 4);
      drawAngularFlake(256, 385, 102, 6, -Math.PI / 2 + 0.2, 3);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(256, 150);
      ctx.lineTo(256, 620);
      ctx.moveTo(105, 385);
      ctx.lineTo(407, 385);
      ctx.stroke();
    } else {
      drawAngularFlake(256, 385, 195, 5, Math.PI / 2, 3);
      drawAngularFlake(256, 385, 92, 5, Math.PI / 2 + 0.25, 2);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(92, 250);
      ctx.lineTo(175, 250);
      ctx.lineTo(175, 315);
      ctx.lineTo(337, 315);
      ctx.lineTo(337, 455);
      ctx.lineTo(420, 455);
      ctx.moveTo(92, 520);
      ctx.lineTo(175, 520);
      ctx.lineTo(175, 455);
      ctx.stroke();
    }

    // Offene Eckornamente.
    ctx.strokeStyle = ornamentColor;
    ctx.lineWidth = 7;
    for (const [x, y, sx, sy] of [
      [64, 64, 1, 1],
      [448, 64, -1, 1],
      [64, 704, 1, -1],
      [448, 704, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * 56, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * 56);
      ctx.moveTo(x + sx * 38, y + sy * 15);
      ctx.lineTo(x + sx * 15, y + sy * 15);
      ctx.lineTo(x + sx * 15, y + sy * 38);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  // ------------------------------------------------------------
  // Sockel und Unterbau
  // ------------------------------------------------------------
  box(new THREE.BoxGeometry(2.60, 0.16, 1.02), matDark, 0, 0.08, 0.02);
  box(new THREE.BoxGeometry(2.62, 0.035, 1.04), matRail, 0, 0.1775, 0.02);

  box(new THREE.BoxGeometry(1.36, 0.78, 0.66), matDark, 0, 0.57, 0.04);
  box(new THREE.BoxGeometry(1.24, 0.58, 0.055), matMetal, 0, 0.56, 0.397);
  box(new THREE.BoxGeometry(1.26, 0.025, 0.065), matRail, 0, 0.865, 0.405);

  for (const sx of [-1.0, 1.0]) {
    box(new THREE.BoxGeometry(0.48, 0.76, 0.48), matDark, sx, 0.56, 0.0);
    box(new THREE.BoxGeometry(0.50, 0.03, 0.50), matRail, sx, 0.955, 0.0);

    box(new THREE.BoxGeometry(0.14, 1.12, 0.18), matDark, sx, 0.74, -0.38);
    box(new THREE.BoxGeometry(0.16, 0.035, 0.20), matRail, sx, 1.315, -0.38);
  }

  // ------------------------------------------------------------
  // Rückwand und hinterleuchtete Milchglasfelder
  // ------------------------------------------------------------
  box(new THREE.BoxGeometry(2.60, 1.26, 0.18), matDark, 0, 1.71, -0.46);
  box(new THREE.BoxGeometry(2.62, 0.05, 0.21), matRail, 0, 2.365, -0.46);

  const panelXs = [-0.84, 0, 0.84];
  const panelMaterials = [];

  panelXs.forEach((px, index) => {
    // Geschlossener, perlgrauer Träger hinter der Glasfläche.
    box(new THREE.BoxGeometry(0.79, 1.09, 0.06), matPearl, px, 1.70, -0.345);

    const paneTexture = createPaneTexture(index);
    const paneMaterial = new THREE.MeshStandardMaterial({
      name: `milchglasPaneel${index + 1}`,
      color: 0xffffff,
      map: paneTexture,
      emissive: 0x9fd0ff,
      emissiveMap: paneTexture,
      emissiveIntensity: 0.6,
      metalness: 0.02,
      roughness: 0.52,
    });
    panelMaterials.push(paneMaterial);

    // Separate Vorderfläche verhindert eine verzerrte Textur an den Kanten.
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 1.00), paneMaterial);
    pane.position.set(px, 1.70, -0.306);
    pane.receiveShadow = true;
    root.add(pane);

    // Schmale Lichtkanten rahmen das milchige Glas.
    box(new THREE.BoxGeometry(0.72, 0.012, 0.016), matGlow, px, 1.194, -0.292);
    box(new THREE.BoxGeometry(0.72, 0.012, 0.016), matGlow, px, 2.206, -0.292);
    box(new THREE.BoxGeometry(0.012, 1.012, 0.016), matGlow, px - 0.354, 1.70, -0.292);
    box(new THREE.BoxGeometry(0.012, 1.012, 0.016), matGlow, px + 0.354, 1.70, -0.292);

    const node = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.018, 16),
      matRail
    );
    node.geometry.rotateX(Math.PI / 2);
    node.position.set(px, 1.70, -0.285);
    root.add(node);
  });

  // ------------------------------------------------------------
  // Hauptpult – flach aufgebaut und gemeinsam geneigt
  // ------------------------------------------------------------
  const pult = new THREE.Group();
  pult.name = 'schraegpult';
  pult.position.set(0, 1.00, 0.16);
  pult.rotation.x = 0.30;
  root.add(pult);

  box(new THREE.BoxGeometry(1.50, 0.105, 0.62), matMetal, 0, 0, 0, pult);
  box(new THREE.BoxGeometry(1.54, 0.028, 0.66), matRail, 0, -0.045, 0, pult);
  box(new THREE.BoxGeometry(1.36, 0.035, 0.40), matDark, 0, 0.067, 0.055, pult);
  box(new THREE.BoxGeometry(1.30, 0.012, 0.34), matPearl, 0, 0.089, 0.055, pult);

  // ------------------------------------------------------------
  // Zentrales Display
  // ------------------------------------------------------------
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 640;
  displayCanvas.height = 320;
  const displayCtx = displayCanvas.getContext('2d');
  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;

  const matDisplay = new THREE.MeshStandardMaterial({
    name: 'hilfsdisplay',
    color: 0xffffff,
    map: displayTexture,
    emissive: 0xffffff,
    emissiveMap: displayTexture,
    emissiveIntensity: 0.55,
    metalness: 0.05,
    roughness: 0.36,
    toneMapped: false,
  });

  const displayFrame = box(
    new THREE.BoxGeometry(0.72, 0.045, 0.31),
    matDark,
    0,
    0.108,
    -0.095,
    pult
  );

  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.26), matDisplay);
  display.geometry.rotateX(-Math.PI / 2);
  display.position.set(0, 0.133, -0.095);
  pult.add(display);

  const scanBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.006, 0.012),
    matGlow
  );
  scanBar.position.set(0, 0.137, -0.095);
  pult.add(scanBar);

  // ------------------------------------------------------------
  // Tastenfelder des Hauptpults
  // ------------------------------------------------------------
  const dummy = new THREE.Object3D();
  const whiteKeyEntries = [];
  const amberKeyEntries = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const entry = {
        x: -0.42 + col * 0.105,
        y: 0.105,
        z: 0.055 + row * 0.072,
      };

      if (
        (row === 2 && (col === 1 || col === 7)) ||
        (row === 1 && col === 4)
      ) {
        amberKeyEntries.push(entry);
      } else {
        whiteKeyEntries.push(entry);
      }
    }
  }

  const keyGeometry = new THREE.BoxGeometry(0.072, 0.028, 0.048);

  const whiteKeys = new THREE.InstancedMesh(
    keyGeometry,
    matKeyWhite,
    whiteKeyEntries.length
  );
  whiteKeys.castShadow = true;
  whiteKeys.receiveShadow = true;

  whiteKeyEntries.forEach((entry, i) => {
    dummy.position.set(entry.x, entry.y, entry.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    whiteKeys.setMatrixAt(i, dummy.matrix);
  });
  whiteKeys.instanceMatrix.needsUpdate = true;
  pult.add(whiteKeys);

  const amberKeys = new THREE.InstancedMesh(
    keyGeometry,
    matKeyAmber,
    amberKeyEntries.length
  );
  amberKeys.castShadow = true;
  amberKeys.receiveShadow = true;

  amberKeyEntries.forEach((entry, i) => {
    dummy.position.set(entry.x, entry.y, entry.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    amberKeys.setMatrixAt(i, dummy.matrix);
  });
  amberKeys.instanceMatrix.needsUpdate = true;
  pult.add(amberKeys);

  for (const kx of [-0.65, 0.65]) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.047, 0.045, 20),
      matCopper
    );
    knob.position.set(kx, 0.102, -0.10);
    pult.add(knob);

    const knobMark = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.049, 20),
      matGlow
    );
    knobMark.position.set(kx, 0.104, -0.10);
    pult.add(knobMark);
  }

  // ------------------------------------------------------------
  // Zwei seitliche Schrägpult-Flügel
  // ------------------------------------------------------------
  const sideKeyGeometry = new THREE.BoxGeometry(0.085, 0.026, 0.052);

  [-1, 1].forEach((side) => {
    const wing = new THREE.Group();
    wing.name = side < 0 ? 'pultfluegelLinks' : 'pultfluegelRechts';
    wing.position.set(side * 1.0, 0.99, 0.13);
    wing.rotation.x = 0.30;
    root.add(wing);

    box(new THREE.BoxGeometry(0.50, 0.095, 0.58), matMetal, 0, 0, 0, wing);
    box(new THREE.BoxGeometry(0.52, 0.026, 0.60), matRail, 0, -0.043, 0, wing);

    const wingDisplayMaterial = new THREE.MeshStandardMaterial({
      name: 'seitenDisplay',
      color: 0x102633,
      emissive: 0x5fc7e8,
      emissiveIntensity: 0.42,
      metalness: 0.05,
      roughness: 0.35,
    });

    const wingDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.31, 0.15),
      wingDisplayMaterial
    );
    wingDisplay.geometry.rotateX(-Math.PI / 2);
    wingDisplay.position.set(0, 0.052, -0.12);
    wing.add(wingDisplay);

    const wingKeys = new THREE.InstancedMesh(
      sideKeyGeometry,
      matKeyWhite,
      9
    );
    wingKeys.castShadow = true;
    wingKeys.receiveShadow = true;

    let index = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        dummy.position.set(-0.12 + col * 0.12, 0.067, 0.03 + row * 0.075);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        wingKeys.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
    wingKeys.instanceMatrix.needsUpdate = true;
    wing.add(wingKeys);

    const wingKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.043, 0.048, 0.042, 20),
      matCopper
    );
    wingKnob.position.set(0, 0.078, -0.225);
    wing.add(wingKnob);
  });

  // ------------------------------------------------------------
  // Kollision, Benutzen-Punkt und Lichter
  // ------------------------------------------------------------
  const colBody = new THREE.Mesh(new THREE.BoxGeometry(2.60, 1.00, 1.02));
  colBody.name = 'COL_konsole';
  colBody.position.set(0, 0.50, 0.02);
  root.add(colBody);

  const colWall = new THREE.Mesh(new THREE.BoxGeometry(2.60, 1.31, 0.20));
  colWall.name = 'COL_rueckwand';
  colWall.position.set(0, 1.715, -0.46);
  root.add(colWall);

  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.12, 1.02);
  use.userData = {
    label: 'Hilfs-Steuerkonsole bedienen',
    radius: 0.9,
  };
  root.add(use);

  const lampPanels = new THREE.Object3D();
  lampPanels.name = 'LAMP_paneele';
  lampPanels.position.set(0, 1.75, -0.18);
  lampPanels.userData = {
    color: '#8be4ff',
    intensity: 5,
    distance: 4.5,
  };
  root.add(lampPanels);

  const lampKeys = new THREE.Object3D();
  lampKeys.name = 'LAMP_tasten';
  lampKeys.position.set(0, 1.06, 0.62);
  lampKeys.userData = {
    color: '#b5f1ff',
    intensity: 4,
    distance: 3.2,
  };
  root.add(lampKeys);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_bernstein';
  lampAmber.position.set(0, 0.97, 0.47);
  lampAmber.userData = {
    color: '#ffb45c',
    intensity: 2,
    distance: 2,
  };
  root.add(lampAmber);

  // ------------------------------------------------------------
  // Zustand, Display-Schemata und öffentliche API
  // ------------------------------------------------------------
  let initialisiert = false;
  let an = false;
  let aktivesSystem = 'antrieb';
  let letzterBefehl = null;
  let zeit = 0;
  let letzte = null;

  const systemNamen = {
    antrieb: 'STERNENANTRIEB',
    drohnen: 'DROHNENSTEUERUNG',
    tueren: 'TÜREN / KRAFTFELDER',
    energie: 'ENERGIEUMLEITUNG',
    waffen: 'WAFENSYSTEME',
    leben: 'LEBENSZEICHEN',
  };

  function zeichneDisplay() {
    const w = displayCanvas.width;
    const h = displayCanvas.height;
    const ctx = displayCtx;

    ctx.fillStyle = '#06131d';
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(320, 160, 20, 320, 160, 360);
    glow.addColorStop(0, 'rgba(25,77,96,0.38)');
    glow.addColorStop(1, 'rgba(6,19,29,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(100,205,240,0.13)';
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

    ctx.fillStyle = an ? '#d8f7ff' : '#718a98';
    ctx.font = 'bold 25px monospace';
    ctx.fillText(systemNamen[aktivesSystem] || 'HILFSSTEUERUNG', 24, 38);

    ctx.fillStyle = an ? '#78ddff' : '#60717c';
    ctx.font = '15px monospace';
    ctx.fillText(
      an
        ? 'ATA-VERBINDUNG AKTIV  //  HILFSKONTROLLZENTRUM'
        : initialisiert
          ? 'STANDBY  //  BEREIT ZUR REAKTIVIERUNG'
          : 'ERSTMALIGE AKTIVIERUNG BENÖTIGT ATA-GEN',
      24,
      66
    );

    ctx.strokeStyle = an ? '#b9efff' : '#607580';
    ctx.fillStyle = an ? '#b9efff' : '#607580';
    ctx.lineWidth = 2;

    const mx = 320;
    const my = 184;

    if (aktivesSystem === 'antrieb') {
      for (let r = 30; r <= 100; r += 22) {
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(angle) * 100, my + Math.sin(angle) * 100);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (aktivesSystem === 'drohnen') {
      for (let i = 0; i < 3; i++) {
        const x = mx - 90 + i * 90;
        ctx.beginPath();
        ctx.moveTo(x, my - 40);
        ctx.lineTo(x - 30, my + 30);
        ctx.lineTo(x + 30, my + 30);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 20, my - 17);
        ctx.lineTo(x + 20, my - 17);
        ctx.stroke();
      }
    } else if (aktivesSystem === 'tueren') {
      for (let i = 0; i < 4; i++) {
        const x = 190 + i * 86;
        ctx.strokeRect(x, my - 47, 55, 94);
        ctx.beginPath();
        ctx.moveTo(x + 45, my);
        ctx.lineTo(x + 70, my);
        ctx.stroke();
      }
    } else if (aktivesSystem === 'energie') {
      for (let i = 0; i < 7; i++) {
        const x = 190 + i * 38;
        const barHeight = 45 + (i % 3) * 27;
        ctx.strokeRect(x, my + 55 - barHeight, 24, barHeight);
      }
    } else if (aktivesSystem === 'waffen') {
      for (let r = 20; r <= 78; r += 19) {
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(mx - 110, my);
      ctx.lineTo(mx + 110, my);
      ctx.moveTo(mx, my - 110);
      ctx.lineTo(mx, my + 110);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(175, my);
      for (let x = 175; x <= 465; x += 7) {
        const y = my + Math.sin((x - 175) * 0.07) * 44;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my, 92, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = '13px monospace';
    ctx.fillText('STATUS:', 24, 290);
    ctx.fillText(an ? 'AKTIV' : initialisiert ? 'BEREIT' : 'GESPERRT', 90, 290);
    ctx.fillText('ATL-006', 510, 290);

    displayTexture.needsUpdate = true;
  }

  function normalisiereCode(code) {
    return String(code ?? '')
      .toUpperCase()
      .replace(/[\s_-]/g, '');
  }

  const api = {
    aktivieren(code) {
      if (!initialisiert) {
        const normalisiert = normalisiereCode(code);
        if (normalisiert !== 'ATA' && normalisiert !== 'ATAGEN') {
          zeichneDisplay();
          return false;
        }
        initialisiert = true;
      }

      an = true;
      zeichneDisplay();
      return true;
    },

    ausschalten() {
      an = false;
      zeichneDisplay();
      return true;
    },

    waehlen(system) {
      if (!Object.prototype.hasOwnProperty.call(systemNamen, system)) {
        return false;
      }

      aktivesSystem = system;

      if (an) {
        letzterBefehl = {
          system,
          zeit,
        };
      }

      zeichneDisplay();
      return true;
    },

    get an() {
      return an;
    },

    get initialisiert() {
      return initialisiert;
    },

    get system() {
      return aktivesSystem;
    },

    get letzterBefehl() {
      return letzterBefehl;
    },

    get status() {
      return {
        initialisiert,
        an,
        system: aktivesSystem,
      };
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'aktivieren',
      label: 'Mit ATA-Gen aktivieren',
      run: () => api.aktivieren('ATA-GEN'),
    },
    {
      id: 'ausschalten',
      label: 'Hilfs-Steuerkonsole ausschalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'system_antrieb',
      label: 'System: Sternenantrieb',
      run: () => api.waehlen('antrieb'),
    },
    {
      id: 'system_drohnen',
      label: 'System: Drohnensteuerung',
      run: () => api.waehlen('drohnen'),
    },
    {
      id: 'system_tueren',
      label: 'System: Türen und Kraftfelder',
      run: () => api.waehlen('tueren'),
    },
    {
      id: 'system_energie',
      label: 'System: Energieumleitung',
      run: () => api.waehlen('energie'),
    },
    {
      id: 'system_waffen',
      label: 'System: Waffen',
      run: () => api.waehlen('waffen'),
    },
    {
      id: 'system_leben',
      label: 'System: Lebenszeichen orten',
      run: () => api.waehlen('leben'),
    },
  ];

  root.userData.hint =
    'Alternative Kommandozentrale bei Übernahme des Kontrollraums. ' +
    'Erstaktivierung benötigt das ATA-Gen.';

  zeichneDisplay();

  if (opts.ataGen === true || normalisiereCode(opts.gene) === 'ATAGEN') {
    api.aktivieren('ATA-GEN');
  }

  // ------------------------------------------------------------
  // Weiche, selbstständige Animation
  // ------------------------------------------------------------
  function update(dt) {
    zeit += dt;

    const displayZiel = an ? 0.92 : 0.14;
    matDisplay.emissiveIntensity +=
      (displayZiel - matDisplay.emissiveIntensity) * Math.min(1, dt * 5);

    const weissZiel = an ? 0.72 + Math.sin(zeit * 3.2) * 0.12 : 0.09;
    const bernsteinZiel = an ? 0.82 + Math.sin(zeit * 3.2 + 1.5) * 0.16 : 0.06;

    matKeyWhite.emissiveIntensity +=
      (weissZiel - matKeyWhite.emissiveIntensity) * Math.min(1, dt * 7);
    matKeyAmber.emissiveIntensity +=
      (bernsteinZiel - matKeyAmber.emissiveIntensity) * Math.min(1, dt * 7);

    // Zurückhaltende Hinterbeleuchtung: Die dunklen Ancient-Ornamente
    // müssen auch im aktiven Zustand deutlich lesbar bleiben.
    panelMaterials.forEach((material, index) => {
      const ziel = an
        ? 0.62 + Math.sin(zeit * 1.15 + index * 0.7) * 0.025
        : 0.58;

      material.emissiveIntensity +=
        (ziel - material.emissiveIntensity) * Math.min(1, dt * 3.5);
    });

    scanBar.position.z = -0.095 + Math.sin(zeit * 2.1) * 0.105;
    scanBar.visible = an;
  }

  displayFrame.onBeforeRender = () => {
    const now = performance.now() / 1000;

    if (letzte !== null) {
      update(Math.min(Math.max(now - letzte, 0), 0.1));
    }

    letzte = now;
  };

  root.userData.update = update;

  return root;
}

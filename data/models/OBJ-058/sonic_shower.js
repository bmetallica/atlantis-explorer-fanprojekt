// Antike Schall-Reinigungsdusche – Spielergänzung für Atlantis-Quartiere.
// Standobjekt: runde Duschkabine, 1,00 m Durchmesser, 2,30 m Gesamthöhe.
// Ursprung: Mitte der Unterseite, offene Vorderseite zeigt nach +Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'sonic_shower',
  art: 'Standobjekt',
  masse: '1,00 × 2,30 × 1,00 (Ø × H × T, m)',
  wohin: 'ATL-024 Crew-Quartiere / Wohnbereich, Badezimmer',
  benutzen: 'INT_reinigung → Menü aus userData.actions',
  lichter: 'LAMP_ambient und LAMP_schallring (eisblau, dauerhaft vorhanden)',
  animation: 'Emitterring und vertikale Schallleisten flimmern bläulich; Anzeige pulsiert',
  quelle: 'selbst gebaut, Spielergänzung im Ancient-/Lantianer-Stil',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'sonic_shower';

  // ------------------------------------------------------------------
  // Spielmaterialien
  // ------------------------------------------------------------------
  const wall = new THREE.MeshStandardMaterial({ name: 'KIT_wall' });
  const wallDark = new THREE.MeshStandardMaterial({ name: 'KIT_wallDark' });
  const pillar = new THREE.MeshStandardMaterial({ name: 'KIT_pillar' });
  const copper = new THREE.MeshStandardMaterial({ name: 'KIT_copper' });
  const rail = new THREE.MeshStandardMaterial({ name: 'KIT_rail' });
  const hull = new THREE.MeshStandardMaterial({ name: 'KIT_hull' });
  const floor = new THREE.MeshStandardMaterial({ name: 'KIT_floor' });

  const emitterMat = new THREE.MeshStandardMaterial({
    name: 'sonic_emitter',
    color: 0x7bdcff,
    emissive: 0x3bbdff,
    emissiveIntensity: 0.08,
    metalness: 0.3,
    roughness: 0.24,
  });

  const statusMat = new THREE.MeshStandardMaterial({
    name: 'sonic_status',
    color: 0x6fe3ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.12,
    metalness: 0.1,
    roughness: 0.3,
  });

  // Kleine prozedurale Konsolendarstellung ohne externe Dateien.
  let screenMap = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#06151f';
    ctx.fillRect(0, 0, 256, 320);
    ctx.strokeStyle = '#6fe3ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(9, 9, 238, 302);

    ctx.fillStyle = '#9beeff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SONIC', 128, 55);
    ctx.font = '17px sans-serif';
    ctx.fillText('BODY CLEAN', 128, 82);

    ctx.strokeStyle = '#38bde8';
    ctx.lineWidth = 5;
    for (let row = 0; row < 5; row++) {
      ctx.beginPath();
      for (let x = 24; x <= 232; x += 4) {
        const y = 120 + row * 29 + Math.sin(x * 0.055 + row * 0.8) * 10;
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#6fe3ff';
    ctx.fillRect(36, 274, 184, 4);
    ctx.fillRect(36, 286, 126, 4);

    screenMap = new THREE.CanvasTexture(canvas);
    screenMap.colorSpace = THREE.SRGBColorSpace;
  }

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'sonic_screen',
    color: 0x071923,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.28,
    metalness: 0.25,
    roughness: 0.3,
  });

  if (screenMap) {
    screenMat.map = screenMap;
    screenMat.emissiveMap = screenMap;
  }

  // ------------------------------------------------------------------
  // Sockel, Schale und Abfluss
  // ------------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.12, 48),
    wallDark,
  );
  base.name = 'sockel';
  base.position.y = 0.06;
  root.add(base);

  const baseTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.465, 0.022, 6, 32),
    copper,
  );
  baseTrim.name = 'sockel_bronze_kante';
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.position.y = 0.125;
  root.add(baseTrim);

  const showerFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.415, 0.415, 0.035, 32),
    floor,
  );
  showerFloor.name = 'bodenwanne';
  showerFloor.position.y = 0.1375;
  root.add(showerFloor);

  const drain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.012, 24),
    wallDark,
  );
  drain.name = 'abfluss';
  drain.position.y = 0.161;
  root.add(drain);

  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.034 + i * 0.025, 0.004, 4, 16),
      copper,
    );
    ring.name = `abflussring_${i + 1}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.169;
    root.add(ring);
  }

  // ------------------------------------------------------------------
  // Segmentierte, gebogene Rückwand aus Ancient-Wandmodulen
  // Theta 0 zeigt nach +Z. Die Kabine bleibt daher vorne geöffnet.
  // ------------------------------------------------------------------
  const panelCount = 9;
  const panelStart = 1.682;
  const panelStep = 0.32625;
  const panelArc = 0.278;
  const panelHeight = 1.82;

  for (let i = 0; i < panelCount; i++) {
    const angle = panelStart + i * panelStep;
    const panel = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.462,
        0.462,
        panelHeight,
        4,
        1,
        false,
        angle,
        panelArc,
      ),
      i % 2 === 0 ? wall : pillar,
    );
    panel.name = `rueckwand_modul_${i + 1}`;
    panel.position.y = 1.08;
    root.add(panel);

    // Schmale senkrechte Bronzeakzente auf der Außenseite.
    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 1.34, 0.012),
      copper,
    );
    accent.name = `rueckwand_akzent_${i + 1}`;
    accent.position.set(
      Math.sin(angle + panelArc * 0.5) * 0.472,
      1.08,
      Math.cos(angle + panelArc * 0.5) * 0.472,
    );
    accent.rotation.y = angle + panelArc * 0.5;
    root.add(accent);
  }

  // Bronze-/Stahlblau-Fugen zwischen den Wandsegmenten.
  for (let i = 0; i < panelCount - 1; i++) {
    const angle = panelStart + (i + 0.5) * panelStep;
    const seam = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.474,
        0.474,
        1.74,
        3,
        1,
        false,
        angle - 0.012,
        0.024,
      ),
      i % 2 === 0 ? wallDark : copper,
    );
    seam.name = `rueckwand_fuge_${i + 1}`;
    seam.position.y = 1.08;
    root.add(seam);
  }

  // Verstärkungsrippen an den beiden Seiten der Kabine.
  for (const side of [-1, 1]) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 1.92, 0.09),
      wallDark,
    );
    rib.name = side < 0 ? 'linke_rippe' : 'rechte_rippe';
    rib.position.set(side * 0.455, 1.08, 0.02);
    root.add(rib);

    const ribInset = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 1.62, 0.012),
      copper,
    );
    ribInset.name = side < 0 ? 'linke_rippe_akzent' : 'rechte_rippe_akzent';
    ribInset.position.set(side * 0.452, 1.08, 0.075);
    root.add(ribInset);
  }

  // ------------------------------------------------------------------
  // Obere Haube, Ringträger und Emitterkopf
  // ------------------------------------------------------------------
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.46, 0.15, 48),
    hull,
  );
  canopy.name = 'obere_haube';
  canopy.position.y = 2.225;
  root.add(canopy);

  const canopyEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.465, 0.025, 6, 32),
    copper,
  );
  canopyEdge.name = 'haube_bronze_kante';
  canopyEdge.rotation.x = Math.PI / 2;
  canopyEdge.position.y = 2.155;
  root.add(canopyEdge);

  const topTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.018, 5, 28),
    rail,
  );
  topTrim.name = 'haube_obere_zierkante';
  topTrim.rotation.x = Math.PI / 2;
  topTrim.position.y = 2.277;
  root.add(topTrim);

  const upperRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.405, 0.032, 6, 32),
    rail,
  );
  upperRing.name = 'oberer_emitterring_traeger';
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = 1.985;
  root.add(upperRing);

  const underside = new THREE.Mesh(
    new THREE.CylinderGeometry(0.405, 0.405, 0.018, 32),
    wallDark,
  );
  underside.name = 'haube_unterseite';
  underside.position.y = 2.14;
  root.add(underside);

  const emitterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.018, 24),
    emitterMat,
  );
  emitterDisc.name = 'zentraler_schallemitter';
  emitterDisc.position.y = 2.124;
  root.add(emitterDisc);

  // Schallring: 16 radial angeordnete Emitter.
  const emitterCount = 16;
  const emitters = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.105, 0.045, 0.07),
    emitterMat,
    emitterCount,
  );
  emitters.name = 'schall_emitterring';
  emitters.castShadow = false;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < emitterCount; i++) {
    const angle = (i / emitterCount) * Math.PI * 2;
    dummy.position.set(
      Math.sin(angle) * 0.325,
      1.86,
      Math.cos(angle) * 0.325,
    );
    dummy.rotation.set(0, angle, 0);
    dummy.updateMatrix();
    emitters.setMatrixAt(i, dummy.matrix);
  }
  emitters.instanceMatrix.needsUpdate = true;
  root.add(emitters);

  // Dünner Leuchtring über den Emittern.
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.325, 0.012, 5, 32),
    emitterMat,
  );
  glowRing.name = 'schall_leuchtring';
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 1.825;
  root.add(glowRing);

  // Kleine vertikale Schallleitungen vom Ring zur Haube.
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8),
      copper,
    );
    pipe.name = `schall_leitung_${i + 1}`;
    pipe.position.set(
      Math.sin(angle) * 0.39,
      1.99,
      Math.cos(angle) * 0.39,
    );
    root.add(pipe);
  }

  // Vertikale Schallleisten im hinteren Kabinenbereich.
  const railCount = 11;
  const sonicRails = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.009, 0.009, 1.64, 6),
    emitterMat,
    railCount,
  );
  sonicRails.name = 'vertikale_schallleisten';
  sonicRails.castShadow = false;

  for (let i = 0; i < railCount; i++) {
    const angle = 1.85 + (i / (railCount - 1)) * 2.55;
    dummy.position.set(
      Math.sin(angle) * 0.375,
      1.0,
      Math.cos(angle) * 0.375,
    );
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    sonicRails.setMatrixAt(i, dummy.matrix);
  }
  sonicRails.instanceMatrix.needsUpdate = true;
  root.add(sonicRails);

  // ------------------------------------------------------------------
  // An der rechten Seite befestigte Bedienkonsole
  // ------------------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'bedienkonsole';
  consoleGroup.position.set(0.34, 0, 0.15);
  consoleGroup.rotation.y = -0.55;
  root.add(consoleGroup);

  const consoleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.46, 0.13),
    wallDark,
  );
  consoleBody.name = 'konsole_gehaeuse';
  consoleBody.position.y = 1.0;
  consoleGroup.add(consoleBody);

  // Halterung verbindet die Konsole sichtbar mit der rechten Rippe.
  const consoleMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.28, 0.2),
    copper,
  );
  consoleMount.name = 'konsole_halterung';
  consoleMount.position.set(0, 1.0, -0.09);
  consoleGroup.add(consoleMount);

  const consoleFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.29, 0.018),
    copper,
  );
  consoleFrame.name = 'konsole_bronze_rahmen';
  consoleFrame.position.set(0, 1.08, 0.074);
  consoleGroup.add(consoleFrame);

  const consoleScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.162, 0.245),
    screenMat,
  );
  consoleScreen.name = 'konsole_display';
  consoleScreen.position.set(0, 1.08, 0.085);
  consoleGroup.add(consoleScreen);

  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.02, 0.012),
      i === 0 ? statusMat : copper,
    );
    button.name = `konsolen_taste_${i + 1}`;
    button.position.set(-0.052 + i * 0.052, 0.82, 0.076);
    consoleGroup.add(button);
  }

  const consoleLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.011, 0.008),
    statusMat,
  );
  consoleLight.name = 'konsole_statusleiste';
  consoleLight.position.set(0, 0.875, 0.084);
  consoleGroup.add(consoleLight);

  // ------------------------------------------------------------------
  // Kollisionskörper: ausschließlich einfache Boxen.
  // Die mittige Öffnung bleibt frei, damit die Spielerfigur eintreten kann.
  // ------------------------------------------------------------------
  const colBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.16, 0.98),
  );
  colBase.name = 'COL_sockel';
  colBase.position.y = 0.08;
  root.add(colBase);

  const colBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 1.92, 0.1),
  );
  colBack.name = 'COL_rueckwand';
  colBack.position.set(0, 1.08, -0.42);
  root.add(colBack);

  for (const side of [-1, 1]) {
    const colSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.92, 0.3),
    );
    colSide.name = side < 0 ? 'COL_linke_seite' : 'COL_rechte_seite';
    colSide.position.set(side * 0.45, 1.08, 0.18);
    root.add(colSide);
  }

  const colCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.15, 0.98),
  );
  colCanopy.name = 'COL_obere_haube';
  colCanopy.position.y = 2.225;
  root.add(colCanopy);

  // ------------------------------------------------------------------
  // Benutzen-Punkt und dauerhaft vorhandene Lichter
  // ------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_reinigung';
  use.position.set(0, 1.12, 0.68);
  use.userData = {
    label: 'Schall-Reinigungsdusche bedienen',
    radius: 0.8,
  };
  root.add(use);

  const ambientLamp = new THREE.Object3D();
  ambientLamp.name = 'LAMP_ambient';
  ambientLamp.position.set(0, 1.92, 0.04);
  ambientLamp.userData = {
    color: '#6fe3ff',
    intensity: 2,
    distance: 3,
  };
  root.add(ambientLamp);

  const sonicLamp = new THREE.Object3D();
  sonicLamp.name = 'LAMP_schallring';
  sonicLamp.position.set(0, 1.78, 0.08);
  sonicLamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 4,
  };
  root.add(sonicLamp);

  // ------------------------------------------------------------------
  // Zustand und weiche Animation
  // ------------------------------------------------------------------
  let active = false;
  let targetIntensity = 0;
  let currentIntensity = 0;
  let time = 0;
  let lastTime = null;

  function update(dt) {
    time += dt;
    currentIntensity +=
      (targetIntensity - currentIntensity) * Math.min(1, dt * 5.5);

    const flicker =
      0.86 +
      0.09 * Math.sin(time * 31) +
      0.05 * Math.sin(time * 73 + 1.2);

    emitterMat.emissiveIntensity =
      0.08 + currentIntensity * (1.45 + flicker * 1.25);

    statusMat.emissiveIntensity =
      0.12 + currentIntensity * (0.75 + 0.2 * Math.sin(time * 5.5));

    screenMat.emissiveIntensity =
      0.28 + currentIntensity * (0.85 + 0.15 * Math.sin(time * 3.2));

    const scale = 1 + currentIntensity * 0.012;
    glowRing.scale.set(scale, scale, scale);
  }

  emitters.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (lastTime !== null) {
      update(Math.min(now - lastTime, 0.1));
    }
    lastTime = now;
  };

  root.userData.update = update;

  // ------------------------------------------------------------------
  // Öffentliche API und Aktionsmenü
  // ------------------------------------------------------------------
  const api = {
    start() {
      active = true;
      targetIntensity = 1;
    },
    stop() {
      active = false;
      targetIntensity = 0;
    },
    toggle() {
      if (active) api.stop();
      else api.start();
    },
    get active() {
      return active;
    },
    get intensity() {
      return currentIntensity;
    },
    update,
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'reinigung_start',
      label: 'Reinigung starten',
      run: () => api.start(),
    },
    {
      id: 'reinigung_stop',
      label: 'Reinigung beenden',
      run: () => api.stop(),
    },
    {
      id: 'reinigung_umschalten',
      label: 'Reinigung umschalten',
      run: () => api.toggle(),
    },
  ];

  void opts;
  return root;
}

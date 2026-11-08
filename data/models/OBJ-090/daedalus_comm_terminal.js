// OBJ-090 — Daedalus-Subraumfunkterminal
// Kompletter Kommunikationsarbeitsplatz. Ursprung = Mitte der Unterseite.
// Vorderseite des Arbeitsplatzes zeigt nach +Z; die Wand liegt bei −Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'daedalus_comm_terminal',
  art: 'Standobjekt (Kommunikationsarbeitsplatz)',
  masse: '2,90 × 2,45 × 1,89 (B × H × T, m)',
  wohin: 'ATL-007 — Büro von Col. Steven Caldwell',
  benutzen: 'INT_terminal → Menü aus userData.actions',
  lichter: 'LAMP_schirm (bernstein), LAMP_bildschirm (eisblau), LAMP_fensterlicht (graublau)',
  animation: 'Subraumlink pulsiert, Scanzeile und Signalanzeige laufen; Verbindungsstatus wechselt weich',
  quelle: 'selbst gebaut nach Referenzbild',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'daedalus_comm_terminal';

  // ---------------------------------------------------------------------
  // Materialien
  // ---------------------------------------------------------------------
  const matDunkel = kit('wallDark');
  const matPerl = kit('pillar');
  const matBronze = kit('copper');
  const matHull = kit('hull');

  const matTisch = new THREE.MeshStandardMaterial({
    name: 'tisch_hellgrau',
    color: 0xd1d3d4,
    metalness: 0.06,
    roughness: 0.62,
  });
  const matMetall = new THREE.MeshStandardMaterial({
    name: 'laptop_silber',
    color: 0xb7bdc3,
    metalness: 0.82,
    roughness: 0.29,
  });
  const matDunkelMetall = new THREE.MeshStandardMaterial({
    name: 'geraet_dunkelgrau',
    color: 0x252b31,
    metalness: 0.64,
    roughness: 0.4,
  });
  const matTastatur = new THREE.MeshStandardMaterial({
    name: 'tastatur_schwarz',
    color: 0x11171c,
    metalness: 0.22,
    roughness: 0.7,
  });
  const matKabel = new THREE.MeshStandardMaterial({
    name: 'kabel_schwarz',
    color: 0x111416,
    metalness: 0.03,
    roughness: 0.86,
  });
  const matGummi = new THREE.MeshStandardMaterial({
    name: 'stuhl_gummi',
    color: 0x181c20,
    metalness: 0.01,
    roughness: 0.9,
  });
  const matSitz = new THREE.MeshStandardMaterial({
    name: 'stuhl_stoff',
    color: 0x30373d,
    metalness: 0.01,
    roughness: 0.93,
  });
  const matFenster = new THREE.MeshStandardMaterial({
    name: 'fensterlicht',
    color: 0xaab8c2,
    emissive: 0xa9bdc9,
    emissiveIntensity: 0.78,
    metalness: 0.04,
    roughness: 0.52,
  });
  const matLampe = new THREE.MeshStandardMaterial({
    name: 'lampenschirm_innen',
    color: 0xffdfaa,
    emissive: 0xffb65e,
    emissiveIntensity: 2.0,
    roughness: 0.38,
  });
  const matLed = new THREE.MeshStandardMaterial({
    name: 'subraum_led',
    color: 0x1d614f,
    emissive: 0x4dffc0,
    emissiveIntensity: 0.7,
  });
  const matPapier = new THREE.MeshStandardMaterial({
    name: 'notizblock',
    color: 0xe2e0d8,
    metalness: 0,
    roughness: 0.9,
  });

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, name = '') => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------
  // Dunkle Antiker-Wand mit drei Lamellenfenstern
  // Rückwand bei z = −0,60; Wandstärke 0,14 m.
  // ---------------------------------------------------------------------
  const wallY = 1.225;
  const wallZ = -0.60;

  box(0.28, 2.45, 0.14, matDunkel, -1.31, wallY, wallZ, 'wand_linker_pfeiler');
  box(0.28, 2.45, 0.14, matDunkel, 1.31, wallY, wallZ, 'wand_rechter_pfeiler');
  box(2.90, 0.82, 0.14, matDunkel, 0, 0.41, wallZ, 'wand_unterer_bereich');
  box(2.90, 0.26, 0.14, matDunkel, 0, 2.32, wallZ, 'wand_oberer_bereich');

  const fensterMitteY = 1.58;
  const fensterHoehe = 1.30;
  const bays = [-0.88, 0, 0.88];

  for (let i = 0; i < bays.length; i++) {
    const x = bays[i];

    box(0.80, fensterHoehe, 0.035, matFenster, x, fensterMitteY, -0.545, `fensterlicht_${i + 1}`);

    box(0.055, fensterHoehe + 0.08, 0.12, matPerl, x - 0.425, fensterMitteY, -0.49);
    box(0.055, fensterHoehe + 0.08, 0.12, matPerl, x + 0.425, fensterMitteY, -0.49);
    box(0.88, 0.055, 0.12, matPerl, x, fensterMitteY - fensterHoehe / 2 - 0.02, -0.49);
    box(0.88, 0.055, 0.12, matPerl, x, fensterMitteY + fensterHoehe / 2 + 0.02, -0.49);

    const slatGeo = new THREE.BoxGeometry(0.82, 0.035, 0.135);
    const slats = new THREE.InstancedMesh(slatGeo, matMetall, 16);
    slats.name = `lamellen_${i + 1}`;

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0));
    const scale = new THREE.Vector3(1, 1, 1);

    for (let r = 0; r < 16; r++) {
      const y = fensterMitteY - 0.59 + r * (1.18 / 15);
      matrix.compose(new THREE.Vector3(x, y, -0.485), quat, scale);
      slats.setMatrixAt(r, matrix);
    }
    slats.instanceMatrix.needsUpdate = true;
    root.add(slats);
  }

  box(2.56, 0.025, 0.035, matBronze, 0, 0.915, -0.475);
  box(2.56, 0.025, 0.035, matBronze, 0, 2.245, -0.475);

  // Schild über den Fenstern: reale irdische Betriebsanzeige.
  const schildCanvas = document.createElement('canvas');
  schildCanvas.width = 768;
  schildCanvas.height = 128;
  const schildCtx = schildCanvas.getContext('2d');
  if (schildCtx) {
    schildCtx.clearRect(0, 0, 768, 128);
    schildCtx.fillStyle = '#a9e9f7';
    schildCtx.font = 'bold 45px monospace';
    schildCtx.textAlign = 'center';
    schildCtx.fillText('DAEDALUS // COMM-LINK', 384, 58);
    schildCtx.fillStyle = '#628795';
    schildCtx.font = '25px monospace';
    schildCtx.fillText('ATLANTIS OPERATIONS', 384, 98);
  }
  const schildTexture = new THREE.CanvasTexture(schildCanvas);
  schildTexture.colorSpace = THREE.SRGBColorSpace;

  box(1.52, 0.185, 0.035, matDunkelMetall, 0, 2.32, -0.49, 'betriebsschild');
  const schildText = new THREE.Mesh(
    new THREE.PlaneGeometry(1.44, 0.15),
    new THREE.MeshBasicMaterial({
      name: 'betriebsschild_text',
      map: schildTexture,
      transparent: true,
      depthWrite: false,
    })
  );
  schildText.position.set(0, 2.32, -0.468);
  root.add(schildText);

  // ---------------------------------------------------------------------
  // Heller Schreibtisch, 0,75 m hoch
  // ---------------------------------------------------------------------
  const tischBreite = 1.70;
  const tischTiefe = 0.78;
  const platteHoehe = 0.72;
  const platteDicke = 0.06;

  box(tischBreite, platteDicke, tischTiefe, matTisch, 0, platteHoehe, 0, 'tischplatte');
  box(tischBreite - 0.05, 0.018, 0.035, matBronze, 0, 0.705, 0.365, 'tisch_frontkante');

  const beinX = 0.76;
  const beinZ = 0.30;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(0.075, 0.69, 0.075, matMetall, sx * beinX, 0.345, sz * beinZ, 'tischbein');
      box(0.12, 0.025, 0.12, matDunkelMetall, sx * beinX, 0.0125, sz * beinZ, 'tischbein_fuss');
    }
  }
  box(1.42, 0.045, 0.045, matMetall, 0, 0.25, -beinZ, 'tisch_querstrebe');

  // Kabelwanne unter der Tischplatte, fest an der Rückseite montiert.
  box(1.18, 0.07, 0.16, matDunkelMetall, 0, 0.645, -0.29, 'kabelwanne');
  box(1.20, 0.012, 0.17, matMetall, 0, 0.684, -0.29, 'kabelwanne_deckel');

  // Dunkle Schreibtischmatte.
  box(0.62, 0.004, 0.40, matTastatur, 0, 0.7525, -0.035, 'schreibtischmatte');

  // ---------------------------------------------------------------------
  // Laptop mit dynamischer Subraumfunk-Anzeige
  // ---------------------------------------------------------------------
  const laptop = new THREE.Group();
  laptop.name = 'daedalus_laptop';
  laptop.position.set(-0.03, 0.756, -0.04);
  laptop.rotation.y = -0.06;
  root.add(laptop);

  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.024, 0.265), matMetall);
  laptopBase.position.y = 0.012;
  laptop.add(laptopBase);

  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.345, 0.007, 0.155), matTastatur);
  keyboard.position.set(0, 0.027, -0.025);
  laptop.add(keyboard);

  const keyGeo = new THREE.BoxGeometry(0.018, 0.004, 0.017);
  const keys = new THREE.InstancedMesh(keyGeo, matDunkelMetall, 60);
  const keyMatrix = new THREE.Matrix4();
  let keyIndex = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 12; col++) {
      keyMatrix.makeTranslation(
        -0.1495 + col * 0.0272,
        0.032,
        -0.082 + row * 0.0255
      );
      keys.setMatrixAt(keyIndex++, keyMatrix);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.003, 0.055), matDunkelMetall);
  trackpad.position.set(0, 0.027, 0.082);
  laptop.add(trackpad);

  const screenHinge = new THREE.Group();
  screenHinge.position.set(0, 0.027, -0.132);
  screenHinge.rotation.x = -0.20;
  laptop.add(screenHinge);

  const screenBody = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.255, 0.018), matMetall);
  screenBody.position.y = 0.126;
  screenHinge.add(screenBody);

  const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.365, 0.230, 0.006), matTastatur);
  screenBezel.position.set(0, 0.126, 0.011);
  screenHinge.add(screenBezel);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const screenCtx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshBasicMaterial({ name: 'laptop_display', map: screenTexture });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.346, 0.212), screenMat);
  screen.position.set(0, 0.126, 0.015);
  screenHinge.add(screen);

  const scanMat = new THREE.MeshBasicMaterial({
    name: 'display_scanlinie',
    color: 0x7deaff,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const scanline = new THREE.Mesh(new THREE.PlaneGeometry(0.344, 0.012), scanMat);
  scanline.position.set(0, 0.126, 0.017);
  screenHinge.add(scanline);

  const kamera = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8), matTastatur);
  kamera.position.set(0, 0.245, 0.012);
  screenHinge.add(kamera);

  // ---------------------------------------------------------------------
  // Kompakter Subraumfunk-Adapter neben dem Laptop
  // ---------------------------------------------------------------------
  const adapter = new THREE.Group();
  adapter.name = 'subraumfunk_adapter';
  adapter.position.set(0.34, 0.756, -0.16);
  root.add(adapter);

  const adapterBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.055, 0.105), matDunkelMetall);
  adapterBody.position.y = 0.0275;
  adapter.add(adapterBody);

  const adapterTop = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.09), matBronze);
  adapterTop.position.y = 0.057;
  adapter.add(adapterTop);

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), matLed);
  led.position.set(-0.045, 0.033, 0.054);
  adapter.add(led);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.14, 10), matMetall);
  antenna.position.set(0.052, 0.125, -0.02);
  antenna.rotation.z = -0.12;
  adapter.add(antenna);

  const antennaCap = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), matDunkelMetall);
  antennaCap.position.set(0.043, 0.195, -0.02);
  adapter.add(antennaCap);

  // Kurzes Verbindungskabel; beginnt und endet an tatsächlichen Geräten.
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.30, 0.772, -0.09),
    new THREE.Vector3(0.42, 0.765, -0.02),
    new THREE.Vector3(0.50, 0.758, 0.14),
    new THREE.Vector3(0.62, 0.748, 0.28),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 28, 0.006, 8, false), matKabel);
  cable.name = 'adapter_kabel';
  root.add(cable);

  // Kleiner Notizblock und Stift auf der rechten Tischtischseite.
  const notizblock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.012, 0.25), matPapier);
  notizblock.position.set(0.53, 0.756, 0.06);
  notizblock.rotation.y = 0.13;
  root.add(notizblock);

  const notizdeckel = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.006, 0.255), matDunkelMetall);
  notizdeckel.position.set(0.53, 0.765, 0.06);
  notizdeckel.rotation.y = 0.13;
  root.add(notizdeckel);

  const stift = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 10), matBronze);
  stift.position.set(0.66, 0.758, 0.04);
  stift.rotation.z = Math.PI / 2;
  stift.rotation.y = -0.18;
  root.add(stift);

  // ---------------------------------------------------------------------
  // Wandleuchte links, fest an der Wand montiert
  // ---------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  lampGroup.name = 'wandleuchte';
  root.add(lampGroup);

  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.055), matBronze);
  mount.position.set(-1.16, 1.96, -0.495);
  lampGroup.add(mount);

  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.16, 1.96, -0.465),
    new THREE.Vector3(-1.16, 1.94, -0.38),
    new THREE.Vector3(-1.16, 1.84, -0.30),
    new THREE.Vector3(-1.16, 1.76, -0.28),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 24, 0.018, 10, false), matBronze);
  arm.name = 'leuchtenarm';
  lampGroup.add(arm);

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.165, 0.19, 32, 1, false), matPerl);
  shade.position.set(-1.16, 1.68, -0.28);
  shade.name = 'lampenschirm';
  lampGroup.add(shade);

  const shadeInnen = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.012, 32), matLampe);
  shadeInnen.position.set(-1.16, 1.586, -0.28);
  shadeInnen.name = 'lampenschirm_leuchtflaeche';
  lampGroup.add(shadeInnen);

  // ---------------------------------------------------------------------
  // Bürostuhl vor dem Schreibtisch
  // ---------------------------------------------------------------------
  const chair = new THREE.Group();
  chair.name = 'buerostuhl';
  chair.position.set(0.16, 0, 0.86);
  root.add(chair);

  const chairColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.37, 16), matMetall);
  chairColumn.position.y = 0.235;
  chair.add(chairColumn);

  const chairHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), matDunkelMetall);
  chairHub.position.y = 0.075;
  chair.add(chairHub);

  const spokeGeo = new THREE.BoxGeometry(0.30, 0.032, 0.045);
  const spokes = new THREE.InstancedMesh(spokeGeo, matDunkelMetall, 5);
  const casterGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.026, 12);
  const casters = new THREE.InstancedMesh(casterGeo, matGummi, 5);
  const tmpMatrix = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    tmpQuat.setFromEuler(new THREE.Euler(0, -a, 0));
    tmpPos.set(Math.cos(a) * 0.18, 0.065, Math.sin(a) * 0.18);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    spokes.setMatrixAt(i, tmpMatrix);

    tmpQuat.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
    tmpPos.set(Math.cos(a) * 0.35, 0.032, Math.sin(a) * 0.35);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    casters.setMatrixAt(i, tmpMatrix);
  }
  spokes.instanceMatrix.needsUpdate = true;
  casters.instanceMatrix.needsUpdate = true;
  chair.add(spokes, casters);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.09, 0.45), matSitz);
  seat.position.y = 0.455;
  chair.add(seat);

  const seatUnterbau = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.035, 0.38), matDunkelMetall);
  seatUnterbau.position.y = 0.397;
  chair.add(seatUnterbau);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.47, 0.075), matSitz);
  back.position.set(0, 0.76, 0.205);
  back.rotation.x = -0.10;
  chair.add(back);

  const backSpine = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.32, 0.035), matDunkelMetall);
  backSpine.position.set(0, 0.60, 0.17);
  backSpine.rotation.x = -0.10;
  chair.add(backSpine);

  for (const side of [-1, 1]) {
    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.31), matDunkelMetall);
    armrest.position.set(side * 0.255, 0.64, 0.025);
    chair.add(armrest);

    const armSupport = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.035), matDunkelMetall);
    armSupport.position.set(side * 0.255, 0.555, 0.11);
    chair.add(armSupport);
  }

  // ---------------------------------------------------------------------
  // Kollisionskörper
  // ---------------------------------------------------------------------
  const colPlatte = new THREE.Mesh(new THREE.BoxGeometry(tischBreite, platteDicke, tischTiefe));
  colPlatte.name = 'COL_tischplatte';
  colPlatte.position.set(0, platteHoehe, 0);
  root.add(colPlatte);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.69, 0.09));
      col.name = `COL_tischbein_${sx > 0 ? 'r' : 'l'}_${sz > 0 ? 'v' : 'h'}`;
      col.position.set(sx * beinX, 0.345, sz * beinZ);
      root.add(col);
    }
  }

  const colWand = new THREE.Mesh(new THREE.BoxGeometry(2.90, 2.45, 0.14));
  colWand.name = 'COL_wand';
  colWand.position.set(0, wallY, wallZ);
  root.add(colWand);

  const colLaptop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.29, 0.30));
  colLaptop.name = 'COL_laptop';
  colLaptop.position.set(-0.03, 0.88, -0.10);
  root.add(colLaptop);

  const colAdapter = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 0.13));
  colAdapter.name = 'COL_subraumadapter';
  colAdapter.position.set(0.34, 0.86, -0.16);
  root.add(colAdapter);

  const colSitz = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.46));
  colSitz.name = 'COL_stuhl_sitz';
  colSitz.position.set(0.16, 0.455, 0.86);
  root.add(colSitz);

  const colLehne = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.09));
  colLehne.name = 'COL_stuhl_lehne';
  colLehne.position.set(0.16, 0.76, 1.065);
  root.add(colLehne);

  // ---------------------------------------------------------------------
  // Benutzen-Punkt und Lichter
  // ---------------------------------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_terminal';
  use.position.set(-0.03, 0.95, 0.23);
  use.userData = { label: 'Daedalus-Kommunikationsterminal bedienen', radius: 0.9 };
  root.add(use);

  const lampSchirm = new THREE.Object3D();
  lampSchirm.name = 'LAMP_schirm';
  lampSchirm.position.set(-1.16, 1.58, -0.27);
  lampSchirm.userData = { color: '#ffc477', intensity: 7, distance: 4.5 };
  root.add(lampSchirm);

  const lampBildschirm = new THREE.Object3D();
  lampBildschirm.name = 'LAMP_bildschirm';
  lampBildschirm.position.set(-0.03, 0.90, -0.03);
  lampBildschirm.userData = { color: '#6fe3ff', intensity: 1.8, distance: 1.6 };
  root.add(lampBildschirm);

  const lampFenster = new THREE.Object3D();
  lampFenster.name = 'LAMP_fensterlicht';
  lampFenster.position.set(0, 1.62, -0.44);
  lampFenster.userData = { color: '#b9cbd5', intensity: 3.5, distance: 4.2 };
  root.add(lampFenster);

  // ---------------------------------------------------------------------
  // Zustand, Bildschirmdarstellung und Animation
  // ---------------------------------------------------------------------
  let verbunden = false;
  let an = true;
  let letzteNachricht = 'Kommunikationskanal bereit.';
  let zeit = 0;
  let letzte = null;
  let bildAktualisiert = -1;
  let signalStaerke = 0;
  let meldungsZeit = 0;

  function zeichneBildschirm(signal) {
    const ctx = screenCtx;
    if (!ctx) return;

    ctx.fillStyle = '#050c13';
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#102434';
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = '#8eeeff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DAEDALUS // COMM-LINK', 16, 28);

    ctx.fillStyle = verbunden ? '#58f0a2' : '#e5a455';
    ctx.beginPath();
    ctx.arc(22, 64, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 17px monospace';
    ctx.fillText(verbunden ? 'SUBSPACE LINK ACTIVE' : 'LINK DISCONNECTED', 38, 70);

    ctx.strokeStyle = '#27465b';
    ctx.lineWidth = 1;
    for (let y = 92; y <= 220; y += 16) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(496, y);
      ctx.stroke();
    }

    ctx.strokeStyle = verbunden ? '#6fe3ff' : '#75502f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 16; x <= 496; x += 4) {
      const phase = x * 0.045 + zeit * 3;
      const y = 155 + Math.sin(phase) * 12 * signal + Math.sin(phase * 2.3) * 5 * signal;
      if (x === 16) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#7893a3';
    ctx.font = '14px monospace';
    ctx.fillText('SHIP-TO-SHORE UPLINK', 16, 92);
    ctx.fillText('SIGNAL', 16, 246);
    ctx.fillText(String(Math.round(signal * 100)).padStart(3, '0') + '%', 90, 246);

    ctx.fillStyle = '#d9eef5';
    ctx.font = '15px monospace';
    ctx.fillText(letzteNachricht.slice(0, 43), 16, 278);

    ctx.fillStyle = '#4b6675';
    ctx.font = '12px monospace';
    ctx.fillText('ATLANTIS / OPERATIONS', 16, 304);
    ctx.fillText(verbunden ? 'CARRIER LOCKED' : 'AWAITING CARRIER', 354, 304);

    screenTexture.needsUpdate = true;
  }

  function zeichneGetrennt() {
    const ctx = screenCtx;
    if (!ctx) return;

    ctx.fillStyle = '#050c13';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#102434';
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = '#8eeeff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DAEDALUS // COMM-LINK', 16, 28);

    ctx.fillStyle = '#e5a455';
    ctx.beginPath();
    ctx.arc(22, 64, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 17px monospace';
    ctx.fillText('LINK DISCONNECTED', 38, 70);

    ctx.fillStyle = '#7893a3';
    ctx.font = '14px monospace';
    ctx.fillText('SHIP-TO-SHORE UPLINK', 16, 92);

    ctx.strokeStyle = '#27465b';
    ctx.lineWidth = 1;
    for (let y = 116; y <= 220; y += 16) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(496, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#d9eef5';
    ctx.font = '15px monospace';
    ctx.fillText(letzteNachricht.slice(0, 43), 16, 278);

    ctx.fillStyle = '#4b6675';
    ctx.font = '12px monospace';
    ctx.fillText('ATLANTIS / OPERATIONS', 16, 304);
    ctx.fillText('AWAITING CARRIER', 354, 304);

    screenTexture.needsUpdate = true;
  }

  function update(dt) {
    zeit += dt;

    const zielSignal = an && verbunden ? 0.72 + Math.sin(zeit * 2.4) * 0.20 : 0;
    signalStaerke += (zielSignal - signalStaerke) * Math.min(1, dt * 4.5);

    matLed.emissiveIntensity = verbunden ? 0.65 + signalStaerke * 1.8 : 0.08;
    scanMat.opacity = an && verbunden ? 0.08 + signalStaerke * 0.18 : 0.025;
    scanline.position.y = 0.126 + Math.sin(zeit * 2.2) * 0.095;

    if (meldungsZeit > 0) meldungsZeit = Math.max(0, meldungsZeit - dt);

    if (verbunden && an && zeit - bildAktualisiert > 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      zeichneBildschirm(signalStaerke);
      bildAktualisiert = zeit;
    }
  }

  // Eigenständige Animation über ein sichtbares Mesh.
  screen.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  // ---------------------------------------------------------------------
  // Öffentliche Funktionen
  // ---------------------------------------------------------------------
  const api = {
    einschalten() {
      an = true;
      screenMat.color.setHex(0xffffff);
      if (!verbunden) zeichneGetrennt();
      bildAktualisiert = -1;
    },
    ausschalten() {
      an = false;
      screenMat.color.setHex(0x5b646a);
      bildAktualisiert = -1;
    },
    verbinden() {
      verbunden = true;
      an = true;
      screenMat.color.setHex(0xffffff);
      letzteNachricht = 'Subraumverbindung zu DAEDALUS hergestellt.';
      bildAktualisiert = -1;
    },
    trennen() {
      verbunden = false;
      letzteNachricht = 'Subraumverbindung getrennt.';
      zeichneGetrennt();
      bildAktualisiert = -1;
    },
    senden(nachricht = 'Bereit für Missionskoordination.') {
      if (!verbunden) api.verbinden();
      letzteNachricht = String(nachricht);
      meldungsZeit = 4;
      bildAktualisiert = -1;
    },
    pruefen() {
      if (!verbunden) api.verbinden();
      letzteNachricht = 'Frequenzprüfung: Subraum-Carrier bestätigt.';
      meldungsZeit = 3;
      bildAktualisiert = -1;
    },
    get an() { return an; },
    get verbunden() { return verbunden; },
    get status() { return verbunden ? 'VERBUNDEN' : 'GETRENNT'; },
    get letzteNachricht() { return letzteNachricht; },
    get signalStaerke() { return signalStaerke; },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'verbinden',
      label: 'Subraumverbindung zur Daedalus herstellen',
      run: () => api.verbinden(),
    },
    {
      id: 'trennen',
      label: 'Subraumverbindung trennen',
      run: () => api.trennen(),
    },
    {
      id: 'pruefen',
      label: 'Frequenzprüfung durchführen',
      run: () => api.pruefen(),
    },
    {
      id: 'senden',
      label: 'Missionsstatus an die Daedalus senden',
      run: () => api.senden('Missionsstatus übermittelt. Daedalus antwortet.'),
    },
  ];

  zeichneGetrennt();
  return root;
}

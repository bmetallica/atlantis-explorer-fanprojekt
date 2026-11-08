// Raum ATL-004: Kommandantur – Büro des Stationskommandanten.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z, separater Turmzugang an der Seite +X, Glasfront an +Z.
// Leere Raumhülle: nur Architektur und PLACE_-Punkte für den späteren Objektimport.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_commander_office',
  art: 'Raum',
  masse: '8,4 m × 6,6 m lichte Grundfläche (≈ 55 m²), 3,5 m lichte Höhe',
  wohin: 'Kommandotrakte, Etage 6, erhöhter Bereich mit Sichtachse auf Torhalle und Kontrollraum',
  benutzen: 'Dienstzimmer des Stationskommandanten; Schreibtisch (OBJ-013) und Wandleser (OBJ-051) werden über PLACE_-Punkte eingesetzt, Archive/Regale bleiben Platzhalter',
  lichter: '4 LAMP_-Punkte (3 eisblau, 1 warm), dazu Decken-Lichtfelder und vertikale Lichtschlitze',
  animation: 'Lichtschlitze, Deckenbänder und Buntglas glimmen/atmen langsam',
  quelle: 'Beschreibung ATL-004, Produktionsgrundriss Mallozzi „Control Room“, Screencaps ref1–ref3',
};

const W = 8.4;              // lichte Breite (X)
const D = 6.6;              // lichte Tiefe (Z)
const H = 3.5;              // lichte Höhe
const T = 0.3;              // Wanddicke
const DOOR_W = 2.4;
const DOOR_H = 3.0;

function buntglasTextur() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');

  x.fillStyle = '#123c46';
  x.fillRect(0, 0, 256, 256);

  const felder = [
    ['#2d8f92', 0, 0, 128, 128],
    ['#d89a3c', 128, 0, 128, 128],
    ['#1f6673', 0, 128, 128, 128],
    ['#b85c32', 128, 128, 128, 128],
  ];
  for (const [col, px, py, pw, ph] of felder) {
    x.fillStyle = col;
    x.fillRect(px + 3, py + 3, pw - 6, ph - 6);
  }

  x.strokeStyle = '#e8c77a';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(8, 248); x.lineTo(248, 8);
  x.moveTo(8, 8); x.lineTo(248, 248);
  x.stroke();

  x.strokeStyle = '#d8f3ef';
  x.lineWidth = 4;
  for (const cx of [64, 192]) {
    for (const cy of [64, 192]) {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        x.beginPath();
        x.moveTo(cx, cy);
        x.lineTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38);
        x.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_commander_office';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilingMat = kit('ceiling');
  const glassMat = kit('glass');
  const railMat = kit('rail');
  const glowMat = kit('glow');
  const amberGlow = kit('amberGlow');

  // Eigene Materialien: Patina-Kupfer-Palette (kein Rost, kein Schmutz)
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.62, roughness: 0.42,
  });
  const cladding = new THREE.MeshStandardMaterial({
    name: 'wand_cladding_patina', color: 0x4c7f78, metalness: 0.34, roughness: 0.52,
  });
  const panelSteel = new THREE.MeshStandardMaterial({
    name: 'panel_stahlblau', color: 0x2f5f6b, metalness: 0.45, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff,
    emissiveIntensity: 1.55, metalness: 0.05, roughness: 0.35,
  });
  const buntglasTex = buntglasTextur();
  const buntglas = new THREE.MeshStandardMaterial({
    name: 'buntglas_atlantis',
    map: buntglasTex,
    emissiveMap: buntglasTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    metalness: 0.12,
    roughness: 0.34,
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      dummy.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ---------------------------------------------------------------- Boden
  box(W, 0.16, D, floorMat, 0, -0.08, 0, 'boden');

  for (const s of [-1, 1]) {
    box(0.18, 0.014, D - 0.36, patina, s * (W / 2 - 0.09), 0.007, 0, 'boden_rand_seitlich');
    box(W - 0.36, 0.014, 0.18, patina, 0, 0.007, s * (D / 2 - 0.09), 'boden_rand_quer');
  }

  const fugenX = [], fugenZ = [];
  for (let x = -3.0; x <= 3.0; x += 1.2) fugenX.push({ x, y: 0.003, z: 0 });
  for (let z = -2.7; z <= 2.7; z += 1.2) fugenZ.push({ x: 0, y: 0.003, z });
  inst(new THREE.BoxGeometry(0.018, 0.006, D - 0.4), wallDark, fugenX, 'boden_fugen_längs');
  inst(new THREE.BoxGeometry(W - 0.4, 0.006, 0.018), wallDark, fugenZ, 'boden_fugen_quer');

  // Bodenintarsie: Ring + Schneeflocke (architektonisch, kein Möbel)
  const ring = add(new THREE.TorusGeometry(0.62, 0.022, 6, 48), copper, 2.5, 0.012, -1.85, 'boden_intarsie_ring');
  ring.rotation.x = Math.PI / 2;
  const flake = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    flake.push({ x: 2.5 + Math.cos(a) * 0.26, y: 0.012, z: -1.85 + Math.sin(a) * 0.26, ry: -a });
  }
  inst(new THREE.BoxGeometry(0.045, 0.008, 0.58), copper, flake, 'boden_intarsie_schneeflocke');

  // ---------------------------------------------------------------- Wände
  const xL = -(W / 2 + T / 2);
  const xR = W / 2 + T / 2;
  const zB = -(D / 2 + T / 2);
  const zF = D / 2 + T / 2;

  // linke Wand, geschlossen
  box(T, H, D, wall, xL, H / 2, 0, 'wand_links');

  // Haupteingang an -Z, Öffnung 2,4 × 3,0 m (davor je > 1,2 m Mauerwerk)
  const sideW = (W - DOOR_W) / 2;
  box(sideW, H, T, wall, -(DOOR_W / 2 + sideW / 2), H / 2, zB, 'wand_hinten_links');
  box(sideW, H, T, wall, DOOR_W / 2 + sideW / 2, H / 2, zB, 'wand_hinten_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, zB, 'wand_hinten_sturz');

  // rechte Wand mit separatem Turmzugang (2,4 × 3,0 m)
  const sideDoorA = -0.4;
  const sideDoorB = 2.0;
  const sideDoorMid = (sideDoorA + sideDoorB) / 2;
  const segA = sideDoorA - (-D / 2);
  const segB = D / 2 - sideDoorB;
  box(T, H, segA, wall, xR, H / 2, -D / 2 + segA / 2, 'wand_rechts_vorne');
  box(T, H, segB, wall, xR, H / 2, sideDoorB + segB / 2, 'wand_rechts_turm');
  box(T, H - DOOR_H, DOOR_W, wall, xR, DOOR_H + (H - DOOR_H) / 2, sideDoorMid, 'wand_rechts_sturz');

  // Bronzefassungen der Öffnungen
  for (const s of [-1, 1]) {
    box(0.16, DOOR_H, 0.12, copper, s * (DOOR_W / 2 + 0.08), DOOR_H / 2, -D / 2 + 0.02, 'tuer_einfassung_haupt_seite');
  }
  box(DOOR_W + 0.32, 0.16, 0.12, copper, 0, DOOR_H + 0.08, -D / 2 + 0.02, 'tuer_einfassung_haupt_oben');

  for (const z of [sideDoorA - 0.08, sideDoorB + 0.08]) {
    box(0.12, DOOR_H, 0.16, copper, W / 2 - 0.02, DOOR_H / 2, z, 'tuer_einfassung_turm');
  }
  box(0.12, 0.16, DOOR_W + 0.32, copper, W / 2 - 0.02, DOOR_H + 0.08, sideDoorMid, 'tuer_einfassung_turm_oben');

  // Sockelleisten und Gesimse
  box(0.05, 0.15, D - 0.2, copper, -W / 2 + 0.025, 0.075, 0, 'sockel_links');
  box(0.06, 0.1, D - 0.2, copper, -W / 2 + 0.03, H - 0.05, 0, 'gesims_links');
  for (const s of [-1, 1]) {
    const cx = s * (DOOR_W / 2 + sideW / 2);
    box(sideW - 0.1, 0.15, 0.05, copper, cx, 0.075, -D / 2 + 0.025, 'sockel_hinten');
    box(sideW - 0.1, 0.1, 0.06, copper, cx, H - 0.05, -D / 2 + 0.03, 'gesims_hinten');
  }
  box(0.05, 0.15, segA - 0.1, copper, W / 2 - 0.025, 0.075, -D / 2 + segA / 2, 'sockel_rechts');
  box(0.06, 0.1, segA - 0.1, copper, W / 2 - 0.03, H - 0.05, -D / 2 + segA / 2, 'gesims_rechts');
  box(0.05, 0.15, segB - 0.1, copper, W / 2 - 0.025, 0.075, sideDoorB + segB / 2, 'sockel_turm');
  box(0.06, 0.1, segB - 0.1, copper, W / 2 - 0.03, H - 0.05, sideDoorB + segB / 2, 'gesims_turm');

  // ---------------------------------------------------------------- Glasfront an +Z
  box(W, 0.38, T, wallDark, 0, 0.19, zF, 'wand_glasfront_sockel');
  box(W, 0.12, T, copper, 0, 0.38, zF, 'glasfront_sockelleiste');
  box(W, 0.14, T, copper, 0, H - 0.07, zF, 'glasfront_kopfleiste');

  const panes = 7;                       // 8,4 m / 1,2 m Raster
  const paneW = W / panes;
  const glasBottom = 0.44;
  const glasTop = 2.88;
  for (let i = 0; i < panes; i++) {
    const cx = -W / 2 + paneW * (i + 0.5);
    box(paneW - 0.08, glasTop - glasBottom, 0.04, glassMat, cx, (glasTop + glasBottom) / 2, zF, `glasfront_scheibe_${i + 1}`);
    box(paneW - 0.10, 0.44, 0.025, buntglas, cx, H - 0.33, zF - 0.03, `glasfront_buntglas_${i + 1}`);
  }
  for (let i = 0; i <= panes; i++) {
    const cx = -W / 2 + paneW * i;
    box(0.13, H - 0.32, 0.2, copper, cx, (H - 0.32) / 2 + 0.32, zF, `glasfront_pfosten_${i}`);
  }
  // Querriegel der Glasfront
  box(W - 0.1, 0.07, 0.16, copper, 0, 1.72, zF - 0.02, 'glasfront_querriegel');

  // ---------------------------------------------------------------- Wandverkleidung / Plant-ons
  const frameList = [], fieldList = [], slotList = [], darkList = [];

  // linke Wand: fünf Felder à 1,2 m
  [-2.7, -1.5, -0.3, 0.9, 2.1].forEach((z, i) => {
    if (i % 2 === 0) {
      frameList.push({ x: -W / 2 + 0.04, y: 1.5, z, ry: Math.PI / 2 });
      fieldList.push({ x: -W / 2 + 0.03, y: 1.5, z, ry: Math.PI / 2 });
    } else {
      for (let k = 0; k < 4; k++) {
        slotList.push({ x: -W / 2 + 0.035, y: 0.95 + k * 0.44, z, ry: Math.PI / 2 });
      }
    }
  });

  // rechte Wand vor dem Turmzugang
  [-2.7, -1.5].forEach((z, i) => {
    if (i === 0) {
      frameList.push({ x: W / 2 - 0.04, y: 1.5, z, ry: Math.PI / 2 });
      fieldList.push({ x: W / 2 - 0.03, y: 1.5, z, ry: Math.PI / 2 });
    } else {
      for (let k = 0; k < 4; k++) {
        slotList.push({ x: W / 2 - 0.035, y: 0.95 + k * 0.44, z, ry: Math.PI / 2 });
      }
    }
  });
  // rechte Wand hinter dem Turmzugang
  frameList.push({ x: W / 2 - 0.04, y: 1.5, z: 2.7, ry: Math.PI / 2 });
  fieldList.push({ x: W / 2 - 0.03, y: 1.5, z: 2.7, ry: Math.PI / 2 });

  // Rückwand links/rechts der Haupttür (Feldmitten außerhalb des Türbereichs)
  [-3.9, -2.7, 2.7, 3.9].forEach((x, i) => {
    if (i % 2 === 0) {
      frameList.push({ x, y: 1.5, z: -D / 2 + 0.04, ry: 0 });
      fieldList.push({ x, y: 1.5, z: -D / 2 + 0.03, ry: 0 });
    } else {
      for (let k = 0; k < 3; k++) {
        slotList.push({ x, y: 1.1 + k * 0.44, z: -D / 2 + 0.035, ry: 0 });
      }
    }
  });

  inst(new THREE.BoxGeometry(1.12, 2.62, 0.08), copper, frameList, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.0, 2.5, 0.045), cladding, fieldList, 'paneel_flaechen');
  const slotMesh = inst(new THREE.BoxGeometry(0.08, 0.32, 0.03), lineGlow, slotList, 'lichtschlitze');

  // dunkle Stahlblau-Einfassung an den Paneelfeldern (Schneeflocken-Linien)
  [-3.9, 2.7].forEach((x) => darkList.push({ x, y: 1.5, z: -D / 2 + 0.06 }));
  [-2.7, 2.1].forEach((z) => darkList.push({ x: -W / 2 + 0.06, y: 1.5, z }));
  inst(new THREE.BoxGeometry(0.9, 2.2, 0.02), panelSteel, darkList, 'paneel_stahlblau');

  // Wand-Emblem: Schneeflocke in Bronze auf der linken Wand
  const emblem = [];
  for (let i = 0; i < 6; i++) {
    emblem.push({ x: -W / 2 + 0.10, y: 1.5, z: -2.7, rx: (i * Math.PI) / 3 });
  }
  inst(new THREE.BoxGeometry(0.05, 0.05, 1.1), copper, emblem, 'wand_schneeflocke');

  // ---------------------------------------------------------------- Schräge Säulen (Atlantis-Motiv)
  const pillarData = [
    { x: -4.0, z: -2.45, ry: Math.PI / 6, rz: 0.07 },
    { x: -4.0, z: 2.45, ry: Math.PI / 6, rz: -0.07 },
    { x: 3.96, z: -3.05, ry: Math.PI / 3, rz: 0.06 },
    { x: 3.96, z: 3.0, ry: Math.PI / 3, rz: -0.06 },
  ];
  pillarData.forEach((p, i) => {
    const m = box(0.26, 3.18, 0.26, pillarMat, p.x, 1.59, p.z, `saeule_${i + 1}`);
    m.rotation.y = p.ry;
    m.rotation.z = p.rz;
    box(0.48, 0.12, 0.48, copper, p.x, 0.06, p.z, `saeule_fuss_${i + 1}`);
    box(0.46, 0.1, 0.46, copper, p.x, H - 0.05, p.z, `saeule_kopf_${i + 1}`);
    // diagonale Strebe zur Wand (30°)
    const br = box(0.12, 1.25, 0.12, pillarMat, p.x, 2.2, p.z, `saeule_strebe_${i + 1}`);
    br.rotation.y = p.ry;
    br.rotation.z = p.rz * 3.2;
  });

  // ---------------------------------------------------------------- Decke
  box(W, 0.3, D, ceilingMat, 0, H + 0.15, 0, 'decke_haupt');

  // Kassettenfelder mit Lichtflächen
  const kassDark = [], kassGlow = [], ribsX = [], ribsZ = [];
  for (const x of [-2.8, 0, 2.8]) {
    for (const z of [-1.65, 1.65]) {
      kassDark.push({ x, y: H - 0.03, z });
      kassGlow.push({ x, y: H - 0.07, z });
    }
  }
  inst(new THREE.BoxGeometry(2.5, 0.06, 2.1), wallDark, kassDark, 'decke_kassetten');
  inst(new THREE.BoxGeometry(2.15, 0.03, 1.75), glowMat, kassGlow, 'decke_lichtfelder');
  for (const z of [-1.65, 1.65]) ribsX.push({ x: 0, y: H - 0.09, z });
  for (const x of [-2.8, 0, 2.8]) ribsZ.push({ x, y: H - 0.09, z: 0 });
  inst(new THREE.BoxGeometry(W - 0.4, 0.09, 0.1), copper, ribsX, 'decke_rippen_quer');
  inst(new THREE.BoxGeometry(0.1, 0.09, D - 0.4), copper, ribsZ, 'decke_rippen_längs');

  // indirekte Lichtbänder an den Deckenkanten
  box(0.08, 0.035, D - 0.6, glowMat, -W / 2 + 0.34, H - 0.02, 0, 'decke_lichtband_links');
  box(0.08, 0.035, D - 0.6, glowMat, W / 2 - 0.34, H - 0.02, 0, 'decke_lichtband_rechts');
  box(W - 0.8, 0.035, 0.08, amberGlow, 0, H - 0.02, D / 2 - 0.3, 'decke_lichtband_glasfront');
  box(W - 0.8, 0.035, 0.08, glowMat, 0, H - 0.02, -D / 2 + 0.3, 'decke_lichtband_rueckwand');

  // ---------------------------------------------------------------- Anschlüsse
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  const doorPoints = [];
  const doorMain = empty('DOOR_haupt', 0, 0, zB, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Kommandotrakte, Flur Etage 6',
  });
  const doorTower = empty('DOOR_turm', xR, 0, sideDoorMid, Math.PI / 2, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Rückwärtiger Turmbereich, Kommandoturm',
  });
  doorPoints.push(doorMain, doorTower);

  // Antiker Schiebetür: Platz in der Wandmitte, Vorderseite (+Z) zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, zB, 0);
  empty('PLACE_OBJ-091_2', xR, 0, sideDoorMid, -Math.PI / 2);

  // ---------------------------------------------------------------- Objektplätze
  // Expeditionsleitungsschreibtisch 1,82 × 1,35 × 2,55 m, Standobjekt am Boden
  empty('PLACE_OBJ-013', -1.35, 0, 0.30, Math.PI);

  // Biometrischer Wandleser 0,16 × 0,51 × 0,10 m an der Rückwand neben der Haupttür
  empty('PLACE_OBJ-051', 1.55, 1.15, -D / 2 + 0.05, 0);

  // ---------------------------------------------------------------- Lichter
  const lampLights = [];
  const lamp = (name, x, y, z, color, intensity, distance) => {
    const o = empty(name, x, y, z, 0, { color, intensity, distance });
    const l = new THREE.PointLight(new THREE.Color(color), intensity, distance, 2);
    l.name = `lichtpunkt_${name}`;
    l.userData.baseIntensity = intensity;
    l.userData.color = color;
    o.add(l);
    lampLights.push(l);
    return o;
  };

  lamp('LAMP_01', 0, 3.2, -1.65, '#9fd8ff', 8, 9);
  lamp('LAMP_02', 0, 3.2, 1.65, '#9fd8ff', 8, 9);
  lamp('LAMP_03', -3.0, 2.35, 0.4, '#9fd8ff', 6, 7);
  lamp('LAMP_04', 3.0, 2.35, 0.2, '#ffd8a0', 6, 7);

  // ---------------------------------------------------------------- Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };

  col('COL_boden', W, 0.2, D, 0, -0.1, 0);
  col('COL_decke', W, 0.3, D, 0, H + 0.15, 0);
  col('COL_wand_links', T, H, D, xL, H / 2, 0);
  col('COL_wand_hinten_links', sideW, H, T, -(DOOR_W / 2 + sideW / 2), H / 2, zB);
  col('COL_wand_hinten_rechts', sideW, H, T, DOOR_W / 2 + sideW / 2, H / 2, zB);
  col('COL_sturz_haupt', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zB);
  col('COL_wand_rechts_vorne', T, H, segA, xR, H / 2, -D / 2 + segA / 2);
  col('COL_wand_rechts_turm', T, H, segB, xR, H / 2, sideDoorB + segB / 2);
  col('COL_sturz_turm', T, H - DOOR_H, DOOR_W, xR, DOOR_H + (H - DOOR_H) / 2, sideDoorMid);
  col('COL_glasfront', W, H, T, 0, H / 2, zF);
  pillarData.forEach((p, i) => col(`COL_saeule_${i + 1}`, 0.46, 3.3, 0.46, p.x, 1.65, p.z));

  // ---------------------------------------------------------------- Animation
  let t = 0;
  let last = null;
  const animate = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.75) * 0.13;
    buntglas.emissiveIntensity = 0.32 + Math.sin(t * 0.55 + 1.1) * 0.05;
    glowMat.emissiveIntensity = 1.1 + Math.sin(t * 0.6) * 0.08;
    amberGlow.emissiveIntensity = 1.0 + Math.sin(t * 0.45 + 0.6) * 0.07;
  };
  slotMesh.onBeforeRender = animate;

  root.userData.raum = {
    id: 'ATL-004',
    name: 'raum_commander_office',
    breite: W,
    tiefe: D,
    hoehe: H,
    etage: 6,
  };
  root.userData.api = {
    setLichtintensitaet(faktor) {
      const f = Math.max(0, Number(faktor) || 0);
      lampLights.forEach((l) => { l.intensity = l.userData.baseIntensity * f; });
    },
    getAnschluesse() {
      return doorPoints.map((d) => ({
        name: d.name,
        position: d.position.toArray(),
        breite: d.userData.breite,
        hoehe: d.userData.hoehe,
        ziel: d.userData.ziel,
      }));
    },
  };

  return root;
}

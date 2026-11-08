// Raum ATL-036: Hauptstromraum / Main Power Room (Inner City, Etage 1).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Haupteingang an der Seite -Z. Leere Hülle: nur Architektur, keine Möbel oder Geräte.
import * as THREE from 'three';

const kit = (n) => new THREE.MeshStandardMaterial({ name: `KIT_${n}` });

export const steckbrief = {
  name: 'raum_main_power_room',
  art: 'Raum',
  masse: '20,0 m × 11,0 m × 4,5 m (≈ 220 m²)',
  wohin: 'ATL-036 Hauptstromraum, Bereich Inner City, Etage 1',
  benutzen: 'technisch: Naquadah-Erzeugung, Energieverteilung, Atmosphärenregelung',
  lichter: '6 LAMP_-Punkte (5× eisblau, 1× bernstein), Deckenlichtfelder und pulsierende Energiebusse',
  animation: 'Energiebusse, Wandlichtschlitze und Bodenstreifen pulsieren leicht (Atmen der Anlage)',
  quelle: 'Auftrag ATL-036, Referenzbild ref1.jpg, Atlantis-Setpläne „Halls & Corridors“ (Staffel 4)',
};

export function create(opts = {}) {
  const W = 20.0;          // Breite in X
  const D = 11.0;          // Tiefe in Z
  const H = 4.5;           // lichte Höhe
  const T = 0.3;           // Wanddicke
  const DW = 2.4;          // Durchgangsbreite (Tür)
  const DH = 3.0;          // Durchgangshöhe (Tür)

  const root = new THREE.Group();
  root.name = 'raum_main_power_room';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matRail = kit('rail');
  const matGlass = kit('glass');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');
  const matHull = kit('hull');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const matBusGlow = new THREE.MeshStandardMaterial({
    name: 'bus_leuchte', color: 0x9fd8ff, emissive: 0x4fa8ff, emissiveIntensity: 1.9,
    roughness: 0.35, metalness: 0.1,
  });
  const matSlot = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.5, roughness: 0.4,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    name: 'stadschild_flaeche', color: 0x0d2a3a, emissive: 0x1c6f8f, emissiveIntensity: 0.75,
    roughness: 0.5, metalness: 0.2,
  });
  const matStrip = new THREE.MeshStandardMaterial({
    name: 'boden_leuchtstreifen', color: 0x9fd8ff, emissive: 0x37d0c0, emissiveIntensity: 1.25,
    roughness: 0.4, metalness: 0.1,
  });
  const matVent = new THREE.MeshStandardMaterial({
    name: 'lueftungsgitter', color: 0x1b2732, metalness: 0.55, roughness: 0.62,
  });

  const box = (name, w, h, d, x, y, z, mat, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    root.add(m);
    return m;
  };

  const inst = (name, geo, mat, list) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
    const o = new THREE.Object3D();
    list.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(0, p.rotY || 0, 0);
      o.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // --------------------------------------------------------------- Geometrie-Helfer
  const hexShape = (r) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  };

  // --------------------------------------------------------------- Boden
  box('boden', W + 2 * T, 0.1, D + 2 * T, 0, -0.05, 0, matFloor);

  const fX = [];
  for (let z = -4.8; z <= 4.81; z += 1.2) fX.push({ x: 0, y: 0.004, z });
  inst('boden_fugen_x', new THREE.BoxGeometry(W - 0.44, 0.006, 0.018), matCopper, fX);
  const fZ = [];
  for (let x = -9.6; x <= 9.61; x += 1.2) fZ.push({ x, y: 0.004, z: 0 });
  inst('boden_fugen_z', new THREE.BoxGeometry(0.018, 0.006, D - 0.44), matCopper, fZ);

  // umlaufender grün-kupferner Rand
  box('boden_rand_vorn', W, 0.014, 0.22, 0, 0.007, -D / 2 + 0.11, matPatina);
  box('boden_rand_hinten', W, 0.014, 0.22, 0, 0.007, D / 2 - 0.11, matPatina);
  box('boden_rand_links', 0.22, 0.014, D - 0.44, -W / 2 + 0.11, 0.007, 0, matPatina);
  box('boden_rand_rechts', 0.22, 0.014, D - 0.44, W / 2 - 0.11, 0.007, 0, matPatina);

  // zentrale sechseckige Intarsie (vollständig innerhalb der Hülle)
  const coreZ = 2.4;
  const hexInlay = new THREE.Mesh(new THREE.ShapeGeometry(hexShape(2.2)), matCopper);
  hexInlay.name = 'boden_intarsie_sechseck';
  hexInlay.rotation.x = -Math.PI / 2;
  hexInlay.position.set(0, 0.008, coreZ);
  root.add(hexInlay);
  const hexInlay2 = new THREE.Mesh(new THREE.ShapeGeometry(hexShape(1.95)), matPatina);
  hexInlay2.name = 'boden_intarsie_sechseck_innen';
  hexInlay2.rotation.x = -Math.PI / 2;
  hexInlay2.position.set(0, 0.010, coreZ);
  root.add(hexInlay2);
  const hexRing = new THREE.Mesh(new THREE.ShapeGeometry(hexShape(1.28)), matGlow);
  hexRing.name = 'boden_leuchtring';
  hexRing.rotation.x = -Math.PI / 2;
  hexRing.position.set(0, 0.012, coreZ);
  root.add(hexRing);

  // radiale Leuchtstreifen auf dem Boden (kompakt, vollständig im Raum)
  const stripList = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    stripList.push({ x: Math.cos(a) * 1.72, y: 0.012, z: coreZ + Math.sin(a) * 1.72, rotY: -a });
  }
  inst('boden_leuchtstreifen', new THREE.BoxGeometry(0.86, 0.014, 0.07), matStrip, stripList);

  // --------------------------------------------------------------- Wände
  const xL = -W / 2 - T / 2, xR = W / 2 + T / 2;
  const zF = -D / 2 - T / 2, zB = D / 2 + T / 2;

  box('wand_links', T, H, D + 2 * T, xL, H / 2, 0, matWallDark);
  box('wand_rechts', T, H, D + 2 * T, xR, H / 2, 0, matWall);

  // Vorderwand (-Z) mit 2,4 × 3,0 m Durchgang
  const sideW = (W - DW) / 2;
  box('wand_vorn_links', sideW, H, T, -(DW / 2 + sideW / 2), H / 2, zF, matWall);
  box('wand_vorn_rechts', sideW, H, T, (DW / 2 + sideW / 2), H / 2, zF, matWall);
  box('wand_vorn_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, zF, matWall);

  // Bronzene Türzarge (3,34 × 3,74 m), überlappt die Mauerwerkskanten
  const frameZ = -D / 2 + 0.07;
  box('zarge_sturz', 3.34, 0.74, 0.14, 0, DH + 0.37, frameZ, matCopper);
  box('zarge_links', 0.47, 3.74, 0.14, -(DW / 2 + 0.235), 1.87, frameZ, matCopper);
  box('zarge_rechts', 0.47, 3.74, 0.14, (DW / 2 + 0.235), 1.87, frameZ, matCopper);
  box('zarge_leiste_oben', 3.34, 0.08, 0.05, 0, DH + 0.78, frameZ - 0.09, matGlow);

  // Hinterwand (+Z) mit zwei Fensterfronten und mittigem polygonalem Stadschild-Panel
  const winY0 = 2.6, winY1 = 4.0, winH = winY1 - winY0;
  const winA = [-6.4, -4.0], winB = [4.0, 6.4];
  const piers = [[-W / 2, winA[0]], [winA[1], winB[0]], [winB[1], W / 2]];
  piers.forEach((p, i) => {
    const w = p[1] - p[0];
    box(`wand_hinten_pfeiler_${i}`, w, H, T, (p[0] + p[1]) / 2, H / 2, zB, matWall);
  });
  [winA, winB].forEach((w, i) => {
    const cx = (w[0] + w[1]) / 2, ww = w[1] - w[0];
    box(`wand_hinten_unter_${i}`, ww, winY0, T, cx, winY0 / 2, zB, matWall);
    box(`wand_hinten_ueber_${i}`, ww, H - winY1, T, cx, winY1 + (H - winY1) / 2, zB, matWall);
    box(`fenster_rahmen_unten_${i}`, ww + 0.16, 0.1, 0.16, cx, winY0, zB - T / 2 + 0.02, matCopper);
    box(`fenster_rahmen_oben_${i}`, ww + 0.16, 0.1, 0.16, cx, winY1, zB - T / 2 + 0.02, matCopper);
    box(`fenster_rahmen_links_${i}`, 0.1, winH + 0.1, 0.16, w[0], (winY0 + winY1) / 2, zB - T / 2 + 0.02, matCopper);
    box(`fenster_rahmen_rechts_${i}`, 0.1, winH + 0.1, 0.16, w[1], (winY0 + winY1) / 2, zB - T / 2 + 0.02, matCopper);
    box(`fenster_glas_${i}`, ww - 0.06, winH - 0.06, 0.05, cx, (winY0 + winY1) / 2, zB - 0.05, matGlass);
    for (let k = 1; k <= 2; k++) {
      box(`fenster_sprosse_${i}_${k}`, 0.05, winH, 0.09, w[0] + ww * (k / 3), (winY0 + winY1) / 2, zB - T / 2 + 0.02, matCopper);
    }
  });

  // --------------------------------------------------------------- Großes sechseckiges Stadschild-Panel (fest eingebaute Architektur)
  const screenZ = D / 2 - 0.12;
  box('stadsschild_halter', 4.6, 0.28, 0.10, 0, 2.25, screenZ + 0.08, matHull);
  const hexPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.10, 6), matCopper);
  hexPlate.name = 'stadschild_platte';
  hexPlate.rotation.x = Math.PI / 2;
  hexPlate.position.set(0, 2.25, screenZ + 0.02);
  root.add(hexPlate);
  const hexFace = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.04, 6), matHull);
  hexFace.name = 'stadschild_flaeche_aussen';
  hexFace.rotation.x = Math.PI / 2;
  hexFace.position.set(0, 2.25, screenZ - 0.05);
  root.add(hexFace);
  const hexGlow = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.03, 6), matScreen);
  hexGlow.name = 'stadschild_anzeige';
  hexGlow.rotation.x = Math.PI / 2;
  hexGlow.position.set(0, 2.25, screenZ - 0.09);
  root.add(hexGlow);
  // Schneeflocken-Ornament (verzweigte, rechtwinklige Linien) auf der Anzeige
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const arm = box(`stadschild_ornament_arm_${i}`, 1.3, 0.05, 0.03, 0, 2.25, screenZ - 0.12, matCopper);
    arm.rotation.z = a;
    for (const s of [-1, 1]) {
      const br = box(`stadschild_ornament_zweig_${i}_${s}`, 0.05, 0.42, 0.03, 0, 2.25, screenZ - 0.12, matCopper);
      br.rotation.z = a + s * Math.PI / 3;
      br.position.x = Math.cos(a) * 0.46 + Math.cos(a + s * Math.PI / 3) * 0.21;
      br.position.y = 2.25 + Math.sin(a) * 0.46 + Math.sin(a + s * Math.PI / 3) * 0.21;
    }
  }
  const tiles = [];
  for (let i = 0; i < 4; i++) tiles.push({ x: -1.35 + i * 0.9, y: 3.42, z: screenZ - 0.13 });
  inst('stadschild_kacheln', new THREE.BoxGeometry(0.62, 0.16, 0.03), matGlow, tiles);
  const tiles2 = [];
  for (let i = 0; i < 4; i++) tiles2.push({ x: -1.35 + i * 0.9, y: 1.08, z: screenZ - 0.13 });
  inst('stadschild_kacheln_unten', new THREE.BoxGeometry(0.62, 0.16, 0.03), matAmber, tiles2);

  // --------------------------------------------------------------- Sockelleisten / Gesimse
  box('sockel_links', 0.05, 0.15, D, -W / 2 + 0.025, 0.075, 0, matCopper);
  box('sockel_rechts_a', 0.05, 0.15, D / 2 - 3.25, W / 2 - 0.025, 0.075, -(D / 2 + 3.25) / 2 + D / 4, matCopper);
  box('sockel_rechts_b', 0.05, 0.15, D / 2 - 3.25, W / 2 - 0.025, 0.075, (D / 2 + 3.25) / 2, matCopper);
  box('sockel_hinten_mitte', winB[0] - winA[1], 0.15, 0.05, 0, 0.075, D / 2 - 0.025, matCopper);
  box('sockel_vorn_links', sideW, 0.15, 0.05, -(DW / 2 + sideW / 2), 0.075, -D / 2 + 0.025, matCopper);
  box('sockel_vorn_rechts', sideW, 0.15, 0.05, (DW / 2 + sideW / 2), 0.075, -D / 2 + 0.025, matCopper);
  box('gesims_links', 0.07, 0.1, D, -W / 2 + 0.035, H - 0.05, 0, matCopper);
  box('gesims_rechts', 0.07, 0.1, D, W / 2 - 0.035, H - 0.05, 0, matCopper);
  box('gesims_hinten', W, 0.1, 0.07, 0, H - 0.05, D / 2 - 0.035, matCopper);
  box('gesims_vorn_links', sideW, 0.1, 0.07, -(DW / 2 + sideW / 2), H - 0.05, -D / 2 + 0.035, matCopper);
  box('gesims_vorn_rechts', sideW, 0.1, 0.07, (DW / 2 + sideW / 2), H - 0.05, -D / 2 + 0.035, matCopper);

  // --------------------------------------------------------------- Wandpaneele (Plant-ons)
  const panels = [];
  const addPanel = (x, y, z, rotY) => panels.push({ x, y, z, rotY });
  for (const z of [-3.6, -1.2, 1.2, 3.6]) addPanel(-W / 2 + 0.03, 1.55, z, Math.PI / 2);
  for (const z of [-4.6, 4.6]) addPanel(W / 2 - 0.03, 1.55, z, -Math.PI / 2);
  for (const x of [-8.4, -6.0, -3.6, 3.6, 6.0, 8.4]) addPanel(x, 1.55, -D / 2 + 0.03, 0);
  for (const x of [-2.4, 0, 2.4]) addPanel(x, 1.55, D / 2 - 0.03, Math.PI);

  const frameList = panels.map((p) => {
    const n = new THREE.Vector3(Math.sin(p.rotY), 0, Math.cos(p.rotY));
    return { x: p.x + n.x * 0.025, y: p.y, z: p.z + n.z * 0.025, rotY: p.rotY };
  });
  const faceList = panels.map((p) => {
    const n = new THREE.Vector3(Math.sin(p.rotY), 0, Math.cos(p.rotY));
    return { x: p.x + n.x * 0.045, y: p.y, z: p.z + n.z * 0.045, rotY: p.rotY };
  });
  inst('paneel_rahmen', new THREE.BoxGeometry(1.12, 2.72, 0.05), matCopper, frameList);
  inst('paneel_flaechen', new THREE.BoxGeometry(1.0, 2.6, 0.035), matWallDark, faceList);

  // Lüftungsgitter (fest eingebaute Architektur) an der linken Wand
  const ventList = [];
  for (let i = 0; i < 7; i++) ventList.push({ x: -W / 2 + 0.03, y: 3.95, z: -4.2 + i * 1.4 });
  inst('lueftungsgitter', new THREE.BoxGeometry(0.05, 0.42, 1.1), matVent, ventList);
  const ventSlots = [];
  for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) ventSlots.push({ x: -W / 2 + 0.06, y: 3.78 + k * 0.17, z: -4.2 + i * 1.4 });
  inst('lueftungsgitter_schlitze', new THREE.BoxGeometry(0.03, 0.06, 0.92), matBusGlow, ventSlots);

  // --------------------------------------------------------------- Senkrechte Lichtschlitze
  const slots = [];
  for (const z of [-2.4, 2.4]) for (let k = 0; k < 4; k++) slots.push({ x: -W / 2 + 0.018, y: 1.05 + k * 0.46, z });
  for (const z of [-4.6, 4.6]) for (let k = 0; k < 4; k++) slots.push({ x: W / 2 - 0.018, y: 1.05 + k * 0.46, z });
  for (const x of [-4.8, 4.8]) for (let k = 0; k < 4; k++) slots.push({ x, y: 1.05 + k * 0.46, z: D / 2 - 0.018 });
  const slotMesh = inst('lichtschlitze', new THREE.BoxGeometry(0.02, 0.34, 0.07), matSlot, slots);

  // --------------------------------------------------------------- Vertikale Energiebusse (Hinterwand)
  const busX = [-9.0, -3.6, 3.6, 9.0];
  busX.forEach((x, i) => {
    box(`energiebus_${i}`, 0.3, 3.8, 0.34, x, 1.95, D / 2 - 0.2, matCopper);
    box(`energiebus_leuchte_${i}`, 0.08, 3.4, 0.04, x, 1.95, D / 2 - 0.38, matBusGlow);
    box(`energiebus_kappe_${i}`, 0.46, 0.12, 0.5, x, 3.9, D / 2 - 0.23, matWallDark);
    box(`energiebus_sockel_${i}`, 0.46, 0.14, 0.5, x, 0.1, D / 2 - 0.23, matWallDark);
  });
  // seitliche Busse an der linken Wand (Mitte frei für den Atmosphärenregler)
  for (const z of [-4.4, 4.4]) {
    box(`energiebus_links_${z}`, 0.34, 3.8, 0.3, -W / 2 + 0.17, 1.95, z, matCopper);
    box(`energiebus_links_leuchte_${z}`, 0.04, 3.4, 0.08, -W / 2 + 0.35, 1.95, z, matBusGlow);
  }
  // Decken-Hauptbus
  box('energiebus_decke', W - 1.2, 0.34, 0.34, 0, H - 0.32, 4.7, matCopper);
  box('energiebus_decke_leuchte', W - 1.6, 0.06, 0.1, 0, H - 0.51, 4.7, matBusGlow);
  for (const x of [-6, 6]) box(`energiebus_abhang_${x}`, 0.24, 0.3, 0.24, x, H - 0.12, 4.7, matWallDark);
  // Kabelkanäle von der Hinterwand zum Deckenbus
  for (const x of [-6.0, 0, 6.0]) {
    box(`kabelkanal_${x}`, 0.22, 0.22, 2.6, x, H - 0.18, 3.9, matWallDark);
    box(`kabelkanal_leuchte_${x}`, 0.05, 0.05, 2.4, x + 0.12, H - 0.31, 3.9, matBusGlow);
  }

  // --------------------------------------------------------------- Säulen
  const pillarPos = [[-7.6, -3.6], [7.6, -3.6], [-7.6, 3.6], [7.6, 3.6]];
  inst('saeulen', new THREE.BoxGeometry(0.46, H, 0.46), matPillar,
    pillarPos.map(([x, z]) => ({ x, y: H / 2, z })));
  for (const [x, z] of pillarPos) {
    box(`saeule_kapital_${x}_${z}`, 0.66, 0.16, 0.66, x, H - 0.08, z, matCopper);
    box(`saeule_basis_${x}_${z}`, 0.66, 0.16, 0.66, x, 0.08, z, matCopper);
    box(`saeule_bus_${x}_${z}`, 0.06, 3.2, 0.06, x, 1.95, z - 0.26, matBusGlow);
  }

  // --------------------------------------------------------------- Schutzgitter (Architektur)
  const cage = (name, x0, x1, z0, z1, h) => {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    box(`${name}_rahmen_oben_v`, w, 0.08, 0.08, cx, h, z0, matRail);
    box(`${name}_rahmen_oben_h`, w, 0.08, 0.08, cx, h, z1, matRail);
    box(`${name}_rahmen_oben_l`, 0.08, 0.08, d, x0, h, cz, matRail);
    box(`${name}_rahmen_oben_r`, 0.08, 0.08, d, x1, h, cz, matRail);
    box(`${name}_quer_mitte_v`, w, 0.05, 0.05, cx, h * 0.55, z0, matRail);
    box(`${name}_quer_mitte_h`, w, 0.05, 0.05, cx, h * 0.55, z1, matRail);
    const bars = [];
    const n = Math.max(2, Math.round(w / 0.3));
    for (let i = 0; i <= n; i++) bars.push({ x: x0 + (w * i) / n, y: h / 2, z: z0 });
    for (let i = 0; i <= n; i++) bars.push({ x: x0 + (w * i) / n, y: h / 2, z: z1 });
    inst(`${name}_staebe`, new THREE.BoxGeometry(0.045, h, 0.045), matRail, bars);
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      box(`${name}_pfosten_${px}_${pz}`, 0.1, h + 0.12, 0.1, px, (h + 0.12) / 2, pz, matRail);
    }
  };
  cage('schutzgitter_links', -9.6, -8.0, 3.2, 5.0, 1.15);
  cage('schutzgitter_rechts', 8.0, 9.6, 3.2, 5.0, 1.15);

  // Schutzrahmen um den Kern (Stellplatz für den Antiker Sternenantrieb)
  const framePosts = [[-1.05, 1.15], [1.05, 1.15], [-1.05, 3.25], [1.05, 3.25]];
  for (const [px, pz] of framePosts) {
    box(`schutzrahmen_pfosten_${px}_${pz}`, 0.14, 3.3, 0.14, px, 1.65, pz, matRail);
  }
  for (const pz of [1.15, 3.25]) box(`schutzrahmen_quer_${pz}`, 2.24, 0.14, 0.14, 0, 3.3, pz, matRail);
  for (const px of [-1.05, 1.05]) box(`schutzrahmen_laengs_${px}`, 0.14, 0.14, 2.24, px, 3.3, 2.2, matRail);
  const rahmenStaebe = [];
  for (let i = 1; i <= 5; i++) rahmenStaebe.push({ x: -1.05 + (2.1 * i) / 6, y: 3.3, z: 1.15 });
  for (let i = 1; i <= 5; i++) rahmenStaebe.push({ x: -1.05 + (2.1 * i) / 6, y: 3.3, z: 3.25 });
  inst('schutzrahmen_staebe', new THREE.BoxGeometry(0.05, 0.05, 2.1), matRail, rahmenStaebe);
  // Warnstreifen am Schutzrahmen
  for (const pz of [1.15, 3.25]) box(`schutzrahmen_warn_${pz}`, 2.24, 0.06, 0.16, 0, 0.12, pz, matAmber);

  // --------------------------------------------------------------- Decke
  box('decke_haupt', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0, matCeiling);
  const kass = [];
  for (const x of [-7.2, -2.4, 2.4, 7.2]) for (const z of [-3.6, 0, 3.6]) kass.push({ x, y: H - 0.03, z });
  inst('decke_kassetten', new THREE.BoxGeometry(3.6, 0.06, 2.4), matWallDark, kass);
  const deckLicht = [];
  for (const x of [-7, -2.4, 2.4, 7]) {
    deckLicht.push({ x, y: H - 0.06, z: -2.4 });
    deckLicht.push({ x, y: H - 0.06, z: 2.4 });
  }
  inst('decke_lichtfelder', new THREE.BoxGeometry(2.6, 0.05, 0.42), matGlow, deckLicht);
  box('decke_lichtband_links', 0.1, 0.05, D - 0.6, -W / 2 + 0.5, H - 0.03, 0, matAmber);
  box('decke_lichtband_rechts', 0.1, 0.05, D - 0.6, W / 2 - 0.5, H - 0.03, 0, matAmber);

  // --------------------------------------------------------------- Türen und Objektplätze
  empty('DOOR_haupt', 0, 0, zF, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Korridor ATL-049', raum: 'ATL-049',
  });
  // Antiker-Schiebetür: Ursprung in der Wandmitte, +Z zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, zF, 0);

  // Primäre Energieverteiler-Knoten (6,40 × 3,60 × 1,48 m) an der rechten Wand
  // Rückseite an der Wandinnenfläche: Ursprung um halbe Obfittiefe in den Raum versetzt.
  empty('PLACE_OBJ-036', W / 2 - 0.74, 0, 0, -Math.PI / 2);
  // Lebenserhaltungs-Atmosphärenregler (1,00 × 2,00 × 0,34 m) an der linken Wand
  empty('PLACE_OBJ-054', -W / 2 + 0.17, 0, 0, Math.PI / 2);
  // Standobjekte (Vorderseite +Z zeigt zum Eingang bei -Z)
  empty('PLACE_OBJ-044', -5.2, 0, 1.2, Math.PI);
  empty('PLACE_OBJ-045', 0, 0, coreZ, Math.PI);
  empty('PLACE_OBJ-046', 5.2, 0, 1.2, Math.PI);

  // --------------------------------------------------------------- Lichter
  const lampPos = [
    [-7, H - 0.25, -2.6, '#9fd8ff'], [7, H - 0.25, -2.6, '#9fd8ff'],
    [-7, H - 0.25, 2.6, '#9fd8ff'], [7, H - 0.25, 2.6, '#9fd8ff'],
    [0, H - 0.25, -3.6, '#ffd8a0'], [0, H - 0.25, 3.2, '#9fd8ff'],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: p[3], intensity: p[3] === '#ffd8a0' ? 7 : 9, distance: 12 });
  });

  // --------------------------------------------------------------- Kollision
  const colMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const col = (name, w, h, d, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colMat);
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    root.add(m);
    return m;
  };
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_links', T, H, D + 2 * T, xL, H / 2, 0);
  col('COL_wand_rechts', T, H, D + 2 * T, xR, H / 2, 0);
  col('COL_wand_vorn_links', sideW, H, T, -(DW / 2 + sideW / 2), H / 2, zF);
  col('COL_wand_vorn_rechts', sideW, H, T, (DW / 2 + sideW / 2), H / 2, zF);
  col('COL_wand_vorn_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, zF);
  piers.forEach((p, i) => col(`COL_wand_hinten_pfeiler_${i}`, p[1] - p[0], H, T, (p[0] + p[1]) / 2, H / 2, zB));
  [winA, winB].forEach((w, i) => {
    const cx = (w[0] + w[1]) / 2;
    col(`COL_wand_hinten_unter_${i}`, w[1] - w[0], winY0, T, cx, winY0 / 2, zB);
    col(`COL_wand_hinten_ueber_${i}`, w[1] - w[0], H - winY1, T, cx, winY1 + (H - winY1) / 2, zB);
  });
  pillarPos.forEach(([x, z], i) => col(`COL_saeule_${i}`, 0.5, H, 0.5, x, H / 2, z));
  busX.forEach((x, i) => col(`COL_energiebus_${i}`, 0.34, 3.8, 0.38, x, 1.95, D / 2 - 0.22));
  for (const z of [-4.4, 4.4]) col(`COL_energiebus_links_${z}`, 0.38, 3.8, 0.34, -W / 2 + 0.19, 1.95, z);
  col('COL_energiebus_decke', W - 1.2, 0.4, 0.4, 0, H - 0.32, 4.7);
  col('COL_stadschild_platte', 4.4, 3.8, 0.25, 0, 2.25, screenZ);
  col('COL_schutzgitter_links', 1.6, 1.3, 1.8, -8.8, 0.65, 4.1);
  col('COL_schutzgitter_rechts', 1.6, 1.3, 1.8, 8.8, 0.65, 4.1);
  for (const [px, pz] of framePosts) {
    col(`COL_schutzrahmen_${px}_${pz}`, 0.18, 3.3, 0.18, px, 1.65, pz);
  }

  // --------------------------------------------------------------- Animation / API
  let t = 0, last = null;
  const anim = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    const puls = root.userData.api && root.userData.api._puls !== false;
    const p = puls ? 1.8 + Math.sin(t * 0.9) * 0.25 + Math.sin(t * 2.3) * 0.08 : 1.2;
    matBusGlow.emissiveIntensity = p;
    matSlot.emissiveIntensity = 1.45 + Math.sin(t * 0.7 + 1.1) * 0.14;
    matStrip.emissiveIntensity = 1.15 + Math.sin(t * 0.6 + 0.4) * 0.12;
  };
  root.onBeforeRender = anim;

  root.userData.raum = { id: 'ATL-036', breite: W, tiefe: D, hoehe: H };
  root.userData.api = {
    setEnergie: (v = 1) => {
      const k = Math.max(0, Math.min(1, v));
      matBusGlow.emissiveIntensity = 0.4 + k * 1.6;
      matSlot.emissiveIntensity = 0.3 + k * 1.3;
      matStrip.emissiveIntensity = 0.25 + k * 1.1;
    },
    pulsieren: (an = true) => { root.userData.api._puls = an; },
    _puls: true,
  };

  return root;
}

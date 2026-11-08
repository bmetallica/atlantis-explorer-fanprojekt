// Raum ATL-037: Stromverteilzentrum (Inner City, Etage 1, technisch)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite −Z. Leere Hülle: nur Architektur (Relaiswände, Kabeltrassen,
// Servicegalerie, Treppe, Leuchten); Möbel werden später an die PLACE_-Punkte gesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_power_distribution_center',
  art: 'Raum',
  masse: '12,0 m × 10,8 m × 3,8 m lichte Höhe (ca. 130 m²)',
  wohin: 'Inner City, Etage 1 – technischer Verteilerknoten der sekundären Energiepfade',
  benutzen: 'keine (Verteilerkonsolen, Relaisstationen und Diagnosecomputer werden als fertige Objekte an die PLACE_-Punkte gesetzt)',
  lichter: '8 LAMP_-Punkte, eisblau (#8fc9ff), Intensität 9, Reichweite 13 m',
  animation: 'Lichtleisten der Kabeltrassen und Wandfelder atmen langsam (0,6 Hz)',
  quelle: 'selbst gebaut nach Auftrag ATL-037, Referenzbilder ref1/ref2 (technischer Korridor, Schaltzentrale) und Atlantis-Kupferpalette',
};

export function create(opts = {}) {
  const W = 12.0;          // Breite in X
  const D = 10.8;          // Tiefe in Z
  const H = 3.8;           // lichte Deckenhöhe
  const T = 0.3;           // Wanddicke
  const DOOR_W = 2.4;
  const DOOR_H = 3.0;

  // Servicegalerie an der Nordwand
  const GAL_H = 1.2;       // Podesthöhe
  const GAL_Z0 = D / 2 - 1.6;   // 3.8 – Vorderkante der Galerie
  const GAL_Z1 = D / 2 - 0.05;  // 5.35 – an der Wand
  const GAL_X0 = -4.2;
  const GAL_X1 = 4.2;
  const STEP_N = 4;
  const STEP_H = GAL_H / STEP_N;   // 0,30 m
  const STEP_T = 0.45;             // Trittiefe

  const root = new THREE.Group();
  root.name = 'raum_power_distribution_center';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillar = kit('pillar');
  const floorMat = kit('floor');
  const floorUpper = kit('floorUpper');
  const ceilMat = kit('ceiling');
  const glowMat = kit('glow');
  const doorMat = kit('door');
  const stairMat = kit('stair');
  const railMat = kit('rail');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_technik', color: 0x9fd8ff, emissive: 0x8fc9ff,
    emissiveIntensity: 1.5, roughness: 0.35, metalness: 0.1,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'statusanzeige_bernstein', color: 0xffd8a0, emissive: 0xffaa44,
    emissiveIntensity: 1.3, roughness: 0.4, metalness: 0.05,
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
      dummy.rotation.set(0, p.ry || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };

  // Wandsegment als Box, Länge = Abstand, Drehung = -atan2(dz, dx)
  const wallSeg = (ax, az, bx, bz, height, baseY, mat, name, withCol) => {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const m = box(len, height, T, mat, mx, baseY + height / 2, mz, name);
    m.rotation.y = -Math.atan2(dz, dx);
    if (withCol) {
      const c = col(`COL_${name}`, len, height, T, mx, baseY + height / 2, mz);
      c.rotation.y = m.rotation.y;
    }
    return m;
  };

  // ---------------------------------------------------------------- Boden
  box(W, 0.2, D, floorMat, 0, -0.1, 0, 'boden');
  for (const s of [-1, 1]) {
    box(0.24, 0.014, D, patina, s * (W / 2 - 0.12), 0.007, 0, 'boden_rand');
    box(W - 0.48, 0.014, 0.24, patina, 0, 0.007, s * (D / 2 - 0.12), 'boden_rand');
  }

  // Bodenfugen: Linien quer zu X bei jedem z-Wert, Linien längs zu Z bei jedem x-Wert.
  // (Geometrie jeweils exakt innerhalb der Randleiste.)
  const linesX = [];
  for (let z = -D / 2 + 1.2; z < D / 2 - 0.01; z += 1.2) linesX.push({ x: 0, y: 0.006, z });
  const linesZ = [];
  for (let x = -W / 2 + 1.2; x < W / 2 - 0.01; x += 1.2) linesZ.push({ x, y: 0.006, z: 0 });
  inst(new THREE.BoxGeometry(W - 0.48, 0.008, 0.025), copper, linesX, 'boden_fugen_quer');
  inst(new THREE.BoxGeometry(0.025, 0.008, D - 0.48), copper, linesZ, 'boden_fugen_laengs');

  // runde Bodenintarsien (zulässig)
  const ring = add(new THREE.RingGeometry(2.05, 2.18, 48), copper, 0, 0.012, 0, 'boden_intarsie');
  ring.rotation.x = -Math.PI / 2;
  const ring2 = add(new THREE.RingGeometry(1.55, 1.62, 48), patina, 0, 0.012, 0, 'boden_intarsie_innen');
  ring2.rotation.x = -Math.PI / 2;

  // flache Energiekanäle im Boden (fest eingebaute Architektur)
  box(10.6, 0.06, 0.22, copper, 0, 0.03, -1.1, 'boden_kanal_quer');
  box(0.22, 0.06, 4.6, copper, -2.6, 0.03, 1.2, 'boden_kanal_laengs');
  box(10.4, 0.02, 0.07, lineGlow, 0, 0.065, -1.1, 'boden_kanal_leiste');
  box(0.07, 0.02, 4.4, lineGlow, -2.6, 0.065, 1.2, 'boden_kanal_leiste_l');

  // ---------------------------------------------------------------- Wände
  // Süd (−Z): Hauptzugang, Türöffnung 2,4 × 3,0 in der Mitte
  wallSeg(-W / 2 - T / 2, -D / 2, -DOOR_W / 2, -D / 2, H, 0, wall, 'wand_sued_links', true);
  wallSeg(DOOR_W / 2, -D / 2, W / 2 + T / 2, -D / 2, H, 0, wall, 'wand_sued_rechts', true);
  wallSeg(-DOOR_W / 2, -D / 2, DOOR_W / 2, -D / 2, H - DOOR_H, DOOR_H, wall, 'sturz_sued', false);
  // Nord (+Z)
  wallSeg(-W / 2 - T / 2, D / 2, W / 2 + T / 2, D / 2, H, 0, wall, 'wand_nord', true);
  // West (−X)
  wallSeg(-W / 2, -D / 2 - T / 2, -W / 2, D / 2 + T / 2, H, 0, wall, 'wand_west', true);
  // Ost (+X): Nebentüröffnung bei z = 3,0
  const eastDoorZ = 3.0;
  wallSeg(W / 2, -D / 2 - T / 2, W / 2, eastDoorZ - DOOR_W / 2, H, 0, wall, 'wand_ost_a', true);
  wallSeg(W / 2, eastDoorZ + DOOR_W / 2, W / 2, D / 2 + T / 2, H, 0, wall, 'wand_ost_b', true);
  wallSeg(W / 2, eastDoorZ - DOOR_W / 2, W / 2, eastDoorZ + DOOR_W / 2, H - DOOR_H, DOOR_H, wall, 'sturz_ost', false);

  // ---------------------------------------------------------------- Relaiswände / Wandpaneele
  const frameGeo = new THREE.BoxGeometry(1.10, 2.60, 0.05);
  const panelGeo = new THREE.BoxGeometry(0.92, 2.42, 0.07);
  const slotGeo = new THREE.BoxGeometry(0.07, 0.30, 0.03);
  const amberGeo = new THREE.BoxGeometry(0.10, 0.10, 0.03);
  const frames = [], panels = [], slots = [], ambers = [];

  // Nordwand
  for (let i = 0; i < 10; i++) {
    const x = -5.4 + i * 1.2;
    if (i % 2 === 0) {
      frames.push({ x, y: 1.6, z: D / 2 - 0.03 });
      panels.push({ x, y: 1.6, z: D / 2 - 0.045 });
    } else {
      for (let k = 0; k < 4; k++) slots.push({ x, y: 0.95 + k * 0.42, z: D / 2 - 0.02 });
      ambers.push({ x, y: 2.55, z: D / 2 - 0.02 });
    }
  }
  // Südwand (ohne Türbereich)
  for (const [a, b] of [[-5.4, -1.5], [1.5, 5.4]]) {
    const n = Math.max(1, Math.round((b - a) / 1.2));
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * ((b - a) / n);
      if (Math.abs(x) < 1.7) continue;
      if (i % 2 === 0) {
        frames.push({ x, y: 1.6, z: -D / 2 + 0.03 });
        panels.push({ x, y: 1.6, z: -D / 2 + 0.045 });
      } else {
        for (let k = 0; k < 4; k++) slots.push({ x, y: 0.95 + k * 0.42, z: -D / 2 + 0.02 });
        ambers.push({ x, y: 2.55, z: -D / 2 + 0.02 });
      }
    }
  }
  // Ostwand, Breite entlang Z
  for (const [a, b] of [[-5.1, 1.4], [4.6, 5.1]]) {
    const n = Math.max(1, Math.round((b - a) / 1.2));
    for (let i = 0; i < n; i++) {
      const z = a + (i + 0.5) * ((b - a) / n);
      if (i % 2 === 0) {
        frames.push({ x: W / 2 - 0.03, y: 1.6, z, ry: Math.PI / 2 });
        panels.push({ x: W / 2 - 0.045, y: 1.6, z, ry: Math.PI / 2 });
      } else {
        for (let k = 0; k < 4; k++) slots.push({ x: W / 2 - 0.02, y: 0.95 + k * 0.42, z, ry: Math.PI / 2 });
        ambers.push({ x: W / 2 - 0.02, y: 2.55, z, ry: Math.PI / 2 });
      }
    }
  }
  // Westwand: nur südlicher Abschnitt (Nordbereich ist Treppenaufgang, Mitte ist OBJ-036)
  for (const [a, b] of [[-5.1, -3.6]]) {
    const n = Math.max(1, Math.round((b - a) / 1.2));
    for (let i = 0; i < n; i++) {
      const z = a + (i + 0.5) * ((b - a) / n);
      if (i % 2 === 0) {
        frames.push({ x: -W / 2 + 0.03, y: 1.6, z, ry: -Math.PI / 2 });
        panels.push({ x: -W / 2 + 0.045, y: 1.6, z, ry: -Math.PI / 2 });
      } else {
        for (let k = 0; k < 4; k++) slots.push({ x: -W / 2 + 0.02, y: 0.95 + k * 0.42, z, ry: -Math.PI / 2 });
        ambers.push({ x: -W / 2 + 0.02, y: 2.55, z, ry: -Math.PI / 2 });
      }
    }
  }
  inst(frameGeo, copper, frames, 'relais_wand_rahmen');
  inst(panelGeo, wallDark, panels, 'relais_wand_paneele');
  const slotMesh = inst(slotGeo, lineGlow, slots, 'wand_lichtschlitze');
  inst(amberGeo, amberGlow, ambers, 'wand_statusanzeigen');

  // ---------------------------------------------------------------- Kabeltrassen (rundum)
  const trayY = 3.05;
  const tray = (len, x, z, ry, name) => {
    const g = new THREE.Group();
    g.position.set(x, trayY, z);
    g.rotation.y = ry;
    const ch = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.34), copper);
    ch.name = name; g.add(ch);
    const core = new THREE.Mesh(new THREE.BoxGeometry(len - 0.1, 0.05, 0.16), wallDark);
    core.position.y = 0.08; g.add(core);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(len - 0.2, 0.03, 0.07), lineGlow);
    strip.position.y = -0.11; g.add(strip);
    root.add(g);
  };
  tray(11.6, 0, D / 2 - 0.22, 0, 'kabeltrasse_nord');
  tray(4.3, -3.65, -D / 2 + 0.22, 0, 'kabeltrasse_sued_links');
  tray(4.3, 3.65, -D / 2 + 0.22, 0, 'kabeltrasse_sued_rechts');
  tray(1.8, -W / 2 + 0.22, -4.35, Math.PI / 2, 'kabeltrasse_west_sued');
  tray(1.8, -W / 2 + 0.22, 4.35, Math.PI / 2, 'kabeltrasse_west_nord');
  tray(6.6, W / 2 - 0.22, -1.75, Math.PI / 2, 'kabeltrasse_ost_sued');
  tray(0.7, W / 2 - 0.22, 4.75, Math.PI / 2, 'kabeltrasse_ost_nord');

  // ---------------------------------------------------------------- Säulen (Südseite, freie Wege bleiben ≥ 1,2 m)
  const cols = [[-5.6, -4.9], [-3.6, -4.9], [3.6, -4.9], [5.6, -4.9]];
  for (let i = 0; i < cols.length; i++) {
    const [x, z] = cols[i];
    box(0.34, H, 0.34, pillar, x, H / 2, z, `saeule_${i + 1}`);
    box(0.48, 0.12, 0.48, copper, x, 0.06, z, `saeule_sockel_${i + 1}`);
    box(0.46, 0.10, 0.46, copper, x, H - 0.05, z, `saeule_kopf_${i + 1}`);
    col(`COL_saeule_${i + 1}`, 0.5, H, 0.5, x, H / 2, z);
  }

  // ---------------------------------------------------------------- Servicegalerie (Nord) + Treppe (West)
  const galW = GAL_X1 - GAL_X0;
  const galD = GAL_Z1 - GAL_Z0;
  const galCX = (GAL_X0 + GAL_X1) / 2;
  const galCZ = (GAL_Z0 + GAL_Z1) / 2;
  box(galW, GAL_H, galD, floorUpper, galCX, GAL_H / 2, galCZ, 'galerie_boden');
  box(galW + 0.1, 0.08, galD + 0.1, copper, galCX, GAL_H - 0.04, galCZ, 'galerie_einfassung');
  col('COL_galerie', galW, GAL_H, galD, galCX, GAL_H / 2, galCZ);

  // Stufen: 4 × 0,30 m Höhe, Trittiefe 0,45 m, Lauf von x = −6,0 bis x = −4,2
  const stairZ = 4.6;
  for (let i = 0; i < STEP_N; i++) {
    const h = STEP_H * (i + 1);
    const x = -W / 2 + STEP_T * (i + 0.5);
    box(STEP_T, h, 1.4, stairMat, x, h / 2, stairZ, `treppe_stufe_${i + 1}`);
    box(STEP_T, 0.03, 0.06, copper, x, h + 0.015, stairZ - 0.7, `treppe_kante_${i + 1}`);
  }
  // Rampen-Kollision für die Treppe
  const runLen = STEP_N * STEP_T;
  const rampLen = Math.hypot(runLen, GAL_H);
  const rampAngle = Math.atan2(GAL_H, runLen);
  const rampCol = col('COL_treppe_rampe', rampLen, 0.18, 1.4, -W / 2 + runLen / 2, GAL_H / 2, stairZ);
  rampCol.rotation.z = rampAngle;

  // Geländer der Galerie (Vorderkante + Ostende) und Handlauf der Treppe
  const railY1 = GAL_H + 1.06;
  const railY2 = GAL_H + 0.58;
  box(galW, 0.06, 0.07, railMat, galCX, railY1, GAL_Z0 + 0.05, 'galerie_gelander_oben');
  box(galW, 0.05, 0.05, railMat, galCX, railY2, GAL_Z0 + 0.05, 'galerie_gelander_mitte');
  box(0.07, 0.06, galD, railMat, GAL_X1 - 0.05, railY1, galCZ, 'galerie_gelander_ende_oben');
  box(0.05, 0.05, galD, railMat, GAL_X1 - 0.05, railY2, galCZ, 'galerie_gelander_ende_mitte');
  const posts = [];
  for (let i = 0; i <= 7; i++) posts.push({ x: GAL_X0 + (galW / 7) * i, y: GAL_H + 0.53, z: GAL_Z0 + 0.05 });
  posts.push({ x: GAL_X1 - 0.05, y: GAL_H + 0.53, z: GAL_Z0 + 0.7 });
  posts.push({ x: GAL_X1 - 0.05, y: GAL_H + 0.53, z: GAL_Z1 - 0.2 });
  inst(new THREE.BoxGeometry(0.07, 1.1, 0.07), railMat, posts, 'galerie_gelander_pfosten');

  const handrail = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.06, 0.07), railMat);
  handrail.name = 'treppe_handlauf';
  handrail.position.set(-W / 2 + runLen / 2, GAL_H / 2 + 1.0, stairZ - 0.7);
  handrail.rotation.z = rampAngle;
  root.add(handrail);
  const handPosts = [];
  for (let i = 0; i <= 3; i++) {
    const t = (i + 0.5) / 4;
    handPosts.push({ x: -W / 2 + runLen * t, y: 0.3 * (i + 1) / 2 + 0.5, z: stairZ - 0.7 });
  }
  inst(new THREE.BoxGeometry(0.06, 1.0, 0.06), railMat, handPosts, 'treppe_handlauf_pfosten');

  // ---------------------------------------------------------------- Decken
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke_hauptplatte');
  const coffers = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 8; j++) {
      coffers.push({ x: -4.8 + i * 1.2, y: H - 0.02, z: -4.2 + j * 1.2 });
    }
  }
  inst(new THREE.BoxGeometry(1.02, 0.05, 1.02), wallDark, coffers, 'decke_kassetten');
  for (const s of [-1, 1]) {
    box(0.09, 0.05, D - 1.0, lineGlow, s * 3.6, H - 0.06, 0, 'decke_lichtband');
    box(0.06, 0.05, D - 1.0, glowMat, s * 2.4, H - 0.06, 0, 'decke_lichtband');
  }
  box(W - 1.0, 0.05, 0.09, lineGlow, 0, H - 0.06, 0, 'decke_lichtband_mitte');

  // ---------------------------------------------------------------- Türportale (Zarge 3,34 × 3,74)
  const portal = (cx, cz, ry, name) => {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.rotation.y = ry;
    g.name = name;
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.47, DOOR_H, 0.34), doorMat);
    postL.position.set(-1.435, DOOR_H / 2, 0);
    const postR = postL.clone(); postR.position.x = 1.435;
    const head = new THREE.Mesh(new THREE.BoxGeometry(3.34, 0.74, 0.34), doorMat);
    head.position.set(0, DOOR_H + 0.37, 0);
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.07, DOOR_H, 0.38), copper);
    trimL.position.set(-1.235, DOOR_H / 2, 0);
    const trimR = trimL.clone(); trimR.position.x = 1.235;
    const trimT = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 0.38), copper);
    trimT.position.set(0, DOOR_H + 0.035, 0);
    g.add(postL, postR, head, trimL, trimR, trimT);
    root.add(g);
  };
  portal(0, -D / 2 - T / 2, 0, 'tuerzarge_sued');
  portal(W / 2 + T / 2, eastDoorZ, Math.PI / 2, 'tuerzarge_ost');

  // ---------------------------------------------------------------- Objektplätze / Türen
  // OBJ-036 Primärer Energieverteiler-Knoten (6,40 × 3,60 × 1,48 m), Wandobjekt an der Westwand,
  // Rückseite an der Wandinnenfläche x = −6,0, Vorderseite (+Z) zeigt in den Raum (+X).
  empty('PLACE_OBJ-036', -W / 2, 0, 0, Math.PI / 2);
  // OBJ-046 Trägheitsdämpfer-Hauptmatrix (1,95 × 3,00 × 0,81 m), Standobjekt, Front (−X) zur Mitte.
  empty('PLACE_OBJ-046', 2.6, 0, 1.2, -Math.PI / 2);

  // Antiker-Schiebetüren in jeder Öffnung (Ursprung in der Wandmitte, +Z in den Raum).
  empty('PLACE_OBJ-091', 0, 0, -D / 2 - T / 2, 0);
  empty('PLACE_OBJ-091_2', W / 2 + T / 2, 0, eastDoorZ, -Math.PI / 2);

  // Raumgraph-Anschlüsse (rotation.y zeigt nach außen).
  empty('DOOR_haupt', 0, 0, -D / 2 - T / 2, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-049 – technischer Korridor / Hauptverteilung', raum: 'ATL-049',
  });
  empty('DOOR_ost', W / 2 + T / 2, 0, eastDoorZ, Math.PI / 2, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-049 – östlicher Wartungsgang', raum: 'ATL-049',
  });

  // ---------------------------------------------------------------- Licht
  const lampPos = [
    [-4.2, -2.6], [4.2, -2.6], [-4.2, 2.6], [4.2, 2.6],
    [0, -3.2], [0, 3.4], [0, -0.4], [0, 4.6],
  ];
  lampPos.forEach(([x, z], i) => {
    empty(`LAMP_${i + 1}`, x, H - 0.45, z, 0, { color: '#8fc9ff', intensity: 9, distance: 13 });
  });

  // ---------------------------------------------------------------- Kollision
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);

  // ---------------------------------------------------------------- Animation / API
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.45 + Math.sin(t * 0.6) * 0.16;
  };

  root.userData.raum = {
    id: 'ATL-037',
    breite: W, tiefe: D, hoehe: H, flaeche: +(W * D).toFixed(1),
  };
  root.userData.api = {
    getBeleuchtung: () => lampPos.length,
    getTueren: () => ['DOOR_haupt', 'DOOR_ost'],
    getObjektPlaetze: () => ['PLACE_OBJ-036', 'PLACE_OBJ-046', 'PLACE_OBJ-091', 'PLACE_OBJ-091_2'],
    getRelaisWand: () => 'Nord- und Ostwand sowie Südwand, Relaisfelder im 1,2-m-Raster',
    getKabeltrassen: () => 'umlaufend, Oberkante 3,05 m, zusätzlich Bodenkanäle',
    getGalerie: () => `Servicegalerie Nord, Höhe ${GAL_H.toFixed(2)} m, Treppe West`,
  };

  return root;
}

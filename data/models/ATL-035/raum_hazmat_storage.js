// Raum ATL-035: HAZMAT-Lager / Gefahrstofflager (South Pier, Etage 2).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Hülle: nur Architektur (chemikalienbeständige Beschichtung, Auffangwannen,
// Wandpaneele, Lichtschlitze, Pfeiler, abgehängte Decke). Möbel/Geräte (Sicherheits-
// schränke, Dekontaminationsdusche, Schutzanzug-Halterungen) werden später als
// fertige Objekte an den PLACE_-Punkten eingesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_hazmat_storage',
  art: 'Raum (technisch)',
  masse: '9,6 m × 7,2 m (ca. 69 m²) × 3,8 m Bauhöhe (abgehängte Felder auf 3,3 m)',
  wohin: 'South Pier, Etage 2 – Gefahrstoff-/Naquadah-Sicherheitslager',
  benutzen:
    'Sicherheitsschränke, Dekontaminationsdusche/Notdusche und Schutzanzug-Halterungen werden als fertige Objekte an den PLACE_-Punkten bzw. im Dekontaminationsbereich eingesetzt; Auffangwannen, Entwässerungsrinne, Beschichtung und Warnmarkierungen sind feste Architektur.',
  lichter: '6 LAMP_ (eisblau, technisch), Decken-Lichtfelder und Wand-Lichtschlitze pulsierend, Bernstein-Akzent über den Auffangwannen',
  animation: 'Decken-Lichtfelder und Wand-Lichtschlitze atmen langsam; Warnlicht-Aktion dimmt die Felder',
  quelle: 'selbst gebaut nach Auftragsbeschreibung und Referenzbild HAZMAT-Lager (Quellenklasse B)',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_hazmat_storage';

  const W = 9.6, D = 7.2, H = 3.8, T = 0.3;
  const hx = W / 2, hz = D / 2;
  const DOOR_W = 2.4, DOOR_H = 3.0;
  const WALL_H = H; // Bauhöhe (Türzarge 3,74 m passt vollständig)

  // Auffangwannen (Aussparungen im Boden)
  const basins = [
    { x0: -4.2, x1: -1.2, z0: 0.6, z1: 2.4 },
    { x0: 1.2, x1: 4.2, z0: -2.4, z1: -0.6 },
  ];

  // ------------------------------------------------------------------ Materialien
  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');
  const matCoating = new THREE.MeshStandardMaterial({
    name: 'chem_beschichtung', color: 0x31464a, roughness: 0.84, metalness: 0.14,
  });
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, roughness: 0.45, metalness: 0.6,
  });
  const matHazard = new THREE.MeshStandardMaterial({
    name: 'warn_gelb', color: 0xd2a02a, roughness: 0.5, metalness: 0.25,
  });
  const matHazardDark = new THREE.MeshStandardMaterial({
    name: 'warn_schwarz', color: 0x1b2226, roughness: 0.65, metalness: 0.2,
  });
  const matSlot = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xdff4ff, emissive: 0x6fb9e8, emissiveIntensity: 1.5, roughness: 0.4,
  });
  const matSlotAmber = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz_warn', color: 0xffe0b0, emissive: 0xffb257, emissiveIntensity: 1.5, roughness: 0.4,
  });
  const matField = new THREE.MeshStandardMaterial({
    name: 'decken_lichtfeld', color: 0xbfdcf5, emissive: 0x5aa6d8, emissiveIntensity: 1.35, roughness: 0.35,
  });

  // ------------------------------------------------------------------ Hilfsfunktionen
  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const empty = (name, x, y, z, rotY = 0, userData = null) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };
  const instanced = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
    const o = new THREE.Object3D();
    list.forEach((it, i) => {
      o.position.set(it.p[0], it.p[1], it.p[2]);
      o.rotation.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0);
      o.scale.set(it.s ? it.s[0] : 1, it.s ? it.s[1] : 1, it.s ? it.s[2] : 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };
  const subtractIntervals = (base, cuts) => {
    let parts = [base];
    for (const c of cuts) {
      const next = [];
      for (const p of parts) {
        if (c[1] <= p[0] || c[0] >= p[1]) { next.push(p); continue; }
        if (c[0] > p[0]) next.push([p[0], c[0]]);
        if (c[1] < p[1]) next.push([c[1], p[1]]);
      }
      parts = next;
    }
    return parts.filter((p) => p[1] - p[0] > 0.02);
  };

  // ------------------------------------------------------------------ Boden (mit Aussparungen für die Wannen)
  const floorRects = [
    [-1.2, 1.2, -3.6, 3.6],
    [-4.8, -1.2, -3.6, 0.6],
    [-4.8, -4.2, 0.6, 3.6],
    [-4.2, -1.2, 2.4, 3.6],
    [1.2, 4.8, -3.6, -2.4],
    [4.2, 4.8, -2.4, 3.6],
    [1.2, 4.2, -0.6, 3.6],
  ];
  floorRects.forEach(([x0, x1, z0, z1], i) => {
    box(x1 - x0, 0.1, z1 - z0, matFloor, (x0 + x1) / 2, -0.05, (z0 + z1) / 2, `boden_${i + 1}`);
  });

  // chemikalienbeständige Beschichtung: Schutzbelag im Eingangs-/Dekontaminationsbereich
  box(2.4, 0.016, 1.2, matCoating, 0, 0.008, -3.0, 'boden_beschichtung_dekon');
  box(2.4, 0.02, 0.06, matCopper, 0, 0.01, -2.38, 'boden_beschichtung_kante');

  // Entwässerungsrinne im Dekontaminationsbereich (feste Architektur)
  box(2.2, 0.05, 0.3, matHazardDark, 0, -0.02, -2.62, 'dekon_rinne');
  const grateBars = [];
  for (let x = -1.05; x <= 1.05; x += 0.15) grateBars.push({ p: [x, 0.012, -2.62] });
  instanced(new THREE.BoxGeometry(0.05, 0.02, 0.28), matRail, grateBars, 'dekon_rinne_gitter');

  // Auffangwannen: Becken, Randbord, Warnmarkierung, Auffahrtrampe
  const hazardYellow = [], hazardDark = [];
  for (const b of basins) {
    const bw = b.x1 - b.x0, bd = b.z1 - b.z0;
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    box(bw, 0.06, bd, matCoating, cx, -0.25, cz, 'auffangwanne_boden');
    box(0.06, 0.25, bd, matCoating, b.x0 + 0.03, -0.125, cz, 'auffangwanne_wand');
    box(0.06, 0.25, bd, matCoating, b.x1 - 0.03, -0.125, cz, 'auffangwanne_wand');
    box(bw, 0.25, 0.06, matCoating, cx, -0.125, b.z0 + 0.03, 'auffangwanne_wand');
    box(bw, 0.25, 0.06, matCoating, cx, -0.125, b.z1 - 0.03, 'auffangwanne_wand');
    // Randbord
    const curb = 0.08, ch = 0.12;
    box(bw + 2 * curb, ch, curb, matWallDark, cx, ch / 2, b.z0 - curb / 2, 'wanne_bord');
    box(bw + 2 * curb, ch, curb, matWallDark, cx, ch / 2, b.z1 + curb / 2, 'wanne_bord');
    box(curb, ch, bd, matWallDark, b.x0 - curb / 2, ch / 2, cz, 'wanne_bord');
    box(curb, ch, bd, matWallDark, b.x1 + curb / 2, ch / 2, cz, 'wanne_bord');
    // gelb-schwarze Warnmarkierung entlang der Bordkante
    const step = 0.42;
    let flip = 0;
    for (let x = b.x0; x < b.x1 - 0.05; x += step) {
      const mk = (p) => (flip++ % 2 === 0 ? hazardYellow : hazardDark).push({ p });
      mk([x + step / 2, 0.01, b.z0 - curb - 0.09]);
      mk([x + step / 2, 0.01, b.z1 + curb + 0.09]);
    }
    for (let z = b.z0; z < b.z1 - 0.05; z += step) {
      const mk = (p) => (flip++ % 2 === 0 ? hazardYellow : hazardDark).push({ p });
      mk([b.x0 - curb - 0.09, 0.01, z + step / 2]);
      mk([b.x1 + curb + 0.09, 0.01, z + step / 2]);
    }
    // Auffahrtrampe in die Wanne (0,25 m Höhenunterschied)
    const rampL = 1.0, rampW = 0.9, drop = 0.25;
    const ang = Math.atan2(drop, rampL);
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.08, rampL * 1.08), matRail);
    ramp.position.set(cx - 0.8, -drop / 2, b.z0 + rampL / 2 - 0.05);
    ramp.rotation.x = ang;
    ramp.name = 'auffangwanne_rampe';
    root.add(ramp);
    const cr = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.14, rampL * 1.08));
    cr.name = 'COL_auffangwanne_rampe';
    cr.position.copy(ramp.position);
    cr.rotation.copy(ramp.rotation);
    cr.visible = false;
    root.add(cr);
  }
  instanced(new THREE.BoxGeometry(0.28, 0.012, 0.09), matHazard, hazardYellow, 'warnmarkierung_gelb');
  instanced(new THREE.BoxGeometry(0.28, 0.012, 0.09), matHazardDark, hazardDark, 'warnmarkierung_schwarz');

  // Bodenfugen (Raster 1,2 m), Aussparungen berücksichtigt
  const seamH = [], seamV = [];
  for (const z of [-2.4, -1.2, 0, 1.2, 2.4]) {
    const cuts = basins.filter((b) => z > b.z0 + 0.05 && z < b.z1 - 0.05).map((b) => [b.x0, b.x1]);
    for (const [a, c] of subtractIntervals([-hx, hx], cuts)) {
      seamH.push({ p: [(a + c) / 2, 0.005, z], s: [c - a, 1, 1] });
    }
  }
  for (const x of [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6]) {
    const cuts = basins.filter((b) => x > b.x0 + 0.05 && x < b.x1 - 0.05).map((b) => [b.z0, b.z1]);
    for (const [a, c] of subtractIntervals([-hz, hz], cuts)) {
      seamV.push({ p: [x, 0.005, (a + c) / 2], s: [1, 1, c - a] });
    }
  }
  instanced(new THREE.BoxGeometry(1, 0.006, 0.022), matCopper, seamH, 'bodenfugen_x');
  instanced(new THREE.BoxGeometry(0.022, 0.006, 1), matCopper, seamV, 'bodenfugen_z');

  // Patina-Rand um den Boden
  box(W - 0.3, 0.012, 0.2, matPatina, 0, 0.006, hz - 0.1, 'boden_rand');
  box(W - 0.3, 0.012, 0.2, matPatina, 0, 0.006, -hz + 0.1, 'boden_rand');
  box(0.2, 0.012, D - 0.3, matPatina, -hx + 0.1, 0.006, 0, 'boden_rand');
  box(0.2, 0.012, D - 0.3, matPatina, hx - 0.1, 0.006, 0, 'boden_rand');

  // Schneeflocken-Intarsie in der Bodenmitte (flache Intarsie, rund zulässig)
  const flake = [];
  const addFlake = (cx, cy, cz, horizontal) => {
    const arms = [0, 60, 120, 180, 240, 300];
    for (const a of arms) {
      const rad = (a * Math.PI) / 180;
      const dx = Math.sin(rad), dz = Math.cos(rad);
      const len = 0.34;
      if (horizontal) {
        flake.push({ p: [cx + dx * len, cy, cz + dz * len], r: [0, a, 0] });
        for (const s of [-1, 1]) {
          const ba = ((a + s * 60) * Math.PI) / 180;
          flake.push({
            p: [cx + dx * len * 0.62 + Math.sin(ba) * 0.11, cy, cz + dz * len * 0.62 + Math.cos(ba) * 0.11],
            r: [0, a + s * 60, 0],
            s: [0.7, 1, 0.7],
          });
        }
      } else {
        flake.push({ p: [cx + dx * len, cy + dz * len, cz], r: [0, 0, -a] });
        for (const s of [-1, 1]) {
          const ba = ((a + s * 60) * Math.PI) / 180;
          flake.push({
            p: [cx + dx * len * 0.62 + Math.sin(ba) * 0.11, cy + dz * len * 0.62 + Math.cos(ba) * 0.11, cz],
            r: [0, 0, -(a + s * 60)],
            s: [0.7, 0.7, 1],
          });
        }
      }
    }
  };
  addFlake(0, 0.009, 0, true);
  instanced(new THREE.BoxGeometry(0.045, 0.01, 0.34), matCopper, flake, 'boden_schneeflocke');

  // ------------------------------------------------------------------ Wände
  const sideW = hx - DOOR_W / 2 + T; // 3,9 m Wandfläche je Seite der Türöffnung
  box(sideW, WALL_H, T, matWall, -(DOOR_W / 2 + sideW / 2), WALL_H / 2, -(hz + T / 2), 'wand_front_links');
  box(sideW, WALL_H, T, matWall, (DOOR_W / 2 + sideW / 2), WALL_H / 2, -(hz + T / 2), 'wand_front_rechts');
  box(DOOR_W, WALL_H - DOOR_H, T, matWall, 0, DOOR_H + (WALL_H - DOOR_H) / 2, -(hz + T / 2), 'wand_front_sturz');
  box(W + 2 * T, WALL_H, T, matWall, 0, WALL_H / 2, hz + T / 2, 'wand_hinten');
  box(T, WALL_H, D, matWall, -(hx + T / 2), WALL_H / 2, 0, 'wand_links');
  box(T, WALL_H, D, matWall, (hx + T / 2), WALL_H / 2, 0, 'wand_rechts');

  // Chemikalienbeständige Sockelbeschichtung (0,9 m) auf allen Wandsegmenten
  const coatH = 0.9;
  box(sideW, coatH, 0.05, matCoating, -(DOOR_W / 2 + sideW / 2), coatH / 2, -hz + 0.025, 'wand_beschichtung');
  box(sideW, coatH, 0.05, matCoating, (DOOR_W / 2 + sideW / 2), coatH / 2, -hz + 0.025, 'wand_beschichtung');
  box(W, coatH, 0.05, matCoating, 0, coatH / 2, hz - 0.025, 'wand_beschichtung');
  box(0.05, coatH, D, matCoating, -hx + 0.025, coatH / 2, 0, 'wand_beschichtung');
  box(0.05, coatH, D, matCoating, hx - 0.025, coatH / 2, 0, 'wand_beschichtung');

  // Sockelleisten und Gesimse
  box(hx - DOOR_W / 2, 0.15, 0.05, matCopper, -(DOOR_W / 2 + (hx - DOOR_W / 2) / 2), 0.075, -hz + 0.025, 'sockel');
  box(hx - DOOR_W / 2, 0.15, 0.05, matCopper, (DOOR_W / 2 + (hx - DOOR_W / 2) / 2), 0.075, -hz + 0.025, 'sockel');
  box(W, 0.15, 0.05, matCopper, 0, 0.075, hz - 0.025, 'sockel');
  box(0.05, 0.15, D, matCopper, -hx + 0.025, 0.075, 0, 'sockel');
  box(0.05, 0.15, D, matCopper, hx - 0.025, 0.075, 0, 'sockel');
  box(DOOR_W, 0.1, 0.06, matCopper, 0, WALL_H - 0.05, -hz + 0.03, 'gesims');
  box(W, 0.1, 0.06, matCopper, 0, WALL_H - 0.05, hz - 0.03, 'gesims');
  box(0.06, 0.1, D, matCopper, -hx + 0.03, WALL_H - 0.05, 0, 'gesims');
  box(0.06, 0.1, D, matCopper, hx - 0.03, WALL_H - 0.05, 0, 'gesims');

  // Türzarge (Bronze, deckt Öffnungsränder)
  box(DOOR_W + 0.24, 0.14, 0.08, matCopper, 0, DOOR_H, -hz + 0.04, 'tuer_einfassung');
  box(0.12, DOOR_H, 0.08, matCopper, -(DOOR_W / 2 + 0.06), DOOR_H / 2, -hz + 0.04, 'tuer_einfassung');
  box(0.12, DOOR_H, 0.08, matCopper, (DOOR_W / 2 + 0.06), DOOR_H / 2, -hz + 0.04, 'tuer_einfassung');
  box(DOOR_W + 0.3, 0.04, 0.14, matRail, 0, 0.02, -hz - 0.02, 'tuer_schwelle');

  // ------------------------------------------------------------------ Wandpaneele und Lichtschlitze
  const panelsX = [], framesX = [], slotsX = [], slotsXA = [];
  const panelsZ = [], framesZ = [], slotsZ = [], slotsZA = [];
  const addPanelX = (x, z, sign) => {
    panelsX.push({ p: [x, 1.7, z] });
    framesX.push({ p: [x + sign * 0.02, 1.7, z] });
  };
  const addSlotX = (x, z, sign, amber = false) => {
    const target = amber ? slotsXA : slotsX;
    for (let k = 0; k < 4; k++) target.push({ p: [x + sign * 0.012, 1.25 + k * 0.45, z] });
  };
  const addPanelZ = (x, z, sign) => {
    panelsZ.push({ p: [x, 1.7, z] });
    framesZ.push({ p: [x, 1.7, z + sign * 0.02] });
  };
  const addSlotZ = (x, z, sign, amber = false) => {
    const target = amber ? slotsZA : slotsZ;
    for (let k = 0; k < 4; k++) target.push({ p: [x, 1.25 + k * 0.45, z + sign * 0.012] });
  };

  // Rückwand: durchgehende Paneele
  for (const x of [-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2]) addPanelZ(x, hz - 0.02, -1);
  // Frontwand: Paneele neben der Tür
  for (const x of [-4.2, -3.0, -1.8, 1.8, 3.0, 4.2]) addPanelZ(x, -hz + 0.02, 1);
  // Linke Wand: freie Zonen (Anzüge stehen bei z = -2,7 / -0,6)
  addSlotX(-hx + 0.02, 0.6, 1, true);
  addPanelX(-hx + 0.02, 1.8, 1);
  addSlotX(-hx + 0.02, 3.0, 1, true);
  // Rechte Wand: Halonsystem belegt z = 0,17 … 3,03
  addPanelX(hx - 0.02, -3.0, -1);
  addSlotX(hx - 0.02, -1.8, -1);
  addSlotX(hx - 0.02, -0.6, -1, true);

  instanced(new THREE.BoxGeometry(0.04, 2.6, 1.0), matWallDark, panelsX, 'paneele_x');
  instanced(new THREE.BoxGeometry(0.06, 2.75, 1.12), matCopper, framesX, 'paneel_rahmen_x');
  instanced(new THREE.BoxGeometry(0.03, 0.3, 0.06), matSlot, slotsX, 'lichtschlitze_x');
  instanced(new THREE.BoxGeometry(0.03, 0.3, 0.06), matSlotAmber, slotsXA, 'lichtschlitze_warn_x');
  instanced(new THREE.BoxGeometry(1.0, 2.6, 0.04), matWallDark, panelsZ, 'paneele_z');
  instanced(new THREE.BoxGeometry(1.12, 2.75, 0.06), matCopper, framesZ, 'paneel_rahmen_z');
  instanced(new THREE.BoxGeometry(0.06, 0.3, 0.03), matSlot, slotsZ, 'lichtschlitze_z');
  instanced(new THREE.BoxGeometry(0.06, 0.3, 0.03), matSlotAmber, slotsZA, 'lichtschlitze_warn_z');

  // Wand-Lineament: Schneeflocken-Motiv auf der Rückwand
  const wallFlake = [];
  const addWallFlake = (cx, cy, cz) => {
    const arms = [0, 60, 120, 180, 240, 300];
    for (const a of arms) {
      const rad = (a * Math.PI) / 180;
      const dx = Math.sin(rad), dy = Math.cos(rad);
      wallFlake.push({ p: [cx + dx * 0.3, cy + dy * 0.3, cz], r: [0, 0, -a] });
      for (const s of [-1, 1]) {
        const ba = ((a + s * 60) * Math.PI) / 180;
        wallFlake.push({
          p: [cx + dx * 0.18 + Math.sin(ba) * 0.1, cy + dy * 0.18 + Math.cos(ba) * 0.1, cz],
          r: [0, 0, -(a + s * 60)],
          s: [0.7, 0.7, 1],
        });
      }
    }
  };
  for (const x of [-0.6, 1.8, 3.0]) addWallFlake(x, 1.7, hz - 0.045);
  instanced(new THREE.BoxGeometry(0.04, 0.3, 0.02), matCopper, wallFlake, 'wand_schneeflocke');

  // ------------------------------------------------------------------ Pfeiler (leicht schräg, Perlgrau)
  const pillarList = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    pillarList.push({ p: [sx * (hx - 0.22), (WALL_H - 0.25) / 2, sz * (hz - 0.22)], r: [0, 0, sx * sz * 0.04] });
  }
  instanced(new THREE.BoxGeometry(0.26, WALL_H - 0.25, 0.26), matPillar, pillarList, 'pfeiler');
  const collarList = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    collarList.push({ p: [sx * (hx - 0.22), 0.16, sz * (hz - 0.22)] });
    collarList.push({ p: [sx * (hx - 0.22), 2.6, sz * (hz - 0.22)] });
  }
  instanced(new THREE.BoxGeometry(0.34, 0.12, 0.34), matCopper, collarList, 'pfeiler_kragen');

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, matCeiling, 0, WALL_H + 0.15, 0, 'decke_haupt');
  // abgehängte Felder (sichtbare Höhe ca. 3,3 m)
  const hangList = [];
  for (const x of [-3.6, -1.8, 0, 1.8, 3.6]) for (const z of [-2.4, 0, 2.4]) {
    hangList.push({ p: [x, 3.42, z] });
  }
  instanced(new THREE.BoxGeometry(1.6, 0.12, 2.2), matWallDark, hangList, 'decke_abhaengung');
  const fieldList = [];
  for (const x of [-2.4, 0, 2.4]) for (const z of [-1.8, 1.8]) {
    fieldList.push({ p: [x, 3.33, z] });
  }
  const fieldMesh = instanced(new THREE.BoxGeometry(1.8, 0.04, 0.9), matField, fieldList, 'decke_lichtfelder');
  const beamList = [];
  for (const z of [-3.0, -1.2, 0.6, 2.4]) beamList.push({ p: [0, 3.34, z] });
  instanced(new THREE.BoxGeometry(W - 0.2, 0.08, 0.1), matCopper, beamList, 'decke_traeger');
  const beamList2 = [];
  for (const x of [-3.6, -1.8, 0, 1.8, 3.6]) beamList2.push({ p: [x, 3.36, 0] });
  instanced(new THREE.BoxGeometry(0.1, 0.08, D - 0.2), matCopper, beamList2, 'decke_traeger');
  box(0.08, 0.05, D - 0.2, matGlow, -hx + 0.12, 3.5, 0, 'decke_lichtband');
  box(0.08, 0.05, D - 0.2, matGlow, hx - 0.12, 3.5, 0, 'decke_lichtband');
  box(W - 0.2, 0.05, 0.08, matGlow, 0, 3.5, -hz + 0.12, 'decke_lichtband');

  // ------------------------------------------------------------------ Tür, Anschlüsse, Objektplätze
  empty('DOOR_haupteingang', 0, 0, -(hz + T / 2), Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Süd-Korridor (South Pier)', raum: 'ATL-049',
  });
  empty('PLACE_OBJ-091', 0, 0, -(hz + T / 2), 0); // Antiker-Schiebetür, +Z zeigt in den Raum

  // Halon-Feuerlöschsystem (Wandobjekt B 2,86 × H 2,77 × T 0,62) an der rechten Wand
  empty('PLACE_OBJ-035', hx - 0.31, 0, 1.6, -Math.PI / 2);

  // Antiker Druckanzug / Raumanzug (Standobjekt B 1,13 × H 2,11 × T 1,02) an der linken Wand
  empty('PLACE_OBJ-057', -hx + 0.51, 0, -0.6, Math.PI / 2);
  empty('PLACE_OBJ-057_2', -hx + 0.51, 0, -2.7, Math.PI / 2);

  // Chemische Knicklichter / Notleuchtstäbe (Kleinobjekt 0,02 × 0,15 × 0,02)
  const stickPos = [
    [-4.55, -3.25], [4.55, -3.25], [-4.55, 3.25], [4.55, 3.25], [-0.9, 3.3],
  ];
  stickPos.forEach(([x, z], i) => {
    empty(i === 0 ? 'PLACE_OBJ-086' : `PLACE_OBJ-086_${i + 1}`, x, 0, z, i * 0.7);
  });

  // ------------------------------------------------------------------ Lichter
  const lampDefs = [
    [0, 3.05, -2.7], [0, 3.05, 2.7], [-3.2, 3.05, 0], [3.2, 3.05, 0],
    [0, 3.05, 0], [0, 2.9, -3.25],
  ];
  lampDefs.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#8fc8ff', intensity: 8, distance: 9 });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };
  floorRects.forEach(([x0, x1, z0, z1], i) => {
    col(`COL_boden_${i + 1}`, x1 - x0, 0.2, z1 - z0, (x0 + x1) / 2, -0.1, (z0 + z1) / 2);
  });
  basins.forEach((b, i) => {
    col(`COL_auffangwanne_boden_${i + 1}`, b.x1 - b.x0, 0.12, b.z1 - b.z0,
      (b.x0 + b.x1) / 2, -0.28, (b.z0 + b.z1) / 2);
  });
  col('COL_wand_front_links', sideW, WALL_H, T, -(DOOR_W / 2 + sideW / 2), WALL_H / 2, -(hz + T / 2));
  col('COL_wand_front_rechts', sideW, WALL_H, T, (DOOR_W / 2 + sideW / 2), WALL_H / 2, -(hz + T / 2));
  col('COL_wand_front_sturz', DOOR_W, WALL_H - DOOR_H, T, 0, DOOR_H + (WALL_H - DOOR_H) / 2, -(hz + T / 2));
  col('COL_wand_hinten', W + 2 * T, WALL_H, T, 0, WALL_H / 2, hz + T / 2);
  col('COL_wand_links', T, WALL_H, D, -(hx + T / 2), WALL_H / 2, 0);
  col('COL_wand_rechts', T, WALL_H, D, (hx + T / 2), WALL_H / 2, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, WALL_H + 0.15, 0);
  let pIdx = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    pIdx++;
    col(`COL_pfeiler_${pIdx}`, 0.32, WALL_H, 0.32, sx * (hx - 0.22), WALL_H / 2, sz * (hz - 0.22));
  }

  // ------------------------------------------------------------------ Animation & API
  let t = 0, last = null, dim = 1;
  const pulse = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    matField.emissiveIntensity = (1.35 + Math.sin(t * 0.7) * 0.16) * dim;
    matSlot.emissiveIntensity = (1.5 + Math.sin(t * 0.9 + 1.1) * 0.14) * dim;
    matSlotAmber.emissiveIntensity = (1.5 + Math.sin(t * 1.1 + 2.2) * 0.18) * dim;
  };
  fieldMesh.onBeforeRender = pulse;

  const api = {
    setLicht: (v) => {
      dim = Math.max(0.15, Math.min(1, v));
      matField.emissiveIntensity = 1.35 * dim;
      matSlot.emissiveIntensity = 1.5 * dim;
      matSlotAmber.emissiveIntensity = 1.5 * dim;
    },
    getLicht: () => dim,
    pulsieren: () => { last = null; },
  };
  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'hazmat_licht_dimmen',
      label: 'Beleuchtung des Lagers dimmen',
      run: () => { api.setLicht(api.getLicht() > 0.4 ? 0.25 : 1); return true; },
    },
  ];
  root.userData.raum = { id: 'ATL-035', breite: W, tiefe: D, hoehe: H, typ: 'technisch' };
  return root;
}

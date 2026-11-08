// Raum ATL-034: Ladungshalt / Cargo Hold (South Pier, Etage 2)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Hülle: nur Architektur (Boden, Wände, Decke, Tore, Deckenlaufkran, Markierungen).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_cargo_hold',
  art: 'Raum',
  masse: '25,0 m × 20,0 m Grundfläche (ca. 500 m²), 7,0 m lichte Höhe',
  wohin: 'South Pier, Etage 2 – technischer Ladungsbereich der Expedition',
  benutzen: 'keine (Frachtterminal, Hubwagen und Expeditionskisten werden als fertige Objekte an den PLACE_-Punkten eingesetzt)',
  lichter: '6 LAMP_-Punkte (eisblau, indirekt über Deckenfeldern), zusätzlich blaue Wand-Lichtschlitze',
  animation: 'Wand-Lichtschlitze und Decken-Lichtbänder atmen subtil',
  quelle: 'selbst gebaut nach Raumauftrag ATL-034, Referenzbild ref1.jpg (Cargo Hold, South Pier) und Atlantis-Setplänen „Halls & Corridors“',
};

export const varianten = [
  { label: 'Cargo Hold (Standard 25 × 20 m)', opts: {} },
  { label: 'Cargo Hold (kompakt 20 × 15 m)', opts: { laenge: 20, breite: 15 } },
];

const T = 0.3;          // Wanddicke
const H = 7.0;          // lichte Raumhöhe
const DOOR_W = 2.4;    // Toröffnungsbreite
const DOOR_H = 3.0;    // Toröffnungshöhe

export function create(opts = {}) {
  const W = opts.breite ?? 25.0;   // X-Ausdehnung (innen)
  const L = opts.laenge ?? 20.0;   // Z-Ausdehnung (innen)
  const hx = W / 2;
  const hz = L / 2;

  const root = new THREE.Group();
  root.name = 'raum_cargo_hold';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matRail = kit('rail');
  const matGlow = kit('glow');
  const matAmber = kit('amberGlow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.5,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.5,
  });
  const amberLine = new THREE.MeshStandardMaterial({
    name: 'markierung_bernstein', color: 0xffc36a, emissive: 0xffa53c,
    emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.6,
  });
  const paintLine = new THREE.MeshStandardMaterial({
    name: 'markierung_hell', color: 0xd9e6ee, metalness: 0.15, roughness: 0.7,
  });

  const dummy = new THREE.Object3D();

  const addMesh = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const addBox = (w, h, d, mat, x, y, z, name) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  // Instanzen: Einträge [x, y, z, rotY]
  const inst = (geo, mat, list, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, ry], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry || 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
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

  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };

  // ------------------------------------------------------------------ Boden
  addBox(W, 0.1, L, matFloor, 0, -0.05, 0, 'boden');

  // Plattenraster 2,4 m – alle Fugen vollständig innerhalb der Bodenfläche
  const gridX = [], gridZ = [];
  for (let x = -hx + 2.4; x < hx - 1.0; x += 2.4) gridZ.push([x, 0.003, 0, 0]);
  for (let z = -hz + 2.4; z < hz - 1.0; z += 2.4) gridX.push([0, 0.003, z, 0]);
  inst(new THREE.BoxGeometry(0.02, 0.006, L - 0.5), matCopper, gridZ, 'boden_fugen_z');
  inst(new THREE.BoxGeometry(W - 0.5, 0.006, 0.02), matCopper, gridX, 'boden_fugen_x');

  // Grün-kupferner Rand
  addBox(0.22, 0.014, L - 0.44, patina, -hx + 0.11, 0.007, 0, 'boden_rand_links');
  addBox(0.22, 0.014, L - 0.44, patina, hx - 0.11, 0.007, 0, 'boden_rand_rechts');
  addBox(W - 0.44, 0.014, 0.22, patina, 0, 0.007, -hz + 0.11, 'boden_rand_vorne');
  addBox(W - 0.44, 0.014, 0.22, patina, 0, 0.007, hz - 0.11, 'boden_rand_hinten');

  // ------------------------------------------------------------------ Wände
  const panels = [], frames = [], slots = [];

  /**
   * axis 'x': Wand läuft entlang X, c = Z-Koordinate der Wandmitte.
   * axis 'z': Wand läuft entlang Z, c = X-Koordinate der Wandmitte.
   */
  function buildWall(cfg) {
    const { name, axis, c, inward, start, end, openings = [] } = cfg;
    const face = c + inward * (T / 2);
    const sorted = [...openings].sort((a, b) => a.center - b.center);

    // Segmente zwischen Öffnungen
    let u = start;
    const segs = [];
    for (const o of sorted) {
      const a = o.center - o.width / 2;
      const b = o.center + o.width / 2;
      if (a > u + 0.001) segs.push([u, a]);
      u = b;
    }
    if (u < end - 0.001) segs.push([u, end]);

    segs.forEach(([a, b], i) => {
      const len = b - a;
      const uc = (a + b) / 2;
      if (axis === 'x') {
        addBox(len, H, T, matWall, uc, H / 2, c, `${name}_${i}`);
        col(`COL_${name}_${i}`, len, H, T, uc, H / 2, c);
        addBox(len, 0.15, 0.05, matCopper, uc, 0.075, face + inward * 0.025, `${name}_sockel_${i}`);
        addBox(len, 0.1, 0.07, matCopper, uc, H - 0.05, face + inward * 0.035, `${name}_gesims_${i}`);
      } else {
        addBox(T, H, len, matWall, c, H / 2, uc, `${name}_${i}`);
        col(`COL_${name}_${i}`, T, H, len, c, H / 2, uc);
        addBox(0.05, 0.15, len, matCopper, face + inward * 0.025, 0.075, uc, `${name}_sockel_${i}`);
        addBox(0.07, 0.1, len, matCopper, face + inward * 0.035, H - 0.05, uc, `${name}_gesims_${i}`);
      }
    });

    // Stürze über Öffnungen
    sorted.forEach((o, i) => {
      const hh = H - o.height;
      if (axis === 'x') {
        addBox(o.width, hh, T, matWall, o.center, o.height + hh / 2, c, `${name}_sturz_${i}`);
        col(`COL_${name}_sturz_${i}`, o.width, hh, T, o.center, o.height + hh / 2, c);
      } else {
        addBox(T, hh, o.width, matWall, c, o.height + hh / 2, o.center, `${name}_sturz_${i}`);
        col(`COL_${name}_sturz_${i}`, T, hh, o.width, c, o.height + hh / 2, o.center);
      }
    });

    // Paneele und Lichtschlitze im 1,2-m-Raster
    const inOpening = (uc) => sorted.some((o) => Math.abs(uc - o.center) < o.width / 2 + 0.62);
    const ry = axis === 'x' ? 0 : Math.PI / 2;
    for (let p = start + 0.6; p < end - 0.2; p += 1.2) {
      if (inOpening(p)) continue;
      const idx = Math.round((p - start) / 1.2);
      const px = axis === 'x' ? p : face + inward * 0.03;
      const pz = axis === 'x' ? face + inward * 0.03 : p;
      if (idx % 2 === 0) {
        frames.push([px, 1.55, pz, ry]);
        panels.push([axis === 'x' ? p : face + inward * 0.05, 1.55,
          axis === 'x' ? face + inward * 0.05 : p, ry]);
      } else {
        slots.push([axis === 'x' ? p : face + inward * 0.04, 1.62,
          axis === 'x' ? face + inward * 0.04 : p, ry]);
      }
    }
  }

  // Zwei Schwerlasttore an -Z (Hauptseite) mit je ≥1,2 m freier Mauerfläche daneben,
  // ein Seitenzugang an +X.
  const frontOpenings = [
    { center: 0.0, width: DOOR_W, height: DOOR_H },
    { center: -7.2, width: DOOR_W, height: DOOR_H },
  ];
  const rightOpenings = [
    { center: 4.0, width: DOOR_W, height: DOOR_H },
  ];

  buildWall({ name: 'wand_vorne', axis: 'x', c: -hz - T / 2, inward: 1, start: -hx - T / 2, end: hx + T / 2, openings: frontOpenings });
  buildWall({ name: 'wand_hinten', axis: 'x', c: hz + T / 2, inward: -1, start: -hx - T / 2, end: hx + T / 2, openings: [] });
  buildWall({ name: 'wand_links', axis: 'z', c: -hx - T / 2, inward: 1, start: -hz - T / 2, end: hz + T / 2, openings: [] });
  buildWall({ name: 'wand_rechts', axis: 'z', c: hx + T / 2, inward: -1, start: -hz - T / 2, end: hz + T / 2, openings: rightOpenings });

  inst(new THREE.BoxGeometry(1.12, 2.75, 0.024), matCopper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.0, 2.6, 0.04), matWallDark, panels, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.06, 2.8, 0.03), lineGlow, slots, 'lichtschlitze');

  // Wandfelder in dunkler Tönung als Gegenspiel zu den hellen Paneelen (technischer Charakter)
  const wallBands = [];
  for (let z = -hz + 2.4; z < hz - 1.0; z += 4.8) {
    wallBands.push([-hx + T + 0.02, 3.4, z, Math.PI / 2]);
    wallBands.push([hx - T - 0.02, 3.4, z, Math.PI / 2]);
  }
  inst(new THREE.BoxGeometry(3.6, 3.0, 0.04), matWallDark, wallBands, 'wand_banden');

  // ------------------------------------------------------------------ Freistehende Stützen
  const columnGeo = new THREE.BoxGeometry(0.42, H - 0.2, 0.42);
  const colList = [[-5.0, (H - 0.2) / 2, 0, 0], [5.0, (H - 0.2) / 2, 0, 0]];
  inst(columnGeo, matPillar, colList, 'stuetzen');
  colList.forEach(([x, y, z], i) => col(`COL_stuetze_${i}`, 0.5, H, 0.5, x, H / 2, z));
  colList.forEach(([x, y, z], i) => {
    addBox(0.72, 0.22, 0.72, matCopper, x, H - 0.31, z, `stuetze_kopf_${i}`);
    addBox(0.62, 0.12, 0.62, matCopper, x, 0.06, z, `stuetze_sockel_${i}`);
  });

  // ------------------------------------------------------------------ Bodenmarkierungen
  function bay(x0, x1, z0, z1, name) {
    const t = 0.1, y = 0.008;
    addBox(x1 - x0, 0.014, t, paintLine, (x0 + x1) / 2, y, z0, `markierung_${name}_a`);
    addBox(x1 - x0, 0.014, t, paintLine, (x0 + x1) / 2, y, z1, `markierung_${name}_b`);
    addBox(t, 0.014, z1 - z0, paintLine, x0, y, (z0 + z1) / 2, `markierung_${name}_c`);
    addBox(t, 0.014, z1 - z0, paintLine, x1, y, (z0 + z1) / 2, `markierung_${name}_d`);
    const c = 0.5;
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([px, pz], i) => {
      addBox(c, 0.016, 0.14, amberLine,
        px + (Math.abs(px - x0) < 0.001 ? c / 2 : -c / 2), y + 0.002, pz,
        `markierung_${name}_ecke_${i}`);
    });
  }
  bay(-11.4, -7.6, -7.4, -2.8, 'container_a');
  bay(7.6, 11.4, -7.4, -2.8, 'container_b');
  bay(7.6, 11.4, -1.0, 3.6, 'stapler_c');
  bay(-11.4, -7.6, 1.4, 6.0, 'stapler_d');

  // Zentraler Frachtlaufweg (mindestens 1,2 m, hier 4 m breit) vom Haupttor in die Halle
  addBox(0.1, 0.016, L - 1.2, amberLine, -2.0, 0.009, 0, 'markierung_laufweg_links');
  addBox(0.1, 0.016, L - 1.2, amberLine, 2.0, 0.009, 0, 'markierung_laufweg_rechts');
  // Querstraße zum Seitentor
  addBox(7.0, 0.016, 0.1, amberLine, 8.5, 0.009, 2.9, 'markierung_querstrasse_a');
  addBox(7.0, 0.016, 0.1, amberLine, 8.5, 0.009, 5.1, 'markierung_querstrasse_b');

  // ------------------------------------------------------------------ Decke
  addBox(W + 2 * T, 0.3, L + 2 * T, matCeiling, 0, H + 0.15, 0, 'decke_haupt');

  // Abgehängte Kassettenfelder
  const kass = [];
  for (let x = -hx + 3.0; x < hx - 1.0; x += 4.0) {
    for (let z = -hz + 3.0; z < hz - 1.0; z += 4.0) {
      kass.push([x, H - 0.04, z, 0]);
    }
  }
  inst(new THREE.BoxGeometry(3.2, 0.08, 2.8), matWallDark, kass, 'decke_kassetten');

  // Lichtbänder an den Deckenkanten
  addBox(0.12, 0.05, L - 0.6, matGlow, -hx + 0.4, H - 0.03, 0, 'decke_lichtband_links');
  addBox(0.12, 0.05, L - 0.6, matGlow, hx - 0.4, H - 0.03, 0, 'decke_lichtband_rechts');
  addBox(W - 0.6, 0.05, 0.12, matGlow, 0, H - 0.03, -hz + 0.4, 'decke_lichtband_vorne');
  addBox(W - 0.6, 0.05, 0.12, matGlow, 0, H - 0.03, hz - 0.4, 'decke_lichtband_hinten');

  // ------------------------------------------------------------------ Deckenlaufkran
  const railX = [-6.5, 6.5];
  railX.forEach((x, i) => {
    addBox(0.24, 0.3, L - 1.0, matRail, x, 5.85, 0, `kran_schiene_${i}`);
    for (let z = -hz + 2.0; z < hz - 1.0; z += 4.0) {
      addBox(0.18, 0.85, 0.18, matCopper, x, 6.45, z, `kran_abhaengung_${i}_${Math.round(z * 10)}`);
    }
  });
  addBox(13.8, 0.46, 0.5, matRail, 0, 5.42, 0.8, 'kran_bruecke');
  addBox(13.8, 0.1, 0.16, matCopper, 0, 5.68, 0.8, 'kran_bruecke_leiste');
  addBox(1.2, 0.5, 1.3, matWallDark, 2.2, 4.98, 0.8, 'kran_laufkatze');
  addBox(0.07, 1.05, 0.07, matCopper, 2.2, 4.2, 0.8, 'kran_seil');
  addBox(0.44, 0.4, 0.44, matCopper, 2.2, 3.45, 0.8, 'kran_hakenblock');
  addBox(0.12, 0.9, 0.12, matCopper, 2.2, 2.95, 0.8, 'kran_haken');

  // ------------------------------------------------------------------ Tore / Anschlüsse
  let doorIndex = 0;
  const placeDoor = (name, x, z, outwardRot, inwardRot, ziel, raum) => {
    doorIndex += 1;
    // DOOR_ zeigt nach außen, die Schiebetür (OBJ-091) zeigt mit +Z in den Raum
    empty(`DOOR_${name}`, x, 0, z, outwardRot, { breite: DOOR_W, hoehe: DOOR_H, ziel, raum });
    empty(doorIndex === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${doorIndex}`, x, 0, z, inwardRot);
  };

  placeDoor('eingang_mitte', 0, -hz - T / 2, Math.PI, 0,
    'Süd-Pier Frachtschleuse (Haupttor)', 'ATL-049');
  placeDoor('eingang_schwerlast', -7.2, -hz - T / 2, Math.PI, 0,
    'Süd-Pier Schwerlastrampe', 'ATL-049');
  placeDoor('seite_rechts', hx + T / 2, 4.0, Math.PI / 2, -Math.PI / 2,
    'Seitenkorridor South Pier', 'ATL-049');

  // Tor-Einfassungen (Bronze) an beiden Wandseiten
  const frameFront = (x) => {
    addBox(DOOR_W + 0.24, 0.12, 0.08, matCopper, x, DOOR_H, -hz + 0.04, `tor_einfassung_${x}_oben`);
    addBox(0.12, DOOR_H, 0.08, matCopper, x - DOOR_W / 2 - 0.06, DOOR_H / 2, -hz + 0.04, `tor_einfassung_${x}_links`);
    addBox(0.12, DOOR_H, 0.08, matCopper, x + DOOR_W / 2 + 0.06, DOOR_H / 2, -hz + 0.04, `tor_einfassung_${x}_rechts`);
  };
  frameFront(0);
  frameFront(-7.2);
  addBox(0.08, 0.12, DOOR_W + 0.24, matCopper, hx - 0.04, DOOR_H, 4.0, 'tor_einfassung_seite_oben');
  addBox(0.08, DOOR_H, 0.12, matCopper, hx - 0.04, DOOR_H / 2, 4.0 - DOOR_W / 2 - 0.06, 'tor_einfassung_seite_a');
  addBox(0.08, DOOR_H, 0.12, matCopper, hx - 0.04, DOOR_H / 2, 4.0 + DOOR_W / 2 + 0.06, 'tor_einfassung_seite_b');

  // ------------------------------------------------------------------ Objektplätze
  // Schwerlast-Frachtterminal (6,30 × 2,21 × 4,00 m) an der Rückwand, Vorderseite zum Raum
  empty('PLACE_OBJ-034', 4.6, 0, 7.8, Math.PI);

  // Antigravitations-Hubwagen (1,20 × 1,29 × 1,15 m)
  empty('PLACE_OBJ-079', -3.4, 0, 5.0, 0);
  empty('PLACE_OBJ-079_2', 4.2, 0, 4.2, 0);

  // Transport- und Ausrüstungskisten (0,81 × 0,35 × 0,45 m) im Container-Bay A
  empty('PLACE_OBJ-080', -10.2, 0, -5.0, 0);
  empty('PLACE_OBJ-080_2', -9.2, 0, -5.0, 0);
  empty('PLACE_OBJ-080_3', -10.2, 0, -3.8, 0);
  empty('PLACE_OBJ-080_4', -9.2, 0, -3.8, 0);

  // ------------------------------------------------------------------ Lichter
  const lampPositions = [
    [-9.0, 6.3, -6.0],
    [9.0, 6.3, -6.0],
    [-9.0, 6.3, 4.0],
    [9.0, 6.3, 4.0],
    [0.0, 6.5, -8.0],
    [0.0, 6.5, 6.0],
  ];
  lampPositions.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#9fd8ff', intensity: 9, distance: 20 });
    addBox(1.8, 0.06, 1.0, matGlow, p[0], H - 0.06, p[2], `decke_leuchte_${i + 1}`);
  });

  // ------------------------------------------------------------------ Kollision
  col('COL_boden', W + 2 * T, 0.2, L + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, L + 2 * T, 0, H + 0.15, 0);
  col('COL_kran_bruecke', 13.8, 0.6, 0.6, 0, 5.35, 0.8);

  // ------------------------------------------------------------------ Animation
  let t = 0;
  let last = null;
  const animate = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.45 + Math.sin(t * 0.7) * 0.14;
    matGlow.emissiveIntensity = 1.1 + Math.sin(t * 0.55 + 1.2) * 0.08;
  };
  root.userData.animate = animate;
  root.userData.animation = { typ: 'pulsieren', amplitude: 0.14, intervall: 9 };
  root.onBeforeRender = animate;

  root.userData.raum = {
    id: 'ATL-034',
    breite: W,
    laenge: L,
    hoehe: H,
    dreiecke: 3100,
  };
  return root;
}

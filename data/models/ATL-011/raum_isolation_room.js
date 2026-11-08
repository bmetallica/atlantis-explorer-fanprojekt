// Raum ATL-011: Isolationsraum (Inner City, Etage 4, medizinisch).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte des Zellbodens (Bodenoberkante y = 0).
// Hermetisch versiegelbare Isolationszelle (7,2 × 4,8 m ≈ 35 m², Höhe 3,2 m)
// mit doppelter Druck-/Dekontaminationsschleuse bei −Z und Sichtfenster zur
// Krankenstation an der Seite +X.
//
// Leere Hülle: nur Architektur. Behandlungsbett, Unterdruck-Beatmung,
// Desinfektionsdüsen und Gegensprechanlage werden NICHT gebaut; sie werden
// später als fertige Objekte an den PLACE_-Punkten eingesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_isolation_room',
  art: 'Raum',
  masse: 'Isolationszelle 7,2 m × 4,8 m ≈ 35 m², Deckenhöhe 3,2 m; Dekontaminationsschleuse 4,8 m × 1,95 m bei −Z',
  wohin: 'Inner City, Etage 4, medizinischer Bereich an der Krankenstation',
  benutzen: 'Quarantäne/Versorgung; Behandlungsbett, Unterdruck-Beatmung, Desinfektionsdüsen und Gegensprechanlage werden als fertige Objekte eingesetzt',
  lichter: '5 LAMP_ (eisblau/cyan, indirekt), Lichtschlitze und Deckenfelder pulsierend',
  animation: 'Lichtschlitze und Deckenlichtfelder atmen langsam (Unterdruck-/Reinraum-Indikation)',
  quelle: 'selbst gebaut nach Auftragsbeschreibung ATL-011, Atlantis-Setplänen „Halls & Corridors“ und Screencaps der Quarantäneszenen',
};

const CELL_W = 7.2;        // lichte Breite der Zelle
const CELL_D = 4.8;        // lichte Tiefe der Zelle
const H = 3.2;             // lichte Höhe
const T = 0.3;             // Wanddicke
const DOOR_W = 2.4;
const DOOR_H = 3.0;

const SL_W = 4.8;          // lichte Breite der Schleuse
const SL_Z0 = -4.65;       // Innenfläche der Außenwand der Schleuse
const SL_Z1 = -2.70;       // Außenfläche der Zell-Südwand (Anschluss an die Zelle)
const SL_LEN = SL_Z1 - (SL_Z0 - T);        // 2,25 m Gesamtlänge inkl. Außenwand
const SL_ZC = (SL_Z0 + SL_Z1) / 2;          // Mitte des Schleusenraums

const CELL_OW = CELL_W + 2 * T;             // 7,8 m Außenbreite
const CELL_OD = CELL_D + 2 * T;             // 5,4 m Außentiefe
const SL_OW = SL_W + 2 * T;                 // 5,4 m Außenbreite

// Sichtfenster zur Krankenstation (+X)
const WIN_Z0 = -1.3, WIN_Z1 = 1.3;
const WIN_Y0 = 0.95, WIN_Y1 = 2.45;

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_isolation_room';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glassMat = kit('glass');
  const glowMat = kit('glow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });
  const cyanGlow = new THREE.MeshStandardMaterial({
    name: 'reinraum_leuchte', color: 0xd8f7ff, emissive: 0x63d8ff, emissiveIntensity: 1.35,
  });
  const sealMat = new THREE.MeshStandardMaterial({
    name: 'dichtung', color: 0x1b3a44, metalness: 0.2, roughness: 0.85,
  });

  const dummy = new THREE.Object3D();

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const instanced = (geo, mat, entries, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, entries.length));
    entries.forEach((e, i) => {
      dummy.position.set(e.p[0], e.p[1], e.p[2]);
      dummy.rotation.set(e.r ? e.r[0] : 0, e.r ? e.r[1] : 0, e.r ? e.r[2] : 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = entries.length;
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

  // ================================================================== Boden
  box(CELL_OW, 0.1, CELL_OD, floorMat, 0, -0.05, 0, 'boden_zelle');
  box(SL_OW, 0.1, SL_LEN, floorMat, 0, -0.05, SL_ZC - T / 2, 'boden_schleuse');

  // umlaufender Grün-Kupfer-Rand
  for (const s of [-1, 1]) {
    box(0.22, 0.012, CELL_D, patina, s * (CELL_W / 2 - 0.11), 0.006, 0, 'boden_rand_x');
    box(CELL_W, 0.012, 0.22, patina, 0, 0.006, s * (CELL_D / 2 - 0.11), 'boden_rand_z');
  }
  box(SL_W, 0.012, 0.22, patina, 0, 0.006, SL_Z0 + 0.11, 'boden_rand_schleuse');

  // Bodenfugen im 1,2-m-Raster
  const fugenX = [], fugenZ = [];
  for (let x = -3.6; x <= 3.6 + 0.001; x += 1.2) fugenX.push({ p: [x, 0.004, 0] });
  for (let z = -2.4; z <= 2.4 + 0.001; z += 1.2) fugenZ.push({ p: [0, 0.004, z] });
  instanced(new THREE.BoxGeometry(0.022, 0.008, CELL_D), copper, fugenX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(CELL_W, 0.008, 0.022), copper, fugenZ, 'boden_fugen_z');

  // sechseckige Bodenintarsie (Reinraum-Inspektionsfeld)
  const hexInlay = add(new THREE.CylinderGeometry(1.15, 1.15, 0.014, 6), wallDark, 0, 0.007, 0.35, 'boden_intarsie_sechseck');
  hexInlay.rotation.y = Math.PI / 6;
  const hexRing = add(new THREE.TorusGeometry(1.15, 0.035, 6, 6), copper, 0, 0.012, 0.35, 'boden_intarsie_ring');
  hexRing.rotation.set(Math.PI / 2, 0, Math.PI / 6);

  // Schneeflocken-Intarsie in der Zelle
  const snow = [];
  const R = 1.55;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    snow.push({ p: [0, 0.016, 0.35], r: [0, a, 0] });
    for (const rr of [0.42, 0.78]) {
      for (const side of [-1, 1]) {
        const bx = Math.sin(a) * rr;
        const bz = 0.35 + Math.cos(a) * rr;
        snow.push({ p: [bx, 0.016, bz], r: [0, a + side * Math.PI / 3, 0] });
      }
    }
  }
  instanced(new THREE.BoxGeometry(0.055, 0.012, 0.42), copper, snow, 'boden_schneeflocke');
  const snowHub = add(new THREE.CylinderGeometry(0.16, 0.16, 0.014, 6), copper, 0, 0.016, 0.35, 'boden_schneeflocke_mitte');
  snowHub.rotation.y = Math.PI / 6;

  // Schwellenprofile (flach, hermetische Dichtung)
  box(DOOR_W + 0.2, 0.016, 0.14, copper, 0, 0.008, -CELL_D / 2, 'schwelle_innen');
  box(DOOR_W + 0.2, 0.016, 0.14, copper, 0, 0.008, SL_Z0, 'schwelle_aussen');
  box(DOOR_W - 0.1, 0.012, 0.06, sealMat, 0, 0.012, -CELL_D / 2, 'dichtung_innen');
  box(DOOR_W - 0.1, 0.012, 0.06, sealMat, 0, 0.012, SL_Z0, 'dichtung_aussen');

  // ================================================================== Wände der Zelle
  // Nordwand (+Z)
  box(CELL_OW, H, T, wall, 0, H / 2, CELL_D / 2 + T / 2, 'wand_nord');
  // Westwand (−X)
  box(T, H, CELL_OD, wall, -CELL_W / 2 - T / 2, H / 2, 0, 'wand_west');
  // Südwand (−Z) mit innerer Schleusentür
  const sw = CELL_OW;
  const leftW = (sw - DOOR_W) / 2;
  box(leftW, H, T, wall, -(DOOR_W + leftW) / 2, H / 2, -CELL_D / 2 - T / 2, 'wand_sued_links');
  box(leftW, H, T, wall, (DOOR_W + leftW) / 2, H / 2, -CELL_D / 2 - T / 2, 'wand_sued_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, -CELL_D / 2 - T / 2, 'wand_sued_sturz');

  // Ostwand (+X) mit großem Sichtfenster zur Krankenstation
  const fx = CELL_W / 2 + T / 2;
  box(T, WIN_Y0, CELL_OD, wall, fx, WIN_Y0 / 2, 0, 'wand_ost_unten');
  box(T, H - WIN_Y1, CELL_OD, wall, fx, WIN_Y1 + (H - WIN_Y1) / 2, 0, 'wand_ost_oben');
  const endLen = (CELL_OD - (WIN_Z1 - WIN_Z0)) / 2;
  box(T, WIN_Y1 - WIN_Y0, endLen, wall, fx, (WIN_Y0 + WIN_Y1) / 2, WIN_Z0 - endLen / 2, 'wand_ost_sued');
  box(T, WIN_Y1 - WIN_Y0, endLen, wall, fx, (WIN_Y0 + WIN_Y1) / 2, WIN_Z1 + endLen / 2, 'wand_ost_nord');

  // Fensterrahmen, Sprossen und Glas
  box(0.22, 0.14, WIN_Z1 - WIN_Z0 + 0.3, copper, fx, WIN_Y0 - 0.07, 0, 'fenster_rahmen_unten');
  box(0.22, 0.14, WIN_Z1 - WIN_Z0 + 0.3, copper, fx, WIN_Y1 + 0.07, 0, 'fenster_rahmen_oben');
  for (const s of [-1, 1]) box(0.22, WIN_Y1 - WIN_Y0 + 0.3, 0.14, copper, fx, (WIN_Y0 + WIN_Y1) / 2, s * ((WIN_Z1 - WIN_Z0) / 2 + 0.07), 'fenster_rahmen_seite');
  box(0.06, WIN_Y1 - WIN_Y0, 0.1, copper, fx, (WIN_Y0 + WIN_Y1) / 2, 0, 'fenster_sprosse_mitte');
  box(0.05, WIN_Y1 - WIN_Y0, WIN_Z1 - WIN_Z0, glassMat, fx, (WIN_Y0 + WIN_Y1) / 2, 0, 'fenster_glas_krankenstation');
  // Bronze-Zierfeld unter dem Fenster (Reinraum-Sichtblende)
  box(0.04, 0.34, WIN_Z1 - WIN_Z0 - 0.2, wallDark, CELL_W / 2 - 0.02, WIN_Y0 - 0.3, 0, 'fenster_sichtblende');

  // ================================================================== Dekontaminationsschleuse (−Z)
  for (const s of [-1, 1]) {
    box(T, H, SL_LEN, wall, s * (SL_W / 2 + T / 2), H / 2, SL_ZC - T / 2, s < 0 ? 'wand_schleuse_west' : 'wand_schleuse_ost');
  }
  const slLeft = (SL_OW - DOOR_W) / 2;
  box(slLeft, H, T, wall, -(DOOR_W + slLeft) / 2, H / 2, SL_Z0 - T / 2, 'wand_schleuse_aussen_links');
  box(slLeft, H, T, wall, (DOOR_W + slLeft) / 2, H / 2, SL_Z0 - T / 2, 'wand_schleuse_aussen_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, SL_Z0 - T / 2, 'wand_schleuse_aussen_sturz');

  // ================================================================== Paneele, Lichtschlitze, Sockel, Gesims
  const panelWest = [], frameWest = [], panelNord = [], frameNord = [];
  // Westwand: Paneele nur an den Stirnseiten, Mitte frei für Monitor und Lichtschlitze
  for (const z of [-1.8, 1.8]) {
    panelWest.push({ p: [-CELL_W / 2 + 0.015, 1.45, z] });
    frameWest.push({ p: [-CELL_W / 2 + 0.045, 1.45, z] });
  }
  // Nordwand: Mittelfeld bleibt für den Monitor frei
  for (const x of [-2.4, -1.2, 1.2, 2.4]) {
    panelNord.push({ p: [x, 1.45, CELL_D / 2 - 0.015] });
    frameNord.push({ p: [x, 1.45, CELL_D / 2 - 0.045] });
  }
  instanced(new THREE.BoxGeometry(0.03, 2.4, 1.0), wallDark, panelWest, 'paneele_west');
  instanced(new THREE.BoxGeometry(0.09, 2.6, 1.16), copper, frameWest, 'paneel_rahmen_west');
  instanced(new THREE.BoxGeometry(1.0, 2.4, 0.03), wallDark, panelNord, 'paneele_nord');
  instanced(new THREE.BoxGeometry(1.16, 2.6, 0.09), copper, frameNord, 'paneel_rahmen_nord');

  // senkrechte Lichtschlitze an der Westwand
  const slots = [];
  for (const z of [-1.2, 0, 1.2]) {
    for (let k = 0; k < 4; k++) slots.push({ p: [-CELL_W / 2 + 0.02, 1.05 + k * 0.44, z] });
  }
  const slotMesh = instanced(new THREE.BoxGeometry(0.025, 0.3, 0.06), lineGlow, slots, 'lichtschlitze');

  // Lichtschlitze in der Schleuse (beide Seitenwände)
  const slotsSl = [];
  for (const s of [-1, 1]) {
    for (const z of [SL_Z0 + 0.55, SL_Z0 + 1.35]) {
      for (let k = 0; k < 3; k++) slotsSl.push({ p: [s * (SL_W / 2 - 0.02), 1.15 + k * 0.44, z] });
    }
  }
  instanced(new THREE.BoxGeometry(0.025, 0.3, 0.06), lineGlow, slotsSl, 'lichtschlitze_schleuse');

  // Sockelleisten und Gesimse (Bronze), Türöffnungen bleiben frei
  box(0.05, 0.15, CELL_D, copper, -CELL_W / 2 + 0.025, 0.075, 0, 'sockel_west');
  box(CELL_W, 0.15, 0.05, copper, 0, 0.075, CELL_D / 2 - 0.025, 'sockel_nord');
  box(0.05, 0.15, CELL_D, copper, CELL_W / 2 - 0.025, 0.075, 0, 'sockel_ost');
  const segW = (CELL_OW - DOOR_W) / 2;
  for (const s of [-1, 1]) {
    box(segW, 0.15, 0.05, copper, s * (DOOR_W + segW) / 2, 0.075, -CELL_D / 2 + 0.025, 'sockel_sued');
    box(segW, 0.1, 0.05, copper, s * (DOOR_W + segW) / 2, H - 0.05, -CELL_D / 2 + 0.025, 'gesims_sued');
  }
  box(0.05, 0.1, CELL_D, copper, -CELL_W / 2 + 0.025, H - 0.05, 0, 'gesims_west');
  box(CELL_W, 0.1, 0.05, copper, 0, H - 0.05, CELL_D / 2 - 0.025, 'gesims_nord');
  for (const s of [-1, 1]) {
    box(0.05, 0.15, SL_LEN - 0.1, copper, s * (SL_W / 2 - 0.025), 0.075, SL_ZC - T / 2, 'sockel_schleuse');
    box(0.05, 0.1, SL_LEN - 0.1, copper, s * (SL_W / 2 - 0.025), H - 0.05, SL_ZC - T / 2, 'gesims_schleuse');
  }
  box(SL_W, 0.15, 0.05, copper, 0, 0.075, SL_Z0 + 0.025, 'sockel_schleuse_aussen');
  box(SL_W, 0.1, 0.05, copper, 0, H - 0.05, SL_Z0 + 0.025, 'gesims_schleuse_aussen');

  // Bronzefassungen und Dichtungen beider Türöffnungen
  box(DOOR_W + 0.28, 0.12, 0.08, copper, 0, DOOR_H, -CELL_D / 2 + 0.02, 'tuerfassung_innen_oben');
  for (const s of [-1, 1]) box(0.1, DOOR_H, 0.08, copper, s * (DOOR_W / 2 + 0.05), DOOR_H / 2, -CELL_D / 2 + 0.02, 'tuerfassung_innen_seite');
  box(DOOR_W + 0.28, 0.12, 0.08, copper, 0, DOOR_H, SL_Z0 + 0.02, 'tuerfassung_aussen_oben');
  for (const s of [-1, 1]) box(0.1, DOOR_H, 0.08, copper, s * (DOOR_W / 2 + 0.05), DOOR_H / 2, SL_Z0 + 0.02, 'tuerfassung_aussen_seite');
  box(DOOR_W + 0.06, 0.05, 0.05, sealMat, 0, DOOR_H - 0.09, -CELL_D / 2 + 0.04, 'tuerdichtung_innen');
  box(DOOR_W + 0.06, 0.05, 0.05, sealMat, 0, DOOR_H - 0.09, SL_Z0 + 0.04, 'tuerdichtung_aussen');

  // Kopfband über der inneren Tür (Druck-/Statusfeld als Architektur)
  box(DOOR_W + 1.6, 0.18, 0.06, wallDark, 0, DOOR_H + 0.2, -CELL_D / 2 + 0.03, 'kopfband_innen');
  box(DOOR_W - 0.4, 0.05, 0.04, cyanGlow, 0, DOOR_H + 0.2, -CELL_D / 2 + 0.07, 'kopfband_leiste_innen');

  // ================================================================== Säulen, Eckpfeiler, Diagonalstreben
  const colPillars = [
    { p: [-2.95, (H - 0.1) / 2, 1.72], r: [0, 0, 0.14] },
    { p: [2.95, (H - 0.1) / 2, 1.72], r: [0, 0, -0.14] },
  ];
  instanced(new THREE.BoxGeometry(0.3, H - 0.1, 0.42), pillarMat, colPillars, 'saeulen');

  // Eckpfeiler (Perlgrau) an den vier Zellecken
  const cornerPosts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cornerPosts.push({ p: [sx * (CELL_W / 2 - 0.16), H / 2, sz * (CELL_D / 2 - 0.16)] });
  }
  instanced(new THREE.BoxGeometry(0.3, H, 0.3), pillarMat, cornerPosts, 'eckpfeiler');

  // schräge Kupferstreben (30°) – Atlantis-Spannungselemente
  const braces = [];
  for (const sx of [-1, 1]) {
    braces.push({ p: [sx * 3.05, 2.72, 1.62], r: [-Math.PI / 6, 0, 0] });
    braces.push({ p: [sx * 3.05, 2.72, -1.62], r: [Math.PI / 6, 0, 0] });
  }
  instanced(new THREE.BoxGeometry(0.16, 0.16, 2.0), copper, braces, 'diagonalstreben');

  // dreieckige Deckenfüllungen (60°-Geometrie)
  const tris = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    tris.push({ p: [sx * 2.35, H - 0.03, sz * 1.55], r: [0, sx * sz > 0 ? 0 : Math.PI, 0] });
  }
  instanced(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 3), wallDark, tris, 'decke_dreiecke');

  // ================================================================== Decke
  box(CELL_OW, 0.3, CELL_OD, ceilMat, 0, H + 0.15, 0, 'decke_zelle');
  box(SL_OW, 0.3, SL_LEN, ceilMat, 0, H + 0.15, SL_ZC - T / 2, 'decke_schleuse');

  // abgehängte Kassetten
  const cassettes = [];
  for (const x of [-1.8, 0, 1.8]) for (const z of [-1.2, 1.2]) cassettes.push({ p: [x, H - 0.035, z] });
  instanced(new THREE.BoxGeometry(1.5, 0.05, 0.9), wallDark, cassettes, 'decke_kassetten');

  // Lichtfelder
  const lightFields = [];
  for (const x of [-1.8, 0, 1.8]) for (const z of [-1.2, 1.2]) lightFields.push({ p: [x, H - 0.065, z] });
  instanced(new THREE.BoxGeometry(1.24, 0.02, 0.66), cyanGlow, lightFields, 'decke_lichtfelder');

  // indirekte Lichtbänder entlang der Deckenkanten
  for (const s of [-1, 1]) {
    box(0.08, 0.03, CELL_D - 0.3, glowMat, s * (CELL_W / 2 - 0.18), H - 0.02, 0, 'decke_lichtband_x');
    box(CELL_W - 0.4, 0.03, 0.08, glowMat, 0, H - 0.02, s * (CELL_D / 2 - 0.18), 'decke_lichtband_z');
  }
  box(0.9, 0.04, 0.8, cyanGlow, 0, H - 0.05, SL_ZC, 'decke_lichtfeld_schleuse');
  box(0.1, 0.03, SL_LEN - 0.4, glowMat, 0, H - 0.02, SL_ZC - T / 2, 'decke_lichtband_schleuse');

  // ================================================================== Objektplätze
  // Quarantäne-Kraftfeldemitter (Wand-/Türrahmenmodul) beidseitig der inneren Schleusentür
  empty('PLACE_OBJ-017', -2.65, 0, -CELL_D / 2 + 0.01, 0);
  empty('PLACE_OBJ-017_2', 2.65, 0, -CELL_D / 2 + 0.01, 0);
  // Antiker Koma- und Narkosemonitor (Wandobjekt, Vorderseite in den Raum)
  empty('PLACE_OBJ-068', -CELL_W / 2 + 0.01, 1.45, 0.6, Math.PI / 2);
  empty('PLACE_OBJ-068_2', 0, 1.45, CELL_D / 2 - 0.01, Math.PI);
  // Antiker-Schiebetüren in beiden Öffnungen (Ursprung in der Wandmitte, +Z in den Raum)
  empty('PLACE_OBJ-091', 0, 0, SL_Z0 - T / 2, 0);
  empty('PLACE_OBJ-091_2', 0, 0, -CELL_D / 2 - T / 2, 0);

  // ================================================================== Anschlüsse
  empty('DOOR_aussen', 0, 0, SL_Z0 - T / 2, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Krankenstation / Außenflur' });
  empty('DOOR_schleuse', 0, 0, -CELL_D / 2 - T / 2, Math.PI, { breite: DOOR_W, hoehe: DOOR_H, ziel: 'Dekontaminationsschleuse / Isolationszelle' });

  // ================================================================== Licht
  empty('LAMP_1', -1.8, H - 0.35, -1.2, 0, { color: '#9fd8ff', intensity: 8, distance: 9 });
  empty('LAMP_2', 1.8, H - 0.35, -1.2, 0, { color: '#9fd8ff', intensity: 8, distance: 9 });
  empty('LAMP_3', 0, H - 0.35, 1.2, 0, { color: '#63d8ff', intensity: 7, distance: 8 });
  empty('LAMP_4', -2.4, H - 0.35, 1.2, 0, { color: '#9fd8ff', intensity: 6, distance: 8 });
  empty('LAMP_5', 0, H - 0.3, SL_ZC, 0, { color: '#9fd8ff', intensity: 6, distance: 6 });

  // ================================================================== Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
    return m;
  };

  col('COL_boden_zelle', CELL_OW, 0.2, CELL_OD, 0, -0.1, 0);
  col('COL_boden_schleuse', SL_OW, 0.2, SL_LEN, 0, -0.1, SL_ZC - T / 2);
  col('COL_decke_zelle', CELL_OW, 0.3, CELL_OD, 0, H + 0.15, 0);
  col('COL_decke_schleuse', SL_OW, 0.3, SL_LEN, 0, H + 0.15, SL_ZC - T / 2);

  col('COL_wand_nord', CELL_OW, H, T, 0, H / 2, CELL_D / 2 + T / 2);
  col('COL_wand_west', T, H, CELL_OD, -CELL_W / 2 - T / 2, H / 2, 0);
  col('COL_wand_sued_links', segW, H, T, -(DOOR_W + segW) / 2, H / 2, -CELL_D / 2 - T / 2);
  col('COL_wand_sued_rechts', segW, H, T, (DOOR_W + segW) / 2, H / 2, -CELL_D / 2 - T / 2);
  col('COL_sturz_sued', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, -CELL_D / 2 - T / 2);

  col('COL_wand_ost_unten', T, WIN_Y0, CELL_OD, fx, WIN_Y0 / 2, 0);
  col('COL_wand_ost_oben', T, H - WIN_Y1, CELL_OD, fx, WIN_Y1 + (H - WIN_Y1) / 2, 0);
  col('COL_wand_ost_sued', T, WIN_Y1 - WIN_Y0, endLen, fx, (WIN_Y0 + WIN_Y1) / 2, WIN_Z0 - endLen / 2);
  col('COL_wand_ost_nord', T, WIN_Y1 - WIN_Y0, endLen, fx, (WIN_Y0 + WIN_Y1) / 2, WIN_Z1 + endLen / 2);

  for (const s of [-1, 1]) {
    col(`COL_wand_schleuse_${s < 0 ? 'west' : 'ost'}`, T, H, SL_LEN, s * (SL_W / 2 + T / 2), H / 2, SL_ZC - T / 2);
  }
  col('COL_wand_aussen_links', slLeft, H, T, -(DOOR_W + slLeft) / 2, H / 2, SL_Z0 - T / 2);
  col('COL_wand_aussen_rechts', slLeft, H, T, (DOOR_W + slLeft) / 2, H / 2, SL_Z0 - T / 2);
  col('COL_sturz_aussen', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, SL_Z0 - T / 2);

  for (const p of colPillars) {
    col(`COL_saeule_${p.p[0] < 0 ? 'west' : 'ost'}`, 0.42, H - 0.1, 0.46, p.p[0], (H - 0.1) / 2, p.p[2]);
  }

  // ================================================================== Animation
  let t = 0;
  let last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.7) * 0.14;
    cyanGlow.emissiveIntensity = 1.25 + Math.sin(t * 0.55 + 1.1) * 0.16;
  };

  root.userData.raum = {
    id: 'ATL-011',
    typ: 'isolationsraum',
    druck: 'unterdruck_-15_pa',
    zellFlaeche: CELL_W * CELL_D,
    schleuse: true,
  };
  root.userData.api = {
    getBereich: () => 'Isolationsraum',
    getDruck: () => 'unterdruck',
    getSichtfenster: () => 'Krankenstation (+X)',
  };

  return root;
}

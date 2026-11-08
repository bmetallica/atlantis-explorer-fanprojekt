// Raum ATL-023: Labor 3 · East Pier · Etage 3 · Kategorie science
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z (Spieler betritt Richtung +Z).
// Leere Raumhülle: nur Architektur (Wände, Decke, Fenster, Paneele, Energiekanäle,
// Lichtschlitze, Säulen). Möbel/Objekte werden später an die PLACE_-Punkte gesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_lab_3',
  art: 'Raum',
  masse: '12,0 m × 7,0 m × 3,4 m lichte Höhe (ca. 84 m²)',
  wohin: 'East Pier, Etage 3 – Laborreihe der Antiken (Zusatzlabor 3)',
  benutzen: 'Forschung: Forschungskonsolen (OBJ-020) und Spektralanalyse-Säulen (OBJ-088) an den Objektplätzen',
  lichter: '6 LAMP_ (eisblau, knapp unter der Decke) + eingebaute Decken-Lichtfelder und Wand-Lichtschlitze',
  animation: 'Wand-Lichtschlitze und Decken-Lichtfelder pulsieren minimal',
  quelle: 'selbst gebaut nach Beschreibung „Zusätzliches Labor (Nummer 3) der Labor-Reihe“, Referenzbild ref1.jpg und Atlantis-Setplänen',
};

// Buntglas-Fenstertextur: geometrische, schneeflockenartige Felder in Bernstein/Türkis/Blau.
function makeBuntglasTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0b2f4a';
  g.fillRect(0, 0, 256, 256);

  const center = 128;
  const colors = ['#d9a441', '#2f9c8f', '#6fb3d6', '#c96f3b', '#e5c46b'];
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    g.beginPath();
    g.moveTo(center, center);
    g.lineTo(center + Math.cos(a0) * 150, center + Math.sin(a0) * 150);
    g.lineTo(center + Math.cos(a1) * 150, center + Math.sin(a1) * 150);
    g.closePath();
    g.fillStyle = colors[i % colors.length];
    g.globalAlpha = 0.62;
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = '#173f56';
    g.lineWidth = 6;
    g.stroke();
  }
  // Schneeflocken-Kern
  g.strokeStyle = '#f0d79a';
  g.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.beginPath();
    g.moveTo(center, center);
    g.lineTo(center + Math.cos(a) * 52, center + Math.sin(a) * 52);
    g.stroke();
    const bx = center + Math.cos(a) * 40, by = center + Math.sin(a) * 40;
    for (const s of [-1, 1]) {
      const b = a + s * Math.PI / 3;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(b) * 20, by + Math.sin(b) * 20);
      g.stroke();
    }
  }
  g.beginPath();
  g.arc(center, center, 12, 0, Math.PI * 2);
  g.fillStyle = '#e8c778';
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function create(opts = {}) {
  const W = 12.0;   // Breite in X (innen)
  const D = 7.0;    // Tiefe in Z (innen)
  const H = 3.4;    // lichte Höhe
  const T = 0.3;    // Wanddicke
  const DOOR_W = 2.4;
  const DOOR_H = 3.0;

  const root = new THREE.Group();
  root.name = 'raum_lab_3';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glowMat = kit('glow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const fieldGlow = new THREE.MeshStandardMaterial({
    name: 'decken_lichtfeld', color: 0xeaf7ff, emissive: 0x9fd8ff, emissiveIntensity: 1.15, roughness: 0.35,
  });

  const buntglasTex = makeBuntglasTexture();
  const glassMat = buntglasTex
    ? new THREE.MeshStandardMaterial({
      name: 'buntglas_labor', map: buntglasTex, emissiveMap: buntglasTex,
      emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.22, metalness: 0.08,
      transparent: true, opacity: 0.92, side: THREE.DoubleSide,
    })
    : kit('glass');

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
    list.forEach((p, n) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      dummy.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
      dummy.updateMatrix();
      im.setMatrixAt(n, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(W + 2 * T, 0.1, D + 2 * T, floorMat, 0, -0.05, 0, 'boden');
  box(0.18, 0.014, D, patina, -W / 2 + 0.09, 0.007, 0, 'boden_rand_links');
  box(0.18, 0.014, D, patina, W / 2 - 0.09, 0.007, 0, 'boden_rand_rechts');
  box(W, 0.014, 0.18, patina, 0, 0.007, -D / 2 + 0.09, 'boden_rand_vorn');
  box(W, 0.014, 0.18, patina, 0, 0.007, D / 2 - 0.09, 'boden_rand_hinten');

  // Plattenfugen im 1,2-m-Raster
  const fugenX = [], fugenZ = [];
  for (let x = -4.8; x <= 4.81; x += 1.2) fugenX.push({ x, y: 0.004, z: 0 });
  for (let z = -2.4; z <= 2.41; z += 1.2) fugenZ.push({ x: 0, y: 0.004, z });
  inst(new THREE.BoxGeometry(0.02, 0.006, D - 0.5), copper, fugenX, 'boden_fugen_längs');
  inst(new THREE.BoxGeometry(W - 0.5, 0.006, 0.02), copper, fugenZ, 'boden_fugen_quer');

  // zentrale Schneeflocken-Intarsie in Kupfer
  const arms = [];
  for (let k = 0; k < 6; k++) arms.push({ x: 0, y: 0.008, z: 0, ry: (k * Math.PI) / 3 });
  inst(new THREE.BoxGeometry(0.08, 0.012, 2.3), copper, arms, 'boden_intarsie_schneeflocke');
  const branches = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    for (const s of [-1, 1]) {
      const b = a + s * Math.PI / 3;
      branches.push({
        x: Math.cos(a) * 1.35 + Math.cos(b) * 0.28,
        y: 0.008,
        z: Math.sin(a) * 1.35 + Math.sin(b) * 0.28,
        ry: -b,
      });
    }
  }
  inst(new THREE.BoxGeometry(0.05, 0.012, 0.62), copper, branches, 'boden_intarsie_zweige');
  add(new THREE.CylinderGeometry(0.38, 0.38, 0.016, 6), copper, 0, 0.009, 0, 'boden_intarsie_mitte');

  // Energiekanäle als Bodenintarsie (von den Nordwand-Anschlüssen zur Mitte)
  const kanal = [];
  for (const sx of [-1, 1]) kanal.push({ x: sx * 0.9, y: 0.007, z: 2.05 });
  inst(new THREE.BoxGeometry(0.16, 0.014, 2.0), copper, kanal, 'boden_energiekanal');

  // ------------------------------------------------------------------ Wände
  const xE = W / 2 + T / 2;   // 6.15
  const xW = -W / 2 - T / 2;  // -6.15
  const zN = D / 2 + T / 2;   // 3.65
  const zS = -D / 2 - T / 2;  // -3.65

  // Nordwand (+Z)
  box(W + 2 * T, H, T, wall, 0, H / 2, zN, 'wand_nord');
  // Westwand (-X)
  box(T, H, D + 2 * T, wall, xW, H / 2, 0, 'wand_west');

  // Ostwand (+X) mit drei Buntglas-Fensterfronten
  const winZ = [-2.3, 0, 2.3];
  const winW = 2.0, winY0 = 0.9, winY1 = 2.9;
  box(T, winY0, D + 2 * T, wall, xE, winY0 / 2, 0, 'wand_ost_unter');
  box(T, H - winY1, D + 2 * T, wall, xE, (H + winY1) / 2, 0, 'wand_ost_oben');
  const piers = [
    [-D / 2 - T, winZ[0] - winW / 2], [winZ[0] + winW / 2, winZ[1] - winW / 2],
    [winZ[1] + winW / 2, winZ[2] - winW / 2], [winZ[2] + winW / 2, D / 2 + T],
  ];
  piers.forEach((p, i) => {
    const len = p[1] - p[0];
    box(T, winY1 - winY0, len, wall, xE, (winY0 + winY1) / 2, (p[0] + p[1]) / 2, `wand_ost_pfeiler_${i}`);
  });
  winZ.forEach((zc, i) => {
    box(0.05, winY1 - winY0, winW, glassMat, xE, (winY0 + winY1) / 2, zc, `fenster_${i}_glas`);
    box(0.16, 0.12, winW + 0.22, copper, xE, winY0, zc, `fenster_${i}_rahmen_unten`);
    box(0.16, 0.12, winW + 0.22, copper, xE, winY1, zc, `fenster_${i}_rahmen_oben`);
    box(0.16, winY1 - winY0 + 0.12, 0.12, copper, xE, (winY0 + winY1) / 2, zc - winW / 2, `fenster_${i}_rahmen_links`);
    box(0.16, winY1 - winY0 + 0.12, 0.12, copper, xE, (winY0 + winY1) / 2, zc + winW / 2, `fenster_${i}_rahmen_rechts`);
    box(0.12, winY1 - winY0, 0.08, copper, xE, (winY0 + winY1) / 2, zc, `fenster_${i}_sprosse`);
    // Fensterbank / Sockelprofil darunter
    box(0.22, 0.06, winW + 0.24, copper, xE - 0.02, winY0 - 0.09, zc, `fenster_${i}_bank`);
  });

  // Südwand (-Z) mit Türöffnung 2,4 × 3,0 m
  const sideW = (W + 2 * T - DOOR_W) / 2; // 5.1
  box(sideW, H, T, wall, -(DOOR_W / 2 + sideW / 2), H / 2, zS, 'wand_sued_links');
  box(sideW, H, T, wall, DOOR_W / 2 + sideW / 2, H / 2, zS, 'wand_sued_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, zS, 'wand_sued_sturz');

  // Türzarge / Bronzeeinfassung (Flügel schieben je 1,2 m in die Seitenwand)
  box(0.14, DOOR_H, 0.4, copper, -DOOR_W / 2 - 0.07, DOOR_H / 2, zS, 'tuer_zarge_links');
  box(0.14, DOOR_H, 0.4, copper, DOOR_W / 2 + 0.07, DOOR_H / 2, zS, 'tuer_zarge_rechts');
  box(DOOR_W + 0.28, 0.14, 0.4, copper, 0, DOOR_H + 0.07, zS, 'tuer_zarge_oben');

  // ------------------------------------------------------------------ Wandpaneele, Lichtschlitze, Sockel/Gesims
  const panels = [], frames = [], slots = [];
  const sockels = [], cornices = [];
  const decorate = (axis, innerFixed, inward, from, to) => {
    const span = to - from;
    const n = Math.max(1, Math.round(span / 1.2));
    const step = span / n;
    const ry = axis === 'x'
      ? (inward > 0 ? 0 : Math.PI)
      : (inward > 0 ? Math.PI / 2 : -Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const c = from + step * (i + 0.5);
      const px = axis === 'x' ? c : innerFixed + inward * 0.035;
      const pz = axis === 'x' ? innerFixed + inward * 0.035 : c;
      if (i % 2 === 0) {
        frames.push({ x: px, y: 1.55, z: pz, ry });
        panels.push({
          x: axis === 'x' ? c : innerFixed + inward * 0.05,
          y: 1.55,
          z: axis === 'x' ? innerFixed + inward * 0.05 : c,
          ry,
        });
      } else {
        for (let k = 0; k < 4; k++) {
          slots.push({
            x: axis === 'x' ? c : innerFixed + inward * 0.02,
            y: 1.05 + k * 0.44,
            z: axis === 'x' ? innerFixed + inward * 0.02 : c,
            ry,
          });
        }
      }
    }
    const mid = (from + to) / 2;
    if (axis === 'x') {
      sockels.push({ x: mid, y: 0.075, z: innerFixed + inward * 0.02, ry });
      cornices.push({ x: mid, y: H - 0.09, z: innerFixed + inward * 0.03, ry });
    } else {
      sockels.push({ x: innerFixed + inward * 0.02, y: 0.075, z: mid, ry });
      cornices.push({ x: innerFixed + inward * 0.03, y: H - 0.09, z: mid, ry });
    }
  };

  decorate('x', D / 2, -1, -W / 2, W / 2);        // Nordwand
  decorate('x', -D / 2, 1, -W / 2, -DOOR_W / 2);   // Südwand links
  decorate('x', -D / 2, 1, DOOR_W / 2, W / 2);     // Südwand rechts
  decorate('z', -W / 2, 1, -D / 2, D / 2);        // Westwand

  inst(new THREE.BoxGeometry(1.05, 2.7, 0.06), copper, frames, 'wandpaneel_rahmen');
  inst(new THREE.BoxGeometry(0.94, 2.58, 0.035), wallDark, panels, 'wandpaneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.07, 0.32, 0.03), lineGlow, slots, 'wand_lichtschlitze');
  inst(new THREE.BoxGeometry(1, 0.15, 0.05), copper, sockels, 'sockelleisten');
  inst(new THREE.BoxGeometry(1, 0.1, 0.06), copper, cornices, 'gesimse');

  // Wand-Lichtschlitze zwischen den Ost-Fenstern (schmale, eiskalte Fugen)
  const eastSlots = [];
  for (const z of [-1.15, 1.15]) {
    for (let k = 0; k < 4; k++) eastSlots.push({ x: W / 2 - 0.02, y: 1.05 + k * 0.44, z, ry: -Math.PI / 2 });
  }
  inst(new THREE.BoxGeometry(0.07, 0.32, 0.03), lineGlow, eastSlots, 'wand_lichtschlitze_ost');

  // ------------------------------------------------------------------ Schneeflocken-Ornamente in ausgewählten Wandpaneelen
  const ornArm = [], ornBranch = [];
  const ornCenters = [-4.8, 0.0, 4.8];
  for (const cx of ornCenters) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ornArm.push({
        x: cx + Math.cos(a) * 0.16, y: 1.62 + Math.sin(a) * 0.16, z: D / 2 - 0.075, rz: a,
      });
      const bx = cx + Math.cos(a) * 0.36, by = 1.62 + Math.sin(a) * 0.36;
      for (const s of [-1, 1]) {
        const b = a + s * Math.PI / 3;
        ornBranch.push({ x: bx, y: by, z: D / 2 - 0.075, rz: b });
      }
    }
  }
  inst(new THREE.BoxGeometry(0.44, 0.035, 0.028), copper, ornArm, 'paneel_schneeflocke_arme');
  inst(new THREE.BoxGeometry(0.20, 0.028, 0.024), copper, ornBranch, 'paneel_schneeflocke_zweige');

  // ------------------------------------------------------------------ Energiekanäle (Architektur der flexiblen Energieversorgung)
  box(W - 0.6, 0.12, 0.16, copper, 0, 3.06, D / 2 - 0.09, 'energie_kanal_nord');
  box(W - 0.6, 0.12, 0.16, copper, 0, 3.06, -D / 2 + 0.09, 'energie_kanal_sued');
  box(0.16, 0.12, D - 0.6, copper, -W / 2 + 0.09, 3.06, 0, 'energie_kanal_west');
  box(0.16, 0.12, D - 0.6, copper, W / 2 - 0.09, 3.06, 0, 'energie_kanal_ost');
  const drops = [];
  for (const sx of [-1, 1]) for (const dz of [-2.1, 0, 2.1]) {
    drops.push({ x: sx * 0.9, y: 2.62, z: D / 2 - 0.1 });
  }
  inst(new THREE.BoxGeometry(0.1, 0.9, 0.1), copper, drops, 'energie_kanal_abgaenge');

  // ------------------------------------------------------------------ Säulen (schlanke Eckpfeiler, leicht geneigt)
  const pillars = [
    { x: -W / 2 + 0.34, y: (H - 0.3) / 2, z: -D / 2 + 0.32, rz: 0.055 },
    { x: W / 2 - 0.34, y: (H - 0.3) / 2, z: -D / 2 + 0.32, rz: -0.055 },
    { x: -W / 2 + 0.34, y: (H - 0.3) / 2, z: D / 2 - 0.32, rz: 0.055 },
    { x: W / 2 - 0.34, y: (H - 0.3) / 2, z: D / 2 - 0.32, rz: -0.055 },
  ];
  inst(new THREE.BoxGeometry(0.16, H - 0.3, 0.26), pillarMat, pillars, 'saeulen');
  const pillarCaps = pillars.map((p) => ({ x: p.x, y: H - 0.24, z: p.z, rz: p.rz }));
  inst(new THREE.BoxGeometry(0.28, 0.1, 0.36), copper, pillarCaps, 'saeulen_kappen');

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke');
  const deckFields = [];
  for (let x = -4.2; x <= 4.21; x += 2.1) for (let z = -2.1; z <= 2.11; z += 2.1) {
    deckFields.push({ x, y: H - 0.015, z });
  }
  inst(new THREE.BoxGeometry(1.75, 0.03, 1.35), wallDark, deckFields, 'decke_felder');
  const deckGlow = deckFields.map((p) => ({ x: p.x, y: H - 0.035, z: p.z }));
  const deckGlowMesh = inst(new THREE.BoxGeometry(1.55, 0.02, 0.28), fieldGlow, deckGlow, 'decke_leuchten');
  box(0.08, 0.03, D - 0.3, glowMat, -W / 2 + 0.2, H - 0.03, 0, 'decke_lichtband_links');
  box(0.08, 0.03, D - 0.3, glowMat, W / 2 - 0.2, H - 0.03, 0, 'decke_lichtband_rechts');
  // Decken-Kanäle der flexiblen Energieversorgung
  box(W - 1.2, 0.12, 0.18, copper, 0, H - 0.09, -2.55, 'decke_energiekanal_vorn');
  box(W - 1.2, 0.12, 0.18, copper, 0, H - 0.09, 2.55, 'decke_energiekanal_hinten');

  // ------------------------------------------------------------------ Anschlüsse, Objektplätze
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Haupteingang: DOOR-Marker zeigt nach außen (-Z), Tür-Objekt zeigt +Z in den Raum
  empty('DOOR_haupteingang', 0, 0, zS, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Korridor East Pier', raum: 'ATL-049',
  });
  empty('PLACE_OBJ-091', 0, 0, zS, 0);

  // Forschungskonsolen (2,00 × 1,52 × 1,00 m) – Standobjekte, Vorderseite (+Z) in den Raum
  empty('PLACE_OBJ-020', -3.6, 0, 2.9, Math.PI);      // Nordwand, front -Z
  empty('PLACE_OBJ-020_2', 3.6, 0, 2.9, Math.PI);    // Nordwand, front -Z
  empty('PLACE_OBJ-020_3', -5.0, 0, 0.6, Math.PI / 2); // Westwand, front +X

  // Spektralanalyse-Säulen (0,50 × 1,80 × 0,50 m)
  empty('PLACE_OBJ-088', -0.9, 0, 3.1, Math.PI);      // Nordwand, front -Z
  empty('PLACE_OBJ-088_2', 0.9, 0, 3.1, Math.PI);    // Nordwand, front -Z
  empty('PLACE_OBJ-088_3', -3.2, 0, -3.1, 0);        // Südwand, front +Z
  empty('PLACE_OBJ-088_4', 3.2, 0, -3.1, 0);         // Südwand, front +Z

  // ------------------------------------------------------------------ Licht
  const lampPos = [
    [-4.0, 3.05, 0.0], [4.0, 3.05, 0.0],
    [-2.0, 3.05, -2.4], [2.0, 3.05, -2.4],
    [-2.0, 3.05, 2.4], [2.0, 3.05, 2.4],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_labor_${i + 1}`, p[0], p[1], p[2], 0,
      { color: '#9fd8ff', intensity: 9, distance: 13 });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
  };
  col('COL_boden', W + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', W + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_nord', W + 2 * T, H, T, 0, H / 2, zN);
  col('COL_wand_west', T, H, D + 2 * T, xW, H / 2, 0);
  col('COL_wand_ost', T, H, D + 2 * T, xE, H / 2, 0);
  col('COL_wand_sued_links', sideW, H, T, -(DOOR_W / 2 + sideW / 2), H / 2, zS);
  col('COL_wand_sued_rechts', sideW, H, T, DOOR_W / 2 + sideW / 2, H / 2, zS);
  col('COL_sturz_sued', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zS);
  pillars.forEach((p, i) => col(`COL_saeule_${i + 1}`, 0.24, H - 0.3, 0.34, p.x, p.y, p.z));

  // ------------------------------------------------------------------ dezentes Atmen der Leuchtelemente
  let t = 0, last = null;
  const breathe = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.8) * 0.12;
    fieldGlow.emissiveIntensity = 1.1 + Math.sin(t * 0.8 + 0.6) * 0.08;
  };
  slotMesh.onBeforeRender = breathe;
  deckGlowMesh.onBeforeRender = breathe;

  root.userData.raum = { id: 'ATL-023', name: 'Labor 3', breite: W, tiefe: D, hoehe: H };
  return root;
}

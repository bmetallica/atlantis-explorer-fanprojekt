// Raum ATL-026: Fitnessraum / Gym (Inner City, Etage 4)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Leere Raumhülle: nur Architektur (Boden, Wände, Decke, Fensterfront, Säulen,
// Lichtleisten, Zierpaneele, Intarsien). Trainingsmatten, Hantelbänke,
// Klimmzugstangen, Wandspiegel und Waffenständer werden NICHT gebaut.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_gym',
  art: 'Raum',
  masse: '14,0 m × 10,0 m lichte Fläche (140 m²) × 3,8 m lichte Höhe',
  wohin: 'Inner City, Etage 4 – Trainings- und Fitnessbereich der Crew',
  benutzen: 'Bantos-Kampfstange (OBJ-027) auf der freien Mattenfläche in der Mitte, Kraftstation mit Hantelset (OBJ-084) an der rechten Wandnische; die Zentrumfläche bleibt ansonsten frei',
  lichter: '6 LAMP_-Punkte (4 eisblau, 2 amber) plus amberfarbene Buntglasfensterfront, wandständige Lichtschlitze und indirekte Deckenlichtbänder',
  animation: 'Wand-Lichtschlitze pulsieren minimal; Fenster- und Deckenlicht bleiben statisch',
  quelle: 'Beschreibung „Fitnessraum / Gym“ (ATL-026, Quellenklasse A), ergänzt nach Atlantis-Setplänen „Halls & Corridors“ und Referenzbild bilder/ref1.jpg',
};

const X = 14;          // lichte Breite (X)
const Z = 10;          // lichte Tiefe (Z)
const H = 3.8;         // lichte Höhe
const T = 0.3;         // Wanddicke
const DW = 2.4;        // Türbreite
const DH = 3.0;        // Türhöhe

function makeStainedGlassTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f2b95a'; g.fillRect(0, 0, 512, 256);

  // horizontale Bahnen
  g.fillStyle = '#c96a22';
  for (let i = 0; i < 4; i++) g.fillRect(28 + i * 122, 0, 9, 256);
  g.fillRect(0, 60, 512, 8); g.fillRect(0, 188, 512, 8);

  // abstrakte Atlantis-Buntglasflächen in der Kupferpalette
  const cols = ['#f6d189', '#e98a2c', '#d2522c', '#8ec5b4', '#3f6b5c', '#7fa7c9'];
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 512; x += 16) {
      if (((x / 16) + (y / 16)) % 3 === 0) {
        g.fillStyle = cols[(x * 7 + y * 13) % cols.length];
        g.fillRect(x + 2, y + 2, 12, 12);
      }
    }
  }

  // Schneeflocken-Ornament (verzweigt, symmetrisch)
  g.strokeStyle = '#fff2cf'; g.lineWidth = 3;
  const flake = (cx, cy, r) => {
    g.beginPath();
    for (let a = 0; a < 6; a++) {
      const ang = a * Math.PI / 3;
      g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      g.moveTo(cx + Math.cos(ang) * r * 0.62, cy + Math.sin(ang) * r * 0.62);
      g.lineTo(cx + Math.cos(ang + 0.5) * r * 0.84, cy + Math.sin(ang + 0.5) * r * 0.84);
    }
    g.stroke();
  };
  flake(128, 124, 44); flake(384, 124, 44);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_gym';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matGlow = kit('glow');
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.5,
  });
  const matSlot = new THREE.MeshStandardMaterial({
    name: 'lichtschlitz', color: 0xe6f7ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6,
  });
  const matAmberLine = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_amber', color: 0xffd9a0, emissive: 0xffa23c, emissiveIntensity: 1.8,
  });
  const glassTex = makeStainedGlassTexture();
  const matGlass = glassTex
    ? new THREE.MeshStandardMaterial({
        name: 'buntglas_amber', map: glassTex, emissiveMap: glassTex,
        emissive: 0xffb457, emissiveIntensity: 0.65, metalness: 0.1, roughness: 0.35,
        transparent: true, opacity: 0.95,
      })
    : kit('glass');
  const matCol = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const o3 = new THREE.Object3D();
  const instanced = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      o3.position.set(p[0], p[1], p[2]);
      o3.rotation.set(0, p[3] || 0, 0);
      o3.scale.set(1, 1, 1);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  // ------------------------------------------------------------------ Boden
  box(X, 0.2, Z, matFloor, 0, -0.1, 0, 'boden');
  for (const s of [-1, 1]) {
    box(0.22, 0.014, Z - 0.44, matPatina, s * (X / 2 - 0.11), 0.007, 0, 'boden_rand');
    box(X - 0.44, 0.014, 0.22, matPatina, 0, 0.007, s * (Z / 2 - 0.11), 'boden_rand');
  }
  const seamZ = [], seamX = [];
  for (let z = -Z / 2 + 1.2; z < Z / 2 - 0.01; z += 1.2) seamZ.push([0, 0.006, z, 0]);
  for (let x = -X / 2 + 1.2; x < X / 2 - 0.01; x += 1.2) seamX.push([x, 0.006, 0, 0]);
  instanced(new THREE.BoxGeometry(X - 0.44, 0.008, 0.02), matCopper, seamZ, 'boden_fugen');
  instanced(new THREE.BoxGeometry(0.02, 0.008, Z - 0.44), matCopper, seamX, 'boden_fugen');

  // Zentrale Schneeflocken-Intarsie (flache Bodeneinlage, keine Matte)
  const inlayGroup = new THREE.Group();
  inlayGroup.name = 'boden_intarsie_schneeflocke';
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.62, 12), matCopper);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  inlayGroup.add(ring);
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = i * Math.PI / 3;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 1.5), matCopper);
    spoke.position.set(0, 0.006, 0.78);
    arm.add(spoke);
    for (const s of [-1, 1]) {
      const branch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.42), matCopper);
      branch.position.set(s * 0.21, 0.006, 1.02);
      branch.rotation.y = s * 0.78;
      arm.add(branch);
    }
    inlayGroup.add(arm);
  }
  root.add(inlayGroup);

  // ------------------------------------------------------------------ Wände
  // Eingangswand bei z = -Z/2, Türöffnung mittig (2,4 × 3,0 m)
  const segW = (X - DW) / 2;
  for (const s of [-1, 1]) {
    box(segW, H, T, matWall, s * (DW / 2 + segW / 2), H / 2, -Z / 2 - T / 2,
      `wand_eingang_${s < 0 ? 'links' : 'rechts'}`);
  }
  box(DW, H - DH, T, matWall, 0, DH + (H - DH) / 2, -Z / 2 - T / 2, 'wand_eingang_sturz');

  // Seitenwände
  box(T, H, Z, matWall, -X / 2 - T / 2, H / 2, 0, 'wand_links');
  box(T, H, Z, matWall, X / 2 + T / 2, H / 2, 0, 'wand_rechts');

  // Rückwand mit Buntglas-Fensterfront (x -3,0 … 3,0; y 0,55 … 3,05)
  const WW = 6.0, WY0 = 0.55, WY1 = 3.05;
  const backSeg = (X - WW) / 2;
  for (const s of [-1, 1]) {
    box(backSeg, H, T, matWall, s * (WW / 2 + backSeg / 2), H / 2, Z / 2 + T / 2,
      `wand_hinten_${s < 0 ? 'links' : 'rechts'}`);
  }
  box(WW, WY0, T, matWall, 0, WY0 / 2, Z / 2 + T / 2, 'wand_hinten_sockel');
  box(WW, H - WY1, T, matWall, 0, WY1 + (H - WY1) / 2, Z / 2 + T / 2, 'wand_hinten_sturz');

  // Fenster: Buntglasfläche + Kupferrahmen + Sprossen
  const glass = add(new THREE.PlaneGeometry(WW, WY1 - WY0), matGlass, 0, (WY0 + WY1) / 2, Z / 2 - 0.02, 'fenster_buntglas');
  glass.rotation.y = Math.PI;
  box(WW + 0.3, 0.16, 0.22, matCopper, 0, WY0 - 0.08, Z / 2 - 0.06, 'fenster_rahmen');
  box(WW + 0.3, 0.16, 0.22, matCopper, 0, WY1 + 0.08, Z / 2 - 0.06, 'fenster_rahmen');
  for (const s of [-1, 1]) box(0.16, WY1 - WY0 + 0.32, 0.22, matCopper, s * (WW / 2 + 0.08), (WY0 + WY1) / 2, Z / 2 - 0.06, 'fenster_rahmen');
  for (const mx of [-2.4, -1.2, 0, 1.2, 2.4]) box(0.07, WY1 - WY0, 0.16, matCopper, mx, (WY0 + WY1) / 2, Z / 2 - 0.07, 'fenster_sprosse');
  for (const my of [1.25, 2.05]) box(WW, 0.06, 0.16, matCopper, 0, my, Z / 2 - 0.07, 'fenster_sprosse');
  //Fensterbank
  box(WW + 0.5, 0.12, 0.36, matCopper, 0, WY0 - 0.12, Z / 2 - 0.16, 'fenster_bank');

  // ------------------------------------------------------------------ Wanddetails
  const sidePanel = [], sideFrame = [], sideSlot = [];
  const flatPanel = [], flatFrame = [];
  const zFields = [];
  for (let z = -4.2; z <= 4.21; z += 1.2) zFields.push(+z.toFixed(2));

  zFields.forEach((z, i) => {
    for (const s of [-1, 1]) {
      if (i % 2 === 0) {
        sideFrame.push([s * (X / 2 - 0.025), 1.55, z, 0]);
        sidePanel.push([s * (X / 2 - 0.072), 1.55, z, 0]);
      } else {
        // 4 kurze, übereinanderliegende Lichtschlitze (Atlantis-Signet)
        for (let k = 0; k < 4; k++) sideSlot.push([s * (X / 2 - 0.016), 0.95 + k * 0.48, z, 0]);
      }
    }
  });

  // Eingangswand: Paneele links/rechts, Blendenbereich neben der Tür frei
  [-6.0, -4.8, -3.6, 3.6, 4.8, 6.0].forEach((x, i) => {
    flatFrame.push([x, 1.55, -Z / 2 + 0.025, 0]);
    flatPanel.push([x, 1.55, -Z / 2 + 0.072, 0]);
    if (i % 2 === 0) for (let k = 0; k < 4; k++) sideSlot.push([x + 0.6, 0.95 + k * 0.48, -Z / 2 + 0.016, 0]);
  });

  // Rückwand: Paneele neben der Fensterfront
  [-6.0, -4.8, -3.6, 3.6, 4.8, 6.0].forEach((x, i) => {
    flatFrame.push([x, 1.55, Z / 2 - 0.025, 0]);
    flatPanel.push([x, 1.55, Z / 2 - 0.072, 0]);
    if (i % 2 === 0) for (let k = 0; k < 4; k++) sideSlot.push([x + 0.6, 0.95 + k * 0.48, Z / 2 - 0.016, 0]);
  });

  // Amberfarbene Lichtbalken links und rechts der Fensterfront (Referenzbild)
  const amberBars = [];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) amberBars.push([s * 3.35, 0.75 + k * 0.42, Z / 2 - 0.03, 0]);
  }
  instanced(new THREE.BoxGeometry(0.16, 0.3, 0.05), matAmberLine, amberBars, 'fenster_lichtbalken');

  const slotMesh = instanced(new THREE.BoxGeometry(0.06, 0.32, 0.03), matSlot, sideSlot, 'lichtschlitze');
  instanced(new THREE.BoxGeometry(0.05, 2.72, 1.06), matCopper, sideFrame, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(0.04, 2.55, 0.95), matWallDark, sidePanel, 'paneele');
  instanced(new THREE.BoxGeometry(1.06, 2.72, 0.05), matCopper, flatFrame, 'paneel_rahmen');
  instanced(new THREE.BoxGeometry(0.95, 2.55, 0.04), matWallDark, flatPanel, 'paneele');

  // Trainingsnische an der rechten Wand (architektonische Vertiefung für die Kraftstation)
  box(0.06, 2.6, 3.6, matWallDark, X / 2 - 0.03, 1.35, 0.6, 'wandnische_rechts');
  for (const dz of [-1.8, 1.8]) box(0.12, 2.72, 0.12, matCopper, X / 2 - 0.06, 1.36, 0.6 + dz, 'wandnische_rechts');
  for (const yy of [0.08, 2.64]) box(0.12, 0.12, 3.72, matCopper, X / 2 - 0.06, yy, 0.6, 'wandnische_rechts');

  // Sockelleisten und Gesimse (durchgehend außer an Öffnungen)
  for (const s of [-1, 1]) {
    box(0.05, 0.15, Z, matCopper, s * (X / 2 - 0.025), 0.075, 0, 'sockelleiste');
    box(0.07, 0.1, Z, matCopper, s * (X / 2 - 0.035), H - 0.05, 0, 'gesims');
    box(segW, 0.15, 0.05, matCopper, s * (DW / 2 + segW / 2), 0.075, -Z / 2 + 0.025, 'sockelleiste');
    box(segW, 0.1, 0.07, matCopper, s * (DW / 2 + segW / 2), H - 0.05, -Z / 2 + 0.035, 'gesims');
    box(backSeg, 0.15, 0.05, matCopper, s * (WW / 2 + backSeg / 2), 0.075, Z / 2 - 0.025, 'sockelleiste');
    box(backSeg, 0.1, 0.07, matCopper, s * (WW / 2 + backSeg / 2), H - 0.05, Z / 2 - 0.035, 'gesims');
  }

  // Türrahmen (Eingang, -Z)
  box(DW + 0.32, 0.16, 0.24, matCopper, 0, DH + 0.08, -Z / 2 + 0.06, 'tuer_einfassung');
  for (const s of [-1, 1]) box(0.16, DH, 0.24, matCopper, s * (DW / 2 + 0.08), DH / 2, -Z / 2 + 0.06, 'tuer_einfassung');
  // 1,2 m breite Wandblenden für die Schiebetürflügel (keine weiteren Öffnungen)
  for (const s of [-1, 1]) {
    box(1.2, DH, 0.05, matWallDark, s * (DW / 2 + 0.6), DH / 2, -Z / 2 + 0.026, 'tuer_blende');
    box(1.2, 0.08, 0.08, matCopper, s * (DW / 2 + 0.6), DH - 0.04, -Z / 2 + 0.04, 'tuer_blende');
  }

  // ------------------------------------------------------------------ Säulen mit schrägen Streben
  const pillars = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pillars.push([sx * 5.6, H / 2, sz * 3.8, 0]);
  instanced(new THREE.BoxGeometry(0.28, H - 0.2, 0.28), matPillar, pillars, 'saeulen');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 5.6, z = sz * 3.8;
    box(0.44, 0.14, 0.44, matCopper, x, 0.07, z, 'saeulen_sockel');
    box(0.40, 0.12, 0.40, matCopper, x, H - 0.06, z, 'saeulen_kopf');
    // schräge Strebe zur Decke (30°/60°-Anmutung)
    const strut = box(0.16, 0.92, 0.16, matPillar, x, H - 0.42, z - sz * 0.31, 'saeulen_strebe');
    strut.rotation.x = -sz * 0.59;
  }

  // ------------------------------------------------------------------ Decke
  box(X + 2 * T, 0.3, Z + 2 * T, matCeiling, 0, H + 0.15, 0, 'decke_haupt');
  for (const s of [-1, 1]) {
    box(0.1, 0.05, Z - 0.2, matGlow, s * (X / 2 - 0.28), H - 0.03, 0, 'decke_lichtband');
    box(X - 0.2, 0.05, 0.1, matGlow, 0, H - 0.03, s * (Z / 2 - 0.28), 'decke_lichtband');
  }
  const fields = [];
  for (const fx of [-3.6, 0, 3.6]) for (const fz of [-2.2, 2.2]) fields.push([fx, H - 0.035, fz, 0]);
  instanced(new THREE.BoxGeometry(2.4, 0.05, 1.6), matWallDark, fields, 'decke_felder');
  const lightPanels = fields.map(f => [f[0], H - 0.068, f[2], 0]);
  instanced(new THREE.BoxGeometry(2.0, 0.03, 1.2), matGlow, lightPanels, 'decke_lichtfeld');
  // amberfarbenes Lichtband an der Fensterseite
  box(X - 2.4, 0.05, 0.14, matAmberLine, 0, H - 0.03, Z / 2 - 0.62, 'decke_lichtband_amber');

  // ------------------------------------------------------------------ Anschlüsse / Platzpunkte
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Eingangstür an der Seite -Z (Spieler betritt Richtung +Z)
  empty('DOOR_eingang', 0, 0, -Z / 2 - T / 2, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Korridor ATL-049 (Inner City, Etage 4)', raum: 'ATL-049',
  });
  // Antiker-Schiebetür, Flügel schieben in die Wandblenden, Vorderseite (+Z) in den Raum
  empty('PLACE_OBJ-091', 0, 0, -Z / 2 - T / 2, 0);

  // Bantos-Kampfstange: flach auf dem Boden in der freien Mitte
  empty('PLACE_OBJ-027', -1.3, 0, 0.55, 0.35);
  // Kraftstation & Hantelset: in der rechten Wandnische, Vorderseite (+Z) in den Raum
  empty('PLACE_OBJ-084', X / 2 - 0.63, 0, 0.6, -Math.PI / 2);

  // ------------------------------------------------------------------ Licht
  const lamps = [
    [-4.2, 3.3, -2.6, '#9fd8ff', 9, 10],
    [0.0, 3.3, -2.6, '#9fd8ff', 9, 10],
    [4.2, 3.3, -2.6, '#9fd8ff', 9, 10],
    [-3.6, 3.3, 2.2, '#ffd8a0', 8, 10],
    [0.0, 3.3, 2.2, '#ffd8a0', 8, 10],
    [3.6, 3.3, 2.2, '#ffd8a0', 8, 10],
  ];
  lamps.forEach((l, i) => {
    empty(`LAMP_${i + 1}`, l[0], l[1], l[2], 0, { color: l[3], intensity: l[4], distance: l[5] });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matCol);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  };
  col('COL_boden', X + 2 * T, 0.2, Z + 2 * T, 0, -0.1, 0);
  col('COL_decke', X + 2 * T, 0.3, Z + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_links', T, H, Z, -X / 2 - T / 2, H / 2, 0);
  col('COL_wand_rechts', T, H, Z, X / 2 + T / 2, H / 2, 0);
  col('COL_wand_hinten_links', backSeg, H, T, -(WW / 2 + backSeg / 2), H / 2, Z / 2 + T / 2);
  col('COL_wand_hinten_rechts', backSeg, H, T, (WW / 2 + backSeg / 2), H / 2, Z / 2 + T / 2);
  col('COL_wand_hinten_sockel', WW, WY0, T, 0, WY0 / 2, Z / 2 + T / 2);
  col('COL_wand_hinten_sturz', WW, H - WY1, T, 0, WY1 + (H - WY1) / 2, Z / 2 + T / 2);
  for (const s of [-1, 1]) {
    col(`COL_wand_eingang_${s < 0 ? 'links' : 'rechts'}`, segW, H, T,
      s * (DW / 2 + segW / 2), H / 2, -Z / 2 - T / 2);
  }
  col('COL_eingang_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, -Z / 2 - T / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    col(`COL_saeule_${sx < 0 ? 'l' : 'r'}${sz < 0 ? 'v' : 'h'}`, 0.44, H, 0.44, sx * 5.6, H / 2, sz * 3.8);
  }

  // ------------------------------------------------------------------ Animation
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    matSlot.emissiveIntensity = 1.55 + Math.sin(t * 0.75) * 0.12;
  };

  root.userData.raum = { id: 'ATL-026', breite: X, tiefe: Z, hoehe: H };
  root.userData.api = {
    apiVersion: 1,
    getConnections: () => [{ id: 'DOOR_eingang', ziel: 'ATL-049', breite: DW, hoehe: DH }],
    getObjectAnchors: () => ['PLACE_OBJ-027', 'PLACE_OBJ-084', 'PLACE_OBJ-091'],
  };
  return root;
}

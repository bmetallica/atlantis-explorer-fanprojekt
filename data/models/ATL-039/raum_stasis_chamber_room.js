// Raum ATL-039: Stasis-Kammer / Stasis Chamber Room (Inner City, Etage 2, technische Zone)
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite −Z. Leere Hülle: nur Architektur (Wände, Nischen, Pod-Bays,
// Fugen, Paneele, Lichtleisten, Decke) + PLACE_-Punkte für Stasis-Pods und die Schiebetür.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_stasis_chamber_room',
  art: 'Raum',
  masse: '12,0 m × 9,2 m × 3,8 m licht (≈ 110 m²); Wandstärke 0,3 m',
  wohin: 'Inner City, Etage 2 – technische Zone (Kryostase / Zeit-Anhalt)',
  benutzen: '12 Stasis-Pods (OBJ-008) in wandintegrierten Nischen-Bays (je 1 Pod pro Bay); Vitalparameter-Terminals und Notfall-Aufwachkonsolen werden später als Objekte nachgerüstet',
  lichter: '6 LAMP_ (kyan-eisblau, Intensität 7, Distanz 11) + eingebaute Status- und Nischenleuchten',
  animation: 'Nischen-Statusleisten und Decken-Lichtfelder pulsieren minimal',
  quelle: 'Rekonstruiert nach Referenzbildern (Stasis-Kammer, „Before I Sleep“) im Atlantis-Kupfer-/Patina-Stil',
};

export const varianten = [
  { label: 'Stasis-Kammer, Vollausbau (12 Pods)', opts: {} },
  { label: 'Stasis-Kammer, reduziert (4 Pods)', opts: { reduziert: true } },
];

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_stasis_chamber_room';

  // ------------------------------------------------------------------ Maße
  const W = 12.0;           // lichte Breite X
  const D = 9.2;            // lichte Tiefe Z
  const H = 3.8;            // lichte Höhe
  const T = 0.3;            // Wandstärke
  const BAY = 1.2;          // Nischenbreite (Blickachse des Pods)
  const FIN = 0.9;          // Tiefe der Nischenwangen (Rücksprung in den Raum)
  const POD_W = 0.90;       // OBJ-008 Breite
  const POD_H = 2.34;       // OBJ-008 Höhe
  const POD_T = 0.77;       // OBJ-008 Tiefe
  const NH = 2.62;          // Nischenhöhe

  const mWall = kit('wall');
  const mWallDark = kit('wallDark');
  const mCopper = kit('copper');
  const mPillar = kit('pillar');
  const mFloor = kit('floor');
  const mCeil = kit('ceiling');
  const mPatina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.42 });
  const mCyan = new THREE.MeshStandardMaterial({
    name: 'KIT_glow', color: 0xdff8ff, emissive: 0x7fd8ff, emissiveIntensity: 1.7, roughness: 0.35,
  });
  const mAmber = new THREE.MeshStandardMaterial({
    name: 'KIT_amberGlow', color: 0xffe6b8, emissive: 0xffa63a, emissiveIntensity: 1.5, roughness: 0.45,
  });

  // ------------------------------------------------------------------ Helfer
  const box = (w, h, d, mat, x, y, z, name, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const o3 = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      o3.position.set(p[0], p[1], p[2]);
      o3.rotation.set(0, p[3] || 0, 0);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
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
  // flaches Segment in der Bodenebene (Länge in X, gedreht um y)
  const flatSeg = (x1, z1, x2, z2, w, mat, y, name) => {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    return box(len, 0.008, w, mat, (x1 + x2) / 2, y, (z1 + z2) / 2, name, -Math.atan2(dz, dx));
  };

  // ------------------------------------------------------------------ Boden
  box(W, 0.1, D, mFloor, 0, -0.05, 0, 'boden');
  // umlaufender grün-kupferner Rand
  for (const s of [-1, 1]) {
    box(0.22, 0.012, D - 0.08, mPatina, s * (W / 2 - 0.11), 0.006, 0, 'boden_rand');
    box(W - 0.08, 0.012, 0.22, mPatina, 0, 0.006, s * (D / 2 - 0.11), 'boden_rand');
  }
  // Plattenfugen im 1,2-m-Raster
  const seamsX = [], seamsZ = [];
  for (let x = -4.8; x <= 4.8 + 0.001; x += 1.2) seamsX.push([x, 0.003, 0]);
  for (let z = -3.6; z <= 3.6 + 0.001; z += 1.2) seamsZ.push([0, 0.003, z]);
  inst(new THREE.BoxGeometry(0.018, 0.006, D - 0.3), mCopper, seamsX, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(W - 0.3, 0.006, 0.018), mCopper, seamsZ, 'boden_fugen_z');

  // ------------------------------------------------------------------ Grundriss-Plan
  // Seitenwände (X = ±6): 4 Nischen-Bays, dazwischen 5 Wangen
  const sideBays = [-3.3, -1.1, 1.1, 3.3];
  const sideFins = [[-4.6, -3.9], [-2.7, -1.7], [-0.5, 0.5], [1.7, 2.7], [3.9, 4.6]];
  // Rückwand (Z = +4.6): 4 Nischen-Bays, 5 Wangen (Eckbereich frei für Seitenwangen)
  const backBays = [-3.9, -1.3, 1.3, 3.9];
  const backFins = [[-5.1, -4.5], [-3.3, -1.9], [-0.7, 0.7], [1.9, 3.3], [4.5, 5.1]];
  const reduced = !!opts.reduziert;
  const sideBayList = reduced ? sideBays.filter((z) => Math.abs(z) === 1.1) : sideBays;
  const backBayList = reduced ? backBays.filter((x) => Math.abs(x) === 1.3) : backBays;

  // ------------------------------------------------------------------ Außenwände (Hülle)
  for (const s of [-1, 1]) {
    box(T, H, D, mWall, s * (W / 2 + T / 2), H / 2, 0, `wand_${s < 0 ? 'links' : 'rechts'}`);
    box(W + 2 * T, H, T, mWall, 0, H / 2, D / 2 + T / 2, 'wand_hinten');
  }

  // ------------------------------------------------------------------ Vorderwand (−Z) mit Haupttüröffnung
  const doorW = 2.4, doorH = 3.0;
  const zFront = -D / 2 - T / 2;
  const frontSide = (W + 2 * T - doorW) / 2;              // Breite je Wandstück
  const frontSideC = doorW / 2 + frontSide / 2;
  for (const s of [-1, 1]) {
    box(frontSide, H, T, mWall, s * frontSideC, H / 2, zFront, `wand_vorne_${s < 0 ? 'links' : 'rechts'}`);
    // Sockelleiste / Gesims
    box(frontSide, 0.15, 0.04, mCopper, s * frontSideC, 0.075, -D / 2 + 0.02, 'sockel_vorne');
    box(frontSide, 0.1, 0.06, mCopper, s * frontSideC, H - 0.05, -D / 2 + 0.03, 'gesims_vorne');
  }
  box(doorW, H - doorH, T, mWall, 0, doorH + (H - doorH) / 2, zFront, 'wand_vorne_sturz');
  // Bronzeeinfassung der Türöffnung (eckig), 1,2 m Wandfläche je Seite zum Schieben frei
  for (const s of [-1, 1]) box(0.12, doorH, 0.1, mCopper, s * (doorW / 2 + 0.02), doorH / 2, -D / 2 - 0.03, 'tuerrahmen');
  box(doorW + 0.28, 0.14, 0.1, mCopper, 0, doorH + 0.03, -D / 2 - 0.03, 'tuerrahmen');

  // ------------------------------------------------------------------ Nischen-Wangen (Fins)
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'links' : 'rechts';
    for (let i = 0; i < sideFins.length; i++) {
      const [a, b] = sideFins[i];
      const len = b - a, zc = (a + b) / 2;
      // Körper der Wange (ragt FIN in den Raum)
      box(FIN, H, len, mWallDark, s * (W / 2 - FIN / 2), H / 2, zc, `nischen_wange_${side}_${i}`);
      // helle Kante zur Pod-Bay hin + Bronze-Kante vorn
      box(0.08, H, 0.08, mPillar, s * (W / 2 - FIN + 0.04), H / 2, zc - len / 2 + 0.04, `wange_kante_${side}_${i}`);
      box(0.08, H, 0.08, mCopper, s * (W / 2 - FIN + 0.04), H / 2, zc + len / 2 - 0.04, `wange_kante_${side}_${i}`);
      // Sockel / Gesims auf der Wangen-Aufenseite (Richtung Raum)
      box(0.05, 0.15, len, mCopper, s * (W / 2 - FIN - 0.02), 0.075, zc, `wange_sockel_${side}_${i}`);
      box(0.06, 0.1, len, mCopper, s * (W / 2 - FIN - 0.02), H - 0.05, zc, `wange_gesims_${side}_${i}`);
      // Zierpaneel + Lichtschlitz auf der raumzugewandten Wangenflanke
      const pw = Math.min(len - 0.22, 0.9);
      if (pw > 0.2) {
        box(0.04, 2.5, pw, mWallDark, s * (W / 2 - FIN - 0.02), 1.55, zc, `wange_paneel_${side}_${i}`);
        box(0.06, 2.66, pw + 0.12, mCopper, s * (W / 2 - FIN - 0.045), 1.55, zc, `wange_paneel_rahmen_${side}_${i}`);
        box(0.03, 2.1, 0.06, mCyan, s * (W / 2 - FIN - 0.055), 1.5, zc, `wange_lichtschlitz_${side}_${i}`);
      }
    }
  }
  for (let i = 0; i < backFins.length; i++) {
    const [a, b] = backFins[i];
    const len = b - a, xc = (a + b) / 2;
    box(len, H, FIN, mWallDark, xc, H / 2, D / 2 - FIN / 2, `nischen_wange_hinten_${i}`);
    box(0.08, H, 0.08, mPillar, xc - len / 2 + 0.04, H / 2, D / 2 - FIN + 0.04, `wange_kante_hinten_${i}`);
    box(0.08, H, 0.08, mCopper, xc + len / 2 - 0.04, H / 2, D / 2 - FIN + 0.04, `wange_kante_hinten_${i}`);
    box(len, 0.15, 0.05, mCopper, xc, 0.075, D / 2 - FIN - 0.02, `wange_sockel_hinten_${i}`);
    box(len, 0.1, 0.06, mCopper, xc, H - 0.05, D / 2 - FIN - 0.02, `wange_gesims_hinten_${i}`);
    const pw = Math.min(len - 0.22, 0.9);
    if (pw > 0.2) {
      box(pw, 2.5, 0.04, mWallDark, xc, 1.55, D / 2 - FIN - 0.02, `wange_paneel_hinten_${i}`);
      box(pw + 0.12, 2.66, 0.06, mCopper, xc, 1.55, D / 2 - FIN - 0.045, `wange_paneel_rahmen_hinten_${i}`);
      box(0.06, 2.1, 0.03, mCyan, xc, 1.5, D / 2 - FIN - 0.055, `wange_lichtschlitz_hinten_${i}`);
    }
  }

  // ------------------------------------------------------------------ Nischen-Rückflächen, Status- und Lichtleisten
  const bayPanelsSide = [], bayPanelsBack = [], slotsSide = [], slotsBack = [], statusSide = [], statusBack = [];
  for (const s of [-1, 1]) {
    for (const zc of sideBayList) {
      bayPanelsSide.push([s * (W / 2 - 0.02), 1.35, zc]);
      slotsSide.push([s * (W / 2 - 0.05), 1.25, zc - 0.52]);
      slotsSide.push([s * (W / 2 - 0.05), 1.25, zc + 0.52]);
      statusSide.push([s * (W / 2 - 0.05), 2.48, zc]);
      // Bronzerahmen der Öffnung
      for (const dz of [-1, 1]) box(0.07, NH, 0.08, mCopper, s * (W / 2 - 0.035), NH / 2, zc + dz * (BAY / 2 - 0.04), 'nischen_rahmen');
      box(0.07, 0.08, BAY + 0.1, mCopper, s * (W / 2 - 0.035), NH + 0.02, zc, 'nischen_rahmen');
    }
  }
  for (const xc of backBayList) {
    bayPanelsBack.push([xc, 1.35, D / 2 - 0.02]);
    slotsBack.push([xc - 0.52, 1.25, D / 2 - 0.05]);
    slotsBack.push([xc + 0.52, 1.25, D / 2 - 0.05]);
    statusBack.push([xc, 2.48, D / 2 - 0.05]);
    for (const dx of [-1, 1]) box(0.08, NH, 0.07, mCopper, xc + dx * (BAY / 2 - 0.04), NH / 2, D / 2 - 0.035, 'nischen_rahmen');
    box(BAY + 0.1, 0.08, 0.07, mCopper, xc, NH + 0.02, D / 2 - 0.035, 'nischen_rahmen');
  }
  inst(new THREE.BoxGeometry(0.04, 2.55, BAY - 0.06), mWallDark, bayPanelsSide, 'nischen_rueckflaeche_seiten');
  inst(new THREE.BoxGeometry(BAY - 0.06, 2.55, 0.04), mWallDark, bayPanelsBack, 'nischen_rueckflaeche_hinten');
  const slotMesh = inst(new THREE.BoxGeometry(0.03, 2.2, 0.06), mCyan, slotsSide, 'nischen_lichtschlitze_seiten');
  inst(new THREE.BoxGeometry(0.06, 2.2, 0.03), mCyan, slotsBack, 'nischen_lichtschlitze_hinten');
  inst(new THREE.BoxGeometry(0.04, 0.10, 0.9), mAmber, statusSide, 'nischen_status_seiten');
  inst(new THREE.BoxGeometry(0.9, 0.10, 0.04), mAmber, statusBack, 'nischen_status_hinten');

  // ------------------------------------------------------------------ Vorderwand-Paneele
  const fPanels = [], fFrames = [], fSlots = [];
  for (const x of [-5.4, -4.2, -3.0, -1.8, 1.8, 3.0, 4.2, 5.4]) {
    fPanels.push([x, 1.55, -D / 2 + 0.02]);
    fFrames.push([x, 1.55, -D / 2 + 0.015]);
    fSlots.push([x, 1.5, -D / 2 + 0.005]);
  }
  inst(new THREE.BoxGeometry(1.02, 2.5, 0.035), mWallDark, fPanels, 'paneele_vorne');
  inst(new THREE.BoxGeometry(1.14, 2.66, 0.05), mCopper, fFrames, 'paneel_rahmen_vorne');
  inst(new THREE.BoxGeometry(0.06, 2.2, 0.02), mCyan, fSlots, 'lichtschlitze_vorne');

  // ------------------------------------------------------------------ Boden-Intarsie: Schneeflocke (eckig, 60°-Raster)
  const flakeR = 1.75;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const cx = Math.cos(a), sz = Math.sin(a);
    flatSeg(0, 0, cx * flakeR, sz * flakeR, 0.055, mCopper, 0.005, 'intarsie_schneeflocke');
    // zwei rechtwinklige Astpaare je Arm
    for (const [t, bl] of [[0.5, 0.5], [0.75, 0.3]]) {
      const px = cx * flakeR * t, pz = sz * flakeR * t;
      const bx = -sz, bz = cx;
      flatSeg(px, pz, px + bx * bl, pz + bz * bl, 0.045, mCopper, 0.005, 'intarsie_schneeflocke');
      flatSeg(px, pz, px - bx * bl, pz - bz * bl, 0.045, mCopper, 0.005, 'intarsie_schneeflocke');
    }
  }
  // Sechseckring als Gegenstück
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    hex.push([Math.cos(a) * 0.95, Math.sin(a) * 0.95]);
  }
  for (let i = 0; i < 6; i++) {
    const p = hex[i], q = hex[(i + 1) % 6];
    flatSeg(p[0], p[1], q[0], q[1], 0.05, mPatina, 0.005, 'intarsie_sechseck');
  }

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, mCeil, 0, H + 0.15, 0, 'decke');
  const cPan = [], cGlow = [];
  for (const x of [-3.6, 0, 3.6]) for (const z of [-2.4, 0, 2.4]) {
    cPan.push([x, H - 0.04, z]);
    cGlow.push([x, H - 0.09, z]);
  }
  inst(new THREE.BoxGeometry(2.5, 0.08, 1.3), mWallDark, cPan, 'decke_kassetten');
  inst(new THREE.BoxGeometry(2.1, 0.03, 0.95), mCyan, cGlow, 'decke_leuchtfelder');
  // umlaufendes Lichtband unter der Decke
  for (const s of [-1, 1]) {
    box(0.07, 0.03, D - 0.2, mCyan, s * (W / 2 - 0.22), H - 0.015, 0, 'decke_lichtband');
    box(W - 0.2, 0.03, 0.07, mCyan, 0, H - 0.015, s * (D / 2 - 0.22), 'decke_lichtband');
  }

  // ------------------------------------------------------------------ Stasis-Pods: nur Platzierungspunkte
  let podCount = 0;
  const pod = (x, z, rotY) => {
    podCount++;
    empty(podCount === 1 ? 'PLACE_OBJ-008' : `PLACE_OBJ-008_${podCount}`, x, 0, z, rotY);
  };
  const podX = W / 2 - POD_T / 2;         // 5,615 – Podfront liegt in der Wandebene
  for (const zc of sideBayList) {
    pod(-podX, zc, Math.PI / 2);           // linke Wand: +Z des Pods zeigt nach +X (in den Raum)
    pod(podX, zc, -Math.PI / 2);           // rechte Wand: +Z zeigt nach −X (in den Raum)
  }
  for (const xc of backBayList) {
    pod(xc, D / 2 - POD_T / 2, Math.PI);    // Rückwand: +Z zeigt nach −Z (in den Raum)
  }

  // ------------------------------------------------------------------ Tür / Anschluss
  empty('DOOR_haupt', 0, 0, zFront, Math.PI, {
    breite: doorW, hoehe: doorH, ziel: 'Korridor Inner City (ATL-049)', raum: 'ATL-049',
  });
  // Antiker-Schiebetür in der Öffnung, Vorderseite (+Z) zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, zFront, 0);

  // ------------------------------------------------------------------ Licht
  const lampPos = [
    [-4.0, 3.3, -3.0], [4.0, 3.3, -3.0],
    [-4.0, 3.3, 3.0], [4.0, 3.3, 3.0],
    [0, 3.3, 0], [0, 3.3, -3.7],
  ];
  lampPos.forEach((p, i) => {
    empty(`LAMP_${i + 1}`, p[0], p[1], p[2], 0, { color: '#8fd0ff', intensity: 7, distance: 11 });
  });

  // ------------------------------------------------------------------ Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
  };
  col('COL_boden', W, 0.2, D, 0, -0.1, 0);
  col('COL_decke', W, 0.3, D, 0, H + 0.15, 0);
  for (const s of [-1, 1]) {
    col(`COL_wand_${s < 0 ? 'links' : 'rechts'}`, T, H, D, s * (W / 2 + T / 2), H / 2, 0);
    col(`COL_wand_vorne_${s < 0 ? 'links' : 'rechts'}`, frontSide, H, T, s * frontSideC, H / 2, zFront);
    for (let i = 0; i < sideFins.length; i++) {
      const [a, b] = sideFins[i];
      col(`COL_wange_${s < 0 ? 'links' : 'rechts'}_${i}`, FIN, H, b - a, s * (W / 2 - FIN / 2), H / 2, (a + b) / 2);
    }
  }
  col('COL_wand_hinten', W + 2 * T, H, T, 0, H / 2, D / 2 + T / 2);
  col('COL_sturz_vorne', doorW, H - doorH, T, 0, doorH + (H - doorH) / 2, zFront);
  for (let i = 0; i < backFins.length; i++) {
    const [a, b] = backFins[i];
    col(`COL_wange_hinten_${i}`, b - a, H, FIN, (a + b) / 2, H / 2, D / 2 - FIN / 2);
  }
  // Pod-Volumenkörper (Maße des Objekts, Weltachsen getauscht)
  let ci = 0;
  for (const zc of sideBayList) {
    for (const s of [-1, 1]) {
      ci++;
      col(`COL_statispod_${ci}`, POD_T + 0.06, POD_H, POD_W + 0.06, s * podX, POD_H / 2, zc);
    }
  }
  for (const xc of backBayList) {
    ci++;
    col(`COL_statispod_${ci}`, POD_W + 0.06, POD_H, POD_T + 0.06, xc, POD_H / 2, D / 2 - POD_T / 2);
  }

  // ------------------------------------------------------------------ Animation (Status-/Lichtpuls)
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    const p = 0.5 + 0.5 * Math.sin(t * 1.1);
    mCyan.emissiveIntensity = 1.5 + p * 0.35;
    mAmber.emissiveIntensity = 1.15 + p * 0.55;
  };

  root.userData.raum = { id: 'ATL-039', breite: W, tiefe: D, hoehe: H, pods: podCount };
  return root;
}

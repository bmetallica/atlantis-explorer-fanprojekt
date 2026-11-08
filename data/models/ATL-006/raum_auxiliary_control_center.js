// Raum ATL-006: Hilfs-Kontrollzentrum (Inner City, Ebene 5).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Geschützter, fensterloser Notbetriebsraum: leere Hülle aus Boden, Wänden, Decke,
// Wandpaneelen, Lichtschlitzen, Deckenkassetten und vier schlanken Eckpfeilern.
// Keine Möbel – nur PLACE_-Punkte für Hilfs-Steuerkonsolen (OBJ-014),
// Alarmleuchten (OBJ-074) und die Antiker-Schiebetür (OBJ-091).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_auxiliary_control_center',
  art: 'Raum',
  masse: '10,2 m × 8,4 m (≈ 85,7 m²), lichte Höhe 3,8 m (Mindesthöhe für die 3,74-m-Türzarge)',
  wohin: 'Inner City, Ebene 5 – geschütztes Sekundär-Kontrollzentrum',
  benutzen: 'Sekundäre Kommandofunktion bei Störungen/Angriffen; Wandkonsolen (OBJ-014) werden als Objekte eingesetzt',
  lichter: '6 LAMP_ (eisblau #9fd8ff, Intensität 6–8, Distanz 7–9 m), bernsteinfarbene Notlichtkante',
  animation: 'Lichtschlitze und Notlichtkante atmen minimal; API schaltet Alarm-/Notbetriebsmodus',
  quelle: 'Rekonstruiert nach Raumbeschreibung ATL-006 und Referenzbild ref1.jpg (Atlantis, Staffel 4/5)',
};

export const varianten = [
  { label: 'Standard – Notbetrieb', opts: {} },
  { label: 'Alarmmodus (rote Wandakzente)', opts: { alarm: true } },
];

export function create(opts = {}) {
  // ------------------------------------------------------------------ Maße
  const W = 10.2;            // lichte Breite  (X)
  const D = 8.4;             // lichte Tiefe   (Z)
  const H = 3.8;             // lichte Höhe (3,74-m-Türzarge + Deckenaufbau)
  const T = 0.3;             // Wanddicke
  const DW = 2.4;            // Türöffnung Breite
  const DH = 3.0;            // Türöffnung Höhe

  const root = new THREE.Group();
  root.name = 'raum_auxiliary_control_center';

  // ------------------------------------------------------------------ Materialien
  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const glow = kit('glow');
  const amber = kit('amberGlow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6, roughness: 0.35,
  });

  // ------------------------------------------------------------------ Helfer
  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const dummy = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z, ry], i) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.instanceMatrix.needsUpdate = true;
    im.name = name;
    root.add(im);
    return im;
  };
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY || 0;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // ------------------------------------------------------------------ Boden
  box(W, 0.1, D, floorMat, 0, -0.05, 0, 'boden');
  // umlaufender Patina-Rand + Kupfer-Einfassung
  for (const s of [-1, 1]) {
    box(0.24, 0.014, D - 0.48, patina, s * (W / 2 - 0.12), 0.007, 0);
    box(W - 0.48, 0.014, 0.24, patina, 0, 0.007, s * (D / 2 - 0.12));
    box(0.05, 0.016, D - 0.48, copper, s * (W / 2 - 0.27), 0.008, 0);
    box(W - 0.48, 0.016, 0.05, copper, 0, 0.008, s * (D / 2 - 0.27));
  }
  // Schneeflocken-Intarsie (Kreis + sechs Äste) in der Raummitte
  const ring = add(new THREE.TorusGeometry(2.35, 0.045, 8, 48), copper, 0, 0.014, 0, 'boden_intarsie_ring');
  ring.rotation.x = -Math.PI / 2;
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    arms.push([Math.cos(a) * 1.15, 0.013, Math.sin(a) * 1.15, -a]);
  }
  inst(new THREE.BoxGeometry(2.0, 0.016, 0.07), copper, arms, 'boden_intarsie_aeste');
  const hex = add(new THREE.CylinderGeometry(0.62, 0.62, 0.016, 6), patina, 0, 0.013, 0, 'boden_intarsie_sechseck');
  hex.rotation.y = Math.PI / 6;

  // Bodenfugen im 1,2-m-Raster als kurze Einzelsegmente (jedes Segment bleibt vollständig
  // innerhalb der Bodenfläche – keine durchlaufenden Geometrien außerhalb der Hülle).
  const seamX = [], seamZ = [];
  for (let z = -D / 2 + 1.2; z < D / 2 - 0.6; z += 1.2) {
    for (let x = -W / 2 + 0.6; x < W / 2 - 0.6; x += 1.2) seamX.push([x, 0.004, z]);
  }
  for (let x = -W / 2 + 1.2; x < W / 2 - 0.6; x += 1.2) {
    for (let z = -D / 2 + 0.6; z < D / 2 - 0.6; z += 1.2) seamZ.push([x, 0.004, z]);
  }
  inst(new THREE.BoxGeometry(1.15, 0.006, 0.02), copper, seamX, 'boden_fugen_x');
  inst(new THREE.BoxGeometry(0.02, 0.006, 1.15), copper, seamZ, 'boden_fugen_z');

  // ------------------------------------------------------------------ Wände (Dicke 0,3)
  const zN = -D / 2 - T / 2;   // Wandmitte Nord (−Z, Haupteingang)
  const zS = D / 2 + T / 2;
  const xW = -W / 2 - T / 2;
  const xE = W / 2 + T / 2;

  // Nord: zwei Segmente links/rechts der 2,4-m-Öffnung + Sturz
  const segLen = (W / 2 + T) - DW / 2;              // 4,2 m je Seite
  box(segLen, H, T, wall, -(DW / 2 + segLen / 2), H / 2, zN, 'wand_nord_links');
  box(segLen, H, T, wall, (DW / 2 + segLen / 2), H / 2, zN, 'wand_nord_rechts');
  box(DW, H - DH, T, wall, 0, DH + (H - DH) / 2, zN, 'wand_nord_sturz');
  // Süd
  box(W + 2 * T, H, T, wall, 0, H / 2, zS, 'wand_sued');
  // West / Ost
  box(T, H, D + 2 * T, wall, xW, H / 2, 0, 'wand_west');
  box(T, H, D + 2 * T, wall, xE, H / 2, 0, 'wand_ost');

  // ------------------------------------------------------------------ Türzarge (3,34 × 3,74 m)
  const zFrame = -D / 2 + 0.06;
  for (const s of [-1, 1]) {
    box(0.14, 3.74, 0.12, copper, s * (DW / 2 + 0.07), 3.74 / 2, zFrame, 'tuerzarge_pfosten');
  }
  box(3.34, 0.16, 0.12, copper, 0, DH + 0.08, zFrame, 'tuerzarge_sturz');
  box(3.34, 0.06, 0.10, copper, 0, 0.03, zFrame, 'tuerzarge_sockel');

  // Sockelleisten und Gesimse (Bronze), Nordwand mit Tür-Aussparung
  box(segLen, 0.15, 0.05, copper, -(DW / 2 + segLen / 2), 0.075, -D / 2 + 0.025, 'sockel_nord_links');
  box(segLen, 0.15, 0.05, copper, (DW / 2 + segLen / 2), 0.075, -D / 2 + 0.025, 'sockel_nord_rechts');
  box(W, 0.15, 0.05, copper, 0, 0.075, D / 2 - 0.025, 'sockel_sued');
  box(0.05, 0.15, D, copper, -W / 2 + 0.025, 0.075, 0, 'sockel_west');
  box(0.05, 0.15, D, copper, W / 2 - 0.025, 0.075, 0, 'sockel_ost');
  const corniceY = H - 0.12;
  box(segLen, 0.10, 0.07, copper, -(DW / 2 + segLen / 2), corniceY, -D / 2 + 0.035, 'gesims_nord_links');
  box(segLen, 0.10, 0.07, copper, (DW / 2 + segLen / 2), corniceY, -D / 2 + 0.035, 'gesims_nord_rechts');
  box(W, 0.10, 0.07, copper, 0, corniceY, D / 2 - 0.035, 'gesims_sued');
  box(0.07, 0.10, D, copper, -W / 2 + 0.035, corniceY, 0, 'gesims_west');
  box(0.07, 0.10, D, copper, W / 2 - 0.035, corniceY, 0, 'gesims_ost');

  // Notlichtkante (bernstein) knapp unter dem Gesims
  const alarmY = H - 0.28;
  box(segLen, 0.05, 0.035, amber, -(DW / 2 + segLen / 2), alarmY, -D / 2 + 0.02, 'notlicht_nord_links');
  box(segLen, 0.05, 0.035, amber, (DW / 2 + segLen / 2), alarmY, -D / 2 + 0.02, 'notlicht_nord_rechts');
  box(W, 0.05, 0.035, amber, 0, alarmY, D / 2 - 0.02, 'notlicht_sued');
  box(0.035, 0.05, D, amber, -W / 2 + 0.02, alarmY, 0, 'notlicht_west');
  box(0.035, 0.05, D, amber, W / 2 - 0.02, alarmY, 0, 'notlicht_ost');

  // ------------------------------------------------------------------ Wandpaneele (Plant-ons)
  // Die Nordwand bleibt im Bereich x = ±2,4 m pannenfrei: dort schieben die Türflügel 1,2 m in die Wand.
  const wallDefs = [
    { id: 'nord', fixed: -D / 2, n: [0, 0, 1], rot: 0, axis: 'x', centers: [-4.8, -3.6, 3.6, 4.8] },
    { id: 'sued', fixed: D / 2, n: [0, 0, -1], rot: Math.PI, axis: 'x', centers: [-4.8, -3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6, 4.8] },
    { id: 'west', fixed: -W / 2, n: [1, 0, 0], rot: Math.PI / 2, axis: 'z', centers: [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6] },
    { id: 'ost', fixed: W / 2, n: [-1, 0, 0], rot: -Math.PI / 2, axis: 'z', centers: [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6] },
  ];
  const frames = [], infills = [], slots = [];
  const artH = { x: [], z: [] }, artV = { x: [], z: [] }, artS = { x: [], z: [] };
  for (const w of wallDefs) {
    w.centers.forEach((c, idx) => {
      const px = w.axis === 'x' ? c : w.fixed;
      const pz = w.axis === 'x' ? w.fixed : c;
      const nx = w.n[0], nz = w.n[2];
      frames.push([px + nx * 0.025, 1.55, pz + nz * 0.025, w.rot]);
      infills.push([px + nx * 0.045, 1.55, pz + nz * 0.045, w.rot]);
      if (idx % 2 === 0) {
        for (let k = 0; k < 4; k++) {
          slots.push([px + nx * 0.068, 0.82 + k * 0.46, pz + nz * 0.068, w.rot]);
        }
      }
      // fest eingelassene Statusgrafik (rechtwinklige Leiterlinien) im oberen Paneelbereich
      const ax = px + nx * 0.085, az = pz + nz * 0.085;
      if (w.axis === 'x') {
        artH.x.push([ax, 2.40, az]);
        artV.x.push([ax - 0.21, 2.53, az]);
        artV.x.push([ax + 0.21, 2.53, az]);
        artS.x.push([ax, 2.70, az]);
      } else {
        artH.z.push([ax, 2.40, az]);
        artV.z.push([ax, 2.53, az - 0.21]);
        artV.z.push([ax, 2.53, az + 0.21]);
        artS.z.push([ax, 2.70, az]);
      }
    });
  }
  inst(new THREE.BoxGeometry(1.14, 2.72, 0.05), copper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(1.0, 2.56, 0.035), wallDark, infills, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.055, 0.30, 0.03), lineGlow, slots, 'lichtschlitze');
  inst(new THREE.BoxGeometry(0.62, 0.03, 0.02), glow, artH.x, 'statusgrafik_quer_x');
  inst(new THREE.BoxGeometry(0.02, 0.03, 0.62), glow, artH.z, 'statusgrafik_quer_z');
  inst(new THREE.BoxGeometry(0.03, 0.26, 0.02), glow, artV.x, 'statusgrafik_hoch_x');
  inst(new THREE.BoxGeometry(0.02, 0.26, 0.03), glow, artV.z, 'statusgrafik_hoch_z');
  inst(new THREE.BoxGeometry(0.34, 0.03, 0.02), glow, artS.x, 'statusgrafik_kurz_x');
  inst(new THREE.BoxGeometry(0.02, 0.03, 0.34), glow, artS.z, 'statusgrafik_kurz_z');

  // ------------------------------------------------------------------ Eckpfeiler (schlank, leicht geneigt)
  const pillarPos = [[-4.75, -3.85], [4.75, -3.85], [-4.75, 3.85], [4.75, 3.85]];
  for (const [px, pz] of pillarPos) {
    const p = box(0.24, H - 0.12, 0.24, pillarMat, px, (H - 0.12) / 2, pz, 'pfeiler');
    p.rotation.z = (px < 0 ? 1 : -1) * 0.055;
    box(0.42, 0.12, 0.42, copper, px, 0.06, pz, 'pfeiler_basis');
    box(0.34, 0.10, 0.34, copper, px, H - 0.14, pz, 'pfeiler_kopf');
  }

  // ------------------------------------------------------------------ Decke
  box(W + 2 * T, 0.3, D + 2 * T, ceilMat, 0, H + 0.15, 0, 'decke_hauptebene');
  // abgehängte Graphitfelder
  const kass = [];
  for (let x = -W / 2 + 1.8; x < W / 2 - 1.0; x += 2.4) {
    for (let z = -D / 2 + 1.2; z < D / 2 - 0.8; z += 2.4) kass.push([x, H - 0.06, z, 0]);
  }
  inst(new THREE.BoxGeometry(2.0, 0.08, 2.0), wallDark, kass, 'decke_kassetten');
  // indirekte Lichtbänder entlang der Deckenkanten
  box(0.08, 0.05, D - 0.6, glow, -W / 2 + 0.42, H - 0.055, 0, 'decke_lichtband_west');
  box(0.08, 0.05, D - 0.6, glow, W / 2 - 0.42, H - 0.055, 0, 'decke_lichtband_ost');
  box(W - 0.6, 0.05, 0.08, glow, 0, H - 0.055, -D / 2 + 0.42, 'decke_lichtband_nord');
  box(W - 0.6, 0.05, 0.08, glow, 0, H - 0.055, D / 2 - 0.42, 'decke_lichtband_sued');
  // Mittelband als Träger für die Leuchten
  box(0.16, 0.06, D - 0.6, copper, 0, H - 0.06, 0, 'decke_mittelträger');

  // ------------------------------------------------------------------ Tür, Anschluss
  empty('DOOR_eingang', 0, 0, zN, Math.PI, { breite: DW, hoehe: DH, ziel: 'Inner City – Gang Ebene 5' });
  // Antiker-Schiebetür: Ursprung in der Wandmitte, Vorderseite (+Z) zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, zN, 0);

  // ------------------------------------------------------------------ Objektplätze
  // Hilfs-Steuerkonsolen (2,62 × 2,39 × 1,10 m): Rücken 0,17 m vor der Wand
  const konsolen = [
    { x: -3.75, z: -D / 2 + 0.72, ry: 0 },               // Nord links (Türschwinge frei)
    { x: 3.75, z: -D / 2 + 0.72, ry: 0 },                // Nord rechts
    { x: -3.40, z: D / 2 - 0.72, ry: Math.PI },          // Süd links
    { x: 3.40, z: D / 2 - 0.72, ry: Math.PI },           // Süd rechts
    { x: -W / 2 + 0.72, z: 0, ry: Math.PI / 2 },         // West (+Z zeigt nach +X, in den Raum)
    { x: W / 2 - 0.72, z: 0, ry: -Math.PI / 2 },         // Ost (+Z zeigt nach −X, in den Raum)
    { x: 0, z: 0.90, ry: 0 },                            // zentrales Steuerpult (Hilfsanwahl)
  ];
  konsolen.forEach((k, i) => {
    empty(i === 0 ? 'PLACE_OBJ-014' : `PLACE_OBJ-014_${i + 1}`, k.x, 0, k.z, k.ry);
  });
  // Alarmleuchten (0,80 × 0,12 × 0,12 m) flach an der Wandinnenfläche, Vorderseite in den Raum
  const beacons = [
    { x: 0.0, y: 3.45, z: -D / 2 + 0.06, ry: 0 },                 // Nord, über der Türzarge
    { x: 0.0, y: 3.15, z: D / 2 - 0.06, ry: Math.PI },           // Süd, Mitte
    { x: -W / 2 + 0.06, y: 3.15, z: -2.4, ry: Math.PI / 2 },     // West
    { x: W / 2 - 0.06, y: 3.15, z: 2.4, ry: -Math.PI / 2 },      // Ost
  ];
  beacons.forEach((b, i) => {
    empty(i === 0 ? 'PLACE_OBJ-074' : `PLACE_OBJ-074_${i + 1}`, b.x, b.y, b.z, b.ry);
  });

  // ------------------------------------------------------------------ Lichter
  const lamps = [
    [-3.2, H - 0.55, -2.6, 8, 9],
    [3.2, H - 0.55, -2.6, 8, 9],
    [-3.2, H - 0.55, 2.6, 8, 9],
    [3.2, H - 0.55, 2.6, 8, 9],
    [0, H - 0.55, -3.0, 6, 7],
    [0, H - 0.55, 3.0, 6, 7],
  ];
  lamps.forEach((l, i) => {
    empty(`LAMP_${i + 1}`, l[0], l[1], l[2], 0, { color: '#9fd8ff', intensity: l[3], distance: l[4] });
    if (i < 4) {
      const pl = new THREE.PointLight(0x9fd8ff, 22, 9, 2);
      pl.position.set(l[0], l[1] - 0.2, l[2]);
      root.add(pl);
    }
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
  col('COL_wand_nord_links', segLen, H, T, -(DW / 2 + segLen / 2), H / 2, zN);
  col('COL_wand_nord_rechts', segLen, H, T, (DW / 2 + segLen / 2), H / 2, zN);
  col('COL_wand_nord_sturz', DW, H - DH, T, 0, DH + (H - DH) / 2, zN);
  col('COL_wand_sued', W + 2 * T, H, T, 0, H / 2, zS);
  col('COL_wand_west', T, H, D + 2 * T, xW, H / 2, 0);
  col('COL_wand_ost', T, H, D + 2 * T, xE, H / 2, 0);
  for (const [px, pz] of pillarPos) col('COL_pfeiler', 0.30, H, 0.30, px, H / 2, pz);

  // ------------------------------------------------------------------ Animation & API
  let t = 0, last = null, alarm = !!opts.alarm, notbetrieb = true;
  root.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.45 + Math.sin(t * 0.9) * 0.14;
    if (alarm) {
      amber.emissive.setHex(0xff5522);
      amber.emissiveIntensity = 1.1 + Math.abs(Math.sin(t * 2.4)) * 1.6;
    } else {
      amber.emissive.setHex(0xffb04a);
      amber.emissiveIntensity = notbetrieb ? 0.75 : 0.25;
    }
  };

  root.userData.api = {
    setAlarm(an = true) { alarm = !!an; },
    setNotbetrieb(an = true) { notbetrieb = !!an; },
    get zustand() { return { alarm, notbetrieb }; },
  };

  root.userData.actions = [
    {
      id: 'notbetrieb',
      label: 'Autonomen Notbetrieb aktivieren',
      run() { notbetrieb = true; alarm = false; return { notbetrieb, alarm }; },
    },
    {
      id: 'alarm',
      label: 'Alarmmodus auslösen (rote Notlichtkante)',
      run() { alarm = true; notbetrieb = false; return { notbetrieb, alarm }; },
    },
    {
      id: 'beruhigen',
      label: 'Alarm zurücknehmen',
      run() { alarm = false; notbetrieb = true; return { notbetrieb, alarm }; },
    },
  ];

  root.userData.raum = {
    id: 'ATL-006',
    name: 'raum_auxiliary_control_center',
    breite: W, tiefe: D, hoehe: H,
    dachgeschoss: false,
    fenster: false,
  };
  return root;
}

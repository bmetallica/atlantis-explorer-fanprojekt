// Raum ATL-001: Stargate Operations („Central Control“) – Torhalle, große Treppe, obere Ebene mit offenem Kontrollraum.
// Nach den Produktionsplänen (Gateroom-Map, Setplan „Control Room“ S4) und Screencaps.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte des Hallenbodens (y = 0). Das Stargate steht am +Z-Ende vor dem
// Buntglasfenster und blickt nach −Z auf die Treppe; die Treppe steigt nach −Z zur oberen Ebene (y = 4,5).
// Obere Ebene: rechts (+X) der Kontrollraum – zur Halle hin nur mit Geländer offen; links (−X) das Foyer mit
// dem Anschluss zum runden Konferenzraum (ATL-003). Unter der oberen Ebene die untere Galerie mit Seitenausgängen.
// Anschlüsse: DOOR_konferenz (offen, Multipanel-Türen des Konferenzraums), DOOR_buero (Steg zum Büro ATL-004/005),
// DOOR_balkon (Glastür zum Balkon ATL-048), DOOR_unten_links / DOOR_unten_rechts (Korridore), DOOR_jumperbay (Deckenöffnung).
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_stargate_operations',
  art: 'Raum (Komplex: Torhalle + Kontrollraum)',
  masse: '22 × 13 × 36 m (Halle 22 × 24 m, 13 m hoch; obere Ebene auf 4,5 m, 22 × 12 m)',
  wohin: 'Zentralturm, Stargate Operations; schließt ATL-001, ATL-002 und ATL-045 ein',
  benutzen: 'keine eigenen – Stargate, DHD, Konsolen kommen als Objekte an PLACE_-Punkte',
  lichter: 'Tageslicht durch Buntglas und Seitenfenster (LAMP_ warm), Konsolenbereich eisblau',
  animation: 'Lichtschlitze atmen leicht',
  quelle: 'selbst gebaut nach Gateroom-Map, Setplan „Control Room“ (Adrift/Lifeline) und Screencaps',
};

// ---------------------------------------------------------------- Maße
const HX = 11;            // halbe Breite (x = −11 … 11)
const ZF = -6;            // Galeriekante (Front der oberen Ebene)
const ZB = -18;           // Rückwand
const ZG = 18;            // Fensterwand hinter dem Tor
const HH = 13;            // Hallenhöhe
const UE = 4.5;           // obere Ebene (Oberkante)
const UH = 4.5;           // lichte Höhe auf der oberen Ebene
const T = 0.3;            // Wanddicke
const CZ0 = 15.1, CX1 = 6;  // Torende: 60°-Schrägen von (±HX | CZ0) zur Fensterwand (±CX1 | ZG)
const cLen = Math.hypot(HX - CX1, ZG - CZ0);
const SW = 7;             // Treppenbreite
const NS = 18;            // Stufen (18 × 0,25 m = 4,5 m)
const TR = 0.45;          // Auftritt
const Z_STAIR_BOTTOM = ZF + NS * TR;   // 2,1

function stainedGlass() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 1024); grd.addColorStop(0, '#fff6d8'); grd.addColorStop(1, '#f0d89a');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 1024);
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // stilisierte Turmsilhouette (Atlantis) aus Glasfeldern in Gold, Bernstein, Weiß
  const cols = ['#e8b04a', '#f4cf7a', '#fbe9b8', '#d9963a', '#ffffff', '#c9d8e0'];
  for (let y = 0; y < 1024; y += 32) for (let x = 0; x < 512; x += 32) {
    const center = Math.abs(x + 16 - 256) < 70 + (1024 - y) * 0.08;
    g.fillStyle = center ? cols[Math.floor(r() * 4)] : cols[3 + Math.floor(r() * 3)];
    g.globalAlpha = center ? 0.95 : 0.55; g.fillRect(x + 2, y + 2, 28, 28);
  }
  g.globalAlpha = 1; g.strokeStyle = '#4a3a28'; g.lineWidth = 6;
  for (let x = 0; x <= 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 256) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function create() {
  const root = new THREE.Group();
  root.name = 'raum_stargate_operations';
  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper'), pillar = kit('pillar');
  const floorMat = kit('floor'), floorUp = kit('floorUpper'), ceiling = kit('ceiling'), stair = kit('stair');
  const rail = kit('rail'), glass = kit('glass'), glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.45 });
  const sgTex = stainedGlass();
  const buntglas = new THREE.MeshStandardMaterial({ name: 'buntglas', map: sgTex, emissive: 0xffffff, emissiveMap: sgTex, emissiveIntensity: 0.9, side: THREE.DoubleSide });
  const lineGlow = new THREE.MeshStandardMaterial({ name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6 });
  const o3 = new THREE.Object3D();

  const add = (geo, mat, x, y, z, name) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (name) m.name = name; root.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z, ry = 0], n) => { o3.position.set(x, y, z); o3.rotation.set(0, ry, 0); o3.updateMatrix(); im.setMatrixAt(n, o3.matrix); });
    im.count = list.length; im.name = name; root.add(im); return im;
  };
  const wallHoles = (u0, u1, h, holes, mat, name) => {   // Wandfläche (u entlang der Wand, y hoch) mit Rechtecköffnungen
    const sh = new THREE.Shape(); sh.moveTo(u0, 0); sh.lineTo(u1, 0); sh.lineTo(u1, h); sh.lineTo(u0, h); sh.closePath();
    for (const [a0, a1, y0, y1] of holes) { const p = new THREE.Path(); p.moveTo(a0, y0); p.lineTo(a0, y1); p.lineTo(a1, y1); p.lineTo(a1, y0); p.closePath(); sh.holes.push(p); }
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false }), mat); m.name = name; root.add(m); return m;
  };
  const empty = (name, x, y, z, rotY = 0, userData) => { const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); o.rotation.y = rotY; if (userData) o.userData = userData; root.add(o); return o; };

  // ================================================================ Böden
  box(2 * HX, 0.3, ZG - ZB, floorMat, 0, -0.15, (ZG + ZB) / 2, 'boden_halle');
  for (const s of [-1, 1]) box(0.3, 0.012, ZG - ZB, patina, s * (HX - 0.15), 0.006, (ZG + ZB) / 2);
  // runde Intarsie vor dem Tor (Kupfer-Ring + Schneeflocken-Strahlen)
  const ring = add(new THREE.RingGeometry(5.0, 5.25, 96), copper, 0, 0.008, 9.5); ring.rotation.x = -Math.PI / 2;
  const ring2 = add(new THREE.RingGeometry(3.2, 3.35, 96), copper, 0, 0.008, 9.5); ring2.rotation.x = -Math.PI / 2;
  const strahlen = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; strahlen.push([Math.cos(a) * 4.2, 0.007, 9.5 + Math.sin(a) * 4.2, -a]); }
  const st = inst(new THREE.BoxGeometry(1.6, 0.01, 0.08), copper, strahlen, 'boden_strahlen');
  // obere Ebene (Platte, Unterseite = Decke der unteren Galerie)
  box(2 * HX, 0.4, ZF - ZB, floorUp, 0, UE - 0.2, (ZF + ZB) / 2, 'boden_oben');
  box(2 * HX, 0.012, 0.25, copper, 0, UE + 0.006, ZF - 0.13);

  // ================================================================ große Treppe (Hallenboden → obere Ebene)
  const steps = [];
  for (let i = 0; i < NS; i++) steps.push([0, (i + 0.5) * 0.25, Z_STAIR_BOTTOM - (i + 0.5) * TR]);
  const stufen = new THREE.InstancedMesh(new THREE.BoxGeometry(SW, 0.25, TR), stair, NS);
  steps.forEach(([x, , z], n) => { const h = (n + 1) * 0.25; o3.position.set(x, h / 2, z); o3.scale.set(1, h / 0.25, 1); o3.rotation.set(0, 0, 0); o3.updateMatrix(); stufen.setMatrixAt(n, o3.matrix); });
  o3.scale.set(1, 1, 1); stufen.name = 'treppe'; root.add(stufen);
  const kanten = [];
  for (let i = 0; i < NS; i++) kanten.push([0, (i + 1) * 0.25 + 0.005, Z_STAIR_BOTTOM - i * TR - 0.04]);
  inst(new THREE.BoxGeometry(SW - 0.2, 0.012, 0.06), lineGlow, kanten, 'treppe_lichtkanten');
  // Treppenwangen mit Geländer
  const len = Math.hypot(NS * TR, UE), ang = Math.atan2(UE, NS * TR);
  for (const s of [-1, 1]) {
    const w = box(0.3, 0.6, len, copper, s * (SW / 2 + 0.15), UE / 2 + 0.1, (Z_STAIR_BOTTOM + ZF) / 2, 'treppe_wange');
    w.rotation.x = ang;
    const g = box(0.08, 0.08, len, rail, s * (SW / 2 + 0.15), UE / 2 + 1.15, (Z_STAIR_BOTTOM + ZF) / 2, 'treppe_handlauf');
    g.rotation.x = ang;
  }

  // ================================================================ Wände der Halle
  const panels = [], slots = [];
  for (const s of [-1, 1]) {
    // Seitenwand mit Fensterband (z 0–14, y 6–11) und Türöffnungen (unten z = −12; oben links −12, rechts −15,5)
    const up = s < 0 ? [-13.2, -10.8] : [-16.7, -14.3];
    const wm = wallHoles(ZB, ZG, HH, [[0, 14, 6, 11], [-13.2, -10.8, 0.02, 3], [up[0], up[1], UE, UE + 3]], wall, 'wand_seite');
    wm.rotation.y = -Math.PI / 2; wm.position.x = s > 0 ? HX + T : -HX;
    for (let z = 0.6; z < 14; z += 2.8) {                                     // Fenster mit Bronzerahmen
      box(0.06, 4.6, 2.4, glass, s * (HX + 0.02), 8.5, z + 1.2, 'fenster');
      box(0.1, 4.8, 0.14, copper, s * (HX - 0.03), 8.5, z);
    }
    box(0.1, 4.8, 0.14, copper, s * (HX - 0.03), 8.5, 14);
    for (const y of [6.05, 10.95]) box(0.12, 0.12, 14, copper, s * (HX - 0.04), y, 7);
    // Wandfelder unten: Zierpaneele + Lichtschlitze
    for (let z = ZB + 1.2; z < CZ0 - 0.6; z += 2.4) {
      const yb = z < ZF ? 0 : 0;
      if (Math.abs(z + 12) < 1.5) continue;
      if (Math.round((z - ZB) / 2.4) % 2) panels.push([s * (HX - 0.03), yb + 2.3, z, Math.PI / 2]);
      else for (let k = 0; k < 4; k++) slots.push([s * (HX - 0.012), 1.4 + k * 0.42, z, Math.PI / 2]);
    }
    box(0.04, 0.15, ZG - ZB, copper, s * (HX - 0.02), 0.075, (ZG + ZB) / 2);   // Sockelleiste
  }
  inst(new THREE.BoxGeometry(1.0, 3.2, 0.035), wallDark, panels, 'paneele');
  const slotMesh = inst(new THREE.BoxGeometry(0.06, 0.32, 0.02), lineGlow, slots, 'lichtschlitze');

  // Fensterwand hinter dem Tor: Buntglas 11 × 11 m, seitlich massiv
  box(12, 11, 0.06, buntglas, 0, 5.5, ZG - 0.05, 'buntglas');
  for (let x = -6; x <= 6; x += 3) box(0.16, 11, 0.2, copper, x, 5.5, ZG - 0.1);
  for (const y of [0.1, 3.8, 7.5, 11]) box(12.2, 0.16, 0.2, copper, 0, y, ZG - 0.1);
  for (const s of [-1, 1]) box(HX - 6 + T, HH, T, wall, s * (6 + (HX - 6 + T) / 2), HH / 2, ZG + T / 2, 'wand_hinten_tor');
  box(12, HH - 11, T, wall, 0, 11 + (HH - 11) / 2, ZG + T / 2);
  // Torende polygonal (60°-Schrägen wie in der Gateroom-Map): von (±11 | 15,1) zur Fensterwand (±6 | 18)
  for (const s of [-1, 1]) {
    const c = box(cLen, HH, T, wall, s * (HX + CX1) / 2, HH / 2, (CZ0 + ZG) / 2, 'wand_schraege');
    c.rotation.y = Math.atan2(-(ZG - CZ0), -s * (HX - CX1));
    const nx = -s * (ZG - CZ0) / cLen * 0.17, nz = -(HX - CX1) / cLen * 0.17;       // Innennormale × Abstand
    box(cLen, 0.15, 0.04, copper, s * (HX + CX1) / 2 + nx, 0.075, (CZ0 + ZG) / 2 + nz, 'sockel_schraege').rotation.y = c.rotation.y;
    box(0.5, 4.2, 0.03, lineGlow, s * (HX + CX1) / 2 + nx, 2.6, (CZ0 + ZG) / 2 + nz, 'lichtschlitz_schraege').rotation.y = c.rotation.y;
  }
  // schräge Monumentalpfeiler zu beiden Seiten des Tors (wie in der Serie)
  for (const s of [-1, 1]) for (const z of [10.5, 15.5]) {
    const p = box(1.4, 12, 1.1, pillar, s * 7.6, 6, z, 'pfeiler');
    p.rotation.z = -s * 0.2;
    box(1.8, 0.6, 1.5, copper, s * 6.5, 0.3, z, 'pfeiler_fuss');
  }

  // Rückwand (z = −18) über die ganze Höhe, mit Balkontür oben rechts und Glasband
  const rw = wallHoles(-HX - T, HX + T, HH, [[4.8, 7.2, UE, UE + 3]], wall, 'wand_rueck');
  rw.position.z = ZB - T;
  box(2.4, 3, 0.06, glass, 6, UE + 1.5, ZB - 0.05, 'balkon_glastuer');

  // ================================================================ untere Galerie (unter der oberen Ebene)
  const ug = [];
  for (let x = -9; x <= 9; x += 4.5) ug.push([x, UE / 2 - 0.2, ZF - 0.5]);
  inst(new THREE.BoxGeometry(0.6, UE - 0.4, 0.6), pillar, ug.filter(([x]) => Math.abs(x) > SW / 2 + 0.5), 'galerie_saeulen');
  box(2 * HX, 0.5, 0.5, copper, 0, UE - 0.6, ZF - 0.25, 'galerie_sturz');

  // ================================================================ obere Ebene: Geländer, Kontrollraum, Foyer
  for (const [x0, x1] of [[-HX, -SW / 2], [SW / 2, HX]]) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    box(w, 0.08, 0.08, rail, cx, UE + 1.1, ZF + 0.05, 'gelaender');
    box(w, 0.05, 0.05, rail, cx, UE + 0.55, ZF + 0.05);
    box(w, 0.9, 0.03, glass, cx, UE + 0.6, ZF + 0.05, 'gelaender_glas');
    const posts = [];
    for (let x = x0 + 0.1; x <= x1; x += 1.2) posts.push([x, UE + 0.55, ZF + 0.05]);
    inst(new THREE.BoxGeometry(0.06, 1.1, 0.06), rail, posts, 'gelaender_pfosten');
  }
  // Trennwand Foyer / Kontrollraum (halbhoch mit Säulen), Kontrollraum-Podest mit Lichtkante
  box(0.3, 1.2, 6, wallDark, 0.8, UE + 0.6, -15, 'trennwand');
  box(9.4, 0.25, 7.5, floorUp, 6.2, UE + 0.125, -12.6, 'kontrollraum_podest');
  box(9.4, 0.03, 0.08, lineGlow, 6.2, UE + 0.25, -8.85);
  for (const [x, z] of [[0.8, -11.6], [0.8, -18 + 0.4], [HX - 0.4, -11.6]]) box(0.5, UH, 0.5, pillar, x, UE + UH / 2, z, 'saeule_oben');
  // Decke über der oberen Ebene (polygonal, mit Lichtbändern)
  box(2 * HX, 0.3, ZF - ZB, ceiling, 0, UE + UH + 0.15, (ZF + ZB) / 2, 'decke_oben');
  for (const z of [-8, -12, -16]) box(2 * HX - 2, 0.03, 0.1, glow, 0, UE + UH - 0.02, z, 'decke_lichtband');
  box(2 * HX, HH - UE - UH, 0.5, wall, 0, UE + UH + (HH - UE - UH) / 2, ZF, 'galerie_ueberbau');

  // Hallendecke mit runder Öffnung zum Jumper-Hangar
  const dShape = new THREE.Shape(); dShape.moveTo(-HX, ZF); dShape.lineTo(HX, ZF); dShape.lineTo(HX, ZG); dShape.lineTo(-HX, ZG); dShape.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 4, 4.2, 0, Math.PI * 2, true); dShape.holes.push(hole);
  const dGeo = new THREE.ExtrudeGeometry(dShape, { depth: 0.4, bevelEnabled: false, curveSegments: 48 });
  dGeo.rotateX(Math.PI / 2);
  const decke = add(dGeo, ceiling, 0, HH + 0.4, 0, 'decke_halle');
  const dRing = add(new THREE.TorusGeometry(4.25, 0.12, 8, 64), copper, 0, HH, 4, 'decke_ring'); dRing.rotation.x = Math.PI / 2;
  const dGlow = add(new THREE.TorusGeometry(4.05, 0.04, 6, 64), glow, 0, HH - 0.1, 4, 'decke_ring_licht'); dGlow.rotation.x = Math.PI / 2;

  // ================================================================ Türöffnungen, Anschlüsse
  // Seitenausgänge der unteren Galerie (x = ±11, z = −12): Wand dort durch Türzarge ersetzt (Öffnung 2,4 × 3)
  empty('DOOR_unten_links', -HX - T / 2, 0, -12, -Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Korridor (ATL-049)' });
  empty('DOOR_unten_rechts', HX + T / 2, 0, -12, Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Korridor (ATL-049)' });
  empty('DOOR_konferenz', -HX - T / 2, UE, -12, -Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Konferenzraum ATL-003 (DOOR_kontrollraum), offene Multipanel-Tür' });
  empty('DOOR_buero', HX + T / 2, UE, -15.5, Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Steg zum Büro der Expeditionsleitung ATL-004/ATL-005' });
  empty('DOOR_balkon', 6, UE, ZB - T / 2, Math.PI, { breite: 2.4, hoehe: 3, ziel: 'Balkon ATL-048 (Glastür)' });
  empty('DOOR_jumperbay', 0, HH, 4, 0, { breite: 8.4, hoehe: 0, ziel: 'Jumper-Hangar ATL-040 (Bodenluke über der Halle)' });

  // ================================================================ Objektplätze
  const P = (id, x, y, z, ry) => empty(`PLACE_${id}`, x, y, z, ry);
  P('OBJ-001', 0, 0, 13, Math.PI);                   // Stargate vor dem Buntglas, blickt zur Treppe
  P('OBJ-091', -HX - T / 2, 0, -12, Math.PI / 2);     // Türen in der unteren Galerie (Vorderseite in die Halle)
  P('OBJ-091_2', HX + T / 2, 0, -12, -Math.PI / 2);
  P('OBJ-091_3', HX + T / 2, UE, -15.5, -Math.PI / 2); // Tür zum Steg
  P('OBJ-052', -HX, 1.2, -10.3, Math.PI / 2);         // Türpaneele
  P('OBJ-052_2', HX, 1.2, -13.7, -Math.PI / 2);
  P('OBJ-052_3', HX, UE + 1.2, -13.8, -Math.PI / 2);
  // Kontrollraum: Operatoren stehen auf der −Z-Seite und blicken zur Halle/zum Tor
  P('OBJ-002', 3.6, UE + 0.25, -10.2, Math.PI);       // DHD-Pult
  P('OBJ-012', 6.4, UE + 0.25, -10.2, Math.PI);       // Sensorkonsole
  P('OBJ-012_2', 9.2, UE + 0.25, -11.4, Math.PI * 0.85);
  P('OBJ-003', 6.4, UE + 0.25, -15.8, 0);            // Sensor-Display hinter den Konsolen
  P('OBJ-073', 6.4, UE + 0.25, -13.2, 0);            // Kartentisch
  P('OBJ-048', 3.2, UE + 0.25 + 1.0, -10.0, Math.PI);  // Steuerkristall im DHD-Pult
  P('OBJ-069', 4.0, UE + 0.25 + 1.02, -10.35, Math.PI); // Laptop auf dem Pult
  P('OBJ-056', 6.8, UE + 0.25 + 0.96, -10.35, Math.PI); // Datenpad auf der Sensorkonsole
  P('OBJ-044', 10.2, UE, -17.2, -Math.PI / 4);        // Schildemitter in der Ecke
  P('OBJ-055', 2.0, UE, -17.0, Math.PI / 6);          // Tarnfeld-Generator
  P('OBJ-051', 1.2, UE + 1.2, ZB, 0);                 // biometrischer Wandleser
  P('OBJ-074', 3.0, UE + 3.6, ZB, 0);                 // Alarmleuchten
  P('OBJ-074_2', -HX, 4.0, 4, Math.PI / 2);
  P('OBJ-074_3', HX, 4.0, 4, -Math.PI / 2);
  // Foyer oben + untere Galerie
  P('OBJ-043', -9.2, UE, -16.8, Math.PI / 4);         // Transporter oben (Foyer)
  P('OBJ-043_2', -8.8, 0, -16.6, Math.PI / 4);        // Transporter in der unteren Galerie
  // Halle: Ausrüstung neben dem Tor (Einsatzbereitschaft)
  P('OBJ-080', -9.0, 0, 3.0, Math.PI / 2);
  P('OBJ-080_2', -9.0, 0, 4.0, Math.PI / 2);
  P('OBJ-062', -9.0, 0.36, 3.0, Math.PI / 2);
  P('OBJ-064', -9.4, 0, 5.6, Math.PI / 2);
  P('OBJ-051_2', HX, 1.2, -1.0, -Math.PI / 2);
  // Wandleuchten Halle (2,2 m) und obere Ebene
  let n = 0;
  for (const s of [-1, 1]) for (let z = -3.6; z < 14; z += 4.8) { n++; P(n === 1 ? 'OBJ-053' : `OBJ-053_${n}`, s * HX, 2.2, z, s < 0 ? Math.PI / 2 : -Math.PI / 2); }
  for (const x of [-7, -3]) { n++; P(`OBJ-053_${n}`, x, UE + 2.2, ZB, 0); }

  // ================================================================ Licht
  const L = (name, x, y, z, color, intensity, distance) => empty(name, x, y, z, 0, { color, intensity, distance });
  L('LAMP_buntglas', 0, 7, 15, '#ffe2a8', 15, 22);
  L('LAMP_halle', 0, 9, 4, '#fff0d8', 12, 20);
  L('LAMP_halle_links', -8, 6, 0, '#cfe6ff', 8, 12);
  L('LAMP_halle_rechts', 8, 6, 0, '#cfe6ff', 8, 12);
  L('LAMP_kontrollraum', 6, UE + 3.6, -12, '#9fd8ff', 10, 12);
  L('LAMP_foyer', -6, UE + 3.6, -12, '#ffd8a0', 6, 10);
  L('LAMP_treppe', 0, 7.5, -2, '#fff0d8', 10, 14);
  L('LAMP_galerie_l', -7, 3.4, -12, '#9fd8ff', 6, 10);
  L('LAMP_galerie_r', 7, 3.4, -12, '#9fd8ff', 6, 12);

  // ================================================================ Kollision
  const col = (name, w, h, d, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d)); m.name = name; m.position.set(x, y, z); m.rotation.x = rx; m.visible = false; root.add(m); return m; };
  col('COL_boden', 2 * HX + 2 * T, 0.3, ZG - ZB + 2 * T, 0, -0.15, (ZG + ZB) / 2);
  col('COL_obere_ebene', 2 * HX, 0.4, ZF - ZB, 0, UE - 0.2, (ZF + ZB) / 2);
  col('COL_treppe', SW, 0.3, len, 0, UE / 2 - 0.1, (Z_STAIR_BOTTOM + ZF) / 2, ang);
  for (const s of [-1, 1]) {
    const nm = s < 0 ? 'links' : 'rechts', x = s * (HX + T / 2);
    const seg = s < 0
      ? [[-10.8, ZG, 0, HH], [ZB, -13.2, 0, HH], [-13.2, -10.8, 3, UE], [-13.2, -10.8, UE + 3, HH]]
      : [[-10.8, ZG, 0, HH], [-13.2, -10.8, 3, HH], [-14.3, -13.2, 0, HH], [-16.7, -14.3, 0, UE], [-16.7, -14.3, UE + 3, HH], [ZB, -16.7, 0, HH]];
    seg.forEach(([z0, z1, y0, y1], k) => col(`COL_wand_${nm}_${k + 1}`, T, y1 - y0, z1 - z0, x, (y0 + y1) / 2, (z0 + z1) / 2));
    col(`COL_wange_${nm}`, 0.3, 1.2, len, s * (SW / 2 + 0.15), UE / 2 + 0.6, (Z_STAIR_BOTTOM + ZF) / 2, ang);
  }
  for (const [x0, x1, y0, y1] of [[-HX - T, 4.8, 0, HH], [7.2, HX + T, 0, HH], [4.8, 7.2, 0, UE], [4.8, 7.2, UE + 3, HH]])
    col(`COL_wand_rueck_${x0 < 0 ? 'a' : y0 > 0 ? 'c' : x0 > 5 ? 'b' : 'd'}`, x1 - x0, y1 - y0, T, (x0 + x1) / 2, (y0 + y1) / 2, ZB - T / 2);
  for (const s of [-1, 1]) { const m = col(`COL_schraege_${s < 0 ? 'l' : 'r'}`, Math.hypot(HX - 6, ZG - 15.1), HH, T, s * (HX + 6) / 2, HH / 2, (15.1 + ZG) / 2); m.rotation.y = Math.atan2(-(ZG - 15.1), -s * (HX - 6)); }
  col('COL_wand_tor', 2 * HX + 2 * T, HH, T, 0, HH / 2, ZG + T / 2);
  col('COL_gelaender_links', HX - SW / 2, 1.2, 0.2, -(HX + SW / 2) / 2, UE + 0.6, ZF + 0.05);
  col('COL_gelaender_rechts', HX - SW / 2, 1.2, 0.2, (HX + SW / 2) / 2, UE + 0.6, ZF + 0.05);
  col('COL_decke_oben', 2 * HX, 0.3, ZF - ZB, 0, UE + UH + 0.15, (ZF + ZB) / 2);
  for (const s of [-1, 1]) for (const z of [10.5, 15.5]) col(`COL_pfeiler_${s < 0 ? 'l' : 'r'}_${z}`, 2.6, HH, 1.4, s * 7.6, HH / 2, z);
  col('COL_podest', 9.4, 0.25, 7.5, 6.2, UE + 0.125, -12.6);

  // ================================================================ Lichtatmen
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.8) * 0.12;
  };
  root.userData.raum = { id: 'ATL-001', enthaelt: ['ATL-001', 'ATL-002', 'ATL-045'] };
  return root;
}

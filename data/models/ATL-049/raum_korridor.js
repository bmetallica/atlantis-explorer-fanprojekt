// Raum ATL-049: Modularer Korridor von Atlantis (Vorlage für alle Räume).
// 1 Einheit = 1 m, +Y oben. Ursprung = Bodenmitte am Anfang des Moduls (Anschluss DOOR_anfang bei z = 0),
// der Korridor verläuft nach +Z. Leere Hülle: keine Objekte, nur PLACE_-Punkte für Türpaneele und Wandleuchten.
//
// create({ laenge, variante, seitentuer })
//   laenge     Länge in m (wird auf 2,4-m-Felder gerundet), Standard 9,6
//   variante   'gerade' (Standard) | 'ende' (Abschluss mit Tür) | 't' (seitlicher Abzweig rechts in der Mitte)
//   seitentuer true = Türöffnung (2,4 × 3 m) links in der Mitte
// Anschlüsse: DOOR_anfang (z = 0, zeigt nach −Z), DOOR_ende (z = Länge, zeigt nach +Z), ggf. DOOR_abzweig / DOOR_seite.
// Module werden aneinandergereiht, indem DOOR_ende des einen auf DOOR_anfang des nächsten gelegt wird.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_korridor',
  art: 'Raum (Modul)',
  masse: '3.6 m lichte Breite × 4.0 m Höhe × Länge frei (Standard 9.6 m)',
  wohin: 'überall als Verbindung zwischen Räumen; aneinanderreihbar über DOOR_ende → DOOR_anfang',
  benutzen: 'keine (Türpaneele kommen als OBJ-052 an PLACE_-Punkte)',
  lichter: 'LAMP_ alle 4,8 m (eisblau, indirekt)',
  animation: 'Lichtleisten pulsieren minimal (lebendiges Licht)',
  quelle: 'selbst gebaut nach Setplänen „Halls & Corridors“ / „Hallways Outer City“ (Staffel 4) und Screencaps',
};

// Varianten für Viewer/Schaukasten (der Viewer bietet sie als Auswahl an)
export const varianten = [
  { label: 'Abschluss mit Tür + Seitentür', opts: { laenge: 9.6, variante: 'ende', seitentuer: true } },
  { label: 'Gerade (offen, 9,6 m)', opts: { laenge: 9.6, variante: 'gerade' } },
  { label: 'T-Abzweig mit Tür', opts: { laenge: 9.6, variante: 't' } },
  { label: 'Abschluss mit Tür (4,8 m)', opts: { laenge: 4.8, variante: 'ende' } },
];

const B = 3.6;        // lichte Breite
const H = 4.0;        // lichte Höhe
const T = 0.3;        // Wanddicke
const F = 2.4;        // Feldlänge (2 × 1,2-m-Raster)
const CH = 0.55;      // Abschrägung der oberen Ecken (30°-Fasen)

export function create(opts = {}) {
  const variante = opts.variante || 'gerade';
  const felder = Math.max(2, Math.round((opts.laenge ?? 9.6) / F));
  const L = felder * F;
  const mid = Math.floor(felder / 2);         // Feld in der Mitte (für Seitentür / Abzweig)

  const root = new THREE.Group();
  root.name = 'raum_korridor';
  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper'), pillar = kit('pillar');
  const floorMat = kit('floor'), ceiling = kit('ceiling'), glow = kit('glow');
  // Boden-Einfassung: Patina-Grün (eigenes Material in der Kupfer-Palette)
  const patina = new THREE.MeshStandardMaterial({ name: 'boden_patina', color: 0x3f6b5c, metalness: 0.6, roughness: 0.45 });
  const lineGlow = new THREE.MeshStandardMaterial({ name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6 });

  const add = (geo, mat, x, y, z, name) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (name) m.name = name; root.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  // ---------------------------------------------------------------- Boden
  box(B, 0.1, L, floorMat, 0, -0.05, L / 2, 'boden');
  for (const s of [-1, 1]) box(0.22, 0.012, L, patina, s * (B / 2 - 0.11), 0.006, L / 2);   // grün-kupferner Rand
  // Plattenfugen (alle 1,2 m) und Mittel-Intarsie
  const fugen = new THREE.InstancedMesh(new THREE.BoxGeometry(B - 0.44, 0.006, 0.02), copper, felder * 2 + 1);
  const o3 = new THREE.Object3D();
  for (let i = 0; i <= felder * 2; i++) { o3.position.set(0, 0.003, i * 1.2); o3.updateMatrix(); fugen.setMatrixAt(i, o3.matrix); }
  root.add(fugen);
  box(0.06, 0.008, L, copper, 0, 0.004, L / 2);

  // ---------------------------------------------------------------- Wände (je Seite, mit optionaler Öffnung)
  const sideOpen = { [-1]: opts.seitentuer ? mid : -1, [1]: variante === 't' ? mid : -1 };
  const panelGeo = new THREE.BoxGeometry(0.035, 2.6, 1.0);
  const frameGeo = new THREE.BoxGeometry(0.05, 2.75, 1.12);
  const slotGeo = new THREE.BoxGeometry(0.02, 0.32, 0.06);
  const panels = [], frames = [], slots = [];
  for (const s of [-1, 1]) {
    const xIn = s * (B / 2);                    // Innenfläche
    const xC = s * (B / 2 + T / 2);             // Wandmitte
    for (let i = 0; i < felder; i++) {
      const z0 = i * F, zc = z0 + F / 2;
      if (i === sideOpen[s]) {
        // Türöffnung 2,4 × 3 m: nur Sturz über der Öffnung + Bronzeeinfassung
        box(T, H - 3.0, F, wall, xC, 3.0 + (H - 3.0) / 2, zc);
        box(0.06, 0.12, F, copper, xIn - s * 0.03, 3.0, zc);
        for (const dz of [-1, 1]) box(0.08, 3.0, 0.12, copper, xIn - s * 0.04, 1.5, zc + dz * (F / 2 - 0.06));
        continue;
      }
      box(T, H, F, wall, xC, H / 2, zc).name = `wand_${s < 0 ? 'links' : 'rechts'}_${i}`;
      // jedes zweite Feld: Zierpaneel (plant-on) mit Bronzerahmen; dazwischen Lichtschlitze
      if (i % 2 === 0) {
        panels.push([xIn - s * 0.03, 1.55, zc]);
        frames.push([xIn - s * 0.015, 1.55, zc]);
      } else {
        for (let k = 0; k < 4; k++) slots.push([xIn - s * 0.012, 1.1 + k * 0.42, zc]);
      }
    }
    // Sockelleiste und Gesims durchgehend (Bronze)
    const offen = sideOpen[s];
    const segs = offen >= 0 ? [[0, offen * F], [(offen + 1) * F, L]] : [[0, L]];
    for (const [a, b] of segs) {
      if (b - a < 0.01) continue;
      box(0.04, 0.15, b - a, copper, xIn - s * 0.02, 0.075, (a + b) / 2);
      box(0.06, 0.1, b - a, copper, xIn - s * 0.03, H - CH - 0.05, (a + b) / 2);
    }
    // obere Abschrägung (30°-Fase) als schräge Platte
    const fase = new THREE.Mesh(new THREE.BoxGeometry(CH * 1.25, 0.08, L), wallDark);
    fase.position.set(s * (B / 2 - CH / 2), H - CH / 2, L / 2);
    fase.rotation.z = s * -THREE.MathUtils.degToRad(42);
    root.add(fase);
  }
  const inst = (geo, mat, list, name, rot = 0) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z], n) => { o3.position.set(x, y, z); o3.rotation.set(0, rot, 0); o3.updateMatrix(); im.setMatrixAt(n, o3.matrix); });
    im.count = list.length; im.name = name; root.add(im); return im;
  };
  inst(frameGeo, copper, frames, 'paneel_rahmen');
  inst(panelGeo, wallDark, panels, 'paneele');
  const slotMesh = inst(slotGeo, lineGlow, slots, 'lichtschlitze');

  // ---------------------------------------------------------------- Säulen an den Feldgrenzen (leicht vorstehend, Perlgrau)
  const saeulen = [];
  for (const s of [-1, 1]) for (let i = 0; i <= felder; i++) {
    if (i === sideOpen[s] || i === sideOpen[s] + 1) continue;
    saeulen.push([s * (B / 2 - 0.06), H / 2 - CH / 2, i * F]);
  }
  inst(new THREE.BoxGeometry(0.14, H - CH, 0.22), pillar, saeulen, 'saeulen');

  // ---------------------------------------------------------------- Decke (polygonal, Lichtfeld in der Mitte)
  box(B - 2 * CH + 0.1, 0.3, L, ceiling, 0, H + 0.15, L / 2, 'decke');
  // indirektes Licht: zwei schmale Lichtbänder entlang der Deckenkanten + Kassettenfelder
  for (const s of [-1, 1]) box(0.08, 0.03, L - 0.2, glow, s * (B / 2 - CH - 0.1), H - 0.02, L / 2, 'decke_lichtband');
  const kass = [];
  for (let i = 0; i < felder; i++) kass.push([0, H - 0.015, i * F + F / 2]);
  inst(new THREE.BoxGeometry(B - 2 * CH - 0.6, 0.03, F - 0.5), wallDark, kass, 'decke_kassetten');
  box(B + 2 * T, 0.3, L, ceiling, 0, H + 0.45, L / 2, 'decke_aussen');

  // ---------------------------------------------------------------- Abschluss (Variante 'ende'): Wand mit Türöffnung
  if (variante === 'ende') {
    const zE = L + T / 2;
    for (const s of [-1, 1]) box((B - 2.4) / 2 + T, H, T, wall, s * (1.2 + ((B - 2.4) / 2 + T) / 2), H / 2, zE);
    box(2.4, H - 3.0, T, wall, 0, 3.0 + (H - 3.0) / 2, zE);
    box(2.6, 0.12, 0.06, copper, 0, 3.0, L - 0.03);
    for (const s of [-1, 1]) box(0.12, 3.0, 0.08, copper, s * 1.26, 1.5, L - 0.04);
  }

  // ---------------------------------------------------------------- Anschlüsse, Objektplätze, Licht
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); o.rotation.y = rotY; if (userData) o.userData = userData; root.add(o); return o;
  };
  empty('DOOR_anfang', 0, 0, 0, Math.PI, { breite: B, hoehe: H, ziel: 'vorheriges Modul / Raum' });
  empty('DOOR_ende', 0, 0, L, 0, { breite: variante === 'ende' ? 2.4 : B, hoehe: variante === 'ende' ? 3 : H, ziel: variante === 'ende' ? 'Raum (Tür)' : 'nächstes Modul' });
  if (opts.seitentuer) empty('DOOR_seite', -B / 2 - T / 2, 0, mid * F + F / 2, -Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Seitenraum links' });
  // Türen (OBJ-091) in jede 2,4 × 3-m-Öffnung, Ursprung in Wandmitte; Vorderseite zeigt in den Gang
  let nD = 0;
  const tuer = (x, z, rotY) => { nD++; empty(nD === 1 ? 'PLACE_OBJ-091' : `PLACE_OBJ-091_${nD}`, x, 0, z, rotY); };
  if (variante === 'ende') tuer(0, L + T / 2, Math.PI);
  if (opts.seitentuer) tuer(-B / 2 - T / 2, mid * F + F / 2, Math.PI / 2);
  if (variante === 't') tuer(B / 2 + T / 2, mid * F + F / 2, -Math.PI / 2);
  if (variante === 't') empty('DOOR_abzweig', B / 2 + T / 2, 0, mid * F + F / 2, Math.PI / 2, { breite: 2.4, hoehe: 3, ziel: 'Abzweig rechts (weiteres Modul, um 90° gedreht)' });
  // Wandleuchten (OBJ-053) auf Säulenhöhe an jeder zweiten Feldgrenze, Türpaneel (OBJ-052) neben Türen
  let nL = 0;
  for (let i = 1; i < felder; i += 2) for (const s of [-1, 1]) {
    if (i === sideOpen[s] || i === sideOpen[s] + 1) continue;
    nL++;
    empty(nL === 1 ? 'PLACE_OBJ-053' : `PLACE_OBJ-053_${nL}`, s * (B / 2 - 0.13), 2.2, i * F, s < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  let nT = 0;
  const tuerPaneel = (x, z, rotY) => { nT++; empty(nT === 1 ? 'PLACE_OBJ-052' : `PLACE_OBJ-052_${nT}`, x, 1.2, z, rotY); };
  if (variante === 'ende') tuerPaneel(1.55, L, Math.PI);
  if (opts.seitentuer) tuerPaneel(-B / 2, mid * F + F / 2 + 1.45, Math.PI / 2);
  if (variante === 't') tuerPaneel(B / 2, mid * F + F / 2 - 1.45, -Math.PI / 2);
  for (let z = F; z < L; z += 2 * F) empty(`LAMP_${Math.round(z * 10)}`, 0, H - 0.6, z, 0, { color: '#9fd8ff', intensity: 8, distance: 7 });

  // ---------------------------------------------------------------- Kollision
  const col = (name, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d)); m.name = name; m.position.set(x, y, z); m.visible = false; root.add(m); };
  col('COL_boden', B + 2 * T, 0.2, L, 0, -0.1, L / 2);
  col('COL_decke', B + 2 * T, 0.3, L, 0, H + 0.15, L / 2);
  for (const s of [-1, 1]) {
    const offen = sideOpen[s], x = s * (B / 2 + T / 2), nm = s < 0 ? 'links' : 'rechts';
    if (offen < 0) col(`COL_wand_${nm}`, T, H, L, x, H / 2, L / 2);
    else {
      if (offen > 0) col(`COL_wand_${nm}_a`, T, H, offen * F, x, H / 2, (offen * F) / 2);
      const z1 = (offen + 1) * F;
      if (z1 < L) col(`COL_wand_${nm}_b`, T, H, L - z1, x, H / 2, (z1 + L) / 2);
      col(`COL_sturz_${nm}`, T, H - 3, F, x, 3 + (H - 3) / 2, offen * F + F / 2);
    }
  }
  if (variante === 'ende') {
    for (const s of [-1, 1]) col(`COL_ende_${s < 0 ? 'l' : 'r'}`, (B - 2.4) / 2 + T, H, T, s * (1.2 + ((B - 2.4) / 2 + T) / 2), H / 2, L + T / 2);
    col('COL_ende_sturz', 2.4, H - 3, T, 0, 3 + (H - 3) / 2, L + T / 2);
  }

  // ---------------------------------------------------------------- dezentes Lichtatmen der Leuchtschlitze
  let t = 0, last = null;
  slotMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.5 + Math.sin(t * 0.8) * 0.12;
  };
  root.userData.raum = { id: 'ATL-049', laenge: L, felder, variante };
  return root;
}

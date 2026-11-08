// Raum ATL-048: Außenbalkon / Aussichtsplattform am Kontrollturm (Etage 6).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Halbkreis-Plattform (R = 6,9 m, ca. 75 m²), die zur Turmfassade im -Z-Bereich anschließt
// und nach +Z in den Ozeanblick vorspringt. Nach oben offen, nur Soffit über der Fassade.
// Leer: nur Architektur; Balustrade und Leuchten werden als Objekte an PLACE_-Punkten gesetzt.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_balcony',
  art: 'Raum',
  masse: 'Halbkreis-Aussichtsplattform Ø 13,8 m, 6,9 m Auskragung, ca. 75 m², oben offen',
  wohin: 'Kontrollturm, Etage 6 – direkt an den Kontrollbereich',
  benutzen: 'Aussichtsplattform über Stadt und Meer; zwei Schiebetüren führen in den Kontrollbereich',
  lichter: '6 LAMP_ (2 warm über den Türen, 4 eisblau an der Balkonkante)',
  animation: 'Eisblaue Lichtleiste am Balkonrand atmet minimal',
  quelle: 'Rekonstruiert nach Serienbild „The Return: Part 2“, Produktions-Setplan Joseph Mallozzi (Sc. 196, 201) und Raumbeschreibung',
};

export function create(opts = {}) {
  const R = opts.radius ?? 6.9;          // Radius der Halbkreis-Plattform
  const H = opts.wandhoehe ?? 5.0;        // Höhe der Turmfassade
  const T = 0.3;                          // Wanddicke
  const D = 0.18;                         // Stärke der Plattform (Oberkante bleibt bei y = 0)
  const Z0 = -R / 2;                      // Mittellinie der Fassade / Mitte der Halbkreisfläche
  const DW = 2.4, DH = 3.0;               // Türöffnung
  const DL = -R * 0.435, DR = R * 0.435;  // Türachsen

  const root = new THREE.Group();
  root.name = 'raum_balcony';

  const wall = kit('wall'), wallDark = kit('wallDark'), copper = kit('copper');
  const pillar = kit('pillar'), hull = kit('hull'), floorMat = kit('floor');
  const ceiling = kit('ceiling'), glow = kit('glow');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.55, roughness: 0.45,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_aussen', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.8,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste_bernstein', color: 0xffe6c0, emissive: 0xffd8a0, emissiveIntensity: 1.5,
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name; m.position.set(x, y, z); m.visible = false; root.add(m); return m;
  };
  const o3 = new THREE.Object3D();
  const inst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, n) => {
      o3.position.set(p[0], p[1], p[2]);
      o3.rotation.set(p[5] ?? 0, p[3] ?? 0, p[4] ?? 0);
      o3.updateMatrix(); im.setMatrixAt(n, o3.matrix);
    });
    im.count = list.length; im.name = name; root.add(im); return im;
  };
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name; o.position.set(x, y, z); o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o); return o;
  };

  // ------------------------------------------------------------------ Boden: Halbkreis-Plattform (Oberkante y = 0)
  const shape = new THREE.Shape();
  shape.moveTo(R, 0);
  shape.absarc(0, 0, R, 0, Math.PI, false);   // obere Halbkreisfläche in Shape-Koordinaten
  shape.lineTo(-R, 0);
  const floorGeo = new THREE.ExtrudeGeometry(shape, {
    depth: D, bevelEnabled: false, curveSegments: 48,
  });
  const floorMesh = new THREE.Mesh(floorGeo, [floorMat, hull]);
  floorMesh.rotation.x = Math.PI / 2;          // Shape +Y -> Welt +Z, Extrusion -> Welt -Y
  floorMesh.position.set(0, 0, Z0);
  floorMesh.name = 'boden_plattform';
  root.add(floorMesh);

  // Geschlossener Plattenrand (Kupferband) als offene Zylinderschale am Bogen
  const fascia = add(
    new THREE.CylinderGeometry(R, R, D, 48, 1, true, -Math.PI / 2, Math.PI),
    copper, 0, -D / 2, Z0, 'boden_randband',
  );
  fascia.material = copper;

  // Radiale Bodenfugen (InstancedMesh)
  const radials = [];
  for (let a = -72; a <= 72; a += 24) {
    const rad = THREE.MathUtils.degToRad(a);
    radials.push([(R / 2) * Math.sin(rad), 0.008, Z0 + (R / 2) * Math.cos(rad), rad]);
  }
  inst(new THREE.BoxGeometry(0.05, 0.012, R), copper, radials, 'boden_fugen_radial');

  // Kreisintarsien und grün-kupferner Randstreifen (Bodenintarsien dürfen rund sein)
  const ring = (r1, r2, mat, name, y) => {
    const g = new THREE.RingGeometry(r1, r2, 64, 1, 0, Math.PI);
    const m = add(g, mat, 0, y, Z0, name);
    m.rotation.x = Math.PI / 2;                // Shape +Y -> Welt +Z (Balkonseite)
    return m;
  };
  ring(4.55, 4.66, copper, 'boden_intarsie_ring', 0.009);
  ring(R - 0.34, R - 0.08, patina, 'boden_rand_patina', 0.008);

  // ------------------------------------------------------------------ Turmfassade mit zwei Türöffnungen (-Z)
  const wallZ = Z0 - T / 2;
  const segs = [
    [-R, DL - DW / 2],
    [DL + DW / 2, DR - DW / 2],
    [DR + DW / 2, R],
  ];
  segs.forEach(([a, b], i) => {
    box(b - a, H, T, wall, (a + b) / 2, H / 2, wallZ, `wand_fassade_${i}`);
    box(b - a, 0.15, 0.05, copper, (a + b) / 2, 0.075, Z0 + 0.025, `sockel_${i}`);
    box(b - a, 0.10, 0.06, copper, (a + b) / 2, H - 0.05, Z0 + 0.03, `gesims_${i}`);
  });
  for (const dx of [DL, DR]) {
    box(DW, H - DH, T, wall, dx, DH + (H - DH) / 2, wallZ, 'wand_sturz');
    for (const s of [-1, 1]) box(0.12, DH, 0.08, copper, dx + s * (DW / 2 + 0.06), DH / 2, Z0 + 0.04, 'tuer_fassung');
    box(DW + 0.24, 0.12, 0.08, copper, dx, DH + 0.06, Z0 + 0.04, 'tuer_sturz_fassung');
  }

  // Wandpaneele (plant-ons) mit Lineament und senkrechte Lichtschlitze
  const xs = [];
  for (let x = -R + 0.6; x <= R - 0.6 + 1e-6; x += 1.2) {
    if (Math.abs(x - DL) < 1.6 || Math.abs(x - DR) < 1.6) continue;
    xs.push(Math.round(x * 1000) / 1000);
  }
  const frames = [], panels = [], branches = [];
  for (const x of xs) {
    frames.push([x, 1.55, Z0 + 0.03]);
    panels.push([x, 1.55, Z0 + 0.075]);
    branches.push([x - 0.13, 2.25, Z0 + 0.10, 0, Math.PI / 6]);
    branches.push([x + 0.13, 2.25, Z0 + 0.10, 0, -Math.PI / 6]);
    branches.push([x, 1.95, Z0 + 0.10, 0, 0]);
  }
  inst(new THREE.BoxGeometry(0.06, 2.9, 1.05), copper, frames, 'paneel_rahmen');
  inst(new THREE.BoxGeometry(0.04, 2.62, 0.86), wallDark, panels, 'paneele');
  inst(new THREE.BoxGeometry(0.025, 0.72, 0.025), copper, branches, 'paneel_lineament');

  const slots = [];
  for (const x of xs) {
    const sx = x + 0.6;
    if (sx > R - 0.3) continue;
    if (Math.abs(sx - DL) < 1.3 || Math.abs(sx - DR) < 1.3) continue;
    for (let k = 0; k < 4; k++) slots.push([sx, 1.05 + k * 0.45, Z0 + 0.03]);
  }
  inst(new THREE.BoxGeometry(0.02, 0.3, 0.07), lineGlow, slots, 'lichtschlitze');

  // ------------------------------------------------------------------ Deckensoffit über der Eingangsfassade (Rest offen)
  box(2 * R, 0.3, 1.4, ceiling, 0, H + 0.15, wallZ + 0.7, 'decke_soffit_eingang');
  box(2 * R, 0.22, 0.5, wallDark, 0, H + 0.41, wallZ + 0.25, 'decke_krone_fassade');
  const soffitGlow = [];
  for (let i = 0; i < 10; i++) {
    const x = -R + 0.7 + i * ((2 * R - 1.4) / 9);
    soffitGlow.push([x, H - 0.02, wallZ + 1.18]);
  }
  inst(new THREE.BoxGeometry(0.7, 0.03, 0.08), amberGlow, soffitGlow, 'decke_lichtband');

  // ------------------------------------------------------------------ Vertikale Turmarchitektur
  // Rippen an der Fassade (von der Fassade in den Raum stehend, Türfelder frei)
  const ribs = [];
  for (const x of [-(R - 0.6), R - 0.6]) ribs.push([x, H / 2, Z0 + 0.15]);
  inst(new THREE.BoxGeometry(0.4, H, 0.3), pillar, ribs, 'fassade_rippen');

  // Turmsäulen über der Fassade – wachsen aus dem Soffit, nichts schwebt
  const turm = [];
  for (const x of [-(R - 0.6), R - 0.6]) turm.push([x, H + 1.35, wallZ + 0.05]);
  inst(new THREE.BoxGeometry(0.42, 2.7, 0.42), pillar, turm, 'saeule_turm');
  const turmGlow = [];
  for (const x of [-(R - 0.6), R - 0.6]) for (let k = 0; k < 5; k++) turmGlow.push([x, H + 0.45 + k * 0.5, wallZ + 0.28]);
  inst(new THREE.BoxGeometry(0.05, 0.28, 0.05), lineGlow, turmGlow, 'saeule_turm_lichtschlitze');

  // ------------------------------------------------------------------ Wetterfeste Beleuchtungselemente (Architektur)
  // polygonal geführte Lichtleiste entlang der Balkonkante
  const edgeLights = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = (-90 + 180 * (i + 0.5) / N) * Math.PI / 180;
    edgeLights.push([(R - 0.42) * Math.sin(a), 0.03, Z0 + (R - 0.42) * Math.cos(a), a]);
  }
  const edgeMesh = inst(new THREE.BoxGeometry(0.72, 0.04, 0.08), lineGlow, edgeLights, 'lichtleiste_balconkante');

  // Bernstein-Lichtleiste am Sockel der Fassade (Türfelder ausgespart)
  segs.forEach(([a, b], i) => {
    const len = b - a;
    box(len, 0.035, 0.07, amberGlow, (a + b) / 2, 0.025, Z0 + 0.16, `lichtleiste_sockel_${i}`);
  });

  // ------------------------------------------------------------------ Objektplätze
  // Balustrade / Aussichtsplattform (Wandobjekt, 4,10 × 1,11 × 1,90 m):
  // 4 Segmente am polygonal gerundeten Balkonrand; Rückseite am Rand, Vorderseite (+Z) in den Raum.
  const balR = R - 0.95;                       // Rückseite liegt am Balkonrand
  for (let i = 0; i < 4; i++) {
    const a = (-63 + i * 42) * Math.PI / 180;
    const px = balR * Math.sin(a), pz = Z0 + balR * Math.cos(a);
    const name = i === 0 ? 'PLACE_OBJ-042' : `PLACE_OBJ-042_${i + 1}`;
    empty(name, px, 0, pz, a + Math.PI);
  }

  // Türen (Antiker-Schiebetür) in jeder Öffnung – +Z zeigt in den Raum
  empty('PLACE_OBJ-091', DL, 0, wallZ, 0);
  empty('PLACE_OBJ-091_2', DR, 0, wallZ, 0);

  // ------------------------------------------------------------------ Anschlüsse (DOOR_ zeigt nach außen = -Z)
  empty('DOOR_eingang', DL, 0, wallZ, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Kontrollbereich Kontrollturm', raum: 'ATL-047',
  });
  empty('DOOR_nebeneingang', DR, 0, wallZ, Math.PI, {
    breite: DW, hoehe: DH, ziel: 'Kontrollbereich Kontrollturm', raum: 'ATL-047',
  });

  // ------------------------------------------------------------------ Lichter
  empty('LAMP_tuer_links', DL, 3.3, Z0 + 0.55, 0, { color: '#ffd8a0', intensity: 7, distance: 9 });
  empty('LAMP_tuer_rechts', DR, 3.3, Z0 + 0.55, 0, { color: '#ffd8a0', intensity: 7, distance: 9 });
  for (const a of [-55, -20, 20, 55]) {
    const rad = THREE.MathUtils.degToRad(a);
    empty(`LAMP_kante_${a}`, (R - 0.9) * Math.sin(rad), 0.75, Z0 + (R - 0.9) * Math.cos(rad), 0,
      { color: '#9fd8ff', intensity: 6, distance: 10 });
  }

  // ------------------------------------------------------------------ Kollision
  const nS = 16, sw = (2 * R) / nS;
  for (let i = 0; i < nS; i++) {
    const x0 = -R + sw * i, x1 = x0 + sw;
    const xm = Math.max(Math.abs(x0), Math.abs(x1));
    const d = Math.sqrt(Math.max(0, R * R - xm * xm));
    if (d < 0.08) continue;
    col(`COL_boden_${i}`, sw, D, d, (x0 + x1) / 2, -D / 2, Z0 + d / 2);
  }
  segs.forEach(([a, b], i) => col(`COL_wand_fassade_${i}`, b - a, H, T, (a + b) / 2, H / 2, wallZ));
  for (const dx of [DL, DR]) col(`COL_sturz_${dx < 0 ? 'links' : 'rechts'}`, DW, H - DH, T, dx, DH + (H - DH) / 2, wallZ);
  col('COL_decke_soffit', 2 * R, 0.3, 1.4, 0, H + 0.15, wallZ + 0.7);
  col('COL_decke_krone', 2 * R, 0.22, 0.5, 0, H + 0.41, wallZ + 0.25);
  ribs.forEach((p, i) => col(`COL_rippe_${i}`, 0.4, H, 0.3, p[0], p[1], p[2]));
  turm.forEach((p, i) => col(`COL_turm_${i}`, 0.42, 2.7, 0.42, p[0], p[1], p[2]));

  // ------------------------------------------------------------------ Animation: Lichtleiste atmet
  let t = 0, last = null;
  edgeMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.7 + Math.sin(t * 0.7) * 0.14;
  };

  root.userData.raum = { id: 'ATL-048', radius: R, flaeche: Math.round(Math.PI * R * R / 2) };
  return root;
}

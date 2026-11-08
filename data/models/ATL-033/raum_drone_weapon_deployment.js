// Raum ATL-033: Drohnen-Startplattform (Drone Weapon Deployment Platform)
// West Pier, Etage 5, militärisch/technisch.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Haupteingang an der Seite -Z. Leere Hülle: nur Architektur, Platzhalter für OBJ-032 / OBJ-033.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_drone_weapon_deployment',
  art: 'Raum',
  masse: 'ca. 16,0 m × 12,0 m × 6,0 m (ca. 192 m²), zwei irisartige Deckenschächte Ø 5,4 m',
  wohin: 'West Pier, Etage 5 – Drohnen-Startplattform / Abschusszone des Waffensystems',
  benutzen: 'zwei ausfahrbare Startrampen (PLACE_OBJ-033), vier antike Drohnenwaffen (PLACE_OBJ-032)',
  lichter: '6 LAMP_Punkte: 4 eisblau an den Randzonen, 2 bernsteinfarben in den Abschussschächten',
  animation: 'Glutlicht in den Abschussschächten pulsiert langsam; Irisblätter der Dachöffnungen stehen als Architektur',
  quelle: 'selbst gebaut nach Serienbildern (Startschacht/Abschussvorrichtung, West Pier) und Atlantis-Setplänen „Halls & Corridors“',
};

export function create(opts = {}) {
  const H = opts.hoehe ?? 6.0;
  const T = 0.3;                    // Wanddicke
  const X0 = -8.0, X1 = 8.0;        // lichte Breite 16 m
  const Z0 = -6.0, Z1 = 6.0;        // lichte Tiefe 12 m
  const DOOR_W = 2.4, DOOR_H = 3.0;

  const shaftX = [-3.9, 3.9];       // Zentren der Deckenschächte
  const shaftR = 2.7;               // Radius der Deckenöffnung
  const shaftDepth = 1.7;           // Tiefe des sichtbaren Schachtkragens (bleibt in der Hülle)
  const rampX = [-3.9, 3.9];        // Startrampen (Platzhalter)

  const root = new THREE.Group();
  root.name = 'raum_drone_weapon_deployment';

  const wall = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const hull = kit('hull');
  const floorMat = kit('floor');
  const ceilMat = kit('ceiling');
  const stairMat = kit('stair');
  const glowMat = kit('glow');
  const amberMat = kit('amberGlow');

  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.65, roughness: 0.42,
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.7,
  });
  const shaftGlut = new THREE.MeshStandardMaterial({
    name: 'schacht_glut', color: 0xffc477, emissive: 0xff9a3c, emissiveIntensity: 2.2,
    metalness: 0.2, roughness: 0.5,
  });

  const o3 = new THREE.Object3D();
  const addMesh = (geo, mat, x, y, z, name, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name, ry = 0) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name, ry);
  const col = (name, w, h, d, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.visible = false;
    root.add(m);
    return m;
  };

  // ------------------------------------------------------------------ Boden
  box(X1 - X0 + 2 * T, 0.1, Z1 - Z0 + 2 * T, floorMat, 0, -0.05, 0, 'boden');
  col('COL_boden', X1 - X0 + 2 * T, 0.2, Z1 - Z0 + 2 * T, 0, -0.1, 0);

  // Plattenfugen im 1,2-m-Raster
  const fugenX = [], fugenZ = [];
  for (let x = X0 + 1.2; x < X1; x += 1.2) fugenX.push([x, 0.004, 0]);
  for (let z = Z0 + 1.2; z < Z1; z += 1.2) fugenZ.push([0, 0.004, z]);
  const mkInst = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach(([x, y, z], i) => {
      o3.position.set(x, y, z); o3.rotation.set(0, 0, 0); o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };
  mkInst(new THREE.BoxGeometry(0.02, 0.008, Z1 - Z0), copper, fugenX, 'boden_fugen_x');
  mkInst(new THREE.BoxGeometry(X1 - X0, 0.008, 0.02), copper, fugenZ, 'boden_fugen_z');

  // grün-kupferner Rand
  box(0.24, 0.014, Z1 - Z0, patina, X0 + 0.12, 0.007, 0, 'boden_rand');
  box(0.24, 0.014, Z1 - Z0, patina, X1 - 0.12, 0.007, 0, 'boden_rand');
  box(X1 - X0, 0.014, 0.24, patina, 0, 0.007, Z0 + 0.12, 'boden_rand');
  box(X1 - X0, 0.014, 0.24, patina, 0, 0.007, Z1 - 0.12, 'boden_rand');

  // sechseckige Kupferintarsie in der Mitte (30°/60°-Raster)
  const hexR = 5.1;
  const hexEdge = Math.hypot(Math.cos(Math.PI / 2) - Math.cos(Math.PI / 6),
    Math.sin(Math.PI / 2) - Math.sin(Math.PI / 6)) * hexR;
  const hexSeg = [];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const mx = (Math.cos(a0) + Math.cos(a1)) * 0.5 * hexR;
    const mz = (Math.sin(a0) + Math.sin(a1)) * 0.5 * hexR;
    const ry = -Math.atan2(Math.sin(a1) - Math.sin(a0), Math.cos(a1) - Math.cos(a0));
    hexSeg.push([mx, 0.009, mz, ry]);
  }
  const hexMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(hexEdge, 0.012, 0.09), copper, 6);
  hexSeg.forEach(([x, y, z, ry], i) => {
    o3.position.set(x, y, z); o3.rotation.set(0, ry, 0); o3.updateMatrix();
    hexMesh.setMatrixAt(i, o3.matrix);
  });
  hexMesh.name = 'boden_intarsie_sechseck';
  root.add(hexMesh);

  // ------------------------------------------------------------------ Wände
  // -Z: Haupteingang, +Z: geschlossen, -X: geschlossen, +X: Servicetür
  box(7.1, H, T, wall, -4.75, H / 2, Z0 - T / 2, 'wand_sued_links');
  box(7.1, H, T, wall, 4.75, H / 2, Z0 - T / 2, 'wand_sued_rechts');
  box(DOOR_W, H - DOOR_H, T, wall, 0, DOOR_H + (H - DOOR_H) / 2, Z0 - T / 2, 'wand_sued_sturz');

  box(X1 - X0 + 2 * T, H, T, wall, 0, H / 2, Z1 + T / 2, 'wand_nord');

  box(T, H, Z1 - Z0 + 2 * T, wall, X0 - T / 2, H / 2, 0, 'wand_west');

  box(T, H, 5.1, wall, X1 + T / 2, H / 2, -3.75, 'wand_ost_sued');
  box(T, H, 5.1, wall, X1 + T / 2, H / 2, 3.75, 'wand_ost_nord');
  box(T, H - DOOR_H, 2.4, wall, X1 + T / 2, DOOR_H + (H - DOOR_H) / 2, 0, 'wand_ost_sturz');

  // Bronzeeinfassungen der beiden Türöffnungen
  for (const s of [-1, 1]) {
    box(0.12, DOOR_H, 0.1, copper, s * (DOOR_W / 2 + 0.06), DOOR_H / 2, Z0 - T / 2 + 0.02, 'tuer_einfassung');
    box(0.1, DOOR_H, 0.12, copper, X1 + T / 2 - 0.02, DOOR_H / 2, s * (DOOR_W / 2 + 0.06), 'tuer_einfassung');
  }
  box(DOOR_W + 0.24, 0.12, 0.1, copper, 0, DOOR_H + 0.06, Z0 - T / 2 + 0.02, 'tuer_einfassung');
  box(0.1, 0.12, DOOR_W + 0.24, copper, X1 + T / 2 - 0.02, DOOR_H + 0.06, 0, 'tuer_einfassung');

  // Wanddetails (Plant-ons, Lichtschlitze, Sockel, Gesims)
  const det = {
    x_p: [], x_m: [], z_p: [], z_m: [],
    fr_x_p: [], fr_x_m: [], fr_z_p: [], fr_z_m: [],
    sl_x_p: [], sl_x_m: [], sl_z_p: [], sl_z_m: [],
  };
  const detail = (axis, sign, fixed, a0, a1, skip = []) => {
    const n = Math.max(1, Math.round((a1 - a0) / 1.2));
    const f = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const c = a0 + (i + 0.5) * f;
      if (skip.some(([s0, s1]) => c > s0 - 0.35 && c < s1 + 0.35)) continue;
      const key = axis === 'x' ? (sign > 0 ? 'x_p' : 'x_m') : (sign > 0 ? 'z_p' : 'z_m');
      const fkey = axis === 'x' ? (sign > 0 ? 'fr_x_p' : 'fr_x_m') : (sign > 0 ? 'fr_z_p' : 'fr_z_m');
      const skey = axis === 'x' ? (sign > 0 ? 'sl_x_p' : 'sl_x_m') : (sign > 0 ? 'sl_z_p' : 'sl_z_m');
      if (axis === 'x') {
        det[key].push([c, 1.55, fixed + sign * 0.022]);
        det[fkey].push([c, 1.55, fixed + sign * 0.012]);
      } else {
        det[key].push([fixed + sign * 0.022, 1.55, c]);
        det[fkey].push([fixed + sign * 0.012, 1.55, c]);
      }
      if (i % 2 === 1) {
        for (let k = 0; k < 4; k++) {
          const y = 1.05 + k * 0.4;
          if (axis === 'x') det[skey].push([c, y, fixed + sign * 0.03]);
          else det[skey].push([fixed + sign * 0.03, y, c]);
        }
      }
    }
    const len = a1 - a0, mid = (a0 + a1) / 2;
    if (axis === 'x') {
      box(len, 0.15, 0.05, copper, mid, 0.075, fixed + sign * 0.025, 'sockelleiste');
      box(len, 0.1, 0.07, copper, mid, H - 0.06, fixed + sign * 0.035, 'gesims');
    } else {
      box(0.05, 0.15, len, copper, fixed + sign * 0.025, 0.075, mid, 'sockelleiste');
      box(0.07, 0.1, len, copper, fixed + sign * 0.035, H - 0.06, mid, 'gesims');
    }
  };

  detail('x', 1, Z0, -8.3, -DOOR_W / 2);
  detail('x', 1, Z0, DOOR_W / 2, 8.3);
  detail('x', -1, Z1, -8.3, 8.3);
  detail('z', 1, X0, -6.3, 6.3);
  detail('z', -1, X1, -6.3, -DOOR_W / 2);
  detail('z', -1, X1, DOOR_W / 2, 6.3);

  const pGeoX = new THREE.BoxGeometry(1.0, 2.6, 0.045);
  const pGeoZ = new THREE.BoxGeometry(0.045, 2.6, 1.0);
  const fGeoX = new THREE.BoxGeometry(1.14, 2.78, 0.025);
  const fGeoZ = new THREE.BoxGeometry(0.025, 2.78, 1.14);
  const sGeoX = new THREE.BoxGeometry(0.07, 0.3, 0.04);
  const sGeoZ = new THREE.BoxGeometry(0.04, 0.3, 0.07);

  mkInst(pGeoX, wallDark, det.x_p, 'paneele');
  mkInst(pGeoX, wallDark, det.x_m, 'paneele');
  mkInst(pGeoZ, wallDark, det.z_p, 'paneele');
  mkInst(pGeoZ, wallDark, det.z_m, 'paneele');
  mkInst(fGeoX, copper, det.fr_x_p, 'paneel_rahmen');
  mkInst(fGeoX, copper, det.fr_x_m, 'paneel_rahmen');
  mkInst(fGeoZ, copper, det.fr_z_p, 'paneel_rahmen');
  mkInst(fGeoZ, copper, det.fr_z_m, 'paneel_rahmen');
  const slotMesh = mkInst(sGeoX, lineGlow, det.sl_x_p, 'lichtschlitze');
  mkInst(sGeoX, lineGlow, det.sl_x_m, 'lichtschlitze');
  mkInst(sGeoZ, lineGlow, det.sl_z_p, 'lichtschlitze');
  mkInst(sGeoZ, lineGlow, det.sl_z_m, 'lichtschlitze');

  // ------------------------------------------------------------------ Zuführungsschächte in der Südwand
  for (const x of [-5.4, 5.4]) {
    box(1.1, 4.6, 0.16, wallDark, x, 2.3, Z0 + 0.08, 'zufuehrung_schacht');
    for (let k = 0; k < 6; k++) box(1.0, 0.08, 0.1, copper, x, 0.6 + k * 0.72, Z0 + 0.18, 'zufuehrung_rippe');
    box(0.08, 4.6, 0.1, copper, x - 0.58, 2.3, Z0 + 0.18, 'zufuehrung_rippe');
    box(0.08, 4.6, 0.1, copper, x + 0.58, 2.3, Z0 + 0.18, 'zufuehrung_rippe');
  }

  // ------------------------------------------------------------------ Eckpfeiler (leicht geneigt) + 60°-Streben
  const pf = [[-7.55, -5.35, 1], [7.55, -5.35, -1], [-7.55, 5.35, 1], [7.55, 5.35, -1]];
  for (const [x, z, s] of pf) {
    const p = box(0.32, H - 0.2, 0.32, pillarMat, x, (H - 0.2) / 2, z, 'pfeiler');
    p.rotation.z = s * 0.055;
    col('COL_pfeiler', 0.4, H, 0.4, x, H / 2, z);
  }
  // 60°-Winkelstreben an den Ecken (Atlantis-Motiv)
  const braceGeo = new THREE.BoxGeometry(0.26, 3.4, 0.18);
  const braces = [
    [-6.9, 3.4, -5.0, Math.PI / 3], [6.9, 3.4, -5.0, -Math.PI / 3],
    [-6.9, 3.4, 5.0, -Math.PI / 3], [6.9, 3.4, 5.0, Math.PI / 3],
  ];
  const braceMesh = new THREE.InstancedMesh(braceGeo, wallDark, braces.length);
  braces.forEach(([x, y, z, ry], i) => {
    o3.position.set(x, y, z); o3.rotation.set(0, ry, 0); o3.updateMatrix();
    braceMesh.setMatrixAt(i, o3.matrix);
  });
  braceMesh.name = 'eckstreben';
  root.add(braceMesh);

  // ------------------------------------------------------------------ Deckenschächte / Irisöffnungen
  const shape = new THREE.Shape();
  shape.moveTo(X0 - T, -(Z1 + T));
  shape.lineTo(X1 + T, -(Z1 + T));
  shape.lineTo(X1 + T, Z1 + T);
  shape.lineTo(X0 - T, Z1 + T);
  shape.closePath();
  for (const cx of shaftX) {
    const hole = new THREE.Path();
    hole.absarc(cx, 0, shaftR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false, curveSegments: 28 });
  ceilGeo.rotateX(-Math.PI / 2);
  const ceiling = addMesh(ceilGeo, ceilMat, 0, H, 0, 'decke');
  ceiling.castShadow = false;
  const ceilCol = new THREE.Mesh(ceilGeo);
  ceilCol.name = 'COL_decke';
  ceilCol.position.set(0, H, 0);
  ceilCol.visible = false;
  root.add(ceilCol);

  // Decken-Lichtfelder (abgehängt, seitlich der Schächte)
  for (const x of [-6.6, 6.6]) for (const z of [-4.4, 4.4]) {
    box(1.7, 0.06, 1.1, glowMat, x, H - 0.04, z, 'decke_lichtfeld');
    box(1.9, 0.12, 1.3, wallDark, x, H + 0.05, z, 'decke_lichtfeld_blende');
  }
  // Deckenrippen
  for (let x = -7.2; x <= 7.2; x += 2.4) {
    if (Math.abs(x - shaftX[0]) < shaftR || Math.abs(x - shaftX[1]) < shaftR) continue;
    box(0.14, 0.18, 12.6, wallDark, x, H - 0.09, 0, 'decke_rippe');
  }

  // Schachtkragen, Irisblätter und Glut – vollständig innerhalb der Raumhülle
  const bladeGeo = new THREE.BoxGeometry(1.5, 0.14, 0.95);
  const blades = new THREE.InstancedMesh(bladeGeo, hull, shaftX.length * 8);
  let bi = 0;
  for (const cx of shaftX) {
    // Kragen: offener Zylinder von Decke abwärts in den Raum (kein Teil ragt über die Decke hinaus)
    const liner = addMesh(
      new THREE.CylinderGeometry(shaftR + 0.05, shaftR + 0.05, shaftDepth, 32, 1, true),
      wallDark, cx, H - shaftDepth / 2, 0, 'schacht_wange',
    );
    liner.material = wallDark;
    // Schachtboden (geschlossen)
    addMesh(new THREE.CircleGeometry(shaftR + 0.05, 32), hull, cx, H - shaftDepth, 0, 'schacht_boden')
      .rotation.x = Math.PI / 2;
    // Glutfläche am Schachtboden, nach unten gerichtet
    const glowDisc = addMesh(new THREE.CircleGeometry(shaftR - 0.3, 32), shaftGlut, cx, H - shaftDepth + 0.03, 0, 'schacht_glut');
    glowDisc.rotation.x = Math.PI / 2;
    // Bronzering an der Deckenkante
    const ring = addMesh(new THREE.TorusGeometry(shaftR + 0.07, 0.11, 8, 36), copper, cx, H - 0.02, 0, 'schacht_ring');
    ring.rotation.x = Math.PI / 2;
    // Irisblätter am oberen Rand der Öffnung
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      o3.position.set(cx + Math.cos(a) * 2.05, H - 0.22, Math.sin(a) * 2.05);
      o3.rotation.set(0.55, -a, 0, 'YXZ');
      o3.updateMatrix();
      blades.setMatrixAt(bi++, o3.matrix);
    }
  }
  blades.count = bi;
  blades.name = 'schacht_irisblaetter';
  root.add(blades);

  // ------------------------------------------------------------------ Hydraulische Hubsäulen (Architektur)
  for (const cx of shaftX) {
    for (const z of [-4.3, 4.3]) {
      addMesh(new THREE.CylinderGeometry(0.52, 0.62, 0.34, 16), hull, cx, 0.17, z, 'hub_basis');
      addMesh(new THREE.CylinderGeometry(0.2, 0.24, 3.8, 14), pillarMat, cx, 2.2, z, 'hub_saeule');
      addMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), copper, cx, 1.1, z, 'hub_kragen');
      addMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), copper, cx, 3.3, z, 'hub_kragen');
      addMesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), stairMat, cx, 4.2, z, 'hub_kopf');
      col('COL_hub_saeule', 0.9, 4.3, 0.9, cx, 2.15, z);
    }
  }

  // Führungsschienen der Startrampen (flach am Boden, außerhalb der Rampenfläche)
  for (const cx of rampX) {
    for (const z of [-3.18, 3.18]) {
      box(6.4, 0.05, 0.14, stairMat, cx, 0.025, z, 'rampen_führung');
      box(6.4, 0.03, 0.05, copper, cx, 0.052, z, 'rampen_führung');
    }
  }

  // ------------------------------------------------------------------ Kollision Wände
  col('COL_wand_sued_links', 7.1, H, T, -4.75, H / 2, Z0 - T / 2);
  col('COL_wand_sued_rechts', 7.1, H, T, 4.75, H / 2, Z0 - T / 2);
  col('COL_wand_sued_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, Z0 - T / 2);
  col('COL_wand_nord', X1 - X0 + 2 * T, H, T, 0, H / 2, Z1 + T / 2);
  col('COL_wand_west', T, H, Z1 - Z0 + 2 * T, X0 - T / 2, H / 2, 0);
  col('COL_wand_ost_sued', T, H, 5.1, X1 + T / 2, H / 2, -3.75);
  col('COL_wand_ost_nord', T, H, 5.1, X1 + T / 2, H / 2, 3.75);
  col('COL_wand_ost_sturz', T, H - DOOR_H, 2.4, X1 + T / 2, DOOR_H + (H - DOOR_H) / 2, 0);

  // ------------------------------------------------------------------ Anschlüsse, Platzhalter, Licht
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Haupteingang (-Z, Außenrichtung -Z)
  empty('DOOR_haupteingang', 0, 0, Z0 - T / 2, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-049 – Korridor West Pier', raum: 'ATL-049',
  });
  // Servicetür (+X, Außenrichtung +X)
  empty('DOOR_servicetuer', X1 + T / 2, 0, 0, Math.PI / 2, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'ATL-003 – Steuerungssysteme', raum: 'ATL-003',
  });

  // Antiker Schiebetüren (OBJ-091), Vorderseite (+Z) zeigt in den Raum
  empty('PLACE_OBJ-091', 0, 0, Z0 - T / 2, 0);
  empty('PLACE_OBJ-091_2', X1 + T / 2, 0, 0, -Math.PI / 2);

  // Antike Drohnenwaffen (OBJ-032), Standobjekte 0,24 × 0,24 × 0,94 m
  // an der Nordwand, außerhalb der Rampenflächen (Freiraum ≥ 1,2 m)
  const waffen = [
    [-5.4, 5.45, Math.PI], [-2.4, 5.45, Math.PI],
    [2.4, 5.45, Math.PI], [5.4, 5.45, Math.PI],
  ];
  waffen.forEach(([x, z, ry], i) => {
    empty(i === 0 ? 'PLACE_OBJ-032' : `PLACE_OBJ-032_${i + 1}`, x, 0, z, ry);
  });

  // Ausfahrbare Drohnenstartrampen (OBJ-033), Bodenobjekte 6,00 × 0,36 × 6,00 m
  rampX.forEach((x, i) => {
    empty(i === 0 ? 'PLACE_OBJ-033' : `PLACE_OBJ-033_${i + 1}`, x, 0, 0, 0);
  });

  // Lichter
  empty('LAMP_1', 0, 5.35, -4.6, 0, { color: '#9fd8ff', intensity: 8, distance: 13 });
  empty('LAMP_2', 0, 5.35, 4.6, 0, { color: '#9fd8ff', intensity: 8, distance: 13 });
  empty('LAMP_3', shaftX[0], H - shaftDepth + 0.5, 0, 0, { color: '#ffd8a0', intensity: 12, distance: 16 });
  empty('LAMP_4', shaftX[1], H - shaftDepth + 0.5, 0, 0, { color: '#ffd8a0', intensity: 12, distance: 16 });
  empty('LAMP_5', -6.6, 5.2, -3.6, 0, { color: '#9fd8ff', intensity: 7, distance: 12 });
  empty('LAMP_6', 6.6, 5.2, 3.6, 0, { color: '#9fd8ff', intensity: 7, distance: 12 });

  // ------------------------------------------------------------------ Animation: langsames Pulsieren der Schachtglut
  let last = null, t = 0;
  const pulse = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    shaftGlut.emissiveIntensity = 2.1 + Math.sin(t * 0.55) * 0.35;
    lineGlow.emissiveIntensity = 1.6 + Math.sin(t * 0.8 + 1.2) * 0.1;
  };
  ceiling.onBeforeRender = pulse;
  slotMesh.onBeforeRender = pulse;

  root.userData.raum = {
    id: 'ATL-033',
    name: 'Drohnen-Startplattform',
    laenge: X1 - X0, breite: Z1 - Z0, hoehe: H,
    schaechte: shaftX.map((x) => ({ x, z: 0, radius: shaftR, tiefe: shaftDepth })),
  };
  return root;
}

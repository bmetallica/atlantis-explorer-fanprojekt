// Raum ATL-031: Zellen / Arrest (Brig) – West Pier, Etage 5.
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Bodenfläche, Bodenoberkante y = 0.
// Hauptzugang an der Seite -Z (Spieler betritt den Raum Richtung +Z).
// Leere Hülle: nur Architektur (Boden, Wände, Decke, Paneele, Lichtschlitze, Pilaster,
// Deckenspots, Zellpodeste). Arrestzellen und Waffen werden als fertige Objekte
// an die PLACE_-Punkte gesetzt.

import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_brig_holding_cell',
  art: 'Raum',
  masse: '10,8 m (X) × 9,6 m (Z) Grundfläche (≈ 104 m²), 3,2 m lichte Höhe, 4 freistehende Zellen',
  wohin: 'ATL-031 Zellen / Arrest, West Pier, Etage 5, militärischer Bereich',
  benutzen: 'Brig mit vier freistehenden Arrestzellen (OBJ-031) in der Raummitte, umlaufender Wachgang, Zugang über die Antiker-Schiebetür OBJ-091',
  lichter: '4 zielgerichtete Deckenspots über den Zellen (eisblau) + 2 indirekte Gangstreifen an den Längswänden',
  animation: 'Wandlichtschlitze und Zell-Spots atmen langsam und minimal',
  quelle: 'selbst gebaut nach Setplan Mallozzi "Holding Cell" (Sc. 159/160) und Stargate-Atlas-Screencaps',
};

const B = 10.8;        // lichte Breite (X)
const D = 9.6;         // lichte Tiefe (Z)
const H = 3.2;         // lichte Höhe
const T = 0.3;         // Wanddicke
const XW = B / 2;      // 5,4
const ZW = D / 2;      // 4,8
const DOOR_W = 2.4;
const DOOR_H = 3.0;

// Vier freistehende Zellen (3,0 × 3,0 m Grundfläche), gegenseitiger Abstand:
// X 1,8 m · Z 1,2 m · Gang um die Zellgruppe 1,2–1,5 m
const CELL_X = [-2.4, 2.4];
const CELL_Z = [-2.1, 2.1];
const CELL_B = 3.0;
const CELL_H = 2.7;
const CELL_T = 3.0;

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'raum_brig_holding_cell';

  const wallMat = kit('wall');
  const wallDark = kit('wallDark');
  const copper = kit('copper');
  const pillarMat = kit('pillar');
  const floorMat = kit('floor');
  const hull = kit('hull');
  const ceilingMat = kit('ceiling');
  const glow = kit('glow');
  const rail = kit('rail');
  const patina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.62, roughness: 0.44
  });
  const lineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xe6f7ff, emissive: 0x9fd8ff, emissiveIntensity: 1.3
  });
  const padMat = new THREE.MeshStandardMaterial({
    name: 'zellpodest', color: 0x1d242c, metalness: 0.5, roughness: 0.68
  });
  const padGlow = new THREE.MeshStandardMaterial({
    name: 'zellpodest_markierung', color: 0x8fd3ff, emissive: 0x2b6f9c, emissiveIntensity: 0.9
  });

  const add = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const o3 = new THREE.Object3D();
  function instanced(geo, mat, list, name) {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((p, i) => {
      o3.position.set(p[0], p[1], p[2]);
      o3.rotation.set(0, p[3] || 0, p[4] || 0);
      o3.scale.set(1, 1, 1);
      o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  }

  // ---------------------------------------------------------------- Boden
  box(B + 2 * T, 0.2, D + 2 * T, floorMat, 0, -0.1, 0, 'boden');

  // umlaufender Grün-/Kupfer-Rand
  for (const s of [-1, 1]) {
    box(0.22, 0.012, D - 0.3, patina, s * (XW - 0.11), 0.006, 0, 'boden_rand_x');
    box(B - 0.3, 0.012, 0.22, patina, 0, 0.006, s * (ZW - 0.11), 'boden_rand_z');
  }

  // Plattenfugen im 1,2-m-Raster
  const seamsX = [], seamsZ = [];
  for (let z = -4.8; z <= 4.801; z += 1.2) seamsX.push([0, 0.003, z]);
  for (let x = -5.4; x <= 5.401; x += 1.2) seamsZ.push([x, 0.003, 0]);
  instanced(new THREE.BoxGeometry(B - 0.5, 0.006, 0.025), copper, seamsX, 'boden_fugen_x');
  instanced(new THREE.BoxGeometry(0.025, 0.006, D - 0.5), copper, seamsZ, 'boden_fugen_z');

  // Markierung des umlaufenden Wachgangs (Kupferlinien vor den Wänden)
  for (const s of [-1, 1]) {
    box(0.05, 0.008, D - 1.6, copper, s * 4.62, 0.004, 0, 'gang_markierung_x');
    box(B - 1.6, 0.008, 0.05, copper, 0, 0.004, s * 4.02, 'gang_markierung_z');
  }

  // Zellpodeste (Bodeneinlage, Architektur – kein Objekt/Möbel)
  const padFrames = [];
  const PAD = 3.3;
  for (const cx of CELL_X) for (const cz of CELL_Z) {
    box(PAD, 0.03, PAD, padMat, cx, 0.015, cz, 'zellpodest');
    padFrames.push([cx, 0.032, cz - PAD / 2 + 0.04]);
    padFrames.push([cx, 0.032, cz + PAD / 2 - 0.04]);
    padFrames.push([cx - PAD / 2 + 0.04, 0.032, cz]);
    padFrames.push([cx + PAD / 2 - 0.04, 0.032, cz]);
  }
  instanced(new THREE.BoxGeometry(PAD - 0.12, 0.012, 0.06), copper, padFrames, 'zellpodest_rahmen');

  // kleine Leuchtmarkierung auf jedem Podest (Eckmarken)
  const padMarks = [];
  for (const cx of CELL_X) for (const cz of CELL_Z) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      padMarks.push([cx + sx * 1.42, 0.033, cz + sz * 1.42]);
    }
  }
  instanced(new THREE.BoxGeometry(0.16, 0.008, 0.16), padGlow, padMarks, 'zellpodest_leuchtmarken');

  // ---------------------------------------------------------------- Wände
  const zS = -ZW - T / 2;   // Südwand (Haupteingang), Wandmitte
  const zN = ZW + T / 2;    // Nordwand
  const xW = XW + T / 2;    // Seitenwände

  // Südwand mit 2,4 × 3,0-m-Öffnung
  const sideLen = (B - DOOR_W) / 2;   // 4,2
  box(sideLen, H, T, wallDark, -(DOOR_W / 2 + sideLen / 2), H / 2, zS, 'wand_sued_links');
  box(sideLen, H, T, wallDark, (DOOR_W / 2 + sideLen / 2), H / 2, zS, 'wand_sued_rechts');
  box(DOOR_W, H - DOOR_H, T, wallDark, 0, DOOR_H + (H - DOOR_H) / 2, zS, 'wand_sued_sturz');

  // Bronzeeinfassung der Türöffnung (1,2 m Wandfläche links/rechts zum Schieben frei)
  for (const s of [-1, 1]) {
    box(0.12, DOOR_H, 0.1, copper, s * (DOOR_W / 2 + 0.03), DOOR_H / 2, zS + T / 2 + 0.03, 'tuer_rahmen_seite');
    box(0.1, 0.22, T, copper, s * (DOOR_W / 2 + 0.03), DOOR_H - 0.1, zS, 'tuer_rahmen_fuehrung');
  }
  box(DOOR_W + 0.3, 0.16, 0.12, copper, 0, DOOR_H + 0.02, zS + T / 2 + 0.03, 'tuer_rahmen_sturz');

  // Nordwand, Seitenwände (massiv – Arrestraum ohne Tageslicht)
  box(B, H, T, wallDark, 0, H / 2, zN, 'wand_nord');
  for (const s of [-1, 1]) box(T, H, D + T, wallDark, s * xW, H / 2, 0, s < 0 ? 'wand_west' : 'wand_ost');

  // Sockelleisten und Gesimse (an der Türöffnung geteilt)
  box(sideLen, 0.15, 0.05, copper, -(DOOR_W / 2 + sideLen / 2), 0.075, zS + T / 2 + 0.025, 'sockel_sued_l');
  box(sideLen, 0.15, 0.05, copper, (DOOR_W / 2 + sideLen / 2), 0.075, zS + T / 2 + 0.025, 'sockel_sued_r');
  box(B, 0.15, 0.05, copper, 0, 0.075, zN - T / 2 - 0.025, 'sockel_nord');
  for (const s of [-1, 1]) box(0.05, 0.15, D + T, copper, s * (XW - 0.025), 0.075, 0, s < 0 ? 'sockel_west' : 'sockel_ost');

  box(sideLen, 0.1, 0.06, copper, -(DOOR_W / 2 + sideLen / 2), H - 0.05, zS + T / 2 + 0.03, 'gesims_sued_l');
  box(sideLen, 0.1, 0.06, copper, (DOOR_W / 2 + sideLen / 2), H - 0.05, zS + T / 2 + 0.03, 'gesims_sued_r');
  box(B, 0.1, 0.06, copper, 0, H - 0.05, zN - T / 2 - 0.03, 'gesims_nord');
  for (const s of [-1, 1]) box(0.06, 0.1, D + T, copper, s * (XW - 0.03), H - 0.05, 0, s < 0 ? 'gesims_west' : 'gesims_ost');

  // Gürtelband unter der Decke
  box(sideLen, 0.07, 0.05, copper, -(DOOR_W / 2 + sideLen / 2), 2.96, zS + T / 2 + 0.025, 'band_sued_l');
  box(sideLen, 0.07, 0.05, copper, (DOOR_W / 2 + sideLen / 2), 2.96, zS + T / 2 + 0.025, 'band_sued_r');
  box(B, 0.07, 0.05, copper, 0, 2.96, zN - T / 2 - 0.025, 'band_nord');
  for (const s of [-1, 1]) box(0.05, 0.07, D + T, copper, s * (XW - 0.025), 2.96, 0, s < 0 ? 'band_west' : 'band_ost');

  // ---------------------------------------------------------------- Wandpaneele und Lichtschlitze
  const framesX = [], panelsX = [], slotsX = [], framesZ = [], panelsZ = [], slotsZ = [];

  function panelRun(axis, fixed, u0, u1, s) {
    const len = u1 - u0;
    if (len < 0.2) return;
    const n = Math.max(1, Math.round(len / 1.2));
    const step = len / n;
    for (let i = 0; i < n; i++) {
      const uc = u0 + step * (i + 0.5);
      if (i % 2 === 0) {
        if (axis === 'x') {
          framesX.push([uc, 1.55, fixed + s * 0.035]);
          panelsX.push([uc, 1.55, fixed + s * 0.062]);
        } else {
          framesZ.push([fixed + s * 0.035, 1.55, uc]);
          panelsZ.push([fixed + s * 0.062, 1.55, uc]);
        }
      } else {
        for (let k = 0; k < 4; k++) {
          const y = 1.02 + k * 0.44;
          if (axis === 'x') slotsX.push([uc, y, fixed + s * 0.014]);
          else slotsZ.push([fixed + s * 0.014, y, uc]);
        }
      }
    }
  }

  panelRun('x', -ZW, -XW, -DOOR_W / 2, 1);      // Südwand links
  panelRun('x', -ZW, DOOR_W / 2, XW, 1);       // Südwand rechts
  panelRun('x', ZW, -XW, XW, -1);              // Nordwand
  panelRun('z', -XW, -ZW, ZW, 1);              // Westwand
  panelRun('z', XW, -ZW, ZW, -1);              // Ostwand

  instanced(new THREE.BoxGeometry(1.0, 2.7, 0.06), copper, framesX, 'paneel_rahmen_x');
  instanced(new THREE.BoxGeometry(0.9, 2.45, 0.035), wallMat, panelsX, 'paneele_x');
  instanced(new THREE.BoxGeometry(0.06, 2.7, 1.0), copper, framesZ, 'paneel_rahmen_z');
  instanced(new THREE.BoxGeometry(0.035, 2.45, 0.9), wallMat, panelsZ, 'paneele_z');
  const slotMeshX = instanced(new THREE.BoxGeometry(0.05, 0.3, 0.02), lineGlow, slotsX, 'lichtschlitze_x');
  const slotMeshZ = instanced(new THREE.BoxGeometry(0.02, 0.3, 0.05), lineGlow, slotsZ, 'lichtschlitze_z');

  // ---------------------------------------------------------------- Wandpilaster (flach an die Wand, Gang bleibt frei)
  const pilasters = [];
  for (const s of [-1, 1]) {
    for (const z of [-2.4, 0, 2.4]) {
      pilasters.push([s * (XW - 0.09), H / 2, z, 0, 0]);
      pilasters.push([s * (XW - 0.09), 1.0, z, 0, 0]);
    }
  }
  instanced(new THREE.BoxGeometry(0.18, H, 0.34), pillarMat, pilasters, 'wandpilaster');

  // Ecken-Säulen (bündig an die Wand gesetzt)
  const cornerCols = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cornerCols.push([sx * 5.25, H / 2, sz * 4.55, 0, 0]);
  }
  instanced(new THREE.BoxGeometry(0.3, H, 0.42), pillarMat, cornerCols, 'eckensaeulen');

  // Wandlüftungsgitter (fest eingebaute Architektur)
  const vents = [];
  for (const sx of [-1, 1]) for (const vz of [-2.4, 0, 2.4]) {
    vents.push([sx * (XW - 0.06), 2.45, vz, 0, 0]);
  }
  instanced(new THREE.BoxGeometry(0.1, 0.5, 1.1), hull, vents, 'lueftungsgitter');

  // ---------------------------------------------------------------- Waffenhalter (fest eingebaute Architektur)
  box(0.06, 0.62, 0.62, hull, -XW + 0.03, 1.3, -2.0, 'waffenhalter_rueckplatte');
  box(0.22, 0.05, 0.5, rail, -XW + 0.16, 1.0, -2.0, 'waffenhalter_ablage');
  for (const dz of [-0.16, 0.16]) box(0.16, 0.13, 0.05, copper, -XW + 0.14, 1.06, -2.0 + dz, 'waffenhalter_clip');

  // ---------------------------------------------------------------- Decke
  box(B + 2 * T, 0.3, D + 2 * T, ceilingMat, 0, H + 0.15, 0, 'decke_hauptebene');

  // Deckenkassetten (dunkel abgesetzte Felder)
  const kass = [];
  for (let x = -4.8; x <= 4.801; x += 1.2) {
    for (let z = -4.2; z <= 4.201; z += 1.2) kass.push([x, H - 0.02, z]);
  }
  instanced(new THREE.BoxGeometry(0.96, 0.04, 0.96), wallDark, kass, 'decke_kassetten');

  // indirekte Lichtbänder über dem umlaufenden Gang
  for (const s of [-1, 1]) {
    box(0.09, 0.04, D - 1.8, glow, s * 4.95, H - 0.03, 0, 'decke_lichtband_x');
    box(0.09, 0.04, D - 1.8, copper, s * 5.02, H - 0.06, 0, 'decke_lichtband_leiste');
  }
  box(B - 1.8, 0.04, 0.09, glow, 0, H - 0.03, ZW - 0.42, 'decke_lichtband_nord');

  // Spots von oben auf die Zellen
  const spots = [];
  for (const cx of CELL_X) for (const cz of CELL_Z) {
    box(0.66, 0.26, 0.66, hull, cx, H - 0.13, cz, 'decke_spot_gehaeuse');
    box(0.7, 0.05, 0.7, copper, cx, H - 0.27, cz, 'decke_spot_rahmen');
    box(0.46, 0.04, 0.46, glow, cx, H - 0.29, cz, 'decke_spot_linse');
    spots.push([cx, H - 0.32, cz]);
  }

  // ---------------------------------------------------------------- Anschlüsse, Objektplätze, Licht
  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Haupteingang: DOOR zeigt nach außen (-Z), Tür-Objekt zeigt mit +Z in den Raum
  empty('DOOR_haupteingang', 0, 0, zS, Math.PI, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Gang West Pier', raum: 'ATL-049'
  });
  empty('PLACE_OBJ-091', 0, 0, zS, 0);

  // Arrestzellen (3,0 × 2,7 × 3,0 m), Vorderseite zum Eingang
  let nCell = 0;
  for (const cx of CELL_X) for (const cz of CELL_Z) {
    nCell++;
    empty(nCell === 1 ? 'PLACE_OBJ-031' : `PLACE_OBJ-031_${nCell}`, cx, 0, cz, Math.PI);
  }

  // Waffen
  empty('PLACE_OBJ-060', -XW + 0.18, 1.025, -2.0, Math.PI / 2);  // Handblaster auf dem Halter
  empty('PLACE_OBJ-061', -XW + 0.16, 0, 0.55, Math.PI / 2);       // Betäubungsgewehr stehend an der Wand

  // Lichtpunkte für das Spiel
  let nLamp = 0;
  for (const p of spots) {
    nLamp++;
    empty(`LAMP_${nLamp}`, p[0], p[1], p[2], 0, { color: '#9fd8ff', intensity: 10, distance: 6.5 });
  }
  empty(`LAMP_${++nLamp}`, -XW + 0.6, H - 0.35, 0, 0, { color: '#9fd8ff', intensity: 5, distance: 7 });
  empty(`LAMP_${++nLamp}`, XW - 0.6, H - 0.35, 0, 0, { color: '#9fd8ff', intensity: 5, distance: 7 });

  // Sichtbares Licht: Spots von oben auf die Zellen
  const spotLights = [];
  for (const [cx, cy, cz] of spots) {
    const sl = new THREE.SpotLight(0x9fd8ff, 16, 6.4, Math.PI / 6.2, 0.5, 1.15);
    sl.position.set(cx, cy, cz);
    sl.target.position.set(cx, 0, cz);
    root.add(sl);
    root.add(sl.target);
    spotLights.push(sl);
  }
  root.add(new THREE.AmbientLight(0x5f7f96, 0.42));

  // ---------------------------------------------------------------- Kollision
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.visible = false;
    root.add(m);
  };
  col('COL_boden', B + 2 * T, 0.2, D + 2 * T, 0, -0.1, 0);
  col('COL_decke', B + 2 * T, 0.3, D + 2 * T, 0, H + 0.15, 0);
  col('COL_wand_sued_links', sideLen, H, T, -(DOOR_W / 2 + sideLen / 2), H / 2, zS);
  col('COL_wand_sued_rechts', sideLen, H, T, (DOOR_W / 2 + sideLen / 2), H / 2, zS);
  col('COL_wand_sued_sturz', DOOR_W, H - DOOR_H, T, 0, DOOR_H + (H - DOOR_H) / 2, zS);
  col('COL_wand_nord', B, H, T, 0, H / 2, zN);
  for (const s of [-1, 1]) col(s < 0 ? 'COL_wand_west' : 'COL_wand_ost', T, H, D + T, s * xW, H / 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    col(`COL_eckensaeule_${sx < 0 ? 'w' : 'o'}${sz < 0 ? 's' : 'n'}`, 0.34, H, 0.46, sx * 5.25, H / 2, sz * 4.55);
  }
  // Zellvolumen (Käfig + Kraftfeld) als Sperrvolumen
  let nColCell = 0;
  for (const cx of CELL_X) for (const cz of CELL_Z) {
    nColCell++;
    col(`COL_zelle_${nColCell}`, CELL_B, CELL_H, CELL_T, cx, CELL_H / 2, cz);
  }

  // ---------------------------------------------------------------- dezentes Lichtatmen
  let t = 0, last = null;
  const breathe = () => {
    const now = performance.now() / 1000;
    if (last !== null) t += Math.min(now - last, 0.1);
    last = now;
    lineGlow.emissiveIntensity = 1.28 + Math.sin(t * 0.7) * 0.11;
    for (let i = 0; i < spotLights.length; i++) {
      spotLights[i].intensity = 16 + Math.sin(t * 0.55 + i * 0.9) * 1.2;
    }
  };
  slotMeshX.onBeforeRender = breathe;
  slotMeshZ.onBeforeRender = breathe;

  root.userData.raum = {
    id: 'ATL-031',
    breite: B, tiefe: D, hoehe: H,
    zellen: 4,
    gangBreite: 1.2
  };
  return root;
}

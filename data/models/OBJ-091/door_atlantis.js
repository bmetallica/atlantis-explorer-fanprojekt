// Antike Schiebetür von Atlantis (OBJ-091). Einbauobjekt für Türöffnungen 2,4 × 3,0 m (wie b.door im Spiel).
// 1 Einheit = 1 m, +Y oben. Ursprung = Mitte der Öffnung am Boden in der Wandebene (Wandmitte),
// Vorderseite (Raum-/Gangseite) zeigt nach +Z. Die Zarge ist beidseitig gleich und deckt Wände bis 0,4 m Dicke ab.
// Die beiden Flügel gleiten seitlich in die Zarge.
//
// Funktionen (userData.api): oeffnen(), schliessen(), umschalten(), verriegeln(), entriegeln(), Getter offen/verriegelt.
// Kollision: COL_fluegel blockiert, solange userData.aktiv === true (Tür zu); Zarge immer fest.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'door_atlantis',
  art: 'Einbauobjekt (Tür in Wandöffnung)',
  masse: '3.30 × 3.75 × 0.46 m (Zarge B × H × T), lichte Öffnung 2.40 × 3.00 m',
  wohin: 'in jede Türöffnung (DOOR_-Punkte der Räume/Korridore), Ursprung auf DOOR_-Punkt',
  benutzen: 'INT_tuer (beide Seiten) → öffnen/schließen; mit dem Türpaneel (OBJ-052) koppelbar',
  lichter: 'Leuchtstreifen in der Zarge (eisblau = frei, rot = verriegelt), Schlussstein bernstein',
  animation: 'Flügel gleiten weich in die Zarge (0,9 s), Statuslichter wechseln die Farbe',
  quelle: 'selbst gebaut nach Screencaps (Transporter-Tür, Atrium-Tür, Quarantäne-Türen)',
};

const W = 2.4, HT = 3.0;          // lichte Öffnung
const ZB = 0.45;                  // Zargenbreite seitlich
const ZT = 0.46;                  // Zargentiefe (über die Wand)
const LT = 0.12;                  // Flügeldicke

function leafShape(w, h) {          // Flügelkontur: oben zur Mitte hin abgeschrägt (polygonal)
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h - 0.35); s.lineTo(w - 0.25, h); s.lineTo(0, h); s.closePath();
  return s;
}
function panelShape(w, h, c) {      // erhabene Kassette mit abgeschrägten Ecken
  const s = new THREE.Shape();
  s.moveTo(c, 0); s.lineTo(w - c, 0); s.lineTo(w, c); s.lineTo(w, h - c); s.lineTo(w - c, h); s.lineTo(c, h); s.lineTo(0, h - c); s.lineTo(0, c); s.closePath();
  return s;
}

export function create() {
  const root = new THREE.Group();
  root.name = 'door_atlantis';
  const copper = kit('copper');
  const doorMat = new THREE.MeshStandardMaterial({ name: 'tuerfluegel', color: 0x4a2f24, metalness: 0.75, roughness: 0.42 });
  const panelMat = new THREE.MeshStandardMaterial({ name: 'tuer_kassette', color: 0x5d3a2c, metalness: 0.75, roughness: 0.36 });
  const frameMat = new THREE.MeshStandardMaterial({ name: 'tuer_zarge', color: 0x6a4a34, metalness: 0.8, roughness: 0.38 });
  const statusMat = new THREE.MeshStandardMaterial({ name: 'tuer_status', color: 0xdff4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.6 });
  const keyMat = new THREE.MeshStandardMaterial({ name: 'tuer_schlussstein', color: 0xffc070, emissive: 0xffa040, emissiveIntensity: 1.4, transparent: true, opacity: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ name: 'tuer_fuge', color: 0x1c1512, metalness: 0.5, roughness: 0.7 });

  const box = (w, h, d, mat, x, y, z, parent = root) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };

  // ---------------------------------------------------------------- Zarge (beidseitig), gestufter Kronen-Aufsatz
  for (const s of [-1, 1]) {
    box(ZB, HT + 0.25, ZT, frameMat, s * (W / 2 + ZB / 2), (HT + 0.25) / 2, 0);          // Pfosten
    box(0.06, HT, ZT + 0.03, copper, s * (W / 2 + 0.03), HT / 2, 0);                     // innere Kante
    box(0.05, HT - 0.4, ZT + 0.04, statusMat, s * (W / 2 + ZB - 0.12), 0.2 + (HT - 0.4) / 2, 0); // Leuchtstreifen
  }
  box(W + 2 * ZB, 0.25, ZT, frameMat, 0, HT + 0.125, 0);                                 // Sturz
  // Krone: zwei Stufen + Schlussstein mit Dreieck
  box(W * 0.62, 0.22, ZT - 0.04, frameMat, 0, HT + 0.36, 0);
  box(W * 0.3, 0.26, ZT - 0.08, frameMat, 0, HT + 0.6, 0);
  const tri = new THREE.Shape(); tri.moveTo(-0.13, 0.1); tri.lineTo(0.13, 0.1); tri.lineTo(0, -0.12); tri.closePath();
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.02, bevelEnabled: false });
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(triGeo, keyMat);
    t.position.set(0, HT + 0.6, s * (ZT / 2 - 0.03));
    if (s < 0) t.rotation.y = Math.PI;
    root.add(t);
    box(W + 2 * ZB + 0.04, 0.05, 0.03, copper, 0, HT + 0.27, s * (ZT / 2 + 0.01));        // Bronzeband
  }

  // ---------------------------------------------------------------- Flügel (gleiten seitlich in die Zarge)
  const leafGeo = new THREE.ExtrudeGeometry(leafShape(W / 2, HT), { depth: LT, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  leafGeo.translate(0, 0, -LT / 2);
  const kassOben = new THREE.ExtrudeGeometry(panelShape(0.78, 0.9, 0.16), { depth: 0.025, bevelEnabled: false });
  const kassUnten = new THREE.ExtrudeGeometry(panelShape(0.78, 1.05, 0.12), { depth: 0.025, bevelEnabled: false });
  const leaves = [];
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    const body = new THREE.Mesh(leafGeo, doorMat);
    body.scale.x = -s;                               // Abschrägung zeigt zur Türmitte
    leaf.add(body);
    for (const side of [1, -1]) {                    // Kassetten auf beiden Seiten
      for (const [geo, y] of [[kassOben, 1.75], [kassUnten, 0.35]]) {
        const k = new THREE.Mesh(geo, panelMat);
        k.position.set(-s * (0.21 + 0.78) + (s > 0 ? 0 : 0), y, side * (LT / 2 + 0.002));
        k.position.x = s > 0 ? -(0.21 + 0.78) : 0.21;
        if (side < 0) { k.rotation.y = Math.PI; k.position.x += 0.78; }
        leaf.add(k);
      }
      // Mittelband zwischen den Kassetten
      const band = box(0.9, 0.08, 0.02, darkMat, s > 0 ? -0.6 : 0.6, 1.55, side * (LT / 2 + 0.01), leaf);
      band.scale.x = 1;
    }
    leaf.position.set(s > 0 ? W / 2 : -W / 2, 0, 0);  // Flügel am Pfosten verankert, reicht bis zur Mitte
    root.add(leaf);
    leaves.push({ s, leaf });
  }
  box(0.02, HT - 0.05, LT + 0.02, darkMat, 0, (HT - 0.05) / 2, 0).name = 'tuer_mittelfuge';
  const mittelfuge = root.children[root.children.length - 1];

  // ---------------------------------------------------------------- Kollision, Benutzen, Licht
  const col = (name, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d)); m.name = name; m.position.set(x, y, z); m.visible = false; root.add(m); return m; };
  for (const s of [-1, 1]) col(`COL_zarge_${s < 0 ? 'l' : 'r'}`, ZB, HT + 0.85, ZT, s * (W / 2 + ZB / 2), (HT + 0.85) / 2, 0);
  col('COL_sturz', W, 0.85, ZT, 0, HT + 0.425, 0);
  const colLeaf = col('COL_fluegel', W, HT, LT + 0.04, 0, HT / 2, 0);
  colLeaf.userData.aktiv = true;
  for (const [n, z] of [['INT_tuer', 0.9], ['INT_tuer_innen', -0.9]]) {
    const o = new THREE.Object3D(); o.name = n; o.position.set(W / 2 + 0.4, 1.2, z); o.userData = { label: 'Tür', radius: 1.2 }; root.add(o);
  }
  const lamp = new THREE.Object3D(); lamp.name = 'LAMP_schlussstein'; lamp.position.set(0, HT + 0.6, 0.6);
  lamp.userData = { color: '#ffb060', intensity: 2, distance: 3 }; root.add(lamp);

  // ---------------------------------------------------------------- Zustand + Animation
  let offen = false, verriegelt = false, e = 0, last = null;
  const blau = new THREE.Color(0x9fd8ff), rot = new THREE.Color(0xff4030), farbe = blau.clone();
  function update(dt) {
    const ziel = offen && !verriegelt ? 1 : 0;
    const v = 1 / 0.9;                                   // 0,9 s für eine volle Bewegung, weich ein-/ausgeblendet
    e += Math.sign(ziel - e) * Math.min(Math.abs(ziel - e), dt * v);
    const k = e * e * (3 - 2 * e);
    for (const { s, leaf } of leaves) leaf.position.x = s * (W / 2 + k * (W / 2 - 0.02));
    mittelfuge.visible = k < 0.02;
    colLeaf.userData.aktiv = k < 0.6;
    farbe.lerp(verriegelt ? rot : blau, Math.min(1, dt * 6));
    statusMat.emissive.copy(farbe); statusMat.color.copy(farbe).lerp(new THREE.Color(0xffffff), 0.25);
  }
  leaves[0].leaf.children[0].onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) update(Math.min(now - last, 0.1));
    last = now;
  };

  const api = {
    oeffnen() { offen = true; },
    schliessen() { offen = false; },
    umschalten() { offen = !offen; },
    verriegeln() { verriegelt = true; },
    entriegeln() { verriegelt = false; },
    get offen() { return offen && !verriegelt; },
    get verriegelt() { return verriegelt; },
  };
  root.userData.api = api;
  root.userData.actions = [
    { id: 'oeffnen', label: 'Tür öffnen', run: () => api.oeffnen() },
    { id: 'schliessen', label: 'Tür schließen', run: () => api.schliessen() },
    { id: 'verriegeln', label: 'Tür verriegeln (Lockdown)', run: () => api.verriegeln() },
    { id: 'entriegeln', label: 'Tür entriegeln', run: () => api.entriegeln() },
  ];
  return root;
}

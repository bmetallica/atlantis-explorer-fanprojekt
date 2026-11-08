// Puddle Jumper (OBJ-009) – Antiker-Kurzstreckenschiff („Gateship“).
// Außenhülle aus der 3D-Druck-Vorlage PuddleJprMag3.stl (vom User bereitgestellt), aufbereitet mit
// build/tools/jumper_stl.py: Cockpitglas, Heckklappe und Antriebsgondeln als eigene, bewegliche Teile.
// 1 Einheit = 1 m, +Y oben, Cockpit (Vorderseite) zeigt nach +Z, Ursprung = Mitte der Unterseite (liegt flach auf y = 0).
//
// Funktionen (root.userData.api): rampeOeffnen/rampeSchliessen, gondelnAusfahren/gondelnEinfahren,
//   tarnungAn/tarnungAus, drohneAbfeuern; Zustand über Getter (rampeOffen, gondelnAusgefahren, getarnt).
// Animation läuft selbstständig (onBeforeRender des Rumpfs).
import * as THREE from 'three';

const GEO = /*__GEO__*/null;

export const steckbrief = {
  name: 'puddle_jumper',
  art: 'Standobjekt (Fahrzeug)',
  masse: 'ca. 3,2 × 2,8 × 7,9 m (B × H × T), Gondeln ausgefahren ca. 5,3 m breit',
  wohin: 'Jumper-Hangar (ATL-040) auf den Abstellplattformen, Cockpit zur Hangarmitte',
  benutzen: 'INT_rampe (Heck) → Heckklappe; INT_gondeln (Flanke) → Antrieb; INT_tarnung (Cockpit) → Tarnung/Drohnen',
  lichter: 'LAMP_innen (gedämpftes Kabinenlicht); Triebwerksdüsen der Gondeln leuchten über Emission',
  animation: 'Heckklappe klappt nach hinten ab, Gondeln klappen aus/an, Tarnung blendet aus, Drohnenstart',
  quelle: 'Außenhülle: 3D-Druck-Modell (PuddleJprMag3.stl), vereinfacht; Teile und Funktionen ergänzt',
};

function decode(t) {
  const bin = (b64) => { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bin(t.pos)), 3));
  g.setIndex(new THREE.BufferAttribute(t.idx32 ? new Uint32Array(bin(t.idx)) : new Uint16Array(bin(t.idx)), 1));
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

export function create() {
  const root = new THREE.Group();
  root.name = 'puddle_jumper';
  const ship = new THREE.Group();          // alles, was getarnt wird
  root.add(ship);

  const hullMat = new THREE.MeshStandardMaterial({ name: 'jumper_huelle', color: 0x6b7077, metalness: 0.65, roughness: 0.42, flatShading: true, side: THREE.DoubleSide });
  const innenMat = new THREE.MeshStandardMaterial({ name: 'jumper_innen', color: 0x5d646c, metalness: 0.35, roughness: 0.6, flatShading: true });
  const pultMat = new THREE.MeshStandardMaterial({ name: 'jumper_pult', color: 0x3a3f45, metalness: 0.5, roughness: 0.5, flatShading: true });
  const seatMat = new THREE.MeshStandardMaterial({ name: 'sitze', color: 0x4a4038, metalness: 0.2, roughness: 0.8 });
  const consoleGlow = new THREE.MeshStandardMaterial({ name: 'konsole_licht', color: 0x332010, emissive: 0xffa040, emissiveIntensity: 1.2 });
  const glasMat = new THREE.MeshStandardMaterial({ name: 'jumper_glas', color: 0x16283a, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.72, flatShading: true });
  const driveGlow = new THREE.MeshStandardMaterial({ name: 'triebwerk', color: 0x9fdcff, emissive: 0x7fd0ff, emissiveIntensity: 0.2, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ name: 'kufen', color: 0x33363b, metalness: 0.5, roughness: 0.6 });
  const droneMat = new THREE.MeshStandardMaterial({ name: 'drohne', color: 0xffd060, emissive: 0xffb030, emissiveIntensity: 3, transparent: true });

  const T = GEO.teile;
  const part = (name, mat, parent = ship) => {
    if (!T[name]) return null;
    const m = new THREE.Mesh(decode(T[name]), mat); m.name = name; parent.add(m); return m;
  };
  // Rumpf (beidseitig gezeichnet: innen sichtbar durch Scheibe und offene Klappe) + Cockpitglas
  const hullMesh = part('rumpf', hullMat);
  part('glas', glasMat);
  part('nische_l', hullMat); part('nische_r', hullMat);   // geschlossene Gondelnischen
  const hb = hullMesh.geometry.boundingBox;
  const W = hb.max.x - hb.min.x, Z_FRONT = hb.max.z, Z_REAR = hb.min.z, HH = hb.max.y;
  const kb = new THREE.Box3().setFromBufferAttribute(decode(T.klappe).attributes.position);
  // Innenleben aus dem Jumper-Bausatz (Pult, Seitenwände, Bänke, Bodenplatte) + Kabinenboden
  for (const name of Object.keys(T)) if (name.startsWith('innen_')) part(name, name === 'innen_pult' ? pultMat : innenMat);
  const boden = new THREE.Mesh(new THREE.BoxGeometry((kb.max.x - kb.min.x) * 0.95, 0.06, (Z_FRONT - Z_REAR) * 0.8), darkMat);
  boden.name = 'kabinenboden'; boden.position.set(0, GEO.y0 + 0.14, (Z_FRONT + Z_REAR) / 2 - 0.2); ship.add(boden);
  // Pilotensitze und Leuchten auf dem Pult (wie in der früheren Version)
  if (T.innen_pult) {
    const pb = T.innen_pult;
    for (const x of [-0.6, 0.6]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.55), seatMat);
      seat.name = 'pilotensitz'; seat.position.set(x, GEO.y0 + 0.65, pb.min[2] - 0.75); ship.add(seat);
    }
    for (let i = 0; i < 8; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.06), consoleGlow);
      l.name = 'pult_licht'; l.position.set(-0.9 + i * 0.26, pb.max[1] + 0.015, (pb.min[2] + pb.max[2]) / 2); ship.add(l);
    }
  }
  // keine Kufen: der Rumpf liegt flach auf

  // Heckklappe: an der hinteren Unterkante angeschlagen, klappt nach hinten ab, bis sie flach als Rampe aufliegt
  const kpos = decode(T.klappe).attributes.position;
  let zb = Infinity, ztS = 0, ztN = 0;
  for (let i = 0; i < kpos.count; i++) {
    const y = kpos.getY(i), z = kpos.getZ(i);
    if (y < kb.min.y + 0.08) zb = Math.min(zb, z);
    if (y > kb.max.y - 0.12) { ztS += z; ztN++; }
  }
  const neigung = Math.atan2(zb - ztS / ztN, kb.max.y - kb.min.y);     // > 0: Oberkante hängt nach hinten über
  const OFFEN = Math.PI / 2 - neigung - 0.03;
  const klappePivot = new THREE.Group(); klappePivot.name = 'klappe_gelenk';
  klappePivot.position.set(0, kb.min.y, zb); ship.add(klappePivot);
  const klappe = part('klappe', hullMat, klappePivot); klappe.position.set(0, -kb.min.y, -zb);

  // Gondeln: Gelenk an der inneren Längskante, eingefahren an den Rumpf geklappt
  const pods = [];
  for (const [g, d, s] of [['gondel_l', 'duese_l', 1], ['gondel_r', 'duese_r', -1]]) {
    if (!T[g]) continue;
    const gb = new THREE.Box3().setFromBufferAttribute(decode(T[g]).attributes.position);
    const pivot = new THREE.Group(); pivot.name = g + '_gelenk';
    const px = s > 0 ? gb.min.x : gb.max.x, py = (gb.min.y + gb.max.y) / 2;
    pivot.position.set(px, py, 0); ship.add(pivot);
    for (const [nm, mat] of [[g, hullMat], [d, driveGlow]]) {
      const m = part(nm, mat, pivot); if (m) m.position.set(-px, -py, 0);
    }
    // Düse am Gondelheck: Ring + leuchtender Kern
    const r = Math.min(gb.max.x - gb.min.x, gb.max.y - gb.min.y) * 0.32;
    const dx = (gb.min.x + gb.max.x) / 2 - px, dy = (gb.min.y + gb.max.y) / 2 - py;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.28, 16, 1, true), darkMat);
    ring.name = 'duese_ring'; ring.rotation.x = Math.PI / 2; ring.position.set(dx, dy, gb.min.z - 0.1); pivot.add(ring);
    const kern = new THREE.Mesh(new THREE.CircleGeometry(r * 0.92, 16), driveGlow);
    kern.name = 'duese_kern'; kern.rotation.y = Math.PI; kern.position.set(dx, dy, gb.min.z - 0.02); pivot.add(kern);
    // eingefahren: Außenhaut der Gondel liegt bündig in der Rumpfseite (Gondel leicht angehoben, damit nichts unten heraussteht)
    pods.push({ pivot, s, x0: px, y0: py, weg: (s > 0 ? gb.max.x : -gb.min.x) - GEO.halb - 0.02 });
  }
  // eingefahren: Gondeln seitlich in den Rumpf geschoben (nur die Außenhaut bleibt als Wulst sichtbar)
  const placePods = (e) => { for (const p of pods) { p.pivot.position.x = p.x0 - p.s * (1 - e) * p.weg; p.pivot.position.y = p.y0 + (1 - e) * 0.14; p.pivot.visible = e > 0.04; } };   // ganz eingefahren: im Rumpf verschwunden

  // --- Kollision: Wände, Boden, Dach, Front (Heck bleibt begehbar) + Klappe
  const col = (name, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name; m.position.set(x, y, z); m.visible = false; root.add(m); return m;
  };
  const BW = GEO.halb * 2;            // Rumpfbreite ohne Gondeln
  const LEN = Z_FRONT - Z_REAR, ZM = (Z_FRONT + Z_REAR) / 2;
  col('COL_boden', BW, GEO.y0 + 0.15, LEN, 0, (GEO.y0 + 0.15) / 2, ZM);
  col('COL_dach', BW, 0.3, LEN, 0, HH - 0.15, ZM);
  col('COL_links', 0.2, HH, LEN, BW / 2 - 0.1, HH / 2, ZM);
  col('COL_rechts', 0.2, HH, LEN, -BW / 2 + 0.1, HH / 2, ZM);
  col('COL_cockpit', BW, HH, 0.9, 0, HH / 2, Z_FRONT - 0.6);
  const colRamp = col('COL_rampe', kb.max.x - kb.min.x, kb.max.y - kb.min.y, 0.15, 0, (kb.min.y + kb.max.y) / 2, (kb.min.z + kb.max.z) / 2);
  colRamp.userData.aktiv = true;   // true = Klappe geschlossen (Heck blockiert)

  // --- Benutzen-Punkte, Licht
  const intp = (name, label, x, y, z, r) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); o.userData = { label, radius: r }; root.add(o);
  };
  intp('INT_rampe', 'Heckklappe', 0, 1.0, Z_REAR - 1.2, 1.3);
  intp('INT_gondeln', 'Antriebsgondeln', GEO.halb + 1.4, 1.2, -1.0, 1.2);
  intp('INT_tarnung', 'Jumper-Steuerung', 0, 1.2, Z_FRONT - 2.0, 1.0);
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_innen';
  lamp.position.set(0, HH - 0.5, ZM);
  lamp.userData = { color: '#9fc8ff', intensity: 4, distance: 5 };
  root.add(lamp);

  // ============================================================ Zustand + Animation
  let rampOpen = false, podsOut = false, cloaked = false;
  let rampE = 0, podE = 0, cloakE = 0, time = 0, last = null;
  placePods(0);
  const drones = [];
  const shipMats = [hullMat, innenMat, pultMat, seatMat, consoleGlow, glasMat, driveGlow, darkMat];
  const baseOpacity = new Map(shipMats.map((m) => [m, { op: m.opacity, tr: m.transparent }]));
  const approach = (cur, target, dt, k) => cur + (target - cur) * Math.min(1, dt * k);

  function update(dt) {
    time += dt;
    rampE = approach(rampE, rampOpen ? 1 : 0, dt, 2.2);
    podE = approach(podE, podsOut ? 1 : 0, dt, 2.0);
    cloakE = approach(cloakE, cloaked ? 1 : 0, dt, 2.5);
    klappePivot.rotation.x = -rampE * OFFEN;
    colRamp.userData.aktiv = rampE < 0.5;
    placePods(podE);
    driveGlow.emissiveIntensity = 0.2 + podE * (2.6 + Math.sin(time * 23) * 0.2);
    for (const m of shipMats) {
      const b = baseOpacity.get(m);
      if (cloakE > 0.01) {
        m.transparent = true;
        m.opacity = b.op * (1 - cloakE * 0.94) * (1 - cloakE * 0.06 * Math.sin(time * 9));
        m.depthWrite = cloakE < 0.5;
      } else if (m.transparent !== b.tr) {
        m.transparent = b.tr; m.opacity = b.op; m.depthWrite = true; m.needsUpdate = true;
      }
    }
    for (let i = drones.length - 1; i >= 0; i--) {
      const d = drones[i];
      d.t += dt;
      d.mesh.position.addScaledVector(d.v, dt);
      d.mat.opacity = Math.max(0, 1 - d.t / 1.6);
      if (d.t > 1.6) { root.remove(d.mesh); d.mat.dispose(); drones.splice(i, 1); }
    }
  }
  hullMesh.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (last !== null) update(Math.min(now - last, 0.1));
    last = now;
  };

  const api = {
    rampeOeffnen() { rampOpen = true; },
    rampeSchliessen() { rampOpen = false; },
    gondelnAusfahren() { podsOut = true; },
    gondelnEinfahren() { podsOut = false; },
    tarnungAn() { cloaked = true; },
    tarnungAus() { cloaked = false; },
    drohneAbfeuern() {
      for (const s of [-1, 1]) {
        const mat = droneMat.clone();
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat);
        mesh.scale.set(1, 1, 2.6);
        mesh.position.set(s * (W / 2 + 0.3), GEO.y0 + 0.55, ZM + 1.2);
        root.add(mesh);
        drones.push({ mesh, mat, t: 0, v: new THREE.Vector3(s * 2.5, 1.5, 22) });
      }
    },
    get rampeOffen() { return rampOpen; },
    get gondelnAusgefahren() { return podsOut; },
    get getarnt() { return cloaked; },
  };
  root.userData.api = api;
  root.userData.actions = [
    { id: 'rampe_auf', label: 'Heckrampe öffnen', run: () => api.rampeOeffnen() },
    { id: 'rampe_zu', label: 'Heckrampe schließen', run: () => api.rampeSchliessen() },
    { id: 'gondeln_aus', label: 'Antriebsgondeln ausfahren', run: () => api.gondelnAusfahren() },
    { id: 'gondeln_ein', label: 'Antriebsgondeln einfahren', run: () => api.gondelnEinfahren() },
    { id: 'tarnung_an', label: 'Tarnung aktivieren', run: () => api.tarnungAn() },
    { id: 'tarnung_aus', label: 'Tarnung deaktivieren', run: () => api.tarnungAus() },
    { id: 'drohnen', label: 'Drohnen abfeuern', run: () => api.drohneAbfeuern() },
  ];
  return root;
}

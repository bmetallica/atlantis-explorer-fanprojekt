// Kollision (Dienst 'kollision'): statische Welt als BVH (three-mesh-bvh), bewegliche COL_-Boxen als orientierte Boxen,
// Kapsel-Bewegung nach dem Verfahren des three-mesh-bvh-Beispiels „characterMovement“ (Kapsel aus Dreiecken herausschieben).
// Geschrieben von Claude (Kernbaustein); Schnittstelle: build/ANLEITUNG_SPIEL.md
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';

export function init(ctx) {
  const statisch = new Map();           // schluessel → { bvh, geometrie }
  const dynamisch = new Map();          // schluessel → Mesh[]
  const aus = new Set();                // ausgeschaltete Schlüssel (z. B. Stadthülle, solange man drinnen ist)
  // „stadt_aussen“ schaltet auch alle Unter-Schlüssel „stadt_aussen:…“ (Hüllenkacheln) mit
  const istAus = (k) => aus.has(k) || (k.includes(':') && aus.has(k.slice(0, k.indexOf(':'))));

  // ---------------------------------------------------------------- Verwaltung
  function hinzufuegen(schluessel, objekte) {
    entfernen(schluessel);
    const geos = [];
    for (const wurzel of objekte) wurzel.updateMatrixWorld(true);
    for (const wurzel of objekte) wurzel.traverse((o) => {
      if (!o.isMesh || o.userData?.aktiv === false || !o.geometry?.attributes?.position) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', o.geometry.attributes.position.clone());
      if (o.geometry.index) g.setIndex(o.geometry.index.clone());
      if (o.isInstancedMesh) {
        const m = new THREE.Matrix4();
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); const gi = g.clone(); gi.applyMatrix4(m.premultiply(o.matrixWorld)); geos.push(gi); }
      } else { g.applyMatrix4(o.matrixWorld); geos.push(g); }
    });
    if (!geos.length) return;
    const geometrie = mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)), false);
    geos.forEach((g) => g.dispose());
    statisch.set(schluessel, { bvh: new MeshBVH(geometrie), geometrie });
  }
  function entfernen(schluessel) {
    const s = statisch.get(schluessel);
    if (s) { s.geometrie.dispose(); statisch.delete(schluessel); }
    dynamisch.delete(schluessel);
  }
  function setDynamisch(schluessel, meshes) {
    for (const m of meshes) if (m.geometry && !m.geometry.boundingBox) m.geometry.computeBoundingBox();
    dynamisch.set(schluessel, meshes);
  }

  // ---------------------------------------------------------------- Kapsel
  const seg = new THREE.Line3(), box = new THREE.Box3();
  const triPunkt = new THREE.Vector3(), kapPunkt = new THREE.Vector3(), richtung = new THREE.Vector3();
  const start = new THREE.Vector3(), delta = new THREE.Vector3(), inv = new THREE.Matrix4();
  const lokal = new THREE.Vector3(), naechst = new THREE.Vector3(), welt = new THREE.Vector3();
  let boden = false;

  function aufloesen(radius) {
    // statische BVHs
    for (const [k, { bvh }] of statisch) {
      if (istAus(k)) continue;
      box.makeEmpty(); box.expandByPoint(seg.start); box.expandByPoint(seg.end);
      box.min.addScalar(-radius); box.max.addScalar(radius);
      bvh.shapecast({
        intersectsBounds: (b) => b.intersectsBox(box),
        intersectsTriangle: (tri) => {
          const d = tri.closestPointToSegment(seg, triPunkt, kapPunkt);
          if (d < radius) {
            const tiefe = radius - d;
            richtung.copy(kapPunkt).sub(triPunkt);
            if (richtung.lengthSq() < 1e-12) tri.getNormal(richtung); else richtung.normalize();
            if (richtung.y > 0.6) boden = true;
            seg.start.addScaledVector(richtung, tiefe);
            seg.end.addScaledVector(richtung, tiefe);
          }
        },
      });
    }
    // bewegliche Boxen (OBB): nächster Punkt der Box zur Kapselachse (Stichproben entlang der Achse)
    for (const meshes of dynamisch.values()) for (const m of meshes) {
      if (m.userData?.aktiv === false || !m.geometry?.boundingBox) continue;
      m.updateWorldMatrix(true, false);
      inv.copy(m.matrixWorld).invert();
      const bb = m.geometry.boundingBox;
      let best = Infinity;
      for (let i = 0; i <= 4; i++) {
        seg.at(i / 4, welt);
        lokal.copy(welt).applyMatrix4(inv);
        naechst.copy(lokal).clamp(bb.min, bb.max).applyMatrix4(m.matrixWorld);
        const d = naechst.distanceTo(welt);
        if (d < best) { best = d; kapPunkt.copy(welt); triPunkt.copy(naechst); }
      }
      if (best < radius) {
        richtung.copy(kapPunkt).sub(triPunkt);
        if (richtung.lengthSq() < 1e-12) richtung.set(0, 1, 0); else richtung.normalize();
        if (richtung.y > 0.6) boden = true;
        seg.start.addScaledVector(richtung, radius - best);
        seg.end.addScaledVector(richtung, radius - best);
      }
    }
  }

  function schritt(pos, vel, dt, radius, hoehe) {
    start.copy(pos);
    pos.addScaledVector(vel, dt);
    seg.start.set(pos.x, pos.y + radius, pos.z);
    seg.end.set(pos.x, pos.y + hoehe - radius, pos.z);
    boden = false;
    aufloesen(radius);
    aufloesen(radius);                                 // zweiter Durchgang für Ecken
    const neu = welt.set(seg.start.x, seg.start.y - radius, seg.start.z);
    delta.copy(neu).sub(pos);
    pos.copy(neu);
    // Geschwindigkeit entlang der Kontaktnormalen entfernen
    if (delta.lengthSq() > 1e-10) {
      richtung.copy(delta).normalize();
      const v = vel.dot(richtung);
      if (v < 0) vel.addScaledVector(richtung, -v);
    }
    return boden;
  }

  const probe = new THREE.Vector3(), probeVel = new THREE.Vector3(), ziel = new THREE.Vector3();  // Hilfsvektoren
  function kapsel(pos, vel, dt, { radius = 0.3, hoehe = 1.75 } = {}) {
    const weg = vel.length() * dt;
    const n = Math.min(6, Math.max(1, Math.ceil(weg / 0.2)));
    const teil = dt / n;
    let amBoden = false;
    for (let i = 0; i < n; i++) {
      const vorher = probe.copy(pos);
      ziel.copy(pos).addScaledVector(vel, teil);
      const hv = Math.hypot(vel.x, vel.z) * teil;
      const vy = vel.y;
      const b = schritt(pos, vel, teil, radius, hoehe);
      amBoden = amBoden || b;
      // Stufen bis 0,35 m: seitlich geblockt → angehoben um mindestens den Radius vorrücken und absetzen
      const geschafft = Math.hypot(pos.x - vorher.x, pos.z - vorher.z);
      if (hv > 0.005 && geschafft < hv * 0.5 && (b || vy <= 0)) {
        const dx = ziel.x - vorher.x, dz = ziel.z - vorher.z, dl = Math.hypot(dx, dz);
        const vor = Math.max(hv, radius * 1.3);              // Kugelmitte muss sicher über der Stufenkante liegen
        const p2 = new THREE.Vector3(vorher.x, vorher.y + 0.36, vorher.z);
        const v2 = probeVel.set(dx / dl * vor / teil, 0, dz / dl * vor / teil);
        schritt(p2, v2, teil, radius, hoehe);
        const v3 = probeVel.set(0, -0.4 / teil, 0);
        const aufStufe = schritt(p2, v3, teil, radius, hoehe);
        const hub = p2.y - vorher.y;
        if (aufStufe && hub > 0.05 && hub < 0.37 && Math.hypot(p2.x - vorher.x, p2.z - vorher.z) > vor * 0.5) {
          pos.copy(p2); amBoden = true;
        }
      }
    }
    if (amBoden && vel.y < 0) vel.y = 0;
    return { amBoden };
  }

  // ---------------------------------------------------------------- Strahl
  const ray = new THREE.Ray(), lray = new THREE.Ray(), treffer = new THREE.Vector3();
  function strahl(origin, dir, maxDist = 100) {
    ray.origin.copy(origin); ray.direction.copy(dir).normalize();
    let best = null;
    for (const [k, { bvh }] of statisch) {
      if (istAus(k)) continue;
      const h = bvh.raycastFirst(ray, THREE.DoubleSide, 0, maxDist);
      if (h && h.distance <= maxDist && (!best || h.distance < best.abstand)) {
        const normal = h.face ? h.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        best = { punkt: h.point.clone(), abstand: h.distance, normal };
      }
    }
    for (const meshes of dynamisch.values()) for (const m of meshes) {
      if (m.userData?.aktiv === false || !m.geometry?.boundingBox) continue;
      inv.copy(m.matrixWorld).invert();
      lray.copy(ray).applyMatrix4(inv);
      if (lray.intersectBox(m.geometry.boundingBox, treffer)) {
        treffer.applyMatrix4(m.matrixWorld);
        const d = treffer.distanceTo(ray.origin);
        if (d <= maxDist && (!best || d < best.abstand)) best = { punkt: treffer.clone(), abstand: d, normal: new THREE.Vector3(0, 1, 0) };
      }
    }
    return best;
  }

  const aktiv = (schluessel, an) => { if (an) aus.delete(schluessel); else aus.add(schluessel); };
  const api = { hinzufuegen, entfernen, dynamisch: setDynamisch, kapsel, strahl, aktiv, anzahl: () => statisch.size };
  ctx.services.register('kollision', api);

  // ---------------------------------------------------------------- Selbsttest
  async function selbsttest() {
    const mk = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d)); m.position.set(x, y, z); m.updateMatrixWorld(true); return m; };
    hinzufuegen('selbsttest', [mk(20, 0.5, 20, 0, -0.25, 0), mk(0.4, 3, 6, 2, 1.5, 0), mk(2, 0.3, 2, -3, 0.15, 0)]);
    const sim = (p, v, s, gravity = true) => { let r; for (let i = 0; i < s * 60; i++) { if (gravity) v.y -= 9.81 / 60; r = kapsel(p, v, 1 / 60); } return r; };
    const ergebnisse = [];
    // 1 Fall
    let p = new THREE.Vector3(0, 3, 0), v = new THREE.Vector3();
    let r = sim(p, v, 3);
    ergebnisse.push(['Fall', Math.abs(p.y) < 0.05 && r.amBoden, `y=${p.y.toFixed(3)} amBoden=${r.amBoden}`]);
    // 2 Wand
    p = new THREE.Vector3(0, 0, 0); v = new THREE.Vector3();
    for (let i = 0; i < 180; i++) { v.x = 3; v.y -= 9.81 / 60; kapsel(p, v, 1 / 60); }
    ergebnisse.push(['Wand', p.x < 2 - 0.2 - 0.3 + 0.02, `x=${p.x.toFixed(3)}`]);
    // 3 Stufe
    p = new THREE.Vector3(-0.5, 0, 0); v = new THREE.Vector3();
    for (let i = 0; i < 60; i++) { v.x = -2; v.y -= 9.81 / 60; kapsel(p, v, 1 / 60); }   // 1 s: endet auf der 2 m langen Stufe
    ergebnisse.push(['Stufe', Math.abs(p.y - 0.3) < 0.06, `y=${p.y.toFixed(3)} x=${p.x.toFixed(2)}`]);
    // 4 Strahl
    const h = strahl(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0), 20);
    ergebnisse.push(['Strahl', h && Math.abs(h.punkt.y) < 0.02, h ? `y=${h.punkt.y.toFixed(3)}` : 'kein Treffer']);
    // 5 dynamische Box
    const tuer = mk(0.3, 3, 3, 5, 1.5, 0);
    setDynamisch('selbsttest_dyn', [tuer]);
    tuer.userData.aktiv = false;
    p = new THREE.Vector3(3.5, 0, 0); v = new THREE.Vector3();
    for (let i = 0; i < 90; i++) { v.x = 2; v.y -= 9.81 / 60; kapsel(p, v, 1 / 60); }
    const durch = p.x > 5.3;
    tuer.userData.aktiv = true;
    p = new THREE.Vector3(3.5, 0, 0); v = new THREE.Vector3();
    for (let i = 0; i < 90; i++) { v.x = 2; v.y -= 9.81 / 60; kapsel(p, v, 1 / 60); }
    ergebnisse.push(['Tür', durch && p.x < 5 - 0.15 - 0.3 + 0.02, `offen durch=${durch}, zu x=${p.x.toFixed(3)}`]);
    entfernen('selbsttest'); entfernen('selbsttest_dyn');
    return { ok: ergebnisse.every((e) => e[1]), details: ergebnisse.map((e) => `${e[0]}: ${e[1] ? 'ok' : 'FEHLER'} (${e[2]})`).join(' | ') };
  }
  return { selbsttest };
}

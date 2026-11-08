// Lichtpool: feste Zahl echter Punktlichter (Hoch 8, Niedrig 3), jedes Bild auf die Lampen (LAMP_) verteilt, die der
// Kamera am nächsten sind. Die Zahl der Lichter bleibt immer gleich → keine Shader-Neukompilierung beim Raumwechsel.
// Dienst 'licht': registrieren(schluessel, lampen[]), entfernen(schluessel)
import * as THREE from 'three';

export function init(ctx) {
  const { scene, camera, settings } = ctx;
  const N = settings.get('stufe') === 'hoch' ? 8 : 3;
  const pool = [];
  for (let i = 0; i < N; i++) {
    const l = new THREE.PointLight(0xffffff, 0, 10, 2);
    l.name = 'lichtpool_' + i;
    scene.add(l); pool.push(l);
  }
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1410, 0.55));
  const gruppen = new Map();
  const staerke = () => settings.get('glow') / 6;
  ctx.services.register('licht', {
    registrieren(schluessel, lampen) { gruppen.set(schluessel, lampen); },
    entfernen(schluessel) { gruppen.delete(schluessel); },
    anzahl: N,
  });
  const tmp = new THREE.Vector3();
  // Feste Plätze + weiches Ein-/Ausblenden: kein hartes Umspringen von Lampen an der Rangfolgegrenze (Flackern) – Claude
  const plaetze = pool.map(() => ({ lampe: null, w: 0 }));
  const BLENDE = 3.5;            // 1/s: ~0,3 s Überblendung
  const HALTEN = 0.8;            // aktive Lampe zählt 20 % näher (Hysterese)
  let takt = 0, gewuenscht = new Set();
  return {
    update(dt = 1 / 60) {
      const cam = camera.getWorldPosition(tmp);
      if (takt++ % 4 === 0) {
        const aktiv = new Set(plaetze.map((p) => p.lampe).filter(Boolean));
        const alle = [];
        for (const lampen of gruppen.values()) for (const l of lampen) if ((l.intensity ?? 15) > 0) alle.push(l);   // ausgeschaltete Lampen belegen keinen Platz
        const d = (l) => l.pos.distanceToSquared(cam) * (aktiv.has(l) ? HALTEN * HALTEN : 1);
        alle.sort((a, b) => d(a) - d(b));
        gewuenscht = new Set(alle.slice(0, N));
      }
      // nicht mehr gewünschte ausblenden; gewünschte ohne Platz in freie Plätze setzen
      for (const p of plaetze) {
        if (p.lampe && !gewuenscht.has(p.lampe)) p.w = Math.max(0, p.w - BLENDE * dt);
        if (p.lampe && p.w === 0 && !gewuenscht.has(p.lampe)) p.lampe = null;
      }
      const belegt = new Set(plaetze.map((p) => p.lampe));
      for (const q of gewuenscht) {
        if (belegt.has(q)) continue;
        const frei = plaetze.find((p) => !p.lampe);
        if (!frei) break;
        frei.lampe = q; frei.w = 0; belegt.add(q);
      }
      for (let i = 0; i < N; i++) {
        const l = pool[i], p = plaetze[i], q = p.lampe;
        if (!q) { l.intensity = 0; continue; }
        if (gewuenscht.has(q)) p.w = Math.min(1, p.w + BLENDE * dt);
        l.position.copy(q.pos);
        l.color.set(q.color || '#ffb060');
        l.distance = q.distance ?? 10;
        l.intensity = (q.intensity ?? 15) * 0.4 * staerke() * p.w;
      }
    },
  };
}

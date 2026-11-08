// Innen/Außen: steht der Spieler in einem Raum oder Korridor (laut Stadtplan), wird die Stadthülle aus der 3D-Druck-Vorlage
// ausgeblendet und ihre Kollision abgeschaltet – sie schneidet sonst in Räume hinein (unsichtbare Wände, „graue Klötze“).
// Außerdem werden Himmelsreflexion und Sonne drinnen weich heruntergeblendet. Offene Räume (Balkon, Plaza) zählen als draußen.
import * as THREE from 'three';

const OFFEN = new Set(['ATL-042', 'ATL-048']);

export function init(ctx) {
  const { scene, plan } = ctx;
  // Grundrisse (gedrehte Rechtecke) mit Höhenbereich vorbereiten
  const flaechen = [];
  for (const r of plan.raeume) if (!OFFEN.has(r.id)) flaechen.push({ id: r.id, pts: r.grundriss, y0: r.hoehe[0] - 0.5, y1: r.hoehe[1] + 0.5 });
  for (const k of plan.korridore) if (k.grundriss) flaechen.push({ id: k.id, pts: k.grundriss, y0: k.pos[1] - 0.5, y1: k.pos[1] + 5 });
  for (const t of plan.transporter) {                 // 3 m um jeden Transporter
    const [x, y, z] = t.pos;
    flaechen.push({ id: t.id, pts: [[x - 3, z - 3], [x + 3, z - 3], [x + 3, z + 3], [x - 3, z + 3]], y0: y - 0.5, y1: y + 4 });
  }
  const imPoly = (pts, x, z) => {
    let innen = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, zi] = pts[i], [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) innen = !innen;
    }
    return innen;
  };
  const imPlan = (p) => flaechen.some((f) => p.y >= f.y0 && p.y <= f.y1 && imPoly(f.pts, p.x, p.z));
  // zusätzlich: im echten Quader eines geladenen Raums (lokal, mitgedreht) – Raummodelle ragen teils über ihren Plan-Grundriss
  const raumQuader = new WeakMap();         // gruppe → { box (lokal), inv }
  const lokal = new THREE.Vector3(), mInv = new THREE.Matrix4(), mRel = new THREE.Matrix4(), gb = new THREE.Box3();
  function quaderVon(g) {
    let q = raumQuader.get(g);
    if (q) return q;
    g.updateMatrixWorld(true);
    mInv.copy(g.matrixWorld).invert();
    const box = new THREE.Box3();
    g.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position || o.isBatchedMesh) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      mRel.multiplyMatrices(mInv, o.matrixWorld);
      box.union(gb.copy(o.geometry.boundingBox).applyMatrix4(mRel));
    });
    q = { box: box.expandByScalar(-0.15), inv: mInv.clone() };
    raumQuader.set(g, q);
    return q;
  }
  const imRaum = (p) => {
    const welt = ctx.services.get('welt');
    for (const h of welt?.geladen?.() || []) {
      if (!h?.gruppe || OFFEN.has(h.id)) continue;
      const q = quaderVon(h.gruppe);
      if (q.box.isEmpty()) continue;
      lokal.copy(p).applyMatrix4(q.inv);
      if (q.box.containsPoint(lokal)) return true;
    }
    for (const g of welt?.durchgaenge?.() || []) {            // Verbindungsstücke zwischen Gang und Raum
      const q = quaderVon(g);
      lokal.copy(p).applyMatrix4(q.inv);
      if (q.box.containsPoint(lokal)) return true;
    }
    return false;
  };
  const drinnen = (p) => imPlan(p) || imRaum(p);

  let letzte = null, bestaetigt = 0, hintergrund = null, altHintergrund = null;
  let innen = 0, ziel = 0, takt = 0, sonne = null, sonneBasis = 1, envBasis = null, zustand = null;
  ctx.services.register('innenaussen', { get drinnen() { return zustand === true; }, quader: quaderVon, OFFEN });
  return {
    update(dt) {
      takt -= dt;
      if (takt <= 0) {
        takt = 0.2;
        const roh = drinnen(ctx.state.spieler.pos);
        bestaetigt = roh === letzte ? bestaetigt + 1 : 0; letzte = roh;
        const d = bestaetigt >= 1 || zustand === null ? roh : zustand;   // zwei gleiche Messungen nötig (kein Hin- und Herspringen)
        ziel = d ? 1 : 0;
        if (d !== zustand) {
          zustand = d;
          ctx.services.get('kollision')?.aktiv?.('stadt_aussen', !d);
        }
        // Sichtbarkeit der Hülle bei jeder Messung durchsetzen (sie wird asynchron geladen und von „aussen.sichtbar“ umgeschaltet)
        const huelle = scene.getObjectByName('aussen_stadthuelle');
        const soll = !d && ctx.services.get('aussen')?.istSichtbar !== false;
        if (huelle && huelle.visible !== soll) huelle.visible = soll;
        // Drinnen auch Himmel (teurer Streu-Shader über den ganzen Bildschirm) und Meer ausblenden; Fenster zeigen dann
        // eine ruhige Himmelsfarbe (scene.background) – spart auf schwacher Grafik viel Rechenzeit. – Claude
        const himmel = scene.getObjectByName('aussen_himmel');
        if (himmel && himmel.visible !== soll) himmel.visible = soll;
        if (!hintergrund) hintergrund = new THREE.Color(0x9fb8cf);
        if (!soll && scene.background !== hintergrund) { altHintergrund = scene.background; scene.background = hintergrund; }
        if (soll && scene.background === hintergrund) scene.background = altHintergrund;
        // Räume unter dem Meeresspiegel (Krankenstation, ZPM-Raum …): Meeresfläche drinnen ausblenden, sonst schneidet sie durch den Raum
        const meer = scene.getObjectByName('aussen_meer');
        if (meer) meer.visible = !zustand && ctx.services.get('aussen')?.istSichtbar !== false;
        if (!sonne) scene.traverse((o) => { if (!sonne && o.isDirectionalLight) { sonne = o; sonneBasis = o.intensity; } });
        if (envBasis === null && scene.environment) envBasis = scene.environmentIntensity;
      }
      innen += (ziel - innen) * Math.min(1, dt * 3);
      ctx.setAussenFaktor?.(ctx.state.ort === 'atlantis' ? THREE.MathUtils.lerp(0.75, 1, innen) : 1);   // Planet unverändert
      if (envBasis !== null) scene.environmentIntensity = THREE.MathUtils.lerp(envBasis, 0.08, innen);
      if (sonne) sonne.intensity = THREE.MathUtils.lerp(sonneBasis, 0.05, innen);
    },
  };
}

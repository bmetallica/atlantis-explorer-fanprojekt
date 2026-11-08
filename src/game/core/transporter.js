// Transporterkabinen: stellt an jedem Transporterpunkt des Stadtplans (plan.transporter) in Spielernähe eine Kabine (OBJ-043)
// mit Kollision auf und entfernt sie in der Ferne. Dienst 'transporter': kabinen() → Object3D[] (alle Kabinen in der Szene,
// auch die fest in Räumen eingebauten), damit das Benutzen-Modul überall das Zielmenü öffnen kann.
import * as THREE from 'three';

export function init(ctx) {
  const aufgestellt = new Map();           // Transporter-ID → Kabine
  let takt = 0, laedt = false;
  const kabinen = () => {
    const liste = [...aufgestellt.values()];
    ctx.scene.traverse((o) => { if (o.userData?.objId === 'OBJ-043' && !liste.includes(o)) liste.push(o); });
    return liste;
  };
  // Sicherer Sprung: Steuerung angehalten, bis unter dem Ankunftspunkt nachweislich Boden (Kollision) geladen ist
  let springt = false;
  async function springen(id) {
    if (springt) return false;
    springt = true;
    const welt = ctx.services.get('welt'), spieler = ctx.services.get('spieler'), kollision = ctx.services.get('kollision'), ui = ctx.services.get('ui');
    try {
      if (spieler) spieler.aktiv = false;
      ui?.meldung?.('Transport …', 1.5);
      const z = await welt.teleport(id);
      const unten = new THREE.Vector3(0, -1, 0), start = new THREE.Vector3();
      let treffer = null;
      for (let i = 0; i < 150 && !treffer; i++) {
        spieler?.setPosition(z.pos, z.yaw);
        start.copy(z.pos); start.y += 1.5;
        treffer = kollision?.strahl(start, unten, 4);
        if (!treffer) await new Promise((r) => setTimeout(r, 100));
      }
      if (!treffer) { ui?.meldung?.('Ziel nicht erreichbar – Boden fehlt', 3); spieler?.respawn?.(); return false; }
      spieler?.setPosition(new THREE.Vector3(z.pos.x, treffer.punkt.y + 0.02, z.pos.z), z.yaw);
      return true;
    } finally {
      if (spieler) spieler.aktiv = true;
      springt = false;
    }
  }
  ctx.services.register('transporter', { kabinen, springen, get springt() { return springt; } });
  return {
    async update(dt) {
      takt -= dt;
      if (takt > 0 || laedt) return;
      takt = 1;
      const assets = ctx.services.get('assets'), kollision = ctx.services.get('kollision');
      if (!assets) return;
      const p = ctx.state.spieler.pos;
      laedt = true;
      try {
        for (const t of ctx.plan.transporter) {
          const d = Math.hypot(t.pos[0] - p.x, t.pos[1] - p.y, t.pos[2] - p.z);
          if (t.kabine === false) continue;          // Kabine ist im Raum schon eingebaut
          if (d < 80 && !aufgestellt.has(t.id)) {
            const k = await assets.objekt('OBJ-043');
            k.position.fromArray(t.pos); k.rotation.y = t.rotY + Math.PI;   // Tür zeigt in den Korridor
            k.userData.transporterId = t.id;
            ctx.scene.add(k); k.updateMatrixWorld(true);
            aufgestellt.set(t.id, k);
            const info = assets.auswerten(k);
            kollision?.hinzufuegen('transporter_' + t.id, info.kollision.filter((m) => m.userData.aktiv === undefined));
            kollision?.dynamisch('transporter_dyn_' + t.id, info.kollision.filter((m) => m.userData.aktiv !== undefined));
          } else if (d > 120 && aufgestellt.has(t.id)) {
            aufgestellt.get(t.id).removeFromParent();
            aufgestellt.delete(t.id);
            kollision?.entfernen('transporter_' + t.id); kollision?.entfernen('transporter_dyn_' + t.id);
          }
        }
      } catch (e) { console.error('Transporter', e); }
      laedt = false;
    },
  };
}

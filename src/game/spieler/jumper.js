// Jumper-Flug (Dienst 'jumper'): Einsteigen über die Funktion „Jumper fliegen“ an jedem Puddle Jumper (OBJ-009),
// Arcade-Flug mit Kollision, automatische Luken der Jumper-Bucht (ATL-040), Flugbereich um die Stadt, Aussteigen am Boden.
// Geschrieben von Claude; Schnittstelle: build/ANLEITUNG_SPIEL.md
import * as THREE from 'three';

const MAX = 45, BOOST = 110;            // m/s
const HUB = 14;                         // m/s steigen/sinken
const DREH = 1.4;                       // rad/s mit A/D

export function init(ctx) {
  const { services, state, input, camera, scene, settings } = ctx;
  let jumper = null, original = null, aktiv = false, cockpit = false, gondelnAus = false;
  const vel = new THREE.Vector3(), pos = new THREE.Vector3();
  let yaw = 0, pitch = 0, bodenTakt = 0, amBoden = true, lukenTakt = 0;
  const fwd = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), unten = new THREE.Vector3(0, -1, 0);
  const lukenZustand = { boden: false, dach: false };
  let testSteigen = false;               // nur Selbsttest: Steigflug wie gehaltene Leertaste

  // ---------------------------------------------------------------- „Jumper fliegen“ an alle geparkten Jumper hängen
  function aktionenAnhaengen() {
    for (const h of services.get('welt')?.geladen?.() || []) for (const o of h.funktionen || []) {
      if (o.userData?.objId !== 'OBJ-009' || o.userData._flug) continue;
      o.userData._flug = true;
      o.userData.actions.unshift({ id: 'fliegen', label: 'Jumper fliegen', run: () => einsteigen(o) });
    }
  }

  async function einsteigen(parkend) {
    if (aktiv) return;
    const assets = services.get('assets'), spieler = services.get('spieler');
    parkend.updateMatrixWorld(true);
    const frei = abgestellt.indexOf(parkend);
    if (frei >= 0) {
      // selbst abgestellter Jumper: direkt wieder übernehmen
      abgestellt.splice(frei, 1);
      services.get('kollision')?.entfernen('jumper_' + parkend.uuid);
      jumper = parkend; original = null;
      yaw = new THREE.Euler().setFromQuaternion(jumper.quaternion, 'YXZ').y + Math.PI; pitch = 0;
      pos.copy(jumper.position); vel.set(0, 0, 0);
      if (spieler) spieler.aktiv = false;
      state.modus = 'jumper'; aktiv = true; amBoden = true;
      jumper.userData.api?.rampeSchliessen?.();
      services.get('ui')?.meldung?.('Jumper: W/S Schub · A/D drehen · Maus neigen · Leertaste/Strg Höhe · Umschalt Boost · V Ansicht · F Drohne · E aussteigen (am Boden)', 7);
      return;
    }
    jumper = await assets.objekt('OBJ-009');
    parkend.matrixWorld.decompose(jumper.position, jumper.quaternion, jumper.scale);
    scene.add(jumper);
    original = parkend; parkend.visible = false;          // gebündelte Teile folgen der Sichtbarkeit
    // Kollisionsboxen des geparkten Jumpers aus der Raumkollision nehmen – der Flug-Jumper startet genau darin
    const kollision = services.get('kollision');
    for (const h of services.get('welt')?.geladen?.() || []) {
      if (!h.kollision?.length || !h.funktionen?.includes(parkend)) continue;
      const fremd = (m) => { for (let p = m; p; p = p.parent) if (p === parkend) return false; return true; };
      const beweglich = (m) => m.userData?.aktiv !== undefined || /tuer|door|klappe|luke|rampe/i.test(m.name);
      const rest = h.kollision.filter(fremd);
      kollision?.hinzufuegen(h.id, rest.filter((m) => !beweglich(m)));
      kollision?.dynamisch(h.id, rest.filter(beweglich));
    }
    yaw = new THREE.Euler().setFromQuaternion(jumper.quaternion, 'YXZ').y + Math.PI; pitch = 0;   // Kamera blickt entlang der Nase (+Z)
    pos.copy(jumper.position); vel.set(0, 0, 0);
    if (spieler) spieler.aktiv = false;
    state.modus = 'jumper'; aktiv = true; amBoden = true;
    jumper.userData.api?.rampeSchliessen?.();
    services.get('ui')?.meldung?.('Jumper: W/S Schub · A/D drehen · Maus neigen · Leertaste/Strg Höhe · Umschalt Boost · V Ansicht · F Drohne · E aussteigen (am Boden)', 7);
  }

  function aussteigen() {
    if (!aktiv || !amBoden || vel.length() > 1.5) { services.get('ui')?.meldung?.('Zum Aussteigen erst landen', 2); return; }
    const spieler = services.get('spieler');
    jumper.userData.api?.gondelnEinfahren?.(); gondelnAus = false;
    jumper.userData.api?.rampeOeffnen?.();
    // hinter der Heckrampe absetzen, Blick zum Jumper
    tmp.set(0, 0, -6.5).applyQuaternion(jumper.quaternion).add(jumper.position);
    spieler?.setPosition(tmp, yaw);
    if (spieler) spieler.aktiv = true;
    state.modus = 'fuss'; aktiv = false;
    // der geflogene Jumper bleibt stehen und ist wieder benutzbar (eigene Kollision, Benutzen-Punkte über welt.benutzbare)
    const j = jumper;
    if (!j.userData._flug) { j.userData._flug = true; j.userData.actions.unshift({ id: 'fliegen', label: 'Jumper fliegen', run: () => einsteigen(j) }); }
    j.updateMatrixWorld(true);
    const cols = [];
    j.traverse((o) => { if (/^COL_/.test(o.name)) cols.push(o); });
    const kollision = services.get('kollision');
    kollision?.hinzufuegen('jumper_' + j.uuid, cols.filter((m) => !/rampe|klappe/i.test(m.name)));
    kollision?.dynamisch('jumper_' + j.uuid, cols.filter((m) => /rampe|klappe/i.test(m.name)));
    abgestellt.push(j);
    if (original && original !== jumper) original = null;
  }

  // Benutzen-Punkte der abgestellten Jumper (gehören zu keinem Raum; welt.benutzbare() fragt hier nach)
  const abgestellt = [];
  function benutzbare() {
    const liste = [];
    for (const j of abgestellt) {
      j.traverse((o) => {
        if (!/^INT_/.test(o.name)) return;
        liste.push({ pos: o.getWorldPosition(new THREE.Vector3()), label: o.userData?.label || 'Puddle Jumper', actions: j.userData.actions, obj: j });
      });
    }
    return liste;
  }
  ctx.on('taste', ({ code, unten: gedrueckt }) => {
    if (!gedrueckt || state.pause || !aktiv) return;
    if (code === 'KeyE') aussteigen();
    if (code === 'KeyV') cockpit = !cockpit;
    if (code === 'KeyF') drohneAbfeuern();
  });

  // ---------------------------------------------------------------- Drohnen (F im Flug): leuchtende Geschosse in Weltkoordinaten
  const DROHNE_V = 70, DROHNE_ZEIT = 4, DROHNE_PAUSE = 0.45;
  const drohnenGeo = new THREE.SphereGeometry(0.16, 10, 6);
  const drohnenMat = new THREE.MeshBasicMaterial({ color: 0xffc860 });
  const drohnen = [];                      // { mesh, v, t, aus }
  let drohnenSperre = 0, drohnenSeite = 1;
  const dTmp = new THREE.Vector3(), dDir = new THREE.Vector3(), dSeite = new THREE.Vector3();
  function drohneAbfeuern() {
    if (!aktiv || drohnenSperre > 0) return;
    drohnenSperre = DROHNE_PAUSE;
    let d = drohnen.find((x) => x.aus);
    if (!d) {
      if (drohnen.length >= 12) return;
      d = { mesh: new THREE.Mesh(drohnenGeo, drohnenMat), v: new THREE.Vector3(), t: 0, aus: true };
      d.mesh.scale.set(1, 1, 3);
      drohnen.push(d);
    }
    // abwechselnd links/rechts unter dem Cockpit starten, Richtung = Blick
    dSeite.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(1.9 * drohnenSeite);
    drohnenSeite = -drohnenSeite;
    d.mesh.position.copy(pos).add(dSeite).addScaledVector(fwd, 3.5).y += 1.0;
    d.v.copy(fwd).multiplyScalar(DROHNE_V).add(vel);
    d.mesh.lookAt(dTmp.copy(d.mesh.position).add(d.v));
    d.t = 0; d.aus = false;
    scene.add(d.mesh);
  }
  function drohnenBewegen(dt) {
    drohnenSperre -= dt;
    const kollision = services.get('kollision');
    for (const d of drohnen) {
      if (d.aus) continue;
      d.t += dt;
      const weg = d.v.length() * dt;
      dDir.copy(d.v).normalize();
      const treffer = weg > 0 ? kollision?.strahl(d.mesh.position, dDir, weg) : null;
      if (treffer || d.t > DROHNE_ZEIT) {
        // kurzer Lichtblitz am Einschlag
        if (treffer) { d.mesh.position.copy(treffer.punkt); d.mesh.scale.setScalar(9); d.t = DROHNE_ZEIT - 0.12; d.v.set(0, 0, 0); continue; }
        d.aus = true; d.mesh.scale.set(1, 1, 3); scene.remove(d.mesh); continue;
      }
      d.mesh.position.addScaledVector(d.v, dt);
    }
  }

  // ---------------------------------------------------------------- Luken der Jumper-Bucht automatisch
  function luken() {
    const h = services.get('welt')?.geladen?.().find((x) => x.id === 'ATL-040');
    const eintrag = ctx.plan.raeume.find((r) => r.id === 'ATL-040');
    if (!h || !eintrag) return;
    const api = h.gruppe.children[0]?.userData?.api;
    if (!api) return;
    const p = aktiv ? pos : state.spieler.pos;
    const mx = eintrag.pos[0], my = eintrag.pos[1], mz = eintrag.pos[2];
    const radial = Math.hypot(p.x - mx, p.z - mz);
    const nahBoden = aktiv && radial < 9 && p.y > my - 25 && p.y < my + 6;        // Durchflug Richtung Torhalle
    const nahDach = aktiv && radial < 9 && p.y > my + 0.5 && p.y < my + 30;        // Start/Landung durchs Dach
    if (nahBoden !== lukenZustand.boden) { lukenZustand.boden = nahBoden; nahBoden ? api.bodenluke_oeffnen?.() : api.bodenluke_schliessen?.(); }
    if (nahDach !== lukenZustand.dach) { lukenZustand.dach = nahDach; nahDach ? api.dachluke_oeffnen?.() : api.dachluke_schliessen?.(); }
  }

  // ---------------------------------------------------------------- Flug
  function fliegen(dt) {
    drohnenBewegen(dt);
    const kollision = services.get('kollision'), aussen = services.get('aussen');
    const { dx, dy } = input.nimmMaus();
    const k = 0.0006 + 0.00035 * settings.get('maus');
    yaw -= dx * k; pitch = THREE.MathUtils.clamp(pitch - dy * k, -0.9, 0.9);
    if (input.taste('KeyA')) yaw += DREH * dt;
    if (input.taste('KeyD')) yaw -= DREH * dt;
    const boost = input.taste('ShiftLeft') || input.taste('ShiftRight');
    const schub = (input.taste('KeyW') ? 1 : 0) - (input.taste('KeyS') ? 0.6 : 0);
    fwd.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    // Jumper-Vorderseite ist +Z → Blickrichtung der Kamera −Z gedreht um π
    const vmax = boost ? BOOST : MAX;
    tmp.copy(fwd).multiplyScalar(schub * vmax);            // Vorwärts = Blickrichtung = Jumper-Nase
    tmp.y += ((input.taste('Space') || testSteigen ? 1 : 0) - (input.taste('ControlLeft') || input.taste('KeyC') ? 1 : 0)) * HUB;
    vel.lerp(tmp, Math.min(1, dt * (schub || tmp.y ? 1.6 : 2.5)));   // weiches Beschleunigen, Schweben bei Loslassen
    // Flugbereich: 950 m um die Stadtmitte, 400 m Höhe; Wasser fängt ab
    const R = ctx.plan.spielmarken?.flug_grenze_radius || 950, HMAX = ctx.plan.spielmarken?.flug_grenze_hoehe || 400;
    const r = Math.hypot(pos.x, pos.z);
    if (r > R) { vel.x -= pos.x / r * (r - R) * 2 * dt; vel.z -= pos.z / r * (r - R) * 2 * dt; if (r > R + 5) services.get('ui')?.meldung?.('Flugbereich: zurück zur Stadt', 1); }
    if (pos.y > HMAX) vel.y = Math.min(vel.y, -(pos.y - HMAX));
    const wasser = ctx.plan.wasser_y ?? 0;
    if (pos.y < wasser + 2.5 && state.ort === 'atlantis') { vel.y = Math.max(vel.y, (wasser + 2.5 - pos.y) * 3); }
    // Kollision als große Kapsel (Jumper ≈ 3,2 m breit, 2,6 m hoch); Fußpunkt = Unterseite
    if (kollision) {
      const r1 = kollision.kapsel(pos, vel, dt, { radius: 1.5, hoehe: 2.9 });
      amBoden = r1.amBoden && vel.lengthSq() < 4;
    } else pos.addScaledVector(vel, dt);
    bodenTakt -= dt;
    if (bodenTakt <= 0) {
      bodenTakt = 0.25;
      const h = kollision?.strahl(tmp2.copy(pos).setY(pos.y + 0.5), unten, 1.4);
      amBoden = !!h && vel.lengthSq() < 4;
      const fliegt = !amBoden;
      if (fliegt !== gondelnAus) { gondelnAus = fliegt; fliegt ? jumper.userData.api?.gondelnAusfahren?.() : jumper.userData.api?.gondelnEinfahren?.(); }
    }
    // Jumper ausrichten (Nase = −Blickrichtung … Vorderseite +Z zeigt in Flugrichtung)
    jumper.position.copy(pos);
    jumper.rotation.set(0, yaw + Math.PI, 0, 'YXZ');
    jumper.rotateX(-pitch * 0.6);
    state.spieler.pos.copy(pos);
    // Kamera: Verfolger (hinten oben) oder Cockpit
    if (cockpit) {
      tmp.set(0, 1.9, 2.4).applyQuaternion(jumper.quaternion).add(pos);
      camera.position.copy(tmp);
    } else {
      tmp.set(0, 4, -12).applyQuaternion(jumper.quaternion).add(pos);
      camera.position.lerp(tmp, Math.min(1, dt * 6));
    }
    camera.rotation.set(pitch * 0.6, yaw, 0, 'YXZ');
  }

  ctx.services.register('jumper', { get aktiv() { return aktiv; }, einsteigen, aussteigen, benutzbare });

  async function selbsttest() {
    const welt = services.get('welt');
    for (let i = 0; i < 100; i++) { aktionenAnhaengen(); if (welt.geladen().some((h) => h.id === 'ATL-040')) break; await new Promise((r) => setTimeout(r, 200)); }
    const bucht = welt.geladen().find((h) => h.id === 'ATL-040');
    if (!bucht) return { ok: false, details: 'Jumper-Bucht nicht geladen' };
    aktionenAnhaengen();
    const j = bucht.funktionen.find((o) => o.userData?.objId === 'OBJ-009');
    if (!j) return { ok: false, details: 'kein Jumper in der Bucht' };
    const a = j.userData.actions.find((x) => x.id === 'fliegen');
    if (!a) return { ok: false, details: 'Aktion „Jumper fliegen“ fehlt' };
    await einsteigen(j);
    const y0 = pos.y;
    const e = ctx.plan.raeume.find((r) => r.id === 'ATL-040');
    // zur Buchtmitte schweben und steigen → Dachluke muss aufgehen, Jumper über das Dach kommen
    pos.set(e.pos[0], e.pos[1] + 1.5, e.pos[2]); vel.set(0, 0, 0);
    const t0 = performance.now();
    let geoeffnet = false;
    testSteigen = true;
    while (performance.now() - t0 < 90000 && pos.y < e.pos[1] + 14) {
      await new Promise((r) => requestAnimationFrame(r));
      geoeffnet = geoeffnet || lukenZustand.dach;
    }
    testSteigen = false;
    const raus = pos.y >= e.pos[1] + 14;
    return { ok: !!a && aktiv && geoeffnet && raus, details: `eingestiegen (y ${y0.toFixed(1)}), Dachluke ${geoeffnet ? 'geöffnet' : 'zu'}, ${raus ? 'durchs Dach geflogen' : `steckt bei y ${pos.y.toFixed(1)}`}` };
  }

  return {
    selbsttest,
    update(dt) {
      lukenTakt -= dt;
      if (lukenTakt <= 0) { lukenTakt = 0.2; aktionenAnhaengen(); luken(); }
      if (aktiv && jumper) fliegen(dt);
    },
  };
}

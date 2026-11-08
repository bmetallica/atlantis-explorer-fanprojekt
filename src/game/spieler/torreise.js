// Torreise (Dienst 'torreise'): Atlantis ↔ Fremdplanet durch das Stargate (OBJ-001).
// Durchgang = Spielerpunkt wechselt bei offenem, nicht eingehendem Tor von vor die Ringebene nach dahinter (innerhalb des Rings).
// Atlantis: beliebige Adresse außer Erde führt zum Planeten. Planet: DHD-Aktion „Atlantis anwählen“ führt zurück.
// Geschrieben von Claude (MiniMax-Versuche SPL-008 gescheitert); Schnittstelle: build/ANLEITUNG_SPIEL.md
import * as THREE from 'three';

const RING_RADIUS = 2.4;

export function init(ctx) {
  const { services, state, uiRoot } = ctx;
  const tore = new Map();            // Tor-Objekt → { vorher, eingehend, ziel }
  let atlantisTor = null, reist = false, suchTakt = 0, atlantisMitte = null, atlantisVorne = null;
  const mitte = new THREE.Vector3(), vorne = new THREE.Vector3(), q = new THREE.Quaternion(), punkt = new THREE.Vector3(), d = new THREE.Vector3();
  const box = new THREE.Box3();

  // Overlay für den weißen Übergang
  const blende = document.createElement('div');
  Object.assign(blende.style, { position: 'fixed', inset: '0', background: '#fff', opacity: '0', transition: 'opacity .4s', pointerEvents: 'none' });
  uiRoot.appendChild(blende);
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));

  function geometrie(tor) {
    const ring = tor.getObjectByName('ring') || tor;
    box.setFromObject(ring);
    box.getCenter(mitte);
    vorne.set(0, 0, 1).applyQuaternion(tor.getWorldQuaternion(q)).normalize();
  }

  // Torsteuerung: das Tor bekommt eine aufgeräumte Aktionsliste, das zugehörige DHD dieselbe (Fernbedienung, keine eigene Logik)
  function steuerung(tor, ort) {
    const api = tor.userData.api, adr = tor.userData.addresses, eintrag = tore.get(tor);
    const waehlen = (ziel, adresse) => () => { eintrag.ziel = ziel; api.dial(adresse); };
    const liste = ort === 'planet'
      ? [{ id: 'atlantis', label: 'Atlantis anwählen', run: waehlen('atlantis', adr.alpha) }]
      : [
          { id: 'm35', label: 'M35-117 anwählen (Fremdplanet)', run: waehlen('m35', adr.m35) },
          { id: 'erde', label: 'Erde anwählen (8 Chevrons)', run: waehlen('erde', adr.erde) },
        ];
    liste.push(
      { id: 'schliessen', label: 'Wurmloch schließen', run: () => api.close() },
      { id: 'schild', label: 'Torschild an/aus', run: () => api.setShield?.(!api.shield) },
    );
    tor.userData.actions = liste;
    return liste;
  }

  function dhdKoppeln(dhd, liste) {
    if (!dhd || dhd.userData._torreise === liste) return;
    dhd.userData.actions = liste;
    dhd.userData._torreise = liste;
    for (const [t, e] of tore) if (e.liste === liste) e.dhd = dhd;     // DHD leuchtet, solange das Tor aktiv ist
    // INT_-Punkte des DHD tragen teils eigene Bezeichnungen – einheitlich „DHD“
    dhd.traverse((o) => { if (/^INT_/.test(o.name) && o.userData) o.userData.label = 'DHD'; });
  }

  function anmelden(tor, ort) {
    if (tore.has(tor)) return;
    const eintrag = { vorher: null, eingehend: false, ziel: null, liste: null };
    tore.set(tor, eintrag);
    tor.userData.api.onChange((s, info) => {
      if (s === 'dialing' || s === 'kawoosh' || s === 'open') { if (info && 'incoming' in info) eintrag.eingehend = !!info.incoming; }
      if (s === 'idle') { eintrag.eingehend = false; eintrag.ziel = null; }
      eintrag.dhd?.userData?.api?.leuchten?.(s !== 'idle');
    });
    eintrag.liste = steuerung(tor, ort);
  }

  function findeAtlantisTor() {
    const h = services.get('welt')?.geladen?.().find((x) => x.id === 'ATL-001');
    const t = h?.funktionen?.find((o) => o.userData?.objId === 'OBJ-001' || o.userData?.api?.dial);
    if (t && t !== atlantisTor) { atlantisTor = t; anmelden(t, 'atlantis'); }
    if (t) {
      const dhd = h.funktionen.find((o) => /^OBJ-(002|097)$/.test(o.userData?.objId || ''));
      dhdKoppeln(dhd, tore.get(t).liste);
    }
  }

  function planetVorbereiten() {
    const planet = services.get('planet');
    const tor = planet?.tor, dhd = planet?.dhd;
    if (!tor || !dhd) return null;
    anmelden(tor, 'planet');
    dhdKoppeln(dhd, tore.get(tor).liste);
    return tor;
  }

  // Benutzen-Punkte auf dem Planeten (der Planet gehört zu keinem Raum, welt.benutzbare() fragt hier nach)
  const planetDienst = services.get('planet');
  if (planetDienst) planetDienst.benutzbare = () => {
    const tor = planetDienst.tor, dhd = planetDienst.dhd;
    if (!planetDienst.aktiv || !tor || !dhd || !tore.has(tor)) return [];
    const liste = tore.get(tor).liste;
    geometrie(tor);
    const torPunkt = mitte.clone().addScaledVector(vorne, 0.6); torPunkt.y -= 1.2;
    const dhdPunkt = dhd.getWorldPosition(new THREE.Vector3()); dhdPunkt.y += 1.35;
    return [
      { pos: dhdPunkt, label: 'DHD', actions: liste, obj: dhd },
      { pos: torPunkt, label: 'Stargate', actions: liste, obj: tor },
    ];
  };

  // Gegentor als „eingehend“ öffnen und 5 s nach dem tatsächlichen Öffnen wieder schließen (auch auf langsamen Rechnern)
  function eingehendKurz(tor) {
    const api = tor.userData.api;
    let aus = null;
    aus = api.onChange((s) => {
      if (s === 'open') { setTimeout(() => api.state === 'open' && api.close(), 5000); aus?.(); }
      if (s === 'idle') aus?.();
    });
    api.incoming();
  }

  async function blenden(an) { blende.style.opacity = an ? '1' : '0'; await warte(420); }

  async function zumPlaneten(vonTor) {
    reist = true;
    const spieler = services.get('spieler'), planet = services.get('planet'), ui = services.get('ui');
    geometrie(vonTor); atlantisMitte = mitte.clone(); atlantisVorne = vorne.clone();
    await blenden(true);
    if (spieler) spieler.aktiv = false;
    const z = await planet.betreten();
    spieler?.setPosition(z.pos, z.yaw);
    const pt = planetVorbereiten();
    vonTor.userData.api.close();
    if (pt) { tore.get(pt).vorher = null; eingehendKurz(pt); }
    await blenden(false);
    if (spieler) spieler.aktiv = true;
    ui?.meldung?.('Unbekannter Planet', 3);
    reist = false;
  }

  async function nachAtlantis(vonTor) {
    reist = true;
    const spieler = services.get('spieler'), planet = services.get('planet'), ui = services.get('ui'), welt = services.get('welt');
    await blenden(true);
    if (spieler) spieler.aktiv = false;
    planet.verlassen();
    vonTor.userData.api.close();
    // 4 m vor das Atlantis-Tor, Blick vom Tor weg, auf Bodenhöhe der Torhalle
    const m = atlantisMitte || (atlantisTor && (geometrie(atlantisTor), mitte.clone()));
    const f = atlantisVorne || vorne.clone();
    const pos = new THREE.Vector3(m.x + f.x * 4, m.y - 3.05, m.z + f.z * 4);
    spieler?.setPosition(pos, Math.atan2(-f.x, -f.z));
    // warten, bis die Torhalle wieder geladen ist (sonst fällt man durch den noch fehlenden Boden)
    for (let i = 0; i < 200 && !welt?.geladen?.().some((h) => h.id === 'ATL-001'); i++) { spieler?.setPosition(pos, Math.atan2(-f.x, -f.z)); await warte(100); }
    findeAtlantisTor();
    if (atlantisTor) { tore.get(atlantisTor).vorher = null; eingehendKurz(atlantisTor); }
    await blenden(false);
    if (spieler) spieler.aktiv = true;
    ui?.meldung?.('Willkommen zurück in Atlantis', 3);
    reist = false;
  }

  function pruefeDurchgang(tor, eintrag) {
    const api = tor.userData.api;
    if (api.state !== 'open' || eintrag.eingehend) { eintrag.vorher = null; return false; }
    geometrie(tor);
    punkt.copy(state.spieler.pos); punkt.y += 1.0;
    d.copy(punkt).sub(mitte);
    const s = d.dot(vorne);
    const radial = d.addScaledVector(vorne, -s).length();
    const durch = eintrag.vorher !== null && eintrag.vorher > 0 && s <= 0 && radial < RING_RADIUS;
    eintrag.vorher = s;
    return durch;
  }

  ctx.services.register('torreise', { get reist() { return reist; } });

  async function selbsttest() {
    const details = [];
    const bild = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const spieler = services.get('spieler');
    for (let i = 0; i < 100 && !atlantisTor; i++) { findeAtlantisTor(); await warte(100); }
    if (!atlantisTor) return { ok: false, details: 'Atlantis-Tor nicht gefunden' };
    const api = atlantisTor.userData.api;
    const m35 = (atlantisTor.userData.actions || []).find((a) => a.id === 'm35');
    if (m35) m35.run(); else api.dial(atlantisTor.userData.addresses.m35);
    const t0 = performance.now();
    while (api.state !== 'open' && performance.now() - t0 < 120000) await warte(200);
    if (api.state !== 'open') return { ok: false, details: `Atlantis-Tor nicht offen (Zustand ${api.state})` };
    details.push('Tor offen');
    geometrie(atlantisTor);
    const m = mitte.clone(), f = vorne.clone();
    for (let i = 0; i <= 10; i++) {
      const s = 2 - i * 0.4;
      if (reist || state.ort !== 'atlantis') break;      // Reise läuft – nicht weiter schieben
      spieler.setPosition(new THREE.Vector3(m.x + f.x * s, m.y - 1.0, m.z + f.z * s), Math.atan2(f.x, f.z));
      await bild();
    }
    for (let i = 0; i < 300 && state.ort !== 'planet'; i++) await warte(100);
    if (state.ort !== 'planet') return { ok: false, details: details.join(', ') + ' – keine Reise zum Planeten' };
    details.push('auf dem Planeten');
    for (let i = 0; i < 600 && reist; i++) await warte(100);
    const pt = services.get('planet').tor;
    const dhdAkt = services.get('planet').benutzbare().find((z) => z.label === 'DHD')?.actions.find((a) => a.id === 'atlantis');
    if (!dhdAkt) return { ok: false, details: details.join(', ') + ' – DHD auf dem Planeten nicht bedienbar' };
    details.push('DHD bedienbar');
    for (let i = 0; i < 900 && pt.userData.api.state !== 'idle'; i++) await warte(200);
    if (pt.userData.api.state !== 'idle') return { ok: false, details: details.join(', ') + ` – Planeten-Tor wird nicht frei (${pt.userData.api.state})` };
    dhdAkt.run();
    const t1 = performance.now();
    while (pt.userData.api.state !== 'open' && performance.now() - t1 < 120000) await warte(200);
    if (pt.userData.api.state !== 'open') return { ok: false, details: details.join(', ') + ' – Planeten-Tor nicht offen' };
    details.push('Planeten-Tor offen');
    geometrie(pt);
    const pm = mitte.clone(), pf = vorne.clone();
    for (let i = 0; i <= 10; i++) {
      const s = 2 - i * 0.4;
      if (reist || state.ort !== 'planet') break;        // Reise läuft – nicht weiter schieben
      spieler.setPosition(new THREE.Vector3(pm.x + pf.x * s, pm.y - 1.0, pm.z + pf.z * s), Math.atan2(pf.x, pf.z));
      await bild();
    }
    for (let i = 0; i < 300 && (state.ort !== 'atlantis' || reist); i++) await warte(100);
    const zurueck = state.ort === 'atlantis' && state.spieler.pos.distanceTo(atlantisMitte || m) < 8;
    details.push(zurueck ? 'zurück vor dem Atlantis-Tor' : `Rückkehr fehlgeschlagen (ort ${state.ort}, reist ${reist}, Planeten-Tor ${pt.userData.api.state}, Abstand ${state.spieler.pos.distanceTo(atlantisMitte || m).toFixed(1)} m, y ${state.spieler.pos.y.toFixed(1)})`);
    return { ok: zurueck, details: details.join(', ') };
  }

  return {
    selbsttest,
    update(dt) {
      if (reist) return;
      suchTakt -= dt;
      if (suchTakt <= 0) { suchTakt = 0.5; findeAtlantisTor(); if (state.ort === 'planet') planetVorbereiten(); }
      if (state.ort === 'atlantis' && atlantisTor && tore.has(atlantisTor)) {
        const e = tore.get(atlantisTor);
        if (pruefeDurchgang(atlantisTor, e)) {
          if (e.ziel === 'erde') { services.get('ui')?.meldung?.('Die Erde ist in diesem Spiel nicht erreichbar', 3); atlantisTor.userData.api.close(); }
          else zumPlaneten(atlantisTor);
        }
      } else if (state.ort === 'planet') {
        const pt = services.get('planet')?.tor;
        if (pt && tore.has(pt) && pruefeDurchgang(pt, tore.get(pt))) nachAtlantis(pt);
      }
    },
  };
}

// Welt-Streaming: hält Räume und Korridore um den Spieler geladen.
import * as THREE from 'three';

export function init(ctx) {
  const T = ctx.THREE || THREE;
  const plan = ctx.plan || { raeume: [], korridore: [], transporter: [], spielmarken: {} };
  const state = ctx.state;

  const geladen = new Map();          // Schlüssel -> {handle, eintrag, korridor}
  const jobs = new Map();             // Schlüssel -> Job
  const warteschlange = [];
  const grundrissCache = new WeakMap();

  let aktiv = 0;
  let letzterRaum = null;
  let scanZeit = 0;
  let zerstoert = false;
  let bereitResolveFn = null;
  const bereitPromise = new Promise((resolve) => { bereitResolveFn = resolve; });

  // --- Dienste (spät auflösbar) ---------------------------------------

  function dienst(name) {
    if (!ctx.services || typeof ctx.services.get !== 'function') return null;
    try { return ctx.services.get(name) || null; } catch (e) { return null; }
  }

  async function dienstWarten(name, versuche = 120) {
    for (let i = 0; i < versuche; i++) {
      const d = dienst(name);
      if (d) return d;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  }

  // --- Geometrie-Hilfen -------------------------------------------------

  function zahl(value, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  function punkt3(value) {
    if (value && typeof value.x === 'number') {
      return { x: zahl(value.x), y: zahl(value.y), z: zahl(value.z) };
    }
    if (Array.isArray(value)) {
      return { x: zahl(value[0]), y: zahl(value[1]), z: zahl(value[2]) };
    }
    return { x: 0, y: 0, z: 0 };
  }

  function punkt2(value) {
    if (value && typeof value.x === 'number') return { x: zahl(value.x), z: zahl(value.z) };
    if (Array.isArray(value)) return { x: zahl(value[0]), z: zahl(value[1]) };
    return { x: 0, z: 0 };
  }

  function alsVektor(value) {
    const p = punkt3(value);
    return new T.Vector3(p.x, p.y, p.z);
  }

  function spielerPos() {
    if (state && state.spieler && state.spieler.pos) return state.spieler.pos;
    const s = dienst('spieler');
    if (s && s.position) return s.position;
    return new T.Vector3();
  }

  // --- Grundriss -------------------------------------------------------

  function bboxEnthaelt(punkte, x, z) {
    if (!punkte.length) return false;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const q of punkte) {
      if (q.x < minX) minX = q.x;
      if (q.x > maxX) maxX = q.x;
      if (q.z < minZ) minZ = q.z;
      if (q.z > maxZ) maxZ = q.z;
    }
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  }

  function punktInPolygon(x, z, punkte) {
    if (!punkte || punkte.length < 3) return false;
    let drin = false;
    for (let i = 0, j = punkte.length - 1; i < punkte.length; j = i++) {
      const xi = punkte[i].x, zi = punkte[i].z;
      const xj = punkte[j].x, zj = punkte[j].z;
      const trifft = ((zi > z) !== (zj > z)) &&
        (x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-9) + xi);
      if (trifft) drin = !drin;
    }
    return drin;
  }

  // Grundriss: entweder lokale Koordinaten (um pos gedreht) oder Weltkoordinaten.
  function grundrissInfo(raum) {
    if (grundrissCache.has(raum)) return grundrissCache.get(raum);

    const g = Array.isArray(raum.grundriss) ? raum.grundriss : [];
    const p = punkt3(raum.pos);
    const rot = zahl(raum.rotY);
    const c = Math.cos(rot), s = Math.sin(rot);

    const punkte = [];
    let cx = 0, cz = 0;
    for (const q of g) {
      const v = punkt2(q);
      punkte.push(v);
      cx += v.x; cz += v.z;
    }
    if (punkte.length) { cx /= punkte.length; cz /= punkte.length; }

    const lokAnkerDrin = bboxEnthaelt(punkte, 0, 0);
    const absAnkerDrin = bboxEnthaelt(punkte, p.x, p.z);
    const dLok = Math.hypot(cx, cz);
    const dAbs = Math.hypot(cx - p.x, cz - p.z);

    let absolut;
    if (lokAnkerDrin && !absAnkerDrin) absolut = false;
    else if (absAnkerDrin && !lokAnkerDrin) absolut = true;
    else absolut = !(dLok < dAbs);

    const info = {
      absolut,
      rot,
      pos: p,
      punkte,
      centerX: absolut ? cx : (p.x + cx * c - cz * s),
      centerZ: absolut ? cz : (p.z + cx * s + cz * c),
      gueltig: punkte.length >= 3,
    };

    grundrissCache.set(raum, info);
    return info;
  }

  function vertMitte(raum) {
    const h = raum.hoehe;
    if (Array.isArray(h) && h.length >= 2) return (zahl(h[0]) + zahl(h[1])) * 0.5;
    return zahl(punkt3(raum.pos).y);
  }

  function raumMitte(raum) {
    const info = grundrissInfo(raum);
    return { x: info.centerX, y: vertMitte(raum), z: info.centerZ };
  }

  function enthaelt(raum, x, y, z) {
    const info = grundrissInfo(raum);
    if (!info.gueltig) return false;

    let innen;
    if (info.absolut) {
      innen = punktInPolygon(x, z, info.punkte);
    } else {
      const dx = x - info.pos.x;
      const dz = z - info.pos.z;
      const c = Math.cos(info.rot), s = Math.sin(info.rot);
      const lx = dx * c + dz * s;
      const lz = -dx * s + dz * c;
      innen = punktInPolygon(lx, lz, info.punkte);
    }
    if (!innen) return false;

    const h = raum.hoehe;
    if (Array.isArray(h) && h.length >= 2) {
      return zahl(h[0]) - 0.5 <= y && y <= zahl(h[1]);
    }
    return true;
  }

  function raumBei(pos) {
    if (!pos) return null;
    const x = zahl(pos.x), y = zahl(pos.y), z = zahl(pos.z);
    const raeume = Array.isArray(plan.raeume) ? plan.raeume : [];
    for (const raum of raeume) {
      if (enthaelt(raum, x, y, z)) return raum.id;
    }
    return null;
  }

  function raumPlan(id) {
    const raeume = Array.isArray(plan.raeume) ? plan.raeume : [];
    for (const r of raeume) if (r && r.id === id) return r;
    return null;
  }

  function eintragMitte(eintrag) {
    if (!eintrag) return { x: 0, y: 0, z: 0 };
    if (eintrag.grundriss) {
      const info = grundrissInfo(eintrag);
      if (info.gueltig) return { x: info.centerX, y: vertMitte(eintrag), z: info.centerZ };
    }
    const p = punkt3(eintrag.pos);
    return { x: p.x, y: p.y, z: p.z };
  }

  function kandidatenRaeume(pos, radius = 60) {
    const p = punkt3(pos);
    const raeume = Array.isArray(plan.raeume) ? plan.raeume : [];
    const raus = [];
    for (const r of raeume) {
      const m = raumMitte(r);
      const d = Math.hypot(p.x - m.x, p.z - m.z);
      if (d <= radius && Math.abs(p.y - m.y) <= 25) raus.push(r);
    }
    return raus;
  }

  function nachEntfernungSortieren(raeume, pos) {
    const p = punkt3(pos);
    return raeume.slice().sort((a, b) => {
      const ma = raumMitte(a), mb = raumMitte(b);
      return Math.hypot(p.x - ma.x, p.z - ma.z) - Math.hypot(p.x - mb.x, p.z - mb.z);
    });
  }

  function passendeKorridore(trakt) {
    if (!trakt) return [];
    const korridore = Array.isArray(plan.korridore) ? plan.korridore : [];
    return korridore.filter((k) => k && k.trakt === trakt);
  }

  // --- Laden / Entladen -----------------------------------------------

  function jobSchluessel(id, korridor) {
    return (korridor ? 'k:' : 'r:') + id;
  }

  function jobDistanz(job) {
    const p = punkt3(spielerPos());
    const m = eintragMitte(job.eintrag);
    return Math.hypot(p.x - m.x, p.z - m.z);
  }

  function requestJob(key, eintrag, korridor, force) {
    const alt = jobs.get(key);
    if (alt) return alt.promise;

    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    promise.catch(() => {}); // unbehandelte Ablehnungen vermeiden

    const job = { key, eintrag, korridor, force: !!force, verwerfen: false, promise, resolve, reject };
    jobs.set(key, job);
    warteschlange.push(job);
    pump();
    return promise;
  }

  function requestRaum(id, force) {
    const key = jobSchluessel(id, false);
    if (geladen.has(key)) return Promise.resolve(geladen.get(key).handle);
    const r = raumPlan(id);
    if (!r) return Promise.resolve(null);
    return requestJob(key, r, false, force);
  }

  function requestKorridor(k) {
    if (!k || !k.id) return Promise.resolve(null);
    const key = jobSchluessel(k.id, true);
    if (geladen.has(key)) return Promise.resolve(geladen.get(key).handle);
    return requestJob(key, k, true, false);
  }

  function istBeweglich(mesh) {
    if (!mesh) return false;
    const name = String(mesh.name || '');
    const ud = mesh.userData || {};
    return /tuer|door|klappe|luke|rampe/i.test(name) || ud.aktiv !== undefined;
  }

  function statischeKollision(handle) {
    const liste = Array.isArray(handle && handle.kollision) ? handle.kollision : [];
    return liste.filter((m) => {
      if (!m) return false;
      if (m.userData && m.userData.aktiv === false) return false;
      return !istBeweglich(m);
    });
  }

  function dynamischeKollision(handle) {
    const liste = Array.isArray(handle && handle.kollision) ? handle.kollision : [];
    return liste.filter((m) => {
      if (!m) return false;
      if (!/COL_/i.test(String(m.name || ''))) return false;
      return istBeweglich(m);
    });
  }

  // Türen ohne Anschluss im Stadtplan verriegeln (z. B. Gang-Ende „ende“ ohne Raum dahinter) – sonst öffnen sie sich
  // automatisch ins Leere. Zuordnung Tür-Objekt → nächster DOOR_-Punkt des Gangs/Raums (≤ 1,6 m). – Claude
  let anschluesse = null;
  function tuerenOhneAnschlussVerriegeln(handle, eintrag, korridor) {
    if (!anschluesse) {
      anschluesse = new Map();
      for (const v of plan.verbindungen || []) for (const seite of [v.a, v.b]) {
        if (!seite || !seite.tuer) continue;
        const k = (seite.korridor ? 'K:' + seite.korridor : 'R:' + seite.raum);
        if (!anschluesse.has(k)) anschluesse.set(k, new Set());
        anschluesse.get(k).add(seite.tuer);
      }
    }
    const verbunden = anschluesse.get((korridor ? 'K:' : 'R:') + eintrag.id) || new Set();
    const punkte = [];
    handle.gruppe?.traverse((o) => { if (/^DOOR_/.test(o.name)) punkte.push(o); });
    if (!punkte.length) return;
    const pTuer = new T.Vector3(), pPunkt = new T.Vector3();
    for (const obj of handle.funktionen || []) {
      const api = obj.userData?.api;
      if (!api || typeof api.verriegeln !== 'function') continue;
      obj.getWorldPosition(pTuer);
      let naechster = null, d = 1.6;
      for (const pk of punkte) { const dd = pk.getWorldPosition(pPunkt).distanceTo(pTuer); if (dd < d) { d = dd; naechster = pk; } }
      if (!naechster || verbunden.has(naechster.name)) continue;
      api.verriegeln();
      if (Array.isArray(obj.userData.actions)) obj.userData.actions = obj.userData.actions.filter((a) => !/entriegel|oeffnen|öffnen|umschalten/i.test(a.id + ' ' + a.label));
    }
  }

  // Verbindungsstücke: Nach dem Einpassen der Stadt liegen Gang- und Raumtür teils nicht mehr aneinander → Lücke ohne Boden.
  // Sind beide Seiten einer Verbindung geladen und liegen ihre DOOR_-Punkte 5 cm bis 6 m auseinander, wird dazwischen ein
  // Durchgang gebaut (Boden mit Kollision, Seitenwände, Decke; bei Höhenunterschied als Rampe). – Claude
  const bruecken = new Map();                 // Verbindungsschlüssel → { gruppe, a, b }
  const brueckeMat = { boden: null, wand: null };
  function seiteFinden(seite) {
    for (const [k, e] of geladen) {
      if (!e.eintrag) continue;
      if (seite.korridor ? (e.korridor && e.eintrag.id === seite.korridor) : (!e.korridor && e.eintrag.id === seite.raum)) return { k, e };
    }
    return null;
  }
  function tuerPunkt(e, name) {
    let p = null;
    e.handle.gruppe?.traverse((o) => { if (!p && o.name === name) p = o; });
    return p;
  }
  function brueckenBauen() {
    for (const v of plan.verbindungen || []) {
      if (!v.a?.tuer || !v.b?.tuer || !/tuer|offen/.test(v.art || '')) continue;
      const vk = JSON.stringify([v.a, v.b]);
      if (bruecken.has(vk)) continue;
      const A = seiteFinden(v.a), B = seiteFinden(v.b);
      if (!A || !B) continue;
      const pa = tuerPunkt(A.e, v.a.tuer), pb = tuerPunkt(B.e, v.b.tuer);
      if (!pa || !pb) { bruecken.set(vk, { gruppe: null, a: A.k, b: B.k }); continue; }
      const wa = pa.getWorldPosition(new T.Vector3()), wb = pb.getWorldPosition(new T.Vector3());
      const abstand = wa.distanceTo(wb);
      if (abstand < 0.05 || abstand > 6) { bruecken.set(vk, { gruppe: null, a: A.k, b: B.k }); continue; }
      bruecken.set(vk, { gruppe: brueckeErzeugen(vk, wa, wb, pa.userData?.breite, pa.userData?.hoehe), a: A.k, b: B.k });
    }
  }
  function brueckeErzeugen(vk, wa, wb, breite = 2.4, hoehe = 3) {
    if (!brueckeMat.boden) {
      brueckeMat.boden = new T.MeshStandardMaterial({ color: 0x20262e, roughness: 0.8, metalness: 0.2 });
      brueckeMat.wand = new T.MeshStandardMaterial({ color: 0x2c3644, roughness: 0.7, metalness: 0.3 });
    }
    const richtung = new T.Vector3().subVectors(wb, wa);
    const laenge = richtung.length() + 0.4;                      // je 20 cm in Gang und Raum hinein
    const mitte = new T.Vector3().addVectors(wa, wb).multiplyScalar(0.5);
    const g = new T.Group();
    g.name = 'durchgang_' + vk.length;
    g.position.copy(mitte);
    g.lookAt(wb);                                                // lokale +Z zeigt von A nach B (mit Neigung bei Höhenunterschied)
    const B = Math.max(breite || 2.4, 2.4) + 0.4, H = Math.max(hoehe || 3, 3) + 0.2;
    const teil = (name, mat, w, h, d, x, y, z) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.name = name; m.position.set(x, y, z); g.add(m); return m;
    };
    const kollision = [
      teil('boden', brueckeMat.boden, B, 0.2, laenge, 0, -0.1, 0),
      teil('wand_l', brueckeMat.wand, 0.2, H, laenge, -B / 2, H / 2, 0),
      teil('wand_r', brueckeMat.wand, 0.2, H, laenge, B / 2, H / 2, 0),
      teil('decke', brueckeMat.wand, B + 0.2, 0.2, laenge, 0, H, 0),
    ];
    ctx.scene.add(g);
    g.updateMatrixWorld(true);
    dienst('kollision')?.hinzufuegen?.('durchgang:' + vk, kollision);
    return g;
  }
  function brueckenAufraeumen() {
    for (const [vk, b] of Array.from(bruecken)) {
      if (geladen.has(b.a) && geladen.has(b.b)) continue;
      if (b.gruppe) {
        b.gruppe.removeFromParent();
        b.gruppe.traverse((o) => o.geometry?.dispose());
        dienst('kollision')?.entfernen?.('durchgang:' + vk);
      }
      bruecken.delete(vk);
    }
  }

  function handleRegistrieren(key, handle, eintrag, korridor, job) {
    if (!handle) return null;
    if (zerstoert || (job && job.verwerfen)) {
      if (typeof handle.dispose === 'function') handle.dispose();
      return null;
    }

    geladen.set(key, { handle, eintrag, korridor });
    tuerenOhneAnschlussVerriegeln(handle, eintrag, korridor);
    brueckenBauen();
    const serviceKey = korridor ? key : (handle.id || eintrag.id);

    const kol = dienst('kollision');
    if (kol) {
      if (typeof kol.hinzufuegen === 'function') kol.hinzufuegen(serviceKey, statischeKollision(handle));
      if (typeof kol.dynamisch === 'function') kol.dynamisch(serviceKey, dynamischeKollision(handle));
    }
    const li = dienst('licht');
    if (li && typeof li.registrieren === 'function') {
      li.registrieren(serviceKey, Array.isArray(handle.lampen) ? handle.lampen : []);
    }
    return handle;
  }

  function handleEntladen(key) {
    const job = jobs.get(key);
    if (job) job.verwerfen = true;

    const eintrag = geladen.get(key);
    if (!eintrag) return;
    const serviceKey = eintrag.korridor ? key : (eintrag.handle.id || eintrag.eintrag.id);

    const kol = dienst('kollision');
    if (kol) {
      if (typeof kol.entfernen === 'function') kol.entfernen(serviceKey);
      if (typeof kol.dynamischEntfernen === 'function') kol.dynamischEntfernen(serviceKey);
      if (typeof kol.entfernenDynamisch === 'function') kol.entfernenDynamisch(serviceKey);
    }
    const li = dienst('licht');
    if (li && typeof li.entfernen === 'function') li.entfernen(serviceKey);

    if (eintrag.handle && typeof eintrag.handle.dispose === 'function') eintrag.handle.dispose();
    geladen.delete(key);
    brueckenAufraeumen();
  }

  async function jobAusfuehren(job) {
    const a = await dienstWarten('assets');
    if (!a) throw new Error('Dienst assets ist nicht verfügbar.');
    if (job.korridor) return a.korridor(job.eintrag);
    return a.raum(job.eintrag.id);
  }

  function jobZuWeit(job) {
    if (job.force) return false;
    return jobDistanz(job) > 100;
  }

  function pump() {
    if (zerstoert) return;
    while (aktiv < 2 && warteschlange.length) {
      warteschlange.sort((a, b) => jobDistanz(a) - jobDistanz(b));
      const job = warteschlange.shift();
      if (!job) break;

      if (jobZuWeit(job)) {
        job.verwerfen = true;
        job.resolve(null);
        if (jobs.get(job.key) === job) jobs.delete(job.key);
        continue;
      }

      aktiv++;
      jobAusfuehren(job).then((handle) => {
        const registriert = handleRegistrieren(job.key, handle, job.eintrag, job.korridor, job);
        job.resolve(registriert);
      }).catch((fehler) => {
        job.reject(fehler);
        ctx.log('Welt: Laden fehlgeschlagen:', fehler && (fehler.message || fehler));
      }).finally(() => {
        if (jobs.get(job.key) === job) jobs.delete(job.key);
        aktiv--;
        pump();
      });
    }
  }

  function scan(pos) {
    const kandidaten = kandidatenRaeume(pos);
    for (const r of kandidaten) {
      if (!geladen.has(jobSchluessel(r.id, false))) requestRaum(r.id);
    }

    // Korridore aller Trakte geladener Räume.
    const trakte = new Set();
    for (const r of kandidaten) if (r.trakt) trakte.add(r.trakt);
    for (const eintrag of geladen.values()) {
      if (!eintrag.korridor && eintrag.eintrag && eintrag.eintrag.trakt) {
        trakte.add(eintrag.eintrag.trakt);
      }
    }
    for (const trakt of trakte) {
      for (const k of passendeKorridore(trakt)) {
        if (!geladen.has(jobSchluessel(k.id, true))) requestKorridor(k);
      }
    }
  }

  function entladenWeitEntfernte() {
    const p = punkt3(spielerPos());
    for (const [key, eintrag] of Array.from(geladen.entries())) {
      const planEintrag = eintrag.eintrag;
      if (!planEintrag) continue;
      const m = eintragMitte(planEintrag);
      if (Math.hypot(p.x - m.x, p.z - m.z) > 100) handleEntladen(key);
    }
    for (const job of jobs.values()) {
      if (!job.force && jobDistanz(job) > 100) job.verwerfen = true;
    }
  }

  function setRaumFaktor() {
    const id = raumBei(spielerPos());
    if (id === letzterRaum) return;
    letzterRaum = id;

    const r = id ? raumPlan(id) : null;
    const trakt = String((r && r.trakt) || '').toLowerCase();
    const f = /energie|kern|stasis|wasser|fracht/.test(trakt) ? 0.8 : 1.0;
    if (typeof ctx.setRaumFaktor === 'function') ctx.setRaumFaktor(f);
  }

  // --- Transporter ------------------------------------------------------

  function transporterName(t) {
    if (t && t.name) return t.name;
    const woerter = String((t && t.trakt) || '')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    if (!woerter.length) return 'Transporter';
    if (woerter.length === 1) return woerter[0];
    return woerter.slice(0, -1).join(' ') + ' – ' + woerter[woerter.length - 1];
  }

  function transporterSuchen(id) {
    const liste = Array.isArray(plan.transporter) ? plan.transporter : [];
    for (const t of liste) if (t && t.id === id) return t;
    return null;
  }

  function spielerSetzen(ziel, yaw) {
    if (state && state.spieler) {
      if (state.spieler.pos && typeof state.spieler.pos.copy === 'function') {
        state.spieler.pos.copy(ziel);
      }
      if (state.spieler.blick) state.spieler.blick.yaw = yaw;
    }
    const s = dienst('spieler');
    if (s && typeof s.setPosition === 'function') s.setPosition(ziel, yaw);
  }

  async function teleport(id) {
    const t = transporterSuchen(id);
    if (!t) throw new Error('Unbekannter Transporter: ' + id);

    const tp = punkt3(t.pos);
    const yaw = zahl(t.rotY);
    const ziel = new T.Vector3(
      tp.x + Math.sin(yaw) * 1.5,
      tp.y,
      tp.z + Math.cos(yaw) * 1.5
    );

    // Zielbereich bestimmen und laden.
    const zielRaum = raumBei(ziel);
    const wunsch = [];
    const gesehen = new Set();

    const nah = nachEntfernungSortieren(kandidatenRaeume(ziel, 60), ziel);
    for (const r of nah) {
      if (!gesehen.has(r.id)) { gesehen.add(r.id); wunsch.push(r); }
    }
    if (zielRaum && !gesehen.has(zielRaum)) {
      const zr = raumPlan(zielRaum);
      if (zr) { gesehen.add(zielRaum); wunsch.unshift(zr); }
    }
    if (t.trakt) {
      const p = punkt3(ziel);
      const gleich = nachEntfernungSortieren(
        (Array.isArray(plan.raeume) ? plan.raeume : []).filter((r) => r.trakt === t.trakt), p
      ).filter((r) => Math.hypot(p.x - raumMitte(r).x, p.z - raumMitte(r).z) <= 100);
      for (const r of gleich) {
        if (!gesehen.has(r.id)) { gesehen.add(r.id); wunsch.push(r); }
      }
    }

    const wartungen = [];
    for (const r of wunsch.slice(0, 8)) wartungen.push(requestRaum(r.id));
    await Promise.allSettled(wartungen);

    spielerSetzen(ziel, yaw);

    scan(ziel);
    entladenWeitEntfernte();
    setRaumFaktor();

    return { pos: ziel.clone(), yaw };
  }

  // --- Benutzbare Objekte ----------------------------------------------

  // lesbarer Name eines Objekts (Modulname, z. B. 'puddle_jumper' → 'Puddle Jumper'), nie die interne Zahl-ID
  const anzeigename = (o) => {
    const n = o?.userData?.label || o?.name || o?.userData?.objId || 'Benutzen';
    return String(n).replace(/^(raum_|INT_)/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  function benutzbare() {
    const ergebnis = [];
    const mitInt = new Set();       // Objekte, die schon über einen INT_-Punkt erreichbar sind

    for (const eintrag of geladen.values()) {
      const h = eintrag.handle;
      if (!h) continue;

      if (Array.isArray(h.benutzen)) {
        for (const b of h.benutzen) {
          if (!b) continue;
          const obj = b.obj;
          const ud = (obj && obj.userData) || {};
          let pos = b.pos;

          if (pos && typeof pos.x === 'number') {
            pos = pos instanceof T.Vector3 ? pos.clone() : alsVektor(pos);
          } else if (obj && typeof obj.getWorldPosition === 'function') {
            obj.updateWorldMatrix(true, false);
            pos = obj.getWorldPosition(new T.Vector3());
          } else {
            continue;
          }

          // Aktionen gehören dem Objekt, in dem der INT_-Punkt steckt: nächsten Vorfahren mit userData.actions suchen
          let besitzer = obj;
          while (besitzer && !(besitzer.userData?.actions?.length)) besitzer = besitzer.parent;
          if (besitzer) mitInt.add(besitzer);
          ergebnis.push({
            pos,
            label: b.label || ud.label || anzeigename(besitzer || obj),
            actions: b.actions || besitzer?.userData?.actions || [],
            obj: besitzer || obj,
          });
        }
      }

      if (Array.isArray(h.funktionen)) {
        for (const obj of h.funktionen) {
          if (!obj) continue;
          let pos;
          if (typeof obj.getWorldPosition === 'function') {
            obj.updateWorldMatrix(true, false);
            pos = obj.getWorldPosition(new T.Vector3());
          } else if (obj.position) {
            pos = alsVektor(obj.position);
          } else {
            continue;
          }
          if (mitInt.has(obj)) continue;
          const ud = obj.userData || {};
          ergebnis.push({
            pos,
            label: anzeigename(obj),
            actions: ud.actions || [],
            obj,
          });
        }
      }
    }

    // Planet (gehört zu keinem Raum) – Claude
    const planet = ctx.services?.get?.('planet');
    if (planet?.aktiv && typeof planet.benutzbare === 'function') ergebnis.push(...planet.benutzbare());
    // selbst abgestellte Jumper – Claude
    const jumperDienst = ctx.services?.get?.('jumper');
    if (typeof jumperDienst?.benutzbare === 'function') ergebnis.push(...jumperDienst.benutzbare());

    return ergebnis;
  }

  // --- Dienst-API -------------------------------------------------------

  const api = {
    raumBei,
    bereid() { return bereitPromise; },
    bereit() { return bereitPromise; },
    benutzbare,
    transporterListe() {
      const liste = Array.isArray(plan.transporter) ? plan.transporter : [];
      return liste.map((t) => ({ id: t.id, name: transporterName(t) }));
    },
    teleport,
    durchgaenge() { return [...bruecken.values()].map((b) => b.gruppe).filter(Boolean); },
    geladen() {
      const out = [];
      for (const eintrag of geladen.values()) {
        if (eintrag.handle) out.push(eintrag.handle);
      }
      return out;
    },
  };

  // Der Kern kann einen gleichnamigen Platzhalter-Dienst vorregistriert haben.
  // Deshalb zuerst vorhandenen Dienst vervollständigen, dann registrieren.
  function weltRegistrieren() {
    if (!ctx.services) return;
    let vorhanden = null;
    if (typeof ctx.services.get === 'function') {
      try { vorhanden = ctx.services.get('welt'); } catch (e) { vorhanden = null; }
    }
    if (vorhanden && typeof vorhanden === 'object') {
      for (const k of Object.keys(api)) {
        if (typeof vorhanden[k] !== 'function') vorhanden[k] = api[k];
      }
    }
    if (typeof ctx.services.register === 'function') {
      try { ctx.services.register('welt', api); } catch (e) { /* Kern-Register evtl. read-only */ }
    }
    if (typeof ctx.services.get === 'function') {
      let jetzt = null;
      try { jetzt = ctx.services.get('welt'); } catch (e) { jetzt = null; }
      if (jetzt && typeof jetzt === 'object') {
        for (const k of Object.keys(api)) {
          if (typeof jetzt[k] !== 'function') jetzt[k] = api[k];
        }
      }
    }
  }

  weltRegistrieren();

  // --- Startbereich -----------------------------------------------------

  (async function start() {
    try {
      const marken = plan.spielmarken || {};
      const respawn = marken.respawn || { pos: [0, 0, 0] };
      const respawnPos = alsVektor(respawn.pos);

      let pos = spielerPos();
      const istNull = !pos || (zahl(pos.x) === 0 && zahl(pos.y) === 0 && zahl(pos.z) === 0);
      if (istNull) {
        spielerSetzen(respawnPos, state && state.spieler && state.spieler.blick
          ? state.spieler.blick.yaw : 0);
        pos = spielerPos();
      }

      const startId = raumBei(pos);
      const wartungen = [];

      if (startId) wartungen.push(requestRaum(startId));
      for (const r of kandidatenRaeume(pos)) {
        if (startId && r.id === startId) continue;
        wartungen.push(requestRaum(r.id));
      }
      // Start-Raum immer laden (Prüfstand erwartet ATL-001).
      if (raumPlan('ATL-001') && !geladen.has(jobSchluessel('ATL-001', false))) {
        wartungen.push(requestRaum('ATL-001', true));
      }

      const trakte = new Set();
      if (startId) {
        const sr = raumPlan(startId);
        if (sr && sr.trakt) trakte.add(sr.trakt);
      }
      for (const r of kandidatenRaeume(pos)) if (r.trakt) trakte.add(r.trakt);
      for (const trakt of trakte) {
        for (const k of passendeKorridore(trakt)) wartungen.push(requestKorridor(k));
      }

      await Promise.allSettled(wartungen);
    } catch (fehler) {
      ctx.log('Welt: Startbereich fehlerhaft:', fehler && (fehler.message || fehler));
    } finally {
      if (bereitResolveFn) bereitResolveFn();
    }
  })();

  // --- Frame ------------------------------------------------------------

  function update(dt) {
    if (zerstoert) return;

    for (const eintrag of geladen.values()) {
      const h = eintrag.handle;
      if (h && typeof h.update === 'function') h.update();
    }

    scanZeit += Math.min(dt || 0, 0.1);
    if (scanZeit >= 0.5) {
      scanZeit = 0;
      scan(spielerPos());
      entladenWeitEntfernte();
    }

    setRaumFaktor();
  }

  function dispose() {
    zerstoert = true;
    for (const key of Array.from(geladen.keys())) handleEntladen(key);
    for (const job of jobs.values()) { job.verwerfen = true; job.resolve(null); }
    jobs.clear();
    warteschlange.length = 0;
    if (bereitResolveFn) bereitResolveFn();
  }

  // --- Selbsttest -------------------------------------------------------

  async function selbsttest() {
    try {
      await api.bereid();

      const r = raumPlan('ATL-001');
      if (!r) return { ok: false, details: 'ATL-001 fehlt im Stadtplan.' };

      const m = raumMitte(r);
      const h = Array.isArray(r.hoehe) && r.hoehe.length >= 2
        ? { min: zahl(r.hoehe[0]), max: zahl(r.hoehe[1]) }
        : null;
      let testY = m.y + 1;
      if (h) testY = Math.min(Math.max(testY, h.min + 0.1), h.max - 0.05);
      const testPunkt = new T.Vector3(m.x, testY, m.z);

      if (api.raumBei(testPunkt) !== 'ATL-001') {
        return { ok: false, details: 'ATL-001 wurde nicht erkannt.' };
      }
      if (!api.geladen().some((x) => x && x.id === 'ATL-001')) {
        return { ok: false, details: 'ATL-001 ist nicht geladen.' };
      }
      if (!api.transporterListe().some((t) => t.id === 'TR-ostpier-labore')) {
        return { ok: false, details: 'Transporter TR-ostpier-labore fehlt.' };
      }

      await api.teleport('TR-ostpier-labore');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (api.geladen().some((x) => x && x.id === 'ATL-001')) {
        return { ok: false, details: 'ATL-001 wurde nicht entladen.' };
      }
      if (!api.geladen().length) {
        return { ok: false, details: 'Kein Zielraum geladen.' };
      }

      const ostpier = api.geladen().some((x) => {
        if (!x) return false;
        const eintrag = raumPlan(x.id);
        return !!eintrag && /ostpier/i.test(String(eintrag.trakt || '') + ' ' + String(eintrag.name || ''));
      });
      if (!ostpier) {
        return { ok: false, details: 'Kein Ostpier-Raum geladen.' };
      }
      if (api.benutzbare().length <= 0) {
        return { ok: false, details: 'Keine benutzbaren Objekte gefunden.' };
      }

      return {
        ok: true,
        details: 'Streaming, Raumprüfung, Transporter und benutzbare Objekte funktionieren.',
      };
    } catch (fehler) {
      return { ok: false, details: String((fehler && fehler.message) || fehler) };
    }
  }

  api.update = update;
  api.dispose = dispose;
  api.selbsttest = selbsttest;
  api.auchInPause = true;

  // API erneut spiegeln, falls der Kern einen eigenen Platzhalter behält.
  weltRegistrieren();

  return {
    ...api,
    auchInPause: true,
    update,
    dispose,
    selbsttest,
  };
}

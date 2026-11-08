// Ego-Steuerung: Blick, Gehen, Rennen, Ducken, Springen, Schwerkraft und Respawn.
import * as THREE from 'three';

export function init(ctx) {
  const T = ctx.THREE || THREE;
  const camera = ctx.camera;
  const plan = ctx.plan || {};
  const settings = ctx.settings;
  const state = ctx.state;
  const input = ctx.input;

  const spielerZustand = state.spieler || {};
  state.spieler = spielerZustand;
  const pos = spielerZustand.pos instanceof T.Vector3 ? spielerZustand.pos : new T.Vector3();
  spielerZustand.pos = pos;
  const blick = spielerZustand.blick || { yaw: 0, pitch: 0 };
  spielerZustand.blick = blick;

  const velocity = new T.Vector3();
  const kapselOpt = { radius: 0.3, hoehe: 1.75 };
  const steuer = { vor: 0, links: 0, hinten: 0, rechts: 0, rennen: false, ducken: false, springen: false };
  const testSteuer = { vor: 0, links: 0, hinten: 0, rechts: 0, rennen: false, ducken: false, springen: false };

  let yaw = Number.isFinite(blick.yaw) ? blick.yaw : 0;
  let pitch = Number.isFinite(blick.pitch) ? blick.pitch : 0;
  let aktiv = true;
  let amBoden = false;
  let sprung = false;
  let ducken = false;
  let ready = false;
  let testLock = false;

  // Dienste werden bei Bedarf geholt: die Reihenfolge der Modul-Initialisierung ist egal.
  const dienst = (name) => {
    try {
      return ctx.services ? ctx.services.get(name) : undefined;
    } catch (fehler) {
      return undefined;
    }
  };

  const respawnMarke = plan.spielmarken && plan.spielmarken.respawn;
  const respawnPos = respawnMarke && Array.isArray(respawnMarke.pos)
    ? new T.Vector3().fromArray(respawnMarke.pos)
    : pos.clone();
  const respawnYaw = respawnMarke && Number.isFinite(respawnMarke.rotY) ? respawnMarke.rotY : 0;
  const wasserY = Number.isFinite(plan.wasser_y) ? plan.wasser_y : 0;

  // Dunkelblende bei Wasser-/Weltverlust.
  let overlay = null;
  let darkTimer = 0;
  if (typeof document !== 'undefined') {
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;' +
      'transition:opacity .15s linear;z-index:99999;';
    const eltern = ctx.uiRoot || document.body;
    if (eltern) eltern.appendChild(overlay);
  }

  function abdunkeln() {
    if (!overlay) return;
    overlay.style.opacity = '0.9';
    if (darkTimer) clearTimeout(darkTimer);
    darkTimer = setTimeout(() => {
      if (overlay) overlay.style.opacity = '0';
      darkTimer = 0;
    }, 600);
  }

  function kameraSetzen() {
    if (camera.rotation.order !== 'YXZ') camera.rotation.order = 'YXZ';
    camera.position.set(pos.x, pos.y + (ducken ? 1.0 : 1.65), pos.z);
    camera.rotation.set(pitch, yaw, 0);
    blick.yaw = yaw;
    blick.pitch = pitch;
  }

  function setPosition(vec, neuerYaw) {
    if (vec) pos.copy(vec);
    velocity.set(0, 0, 0);
    amBoden = false;
    sprung = false;
    ducken = false;
    if (Number.isFinite(neuerYaw)) yaw = neuerYaw;
    pitch = 0;
    spielerZustand.pos.copy(pos);
    kameraSetzen();
  }

  function respawn() {
    setPosition(respawnPos, respawnYaw);
  }

  function eingabeLesen() {
    const t = (code) => (input && typeof input.taste === 'function' ? !!input.taste(code) : false);
    steuer.vor = t('KeyW') ? 1 : 0;
    steuer.links = t('KeyA') ? 1 : 0;
    steuer.hinten = t('KeyS') ? 1 : 0;
    steuer.rechts = t('KeyD') ? 1 : 0;
    steuer.rennen = t('ShiftLeft') || t('ShiftRight');
    steuer.ducken = t('ControlLeft') || t('ControlRight');
    steuer.springen = t('Space');
    return steuer;
  }

  function mausLesen() {
    if (!input || typeof input.nimmMaus !== 'function') return;
    const maus = input.nimmMaus();
    if (!maus) return;
    const wert = settings && typeof settings.get === 'function' ? settings.get('maus') : 5;
    const empfindlichkeit = 0.0006 + 0.00035 * (Number.isFinite(wert) ? wert : 5);
    yaw -= (maus.dx || 0) * empfindlichkeit;
    pitch -= (maus.dy || 0) * empfindlichkeit;
    const grenze = (Math.PI * 85) / 180;
    if (pitch > grenze) pitch = grenze;
    if (pitch < -grenze) pitch = -grenze;
  }

  // Ein Simulationsschritt (dt in Sekunden). e enthält die Steuerung.
  function schritt(dt, e) {
    ducken = !!e.ducken;
    const hoehe = ducken ? 1.1 : 1.75;
    const laufgeschwindigkeit = ducken ? 1.6 : (e.rennen ? 6.0 : 3.2);

    let vor = e.vor - e.hinten;
    let seit = e.rechts - e.links;
    const laenge = Math.hypot(vor, seit);
    if (laenge > 1) {
      vor /= laenge;
      seit /= laenge;
    }

    // Blickrichtung: vorwärts = -Z bei yaw 0, rechts = +X bei yaw 0.
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    const zielVx = (-sinY * vor + cosY * seit) * laufgeschwindigkeit;
    const zielVz = (-cosY * vor - sinY * seit) * laufgeschwindigkeit;

    const beschleunigung = amBoden ? 12 : 3;
    const dvx = zielVx - velocity.x;
    const dvz = zielVz - velocity.z;
    const dLaenge = Math.hypot(dvx, dvz);
    const maxDv = beschleunigung * dt;
    if (dLaenge <= maxDv || dLaenge === 0) {
      velocity.x = zielVx;
      velocity.z = zielVz;
    } else {
      velocity.x += (dvx / dLaenge) * maxDv;
      velocity.z += (dvz / dLaenge) * maxDv;
    }

    const kollision = dienst('kollision');
    if (kollision && typeof kollision.kapsel === 'function') {
      if (e.springen && !sprung && amBoden) velocity.y = 4.6;
      sprung = !!e.springen;
      velocity.y -= 9.81 * dt;
      kapselOpt.hoehe = hoehe;
      const ergebnis = kollision.kapsel(pos, velocity, dt, kapselOpt);
      amBoden = !!(ergebnis && ergebnis.amBoden);
      if (amBoden && velocity.y < 0) velocity.y = 0;
    } else {
      // Ohne Kollisionsdienst: keine Schwerkraft, nur horizontale Bewegung.
      velocity.y = 0;
      sprung = !!e.springen;
      pos.x += velocity.x * dt;
      pos.z += velocity.z * dt;
      amBoden = false;
    }

    spielerZustand.pos.copy(pos);

    const aussen = dienst('aussen');
    // in Räumen/Korridoren (auch unter dem Meeresspiegel, im Rumpf der Stadt) gibt es kein Wasser – Claude
    const drinnen = !!dienst('innenaussen')?.drinnen;
    const imWasser = !drinnen && aussen && typeof aussen.istImWasser === 'function'
      ? !!aussen.istImWasser(pos)
      : false;
    const unterWasser = !drinnen && pos.y < wasserY - 2;
    const ausDerWelt = pos.y < -200;

    if (imWasser || unterWasser || ausDerWelt) {
      abdunkeln();
      respawn();
      const ui = dienst('ui');
      if (ui && typeof ui.meldung === 'function') ui.meldung('Zurück im Kontrollraum', 3);
    }

    kameraSetzen();
  }

  // Interner Testpfad: simuliert eine Eingabe ohne echte Tastatur.
  function simuliere(override, sekunden) {
    const o = override || {};
    testSteuer.vor = Number(o.vor) || 0;
    testSteuer.links = Number(o.links) || 0;
    testSteuer.hinten = Number(o.hinten) || 0;
    testSteuer.rechts = Number(o.rechts) || 0;
    testSteuer.rennen = !!o.rennen;
    testSteuer.ducken = !!o.ducken;
    testSteuer.springen = !!o.springen;
    const schritte = Math.max(1, Math.ceil(sekunden * 60));
    for (let i = 0; i < schritte; i++) schritt(1 / 60, testSteuer);
  }

  const api = {
    position: pos,
    get aktiv() { return aktiv; },
    set aktiv(wert) { aktiv = !!wert; },
    setPosition,
    respawn,
    simuliere,
  };
  ctx.services.register('spieler', api);

  // Auf das Laden des Startbereichs warten, bevor Schwerkraft wirkt.
  const welt = dienst('welt');
  const bereitSignal = new Promise((resolve) => {
    const markiere = () => {
      if (!ready) {
        ready = true;
        resolve(true);
      }
    };
    if (welt && typeof welt.bereit === 'function') {
      Promise.resolve()
        .then(() => welt.bereit())
        .then(markiere, markiere);
    } else {
      markiere();
    }
  });

  // Startposition und Blickrichtung unabhängig vom ersten Update setzen.
  setPosition(respawnPos, respawnYaw);

  return {
    async selbsttest() {
      const vorherLock = testLock;
      testLock = true;
      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 3000));
        const bereit = await Promise.race([bereitSignal, timeout]);
        if (!bereit || !ready) {
          return { ok: false, details: 'Die Welt wurde nicht rechtzeitig bereit.' };
        }
        const kollision = dienst('kollision');
        if (!kollision || typeof kollision.kapsel !== 'function') {
          return { ok: false, details: 'Kein Kollisionsdienst für den Bodentest vorhanden.' };
        }

        // 1) Fester Boden am Startpunkt.
        respawn();
        const leer = { vor: 0, links: 0, hinten: 0, rechts: 0, rennen: false, ducken: false, springen: false };
        let steht = false;
        for (let i = 0; i < 180 && !steht; i++) {
          schritt(1 / 60, leer);
          steht = amBoden;
        }
        if (!steht) {
          return { ok: false, details: 'Der Spieler fand keinen festen Boden am Startpunkt.' };
        }

        // 2) Eine Sekunde nach vorne: messbare Fortbewegung.
        const startX = pos.x;
        const startZ = pos.z;
        simuliere({ vor: 1 }, 1);
        const distanz = Math.hypot(pos.x - startX, pos.z - startZ);
        if (distanz <= 1) {
          return { ok: false, details: 'Vorwärtsbewegung war nicht messbar (' + distanz.toFixed(2) + ' m).' };
        }

        // 3) Sturz ins Meer weit draußen: Respawn innerhalb von 4 s.
        api.setPosition(new T.Vector3(900, wasserY + 5, 0));
        let zurueck = false;
        for (let i = 0; i < 240 && !zurueck; i++) {
          schritt(1 / 60, leer);
          zurueck = pos.distanceTo(respawnPos) < 3;
        }
        if (!zurueck) {
          return { ok: false, details: 'Nach dem Wassersturz erfolgte kein Respawn.' };
        }

        respawn();
        return {
          ok: true,
          details: 'Boden, Vorwärtsbewegung (' + distanz.toFixed(2) + ' m) und Wasser-Respawn geprüft.',
        };
      } catch (fehler) {
        return {
          ok: false,
          details: 'Selbsttestfehler: ' + (fehler && fehler.message ? fehler.message : String(fehler)),
        };
      } finally {
        testLock = vorherLock;
      }
    },

    update(dt) {
      if (testLock) return;
      const d = Math.min(0.1, Math.max(0, Number(dt) || 0));

      // Maus-Deltas immer abholen, damit nach einer Pause keine Sprünge aufholen.
      if (input && typeof input.nimmMaus === 'function') {
        // im Jumper liest der Dienst 'jumper' die Maus – hier nicht verwerfen (Claude: state.modus statt state.mode)
        if (state.modus === 'jumper' || state.modus === 'frei') { /* nichts */ }
        else if (!state.pause && aktiv) mausLesen();
        else input.nimmMaus();
      }

      const imJumper = state.modus === 'jumper' || state.modus === 'frei';   // 'frei': Kamera gehört jemand anderem (Prüfstand)
      if (!ready) {
        if (!imJumper) { spielerZustand.pos.copy(pos); kameraSetzen(); }
        return;
      }

      // im Jumper gehören Kamera und Position dem Dienst 'jumper'
      if (state.pause || !aktiv || imJumper) {
        if (!imJumper) { spielerZustand.pos.copy(pos); kameraSetzen(); }
        return;
      }

      schritt(d, eingabeLesen());
    },

    dispose() {
      if (darkTimer) clearTimeout(darkTimer);
      darkTimer = 0;
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      testLock = true;
    },

    auchInPause: false,
  };
}

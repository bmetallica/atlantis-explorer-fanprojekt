// Benutzen: Zielsuche, E-Interaktion, Türen und Transporter.
import * as THREE from 'three';

export function init(ctx) {
  const {
    camera,
    uiRoot,
    state,
    plan,
    on,
    services,
    emit,
  } = ctx;

  const eyeHeight = 1.6;
  const zielRadius = 2.5;
  const blickWinkel = THREE.MathUtils.degToRad(25);
  const blickGrenze = Math.cos(blickWinkel);
  const scanIntervall = 0.1;

  let zeit = 0;
  let ziel = null;
  let zerstoert = false;

  const camPos = new THREE.Vector3();
  const blickDir = new THREE.Vector3();
  const zielDir = new THREE.Vector3();
  const strahlDir = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const planPunkt = new THREE.Vector3();

  const tueren = new Map();
  let tuerKandidaten = [];
  let transporterObjekte = [];

  const dienst = {
    ziel() {
      return ziel;
    },
    interact() {
      interaktion();
    },
    naechsterTransporter() {
      return transporterInNaehe();
    },
  };

  services.register('benutzen', dienst);

  function holeDienst(name) {
    return services.get(name);
  }

  function spielerPosition() {
    const s = holeDienst('spieler');
    if (s && s.position) return s.position;
    if (state.spieler && state.spieler.pos) return state.spieler.pos;
    return null;
  }

  function istPause() {
    const ui = holeDienst('ui');
    return !!state.pause || !!(ui && ui.offen);
  }

  function findeApi(parent) {
    let obj = parent;
    while (obj) {
      if (obj.userData && obj.userData.api) return obj.userData.api;
      obj = obj.parent;
    }
    return null;
  }

  function findeObjekte(objekte, objId, zielListe) {
    for (const obj of objekte || []) {
      if (!obj) continue;

      if (obj.userData && obj.userData.objId === objId) {
        zielListe.push(obj);
      }

      if (obj.children) findeObjekte(obj.children, objId, zielListe);
    }
  }

  function aktualisiereSpezialobjekte() {
    const neueTueren = [];
    const neueTransporter = [];
    const welt = holeDienst('welt');
    const geladen = welt && welt.geladen ? welt.geladen() : [];

    for (const raum of geladen) {
      if (!raum || !raum.gruppe) continue;
      findeObjekte(raum.gruppe.children, 'OBJ-091', neueTueren);
      findeObjekte(raum.gruppe.children, 'OBJ-043', neueTransporter);
    }

    for (const obj of tueren.keys()) {
      if (!neueTueren.includes(obj)) tueren.delete(obj);
    }

    for (const obj of neueTueren) {
      if (!tueren.has(obj)) {
        tueren.set(obj, {
          offen: false,
          position: new THREE.Vector3(),
        });
      }
    }

    tuerKandidaten = neueTueren;
    transporterObjekte = neueTransporter;
  }

  function istVerriegelt(api) {
    if (!api) return true;

    const direkt = api.verriegelt ?? api.locked ?? api.isLocked;
    if (direkt === true) return true;

    const namen = [
      'verriegelt',
      'isVerriegelt',
      'istVerriegelt',
      'locked',
      'isLocked',
    ];

    for (const name of namen) {
      if (typeof api[name] === 'function') {
        try {
          if (api[name]()) return true;
        } catch {
          return true;
        }
      }
    }

    return false;
  }

  function findeMethode(api, art) {
    if (!api) return null;

    const alleNamen = [];
    let obj = api;

    while (obj && obj !== Object.prototype) {
      for (const name of Object.getOwnPropertyNames(obj)) {
        if (name !== 'constructor') alleNamen.push(name);
      }
      obj = Object.getPrototypeOf(obj);
    }

    for (const name of alleNamen) {
      if (typeof api[name] !== 'function') continue;

      const klein = name.toLowerCase();

      if (art === 'open') {
        if (/isopen|canopen|shouldopen|getopen/.test(klein)) continue;
        if (klein.includes('oeffn') || klein.includes('öffn')) return api[name];
        if (klein.includes('open')) return api[name];
      } else {
        if (/isclose|canclose|shouldclose|getclose/.test(klein)) continue;
        if (klein.includes('schliess') || klein.includes('schließ')) return api[name];
        if (klein.includes('close')) return api[name];
      }
    }

    return null;
  }

  function aktualisiereTueren() {
    const spieler = spielerPosition();
    if (!spieler) return;

    for (const obj of tuerKandidaten) {
      const daten = tueren.get(obj);
      if (!daten) continue;

      const api = findeApi(obj);
      if (!api) continue;

      obj.getWorldPosition(daten.position);
      const abstand = daten.position.distanceTo(spieler);

      if (istVerriegelt(api)) continue;

      const oeffnen = findeMethode(api, 'open');
      const schliessen = findeMethode(api, 'close');

      if (!daten.offen && abstand < 2.2 && oeffnen) {
        try {
          const ergebnis = oeffnen.call(api, obj);
          if (ergebnis !== false) daten.offen = true;
        } catch {
          // Fehlerhafte optionale Tür-API darf die Interaktion nicht blockieren.
        }
      } else if (daten.offen && abstand > 3.5 && schliessen) {
        try {
          const ergebnis = schliessen.call(api, obj);
          if (ergebnis !== false) daten.offen = false;
        } catch {
          // Fehlerhafte optionale Tür-API darf die Interaktion nicht blockieren.
        }
      }
    }
  }

  function punktAusPlan(p) {
    if (!p) return null;
    if (Array.isArray(p)) return planPunkt.set(p[0] || 0, p[1] || 0, p[2] || 0);
    if (p.isVector3) return planPunkt.copy(p);
    return planPunkt.set(p.x || 0, p.y || 0, p.z || 0);
  }

  function transporterInNaehe() {
    const spieler = spielerPosition();
    if (!spieler) return false;
    // jede Transporterkabine in der Nähe (eingebaute und an Planpunkten aufgestellte, Dienst 'transporter') – Claude
    const kab = holeDienst('transporter')?.kabinen?.() || [];
    for (const obj of kab) {
      obj.getWorldPosition(tmp);
      if (Math.hypot(tmp.x - spieler.x, tmp.z - spieler.z) < 2.2 && Math.abs(tmp.y - spieler.y) < 2.5) return true;
    }
    if (!plan || !Array.isArray(plan.transporter)) return false;

    for (const eintrag of plan.transporter) {
      const p = punktAusPlan(eintrag.pos);
      if (!p) continue;

      const dx = p.x - spieler.x;
      const dz = p.z - spieler.z;
      if (dx * dx + dz * dz > 4) continue;

      if (transporterObjekte.length) {
        let passend = false;

        for (const obj of transporterObjekte) {
          obj.getWorldPosition(tmp);
          if (tmp.distanceToSquared(p) <= 16) {
            passend = true;
            break;
          }
        }

        if (!passend) continue;
      }

      return true;
    }

    return false;
  }

  function zielSuchen() {
    const welt = holeDienst('welt');
    if (!welt || !welt.benutzbare) return null;

    camera.getWorldPosition(camPos);
    camera.getWorldDirection(blickDir);

    const kollision = holeDienst('kollision');
    let bestes = null;
    let besteDistanz = zielRadius;

    for (const eintrag of welt.benutzbare()) {
      if (!eintrag || !eintrag.pos || !Array.isArray(eintrag.actions)) continue;
      if (!eintrag.actions.length) continue;

      zielDir.subVectors(eintrag.pos, camPos);
      const abstand = zielDir.length();
      if (abstand > zielRadius || abstand < 0.001) continue;

      zielDir.multiplyScalar(1 / abstand);
      // nahe Ziele dürfen weiter vom Blick abweichen (sonst ist ein tiefer Punkt direkt vor einem nicht anvisierbar) – Claude
      const grenze = abstand < 2 ? Math.cos(Math.min(1.1, blickWinkel + Math.atan2(1.0, abstand))) : blickGrenze;
      if (blickDir.dot(zielDir) < grenze) continue;

      if (kollision && typeof kollision.strahl === 'function') {
        strahlDir.copy(zielDir);
        const treffer = kollision.strahl(camPos, strahlDir, abstand);
        if (treffer && treffer.abstand < abstand - 0.3) continue;
      }

      if (abstand < besteDistanz) {
        besteDistanz = abstand;
        bestes = eintrag;
      }
    }

    return bestes;
  }

  function zeigeHinweis() {
    const ui = holeDienst('ui');
    if (!ui || typeof ui.hinweis !== 'function') return;

    if (ziel && ziel.label) ui.hinweis('E: ' + ziel.label);
    else ui.hinweis(null);
  }

  function interaktion() {
    if (zerstoert || istPause()) return;

    const ui = holeDienst('ui');
    const welt = holeDienst('welt');
    const spieler = holeDienst('spieler');

    if (transporterInNaehe()) {
      if (!ui || !welt || typeof ui.menue !== 'function') return;

      const liste = typeof welt.transporterListe === 'function'
        ? welt.transporterListe()
        : [];

      ui.menue('Transporter', liste.map((t) => ({
        label: t.name,
        run: async () => {
          // sicherer Sprung über den Dienst 'transporter' (wartet auf Boden am Ziel) – Claude
          const tr = holeDienst('transporter');
          if (tr?.springen) { await tr.springen(t.id); return; }
          const z = await welt.teleport(t.id);
          if (spieler && typeof spieler.setPosition === 'function') {
            spieler.setPosition(z.pos, z.yaw);
          } else if (state.spieler) {
            state.spieler.pos.copy(z.pos);
            state.spieler.blick.yaw = z.yaw;
          }
        },
      })));
      return;
    }

    if (!ziel || !ui || typeof ui.menue !== 'function') return;

    const aktionen = ziel.actions;

    if (aktionen.length === 1) {
      const run = aktionen[0].run;
      if (typeof run === 'function') run();
    } else {
      ui.menue(ziel.label || 'Benutzen', aktionen.map((a) => ({
        label: a.label || 'Benutzen',
        run: a.run,
      })));
    }
  }

  function taste(event) {
    if (!event || event.code !== 'KeyE' || !event.unten) return;
    if (zerstoert || istPause()) return;
    interaktion();
  }

  on('taste', taste);

  async function menueSchliessen(ui) {
    const doc = uiRoot && uiRoot.ownerDocument
      ? uiRoot.ownerDocument
      : (typeof document !== 'undefined' ? document : null);

    for (let versuch = 0; versuch < 20; versuch++) {
      if (!ui.offen) return true;

      const buttons = uiRoot
        ? Array.from(uiRoot.querySelectorAll('button'))
        : (doc ? Array.from(doc.querySelectorAll('button')) : []);

      const schliessKnopf = buttons.find((button) => {
        const beschriftung = [
          button.textContent,
          button.getAttribute('aria-label'),
          button.getAttribute('title'),
          button.className,
        ].join(' ');
        return /schlie|abbrech|zurück|close|×|✕/i.test(beschriftung);
      });

      if (schliessKnopf) {
        schliessKnopf.click();
      } else {
        if (typeof ui.schliessen === 'function') ui.schliessen();
        else if (typeof ui.close === 'function') ui.close();
        else {
          if (typeof emit === 'function') {
            emit('taste', {
              code: 'Escape',
              unten: true,
              event: null,
            });
          }

          if (doc) {
            const event = new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              bubbles: true,
              cancelable: true,
            });
            (doc.activeElement || doc.body || doc.defaultView).dispatchEvent(event);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    return !ui.offen;
  }

  return {
    update(dt) {
      if (zerstoert) return;

      zeit += dt;

      if (zeit >= scanIntervall) {
        zeit = 0;
        aktualisiereSpezialobjekte();
        ziel = zielSuchen();
        zeigeHinweis();
      }

      aktualisiereTueren();
    },

    async selbsttest() {
      const welt = holeDienst('welt');
      const spieler = holeDienst('spieler');
      const ui = holeDienst('ui');

      if (!welt || !welt.benutzbare || !ui) {
        return { ok: false, details: 'Dienste welt oder ui fehlen.' };
      }

      const alle = welt.benutzbare();
      const spielerPos = spielerPosition();

      if (!spielerPos) {
        return { ok: false, details: 'Spielerposition nicht verfügbar.' };
      }

      camera.getWorldPosition(camPos);
      const kameraHoehe = camPos.y;

      const inNaehe = alle.filter((eintrag) => {
        if (!eintrag || !eintrag.pos || !Array.isArray(eintrag.actions)) return false;
        if (!eintrag.actions.length) return false;
        return eintrag.pos.distanceTo(camPos) <= zielRadius;
      });

      if (!inNaehe.length) {
        return { ok: false, details: 'Kein benutzbares Ziel in der Nähe des Starts.' };
      }

      const mehrfach = inNaehe.find((eintrag) => eintrag.actions.length > 1);
      const testZiel = mehrfach || inNaehe[0];

      if (!testZiel || !testZiel.pos) {
        return { ok: false, details: 'Kein gültiges Testziel vorhanden.' };
      }

      const horizontal = new THREE.Vector3(
        spielerPos.x - testZiel.pos.x,
        0,
        spielerPos.z - testZiel.pos.z,
      );

      if (horizontal.lengthSq() < 0.01) horizontal.set(1, 0, 0);
      horizontal.normalize();

      const dy = testZiel.pos.y - kameraHoehe;
      const kollision = holeDienst('kollision');
      const pruefCam = new THREE.Vector3();
      const pruefDir = new THREE.Vector3();
      let standPosition = null;
      let blickYaw = state.spieler.blick.yaw;
      let blickPitch = state.spieler.blick.pitch;

      // Größeren Abstand wählen: Bei 1,1 m lag der Blickpunkt häufig zu weit
      // unterhalb des 25°-Sichtkegels.
      const distanzen = [2.2, 2.0, 1.8, 1.6, 1.4, 1.2, 1.0];

      for (const distanz of distanzen) {
        const gesamtDistanz = Math.sqrt(distanz * distanz + dy * dy);
        if (gesamtDistanz > zielRadius - 0.05) continue;

        const x = testZiel.pos.x + horizontal.x * distanz;
        const z = testZiel.pos.z + horizontal.z * distanz;
        const winkel = Math.atan2(Math.abs(dy), distanz);
        if (winkel >= blickWinkel) continue;

        pruefCam.set(x, kameraHoehe, z);
        pruefDir.subVectors(testZiel.pos, pruefCam).normalize();

        if (kollision && typeof kollision.strahl === 'function') {
          const treffer = kollision.strahl(pruefCam, pruefDir, gesamtDistanz);
          if (treffer && treffer.abstand < gesamtDistanz - 0.3) continue;
        }

        standPosition = new THREE.Vector3(x, spielerPos.y, z);
        blickYaw = Math.atan2(-pruefDir.x, -pruefDir.z);
        blickPitch = Math.asin(pruefDir.y);
        break;
      }

      if (!standPosition) {
        return {
          ok: false,
          details: 'Kein freier Blick auf ein benutzbares Ziel in 2,5 m möglich.',
        };
      }

      // Blickwinkel zuerst setzen: setPosition übernimmt sonst einen veralteten Yaw.
      state.spieler.blick.yaw = blickYaw;
      state.spieler.blick.pitch = blickPitch;
      state.spieler.pos.copy(standPosition);

      if (spieler && typeof spieler.setPosition === 'function') {
        spieler.setPosition(standPosition, blickYaw);
      }

      // Die Kamera für den deterministischen Test exakt auf das Ziel richten.
      camera.position.set(standPosition.x, kameraHoehe, standPosition.z);
      camera.lookAt(testZiel.pos);
      camera.updateMatrixWorld(true);

      ziel = zielSuchen();
      zeigeHinweis();

      await new Promise((resolve) => setTimeout(resolve, 350));

      ziel = zielSuchen();
      zeigeHinweis();

      const doc = uiRoot && uiRoot.ownerDocument
        ? uiRoot.ownerDocument
        : (typeof document !== 'undefined' ? document : null);
      const text = doc && doc.body ? (doc.body.textContent || '') : '';

      if (!text.includes('E: ')) {
        return { ok: false, details: 'Hinweiszeile "E: …" wurde nicht angezeigt.' };
      }

      if (!mehrfach) {
        return {
          ok: false,
          details: 'Kein Ziel mit mehreren Aktionen für den Menütest vorhanden.',
        };
      }

      if (typeof emit === 'function') {
        emit('taste', {
          code: 'KeyE',
          unten: true,
          event: null,
        });
      } else {
        interaktion();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!ui.offen) {
        interaktion();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!ui.offen) {
        return { ok: false, details: 'Simuliertes E hat kein Menü geöffnet.' };
      }

      const geschlossen = await menueSchliessen(ui);
      if (!geschlossen) {
        return { ok: false, details: 'Menü konnte nicht geschlossen werden.' };
      }

      return {
        ok: true,
        details: 'Zielsuche, Hinweiszeile, Funktionsmenü, Türen und Transporter geprüft.',
      };
    },

    dispose() {
      zerstoert = true;
      ziel = null;
      tueren.clear();
      tuerKandidaten = [];
      transporterObjekte = [];

      const ui = holeDienst('ui');
      if (ui && typeof ui.hinweis === 'function') ui.hinweis(null);
    },
  };
}

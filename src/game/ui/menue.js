// HTML/CSS-Oberfläche: HUD, Auswahlmenüs, Pausenmenü und Einstellungen.

export function init(ctx) {
  const { uiRoot, canvas, state, input, settings } = ctx;

  uiRoot.classList.add('atl-ui');
  const stil = document.createElement('style');
  stil.textContent = `
    .atl-ui, .atl-ui * { box-sizing: border-box; }
    .atl-ui {
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #dce8f5; z-index: 20;
    }
    /* Autorenregeln dürfen das hidden-Attribut nicht überschreiben. */
    .atl-ui [hidden] { display: none !important; }
    .atl-ui .atl-fadenkreuz {
      position: absolute; left: 50%; top: 50%;
      width: 14px; height: 14px; transform: translate(-50%, -50%);
      opacity: .72; pointer-events: none;
    }
    .atl-ui .atl-fadenkreuz::before, .atl-ui .atl-fadenkreuz::after {
      content: ""; position: absolute; background: #b9d9f7;
      box-shadow: 0 0 2px #07111d;
    }
    .atl-ui .atl-fadenkreuz::before { left: 6px; top: 1px; width: 2px; height: 12px; }
    .atl-ui .atl-fadenkreuz::after { left: 1px; top: 6px; width: 12px; height: 2px; }
    .atl-ui .atl-hinweis {
      position: absolute; left: 50%; bottom: 34px;
      transform: translateX(-50%); max-width: 90%;
      padding: 7px 14px; background: rgba(10,16,24,.86);
      border: 1px solid #2c4057; color: #dce8f5;
      font-size: 14px; text-align: center; white-space: pre-line;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
      pointer-events: none; opacity: 1; transition: opacity .18s ease;
    }
    .atl-ui .atl-hinweis.unsichtbar { opacity: 0; }
    .atl-ui .atl-meldungen {
      position: absolute; left: 50%; top: 18px; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      width: min(560px, 90%); pointer-events: none;
    }
    .atl-ui .atl-meldung {
      padding: 7px 13px; background: rgba(10,16,24,.86);
      border: 1px solid #2c4057; border-left: 2px solid #4da3ff;
      color: #e5f1ff; font-size: 14px; text-align: center;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
      transition: opacity .2s linear;
    }
    .atl-ui .atl-fps {
      position: absolute; right: 12px; top: 10px; padding: 3px 7px;
      background: rgba(10,16,24,.72); border: 1px solid #2c4057;
      color: #b8d7f5; font: 12px ui-monospace, monospace;
    }
    .atl-ui .atl-menue {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(4,9,15,.48); pointer-events: auto;
    }
    .atl-ui .atl-panel {
      width: min(460px, calc(100% - 32px)); max-height: calc(100% - 32px);
      overflow: auto; padding: 24px 26px;
      background: rgba(10,16,24,.92); border: 1px solid #2c4057;
      box-shadow: 0 12px 45px rgba(0,0,0,.48);
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    }
    .atl-ui .atl-panel h2 {
      margin: 0 0 18px; color: #78b9ff; font-size: 24px; font-weight: 500;
      letter-spacing: .08em; text-align: center;
    }
    .atl-ui .atl-panel h3 {
      margin: 18px 0 8px; color: #a9d1f6; font-size: 15px; font-weight: 500;
    }
    .atl-ui .atl-option, .atl-ui .atl-knopf {
      display: block; width: 100%; margin: 6px 0; padding: 10px 12px;
      border: 1px solid #2c4057; background: rgba(20,32,47,.72);
      color: #dce8f5; text-align: left; font: inherit; cursor: pointer;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
    }
    .atl-ui .atl-option:hover, .atl-ui .atl-knopf:hover,
    .atl-ui .atl-option:focus, .atl-ui .atl-knopf:focus {
      border-color: #4da3ff; background: rgba(35,70,108,.78); color: #fff;
      outline: none;
    }
    .atl-ui .atl-nummer { display: inline-block; width: 24px; color: #4da3ff; }
    .atl-ui .atl-regler {
      display: grid; grid-template-columns: 1fr 145px 48px;
      align-items: center; gap: 10px; margin: 9px 0;
      font-size: 14px;
    }
    .atl-ui .atl-regler input[type=range] { width: 100%; accent-color: #4da3ff; }
    .atl-ui .atl-regler select {
      width: 100%; background: rgba(20,32,47,.9); color: #dce8f5;
      border: 1px solid #2c4057; padding: 4px 6px; font: inherit; accent-color: #4da3ff;
    }
    .atl-ui .atl-wert { color: #83c1ff; text-align: right; font-variant-numeric: tabular-nums; }
    .atl-ui .atl-check { display: flex; align-items: center; gap: 9px; margin: 13px 0; font-size: 14px; }
    .atl-ui .atl-check input { accent-color: #4da3ff; }
    .atl-ui .atl-hinweis-text { color: #9eb5ca; font-size: 12px; margin: 8px 0 14px; }
    .atl-ui .atl-steuerung { margin: 0; padding: 0; list-style: none; color: #c3d5e7; line-height: 1.8; font-size: 14px; }
    .atl-ui .atl-steuerung b { color: #78b9ff; font-weight: 500; }
    .atl-ui .atl-zurueck { margin-top: 15px; }
  `;
  uiRoot.appendChild(stil);

  // HUD
  const fadenkreuz = document.createElement('div');
  fadenkreuz.className = 'atl-fadenkreuz';
  uiRoot.appendChild(fadenkreuz);

  const hinweisEl = document.createElement('div');
  hinweisEl.className = 'atl-hinweis';
  hinweisEl.hidden = true;
  uiRoot.appendChild(hinweisEl);

  const meldungenEl = document.createElement('div');
  meldungenEl.className = 'atl-meldungen';
  uiRoot.appendChild(meldungenEl);

  const fpsEl = document.createElement('div');
  fpsEl.className = 'atl-fps';
  fpsEl.hidden = true;
  uiRoot.appendChild(fpsEl);

  // Menüstruktur
  const menuEl = document.createElement('div');
  menuEl.className = 'atl-menue';
  menuEl.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'atl-panel';
  menuEl.appendChild(panel);
  uiRoot.appendChild(menuEl);

  const views = {};
  for (const name of ['auswahl', 'pause', 'einstellungen', 'steuerung']) {
    const view = document.createElement('div');
    view.hidden = true;
    panel.appendChild(view);
    views[name] = view;
  }

  let menuOffen = false;
  let aktiveAnsicht = '';
  let auswahlOptionen = [];
  let auswahlButtons = [];
  let hinweisText = null;
  let fpsWert = 0;
  const sliderElemente = new Map();
  const wertElemente = new Map();
  const meldungen = [];
  let stufeAuswahl = null;
  let stufeWert = null;
  let fpsSchalter = null;

  function sichtbareAnsicht(name) {
    aktiveAnsicht = name;
    for (const [key, view] of Object.entries(views)) view.hidden = key !== name;
  }

  function aktualisiereWert(key) {
    const eingabe = sliderElemente.get(key);
    const ausgabe = wertElemente.get(key);
    if (!eingabe || !ausgabe) return;
    const wert = settings.get(key);
    if (wert !== undefined && wert !== null) eingabe.value = String(wert);
    ausgabe.textContent = eingabe.value;
  }

  // Expliziter Hinweis hat Vorrang und bleibt auch bei Pause sichtbar.
  function setzeHinweis(text) {
    hinweisText = text === null || text === undefined ? null : String(text);
    hudHinweis();
  }

  function zeigeHinweis(visible, text) {
    if (!visible) {
      hinweisEl.hidden = true;
      hinweisEl.classList.add('unsichtbar');
      hinweisEl.textContent = '';
      return;
    }
    hinweisEl.textContent = text;
    hinweisEl.classList.remove('unsichtbar');
    hinweisEl.hidden = false;
  }

  function hudHinweis() {
    if (hinweisText !== null) {
      zeigeHinweis(true, hinweisText);
      return;
    }
    zeigeHinweis(false);
    if (menuOffen || state.pause || ctx.test) return;
    const gesperrt = input.maus && input.maus.gesperrt;
    if (!gesperrt) zeigeHinweis(true, 'Klicken zum Spielen');
  }

  function meldung(text, sekunden) {
    const dauer = Math.max(0.1, Number(sekunden) || 3);
    const el = document.createElement('div');
    el.className = 'atl-meldung';
    el.textContent = String(text);
    meldungenEl.appendChild(el);
    meldungen.push({ el, rest: dauer, gesamt: dauer });
    while (meldungen.length > 6) {
      const alt = meldungen.shift();
      alt.el.remove();
    }
  }

  function schliesseMenue() {
    menuOffen = false;
    menuEl.hidden = true;
    auswahlOptionen = [];
    auswahlButtons = [];
    for (const view of Object.values(views)) view.hidden = true;
    aktiveAnsicht = '';
    state.pause = false;
    hudHinweis();
  }

  function oeffneAuswahl(titel, optionen) {
    menuOffen = true;
    state.pause = true;
    input.freigeben();
    auswahlOptionen = Array.isArray(optionen) ? optionen : [];
    auswahlButtons = [];
    const view = views.auswahl;
    view.replaceChildren();

    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = String(titel || 'Auswahl');
    view.appendChild(ueberschrift);

    const liste = document.createElement('div');
    view.appendChild(liste);
    // alle Einträge zeigen (Liste scrollt); Tasten 1–9 und 0 (= 10.) wählen direkt – Claude
    auswahlOptionen.forEach((option, index) => {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'atl-option';
      const nummer = document.createElement('span');
      nummer.className = 'atl-nummer';
      nummer.textContent = index < 9 ? `${index + 1}.` : index === 9 ? '0.' : '·';
      const text = document.createElement('span');
      text.textContent = String(option && option.label != null ? option.label : option);
      knopf.append(nummer, text);
      knopf.addEventListener('click', () => {
        const funktion = option && typeof option.run === 'function' ? option.run : null;
        schliesseMenue();
        if (funktion) {
          try { funktion(); } catch (fehler) { console.error(fehler); }
        }
      });
      liste.appendChild(knopf);
      auswahlButtons.push(knopf);
    });


    sichtbareAnsicht('auswahl');
    menuEl.hidden = false;
    hudHinweis();
  }

  function knopf(parent, text, aktion) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'atl-knopf';
    el.textContent = text;
    el.addEventListener('click', aktion);
    parent.appendChild(el);
    return el;
  }

  function zeigePause() {
    menuOffen = true;
    state.pause = true;
    input.freigeben();
    const view = views.pause;
    view.replaceChildren();
    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = 'Atlantis';
    view.appendChild(ueberschrift);
    knopf(view, 'Weiter', () => {
      schliesseMenue();
      input.sperren();
    });
    knopf(view, 'Einstellungen', () => zeigeEinstellungen());
    knopf(view, 'Steuerung', () => zeigeSteuerung());
    knopf(view, 'Info & Credits', () => zeigeCredits());
    sichtbareAnsicht('pause');
    menuEl.hidden = false;
    hudHinweis();
  }

  function regler(parent, key, label, min, max, step) {
    const zeile = document.createElement('label');
    zeile.className = 'atl-regler';
    const text = document.createElement('span');
    text.textContent = label;
    const eingabe = document.createElement('input');
    eingabe.type = 'range';
    eingabe.min = String(min);
    eingabe.max = String(max);
    eingabe.step = String(step);
    eingabe.dataset.setting = key;
    eingabe.value = String(settings.get(key) ?? min);
    const ausgabe = document.createElement('span');
    ausgabe.className = 'atl-wert';
    zeile.append(text, eingabe, ausgabe);
    parent.appendChild(zeile);
    sliderElemente.set(key, eingabe);
    wertElemente.set(key, ausgabe);
    eingabe.addEventListener('input', () => {
      const wert = Number(eingabe.value);
      settings.set(key, wert);
      ausgabe.textContent = eingabe.value;
    });
    aktualisiereWert(key);
  }

  function zeigeEinstellungen() {
    menuOffen = true;
    state.pause = true;
    input.freigeben();
    const view = views.einstellungen;
    view.replaceChildren();
    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = 'Einstellungen';
    view.appendChild(ueberschrift);

    regler(view, 'hell', 'Helligkeit', 1, 10, 1);
    regler(view, 'glow', 'Leuchteffekte', 1, 10, 1);
    regler(view, 'maus', 'Mausempfindlichkeit', 1, 10, 1);
    regler(view, 'fov', 'Sichtfeld', 50, 100, 5);
    regler(view, 'ton', 'Lautstärke', 0, 10, 1);

    const stufeZeile = document.createElement('div');
    stufeZeile.className = 'atl-regler';
    const stufeText = document.createElement('span');
    stufeText.textContent = 'Grafikstufe';
    stufeAuswahl = document.createElement('select');
    stufeAuswahl.dataset.setting = 'stufe';
    for (const wert of ['hoch', 'niedrig']) {
      const option = document.createElement('option');
      option.value = wert;
      option.textContent = wert === 'hoch' ? 'Hoch' : 'Niedrig';
      stufeAuswahl.appendChild(option);
    }
    stufeAuswahl.value = String(settings.get('stufe') || 'hoch');
    stufeWert = document.createElement('span');
    stufeWert.className = 'atl-wert';
    stufeWert.textContent = stufeAuswahl.value === 'hoch' ? 'Hoch' : 'Niedrig';
    stufeAuswahl.addEventListener('change', () => {
      settings.set('stufe', stufeAuswahl.value);
      stufeWert.textContent = stufeAuswahl.value === 'hoch' ? 'Hoch' : 'Niedrig';
    });
    stufeZeile.append(stufeText, stufeAuswahl, stufeWert);
    view.appendChild(stufeZeile);

    const hinweis = document.createElement('p');
    hinweis.className = 'atl-hinweis-text';
    hinweis.textContent = 'Die Grafikstufe wirkt nach Neuladen.';
    view.appendChild(hinweis);
    knopf(view, 'Neu laden', () => location.reload());

    const fpsZeile = document.createElement('label');
    fpsZeile.className = 'atl-check';
    fpsSchalter = document.createElement('input');
    fpsSchalter.type = 'checkbox';
    fpsSchalter.dataset.setting = 'fps';
    fpsSchalter.checked = Boolean(settings.get('fps'));
    const fpsText = document.createElement('span');
    fpsText.textContent = 'FPS anzeigen';
    fpsSchalter.addEventListener('change', () => settings.set('fps', fpsSchalter.checked));
    fpsZeile.append(fpsSchalter, fpsText);
    view.appendChild(fpsZeile);

    knopf(view, 'Zurück', () => zeigePause());
    sichtbareAnsicht('einstellungen');
    menuEl.hidden = false;
    hudHinweis();
  }

  // Info & Credits (Namensnennung nach CC BY, Fanprojekt-Hinweis) – Claude
  const CREDITS = [
    ['Atlantis Explorer – Fanprojekt', 'Inoffizielles, nicht-kommerzielles Fanprojekt. Stargate Atlantis und alle zugehörigen Namen, Designs und Marken gehören den jeweiligen Rechteinhabern (MGM / Amazon MGM Studios). Dieses Projekt ist mit ihnen nicht verbunden und wird von ihnen nicht unterstützt.'],
    ['Stadtmodell', '„Atlantis From Stargate Atlantis“ von taichl (thingiverse.com/thing:5534313), lizenziert unter Creative Commons – Namensnennung (CC BY). Für das Spiel verändert: gedreht, skaliert, in Kacheln zerlegt, für die Fernstufe vereinfacht, innerhalb der Räume ausgeschnitten, neu eingefärbt.'],
    ['Puddle Jumper', 'Vorlage von thingiverse.com/thing:3109110, lizenziert unter Creative Commons – Namensnennung (CC BY). Für das Spiel verändert: Hülle ausgehöhlt, Heckklappe und Fenster ergänzt, Antriebsgondeln einfahrbar gemacht.'],
    ['Lizenz', 'Eigener Code unter MIT-Lizenz; CC-BY-Vorlagen und Rechte an Stargate Atlantis ausgenommen.'],
    ['Technik', 'three.js (MIT), three-mesh-bvh (MIT). Räume, Objekte und Spielmodule wurden mit KI-Unterstützung erstellt (Claude, MiniMax, GLM, DeepSeek).'],
  ];
  function zeigeCredits() {
    menuOffen = true;
    state.pause = true;
    input.freigeben();
    const view = views.steuerung;
    view.replaceChildren();
    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = 'Info & Credits';
    view.appendChild(ueberschrift);
    for (const [titel, text] of CREDITS) {
      const b = document.createElement('p');
      const t = document.createElement('b');
      t.textContent = titel;
      b.append(t, document.createElement('br'), text);
      b.style.cssText = 'font-size:13px;line-height:1.45;margin:0 0 12px';
      view.appendChild(b);
    }
    knopf(view, 'Zurück', () => zeigePause());
    sichtbareAnsicht('steuerung');
    menuEl.hidden = false;
    hudHinweis();
  }

  function zeigeSteuerung() {
    menuOffen = true;
    state.pause = true;
    input.freigeben();
    const view = views.steuerung;
    view.replaceChildren();
    const ueberschrift = document.createElement('h2');
    ueberschrift.textContent = 'Steuerung';
    view.appendChild(ueberschrift);
    const liste = document.createElement('ul');
    liste.className = 'atl-steuerung';
    const eintraege = [
      ['WASD', 'laufen'],
      ['Maus', 'umsehen'],
      ['Leertaste', 'springen'],
      ['Umschalt', 'rennen'],
      ['Strg', 'ducken'],
      ['E', 'benutzen'],
      ['Esc', 'Menü'],
      ['F3', 'Leistungsanzeige'],
      ['Jumper', 'W/S Schub · A/D drehen · Leertaste/Strg Höhe · Umschalt Boost · V Ansicht · F Drohne · E aussteigen']
    ];
    for (const [taste, aktion] of eintraege) {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = taste;
      li.append(b, ` – ${aktion}`);
      liste.appendChild(li);
    }
    view.appendChild(liste);
    knopf(view, 'Zurück', () => zeigePause());
    sichtbareAnsicht('steuerung');
    menuEl.hidden = false;
    hudHinweis();
  }

  function tasteWaehlen(nummer) {
    const index = nummer - 1;
    const option = auswahlOptionen[index];
    const knopf = auswahlButtons[index];
    if (!option || !knopf) return;
    knopf.click();
  }

  function escBehandlung() {
    if (aktiveAnsicht === 'auswahl') {
      schliesseMenue();
    } else if (menuOffen) {
      if (aktiveAnsicht === 'einstellungen' || aktiveAnsicht === 'steuerung') {
        zeigePause();
      } else {
        schliesseMenue();
      }
    } else {
      zeigePause();
    }
  }

  ctx.on('taste', (ereignis) => {
    if (!ereignis || ereignis.unten === false) return;
    if (ereignis.code === 'Escape') {
      if (!ereignis.event || !ereignis.event.repeat) escBehandlung();
      return;
    }
    if (aktiveAnsicht !== 'auswahl') return;
    const code = ereignis.code || '';
    const key = ereignis.event && ereignis.event.key;
    let nummer = 0;
    if (/^(Digit|Numpad)[0-9]$/.test(code)) nummer = Number(code.slice(code.length - 1)) || 10;
    else if (/^[0-9]$/.test(key || '')) nummer = Number(key) || 10;
    if (nummer) tasteWaehlen(nummer);
  });

  ctx.on('einstellung', (ereignis) => {
    if (!ereignis) return;
    const key = ereignis.key;
    if (key === 'fps') {
      if (fpsSchalter) fpsSchalter.checked = Boolean(ereignis.value);
      fpsEl.hidden = !Boolean(ereignis.value);
      return;
    }
    if (key === 'stufe') {
      if (stufeAuswahl) stufeAuswahl.value = String(ereignis.value);
      if (stufeWert) stufeWert.textContent = stufeAuswahl && stufeAuswahl.value === 'niedrig' ? 'Niedrig' : 'Hoch';
      return;
    }
    aktualisiereWert(key);
  });

  ctx.on('statistik', (daten) => {
    if (!daten) return;
    fpsWert = Number(daten.fps) || 0;
    fpsEl.textContent = `${Math.round(fpsWert)} FPS`;
    fpsEl.hidden = !settings.get('fps');
  });

  canvas.addEventListener('click', () => {
    if (!menuOffen) input.sperren();
  });

  // Anfangswerte der Schalter
  fpsEl.hidden = !settings.get('fps');
  if (settings.get('fps')) fpsEl.textContent = `${Math.round(fpsWert)} FPS`;
  hudHinweis();

  const dienst = {
    get offen() {
      return menuOffen;
    },
    hinweis(text) {
      setzeHinweis(text);
    },
    meldung(text, sekunden) {
      meldung(text, sekunden);
    },
    menue(titel, optionen) {
      oeffneAuswahl(titel, optionen);
    }
  };

  // Dienst bereitstellen (falls der Loader ihn nicht selbst registriert).
  try {
    if (ctx.services && typeof ctx.services.register === 'function') {
      ctx.services.register('ui', dienst);
    }
  } catch (fehler) {
    // Bereits registriert: unkritisch.
  }

  return {
    auchInPause: true,

    get offen() {
      return menuOffen;
    },
    hinweis(text) {
      setzeHinweis(text);
    },
    meldung(text, sekunden) {
      meldung(text, sekunden);
    },
    menue(titel, optionen) {
      oeffneAuswahl(titel, optionen);
    },

    update(dt) {
      const schritt = Math.min(0.1, Math.max(0, Number(dt) || 0));
      for (let i = meldungen.length - 1; i >= 0; i--) {
        const m = meldungen[i];
        m.rest -= schritt;
        if (m.rest <= 0) {
          m.el.remove();
          meldungen.splice(i, 1);
        } else {
          const anteil = Math.min(1, m.rest / Math.max(0.001, m.gesamt));
          m.el.style.opacity = anteil < 0.25 ? anteil / 0.25 : 1;
        }
      }
      hudHinweis();
    },

    async selbsttest() {
      const details = [];
      let ok = true;

      // Auswahlmenü: simulierter Klick auf die erste Option.
      let auswahlGerufen = false;
      dienst.menue('Test', [{ label: 'Auswahl', run: () => { auswahlGerufen = true; } }]);
      const option = views.auswahl.querySelector('.atl-option');
      if (!option) {
        ok = false;
        details.push('Auswahlknopf fehlt');
      } else {
        option.click();
        if (!auswahlGerufen) {
          ok = false;
          details.push('Auswahlfunktion wurde nicht aufgerufen');
        }
        if (menuOffen || state.pause) {
          ok = false;
          details.push('Auswahlmenü wurde nicht geschlossen');
        }
      }

      // Pausenmenü und Helligkeitsregler.
      const alterWert = settings.get('hell');
      zeigePause();
      if (!menuOffen || !state.pause) {
        ok = false;
        details.push('Pausenmenü öffnet nicht');
      }
      zeigeEinstellungen();
      const hellRegler = views.einstellungen.querySelector('input[data-setting="hell"]');
      if (!hellRegler) {
        ok = false;
        details.push('Helligkeitsregler fehlt');
      } else {
        hellRegler.value = '8';
        hellRegler.dispatchEvent(new Event('input', { bubbles: true }));
        if (settings.get('hell') !== 8) {
          ok = false;
          details.push('Helligkeit wurde nicht auf 8 gesetzt');
        }
      }
      if (alterWert !== undefined && alterWert !== null) settings.set('hell', alterWert);

      // Hinweis testen: sichtbar trotz Pause, wieder ausblendbar.
      dienst.hinweis('x');
      if (hinweisEl.hidden || hinweisEl.textContent !== 'x') {
        ok = false;
        details.push('Hinweis wird nicht angezeigt');
      }
      dienst.hinweis(null);
      if (!hinweisEl.hidden && hinweisEl.textContent === 'x') {
        ok = false;
        details.push('Hinweis wird nicht ausgeblendet');
      }

      schliesseMenue();
      return { ok, details: details.join('; ') || 'OK' };
    },

    dispose() {
      schliesseMenue();
      for (const m of meldungen) m.el.remove();
      meldungen.length = 0;
      uiRoot.removeChild(stil);
      uiRoot.removeChild(fadenkreuz);
      uiRoot.removeChild(hinweisEl);
      uiRoot.removeChild(meldungenEl);
      uiRoot.removeChild(fpsEl);
      uiRoot.removeChild(menuEl);
      uiRoot.classList.remove('atl-ui');
    }
  };
}

// Einstieg: Engine starten. ?module=a,b schränkt die Module ein (Tests), ?test=1 schaltet Testmodus (keine Mauszeiger-Sperre).
import { startEngine } from './core/engine.js';
import { MODULE } from './module.js';

const P = new URLSearchParams(location.search);
const nur = P.get('module') ? P.get('module').split(',') : null;
const basis = new URL('.', import.meta.url);
const liste = (nur ? MODULE.filter((m) => nur.includes(m.name)) : MODULE).map((m) => ({ ...m, pfad: new URL(m.pfad, basis).href }));
startEngine({ canvas: document.getElementById('c'), uiRoot: document.getElementById('ui'), module: liste, test: P.get('test') === '1' })
  .catch((e) => { console.error('Start fehlgeschlagen', e); document.getElementById('ui').textContent = 'Start fehlgeschlagen: ' + e.message; });

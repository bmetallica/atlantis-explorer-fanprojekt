// Dienst 'huelle': lädt eine von vier Material-Varianten der Stadthülle (Vergleich für den Nutzer).
// Wahl per URL ?huelle=claude|minimax|glm|deepseek|minimax2|glm2|deepseek2 (wird gemerkt), Standard: claude.
const VARIANTEN = ['claude', 'minimax', 'glm', 'deepseek', 'minimax2', 'glm2', 'deepseek2'];

export async function init(ctx) {
  let wahl = new URLSearchParams(location.search).get('huelle');
  try {
    if (wahl) localStorage.setItem('sga-huelle', wahl);
    else wahl = localStorage.getItem('sga-huelle');
  } catch { /* Speicher gesperrt */ }
  if (!VARIANTEN.includes(wahl)) wahl = 'claude';
  const modul = await import(`./huelle_varianten/${wahl}.js`);
  ctx.log?.(`Hüllen-Variante: ${wahl}`);
  return modul.init(ctx);
}

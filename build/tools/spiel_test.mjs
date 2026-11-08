// Prüfstand für Spielmodule: startet /spiel/ headless, ersetzt optional ein Modul durch einen Kandidaten,
// führt Testschritte aus, sammelt Konsolenfehler, ruft selbsttest() des Moduls auf und macht Bildschirmfotos.
// Aufruf:  node build/tools/spiel_test.mjs <modulname> [kandidat.js] [ausgabe-präfix]
//   env SCHRITTE='[{"warte":2000},{"taste":"KeyW","ms":1500},{"js":"..."},{"foto":"nach Laufen"}]'
//   env MODULE='assets,licht,kollision' (welche Module laufen; Standard: alle)
// Ausgabe: Prüfbericht auf stdout, Fotos <präfix>_1.png …, Exitcode 0 = OK
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
import { MODULE } from '../../src/game/module.js';

const [name, kandidat, praefix = '/tmp/spiel_test'] = process.argv.slice(2);
const GAME = '/root/sga/src/game', UI = '/root/sga/src/ui';
const eintrag = MODULE.find((m) => m.name === name);
if (!eintrag) { console.log('Unbekanntes Modul', name, '– bekannt:', MODULE.map((m) => m.name).join(', ')); process.exit(2); }
const ziel = '/spiel/' + eintrag.pfad.replace(/^\.\//, '');
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let p = null;
  if (kandidat && u === ziel) p = kandidat;
  else if (u === '/spiel/' || u === '/spiel') p = path.join(GAME, 'index.html');
  else if (u.startsWith('/spiel/')) p = path.join(GAME, u.slice(7));
  else if (u.startsWith('/ui/')) p = path.join(UI, u.slice(4));
  if (p) {
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return fs.createReadStream(p).pipe(res);
  }
  // alles andere (API: /stadtplan, /models, /rooms, /objects, /stadt …) an den laufenden Server weiterreichen
  const prox = http.request({ host: '127.0.0.1', port: 8324, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  prox.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(prox);
}).listen(0);
const port = srv.address().port;
const schritte = JSON.parse(process.env.SCHRITTE || '[{"warte":3000},{"foto":"Start"}]');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// SPIEL_BREITE/SPIEL_HOEHE/SPIEL_STUFE: z. B. für Screenshots in höherer Auflösung und Stufe „hoch“
const page = await browser.newPage({ viewport: { width: Number(process.env.SPIEL_BREITE || 800), height: Number(process.env.SPIEL_HOEHE || 500) } });
// Software-Rendering ist langsam: Grafikstufe „Niedrig“ (kein Bloom, 3 Lichter, 70 % Auflösung), damit die Spielzeit voranschreitet
await page.addInitScript((stufe) => { try { localStorage.setItem('sga-spiel', JSON.stringify({ ...JSON.parse(localStorage.getItem('sga-spiel') || '{}'), stufe })); } catch (e) {} }, process.env.SPIEL_STUFE || 'niedrig');
page.setDefaultTimeout(180000);
const fehler = [], warn = [];
page.on('pageerror', (e) => fehler.push('Seitenfehler: ' + e.message));
page.on('console', (m) => {
  const t = m.text();
  if (m.type() === 'error') fehler.push(t.slice(0, 400));
  else if (m.type() === 'warning' && !/KHR_parallel|GPU stall|GL Driver/.test(t)) warn.push(t.slice(0, 200));
});
const fotos = [];
let selbst = null;
try {
  const q = new URLSearchParams({ test: '1' });
  if (process.env.MODULE) q.set('module', process.env.MODULE);
  for (const [k, v] of new URLSearchParams(process.env.SPIEL_PARAMS || '')) q.set(k, v);   // z. B. huelle=deepseek2
  await page.goto(`http://127.0.0.1:${port}/spiel/?${q}`);
  await page.waitForFunction(() => window.spielBereit === true, null, { timeout: 120000 });
  for (const s of schritte) {
    if (s.warte) await page.waitForTimeout(s.warte);
    if (s.taste) { await page.keyboard.down(s.taste); await page.waitForTimeout(s.ms || 300); await page.keyboard.up(s.taste); }
    if (s.maus) { await page.mouse.move(480, 300); await page.mouse.move(480 + (s.maus[0] || 0), 300 + (s.maus[1] || 0), { steps: 8 }); }
    if (s.klick) await page.mouse.click(480, 300);
    if (s.js) { const r = await page.evaluate(s.js); if (r !== undefined) console.log('js →', JSON.stringify(r).slice(0, 3000)); }
    if (s.foto) { const f = `${praefix}_${fotos.length + 1}.png`; await page.screenshot({ path: f }); fotos.push([f, s.foto]); }
  }
  selbst = await page.evaluate(async (n) => {
    const m = window.spiel.ctx.module.find((x) => x.name === n);
    if (!m) return { ok: false, details: 'Modul nicht gestartet' };
    if (m.fehler) return { ok: false, details: 'init() fehlgeschlagen: ' + m.fehler };
    if (!m.selbsttest) return { ok: true, details: 'kein selbsttest()' };
    try { return await m.selbsttest(); } catch (e) { return { ok: false, details: 'selbsttest wirft: ' + e.message }; }
  }, name);
  const st = await page.evaluate(() => ({ ...window.spiel.ctx.stats, log: window.spiel.log.slice(-15) }));
  console.log(`Statistik: ${st.calls} Draw Calls, ${st.fps} fps (Software-Rendering, nur grob)`);
  if (st.log.length) console.log('Spiel-Log:\n  ' + st.log.join('\n  '));
} catch (e) { fehler.push('Prüfstand: ' + e.message); }
await browser.close(); srv.close();
console.log(`Modul ${name}${kandidat ? ' (Kandidat ' + path.basename(kandidat) + ')' : ''}`);
console.log('selbsttest():', JSON.stringify(selbst));
for (const [f, l] of fotos) console.log(`Foto „${l}“: ${f}`);
if (warn.length) console.log('Warnungen:\n  ' + [...new Set(warn)].slice(0, 8).join('\n  '));
if (fehler.length) console.log('FEHLER:\n  ' + [...new Set(fehler)].slice(0, 10).join('\n  '));
const ok = !fehler.length && selbst && selbst.ok;
console.log('ERGEBNIS: ' + (ok ? 'OK' : 'FEHLER'));
process.exit(ok ? 0 : 1);

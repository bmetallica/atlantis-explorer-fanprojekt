// Rendert ein Spielobjekt aus 4 Blickwinkeln (vorne, Seite, oben, hinten) mit 1-m-Raster und Spielerfigur.
// Hat das Objekt Funktionen (userData.actions), wird jede Aktion ausgeführt und der Zustand danach gerendert.
// Aufruf:  node /root/sga/build/tools/render.mjs <datei.js> [ausgabe-präfix]
//   → <präfix>.png (Ansichten) und <präfix>_aktionen.png (Zustände nach den Aktionen, falls vorhanden)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BUILD = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const file = path.resolve(process.argv[2] || '');
if (!fs.existsSync(file)) { console.log('Aufruf: node render.mjs <datei.js> [präfix]'); process.exit(2); }
const prefix = process.argv[3] || file.replace(/\.js$/, '') + '_render';
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let p = u.startsWith('/__model/') ? u.slice(8) : path.join(BUILD, u);
  const om = u.match(/^\/objmodel\/(OBJ-\d{3})\.js$/);   // fertige Objektmodelle aus der Datenbank (für PLACE_-Punkte)
  if (om) { const dir = `/root/sga/data/models/${om[1]}`; const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => x.endsWith('.js')); p = f ? path.join(dir, f) : ''; }
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const save = (dataUrl, out) => fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
try {
  await page.goto(`http://127.0.0.1:${port}/tools/render.html?m=/__model${encodeURI(file)}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.evaluate(() => window.advance(1500));
  // AKTIONEN="0,2": diese Aktionen vor den Ansichten ausführen (z. B. Rampe öffnen, Gondeln ausfahren)
  if (process.env.AKTIONEN) {
    for (const i of process.env.AKTIONEN.split(',').map(Number)) await page.evaluate((i) => window.runAction(i), i);
    await page.evaluate(() => window.advance(3500));
  }
  const isRoom = /(^|\/)raum_[^/]*\.js$/.test(file) || process.env.RAUM === '1';
  if (isRoom) {
    save(await page.evaluate(() => window.renderGrid(['oben', 'schraeg', 'innen', 'innen2'], 'Raum')), prefix + '.png');
    if (process.env.RAUM_VIEWS)   // eigene Kameras: JSON-Liste [{pos:[x,y,z], target:[x,y,z], label, decke}]
      save(await page.evaluate((v) => window.renderGrid(v, 'Ansichten'), JSON.parse(process.env.RAUM_VIEWS)), prefix + '_extra.png');
    const st = await page.evaluate(() => window.placeStats);
    if (st) console.log(`PLACE_: ${st.ok}/${st.total} Objekte platziert${st.missing.length ? ', fehlt: ' + st.missing.join(',') : ''}`);
  } else
  save(await page.evaluate(() => window.renderGrid(['vorne', 'seite', 'oben', 'hinten'], 'Ansichten')), prefix + '.png');
  console.log('Bild: ' + prefix + '.png');
  const actions = await page.evaluate(() => window.actions);
  if (actions.length && !isRoom) {
    const shots = [];
    for (let i = 0; i < Math.min(actions.length, 4); i++) {
      await page.evaluate((i) => window.runAction(i), i);
      await page.evaluate(() => window.advance(3500));
      shots.push({ view: process.env.AKTION_VIEW || 'vorne', label: `nach „${actions[i]}“` });
      // jede Aktion einzeln rendern und in ein 2×2-Raster setzen
      const img = await page.evaluate((s) => window.renderGrid([s], 'Aktionen'), shots[shots.length - 1]);
      fs.writeFileSync(`${prefix}_aktion${i + 1}.png`, Buffer.from(img.split(',')[1], 'base64'));
    }
    console.log(`Aktionen gerendert: ${Math.min(actions.length, 4)} (${prefix}_aktion1..n.png)`);
  }
} catch (e) {
  errors.push(e.message);
}
await browser.close();
server.close();
if (errors.length) { console.log('FEHLER beim Rendern:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }

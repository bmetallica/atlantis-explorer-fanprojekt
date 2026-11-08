// Misst den Streaming-Prototyp (streaming.html) für mehrere Szenarien.
// Aufruf:  node /root/sga/build/tools/streaming.mjs 'ATL-001,ATL-049,ATL-005' [merge 0|1] [lights] [frames]
//   Ausgabe: eine JSON-Zeile mit Lade-, Compile- und Bildzeiten, Draw Calls, Dreiecken, Speicher.
// Rendering läuft per SwiftShader (CPU) – Zeiten nur als Vergleichswerte untereinander verwenden.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BUILD = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [rooms, merge = "0", lights = "999", frames = "30", vc = "0"] = process.argv.slice(2);
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html' };
const modelFile = (id) => {
  const dir = `/root/sga/data/models/${id}`;
  const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => x.endsWith('.js'));
  return f ? path.join(dir, f) : '';
};
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const m = u.match(/^\/(?:objmodel|roommodel)\/((?:OBJ|ATL)-\d{3})\.js$/);
  const p = m ? modelFile(m[1]) : path.join(BUILD, u);
  if (!p || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/KHR_parallel/.test(m.text())) errors.push(m.text().slice(0, 300)); });
try {
  await page.goto(`http://127.0.0.1:${port}/tools/streaming.html?rooms=${rooms}&merge=${merge}&lights=${lights}&frames=${frames}&vc=${vc}&prof=${process.env.PROF || 0}&nomat=${process.env.NOMAT || 0}&texstat=${process.env.TEXSTAT || 0}&objcost=${process.env.OBJCOST || 0}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 600000, polling: 1000 });
  console.log(JSON.stringify(await page.evaluate(() => window.result)));
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
} catch (e) { errors.push(e.message); }
await browser.close();
server.close();
if (errors.length) { console.log('FEHLER: ' + errors.slice(0, 3).join(' | ')); process.exit(1); }

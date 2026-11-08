// node compat.mjs – prüft alle Modelle aus data/models mit three r170
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const BUILD = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const M = '/root/sga/data/models';
const ids = fs.readdirSync(M).filter((d) => fs.readdirSync(path.join(M, d)).some((f) => f.endsWith('.js')));
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/list') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(ids)); }
  const m = u.match(/^\/model\/((?:OBJ|ATL)-\d{3})\.js$/);
  const p = m ? path.join(M, m[1], fs.readdirSync(path.join(M, m[1])).find((f) => f.endsWith('.js'))) : path.join(BUILD, u);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage(); const pe = []; pg.on('pageerror', (e) => pe.push(e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/tools/bodencheck.html`);
await pg.waitForFunction(() => window.result, null, { timeout: 600000, polling: 1000 }).catch((e) => pe.push(e.message));
console.log(JSON.stringify(await pg.evaluate(() => window.result)), pe);
await b.close(); srv.close();

// Maße und Art aller fertigen Objektmodelle → orchestrator/objmasse.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = {};
for (const id of fs.readdirSync('/root/sga/data/models').filter((x) => x.startsWith('OBJ-'))) {
  const dir0 = `/root/sga/data/models/${id}`, f = fs.readdirSync(dir0).find((x) => x.endsWith('.js'));
  const dir = '/root/sga/build/orchestrator/_objtmp'; fs.mkdirSync(dir, { recursive: true }); if (f) fs.copyFileSync(`${dir0}/${f}`, `${dir}/${f}`);
  if (!f) continue;
  let txt = '';
  try { txt = execFileSync(process.execPath, ['/root/sga/build/tools/pruefen.mjs', `${dir}/${f}`], { encoding: 'utf8', cwd: '/root/sga/build' }); } catch (e) { txt = e.stdout || ''; }
  const m = txt.match(/Maße sichtbar \(B × H × T\): ([\d.]+) × ([\d.]+) × ([\d.]+)/);
  const src = fs.readFileSync(`${dir}/${f}`, 'utf8');
  const art = (src.match(/art:\s*['"`]([^'"`]+)/) || [])[1] || '';
  out[id] = { datei: f, masse: m ? m.slice(1, 4).map(Number) : null, art };
}
fs.writeFileSync('/root/sga/build/orchestrator/objmasse.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out).length);

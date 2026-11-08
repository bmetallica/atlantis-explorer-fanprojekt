// Technische Prüfung eines Spielobjekts (.js mit create()).
// Aufruf:  node /root/sga/build/tools/pruefen.mjs <datei.js>
// Prüft: Laden, create(), Dreiecke, Maße/Ursprung, COL_/INT_/LAMP_, KIT_-Materialien,
//        steckbrief, Funktionen (userData.actions) und Animation (10 s simuliert) auf Laufzeitfehler.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// --- Minimal-DOM für Canvas-Texturen (zeichnet nichts, wirft aber auch nicht)
const stub = () => new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : stub()),
  apply: () => stub(), set: () => true,
});
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => stub()), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 256, height: 256, style: {}, getContext: () => ctx2d }) };
globalThis.window = globalThis;
let fakeNow = 0;
globalThis.performance = { now: () => fakeNow };

const file = process.argv[2];
if (!file) { console.log('Aufruf: node pruefen.mjs <datei.js>'); process.exit(2); }
const fehler = [], warn = [], info = [];
const THREE = await import('three');

let mod;
try { mod = await import(pathToFileURL(path.resolve(file)).href + '?t=' + Date.now()); }
catch (e) {
  console.log('FEHLER: Modul lässt sich nicht laden: ' + e.message);
  // Syntaxfehler mit Zeilennummer und Codeausschnitt ausgeben
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['--experimental-default-type=module', '--check', path.resolve(file)], { encoding: 'utf8' });
  if (r.stderr) console.log(r.stderr.split('\n').filter((l) => l.trim() && !l.startsWith('Node.js')).slice(0, 8).join('\n'));
  process.exit(1);
}
if (typeof mod.create !== 'function') { console.log('FEHLER: kein export function create()'); process.exit(1); }
const name = path.basename(file, '.js');
if (!/^[a-z0-9_]+$/.test(name) || name.startsWith('_')) fehler.push(`Dateiname "${name}" ungültig (nur a-z, 0-9, _; nicht mit _ beginnen)`);

let root;
try { root = mod.create({}); } catch (e) { console.log('FEHLER: create() wirft: ' + e.stack); process.exit(1); }
if (!root || !root.isObject3D) { console.log('FEHLER: create() gibt kein THREE.Object3D zurück'); process.exit(1); }
root.updateMatrixWorld(true);

let tris = 0, meshes = 0;
const cols = [], ints = [], lamps = [], kits = new Set(), mats = new Set();
const KIT_OK = new Set(['wall', 'wallDark', 'copper', 'pillar', 'hull', 'floor', 'floorUpper', 'ceiling', 'stair', 'door', 'glass', 'rail', 'glow', 'amberGlow']);
const box = new THREE.Box3();
root.traverse((o) => {
  if (/^COL_/.test(o.name)) { cols.push(o); return; }
  if (/^INT_/.test(o.name)) ints.push(o);
  if (/^LAMP_/.test(o.name)) lamps.push(o);
  if (o.isMesh) {
    meshes++;
    const g = o.geometry;
    const pa = g.attributes.position;
    if (pa) { for (let i = 0; i < pa.array.length; i++) if (!Number.isFinite(pa.array[i])) { fehler.push(`Mesh "${o.name || o.parent?.name || '?'}" enthält ungültige Koordinaten (NaN/Infinity) – Berechnung prüfen (Division durch 0, undefinierte Variable)`); break; } }
    if (![o.position.x, o.position.y, o.position.z, o.scale.x, o.scale.y, o.scale.z].every(Number.isFinite)) fehler.push(`Objekt "${o.name || '?'}" hat ungültige Position/Skalierung (NaN)`);
    const t = (g.index ? g.index.count : g.attributes.position.count) / 3;
    tris += t * (o.isInstancedMesh ? o.count : 1);
    for (const m of [].concat(o.material)) {
      if (!m) continue;
      mats.add(m.name || m.type);
      if (/^KIT_/.test(m.name)) { kits.add(m.name); if (!KIT_OK.has(m.name.slice(4))) fehler.push(`Unbekanntes Spielmaterial ${m.name}`); }
    }
    if (o.visible) {
      if (o.isInstancedMesh) {
        const mtx = new THREE.Matrix4(), b = new THREE.Box3();
        g.computeBoundingBox();
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mtx); b.copy(g.boundingBox).applyMatrix4(mtx).applyMatrix4(o.matrixWorld); box.union(b); }
      } else box.expandByObject(o);
    }
  }
});
const size = box.getSize(new THREE.Vector3());
info.push(`Meshes: ${meshes}, Dreiecke: ${Math.round(tris)}`);
info.push(`Maße sichtbar (B × H × T): ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`);
info.push(`Bounding Box: min (${box.min.toArray().map((v) => v.toFixed(2)).join(', ')}) max (${box.max.toArray().map((v) => v.toFixed(2)).join(', ')})`);
if (tris > 30000) fehler.push(`Zu viele Dreiecke (${Math.round(tris)} > 30 000)`);
else if (tris > 5000) info.push('Großobjekt (> 5 000 Dreiecke) – ok, wenn das Objekt groß ist');
if (meshes === 0) fehler.push('Keine sichtbaren Meshes');
const isRoom = /^raum_/.test(name);
if (!isRoom && Math.abs(box.min.y) > 0.03 && !(mod.steckbrief && /versenkt|wand|decke/i.test(JSON.stringify(mod.steckbrief))))
  warn.push(`Unterseite liegt bei y = ${box.min.y.toFixed(3)} statt 0 (Standobjekt muss auf dem Boden stehen)`);
const cx = (box.min.x + box.max.x) / 2;
if (Math.abs(cx) > Math.max(0.05, size.x * 0.1)) warn.push(`Objekt ist in X nicht mittig (Mitte bei x = ${cx.toFixed(2)})`);
info.push(`COL_: ${cols.length}, INT_: ${ints.map((o) => `${o.name}("${o.userData.label ?? '—'}")`).join(' ') || '0'}, LAMP_: ${lamps.length}`);
for (const o of ints) if (!o.userData.label) warn.push(`${o.name} hat kein userData.label`);
for (const o of lamps) if (!o.userData.color) warn.push(`${o.name} hat kein userData.color`);
for (const c of cols) if (!c.isMesh) fehler.push(`${c.name} ist kein Mesh`);
if (!cols.length && tris > 2000) warn.push('Keine COL_-Boxen bei vielen Dreiecken – einfache Kollisionsboxen anlegen');
{ const u = [...new Set([...mats].map((m) => m.replace(/_?\d+$/, '')))]; if (isRoom) {
  const places = [], doors = [], ceil = [];
  root.traverse((o) => { if (/^PLACE_OBJ-\d{3}/.test(o.name)) places.push(o.name); if (/^DOOR_/.test(o.name)) doors.push(o.name); if (/^(decke|ceiling)/i.test(o.name)) ceil.push(o.name); });
  info.push(`Raum: ${places.length} PLACE_-Punkte (${[...new Set(places.map((n) => n.slice(6, 13)))].join(', ') || '—'}), ${doors.length} DOOR_ (${doors.join(', ') || '—'}), Decke: ${ceil.length ? 'ja' : 'nein'}`);
  const soll = (process.env.RAUM_OBJEKTE || '').split(',').filter(Boolean);
  const fehlt = soll.filter((id) => !places.some((n) => n.startsWith('PLACE_' + id)));
  if (fehlt.length) warn.push(`PLACE_-Punkte fehlen für: ${fehlt.join(', ')}`);
  if (!doors.length) fehler.push('Raum ohne DOOR_-Anschluss (mindestens ein Eingang nötig)');
  const tueren = places.filter((n) => n.startsWith('PLACE_OBJ-091')).length;
  info.push(`Türen (PLACE_OBJ-091): ${tueren}`);
  if (!ceil.length) warn.push('Keine Decke mit Namen "decke…" gefunden');
  // Bauteile, die weit außerhalb der Raumhülle (COL_-Körper) liegen
  const hull = new THREE.Box3(); cols.forEach((c) => hull.expandByObject(c));
  if (!hull.isEmpty()) {
    const big = hull.clone().expandByScalar(1.5), aus = [];
    root.traverse((o) => { if (o.isMesh && !/^COL_/.test(o.name) && o.visible) { const b = new THREE.Box3().setFromObject(o); if (!big.containsBox(b)) aus.push(o.name || o.parent?.name || o.type); } });
    if (aus.length) fehler.push(`${aus.length} Bauteil(e) ragen mehr als 1,5 m aus der Raumhülle (COL_) heraus: ${[...new Set(aus)].slice(0, 6).join(', ')} – Positionen/Längen prüfen`);
  }
  if (Math.abs(box.min.y) > 0.4) warn.push(`Raum reicht ${box.min.y.toFixed(2)} m unter den Boden – Bodenoberkante muss y = 0 sein`);
  // Regeln aus den Abnahmen: eingebaute Möbel, Rundbögen
  const nm = (o) => o.name || o.parent?.name || '';
  const parts = [];   // [Objekt, Welt-Box, Gier-Winkel] je Mesh bzw. je Instanz
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || /^COL_/.test(o.name)) return;
    const g = o.geometry; g.computeBoundingBox();
    const ms = [];
    if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) { const m = new THREE.Matrix4(); o.getMatrixAt(i, m); ms.push(m.premultiply(o.matrixWorld)); }
    else ms.push(o.matrixWorld);
    for (const m of ms) {
      const q = new THREE.Quaternion(); m.decompose(new THREE.Vector3(), q, new THREE.Vector3());
      parts.push([o, g.boundingBox.clone().applyMatrix4(m), new THREE.Euler().setFromQuaternion(q, 'YXZ').y]);
    }
  });
  const MOEBEL = /(tisch|desk|table|stuhl|chair|sessel|sofa|couch|bett(?!ung)|\bbed\b|regal|shelf|schrank|cabinet|lampe|lamp(?!_)|laptop|monitor|bildschirm|konsole|console|terminal|pult)/i;
  const moebelName = [...new Set(parts.filter(([o]) => MOEBEL.test(nm(o)) && !/^LAMP_/.test(o.name)).map(([o]) => nm(o)))];
  if (moebelName.length) fehler.push(`Möbel/Geräte in der Raumhülle gebaut (${moebelName.slice(0, 6).join(', ')}) – Raum muss leer sein: entfernen, stattdessen PLACE_OBJ-xxx setzen (oder weglassen, wenn kein Objekt passt)`);
  if (!hull.isEmpty()) {
    // freistehende Körper in Möbelgröße auf dem Boden, nicht an der Wand
    const inner = hull.clone().expandByScalar(-1.0), sus = [];
    for (const [o, b] of parts) {
      const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
      if (b.min.y < 0.2 && b.max.y > 0.7 && b.max.y < 1.3 && Math.min(s.x, s.z) > 0.35 && Math.max(s.x, s.z) < 3.2 && inner.containsPoint(c.setY(inner.min.y + 0.01)))
        sus.push(nm(o) || o.type);
    }
    if (sus.length) warn.push(`${sus.length} freistehende Körper in Möbelgröße (0,7–1,3 m hoch, mitten im Raum): ${[...new Set(sus)].slice(0, 5).join(', ')} – wenn das Tische/Pulte/Sitzbänke sind: entfernen, Möbel kommen als Objekte`);
  }
  const ARC = (g) => (g.parameters?.shapes ? [].concat(g.parameters.shapes) : []).some((s) => [s, ...(s.holes || [])].some((p) => p.curves?.some((c) => c.isEllipseCurve || c.isArcCurve)));
  const boegen = [...new Set(parts.filter(([o, b]) => {
    const s = b.getSize(new THREE.Vector3());
    const senkrecht = s.y > 1.0 && Math.min(s.x, s.z) < 0.6;
    return (/bogen|arch/i.test(nm(o)) || (senkrecht && (ARC(o.geometry) || /Torus|Ring/.test(o.geometry.type))));
  }).map(([o]) => nm(o) || o.geometry.type))];
  if (boegen.length) fehler.push(`Rundbögen/runde Öffnungen in Wänden (${boegen.slice(0, 5).join(', ')}) – Atlantis ist eckig: Fenster/Nischen als Rechteck, Dreieck oder 30°/60°-Polygon bauen (rund nur für Maschinen, Bodenintarsien, Deckenöffnungen)`);
}
info.push(`Materialien: ${u.slice(0, 15).join(', ')}${u.length > 15 ? ' …' : ''}`); }
if (!mod.steckbrief) warn.push('export const steckbrief fehlt');

// --- Funktionen + Animation
const actions = Array.isArray(root.userData.actions) ? root.userData.actions : [];
const animated = [];
root.traverse((o) => { if (o.onBeforeRender && o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) animated.push(o); });
const hasUpdate = typeof root.userData.update === 'function';
info.push(`Funktionen: ${actions.length ? actions.map((a) => `"${a.label}"`).join(', ') : 'keine'}`);
info.push(`Animation: ${hasUpdate ? 'userData.update' : '—'}${animated.length ? `, onBeforeRender an ${animated.length} Objekt(en)` : ''}`);
root.traverse((o) => { if (/^COL_/.test(o.name)) { o.visible = false; o.userData.__warUnsichtbar = true; } });
const tick = (sec) => {
  for (let t = 0; t < sec; t += 1 / 30) {
    fakeNow += 1000 / 30;
    for (const o of animated) o.onBeforeRender(null, null, null, null, null, null);
  }
};
try { tick(3); } catch (e) { fehler.push('Animation wirft: ' + e.message); }
for (const a of actions) {
  try {
    if (typeof a.run !== 'function') { fehler.push(`Aktion "${a.label}" hat kein run()`); continue; }
    a.run(); tick(6);
  } catch (e) { fehler.push(`Aktion "${a.label}" wirft: ${e.message}`); }
}
// Nach der Animation: ungültige Transformationen (NaN) suchen
{
  let bad = null;
  root.traverse((o) => {
    if (bad) return;
    const v = [...o.position.toArray(), ...o.scale.toArray(), ...o.quaternion.toArray()];
    if (!v.every(Number.isFinite)) bad = `Objekt "${o.name || o.type}" bekommt in der Animation ungültige Werte (NaN) für Position/Drehung/Skalierung`;
    if (!bad && /^COL_/.test(o.name) && o.visible && o.userData.__warUnsichtbar) bad = `Kollisionskörper "${o.name}" wird in der Animation sichtbar geschaltet (erscheint im Spiel als weiße Fläche) – COL_ nie über .visible steuern, stattdessen z. B. userData.aktiv setzen`;
    if (!bad && o.isInstancedMesh && !Array.from(o.instanceMatrix.array).every(Number.isFinite)) bad = `InstancedMesh "${o.name}" hat ungültige Matrizen (NaN)`;
  });
  if (bad) fehler.push(bad + ' – z. B. Division durch 0 oder undefinierte Variable in update()');
}
if (root.userData.api && typeof root.userData.api !== 'object') warn.push('userData.api ist kein Objekt');

console.log(`Prüfung ${path.basename(file)}`);
for (const l of info) console.log('  ' + l);
for (const l of warn) console.log('WARNUNG: ' + l);
for (const l of fehler) console.log('FEHLER: ' + l);
console.log(fehler.length ? `ERGEBNIS: ${fehler.length} Fehler – bitte beheben` : `ERGEBNIS: OK${warn.length ? ` (${warn.length} Warnung/en prüfen)` : ''}`);
process.exit(fehler.length ? 1 : 0);

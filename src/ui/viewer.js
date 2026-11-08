// 3D-Objekt-Viewer der Raumdatenbank.
// Lädt das Spielobjekt eines Datenbank-Objekts (.js mit create() oder .glb), zeigt es wie im Schaukasten
// des Spiels (1-m-Raster, Spielerfigur 1,37 m, KIT_-Materialien, COL_/INT_/LAMP_) und bietet die
// Funktionen des Objekts (userData.actions) als Knöpfe an.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Näherung der Spielmaterialien (OBJEKTE.md, Abschnitt Spielmaterialien)
const KIT = {
  wall: { color: 0xaab4c0, metalness: 0.55, roughness: 0.45 },
  wallDark: { color: 0x4a6a8c, metalness: 0.6, roughness: 0.45 },
  copper: { color: 0xb08a59, metalness: 0.8, roughness: 0.35 },
  pillar: { color: 0xd9e0e6, metalness: 0.35, roughness: 0.4 },
  hull: { color: 0xf0f0ec, metalness: 0.2, roughness: 0.4 },
  floor: { color: 0x4f4a42, metalness: 0.5, roughness: 0.6 },
  floorUpper: { color: 0x5a544b, metalness: 0.5, roughness: 0.6 },
  ceiling: { color: 0x2e3135, metalness: 0.4, roughness: 0.7 },
  stair: { color: 0x8a6e4b, metalness: 0.7, roughness: 0.45 },
  door: { color: 0x8e98a4, metalness: 0.75, roughness: 0.35 },
  glass: { color: 0x6aa8e0, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35 },
  rail: { color: 0xc49a5e, metalness: 0.9, roughness: 0.2 },
  glow: { color: 0x6fe3ff, emissive: 0x6fe3ff, emissiveIntensity: 1.3 },
  amberGlow: { color: 0xffb060, emissive: 0xffb060, emissiveIntensity: 1.3 },
};
const kitCache = {};
function kitMaterial(name) {
  const key = name.slice(4);
  if (!kitCache[key]) kitCache[key] = new THREE.MeshStandardMaterial({ name, ...(KIT[key] || { color: 0xff00ff }) });
  return kitCache[key];
}

let current = null; // aktive Viewer-Instanz

export function disposeViewer() {
  if (current) { current.dispose(); current = null; }
}

export async function mountViewer(container, obj, { onChanged, kind = 'objects', objects = [] } = {}) {
  const isRoom = kind === 'rooms';
  disposeViewer();
  const models = obj.models || {};
  const fmt = models.js ? 'js' : models.glb ? 'glb' : null;
  container.innerHTML = `
    <div class="mv">
      <div class="mv-stage"><canvas></canvas>
        <div class="mv-hud"><span class="mv-state"></span></div>
        <div class="mv-msg"></div>
      </div>
      <div class="mv-side">
        <div class="mv-box mv-actions"><div class="mv-h">Funktionen</div><div class="mv-btns"></div></div>
        <div class="mv-box"><div class="mv-h">Ansicht</div>
          <label><input type="checkbox" data-t="player" checked> Spielerfigur (1,37 m)</label>
          <label><input type="checkbox" data-t="grid" checked> 1-m-Raster</label>
          <label><input type="checkbox" data-t="col"> Kollision (COL_)</label>
          <label><input type="checkbox" data-t="markers" checked> Benutzen-/Lichtpunkte</label>
          <label><input type="checkbox" data-t="bloom" checked> Leuchteffekt (Bloom)</label>
          <label><input type="checkbox" data-t="sound"> Ton</label>
          <label class="mv-range">Helligkeit <input type="range" min="1" max="10" step="1" data-l="hell"> <b></b></label>
          <label class="mv-range">Leuchteffekte <input type="range" min="1" max="10" step="1" data-l="glow"> <b></b></label>
          ${isRoom ? '<label><input type="checkbox" data-t="objekte" checked> Objekte an PLACE_-Punkten</label><label><input type="checkbox" data-t="decke"> Decke</label><label><input type="checkbox" data-t="anim" checked> Objekt-Animationen (gedrosselt)</label>' : ''}
          <div class="mv-row"><button data-cam="front">Vorne</button><button data-cam="side">Seite</button><button data-cam="top">Oben</button><button data-cam="player">Augenhöhe</button></div>
        </div>
        <div class="mv-box mv-info"><div class="mv-h">Modell</div><div class="mv-infobody">–</div></div>
        <div class="mv-box"><div class="mv-h">Dateien</div>
          <div class="mv-row mv-files"></div>
          <div class="mv-row">
            <label class="mv-upload">Modell hochladen (.js / .glb)<input type="file" accept=".js,.glb" hidden></label>
          </div>
        </div>
      </div>
    </div>`;
  const $ = (s) => container.querySelector(s);
  const canvas = $('canvas');
  const stage = $('.mv-stage');
  const msg = (t) => { $('.mv-msg').textContent = t || ''; $('.mv-msg').style.display = t ? '' : 'none'; };

  // Dateien-Leiste (Download / Löschen / GLB-Export)
  const files = $('.mv-files');
  for (const [f, m] of Object.entries(models)) {
    const a = document.createElement('a');
    a.href = m.url + '?download=true';
    a.className = 'mv-btn';
    a.textContent = `⬇ ${m.file}`;
    files.append(a);
    const del = document.createElement('button');
    del.textContent = `✕ ${f.toUpperCase()}`;
    del.title = `${f.toUpperCase()}-Modell löschen`;
    del.onclick = async () => {
      if (!confirm(`${f.toUpperCase()}-Modell „${m.file}“ von ${obj.id} löschen?`)) return;
      const r = await fetch(`/${kind}/${obj.id}/models/${f}`, { method: 'DELETE' });
      if (!r.ok) return alert('Löschen fehlgeschlagen: HTTP ' + r.status);
      onChanged && onChanged();
    };
    files.append(del);
  }
  const exp = document.createElement('button');
  exp.textContent = 'GLB exportieren';
  exp.title = 'Aktuellen Zustand als .glb speichern (Shader-Effekte werden nicht exportiert)';
  files.append(exp);
  $('.mv-upload input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    msg('Lade hoch …');
    const r = await fetch(`/${kind}/${obj.id}/models`, { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { msg(''); return alert('Upload fehlgeschlagen: ' + (j.error || j.detail || r.status)); }
    onChanged && onChanged();
  };

  if (!fmt) {
    msg('Für dieses Objekt ist noch kein 3D-Modell hinterlegt.');
    $('.mv-actions').style.display = 'none';
    exp.disabled = true;
    return;
  }

  // ---------------------------------------------------------------- Szene
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isRoom ? 1.5 : 2));   // Räume: viele Objekte, etwas geringere Auflösung
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1017);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1410, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 9, 7);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x24282e, metalness: 0.4, roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const grid = new THREE.GridHelper(28, 28, 0x3a5a7a, 0x26394d);
  grid.position.y = 0.002;
  scene.add(grid);
  // Spielerfigur: Kapsel Höhe 1,37 m, Radius 0,31 m, steht vorn links
  const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 1.37 - 0.62, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.35, depthWrite: false }));
  player.position.y = 1.37 / 2;
  scene.add(player);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------------------------------------------------------------- Modell laden
  let root, mixer = null;
  const m = models[fmt];
  const url = `${m.url}?v=${encodeURIComponent(m.updated_at || '')}`;
  msg('Lade Modell …');
  try {
    if (fmt === 'js') {
      const mod = await import(url);
      if (typeof mod.create !== 'function') throw new Error('Modul exportiert kein create()');
      const vars = Array.isArray(mod.varianten) ? mod.varianten : null;
      const vi = Math.min(Number(obj.__variante || 0), vars ? vars.length - 1 : 0);
      root = mod.create({ sound: false, ...(vars ? vars[vi].opts : {}) });
      if (vars) {
        const sel = document.createElement('select');
        sel.className = 'mv-btn';
        vars.forEach((v, i) => { const o = document.createElement('option'); o.value = i; o.textContent = v.label; if (i === vi) o.selected = true; sel.append(o); });
        sel.onchange = () => { obj.__variante = Number(sel.value); mountViewer(container, obj, { onChanged, kind, objects }); };
        const box = document.createElement('div'); box.className = 'mv-box';
        box.innerHTML = '<div class="mv-h">Variante</div>'; box.append(sel);
        container.querySelector('.mv-side').prepend(box);
      }
      root.userData.steckbrief = root.userData.steckbrief || mod.steckbrief;
    } else {
      const gltf = await new GLTFLoader().loadAsync(url);
      root = gltf.scene;
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(root);
        for (const clip of gltf.animations) mixer.clipAction(clip).play();
      }
    }
  } catch (e) {
    console.error(e);
    msg('Modell konnte nicht geladen werden: ' + e.message);
    renderer.dispose();
    return;
  }
  msg('');
  scene.add(root);

  // Spielregeln nachbilden: KIT_ ersetzen, COL_ ausblenden, INT_/LAMP_ markieren
  const cols = [], markers = new THREE.Group(), lamps = [];
  let tris = 0;
  const colMat = new THREE.MeshBasicMaterial({ color: 0xff4040, wireframe: true });
  root.traverse((o) => {
    if (o.isMesh) {
      if (/^COL_/.test(o.name)) { o.material = colMat; o.visible = false; cols.push(o); return; }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const repl = mats.map((mt) => (mt && /^KIT_/.test(mt.name) ? kitMaterial(mt.name) : mt));
      o.material = Array.isArray(o.material) ? repl : repl[0];
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (/^INT_/.test(o.name)) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd34d }));
      o.getWorldPosition(s.position);
      const r = Number(o.userData.radius ?? 1);
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.02, r, 48), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(s.position.x, 0.01, s.position.z);
      markers.add(s, ring);
    }
    if (/^LAMP_/.test(o.name)) {
      const color = new THREE.Color(o.userData.color || '#ffb060');
      const l = new THREE.PointLight(color, Number(o.userData.intensity ?? 15) * 0.4, Number(o.userData.distance ?? 10), 2);
      o.getWorldPosition(l.position);
      scene.add(l);
      lamps.push(l);
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color }));
      s.position.copy(l.position);
      markers.add(s);
    }
  });
  scene.add(markers);

  // Raum: PLACE_OBJ-xxx-Punkte mit den fertigen Objektmodellen bestücken, Decke separat schaltbar
  const placed = new THREE.Group(), ceilings = [], roomAnims = [];
  let animOn = true, animLast = 0;
  let placeInfo = '';
  if (isRoom) {
    root.traverse((o) => { if (/^(decke|ceiling)/i.test(o.name)) ceilings.push(o); });
    const places = [];
    root.traverse((o) => { const mm = o.name.match(/^PLACE_(OBJ-\d{3})/); if (mm) places.push([mm[1], o]); });
    let ok = 0, missing = [];
    // Module parallel laden (jedes Objekt nur einmal), danach Instanzen erzeugen
    msg(`Lade ${places.length} Objekte …`);
    const mods = {};
    await Promise.all([...new Set(places.map(([oid]) => oid))].map(async (oid) => {
      const od = objects.find((x) => x.id === oid);
      const om = od && od.models && od.models.js;
      if (!om) return;
      try { mods[oid] = await import(`${om.url}?v=${encodeURIComponent(om.updated_at || '')}`); } catch (e) { console.error(oid, e); }
    }));
    for (const [oid, anchor] of places) {
      const mod = mods[oid];
      if (!mod) { missing.push(oid); continue; }
      try {
        const inst = mod.create({ sound: false });
        inst.traverse((o) => {
          if (o.isMesh && /^COL_/.test(o.name)) o.visible = false;
          else if (o.isMesh) { const ms = [].concat(o.material).map((mt) => (mt && /^KIT_/.test(mt.name) ? kitMaterial(mt.name) : mt)); o.material = Array.isArray(o.material) ? ms : ms[0]; }
        });
        anchor.updateMatrixWorld(true);
        anchor.matrixWorld.decompose(inst.position, inst.quaternion, inst.scale);
        placed.add(inst); ok++;
      } catch (e) { console.error(oid, e); missing.push(oid); }
    }
    scene.add(placed);
    // Animationen der eingesetzten Objekte (Displays, Pulsieren) gedrosselt im Sammeltakt statt in jedem Frame:
    // viele Objekte zeichnen Canvas-Displays neu und laden Texturen hoch – das bremst große Räume stark.
    placed.traverse((o) => { if (Object.prototype.hasOwnProperty.call(o, 'onBeforeRender')) { roomAnims.push([o, o.onBeforeRender]); o.onBeforeRender = () => {}; } });
    ceilings.forEach((c) => (c.visible = false));   // Raum von oben einsehbar
    floor.visible = false;                         // Raum hat eigenen Boden
    placeInfo = `<div>Platzierte Objekte: ${ok} von ${places.length} PLACE_-Punkten${missing.length ? ` (fehlt: ${missing.join(', ')})` : ''}</div>`;
  }

  // Maße (nur sichtbare Teile)
  const box = new THREE.Box3();
  root.traverse((o) => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  player.position.x = box.max.x + 0.8;
  player.position.z = Math.max(box.max.z, 0) + 0.6;

  // Infos
  const sb = root.userData.steckbrief;
  $('.mv-infobody').innerHTML = `
    <div><b>${esc(m.file)}</b> · ${fmt.toUpperCase()} · ${(m.size / 1024).toFixed(1)} KB</div>
    <div>Maße (B × H × T): ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m</div>
    <div>Dreiecke: ${Math.round(tris).toLocaleString('de-DE')} ${tris > 30000 ? '⚠ über 30 000' : ''}</div>
    <div>Kollision: ${cols.length} COL_ · Benutzen: ${countNames(root, /^INT_/)} INT_ · Lichter: ${lamps.length} LAMP_</div>
    ${sb ? `<details><summary>Steckbrief</summary>${Object.entries(sb).map(([k, v]) => `<div><span class="k">${esc(k)}:</span> ${esc(v)}</div>`).join('')}</details>` : ''}
    ${placeInfo}
    ${mixer ? '<div>Animation: läuft (GLB, Endlosschleife)</div>' : ''}`;

  // Funktionen
  const btns = $('.mv-btns');
  const actions = root.userData.actions || [];
  if (!actions.length) btns.innerHTML = '<div class="mv-none">Keine Funktionen definiert.</div>';
  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.label;
    b.onclick = () => { try { a.run(); } catch (e) { alert(e.message); } };
    btns.append(b);
  }
  const api = root.userData.api;
  const stateEl = $('.mv-state');
  const STATES = { idle: 'Ruhezustand', dialing: 'Anwahl', kawoosh: 'Wurmloch baut sich auf', open: 'Wurmloch offen', closing: 'Schließt' };
  const showState = (s, info = {}) => {
    if (!api || s == null) { stateEl.style.display = 'none'; return; }
    stateEl.style.display = '';
    const chev = api.lockedChevrons ? ` · Chevron ${api.lockedChevrons} verriegelt` : '';
    stateEl.textContent = `${STATES[s] || s}${chev}${api.shield ? ' · Schild aktiv' : ''}`;
  };
  if (api && api.onChange) api.onChange(showState);
  showState(api ? api.state : null);

  // Ansicht-Schalter
  const toggles = {
    player: (v) => (player.visible = v),
    grid: (v) => (grid.visible = v),
    col: (v) => cols.forEach((c) => (c.visible = v)),
    markers: (v) => (markers.visible = v),
    bloom: (v) => (bloom.enabled = v),
    sound: (v) => api && api.setSound && api.setSound(v),
    objekte: (v) => (placed.visible = v),
    decke: (v) => ceilings.forEach((c) => (c.visible = v)),
    anim: (v) => (animOn = v),
  };
  // Lichtsteuerung in 10 Stufen (wie später im Spielmenü): Stufe 6 = Standard. Gespeichert pro Browser.
  const lampBase = lamps.map((l) => l.intensity);
  const licht = {
    hell: (n) => { renderer.toneMappingExposure = 0.4 + 0.1 * n; },
    glow: (n) => { const f = n / 6; bloom.strength = 0.6 * f; lamps.forEach((l, i) => (l.intensity = lampBase[i] * f)); },
  };
  container.querySelectorAll('[data-l]').forEach((inp) => {
    const key = 'sga-licht-' + inp.dataset.l;
    let v = 6; try { v = Number(localStorage.getItem(key)) || 6; } catch {}
    const apply = () => { const n = Number(inp.value); licht[inp.dataset.l](n); inp.nextElementSibling.textContent = n; try { localStorage.setItem(key, n); } catch {} };
    inp.value = v; inp.oninput = apply; apply();
  });
  container.querySelectorAll('[data-t]').forEach((cb) => {
    cb.onchange = () => toggles[cb.dataset.t](cb.checked);
  });

  // Kamera
  const setCam = (mode) => {
    const d = Math.max(size.x, size.y, size.z) * 1.5 + 2;
    controls.target.copy(center);
    if (mode === 'side') camera.position.set(center.x + d, center.y + 0.5, center.z + 0.01);
    else if (mode === 'top') camera.position.set(center.x, center.y + d, center.z + 0.01);
    else if (mode === 'player') { camera.position.set(player.position.x - 0.5, 1.22, player.position.z + 4); controls.target.set(center.x, 1.8, center.z); }
    else camera.position.set(center.x + d * 0.35, center.y + d * 0.18, center.z + d);
    controls.update();
  };
  container.querySelectorAll('[data-cam]').forEach((b) => (b.onclick = () => setCam(b.dataset.cam)));
  setCam('front');
  if (isRoom) {   // Shader vorab im Hintergrund übersetzen, sonst hängt der erste Frame bei vielen Materialien
    msg('Bereite Darstellung vor …');
    try { await renderer.compileAsync(scene, camera); } catch (e) { console.warn(e); }
    msg('');
  }

  // GLB-Export des aktuellen Zustands
  exp.onclick = () => {
    cols.forEach((c) => { c.visible = true; c.material = new THREE.MeshBasicMaterial({ name: 'COL' }); });
    markers.visible = false;
    new GLTFExporter().parse(root, (buf) => {
      cols.forEach((c) => { c.material = colMat; c.visible = container.querySelector('[data-t=col]').checked; });
      markers.visible = container.querySelector('[data-t=markers]').checked;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
      a.download = (m.name || 'objekt') + '.glb';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, (err) => alert('Export fehlgeschlagen: ' + err), { binary: true, onlyVisible: true });
  };

  // ---------------------------------------------------------------- Loop
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  const clock = new THREE.Clock();
  let alive = true;
  renderer.setAnimationLoop(() => {
    if (!alive) return;
    const dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    controls.update();
    const now = performance.now();
    if (roomAnims.length && animOn && placed.visible && now - animLast > 125) {   // 8 Hz
      animLast = now;
      for (const [o, fn] of roomAnims) try { fn.call(o, renderer, scene, camera, o.geometry, o.material); } catch {}
    }
    composer.render();
  });

  current = {
    dispose() {
      alive = false;
      if (api && api.close) try { api.setSound && api.setSound(false); } catch {}
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controls.dispose();
      composer.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

function countNames(root, re) { let n = 0; root.traverse((o) => { if (re.test(o.name)) n++; }); return n; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

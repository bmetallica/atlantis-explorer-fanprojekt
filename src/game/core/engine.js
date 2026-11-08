// Spielkern: Renderer, Einstellungen, Ereignisse, Dienste, Modul-Registry und Spielschleife.
// Jedes Spielmodul exportiert `init(ctx)` und liefert ein Objekt mit optional update(dt), dispose(), selbsttest().
// Vertrag und Regeln: build/ANLEITUNG_SPIEL.md
import * as THREE from 'three';

// ---------------------------------------------------------------- Einstellungen (localStorage, Änderungen als Ereignis)
const STANDARD = { hell: 6, glow: 6, stufe: 'hoch', maus: 5, fov: 70, ton: 7 };
function ladeEinstellungen() {
  try { return { ...STANDARD, ...JSON.parse(localStorage.getItem('sga-spiel') || '{}') }; } catch (e) { return { ...STANDARD }; }
}

export async function startEngine({ canvas, uiRoot, module, test = false }) {
  const events = new EventTarget();
  const on = (name, fn) => { const h = (e) => fn(e.detail); events.addEventListener(name, h); return () => events.removeEventListener(name, h); };
  const emit = (name, detail) => events.dispatchEvent(new CustomEvent(name, { detail }));

  const werte = ladeEinstellungen();
  const settings = {
    get: (k) => werte[k],
    set(k, v) { werte[k] = v; try { localStorage.setItem('sga-spiel', JSON.stringify(werte)); } catch (e) {} emit('einstellung', { key: k, value: v }); },
    alle: () => ({ ...werte }),
  };

  // ---------------------------------------------------------------- Renderer
  // Ohne gespeicherte Wahl: Onboard-Grafik (Intel, Software, integrierte AMD/ARM) startet in Grafikstufe „Niedrig“
  let gespeichert = {}; try { gespeichert = JSON.parse(localStorage.getItem('sga-spiel') || '{}'); } catch (e) {}
  if (!gespeichert.stufe) {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    if (/intel|mesa|swiftshader|llvmpipe|radeon\(tm\) graphics|vega \d+ graphics|mali|adreno/i.test(gpu)) werte.stufe = 'niedrig';
  }
  // logarithmischer Tiefenpuffer: kein Flimmern (Z-Fighting) trotz 6 km Sichtweite und 5 cm Nahebene
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: werte.stufe === 'hoch', powerPreference: 'high-performance', logarithmicDepthBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1017);
  const camera = new THREE.PerspectiveCamera(werte.fov, 1, 0.05, 6000);
  camera.layers.enable(0);
  let raumFaktor = 1;                                  // Lichtstimmung des aktuellen Raums (setzt das Streaming)
  const pixelRatio = () => werte.stufe === 'hoch' ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 1) * 0.7;
  const resize = () => {
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  };
  let aussenFaktor = 1;                                // draußen etwas weniger Belichtung (Sonne + Himmel + Spiegelungen) – Claude
  const belichtung = () => { renderer.toneMappingExposure = (0.4 + 0.1 * werte.hell) * raumFaktor * aussenFaktor; };
  resize(); belichtung();
  addEventListener('resize', resize);
  on('einstellung', ({ key }) => {
    if (key === 'hell') belichtung();
    if (key === 'stufe') resize();
    if (key === 'fov') { camera.fov = werte.fov; camera.updateProjectionMatrix(); }
  });

  // ---------------------------------------------------------------- Dienste (Module stellen APIs bereit)
  const dienste = new Map();
  const services = {
    register(name, api) { dienste.set(name, api); emit('dienst', { name }); },
    get(name) { return dienste.get(name); },
    async warte(name) { while (!dienste.has(name)) await new Promise((r) => setTimeout(r, 30)); return dienste.get(name); },
  };

  // ---------------------------------------------------------------- Eingabe (Tastenzustand + Maus; Module lesen nur)
  const tasten = new Set();
  const maus = { dx: 0, dy: 0, tasten: new Set(), gesperrt: false };
  addEventListener('keydown', (e) => { tasten.add(e.code); emit('taste', { code: e.code, unten: true, event: e }); });
  addEventListener('keyup', (e) => { tasten.delete(e.code); emit('taste', { code: e.code, unten: false, event: e }); });
  addEventListener('mousemove', (e) => { if (maus.gesperrt || test) { maus.dx += e.movementX || 0; maus.dy += e.movementY || 0; } });
  canvas.addEventListener('mousedown', (e) => { maus.tasten.add(e.button); emit('maus', { button: e.button, unten: true }); });
  addEventListener('mouseup', (e) => { maus.tasten.delete(e.button); emit('maus', { button: e.button, unten: false }); });
  document.addEventListener('pointerlockchange', () => { maus.gesperrt = document.pointerLockElement === canvas; emit('mauszeiger', { gesperrt: maus.gesperrt }); });
  const input = {
    taste: (code) => tasten.has(code),
    maus,
    nimmMaus() { const d = { dx: maus.dx, dy: maus.dy }; maus.dx = 0; maus.dy = 0; return d; },
    sperren() { if (!test) canvas.requestPointerLock?.(); },
    freigeben() { if (document.pointerLockElement) document.exitPointerLock(); },
  };

  // ---------------------------------------------------------------- Daten
  const plan = await (await fetch('/stadtplan')).json();
  const state = { modus: 'fuss', ort: 'atlantis', pause: false, spieler: { pos: new THREE.Vector3(), blick: { yaw: 0, pitch: 0 } } };
  const log = [];
  const ctx = {
    THREE, renderer, scene, camera, canvas, uiRoot, settings, services, input, plan, state, test,
    on, emit, log: (...a) => { log.push(a.join(' ')); if (log.length > 200) log.shift(); },
    setRaumFaktor(f) { raumFaktor = f; belichtung(); },
    setAussenFaktor(f) { if (Math.abs(f - aussenFaktor) > 0.002) { aussenFaktor = f; belichtung(); } },
    zeit: 0,
  };
  window.spiel = { ctx, log };
  const renderHooks = [];
  ctx.setRender = (fn) => renderHooks.push(fn);          // z. B. Nachbearbeitung (Bloom) ersetzt den Standard-Renderaufruf
  // Haken direkt nach dem Zeichnen der Szene (Tiefenpuffer noch vorhanden), z. B. Verdeckungsabfragen; Argument: Renderziel oder null
  ctx.nachSzene = [];

  // ---------------------------------------------------------------- Module starten (Reihenfolge = Liste)
  const instanzen = [];
  for (const { name, pfad } of module) {
    try {
      const m = await import(pfad);
      const inst = (await m.init(ctx)) || {};
      inst.name = name;
      instanzen.push(inst);
    } catch (e) {
      console.error(`Modul ${name} (${pfad}) konnte nicht starten:`, e);
      instanzen.push({ name, fehler: String(e) });
    }
  }

  // ---------------------------------------------------------------- Spielschleife (feste Reihenfolge, dt begrenzt)
  let last = performance.now();
  const stats = { fps: 0, frames: 0, t0: last, calls: 0 };
  renderer.info.autoReset = false;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    ctx.zeit += dt;
    for (const m of instanzen) {
      if (!m.update || (state.pause && !m.auchInPause)) continue;
      try { m.update(dt); } catch (e) { if (!m._fehler) console.error(`Modul ${m.name}.update:`, e); m._fehler = true; }
    }
    renderer.info.reset();
    if (renderHooks.length) renderHooks[renderHooks.length - 1](dt);
    else { renderer.render(scene, camera); for (const h of ctx.nachSzene) h(null); }
    stats.frames++;
    if (now - stats.t0 > 1000) { stats.fps = Math.round(stats.frames * 1000 / (now - stats.t0)); stats.frames = 0; stats.t0 = now; stats.calls = renderer.info.render.calls; emit('statistik', { ...stats }); }
  }
  requestAnimationFrame(frame);
  ctx.module = instanzen;
  ctx.stats = stats;
  window.spielBereit = true;
  emit('bereit', {});
  return ctx;
}

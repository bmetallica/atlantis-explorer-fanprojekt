// Leistungsanzeige (Taste F3): wo geht die Zeit hin? Bildzeit (Mittel/Spitze), CPU-Zeit je Spielmodul, CPU-Zeit des
// Zeichnens, GPU-Zeit (falls der Browser EXT_disjoint_timer_query_webgl2 kennt), Draw Calls, Dreiecke, Textur-Uploads,
// Shader-Programme, geladene Räume und die teuersten animierten Objekte. Nur aktiv, solange sichtbar. Geschrieben von Claude.
export function init(ctx) {
  const { renderer, scene, uiRoot } = ctx;
  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  let an = false, umhuellt = false;
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'fixed', left: '8px', top: '8px', padding: '8px 10px', background: 'rgba(5,10,18,.85)', color: '#cfe6ff',
    font: '12px/1.35 ui-monospace,monospace', whiteSpace: 'pre', zIndex: 50, pointerEvents: 'none', display: 'none',
  });
  uiRoot.appendChild(div);

  // Messwerte (über ein Fenster von ~1 s gesammelt)
  let bilder = 0, summeBild = 0, spitze = 0, letztes = performance.now(), fensterStart = letztes;
  let renderCpu = 0, gpuSumme = 0, gpuN = 0, uploads = 0;
  const modulZeit = new Map(), animZeit = new Map();
  const offeneGpu = [];
  const original = { render: null, tex: null, sub: null, updates: new Map(), anim: new Map() };

  function umhuellen() {
    if (umhuellt) return;
    umhuellt = true;
    original.render = renderer.render;
    renderer.render = function (s, k) {
      const t = performance.now();
      let q = null;
      if (ext && s === scene && !offeneGpu.length) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
      original.render.call(renderer, s, k);
      if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); offeneGpu.push(q); }
      renderCpu += performance.now() - t;
    };
    original.tex = gl.texImage2D; original.sub = gl.texSubImage2D;
    gl.texImage2D = function (...a) { uploads++; return original.tex.apply(gl, a); };
    gl.texSubImage2D = function (...a) { uploads++; return original.sub.apply(gl, a); };
    for (const m of ctx.module || []) {
      if (!m.update || m.name === 'leistung') continue;
      const u = m.update;
      original.updates.set(m, u);
      m.update = function (dt) { const t = performance.now(); u.call(m, dt); modulZeit.set(m.name, (modulZeit.get(m.name) || 0) + performance.now() - t); };
    }
    const anim = ctx.services.get('assets')?.animationen?.();
    if (anim) for (const [o, fn] of anim) {
      original.anim.set(o, fn);
      let wurzel = o; while (wurzel.parent && !wurzel.userData?.objId && !wurzel.name?.startsWith('raum_')) wurzel = wurzel.parent;
      const name = wurzel.userData?.objId || wurzel.name || o.name;
      anim.set(o, function (...a) { const t = performance.now(); fn.apply(this, a); animZeit.set(name, (animZeit.get(name) || 0) + performance.now() - t); });
    }
  }
  function abwickeln() {
    if (!umhuellt) return;
    umhuellt = false;
    renderer.render = original.render;
    gl.texImage2D = original.tex; gl.texSubImage2D = original.sub;
    for (const [m, u] of original.updates) m.update = u;
    original.updates.clear();
    const anim = ctx.services.get('assets')?.animationen?.();
    if (anim) for (const [o, fn] of original.anim) if (anim.has(o)) anim.set(o, fn);
    original.anim.clear();
  }

  ctx.on('taste', ({ code, unten, event }) => {
    if (code === 'F3') event?.preventDefault?.();      // Browser-Suche nicht öffnen
    if (!unten || code !== 'F3') return;
    an = !an;
    div.style.display = an ? 'block' : 'none';
    if (an) umhuellen(); else abwickeln();
  });

  function gpuLesen() {
    while (offeneGpu.length) {
      const q = offeneGpu[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) { gpuSumme += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; gpuN++; }
      gl.deleteQuery(q); offeneGpu.shift();
    }
  }

  return {
    auchInPause: true,
    update() {
      if (!an) return;
      const jetzt = performance.now();
      const d = jetzt - letztes; letztes = jetzt;
      bilder++; summeBild += d; spitze = Math.max(spitze, d);
      if (ext) gpuLesen();
      if (jetzt - fensterStart < 1000) return;
      // Neue Animationen (frisch geladene Räume) nachträglich erfassen
      if (umhuellt) { const anim = ctx.services.get('assets')?.animationen?.(); if (anim && anim.size !== original.anim.size) { abwickeln(); umhuellen(); } }
      const n = Math.max(1, bilder);
      const info = renderer.info;
      const module = [...modulZeit].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `  ${k.padEnd(14)} ${(v / n).toFixed(2)} ms`).join('\n');
      const anims = [...animZeit].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `  ${String(k).padEnd(14)} ${(v / n).toFixed(2)} ms`).join('\n');
      const welt = ctx.services.get('welt');
      const vd = ctx.services.get('verdeckung')?.statistik?.();
      div.textContent =
        `Bild      ${(summeBild / n).toFixed(1)} ms Mittel, Spitze ${spitze.toFixed(0)} ms  (${Math.round(1000 * n / (jetzt - fensterStart))} fps)\n` +
        `Zeichnen CPU ${(renderCpu / n).toFixed(1)} ms` + (ext ? `   GPU ${gpuN ? (gpuSumme / gpuN).toFixed(1) + ' ms' : '…'}` : '   GPU-Zeit: vom Browser nicht verfügbar') + '\n' +
        `Calls ${info.render.calls}  Dreiecke ${info.render.triangles}  Uploads/Bild ${(uploads / n).toFixed(1)}  Programme ${info.programs?.length ?? '?'}\n` +
        `Räume ${welt?.geladen?.().length ?? '?'}` + (vd ? `  verdeckt ${vd.versteckt}/${vd.kandidaten}` : '') + `  Ort ${ctx.state.spieler.pos.toArray().map((v) => v.toFixed(0)).join(',')}\n` +
        `Module (CPU je Bild):\n${module}\nTeuerste Animationen:\n${anims || '  –'}`;
      bilder = 0; summeBild = 0; spitze = 0; renderCpu = 0; gpuSumme = 0; gpuN = 0; uploads = 0; fensterStart = jetzt;
      modulZeit.clear(); animZeit.clear();
    },
  };
}

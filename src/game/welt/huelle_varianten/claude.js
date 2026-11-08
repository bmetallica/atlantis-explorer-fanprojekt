// Material der Stadt-Außenhülle (Dienst 'huelle'): ruhige, helle Metallfassaden wie in der Serie –
// durchgehende Glasbänder je Geschoss, feine Fugen, dunkler gerillter Rumpf unter dem Deck.
// Alles prozedural in Weltkoordinaten (die Hülle hat keine UVs). Geschrieben von Claude (MiniMax-Fassung SPL-009 verworfen).
import * as THREE from 'three';

const VERSION = 'huelle_claude_v4';

// Fragment-Teil: legt glas/licht fest und färbt diffuseColor; nutzt nur Weltposition + Flächennormale
const FARBE = /* glsl */ `
  vec3 hN = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
  if (dot(hN, cameraPosition - vWPos) < 0.0) hN = -hN;
  float hDist = length(vWPos - cameraPosition);
  float hNah = 1.0 - smoothstep(150.0, 650.0, hDist);          // Details nur in der Nähe
  float hY = vWPos.y;
  float hWand = 1.0 - smoothstep(0.35, 0.6, abs(hN.y));          // 1 = senkrechte Fassade
  float hUnten = step(hN.y, -0.5);
  float hU = abs(hN.x) > abs(hN.z) ? vWPos.z : vWPos.x;           // Fassadenkoordinate entlang der Wand

  // Grundfarben (Bild: helles, bläuliches Silbergrau, nach oben heller)
  float hHoch = clamp((hY - 6.0) / 320.0, 0.0, 1.0);
  vec3 cFassade = mix(vec3(0.30, 0.33, 0.41), vec3(0.44, 0.47, 0.57), hHoch);
  vec3 cDeck = mix(vec3(0.17, 0.20, 0.20), vec3(0.28, 0.30, 0.34), step(18.0, hY));
  vec3 cRumpf = vec3(0.12, 0.13, 0.15);
  vec3 c = mix(cDeck, cFassade, hWand);
  float hUnterDeck = (1.0 - smoothstep(3.0, 5.0, hY)) * hWand;
  c = mix(c, cRumpf, max(hUnterDeck, hUnten));

  // große Fassadenpaneele (Bild 3): einzelne Abschnitte dunkler/kühler, Ränder als Rippen
  float pzid = fract(sin(dot(vec2(floor(hU / 9.0), floor(hY / 36.0)), vec2(17.31, 91.7))) * 15731.7);
  c = mix(c, c * vec3(0.72, 0.74, 0.82), step(0.68, pzid) * hWand * (1.0 - hUnterDeck));

  // Fassaden über dem Deck: Geschosse à 4 m
  float gs = hY / 4.0;
  float gf = fract(gs);
  float gid = floor(gs);
  float block = floor(hU / 22.0);                                 // Fassadenabschnitte: Band läuft je Abschnitt durch
  float hb = fract(sin(dot(vec2(block, gid), vec2(12.9898, 78.233))) * 43758.5453);
  float aw = fwidth(gs) * 1.2 + 0.001;
  float band = smoothstep(0.48 - aw, 0.48 + aw, gf) - smoothstep(0.78 - aw, 0.78 + aw, gf);
  hGlas = band * step(0.22, hb) * hWand * (1.0 - hUnterDeck) * step(9.0, hY);
  // Pfosten alle 1,6 m im Glasband
  float pu = hU / 1.2;
  float pw = fwidth(pu) * 1.2 + 0.001;
  float pfosten = 1.0 - smoothstep(0.0, 0.06 + pw, min(fract(pu), 1.0 - fract(pu)));
  vec3 cGlas = vec3(0.07, 0.07, 0.16);              // bläulich-violettes Glas (Bild 3)
  float fres = pow(1.0 - clamp(dot(hN, normalize(cameraPosition - vWPos)), 0.0, 1.0), 2.0);
  cGlas = mix(cGlas, vec3(0.22, 0.27, 0.40), fres * 0.45);         // Himmel spiegelt sich flach
  c = mix(c, cGlas, hGlas * mix(0.7, 1.0, hNah) * (1.0 - pfosten * 0.7 * hNah));
  // feine Geschossfuge und senkrechte Plattenfugen (6 m), nur nah, kontrastarm
  float fuge = 1.0 - smoothstep(0.0, aw * 1.5, min(gf, 1.0 - gf));
  float vu = hU / 6.0;
  float vw = fwidth(vu) * 1.5 + 0.001;
  float vfuge = 1.0 - smoothstep(0.0, vw, min(fract(vu), 1.0 - fract(vu)));
  float wandOben = hWand * (1.0 - hUnterDeck);
  c *= 1.0 - (fuge * 0.22 + vfuge * (1.0 - hGlas) * 0.16) * hNah * wandOben;
  // einzelne beleuchtete Fenster (warm, sparsam)
  float fz = fract(sin(dot(vec2(floor(pu), gid), vec2(39.346, 11.135))) * 24634.6345);
  hLicht = step(0.955, fz) * hGlas * (1.0 - pfosten) * hNah;

  // Pier-Seitenwände: vereinzelte gelbe Lichtfelder (Bild 3, vorne links)
  float wz = fract(sin(dot(vec2(floor(hU / 3.0), floor(hY / 2.0)), vec2(5.17, 63.1))) * 7391.3);
  float wandLicht = step(0.93, wz) * hUnterDeck * step(0.5, hY) * step(fract(hY / 2.0), 0.55) * step(0.25, fract(hU / 3.0));
  c = mix(c, vec3(0.80, 0.66, 0.30), wandLicht);
  hLicht = max(hLicht, wandLicht * hNah);

  // Rumpf unter dem Deck: kräftige horizontale Rillen, unter Wasser nass-dunkel
  float rr = fract(hY / 1.5);
  c *= 1.0 - 0.22 * hUnterDeck * smoothstep(0.75, 0.85, rr) * hNah;
  c = mix(c, c * vec3(0.55, 0.68, 0.66), (1.0 - smoothstep(-1.0, 0.5, hY)) * (1.0 - hWand * 0.0));

  // Decks: große Bodenplatten (12 m), feine Fugen; selten goldene Markierungslinien
  float hDeck = (1.0 - hWand) * (1.0 - hUnten);
  vec2 pl = vWPos.xz / 12.0;
  vec2 plw = fwidth(pl) * 1.5 + 0.001;
  vec2 pf = min(fract(pl), 1.0 - fract(pl));
  float plFuge = 1.0 - smoothstep(0.0, max(plw.x, plw.y), min(pf.x, pf.y));
  c *= 1.0 - plFuge * 0.22 * hNah * hDeck;
  float gzelle = fract(sin(dot(floor(vWPos.xz / 48.0), vec2(7.13, 3.71))) * 9137.31);
  vec2 gl = fract(vWPos.xz / 48.0);
  float gold = step(0.86, gzelle) * (1.0 - smoothstep(0.0, 0.012 + plw.y * 0.25, abs(gl.y - 0.5))) * hDeck * step(hY, 20.0) * hNah;
  c = mix(c, vec3(0.78, 0.62, 0.22), gold * 0.8);

  diffuseColor.rgb = c;
`;

export function init(ctx) {
  const materialien = new Set();

  function erzeuge(hoch) {
    const m = hoch
      ? new THREE.MeshStandardMaterial({ vertexColors: false, flatShading: true, metalness: 0.35, roughness: 0.5 })
      : new THREE.MeshLambertMaterial({ vertexColors: false, flatShading: true });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      let f = 'varying vec3 vWPos;\n' + shader.fragmentShader;
      f = f.replace('#include <color_fragment>', '#include <color_fragment>\n  float hGlas = 0.0, hLicht = 0.0;\n' + FARBE);
      // Glas glatt und spiegelnd, Metall matter (nur Stufe hoch)
      f = f.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.62, 0.22, hGlas);');
      f = f.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(0.12, 0.05, hGlas);');
      f = f.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.82, 0.55) * hLicht * 0.55;');
      shader.fragmentShader = f;
    };
    m.customProgramCacheKey = () => VERSION + (hoch ? '_std' : '_lam');
    materialien.add(m);
    return m;
  }

  ctx.services.register('huelle', { material: erzeuge });
  ctx.services.get('aussen')?.neuLaden?.();   // falls die Hülle schon mit dem alten Material steht

  return {
    dispose() { for (const m of materialien) m.dispose(); materialien.clear(); },
    async selbsttest() {
      const test = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10));
      for (const hoch of [true, false]) { test.material = erzeuge(hoch); ctx.renderer.compile(test, ctx.camera); }
      const gl = ctx.renderer.getContext();
      if (gl.getError() !== gl.NO_ERROR) return { ok: false, details: 'WebGL-Fehler beim Übersetzen' };
      for (let i = 0; i < 120; i++) {
        let n = 0, eigen = 0;
        ctx.services.get('aussen')?.gruppe?.traverse((o) => { if (o.isMesh) { n++; if (o.material.customProgramCacheKey?.().startsWith(VERSION)) eigen++; } });
        if (n && n === eigen) return { ok: true, details: `Shader übersetzt; ${eigen}/${n} Hüllen-Meshes mit neuem Material` };
        await new Promise((r) => setTimeout(r, 500));
      }
      return { ok: false, details: 'Hülle nach 60 s nicht mit dem Material geladen' };
    },
  };
}

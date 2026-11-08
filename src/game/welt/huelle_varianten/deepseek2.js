// welt/huelle.js — prozedurales Material für die Außenhülle von Atlantis.
// Das Hüllennetz hat keine UVs, deshalb läuft das komplette Muster über Weltkoordinaten (vWPos)
// und die Flächennormale aus den Bildschirmableitungen. Dienst 'huelle': material(hoch) -> Material.
import * as THREE from 'three';

// Wird in BEIDE Shader nach <common> eingefügt: varying + billiger Hash.
const FRAG_KOPF = `
varying vec3 vWPos;
float huelleHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

// Wird im Fragment-Shader direkt nach <color_fragment> eingefügt (diffuseColor steht bereits, vColor ist verrechnet).
// Zonen: Deck (hellgrau, Plattenraster + sparsame Goldlinien), Fassade (grau-blau, Fenster an Türmen),
// Rumpf unter Deck (dunkel, Bänder). Alles über vWPos -> keine UVs nötig.
const FRAG_MUSTER = `
	// ---------- Außenhülle: Muster in Weltkoordinaten ----------
	vec3 hWN = normalize(cross(dFdx(vWPos), dFdy(vWPos)));   // zeigt zum Betrachter
	float hUp = hWN.y;

	// Grobe Zonen: Deck (oben), Fassade (Wand), Rumpf (unter Deck bzw. Unterseite)
	float hUnterDeck = 1.0 - smoothstep(2.0, 6.0, vWPos.y);
	float hRumpf = max(smoothstep(0.40, 0.80, -hUp), hUnterDeck);
	float hDeck  = smoothstep(0.40, 0.80, hUp) * (1.0 - hRumpf);
	float hFass  = max(0.0, 1.0 - hDeck - hRumpf);

	// Zwei Detailstufen: feine Fenster nur in der Nähe, Plattenraster auch aus der Ferne
	float hDist = distance(vWPos, cameraPosition);
	float hNah  = 1.0 - smoothstep(280.0, 750.0, hDist);
	float hFern = 1.0 - smoothstep(700.0, 2200.0, hDist);

	// Eckfarben des Modells leicht entsättigen -> einheitlicher Metallton
	vec3 hBasis = diffuseColor.rgb;
	hBasis = mix(hBasis, vec3(dot(hBasis, vec3(0.3333))), 0.15);

	// --- Decks: Plattenraster, Zellton, sparsame Goldlinien ---
	vec2 hD = vWPos.xz / 7.0;
	vec2 hDf = fract(hD);
	vec2 hDw = max(fwidth(hD) * 1.5, vec2(1e-5));
	float hDseam = max(1.0 - smoothstep(0.0, hDw.x, min(hDf.x, 1.0 - hDf.x)),
	                   1.0 - smoothstep(0.0, hDw.y, min(hDf.y, 1.0 - hDf.y)));
	float hZell = huelleHash(floor(hD));
	vec3 hDeckCol = hBasis * (0.94 + 0.14 * mix(0.5, hZell, hFern)) * (1.0 - 0.30 * hDseam);

	vec2 hG = vWPos.xz / 28.0;                       // grobes Raster (4 Platten)
	vec2 hGf = fract(hG);
	vec2 hGw = max(fwidth(hG) * 1.5, vec2(1e-5));
	float hGseam = max(1.0 - smoothstep(0.0, hGw.x, min(hGf.x, 1.0 - hGf.x)),
	                   1.0 - smoothstep(0.0, hGw.y, min(hGf.y, 1.0 - hGf.y)));
	hDeckCol = mix(hDeckCol, vec3(0.62, 0.47, 0.19),
	               hGseam * step(0.55, huelleHash(floor(hG))) * 0.50 * hFern);

	// --- Fassaden: Paneele + Fensterraster an den Türmen ---
	vec3 hT = normalize(cross(hWN, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0));
	vec2 hW = vec2(dot(vWPos, hT) / 6.5, vWPos.y / 5.0);
	vec2 hWf = fract(hW);
	vec2 hWw = max(fwidth(hW) * 1.5, vec2(1e-5));
	float hPseam = max(1.0 - smoothstep(0.0, hWw.x, min(hWf.x, 1.0 - hWf.x)),
	                   1.0 - smoothstep(0.0, hWw.y, min(hWf.y, 1.0 - hWf.y)));
	float hWin = smoothstep(0.18, 0.28, hWf.x) * (1.0 - smoothstep(0.72, 0.82, hWf.x))
	           * smoothstep(0.20, 0.30, hWf.y) * (1.0 - smoothstep(0.70, 0.80, hWf.y));
	float hTurm = smoothstep(9.0, 22.0, vWPos.y);          // nur hohe Bauten bekommen Fenster
	float hWid = huelleHash(floor(hW) + 7.3);
	float hWinGlow = step(0.78, hWid);
	vec3 hWinCol = mix(vec3(0.10, 0.13, 0.16), vec3(0.34, 0.70, 0.70), hWinGlow);

	vec3 hFassCol = hBasis * 1.06 * (1.0 - 0.16 * hPseam);
	hFassCol = mix(hFassCol, hWinCol, hWin * hTurm * 0.62 * hNah);

	// --- Rumpf: dunkle Bänder, keine Fenster ---
	float hRy = vWPos.y / 9.0;
	float hRseam = 1.0 - smoothstep(0.0, max(fwidth(hRy) * 1.5, 1e-5), min(fract(hRy), 1.0 - fract(hRy)));
	vec3 hRumpfCol = hBasis * (0.96 - 0.28 * hRseam);

	// Zonen zusammenblenden (Gewichte summieren zu 1)
	vec3 hFarbe = hDeckCol * hDeck + hFassCol * hFass + hRumpfCol * hRumpf;
	diffuseColor.rgb = hFarbe;

	// einzelne Fenster glimmen dezent türkis
	totalEmissiveRadiance += vec3(0.05, 0.15, 0.15) * (hWin * hWinGlow * hTurm * hNah * hFass);
`;

export function init(ctx) {
  // Erzeugt ein neues Material (aussen.js entsorgt alte selbst).
  function material(hoch) {
    const mat = hoch
      ? new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, metalness: 0.12, roughness: 0.62 })
      : new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    mat.name = hoch ? 'huelle_hoch' : 'huelle_niedrig';
    mat.userData.huelle = true;

    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\n\tvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + FRAG_KOPF)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG_MUSTER);
      if (hoch) {
        // Fensterflächen etwas glänzender als die Paneele
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\n\troughnessFactor = mix(roughnessFactor, 0.22, hWin * hTurm * hFass * hNah);');
      }
    };
    mat.customProgramCacheKey = () => (hoch ? 'huelle_v2_std' : 'huelle_v2_lam');
    return mat;
  }

  // Meshes aus gruppe/Array einsammeln
  function sammle(g, out) {
    if (!g) return;
    if (Array.isArray(g)) { for (const x of g) sammle(x, out); return; }
    if (g.isMesh) { out.push(g); return; }
    if (g.traverse) g.traverse((o) => { if (o.isMesh) out.push(o); });
  }

  function dispose() {
    // Nichts zu tun: die Materialien werden von aussen.js erzeugt/entsorgt.
  }

  async function selbsttest() {
    const details = [];
    let ok = true;
    try {
      const matHoch = material(true);
      const matNiedrig = material(false);

      if (!(matHoch instanceof THREE.MeshStandardMaterial)) { ok = false; details.push('material(true): kein MeshStandardMaterial'); }
      if (!(matNiedrig instanceof THREE.MeshLambertMaterial)) { ok = false; details.push('material(false): kein MeshLambertMaterial'); }
      if (matHoch.vertexColors !== true || matHoch.flatShading !== true) { ok = false; details.push('material(true): vertexColors/flatShading fehlt'); }
      if (matNiedrig.vertexColors !== true || matNiedrig.flatShading !== true) { ok = false; details.push('material(false): vertexColors/flatShading fehlt'); }
      if (matHoch === matNiedrig) { ok = false; details.push('beide Aufrufe liefern dasselbe Material'); }
      if (matHoch.customProgramCacheKey() === matNiedrig.customProgramCacheKey()) { ok = false; details.push('customProgramCacheKey nicht eindeutig'); }

      // Shader an einem Testnetz kompilieren lassen (isoliert, damit der Prüfstand schnell bleibt)
      const geo = new THREE.BoxGeometry(2, 2, 2);
      const farben = new Float32Array(geo.attributes.position.count * 3).fill(0.75);
      geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
      const testSzene = new THREE.Scene();
      testSzene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const mA = new THREE.Mesh(geo, matHoch); mA.position.set(0, 6, 0);
      const mB = new THREE.Mesh(geo, matNiedrig); mB.position.set(4, 6, 0);
      testSzene.add(mA); testSzene.add(mB);
      testSzene.updateMatrixWorld(true);
      try {
        ctx.renderer.compile(testSzene, ctx.camera);
        details.push('Shader kompiliert (Standard + Lambert)');
      } catch (e) {
        ok = false;
        details.push('compile-Fehler: ' + (e && e.message ? e.message : e));
      }
      testSzene.remove(mA); testSzene.remove(mB);
      geo.dispose();
      matHoch.dispose();
      matNiedrig.dispose();

      // Prüfen, dass die geladene Hülle unser Material trägt (asynchron, bis 60 s)
      const aussen = ctx.services.get('aussen');
      if (!aussen) {
        details.push('Dienst "aussen" fehlt – Hüllenprüfung übersprungen');
      } else {
        const meshes = [];
        const jetztMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const ende = jetztMs() + 60000;
        let eigen = 0;
        for (;;) {
          meshes.length = 0;
          sammle(aussen.gruppe, meshes);
          eigen = 0;
          for (const m of meshes) {
            const ms = Array.isArray(m.material) ? m.material : [m.material];
            for (const x of ms) if (x && x.userData && x.userData.huelle === true) { eigen++; break; }
          }
          if (meshes.length > 0 && eigen > 0) break;
          if (jetztMs() > ende) break;
          await new Promise((r) => setTimeout(r, 400));
        }
        if (meshes.length === 0) { ok = false; details.push('Hülle: keine Meshes gefunden'); }
        else if (eigen === 0) { ok = false; details.push('Hülle: ' + meshes.length + ' Meshes, keines mit Hüllenmaterial'); }
        else details.push('Hülle: ' + eigen + '/' + meshes.length + ' Meshes mit Hüllenmaterial');
      }
    } catch (e) {
      ok = false;
      details.push('Ausnahme: ' + (e && e.message ? e.message : e));
    }
    return { ok, details: details.join(' | ') };
  }

  ctx.services.register('huelle', { material });
  // Falls die Hülle schon mit einem alten Material geladen ist: neu laden lassen.
  try { ctx.services.get('aussen')?.neuLaden?.(); } catch (e) { /* egal */ }
  return { dispose, selbsttest };
}

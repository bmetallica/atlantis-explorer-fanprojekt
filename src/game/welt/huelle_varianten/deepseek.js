// welt/huelle.js — prozedurales Material für die Außenhülle von Atlantis.
// Das Netz hat keine UVs: alle Muster entstehen im Fragment-Shader aus den Weltkoordinaten
// (vWPos) und der Flächennormale (dFdx/dFdy). Dienst 'huelle': material(hoch) -> Material.
import * as THREE from 'three';

// ------------------------------------------------------------------ Shader-Bausteine
const VERT_VARYING = `
varying vec3 vWPos;
`;

const FRAG_HELFER = `
varying vec3 vWPos;

// billiger Hash
float h21( vec2 p ){ return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 ); }

// 1.0 auf der Fuge (t ganzzahlig); Kantenbreite folgt fwidth -> verschwindet in der Ferne
float fuge( float t, float w ){
	float g = abs( fract( t ) - 0.5 ) * 2.0;
	float d = max( fwidth( t ) * 2.0, 0.0015 );
	return 1.0 - smoothstep( w, w + d, g );
}

// Rechteckmaske in x zwischen a und b
float bandMaske( float x, float a, float b, float d ){
	return smoothstep( a - d, a + d, x ) * ( 1.0 - smoothstep( b - d, b + d, x ) );
}
`;

// ------------------------------------------------------------------ Farb-/Musterteil
const FARB_CHUNK = `
	// ============ prozedurale Hülle (Weltkoordinaten, keine UVs) ============
	vec3  nrm  = normalize( cross( dFdx( vWPos ), dFdy( vWPos ) ) );
	float y    = vWPos.y;
	float dist = length( vWPos - cameraPosition );
	float nah  = 1.0 - smoothstep( 150.0, 320.0, dist );   // feine Fugen/Platten
	float fern = 1.0 - smoothstep( 430.0, 850.0, dist );   // Fensterbänder/Akzente
#if defined( USE_COLOR )
	float lum  = clamp( dot( vColor.rgb, vec3( 0.299, 0.587, 0.114 ) ), 0.0, 1.0 );
#else
	float lum  = 0.55;
#endif

	// Laufkoordinate entlang senkrechter Flächen
	vec2  t2 = nrm.xz;
	float u  = ( vWPos.z * t2.x - vWPos.x * t2.y ) / max( length( t2 ), 1e-3 );

	// Bereiche: Deck (flach, y ≈ 6), Fassade (senkrecht über Deck), Rumpf (unter Deck)
	float flach    = smoothstep( 0.60, 0.90, abs( nrm.y ) );
	float obenH    = smoothstep( 4.0, 5.8, y );
	float obenV    = smoothstep( 5.8, 6.8, y );
	float oben     = mix( obenV, obenH, flach );
	float deckArt  = flach * ( 1.0 - smoothstep( 16.0, 34.0, y ) );
	float istDeck  = oben * deckArt;
	float istFass  = oben * ( 1.0 - deckArt );
	float istRumpf = 1.0 - oben;

	vec3  emiss = vec3( 0.0 );
	float glasM = 0.0;

	// ============================ Türme / Fassaden ============================
	// ruhiges, helles bläulich-silbernes Metall, nach oben heller
	vec3 farbFass = mix( vec3( 0.28, 0.31, 0.36 ), vec3( 0.46, 0.49, 0.55 ),
	                     smoothstep( 12.0, 220.0, y ) );

	// große, ganze Fassadenabschnitte leicht abgesetzt (Bild 3)
	float sect = floor( u / 22.0 );
	float pv   = h21( vec2( sect, 7.3 ) );
	farbFass  *= mix( 1.0, 0.84, step( 0.62, pv ) );
	farbFass.b *= mix( 1.0, 1.06, step( 0.62, pv ) );

	// Paneelraster: vertikale Fugen ~4,5 m, Geschossfugen 4 m (nur in der Nähe)
	farbFass *= 1.0 - 0.22 * max( fuge( u / 4.5, 0.030 ), fuge( y / 4.0, 0.026 ) ) * nah;

	// Fensterband je Geschoss — durchgehend über den ganzen Abschnitt, nur durch Pfosten geteilt
	float gesch = floor( y / 4.0 );
	float lokal = fract( y / 4.0 );
	float b0    = 0.28 + 0.08 * h21( vec2( gesch, 3.1 ) );    // je Geschoss gleiche Höhe
	float dl    = max( fwidth( lokal ), 0.004 );
	float band  = bandMaske( lokal, b0, b0 + 0.40, dl );
	float abschnitt = step( h21( vec2( sect, 17.0 ) ), 0.88 ); // ganze Abschnitte ohne Band
	glasM = band * abschnitt * ( 1.0 - 0.90 * fuge( u / 2.7, 0.05 ) );  // schmale helle Pfosten

	// Glas bläulich-violett, dunkler als die Fassade, aber nicht schwarz
	vec3 farbGlas = vec3( 0.10, 0.11, 0.21 ) * ( 0.85 + 0.35 * h21( vec2( sect, gesch + 5.0 ) ) );
	farbFass = mix( farbFass, farbGlas, glasM * fern );

	// ca. 10 % der Fenster leuchten warm (dezente Emission)
	float zelle = floor( u / 2.7 );
	float warm  = step( 0.90, h21( vec2( zelle * 1.3 + 0.7, gesch * 5.1 + 2.0 ) ) );
	emiss += glasM * warm * fern * vec3( 0.75, 0.60, 0.34 ) * 0.50;

	// schmale türkis leuchtende Glasflächen (sparsam, nur oberhalb y = 40)
	float uc   = fract( u / 22.0 ) * 22.0;
	float zent = 4.0 + 12.0 * h21( vec2( sect, 13.0 ) );
	float dw   = max( fwidth( u ), 0.25 ) * 1.5;
	float tuerkis = ( 1.0 - smoothstep( 1.2, 1.2 + dw, abs( uc - zent ) ) )
	              * step( h21( vec2( sect, 11.0 ) ), 0.16 )
	              * smoothstep( 40.0, 55.0, y ) * fern;
	farbFass = mix( farbFass, vec3( 0.06, 0.30, 0.30 ), tuerkis * 0.85 );
	emiss += tuerkis * vec3( 0.05, 0.42, 0.40 ) * 0.50;

	// ============================ Decks / Plattformen ============================
	const float PL = 12.0;
	vec2  pl = floor( vec2( vWPos.x, vWPos.z ) / PL );
	vec3  farbDeck = vec3( 0.135, 0.150, 0.140 ) * ( 0.90 + 0.20 * h21( pl + 3.0 ) );
	farbDeck *= 1.0 - 0.35 * max( fuge( vWPos.x / PL, 0.016 ), fuge( vWPos.z / PL, 0.016 ) ) * nah;
	farbDeck *= 1.0 - 0.15 * fuge( ( vWPos.x + vWPos.z ) / 37.0, 0.012 ) * nah;   // vereinzelte Wege

	// goldgelbe Markierungen (ca. 2,5 %)
	vec2  inPl   = fract( vec2( vWPos.x, vWPos.z ) / PL );
	float gold   = step( 0.975, h21( pl + 21.0 ) );
	float strich = step( abs( inPl.y - 0.5 ), 0.050 ) * step( abs( inPl.x - 0.5 ), 0.250 );
	float punkt  = 1.0 - smoothstep( 0.045, 0.085, length( inPl - 0.5 ) );
	gold *= max( strich, punkt ) * nah;
	farbDeck = mix( farbDeck, vec3( 0.50, 0.38, 0.09 ), gold * 0.80 );
	emiss += gold * vec3( 0.20, 0.15, 0.03 );

	// ============================ Rumpf / Pier-Wände ============================
	vec3 farbRumpf = mix( vec3( 0.040, 0.050, 0.044 ), vec3( 0.080, 0.090, 0.095 ),
	                      smoothstep( -25.0, 3.0, y ) );
	farbRumpf *= 1.0 - 0.40 * fuge( y / 3.2, 0.050 ) * nah;                       // kräftige Rillen
	farbRumpf *= 1.0 - 0.10 * fuge( u / 7.0, 0.020 ) * nah;

	// vereinzelte gelbe Lichtfelder
	float feld  = step( 0.955, h21( vec2( floor( u / 6.0 ), floor( y / 3.2 ) + 31.0 ) ) ) * nah;
	vec2  inF   = fract( vec2( u / 6.0, y / 3.2 ) );
	float feldM = step( 0.28, inF.x ) * step( inF.x, 0.72 ) * step( 0.32, inF.y ) * step( inF.y, 0.78 );
	farbRumpf = mix( farbRumpf, vec3( 0.42, 0.34, 0.10 ), feld * feldM * 0.90 );
	emiss += feld * feldM * vec3( 0.24, 0.18, 0.03 );

	// ============================ Zusammen ============================
	vec3 huelle = farbFass * istFass + farbDeck * istDeck + farbRumpf * istRumpf;
	huelle *= 0.90 + 0.20 * lum;                             // Eckfarben des Netzes dezent mitnehmen
	diffuseColor.rgb = huelle;
	totalEmissiveRadiance += emiss;
`;

// ------------------------------------------------------------------ Modul
export function init(ctx) {
  const erzeugte = new Set();

  function material(hoch) {
    const m = hoch
      ? new THREE.MeshStandardMaterial({
          vertexColors: true, flatShading: true, dithering: true,
          metalness: 0.10, roughness: 0.55,
        })
      : new THREE.MeshLambertMaterial({
          vertexColors: true, flatShading: true, dithering: true,
        });

    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + VERT_VARYING)
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\n\tvWPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + FRAG_HELFER)
        .replace('#include <color_fragment>', FARB_CHUNK);

      if (hoch) {
        // Metallanteil bewusst niedrig (heller Himmel), Glas etwas glatter
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <roughnessmap_fragment>',
            '#include <roughnessmap_fragment>\n' +
            '\troughnessFactor = mix( roughnessFactor, 0.28, glasM * istFass );\n' +
            '\troughnessFactor = mix( roughnessFactor, 0.78, istDeck );\n' +
            '\troughnessFactor = mix( roughnessFactor, 0.88, istRumpf );')
          .replace('#include <metalnessmap_fragment>',
            '#include <metalnessmap_fragment>\n' +
            '\tmetalnessFactor = mix( metalnessFactor, 0.22, glasM * istFass );\n' +
            '\tmetalnessFactor = mix( metalnessFactor, 0.03, istDeck );\n' +
            '\tmetalnessFactor = mix( metalnessFactor, 0.06, istRumpf );');
      }
    };

    m.customProgramCacheKey = () => (hoch ? 'huelle_v1_std' : 'huelle_v1_lam');
    erzeugte.add(m);
    return m;
  }

  ctx.services.register('huelle', { material });

  // Falls die Hülle schon mit dem alten Material geladen ist, neu laden lassen.
  ctx.services.get('aussen')?.neuLaden?.();

  function dispose() {
    for (const m of erzeugte) m.dispose();
    erzeugte.clear();
  }

  const istUnseres = (m) => !!m && (
    erzeugte.has(m) ||
    (typeof m.customProgramCacheKey === 'function' &&
      String(m.customProgramCacheKey()).indexOf('huelle_v1') === 0)
  );

  async function selbsttest() {
    const details = [];
    let ok = true;

    // 1) beide Materialvarianten
    const hochM = material(true);
    const niedM = material(false);
    if (!hochM.isMeshStandardMaterial || !hochM.vertexColors || !hochM.flatShading) {
      ok = false; details.push('hoch: nicht MeshStandardMaterial/vertexColors/flatShading');
    }
    if (!niedM.isMeshLambertMaterial || !niedM.vertexColors || !niedM.flatShading) {
      ok = false; details.push('niedrig: nicht MeshLambertMaterial/vertexColors/flatShading');
    }
    if (hochM.customProgramCacheKey() === niedM.customProgramCacheKey()) {
      ok = false; details.push('customProgramCacheKey nicht eindeutig');
    }

    // 2) Shader kompilieren: Test-Meshes ohne UVs, mit Eckfarben (3 und 4 Komponenten
    //    -> USE_COLOR und USE_COLOR_ALPHA, vColor ist dann vec3 bzw. vec4)
    const szene = new THREE.Scene();
    const testKamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    testKamera.position.set(6, 6, 6);
    testKamera.lookAt(0, 3, 0);
    const testGeos = [];
    for (const m of [hochM, niedM]) {
      for (const n4 of [3, 4]) {
        const g = new THREE.BoxGeometry(4, 4, 4);
        const n = g.attributes.position.count;
        const arr = new Float32Array(n * n4);
        for (let i = 0; i < n; i++) {
          arr[i * n4] = 0.5; arr[i * n4 + 1] = 0.5; arr[i * n4 + 2] = 0.5;
          if (n4 === 4) arr[i * n4 + 3] = 1.0;
        }
        g.setAttribute('color', new THREE.BufferAttribute(arr, n4));
        const mesh = new THREE.Mesh(g, m);
        mesh.position.y = 3;
        szene.add(mesh);
        testGeos.push(g);
      }
    }
    try {
      ctx.renderer.compile(szene, testKamera);
      details.push('compile ok');
    } catch (e) {
      ok = false;
      details.push('compile: ' + (e && e.message ? e.message : String(e)));
    }
    for (const g of testGeos) g.dispose();
    szene.clear();

    // 3) Tragen die Meshes der Hülle unser Material? (asynchron, bis 60 s)
    let gruppe = null, meshes = 0, mitUnserem = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      const a = ctx.services.get('aussen');
      gruppe = a && a.gruppe ? a.gruppe : null;
      if (gruppe) {
        meshes = 0; mitUnserem = 0;
        gruppe.traverse((o) => {
          if (!o.isMesh) return;
          meshes++;
          const mat = o.material;
          if (Array.isArray(mat)) { if (mat.some(istUnseres)) mitUnserem++; }
          else if (istUnseres(mat)) mitUnserem++;
        });
        if (meshes > 0 && mitUnserem > 0) break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!gruppe) { ok = false; details.push('aussen.gruppe nicht gefunden'); }
    else if (meshes === 0) { ok = false; details.push('Hülle ohne Meshes'); }
    else if (mitUnserem === 0) { ok = false; details.push('kein Mesh trägt das Hüllenmaterial (' + meshes + ' Meshes)'); }
    else details.push('Hülle: ' + mitUnserem + '/' + meshes + ' Meshes mit Hüllenmaterial');

    return { ok, details: details.join(' | ') };
  }

  return { dispose, selbsttest };
}

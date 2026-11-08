// welt/huelle.js — SPL-009 (überarbeitet nach Prüflauf)
// Prozedurales Material für die Stadt-Außenhülle: Deck-Platten mit Fugen und Gold-Akzenten,
// Fensterraster auf Fassaden (himmelreflektierendes Glas, seltene türkise Fenster, Ref 2),
// dunkler, aber strukturierter Rumpf unter dem Deck (Ref 1/2), silbrige Türme (Ref 3).
//
// Fixes gegenüber dem Vorstand:
//  - Grundmetallness auf ~0 gesenkt: ohne EnvMap wurde die ganze Stadt durch metalness 0.22
//    abgedunkelt (Fotos wirkten schwarz-grau statt silbern).
//  - Fensterglas deutlich heller (Himmelsblau-Grau statt fast schwarz) → Türme wirken silbrig
//    mit dunklerem Fenstergitter wie in Ref 3, nicht wie Lochblech.
//  - Musterkontraste reduziert (Deck & Wände), Fugen heller → keine gesprenkelte Dunkelfläche.
//  - Distanz-Fade des Fensterrasters (ab ~120 m): entfernt das Moiré/Punktrauschen in der
//    Totale (Foto 1), leuchtende Fenster bleiben als Fern-Punkte erhalten (wie Ref 2).
//  - Leuchtende Fenster in Clustern (grobrastriger Hash) statt gleichverteilter Einzelpunkte.
// Alles per onBeforeCompile auf Weltkoordinaten (vWPos) — keine UVs, keine Texturen.
// Facettennormale aus Bildschirmableitungen → saubere Flachflächen unabhängig von Vertexnormalen.
import * as THREE from 'three';

// Gemeinsame Header: Weltposition als varying + billiger Hash (kein sin, keine Oktaven)
const VAR = 'varying vec3 vWPos;\n';
const GLSL_HASH = `
float hHash( vec2 p ) {
  p = fract( p * vec2( 127.1, 311.7 ) );
  p += dot( p, p + 34.51 );
  return fract( p.x * p.y );
}
`;

// Vertex: Weltposition je Eckpunkt
const GLSL_VERT = `
#include <begin_vertex>
vWPos = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
`;

// Fragment-Muster, nach color_fragment (Vertexfarben sind dann schon in diffuseColor).
// wN / huelleWin / huelleGlow bleiben im Geltungsbereich von main für die späteren Ersätze.
const GLSL_MUSTER = `
vec3 wN = normalize( cross( dFdx( vWPos ), dFdy( vWPos ) ) );
if ( ! gl_FrontFacing ) wN = -wN;
float huelleWin = 0.0;
float huelleGlow = 0.0;
{
  float wy = vWPos.y;
  float detail = 1.0 - smoothstep( 120.0, 420.0, length( vViewPosition ) );
  vec3 base = diffuseColor.rgb;
  vec3 col = base;
  if ( abs( wN.y ) > 0.55 ) {
    // Horizontale Flächen: Deck/Plaza als Plattenfelder (~7 m) mit Fugen, hell wie Ref 1
    vec2 q = vWPos.xz * 0.14 + wy * 0.037;
    vec2 id = floor( q );
    vec2 f = fract( q );
    float d = min( min( f.x, 1.0 - f.x ), min( f.y, 1.0 - f.y ) );
    float h = hHash( id );
    float a = hHash( id + 41.37 );
    col = base * ( 0.92 + 0.16 * h );
    col *= mix( 1.0, 0.62, step( d, 0.05 ) );            // Fugen
    float hullD = 1.0 - smoothstep( 1.0, 3.0, wy );       // Rumpf-Deckflächen dunkler
    col = mix( col, base * vec3( 0.30, 0.32, 0.37 ), hullD );
    if ( a > 0.965 && hullD < 0.5 ) col = mix( col, vec3( 0.75, 0.62, 0.24 ), 0.7 ); // Gold-Oliv (Ref 1)
  } else {
    // Fassaden: Fensterraster (3.2 m × 3.6 m), Achse nach Dominanzrichtung der Normale
    vec2 p2 = mix( vWPos.zy, vWPos.xy, step( abs( wN.z ), abs( wN.x ) ) );
    vec2 q = p2 * vec2( 0.31, 0.28 );
    vec2 id = floor( q );
    vec2 f = fract( q );
    float win = step( 0.16, f.x ) * step( f.x, 0.84 ) * step( 0.24, f.y ) * step( f.y, 0.78 );
    float h = hHash( id );
    // Leuchtende Fenster in Clustern (grobes Raster entscheidet über beleuchteten Abschnitt)
    float cl = hHash( floor( id * 0.125 ) + 7.7 );
    float lit = step( 0.55, cl ) * step( 0.80, h );
    float hull = 1.0 - smoothstep( 1.5, 3.5, wy );        // Rumpfwände unter dem Deck
    vec3 wall = base * ( 0.95 + 0.20 * hHash( id + 17.71 ) );
    wall *= mix( 0.78, 1.0, smoothstep( 0.0, 9.0, wy ) ); // milde Abdunklung an der Basis
    wall *= mix( 1.0, 1.12, smoothstep( 12.0, 80.0, wy ) ); // Türme heller/silbriger (Ref 3)
    wall = mix( wall, base * vec3( 0.38, 0.41, 0.47 ), hull );
    // Glas wie Himmelsreflexion (Ref 3): mittel-hell blaugrau, leuchtende Fenster türkis (Ref 2)
    vec3 glass = mix( vec3( 0.30, 0.37, 0.45 ), vec3( 0.50, 0.95, 0.88 ), lit );
    float m = win * ( 1.0 - hull * 0.85 ) * detail;       // Raster in der Ferne ausblenden
    col = mix( wall, glass, m );
    huelleWin = m;
    huelleGlow = lit * win * ( 1.0 - hull );              // Fernleuchten bleibt erhalten
  }
  diffuseColor.rgb = col;
}
`;

// Normale aus Facette (Welt→View); ersetzt normal_fragment_begin komplett
const GLSL_NORMAL = `
vec3 normal = normalize( mat3( viewMatrix ) * wN );
vec3 nonPerturbedNormal = normal;
`;

// Leuchtende Fenster als Emissiv (nur Standard/Lambert mit Emissiv-Zweig)
const GLSL_EMISSIVE = `
#include <emissivemap_fragment>
totalEmissiveRadiance += vec3( 0.10, 0.62, 0.55 ) * ( huelleGlow * 1.2 );
`;

// Fenster glatt & leicht metallisch (Glaswirkung, Ref 3) — nur Standard
// Basis bleibt diffus (metalness ~0): ohne EnvMap würde höhere Metallness die Stadt schwärzen.
const GLSL_ROUGH = '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.22, huelleWin * 0.85 );';
const GLSL_METAL = '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.30, huelleWin * 0.85 );';

// Neues Material je Aufruf (aussen.js entsorgt alte selbst)
function baue(hoch) {
  const mat = hoch
    ? new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.0 })
    : new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  mat.name = hoch ? 'huelle_std' : 'huelle_lam';
  mat.userData.huelle = true;
  mat.customProgramCacheKey = () => (hoch ? 'huelle_v2_std' : 'huelle_v2_lam');
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = VAR + shader.vertexShader.replace('#include <begin_vertex>', GLSL_VERT);
    let fs = VAR + GLSL_HASH + shader.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_MUSTER)
      .replace('#include <normal_fragment_begin>', GLSL_NORMAL);
    if (fs.includes('emissivemap_fragment')) fs = fs.replace('#include <emissivemap_fragment>', GLSL_EMISSIVE);
    fs = fs.replace('#include <roughnessmap_fragment>', GLSL_ROUGH)
           .replace('#include <metalnessmap_fragment>', GLSL_METAL);
    shader.fragmentShader = fs;
  };
  return mat;
}

export function init(ctx) {
  ctx.services.register('huelle', { material: baue });
  // Falls die Hülle schon mit dem alten (einfarbigem) Material geladen ist: neu laden
  const aussen = ctx.services.get('aussen');
  if (aussen && typeof aussen.neuLaden === 'function') aussen.neuLaden();

  async function selbsttest() {
    const fehler = [];
    // 1) Beide Materialien erzeugen und Eigenschaften prüfen
    let mh = null, ml = null;
    try {
      mh = baue(true); ml = baue(false);
      if (!(mh instanceof THREE.MeshStandardMaterial) || !mh.vertexColors || !mh.flatShading) fehler.push('Standard-Material unvollständig');
      if (!(ml instanceof THREE.MeshLambertMaterial) || !ml.vertexColors || !ml.flatShading) fehler.push('Lambert-Material unvollständig');
      if (mh.customProgramCacheKey() === ml.customProgramCacheKey()) fehler.push('customProgramCacheKey nicht eindeutig');
      // Jeder Aufruf muss ein neues Material liefern (aussen.js entsorgt alt selbst)
      if (baue(true) === mh) fehler.push('material() liefert dieselbe Instanz');
    } catch (e) { fehler.push('Materialerzeugung fehlgeschlagen: ' + (e && e.message)); }
    // 2) Kompilieren + echtes Rendern mit Test-Mesh (Vertexfarben) ohne Fehler
    if (mh && ml) {
      try {
        const g = new THREE.PlaneGeometry(1, 1);
        const n = g.attributes.position.count;
        const farben = new Float32Array(n * 3).fill(0.7);
        g.setAttribute('color', new THREE.BufferAttribute(farben, 3));
        const szene = new THREE.Scene();
        szene.add(new THREE.AmbientLight(0xffffff, 1));
        const kam = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
        kam.position.set(0, 0, 2);
        for (const m of [mh, ml]) {
          const mesh = new THREE.Mesh(g, m);
          szene.add(mesh);
          ctx.renderer.compile(szene, kam);
          ctx.renderer.render(szene, kam);
          szene.remove(mesh);
        }
        g.dispose();
      } catch (e) { fehler.push('Shader-Kompilierung fehlgeschlagen: ' + (e && e.message)); }
    }
    // 3) Hüllen-Meshes tragen unser Material (Hülle lädt asynchron, bis 60 s warten)
    const start = Date.now();
    let gefunden = false;
    while (Date.now() - start < 60000) {
      const a = ctx.services.get('aussen');
      if (a && a.gruppe) {
        let ok = false;
        a.gruppe.traverse((o) => { if (o.isMesh && o.material && o.material.userData && o.material.userData.huelle) ok = true; });
        if (ok) { gefunden = true; break; }
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!gefunden) fehler.push('Hüllen-Meshes tragen das huelle-Material nicht (nach 60 s)');
    return { ok: fehler.length === 0, details: fehler.length ? fehler.join('; ') : 'Materialien erzeugt, kompiliert, Hülle trägt Material' };
  }

  function dispose() {
    // Materialien gehören aussen.js (wird dort entsorgt); hier ist nichts persistent
  }

  return { dispose, selbsttest };
}

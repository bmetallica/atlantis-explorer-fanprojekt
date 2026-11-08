// welt/huelle.js — prozedurales Material für die Außenhülle von Atlantis.
import * as THREE from 'three';

// Billiger Hash für stabile Zufallsentscheidungen (keine Schleifen, keine Rausch-Oktaven).
const HASH_FN = `
float huelleHash(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + vec3(33.33));
  return fract((p3.x + p3.y) * p3.z);
}
`;

// Muster in Weltkoordinaten. Wird direkt nach <color_fragment> eingefügt.
const MUSTER = `
vec3 hp = vWPos;
float hDist = distance(hp, cameraPosition);
vec3 hn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
float hUp = abs(hn.y);

float hVertical = 1.0 - step(0.62, hUp);
float hDeckMask = step(6.0, hp.y) * step(0.62, hUp);
float hFacadeMask = step(6.0, hp.y) * hVertical;
float hHullMask = 1.0 - step(6.0, hp.y);

#if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
  vec3 hGeoColor = clamp(vColor.rgb, 0.0, 1.0);
#else
  vec3 hGeoColor = vec3(0.55);
#endif
vec3 huelleGeoTint = mix(vec3(1.0),
  hGeoColor / max(max(hGeoColor.r, hGeoColor.g), max(hGeoColor.b, 0.001)), 0.08);

// Feine Details verschwinden in der Ferne, Glasbänder bleiben angedeutet sichtbar.
float hFineFade = 1.0 - smoothstep(150.0, 450.0, hDist);

float huelleWarm = 0.0;
float huelleTurquoise = 0.0;
float huelleHullLamp = 0.0;
float huelleFassade = 0.0;
float huelleDeck = 0.0;
vec3 huelleColor = vec3(0.06);

// Horizontale Flächenachse; Fugen und Bänder folgen der Gebäudefläche.
float huelleU = abs(hn.x) >= abs(hn.z) ? hp.z : hp.x;

if (hFacadeMask > 0.5) {
  // --- Fassaden: helles, bläuliches Silbergrau, nach oben heller ---
  huelleFassade = 1.0;
  float hHeight = clamp((hp.y - 6.0) / 240.0, 0.0, 1.0);
  vec3 hF = mix(vec3(0.300, 0.330, 0.410), vec3(0.440, 0.470, 0.570), hHeight);

  // Große, leicht dunklere/kühlere Paneele (9 m breit, 36 m hoch).
  float hPanelU = floor(huelleU / 9.0);
  float hPanelY = floor((hp.y - 6.0) / 36.0);
  float hPanelSeed = huelleHash(vec2(hPanelU, hPanelY) + vec2(17.0, 41.0));
  float hCoolPanel = 1.0 - step(0.55, hPanelSeed);
  hF *= mix(vec3(1.0), vec3(0.88, 0.92, 1.03), hCoolPanel);

  // Geschossfugen (4 m) und vertikale Pfostenfugen (4,5 m), kontrastarm.
  float hStoryCoord = (hp.y - 6.0) / 4.0;
  float hStoryFrac = fract(hStoryCoord);
  float hAAY = clamp(fwidth(hStoryCoord) * 0.5, 0.001, 0.06);
  float hSeamY = 1.0 - smoothstep(0.006, 0.020 + hAAY, min(hStoryFrac, 1.0 - hStoryFrac));
  float hSeamCoord = huelleU / 4.5;
  float hSeamFrac = fract(hSeamCoord);
  float hAAU = clamp(fwidth(hSeamCoord) * 0.5, 0.001, 0.06);
  float hSeamV = 1.0 - smoothstep(0.004, 0.016 + hAAU, min(hSeamFrac, 1.0 - hSeamFrac));
  hF *= 1.0 - 0.07 * max(hSeamY, hSeamV) * hFineFade;

  // --- Glasbänder: durchgehend über einen Fassadenabschnitt (~20 m) ---
  float hStory = floor(hStoryCoord);
  float hSection = floor(huelleU / 20.0);
  // Abschnittsentscheidung nur pro Abschnitt (nicht pro Geschoss) → Bänder laufen durchgehend.
  float hSectionSeed = huelleHash(vec2(hSection, 3.17) + vec2(11.0, 5.0));
  float hHasGlass = 1.0 - step(0.62, hSectionSeed); // ca. 62 % der Abschnitte

  // Band über ~30 % der Geschosshöhe, Höhe je Geschoss gleich.
  float hBand = smoothstep(0.15 - hAAY, 0.15 + hAAY, hStoryFrac)
              * (1.0 - smoothstep(0.45 - hAAY, 0.45 + hAAY, hStoryFrac));

  // Schmale helle Pfosten alle ~1,2 m innerhalb des Bandes.
  float hCellCoord = huelleU / 1.2;
  float hCellFrac = fract(hCellCoord);
  float hCellEdge = min(hCellFrac, 1.0 - hCellFrac);
  float hAAU2 = clamp(fwidth(hCellCoord) * 0.5, 0.001, 0.08);
  float hPost = 1.0 - smoothstep(0.020, 0.050 + hAAU2, hCellEdge);
  hPost *= 1.0 - smoothstep(260.0, 520.0, hDist);

  float hGlassMask = hHasGlass * hBand;
  vec3 hGlass = mix(vec3(0.070, 0.075, 0.165), vec3(0.100, 0.085, 0.195),
                    fract(hSectionSeed * 23.17));
  hF = mix(hF, hGlass, hGlassMask * 0.92);
  hF = mix(hF, hF * 1.25 + vec3(0.040, 0.042, 0.048), hGlassMask * hPost);

  // ca. 10 % der Fensterfelder leuchten dezent warm.
  float hWarmSeed = huelleHash(vec2(floor(hCellCoord), hStory) + vec2(19.3, 73.7));
  huelleWarm = hGlassMask * (1.0 - hPost) * (1.0 - step(0.10, hWarmSeed))
             * (1.0 - smoothstep(700.0, 1100.0, hDist));
  hF = mix(hF, vec3(0.72, 0.55, 0.30), huelleWarm * 0.90);

  // --- Sparsame türkise Glasflächen an Fronten oberhalb y = 40 ---
  float hAccentRow = floor((hp.y - 40.0) / 14.0);
  float hAccentSeed = huelleHash(vec2(hSection, hAccentRow) + vec2(67.3, 13.9));
  float hR1 = fract(hAccentSeed * 13.71);
  float hR2 = fract(hAccentSeed * 29.37);
  float hAccentU = hSection * 20.0 + 3.0 + hR1 * 14.0;
  float hAccentY = 40.0 + hAccentRow * 14.0 + 3.0 + hR2 * 8.0;
  float hAccentRect =
      (1.0 - smoothstep(0.60, 0.78, abs(huelleU - hAccentU)))
    * (1.0 - smoothstep(2.40, 2.60, abs(hp.y - hAccentY)));
  float hFront = smoothstep(0.10, 0.55, abs(hn.z));
  huelleTurquoise = (1.0 - step(0.10, hAccentSeed)) * hAccentRect * hFront
                  * step(40.0, hp.y) * (1.0 - smoothstep(650.0, 1000.0, hDist));
  hF = mix(hF, vec3(0.060, 0.470, 0.390), huelleTurquoise * 0.92);

  huelleColor = hF;
} else if (hDeckMask > 0.5) {
  // --- Deck: dunkleres, leicht grünliches Schiefergrau mit großen Platten ---
  huelleDeck = 1.0;
  vec2 hPlate = floor(hp.xz / 12.0);
  vec2 hPlateFrac = fract(hp.xz / 12.0);
  vec2 hPlateEdge = min(hPlateFrac, 1.0 - hPlateFrac);
  float hPlateSeed = huelleHash(hPlate + vec2(31.7, 9.2));

  vec3 hD = vec3(0.200, 0.230, 0.230) * mix(0.90, 1.10, hPlateSeed);

  float hAAX = clamp(fwidth(hp.x / 12.0) * 0.5, 0.001, 0.08);
  float hAAZ = clamp(fwidth(hp.z / 12.0) * 0.5, 0.001, 0.08);
  float hSeamX = 1.0 - smoothstep(0.001, 0.006 + hAAX, hPlateEdge.x);
  float hSeamZ = 1.0 - smoothstep(0.001, 0.006 + hAAZ, hPlateEdge.y);
  hD *= 1.0 - 0.14 * max(hSeamX, hSeamZ) * hFineFade;

  // Vereinzelte Wege/Linien.
  float hLineX = floor(hp.x / 12.0 + 0.5);
  float hLineZ = floor(hp.z / 12.0 + 0.5);
  float hRouteSeed = huelleHash(vec2(hLineX, hLineZ) + vec2(71.2, 13.9));
  float hPathX = 1.0 - smoothstep(0.05, 0.14, abs(hp.x - hLineX * 12.0));
  float hPathZ = 1.0 - smoothstep(0.05, 0.14, abs(hp.z - hLineZ * 12.0));
  float hPath = max(hPathX * (1.0 - step(0.16, hRouteSeed)),
                    hPathZ * (1.0 - step(0.16, fract(hRouteSeed * 37.13))));
  hD = mix(hD, vec3(0.255, 0.285, 0.280), hPath * 0.45 * hFineFade);

  // Goldgelbe Markierungen: nur ca. 3 % der Platten.
  float hGoldSeed = huelleHash(hPlate + vec2(51.2, 83.7));
  float hGoldR1 = fract(hGoldSeed * 19.7);
  float hGoldR2 = fract(hGoldSeed * 43.1);
  float hGoldX = 2.0 + hGoldR1 * 8.0;
  float hGoldY = 2.0 + hGoldR2 * 8.0;
  float hGoldStripe =
      (1.0 - smoothstep(0.025, 0.045, abs(hPlateFrac.x - hGoldX)))
    * (1.0 - smoothstep(0.100, 0.150, abs(hPlateFrac.y - hGoldY)));
  float hDotX = clamp(hGoldX - 3.0, 1.0, 10.0);
  float hDotY = clamp(hGoldY - 2.0, 1.0, 10.0);
  float hGoldDot =
      (1.0 - smoothstep(0.018, 0.034, abs(hPlateFrac.x - hDotX)))
    * (1.0 - smoothstep(0.018, 0.034, abs(hPlateFrac.y - hDotY)));
  float hGold = (1.0 - step(0.03, hGoldSeed))
              * max(hGoldStripe, hGoldDot * step(0.55, hGoldR1))
              * hFineFade;
  hD = mix(hD, vec3(0.85, 0.55, 0.08), hGold);

  huelleColor = hD;
} else {
  // --- Rumpf und Pierflächen unter dem Deck: dunkles Anthrazit mit Rillen ---
  float hHullY = floor((hp.y + 125.0) / 18.0);
  float hHullSeed = huelleHash(vec2(floor(huelleU / 12.0), hHullY) + vec2(23.7, 91.2));
  vec3 hH = vec3(0.078, 0.085, 0.095) * mix(0.85, 1.15, hHullSeed);

  float hRibFrac = fract((hp.y + 125.0) / 2.4);
  float hRibEdge = min(hRibFrac, 1.0 - hRibFrac);
  float hRibAA = clamp(fwidth(hp.y / 2.4) * 0.5, 0.001, 0.08);
  float hRib = 1.0 - smoothstep(0.012, 0.040 + hRibAA, hRibEdge);
  hH *= 1.0 - 0.40 * hRib * (1.0 - smoothstep(240.0, 480.0, hDist));

  // Unter Wasser leicht grünlich (nass).
  float hWet = 1.0 - smoothstep(-1.0, 0.5, hp.y);
  hH = mix(hH, vec3(0.030, 0.062, 0.054), hWet * 0.85);

  // Vereinzelte gelbe Lichtfelder an Rumpf-/Pierflächen.
  float hLampSeed = huelleHash(vec2(floor(huelleU / 8.0), floor((hp.y + 125.0) / 8.0))
                              + vec2(5.3, 47.8));
  vec2 hLampFrac = vec2(fract(huelleU / 8.0), fract((hp.y + 125.0) / 8.0));
  float hLampRect =
      (1.0 - smoothstep(0.075, 0.135, abs(hLampFrac.x - 0.5)))
    * (1.0 - smoothstep(0.065, 0.115, abs(hLampFrac.y - 0.5)));
  huelleHullLamp = (1.0 - step(0.05, hLampSeed)) * hLampRect * hVertical
                 * step(-1.0, hp.y) * (1.0 - smoothstep(260.0, 460.0, hDist));
  hH = mix(hH, vec3(0.80, 0.54, 0.18), huelleHullLamp * 0.90);

  huelleColor = hH;
}

// Eckfarben beeinflussen nur den Farbton.
diffuseColor.rgb = huelleColor * huelleGeoTint;
`;

export function init(ctx) {
  const materialien = new Set();

  function material(hoch) {
    const standard = Boolean(hoch);
    const mat = standard
      ? new THREE.MeshStandardMaterial({
          color: 0xffffff,
          vertexColors: true,
          flatShading: true,
          dithering: true,
        })
      : new THREE.MeshLambertMaterial({
          color: 0xffffff,
          vertexColors: true,
          flatShading: true,
          dithering: true,
        });

    mat.name = standard ? 'huelle_hoch' : 'huelle_niedrig';
    mat.userData.huelle = true;
    mat.userData.huelleStufe = standard ? 'hoch' : 'niedrig';

    if (standard) {
      // Metallanteil bewusst gering, damit die helle Stadt nicht spiegelt.
      mat.metalness = 0.12;
      mat.roughness = 0.60;
    }

    mat.onBeforeCompile = (shader) => {
      // --- Vertex: Weltposition ---
      let v = shader.vertexShader;
      if (!v.includes('varying vec3 vWPos;')) {
        v = v.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;');
      }
      const wpos = '\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;';
      if (v.includes('#include <project_vertex>')) {
        v = v.replace('#include <project_vertex>', '#include <project_vertex>' + wpos);
      } else if (v.includes('#include <worldpos_vertex>')) {
        v = v.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>' + wpos);
      }
      shader.vertexShader = v;

      // --- Fragment ---
      let f = shader.fragmentShader;
      if (!f.includes('varying vec3 vWPos;')) {
        f = f.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\n' + HASH_FN);
      }

      // Musterberechnung (Farbe + Emissionstreiber) direkt nach den Eckfarben.
      const musterAnker = f.indexOf('#include <color_fragment>');
      if (musterAnker >= 0) {
        f = f.replace('#include <color_fragment>', '#include <color_fragment>\n' + MUSTER);
      }

      // --- Emission / Aufhellung (Standard und Lambert) ---
      const glow = `
outgoingLight += huelleColor * (0.045 + 0.085 * huelleFassade);
outgoingLight += vec3(1.00, 0.74, 0.44) * huelleWarm * 0.65;
outgoingLight += vec3(0.06, 0.85, 0.68) * huelleTurquoise * 0.70;
outgoingLight += vec3(1.00, 0.66, 0.24) * huelleHullLamp * 0.75;
`;
      const opak = f.indexOf('#include <opaque_fragment>');
      if (opak >= 0 && f.includes('outgoingLight')) {
        f = f.replace('#include <opaque_fragment>', glow + '\n#include <opaque_fragment>');
      }

      // --- Standard: Rauheit/Metallanteil je Bereich ---
      if (standard) {
        if (f.includes('#include <roughnessmap_fragment>')) {
          f = f.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
{
  float hRm = step(6.0, vWPos.y);
  float hRn = abs(normalize(cross(dFdx(vWPos), dFdy(vWPos))).y);
  roughnessFactor = mix(roughnessFactor, 0.45, hRm * (1.0 - step(0.62, hRn)));
  roughnessFactor = mix(roughnessFactor, 0.72, hRm * step(0.62, hRn));
}`);
        }
        if (f.includes('#include <metalnessmap_fragment>')) {
          f = f.replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
{
  float hMm = step(6.0, vWPos.y);
  float hMn = abs(normalize(cross(dFdx(vWPos), dFdy(vWPos))).y);
  metalnessFactor = mix(metalnessFactor, 0.13, hMm * (1.0 - step(0.62, hMn)));
  metalnessFactor = mix(metalnessFactor, 0.06, hMm * step(0.62, hMn));
}`);
        }
      }

      shader.fragmentShader = f;
    };

    mat.customProgramCacheKey = () => (
      standard ? 'huelle_v4_std' : 'huelle_v4_lambert'
    );
    mat.needsUpdate = true;

    materialien.add(mat);
    return mat;
  }

  ctx.services.register('huelle', { material });

  // Bereits geladene Hülle mit neuem Material versehen.
  try {
    const neuLaden = ctx.services.get('aussen')?.neuLaden?.();
    if (neuLaden && typeof neuLaden.catch === 'function') {
      neuLaden.catch((fehler) => {
        console.error('Hülle: Neuladen fehlgeschlagen', fehler);
      });
    }
  } catch (fehler) {
    console.error('Hülle: Neuladen fehlgeschlagen', fehler);
  }

  // Link-Status eines übersetzten Programms prüfen (true/false/null = unbekannt).
  function programmstatus(marker) {
    try {
      const gl = ctx.renderer.getContext();
      const programme = Array.isArray(ctx.renderer.info?.programs)
        ? ctx.renderer.info.programs
        : [];
      for (const p of programme) {
        const key = typeof p?.cacheKey === 'string' ? p.cacheKey : '';
        if (key.includes(marker) && p?.program) {
          const valid = gl.getProgramParameter(p.program, gl.LINK_STATUS) === true;
          let log = '';
          if (!valid) {
            try {
              log = gl.getProgramInfoLog(p.program) || '';
            } catch {
              log = '';
            }
          }
          return { valid, log };
        }
      }
    } catch {
      return { valid: null, log: '' };
    }
    return { valid: null, log: '' };
  }

  // Wurzel der geladenen Hülle suchen.
  function hullenwurzel() {
    const aussen = ctx.services.get('aussen');
    if (aussen) {
      for (const name of ['gruppe', 'huelle', 'hullenMesh', 'mesh', 'objekt', 'gruppeHuelle']) {
        const o = aussen[name];
        if (o && typeof o.traverse === 'function') return o;
      }
    }
    let treffer = null;
    try {
      ctx.scene.traverse((o) => {
        if (!treffer && o.isMesh && /h(ü|ue)lle|aussen/i.test(o.name || '')) treffer = o;
      });
    } catch {
      treffer = null;
    }
    return treffer;
  }

  async function selbsttest() {
    const ergebnis = [];
    let compileOk = true;

    const faelle = [
      { mat: material(true), typ: THREE.MeshStandardMaterial, name: 'Standard', marker: 'huelle_v4_std' },
      { mat: material(false), typ: THREE.MeshLambertMaterial, name: 'Lambert', marker: 'huelle_v4_lambert' },
    ];

    for (const fall of faelle) {
      if (!(fall.mat instanceof fall.typ)) {
        compileOk = false;
        ergebnis.push(`${fall.name}: falscher Materialtyp`);
      }
      if (!fall.mat.vertexColors || !fall.mat.flatShading) {
        compileOk = false;
        ergebnis.push(`${fall.name}: vertexColors/flatShading fehlen`);
      }
      if (fall.mat.customProgramCacheKey() !== fall.marker) {
        compileOk = false;
        ergebnis.push(`${fall.name}: falscher Programmschlüssel`);
      }
    }

    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute('position', new THREE.Float32BufferAttribute([
      -1, -1, 0, 1, -1, 0, 0, 1, 0,
      -1, -1, 0, 0, 1, 0, 0, -1, 0,
    ], 3));
    geometrie.setAttribute('normal', new THREE.Float32BufferAttribute([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1, 0, 0, 1,
    ], 3));
    geometrie.setAttribute('color', new THREE.Float32BufferAttribute([
      0.55, 0.60, 0.68, 0.55, 0.60, 0.68, 0.55, 0.60, 0.68,
      0.55, 0.60, 0.68, 0.55, 0.60, 0.68, 0.55, 0.60, 0.68,
    ], 3));
    geometrie.computeBoundingSphere();

    const testSzene = new THREE.Scene();
    const vorne = new THREE.Vector3();
    ctx.camera.getWorldDirection(vorne);

    for (const fall of faelle) {
      const testMesh = new THREE.Mesh(geometrie, fall.mat);
      testMesh.position.copy(ctx.camera.position).addScaledVector(vorne, 4.0);
      testMesh.frustumCulled = false;
      testSzene.add(testMesh);

      try {
        ctx.renderer.compile(testSzene, ctx.camera);
      } catch (fehler) {
        compileOk = false;
        ergebnis.push(`${fall.name} nicht kompilierbar: ${fehler?.message || fehler}`);
      }

      const status = programmstatus(fall.marker);
      if (status.valid === false) {
        compileOk = false;
        ergebnis.push(`${fall.name}: Shader-Programm nicht valide${status.log ? ' (' + status.log.trim() + ')' : ''}`);
      } else if (status.valid === true) {
        ergebnis.push(`${fall.name}: Shader verlinkt`);
      } else {
        ergebnis.push(`${fall.name}: kompiliert (Linkstatus unbekannt)`);
      }

      testSzene.remove(testMesh);
    }

    geometrie.dispose();
    for (const fall of faelle) {
      materialien.delete(fall.mat);
      fall.mat.dispose();
    }

    if (!compileOk) {
      return { ok: false, details: ergebnis.join('; ') };
    }

    function traegtHullenmaterial(mesh) {
      const mat = mesh.material;
      const liste = Array.isArray(mat) ? mat : [mat];
      return liste.length > 0 && liste.every((m) => (
        m && m.userData?.huelle === true && materialien.has(m)
      ));
    }

    const ende = Date.now() + 60000;
    let anzahlMeshes = 0;
    let eigene = 0;

    while (Date.now() < ende) {
      const wurzel = hullenwurzel();
      if (wurzel && typeof wurzel.traverse === 'function') {
        const meshes = [];
        wurzel.traverse((objekt) => {
          if (objekt.isMesh) meshes.push(objekt);
        });

        anzahlMeshes = meshes.length;
        eigene = 0;
        let fremdesHullmaterial = 0;
        for (const mesh of meshes) {
          if (traegtHullenmaterial(mesh)) {
            eigene += 1;
          } else {
            const mat = mesh.material;
            const liste = Array.isArray(mat) ? mat : [mat];
            if (liste.some((m) => m && m.userData?.huelle === true)) fremdesHullmaterial += 1;
          }
        }

        if (anzahlMeshes > 0 && eigene === anzahlMeshes && fremdesHullmaterial === 0) {
          ergebnis.push(`${eigene} Hüllenmeshes mit Hüllenmaterial`);
          return { ok: true, details: ergebnis.join('; ') };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    ergebnis.push(`Hülle nicht rechtzeitig bereit (${anzahlMeshes} Meshes, ${eigene} mit Hüllenmaterial)`);
    return { ok: false, details: ergebnis.join('; ') };
  }

  function dispose() {
    for (const mat of materialien) mat.dispose();
    materialien.clear();
  }

  return { dispose, selbsttest };
}

// Material der Stadt-Außenhülle: silbrig-blaue Panels, dunkle Fensterbänder,
// sparsame cyanfarbene und amberfarbene Akzente, grobe Deckplatten – ohne UV-Koordinaten.
import * as THREE from 'three';

export function init(ctx) {
  const erstellteMaterialien = new Set();
  let zerstoert = false;

  const vertexCode = `
    varying vec3 vHuelleWPos;
  `;

  const commonCode = `
    varying vec3 vHuelleWPos;
    float huelleHash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
  `;

  const farbCode = `
    vec3 huelleN = normalize(cross(dFdx(vHuelleWPos), dFdy(vHuelleWPos)));
    if (!gl_FrontFacing) huelleN = -huelleN;

    float huelleUp = abs(huelleN.y);
    float huelleHull = 0.0;
    float huelleRauschen = huelleHash(floor(vHuelleWPos.xz * 0.27));
    float huelleHoehe = clamp((vHuelleWPos.y - 6.0) / 90.0, 0.0, 1.0);

    if (vHuelleWPos.y < 5.0 && huelleUp < 0.75) {
      // Unterer Rumpf: dunkle, waagerecht unterteilte Panzerplatten.
      huelleHull = 1.0;
      float platte = fract(vHuelleWPos.y * 0.30);
      float naht = 1.0 - smoothstep(0.0, 0.050, min(platte, 1.0 - platte));
      float brett = step(0.5, huelleHash(vec2(floor(vHuelleWPos.y * 0.30), floor(vHuelleWPos.x + vHuelleWPos.z))));
      diffuseColor.rgb *= mix(0.64, 0.47, naht) * mix(0.94, 1.05, brett);
    } else if (huelleUp > 0.70) {
      // Deck: 6-m-Fugen, 30-m-Plattenstöße, leicht aufgehellte Straßenfläche.
      vec2 kleine = abs(fract(vHuelleWPos.xz / 6.0) - 0.5);
      float kleineNaht = smoothstep(0.440, 0.500, max(kleine.x, kleine.y));
      vec2 grosse = abs(fract(vHuelleWPos.xz / 30.0) - 0.5);
      float grosseNaht = smoothstep(0.460, 0.500, max(grosse.x, grosse.y));
      float platteId = huelleHash(floor(vHuelleWPos.xz / 30.0));
      diffuseColor.rgb *= mix(0.90, 1.0, kleineNaht);
      diffuseColor.rgb *= mix(0.78, 1.0, grosseNaht);
      diffuseColor.rgb *= 0.97 + platteId * 0.06;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.70, 0.76), 0.10);
    } else {
      // Fassade: vertikale Rippen, Geschossfugen, schmale dunkle Fenster.
      float huelleU = abs(huelleN.x) > abs(huelleN.z) ? vHuelleWPos.z : vHuelleWPos.x;
      float huelleV = vHuelleWPos.y;

      vec2 zelle = vec2(huelleU / 2.6, huelleV / 3.0);
      vec2 f = fract(zelle);
      vec2 id = floor(zelle);
      float rand = huelleHash(id);
      float rand2 = huelleHash(id + vec2(19.3, 7.7));

      float rippenAbstand = min(f.x, 1.0 - f.x);
      float rippe = 1.0 - smoothstep(0.030, 0.110, rippenAbstand);
      float bodenFuge = 1.0 - smoothstep(0.0, 0.035, min(f.y, 1.0 - f.y));

      float fensterRahmen =
        step(0.24, f.x) * step(f.x, 0.76) *
        step(0.24, f.y) * step(f.y, 0.80);
      float fensterDa = step(0.55, rand) * fensterRahmen;

      // Höhere Türme werden silbriger und heller (Referenz: helle Stadt bei Tageslicht).
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.70, 0.74, 0.80), 0.30 * huelleHoehe);
      diffuseColor.rgb *= mix(0.97, 1.10, rippe);
      diffuseColor.rgb *= mix(1.0, 0.80, bodenFuge);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.45, fensterDa);

      // Vereinzelte hellere Fenster (spiegeln Sonne/Himmel).
      float hell = step(0.88, rand2) * fensterDa;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.76, 0.84), hell * 0.55);

      // Sehr wenige Signalfelder: cyan und amber.
      float teal = step(0.960, rand) * fensterDa;
      float gelb = step(0.978, rand2) * fensterDa;
      vec3 akzentFarbe = mix(
        vec3(0.10, 0.55, 0.62),
        vec3(0.85, 0.62, 0.16),
        step(0.5, rand2)
      );
      diffuseColor.rgb = mix(diffuseColor.rgb, akzentFarbe, max(teal, gelb) * 0.72);
    }

    diffuseColor.rgb *= 0.97 + huelleRauschen * 0.06;
  `;

  function erzeugeMaterial(hoch) {
    const mat = hoch
      ? new THREE.MeshStandardMaterial({
          color: 0xffffff,
          vertexColors: true,
          flatShading: true,
          metalness: 0.18,
          roughness: 0.62
        })
      : new THREE.MeshLambertMaterial({
          color: 0xffffff,
          vertexColors: true,
          flatShading: true
        });

    mat.name = hoch ? 'huelle_std' : 'huelle_lambert';
    mat.userData = mat.userData || {};
    mat.userData.huelleDienst = true;
    mat.userData.huelleStufe = hoch ? 'hoch' : 'niedrig';

    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + vertexCode)
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
           vec4 huelleWP = vec4(transformed, 1.0);
           #ifdef USE_INSTANCING
             huelleWP = instanceMatrix * huelleWP;
           #endif
           vHuelleWPos = (modelMatrix * huelleWP).xyz;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + commonCode)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + farbCode);

      if (hoch) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
           roughnessFactor = clamp(
             roughnessFactor - 0.12 * huelleUp + 0.14 * huelleHull,
             0.20,
             0.95
           );`
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
           metalnessFactor = clamp(
             metalnessFactor + 0.08 * (1.0 - huelleUp),
             0.0,
             0.60
           );`
        );
      }
    };

    mat.customProgramCacheKey = () =>
      hoch ? 'huelle_v2_std' : 'huelle_v2_lambert';

    return mat;
  }

  // Öffentliche Schnittstelle: jeder Aufruf liefert ein neues Material.
  function material(hoch) {
    const mat = erzeugeMaterial(!!hoch);
    erstellteMaterialien.add(mat);
    return mat;
  }

  ctx.services.register('huelle', { material });

  function istHullenMaterial(mat) {
    return !!(mat && mat.userData && mat.userData.huelleDienst === true);
  }

  function hatHullenMaterial(gruppe) {
    let gefunden = false;
    if (!gruppe || typeof gruppe.traverse !== 'function') return false;
    gruppe.traverse((objekt) => {
      if (gefunden || !objekt.isMesh || !objekt.material) return;
      const mats = Array.isArray(objekt.material) ? objekt.material : [objekt.material];
      for (const m of mats) {
        if (istHullenMaterial(m) || erstellteMaterialien.has(m)) {
          gefunden = true;
          break;
        }
      }
    });
    return gefunden;
  }

  // Fallback: Liegt die Hülle bereits im Szenegraphen, bekommt sie direkt das Dienstmaterial.
  function materialAufGruppeSetzen(gruppe, mat) {
    let ersetzt = 0;
    if (!gruppe || typeof gruppe.traverse !== 'function') return 0;
    gruppe.traverse((objekt) => {
      if (!objekt.isMesh || !objekt.material) return;
      const alt = Array.isArray(objekt.material) ? objekt.material : [objekt.material];
      const neu = alt.map((m) => {
        if (!m || istHullenMaterial(m) || erstellteMaterialien.has(m)) return m;
        // Hüllenmeshes tragen Eckfarben; alles andere bleibt unberührt.
        if (m.vertexColors === true) {
          ersetzt++;
          return mat;
        }
        return m;
      });
      const veraendert = neu.some((m, i) => m !== alt[i]);
      if (veraendert) {
        objekt.material = Array.isArray(objekt.material) ? neu : neu[0];
        for (const m of alt) {
          if (m && m !== mat && !istHullenMaterial(m) && m.dispose) m.dispose();
        }
      }
    });
    return ersetzt;
  }

  function warten(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function huelleSichern() {
    const hoch = ctx.settings && ctx.settings.get('stufe') === 'hoch';
    for (let i = 0; i < 40 && !zerstoert; i++) {
      const aussen = ctx.services.get('aussen');
      const gruppe = aussen && aussen.gruppe;
      if (gruppe && typeof gruppe.traverse === 'function') {
        if (!hatHullenMaterial(gruppe)) {
          const mat = material(hoch);
          materialAufGruppeSetzen(gruppe, mat);
          if (hatHullenMaterial(gruppe)) return;
        } else {
          return;
        }
      }
      await warten(250);
    }
  }

  // Einmaliges Neuladen der Hülle, falls sie schon mit dem alten Material geladen war.
  try {
    const aussen = ctx.services.get('aussen');
    if (aussen && typeof aussen.neuLaden === 'function') {
      const ergebnis = aussen.neuLaden();
      if (ergebnis && typeof ergebnis.then === 'function') {
        ergebnis.then(() => { huelleSichern(); }).catch((fehler) => {
          console.error('Außenhülle konnte nicht neu geladen werden:', fehler);
        });
      }
    }
  } catch (fehler) {
    console.error('Neuladen der Außenhülle fehlgeschlagen:', fehler);
  }

  huelleSichern();

  function dispose() {
    zerstoert = true;
    for (const mat of erstellteMaterialien) mat.dispose();
    erstellteMaterialien.clear();
  }

  async function selbsttest() {
    const details = [];
    let ok = true;

    // Shader-Test mit getrennten Materialien (die Dienstmaterialien bleiben unberührt).
    let std = null;
    let lambert = null;
    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([
        -2, 0, -2,
         2, 0, -2,
         0, 4,  2
      ], 3)
    );
    geometrie.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute([
        0, 0.5, -0.8,
        0, 0.5, -0.8,
        0, 0.5, -0.8
      ], 3)
    );
    geometrie.setAttribute(
      'color',
      new THREE.Float32BufferAttribute([
        0.7, 0.75, 0.8,
        0.7, 0.75, 0.8,
        0.7, 0.75, 0.8
      ], 3)
    );

    try {
      const dienstStd = erzeugeMaterial(true);
      const dienstLambert = erzeugeMaterial(false);

      std = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true });
      std.onBeforeCompile = dienstStd.onBeforeCompile;
      std.customProgramCacheKey = dienstStd.customProgramCacheKey;

      lambert = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
      lambert.onBeforeCompile = dienstLambert.onBeforeCompile;
      lambert.customProgramCacheKey = dienstLambert.customProgramCacheKey;

      const testSzene = new THREE.Scene();
      const testMesh = new THREE.Mesh(geometrie, std);
      testMesh.frustumCulled = false;
      testSzene.add(testMesh);

      const kamera = ctx.camera && ctx.camera.isCamera
        ? ctx.camera
        : new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      kamera.updateMatrixWorld();

      await ctx.renderer.compile(testSzene, kamera);
      details.push('Standard-Shader kompiliert');

      testMesh.material = lambert;
      await ctx.renderer.compile(testSzene, kamera);
      details.push('Lambert-Shader kompiliert');

      testSzene.remove(testMesh);
      dienstStd.dispose();
      dienstLambert.dispose();
    } catch (fehler) {
      ok = false;
      details.push('Shader-Test fehlgeschlagen: ' + (fehler && fehler.message));
    } finally {
      geometrie.dispose();
      if (std) std.dispose();
      if (lambert) lambert.dispose();
    }

    // Prüfen, dass die geladene Hülle tatsächlich ein Material dieses Dienstes trägt.
    const ende = Date.now() + 60000;
    let anzahlGefunden = 0;
    let gruppeGefunden = false;

    while (Date.now() < ende && !zerstoert) {
      const aussen = ctx.services.get('aussen');
      const wurzeln = [];
      if (aussen && aussen.gruppe && typeof aussen.gruppe.traverse === 'function') {
        wurzeln.push(aussen.gruppe);
        gruppeGefunden = true;
      }
      if (ctx.scene && typeof ctx.scene.traverse === 'function') wurzeln.push(ctx.scene);

      anzahlGefunden = 0;
      for (const wurzel of wurzeln) {
        wurzel.traverse((objekt) => {
          if (!objekt.isMesh || !objekt.material) return;
          const mats = Array.isArray(objekt.material) ? objekt.material : [objekt.material];
          for (const mat of mats) {
            if (istHullenMaterial(mat) || erstellteMaterialien.has(mat)) anzahlGefunden++;
          }
        });
      }

      if (anzahlGefunden > 0) {
        details.push(
          'Hüllenmeshes mit Dienstmaterial gefunden: ' + anzahlGefunden +
          (gruppeGefunden ? ' (Gruppe aussen.gruppe)' : ' (Szene)')
        );
        break;
      }
      await warten(200);
    }

    if (anzahlGefunden === 0) {
      ok = false;
      details.push('Innerhalb von 60 s kein Hüllenmesh mit Dienstmaterial gefunden');
    }

    return { ok, details: details.join('; ') };
  }

  return { dispose, selbsttest };
}

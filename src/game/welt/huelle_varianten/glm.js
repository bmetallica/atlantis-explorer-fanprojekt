// welt/huelle.js – SPL-009 (Überarbeitung)
// Prozedurales Material für die Stadt-Außenhülle (kein UV, Muster über Weltkoordinaten im Fragment-Shader).
// Dienst 'huelle': material(hoch) → MeshStandardMaterial (hoch) / MeshLambertMaterial (niedrig),
// jeweils vertexColors + flatShading, jedes Material eine neue Instanz.
//
// Klassifikation rein geometrisch (Flächennormale + Höhe):
//   vertikal & y > 4        → Fassade (Silbergrau, Abschnittspaneels, durchgehende Fensterbänder pro Geschoss,
//                             schmale helle Pfosten, ~10 % warm leuchtende Fenster, türkise Akzente y > 40)
//   horizontal & y < 30     → Deck (Schiefergrau, 12-m-Platten, sparsame Goldmarkierungen)
//   horizontal & y >= 30    → helle Turm-Abschlüsse (ruhig)
//   Rest (Seitenwände/Unterseiten) → Rumpf (Anthrazit, horizontale Rillen, unter Wasser nass dunkelgrün)
//
// Ferne: Musterdetails blenden mit der Kameradistanz aus (kein Moiré), aber die Klassen-Grundfarben
// (helle Fassaden, dunklere Decks) bleiben erhalten – die ferne Stadt wirkt nicht mehr einfarbig grau.
import * as THREE from 'three';

// GLSL-Helfer: Hash + Fugenlinie mit fwidth-Anteil (flimmert nicht, kein Moiré)
const HELFER = /* glsl */`
varying vec3 vWPos;
float h21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
// Fuge an Rasterkanten: 1.0 auf der Linie, verliert bei groben Pixeln gegen die Ferne
float fugenlinie(float k, float periode, float breite, float px) {
  float f = fract(k / periode);
  float d = min(f, 1.0 - f) * periode; // Abstand zur Fuge in Metern
  float w = max(breite, px * 1.5);
  if (w > periode * 0.3) return 0.0;   // Linie zu dick fürs Raster → ausblenden
  return 1.0 - smoothstep(w, w * 2.0, d);
}
`;

// Muster-Block, nach color_fragment eingefügt (diffuseColor enthält schon die Vertexfarbe)
const MUSTER = /* glsl */`
vec3 huelleFarbe = diffuseColor.rgb;
vec3 huelleEmiss = vec3(0.0);
float huelleMetal = 0.05;
float huelleRough = 0.75;
{
  vec3 hn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
  float an = abs(hn.y);
  float dist = length(vWPos - cameraPosition);
  float fade = smoothstep(320.0, 480.0, dist); // 1.0 = fern: nur Grundfarbe + schwache Fensterstreifen
  float detail = 1.0 - fade;
  float pxY = fwidth(vWPos.y) + 1e-4;
  vec3 basis = diffuseColor.rgb;
  float tW = vWPos.x * hn.z - vWPos.z * hn.x; // Wandkoordinate entlang vertikaler Flächen

  if (an < 0.5 && vWPos.y > 4.0) {
    // ---- Fassade: helles bläuliches Silber, oben heller ----
    float pxT = fwidth(tW) + 1e-4;
    float etg = floor(vWPos.y / 4.0);   // Geschoss (4 m)
    float sec = floor(tW / 20.0);       // Fassadenabschnitt (~20 m)
    // Grundfarbe der Klasse (bleibt auch in der Ferne erhalten)
    vec3 f = basis * vec3(0.90, 0.95, 1.04);
    f *= 1.0 + clamp(vWPos.y, 0.0, 450.0) * 0.0006; // dezent heller nach oben
    // große, abgesetzte Abschnittspaneels (moderat, nie schwarz)
    float secH = h21(vec2(sec * 0.173, 7.3));
    f *= mix(vec3(1.0), vec3(0.86, 0.90, 0.98), step(0.5, secH) * 0.8);

    // Details (blenden in der Ferne aus):
    // Paneelfugen (vertikal ~5 m) + Geschossfugen (4 m)
    float fV = fugenlinie(tW, 5.0, 0.10, pxT);
    float fH = fugenlinie(vWPos.y, 4.0, 0.12, pxY);
    f *= 1.0 - 0.34 * max(fV, fH) * detail;
    // durchgehendes Fensterband je Geschoss, nur durch schmale helle Pfosten unterteilt;
    // Ein/Aus nur pro Abschnitt (≥ 20 m), nie pro Meter
    float gy = fract(vWPos.y / 4.0);
    float band = step(0.18, gy) * step(gy, 0.58);
    float hatFenster = step(0.35, h21(vec2(sec * 0.113 + 2.7, 3.1)));
    float zelle = floor(tW / 5.0);
    float posten = fugenlinie(tW, 5.0, 0.24, pxT);
    // Glas: bläulich-violett, dunkler als die Fassade, aber nicht schwarz
    vec3 glas = vec3(0.14, 0.17, 0.29) * (0.85 + 0.45 * h21(vec2(etg * 1.31, sec * 0.917)));
    float warm = step(h21(vec2(zelle * 0.37 + etg * 11.0, sec * 0.617)), 0.10); // ~10 % leuchten warm
    vec3 glasEnd = mix(glas, vec3(1.0, 0.84, 0.58) * 0.9, warm);
    float tuer = step(h21(vec2(sec * 0.211 + 5.1, 9.7)), 0.08) * step(40.0, vWPos.y); // türkise Akzente, y > 40
    glasEnd = mix(glasEnd, vec3(0.16, 0.95, 0.85), tuer);
    float bandOn = band * hatFenster * (1.0 - posten);
    f = mix(f, glasEnd, bandOn * detail);
    huelleEmiss += (vec3(1.0, 0.82, 0.52) * warm * 0.45 + vec3(0.10, 0.85, 0.75) * tuer * 1.1)
                   * band * hatFenster * detail;
    huelleMetal = 0.14;
    huelleRough = 0.5;
    huelleFarbe = f;
    // Ferne: leichte Fensterstreifen auf der Fassaden-Grundfarbe (kein Moiré)
    huelleFarbe *= 1.0 - 0.15 * band * hatFenster * fade;
  } else if (hn.y > 0.5 && vWPos.y < 30.0) {
    // ---- Deck: Schiefergrau, große Platten (12 m), Gold sparsam ----
    float pxX = fwidth(vWPos.x) + 1e-4;
    float pxZ = fwidth(vWPos.z) + 1e-4;
    vec2 zelle = floor(vWPos.xz / 12.0);
    vec3 d = basis * vec3(0.62, 0.68, 0.63);
    d *= 0.88 + 0.22 * h21(zelle);
    float fug = max(fugenlinie(vWPos.x, 12.0, 0.15, pxX), fugenlinie(vWPos.z, 12.0, 0.15, pxZ));
    d *= 1.0 - 0.42 * fug * detail;
    // vereinzelte hellere Wege (ganze Zellreihen entlang x)
    float weg = step(h21(vec2(zelle.y * 0.131, 4.4)), 0.05);
    d = mix(d, d * 1.35, weg * detail);
    // goldgelbe Punkte/Streifen (~3 % der Platten)
    float markierung = 0.0;
    if (h21(zelle + 31.7) < 0.03) {
      vec2 lokal = fract(vWPos.xz / 12.0);
      float punkt = 1.0 - smoothstep(0.16, 0.22, length(lokal - 0.5));
      float achse = step(0.5, h21(zelle + 77.7));
      float strX = 1.0 - smoothstep(0.05, 0.10, abs(lokal.y - 0.5));
      float strZ = 1.0 - smoothstep(0.05, 0.10, abs(lokal.x - 0.5));
      markierung = clamp(punkt + mix(strX, strZ, achse), 0.0, 1.0);
    }
    d = mix(d, vec3(0.85, 0.62, 0.15), markierung * detail);
    huelleEmiss += vec3(0.7, 0.45, 0.1) * markierung * 0.3 * detail;
    huelleMetal = 0.05;
    huelleRough = 0.85;
    huelleFarbe = d;
  } else if (hn.y > 0.5) {
    // ---- hohe horizontale Turm-Abschlüsse: ruhiges helles Silber ----
    huelleFarbe = basis * vec3(0.95, 1.0, 1.10) * 1.08;
    huelleMetal = 0.14;
    huelleRough = 0.55;
  } else {
    // ---- Rumpf / Pier-Seitenwände: Anthrazit mit Rillen, unten nass grünlich ----
    vec3 r = basis * vec3(0.46, 0.48, 0.50);
    float rille = fugenlinie(vWPos.y, 3.0, 0.45, pxY);
    r *= 1.0 - 0.45 * rille * detail;
    float nass = smoothstep(0.0, 10.0, -vWPos.y);
    r *= mix(vec3(1.0), vec3(0.45, 0.62, 0.55), nass);
    // vereinzelte gelbe Lichtfelder an vertikalen Wänden über Wasser
    if (an < 0.5 && vWPos.y > 0.0) {
      float feld = step(h21(vec2(floor(tW / 8.0), floor(vWPos.y / 5.0))), 0.05);
      r = mix(r, vec3(0.8, 0.6, 0.2), feld * 0.5 * detail);
      huelleEmiss += vec3(0.75, 0.5, 0.15) * feld * 0.6 * detail;
    }
    huelleMetal = 0.05;
    huelleRough = 0.7;
    huelleFarbe = r;
  }
}
diffuseColor.rgb = huelleFarbe;
`;

export function init(ctx) {
  const materialien = new Set();

  // Erzeugt ein neues Material (hoch = Standard, niedrig = Lambert) mit injiziertem Muster-Shader
  function erstelle(hoch) {
    const mat = hoch
      ? new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, metalness: 0.1 })
      : new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    mat.userData.huelle = true; // Erkennungszeichen für den Selbsttest
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + HELFER)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + MUSTER)
        .replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += huelleEmiss;');
      if (hoch) {
        // Metall/Rauheit je Fläche (Fassade metallischer, Deck/Rumpf matt)
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <metalnessmap_fragment>',
            '#include <metalnessmap_fragment>\nmetalnessFactor = huelleMetal;\nroughnessFactor = huelleRough;');
      }
    };
    mat.customProgramCacheKey = () => (hoch ? 'huelle_v2_std' : 'huelle_v2_lam');
    materialien.add(mat);
    return mat;
  }

  ctx.services.register('huelle', {
    material(hoch) { return erstelle(!!hoch); },
  });

  // Falls die Hülle schon mit Altmaterial geladen ist: neu laden
  const aussen = ctx.services.get('aussen');
  if (aussen && typeof aussen.neuLaden === 'function') aussen.neuLaden();

  async function selbsttest() {
    const teile = [];
    let ok = true;
    try {
      const mH = erstelle(true);
      const mN = erstelle(false);
      if (!mH.isMeshStandardMaterial || !mH.vertexColors || !mH.flatShading) {
        ok = false; teile.push('Standardmaterial hat falsche Eigenschaften');
      }
      if (!mN.isMeshLambertMaterial || !mN.vertexColors || !mN.flatShading) {
        ok = false; teile.push('Lambert-Material hat falsche Eigenschaften');
      }
      if (mH === mN) { ok = false; teile.push('material() liefert dieselbe Instanz'); }
      // Kompiliertest: beide Shader mit gefärbtem Test-Mesh
      const geo = new THREE.SphereGeometry(1, 12, 8);
      const n = geo.attributes.position.count;
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(0.5), 3));
      const szene = new THREE.Scene();
      szene.add(new THREE.Mesh(geo, mH));
      szene.add(new THREE.Mesh(geo, mN));
      ctx.renderer.compile(szene, new THREE.PerspectiveCamera());
      teile.push('beide Shader kompiliert');
      // Prüfen, dass die geladene Hülle unser Material trägt (bis 60 s warten)
      const a = ctx.services.get('aussen');
      if (a && a.gruppe) {
        const ende = Date.now() + 60000;
        let gefunden = false;
        while (Date.now() < ende && !gefunden) {
          a.gruppe.traverse((o) => {
            if (o.isMesh && o.material && o.material.userData && o.material.userData.huelle) gefunden = true;
          });
          if (!gefunden) await new Promise((r) => setTimeout(r, 500));
        }
        if (gefunden) teile.push('Hüllen-Meshes tragen das Material');
        else { ok = false; teile.push('Hüllen-Meshes nicht mit unserem Material gefunden'); }
      } else {
        teile.push('aussen-Dienst nicht vorhanden, Mesh-Prüfung übersprungen');
      }
    } catch (e) {
      ok = false;
      teile.push('Fehler: ' + (e && e.message ? e.message : String(e)));
    }
    return { ok, details: teile.join('; ') };
  }

  return {
    dispose() {
      for (const m of materialien) m.dispose();
      materialien.clear();
    },
    selbsttest,
  };
}

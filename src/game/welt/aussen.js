// Außenwelt: Stadthülle, Meer und Himmel.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

export function init(ctx) {
  const { renderer, scene, settings, services } = ctx;

  const loader = new GLTFLoader();
  const wasserY = ctx.plan?.wasser_y ?? 0;

  // --- Stadthülle -------------------------------------------------------
  const stadtGruppe = new THREE.Group();
  stadtGruppe.name = 'aussen_stadthuelle';
  scene.add(stadtGruppe);

  let stadtMesh = null;
  let stadtMaterial = null;
  let stadtMaterialien = new Set();
  let stadtGeometrien = new Set();
  let kollisionsObjekte = [];
  let dreiecke = 0;
  let geladen = false;
  let ladeFehler = null;
  let ladeToken = 0;
  let ladePromise = Promise.resolve();
  let sichtbar = true;
  let kollisionAngewandt = false;
  let vollKacheln = [];

  const materialFuer = (hoch) => {
    // eigenes Hüllenmaterial (Dienst 'huelle', MiniMax-Modul welt/huelle.js) hat Vorrang – Claude
    const fremd = services.get('huelle')?.material?.(hoch);
    if (fremd) return fremd;
    const material = hoch
      ? new THREE.MeshStandardMaterial({
          vertexColors: true,
          flatShading: true,
          metalness: 0.3,
          roughness: 0.55
        })
      : new THREE.MeshLambertMaterial({
          vertexColors: true,
          flatShading: true
        });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
      shader.fragmentShader = 'varying vec3 vWPos;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 fn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
        float senk = 1.0 - smoothstep(0.25, 0.45, abs(fn.y));
        float band = step(0.84, fract(vWPos.y / 4.0)) * step(8.0, vWPos.y);
        diffuseColor.rgb = mix(diffuseColor.rgb * 0.82, vec3(0.20, 0.30, 0.42), senk * band * 0.6);`
      );
    };
    material.customProgramCacheKey = () =>
      hoch ? 'aussen_fensterbaender_std_v1' : 'aussen_fensterbaender_lam_v1';
    return material;
  };

  const statischeObjekteSammeln = () => {
    const liste = [];
    if (!stadtMesh) return liste;
    stadtMesh.traverse((obj) => {
      if (obj.isMesh && obj.geometry) liste.push(obj);
    });
    return liste;
  };

  const stadtEntfernen = () => {
    if (!stadtMesh) return;
    services.get('kollision')?.entfernen('stadt_aussen');
    for (const name of kollKacheln) services.get('kollision')?.entfernen('stadt_aussen:' + name);
    kollKacheln.clear();
    stadtGruppe.remove(stadtMesh);
    for (const geometrie of stadtGeometrien) geometrie.dispose();
    for (const material of stadtMaterialien) material.dispose();
    stadtGeometrien.clear();
    stadtMaterialien.clear();
    stadtMesh = null;
    stadtMaterial = null;
    kollisionsObjekte = [];
    geladen = false;
    kollisionAngewandt = false;
    dreiecke = 0;
  };

  // Hülle innerhalb geladener Räume nicht zeichnen (sie ragt teils in Räume hinein, sichtbar z. B. vom Balkon aus) – Claude.
  // Bis zu MAX_RAEUME Quader (lokal je Raum) als Uniforms; Fragment-Shader verwirft Pixel darin.
  const MAX_RAEUME = 32;
  const raumUniforms = {
    uRaumAnzahl: { value: 0 },
    uRaumInv: { value: Array.from({ length: MAX_RAEUME }, () => new THREE.Matrix4()) },
    uRaumMin: { value: Array.from({ length: MAX_RAEUME }, () => new THREE.Vector3()) },
    uRaumMax: { value: Array.from({ length: MAX_RAEUME }, () => new THREE.Vector3()) },
  };
  function raumAusschnitt(material) {
    const vorher = material.onBeforeCompile;
    const schluessel = material.customProgramCacheKey?.bind(material);
    material.onBeforeCompile = (shader, r) => {
      vorher?.call(material, shader, r);
      Object.assign(shader.uniforms, raumUniforms);
      shader.vertexShader = 'varying vec3 vRaumW;\n' + shader.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  vRaumW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = `varying vec3 vRaumW;
uniform int uRaumAnzahl;
uniform mat4 uRaumInv[${MAX_RAEUME}];
uniform vec3 uRaumMin[${MAX_RAEUME}];
uniform vec3 uRaumMax[${MAX_RAEUME}];
` + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  for (int i = 0; i < ${MAX_RAEUME}; i++) {
    if (i >= uRaumAnzahl) break;
    vec3 lr = (uRaumInv[i] * vec4(vRaumW, 1.0)).xyz;
    if (all(greaterThan(lr, uRaumMin[i])) && all(lessThan(lr, uRaumMax[i]))) discard;
  }`);
    };
    material.customProgramCacheKey = () => (schluessel ? schluessel() : '') + '_raumausschnitt_v1';
    return material;
  }
  const kamRaum = new THREE.Vector3(), raumMitte = new THREE.Vector3();
  let raumTakt = 0;
  function raumAusschnittAktualisieren() {
    if (++raumTakt % 15) return;
    const ia = services.get('innenaussen');
    const welt = services.get('welt');
    if (!ia?.quader || !welt?.geladen) return;
    ctx.camera.getWorldPosition(kamRaum);
    const liste = [];
    for (const h of welt.geladen()) {
      if (!h?.gruppe || ia.OFFEN?.has(h.id)) continue;
      const q = ia.quader(h.gruppe);
      if (q.box.isEmpty()) continue;
      h.gruppe.getWorldPosition(raumMitte);
      liste.push({ q, d: raumMitte.distanceToSquared(kamRaum) });
    }
    for (const g of welt.durchgaenge?.() || []) {
      const q = ia.quader(g);
      if (q.box.isEmpty()) continue;
      g.getWorldPosition(raumMitte);
      liste.push({ q, d: raumMitte.distanceToSquared(kamRaum) });
    }
    liste.sort((a, b) => a.d - b.d);
    const n = Math.min(MAX_RAEUME, liste.length);
    for (let i = 0; i < n; i++) {
      const { q } = liste[i];
      raumUniforms.uRaumInv.value[i].copy(q.inv);
      // etwas größer als der Raum (Quader in innen_aussen ist um 0,15 m verkleinert)
      raumUniforms.uRaumMin.value[i].copy(q.box.min).addScalar(-0.2);
      raumUniforms.uRaumMax.value[i].copy(q.box.max).addScalar(0.2);
    }
    raumUniforms.uRaumAnzahl.value = n;
  }

  const stadtHuelleLaden = async (stufe) => {
    const token = ++ladeToken;
    ladeFehler = null;
    try {
      const antwort = await fetch('/stadt/aussen/meta.json', { cache: 'no-store' });
      if (!antwort.ok) throw new Error('meta.json: HTTP ' + antwort.status);
      const meta = await antwort.json();
      // Kacheln in voller Auflösung (stadt_kacheln.py) bevorzugt – Claude; sonst die alte, global vereinfachte Hülle
      const kacheln = meta?.kacheln;
      const lod = stufe === 'niedrig' ? meta?.lods?.fern : meta?.lods?.nah;
      if (!kacheln && !lod?.datei) throw new Error('Kein LOD für Stufe ' + stufe);

      const [gltf, gltfFern] = kacheln
        ? await Promise.all([loader.loadAsync('/stadt/aussen/' + kacheln.voll), loader.loadAsync('/stadt/aussen/' + kacheln.fern)])
        : [await loader.loadAsync('/stadt/aussen/' + lod.datei), null];
      if (token !== ladeToken) {
        // Veralteter Ladevorgang: direkt wieder freigeben.
        gltf.scene.traverse((obj) => {
          if (!obj.isMesh) return;
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) mat?.dispose();
        });
        return;
      }

      stadtEntfernen();
      vollKacheln = [];
      if (kacheln) {
        // je Kachel ein THREE.LOD: volle Geometrie nah, vereinfachte Fernstufe weiter weg
        const fernNachName = new Map();
        gltfFern.scene.traverse((o) => { if (o.isMesh) fernNachName.set(o.name, o); });
        const gruppe = new THREE.Group();
        const umschalt = stufe === 'niedrig' ? 220 : 450;
        const mitte = new THREE.Vector3();
        const vollMeshes = [];
        gltf.scene.traverse((o) => { if (o.isMesh) vollMeshes.push(o); });
        for (const voll of vollMeshes) {
          voll.geometry.computeBoundingSphere();
          mitte.copy(voll.geometry.boundingSphere.center);
          const lodObj = new THREE.LOD();
          lodObj.position.copy(mitte);
          voll.position.copy(mitte).negate();
          lodObj.addLevel(voll, 0);
          const fern = fernNachName.get(voll.name);
          if (fern) { fern.position.copy(mitte).negate(); lodObj.addLevel(fern, umschalt); }
          gruppe.add(lodObj);
          vollKacheln.push(voll);
        }
        stadtMesh = gruppe;
      } else {
        stadtMesh = gltf.scene;
      }
      stadtMesh.name = 'aussen_stadthuelle_mesh';

      const material = raumAusschnitt(materialFuer(stufe !== 'niedrig'));
      stadtMaterial = material;
      stadtMaterialien.add(material);
      stadtMesh.traverse((obj) => {
        if (!obj.isMesh) return;
        const alt = obj.material;
        obj.material = material;
        if (alt && alt !== material) {
          const alte = Array.isArray(alt) ? alt : [alt];
          for (const m of alte) m?.dispose();
        }
        if (obj.geometry) stadtGeometrien.add(obj.geometry);
      });
      stadtGruppe.add(stadtMesh);
      stadtMesh.updateMatrixWorld(true);

      dreiecke = 0;
      for (const obj of statischeObjekteSammeln()) {
        const geometrie = obj.geometry;
        const anzahl = geometrie.index
          ? geometrie.index.count / 3
          : (geometrie.attributes.position?.count || 0) / 3;
        dreiecke += Math.floor(anzahl);
      }
      // Kollision immer gegen die volle Geometrie (nicht zusätzlich gegen die Fernstufe)
      kollisionsObjekte = vollKacheln.length ? vollKacheln : statischeObjekteSammeln();
      geladen = true;
      stadtGruppe.visible = sichtbar;
    } catch (fehler) {
      ladeFehler = fehler;
      geladen = false;
      console.error('Außenwelt konnte nicht geladen werden:', fehler);
    }
  };

  const ladeStarten = (stufe) => {
    ladePromise = stadtHuelleLaden(stufe === 'niedrig' ? 'niedrig' : 'hoch');
    return ladePromise;
  };

  // Kollision der Hülle: bei Kacheln nur in der Nähe von Spieler/Kamera aufbauen, höchstens eine Kachel pro Bild
  // (statt 1,4 Mio. Dreiecke auf einmal → kein Standbild beim Laden) – Claude
  const KOLL_RADIUS = 260;
  const kollKacheln = new Set();
  const kollPos = new THREE.Vector3(), kollKam = new THREE.Vector3(), kollMitte = new THREE.Vector3();
  const kollisionAnwenden = () => {
    if (!stadtMesh || !kollisionsObjekte.length) return;
    const kollision = services.get('kollision');
    if (!kollision || typeof kollision.hinzufuegen !== 'function') return;
    if (!vollKacheln.length) {
      if (kollisionAngewandt) return;
      stadtMesh.updateMatrixWorld(true);
      kollision.hinzufuegen('stadt_aussen', kollisionsObjekte);
      kollisionAngewandt = true;
      return;
    }
    kollPos.copy(ctx.state.spieler.pos);
    ctx.camera.getWorldPosition(kollKam);
    let beste = null, besteD = Infinity;
    for (const voll of vollKacheln) {
      if (kollKacheln.has(voll.name)) continue;
      voll.geometry.boundingSphere || voll.geometry.computeBoundingSphere();
      kollMitte.copy(voll.geometry.boundingSphere.center).applyMatrix4(voll.matrixWorld);
      const r = voll.geometry.boundingSphere.radius;
      const d = Math.min(kollMitte.distanceTo(kollPos), kollMitte.distanceTo(kollKam)) - r;
      if (d < KOLL_RADIUS && d < besteD) { besteD = d; beste = voll; }
    }
    if (!beste) return;
    beste.updateMatrixWorld(true);
    kollision.hinzufuegen('stadt_aussen:' + beste.name, [beste]);
    kollKacheln.add(beste.name);
  };

  // --- Himmel und Sonne -------------------------------------------------
  const himmel = new Sky();
  himmel.name = 'aussen_himmel';
  himmel.scale.setScalar(10000);
  himmel.material.uniforms.turbidity.value = 4;
  himmel.material.uniforms.rayleigh.value = 1.6;
  himmel.material.uniforms.mieCoefficient.value = 0.005;
  himmel.material.uniforms.mieDirectionalG.value = 0.8;

  const sonnenRichtung = new THREE.Vector3();
  const erhebung = THREE.MathUtils.degToRad(28);
  const azimuth = THREE.MathUtils.degToRad(135);
  sonnenRichtung.set(
    Math.cos(erhebung) * Math.cos(azimuth),
    Math.sin(erhebung),
    Math.cos(erhebung) * Math.sin(azimuth)
  ).normalize();
  himmel.material.uniforms.sunPosition.value.copy(sonnenRichtung);
  scene.add(himmel);

  const sonne = new THREE.DirectionalLight(0xfff4df, 1.9);
  sonne.name = 'aussen_sonne';
  sonne.position.copy(sonnenRichtung).multiplyScalar(1000);
  scene.add(sonne);

  // --- Meer -------------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const canvas2d = canvas.getContext('2d');
  const image = canvas2d.createImageData(256, 256);
  const wellen = [
    { a: 0.020, fx: 0.045, fz: 0.018, px: 0.0, pz: 0.4 },
    { a: 0.013, fx: -0.031, fz: 0.052, px: 1.7, pz: 2.1 },
    { a: 0.009, fx: 0.081, fz: -0.024, px: 3.0, pz: 0.8 },
    { a: 0.006, fx: -0.067, fz: -0.059, px: 4.2, pz: 3.4 }
  ];
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = (x / 256) * Math.PI * 2;
      const v = (y / 256) * Math.PI * 2;
      let dx = 0;
      let dz = 0;
      for (const w of wellen) {
        const phase = u * w.fx + v * w.fz + w.px;
        const other = u * w.fz - v * w.fx + w.pz;
        dx += Math.cos(phase) * w.a * w.fx;
        dz += Math.cos(other) * w.a * w.fz;
      }
      // Normale aus den Ableitungen, ohne Vektor-Allokation pro Pixel.
      let nx = -dx * 25;
      let ny = -dz * 25;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * 256 + x) * 4;
      image.data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      image.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      image.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      image.data[i + 3] = 255;
    }
  }
  canvas2d.putImageData(image, 0, 0);

  const normalMap = new THREE.CanvasTexture(canvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(180, 180);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.needsUpdate = true;

  const meerMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b4866,
    roughness: 0.18,
    metalness: 0.35,
    normalMap
  });
  const meer = new THREE.Mesh(new THREE.PlaneGeometry(19000, 19000), meerMaterial);
  meer.name = 'aussen_meer';
  meer.rotation.x = -Math.PI / 2;
  meer.position.y = wasserY;
  scene.add(meer);

  // --- Umgebung, Nebel --------------------------------------------------
  const alterNebel = scene.fog;
  const alterUmgebung = scene.environment;
  const alterUmgebungIntensitaet = scene.environmentIntensity;
  scene.fog = new THREE.Fog(0xe4edf3, 1400, 6200);

  // PMREMGenerator liegt im three-Kern, nicht in den Addons.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const himmelSzene = new THREE.Scene();
  const himmelKopie = new Sky();
  himmelKopie.scale.setScalar(10000);
  himmelKopie.material.uniforms.turbidity.value = 4;
  himmelKopie.material.uniforms.rayleigh.value = 1.6;
  himmelKopie.material.uniforms.mieCoefficient.value = 0.005;
  himmelKopie.material.uniforms.mieDirectionalG.value = 0.8;
  himmelKopie.material.uniforms.sunPosition.value.copy(sonnenRichtung);
  himmelSzene.add(himmelKopie);
  const umgebung = pmrem.fromScene(himmelSzene, 0.04, 0.1, 20000);
  pmrem.dispose();
  himmelKopie.geometry.dispose();
  himmelKopie.material.dispose();
  scene.environment = umgebung.texture;
  scene.environmentIntensity = 0.55;

  // --- Dienst -----------------------------------------------------------
  const strahlOrigin = new THREE.Vector3();
  const strahlRichtung = new THREE.Vector3(0, -1, 0);

  const imWasserPruefen = (pos) => {
    if (!pos) return false;
    if (!(pos.y < wasserY - 0.5)) return false;
    const kollision = services.get('kollision');
    if (kollision && typeof kollision.strahl === 'function') {
      strahlOrigin.set(pos.x, pos.y, pos.z);
      const treffer = kollision.strahl(strahlOrigin, strahlRichtung, 10000);
      if (treffer) return false;
    }
    return true;
  };

  services.register('aussen', {
    istImWasser: imWasserPruefen,
    get gruppe() { return stadtGruppe; },
    get istSichtbar() { return sichtbar; },
    neuLaden() { ladeStarten(settings.get('stufe')); },
    sichtbar(wert) {
      sichtbar = !!wert;
      stadtGruppe.visible = sichtbar;
      meer.visible = sichtbar;
      himmel.visible = sichtbar;
      sonne.intensity = sichtbar ? 1.9 : 0;
      scene.environment = sichtbar ? umgebung.texture : alterUmgebung;
      scene.environmentIntensity = sichtbar ? 0.55 : alterUmgebungIntensitaet;
    }
  });

  ctx.on('einstellung', ({ key }) => {
    if (key === 'stufe') ladeStarten(settings.get('stufe'));
  });

  // Hülle sofort laden – sonst bleibt beim Start nur Meer/Himmel sichtbar.
  ladeStarten(settings.get('stufe'));

  return {
    update(dt) {
      if (sichtbar) {
        normalMap.offset.x = (normalMap.offset.x + dt * 0.003) % 1;
        normalMap.offset.y = (normalMap.offset.y + dt * 0.0015) % 1;
      }
      kollisionAnwenden();
      raumAusschnittAktualisieren();
    },

    async selbsttest() {
      // Auf den Ladevorgang warten, damit echtes Verhalten geprüft wird.
      await ladePromise;
      const imWasser = imWasserPruefen({ x: 0, y: -3, z: 2000 });
      const nichtImWasser = imWasserPruefen({ x: 0, y: 10, z: 0 });
      const meerDa = !!meer && meer.geometry?.parameters?.width === 19000
        && Math.abs(meer.position.y - wasserY) < 0.001;
      const huelleDa = geladen && !!stadtMesh && stadtGruppe.children.length > 0;
      const ok = huelleDa && dreiecke > 50000 && meerDa
        && imWasser === true && nichtImWasser === false;
      const details = 'Hülle: ' + (huelleDa ? 'geladen' : 'nicht geladen')
        + ', Dreiecke: ' + dreiecke
        + ', Meer: ' + (meerDa ? 'vorhanden' : 'fehlt')
        + ', im Wasser: ' + imWasser
        + ', über Wasser: ' + nichtImWasser
        + (ladeFehler ? '; Fehler: ' + ladeFehler.message : '');
      return { ok, details };
    },

    dispose() {
      ++ladeToken;
      stadtEntfernen();
      scene.remove(stadtGruppe);
      scene.remove(meer);
      scene.remove(himmel);
      scene.remove(sonne);
      meer.geometry.dispose();
      meerMaterial.dispose();
      normalMap.dispose();
      umgebung.dispose();
      scene.fog = alterNebel;
      scene.environment = alterUmgebung;
      scene.environmentIntensity = alterUmgebungIntensitaet;
    }
  };
}

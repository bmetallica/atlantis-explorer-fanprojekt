// Nachbearbeitung: Leuchten (Bloom) in halber Auflösung, Stärke über Einstellung 'glow' (1–10);
// in der Grafikstufe „Niedrig“ aus (normaler Renderaufruf).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function init(ctx) {
  const { renderer, scene, camera, settings } = ctx;
  if (settings.get('stufe') !== 'hoch') return {};
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Verdeckungsabfragen gegen den Tiefenpuffer der gerade gezeichneten Szene (vor Bloom)
  const nachSzene = new Pass();
  nachSzene.needsSwap = false;
  nachSzene.render = (r, schreib, lese) => { if (!ctx.nachSzene?.length) return; r.setRenderTarget(lese); for (const h of ctx.nachSzene) h(lese); };
  composer.addPass(nachSzene);
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.6, 0.4, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // Draußen leuchtete der helle Himmel (HDR) über die Schwelle → ganzes Bild milchig. Draußen daher höhere Schwelle und
  // schwächerer Effekt; drinnen wie bisher (Lampen, Bildschirme). Weich überblendet beim Wechsel. – Claude
  let draussen = 0;
  const staerke = () => {
    const basis = 0.35 * settings.get('glow') / 6;      // vorher 0,6 – drinnen wirkte es zu stark
    bloom.strength = basis * (1 - 0.5 * draussen);
    bloom.threshold = 1.0 + 2.2 * draussen;
  };
  const groesse = () => { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2); };
  staerke(); groesse();
  addEventListener('resize', groesse);
  ctx.on('einstellung', ({ key }) => { if (key === 'glow') staerke(); });
  ctx.setRender(() => composer.render());
  return {
    update(dt) {
      const ia = ctx.services.get('innenaussen');
      const ziel = ia && !ia.drinnen && ctx.state.ort === 'atlantis' ? 1 : 0;
      if (Math.abs(ziel - draussen) < 0.001) return;
      draussen += (ziel - draussen) * Math.min(1, dt * 3);
      staerke();
    },
  };
}

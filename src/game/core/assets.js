// Laden von Räumen, Objekten und Korridoren aus der Datenbank-API (JS-Module mit create()).
// Ein geladener Raum steht an seiner Stadtplan-Position, ist gebündelt (wenige Draw Calls) und liefert
// Kollisionsboxen (COL_), Lampen (LAMP_), Benutzen-Punkte (INT_), Türen (DOOR_) und Objekte mit Funktionen.
import * as THREE from 'three';
import { batchGroup } from '/ui/batching.js';

const KIT = {
  wall: { color: 0xaab4c0, metalness: 0.55, roughness: 0.45 }, wallDark: { color: 0x4a6a8c, metalness: 0.6, roughness: 0.45 },
  copper: { color: 0xb08a59, metalness: 0.8, roughness: 0.35 }, pillar: { color: 0xd9e0e6, metalness: 0.35, roughness: 0.4 },
  hull: { color: 0xf0f0ec, metalness: 0.2, roughness: 0.4 }, floor: { color: 0x4f4a42, metalness: 0.5, roughness: 0.6 },
  floorUpper: { color: 0x5a544b, metalness: 0.5, roughness: 0.6 }, ceiling: { color: 0x2e3135, metalness: 0.4, roughness: 0.7 },
  stair: { color: 0x8a6e4b, metalness: 0.7, roughness: 0.45 }, door: { color: 0x8e98a4, metalness: 0.75, roughness: 0.35 },
  glass: { color: 0x6aa8e0, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35 }, rail: { color: 0xc49a5e, metalness: 0.9, roughness: 0.2 },
  glow: { color: 0x6fe3ff, emissive: 0x6fe3ff, emissiveIntensity: 1.3 }, amberGlow: { color: 0xffb060, emissive: 0xffb060, emissiveIntensity: 1.3 },
};

export function createAssets(ctx) {
  // Animationen (onBeforeRender) laufen unabhängig von der Sichtbarkeit: three.js ruft onBeforeRender nur für Meshes im Bild auf –
  // dann bliebe z. B. die Wählsequenz des Stargates stehen, wenn man nicht hinschaut. Solche Funktionen werden hier übernommen
  // und jedes Bild selbst aufgerufen (gebündelte Meshes übernimmt batching.js).
  const leer = THREE.Object3D.prototype.onBeforeRender;
  const animiert = new Map();                         // Mesh → ursprüngliche onBeforeRender-Funktion
  function animationenUebernehmen(root, nurSichtbare = false) {
    // Echte Abläufe (Stargate-Wählsequenz, Torschild, DHD, Jumper, Transporter, bewegliche Raumteile) nie drosseln – ihre
    // Zeitschritte sind begrenzt, gedrosselt würden sie stocken. Alles andere (Monitore, Anzeigen …) wird gedrosselt.
    const objId = root.userData?.objId;
    const wichtig = objId ? WICHTIG.has(objId) : !!root.userData?.api;
    root.traverse((o) => {
      if (!o.isMesh || o.onBeforeRender === leer) return;
      if (nurSichtbare && !o.layers.isEnabled(0)) return;   // gebündelt (Layer 1) → batching.js ruft auf
      animiert.set(o, o.onBeforeRender);
      o.onBeforeRender = leer;
      o.userData._anim = true;                       // für batching.js: bleibt beweglich
      if (wichtig) o.userData._wichtig = true;
    });
  }
  const WICHTIG = new Set(['OBJ-001', 'OBJ-011', 'OBJ-002', 'OBJ-097', 'OBJ-009', 'OBJ-043']);
  const kam = new THREE.Vector3(), kugel = new THREE.Sphere(), sicht = new THREE.Frustum(), pv = new THREE.Matrix4();
  let bild = 0;
  // Gedrosselte Animationen: sichtbar & nah jedes Bild, sichtbar & weiter weg jedes 4., außerhalb des Bildes/verdeckt jedes 30.
  // (Monitore der Krankenstation malten sonst hinter Wänden jedes Bild große Leinwände neu → Spiel reagierte kaum.) – Claude
  function animieren() {
    bild++;
    ctx.camera.getWorldPosition(kam);
    ctx.camera.updateMatrixWorld();
    pv.multiplyMatrices(ctx.camera.projectionMatrix, ctx.camera.matrixWorldInverse);
    sicht.setFromProjectionMatrix(pv);
    for (const [o, fn] of animiert) {
      let inSzene = false, versteckt = false;
      for (let p = o; p; p = p.parent) { if (!p.visible) versteckt = true; if (p === ctx.scene) { inSzene = true; break; } }
      if (!inSzene) { if (o.userData._warInSzene) animiert.delete(o); continue; }
      o.userData._warInSzene = true;
      if (!o.userData._wichtig) {
        const takt = (bild + o.id);
        if (versteckt) { if (takt % 30) continue; }
        else {
          if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
          kugel.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
          if (!sicht.intersectsSphere(kugel)) { if (takt % 30) continue; }
          else if (kugel.center.distanceToSquared(kam) > 144 && takt % 4) continue;
        }
      }
      try { fn.call(o, ctx.renderer, ctx.scene, ctx.camera, o.geometry, o.material, null); } catch (e) { console.error('Animation', o.name, e); animiert.delete(o); }
    }
  }
  const kitCache = {};
  const kit = (name) => (kitCache[name] ||= new THREE.MeshStandardMaterial({ name, ...(KIT[name.slice(4)] || { color: 0xff00ff }) }));
  let modelle = null;
  const modulCache = new Map();
  async function liste() {
    if (!modelle) {
      const d = await (await fetch('/models')).json();
      modelle = {};
      for (const m of d.models) if (m.models?.js) modelle[m.id] = `${m.models.js.url}?v=${encodeURIComponent(m.models.js.updated_at || '')}`;
    }
    return modelle;
  }
  async function modul(id) {
    const L = await liste();
    if (!L[id]) throw new Error(`kein Modell für ${id}`);
    if (!modulCache.has(id)) modulCache.set(id, import(L[id]));
    return modulCache.get(id);
  }
  const kitTauschen = (root) => root.traverse((o) => {
    if (o.isMesh) { const ms = [].concat(o.material).map((m) => (m && /^KIT_/.test(m.name) ? kit(m.name) : m)); o.material = Array.isArray(o.material) ? ms : ms[0]; }
  });

  /** Objekt (OBJ-xxx) erzeugen; opts gehen an create(). */
  // Gegen Flimmern (Z-Fighting): Modelle aus Quadern haben oft exakt deckungsgleiche Flächen (Bildschirm/Rahmen, Türzarge/Wand).
  // Jedes Teil wird einmalig um seine eigene Mitte minimal geschrumpft: je Achse 0,2 % der halben Ausdehnung, höchstens 2 mm.
  // Verschieden große Teile liegen danach auseinander, das kleinere gewinnt eindeutig. Ausgenommen sind flächige Teile
  // (in zwei Richtungen ≥ 3 m: Böden, Decken) – dort keine Spalten. – Claude
  const FLIMMER_GROSS = 3, FLIMMER_ANTEIL = 0.002, FLIMMER_MAX = 0.002;
  const fbMitte = new THREE.Vector3(), fbGroesse = new THREE.Vector3();
  function entflimmern(root) {
    root.traverse((o) => {
      const g = o.geometry;
      if (!o.isMesh || !g?.attributes?.position || g.userData._entflimmert || /^(COL_|INT_|LAMP_|DOOR_|PLACE_)/.test(o.name)) return;
      if (o.isSkinnedMesh) return;
      if (!g.boundingBox) g.computeBoundingBox();
      g.boundingBox.getSize(fbGroesse);
      const gross = (fbGroesse.x >= FLIMMER_GROSS) + (fbGroesse.y >= FLIMMER_GROSS) + (fbGroesse.z >= FLIMMER_GROSS);
      if (gross >= 2) return;
      const f = (d) => { const h = d / 2; return h > 1e-6 ? (h - Math.min(FLIMMER_ANTEIL * h, FLIMMER_MAX)) / h : 1; };
      g.boundingBox.getCenter(fbMitte);
      g.translate(-fbMitte.x, -fbMitte.y, -fbMitte.z);
      g.scale(f(fbGroesse.x), f(fbGroesse.y), f(fbGroesse.z));
      g.translate(fbMitte.x, fbMitte.y, fbMitte.z);
      g.boundingBox = null; g.boundingSphere = null;
      g.userData._entflimmert = true;
    });
  }

  // Eigene Shader (ShaderMaterial, z. B. Ereignishorizont, Kawoosh, Torschild) schreiben ihre Tiefe linear; der Renderer nutzt
  // aber einen logarithmischen Tiefenpuffer → solche Flächen verschwinden hinter anderer Geometrie. Hier die logarithmische
  // Tiefe nachrüsten (wie three.js' logdepthbuf-Chunks). – Claude
  const LOG_VS_KOPF = '#ifdef USE_LOGDEPTHBUF\nvarying float vFragDepth;\nvarying float vIsPerspective;\n#endif\n';
  const LOG_VS_ENDE = '\n#ifdef USE_LOGDEPTHBUF\n  vFragDepth = 1.0 + gl_Position.w;\n  vIsPerspective = 1.0;\n#endif\n';
  const LOG_FS_KOPF = '#ifdef USE_LOGDEPTHBUF\nuniform float logDepthBufFC;\nvarying float vFragDepth;\nvarying float vIsPerspective;\n#endif\n';
  const LOG_FS_ENDE = '\n#ifdef USE_LOGDEPTHBUF\n  gl_FragDepth = log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif\n';
  const vorLetzterKlammer = (src, einschub) => { const i = src.lastIndexOf('}'); return i < 0 ? src : src.slice(0, i) + einschub + src.slice(i); };
  function logTiefeNachruesten(root) {
    if (!ctx.renderer.capabilities.logarithmicDepthBuffer) return;
    root.traverse((o) => {
      for (const m of [].concat(o.material || [])) {
        if (!m?.isShaderMaterial || m.isRawShaderMaterial || m.userData._logTiefe) continue;
        if (/logdepthbuf|gl_FragDepth/.test(m.vertexShader + m.fragmentShader)) { m.userData._logTiefe = true; continue; }
        m.vertexShader = LOG_VS_KOPF + vorLetzterKlammer(m.vertexShader, LOG_VS_ENDE);
        m.fragmentShader = LOG_FS_KOPF + vorLetzterKlammer(m.fragmentShader, LOG_FS_ENDE);
        m.userData._logTiefe = true;
        m.needsUpdate = true;
      }
    });
  }

  // Echte Lichter in Modellen (z. B. Wandleuchten) ändern beim Laden die Lichtzahl → three.js übersetzt dann ALLE Shader neu
  // (im Gang vor der Stasiskammer >300 Programme, Spiel stand minutenlang). Deshalb werden sie unsichtbar gestellt und als
  // Lampen-Einträge an den Lichtpool gegeben; Farbe/Stärke/Reichweite und Ein/Aus des Modells bleiben wirksam. – Claude
  const LICHT_FAKTOR = 2.5;                     // Lichtpool rechnet Stärke × 0,4 → ursprüngliche Stärke bleibt erhalten
  function lichterUmwandeln(root) {
    root.traverse((o) => {
      if (!o.isLight || o.userData._lampe !== undefined || o.isHemisphereLight || o.isAmbientLight) return;
      const l = o;
      let soll = l.visible;
      Object.defineProperty(l, 'visible', { get: () => false, set: (v) => { soll = v; }, configurable: true });
      if (!(l.isPointLight || l.isSpotLight)) { l.userData._lampe = null; return; }
      const pos = new THREE.Vector3();
      l.userData._lampe = {
        get pos() { return l.getWorldPosition(pos); },
        get color() { return '#' + l.color.getHexString(); },
        get intensity() { return soll ? l.intensity * LICHT_FAKTOR : 0; },
        get distance() { return l.distance || 10; },
      };
    });
  }
  function lampenAus(root) {
    const lampen = [];
    root.traverse((o) => { if (o.isLight && o.userData._lampe) lampen.push(o.userData._lampe); });
    return lampen;
  }

  async function objekt(id, opts = {}) {
    const root = (await modul(id)).create({ sound: false, ...opts });
    root.userData.objId = id;
    kitTauschen(root);
    entflimmern(root);
    logTiefeNachruesten(root);
    lichterUmwandeln(root);
    animationenUebernehmen(root);
    return root;
  }

  /** Inhalt eines Modells auswerten: COL_, LAMP_, INT_, DOOR_, Funktionsobjekte (Weltkoordinaten). */
  function auswerten(gruppe) {
    gruppe.updateMatrixWorld(true);
    const info = { kollision: [], lampen: [], benutzen: [], tueren: [], funktionen: [] };
    gruppe.traverse((o) => {
      if (/^COL_/.test(o.name)) { o.visible = false; info.kollision.push(o); }
      // sichtbare Bodenflächen zusätzlich als Kollision (Modelle haben teils Lücken in den COL_-Böden);
      // Luken/Klappen/Rampen bleiben ausgenommen (beweglich, z. B. Bodenluke der Jumper-Bucht)
      else if (o.isMesh && /^(boden|floor)/i.test(o.name) && !/luke|klappe|rampe|tuer|door/i.test(o.name)) info.kollision.push(o);
      else if (/^LAMP_/.test(o.name)) info.lampen.push({ obj: o, pos: o.getWorldPosition(new THREE.Vector3()), ...o.userData });
      else if (/^INT_/.test(o.name)) info.benutzen.push({ obj: o, pos: o.getWorldPosition(new THREE.Vector3()), ...o.userData });
      else if (/^DOOR_/.test(o.name)) info.tueren.push({ obj: o, name: o.name, pos: o.getWorldPosition(new THREE.Vector3()), ...o.userData });
      if (o.userData?.actions?.length) info.funktionen.push(o);
    });
    return info;
  }

  /** Raum (ATL-xxx) mit allen Objekten an seiner Stadtplan-Position laden und bündeln. */
  // Aufbau über mehrere Bilder verteilen: höchstens BUDGET ms Arbeit am Stück, dann ein Bild lang Pause (kein Ruckeln beim Nachladen)
  const BUDGET = 6;
  let scheibe = performance.now();
  const naechstesBild = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  async function abgeben(sofort = false) {
    if (sofort || performance.now() - scheibe > BUDGET) { await naechstesBild(); scheibe = performance.now(); }
  }

  async function raum(id, { position, rotY = 0, opts = {} } = {}) {
    const eintrag = ctx.plan.raeume.find((r) => r.id === id);
    const g = new THREE.Group(); g.name = 'raum_' + id;
    g.visible = false;                                   // erst zeigen, wenn alles aufgebaut und übersetzt ist
    const mod = await modul(id);
    await abgeben(true);
    const root = mod.create({ sound: false, ...opts });
    kitTauschen(root);
    entflimmern(root);
    logTiefeNachruesten(root);
    g.add(root);
    root.updateMatrixWorld(true);
    const plaetze = [];
    root.traverse((o) => { const m = o.name.match(/^PLACE_(OBJ-\d{3})/); if (m) plaetze.push([m[1], o]); });
    // Objektmodule parallel holen (Netz), aber nacheinander und in Zeitscheiben aufbauen
    await Promise.all(plaetze.map(([oid]) => modul(oid).catch(() => null)));
    for (const [oid, anker] of plaetze) {
      await abgeben();
      try { const inst = await objekt(oid); anker.matrixWorld.decompose(inst.position, inst.quaternion, inst.scale); g.add(inst); }
      catch (e) { ctx.log('Objekt fehlt', oid, e.message); }
    }
    const p = position || eintrag?.pos || [0, 0, 0];
    g.position.fromArray(p); g.rotation.y = position ? rotY : (eintrag?.rotY || 0);
    ctx.scene.add(g);
    await abgeben();
    lichterUmwandeln(g);
    const info = auswerten(g);
    info.lampen.push(...lampenAus(g));
    await abgeben();
    const buendel = batchGroup(g, { renderer: ctx.renderer, scene: ctx.scene, camera: ctx.camera, lambert: ctx.settings.get('stufe') === 'niedrig', parent: g });
    // Shader im Hintergrund übersetzen (KHR_parallel_shader_compile), dann sichtbar schalten
    try { await ctx.renderer.compileAsync(g, ctx.camera, ctx.scene); } catch { /* ältere Browser: beim ersten Zeichnen */ }
    g.visible = true;
    scheibe = performance.now();
    animationenUebernehmen(root, true);
    let n = 0, raumBox = null;
    return {
      id, gruppe: g, ...info, buendel,
      update() {
        // Räume, deren Mitte weiter als 25 m entfernt ist, nur jedes 6. Bild synchronisieren
        n++;
        // verdeckte Räume (Dienst 'verdeckung' blendet die Gruppe aus) nur selten aktualisieren
        if (!g.visible && n % 30 !== 0) return;
        if (n % 6 !== 0) {
          if (!raumBox) raumBox = new THREE.Box3().setFromObject(root);   // einmalig (Raumhülle steht still)
          if (raumBox.distanceToPoint(ctx.camera.getWorldPosition(kam)) > 25) return;
        }
        buendel.update();
      },
      dispose() { buendel.dispose(); g.removeFromParent(); g.traverse((o) => { o.geometry?.dispose?.(); }); },
    };
  }

  /** Korridorsegment (ATL-049 mit opts) an Stadtplan-Position. */
  async function korridor(k) {
    return raum('ATL-049', { position: k.pos, rotY: k.rotY, opts: k.opts });
  }
  return { liste, modul, objekt, raum, korridor, kit, auswerten, animieren, animationen: () => animiert };
}

// Als Spielmodul: stellt den Dienst 'assets' bereit (muss in der Modulliste vor allen Nutzern stehen)
export function init(ctx) {
  const assets = createAssets(ctx);
  ctx.services.register('assets', assets);
  return { update: () => assets.animieren() };
}

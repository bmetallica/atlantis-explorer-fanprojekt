// Verdeckung (Occlusion Culling) per Grafikkarten-Abfrage: geladene Räume/Korridore und Kacheln der Stadthülle
// werden nicht gezeichnet, solange ihr Hüllquader komplett hinter bereits gezeichneter Geometrie liegt.
// Ablauf (jedes 2. Bild, nach dem Zeichnen der Szene, gegen deren Tiefenpuffer): je Kandidat ein unsichtbarer Quader
// mit ANY_SAMPLES_PASSED-Abfrage (exakt; die konservative Variante meldet zu oft „sichtbar“); Ergebnis 1–3 Bilder später. Verstecken erst nach 2 verdeckten Ergebnissen,
// Zeigen sofort; Kamera im (vergrößerten) Quader → immer sichtbar; außerhalb des Sichtkegels → sichtbar lassen
// (three.js verwirft es dort ohnehin). Abschaltbar mit ?verdeckung=0. Geschrieben von Claude.
import * as THREE from 'three';

const RAND = 0.3;            // m: Quader etwas größer als der Inhalt (eigene Wände verdecken den Quader nicht)
const KAMERA_RAND = 0.8;     // m: Kamera so nah am Quader → immer sichtbar
const VERSTECK_NACH = 4;     // verdeckte Ergebnisse in Folge bis zum Ausblenden

export function init(ctx) {
  const { renderer, camera, services } = ctx;
  if (new URLSearchParams(location.search).get('verdeckung') === '0') return {};
  const gl = renderer.getContext();
  if (!(gl instanceof WebGL2RenderingContext)) return {};

  const proxyScene = new THREE.Scene();
  proxyScene.matrixWorldAutoUpdate = true;
  const quaderGeo = new THREE.BoxGeometry(1, 1, 1);
  const quaderMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const kandidaten = new Map();          // Objekt → Eintrag
  const kam = new THREE.Vector3(), blick = new THREE.Vector3(), letzterBlick = new THREE.Vector3(), letztePos = new THREE.Vector3();
  let takt = 0, listeTakt = 0, aktiv = true;
  const zaehler = { ausgegeben: 0, sichtbar: 0, verdeckt: 0, schnell: 0, nah: 0 };

  function eintragAnlegen(obj, box) {
    const proxy = new THREE.Mesh(quaderGeo, quaderMat);
    const groesse = box.getSize(new THREE.Vector3()).addScalar(2 * RAND);
    box.getCenter(proxy.position);
    proxy.scale.copy(groesse);
    proxy.updateMatrixWorld(true);
    const e = { obj, box: box.clone().expandByScalar(KAMERA_RAND), proxy, query: gl.createQuery(), offen: false, ausgegeben: false, verdecktInFolge: 0 };
    proxy.onBeforeRender = () => { gl.beginQuery(gl.ANY_SAMPLES_PASSED, e.query); e.ausgegeben = true; zaehler.ausgegeben++; };
    proxy.onAfterRender = () => { gl.endQuery(gl.ANY_SAMPLES_PASSED); e.offen = true; };
    proxyScene.add(proxy);
    kandidaten.set(obj, e);
  }

  function eintragEntfernen(obj) {
    const e = kandidaten.get(obj);
    if (!e) return;
    proxyScene.remove(e.proxy);
    gl.deleteQuery(e.query);
    obj.visible = true;
    kandidaten.delete(obj);
  }

  // Kandidatenliste mit geladenen Räumen und Hüllenkacheln abgleichen
  function listeAbgleichen() {
    const soll = new Set();
    for (const h of services.get('welt')?.geladen?.() || []) {
      const g = h?.gruppe;
      if (!g) continue;
      soll.add(g);
      if (!kandidaten.has(g)) { g.updateMatrixWorld(true); eintragAnlegen(g, new THREE.Box3().setFromObject(g)); }
    }
    services.get('aussen')?.gruppe?.traverse((o) => {
      if (!o.isLOD) return;
      soll.add(o);
      if (!kandidaten.has(o)) {
        const voll = o.levels[0]?.object;
        if (!voll?.geometry) return;
        o.updateMatrixWorld(true);
        voll.geometry.computeBoundingBox();
        eintragAnlegen(o, voll.geometry.boundingBox.clone().applyMatrix4(voll.matrixWorld));
      }
    });
    for (const obj of Array.from(kandidaten.keys())) if (!soll.has(obj)) eintragEntfernen(obj);
  }

  // Eltern sichtbar? (z. B. Stadthülle drinnen ausgeblendet → Kacheln nicht prüfen)
  function elternSichtbar(obj) {
    for (let p = obj.parent; p; p = p.parent) if (!p.visible) return false;
    return !!obj.parent;
  }

  function ergebnisseLesen() {
    for (const e of kandidaten.values()) {
      if (!e.offen) continue;
      if (!gl.getQueryParameter(e.query, gl.QUERY_RESULT_AVAILABLE)) continue;
      e.offen = false;
      const sichtbar = gl.getQueryParameter(e.query, gl.QUERY_RESULT) > 0;
      if (sichtbar) zaehler.sichtbar++; else zaehler.verdeckt++;
      if (sichtbar) { e.verdecktInFolge = 0; e.obj.visible = true; }
      else if (++e.verdecktInFolge >= VERSTECK_NACH) e.obj.visible = false;
    }
  }

  function pruefen() {
    if (!aktiv || ++takt % 2) return;
    if (++listeTakt % 30 === 1) listeAbgleichen();
    ergebnisseLesen();
    camera.getWorldPosition(kam);
    // schnelle Drehung/Bewegung: Abfrageergebnisse wären veraltet → diesmal alles zeigen (kein Aufploppen beim Umdrehen)
    camera.getWorldDirection(blick);
    const schnell = blick.dot(letzterBlick) < 0.985 || kam.distanceTo(letztePos) > 1.5;
    letzterBlick.copy(blick); letztePos.copy(kam);
    if (schnell) zaehler.schnell++;
    if (schnell) for (const e of kandidaten.values()) { e.obj.visible = true; e.verdecktInFolge = 0; }
    for (const e of kandidaten.values()) {
      e.ausgegeben = false;
      const nah = e.box.containsPoint(kam);
      if (nah) { e.obj.visible = true; e.verdecktInFolge = 0; zaehler.nah++; }
      e.proxy.visible = !nah && !e.offen && elternSichtbar(e.obj);
    }
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(proxyScene, camera);
    renderer.autoClear = autoClear;
    // nicht ausgegeben (außerhalb des Sichtkegels) → sichtbar lassen, damit beim Umdrehen nichts fehlt
    for (const e of kandidaten.values()) if (e.proxy.visible && !e.ausgegeben) { e.obj.visible = true; e.verdecktInFolge = 0; }
  }
  ctx.nachSzene.push(pruefen);

  services.register('verdeckung', {
    get aktiv() { return aktiv; },
    set aktiv(an) { aktiv = !!an; if (!aktiv) for (const e of kandidaten.values()) e.obj.visible = true; },
    statistik() {
      let versteckt = 0;
      for (const e of kandidaten.values()) if (!e.obj.visible) versteckt++;
      return { kandidaten: kandidaten.size, versteckt, ...zaehler };
    },
  });

  return {
    dispose() {
      const i = ctx.nachSzene.indexOf(pruefen);
      if (i >= 0) ctx.nachSzene.splice(i, 1);
      for (const obj of Array.from(kandidaten.keys())) eintragEntfernen(obj);
    },
  };
}

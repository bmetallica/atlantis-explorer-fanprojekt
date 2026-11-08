// Bündelung eines Raums (oder Objekts) in wenige BatchedMeshes – braucht three.js ≥ r166.
//
// Die Originalobjekte bleiben als unsichtbare Steuerobjekte erhalten (Layer 1): Animationen (onBeforeRender)
// und Funktionen (actions/api) laufen unverändert weiter. update() ruft die Animationen auf und überträgt
// Lage, Sichtbarkeit und Farbe der beweglichen Teile in die Bündel. Gebündelt werden Meshes ohne Texturen;
// Teile mit Texturen (z. B. Canvas-Displays) bleiben normale Meshes.
//
//   const b = batchGroup(roomGroup, { renderer, scene, camera });
//   // je Bild:  b.update();  renderer.render(scene, camera);
import * as THREE from 'three';

const HIDDEN_LAYER = 1;
const q = (v, s) => Math.round(v / s) * s;
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const TEX_KEYS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'lightMap', 'envMap', 'displacementMap'];

function classify(m) {
  if (!m || !(m.isMeshStandardMaterial || m.isMeshBasicMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return null;
  if (TEX_KEYS.some((k) => m[k])) return null;
  if (m.vertexColors || m.wireframe) return null;
  const transp = m.transparent ? q(m.opacity, 0.1).toFixed(1) : '1';
  const glow = m.isMeshBasicMaterial || (m.emissive && lum(m.emissive) * (m.emissiveIntensity ?? 1) > Math.max(0.12, lum(m.color) * 0.5));
  if (glow) return { key: ['glow', transp, m.side, m.blending, m.depthWrite, m.toneMapped].join('|'), glow: true };
  return { key: ['lit', q(m.metalness ?? 0.3, 0.25).toFixed(2), q(m.roughness ?? 0.6, 0.25).toFixed(2), transp, m.side, m.depthWrite].join('|'), glow: false };
}

function makeMaterial(sample, glow, lambert = false) {
  const common = { side: sample.side, transparent: sample.transparent, opacity: sample.transparent ? q(sample.opacity, 0.1) : 1, depthWrite: sample.depthWrite };
  if (glow) return new THREE.MeshBasicMaterial({ ...common, color: 0xffffff, blending: sample.blending, toneMapped: sample.toneMapped });
  if (lambert) return new THREE.MeshLambertMaterial({ ...common, color: 0xffffff });   // Grafikstufe „Niedrig“: billiger pro Pixel
  return new THREE.MeshStandardMaterial({ ...common, color: 0xffffff, metalness: q(sample.metalness ?? 0.3, 0.25), roughness: q(sample.roughness ?? 0.6, 0.25) });
}

// Farbe, die ein Teil im Bündel bekommt: beleuchtet = Grundfarbe, Leuchtteil = Leuchtfarbe × Stärke
function partColor(m, glow, out) {
  if (!glow) return out.copy(m.color);
  if (m.isMeshBasicMaterial) return out.copy(m.color);
  return out.copy(m.emissive).multiplyScalar(m.emissiveIntensity ?? 1).add(m.color.clone().multiplyScalar(0.15));
}

function prepGeometry(g) {
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', g.attributes.position);
  if (g.attributes.normal) out.setAttribute('normal', g.attributes.normal);
  out.setIndex(g.index || [...Array(g.attributes.position.count).keys()]);
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}

export function batchGroup(group, { renderer, scene, camera, lambert = false, parent = null }) {
  group.updateMatrixWorld(true);
  const isDefaultOBR = (o) => o.onBeforeRender === THREE.Object3D.prototype.onBeforeRender;
  // Wurzeln, unter denen sich etwas bewegen kann: Objekte mit Animation oder Funktionen
  const dynRoots = new Set();
  const markDyn = (root) => {
    let d = !!(root.userData && (root.userData.actions || root.userData.api));
    root.traverse((o) => { if (!isDefaultOBR(o) || o.userData?._anim) d = true; });   // _anim: Animation vom Spielkern übernommen
    if (d) dynRoots.add(root);
  };
  group.children.forEach(markDyn);

  const buckets = new Map();           // key → { glow, sample, geos: Map(geoUuid → prepared), items: [] }
  const callbacks = [];                // onBeforeRender gebündelter Meshes, wird von update() aufgerufen
  group.traverse((o) => {
    if (!o.isMesh || /^COL_/.test(o.name) || Array.isArray(o.material)) return;
    const c = classify(o.material);
    if (!c) return;
    let root = o; while (root.parent && root.parent !== group) root = root.parent;
    let b = buckets.get(c.key);
    if (!b) buckets.set(c.key, (b = { glow: c.glow, sample: o.material, geos: new Map(), items: [] }));
    if (!b.geos.has(o.geometry.uuid)) b.geos.set(o.geometry.uuid, prepGeometry(o.geometry));
    const n = o.isInstancedMesh ? o.count : 1;
    for (let i = 0; i < n; i++) b.items.push({ o, i: o.isInstancedMesh ? i : -1, dyn: dynRoots.has(root), root });
    if (!isDefaultOBR(o)) callbacks.push(o);
    o.layers.set(HIDDEN_LAYER);       // Original nicht mehr zeichnen, Zustand bleibt lesbar
  });

  const batches = [];
  const tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpC = new THREE.Color();
  const effVisible = (o, root) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === root) break; } return true; };
  // Hängen die Bündel an einem Elternobjekt (z. B. dem Raum), gelten ihre Matrizen relativ zu diesem
  const parentInv = new THREE.Matrix4();
  const refreshParent = () => { if (parent) { parent.updateMatrixWorld(true); parentInv.copy(parent.matrixWorld).invert(); } };
  refreshParent();
  const worldMatrix = (it, out) => {
    if (it.i < 0) out.copy(it.o.matrixWorld);
    else { it.o.getMatrixAt(it.i, tmpM2); out.multiplyMatrices(it.o.matrixWorld, tmpM2); }
    return parent ? out.premultiply(parentInv) : out;
  };
  const itemColor = (it, glow, out) => {
    if (it.i >= 0 && it.o.instanceColor) { it.o.getColorAt(it.i, out); return glow ? out : out.multiply(it.o.material.color); }
    return partColor(it.o.material, glow, out);
  };
  for (const b of buckets.values()) {
    let verts = 0, idx = 0;
    for (const g of b.geos.values()) { verts += g.attributes.position.count; idx += g.index.count; }
    const bm = new THREE.BatchedMesh(b.items.length, verts, idx, makeMaterial(b.sample, b.glow, lambert));
    bm.name = 'BATCH_' + (b.glow ? 'glow' : 'lit');
    // Kein Kulling/Sortieren je Teil: das kostete jedes Bild CPU und einen Textur-Upload je Bündel (bei 25 Räumen ~300 Uploads/Bild).
    // Stattdessen wird das Bündel als Ganzes per Hüllkugel (mit Rand für bewegliche Teile) verworfen. – Claude
    bm.perObjectFrustumCulled = false;
    bm.sortObjects = false;
    const geoIds = new Map();
    for (const [uuid, g] of b.geos) geoIds.set(uuid, bm.addGeometry(g));
    const dynItems = [];
    for (const it of b.items) {
      const id = bm.addInstance(geoIds.get(it.o.geometry.uuid));
      bm.setMatrixAt(id, worldMatrix(it, tmpM));
      bm.setColorAt(id, itemColor(it, b.glow, tmpC));
      const vis = effVisible(it.o, it.root);
      bm.setVisibleAt(id, vis);
      if (it.dyn) dynItems.push({ ...it, id, last: tmpM.clone(), lastVis: vis, lastCol: tmpC.getHex() });
    }
    bm.computeBoundingSphere();
    if (bm.boundingSphere) bm.boundingSphere.radius += 2;
    bm.frustumCulled = true;
    (parent || scene).add(bm);
    batches.push({ bm, glow: b.glow, dynItems });
  }

  const roots = [...dynRoots];
  return {
    batches: batches.map((b) => b.bm),
    stats: { gebuendelt: batches.reduce((s, b) => s + b.bm.instanceCount, 0), buendel: batches.length, beweglich: batches.reduce((s, b) => s + b.dynItems.length, 0), animationen: callbacks.length },
    update() {
      refreshParent();
      for (const o of callbacks) o.onBeforeRender(renderer, scene, camera, o.geometry, o.material, null);
      for (const r of roots) r.updateMatrixWorld();
      for (const b of batches) {
        for (const it of b.dynItems) {
          worldMatrix(it, tmpM);
          if (!tmpM.equals(it.last)) { b.bm.setMatrixAt(it.id, tmpM); it.last.copy(tmpM); }
          const vis = effVisible(it.o, it.root);
          if (vis !== it.lastVis) { b.bm.setVisibleAt(it.id, vis); it.lastVis = vis; }
          const col = itemColor(it, b.glow, tmpC).getHex();
          if (col !== it.lastCol) { b.bm.setColorAt(it.id, tmpC); it.lastCol = col; }
        }
      }
    },
    dispose() { for (const b of batches) { b.bm.removeFromParent(); b.bm.dispose(); b.bm.material.dispose(); } },
  };
}

// Stargate der Atlantis (OBJ-001) – Pegasus-Bauart, Code-Objekt für das Atlantis-Spiel.
// Regeln wie in OBJEKTE.md: 1 Einheit = 1 m, +Y oben, Vorderseite +Z, Ursprung = Mitte der Unterseite.
//
// Maße: Ring Ø 6,70 m außen, Öffnung Ø 5,20 m, Ringtiefe 0,75 m. Wie in der Torhalle der Serie steht das Tor
//       ohne Sockel und ist um die Ringbreite im Boden versenkt (sichtbar ca. 6,0 m hoch).
// Aufbau: massiver Ring (geschlossenes Lathe-Profil, gerippte Innenlippe, Glyphenspur, Außenband), 36 Glyphen-
//         Displays (Punkt-Sternbilder), 9 V-Chevrons mit Linse, Ereignishorizont, Kawoosh, Torschild, Horizont-Licht.
//
// Funktionen (root.userData.api):
//   dial(adresse)      Adresse wählen: Array aus 7–9 Glyphen-Nummern (0–35). 8 = Intergalaktisch (Erde).
//   incoming()         Eingehendes Wurmloch (alle Chevrons laufen in schneller Folge auf).
//   close()            Wurmloch schließen bzw. Anwahl abbrechen.
//   setShield(on)      Torschild an/aus.   shieldImpact()  Aufprall eines Objekts auf den Schild.
//   state              'idle' | 'dialing' | 'kawoosh' | 'open' | 'closing'
//   onChange(fn)       Callback (state, info) bei Zustandswechsel.
// root.userData.actions: fertige Aktionen [{ id, label, run }] für Menüs (Spiel-INT oder Viewer).
//
// Animation: läuft selbstständig (onBeforeRender), keine Einbindung in die Spielschleife nötig.
// Optional kann das Spiel root.userData.update(dt) pro Frame aufrufen.
//
// Einbau:
//   const gate = b.prop('stargate_atlantis', [x, y, z], { actions: {
//     tor: () => ({ menu: { title: 'Stargate', options: gate.userData.actions } }),
//     horizont: () => gate.userData.api.state === 'open'
//       ? { teleport: { position: [...], yaw: 0 } } : { menu: { title: 'Das Tor ist nicht aktiv', options: [] } },
//   } });
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'stargate_atlantis',
  datei: 'src/level/props/stargate_atlantis.js',
  art: 'Standobjekt',
  masse: '6.76 × 5.99 × 0.86 (B × H × T, m; sichtbar über Boden, Ring 0,75 m im Boden versenkt)',
  wohin: 'Torhalle (ATL-001 / ATL-045), Podest vor dem Buntglasfenster, Vorderseite zur Treppe',
  benutzen: 'INT_tor → Anwahl-Menü (userData.actions); INT_horizont → Durchschreiten, wenn state = open',
  lichter: 'Dynamisches PointLight „horizont_licht“ (eisblau, nur bei offenem Wurmloch); kein LAMP_, damit das Tor im Ruhezustand dunkel bleibt',
  animation: 'Glyphen-Lauflicht, Chevron-Verriegelung, Kawoosh, Ereignishorizont-Wellen, Schild-Schimmern, Schließen',
  quelle: 'selbst gebaut (prozedural), Referenz: Serien-Screencaps / MGM Tech Journal; Glyphen stilisiert',
};

// ---------------------------------------------------------------- Maße
const R_OUT = 3.35;          // Außenradius (Ø 6,70 m)
const R_IN = 2.60;           // Öffnung (Ø 5,20 m) – Ringbreite 0,75 m ≈ 11 % des Durchmessers (gemessen an Screencaps)
const DEPTH = 0.75;          // Ringtiefe
const H = DEPTH / 2;
// Wie in der Serie: Das Tor steht ohne Sockel im Boden, versenkt um die Ringbreite –
// der untere Rand der Öffnung liegt bündig mit dem Boden (Chevron 8 und 9 liegen unter Bodenniveau).
const CY = R_IN + 0.02;      // Ringmitte über dem Boden
const GLYPHS = 36;
const GLYPH_IDLE = 0.08;     // Glyphen im Ruhezustand: Punkte nur schwach sichtbar
const CHEV_IDLE = 0.35;      // Chevron-Linsen im Ruhezustand: mattes Cyan
const CH_R = 3.13;           // Radius der Chevron-Mitte (Spitze ragt in die Glyphenspur, Kappe über den Außenrand)
const CHEVRONS = 9;
// Chevron-Winkel (Grad, im Uhrzeigersinn ab oben, Blick von vorn) in Verriegelungsreihenfolge 1..9
const CHEVRON_ORDER_DEG = [40, 80, 120, 240, 280, 320, 0, 160, 200];

// ---------------------------------------------------------------- Hilfen
const TAU = Math.PI * 2;
// Winkel "im Uhrzeigersinn ab oben" → mathematischer Winkel in der XY-Ebene
const toRad = (degCw) => Math.PI / 2 - (degCw * Math.PI) / 180;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Glyphen-Atlas (6 × 6): Pegasus-Glyphen als Sternbilder aus Leuchtpunkten mit punktierten Verbindungen
// (stilisiert nach den Screencaps, keine Kopie der Originalsymbole)
function makeGlyphAtlas() {
  const cell = 128, n = 6;
  const c = document.createElement('canvas');
  c.width = c.height = cell * n;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < GLYPHS; i++) {
    const ox = (i % n) * cell, oy = Math.floor(i / n) * cell;
    const r = rng(1000 + i * 77);
    g.save();
    g.translate(ox, oy);
    const pts = [];
    const k = 6 + Math.floor(r() * 6);
    let x = 30 + r() * 68, y = 26 + r() * 76;
    for (let j = 0; j < k; j++) {               // zusammenhängende Kette mit Verzweigungen
      pts.push([x, y]);
      const base = pts[Math.floor(r() * pts.length)];
      x = Math.min(112, Math.max(16, base[0] + (r() - 0.5) * 52));
      y = Math.min(112, Math.max(16, base[1] + (r() - 0.5) * 52));
    }
    g.strokeStyle = 'rgba(255,255,255,0.45)';   // punktierte Verbindungslinien
    g.lineWidth = 2;
    g.setLineDash([3, 4]);
    for (let j = 1; j < pts.length; j++) {
      const a = pts[j], b = pts[Math.floor(r() * j)];
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    g.setLineDash([]);
    for (const [px, py] of pts) {                // Leuchtpunkte mit weichem Hof
      const rad = 3.5 + r() * 3;
      const grd = g.createRadialGradient(px, py, 0, px, py, rad * 2.2);
      grd.addColorStop(0, '#fff'); grd.addColorStop(0.45, 'rgba(255,255,255,0.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(px, py, rad * 2.2, 0, TAU); g.fill();
    }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Feines Panelraster für die Metalloberfläche (Rauheit + Farbe)
function makeMetalTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#8a96a3';
  g.fillRect(0, 0, c.width, c.height);
  const r = rng(42);
  for (let i = 0; i < 4000; i++) { // leichte Mikrostruktur
    const v = 120 + Math.floor(r() * 40);
    g.fillStyle = `rgba(${v},${v + 8},${v + 18},0.25)`;
    g.fillRect(r() * c.width, r() * c.height, 2, 1);
  }
  g.fillStyle = 'rgba(30,40,55,0.8)'; // Plattenfugen (entlang des Umfangs)
  for (let x = 0; x < c.width; x += c.width / 72) g.fillRect(x, 0, 2, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------- Shader
const HORIZON_VS = /* glsl */`
  varying vec2 vUv; varying vec3 vPos;
  uniform float uTime; uniform float uAmp;
  void main() {
    vUv = uv; vec3 p = position;
    float r = length(p.xy);
    p.z += uAmp * 0.06 * sin(r * 6.0 - uTime * 3.0) * (1.0 - smoothstep(1.6, 2.4, r));
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const HORIZON_FS = /* glsl */`
  varying vec2 vUv; varying vec3 vPos;
  uniform float uTime; uniform float uOpacity; uniform float uFlash;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float ridge(vec2 p){ return 1.0 - abs(noise(p) * 2.0 - 1.0); }
  void main() {
    vec2 p = vPos.xy; float r = length(p) / ${R_IN.toFixed(2)};
    // Domain-Warp + Rippen-Rauschen ergibt das Adernetz wie Licht am Grund eines Pools
    vec2 q = p * 1.15;
    vec2 warp = vec2(noise(q + uTime * 0.18), noise(q + 5.2 - uTime * 0.15));
    float c1 = ridge(q * 2.1 + warp * 1.8 + vec2(uTime * 0.22, -uTime * 0.17));
    float c2 = ridge(q * 4.6 - warp * 1.3 + vec2(-uTime * 0.31, uTime * 0.26));
    float caust = pow(c1, 12.0) * 0.8 + pow(c2, 14.0) * 0.5;
    float wave = 0.5 + 0.5 * sin(r * 24.0 - uTime * 1.6 + warp.x * 3.0);
    float body = noise(q * 0.8 + uTime * 0.05);
    // Farben im linearen Raum (werden danach tonemapped)
    vec3 deep = vec3(0.0, 0.03, 0.16), mid = vec3(0.02, 0.17, 0.58), hi = vec3(0.55, 0.82, 1.0);
    vec3 col = mix(deep, mid, 0.3 + 0.6 * body);
    col += hi * caust * 0.5;
    col += mid * pow(wave, 10.0) * 0.25;
    col += hi * smoothstep(0.88, 1.0, r) * 0.22;      // heller Rand
    col = mix(col, vec3(0.8, 0.92, 1.0), uFlash);
    float alpha = uOpacity * (1.0 - smoothstep(0.985, 1.005, r));
    gl_FragColor = vec4(col, alpha);
  }`;
const KAWOOSH_FS = /* glsl */`
  varying vec2 vUv; uniform float uTime; uniform float uOpacity;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  void main() {
    float n = noise(vec2(vUv.x * 24.0 + uTime * 3.0, vUv.y * 10.0 - uTime * 8.0));
    float n2 = noise(vec2(vUv.x * 60.0 - uTime * 2.0, vUv.y * 30.0));
    vec3 col = mix(vec3(0.02, 0.14, 0.6), vec3(0.45, 0.75, 1.0), n * 0.7 + n2 * 0.3);
    float edge = smoothstep(0.0, 0.15, vUv.y) * (0.45 + 0.55 * n);
    gl_FragColor = vec4(col * 0.8, uOpacity * edge * 0.8);
  }`;
const SIMPLE_VS = /* glsl */`
  varying vec2 vUv; varying vec3 vPos;
  void main(){ vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SHIELD_FS = /* glsl */`
  varying vec3 vPos; uniform float uTime; uniform float uOpacity; uniform float uHit;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  void main(){
    vec2 p = vPos.xy; float r = length(p) / ${R_IN.toFixed(2)};
    float n = noise(p * 3.0 + uTime * 0.5) * 0.6 + noise(p * 9.0 - uTime * 0.8) * 0.4;
    vec3 col = mix(vec3(0.30, 0.36, 0.45), vec3(0.75, 0.80, 0.88), n);
    float ring = exp(-pow((r - fract(uTime * 0.35)) * 12.0, 2.0)) * 0.25;
    col += vec3(0.6, 0.8, 1.0) * (ring + uHit * exp(-r * r * 6.0) * 1.5);
    float a = uOpacity * (0.45 + 0.3 * n + uHit * 0.4) * (1.0 - smoothstep(0.96, 1.02, r));
    gl_FragColor = vec4(col * 0.75, a);
  }`;

// ---------------------------------------------------------------- Bau
export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'stargate_atlantis';

  // Materialien (eigene, an der Ancient-Palette orientiert: Stahlblau/Silbergrau, keine Rostoptik)
  const metalTex = makeMetalTexture();
  const ringMat = new THREE.MeshStandardMaterial({
    name: 'gate_ring', color: 0x5d6b7c, metalness: 0.85, roughness: 0.38, map: metalTex,
  });
  const ringDarkMat = new THREE.MeshStandardMaterial({ name: 'gate_ring_dark', color: 0x2e3946, metalness: 0.8, roughness: 0.5 });
  const chevronMat = new THREE.MeshStandardMaterial({ name: 'gate_chevron', color: 0x9aa7b5, metalness: 0.9, roughness: 0.28 });
  const atlas = makeGlyphAtlas();

  const gate = new THREE.Group();          // alles, was zum Ring gehört (Mitte = Ringmitte)
  gate.name = 'ring';
  gate.position.y = CY;
  root.add(gate);

  // --- Ringkörper: geschlossenes Lathe-Profil (r, z), um Z gedreht → massiver Ring
  // Vorderseite von innen nach außen: Innenlippe (gerippt) | vertiefte Glyphenspur | Steg | Außenband | Fase
  const front = [
    [R_IN, H - 0.09], [R_IN + 0.02, H - 0.02], [2.72, H - 0.02], [2.725, H - 0.065],
    [3.135, H - 0.065], [3.145, H + 0.01], [3.18, H + 0.01], [3.19, H], [3.31, H], [R_OUT, H - 0.05],
  ];
  const back = front.slice().reverse().map(([r, z]) => [r, -z]);
  // Umlaufrichtung so, dass alle Normalen nach außen zeigen (sonst Rückseiten-Culling = „hohler“ Ring)
  const prof = [...front, ...back, front[0]].reverse().map(([r, z]) => new THREE.Vector2(r, z));
  const ringGeo = new THREE.LatheGeometry(prof, 192);
  ringGeo.rotateX(Math.PI / 2);            // Lathe-Achse Y → Z (Ring steht senkrecht, Vorderseite +Z)
  ringGeo.computeVertexNormals();
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = 'ring_koerper';
  gate.add(ring);

  // Dunkler Grund der Glyphenspur (vorn und hinten)
  for (const side of [1, -1]) {
    const track = new THREE.Mesh(new THREE.RingGeometry(2.73, 3.13, 192, 1), ringDarkMat);
    track.position.z = side * (H - 0.064);
    if (side < 0) track.rotation.y = Math.PI;
    track.name = side > 0 ? 'glyphenspur_vorn' : 'glyphenspur_hinten';
    gate.add(track);
  }

  // Detailgeometrie (instanziert = wenige Draw-Calls): Rippen an Innenlippe und Außenkante, Zierblöcke auf dem Außenband
  const nearChevron = (deg, w) => CHEVRON_ORDER_DEG.some((c) => Math.abs(((deg - c + 540) % 360) - 180) < w);
  const addInstances = (geo, mat, list, name) => {
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    const o = new THREE.Object3D();
    list.forEach(([r, deg, z, rotX], n) => {
      const a = toRad(deg);
      o.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
      o.rotation.set(rotX || 0, 0, a - Math.PI / 2);
      o.updateMatrix();
      inst.setMatrixAt(n, o.matrix);
    });
    inst.name = name;
    gate.add(inst);
  };
  const ribs = [], rim = [], blocks = [];
  for (let n = 0; n < 144; n++) {
    const deg = n * 2.5;
    for (const side of [1, -1]) ribs.push([2.665, deg, side * (H - 0.01)]);
  }
  for (let n = 0; n < 120; n++) rim.push([R_OUT + 0.005, n * 3, 0]);
  for (let n = 0; n < 72; n++) {
    const deg = n * 5 + 2.5;
    if (nearChevron(deg, 13)) continue;
    for (const side of [1, -1]) blocks.push([3.25, deg, side * (H + 0.012)]);
  }
  addInstances(new THREE.BoxGeometry(0.018, 0.09, 0.03), ringMat, ribs, 'rippen_innen');
  addInstances(new THREE.BoxGeometry(0.035, 0.025, DEPTH * 0.82), ringDarkMat, rim, 'rippen_aussen');
  addInstances(new THREE.BoxGeometry(0.21, 0.085, 0.024), ringDarkMat, blocks, 'zierbloecke');

  // --- 36 Glyphen-Displays (gekrümmte Platten mit eigener UV pro Glyphe)
  const glyphs = [];
  const rin = 2.745, rout = 3.115, zG = H - 0.062;
  for (let i = 0; i < GLYPHS; i++) {
    const center = toRad(i * 10);
    const half = (10 * Math.PI / 180) * 0.44;
    const segs = 4, pos = [], uv = [], idx = [];
    for (let s = 0; s <= segs; s++) {
      const t = center + half - (2 * half * s) / segs;  // von links nach rechts (Blick von vorn)
      for (const [r, v] of [[rin, 0], [rout, 1]]) {
        pos.push(Math.cos(t) * r, Math.sin(t) * r, zG);
        uv.push(s / segs, v);
      }
    }
    for (let s = 0; s < segs; s++) { const a = s * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = atlas.clone();
    tex.repeat.set(1 / 6, 1 / 6);
    const mat = new THREE.MeshStandardMaterial({
      name: `glyph_${i}`, color: 0x18222d, metalness: 0.4, roughness: 0.35,
      emissive: 0x7fc8ff, emissiveMap: tex, emissiveIntensity: GLYPH_IDLE,
    });
    const m = new THREE.Mesh(geo, mat);
    m.name = `glyphe_${String(i).padStart(2, '0')}`;
    gate.add(m);
    glyphs.push({ mesh: m, mat, tex, level: GLYPH_IDLE, target: GLYPH_IDLE });
    setGlyphSymbol(i, i);
  }
  function setGlyphSymbol(slot, symbol) {
    const t = glyphs[slot].tex;
    t.offset.set((symbol % 6) / 6, 1 - (Math.floor(symbol / 6) + 1) / 6);
  }

  // --- 9 Chevrons: V-förmige Klammer um den Ring (Silber) mit ausgesparter, eingelassener Leuchtdreieck-Linse
  // lokal: +Y = nach außen, Spitze zeigt zur Ringmitte (−Y)
  const chevShape = new THREE.Shape();
  chevShape.moveTo(-0.31, 0.27);
  chevShape.lineTo(0.31, 0.27);
  chevShape.lineTo(0.12, -0.17);
  chevShape.lineTo(-0.12, -0.17);
  chevShape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.17, 0.17);
  hole.lineTo(0.0, -0.09);
  hole.lineTo(0.17, 0.17);
  hole.closePath();
  chevShape.holes.push(hole);
  const CH_D = DEPTH + 0.08;
  const chevGeo = new THREE.ExtrudeGeometry(chevShape, {
    depth: CH_D, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2,
  });
  chevGeo.translate(0, 0, -CH_D / 2);
  const lightShape = new THREE.Shape();
  lightShape.moveTo(-0.165, 0.165);
  lightShape.lineTo(0.165, 0.165);
  lightShape.lineTo(0.0, -0.085);
  lightShape.closePath();
  const lightGeo = new THREE.ExtrudeGeometry(lightShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1 });
  const chevrons = [];
  for (let k = 0; k < CHEVRONS; k++) {
    const deg = CHEVRON_ORDER_DEG[k];
    const a = toRad(deg);
    const grp = new THREE.Group();
    grp.name = `chevron_${k + 1}`;
    grp.position.set(Math.cos(a) * CH_R, Math.sin(a) * CH_R, 0);
    grp.rotation.z = a - Math.PI / 2;
    grp.add(new THREE.Mesh(chevGeo, chevronMat));
    const lmat = new THREE.MeshStandardMaterial({
      name: `chevron_licht_${k + 1}`, color: 0x6fd0ff, emissive: 0x2fb4ff, emissiveIntensity: CHEV_IDLE,
      roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.92,
    });
    for (const side of [1, -1]) {             // Linse vorn und hinten, leicht eingelassen
      const light = new THREE.Mesh(lightGeo, lmat);
      light.position.set(0, 0, side > 0 ? CH_D / 2 - 0.05 : -CH_D / 2 - 0.01);
      grp.add(light);
    }
    gate.add(grp);
    chevrons.push({ grp, lmat, level: CHEV_IDLE, target: CHEV_IDLE, deg, slot: Math.round(deg / 10) % 36, kick: 0 });
  }

  // --- Ereignishorizont
  const horizonUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uFlash: { value: 0 }, uAmp: { value: 1 } };
  const horizon = new THREE.Mesh(
    new THREE.RingGeometry(0.001, R_IN + 0.01, 128, 24), // fein unterteilt, damit die Vertex-Welle sichtbar wird
    new THREE.ShaderMaterial({
      name: 'ereignishorizont', uniforms: horizonUniforms, vertexShader: HORIZON_VS, fragmentShader: HORIZON_FS,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  horizon.name = 'ereignishorizont';
  horizon.visible = false;
  gate.add(horizon);

  // --- Kawoosh (vorschnellender Wirbel)
  const kawooshProfile = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = (R_IN - 0.05) * Math.pow(1 - t, 0.55) * (1 - 0.25 * Math.sin(t * Math.PI));
    kawooshProfile.push(new THREE.Vector2(Math.max(r, 0.001), t * 4.2));
  }
  const kawGeo = new THREE.LatheGeometry(kawooshProfile, 64);
  kawGeo.rotateX(Math.PI / 2);
  const kawUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
  const kawoosh = new THREE.Mesh(kawGeo, new THREE.ShaderMaterial({
    name: 'kawoosh', uniforms: kawUniforms, vertexShader: SIMPLE_VS, fragmentShader: KAWOOSH_FS,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  kawoosh.name = 'kawoosh';
  kawoosh.visible = false;
  gate.add(kawoosh);

  // --- Torschild (OBJ-011): direkt vor dem Ereignishorizont
  const shieldUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uHit: { value: 0 } };
  const shield = new THREE.Mesh(new THREE.CircleGeometry(R_IN + 0.01, 96), new THREE.ShaderMaterial({
    name: 'torschild', uniforms: shieldUniforms, vertexShader: SIMPLE_VS, fragmentShader: SHIELD_FS,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }));
  shield.position.z = 0.06;
  shield.name = 'torschild';
  shield.visible = false;
  gate.add(shield);

  // --- Dynamisches Licht des Wurmlochs
  const hLight = new THREE.PointLight(0x6fb8ff, 0, 14, 2);
  hLight.name = 'horizont_licht';
  hLight.position.set(0, 0, 1.4);
  gate.add(hLight);

  // --- Kollision: Ringsegmente über dem Boden (Öffnung bleibt begehbar)
  const col = (name, w, h, d, x, y, z, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.z = rz;
    m.visible = opts.showCollision === true;
    root.add(m);
  };
  const rm = (R_IN + R_OUT) / 2, seg = 20;
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * TAU;
    const y = CY + Math.sin(a) * rm;
    if (y < 0.1) continue; // unter dem Boden versenkt
    col(`COL_ring_${String(i).padStart(2, '0')}`, (TAU * rm) / seg + 0.08, R_OUT - R_IN + 0.06, DEPTH + 0.06,
      Math.cos(a) * rm, y, 0, a - Math.PI / 2);
  }

  // --- Benutzen-Punkte
  const intTor = new THREE.Object3D();
  intTor.name = 'INT_tor';
  intTor.position.set(3.0, 1.2, 1.3);
  intTor.userData = { label: 'Stargate', radius: 1.6 };
  root.add(intTor);
  const intHor = new THREE.Object3D();
  intHor.name = 'INT_horizont';
  intHor.position.set(0, 1.0, 0.6);
  intHor.userData = { label: 'Durch das Stargate gehen', radius: 1.4 };
  root.add(intHor);

  // ============================================================ Zustandsmaschine
  let state = 'idle';
  const listeners = [];
  const setState = (s, info) => { state = s; for (const fn of listeners) try { fn(s, info); } catch (e) { console.error(e); } };
  let queue = [];          // geplante Schritte { t, fn }
  let clock = 0;           // interne Zeit (s)
  let runner = null;       // Lauflicht { from, to, start, dur }
  let kaw = null;          // Kawoosh-Animation { start }
  let horizonTarget = 0, shieldTarget = 0, lightTarget = 0;
  let shieldHit = 0;
  let locked = 0;
  let autoClose = null;
  const sfx = makeSound(opts.sound === true);

  const at = (dt, fn) => queue.push({ t: clock + dt, fn });
  const clearQueue = () => { queue = []; runner = null; };

  function resetLights() {
    for (const g of glyphs) g.target = GLYPH_IDLE;
    for (const c of chevrons) c.target = CHEV_IDLE;
    for (let i = 0; i < GLYPHS; i++) setGlyphSymbol(i, i);
    locked = 0;
  }

  function lockChevron(k, symbol) {
    const c = chevrons[k];
    c.target = 3.2;
    c.kick = 1;
    setGlyphSymbol(c.slot, symbol);
    glyphs[c.slot].target = 2.6;
    locked = k + 1;
    sfx.lock();
    setState('dialing', { chevron: k + 1, symbol });
  }

  function establish(incoming) {
    setState('kawoosh', { incoming });
    kaw = { start: clock };
    horizon.visible = true;
    kawoosh.visible = true;
    horizonUniforms.uFlash.value = 1;
    horizonTarget = 1;
    lightTarget = 1;
    sfx.kawoosh();
    at(1.6, () => {
      setState('open', { incoming });
      sfx.hum(true);
      const ttl = opts.autoCloseSeconds ?? 0; // 0 = offen lassen (in der Serie max. 38 min)
      if (ttl > 0) autoClose = clock + ttl;
    });
  }

  function dial(address) {
    if (state !== 'idle') return false;
    const addr = (address || []).map((n) => ((n % GLYPHS) + GLYPHS) % GLYPHS);
    if (addr.length < 7 || addr.length > 9) throw new Error('Adresse braucht 7–9 Glyphen');
    resetLights();
    setState('dialing', { chevron: 0 });
    let t = 0.2, pos = 0;
    addr.forEach((sym, k) => {
      const target = chevrons[k].slot;
      // Lauflicht dreht abwechselnd links/rechts herum, mindestens eine halbe Runde
      const dir = k % 2 === 0 ? 1 : -1;
      let steps = ((target - pos) * dir + GLYPHS * 2) % GLYPHS;
      if (steps < 12) steps += GLYPHS;
      const dur = 0.035 * steps + 0.3;
      const from = pos;
      at(t, () => { runner = { from, steps, dir, start: clock, dur }; sfx.spin(dur); });
      t += dur;
      at(t, () => { runner = null; lockChevron(k, sym); });
      t += 0.55;
      pos = target;
    });
    at(t + 0.2, () => establish(false));
    return true;
  }

  function incoming() {
    if (state !== 'idle') return false;
    resetLights();
    setState('dialing', { incoming: true });
    for (let k = 0; k < 7; k++) at(0.15 + k * 0.32, () => lockChevron(k, Math.floor(Math.random() * 36)));
    // Bei eingehender Verbindung leuchtet der gesamte Glyphenring auf
    at(2.4, () => { for (const g of glyphs) g.target = 1.6; });
    at(2.8, () => establish(true));
    return true;
  }

  function close() {
    if (state === 'idle' || state === 'closing') return false;
    clearQueue();
    autoClose = null;
    const wasOpen = state === 'open' || state === 'kawoosh';
    setState('closing');
    sfx.hum(false);
    if (wasOpen) { sfx.close(); horizonTarget = 0; lightTarget = 0; }
    kawoosh.visible = false;
    kaw = null;
    for (let k = CHEVRONS - 1; k >= 0; k--) at((CHEVRONS - 1 - k) * 0.05 + 0.4, () => { chevrons[k].target = CHEV_IDLE; });
    at(0.9, () => { for (const g of glyphs) g.target = GLYPH_IDLE; });
    at(1.6, () => { horizon.visible = false; resetLights(); setState('idle'); });
    return true;
  }

  function setShield(on) {
    shieldTarget = on ? 1 : 0;
    if (on) shield.visible = true;
    sfx.shield(on);
    setState(state, { shield: !!on });
  }
  function shieldImpact() { if (shieldTarget > 0) { shieldHit = 1; sfx.impact(); } }

  // ============================================================ Animation
  function update(dt) {
    dt = Math.min(dt, 0.1);
    clock += dt;
    // geplante Schritte
    if (queue.length) {
      queue.sort((a, b) => a.t - b.t);
      while (queue.length && queue[0].t <= clock) queue.shift().fn();
    }
    if (autoClose !== null && clock >= autoClose) close();

    // Lauflicht: ein heller Punkt mit Nachleuchten wandert über die Glyphen
    if (runner) {
      const p = Math.min(1, (clock - runner.start) / runner.dur);
      const cur = runner.from + runner.dir * runner.steps * ease(p);
      for (let i = 0; i < GLYPHS; i++) {
        const isLockedSlot = chevrons.slice(0, locked).some((c) => c.slot === i);
        if (isLockedSlot) continue;
        const d = Math.abs(((i - cur) % GLYPHS + GLYPHS * 1.5) % GLYPHS - GLYPHS / 2);
        glyphs[i].level = Math.max(GLYPH_IDLE, 2.4 * Math.exp(-d * d * 0.9));
        glyphs[i].target = GLYPH_IDLE;
      }
    }
    // weiches Ein-/Ausblenden
    const k = 1 - Math.exp(-dt * 10);
    for (const g of glyphs) {
      g.level += (g.target - g.level) * k;
      g.mat.emissiveIntensity = g.level;
    }
    for (const c of chevrons) {
      c.level += (c.target - c.level) * k;
      c.lmat.emissiveIntensity = c.level;
      c.kick = Math.max(0, c.kick - dt * 3);
      // Verriegelung: Chevron rückt kurz nach innen und zurück
      const off = Math.sin(c.kick * Math.PI) * 0.06;
      const a = toRad(c.deg);
      c.grp.position.set(Math.cos(a) * (CH_R - off), Math.sin(a) * (CH_R - off), 0);
    }

    // Kawoosh: schießt ~4 m nach vorn und fällt in den Horizont zurück
    if (kaw) {
      const t = clock - kaw.start;
      const out = t < 0.45 ? ease(t / 0.45) : t < 1.4 ? 1 - ease((t - 0.45) / 0.95) : 0;
      kawoosh.scale.set(0.8 + 0.2 * out, 0.8 + 0.2 * out, Math.max(0.001, out));
      kawUniforms.uOpacity.value = Math.min(1, out * 1.6);
      kawUniforms.uTime.value = clock;
      horizonUniforms.uAmp.value = 1 + 3 * Math.max(0, 1 - t / 2);
      if (t > 1.45) { kawoosh.visible = false; kaw = null; }
    }
    horizonUniforms.uFlash.value = Math.max(0, horizonUniforms.uFlash.value - dt * 1.2);
    horizonUniforms.uTime.value = clock;
    const kh = 1 - Math.exp(-dt * (horizonTarget > horizonUniforms.uOpacity.value ? 6 : 2.5));
    horizonUniforms.uOpacity.value += (horizonTarget - horizonUniforms.uOpacity.value) * kh;
    hLight.intensity += (lightTarget * (opts.lightIntensity ?? 18) * (0.92 + 0.08 * Math.sin(clock * 7)) - hLight.intensity) * kh;

    // Schild
    shieldUniforms.uTime.value = clock;
    shieldUniforms.uOpacity.value += (shieldTarget - shieldUniforms.uOpacity.value) * (1 - Math.exp(-dt * 4));
    shieldHit = Math.max(0, shieldHit - dt * 2);
    shieldUniforms.uHit.value = shieldHit;
    if (shieldTarget === 0 && shieldUniforms.uOpacity.value < 0.01) shield.visible = false;
  }

  // selbstlaufend: einmal pro Frame über onBeforeRender des Ringkörpers
  let lastT = null, lastExternal = -1;
  ring.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (now - lastExternal < 0.005) return; // Spiel ruft update() selbst auf
    if (lastT !== null && now - lastT > 0.0005) update(now - lastT);
    lastT = now;
  };

  // ============================================================ öffentliche API
  const api = {
    dial, incoming, close, setShield, shieldImpact,
    get state() { return state; },
    get shield() { return shieldTarget > 0; },
    get lockedChevrons() { return locked; },
    onChange(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
    setSound(on) { sfx.enable(on); },
  };
  // Beispieladressen (Glyphen-Nummern 0–35; stilisierte Glyphen, nicht die Original-Symbole)
  const ADDR = {
    erde: [27, 7, 15, 32, 12, 30, 1, 20],         // 8 Chevrons = intergalaktisch
    m35: [17, 3, 25, 9, 33, 14, 1],
    alpha: [5, 22, 11, 29, 2, 18, 1],
  };
  root.userData.api = api;
  root.userData.addresses = ADDR;
  root.userData.actions = [
    { id: 'erde', label: 'Erde anwählen (8 Chevrons)', run: () => dial(ADDR.erde) },
    { id: 'm35', label: 'M35-117 anwählen (Beispieladresse)', run: () => dial(ADDR.m35) },
    { id: 'alpha', label: 'Alpha-Basis anwählen (Beispieladresse)', run: () => dial(ADDR.alpha) },
    { id: 'eingehend', label: 'Eingehendes Wurmloch', run: () => incoming() },
    { id: 'schliessen', label: 'Wurmloch schließen', run: () => close() },
    { id: 'schild', label: 'Torschild an/aus', run: () => setShield(!api.shield) },
    { id: 'aufprall', label: 'Aufprall auf Schild', run: () => shieldImpact() },
  ];
  root.userData.update = (dt) => { lastExternal = performance.now() / 1000; update(dt); };
  root.userData.steckbrief = steckbrief;
  return root;
}

// ---------------------------------------------------------------- Ton (WebAudio, synthetisch, optional)
function makeSound(enabled) {
  let ctx = null, on = enabled, humNode = null;
  const ac = () => {
    if (!on) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { on = false; return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const noise = (c, dur) => {
    const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; return s;
  };
  const env = (c, node, t0, a, peak, rel) => {
    const g = c.createGain(); g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + rel);
    node.connect(g); g.connect(c.destination); return g;
  };
  return {
    enable(v) { on = v; if (!v && humNode) { humNode.stop(); humNode = null; } },
    lock() {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25);
      env(c, o, t, 0.005, 0.25, 0.3); o.start(t); o.stop(t + 0.4);
      const n = noise(c, 0.15); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400;
      n.connect(f); env(c, f, t, 0.002, 0.3, 0.12); n.start(t);
    },
    spin(dur) {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(520, t + dur);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; o.connect(f);
      env(c, f, t, 0.05, 0.05, dur); o.start(t); o.stop(t + dur + 0.1);
    },
    kawoosh() {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const n = noise(c, 2.2); const f = c.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.4); f.frequency.exponentialRampToValueAtTime(200, t + 2);
      n.connect(f); env(c, f, t, 0.08, 0.8, 1.9); n.start(t);
    },
    hum(v) {
      const c = ac(); if (!c) return;
      if (v && !humNode) {
        const o = c.createOscillator(); o.frequency.value = 62; const g = c.createGain(); g.gain.value = 0.04;
        o.connect(g); g.connect(c.destination); o.start(); humNode = o;
      } else if (!v && humNode) { humNode.stop(); humNode = null; }
    },
    close() {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const n = noise(c, 1.0); const f = c.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(120, t + 0.8);
      n.connect(f); env(c, f, t, 0.02, 0.5, 0.9); n.start(t);
    },
    shield(v) {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(v ? 300 : 900, t); o.frequency.exponentialRampToValueAtTime(v ? 900 : 300, t + 0.4);
      env(c, o, t, 0.02, 0.15, 0.4); o.start(t); o.stop(t + 0.5);
    },
    impact() {
      const c = ac(); if (!c) return; const t = c.currentTime;
      const n = noise(c, 0.5); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600;
      n.connect(f); env(c, f, t, 0.003, 0.7, 0.4); n.start(t);
    },
  };
}

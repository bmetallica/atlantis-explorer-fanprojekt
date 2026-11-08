// Raum ATL-017: Pflanzenkammer (Plant Room) – East Pier, Etage 3.
// Gestrecktes, unregelmäßiges SECHSECK (ca. 8,0 m breit / 9,4 m lang), 3,20 m lichte Höhe.
// 1 Einheit = 1 m, +Y oben, Ursprung = Mitte der Bodenfläche (Bodenoberkante y = 0).
// Reine Raumhülle: keine Möbel – nur Architektur (Wände, Pfeiler, Deckenkassetten,
// Klimaleuchten, Zuchtlicht-Panels, Lüftungsgitter, Kupferleitungen) und leere Objektplätze.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'raum_plant_room',
  art: 'Raum',
  masse: 'ca. 8,0 m × 9,4 m lichte Grundfläche (gestrecktes Sechseck), 3,20 m lichte Höhe, Wandstärke 0,30 m',
  wohin: 'East Pier, Etage 3 – geschlossene Klimazelle direkt am Botanik-Labor (ATL-016)',
  benutzen: 'Hydrokultur-Zuchtbehälter (OBJ-022) und Botanische Nährstoffmischer (OBJ-089) werden über PLACE_-Punkte eingesetzt',
  lichter: '6 LAMP_ (eisblau, Intensität 6, Reichweite 7 m), blaue Eckpfeiler mit weißen Lichtpunkten, amberfarbene Zuchtlicht-Panels an der Decke, grün-teale Klimafelder',
  animation: 'Eingebaute Lichtleisten, Klimafelder und Zuchtlicht pulsieren sehr dezent; über userData.api und userData.actions steuerbar',
  quelle: 'Auftrag ATL-017 (Quelle A), rekonstruiert nach Setplan „Plant Room & Botany Lab“ (Quarantine, 4x13) und Screencap bilder/ref1.jpg',
};

export function create(opts = {}) {
  const H = 3.2;          // lichte Höhe
  const T = 0.3;          // Wandstärke
  const DOOR_W = 2.4;     // Öffnungsbreite
  const DOOR_H = 3.0;     // Öffnungshöhe

  // ---------------------------------------------------------------- Grundriss
  // Gestrecktes Sechseck: zwei lange Seitenwände (X = ±4) und je zwei schräge Stirnwände.
  const V = [
    [0.0, -4.7],   // 0 vordere Spitze
    [4.0, -2.0],   // 1 vorderer rechter Knick
    [4.0, 2.0],    // 2 hinterer rechter Knick
    [0.0, 4.7],    // 3 hintere Spitze
    [-4.0, 2.0],   // 4 hinterer linker Knick
    [-4.0, -2.0],  // 5 vorderer linker Knick
  ];

  const edges = [];
  for (let i = 0; i < V.length; i++) {
    const a = V[i], b = V[(i + 1) % V.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const dir = [dx / len, dz / len];
    const out = [dz / len, -dx / len];               // Außennormale
    edges.push({ i, a, b, len, dir, out, angle: -Math.atan2(dz, dx) });
  }
  const pointOn = (e, d, off = 0) => [
    e.a[0] + e.dir[0] * d + e.out[0] * off,
    e.a[1] + e.dir[1] * d + e.out[1] * off,
  ];
  const rotInward = (e) => Math.atan2(-e.out[0], -e.out[1]);

  const root = new THREE.Group();
  root.name = 'raum_plant_room';

  const matWall = kit('wall');
  const matWallDark = kit('wallDark');
  const matCopper = kit('copper');
  const matFloor = kit('floor');
  const matCeiling = kit('ceiling');
  const matAmber = kit('amberGlow');
  const matGlass = kit('glass');
  matFloor.side = THREE.DoubleSide;
  matCeiling.side = THREE.DoubleSide;

  const matPillar = new THREE.MeshStandardMaterial({
    name: 'pfeiler_blau', color: 0x27435c, metalness: 0.38, roughness: 0.48,
  });
  const matPatina = new THREE.MeshStandardMaterial({
    name: 'boden_patina', color: 0x3f6b5c, metalness: 0.62, roughness: 0.45,
  });
  const matLineGlow = new THREE.MeshStandardMaterial({
    name: 'lichtleiste', color: 0xdff4ff, emissive: 0x9fd8ff,
    emissiveIntensity: 1.35, roughness: 0.35,
  });
  const matPointGlow = new THREE.MeshStandardMaterial({
    name: 'lichtpunkt_weiss', color: 0xf2fbff, emissive: 0xdff4ff,
    emissiveIntensity: 2.3, roughness: 0.25,
  });
  const matClimate = new THREE.MeshStandardMaterial({
    name: 'klimafeld', color: 0x0e2a30, emissive: 0x63c9c0,
    emissiveIntensity: 0.8, roughness: 0.4,
  });
  const matGrow = new THREE.MeshStandardMaterial({
    name: 'zuchtlicht', color: 0x2a2113, emissive: 0xffc169,
    emissiveIntensity: 1.25, roughness: 0.4,
  });
  const matGreenTint = new THREE.MeshStandardMaterial({
    name: 'boden_gruenschleier', color: 0x24483d, transparent: true, opacity: 0.26,
    roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Buntglas-Textur (geometrisches, schneeflockenartiges Muster) – nur wenn Canvas verfügbar.
  let matStained = matGlass;
  try {
    if (typeof document !== 'undefined') {
      const cnv = document.createElement('canvas');
      cnv.width = 256; cnv.height = 256;
      const cx = cnv.getContext('2d');
      cx.fillStyle = '#0a2630'; cx.fillRect(0, 0, 256, 256);
      cx.fillStyle = 'rgba(198,138,48,0.75)';
      cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(128, 96); cx.lineTo(0, 128); cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(58,186,176,0.7)';
      cx.beginPath(); cx.moveTo(256, 256); cx.lineTo(128, 160); cx.lineTo(256, 128); cx.closePath(); cx.fill();
      cx.strokeStyle = 'rgba(232,208,138,0.85)'; cx.lineWidth = 5;
      for (let k = 0; k < 4; k++) {
        const ox = 64 + (k % 2) * 128, oy = 64 + Math.floor(k / 2) * 128;
        cx.beginPath();
        cx.moveTo(ox - 34, oy); cx.lineTo(ox + 34, oy);
        cx.moveTo(ox, oy - 34); cx.lineTo(ox, oy + 34);
        cx.moveTo(ox - 24, oy - 24); cx.lineTo(ox - 10, oy - 10);
        cx.moveTo(ox + 24, oy - 24); cx.lineTo(ox + 10, oy - 10);
        cx.moveTo(ox - 24, oy + 24); cx.lineTo(ox - 10, oy + 10);
        cx.moveTo(ox + 24, oy + 24); cx.lineTo(ox + 10, oy + 10);
        cx.stroke();
      }
      const tex = new THREE.CanvasTexture(cnv);
      tex.colorSpace = THREE.SRGBColorSpace;
      matStained = new THREE.MeshStandardMaterial({
        name: 'buntglas', map: tex, emissive: 0xffffff, emissiveMap: tex,
        emissiveIntensity: 0.32, transparent: true, side: THREE.DoubleSide,
        roughness: 0.25, metalness: 0.1,
      });
    }
  } catch (err) {
    matStained = matGlass;
  }

  const dummy = new THREE.Object3D();

  const addMesh = (geo, mat, x, y, z, name) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (name) m.name = name;
    root.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, name) =>
    addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);

  const instanced = (geo, mat, list, name) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((t, i) => {
      dummy.position.set(t[0], t[1], t[2]);
      dummy.rotation.set(0, t[3] || 0, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.count = list.length;
    im.name = name;
    root.add(im);
    return im;
  };

  const empty = (name, x, y, z, rotY, userData) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = rotY;
    if (userData) o.userData = userData;
    root.add(o);
    return o;
  };

  // Wandsegment entlang einer Polygonkante (off = 0 innen, + = außen)
  const segBox = (e, d0, d1, y0, y1, off, depth, mat, name) => {
    const len = d1 - d0, h = y1 - y0;
    if (len < 0.002 || h < 0.002) return null;
    const c = pointOn(e, (d0 + d1) / 2, off);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, depth), mat);
    m.position.set(c[0], (y0 + y1) / 2, c[1]);
    m.rotation.y = e.angle;
    if (name) m.name = name;
    root.add(m);
    return m;
  };

  const colBox = (e, d0, d1, y0, y1, off, depth, name) => {
    const len = d1 - d0, h = y1 - y0;
    if (len < 0.002 || h < 0.002) return null;
    const c = pointOn(e, (d0 + d1) / 2, off);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, depth));
    m.position.set(c[0], (y0 + y1) / 2, c[1]);
    m.rotation.y = e.angle;
    m.name = name;
    m.visible = false;
    root.add(m);
    return m;
  };

  // ---------------------------------------------------------------- Boden (Polygon)
  const shape = new THREE.Shape();
  [...V].reverse().forEach((v, i) => {
    const px = v[0], py = -v[1];
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  });
  shape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  floorGeo.rotateX(-Math.PI / 2);
  floorGeo.translate(0, -0.1, 0);
  addMesh(floorGeo, matFloor, 0, 0, 0, 'boden');

  const colFloorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  colFloorGeo.rotateX(-Math.PI / 2);
  colFloorGeo.translate(0, -0.2, 0);
  const colFloor = addMesh(colFloorGeo, matFloor, 0, 0, 0, 'COL_boden');
  colFloor.visible = false;

  // grünlicher Schleier über dem Boden (Klimazellen-Stimmung)
  const tintGeo = new THREE.ShapeGeometry(shape);
  tintGeo.rotateX(-Math.PI / 2);
  addMesh(tintGeo, matGreenTint, 0, 0.007, 0, 'boden_klimaschleier');

  // ---------------------------------------------------------------- Wandaufbau
  const planFor = (e) => {
    if (e.i === 5) {                                   // Tür an der vorderen linken Schrägwand
      const s = (e.len - DOOR_W) / 2;
      return { solids: [[0, s], [s + DOOR_W, e.len]], door: [s, s + DOOR_W], windows: [] };
    }
    if (e.i === 2 || e.i === 3) {                      // Beobachtungsfenster (Buntglas)
      const w0 = 1.4, w1 = 3.4, wy0 = 1.95, wy1 = 2.8;
      return { solids: [[0, w0], [w1, e.len]], door: null, windows: [[w0, w1, wy0, wy1]] };
    }
    return { solids: [[0, e.len]], door: null, windows: [] };
  };

  const panels = [], frames = [], slots = [];
  const edgeNames = ['vorn_rechts', 'rechts', 'hinten_rechts', 'hinten_links', 'links', 'vorn_links'];

  edges.forEach((e) => {
    const plan = planFor(e);
    const nm = edgeNames[e.i];

    plan.solids.forEach(([d0, d1], k) => {
      segBox(e, d0, d1, 0, H, T / 2, T, matWall, `wand_${nm}_${k}`);
      colBox(e, d0, d1, 0, H, T / 2, T, `COL_wand_${nm}_${k}`);
      // Sockelleiste und Gesims (an der Wandinnenfläche)
      segBox(e, d0 + 0.02, d1 - 0.02, 0, 0.15, -0.02, 0.05, matCopper, 'sockelleiste');
      segBox(e, d0 + 0.02, d1 - 0.02, H - 0.11, H - 0.01, -0.03, 0.07, matCopper, 'gesims');
      // Wandpaneele / Lichtschlitze im 1,2-m-Raster
      let d = d0 + 0.62, idx = 0;
      while (d < d1 - 0.42) {
        if (idx % 2 === 0) {
          const p = pointOn(e, d, -0.02);
          panels.push([p[0], 1.45, p[1], e.angle]);
          const f = pointOn(e, d, -0.015);
          frames.push([f[0], 1.45, f[1], e.angle]);
        } else {
          for (let s = 0; s < 4; s++) {
            const q = pointOn(e, d, -0.005);
            slots.push([q[0], 0.9 + s * 0.45, q[1], e.angle]);
          }
        }
        d += 1.2; idx++;
      }
    });

    // Fenster
    plan.windows.forEach(([w0, w1, wy0, wy1]) => {
      segBox(e, w0, w1, 0, wy0, T / 2, T, matWall, `wand_${nm}_unter_fenster`);
      segBox(e, w0, w1, wy1, H, T / 2, T, matWall, `wand_${nm}_ueber_fenster`);
      colBox(e, w0, w1, 0, H, T / 2, T, `COL_wand_${nm}_fenster`);
      segBox(e, w0, w1, wy0, wy1, 0.0, 0.04, matStained, `fenster_glas_${nm}`);
      segBox(e, w0 - 0.08, w1 + 0.08, wy1 - 0.06, wy1 + 0.06, -0.06, 0.14, matCopper, `fenster_rahmen_${nm}`);
      segBox(e, w0 - 0.08, w1 + 0.08, wy0 - 0.06, wy0 + 0.06, -0.06, 0.14, matCopper, `fenster_rahmen_${nm}`);
      segBox(e, w0 - 0.08, w0 + 0.06, wy0 - 0.06, wy1 + 0.06, -0.06, 0.14, matCopper, `fenster_rahmen_${nm}`);
      segBox(e, w1 - 0.06, w1 + 0.08, wy0 - 0.06, wy1 + 0.06, -0.06, 0.14, matCopper, `fenster_rahmen_${nm}`);
      const mid = (w0 + w1) / 2;
      segBox(e, mid - 0.035, mid + 0.035, wy0, wy1, -0.05, 0.08, matCopper, `fenster_sprosse_${nm}`);
      segBox(e, w0 - 0.16, w0 - 0.10, wy0, wy1, -0.025, 0.06, matLineGlow, `fenster_lichtleiste_${nm}`);
      segBox(e, w1 + 0.10, w1 + 0.16, wy0, wy1, -0.025, 0.06, matLineGlow, `fenster_lichtleiste_${nm}`);
    });

    // Türöffnung
    if (plan.door) {
      const [d0, d1] = plan.door;
      segBox(e, d0, d1, DOOR_H, H, T / 2, T, matWall, `wand_${nm}_sturz`);
      colBox(e, d0, d1, DOOR_H, H, T / 2, T, `COL_sturz_${nm}`);
      segBox(e, d0 - 0.06, d0 + 0.06, 0, DOOR_H, -0.05, 0.12, matCopper, `tuer_einfassung_${nm}`);
      segBox(e, d1 - 0.06, d1 + 0.06, 0, DOOR_H, -0.05, 0.12, matCopper, `tuer_einfassung_${nm}`);
      segBox(e, d0 - 0.06, d1 + 0.06, DOOR_H - 0.06, DOOR_H + 0.06, -0.05, 0.12, matCopper, `tuer_einfassung_${nm}`);
      segBox(e, d0 + 0.35, d1 - 0.35, DOOR_H + 0.12, DOOR_H + 0.2, -0.07, 0.06, matAmber, `tuer_statusleiste_${nm}`);
    }
  });

  instanced(new THREE.BoxGeometry(0.95, 2.05, 0.04), matWallDark, panels, 'paneele');
  instanced(new THREE.BoxGeometry(1.07, 2.19, 0.06), matCopper, frames, 'paneel_rahmen');
  const slotMesh = instanced(new THREE.BoxGeometry(0.05, 0.32, 0.02), matLineGlow, slots, 'lichtschlitze');

  // ---------------------------------------------------------------- Bodenintarsien
  const inner = V.map((v) => [v[0] * 0.56, v[1] * 0.56]);
  for (let i = 0; i < inner.length; i++) {
    const a = inner[i], b = inner[(i + 1) % inner.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ang = -Math.atan2(dz, dx);
    const m = box(len, 0.01, 0.055, matCopper, (a[0] + b[0]) / 2, 0.009, (a[1] + b[1]) / 2, 'boden_intarsie');
    m.rotation.y = ang;
  }
  edges.forEach((e) => {
    const c = pointOn(e, e.len / 2, -0.22);
    const m = box(e.len - 0.34, 0.012, 0.28, matPatina, c[0], 0.008, c[1], 'boden_rand_patina');
    m.rotation.y = e.angle;
    const c2 = pointOn(e, e.len / 2, -0.40);
    const m2 = box(e.len - 0.6, 0.012, 0.06, matCopper, c2[0], 0.009, c2[1], 'boden_rand_kupfer');
    m2.rotation.y = e.angle;
  });

  // Schneeflocken-Intarsie in der Mitte (verzweigte, rechtwinklige Äste)
  const R = 1.55;
  for (let i = 0; i < 6; i++) {
    const a0 = (i * Math.PI) / 3;
    const a1 = ((i + 1) * Math.PI) / 3;
    const p0 = [Math.cos(a0) * R, Math.sin(a0) * R];
    const p1 = [Math.cos(a1) * R, Math.sin(a1) * R];
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
    const len = Math.hypot(dx, dz);
    const ang = -Math.atan2(dz, dx);
    const m = box(len, 0.009, 0.05, matCopper, (p0[0] + p1[0]) / 2, 0.008, (p0[1] + p1[1]) / 2, 'boden_schneeflocke');
    m.rotation.y = ang;
    const bx = p0[0] + (p1[0] - p0[0]) * 0.5, bz = p0[1] + (p1[1] - p0[1]) * 0.5;
    const b = box(0.42, 0.008, 0.04, matPatina, bx, 0.008, bz, 'boden_schneeflocke_ast');
    b.rotation.y = ang + Math.PI / 2;
  }
  box(0.36, 0.009, 0.36, matPatina, 0, 0.008, 0, 'boden_schneeflocke_mitte');

  // 1,2-m-Plattenfugen, sauber auf das Polygon geklemmt
  const seams = [];
  const crossX = (x0) => {
    const zs = [];
    for (let i = 0; i < V.length; i++) {
      const a = V[i], b = V[(i + 1) % V.length];
      if ((a[0] - x0) * (b[0] - x0) <= 0 && Math.abs(b[0] - a[0]) > 1e-6) {
        zs.push(a[1] + (b[1] - a[1]) * ((x0 - a[0]) / (b[0] - a[0])));
      }
    }
    if (zs.length >= 2) seams.push([x0, Math.min(...zs), Math.max(...zs), Math.PI / 2]);
  };
  const crossZ = (z0) => {
    const xs = [];
    for (let i = 0; i < V.length; i++) {
      const a = V[i], b = V[(i + 1) % V.length];
      if ((a[1] - z0) * (b[1] - z0) <= 0 && Math.abs(b[1] - a[1]) > 1e-6) {
        xs.push(a[0] + (b[0] - a[0]) * ((z0 - a[1]) / (b[1] - a[1])));
      }
    }
    if (xs.length >= 2) seams.push([Math.min(...xs), z0, Math.max(...xs), 0]);
  };
  for (let x = -3.6; x <= 3.6; x += 1.2) crossX(x);
  for (let z = -4.8; z <= 4.8; z += 1.2) crossZ(z);
  seams.forEach(([x, z0, z1, rot]) => {
    const len = z1 - z0;
    if (len < 0.3) return;
    const m = box(rot ? 0.018 : len, 0.006, rot ? len : 0.018, matCopper,
      rot ? x : (x + z1) / 2, 0.004, rot ? (z0 + z1) / 2 : z0, 'boden_plattenfuge');
  });

  // ---------------------------------------------------------------- Eckpfeiler (an jeder Polygonecke)
  // Pfeiler werden so gesetzt, dass sie beide Wandinnenflächen berühren (keine Lücken, kein Schweben).
  const pillars = [];
  for (let i = 0; i < V.length; i++) {
    const v = V[i];
    const e1 = edges[(i + 5) % 6], e2 = edges[i];
    let bx = -(e1.out[0] + e2.out[0]), bz = -(e1.out[1] + e2.out[1]);
    const bl = Math.hypot(bx, bz) || 1;
    bx /= bl; bz /= bl;
    const cosA = Math.max(0.2, e1.out[0] * e2.out[0] + e1.out[1] * e2.out[1]);
    const alpha = Math.acos(cosA);                    // Winkel zwischen den Wandnormalen
    const S = 0.30;
    const d = (S / 2) * (1 + Math.tan(alpha / 2));   // Abstand bis Berührung beider Wände
    pillars.push({
      x: v[0] + bx * d, z: v[1] + bz * d,
      rot: Math.atan2(-bz, bx),                       // Pfeilerachse = Winkelhalbierende
      bx, bz,
    });
  }
  const pillarLights = [];
  pillars.forEach((p, i) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.30, H, 0.30), matPillar);
    col.position.set(p.x, H / 2, p.z);
    col.rotation.y = p.rot;
    col.name = `saeule_${i + 1}`;
    root.add(col);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.38), matCopper);
    base.position.set(p.x, 0.045, p.z); base.rotation.y = p.rot; base.name = `saeule_sockel_${i + 1}`;
    root.add(base);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.38), matCopper);
    cap.position.set(p.x, H - 0.045, p.z); cap.rotation.y = p.rot; cap.name = `saeule_kopf_${i + 1}`;
    root.add(cap);
    for (let s = 0; s < 4; s++) {
      pillarLights.push([p.x + p.bx * 0.15, 0.85 + s * 0.48, p.z + p.bz * 0.15]);
    }
  });
  instanced(new THREE.BoxGeometry(0.09, 0.09, 0.05), matPointGlow, pillarLights, 'saeulen_lichtpunkte');

  // ---------------------------------------------------------------- Lüftungsgitter (fest eingebaute Architektur)
  const grilleBodies = [], grilleSlats = [];
  [[1, 3.55], [4, 3.55], [1, 0.45], [4, 0.45]].forEach(([ei, d]) => {
    const e = edges[ei];
    const p = pointOn(e, d, -0.03);
    grilleBodies.push([p[0], 1.35, p[1], e.angle]);
    for (let s = 0; s < 6; s++) {
      const q = pointOn(e, d, -0.075);
      grilleSlats.push([q[0], 0.85 + s * 0.2, q[1], e.angle]);
    }
  });
  instanced(new THREE.BoxGeometry(0.92, 1.45, 0.06), matWallDark, grilleBodies, 'lueftungsgitter');
  instanced(new THREE.BoxGeometry(0.82, 0.05, 0.05), matCopper, grilleSlats, 'lueftungsgitter_schlitz');

  // ---------------------------------------------------------------- Decke (Polygon)
  const ceilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  ceilGeo.rotateX(-Math.PI / 2);
  ceilGeo.translate(0, H, 0);
  addMesh(ceilGeo, matCeiling, 0, 0, 0, 'decke_hauptfeld');

  const colCeilGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  colCeilGeo.rotateX(-Math.PI / 2);
  colCeilGeo.translate(0, H, 0);
  const colCeil = addMesh(colCeilGeo, matCeiling, 0, 0, 0, 'COL_decke');
  colCeil.visible = false;

  const coffers = [], climate = [];
  [[-2.4, -2.4], [0, -2.4], [2.4, -2.4], [-2.4, 0], [0, 0], [2.4, 0], [-2.4, 2.4], [0, 2.4], [2.4, 2.4]].forEach(([x, z]) => {
    coffers.push([x, H - 0.02, z]);
    climate.push([x, H - 0.055, z]);
  });
  instanced(new THREE.BoxGeometry(1.78, 0.06, 1.78), matWallDark, coffers, 'decke_kassetten');
  const climateMesh = instanced(new THREE.BoxGeometry(1.30, 0.035, 0.42), matClimate, climate, 'decke_klimafelder');

  // schmale Lichtbänder entlang der Deckenkanten (an der Decke anliegend)
  edges.forEach((e, i) => {
    const c = pointOn(e, e.len / 2 - 0.5, -0.55);
    const m = box(e.len - 1.0, 0.04, 0.10, matLineGlow, c[0], H - 0.02, c[1], `decke_lichtband_${i}`);
    m.rotation.y = e.angle;
  });

  // Kupfer-Klimaleitungen unter der Decke (mit Halterungen an der Decke)
  edges.forEach((e, i) => {
    const c = pointOn(e, e.len / 2 - 0.45, -0.42);
    const m = box(e.len - 0.9, 0.10, 0.12, matCopper, c[0], H - 0.30, c[1], `decke_klimaleitung_${i}`);
    m.rotation.y = e.angle;
    for (let d = 0.9; d < e.len - 0.9; d += 1.8) {
      const q = pointOn(e, d, -0.42);
      const b = box(0.07, 0.22, 0.07, matCopper, q[0], H - 0.15, q[1], `decke_leitungshalter_${i}`);
      b.rotation.y = e.angle;
    }
  });

  // ---------------------------------------------------------------- Objektplätze
  // Hydrokultur-Zuchtbehälter (2,91 × 1,70 × 1,19 m): schräge Reihen entlang der Wände,
  // Rückkante an der Wandinnenfläche, Fußpunkt = Mitte des Grundrisses.
  const containerRows = [
    { edge: 4, d: 2.0, name: 'PLACE_OBJ-022' },
    { edge: 1, d: 2.0, name: 'PLACE_OBJ-022_2' },
    { edge: 3, d: 2.4, name: 'PLACE_OBJ-022_3' },
    { edge: 0, d: 2.4, name: 'PLACE_OBJ-022_4' },
  ];
  const containerSpots = [];
  containerRows.forEach((row) => {
    const e = edges[row.edge];
    const p = pointOn(e, row.d, -0.595);   // halbe Tiefe 0,595 m => Rückseite an der Wand
    empty(row.name, p[0], 0, p[1], rotInward(e));
    containerSpots.push({ e, d: row.d, p, rot: rotInward(e) });
  });

  // Botanische Nährstoffmischer (1,90 × 1,61 × 0,77 m): Wandobjekte an der Wandinnenfläche
  // der hinteren rechten Schrägwand (Ursprung = Rückseite am Fußpunkt der Wand).
  const mixerEdge = edges[2];
  const mixerRot = rotInward(mixerEdge);
  const m1 = pointOn(mixerEdge, 1.45, 0);
  const m2 = pointOn(mixerEdge, 3.40, 0);
  empty('PLACE_OBJ-089', m1[0], 0, m1[1], mixerRot);
  empty('PLACE_OBJ-089_2', m2[0], 0, m2[1], mixerRot);

  // Zuchtlicht-Panels über den Zuchtreihen (fest eingebaute Deckenarchitektur)
  containerSpots.forEach((s, i) => {
    const m = box(1.95, 0.05, 0.46, matGrow, s.p[0], H - 0.13, s.p[1], `decke_zuchtlicht_${i + 1}`);
    m.rotation.y = s.rot;
    const fr = box(2.05, 0.05, 0.56, matCopper, s.p[0], H - 0.085, s.p[1], `decke_zuchtlicht_rahmen_${i + 1}`);
    fr.rotation.y = s.rot;
    for (const t of [-0.75, 0.75]) {
      const p = pointOn(s.e, s.d + t, -0.595);
      const rod = box(0.05, 0.13, 0.05, matCopper, p[0], H - 0.065, p[1], `decke_zuchtlicht_stange_${i + 1}`);
      rod.rotation.y = s.rot;
    }
  });

  // ---------------------------------------------------------------- Tür / Anschluss
  const doorEdge = edges[5];
  const doorD0 = (doorEdge.len - DOOR_W) / 2;
  const doorMid = doorD0 + DOOR_W / 2;
  const doorWall = pointOn(doorEdge, doorMid, T / 2);
  const outAngle = Math.atan2(doorEdge.out[0], doorEdge.out[1]); // +Z zeigt nach außen
  empty('DOOR_botanik', doorWall[0], 0, doorWall[1], outAngle, {
    breite: DOOR_W, hoehe: DOOR_H, ziel: 'Botanik-Labor (ATL-016)', raum: 'ATL-016',
  });
  // Antiker-Schiebetür: Ursprung in der Wandmitte, +Z zeigt in den Raum
  empty('PLACE_OBJ-091', doorWall[0], 0, doorWall[1], outAngle + Math.PI);

  // ---------------------------------------------------------------- LAMP-Punkte
  const lampData = [];
  const lampPos = [
    [-1.9, H - 0.45, -1.6], [1.9, H - 0.45, -1.6],
    [-1.9, H - 0.45, 1.6], [1.9, H - 0.45, 1.6],
    [0, H - 0.45, -2.9], [0, H - 0.45, 2.9],
  ];
  lampPos.forEach(([x, y, z], i) => {
    const l = empty(`LAMP_${i + 1}`, x, y, z, 0, { color: '#9fd8ff', intensity: 6, distance: 7 });
    lampData.push(l);
  });

  // ---------------------------------------------------------------- Kollision Pfeiler
  pillars.forEach((p, i) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.30, H, 0.30));
    c.position.set(p.x, H / 2, p.z);
    c.rotation.y = p.rot;
    c.name = `COL_saeule_${i + 1}`;
    c.visible = false;
    root.add(c);
  });

  // ---------------------------------------------------------------- Animation / API
  let time = 0;
  let last = null;
  let pulsing = true;
  const tick = () => {
    const now = performance.now() / 1000;
    if (last !== null) time += Math.min(now - last, 0.1);
    last = now;
    if (pulsing) {
      matLineGlow.emissiveIntensity = 1.30 + Math.sin(time * 0.7) * 0.12;
      matClimate.emissiveIntensity = 0.78 + Math.sin(time * 0.5 + 1.2) * 0.12;
      matGrow.emissiveIntensity = 1.20 + Math.sin(time * 0.4 + 0.6) * 0.10;
    }
  };
  slotMesh.onBeforeRender = tick;
  climateMesh.onBeforeRender = tick;

  root.userData.raum = {
    id: 'ATL-017', name: 'Pflanzenkammer', etage: 3, bereich: 'East Pier',
    breite: 8.0, tiefe: 9.4, hoehe: H, wandstaerke: T,
    form: 'gestrecktes unregelmäßiges Sechseck, 6 Eckpfeiler an den Polygonecken',
    door: { breite: DOOR_W, hoehe: DOOR_H, seite: 'vordere linke Schrägwand (−Z)', ziel: 'Botanik-Labor (ATL-016)' },
  };
  root.userData.api = {
    setLampIntensity(value) { lampData.forEach((l) => { l.userData.intensity = value; }); },
    setLampColor(hex) { lampData.forEach((l) => { l.userData.color = hex; }); },
    setPulsing(on) {
      pulsing = !!on;
      if (!pulsing) {
        matLineGlow.emissiveIntensity = 1.30;
        matClimate.emissiveIntensity = 0.78;
        matGrow.emissiveIntensity = 1.20;
      }
    },
    isPulsing() { return pulsing; },
    getDimensions() { return { breite: 8.0, tiefe: 9.4, hoehe: H }; },
  };
  root.userData.actions = [
    {
      id: 'INT_klima_lichtpuls',
      label: 'Klimabeluchtung pulsiert',
      run() {
        pulsing = !pulsing;
        if (!pulsing) {
          matLineGlow.emissiveIntensity = 1.30;
          matClimate.emissiveIntensity = 0.78;
          matGrow.emissiveIntensity = 1.20;
        }
        return { menu: { title: 'Pflanzenkammer', options: [{ id: 'INT_klima_lichtpuls', label: pulsing ? 'Lichtpuls AN' : 'Lichtpuls AUS' }] } };
      },
    },
  ];

  return root;
}

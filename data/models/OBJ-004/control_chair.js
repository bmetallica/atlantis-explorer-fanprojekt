import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'control_chair',
  art: 'Standobjekt',
  masse: 'Sockel ca. 3,40 × 0,44 × 3,40 m; Sitz ca. 1,22 × 1,58 × 1,12 m; Hologramm bis ca. 2,30 m Gesamthöhe',
  wohin: 'ATL-044 Kontrollstuhlraum / Chair Room',
  benutzen: 'INT_sitz → Sitz aktivieren, Drehsockel drehen, Systemhologramm ein-/ausblenden',
  lichter: 'LAMP_sockel und LAMP_kopfstuetze (eisblau), LAMP_gel (bernsteinfarben)',
  animation: 'Aktivierung: Lehne neigt sich fast liegend zurück, Sitzfläche fährt vor, Sockel, Kopfstütze und Gelkissen pulsieren; Hologramm erscheint; Drehsockel dreht weich',
  quelle: 'selbst gebaut nach MGM Tech Journal und TV-/Screencap-Referenzen',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'control_chair';

  // --- Materialien
  const perl = kit('wall');
  const dunkel = kit('wallDark');
  const bronze = kit('copper');
  const huelle = kit('hull');

  const sitzPolster = new THREE.MeshStandardMaterial({
    name: 'sitzpolster',
    color: 0x263947,
    metalness: 0.32,
    roughness: 0.58,
  });

  const dunklesMetall = new THREE.MeshStandardMaterial({
    name: 'kontrollstuhl_metall',
    color: 0x30363a,
    metalness: 0.88,
    roughness: 0.3,
  });

  const kopfGlow = new THREE.MeshStandardMaterial({
    name: 'sitz_kopfstuetze_glow',
    color: 0x5acbea,
    metalness: 0.42,
    roughness: 0.24,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.08,
  });

  const sockelGlow = new THREE.MeshStandardMaterial({
    name: 'sitz_sockel_glow',
    color: 0x61cbe7,
    metalness: 0.45,
    roughness: 0.25,
    emissive: 0x6fe3ff,
    emissiveIntensity: 0.05,
  });

  const gelMat = new THREE.MeshStandardMaterial({
    name: 'sitz_gel',
    color: 0xffc27b,
    metalness: 0.08,
    roughness: 0.16,
    emissive: 0xffa040,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });

  const gelPunktMat = new THREE.MeshStandardMaterial({
    name: 'sitz_gelpunkte',
    color: 0xffe0a0,
    emissive: 0xffb65c,
    emissiveIntensity: 1.2,
  });

  const paneMat = new THREE.MeshStandardMaterial({
    name: 'sitz_sockelfelder',
    color: 0xb5dce9,
    metalness: 0.18,
    roughness: 0.32,
    emissive: 0x2d7896,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  const holoMat = new THREE.MeshStandardMaterial({
    name: 'sitz_hologramm',
    color: 0x89e8ff,
    emissive: 0x6fe3ff,
    emissiveIntensity: 1.6,
    metalness: 0.1,
    roughness: 0.25,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const holoKnotenMat = new THREE.MeshStandardMaterial({
    name: 'sitz_hologramm_knoten',
    color: 0xffc077,
    emissive: 0xff9e3d,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  // --- Wabenförmige, bodennahe Sockelstruktur
  const sockel = new THREE.Group();
  sockel.name = 'sockelplattform';
  root.add(sockel);

  const beamMatrices = [];
  const paneMatrices = [];
  const seitenlaenge = 0.38;
  const panelGeo = new THREE.CylinderGeometry(
    seitenlaenge * 0.91,
    seitenlaenge * 0.91,
    0.035,
    6
  );
  const panelDummy = new THREE.Object3D();

  function addWabenTier(maxRadius, y, mitFeldern) {
    for (let q = -maxRadius; q <= maxRadius; q++) {
      for (let r = -maxRadius; r <= maxRadius; r++) {
        const dist = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
        if (dist > maxRadius) continue;

        const cx = 1.5 * seitenlaenge * q;
        const cz = Math.sqrt(3) * seitenlaenge * (r + q / 2);

        const ecken = [];
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ecken.push(new THREE.Vector3(
            cx + Math.cos(a) * seitenlaenge,
            y,
            cz + Math.sin(a) * seitenlaenge
          ));
        }

        for (let k = 0; k < 6; k++) {
          const a = ecken[k];
          const b = ecken[(k + 1) % 6];
          const mid = a.clone().add(b).multiplyScalar(0.5);
          const dx = b.x - a.x;
          const dz = b.z - a.z;

          const dummy = new THREE.Object3D();
          dummy.position.copy(mid);
          dummy.rotation.y = -Math.atan2(dz, dx);
          dummy.scale.set(seitenlaenge, 1, 1);
          dummy.updateMatrix();
          beamMatrices.push(dummy.matrix.clone());
        }

        if (mitFeldern && (q + r + maxRadius) % 2 === 0) {
          panelDummy.position.set(cx, y, cz);
          panelDummy.rotation.set(0, Math.PI / 2, 0);
          panelDummy.scale.setScalar(1);
          panelDummy.updateMatrix();
          paneMatrices.push(panelDummy.matrix.clone());
        }
      }
    }
  }

  // Die unterste Trägerlage liegt mit ihrer Unterseite exakt auf y = 0.
  addWabenTier(2, 0.035, true);
  addWabenTier(1, 0.185, true);
  addWabenTier(1, 0.335, false);

  const beamGeo = new THREE.BoxGeometry(1, 0.07, 0.055);
  const beams = new THREE.InstancedMesh(beamGeo, dunkel, beamMatrices.length);
  beams.name = 'sockel_wabengitter';
  beamMatrices.forEach((matrix, i) => beams.setMatrixAt(i, matrix));
  beams.instanceMatrix.needsUpdate = true;
  sockel.add(beams);

  const panes = new THREE.InstancedMesh(panelGeo, paneMat, paneMatrices.length);
  panes.name = 'sockel_leuchtfelder';
  paneMatrices.forEach((matrix, i) => panes.setMatrixAt(i, matrix));
  panes.instanceMatrix.needsUpdate = true;
  sockel.add(panes);

  // Geschlossene Bodenabdeckung unter dem zentralen Sockel.
  const bodenKappe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.52, 0.07, 12),
    dunklesMetall
  );
  bodenKappe.position.y = 0.035;
  sockel.add(bodenKappe);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(1.66, 0.035, 8, 72),
    sockelGlow
  );
  ringA.rotation.x = Math.PI / 2;
  ringA.position.y = 0.035;
  sockel.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(1.03, 0.028, 8, 60),
    bronze
  );
  ringB.rotation.x = Math.PI / 2;
  ringB.position.y = 0.21;
  sockel.add(ringB);

  // Organische Träger zwischen Sockel und Sitz.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25),
      new THREE.Vector3(Math.cos(a + 0.12) * 0.7, 0.16, Math.sin(a + 0.12) * 0.7),
      new THREE.Vector3(Math.cos(a) * 1.3, 0.11, Math.sin(a) * 1.3),
    ]);
    const rib = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, 0.025, 6, false),
      bronze
    );
    sockel.add(rib);
  }

  // --- Drehbarer innerer Sockel mit Sitz
  const drehsockel = new THREE.Group();
  drehsockel.name = 'drehbarer_sockel';
  root.add(drehsockel);

  const zylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.46, 0.28, 12),
    dunklesMetall
  );
  zylinder.position.y = 0.53;
  drehsockel.add(zylinder);

  const zylinderRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.035, 8, 36),
    sockelGlow
  );
  zylinderRing.rotation.x = Math.PI / 2;
  zylinderRing.position.y = 0.65;
  drehsockel.add(zylinderRing);

  const stuhl = new THREE.Group();
  stuhl.name = 'sitzaufbau';
  stuhl.position.y = 0.58;
  drehsockel.add(stuhl);

  const sitzFlaeche = new THREE.Group();
  sitzFlaeche.name = 'schiebbare_sitzflaeche';
  stuhl.add(sitzFlaeche);

  const sitzTraeger = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.13, 0.72),
    dunklesMetall
  );
  sitzTraeger.position.set(0, 0.08, 0.02);
  sitzFlaeche.add(sitzTraeger);

  const sitzKissen = new THREE.Mesh(
    new THREE.BoxGeometry(0.79, 0.09, 0.63),
    sitzPolster
  );
  sitzKissen.position.set(0, 0.18, 0.03);
  sitzFlaeche.add(sitzKissen);

  const sitzLeiste = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.025, 0.045),
    sockelGlow
  );
  sitzLeiste.position.set(0, 0.235, 0.02);
  sitzFlaeche.add(sitzLeiste);

  // Geschlossene, gewölbte Rückenlehne.
  function curvedPanel(width, height, thickness, curve) {
    const nx = 12;
    const ny = 8;
    const positions = [];
    const indices = [];
    const layerSize = (nx + 1) * (ny + 1);

    for (let layer = 0; layer < 2; layer++) {
      for (let iy = 0; iy <= ny; iy++) {
        const v = iy / ny;
        const y = v * height;
        for (let ix = 0; ix <= nx; ix++) {
          const u = ix / nx;
          const x = (u - 0.5) * width;
          const z = -curve * Math.pow(x / (width / 2), 2) - layer * thickness;
          positions.push(x, y, z);
        }
      }
    }

    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const a = iy * (nx + 1) + ix;
        const b = a + 1;
        const c = a + nx + 1;
        const d = c + 1;

        indices.push(a, b, c, b, d, c);
        indices.push(
          layerSize + a,
          layerSize + c,
          layerSize + b,
          layerSize + b,
          layerSize + c,
          layerSize + d
        );
      }
    }

    for (let iy = 0; iy < ny; iy++) {
      const leftA = iy * (nx + 1);
      const leftB = (iy + 1) * (nx + 1);
      const rightA = leftA + nx;
      const rightB = leftB + nx;

      indices.push(leftA, leftB, leftA + layerSize, leftB, leftB + layerSize, leftA + layerSize);
      indices.push(rightA, rightA + layerSize, rightB, rightB, rightA + layerSize, rightB + layerSize);
    }

    for (let ix = 0; ix < nx; ix++) {
      const bottomA = ix;
      const bottomB = ix + 1;
      const topA = ny * (nx + 1) + ix;
      const topB = topA + 1;

      indices.push(bottomA, bottomA + layerSize, bottomB, bottomB, bottomA + layerSize, bottomB + layerSize);
      indices.push(topA, topB, topA + layerSize, topB, topB + layerSize, topA + layerSize);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  const lehnenPivot = new THREE.Group();
  lehnenPivot.name = 'neigbare_lehne';
  lehnenPivot.position.set(0, 0.16, -0.11);
  stuhl.add(lehnenPivot);

  const lehne = new THREE.Mesh(
    curvedPanel(0.94, 0.8, 0.11, 0.13),
    huelle
  );
  lehne.position.z = -0.02;
  lehnenPivot.add(lehne);

  const lehnenKissen = new THREE.Mesh(
    curvedPanel(0.78, 0.68, 0.065, 0.105),
    sitzPolster
  );
  lehnenKissen.position.set(0, 0.055, 0.045);
  lehnenPivot.add(lehnenKissen);

  const lehnenMitte = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.67, 0.025),
    sockelGlow
  );
  lehnenMitte.position.set(0, 0.39, 0.1);
  lehnenPivot.add(lehnenMitte);

  for (const side of [-1, 1]) {
    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.47, 0, -0.02),
      new THREE.Vector3(side * 0.49, 0.32, -0.1),
      new THREE.Vector3(side * 0.47, 0.79, -0.02),
    ]);
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(railCurve, 20, 0.035, 6, false),
      bronze
    );
    lehnenPivot.add(rail);
  }

  const kopfstuetze = new THREE.Mesh(
    curvedPanel(0.58, 0.24, 0.12, 0.06),
    kopfGlow
  );
  kopfstuetze.position.set(0, 0.84, 0.015);
  lehnenPivot.add(kopfstuetze);

  const kopfRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.022, 7, 40),
    bronze
  );
  kopfRing.scale.set(1, 0.48, 1);
  kopfRing.position.set(0, 0.96, -0.03);
  lehnenPivot.add(kopfRing);

  const lampKopf = new THREE.Object3D();
  lampKopf.name = 'LAMP_kopfstuetze';
  lampKopf.position.set(0, 0.96, 0.18);
  lampKopf.userData = { color: '#6fe3ff', intensity: 7, distance: 4.5 };
  lehnenPivot.add(lampKopf);

  // Armlehnen und halbtransparente Gelkissen.
  const gelPunkte = [];

  for (const side of [-1, 1]) {
    const armVerbindung = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.38, 0.12, 0.05),
      new THREE.Vector3(side * 0.55, 0.22, 0.02),
      new THREE.Vector3(side * 0.56, 0.29, 0.18),
    ]);
    const armAst = new THREE.Mesh(
      new THREE.TubeGeometry(armVerbindung, 18, 0.045, 7, false),
      bronze
    );
    sitzFlaeche.add(armAst);

    const armPolster = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.105, 0.28, 5, 10),
      sitzPolster
    );
    armPolster.rotation.x = Math.PI / 2;
    armPolster.scale.set(1, 1, 0.72);
    armPolster.position.set(side * 0.56, 0.3, 0.17);
    sitzFlaeche.add(armPolster);

    const gel = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 18, 12),
      gelMat
    );
    gel.scale.set(0.9, 0.48, 1.22);
    gel.position.set(side * 0.56, 0.365, 0.25);
    sitzFlaeche.add(gel);

    const gelRand = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.018, 6, 32),
      bronze
    );
    gelRand.rotation.x = Math.PI / 2;
    gelRand.scale.set(1, 1.24, 1);
    gelRand.position.copy(gel.position);
    sitzFlaeche.add(gelRand);

    for (let i = 0; i < 6; i++) {
      gelPunkte.push(new THREE.Vector3(
        side * 0.56 + (i % 2 ? 0.055 : -0.055),
        0.405,
        0.16 + Math.floor(i / 2) * 0.055
      ));
    }
  }

  const punktGeo = new THREE.SphereGeometry(0.017, 7, 5);
  const punkte = new THREE.InstancedMesh(punktGeo, gelPunktMat, gelPunkte.length);
  const punktDummy = new THREE.Object3D();
  gelPunkte.forEach((p, i) => {
    punktDummy.position.copy(p);
    punktDummy.updateMatrix();
    punkte.setMatrixAt(i, punktDummy.matrix);
  });
  punkte.instanceMatrix.needsUpdate = true;
  sitzFlaeche.add(punkte);

  // Fußstütze mit geschlossenem Träger und Polster.
  const fussTraeger = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.09, 0.46),
    dunklesMetall
  );
  fussTraeger.position.set(0, -0.22, 0.56);
  fussTraeger.rotation.x = -0.13;
  sitzFlaeche.add(fussTraeger);

  const fussPolster = new THREE.Mesh(
    new THREE.BoxGeometry(0.57, 0.035, 0.39),
    sitzPolster
  );
  fussPolster.position.set(0, -0.165, 0.565);
  fussPolster.rotation.x = -0.13;
  sitzFlaeche.add(fussPolster);

  const fussStreben = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0.2),
    new THREE.Vector3(0, -0.12, 0.37),
    new THREE.Vector3(0, -0.22, 0.56),
  ]);
  const fussStange = new THREE.Mesh(
    new THREE.TubeGeometry(fussStreben, 18, 0.045, 7, false),
    bronze
  );
  sitzFlaeche.add(fussStange);

  // --- Hologramm über dem Stuhl
  const holo = new THREE.Group();
  holo.name = 'systemhologramm';
  holo.position.set(0, 2.02, 0.08);
  holo.visible = false;
  root.add(holo);

  const holoRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52 - i * 0.11, 0.012, 5, 56),
      holoMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = i * 0.55;
    holo.add(ring);
    holoRings.push(ring);
  }

  const holoKern = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 1),
    holoMat
  );
  holo.add(holoKern);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const knoten = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 7, 5),
      holoKnotenMat
    );
    knoten.position.set(
      Math.cos(a) * (0.28 + (i % 3) * 0.08),
      Math.sin(i * 1.7) * 0.16,
      Math.sin(a) * (0.28 + (i % 3) * 0.08)
    );
    holo.add(knoten);
  }

  for (let i = -3; i <= 3; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(i === 0 ? 0.62 : 0.012, 0.008, i === 0 ? 0.012 : 0.62),
      holoMat
    );
    line.position.y = -0.19;
    holo.add(line);
  }

  // --- Kollision: nur der feste Sockel
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(1.56, 1.56, 0.44, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  col.name = 'COL_sockel';
  col.position.y = 0.22;
  root.add(col);

  // --- Benutzen-Punkt
  const use = new THREE.Object3D();
  use.name = 'INT_sitz';
  use.position.set(0, 0.82, 0.78);
  use.userData = { label: 'Kontrollstuhl bedienen', radius: 0.95 };
  root.add(use);

  const lampSockel = new THREE.Object3D();
  lampSockel.name = 'LAMP_sockel';
  lampSockel.position.set(0, 0.4, 0);
  lampSockel.userData = { color: '#6fe3ff', intensity: 7, distance: 5 };
  root.add(lampSockel);

  const lampGel = new THREE.Object3D();
  lampGel.name = 'LAMP_gel';
  lampGel.position.set(0, 0.98, 0.28);
  lampGel.userData = { color: '#ffb45c', intensity: 3.5, distance: 2.6 };
  root.add(lampGel);

  // --- Zustand und Animation
  let aktiv = false;
  let genZugang = true;
  let genStaerke = 1;
  let hologrammAktiv = true;
  let neigung = -0.12;
  let sitzVerschiebung = 0;
  let basiswinkel = 0;
  let zielwinkel = 0;
  let zeit = 0;
  let letzte = null;

  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    const staerke = THREE.MathUtils.clamp(genStaerke, 0, 1);
    const zielNeigung = aktiv ? -(0.35 + 0.95 * staerke) : -0.12;
    const zielSitz = aktiv ? 0.1 * staerke : 0;

    neigung += (zielNeigung - neigung) * Math.min(1, d * 3.2);
    sitzVerschiebung += (zielSitz - sitzVerschiebung) * Math.min(1, d * 3.2);

    let winkelDifferenz = zielwinkel - basiswinkel;
    winkelDifferenz = Math.atan2(Math.sin(winkelDifferenz), Math.cos(winkelDifferenz));
    basiswinkel += winkelDifferenz * Math.min(1, d * 2.6);
    drehsockel.rotation.y = basiswinkel;

    lehnenPivot.rotation.x = neigung;
    lehnenPivot.position.z = -0.11 + sitzVerschiebung * 0.25;
    sitzFlaeche.position.z = sitzVerschiebung;

    const puls = 0.5 + 0.5 * Math.sin(zeit * 3.2);
    const aktivitaet = aktiv ? 0.25 + 0.75 * staerke : 0;

    sockelGlow.emissiveIntensity = 0.05 + aktivitaet * (1.35 + puls * 0.75);
    kopfGlow.emissiveIntensity = 0.08 + aktivitaet * (1.7 + puls * 0.9);
    gelMat.emissiveIntensity = 0.12 + aktivitaet * (0.9 + puls * 0.65);
    gelPunktMat.emissiveIntensity = 0.55 + aktivitaet * (2.2 + puls * 1.4);
    paneMat.emissiveIntensity = 0.16 + aktivitaet * (0.38 + puls * 0.16);

    const holoSichtbar = aktiv && hologrammAktiv && staerke > 0.05;
    const zielOpazitaet = holoSichtbar ? 0.48 + puls * 0.32 * staerke : 0;
    holoMat.opacity += (zielOpazitaet - holoMat.opacity) * Math.min(1, d * 4.5);
    holoKnotenMat.opacity += (zielOpazitaet * 1.15 - holoKnotenMat.opacity) * Math.min(1, d * 4.5);
    holoMat.emissiveIntensity = 1.2 + puls * 1.5 * staerke;
    holoKnotenMat.emissiveIntensity = 1.6 + puls * 1.8 * staerke;

    holo.visible = holoMat.opacity > 0.01;
    holo.rotation.y += d * (0.16 + (aktiv ? 0.2 : 0.03));
    holo.position.y = 2.02 + Math.sin(zeit * 1.6) * 0.018;
    holoRings.forEach((ring, i) => {
      ring.rotation.z += d * (i % 2 === 0 ? 0.16 : -0.13);
    });
  }

  ringA.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // --- Öffentliche API
  const api = {
    aktivieren() {
      if (!genZugang) return false;
      aktiv = true;
      return true;
    },
    deaktivieren() {
      aktiv = false;
      return true;
    },
    umschalten() {
      if (!aktiv && !genZugang) return false;
      aktiv = !aktiv;
      return aktiv;
    },
    drehen(grad = 90) {
      zielwinkel += THREE.MathUtils.degToRad(grad);
      return true;
    },
    hologrammAnzeigen() {
      hologrammAktiv = true;
      return true;
    },
    hologrammVerbergen() {
      hologrammAktiv = false;
      return true;
    },
    hologrammUmschalten() {
      hologrammAktiv = !hologrammAktiv;
      return hologrammAktiv;
    },
    setGenZugang(verfuegbar = true) {
      genZugang = !!verfuegbar;
      if (!genZugang) aktiv = false;
      return genZugang;
    },
    setGenStaerke(staerke = 1) {
      genStaerke = THREE.MathUtils.clamp(Number(staerke) || 0, 0, 1);
      return genStaerke;
    },
    get aktiv() { return aktiv; },
    get genZugang() { return genZugang; },
    get genStaerke() { return genStaerke; },
    get hologrammAktiv() { return hologrammAktiv; },
    get steuerbereit() { return aktiv && genZugang && genStaerke > 0; },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'aktivieren',
      label: 'Kontrollstuhl aktivieren (ATA-Gen erforderlich)',
      run: () => api.aktivieren(),
    },
    {
      id: 'deaktivieren',
      label: 'Kontrollstuhl deaktivieren',
      run: () => api.deaktivieren(),
    },
    {
      id: 'umschalten',
      label: 'Sitz aktivieren / deaktivieren',
      run: () => api.umschalten(),
    },
    {
      id: 'drehen',
      label: 'Drehsockel um 90° drehen',
      run: () => api.drehen(90),
    },
    {
      id: 'hologramm',
      label: 'Systemhologramm ein-/ausblenden',
      run: () => api.hologrammUmschalten(),
    },
  ];

  return root;
}

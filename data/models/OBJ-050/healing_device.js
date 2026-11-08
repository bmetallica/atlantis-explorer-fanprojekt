import * as THREE from 'three';

export const steckbrief = {
  name: 'healing_device',
  art: 'Standobjekt / Antikes Heilgerät',
  masse: '0,27 × 0,26 × 0,27 m (B × H × T)',
  wohin: 'ATL-009 Krankenstation, ATL-010 Operationsraum',
  benutzen: 'INT_heilfeld → Heilgerät einschalten oder Heilzyklus starten',
  lichter: 'LAMP_heilfeld_front, LAMP_heilfeld_rueck, LAMP_heilfeld_rechts, LAMP_heilfeld_links, LAMP_heilfeld_oben',
  animation: 'Mittelfenster pulsieren im Betrieb; ein Heilzyklus erzeugt grellweißes, schwach unregelmäßig flackerndes Licht',
  quelle: 'selbst gebaut nach Ancient Healing Device (Telchaks Gerät, SG-1)',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'healing_device';

  const BODY_SIZE = 0.25;
  const BODY_HALF = BODY_SIZE / 2;

  // ---------------------------------------------------------------------------
  // Materialien: dunkles, gealtertes Bronzemetall ohne Rostflecken
  // ---------------------------------------------------------------------------
  function makeAgedTextures() {
    const size = 256;

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d');
    const colorImage = colorCtx.createImageData(size, size);

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext('2d');
    const roughImage = roughCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        const streak =
          Math.sin(x * 0.19 + Math.sin(y * 0.035) * 1.7) * 2.4 +
          Math.sin(y * 0.37 + x * 0.018) * 1.2;
        const fleck = Math.sin(x * 1.71 + y * 2.13) * 1.6;
        const value = 238 + streak + fleck;

        colorImage.data[i] = Math.min(250, Math.max(226, value + 5));
        colorImage.data[i + 1] = Math.min(248, Math.max(224, value + 2));
        colorImage.data[i + 2] = Math.min(242, Math.max(214, value - 3));
        colorImage.data[i + 3] = 255;

        const rough = Math.min(
          245,
          Math.max(145, 205 + streak * 5 - fleck * 3),
        );
        roughImage.data[i] = rough;
        roughImage.data[i + 1] = rough;
        roughImage.data[i + 2] = rough;
        roughImage.data[i + 3] = 255;
      }
    }

    colorCtx.putImageData(colorImage, 0, 0);
    roughCtx.putImageData(roughImage, 0, 0);

    const map = new THREE.CanvasTexture(colorCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    map.anisotropy = 4;

    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(2, 2);

    return { map, roughnessMap };
  }

  const agedTextures = makeAgedTextures();

  const bronze = new THREE.MeshStandardMaterial({
    name: 'heilgeraet_bronze',
    color: 0x4a3a2a,
    map: agedTextures.map,
    roughnessMap: agedTextures.roughnessMap,
    metalness: 0.7,
    roughness: 0.6,
  });

  const bronzeKante = new THREE.MeshStandardMaterial({
    name: 'heilgeraet_bronze_kante',
    color: 0x5d4934,
    map: agedTextures.map,
    roughnessMap: agedTextures.roughnessMap,
    metalness: 0.72,
    roughness: 0.54,
  });

  const recess = new THREE.MeshStandardMaterial({
    name: 'heilgeraet_recess',
    color: 0x30271f,
    metalness: 0.52,
    roughness: 0.78,
  });

  const fensterMat = new THREE.MeshStandardMaterial({
    name: 'heilgeraet_fenster',
    color: 0x77776d,
    emissive: 0xffffff,
    emissiveIntensity: 0.008,
    metalness: 0.12,
    roughness: 0.24,
  });

  const strahlMat = new THREE.MeshStandardMaterial({
    name: 'heilgeraet_heilfeld',
    color: 0xf7fbff,
    emissive: 0xffffff,
    emissiveIntensity: 0.015,
    metalness: 0.03,
    roughness: 0.16,
  });

  // ---------------------------------------------------------------------------
  // Antiker-Symbole als flache Reliefflächen
  // ---------------------------------------------------------------------------
  function symbolMaterial(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#c2aa7c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    if (index === 0) {
      ctx.beginPath();
      ctx.moveTo(24, 104);
      ctx.lineTo(24, 24);
      ctx.lineTo(64, 24);
      ctx.lineTo(64, 104);
      ctx.moveTo(64, 24);
      ctx.lineTo(104, 24);
      ctx.lineTo(104, 104);
      ctx.moveTo(24, 64);
      ctx.lineTo(104, 64);
      ctx.stroke();
    } else if (index === 1) {
      ctx.beginPath();
      ctx.moveTo(18, 26);
      ctx.lineTo(64, 104);
      ctx.lineTo(110, 26);
      ctx.moveTo(36, 52);
      ctx.lineTo(92, 52);
      ctx.moveTo(47, 78);
      ctx.lineTo(81, 78);
      ctx.stroke();
    } else if (index === 2) {
      ctx.beginPath();
      ctx.moveTo(24, 24);
      ctx.lineTo(104, 24);
      ctx.lineTo(24, 104);
      ctx.lineTo(104, 104);
      ctx.moveTo(64, 24);
      ctx.lineTo(64, 104);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(24, 40);
      ctx.lineTo(64, 24);
      ctx.lineTo(104, 40);
      ctx.lineTo(104, 88);
      ctx.lineTo(64, 104);
      ctx.lineTo(24, 88);
      ctx.closePath();
      ctx.moveTo(24, 40);
      ctx.lineTo(104, 88);
      ctx.moveTo(104, 40);
      ctx.lineTo(24, 88);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    return new THREE.MeshStandardMaterial({
      name: `heilgeraet_symbol_${index}`,
      map: texture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false,
      color: 0xffffff,
      emissive: 0x9a7d4e,
      emissiveIntensity: 0.035,
      metalness: 0.35,
      roughness: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  const symbolMats = [
    symbolMaterial(0),
    symbolMaterial(1),
    symbolMaterial(2),
    symbolMaterial(3),
  ];

  // ---------------------------------------------------------------------------
  // Grundkörper: geschlossener Würfel.
  // Ursprung = Mitte der Unterseite. Der Körper reicht von y = 0 bis y = 0,25.
  // ---------------------------------------------------------------------------
  const kern = new THREE.Mesh(
    new THREE.BoxGeometry(BODY_SIZE, BODY_SIZE, BODY_SIZE),
    bronze,
  );
  kern.name = 'heilgeraet_kern';
  kern.position.set(0, BODY_HALF, 0);
  kern.castShadow = true;
  kern.receiveShadow = true;
  root.add(kern);

  function addBox(parent, name, sx, sy, sz, x, y, z, material) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material,
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Geschlossener quadratischer Rahmen. Die lokale +Z-Achse zeigt aus dem
  // Gerät heraus. Durch die abnehmenden "front"-Werte entsteht dieoptische
  // Stufe: Der äußere Rahmen steht vor, die inneren liegen tiefer.
  function addSquareFrame(parent, name, size, thickness, front, depth, material) {
    const group = new THREE.Group();
    group.name = name;

    const c = (size - thickness) / 2;
    const z = front - depth / 2;

    addBox(
      group,
      `${name}_oben`,
      size,
      thickness,
      depth,
      0,
      c,
      z,
      material,
    );
    addBox(
      group,
      `${name}_unten`,
      size,
      thickness,
      depth,
      0,
      -c,
      z,
      material,
    );
    addBox(
      group,
      `${name}_links`,
      thickness,
      size - thickness * 2,
      depth,
      -c,
      0,
      z,
      material,
    );
    addBox(
      group,
      `${name}_rechts`,
      thickness,
      size - thickness * 2,
      depth,
      c,
      0,
      z,
      material,
    );

    parent.add(group);
    return group;
  }

  const dummy = new THREE.Object3D();

  function setInstance(instanz, index, x, y, z) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    instanz.setMatrixAt(index, dummy.matrix);
  }

  // Band aus kleinen eingeprägten Symbolfeldern am äußeren Rand.
  function addSymbolBand(parent, prefix) {
    const positions = [];

    for (let i = 0; i < 5; i++) {
      const x = -0.112 + i * 0.056;
      positions.push({ x, y: 0.112 });
      positions.push({ x, y: -0.112 });
    }

    for (let i = 0; i < 3; i++) {
      const y = -0.064 + i * 0.064;
      positions.push({ x: -0.112, y });
      positions.push({ x: 0.112, y });
    }

    const felder = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.023, 0.023, 0.006),
      bronzeKante,
      positions.length,
    );
    felder.name = `${prefix}_symbolfelder`;
    felder.castShadow = true;
    felder.receiveShadow = true;

    positions.forEach((p, i) => {
      setInstance(felder, i, p.x, p.y, 0.0028);
    });
    felder.instanceMatrix.needsUpdate = true;
    parent.add(felder);

    for (let typ = 0; typ < symbolMats.length; typ++) {
      const subset = positions.filter(
        (p, i) => i % symbolMats.length === typ,
      );

      const glyphs = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.015, 0.015, 0.001),
        symbolMats[typ],
        subset.length,
      );
      glyphs.name = `${prefix}_symbole_${typ}`;
      glyphs.renderOrder = 3;

      subset.forEach((p, i) => {
        setInstance(glyphs, i, p.x, p.y, 0.0063);
      });
      glyphs.instanceMatrix.needsUpdate = true;
      parent.add(glyphs);
    }
  }

  // Eine vollständig ausgestaltete Seite.
  // Die lokale +Z-Achse zeigt stets aus dem Gerät heraus.
  function addFace(prefix, position, rotation) {
    const face = new THREE.Group();
    face.name = `${prefix}_feld`;
    face.position.copy(position);
    face.rotation.copy(rotation);

    // Geschlossene dunkle Grundplatte des eingelassenen Feldes.
    addBox(
      face,
      `${prefix}_feldplatte`,
      0.234,
      0.234,
      0.001,
      0,
      0,
      0.0005,
      recess,
    );

    // Vier geschlossene Rahmenstufen. Jede nach innen liegende Stufe ist
    // kleiner und liegt ungefähr 4 mm tiefer als die vorherige.
    addSquareFrame(
      face,
      `${prefix}_rahmen_0`,
      0.214,
      0.012,
      0.012,
      0.01,
      bronzeKante,
    );
    addSquareFrame(
      face,
      `${prefix}_rahmen_1`,
      0.178,
      0.011,
      0.008,
      0.01,
      bronze,
    );
    addSquareFrame(
      face,
      `${prefix}_rahmen_2`,
      0.142,
      0.011,
      0.004,
      0.009,
      bronzeKante,
    );
    addSquareFrame(
      face,
      `${prefix}_rahmen_3`,
      0.106,
      0.01,
      0.001,
      0.006,
      bronze,
    );

    // Kleines helles Quadratfenster in der Mitte.
    const window = addBox(
      face,
      `${prefix}_mittelfenster`,
      0.052,
      0.052,
      0.0016,
      0,
      0,
      0.0018,
      fensterMat,
    );

    // Geschlossene, kaum überstehende Leuchtfläche.
    addBox(
      face,
      `${prefix}_heilflaeche`,
      0.046,
      0.046,
      0.0008,
      0,
      0,
      0.0028,
      strahlMat,
    );

    addSymbolBand(face, prefix);

    root.add(face);
    return { group: face, window };
  }

  const frontFace = addFace(
    'front',
    new THREE.Vector3(0, BODY_HALF, BODY_HALF),
    new THREE.Euler(0, 0, 0),
  );

  addFace(
    'rueck',
    new THREE.Vector3(0, BODY_HALF, -BODY_HALF),
    new THREE.Euler(0, Math.PI, 0),
  );

  addFace(
    'rechts',
    new THREE.Vector3(BODY_HALF, BODY_HALF, 0),
    new THREE.Euler(0, Math.PI / 2, 0),
  );

  addFace(
    'links',
    new THREE.Vector3(-BODY_HALF, BODY_HALF, 0),
    new THREE.Euler(0, -Math.PI / 2, 0),
  );

  addFace(
    'oben',
    new THREE.Vector3(0, BODY_SIZE, 0),
    new THREE.Euler(-Math.PI / 2, 0, 0),
  );

  // ---------------------------------------------------------------------------
  // Kollision, Benutzen-Punkt und dauerhaft vorhandene Lichtquellen
  // ---------------------------------------------------------------------------
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.27, 0.27, 0.27),
  );
  col.name = 'COL_heilgeraet';
  col.position.set(0, 0.135, 0);
  root.add(col);

  const use = new THREE.Object3D();
  use.name = 'INT_heilfeld';
  use.position.set(0, 0.22, 0.4);
  use.userData = {
    label: 'Antikes Heilgerät bedienen',
    radius: 0.8,
  };
  root.add(use);

  function addLamp(name, x, y, z, intensity = 0.25, distance = 2.2) {
    const lamp = new THREE.Object3D();
    lamp.name = name;
    lamp.position.set(x, y, z);
    lamp.userData = {
      color: '#ffffff',
      intensity,
      distance,
    };
    root.add(lamp);
    return lamp;
  }

  const lamps = [
    addLamp('LAMP_heilfeld_front', 0, BODY_HALF, 0.142, 0.3, 2.3),
    addLamp('LAMP_heilfeld_rueck', 0, BODY_HALF, -0.142, 0.2, 2),
    addLamp('LAMP_heilfeld_rechts', 0.142, BODY_HALF, 0, 0.2, 2),
    addLamp('LAMP_heilfeld_links', -0.142, BODY_HALF, 0, 0.2, 2),
    addLamp('LAMP_heilfeld_oben', 0, 0.268, 0, 0.2, 2),
  ];

  // ---------------------------------------------------------------------------
  // Zustand und Animation
  // ---------------------------------------------------------------------------
  let eingeschaltet = false;
  let behandelt = false;
  let restzeit = 0;
  let helligkeit = 0.015;
  let phase = 0;
  let letzte = null;

  function update(dt) {
    const step = Math.min(dt, 0.1);

    if (behandelt) {
      restzeit = Math.max(0, restzeit - step);
      if (restzeit === 0) {
        behandelt = false;
      }
    }

    if (eingeschaltet || behandelt) {
      phase += step;
    }

    let zielHelligkeit = 0.015;
    let zielLicht = 0.2;

    if (eingeschaltet && !behandelt) {
      const puls = Math.sin(phase * 2.4);
      const schwanken = Math.sin(phase * 8.3) * 0.06;

      zielHelligkeit = 0.75 + puls * 0.13 + schwanken;
      zielLicht = 4.2 + puls * 0.45 + schwanken * 2;
    } else if (behandelt) {
      const puls = Math.sin(phase * 12.5);
      const unruhe =
        Math.sin(phase * 29) * 0.32 +
        Math.sin(phase * 17.3) * 0.18 +
        Math.sin(phase * 41) * 0.1;

      zielHelligkeit = 5.8 + puls * 0.55 + unruhe;
      zielLicht = 11 + puls * 0.8 + unruhe * 1.8;
    }

    helligkeit +=
      (zielHelligkeit - helligkeit) * Math.min(1, step * 5.5);

    strahlMat.emissiveIntensity = Math.max(0.015, helligkeit);
    fensterMat.emissiveIntensity = Math.min(
      1.25,
      0.008 + helligkeit * 0.1,
    );

    const symbolZiel = behandelt
      ? 0.38
      : eingeschaltet
        ? 0.18
        : 0.035;

    for (const material of symbolMats) {
      material.emissiveIntensity +=
        (symbolZiel - material.emissiveIntensity) *
        Math.min(1, step * 4.5);
    }

    for (const lamp of lamps) {
      lamp.userData.intensity +=
        (zielLicht - lamp.userData.intensity) *
        Math.min(1, step * 5.5);
    }
  }

  // Sichtbares Frontfenster als zuverlässiger Animationsauslöser.
  frontFace.window.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(now - letzte, 0.1));
    }
    letzte = now;
  };

  root.userData.update = update;

  // ---------------------------------------------------------------------------
  // Öffentliche Funktionen
  // ---------------------------------------------------------------------------
  const api = {
    einschalten() {
      eingeschaltet = true;
      behandelt = false;
      restzeit = 0;
    },

    ausschalten() {
      eingeschaltet = false;
      behandelt = false;
      restzeit = 0;
    },

    behandlungStarten() {
      eingeschaltet = true;
      behandelt = true;
      restzeit = 4.2;
      return true;
    },

    get eingeschaltet() {
      return eingeschaltet;
    },

    get behandelt() {
      return behandelt;
    },

    get restzeit() {
      return restzeit;
    },

    get status() {
      if (behandelt) return 'Heilzyklus aktiv';
      if (eingeschaltet) return 'Gerät bereit';
      return 'Gerät ausgeschaltet';
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'heilen',
      label:
        'Heilzyklus starten – nur für Antiker, für Menschen gefährlich',
      run: () => api.behandlungStarten(),
    },
    {
      id: 'einschalten',
      label: 'Heilgerät einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'ausschalten',
      label: 'Heilgerät ausschalten',
      run: () => api.ausschalten(),
    },
  ];

  root.userData.hinweis =
    'Hochenergetisches, auf Antiker-Physiologie abgestimmtes Heilgerät. ' +
    'Die Behandlung reanimiert geschädigtes Gewebe, kann bei Menschen jedoch ' +
    'innerhalb weniger Stunden geistige Schäden und Wahnsinn verursachen.';

  return root;
}

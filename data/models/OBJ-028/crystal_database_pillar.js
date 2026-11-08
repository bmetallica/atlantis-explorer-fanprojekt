// Kristall-Hauptdatenbank-Säulen — Ancient-Datenbanksäule mit drei Kristallsäulen.
// Standobjekt: Ursprung in der Mitte der Unterseite, Vorderseite nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'crystal_database_pillar',
  art: 'Standobjekt',
  masse: '1,90 × 2,63 × 1,92 (B × H × T, m)',
  wohin: 'ATL-028 (Archive)',
  benutzen: 'INT_datenbank → Hauptkatalog aktivieren, Archiv durchsuchen und Sicherung setzen',
  lichter: 'LAMP_datensaeulen (eisblau), LAMP_sicherungsanzeige (bernstein)',
  animation: 'Datensäulen pulsieren, Datenkristalle leuchten, Scanringe fahren bei aktiver Datenbank aufwärts',
  quelle: 'selbst gebaut; Spielergänzung im Stil der Atlantis-Technologie',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'crystal_database_pillar';

  const pillarXs = [-0.59, 0, 0.59];
  const pillarZs = [-0.19, 0.13, -0.19];
  const pillarData = [];

  const matBase = kit('wallDark');
  const matPearl = kit('pillar');
  const matBronze = kit('copper');
  const matRail = kit('rail');

  const matCrystal = new THREE.MeshStandardMaterial({
    name: 'KIT_glass',
    color: 0x8bcde2,
    emissive: 0x0b4260,
    emissiveIntensity: 0.22,
    metalness: 0.08,
    roughness: 0.16,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  const matCore = new THREE.MeshStandardMaterial({
    name: 'crystal_data_core',
    color: 0xbdefff,
    emissive: 0x35bfff,
    emissiveIntensity: 0.5,
    metalness: 0.05,
    roughness: 0.18,
    transparent: true,
    opacity: 0.88
  });

  const matDataBlue = new THREE.MeshStandardMaterial({
    name: 'catalog_crystal_blue',
    color: 0xb7eaff,
    emissive: 0x168dff,
    emissiveIntensity: 0.8,
    metalness: 0.12,
    roughness: 0.16
  });

  const matDataAmber = new THREE.MeshStandardMaterial({
    name: 'catalog_crystal_amber',
    color: 0xffd18a,
    emissive: 0xff8a1f,
    emissiveIntensity: 0.75,
    metalness: 0.12,
    roughness: 0.16
  });

  const matScan = new THREE.MeshStandardMaterial({
    name: 'database_scan_ring',
    color: 0xb9f2ff,
    emissive: 0x42d8ff,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });

  const matMote = new THREE.MeshStandardMaterial({
    name: 'database_motes',
    color: 0xe4fbff,
    emissive: 0x7eeaff,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.8
  });

  // ---------------------------------------------------------------------
  // Zustand.
  // ---------------------------------------------------------------------
  let aktiv = false;
  let katalogModus = false;
  let gesichert = false;
  let katalogIndex = 0;
  let zeit = 0;
  let letzte = null;
  let helligkeit = 0.25;
  let amberAnteil = 0;
  let scanFortschritt = 0;
  let sichernBlitz = 0;

  const blauZiel = new THREE.Color(0x35bfff);
  const bernsteinZiel = new THREE.Color(0xffa235);

  // ---------------------------------------------------------------------
  // Sockel: flacher, achteckiger Ancient-Sockel mit bronzener Umrandung.
  // ---------------------------------------------------------------------
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.18, 16),
    matBase
  );
  base.position.y = 0.09;
  base.name = 'sockel';
  root.add(base);

  const baseTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.87, 0.90, 0.055, 16),
    matPearl
  );
  baseTop.position.y = 0.205;
  baseTop.name = 'sockel_auflage';
  root.add(baseTop);

  const baseRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.91, 0.026, 6, 48),
    matBronze
  );
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.19;
  root.add(baseRim);

  const floorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.012, 5, 48),
    matRail
  );
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = 0.238;
  root.add(floorRing);

  // ---------------------------------------------------------------------
  // Drei transluzente Kristallsäulen.
  // ---------------------------------------------------------------------
  const outerGeo = new THREE.CylinderGeometry(0.19, 0.235, 1.90, 6, 1, false);
  const coreGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.80, 12);
  const collarGeo = new THREE.CylinderGeometry(0.29, 0.31, 0.115, 12);
  const topCollarGeo = new THREE.CylinderGeometry(0.245, 0.20, 0.12, 12);
  const finialGeo = new THREE.ConeGeometry(0.17, 0.27, 6);
  const scanGeo = new THREE.TorusGeometry(0.285, 0.017, 6, 28);

  for (let i = 0; i < pillarXs.length; i++) {
    const g = new THREE.Group();
    g.name = `datensaeule_${i + 1}`;
    g.position.set(pillarXs[i], 0, pillarZs[i]);
    root.add(g);

    const outer = new THREE.Mesh(outerGeo, matCrystal);
    outer.position.y = 1.22;
    outer.name = `kristallhuellsaeule_${i + 1}`;
    g.add(outer);

    const core = new THREE.Mesh(coreGeo, matCore);
    core.position.y = 1.21;
    core.name = `lichtkern_${i + 1}`;
    g.add(core);

    const lowerCollar = new THREE.Mesh(collarGeo, matBronze);
    lowerCollar.position.y = 0.315;
    g.add(lowerCollar);

    const lowerPearl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.305, 0.305, 0.025, 12),
      matPearl
    );
    lowerPearl.position.y = 0.386;
    g.add(lowerPearl);

    const topCollar = new THREE.Mesh(topCollarGeo, matPearl);
    topCollar.position.y = 2.22;
    g.add(topCollar);

    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.225, 0.022, 6, 28),
      matRail
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 2.295;
    g.add(topRing);

    const finial = new THREE.Mesh(finialGeo, matCrystal);
    finial.position.y = 2.405;
    g.add(finial);

    const finialTip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075),
      matDataBlue
    );
    finialTip.position.y = 2.56;
    finialTip.scale.set(0.75, 0.9, 0.75);
    g.add(finialTip);

    const scan = new THREE.Mesh(scanGeo, matScan);
    scan.rotation.x = Math.PI / 2;
    scan.position.y = 0.45;
    scan.visible = false;
    scan.name = `scanring_${i + 1}`;
    g.add(scan);

    // Kleine bronzene Stabilisierungsflügel am unteren Sockel.
    for (let side = -1; side <= 1; side += 2) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.33, 0.16),
        matBronze
      );
      fin.position.set(side * 0.285, 0.43, 0);
      fin.rotation.z = side * -0.16;
      g.add(fin);
    }

    pillarData.push({ group: g, outer, core, scan, finialTip, index: i });
  }

  // ---------------------------------------------------------------------
  // Eingelassene Datenkristalle als InstancedMeshes.
  // Getrennte Blau-/Bernstein-Instanzen verhindern unbenutzte Einheits-
  // matrizen, die sonst die sichtbare Bounding Box verfälschen.
  // ---------------------------------------------------------------------
  const crystalsPerPillar = 7;
  const blueEntries = [];
  const amberEntries = [];

  for (let p = 0; p < pillarData.length; p++) {
    for (let k = 0; k < crystalsPerPillar; k++) {
      const idx = p * crystalsPerPillar + k;
      const y = 0.62 + k * 0.225;
      const a = (idx * 2.399963 + p * 0.71) % (Math.PI * 2);
      const radius = 0.065 + (idx % 3) * 0.025;

      const entry = {
        x: pillarXs[p] + Math.cos(a) * radius,
        y,
        z: pillarZs[p] + Math.sin(a) * radius,
        rx: 0.18 * Math.sin(idx * 1.7),
        ry: a,
        rz: 0.22 * Math.cos(idx * 1.3),
        sx: 0.052,
        sy: 0.13 + (idx % 2) * 0.025,
        sz: 0.052
      };

      if (idx % 4 === 0) amberEntries.push(entry);
      else blueEntries.push(entry);
    }
  }

  const blueData = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1),
    matDataBlue,
    blueEntries.length
  );
  const amberData = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1),
    matDataAmber,
    amberEntries.length
  );

  blueData.name = 'eingelassene_datakristalle_blau';
  amberData.name = 'eingelassene_datakristalle_bernstein';
  blueData.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  amberData.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  root.add(blueData, amberData);

  const dummy = new THREE.Object3D();

  function setCrystalInstances(mesh, entries) {
    entries.forEach((e, i) => {
      dummy.position.set(e.x, e.y, e.z);
      dummy.rotation.set(e.rx, e.ry, e.rz);
      dummy.scale.set(e.sx, e.sy, e.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (typeof mesh.computeBoundingSphere === 'function') {
      mesh.computeBoundingSphere();
    }
  }

  setCrystalInstances(blueData, blueEntries);
  setCrystalInstances(amberData, amberEntries);

  // ---------------------------------------------------------------------
  // Schwebende Datenpartikel.
  // ---------------------------------------------------------------------
  const motesPerPillar = 6;
  const moteCount = pillarXs.length * motesPerPillar;
  const motes = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.022, 0),
    matMote,
    moteCount
  );
  motes.name = 'schwebende_datenpartikel';
  motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(motes);

  const moteData = [];
  for (let p = 0; p < pillarXs.length; p++) {
    for (let k = 0; k < motesPerPillar; k++) {
      const idx = p * motesPerPillar + k;
      const a = idx * 2.173 + p * 0.9;
      moteData.push({
        x: pillarXs[p] + Math.cos(a) * 0.09,
        z: pillarZs[p] + Math.sin(a) * 0.09,
        phase: (idx * 0.173) % 1,
        speed: 0.055 + (idx % 4) * 0.012,
        radius: 0.012 + (idx % 3) * 0.003
      });
    }
  }

  // Bis zum ersten Animationsschritt sind sämtliche Partikel unsichtbar.
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  for (let i = 0; i < moteCount; i++) motes.setMatrixAt(i, dummy.matrix);
  motes.instanceMatrix.needsUpdate = true;

  // ---------------------------------------------------------------------
  // Geschlossenes Katalogschild am Sockel. Nur die Vorderfläche trägt
  // die dynamische Anzeige; Seiten und Rückseite sind bronzefarben.
  // ---------------------------------------------------------------------
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 256;
  const ctx = labelCanvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#19364c');
  gradient.addColorStop(1, '#0b1b2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#91dff2';
  ctx.lineWidth = 6;
  ctx.strokeRect(9, 9, 1006, 238);

  ctx.fillStyle = '#bcefff';
  ctx.font = 'bold 58px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MASTER DATABASE', 512, 70);

  ctx.fillStyle = '#f5b45f';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.fillText('CATALOGUED ITEMS', 512, 130);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;

  const matLabel = new THREE.MeshStandardMaterial({
    name: 'katalogschild',
    map: labelTexture,
    emissiveMap: labelTexture,
    emissive: 0x3a9cba,
    emissiveIntensity: 0.3,
    metalness: 0.15,
    roughness: 0.48
  });

  function zeichneKatalogschild() {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#19364c');
    g.addColorStop(1, '#0b1b2a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = gesichert ? '#f5b45f' : '#91dff2';
    ctx.lineWidth = 6;
    ctx.strokeRect(9, 9, 1006, 238);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#bcefff';
    ctx.font = 'bold 58px Arial, sans-serif';
    ctx.fillText('MASTER DATABASE', 512, 65);

    ctx.fillStyle = '#f5b45f';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillText('CATALOGUED ITEMS', 512, 122);

    ctx.fillStyle = gesichert ? '#ffd08a' : '#d9f7ff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(`ENTRY ${String(katalogIndex + 1).padStart(4, '0')}`, 512, 176);

    const status = gesichert
      ? 'SECURED'
      : katalogModus
        ? 'CATALOG SEARCH'
        : aktiv
          ? 'ONLINE'
          : 'STANDBY';

    ctx.fillStyle = gesichert ? '#ffb04a' : '#6fe3ff';
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText(status, 512, 220);

    labelTexture.needsUpdate = true;
  }

  zeichneKatalogschild();

  // Hinterkörper, damit das Schild nicht lose vor dem runden Sockel steht.
  const labelHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.245, 0.14),
    matBase
  );
  labelHousing.position.set(0, 0.105, 0.86);
  root.add(labelHousing);

  const labelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.235, 0.028),
    matBronze
  );
  labelFrame.position.set(0, 0.105, 0.934);
  root.add(labelFrame);

  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.185, 0.014),
    [
      matBronze, matBronze, matBronze,
      matBronze, matBronze, matLabel
    ]
  );
  label.position.set(0, 0.105, 0.941);
  label.name = 'katalogschild_master_database';
  root.add(label);

  // Statusanzeigen neben dem Schild.
  const statusMaterial = new THREE.MeshStandardMaterial({
    name: 'datenbank_statusanzeige',
    color: 0x76ddff,
    emissive: 0x25aaff,
    emissiveIntensity: 0.7,
    metalness: 0.1,
    roughness: 0.25
  });

  for (let i = 0; i < 3; i++) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.025, 0.012),
      statusMaterial
    );
    led.position.set(-0.12 + i * 0.12, 0.105, 0.943);
    root.add(led);
  }

  // ---------------------------------------------------------------------
  // Kollisionskörper. Sichtbar ist nur die Konstruktion.
  // ---------------------------------------------------------------------
  const colBase = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.24, 1.88));
  colBase.name = 'COL_sockel';
  colBase.position.y = 0.12;
  colBase.visible = false;
  root.add(colBase);

  for (let i = 0; i < pillarData.length; i++) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.36, 0.48));
    col.name = `COL_datensaeule_${i + 1}`;
    col.position.set(pillarXs[i], 1.18, pillarZs[i]);
    col.visible = false;
    root.add(col);
  }

  // Benutzen-Punkt und Lichtquellen.
  const use = new THREE.Object3D();
  use.name = 'INT_datenbank';
  use.position.set(0, 1.18, 1.02);
  use.userData = {
    label: 'Hauptdatenbank bedienen',
    radius: 0.9
  };
  root.add(use);

  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_datensaeulen';
  lamp.position.set(0, 1.55, 0.05);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 8,
    distance: 5
  };
  root.add(lamp);

  const lampAmber = new THREE.Object3D();
  lampAmber.name = 'LAMP_sicherungsanzeige';
  lampAmber.position.set(0, 0.42, 0.65);
  lampAmber.userData = {
    color: '#ffb04a',
    intensity: 3,
    distance: 2.5
  };
  root.add(lampAmber);

  // ---------------------------------------------------------------------
  // Zustand und Animation.
  // ---------------------------------------------------------------------
  function update(dt) {
    const d = Math.min(Math.max(dt, 0), 0.1);
    zeit += d;

    const zielHelligkeit = aktiv ? (gesichert ? 1.25 : 1.55) : 0.25;
    helligkeit += (zielHelligkeit - helligkeit) * Math.min(1, d * 4.5);

    const zielAmber = katalogModus ? 0.72 : (sichernBlitz > 0 ? 0.95 : 0);
    amberAnteil += (zielAmber - amberAnteil) * Math.min(1, d * 6);

    if (sichernBlitz > 0) sichernBlitz = Math.max(0, sichernBlitz - d);

    const puls = 0.88 + Math.sin(zeit * 2.7) * 0.12;
    matCore.emissive.copy(blauZiel).lerp(bernsteinZiel, amberAnteil);
    matCore.emissiveIntensity = helligkeit * puls;
    matCrystal.emissiveIntensity = 0.16 + helligkeit * 0.18;
    matDataBlue.emissiveIntensity = 0.45 + helligkeit * 0.65 * puls;
    matDataAmber.emissiveIntensity = 0.38 + helligkeit * 0.72;
    matMote.emissiveIntensity = 0.7 + helligkeit * 1.2;
    matScan.emissiveIntensity = 1.6 + helligkeit * 1.4;

    statusMaterial.emissiveIntensity = aktiv
      ? 1.25 + Math.sin(zeit * 4) * 0.25
      : 0.25;
    statusMaterial.color.set(gesichert ? 0xffbd65 : 0x76ddff);
    statusMaterial.emissive.set(gesichert ? 0xff8b24 : 0x25aaff);

    if (aktiv) {
      scanFortschritt = (scanFortschritt + d * 0.42) % 1;
    }

    const scanY = 0.47 + scanFortschritt * 1.66;
    for (let i = 0; i < pillarData.length; i++) {
      const p = pillarData[i];
      p.scan.visible = aktiv;
      p.scan.position.y = scanY;
      p.scan.scale.setScalar(1 + Math.sin(zeit * 5 + i) * 0.035);
      p.finialTip.rotation.y = zeit * (katalogModus ? 1.1 : 0.32);
      p.finialTip.position.y = 2.56 + Math.sin(zeit * 1.8 + i) * 0.015;
    }

    for (let i = 0; i < moteData.length; i++) {
      const m = moteData[i];
      const phase = (m.phase + zeit * m.speed) % 1;
      const y = 0.42 + phase * 1.92;
      dummy.position.set(
        m.x + Math.sin(zeit * 1.4 + i) * 0.018,
        y,
        m.z + Math.cos(zeit * 1.2 + i) * 0.018
      );
      const s = m.radius * (0.65 + Math.sin(phase * Math.PI) * 0.6);
      dummy.scale.setScalar(s / 0.022);
      dummy.rotation.set(0, zeit + i, 0);
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;
  }

  base.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;

  // ---------------------------------------------------------------------
  // Öffentliche API und Aktionen.
  // ---------------------------------------------------------------------
  const api = {
    einschalten() {
      aktiv = true;
      gesichert = false;
      zeichneKatalogschild();
    },
    ausschalten() {
      aktiv = false;
      katalogModus = false;
      gesichert = false;
      scanFortschritt = 0;
      zeichneKatalogschild();
    },
    katalogDurchsuchen() {
      if (!aktiv) aktiv = true;
      katalogModus = true;
      zeichneKatalogschild();
    },
    katalogDurchsuchenBeenden() {
      katalogModus = false;
      zeichneKatalogschild();
    },
    katalogIndexWechseln() {
      katalogIndex = (katalogIndex + 1) % 9999;
      sichernBlitz = 0.7;
      if (!aktiv) aktiv = true;
      zeichneKatalogschild();
    },
    sichern() {
      if (!aktiv) aktiv = true;
      gesichert = true;
      katalogModus = false;
      sichernBlitz = 1.1;
      zeichneKatalogschild();
    },
    entsichern() {
      gesichert = false;
      sichernBlitz = 0.6;
      zeichneKatalogschild();
    },
    get aktiv() { return aktiv; },
    get katalogModus() { return katalogModus; },
    get gesichert() { return gesichert; },
    get katalogIndex() { return katalogIndex; }
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'datenbank_einschalten',
      label: 'Hauptdatenbank einschalten',
      run: () => api.einschalten()
    },
    {
      id: 'datenbank_ausschalten',
      label: 'Hauptdatenbank ausschalten',
      run: () => api.ausschalten()
    },
    {
      id: 'katalog_durchsuchen',
      label: 'Archivkatalog durchsuchen',
      run: () => api.katalogDurchsuchen()
    },
    {
      id: 'katalog_durchsuchen_beenden',
      label: 'Katalogsuche beenden',
      run: () => api.katalogDurchsuchenBeenden()
    },
    {
      id: 'katalog_index_wechseln',
      label: 'Nächsten Katalogeintrag aufrufen',
      run: () => api.katalogIndexWechseln()
    },
    {
      id: 'sicherung_aktivieren',
      label: 'Datenbanksicherung aktivieren',
      run: () => api.sichern()
    },
    {
      id: 'sicherung_loesen',
      label: 'Datenbanksicherung lösen',
      run: () => api.entsichern()
    }
  ];

  return root;
}

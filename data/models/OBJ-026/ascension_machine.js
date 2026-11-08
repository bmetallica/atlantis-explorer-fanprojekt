// Antike Aufstiegsmaschine – Standobjekt
// Ursprung: Mitte der Unterseite; Vorderseite zeigt nach +Z.
import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'ascension_machine',
  art: 'Standobjekt',
  masse: '3,66 × 3,40 × 3,66 (B × H × T, m)',
  benutzen: 'INT_bedienen → Analyse, Transformation, Stopp und Rückumwandlung',
  lichter: 'LAMP_emitter (eisblau), LAMP_screen (gelbgrün)',
  animation: 'Energiespirale, Emitter und Display pulsieren; laufende Hirnwellen und tödlicher 60-Sekunden-Countdown',
  quelle: 'selbst gebaut nach Stargate Atlantis, „Tao of Rodney“',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'ascension_machine';

  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matPillar = kit('pillar');
  const matFloor = kit('floor');

  const matGlow = new THREE.MeshStandardMaterial({
    name: 'KIT_glow',
    color: 0x78eaff,
    emissive: 0x32cfff,
    emissiveIntensity: 1.35,
    metalness: 0.18,
    roughness: 0.3,
  });

  const matAmber = new THREE.MeshStandardMaterial({
    name: 'KIT_amberGlow',
    color: 0xffd267,
    emissive: 0xffa62b,
    emissiveIntensity: 1.2,
    metalness: 0.25,
    roughness: 0.38,
  });

  const matFrame = new THREE.MeshStandardMaterial({
    name: 'ascension_frame',
    color: 0xb6cc46,
    emissive: 0x74951c,
    emissiveIntensity: 0.85,
    metalness: 0.48,
    roughness: 0.34,
  });

  const matOrnament = new THREE.MeshStandardMaterial({
    name: 'ascension_ornament',
    color: 0xdbe8ec,
    emissive: 0x55b9d6,
    emissiveIntensity: 0.18,
    metalness: 0.74,
    roughness: 0.26,
  });

  const matPanel = new THREE.MeshStandardMaterial({
    name: 'ascension_control_panel',
    color: 0x143b43,
    emissive: 0x2ea5b6,
    emissiveIntensity: 0.65,
    metalness: 0.58,
    roughness: 0.34,
  });

  const matDisc = new THREE.MeshStandardMaterial({
    name: 'ascension_treatment_disc',
    color: 0x102b33,
    emissive: 0x0c7180,
    emissiveIntensity: 0.32,
    metalness: 0.66,
    roughness: 0.38,
  });

  const matDisplayInner = new THREE.MeshStandardMaterial({
    name: 'ascension_display_inner',
    color: 0x06171b,
    emissive: 0x0b3940,
    emissiveIntensity: 0.5,
    metalness: 0.42,
    roughness: 0.43,
  });

  const matEmitterCore = new THREE.MeshStandardMaterial({
    name: 'ascension_emitter_core',
    color: 0xc2f9ff,
    emissive: 0x56dcff,
    emissiveIntensity: 2.35,
    metalness: 0.04,
    roughness: 0.2,
  });

  const matEnergy = new THREE.MeshStandardMaterial({
    name: 'ascension_energy',
    color: 0x72ffdc,
    emissive: 0x18f5b5,
    emissiveIntensity: 2.4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    metalness: 0,
    roughness: 0.2,
  });

  const matColumn = new THREE.MeshStandardMaterial({
    name: 'ascension_energy_column',
    color: 0x55eee0,
    emissive: 0x18c9c1,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const instanzDummy = new THREE.Object3D();
  const instanzPosition = new THREE.Vector3();
  const instanzQuaternion = new THREE.Quaternion();
  const instanzScale = new THREE.Vector3(1, 1, 1);
  const qY = new THREE.Quaternion();
  const qX = new THREE.Quaternion();
  const achseY = new THREE.Vector3(0, 1, 0);
  const achseX = new THREE.Vector3(1, 0, 0);

  function setInstanz(mesh, index, position, quaternion) {
    // Defensive Absicherung: Es dürfen ausschließlich endliche Werte gesetzt werden.
    const endlich =
      Number.isFinite(position.x) &&
      Number.isFinite(position.y) &&
      Number.isFinite(position.z) &&
      Number.isFinite(quaternion.x) &&
      Number.isFinite(quaternion.y) &&
      Number.isFinite(quaternion.z) &&
      Number.isFinite(quaternion.w);

    if (endlich) {
      instanzPosition.copy(position);
      instanzQuaternion.copy(quaternion);
      instanzScale.set(1, 1, 1);
    } else {
      instanzPosition.set(0, 0, 0);
      instanzQuaternion.identity();
      instanzScale.set(0, 0, 0);
    }

    instanzDummy.position.copy(instanzPosition);
    instanzDummy.quaternion.copy(instanzQuaternion);
    instanzDummy.scale.copy(instanzScale);
    instanzDummy.updateMatrix();
    mesh.setMatrixAt(index, instanzDummy.matrix);
  }

  function cylinderBetween(a, b, radius, material, radialSegments = 10) {
    const delta = new THREE.Vector3().subVectors(b, a);
    const length = delta.length();

    if (!Number.isFinite(length) || length < 0.0001) {
      return new THREE.Group();
    }

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, radialSegments),
      material
    );
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize()
    );
    return mesh;
  }

  // --- Bodenplattform ------------------------------------------------------
  const unterbau = new THREE.Mesh(
    new THREE.CylinderGeometry(1.79, 1.83, 0.12, 8),
    matDark
  );
  unterbau.position.y = 0.06;
  unterbau.rotation.y = Math.PI / 8;
  root.add(unterbau);

  const plattform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.70, 1.75, 0.14, 8),
    matDark
  );
  plattform.position.y = 0.19;
  plattform.rotation.y = Math.PI / 8;
  root.add(plattform);

  const bodenplatte = new THREE.Mesh(
    new THREE.CylinderGeometry(1.52, 1.52, 0.035, 8),
    matFloor
  );
  bodenplatte.position.y = 0.2775;
  bodenplatte.rotation.y = Math.PI / 8;
  root.add(bodenplatte);

  const randRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.61, 0.035, 8, 64),
    matCopper
  );
  randRing.position.y = 0.27;
  randRing.rotation.x = Math.PI / 2;
  root.add(randRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.34, 0.018, 8, 64),
    matOrnament
  );
  innerRing.position.y = 0.3;
  innerRing.rotation.x = Math.PI / 2;
  root.add(innerRing);

  const behandlungsRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.63, 0.045, 10, 48),
    matGlow
  );
  behandlungsRing.position.set(0, 0.315, 0.05);
  behandlungsRing.rotation.x = Math.PI / 2;
  root.add(behandlungsRing);

  const behandlungsScheibe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 0.025, 32),
    matDisc
  );
  behandlungsScheibe.position.set(0, 0.307, 0.05);
  root.add(behandlungsScheibe);

  const plattformKanten = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.3, 0.026, 0.055),
    matOrnament,
    8
  );
  plattformKanten.name = 'plattform_kanten';

  for (let i = 0; i < 8; i++) {
    const winkel = (i / 8) * Math.PI * 2;
    qY.setFromAxisAngle(achseY, winkel);
    instanzPosition.set(
      Math.sin(winkel) * 1.61,
      0.27,
      Math.cos(winkel) * 1.61
    );
    setInstanz(plattformKanten, i, instanzPosition, qY);
  }

  plattformKanten.instanceMatrix.needsUpdate = true;
  plattformKanten.computeBoundingSphere();
  root.add(plattformKanten);

  const bodenornamente = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.34, 0.014, 0.045),
    matFrame,
    16
  );
  bodenornamente.name = 'bodenornamente';

  let bodenIndex = 0;
  for (let ring = 0; ring < 2; ring++) {
    const anzahl = 8;
    const radius = ring === 0 ? 0.93 : 1.14;

    for (let i = 0; i < anzahl; i++) {
      const winkel = (i / anzahl) * Math.PI * 2 + ring * Math.PI / anzahl;
      qY.setFromAxisAngle(achseY, winkel);
      instanzPosition.set(
        Math.sin(winkel) * radius,
        0.303,
        0.05 + Math.cos(winkel) * radius
      );
      setInstanz(bodenornamente, bodenIndex++, instanzPosition, qY);
    }
  }

  bodenornamente.instanceMatrix.needsUpdate = true;
  bodenornamente.computeBoundingSphere();
  root.add(bodenornamente);

  // --- Geschwungenes Bedienterminal im Vordergrund ------------------------
  // Das Terminal liegt auf der +Z-Seite; der Nutzer steht auf der Scheibe.
  const terminalGruppe = new THREE.Group();
  terminalGruppe.name = 'terminal';
  root.add(terminalGruppe);

  const terminalRadius = 1.10;
  const terminalWinkel = [];
  const panelNeigung = 0.14;

  for (let i = 0; i < 7; i++) {
    const winkel = THREE.MathUtils.degToRad(-40 + i * (80 / 6));
    const x = Math.sin(winkel) * terminalRadius;
    const z = Math.cos(winkel) * terminalRadius;
    terminalWinkel.push(winkel);

    const koerper = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.84, 0.56),
      matDark
    );
    koerper.position.set(x, 0.65, z);
    koerper.rotation.y = winkel;
    terminalGruppe.add(koerper);

    const frontBlende = new THREE.Mesh(
      new THREE.BoxGeometry(0.205, 0.53, 0.025),
      matPillar
    );
    frontBlende.position.set(
      x + Math.sin(winkel) * 0.288,
      0.67,
      z + Math.cos(winkel) * 0.288
    );
    frontBlende.rotation.y = winkel;
    terminalGruppe.add(frontBlende);

    const seitenIntarsie = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.39, 0.035),
      matOrnament
    );
    seitenIntarsie.position.set(
      x + Math.sin(winkel) * 0.306,
      0.68,
      z + Math.cos(winkel) * 0.306
    );
    seitenIntarsie.rotation.y = winkel;
    terminalGruppe.add(seitenIntarsie);

    const obereLeiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.255, 0.075, 0.59),
      matDark
    );
    obereLeiste.position.set(x, 1.105, z);
    obereLeiste.rotation.y = winkel;
    terminalGruppe.add(obereLeiste);

    const kupferleiste = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.025, 0.026),
      matCopper
    );
    kupferleiste.position.set(
      x + Math.sin(winkel) * 0.301,
      0.91,
      z + Math.cos(winkel) * 0.301
    );
    kupferleiste.rotation.y = winkel;
    terminalGruppe.add(kupferleiste);

    const fuss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.145, 0.22, 8),
      matCopper
    );
    fuss.position.set(x, 0.17, z);
    fuss.rotation.y = Math.PI / 8;
    terminalGruppe.add(fuss);
  }

  const bedienfelder = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.18, 0.022, 0.38),
    matPanel,
    terminalWinkel.length
  );
  bedienfelder.name = 'bedienfelder';

  const tasten = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.034, 0.022, 0.045),
    matAmber,
    terminalWinkel.length * 6
  );
  tasten.name = 'pulttasten';

  let panelIndex = 0;
  let tasterIndex = 0;

  for (const winkel of terminalWinkel) {
    const tangentX = Math.cos(winkel);
    const tangentZ = -Math.sin(winkel);
    const radialX = Math.sin(winkel);
    const radialZ = Math.cos(winkel);
    const centerX = Math.sin(winkel) * terminalRadius;
    const centerZ = Math.cos(winkel) * terminalRadius;

    qY.setFromAxisAngle(achseY, winkel);
    qX.setFromAxisAngle(achseX, panelNeigung);
    instanzQuaternion.copy(qY).multiply(qX);

    instanzPosition.set(centerX, 1.155, centerZ);
    setInstanz(bedienfelder, panelIndex++, instanzPosition, instanzQuaternion);

    for (let reihe = 0; reihe < 2; reihe++) {
      for (let spalte = 0; spalte < 3; spalte++) {
        const u = (spalte - 1) * 0.052;
        const v = 0.115 + reihe * 0.082;
        const dy = Math.cos(panelNeigung) * 0.039
          - Math.sin(panelNeigung) * v;
        const dz = Math.sin(panelNeigung) * 0.039
          + Math.cos(panelNeigung) * v;

        instanzPosition.set(
          centerX + tangentX * u + radialX * dz,
          1.155 + dy,
          centerZ + tangentZ * u + radialZ * dz
        );
        setInstanz(tasten, tasterIndex++, instanzPosition, instanzQuaternion);
      }
    }
  }

  bedienfelder.instanceMatrix.needsUpdate = true;
  tasten.instanceMatrix.needsUpdate = true;
  bedienfelder.computeBoundingSphere();
  tasten.computeBoundingSphere();
  terminalGruppe.add(bedienfelder, tasten);

  // --- Großes achteckiges Hauptdisplay -------------------------------------
  const displayGruppe = new THREE.Group();
  displayGruppe.name = 'display';
  displayGruppe.position.set(0, 2.13, -0.86);
  root.add(displayGruppe);

  const displayRueckseite = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.88, 0.16, 8),
    matCopper
  );
  displayRueckseite.rotation.x = Math.PI / 2;
  displayRueckseite.rotation.z = Math.PI / 8;
  displayRueckseite.position.z = -0.04;
  displayGruppe.add(displayRueckseite);

  const displayInnen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.745, 0.745, 0.14, 8),
    matDisplayInner
  );
  displayInnen.rotation.x = Math.PI / 2;
  displayInnen.rotation.z = Math.PI / 8;
  displayInnen.position.z = 0.035;
  displayGruppe.add(displayInnen);

  const rahmenShape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 0.92;
    const y = Math.sin(a) * 0.92;
    if (i === 0) rahmenShape.moveTo(x, y);
    else rahmenShape.lineTo(x, y);
  }
  rahmenShape.closePath();

  const rahmenOeffnung = new THREE.Path();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 - (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 0.745;
    const y = Math.sin(a) * 0.745;
    if (i === 0) rahmenOeffnung.moveTo(x, y);
    else rahmenOeffnung.lineTo(x, y);
  }
  rahmenOeffnung.closePath();
  rahmenShape.holes.push(rahmenOeffnung);

  const displayRahmenGeo = new THREE.ExtrudeGeometry(rahmenShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 1,
  });
  displayRahmenGeo.translate(0, 0, -0.09);

  const displayRahmen = new THREE.Mesh(displayRahmenGeo, matFrame);
  displayRahmen.position.z = 0.085;
  displayGruppe.add(displayRahmen);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'ascension_screen',
    color: 0xffffff,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 1.2,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    metalness: 0.08,
    roughness: 0.35,
  });

  const screen = new THREE.Mesh(
    new THREE.CircleGeometry(0.735, 8),
    screenMaterial
  );
  screen.position.z = 0.181;
  screen.rotation.z = Math.PI / 8;
  displayGruppe.add(screen);

  const rahmenMarker = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.11, 0.032, 0.025),
    matOrnament,
    8
  );
  rahmenMarker.name = 'displayrahmen_marker';

  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    qY.setFromAxisAngle(achseZ(), a + Math.PI / 2);
    instanzPosition.set(
      Math.cos(a) * 0.827,
      Math.sin(a) * 0.827,
      0.225
    );
    setInstanz(rahmenMarker, i, instanzPosition, qY);
  }

  rahmenMarker.instanceMatrix.needsUpdate = true;
  rahmenMarker.computeBoundingSphere();
  displayGruppe.add(rahmenMarker);

  // Tragende Stützen; das Display schwebt nicht.
  root.add(
    cylinderBetween(
      new THREE.Vector3(-0.47, 0.27, -1.08),
      new THREE.Vector3(-0.47, 1.92, -0.92),
      0.052,
      matCopper
    ),
    cylinderBetween(
      new THREE.Vector3(0.47, 0.27, -1.08),
      new THREE.Vector3(0.47, 1.92, -0.92),
      0.052,
      matCopper
    )
  );

  // --- Deckenemitter --------------------------------------------------------
  const emitter = new THREE.Group();
  emitter.name = 'deckenemitter';
  emitter.position.set(0, 3.25, 0.05);
  root.add(emitter);

  const emitterGehaeuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.52, 0.24, 8),
    matDark
  );
  emitterGehaeuse.rotation.y = Math.PI / 8;
  emitter.add(emitterGehaeuse);

  const emitterKranz = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.035, 8, 48),
    matCopper
  );
  emitterKranz.position.y = -0.04;
  emitterKranz.rotation.x = Math.PI / 2;
  emitter.add(emitterKranz);

  const emitterKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.035, 32),
    matEmitterCore
  );
  emitterKern.position.y = -0.14;
  emitter.add(emitterKern);

  const filter = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.22),
    matGlow,
    8
  );
  filter.name = 'emitterfilter';

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    qY.setFromAxisAngle(achseY, a);
    instanzPosition.set(
      Math.sin(a) * 0.38,
      -0.165,
      Math.cos(a) * 0.38
    );
    setInstanz(filter, i, instanzPosition, qY);
  }

  filter.instanceMatrix.needsUpdate = true;
  filter.computeBoundingSphere();
  emitter.add(filter);

  root.add(
    cylinderBetween(
      new THREE.Vector3(-0.43, 2.85, -0.84),
      new THREE.Vector3(-0.43, 3.16, 0.05),
      0.038,
      matCopper
    ),
    cylinderBetween(
      new THREE.Vector3(0.43, 2.85, -0.84),
      new THREE.Vector3(0.43, 3.16, 0.05),
      0.038,
      matCopper
    )
  );

  // --- Grün-türkise Energiesäule -------------------------------------------
  const energieGruppe = new THREE.Group();
  energieGruppe.name = 'energiesaeule';
  energieGruppe.position.set(0, 0, 0.05);
  root.add(energieGruppe);

  const spaltenHuelle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 2.72, 32),
    matColumn
  );
  spaltenHuelle.position.y = 1.69;
  energieGruppe.add(spaltenHuelle);

  function spirale(offset) {
    const punkte = [];
    const hoehe = 2.62;
    const drehungen = 2.45;

    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const a = t * Math.PI * 2 * drehungen + offset;
      const radius = 0.49 + Math.sin(t * Math.PI * 4) * 0.035;

      punkte.push(new THREE.Vector3(
        Math.cos(a) * radius,
        0.34 + t * hoehe,
        Math.sin(a) * radius
      ));
    }

    const kurve = new THREE.CatmullRomCurve3(punkte);
    const gruppe = new THREE.Group();

    const rohr = new THREE.Mesh(
      new THREE.TubeGeometry(kurve, 140, 0.032, 6, false),
      matEnergy
    );
    gruppe.add(rohr);

    const kappeUnten = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 10, 6),
      matEnergy
    );
    kappeUnten.position.copy(punkte[0]);
    gruppe.add(kappeUnten);

    const kappeOben = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 10, 6),
      matEnergy
    );
    kappeOben.position.copy(punkte[punkte.length - 1]);
    gruppe.add(kappeOben);

    return gruppe;
  }

  const spiraleA = spirale(0);
  const spiraleB = spirale(Math.PI);
  energieGruppe.add(spiraleA, spiraleB);

  // --- Kollision ------------------------------------------------------------
  for (let i = 0; i < 8; i++) {
    const winkel = (i / 8) * Math.PI * 2;
    const rand = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.3, 0.26)
    );
    rand.name = `COL_plattform_${i}`;
    rand.position.set(
      Math.sin(winkel) * 1.63,
      0.15,
      Math.cos(winkel) * 1.63
    );
    rand.rotation.y = winkel;
    root.add(rand);
  }

  const colTerminal = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 1.08, 0.72)
  );
  colTerminal.name = 'COL_terminal';
  colTerminal.position.set(0, 0.65, 1.08);
  root.add(colTerminal);

  const colDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 1.82, 0.32)
  );
  colDisplay.name = 'COL_display';
  colDisplay.position.set(0, 2.13, -0.86);
  root.add(colDisplay);

  const colEmitter = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.28, 1.28)
  );
  colEmitter.name = 'COL_emitter';
  colEmitter.position.set(0, 3.25, 0.05);
  root.add(colEmitter);

  // --- Benutzen-Punkt und Lichter -------------------------------------------
  const use = new THREE.Object3D();
  use.name = 'INT_bedienen';
  use.position.set(0, 1.25, 1.61);
  use.userData = {
    label: 'Aufstiegsmaschine bedienen',
    radius: 0.9,
  };
  root.add(use);

  const lampEmitter = new THREE.Object3D();
  lampEmitter.name = 'LAMP_emitter';
  lampEmitter.position.set(0, 3.03, 0.05);
  lampEmitter.userData = {
    color: '#6fe3ff',
    intensity: 10,
    distance: 6,
  };
  root.add(lampEmitter);

  const lampScreen = new THREE.Object3D();
  lampScreen.name = 'LAMP_screen';
  lampScreen.position.set(0, 2.13, -0.49);
  lampScreen.userData = {
    color: '#b8ef5a',
    intensity: 4,
    distance: 3.5,
  };
  root.add(lampScreen);

  // --- Zustand ---------------------------------------------------------------
  const ZEIT_LIMIT = 60;

  const PHASE_TEXT = {
    bereit: 'BEREIT / GENOM-SCAN',
    analyse: 'HIRNANALYSE LÄUFT',
    transformation: 'TRANSFORMATION AKTIV',
    transformiert: 'AUFSTIEGSSTUFE ERREICHT',
    kritisch: 'KRITISCH / REINTEGRATION',
    gestoppt: 'TRANSFORMATION GESTOPPT',
    zurueckgesetzt: 'RÜCKUMWANDLUNG VORGESCHOBEN',
  };

  let phase = 'bereit';
  let zeit = 0;
  let scanRest = 0;
  let remaining = 0;
  let progress = 0;
  let energie = 0;
  let template = null;
  let kritischHandler = null;
  let phaseHandler = null;
  let letzteZeichnung = -1;

  const daten = {
    neural: 0,
    vitality: 100,
    genetik: 'UNBESTIMMT',
    speicher: '0 %',
  };

  function setPhase(neu) {
    if (phase === neu) return;
    phase = neu;
    if (phaseHandler) phaseHandler(phase, remaining);
  }

  function zeichneDisplay() {
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 512);

    const achteck = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    achteck(256, 256, 252);
    ctx.fillStyle = '#03181c';
    ctx.fill();
    ctx.strokeStyle = phase === 'kritisch' ? '#ff674a' : '#7de8d5';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4fff4';
    ctx.font = 'bold 25px monospace';
    ctx.fillText('ATL-9 GENOMIC', 256, 74);

    ctx.fillStyle = phase === 'kritisch' ? '#ff815f' : '#b8ef72';
    ctx.font = 'bold 25px monospace';
    ctx.fillText(PHASE_TEXT[phase] || 'BEREIT', 256, 125);

    ctx.strokeStyle = '#2c8f91';
    ctx.lineWidth = 3;
    ctx.strokeRect(35, 153, 442, 125);

    ctx.fillStyle = '#71d8d0';
    ctx.font = '19px monospace';
    ctx.fillText(`NEURAL  ${daten.neural.toFixed(1)} Hz`, 62, 186);
    ctx.fillText(`VITAL   ${daten.vitality.toFixed(1)} %`, 62, 218);
    ctx.fillText(`GENOME  ${daten.genetik}`, 62, 250);

    ctx.beginPath();
    for (let x = 0; x <= 440; x += 4) {
      const y = 332
        + Math.sin(x * 0.045 + zeit * 4) * 20
        + Math.sin(x * 0.13 - zeit * 7) * 7;

      if (x === 0) ctx.moveTo(36 + x, y);
      else ctx.lineTo(36 + x, y);
    }
    ctx.strokeStyle = phase === 'kritisch' ? '#ff6044' : '#54e8c2';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffe293';
    ctx.font = 'bold 48px monospace';

    const zeitText = phase === 'transformation' || phase === 'kritisch'
      ? Math.max(0, Math.ceil(remaining)).toString().padStart(2, '0')
      : '--';

    ctx.fillText(zeitText, 256, 425);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#83aeb1';
    ctx.fillText(`SPEICHER ${daten.speicher}`, 256, 463);

    texture.needsUpdate = true;
  }

  function scanStart() {
    if (phase === 'transformation' || phase === 'kritisch') return false;

    scanRest = 3;
    setPhase('analyse');
    daten.neural = 0;
    daten.speicher = '12 %';
    return true;
  }

  function scanAbschluss() {
    template = {
      neural: 6.2,
      vitality: 100,
      genetik: 'HG-17',
      zeitpunkt: zeit,
    };

    daten.neural = 6.2;
    daten.vitality = 100;
    daten.genetik = 'HG-17';
    daten.speicher = '38 %';
    setPhase('bereit');
  }

  function startTransformation() {
    if (phase === 'transformation' || phase === 'kritisch') return false;

    remaining = ZEIT_LIMIT;
    progress = 0;
    daten.genetik = 'MUTIEREND';
    setPhase('transformation');
    return true;
  }

  function stopTransformation() {
    if (phase !== 'transformation' && phase !== 'kritisch') return false;

    remaining = 0;
    progress = 0;
    setPhase('gestoppt');
    return true;
  }

  function rueckumwandlung() {
    if (!template) {
      setPhase('gestoppt');
      return false;
    }

    remaining = 0;
    progress = 0;
    energie *= 0.35;
    daten.neural = template.neural;
    daten.vitality = template.vitality;
    daten.genetik = template.genetik;
    daten.speicher = '100 %';
    setPhase('zurueckgesetzt');
    return true;
  }

  function update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;

    zeit += dt;
    const schritt = Math.min(1, dt * 4.5);

    if (phase === 'analyse') {
      scanRest -= dt;
      daten.neural = 5.8 + Math.sin(zeit * 12) * 0.7;
      daten.speicher =
        `${Math.min(38, 12 + (3 - Math.max(0, scanRest)) * 9).toFixed(0)} %`;

      if (scanRest <= 0) scanAbschluss();
    }

    if (phase === 'transformation') {
      remaining = Math.max(0, remaining - dt);
      progress = THREE.MathUtils.clamp(1 - remaining / ZEIT_LIMIT, 0, 1);
      daten.neural = 6.2 + progress * 19 + Math.sin(zeit * 17) * 1.3;
      daten.vitality = 100 - progress * 31;
      daten.genetik = progress < 0.35
        ? 'MUTIEREND'
        : progress < 0.78
          ? 'ASZENDENZ'
          : 'AUFSTIEG';
      daten.speicher = `${Math.floor(38 + progress * 62)} %`;

      if (remaining <= 0) {
        setPhase('kritisch');

        if (kritischHandler) {
          kritischHandler({
            zeitlimit: ZEIT_LIMIT,
            fatal: true,
            hinweis: 'Genom-Reintegration nicht abgeschlossen. Nutzer sofort freigeben.',
          });
        }
      }
    }

    const aktiv = phase === 'transformation' || phase === 'kritisch';
    const zielEnergie = aktiv ? 1 : 0;
    energie += (zielEnergie - energie) * schritt;

    const puls = 0.5 + 0.5 * Math.sin(zeit * 5.5);

    matEnergy.opacity = energie * (0.64 + puls * 0.22);
    matEnergy.emissiveIntensity = 1.1 + energie * (2.4 + puls * 1.1);
    matColumn.opacity = energie * (0.065 + puls * 0.045);
    matColumn.emissiveIntensity = 0.25 + energie * (1.2 + puls);

    spiraleA.rotation.y = zeit * 1.25;
    spiraleB.rotation.y = -zeit * 1.05;
    spiraleA.position.y = Math.sin(zeit * 2.2) * 0.035;
    spiraleB.position.y = -Math.sin(zeit * 2.2) * 0.035;

    matEmitterCore.emissiveIntensity = aktiv
      ? 3.1 + puls * 2.4
      : 1.25 + puls * 0.75;

    matGlow.emissiveIntensity = aktiv ? 2.1 + puls : 1.1 + puls * 0.35;
    matAmber.emissiveIntensity = 1.05 + puls * 0.5;
    matFrame.emissiveIntensity = phase === 'kritisch'
      ? 1.3 + Math.sin(zeit * 14) * 0.7
      : 0.75 + puls * 0.2;

    if (zeit - letzteZeichnung > 0.2   /* Display-Takt max. 5 Hz (Leistung) */) {
      zeichneDisplay();
      letzteZeichnung = zeit;
    }
  }

  plattform.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (update._last !== undefined) {
      update(Math.min(now - update._last, 0.1));
    }
    update._last = now;
  };

  root.userData.update = update;

  const api = {
    analysieren() {
      return scanStart();
    },

    transformationStarten() {
      return startTransformation();
    },

    stoppen() {
      return stopTransformation();
    },

    rueckumwandeln() {
      return rueckumwandlung();
    },

    kritischenHandlerSetzen(handler) {
      kritischHandler = typeof handler === 'function' ? handler : null;
    },

    phasenHandlerSetzen(handler) {
      phaseHandler = typeof handler === 'function' ? handler : null;
    },

    get phase() {
      return phase;
    },

    get remaining() {
      return remaining;
    },

    get progress() {
      return progress;
    },

    get aktiv() {
      return phase === 'transformation';
    },

    get kritisch() {
      return phase === 'kritisch';
    },

    get vorlageVorhanden() {
      return Boolean(template);
    },

    get daten() {
      return { ...daten };
    },
  };

  root.userData.api = api;
  root.userData.actions = [
    {
      id: 'analyse',
      label: 'Hirnaktivität analysieren und Genom-Vorlage speichern',
      run: () => api.analysieren(),
    },
    {
      id: 'start',
      label: 'Genetische Transformation starten (60 Sekunden, tödliches Zeitlimit)',
      run: () => api.transformationStarten(),
    },
    {
      id: 'stopp',
      label: 'Transformation sofort stoppen',
      run: () => api.stoppen(),
    },
    {
      id: 'rueck',
      label: 'Genom mit gespeicherter Vorlage zurückwandeln',
      run: () => api.rueckumwandeln(),
    },
  ];

  zeichneDisplay();
  return root;

  function achseZ() {
    return new THREE.Vector3(0, 0, 1);
  }
}

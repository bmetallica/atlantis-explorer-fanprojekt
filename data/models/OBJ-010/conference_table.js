// OBJ-010: Besprechungstisch – segmentierter Hufeisentisch im Atlantis-Stil
// 1 Einheit = 1 Meter, +Y oben, Vorderseite +Z.
// Ursprung: Mitte der Unterseite, X/Z mittig zur sichtbaren Gesamtfigur.
// Die Hufeisenöffnung zeigt nach −Z.
import * as THREE from 'three';

export const steckbrief = {
  name: 'conference_table',
  art: 'Standobjekt',
  masse: '4,70 × 0,75 × 4,00 (B × H × T, m), 9 Plätze',
  wohin: 'ATL-003 – zentraler Konferenzraum der Atlantis-Operations',
  benutzen: 'Kein eigener Benutzen-Punkt; Treffpunkt für Briefings, Debriefings und Missionsvergaben',
  lichter: 'LAMP_tisch – eisblaue Unterkantenbeleuchtung, dauerhaft an',
  animation: 'Eisblaue Leuchtleiste pulsiert dezent; Tisch bleibt statisch',
  quelle: 'selbst gebaut nach Referenzbild und Beschreibung',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'conference_table';

  // Alle sichtbaren Teile liegen in dieser Gruppe. Der Versatz zentriert die
  // asymmetrische Hufeisenform im Koordinatenursprung.
  const table = new THREE.Group();
  table.position.z = -0.344;
  root.add(table);

  // --- Maße
  const height = 0.75;
  const topThickness = 0.09;
  const topBottom = height - topThickness;
  const outerRadius = 2.35;
  const innerRadius = 1.45;
  const topInnerRadius = 1.47;

  const segmentCount = 4;
  const arcStart = THREE.MathUtils.degToRad(135);
  const arcSpan = THREE.MathUtils.degToRad(270);
  const segmentSpan = arcSpan / segmentCount;
  const seamGap = THREE.MathUtils.degToRad(0.35);

  // --- Materialien
  const topMaterial = new THREE.MeshStandardMaterial({
    name: 'conference_top',
    color: 0xb9c1c5,
    metalness: 0.32,
    roughness: 0.24,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    name: 'KIT_wallDark',
    color: 0x263744,
    metalness: 0.74,
    roughness: 0.32,
  });

  const bronzeMaterial = new THREE.MeshStandardMaterial({
    name: 'KIT_copper',
    color: 0xa27749,
    metalness: 0.82,
    roughness: 0.25,
  });

  const glowMaterial = new THREE.MeshStandardMaterial({
    name: 'conference_glow',
    color: 0x9ceeff,
    emissive: 0x45cfff,
    emissiveIntensity: 1.15,
    metalness: 0.08,
    roughness: 0.22,
  });

  const recessMaterial = new THREE.MeshStandardMaterial({
    name: 'conference_recess',
    color: 0x101a22,
    metalness: 0.48,
    roughness: 0.55,
  });

  const collisionMaterial = new THREE.MeshBasicMaterial({
    name: 'conference_collision',
    visible: false,
  });

  // Geschlossener Kreissegment-Ring in der X/Y-Ebene.
  // Nach rotateX(-PI/2) liegt der Körper waagerecht; die Extrusion geht nach +Y.
  function annularSectorGeometry(rInner, rOuter, angleStart, angleEnd, depth, steps = 12) {
    const shape = new THREE.Shape();

    for (let i = 0; i <= steps; i++) {
      const a = THREE.MathUtils.lerp(angleStart, angleEnd, i / steps);
      const x = Math.cos(a) * rOuter;
      const y = Math.sin(a) * rOuter;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    for (let i = steps; i >= 0; i--) {
      const a = THREE.MathUtils.lerp(angleStart, angleEnd, i / steps);
      shape.lineTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
    }

    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 8,
      steps: 1,
    });

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  const visibleSegments = [];

  // Vier getrennte keilförmige Platten bilden das Hufeisen.
  for (let i = 0; i < segmentCount; i++) {
    const a0 = arcStart + i * segmentSpan + seamGap;
    const a1 = arcStart + (i + 1) * segmentSpan - seamGap;

    const topGeometry = annularSectorGeometry(
      topInnerRadius,
      outerRadius,
      a0,
      a1,
      topThickness,
      14
    );

    const segment = new THREE.Mesh(topGeometry, topMaterial);
    segment.name = `tischplatte_segment_${i + 1}`;
    segment.position.y = topBottom;
    segment.castShadow = true;
    segment.receiveShadow = true;
    table.add(segment);
    visibleSegments.push(segment);

    // Unsichtbarer, geschlossener Kollisionskörper vom Boden bis zur
    // Plattenoberkante. Dadurch kann die Figur nicht unter den Tisch laufen.
    const collisionGeometry = annularSectorGeometry(
      innerRadius,
      outerRadius,
      a0,
      a1,
      height,
      12
    );

    const collision = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collision.name = `COL_tischsegment_${i + 1}`;
    collision.position.y = 0;
    collision.castShadow = false;
    collision.receiveShadow = false;
    table.add(collision);

    // Dunkle Unterkonstruktion, geschlossen bis an die Plattenunterseite.
    const underGeometry = annularSectorGeometry(
      innerRadius + 0.035,
      outerRadius - 0.045,
      a0,
      a1,
      0.09,
      12
    );

    const underframe = new THREE.Mesh(underGeometry, frameMaterial);
    underframe.name = `unterrahmen_segment_${i + 1}`;
    underframe.position.y = topBottom - 0.09;
    underframe.castShadow = true;
    underframe.receiveShadow = true;
    table.add(underframe);

    // Schmaler dunkler Außenrahmen. Er endet bündig an der Plattenoberkante.
    const apronGeometry = annularSectorGeometry(
      outerRadius - 0.065,
      outerRadius,
      a0,
      a1,
      0.13,
      12
    );

    const apron = new THREE.Mesh(apronGeometry, frameMaterial);
    apron.name = `aussenrahmen_segment_${i + 1}`;
    apron.position.y = height - 0.15;
    apron.castShadow = true;
    apron.receiveShadow = true;
    table.add(apron);
  }

  // Schmale bronzene Innenkante, bündig mit der Tischplatte.
  const innerTrimGeometry = annularSectorGeometry(
    innerRadius,
    topInnerRadius,
    arcStart,
    arcStart + arcSpan,
    0.008,
    36
  );

  const innerTrim = new THREE.Mesh(innerTrimGeometry, bronzeMaterial);
  innerTrim.name = 'tischkante_bronze';
  innerTrim.position.y = height - 0.008;
  innerTrim.receiveShadow = true;
  table.add(innerTrim);

  // Eisblaue Leuchtleiste unter der inneren Kante.
  const glowGeometry = annularSectorGeometry(
    innerRadius - 0.007,
    innerRadius + 0.007,
    arcStart,
    arcStart + arcSpan,
    0.012,
    36
  );

  const glowStrip = new THREE.Mesh(glowGeometry, glowMaterial);
  glowStrip.name = 'leuchtlinie_innen';
  glowStrip.position.y = topBottom - 0.022;
  table.add(glowStrip);

  // Acht kräftige Stahlfüße mit geschlossenen Basen.
  const legCount = 8;
  const legGeometry = new THREE.BoxGeometry(0.25, 0.56, 0.37);
  const legs = new THREE.InstancedMesh(legGeometry, frameMaterial, legCount);
  legs.name = 'tischfuesse';
  legs.castShadow = true;
  legs.receiveShadow = true;

  const footGeometry = new THREE.BoxGeometry(0.41, 0.05, 0.51);
  const feet = new THREE.InstancedMesh(footGeometry, frameMaterial, legCount);
  feet.name = 'tischfuss_basen';
  feet.castShadow = true;
  feet.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const legRadius = (outerRadius + innerRadius) * 0.5;

  for (let i = 0; i < legCount; i++) {
    const t = (i + 0.5) / legCount;
    const shapeAngle = THREE.MathUtils.lerp(
      arcStart + THREE.MathUtils.degToRad(15),
      arcStart + arcSpan - THREE.MathUtils.degToRad(15),
      t
    );
    const worldAngle = -shapeAngle;

    dummy.position.set(
      Math.cos(worldAngle) * legRadius,
      0.31,
      Math.sin(worldAngle) * legRadius
    );
    dummy.rotation.set(0, worldAngle + Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    legs.setMatrixAt(i, dummy.matrix);

    dummy.position.set(
      Math.cos(worldAngle) * legRadius,
      0.025,
      Math.sin(worldAngle) * legRadius
    );
    dummy.updateMatrix();
    feet.setMatrixAt(i, dummy.matrix);
  }

  legs.instanceMatrix.needsUpdate = true;
  feet.instanceMatrix.needsUpdate = true;
  table.add(legs);
  table.add(feet);

  // Neun flache Kabeldurchführungen für neun Konferenzplätze.
  const grommetCount = 9;
  const recessGeometry = new THREE.CylinderGeometry(0.071, 0.071, 0.006, 18);
  const recesses = new THREE.InstancedMesh(recessGeometry, recessMaterial, grommetCount);
  recesses.name = 'kabeldurchfuehrungen';
  recesses.receiveShadow = true;

  const ringGeometry = new THREE.TorusGeometry(0.070, 0.0035, 5, 16);
  ringGeometry.rotateX(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringGeometry, bronzeMaterial, grommetCount);
  rings.name = 'kabeldurchfuehrung_bronze';

  const grommetRadius = outerRadius - 0.21;

  for (let i = 0; i < grommetCount; i++) {
    const t = (i + 0.5) / grommetCount;
    const shapeAngle = THREE.MathUtils.lerp(
      arcStart + THREE.MathUtils.degToRad(20),
      arcStart + arcSpan - THREE.MathUtils.degToRad(20),
      t
    );
    const worldAngle = -shapeAngle;
    const x = Math.cos(worldAngle) * grommetRadius;
    const z = Math.sin(worldAngle) * grommetRadius;

    dummy.position.set(x, height - 0.006, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    recesses.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, height - 0.004, z);
    dummy.updateMatrix();
    rings.setMatrixAt(i, dummy.matrix);
  }

  recesses.instanceMatrix.needsUpdate = true;
  rings.instanceMatrix.needsUpdate = true;
  table.add(recesses);
  table.add(rings);

  // Dauerhaftes eisblaues Licht an der offenen Innenseite.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_tisch';
  lamp.position.set(0, 0.55, 1.45);
  lamp.userData = {
    color: '#6fe3ff',
    intensity: 3.2,
    distance: 3.4,
  };

  const pointLight = new THREE.PointLight(0x6fe3ff, 3.2, 3.4, 2);
  lamp.add(pointLight);
  table.add(lamp);

  // --- Oberflächenvarianten
  // Standard ist die silberne Atlantis-Ausführung. Für die Erd-Version nach
  // Woolsey kann direkt "mahagoni" angegeben werden.
  let variante = opts.variante === 'mahagoni' ? 'mahagoni' : 'silber';

  function setVariante(neueVariante) {
    variante = neueVariante === 'mahagoni' ? 'mahagoni' : 'silber';

    if (variante === 'mahagoni') {
      topMaterial.color.setHex(0x351009);
      topMaterial.metalness = 0.08;
      topMaterial.roughness = 0.18;
    } else {
      topMaterial.color.setHex(0xb9c1c5);
      topMaterial.metalness = 0.32;
      topMaterial.roughness = 0.24;
    }

    topMaterial.needsUpdate = true;
  }

  setVariante(variante);

  // --- Sanfte Lichtanimation
  let zeit = 0;
  let letzte = null;
  let glowLevel = 1.15;

  function update(dt) {
    zeit += dt;
    const ziel = 1.05 + Math.sin(zeit * 1.35) * 0.12;
    glowLevel += (ziel - glowLevel) * Math.min(1, dt * 3.5);
    glowMaterial.emissiveIntensity = glowLevel;

    const lightIntensity = 2.9 + glowLevel * 0.22;
    lamp.userData.intensity = lightIntensity;
    pointLight.intensity = lightIntensity;
  }

  visibleSegments[0].onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) update(Math.min(now - letzte, 0.1));
    letzte = now;
  };

  root.userData.update = update;
  root.userData.api = {
    get variante() {
      return variante;
    },
    setVariante,
  };

  // Der Tisch besitzt in der Serie keine eigenständige Bedienfunktion.
  // Er dient als Treffpunkt für Briefing- und Missionsszenen.
  root.userData.actions = [];

  return root;
}

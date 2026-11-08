import * as THREE from 'three';

export const steckbrief = {
  name: 'lounge_sofa',
  art: 'Standobjekt',
  masse: '2,10 × 0,80 × 0,85 m (B × T × H), Sitzhöhe 0,42 m',
  wohin: 'Kantine, Aufenthaltsräume, Wartebereiche',
  benutzen: 'INT_sitzen zum Hinsetzen',
  lichter: 'keine',
  animation: 'keine',
  quelle: 'selbst gebaut',
};

export function create() {
  const root = new THREE.Group();
  root.name = 'lounge_sofa';

  // Maße: Breite X = 2,10 m, Tiefe Z = 0,80 m, Höhe Y = 0,85 m.
  // Sitzseite zeigt nach +Z. Ursprung: Mitte der Unterseite.

  const fabric = new THREE.MeshStandardMaterial({
    name: 'sofa_beige_stoff',
    color: 0xd6c8b2,
    metalness: 0.0,
    roughness: 0.9,
  });

  const fabricDark = new THREE.MeshStandardMaterial({
    name: 'sofa_beige_naehte',
    color: 0xa99b87,
    metalness: 0.0,
    roughness: 0.94,
  });

  const wood = new THREE.MeshStandardMaterial({
    name: 'sofa_fuesse_dunkelbraun',
    color: 0x281b16,
    metalness: 0.0,
    roughness: 0.62,
  });

  // Erzeugt einen geschlossenen, leicht abgerundeten Quader.
  // Profil liegt in XY, die Extrusion verläuft entlang Z.
  function roundedCuboid(width, height, depth, radius = 0.035, bevel = 0.012) {
    const b = Math.min(bevel, width * 0.2, height * 0.2, depth * 0.2);
    const w = width - b * 2;
    const h = height - b * 2;
    const r = Math.max(0.001, Math.min(radius - b, w * 0.45, h * 0.45));

    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - b * 2,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelOffset: 0,
      bevelSegments: 1,
      curveSegments: 2,
      steps: 1,
    });

    // Auf exakt gewünschte Abmessungen normieren.
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    geometry.scale(width / size.x, height / size.y, depth / size.z);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeVertexNormals();

    return geometry;
  }

  // Abgerundetes Sitzkissen: Profilfläche wird nach dem Drehen zur X/Z-Fläche.
  function seatGeometry(width, depth, height) {
    const geometry = roundedCuboid(width, depth, height, 0.055, 0.015);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    geometry.scale(width / size.x, height / size.y, depth / size.z);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeVertexNormals();
    return geometry;
  }

  // Unterer Sockel, exakt zwischen den Füßen und dem Sitzkissen.
  const base = new THREE.Mesh(
    roundedCuboid(2.10, 0.17, 0.78, 0.025, 0.012),
    fabricDark
  );
  base.name = 'Sofa_Sockel';
  base.position.set(0, 0.205, 0);
  root.add(base);

  // Vier kurze, dunkle Füße.
  const footGeometry = new THREE.BoxGeometry(0.11, 0.12, 0.11);
  const footPositions = [
    [-0.87, 0.06, -0.27],
    [0.87, 0.06, -0.27],
    [-0.87, 0.06, 0.27],
    [0.87, 0.06, 0.27],
  ];

  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeometry, wood);
    foot.name = 'Sofa_Fuss';
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // Rückenrahmen reicht bis zur Rückseite bei z = -0,40 m.
  const backFrame = new THREE.Mesh(
    roundedCuboid(2.10, 0.58, 0.12, 0.035, 0.012),
    fabric
  );
  backFrame.name = 'Sofa_Rueckenrahmen';
  backFrame.position.set(0, 0.56, -0.34);
  root.add(backFrame);

  // Breite, flache Armlehnen mit leicht abgerundeten Kanten.
  const armGeometry = roundedCuboid(0.16, 0.36, 0.80, 0.045, 0.018);
  for (const x of [-0.97, 0.97]) {
    const arm = new THREE.Mesh(armGeometry, fabric);
    arm.name = 'Sofa_Armlehne';
    arm.position.set(x, 0.47, 0);
    root.add(arm);
  }

  // Drei Sitzkissen. Oberkante bei y = 0,42 m.
  const sharedSeatGeometry = seatGeometry(0.565, 0.66, 0.13);
  const seamGeometry = new THREE.BoxGeometry(0.50, 0.010, 0.010);

  for (let i = 0; i < 3; i++) {
    const seat = new THREE.Mesh(sharedSeatGeometry, fabric);
    seat.name = `Sofa_Sitzkissen_${i + 1}`;
    seat.position.set((i - 1) * 0.585, 0.355, 0.045);
    root.add(seat);

    // Dezente Naht an der vorderen Kissenkante.
    const seam = new THREE.Mesh(seamGeometry, fabricDark);
    seam.name = `Sofa_Sitznaht_${i + 1}`;
    seam.position.set(0, 0, 0.331);
    seat.add(seam);
  }

  // Drei Rückenkissen, leicht nach hinten geneigt.
  const backCushionGeometry = roundedCuboid(0.565, 0.38, 0.14, 0.05, 0.015);

  for (let i = 0; i < 3; i++) {
    const cushion = new THREE.Mesh(backCushionGeometry, fabric);
    cushion.name = `Sofa_Rueckenkissen_${i + 1}`;
    cushion.position.set((i - 1) * 0.585, 0.605, -0.245);
    cushion.rotation.x = -0.055;
    root.add(cushion);

    const seam = new THREE.Mesh(seamGeometry, fabricDark);
    seam.name = `Sofa_Rueckennaht_${i + 1}`;
    seam.position.set(0, -0.12, 0.071);
    cushion.add(seam);
  }

  // Unsichtbarer Kollisionskörper für das gesamte Sofa.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(2.10, 0.85, 0.80),
    new THREE.MeshBasicMaterial()
  );
  col.name = 'COL_sofa';
  col.position.set(0, 0.425, 0);
  col.userData.aktiv = true;
  root.add(col);

  // Benutzen-Punkt vor der Sitzseite in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_sitzen';
  use.position.set(0, 0.55, 0.64);
  use.userData = {
    label: 'Sofa: hinsetzen',
    radius: 0.8,
  };
  root.add(use);

  // Keine Funktionen und keine Animation für dieses reine Sitzobjekt.
  root.userData.api = {};
  root.userData.actions = [];

  return root;
}

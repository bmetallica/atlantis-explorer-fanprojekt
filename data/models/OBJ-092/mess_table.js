// mess_table.js
// Kantinentisch der Expedition: schlichtes irdisches Mobiliar.
// Standobjekt, Ursprung: Mitte der Unterseite, Tischhöhe 0,75 m.
import * as THREE from 'three';

export const steckbrief = {
  name: 'mess_table',
  art: 'Standobjekt',
  masse: '1,50 × 0,75 × 0,75 (B × H × T, m)',
  wohin: 'Essensraum / Kantine',
  benutzen: 'Keine Benutzen-Funktion; Tassen und Teller können abgelegt werden.',
  lichter: 'Keine',
  animation: 'Keine',
  quelle: 'selbst gebaut nach OBJ-092',
};

function roundedRectangleShape(width, depth, radius) {
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(radius, w, d);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);
  shape.closePath();
  return shape;
}

function roundedPlate(width, depth, radius, thickness, bevel) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectangleShape(width, depth, radius),
    {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 8,
    },
  );

  // Die Extrusion liegt zunächst entlang +Z; nach der Drehung entlang +Y.
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function create() {
  const root = new THREE.Group();
  root.name = 'mess_table';

  // --- Materialien
  const laminateMaterial = new THREE.MeshStandardMaterial({
    name: 'laminat_hellgrau',
    color: 0xc7c9c8,
    metalness: 0.02,
    roughness: 0.8,
  });

  const edgeMaterial = new THREE.MeshStandardMaterial({
    name: 'kantenleiste_dunkel',
    color: 0x282b2e,
    metalness: 0.08,
    roughness: 0.72,
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    name: 'gestell_schwarz_anthrazit',
    color: 0x17191c,
    metalness: 0.6,
    roughness: 0.45,
  });

  const glideMaterial = new THREE.MeshStandardMaterial({
    name: 'kunststoffgleiter',
    color: 0x101214,
    metalness: 0,
    roughness: 0.95,
  });

  // --- Tischplatte
  // Die dunkle Kantenleiste bildet einen geschlossenen, leicht breiteren
  // Plattenrahmen. Die hellgraue Laminatfläche sitzt leicht eingerückt
  // darin und bildet die Oberfläche.
  const edge = new THREE.Mesh(
    roundedPlate(1.50, 0.75, 0.055, 0.030, 0.0015),
    edgeMaterial,
  );
  edge.name = 'tischplatte_kantenleiste';
  edge.position.y = 0.705;
  root.add(edge);

  const top = new THREE.Mesh(
    roundedPlate(1.48, 0.73, 0.047, 0.027, 0.003),
    laminateMaterial,
  );
  top.name = 'tischplatte_laminat';
  top.position.y = 0.720;
  root.add(top);

  // --- Gestell
  const legRadius = 0.015;
  const legBottom = 0.012;
  const legTop = 0.705;
  const legHeight = legTop - legBottom;

  const legPositions = [
    [-0.66, -0.27],
    [0.66, -0.27],
    [-0.66, 0.27],
    [0.66, 0.27],
  ];

  for (const [x, z] of legPositions) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 12),
      metalMaterial,
    );
    leg.name = 'bein_rundrohr';
    leg.position.set(x, legBottom + legHeight / 2, z);
    root.add(leg);

    const glide = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12),
      glideMaterial,
    );
    glide.name = 'kunststoffgleiter';
    glide.position.set(x, 0.006, z);
    root.add(glide);
  }

  // --- Querstreben unter der Platte
  const braceY = 0.665;

  // Längsstreben entlang X.
  for (const z of [-0.27, 0.27]) {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.024, 0.024),
      metalMaterial,
    );
    brace.name = 'querstrebe_quer';
    brace.position.set(0, braceY, z);
    root.add(brace);
  }

  // Seitliche Streben entlang Z.
  for (const x of [-0.66, 0.66]) {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.024, 0.54),
      metalMaterial,
    );
    brace.name = 'querstrebe_seite';
    brace.position.set(x, braceY, 0);
    root.add(brace);
  }

  // --- Kollisionskörper
  // Box vom Boden bis zur Plattenoberkante. Das Mesh bleibt für das
  // Spiel unsichtbar; seine Sichtbarkeit wird nicht animiert.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(1.50, 0.75, 0.75),
    new THREE.MeshBasicMaterial({
      name: 'kollision_unsichtbar',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  col.name = 'COL_tisch';
  col.position.set(0, 0.375, 0);
  col.userData.aktiv = true;
  root.add(col);

  // Keine Benutzen-Punkte, Lichter, Animationen oder Aktionen erforderlich.
  root.userData.api = {};
  root.userData.actions = [];

  return root;
}

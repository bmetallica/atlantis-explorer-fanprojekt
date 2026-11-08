import * as THREE from 'three';

const kit = (name) => new THREE.MeshStandardMaterial({ name: `KIT_${name}` });

export const steckbrief = {
  name: 'city_tower_round',
  art: 'Stadt-Außenmodul (statisch)',
  masse: 'Ø ca. 22 m × 70 m (B × H, m)',
  wohin: 'Freie Stadt-Außenflächen, Stadtplätze, Terrassen und erhöhte Außenbereiche',
  benutzen: 'Keine Benutzen-Punkte; statisches Architekturmodul',
  lichter: 'Keine LAMP-Lichtquellen; einzelne eisblaue Leuchtfenster über KIT_glow',
  animation: 'Keine Animation',
  quelle: 'selbst gebaut',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'city_tower_round';

  const matHull = kit('hull');
  const matWall = kit('wall');
  const matDark = kit('wallDark');
  const matCopper = kit('copper');
  const matGlass = kit('glass');
  const matGlow = kit('glow');

  const segmente = 14;
  const finAnzahl = 5;
  const bodyRadius = 9.15;
  const dummy = new THREE.Object3D();

  // --- Geschlossenes Fundament: tiefster Punkt liegt exakt auf y = 0
  const fundament = new THREE.Mesh(
    new THREE.CylinderGeometry(10.8, 10.8, 0.8, segmente),
    matDark
  );
  fundament.position.y = 0.4;
  root.add(fundament);

  const fundamentRing = new THREE.Mesh(
    new THREE.CylinderGeometry(10.5, 10.72, 0.22, segmente),
    matCopper
  );
  fundamentRing.position.y = 0.91;
  root.add(fundamentRing);

  const sockel = new THREE.Mesh(
    new THREE.CylinderGeometry(9.82, 10.32, 1.15, segmente),
    matWall
  );
  sockel.position.y = 1.595;
  root.add(sockel);

  const sockelKante = new THREE.Mesh(
    new THREE.CylinderGeometry(9.58, 9.58, 0.22, segmente),
    matCopper
  );
  sockelKante.position.y = 2.28;
  root.add(sockelKante);

  // --- Geschlossener, leicht konischer Hauptschacht
  const schaft = new THREE.Mesh(
    new THREE.CylinderGeometry(9.15, 9.48, 57.0, segmente),
    matHull
  );
  schaft.position.y = 30.75;
  root.add(schaft);

  // --- Breite, dunkle Glasbänder; geschlossene Geometrie
  const glasBands = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(9.24, 9.24, 2.3, segmente),
    matGlass,
    6
  );

  const bandHoehen = [9.0, 18.0, 27.0, 36.0, 45.0, 54.0];

  for (let i = 0; i < bandHoehen.length; i++) {
    dummy.position.set(0, bandHoehen[i], 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    glasBands.setMatrixAt(i, dummy.matrix);
  }
  glasBands.instanceMatrix.needsUpdate = true;
  root.add(glasBands);

  // --- Bronzefarbene Querkanten unter und über jedem Glasband
  const bandKanten = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(9.29, 9.29, 0.16, segmente),
    matCopper,
    bandHoehen.length * 2
  );

  let kantenIndex = 0;
  for (const y of bandHoehen) {
    for (const dy of [-1.22, 1.22]) {
      dummy.position.set(0, y + dy, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bandKanten.setMatrixAt(kantenIndex++, dummy.matrix);
    }
  }
  bandKanten.instanceMatrix.needsUpdate = true;
  root.add(bandKanten);

  // --- Vertikale Fassadenrippen nur zwischen den Glasbändern
  const rippen = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.18, 1, 0.42),
    matDark,
    segmente * 6
  );

  const rippenAbschnitte = [
    { unten: 10.15, oben: 16.85 },
    { unten: 19.15, oben: 25.85 },
    { unten: 28.15, oben: 34.85 },
    { unten: 37.15, oben: 43.85 },
    { unten: 46.15, oben: 52.85 },
    { unten: 55.15, oben: 59.25 }
  ];

  const flächenRadius = bodyRadius * Math.cos(Math.PI / segmente);
  let rippenIndex = 0;

  for (const abschnitt of rippenAbschnitte) {
    const hoehe = abschnitt.oben - abschnitt.unten;
    const mitte = (abschnitt.unten + abschnitt.oben) * 0.5;

    for (let i = 0; i < segmente; i++) {
      const winkel = (i + 0.5) * (Math.PI * 2 / segmente);

      dummy.position.set(
        Math.sin(winkel) * (flächenRadius + 0.05),
        mitte,
        Math.cos(winkel) * (flächenRadius + 0.05)
      );
      dummy.rotation.set(0, winkel, 0);
      dummy.scale.set(1, hoehe, 1);
      dummy.updateMatrix();
      rippen.setMatrixAt(rippenIndex++, dummy.matrix);
    }
  }
  rippen.instanceMatrix.needsUpdate = true;
  root.add(rippen);

  // --- Fünf markante, geschlossene Klingen-Finnen
  // Das Profil liegt radial in X/Y; die Extrusion verleiht tangentiale Breite.
  const finForm = new THREE.Shape();
  finForm.moveTo(8.95, 1.55);
  finForm.lineTo(11.0, 3.05);
  finForm.lineTo(10.46, 56.8);
  finForm.lineTo(9.52, 65.0);
  finForm.lineTo(8.95, 60.9);
  finForm.closePath();

  const finGeometrie = new THREE.ExtrudeGeometry(finForm, {
    depth: 2.2,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.09,
    bevelSegments: 1,
    curveSegments: 1
  });
  finGeometrie.translate(0, 0, -1.1);

  const finnen = new THREE.InstancedMesh(finGeometrie, matWall, finAnzahl);

  // Dunkle, bündig eingelassene Seitenstreifen machen die Klingen lesbar.
  const finStreifen = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.72, 45.0, 0.045),
    matDark,
    finAnzahl
  );

  for (let i = 0; i < finAnzahl; i++) {
    const winkel = (i / finAnzahl) * Math.PI * 2 + Math.PI / 10;

    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, winkel, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    finnen.setMatrixAt(i, dummy.matrix);

    dummy.position.set(9.78, 29.0, 1.115);
    dummy.rotation.set(0, winkel, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    finStreifen.setMatrixAt(i, dummy.matrix);
  }

  finnen.instanceMatrix.needsUpdate = true;
  finStreifen.instanceMatrix.needsUpdate = true;
  root.add(finnen);
  root.add(finStreifen);

  // --- Sparsame einzelne Leuchtfenster auf den Glasbändern
  const leuchtFenster = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.15, 0.5, 0.07),
    matGlow,
    9
  );

  const leuchtReihen = [9.0, 27.0, 45.0];
  const leuchtWinkel = [0.08, 1.18, 2.28, 0.62, 1.72, 2.82, 0.32, 1.42, 2.52];

  for (let i = 0; i < leuchtFenster.count; i++) {
    const reihe = Math.floor(i / 3);
    const winkel = leuchtWinkel[i];

    dummy.position.set(
      Math.sin(winkel) * 9.285,
      leuchtReihen[reihe],
      Math.cos(winkel) * 9.285
    );
    dummy.rotation.set(0, winkel, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    leuchtFenster.setMatrixAt(i, dummy.matrix);
  }
  leuchtFenster.instanceMatrix.needsUpdate = true;
  root.add(leuchtFenster);

  // --- Abgeschrägte, facettierte Kronenkappe
  const kronenRing = new THREE.Mesh(
    new THREE.CylinderGeometry(9.38, 9.38, 0.32, segmente),
    matCopper
  );
  kronenRing.position.y = 59.35;
  root.add(kronenRing);

  const krone = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 9.32, 7.0, segmente),
    matHull
  );
  krone.position.y = 63.0;
  root.add(krone);

  const kronenSchulter = new THREE.Mesh(
    new THREE.CylinderGeometry(2.58, 2.58, 0.24, segmente),
    matDark
  );
  kronenSchulter.position.y = 66.42;
  root.add(kronenSchulter);

  // --- Geschlossene metallische Spitze; Gesamthöhe genau 70 m
  const spitze = new THREE.Mesh(
    new THREE.ConeGeometry(2.08, 3.34, segmente),
    matWall
  );
  spitze.position.y = 68.33;
  root.add(spitze);

  const spitzenKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.16, 0.72, 8),
    matCopper
  );
  spitzenKern.position.y = 69.64;
  root.add(spitzenKern);

  // --- Genau ein grober Kollisionskörper
  const col = new THREE.Mesh(new THREE.BoxGeometry(22.2, 70, 22.2));
  col.name = 'COL_turm';
  col.position.y = 35;
  root.add(col);

  return root;
}

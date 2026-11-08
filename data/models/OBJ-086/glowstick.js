// Chemische Knicklichter / Notleuchtstäbe – Kleinobjekt, ca. 0,15 m lang.
import * as THREE from 'three';

export const steckbrief = {
  name: 'glowstick',
  art: 'Kleinobjekt',
  masse: '0,15 m lang; Rohrdurchmesser 0,015 m',
  wohin: 'ATL-030 (Waffenkammer), ATL-035 (Gefahrstofflager)',
  benutzen: 'INT_knicken → Stab knicken und grünes Notlicht aktivieren',
  lichter: 'LAMP_chemie (grün; Verbrauchslichtquelle, erst nach dem Knicken aktiv)',
  animation: 'Oberer Stababschnitt knickt weich zur Seite; Leuchtstoff hellt sanft auf, pulsiert leicht und verliert nach 8 Stunden Leuchtkraft',
  quelle: 'selbst gebaut'
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'glowstick';

  const leuchtfarbe = Number.isFinite(opts.farbe) ? opts.farbe : 0x39ff64;
  const farbe = new THREE.Color(leuchtfarbe);
  const farbHex = farbe.getHexString();

  // Farbe sättigen, damit die Emission nicht durch Tone Mapping weißlich wirkt.
  const maximum = Math.max(farbe.r, farbe.g, farbe.b, 0.0001);
  const emissiveColor = new THREE.Color(
    farbe.r / maximum > 0.95 ? 1 : (farbe.r / maximum) * 0.22,
    farbe.g / maximum > 0.95 ? 1 : (farbe.g / maximum) * 0.22,
    farbe.b / maximum > 0.95 ? 1 : (farbe.b / maximum) * 0.22
  );

  const inactiveShellColor = farbe.clone().lerp(new THREE.Color(0xdce8df), 0.82);
  const activeShellColor = emissiveColor.clone().multiplyScalar(0.55);
  const inactiveCoreColor = new THREE.Color(0xe6f5e8);
  const activeCoreColor = farbe.clone();

  const aussenMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_huelle',
    color: inactiveShellColor,
    emissive: emissiveColor,
    emissiveIntensity: 0.015,
    metalness: 0,
    roughness: 0.38,
    transparent: true,
    opacity: 0.76,
    depthWrite: false
  });

  const kernMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_leuchtstoff',
    color: inactiveCoreColor,
    emissive: emissiveColor,
    emissiveIntensity: 0.02,
    metalness: 0,
    roughness: 0.28,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const knickMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_knickmanschette',
    color: 0x8da8a3,
    emissive: emissiveColor,
    emissiveIntensity: 0.01,
    metalness: 0.08,
    roughness: 0.44
  });

  const metallMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_oesenmaterial',
    color: 0xb9c5c8,
    metalness: 0.68,
    roughness: 0.3
  });

  const kunststoffMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_oesenkunststoff',
    color: 0x263b42,
    metalness: 0.05,
    roughness: 0.48
  });

  // Banderole mit Expeditionsaufdruck.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e5eadf';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#17323d';
  ctx.fillRect(0, 0, 512, 12);
  ctx.fillRect(0, 116, 512, 12);
  ctx.fillStyle = '#1d7047';
  ctx.fillRect(18, 44, 22, 40);
  ctx.fillRect(472, 44, 22, 40);
  ctx.fillStyle = '#19323b';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHEM LIGHT · EXPEDITION', 256, 62);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#46606a';
  ctx.fillText('CML-6', 256, 94);

  const bandTexture = new THREE.CanvasTexture(canvas);
  bandTexture.colorSpace = THREE.SRGBColorSpace;
  bandTexture.anisotropy = 4;

  const bandMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_banderole',
    map: bandTexture,
    color: 0xffffff,
    metalness: 0.02,
    roughness: 0.62
  });

  // Kleines, eindeutig nach +Z ausgerichtetes Frontetikett.
  const stickerCanvas = document.createElement('canvas');
  stickerCanvas.width = 512;
  stickerCanvas.height = 256;
  const stickerCtx = stickerCanvas.getContext('2d');

  stickerCtx.fillStyle = '#edf0e6';
  stickerCtx.fillRect(0, 0, 512, 256);
  stickerCtx.fillStyle = '#17323d';
  stickerCtx.fillRect(0, 0, 512, 38);
  stickerCtx.fillStyle = '#e5eadf';
  stickerCtx.font = 'bold 25px sans-serif';
  stickerCtx.textAlign = 'left';
  stickerCtx.textBaseline = 'middle';
  stickerCtx.fillText('ATL CHEMICAL LIGHT', 18, 20);
  stickerCtx.fillStyle = '#209b52';
  stickerCtx.fillRect(18, 58, 42, 70);
  stickerCtx.fillStyle = '#19323b';
  stickerCtx.font = 'bold 48px sans-serif';
  stickerCtx.fillText('CML-6', 80, 78);
  stickerCtx.font = 'bold 27px sans-serif';
  stickerCtx.fillText('GREEN · 8 HOURS', 80, 125);
  stickerCtx.font = '22px sans-serif';
  stickerCtx.fillStyle = '#42606a';
  stickerCtx.fillText('SNAP / SHAKE / USE', 80, 173);
  stickerCtx.fillText('NON-HEAT · NON-ELECTRIC', 80, 209);

  const stickerTexture = new THREE.CanvasTexture(stickerCanvas);
  stickerTexture.colorSpace = THREE.SRGBColorSpace;
  stickerTexture.anisotropy = 4;

  const stickerMaterial = new THREE.MeshStandardMaterial({
    name: 'chemielicht_frontetikett',
    map: stickerTexture,
    color: 0xffffff,
    metalness: 0.02,
    roughness: 0.58
  });

  // Unterer, senkrechter Stababschnitt.
  const untererRohr = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0075, 0.0075, 0.0585, 24),
    aussenMaterial
  );
  untererRohr.position.y = 0.03675;
  untererRohr.castShadow = true;
  root.add(untererRohr);

  const untererKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.00535, 0.00535, 0.0555, 16),
    kernMaterial
  );
  untererKern.position.y = 0.03525;
  root.add(untererKern);

  // Abgerundetes, geschlossenes unteres Ende; tiefster Punkt liegt exakt bei y = 0.
  const bodenKappe = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 18, 12),
    aussenMaterial
  );
  bodenKappe.position.y = 0.00585;
  bodenKappe.scale.y = 0.78;
  bodenKappe.castShadow = true;
  root.add(bodenKappe);

  // Geschlossene Knickstelle mit dunkler Manschette.
  const knickstelle = new THREE.Mesh(
    new THREE.SphereGeometry(0.00765, 18, 12),
    aussenMaterial
  );
  knickstelle.position.y = 0.066;
  knickstelle.castShadow = true;
  root.add(knickstelle);

  const knickmanschette = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0079, 0.0079, 0.0045, 24),
    knickMaterial
  );
  knickmanschette.position.y = 0.0638;
  root.add(knickmanschette);

  // Banderole um den unteren Stababschnitt.
  const banderole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.00805, 0.00805, 0.015, 24),
    bandMaterial
  );
  banderole.position.y = 0.0225;
  banderole.castShadow = true;
  root.add(banderole);

  const frontetikett = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.007, 0.0004),
    stickerMaterial
  );
  frontetikett.position.set(0, 0.0225, 0.00828);
  root.add(frontetikett);

  // Oberer Teil dreht sich beim Knicken um die sichtbare Knickstelle.
  const obererTeil = new THREE.Group();
  obererTeil.name = 'knickbarer_oberteil';
  obererTeil.position.y = 0.066;
  root.add(obererTeil);

  const obererRohr = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0075, 0.0075, 0.0585, 24),
    aussenMaterial
  );
  obererRohr.position.y = 0.02925;
  obererRohr.castShadow = true;
  obererTeil.add(obererRohr);

  const obererKern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.00535, 0.00535, 0.0555, 16),
    kernMaterial
  );
  obererKern.position.y = 0.03075;
  obererTeil.add(obererKern);

  const kopfKappe = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 18, 12),
    aussenMaterial
  );
  kopfKappe.position.y = 0.0585;
  kopfKappe.scale.y = 0.78;
  kopfKappe.castShadow = true;
  obererTeil.add(kopfKappe);

  // Metallöse mit Kunststoffhalterung; Achse zeigt nach Z.
  const oeseHalter = new THREE.Mesh(
    new THREE.TorusGeometry(0.0048, 0.0012, 8, 20),
    metallMaterial
  );
  oeseHalter.position.y = 0.0635;
  oeseHalter.castShadow = true;
  obererTeil.add(oeseHalter);

  const oese = new THREE.Mesh(
    new THREE.TorusGeometry(0.0076, 0.0019, 10, 28),
    kunststoffMaterial
  );
  oese.position.y = 0.074;
  oese.castShadow = true;
  obererTeil.add(oese);

  // Benutzen-Punkt knapp vor dem Stab, in Griffhöhe.
  const use = new THREE.Object3D();
  use.name = 'INT_knicken';
  use.position.set(0, 0.105, 0.055);
  use.userData = {
    label: 'Knicklicht knicken',
    radius: 0.65
  };
  root.add(use);

  // Verbrauchs-Lichtquelle: vor dem Knicken aus, danach weich einschaltend.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_chemie';
  lamp.position.set(0, 0.077, 0.012);
  lamp.userData = {
    color: `#${farbHex}`,
    intensity: 0,
    distance: 1.8
  };
  root.add(lamp);

  const leuchtdauer = 8 * 60 * 60;
  let aktiv = false;
  let verbraucht = false;
  let restlaufzeit = leuchtdauer;
  let aufhellung = 0;
  let zeit = 0;
  let letzteZeit = null;

  function update(dt) {
    const schritt = Math.min(Math.max(dt, 0), 0.1);
    zeit += schritt;

    if (aktiv) {
      restlaufzeit = Math.max(0, restlaufzeit - schritt);
      if (restlaufzeit <= 0) {
        aktiv = false;
        verbraucht = true;
      }
    }

    // In den letzten zwanzig Minuten wird das Licht weich schwächer.
    const restFaktor = aktiv
      ? Math.min(1, restlaufzeit / (20 * 60))
      : 0;

    aufhellung += ((aktiv ? 1 : 0) - aufhellung) * Math.min(1, schritt * 7);

    const puls = 0.97 + Math.sin(zeit * 2.1) * 0.03;

    aussenMaterial.color.copy(inactiveShellColor).lerp(activeShellColor, aufhellung);
    kernMaterial.color.copy(inactiveCoreColor).lerp(activeCoreColor, aufhellung);
    knickMaterial.emissiveIntensity = aufhellung * 0.35;

    aussenMaterial.emissiveIntensity = aktiv
      ? aufhellung * (0.9 + 0.55 * restFaktor) * puls
      : 0.015;

    kernMaterial.emissiveIntensity = aktiv
      ? aufhellung * (1.2 + 0.7 * restFaktor) * puls
      : 0.02;

    // Weiches Auseinanderknicken der beiden Stabhälften.
    const knickWinkel = aktiv ? 0.46 : 0;
    obererTeil.rotation.z +=
      (knickWinkel - obererTeil.rotation.z) * Math.min(1, schritt * 8);

    lamp.userData.intensity = aktiv
      ? aufhellung * 7.5 * restFaktor * puls
      : 0;
    lamp.userData.distance = 1.8;
  }

  untererRohr.onBeforeRender = () => {
    const now = performance.now() * 0.001;
    if (letzteZeit !== null) {
      update(now - letzteZeit);
    }
    letzteZeit = now;
  };

  const api = {
    knicken() {
      if (aktiv || verbraucht) return false;
      aktiv = true;
      restlaufzeit = leuchtdauer;
      return true;
    },
    get aktiv() {
      return aktiv;
    },
    get verbraucht() {
      return verbraucht;
    },
    get restlaufzeit() {
      return restlaufzeit;
    },
    get leuchtet() {
      return aktiv && restlaufzeit > 0;
    },
    get farbe() {
      return `#${farbHex}`;
    }
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'knicken',
      label: 'Knicken und grünes Notlicht aktivieren',
      run: () => api.knicken()
    }
  ];

  return root;
}

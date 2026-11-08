import * as THREE from 'three';

export const steckbrief = {
  name: 'wall_sconce',
  art: 'Wandobjekt',
  masse: 'ca. 1,8 kg',
  wohin: 'Wände in Flur, Kontrollraum, Wohnbereich, Lesezimmer und Plaza',
  benutzen: 'INT_wandleuchte → Ein/Aus-Menü',
  lichter: 'LAMP_licht (warmweiß bis hellgelb)',
  animation: 'Leuchteinsatz und Punktlicht werden weich ein- und ausgeblendet; warme Helligkeitsmodulation',
  quelle: 'selbst gebaut nach OBJ-053',
};

export function create(opts = {}) {
  const root = new THREE.Group();
  root.name = 'wall_sconce';

  // Feine, gerichtete Struktur für gebürstetes Dunkelsilber.
  const pinselCanvas = document.createElement('canvas');
  pinselCanvas.width = 128;
  pinselCanvas.height = 128;
  const pinselCtx = pinselCanvas.getContext('2d');
  const bild = pinselCtx.createImageData(128, 128);

  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const streifen =
        Math.sin(y * 1.73) * 7 +
        Math.sin(y * 0.31) * 4;
      const korn =
        Math.sin(x * 12.9898 + y * 78.233) * 4;
      const wert = Math.max(112, Math.min(194, 158 + streifen + korn));

      bild.data[i] = wert;
      bild.data[i + 1] = wert;
      bild.data[i + 2] = wert;
      bild.data[i + 3] = 255;
    }
  }

  pinselCtx.putImageData(bild, 0, 0);

  const metallTextur = new THREE.CanvasTexture(pinselCanvas);
  metallTextur.colorSpace = THREE.SRGBColorSpace;
  metallTextur.wrapS = THREE.RepeatWrapping;
  metallTextur.wrapT = THREE.RepeatWrapping;
  metallTextur.repeat.set(2, 2);

  const metall = new THREE.MeshStandardMaterial({
    name: 'wandleuchte_gebuerstet',
    color: 0x9aa2a8,
    // Textur zu dunkel – ohne map heller, gebürsteter Eindruck über roughness
    metalness: 0.6,
    roughness: 0.38,
  });

  const metallDunkel = new THREE.MeshStandardMaterial({
    name: 'wandleuchte_metall_dunkel',
    color: 0x252b2e,
    map: metallTextur,
    metalness: 0.72,
    roughness: 0.58,
  });

  const bronze = new THREE.MeshStandardMaterial({
    name: 'wandleuchte_bronze',
    color: 0x735436,
    metalness: 0.8,
    roughness: 0.38,
  });

  const glasOben = new THREE.MeshStandardMaterial({
    name: 'wandleuchte_glas_oben',
    color: 0x20272a,
    metalness: 0.08,
    roughness: 0.52,
  });

  const leuchtglas = new THREE.MeshStandardMaterial({
    name: 'wandleuchte_leuchtglas',
    color: 0xffedbd,
    emissive: 0xffcb70,
    emissiveIntensity: 1.4,
    metalness: 0.02,
    roughness: 0.24,
  });

  // Schmaler Wandsockel. Die Rückseite liegt exakt bei z = 0.
  const sockel = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.176, 0.018),
    metall
  );
  sockel.name = 'sockel';
  sockel.position.set(0, 0.088, 0.009);
  root.add(sockel);

  const sockelKante = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.014, 0.024),
    metallDunkel
  );
  sockelKante.name = 'sockelkante';
  sockelKante.position.set(0, 0.177, 0.012);
  root.add(sockelKante);

  // Dezente bronzefarbene Befestigungspunkte am Sockel.
  for (const x of [-0.021, 0.021]) {
    const niete = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12),
      bronze
    );
    niete.name = 'sockel_niete';
    niete.rotation.x = Math.PI / 2;
    niete.position.set(x, 0.153, 0.021);
    root.add(niete);
  }

  // Kurzer, geschlossener Ausleger zwischen Sockel und Schale.
  const ausleger = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.024, 0.052, 16),
    metallDunkel
  );
  ausleger.name = 'ausleger';
  ausleger.rotation.x = Math.PI / 2;
  ausleger.position.set(0, 0.112, 0.035);
  root.add(ausleger);

  const kolben = new THREE.Mesh(
    new THREE.CylinderGeometry(0.031, 0.031, 0.014, 20),
    metall
  );
  kolben.name = 'schale_kolben';
  kolben.rotation.x = Math.PI / 2;
  kolben.position.set(0, 0.112, 0.024);
  root.add(kolben);

  // Schale und Einsatz sind leicht nach vorn und unten geneigt.
  const schaleGruppe = new THREE.Group();
  schaleGruppe.name = 'schale_gruppe';
  schaleGruppe.position.set(0, 0.112, 0.019);
  schaleGruppe.rotation.x = 0.14;
  root.add(schaleGruppe);

  // Geschlossener Rotationskörper: gewölbte Metallschale mit
  // geschlossener, leicht zurückgesetzter Frontfläche.
  const profil = [];
  const radius = 0.1;
  const tiefe = 0.1;
  const profilSchritte = 16;

  for (let i = 0; i <= profilSchritte; i++) {
    const winkel = (i / profilSchritte) * (Math.PI / 2);
    profil.push(
      new THREE.Vector2(
        radius * Math.sin(winkel),
        tiefe * (1 - Math.cos(winkel))
      )
    );
  }

  profil.push(new THREE.Vector2(0.086, 0.104));
  profil.push(new THREE.Vector2(0, 0.104));

  const schalenGeometrie = new THREE.LatheGeometry(profil, 32);
  schalenGeometrie.rotateX(Math.PI / 2);

  const schale = new THREE.Mesh(schalenGeometrie, metall);
  schale.name = 'schale';
  schaleGruppe.add(schale);

  // Geschlossene dunkle Grundfläche hinter dem Leuchteinsatz.
  const frontflaeche = new THREE.Mesh(
    new THREE.CylinderGeometry(0.084, 0.084, 0.004, 32),
    metallDunkel
  );
  frontflaeche.name = 'frontflaeche';
  frontflaeche.rotation.x = Math.PI / 2;
  frontflaeche.position.z = 0.104;
  schaleGruppe.add(frontflaeche);

  // Geschlossener dunkler oberer Glas-/Metallbereich.
  const glasOberhalb = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.081,
      0.081,
      0.005,
      20,
      1,
      false,
      Math.PI / 2,
      Math.PI
    ),
    glasOben
  );
  glasOberhalb.name = 'glas_oberhalb';
  glasOberhalb.rotation.x = Math.PI / 2;
  glasOberhalb.position.z = 0.106;
  schaleGruppe.add(glasOberhalb);

  // Geschlossene, leicht erhabene untere Halbscheibe.
  const einsatz = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.081,
      0.081,
      0.006,
      20,
      1,
      false,
      -Math.PI / 2,
      Math.PI
    ),
    leuchtglas
  );
  einsatz.name = 'leuchteinsatz';
  einsatz.rotation.x = Math.PI / 2;
  einsatz.position.z = 0.107;
  schaleGruppe.add(einsatz);

  // Schmaler dunkler Rand um die Öffnung.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.084, 0.0055, 8, 32),
    metallDunkel
  );
  ring.name = 'oeffnungsrand';
  ring.position.z = 0.107;
  schaleGruppe.add(ring);

  // Dezente bronzefarbene Trennlinie zwischen Einsatz und Visor.
  const trennlinie = new THREE.Mesh(
    new THREE.BoxGeometry(0.163, 0.0035, 0.007),
    bronze
  );
  trennlinie.name = 'trennlinie';
  trennlinie.position.set(0, 0, 0.111);
  schaleGruppe.add(trennlinie);

  // Feine leuchtende Kante am unteren Einsatz.
  const lichtkante = new THREE.Mesh(
    new THREE.BoxGeometry(0.142, 0.002, 0.004),
    leuchtglas
  );
  lichtkante.name = 'lichtkante';
  lichtkante.position.set(0, -0.003, 0.111);
  schaleGruppe.add(lichtkante);

  // Vom Spiel verwendbarer Lichtpunkt innerhalb der Schale.
  const lamp = new THREE.Object3D();
  lamp.name = 'LAMP_licht';
  lamp.position.set(0, -0.008, 0.096);
  lamp.userData = {
    color: '#ffdda0',
    intensity: 4.5,
    distance: 3.2,
  };
  schaleGruppe.add(lamp);

  // Echtlicht für die direkte Beleuchtung der Umgebung.
  const punktlicht = new THREE.PointLight(0xffd99a, 3.2, 3.2, 2);
  punktlicht.name = 'punktlicht';
  punktlicht.position.set(0, -0.008, 0.104);
  schaleGruppe.add(punktlicht);

  // Kompakter Kollisionskörper für die gesamte Leuchte.
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.215, 0.13)
  );
  col.name = 'COL_wandleuchte';
  col.position.set(0, 0.1075, 0.065);
  col.userData.aktiv = true;
  root.add(col);

  // Benutzen-Punkt vor der Leuchte.
  const use = new THREE.Object3D();
  use.name = 'INT_wandleuchte';
  use.position.set(0, 0.13, 0.24);
  use.userData = {
    label: 'Wandleuchte antippen',
    radius: 0.8,
  };
  root.add(use);

  let an = opts.an !== false;
  let helligkeit = an ? 1 : 0;
  let zeit = 0;
  let letzte = null;

  function setzeZustand(neuAn) {
    an = Boolean(neuAn);
  }

  function update(dt) {
    const schritt = Math.min(Math.max(dt, 0), 0.1);
    zeit += schritt;

    const puls = an
      ? 0.975 + Math.sin(zeit * 1.7) * 0.025
      : 0;

    const ziel = an ? puls : 0;
    helligkeit +=
      (ziel - helligkeit) * Math.min(1, schritt * 7);

    leuchtglas.emissiveIntensity =
      0.015 + helligkeit * 1.385;

    punktlicht.intensity = helligkeit * 3.2;
    lamp.userData.intensity = helligkeit * 4.5;
  }

  schale.onBeforeRender = () => {
    const now = performance.now() / 1000;
    if (letzte !== null) {
      update(Math.min(Math.max(now - letzte, 0), 0.1));
    }
    letzte = now;
  };

  const api = {
    einschalten() {
      setzeZustand(true);
    },
    ausschalten() {
      setzeZustand(false);
    },
    umschalten() {
      setzeZustand(!an);
    },
    setAn(wert) {
      setzeZustand(wert);
    },
    get an() {
      return an;
    },
    get helligkeit() {
      return helligkeit;
    },
    update,
  };

  root.userData.api = api;
  root.userData.update = update;
  root.userData.actions = [
    {
      id: 'einschalten',
      label: 'Wandleuchte einschalten',
      run: () => api.einschalten(),
    },
    {
      id: 'ausschalten',
      label: 'Wandleuchte ausschalten',
      run: () => api.ausschalten(),
    },
    {
      id: 'umschalten',
      label: 'Wandleuchte umschalten',
      run: () => api.umschalten(),
    },
  ];

  update(0);
  return root;
}

import * as THREE from 'three';

export function init(ctx) {
  const { scene, state, services } = ctx;

  const P0 = new THREE.Vector3(0, 2000, 0);
  const START_Z = 5.4; // Ungefähr 4 m vor der Torfront, außerhalb der Stufen.

  const gruppe = new THREE.Group();
  gruppe.name = 'fremdplanet';
  gruppe.position.copy(P0);
  gruppe.visible = false;
  scene.add(gruppe);

  let assets = services.get('assets');
  const kollision = services.get('kollision');
  const licht = services.get('licht');
  const aussen = services.get('aussen');

  const eigeneGeometrien = new Set();
  const eigeneMaterialien = new Set();
  const instanzen = new Set();

  let geladen = false;
  let buildPromise = null;
  let aktiv = false;
  let tor = null;
  let dhd = null;
  let himmelLicht = null;
  let kollisionsObjekte = [];
  let planetLampen = [];
  let kollisionAktiv = false;
  let lichtAktiv = false;
  let alterNebel = null;
  let planetNebel = null;

  const torPosition = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const tmpM = new THREE.Matrix4();
  const tmpS = new THREE.Vector3(1, 1, 1);

  function geo(g) {
    eigeneGeometrien.add(g);
    return g;
  }

  function mat(m) {
    eigeneMaterialien.add(m);
    return m;
  }

  // Deterministisches Rauschen für Gelände und Vegetation.
  let seed = 0x13579bdf;
  function rand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function noise(x, z) {
    return (
      Math.sin(x * 0.083 + z * 0.037) * 0.34 +
      Math.sin(x * 0.151 - z * 0.121 + 1.7) * 0.19 +
      Math.sin((x + z) * 0.213 + 3.1) * 0.11 +
      Math.cos(x * 0.047 - z * 0.089) * 0.23
    );
  }

  function hoehe(x, z) {
    const r = Math.hypot(x, z);
    let h = noise(x, z);
    const flach = Math.min(1, Math.max(0, (r - 10) / 18));
    h *= flach;
    if (r > 70) h += (r - 70) * 0.26;
    return h;
  }

  function baueGelande() {
    const g = geo(new THREE.PlaneGeometry(180, 180, 90, 90));
    g.rotateX(-Math.PI / 2);

    const pos = g.attributes.position;
    const farben = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const wiesen = new THREE.Color(0x326a37);
    const hell = new THREE.Color(0x477e3e);
    const erde = new THREE.Color(0x8a653e);
    const hügel = new THREE.Color(0x596044);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = hoehe(x, z);
      pos.setY(i, y);

      const r = Math.hypot(x, z);
      const weg = Math.max(
        Math.exp(-Math.pow((x - 0.12 * z) / 2.1, 2)),
        Math.exp(-Math.pow((x + 3.2) / 1.7, 2)) * 0.65
      );
      const variation = (Math.sin(x * 0.9 + z * 0.7) + 1) * 0.025;

      c.copy(wiesen).lerp(hell, (Math.sin(x * 0.43 - z * 0.31) + 1) * 0.5);
      if (weg > 0.16) {
        c.lerp(erde, Math.min(1, (weg - 0.16) / 0.6));
      }
      c.offsetHSL(0, 0, variation);
      if (r > 70) c.lerp(hügel, Math.min(1, (r - 70) / 15));

      farben[i * 3] = c.r;
      farben[i * 3 + 1] = c.g;
      farben[i * 3 + 2] = c.b;
    }

    g.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    g.computeVertexNormals();

    const m = mat(new THREE.MeshLambertMaterial({ vertexColors: true }));
    const mesh = new THREE.Mesh(g, m);
    mesh.name = 'planet_gelaende';
    gruppe.add(mesh);
    return mesh;
  }

  function bauePlattform() {
    const m = mat(new THREE.MeshLambertMaterial({ color: 0x777a70 }));

    const stufe = new THREE.Mesh(geo(new THREE.CylinderGeometry(5, 5, 0.2, 48)), m);
    stufe.position.y = 0.1;
    stufe.name = 'planet_stufe';

    const plattform = new THREE.Mesh(geo(new THREE.CylinderGeometry(4.5, 4.5, 0.3, 48)), m);
    plattform.position.y = 0.35;
    plattform.name = 'planet_plattform';

    gruppe.add(stufe, plattform);
    return [stufe, plattform];
  }

  function baueGrenze() {
    const g = geo(new THREE.BoxGeometry(2, 8, 13.5));
    const m = mat(new THREE.MeshBasicMaterial({ visible: false }));
    const grenzen = [];
    const n = 40;

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const box = new THREE.Mesh(g, m);
      box.name = 'COL_planet_grenze_' + i;
      box.position.set(Math.cos(a) * 75, 3, Math.sin(a) * 75);
      box.rotation.y = -a;
      // Das Objekt bleibt aktiv; nur das Material erzeugt keine Draw Calls.
      box.visible = true;
      box.userData.aktiv = true;
      gruppe.add(box);
      grenzen.push(box);
    }
    return grenzen;
  }

  function baueNatur() {
    const breite = [];
    const nadel = [];
    const felsen = [];
    const kollisionsBoxen = [];

    const stammGeo = geo(new THREE.CylinderGeometry(0.28, 0.42, 3.4, 7));
    const laubGeo = geo(new THREE.IcosahedronGeometry(1.65, 0));
    const kegelGeo = geo(new THREE.ConeGeometry(1.55, 2.8, 8));
    const felsGeo = geo(new THREE.IcosahedronGeometry(1, 0));
    const grasGeo = geo(new THREE.ConeGeometry(0.14, 0.65, 3));

    const stammMat = mat(new THREE.MeshLambertMaterial({ color: 0x4b3020 }));
    const laubMat = mat(new THREE.MeshLambertMaterial({ color: 0x2d7040 }));
    const nadelMat = mat(new THREE.MeshLambertMaterial({ color: 0x205c4d }));
    const felsMat = mat(new THREE.MeshLambertMaterial({ color: 0x707574 }));
    const grasMat = mat(new THREE.MeshLambertMaterial({ color: 0x54883b }));

    const boxGeo = geo(new THREE.BoxGeometry(1, 1, 1));
    const boxMat = mat(new THREE.MeshBasicMaterial({ visible: false }));

    // 80 Bäume; zusätzlich bleibt der Blickbereich vor dem Tor frei.
    for (let i = 0; i < 80; i++) {
      let x;
      let z;
      let d;
      do {
        x = (rand() - 0.5) * 150;
        z = (rand() - 0.5) * 150;
        d = Math.hypot(x, z);
      } while (d < 12 || d > 72 || Math.hypot(x, z - START_Z) < 7);

      const y = hoehe(x, z);
      const typ = rand() < 0.58 ? 0 : 1;
      const s = 0.8 + rand() * 0.65;

      tmpV.set(x, y + 1.7 * s, z);
      tmpQ.identity();
      tmpS.set(s, s, s);
      tmpM.compose(tmpV, tmpQ, tmpS);
      const basis = tmpM.clone();
      if (typ === 0) breite.push(basis);
      else nadel.push(basis);

      const box = new THREE.Mesh(boxGeo, boxMat);
      box.name = 'COL_planet_baum_' + i;
      box.position.set(x, y + 1.7 * s, z);
      box.scale.set(0.8 * s, 3.4 * s, 0.8 * s);
      box.userData.aktiv = true;
      gruppe.add(box);
      kollisionsBoxen.push(box);
    }

    const kronen = new THREE.InstancedMesh(laubGeo, laubMat, breite.length * 3);
    const nadelKronen = new THREE.InstancedMesh(kegelGeo, nadelMat, nadel.length * 3);
    const stamme = new THREE.InstancedMesh(stammGeo, stammMat, breite.length + nadel.length);
    let si = 0;
    let ki = 0;
    let ni = 0;

    for (let i = 0; i < breite.length; i++) {
      stamme.setMatrixAt(si++, breite[i]);
      for (let j = 0; j < 3; j++) {
        const p = new THREE.Vector3().setFromMatrixPosition(breite[i]);
        p.x += (rand() - 0.5) * 1.4;
        p.z += (rand() - 0.5) * 1.4;
        p.y += 2 + rand() * 1.4;
        tmpQ.setFromEuler(tmpE.set(0, rand() * Math.PI, 0));
        const sc = 0.75 + rand() * 0.45;
        tmpS.set(sc, sc, sc);
        tmpM.compose(p, tmpQ, tmpS);
        kronen.setMatrixAt(ki++, tmpM);
      }
    }

    for (let i = 0; i < nadel.length; i++) {
      stamme.setMatrixAt(si++, nadel[i]);
      for (let j = 0; j < 3; j++) {
        const p = new THREE.Vector3().setFromMatrixPosition(nadel[i]);
        p.y += 2.1 + j * 1.15;
        tmpQ.setFromEuler(tmpE.set(0, rand() * Math.PI, 0));
        const sc = 1 - j * 0.2;
        tmpS.set(sc, sc, sc);
        tmpM.compose(p, tmpQ, tmpS);
        nadelKronen.setMatrixAt(ni++, tmpM);
      }
    }

    kronen.instanceMatrix.needsUpdate = true;
    nadelKronen.instanceMatrix.needsUpdate = true;
    stamme.instanceMatrix.needsUpdate = true;
    kronen.name = 'planet_belaubte_kronen';
    nadelKronen.name = 'planet_nadelkronen';
    stamme.name = 'planet_baumstaemme';
    gruppe.add(stamme, kronen, nadelKronen);
    instanzen.add(stamme);
    instanzen.add(kronen);
    instanzen.add(nadelKronen);

    // 30 Felsen mit einfachen Kollisionsboxen.
    for (let i = 0; i < 30; i++) {
      let x;
      let z;
      let d;
      do {
        x = (rand() - 0.5) * 140;
        z = (rand() - 0.5) * 140;
        d = Math.hypot(x, z);
      } while (d < 8 || d > 70);

      const y = hoehe(x, z);
      const s = 0.45 + rand() * 1.15;
      tmpV.set(x, y + s * 0.35, z);
      tmpQ.setFromEuler(tmpE.set(rand() * 0.4, rand() * 6.28, rand() * 0.4));
      tmpS.set(
        s * (0.8 + rand() * 0.4),
        s * (0.55 + rand() * 0.5),
        s * (0.8 + rand() * 0.4)
      );
      tmpM.compose(tmpV, tmpQ, tmpS);
      felsen.push(tmpM.clone());

      const box = new THREE.Mesh(boxGeo, boxMat);
      box.name = 'COL_planet_fels_' + i;
      box.position.set(x, y + s * 0.35, z);
      box.scale.set(s * 1.2, s * 0.8, s * 1.1);
      box.userData.aktiv = true;
      gruppe.add(box);
      kollisionsBoxen.push(box);
    }

    const fp = felsGeo.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const f = 0.78 + rand() * 0.35;
      fp.setXYZ(i, fp.getX(i) * f, fp.getY(i) * f, fp.getZ(i) * f);
    }
    felsGeo.computeVertexNormals();

    const felsMesh = new THREE.InstancedMesh(felsGeo, felsMat, felsen.length);
    felsen.forEach((m, i) => felsMesh.setMatrixAt(i, m));
    felsMesh.instanceMatrix.needsUpdate = true;
    felsMesh.name = 'planet_felsen';
    gruppe.add(felsMesh);
    instanzen.add(felsMesh);

    // Sparsame Grasbüschel; ebenfalls instanziert.
    const gras = new THREE.InstancedMesh(grasGeo, grasMat, 110);
    let gi = 0;
    while (gi < 110) {
      const x = (rand() - 0.5) * 150;
      const z = (rand() - 0.5) * 150;
      if (Math.hypot(x, z) < 7 || Math.hypot(x, z - START_Z) < 2) continue;

      const y = hoehe(x, z);
      const s = 0.6 + rand() * 0.9;
      tmpV.set(x, y + 0.3 * s, z);
      tmpQ.setFromEuler(tmpE.set(0, rand() * 6.28, 0));
      tmpS.set(s, s, s);
      tmpM.compose(tmpV, tmpQ, tmpS);
      gras.setMatrixAt(gi++, tmpM);
    }
    gras.instanceMatrix.needsUpdate = true;
    gras.name = 'planet_gras';
    gruppe.add(gras);
    instanzen.add(gras);

    return kollisionsBoxen;
  }

  function baueHimmel() {
    const radius = 220;
    const g = geo(new THREE.SphereGeometry(radius, 32, 16));
    const p = g.attributes.position;
    const arr = new Float32Array(p.count * 3);
    const unten = new THREE.Color(0x252348);
    const mitte = new THREE.Color(0x3faaa3);
    const oben = new THREE.Color(0x8a5bb5);
    const c = new THREE.Color();

    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / radius;
      if (y < 0.28) c.copy(unten).lerp(mitte, (y + 1) / 1.28);
      else c.copy(mitte).lerp(oben, (y - 0.28) / 0.72);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }

    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    const m = mat(new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false
    }));

    const himmel = new THREE.Mesh(g, m);
    himmel.name = 'planet_himmel';
    himmel.renderOrder = -1000;
    gruppe.add(himmel);

    const hemi = new THREE.HemisphereLight(0x9adfd4, 0x30283d, 1.5);
    const sonne = new THREE.DirectionalLight(0xffe0b0, 2.6);
    const ziel = new THREE.Object3D();
    sonne.position.set(45, 80, 35);
    ziel.position.set(0, 0, 0);
    gruppe.add(hemi, sonne, ziel);
    sonne.target = ziel;

    return { hemi, sonne };
  }

  function objektInfos(obj) {
    let info = null;
    if (assets && typeof assets.auswerten === 'function') {
      try {
        info = assets.auswerten(obj);
      } catch (_) {
        info = null;
      }
    }

    const k = info?.kollision || obj?.userData?.kollision || [];
    const l = info?.lampen || obj?.userData?.lampen || [];
    return {
      kollision: (Array.isArray(k) ? k : [k]).filter(Boolean),
      lampen: (Array.isArray(l) ? l : [l]).filter(Boolean)
    };
  }

  function aktionenVerwendbar(obj) {
    const a = obj?.userData?.actions;
    return Array.isArray(a) && a.length > 0 && a.some(x => x && typeof x.run === 'function');
  }

  function registriereKollision() {
    if (!kollision || kollisionAktiv) return;
    gruppe.updateMatrixWorld(true);
    kollision.hinzufuegen('planet', kollisionsObjekte);
    kollisionAktiv = true;
  }

  function registriereLicht() {
    if (!licht || lichtAktiv) return;
    licht.registrieren('planet', planetLampen);
    lichtAktiv = true;
  }

  function setzeNebel() {
    if (planetNebel) return;
    alterNebel = scene.fog;
    planetNebel = new THREE.Fog(0x31556b, 60, 180);
    scene.fog = planetNebel;
  }

  function entferneNebel() {
    if (!planetNebel) return;
    scene.fog = alterNebel;
    alterNebel = null;
    planetNebel = null;
  }

  async function baue() {
    if (geladen) return;
    if (buildPromise) return buildPromise;

    buildPromise = (async () => {
      if (!assets) assets = services.get('assets');
      if (!assets || typeof assets.objekt !== 'function') {
        throw new Error("Dienst 'assets' ist nicht verfügbar.");
      }

      const gelande = baueGelande();
      const plattform = bauePlattform();
      const grenze = baueGrenze();
      const natur = baueNatur();
      himmelLicht = baueHimmel();

      const geladenObjekte = await Promise.all([
        assets.objekt('OBJ-001'),
        // DHD der Milchstraßen-Bauart (OBJ-097); falls nicht vorhanden das Atlantis-DHD
        assets.objekt('OBJ-097').catch(() => assets.objekt('OBJ-002'))
      ]);

      tor = geladenObjekte[0];
      dhd = geladenObjekte[1];
      if (!tor || !dhd) throw new Error('Stargate oder DHD konnten nicht geladen werden.');

      gruppe.add(tor, dhd);

      // Die Vorderseite des Tors zeigt nach Süden (+Z).
      tor.position.set(0, 0.5, 0);
      tor.rotation.set(0, 0, 0);

      // DHD 7 m vor dem Tor, leicht seitlich, mit der Vorderseite zum Tor.
      dhd.position.set(1.2, hoehe(1.2, 7) + 0.04, 7);
      dhd.rotation.set(0, Math.PI, 0);

      gruppe.updateMatrixWorld(true);

      const torInfos = objektInfos(tor);
      const dhdInfos = objektInfos(dhd);
      kollisionsObjekte = [
        gelande,
        ...plattform,
        ...grenze,
        ...natur,
        ...torInfos.kollision,
        ...dhdInfos.kollision
      ];
      planetLampen = [...torInfos.lampen, ...dhdInfos.lampen];
      geladen = true;
    })();

    try {
      await buildPromise;
    } catch (e) {
      buildPromise = null;
      throw e;
    }
  }

  const api = {
    get aktiv() {
      return aktiv;
    },

    get tor() {
      return tor;
    },

    get dhd() {
      return dhd;
    },

    async betreten() {
      await baue();

      aktiv = true;
      gruppe.visible = true;
      if (himmelLicht) {
        himmelLicht.hemi.visible = true;
        himmelLicht.sonne.visible = true;
      }

      if (aussen && typeof aussen.sichtbar === 'function') aussen.sichtbar(false);
      state.ort = 'planet';

      setzeNebel();
      registriereKollision();
      registriereLicht();

      const x = 0;
      const z = START_Z;
      const pos = new THREE.Vector3(x, hoehe(x, z) + 0.03, z).add(P0);
      return { pos, yaw: Math.PI };
    },

    async verlassen() {
      aktiv = false;
      gruppe.visible = false;

      if (himmelLicht) {
        himmelLicht.hemi.visible = false;
        himmelLicht.sonne.visible = false;
      }

      if (kollision && kollisionAktiv) {
        kollision.entfernen('planet');
        kollisionAktiv = false;
      }

      if (licht && lichtAktiv) {
        licht.entfernen('planet');
        lichtAktiv = false;
      }

      if (aussen && typeof aussen.sichtbar === 'function') aussen.sichtbar(true);
      entferneNebel();
      state.ort = 'atlantis';
    },

    torPosition() {
      return torPosition.set(P0.x, P0.y, P0.z).clone();
    },

    async selbsttest() {
      try {
        const start = await api.betreten();
        if (!start || !start.pos || !start.pos.isVector3) {
          return { ok: false, details: 'betreten lieferte keine gültige Position.' };
        }
        if (!Number.isFinite(start.pos.x) || !Number.isFinite(start.pos.y) || !Number.isFinite(start.pos.z)) {
          return { ok: false, details: 'Die Einstiegsposition enthält ungültige Werte.' };
        }
        if (!api.aktiv || !gruppe.visible || state.ort !== 'planet') {
          return { ok: false, details: 'Der Planet wurde nicht vollständig aktiviert.' };
        }
        if (!tor || !dhd) {
          return { ok: false, details: 'Stargate oder DHD fehlen.' };
        }
        if (!aktionenVerwendbar(tor) || !aktionenVerwendbar(dhd)) {
          return { ok: false, details: 'Stargate oder DHD besitzen keine ausführbaren Aktionen.' };
        }
        if (!kollision || typeof kollision.strahl !== 'function') {
          return { ok: false, details: "Dienst 'kollision' ist nicht verfügbar." };
        }

        const origin = new THREE.Vector3(start.pos.x, start.pos.y + 5, start.pos.z);
        const strahl = kollision.strahl(origin, new THREE.Vector3(0, -1, 0), 20);
        if (!strahl || !strahl.punkt) {
          return { ok: false, details: 'Kein Treffer des Geländes an der Einstiegsposition.' };
        }

        await api.verlassen();
        if (gruppe.visible || api.aktiv || state.ort !== 'atlantis') {
          return { ok: false, details: 'Der Planet wurde nicht vollständig verlassen.' };
        }

        // Zweiter Eintritt prüft, ob Kollision und Licht wieder registriert wurden.
        const erneut = await api.betreten();
        const zweiteStrahl = kollision.strahl(
          new THREE.Vector3(erneut.pos.x, erneut.pos.y + 5, erneut.pos.z),
          new THREE.Vector3(0, -1, 0),
          20
        );
        if (!zweiteStrahl || !zweiteStrahl.punkt) {
          await api.verlassen();
          return { ok: false, details: 'Nach dem Verlassen wurde die Geländekollision nicht wiederhergestellt.' };
        }

        await api.verlassen();
        return {
          ok: true,
          details: 'Position, Gelände, Tor, DHD, erneuter Eintritt und Verlassen geprüft.'
        };
      } catch (e) {
        return {
          ok: false,
          details: 'Fehler im Selbsttest: ' + (e?.message || String(e))
        };
      }
    },

    dispose() {
      if (kollision && kollisionAktiv) {
        kollision.entfernen('planet');
        kollisionAktiv = false;
      }
      if (licht && lichtAktiv) {
        licht.entfernen('planet');
        lichtAktiv = false;
      }

      aktiv = false;
      gruppe.visible = false;
      entferneNebel();

      if (aussen && typeof aussen.sichtbar === 'function') aussen.sichtbar(true);
      state.ort = 'atlantis';

      scene.remove(gruppe);
      for (const instanz of instanzen) {
        if (typeof instanz.dispose === 'function') instanz.dispose();
      }
      for (const g of eigeneGeometrien) g.dispose();
      for (const m of eigeneMaterialien) m.dispose();
      eigeneGeometrien.clear();
      eigeneMaterialien.clear();
      instanzen.clear();
    }
  };

  services.register('planet', api);
  return api;
}

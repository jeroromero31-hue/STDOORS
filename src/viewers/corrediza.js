// Puerta corrediza. Migración del modelo aprobado (01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html):
//   · Geometría: los mismos vértices y normales, malla por malla y en el mismo orden (src/models/corrediza.bin).
//   · Cinemática: la misma trayectoria de asentamiento, giro de poleas y tapa (corrediza.kinematics.js).
//   · Acabado: el único del modelo; color, metal y rugosidad salen de la tabla de materiales del original. Sin selector.
// Lo que cambia está en docs/DIFERENCIAS_CON_ORIGINALES.md: motor de dibujo, luz y fondo comunes del sitio.
import * as THREE from 'three';
import { rbox } from '../core/stage.js';
import manifest from '../models/corrediza.json';
import binUrl from '../models/corrediza.bin?url';
import binzUrl from '../models/corrediza.binz?url';
import { loadModel } from '../core/modelLoad.js';
import logoUrl from '../models/logo-hoja.png';
import { MECH, motion, progressForSlide, applyPose } from './corrediza.kinematics.js';
import { createRig } from './corrediza.rig.js';
import { createBackdrop } from '../core/backdrop.js';
import { frameBox as frame, orbitView as orbit } from '../core/cameraRig.js';
import { materialFromOriginal } from '../materials/fromOriginal.js';
import { Slider, attachSlideDrag, attachTap } from '../core/slider.js';

// Escenografía de estudio del original (muro, piso y hueco). La sustituye el fondo común del sitio, en los mismos planos.
const SCENERY = new Set(['studio-wall', 'studio-floor', 'studio-trim', 'cavity']);
const WALL_Z = -0.10, FLOOR_Y = -0.495;
const CENTER_X = 1.0;                                    // el riel va de x = −1.15 a 3.16 m
const smooth = (t) => t * t * (3 - 2 * t);

// Un material por cada material del original, con su misma tabla de color, metal y rugosidad
// (la conversión al modelo físico está en materials/fromOriginal.js). Dos caras, como dibuja el original.
function buildMaterials() {
  const out = {};
  for (const [name, d] of Object.entries(manifest.materiales)) {
    if (!SCENERY.has(name)) out[name] = materialFromOriginal(`corrediza/${name}`, d, { side: THREE.DoubleSide });
  }
  return out;
}

// Cajas de encuadre (m): conjunto completo, conjunto con la tapa levantada y tramo del riel que recorre la hoja
const BOX = {
  all: [-1.16, -0.40, -0.10, 3.17, 2.78, 0.46],
  allOpen: [-1.16, -0.40, -0.10, 3.17, 2.96, 0.57],
  travel: [-0.60, 1.70, 0.05, 2.30, 2.96, 0.57],
};

export function createCorrediza(stage) {
  const { root, nodes, slots } = createRig();
  const backdrop = createBackdrop(stage, { wallZ: WALL_Z, floorY: FLOOR_Y, centerX: CENTER_X, halfWidth: 14, height: 9, floorDepth: 18 });
  root.add(backdrop.group);
  const materials = buildMaterials();
  const meshes = [];

  // la luz principal y su mapa de sombras se centran en el conjunto (el riel llega a x = 3.16 m)
  {
    const k = stage.key; k.target.position.set(CENTER_X, 1.1, 0.1); stage.scene.add(k.target); k.position.set(CENTER_X + 3, 6.1, 4.1);
    Object.assign(k.shadow.camera, { left: -3.5, right: 3.5, top: 3.0, bottom: -3.0, near: 0.5, far: 16 }); k.shadow.camera.updateProjectionMatrix();
    stage.camera.near = 0.05; stage.camera.updateProjectionMatrix();
  }

  // ---------- geometría ----------
  const ready = loadModel({ z: binzUrl, raw: binUrl, bytes: manifest.formato.bytes }).then((buf) => {
    for (const [i, grupo, material, nv, ni, po, no, io] of manifest.mallas) {
      if (SCENERY.has(material)) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, po, nv * 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(buf, no, nv * 3), 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, io, ni), 1));
      const mesh = new THREE.Mesh(geo, materials[material]);
      mesh.name = `${grupo}/${material}/${i}`;
      mesh.renderOrder = i;                                   // mismo orden de dibujo que el original
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.role = grupo === 'cover' ? 'cover' : grupo === 'static' ? 'fixed' : 'door';
      slots[grupo].add(mesh); meshes.push(mesh);
    }
  });

  // ---------- logo impreso en la hoja (mismo PNG, tamaño y posición que el original; una copia por cara) ----------
  new THREE.TextureLoader().load(logoUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const half = 0.112, hh = half * (237 / 574);
    for (const [z, ry] of [[0.350, 0], [0.250, Math.PI]]) {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2 * half, 2 * hh), mat);
      q.position.set(-0.6125, 2.125, z); q.rotation.y = ry; q.renderOrder = 1000; slots.door.add(q);
    }
  });

  // ---------- movimiento ----------
  const slider = new Slider({ seatBelow: MECH.camThreshold, fullTime: 3.0 });
  let cover = 0, coverOpen = false, coverTween = null, coverBefore = false;
  const coverListeners = new Set();
  const api = {
    setCover(open, { instant = false } = {}) {
      open = !!open; if (open === coverOpen && !instant) return;
      coverOpen = open; const to = open ? 1 : 0;
      if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) { cover = to; coverTween = null; } else coverTween = { from: cover, to, t: 0, d: 0.95 };
      coverListeners.forEach((f) => f(open));
    },
  };
  applyPose(nodes, 0, 0);
  stage.onFrame.add((dt) => {
    slider.update(dt);
    if (coverTween) { const a = coverTween; a.t = Math.min(1, a.t + dt / a.d); cover = a.from + (a.to - a.from) * smooth(a.t); if (a.t >= 1) coverTween = null; }
    applyPose(nodes, slider.p, cover);
  });

  // ---------- puntero: arrastrar la hoja, tocar la tapa ----------
  const first = (ray) => ray.intersectObjects(meshes, false)[0] || null;      // lo primero que toca el rayo
  const pickDoor = (ray) => { const x = first(ray); return x && x.object.userData.role === 'door' ? x : null; };
  const pickCover = (ray) => { const x = first(ray); return x && x.object.userData.role === 'cover' ? x : null; };

  // ---------- herrajes como los pide ST (Fases 10H e 10I) ----------
  // 1. Manija externa fija chica (pieza 39), como la foto de ST: cada soporte negro es una placa atornillada sobre la cara
  //    de la hoja junto al canto, que dobla hacia afuera y termina en un nudillo redondo; el tubo de acero va entre los dos
  //    nudillos. La palanca externa de 68 mm (pieza 64) del modelo base queda como opción («Manija»).
  // 2. La guía de abajo: el brazo negro sale de una placa en el canto, pasa por debajo del riel y el perno sube al riel.
  const handle = { mode: 'chica', lever: [], small: [] };
  const swapHardware = () => {
    const byName = (re) => meshes.filter((m) => re.test(m.name));
    const lever = byName(/^door\/(molded|polymer-side|polymer-inner|satin-pin|shadow)\//);
    const guide = byName(/^door\/(mth-graphite\/7[67]|mth-polymer-mid\/78|mth-screw\/(79|81|82)|mth-satin-shaft\/80)$/);
    const black = (guide.find((m) => /graphite/.test(m.name)) || {}).material || new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.55 });
    const steel = (lever.find((m) => /satin-pin/.test(m.name)) || {}).material || new THREE.MeshStandardMaterial({ color: 0xc9ced3, metalness: 1, roughness: 0.3 });
    const screw = (guide.find((m) => /screw/.test(m.name)) || {}).material || steel;
    guide.forEach((m) => { m.visible = false; m.userData.role = 'hidden'; });
    // la barra de acero de la palanca viene unida a la lámina de la hoja (door/steel/8): sus triángulos pasan a una malla
    // propia, que se ve solo con la palanca (no se pierde ni se agrega ningún triángulo del modelo base)
    const sheet = meshes.find((m) => m.name === 'door/steel/8');
    if (sheet && sheet.geometry.index) {
      slots.door.updateWorldMatrix(true, true);
      const g = sheet.geometry, P = g.attributes.position, I = g.index.array, M = sheet.matrixWorld.clone().premultiply(slots.door.matrixWorld.clone().invert()), q = new THREE.Vector3();
      const bar = (i) => { q.fromBufferAttribute(P, i).applyMatrix4(M); return q.z > 0.375 && q.x < -0.89 && q.y > 0.5 && q.y < 1.45; };
      const keep = [], cut = [];
      for (let t = 0; t < I.length; t += 3) (bar(I[t]) && bar(I[t + 1]) && bar(I[t + 2]) ? cut : keep).push(I[t], I[t + 1], I[t + 2]);
      if (cut.length) {
        const gb = new THREE.BufferGeometry(); Object.entries(g.attributes).forEach(([k, a]) => gb.setAttribute(k, a)); gb.setIndex(cut); gb.computeBoundingSphere();
        g.setIndex(keep); g.computeBoundingSphere();
        const m = new THREE.Mesh(gb, sheet.material); m.name = 'door/steel/8-palanca'; m.castShadow = sheet.castShadow; m.receiveShadow = sheet.receiveShadow;
        m.position.copy(sheet.position); m.quaternion.copy(sheet.quaternion); m.scale.copy(sheet.scale); m.userData = { ...sheet.userData };
        sheet.parent.add(m); meshes.push(m); lever.push(m);
      }
    }
    handle.lever = lever.map((m) => ({ m, role: m.userData.role }));
    const part = (geo, mat, x, y, z, name, list) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.name = name; m.castShadow = true; m.receiveShadow = true; m.userData.role = 'door'; slots.door.add(m); meshes.push(m); if (list) list.push(m); return m; };

    // perfil del soporte en planta (u: desde el canto hacia adentro, v: hacia afuera de la cara), medido sobre la foto
    const Z0 = 0.369, X0 = -0.915, YC = 0.66, LT = 0.165, HB = 0.078;   // cara de la hoja, inicio de la placa, centro, tubo visible, alto del soporte
    const K = [0.060, 0.034], KR = 0.0145, TH = 0.007;
    const prof = (() => {
      const sh = new THREE.Shape(), B = [0.034, 0], C = [0.0525, 0.0225];
      const d = [C[0] - B[0], C[1] - B[1]], L = Math.hypot(...d), n = [-d[1] / L * TH, d[0] / L * TH];
      const Ci = [C[0] + n[0], C[1] + n[1]], t = (TH - (B[1] + n[1])) / (d[1] / L), F = [B[0] + n[0] + d[0] / L * t, TH];
      const a0 = Math.atan2(C[1] - K[1], C[0] - K[0]), a1 = Math.atan2(Ci[1] - K[1], Ci[0] - K[0]) + Math.PI * 2;
      sh.moveTo(0.002, 0); sh.lineTo(B[0], 0); sh.lineTo(C[0], C[1]);
      sh.absarc(K[0], K[1], KR, a0, a1, false);
      sh.lineTo(Ci[0], Ci[1]); sh.lineTo(F[0], F[1]); sh.lineTo(0.002, TH); sh.quadraticCurveTo(0, TH, 0, TH - 0.002); sh.lineTo(0, 0.002); sh.quadraticCurveTo(0, 0, 0.002, 0);
      return sh;
    })();
    const bracketGeo = new THREE.ExtrudeGeometry(prof, { depth: HB - 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 3, curveSegments: 28 })
      .rotateX(Math.PI / 2).translate(0, (HB - 0.004) / 2, 0);   // (u, v, alto) → (x, z, y), centrado en su alto
    const screwGeo = new THREE.CylinderGeometry(0.0046, 0.0038, 0.0024, 18).rotateX(Math.PI / 2);
    const sockGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.0008, 6).rotateX(Math.PI / 2);
    const sockMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.8 });
    [1, -1].forEach((sg) => {
      const yc = YC + sg * (LT / 2 + HB / 2);
      part(bracketGeo, black, X0, yc, Z0, 'ManijaSoporte', handle.small);
      [0.019, -0.019].forEach((dy) => {
        part(screwGeo, screw, X0 + 0.017, yc + dy, Z0 + TH + 0.0012, 'ManijaTornillo', handle.small);
        part(sockGeo, sockMat, X0 + 0.017, yc + dy, Z0 + TH + 0.0026, 'ManijaTornillo', handle.small);
      });
    });
    part(new THREE.CylinderGeometry(0.0095, 0.0095, LT + HB, 28), steel, X0 + K[0], YC, Z0 + K[1], 'ManijaTubo', handle.small);

    // guía: placa en el canto de la hoja, brazo por debajo del riel, perno con tuerca hacia arriba
    const XE = 0.95;
    part(rbox(0.016, 0.12, 0.11, 0.01), black, XE, -0.17, 0.27, 'GuiaPlaca');
    [0.03, -0.03].forEach((dz) => part(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 14).rotateZ(Math.PI / 2), screw, XE + 0.009, -0.17, 0.27 + dz, 'GuiaTornillo'));
    part(rbox(0.05, 0.045, 0.33, 0.016), black, XE + 0.03, -0.14, 0.075, 'GuiaBrazo');
    part(new THREE.CylinderGeometry(0.0065, 0.0065, 0.05, 16), steel, XE + 0.03, -0.095, -0.06, 'GuiaPerno');
    part(new THREE.CylinderGeometry(0.012, 0.012, 0.009, 6), screw, XE + 0.03, -0.112, -0.06, 'GuiaTuerca');
    setHandle(handle.mode);
    return lever.length + guide.length;
  };
  // anclas de la manija: la chica (39) sobre su tubo; la palanca (64) sobre la palanca
  const handleAnchor = { numero: '39', parent: slots.door, position: new THREE.Vector3(-0.855, 0.66, 0.42) };
  const HANDLE_AT = { chica: [-0.855, 0.66, 0.42, '39'], palanca: [-0.86, 0.6, 0.47, '64'] };
  function setHandle(mode) {
    handle.mode = mode === 'palanca' ? 'palanca' : 'chica';
    const lv = handle.mode === 'palanca';
    handle.lever.forEach(({ m, role }) => { m.visible = lv; m.userData.role = lv ? role : 'hidden'; });
    handle.small.forEach((m) => { m.visible = !lv; m.userData.role = lv ? 'hidden' : 'door'; });
    const [x, y, z, n] = HANDLE_AT[handle.mode]; handleAnchor.position.set(x, y, z); handleAnchor.numero = n;
    if (stage.invalidate) stage.invalidate(3);
  }

  // caja de la hoja cerrada, en el mundo, para «Ver el frío»
  let closedBox = null;
  ready.then(() => {
    swapHardware();
    const keep = slider.p; applyPose(nodes, 0, cover); root.updateMatrixWorld(true);
    closedBox = new THREE.Box3(); meshes.filter((m) => m.userData.role === 'door').forEach((m) => closedBox.expandByObject(m));
    applyPose(nodes, keep, cover);
  });

  stage.scene.add(root);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, nodes, slots, materials, meshes, slider, ready,
    // «Ver el frío»: el hueco es lo que tapa la hoja cerrada; al correrla queda libre la parte que ya no cubre
    thermal: {
      wallZ: WALL_Z, floorY: FLOOR_Y,
      openings: () => {
        if (!closedBox) return [];
        const x0 = closedBox.min.x + 0.1, x1 = closedBox.max.x - 0.1, dx = motion(slider.p).x - motion(0).x;
        const r = Math.min(x1, x0 + dx);
        return r > x0 + 0.01 ? [{ x0, x1: r, top: closedBox.max.y - FLOOR_Y - 0.1, amount: Math.min(1, (r - x0) / Math.max(0.3, (x1 - x0) * 0.6)) }] : [];
      },
    },
    get progress() { return slider.p; },
    get coverOpen() { return coverOpen; }, get cover() { return cover; },
    setCover: api.setCover, onCover(f) { coverListeners.add(f); },
    setInside: backdrop.setInside,
    // la cámara se queda delante del muro y por encima del piso
    limits: { minDistance: 0.55, maxDistance: 12, minAzimuthAngle: -1.25, maxAzimuthAngle: 1.25, minPolarAngle: Math.PI * 0.3 },
    // cómo se mueve esta puerta, para la página (ver ui/doorPage.js)
    motion: {
      attachDrag({ onGrab } = {}) {
        attachSlideDrag(stage, slider, { pick: pickDoor, toProgress: progressForSlide, fromProgress: (p) => motion(p).x, onGrab });
        attachTap(stage, pickCover, () => api.setCover(!coverOpen));
      },
      onOpenChange(f) { slider.onChange((s) => f(s.target > 0.5)); },
      setOpen(on) { slider.set(on ? 1 : 0); },
      // por dentro = con la tapa del riel levantada; al salir vuelve a como estaba
      inside(on) { if (on) { coverBefore = coverOpen; api.setCover(true); } else api.setCover(coverBefore); },
      // pasos de la página: data-p (progreso), data-from (arranca desde ahí para volver a mostrar el movimiento),
      // data-t (segundos) y data-cover (1 = tapa levantada)
      step(d) {
        if (d.cover !== undefined) api.setCover(d.cover === '1');
        if (d.p === undefined) return;
        if (d.from !== undefined) slider.jump(Number(d.from));
        slider.set(Number(d.p), d.t ? Number(d.t) : undefined);
      },
    },
    // anclas para los puntos de pieza (numero = pieza del catálogo)
    // Fase 10I · manija chica (la que más se pide) o palanca de 68 mm
    configs: [{
      key: 'manija', label: 'Manija', view: 'manija',
      items: [
        { id: 'chica', label: 'Manija fija', numero: '39', detail: 'Manija externa fija (pieza 39)' },
        { id: 'palanca', label: 'Palanca 68 mm', numero: '64', detail: 'Palanca externa de 68 mm (pieza 64)' },
      ],
      current: () => handle.mode, set: setHandle,
    }],
    anchors: [
      { numero: '59', parent: slots.cover, position: V(2.05, 2.70, 0.37) },
      { numero: '57', parent: slots.static, position: V(0.02, 2.60, 0.235) },
      { numero: '47', parent: slots.static, position: V(-0.94, 2.60, 0.235) },
      { numero: '48', parent: slots.static, position: V(1.02, 2.60, 0.235) },
      { numero: '38', parent: slots.door, position: V(-0.985, 1.95, 0.31) },
      handleAnchor,
      { numero: '58', parent: slots.static, position: V(2.25, -0.035, -0.03) },
    ],
    views: {
      general: (st) => frame(st, BOX.all, 0.31, 0.08),
      interior: (st) => frame(st, BOX.allOpen, 0.24, 0.10),
      tapa: (st) => frame(st, BOX.allOpen, 0.31, 0.12),         // mismo encuadre que la vista general, con sitio para la tapa
      recorrido: (st) => frame(st, BOX.travel, 0.26, 0.12),     // las dos poleas a medio riel
      polea: orbit(-0.90, 2.50, 0.2, 0.42, 0.10, 1.35),         // polea izquierda y bloque de cierre
      empaque: orbit(0.935, 1.30, 0.22, -1.0, 0.08, 1.55),      // canto derecho: hoja, empaque y marco de perfil
      guia: orbit(1.0, -0.03, 0.10, -0.6, 0.10, 1.6),           // brida de la hoja sobre el riel guía del muro
      manija: orbit(-0.86, 0.68, 0.40, 0.6, 0.08, 0.9),        // la manija (chica o palanca), de 3/4 para ver cuánto sale de la hoja
      frio: (st) => frame(st, [-1.3, FLOOR_Y, WALL_Z, 3.2, 2.6, 2.6], 0.22, 0.34),   // hueco, riel y el piso de enfrente
    },
  };
}

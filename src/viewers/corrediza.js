// Puerta corrediza. Migración del modelo aprobado (01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html):
//   · Geometría: los mismos vértices y normales, malla por malla y en el mismo orden (src/models/corrediza.bin).
//   · Cinemática: la misma trayectoria de asentamiento, giro de poleas y tapa (corrediza.kinematics.js).
//   · Acabado: el único del modelo; color, metal y rugosidad salen de la tabla de materiales del original. Sin selector.
// Lo que cambia está en docs/DIFERENCIAS_CON_ORIGINALES.md: motor de dibujo, luz y fondo comunes del sitio.
import * as THREE from 'three';
import manifest from '../models/corrediza.json';
import binUrl from '../models/corrediza.bin?url';
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
  const ready = fetch(binUrl).then((r) => { if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`); return r.arrayBuffer(); }).then((buf) => {
    if (buf.byteLength !== manifest.formato.bytes) throw new Error('El modelo llegó incompleto');
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

  // caja de la hoja cerrada, en el mundo, para «Ver el frío»
  let closedBox = null;
  ready.then(() => {
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
    anchors: [
      { numero: '59', parent: slots.cover, position: V(2.05, 2.70, 0.37) },
      { numero: '57', parent: slots.static, position: V(0.02, 2.60, 0.235) },
      { numero: '47', parent: slots.static, position: V(-0.94, 2.60, 0.235) },
      { numero: '48', parent: slots.static, position: V(1.02, 2.60, 0.235) },
      { numero: '38', parent: slots.door, position: V(-0.985, 1.95, 0.31) },
      { numero: '39', parent: slots.door, position: V(-0.93, 1.03, 0.45) },
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
      frio: (st) => frame(st, [-1.3, FLOOR_Y, WALL_Z, 3.2, 2.6, 2.6], 0.22, 0.34),   // hueco, riel y el piso de enfrente
    },
  };
}

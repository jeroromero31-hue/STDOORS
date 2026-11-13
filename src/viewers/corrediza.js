// Puerta corrediza. Migración del modelo aprobado (01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html):
//   · Geometría: los mismos vértices y normales, malla por malla y en el mismo orden (src/models/corrediza.bin).
//   · Cinemática: la misma trayectoria de asentamiento, giro de poleas y tapa (corrediza.kinematics.js).
//   · Acabado: el único del modelo; color, metal y rugosidad salen de la tabla de materiales del original. Sin selector.
// Lo que cambia está en docs/DIFERENCIAS_CON_ORIGINALES.md: motor de dibujo, luz y fondo comunes del sitio.
import * as THREE from 'three';
import manifest from '../models/corrediza.json';
import binUrl from '../models/corrediza.bin?url';
import logoUrl from '../models/corrediza-logo.png';
import { MECH, motion, progressForSlide, applyPose } from './corrediza.kinematics.js';
import { createRig } from './corrediza.rig.js';
import { createBackdrop } from '../core/backdrop.js';
import { Slider, attachSlideDrag, attachTap } from '../core/slider.js';

// Escenografía de estudio del original (muro, piso y hueco). La sustituye el fondo común del sitio, en los mismos planos.
const SCENERY = new Set(['studio-wall', 'studio-floor', 'studio-trim', 'cavity']);
const WALL_Z = -0.10, FLOOR_Y = -0.495;
const CENTER_X = 1.0;                                    // el riel va de x = −1.15 a 3.16 m
const smooth = (t) => t * t * (3 - 2 * t);

// ---------- materiales ----------
// Uno por cada material del original, a partir de su misma tabla (color, metal, rugosidad). El original no sombrea
// con PBR estándar: su reflejo vale f0 = mix(0.055, 0.91, metal) con un tinte frío y su difuso alb·(1 − 0.82·metal).
// Con los mismos tres números, un material estándar daría plásticos casi negros y aluminios apagados. Aquí se
// despejan los parámetros físicos que reproducen esa respuesta. CAL ajusta la exposición del estudio común a la del
// original; se calibró midiendo, material por material, ambos renders desde las mismas cámaras.
const CAL = { kd: 0.76, ksMetal: 0.92, ksDielectric: 1.15, roughMetal: 0.85, roughDielectric: 1.0 };

function physicalParams(d) {
  const c = new THREE.Color(d.color), alb = [c.r, c.g, c.b], M = d.metal;
  if (d.superficie === 'pintura') return { color: c, metalness: M, roughness: d.rough };            // hoja: tal cual
  // hules y negros mates: el original los pinta sin reflejo, sea cual sea su valor de metal
  if (d.superficie === 'elastomero') return { color: c, metalness: 0, roughness: Math.max(d.rough, 0.85), envMapIntensity: 0.8 };
  const f0 = 0.055 + (0.91 - 0.055) * M;
  const tint = [0.86, 0.91, 0.95].map((t, i) => t + (Math.max(alb[i], 0.2) - t) * 0.38 * M);
  const A = alb.map((a) => a * (1 - 0.82 * M) * CAL.kd);                                           // difuso
  if (M <= 0.2) {                                                                                   // plásticos
    const S = tint.map((t) => t * f0 * CAL.ksDielectric), F = (S[0] + S[1] + S[2]) / 3, Fc = Math.min(0.16, F), q = Math.sqrt(Fc), mx = Math.max(...S);
    return {
      color: new THREE.Color().setRGB(A[0], A[1], A[2]), metalness: 0, roughness: Math.max(0.08, d.rough * CAL.roughDielectric),
      ior: (1 + q) / (1 - q), specularIntensity: F / Fc, specularColor: new THREE.Color().setRGB(S[0] / mx, S[1] / mx, S[2] / mx),
    };
  }
  const S = tint.map((t) => t * f0 * CAL.ksMetal);                                                  // metales
  let lo = 0, hi = 0.98;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (0.04 * (1 - m) + (A[1] * m) / (1 - m) < S[1]) lo = m; else hi = m; }
  const m = (lo + hi) / 2;
  return { color: new THREE.Color().setRGB(...A.map((a) => Math.min(1, a / (1 - m)))), metalness: m, roughness: Math.max(0.08, d.rough * CAL.roughMetal) };
}

function buildMaterials() {
  const out = {};
  for (const [name, d] of Object.entries(manifest.materiales)) {
    if (SCENERY.has(name)) continue;
    out[name] = new THREE.MeshPhysicalMaterial({ name: `corrediza/${name}`, side: THREE.DoubleSide, ...physicalParams(d) });   // dos caras, como dibuja el original
  }
  return out;
}

// misma convención de cámara que el original: yaw positivo = cámara hacia la izquierda de la puerta
const direction = (yaw, pitch) => new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
const orbit = (tx, ty, tz, yaw, pitch, d) => { const t = new THREE.Vector3(tx, ty, tz); return { pos: t.clone().addScaledVector(direction(yaw, pitch), d).toArray(), tgt: t.toArray() }; };

// Encuadre: desde (yaw, pitch), la cámara más cercana que deja la caja completa dentro del visor, centrada y con margen.
// Se recalcula con la proporción real del visor, así que nada queda cortado en móvil ni en escritorio.
const UP = new THREE.Vector3(0, 1, 0);
function frame(st, [x0, y0, z0, x1, y1, z1], yaw, pitch, margin = 1.07) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(st.camera.fov / 2)), tanH = tanV * st.camera.aspect;
  const dir = direction(yaw, pitch), fwd = dir.clone().negate(), right = new THREE.Vector3().crossVectors(fwd, UP).normalize(), up = new THREE.Vector3().crossVectors(right, fwd);
  const corners = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push(new THREE.Vector3(x, y, z));
  const tgt = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), eye = new THREE.Vector3(), v = new THREE.Vector3();
  let d = 6;
  for (let i = 0; i < 16; i++) {
    eye.copy(tgt).addScaledVector(dir, d);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const c of corners) { v.copy(c).sub(eye); const z = v.dot(fwd), a = v.dot(right) / (z * tanH), b = v.dot(up) / (z * tanV); a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    tgt.addScaledVector(right, ((a0 + a1) / 2) * tanH * d).addScaledVector(up, ((b0 + b1) / 2) * tanV * d);
    d *= Math.max((a1 - a0) / 2, (b1 - b0) / 2) * margin;
  }
  return { pos: tgt.clone().addScaledVector(dir, d).toArray(), tgt: tgt.toArray() };
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

  stage.scene.add(root);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, nodes, slots, materials, meshes, slider, ready,
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
    },
  };
}

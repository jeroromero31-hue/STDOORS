// Transiciones de cámara entre vistas con nombre. Se cancelan en cuanto el usuario toma la cámara.
import * as THREE from 'three';

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createCameraRig(stage, views) {
  const { camera, controls } = stage;
  let anim = null, current = null;
  const listeners = new Set();
  controls.addEventListener('start', () => { anim = null; });
  const resolve = (name) => { const v = typeof views[name] === 'function' ? views[name](stage) : views[name]; return { pos: new THREE.Vector3(...v.pos), tgt: new THREE.Vector3(...v.tgt) }; };
  const rig = {
    get current() { return current; },
    onGo(f) { listeners.add(f); },                      // avisa cada vez que la cámara vuelve a un encuadre con nombre
    go(name, duration = 1.0) {
      if (!views[name]) return; current = name; const v = resolve(name); listeners.forEach((f) => f(name));
      // la inercia que quede de un giro del usuario se aplica de una vez: si no, seguiría desviando la cámara al llegar
      if (controls.enableDamping) { controls.enableDamping = false; controls.update(); controls.enableDamping = true; }
      if (duration <= 0 || reduced()) { camera.position.copy(v.pos); controls.target.copy(v.tgt); anim = null; return; }
      anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.tgt, k: 0, d: duration };
    },
    refit() { if (current && !anim) rig.go(current, 0); },
  };
  stage.onFrame.add((dt) => {
    if (!anim) return; anim.k = Math.min(1, anim.k + dt / anim.d); const e = ease(anim.k);
    camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.t0, anim.t1, e);
    if (anim.k >= 1) anim = null;
  });
  stage.onResize.add(() => rig.refit());
  return rig;
}

// ---------- encuadres ----------
// Convención de los modelos originales: yaw positivo = cámara hacia la izquierda de la puerta.
const UP = new THREE.Vector3(0, 1, 0);
const direction = (yaw, pitch) => new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));

// Vista fija: objetivo, ángulos y distancia
export function orbitView(tx, ty, tz, yaw, pitch, d) {
  const t = new THREE.Vector3(tx, ty, tz);
  return { pos: t.clone().addScaledVector(direction(yaw, pitch), d).toArray(), tgt: t.toArray() };
}

// Vista ajustada: desde (yaw, pitch), la cámara más cercana que deja la caja [x0,y0,z0,x1,y1,z1] completa dentro
// del visor, centrada y con margen. Se calcula con la proporción real del visor: nada queda cortado en móvil.
export function frameBox(stage, [x0, y0, z0, x1, y1, z1], yaw, pitch, margin = 1.07) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2)), tanH = tanV * stage.camera.aspect;
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

// Cámara de los modelos originales [yaw, pitch, dist, focusX, focusY] (campo de visión vertical de 45°) → posición y objetivo
export function originalCamera([yaw, pitch, dist, fx, fy]) {
  return { ...orbitView(fx, fy, 0, yaw, pitch, dist), fov: 45 };
}

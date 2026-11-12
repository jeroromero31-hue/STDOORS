// Transiciones de cámara entre vistas con nombre. Se cancelan en cuanto el usuario toma la cámara.
import * as THREE from 'three';

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createCameraRig(stage, views) {
  const { camera, controls } = stage;
  let anim = null, current = null;
  controls.addEventListener('start', () => { anim = null; });
  const resolve = (name) => { const v = typeof views[name] === 'function' ? views[name](stage) : views[name]; return { pos: new THREE.Vector3(...v.pos), tgt: new THREE.Vector3(...v.tgt) }; };
  const rig = {
    get current() { return current; },
    go(name, duration = 1.0) {
      if (!views[name]) return; current = name; const v = resolve(name);
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

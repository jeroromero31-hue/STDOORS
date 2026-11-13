// Hoja corrediza: todo el movimiento depende de un número, el progreso p (0 = cerrada y asentada, 1 = abierta).
// La trayectoria (deslizar, subir o bajar por las rampas) la decide la cinemática de cada puerta.
import * as THREE from 'three';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class Slider {
  // seatBelow: por debajo de este progreso la hoja está sobre las rampas; si se suelta ahí, termina de bajar sola
  // fullTime: segundos que tarda el recorrido completo con el botón
  constructor({ seatBelow = 0, fullTime = 3.0 } = {}) {
    Object.assign(this, { seatBelow, fullTime });
    this.p = 0; this.target = 0; this.dragging = false; this.tween = null; this.listeners = new Set();
  }
  onChange(f) { this.listeners.add(f); }
  emit() { this.listeners.forEach((f) => f(this)); }
  // movimiento con tiempo (botón y pasos de la página), suavizado como el ciclo del modelo original
  set(p, duration) {
    this.target = clamp01(p); this.dragging = false;
    const d = duration ?? Math.max(0.6, Math.abs(this.target - this.p) * this.fullTime);
    if (reduced() || d <= 0) { this.p = this.target; this.tween = null; } else this.tween = { from: this.p, to: this.target, t: 0, d };
    this.emit();
  }
  jump(p) { this.p = this.target = clamp01(p); this.tween = null; this.dragging = false; this.emit(); }
  grab() { this.dragging = true; this.tween = null; this.target = this.p; }
  drag(p) { this.target = clamp01(p); this.emit(); }
  release() {
    this.dragging = false;
    if (this.target > 0 && this.target < this.seatBelow) this.set(0, 0.7);
  }
  // devuelve true si la pose cambió en este cuadro
  update(dt) {
    if (this.tween) {
      const a = this.tween; a.t = Math.min(1, a.t + dt / a.d); this.p = a.from + (a.to - a.from) * smooth(a.t);
      if (a.t >= 1) this.tween = null;
      return true;
    }
    const d = this.target - this.p; if (d === 0) return false;
    if (Math.abs(d) < 1e-5) this.p = this.target;
    else this.p += d * (1 - Math.exp(-dt * (this.dragging ? 18 : 6)));     // la mano se sigue de cerca
    return true;
  }
}

// Arrastre con puntero: la hoja sigue al puntero sobre un plano paralelo al muro que pasa por el punto tomado.
//   pick(ray)        → { point } si el rayo toca la hoja (y nada la tapa); null en otro caso
//   toProgress(m)    → progreso para un avance en metros · fromProgress(p) → avance en metros
export function attachSlideDrag(stage, slider, { pick, toProgress, fromProgress, onGrab, onRelease } = {}) {
  const { canvas, camera, controls } = stage;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), at = new THREE.Vector3(), normal = new THREE.Vector3(0, 0, 1);
  let active = null;
  const setRay = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return; setRay(e); const x = pick(ray); if (!x) return;
    plane.setFromNormalAndCoplanarPoint(normal, x.point);
    active = { x0: x.point.x, s0: fromProgress(slider.p) };
    slider.grab(); controls.enabled = false; e.stopImmediatePropagation();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    canvas.style.cursor = 'grabbing'; onGrab && onGrab();
  }, { capture: true });
  canvas.addEventListener('pointermove', (e) => {
    if (!active) { if (e.pointerType === 'mouse') { setRay(e); canvas.style.cursor = pick(ray) ? 'grab' : ''; } return; }
    setRay(e); if (ray.ray.intersectPlane(plane, at)) slider.drag(toProgress(active.s0 + at.x - active.x0));
  });
  const end = () => { if (!active) return; active = null; slider.release(); controls.enabled = true; canvas.style.cursor = ''; onRelease && onRelease(); };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
}

// Toque sin arrastre sobre una parte del modelo (por ejemplo, la tapa del riel)
export function attachTap(stage, pick, onTap) {
  const { canvas, camera } = stage;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  const setRay = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  canvas.addEventListener('pointerdown', (e) => { if (e.button > 0) return; setRay(e); down = pick(ray) ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return; const d = down; down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 && performance.now() - d.t < 500) onTap();
  });
  canvas.addEventListener('pointercancel', () => { down = null; });
}

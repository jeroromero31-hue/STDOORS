// Hoja abisagrada: lo único que se anima es pivot.rotation.y, y el pivote está sobre el eje real de la bisagra.
// dir = +1 si la hoja se extiende hacia +x desde el eje; -1 si se extiende hacia -x. Ángulo positivo: abre hacia +z
// (el frente). Con min < 0 la hoja es de doble acción y también gira hacia atrás.
import * as THREE from 'three';

export class Hinge {
  constructor(pivot, { dir = 1, min = 0, max = 90, mode = 'free', snap = 2 } = {}) {
    Object.assign(this, { pivot, dir, min, max, mode, snap });
    this.angle = 0; this.target = 0; this.dragging = false; this.listeners = new Set();
  }
  onChange(f) { this.listeners.add(f); }
  set(deg) { this.target = THREE.MathUtils.clamp(deg, this.min, this.max); }
  jump(deg) { this.set(deg); this.angle = this.target; this.apply(); }
  apply() { this.pivot.rotation.y = -this.dir * THREE.MathUtils.degToRad(this.angle); this.listeners.forEach((f) => f(this)); }
  release() {
    this.dragging = false;
    if (this.mode === 'free' && Math.abs(this.target) < this.snap) this.target = 0;   // cerca del marco, asienta
  }
  update(dt) {
    const d = this.target - this.angle;
    if (Math.abs(d) < 0.01) { if (d !== 0) { this.angle = this.target; this.apply(); } return; }
    const k = this.dragging ? 18 : 4.2;                       // la mano se sigue de cerca; los botones, con calma
    this.angle += d * (1 - Math.exp(-dt * k));
    this.apply();
  }
}

// Arrastre con puntero: el ángulo sale de cruzar el rayo con un cilindro centrado en el eje de la bisagra.
export function attachHingeDrag(stage, hinges, { pickables, onGrab, onRelease } = {}) {
  const { canvas, camera, controls } = stage;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), axis = new THREE.Vector3();
  let active = null;
  const setRay = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  const angleAt = (h, radius) => {
    h.pivot.getWorldPosition(axis);
    const o = ray.ray.origin, d = ray.ray.direction, ox = o.x - axis.x, oz = o.z - axis.z;
    const A = d.x * d.x + d.z * d.z; if (A < 1e-8) return null;
    const B = 2 * (ox * d.x + oz * d.z), C = ox * ox + oz * oz - radius * radius, disc = B * B - 4 * A * C;
    let t = disc >= 0 ? (-B - Math.sqrt(disc)) / (2 * A) : -B / (2 * A);
    if (t < 0 && disc >= 0) t = (-B + Math.sqrt(disc)) / (2 * A);
    if (t < 0) return null;
    return THREE.MathUtils.radToDeg(Math.atan2(oz + d.z * t, h.dir * (ox + d.x * t)));
  };
  // Hojas de doble acción (min < 0). Visto en planta, el punto tomado recorre un círculo y el rayo lo corta en dos
  // sitios: uno del lado de la cámara y otro del lado contrario. La hoja sigue el corte que pasa por el punto tomado,
  // así queda siempre bajo el puntero, gire hacia el frente o hacia atrás. Si el puntero se sale del círculo, la hoja
  // sigue girando en el mismo sentido, a ritmo constante: se puede cruzar de un lado al otro sin soltarla.
  const PAST = 1.5;   // radianes de giro por cada radio que el puntero se aleja del círculo (parecido al ritmo de jalar)
  const cuts = (h, radius) => {
    h.pivot.getWorldPosition(axis);
    const o = ray.ray.origin, d = ray.ray.direction, ox = h.dir * (o.x - axis.x), oz = o.z - axis.z, dx = h.dir * d.x, dz = d.z;
    const A = dx * dx + dz * dz; if (A < 1e-8) return null;
    const t = -(ox * dx + oz * dz) / A, cx = ox + dx * t, cz = oz + dz * t, rho = Math.hypot(cx, cz);   // punto del rayo más cercano al eje
    const px = rho > 1e-6 ? cx : -dz, pz = rho > 1e-6 ? cz : dx, beta = Math.atan2(pz, px), eps = pz * dx - px * dz >= 0 ? 1 : -1;
    const g = rho <= radius ? Math.acos(rho / radius) : -PAST * (rho / radius - 1);
    return { near: THREE.MathUtils.radToDeg(beta + eps * g), far: THREE.MathUtils.radToDeg(beta - eps * g) };
  };
  const turnsTo = (a, ref) => a + 360 * Math.round((ref - a) / 360);            // el mismo ángulo, en la vuelta más cercana a ref
  const hit = (e) => { setRay(e); const list = pickables(); const x = ray.intersectObjects(list, false)[0]; return x && x.object.userData.hinge ? x : null; };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return; const x = hit(e); if (!x) return;
    const h = x.object.userData.hinge; h.pivot.getWorldPosition(axis);
    const radius = Math.max(0.15, Math.hypot(x.point.x - axis.x, x.point.z - axis.z));
    let a0, root = null;
    if (h.min < 0) {
      const s = cuts(h, radius), at = THREE.MathUtils.radToDeg(Math.atan2(x.point.z - axis.z, h.dir * (x.point.x - axis.x)));
      if (s) { root = Math.abs(turnsTo(s.near, at) - at) <= Math.abs(turnsTo(s.far, at) - at) ? 'near' : 'far'; a0 = turnsTo(s[root], at); } else a0 = null;
    } else a0 = angleAt(h, radius);
    active = { h, radius, root, last: a0, offset: a0 === null ? 0 : h.angle - a0 };
    h.dragging = true; controls.enabled = false; e.stopImmediatePropagation();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    canvas.style.cursor = 'grabbing'; onGrab && onGrab(h);
  }, { capture: true });
  canvas.addEventListener('pointermove', (e) => {
    if (!active) { if (e.pointerType === 'mouse') canvas.style.cursor = hit(e) ? 'grab' : ''; return; }
    setRay(e);
    if (active.root) { const s = cuts(active.h, active.radius); if (s) { active.last = turnsTo(s[active.root], active.last); active.h.set(active.last + active.offset); } return; }
    const a = angleAt(active.h, active.radius); if (a !== null) active.h.set(a + active.offset);
  });
  const end = () => { if (!active) return; active.h.release(); onRelease && onRelease(active.h); active = null; controls.enabled = true; canvas.style.cursor = ''; };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
}

// Cómo se mueve una puerta abisagrada, visto desde la página (ver ui/doorPage.js). Sirve para una hoja o para varias.
export function hingeMotion(stage, hinges, pickables) {
  // con "reducir movimiento" la hoja cambia de posición sin animarse
  const to = (h, deg) => (matchMedia('(prefers-reduced-motion: reduce)').matches ? h.jump(deg) : h.set(deg));
  return {
    hinges,
    attachDrag: (opts) => attachHingeDrag(stage, hinges, { pickables, ...opts }),
    onOpenChange: (f) => hinges.forEach((h) => h.onChange(() => f(hinges.some((x) => Math.abs(x.target) > 45)))),
    setOpen: (on) => hinges.forEach((h) => to(h, on ? 90 : 0)),              // cada bisagra recorta a su apertura máxima
    inside: (on) => hinges.forEach((h) => to(h, on ? Math.min(85, h.max) : 0)),
    // pasos de la página: data-open="40" (todas las hojas) o data-open="63,-63" (una cifra por hoja)
    step: (d) => { if (d.open === undefined) return; const a = String(d.open).split(',').map(Number); hinges.forEach((h, i) => to(h, a[i] ?? a[0])); },
    to,
  };
}

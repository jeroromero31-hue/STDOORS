// Avance de desplazamiento por sección, para las animaciones del Inicio que siguen al scroll.
// No secuestra el desplazamiento: la página se mueve con el scroll nativo y aquí solo se mide dónde va.
//   · modo «pin»: la sección es alta y su contenido queda fijo; 0 cuando su borde de arriba llega arriba de la
//     pantalla y 1 cuando su borde de abajo llega abajo.
//   · modo «enter»: secciones normales; 0 cuando su borde de arriba asoma por abajo y 1 cuando ya subió 85 % de la
//     pantalla.
// El valor que recibe cada sección se suaviza (sigue al scroll con un poco de inercia), así el movimiento se ve
// continuo aunque la rueda del ratón avance a saltos. Con «movimiento reducido» todo queda en su estado final.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// tramo de p entre a y b, llevado a 0…1
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);

const items = new Set();
let running = false, last = 0;

function raw(it) {
  const r = it.el.getBoundingClientRect(), H = innerHeight;
  const mode = typeof it.mode === 'function' ? it.mode() : it.mode;
  if (mode === 'pin') return clamp01(-r.top / Math.max(1, r.height - H));
  return clamp01((H - r.top) / (H * 0.85));
}

function loop(t) {
  const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
  let moving = false;
  for (const it of items) {
    if (!it.near) continue;
    const target = raw(it);
    const k = it.smooth > 0 ? 1 - Math.exp(-dt * it.smooth) : 1;
    let v = it.value + (target - it.value) * k;
    if (Math.abs(target - v) < 0.0005) v = target; else moving = true;
    if (v !== it.value || it.first) { it.value = v; it.first = false; it.fn(v, target, dt); }
    if (it.always) moving = true;
  }
  running = moving;
  if (running) requestAnimationFrame(loop);
}
const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } };
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);

// track(el, fn, { mode, smooth, always }): fn(p, pDestino, dt) cada vez que el avance cambia.
// always: sigue llamando en cada cuadro mientras la sección esté cerca (para quien anima por su cuenta).
// ?suave=0 quita la inercia (solo para grabar el recorrido cuadro por cuadro).
const noSmooth = new URLSearchParams(location.search).get('suave') === '0';
export function track(el, fn, { mode = 'pin', smooth = 7, always = false } = {}) {
  const it = { el, fn, mode, smooth: reducedMotion() || noSmooth ? 0 : smooth, always, value: 0, first: true, near: false };
  if (reducedMotion()) { it.value = 1; fn(1, 1, 0); return it; }
  items.add(it);
  new IntersectionObserver(([e]) => { it.near = e.isIntersecting; if (it.near) kick(); }, { rootMargin: '50% 0px 50% 0px' }).observe(el);
  it.value = raw(it); fn(it.value, it.value, 0); it.first = false;
  return it;
}
export const wake = kick;

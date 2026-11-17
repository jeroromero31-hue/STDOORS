// Fase 10H · Piezas flotantes: recortes reales del catálogo (scripts/build-flotantes.py) que flotan en la página y se
// pueden agarrar, lanzar y chocar entre sí. Al tocar una sin arrastrarla se ve su nombre y un enlace a su ficha.
// Es física 2D sencilla con transformaciones de CSS (sin canvas): pocas piezas, el bucle solo corre con la zona en
// pantalla y se detiene si nada se mueve. En celular el arrastre es directo (touch-action: none solo en la pieza, el
// resto de la página se desplaza normal).
import flot from '../data/flotantes.json';
import catalog from '../data/components.json';
import { url } from './site.js';

const byId = new Map(flot.piezas.map((p) => [p.id.split('-').slice(0, 2).join('-'), p]));
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const floatPiece = (key) => {
  const f = byId.get(key); if (!f) return null;
  const p = catalog.piezas.find((x) => x.id === f.id); return p ? { ...f, pieza: p } : null;
};

/**
 * box: contenedor (position relative o absolute); las piezas viven dentro y rebotan en sus bordes.
 * items: [{ key: 'corrediza-39', x, y (0…1 del contenedor), s (ancho relativo), r (grados), z (profundidad 0.6…1.2) }]
 * opts.size(boxW) → ancho base en px; opts.edge: cuánto puede salirse una pieza del borde (fracción de su tamaño)
 * opts.onPick(item) al tocar; opts.tag: false para no mostrar la etiqueta; opts.parallax en px
 */
export function mountFloaters(box, items, opts = {}) {
  const { size = (w) => Math.min(w, 900), edge = 0.2, onPick = null, tag = true, parallax = 0, dark = false } = opts;
  box.classList.add('flo-box'); if (dark) box.classList.add('flo-box--dark');
  const list = items.map((it, i) => ({ ...it, i, ...floatPiece(it.key) })).filter((it) => it.pieza);
  const els = list.map((it) => {
    const el = document.createElement('div'); el.className = 'flo'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<img src="${url(it.img)}" alt="" width="${it.w}" height="${it.h}" draggable="false" loading="lazy" decoding="async">`;
    box.append(el); return el;
  });
  const tagEl = tag ? Object.assign(document.createElement('p'), { className: 'flo-tag' }) : null;
  if (tagEl) { tagEl.hidden = true; box.append(tagEl); }

  let W = 0, H = 0, raf = 0, last = 0, visible = false, held = null, t0 = performance.now(), off = 0, tagFor = null, tagTimer = 0;
  const S = list.map((it) => ({ x: 0, y: 0, vx: 0, vy: 0, a: (it.r || 0) * Math.PI / 180, va: 0, hx: 0, hy: 0, w: 0, h: 0, rad: 0, free: false, ph: it.i * 1.7 }));

  const layout = () => {
    const r = box.getBoundingClientRect(); const first = !W;
    const kx = W ? r.width / W : 1, ky = H ? r.height / H : 1;
    W = r.width; H = r.height; const base = size(W);
    list.forEach((it, k) => {
      // «s» es el lado mayor de la pieza: una pieza alta no sale más grande que una ancha
      const s = S[k], m = base * (it.s || 0.2) * (it.z || 1);
      if (it.w >= it.h) { s.w = m; s.h = m * it.h / it.w; } else { s.h = m; s.w = m * it.w / it.h; }
      s.rad = 0.36 * (s.w + s.h) / 2;
      els[k].style.width = `${s.w}px`; els[k].style.zIndex = String(Math.round((it.z || 1) * 10));
      if (first) { s.hx = s.x = it.x * W; s.hy = s.y = it.y * H; }
      else { s.x *= kx; s.y *= ky; s.hx *= kx; s.hy *= ky; }
    });
    draw();
  };

  const draw = () => {
    const t = (performance.now() - t0) / 1000, still = reduce();
    list.forEach((it, k) => {
      const s = S[k], bob = still || s.free || held === k ? 0 : Math.sin(t * 0.9 + s.ph) * 6 * (it.z || 1);
      const py = parallax ? off * parallax * ((it.z || 1) - 0.4) : 0;
      els[k].style.transform = `translate3d(${(s.x - s.w / 2).toFixed(1)}px, ${(s.y - s.h / 2 + bob + py).toFixed(1)}px, 0) rotate(${s.a.toFixed(3)}rad)`;
    });
    if (tagEl && tagFor !== null) {
      const s = S[tagFor];
      tagEl.style.transform = `translate3d(${Math.max(8, Math.min(W - tagEl.offsetWidth - 8, s.x - tagEl.offsetWidth / 2)).toFixed(0)}px, ${(s.y + s.h / 2 + 8 + (parallax ? off * parallax * ((list[tagFor].z || 1) - 0.4) : 0)).toFixed(0)}px, 0)`;
    }
  };

  const bounds = (s) => {
    const mx = s.w * (0.5 - edge), my = s.h * (0.5 - edge);
    let hit = false;
    if (s.x < mx) { s.x = mx; s.vx = Math.abs(s.vx) * 0.55; hit = true; }
    if (s.x > W - mx) { s.x = W - mx; s.vx = -Math.abs(s.vx) * 0.55; hit = true; }
    if (s.y < my) { s.y = my; s.vy = Math.abs(s.vy) * 0.55; hit = true; }
    if (s.y > H - my) { s.y = H - my; s.vy = -Math.abs(s.vy) * 0.55; hit = true; }
    if (hit) s.va *= -0.6;
  };

  const step = (dt) => {
    let moving = false;
    S.forEach((s, k) => {
      if (held === k) { moving = true; return; }
      if (s.free) {                                             // lanzada: se desliza y se frena
        const f = Math.exp(-1.9 * dt);
        s.vx *= f; s.vy *= f; s.va *= Math.exp(-2.4 * dt);
        s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt; bounds(s);
        if (Math.hypot(s.vx, s.vy) < 14 && Math.abs(s.va) < 0.2) { s.free = false; s.hx = s.x; s.hy = s.y; s.vx = s.vy = s.va = 0; }
        moving = true;
      } else {                                                  // en reposo: se queda donde la dejaste
        const ax = (s.hx - s.x) * 30 - s.vx * 11, ay = (s.hy - s.y) * 30 - s.vy * 11;
        s.vx += ax * dt; s.vy += ay * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.abs(s.hx - s.x) + Math.abs(s.hy - s.y) > 0.3) moving = true;
      }
    });
    // choques: círculos aproximados; la pieza que agarras empuja a las demás
    for (let a = 0; a < S.length; a++) for (let b = a + 1; b < S.length; b++) {
      const p = S[a], q = S[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.01, min = p.rad + q.rad;
      if (d >= min) continue;
      const nx = dx / d, ny = dy / d, o = min - d;
      const ma = held === a ? 0 : 1, mb = held === b ? 0 : 1, sum = ma + mb || 1;
      p.x -= nx * o * ma / sum; p.y -= ny * o * ma / sum; q.x += nx * o * mb / sum; q.y += ny * o * mb / sum;
      const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
      if (rv < 0) {
        const j = -1.5 * rv / sum;
        if (ma) { p.vx -= j * nx * ma; p.vy -= j * ny * ma; p.va += (Math.random() - 0.5) * 2; p.free = true; }
        if (mb) { q.vx += j * nx * mb; q.vy += j * ny * mb; q.va += (Math.random() - 0.5) * 2; q.free = true; }
      }
      moving = true;
    }
    return moving;
  };

  const loop = (t) => {
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
    const moving = step(dt); draw();
    raf = (visible && (moving || !reduce())) || held !== null ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  // ---------- agarrar, lanzar, tocar ----------
  let drag = null;
  els.forEach((el, k) => {
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      held = k; const s = S[k]; s.free = false; s.vx = s.vy = 0;
      drag = { k, id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: false, samples: [] };
      el.classList.add('is-held'); box.classList.add('is-playing'); wake();
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.k !== k || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 7) drag.moved = true;
      const s = S[k]; s.x += dx; s.y += dy; s.hx = s.x; s.hy = s.y;
      const now = performance.now(); drag.samples.push([now, e.clientX, e.clientY]);
      while (drag.samples.length > 2 && now - drag.samples[0][0] > 90) drag.samples.shift();
      s.a += (dx * 0.004 - s.a * 0.02);                      // se inclina hacia donde la llevas
      if (drag.moved && tagFor === k) hideTag();
    });
    const end = (e) => {
      if (!drag || drag.k !== k || e.pointerId !== drag.id) return;
      const s = S[k], d = drag; drag = null; held = null; el.classList.remove('is-held'); box.classList.remove('is-playing');
      if (!d.moved && performance.now() - d.t < 450) { s.hx = s.x; s.hy = s.y; pick(k); wake(); return; }
      const sm = d.samples, a = sm[0], b = sm[sm.length - 1];
      if (sm.length > 1 && b[0] - a[0] > 8 && performance.now() - b[0] < 80 && !reduce()) {
        const k1 = 1000 / (b[0] - a[0]), cap = 2600;
        s.vx = Math.max(-cap, Math.min(cap, (b[1] - a[1]) * k1)); s.vy = Math.max(-cap, Math.min(cap, (b[2] - a[2]) * k1));
        s.va = s.vx / 260; s.free = true;
      } else { s.hx = s.x; s.hy = s.y; bounds(s); s.hx = s.x; s.hy = s.y; }
      wake();
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });

  function hideTag() { if (tagEl) { tagEl.hidden = true; tagFor = null; } }
  function pick(k) {
    const it = list[k];
    els[k].animate([{ scale: 1 }, { scale: 1.14 }, { scale: 1 }], { duration: 360, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    if (onPick) onPick(it, k);
    if (!tagEl) return;
    const p = it.pieza;
    tagEl.innerHTML = `<b>${p.numero ? p.numero + ' · ' : ''}${p.nombre}</b><a href="${url('componentes/')}?id=${p.id}">Ver ficha</a>`;
    tagEl.hidden = false; tagFor = k; draw();
    clearTimeout(tagTimer); tagTimer = setTimeout(hideTag, 5000);
  }
  document.addEventListener('pointerdown', (e) => { if (tagEl && !tagEl.hidden && !box.contains(e.target)) hideTag(); });

  // ---------- en pantalla / tamaño / scroll ----------
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { if (!W) layout(); wake(); } }, { rootMargin: '10% 0px' }).observe(box);
  new ResizeObserver(() => { if (W) layout(); }).observe(box);
  if (parallax) {
    const onScroll = () => { if (!visible) return; const r = box.getBoundingClientRect(); off = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)); if (!raf) draw(); };
    addEventListener('scroll', onScroll, { passive: true });
  }
  layout();

  return {
    // levanta una pieza (desde la lista de al lado): crece un poco y se acerca
    focus(key) { list.forEach((it, k) => els[k].classList.toggle('is-focus', it.key === key)); box.classList.toggle('has-focus', !!key); },
    list,
  };
}

// Fase 10D/10E · Animación de cine para todo el sitio (Lusion / Active Theory / Apple):
//   · intro: pantalla azul marino con la marca; al estar lista la puerta 3D se abre como una vaivén
//   · títulos que entran por líneas (cada línea sube desde una ranura)
//   · scroll suave con inercia en computadora (Lenis); en pantallas táctiles, el scroll nativo
//   · cursor con anillo que crece sobre lo que se puede tocar y dice qué hace
// Todo se apaga con «reducir movimiento».
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { reducedMotion } from '../home/scrub.js';

const fine = () => matchMedia('(pointer: fine)').matches;
const quiet = () => reducedMotion() || new URLSearchParams(location.search).get('suave') === '0';

// ---------- intro ----------
// El HTML ya trae la intro (para que no se vea la página antes); aquí se decide cuándo abre. Abre cuando la puerta
// 3D está lista o a los 2.6 s, lo que pase primero, y nunca antes de 0.9 s (que se alcance a ver la marca).
export function intro(el, { onOpen } = {}) {
  if (!el) { onOpen && onOpen(); return { progress() {}, ready() {} }; }
  const t0 = performance.now(); let opened = false;
  const bar = el.querySelector('.intro__bar i');
  const open = () => {
    if (opened) return; opened = true;
    try { sessionStorage.setItem('st.intro', '1'); } catch { /* sin almacenamiento: se verá cada vez */ }
    const wait = Math.max(0, 900 - (performance.now() - t0));
    setTimeout(() => {
      el.classList.add('is-open'); onOpen && onOpen();
      setTimeout(() => el.remove(), 1500);
    }, wait);
  };
  const timer = setTimeout(open, 2600);
  return {
    progress(k) { if (bar) bar.style.transform = `scaleX(${Math.max(0.04, k)})`; },
    ready() { clearTimeout(timer); if (bar) bar.style.transform = 'scaleX(1)'; open(); },
  };
}

// ---------- títulos por líneas ----------
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function splitLines(el) {
  if (reducedMotion() || el.dataset.split) return el;
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const build = () => {
    el.innerHTML = text.split(' ').map((w) => `<span class="wd">${esc(w)}</span>`).join(' ');
    const lines = []; let top = null;
    el.querySelectorAll('.wd').forEach((w) => { if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; } lines[lines.length - 1].push(w.textContent); });
    el.innerHTML = lines.map((l, i) => `<span class="ln"><span class="ln__in" style="--i:${i}">${esc(l.join(' '))}</span></span>`).join(' ');
  };
  el.dataset.split = '1'; build();
  let w = el.clientWidth, tid = 0;
  new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) < 2) return; w = el.clientWidth; clearTimeout(tid); tid = setTimeout(build, 150); }).observe(el);
  return el;
}
// entra cuando se ve (una vez)
export function revealOnView(el) {
  splitLines(el); el.classList.add('is-pre');
  if (reducedMotion()) { el.classList.add('is-in'); return; }
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.35 }).observe(el);
}

// ---------- scroll suave ----------
export function smoothScroll() {
  if (window.__lenis) return window.__lenis;
  if (quiet() || !fine()) return null;
  const lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.95, anchors: true });
  window.__lenis = lenis;
  return lenis;
}

// ---------- cursor ----------
export function cursor() {
  if (document.querySelector('.cur')) return document.querySelector('.cur');
  if (quiet() || !fine()) return null;
  const c = document.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true');
  c.innerHTML = '<span class="cur__ring"></span><span class="cur__label"></span>';
  document.body.append(c);
  const label = c.querySelector('.cur__label');
  let x = innerWidth / 2, y = innerHeight / 2, sx = x, sy = y, run = false, ext = '';
  const loop = () => {
    sx += (x - sx) * 0.22; sy += (y - sy) * 0.22;
    c.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    if (Math.abs(x - sx) + Math.abs(y - sy) > 0.3) requestAnimationFrame(loop); else run = false;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY; c.classList.add('is-on');
    if (!run) { run = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  const set = () => {
    const t = document.querySelectorAll(':hover'); const el = t[t.length - 1];
    const hit = el && el.closest('a, button, [data-cur], input, select, textarea, label');
    const txt = ext || (hit && (hit.dataset.cur || (hit.matches('a') ? '' : ''))) || '';
    c.classList.toggle('is-link', !!hit || !!ext); c.classList.toggle('has-label', !!txt); label.textContent = txt;
  };
  document.addEventListener('pointerover', set, { passive: true });
  // otros módulos pueden pedir una etiqueta (la puerta 3D: «Empuja»)
  addEventListener('cur:label', (e) => { ext = e.detail || ''; set(); });
  return c;
}

// esconde las líneas ya mismo (sin transición) y en el cuadro siguiente las sube
export function playLines(el) {
  el.classList.remove('is-in'); el.classList.add('is-pre');
  void el.offsetWidth;
  requestAnimationFrame(() => el.classList.add('is-in'));
}

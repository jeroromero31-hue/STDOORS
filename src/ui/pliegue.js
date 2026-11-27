// Fase 14D · «Los dos lados»: solo en plegables abiertos (iPhone Duo y otros). El pliegue del teléfono es la pared:
// la mitad izquierda es AFUERA (24 °C, blanco) y la derecha es ADENTRO de la cámara (−18 °C, azul marino), cada una
// viendo de frente la misma puerta vaivén. Al abrirla, de afuera las hojas se van hacia el frío y de adentro vienen
// hacia ti; por el hueco se ve el otro cuarto; el vaho cruza el pliegue y las dos temperaturas se mueven. La vaivén
// regresa sola al centro (pasándose un poco, como la real) y el frío vuelve a su lado. Con el giroscopio (si se
// permite), las dos escenas se mueven con el teléfono.
// Las hojas y el marco son las mismas imágenes del Inicio (scripts/build-umbral.py). Solo transform y opacity.
import './pliegue.css';
import V0 from '../data/umbral.json';
import { url } from './site.js';

const V = V0.vaiven;
const MAXA = 72, T_OUT = 24, T_IN = -18;
const pct = (n) => `${(n * 100).toFixed(3)}%`;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const srcset = (o) => Object.entries(o).map(([w, f]) => `${url('img/umbral/' + f)} ${w}w`).join(', ');
const img = (o, sizes) => { const ws = Object.keys(o); return `<img src="${url('img/umbral/' + o[ws[0]])}" srcset="${srcset(o)}" sizes="${sizes}" alt="" decoding="async" draggable="false">`; };

function puerta(lado) {
  const [lx, ly, lw, lh] = V.izqRect, [rx, , rw] = V.derRect;
  const hueco = `left:${pct(lx)};top:${pct(ly)};width:${pct(rx + rw - lx)};height:${pct(lh)}`;
  return `<div class="plg__door" style="--ar:${V.w}/${V.h}">
      <span class="plg__hueco" style="${hueco}"><i></i></span>
      <span class="plg__leaf" data-i="0" style="left:${pct(lx)};top:${pct(ly)};width:${pct(lw)};height:${pct(lh)};transform-origin:0 50%">${img(V.izq, '25vw')}<i class="plg__shade"></i></span>
      <span class="plg__leaf" data-i="1" style="left:${pct(rx)};top:${pct(ly)};width:${pct(rw)};height:${pct(lh)};transform-origin:100% 50%">${img(V.der, '25vw')}<i class="plg__shade"></i></span>
      <span class="plg__marco">${img(V.marco, '50vw')}</span>
    </div>`;
}

let el = null;
export function openPliegue() {
  if (el) return;
  const back = document.activeElement;
  el = document.createElement('div');
  el.className = 'plg'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Los dos lados de la puerta');
  el.innerHTML = `
    <section class="plg__lado plg__lado--fuera" aria-label="Afuera">
      <h2 class="plg__nom">Afuera</h2>
      <p class="plg__temp"><span>Ambiente</span><b data-t="fuera">24.0</b><small>°C</small></p>
      <i class="plg__escarcha" aria-hidden="true"></i>
      <div class="plg__escena">${puerta('fuera')}<i class="plg__piso"></i><i class="plg__vaho"></i></div>
      <div class="plg__acc"><button type="button" class="btn plg__abrir" aria-pressed="false">Abrir</button></div>
      <p class="plg__lema" aria-hidden="true">El frío se queda</p>
    </section>
    <section class="plg__lado plg__lado--dentro" aria-label="Adentro de la cámara">
      <h2 class="plg__nom">Adentro</h2>
      <p class="plg__temp"><span>Cámara de congelación</span><b data-t="dentro">−18.0</b><small>°C</small></p>
      <i class="plg__escarcha" aria-hidden="true"></i>
      <div class="plg__escena">${puerta('dentro')}<i class="plg__piso"></i><i class="plg__luz"></i></div>
      <div class="plg__acc"><p class="plg__hint">Empuja la hoja de cualquiera de los dos lados.</p></div>
      <p class="plg__lema" aria-hidden="true">de su lado.</p>
    </section>
    <i class="plg__pared" aria-hidden="true"></i>
    <i class="plg__cruce" aria-hidden="true"></i>
    <p class="plg__nota" aria-live="polite">El pliegue de tu teléfono es la pared: a la izquierda, afuera; a la derecha, adentro de la cámara.</p>
    <button type="button" class="btn btn--line plg__x" aria-label="Salir de «Los dos lados»">Salir</button>`;
  el.style.setProperty('--escarcha', `url("${url('img/frio/escarcha.webp')}")`);
  el.style.setProperty('--vaho', `url("${url('img/umbral/vaho-banco.webp')}")`);
  document.body.append(el);
  document.documentElement.classList.add('plg-open');
  const $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)];
  const leaves = [...$$('.plg__lado--fuera .plg__leaf').map((e, i) => ({ e, i, side: 1 })), ...$$('.plg__lado--dentro .plg__leaf').map((e, i) => ({ e, i, side: -1 }))];
  const abrir = $('.plg__abrir'), nota = $('.plg__nota'), tf = $('[data-t=fuera]'), td = $('[data-t=dentro]');
  const fmt = (t) => `${t < 0 ? '−' : ''}${Math.abs(t).toFixed(1)}`;

  // ---------- física: ángulo de la hoja con resorte; abierta se sostiene un momento y regresa sola ----------
  let a = 0, v = 0, target = 0, holdUntil = 0, open = 0, tOut = T_OUT, tIn = T_IN, raf = 0, last = 0, tilt = { x: 0, y: 0 }, tiltNow = { x: 0, y: 0 };
  const setOpen = (on) => {
    target = on ? MAXA : 0; holdUntil = on ? performance.now() + 3200 : 0;
    abrir.setAttribute('aria-pressed', String(on)); abrir.textContent = on ? 'Cerrar' : 'Abrir';
    nota.textContent = on ? 'Abierta: el frío cruza el pliegue y adentro sube la temperatura. La vaivén regresa sola.' : 'Cerrada: el frío se queda de su lado.';
    if (reduced()) { a = target; v = 0; }
    kick();
  };
  const frame = (t) => {
    raf = 0; const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (holdUntil && t > holdUntil && target) { target = 0; holdUntil = 0; abrir.setAttribute('aria-pressed', 'false'); abrir.textContent = 'Abrir'; nota.textContent = 'Se cerró sola: el frío se queda de su lado.'; }
    const shut = target < 1, k = shut ? 55 : 120, z = shut ? 0.28 : 0.8;      // al cerrar, se pasa del centro y regresa
    v += (k * (target - a) - 2 * z * Math.sqrt(k) * v) * dt; a += v * dt;
    if (Math.abs(target - a) < 0.05 && Math.abs(v) < 0.05) { a = target; v = 0; }
    open = Math.max(0, Math.min(1, Math.abs(a) / MAXA));
    leaves.forEach(({ e, i, side }) => {
      // afuera, las hojas se van hacia el frío (hacia dentro de la pantalla); adentro, vienen hacia ti
      const dir = (i ? -1 : 1) * side;
      e.style.transform = `rotateY(${(dir * a).toFixed(2)}deg)`;
      e.lastChild.style.opacity = (Math.sin((Math.abs(a) * Math.PI) / 180) * 0.75).toFixed(3);
    });
    el.style.setProperty('--o', open.toFixed(3));
    // temperaturas: con la puerta abierta adentro sube y afuera baja un poco; cerrada, cada una regresa a la suya
    const goIn = open > 0.05 ? -6 : T_IN, goOut = open > 0.05 ? 19 : T_OUT;
    tIn += (goIn - tIn) * (1 - Math.exp(-dt * (open > 0.05 ? 0.35 * open : 0.25)));
    tOut += (goOut - tOut) * (1 - Math.exp(-dt * (open > 0.05 ? 0.5 * open : 0.3)));
    tf.textContent = fmt(tOut); td.textContent = fmt(tIn);
    el.style.setProperty('--frio', Math.max(0, Math.min(1, (T_OUT - tOut) / 5)).toFixed(3));
    tiltNow.x += (tilt.x - tiltNow.x) * 0.12; tiltNow.y += (tilt.y - tiltNow.y) * 0.12;
    el.style.setProperty('--tx', tiltNow.x.toFixed(3)); el.style.setProperty('--ty', tiltNow.y.toFixed(3));
    const moving = a !== target || Math.abs(tIn - (open > 0.05 ? -6 : T_IN)) > 0.05 || Math.abs(tOut - (open > 0.05 ? 19 : T_OUT)) > 0.05 || holdUntil || Math.abs(tilt.x - tiltNow.x) + Math.abs(tilt.y - tiltNow.y) > 0.002;
    if (moving && el) kick();
  };
  function kick() { if (!raf && el) raf = requestAnimationFrame(frame); }

  // ---------- empujar la hoja con el dedo, de cualquiera de los dos lados ----------
  let drag = null;
  $$('.plg__escena').forEach((s) => {
    s.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, a0: a, moved: false }; s.setPointerCapture(e.pointerId); });
    s.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = Math.abs(e.clientX - drag.x); if (dx > 6) drag.moved = true;
      if (drag.moved) { target = Math.max(0, Math.min(MAXA, drag.a0 + dx * 0.45)); holdUntil = performance.now() + 2400; kick(); }
    });
    const up = () => { if (!drag) return; const was = drag; drag = null; if (!was.moved) setOpen(target < 1); else setOpen(target > MAXA * 0.35); };
    s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
  });
  abrir.onclick = () => setOpen(abrir.getAttribute('aria-pressed') !== 'true');

  // ---------- giroscopio: las dos escenas se mueven con el teléfono (iPhone: pide permiso al tocar) ----------
  const onTilt = (e) => { if (e.gamma == null) return; tilt = { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30)) }; kick(); };
  const startTilt = () => { if (!reduced()) addEventListener('deviceorientation', onTilt); };
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') startTilt(); }).catch(() => {});
    else startTilt();
  } catch { /* sin giroscopio */ }

  // ---------- salir ----------
  const close = () => {
    if (!el) return; removeEventListener('deviceorientation', onTilt); removeEventListener('keydown', onKey);
    cancelAnimationFrame(raf); el.remove(); el = null; document.documentElement.classList.remove('plg-open');
    if (back && back.focus) back.focus();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { const f = [abrir, $('.plg__x')]; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[1].focus(); } else if (!e.shiftKey && document.activeElement === f[1]) { e.preventDefault(); f[0].focus(); } }
  };
  $('.plg__x').onclick = close; addEventListener('keydown', onKey);
  abrir.focus();
  // la primera vez se abre sola un momento para que se vea qué pasa
  setTimeout(() => { if (el && !target) setOpen(true); }, reduced() ? 0 : 900);
  return close;
}

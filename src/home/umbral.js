// Entrada del Inicio (Fase 14): «el umbral».
// Antes: la vaivén en 3D, una vista térmica y la cámara cruzando a un interior azul marino que ocupaba dos pantallas
// vacías (a quien probó el sitio le pareció raro bajar, ver todo azul y tener que seguir bajando). Ahora:
//   · Afuera, el muro, el piso y la vaivén. Son imágenes dibujadas con el mismo modelo 3D (scripts/build-umbral.py):
//     no se descarga el 3D (unos 2 MB menos) y en cualquier teléfono se mueve a 60 cuadros.
//   · Al bajar, las hojas abren hacia adentro con CSS 3D sobre su bisagra, con inercia de hoja pesada; el aire frío
//     sale como vaho blanco a ras de piso (el aire frío pesa); la cámara camina hacia el vano y lo cruza en una
//     bocanada de vaho. Del otro lado está la cámara fría, clara, con las tres puertas para elegir. Menos de una
//     pantalla de recorrido.
//   · Con la puerta cerrada, las hojas se empujan: arrastrar hacia la bisagra la abre, tocarla le da un empujón, y
//     con el ratón basta pasarlo rápido. Regresan solas y pasan un poco del centro hacia el otro lado antes de
//     quedarse quietas, como una vaivén de doble acción. Por debajo de las hojas se escapa un hilo de vaho.
// Solo se anima transform y opacity (los mueve la tarjeta gráfica); el bucle se detiene cuando todo queda quieto.
import data from '../data/umbral.json';
import { track, seg, easeInOut, reducedMotion, clamp01 } from './scrub.js';
import { url } from '../ui/site.js';

const V = data.vaiven;
// el vano (lo que tapan las dos hojas), en fracciones de la imagen del marco
const HOLE = { x: V.izqRect[0], y: V.izqRect[1], w: V.derRect[0] + V.derRect[2] - V.izqRect[0], h: V.izqRect[3] };
const MAXA = 92;                                   // la hoja abre hasta su tope, de canto
const rad = (d) => (d * Math.PI) / 180;

export function mountUmbral(section) {
  const $ = (s) => section.querySelector(s);
  const pin = $('.hx__pin'), out = $('.hx__out'), door = $('.hx__door'), inn = $('.hx__in'), copy = $('.hx__copy');
  const veil = $('.hx__veil'), spill = $('.hx__spill'), gap = $('.hx__gap'), cue = $('.hx__cue'), inT = $('.hx__inT'), cds = $('.hx__cds');
  const labels = [...section.querySelectorAll('.hx__pt')];   // por el vano se ven las puertas; sus nombres llegan al entrar
  if (!pin || !out || !door) return null;
  const walls = Object.fromEntries([...section.querySelectorAll('.hx__w')].map((w) => [w.dataset.w, w]));
  const leaves = [...section.querySelectorAll('.hx__leaf')].map((el, i) => ({
    el, dir: i ? -1 : 1, a: 0, v: 0, drag: null, sheen: el.querySelector('.hx__sheen'), shade: el.querySelector('.hx__shade'), last: '',
  }));
  const live = !reducedMotion();
  section.classList.toggle('hx--live', live);
  section.style.setProperty('--vaho-banco', `url("${url('img/umbral/vaho-banco.webp')}")`);
  section.style.setProperty('--vaho-nube', `url("${url('img/umbral/vaho-nube.webp')}")`);

  let P = 0, dirty = true, fogLv = 0, raf = 0, lastT = 0;

  // ---------- acomodo: el muro tapa todo menos el vano; se mide cada vez que cambia el tamaño ----------
  const L = { W: 0, H: 0, cx: 0, cy: 0, hw: 0, hh: 0, sEnd: 2.6 };
  const place = (el, x, y, w, h, W, H) => {
    if (!el) return;
    Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${Math.max(0, w)}px`, height: `${Math.max(0, h)}px`, backgroundSize: `${W}px ${H}px`, backgroundPosition: `${-x}px ${-y}px` });
  };
  const layout = () => {
    const W = out.clientWidth, H = out.clientHeight; if (!W || !H) return;
    // en vertical la puerta va entre el texto de arriba y los botones de abajo: se mide sin el movimiento del scroll
    const saved = copy.style.transform; copy.style.transform = 'none';
    const pr = pin.getBoundingClientRect(), wide = matchMedia('(min-aspect-ratio: 9/8) and (min-width: 700px)').matches;
    const AR = V.w / V.h;
    if (!wide) {
      const txt = [...copy.querySelectorAll('h1, .hx__lead')].map((e) => e.getBoundingClientRect().bottom - pr.top);
      const cta = [...copy.querySelectorAll('.hx__cta > *')].map((e) => e.getBoundingClientRect().top - pr.top);
      const top = Math.max(...txt) + 16, fb = H - Math.min(...cta) + 30;
      section.style.setProperty('--fb', `${Math.round(fb)}px`);
      section.style.setProperty('--dw', `${Math.round(Math.max(160, Math.min(W * 0.94, (H - fb - top) * AR)))}px`);
    } else {
      // al lado del texto: lo más grande que quepa a la derecha, de pie a 8 % del borde de abajo
      const right = Math.max(...[...copy.querySelectorAll('h1, .hx__lead, .hx__cta > *')].map((e) => e.getBoundingClientRect().right - pr.left));
      section.style.removeProperty('--fb');
      section.style.setProperty('--dw', `${Math.round(Math.max(240, Math.min(W - right - Math.max(48, W * 0.08), (H * 0.92 - 69 - 18) * AR)))}px`);
    }
    copy.style.transform = saved;
    const x0 = door.offsetLeft, y0 = door.offsetTop, dw = door.offsetWidth, dh = door.offsetHeight, x1 = x0 + dw, y1 = y0 + dh;
    place(walls.t, 0, 0, W, y0 + 1, W, H); place(walls.l, 0, y0, x0 + 1, dh, W, H); place(walls.r, x1 - 1, y0, W - x1 + 1, dh, W, H);
    place(walls.f, 0, y1 - 1, W, H - y1 + 1, W, H - y1 + 1); if (walls.f) walls.f.style.backgroundPosition = '0 0';
    Object.assign(L, { W, H, hw: (HOLE.w * dw) / 2, hh: (HOLE.h * dh) / 2, cx: x0 + (HOLE.x + HOLE.w / 2) * dw, cy: y0 + (HOLE.y + HOLE.h / 2) * dh });
    L.sEnd = Math.max(W / (2 * L.hw), H / (2 * L.hh)) * 1.08;
    out.style.transformOrigin = copy.style.transformOrigin = `${L.cx}px ${L.cy}px`;
    section.style.setProperty('--persp', `${Math.round(dw * 2.3)}px`);
    section.classList.add('is-set');
    dirty = true; kick();
  };

  // ---------- avance del scroll ----------
  if (live) track(section, (p) => { P = p; dirty = true; kick(); }, { mode: 'pin', smooth: 10 });

  // ---------- empujar las hojas ----------
  const closed = () => P < 0.06;
  const impulse = (f, v) => { f.v += v; kick(); };
  door.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.hx__leaf'); if (!el || !closed() || !live) return;
    const f = leaves.find((x) => x.el === el);
    f.drag = { x: e.clientX, y: e.clientY, a0: f.a, t: performance.now(), moved: false, id: e.pointerId, vx: 0, lx: e.clientX, lt: performance.now() };
  });
  addEventListener('pointermove', (e) => {
    for (const f of leaves) {
      const d = f.drag; if (!d || d.id !== e.pointerId) continue;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { f.drag = null; continue; }   // era scroll
      if (Math.abs(dx) > 6) d.moved = true;
      if (!d.moved) continue;
      const t = performance.now(), w = f.el.offsetWidth || 1;
      // arrastrar la orilla libre hacia la bisagra la empuja hacia adentro
      f.a = Math.max(-18, Math.min(MAXA, d.a0 - f.dir * (dx / w) * 115));
      d.vx = (-f.dir * ((e.clientX - d.lx) / w) * 115) / Math.max(0.008, (t - d.lt) / 1000); d.lx = e.clientX; d.lt = t;
      f.v = 0; kick();
    }
  }, { passive: true });
  const release = (e) => {
    for (const f of leaves) {
      const d = f.drag; if (!d || (e && d.id !== e.pointerId)) continue;
      f.drag = null;
      if (d.moved) f.v = Math.max(-500, Math.min(500, d.vx * 0.6));
      else if (performance.now() - d.t < 450) { impulse(f, 230); buzz(); }       // un toque: un empujón
      kick();
    }
  };
  addEventListener('pointerup', release, { passive: true });
  // si el navegador toma el gesto (el dedo empezó a desplazar la página), no cuenta como toque
  addEventListener('pointercancel', (e) => { for (const f of leaves) if (f.drag && f.drag.id === e.pointerId) { if (f.drag.moved) f.v = Math.max(-500, Math.min(500, f.drag.vx * 0.6)); f.drag = null; kick(); } }, { passive: true });
  // con el ratón basta pasarlo rápido sobre una hoja, como quien la empuja al pasar
  if (matchMedia('(pointer: fine)').matches) {
    let last = null, over = false;
    door.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest('.hx__leaf'), on = !!el && closed() && live;
      if (on !== over) { over = on; dispatchEvent(new CustomEvent('cur:label', { detail: on ? 'Empuja' : '' })); }
      const t = performance.now();
      if (el && last && closed() && live) {
        const sp = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(8, t - last.t) * 1000;   // px/s
        const f = leaves.find((x) => x.el === el);
        if (sp > 650 && !f.drag && f.a < 20) impulse(f, Math.min(260, sp * 0.09));
      }
      last = { x: e.clientX, y: e.clientY, t };
    }, { passive: true });
    door.addEventListener('pointerleave', () => { if (over) { over = false; dispatchEvent(new CustomEvent('cur:label', { detail: '' })); } last = null; });
  }
  let buzzed = 0;
  const buzz = () => { const t = performance.now(); if (t - buzzed < 400) return; buzzed = t; try { navigator.vibrate && navigator.vibrate(8); } catch { /* sin vibración */ } };

  // ---------- un cuadro ----------
  const setT = (el, v) => { if (el && el.__t !== v) { el.__t = v; el.style.transform = v; } };
  const setO = (el, v) => { const s = v.toFixed(3); if (el && el.__o !== s) { el.__o = s; el.style.opacity = s; } };
  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    let moving = false;
    // hojas: el scroll pone el ángulo de destino; la hoja lo sigue como hoja pesada (resorte con amortiguamiento).
    // Cerrada, el resorte es el de la bisagra de doble acción: regresa al centro y lo pasa un poco antes de quedarse.
    const tgt = [MAXA * easeInOut(seg(P, 0.02, 0.5)), MAXA * easeInOut(seg(P, 0.07, 0.55))];
    leaves.forEach((f, i) => {
      if (!f.drag) {
        const to = tgt[i], shut = to < 1.5, k = shut ? 60 : 150, z = shut ? 0.3 : 0.82;
        f.v += (k * (to - f.a) - 2 * z * Math.sqrt(k) * f.v) * dt; f.a += f.v * dt;
        if (f.a > MAXA) { f.a = MAXA; f.v = Math.min(0, f.v); }
        if (f.a < -22) { f.a = -22; f.v = Math.max(0, f.v); }
        if (Math.abs(to - f.a) < 0.03 && Math.abs(f.v) < 0.05) { f.a = to; f.v = 0; } else moving = true;
      }
      const a = f.a, tr = `rotateY(${(f.dir * a).toFixed(2)}deg)`;
      if (tr !== f.last) {
        f.last = tr; f.el.style.transform = tr;
        // la cara se aleja de la luz del pasillo: se oscurece hacia la orilla libre; un brillo del inoxidable la cruza
        setO(f.shade, clamp01(Math.sin(rad(Math.max(0, a))) * 0.95));
        const sx = a > 0 ? -110 + (a / 55) * 330 : -110 + (-a / 20) * 140;
        setT(f.sheen, `translate3d(${f.dir > 0 ? sx : -sx}%, 0, 0)`);
        setO(f.sheen, Math.abs(a) > 0.4 && sx < 230 ? 1 : 0);
      }
    });
    // vaho: se junta mientras la puerta está abierta y se va disipando al cerrar (con retraso, como el aire)
    const open = Math.max(0, ...leaves.map((f) => f.a)) / MAXA;
    const want = Math.min(1, open * 1.6), prev = fogLv;
    fogLv += (want - fogLv) * (1 - Math.exp(-dt * (want > fogLv ? 2.6 : 0.9)));
    if (Math.abs(want - fogLv) > 0.002) moving = true; else fogLv = want;
    const foggy = fogLv > 0.03;
    if (foggy !== section.__fog) { section.__fog = foggy; section.classList.toggle('is-foggy', foggy); }
    if (Math.abs(prev - fogLv) > 1e-4 || dirty) {
      setO(spill, 0.16 + 0.84 * fogLv);
      setT(spill, `translate3d(0, ${(-4 * fogLv).toFixed(2)}%, 0) scale(${(1 + 0.55 * fogLv).toFixed(4)}, ${(1 + 0.9 * fogLv).toFixed(4)})`);
      setO(gap, clamp01(open * 2.2) * 0.9);
    }
    if (dirty && !live) dirty = false;          // con «movimiento reducido» todo queda como lo pone el CSS
    if (dirty) {
      dirty = false;
      // caminar hacia la puerta y cruzarla: el muro crece desde el centro del vano y el vano va al centro de la pantalla
      const k = easeInOut(seg(P, 0.2, 0.96)), s = 1 + (L.sEnd - 1) * k * k;
      const dx = (L.W / 2 - L.cx) * k, dy = (L.H / 2 - L.cy) * k;
      const tOut = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      const through = P > 0.955;
      if (through !== out.__h) { out.__h = through; out.style.visibility = through ? 'hidden' : ''; }
      if (!through) setT(out, tOut);
      // el texto está pintado en el muro: se va con él, y se desvanece antes de que crezca demasiado
      setT(copy, P > 0.002 ? `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s.toFixed(4)})` : '');
      const ct = 1 - seg(P, 0.04, 0.26); setO(copy, ct); copy.style.visibility = ct < 0.01 ? 'hidden' : '';
      setO(cue, 1 - seg(P, 0, 0.04));
      // adentro: está más lejos que el muro, así que crece menos (profundidad); al final queda quieto y nítido
      if (P > 0.995) { setT(inn, 'none'); inn.classList.add('is-here'); } else {
        inn.classList.remove('is-here');
        setT(inn, `translate3d(${((L.cx - L.W / 2) * (1 - k)).toFixed(1)}px, ${((L.cy - L.H / 2) * (1 - k)).toFixed(1)}px, 0) scale(${(0.72 + 0.28 * k).toFixed(4)})`);
      }
      const inK = seg(P, 0.6, 0.86); setO(inT, inK); labels.forEach((el) => setO(el, inK)); setO(cds, inK);
      section.classList.toggle('is-in', P > 0.9);
      // la bocanada de vaho al cruzar el vano
      const vv = seg(P, 0.48, 0.7) * (1 - seg(P, 0.76, 0.95));
      setO(veil, vv * 0.9); veil.style.visibility = vv < 0.005 ? 'hidden' : 'visible';
      setT(veil, `scale(${(1 + 0.25 * k).toFixed(4)})`);
    }
    if (moving || leaves.some((f) => f.drag)) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  // ---------- arranque ----------
  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 80); });
  if (document.fonts) document.fonts.ready.then(layout);
  new ResizeObserver(() => layout()).observe(pin);
  // fuera de pantalla, el vaho deja de moverse (sus animaciones de CSS)
  new IntersectionObserver(([e]) => section.classList.toggle('is-away', !e.isIntersecting), { rootMargin: '10% 0px' }).observe(pin);
  // la puerta «respira» una vez al cargar: la diferencia de presión del cuarto frío empuja las hojas y regresan solas
  const imgs = [...door.querySelectorAll('img')];
  Promise.all(imgs.map((im) => (im.decode ? im.decode() : Promise.resolve()).catch(() => {}))).then(() => {
    section.classList.add('is-ready');
    if (!live) return;
    setTimeout(() => { if (closed()) { impulse(leaves[0], 70); setTimeout(() => impulse(leaves[1], 58), 140); } }, 650);
  });
  // con el teclado: si el foco llega a las puertas de adentro, se cruza la puerta para que se vean
  inn.addEventListener('focusin', () => { if (live && P < 0.95) scrollTo({ top: section.offsetTop + section.offsetHeight - innerHeight, behavior: 'instant' }); });
  window.__umbral = { get p() { return P; }, leaves, L, layout, get fog() { return fogLv; } };   // para las pruebas
  return { layout };
}

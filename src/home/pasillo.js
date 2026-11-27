// Fase 14B · «El pasillo»: lo que hay del otro lado de la vaivén de la entrada. Cuatro puertas instaladas en un muro
// de paneles, a escala, cada una con la pantalla de su cuarto. Tocar una puerta la abre a su manera:
//   · abatible: gira hacia ti sobre su bisagra, como hoja pesada, y se queda abierta;
//   · corrediza: sube de su asiento y corre sobre el riel (la misma cinemática del 3D);
//   · vaivén: abre hacia adentro y regresa sola, pasando un poco del centro (doble acción);
//   · CDS: la puerta que tocas abre hacia afuera y se queda a 90°.
// Abierta, la temperatura de su pantalla sube (de ejemplo) y sale vaho a ras de piso; al cerrar se recupera.
// Las capas son imágenes del mismo modelo 3D (scripts/build-pasillo.py); aquí solo se mueven con transform.
import { motion } from '../viewers/corrediza.kinematics.js';
import { reducedMotion } from './scrub.js';

const KIND = {
  abatible: { max: 52, k: 26, z: 0.72 },              // hoja pesada que se queda
  corrediza: { slide: true, k: 9, z: 0.95 },          // corre despacio sobre el riel
  vaiven: { max: 70, k: 60, z: 0.3, back: 1500 },     // regresa sola (doble acción)
  cds: { max: 90, k: 34, z: 0.8 },                    // se queda a 90°
};
const DROP = 0.026;                                    // la corrediza baja 2.6 cm al asentar (corrediza.kinematics.js)

export function mountPasillo(root) {
  const track = root.querySelector('.pas__track'), row = root.querySelector('.pas__row');
  if (!track || !row) return null;
  const still = reducedMotion();
  const tabs = [...root.querySelectorAll('.pas__tabs button')], arrows = [...root.querySelectorAll('.pas__arrow')];
  const items = [...root.querySelectorAll('.pas')].map((li, i) => {
    const kind = li.dataset.door, K = KIND[kind];
    return {
      li, i, kind, K, btn: li.querySelector('.pas__door'), led: li.querySelector('.pas__led'), spill: li.querySelector('.pas__spill'),
      parts: [...li.querySelectorAll('.pas__mv')].map((el) => ({ el, k: el.dataset.k, a: 0, v: 0, to: 0, shade: el.querySelector('.pas__shade'), last: '' })),
      t0: +li.dataset.t, t: +li.dataset.t, fog: 0, open: false, timer: 0, shown: '', mw: +li.style.getPropertyValue('--mw'), mh: +li.style.getPropertyValue('--mh'),
      viaje: +li.style.getPropertyValue('--viaje') || 0,
    };
  });

  // ---------- acomodo: en el teléfono una puerta por vista, cada una a su tamaño; en pantallas anchas, a escala ----------
  const wideQ = matchMedia('(min-width: 700px) and (min-aspect-ratio: 5/4)');   // también teléfonos acostados
  let cur = 0;
  let fits = false;
  const layout = () => {
    const tw = track.clientWidth, th = track.clientHeight; if (!tw || !th) return;
    fits = false;
    const txtH = parseFloat(getComputedStyle(root).getPropertyValue('--txtH')) || 136;
    const disp = (items[0] && items[0].li.querySelector('.pas__disp').offsetHeight) || 52;
    const avail = Math.max(70, th - txtH - disp - 30);                 // la pantalla de arriba, su separación y aire
    root.style.setProperty('--trackW', `${tw}px`);
    const wide = wideQ.matches && !root.closest('.pleg-pane');            // en la página derecha del modo plegable: una puerta por vista
    root.classList.toggle('pas--wide', wide);
    if (wide) {
      // a escala, lo más grande que quepa a lo alto; y si cabe a lo ancho, las cuatro a la vista (si no, se recorre)
      const slots = (ppm) => items.reduce((s, it) => s + Math.max(it.mw * ppm + 24, 216), 0) + 0.3 * ppm * (items.length - 1) + 96;
      let ppm = Math.min(avail / Math.max(...items.map((it) => it.mh)), 230);
      // si a lo ancho tendrían que quedar muy chicas (menos de 80 px por metro), mejor se recorre el pasillo; nunca más altas de lo que cabe
      if (slots(ppm) > tw) { let lo = 30, hi = ppm; for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (slots(m) <= tw) lo = m; else hi = m; } ppm = lo >= 80 ? lo : Math.min(ppm, 80); }
      row.style.setProperty('--ppm', `${ppm.toFixed(1)}px`);
      items.forEach((it) => it.li.style.removeProperty('--k'));
      root.style.setProperty('--pj', `${(1.15 * ppm).toFixed(1)}px`);
      row.style.setProperty('--rowW', `${Math.round(slots(ppm) - 96)}px`);
      fits = slots(ppm) <= tw + 1;
    } else {
      items.forEach((it) => it.li.style.setProperty('--k', `${Math.min((tw * 0.84 * 0.9) / it.mw, avail / it.mh).toFixed(1)}px`));   // cada una a su tamaño; asoma la siguiente
      root.style.setProperty('--pj', '120px');
    }
    arrowsState();
    root.classList.toggle('pas--fits', wide && fits);
  };

  // ---------- abrir y cerrar ----------
  const setOpen = (it, open, part) => {
    it.open = open; clearTimeout(it.timer);
    it.li.classList.toggle('is-open', open);
    it.btn.setAttribute('aria-pressed', String(open));
    it.btn.setAttribute('aria-label', `${open ? 'Cerrar' : 'Abrir'} ${it.btn.getAttribute('aria-label').replace(/^(Abrir|Cerrar) /, '')}`);
    if (it.kind === 'cds') {
      // la puerta que tocaste (o la del centro con el teclado); las demás se cierran
      const target = part || it.parts[1];
      it.parts.forEach((p) => { p.to = open && p === target ? it.K.max : 0; });
      it.open = it.parts.some((p) => p.to > 0); it.li.classList.toggle('is-open', it.open); it.btn.setAttribute('aria-pressed', String(it.open));
    } else if (it.K.slide) it.parts.forEach((p) => { p.to = open ? (p.k === 'hoja' ? 1 : 0) : 0; });
    else it.parts.forEach((p) => { p.to = open ? it.K.max : 0; });
    if (open && it.K.back) it.timer = setTimeout(() => setOpen(it, false), it.K.back);   // la vaivén regresa sola
    if (still) it.parts.forEach((p) => { p.a = p.to; p.v = 0; });
    if (open) try { navigator.vibrate && navigator.vibrate(8); } catch { /* sin vibración */ }
    kick(); warm();
  };
  let dragMoved = false;
  items.forEach((it) => it.btn.addEventListener('click', (e) => {
    if (dragMoved) { e.preventDefault(); return; }
    // CDS: ¿qué puerta tocaste? (por dónde cayó el toque sobre el juego de tres)
    let part = null;
    if (it.kind === 'cds' && e.clientX) {
      const r = it.btn.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      part = it.parts[Math.max(0, Math.min(2, Math.floor(x * 3)))];
      const same = part.to > 0;
      setOpen(it, !same, part); return;
    }
    setOpen(it, !it.open);
  }));

  // ---------- un cuadro ----------
  let raf = 0, last = 0;
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    let moving = false;
    for (const it of items) {
      const w = it.btn.offsetWidth, h = it.btn.offsetHeight;
      let open = 0;
      for (const p of it.parts) {
        if (!still) {
          const goal = p.to, k = it.K.k, shut = goal === 0 && !it.K.slide, z = shut && it.kind === 'vaiven' ? 0.3 : it.K.z;
          p.v += (k * (goal - p.a) - 2 * z * Math.sqrt(k) * p.v) * dt; p.a += p.v * dt;
          if (!it.K.slide) { if (p.a > it.K.max + 4) { p.a = it.K.max + 4; p.v = Math.min(0, p.v); } if (p.a < -20) { p.a = -20; p.v = Math.max(0, p.v); } }
          else p.a = Math.max(0, Math.min(1, p.a));
          const eps = it.K.slide ? 0.0005 : 0.03;
          if (Math.abs(goal - p.a) < eps && Math.abs(p.v) < eps) { p.a = goal; p.v = 0; } else moving = true;
        }
        let tr;
        if (it.K.slide) {
          if (p.k !== 'hoja') continue;
          const m = motion(p.a), x = (m.x / 1.92) * it.viaje * w, y = -(1 - m.seat) * (DROP / it.mh) * h;
          tr = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; open = Math.max(open, p.a);
        } else {
          // abatible y CDS abren hacia ti (giro negativo con la bisagra a la izquierda); la vaivén, hacia adentro
          const sgn = it.kind === 'vaiven' ? (p.k === 'izq' ? 1 : -1) : -1;
          tr = `rotateY(${(sgn * p.a).toFixed(2)}deg)`; open = Math.max(open, Math.abs(p.a) / it.K.max);
        }
        if (tr !== p.last) {
          p.last = tr; p.el.style.transform = tr;
          if (p.shade) p.shade.style.opacity = it.K.slide ? 0 : Math.min(0.9, Math.sin((Math.abs(p.a) * Math.PI) / 180) * 0.8).toFixed(3);
        }
      }
      // vaho: se junta mientras está abierta y se va despacio al cerrar
      const want = Math.min(1, open * 1.4), f0 = it.fog;
      it.fog += (want - it.fog) * (1 - Math.exp(-dt * (want > it.fog ? 2.4 : 0.8)));
      if (Math.abs(want - it.fog) > 0.003) moving = true; else it.fog = want;
      if (Math.abs(f0 - it.fog) > 1e-4 || it.fog === want) {
        it.spill.style.opacity = it.fog.toFixed(3);
        it.spill.style.transform = `scale(${(0.8 + 0.5 * it.fog).toFixed(3)}, ${(0.6 + 0.8 * it.fog).toFixed(3)})`;
      }
      it.openness = open;
    }
    if (moving) kick();
  }

  // ---------- temperatura de cada cuarto (de ejemplo): sube si la puerta se queda abierta ----------
  let tid = 0;
  const fmt = (v) => `${v < -0.05 ? '−' : ''}${Math.abs(v).toFixed(1)}`;
  const tick = () => {
    let busy = false;
    for (const it of items) {
      const o = it.openness || 0, goal = it.t0 + 7.5 * o;
      it.t += (goal - it.t) * (o > 0.05 ? 0.06 : 0.025);
      if (Math.abs(goal - it.t) > 0.04 || o > 0.05) busy = true; else it.t = goal;
      const s = fmt(it.t);
      if (s !== it.shown && !it.powering) { it.shown = s; it.led.textContent = s; }
      it.li.classList.toggle('is-warm', it.t - it.t0 > 1.2);
      it.li.classList.toggle('is-alarm', it.t - it.t0 > 4);
    }
    tid = busy ? setTimeout(tick, 200) : 0;
  };
  const warm = () => { if (!tid) tid = setTimeout(tick, 200); };

  // ---------- recorrer el pasillo ----------
  const center = (i, smooth = true) => {
    const li = items[i].li, left = li.offsetLeft - (track.clientWidth - li.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: smooth && !still ? 'smooth' : 'instant' });
  };
  const nearest = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, d = Infinity;
    items.forEach((it, i) => { const c = it.li.offsetLeft + it.li.offsetWidth / 2, x = Math.abs(c - mid); if (x < d) { d = x; best = i; } });
    return best;
  };
  function arrowsState() {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (arrows[0]) arrows[0].disabled = track.scrollLeft < 2;
    if (arrows[1]) arrows[1].disabled = track.scrollLeft > max;
  }
  let sraf = 0;
  track.addEventListener('scroll', () => {
    if (sraf) return;
    sraf = requestAnimationFrame(() => {
      sraf = 0; const n = nearest();
      if (n !== cur) { cur = n; tabs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n))); }
      arrowsState();
    });
  }, { passive: true });
  tabs.forEach((b, i) => b.addEventListener('click', () => center(i)));
  arrows.forEach((b) => b.addEventListener('click', () => center(Math.max(0, Math.min(items.length - 1, nearest() + +b.dataset.dir)))));
  // con el ratón: arrastrar el pasillo para recorrerlo (un arrastre no abre la puerta)
  let drag = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !root.classList.contains('pas--wide') || root.classList.contains('pas--fits') || e.target.closest('a, .pas__tabs')) return;
    drag = { x: e.clientX, left: track.scrollLeft }; dragMoved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!dragMoved && Math.abs(dx) > 6) { dragMoved = true; track.classList.add('is-drag'); }
    if (dragMoved) track.scrollLeft = drag.left - dx;
  }, { passive: true });
  addEventListener('pointerup', () => {
    if (!drag) return; drag = null; track.classList.remove('is-drag');
    if (dragMoved) setTimeout(() => { dragMoved = false; }, 0);
  });
  // el foco del teclado lleva el pasillo a esa puerta
  root.addEventListener('focusin', (e) => { const li = e.target.closest('.pas'); if (li) { const i = items.findIndex((it) => it.li === li); if (i >= 0 && i !== nearest()) center(i, false); } });

  // ---------- al llegar: las pantallas se encienden y las puertas a la vista se asoman un poco ----------
  let greeted = false;
  const greet = () => {
    if (greeted) return; greeted = true;
    const tr = track.getBoundingClientRect();
    items.forEach((it, n) => {
      it.powering = true; it.led.textContent = '88.8'; it.li.classList.add('is-boot');
      setTimeout(() => { it.powering = false; it.shown = ''; it.li.classList.remove('is-boot'); it.led.textContent = fmt(it.t); }, 380 + n * 140);
      const r = it.li.getBoundingClientRect();
      if (still || r.right < tr.left + 20 || r.left > tr.right - 20) return;
      setTimeout(() => {
        if (it.open) return;
        if (it.K.slide) { it.parts.forEach((p) => { if (p.k === 'hoja') p.v += 0.5; }); }
        else { const p = it.kind === 'cds' ? it.parts[1] : null; (p ? [p] : it.parts).forEach((q) => { q.v += it.kind === 'vaiven' ? 70 : 55; }); }
        kick();
      }, 700 + n * 260);
    });
  };
  document.addEventListener('umbral:adentro', greet);

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 80); });
  new ResizeObserver(() => layout()).observe(track);
  window.__pasillo = { items, layout, center, greet, nearest, get cur() { return cur; } };   // para las pruebas
  return { layout };
}

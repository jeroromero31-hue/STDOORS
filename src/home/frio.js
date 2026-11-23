// «Baja a −20 °C» (Fase 11B). El Inicio se recorre como si bajaras la temperatura: de 30 °C afuera a −20 °C adentro.
// - Termómetro en el borde: marca dónde vas (la temperatura baja con el scroll) y, al tocarlo, abre los capítulos para
//   brincar a cualquiera. Debajo de 0 °C la pantalla se escarcha en las orillas; si regresas, se derrite.
// - Recorrido de 60 s: la página se recorre sola, capítulo por capítulo, con una línea que dice qué estás viendo.
//   Tocar la pantalla lo pausa (tú tomas el control); «Siguiente» brinca; «Salir» lo deja.
// No toca el diseño de las secciones: solo se monta encima.
import '../styles/frio.css';

const $ = (s, r = document) => r.querySelector(s);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// capítulos: sección, nombre, temperatura y qué hacer en el recorrido (seg: segundos recorriendo, hold: segundos quieto)
const CHAPTERS = [
  { sel: '#hx', name: 'Afuera', t: 30, cap: 'Afuera hace 30 °C. La vaivén se abre y entras a la cámara.', seg: 9, hold: 0.6, through: true },
  { sel: '#say', name: 'Un solo trabajo', t: 18, cap: 'Un solo trabajo: que el frío se quede adentro.', seg: 3.5, hold: 0.8, through: true },
  { sel: '.ch[data-door=abatible]', name: 'Abatible', t: 8, cap: 'Abatible: para cámaras de refrigeración y congelación.', seg: 2.2, hold: 2.4 },
  { sel: '.ch[data-door=corrediza]', name: 'Corrediza', t: 4, cap: 'Corrediza: para vanos anchos y paso de montacargas.', seg: 2, hold: 2.4 },
  { sel: '.ch[data-door=vaiven]', name: 'Vaivén', t: 1, cap: 'Vaivén: cocinas y pasillos; abre a los dos lados.', seg: 2, hold: 2.4 },
  { sel: '#escaner', name: 'Por dentro', t: -3, cap: 'Bajo cero. Rayos X: cada pieza, con su número.', seg: 6.5, hold: 0.8, through: true },
  { sel: '.sys', name: 'Cada pieza', t: -8, cap: 'Más de 70 piezas de repuesto, con foto y número.', seg: 3, hold: 2.2 },
  { sel: '#cdsSeq', name: 'CDS Legacy', t: -12, cap: 'CDS Legacy: la puerta de exhibición se abre sola.', seg: 6.5, hold: 0.8, through: true },
  { sel: '#medida', name: 'A tu medida', t: -16, cap: 'Hecha a la medida de tu vano: escribe la tuya.', seg: 2, hold: 3 },
  { sel: '#out', name: 'Cotiza', t: -20, cap: '−20 °C. Llegaste: cotiza tu puerta.', seg: 2, hold: 2 },
];

export function mountFrio() {
  const chs = CHAPTERS.map((c) => ({ ...c, el: $(c.sel) })).filter((c) => c.el);
  if (chs.length < 4) return;
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const maxY = () => document.documentElement.scrollHeight - innerHeight;

  // ---------- termómetro ----------
  const th = document.createElement('div');
  th.className = 'thermo';
  th.innerHTML = `
    <button type="button" class="thermo__btn" aria-expanded="false" aria-controls="thermoList" aria-label="30°C: termómetro del recorrido, Afuera. Toca para ver los capítulos">
      <span class="thermo__tube" aria-hidden="true"><i class="thermo__hg"></i>${chs.map((c) => `<b style="--y:${((30 - c.t) / 50).toFixed(3)}"></b>`).join('')}</span>
      <span class="thermo__bulb" aria-hidden="true"></span>
      <span class="thermo__read" aria-hidden="true"><b>30</b>°C</span>
    </button>
    <div class="thermo__panel" id="thermoList" hidden>
      <p class="thermo__h">Baja a −20 °C</p>
      <button type="button" class="thermo__play" data-play>Recorrido de 60 s</button>
      <ol class="thermo__list">${chs.map((c, i) => `<li><button type="button" data-ch="${i}"><span class="thermo__t">${c.t > 0 ? c.t : c.t === 0 ? '0' : '−' + Math.abs(c.t)}°</span><span>${c.name}</span></button></li>`).join('')}</ol>
    </div>`;
  document.body.append(th);
  const frost = document.createElement('div'); frost.className = 'frost'; frost.setAttribute('aria-hidden', 'true'); document.body.append(frost);
  const btn = $('.thermo__btn', th), panel = $('.thermo__panel', th), read = $('.thermo__read b', th);

  let tops = [], lastT = 30, crossed = false, ticking = false, idle = 0;
  const measure = () => { tops = chs.map((c) => top(c.el)); };
  // temperatura según el scroll: interpola entre el inicio de cada capítulo
  const tempAt = (y) => {
    if (y < 8) return chs[0].t;                                   // arriba de todo: afuera, 30 °C
    const ref = y + innerHeight * 0.35;
    if (ref <= tops[0]) return chs[0].t;
    for (let i = 0; i < chs.length - 1; i++) if (ref < tops[i + 1]) return lerp(chs[i].t, chs[i + 1].t, clamp((ref - tops[i]) / Math.max(1, tops[i + 1] - tops[i])));
    return chs[chs.length - 1].t;
  };
  const chapterAt = (y) => { const ref = y + innerHeight * 0.35; let k = 0; tops.forEach((t, i) => { if (ref >= t - 2) k = i; }); return k; };
  const frame = () => {
    ticking = false;
    const T = tempAt(scrollY), k = clamp((30 - T) / 50);
    th.style.setProperty('--k', k.toFixed(4));
    const r = Math.round(T); read.textContent = r < 0 ? `−${-r}` : `${r}`;
    th.classList.toggle('is-cold', T < 0);
    frost.style.setProperty('--frost', clamp(-T / 20).toFixed(3));
    if (Math.round(lastT) !== r || !btn.dataset.l) { btn.dataset.l = 1; btn.setAttribute('aria-label', `${read.textContent}°C: termómetro del recorrido, ${chs[chapterAt(scrollY)].name}. Toca para ver los capítulos`); }
    // al cruzar 0 °C, un toque de vibración (si el teléfono lo permite)
    if (lastT >= 0 && T < 0 && !crossed) { crossed = true; try { navigator.vibrate && navigator.vibrate(12); } catch { /* sin vibración */ } }
    if (T > 2) crossed = false;
    lastT = T;
    th.classList.add('is-live'); clearTimeout(idle); idle = setTimeout(() => th.classList.remove('is-live'), 1400);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
  measure(); frame();

  // abrir y cerrar los capítulos
  const open = (v) => { panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); th.classList.toggle('is-open', v); };
  btn.onclick = () => open(panel.hidden);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !th.contains(e.target)) open(false); });
  const scrollToY = (y, smooth) => {
    const L = window.__lenis;
    if (L) L.scrollTo(y, smooth ? { duration: 1.1 } : { immediate: true, force: true });
    else scrollTo({ top: y, behavior: smooth && !reduced() ? 'smooth' : 'instant' });   // «instant»: el CSS pide scroll suave
  };
  panel.querySelectorAll('[data-ch]').forEach((b) => {
    b.onclick = () => { measure(); open(false); tour.stop(); scrollToY(Math.min(maxY(), tops[+b.dataset.ch] + (+b.dataset.ch === 0 ? 0 : 1)), true); };
  });

  // ---------- recorrido de 60 s ----------
  const bar = document.createElement('div');
  bar.className = 'tour'; bar.hidden = true;
  bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Recorrido de 60 segundos');
  bar.innerHTML = `
    <span class="tour__prog" aria-hidden="true"><i></i></span>
    <p class="tour__cap" aria-live="polite"></p>
    <div class="tour__ctl">
      <button type="button" class="tour__b" data-t="pause">Pausa</button>
      <button type="button" class="tour__b" data-t="next">Siguiente</button>
      <button type="button" class="tour__b tour__x" data-t="exit" aria-label="Salir del recorrido">Salir</button>
    </div>`;
  document.body.append(bar);
  const cap = $('.tour__cap', bar), prog = $('.tour__prog i', bar), pauseB = $('[data-t=pause]', bar);
  const TOTAL = chs.reduce((s, c) => s + c.seg + c.hold, 0);

  const tour = (() => {
    let on = false, paused = false, i = 0, t0 = 0, raf = 0, y0 = 0, y1 = 0, phase = 'move', elapsedBefore = 0, pausedAt = 0;
    // a dónde ir en cada capítulo: si se recorre entero (secciones fijas que se animan con el scroll), hasta su final
    const target = (k) => {
      const c = chs[k], el = c.el, t = tops[k];
      if (c.through) return Math.min(maxY(), t + el.offsetHeight - innerHeight * (k === 0 ? 0.55 : 0.75));
      return Math.min(maxY(), t);
    };
    const doneBefore = (k) => chs.slice(0, k).reduce((s, c) => s + c.seg + c.hold, 0);
    const begin = (k) => {
      measure(); i = k; phase = 'move'; t0 = performance.now(); y0 = scrollY;
      y1 = k === 0 && !chs[0].through ? 0 : target(k);
      if (k === 0) { y0 = 0; scrollToY(0); }
      cap.textContent = chs[k].cap; elapsedBefore = doneBefore(k);
      bar.style.setProperty('--n', `"${k + 1} de ${chs.length}"`);
    };
    const step = (now) => {
      if (!on || paused) return;
      const c = chs[i], dt = (now - t0) / 1000;
      if (phase === 'move') {
        const d = reduced() ? 0.01 : c.seg, p = clamp(dt / d);
        const e = c.through ? p : (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);   // las secciones fijas, a paso parejo
        scrollToY(lerp(y0, y1, e));
        prog.style.transform = `scaleX(${((elapsedBefore + p * c.seg) / TOTAL).toFixed(4)})`;
        if (p >= 1) { phase = 'hold'; t0 = now; }
      } else {
        const p = clamp(dt / c.hold);
        prog.style.transform = `scaleX(${((elapsedBefore + c.seg + p * c.hold) / TOTAL).toFixed(4)})`;
        if (p >= 1) { if (i < chs.length - 1) begin(i + 1); else { finish(); return; } }
      }
      raf = requestAnimationFrame(step);
    };
    const setPaused = (v) => {
      if (!on || paused === v) return;
      paused = v; bar.classList.toggle('is-paused', v); pauseB.textContent = v ? 'Seguir' : 'Pausa';
      if (v) { pausedAt = performance.now(); cancelAnimationFrame(raf); cap.textContent = 'En pausa: tú tienes el control. Toca «Seguir» para continuar.'; }
      else { measure(); t0 += performance.now() - pausedAt; y0 = scrollY; if (phase === 'move') { t0 = performance.now(); } cap.textContent = chs[i].cap; raf = requestAnimationFrame(step); }
    };
    const finish = () => { stop(); cap.textContent = ''; const q = document.querySelector('#out .btn'); if (q) q.focus({ preventScroll: true }); };
    function stop() { if (!on) return; on = false; paused = false; cancelAnimationFrame(raf); bar.hidden = true; document.documentElement.classList.remove('is-touring'); }
    function start() {
      open(false); measure(); on = true; paused = false; bar.hidden = false; bar.classList.remove('is-paused'); pauseB.textContent = 'Pausa';
      document.documentElement.classList.add('is-touring'); begin(0); raf = requestAnimationFrame(step);
    }
    // si la persona toca, arrastra o usa la rueda, el recorrido se pausa
    const interrupt = (e) => { if (!on || paused || bar.contains(e.target) || th.contains(e.target)) return; setPaused(true); };
    ['wheel', 'touchstart', 'pointerdown'].forEach((ev) => addEventListener(ev, interrupt, { passive: true }));
    addEventListener('keydown', (e) => { if (on && !bar.contains(e.target) && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) setPaused(true); if (on && e.key === 'Escape') stop(); });
    pauseB.onclick = () => setPaused(!paused);
    $('[data-t=next]', bar).onclick = () => { if (paused) setPaused(false); if (i < chs.length - 1) { begin(i + 1); } else finish(); };
    $('[data-t=exit]', bar).onclick = () => stop();
    return { start, stop, get on() { return on; } };
  })();
  $('[data-play]', th).onclick = () => tour.start();
  document.querySelectorAll('[data-tour]').forEach((b) => { b.addEventListener('click', (e) => { e.preventDefault(); tour.start(); }); });
  // desde el menú o Cotizar: /?recorrido=1
  if (new URLSearchParams(location.search).has('recorrido')) setTimeout(() => tour.start(), 900);
  window.__frio = { tour, tempAt: () => tempAt(scrollY), chapters: chs.map((c) => c.name) };
}

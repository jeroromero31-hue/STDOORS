// «Baja a −20 °C» (Fase 11B). El Inicio se recorre como si bajaras la temperatura: de 30 °C afuera a −20 °C adentro.
// - Termómetro en el borde: marca dónde vas (la temperatura baja con el scroll) y, al tocarlo, abre los capítulos para
//   brincar a cualquiera. Debajo de 0 °C la pantalla se escarcha en las orillas; si regresas, se derrite.
// - Fase 11C: tu dedo (o el cursor) derrite la escarcha donde toca y se vuelve a congelar poco a poco.
//   (El recorrido automático de 60 s de la 11B se quitó: ST no lo quería literal.)
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
      <ol class="thermo__list">${chs.map((c, i) => `<li><button type="button" data-ch="${i}"><span class="thermo__t">${c.t > 0 ? c.t : c.t === 0 ? '0' : '−' + Math.abs(c.t)}°</span><span>${c.name}</span></button></li>`).join('')}</ol>
    </div>`;
  document.body.append(th);
  const fl = frostLayer({ tip: matchMedia('(pointer: coarse)').matches ? 'Bajo cero: toca la escarcha y tu dedo la derrite.' : 'Bajo cero: pasa el cursor por la escarcha y se derrite.' });
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
    fl.set(clamp(-T / 20));
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
    b.onclick = () => { measure(); open(false); scrollToY(Math.min(maxY(), tops[+b.dataset.ch] + (+b.dataset.ch === 0 ? 0 : 1)), true); };
  });

  window.__frio = { tempAt: () => tempAt(scrollY), chapters: chs.map((c) => c.name), frost: fl };
}

// ---------- escarcha que tu dedo derrite (Fase 11C; también en las páginas de puerta) ----------
// Una capa fija en las orillas de la pantalla. Donde tocas (o pasas el cursor) se derrite en un círculo y vuelve a
// congelarse poco a poco. Son capas de máscara sobre la misma escarcha: sin canvas y sin estorbar al scroll.
export function frostLayer({ tip = '' } = {}) {
  const frost = document.createElement('div'); frost.className = 'frost is-off'; frost.setAttribute('aria-hidden', 'true'); document.body.append(frost);
  const holes = [], EDGE = 'radial-gradient(ellipse 74% 70% at 50% 50%, transparent 60%, #000 98%)';
  let level = 0, mRaf = 0, hinted = false, shown = false;
  try { hinted = sessionStorage.getItem('st.frio.hint') === '1'; } catch { /* sin almacenamiento */ }
  const paint = () => {
    mRaf = 0; const now = performance.now();
    for (let i = holes.length - 1; i >= 0; i--) if (now - holes[i].t > 2600) holes.splice(i, 1);
    const layers = holes.map((h) => { const k = clamp((now - h.t) / 2600), r = 64 * (1 - k * k); return `radial-gradient(circle at ${h.x}px ${h.y}px, transparent ${(r * 0.55).toFixed(1)}px, #000 ${(r + 18).toFixed(1)}px)`; });
    const m = [...layers, EDGE].join(', ');
    frost.style.webkitMaskImage = m; frost.style.maskImage = m;
    frost.style.webkitMaskComposite = holes.length ? 'source-in' : ''; frost.style.maskComposite = holes.length ? 'intersect' : '';
    if (holes.length) mRaf = requestAnimationFrame(paint);
  };
  const melt = (x, y) => {
    if (level < 0.05) return;                                     // solo si hay escarcha
    const last = holes[holes.length - 1], now = performance.now();
    if (last && Math.hypot(last.x - x, last.y - y) < 26 && now - last.t < 120) return;
    holes.push({ x: Math.round(x), y: Math.round(y), t: now }); if (holes.length > 8) holes.shift();
    if (!mRaf) mRaf = requestAnimationFrame(paint);
    if (!hinted) { hinted = true; try { sessionStorage.setItem('st.frio.hint', '1'); } catch { /* sin almacenamiento */ } }
  };
  // se escucha el dedo solo mientras hay escarcha (así no se toca nada del arrastre de las puertas cuando no hace falta)
  const onTouch = (e) => { const t = e.touches[0]; if (t) melt(t.clientX, t.clientY); };
  const onMouse = (e) => { if (e.pointerType === 'mouse') melt(e.clientX, e.clientY); };
  let listening = false;
  const listen = (v) => {
    if (v === listening) return; listening = v;
    const f = v ? addEventListener : removeEventListener;
    f('touchstart', onTouch, { passive: true }); f('touchmove', onTouch, { passive: true }); f('pointermove', onMouse, { passive: true });
  };
  // la primera vez que se escarcha, una pista
  const tipEl = document.createElement('p'); tipEl.className = 'frost-tip'; tipEl.setAttribute('role', 'status'); document.body.append(tipEl);
  const set = (v) => {
    v = clamp(v); if (Math.abs(v - level) < 0.012 && !(v === 0 && level > 0)) return;   // menos cambios de estilo
    level = v; frost.style.setProperty('--frost', level.toFixed(3)); frost.classList.toggle('is-off', level === 0); listen(level >= 0.05);
    if (tip && !shown && !hinted && level > 0.25) { shown = true; tipEl.textContent = tip; tipEl.classList.add('is-on'); setTimeout(() => tipEl.classList.remove('is-on'), 4200); }
  };
  return { el: frost, set, melt, holes, get level() { return level; } };
}

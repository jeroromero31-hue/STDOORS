// «Baja a −20 °C» (Fase 11B). El Inicio se recorre como si bajaras la temperatura: de 30 °C afuera a −20 °C adentro.
// - Termómetro en el borde: marca dónde vas (la temperatura baja con el scroll) y, al tocarlo, abre los capítulos para
//   brincar a cualquiera. Debajo de 0 °C la pantalla se escarcha en las orillas; si regresas, se derrite.
// - Fase 11C: tu dedo (o el cursor) derrite la escarcha donde toca y se vuelve a congelar poco a poco.
//   (El recorrido automático de 60 s de la 11B se quitó: ST no lo quería literal.)
// No toca el diseño de las secciones: solo se monta encima.
import '../styles/frio.css';
import { url } from '../ui/site.js';

const $ = (s, r = document) => r.querySelector(s);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// capítulos: sección, nombre, temperatura y qué hacer en el recorrido (seg: segundos recorriendo, hold: segundos quieto)
const CHAPTERS = [
  { sel: '#hx', name: 'La puerta', t: 30, cap: 'Afuera hace 30 °C. La vaivén se abre y entras a la cámara.', seg: 9, hold: 0.6, through: true },
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
  // Fase 14B · ya no va pegado a la orilla de la pantalla (se encimaba sobre las puertas y el texto): es una lectura
  // compacta en la barra de arriba, junto a «Cotizar». Al tocarla abre los capítulos debajo de la barra.
  const th = document.createElement('li');
  th.className = 'ftermo nav__keep';
  th.innerHTML = `
    <button type="button" class="ftermo__btn" aria-expanded="false" aria-controls="ftermoList" aria-label="30°C: termómetro del recorrido, ${chs[0].name}. Toca para ver los capítulos">
      <span class="ftermo__tube" aria-hidden="true"><i class="ftermo__hg"></i></span>
      <span class="ftermo__read" aria-hidden="true"><b>30</b>°</span>
    </button>
    <div class="ftermo__panel" id="ftermoList" hidden>
      <p class="ftermo__h">Baja a −20 °C</p>
      <ol class="ftermo__list">${chs.map((c, i) => `<li><button type="button" data-ch="${i}"><span class="ftermo__t">${c.t > 0 ? c.t : c.t === 0 ? '0' : '−' + Math.abs(c.t)}°</span><span>${c.name}</span></button></li>`).join('')}</ol>
    </div>`;
  const keep = document.querySelector('.nav .nav__links .nav__keep');
  if (keep) keep.before(th); else { th.classList.add('ftermo--float'); document.body.append(th); }
  const fl = frostLayer({ tip: matchMedia('(pointer: coarse)').matches ? 'Bajo cero: toca la escarcha y tu dedo la derrite.' : 'Bajo cero: pasa el cursor por la escarcha y se derrite.' });
  const btn = $('.ftermo__btn', th), panel = $('.ftermo__panel', th), read = $('.ftermo__read b', th);

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
    if (T < 6) preloadFrost();                                  // la escarcha llega bajo 0 °C: su textura se pide antes
    fl.set(clamp(-T / 20));
    if (Math.round(lastT) !== r || !btn.dataset.l) { btn.dataset.l = 1; btn.setAttribute('aria-label', `${read.textContent}°C: termómetro del recorrido, ${chs[chapterAt(scrollY)].name}. Toca para ver los capítulos`); }
    // al cruzar 0 °C, un toque de vibración (si el teléfono lo permite)
    if (lastT >= 0 && T < 0 && !crossed) { crossed = true; try { navigator.vibrate && navigator.vibrate(12); } catch { /* sin vibración */ } }
    if (T > 2) crossed = false;
    lastT = T;
    th.classList.add('is-live'); clearTimeout(idle); idle = setTimeout(() => th.classList.remove('is-live'), 700);
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
// congelarse poco a poco.
// Fase 12 · antes era un div con dos texturas SVG de ruido (feTurbulence) y máscaras CSS: el teléfono volvía a calcular
// el ruido al repintar (al aparecer o esconderse la barra del navegador, al derretir) y en Android se trababa. Ahora es
// un lienzo: la textura se genera una vez (en mosaico, ~10 ms) y solo se vuelve a pintar al derretir o al girar la
// pantalla. Su intensidad es la opacidad del lienzo, que la anima la tarjeta gráfica sin repintar nada. La textura es
// una imagen ya hecha (~50 KB) que se pide al acercarse a 0 °C.
// textura ya hecha (scripts/build-escarcha.py): se pide una vez y el navegador la decodifica fuera del hilo principal
let tileReady = null;
export function preloadFrost() {
  if (!tileReady) {
    const img = new Image(); img.decoding = 'async'; img.src = url('img/frio/escarcha.webp');
    tileReady = (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; })).then(() => img).catch(() => null);
  }
  return tileReady;
}
export function frostLayer({ tip = '' } = {}) {
  const frost = document.createElement('canvas'); frost.className = 'frost is-off'; frost.setAttribute('aria-hidden', 'true'); document.body.append(frost);
  const g = frost.getContext('2d');
  const R = Math.min(devicePixelRatio || 1, 2);
  const holes = [];
  let level = 0, mRaf = 0, hinted = false, shown = false, W = 0, H = 0, pat = null, cw = 0, ch = 0;
  try { hinted = sessionStorage.getItem('st.frio.hint') === '1'; } catch { /* sin almacenamiento */ }
  // óvalo con degradado (las orillas): como radial-gradient(ellipse rx% ry% at 50% 50%, …)
  const oval = (rx, ry, stops) => {
    g.save(); g.setTransform(W * rx, 0, 0, H * ry, W / 2, H / 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(-0.5 / rx, -0.5 / ry, 1 / rx, 1 / ry); g.restore();
  };
  const size = () => {
    // a lo alto se toma la pantalla con la barra del navegador escondida (100lvh): al aparecer o esconderse no se repinta
    const w = innerWidth, h = Math.max(innerHeight, document.documentElement.clientHeight, frost.getBoundingClientRect().height || 0);
    if (Math.abs(w - cw) < 2 && Math.abs(h - ch) < h * 0.15) return false;
    cw = w; ch = h; W = frost.width = Math.round(w * R); H = frost.height = Math.round(h * R); return true;
  };
  const paint = () => {
    mRaf = 0; if (level === 0) return;
    const now = performance.now();
    for (let i = holes.length - 1; i >= 0; i--) if (now - holes[i].t > 2600) holes.splice(i, 1);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    oval(0.8, 0.75, [[0, 'rgba(214,240,248,0)'], [0.62, 'rgba(214,240,248,0)'], [1, 'rgba(214,240,248,.42)']]);
    if (pat) { g.save(); g.scale(R, R); g.fillStyle = pat; g.fillRect(0, 0, W / R, H / R); g.restore(); }   // el mosaico va en px de CSS
    g.globalCompositeOperation = 'destination-in';
    oval(0.74, 0.7, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [0.98, '#000'], [1, '#000']]);
    if (holes.length) {
      g.globalCompositeOperation = 'destination-out';
      holes.forEach((h) => {
        const k = Math.min(1, (now - h.t) / 2600), r = 64 * (1 - k * k) * R, x = h.x * R, y = h.y * R, r0 = r * 0.55, r1 = r + 18 * R;
        const gr = g.createRadialGradient(x, y, r0, x, y, r1); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r1, 0, Math.PI * 2); g.fill();
      });
      mRaf = requestAnimationFrame(paint);
    }
    g.globalCompositeOperation = 'source-over';
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
  addEventListener('resize', () => { if (level > 0 && size() && !mRaf) mRaf = requestAnimationFrame(paint); });
  // la primera vez que se escarcha, una pista
  const tipEl = document.createElement('p'); tipEl.className = 'frost-tip'; tipEl.setAttribute('role', 'status'); document.body.append(tipEl);
  const set = (v) => {
    v = clamp(v); if (Math.abs(v - level) < 0.012 && !(v === 0 && level > 0)) return;   // menos cambios de estilo
    const was = level; level = v;
    if (level > 0 && was === 0) {
      frost.classList.remove('is-off'); size(); paint();
      if (!pat) preloadFrost().then((img) => { if (img && !pat) { pat = g.createPattern(img, 'repeat'); if (level > 0 && !mRaf) mRaf = requestAnimationFrame(paint); } });
    }
    frost.style.opacity = (level * 0.8).toFixed(3);
    if (level === 0) frost.classList.add('is-off');
    listen(level >= 0.05);
    if (tip && !shown && !hinted && level > 0.25) { shown = true; tipEl.textContent = tip; tipEl.classList.add('is-on'); setTimeout(() => tipEl.classList.remove('is-on'), 4200); }
  };
  return { el: frost, set, melt, holes, get level() { return level; } };
}

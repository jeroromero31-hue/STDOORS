// Secciones propias de la página CDS: comparador de modelos y galería de instalaciones reales.
import { url } from './site.js';
import photos from '../data/cds-instalaciones.json';
import { vano } from './vano.js';
import { defaults, cdsFix } from './medida.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Lo que dice el catálogo Legacy de cada modelo, sin agregar nada: vidrios, resistencia, argón y protección contra la
// humedad (65 %, 100 % y 89 %). La temperatura de aplicación viene de la página de ST (strefrigeracion.com/reachin.php):
// refrigeración −5 °C en Advanced y Plus, congelación −20 °C en LT.
const MODELOS = [
  { id: 'advanced', nombre: 'Advanced', uso: 'Refrigeración', temp: '−5 °C', vidrios: 2, resistencia: false, argon: true, proteccion: 65, anchos: '23", 26" o 30"' },
  { id: 'plus', nombre: 'Plus', uso: 'Refrigeración', temp: '−5 °C', vidrios: 2, resistencia: true, argon: false, proteccion: 100, anchos: '23" o 26"' },
  { id: 'lt', nombre: 'LT', uso: 'Congelación', temp: '−20 °C', vidrios: 3, resistencia: true, argon: false, proteccion: 89, anchos: '23", 26" o 30"' },
];
const reducedMo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Corte del vidrio, visto de canto: afuera (tibio) a la izquierda, adentro (frío) a la derecha. Los vidrios entran y
// salen deslizándose al cambiar de modelo; el argón se mueve entre los vidrios; la resistencia brilla en el de afuera.
const CUT_W = 640, CUT_H = 380, PANE_Y = 46, PANE_H = 288;
const paneX = (n) => (n === 3 ? [232, 320, 408] : [252, 388]);
function corteSVG() {
  const dots = Array.from({ length: 26 }, (_, k) => {
    const x = 266 + ((k * 37) % 108), y = PANE_Y + 18 + ((k * 53) % (PANE_H - 36)), d = 6 + (k % 5) * 1.7;
    return `<circle class="cut__ar" cx="${x}" cy="${y}" r="${2.2 + (k % 3) * 0.6}" style="--d:${d}s;--dx:${(k % 2 ? 1 : -1) * (4 + (k % 4) * 2)}px;--dy:${(k % 3 - 1) * 9}px"/>`;
  }).join('');
  return `<svg class="cut" viewBox="0 0 ${CUT_W} ${CUT_H}" role="img" aria-labelledby="cutTitle">
    <title id="cutTitle"></title>
    <defs>
      <linearGradient id="cutWarm" x1="0" x2="1"><stop offset="0" stop-color="#f9a21b" stop-opacity=".30"/><stop offset="1" stop-color="#f9a21b" stop-opacity="0"/></linearGradient>
      <linearGradient id="cutCold" x1="1" x2="0"><stop offset="0" stop-color="#1e8fe0" stop-opacity=".34"/><stop offset="1" stop-color="#1e8fe0" stop-opacity="0"/></linearGradient>
      <linearGradient id="cutGlass" x1="0" x2="1"><stop offset="0" stop-color="#cfe9ef"/><stop offset=".5" stop-color="#f4fbfd"/><stop offset="1" stop-color="#bfe0e8"/></linearGradient>
      <filter id="cutGlow" x="-200%" y="-10%" width="500%" height="120%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect x="0" y="0" width="230" height="${CUT_H}" fill="url(#cutWarm)"/>
    <rect x="${CUT_W - 230}" y="0" width="230" height="${CUT_H}" fill="url(#cutCold)"/>
    <text class="cut__side" x="24" y="34">Afuera</text>
    <text class="cut__side" x="${CUT_W - 24}" y="34" text-anchor="end">Adentro</text>
    <text class="cut__temp" x="${CUT_W - 24}" y="${CUT_H - 26}" text-anchor="end"></text>
    <g class="cut__gas">${dots}</g>
    ${[0, 1, 2].map((i) => `<g class="cut__pane" data-i="${i}"><rect x="-7" y="${PANE_Y}" width="14" height="${PANE_H}" rx="3" fill="url(#cutGlass)"/><rect x="-7" y="${PANE_Y}" width="14" height="${PANE_H}" rx="3" class="cut__pane-edge"/></g>`).join('')}
    <g class="cut__heat"><rect x="-1.5" y="${PANE_Y + 8}" width="3" height="${PANE_H - 16}" rx="1.5" class="cut__heat-glow" filter="url(#cutGlow)"/><rect x="-1" y="${PANE_Y + 8}" width="2" height="${PANE_H - 16}" rx="1" class="cut__heat-line"/></g>
    <g class="cut__labels">
      <g class="cut__lb cut__lb--glass"><line x1="0" y1="0" x2="0" y2="0"/><text></text></g>
      <g class="cut__lb cut__lb--gas"><line x1="0" y1="0" x2="0" y2="0"/><text>Gas argón</text></g>
      <g class="cut__lb cut__lb--heat"><line x1="0" y1="0" x2="0" y2="0"/><text>Resistencia</text></g>
    </g>
  </svg>`;
}
function drawCorte(svg, m) {
  const xs = paneX(m.vidrios), panes = [...svg.querySelectorAll('.cut__pane')];
  // con dos vidrios, el del medio se esconde dentro del primero; con tres, sale a su lugar
  const pos = m.vidrios === 3 ? xs : [xs[0], xs[0], xs[1]];
  panes.forEach((p, i) => { p.style.transform = `translateX(${pos[i]}px)`; p.classList.toggle('is-off', m.vidrios === 2 && i === 1); });
  svg.querySelector('.cut__heat').style.transform = `translateX(${xs[0] + 9}px)`;
  svg.classList.toggle('has-heat', m.resistencia); svg.classList.toggle('has-gas', m.argon);
  svg.querySelector('.cut__temp').textContent = `${m.uso} ${m.temp}`;
  svg.querySelector('title').textContent = `Corte del vidrio de la ${m.nombre}: ${m.vidrios === 3 ? 'tres' : 'dos'} vidrios${m.resistencia ? ', con resistencia' : ', sin resistencia'}${m.argon ? ', con gas argón entre ellos' : ''}.`;
  const lb = (cls, x1, y1, x2, y2, text) => {
    const g = svg.querySelector(cls); const [ln, tx] = [g.querySelector('line'), g.querySelector('text')];
    ln.setAttribute('x1', x1); ln.setAttribute('y1', y1); ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
    tx.setAttribute('x', x2 + (x2 < x1 ? -6 : 6)); tx.setAttribute('y', y2 + 4); tx.setAttribute('text-anchor', x2 < x1 ? 'end' : 'start'); if (text) tx.textContent = text;
  };
  lb('.cut__lb--glass', xs[xs.length - 1] + 7, 96, 470, 96, m.vidrios === 3 ? 'Tres vidrios' : 'Dos vidrios');
  lb('.cut__lb--gas', 320, 200, 470, 200);
  lb('.cut__lb--heat', xs[0] + 9, 300, 150, 300);
}

function comparador(root) {
  root.innerHTML = `
    <div class="cmp">
      <div class="cmp__stage">${corteSVG()}</div>
      <div class="cmp__side">
        <div class="cmp__tabs" role="tablist" aria-label="Modelo">
          ${MODELOS.map((m) => `<button class="cmp__tab" role="tab" id="tab-${m.id}" aria-controls="cmp-panel" aria-selected="false" data-m="${m.id}"><b>${m.nombre}</b><span>${m.uso}</span></button>`).join('')}
        </div>
        <div class="cmp__panel" id="cmp-panel" role="tabpanel">
          <dl class="cmp__spec">
            <div><dt>Aplicación</dt><dd data-k="app"></dd></div>
            <div><dt>Vidrios</dt><dd data-k="vid"></dd></div>
            <div><dt>Resistencia</dt><dd data-k="res"></dd></div>
            <div><dt>Gas argón</dt><dd data-k="gas"></dd></div>
            <div class="cmp__meter"><dt>Protección contra la humedad</dt><dd><span class="cmp__pct" data-k="pct"></span><span class="cmp__bar"><i></i></span></dd></div>
            <div><dt>Medidas</dt><dd data-k="med"></dd></div>
            <div><dt>Garantía</dt><dd>5 años</dd></div>
          </dl>
          <button class="btn cmp__go" data-cur="Ver en 3D">Ver en 3D</button>
        </div>
      </div>
    </div>
    <p class="t-small t-soft cmp__src">Vidrios y protección según el catálogo Legacy. Temperatura de aplicación según strefrigeracion.com.</p>`;
  const svg = root.querySelector('.cut'), panel = root.querySelector('.cmp__panel');
  let cur = null, counter = 0;
  const set = (id, user) => {
    const m = MODELOS.find((x) => x.id === id); if (!m || cur === id) return; cur = id;
    root.querySelectorAll('.cmp__tab').forEach((t) => { const on = t.dataset.m === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    const put = (k, v) => { panel.querySelector(`[data-k="${k}"]`).textContent = v; };
    put('app', `${m.uso}, ${m.temp}`); put('vid', m.vidrios === 3 ? 'Tres' : 'Dos'); put('res', m.resistencia ? 'Sí' : 'No'); put('gas', m.argon ? 'Sí' : 'No'); put('med', `${m.anchos} × 73"`);
    // la barra y la cifra suben juntas hasta el porcentaje del modelo
    const bar = panel.querySelector('.cmp__bar i'), pct = panel.querySelector('[data-k="pct"]');
    bar.style.transform = `scaleX(${m.proteccion / 100})`;
    const from = +(pct.dataset.v || 0), to = m.proteccion, t0 = performance.now(), my = ++counter;
    const tick = (now) => { if (my !== counter) return; const k = reducedMo() ? 1 : Math.min(1, (now - t0) / 700), v = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); pct.textContent = `${v} %`; pct.dataset.v = v; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    panel.querySelector('.cmp__go').textContent = `Ver la ${m.nombre} en 3D`;
    drawCorte(svg, m);
    if (user) { panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap'); }
  };
  root.querySelectorAll('.cmp__tab').forEach((t, i, all) => {
    t.onclick = () => set(t.dataset.m, true);
    t.onkeydown = (e) => {                                   // flechas entre pestañas
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); const n = all[(i + d + all.length) % all.length]; n.focus(); n.click();
    };
  });
  root.querySelector('.cmp__go').onclick = () => {
    const chip = document.querySelector(`#swatches .chip[data-o="${cur}"]`); if (chip && chip.getAttribute('aria-pressed') !== 'true') chip.click();
    const c = document.querySelector('#como'); if (c) c.scrollIntoView({ behavior: reducedMo() ? 'auto' : 'smooth' });
  };
  // entra cuando se ve: los vidrios llegan desde los lados
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { root.classList.add('is-in'); io.disconnect(); } }), { threshold: 0.3 });
  io.observe(root);
  // sigue al modelo elegido en el 3D
  const fromChip = () => { const c = document.querySelector('#swatches .chip[aria-pressed=true]'); return c && c.dataset.o; };
  set(fromChip() || 'advanced', false);
  return { set };
}

export function mountCdsSections() {
  // ---------- modelos: comparador con corte del vidrio ----------
  const grid = $('#modelos-grid');
  if (grid) {
    const cmp = comparador(grid);
    document.querySelector('.door')?.addEventListener('door:option', (e) => cmp.set(e.detail.id, false));
    if (!$('#swatches')) grid.querySelector('.cmp__go').hidden = true;     // sin visor 3D no hay a dónde llevar
  }

  // ---------- instalaciones ----------
  const gal = $('#galeria'); if (!gal) return;
  const src = (p, fmt) => Object.entries(p.imagen).map(([w, f]) => `${url('img/cds/' + f[fmt])} ${Math.min(+w, p.ancho)}w`).join(', ');
  const pic = (p, sizes, eager) => `<picture><source type="image/avif" srcset="${src(p, 'avif')}" sizes="${sizes}"><img src="${url('img/cds/' + p.imagen['960'].webp)}" srcset="${src(p, 'webp')}" sizes="${sizes}" width="${p.ancho}" height="${p.alto}" alt="${p.alt}" ${eager ? '' : 'loading="lazy"'} decoding="async"></picture>`;
  gal.innerHTML = photos.fotos.map((p, i) => `<li><button class="cds-photo" data-i="${i}" aria-label="Ampliar: ${p.alt}">${pic(p, '(max-width: 700px) 50vw, 33vw')}</button></li>`).join('');

  const dlg = $('#visor-foto'), fig = $('.photo-dlg__img', dlg), cap = $('.photo-dlg__cap', dlg);
  let cur = 0;
  const show = (i) => { cur = (i + photos.fotos.length) % photos.fotos.length; const p = photos.fotos[cur]; fig.innerHTML = pic(p, '100vw', true); cap.textContent = `${p.alt} · ${cur + 1} de ${photos.fotos.length}`; };
  $$('.cds-photo', gal).forEach((b) => { b.onclick = () => { show(+b.dataset.i); dlg.showModal(); }; });
  $('[data-prev]', dlg).onclick = () => show(cur - 1);
  $('[data-next]', dlg).onclick = () => show(cur + 1);
  $('[data-close]', dlg).onclick = () => dlg.close();
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });       // clic fuera de la foto
  dlg.addEventListener('close', () => { const b = $(`.cds-photo[data-i="${cur}"]`, gal); if (b) b.focus(); });
  let x0 = null;                                                                      // deslizar con el dedo
  fig.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  fig.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
}

// ---------- Fase 10F · extensiones del visor CDS: prueba de humedad y luces KeyLED ----------
export function mountCdsExtras({ viewer, live, door }) {
  // Fase 14C · el modelo y el acabado del 3D son los mismos que en «Arma tu juego» y en Cotizar: si cambias uno, cambia
  // el otro. Al llegar sin ?modelo= / ?acabado= en la dirección, el 3D toma lo que ya habías elegido.
  if (viewer.setFinish) {
    const chipM = (id) => $(`#swatches .chip[data-o="${id}"]`), chipA = (id) => $(`.door__ctl .chip[data-k="acabado"][data-v="${id}"]`);
    const now3d = () => { const m = $('#swatches .chip[aria-pressed=true]'); return { ...(m ? { modelo: m.dataset.o } : {}), acabado: viewer.finish }; };
    const push = () => vano.set({ cds: cdsFix({ ...defaults('cds'), ...(vano.get().cds || {}), ...now3d() }) }, 'puerta');
    const q = new URLSearchParams(location.search), saved = vano.get().cds || {};
    if (!q.get('modelo') && saved.modelo && saved.modelo !== now3d().modelo) chipM(saved.modelo)?.click();
    if (!q.get('acabado') && saved.acabado && saved.acabado !== viewer.finish) chipA(saved.acabado)?.click();
    door.addEventListener('door:option', push);
    $$('.door__ctl .chip[data-k="acabado"]').forEach((b) => b.addEventListener('click', () => requestAnimationFrame(push)));
    addEventListener('st:vano', (e) => {
      if (e.detail && e.detail.__from === 'puerta') return;
      const c = vano.get().cds; if (!c) return;
      if (c.modelo && c.modelo !== now3d().modelo) chipM(c.modelo)?.click();
      if (c.acabado && c.acabado !== viewer.finish) chipA(c.acabado)?.click();
    });
    push();
  }
  // prueba de humedad: el vidrio de afuera se empaña cuando la humedad del lugar pasa la protección del modelo
  const box = $('[data-humedad-ui]');
  if (box && viewer.fog) {
    box.innerHTML = `
      <div class="chips" role="group" aria-label="Modelo">${MODELOS.map((m) => `<button class="chip" data-hm="${m.id}" aria-pressed="false">${m.nombre}</button>`).join('')}</div>
      <label class="humid__l" for="hr">Humedad del lugar <output id="hrOut" for="hr">80 %</output></label>
      <input class="humid__r" type="range" id="hr" min="30" max="100" step="1" value="80">
      <p class="humid__res" aria-live="polite"></p>
      <p class="humid__wipe" hidden></p>`;
    const hr = $('#hr', box), out = $('#hrOut', box), res = $('.humid__res', box), wipeP = $('.humid__wipe', box);
    let active = false, tEnd = 0, fogged = false;
    // Fase 12 · el vidrio empañado se limpia con el dedo y vuelve a empañarse: entre más humedad le sobre al modelo, más rápido
    const wipeMsg = (txt) => { wipeP.hidden = !txt; wipeP.textContent = txt || ''; };
    const onWipe = (ev) => {
      if (ev === 'end') tEnd = performance.now();
      if (ev === 'fogged' && fogged) {
        const m = model(), s = Math.max(1, Math.round((performance.now() - tEnd) / 1000));
        const mejor = MODELOS.filter((x) => x.proteccion > m.proteccion && x.proteccion >= +hr.value).sort((a, b) => a.proteccion - b.proteccion)[0];
        wipeMsg(`Se volvió a empañar en unos ${s} s.${mejor ? ` La ${mejor.nombre}, con resistencia en el vidrio, se mantiene clara con ${hr.value} %.` : ''}`);
      }
    };
    const model = () => { const c = $('#swatches .chip[aria-pressed=true]'); return MODELOS.find((m) => m.id === (c ? c.dataset.o : 'advanced')) || MODELOS[0]; };
    const update = () => {
      const m = model(), h = +hr.value, f = Math.max(0, Math.min(1, (h - m.proteccion) / 22));
      out.value = `${h} %`; hr.style.setProperty('--p', `${(h - 30) / 70 * 100}%`);
      $$('[data-hm]', box).forEach((b) => b.setAttribute('aria-pressed', b.dataset.hm === m.id));
      res.textContent = f > 0
        ? `La ${m.nombre} tiene ${m.proteccion} % de protección contra la humedad: con ${h} % el vidrio se empaña.`
        : `La ${m.nombre} tiene ${m.proteccion} % de protección contra la humedad: con ${h} % el vidrio sigue claro.`;
      res.classList.toggle('is-fog', f > 0);
      viewer.fog.set(active ? (f > 0 ? 0.25 + 0.75 * f : 0) : 0);
      const was = fogged; fogged = active && f > 0;
      if (viewer.fog.wipe) viewer.fog.wipe(fogged, { seconds: 12 - 7 * f, onEvent: onWipe });
      if (fogged && !was) wipeMsg(matchMedia('(pointer: coarse)').matches ? 'Límpialo: pasa el dedo de lado a lado por el vidrio empañado.' : 'Límpialo: pasa el mouse con el botón apretado por el vidrio empañado.');
      if (!fogged) wipeMsg('');
    };
    hr.addEventListener('input', update);
    $$('[data-hm]', box).forEach((b) => { b.onclick = () => { const c = $(`#swatches .chip[data-o="${b.dataset.hm}"]`); if (c && c.getAttribute('aria-pressed') !== 'true') c.click(); update(); }; });
    door.addEventListener('door:option', update);
    door.addEventListener('door:step', (e) => { active = !!e.detail.block.dataset.humedad; update(); });
    update();
  }
  // Fase 10K · «Toma un producto»: un botón lo saca por ti (abre la puerta y la deja retenida), dice cuál es y lo regresa;
  // los que ya tomaste quedan en una lista. Arrastrar con el dedo o el mouse sigue funcionando igual.
  const step = $('.door__step[data-view="parrillas"]');
  if (step && viewer.motion && viewer.motion.takeOne) {
    const box = document.createElement('div'); box.className = 'take';
    box.innerHTML = `<div class="row"><button type="button" class="btn" data-take-one>Tomar un producto</button><button type="button" class="btn btn--line" data-give hidden>Regresarlo</button></div>
      <p class="take__now" aria-live="polite"></p>
      <div class="take__basket" hidden><span class="t-small t-soft">Ya tomaste</span><ul></ul></div>`;
    step.append(box);
    const now = $('.take__now', box), give = $('[data-give]', box), basket = $('.take__basket', box), seen = new Set();
    viewer.motion.onProduct((i) => {
      if (i) {
        now.innerHTML = `<b>${i.name}</b>${i.vol ? ` · ${i.vol}` : ''}<br><span class="t-small t-soft">Gíralo arrastrándolo. Con doble toque, o con «Regresarlo», vuelve a su lugar.</span>`;
        give.hidden = false;
        if (!seen.has(i.name)) { seen.add(i.name); const li = document.createElement('li'); li.textContent = i.name; $('ul', basket).append(li); basket.hidden = false; }
      } else { now.textContent = ''; give.hidden = true; }
    });
    $('[data-take-one]', box).onclick = () => { viewer.motion.takeOne(1); live.textContent = 'Abriendo la puerta para tomar un producto'; };
    give.onclick = () => viewer.motion.giveBack();
  }
  // luces KeyLED: apagar y encender en el paso de la iluminación
  const led = $('[data-led-btn]');
  if (led && viewer.setLED) {
    const sync = () => { led.textContent = viewer.led ? 'Apagar luces' : 'Encender luces'; led.setAttribute('aria-pressed', !viewer.led); };
    led.onclick = () => { viewer.setLED(!viewer.led); sync(); live.textContent = viewer.led ? 'Luces encendidas' : 'Luces apagadas'; };
    door.addEventListener('door:step', () => requestAnimationFrame(sync));
    sync();
  }
}

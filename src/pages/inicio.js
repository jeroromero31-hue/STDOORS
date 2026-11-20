// Fase 11 · Inicio: «Tu puerta, en un minuto». Una ruta de cinco paradas que se recorre en menos de un minuto y que se
// puede saltar en cualquier punto:
//   1. Elige        — cuatro puertas, un toque (la abatible si no eliges)
//   2. Por dentro   — la puerta elegida en rayos X: deslizas la línea y aparecen sus piezas con su número
//   3. A tu medida  — acabado, medida y opciones; la puerta dibujada cambia al momento; «Mírala en 3D» abre el visor
//   4. En tu espacio— la cámara (realidad aumentada, se abre al tocarla) y lo que ahorras en luz
//   5. Cotiza       — tu puerta armada con lo que elegiste: a Cotizar o por WhatsApp
// Lo que eliges se guarda en la medida compartida del sitio (vano): Cotizar, las páginas de puerta y la cámara la ven.
// Nada de 3D aquí: primero se pinta la foto; el 3D se descarga solo cuando lo pides.
import '../styles/home.css';
import { mountSite, url, solicitud, toast } from '../ui/site.js';
import { vano } from '../ui/vano.js';
import { doorArt, ACABADOS_DE, ACABADO_NOMBRE, MEDIDA_TIPICA } from '../ui/preview.js';
import { describe, toCm, FAM_NAME, CDS_W, CDS_H, CDS_MOD } from '../ui/medida.js';
import { fuga } from '../ui/fugaCalc.js';
import { waButton, waUpdate } from '../ui/whatsapp.js';
import escaner from '../data/escaner.json';

mountSite('inicio');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const FAMS = ['abatible', 'corrediza', 'vaiven', 'cds'];
const PAGE = { abatible: 'industriales/abatible/', corrediza: 'industriales/corrediza/', vaiven: 'industriales/vaiven/', cds: 'cds/' };
const MODELO_D = { advanced: 'Dos vidrios con argón', plus: 'Dos vidrios con resistencia', lt: 'Tres vidrios con resistencia' };

// ---------- estado de la ruta (compartido con el resto del sitio) ----------
const saved = vano.get();
const st = {
  fam: FAMS.includes(saved.fam) ? saved.fam : 'abatible',
  picked: FAMS.includes(saved.fam),
  ancho: saved.ancho || '', alto: saved.alto || '',
  acabado: saved.acabado || '', mano: saved.mano || 'derecha', hojas: saved.hojas || 2, uso: saved.uso || 'refrigeracion',
  cds: { puertas: 3, ancho: 30, alto: 79, modelo: 'advanced', ...(saved.cds || {}) },
};
const ME = 'inicio';
const acabadoOf = () => { const list = ACABADOS_DE[st.fam] || []; return list.includes(st.acabado) ? st.acabado : list[0] || ''; };
const cfgOf = () => (st.fam === 'cds' ? { ...st.cds } : { ancho: st.ancho, alto: st.alto, acabado: acabadoOf(), mano: st.mano, hojas: st.hojas, uso: st.uso, sinMedida: false });
const keep = (p) => { Object.assign(st, p); vano.set({ fam: st.fam, ancho: st.ancho, alto: st.alto, acabado: st.acabado, mano: st.mano, hojas: st.hojas, cds: st.cds }, ME); };

// ---------- la entrada: el azul del interior crece desde el vano de la puerta ----------
const gate = $('#gate'), gImg = $('.gate__img img'), gIn = $('.gate__in');
const OPEN = { x0: 0.53, x1: 0.80, y0: 0.145, y1: 0.882 };            // vano azul en la foto (proporción de la imagen)
function gateFrame() {
  const span = Math.max(1, gate.offsetHeight - innerHeight), p = Math.min(1, Math.max(0, -gate.getBoundingClientRect().top / span));
  const e = reduced() ? (p > 0.5 ? 1 : 0) : p * p * (3 - 2 * p);
  // la foto se acerca al vano (como si caminaras hacia la puerta) mientras el azul crece desde él
  const nw = 1620, nh = 2160, box = gImg.parentElement.getBoundingClientRect();
  const s0 = Math.max(box.width / nw, box.height / nh), dw0 = nw * s0, dh0 = nh * s0;
  const [px, py] = getComputedStyle(gImg).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
  const ox0 = (box.width - dw0) * (isFinite(px) ? px : 0.5), oy0 = (box.height - dh0) * (isFinite(py) ? py : 0.5);
  const cx = ox0 + ((OPEN.x0 + OPEN.x1) / 2) * dw0, cy = oy0 + ((OPEN.y0 + OPEN.y1) / 2) * dh0;
  gImg.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`; gImg.style.transform = e > 0 ? `scale(${(1 + 0.45 * e).toFixed(4)})` : '';
  const pin = gate.firstElementChild.getBoundingClientRect(), r = gImg.getBoundingClientRect();
  const s = Math.max(r.width / nw, r.height / nh), dw = nw * s, dh = nh * s;
  const ox = r.left - pin.left + (r.width - dw) * (isFinite(px) ? px : 0.5), oy = r.top - pin.top + (r.height - dh) * (isFinite(py) ? py : 0.5);
  const k = Math.max(0, (e - 0.12) / 0.88), lerp = (a, b) => a + (b - a) * k;     // el azul empieza a crecer un poco después
  const L = ox + OPEN.x0 * dw, R = pin.width - (ox + OPEN.x1 * dw), T = oy + OPEN.y0 * dh, B = pin.height - (oy + OPEN.y1 * dh);
  gIn.style.clipPath = `inset(${lerp(T, 0).toFixed(1)}px ${lerp(R, 0).toFixed(1)}px ${lerp(B, 0).toFixed(1)}px ${lerp(L, 0).toFixed(1)}px round ${(lerp(4, 0)).toFixed(1)}px)`;
  gate.style.setProperty('--p', e.toFixed(3));
}
let gRaf = 0;
const gateTick = () => { if (!gRaf) gRaf = requestAnimationFrame(() => { gRaf = 0; gateFrame(); }); };
addEventListener('scroll', gateTick, { passive: true }); addEventListener('resize', gateTick);
if (gImg.complete) gateFrame(); else gImg.addEventListener('load', gateFrame, { once: true });
gateFrame();

// ---------- el riel: dónde vas, ir a cualquier parada y saltar ----------
const STOPS = $$('[data-stop]'), rail = $('#rail');
const NAMES = { elige: 'Elige', dentro: 'Por dentro', medida: 'A tu medida', espacio: 'En tu espacio', cotiza: 'Cotiza' };
let cur = 0;
const go = (i) => { const el = STOPS[Math.max(0, Math.min(STOPS.length - 1, i))]; el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };
function setCur(i) {
  cur = i; const id = STOPS[i].dataset.stop;
  $$('[data-step]', rail).forEach((a, k) => { a.classList.toggle('is-done', k < i); if (k === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  $('[data-rail-n]', rail).textContent = i + 1; $('[data-rail-name]', rail).textContent = NAMES[id];
  rail.style.setProperty('--k', i / (STOPS.length - 1));
  $('[data-skip]', rail).hidden = i === STOPS.length - 1;
  if (id === 'dentro') xray.play();
}
const seen = new Map();
const io = new IntersectionObserver((es) => {
  es.forEach((e) => seen.set(e.target, e.intersectionRatio));
  let best = 0, bi = cur; STOPS.forEach((s, i) => { const v = seen.get(s) || 0; if (v > best + 0.01) { best = v; bi = i; } });
  if (best > 0 && bi !== cur) setCur(bi);
}, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1], rootMargin: '-25% 0px -25% 0px' });
STOPS.forEach((s) => io.observe(s));
// el riel aparece al entrar a la ruta y se va al salir de ella
const route = $('#route');
addEventListener('scroll', () => { const r = route.getBoundingClientRect(); rail.classList.toggle('is-on', r.top < innerHeight * 0.45 && r.bottom > innerHeight * 0.55); }, { passive: true });
$$('[data-step]', rail).forEach((a, i) => { a.onclick = (e) => { e.preventDefault(); go(i); }; });
$('[data-skip]', rail).onclick = () => go(cur + 1);
$$('[data-go]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); go(STOPS.findIndex((s) => s.dataset.stop === a.dataset.go)); }; });

// ---------- 1 · Elige ----------
const picks = $$('.pick__o');
function markPick() { picks.forEach((b) => b.setAttribute('aria-checked', String(st.picked && b.dataset.fam === st.fam))); }
picks.forEach((b) => {
  b.onclick = () => {
    const fam = b.dataset.fam, changed = fam !== st.fam;
    st.picked = true; keep({ fam }); markPick(); if (changed) renderAll();
    b.classList.add('is-chosen'); setTimeout(() => b.classList.remove('is-chosen'), 700);
    setTimeout(() => go(1), reduced() ? 0 : 420);                         // la ruta sigue sola
  };
});
// teclado: flechas entre las opciones (grupo de radio)
$('.pick').addEventListener('keydown', (e) => {
  const i = picks.indexOf(document.activeElement); if (i < 0) return;
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
  e.preventDefault(); picks[(i + d + picks.length) % picks.length].focus();
});

// ---------- 2 · Por dentro (rayos X) ----------
const xray = (() => {
  const box = $('#xr'), n = $('[data-xr-n]', box), x = $('[data-xr-x]', box), tags = $('[data-xr-tags]', box), line = $('[data-xr-line]', box), range = $('[data-xr-range]', box);
  const list = $('[data-xr-list]'), open3d = $('[data-open3d]');
  let v = 0, played = false, anim = 0, door = null;
  const set = (val) => {
    v = Math.max(0, Math.min(100, val)); box.style.setProperty('--v', v / 100); range.value = Math.round(v);
    $$('li', tags).forEach((t) => t.classList.toggle('is-on', +t.dataset.x * 100 < v));
    $$('li', list).forEach((t) => t.classList.toggle('is-on', +t.dataset.x * 100 < v));
  };
  const load = () => {
    door = escaner.puertas.find((d) => d.id === st.fam) || escaner.puertas[0];
    const img = (modo) => `<img src="${url(`img/inicio/escaner/${door.id}-alto-${modo}.webp`)}" alt="" width="900" height="1200" decoding="async" loading="lazy">`;
    n.innerHTML = img('normal'); x.innerHTML = img('rayos');
    box.setAttribute('aria-label', `${door.nombre} en rayos X`);
    const t = (door.tags.alto || []).slice().sort((a, b) => a.x - b.x);
    tags.innerHTML = t.map((g, k) => `<li style="--x:${g.x};--y:${g.y}" data-x="${g.x}"><i>${k + 1}</i></li>`).join('');
    list.innerHTML = t.map((g, k) => `<li data-x="${g.x}"><i>${k + 1}</i><span>${g.nombre}</span>${g.numero ? `<b>Pieza ${g.numero}</b>` : ''}</li>`).join('');
    open3d.href = url(PAGE[st.fam]); open3d.textContent = st.fam === 'cds' ? 'Ábrela y toma un producto en 3D' : 'Ábrela en 3D';
    set(played ? 62 : 0);
  };
  const play = () => {
    if (played) return; played = true;
    if (reduced()) { set(62); return; }
    const t0 = performance.now(), D = 1700;
    const step = (t) => { const k = Math.min(1, (t - t0) / D), e = 1 - (1 - k) ** 3; set(e * 62); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  // arrastrar la línea (horizontal: la página sigue bajando con el dedo en vertical)
  let drag = false;
  const at = (e) => { const r = box.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  box.addEventListener('pointerdown', (e) => { drag = true; cancelAnimationFrame(anim); played = true; set(at(e)); });
  addEventListener('pointermove', (e) => { if (drag) set(at(e)); }, { passive: true });
  addEventListener('pointerup', () => { drag = false; }); addEventListener('pointercancel', () => { drag = false; });
  range.oninput = () => { cancelAnimationFrame(anim); played = true; set(+range.value); };
  return { load, play };
})();

// ---------- 3 · A tu medida ----------
const cfgBox = $('[data-cfg]'), art = $('[data-art]');
const chip = (k, v, label, on, extra = '') => `<button type="button" class="chip" data-k="${k}" data-v="${v}" aria-pressed="${on}"${extra}>${label}</button>`;
function renderCfg() {
  const f = st.fam, c = cfgOf(), fins = ACABADOS_DE[f] || [];
  const uid = 'c' + Math.random().toString(36).slice(2, 6);
  let h = '';
  if (fins.length) h += `<div class="cfg__f"><span class="cfg__l" id="${uid}a">Acabado</span><div class="cfg__sw" role="group" aria-labelledby="${uid}a">${fins.map((a) => `<button type="button" class="sw sw--${a}" data-k="acabado" data-v="${a}" aria-pressed="${a === c.acabado}"><i aria-hidden="true"></i><span>${ACABADO_NOMBRE[a]}</span></button>`).join('')}</div></div>`;
  if (f === 'cds') {
    h += `<div class="cfg__f"><span class="cfg__l" id="${uid}m">Modelo</span><div class="cfg__mods" role="group" aria-labelledby="${uid}m">${Object.entries(CDS_MOD).map(([k, t]) => `<button type="button" class="mod" data-k="modelo" data-v="${k}" aria-pressed="${c.modelo === k}"><b>${t}</b><span>${MODELO_D[k]}</span></button>`).join('')}</div></div>
      <div class="cfg__f cfg__row"><span class="cfg__l" id="${uid}n">Puertas en el juego</span><div class="step" role="group" aria-labelledby="${uid}n"><button type="button" data-n="-1" aria-label="Una puerta menos">−</button><output data-out>${c.puertas}</output><button type="button" data-n="1" aria-label="Una puerta más">+</button></div></div>
      <div class="cfg__f"><span class="cfg__l" id="${uid}w">Ancho de cada puerta</span><div class="chips" role="group" aria-labelledby="${uid}w">${CDS_W.map((w) => chip('ancho', w, `${w}"`, c.ancho === w)).join('')}</div></div>
      <div class="cfg__f"><span class="cfg__l" id="${uid}h">Alto</span><div class="chips" role="group" aria-labelledby="${uid}h">${CDS_H.map((x) => chip('alto', x, `${x}"`, c.alto === x)).join('')}</div></div>`;
  } else {
    const [tw, th] = MEDIDA_TIPICA[f];
    h += `<fieldset class="cfg__f cfg__dim"><legend class="cfg__l">Medida del vano</legend>
        <label><span>Ancho</span><span class="step"><button type="button" data-d="ancho" data-s="-5" aria-label="5 cm menos de ancho">−</button><input data-k="ancho" inputmode="numeric" autocomplete="off" placeholder="${tw}" value="${c.ancho}" aria-label="Ancho del vano en centímetros"><button type="button" data-d="ancho" data-s="5" aria-label="5 cm más de ancho">+</button></span><em>cm</em></label>
        <label><span>Alto</span><span class="step"><button type="button" data-d="alto" data-s="-5" aria-label="5 cm menos de alto">−</button><input data-k="alto" inputmode="numeric" autocomplete="off" placeholder="${th}" value="${c.alto}" aria-label="Alto del vano en centímetros"><button type="button" data-d="alto" data-s="5" aria-label="5 cm más de alto">+</button></span><em>cm</em></label>
        <p class="cfg__hint">${c.ancho && c.alto ? `${(c.ancho * c.alto / 10000).toFixed(2)} m² de vano` : `Sin medida dibujamos una típica (${tw} × ${th} cm). Si no la tienes, la tomamos en la visita.`}</p>
      </fieldset>`;
    if (f === 'abatible') h += `<div class="cfg__f cfg__row"><span class="cfg__l" id="${uid}b">Bisagras</span><div class="chips" role="group" aria-labelledby="${uid}b">${chip('mano', 'izquierda', 'Izquierda', c.mano === 'izquierda')}${chip('mano', 'derecha', 'Derecha', c.mano === 'derecha')}</div></div>`;
    if (f === 'corrediza') h += `<div class="cfg__f cfg__row"><span class="cfg__l" id="${uid}b">Abre hacia la</span><div class="chips" role="group" aria-labelledby="${uid}b">${chip('mano', 'izquierda', 'Izquierda', c.mano === 'izquierda')}${chip('mano', 'derecha', 'Derecha', c.mano === 'derecha')}</div></div>`;
    if (f === 'vaiven') h += `<div class="cfg__f cfg__row"><span class="cfg__l" id="${uid}b">Hojas</span><div class="chips" role="group" aria-labelledby="${uid}b">${chip('hojas', 1, 'Una', c.hojas === 1)}${chip('hojas', 2, 'Dos', c.hojas !== 1)}</div></div>`;
    if (f !== 'vaiven') h += `<div class="cfg__f cfg__row"><span class="cfg__l" id="${uid}u">Uso</span><div class="chips" role="group" aria-labelledby="${uid}u">${chip('uso', 'refrigeracion', 'Refrigeración', c.uso !== 'congelacion')}${chip('uso', 'congelacion', 'Congelación', c.uso === 'congelacion')}</div></div>`;
  }
  cfgBox.innerHTML = h;
  $('[data-cfg-lead]').textContent = f === 'cds' ? 'Elige el modelo y cuántas puertas lleva el juego: el dibujo cambia contigo.'
    : fins.length ? 'Cambia el acabado y la medida: la puerta cambia contigo.' : 'Escribe la medida de tu vano: la puerta cambia contigo.';
  // acabado y opciones
  $$('[data-k][data-v]', cfgBox).forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.k, raw = b.dataset.v, v = /^\d+$/.test(raw) ? +raw : raw;
      $$(`[data-k="${k}"][data-v]`, cfgBox).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      if (st.fam === 'cds') keep({ cds: { ...st.cds, [k]: v } }); else keep({ [k]: v });
      if (k === 'acabado') toast(`Acabado: ${ACABADO_NOMBRE[v]}`);
      draw();
    };
  });
  // medida: se dibuja mientras escribes; −/+ de 5 en 5
  $$('input[data-k]', cfgBox).forEach((i) => {
    i.oninput = () => { const v = toCm(i.value); st[i.dataset.k] = v >= 30 ? v : ''; draw(true); };
    i.onchange = () => { const v = toCm(i.value); i.value = v >= 30 ? v : ''; keep({ [i.dataset.k]: v >= 30 ? v : '' }); draw(); };
  });
  $$('[data-d]', cfgBox).forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.d, [tw, th] = MEDIDA_TIPICA[st.fam], base = +st[k] || (k === 'ancho' ? tw : th);
      const v = Math.max(50, Math.min(600, base + +b.dataset.s)); keep({ [k]: v }); $(`input[data-k="${k}"]`, cfgBox).value = v; draw();
    };
  });
  $$('[data-n]', cfgBox).forEach((b) => {
    b.onclick = () => { const n = Math.max(1, Math.min(12, st.cds.puertas + +b.dataset.n)); keep({ cds: { ...st.cds, puertas: n } }); $('[data-out]', cfgBox).textContent = n; draw(); };
  });
  draw();
}
function draw(typing = false) {
  const c = cfgOf();
  art.innerHTML = doorArt(st.fam, c);
  const hint = $('.cfg__hint', cfgBox);
  if (hint && st.fam !== 'cds') { const [tw, th] = MEDIDA_TIPICA[st.fam]; hint.textContent = c.ancho && c.alto ? `${(c.ancho * c.alto / 10000).toFixed(2)} m² de vano` : `Sin medida dibujamos una típica (${tw} × ${th} cm). Si no la tienes, la tomamos en la visita.`; }
  if (!typing) { summary(); savings(); }
}
const open3D = () => import('../ui/ar.js').then(({ openAR }) => {
  const c = cfgOf();
  openAR(st.fam, st.fam === 'cds' ? {} : { ancho: c.ancho, alto: c.alto, acabado: c.acabado });
}).catch((e) => { console.error(e); toast('No se pudo abrir el 3D'); });
$('[data-3d]').onclick = open3D;

// ---------- 4 · En tu espacio ----------
const camDoor = $('[data-cam-door]');
$('[data-cam]').onclick = open3D;
function savings() {
  camDoor.style.backgroundImage = `url(${url(`img/inicio/ruta/${st.fam}.webp`)})`;
  const card = $('[data-save]');
  $('[data-cam-lead]').textContent = st.fam === 'cds' ? 'Con la cámara de tu celular, a tamaño real. Toca una puerta para abrirla y un producto para tomarlo.'
    : 'Con la cámara de tu celular, a tamaño real y con tu acabado. Tócala y se abre; tócala otra vez y se cierra.';
  if (st.fam === 'cds') { card.hidden = true; return; }
  card.hidden = false;
  const c = cfgOf(), [tw, th] = MEDIDA_TIPICA[st.fam];
  const base = { ancho: +c.ancho || tw, alto: +c.alto || th, tIn: c.uso === 'congelacion' ? -20 : 2, hrIn: c.uso === 'congelacion' ? 80 : 85, tOut: 30, hrOut: 50,
    aperturas: 100, segundos: 20, minutos: 30, proteccion: 'ninguna', precio: 4, alt: 2240 };
  const a = fuga(base), b = fuga({ ...base, segundos: 10, minutos: 0 });
  const ahorro = a && b ? a.mes.pesos - b.mes.pesos : 0;
  $('[data-save-n]').textContent = `${money.format(Math.round(ahorro / 10) * 10)}`;
  $('[data-save-d]').textContent = `al mes en luz, si tu puerta ${c.ancho && c.alto ? `de ${c.ancho} × ${c.alto} cm` : ''} cierra en 10 s en vez de 20 y deja de quedarse abierta media hora al día (${c.uso === 'congelacion' ? 'congelación' : 'refrigeración'}, 100 aperturas al día).`;
}

// ---------- 5 · Cotiza ----------
const sumEl = $('[data-sum]'), sumArt = $('[data-sum-art]');
let wa = null;
function summary() {
  const f = st.fam, c = cfgOf();
  const rows = [['Puerta', FAM_NAME[f]]];
  if (f === 'cds') rows.push(['Modelo', `${CDS_MOD[c.modelo]}: ${MODELO_D[c.modelo].toLowerCase()}`], ['Juego', `${c.puertas} ${c.puertas === 1 ? 'puerta' : 'puertas'} de ${c.ancho}" × ${c.alto}"`]);
  else {
    if (c.acabado) rows.push(['Acabado', ACABADO_NOMBRE[c.acabado]]);
    rows.push(['Medida', c.ancho && c.alto ? `${c.ancho} × ${c.alto} cm` : 'La tomamos en la visita']);
    if (f === 'abatible') rows.push(['Bisagras', `A la ${c.mano}`]);
    if (f === 'corrediza') rows.push(['Abre hacia', `La ${c.mano}`]);
    if (f === 'vaiven') rows.push(['Hojas', c.hojas === 1 ? 'Una' : 'Dos']);
    if (f !== 'vaiven') rows.push(['Uso', c.uso === 'congelacion' ? 'Congelación' : 'Refrigeración']);
  }
  sumEl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  sumArt.innerHTML = doorArt(f, c);
  const ctx = { tipo: 'medida', fam: f, cfg: { ...c, sinMedida: !(c.ancho && c.alto) && f !== 'cds' } };
  if (!wa) { wa = waButton(ctx, { cls: 'btn btn--line' }); $('[data-wa]').replaceWith(wa); } else waUpdate(wa, ctx);
}
$('[data-quote]').onclick = () => {
  const f = st.fam, c = cfgOf();
  const nombre = `${FAM_NAME[f]}${c.acabado ? ', ' + ACABADO_NOMBRE[c.acabado].toLowerCase() : ''}${f === 'cds' ? ' ' + CDS_MOD[c.modelo] : ''}`;
  const id = `puerta-${f}-r${Date.now().toString(36)}`;
  const cfg = f === 'cds' ? c : { ...c, sinMedida: !(c.ancho && c.alto) };
  // la misma puerta, con la misma configuración, no se agrega dos veces
  const same = solicitud.all().find((x) => x.id.startsWith(`puerta-${f}-r`) && JSON.stringify(x.cfg) === JSON.stringify(cfg));
  if (!same) solicitud.add({ id, nombre, tipo: 'Puerta', cantidad: 1, cfg });
  toast(`${FAM_NAME[f]}: ${describe(f, cfg)}`);
  setTimeout(() => { location.href = url('cotizar/'); }, reduced() ? 0 : 350);
};

// ---------- todo a la vez cuando cambia la puerta ----------
function renderAll() { xray.load(); renderCfg(); }
markPick(); renderAll(); setCur(0);
// si otra pestaña o página cambia la medida, se refleja aquí
addEventListener('st:vano', (e) => {
  if (e.detail && e.detail.__from === ME) return;
  const v = vano.get(); Object.assign(st, { ancho: v.ancho || '', alto: v.alto || '', acabado: v.acabado || st.acabado });
  if (!cfgBox.contains(document.activeElement)) renderCfg();
});

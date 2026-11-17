// Catálogo de componentes: búsqueda, filtros por puerta y tipo, ficha con foto ampliable y enlaces a la puerta 3D.
// Al abrir no se listan las 76 piezas: primero se elige una puerta o se busca (brief §6).
import { url, solicitud, toast, createSheet } from './site.js';
import { partPicture } from './picture.js';
import data from '../data/components.json';
import en3d from '../data/piezas-3d.json';

// medida escrita en el nombre de la pieza ("5.80 m", "68 mm", "250 × 750 mm", "diámetro 22 mm"); nada si no trae
const dimOf = (n) => {
  const m = n.match(/(\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*mm)|(\d+(?:[.,]\d+)?\s*(?:mm|m))(?![a-z])/i);
  if (!m) return '';
  return (/diámetro/i.test(n) ? 'Ø ' : '') + m[0].replace(/\s*x\s*/i, ' × ');
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const FAM = Object.fromEntries(data.familias.map((f) => [f.id, f]));
const TIPO = Object.fromEntries(data.tipos.map((t) => [t.id, t]));
const PDF = { 'ABATIBLE.pdf': 'Catálogo Abatible', 'CORREDIZA.pdf': 'Catálogo Corrediza', 'VAIVEN.pdf': 'Catálogo Vaivén' };
const doorUrl = (f) => url(`industriales/${f}/`);
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// orden del catálogo impreso: por número; las piezas sin número al final
const piezas = [...data.piezas].sort((a, b) => (a.numero ? +a.numero : 999) - (b.numero ? +b.numero : 999) || a.nombre.localeCompare(b.nombre, 'es'));
const text = new Map(piezas.map((p) => [p.id, fold([p.nombre, TIPO[p.tipo].nombre, ...p.familias.map((f) => FAM[f].nombre)].join(' '))]));
// en qué puerta 3D está señalada cada pieza
const in3d = (p) => Object.keys(en3d.puertas).filter((f) => en3d.puertas[f].includes(p.id));

// Búsqueda: todas las palabras deben aparecer. Un número busca el número de pieza (3 = 03) o una medida del nombre.
function matches(p, q) {
  const words = fold(q).trim().split(/\s+/).filter(Boolean).filter((w) => w !== 'pieza');
  return words.every((w) => (/^\d+$/.test(w) && p.numero && +p.numero === +w) || text.get(p.id).includes(w));
}
const exactNumber = (p, q) => /^\s*(pieza\s+)?\d+\s*$/i.test(q) && p.numero && +p.numero === +q.replace(/\D/g, '');

export function mountCatalog() {
  const qs = new URLSearchParams(location.search);
  const state = { fam: FAM[qs.get('fam')] ? qs.get('fam') : '', tipo: TIPO[qs.get('tipo')] ? qs.get('tipo') : '', q: qs.get('q') || '' };
  const q = $('#q'), grid = $('#catGrid'), start = $('#catStart'), empty = $('#catEmpty'), count = $('#catCount');
  let list = [];

  $('#catLead').textContent = `${piezas.length} piezas de las puertas industriales ST con fotografía real, con el número y el nombre del catálogo impreso.`;

  // puertas: tarjetas de entrada (estado inicial) y chips de filtro
  start.innerHTML = data.familias.map((f, i) => `<button class="cat-fam" data-f="${f.id}" style="--i:${i * 3}">
      <span class="part__img"><img src="${url(`img/puertas/${f.id}.webp`)}" alt="" width="640" height="480" loading="lazy" decoding="async"><span class="part__x part__x--door" aria-hidden="true"><img src="${url(`img/inicio/escaner/${f.id}-alto-rayos.webp`)}" alt="" width="900" height="1200" loading="lazy" decoding="async"></span></span>
      <span class="cat-fam__t"><b>Puerta ${f.nombre.toLowerCase()}</b><span>${f.piezas} piezas</span></span></button>`).join('');
  $('#famChips').innerHTML = data.familias.map((f) => `<button class="chip" data-f="${f.id}" aria-pressed="false">${f.nombre} <span class="chip__n">${f.piezas}</span></button>`).join('');
  $$('.cat-fam', start).forEach((b) => { b.onclick = () => { state.fam = b.dataset.f; state.tipo = ''; render(); grid.querySelector('.part')?.focus({ preventScroll: true }); }; });
  $$('#famChips .chip').forEach((b) => { b.onclick = () => { state.fam = state.fam === b.dataset.f ? '' : b.dataset.f; state.tipo = ''; render(); }; });

  q.value = state.q;
  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = q.value; render(); }, 120); });
  $('#catForm').onsubmit = (e) => { e.preventDefault(); state.q = q.value; render(); q.blur(); };
  $('#qClear').onclick = () => { q.value = state.q = ''; render(); q.focus(); };
  $('#catReset').onclick = () => { q.value = state.q = ''; state.fam = state.tipo = ''; render(); q.focus(); };

  function sync() {
    const p = new URLSearchParams();
    if (state.fam) p.set('fam', state.fam); if (state.tipo) p.set('tipo', state.tipo); if (state.q.trim()) p.set('q', state.q.trim());
    if (sheetPiece) p.set('id', sheetPiece.id);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  }

  function render() {
    const searching = !!state.q.trim();
    $('#qClear').hidden = !q.value;
    $$('#famChips .chip').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === state.fam));
    const base = piezas.filter((p) => (!state.fam || p.familias.includes(state.fam)) && (!searching || matches(p, state.q)));
    // tipos: solo los que hay en lo que se está viendo
    const tipos = data.tipos.map((t) => ({ ...t, n: base.filter((p) => p.tipo === t.id).length })).filter((t) => t.n);
    if (state.tipo && !tipos.some((t) => t.id === state.tipo)) state.tipo = '';
    const tc = $('#typeChips'); tc.hidden = !(state.fam || searching) || tipos.length < 2;
    tc.innerHTML = tipos.map((t) => `<button class="chip chip--sm" data-t="${t.id}" aria-pressed="${t.id === state.tipo}">${t.nombre} <span class="chip__n">${t.n}</span></button>`).join('');
    $$('.chip', tc).forEach((b) => { b.onclick = () => { state.tipo = state.tipo === b.dataset.t ? '' : b.dataset.t; render(); }; });

    list = base.filter((p) => !state.tipo || p.tipo === state.tipo);
    if (searching) list.sort((a, b) => exactNumber(b, state.q) - exactNumber(a, state.q));
    const showing = state.fam || searching;
    start.hidden = !!showing; grid.hidden = !showing || !list.length; empty.hidden = !showing || !!list.length;
    count.textContent = !showing ? 'Elige una puerta o busca una pieza.'
      : `${list.length} ${list.length === 1 ? 'pieza' : 'piezas'}${state.fam ? ' de la puerta ' + FAM[state.fam].nombre.toLowerCase() : ''}${state.tipo ? ' · ' + TIPO[state.tipo].nombre : ''}${searching ? ` para «${state.q.trim()}»` : ''}`;
    grid.innerHTML = list.map((p, i) => `<li><button class="part" data-id="${p.id}" style="--i:${Math.min(i, 24)}"><span class="part__img">${partPicture(p)}<span class="part__x" aria-hidden="true">${partPicture(p)}${dimOf(p.nombre) ? `<span class="part__dim">${dimOf(p.nombre)}</span>` : ''}</span></span><span class="part__t">${p.nombre}<small>${p.numero ? 'Pieza ' + p.numero : 'Sin número'}${state.fam ? '' : ' · ' + p.familias.map((f) => FAM[f].nombre).join(' y ')}</small></span></button></li>`).join('');
    $$('.part', grid).forEach((b) => { b.onclick = () => openSheet(piezas.find((p) => p.id === b.dataset.id)); });
    sync();
  }

  // ---------- Fase 10G · Rayos X del catálogo: las fotos pasan a un plano azul y se marca la medida del nombre ----------
  const xb = $('#catXray');
  if (xb) {
    const setX = (on) => { document.body.classList.toggle('is-xray', on); xb.setAttribute('aria-pressed', on); try { sessionStorage.setItem('st.xray', on ? '1' : '0'); } catch { /* sin almacenamiento */ } };
    xb.onclick = () => setX(!document.body.classList.contains('is-xray'));
    try { if (sessionStorage.getItem('st.xray') === '1') setX(true); } catch { /* sin almacenamiento */ }
  }

  // ---------- ficha ----------
  const sheet = createSheet('Ficha de la pieza');
  let sheetPiece = null;
  sheet.onclose = () => { sheetPiece = null; sync(); };

  function openSheet(p) {
    const wasOpen = !!sheetPiece; sheetPiece = p;
    const i = list.indexOf(p), prev = i > 0 ? list[i - 1] : null, next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
    const doors3d = in3d(p);
    sheet.meta.textContent = p.numero ? `Pieza ${p.numero}` : 'Sin número de catálogo';
    sheet.body.innerHTML = `
      <button class="cat-pic" data-zoom-open aria-label="Ampliar foto de ${p.nombre}">${partPicture(p, { sizes: '(max-width: 560px) 100vw, 480px', alt: p.nombre, eager: true })}<span class="cat-pic__hint t-small">Ampliar</span></button>
      <div class="stack" style="--stack:20px">
        <h2 class="t-h3">${p.nombre}</h2>
        ${p.avisos.map((a) => `<p class="cat-warn t-small"><b>Por confirmar.</b> ${a}</p>`).join('')}
        <dl class="spec cat-spec">
          <div><dt>Tipo</dt><dd>${TIPO[p.tipo].nombre}</dd></div>
          <div><dt>Se usa en</dt><dd>${p.familias.map((f) => `<a class="link" href="${doorUrl(f)}">Puerta ${FAM[f].nombre.toLowerCase()}</a>`).join('<br>')}</dd></div>
          <div><dt>Fuente</dt><dd>${p.pdf.map((x) => PDF[x] || x).join(', ')}</dd></div>
        </dl>
        <div class="row">
          <button class="btn" data-add></button>
          ${doors3d.map((f) => `<a class="btn btn--line" href="${doorUrl(f)}?pieza=${p.id}#como">Verla en la puerta ${FAM[f].nombre.toLowerCase()} 3D</a>`).join('')}
        </div>
        ${list.length > 1 && i >= 0 ? `<nav class="cat-pager" aria-label="Otras piezas"><button class="btn btn--line btn--sm" data-go="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'}>Anterior</button><span class="t-small t-soft">${i + 1} de ${list.length}</span><button class="btn btn--line btn--sm" data-go="${next ? next.id : ''}" ${next ? '' : 'disabled'}>Siguiente</button></nav>` : ''}
      </div>`;
    const add = $('[data-add]', sheet.body);
    const paint = () => { const has = solicitud.has(p.id); add.textContent = has ? 'Quitar de tu solicitud' : 'Agregar a tu solicitud'; add.classList.toggle('btn--line', has); };
    add.onclick = () => {
      if (solicitud.has(p.id)) { solicitud.remove(p.id); toast('Se quitó de tu solicitud'); }
      else { solicitud.add({ id: p.id, nombre: p.nombre + (p.numero ? ` (pieza ${p.numero})` : ''), tipo: 'Pieza' }); toast('Se agregó a tu solicitud'); }
      paint();
    };
    paint();
    $('[data-zoom-open]', sheet.body).onclick = () => openZoom(p);
    $$('[data-go]', sheet.body).forEach((b) => { b.onclick = () => { openSheet(piezas.find((x) => x.id === b.dataset.go)); $(`[data-go]:not([disabled])`, sheet.body)?.focus(); }; });
    sheet.el.scrollTop = 0;
    if (!wasOpen) sheet.open();
    sync();
  }

  // ---------- foto ampliada ----------
  const zoom = $('#catZoom'), zimg = $('.cat-zoom__img', zoom), zbtn = $('[data-zoom]', zoom);
  function openZoom(p) {
    zimg.innerHTML = `<img src="${url('img/componentes/' + p.imagen['1600'].webp)}" alt="${p.nombre}" width="1600" height="1200">`;
    $('.photo-dlg__cap', zoom).textContent = `${p.numero ? 'Pieza ' + p.numero + ' · ' : ''}${p.nombre}`;
    setZoom(false); zoom.showModal();
  }
  const setZoom = (on) => { zoom.classList.toggle('is-zoomed', on); zbtn.setAttribute('aria-pressed', on); zbtn.textContent = on ? 'Ver completa' : 'Acercar'; if (on) { zimg.scrollLeft = (zimg.scrollWidth - zimg.clientWidth) / 2; zimg.scrollTop = (zimg.scrollHeight - zimg.clientHeight) / 2; } };
  zbtn.onclick = () => setZoom(!zoom.classList.contains('is-zoomed'));
  zimg.ondblclick = () => setZoom(!zoom.classList.contains('is-zoomed'));
  $('[data-close]', zoom).onclick = () => zoom.close();
  zoom.addEventListener('click', (e) => { if (e.target === zoom) zoom.close(); });
  zoom.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zoom.close(); } });
  zoom.addEventListener('close', () => $('[data-zoom-open]', sheet.body)?.focus());

  render();
  const want = piezas.find((p) => p.id === qs.get('id'));
  if (want) openSheet(want);
  window.__catalog = { state, list: () => list, open: openSheet };
}

// Catálogo de componentes: búsqueda, filtros por puerta y tipo, ficha con foto ampliable y enlaces a la puerta 3D.
// Al abrir no se listan las 76 piezas: primero se elige una puerta o se busca (brief §6).
import { url, solicitud, toast, createSheet } from './site.js';
import { partPicture } from './picture.js';
import data from '../data/components.json';
import en3d from '../data/piezas-3d.json';
import flot from '../data/flotantes.json';
import escaner from '../data/escaner.json';

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
// Fase 10I · medida escrita en el nombre (5.80 m, 68 mm, 250 × 750 mm) para la cota de la ficha
const dimOf = (n) => {
  const m = n.match(/(\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*mm)|(\d+(?:[.,]\d+)?\s*(?:mm|m))(?![a-z])/i);
  return m ? (/diámetro/i.test(n) ? 'Ø ' : '') + m[0].replace(/\s*x\s*/i, ' × ') : '';
};
// recorte con fondo transparente de la pieza, si lo hay (scripts/build-flotantes.py)
const cut = new Map(flot.piezas.map((f) => [f.id, f]));
// dónde va en la puerta: posición de la pieza en la imagen del escáner (vertical), por número y puerta
const spot = (p, fam) => {
  const d = escaner.puertas.find((x) => x.id === fam); if (!d || !p.numero) return null;
  return (d.tags.alto || []).find((t) => t.numero === p.numero) || null;
};
const exactNumber = (p, q) => /^\s*(pieza\s+)?\d+\s*$/i.test(q) && p.numero && +p.numero === +q.replace(/\D/g, '');

export function mountCatalog() {
  const qs = new URLSearchParams(location.search);
  const state = { fam: FAM[qs.get('fam')] ? qs.get('fam') : '', tipo: TIPO[qs.get('tipo')] ? qs.get('tipo') : '', q: qs.get('q') || '' };
  const q = $('#q'), grid = $('#catGrid'), start = $('#catStart'), empty = $('#catEmpty'), count = $('#catCount');
  let list = [];

  $('#catLead').textContent = `${piezas.length} piezas de las puertas industriales ST con fotografía real, con el número y el nombre del catálogo impreso.`;

  // puertas: tarjetas de entrada (estado inicial) y chips de filtro
  start.innerHTML = data.familias.map((f, i) => `<button class="cat-fam" data-f="${f.id}" style="--i:${i * 3}">
      <span class="part__img"><img src="${url(`img/puertas/${f.id}.webp`)}" alt="" width="640" height="480" loading="lazy" decoding="async"></span>
      <span class="cat-fam__t"><b>Puerta ${f.nombre.toLowerCase()}</b><span>${f.piezas} piezas</span></span></button>`).join('');
  $('#famChips').innerHTML = data.familias.map((f) => `<button class="chip" data-f="${f.id}" aria-pressed="false">${f.nombre} <span class="chip__n">${f.piezas}</span></button>`).join('');
  // Fase 10I · también por tipo de pieza, cada tipo con una pieza real recortada
  const typeImg = (t) => { const p = piezas.find((x) => x.tipo === t.id && cut.has(x.id)) || piezas.find((x) => x.tipo === t.id); const c = p && cut.get(p.id);
    return c ? `<img src="${url(c.img)}" alt="" width="${c.w}" height="${c.h}" loading="lazy" decoding="async">` : (p ? partPicture(p, { sizes: '120px' }) : ''); };
  start.insertAdjacentHTML('beforeend', `<h2 class="cat-types__t t-h3">O por tipo de pieza</h2><ul class="cat-tiles">${data.tipos.slice().sort((a, b) => b.piezas - a.piezas).map((t) => `<li><button class="cat-tile" data-t="${t.id}"><span class="cat-tile__img">${typeImg(t)}</span><b>${t.nombre}</b><span>${piezas.filter((p) => p.tipo === t.id).length} piezas</span></button></li>`).join('')}</ul>`);
  $$('.cat-tile', start).forEach((b) => { b.onclick = () => { state.tipo = b.dataset.t; state.fam = ''; render(); grid.querySelector('.part')?.focus({ preventScroll: true }); }; });
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
    const tc = $('#typeChips'); tc.hidden = !(state.fam || searching || state.tipo) || tipos.length < 2;
    tc.innerHTML = tipos.map((t) => `<button class="chip chip--sm" data-t="${t.id}" aria-pressed="${t.id === state.tipo}">${t.nombre} <span class="chip__n">${t.n}</span></button>`).join('');
    $$('.chip', tc).forEach((b) => { b.onclick = () => { state.tipo = state.tipo === b.dataset.t ? '' : b.dataset.t; render(); }; });

    list = base.filter((p) => !state.tipo || p.tipo === state.tipo);
    if (searching) list.sort((a, b) => exactNumber(b, state.q) - exactNumber(a, state.q));
    const showing = state.fam || searching || state.tipo;
    start.hidden = !!showing; grid.hidden = !showing || !list.length; empty.hidden = !showing || !!list.length;
    count.textContent = !showing ? 'Elige una puerta o busca una pieza.'
      : `${list.length} ${list.length === 1 ? 'pieza' : 'piezas'}${state.fam ? ' de la puerta ' + FAM[state.fam].nombre.toLowerCase() : ''}${state.tipo ? ` de ${TIPO[state.tipo].nombre.toLowerCase()}` : ''}${searching ? ` para «${state.q.trim()}»` : ''}`;
    grid.innerHTML = list.map((p, i) => `<li><button class="part" data-id="${p.id}" style="--i:${Math.min(i, 24)}"><span class="part__img">${partPicture(p)}${p.numero ? `<span class="part__n" aria-hidden="true">${p.numero}</span>` : ''}</span><span class="part__t">${p.nombre}<small>${p.numero ? 'Pieza ' + p.numero : 'Sin número'}${state.fam ? '' : ' · ' + p.familias.map((f) => FAM[f].nombre).join(' y ')}</small></span></button></li>`).join('');
    $$('.part', grid).forEach((b) => { b.onclick = () => openSheet(piezas.find((p) => p.id === b.dataset.id)); });
    sync();
  }

  // ---------- ficha ----------
  const sheet = createSheet('Ficha de la pieza');
  let sheetPiece = null;
  sheet.onclose = () => { sheetPiece = null; sync(); };

  // Fase 10I · ficha técnica: número grande, foto sobre retícula con su cota, datos, dónde va en la puerta, cantidad,
  // copiar la referencia y piezas de la misma puerta
  function openSheet(p) {
    const wasOpen = !!sheetPiece; sheetPiece = p;
    const i = list.indexOf(p), prev = i > 0 ? list[i - 1] : null, next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
    const doors3d = in3d(p), dim = dimOf(p.nombre);
    const fam0 = p.familias.find((f) => spot(p, f)) || null, sp = fam0 && spot(p, fam0);
    const famTxt = p.familias.map((f) => `Puerta ${FAM[f].nombre.toLowerCase()}`).join(' y ');
    const ref = `${p.numero ? 'Pieza ' + p.numero + ' · ' : ''}${p.nombre} · ${famTxt}`;
    const rel = piezas.filter((x) => x !== p && x.tipo === p.tipo && x.familias.some((f) => p.familias.includes(f))).slice(0, 8);
    sheet.meta.textContent = p.numero ? `Pieza ${p.numero}` : 'Sin número de catálogo';
    sheet.body.innerHTML = `
      <article class="pz">
        <header class="pz__head">
          ${p.numero ? `<span class="pz__num" aria-hidden="true">${p.numero}</span>` : ''}
          <div><p class="pz__kind">${TIPO[p.tipo].nombre} · ${famTxt}</p><h2 class="pz__name">${p.nombre}</h2></div>
        </header>
        <button class="pz__pic" data-zoom-open aria-label="Ampliar foto de ${p.nombre}">${partPicture(p, { sizes: '(max-width: 560px) 100vw, 480px', alt: p.nombre, eager: true })}
          ${dim ? `<span class="pz__dim" aria-hidden="true"><i></i><b>${dim}</b><i></i></span>` : ''}<span class="pz__zoom t-small">Ampliar</span></button>
        ${p.avisos.map((a) => `<p class="cat-warn t-small"><b>Por confirmar.</b> ${a}</p>`).join('')}
        <dl class="pz__spec">
          <div><dt>Número de catálogo</dt><dd>${p.numero || 'Sin número'}</dd></div>
          <div><dt>Tipo</dt><dd>${TIPO[p.tipo].nombre}</dd></div>
          ${dim ? `<div><dt>Medida</dt><dd>${dim}</dd></div>` : ''}
          <div><dt>Se usa en</dt><dd>${p.familias.map((f) => `<a class="link" href="${doorUrl(f)}">Puerta ${FAM[f].nombre.toLowerCase()}</a>`).join('<br>')}</dd></div>
          <div><dt>Fuente</dt><dd>${p.pdf.map((x) => PDF[x] || x).join(', ')}</dd></div>
        </dl>
        ${sp ? `<section class="pz__where" aria-label="Dónde va">
          <div class="pz__door"><img src="${url(`img/inicio/escaner/${fam0}-alto-normal.webp`)}" alt="Puerta ${FAM[fam0].nombre.toLowerCase()}" width="900" height="1200" loading="lazy" decoding="async"><i class="pz__spot" style="--x:${sp.x};--y:${sp.y}" aria-hidden="true"></i></div>
          <div class="pz__where-t"><h3>Dónde va</h3><p>En la puerta ${FAM[fam0].nombre.toLowerCase()}, en el punto marcado.</p></div>
        </section>` : ''}
        ${doors3d.length ? `<p class="row">${doors3d.map((f) => `<a class="btn btn--line" href="${doorUrl(f)}?pieza=${p.id}#como">Verla en la puerta ${FAM[f].nombre.toLowerCase()} 3D</a>`).join('')}</p>` : ''}
        <div class="pz__act">
          <div class="q-qty" role="group" aria-label="Cantidad"><button type="button" data-q="-1" aria-label="Una menos">−</button><input type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Cantidad" data-qty><button type="button" data-q="1" aria-label="Una más">+</button></div>
          <button class="btn" data-add></button>
        </div>
        <p class="pz__ref"><button type="button" class="link" data-copy>Copiar referencia</button>${navigator.share ? '<button type="button" class="link" data-share>Compartir</button>' : ''}<span class="t-small t-soft" data-ref>${ref}</span></p>
        ${rel.length ? `<section class="pz__rel" aria-label="Más piezas"><h3>${TIPO[p.tipo].nombre} de la misma puerta</h3><ul>${rel.map((x) => `<li><button class="pz__mini" data-go="${x.id}">${partPicture(x, { sizes: '120px' })}<span>${x.numero ? `<b>${x.numero}</b> ` : ''}${x.nombre}</span></button></li>`).join('')}</ul></section>` : ''}
        ${list.length > 1 && i >= 0 ? `<nav class="cat-pager" aria-label="Otras piezas"><button class="btn btn--line btn--sm" data-go="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'}>Anterior</button><span class="t-small t-soft">${i + 1} de ${list.length}</span><button class="btn btn--line btn--sm" data-go="${next ? next.id : ''}" ${next ? '' : 'disabled'}>Siguiente</button></nav>` : ''}
      </article>`;
    const add = $('[data-add]', sheet.body), qty = $('[data-qty]', sheet.body);
    const cur = () => solicitud.all().find((x) => x.id === p.id);
    if (cur()) qty.value = cur().cantidad || 1;
    const paint = () => { const has = !!cur(); add.textContent = has ? 'Quitar de tu solicitud' : 'Agregar a tu solicitud'; add.classList.toggle('btn--line', has); };
    const setQ = (v) => { v = Math.max(1, Math.min(99, Math.round(+v) || 1)); qty.value = v; if (cur()) solicitud.update(p.id, { cantidad: v }); };
    $$('[data-q]', sheet.body).forEach((b) => { b.onclick = () => setQ(+qty.value + +b.dataset.q); });
    qty.onchange = () => setQ(qty.value);
    add.onclick = () => {
      if (cur()) { solicitud.remove(p.id); toast('Se quitó de tu solicitud'); }
      else { solicitud.add({ id: p.id, nombre: p.nombre + (p.numero ? ` (pieza ${p.numero})` : ''), tipo: 'Pieza', cantidad: +qty.value || 1 }); toast('Se agregó a tu solicitud'); }
      paint();
    };
    paint();
    $('[data-copy]', sheet.body).onclick = async () => {
      try { await navigator.clipboard.writeText(ref); toast('Referencia copiada'); }
      catch { const r = document.createRange(); r.selectNodeContents($('[data-ref]', sheet.body)); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Referencia seleccionada: cópiala'); }
    };
    const sh = $('[data-share]', sheet.body);
    if (sh) sh.onclick = () => navigator.share({ title: p.nombre, text: ref, url: `${location.origin}${url('componentes/')}?id=${p.id}` }).catch(() => {});
    $('[data-zoom-open]', sheet.body).onclick = () => openZoom(p);
    $$('[data-go]', sheet.body).forEach((b) => { b.onclick = () => { const x = piezas.find((y) => y.id === b.dataset.go); if (!x) return; openSheet(x); $(`[data-go]:not([disabled])`, sheet.body)?.focus(); }; });
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

  // ---------- Fase 10H · mesa de piezas: se agarran y se lanzan; tocar una abre su ficha ----------
  const mesa = $('#catMesa');
  if (mesa) {
    const M = [['corrediza-39', -12], ['abatible-30', 8], ['vaiven-02', -6], ['corrediza-37', 12], ['abatible-27', -10], ['corrediza-41', 6], ['vaiven-05', -14], ['corrediza-76', 4]];
    const narrow = () => mesa.clientWidth < 560;
    import('./floaters.js').then(({ mountFloaters }) => mountFloaters(mesa, M.map(([key, r], i) => ({
      key, r, s: 0.24, z: [1, 0.95, 0.9, 1, 1.05, 0.9, 0.95, 1][i],
      x: 0.12 + (i % 4) * 0.25, y: i < 4 ? 0.3 : 0.7,
    })), { size: (w) => (narrow() ? w * 0.85 : w), edge: 0.15, tag: false, onPick: (it) => openSheet(it.pieza) })).catch((e) => console.error(e));
  }

  render();
  const want = piezas.find((p) => p.id === qs.get('id'));
  if (want) openSheet(want);
  window.__catalog = { state, list: () => list, open: openSheet };
}

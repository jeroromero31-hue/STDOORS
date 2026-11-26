// Cotizar: la solicitud se edita aquí y se envía por un canal real (correo o WhatsApp) que abre el propio usuario.
// No hay servidor configurado, así que la página no finge un envío: abre el programa con el texto listo o lo copia.
import { solicitud, contacto, toast, url } from './site.js';
import { track, adRef } from './track.js';
import catalog from '../data/components.json';
import { FAM_NAME, famOf, defaults, toCm, describe, plano, CDS_W, CDS_H, CDS_MOD } from './medida.js';
import { vano } from './vano.js';
import { doorArt, ACABADOS_DE, ACABADO_NOMBRE } from './preview.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAX = 99;

export function mountQuote() {
  const list = $('#qItems'), form = $('#qForm');
  // Fase 10J · WhatsApp siempre: directo al chat de ST cuando su número esté confirmado; mientras, con el mensaje listo
  const wa = $('[data-via=whatsapp]', form);
  wa.hidden = false; wa.textContent = contacto.whatsapp ? 'Enviar por WhatsApp' : 'Mandar por WhatsApp';
  $('#qHow').textContent = contacto.whatsapp
    ? 'Elige cómo enviarla. Se abre tu correo o WhatsApp con todo escrito; la envías tú desde ahí.'
    : `Elige cómo enviarla: por correo (dirigido a ${contacto.correo}) o por WhatsApp, con todo escrito; la envías tú desde ahí. También puedes copiar el texto.`;

  // miniatura de una pieza: su foto del catálogo
  function thumb(x) {
    const p = catalog.piezas.find((c) => c.id === x.id);
    if (p) return `<span class="q-thumb" aria-hidden="true"><img src="${url('img/componentes/' + p.imagen['480'].webp)}" alt="" loading="lazy" decoding="async"></span>`;
    return '<span class="q-thumb q-thumb--none" aria-hidden="true"></span>';
  }
  const planEl = $('#qPlan'); let shown = { p: 0, c: 0, u: 0 };
  function plan(items) {
    if (!planEl) return;
    const doors = items.filter((x) => x.tipo === 'Puerta' || x.id.startsWith('puerta-'));
    const now = { p: doors.length, c: items.length - doors.length, u: items.reduce((a, x) => a + (x.cantidad || 1), 0) };
    planEl.hidden = !items.length;
    const from = { ...shown }, t0 = performance.now(), red = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (t) => {
      const k = red ? 1 : Math.min(1, (t - t0) / 600), e = 1 - (1 - k) ** 3;
      ['p', 'c', 'u'].forEach((key) => { const el = planEl.querySelector(`[data-k=${key}]`); if (el) el.textContent = Math.round(from[key] + (now[key] - from[key]) * e); });
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick); shown = now;
    planEl.classList.remove('is-scan'); void planEl.offsetWidth; planEl.classList.add('is-scan');
  }

  // ---------- productos ----------
  // Fase 10H · cada puerta es una ficha a la medida con su plano; las piezas, un renglón con cantidad
  const qty = (x, label) => `<div class="q-qty" role="group" aria-label="${label} de ${x.nombre}">
          <button type="button" data-d="-1" aria-label="Uno menos">−</button>
          <input type="number" inputmode="numeric" min="1" max="${MAX}" value="${x.cantidad || 1}" aria-label="${label}">
          <button type="button" data-d="1" aria-label="Uno más">+</button>
        </div>`;
  const chips = (k, label, opts, cur) => `<div class="q-f"><span class="q-f__l" id="l-${k}-${uid}">${label}</span><div class="chips" role="group" aria-labelledby="l-${k}-${uid}">${opts.map(([v, t]) => `<button type="button" class="chip chip--sm" data-k="${k}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${t}</button>`).join('')}</div></div>`;
  let uid = 0, mine = false;
  const own = (fn) => { mine = true; try { fn(); } finally { mine = false; } };
  const finOf = (fam, x) => (ACABADOS_DE[fam] || []).find((f) => x.id.includes(`-${f}`)) || (ACABADOS_DE[fam] || [])[0] || '';
  function doorCard(x) {
    const fam = famOf(x.id), c = { ...defaults(fam, x), acabado: finOf(fam, x), ...(x.cfg || {}) }; uid++;
    const fins = ACABADOS_DE[fam] || [];
    const finChips = fins.length ? `<div class="q-f"><span class="q-f__l" id="l-acabado-${uid}">Acabado</span><div class="chips q-fin" role="group" aria-labelledby="l-acabado-${uid}">${fins.map((f) => `<button type="button" class="chip chip--sm" data-k="acabado" data-v="${f}" aria-pressed="${c.acabado === f}"><i aria-hidden="true"></i>${ACABADO_NOMBRE[f]}</button>`).join('')}</div></div>` : '';
    const body = fam === 'cds' ? `
        <div class="q-f"><span class="q-f__l" id="l-n-${uid}">Puertas en el juego</span>
          <div class="q-qty" role="group" aria-labelledby="l-n-${uid}"><button type="button" data-n="-1" aria-label="Una puerta menos">−</button><output data-out="puertas">${c.puertas}</output><button type="button" data-n="1" aria-label="Una puerta más">+</button></div></div>
        ${chips('ancho', 'Ancho de cada puerta', CDS_W.map((w) => [w, `${w}"`]), c.ancho)}
        ${chips('alto', 'Alto', CDS_H.map((h) => [h, `${h}"`]), c.alto)}
        ${chips('modelo', 'Modelo', Object.entries(CDS_MOD), c.modelo)}` : `
        ${finChips}
        <fieldset class="q-f q-dim">
          <legend class="q-f__l">Medida del vano</legend>
          <div class="q-dim__in">
            <label><span class="sr-only">Ancho del vano, en centímetros</span><input data-k="ancho" inputmode="decimal" autocomplete="off" placeholder="Ancho" value="${c.ancho}"${c.sinMedida ? ' disabled' : ''}></label>
            <span aria-hidden="true">×</span>
            <label><span class="sr-only">Alto del vano, en centímetros</span><input data-k="alto" inputmode="decimal" autocomplete="off" placeholder="Alto" value="${c.alto}"${c.sinMedida ? ' disabled' : ''}></label>
            <span class="q-dim__u">cm</span>
          </div>
          <p class="q-dim__h t-small t-soft" data-area>${c.ancho && c.alto && !c.sinMedida ? `${(c.ancho * c.alto / 10000).toFixed(2)} m² de vano` : 'En centímetros, o en metros: 1.20 × 2.10'}</p>
          <label class="q-check"><input type="checkbox" data-k="sinMedida"${c.sinMedida ? ' checked' : ''}> Aún no la tengo: que la tomen en la visita</label>
        </fieldset>
        ${fam === 'vaiven' ? chips('hojas', 'Hojas', [[1, 'Una'], [2, 'Dos']], c.hojas) : chips('uso', 'Uso', [['refrigeracion', 'Refrigeración'], ['congelacion', 'Congelación']], c.uso)}
        ${fam === 'abatible' ? chips('mano', 'Bisagras a la', [['izquierda', 'Izquierda'], ['derecha', 'Derecha']], c.mano) : ''}
        ${fam === 'corrediza' ? chips('mano', 'Abre corriendo hacia la', [['izquierda', 'Izquierda'], ['derecha', 'Derecha']], c.mano) : ''}`;
    return `<li class="q-door" data-id="${x.id}" data-fam="${fam}">
        <div class="q-door__plan">${doorArt(fam, c)}</div>
        <div class="q-door__b">
          <div class="q-door__t"><b>${x.nombre}</b><span class="t-small t-soft">${fam === 'cds' ? 'Por juego, en medidas estándar' : 'Se fabrica a la medida de tu vano'}</span></div>
          ${body}
          <button type="button" class="btn btn--line btn--sm q-door__3d" data-3d>Mírala en 3D, a esta medida</button>
          <div class="q-door__foot">
            <div class="q-f"><span class="q-f__l">${fam === 'cds' ? 'Juegos' : 'Puertas iguales'}</span>${qty(x, fam === 'cds' ? 'Juegos' : 'Cantidad')}</div>
            <div class="row"><button type="button" class="q-item__x" data-dup>Agregar otra con otra medida</button><button type="button" class="q-item__x" data-del>Quitar</button></div>
          </div>
        </div>
      </li>`;
  }
  const pieceRow = (x) => `<li class="q-item" data-id="${x.id}">
        ${thumb(x)}
        <div class="q-item__t"><b>${x.nombre}</b><span class="t-small t-soft">${x.tipo}</span></div>
        ${qty(x, 'Cantidad')}
        <button type="button" class="q-item__x" data-del aria-label="Quitar ${x.nombre}">Quitar</button>
      </li>`;

  function renderList() {
    const items = solicitud.all();
    $('#qEmpty').hidden = !!items.length; $('#qClearAll').hidden = !items.length;
    plan(items);
    list.innerHTML = items.map((x) => (famOf(x.id) ? doorCard(x) : pieceRow(x))).join('');
    $$('.q-item, .q-door', list).forEach((li) => {
      const id = li.dataset.id, inp = $('.q-door__foot input, .q-item > .q-qty input', li), fam = li.dataset.fam;
      const set = (n) => { n = Math.max(1, Math.min(MAX, Math.round(+n) || 1)); inp.value = n; own(() => solicitud.update(id, { cantidad: n })); paintText(); plan(solicitud.all()); };
      $$('[data-d]', li).forEach((b) => { b.onclick = () => set(+inp.value + +b.dataset.d); });
      inp.onchange = () => set(inp.value);
      $('[data-del]', li).onclick = () => {
        const next = li.nextElementSibling || li.previousElementSibling;
        own(() => solicitud.remove(id)); renderList(); toast('Se quitó de tu solicitud');
        (next && $(`[data-id="${next.dataset.id}"] [data-del]`, list) || $('#qAdd button') || form.nombre).focus();
      };
      if (!fam) return;
      // ---- ficha a la medida ----
      const cur = () => { const it = solicitud.all().find((y) => y.id === id) || { id }; return { ...defaults(fam, it), acabado: finOf(fam, it), ...(it.cfg || {}) }; };
      const save = (patch, redraw = true) => {
        const c = { ...cur(), ...patch }; own(() => solicitud.update(id, { cfg: c }));
        if (redraw) $('.q-door__plan', li).innerHTML = doorArt(fam, c);
        const area = $('[data-area]', li);
        if (area) area.textContent = c.ancho && c.alto && !c.sinMedida ? `${(c.ancho * c.alto / 10000).toFixed(2)} m² de vano` : 'En centímetros, o en metros: 1.20 × 2.10';
        paintText();
      };
      $$('.chip[data-k]', li).forEach((b) => { b.onclick = () => {
        $$(`.chip[data-k="${b.dataset.k}"]`, li).forEach((o) => o.setAttribute('aria-pressed', o === b));
        const v = b.dataset.v; save({ [b.dataset.k]: /^\d+$/.test(v) ? +v : v });
      }; });
      $$('input[data-k=ancho], input[data-k=alto]', li).forEach((f) => {
        // mientras escribes, el plano solo cambia con una medida que ya tiene sentido (30 cm o más)
        f.oninput = () => { const v = toCm(f.value); if (v >= 30) $('.q-door__plan', li).innerHTML = doorArt(fam, { ...cur(), [f.dataset.k]: v }); };
        f.onchange = () => { const v = toCm(f.value); f.value = v; save({ [f.dataset.k]: v }); };
      });
      const no = $('input[data-k=sinMedida]', li);
      if (no) no.onchange = () => { $$('input[data-k=ancho], input[data-k=alto]', li).forEach((f) => { f.disabled = no.checked; }); save({ sinMedida: no.checked }); };
      $$('[data-n]', li).forEach((b) => { b.onclick = () => {
        const n = Math.max(1, Math.min(12, cur().puertas + +b.dataset.n)); $('[data-out=puertas]', li).textContent = n; save({ puertas: n });
      }; });
      $('[data-3d]', li).onclick = () => import('./ar.js').then(({ openAR }) => { const c = cur(); openAR(fam, fam === 'cds' ? {} : { ancho: c.sinMedida ? '' : c.ancho, alto: c.sinMedida ? '' : c.alto, acabado: c.acabado || finOf(fam, solicitud.all().find((y) => y.id === id) || { id }) }); })
        .catch((e) => { console.error(e); toast('No se pudo abrir el 3D'); });
      const dup = $('[data-dup]', li);
      if (dup) dup.onclick = () => {
        const src = solicitud.all().find((y) => y.id === id);
        const nid = `puerta-${fam}-m${Date.now().toString(36)}`;
        own(() => solicitud.add({ id: nid, nombre: src.nombre, tipo: 'Puerta', cantidad: 1, cfg: { ...cur(), ...(fam === 'cds' ? {} : { ancho: '', alto: '', sinMedida: false }) } }));
        renderList(); toast('Se agregó otra puerta'); $(`[data-id="${nid}"] input[data-k=ancho], [data-id="${nid}"] .chip`, list)?.focus();
      };
    });
    paintText();
  }
  // agregar una puerta a la medida desde aquí mismo
  $$('#qAdd [data-add]').forEach((b) => { b.onclick = () => {
    const fam = b.dataset.add, nid = `puerta-${fam}-m${Date.now().toString(36)}`;
    // con la medida que ya escribiste en el sitio (si la hay)
    const v = vano.get(), pre = fam === 'cds' ? (v.cds || {}) : { ancho: v.ancho || '', alto: v.alto || '' };
    own(() => solicitud.add({ id: nid, nombre: FAM_NAME[fam], tipo: 'Puerta', cantidad: 1, cfg: { ...defaults(fam), ...pre } }));
    renderList(); toast('Se agregó a tu solicitud');
    const el = $(`[data-id="${nid}"]`, list); el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    ($('input[data-k=ancho]', el) || $('.chip', el)).focus({ preventScroll: true });
  }; });
  $('#qClearAll').onclick = () => { own(() => solicitud.clear()); renderList(); toast('Tu solicitud quedó vacía'); form.nombre.focus(); };
  // cambios desde otra pestaña u otra página; los de esta misma lista ya están dibujados (redibujar aquí quitaba el
  // foco del campo al pasar de «ancho» a «alto»)
  document.addEventListener('st:solicitud', () => { if (!mine && !list.contains(document.activeElement)) renderList(); });

  // ---------- texto de la solicitud ----------
  const val = (n) => form[n].value.trim();
  function text() {
    const items = solicitud.all();
    const lines = ['Solicitud de cotización — ST Doors', ''];
    lines.push(`Nombre: ${val('nombre') || '—'}`);
    for (const [k, l] of [['empresa', 'Empresa'], ['ciudad', 'Ciudad'], ['telefono', 'Teléfono'], ['correo', 'Correo']]) if (val(k)) lines.push(`${l}: ${val(k)}`);
    lines.push('', items.length ? 'Productos:' : 'Productos: ninguno agregado (consulta general)');
    items.forEach((x) => {
      const fam = famOf(x.id), d = fam ? describe(fam, { ...defaults(fam, x), ...(x.cfg || {}) }) : '';
      const suf = fam || /\(pieza/i.test(x.nombre) ? '' : ` (${x.tipo.toLowerCase()})`;
      lines.push(`- ${x.cantidad || 1} × ${x.nombre}${suf}${d ? ' — ' + d : ''}`);
    });
    if (val('mensaje')) lines.push('', 'Detalles:', val('mensaje'));
    return lines.join('\n');
  }
  const paintText = () => { $('#qText').textContent = text(); };
  form.addEventListener('input', paintText);

  // ---------- validación ----------
  const err = (name, msg) => {
    const el = $('#e-' + name), f = form[name];
    el.hidden = !msg; el.textContent = msg || ''; f.setAttribute('aria-invalid', !!msg);
    return !msg;
  };
  function check() {
    const okN = err('nombre', val('nombre') ? '' : 'Escribe tu nombre.');
    const tel = val('telefono'), mail = val('correo');
    const digits = tel.replace(/\D/g, '').length;
    const okT = err('telefono', tel && digits < 10 ? 'Revisa el teléfono: debe tener al menos 10 dígitos.' : (!tel && !mail ? 'Escribe al menos uno de los dos.' : ''));
    const okM = err('correo', mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? 'Revisa el correo: falta algo como nombre@empresa.com.' : '');
    return okN && okT && okM;
  }
  ['nombre', 'telefono', 'correo'].forEach((n) => form[n].addEventListener('blur', () => { if (form.dataset.tried) check(); }));

  // ---------- envío ----------
  // salida a otra app: en un objeto para que las pruebas la puedan observar sin salir de la página
  const api = { text, check, go: (u) => { location.href = u; }, open: (u) => window.open(u, '_blank', 'noopener') };
  let via = 'correo';
  $$('[type=submit]', form).forEach((b) => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.onsubmit = async (e) => {
    e.preventDefault(); form.dataset.tried = '1';
    if (!check()) { const bad = $('[aria-invalid=true]', form); bad && bad.focus(); $('#qStatus').textContent = 'Revisa los campos marcados.'; return; }
    const t = text() + adRef(), status = $('#qStatus');
    track(via === 'copiar' ? 'cotizacion_copiada' : 'cotizacion_enviada', { via, partidas: solicitud.all().length });
    if (via === 'copiar') {
      try { await navigator.clipboard.writeText(t); status.textContent = `Texto copiado. Pégalo en un correo a ${contacto.correo} o en el mensaje que prefieras.`; }
      catch { $('.q-preview').open = true; const r = document.createRange(); r.selectNodeContents($('#qText')); getSelection().removeAllRanges(); getSelection().addRange(r); status.textContent = 'No se pudo copiar solo: el texto quedó seleccionado abajo para que lo copies.'; }
      return;
    }
    if (via === 'whatsapp') {
      api.open(`https://wa.me/${contacto.whatsapp || ''}?text=${encodeURIComponent(t)}`);
      status.textContent = 'Se abrió WhatsApp con tu solicitud. Envíala desde ahí; tu lista se queda aquí por si la necesitas.';
      return;
    }
    api.go(`mailto:${contacto.correo}?subject=${encodeURIComponent('Solicitud de cotización' + (val('empresa') ? ' — ' + val('empresa') : ''))}&body=${encodeURIComponent(t)}`);
    status.textContent = 'Se abrió tu programa de correo con la solicitud. Envíala desde ahí; tu lista se queda aquí por si la necesitas.';
  };

  renderList();
  window.__quote = api;
}

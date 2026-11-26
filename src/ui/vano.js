// Fase 10J · «A la medida de tu vano»: el mismo bloque en el Inicio, en cada puerta y en Industriales. Escribes cuánto
// mide tu vano (en cm o en metros), ves la puerta a escala junto a una persona de 1.70 m, y desde ahí la agregas a tu
// solicitud con esa medida, la ves en tu espacio con la cámara o mandas la medida por WhatsApp. La medida se recuerda
// en todo el sitio (y en Cotizar ya aparece escrita).
import { plano, defaults, toCm, describe, FAM_NAME, CDS_W, CDS_H, CDS_MOD } from './medida.js';
import { doorArt, ACABADOS_DE, ACABADO_NOMBRE } from './preview.js';
import { solicitud, toast, url, createSheet } from './site.js';
import { waButton, waUpdate } from './whatsapp.js';

const KEY = 'st.vano.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const vano = {
  get: () => read(),
  set(p, from = null) { const v = { ...read(), ...p }; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sin almacenamiento */ } dispatchEvent(new CustomEvent('st:vano', { detail: { ...v, __from: from } })); return v; },
};
const NOMBRE = { abatible: 'Abatible', corrediza: 'Corrediza', vaiven: 'Vaivén', cds: 'Juego CDS' };

// ---------- ¿cómo mido mi vano? ----------
let howSheet = null;
export function openHowTo() {
  if (!howSheet) {
    howSheet = createSheet('Cómo medir tu vano'); howSheet.meta.textContent = 'Cómo medir tu vano';
    const s = (body) => `<svg viewBox="0 0 160 120" aria-hidden="true">${body}</svg>`;
    const wall = '<path class="hw-wall" d="M10 10H150V112H10Z M40 24H120V112H40Z" fill-rule="evenodd"/><line class="hw-floor" x1="4" y1="112" x2="156" y2="112"/>';
    const arrowH = (y) => `<line class="hw-m" x1="42" y1="${y}" x2="118" y2="${y}"/><path class="hw-m" d="M48 ${y - 4}L42 ${y}L48 ${y + 4}M112 ${y - 4}L118 ${y}L112 ${y + 4}"/>`;
    const arrowV = (x) => `<line class="hw-m" x1="${x}" y1="26" x2="${x}" y2="110"/><path class="hw-m" d="M${x - 4} 32L${x} 26L${x + 4} 32M${x - 4} 104L${x} 110L${x + 4} 104"/>`;
    howSheet.body.innerHTML = `<ol class="howto">
      <li>${s(wall + arrowH(34) + arrowH(68) + arrowH(102))}<div><b>Ancho</b><p>Mide de un lado al otro del vano en tres alturas: abajo, en medio y arriba. Anota la medida más chica.</p></div></li>
      <li>${s(wall + arrowV(48) + arrowV(112))}<div><b>Alto</b><p>Mide del piso terminado hasta arriba del vano, en los dos lados. Anota la más chica.</p></div></li>
      <li>${s(wall + '<path class="hw-x" d="M126 70h20v42h-20z"/><circle class="hw-x" cx="24" cy="40" r="7"/><line class="hw-m" x1="40" y1="116" x2="120" y2="116" stroke-dasharray="3 3"/>')}<div><b>Lo de alrededor</b><p>Revisa que el piso esté a nivel y anota lo que estorbe junto al vano: tubos, columnas, apagadores. Para la corrediza, cuánto muro libre hay a un lado.</p></div></li>
    </ol>
    <p class="t-small t-soft">Si no puedes medir, en Cotizar marca «aún no la tengo» y la toman en la visita.</p>`;
  }
  howSheet.open();
}

// ---------- el bloque ----------
// host: contenedor; opts.fam: puerta fija (página de puerta) o null para elegir; opts.addItem(cfg) → item a agregar
export function mountVano(host, { fam: fixed = null, fams = ['abatible', 'corrediza', 'vaiven'], addItem = null, heading = '' } = {}) {
  const saved = vano.get();
  let fam = fixed || (fams.includes(saved.fam) ? saved.fam : fams[0]);
  const cfgOf = () => {
    const v = vano.get();
    if (fam === 'cds') return { ...defaults('cds'), ...(v.cds || {}) };
    const fins = ACABADOS_DE[fam] || [];
    return { ...defaults(fam), ancho: v.ancho || '', alto: v.alto || '', ...(fam === 'vaiven' ? { hojas: v.hojas || 2 } : {}), ...(fins.length ? { acabado: fins.includes(v.acabado) ? v.acabado : fins[0] } : {}) };
  };
  const uid = Math.random().toString(36).slice(2, 7);
  host.classList.add('vano');
  host.innerHTML = `
    ${heading}
    <div class="vano__in">
      <div class="vano__plan" data-plan></div>
      <div class="vano__form">
        ${fixed ? '' : `<div class="q-f"><span class="q-f__l" id="vf-${uid}">Puerta</span><div class="chips" role="group" aria-labelledby="vf-${uid}">${fams.map((f) => `<button type="button" class="chip" data-fam="${f}" aria-pressed="${f === fam}">${NOMBRE[f]}</button>`).join('')}</div></div>`}
        <div data-fields></div>
        <p class="vano__sum" data-sum aria-live="polite"></p>
        <div class="vano__act">
          <button type="button" class="btn" data-add>Agregar a mi solicitud</button>
          <button type="button" class="btn btn--line" data-ar><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V4h3M14 4h3v3M17 13v3h-3M6 16H3v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 6l4 2.2v4.6L10 15l-4-2.2V8.2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>Verla en tu espacio</button>
          <span data-wa></span>
        </div>
      </div>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const fields = $('[data-fields]'), planEl = $('[data-plan]'), sum = $('[data-sum]');

  const draw = (c = cfgOf()) => {
    // Fase 11B: la puerta dibujada con su acabado, a escala, cambia mientras escribes (antes: el plano de líneas)
    planEl.innerHTML = doorArt(fam, c);
    const known = fam === 'cds' || (c.ancho && c.alto);
    sum.textContent = fam === 'cds' ? `Juego de ${c.puertas} ${c.puertas === 1 ? 'puerta' : 'puertas'} de ${c.ancho}" × ${c.alto}"`
      : known ? `Vano de ${c.ancho} × ${c.alto} cm · ${(c.ancho * c.alto / 10000).toFixed(2)} m²` : 'Escribe la medida para verla a escala.';
    host.classList.toggle('is-known', !!known);
    waUpdate($('[data-wa]'), { tipo: 'medida', fam, cfg: c });
  };
  const renderFields = () => {
    const c = cfgOf();
    const fins = ACABADOS_DE[fam] || [];
    const finRow = fins.length ? `<div class="q-f"><span class="q-f__l" id="va-${uid}">Acabado</span><div class="chips q-fin" role="group" aria-labelledby="va-${uid}">${fins.map((f) => `<button type="button" class="chip chip--sm" data-acabado="${f}" aria-pressed="${c.acabado === f}"><i aria-hidden="true"></i>${ACABADO_NOMBRE[f]}</button>`).join('')}</div></div>` : '';
    fields.innerHTML = finRow + (fam === 'cds' ? `
      <div class="q-f"><span class="q-f__l" id="vn-${uid}">Puertas en el juego</span>
        <div class="q-qty" role="group" aria-labelledby="vn-${uid}"><button type="button" data-n="-1" aria-label="Una puerta menos">−</button><output data-out>${c.puertas}</output><button type="button" data-n="1" aria-label="Una puerta más">+</button></div></div>
      <div class="q-f"><span class="q-f__l" id="vw-${uid}">Ancho de cada puerta</span><div class="chips" role="group" aria-labelledby="vw-${uid}">${CDS_W.map((w) => `<button type="button" class="chip" data-k="ancho" data-v="${w}" aria-pressed="${c.ancho === w}">${w}"</button>`).join('')}</div></div>
      <div class="q-f"><span class="q-f__l" id="vh-${uid}">Alto</span><div class="chips" role="group" aria-labelledby="vh-${uid}">${CDS_H.map((h) => `<button type="button" class="chip" data-k="alto" data-v="${h}" aria-pressed="${c.alto === h}">${h}"</button>`).join('')}</div></div>` : `
      <fieldset class="q-f q-dim">
        <legend class="q-f__l">¿Cuánto mide tu vano?</legend>
        <div class="q-dim__in">
          <label><span class="sr-only">Ancho del vano, en centímetros</span><input data-k="ancho" inputmode="decimal" autocomplete="off" placeholder="Ancho" value="${c.ancho}"></label>
          <span aria-hidden="true">×</span>
          <label><span class="sr-only">Alto del vano, en centímetros</span><input data-k="alto" inputmode="decimal" autocomplete="off" placeholder="Alto" value="${c.alto}"></label>
          <span class="q-dim__u">cm</span>
        </div>
        <button type="button" class="vano__how" data-how>¿Cómo mido mi vano?</button>
      </fieldset>`);
    fields.querySelectorAll('[data-acabado]').forEach((b) => { b.onclick = () => {
      fields.querySelectorAll('[data-acabado]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      vano.set({ acabado: b.dataset.acabado }, uid); draw();
    }; });
    fields.querySelectorAll('input[data-k]').forEach((f) => {
      f.oninput = () => { const v = toCm(f.value); if (v >= 30) draw({ ...cfgOf(), [f.dataset.k]: v }); };
      f.onchange = () => { const v = toCm(f.value); f.value = v; vano.set({ [f.dataset.k]: v }, uid); draw(); };
    });
    fields.querySelectorAll('.chip[data-k]').forEach((b) => { b.onclick = () => {
      fields.querySelectorAll(`.chip[data-k="${b.dataset.k}"]`).forEach((o) => o.setAttribute('aria-pressed', o === b));
      vano.set({ cds: { ...cfgOf(), [b.dataset.k]: +b.dataset.v } }, uid); draw();
    }; });
    fields.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => {
      const n = Math.max(1, Math.min(12, cfgOf().puertas + +b.dataset.n)); fields.querySelector('[data-out]').textContent = n; vano.set({ cds: { ...cfgOf(), puertas: n } }, uid); draw();
    }; });
    const how = fields.querySelector('[data-how]'); if (how) how.onclick = openHowTo;
    draw(c);
  };
  host.querySelectorAll('.chip[data-fam]').forEach((b) => { b.onclick = () => {
    fam = b.dataset.fam; vano.set({ fam }, uid); $('[data-ar]').dataset.warm = fam; host.querySelectorAll('.chip[data-fam]').forEach((o) => o.setAttribute('aria-pressed', o === b)); renderFields();
  }; });
  $('[data-wa]').replaceWith(waButton({ tipo: 'medida', fam, cfg: cfgOf() }, { cls: 'btn btn--line', attr: 'data-wa' }));

  // agregar: con la medida escrita (o «por confirmar» si aún no la hay)
  $('[data-add]').onclick = () => {
    const c = cfgOf();
    const item = addItem ? addItem(c) : { id: `puerta-${fam}-m${Date.now().toString(36)}`, nombre: FAM_NAME[fam], tipo: 'Puerta' };
    const cfg = { ...c, ...(item.cfg || {}) };
    const prev = solicitud.all().find((x) => x.id === item.id);
    if (prev) solicitud.update(item.id, { cfg: { ...(prev.cfg || {}), ...cfg } });
    else solicitud.add({ cantidad: 1, ...item, cfg });
    $('[data-add]').textContent = 'Agregada a tu solicitud';
    toast(`${FAM_NAME[fam]}: ${describe(fam, c)}. Lista en Cotizar`);
    const go = host.querySelector('.vano__go'); if (!go) $('.vano__act').insertAdjacentHTML('beforeend', `<a class="btn btn--line vano__go" href="${url('cotizar/')}">Ver mi solicitud</a>`);
  };
  // ver en tu espacio con la cámara (realidad aumentada), a la medida escrita
  $('[data-ar]').dataset.warm = fam;
  $('[data-ar]').onclick = () => import('./ar.js').then(({ openAR }) => openAR(fam, cfgOf())).catch((e) => { console.error(e); toast('No se pudo abrir la vista con cámara'); });
  // la medida es una sola para todo el sitio: si otro lugar la cambia, se actualiza aquí sin rehacer los campos
  // (rehacerlos mientras escribes cambiaría el campo que estás tocando y cerraría el teclado del celular)
  addEventListener('st:vano', (e) => {
    if (e.detail && e.detail.__from === uid) return;
    const v = vano.get();
    if (fam !== 'cds') {
      fields.querySelectorAll('input[data-k]').forEach((i) => { const want = String(v[i.dataset.k] || ''); if (i !== document.activeElement && i.value !== want) i.value = want; });
      draw();
    } else if (!host.contains(document.activeElement)) renderFields(); else draw();
  });
  renderFields();
  return { get fam() { return fam; }, cfg: cfgOf };
}

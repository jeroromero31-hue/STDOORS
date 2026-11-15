// Cotizar: la solicitud se edita aquí y se envía por un canal real (correo o WhatsApp) que abre el propio usuario.
// No hay servidor configurado, así que la página no finge un envío: abre el programa con el texto listo o lo copia.
import { solicitud, contacto, toast } from './site.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAX = 99;

export function mountQuote() {
  const list = $('#qItems'), form = $('#qForm');
  const wa = $('[data-via=whatsapp]', form);
  wa.hidden = !contacto.whatsapp;
  $('#qHow').textContent = contacto.whatsapp
    ? 'Elige cómo enviarla. Se abre tu correo o WhatsApp con todo escrito; la envías tú desde ahí.'
    : `Se abre tu programa de correo con todo escrito, dirigido a ${contacto.correo}; la envías tú desde ahí. También puedes copiar el texto.`;

  // ---------- productos ----------
  function renderList() {
    const items = solicitud.all();
    $('#qEmpty').hidden = !!items.length; $('#qClearAll').hidden = !items.length;
    list.innerHTML = items.map((x) => `<li class="q-item" data-id="${x.id}">
        <div class="q-item__t"><b>${x.nombre}</b><span class="t-small t-soft">${x.tipo}</span></div>
        <div class="q-qty" role="group" aria-label="Cantidad de ${x.nombre}">
          <button type="button" data-d="-1" aria-label="Uno menos">−</button>
          <input type="number" inputmode="numeric" min="1" max="${MAX}" value="${x.cantidad || 1}" aria-label="Cantidad">
          <button type="button" data-d="1" aria-label="Uno más">+</button>
        </div>
        <button type="button" class="q-item__x" aria-label="Quitar ${x.nombre}">Quitar</button>
      </li>`).join('');
    $$('.q-item', list).forEach((li) => {
      const id = li.dataset.id, inp = $('input', li);
      const set = (n) => { n = Math.max(1, Math.min(MAX, Math.round(+n) || 1)); inp.value = n; solicitud.update(id, { cantidad: n }); paintText(); };
      $$('[data-d]', li).forEach((b) => { b.onclick = () => set(+inp.value + +b.dataset.d); });
      inp.onchange = () => set(inp.value);
      $('.q-item__x', li).onclick = () => {
        const next = li.nextElementSibling || li.previousElementSibling;
        solicitud.remove(id); renderList(); toast('Se quitó de tu solicitud');
        (next && $(`.q-item[data-id="${next.dataset.id}"] .q-item__x`, list) || $('#qEmpty a') || form.nombre).focus();
      };
    });
    paintText();
  }
  $('#qClearAll').onclick = () => { solicitud.clear(); renderList(); toast('Tu solicitud quedó vacía'); form.nombre.focus(); };
  document.addEventListener('st:solicitud', () => { if (!list.contains(document.activeElement)) renderList(); });   // cambios desde otra pestaña

  // ---------- texto de la solicitud ----------
  const val = (n) => form[n].value.trim();
  function text() {
    const items = solicitud.all();
    const lines = ['Solicitud de cotización — ST Doors', ''];
    lines.push(`Nombre: ${val('nombre') || '—'}`);
    for (const [k, l] of [['empresa', 'Empresa'], ['ciudad', 'Ciudad'], ['telefono', 'Teléfono'], ['correo', 'Correo']]) if (val(k)) lines.push(`${l}: ${val(k)}`);
    lines.push('', items.length ? 'Productos:' : 'Productos: ninguno agregado (consulta general)');
    items.forEach((x) => lines.push(`- ${x.cantidad || 1} × ${x.nombre} (${x.tipo})`));
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
    const t = text(), status = $('#qStatus');
    if (via === 'copiar') {
      try { await navigator.clipboard.writeText(t); status.textContent = `Texto copiado. Pégalo en un correo a ${contacto.correo} o en el mensaje que prefieras.`; }
      catch { $('.q-preview').open = true; const r = document.createRange(); r.selectNodeContents($('#qText')); getSelection().removeAllRanges(); getSelection().addRange(r); status.textContent = 'No se pudo copiar solo: el texto quedó seleccionado abajo para que lo copies.'; }
      return;
    }
    if (via === 'whatsapp' && contacto.whatsapp) {
      api.open(`https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(t)}`);
      status.textContent = 'Se abrió WhatsApp con tu solicitud. Envíala desde ahí; tu lista se queda aquí por si la necesitas.';
      return;
    }
    api.go(`mailto:${contacto.correo}?subject=${encodeURIComponent('Solicitud de cotización' + (val('empresa') ? ' — ' + val('empresa') : ''))}&body=${encodeURIComponent(t)}`);
    status.textContent = 'Se abrió tu programa de correo con la solicitud. Envíala desde ahí; tu lista se queda aquí por si la necesitas.';
  };

  renderList();
  window.__quote = api;
}

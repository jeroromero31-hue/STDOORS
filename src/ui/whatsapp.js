// Fase 10J · WhatsApp con el mensaje ya escrito: la medida del vano, la pieza con su número o la solicitud completa.
// Con el número de ST en src/data/contacto.json («whatsapp») abre directo su chat; mientras no esté confirmado, abre
// WhatsApp con el mensaje listo y la persona elige a quién mandarlo.
import contacto from '../data/contacto.json';
import { describe, FAM_NAME } from './medida.js';
import { url } from './site.js';

export const WA_NUMBER = contacto.whatsapp || null;
export const waLabel = () => (WA_NUMBER ? 'Escribir por WhatsApp' : 'Mandar por WhatsApp');
export const waHref = (text) => `https://wa.me/${WA_NUMBER || ''}?text=${encodeURIComponent(text)}`;
const here = () => `${location.origin}${location.pathname}`;

// ctx.tipo: 'medida' { fam, cfg } · 'pieza' { pieza, cantidad, puerta } · 'texto' { texto }
export function waText(ctx) {
  if (ctx.tipo === 'texto') return ctx.texto;
  if (ctx.tipo === 'pieza') {
    const p = ctx.pieza;
    return [`Hola, necesito esta pieza de repuesto:`, `${p.numero ? 'Pieza ' + p.numero + ' · ' : ''}${p.nombre}${ctx.puerta ? ` (puerta ${ctx.puerta})` : ''}`,
      `Cantidad: ${ctx.cantidad || 1}`, `Ficha: ${location.origin}${url('componentes/')}?id=${p.id}`].join('\n');
  }
  if (ctx.tipo === 'medida') {
    const d = describe(ctx.fam, ctx.cfg);
    return [`Hola, quiero cotizar ${ctx.fam === 'cds' ? 'un juego de puertas CDS Legacy' : 'una ' + FAM_NAME[ctx.fam].toLowerCase() + ' a la medida'}:`, d.charAt(0).toUpperCase() + d.slice(1) + '.', `Vista en: ${here()}`].join('\n');
  }
  if (ctx.tipo === 'foto') return [`Hola, se me descompuso esta pieza${ctx.puerta ? ` de una puerta ${ctx.puerta}` : ''}${ctx.zona ? ` (${ctx.zona})` : ''} y no sé cuál es. Les mando la foto.`].join('\n');
  return `Hola, quiero información de sus puertas. ${here()}`;
}

const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" class="wa-ic"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3Z"/></svg>';
export function waButton(ctx, { cls = 'btn btn--line', attr = '', label = '' } = {}) {
  const a = document.createElement('a');
  a.className = `${cls} wa-btn`; a.target = '_blank'; a.rel = 'noopener';
  if (attr) a.setAttribute(attr, '');
  a.innerHTML = `${ICON}<span>${label || waLabel()}</span>`;
  a.href = waHref(waText(ctx));
  return a;
}
export function waUpdate(el, ctx) { if (el && el.tagName === 'A') el.href = waHref(waText(ctx)); }

// foto de la pieza descompuesta: el teléfono la comparte (WhatsApp aparece en la lista); sin esa opción, abre WhatsApp
// con el mensaje y la foto se adjunta ahí
export async function sharePhoto(file, ctx) {
  const text = waText({ tipo: 'foto', ...ctx });
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return 'compartida'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelada'; }
  }
  window.open(waHref(text + '\n(Adjunto la foto en este chat.)'), '_blank', 'noopener');
  return 'whatsapp';
}

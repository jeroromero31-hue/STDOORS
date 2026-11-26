// Fase 13 · medición para Google Ads y Google Analytics 4 (por Google Tag Manager) y el contexto del anuncio.
//
// - Cada botón importante manda un evento con nombre fijo a `dataLayer` (Tag Manager lo toma de ahí):
//   principales (cuentan como cliente en Google Ads): whatsapp_click, llamada_click, cotizacion_enviada
//   secundarios (solo se miran): agregar_solicitud, ar_abrir, ficha_pieza, correo_click
// - Si la visita viene de un anuncio (utm_* o gclid), se recuerda 30 días: el aviso de bienvenida del grupo, y el
//   mensaje de WhatsApp o el correo de cotización dicen de qué anuncio vino («Vengo de: anuncio de Google · …»).
// - Tag Manager solo se carga cuando su clave está en src/data/marketing.json («gtm»). Sin clave no se carga nada de
//   Google y los eventos se quedan en la página (se ven con ?debug=1).
import marketing from '../data/marketing.json';

const KEY = 'st.ad.v1', DAYS = 30;
// nombre del grupo de anuncios (utm_content o utm_campaign) → lo que la página entiende
const GRUPOS = {
  camara: { nombre: 'puertas para cámara fría', match: /camara|cámara|frigor|industrial|abatible|corrediza/i },
  refacciones: { nombre: 'refacciones', match: /refacc|pieza|componente|bisagra|chapa|empaque/i },
  cds: { nombre: 'puertas de exhibición CDS', match: /cds|exhib|reach/i },
  vaiven: { nombre: 'puertas vaivén', match: /vaiven|vaivén|cocina/i },
};

export function captureAd() {
  try {
    const q = new URLSearchParams(location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
    if (!keys.some((k) => q.get(k))) return adContext();
    const a = Object.fromEntries(keys.filter((k) => q.get(k)).map((k) => [k.replace('utm_', ''), q.get(k).slice(0, 120)]));
    const txt = `${a.content || ''} ${a.campaign || ''}`;
    a.grupo = Object.keys(GRUPOS).find((g) => GRUPOS[g].match.test(txt)) || null;
    a.t = Date.now(); a.landing = location.pathname;
    localStorage.setItem(KEY, JSON.stringify(a));
    return a;
  } catch { return null; }
}
export function adContext() {
  try { const a = JSON.parse(localStorage.getItem(KEY)); return a && Date.now() - a.t < DAYS * 864e5 ? a : null; } catch { return null; }
}
// de un anuncio de Google: con gclid (etiquetado automático) o con utm_source=google
export const fromAd = () => { const a = adContext(); return !!(a && (a.gclid || a.gbraid || a.wbraid || /google/i.test(a.source || ''))); };
export const adGroup = () => { const a = adContext(); return a && a.grupo; };
export const adGroupName = (g = adGroup()) => (g && GRUPOS[g] ? GRUPOS[g].nombre : '');
// línea para el final de un mensaje (WhatsApp, correo): así ST sabe qué anuncio trajo el contacto
export function adRef() {
  const a = adContext(); if (!a || !fromAd()) return '';
  return `\nVengo de: anuncio de Google${a.grupo ? ' · ' + adGroupName(a.grupo) : ''}${a.gclid ? ` (ref. ${a.gclid.slice(-8)})` : ''}`;
}

export function track(event, params = {}) {
  const a = adContext();
  const data = { event, ...params, ...(a && a.grupo ? { ad_grupo: a.grupo } : {}) };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  if (window.__stLog) window.__stLog(`evento ${event} ${JSON.stringify(params)}`);
}

// Google Tag Manager (solo con clave)
export function loadTags() {
  const id = marketing.gtm;
  if (!id || !/^GTM-[A-Z0-9]+$/.test(id) || document.getElementById('st-gtm')) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script'); s.id = 'st-gtm'; s.async = true; s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.append(s);
}

// clics en teléfono, WhatsApp y correo en cualquier parte del sitio: un solo escucha para todos los enlaces
export function watchClicks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href') || '', where = a.dataset.where || a.closest('[data-where]')?.dataset.where || location.pathname;
    if (h.startsWith('tel:')) track('llamada_click', { ubicacion: where });
    else if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(h) && !a.hasAttribute('data-no-track')) track('whatsapp_click', { ubicacion: where });
    else if (h.startsWith('mailto:') && !a.hasAttribute('data-no-track')) track('correo_click', { ubicacion: where });
  }, { capture: true });
}

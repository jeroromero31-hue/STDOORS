// Capa común de todas las páginas: estilos, fuente, navegación, pie, solicitud, avisos y hojas.
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';

import contacto from '../data/contacto.json';
import { revealSpecs, revealCascade, bumpCount } from './motion.js';
import { smoothScroll, cursor, revealOnView } from './cine.js';
import { captureAd, loadTags, watchClicks, track, fromAd, adGroup } from './track.js';

const BASE = import.meta.env.BASE_URL;
export { contacto };
export const url = (p) => BASE + p.replace(/^\//, '');

const NAV = [
  { href: 'industriales/', label: 'Industriales', key: 'industriales' },
  { href: 'cds/', label: 'CDS', key: 'cds' },
  { href: 'componentes/', label: 'Componentes', key: 'componentes' },
];
// Fase 10I · las cuatro puertas, para el menú, el cambio rápido de puerta y «otras puertas»
export const DOORS = [
  { id: 'abatible', href: 'industriales/abatible/', nombre: 'Abatible', desc: 'Gira sobre sus bisagras' },
  { id: 'corrediza', href: 'industriales/corrediza/', nombre: 'Corrediza', desc: 'Corre colgada del riel' },
  { id: 'vaiven', href: 'industriales/vaiven/', nombre: 'Vaivén', desc: 'Semi aislante, abre a los dos lados' },
  { id: 'cds', href: 'cds/', nombre: 'CDS Legacy', desc: 'Exhibición Reach-In, por juego' },
];
// tarjetas de puerta: foto, nombre y una línea; la actual queda marcada
export function doorCards(current = '', { cls = 'dcards', only = null } = {}) {
  return `<ul class="${cls}">${DOORS.filter((d) => !only || only.includes(d.id)).map((d, i) => `<li style="--i:${i}"><a class="dcard${d.id === current ? ' is-here' : ''}" href="${url(d.href)}"${d.id === current ? ' aria-current="page"' : ''}>
      <span class="dcard__img"><img src="${url(`img/puertas/${d.id}-480.webp`)}" alt="" width="480" height="360" loading="lazy" decoding="async"></span>
      <span class="dcard__t"><b>${d.id === 'cds' ? d.nombre : 'Puerta ' + d.nombre.toLowerCase()}</b> <span>${d.id === current ? 'Estás aquí' : d.desc}</span></span></a></li>`).join('')}</ul>`;
}

// ---------- Mi solicitud: puertas y piezas para cotizar ----------
const KEY = 'st.solicitud.v1';
let memory = [];
export const solicitud = {
  all() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return memory; } },
  save(list) { memory = list; try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* modo privado */ } emit(); },
  has(id) { return this.all().some((x) => x.id === id); },
  add(item) { const l = this.all(); if (!l.some((x) => x.id === item.id)) { l.push(item); this.save(l); track('agregar_solicitud', { id: item.id }); } },
  remove(id) { this.save(this.all().filter((x) => x.id !== id)); },
  update(id, patch) { this.save(this.all().map((x) => (x.id === id ? { ...x, ...patch } : x))); },
  clear() { this.save([]); },
};
function emit() {
  const n = solicitud.all().length;
  document.querySelectorAll('[data-solicitud-count]').forEach((el) => { el.textContent = n || ''; });
  document.dispatchEvent(new CustomEvent('st:solicitud', { detail: n }));
  bumpCount(n);
}

// ---------- aviso breve ----------
let toastEl, toastT;
export function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2800);
}

// ---------- hoja lateral (inferior en móvil) ----------
export function createSheet(label) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('aside');
  el.className = 'sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label);
  el.innerHTML = '<div class="row" style="justify-content:space-between"><span class="t-soft t-small" data-sheet-meta></span><button class="sheet__close" aria-label="Cerrar">×</button></div><div data-sheet-body></div>';
  document.body.append(scrim, el);
  let last = null;
  const api = {
    el, body: el.querySelector('[data-sheet-body]'), meta: el.querySelector('[data-sheet-meta]'),
    open() { last = document.activeElement; el.classList.add('is-open'); scrim.classList.add('is-on'); el.querySelector('.sheet__close').focus(); document.documentElement.style.overflow = 'hidden'; },
    close() { el.classList.remove('is-open'); scrim.classList.remove('is-on'); document.documentElement.style.overflow = ''; last && last.focus && last.focus(); if (api.onclose) api.onclose(); },
  };
  el.querySelector('.sheet__close').onclick = api.close; scrim.onclick = api.close;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') api.close();
    if (e.key === 'Tab') { // atrapar el foco dentro de la hoja
      const f = [...el.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')].filter((x) => x.offsetParent);
      if (!f.length) return; const first = f[0], lastF = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
      else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    }
  });
  return api;
}

// ---------- Fase 10J · navegar más rápido en el celular ----------
// 1) Reglas de especulación: Chrome y Android traen la página siguiente en cuanto el dedo toca el enlace (o el puntero
//    se detiene sobre él); al soltar ya está. 2) Con el sitio quieto, se bajan en segundo plano los modelos 3D de las
//    puertas para que la primera visita a cada una abra rápido (no con «ahorro de datos» ni en conexiones lentas).
function fastNav() {
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules') && !document.querySelector('script[type=speculationrules]')) {
    const sr = document.createElement('script'); sr.type = 'speculationrules';
    sr.textContent = JSON.stringify({ prefetch: [{ where: { and: [{ href_matches: `${url('')}*` }, { not: { href_matches: '*.pdf' } }, { not: { selector_matches: '[download]' } }] }, eagerness: 'moderate' }] });
    document.head.append(sr);
  }
  const c = navigator.connection || {};
  if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;
  addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(() => {
    import('../core/models.js').then(({ MODEL_URLS }) => MODEL_URLS.forEach((h) => {
      if (document.querySelector(`link[href="${h}"]`)) return;
      const l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'fetch'; l.href = h; l.crossOrigin = 'anonymous'; document.head.append(l);
    })).catch(() => {});
  }, { timeout: 4000 }), 3500), { once: true });
}

// ---------- Fase 10I · plegables (Duo): al plegar o desplegar, la pantalla se cierra y se abre como una puerta vaivén ----------
// Fase 14C · solo en plegables y con las hojas de verdad: las dos hojas de la vaivén (las mismas del Inicio) llegan del
// frente, se juntan en la bisagra del teléfono, sale una bocanada de vaho y siguen de largo hacia atrás, como una vaivén.
// Además, con el teléfono abierto, las páginas de cada puerta se leen «como libro»: el texto en la mitad izquierda y la
// puerta en la derecha, con el pliegue en medio (html.is-libro; src/styles/door.css y src/ui/doorPage.js).
const isPhoneUA = () => /iPhone|Android.+Mobile/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
// Fase 14D · cómo se sabe que es un plegable abierto (cualquiera basta, siempre con pantalla táctil):
//  · la ventana es más grande que la pantalla que reporta el teléfono (el iPhone Duo abierto reporta la de afuera,
//    466 × 678, con una ventana de 951 × 537; Safari se presenta ahí como en iPad)
//  · el sitio ya vio plegarse este teléfono (la pantalla cambió de tamaño sin girar) y ahora está en la pantalla grande
//  · ?plegable=1 en la dirección lo activa en este teléfono (?plegable=0 lo quita; ?plegable=info muestra las medidas)
//  · Android o iPhone con el lado corto de 580 px o más y el largo de 1000 o menos (Galaxy Fold, Pixel Fold)
const FOLD_SCREENS = [[1148, 807]];
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
{
  const q = new URLSearchParams(location.search).get('plegable');
  if (q === '1') lsSet('st.plegable', '1'); else if (q === '0') lsSet('st.plegable', null);
}
export const foldOpen = () => {
  const a = Math.min(screen.width, screen.height), b = Math.max(screen.width, screen.height);
  const touch = navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches; if (!touch) return false;
  // el iPhone Duo abierto sigue dando las medidas de la pantalla de afuera (466 × 678) con una ventana más grande que
  // ellas (951 × 537 de lado): una ventana que no cabe en la pantalla que reporta solo pasa con el teléfono abierto
  const W = Math.max(innerWidth, innerHeight), H = Math.min(innerWidth, innerHeight);
  if (H >= 500 && (W > b * 1.3 || H > a * 1.3)) return true;
  if (FOLD_SCREENS.some(([x, y]) => Math.abs(b - x) <= 16 && Math.abs(a - y) <= 16)) return true;
  if (lsGet('st.plegable') === '1' && a >= 560) return true;
  return isPhoneUA() && a >= 580 && b <= 1000;
};
function foldFx(caption) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let fx = document.querySelector('.foldfx');
  if (!fx) {
    fx = document.createElement('div'); fx.className = 'foldfx'; fx.setAttribute('aria-hidden', 'true');
    const img = (k) => `<img src="${url(`img/umbral/vaiven-${k}-518.webp`)}" srcset="${url(`img/umbral/vaiven-${k}-518.webp`)} 518w, ${url(`img/umbral/vaiven-${k}-1035.webp`)} 1035w" sizes="50vw" alt="" decoding="async">`;
    fx.innerHTML = `<i class="foldfx__l">${img('izq')}</i><i class="foldfx__r">${img('der')}</i><b class="foldfx__vaho"></b><p class="foldfx__t"></p>`;
    document.body.append(fx);
  }
  fx.querySelector('.foldfx__t').textContent = caption || '';
  fx.classList.remove('is-on'); void fx.offsetWidth; fx.classList.add('is-on');
  clearTimeout(foldFx.t); foldFx.t = setTimeout(() => fx.classList.remove('is-on'), 1500);
}
function foldWatch() {
  // Fase 10J · solo con un plegado de verdad. Antes bastaba con que cambiara el ancho de la ventana, y en Android eso pasa
  // también cuando algo de la página se sale por un lado (Chrome agranda la ventana para mostrarlo), al hacer zoom o al
  // abrir desde otra app: aparecían los paneles azules sin plegar nada. Ahora tiene que cambiar la pantalla misma, sin
  // girar el teléfono, sin zoom y no en los primeros segundos de la página.
  const scr = () => [screen.width, screen.height];
  const ori = () => (screen.orientation && screen.orientation.type) || (matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait');
  let lastW = innerWidth, lastS = scr(), lastO = ori();
  const t0 = performance.now();
  // Fase 14D · «Los dos lados» (src/ui/pliegue.js): botón en la barra de arriba, solo con el plegable abierto. El módulo
  // se baja antes del toque: así el permiso del giroscopio del iPhone se pide dentro del mismo toque.
  let plg = null, plgMod = null;
  const plgButton = (on) => {
    if (on && !plg) {
      const keep = document.querySelector('.nav__links li.nav__keep'); if (!keep) return;
      plg = document.createElement('li'); plg.className = 'nav__keep';
      plg.innerHTML = `<button type="button" class="btn btn--line btn--sm nav__plg is-new" aria-label="Los dos lados: la puerta vista de afuera y de adentro, con el pliegue de tu teléfono como pared"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5h6v11H3zM11 4.5h6v11h-6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 2.5v15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.5 2"/></svg><span>Los dos lados</span></button>`;
      keep.before(plg);
      const go = () => { plg.querySelector('button').classList.remove('is-new'); plgMod.openPliegue(); };
      import('./pliegue.js').then((m) => { plgMod = m; }).catch(() => {});
      plg.querySelector('button').onclick = () => (plgMod ? go() : import('./pliegue.js').then((m) => { plgMod = m; go(); }).catch(() => {}));
    } else if (!on && plg) { plg.remove(); plg = null; }
  };
  const libro = () => {
    const on = foldOpen() && innerWidth >= 600;
    plgButton(on);
    if (on !== document.documentElement.classList.contains('is-libro')) { document.documentElement.classList.toggle('is-libro', on); dispatchEvent(new CustomEvent('st:libro', { detail: on })); }
  };
  libro();
  if (new URLSearchParams(location.search).get('plegable') === 'info') setTimeout(() => { const d = document.createElement('p'); d.className = 'toast is-on'; d.style.cssText = 'max-width:90vw;white-space:normal'; d.setAttribute('role', 'status'); d.textContent = `Pantalla ${screen.width} × ${screen.height} · ventana ${innerWidth} × ${innerHeight} · ×${devicePixelRatio} · táctil ${navigator.maxTouchPoints} · ${foldOpen() ? 'plegable abierto' : 'no detectado'}`; document.body.append(d); setTimeout(() => d.remove(), 20000); }, 800);
  // la primera vez en la visita con el teléfono abierto: la puerta se abre al llegar
  if (foldOpen()) { let seen = false; try { seen = sessionStorage.getItem('st.libro') === '1'; sessionStorage.setItem('st.libro', '1'); } catch { /* sin almacenamiento */ } if (!seen) setTimeout(() => foldFx('Se abre como tu teléfono'), 350); }
  let wasOpen = foldOpen();
  addEventListener('resize', () => {
    libro();
    const isOpen = foldOpen(), flip = isOpen !== wasOpen; wasOpen = isOpen;
    const w = innerWidth, s = scr(), o = ori();
    const jump = Math.abs(w - lastW) / Math.max(1, lastW);
    const screenJump = Math.abs(s[0] - lastS[0]) / Math.max(1, lastS[0]);
    const rotated = o.split('-')[0] !== lastO.split('-')[0];
    const zoomed = window.visualViewport && Math.abs(visualViewport.scale - 1) > 0.05;
    const opened = s[0] * s[1] > lastS[0] * lastS[1];
    // la pantalla misma cambió de tamaño sin girar: es un plegable; se recuerda en este teléfono
    if (screenJump >= 0.22 && !rotated && navigator.maxTouchPoints > 0) { lsSet('st.plegable', '1'); libro(); }
    lastW = w; lastS = s; lastO = o;
    // plegar o desplegar: la pantalla cambia de tamaño o (iPhone Duo) la ventana pasa a ser más grande que la pantalla
    if (flip && !zoomed && !document.hidden && performance.now() - t0 > 1200) { lastW = w; foldFx(isOpen ? 'Se abre como tu teléfono' : ''); return; }
    if (jump < 0.22 || screenJump < 0.22 || rotated || zoomed || performance.now() - t0 < 1200 || document.hidden) return;
    foldFx(opened ? 'Se abre como tu teléfono' : '');
  });
}

// ---------- Fase 13 · bienvenida para quien llega de un anuncio ----------
// El anuncio prometió algo; la página lo dice arriba con un botón que lleva directo a hacerlo («mensaje que coincide»).
// Solo aparece si la visita viene de un anuncio de Google y el grupo del anuncio corresponde a esta página.
const WELCOME = {
  camara: { donde: (page, door) => page === 'industriales' && door !== 'vaiven', texto: 'Puertas para cámara fría hechas a la medida de tu vano.', boton: 'Cotizar a la medida', ir: ['#cotizar', '#medida', '#medidaBox', '[data-vano]'] },
  vaiven: { donde: (page, door) => door === 'vaiven', texto: 'Puertas vaivén semi aislantes, a la medida de tu vano.', boton: 'Cotizar a la medida', ir: ['#cotizar', '#medida', '[data-vano]'] },
  refacciones: { donde: (page) => page === 'componentes', texto: '¿No sabes cómo se llama tu pieza? Toca la zona de la puerta donde está.', boton: 'Encontrar mi pieza', ir: ['#encuentra'] },
  cds: { donde: (page, door) => door === 'cds' || page === 'cds', texto: 'Juego de tres puertas de exhibición: Advanced, Plus o LT.', boton: 'Cotizar el juego', ir: ['#cotizar'] },
};
function adWelcome(page, header) {
  const g = adGroup(), w = g && WELCOME[g];
  if (!w || !fromAd() || !w.donde(page, document.body.dataset.door)) return;
  try { if (sessionStorage.getItem('st.ad.cerrado') === g) return; } catch { /* sin almacenamiento */ }
  const bar = document.createElement('aside'); bar.className = 'adw'; bar.setAttribute('aria-label', 'Para lo que buscabas'); bar.dataset.where = 'bienvenida-anuncio';
  const tel = contacto.telefono.replace(/[^+\d]/g, '');
  bar.innerHTML = `<div class="wrap adw__in"><p class="adw__t">${w.texto}</p><p class="adw__b"><a class="btn btn--sm" href="#" data-adw-go>${w.boton}</a><a class="btn btn--sm btn--line adw__call" href="tel:${tel}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.6 2.8 4.4 3.4c-.7.2-1.1.9-1 1.6.9 5.7 5.3 10.1 11 11 .7.1 1.4-.3 1.6-1l.6-2.2c.2-.6-.1-1.2-.7-1.5l-2.4-1c-.5-.2-1.1-.1-1.5.3l-.8.9a9 9 0 0 1-4.2-4.2l.9-.8c.4-.4.5-1 .3-1.5l-1-2.4c-.3-.6-.9-.9-1.5-.7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>Llamar</a></p><button type="button" class="adw__x" aria-label="Cerrar">×</button></div>`;
  header.after(bar);
  bar.querySelector('[data-adw-go]').onclick = (e) => {
    e.preventDefault(); track('anuncio_boton', { grupo: g });
    const t = w.ir.map((sel) => document.querySelector(sel)).find(Boolean);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); else location.href = url('cotizar/');
  };
  bar.querySelector('.adw__x').onclick = () => { bar.remove(); try { sessionStorage.setItem('st.ad.cerrado', g); } catch { /* sin almacenamiento */ } };
}

// ---------- marco de página ----------
// Fase 12B · diagnóstico en pantalla: abre cualquier página con ?debug=1 (se recuerda en la pestaña; ?debug=0 lo quita).
// Muestra el navegador, la tarjeta gráfica y cualquier error, para poder ver qué pasa en un teléfono sin computadora.
function debugPanel() {
  let on = false;
  try { const q = new URLSearchParams(location.search).get('debug'); if (q === '1') sessionStorage.setItem('st.debug', '1'); if (q === '0') sessionStorage.removeItem('st.debug'); on = sessionStorage.getItem('st.debug') === '1'; } catch { /* sin almacenamiento */ }
  const lines = [];
  const box = on ? document.createElement('pre') : null;
  if (box) {
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:9999;max-height:38vh;overflow:auto;margin:0;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.82);color:#9fe8f2;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:auto';
    document.body.append(box);
  }
  const log = (m) => { lines.push(`${(performance.now() / 1000).toFixed(1)}s ${m}`); if (box) box.textContent = lines.join('\n'); };
  window.__stLog = log;
  if (!on) return;
  let gpu = '';
  try { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); if (g) { const e = g.getExtension('WEBGL_debug_renderer_info'); gpu = e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); } else gpu = 'sin WebGL'; } catch (e) { gpu = 'WebGL: ' + e.message; }
  log(`${navigator.userAgent}`); log(`pantalla ${innerWidth}×${innerHeight} @${devicePixelRatio} · GPU ${gpu}`);
  addEventListener('error', (e) => log(`ERROR ${e.message} ${(e.filename || '').split('/').pop()}:${e.lineno}`));
  addEventListener('unhandledrejection', (e) => log(`PROMESA ${e.reason && (e.reason.message || e.reason)}`));
  const ce = console.error.bind(console), cw = console.warn.bind(console);
  console.error = (...a) => { log('console.error ' + a.map((x) => (x && x.message) || String(x)).join(' ')); ce(...a); };
  console.warn = (...a) => { log('console.warn ' + a.map((x) => (x && x.message) || String(x)).join(' ')); cw(...a); };
  addEventListener('st:model-progress', (e) => { if (e.detail === 1) log('modelo 3D descargado'); });
}

export function mountSite(page) {
  debugPanel();
  captureAd(); loadTags(); watchClicks();               // Fase 13 · medición y contexto del anuncio (src/ui/track.js)
  // los enlaces escritos en el HTML como "/ruta/" siguen funcionando si el sitio se publica en una subcarpeta
  // (Fase 14: sin repetir la subcarpeta: el build ya la pone en el HTML; antes quedaba /STDOORS/STDOORS/… y daba 404)
  if (BASE !== '/') document.querySelectorAll('a[href^="/"]').forEach((a) => { const h = a.getAttribute('href'); if (!h.startsWith(BASE)) a.setAttribute('href', url(h)); });
  const header = document.createElement('header');
  header.className = 'nav';
  header.innerHTML = `
    <div class="wrap nav__in">
      <a class="nav__logo" href="${url('')}" aria-label="ST Doors, inicio"><img src="${url('img/marca/st-logo-azul.webp')}" alt="ST Doors" width="74" height="30"></a>
      <nav aria-label="Principal"><ul class="nav__links">
        ${NAV.map((n) => `<li><a href="${url(n.href)}"${page === n.key ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
        <li class="nav__keep"><a class="btn btn--sm" href="${url('cotizar/')}"${page === 'cotizar' ? ' aria-current="page"' : ''}>Cotizar <span class="nav__count" data-solicitud-count aria-label="elementos en tu solicitud"></span></a></li>
        <li class="nav__keep"><button class="btn btn--line btn--sm nav__menu" aria-expanded="false" aria-controls="menu">Menú</button></li>
      </ul></nav>
    </div>`;
  const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Ir al contenido';
  document.body.prepend(skip, header);
  adWelcome(page, header);
  // Fase 10I · menú del celular: las cuatro puertas con su foto (un toque para llegar a cualquiera), Componentes, Cotizar
  // con lo que llevas y el contacto. En computadora, al pasar por «Industriales» se despliegan las tres puertas.
  const here = document.body.dataset.door || page;
  const menu = document.createElement('div'); menu.className = 'menu'; menu.id = 'menu'; menu.hidden = true;
  // Fase 11 · menú «adentro de la cámara»: azul marino, la ruta de un minuto arriba, las cuatro puertas en una tira que
  // se desliza con el dedo, y lo demás en renglones grandes
  const RUTA = { abatible: 'Cámara de frío', corrediza: 'Vanos anchos', vaiven: 'Cocinas y pasillos', cds: 'Exhibición en tienda' };
  menu.innerHTML = `<div class="wrap menu__in">
      <a class="menu__route" href="${url('')}"><span class="menu__rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><b>Baja a −20 °C</b><span>Las puertas, por dentro, la CDS y tu medida, de afuera hacia adentro</span></a>
      <p class="menu__l" id="menuDoors">Puertas</p>
      <ul class="menu__doors" aria-labelledby="menuDoors">${DOORS.map((d, i) => `<li style="--i:${i}"><a href="${url(d.href)}"${d.id === here ? ' aria-current="page"' : ''}><img src="${url(`img/inicio/ruta/${d.id}.webp`)}" alt="" width="420" height="560" loading="lazy" decoding="async"><b>${d.nombre}</b><span>${d.id === here ? 'Estás aquí' : RUTA[d.id]}</span></a></li>`).join('')}</ul>
      <ul class="menu__rows">
        <li><a href="${url('industriales/')}"${page === 'industriales' ? ' aria-current="page"' : ''}><b>Industriales</b> <span>Compara las tres y elige</span></a></li>
        <li><a href="${url('componentes/')}"${page === 'componentes' ? ' aria-current="page"' : ''}><b>Componentes</b> <span>Piezas de repuesto con su número</span></a></li>
        <li><a href="${url('componentes/')}#encuentra"><b>¿Qué pieza es?</b> <span>Toca la puerta y encuéntrala</span></a></li>
        <li><a href="${url('cotizar/')}"${page === 'cotizar' ? ' aria-current="page"' : ''}><b>Cotizar</b> <span data-menu-count>Tu solicitud</span></a></li>
      </ul>
      <p class="menu__c"><a href="mailto:${contacto.correo}">${contacto.correo}</a><a href="tel:${contacto.telefono.replace(/[^+\d]/g, '')}">${contacto.telefono}</a></p>
    </div>`;
  header.append(menu);
  const menuBtn = header.querySelector('.nav__menu');
  const setMenu = (o) => {
    header.classList.toggle('is-open', o); menu.hidden = !o; menuBtn.setAttribute('aria-expanded', o); menuBtn.textContent = o ? 'Cerrar' : 'Menú';
    document.documentElement.classList.toggle('menu-open', o);
    const n = solicitud.all().length, mc = menu.querySelector('[data-menu-count]'); if (mc) mc.textContent = n ? `${n} ${n === 1 ? 'producto' : 'productos'} en tu solicitud` : 'Arma tu solicitud';
    if (o) requestAnimationFrame(() => menu.querySelector('a')?.focus({ preventScroll: true })); else menuBtn.focus({ preventScroll: true });
  };
  menuBtn.onclick = () => setMenu(!header.classList.contains('is-open'));
  menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 760 && header.classList.contains('is-open')) setMenu(false); });
  // computadora: panel de las tres puertas industriales bajo «Industriales»
  const indLi = [...header.querySelectorAll('.nav__links li')].find((li) => li.querySelector(`a[href="${url('industriales/')}"]`));
  if (indLi) { indLi.classList.add('nav__drop'); indLi.insertAdjacentHTML('beforeend', `<div class="nav__panel">${doorCards(here, { cls: 'dcards dcards--panel', only: ['abatible', 'corrediza', 'vaiven'] })}</div>`); }
  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 8), { passive: true });

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="wrap footer__in">
      <div class="stack" style="--stack:8px"><img src="${url('img/marca/st-logo-azul.webp')}" alt="ST Doors" width="74" height="30"><p>Puertas para cámaras frigoríficas y puertas de exhibición Reach-In CDS.</p></div>
      <ul>${NAV.map((n) => `<li><a href="${url(n.href)}">${n.label}</a></li>`).join('')}<li><a href="${url('cotizar/')}">Cotizar</a></li></ul>
      <ul><li><a href="mailto:${contacto.correo}">${contacto.correo}</a></li><li><a href="tel:${contacto.telefono.replace(/[^+\d]/g, '')}">${contacto.telefono}</a></li><li><span class="badge badge--warn">Datos del PDF CDS, por confirmar</span></li></ul>
    </div>`;
  document.body.append(footer);
  emit();
  requestAnimationFrame(() => revealSpecs());          // tras el primer cuadro, cuando la página ya tiene su alto
  // Fase 10E: scroll suave y cursor en computadora; títulos de sección que entran por líneas y tarjetas en cascada.
  // (El Inicio y los pasos de las puertas animan sus propios títulos.)
  smoothScroll(); cursor();
  requestAnimationFrame(() => {
    revealCascade();
    if (page === 'inicio') return;
    document.querySelectorAll('main h2').forEach((h) => {
      if (h.closest('.door__step, .door__hero, [data-no-lines]') || h.getBoundingClientRect().top < innerHeight) return;
      revealOnView(h);
    });
  });
  addEventListener('storage', (e) => { if (e.key === KEY) emit(); });
  foldWatch();
  fastNav();
  // Fase 10J · al llegar con #sección (p. ej. /cds/#ficha) se va ahí de inmediato, antes de que el 3D ocupe al teléfono;
  // si no, el navegador esperaba a que terminara de prepararse el modelo y la página se quedaba arriba unos segundos
  if (location.hash.length > 1) {
    let t = null; try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* nombre inválido */ }
    if (t && scrollY < 40 && t.getBoundingClientRect().top > innerHeight * 0.5) t.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  // enlace del código QR de «Verla en tu espacio»: abre la vista en el celular
  if (/[?&]ar=/.test(location.search)) import('./ar.js').then((m) => m.arFromUrl()).catch(() => {});
  // Fase 12 · al tocar (o pasar el cursor por) un botón que abre la vista 3D o la cámara, se empiezan a bajar el visor y el
  // modelo de esa puerta: el toque llega ~0.1–0.3 s después y la vista abre antes. data-warm="abatible|corrediza|vaiven|cds"
  const warm = (e) => {
    const b = e.target.closest && e.target.closest('[data-warm], [data-3d], [data-ar]'); if (!b) return;
    const fam = b.dataset.warm || (b.closest('[data-fam]') || {}).dataset?.fam; if (fam) import('./ar.js').then((m) => m.warmAR(fam)).catch(() => {});
  };
  document.addEventListener('pointerdown', warm, { passive: true, capture: true });
  document.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') warm(e); }, { passive: true });
  // Fase 10I · caché en el teléfono (solo en el sitio publicado; en pruebas automáticas, con ?sw=1)
  if (import.meta.env.PROD && 'serviceWorker' in navigator && (!navigator.webdriver || /[?&]sw=1/.test(location.search))) {
    addEventListener('load', () => navigator.serviceWorker.register(url('sw.js'), { scope: url('') }).catch(() => {}));
  }
}

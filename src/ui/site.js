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
  add(item) { const l = this.all(); if (!l.some((x) => x.id === item.id)) { l.push(item); this.save(l); } },
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
// Un cambio brusco de ancho (más de 22 % de una vez: plegar, desplegar o girar el teléfono) tapa el reacomodo con dos hojas
// azul marino que se juntan en la bisagra y vuelven a abrir. Cambiar el tamaño de una ventana arrastrando no lo dispara.
function foldWatch() {
  // Fase 10J · solo con un plegado de verdad. Antes bastaba con que cambiara el ancho de la ventana, y en Android eso pasa
  // también cuando algo de la página se sale por un lado (Chrome agranda la ventana para mostrarlo), al hacer zoom o al
  // abrir desde otra app: aparecían los paneles azules sin plegar nada. Ahora tiene que cambiar la pantalla misma, sin
  // girar el teléfono, sin zoom y no en los primeros segundos de la página.
  const scr = () => [screen.width, screen.height];
  const ori = () => (screen.orientation && screen.orientation.type) || (matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait');
  let lastW = innerWidth, lastS = scr(), lastO = ori(), t = 0;
  const t0 = performance.now();
  addEventListener('resize', () => {
    const w = innerWidth, s = scr(), o = ori();
    const jump = Math.abs(w - lastW) / Math.max(1, lastW);
    const screenJump = Math.abs(s[0] - lastS[0]) / Math.max(1, lastS[0]);
    const rotated = o.split('-')[0] !== lastO.split('-')[0];
    const zoomed = window.visualViewport && Math.abs(visualViewport.scale - 1) > 0.05;
    lastW = w; lastS = s; lastO = o;
    if (jump < 0.22 || screenJump < 0.22 || rotated || zoomed || performance.now() - t0 < 1200 || document.hidden) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let fx = document.querySelector('.foldfx');
    if (!fx) {
      fx = document.createElement('div'); fx.className = 'foldfx'; fx.setAttribute('aria-hidden', 'true');
      fx.innerHTML = `<i class="foldfx__l"></i><i class="foldfx__r"></i><img src="${url('img/marca/st-logo-blanco.png')}" alt="" width="120" height="49">`;
      document.body.append(fx);
    }
    fx.classList.remove('is-on'); void fx.offsetWidth; fx.classList.add('is-on');
    clearTimeout(t); t = setTimeout(() => fx.classList.remove('is-on'), 1100);
  });
}

// ---------- marco de página ----------
export function mountSite(page) {
  // los enlaces escritos en el HTML como "/ruta/" siguen funcionando si el sitio se publica en una subcarpeta
  if (BASE !== '/') document.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('href', url(a.getAttribute('href'))));
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
  // Fase 10I · menú del celular: las cuatro puertas con su foto (un toque para llegar a cualquiera), Componentes, Cotizar
  // con lo que llevas y el contacto. En computadora, al pasar por «Industriales» se despliegan las tres puertas.
  const here = document.body.dataset.door || page;
  const menu = document.createElement('div'); menu.className = 'menu'; menu.id = 'menu'; menu.hidden = true;
  // Fase 11 · menú «adentro de la cámara»: azul marino, la ruta de un minuto arriba, las cuatro puertas en una tira que
  // se desliza con el dedo, y lo demás en renglones grandes
  const RUTA = { abatible: 'Cámara de frío', corrediza: 'Vanos anchos', vaiven: 'Cocinas y pasillos', cds: 'Exhibición en tienda' };
  menu.innerHTML = `<div class="wrap menu__in">
      <a class="menu__route" href="${url('')}?recorrido=1"><span class="menu__rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><b>Recorrido de 60 s</b><span>De 30 °C a −20 °C: las puertas, por dentro, la CDS y tu medida</span></a>
      <p class="menu__l" id="menuDoors">Puertas</p>
      <ul class="menu__doors" aria-labelledby="menuDoors">${DOORS.map((d, i) => `<li style="--i:${i}"><a href="${url(d.href)}"${d.id === here ? ' aria-current="page"' : ''}><img src="${url(`img/inicio/ruta/${d.id}.webp`)}" alt="" width="420" height="560" loading="lazy" decoding="async"><b>${d.nombre}</b><span>${d.id === here ? 'Estás aquí' : RUTA[d.id]}</span></a></li>`).join('')}</ul>
      <ul class="menu__rows">
        <li><a href="${url('industriales/')}"${page === 'industriales' ? ' aria-current="page"' : ''}><b>Industriales</b> <span>Compara las tres y elige</span></a></li>
        <li><a href="${url('componentes/')}"${page === 'componentes' ? ' aria-current="page"' : ''}><b>Componentes</b> <span>Piezas de repuesto con su número</span></a></li>
        <li><a href="${url('componentes/')}#encuentra"><b>¿Qué pieza es?</b> <span>Toca la puerta y encuéntrala</span></a></li>
        <li><a href="${url('fuga-de-frio/')}"${page === 'fuga' ? ' aria-current="page"' : ''}><b>Calcula tu ahorro</b> <span>Cuánto ahorras en luz con la puerta cerrada</span></a></li>
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
  // Fase 10I · caché en el teléfono (solo en el sitio publicado; en pruebas automáticas, con ?sw=1)
  if (import.meta.env.PROD && 'serviceWorker' in navigator && (!navigator.webdriver || /[?&]sw=1/.test(location.search))) {
    addEventListener('load', () => navigator.serviceWorker.register(url('sw.js'), { scope: url('') }).catch(() => {}));
  }
}

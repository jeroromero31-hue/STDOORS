// Capa común de todas las páginas: estilos, fuente, navegación, pie, solicitud, avisos y hojas.
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';

const BASE = import.meta.env.BASE_URL;
export const url = (p) => BASE + p.replace(/^\//, '');

const NAV = [
  { href: 'industriales/', label: 'Industriales', key: 'industriales' },
  { href: 'cds/', label: 'CDS', key: 'cds' },
  { href: 'componentes/', label: 'Componentes', key: 'componentes' },
];

// ---------- Mi solicitud: puertas y piezas para cotizar ----------
const KEY = 'st.solicitud.v1';
let memory = [];
export const solicitud = {
  all() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return memory; } },
  save(list) { memory = list; try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* modo privado */ } emit(); },
  has(id) { return this.all().some((x) => x.id === id); },
  add(item) { const l = this.all(); if (!l.some((x) => x.id === item.id)) { l.push(item); this.save(l); } },
  remove(id) { this.save(this.all().filter((x) => x.id !== id)); },
};
function emit() {
  const n = solicitud.all().length;
  document.querySelectorAll('[data-solicitud-count]').forEach((el) => { el.textContent = n || ''; });
  document.dispatchEvent(new CustomEvent('st:solicitud', { detail: n }));
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
    close() { el.classList.remove('is-open'); scrim.classList.remove('is-on'); document.documentElement.style.overflow = ''; last && last.focus && last.focus(); },
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

// ---------- marco de página ----------
export function mountSite(page) {
  // los enlaces escritos en el HTML como "/ruta/" siguen funcionando si el sitio se publica en una subcarpeta
  if (BASE !== '/') document.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('href', url(a.getAttribute('href'))));
  const header = document.createElement('header');
  header.className = 'nav';
  header.innerHTML = `
    <div class="wrap nav__in">
      <a class="nav__logo" href="${url('')}" aria-label="ST Doors, inicio"><img src="${url('img/marca/st-logo-azul.webp')}" alt="ST Doors" width="62" height="30"></a>
      <nav aria-label="Principal"><ul class="nav__links">
        ${NAV.map((n) => `<li><a href="${url(n.href)}"${page === n.key ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
        <li class="nav__keep"><a class="btn btn--sm" href="${url('cotizar/')}"${page === 'cotizar' ? ' aria-current="page"' : ''}>Cotizar <span class="nav__count" data-solicitud-count aria-label="elementos en tu solicitud"></span></a></li>
        <li class="nav__keep"><button class="btn btn--line btn--sm nav__menu" aria-expanded="false" aria-controls="menu">Menú</button></li>
      </ul></nav>
    </div>`;
  const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Ir al contenido';
  document.body.prepend(skip, header);
  const menuBtn = header.querySelector('.nav__menu');
  menuBtn.onclick = () => { const o = header.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', o); menuBtn.textContent = o ? 'Cerrar' : 'Menú'; };
  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 8), { passive: true });

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="wrap footer__in">
      <div class="stack" style="--stack:8px"><img src="${url('img/marca/st-logo-azul.webp')}" alt="ST Doors" width="62" height="30"><p>Puertas para cámaras frigoríficas y puertas de exhibición Reach-In CDS.</p></div>
      <ul>${NAV.map((n) => `<li><a href="${url(n.href)}">${n.label}</a></li>`).join('')}<li><a href="${url('cotizar/')}">Cotizar</a></li></ul>
      <ul><li><a href="mailto:info@strefrigeracion.mx">info@strefrigeracion.mx</a></li><li><a href="tel:+523336001376">+52 33 3600 1376</a></li><li><span class="badge badge--warn">Datos del PDF CDS, por confirmar</span></li></ul>
    </div>`;
  document.body.append(footer);
  emit();
  addEventListener('storage', (e) => { if (e.key === KEY) emit(); });
}

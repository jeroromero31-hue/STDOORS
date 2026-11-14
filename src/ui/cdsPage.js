// Secciones propias de la página CDS: comparador de modelos y galería de instalaciones reales.
import { url } from './site.js';
import photos from '../data/cds-instalaciones.json';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Lo que dice el PDF de cada modelo, sin agregar nada. Advanced: dos vidrios sin resistencia, con argón;
// Plus: dos vidrios con resistencia; LT: tres vidrios con resistencia, para congelación.
const MODELOS = [
  { id: 'advanced', nombre: 'Advanced', uso: 'Refrigeración', vidrios: 2, resistencia: false, argon: true },
  { id: 'plus', nombre: 'Plus', uso: 'Refrigeración', vidrios: 2, resistencia: true, argon: false },
  { id: 'lt', nombre: 'LT', uso: 'Congelación', vidrios: 3, resistencia: true, argon: false },
];

// Corte del vidrio visto desde arriba: una barra por vidrio; ondas si lleva resistencia; puntos si la cámara lleva argón.
function corte(m) {
  const W = 220, H = 120, gap = 46, x0 = (W - (m.vidrios - 1) * gap) / 2, pane = (x) => `<rect x="${x - 4}" y="14" width="8" height="${H - 28}" rx="1.5" class="cds-cut__glass"/>`;
  let s = '';
  for (let i = 0; i < m.vidrios; i++) {
    const x = x0 + i * gap; s += pane(x);
    if (i < m.vidrios - 1 && m.argon) for (let k = 0; k < 9; k++) s += `<circle cx="${x + gap / 2 + (k % 3 - 1) * 9}" cy="${30 + Math.floor(k / 3) * 28}" r="2.4" class="cds-cut__gas"/>`;
  }
  if (m.resistencia) { const x = x0 + (m.vidrios - 1) * gap + 9; s += `<path d="M${x} 20 q6 6 0 12 q-6 6 0 12 q6 6 0 12 q-6 6 0 12 q6 6 0 12 q-6 6 0 12" class="cds-cut__heat"/>`; }
  return `<svg class="cds-cut" viewBox="0 0 ${W} ${H}" role="img" aria-label="Corte del vidrio: ${m.vidrios} vidrios${m.resistencia ? ', con resistencia' : ''}${m.argon ? ', con gas argón entre ellos' : ''}">
    <text x="10" y="${H / 2 + 4}" class="cds-cut__side">Exterior</text><text x="${W - 10}" y="${H / 2 + 4}" text-anchor="end" class="cds-cut__side">Interior</text>${s}</svg>`;
}

export function mountCdsSections() {
  // ---------- modelos ----------
  const grid = $('#modelos-grid');
  if (grid) {
    grid.innerHTML = MODELOS.map((m) => `
      <article class="cds-model" data-m="${m.id}">
        <header><h3>${m.nombre}</h3><span class="cds-model__use">${m.uso}</span></header>
        ${corte(m)}
        <dl class="cds-model__spec">
          <div><dt>Vidrios</dt><dd>${m.vidrios === 3 ? 'Tres' : 'Dos'}</dd></div>
          <div><dt>Resistencia</dt><dd>${m.resistencia ? 'Sí' : 'No'}</dd></div>
          ${m.argon ? '<div><dt>Cámara</dt><dd>Con gas argón</dd></div>' : ''}
        </dl>
        <button class="btn btn--line cds-model__go" data-m="${m.id}">Ver ${m.nombre} en 3D</button>
      </article>`).join('');
    const sync = () => { const cur = $('#swatches .chip[aria-pressed=true]'); $$('.cds-model', grid).forEach((c) => c.classList.toggle('is-current', !!cur && cur.dataset.o === c.dataset.m)); };
    $$('.cds-model__go', grid).forEach((b) => {
      b.onclick = () => {
        const chip = $(`#swatches .chip[data-o="${b.dataset.m}"]`); if (!chip) return;
        chip.click(); sync();
        $('#como').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      };
    });
    // sin visor 3D (sin WebGL) no hay a dónde llevar al usuario
    const watch = () => { const has = !!$('#swatches .chip'); $$('.cds-model__go', grid).forEach((b) => { b.hidden = !has; }); sync(); };
    watch(); new MutationObserver(watch).observe($('.door__ctl') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden'] });
  }

  // ---------- instalaciones ----------
  const gal = $('#galeria'); if (!gal) return;
  const src = (p, fmt) => Object.entries(p.imagen).map(([w, f]) => `${url('img/cds/' + f[fmt])} ${Math.min(+w, p.ancho)}w`).join(', ');
  const pic = (p, sizes, eager) => `<picture><source type="image/avif" srcset="${src(p, 'avif')}" sizes="${sizes}"><img src="${url('img/cds/' + p.imagen['960'].webp)}" srcset="${src(p, 'webp')}" sizes="${sizes}" width="${p.ancho}" height="${p.alto}" alt="${p.alt}" ${eager ? '' : 'loading="lazy"'} decoding="async"></picture>`;
  gal.innerHTML = photos.fotos.map((p, i) => `<li><button class="cds-photo" data-i="${i}" aria-label="Ampliar: ${p.alt}">${pic(p, '(max-width: 700px) 50vw, 33vw')}</button></li>`).join('');

  const dlg = $('#visor-foto'), fig = $('.photo-dlg__img', dlg), cap = $('.photo-dlg__cap', dlg);
  let cur = 0;
  const show = (i) => { cur = (i + photos.fotos.length) % photos.fotos.length; const p = photos.fotos[cur]; fig.innerHTML = pic(p, '100vw', true); cap.textContent = `${p.alt} · ${cur + 1} de ${photos.fotos.length}`; };
  $$('.cds-photo', gal).forEach((b) => { b.onclick = () => { show(+b.dataset.i); dlg.showModal(); }; });
  $('[data-prev]', dlg).onclick = () => show(cur - 1);
  $('[data-next]', dlg).onclick = () => show(cur + 1);
  $('[data-close]', dlg).onclick = () => dlg.close();
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });       // clic fuera de la foto
  dlg.addEventListener('close', () => { const b = $(`.cds-photo[data-i="${cur}"]`, gal); if (b) b.focus(); });
  let x0 = null;                                                                      // deslizar con el dedo
  fig.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  fig.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
}

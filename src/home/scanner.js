// Fase 10G · Escáner del Inicio. Cada puerta (normal) pasa bajo una línea de escaneo que, al bajar, la deja en rayos X
// y va señalando sus piezas con el número del catálogo. Las imágenes son de nuestros mismos modelos 3D, dibujadas desde
// la misma cámara en los dos modos (scripts/render-escaner.py): en el celular solo se cargan imágenes, nada de 3D.
import { url } from '../ui/site.js';
import { track, seg, reducedMotion } from './scrub.js';
import data from '../data/escaner.json';

export function mountScanner(section) {
  if (!section) return;
  const stage = section.querySelector('#scanStage'), name = section.querySelector('.scan__name'), count = section.querySelector('.scan__count'), go = section.querySelector('.scan__go');
  const wideQ = matchMedia('(min-width: 901px)');
  const doors = data.puertas, N = doors.length;
  const img = (d, fmt, modo) => url(`img/inicio/escaner/${d.id}-${fmt}-${modo}.webp`);
  stage.innerHTML = doors.map((d, i) => `
    <figure class="scan__door" data-i="${i}" ${i ? 'aria-hidden="true"' : ''}>
      <picture class="scan__x"><source media="(min-width: 901px)" data-srcset="${img(d, 'ancho', 'rayos')}"><img alt="${d.nombre} en rayos X" data-src="${img(d, 'alto', 'rayos')}" decoding="async"></picture>
      <picture class="scan__n" aria-hidden="true"><source media="(min-width: 901px)" data-srcset="${img(d, 'ancho', 'normal')}"><img alt="" data-src="${img(d, 'alto', 'normal')}" decoding="async"></picture>
      ${['ancho', 'alto'].map((fmt) => `<ol class="scan__tags scan__tags--${fmt}">${(d.tags[fmt] || []).map((t, k) => `
        <li class="scan__tag ${t.x > 0.56 ? 'is-l' : ''}" style="--x:${t.x};--y:${t.y}" data-y="${t.y}" data-k="${k + 1}" data-n="${t.numero || ''}" data-name="${t.nombre}"><i aria-hidden="true" data-k="${k + 1}"></i><span>${t.numero ? `<b>${t.numero}</b> ` : ''}${t.nombre}</span></li>`).join('')}</ol>`).join('')}
      <i class="scan__line" aria-hidden="true"><span>Rayos X</span></i>
    </figure>`).join('');
  const figs = [...stage.querySelectorAll('.scan__door')];
  // Fase 10I · en celular las etiquetas tapaban la puerta: sobre la imagen solo va un punto con número y abajo, en una
  // línea, la pieza que el escáner acaba de encontrar
  const now = document.createElement('p'); now.className = 'scan__now'; now.setAttribute('aria-hidden', 'true');
  go.before(now);
  let nowKey = '';
  const showNow = (tg) => {
    const key = tg ? tg.closest('.scan__door').dataset.i + ':' + tg.dataset.k : ''; if (key === nowKey) return; nowKey = key;
    now.innerHTML = tg ? `<i>${tg.dataset.k}</i><span>${tg.dataset.name}</span>${tg.dataset.n ? `<b>Pieza ${tg.dataset.n}</b>` : ''}` : '';
    now.classList.toggle('is-on', !!tg);
  };
  // las imágenes se piden cuando la sección se acerca
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return; io.disconnect();
    stage.querySelectorAll('[data-srcset]').forEach((x) => { x.srcset = x.dataset.srcset; });
    stage.querySelectorAll('img[data-src]').forEach((x) => { x.src = x.dataset.src; });
  }, { rootMargin: '150% 0px' }).observe(section);

  const setDoor = (i) => {
    const d = doors[i]; name.textContent = d.nombre; count.textContent = `${i + 1} de ${N}`;
    go.href = url(d.href.replace(/^\//, '')); go.textContent = `Abrir la ${d.nombre.replace(/^Puertas? /, '').replace('CDS Legacy', 'CDS')} en 3D`;
    figs.forEach((f, k) => { f.classList.toggle('is-on', k === i); f.setAttribute('aria-hidden', k !== i); });
  };
  // las etiquetas no se encimen: de arriba abajo, si una choca con otra del mismo lado se recorre hacia abajo
  const declutter = () => {
    const fmt = wideQ.matches ? 'ancho' : 'alto';
    figs.forEach((f) => {
      const tags = [...f.querySelectorAll(`.scan__tags--${fmt} .scan__tag`)];
      tags.forEach((t) => t.style.setProperty('--dy', '0px'));
      const placed = [];
      tags.map((t) => ({ t, r: t.querySelector('span').getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top).forEach(({ t, r }) => {
        let dy = 0;
        for (const p of placed) {
          const overlapX = r.left < p.right && r.right > p.left;
          if (overlapX && r.top + dy < p.bottom + 4 && r.bottom + dy > p.top) dy = p.bottom + 4 - r.top;
        }
        t.style.setProperty('--dy', `${Math.round(dy)}px`);
        placed.push({ left: r.left, right: r.right, top: r.top + dy, bottom: r.bottom + dy });
      });
    });
  };
  requestAnimationFrame(declutter); (document.fonts ? document.fonts.ready : Promise.resolve()).then(declutter);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(declutter, 200); });

  if (reducedMotion()) {                      // sin movimiento: las cuatro puertas en rayos X, una tras otra, con sus piezas
    section.classList.add('scan--static'); figs.forEach((f) => f.style.setProperty('--cut', 1));
    stage.querySelectorAll('.scan__tag').forEach((t) => t.classList.add('is-on')); setDoor(0); return;
  }
  let cur = -1;
  // cada puerta ocupa un tramo: entra (0–0.14), la línea baja (0.14–0.8) y se queda en rayos X con sus piezas
  track(section, (p) => {
    const k = Math.min(N - 1e-4, Math.max(0, (p || 0) * N)), i = Math.floor(k), t = k - i;
    if (i !== cur) { cur = i; setDoor(i); }
    const cut = seg(t, 0.14, 0.8), f = figs[i];
    f.style.setProperty('--cut', cut.toFixed(4));
    f.style.setProperty('--in', seg(t, 0, 0.12).toFixed(3));
    f.querySelector('.scan__line').classList.toggle('is-on', cut > 0.001 && cut < 0.999);
    const fmt = wideQ.matches ? 'ancho' : 'alto';
    let lastOn = null;
    f.querySelectorAll(`.scan__tags--${fmt} .scan__tag`).forEach((tg) => { const on = cut >= +tg.dataset.y; tg.classList.toggle('is-on', on); if (on && (!lastOn || +tg.dataset.y >= +lastOn.dataset.y)) lastOn = tg; });
    showNow(lastOn);
  }, { mode: 'pin', smooth: 10 });
}

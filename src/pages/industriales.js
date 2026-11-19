// Industriales (Fase 10I): las tres puertas con su imagen que pasa a rayos X, el espacio que pide cada una vista desde
// arriba (animada) y una comparación lado a lado. Todo lo que se afirma sale de las páginas de cada puerta y del catálogo.
import { mountSite, url } from '../ui/site.js';
import data from '../data/components.json';

mountSite('industriales');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const n = (id) => data.piezas.filter((p) => p.familias.includes(id)).length;
const PUERTAS = [
  { id: 'abatible', nombre: 'Abatible', como: 'Gira sobre sus bisagras y cierra con chapa de palanca.' },
  { id: 'corrediza', nombre: 'Corrediza', como: 'Corre colgada del riel y, al cerrar, baja para sellar contra el marco.' },
  { id: 'vaiven', nombre: 'Vaivén', como: 'Semi aislante. Sus hojas abren hacia los dos lados y regresan solas.' },
];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- las tres: imagen normal que se escanea a rayos X (al pasar el puntero o al verse en el celular) ----------
const img = (id, modo) => url(`img/inicio/escaner/${id}-alto-${modo}.webp`);
$('#indList').innerHTML = PUERTAS.map((d, i) => `
  <li class="ind-door" style="--i:${i}">
    <a class="ind-door__img" href="${url(`industriales/${d.id}/`)}" tabindex="-1" aria-hidden="true">
      <img class="ind-door__x" src="${img(d.id, 'rayos')}" alt="" width="900" height="1200" loading="lazy" decoding="async">
      <img class="ind-door__n" src="${img(d.id, 'normal')}" alt="" width="900" height="1200" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
      <i class="ind-door__line"></i>
    </a>
    <div class="ind-door__t">
      <h2 data-no-lines><span class="ind-door__k">Puerta</span> ${d.nombre.toLowerCase()}</h2>
      <p>${d.como}</p>
      <p class="ind-door__go"><a class="btn" href="${url(`industriales/${d.id}/`)}">Abrir en 3D</a><a class="link t-small" href="${url('componentes/')}?fam=${d.id}">${n(d.id)} piezas</a></p>
    </div>
  </li>`).join('');
// en celular (sin puntero fino) cada imagen se escanea una vez al aparecer
if (!matchMedia('(hover: hover)').matches && !reduce) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.intersectionRatio > 0.6) { e.target.classList.add('is-scan'); io.unobserve(e.target); } }), { threshold: [0.6] });
  $$('.ind-door').forEach((li) => io.observe(li));
}

// ---------- el espacio que pide cada una: planta animada ----------
// vista desde arriba: el muro con el vano, adentro (cámara) arriba y afuera abajo
const W0 = 115, W1 = 205, WY = 64;      // vano de 90 unidades
const wall = `<path class="pl-wall" d="M8 ${WY - 6}H${W0}V${WY + 6}H8Z M${W1} ${WY - 6}H312V${WY + 6}H${W1}Z"/>
  <text class="pl-in" x="16" y="${WY - 16}">Adentro</text><text class="pl-in" x="16" y="${WY + 26}">Afuera</text>`;
const PLAN = {
  abatible: `${wall}
    <path class="pl-zone" d="M${W0} ${WY + 6} L${W1} ${WY + 6} A90 90 0 0 1 ${W0} ${WY + 96} Z"/>
    <path class="pl-arc" d="M${W1} ${WY + 6} A90 90 0 0 1 ${W0} ${WY + 96}"/>
    <rect class="pl-leaf pl-leaf--ab" x="${W0}" y="${WY + 6}" width="90" height="7" rx="1.5"/>
    <circle class="pl-pin" cx="${W0}" cy="${WY + 9.5}" r="3"/>
    <text class="pl-t" x="${W0 + 50}" y="${WY + 70}">Espacio al frente para el giro</text>`,
  corrediza: `${wall}
    <path class="pl-zone" d="M${W1} ${WY + 6} H${W1 + 92} V${WY + 18} H${W1} Z"/>
    <line class="pl-rail" x1="${W0 - 4}" y1="${WY + 21}" x2="${W1 + 96}" y2="${WY + 21}"/>
    <rect class="pl-leaf pl-leaf--co" x="${W0 - 2}" y="${WY + 7}" width="94" height="8" rx="1.5"/>
    <text class="pl-t" x="${W1 + 46}" y="${WY + 44}">Muro libre a un lado</text>`,
  vaiven: `${wall}
    <path class="pl-zone" d="M${W0} ${WY} L${W0 + 45} ${WY} A45 45 0 0 0 ${W0} ${WY - 45} Z M${W1} ${WY} L${W1 - 45} ${WY} A45 45 0 0 1 ${W1} ${WY - 45} Z"/>
    <path class="pl-zone" d="M${W0} ${WY} L${W0 + 45} ${WY} A45 45 0 0 1 ${W0} ${WY + 45} Z M${W1} ${WY} L${W1 - 45} ${WY} A45 45 0 0 0 ${W1} ${WY + 45} Z"/>
    <rect class="pl-leaf pl-leaf--vl" x="${W0}" y="${WY - 3.5}" width="45" height="7" rx="1.5"/>
    <rect class="pl-leaf pl-leaf--vr" x="${W1 - 45}" y="${WY - 3.5}" width="45" height="7" rx="1.5"/>
    <circle class="pl-pin" cx="${W0}" cy="${WY}" r="3"/><circle class="pl-pin" cx="${W1}" cy="${WY}" r="3"/>
    <text class="pl-t" x="${(W0 + W1) / 2}" y="${WY + 70}">Abre hacia los dos lados</text>`,
};
const PLAN_TXT = {
  abatible: 'La hoja gira hacia afuera: deja libre frente al vano un cuarto de círculo del ancho de la hoja.',
  corrediza: 'La hoja corre pegada al muro: pide a un lado del vano un tramo de muro libre de su mismo ancho, para el riel.',
  vaiven: 'Las hojas se empujan desde cualquier lado y regresan solas: necesita espacio a los dos lados del vano.',
};
$('#indPlans').innerHTML = PUERTAS.map((d) => `
  <figure class="ind-plan" data-door="${d.id}">
    <svg viewBox="0 0 320 170" role="img" aria-label="Vista desde arriba de la puerta ${d.nombre.toLowerCase()}: ${PLAN_TXT[d.id]}">${PLAN[d.id]}</svg>
    <figcaption><b>${d.nombre}</b><span>${PLAN_TXT[d.id]}</span></figcaption>
  </figure>`).join('');
if (!reduce) {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-play', e.isIntersecting)), { threshold: 0.35 });
  $$('.ind-plan').forEach((f) => io.observe(f));
} else $$('.ind-plan').forEach((f) => f.classList.add('is-still'));

// ---------- lado a lado ----------
const ROWS = [
  ['Cómo abre', ['Gira sobre bisagras', 'Corre colgada de un riel', 'Hojas que abren hacia los dos lados']],
  ['Cómo cierra', ['Con chapa de palanca', 'Al cerrar baja y sella contra el marco', 'Regresa sola al centro']],
  ['Aislamiento', ['Refrigeración o congelación', 'Refrigeración o congelación', 'Semi aislante']],
  ['Espacio que pide', ['Frente al vano, para el giro', 'Muro libre a un lado', 'A los dos lados del vano']],
  ['Acabados', ['Negro, inoxidable o blanco sanitario', 'Un acabado', 'Negro, inoxidable o blanco sanitario']],
  ['Piezas en el catálogo', PUERTAS.map((d) => `<a class="link" href="${url('componentes/')}?fam=${d.id}">${n(d.id)} piezas</a>`)],
];
$('#indCmp').innerHTML = `
  <div class="cmpx__h" aria-hidden="true"><span></span>${PUERTAS.map((d) => `<b>${d.nombre}</b>`).join('')}</div>
  <dl class="cmpx__rows">${ROWS.map(([l, v]) => `<div class="cmpx__r"><dt>${l}</dt>${v.map((x, i) => `<dd><span class="cmpx__m">${PUERTAS[i].nombre}</span>${x}</dd>`).join('')}</div>`).join('')}</dl>`;

// ---------- Fase 10J · a la medida ----------
import('../ui/vano.js').then(({ mountVano }) => mountVano($('#indVano'))).catch((e) => console.error(e));

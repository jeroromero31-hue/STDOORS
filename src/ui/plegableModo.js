// Fase 14E · «Modo plegable»: solo en plegables abiertos (iPhone Duo y otros), y solo si la persona lo activa con el
// botón de la barra de arriba. Todo el sitio se parte en el pliegue del teléfono: en la página de la izquierda se lee y
// se elige; en la de la derecha se ve. La derecha nunca se va: lo que antes abría encima de la página (la ficha de una
// pieza, «Verla en tu espacio») se abre en ella.
//   · Inicio: a la izquierda las cuatro puertas en lista; a la derecha, el pasillo con la puerta elegida (se abre y su
//     temperatura sube). El resto del Inicio sigue a la izquierda.
//   · Industriales: a la derecha, la puerta que estás leyendo a la izquierda, a rayos X al llegar a ella.
//   · Cada puerta (y la CDS): a la derecha el 3D, todo el tiempo; a la izquierda, los pasos, las piezas, la ficha y cotizar.
//   · Componentes: a la derecha, «Encuentra tu pieza» (la puerta que se toca); al elegir una pieza, su ficha.
//   · Cotizar: a la izquierda lo que pides, dibujado; a la derecha tus datos y el envío.
//   · En el pliegue, una bisagra: al tocarla se abren «Los dos lados» (src/ui/pliegue.js).
import '../styles/plegable.css';
import { url } from './site.js';

const html = document.documentElement;
let pane = null, hinge = null, undo = [];
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
// mueve un nodo a otro lugar y deja una marca para regresarlo al apagar el modo
const move = (node, into) => { if (!node) return; const mark = document.createComment('pleg'); node.before(mark); into.append(node); undo.push(() => { mark.replaceWith(node); }); };

function hingeEl() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'pleg-hinge';
  b.setAttribute('aria-label', 'Los dos lados: la puerta vista desde afuera y desde adentro de la cámara, con el pliegue como pared');
  b.innerHTML = '<i></i><i></i><i></i><span>Toca la bisagra</span>';
  b.onclick = () => import('./pliegue.js').then((m) => m.openPliegue()).catch(() => {});
  return b;
}

// ---------- Inicio ----------
const DOORS = [
  { i: 0, id: 'abatible', nombre: 'Abatible', t: '−18 °C', uso: 'Congelación y refrigeración' },
  { i: 1, id: 'corrediza', nombre: 'Corrediza', t: '2 °C', uso: 'Vanos anchos y montacargas' },
  { i: 2, id: 'vaiven', nombre: 'Vaivén', t: '10 °C', uso: 'Cocinas y pasillos' },
  { i: 3, id: 'cds', nombre: 'CDS Legacy', t: '3 °C', uso: 'Exhibición en tienda' },
];
function home() {
  const hx = $('#hx'), inn = $('#adentro'); if (!hx || !inn) return;
  const left = document.createElement('section');
  left.className = 'pleg-home wrap'; left.setAttribute('aria-labelledby', 'plegHomeT');
  left.innerHTML = `
    <h1 id="plegHomeT">El frío se queda de su lado.</h1>
    <p class="t-lead">Elige una puerta aquí; se abre en la otra mitad de tu pantalla.</p>
    <ol class="pleg-list" aria-label="Puertas">
      ${DOORS.map((d) => `<li><button type="button" class="pleg-list__b" data-i="${d.i}" aria-pressed="${d.i === 0}"><b>${d.nombre}</b><span>${d.uso}</span><em>${d.t}</em></button></li>`).join('')}
    </ol>
    <p class="row"><a class="btn" href="${url('industriales/')}">Puertas industriales</a><a class="btn btn--line" href="${url('cds/')}">Puertas CDS</a></p>`;
  hx.before(left); undo.push(() => left.remove());
  move(inn, pane);
  const P = () => window.__pasillo;
  requestAnimationFrame(() => { if (P()) { P().layout(); P().center(0, false); P().greet && P().greet(); } });
  const sync = (n) => $$('.pleg-list__b', left).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === n)));
  $$('.pleg-list__b', left).forEach((b) => { b.onclick = () => { const p = P(); if (!p) return; p.center(+b.dataset.i); sync(+b.dataset.i); }; });
  const track = $('.pas__track', inn);
  const onScroll = () => { const p = P(); if (p) sync(p.nearest()); };
  if (track) { track.addEventListener('scroll', onScroll, { passive: true }); undo.push(() => track.removeEventListener('scroll', onScroll)); }
  undo.push(() => requestAnimationFrame(() => P() && P().layout()));
}

// ---------- Industriales ----------
function industriales() {
  const list = $$('#indList .ind-door'); if (!list.length) return;
  const show = document.createElement('div'); show.className = 'pleg-show';
  show.innerHTML = list.map((li, i) => {
    const a = $('.ind-door__go .btn', li), h = $('h2', li);
    const n = $('.ind-door__n', li), x = $('.ind-door__x', li);
    return `<figure class="pleg-show__f${i ? '' : ' is-on'}" data-i="${i}"><span class="pleg-show__img"><img class="pleg-show__x" src="${x.getAttribute('src')}" alt=""><img class="pleg-show__n" src="${n.getAttribute('src')}" alt=""></span>
      <figcaption><b>${h.textContent.trim()}</b><a class="btn btn--sm" href="${a.getAttribute('href')}">Abrir en 3D</a></figcaption></figure>`;
  }).join('');
  pane.append(show);
  const set = (i) => $$('.pleg-show__f', show).forEach((f) => { const on = +f.dataset.i === i; if (on && !f.classList.contains('is-on')) { f.classList.remove('is-scan'); void f.offsetWidth; f.classList.add('is-scan'); } f.classList.toggle('is-on', on); });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(list.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
  list.forEach((li) => io.observe(li)); undo.push(() => io.disconnect());
}

// ---------- Componentes ----------
function componentes() {
  const find = $('#encuentra'); if (!find) return;
  move(find, pane);
}

export function setModo(on) {
  if (on === html.classList.contains('is-pleg')) return;
  if (on) {
    html.classList.add('is-pleg');
    pane = document.createElement('aside'); pane.className = 'pleg-pane'; pane.setAttribute('aria-label', 'Página derecha');
    document.body.append(pane);
    hinge = hingeEl(); document.body.append(hinge);
    if ($('#hx')) home();
    else if ($('#indList')) industriales();
    else if ($('#catGrid')) componentes();
    if (!pane.childElementCount) pane.classList.add('is-empty');    // páginas con su propia derecha (puertas, Cotizar)
  } else {
    undo.reverse().forEach((f) => f()); undo = [];
    pane && pane.remove(); hinge && hinge.remove(); pane = hinge = null;
    html.classList.remove('is-pleg');
  }
  dispatchEvent(new CustomEvent('st:libro', { detail: on }));
  dispatchEvent(new Event('resize'));
}

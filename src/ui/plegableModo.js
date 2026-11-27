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
  let first = true; try { first = sessionStorage.getItem('st.bisagra') !== '1'; sessionStorage.setItem('st.bisagra', '1'); } catch { /* sin almacenamiento */ }
  b.innerHTML = `<i></i><i></i><i></i>${first ? '<span>Toca la bisagra: afuera y adentro</span>' : ''}`;
  b.onclick = () => import('./pliegue.js').then((m) => m.openPliegue()).catch(() => {});
  return b;
}

// ---------- Inicio ----------
// Izquierda: las cuatro puertas como lista que se despliega (lo de cada capítulo del Inicio: qué es, cómo cierra, sus
// datos y el botón al 3D), luego «Hecha a la medida de tu vano» y el cierre. Derecha: esa puerta en el pasillo, grande;
// se abre al tocarla y su pantalla marca cómo sube la temperatura. Lo demás del Inicio (la entrada, los capítulos y el
// escáner) está pensado para la pantalla completa y no se muestra en este modo.
const T = { abatible: '−18 °C', corrediza: '2 °C', vaiven: '10 °C', cds: '3 °C' };
function door(id) {
  if (id === 'cds') return { id, nombre: 'CDS Legacy', kind: 'Exhibición Reach-In, por juego', lead: 'Se quedan abiertas a 90° para surtir y se cierran solas.',
    spec: [['Modelos', 'Advanced, Plus o LT'], ['Medidas', '23", 26" o 30" × 73"'], ['Acabado', 'Negro; cromo bajo pedido']], href: url('cds/'), cta: 'Abrir las CDS en 3D' };
  const ch = $(`.ch[data-door="${id}"]`); if (!ch) return null;
  const a = $('.ch__t .btn', ch);
  return { id, nombre: $('h2', ch).textContent.trim(), kind: $('.ch__kind', ch).textContent.trim(), lead: $('.ch__lead', ch).textContent.trim(),
    spec: $$('.ch__spec > div', ch).map((d) => [$('dt', d).textContent.trim(), $('dd', d).textContent.trim()]), href: a.getAttribute('href'), cta: a.textContent.trim() };
}
function home() {
  const hx = $('#hx'), inn = $('#adentro'); if (!hx || !inn) return;
  const ds = ['abatible', 'corrediza', 'vaiven', 'cds'].map(door).filter(Boolean);
  const left = document.createElement('section');
  left.className = 'pleg-home wrap'; left.setAttribute('aria-labelledby', 'plegHomeT');
  left.innerHTML = `
    <h1 id="plegHomeT">El frío se queda de su lado.</h1>
    <p class="t-lead">Elige una puerta y tócala del otro lado del pliegue: se abre y su temperatura empieza a subir.</p>
    <ol class="pleg-list" aria-label="Puertas">
      ${ds.map((d, i) => `<li class="pleg-item${i ? '' : ' is-on'}">
        <button type="button" class="pleg-list__b" data-i="${i}" aria-expanded="${!i}" aria-controls="plegD${i}"><b>${d.nombre}</b><span>${d.kind}</span><em>${T[d.id]}</em></button>
        <div class="pleg-item__d" id="plegD${i}"${i ? ' hidden' : ''}>
          <p>${d.lead}</p>
          <dl>${d.spec.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
          <a class="btn btn--sm" href="${d.href}">${d.cta}</a>
        </div></li>`).join('')}
    </ol>`;
  hx.before(left); undo.push(() => left.remove());
  move(inn, pane);
  const foot = document.createElement('div'); foot.className = 'pleg-pane__foot';
  foot.innerHTML = '<p>Tócala para abrirla. Si se queda abierta, sube la temperatura.</p><a class="btn btn--sm btn--line" href="#"></a>';
  pane.append(foot);
  const P = () => window.__pasillo;
  const sel = (n, scroll) => {
    $$('.pleg-item', left).forEach((li, i) => { const on = i === n; li.classList.toggle('is-on', on); $('.pleg-list__b', li).setAttribute('aria-expanded', String(on)); $('.pleg-item__d', li).hidden = !on; });
    const a = $('a', foot); a.href = ds[n].href; a.textContent = ds[n].cta;
    if (scroll && P()) P().center(n);
  };
  sel(0, false);
  requestAnimationFrame(() => { if (P()) { P().layout(); P().center(0, false); P().greet && P().greet(); } });
  $$('.pleg-list__b', left).forEach((b) => { b.onclick = () => sel(+b.dataset.i, true); });
  const track = $('.pas__track', inn);
  let t = 0;
  const onScroll = () => { clearTimeout(t); t = setTimeout(() => { const p = P(); if (p) { const n = p.nearest(); if (!$$('.pleg-item', left)[n].classList.contains('is-on')) sel(n, false); } }, 120); };
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
  // la puerta de la derecha es la que estás leyendo: su tarjeta y, más abajo, su plano «El espacio que pide cada una»
  const plans = $$('#indPlans > *'), idx = (t) => (list.includes(t) ? list.indexOf(t) : plans.indexOf(t));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(idx(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
  [...list, ...plans].forEach((el) => io.observe(el)); undo.push(() => io.disconnect());
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

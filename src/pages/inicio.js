// Inicio: un recorrido que cruza la puerta. Afuera (blanco) la vaivén en 3D; al bajar abre y la cámara entra al
// interior (azul marino), donde están las tres puertas, las piezas y CDS; al final se sale otra vez a cotizar.
// Solo un visor 3D (brief §8: no cargar todos los visores en Inicio); se descarga después del texto.
import '../styles/home.css';
import { mountSite, url, contacto } from '../ui/site.js';
import { partPicture } from '../ui/picture.js';
import { track, seg, easeInOut, easeOut, reducedMotion } from '../home/scrub.js';
import fotos from '../data/inicio-fotos.json';
import catalog from '../data/components.json';

mountSite('inicio');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const F = Object.fromEntries(fotos.fotos.map((f) => [f.id, f]));

// <picture> AVIF/WebP de una foto del Inicio
function pic(f, sizes, { eager = false, alt = f.alt } = {}) {
  const set = (fmt) => Object.entries(f.imagen).map(([w, x]) => `${url('img/inicio/' + x[fmt])} ${w}w`).join(', ');
  const ws = Object.keys(f.imagen).map(Number), mid = f.imagen[ws.find((w) => w >= 960) || ws[ws.length - 1]];
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${url('img/inicio/' + mid.webp)}" srcset="${set('webp')}" sizes="${sizes}" width="${f.ancho}" height="${f.alto}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}

// ---------- entrada 3D ----------
const hx = $('#hx'), gl = $('#hxGl'), loadEl = $('#hxLoad');
const glOk = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
const poster = () => {
  // sin 3D: la foto de la vaivén ocupa el lugar de la escena y la entrada es una pantalla normal
  hx.classList.remove('hx--live'); hx.classList.add('hx--still'); loadEl.hidden = true;
  gl.innerHTML = pic(F['vaiven-frente'], '100vw', { eager: true });
};
const load = {
  set(k) { loadEl.style.setProperty('--k', k.toFixed(3)); loadEl.querySelector('b').textContent = `${Math.round(k * 100)} %`; },
  done() { loadEl.classList.add('is-done'); },
};
if (glOk) {
  if (!reducedMotion()) hx.classList.add('hx--live');           // la sección se alarga: el scroll abre la puerta
  // el texto se reparte con el avance: el título se va, el velo azul marino llega al cruzar
  if (!reducedMotion()) track(hx, (p) => {
    const title = 1 - seg(p, 0.02, 0.13);
    hx.style.setProperty('--title', title.toFixed(3)); hx.classList.toggle('is-past', title < 0.02);
    hx.style.setProperty('--cue', (1 - seg(p, 0, 0.03)).toFixed(3));
    hx.style.setProperty('--veil', easeInOut(seg(p, 0.8, 0.97)).toFixed(3));
  }, { mode: 'pin', smooth: 6 });
  import('../home/hero.js').then(({ mountHero }) => mountHero({
    section: hx, gl, hud: $('#hxHud'), load,
    readout: { el: $('#hxRead'), value: $('#hxRead b') },
    onFail: poster,
  })).catch((e) => { console.error(e); poster(); });
} else poster();

// ---------- capítulos: la foto se descubre abriéndose como su puerta ----------
$$('[data-foto]').forEach((el) => el.insertAdjacentHTML('afterbegin', pic(F[el.dataset.foto], el.dataset.sizes)));
$$('.ch').forEach((ch) => {
  const pin = $('.ch__pin', ch);
  let pinned = getComputedStyle(pin).position === 'sticky';
  addEventListener('resize', () => { pinned = getComputedStyle(pin).position === 'sticky'; });
  track(ch, (p) => {
    // fija (escritorio): abre en la primera mitad y el texto entra después. En flujo (celular): abre al entrar.
    const o = pinned ? easeInOut(seg(p, 0.06, 0.5)) : easeInOut(seg(p, 0.2, 0.8));
    const t = pinned ? easeOut(seg(p, 0.26, 0.52)) : 1;
    ch.style.setProperty('--o', o.toFixed(4)); ch.style.setProperty('--t', t.toFixed(4));
  }, { mode: () => (pinned ? 'pin' : 'enter'), smooth: 7 });
});

// ---------- el sistema: piezas reales con su número de catálogo ----------
const PIEZAS = [['30', 'abatible'], ['27', 'abatible'], ['37', 'corrediza'], ['57', 'corrediza'], ['64', 'corrediza'], ['02', 'vaiven'], ['03', 'vaiven'], ['11', 'abatible']];
const PUERTA = { abatible: 'Abatible', corrediza: 'Corrediza', vaiven: 'Vaivén' };
const piezas = PIEZAS.map(([n, fam]) => ({ fam, p: catalog.piezas.find((x) => x.numero === n && x.familias.includes(fam)) })).filter((x) => x.p);
$('#sysLead').textContent = `${catalog.piezas.length} piezas de repuesto con fotografía y número de catálogo. Cada una se señala sobre su puerta en 3D.`;
const fig = $('#sysFig'), list = $('#sysList');
fig.innerHTML = piezas.map(({ p }, i) => `<div class="sys__img${i ? '' : ' is-on'}">${partPicture(p, { sizes: '(max-width: 899px) 0px, 40vw' })}</div>`).join('');
list.innerHTML = piezas.map(({ p, fam }, i) => `<li><a class="sys__row${i ? '' : ' is-on'}" href="${url('componentes/')}?id=${p.id}" data-i="${i}">
    <span class="sys__thumb" aria-hidden="true">${partPicture(p, { sizes: '72px' })}</span>
    <b class="sys__n">${p.numero}</b><span class="sys__name">${p.nombre}</span><span class="sys__fam">${PUERTA[fam]}${p.familias.length > 1 ? ' y ' + PUERTA[p.familias.find((f) => f !== fam)].toLowerCase() : ''}</span></a></li>`).join('');
const imgs = $$('.sys__img', fig), rows = $$('.sys__row', list);
const show = (i) => { imgs.forEach((x, k) => x.classList.toggle('is-on', k === i)); rows.forEach((x, k) => x.classList.toggle('is-on', k === i)); };
rows.forEach((r) => { const i = +r.dataset.i; r.addEventListener('pointerenter', () => show(i)); r.addEventListener('focus', () => show(i)); });

// ---------- CDS ----------
import('../home/cdsSequence.js').then(({ mountSequence }) => mountSequence($('#cdsSeq'), $('#cdsMedia'))).catch((e) => console.error(e));

// ---------- salida ----------
$('#homeMail').href = `mailto:${contacto.correo}?subject=${encodeURIComponent('Consulta desde el sitio')}`;
$('#homeMail').textContent = `Escribir a ${contacto.correo}`;

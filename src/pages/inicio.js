// Inicio: un recorrido que cruza la puerta. Afuera (blanco) la vaivén en 3D; al bajar abre y la cámara entra al
// interior (azul marino), donde están las tres puertas, las piezas y CDS; al final se sale otra vez a cotizar.
// Solo un visor 3D (brief §8: no cargar todos los visores en Inicio); se descarga después del texto.
import '../styles/home.css';
import { mountSite, url, contacto } from '../ui/site.js';
import { partPicture } from '../ui/picture.js';
import { track, seg, easeInOut, easeOut, reducedMotion } from '../home/scrub.js';
import { intro, splitLines, revealOnView, playLines } from '../ui/cine.js';
import vaivenBin from '../models/vaiven.bin?url';
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

// ---------- intro y entrada del título ----------
const hx = $('#hx'), gl = $('#hxGl'), loadEl = $('#hxLoad');
const firstVisit = !document.documentElement.classList.contains('sin-intro');
if (firstVisit) splitLines($('#hxTitle'));     // en visitas siguientes el título se ve de inmediato, sin animarlo
const curtain = intro(firstVisit ? $('#intro') : null, { onOpen: () => { if (firstVisit) playLines($('#hxTitle')); hx.classList.add('is-shown'); } });
// grano fino de película sobre la escena (se genera aquí: no se descarga nada)
try {
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'), img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = 96 + Math.random() * 64; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); hx.style.setProperty('--grain', `url(${c.toDataURL()})`);
} catch { /* sin grano */ }

// ---------- entrada 3D ----------
const glOk = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
const poster = () => {
  // sin 3D: la foto de la vaivén ocupa el lugar de la escena y la entrada es una pantalla normal
  curtain.ready();
  hx.classList.remove('hx--live'); hx.classList.add('hx--still'); loadEl.hidden = true;
  gl.innerHTML = pic(F['vaiven-frente'], '100vw', { eager: true });
};
const load = {
  set(k) { loadEl.style.setProperty('--k', k.toFixed(3)); loadEl.querySelector('b').textContent = `${Math.round(k * 100)} %`; curtain.progress(k); },
  done() { loadEl.classList.add('is-done'); curtain.ready(); },
};
if (glOk) {
  // el modelo (1.2 MB) empieza a bajar ya, junto con el JavaScript del 3D, no cuando este termina de llegar
  const response = fetch(vaivenBin);
  if (!reducedMotion()) hx.classList.add('hx--live');           // la sección se alarga: el scroll abre la puerta
  // el texto se reparte con el avance: el título se va, el velo azul marino llega al cruzar
  if (!reducedMotion()) track(hx, (p) => {
    const title = 1 - seg(p, 0.02, 0.13);
    hx.style.setProperty('--title', title.toFixed(3)); hx.classList.toggle('is-past', title < 0.02);
    hx.style.setProperty('--cue', (1 - seg(p, 0, 0.03)).toFixed(3));
    hx.style.setProperty('--veil', easeInOut(seg(p, 0.78, 0.92)).toFixed(3));
  }, { mode: 'pin', smooth: 12 });
  import('../home/hero.js').then(({ mountHero }) => mountHero({
    section: hx, gl, hud: $('#hxHud'), load, response,
    readout: { el: $('#hxRead'), value: $('#hxRead b') },
    onFail: poster,
  })).catch((e) => { console.error(e); poster(); });
} else poster();

// ---------- frase: las palabras se encienden en orden de lectura ----------
{
  const say = $('#say'), text = $('#sayText'), pin = $('.say__pin', say);
  const words = text.textContent.trim().split(/\s+/);
  text.innerHTML = words.map((w) => `<span class="w">${w}</span> `).join('');
  const ws = $$('.w', text), n = ws.length;
  const pinned = () => getComputedStyle(pin).position === 'sticky';
  track(say, (p) => {
    const L = (pinned() ? seg(p, 0.06, 0.66) : seg(p, 0.15, 0.95)) * n;
    ws.forEach((w, i) => w.style.setProperty('--on', Math.min(1, Math.max(0, L - i)).toFixed(2)));
    say.style.setProperty('--lead', (pinned() ? seg(p, 0.62, 0.78) : 1).toFixed(2));
  }, { mode: () => (pinned() ? 'pin' : 'enter'), smooth: 12 });
}

// ---------- cifras: cuentan hasta su valor al entrar ----------
$('#statPiezas').dataset.count = catalog.piezas.length;
$$('[data-count]').forEach((el) => {
  const to = +el.dataset.count;
  el.insertAdjacentHTML('beforebegin', `<span class="vh">${to}</span>`); el.setAttribute('aria-hidden', 'true');
  track(el.closest('div'), (p) => { el.textContent = Math.round(to * easeOut(seg(p, 0.1, 0.55))); }, { mode: 'enter', smooth: 10 });
});

// ---------- capítulos: la foto se descubre abriéndose como su puerta ----------
$$('[data-foto]').forEach((el) => el.insertAdjacentHTML('afterbegin', pic(F[el.dataset.foto], el.dataset.sizes)));
$$('.ch').forEach((ch) => {
  const pin = $('.ch__pin', ch), fig = $('.ch__door', ch), h2 = splitLines($('h2', ch));
  if (!reducedMotion()) h2.classList.add('is-pre');
  // En escritorio la foto empieza grande, al centro de la pantalla; ahí abre su puerta y después se hace a un lado
  // para dejar entrar el texto. Se mide su lugar final (sin transformar) y desde ahí se calcula el recorrido.
  let pinned = false, m0 = { dx: 0, dy: 0, s: 1 };
  const measure = () => {
    pinned = getComputedStyle(pin).position === 'sticky';
    if (!pinned) { ['--dx', '--dy', '--sc'].forEach((k) => ch.style.removeProperty(k)); return; }
    const W = pin.clientWidth, H = pin.clientHeight, nav = 69, w = fig.offsetWidth, h = fig.offsetHeight;
    m0 = { dx: W / 2 - (fig.offsetLeft + w / 2), dy: nav + (H - nav) / 2 - (fig.offsetTop + h / 2), s: Math.max(1, Math.min((H - nav - 56) / h, (W * 0.84) / w)) };
  };
  measure(); new ResizeObserver(measure).observe(pin);
  track(ch, (p) => {
    const o = pinned ? easeInOut(seg(p, 0.04, 0.34)) : easeInOut(seg(p, 0.2, 0.8));
    const mv = pinned ? easeInOut(seg(p, 0.36, 0.6)) : 1;
    const t = pinned ? easeOut(seg(p, 0.46, 0.66)) : 1;
    ch.style.setProperty('--o', o.toFixed(4)); ch.style.setProperty('--t', t.toFixed(4));
    h2.classList.toggle('is-in', t > 0.2);
    if (pinned) {
      ch.style.setProperty('--dx', `${(m0.dx * (1 - mv)).toFixed(1)}px`); ch.style.setProperty('--dy', `${(m0.dy * (1 - mv)).toFixed(1)}px`);
      ch.style.setProperty('--sc', (1 + (m0.s - 1) * (1 - mv)).toFixed(4));
    }
  }, { mode: () => (pinned ? 'pin' : 'enter'), smooth: 12 });
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
import('../home/scanner.js').then(({ mountScanner }) => mountScanner($('#escaner'))).catch((e) => console.error(e));

// ---------- títulos que entran por líneas al verse ----------
['.sys__head h2', '#cdsTitle'].forEach((sel) => revealOnView($(sel)));

// ---------- salida: la puerta se abre desde adentro ----------
{
  const out = $('#out'), pin = $('.out__pin', out), title = splitLines($('#outTitle'));
  if (!reducedMotion()) title.classList.add('is-pre');
  const pinned = () => getComputedStyle(pin).position === 'sticky';
  if (!pinned()) revealOnView(title);
  track(out, (p) => {
    if (!pinned()) return;
    const o = easeInOut(seg(p, 0.04, 0.55));
    out.style.setProperty('--o', o.toFixed(4)); out.classList.toggle('is-done', o > 0.995);
    title.classList.toggle('is-in', o > 0.35);
  }, { mode: () => (pinned() ? 'pin' : 'enter'), smooth: 12 });
}

// ---------- salida ----------
$('#homeMail').href = `mailto:${contacto.correo}?subject=${encodeURIComponent('Consulta desde el sitio')}`;
$('#homeMail').textContent = `Escribir a ${contacto.correo}`;

// Guía del sistema de diseño: muestra cada token y componente en su estado real.
import { mountSite, toast, createSheet, solicitud } from '../ui/site.js';
import { partPicture } from '../ui/picture.js';
import data from '../data/components.json';

mountSite('lab');
const $ = (s) => document.querySelector(s);

const colors = ['--c-wall', '--c-ice', '--c-navy', '--c-tech', '--c-cyan', '--c-ink', '--c-ink-soft', '--c-line', '--c-cds-advanced', '--c-cds-lt'];
const cs = getComputedStyle(document.documentElement);
$('#colors').innerHTML = colors.map((v) => `<li><span style="background:var(${v})"></span><code>${v}</code><b>${cs.getPropertyValue(v).trim()}</b></li>`).join('');

const scale = [['t-display', '--t-5xl', 'El frío se queda de su lado.'], ['t-h1', '--t-4xl', 'Puerta corrediza'], ['t-h2', '--t-3xl', 'Tres maneras de cerrar una cámara'], ['t-h3', '--t-xl', 'Corre por dentro del riel'], ['t-h4', '--t-lg', 'Bisagra reversible de 92 mm'], ['t-lead', '--t-lg', 'Puertas para cámaras frigoríficas y puertas de exhibición Reach-In.'], ['', '--t-md', 'Dos poleas llevan la hoja por el riel de aluminio Mirror. La tapa del riel se abre para verlas.'], ['t-small t-soft', '--t-sm', 'Pieza 57 · Corrediza']];
$('#type').innerHTML = scale.map(([c, v, t]) => `<div class="typerow"><code>${v}</code><p class="${c}" style="max-width:none">${t}</p></div>`).join('');

// selectores interactivos
document.querySelectorAll('.chips .chip').forEach((b) => b.onclick = () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'));
document.querySelectorAll('.segmented').forEach((g) => g.querySelectorAll('button').forEach((b) => b.onclick = () => g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b))));
document.querySelectorAll('.swatches').forEach((g) => g.querySelectorAll('.swatch').forEach((b) => b.onclick = () => { g.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#swName').textContent = b.getAttribute('aria-label'); }));
$('#toastBtn').onclick = () => toast('Agregada a tu solicitud');
$('#form').onsubmit = (e) => {
  e.preventDefault();
  const i = $('#mail'); const bad = !/^\S+@\S+\.\S+$/.test(i.value);
  i.setAttribute('aria-invalid', bad); $('#mailErr').hidden = !bad;
  if (!bad) toast('Correo válido');
};

// piezas reales + ficha
const sheet = createSheet('Ficha de la pieza');
const pick = ['37', '30', '11', '57', '27', '03', '47', ''].map((n, i) => (n ? data.piezas.find((p) => p.numero === n) : data.piezas.find((p) => !p.numero)));
$('#parts').innerHTML = pick.map((p) => `<button class="part" data-id="${p.id}">${partPicture(p)}<span class="part__t">${p.nombre}<small>${p.numero ? 'Pieza ' + p.numero : 'Sin número'} · ${p.familias.map((f) => data.familias.find((x) => x.id === f).nombre).join(' y ')}</small></span></button>`).join('');
document.querySelectorAll('#parts .part').forEach((b) => b.onclick = () => {
  const p = data.piezas.find((x) => x.id === b.dataset.id);
  sheet.meta.textContent = p.numero ? `Pieza ${p.numero}` : 'Sin número de catálogo';
  sheet.body.innerHTML = `<div style="margin:16px 0 20px;background:var(--c-white)">${partPicture(p, { sizes: '540px', alt: p.nombre })}</div>
    <div class="stack"><h2 class="t-h3">${p.nombre}</h2>${p.avisos.map((a) => `<p class="badge badge--warn" style="height:auto;padding:6px 8px">${a}</p>`).join('')}
    <dl class="spec"><div><dt>Tipo</dt><dd>${data.tipos.find((t) => t.id === p.tipo).nombre}</dd></div><div><dt>Se usa en</dt><dd>${p.familias.map((f) => 'Puerta ' + data.familias.find((x) => x.id === f).nombre.toLowerCase()).join(', ')}</dd></div><div><dt>Fuente</dt><dd>${p.pdf.join(', ')}</dd></div></dl>
    <div class="row"><button class="btn" id="sAdd">${solicitud.has(p.id) ? 'Ya está en tu solicitud' : 'Agregar a mi solicitud'}</button></div></div>`;
  sheet.body.querySelector('#sAdd').onclick = (e) => { solicitud.add({ id: p.id, nombre: p.nombre, tipo: 'Pieza' }); e.target.textContent = 'Agregada a tu solicitud'; toast('Agregada a tu solicitud'); };
  sheet.open();
});
$('#stats').textContent = `${data.piezas.length} piezas publicables · ${data.familias.map((f) => `${f.nombre} ${f.piezas}`).join(' · ')} · ${data.pendientes_sin_publicar.length} registradas sin imagen (no se publican)`;

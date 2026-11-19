// Fase 10J · «Encuentra tu pieza»: para quien no sabe cómo se llama la pieza que se le descompuso. Elige su puerta,
// toca la zona donde está (bisagras, chapa, riel, empaque…) y aparecen las piezas de esa zona con su número y foto.
// Si no la reconoce, manda una foto por WhatsApp. Las zonas están marcadas sobre las mismas imágenes del escáner.
import catalog from '../data/components.json';
import { url } from './site.js';
import { partPicture } from './picture.js';
import { sharePhoto } from './whatsapp.js';

const N = (...xs) => xs.map(String).map((x) => x.padStart(2, '0'));
// x, y: lugar de la zona sobre la imagen vertical del escáner (0…1); nums: números de catálogo; perfil: incluye el
// perfil sin número cuyo nombre lleva ese texto
export const ZONAS = {
  abatible: [
    { id: 'bisagras', nombre: 'Bisagras', x: 0.235, y: 0.23, nums: N(30, 31, 32, 33, 34) },
    { id: 'chapa', nombre: 'Chapa y cerrojo', x: 0.66, y: 0.49, nums: N(27, 28, 29) },
    { id: 'empaque', nombre: 'Empaques', x: 0.715, y: 0.68, nums: N(11, 12, 13, 14, 15) },
    { id: 'marco', nombre: 'Marco y perfiles', x: 0.755, y: 0.22, nums: N(9, 10, 16, 17, 18, 19, 21, 25, 26), perfil: '"H"' },
    { id: 'resistencia', nombre: 'Resistencia (congelación)', x: 0.47, y: 0.905, nums: N(24) },
  ],
  corrediza: [
    { id: 'riel', nombre: 'Riel y cubre riel', x: 0.62, y: 0.255, nums: N(57, 59, 50, 51, 52, 63) },
    { id: 'poleas', nombre: 'Poleas', x: 0.505, y: 0.345, nums: N(37, 38, 55) },
    { id: 'manija', nombre: 'Manija y palanca', x: 0.13, y: 0.6, nums: N(39, 40, 56, 64, 65, 66, 67, 68, 69, 71, 72, 73) },
    { id: 'cierre', nombre: 'Gancho de cierre', x: 0.115, y: 0.43, nums: N(41, 42) },
    { id: 'guia', nombre: 'Guía de abajo', x: 0.83, y: 0.665, nums: N(58, 53, 54, 46, 47, 48, 49, 44, 45) },
    { id: 'empaque', nombre: 'Empaques', x: 0.42, y: 0.735, nums: N(11, 12, 13, 14, 15) },
    { id: 'marco', nombre: 'Marco y perfiles', x: 0.505, y: 0.56, nums: N(9, 10, 16, 17, 18, 19, 21, 25, 26, 43), perfil: '"H"' },
    { id: 'electrico', nombre: 'Resistencia y visor', x: 0.3, y: 0.315, nums: N(24, 74, 75, 76) },
  ],
  vaiven: [
    { id: 'bisagras', nombre: 'Bisagras', x: 0.14, y: 0.27, nums: N(2, 5) },
    { id: 'ventanilla', nombre: 'Ventanilla', x: 0.3, y: 0.38, nums: N(3) },
    { id: 'bumper', nombre: 'Bumper', x: 0.66, y: 0.57, nums: N(6, 7, 8) },
    { id: 'empaque', nombre: 'Empaque y perfil del centro', x: 0.497, y: 0.44, nums: N(1, 4) },
    { id: 'marco', nombre: 'Marco y perfiles', x: 0.905, y: 0.5, nums: [], perfil: 'aluminio' },
  ],
};
const SUELTAS = { abatible: N(20, 22, 23, 35), corrediza: N(20, 22, 23, 60, 61, 62), vaiven: [] };
const NOMBRE = { abatible: 'Abatible', corrediza: 'Corrediza', vaiven: 'Vaivén' };

const piezasDe = (fam, z) => catalog.piezas.filter((p) => p.familias.includes(fam) && (z.nums.includes(p.numero) || (z.perfil && !p.numero && p.nombre.includes(z.perfil))))
  .sort((a, b) => z.nums.indexOf(a.numero) - z.nums.indexOf(b.numero));

export function mountFinder(host, { onPick = null, start = 'abatible' } = {}) {
  let fam = ZONAS[start] ? start : 'abatible', zona = null;
  const uid = Math.random().toString(36).slice(2, 7);
  host.classList.add('fnd');
  host.innerHTML = `
    <div class="fnd__head">
      <h2 id="fnd-${uid}">¿No sabes cómo se llama? Toca dónde está</h2>
      <p>Elige tu puerta y toca la zona de la pieza descompuesta.</p>
      <div class="chips" role="group" aria-label="Puerta">${Object.keys(ZONAS).map((f) => `<button type="button" class="chip" data-f="${f}" aria-pressed="${f === fam}">${NOMBRE[f]}</button>`).join('')}</div>
    </div>
    <div class="fnd__in">
      <div class="fnd__door"><img alt="" width="900" height="1200" decoding="async" loading="lazy"><div class="fnd__zones" role="group" aria-label="Zonas de la puerta"></div></div>
      <div class="fnd__side">
        <div class="fnd__zl" role="group" aria-label="Zonas"></div>
        <div class="fnd__res" aria-live="polite"></div>
      </div>
    </div>`;
  const img = host.querySelector('.fnd__door img'), zones = host.querySelector('.fnd__zones'), res = host.querySelector('.fnd__res'), zl = host.querySelector('.fnd__zl');

  const paintRes = () => {
    if (!zona) {
      res.innerHTML = `<p class="fnd__hint">Toca un punto de la puerta o elige la zona arriba.</p>
        ${SUELTAS[fam].length ? `<p class="fnd__more">También: <button type="button" class="link" data-sueltas>tornillos, tuercas y rondanas</button></p>` : ''}
        ${photo()}`;
    } else {
      const ps = zona === 'sueltas' ? catalog.piezas.filter((p) => p.familias.includes(fam) && SUELTAS[fam].includes(p.numero)) : piezasDe(fam, ZONAS[fam].find((z) => z.id === zona));
      const title = zona === 'sueltas' ? 'Tornillos, tuercas y rondanas' : ZONAS[fam].find((z) => z.id === zona).nombre;
      res.innerHTML = `<h3>${title} <span class="t-soft">· ${ps.length} ${ps.length === 1 ? 'pieza' : 'piezas'}</span></h3>
        <ul class="fnd__list">${ps.map((p) => `<li><a class="fnd__p" href="${url('componentes/')}?id=${p.id}" data-id="${p.id}"><span class="fnd__img">${partPicture(p, { sizes: '96px' })}</span><span><b>${p.numero || 'Sin número'}</b> ${p.nombre}</span></a></li>`).join('')}</ul>
        ${photo()}`;
      res.querySelectorAll('.fnd__p').forEach((a) => { a.onclick = (e) => { if (!onPick) return; e.preventDefault(); onPick(catalog.piezas.find((p) => p.id === a.dataset.id)); }; });
    }
    const sb = res.querySelector('[data-sueltas]'); if (sb) sb.onclick = () => { zona = 'sueltas'; paint(); };
    const fi = res.querySelector('input[type=file]');
    if (fi) fi.onchange = async () => {
      const f = fi.files && fi.files[0]; if (!f) return;
      const z = zona && zona !== 'sueltas' ? ZONAS[fam].find((x) => x.id === zona).nombre.toLowerCase() : '';
      await sharePhoto(f, { puerta: NOMBRE[fam].toLowerCase(), zona: z }); fi.value = '';
    };
  };
  const photo = () => `<div class="fnd__photo"><p><b>¿No la reconoces?</b> Tómale una foto y mándala por WhatsApp; te decimos cuál es.</p>
    <label class="btn btn--line wa-btn"><input type="file" accept="image/*" capture="environment" class="sr-only">Mandar foto de la pieza</label></div>`;
  const paint = () => {
    host.querySelectorAll('.chip[data-f]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === fam));
    img.src = url(`img/inicio/escaner/${fam}-alto-normal.webp`); img.alt = `Puerta ${NOMBRE[fam].toLowerCase()}`;
    zones.innerHTML = ZONAS[fam].map((z, i) => `<button type="button" class="fnd__z${zona === z.id ? ' is-on' : ''}" style="--x:${z.x};--y:${z.y};--i:${i}" data-z="${z.id}" aria-pressed="${zona === z.id}" aria-label="${z.nombre}: ${piezasDe(fam, z).length} piezas"><i aria-hidden="true"></i><span>${z.nombre}</span></button>`).join('');
    zl.innerHTML = ZONAS[fam].map((z) => `<button type="button" class="chip" data-z="${z.id}" aria-pressed="${zona === z.id}">${z.nombre}</button>`).join('');
    host.querySelectorAll('.fnd__z, .fnd__zl .chip').forEach((b) => { b.onclick = () => {
      const fromList = b.classList.contains('chip');
      zona = zona === b.dataset.z && !fromList ? null : b.dataset.z; paint();
      if (zona && !fromList && matchMedia('(max-width: 899px)').matches) zl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      if (fromList) { const on = zl.querySelector('[aria-pressed=true]'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    }; });
    paintRes();
  };
  host.querySelectorAll('.chip[data-f]').forEach((b) => { b.onclick = () => { fam = b.dataset.f; zona = null; paint(); }; });
  paint();
  return { setDoor(f) { if (ZONAS[f]) { fam = f; zona = null; paint(); } } };
}

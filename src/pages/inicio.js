// Inicio: sin visores 3D (brief §8: no cargar todos los visores en Inicio). Solo fotos responsivas.
import { mountSite, url, contacto } from '../ui/site.js';
import { partPicture } from '../ui/picture.js';
import fotos from '../data/inicio-fotos.json';
import cds from '../data/cds-instalaciones.json';
import catalog from '../data/components.json';

mountSite('inicio');
const $ = (s) => document.querySelector(s);
const F = Object.fromEntries(fotos.fotos.map((f) => [f.id, f]));

// <picture> AVIF/WebP para una foto con tamaños {ancho: {webp, avif}} en la carpeta indicada
function pic(f, dir, sizes, { eager = false, alt = f.alt } = {}) {
  const set = (fmt) => Object.entries(f.imagen).map(([w, x]) => `${url(dir + x[fmt])} ${w}w`).join(', ');
  const ws = Object.keys(f.imagen).map(Number), mid = f.imagen[ws.find((w) => w >= 960) || ws[ws.length - 1]];
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${url(dir + mid.webp)}" srcset="${set('webp')}" sizes="${sizes}" width="${f.ancho}" height="${f.alto}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const cdsFoto = (n) => cds.fotos.find((x) => x.id === 'instalacion-' + n);

document.querySelectorAll('[data-foto]').forEach((el) => { el.innerHTML = pic(F[el.dataset.foto], 'img/inicio/', el.dataset.sizes, { eager: el.hasAttribute('data-eager'), alt: el.tagName === 'A' ? '' : F[el.dataset.foto].alt }); });
document.querySelectorAll('[data-cds]').forEach((el) => { el.innerHTML = pic(cdsFoto(el.dataset.cds), 'img/cds/', el.dataset.sizes, { alt: '' }); });

const n = catalog.piezas.length;
$('#factInd').textContent = `${n} piezas de repuesto con fotografía y número de catálogo.`;

// Por dentro: cada punto sale de la página de su puerta y de los nombres del catálogo (no se agregan datos).
const pieza = (num, fam) => catalog.piezas.find((p) => p.numero === num && p.familias.includes(fam));
const FEATS = [
  { puerta: 'Corrediza', href: 'industriales/corrediza/#como', img: partPicture(pieza('37', 'corrediza'), { sizes: '160px' }),
    t: 'Corre colgada del riel y baja para sellar', p: 'La hoja va colgada de poleas sobre el riel de aluminio y, al cerrar, baja para apoyarse contra el marco.' },
  { puerta: 'Abatible', href: 'industriales/abatible/#como', img: partPicture(pieza('30', 'abatible'), { sizes: '160px' }),
    t: 'Bisagras reversibles y chapa de palanca', p: 'Gira sobre bisagras reversibles de 68 mm y cierra con chapa de palanca.' },
  { puerta: 'Vaivén', href: 'industriales/vaiven/#como', img: partPicture(pieza('02', 'vaiven'), { sizes: '160px' }),
    t: 'Dos hojas que abren hacia los dos lados', p: 'Lleva mirilla de 40 mm y bumper de 150 mm en la parte baja.' },
  { puerta: 'CDS Legacy', href: 'cds/#como', img: `<img src="${url('img/puertas/cds.webp')}" alt="" width="640" height="480" loading="lazy" decoding="async">`,
    t: 'Se queda abierta a 90° y cierra sola', p: 'Se sostiene abierta para surtir con las dos manos; si la sueltas antes, Kwik Torque la regresa al marco. Triple sello con imán.' },
];
$('#feats').innerHTML = FEATS.map((f) => `<li class="home-feat">
    <div class="home-feat__img">${f.img}</div>
    <div class="home-feat__t"><span class="home-feat__door t-small">${f.puerta}</span><h3>${f.t}</h3><p>${f.p}</p><a class="link t-small" href="${url(f.href)}">Verla en 3D</a></div>
  </li>`).join('');

// Instaladas: industriales y CDS, alternadas
// a, d y e son verticales y ocupan dos filas en escritorio (ver .home-mosaic en el CSS)
const mosaic = [['a', 'f', 'instalacion-vaiven'], ['b', 'c', '06'], ['c', 'f', 'instalacion-corrediza-1'], ['d', 'c', '09'], ['e', 'f', 'instalacion-corrediza-2'], ['f', 'c', '02']];
$('#mosaic').innerHTML = mosaic.map(([area, k, id]) => `<li class="home-mosaic__i" style="grid-area:${area}">${k === 'f' ? pic(F[id], 'img/inicio/', '(max-width: 700px) 50vw, 33vw') : pic(cdsFoto(id), 'img/cds/', '(max-width: 700px) 50vw, 33vw')}</li>`).join('');

$('#homeMail').href = `mailto:${contacto.correo}?subject=${encodeURIComponent('Consulta desde el sitio')}`;
$('#homeMail').textContent = `Escribir a ${contacto.correo}`;

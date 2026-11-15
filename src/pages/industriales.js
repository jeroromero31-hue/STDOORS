// Selector de puertas industriales: una entrada por puerta, con su imagen, cómo abre y cuántas piezas tiene en el catálogo.
import { mountSite, url } from '../ui/site.js';
import data from '../data/components.json';

mountSite('industriales');
// Las frases de "cómo abre" son las mismas que abren cada página de puerta.
const PUERTAS = [
  { id: 'abatible', nombre: 'Puerta abatible', como: 'Gira sobre sus bisagras y cierra con chapa de palanca.' },
  { id: 'corrediza', nombre: 'Puerta corrediza', como: 'Corre colgada del riel y, al cerrar, baja para sellar contra el marco.' },
  { id: 'vaiven', nombre: 'Puerta vaivén', como: 'Dos hojas que abren hacia los dos lados.' },
];
const n = (id) => data.piezas.filter((p) => p.familias.includes(id)).length;
document.getElementById('indList').innerHTML = PUERTAS.map((d) => `
  <li class="ind-door">
    <a class="ind-door__img" href="${url(`industriales/${d.id}/`)}" tabindex="-1" aria-hidden="true"><img src="${url(`img/puertas/${d.id}.webp`)}" alt="" width="960" height="810" decoding="async"></a>
    <div class="ind-door__t stack" style="--stack:12px">
      <h2 class="t-h3">${d.nombre}</h2>
      <p>${d.como}</p>
      <p class="row"><a class="btn" href="${url(`industriales/${d.id}/`)}">Ver la ${d.nombre.toLowerCase()}</a><a class="link t-small" href="${url('componentes/')}?fam=${d.id}">${n(d.id)} piezas en el catálogo</a></p>
    </div>
  </li>`).join('');

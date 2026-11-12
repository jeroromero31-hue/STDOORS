// <picture> responsiva para las piezas del catálogo (AVIF con respaldo WebP, carga diferida)
import { url } from './site.js';

export function partPicture(piece, { sizes = '(max-width: 700px) 50vw, 240px', eager = false, alt = '' } = {}) {
  const set = (fmt) => Object.entries(piece.imagen).map(([w, f]) => `${url('img/componentes/' + f[fmt])} ${w}w`).join(', ');
  const fallback = url('img/componentes/' + piece.imagen['480'].webp);
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${fallback}" srcset="${set('webp')}" sizes="${sizes}" width="480" height="360" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}></picture>`;
}

// Movimiento de página (Fase 7A). Cada efecto responde a qué explica del producto (brief §8) y se apaga con
// «reducir movimiento». Nada cambia el tamaño ni la posición del contenido: solo opacidad, transformación y recorte.
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fichas técnicas: los renglones aparecen en orden de lectura al llegar a la ficha. Si la ficha ya está a la vista
// al cargar (o se llega con #ficha), no se esconde nada.
export function revealSpecs(root = document) {
  if (reduced() || !('IntersectionObserver' in window)) return;
  root.querySelectorAll('dl.spec').forEach((dl) => {
    if (dl.getBoundingClientRect().top < innerHeight) return;
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.contains(dl)) return;                  // se llegó directo a esta sección
    [...dl.children].forEach((row, i) => row.style.setProperty('--i', i));
    dl.classList.add('reveal');
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      dl.classList.add('is-in'); io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(dl);
  });
}

// Contador de la solicitud: salta cuando sube, para confirmar que lo agregado llegó a «Cotizar».
let last = null;
export function bumpCount(n) {
  const grew = last !== null && n > last; last = n;
  if (!grew || reduced()) return;
  document.querySelectorAll('.nav__count').forEach((el) => { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); });
}

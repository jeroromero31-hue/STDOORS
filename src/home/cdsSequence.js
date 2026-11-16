// CDS en el Inicio: una secuencia de cuadros dibujados con el modelo 3D del sitio (scripts/render-cds-sequence.py)
// que avanza con el scroll, como las páginas de producto de Apple. Pesa mucho menos que un segundo visor 3D y se ve
// igual en cualquier teléfono. Los cuadros se descargan cuando la sección se acerca, primero unos pocos repartidos
// (para tener algo que mostrar en cualquier punto) y luego el resto.
import data from '../data/cds-secuencia.json';
import { url } from '../ui/site.js';
import { track, seg } from './scrub.js';

export function mountSequence(section, media) {
  const n = data.cuadros, wideQ = matchMedia('(min-width: 900px)');
  const pinQ = matchMedia('(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)');
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { alpha: false });
  media.append(canvas);
  let fmt = null, frames = [], want = 0, shown = -1, started = false;

  const order = () => {                       // 0, último, mitades, cuartos… así cualquier punto tiene un cuadro cerca
    const out = [], seen = new Set(), push = (i) => { if (!seen.has(i)) { seen.add(i); out.push(i); } };
    push(0); push(n - 1);
    for (let step = (n - 1) / 2; step >= 1; step /= 2) for (let x = step; x < n; x += step) push(Math.round(x));
    for (let i = 0; i < n; i++) push(i);
    return out;
  };
  const load = () => {
    const f = wideQ.matches ? 'ancho' : 'alto';
    if (f === fmt) return; fmt = f; frames = new Array(n).fill(null); shown = -1;
    const queue = order(); let active = 0;
    // Cada cuadro se decodifica fuera del hilo principal (createImageBitmap) ANTES de usarlo: antes se decodificaba al
    // dibujarlo por primera vez, en pleno scroll, y eso trababa la sección.
    const decode = async (src) => {
      if (window.createImageBitmap) {
        const blob = await (await fetch(src)).blob();
        return createImageBitmap(blob);
      }
      const img = new Image(); img.src = src; await img.decode(); return img;
    };
    const next = () => {
      while (active < 3 && queue.length) {
        const i = queue.shift(); active++;
        decode(url(`img/inicio/cds/${f}-${String(i).padStart(2, '0')}.webp`))
          .then((bmp) => { if (fmt === f) { frames[i] = bmp; draw(); } })
          .catch(() => {})
          .finally(() => { active--; next(); });
      }
    };
    next();
  };
  const size = () => {
    // a lo más 1.5×: los cuadros miden 1440 px; más resolución solo cuesta tiempo de dibujo
    const r = media.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); shown = -1; draw();
  };
  // dibuja el cuadro pedido o, si aún no llega, el más cercano que ya esté
  function draw() {
    if (!frames.length || !canvas.width) return;
    let i = want, d = 0;
    while (!frames[i]) { d++; if (frames[want - d]) { i = want - d; break; } if (frames[want + d]) { i = want + d; break; } if (d > n) return; }
    if (i === shown) return; shown = i;
    const img = frames[i], iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, cw = canvas.width, ch = canvas.height, s = Math.max(cw / iw, ch / ih);
    const w = iw * s, h = ih * s;
    // en horizontal el conjunto está a la derecha del cuadro: se recorta por la izquierda
    const x = wideQ.matches ? cw - w : (cw - w) / 2;
    ctx.drawImage(img, x, (ch - h) / 2, w, h);
  }

  new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; load(); size(); } }, { rootMargin: '150% 0px' }).observe(section);
  new ResizeObserver(() => { if (started) { load(); size(); } }).observe(media);
  track(section, (p) => {
    // fija: abre durante el tramo central; en flujo (celular): mientras la imagen cruza la pantalla
    const k = pinQ.matches ? seg(p, 0.05, 0.85) : seg(p, 0.1, 1);
    want = Math.min(n - 1, Math.max(0, Math.round(k * (n - 1)))); draw();
  }, { mode: () => (pinQ.matches ? 'pin' : 'enter'), smooth: 14 });
}

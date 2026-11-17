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
  let fmt = null, blobs = [], want = 0, shown = -1, started = false, gen = 0;
  // Fase 10G · memoria: antes se decodificaban los 72 cuadros completos (en celular ~190 MB de imagen en memoria) y el
  // teléfono se trababa al llegar a la sección. Ahora se guardan los archivos comprimidos (~1 MB en total) y solo se
  // decodifican, ya al tamaño del lienzo, los cuadros cerca del que se ve (12 a la vez como máximo).
  const bitmaps = new Map(), pending = new Set(), CAP = 12;
  let dir = 1, decoding = 0;

  const order = () => {                       // 0, último, mitades, cuartos… así cualquier punto tiene un cuadro cerca
    const out = [], seen = new Set(), push = (i) => { if (!seen.has(i)) { seen.add(i); out.push(i); } };
    push(0); push(n - 1);
    for (let step = (n - 1) / 2; step >= 1; step /= 2) for (let x = step; x < n; x += step) push(Math.round(x));
    for (let i = 0; i < n; i++) push(i);
    return out;
  };
  const load = () => {
    const f = wideQ.matches ? 'ancho' : 'alto';
    if (f === fmt) return; fmt = f; gen++; blobs = new Array(n).fill(null); shown = -1;
    bitmaps.forEach((b) => b.close && b.close()); bitmaps.clear(); pending.clear();
    const queue = order(), my = gen; let active = 0;
    const next = () => {
      while (active < 4 && queue.length) {
        const i = queue.shift(); active++;
        fetch(url(`img/inicio/cds/${f}-${String(i).padStart(2, '0')}.webp`)).then((r) => r.blob())
          .then((b) => { if (my === gen) { blobs[i] = b; pump(); } })
          .catch(() => {})
          .finally(() => { active--; next(); });
      }
    };
    next();
  };
  // tamaño al que se decodifica: el del cuadro ya escalado para cubrir el lienzo
  const fitSize = () => {
    const iw = wideQ.matches ? 1440 : 720, ih = 900, s = Math.max(canvas.width / iw, canvas.height / ih);
    return [Math.max(1, Math.round(iw * s)), Math.max(1, Math.round(ih * s))];
  };
  const decodeAt = async (i, my) => {
    const b = blobs[i];
    try {
      if (window.createImageBitmap) {
        const [rw, rh] = fitSize();
        try { return await createImageBitmap(b, { resizeWidth: rw, resizeHeight: rh, resizeQuality: 'medium' }); }
        catch { return await createImageBitmap(b); }
      }
      const img = new Image(); img.src = URL.createObjectURL(b); await img.decode(); return img;
    } finally { if (my !== gen) return null; }
  };
  // decodifica el cuadro pedido y los de adelante (en la dirección del scroll) y suelta los lejanos
  function pump() {
    if (!canvas.width) return;
    const wanted = [want]; for (let d = 1; d <= 5; d++) { wanted.push(want + d * dir); if (d <= 2) wanted.push(want - d * dir); }
    for (const i of wanted) {
      if (i < 0 || i >= n || bitmaps.has(i) || pending.has(i) || !blobs[i] || decoding >= 2) continue;
      pending.add(i); decoding++;
      const my = gen;
      decodeAt(i, my).then((bmp) => {
        pending.delete(i); decoding--;
        if (!bmp || my !== gen) return;
        bitmaps.set(i, bmp);
        if (bitmaps.size > CAP) {                                // suelta el más lejano
          let far = -1, fd = -1; bitmaps.forEach((_, k) => { const d0 = Math.abs(k - want); if (d0 > fd && k !== shown) { fd = d0; far = k; } });
          if (far >= 0) { const o = bitmaps.get(far); if (o.close) o.close(); bitmaps.delete(far); }
        }
        draw(); pump();
      }).catch(() => { pending.delete(i); decoding--; });
    }
  }
  const size = () => {
    // a lo más 1.5×: más resolución solo cuesta tiempo de dibujo
    const r = media.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h; shown = -1;
    bitmaps.forEach((b) => b.close && b.close()); bitmaps.clear(); pump(); draw();    // se decodifican de nuevo al tamaño nuevo
  };
  // dibuja el cuadro pedido o, si aún no llega, el más cercano que ya esté
  function draw() {
    if (!canvas.width || !bitmaps.size) return;
    let i = want, d = 0;
    while (!bitmaps.has(i)) { d++; if (bitmaps.has(want - d)) { i = want - d; break; } if (bitmaps.has(want + d)) { i = want + d; break; } if (d > n) return; }
    if (i === shown) return; shown = i;
    const img = bitmaps.get(i), iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, cw = canvas.width, ch = canvas.height, s = Math.max(cw / iw, ch / ih);
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
    const w0 = want; want = Math.min(n - 1, Math.max(0, Math.round(k * (n - 1)))); if (want !== w0) dir = want > w0 ? 1 : -1;
    draw(); pump();
  }, { mode: () => (pinQ.matches ? 'pin' : 'enter'), smooth: 14 });
}

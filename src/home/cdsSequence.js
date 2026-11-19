// CDS en el Inicio: la puerta central abre y se queda a 90°, tomada del modelo 3D del sitio.
// Fase 10H · antes era una secuencia de imágenes que seguía al scroll y en el celular se trababa (cada cuadro se
// decodificaba al vuelo). Ahora es un video corto (scripts/build-cds-video.py, 3 s, ~0.3 MB) que el teléfono
// reproduce con su decodificador: arranca solo cuando la imagen llega a la pantalla, se queda en la puerta abierta
// y vuelve a empezar si regresas a la sección desde arriba. Junto a él, el ángulo de la puerta cuenta en vivo,
// igual que en las páginas de cada puerta.
import data from '../data/cds-secuencia.json';
import { url } from '../ui/site.js';

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
// la puerta abre entre el 18 % y el 64 % de la toma (lab-cds-secuencia.js)
const angleAt = (t, d) => 90 * ease(seg(t / (d || data.segundos), 0.18, 0.64));

export function mountSequence(section, media) {
  const wideQ = matchMedia('(min-width: 900px)'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'none'; v.disablePictureInPicture = true;
  ['muted', 'playsinline', 'disableremoteplayback'].forEach((a) => v.setAttribute(a, ''));
  v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
  media.append(v);
  // la imagen (role="img") va dentro de un escenario que además lleva la lectura del ángulo y el botón para repetir
  const box = document.createElement('div'); box.className = 'cds-seq__stage';
  media.before(box); box.append(media);
  box.insertAdjacentHTML('beforeend', `<p class="cds-seq__ro" aria-hidden="true"><b>0°</b><span>Puerta central</span></p>
    <button class="cds-seq__again" type="button" hidden>Ver abrir otra vez</button>`);
  const ro = box.querySelector('.cds-seq__ro'), roVal = ro.firstElementChild, roTxt = ro.lastElementChild;
  const again = box.querySelector('.cds-seq__again');
  let fmt = null, played = false, near = false, raf = 0;

  const showAngle = () => {
    const a = Math.round(angleAt(v.currentTime, v.duration));
    roVal.textContent = `${a}°`; roTxt.textContent = a >= 90 ? 'Se queda abierta' : 'Puerta central';
    ro.classList.toggle('is-on', played);
  };
  const tick = () => { showAngle(); raf = v.paused || v.ended ? 0 : requestAnimationFrame(tick); };

  // Fase 10J · el iPhone no descarga un video por adelantado (ignora «preload»): empezaba a bajarlo al reproducir y se
  // detenía a cargar a media apertura. Ahora el video completo (~0.4 MB) se descarga antes, en segundo plano, y se
  // reproduce desde la memoria del teléfono: ya no hay pausas por red. Si la descarga falla, se usa el video normal.
  const typeOk = (x) => v.canPlayType(x === 'mp4' ? 'video/mp4; codecs="avc1.640020"' : 'video/webm; codecs="vp9"');
  let ready = false, want = false, blobUrl = '', loading = null;
  const markReady = () => { ready = true; if (want && !played) play(); };
  v.addEventListener('canplaythrough', markReady);
  v.addEventListener('loadeddata', () => { if (blobUrl) markReady(); });
  const setSrc = () => {
    const f = wideQ.matches ? 'ancho' : 'alto';
    if (f === fmt) return; fmt = f; ready = false;
    // con movimiento reducido (o antes de reproducir) se ve un cuadro fijo
    v.poster = url(`img/inicio/cds/${f}-${reduce.matches || played ? 'fin' : 'inicio'}.webp`);
    const ext = typeOk('mp4') ? 'mp4' : typeOk('webm') ? 'webm' : 'mp4';
    const file = url(`video/cds-${f}.${ext}`), mine = f;
    loading = fetch(file).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then((b) => {
      if (fmt !== mine) return;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(b.type ? b : new Blob([b], { type: `video/${ext}` }));
      v.src = blobUrl; v.preload = 'auto'; v.load();
    }).catch(() => {
      if (fmt !== mine) return;
      // respaldo: el navegador lo pide como siempre (H.264 primero; VP9 para los navegadores sin H.264)
      v.removeAttribute('src');
      v.replaceChildren(...['mp4', 'webm'].map((x) => Object.assign(document.createElement('source'), { src: url(`video/cds-${f}.${x}`), type: `video/${x}` })));
      v.preload = 'auto'; v.load();
    });
    if (played) v.addEventListener('loadedmetadata', () => { v.currentTime = Math.max(0, v.duration - 0.05); showAngle(); }, { once: true });
  };
  const play = () => {
    // si aún no termina de bajar, espera a estar completo (sigue mostrando el primer cuadro, igual al del video)
    if (!ready) { want = true; return; }
    want = false; played = true; again.hidden = true;
    if (v.ended || v.currentTime > 0.05) v.currentTime = 0;
    const p = v.play();
    if (p && p.catch) p.catch(() => { played = false; again.hidden = false; again.textContent = 'Ver abrir'; });   // ahorro de batería: se pide un toque
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  };
  const reset = () => { v.pause(); if (v.readyState) v.currentTime = 0; played = false; want = false; again.hidden = true; showAngle(); };

  v.addEventListener('ended', () => { showAngle(); again.hidden = false; again.textContent = 'Ver abrir otra vez'; });
  v.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
  again.addEventListener('click', () => { if (!ready) { setSrc(); } want = true; play(); });
  wideQ.addEventListener('change', setSrc);

  // se descarga en segundo plano poco después de abrir el Inicio (o antes, si la sección se acerca); con «ahorro de
  // datos» solo cuando ya está cerca
  const start = () => { if (near) return; near = true; setSrc(); };
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!saveData) addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(start, { timeout: 3000 }), 2500), { once: true });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: saveData ? '100% 0px' : '250% 0px' }).observe(section);

  // arranca con la imagen bien visible; si vuelves a subir por encima de la sección, queda lista para repetir
  new IntersectionObserver(([e]) => {
    if (reduce.matches) { if (!played) { played = true; v.poster = url(`img/inicio/cds/${fmt || 'alto'}-fin.webp`); roVal.textContent = '90°'; roTxt.textContent = 'Se queda abierta'; ro.classList.add('is-on'); again.hidden = false; again.textContent = 'Ver abrir'; } return; }
    if (e.intersectionRatio >= 0.55 && !played) play();
    else if (e.intersectionRatio < 0.55 && want && !played) want = false;
    else if (!e.isIntersecting && e.boundingClientRect.top > 0 && played) reset();
  }, { threshold: [0, 0.55] }).observe(media);

  // sin pestaña visible no hay nada que reproducir
  document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); });
}

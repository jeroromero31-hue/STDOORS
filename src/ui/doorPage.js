// Lógica común de las páginas de puerta (abatible, corrediza, vaivén).
// El contenido vive en el HTML; aquí solo va el comportamiento.
import '../styles/door.css';
import { mountSite, solicitud, toast, url } from './site.js';
import { partPicture } from './picture.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry, FINISHES_BY_DOOR, FINISH_LABEL } from '../materials/FinishRegistry.js';
import { createCameraRig } from '../core/cameraRig.js';
import { attachHingeDrag } from '../core/hinge.js';
import { createHotspots } from '../core/hotspots.js';
import catalog from '../data/components.json';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Cómo se mueve una puerta, visto desde la página. Las abisagradas usan este adaptador;
// las que se mueven de otra forma (la corrediza) traen el suyo en viewer.motion.
function hingeMotion(stage, viewer) {
  const hinges = viewer.hinges || [viewer.hinge];
  return {
    hinges,
    attachDrag: (opts) => attachHingeDrag(stage, hinges, { pickables: viewer.pickables, ...opts }),
    onOpenChange: (f) => hinges[0].onChange((h) => f(h.target > 45)),
    setOpen: (on) => hinges.forEach((h) => h.set(on ? 90 : 0)),
    inside: (on) => hinges.forEach((h) => h.set(on ? Math.min(85, h.max) : 0)),
    step: (d) => { if (d.open !== undefined) hinges.forEach((h) => h.set(Number(d.open))); },
  };
}

export function mountDoorPage({ familia, nombre, createViewer, poster }) {
  mountSite('industriales');
  const door = $('.door'), viewerEl = $('#viewer');
  const famLabel = catalog.familias.find((f) => f.id === familia).nombre;
  const parts = catalog.piezas.filter((p) => p.familias.includes(familia));

  // ---------- 3D ----------
  const still = (why) => `<img src="${url(poster)}" alt="${nombre}"><p class="t-small t-soft">${why} Aquí tienes una imagen de la puerta.</p>`;
  const stage = createStage(viewerEl, { fallback: still('Este dispositivo no pudo iniciar el visor 3D.') });
  let viewer = null, rig = null, state = { finish: null, open: false, inside: false };
  const openBtn = $('#openBtn'), insideBtn = $('#insideBtn'), hint = $('#hint'), live = $('#live');
  const noViewer = () => { $$('.door__ctl > *').forEach((el) => { el.hidden = true; }); hint.hidden = true; };
  if (stage) {
    // el registro compartido solo se crea para las puertas con acabados a elegir; las de un solo acabado traen sus materiales
    const finishes = FINISHES_BY_DOOR[familia] || [];
    const reg = finishes.length ? createFinishRegistry(stage.renderer) : null; if (reg) reg.setQuality(stage.quality);
    viewer = createViewer(stage, reg);
    rig = createCameraRig(stage, viewer.views); rig.go('general', 0);
    Object.assign(stage.controls, { minDistance: 0.4, maxDistance: 9, maxPolarAngle: Math.PI * 0.55 }, viewer.limits);
    const motion = viewer.motion || hingeMotion(stage, viewer);

    // los modelos que se descargan avisan cuando están listos; si fallan, queda la imagen fija
    if (viewer.ready) {
      viewerEl.classList.add('is-loading');
      viewer.ready.then(() => viewerEl.classList.remove('is-loading'), (err) => {
        console.error(err); stage.renderer.setAnimationLoop(null);
        viewerEl.classList.remove('is-loading'); viewerEl.innerHTML = `<div class="viewer__fallback">${still('No se pudo cargar el modelo 3D.')}</div>`;
        $('#hotspots').hidden = true; door.classList.remove('is-inside'); noViewer();
      });
    }

    motion.attachDrag({ onGrab: () => hint.classList.add('is-off') });
    stage.controls.addEventListener('start', () => hint.classList.add('is-off'));
    motion.onOpenChange((isOpen) => { if (isOpen !== state.open) { state.open = isOpen; openBtn.textContent = isOpen ? 'Cerrar' : 'Abrir'; } });
    openBtn.onclick = () => {
      const to = !state.open; motion.setOpen(to); live.textContent = to ? 'Puerta abierta' : 'Puerta cerrada';
      if (to && rig.current === 'general') rig.go('abierta'); if (!to && rig.current === 'abierta') rig.go('general');
      hint.classList.add('is-off');
    };

    // acabados: solo las opciones reales de esta puerta
    const sw = $('#swatches'), fin = $('#finishName');
    const cls = { blackMetal: 'swatch--black', stainless: 'swatch--stainless', hygienicWhite: 'swatch--white' };
    const setFinish = (f) => { state.finish = f; viewer.setFinish(f); fin.textContent = FINISH_LABEL[f]; $$('.swatch', sw).forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === f)); };
    if (finishes.length) {
      sw.innerHTML = finishes.map((f) => `<button class="swatch ${cls[f]}" data-f="${f}" aria-label="${FINISH_LABEL[f]}" aria-pressed="false"></button>`).join('');
      $$('.swatch', sw).forEach((b) => { b.onclick = () => setFinish(b.dataset.f); });
      setFinish(new URLSearchParams(location.search).get('acabado') in cls ? new URLSearchParams(location.search).get('acabado') : viewer.finish);
    } else { sw.remove(); fin.textContent = 'Un acabado'; }

    // ver por dentro: fondo azul marino y puntos de pieza
    const layer = $('#hotspots'), card = $('#hotcard');
    const items = viewer.anchors.map((a) => { const p = parts.find((x) => x.numero === a.numero); return p && { ...a, piece: p, label: p.nombre }; }).filter(Boolean);
    const hs = createHotspots(stage, layer, items, (it, btn) => {
      hs.nodes.forEach((n) => n.b.setAttribute('aria-pressed', n.b === btn));
      card.hidden = false;
      card.innerHTML = `${partPicture(it.piece, { sizes: '84px' })}<div><b>${it.piece.nombre}</b><a class="link t-small" href="${url('componentes/')}?id=${it.piece.id}">Ver pieza en el catálogo</a></div>`;
    });
    insideBtn.onclick = () => {
      state.inside = !state.inside; door.classList.toggle('is-inside', state.inside); viewer.setInside(state.inside);
      layer.hidden = !state.inside; card.hidden = true; hs.nodes.forEach((n) => n.b.setAttribute('aria-pressed', 'false'));
      insideBtn.setAttribute('aria-pressed', state.inside); insideBtn.textContent = state.inside ? 'Volver al exterior' : 'Ver por dentro';
      motion.inside(state.inside); rig.go(state.inside ? (viewer.views.interior ? 'interior' : 'abierta') : 'general');
      live.textContent = state.inside ? `Vista interior: ${items.length} piezas señaladas` : 'Vista exterior';
      hint.classList.add('is-off');
    };

    // cómo cierra: cada bloque de texto fija una cámara y una posición de la puerta.
    // La línea de disparo va donde se está leyendo: a media pantalla cuando el texto corre junto al visor;
    // cuando el visor queda fijo arriba (móvil), en la franja de texto que se ve debajo de él.
    const blocks = $$('[data-view]'), sticky = $('.door__viewer'), col = $('.door__col');
    let currentBlock = null, io = null, timer = 0;
    const onBlock = (es) => es.forEach((e) => {
      if (!e.isIntersecting || e.target === currentBlock) return; currentBlock = e.target;
      if (e.target !== blocks[0]) hint.classList.add('is-off');   // el aviso de arrastre solo acompaña a la vista inicial
      if (state.inside) return;                                   // en modo interior manda el usuario
      rig.go(e.target.dataset.view); motion.step(e.target.dataset);
    });
    const watch = () => {
      if (io) io.disconnect();
      const H = innerHeight, v = sticky.getBoundingClientRect(), stacked = col.getBoundingClientRect().left < v.right - 1;
      const below = (parseFloat(getComputedStyle(sticky).top) || 0) + v.height;      // borde inferior del visor fijo
      // sin pasar del primer bloque: al cargar la página manda la vista general
      const line = Math.round(stacked ? below + Math.min((H - below) * 0.75, blocks[0].offsetHeight * 0.85) : H * 0.5);
      io = new IntersectionObserver(onBlock, { rootMargin: `-${line - 1}px 0px -${H - line - 1}px 0px` });
      blocks.forEach((el) => io.observe(el));
    };
    watch(); addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(watch, 150); });
    window.__door = { stage, viewer, rig, motion, hinges: motion.hinges };
  } else noViewer();

  // ---------- piezas, ficha, cotizar ----------
  $('#partsLead').textContent = `${parts.length} piezas con fotografía en el catálogo.`;
  $('#partsAll').textContent = `Ver las ${parts.length}`; $('#partsAll').href = `${url('componentes/')}?fam=${familia}`;
  const featured = ($('#parts').dataset.featured || '').split(',').map((n) => parts.find((p) => p.numero === n)).filter(Boolean);
  $('#parts').innerHTML = (featured.length ? featured : parts.slice(0, 12)).map((p) => `<a class="part" href="${url('componentes/')}?id=${p.id}">${partPicture(p)}<span class="part__t">${p.nombre}<small>${p.numero ? 'Pieza ' + p.numero : 'Sin número'}</small></span></a>`).join('');
  $('#specCount').textContent = parts.length;
  const add = $('#addDoor');
  add.onclick = () => {
    const f = state.finish ? FINISH_LABEL[state.finish] : '';
    solicitud.add({ id: `puerta-${familia}${state.finish ? '-' + state.finish : ''}`, nombre: `${nombre}${f ? ', ' + f.toLowerCase() : ''}`, tipo: 'Puerta' });
    add.textContent = 'Agregada a tu solicitud'; toast('Agregada a tu solicitud');
  };

  // subnavegación activa
  const links = $$('.subnav a');
  const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((a) => { const t = $(a.getAttribute('href')); t && io2.observe(t); });
  return { stage, viewer, rig, famLabel };
}

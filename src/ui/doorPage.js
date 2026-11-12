// Lógica común de las páginas de puerta (abatible, corrediza, vaivén).
// El contenido vive en el HTML; aquí solo va el comportamiento.
import '../styles/door.css';
import { mountSite, solicitud, toast, url } from './site.js';
import { partPicture } from './picture.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry, FINISH_LABEL } from '../materials/FinishRegistry.js';
import { createCameraRig } from '../core/cameraRig.js';
import { attachHingeDrag } from '../core/hinge.js';
import { createHotspots } from '../core/hotspots.js';
import catalog from '../data/components.json';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function mountDoorPage({ familia, nombre, createViewer, poster }) {
  mountSite('industriales');
  const door = $('.door'), viewerEl = $('#viewer');
  const famLabel = catalog.familias.find((f) => f.id === familia).nombre;
  const parts = catalog.piezas.filter((p) => p.familias.includes(familia));

  // ---------- 3D ----------
  const stage = createStage(viewerEl, { fallback: `<img src="${url(poster)}" alt="${nombre}"><p class="t-small t-soft">Este dispositivo no pudo iniciar el visor 3D. Aquí tienes una imagen de la puerta.</p>` });
  let viewer = null, rig = null, state = { finish: null, open: false, inside: false };
  const openBtn = $('#openBtn'), insideBtn = $('#insideBtn'), hint = $('#hint'), live = $('#live');
  if (stage) {
    const reg = createFinishRegistry(stage.renderer); reg.setQuality(stage.quality);
    viewer = createViewer(stage, reg);
    rig = createCameraRig(stage, viewer.views); rig.go('general', 0);
    stage.controls.minDistance = 0.4; stage.controls.maxDistance = 9; stage.controls.maxPolarAngle = Math.PI * 0.55;
    const hinges = viewer.hinges || [viewer.hinge];
    attachHingeDrag(stage, hinges, { pickables: viewer.pickables, onGrab: () => hint.classList.add('is-off') });
    stage.controls.addEventListener('start', () => hint.classList.add('is-off'));
    hinges[0].onChange((h) => {
      const isOpen = h.target > 45; if (isOpen !== state.open) { state.open = isOpen; openBtn.textContent = isOpen ? 'Cerrar' : 'Abrir'; }
    });
    openBtn.onclick = () => { const to = state.open ? 0 : 90; hinges.forEach((h) => h.set(to)); live.textContent = to ? 'Puerta abierta' : 'Puerta cerrada'; if (to && rig.current === 'general') rig.go('abierta'); if (!to && rig.current === 'abierta') rig.go('general'); hint.classList.add('is-off'); };

    // acabados: solo las opciones reales de esta puerta
    const finishes = reg.finishFor(familia), sw = $('#swatches'), fin = $('#finishName');
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
      hinges.forEach((h) => h.set(state.inside ? Math.min(85, h.max) : 0)); rig.go(state.inside ? (viewer.views.interior ? 'interior' : 'abierta') : 'general');
      live.textContent = state.inside ? `Vista interior: ${items.length} piezas señaladas` : 'Vista exterior';
      hint.classList.add('is-off');
    };

    // cómo cierra: cada bloque de texto fija una cámara y un ángulo de la hoja
    const blocks = $$('[data-view]');
    let currentBlock = null;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || e.target === currentBlock) return; currentBlock = e.target;
      if (state.inside) return;                                   // en modo interior manda el usuario
      rig.go(e.target.dataset.view); if (e.target.dataset.open !== undefined) hinges.forEach((h) => h.set(Number(e.target.dataset.open)));
    }), { rootMargin: '-48% 0px -48% 0px' });
    blocks.forEach((b) => io.observe(b));
    window.__door = { stage, viewer, rig, hinges };
  } else {
    $$('.door__ctl > *').forEach((el) => { el.hidden = true; }); hint.hidden = true;
  }

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
  return { stage, viewer, famLabel };
}

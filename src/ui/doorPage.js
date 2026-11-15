// Lógica común de las páginas de puerta (abatible, corrediza, vaivén).
// El contenido vive en el HTML; aquí solo va el comportamiento.
import { Raycaster } from 'three';
import '../styles/door.css';
import { mountSite, solicitud, toast, url } from './site.js';
import { partPicture } from './picture.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry, FINISHES_BY_DOOR, FINISH_LABEL } from '../materials/FinishRegistry.js';
import { createCameraRig } from '../core/cameraRig.js';
import { hingeMotion } from '../core/hinge.js';
import { createHotspots } from '../core/hotspots.js';
import catalog from '../data/components.json';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function mountDoorPage({ familia, nombre, createViewer, poster, section = 'industriales' }) {
  mountSite(section);
  const door = $('.door'), viewerEl = $('#viewer');
  const parts = catalog.piezas.filter((p) => p.familias.includes(familia));

  // ---------- 3D ----------
  const still = (why) => `<img src="${url(poster)}" alt="${nombre}"><p class="t-small t-soft">${why} Aquí tienes una imagen de la puerta.</p>`;
  const stage = createStage(viewerEl, { fallback: still('Este dispositivo no pudo iniciar el visor 3D.') });
  let viewer = null, rig = null, state = { finish: null, option: null, open: false, inside: false };
  const openBtn = $('#openBtn'), insideBtn = $('#insideBtn'), hint = $('#hint'), live = $('#live');
  const noViewer = () => { $$('.door__ctl > *, .viewer__reframe').forEach((el) => { el.hidden = true; }); hint.hidden = true; };
  if (stage) {
    // el registro compartido solo se crea para las puertas con acabados a elegir; las de un solo acabado traen sus materiales
    const finishes = FINISHES_BY_DOOR[familia] || [];
    const reg = finishes.length ? createFinishRegistry(stage.renderer) : null; if (reg) reg.setQuality(stage.quality);
    viewer = createViewer(stage, reg);
    rig = createCameraRig(stage, viewer.views); rig.go('general', 0);
    Object.assign(stage.controls, { minDistance: 0.4, maxDistance: 9, maxPolarAngle: Math.PI * 0.55 }, viewer.limits);
    // cómo se mueve: las abisagradas usan el adaptador común; las demás (la corrediza) traen el suyo
    const motion = viewer.motion || hingeMotion(stage, viewer.hinges || [viewer.hinge], viewer.pickables);

    // los modelos que se descargan avisan cuando están listos; si fallan, queda la imagen fija
    if (viewer.ready) {
      viewerEl.classList.add('is-loading');
      viewer.ready.then(() => viewerEl.classList.remove('is-loading'), (err) => {
        console.error(err); stage.renderer.setAnimationLoop(null);
        viewerEl.classList.remove('is-loading'); viewerEl.innerHTML = `<div class="viewer__fallback">${still('No se pudo cargar el modelo 3D.')}</div>`;
        $('#hotspots').hidden = true; door.classList.remove('is-inside'); noViewer();
      });
    }

    // Reencuadre: el botón aparece solo cuando el usuario movió la cámara y devuelve el encuadre de la vista en curso.
    // No es un control fijo: se oculta en cuanto la cámara vuelve a un encuadre con nombre.
    const reframe = document.createElement('button'); let userCam = false;
    Object.assign(reframe, { type: 'button', className: 'btn btn--line btn--sm viewer__reframe', textContent: 'Reencuadrar', hidden: true });
    $('.door__viewer').append(reframe);
    stage.controls.addEventListener('start', () => { userCam = true; });
    stage.controls.addEventListener('end', () => { userCam = false; });
    stage.controls.addEventListener('change', () => { if (userCam) reframe.hidden = false; });
    rig.onGo(() => { reframe.hidden = true; });
    reframe.onclick = () => rig.go(rig.current || 'general', 0.6);

    motion.attachDrag({ onGrab: () => hint.classList.add('is-off') });
    stage.controls.addEventListener('start', () => hint.classList.add('is-off'));
    motion.onOpenChange((isOpen) => { if (isOpen !== state.open) { state.open = isOpen; openBtn.textContent = isOpen ? 'Cerrar' : 'Abrir'; } });
    openBtn.onclick = () => {
      const to = !state.open; motion.setOpen(to); live.textContent = to ? 'Puerta abierta' : 'Puerta cerrada';
      if (to && rig.current === 'general') rig.go('abierta'); if (!to && rig.current === 'abierta') rig.go('general');
      hint.classList.add('is-off');
    };

    // acabados: solo las opciones reales de esta puerta. Una puerta sin acabados a elegir puede traer otras opciones
    // (el modelo, en CDS): se muestran como botones de texto en el mismo lugar.
    const sw = $('#swatches'), fin = $('#finishName');
    const cls = { blackMetal: 'swatch--black', stainless: 'swatch--stainless', hygienicWhite: 'swatch--white' };
    // Transición de material: se copia el cuadro actual sobre el visor, se cambia el material y la copia se desvanece.
    // Es un fundido real entre el aspecto anterior y el nuevo, sincronizado con el cambio (Fase 7B).
    const crossfade = (swap) => {
      const c = stage.renderer.domElement;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !c.width) return swap();
      stage.renderer.render(stage.scene, stage.camera);
      const ov = document.createElement('canvas'); ov.className = 'viewer__fade'; ov.width = c.width; ov.height = c.height; ov.setAttribute('aria-hidden', 'true');
      ov.getContext('2d').drawImage(c, 0, 0); c.after(ov); swap();
      requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('is-out')));
      const done = () => ov.remove(); ov.addEventListener('transitionend', done); setTimeout(done, 900);
    };
    // la elección queda en la URL (?acabado= / ?modelo=): al volver con «atrás» o compartir el enlace se conserva
    const keep = (k, v) => { const q = new URLSearchParams(location.search); q.set(k, v); history.replaceState(history.state, '', `${location.pathname}?${q}${location.hash}`); };
    const setFinish = (f) => { state.finish = f; viewer.setFinish(f); keep('acabado', f); fin.textContent = FINISH_LABEL[f]; $$('.swatch', sw).forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === f)); };
    if (finishes.length) {
      sw.innerHTML = finishes.map((f) => `<button class="swatch ${cls[f]}" data-f="${f}" aria-label="${FINISH_LABEL[f]}" aria-pressed="false"></button>`).join('');
      $$('.swatch', sw).forEach((b) => { b.onclick = () => { if (b.dataset.f !== state.finish) crossfade(() => setFinish(b.dataset.f)); }; });
      setFinish(new URLSearchParams(location.search).get('acabado') in cls ? new URLSearchParams(location.search).get('acabado') : viewer.finish);
    } else if (viewer.options) {
      const o = viewer.options;
      sw.classList.add('chips'); sw.setAttribute('aria-label', o.label);
      sw.innerHTML = o.items.map((it) => `<button class="chip" data-o="${it.id}" aria-pressed="false" title="${it.title || it.label}">${it.label}</button>`).join('');
      const pick = (id) => { o.set(id); keep('modelo', id); state.option = o.items.find((x) => x.id === id); fin.textContent = state.option.detail || ''; $$('.chip', sw).forEach((b) => b.setAttribute('aria-pressed', b.dataset.o === id)); };
      $$('.chip', sw).forEach((b) => { b.onclick = () => { if (state.option && b.dataset.o === state.option.id) return; crossfade(() => pick(b.dataset.o)); live.textContent = state.option.title || state.option.label; }; });
      const q = new URLSearchParams(location.search).get('modelo'); pick(o.items.some((x) => x.id === q) ? q : o.current());
    } else { sw.remove(); fin.textContent = 'Un acabado'; }

    // ver por dentro: fondo azul marino y puntos de pieza
    const layer = $('#hotspots'), card = $('#hotcard');
    // cada ancla señala una pieza del catálogo: por número o, si no lo tiene, por su id interno
    // (o, si trae texto propio, una función del producto: se muestra como nota, sin foto)
    const items = viewer.anchors.map((a) => { if (a.text) return a; const p = parts.find((x) => (a.id ? x.id === a.id : x.numero === a.numero)); return p && { ...a, piece: p, label: p.nombre }; }).filter(Boolean);
    // Acercamiento: al elegir un punto, la cámara se acerca a esa pieza sin cambiar el ángulo desde el que se mira
    // (no atraviesa la puerta) y a la distancia mínima que permite el visor. «Ver toda la puerta» regresa (Fase 7B).
    const insideView = () => (viewer.views.interior ? 'interior' : 'abierta');
    // Si algo tapa la pieza desde ese ángulo (la hoja abierta delante de la bisagra, por ejemplo), se gira la vista
    // poco a poco alrededor del eje vertical, sin salir de los límites del visor, hasta verla sin obstáculos.
    const THREE_DEG = Math.PI / 180, ray = new Raycaster(), seeThrough = (m) => m.transparent && (m.opacity < 0.6 || m.transmission > 0.5);
    const visibleFrom = (eye, p) => {
      const D = eye.distanceTo(p); ray.set(eye, p.clone().sub(eye).normalize()); ray.far = D;
      const h = ray.intersectObject(stage.scene, true).find((x) => occludes(x));
      return !h || D - h.distance < 0.06;                       // lo que toca a menos de 6 cm es la pieza misma
    };
    const occludes = (x) => x.object.isMesh && x.object.visible && !(x.object.material && seeThrough(x.object.material));
    const segClear = (a, b) => { ray.set(a, b.clone().sub(a).normalize()); ray.far = a.distanceTo(b); return !ray.intersectObject(stage.scene, true).some(occludes); };
    const curveClear = (a, c, b) => {
      let prev = a;
      for (let k = 1; k <= 16; k++) {
        const t = k / 16, q = a.clone().multiplyScalar((1 - t) ** 2).addScaledVector(c, 2 * (1 - t) * t).addScaledVector(b, t * t);
        if (!segClear(prev, q)) return false; prev = q;
      }
      return true;
    };
    const macro = (it) => {
      stage.scene.updateMatrixWorld();                         // la puerta pudo moverse desde el último cuadro dibujado
      const p = it.position.clone(); (it.parent || stage.scene).localToWorld(p);
      const d0 = rig.destination, dir0 = d0.pos.clone().sub(d0.tgt).normalize();   // si la cámara va en camino, desde donde llegará
      const D = Math.max((stage.controls.minDistance || 0.4) * 1.1, stage.fitDistance(0.34, 0.34));
      const c = stage.controls, Y = dir0.clone().set(0, 1, 0);
      const inLimits = (d) => { const az = Math.atan2(d.x, d.z), pol = Math.acos(Math.max(-1, Math.min(1, d.y))); return az >= c.minAzimuthAngle && az <= c.maxAzimuthAngle && pol >= c.minPolarAngle && pol <= c.maxPolarAngle; };
      // Para cada ángulo se prueban la pieza y ocho puntos a 4 cm alrededor: gana el que deja ver más de la pieza;
      // girar cuenta en contra, así que solo se gira lo necesario.
      let dir = dir0, best = -Infinity, route = null;
      for (const deg of [0, 20, -20, 40, -40, 60, -60, 80, -80]) {
        const d = dir0.clone().applyAxisAngle(Y, (deg * Math.PI) / 180);
        if (!inLimits(d) || d.z * dir0.z <= 0 || Math.abs(d.z) < 0.25) continue;   // del mismo lado del muro, sin rozarlo
        const eye = p.clone().addScaledVector(d, D), side = new d.constructor().crossVectors(d, Y).normalize(), up = new d.constructor().crossVectors(side, d);
        if (!visibleFrom(eye, p)) continue;
        // El recorrido de la cámara tampoco debe atravesar nada: primero en línea recta; si algo estorba (la hoja
        // abierta), rodeándolo por fuera con una curva que se aleja hasta la distancia actual y vuelve a entrar.
        let via = null;
        if (!segClear(d0.pos, eye)) {
          const c = p.clone().addScaledVector(d, Math.max(3, d0.pos.distanceTo(p)) * 1.25);
          if (!curveClear(d0.pos, c, eye)) continue;
          via = c;
        }
        let score = 0;
        for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; if (visibleFrom(eye, p.clone().addScaledVector(side, 0.04 * Math.cos(a)).addScaledVector(up, 0.04 * Math.sin(a)))) score++; }
        const value = score - Math.abs(deg) / 30;                // girar cuesta: 30° equivalen a un punto menos visible
        if (value > best) { best = value; dir = d; route = via; }
      }
      // En celular la nota de la pieza tapa la parte baja del visor: la pieza se encuadra en la parte que queda libre.
      const vr = layer.getBoundingClientRect(), cr = card.hidden ? null : card.getBoundingClientRect();
      const covered = cr && cr.left < vr.left + vr.width / 2 && cr.right > vr.left + vr.width / 2 ? Math.max(0, vr.bottom - cr.top) : 0;
      const up = Y.clone().addScaledVector(dir, -dir.dot(Y)).normalize();
      const lift = (covered / 2) * ((2 * D * Math.tan(THREE_DEG * stage.camera.fov / 2)) / Math.max(1, vr.height));
      const at = p.clone().addScaledVector(up, -lift);
      viewer.views.__pieza = () => ({ pos: at.clone().addScaledVector(dir, D).toArray(), tgt: at.toArray() });
      rig.go('__pieza', route ? 1.3 : 0.9, { via: route }); follow = { it, last: p.clone() };
    };
    // La cámara acompaña a la pieza si esta se mueve (una hoja que abre o cierra) hasta que el usuario toma la cámara
    // o se elige otra vista.
    let follow = null; const q = stage.camera.position.clone();
    rig.onGo((name) => { if (name !== '__pieza') follow = null; });
    stage.controls.addEventListener('start', () => { follow = null; });
    stage.onFrame.add(() => {
      if (!follow) return;
      q.copy(follow.it.position); (follow.it.parent || stage.scene).localToWorld(q);
      const d = q.clone().sub(follow.last); if (d.lengthSq() < 1e-12) return;
      follow.last.copy(q); rig.shift(d);
    });
    const hs = createHotspots(stage, layer, items, (it, btn) => {
      hs.nodes.forEach((n) => n.b.setAttribute('aria-pressed', n.b === btn));
      card.hidden = false;
      const back = '<button type="button" class="link t-small hotcard__back">Ver toda la puerta</button>';
      card.innerHTML = it.piece ? `${partPicture(it.piece, { sizes: '84px' })}<div><b>${it.piece.nombre}</b><a class="link t-small" href="${url('componentes/')}?id=${it.piece.id}">Ver pieza en el catálogo</a>${back}</div>`
        : `<div><b>${it.label}</b><p class="t-small">${it.text}</p>${back}</div>`;
      card.querySelector('.hotcard__back').onclick = () => {
        hs.nodes.forEach((n) => n.b.setAttribute('aria-pressed', 'false')); card.hidden = true; rig.go(insideView(), 0.8); btn.focus();
      };
      macro(it);
    });
    insideBtn.onclick = () => {
      state.inside = !state.inside; door.classList.toggle('is-inside', state.inside); viewer.setInside(state.inside);
      layer.hidden = !state.inside; card.hidden = true; hs.nodes.forEach((n) => n.b.setAttribute('aria-pressed', 'false'));
      insideBtn.setAttribute('aria-pressed', state.inside); insideBtn.textContent = state.inside ? 'Volver al exterior' : 'Ver por dentro';
      motion.inside(state.inside); rig.go(state.inside ? insideView() : 'general');
      live.textContent = state.inside ? `Vista interior: ${items.length} ${items.some((x) => x.piece) ? 'piezas' : 'funciones'} señaladas` : 'Vista exterior';
      hint.classList.add('is-off');
    };

    // cómo cierra: cada bloque de texto fija una cámara y una posición de la puerta.
    // La línea de disparo va donde se está leyendo: a media pantalla cuando el texto corre junto al visor;
    // cuando el visor queda fijo arriba (móvil), en la franja de texto que se ve debajo de él.
    const blocks = $$('[data-view]'), sticky = $('.door__viewer'), col = $('.door__col');
    let currentBlock = null, io = null, timer = 0;
    const touching = new Set();                                   // bloques que tocan la línea de disparo ahora mismo
    // Un mismo aviso puede traer varios cambios juntos (desplazamiento rápido, equipo lento): entra un bloque, entra
    // otro y sale. Se aplican todos en orden y manda el estado final, no el último bloque que "entró" en la lista.
    const onBlock = (es) => {
      [...es].sort((a, b) => a.time - b.time).forEach((e) => (e.isIntersecting ? touching.add(e.target) : touching.delete(e.target)));
      const now = blocks.filter((b) => touching.has(b)).pop();    // si la línea toca dos bloques vecinos, el de más abajo
      if (!now || now === currentBlock) return; currentBlock = now;
      if (now !== blocks[0]) hint.classList.add('is-off');        // el aviso de arrastre solo acompaña a la vista inicial
      if (state.inside) return;                                   // en modo interior manda el usuario
      rig.go(now.dataset.view); motion.step(now.dataset);
    };
    const watch = () => {
      if (io) io.disconnect();
      touching.clear();
      const H = innerHeight, v = sticky.getBoundingClientRect(), stacked = col.getBoundingClientRect().left < v.right - 1;
      const below = (parseFloat(getComputedStyle(sticky).top) || 0) + v.height;      // borde inferior del visor fijo
      // sin pasar del primer bloque: al cargar la página manda la vista general
      const line = Math.round(stacked ? below + Math.min((H - below) * 0.75, blocks[0].offsetHeight * 0.85) : H * 0.5);
      io = new IntersectionObserver(onBlock, { rootMargin: `-${line - 1}px 0px -${H - line - 1}px 0px` });
      blocks.forEach((el) => io.observe(el));
    };
    watch(); addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(watch, 150); });
    // desde el catálogo: ?pieza=<id> entra a «Ver por dentro» con esa pieza señalada
    const want = new URLSearchParams(location.search).get('pieza');
    const node = want && hs.nodes.find((n) => n.it.piece && n.it.piece.id === want);
    if (node) { insideBtn.click(); node.b.click(); live.textContent = `Vista interior: ${node.it.piece.nombre}`; }
    window.__door = { stage, viewer, rig, motion, hinges: motion.hinges, hotspots: hs, Raycaster };   // para las pruebas
  } else noViewer();

  // ---------- piezas, ficha, cotizar ----------
  if ($('#parts')) {
    $('#partsLead').textContent = `${parts.length} piezas con fotografía en el catálogo.`;
    $('#partsAll').textContent = `Ver las ${parts.length}`; $('#partsAll').href = `${url('componentes/')}?fam=${familia}`;
    const featured = ($('#parts').dataset.featured || '').split(',').map((n) => parts.find((p) => p.numero === n || p.id === n)).filter(Boolean);   // por número o por id
    $('#parts').innerHTML = (featured.length ? featured : parts.slice(0, 12)).map((p) => `<a class="part" href="${url('componentes/')}?id=${p.id}">${partPicture(p)}<span class="part__t">${p.nombre}<small>${p.numero ? 'Pieza ' + p.numero : 'Sin número'}</small></span></a>`).join('');
    $('#specCount').textContent = parts.length;
  }
  const add = $('#addDoor');
  add.onclick = () => {
    const f = state.finish ? FINISH_LABEL[state.finish].toLowerCase() : state.option ? state.option.title || state.option.label : '';
    const key = state.finish || (state.option && state.option.id);
    solicitud.add({ id: `puerta-${familia}${key ? '-' + key : ''}`, nombre: `${nombre}${f ? ', ' + f : ''}`, tipo: 'Puerta' });
    add.textContent = 'Agregada a tu solicitud'; toast('Agregada a tu solicitud');
  };

  // subnavegación activa
  // (mismo criterio que los pasos: un aviso puede traer varios cambios; manda el estado final de cada sección)
  const links = $$('.subnav a'), sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean), inBand = new Set();
  const io2 = new IntersectionObserver((es) => {
    [...es].sort((a, b) => a.time - b.time).forEach((e) => (e.isIntersecting ? inBand.add(e.target) : inBand.delete(e.target)));
    const now = sections.filter((t) => inBand.has(t)).pop(); if (!now) return;
    links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + now.id));
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((t) => io2.observe(t));
  return { stage, viewer, rig };
}

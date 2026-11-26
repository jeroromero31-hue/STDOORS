// Lógica común de las páginas de puerta (abatible, corrediza, vaivén).
// El contenido vive en el HTML; aquí solo va el comportamiento.
import { Raycaster } from 'three';
import '../styles/door.css';
import { mountSite, solicitud, toast, url, createSheet, doorCards, DOORS } from './site.js';
import { partPicture } from './picture.js';
import { vano } from './vano.js';
import { frostLayer, preloadFrost } from '../home/frio.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry, FINISHES_BY_DOOR, FINISH_LABEL } from '../materials/FinishRegistry.js';
import { createCameraRig } from '../core/cameraRig.js';
import { hingeMotion } from '../core/hinge.js';
import { createHotspots } from '../core/hotspots.js';
import catalog from '../data/components.json';
import { splitLines, playLines } from './cine.js';
import { createThermal, THERMAL_STOPS } from '../core/thermal.js';
import { createXray } from '../core/xray.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function mountDoorPage({ familia, nombre, createViewer, poster, section = 'industriales', extend = null }) {
  document.body.dataset.door = familia;
  mountSite(section);
  // Fase 10I · cambiar de puerta sin pasar por el menú: el nombre de la puerta en la barra de secciones abre las cuatro
  // puertas; al final de la página, «Otras puertas»
  {
    const me = DOORS.find((d) => d.id === familia), nameEl = $('.subnav__name');
    if (me && nameEl) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'subnav__switch'; b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-label', `${nameEl.textContent}. Cambiar de puerta`);
      b.innerHTML = `${familia === 'cds' ? '' : '<span class="subnav__pre">Puerta </span>'}${familia === 'cds' ? me.nombre : me.nombre.toLowerCase()}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      nameEl.replaceWith(b);
      const sh = createSheet('Cambiar de puerta'); sh.meta.textContent = 'Cambiar de puerta'; sh.el.classList.add('sheet--doors');
      sh.body.innerHTML = doorCards(familia, { cls: 'dcards dcards--sheet' }) + `<p class="t-small" style="margin-top:16px"><a class="link" href="${url('industriales/')}">Comparar las puertas industriales</a></p>`;
      b.onclick = () => sh.open();
    }
    const main = $('main');
    if (main && me) main.insertAdjacentHTML('beforeend', `<section class="wrap door-more" aria-labelledby="doorMoreT"><h2 id="doorMoreT" class="t-h3">Otras puertas</h2>${doorCards(familia, { cls: 'dcards dcards--more', only: DOORS.filter((d) => d.id !== familia).map((d) => d.id) })}</section>`);
  }
  const door = $('.door'), viewerEl = $('#viewer');
  const parts = catalog.piezas.filter((p) => p.familias.includes(familia));

  // ---------- Fase 10E: cada paso va en una tarjeta (en computadora flotan sobre el escenario 3D) ----------
  const wide = matchMedia('(min-width: 901px)');
  $$('.door__hero, .door__step').forEach((sec) => { const c = document.createElement('div'); c.className = 'door__card'; c.append(...sec.childNodes); sec.append(c); });
  const reduceMo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const titles = $$('.door__step h2').map((h) => { splitLines(h); if (!reduceMo) h.classList.add('is-pre'); return h; });
  const h1 = $('.door__hero h1'); if (h1 && !reduceMo) { splitLines(h1); requestAnimationFrame(() => playLines(h1)); }

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

    // Fase 12 · sombreadores compilados en paralelo antes del primer cuadro (en los modelos que se descargan, al llegar)
    if (viewer.ready) viewer.ready.then(() => stage.precompile(), () => {}); else stage.precompile();
    // los modelos que se descargan avisan cuando están listos; si fallan, queda la imagen fija
    if (viewer.ready) {
      viewerEl.classList.add('is-loading');
      // Fase 10I · mientras baja el modelo: la foto de la puerta, difuminada, y una barra con el avance
      const ph = document.createElement('div'); ph.className = 'viewer__ph'; ph.setAttribute('aria-hidden', 'true');
      ph.innerHTML = `<img src="${url(poster)}" alt="" decoding="async"><span class="viewer__load"><span>Cargando la puerta en 3D</span><i><b></b></i></span>`;
      viewerEl.append(ph);
      const onP = (e) => ph.style.setProperty('--k', Math.max(0, Math.min(1, +e.detail || 0)).toFixed(3));
      addEventListener('st:model-progress', onP);
      const done = () => { removeEventListener('st:model-progress', onP); ph.style.setProperty('--k', 1); ph.classList.add('is-done'); setTimeout(() => ph.remove(), 900); };
      viewer.ready.then(done, done);
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

    // encuadre en lo que dejan libre las tarjetas (computadora)
    const holder = $('.door__viewer');
    // Fase 10I · en un plegable abierto en dos pantallas, la puerta queda entera en la de la derecha (más allá de la bisagra)
    const spanQ = matchMedia('(horizontal-viewport-segments: 2)');
    const probe = document.createElement('i'); probe.style.cssText = 'position:fixed;left:0;top:0;width:env(viewport-segment-left 1 0, 0px);height:0;visibility:hidden;pointer-events:none';
    document.body.append(probe);
    const fitInset = () => {
      if (!wide.matches && !spanQ.matches) { stage.setInset(0); holder.style.setProperty('--free', '0px'); return; }
      const v = viewerEl.getBoundingClientRect(), right = spanQ.matches ? probe.getBoundingClientRect().width - 28 : Math.max(0, ...$$('.door__card').map((c) => c.getBoundingClientRect().right));
      const px = Math.max(0, right - v.left + 28); stage.setInset(Math.min(spanQ.matches ? 0.6 : 0.5, px / Math.max(1, v.width))); holder.style.setProperty('--free', `${Math.round(px)}px`);
    };
    spanQ.addEventListener('change', fitInset);
    fitInset(); new ResizeObserver(fitInset).observe(viewerEl);
    // lectura en vivo: apertura de la hoja en grados (o recorrido, en la corrediza)
    const ro = document.createElement('p'); ro.className = 'readout'; ro.setAttribute('aria-hidden', 'true');
    ro.innerHTML = '<span></span><b></b>'; holder.append(ro);
    const [roL, roV] = [ro.querySelector('span'), ro.querySelector('b')]; let roLast = '';
    // Fase 11C · si la puerta se queda abierta, el frío se escapa: las orillas de la pantalla se escarchan poco a poco;
    // al cerrarla se derrite. Tu dedo también la derrite.
    const fl = frostLayer({ tip: 'La puerta abierta deja salir el frío. Ciérrala, o derrite la escarcha con el dedo.' });
    let flT = performance.now(), flAcc = 0, flOpen = 0;
    stage.onFrame.add(() => {
      const now = performance.now(), dt = Math.min(0.5, (now - flT) / 1000); flT = now;
      const isOpen = motion.hinges && motion.hinges.length ? motion.hinges.some((h) => Math.abs(h.angle) > 20) : state.open;
      flOpen = isOpen ? (flOpen || now) : 0;                       // solo si se QUEDA abierta (más de 2 s)
      if (isOpen) preloadFrost();                                 // su textura se pide al abrir (llega antes de los 2 s)
      flAcc = Math.min(0.7, Math.max(0, flAcc + (isOpen && now - flOpen > 2000 ? dt / 14 : -dt / 2.5)));
      if (flAcc !== fl.level) fl.set(flAcc);
    });
    stage.onFrame.add(() => {
      const r = viewer.readout ? viewer.readout() : (motion.hinges && motion.hinges.length ? { label: 'Apertura de hoja', value: `${Math.round(Math.max(...motion.hinges.map((h) => Math.abs(h.angle))))}°`, on: motion.hinges.some((h) => Math.abs(h.angle) > 0.5) } : null);
      if (!r) return;
      const key = r.label + r.value + r.on; if (key === roLast) return; roLast = key;
      roL.textContent = r.label; roV.textContent = r.value; ro.classList.toggle('is-on', !!r.on);
    });

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
      // Fase 11 · el acabado es uno para todo el sitio: el de la URL, o el que elegiste en la ruta del Inicio o en Cotizar
      const qa = new URLSearchParams(location.search).get('acabado'), va = (vano.get() || {}).acabado;
      setFinish(qa in cls ? qa : (va in cls && (!vano.get().fam || vano.get().fam === familia) ? va : viewer.finish));
      $$('.swatch', sw).forEach((b) => b.addEventListener('click', () => vano.set({ acabado: b.dataset.f, fam: familia }, 'puerta')));
      // si el acabado se cambia en «A tu medida» (abajo), la puerta 3D también cambia
      addEventListener('st:vano', (e) => { const a = vano.get().acabado; if (e.detail?.__from !== 'puerta' && a in cls && a !== state.finish) setFinish(a); });
    } else if (viewer.options) {
      const o = viewer.options;
      sw.classList.add('chips'); sw.setAttribute('aria-label', o.label);
      sw.innerHTML = o.items.map((it) => `<button class="chip" data-o="${it.id}" aria-pressed="false" title="${it.title || it.label}">${it.label}</button>`).join('');
      const pick = (id) => { o.set(id); keep('modelo', id); state.option = o.items.find((x) => x.id === id); fin.textContent = state.option.detail || ''; $$('.chip', sw).forEach((b) => b.setAttribute('aria-pressed', b.dataset.o === id)); const n = $('.thermo__note'); if (n && viewer.thermal && viewer.thermal.note) n.textContent = viewer.thermal.note(); door.dispatchEvent(new CustomEvent('door:option', { detail: { id } })); };
      $$('.chip', sw).forEach((b) => { b.onclick = () => { if (state.option && b.dataset.o === state.option.id) return; crossfade(() => pick(b.dataset.o)); live.textContent = state.option.title || state.option.label; }; });
      const q = new URLSearchParams(location.search).get('modelo'); pick(o.items.some((x) => x.id === q) ? q : o.current());
    } else { sw.remove(); fin.textContent = 'Un acabado'; }

    // ver por dentro: fondo azul marino y puntos de pieza
    const layer = $('#hotspots'), card = $('#hotcard');
    // cada ancla señala una pieza del catálogo: por número o, si no lo tiene, por su id interno
    // (o, si trae texto propio, una función del producto: se muestra como nota, sin foto)
    const items = viewer.anchors.map((a) => { if (a.text) return a; const p = parts.find((x) => (a.id ? x.id === a.id : x.numero === a.numero)); return p && { ...a, src: a, piece: p, label: p.nombre }; }).filter(Boolean);
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
        // si algo se llevó el foco mientras la nota se cerraba, vuelve al punto (para el teclado y los lectores de pantalla)
        requestAnimationFrame(() => { if ((document.activeElement === document.body || !document.activeElement) && btn.style.display !== 'none') btn.focus(); });
      };
      macro(it);
    });
    // ---------- Fase 10E · opciones del modelo (bumper de la vaivén: 150, 500 o 1000 mm) ----------
    // Botones junto a los acabados y, repetidos, en el paso que explica esa pieza. Al elegir, la pieza cambia en el 3D
    // con una cota en milímetros, el punto de pieza pasa al número de catálogo de esa medida y queda en la URL.
    state.cfg = {};
    const refreshPieces = () => hs.nodes.forEach(({ it, b }) => {
      if (!it.src || it.src.numero === it.numero) return;
      const p = parts.find((x) => x.numero === it.src.numero); if (!p) return;
      it.numero = it.src.numero; it.piece = p; it.label = p.nombre; b.setAttribute('aria-label', p.nombre);
    });
    const holderEl = $('.door__viewer'), svgNS = 'http://www.w3.org/2000/svg';
    let cota = null, cotaUntil = 0;
    if (viewer.measure) {
      cota = document.createElementNS(svgNS, 'svg'); cota.setAttribute('class', 'cota'); cota.setAttribute('aria-hidden', 'true');
      cota.innerHTML = '<polygon class="cota__band"/><polygon class="cota__band"/><line class="cota__l"/><line class="cota__t"/><line class="cota__b"/><g class="cota__tag"><rect rx="4"/><text/></g>';
      holderEl.append(cota);
      const [ln, t1, t2] = cota.querySelectorAll('line'), bands = cota.querySelectorAll('polygon'), tag = cota.querySelector('.cota__tag'), txt = tag.querySelector('text'), rect = tag.querySelector('rect');
      const P = (v) => { const q = v.clone().project(stage.camera); return [(q.x + 1) / 2 * holderEl.clientWidth, (1 - q.y) / 2 * holderEl.clientHeight]; };
      stage.afterFrame.add(() => {                                               // con la cámara de este cuadro, ya movida
        const on = !door.classList.contains('is-thermal') && (performance.now() < cotaUntil || (rig.current && (viewer.configs || []).some((c) => c.view === rig.current)));
        cota.classList.toggle('is-on', !!on); if (!on) return;
        const m = viewer.measure(); if (!m) return;
        const [ax, ay] = P(m.a), [bx, by] = P(m.b), x = Math.min(ax, bx) - 28;
        const set = (el, a) => Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v.toFixed ? v.toFixed(1) : v));
        set(ln, { x1: x, y1: ay, x2: x, y2: by }); set(t1, { x1: x - 7, y1: ay, x2: Math.min(ax, bx) - 6, y2: ay }); set(t2, { x1: x - 7, y1: by, x2: Math.min(ax, bx) - 6, y2: by });
        if (txt.textContent !== m.label) txt.textContent = m.label;
        const w = m.label.length * 8.2 + 16, tx = x - w - 8 < 6 ? x + 8 : x - w - 8;          // en móvil la etiqueta pasa al otro lado
        set(rect, { x: tx, y: (ay + by) / 2 - 14, width: w, height: 28 }); set(txt, { x: tx + w / 2, y: (ay + by) / 2 + 5 });
        (m.quads || []).forEach((q, i) => bands[i] && bands[i].setAttribute('points', q.map((v) => P(v).map((n) => n.toFixed(1)).join(',')).join(' ')));
      });
    }
    (viewer.configs || []).forEach((cfg) => {
      const chips = `<div class="door__opt" data-k="${cfg.key}"><span class="t-small door__opt-l">${cfg.label}</span><div class="chips" role="group" aria-label="${cfg.label}">${cfg.items.map((it) => `<button class="chip" data-k="${cfg.key}" data-v="${it.id}" aria-pressed="false">${it.label}</button>`).join('')}</div></div>`;
      $('.door__ctl').insertAdjacentHTML('beforeend', chips);
      const stepCard = $$('[data-view]').find((b) => b.dataset.view === cfg.view && b.classList.contains('door__step'));
      if (stepCard) stepCard.querySelector('.door__card').insertAdjacentHTML('beforeend', chips);
      const pick = (id, user) => {
        cfg.set(id); state.cfg[cfg.key] = cfg.items.find((x) => x.id === id); keep(cfg.key, id);
        $$(`.chip[data-k="${cfg.key}"]`).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === id));
        refreshPieces();
        if (user) { live.textContent = state.cfg[cfg.key].detail; cotaUntil = performance.now() + 4500; if (cfg.view && !state.inside) setTimeout(() => rig.go(cfg.view, 1.1), 60); }   // reencuadra a la nueva medida
      };
      $$(`.chip[data-k="${cfg.key}"]`).forEach((b) => { b.onclick = () => pick(b.dataset.v, true); });
      const q0 = new URLSearchParams(location.search).get(cfg.key);
      pick(cfg.items.some((x) => x.id === q0) ? q0 : cfg.current(), false);
    });

    // ---------- Fase 10E · «Ver el frío»: vista térmica ilustrativa ----------
    // Un botón junto a «Ver por dentro» y un paso propio en el recorrido (data-termica): al llegar a él la escena se
    // vuelve térmica sola y al salir regresa; si la persona la encendió con el botón, se queda hasta que la apague.
    let thermal = null, coldAuto = false, coldBtn = null;
    let xray = null, xrayBtn = null;
    // barrido de escáner al cambiar de vista: la imagen anterior se retira de arriba abajo
    const scanSwap = () => {
      const c = stage.renderer.domElement, holder = $('.door__viewer');
      if (reduceMo || !c.width) return;
      stage.renderer.render(stage.scene, stage.camera);
      const ov = document.createElement('canvas'); ov.className = 'viewer__scan'; ov.width = c.width; ov.height = c.height; ov.setAttribute('aria-hidden', 'true');
      ov.getContext('2d').drawImage(c, 0, 0); c.after(ov);
      const ln = document.createElement('i'); ln.className = 'viewer__scanline'; ln.setAttribute('aria-hidden', 'true'); holder.append(ln);
      setTimeout(() => { ov.remove(); ln.remove(); }, 1000);
    };
    // Fase 10F · «Rayos X»: la puerta transparente, con sus piezas de adentro a la vista
    const setXray = (on) => {
      if (!xray || on === xray.on) return;
      if (on && thermal && thermal.on) setCold(false);
      scanSwap(); xray.set(on); door.classList.toggle('is-xray', on);
      xrayBtn.setAttribute('aria-pressed', on);
      live.textContent = on ? 'Rayos X: se ven las piezas de adentro de la puerta' : 'Vista normal';
    };
    const setCold = (on, auto = false) => {
      if (!thermal || on === thermal.on) { coldAuto = on && auto && coldAuto; return; }
      if (on && xray && xray.on) setXray(false);
      scanSwap();
      thermal.set(on); coldAuto = on && auto;
      door.classList.toggle('is-thermal', on);
      coldBtn.setAttribute('aria-pressed', on);
      live.textContent = on ? 'Vista térmica: el azul es frío. Abre la puerta y mira cómo sale el aire frío.' : 'Vista normal';
      noteCold();
    };
    // nota de la escala (CDS: aplicación del modelo elegido)
    const noteCold = () => { const n = $('.thermo__note'); if (n && viewer.thermal && viewer.thermal.note) n.textContent = viewer.thermal.note(); };
    if (viewer.thermal) {
      thermal = createThermal(stage, viewer.thermal);
      // vistas especiales: dos botones pequeños juntos (uno a la vez)
      insideBtn.insertAdjacentHTML('afterend', '<div class="door__views chips" role="group" aria-label="Vistas especiales"><button class="chip" id="coldBtn" aria-pressed="false" data-cur="Térmica">Ver el frío</button></div>');
      coldBtn = $('#coldBtn');
      xray = createXray(stage);
      coldBtn.insertAdjacentHTML('afterend', '<button class="chip" id="xrayBtn" aria-pressed="false" data-cur="Rayos X">Rayos X</button>');
      xrayBtn = $('#xrayBtn'); xrayBtn.onclick = () => { setXray(!xray.on); hint.classList.add('is-off'); };
      // Fase 10J · la puerta en tu espacio, con la cámara y a la medida de tu vano (si ya la escribiste)
      xrayBtn.insertAdjacentHTML('afterend', '<button class="chip chip--ar" id="arBtn" data-cur="Cámara"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V4h3M14 4h3v3M17 13v3h-3M6 16H3v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 6l4 2.2v4.6L10 15l-4-2.2V8.2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>En tu espacio</button>');
      $('#arBtn').dataset.warm = familia;
      $('#arBtn').onclick = () => Promise.all([import('./ar.js'), import('./vano.js')]).then(([{ openAR }, { vano }]) => {
        const v = vano.get(); openAR(familia, familia === 'cds' ? (v.cds || {}) : { ancho: v.ancho, alto: v.alto, acabado: state.finish });
      }).catch(() => toast('No se pudo abrir la vista con cámara'));
      coldBtn.onclick = () => {
        const on = !thermal.on; setCold(on, false); hint.classList.add('is-off');
        if (on && !state.inside) {
          if (viewer.views && viewer.views.frio) rig.go('frio', 1.2);                     // el hueco y el piso de enfrente, donde cae el frío
          if (!state.open) setTimeout(() => { if (thermal.on && !state.open) openBtn.click(); }, 700);   // para ver salir el frío
        }
      };
      const scale = `linear-gradient(90deg, ${THERMAL_STOPS.join(', ')})`;
      // escala delgada pegada al borde de abajo: no tapa la puerta
      $('.door__viewer').insertAdjacentHTML('beforeend', `<div class="thermo" aria-hidden="true"><span class="thermo__l"><span>Frío</span>${viewer.thermal.note ? '<span class="thermo__note"></span>' : '<b>Vista térmica ilustrativa</b>'}<span>Ambiente</span></span><span class="thermo__bar" style="background:${scale}"></span></div>`);
    } else $$('[data-termica]').forEach((el) => el.remove());

    // ---------- Fase 10F · despiece de la bisagra (abatible): las piezas se separan al llegar al paso y se arman al salir ----------
    let exTimer = 0, exOn = false;
    const setExplode = (on) => {
      if (!viewer.explode || on === exOn) return; exOn = on; viewer.explode(on);
      $$('[data-despiece-btn]').forEach((b) => { b.textContent = on ? 'Armar' : 'Separar piezas'; b.setAttribute('aria-pressed', on); });
      live.textContent = on ? 'Bisagra separada en sus piezas' : 'Bisagra armada';
    };
    $$('[data-despiece-btn]').forEach((b) => { b.textContent = 'Separar piezas'; b.onclick = () => { clearTimeout(exTimer); setExplode(!exOn); }; });

    // extensiones propias de una página (CDS: prueba de humedad, luces KeyLED)
    if (extend) extend({ viewer, stage, rig, motion, state, live, door, noteCold });

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
    // En pantallas altas (tablet, plegable abierto) el paso 1 ya toca la línea al cargar: mientras la página no se
    // haya desplazado manda la vista general, y al empezar a bajar se vuelve a evaluar.
    const evaluate = () => {
      const now = scrollY < 8 ? blocks[0] : blocks.filter((b) => touching.has(b)).pop();   // si la línea toca dos bloques vecinos, el de más abajo
      if (!now || now === currentBlock) return; currentBlock = now;
      blocks.forEach((b) => b.classList.toggle('is-current', b === now));
      const t = now.querySelector('h2'); if (t && !reduceMo) playLines(t);
      if (now !== blocks[0]) hint.classList.add('is-off');        // el aviso de arrastre solo acompaña a la vista inicial
      if (thermal) { if (now.dataset.termica) { if (!thermal.on) setCold(true, true); } else if (coldAuto) setCold(false); }
      if (viewer.explode) { clearTimeout(exTimer); if (now.dataset.despiece) exTimer = setTimeout(() => setExplode(true), 700); else setExplode(false); }
      door.dispatchEvent(new CustomEvent('door:step', { detail: { block: now } }));      // para las extensiones de cada página
      if (state.inside) return;                                   // en modo interior manda el usuario
      rig.go(now.dataset.view); motion.step(now.dataset);
    };
    const onBlock = (es) => {
      [...es].sort((a, b) => a.time - b.time).forEach((e) => (e.isIntersecting ? touching.add(e.target) : touching.delete(e.target)));
      evaluate();
    };
    let pend = false;
    addEventListener('scroll', () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; evaluate(); }); }, { passive: true });
    const watch = () => {
      if (io) io.disconnect();
      touching.clear();
      const H = innerHeight, v = sticky.getBoundingClientRect(), stacked = !wide.matches;   // visor arriba y texto abajo (celular)
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
  // Fase 10J · cotizar a la medida desde la misma página: medida del vano, plano a escala, cámara y WhatsApp
  const vanoHost = $('#cotizar .wrap');
  if (vanoHost) {
    const box = document.createElement('div'); box.className = 'vano--door';
    $('#addDoor').closest('.row').replaceWith(box);
    import('./vano.js').then(({ mountVano }) => mountVano(box, {
      fam: familia,
      addItem: () => {
        const f = state.finish ? FINISH_LABEL[state.finish].toLowerCase() : state.option ? state.option.title || state.option.label : '';
        const key = state.finish || (state.option && state.option.id);
        const cfg = Object.entries(state.cfg || {});
        const cfgId = cfg.map(([k, v]) => `-${k}${v.id}`).join(''), cfgName = cfg.map(([, v]) => `, ${v.detail.toLowerCase()}`).join('');
        return { id: `puerta-${familia}${key ? '-' + key : ''}${cfgId}`, nombre: `${nombre}${f ? ', ' + f : ''}${cfgName}`, tipo: 'Puerta', ...(familia === 'cds' && state.option ? { cfg: { modelo: state.option.id } } : {}) };
      },
    })).catch((e) => console.error(e));
    // celular: botón fijo abajo hasta llegar a la sección de cotizar
    const bar = document.createElement('div'); bar.className = 'cta-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cotizar');
    bar.innerHTML = `<a class="btn" href="#cotizar">${familia === 'cds' ? 'Cotizar el juego' : 'Cotizar a la medida'}</a>${$('#arBtn') ? `<button type="button" class="cta-bar__ar" aria-label="Verla en tu espacio con la cámara"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V4h3M14 4h3v3M17 13v3h-3M6 16H3v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 6l4 2.2v4.6L10 15l-4-2.2V8.2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>` : ''}`;
    document.body.append(bar);
    const barAr = bar.querySelector('.cta-bar__ar'); if (barAr) barAr.onclick = () => $('#arBtn').click();
    bar.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); $('#cotizar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); setTimeout(() => $('#cotizar input, #cotizar .chip')?.focus({ preventScroll: true }), 700); });
    const showBar = () => bar.classList.toggle('is-on', scrollY > innerHeight * 0.6);
    new IntersectionObserver(([e]) => bar.classList.toggle('is-away', e.isIntersecting), { threshold: 0.05 }).observe($('#cotizar'));
    addEventListener('scroll', showBar, { passive: true }); showBar();
  }
  // Fase 10J · ¿se descompuso una pieza? encontrarla tocando la puerta
  const partsEl = $('#parts');
  if (partsEl && familia !== 'cds') partsEl.insertAdjacentHTML('afterend', `<a class="find-cta" href="${url('componentes/')}?puerta=${familia}#encuentra"><span class="find-cta__dot" aria-hidden="true"></span><span><b>¿Se descompuso una pieza y no sabes cómo se llama?</b><span>Toca la zona de la puerta donde está y te mostramos cuál es.</span></span></a>`);
  const add = $('#addDoor') || document.createElement('button');
  add.onclick = () => {
    const f = state.finish ? FINISH_LABEL[state.finish].toLowerCase() : state.option ? state.option.title || state.option.label : '';
    const key = state.finish || (state.option && state.option.id);
    const cfg = Object.entries(state.cfg || {});            // opciones del modelo (bumper)
    const cfgId = cfg.map(([k, v]) => `-${k}${v.id}`).join(''), cfgName = cfg.map(([, v]) => `, ${v.detail.toLowerCase()}`).join('');
    solicitud.add({ id: `puerta-${familia}${key ? '-' + key : ''}${cfgId}`, nombre: `${nombre}${f ? ', ' + f : ''}${cfgName}`, tipo: 'Puerta' });
    add.textContent = 'Agregada a tu solicitud';
    toast(familia === 'cds' ? 'Agregada. En Cotizar eliges cuántas puertas lleva el juego' : 'Agregada. En Cotizar escribes la medida de tu vano');
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

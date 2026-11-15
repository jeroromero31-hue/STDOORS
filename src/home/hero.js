// Entrada del Inicio: la puerta vaivén en 3D a pantalla completa. Al bajar, las hojas abren hacia adentro, el vaho
// de la cámara se asoma por el vano, unas etiquetas señalan piezas reales del catálogo y la cámara cruza la puerta
// hasta el interior azul marino, donde sigue la página. "Blanco es afuera, azul marino es adentro".
// Usa el modelo aprobado tal cual (src/viewers/vaiven.js): aquí solo se mueven la cámara y el ángulo de las hojas.
import * as THREE from 'three';
import { createStage } from '../core/stage.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { createVaiven } from '../viewers/vaiven.js';
import { createVapor } from './vapor.js';
import { track, seg, easeInOut, easeOut, reducedMotion, clamp01 } from './scrub.js';
import catalog from '../data/components.json';

const MAX = 63.03;                       // apertura del modelo original (VAIVEN.openAngle)
const C = new THREE.Vector3(0, 1.27, 0); // centro del marco
const SIZE = 2.72;                       // ancho y alto del marco con holgura (m)

// Piezas señaladas: número de catálogo de la vaivén y de qué lado va su etiqueta
const TAGS = [{ numero: '03', side: -1 }, { numero: '02', side: 1 }, { numero: '06', side: -1 }];
const nombre = (n) => (catalog.piezas.find((p) => p.numero === n && p.familias.includes('vaiven')) || {}).nombre || '';

export function mountHero({ section, gl, hud, readout, load, onFail }) {
  const stage = createStage(gl, { fov: 30 });
  if (!stage) { onFail('sin-webgl'); return null; }
  const { camera, controls, canvas } = stage;
  controls.enabled = false;                                // aquí la cámara la mueve el scroll, no el puntero
  canvas.removeAttribute('tabindex'); canvas.style.pointerEvents = 'none';

  const reg = createFinishRegistry(stage.renderer); reg.setQuality(stage.quality);
  stage.onQuality.add((q) => reg.setQuality(q));
  const viewer = createVaiven(stage, reg, { onProgress: (k) => load.set(k) });
  viewer.setFinish('stainless');
  const [hl, hr] = viewer.hinges;
  // menos partículas en equipos modestos: el vaho es lo que más pinta por cuadro
  const vapor = reducedMotion() ? null : createVapor(stage, { count: stage.quality === 'baja' ? 70 : 140 });

  // ---------- etiquetas de piezas ----------
  const anchors = TAGS.map((t) => ({ ...t, a: viewer.anchors.find((a) => a.numero === t.numero) })).filter((t) => t.a);
  // en pantallas angostas la etiqueta sobre la pieza lleva solo el número y los nombres van en una leyenda abajo,
  // como en un plano; en las anchas, número y nombre junto a la pieza
  hud.innerHTML = anchors.map((t) => `<div class="hx__tag" data-side="${t.side < 0 ? 'l' : 'r'}"><span class="hx__dot"></span><span class="hx__wire"></span><span class="hx__label"><b>${t.numero}</b><span>${nombre(t.numero)}</span></span></div>`).join('')
    + `<ol class="hx__legend">${anchors.map((t) => `<li><b>${t.numero}</b>${nombre(t.numero)}</li>`).join('')}</ol>`;
  const tagEls = [...hud.querySelectorAll('.hx__tag')];
  const v = new THREE.Vector3();

  // ---------- recorrido de cámara ----------
  const tmp = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };
  const look = (yaw, elev, dist, ox, oy) => {
    // ox, oy: dónde queda el centro de la puerta en pantalla (−1…1); la cámara mira a un punto corrido para lograrlo
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), hh = dist * t, hw = hh * camera.aspect;
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const tgt = C.clone().addScaledVector(right, -ox * hw).add(new THREE.Vector3(0, -oy * hh, 0));
    const pos = tgt.clone().add(new THREE.Vector3(Math.sin(yaw) * Math.cos(elev), Math.sin(elev), Math.cos(yaw) * Math.cos(elev)).multiplyScalar(dist));
    return { pos, tgt };
  };
  // Dos composiciones, las mismas que el CSS: «al lado» (título a la izquierda, puerta a la derecha) y «apilada»
  // (título arriba, puerta abajo). Al lado, la puerta se encaja en lo que deja libre el texto, a cualquier proporción.
  const sideQ = matchMedia('(min-aspect-ratio: 9/8) and (min-width: 700px)');
  // lo que ocupa el texto, en coordenadas de pantalla (−1…1): borde derecho (al lado), y en apilada el pie del
  // texto de arriba y el borde de arriba de los botones de abajo
  let edge = -0.2, textBottom = 0.3, ctaTop = -0.8;
  const measure = () => {
    const r = gl.getBoundingClientRect(); if (!r.width) return;
    const rect = (sel) => [...section.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());
    const ndcY = (y) => 1 - ((y - r.top) / r.height) * 2;
    edge = ((Math.max(...rect('.hx__copy h1, .hx__lead, .hx__cta > *').map((x) => x.right)) - r.left) / r.width) * 2 - 1;
    textBottom = ndcY(Math.max(...rect('.hx__copy h1, .hx__lead').map((x) => x.bottom)));
    ctaTop = ndcY(Math.min(...rect('.hx__cta > *').map((x) => x.top)));
  };
  measure(); addEventListener('resize', measure); if (document.fonts) document.fonts.ready.then(measure);
  const poses = (a) => {
    const fit = (m) => stage.fitDistance(SIZE, SIZE, m);
    const nav = 69 / Math.max(1, gl.clientHeight);         // el menú tapa la franja de arriba: se centra en lo que queda
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let A, B;
    if (sideQ.matches) {
      // A: vista un poco desde la izquierda y desde arriba (se ve el piso y la sombra), a la derecha del texto
      const left = Math.min(0.2, edge + 0.1), right = 0.94, hw = (right - left) / 2;
      A = look(-0.34, 0.07, Math.max((SIZE / 2) / (hw * t * a), fit(1.16)), (left + right) / 2, -0.9 * nav);
      B = look(0, 0.02, fit(1.08), 0, -nav);
    } else {
      // A: entre el texto de arriba y los botones de abajo, sin pasar del 92 % del ancho
      const top = textBottom - 0.06, bottom = ctaTop + 0.05, hh = Math.max(0.2, (top - bottom) / 2);
      A = look(-0.3, 0.07, Math.max((SIZE / 2) / (hh * t), (SIZE / 2) / (0.92 * t * a)), 0, (top + bottom) / 2);
      B = look(0, 0.02, fit(1.12), 0, -nav);
    }
    return [A, B,      // C: en el umbral
      { pos: new THREE.Vector3(0, 1.48, 0.95), tgt: new THREE.Vector3(0, 1.42, -3) },
      // D: adentro; solo se ve el azul marino del interior
      { pos: new THREE.Vector3(0, 1.46, -1.05), tgt: new THREE.Vector3(0, 1.44, -5) },
    ];
  };
  const mix = (a, b, k) => { tmp.pos.lerpVectors(a.pos, b.pos, k); tmp.tgt.lerpVectors(a.tgt, b.tgt, k); return tmp; };

  // puntero: la puerta se mueve apenas con el ratón (no en pantallas táctiles)
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  if (matchMedia('(pointer: fine)').matches && !reducedMotion()) addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; stage.invalidate(30); }, { passive: true });

  let p = 0, intro = reducedMotion() ? 1 : 0, ready = false;
  const set = (o, k) => { o.style.opacity = k; o.style.visibility = k > 0.001 ? 'visible' : 'hidden'; };
  stage.onFrame.add((dt) => {
    if (!ready) return;
    if (intro < 1) { intro = Math.min(1, intro + dt / 1.8); stage.invalidate(2); }
    // hojas: abren hacia adentro (ángulo negativo); la derecha arranca un poco después, como en la página de la vaivén
    const aL = -MAX * easeInOut(seg(p, 0.1, 0.46)), aR = -MAX * easeInOut(seg(p, 0.15, 0.5));
    hl.jump(aL); hr.jump(aR);
    if (vapor) vapor.set(0.25 * seg(p, 0.08, 0.2) + 0.75 * seg(p, 0.2, 0.55));

    // cámara
    const P = poses(camera.aspect);
    const cam = p < 0.3 ? mix(P[0], P[1], easeInOut(seg(p, 0, 0.3))) : p < 0.62 ? mix(P[1], P[2], easeInOut(seg(p, 0.3, 0.62))) : mix(P[2], P[3], easeInOut(seg(p, 0.62, 0.9)));
    const back = 1 + 0.22 * (1 - easeOut(intro));                        // al aparecer, la cámara se acerca un poco
    camera.position.copy(cam.tgt).addScaledVector(cam.pos.clone().sub(cam.tgt), back);
    ptr.sx += (ptr.x - ptr.sx) * (1 - Math.exp(-dt * 3)); ptr.sy += (ptr.y - ptr.sy) * (1 - Math.exp(-dt * 3));
    const free = 1 - seg(p, 0, 0.3);
    camera.position.x += ptr.sx * 0.22 * free; camera.position.y -= ptr.sy * 0.1 * free;
    controls.target.copy(cam.tgt); camera.lookAt(cam.tgt);
    camera.updateMatrixWorld(); stage.scene.updateMatrixWorld();

    // etiquetas: siguen a su pieza sobre la hoja que gira
    const k = reducedMotion() ? 1 : seg(p, 0.05, 0.11) * (1 - seg(p, 0.42, 0.5));
    set(hud, k * intro);
    if (k > 0) {
      const W = gl.clientWidth, H = gl.clientHeight;
      anchors.forEach((t, i) => {
        v.copy(t.a.position); t.a.parent.localToWorld(v); v.project(camera);
        const el = tagEls[i], x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
        // lado de la etiqueta: el preferido si cabe en la pantalla; si no, el otro
        const lw = (t.w ||= el.querySelector('.hx__label').offsetWidth) + 60;
        const side = t.side < 0 ? (x - lw > 8 ? 'l' : 'r') : (x + lw < W - 8 ? 'r' : 'l');
        if (el.dataset.side !== side) el.dataset.side = side;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.hidden = v.z > 1 || x < 8 || x > W - 8 || y < 8 || y > H - 8;
      });
    }
    readout.value.textContent = `${Math.round(-aL)}°`;
    set(readout.el, seg(p, 0.08, 0.14) * (1 - seg(p, 0.4, 0.46)));   // se va antes de entrar al azul marino
  });

  viewer.ready.then(() => {
    ready = true; load.done(); stage.invalidate(60);
    gl.classList.add('is-ready');
  }, (err) => { console.error(err); stage.renderer.setAnimationLoop(null); onFail('modelo'); });

  // el avance del scroll mueve todo; cuando la sección está quieta, la escena deja de dibujarse (stage.js)
  // Con «movimiento reducido» la puerta se queda cerrada y quieta, con sus etiquetas.
  if (!reducedMotion()) track(section, (k) => { p = k; stage.invalidate(2); }, { mode: 'pin', smooth: 6 });
  window.__hero = { stage, viewer, get p() { return p; } };      // para las pruebas
  return { stage, viewer };
}

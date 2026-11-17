// Escenario 3D común: renderer, entorno de estudio, cámara, controles, calidad adaptativa y respaldo sin WebGL.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const QUALITY = {
  alta: { pixelRatio: 2, minPixelRatio: 1.5, shadows: true, shadowMap: 2048 },   // en pantallas de densidad 1 se dibuja a 1.5×: los cantos finos dejan de verse a trazos
  // Fase 10I · en celular ya no se baja tanto: «media» dibuja a 2× (las pantallas de teléfono son de 2× o 3×) y «baja»
  // a 1.5× en vez de 1×; con la escena quieta se dibuja un cuadro más nítido (ver «nitidez en reposo»)
  media: { pixelRatio: 2, minPixelRatio: 1.25, shadows: true, shadowMap: 1024 },
  baja: { pixelRatio: 1.5, shadows: false, shadowMap: 512 },
};

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function guessQuality() {
  const q = new URLSearchParams(location.search).get('calidad');
  if (QUALITY[q]) return q;
  // Fase 10I · Safari no informa la memoria y en iPhone reporta pocos núcleos: eso ya no manda un teléfono capaz a «baja».
  // Solo baja de entrada con memoria informada de 2 GB o menos; si luego no va fluido, la calidad adaptativa baja un nivel.
  const coarse = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if (mem <= 2) return 'baja';
  if (coarse) return 'media';
  return mem <= 3 || cores <= 4 ? 'media' : 'alta';
}

// Entorno de estudio propio: sala gris clara y neutra (sin tinte) con bandas de luz largas (dan lectura al metal cepillado).
export function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: 0xc4c4c4, side: THREE.BackSide }));
  room.position.y = 4; scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0x8e8e8e }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.99; scene.add(floor);
  const panel = (w, h, x, y, z, ry, rx, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity) }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m);
  };
  panel(16, 3, 0, 8.9, 2, 0, Math.PI / 2, 5.0);                              // banda cenital
  for (const x of [-7, -2.4, 2.4, 7]) panel(2.0, 7.5, x, 3.6, 9.9, Math.PI, 0, 4.2);   // tiras verticales frente a la puerta
  panel(2.4, 7.5, -9.9, 3.6, 4.5, Math.PI / 2, 0, 3.4);                     // tira lateral izquierda
  panel(2.4, 7.5, 9.9, 3.6, 4.5, -Math.PI / 2, 0, 3.4);                     // tira lateral derecha
  panel(12, 3, 0, 4, -9.9, 0, 0, 1.4);                                      // fondo
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose(); scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return env;
}

export function createStage(container, { quality = guessQuality(), fov = 32, fallback } = {}) {
  if (!webglAvailable()) {
    container.innerHTML = `<div class="viewer__fallback">${fallback || '<p>Este dispositivo no pudo iniciar el visor 3D. El resto de la página funciona con normalidad.</p>'}</div>`;
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.setAttribute('tabindex', '0');
  container.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;  // conserva el blanco sanitario como blanco
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.02, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }; // un dedo desplaza la página; dos giran y acercan
  canvas.style.touchAction = 'pan-y';              // OrbitControls pone 'none'; así el dedo sigue desplazando la página
  // La rueda desplaza la página; solo acerca el modelo con Ctrl/⌘ o con el gesto de pellizco del trackpad.
  // (Fase 10E) En vez de detener el evento, se apaga el acercamiento para esa vuelta de rueda: así el evento sigue
  // hasta la página y el scroll suave también funciona con el puntero sobre el 3D.
  let zoomable = null;
  container.addEventListener('wheel', (e) => {
    if (zoomable === null) zoomable = controls.enableZoom;
    controls.enableZoom = zoomable && (e.ctrlKey || e.metaKey);
  }, { capture: true, passive: true });

  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(3, 5, 4); key.castShadow = true; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -1, near: 0.5, far: 15 });
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 0.3));

  const stage = { renderer, scene, camera, controls, key, canvas, container, quality, onFrame: new Set(), afterFrame: new Set() };
  // nitidez en reposo: con la escena quieta se dibuja un cuadro a la densidad de la pantalla (hasta 2.5×) y al moverse
  // se regresa a la del nivel de calidad. Así lo que se mira de cerca se ve nítido y al girar sigue fluido.
  const baseRatio = () => { const Q = QUALITY[stage.quality]; return Math.min(Math.max(devicePixelRatio || 1, Q.minPixelRatio || 1), Q.pixelRatio); };
  const idleRatio = () => Math.min(devicePixelRatio || 1, 2.5);
  let sharp = false;
  stage.setSharp = (on) => {
    on = on && idleRatio() > baseRatio() + 0.05; if (on === sharp) return false;
    sharp = on; renderer.setPixelRatio(on ? idleRatio() : baseRatio()); resize(); return true;
  };
  stage.setQuality = (q) => {
    stage.quality = q; const Q = QUALITY[q]; sharp = false;
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, Q.minPixelRatio || 1), Q.pixelRatio));
    renderer.shadowMap.enabled = Q.shadows; key.castShadow = Q.shadows; key.shadow.mapSize.set(Q.shadowMap, Q.shadowMap);
    if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((mm) => { mm.needsUpdate = true; }); });
    resize(); if (stage.invalidate) stage.invalidate();
  };
  // Encuadre corrido (Fase 10E): cuando un texto tapa la franja izquierda del visor (páginas de puerta a pantalla
  // completa), la cámara encuadra en lo que queda libre a la derecha y la escena sigue dibujándose debajo del texto.
  // stage.inset = fracción del ancho que tapa el texto (0 = nada).
  stage.inset = 0;
  function resize() {
    const w = container.clientWidth, h = container.clientHeight || 1, l = stage.inset || 0;
    renderer.setSize(w, h, false);
    if (l > 0) { const vw = w * (1 - l); camera.aspect = vw / h; camera.setViewOffset(vw, h, -w * l, 0, w, h); }
    else { camera.aspect = w / h; camera.clearViewOffset(); }
    camera.updateProjectionMatrix();
  }
  stage.setInset = (l) => { if (Math.abs((stage.inset || 0) - l) < 0.002) return; stage.inset = l; resize(); if (stage.invalidate) stage.invalidate(4); };
  new ResizeObserver(resize).observe(container);

  // Bucle por tiempo; se pausa fuera de pantalla. Fase 8: solo se dibuja cuando algo cambió (cámara, posiciones,
  // materiales, luces, tamaño). Con la puerta quieta el celular deja de dibujar 60 veces por segundo; aun así se
  // dibuja una vez por segundo por si algo cambió sin que se note en la firma (red de seguridad).
  let visible = true, last = performance.now(), sig = NaN, lastDraw = 0, warm = 40, warmUntil = performance.now() + 4000;   // al empezar: 40 cuadros seguidos (máx. 4 s) para medir la fluidez
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); if (visible) stage.invalidate(); }).observe(container);
  stage.invalidate = (frames = 2) => { warm = Math.max(warm, frames); warmUntil = Math.max(warmUntil, performance.now() + 4000); };
  stage.frames = 0; stage.whyDrawn = {};                     // cuadros dibujados y por qué (para medir)
  // Matrices de instancias: hay código que las marca como cambiadas en cada cuadro aunque sean iguales (CDS), así que
  // se compara su contenido, y solo se recalcula cuando cambia su versión.
  const instCache = new WeakMap();
  const instHash = (attr) => {
    const c = instCache.get(attr); if (c && c.v === attr.version) return c.h;
    let h = 0; const a = attr.array; for (let k = 0; k < a.length; k += 3) h += Math.round(a[k] * 1e4) * ((k % 89) + 1);
    instCache.set(attr, { v: attr.version, h }); return h;
  };
  const signature = () => {
    let h = 0, i = 1;
    const add = (v) => { h += (Math.round(v * 1e5) || 0) * (i++ % 97 + 1); };   // un valor ausente no debe volver NaN la firma   // 0.01 mm: los acercamientos asintóticos no cuentan como cambio
    camera.matrixWorld.elements.forEach(add); add(camera.aspect); add(renderer.domElement.width); add(renderer.domElement.height);
    scene.traverseVisible((o) => {
      add(o.id); o.matrixWorld.elements.forEach(add);
      if (o.isInstancedMesh) { add(o.count); add(instHash(o.instanceMatrix)); }
      if (o.isLight) add(o.intensity);
      if (o.material) for (const m of [].concat(o.material)) {
        add(m.id); add(m.opacity);   // sin m.version: el propio render la sube en vidrios de doble cara (pasada de transmisión)
        if (m.color) add(m.color.r + 2 * m.color.g + 3 * m.color.b);
        if (m.emissive) add(m.emissive.r + 2 * m.emissive.g + 3 * m.emissive.b + 4 * (m.emissiveIntensity || 0));
        if (m.map) add(m.map.version);
      }
    });
    return h;
  };
  // Calidad adaptativa (Fase 8): mientras se dibuja de corrido se mide el tiempo entre cuadros; si la mediana de 16 pasa
  // de 50 ms (menos de 20 cuadros por segundo) se baja un nivel. Nunca si la calidad se fijó con ?calidad=.
  const forced = !!QUALITY[new URLSearchParams(location.search).get('calidad')], lower = { alta: 'media', media: 'baja' };
  let samples = [], prevDrawn = false, skipped = 0, lastChange = 0;
  const adapt = (interval) => {
    if (forced || !lower[stage.quality]) return;
    samples.push(interval); if (samples.length < 16) return;
    const med = samples.sort((a, b) => a - b)[8]; samples = [];
    if (med > 50) { stage.setQuality(lower[stage.quality]); stage.invalidate(60); stage.onQuality.forEach((f) => f(stage.quality, med)); }
  };
  stage.onQuality = new Set();
  renderer.setAnimationLoop((t) => {
    if (!visible) return;
    const interval = t - last;
    const dt = Math.min(0.1, interval / 1000); last = t;     // por debajo de 10 cuadros/s la animación se alarga en vez de saltar
    stage.onFrame.forEach((f) => f(dt, t));
    controls.update();
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    stage.afterFrame.forEach((f) => f(dt, t));                // capas en pantalla que siguen al 3D: con la cámara ya final
    let s2 = signature();
    // nitidez en reposo: al cambiar algo se regresa a la densidad normal; 450 ms quieta, un cuadro nítido
    if (s2 !== sig && sharp) { stage.setSharp(false); s2 = signature(); }
    if (s2 === sig && !sharp && warm <= 0 && t - lastChange > 450 && stage.setSharp(true)) { s2 = signature(); sig = NaN; stage.whyDrawn.nitidez = (stage.whyDrawn.nitidez || 0) + 1; }
    if (s2 !== sig) lastChange = t;
    const why = warm > 0 && t < warmUntil ? 'inicio' : s2 !== sig ? 'cambio' : t - lastDraw > 1000 && skipped >= 3 ? 'seguridad' : '', draw = !!why;
    if (draw) stage.whyDrawn[why] = (stage.whyDrawn[why] || 0) + 1;
    if (warm > 0) warm--;
    if (draw) {
      if (prevDrawn && !sharp) adapt(interval);
      renderer.render(scene, camera); sig = s2; lastDraw = performance.now(); stage.frames++;   // desde que terminó de dibujar
    }
    prevDrawn = draw; skipped = draw ? 0 : skipped + 1;   // con GPU muy lenta el intervalo pasa de 1 s aunque no se dibuje
  });
  // distancia para encuadrar una caja de w × h metros con margen, según el aspecto actual
  stage.fitDistance = (w, h, margin = 1.12) => {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(h / (2 * t), w / (2 * t * camera.aspect)) * margin;
  };
  stage.onResize = new Set();
  new ResizeObserver(() => stage.onResize.forEach((f) => f())).observe(container);
  stage.setQuality(quality);
  return stage;
}

export const rbox = (w, h, d, r = 0.004, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

// utilidades de UV: escalar (texturas en metros reales) e intercambiar ejes (veta vertical)
export function scaleUV(geo, sx, sy) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); uv.needsUpdate = true; return geo; }
export function swapUV(geo) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); uv.needsUpdate = true; return geo; }

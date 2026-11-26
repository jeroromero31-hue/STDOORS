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
  // Fase 12 · resolución dinámica: mientras algo se mueve, si el equipo no llega a ~45 cuadros por segundo se dibuja con
  // menos píxeles (hasta 55 %), y vuelve a subir cuando sobra tiempo. Quieta, la escena se dibuja nítida (abajo), así que
  // lo que se mira de cerca no pierde calidad. El nivel aprendido se recuerda entre páginas (misma pestaña).
  // stage.cap: tope de densidad para vistas que no necesitan más (la térmica: la imagen de una cámara térmica es suave).
  let drs = 1;
  try { const v = +sessionStorage.getItem('st.drs'); if (v >= 0.55 && v <= 1 && !QUALITY[new URLSearchParams(location.search).get('calidad')]) drs = v; } catch { /* sin almacenamiento */ }
  stage.cap = 0;
  const capped = (r) => (stage.cap ? Math.min(r, stage.cap) : r);
  // Fase 12B · tope de píxeles mientras algo se mueve: en una pantalla grande (o de laptop con densidad 2) el lienzo a
  // 1.25–2× pasaba de 3 a 8 millones de píxeles por cuadro y la tarjeta gráfica integrada no alcanzaba (se trababa el
  // Inicio). Al moverse se dibujan a lo más ~2.1 millones (1.4 en el teléfono); quieta, el cuadro nítido es como antes.
  const BUDGET = matchMedia('(pointer: coarse)').matches ? 1.4e6 : 2.1e6;
  const budget = (r) => { const a = Math.max(1, container.clientWidth * container.clientHeight); return Math.min(r, Math.sqrt(BUDGET / a)); };
  const baseRatio = () => { const Q = QUALITY[stage.quality]; return capped(Math.max(0.75, budget(Math.min(Math.max(devicePixelRatio || 1, Q.minPixelRatio || 1), Q.pixelRatio)) * drs)); };
  const idleRatio = () => { const Q = QUALITY[stage.quality]; return capped(Math.min(2.5, Math.max(devicePixelRatio || 1, Q.minPixelRatio || 1))); };
  let sharp = false;
  stage.setSharp = (on) => {
    on = on && idleRatio() > baseRatio() + 0.05; if (on === sharp) return false;
    sharp = on; renderer.setPixelRatio(on ? idleRatio() : baseRatio()); resize(); return true;
  };
  stage.applyRatio = () => {
    sharp = false; const r = baseRatio(); if (Math.abs(r - renderer.getPixelRatio()) < 0.01) return;   // mismo tamaño: no se toca el lienzo (se borraría)
    renderer.setPixelRatio(r); resize(); if (stage.invalidate) stage.invalidate(2);
  };
  stage.setQuality = (q) => {
    stage.quality = q; const Q = QUALITY[q]; sharp = false; shadowDirty = true;
    renderer.setPixelRatio(baseRatio());
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
  // dibuja una vez por segundo, durante 8 s después de cada cambio, por si algo cambió sin que se note en la firma (red de seguridad).
  let visible = true, last = performance.now(), sig = NaN, lastDraw = 0, warm = 40, warmUntil = performance.now() + 4000;   // al empezar: 40 cuadros seguidos (máx. 4 s) para medir la fluidez
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); if (visible) stage.invalidate(); }).observe(container);
  stage.invalidate = (frames = 2) => { warm = Math.max(warm, frames); warmUntil = Math.max(warmUntil, performance.now() + 4000); lastChange = performance.now(); };
  stage.frames = 0; stage.whyDrawn = {};                     // cuadros dibujados y por qué (para medir)
  // Matrices de instancias: hay código que las marca como cambiadas en cada cuadro aunque sean iguales (CDS), así que
  // se compara su contenido, y solo se recalcula cuando cambia su versión.
  const instCache = new WeakMap();
  const instHash = (attr) => {
    const c = instCache.get(attr); if (c && c.v === attr.version) return c.h;
    let h = 0; const a = attr.array; for (let k = 0; k < a.length; k += 3) h += Math.round(a[k] * 1e4) * ((k % 89) + 1);
    instCache.set(attr, { v: attr.version, h }); return h;
  };
  // La firma se separa en dos: la cámara (y el tamaño del lienzo) y la escena. Si solo cambió la cámara, el mapa de
  // sombras no se vuelve a dibujar (la luz y los objetos siguen igual): al girar o al seguir el scroll, una pasada menos.
  let camSig = 0;
  const signature = () => {
    let h = 0, i = 1;
    const add = (v) => { h += (Math.round(v * 1e5) || 0) * (i++ % 97 + 1); };   // un valor ausente no debe volver NaN la firma   // 0.01 mm: los acercamientos asintóticos no cuentan como cambio
    camera.matrixWorld.elements.forEach(add); add(camera.aspect); add(renderer.domElement.width); add(renderer.domElement.height);
    camSig = h; h = 0; i = 1;
    let sh = 0;
    scene.traverseVisible((o) => {
      const h0 = h;
      add(o.id); o.matrixWorld.elements.forEach(add);
      if (o.isInstancedMesh) { add(o.count); add(instHash(o.instanceMatrix)); }
      if (o.isLight) add(o.intensity);
      if (o.castShadow) sh += h - h0;                          // lo que proyecta sombra (y las luces que la dan)
      if (o.material) for (const m of [].concat(o.material)) {
        add(m.id); add(m.opacity);   // sin m.version: el propio render la sube en vidrios de doble cara (pasada de transmisión)
        if (m.color) add(m.color.r + 2 * m.color.g + 3 * m.color.b);
        if (m.emissive) add(m.emissive.r + 2 * m.emissive.g + 3 * m.emissive.b + 4 * (m.emissiveIntensity || 0));
        if (m.map) add(m.map.version);
      }
    });
    shadowCast = sh;
    return camSig * 3 + h;
  };
  let shadowCast = 0, shadowSig = NaN, shadowDirty = true;
  renderer.shadowMap.autoUpdate = false;
  stage.shadowsDirty = () => { shadowDirty = true; };
  stage.shadowsPaused = false;                                  // la vista térmica no usa luces: no hace falta el mapa de sombras
  // Calidad adaptativa (Fase 8): mientras se dibuja de corrido se mide el tiempo entre cuadros; si la mediana de 16 pasa
  // de 50 ms (menos de 20 cuadros por segundo) se baja un nivel. Nunca si la calidad se fijó con ?calidad=.
  const forced = !!QUALITY[new URLSearchParams(location.search).get('calidad')], lower = { alta: 'media', media: 'baja' };
  let samples = [], prevDrawn = false, skipped = 0, lastChange = 0;
  let drsN = [], drsGood = 0, drsAt = 0, trial = null, drsFloor = 0.55;
  const keepDrs = () => { try { sessionStorage.setItem('st.drs', drs.toFixed(2)); } catch { /* sin almacenamiento */ } };
  const adapt = (interval, t) => {
    // resolución dinámica: ventanas de 10 cuadros seguidos. Después de bajar se revisa la ventana siguiente: si no
    // mejoró, el límite no eran los píxeles (pantalla a 30 Hz en ahorro de batería, o el procesador ocupado) y se
    // regresa a la densidad anterior sin volver a bajar de ahí.
    drsN.push(interval);
    if (drsN.length >= 10 && !forced) {                                  // con ?calidad= fija (pruebas, videos) no cambia
      const med = drsN.sort((a, b) => a - b)[5]; drsN = [];
      if (trial) {
        if (med > trial.med * 0.93) { drs = trial.drs; drsFloor = trial.drs; stage.applyRatio(); keepDrs(); }
        trial = null; drsAt = t;
      } else if (med > 23 && drs > drsFloor + 0.001 && t - drsAt > 350) {
        trial = { drs, med }; drs = Math.max(drsFloor, +(drs * (med > 40 ? 0.74 : 0.86)).toFixed(2)); drsAt = t; drsGood = 0; stage.applyRatio(); keepDrs();
      } else if (med < 18.5 && drs < 1) { if (++drsGood >= 3) { drs = Math.min(1, +(drs * 1.12).toFixed(2)); drsAt = t; drsGood = 0; stage.applyRatio(); keepDrs(); } }
      else drsGood = 0;
    }
    if (forced || !lower[stage.quality] || drs > 0.56) return;          // la calidad baja un nivel solo si ya no hay píxeles que quitar
    samples.push(interval); if (samples.length < 16) return;
    const med = samples.sort((a, b) => a - b)[8]; samples = [];
    if (med > 50) { stage.setQuality(lower[stage.quality]); stage.invalidate(60); stage.onQuality.forEach((f) => f(stage.quality, med)); }
  };
  stage.drs = () => drs;
  stage.onQuality = new Set();
  // Fase 12 · sombreadores en paralelo: antes del primer cuadro se mandan a compilar todos (KHR_parallel_shader_compile)
  // y mientras tanto no se dibuja. Antes el primer cuadro los compilaba de golpe y en Android trababa la página entera
  // (medio segundo o más sin poder desplazarse). Si el navegador no compila en paralelo, se sigue como antes.
  let compiling = 0;
  stage.precompile = async () => {
    // solo si el navegador de verdad compila en paralelo; si no, esperar solo atrasaría el primer cuadro
    if (!renderer.compileAsync || !renderer.extensions.has('KHR_parallel_shader_compile')) return;
    compiling++;
    try { await renderer.compileAsync(scene, camera); } catch { /* se compila al dibujar */ } finally { compiling--; stage.invalidate(4); }
  };
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
    // Fase 10J · la red de seguridad solo corre los 8 s siguientes a un cambio y nunca sobre el cuadro nítido: con la escena
    // quieta ya no se vuelve a dibujar cada segundo (en el teléfono eran tirones periódicos y batería)
    const safety = !sharp && t - lastChange < 8000 && t - lastDraw > 1000 && skipped >= 3;
    const why = compiling ? '' : warm > 0 && t < warmUntil ? 'inicio' : s2 !== sig ? 'cambio' : safety ? 'seguridad' : '', draw = !!why;
    if (draw) stage.whyDrawn[why] = (stage.whyDrawn[why] || 0) + 1;
    if (warm > 0 && !compiling) warm--;
    if (draw) {
      if (prevDrawn && !sharp) adapt(interval, t);
      if (renderer.shadowMap.enabled && !stage.shadowsPaused && (shadowDirty || shadowCast !== shadowSig)) { renderer.shadowMap.needsUpdate = true; shadowSig = shadowCast; shadowDirty = false; stage.shadowDraws = (stage.shadowDraws || 0) + 1; }
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

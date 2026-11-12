// Escenario 3D común: renderer, entorno de estudio, cámara, controles, calidad adaptativa y respaldo sin WebGL.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const QUALITY = {
  alta: { pixelRatio: 2, shadows: true, shadowMap: 2048 },
  media: { pixelRatio: 1.5, shadows: true, shadowMap: 1024 },
  baja: { pixelRatio: 1, shadows: false, shadowMap: 512 },
};

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function guessQuality() {
  const q = new URLSearchParams(location.search).get('calidad');
  if (QUALITY[q]) return q;
  const coarse = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if (mem <= 3 || cores <= 4) return 'baja';
  return coarse ? 'media' : 'alta';
}

// Entorno de estudio propio: sala gris clara y neutra (sin tinte) con bandas de luz largas (dan lectura al metal cepillado).
export function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: 0xb4b4b4, side: THREE.BackSide }));
  room.position.y = 4; scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0x8c8c8c }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.99; scene.add(floor);
  const panel = (w, h, x, y, z, ry, rx, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity) }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m);
  };
  panel(14, 1.2, 0, 8.9, 0, 0, Math.PI / 2, 5.5);          // banda cenital
  panel(1.4, 7, -9.9, 3.5, -2, Math.PI / 2, 0, 3.2);       // lateral izquierda
  panel(1.4, 7, 9.9, 3.5, 2, -Math.PI / 2, 0, 2.4);        // lateral derecha
  panel(10, 3, 0, 4, -9.9, 0, 0, 1.6);                     // fondo
  panel(6, 2.2, 3, 3, 9.9, Math.PI, 0, 2.0);               // frontal (rebote del observador)
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

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4); key.castShadow = true; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -1, near: 0.5, far: 15 });
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 0.45));

  const stage = { renderer, scene, camera, controls, key, canvas, container, quality, onFrame: new Set() };
  stage.setQuality = (q) => {
    stage.quality = q; const Q = QUALITY[q];
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pixelRatio));
    renderer.shadowMap.enabled = Q.shadows; key.castShadow = Q.shadows; key.shadow.mapSize.set(Q.shadowMap, Q.shadowMap);
    if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((mm) => { mm.needsUpdate = true; }); });
    resize();
  };
  function resize() {
    const w = container.clientWidth, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);

  // bucle por tiempo; se pausa fuera de pantalla
  let visible = true, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); }).observe(container);
  renderer.setAnimationLoop((t) => {
    if (!visible) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    stage.onFrame.forEach((f) => f(dt, t));
    controls.update(); renderer.render(scene, camera);
  });
  stage.setQuality(quality);
  return stage;
}

export const rbox = (w, h, d, r = 0.004, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

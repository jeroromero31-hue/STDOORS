// Interno (Fase 14): dibuja las imágenes de la entrada del Inicio, «el umbral» (scripts/build-umbral.py).
// · modo=hojas: la vaivén de frente y sin perspectiva (cámara ortográfica), con fondo transparente, en tres capas:
//   el marco (con el vano vacío) y cada hoja (con la ventanilla vacía). En el Inicio las hojas giran con CSS 3D sobre
//   su bisagra; se guarda dónde cae cada capa dentro del marco para acomodarlas igual.
// · modo=fila: cada puerta cerrada, de 3/4 y sin muro, para la fila de puertas que se ve al entrar.
import '../styles/tokens.css';
import * as THREE from 'three';
import { createStage } from '../core/stage.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { frameBox } from '../core/cameraRig.js';
import { createAbatible } from '../viewers/abatible.js';
import { createCorrediza } from '../viewers/corrediza.js';
import { createVaiven } from '../viewers/vaiven.js';
import { createCDS } from '../viewers/cds.js';

const q = new URLSearchParams(location.search), puerta = q.get('puerta') || 'vaiven', modo = q.get('modo') || 'hojas';
const stage = createStage(document.getElementById('viewer'), { quality: 'alta', fov: 30 });
stage.controls.enabled = false;
const { renderer, scene } = stage;
const reg = createFinishRegistry(renderer); reg.setQuality('alta');
const make = {
  abatible: () => createAbatible(stage, reg, { logoUrl: '/img/marca/st-logo-azul.webp' }),
  corrediza: () => createCorrediza(stage),
  vaiven: () => createVaiven(stage, reg),
  cds: () => createCDS(stage),
};
const viewer = make[puerta]();
const acabado = q.get('acabado') || 'stainless';
if (viewer.setFinish && puerta !== 'corrediza') try { viewer.setFinish(acabado); } catch { /* acabado no disponible */ }

const hideBackdrop = () => scene.traverse((o) => { if (o.name === 'MuroYPiso' || o.name === 'SombraDeContacto' || o.name === 'Vaho') o.visible = false; });
const shown = (m) => { for (let a = m; a; a = a.parent) if (!a.visible) return false; return true; };
const boxOf = (o) => { o.updateWorldMatrix(true, true); const b = new THREE.Box3(); o.traverse((m) => { if (m.isMesh && shown(m)) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); } }); return b; };
const draw = (cam, w, h) => {
  stage.renderer.setAnimationLoop(null);
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  scene.updateMatrixWorld(true); cam.updateMatrixWorld();
  renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
};

window.__ready = (async () => {
  if (viewer.ready) await viewer.ready;
  if (puerta === 'cds' && viewer.setLED) viewer.setLED(true);
  await new Promise((r) => setTimeout(r, 1500));
  hideBackdrop();
  return true;
})();

// modo «hojas»: las tres capas con el mismo encuadre (la puerta completa, de frente, con perspectiva suave: así el
// inoxidable refleja el estudio como en las otras vistas; de frente y sin perspectiva se veía gris parejo). Como la
// puerta es plana, de frente la perspectiva no la deforma. Después se recorta cada hoja (scripts/build-umbral.py).
window.hojas = (ppm = 640, fov = 38, exposure = 0.92) => {
  renderer.toneMappingExposure = exposure;   // el inoxidable de frente refleja mucho blanco: un poco menos de exposición
  const root = scene.getObjectByName('Vaiven'), L = scene.getObjectByName('HojaIzquierda'), R = scene.getObjectByName('HojaDerecha');
  root.traverse((m) => { if (m.isMesh && /glass/i.test([].concat(m.material).map((x) => x.name).join(' '))) m.visible = false; });
  const all = boxOf(root), W = all.max.x - all.min.x, H = all.max.y - all.min.y, cx = (all.min.x + all.max.x) / 2, cy = (all.min.y + all.max.y) / 2;
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 40);
  cam.position.set(cx, cy, all.max.z + (H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2))); cam.lookAt(cx, cy, all.max.z);
  cam.updateProjectionMatrix();
  const w = Math.round(W * ppm), h = Math.round(H * ppm);
  const shot = (only) => {
    const vis = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      let inL = false, inR = false; for (let a = o; a; a = a.parent) { if (a === L) inL = true; if (a === R) inR = true; }
      const keep = only === 'marco' ? !inL && !inR : only === 'izq' ? inL : inR;
      vis.push([o, o.visible]); o.visible = o.visible && keep;
    });
    const url = draw(cam, w, h);
    vis.forEach(([o, v]) => { o.visible = v; });
    return url;
  };
  return { marco: shot('marco'), izq: shot('izq'), der: shot('der'), w, h, caja: { x0: all.min.x, x1: all.max.x, y0: all.min.y, y1: all.max.y }, ejes: { izq: L.position.x, der: R.position.x } };
};

// modo «fila»: la puerta cerrada, de 3/4, sin muro; w × h px
const BOX = {
  abatible: [-0.66, 0, 0, 0.66, 2.13, 0.22], corrediza: [-1.16, -0.4, -0.1, 3.17, 2.78, 0.46],
  vaiven: [-1.42, 0, -0.1, 1.42, 2.62, 0.12], cds: [-1.26, 0, -0.75, 1.26, 2.2, 0.12],
};
const YAW = { abatible: -0.36, corrediza: -0.3, vaiven: -0.32, cds: -0.36 };
window.fila = (w = 900, h = 900) => {
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  stage.camera.aspect = w / h; stage.camera.updateProjectionMatrix();
  const v = frameBox(stage, BOX[puerta], YAW[puerta], 0.06, 1.04);
  stage.camera.position.fromArray(v.pos); stage.controls.target.fromArray(v.tgt); stage.camera.lookAt(stage.controls.target);
  return draw(stage.camera, w, h);
};
window.__viewer = viewer;

// Fase 14B · modo «capas»: cada puerta de frente (misma cámara suave que «hojas»), en capas con fondo transparente:
// lo fijo y lo que se mueve, para el pasillo del Inicio. Devuelve cada capa con el mismo encuadre y dónde caen los ejes.
const CAPAS = {
  abatible: () => ({ hoja: [scene.getObjectByName('PivoteHoja')] }),
  corrediza: () => ({ hoja: [scene.getObjectByName('Hoja')], frente: [scene.getObjectByName('TapaRiel')] }),
  vaiven: () => ({ izq: [scene.getObjectByName('HojaIzquierda')], der: [scene.getObjectByName('HojaDerecha')] }),
  cds: () => Object.fromEntries(viewer.doors.map((d, i) => [`p${i}`, [d.pivot]])),
};
window.capas = (ppm = 400, fov = 38, exposure = 0.95) => {
  renderer.toneMappingExposure = exposure;
  const root = scene.getObjectByName({ abatible: 'Abatible', corrediza: 'Corrediza', vaiven: 'Vaiven', cds: 'CDS' }[puerta]);
  if (puerta === 'vaiven') root.traverse((m) => { if (m.isMesh && /glass/i.test([].concat(m.material).map((x) => x.name).join(' '))) m.visible = false; });
  const groups = CAPAS[puerta](), all = boxOf(root);
  const W = all.max.x - all.min.x, H = all.max.y - all.min.y, cx = (all.min.x + all.max.x) / 2, cy = (all.min.y + all.max.y) / 2;
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 60);
  cam.position.set(cx, cy, all.max.z + (H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2))); cam.lookAt(cx, cy, all.max.z);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const w = Math.round(W * ppm), h = Math.round(H * ppm);
  const under = (o, gs) => { for (let a = o; a; a = a.parent) if (gs.includes(a)) return true; return false; };
  const moving = Object.values(groups).flat();
  const shot = (gs) => {
    const vis = [];
    root.traverse((o) => { if (!o.isMesh && !o.isInstancedMesh) return; const keep = gs ? under(o, gs) : !under(o, moving); vis.push([o, o.visible]); o.visible = o.visible && keep; });
    const url = draw(cam, w, h); vis.forEach(([o, v]) => { o.visible = v; }); return url;
  };
  // ejes: el pivote de cada grupo que gira, en fracciones del encuadre
  const px = (v) => { const p = v.clone().project(cam); return [+((p.x + 1) / 2).toFixed(5), +((1 - p.y) / 2).toFixed(5)]; };
  const ejes = {};
  for (const [k, gs] of Object.entries(groups)) { const v = new THREE.Vector3(); gs[0].getWorldPosition(v); ejes[k] = px(v); }
  // la corrediza corre TRAVEL m hacia +x: en fracción del ancho
  const out = { fijo: shot(null), w, h, metros: [+W.toFixed(3), +H.toFixed(3)], ejes, piso: px(new THREE.Vector3(cx, 0, all.max.z))[1] };
  for (const [k, gs] of Object.entries(groups)) out[k] = shot(gs);
  if (puerta === 'corrediza') out.recorrido = +(1.92 / W).toFixed(5);
  return out;
};

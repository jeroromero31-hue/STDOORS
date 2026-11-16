// Interno: toma de estudio de la abatible para su capítulo del Inicio (scripts/render-abatible-photo.py).
// El mismo modelo, acabado y escenario de la página de la abatible; solo se eligen ángulo de hoja y cámara.
import '../styles/tokens.css';
import { createStage } from '../core/stage.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { createAbatible } from '../viewers/abatible.js';
import { frameBox } from '../core/cameraRig.js';

const params = new URLSearchParams(location.search);
const stage = createStage(document.getElementById('viewer'), { quality: params.get('calidad') || 'alta', fov: Number(params.get('fov') || 24) });
const reg = createFinishRegistry(stage.renderer); reg.setQuality(stage.quality);
const v = createAbatible(stage, reg, { logoUrl: '/img/marca/st-logo-azul.webp' });
v.setFinish(params.get('acabado') || 'hygienicWhite');
stage.controls.enabled = false;
// shot(ángulo de hoja en grados, posición de cámara [x,y,z], punto al que mira [x,y,z])
window.shot = (deg, pos, tgt) => {
  v.hinge.jump(deg);
  stage.camera.position.set(...pos); stage.controls.target.set(...tgt); stage.camera.lookAt(...tgt);
  stage.invalidate(10);
  return new Promise((r) => setTimeout(r, 900));
};
// shotBox(ángulo, caja [x0,y0,z0,x1,y1,z1] que debe quedar completa, giro, inclinación, margen)
window.shotBox = (deg, box, yaw, pitch, margin = 1.08) => {
  v.hinge.jump(deg); stage.camera.updateProjectionMatrix();
  const c = frameBox(stage, box, yaw, pitch, margin);
  return window.shot(deg, c.pos, c.tgt);
};
window.__v = v;

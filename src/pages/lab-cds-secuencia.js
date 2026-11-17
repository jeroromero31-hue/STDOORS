// Interno: dibuja la secuencia de CDS que el Inicio reproduce con el scroll (scripts/render-cds-sequence.py).
// Mismo modelo y mismo escenario que la página de CDS, con el muro en modo interior (azul marino de la página).
import '../styles/tokens.css';
import { createStage } from '../core/stage.js';
import { createCDS } from '../viewers/cds.js';
import { DoorState, DIM } from '../viewers/cds/legacy.js';
import { frameBox } from '../core/cameraRig.js';

const params = new URLSearchParams(location.search), layout = params.get('formato') || 'ancho';
const stage = createStage(document.getElementById('viewer'), { quality: 'alta', fov: 30 });
const cds = createCDS(stage);
// ?poster=1: la imagen fija de la página de CDS (sin 3D): muro blanco y la vista general de la página
const poster = params.get('poster') === '1';
if (!poster) cds.setInside(true);
cds.setLED(true);
stage.controls.enabled = false;
// Fase 10I · piso del interior mate (como la secuencia original): sin reflejos ni la franja de sombra del muro de paneles
stage.scene.traverse((o) => {
  if (o.name === 'SombraDeContacto') o.visible = false;
  if (o.isMesh && o.parent && o.parent.name === 'MuroYPiso' && o.geometry.type === 'PlaneGeometry') {
    const m = o.material; m.roughnessMap = null; m.roughness = 1; m.metalness = 0; m.envMapIntensity = 0; m.needsUpdate = true;
  }
});
const W = DIM.TOTAL_W, H = DIM.TOTAL_H;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

// k: 0…1. La cámara gira de 3/4 a casi de frente mientras la puerta central abre hasta quedarse a 90°.
const yaw = params.get('yaw') ? params.get('yaw').split(',').map(Number) : null;
window.frame = (k) => {
  // la puerta central (bisagras a la izquierda) abre hasta quedarse a 90°
  const open = 90 * ease(seg(k, 0.18, 0.64));
  const c = cds.ctrls[1]; c.auto = null; c.setState(open >= 89.9 ? DoorState.HOLD_OPEN_90 : DoorState.DRAGGING); c.angle = c.target = open; c.vel = 0; c.update(0.016);
  // en horizontal el conjunto queda a la derecha (a la izquierda va el texto); en vertical, centrado
  // (el texto ocupa hasta el 42 % del ancho: el conjunto debe quedar a la derecha de eso en todos los cuadros)
  const wide = layout === 'ancho';
  const left = wide ? -W / 2 - W * 1.3 : -W / 2;
  const box = [left, 0, -DIM.CAB_DEPTH, W / 2 + 0.02, H, 0.78];
  // horizontal: desde la izquierda (desde la derecha el conjunto se veía chico); vertical: desde la derecha, se ve la cara
  // interior de la puerta abierta
  const [y0, y1] = yaw || (wide ? [-0.55, -0.4] : [0.62, 0.3]);
  const v = wide ? frameBox(stage, box, y0 + (y1 - y0) * ease(k), 0.08 - 0.04 * k, 1.04 - 0.05 * ease(k))
    : frameBox(stage, box, y0 + (y1 - y0) * ease(k), 0.08 - 0.04 * k, 1.1 - 0.08 * ease(k));
  stage.camera.position.fromArray(v.pos); stage.controls.target.fromArray(v.tgt); stage.camera.lookAt(stage.controls.target);
  stage.invalidate(2);
  return new Promise((r) => setTimeout(r, 120));
};
window.__cds = cds;
window.posterShot = () => {
  const v = cds.views.general(stage);
  stage.camera.position.fromArray(v.pos); stage.controls.target.fromArray(v.tgt); stage.camera.lookAt(stage.controls.target);
  stage.invalidate(10);
  return new Promise((r) => setTimeout(r, 1500));
};

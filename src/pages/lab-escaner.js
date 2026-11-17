// Interno: dibuja cada puerta dos veces desde la misma cámara (normal y en rayos X) para el escáner del Inicio
// (scripts/render-escaner.py). También calcula dónde caen en la imagen las piezas que se señalan.
import '../styles/tokens.css';
import * as THREE from 'three';
import { createStage } from '../core/stage.js';
import { createXray } from '../core/xray.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { frameBox } from '../core/cameraRig.js';
import { createAbatible, ABATIBLE } from '../viewers/abatible.js';
import { createCorrediza } from '../viewers/corrediza.js';
import { createVaiven } from '../viewers/vaiven.js';
import { createCDS } from '../viewers/cds.js';
import catalog from '../data/components.json';

const q = new URLSearchParams(location.search), puerta = q.get('puerta') || 'abatible', modo = q.get('modo') || 'normal', fmt = q.get('formato') || 'ancho';
const stage = createStage(document.getElementById('viewer'), { quality: 'alta', fov: 30 });
stage.controls.enabled = false;
const reg = createFinishRegistry(stage.renderer); reg.setQuality('alta');
const make = {
  abatible: () => createAbatible(stage, reg, { logoUrl: '/img/marca/st-logo-azul.webp' }),
  corrediza: () => createCorrediza(stage),
  vaiven: () => createVaiven(stage, reg),
  cds: () => createCDS(stage),
};
const viewer = make[puerta]();
// encuadre: la puerta completa, de 3/4, con aire a los lados para las etiquetas
const BOX = {
  abatible: [-0.66, 0, 0, 0.66, 2.13, 0.22], corrediza: [-1.16, -0.4, -0.1, 3.17, 2.78, 0.46],
  vaiven: [-1.42, 0, -0.1, 1.42, 2.62, 0.12], cds: [-1.26, 0, -0.75, 1.26, 2.2, 0.12],
};
const YAW = { abatible: -0.42, corrediza: 0.31, vaiven: -0.36, cds: -0.42 };
const shoot = () => {
  const v = frameBox(stage, BOX[puerta], YAW[puerta], 0.07, fmt === 'ancho' ? 1.14 : 1.1);
  stage.camera.position.fromArray(v.pos); stage.controls.target.fromArray(v.tgt); stage.camera.lookAt(stage.controls.target);
  stage.camera.updateMatrixWorld(); stage.invalidate(10);
};
const nameOf = (a) => {
  if (a.text) return { numero: '', nombre: a.label };
  const p = catalog.piezas.find((x) => (a.id ? x.id === a.id : x.numero === a.numero && x.familias.includes(puerta)));
  return p ? { numero: p.numero || '', nombre: p.nombre } : null;
};
window.__ready = (async () => {
  if (viewer.ready) await viewer.ready;
  if (puerta === 'cds' && viewer.setLED) viewer.setLED(true);
  await new Promise((r) => setTimeout(r, 1800));
  shoot();
  if (modo === 'rayos') createXray(stage).set(true);
  await new Promise((r) => setTimeout(r, 1200));
  stage.scene.updateMatrixWorld(true);
  const tags = (viewer.anchors || []).map((a) => {
    const n = nameOf(a); if (!n) return null;
    const v = a.position.clone(); a.parent.updateWorldMatrix(true, false); a.parent.localToWorld(v); v.project(stage.camera);
    return { ...n, x: +((v.x + 1) / 2).toFixed(4), y: +((1 - v.y) / 2).toFixed(4) };
  }).filter((t) => t && t.x > 0.03 && t.x < 0.97 && t.y > 0.03 && t.y < 0.97);
  return { tags };
})();

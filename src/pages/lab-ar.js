// Interno (Fase 10J): exporta cada puerta a GLB para «Verla en tu espacio» (scripts/build-ar.py). Solo la puerta y su
// marco: sin muro, piso, luces ni capas de ayuda. Junto con el GLB se calcula el vano del modelo (ancho, alto, centro y
// piso), para que el sitio la escale a la medida que escribe el cliente.
import '../styles/tokens.css';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { createAbatible, ABATIBLE } from '../viewers/abatible.js';
import { createCorrediza } from '../viewers/corrediza.js';
import { createVaiven } from '../viewers/vaiven.js';
import { VAIVEN } from '../viewers/vaiven.rig.js';
import { createCDS } from '../viewers/cds.js';

const puerta = new URLSearchParams(location.search).get('puerta') || 'abatible';
const stage = createStage(document.getElementById('viewer'), { quality: 'baja', fov: 30 });
stage.controls.enabled = false;
const reg = createFinishRegistry(stage.renderer); reg.setQuality('media');
const make = {
  abatible: () => createAbatible(stage, reg, { logoUrl: '/img/marca/st-logo-azul.webp' }),
  corrediza: () => createCorrediza(stage),
  vaiven: () => createVaiven(stage, reg),
  cds: () => createCDS(stage),
};
const viewer = make[puerta]();
const OFF = /^(MuroYPiso|SombraDeContacto|Vaho|InteriorSinLuz)$/;

window.exportAR = async () => {
  await (viewer.ready || Promise.resolve());
  if (puerta === 'cds' && viewer.setLED) viewer.setLED(true);
  await new Promise((r) => setTimeout(r, 800));
  stage.scene.updateMatrixWorld(true);
  // fuera lo que no es la puerta
  const hidden = [];
  stage.scene.traverse((o) => {
    const off = OFF.test(o.name) || o.isLight || o.isSprite || o.isLine || o.isPoints || (o.isMesh && (!o.material || o.material.isShaderMaterial || o.material.isSpriteMaterial)) || o.userData.role === 'hidden';
    if (off && o.visible) { o.visible = false; hidden.push(o); }
  });
  // caja de lo que queda
  const box = new THREE.Box3();
  stage.scene.traverseVisible((o) => { if (o.isMesh) box.expandByObject(o); });
  // vano del modelo: el hueco del muro (lo que mide el cliente)
  let vano;
  if (puerta === 'abatible') vano = { w: 0.90, h: 1.95, cx: 0, floor: 0 };
  else if (puerta === 'vaiven') vano = { w: 2 * (1.24 + VAIVEN.frame.shift), h: 2.51 + VAIVEN.frame.lift, cx: 0, floor: 0 };
  else if (puerta === 'corrediza') {
    // la hoja (su perfil perimetral) traslapa el vano unos 10 cm por lado y arriba
    const cb = new THREE.Box3(); viewer.meshes.filter((m) => /^door\/rim\//.test(m.name)).forEach((m) => cb.expandByObject(m));
    const floor = -0.495;
    vano = { w: cb.max.x - cb.min.x - 0.2, h: cb.max.y - floor - 0.1, cx: (cb.min.x + cb.max.x) / 2, floor };
  } else vano = { w: box.max.x - box.min.x, h: box.max.y - box.min.y, cx: (box.min.x + box.max.x) / 2, floor: box.min.y };
  const glb = await new GLTFExporter().parseAsync(stage.scene, { binary: true, onlyVisible: true, maxTextureSize: 512 });
  hidden.forEach((o) => { o.visible = true; });
  const bytes = new Uint8Array(glb); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { b64: btoa(s), vano, box: { min: box.min.toArray(), max: box.max.toArray() } };
};
window.__ready = true;

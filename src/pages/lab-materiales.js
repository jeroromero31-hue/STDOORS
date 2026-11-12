// Escena de calibración: todas las muestras bajo la misma luz, vistas frontal y 3/4.
import * as THREE from 'three';
import { mountSite } from '../ui/site.js';
import { createStage, rbox, scaleUV } from '../core/stage.js';
import { createFinishRegistry, FINISH_LABEL } from '../materials/FinishRegistry.js';

mountSite('lab');
const SAMPLES = [
  ['blackMetal', 'Negro'], ['stainless', 'Inoxidable'], ['hygienicWhite', 'Blanco sanitario'],
  ['stainlessDiamond', 'Bumper inox diamante'], ['aluminum', 'Perfil de aluminio'], ['blackAluminum', 'Aluminio negro CDS'], ['glass', 'Vidrio CDS'],
];
const stage = createStage(document.getElementById('viewer'), { fov: 26 });
if (stage) {
  const { scene, camera, controls } = stage;
  const reg = createFinishRegistry(stage.renderer);
  const W = 0.34, gap = 0.12, total = SAMPLES.length * W + (SAMPLES.length - 1) * gap;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0xe9eef1, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), new THREE.MeshStandardMaterial({ color: 0xf6f8f9, roughness: 0.95 }));
  backdrop.position.set(0, 2, -0.6); backdrop.receiveShadow = true; scene.add(backdrop);
  SAMPLES.forEach(([key], i) => {
    const x = -total / 2 + W / 2 + i * (W + gap), mat = reg.get(key);
    const slabGeo = rbox(W, 0.62, 0.05, 0.012, 4); if (key === 'stainlessDiamond') scaleUV(slabGeo, W / 0.15, 0.62 / 0.15);
    const slab = new THREE.Mesh(slabGeo, mat);   // canto con radio: lee el borde
    slab.position.set(x, 0.33, 0); slab.castShadow = slab.receiveShadow = true; scene.add(slab);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 64, 32), mat);
    ball.position.set(x, 0.085, 0.24); ball.castShadow = true; scene.add(ball);
    if (key === 'glass') { // detrás del vidrio, una tira de color para juzgar transparencia
      const card = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x0879ad, roughness: 0.6 }));
      card.position.set(x, 0.33, -0.12); scene.add(card); slab.renderOrder = 2;
    }
  });
  const VIEWS = { frontal: [[0, 0.42, 4.4], [0, 0.3, 0]], tres4: [[2.6, 1.0, 3.2], [0, 0.3, 0]], detalle: [[0.05, 0.42, 1.25], [-0.23, 0.33, 0]] };
  let anim = null;
  const go = (v, instant) => { const [p, t] = VIEWS[v]; if (instant) { camera.position.set(...p); controls.target.set(...t); return; } anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; };
  stage.onFrame.add((dt) => {
    if (!anim) return; anim.k = Math.min(1, anim.k + dt / 1.0); const e = anim.k < 0.5 ? 4 * anim.k ** 3 : 1 - (-2 * anim.k + 2) ** 3 / 2;
    camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.t0, anim.t1, e); if (anim.k >= 1) anim = null;
  });
  controls.addEventListener('start', () => { anim = null; });
  go('tres4', true);
  document.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => { go(b.dataset.view); document.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', x === b)); });
  document.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { stage.setQuality(b.dataset.q); reg.setQuality(b.dataset.q); document.querySelectorAll('[data-q]').forEach((x) => x.setAttribute('aria-pressed', x === b)); });
  document.querySelector(`[data-q="${stage.quality}"]`)?.setAttribute('aria-pressed', 'true');
  const rot = document.getElementById('envRot');
  rot.oninput = () => { scene.environmentRotation.y = THREE.MathUtils.degToRad(+rot.value); document.getElementById('envRotV').textContent = `${rot.value}°`; };
  window.__stage = stage; window.__go = go;

  // tabla de parámetros leída del propio registro (documentación viva)
  const hex = (c) => '#' + c.getHexString();
  document.getElementById('params').insertAdjacentHTML('beforeend', SAMPLES.map(([k, label]) => {
    const m = reg.get(k);
    return `<tr><th scope="row">${label}${FINISH_LABEL[k] ? ' <span class="badge">acabado</span>' : ''}</th><td><code>${k}</code></td><td><span class="dot" style="background:${hex(m.color)}"></span>${hex(m.color)}</td><td>${m.metalness}</td><td>${m.roughness}</td><td>${m.clearcoat ?? '—'}</td><td>${m.anisotropy ? m.anisotropy : '—'}</td></tr>`;
  }).join(''));
}

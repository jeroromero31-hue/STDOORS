// Verifica que la vaivén migrada es la misma que el modelo aprobado (V13).
//
//   1. Geometría: expande src/models/vaiven.bin y lo compara, float32 por float32, con const MODEL del original.
//   2. Giro de las hojas: ejecuta modelMat() del motor ORIGINAL y compara sus matrices con las de los nodos del
//      visor nuevo, movidos con la misma clase Hinge que usa la página, en todo el recorrido de cada hoja.
//   3. Cámaras: las vistas del original contra su conversión.
//
// Uso:  ST_PAQUETE=../ST_DOORS_PAQUETE node scripts/verify-vaiven.mjs   (sale con código 1 si algo no coincide)
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { root, readModel, compareGeometry } from './lib/meshpack.mjs';
import { readSource, originalViews, finishPresets } from './convert-vaiven.mjs';
import { createRig, VAIVEN } from '../src/viewers/vaiven.rig.js';
import { Hinge } from '../src/core/hinge.js';
import { originalCamera } from '../src/core/cameraRig.js';

const report = { fecha: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' }), geometria: {}, giro: {}, camaras: {}, ok: true };
const fail = (msg) => { report.ok = false; (report.errores ||= []).push(msg); console.error('✗', msg); };

const { html, model, sha256 } = readSource();
const { manifest, bin } = readModel('vaiven');

// ---------- 1. geometría ----------
{
  if (manifest.fuente.sha256 !== sha256) fail('El manifiesto se generó a partir de otro archivo fuente');
  report.geometria = compareGeometry(manifest, bin, model.meshes, fail);
  const g = report.geometria;
  console.log(`geometría: ${g.mallas} mallas, ${g.triangulos} triángulos, ${g.valores_comparados} valores float32 comparados, ${g.valores_distintos} distintos`);
}

// ---------- 2. giro de las hojas ----------
// Código del motor original, sin tocar: utilidades de matrices, estado, modelMat y viewMat
const a = html.indexOf('const matmul='), b = html.indexOf('function project(');
if (a < 0 || b < 0) throw new Error('No se localizó el bloque de matrices del original');
const original = new Function(`${html.slice(a, b)}
  return { modelMat, viewMat, pose(l, r) { left = l; right = r; }, camera(c) { yaw = c[0]; pitch = c[1]; dist = c[2]; focusX = c[3]; focusY = c[4]; } };`)();
{
  const open = html.match(/function open\(mode\)\{const a=([.\d]+)\*openDir;wantLeft=\(mode==='left'\|\|mode==='both'\)\?-a:0;wantRight=\(mode==='right'\|\|mode==='both'\)\?a:0;/);
  if (!open) throw new Error('No se localizó open(mode) en el original');
  if (Number(open[1]) !== VAIVEN.openAngle) fail(`Apertura distinta: original ${open[1]} rad, visor ${VAIVEN.openAngle} rad`);

  const rig = createRig(), max = THREE.MathUtils.radToDeg(VAIVEN.openAngle);
  // misma configuración que el visor: ángulo positivo = la hoja abre hacia el frente (+z)
  const hl = new Hinge(rig.slots.left, { dir: 1, min: -max, max }), hr = new Hinge(rig.slots.right, { dir: -1, min: -max, max });
  const worst = { static: 0, left: 0, right: 0 }; let poses = 0;
  const check = (dl, dr) => {
    hl.jump(dl); hr.jump(dr); rig.root.updateMatrixWorld(true); poses++;
    original.pose(-THREE.MathUtils.degToRad(hl.angle), THREE.MathUtils.degToRad(hr.angle));     // left = −ángulo, right = +ángulo
    for (const g of Object.keys(worst)) {
      const want = original.modelMat(g), got = rig.slots[g].matrixWorld.elements;
      for (let k = 0; k < 16; k++) worst[g] = Math.max(worst[g], Math.abs(want[k] - got[k]));
    }
  };
  for (let i = -400; i <= 400; i++) check((i / 400) * max, (-i / 400) * max);       // cada hoja, de un tope al otro
  for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) check((i / 20) * max, (j / 20) * max);   // hojas independientes
  const TOL = 2e-6;      // el original calcula con Float32Array; el visor, con float64. La diferencia es redondeo.
  for (const g of Object.keys(worst)) if (worst[g] > TOL) fail(`Giro de "${g}": diferencia ${worst[g].toExponential(2)} (tolerancia ${TOL})`);

  // «Abrir» en la página (90°, recortado al máximo de cada bisagra) = «Abrir ambas» del original; y abre hacia +z
  hl.jump(90); hr.jump(90); rig.root.updateMatrixWorld(true);
  const ry = [rig.slots.left.rotation.y, rig.slots.right.rotation.y];
  if (Math.abs(ry[0] + VAIVEN.openAngle) > 1e-12 || Math.abs(ry[1] - VAIVEN.openAngle) > 1e-12) fail(`«Abrir» no coincide con el original: ${ry}`);
  const tipL = new THREE.Vector3(1, 1, 0).applyMatrix4(rig.slots.left.matrixWorld), tipR = new THREE.Vector3(-1, 1, 0).applyMatrix4(rig.slots.right.matrixWorld);
  if (!(tipL.z > 0.8 && tipR.z > 0.8)) fail('Con ángulo positivo las hojas no abren hacia el frente');
  // el tope no deja pasar de la apertura del original
  hl.jump(170); if (Math.abs(hl.angle - max) > 1e-9) fail('La bisagra deja abrir más que el original');

  report.giro = { poses_comparadas: poses, tolerancia: TOL, diferencia_maxima_por_grupo: Object.fromEntries(Object.entries(worst).map(([k, v]) => [k, Number(v.toExponential(2))])), eje_x_m: VAIVEN.hingeX, apertura_rad: VAIVEN.openAngle, apertura_grados: Number(max.toFixed(3)) };
  console.log(`giro: ${poses} poses, diferencia máxima ${Math.max(...Object.values(worst)).toExponential(2)} (tolerancia ${TOL})`);
}

// ---------- 3. cámaras y acabados ----------
{
  const views = originalViews(html), cam = new THREE.PerspectiveCamera(45, 1.3, 0.1, 90);
  let worstCam = 0, n = 0;
  for (const [name, v] of Object.entries(views)) {
    if (!Array.isArray(v)) continue; n++;
    original.camera(v); const want = original.viewMat();
    const c = originalCamera(v); cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.tgt); cam.updateMatrixWorld(true);
    const got = cam.matrixWorldInverse.elements;
    for (let k = 0; k < 16; k++) worstCam = Math.max(worstCam, Math.abs(want[k] - got[k]));
    if (JSON.stringify(manifest.vistas_originales[name]) !== JSON.stringify(v)) fail(`Vista ${name}: el manifiesto no coincide con el original`);
  }
  if (worstCam > 5e-6) fail(`Cámaras: diferencia ${worstCam.toExponential(2)}`);
  report.camaras = { vistas: n, diferencia_maxima: Number(worstCam.toExponential(2)) };
  console.log(`cámaras: ${n} vistas, diferencia máxima ${worstCam.toExponential(2)}`);
  const { presets } = finishPresets(html);
  if (JSON.stringify(manifest.acabados_originales.presets) !== JSON.stringify(presets)) fail('Los acabados del manifiesto no coinciden con el original');
  report.acabados_originales = Object.fromEntries(Object.entries(presets).map(([k, v]) => [k, v.label]));
}

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/verificacion-vaiven.json'), JSON.stringify(report, null, 2));
console.log(report.ok ? '✓ La vaivén migrada coincide con el modelo aprobado' : '✗ Hay diferencias');
process.exit(report.ok ? 0 : 1);

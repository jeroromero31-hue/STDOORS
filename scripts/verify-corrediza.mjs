// Verifica que la corrediza migrada es la misma que el modelo aprobado.
//
//   1. Geometría: expande src/models/corrediza.bin y lo compara, float32 por float32, con el <script id="mesh-data">
//      del original (mismo orden de mallas, de triángulos y de vértices).
//   2. Cinemática: ejecuta las funciones del motor ORIGINAL (motion, modelMat, wheelTransform, extraídas tal cual
//      del HTML) y compara sus matrices con las de los nodos del visor nuevo, a lo largo de todo el recorrido
//      y de toda la apertura de la tapa.
//   3. Cámaras: comprueba que la conversión de las vistas del original reproduce su matriz de vista.
//
// Uso:  ST_PAQUETE=../ST_DOORS_PAQUETE node scripts/verify-corrediza.mjs   (sale con código 1 si algo no coincide)
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { root, readModel, compareGeometry } from './lib/meshpack.mjs';
import { readSource, originalViews } from './convert-corrediza.mjs';
import { MECH, TRAVEL, motion, progressForSlide, applyPose } from '../src/viewers/corrediza.kinematics.js';
import { originalCamera } from '../src/core/cameraRig.js';
import { createRig } from '../src/viewers/corrediza.rig.js';

const report = { fecha: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' }), geometria: {}, cinematica: {}, camaras: {}, ok: true };
const fail = (msg) => { report.ok = false; (report.errores ||= []).push(msg); console.error('✗', msg); };

const { html, model, sha256 } = readSource();
const { manifest, bin } = readModel('corrediza');

// ---------- 1. geometría ----------
{
  if (manifest.fuente.sha256 !== sha256) fail('El manifiesto se generó a partir de otro archivo fuente');
  report.geometria = compareGeometry(manifest, bin, model.meshes, fail);
  const g = report.geometria;
  console.log(`geometría: ${g.mallas} mallas, ${g.triangulos} triángulos, ${g.valores_comparados} valores float32 comparados, ${g.valores_distintos} distintos`);
}

// ---------- 2. cinemática ----------
{
  // Código del motor original, sin tocar: utilidades de matrices, estado, motion, wheelTransform y modelMat
  const a = html.indexOf('const ident=()=>'), b = html.indexOf('function viewMat()');
  if (a < 0 || b < 0) throw new Error('No se localizó el bloque de cinemática del original');
  const original = new Function(`${html.slice(a, b)}
    return { motion, modelMat, mul, translation, rotateX, rotateY,
      pose(p, c) { const m = motion(p); slideX = m.x; drop = m.drop; approach = m.approach; compression = m.compression; coverProgress = c; } };`)();

  const rig = createRig();
  const groups = ['static', 'door', 'seal', 'cover', 'wheel-left', 'wheel-right'];
  const worst = Object.fromEntries(groups.map((g) => [g, 0]));
  let poses = 0, worstMotion = 0;
  const check = (p, c) => {
    original.pose(p, c); applyPose(rig.nodes, p, c); rig.root.updateMatrixWorld(true); poses++;
    const mo = original.motion(p), mn = motion(p);
    for (const k of ['x', 'drop', 'approach', 'compression', 'seat']) worstMotion = Math.max(worstMotion, Math.abs(mo[k] - mn[k]));
    for (const g of groups) {
      const want = original.modelMat(g), got = rig.slots[g].matrixWorld.elements;      // ambas en orden por columnas
      for (let k = 0; k < 16; k++) worst[g] = Math.max(worst[g], Math.abs(want[k] - got[k]));
    }
  };
  for (let i = 0; i <= 1000; i++) check(i / 1000, 0.94);                       // todo el recorrido (tapa como abre el original)
  for (let i = 0; i <= 200; i++) check(0, i / 200);                            // toda la tapa
  for (let i = 0; i <= 40; i++) for (let j = 0; j <= 10; j++) check(i / 40, j / 10);
  for (const p of [0, 0.035, 0.07, MECH.camThreshold, 0.5, 0.93, 1]) check(p, 1);
  const TOL = 2e-6;      // el original calcula con Float32Array; el visor, con float64. La diferencia es redondeo.
  for (const g of groups) if (worst[g] > TOL) fail(`Cinemática de "${g}": diferencia ${worst[g].toExponential(2)} (tolerancia ${TOL})`);
  if (worstMotion > 1e-12) fail(`motion(p) no coincide: ${worstMotion}`);

  // la inversa (arrastre con el puntero) devuelve el mismo progreso
  let inv = 0;
  for (let i = 0; i <= 2000; i++) { const p = i / 2000; inv = Math.max(inv, Math.abs(progressForSlide(motion(p).x) - p)); }
  if (inv > 1e-6) fail(`progressForSlide no invierte motion: ${inv}`);
  if (Math.abs(motion(1).x - TRAVEL) > 1e-12) fail('Recorrido total distinto');

  report.cinematica = { poses_comparadas: poses, tolerancia: TOL, diferencia_maxima_por_grupo: Object.fromEntries(groups.map((g) => [g, Number(worst[g].toExponential(2))])), diferencia_motion: worstMotion, error_inversa_arrastre: Number(inv.toExponential(2)), recorrido_m: TRAVEL, descenso_m: MECH.dropDepth, acercamiento_m: MECH.approachDepth };
  console.log(`cinemática: ${poses} poses, diferencia máxima ${Math.max(...Object.values(worst)).toExponential(2)} (tolerancia ${TOL})`);

  // ---------- 3. cámaras ----------
  const views = originalViews(html), cam = new THREE.PerspectiveCamera(45, 1.3, 0.1, 80);
  let worstCam = 0;
  for (const [name, v] of Object.entries(views)) {
    const [yaw, pitch, dist, fx, fy] = v;
    const want = original.mul(original.translation(0, 0, -dist), original.mul(original.rotateX(pitch), original.mul(original.rotateY(yaw), original.translation(-fx, -fy, 0))));
    const c = originalCamera(v); cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.tgt); cam.updateMatrixWorld(true);
    const got = cam.matrixWorldInverse.elements;
    for (let k = 0; k < 16; k++) worstCam = Math.max(worstCam, Math.abs(want[k] - got[k]));
    if (JSON.stringify(manifest.vistas_originales[name]) !== JSON.stringify(v)) fail(`Vista ${name}: el manifiesto no coincide con el original`);
  }
  if (worstCam > 5e-6) fail(`Cámaras: diferencia ${worstCam.toExponential(2)}`);
  report.camaras = { vistas: Object.keys(views).length, diferencia_maxima: Number(worstCam.toExponential(2)) };
  console.log(`cámaras: ${Object.keys(views).length} vistas, diferencia máxima ${worstCam.toExponential(2)}`);
}

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/verificacion-corrediza.json'), JSON.stringify(report, null, 2));
console.log(report.ok ? '✓ La corrediza migrada coincide con el modelo aprobado' : '✗ Hay diferencias');
process.exit(report.ok ? 0 : 1);

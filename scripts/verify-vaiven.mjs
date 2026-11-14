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
import { createRig, VAIVEN, axisLocal, widenFrame, splitPieces } from '../src/viewers/vaiven.rig.js';
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

// ---------- 2. giro de las hojas (referencia: el motor original, con el eje de la migración 3C-1) ----------
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

// ---------- 4. Fase 3C-2: ejes reales, marco más ancho y holguras ----------
// Se usan las MISMAS funciones del visor (axisLocal, widenFrame, splitPieces) y la misma clase Hinge.
{
  const rig = createRig(), max = THREE.MathUtils.radToDeg(VAIVEN.openAngle);
  const hl = new Hinge(rig.slots.left, { dir: 1, min: -max, max, axis: axisLocal(1) }), hr = new Hinge(rig.slots.right, { dir: -1, min: -max, max, axis: axisLocal(-1) });
  const meshes = model.meshes;
  const geoOf = (g) => { const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(new Float32Array(g.p), 3)); G.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(g.n), 3)); const n = g.p.length / 3; G.setIndex([...Array(n).keys()]); return G; };
  // puntos de la hoja izquierda: móviles, nudillos del frente, nudillos de atrás
  const pts = { leaf: [], front: [], back: [] }, mats = [];
  for (const g of meshes) { if (g.group !== 'left') continue; const G = geoOf(g);
    const parts = /^hinge|^screw/.test(g.material) ? splitPieces(G, (c) => (c.x < 0 ? (c.z > 0 ? 'front' : 'back') : 'leaf')) : { leaf: G };
    for (const [k, P] of Object.entries(parts)) { const pos = P.attributes.position, used = new Set(P.index.array); for (const v of used) pts[k].push([pos.getX(v), pos.getY(v), pos.getZ(v), g.material]); } }
  // marco ensanchado: cajas de los postes y del cabezal, sacadas de la malla transformada
  const frame = meshes.find((g) => g.group === 'static' && g.material === 'frame'), FG = geoOf(frame); widenFrame(FG, false);
  const boxes = Object.values(splitPieces(FG, (c) => (Math.abs(c.x) < 1 ? 'head' : c.x < 0 ? 'postL' : 'postR'))).map((G) => new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(G.attributes.position.array.slice(), 3)));
  // setFromBufferAttribute toma todos los vértices compartidos; se recalcula con los índices de cada pieza
  const pieceBox = (key) => { const P = splitPieces(FG, (c) => (Math.abs(c.x) < 1 ? 'head' : c.x < 0 ? 'postL' : 'postR'))[key], b3 = new THREE.Box3(), v = new THREE.Vector3(); for (const i of P.index.array) b3.expandByPoint(v.fromBufferAttribute(P.attributes.position, i)); return b3; };
  const postL = pieceBox('postL'), head = pieceBox('head');
  const depth = (w, b3) => Math.min(w.x - b3.min.x, b3.max.x - w.x, w.y - b3.min.y, b3.max.y - w.y, w.z - b3.min.z, b3.max.z - w.z);
  const R = { orientacion_max: 0, cerrada_max: 0, hoja_en_marco_mm: 0, nudillos_en_poste_mm: 0, entre_hojas_mm: 0, entre_hojas_material: null, angulos: 0 };
  const v = new THREE.Vector3();
  for (let a = -126; a <= 126; a++) {          // de −63° a +63° en pasos de 0.5°
    const ang = (a / 126) * max; hl.jump(ang); hr.jump(0); rig.root.updateMatrixWorld(true); R.angulos++;
    original.pose(-THREE.MathUtils.degToRad(hl.angle), 0);
    const want = original.modelMat('left'), got = rig.slots.left.matrixWorld.elements;
    for (const k of [0, 1, 2, 4, 5, 6, 8, 9, 10]) R.orientacion_max = Math.max(R.orientacion_max, Math.abs(want[k] - got[k]));   // misma orientación que el original
    if (a === 0) for (let k = 0; k < 16; k++) R.cerrada_max = Math.max(R.cerrada_max, Math.abs(want[k] - got[k]));
    const side = Math.sign(ang), M = rig.slots.left.matrixWorld;
    for (const [kind, list] of Object.entries(pts)) for (const P of list) {
      const fixed = kind !== 'leaf' && (side === 0 || (kind === 'front' ? 1 : -1) === side);
      v.set(P[0], P[1], P[2]); if (fixed) v.x -= VAIVEN.hingeX; else v.applyMatrix4(M);
      const d = Math.max(depth(v, postL), depth(v, head));
      if (fixed) R.nudillos_en_poste_mm = Math.max(R.nudillos_en_poste_mm, d * 1000); else R.hoja_en_marco_mm = Math.max(R.hoja_en_marco_mm, d * 1000);
    }
  }
  // entre hojas: la izquierda en cada ángulo contra la derecha en cada ángulo (pasos de 3°); losa de la hoja derecha con su empaque
  for (let a = -21; a <= 21; a++) for (let b2 = -21; b2 <= 21; b2++) {
    hl.jump((a / 21) * max); hr.jump((b2 / 21) * max); rig.root.updateMatrixWorld(true);
    const inv = rig.slots.right.matrixWorld.clone().invert();
    for (const P of pts.leaf) { if (P[0] < 0.9) continue; v.set(P[0], P[1], P[2]).applyMatrix4(rig.slots.left.matrixWorld).applyMatrix4(inv);
      const d = Math.min(-v.x + 0.029, 1.1438 + v.x, 0.043 - Math.abs(v.z), v.y - 0.0385, 2.425 - v.y);
      if (d * 1000 > R.entre_hojas_mm) { R.entre_hojas_mm = d * 1000; R.entre_hojas_material = P[3]; R.entre_hojas_angulos = [Number(hl.angle.toFixed(1)), Number(hr.angle.toFixed(1))]; } }
  }
  for (const k of ['orientacion_max', 'cerrada_max']) R[k] = Number(R[k].toExponential(2));
  for (const k of ['hoja_en_marco_mm', 'nudillos_en_poste_mm', 'entre_hojas_mm']) R[k] = Number(R[k].toFixed(2));
  R.ejes = { hacia_el_poste_m: VAIVEN.axis.toJamb, profundidad_m: VAIVEN.axis.depth }; R.marco = VAIVEN.frame;
  if (R.orientacion_max > 2e-6) fail(`3C-2: la orientación de la hoja no coincide con el original (${R.orientacion_max})`);
  if (R.cerrada_max > 2e-6) fail(`3C-2: cerrada, la hoja no está donde en el original (${R.cerrada_max})`);
  if (R.hoja_en_marco_mm > 0.01) fail(`3C-2: la hoja entra ${R.hoja_en_marco_mm} mm en el marco`);
  if (R.nudillos_en_poste_mm > 0.01) fail(`3C-2: la mitad fija entra ${R.nudillos_en_poste_mm} mm en el poste`);
  if (R.entre_hojas_mm > 0.01 && R.entre_hojas_material !== 'gasket') fail(`3C-2: las hojas se tocan con ${R.entre_hojas_material}`);
  report.correcciones_3C2 = R;
  console.log(`3C-2: ${R.angulos} ángulos; hoja dentro del marco ${R.hoja_en_marco_mm} mm; mitad fija dentro del poste ${R.nudillos_en_poste_mm} mm; entre hojas ${R.entre_hojas_mm} mm (${R.entre_hojas_material}, a ${R.entre_hojas_angulos}); orientación igual al original (${R.orientacion_max}); cerrada igual (${R.cerrada_max})`);
}

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/verificacion-vaiven.json'), JSON.stringify(report, null, 2));
console.log(report.ok ? '✓ La vaivén migrada coincide con el modelo aprobado' : '✗ Hay diferencias');
process.exit(report.ok ? 0 : 1);

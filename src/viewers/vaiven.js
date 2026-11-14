// Puerta vaivén de doble hoja. Migración del modelo aprobado (01_MODELOS_ORIGINALES/VAIVEN_V13_MODELO_BASE.html):
//   · Geometría: los mismos vértices y normales, malla por malla (src/models/vaiven.bin).
//   · Giro: cada hoja sobre el mismo eje del original, hasta la misma apertura y hacia los dos lados.
//   · Acabados: negro, inoxidable y blanco sanitario, con las MISMAS instancias de material que la abatible.
// Lo que cambia frente al original está en docs/DIFERENCIAS_CON_ORIGINALES.md.
import * as THREE from 'three';
import manifest from '../models/vaiven.json';
import binUrl from '../models/vaiven.bin?url';
import logoUrl from '../models/logo-hoja.png';
import { createRig, VAIVEN } from './vaiven.rig.js';
import { Hinge, hingeMotion } from '../core/hinge.js';
import { createBackdrop } from '../core/backdrop.js';
import { frameBox, orbitView } from '../core/cameraRig.js';
import { materialFromOriginal, updateFromOriginal } from '../materials/fromOriginal.js';
import { finishUV } from '../materials/FinishRegistry.js';

// acabado del registro compartido ↔ acabado del modelo original (este último retoca marco, placa inferior y vidrio)
const PRESET = { blackMetal: 'black', stainless: 'steel', hygienicWhite: 'light' };
const MAX = THREE.MathUtils.radToDeg(VAIVEN.openAngle);          // 63.03°: la apertura del original
const AJAR = 28;                                                 // "ver por dentro": hojas entreabiertas, con caras y cantos a la vista

// Tono de las piezas que no son acabado, medido contra el original desde sus mismas cámaras
// (docs/DIFERENCIAS_CON_ORIGINALES.md). gain aclara u oscurece; rough multiplica la rugosidad de tabla.
// El frente del marco es una placa plana que mira a la cámara: con la rugosidad de tabla reflejaba las luces del
// estudio como un espejo y, de frente, se perdía contra el muro blanco. Más rugoso se lee satinado y estable.
const TUNE = { 'frame-light': { gain: 0.68, rough: 2.4 }, kickplate: { gain: 1.12 }, rubber: { gain: 2.6 }, gasket: { gain: 1.5 }, screw: { gain: 0.85 } };
// El original retoca un poco el frente del marco con cada acabado de hoja. Aquí queda igual en los tres:
// el retoque del inoxidable (más metal, más pulido) volvía a dejarlo casi blanco contra el muro.
const FIXED = new Set(['frame-light']);

// Cajas de encuadre (m): marco con las hojas cerradas, entreabiertas y abiertas hacia el frente
const BOX = { closed: [-1.26, 0, -0.06, 1.26, 2.53, 0.10], ajar: [-1.26, 0, -0.06, 1.26, 2.53, 0.60], open: [-1.26, 0, -0.06, 1.26, 2.53, 1.07] };

export function createVaiven(stage, reg) {
  const { root, slots } = createRig();
  // el marco queda dentro del vano del muro; detrás, el interior azul marino
  const backdrop = createBackdrop(stage, { opening: { left: -1.24, right: 1.24, top: 2.51 }, halfWidth: 12, height: 6, floorDepth: 14, interiorDepth: 1.6 });
  root.add(backdrop.group);

  // ---------- materiales ----------
  // La cara de la hoja usa el registro compartido. Todo lo demás sale de la tabla del original, con su misma clase
  // de superficie. La placa inferior es acero cepillado, salvo con la hoja inoxidable: ahí el original la pone negra mate.
  const presets = manifest.acabados_originales.presets, materials = {};
  const surface = (name, finish) => (name === 'kickplate' ? (finish === 'stainless' ? 'elastomero' : 'cepillado') : manifest.materiales[name].superficie);
  const def = (name, d, finish) => { const t = TUNE[name] || {}; return { color: d.color, metal: d.metal, rough: Math.min(1, d.rough * (t.rough ?? 1)), superficie: surface(name, finish), gain: t.gain }; };
  let finish = Object.keys(PRESET).find((k) => PRESET[k] === manifest.acabados_originales.inicial) || 'blackMetal';
  for (const [name, d] of Object.entries(manifest.materiales)) {
    // una cara y, a igual profundidad, gana la malla que se dibuja primero: como el original
    if (d.superficie !== 'acabado') materials[name] = materialFromOriginal(`vaiven/${name}`, def(name, d, finish), { depthFunc: THREE.LessDepth });
  }
  const panels = [], meshes = [];

  function applyFinish(name) {
    if (!reg.finishFor('vaiven').includes(name)) throw new Error(`Acabado no disponible en vaivén: ${name}`);
    finish = name;
    panels.forEach((m) => { m.material = reg.get(name); });
    for (const [k, v] of Object.entries(presets[PRESET[name]])) if (materials[k] && !FIXED.has(k)) updateFromOriginal(materials[k], def(k, v, name));
  }

  // ---------- hojas: giran sobre el eje del original, hacia el frente (+) o hacia atrás (−) ----------
  const hinges = [new Hinge(slots.left, { dir: 1, min: -MAX, max: MAX, mode: 'free' }), new Hinge(slots.right, { dir: -1, min: -MAX, max: MAX, mode: 'free' })];
  const hingeOf = { left: hinges[0], right: hinges[1] };
  stage.onFrame.add((dt) => hinges.forEach((h) => h.update(dt)));

  // ---------- geometría ----------
  const ready = fetch(binUrl).then((r) => { if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`); return r.arrayBuffer(); }).then((buf) => {
    if (buf.byteLength !== manifest.formato.bytes) throw new Error('El modelo llegó incompleto');
    for (const [i, grupo, material, nv, ni, po, no, io] of manifest.mallas) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, po, nv * 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(buf, no, nv * 3), 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, io, ni), 1));
      const panel = manifest.materiales[material].superficie === 'acabado';
      if (panel) finishUV(geo);                                 // los acabados compartidos llevan textura: necesitan UV
      const mesh = new THREE.Mesh(geo, panel ? reg.get(finish) : materials[material]);
      mesh.name = `${grupo}/${material}/${i}`; mesh.renderOrder = i; mesh.castShadow = true; mesh.receiveShadow = true;
      if (panel) panels.push(mesh);
      if (hingeOf[grupo]) mesh.userData.hinge = hingeOf[grupo];                // se puede tomar para girar su hoja
      slots[grupo].add(mesh); meshes.push(mesh);
    }
    applyFinish(finish);
  });

  // ---------- logo en las cuatro caras de las hojas (mismo PNG, tamaño y posición que el original) ----------
  new THREE.TextureLoader().load(logoUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
    const hw = 0.078, hh = (hw * 237) / 574;
    for (const [grp, cx] of [['left', 0.89], ['right', -0.89]]) for (const face of [1, -1]) {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2 * hw, 2 * hh), mat);
      q.position.set(cx, 2.283, face * 0.0223); q.rotation.y = face === 1 ? 0 : Math.PI; q.renderOrder = 1000; slots[grp].add(q);
    }
  });

  stage.scene.add(root);
  // lo que se puede tomar (las hojas) y lo que lo tapa (marco, muro y piso): manda lo primero que toque el puntero
  const blockers = []; backdrop.group.traverse((o) => { if (o.isMesh) blockers.push(o); });
  const pickables = () => [...meshes, ...blockers];
  const motion = hingeMotion(stage, hinges, pickables);
  motion.inside = (on) => hinges.forEach((h) => motion.to(h, on ? AJAR : 0));

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, slots, materials, meshes, hinges, ready, pickables, motion,
    get finish() { return finish; },
    setFinish(name) { applyFinish(name); },
    setInside: backdrop.setInside,
    // la cámara se queda delante del muro
    limits: { minDistance: 0.6, maxDistance: 11, minAzimuthAngle: -1.3, maxAzimuthAngle: 1.3, minPolarAngle: Math.PI * 0.28 },
    // anclas para los puntos de pieza: número de catálogo o, si la pieza no tiene, su id interno
    anchors: [
      { numero: '03', parent: slots.left, position: V(0.5675, 1.80, 0.03) },                       // ventanilla
      { numero: '02', parent: slots.right, position: V(-0.08, 2.21, 0.085) },                      // bisagra
      { numero: '06', parent: slots.left, position: V(0.56, 0.965, 0.07) },                        // bumper
      { numero: '01', parent: slots.right, position: V(0.0, 1.35, 0.04) },                         // empaque lateral
      { id: 'vaiven-perfil-aluminio-40-mm', parent: slots.left, position: V(1.125, 1.25, 0.034) }, // perfil de la hoja
    ],
    views: {
      general: (st) => frameBox(st, BOX.closed, -0.30, -0.08),
      frontal: (st) => frameBox(st, BOX.closed, 0, 0),
      abierta: (st) => frameBox(st, BOX.open, -0.10, 0.05),        // casi de frente: las dos hojas abiertas se ven por igual
      dosLados: (st) => frameBox(st, BOX.open, -0.30, -0.08),      // una hoja hacia el frente y otra hacia atrás
      interior: (st) => frameBox(st, BOX.ajar, -0.16, -0.04),
      bisagra: orbitView(1.145, 2.17, 0.05, -0.31, -0.09, 1.95),
      empaque: orbitView(-1.152, 1.34, 0, -1.03, -0.12, 3.3),
      mirilla: orbitView(-0.58, 1.74, 0.03, -0.25, 0.0, 1.95),
      bumper: orbitView(-0.58, 0.62, 0.05, -0.35, 0.08, 2.4),
    },
  };
}

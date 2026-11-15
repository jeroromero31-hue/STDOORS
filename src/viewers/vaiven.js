// Puerta vaivén de doble hoja. Migración del modelo aprobado (01_MODELOS_ORIGINALES/VAIVEN_V13_MODELO_BASE.html):
//   · Geometría: los mismos vértices y normales, malla por malla (src/models/vaiven.bin).
//   · Giro: cada hoja sobre el mismo eje del original, hasta la misma apertura y hacia los dos lados.
//   · Acabados: negro, inoxidable y blanco sanitario, con las MISMAS instancias de material que la abatible.
// Lo que cambia frente al original está en docs/DIFERENCIAS_CON_ORIGINALES.md.
import * as THREE from 'three';
import manifest from '../models/vaiven.json';
import binUrl from '../models/vaiven.bin?url';
import logoUrl from '../models/logo-hoja.png';
import { createRig, VAIVEN, axisLocal, widenFrame, splitPieces } from './vaiven.rig.js';
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

// Mallas del original que no se dibujan (Fase 3C-2, docs/DIFERENCIAS_CON_ORIGINALES.md):
// static/gasket son tres tiras negras pegadas al marco SOLO por el frente. Tapaban el perfil de aluminio de cada hoja
// del lado de la bisagra y arriba (por detrás sí se veía), se metían 7 mm en ese perfil y se quedaban en el aire al
// abrir la hoja. El empaque real va en la hoja (left/gasket, right/gasket) y ese sí se conserva.
const OMIT = new Set(['static/gasket']);

// Cajas de encuadre (m): marco con las hojas cerradas, entreabiertas y abiertas hacia el frente
const W = 1.2495 + VAIVEN.frame.shift + 0.01, H = 2.5205 + VAIVEN.frame.lift + 0.01;
const BOX = { closed: [-W, 0, -0.10, W, H, 0.10], ajar: [-W, 0, -0.10, W, H, 0.62], open: [-W, 0, -0.10, W, H, 1.16] };

// opts.onProgress(0…1): avance de la descarga del modelo (la usa la entrada del Inicio)
export function createVaiven(stage, reg, { onProgress } = {}) {
  const { root, slots } = createRig();
  // el marco queda dentro del vano del muro; detrás, el interior azul marino
  const backdrop = createBackdrop(stage, { opening: { left: -(1.24 + VAIVEN.frame.shift), right: 1.24 + VAIVEN.frame.shift, top: 2.51 + VAIVEN.frame.lift }, halfWidth: 12, height: 6, floorDepth: 14, interiorDepth: 1.6 });
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
  const hinges = [new Hinge(slots.left, { dir: 1, min: -MAX, max: MAX, mode: 'free', axis: axisLocal(1) }), new Hinge(slots.right, { dir: -1, min: -MAX, max: MAX, mode: 'free', axis: axisLocal(-1) })];

  // Mitad fija de cada bisagra: la columna de nudillos (todo el herraje que queda del lado del poste). Hay una por cara.
  // La del lado hacia el que abre la hoja es el eje y se queda en el marco; la de la cara contraria acompaña a la hoja,
  // como el eslabón central de una bisagra de doble acción. Cerrada, las dos están en reposo.
  const knuckles = {};
  for (const [grp, h] of [['left', hinges[0]], ['right', hinges[1]]]) {
    const g = { front: new THREE.Group(), back: new THREE.Group() };
    for (const k of ['front', 'back']) { g[k].name = `Nudillos-${grp}-${k}`; g[k].position.copy(slots[grp].position); slots.static.add(g[k]); }
    knuckles[grp] = g;
    h.onChange(() => {
      const sd = h.side();
      for (const [k, kside] of [['front', 1], ['back', -1]]) {
        const follow = sd !== 0 && sd !== kside;
        g[k].position.copy(follow ? h.pivot.position : h.base); g[k].rotation.y = follow ? h.pivot.rotation.y : 0;
      }
    });
  }
  const isHardware = (mat) => /^hinge|^screw/.test(mat);
  const hingeOf = { left: hinges[0], right: hinges[1] };
  stage.onFrame.add((dt) => hinges.forEach((h) => h.update(dt)));

  // ---------- geometría ----------
  const ready = fetch(binUrl).then((r) => { if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`); return readBody(r, manifest.formato.bytes, onProgress); }).then((buf) => {
    if (buf.byteLength !== manifest.formato.bytes) throw new Error('El modelo llegó incompleto');
    for (const [i, grupo, material, nv, ni, po, no, io] of manifest.mallas) {
      if (OMIT.has(`${grupo}/${material}`)) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, po, nv * 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(buf, no, nv * 3), 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, io, ni), 1));
      if (grupo === 'static' && (material === 'frame' || material === 'frame-light')) widenFrame(geo, material === 'frame-light');
      const panel = manifest.materiales[material].superficie === 'acabado';
      if (panel) finishUV(geo);                                 // los acabados compartidos llevan textura: necesitan UV
      const add = (g, parent, name, hinge) => {
        const mesh = new THREE.Mesh(g, panel ? reg.get(finish) : materials[material]);
        mesh.name = name; mesh.renderOrder = i; mesh.castShadow = true; mesh.receiveShadow = true;
        if (panel) panels.push(mesh);
        if (hinge) mesh.userData.hinge = hinge;                 // se puede tomar para girar su hoja
        parent.add(mesh); meshes.push(mesh);
      };
      if (hingeOf[grupo] && isHardware(material)) {
        // herraje: lo que queda del lado del poste (nudillos, tapas, perno) pasa a la mitad fija de su cara
        const dir = hingeOf[grupo].dir, parts = splitPieces(geo, (c) => (dir * c.x < 0 ? (c.z > 0 ? 'front' : 'back') : 'leaf'));
        if (parts.leaf) add(parts.leaf, slots[grupo], `${grupo}/${material}/${i}`, hingeOf[grupo]);
        for (const k of ['front', 'back']) if (parts[k]) add(parts[k], knuckles[grupo][k], `${grupo}/${material}/${i}/fija-${k}`, null);
      } else add(geo, slots[grupo], `${grupo}/${material}/${i}`, hingeOf[grupo]);
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
  // Las dos hojas no se mueven a la vez cerca del cierre: sus empaques de canto se cruzarían hasta 6.7 mm hacia los 6°
  // (docs/DIFERENCIAS_CON_ORIGINALES.md). Al abrir, la segunda arranca cuando la primera pasa de 12°; al cerrar, la
  // primera espera a que la segunda esté cerrada.
  const STAGGER = 12; let wait = null;
  stage.onFrame.add(() => { if (wait && wait.ready()) { const w = wait; wait = null; w.go(); } });
  const pair = ([a0, a1]) => {
    const [h0, h1] = hinges; wait = null;
    const same = (x, y) => x !== 0 && y !== 0 && Math.sign(x) === Math.sign(y);
    if (same(a0, a1) && Math.abs(h0.angle) < STAGGER && Math.abs(h1.angle) < STAGGER) {           // abrir juntas
      motion.to(h0, a0); wait = { ready: () => Math.abs(h0.angle) >= STAGGER || matchMedia('(prefers-reduced-motion: reduce)').matches, go: () => motion.to(h1, a1) };
    } else if (a0 === 0 && a1 === 0 && same(h0.angle, h1.angle)) {                               // cerrar juntas
      motion.to(h1, 0); wait = { ready: () => h1.angle === 0, go: () => motion.to(h0, 0) };
    } else { motion.to(h0, a0); motion.to(h1, a1); }
  };
  motion.setOpen = (on) => pair(on ? [MAX, MAX] : [0, 0]);
  motion.inside = (on) => pair(on ? [AJAR, AJAR] : [0, 0]);
  motion.step = (d) => { if (d.open === undefined) return; const a = String(d.open).split(',').map(Number); pair([a[0], a[1] ?? a[0]]); };

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
      { numero: '02', parent: slots.right, position: V(-0.08, 2.17, 0.083) },                        // bisagra
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

// Lee la respuesta por partes para poder avisar el avance; sin aviso que dar, la lee de una vez.
async function readBody(r, total, onProgress) {
  if (!onProgress || !r.body || !r.body.getReader) return r.arrayBuffer();
  const out = new Uint8Array(total), reader = r.body.getReader(); let n = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    if (n + value.length > total) throw new Error('El modelo llegó con más datos de los esperados');
    out.set(value, n); n += value.length; onProgress(n / total);
  }
  return n === total ? out.buffer : out.buffer.slice(0, n);
}

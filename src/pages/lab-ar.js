// Interno (Fases 10J y 10K): exporta cada puerta a GLB para «Verla en tu espacio» (scripts/build-ar.py).
//
// Fase 10K · el modelo ya no es una foto fija:
// - Lleva su movimiento: el clip «abrir» (y «cerrar», al revés) se toma de la misma puerta del sitio, moviéndola paso a
//   paso (bisagra, riel con su levante, las dos hojas del vaivén, las tres puertas de la CDS) y guardando dónde queda
//   cada pieza. Las piezas que se mueven juntas forman un grupo con su propio nodo y su pista de animación.
// - Todo queda «horneado» en coordenadas del mundo: sin escalas negativas (las puertas de mano izquierda de la CDS se
//   reflejan en la geometría) ni instancias (los productos de la CDS son mallas normales). Así el visor de iPhone
//   (Quick Look, que no admite ninguna de las dos cosas) ve lo mismo que Android.
// - CDS: seis productos «destacados» van sueltos, cada uno con su clip «tomar-N»: sale de la parrilla, viene hacia ti,
//   gira para enseñar la etiqueta y regresa (las puertas se quedan abiertas durante el clip).
// - Para que el sitio pueda hacer la puerta a la medida del cliente sin estirar herrajes, se guardan las franjas
//   «rígidas» del modelo (bisagras, manijas, perfiles, rieles…): src/ui/arResize.js estira solo lo que hay entre ellas.
import '../styles/tokens.css';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createStage } from '../core/stage.js';
import { createFinishRegistry } from '../materials/FinishRegistry.js';
import { createAbatible } from '../viewers/abatible.js';
import { createCorrediza } from '../viewers/corrediza.js';
import { applyPose, TRAVEL } from '../viewers/corrediza.kinematics.js';
import { createVaiven } from '../viewers/vaiven.js';
import { VAIVEN } from '../viewers/vaiven.rig.js';
import { createCDS } from '../viewers/cds.js';
import { SKUS } from '../viewers/cds/legacy.js';

const puerta = new URLSearchParams(location.search).get('puerta') || 'abatible';
globalThis.__stLathe = 20;                // productos de la CDS: botellas con 20 caras en vez de 48 (pesa menos en el teléfono)
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
const deg = THREE.MathUtils.degToRad;

// pose de apertura s ∈ [0, 1] (0 cerrada)
const OPEN = { abatible: 90, vaiven: THREE.MathUtils.radToDeg(VAIVEN.openAngle), cds: 90 };
const POSE = {
  abatible: (s) => viewer.hinge.jump(OPEN.abatible * s),
  corrediza: (s) => { viewer.slider.jump(s); applyPose(viewer.nodes, s, 0); },
  vaiven: (s) => viewer.hinges.forEach((h) => h.jump(OPEN.vaiven * s)),
  cds: (s) => viewer.doors.forEach((d) => { d.pivot.rotation.y = deg(OPEN.cds * s); }),
};
const DUR = { abatible: 1.6, corrediza: 2.6, vaiven: 1.4, cds: 1.5 };
const KEYS = 25;
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

// ---------- qué se exporta ----------
function hiddenByName(o) { for (let p = o; p; p = p.parent) if (OFF.test(p.name)) return true; return false; }
function usable(o) {
  if (!o.isMesh || hiddenByName(o) || o.userData.role === 'hidden') return false;
  const mats = Array.isArray(o.material) ? o.material : [o.material];
  return mats.every((m) => m && !m.isShaderMaterial && !m.isSpriteMaterial && m.visible !== false && m.colorWrite !== false && !(m.transparent && m.opacity < 0.02));
}
function collect() {
  const list = [];
  stage.scene.updateMatrixWorld(true);
  stage.scene.traverseVisible((o) => { if (usable(o)) list.push(o); });
  return list;
}

// geometría limpia (posición, normal y uv si hay), con índice, horneada con la matriz dada; si la matriz refleja,
// se invierte el orden de los triángulos para que las caras sigan mirando hacia afuera
function bake(geo, m, keepUv) {
  let g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) {
    let a = geo.getAttribute(k); if (!a || (k === 'uv' && !keepUv)) continue;
    if (a.isInterleavedBufferAttribute) a = a.clone(); else a = a.clone();
    g.setAttribute(k, a);
  }
  if (geo.index) g.setIndex(geo.index.clone());
  else { const n = g.getAttribute('position').count, idx = new (n > 65535 ? Uint32Array : Uint16Array)(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new THREE.BufferAttribute(idx, 1)); }
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  g.applyMatrix4(m);
  if (m.determinant() < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.index.needsUpdate = true; }
  // índices de 32 bits en todos: mergeGeometries exige el mismo tipo
  if (!(g.index.array instanceof Uint32Array)) g.setIndex(new THREE.BufferAttribute(Uint32Array.from(g.index.array), 1));
  return g;
}
const sig = (g) => ['position', 'normal', 'uv'].filter((k) => g.getAttribute(k)).join('+');

window.exportAR = async () => {
  await (viewer.ready || Promise.resolve());
  if (puerta === 'cds' && viewer.setLED) viewer.setLED(true);
  if (puerta === 'cds' && viewer.products) viewer.products.setMaxRows(2);
  await new Promise((r) => setTimeout(r, 800));
  const hidden = [];
  stage.scene.traverse((o) => { if ((OFF.test(o.name) || o.isLight || o.isSprite || o.isLine || o.isPoints) && o.visible) { o.visible = false; hidden.push(o); } });

  POSE[puerta](0); const meshes = collect();
  const plain = meshes.filter((m) => !m.isInstancedMesh), inst = meshes.filter((m) => m.isInstancedMesh);

  // ---------- productos destacados de la CDS ----------
  const featured = [];
  if (puerta === 'cds') {
    const recs = viewer.products.records.filter((r) => r.row === 0);
    const used = new Set();
    for (let bay = 0; bay < 3; bay++) {
      const cand = recs.filter((r) => r.bay === bay).map((r) => ({ r, y: new THREE.Vector3().setFromMatrixPosition(r.world).y }))
        .filter((c) => c.y > 0.75 && c.y < 1.55).sort((a, b) => Math.abs(a.y - 1.15) - Math.abs(b.y - 1.15) || Math.abs(a.r.lane - 2) - Math.abs(b.r.lane - 2));
      let n = 0;
      for (const c of cand) { if (n >= 2 || used.has(c.r.skuId)) continue; used.add(c.r.skuId); featured.push(c.r); n++; }
    }
  }
  const featKey = new Set(featured.map((r) => `${r.skuId}:${r.index}`));

  // ---------- muestreo del movimiento ----------
  const S = Array.from({ length: KEYS }, (_, k) => ease(k / (KEYS - 1)));
  const W = plain.map(() => []);
  S.forEach((s) => { POSE[puerta](s); stage.scene.updateMatrixWorld(true); plain.forEach((m, i) => W[i].push(m.matrixWorld.clone())); });
  POSE[puerta](0); stage.scene.updateMatrixWorld(true);
  const rel = plain.map((m, i) => { const inv = W[i][0].clone().invert(); return W[i].map((w) => w.clone().multiply(inv)); });
  const isI = (a) => a.every((M) => M.elements.every((e, j) => Math.abs(e - (j % 5 === 0 ? 1 : 0)) < 1e-5));
  const same = (a, b) => a.every((M, k) => M.elements.every((e, j) => Math.abs(e - b[k].elements[j]) < 2e-4));
  const clusters = [];            // { rel, members: [i] }
  const clusterOf = plain.map((m, i) => {
    if (isI(rel[i])) return -1;
    let c = clusters.findIndex((cl) => same(cl.rel, rel[i]));
    if (c < 0) { clusters.push({ rel: rel[i], members: [] }); c = clusters.length - 1; }
    clusters[c].members.push(i); return c;
  });

  // ---------- escena de exportación ----------
  const out = new THREE.Scene(); out.name = `ST ${puerta}`;
  const fixed = new THREE.Group(); fixed.name = 'fijo'; out.add(fixed);
  const box = new THREE.Box3(), tmpBox = new THREE.Box3();
  const parts = [];               // { key, node, geo, mat }
  const add = (node, key, geo, mat) => { let p = parts.find((q) => q.node === node && q.key === key); if (!p) { p = { node, key, geos: [], mat }; parts.push(p); } p.geos.push(geo); };
  const boxes = [];               // cajas por malla (en reposo) para las franjas rígidas
  const nodeOf = clusters.map((cl, c) => {
    const bb = new THREE.Box3(); cl.members.forEach((i) => { tmpBox.setFromObject(plain[i]); bb.union(tmpBox); });
    const g = new THREE.Group(); g.name = `mov${c}`; g.position.copy(bb.getCenter(new THREE.Vector3())); out.add(g); cl.center = g.position.clone(); cl.box = bb;
    return g;
  });
  const matsOf = (m) => (Array.isArray(m.material) ? m.material : [m.material]);
  const emit = (node, center, srcGeo, material, mWorld) => {
    const mats = Array.isArray(material) ? material : [material];
    const groups = Array.isArray(material) && srcGeo.groups.length ? srcGeo.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    for (const gr of groups) {
      const mat = mats[gr.materialIndex]; if (!mat) continue;
      let src = srcGeo;
      if (groups.length > 1 || gr.start > 0) { src = srcGeo.clone(); const ix = srcGeo.index.array.slice(gr.start, Math.min(srcGeo.index.count, gr.start + gr.count)); src.setIndex(new THREE.BufferAttribute(ix, 1)); src.clearGroups(); }
      const g = bake(src, mWorld, !!(mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap || mat.alphaMap || mat.emissiveMap || mat.aoMap));
      if (center) g.translate(-center.x, -center.y, -center.z);
      add(node, `${mat.uuid}|${sig(g)}`, g, mat);
    }
  };
  plain.forEach((m, i) => {
    const c = clusterOf[i];
    emit(c < 0 ? fixed : nodeOf[c], c < 0 ? null : clusters[c].center, m.geometry, m.material, W[i][0]);
    tmpBox.setFromObject(m); box.union(tmpBox); boxes.push({ box: tmpBox.clone(), moving: c >= 0 });
  });
  // productos (instancias): fijos, salvo los destacados
  const prodNodes = [];
  if (puerta === 'cds') {
    featured.forEach((r, k) => {
      const g = new THREE.Group(); g.name = `prod${k}`; out.add(g);
      const bb = new THREE.Box3();
      for (const mesh of inst.filter((im) => im.userData.skuId === r.skuId)) {
        const mw = mesh.matrixWorld.clone().multiply(r.world);
        const geo = mesh.geometry.clone(); geo.applyMatrix4(mw); geo.computeBoundingBox(); bb.union(geo.boundingBox);
      }
      g.position.copy(bb.getCenter(new THREE.Vector3())); prodNodes.push({ node: g, rec: r, box: bb, name: SKUS[r.skuId] ? SKUS[r.skuId].name : 'Producto' });
    });
  }
  for (const mesh of inst) {
    const recs = viewer.products.bySku.get(mesh.userData.skuId) || [];
    for (let j = 0; j < mesh.count; j++) {
      const r = recs[j]; const mw = new THREE.Matrix4(); mesh.getMatrixAt(j, mw); mw.premultiply(mesh.matrixWorld);
      const f = r && featKey.has(`${r.skuId}:${r.index}`) ? prodNodes.find((p) => p.rec === r) : null;
      emit(f ? f.node : fixed, f ? f.node.position : null, mesh.geometry, mesh.material, mw);
    }
  }
  // una malla por material y grupo
  for (const p of parts) {
    const geo = p.geos.length > 1 ? mergeGeometries(p.geos, false) : p.geos[0];
    if (!geo) { console.warn('no se pudo unir', p.key); continue; }
    if (geo.getAttribute('position').count < 65536 && geo.index) geo.setIndex(new THREE.BufferAttribute(Uint16Array.from(geo.index.array), 1));
    const mesh = new THREE.Mesh(geo, p.mat); mesh.name = `${p.node.name}-${p.node.children.length}`; p.node.add(mesh);
  }

  // ---------- clips ----------
  const times = Float32Array.from(S.map((_, k) => (DUR[puerta] * k) / (KEYS - 1)));
  const tracksAt = (pick) => clusters.flatMap((cl, c) => {
    const pos = [], quat = [], scl = []; let scaled = false;
    S.forEach((_, k) => {
      const M = pick(cl, k).clone().multiply(new THREE.Matrix4().makeTranslation(cl.center.x, cl.center.y, cl.center.z));
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); M.decompose(p, q, s);
      pos.push(p.x, p.y, p.z); quat.push(q.x, q.y, q.z, q.w); scl.push(s.x, s.y, s.z); if (Math.abs(s.x - 1) + Math.abs(s.y - 1) + Math.abs(s.z - 1) > 1e-4) scaled = true;
    });
    const n = nodeOf[c].name, t = [new THREE.VectorKeyframeTrack(`${n}.position`, times, pos), new THREE.QuaternionKeyframeTrack(`${n}.quaternion`, times, quat)];
    if (scaled) t.push(new THREE.VectorKeyframeTrack(`${n}.scale`, times, scl));
    return t;
  });
  const abrir = new THREE.AnimationClip('abrir', DUR[puerta], tracksAt((cl, k) => cl.rel[k]));
  const reverse = (clip, name) => new THREE.AnimationClip(name, clip.duration, clip.tracks.map((tr) => {
    const n = tr.getValueSize(), v = tr.values, out2 = new Float32Array(v.length), K = tr.times.length;
    for (let k = 0; k < K; k++) for (let j = 0; j < n; j++) out2[k * n + j] = v[(K - 1 - k) * n + j];
    return new tr.constructor(tr.name, tr.times, out2);
  }));
  const clips = [abrir, reverse(abrir, 'cerrar')];

  // tipo de movimiento de cada grupo: «rot» si gira sobre un eje vertical fijo (bisagras), con su punto de giro; si no, «mov»
  clusters.forEach((cl, c) => {
    const M = cl.rel[KEYS - 1], e = M.elements;
    const a = 1 - e[0], b = -e[8], cc = -e[2], d = 1 - e[10], det = a * d - b * cc;
    let kind = 'mov', pivot = null;
    if (Math.abs(det) > 1e-3 && Math.abs(e[13]) < 1e-4 && Math.abs(1 - e[5]) < 1e-4) {
      const x = (d * e[12] - b * e[14]) / det, z = (-cc * e[12] + a * e[14]) / det;
      const ok = cl.rel.every((R) => { const v = new THREE.Vector3(x, 0, z).applyMatrix4(R); return Math.hypot(v.x - x, v.z - z) < 1e-3; });
      if (ok) { kind = 'rot'; pivot = [x, cl.center.y, z]; }
    }
    nodeOf[c].userData.st = { kind, pivot };
  });

  // CDS: «tomar-N»: puertas abiertas todo el clip y el producto N de ida y vuelta
  const products = [];
  if (puerta === 'cds') {
    const openTracks = (dur, n) => clusters.flatMap((cl, c) => {
      const M = cl.rel[KEYS - 1].clone().multiply(new THREE.Matrix4().makeTranslation(cl.center.x, cl.center.y, cl.center.z));
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); M.decompose(p, q, s);
      const tt = Float32Array.from([0, dur]); const nm = nodeOf[c].name;
      return [new THREE.VectorKeyframeTrack(`${nm}.position`, tt, [p.x, p.y, p.z, p.x, p.y, p.z]), new THREE.QuaternionKeyframeTrack(`${nm}.quaternion`, tt, [q.x, q.y, q.z, q.w, q.x, q.y, q.z, q.w])];
    });
    const midX = (box.min.x + box.max.x) / 2;
    prodNodes.forEach((p, k) => {
      const c0 = p.node.position.clone(), out1 = c0.clone().add(new THREE.Vector3(0, 0.025, 0.34));
      const near = new THREE.Vector3(c0.x * 0.55 + midX * 0.45, 1.38, 0.82), near2 = near.clone().add(new THREE.Vector3(0, 0.05, 0.04));
      const T = [0, 0.7, 1.5, 2.5, 3.3, 4.0, 4.6];
      const P = [c0, out1, near, near2, near, out1, c0];
      const R = [0, 0, 0.45, -0.55, 0.2, 0, 0].map((y, i) => new THREE.Quaternion().setFromEuler(new THREE.Euler(i === 2 || i === 3 ? -0.18 : 0, y, 0)));
      const tt = Float32Array.from(T);
      const name = p.node.name;
      const tracks = [new THREE.VectorKeyframeTrack(`${name}.position`, tt, P.flatMap((v) => [v.x, v.y, v.z])), new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, tt, R.flatMap((q) => [q.x, q.y, q.z, q.w])), ...openTracks(T[T.length - 1])];
      clips.push(new THREE.AnimationClip(`tomar-${k}`, T[T.length - 1], tracks));
      products.push({ clip: `tomar-${k}`, nombre: p.name, punto: [c0.x, p.box.max.y + 0.03, p.box.max.z + 0.01], cerca: [near.x, near.y + 0.03, near.z], bahia: p.rec.bay });
    });
  }

  // ---------- franjas rígidas (para hacerla a la medida sin estirar herrajes) ----------
  // Las piezas chicas (herrajes, tornillos, logo), las delgadas en un sentido (perfiles, rieles, guías) y la ventanilla
  // marcan franjas que no se estiran: en ancho (x) y en alto (y), cada una por separado.
  const size = box.getSize(new THREE.Vector3());
  const spans = { x: [], y: [] };
  for (const b of boxes) {
    const s = b.box.getSize(new THREE.Vector3());
    const small = s.x < 0.35 * size.x && s.y < 0.45 * size.y;
    if (small || s.x < 0.12) spans.x.push([b.box.min.x - 0.01, b.box.max.x + 0.01]);
    if (small || s.y < 0.16) spans.y.push([b.box.min.y - 0.01, b.box.max.y + 0.01]);
  }
  const merge = (list) => { list.sort((p, q) => p[0] - q[0]); const o = []; for (const s of list) { const l = o[o.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else o.push([...s]); } return o.map((s) => s.map((v) => +v.toFixed(4))); };

  // vano del modelo: el hueco del muro (lo que mide el cliente)
  let vano;
  if (puerta === 'abatible') vano = { w: 0.90, h: 1.95, cx: 0, floor: 0 };
  else if (puerta === 'vaiven') vano = { w: 2 * (1.24 + VAIVEN.frame.shift), h: 2.51 + VAIVEN.frame.lift, cx: 0, floor: 0 };
  else if (puerta === 'corrediza') {
    const cb = new THREE.Box3(); viewer.meshes.filter((m) => /^door\/rim\//.test(m.name)).forEach((m) => cb.expandByObject(m));
    const floor = -0.495;
    vano = { w: cb.max.x - cb.min.x - 0.2, h: cb.max.y - floor - 0.1, cx: (cb.min.x + cb.max.x) / 2, floor };
  } else vano = { w: box.max.x - box.min.x, h: box.max.y - box.min.y, cx: (box.min.x + box.max.x) / 2, floor: box.min.y };

  // punto para «Ábrela»: al frente de la hoja, a la altura de la mano
  const leaves = clusters.map((cl) => cl.box).sort((p, q) => q.getSize(new THREE.Vector3()).y - p.getSize(new THREE.Vector3()).y);
  const lb = leaves[0] || box;
  const tap = puerta === 'vaiven' || puerta === 'cds' ? [vano.cx, Math.min(1.15 + vano.floor, lb.max.y - 0.2), lb.max.z + 0.01] : [(lb.min.x + lb.max.x) / 2, Math.min(1.2 + vano.floor, lb.max.y - 0.2), lb.max.z + 0.01];

  // si el piso real queda abajo de la pieza más baja (corrediza: la hoja cuelga sobre su guía), una marca invisible en el
  // piso: la cámara pone en el piso lo más bajo del modelo, así la puerta queda a su altura real
  if (vano.floor < box.min.y - 0.005) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    mark.name = 'piso'; mark.position.set(vano.cx, vano.floor, 0); fixed.add(mark);
  }
  const glb = await new GLTFExporter().parseAsync(out, { binary: true, onlyVisible: true, maxTextureSize: 512, animations: clips });
  hidden.forEach((o) => { o.visible = true; });
  const bytes = new Uint8Array(glb); let str = '';
  for (let i = 0; i < bytes.length; i += 0x8000) str += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  const stats = { mallas: plain.length + inst.length, grupos: clusters.length, nodos: out.children.length, partes: parts.length };
  return {
    b64: btoa(str), vano, box: { min: box.min.toArray(), max: box.max.toArray() }, stats,
    franjas: { x: merge(spans.x), y: merge(spans.y) },
    clips: Object.fromEntries(clips.map((c) => [c.name, +c.duration.toFixed(3)])),
    abrir: { punto: tap.map((v) => +v.toFixed(4)) },
    recorrido: puerta === 'corrediza' ? TRAVEL : null,
    productos: products.map((p) => ({ ...p, punto: p.punto.map((v) => +v.toFixed(4)), cerca: p.cerca.map((v) => +v.toFixed(4)) })),
  };
};
window.__ready = true;

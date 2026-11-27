// Fase 10K · la puerta de «Verla en tu espacio», a la medida del cliente sin estirar herrajes.
//
// Antes (10J) el modelo se estiraba completo: con un vano más alto las bisagras y la manija salían alargadas, y al
// abrir la hoja cambiaba de ancho. Ahora se estira solo lo que hay ENTRE las franjas rígidas del modelo (bisagras,
// manijas, chapas, tornillos, ventanillas, perfiles, rieles; las calcula lab/ar.html al exportar): cada franja se
// mueve entera.
//  - A lo ancho, lo que está cerca de una orilla va con esa orilla; lo de en medio, proporcional (las ventanillas
//    del vaivén quedan al centro de su hoja). En la corrediza, lo que está del lado donde se estaciona la hoja se
//    recorre lo que crece la hoja, y su recorrido también.
//  - A lo alto, lo de arriba (bisagra superior, riel, cabezal) sube con el vano; lo demás (bisagra de abajo, manija,
//    ventanilla) se queda a la misma altura del piso, como en una puerta real.
// Se edita el GLB tal cual (posiciones de vértices, nodos y pistas de animación): no se vuelve a exportar y las
// texturas no se tocan, así que es inmediato.
const GAP = 0.01;

export function parseGlb(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('GLB inválido');
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const bl = dv.getUint32(20 + jl, true);
  const bin = new Uint8Array(buf, 28 + jl, bl);
  return { json, bin };
}
export function buildGlb(json, bin) {
  let enc = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (enc.length % 4)) % 4;
  if (pad) { const e2 = new Uint8Array(enc.length + pad).fill(0x20); e2.set(enc); enc = e2; }
  const bpad = (4 - (bin.length % 4)) % 4, blen = bin.length + bpad;
  const out = new Uint8Array(12 + 8 + enc.length + 8 + blen), o = new DataView(out.buffer);
  o.setUint32(0, 0x46546c67, true); o.setUint32(4, 2, true); o.setUint32(8, out.length, true);
  o.setUint32(12, enc.length, true); o.setUint32(16, 0x4e4f534a, true); out.set(enc, 20);
  o.setUint32(20 + enc.length, blen, true); o.setUint32(24 + enc.length, 0x004e4942, true); out.set(bin, 28 + enc.length);
  return out;
}

// función por tramos: franjas rígidas [a, b] con su desplazamiento; entre franjas, lineal
function piecewise(spans) {
  const pts = [];
  for (const s of spans) { pts.push([s.a, s.a + s.off]); pts.push([s.b, s.b + s.off]); }
  return (v) => {
    if (v <= pts[0][0]) return v + (pts[0][1] - pts[0][0]);
    for (let i = 1; i < pts.length; i++) {
      if (v <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x1 - x0 < 1e-9 ? y1 + (v - x1) : y0 + ((v - x0) / (x1 - x0)) * (y1 - y0); }
    }
    const [xl, yl] = pts[pts.length - 1]; return v + (yl - xl);
  };
}
// franjas reales + franjas de orilla (fijas), sin traslapes; luego se separan las que choquen al encoger
function settle(real, bands) {
  let list = real.map(([a, b, off]) => ({ a, b, off, band: false }));
  for (const bd of bands) {
    list = list.filter((s) => { if (s.b < bd.a || s.a > bd.b) return true; bd.a = Math.min(bd.a, s.a); bd.b = Math.max(bd.b, s.b); return false; });
  }
  list = [...list, ...bands.map((b) => ({ ...b, band: true }))].sort((p, q) => p.a - q.a);
  for (let it = 0; it < 6; it++) {
    let moved = false;
    for (let i = 0; i + 1 < list.length; i++) {
      const p = list[i], q = list[i + 1], over = (p.b + p.off + GAP) - (q.a + q.off);
      if (over <= 1e-6) continue;
      moved = true;
      if (p.band && q.band) continue;
      if (p.band) q.off += over; else if (q.band) p.off -= over; else { p.off -= over / 2; q.off += over / 2; }
    }
    if (!moved) break;
  }
  return list;
}

// las dos funciones (ancho y alto) para una puerta y una medida; null si es la medida del modelo
export function mapperFor(meta, fam, size) {
  const v = meta.vano, w2 = size.w, h2 = size.h;
  const dw = w2 - v.w, dh = h2 - v.h;
  if (Math.abs(dw) < 0.002 && Math.abs(dh) < 0.002) return null;
  const L = v.cx - v.w / 2, R = v.cx + v.w / 2, F = v.floor, T = v.floor + v.h;
  const D = meta.recorrido || 0;
  const topStick = fam === 'vaiven' ? 0.85 : fam === 'corrediza' ? 0.5 : 0.6;
  // ancho
  const xs = meta.franjas.x.map(([a, b]) => {
    const c = (a + b) / 2, u = (c - v.cx) / (v.w / 2);
    let off;
    if (fam === 'corrediza' && a > R + 0.05) off = dw / 2 + dw * Math.min(1, Math.max(0, (c - R) / D));
    else off = Math.abs(u) >= 0.6 ? Math.sign(u) * dw / 2 : u * dw / 2;
    return [a, b, off];
  });
  const xb = [{ a: -1e3, b: L + 0.01, off: -dw / 2 }];
  if (fam === 'corrediza') xb.push({ a: R - 0.01, b: R + 0.01, off: dw / 2 }, { a: R + D, b: 1e3, off: dw / 2 + dw });
  else xb.push({ a: R - 0.01, b: 1e3, off: dw / 2 });
  // alto
  const ys = meta.franjas.y.map(([a, b]) => [a, b, ((a + b) / 2 - F) / v.h > topStick ? dh : 0]);
  const yb = [{ a: -1e3, b: F + 0.02, off: 0 }, { a: T - 0.02, b: 1e3, off: dh }];
  return { x: piecewise(settle(xs, xb)), y: piecewise(settle(ys, yb)), slide: D ? (D + dw) / D : 1, dw, dh };
}
export const mapPoint = (m, p) => (m ? [m.x(p[0]), m.y(p[1]), p[2]] : p);

// lectura y escritura de accesores de tipo float (VEC3/VEC4) dentro del bloque binario
function view(json, bin, ai) {
  const a = json.accessors[ai], bv = json.bufferViews[a.bufferView];
  const n = { VEC3: 3, VEC4: 4, SCALAR: 1 }[a.type], stride = (bv.byteStride || n * 4) / 4;
  const off = (bin.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0));
  const f = new Float32Array(bin.buffer, off, ((a.count - 1) * stride + n));
  return { a, f, n, stride };
}

// GLB con la puerta a la medida (bytes nuevos; el original no se toca)
export function resizeGlb(buf, meta, fam, size, acabado = null) {
  const m = mapperFor(meta, fam, size);
  const src = parseGlb(buf);
  const bin = new Uint8Array(src.bin);            // copia
  const json = JSON.parse(JSON.stringify(src.json));
  finishGlb(json, fam, acabado || FINISH_MAT[fam]);   // sin elección, el acabado de fábrica (también pasa por aquí)
  if (!m) return { bytes: buildGlb(json, bin), map: null };
  const scene = json.scenes[json.scene || 0];
  for (const ni of scene.nodes) {
    const node = json.nodes[ni];
    const o = node.translation || [0, 0, 0];
    const moving = /^(mov|prod)/.test(node.name || '');
    const o2 = moving ? [m.x(o[0]), m.y(o[1]), o[2]] : o;
    // vértices de sus mallas
    for (const ci of node.children || []) {
      const child = json.nodes[ci]; if (child.mesh === undefined) continue;
      for (const prim of json.meshes[child.mesh].primitives) {
        const { a, f, stride } = view(json, bin, prim.attributes.POSITION);
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < a.count; i++) {
          const k = i * stride;
          const x = m.x(f[k] + o[0]) - o2[0], y = m.y(f[k + 1] + o[1]) - o2[1];
          f[k] = x; f[k + 1] = y;
          for (let j = 0; j < 3; j++) { const val = f[k + j]; if (val < min[j]) min[j] = val; if (val > max[j]) max[j] = val; }
        }
        a.min = min; a.max = max;
      }
    }
    if (moving) {
      node.translation = o2;
      // pistas de posición de este nodo en cada clip
      const st = (node.extras && node.extras.st) || {};
      for (const anim of json.animations || []) {
        const ch = anim.channels.filter((c) => c.target.node === ni);
        const tr = ch.find((c) => c.target.path === 'translation'), rot = ch.find((c) => c.target.path === 'rotation');
        if (!tr) continue;
        const T = view(json, bin, anim.samplers[tr.sampler].output);
        const Q = rot ? view(json, bin, anim.samplers[rot.sampler].output) : null;
        const pv = st.kind === 'rot' && st.pivot ? st.pivot : null, pv2 = pv ? [m.x(pv[0]), m.y(pv[1]), pv[2]] : null;
        for (let k = 0; k < T.a.count; k++) {
          const i = k * T.stride;
          if (pv && Q) {
            // giro sobre la bisagra: posición = bisagra' + R·(origen' − bisagra')
            const qi = k * Q.stride, qx = Q.f[qi], qy = Q.f[qi + 1], qz = Q.f[qi + 2], qw = Q.f[qi + 3];
            const vx = o2[0] - pv2[0], vy = o2[1] - pv2[1], vz = o2[2] - pv2[2];
            // v' = q·v·q*
            const ix = qw * vx + qy * vz - qz * vy, iy = qw * vy + qz * vx - qx * vz, iz = qw * vz + qx * vy - qy * vx, iw = -qx * vx - qy * vy - qz * vz;
            T.f[i] = pv2[0] + ix * qw + iw * -qx + iy * -qz - iz * -qy;
            T.f[i + 1] = pv2[1] + iy * qw + iw * -qy + iz * -qx - ix * -qz;
            T.f[i + 2] = pv2[2] + iz * qw + iw * -qz + ix * -qy - iy * -qx;
          } else {
            T.f[i] = o2[0] + (T.f[i] - o[0]) * m.slide; T.f[i + 1] = o2[1] + (T.f[i + 1] - o[1]); T.f[i + 2] = o2[2] + (T.f[i + 2] - o[2]);
          }
        }
        delete T.a.min; delete T.a.max;
      }
    }
  }
  return { bytes: buildGlb(json, bin), map: m };
}

// ---------- acabado (Fase 11) ----------
// La cámara y el visor reciben la puerta con el acabado elegido. Se cambia el material de la hoja dentro del GLB (y,
// en la abatible con inoxidable, también el marco, como en la página de la puerta). Como el USDZ del iPhone se arma de
// estos mismos bytes, Quick Look también lo lleva.
const lin = (hex) => [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
export const FINISH_PBR = {
  // Fase 14B · blanco sanitario como pintura lisa: sin la textura de relieve ni la laca (en la cámara del iPhone se
  // veía manchado y en Android, como plástico brillante)
  hygienicWhite: { color: '#eceeea', metal: 0, rough: 0.55 },
  blackMetal: { color: '#1c1d1f', metal: 0.3, rough: 0.5 },
  stainless: { color: '#c3c7ca', metal: 1, rough: 0.45 },
  // Fase 14C · CDS en cromo (bajo pedido): marco, puertas y jaladeras; en negro se queda como viene del modelo
  cromo: { color: '#e2e6e9', metal: 1, rough: 0.08 },
};
const FINISH_MAT = { abatible: 'hygienicWhite', vaiven: 'blackMetal', cds: 'cds-acabado' };
export function finishGlb(json, fam, acabado) {
  const base = FINISH_MAT[fam], look = FINISH_PBR[acabado];
  if (!base || !look) return;
  const idx = (json.materials || []).findIndex((x) => x.name === base);
  if (idx < 0) return;
  if (fam === 'cds') { json.materials.forEach((x) => { if (x.name === base) { const pbr = x.pbrMetallicRoughness || (x.pbrMetallicRoughness = {}); pbr.baseColorFactor = [...lin(look.color), 1]; pbr.metallicFactor = look.metal; pbr.roughnessFactor = look.rough; delete pbr.metallicRoughnessTexture; if (x.extensions) { delete x.extensions.KHR_materials_clearcoat; if (!Object.keys(x.extensions).length) delete x.extensions; } } }); return; }
  const paint = (mat) => {
    const pbr = mat.pbrMetallicRoughness || (mat.pbrMetallicRoughness = {});
    pbr.baseColorFactor = [...lin(look.color), 1]; pbr.metallicFactor = look.metal; pbr.roughnessFactor = look.rough;
    delete pbr.metallicRoughnessTexture;
    if (!look.keepNormal) delete mat.normalTexture;
    if (mat.extensions) { delete mat.extensions.KHR_materials_clearcoat; if (!Object.keys(mat.extensions).length) delete mat.extensions; }
    if (acabado === 'blackMetal') (mat.extensions ||= {}).KHR_materials_clearcoat = { clearcoatFactor: 0.1, clearcoatRoughnessFactor: 0.55 };
  };
  // abatible: con negro solo cambia la hoja (el marco queda blanco); con blanco o inoxidable, marco y hoja
  const leafOnly = fam === 'abatible' && acabado === 'blackMetal';   // en blanco, marco y hoja son el mismo blanco liso
  if (!leafOnly) { paint(json.materials[idx]); return; }
  const copy = JSON.parse(JSON.stringify(json.materials[idx])); copy.name = `${base}-hoja`; paint(copy);
  const ni = json.materials.push(copy) - 1;
  const scene = json.scenes[json.scene || 0];
  const walk = (n) => { const node = json.nodes[n]; if (node.mesh !== undefined) json.meshes[node.mesh].primitives.forEach((p) => { if (p.material === idx) p.material = ni; }); (node.children || []).forEach(walk); };
  scene.nodes.filter((n) => /^mov/.test(json.nodes[n].name || '')).forEach(walk);
}

// Empaquetado sin pérdidas de los modelos aprobados (corrediza y vaivén) y su comprobación.
//
// Los motores originales suben cada malla a la GPU como Float32Array(p) y Float32Array(n). Aquí se guardan esos
// mismos float32 (mismo patrón de bits), malla por malla y en el mismo orden. Solo cambia el empaquetado: los
// vértices repetidos dentro de una malla se guardan una vez y los triángulos pasan a ser índices.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const pkg = path.resolve(root, process.env.ST_PAQUETE || '../ST_DOORS_PAQUETE');
export const modelsDir = path.join(root, 'src/models');
export const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const isMain = (meta) => !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(meta.url);

export function readOriginal(rel) {
  const html = fs.readFileSync(path.join(pkg, rel), 'utf8');
  return { html, sha256: sha256(html), bytes: Buffer.byteLength(html) };
}

// meshes: [{ group, material, p, n, … }] tal como vienen en el original. Devuelve el binario y su índice.
export function packMeshes(meshes) {
  const f32 = new Float32Array(6), u32 = new Uint32Array(f32.buffer), out = [];
  let vertsIn = 0, vertsOut = 0, tris = 0, empty = 0;
  meshes.forEach((me, i) => {
    if (me.p.length !== me.n.length || me.p.length % 9) throw new Error(`Malla ${i}: longitudes incoherentes`);
    if (!me.p.length) { empty++; return; }               // el original las dibuja con count = 0
    const count = me.p.length / 3, index = new Map(), pos = [], nrm = [], idx = new Array(count);
    for (let v = 0; v < count; v++) {
      for (let k = 0; k < 3; k++) { f32[k] = me.p[v * 3 + k]; f32[3 + k] = me.n[v * 3 + k]; }
      const key = `${u32[0]},${u32[1]},${u32[2]},${u32[3]},${u32[4]},${u32[5]}`;   // patrón de bits: −0 y +0 no se mezclan
      let j = index.get(key);
      if (j === undefined) { j = pos.length / 3; index.set(key, j); pos.push(f32[0], f32[1], f32[2]); nrm.push(f32[3], f32[4], f32[5]); }
      idx[v] = j;
    }
    if (pos.length / 3 > 65535) throw new Error(`Malla ${i}: más de 65 535 vértices únicos; haría falta índice de 32 bits`);
    out.push({ i, grupo: me.group, material: me.material, pos: Float32Array.from(pos), nrm: Float32Array.from(nrm), idx: Uint16Array.from(idx) });
    vertsIn += count; vertsOut += pos.length / 3; tris += count / 3;
  });
  // [posiciones f32][normales f32][índices u16]: las secciones float quedan alineadas a 4 bytes sin relleno
  let off = 0;
  for (const m of out) { m.posOff = off; off += m.pos.byteLength; }
  for (const m of out) { m.nrmOff = off; off += m.nrm.byteLength; }
  for (const m of out) { m.idxOff = off; off += m.idx.byteLength; }
  const bin = Buffer.alloc(off);
  for (const m of out) { Buffer.from(m.pos.buffer).copy(bin, m.posOff); Buffer.from(m.nrm.buffer).copy(bin, m.nrmOff); Buffer.from(m.idx.buffer).copy(bin, m.idxOff); }
  return {
    bin,
    formato: {
      nota: 'Binario little-endian. Por malla: posiciones float32 xyz, normales float32 xyz, índices uint16. Mismos float32 que el motor original sube a la GPU.',
      bytes: bin.length, sha256: sha256(bin),
    },
    totales: { mallas: out.length, mallas_vacias_omitidas: empty, vertices_fuente: vertsIn, vertices_unicos: vertsOut, triangulos: tris },
    // [índice en el original, grupo, material, vértices únicos, índices, offset posiciones, offset normales, offset índices]
    mallas: out.map((m) => [m.i, m.grupo, m.material, m.pos.length / 3, m.idx.length, m.posOff, m.nrmOff, m.idxOff]),
  };
}

// Vuelve a expandir el binario y lo compara, float32 por float32, con las mallas del original (mismo orden).
export function compareGeometry(manifest, bin, meshes, fail) {
  const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  if (sha256(bin) !== manifest.formato.sha256) fail('El binario no corresponde al manifiesto');
  const src = meshes.map((m, i) => ({ ...m, i })).filter((m) => m.p.length);
  if (src.length !== manifest.mallas.length) fail(`Número de mallas distinto: fuente ${src.length}, binario ${manifest.mallas.length}`);
  const bits = (a, b) => { const x = new Uint32Array(a.buffer, a.byteOffset, a.length), y = new Uint32Array(b.buffer, b.byteOffset, b.length); let d = 0; for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) d++; return d; };
  let values = 0, diffs = 0, tris = 0;
  manifest.mallas.forEach(([i, grupo, material, nv, ni, po, no, io], k) => {
    const s = src[k];
    if (!s || s.i !== i || s.group !== grupo || s.material !== material) return fail(`Malla ${k}: orden, grupo o material distintos`);
    const pos = new Float32Array(buf, po, nv * 3), nrm = new Float32Array(buf, no, nv * 3), idx = new Uint16Array(buf, io, ni);
    if (ni * 3 !== s.p.length) return fail(`Malla ${i}: número de vértices distinto`);
    const P = new Float32Array(ni * 3), N = new Float32Array(ni * 3);
    for (let v = 0; v < ni; v++) for (let c = 0; c < 3; c++) { P[v * 3 + c] = pos[idx[v] * 3 + c]; N[v * 3 + c] = nrm[idx[v] * 3 + c]; }
    const d = bits(P, Float32Array.from(s.p)) + bits(N, Float32Array.from(s.n));   // Float32Array.from = lo que el original sube a la GPU
    if (d) fail(`Malla ${i} (${grupo}/${material}): ${d} valores distintos`);
    values += ni * 6; diffs += d; tris += ni / 3;
  });
  return { mallas: manifest.mallas.length, triangulos: tris, valores_comparados: values, valores_distintos: diffs, vertices_fuente: manifest.totales.vertices_fuente, vertices_unicos: manifest.totales.vertices_unicos };
}

// Logo impreso en la hoja: el PNG incrustado en los originales (574 × 237, un solo azul con borde suavizado).
// Sus píxeles transparentes traen RGB negro; se les pone el mismo azul para que el filtrado de la textura no
// oscurezca el borde. La forma (canal alfa) y el color visible no cambian.
export async function writeLeafLogo(base64) {
  const { data: px, info } = await sharp(Buffer.from(base64, 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = null;
  for (let k = 0; k < px.length; k += 4) if (px[k + 3] === 255) { if (!ink) ink = [px[k], px[k + 1], px[k + 2]]; else if (px[k] !== ink[0] || px[k + 1] !== ink[1] || px[k + 2] !== ink[2]) throw new Error('El logo ya no es de un solo color'); }
  for (let k = 0; k < px.length; k += 4) if (px[k + 3] < 255) { px[k] = ink[0]; px[k + 1] = ink[1]; px[k + 2] = ink[2]; }
  const png = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  const file = path.join(modelsDir, 'logo-hoja.png');
  // corrediza y vaivén llevan el mismo logo: un solo archivo para las dos
  if (fs.existsSync(file) && !fs.readFileSync(file).equals(png)) throw new Error('El logo de este modelo no coincide con src/models/logo-hoja.png');
  fs.mkdirSync(modelsDir, { recursive: true }); fs.writeFileSync(file, png);
  return { ancho: info.width, alto: info.height, color: `#${ink.map((v) => v.toString(16).padStart(2, '0')).join('')}`, sha256_original: sha256(Buffer.from(base64, 'base64')) };
}

export function writeModel(name, manifest, bin) {
  fs.mkdirSync(modelsDir, { recursive: true });
  fs.writeFileSync(path.join(modelsDir, `${name}.bin`), bin);
  fs.writeFileSync(path.join(modelsDir, `${name}.json`), JSON.stringify(manifest));
  const t = manifest.totales;
  console.log(`${name}: ${t.mallas} mallas (${t.mallas_vacias_omitidas} vacías omitidas), ${t.vertices_fuente} vértices → ${t.vertices_unicos} únicos, ${t.triangulos} triángulos`);
  console.log(`binario ${(bin.length / 1024).toFixed(0)} KB · manifiesto ${(fs.statSync(path.join(modelsDir, `${name}.json`)).size / 1024).toFixed(1)} KB · fuente ${(manifest.fuente.bytes / 1048576).toFixed(2)} MB`);
}
export const readModel = (name) => ({ manifest: JSON.parse(fs.readFileSync(path.join(modelsDir, `${name}.json`), 'utf8')), bin: fs.readFileSync(path.join(modelsDir, `${name}.bin`)) });

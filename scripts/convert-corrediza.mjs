// Convierte la geometría del modelo aprobado de la corrediza a un binario compacto, SIN PÉRDIDAS.
//
//   Fuente (solo lectura): 01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html  →  <script id="mesh-data">
//   Salida:                src/models/corrediza.bin  +  src/models/corrediza.json  +  src/models/corrediza-logo.png
//
// El motor original sube cada malla a la GPU como Float32Array(p) y Float32Array(n). Aquí se guardan exactamente
// esos mismos float32 (mismo patrón de bits), una malla por malla y en el mismo orden. Lo único que cambia es el
// empaquetado: los vértices repetidos dentro de una malla se guardan una vez y los triángulos pasan a ser índices.
// scripts/verify-corrediza.mjs vuelve a expandir el binario y lo compara, valor por valor, con la fuente.
//
// Uso:  ST_PAQUETE=../ST_DOORS_PAQUETE node scripts/convert-corrediza.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = path.resolve(root, process.env.ST_PAQUETE || '../ST_DOORS_PAQUETE');
const SRC_REL = '01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html';
const src = path.join(pkg, SRC_REL);
const outDir = path.join(root, 'src/models');

export function readSource(file = src) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<script id="mesh-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró <script id="mesh-data"> en el modelo original');
  return { html, model: JSON.parse(m[1]), sha256: crypto.createHash('sha256').update(html).digest('hex'), bytes: Buffer.byteLength(html) };
}

// Clase de superficie que el sombreador original asigna a cada material (función surface(name) del motor).
export function surfaceTable(html) {
  const m = html.match(/function surface\(name\)\{if\(name==='panel'\)return finish==='white'\?4:finish==='black'\?3:10;if\((\[[^\]]+\])\.includes\(name\)\)return 5;if\((\[[^\]]+\])\.includes\(name\)\)return 2;/);
  if (!m) throw new Error('No se reconoció la función surface(name) del motor original');
  const list = (s) => JSON.parse(s.replace(/'/g, '"'));
  const elastomer = list(m[1]), brushed = list(m[2]);
  return (name) => (name === 'panel' ? 'pintura' : elastomer.includes(name) ? 'elastomero' : brushed.includes(name) ? 'cepillado' : 'base');
}

// Cámaras con nombre del original: [yaw, pitch, dist, focusX, focusY]
export function originalViews(html) {
  const m = html.match(/const views=(\{[^;]+\});/);
  if (!m) throw new Error('No se encontró la tabla de vistas del original');
  return new Function(`return ${m[1]}`)();
}

async function main() {
  const { html, model, sha256, bytes } = readSource();
  const surfaceOf = surfaceTable(html);
  const f32 = new Float32Array(6), u32 = new Uint32Array(f32.buffer);

  const meshes = [];
  let vertsIn = 0, vertsOut = 0, tris = 0, empty = 0;
  model.meshes.forEach((me, i) => {
    if (Object.keys(me).sort().join() !== 'group,material,n,p') throw new Error(`Malla ${i}: claves inesperadas ${Object.keys(me)}`);
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
    meshes.push({ i, grupo: me.group, material: me.material, pos: Float32Array.from(pos), nrm: Float32Array.from(nrm), idx: Uint16Array.from(idx) });
    vertsIn += count; vertsOut += pos.length / 3; tris += count / 3;
  });

  // [posiciones f32][normales f32][índices u16]: las secciones float quedan alineadas a 4 bytes sin relleno
  let off = 0;
  for (const m of meshes) { m.posOff = off; off += m.pos.byteLength; }
  for (const m of meshes) { m.nrmOff = off; off += m.nrm.byteLength; }
  for (const m of meshes) { m.idxOff = off; off += m.idx.byteLength; }
  const bin = Buffer.alloc(off);
  for (const m of meshes) {
    Buffer.from(m.pos.buffer).copy(bin, m.posOff); Buffer.from(m.nrm.buffer).copy(bin, m.nrmOff); Buffer.from(m.idx.buffer).copy(bin, m.idxOff);
  }

  const used = [...new Set(meshes.map((m) => m.material))];
  const materiales = Object.fromEntries(used.map((name) => {
    const d = model.materials[name]; if (!d) throw new Error(`Material sin definición: ${name}`);
    return [name, { color: d.color, metal: d.metal, rough: d.rough, superficie: surfaceOf(name) }];
  }));

  const manifest = {
    fuente: { archivo: SRC_REL, sha256, bytes },
    formato: {
      nota: 'Binario little-endian. Por malla: posiciones float32 xyz, normales float32 xyz, índices uint16. Mismos float32 que el motor original sube a la GPU.',
      bytes: bin.length, sha256: crypto.createHash('sha256').update(bin).digest('hex'),
    },
    totales: { mallas: meshes.length, mallas_vacias_omitidas: empty, vertices_fuente: vertsIn, vertices_unicos: vertsOut, triangulos: tris },
    materiales,
    vistas_originales: originalViews(html),
    // [índice en el original, grupo, material, vértices únicos, índices, offset posiciones, offset normales, offset índices]
    mallas: meshes.map((m) => [m.i, m.grupo, m.material, m.pos.length / 3, m.idx.length, m.posOff, m.nrmOff, m.idxOff]),
  };

  // Logo impreso en la hoja: el mismo PNG incrustado en el original (574 × 237, un solo azul con borde suavizado).
  // Sus píxeles transparentes traen RGB negro; se les pone el mismo azul para que el filtrado de la textura no
  // oscurezca el borde. La forma (canal alfa) y el color visible no cambian.
  const logo = html.match(/logoImg\.src='data:image\/png;base64,([A-Za-z0-9+/=]+)'/);
  if (!logo) throw new Error('No se encontró el logo incrustado');
  const { data: px, info } = await sharp(Buffer.from(logo[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = null;
  for (let k = 0; k < px.length; k += 4) if (px[k + 3] === 255) { if (!ink) ink = [px[k], px[k + 1], px[k + 2]]; else if (px[k] !== ink[0] || px[k + 1] !== ink[1] || px[k + 2] !== ink[2]) throw new Error('El logo ya no es de un solo color'); }
  for (let k = 0; k < px.length; k += 4) if (px[k + 3] < 255) { px[k] = ink[0]; px[k + 1] = ink[1]; px[k + 2] = ink[2]; }
  manifest.logo = { ancho: info.width, alto: info.height, color: `#${ink.map((v) => v.toString(16).padStart(2, '0')).join('')}` };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'corrediza.bin'), bin);
  fs.writeFileSync(path.join(outDir, 'corrediza.json'), JSON.stringify(manifest));
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'corrediza-logo.png'));
  console.log(`corrediza: ${meshes.length} mallas (${empty} vacías omitidas), ${vertsIn} vértices → ${vertsOut} únicos, ${tris} triángulos`);
  console.log(`binario ${(bin.length / 1024).toFixed(0)} KB · manifiesto ${(fs.statSync(path.join(outDir, 'corrediza.json')).size / 1024).toFixed(1)} KB · fuente ${(bytes / 1048576).toFixed(2)} MB`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

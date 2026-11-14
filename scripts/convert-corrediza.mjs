// Convierte la geometría del modelo aprobado de la corrediza a un binario compacto, SIN PÉRDIDAS.
//
//   Fuente (solo lectura): 01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html  →  <script id="mesh-data">
//   Salida:                src/models/corrediza.bin  +  src/models/corrediza.json  +  src/models/logo-hoja.png
//
// El empaquetado y su comprobación están en scripts/lib/meshpack.mjs. scripts/verify-corrediza.mjs vuelve a
// expandir el binario y lo compara, valor por valor, con la fuente.
//
// Uso:  ST_PAQUETE=../ST_DOORS_PAQUETE node scripts/convert-corrediza.mjs
import { readOriginal, packMeshes, writeLeafLogo, writeModel, isMain } from './lib/meshpack.mjs';

const SRC_REL = '01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html';

export function readSource() {
  const src = readOriginal(SRC_REL);
  const m = src.html.match(/<script id="mesh-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró <script id="mesh-data"> en el modelo original');
  return { ...src, model: JSON.parse(m[1]) };
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
  model.meshes.forEach((me, i) => { if (Object.keys(me).sort().join() !== 'group,material,n,p') throw new Error(`Malla ${i}: claves inesperadas ${Object.keys(me)}`); });
  const { bin, formato, totales, mallas } = packMeshes(model.meshes);
  const materiales = Object.fromEntries([...new Set(mallas.map((m) => m[2]))].map((name) => {
    const d = model.materials[name]; if (!d) throw new Error(`Material sin definición: ${name}`);
    return [name, { color: d.color, metal: d.metal, rough: d.rough, superficie: surfaceOf(name) }];
  }));
  const logo = html.match(/logoImg\.src='data:image\/png;base64,([A-Za-z0-9+/=]+)'/);
  if (!logo) throw new Error('No se encontró el logo incrustado');
  const manifest = { fuente: { archivo: SRC_REL, sha256, bytes }, formato, totales, materiales, vistas_originales: originalViews(html), mallas, logo: await writeLeafLogo(logo[1]) };
  writeModel('corrediza', manifest, bin);
}

if (isMain(import.meta)) await main();

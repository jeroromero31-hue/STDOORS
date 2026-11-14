// Convierte la geometría del modelo aprobado de la vaivén (V13) a un binario compacto, SIN PÉRDIDAS.
//
//   Fuente (solo lectura): 01_MODELOS_ORIGINALES/VAIVEN_V13_MODELO_BASE.html  →  const MODEL = {…}
//   Salida:                src/models/vaiven.bin  +  src/models/vaiven.json  +  src/models/logo-hoja.png
//
// Uso:  ST_PAQUETE=../ST_DOORS_PAQUETE node scripts/convert-vaiven.mjs
import { readOriginal, packMeshes, writeLeafLogo, writeModel, isMain } from './lib/meshpack.mjs';

const SRC_REL = '01_MODELOS_ORIGINALES/VAIVEN_V13_MODELO_BASE.html';

export function readSource() {
  const src = readOriginal(SRC_REL);
  const a = src.html.indexOf('const MODEL=') + 'const MODEL='.length, b = src.html.indexOf(';\nconst cvs=', a);
  if (a < 12 || b < 0) throw new Error('No se encontró const MODEL = {…} en el modelo original');
  return { ...src, model: JSON.parse(src.html.slice(a, b)) };
}

// Clase de superficie que el motor original asigna a cada material al dibujar (expresión de paint()).
const SURFACE_SOURCE = "g.material==='panel'?(currentFinish==='black'?3:currentFinish==='steel'?10:4):g.material==='kickplate'?(currentFinish==='steel'?5:2):g.material==='rubber'||g.material==='gasket'||g.material==='rubber-edge'?5:g.material==='glass'||g.material==='glass-glare'?7:g.material==='steel'||g.material==='frame'||g.material==='frame-light'?2:g.material==='logo-blue'?9:g.material.startsWith('hinge')||g.material==='screw'?6:0";
export function surfaceOf(html) {
  if (!html.includes(SURFACE_SOURCE)) throw new Error('La asignación de superficies del motor original cambió');
  return (name) => (name === 'panel' ? 'acabado'                           // lo pone el acabado elegido
    : name === 'kickplate' ? 'protector'                                    // inoxidable, o negro con la hoja inoxidable
    : ['rubber', 'gasket', 'rubber-edge'].includes(name) ? 'elastomero'
    : ['glass', 'glass-glare'].includes(name) ? 'vidrio'
    : ['steel', 'frame', 'frame-light'].includes(name) ? 'cepillado'
    : name.startsWith('hinge') || name === 'screw' ? 'fundicion' : 'base');
}

// Acabados del original y los retoques que cada uno aplica a marco, protector y vidrio
export function finishPresets(html) {
  const m = html.match(/const FINISH_PRESETS=(\{[\s\S]*?\});\s*let currentFinish='(\w+)';/);
  if (!m) throw new Error('No se encontraron los acabados del original');
  return { presets: new Function(`return ${m[1]}`)(), inicial: m[2] };
}

// Cámaras del original: [yaw, pitch, dist, focusX, focusY]
export function originalViews(html) {
  const cfg = html.match(/const configs=(\{[^;]+\});/), ini = html.match(/let yaw=([-.\d]+),pitch=([-.\d]+),dist=([-.\d]+),/);
  const hinge = html.match(/wantFocusX=([-.\d]+);wantFocusY=([-.\d]+);targetDist=([-.\d]+);targetYaw=([-.\d]+);targetPitch=([-.\d]+);wantLeft=0;wantRight=0;\}/);
  const seal = html.match(/wantLeft=([-.\d]+)\*openDir;wantRight=0;\s*wantFocusX=([-.\d]+);wantFocusY=([-.\d]+);\s*targetYaw=([-.\d]+);targetPitch=([-.\d]+);targetDist=([-.\d]+);/);
  if (!cfg || !ini || !hinge || !seal) throw new Error('No se encontraron las cámaras del original');
  const views = Object.fromEntries(Object.entries(new Function(`return ${cfg[1]}`)()).map(([k, v]) => [k, [...v, 0, 1.25]]));
  const n = (a) => a.map(Number);
  views.inicial = [...n(ini.slice(1, 4)), 0, 1.25];
  { const [fx, fy, d, y, p] = n(hinge.slice(1)); views.bisagra = [y, p, d, fx, fy]; }
  { const [left, fx, fy, y, p, d] = n(seal.slice(1)); views.empaque = [y, p, d, fx, fy]; views.empaque_hoja_izquierda = left; }
  return views;
}

async function main() {
  const { html, model, sha256, bytes } = readSource();
  const surface = surfaceOf(html);
  model.meshes.forEach((me, i) => { if (Object.keys(me).sort().join() !== 'group,material,n,names,p') throw new Error(`Malla ${i}: claves inesperadas ${Object.keys(me)}`); });
  const { bin, formato, totales, mallas } = packMeshes(model.meshes);
  const materiales = Object.fromEntries([...new Set(mallas.map((m) => m[2]))].map((name) => {
    const d = model.materials[name]; if (!d) throw new Error(`Material sin definición: ${name}`);
    return [name, { color: d.color, metal: d.metal, rough: d.rough, superficie: surface(name) }];
  }));
  const logo = html.match(/mark\.src='data:image\/png;base64,([A-Za-z0-9+/=]+)'/);
  if (!logo) throw new Error('No se encontró el logo incrustado');
  const { presets, inicial } = finishPresets(html);
  const manifest = {
    fuente: { archivo: SRC_REL, sha256, bytes }, formato, totales, materiales,
    acabados_originales: { inicial, presets },
    vistas_originales: originalViews(html), mallas, logo: await writeLeafLogo(logo[1]),
  };
  writeModel('vaiven', manifest, bin);
}

if (isMain(import.meta)) await main();

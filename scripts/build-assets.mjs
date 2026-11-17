// Genera las imágenes web del catálogo y src/data/components.json a partir del paquete original.
// Los originales NO se modifican. Uso:
//   ST_PAQUETE=/ruta/al/paquete npm run assets
// (la carpeta del paquete es la que contiene 00_DIRECCION_PROYECTO y 03_COMPONENTES_ORIGINALES_ALTA_CALIDAD)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PKG = process.env.ST_PAQUETE || path.resolve(ROOT, '../ST_DOORS_PAQUETE');
const CSV = path.join(PKG, '00_DIRECCION_PROYECTO/INVENTARIO_COMPONENTES.csv');
const OUT_IMG = path.join(ROOT, 'public/img/componentes');
const OUT_JSON = path.join(ROOT, 'src/data/components.json');
const SIZES = [480, 960, 1600];          // ancho; lienzo 4:3 uniforme, fondo blanco
const FORCE = process.argv.includes('--force');

if (!fs.existsSync(CSV)) { console.error(`No encuentro ${CSV}. Define ST_PAQUETE con la ruta del paquete.`); process.exit(1); }

// ---------- CSV ----------
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s) => ascii(s.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).replace(/-$/, '');

function cleanName(raw) {
  let n = raw.replace(/\.png$/i, '').replace(/\.+$/, '');
  n = n.replace(/^Pieza\s*\d+\s*[—–-]\s*/i, '').trim();
  n = n.replace(/(\d)\s*W:m/g, '$1 W/m');
  return n.replace(/\.+$/, '').trim();
}

// Clasificación propuesta en la Fase 1 (pendiente de aprobación del propietario)
const TIPOS = [
  ['empaques', 'Empaques', ['empaque']],
  ['electrico', 'Eléctrico', ['resistencia', 'visor', 'cable']],
  ['senalizacion', 'Señalización', ['calcomania']],
  ['fijacion', 'Fijación', ['tornillo', 'tuerca', 'rondana', 'barra roscada', 'manguito', 'pija']],
  ['proteccion', 'Protección y visión', ['bumper', 'ventanilla']],
  ['herrajes', 'Herrajes', ['bisagra', 'cerrojo', 'manija', 'palanca', 'gancho', 'polea']],
  ['perfiles', 'Perfiles y rieles', ['perfil', 'marco exterior 110, 5', 'riel de aluminio', 'riel guia inferior', 'cubre riel de aluminio']],
];
function tipoDe(name) {
  const s = ascii(name.toLowerCase());
  if (s.startsWith('plancha') || s.startsWith('soporte para empaque')) return 'montaje';
  for (const [id, , keys] of TIPOS) if (keys.some((k) => s.includes(k))) return id;
  return 'montaje';
}
const TIPO_LABEL = Object.fromEntries([...TIPOS.map(([id, l]) => [id, l]), ['montaje', 'Montaje']]);

const FAMILIAS = { ABATIBLE: 'abatible', CORREDIZA: 'corrediza', VAIVEN: 'vaiven' };
const FAM_LABEL = { abatible: 'Abatible', corrediza: 'Corrediza', vaiven: 'Vaivén' };
const PDF = { abatible: 'ABATIBLE.pdf', corrediza: 'CORREDIZA.pdf', vaiven: 'VAIVEN.pdf' };

// ---------- correcciones documentadas en la auditoría (Fase 0) ----------
function corregir(item) {
  const n = item.numero ? Number(item.numero) : null;
  const avisos = [];
  // 09–26: listadas en los PDF de Abatible y de Corrediza -> una sola pieza compatible con ambas
  if (item.familias[0] === 'abatible' && n >= 9 && n <= 26) item.familias = ['abatible', 'corrediza'];
  if (n === 10) avisos.push('Largo distinto en los PDF: 5.80 m (Abatible) y 4.50 m (Corrediza). Por confirmar si es la misma pieza.');
  // Fase 10G: ST corrige el largo del marco exterior 110 (los PDF dicen 5.30 m)
  if (n === 9 && item.familias.includes('abatible')) { item.nombre = 'Marco exterior 110, 5.80 m'; item.id = item.id.replace('5-30-m', '5-80-m'); }
  if (item.familias.includes('vaiven') && n === 2) {
    item.nombre = 'Bisagra para puerta vaivén';
    avisos.push('Nombre tomado del PDF de Vaivén; el archivo original dice "puerta abatible".');
  }
  if (n >= 69 && n <= 76) avisos.push('Numeración 69–76 por confirmar contra el PDF de Corrediza (hoja 6 lista 9 piezas y hay 7 imágenes).');
  if (!item.numero) avisos.push('Sin número global de catálogo confirmado.');
  item.avisos = avisos;
  return item;
}

// Perfiles adicionales de vaivén: nombres del PDF, sin número inventado
const EXTRA = {
  VAIVEN_ADICIONAL_PERFIL_40MM: { id: 'vaiven-perfil-aluminio-40-mm', nombre: 'Perfil de aluminio vaivén 40 mm, 6.10 m' },
  // Fase 10G: ST indica que el perfil H de aluminio lo llevan todas las puertas
  VAIVEN_ADICIONAL_PERFIL_H: { id: 'vaiven-perfil-aluminio-h', nombre: 'Perfil de aluminio "H", 6.50 m', familias: ['abatible', 'corrediza', 'vaiven'] },
};

// Piezas que aparecen en los PDF pero no tienen imagen: NO se publican; quedan registradas
const PENDIENTES = [
  { familia: 'abatible', nombre_pdf: 'Pija galvanizada 12X2', motivo: 'Aparece en ABATIBLE.pdf hoja 3; sin imagen. Posible pieza 36.' },
  { familia: 'corrediza', nombre_pdf: 'Palanca interna derecha', motivo: 'Aparece en CORREDIZA.pdf hoja 6; sin imagen. Posible pieza 70.' },
  { familia: 'corrediza', nombre_pdf: 'Refuerzo para palanca interna izquierda', motivo: 'Aparece en CORREDIZA.pdf hoja 6; sin imagen.' },
  { familia: 'vaiven', nombre_pdf: 'PTR acero inoxidable para marco vaivén, 6.10 m', motivo: 'Aparece en VAIVEN.pdf hoja 2; sin imagen en alta calidad.' },
];

async function procesarImagen(src, base) {
  const out = {};
  const trimmed = await sharp(src).flatten({ background: '#ffffff' }).trim({ threshold: 12 }).toBuffer();
  for (const w of SIZES) {
    const h = Math.round(w * 3 / 4), pad = Math.round(w * 0.07);
    const files = { webp: `${base}-${w}.webp`, avif: `${base}-${w}.avif` };
    const done = Object.values(files).every((f) => fs.existsSync(path.join(OUT_IMG, f)));
    if (!done || FORCE) {
      const fitted = await sharp(trimmed).resize(w - 2 * pad, h - 2 * pad, { fit: 'inside', withoutEnlargement: false }).toBuffer();
      const canvas = sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } }).composite([{ input: fitted, gravity: 'center' }]);
      const buf = await canvas.png().toBuffer();
      await sharp(buf).webp({ quality: 80 }).toFile(path.join(OUT_IMG, files.webp));
      await sharp(buf).avif({ quality: 52, effort: 4 }).toFile(path.join(OUT_IMG, files.avif));
    }
    out[w] = files;
  }
  return out;
}

const rows = parseCSV(fs.readFileSync(CSV, 'utf8'));
fs.mkdirSync(OUT_IMG, { recursive: true });
const items = [];
for (const r of rows) {
  const fam = FAMILIAS[r.familia.toUpperCase()];
  const file = path.basename(r.archivo_relativo);
  const extraKey = Object.keys(EXTRA).find((k) => file.startsWith(k));
  const numero = /^\d+$/.test(r.numero_catalogo) && !extraKey ? r.numero_catalogo.padStart(2, '0') : '';
  let item = {
    id: extraKey ? EXTRA[extraKey].id : `${fam}-${numero}-${slug(cleanName(r.nombre_original_o_identificador))}`,
    numero,
    nombre: extraKey ? EXTRA[extraKey].nombre : cleanName(r.nombre_original_o_identificador),
    familias: [fam],
    original: r.archivo_relativo,
  };
  item = corregir(item);
  if (extraKey && EXTRA[extraKey].familias) item.familias = EXTRA[extraKey].familias;
  item.tipo = tipoDe(item.nombre);
  item.pdf = item.familias.map((f) => PDF[f]);
  const base = item.id;
  process.stdout.write(`· ${item.numero || '--'} ${item.nombre}\n`);
  item.imagen = await procesarImagen(path.join(PKG, r.archivo_relativo), base);
  items.push(item);
}
items.sort((a, b) => (a.numero === '') - (b.numero === '') || Number(a.numero || 999) - Number(b.numero || 999));

// IDs únicos
const seen = new Set();
for (const it of items) { if (seen.has(it.id)) throw new Error('ID duplicado ' + it.id); seen.add(it.id); }

const data = {
  generado: new Date().toISOString().slice(0, 10),
  fuente: 'INVENTARIO_COMPONENTES.csv + correcciones de la auditoría (Fase 0)',
  tamanos: SIZES,
  familias: Object.entries(FAM_LABEL).map(([id, nombre]) => ({ id, nombre, piezas: items.filter((i) => i.familias.includes(id)).length })),
  tipos: Object.entries(TIPO_LABEL).map(([id, nombre]) => ({ id, nombre, piezas: items.filter((i) => i.tipo === id).length })).filter((t) => t.piezas),
  piezas: items,
  pendientes_sin_publicar: PENDIENTES,
};
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(data, null, 1));

// logo web a partir del PNG exacto 4K (sin alterar geometría)
const LOGO = path.join(PKG, '05_IDENTIDAD_ST/ST_Logo_Azul_Original_Exacto_4K.png');
if (fs.existsSync(LOGO)) {
  const dir = path.join(ROOT, 'public/img/marca');
  await sharp(LOGO).trim({ threshold: 10 }).resize({ width: 480 }).png().toFile(path.join(dir, 'st-logo-azul.png'));
  await sharp(LOGO).trim({ threshold: 10 }).resize({ width: 480 }).webp({ quality: 90 }).toFile(path.join(dir, 'st-logo-azul.webp'));
  await sharp(LOGO).trim({ threshold: 10 }).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(ROOT, 'public/favicon.png'));
}
console.log(`\n${items.length} piezas · ${PENDIENTES.length} pendientes sin publicar · ${fs.readdirSync(OUT_IMG).length} archivos de imagen`);

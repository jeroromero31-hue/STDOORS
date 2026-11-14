// Fotos de instalaciones CDS para la página /cds/ (galería). Los originales NO se modifican. Uso:
//   ST_PAQUETE=/ruta/al/paquete node scripts/build-cds-photos.mjs
// Se publican 11 de las 15 fotos del paquete. Quedan fuera:
//   · las que muestran el nombre o la imagen de la tienda del cliente (Beer Cave, Kiosko, póster con persona),
//     hasta tener su permiso;
//   · la de un almacén con panel y ventanilla, que no muestra puertas CDS.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PKG = process.env.ST_PAQUETE || path.resolve(ROOT, '../ST_DOORS_PAQUETE');
const SRC = path.join(PKG, '04_PRODUCTOS_FOTOGRAFIAS/CDS_INSTALACIONES_REALES');
const OUT = path.join(ROOT, 'public/img/cds');
const JSON_OUT = path.join(ROOT, 'src/data/cds-instalaciones.json');
const SIZES = [480, 960, 1600];
const P = (t) => `WhatsApp_Image_2026-11-11_at_${t}.jpeg`;
// [archivo, texto alternativo, recorte opcional (fracción del ancho que se conserva desde la izquierda)]. Sin nombres de clientes ni lugares: no están en el paquete.
const PHOTOS = [
  [P('5.56.03_PM_3_'), 'Pasillo con una pared continua de puertas CDS de cristal y marco negro'],
  [P('5.56.03_PM_2_'), 'Línea de puertas CDS a todo lo largo de un muro, vista en perspectiva'],
  [P('5.56.03_PM_4_'), 'Esquina de tienda con dos líneas de puertas CDS que se encuentran'],
  [P('5.56.02_PM_1_'), 'Muro de lácteos con puertas CDS en una tienda', { ancho: 0.86 }],   // recorte: deja fuera a una persona en el borde derecho
  [P('5.56.02_PM_2_'), 'Puertas CDS para jugos y cervezas junto al área de frutas y verduras'],
  [P('5.56.03_PM_5_'), 'Puertas CDS surtidas con bebidas, vistas de cerca'],
  [P('5.56.04_PM'), 'Puertas CDS con latas y botellas en sus parrillas'],
  [P('5.56.03_PM'), 'Dos secciones de puertas CDS en esquina, con lácteos y bebidas'],
  [P('5.56.03_PM_1_'), 'Fila de puertas CDS con productos, vista desde un costado'],
  [P('5.56.04_PM_1_'), 'Cámara frigorífica en obra con su frente de puertas CDS'],
  [P('5.56.04_PM_4_'), 'Tienda recién terminada con un muro de puertas CDS al fondo'],
];

fs.mkdirSync(OUT, { recursive: true });
const out = [];
for (const [i, [file, alt, crop]] of PHOTOS.entries()) {
  const src = path.join(SRC, file);
  if (!fs.existsSync(src)) { console.error(`Falta ${src}`); process.exit(1); }
  let img = sharp(src).rotate();                      // respeta la orientación de la foto; sharp no copia metadatos
  let { width, height } = await img.metadata();
  if (crop) { width = Math.round(width * crop.ancho); img = sharp(await img.extract({ left: 0, top: 0, width, height }).toBuffer()); }
  const base = `instalacion-${String(i + 1).padStart(2, '0')}`, files = {};
  for (const w of SIZES) {
    const ww = Math.min(w, width);
    const r = img.clone().resize({ width: ww, withoutEnlargement: true });
    files[w] = { webp: `${base}-${w}.webp`, avif: `${base}-${w}.avif` };
    await r.clone().webp({ quality: 78 }).toFile(path.join(OUT, files[w].webp));
    await r.clone().avif({ quality: 50, effort: 4 }).toFile(path.join(OUT, files[w].avif));
  }
  out.push({ id: base, alt, ancho: width, alto: height, imagen: files });
  console.log(base, `${width}×${height}`);
}
fs.writeFileSync(JSON_OUT, JSON.stringify({ origen: '04_PRODUCTOS_FOTOGRAFIAS/CDS_INSTALACIONES_REALES', fotos: out }, null, 1) + '\n');
console.log(`${out.length} fotos → public/img/cds/ y src/data/cds-instalaciones.json`);

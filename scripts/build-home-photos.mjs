// Fotos de la página de Inicio. Los originales NO se modifican. Uso:
//   ST_PAQUETE=/ruta/al/paquete node scripts/build-home-photos.mjs
// Producto: 04_PRODUCTOS_FOTOGRAFIAS/PUERTAS_ORIGINALES (fotos de producto con logo ST).
// Instalaciones industriales: 3 de las 4 de REFERENCIAS_APROBADAS_Y_CAPTURAS; la cuarta (montacargas con marca
// de un tercero) queda fuera, con el mismo criterio que las fotos CDS con marcas.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PKG = process.env.ST_PAQUETE || path.resolve(ROOT, '../ST_DOORS_PAQUETE');
const F = path.join(PKG, '04_PRODUCTOS_FOTOGRAFIAS');
const OUT = path.join(ROOT, 'public/img/inicio');
const JSON_OUT = path.join(ROOT, 'src/data/inicio-fotos.json');
const SIZES = [640, 1280, 1920];
// [id, archivo, texto alternativo, recorte opcional (fracción del ancho desde la izquierda)]
const PHOTOS = [
  ['vaiven-frente', 'PUERTAS_ORIGINALES/puerta_2_logo_ST.png', 'Puerta vaivén ST de dos hojas de acero inoxidable con mirillas, vista de frente'],
  ['vaiven-abierta', 'PUERTAS_ORIGINALES/puerta_3_logo_ST.png', 'Puerta vaivén ST abierta hacia una nave de producción'],
  ['corrediza', 'PUERTAS_ORIGINALES/puerta_1_logo_ST.png', 'Puerta corrediza ST en el muro de una cámara frigorífica'],
  ['abatible', 'PUERTAS_ORIGINALES/puerta_4_logo_ST.png', 'Puerta abatible ST en la cámara de una cocina industrial', 0.42],   // el archivo trae la foto a la izquierda y blanco a la derecha
  ['instalacion-corrediza-1', 'REFERENCIAS_APROBADAS_Y_CAPTURAS/INDUSTRIAL_CORREDIZA_INSTALACION_REAL.png', 'Dos puertas corredizas instaladas en un pasillo de cámaras'],
  ['instalacion-corrediza-2', 'REFERENCIAS_APROBADAS_Y_CAPTURAS/INDUSTRIAL_FOTO_CORREDIZA_REAL.png', 'Puerta corrediza recién instalada en una cámara frigorífica'],
  ['instalacion-vaiven', 'REFERENCIAS_APROBADAS_Y_CAPTURAS/INDUSTRIAL_VAIVEN_INSTALACION_REAL.png', 'Puerta vaivén instalada, con protección inferior negra'],
];

fs.mkdirSync(OUT, { recursive: true });
const fotos = [];
for (const [id, file, alt, crop] of PHOTOS) {
  const src = path.join(F, file);
  let img = sharp(src).rotate();
  let { width, height } = await img.metadata();
  if (crop) { width = Math.round(width * crop); img = sharp(await img.extract({ left: 0, top: 0, width, height }).toBuffer()); }
  const imagen = {};
  for (const w of SIZES) {
    const ww = Math.min(w, width), base = `${id}-${ww}`;
    const r = img.clone().resize({ width: ww });
    await r.clone().webp({ quality: 80 }).toFile(path.join(OUT, base + '.webp'));
    await r.clone().avif({ quality: 52 }).toFile(path.join(OUT, base + '.avif'));
    imagen[ww] = { webp: base + '.webp', avif: base + '.avif' };
    if (ww === width) break;                                          // no se agranda
  }
  fotos.push({ id, alt, ancho: width, alto: height, imagen });
  console.log(id, `${width}×${height}`, Object.keys(imagen).join('/'));
}
fs.writeFileSync(JSON_OUT, JSON.stringify({ origen: 'scripts/build-home-photos.mjs', fotos }, null, 1));
console.log(`${fotos.length} fotos → public/img/inicio/ y src/data/inicio-fotos.json`);

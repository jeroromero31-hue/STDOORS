// Fotos de la página de Inicio. Los originales NO se modifican. Uso:
//   ST_PAQUETE=/ruta/al/paquete node scripts/build-home-photos.mjs
// Fotos de producto mejoradas por el propietario (04_PRODUCTOS_FOTOGRAFIAS/PUERTAS_ORIGINALES) y la toma de estudio
// de la abatible hecha con el 3D del sitio.
// Dos de ellas traen un área transparente a la derecha: se recorta sola (sharp.trim sobre el canal alfa).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PKG = process.env.ST_PAQUETE || path.resolve(ROOT, '../ST_DOORS_PAQUETE');
const F = path.join(PKG, '04_PRODUCTOS_FOTOGRAFIAS');
const OUT = path.join(ROOT, 'public/img/inicio');
const JSON_OUT = path.join(ROOT, 'src/data/inicio-fotos.json');
const SIZES = [640, 1080, 1280, 1920];
// [id, archivo, texto alternativo]
const PHOTOS = [
  ['vaiven-frente', 'PUERTAS_ORIGINALES/puerta_2_logo_ST.png', 'Puerta vaivén ST de dos hojas de acero inoxidable con mirillas, vista de frente'],
  ['vaiven-abierta', 'PUERTAS_ORIGINALES/puerta_3_logo_ST.png', 'Puerta vaivén ST con las dos hojas abiertas hacia una nave de producción'],
  ['corrediza', 'PUERTAS_ORIGINALES/puerta_1_logo_ST.png', 'Puerta corrediza ST blanca con placa inferior de aluminio, en el muro de una cámara frigorífica'],
  // la abatible: toma de estudio dibujada con el modelo 3D del sitio (scripts/render-abatible-photo.py), a pedido del
  // propietario en lugar de la foto de la cocina (puerta_4_logo_ST.png)
  ['abatible', path.join(ROOT, 'scripts/fuentes/abatible-estudio.png'), 'Puerta abatible ST blanca con bumper de inox diamante y chapa de palanca, entreabierta; detrás, el interior de la cámara'],
];

for (const old of fs.readdirSync(OUT)) if (/\.(webp|avif)$/.test(old)) fs.rmSync(path.join(OUT, old));   // solo sus fotos (la secuencia CDS va en cds/)
fs.mkdirSync(OUT, { recursive: true });
const fotos = [];
for (const [id, file, alt] of PHOTOS) {
  const src = path.isAbsolute(file) ? file : path.join(F, file);
  // fuera el área transparente (si la hay) y el canal alfa: son fotos opacas
  const { data, info } = await sharp(src).rotate().trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).flatten({ background: '#ffffff' }).toBuffer({ resolveWithObject: true });
  const img = sharp(data); const { width, height } = info;
  const imagen = {};
  for (const w of SIZES) {
    const ww = Math.min(w, width), base = `${id}-${ww}`;
    const r = img.clone().resize({ width: ww });
    await r.clone().webp({ quality: 84 }).toFile(path.join(OUT, base + '.webp'));
    await r.clone().avif({ quality: 58 }).toFile(path.join(OUT, base + '.avif'));
    imagen[ww] = { webp: base + '.webp', avif: base + '.avif' };
    if (ww === width) break;                                          // no se agranda
  }
  fotos.push({ id, alt, ancho: width, alto: height, imagen });
  console.log(id, `${width}×${height}`, Object.keys(imagen).join('/'));
}
fs.writeFileSync(JSON_OUT, JSON.stringify({ origen: 'scripts/build-home-photos.mjs', fotos }, null, 1));
console.log(`${fotos.length} fotos → public/img/inicio/ y src/data/inicio-fotos.json`);

// Fase 10I · copia comprimida (gzip) de cada modelo convertido: src/models/<puerta>.bin → <puerta>.binz.
// El navegador la descomprime sin pérdidas (DecompressionStream) y verifica el tamaño contra el manifiesto; se descarga
// 4 a 6 veces menos aunque el servidor no comprima los .bin. Los .bin se quedan (verificación y navegadores viejos).
// Uso:  node scripts/comprimir-modelos.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const dir = new URL('../src/models/', import.meta.url);
for (const f of readdirSync(dir).filter((x) => x.endsWith('.bin'))) {
  const raw = readFileSync(new URL(f, dir)), z = gzipSync(raw, { level: 9 });
  writeFileSync(new URL(f + 'z', dir), z);
  console.log(f, raw.length, '→', z.length, `(${(raw.length / z.length).toFixed(1)}×)`);
}

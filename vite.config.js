import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

// Sitio estático multipágina. Cada index.html / *.html fuera de node_modules, public y dist es una entrada.
function htmlEntries(dir = '.', out = {}) {
  for (const f of readdirSync(dir)) {
    if (['node_modules', 'public', 'dist', 'scripts', 'src', '.git'].includes(f)) continue;
    if (f.startsWith('.') || f.startsWith('vite.config')) continue;      // ocultos y archivos temporales de Vite
    const p = resolve(dir, f);
    let st; try { st = statSync(p); } catch { continue; }                // un archivo que desaparece mientras se lee
    if (st.isDirectory()) htmlEntries(p, out);
    else if (f.endsWith('.html')) out[p.replace(resolve('.') + '/', '').replace(/\.html$/, '').replace(/\//g, '_')] = p;
  }
  return out;
}

export default defineConfig({
  // Para publicar en una subcarpeta (p. ej. GitHub Pages): VITE_BASE=/nombre-repo/ npm run build
  base: process.env.VITE_BASE || '/',
  build: { rollupOptions: { input: htmlEntries() }, chunkSizeWarningLimit: 800 },
  server: { host: true },
});

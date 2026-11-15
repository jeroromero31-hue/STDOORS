import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, statSync, writeFileSync } from 'node:fs';

// Sitio estático multipágina. Cada index.html / *.html fuera de node_modules, public y dist es una entrada.
function htmlEntries(dir = '.', out = {}) {
  for (const f of readdirSync(dir)) {
    if (['node_modules', 'public', 'dist', 'scripts', 'src', '.git', 'docs'].includes(f)) continue;
    if (f === 'lab' && !process.env.VITE_LAB) continue;            // páginas internas: solo con VITE_LAB=1 (y siempre en npm run dev)
    if (f.startsWith('.') || f.startsWith('vite.config')) continue;      // ocultos y archivos temporales de Vite
    const p = resolve(dir, f);
    let st; try { st = statSync(p); } catch { continue; }                // un archivo que desaparece mientras se lee
    if (st.isDirectory()) htmlEntries(p, out);
    else if (f.endsWith('.html')) out[p.replace(resolve('.') + '/', '').replace(/\.html$/, '').replace(/\//g, '_')] = p;
  }
  return out;
}

// Dominio público (opcional): SITE_URL=https://www.ejemplo.mx npm run build → añade enlace canónico, og:url, og:image y sitemap.xml
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const BASE = process.env.VITE_BASE || '/';
function seo() {
  const pages = [];
  return {
    name: 'st-seo',
    transformIndexHtml(html, ctx) {
      const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'ST Doors';
      const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
      const internal = /name="robots" content="noindex"/.test(html);
      const route = ctx.path.replace(/index\.html$/, '').replace(/^\//, '');
      if (!internal && !/^404/.test(route)) pages.push(route);
      const tags = [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#052F49' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:locale', content: 'es_MX' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'ST Doors' } },
        { tag: 'meta', attrs: { property: 'og:title', content: title } },
        { tag: 'meta', attrs: { property: 'og:description', content: desc } },
      ];
      if (SITE && !internal) {
        const abs = SITE + BASE + route;
        tags.push({ tag: 'link', attrs: { rel: 'canonical', href: abs } }, { tag: 'meta', attrs: { property: 'og:url', content: abs } },
          { tag: 'meta', attrs: { property: 'og:image', content: SITE + BASE + 'img/inicio/vaiven-frente-1280.webp' } });
      }
      // enlaces escritos como "/ruta/" en el HTML: con VITE_BASE se les antepone la subcarpeta
      if (BASE !== '/') html = html.replace(/(<a\b[^>]*\shref=")\/(?!\/)/g, `$1${BASE}`);
      return { html, tags: tags.map((t) => ({ ...t, injectTo: 'head' })) };
    },
    // al final de todo, cuando ya se procesaron todas las páginas
    writeBundle(opts) {
      writeFileSync(resolve(opts.dir, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? `Sitemap: ${SITE}${BASE}sitemap.xml\n` : ''}`);
      if (SITE) writeFileSync(resolve(opts.dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(pages)].sort().map((p) => `  <url><loc>${SITE}${BASE}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
    },
  };
}

export default defineConfig({
  plugins: [seo()],
  // Para publicar en una subcarpeta (p. ej. GitHub Pages): VITE_BASE=/nombre-repo/ npm run build
  base: process.env.VITE_BASE || '/',
  build: { rollupOptions: { input: htmlEntries() }, chunkSizeWarningLimit: 800 },
  server: { host: true },
});

// Fase 10I · caché del sitio en el teléfono: lo que trae huella en el nombre (/assets/: JavaScript, estilos, fuentes y
// los modelos 3D) se guarda la primera vez y después se abre al instante, también al pasar de una puerta a otra.
// Las imágenes de /img/ se muestran de la caché y se actualizan por detrás. Las páginas y los videos van siempre a la red.
const CACHE = 'st-v1', MAX = 160;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
const trim = async (c) => { const keys = await c.keys(); for (let i = 0; i < keys.length - MAX; i++) await c.delete(keys[i]); };
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin || req.headers.has('range')) return;
  const scope = new URL(self.registration.scope).pathname;
  if (u.pathname.startsWith(scope + 'assets/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok && r.status === 200 && r.type === 'basic') { c.put(req, r.clone()); trim(c); }
      return r;
    }));
  } else if (u.pathname.startsWith(scope + 'img/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok && r.status === 200 && r.type === 'basic') { c.put(req, r.clone()); trim(c); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});

// Fase 10I · descarga de los modelos convertidos. Se pide la copia comprimida (.binz, gzip) y se descomprime en el
// navegador sin pérdidas; si el navegador no sabe descomprimir, se pide el .bin original. El avance se avisa a la
// página (evento «st:model-progress», 0…1) para su barra de carga.
export async function loadModel({ z, raw, bytes, onProgress, response }) {
  const tell = (k) => { if (onProgress) onProgress(k); dispatchEvent(new CustomEvent('st:model-progress', { detail: k })); };
  const canZ = typeof DecompressionStream === 'function' && !!z;
  const url = canZ ? z : raw;
  const unzip = async (buf) => {
    const head = new Uint8Array(buf, 0, 2);
    if (head[0] === 0x1f && head[1] === 0x8b) {                  // gzip (si el servidor ya lo descomprimió, llega tal cual)
      buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    if (bytes && buf.byteLength !== bytes) throw new Error(`El modelo llegó incompleto (${buf.byteLength} de ${bytes} bytes)`);
    return buf;
  };
  const read = async (r) => {
    if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`);
    // Fase 12B · el tamaño que dice el servidor solo sirve para la barra de avance: si el servidor comprime al enviar
    // (GitHub Pages, algunos CDN), llegan más bytes de los que anuncia; antes eso se tomaba como error y el Inicio
    // se quedaba con la foto en vez del 3D
    const total = +r.headers.get('content-length') || 0;
    if (!(r.body && r.body.getReader)) return r.arrayBuffer();
    const reader = r.body.getReader(), parts = []; let n = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      parts.push(value); n += value.length; if (total) tell(Math.min(0.95, 0.95 * n / total));
    }
    const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    return out.buffer;
  };
  let buf;
  try { buf = await unzip(await read(await (response || fetch(url)))); }
  catch (e) {
    // segundo intento, directo de la red y sin leerlo por partes (caché vieja del teléfono, conexión cortada…)
    console.warn('Modelo 3D: se vuelve a pedir', e && e.message);
    const r = await fetch(url, { cache: 'reload' });
    if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`);
    buf = await unzip(await r.arrayBuffer());
  }
  tell(1);
  return buf;
}
// para pedirlo antes (Inicio) o tenerlo listo en otra puerta: la misma petición que hará loadModel
export const modelRequest = ({ z, raw }) => fetch(typeof DecompressionStream === 'function' && z ? z : raw);

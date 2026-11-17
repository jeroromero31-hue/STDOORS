// Fase 10I · descarga de los modelos convertidos. Se pide la copia comprimida (.binz, gzip) y se descomprime en el
// navegador sin pérdidas; si el navegador no sabe descomprimir, se pide el .bin original. El avance se avisa a la
// página (evento «st:model-progress», 0…1) para su barra de carga.
export async function loadModel({ z, raw, bytes, onProgress, response }) {
  const tell = (k) => { if (onProgress) onProgress(k); dispatchEvent(new CustomEvent('st:model-progress', { detail: k })); };
  const canZ = typeof DecompressionStream === 'function' && !!z;
  const r = await (response || fetch(canZ ? z : raw));
  if (!r.ok) throw new Error(`No se pudo descargar el modelo (HTTP ${r.status})`);
  const total = +r.headers.get('content-length') || 0;
  let buf;
  if (r.body && r.body.getReader && total) {
    const out = new Uint8Array(total), reader = r.body.getReader(); let n = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      if (n + value.length > total) throw new Error('El modelo llegó con más datos de los esperados');
      out.set(value, n); n += value.length; tell(0.95 * n / total);
    }
    buf = n === total ? out.buffer : out.buffer.slice(0, n);
  } else buf = await r.arrayBuffer();
  const head = new Uint8Array(buf, 0, 2);
  if (head[0] === 0x1f && head[1] === 0x8b) {                    // gzip (si el servidor ya lo descomprimió, llega tal cual)
    buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  if (bytes && buf.byteLength !== bytes) throw new Error('El modelo llegó incompleto');
  tell(1);
  return buf;
}
// para pedirlo antes (Inicio) o tenerlo listo en otra puerta: la misma petición que hará loadModel
export const modelRequest = ({ z, raw }) => fetch(typeof DecompressionStream === 'function' && z ? z : raw);

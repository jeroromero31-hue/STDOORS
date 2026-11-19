// Fase 10J · «Verla en tu espacio»: la puerta a tamaño real con la cámara del teléfono (realidad aumentada).
// El modelo de cada puerta (public/ar/<puerta>.glbz, scripts/build-ar.py) se escala a la medida del vano que escribió
// el cliente y se abre en el visor de RA del teléfono: en Android con WebXR (Chrome), en iPhone con Quick Look (el
// archivo USDZ lo genera el propio visor). En computadora se ve el modelo en 3D y un código QR para abrirlo en el celular.
import ar from '../data/ar.json';
import { createSheet, url, toast } from './site.js';
import { describe, defaults } from './medida.js';

const NOMBRE = { abatible: 'Puerta abatible', corrediza: 'Puerta corrediza', vaiven: 'Puerta vaivén', cds: 'Juego CDS Legacy' };
let mv = null, sheet = null, lastUrl = '';
const loadViewer = () => (mv ||= import('@google/model-viewer'));

async function readGlb(fam) {
  const r = await fetch(url(`ar/${fam}.glbz`));
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  let buf = await r.arrayBuffer();
  const h = new Uint8Array(buf, 0, 2);
  if (h[0] === 0x1f && h[1] === 0x8b) {
    if (typeof DecompressionStream !== 'function') throw new Error('Este navegador no puede abrir el modelo');
    buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }
  return buf;
}
// agrega un nodo raíz con la escala del vano: el piso del modelo queda en el piso real y el vano centrado
function rescale(buf, { sx, sy, tx, ty }) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('GLB inválido');
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const scene = json.scenes[json.scene || 0];
  json.nodes = json.nodes || [];
  json.nodes.push({ name: 'ST_vano', translation: [tx, ty, 0], scale: [sx, sy, 1], children: scene.nodes });
  scene.nodes = [json.nodes.length - 1];
  let enc = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (enc.length % 4)) % 4;
  if (pad) { const e2 = new Uint8Array(enc.length + pad).fill(0x20); e2.set(enc); enc = e2; }
  const rest = new Uint8Array(buf, 20 + jl);
  const out = new Uint8Array(12 + 8 + enc.length + rest.length), o = new DataView(out.buffer);
  o.setUint32(0, 0x46546c67, true); o.setUint32(4, 2, true); o.setUint32(8, out.length, true);
  o.setUint32(12, enc.length, true); o.setUint32(16, 0x4e4f534a, true);
  out.set(enc, 20); out.set(rest, 20 + enc.length);
  return out;
}
// escala: el vano del modelo pasa a la medida del cliente (sin medida, tamaño del modelo)
function scaleFor(fam, cfg) {
  const v = ar.puertas[fam].vano;
  let sx = 1, sy = 1;
  if (fam !== 'cds' && cfg && cfg.ancho && cfg.alto && !cfg.sinMedida) {
    sx = Math.min(4, Math.max(0.25, cfg.ancho / 100 / v.w)); sy = Math.min(4, Math.max(0.25, cfg.alto / 100 / v.h));
  }
  return { sx, sy, tx: -v.cx * sx, ty: -v.floor * sy };
}
const link = (fam, cfg) => {
  const u = new URL(location.href); u.hash = '';
  u.searchParams.set('ar', fam);
  if (fam !== 'cds' && cfg && cfg.ancho && cfg.alto) { u.searchParams.set('ancho', cfg.ancho); u.searchParams.set('alto', cfg.alto); }
  return u.toString();
};

export async function openAR(fam, cfg0 = {}) {
  if (!ar.puertas[fam]) return;
  const cfg = { ...defaults(fam), ...Object.fromEntries(Object.entries(cfg0 || {}).filter(([, v]) => v !== '' && v != null)) };
  if (!sheet) { sheet = createSheet('Verla en tu espacio'); sheet.el.classList.add('sheet--ar'); }
  const known = fam === 'cds' || (cfg.ancho && cfg.alto && !cfg.sinMedida);
  sheet.meta.textContent = 'Verla en tu espacio';
  sheet.body.innerHTML = `
    <div class="arv">
      <div class="arv__stage" data-stage><p class="arv__wait">Preparando la puerta…</p></div>
      <div class="arv__t"><b>${NOMBRE[fam]}</b><span>${known ? describe(fam, cfg) : 'Con la medida del modelo. Escribe la de tu vano para verla a escala.'}</span></div>
      <div class="arv__act" data-act hidden><button type="button" class="btn" data-go>Abrir la cámara</button></div>
      <div class="arv__qr" data-qr hidden></div>
      <p class="t-small t-soft arv__note">Apunta el teléfono al piso frente a tu vano; la puerta aparece a tamaño real y la puedes mover. La medida es aproximada: la puerta se fabrica a la medida exacta de tu vano.</p>
    </div>`;
  sheet.open();
  const st = sheet.body.querySelector('[data-stage]');
  try {
    const [buf] = await Promise.all([readGlb(fam), loadViewer()]);
    const bytes = rescale(buf, scaleFor(fam, cfg));
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
    const el = document.createElement('model-viewer');
    Object.entries({ src: lastUrl, alt: `${NOMBRE[fam]} en 3D${known && fam !== 'cds' ? `, a la medida de ${cfg.ancho} por ${cfg.alto} centímetros` : ''}`, ar: '', 'ar-modes': 'webxr quick-look', 'ar-scale': 'fixed', 'ar-placement': 'floor',
      'camera-controls': '', 'touch-action': 'pan-y', 'shadow-intensity': '0.8', exposure: '1', 'environment-image': 'neutral', 'interaction-prompt': 'none', 'camera-orbit': '-25deg 78deg auto' })
      .forEach(([k, v]) => el.setAttribute(k, v));
    el.innerHTML = '<span slot="ar-button" hidden></span><span slot="progress-bar"></span>';
    st.replaceChildren(el);
    await new Promise((res) => { el.addEventListener('load', res, { once: true }); setTimeout(res, 15000); });
    const act = sheet.body.querySelector('[data-act]'), qr = sheet.body.querySelector('[data-qr]');
    if (el.canActivateAR) {
      act.hidden = false;
      act.querySelector('[data-go]').onclick = () => { try { el.activateAR(); } catch (e) { console.error(e); toast('No se pudo abrir la cámara'); } };
      el.addEventListener('ar-status', (e) => { if (e.detail && e.detail.status === 'failed') toast('Tu teléfono no pudo abrir la vista con cámara'); });
    } else if (matchMedia('(pointer: coarse)').matches) {
      qr.innerHTML = '<p class="t-small">Este teléfono no tiene la vista con cámara; aquí puedes girarla y acercarla con los dedos.</p>';
      qr.hidden = false;
    } else {
      // computadora: código QR para abrirla en el celular
      const { default: qrcode } = await import('qrcode-generator');
      const q = qrcode(0, 'M'); q.addData(link(fam, cfg)); q.make();
      qr.innerHTML = `<div class="arv__code">${q.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'Código QR para abrir esta vista en tu celular' })}</div><p><b>Ábrela en tu celular</b><br><span class="t-small t-soft">Escanea el código con la cámara: se abre esta misma puerta${known && fam !== 'cds' ? ' con tu medida' : ''}, lista para verla en tu espacio.</span></p>`;
      qr.hidden = false;
    }
  } catch (e) {
    console.error(e);
    st.innerHTML = '<p class="arv__wait">No se pudo preparar la vista. Intenta de nuevo.</p>';
  }
}

// al abrir un enlace con ?ar=puerta (desde el QR), la vista se abre sola (la cámara pide un toque)
export function arFromUrl() {
  const q = new URLSearchParams(location.search), fam = q.get('ar');
  if (!fam || !ar.puertas[fam]) return;
  const cfg = { ancho: +q.get('ancho') || '', alto: +q.get('alto') || '' };
  setTimeout(() => openAR(fam, cfg), 400);
}

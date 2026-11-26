// «Verla en tu espacio»: la puerta a tamaño real con la cámara del teléfono (realidad aumentada).
// Fase 10J: modelo escalado a la medida y abierto en el visor de RA (Android con WebXR; iPhone con Quick Look, cuyo
// archivo USDZ genera el propio visor). En computadora, modelo en 3D y código QR para abrirlo en el celular.
//
// Fase 10K · más inmersiva y más manejable:
// - La puerta se abre y se cierra: botón «Ábrela», un punto para tocar sobre la hoja y una barra para abrirla a
//   cualquier ángulo. En Android funcionan también dentro de la cámara (los controles quedan sobre la imagen).
// - La medida se ajusta ahí mismo con dos barras (ancho y alto) y la puerta se rehace al momento, sin estirar
//   bisagras ni manijas (./arResize.js). Lleva sus cotas en centímetros, también dentro de la cámara.
// - En la cámara: «Tamaño real» (fija, a escala 1:1) o «Libre» (se agranda y achica con dos dedos); en Android, en el
//   piso o en la pared. Siempre se puede mover con un dedo y girar con dos.
// - CDS: los productos se pueden tomar. Cada punto sobre un producto abre la puerta, lo saca, lo trae hacia ti y lo
//   regresa a su lugar.
// - iPhone: Quick Look recibe la puerta como esté en la vista (abierta o cerrada, a la medida).
//
// Fase 11 · se abre cuando la tocas, no sola:
// - iPhone: Quick Look ya no repite la película; tocar la puerta la abre, tocarla otra vez la cierra; en la CDS, tocar
//   un producto lo saca (./usdzTap.js). Lleva el acabado elegido.
// - Android y vista previa: tocar la puerta misma (no solo el punto) la abre o la cierra.
import ar from '../data/ar.json';
import { createSheet, url, toast } from './site.js';
import { describe, defaults } from './medida.js';
import { resizeGlb, mapPoint } from './arResize.js';
import { track } from './track.js';

const NOMBRE = { abatible: 'Puerta abatible', corrediza: 'Puerta corrediza', vaiven: 'Puerta vaivén', cds: 'Juego CDS Legacy' };
// acabados que se pueden ver en la cámara (los mismos de la página de cada puerta)
export const ACABADOS = { abatible: ['hygienicWhite', 'stainless', 'blackMetal'], vaiven: ['blackMetal', 'stainless', 'hygienicWhite'] };
const ACABADO_LABEL = { hygienicWhite: 'Blanco sanitario', stainless: 'Inoxidable', blackMetal: 'Negro' };
// medidas que se pueden ver (cm); fuera de esto se ajusta a lo más cercano
export const RANGO = { abatible: { w: [70, 180], h: [180, 300] }, corrediza: { w: [100, 400], h: [200, 450] }, vaiven: { w: [140, 320], h: [200, 350] } };
const ICON = {
  open: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h8v14H4zM12 5l4-1.5v13L12 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="10.5" r=".9" fill="currentColor"/></svg>',
  take: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  push: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h9M9 6.5 12.5 10 9 13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  cam: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V4h3M14 4h3v3M17 13v3h-3M6 16H3v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 6l4 2.2v4.6L10 15l-4-2.2V8.2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};
let mvLoad = null, sheet = null, lastUrl = '';
const cache = new Map();
const loadViewer = () => (mvLoad ||= import('@google/model-viewer'));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Fase 12 · se guarda la promesa (no solo el resultado): si la vista se «calienta» antes de tocarla, el toque espera la
// misma descarga en vez de empezar otra
function readGlb(fam) {
  if (!cache.has(fam)) {
    const p = (async () => {
      const r = await fetch(url(`ar/${fam}.glbz`));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let buf = await r.arrayBuffer();
      const h = new Uint8Array(buf, 0, 2);
      if (h[0] === 0x1f && h[1] === 0x8b) {
        if (typeof DecompressionStream !== 'function') throw new Error('Este navegador no puede abrir el modelo');
        buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      }
      return buf;
    })();
    p.catch(() => cache.delete(fam));
    cache.set(fam, p);
  }
  return cache.get(fam);
}
// al acercar el dedo (o el cursor) a un botón de «verla en 3D / en tu espacio»: se empiezan a bajar el visor y el modelo
export function warmAR(fam) { if (!ar.puertas[fam]) return; loadViewer().catch(() => {}); readGlb(fam).catch(() => {}); }
// iPhone: Quick Look recibe un USDZ que se abre y se cierra cuando tocas la puerta (y, en la CDS, saca el producto que
// tocas). Nada se repite solo. Se arma aquí, del mismo GLB a la medida y con el acabado elegido, con ./usdzAnim.js (el
// exportador de three.js con línea de tiempo) y ./usdzTap.js (los comportamientos).
export const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export async function buildUSDZ(bytes, meta, fam, opts = {}) {
  const [THREE, { GLTFLoader }, { USDZAnimExporter }, { tapBehaviors }, { mergeVertices }] = await Promise.all([
    import('three'), import('three/examples/jsm/loaders/GLTFLoader.js'), import('./usdzAnim.js'), import('./usdzTap.js'), import('three/examples/jsm/utils/BufferGeometryUtils.js')]);
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buf, '');
  const scene = gltf.scene, mixer = new THREE.AnimationMixer(scene);
  // USDZ solo lleva materiales «estándar»: los que no tienen sombreado (logos, luces) pasan a estándar con brillo propio
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.isMeshBasicMaterial) return;
    const m = o.material;
    o.material = new THREE.MeshStandardMaterial({ name: m.name, color: 0x000000, emissive: m.color, emissiveMap: m.map || null, map: m.map || null, transparent: m.transparent, opacity: m.opacity, side: m.side, alphaTest: m.alphaTest });
  });
  if (opts.look) opts.look(scene, THREE);                        // acabado elegido
  const clip = (n) => gltf.animations.find((c) => c.name === n);
  const top = (o) => { let n = o; while (n.parent && n.parent !== scene) n = n.parent; return n.name || ''; };
  const meshes = []; scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  // Fase 12 · el modelo viene con cada triángulo suelto (tres vértices propios): se juntan los vértices iguales. El USDZ
  // es texto y pesaba ~10 MB en la abatible; así baja a una fracción y el iPhone lo abre antes.
  const merged = new Map();
  meshes.forEach((m) => { const g = m.geometry; if (!merged.has(g)) { try { merged.set(g, mergeVertices(g, 1e-5)); } catch { merged.set(g, g); } } m.geometry = merged.get(g); });
  const moving = meshes.filter((m) => /^(mov|prod)/.test(top(m)));
  const matrices = new Map(moving.map((m) => [m, []]));
  // ---------- línea de tiempo por tramos ----------
  const FPS = 24, segs = {};
  let frames = 0;
  const pose = (name, t) => {
    mixer.stopAllAction(); mixer.update(0);
    if (name) { const a = mixer.clipAction(clip(name)); a.reset(); a.play(); a.paused = true; a.time = t; mixer.update(0); }
    scene.updateMatrixWorld(true);
    moving.forEach((m) => matrices.get(m).push(m.matrixWorld.clone())); frames++;
  };
  const segment = (key, name, mode) => {
    const c = name && clip(name); if (name && !c) return;
    const dur = mode === 'play' ? c.duration : 1, n = Math.max(2, Math.round(dur * FPS) + 1), f0 = frames;
    const at = (k) => (mode === 'play' ? (k / (n - 1)) * c.duration : mode === 'end' ? c.duration : 0);
    for (let k = 0; k < n; k++) pose(name, at(k));
    pose(name, at(n - 1));                                       // un cuadro de margen antes del siguiente tramo
    segs[key] = { start: f0 / FPS, dur: (n - 1) / FPS };
  };
  segment('cerrada', null, 'hold');
  segment('abrir', 'abrir', 'play');
  segment('abierta', 'abrir', 'end');
  segment('cerrar', 'cerrar', 'play');
  const prods = fam === 'cds' ? (meta.productos || []) : [];
  prods.forEach((p) => segment(p.clip, p.clip, 'play'));
  mixer.stopAllAction(); mixer.update(0); scene.updateMatrixWorld(true);
  // ---------- la puerta dos veces: A (cerrada) y B (abierta) ----------
  const A = meshes.filter((m) => (fam === 'cds' ? /^mov/.test(top(m)) : !/^prod/.test(top(m))));
  const B = A.map((m) => { const c = m.clone(); c.name = `${m.name}_b`; m.parent.add(c); if (matrices.has(m)) matrices.set(c, matrices.get(m)); return c; });
  const ROOT = '/Root/Scenes/Scene/Puerta', path = (o) => `${ROOT}/Object_${o.id}`;
  const behaviors = tapBehaviors({
    root: ROOT, A: A.map(path), B: B.map(path), segs,
    prods: prods.map((p) => ({ clip: p.clip, paths: meshes.filter((m) => top(m) === `prod${p.clip.split('-')[1]}`).map(path) })),
  });
  const usdz = await new USDZAnimExporter().parseAsync(scene, { quickLookCompatible: true, maxTextureSize: 512, animation: { fps: FPS, frames, matrices }, behaviors });
  return new Blob([usdz], { type: 'model/vnd.usdz+zip' });
}

// medida en metros para el modelo: la del cliente (dentro de lo que se puede ver) o la del modelo
function sizeFor(fam, cfg) {
  const v = ar.puertas[fam].vano;
  if (fam === 'cds' || !cfg || !cfg.ancho || !cfg.alto || cfg.sinMedida) return { w: v.w, h: v.h, known: fam === 'cds', cm: null };
  const R = RANGO[fam], w = clamp(+cfg.ancho, R.w[0], R.w[1]), h = clamp(+cfg.alto, R.h[0], R.h[1]);
  return { w: w / 100, h: h / 100, known: true, cm: { w, h }, adjusted: w !== +cfg.ancho || h !== +cfg.alto };
}
const link = (fam, size) => {
  const u = new URL(location.href); u.hash = '';
  u.searchParams.set('ar', fam);
  if (fam !== 'cds' && size.cm) { u.searchParams.set('ancho', size.cm.w); u.searchParams.set('alto', size.cm.h); }
  return u.toString();
};

export async function openAR(fam, cfg0 = {}) {
  const meta = ar.puertas[fam]; if (!meta) return;
  track('ar_abrir', { puerta: fam });
  const cfg = { ...defaults(fam), ...Object.fromEntries(Object.entries(cfg0 || {}).filter(([, v]) => v !== '' && v != null)) };
  if (!sheet) { sheet = createSheet('Verla en tu espacio'); sheet.el.classList.add('sheet--ar'); }
  let size = sizeFor(fam, cfg);
  const R = RANGO[fam], v = meta.vano;
  const cmW = size.cm ? size.cm.w : Math.round(v.w * 100), cmH = size.cm ? size.cm.h : Math.round(v.h * 100);
  const prods = meta.productos || [];
  const fins = ACABADOS[fam] || [];
  let acabado = fins.includes(cfg0.acabado) ? cfg0.acabado : null;
  if (!acabado && fins.length) { try { const { vano } = await import('./vano.js'); const a = vano.get().acabado; acabado = fins.includes(a) ? a : null; } catch { /* sin almacenamiento */ } }
  sheet.meta.textContent = 'Verla en tu espacio';
  sheet.body.innerHTML = `
    <div class="arv" data-fam="${fam}">
      <div class="arv__stage" data-stage><p class="arv__wait" data-wait>Preparando la puerta…</p></div>
      <div class="arv__t"><b>${NOMBRE[fam]}</b><span data-desc></span></div>
      <div class="arv__ctl">
        <div class="arv__open">
          <button type="button" class="btn btn--line arv__toggle" data-toggle aria-pressed="false">${ICON.open}<span>Ábrela</span></button>
          <label class="arv__scrub"><span class="sr-only">Qué tanto se abre</span><input type="range" min="0" max="100" step="1" value="0" data-scrub aria-label="Qué tanto se abre la puerta"></label>
        </div>
        ${meta.interior ? `<div class="arv__seg arv__side" role="group" aria-label="Lado de la puerta"><button type="button" class="chip" data-side="fuera" aria-pressed="true">Por fuera</button><button type="button" class="chip" data-side="dentro" aria-pressed="false">Por dentro</button></div>` : ''}
        ${fins.length ? `<div class="arv__fin" role="group" aria-label="Acabado">${fins.map((f) => `<button type="button" class="arv__sw arv__sw--${f}" data-fin="${f}" aria-pressed="${f === (acabado || fins[0])}"><i aria-hidden="true"></i><span>${ACABADO_LABEL[f]}</span></button>`).join('')}</div>` : ''}
        ${fam === 'cds' ? `<p class="arv__hint t-small">Toca un <b>+</b> sobre un producto para tomarlo: la puerta se abre, el producto viene hacia ti y regresa a su parrilla.</p>` : `
        <fieldset class="arv__size">
          <legend>Medida del vano</legend>
          <label><span>Ancho</span><input type="range" min="${R.w[0]}" max="${R.w[1]}" step="5" value="${cmW}" data-k="w"><output data-o="w">${cmW} cm</output></label>
          <label><span>Alto</span><input type="range" min="${R.h[0]}" max="${R.h[1]}" step="5" value="${cmH}" data-k="h"><output data-o="h">${cmH} cm</output></label>
        </fieldset>`}
        <div class="arv__opts">
          <div class="arv__seg" role="group" aria-label="Tamaño en la cámara">
            <button type="button" class="chip" data-scale="fixed" aria-pressed="true">Tamaño real</button>
            <button type="button" class="chip" data-scale="auto" aria-pressed="false">Libre</button>
          </div>
          <div class="arv__seg" role="group" aria-label="Dónde ponerla" data-place-group hidden>
            <button type="button" class="chip" data-place="floor" aria-pressed="true">En el piso</button>
            <button type="button" class="chip" data-place="wall" aria-pressed="false">En la pared</button>
          </div>
        </div>
      </div>
      <div class="arv__act" data-act hidden><button type="button" class="btn" data-go>${ICON.cam}<span>Verla con la cámara</span></button></div>
      <div class="arv__qr" data-qr hidden></div>
      <p class="t-small t-soft arv__note" data-note></p>
    </div>`;
  sheet.open();
  const $ = (s) => sheet.body.querySelector(s);
  const st = $('[data-stage]'), desc = $('[data-desc]'), note = $('[data-note]');
  const setDesc = () => {
    if (fam === 'cds') desc.textContent = 'Tres puertas con autocierre, con parrillas y productos.';
    else desc.textContent = size.cm ? `${describe(fam, { ...cfg, ancho: size.cm.w, alto: size.cm.h })}` : 'Con la medida del modelo: muévela con las barras o escribe la de tu vano.';
  };
  setDesc();
  if (size.adjusted) toast(`Para verla la ajustamos a ${size.cm.w} × ${size.cm.h} cm, lo más cercano a tu medida`);
  const state = { open: 0, busy: false, scale: 'fixed', place: 'floor', map: null };

  let el;
  try {
    const [buf] = await Promise.all([readGlb(fam), loadViewer()]);
    el = document.createElement('model-viewer');
    Object.entries({ alt: `${NOMBRE[fam]} en 3D`, ar: '', 'ar-modes': 'webxr quick-look', 'ar-scale': 'fixed', 'ar-placement': 'floor', 'xr-environment': '',
      'camera-controls': '', 'touch-action': 'pan-y', 'shadow-intensity': '1', 'shadow-softness': '0.8', exposure: '1', 'environment-image': 'neutral', 'interaction-prompt': 'none',
      'camera-orbit': '-28deg 76deg auto', 'animation-crossfade-duration': '0', 'min-camera-orbit': 'auto 20deg auto', 'max-camera-orbit': 'auto 100deg auto' })
      .forEach(([k, val]) => el.setAttribute(k, val));
    const prodBtns = prods.map((p, k) => `<button type="button" slot="hotspot-p${k}" class="arv__hs arv__hs--p" data-take="${k}" data-position="${p.punto.join(' ')}" data-normal="0 0 1" aria-label="Tomar ${p.nombre}">${ICON.take}</button>`).join('');
    el.innerHTML = `<span slot="ar-button" hidden></span><span slot="progress-bar"></span>
      <button type="button" slot="hotspot-abrir" class="arv__hs arv__hs--open" data-tap data-position="0 0 0" data-normal="0 0 1">${ICON.open}<span>Ábrela</span></button>
      ${fam === 'cds' ? prodBtns : `
      <div slot="hotspot-dw0" class="arv__pt" data-position="0 0 0"></div><div slot="hotspot-dw1" class="arv__pt" data-position="0 0 0"></div>
      <div slot="hotspot-dh0" class="arv__pt" data-position="0 0 0"></div><div slot="hotspot-dh1" class="arv__pt" data-position="0 0 0"></div>
      <div slot="hotspot-dw" class="arv__dim" data-position="0 0 0" aria-hidden="true"></div>
      <div slot="hotspot-dh" class="arv__dim arv__dim--h" data-position="0 0 0" aria-hidden="true"></div>
      <svg class="arv__lines" aria-hidden="true"><line data-l="w"/><line data-l="h"/></svg>`}
      ${meta.interior ? `<button type="button" slot="hotspot-lib" class="arv__hs arv__hs--lib" data-position="0 0 0" data-normal="0 0 -1" data-visibility-attribute="visible" data-lib aria-label="Liberador: desde adentro, se empuja y abre">${ICON.push || ''}<span>Liberador: desde adentro, se empuja y abre</span></button>` : ''}
      <p class="arv__took" data-took aria-live="polite"></p>
      <div class="arv__xr" data-xr>
        <p class="arv__xrhint">Muévela con un dedo · gírala con dos</p>
        <div class="arv__xrbar">
          <button type="button" class="arv__xrbtn" data-toggle aria-pressed="false">${ICON.open}<span>Ábrela</span></button>
          <input type="range" min="0" max="100" step="1" value="0" data-scrub aria-label="Qué tanto se abre la puerta">
        </div>
      </div>`;
    st.replaceChildren(el);

    // ---------- modelo a la medida ----------
    const place = () => {
      const m = state.map, cm = { w: Math.round(size.w * 100), h: Math.round(size.h * 100) };
      const P = (p) => mapPoint(m, p).map((n) => n.toFixed(4)).join(' ');
      const hs = (name, p) => { const h = el.querySelector(`[slot="hotspot-${name}"]`); if (h) h.dataset.position = P(p); };
      hs('abrir', meta.abrir.punto);
      if (meta.interior) hs('lib', meta.interior.punto);
      if (fam !== 'cds') {
        const L = v.cx - v.w / 2, Rr = v.cx + v.w / 2, z = meta.caja.max[2] + 0.04, F = v.floor, T = v.floor + v.h;
        hs('dw0', [L, F + 0.03, z]); hs('dw1', [Rr, F + 0.03, z]); hs('dw', [v.cx, F + 0.03, z]);
        hs('dh0', [Rr + 0.05, F, z]); hs('dh1', [Rr + 0.05, T, z]); hs('dh', [Rr + 0.05, F + v.h / 2, z]);
        el.querySelector('[slot="hotspot-dw"]').textContent = `${cm.w} cm`;
        el.querySelector('[slot="hotspot-dh"]').textContent = `${cm.h} cm`;
      }
      el.querySelectorAll('[slot^="hotspot-"]').forEach((h) => el.updateHotspot && el.updateHotspot({ name: h.slot, position: h.dataset.position, normal: h.dataset.normal || '0 0 1' }));
    };
    let iosUrl = '', tIos = 0;
    const prepIOS = (bytes) => {
      if (!isIOS()) return;
      clearTimeout(tIos);
      // la primera vez se arma de inmediato (para que el botón de la cámara ya lo tenga); al mover la medida, al soltar
      tIos = setTimeout(async () => {
        try { const blob = await buildUSDZ(bytes, meta, fam); if (iosUrl) URL.revokeObjectURL(iosUrl); iosUrl = URL.createObjectURL(blob); el.setAttribute('ios-src', iosUrl); }
        catch (e) { console.error(e); el.removeAttribute('ios-src'); }            // si falla, el visor arma el suyo (fijo)
      }, iosUrl ? 700 : 0);
    };
    const build = () => {
      const { bytes, map } = resizeGlb(buf, meta, fam, { w: size.w, h: size.h }, acabado);
      state.map = map; prepIOS(bytes);
      const old = lastUrl;
      lastUrl = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
      el.src = lastUrl; place();
      if (old) setTimeout(() => URL.revokeObjectURL(old), 4000);
    };
    const loaded = new Promise((res) => { el.addEventListener('load', res, { once: true }); setTimeout(res, 20000); });
    build();
    await loaded;
    sheet.body.querySelector('[data-wait]')?.remove();

    // ---------- abrir y cerrar ----------
    const dur = (n) => (meta.clips && meta.clips[n]) || 1.5;
    const useClip = async (n) => { if (el.animationName !== n) { el.animationName = n; await el.updateComplete; } };
    const ui = () => {
      sheet.body.querySelectorAll('[data-toggle]').forEach((b) => { b.setAttribute('aria-pressed', String(state.open > 0.5)); b.querySelector('span').textContent = state.open > 0.5 ? 'Ciérrala' : 'Ábrela'; });
      const tap = el.querySelector('[data-tap] span'); if (tap) tap.textContent = state.open > 0.5 ? 'Ciérrala' : 'Ábrela';
      sheet.body.querySelectorAll('[data-scrub]').forEach((r) => { if (document.activeElement !== r) r.value = Math.round(state.open * 100); });
    };
    const pose = async (s) => { await useClip('abrir'); el.play({ repetitions: 1 }); el.pause(); el.currentTime = s * dur('abrir'); state.open = s; ui(); };
    const waitEnd = (t) => new Promise((res) => { const done = () => { el.removeEventListener('finished', done); clearTimeout(to); res(); }; const to = setTimeout(done, t * 1000 + 600); el.addEventListener('finished', done); });
    const animateTo = async (target) => {
      if (state.busy) return; state.busy = true;
      try {
        const from = state.open;
        if (reduced()) { await pose(target); return; }
        if (Math.abs(target - from) > 0.001) {
          const clip = target > from ? 'abrir' : 'cerrar', D = dur(clip);
          await useClip(clip); el.play({ repetitions: 1 }); el.currentTime = (target > from ? from : 1 - from) * D;
          await waitEnd(D * Math.abs(target - from));
        }
        state.open = target; ui();
      } finally { state.busy = false; }
    };
    sheet.body.querySelectorAll('[data-toggle]').forEach((b) => { b.onclick = () => animateTo(state.open > 0.5 ? 0 : 1); });
    el.querySelector('[data-tap]').onclick = (e) => { e.stopPropagation(); animateTo(state.open > 0.5 ? 0 : 1); };
    sheet.body.querySelectorAll('[data-scrub]').forEach((r) => { r.oninput = () => { if (!state.busy) pose(+r.value / 100); }; });
    // tocar la puerta misma (no solo el punto) la abre o la cierra; arrastrar para girarla no cuenta como toque
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    el.addEventListener('click', (e) => {
      if (!down || e.target.closest('[slot^="hotspot-"], .arv__xr')) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 450; down = null;
      if (moved > 10 || !quick || state.busy) return;
      const r = el.getBoundingClientRect(), hit = el.positionAndNormalFromPoint && el.positionAndNormalFromPoint(e.clientX - r.left, e.clientY - r.top);
      if (hit) animateTo(state.open > 0.5 ? 0 : 1);
    });

    // ---------- CDS: tomar un producto ----------
    const took = el.querySelector('[data-took]');
    el.querySelectorAll('[data-take]').forEach((b) => {
      b.onclick = async (e) => {
        e.stopPropagation(); if (state.busy) return;
        const k = +b.dataset.take, p = prods[k];
        if (state.open < 0.99) await animateTo(1);
        state.busy = true; el.classList.add('is-taking');
        took.textContent = `Tomaste: ${p.nombre}`; took.classList.add('is-on');
        // en la vista previa la cámara se acerca al producto mientras viene hacia ti (en la cámara del teléfono, no)
        const inAR = el.classList.contains('in-ar'), cam = { o: el.getAttribute('camera-orbit'), t: el.getAttribute('camera-target') };
        if (!inAR && p.cerca && !reduced()) {
          setTimeout(() => { el.cameraTarget = `${p.cerca[0]}m ${p.cerca[1]}m ${p.cerca[2]}m`; el.cameraOrbit = '-14deg 84deg 0.55m'; }, 900);
        }
        try { await useClip(p.clip); el.play({ repetitions: 1 }); el.currentTime = 0; await waitEnd(dur(p.clip)); }
        finally {
          state.busy = false; el.classList.remove('is-taking'); took.classList.remove('is-on'); state.open = 1; ui();
          if (!inAR && p.cerca) { el.cameraTarget = cam.t || 'auto auto auto'; el.cameraOrbit = cam.o || '-28deg 76deg auto'; }
        }
      };
    });

    // ---------- cotas ----------
    const lines = el.querySelector('.arv__lines');
    const drawLines = () => {
      if (!lines) return;
      const q = (n) => el.queryHotspot && el.queryHotspot(`hotspot-${n}`);
      for (const [l, a, b] of [['w', 'dw0', 'dw1'], ['h', 'dh0', 'dh1']]) {
        const A = q(a), B = q(b), ln = lines.querySelector(`[data-l="${l}"]`);
        if (!A || !B) continue;
        ln.setAttribute('x1', A.canvasPosition.x); ln.setAttribute('y1', A.canvasPosition.y); ln.setAttribute('x2', B.canvasPosition.x); ln.setAttribute('y2', B.canvasPosition.y);
      }
    };
    el.addEventListener('camera-change', drawLines); el.addEventListener('load', () => { place(); requestAnimationFrame(drawLines); if (state.open > 0) pose(state.open); });
    requestAnimationFrame(drawLines);

    // ---------- medida en vivo ----------
    let tBuild = 0, lastBuild = 0;
    const rebuild = () => { clearTimeout(tBuild); const wait = Math.max(0, 260 - (performance.now() - lastBuild)); tBuild = setTimeout(() => { lastBuild = performance.now(); build(); }, wait); };
    sheet.body.querySelectorAll('.arv__size input').forEach((r) => {
      r.oninput = () => {
        const w = +sheet.body.querySelector('[data-k=w]').value, h = +sheet.body.querySelector('[data-k=h]').value;
        sheet.body.querySelector('[data-o=w]').textContent = `${w} cm`; sheet.body.querySelector('[data-o=h]').textContent = `${h} cm`;
        size = { w: w / 100, h: h / 100, known: true, cm: { w, h } }; setDesc(); rebuild();
      };
      r.onchange = async () => {
        // la medida es una sola para todo el sitio
        try { const { vano } = await import('./vano.js'); vano.set({ fam, ancho: size.cm.w, alto: size.cm.h }); } catch { /* sin almacenamiento */ }
      };
    });

    // ---------- acabado: la puerta cambia al momento (y la cámara la recibe igual) ----------
    sheet.body.querySelectorAll('[data-fin]').forEach((b) => {
      b.onclick = async () => {
        if (b.dataset.fin === acabado) return;
        acabado = b.dataset.fin; sheet.body.querySelectorAll('[data-fin]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        rebuild(); toast(`Acabado: ${ACABADO_LABEL[acabado]}`);
        try { const { vano } = await import('./vano.js'); vano.set({ acabado }); } catch { /* sin almacenamiento */ }
      };
    });

    // ---------- opciones de cámara ----------
    const seg = (attr, key, apply) => sheet.body.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      b.onclick = () => { state[key] = b.dataset[attr]; sheet.body.querySelectorAll(`[data-${attr}]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); apply(); };
    });
    seg('scale', 'scale', () => el.setAttribute('ar-scale', state.scale));
    // Fase 12 · «Por dentro»: la cámara pasa del otro lado de la puerta y se acerca al liberador (la manija de emergencia
    // que trae la abatible por dentro); «Por fuera» regresa a la vista de siempre
    const ORBIT0 = el.getAttribute('camera-orbit');
    const side = (inside) => {
      sheet.body.querySelectorAll('[data-side]').forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.side === 'dentro') === inside)));
      el.classList.toggle('is-inside', inside);
      if (inside && meta.interior) {
        const p = mapPoint(state.map, meta.interior.punto);
        el.setAttribute('min-camera-orbit', 'auto 20deg 0.9m');
        el.cameraTarget = `${(p[0] - 0.08).toFixed(3)}m ${(p[1] - 0.04).toFixed(3)}m ${p[2].toFixed(3)}m`; el.cameraOrbit = '194deg 84deg 1.35m';
      } else { el.cameraTarget = 'auto auto auto'; el.cameraOrbit = ORBIT0; }
    };
    sheet.body.querySelectorAll('[data-side]').forEach((b) => { b.onclick = () => side(b.dataset.side === 'dentro'); });
    const lib = el.querySelector('[data-lib]'); if (lib) lib.onclick = () => side(true);
    seg('place', 'place', () => el.setAttribute('ar-placement', state.place));

    // ---------- dentro de la cámara ----------
    el.addEventListener('ar-status', (e) => {
      const s = e.detail && e.detail.status;
      el.classList.toggle('in-ar', s === 'session-started' || s === 'object-placed');
      if (s === 'failed') toast('Tu teléfono no pudo abrir la vista con cámara');
    });

    const act = $('[data-act]'), qr = $('[data-qr]');
    const webxr = el.canActivateAR && !/iP(hone|ad|od)/.test(navigator.userAgent) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (el.canActivateAR) {
      act.hidden = false;
      $('[data-place-group]').hidden = !webxr;
      $('[data-go]').onclick = () => { try { el.activateAR(); } catch (e) { console.error(e); toast('No se pudo abrir la cámara'); } };
      note.textContent = webxr
        ? 'Apunta el teléfono al piso (o a la pared) donde va la puerta y tócalo para ponerla. Con un dedo la mueves, con dos la giras; tócala o usa el botón de abajo para abrirla. La medida es aproximada: la puerta se fabrica a la medida exacta de tu vano.'
        : `Apunta el teléfono al piso frente a tu vano: la puerta aparece a tu medida. ${fam === 'cds' ? 'Toca una puerta para abrirla y toca un producto para tomarlo.' : 'Tócala para abrirla y otra vez para cerrarla.'} Con un dedo la mueves, con dos la giras. La medida es aproximada: la puerta se fabrica a la medida exacta de tu vano.`;
    } else if (matchMedia('(pointer: coarse)').matches) {
      note.textContent = 'Este teléfono no tiene la vista con cámara; aquí puedes girarla, acercarla con los dedos, abrirla y cambiarle la medida.';
    } else {
      const { default: qrcode } = await import('qrcode-generator');
      const draw = () => {
        const q = qrcode(0, 'M'); q.addData(link(fam, size)); q.make();
        qr.innerHTML = `<div class="arv__code">${q.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'Código QR para abrir esta vista en tu celular' })}</div><p><b>Ábrela en tu celular</b><br><span class="t-small t-soft">Escanea el código con la cámara: se abre esta misma puerta${size.cm ? ' con esta medida' : ''}, lista para verla en tu espacio.</span></p>`;
      };
      draw(); qr.hidden = false;
      sheet.body.querySelectorAll('.arv__size input').forEach((r) => r.addEventListener('change', draw));
      note.textContent = 'Gírala con el mouse, ábrela y ajusta la medida; en el celular la ves a tamaño real con la cámara.';
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

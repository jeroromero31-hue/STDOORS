// Texturas procedurales para los materiales (sin recursos de terceros).
import * as THREE from 'three';

function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function toTexture(canvas, { srgb = false, repeat = [1, 1], aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = aniso;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

// altura -> mapa normal en espacio tangente
function normalFromHeight(H, w, h, strength) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  const at = (x, y) => H[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), o = (y * w + x) * 4;
    img.data[o] = (-dx / l * 0.5 + 0.5) * 255; img.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}

// Acero inoxidable cepillado: vetas finas en una sola dirección (rugosidad)
export function brushedRoughness(base = 0.26, spread = 0.10) {
  const W = 512, Hh = 512, r = seeded(7), c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'), v = Math.round(base * 255);
  g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 5200; i++) {
    const y = r() * Hh, len = 40 + r() * 420, x = r() * W, k = Math.round((base + (r() - 0.5) * 2 * spread) * 255);
    g.strokeStyle = `rgba(${k},${k},${k},${0.25 + r() * 0.35})`; g.lineWidth = 0.6 + r() * 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 0.8); g.stroke();
    if (x + len > W) { g.beginPath(); g.moveTo(x - W, y); g.lineTo(x + len - W, y); g.stroke(); }
  }
  return toTexture(c, { repeat: [2, 2] });
}

// Micro-textura satinada (negro y aluminio)
export function satinRoughness(base = 0.4, spread = 0.06, seed = 3) {
  const S = 256, r = seeded(seed), c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let i = 0; i < S * S; i++) { const k = Math.round(Math.min(1, Math.max(0, base + (r() - 0.5) * 2 * spread)) * 255); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = k; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); g.filter = 'blur(0.6px)'; g.drawImage(c, 0, 0);
  return toTexture(c, { repeat: [6, 6] });
}

// Pintura/laminado blanco: piel de naranja muy suave (normal), sin manchas
export function orangePeelNormal() {
  const S = 256, r = seeded(11), H = new Float32Array(S * S);
  for (let o = 0; o < 3; o++) {
    const n = 8 << o, amp = 1 / (o + 1), grid = [];
    for (let i = 0; i < (n + 1) * (n + 1); i++) grid.push(r());
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const gx = x / S * n, gy = y / S * n, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const v = (a, b) => grid[(b % n) * (n + 1) + (a % n)];
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      H[y * S + x] += amp * ((v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy);
    }
  }
  return toTexture(normalFromHeight(H, S, S, 0.9), { repeat: [3, 3] });
}

// Placa diamante (bumper): resaltes alternados a ±45°
export function diamondPlate() {
  const S = 512, N = 4, p = S / N, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.filter = 'blur(1.4px)';
  for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) {
    g.save(); g.translate((i + 0.5) * p, (j + 0.5) * p); g.rotate(((i + j) & 1) ? -Math.PI / 4 : Math.PI / 4);
    const L = p * 0.78, Wd = p * 0.17, grd = g.createLinearGradient(0, -Wd / 2, 0, Wd / 2);
    grd.addColorStop(0, '#000'); grd.addColorStop(0.5, '#fff'); grd.addColorStop(1, '#000');
    g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, L / 2, Wd / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  const d = g.getImageData(0, 0, S, S).data, H = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) H[i] = d[i * 4] / 255;
  const rough = document.createElement('canvas'); rough.width = rough.height = S;
  const rg = rough.getContext('2d'); rg.fillStyle = 'rgb(80,80,80)'; rg.fillRect(0, 0, S, S); rg.globalAlpha = 0.5; rg.globalCompositeOperation = 'darken'; rg.drawImage(c, 0, 0);
  return { normal: toTexture(normalFromHeight(H, S, S, 3), { repeat: [1, 1] }), roughness: toTexture(rough, { repeat: [1, 1] }) };
}

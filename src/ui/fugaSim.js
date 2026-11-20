// Fase 10K · la fuga de frío vista como en una cámara térmica: corte de una cámara frigorífica con la puerta
// abierta. El aire frío sale por abajo y se extiende por el piso; el tibio entra por arriba y sube al techo de la
// cámara. Es una ilustración (no una simulación de fluidos): un campo de temperatura que se arrastra con un campo de
// velocidad hecho a mano con la forma de la corriente de Gosney y Olama, más rápido cuanto mayor es la diferencia
// de temperatura y la altura de la puerta. Colores: la misma escala térmica de «Ver el frío».
import { THERMAL_STOPS } from '../core/thermal.js';

const GW = 128, GH = 64;
const rgb = THERMAL_STOPS.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const LUT = new Uint8ClampedArray(256 * 3);
for (let i = 0; i < 256; i++) {
  const s = (i / 255) * 7, k = Math.min(6, Math.floor(s)), f = s - k;
  for (let c = 0; c < 3; c++) LUT[i * 3 + c] = rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * f;
}

export function mountFugaSim(canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas'); off.width = GW; off.height = GH;
  const octx = off.getContext('2d'), img = octx.createImageData(GW, GH);
  let T = new Float32Array(GW * GH), T2 = new Float32Array(GW * GH);
  const WALL = 0.46, WALL_W = 0.035;                 // muro de la cámara (fracción del ancho)
  const st = { open: 1, openGoal: 1, U: 0.6, ho: 0.6, tIn: 2, tOut: 30, running: false, visible: true, raf: 0, last: 0 };
  const cold = 0.1, warmBase = 0.78;
  const base = (x) => (x < WALL ? cold : warmBase);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) T[j * GW + i] = base(i / GW);

  // velocidad (en fracciones del ancho por segundo): x a la derecha, y hacia arriba (y = 0 es el piso)
  const vel = (x, y, out) => {
    const U = st.U * st.open, ho = st.ho, wx = WALL + WALL_W / 2;
    let u = 0, v = 0;
    const dx = x - wx;
    if (Math.abs(dx) < 0.07) {
      if (y < ho) u = U * (1 - (2 * y) / ho) * 1.1;
    } else if (dx > 0) {
      const fall = Math.exp(-dx / 0.55);
      u += U * 0.95 * Math.exp(-y / 0.1) * fall;                               // el frío se extiende por el piso
      v += -U * 0.25 * Math.exp(-((y - ho * 0.35) ** 2) / 0.02) * Math.exp(-dx / 0.12);   // y cae al salir
      u += -U * 0.55 * Math.exp(-(((y - ho * 0.82) / 0.16) ** 2)) * Math.exp(-dx / 0.35);   // el tibio entra por arriba
    } else {
      const d = -dx, fall = Math.exp(-d / 0.5);
      u += U * 0.7 * Math.exp(-y / 0.12) * fall;                                // el frío de la cámara corre hacia la puerta
      u += -U * 0.75 * Math.exp(-(((y - Math.min(0.95, ho * 0.95 + 0.08)) / 0.14) ** 2)) * Math.exp(-d / 0.45);  // el tibio entra arriba
      v += U * 0.35 * Math.exp(-((y - ho * 0.7) ** 2) / 0.03) * Math.exp(-d / 0.1);       // y sube al techo
    }
    out[0] = u; out[1] = v;
  };
  const sample = (A, x, y) => {
    const fx = Math.min(GW - 1.001, Math.max(0, x * GW - 0.5)), fy = Math.min(GH - 1.001, Math.max(0, y * GH - 0.5));
    const i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * GW + i;
    return (A[k] * (1 - a) + A[k + 1] * a) * (1 - b) + (A[k + GW] * (1 - a) + A[k + GW + 1] * a) * b;
  };
  const vv = [0, 0];
  const step = (dt) => {
    const aspect = GH / GW;
    for (let j = 0; j < GH; j++) {
      const y = (j + 0.5) / GH;
      for (let i = 0; i < GW; i++) {
        const x = (i + 0.5) / GW, k = j * GW + i;
        const inWall = x > WALL && x < WALL + WALL_W && y > st.ho;
        if (inWall) { T2[k] = 0.42; continue; }
        vel(x, y, vv);
        let t = sample(T, x - vv[0] * dt, y - (vv[1] * dt) / aspect);
        // fuentes: lo lejano vuelve a su temperatura; el equipo enfría la cámara
        const relax = x < 0.08 || x > 0.94 ? 0.2 : x < WALL ? 0.012 : 0.006;
        t += (base(x) - t) * relax;
        T2[k] = t;
      }
    }
    [T, T2] = [T2, T];
  };
  const draw = () => {
    const d = img.data;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const t = T[(GH - 1 - j) * GW + i], n = Math.max(0, Math.min(255, (t * 255) | 0)) * 3, p = (j * GW + i) * 4;
      d[p] = LUT[n]; d[p + 1] = LUT[n + 1]; d[p + 2] = LUT[n + 2]; d[p + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, w, h);
    // muro, techo y piso
    const X = (x) => x * w, Y = (y) => h - y * h;
    ctx.fillStyle = 'rgba(4, 12, 40, .78)';
    ctx.fillRect(X(WALL), Y(1), X(WALL_W), Y(st.ho) - Y(1));
    ctx.fillRect(0, 0, X(WALL + WALL_W), Math.max(2, h * 0.012));
    ctx.fillStyle = 'rgba(255, 255, 255, .55)'; ctx.fillRect(0, h - Math.max(2, h * 0.01), w, Math.max(2, h * 0.01));
    // hoja de la puerta: cerrada tapa el vano; al abrir se desvanece
    if (st.open < 0.98) {
      ctx.fillStyle = `rgba(232, 240, 245, ${0.92 * (1 - st.open)})`;
      ctx.fillRect(X(WALL), Y(st.ho), X(WALL_W), Y(0) - Y(st.ho) - Math.max(2, h * 0.01));
    }
    // flechas de la corriente
    if (st.open > 0.05) {
      const t = performance.now() / 1000;
      ctx.strokeStyle = 'rgba(255, 255, 255, .85)'; ctx.fillStyle = 'rgba(255, 255, 255, .85)'; ctx.lineWidth = Math.max(1.5, w * 0.004);
      const arrow = (x0, y0, x1, y1) => {
        ctx.setLineDash([w * 0.012, w * 0.012]); ctx.lineDashOffset = -t * w * 0.05 * st.U * st.open * (x1 > x0 ? 1 : 1);
        ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); ctx.setLineDash([]);
        const ang = Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0)), s = w * 0.016;
        ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x1) - s * Math.cos(ang - 0.5), Y(y1) - s * Math.sin(ang - 0.5)); ctx.lineTo(X(x1) - s * Math.cos(ang + 0.5), Y(y1) - s * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
      };
      arrow(WALL - 0.12, st.ho * 0.16, WALL + 0.2, st.ho * 0.12);
      arrow(WALL + 0.2, st.ho * 0.84, WALL - 0.12, st.ho * 0.88);
      ctx.globalAlpha = Math.min(1, st.open * 1.4);
      ctx.font = `700 ${Math.max(11, Math.round(w * 0.026))}px Outfit, system-ui, sans-serif`; ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(4, 12, 40, .8)'; ctx.shadowBlur = 6; ctx.fillStyle = '#fff';
      ctx.textAlign = 'left'; ctx.fillText('Sale el frío', X(WALL + 0.05), Y(st.ho * 0.14) - w * 0.012);
      ctx.textAlign = 'right'; ctx.fillText('Entra el aire tibio', X(WALL + 0.2), Y(st.ho * 0.88) - w * 0.012);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  };
  const loop = (now) => {
    st.raf = 0;
    if (!st.running || !st.visible) return;
    const dt = Math.min(0.05, (now - (st.last || now)) / 1000); st.last = now;
    st.open += (st.openGoal - st.open) * Math.min(1, dt * 2.5);
    step(dt * 1.0); step(dt * 1.0);
    draw();
    st.raf = requestAnimationFrame(loop);
  };
  const size = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(2, Math.round(r.width * dpr)); canvas.height = Math.max(2, Math.round(r.height * dpr));
    draw();
  };
  new ResizeObserver(size).observe(canvas);
  const io = new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; if (st.visible) start(); }, { rootMargin: '100px' });
  io.observe(canvas);
  const start = () => { if (reduced) { for (let k = 0; k < 240; k++) step(0.03); draw(); return; } st.running = true; if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  size(); start();
  return {
    // velocidad de la corriente (m/s) y alto de la puerta respecto al corte (4 m)
    set({ velocidad, alto, tIn, tOut }) {
      st.U = Math.min(1.4, 0.18 + velocidad * 0.33); st.ho = Math.min(0.92, Math.max(0.35, alto / 400)); st.tIn = tIn; st.tOut = tOut;
      if (reduced) start();
    },
    setOpen(on) { st.openGoal = on ? 1 : 0; if (reduced) { st.open = st.openGoal; start(); } },
    get open() { return st.openGoal > 0.5; },
  };
}

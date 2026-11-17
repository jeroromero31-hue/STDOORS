// Fase 10G · extensión de la página de la vaivén: «Simular paso».
// Las dos hojas se abren de golpe como si pasara alguien con un carro, se quedan un momento y regresan solas al centro,
// pasándose un poco del otro lado antes de quedar quietas (vaivén). Con la vista térmica se ve cuánto frío sale en un paso.
export function mountVaivenExtras({ viewer, stage, live, door }) {
  const btn = document.querySelector('[data-paso-btn]');
  if (!btn || !viewer.hinges) return;
  const [hl, hr] = viewer.hinges;
  let t0 = 0, running = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN = -68, T_OPEN = 0.32, T_HOLD = 0.75, T_BACK = 2.6;
  const angleAt = (t, lag) => {
    t -= lag; if (t <= 0) return 0;
    if (t < T_OPEN) { const k = t / T_OPEN; return OPEN * (1 - (1 - k) ** 3); }
    if (t < T_OPEN + T_HOLD) return OPEN;
    const u = t - T_OPEN - T_HOLD; if (u > T_BACK) return 0;
    return OPEN * Math.exp(-2.6 * u) * Math.cos(5.2 * u);                    // regresa y se pasa un poco del centro
  };
  stage.onFrame.add(() => {
    if (!running) return;
    const t = (performance.now() - t0) / 1000;
    hl.jump(angleAt(t, 0)); hr.jump(angleAt(t, 0.06));
    stage.invalidate(2);
    if (t > T_OPEN + T_HOLD + T_BACK + 0.1) { running = false; hl.jump(0); hr.jump(0); btn.disabled = false; live.textContent = 'Las hojas regresaron al centro'; }
  });
  btn.onclick = () => {
    if (reduced()) { live.textContent = 'Con movimiento reducido no se simula el paso'; return; }
    t0 = performance.now(); running = true; btn.disabled = true; live.textContent = 'Simulando un paso por la vaivén';
  };
  door.addEventListener('door:step', (e) => { if (!e.detail.block.contains(btn) && running) { running = false; btn.disabled = false; } });
}

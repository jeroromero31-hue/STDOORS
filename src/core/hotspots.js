// Puntos de pieza: anclas 3D proyectadas a botones HTML (accesibles con teclado).
import * as THREE from 'three';

export function createHotspots(stage, layer, items, onPick) {
  const v = new THREE.Vector3();
  const nodes = items.map((it, i) => {
    const b = document.createElement('button');
    b.className = 'hotspot'; b.type = 'button'; b.textContent = i + 1; b.setAttribute('aria-label', it.label);
    b.onclick = () => onPick(it, b); layer.append(b);
    return { it, b };
  });
  // después de mover la cámara en el cuadro (stage.afterFrame): con la cámara de antes, durante un vuelo los puntos
  // iban un cuadro atrás y un punto con foco podía darse por fuera de la pantalla y perder el foco del teclado
  (stage.afterFrame || stage.onFrame).add(() => {
    if (layer.hidden) return;
    const w = layer.clientWidth, h = layer.clientHeight;
    for (const { it, b } of nodes) {
      v.copy(it.position); (it.parent || stage.scene).localToWorld(v); v.project(stage.camera);
      const ok = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      b.style.display = ok ? '' : 'none';
      if (ok) b.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  });
  return { nodes };
}

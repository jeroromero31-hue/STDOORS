// Muro y piso comunes a todas las puertas. "Blanco es afuera, azul marino es adentro":
// en modo interior el muro deja de recibir luz y emite el azul marino exacto de la página.
import * as THREE from 'three';

const OUT = { wall: new THREE.Color(0xf4f6f7), floor: new THREE.Color(0xe2e7ea) };
const IN = { wall: new THREE.Color(0x052f49), floor: new THREE.Color(0x04283f) };
const BLACK = new THREE.Color(0x000000);

// wallZ: cara frontal del muro · floorY: nivel del piso · opening: vano { left, right, top } o null para muro continuo
export function createBackdrop(stage, { wallZ = 0, floorY = 0, centerX = 0, halfWidth = 7, height = 3.4, thickness = 0.12, floorDepth = 9, opening = null, interiorDepth = 1.2 } = {}) {
  const group = new THREE.Group(); group.name = 'MuroYPiso';
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: OUT.wall.clone(), roughness: 0.92 }),
    floor: new THREE.MeshStandardMaterial({ color: OUT.floor.clone(), roughness: 0.75 }),
    interior: new THREE.MeshBasicMaterial({ color: IN.wall.clone(), side: THREE.BackSide }),
  };
  const slab = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness), materials.wall);
    m.position.set(x, y, wallZ - thickness / 2); m.castShadow = true; m.receiveShadow = true; group.add(m);
  };
  const x0 = centerX - halfWidth, x1 = centerX + halfWidth, yTop = floorY + height;
  if (opening) {
    const { left, right, top } = opening;
    // una sola pieza con el vano recortado: con tres losas juntas, las uniones se veían como rayas finas sobre el marco
    const outline = new THREE.Shape([[x0, floorY], [left, floorY], [left, top], [right, top], [right, floorY], [x1, floorY], [x1, yTop], [x0, yTop]].map(([x, y]) => new THREE.Vector2(x, y)));
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, { depth: thickness, bevelEnabled: false }), materials.wall);
    wall.position.z = wallZ - thickness; wall.castShadow = true; wall.receiveShadow = true; group.add(wall);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(right - left + 0.4, top - floorY + 0.2, interiorDepth), materials.interior);
    inner.position.set((left + right) / 2, (top + floorY) / 2, wallZ - thickness - interiorDepth / 2); group.add(inner);
  } else {
    slab(2 * halfWidth, height, centerX, floorY + height / 2);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * halfWidth, floorDepth), materials.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(centerX, floorY, wallZ - 0.1 + floorDepth / 2); floor.receiveShadow = true; group.add(floor);

  let inside = 0, target = 0;
  stage.onFrame.add((dt) => {
    if (inside === target) return;
    const step = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : dt / 0.5;
    inside = target > inside ? Math.min(1, inside + step) : Math.max(0, inside - step);
    materials.wall.color.lerpColors(OUT.wall, BLACK, inside); materials.floor.color.lerpColors(OUT.floor, BLACK, inside);
    materials.wall.emissive.lerpColors(BLACK, IN.wall, inside); materials.floor.emissive.lerpColors(BLACK, IN.floor, inside);
  });
  return { group, materials, setInside(on) { target = on ? 1 : 0; }, get inside() { return target === 1; } };
}

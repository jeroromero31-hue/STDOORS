// Muro y piso comunes a todas las puertas. "Blanco es afuera, azul marino es adentro":
// en modo interior el muro deja de recibir luz y emite el azul marino exacto de la página.
import * as THREE from 'three';

const OUT = { wall: new THREE.Color(0xf4f6f7), floor: new THREE.Color(0xe2e7ea) };
const IN = { wall: new THREE.Color(0x052f49), floor: new THREE.Color(0x04283f) };
const BLACK = new THREE.Color(0x000000);

// Fase 10E · "cuarto" real: el muro es de paneles de cámara frigorífica (junta vertical cada 1.15 m, con relieve fino),
// el piso es concreto pulido (refleja un poco la luz) y hay sombra de contacto en la base del muro. Las texturas se
// dibujan aquí (nada que descargar) y se multiplican por el color del material, así el modo interior sigue igual.
const PANEL = 1.15;
let roomTex = null;
function roomTextures() {
  if (roomTex) return roomTex;
  const tex = (w, h, draw, srgb) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  };
  const panel = tex(256, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#cfd6da'; g.fillRect(0, 0, 3, h);            // junta
    g.fillStyle = '#e9edf0'; g.fillRect(3, 0, 2, h);
    g.fillStyle = 'rgba(0,0,0,0.02)'; for (let x = 18; x < w; x += 18) g.fillRect(x, 0, 1, h);   // micro-ondulado
  }, true);
  panel.repeat.set(1 / PANEL, 1);
  const bump = tex(256, 8, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.fillRect(0, 0, 4, h); }, false);
  bump.repeat.set(1 / PANEL, 1);
  const rough = tex(128, 128, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) { const v = 150 + Math.random() * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }, false);
  rough.repeat.set(5, 5);
  const ao = tex(4, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(10,30,45,0.28)'); gr.addColorStop(1, 'rgba(10,30,45,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, false);
  ao.wrapS = ao.wrapT = THREE.ClampToEdgeWrapping;
  roomTex = { panel, bump, rough, ao };
  return roomTex;
}

// wallZ: cara frontal del muro · floorY: nivel del piso · opening: vano { left, right, top } o null para muro continuo
// room: muro de paneles, piso pulido y sombra de contacto (en teléfonos sin relieve)
export function createBackdrop(stage, { wallZ = 0, floorY = 0, centerX = 0, halfWidth = 7, height = 3.4, thickness = 0.12, floorDepth = 9, opening = null, interiorDepth = 1.2, room = true } = {}) {
  const group = new THREE.Group(); group.name = 'MuroYPiso';
  const T = room ? roomTextures() : null, phone = matchMedia('(pointer: coarse)').matches;
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: OUT.wall.clone(), roughness: 0.9, ...(T ? { map: T.panel, bumpMap: phone ? null : T.bump, bumpScale: 0.5 } : {}) }),
    floor: new THREE.MeshStandardMaterial({ color: OUT.floor.clone(), roughness: T ? 0.5 : 0.75, ...(T ? { roughnessMap: T.rough } : {}) }),
    interior: new THREE.MeshBasicMaterial({ color: IN.wall.clone(), side: THREE.BackSide }),
  };
  const slab = (w, h, x, y) => {
    const g = new THREE.BoxGeometry(w, h, thickness), uv = g.attributes.uv;
    if (T) { for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); }   // UV en metros: una junta cada 1.15 m
    const m = new THREE.Mesh(g, materials.wall);
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
  if (T) {
    // sombra de contacto: franja suave sobre el piso, pegada al muro
    const ao = new THREE.Mesh(new THREE.PlaneGeometry(2 * halfWidth, 0.45), new THREE.MeshBasicMaterial({ map: T.ao, transparent: true, depthWrite: false }));
    ao.name = 'SombraDeContacto'; ao.rotation.x = -Math.PI / 2; ao.position.set(centerX, floorY + 0.002, wallZ + 0.225); ao.renderOrder = 4; group.add(ao);
  }

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

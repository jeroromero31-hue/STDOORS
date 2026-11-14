// Árbol de nodos de la vaivén. Las mallas de cada hoja vienen en coordenadas locales de su bisagra:
// el pivote ES el eje de giro del modelo original (x = ∓1.145 m, z = 0) y lo único que se anima es su rotation.y.
import * as THREE from 'three';
const { Group } = THREE;

export const VAIVEN = {
  hingeX: 1.145,        // ejes de giro: hoja izquierda en −x, derecha en +x
  openAngle: 1.10,      // apertura del original con «Abrir ambas» (rad) ≈ 63°
  // Fase 3C-2. Ejes reales de la bisagra de doble acción: en la columna de nudillos, 30 mm hacia el poste desde el eje
  // del original y 78 mm hacia la cara por la que abre. La hoja gira sobre el nudillo del frente al abrir hacia el
  // frente y sobre el de atrás al abrir hacia atrás; así ningún punto de la hoja entra en el poste.
  axis: { toJamb: 0.030, depth: 0.078 },
  // Marco: el original es 59 mm más angosto que las dos hojas con su empaque. Cada poste se separa 31.5 mm y el
  // cabezal sube 6.5 mm (holgura de 2 y 3 mm). El frente del marco se pega al cuerpo (había 5.5 mm de separación).
  frame: { shift: 0.0315, lift: 0.0065, plate: 0.0055 },
};

// eje de la hoja (dir = +1 izquierda, −1 derecha) para el lado de apertura (+1 frente, −1 atrás), en coordenadas de la hoja
export const axisLocal = (dir) => (side) => [-dir * VAIVEN.axis.toJamb, side * VAIVEN.axis.depth];

export function createRig() {
  const named = (name) => { const g = new Group(); g.name = name; return g; };
  const root = named('Vaiven'), fixed = named('Marco'), left = named('HojaIzquierda'), right = named('HojaDerecha');
  left.position.set(-VAIVEN.hingeX, 0, 0); right.position.set(VAIVEN.hingeX, 0, 0);
  root.add(fixed, left, right);
  // dónde se cuelgan las mallas de cada grupo del original
  return { root, slots: { static: fixed, left, right } };
}

// Marco más ancho y más alto (VAIVEN.frame). Se mueven vértices de cajas: los postes se separan, el cabezal se
// alarga y sube, y el frente del marco se pega al cuerpo. La geometría de las hojas no se toca.
export function widenFrame(geo, plate) {
  const { shift, lift } = VAIVEN.frame, src = geo.attributes.position, p = new Float32Array(src.array);
  let head = 0; for (let k = 0; k < src.count; k++) if (Math.abs(p[k * 3]) < 1) head = 1;   // ¿hay cabezal en la malla?
  for (let k = 0; k < src.count; k++) {
    const x = p[k * 3], y = p[k * 3 + 1];
    if (Math.abs(x) > 1.1) p[k * 3] = x + Math.sign(x) * shift;                 // postes y extremos del cabezal
    if (y > 2.4) p[k * 3 + 1] = y + lift;                                         // cabezal y remate de los postes
    if (plate) p[k * 3 + 2] -= VAIVEN.frame.plate;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); return head;
}

// Separa una malla en piezas sueltas (componentes conexas) y las agrupa con key(centro de la pieza)
export function splitPieces(geo, key) {
  const pos = geo.attributes.position, idx = geo.index.array, n = pos.count, par = new Int32Array(n).map((_, k) => k);
  const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let t = 0; t < idx.length; t += 3) { par[find(idx[t])] = find(idx[t + 1]); par[find(idx[t + 1])] = find(idx[t + 2]); }
  const sum = new Map();
  for (let k = 0; k < n; k++) { const r = find(k), q = sum.get(r) || [0, 0, 0, 0]; q[0] += pos.getX(k); q[1] += pos.getY(k); q[2] += pos.getZ(k); q[3]++; sum.set(r, q); }
  const label = new Map([...sum].map(([r, q]) => [r, key({ x: q[0] / q[3], y: q[1] / q[3], z: q[2] / q[3] })]));
  const lists = {};
  for (let t = 0; t < idx.length; t += 3) (lists[label.get(find(idx[t]))] ||= []).push(idx[t], idx[t + 1], idx[t + 2]);
  const out = {};
  for (const [k, list] of Object.entries(lists)) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', pos); g.setAttribute('normal', geo.attributes.normal);
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(list), 1)); out[k] = g;
  }
  return out;
}


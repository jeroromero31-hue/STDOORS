// Árbol de nodos de la vaivén. Las mallas de cada hoja vienen en coordenadas locales de su bisagra:
// el pivote ES el eje de giro del modelo original (x = ∓1.145 m, z = 0) y lo único que se anima es su rotation.y.
import { Group } from 'three';

export const VAIVEN = {
  hingeX: 1.145,        // ejes de giro: hoja izquierda en −x, derecha en +x
  openAngle: 1.10,      // apertura del original con «Abrir ambas» (rad) ≈ 63°
};

export function createRig() {
  const named = (name) => { const g = new Group(); g.name = name; return g; };
  const root = named('Vaiven'), fixed = named('Marco'), left = named('HojaIzquierda'), right = named('HojaDerecha');
  left.position.set(-VAIVEN.hingeX, 0, 0); right.position.set(VAIVEN.hingeX, 0, 0);
  root.add(fixed, left, right);
  // dónde se cuelgan las mallas de cada grupo del original
  return { root, slots: { static: fixed, left, right } };
}

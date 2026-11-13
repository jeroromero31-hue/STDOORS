// Árbol de nodos de la corrediza. Cada grupo del modelo original cuelga del nodo que reproduce su matriz:
//   static → fijo · door → hoja · seal → empaque (se comprime) · wheel-* → poleas (ruedan) · cover → tapa (gira en su bisagra)
import { Group } from 'three';
import { MECH } from './corrediza.kinematics.js';

export function createRig() {
  const named = (name) => { const g = new Group(); g.name = name; return g; };
  const root = named('Corrediza');
  const fixed = named('Fijo'); root.add(fixed);
  const moving = named('Hoja'); root.add(moving);
  const door = named('HojaMallas'); moving.add(door);
  const seal = named('Empaque'); moving.add(seal);
  // pivote en el eje real + contenedor que devuelve las mallas a sus coordenadas de modelo
  const pivoted = (name, parent, x, y, z) => {
    const pivot = named(name); pivot.position.set(x, y, z); parent.add(pivot);
    const holder = named(`${name}Mallas`); holder.position.set(-x, -y, -z); pivot.add(holder);
    return { pivot, holder };
  };
  const wl = pivoted('PoleaIzquierda', moving, -MECH.wheelX, MECH.wheelY, MECH.wheelZ);
  const wr = pivoted('PoleaDerecha', moving, MECH.wheelX, MECH.wheelY, MECH.wheelZ);
  const cv = pivoted('TapaRiel', root, 0, MECH.coverPivotY, MECH.coverPivotZ);
  return {
    root,
    nodes: { moving, seal, wheelLeft: wl.pivot, wheelRight: wr.pivot, cover: cv.pivot },
    // dónde se cuelgan las mallas de cada grupo del original
    slots: { static: fixed, door, seal, 'wheel-left': wl.holder, 'wheel-right': wr.holder, cover: cv.holder },
  };
}

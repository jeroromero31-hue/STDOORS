// Cinemática de la puerta corrediza. Es la misma del motor original aprobado
// (01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html: motion, modelMat, wheelTransform),
// pasada a nodos de escena. scripts/verify-corrediza.mjs ejecuta las funciones originales y compara las matrices.
//
// Sin dependencias: lo usan el visor y el script de verificación.

export const MECH = {
  camThreshold: 0.165,   // fracción del recorrido donde las poleas están en lo alto de las rampas
  dropDepth: 0.026,      // descenso de la hoja al asentar (m). Ilustrativo: el original lo marca como "cotas por validar"
  approachDepth: 0.007,  // acercamiento al marco al asentar (m). Ilustrativo
  rampTravel: 0.12,      // avance horizontal mientras sube o baja por las rampas (m)
  slideTravel: 1.80,     // deslizamiento libre sobre el riel (m)
  sealCompression: 0.24, // compresión visual del empaque con la hoja asentada
  sealAnchorZ: 0.240,    // plano contra el que se comprime el empaque
  wheelRadius: 0.058,    // las poleas ruedan sin patinar
  wheelX: 0.984, wheelY: 2.56, wheelZ: 0.189,     // ejes de las poleas (izquierda en −x, derecha en +x)
  coverPivotY: 2.755, coverPivotZ: 0.104,          // eje de la bisagra de la tapa del riel
  coverAngle: 1.03,      // giro de la tapa abierta (rad)
  coverLift: 0.105,      // la tapa baja este tramo al abrir (m)
};
export const TRAVEL = MECH.rampTravel + MECH.slideTravel;   // 1.92 m

const clamp = (a, lo, hi) => Math.min(hi, Math.max(lo, a));
export const smooth = (t) => t * t * (3 - 2 * t);

// p = 0: cerrada y asentada · p = camThreshold: arriba de las rampas · p = 1: abierta
export function motion(p) {
  const { camThreshold: th, dropDepth, approachDepth, rampTravel, slideTravel, sealCompression } = MECH;
  const s = smooth(clamp(p / th, 0, 1));
  const x = p < th ? rampTravel * s : rampTravel + ((p - th) / (1 - th)) * slideTravel;
  const seat = 1 - s;
  return { x, drop: -dropDepth * seat, approach: -approachDepth * seat, compression: seat * sealCompression, seat };
}

// Inversa de motion(p).x: de metros recorridos a progreso (para arrastrar la hoja con el puntero)
export function progressForSlide(x) {
  const { camThreshold: th, rampTravel, slideTravel } = MECH;
  const v = clamp(x, 0, TRAVEL);
  if (v >= rampTravel) return th + ((v - rampTravel) / slideTravel) * (1 - th);
  const s = v / rampTravel;                                   // s = 3t² − 2t³  →  t = ½ − sin(asin(1 − 2s) / 3)
  return th * (0.5 - Math.sin(Math.asin(1 - 2 * s) / 3));
}

// Aplica la pose a los nodos de escena.
//   moving     : hoja completa (hija de la raíz)
//   seal       : empaque de la hoja (hijo de moving)
//   wheelLeft / wheelRight : pivotes de las poleas, situados en su eje (hijos de moving)
//   cover      : pivote de la tapa, situado en el eje de su bisagra (hijo de la raíz)
export function applyPose(nodes, p, cover) {
  const m = motion(p);
  nodes.moving.position.set(m.x, m.drop, m.approach);
  nodes.seal.position.set(0, 0, MECH.sealAnchorZ * m.compression);
  nodes.seal.scale.set(1, 1, 1 - m.compression);
  const roll = -m.x / MECH.wheelRadius;
  nodes.wheelLeft.rotation.z = roll; nodes.wheelRight.rotation.z = roll;
  nodes.cover.position.set(0, MECH.coverPivotY - MECH.coverLift * cover, MECH.coverPivotZ);
  nodes.cover.rotation.x = -cover * MECH.coverAngle;
  return m;
}

// Cámara del original [yaw, pitch, dist, focusX, focusY] (fov vertical 45°) → posición y objetivo
export function originalCamera([yaw, pitch, dist, fx, fy]) {
  return {
    pos: [fx - Math.sin(yaw) * Math.cos(pitch) * dist, fy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist],
    tgt: [fx, fy, 0], fov: 45,
  };
}

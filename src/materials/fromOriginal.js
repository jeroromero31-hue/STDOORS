// Del sombreado de los modelos originales (corrediza y vaivén) a materiales físicos de Three.js.
//
// Los originales comparten un motor propio que no sombrea con PBR estándar: su reflejo vale
// f0 = mix(0.055, 0.91, metal) con un tinte frío y su difuso alb·(1 − 0.82·metal); además tratan aparte hules,
// fundición y vidrio. Con los mismos tres números (color, metal, rugosidad), un material estándar daría plásticos
// casi negros y aluminios apagados. Aquí se despejan los parámetros físicos que reproducen esa respuesta.
// CAL ajusta la exposición del estudio común a la del original; se calibró midiendo, material por material,
// ambos renders desde las mismas cámaras (ver docs/DIFERENCIAS_CON_ORIGINALES.md).
import * as THREE from 'three';

export const CAL = { kd: 0.76, ksMetal: 0.92, ksDielectric: 1.15, roughMetal: 0.85, roughDielectric: 1.0 };

// Clases propias de la vaivén, calibradas igual que CAL (misma medición, mismas cámaras)
const FUNDICION = { kd: 1.25, f0: 0.086 };                     // f0: 0.075 del original × ksDielectric
const VIDRIO = { color: [0.35, 0.42, 0.43], rough: 0.5, f0: 0.05 };   // esmerilado: casi todo difuso, como lo pinta el original

const iorFor = (f0) => { const q = Math.sqrt(Math.min(0.16, f0)); return (1 + q) / (1 - q); };   // 0.16 es el tope con ior ≤ 2.33
const WHITE = [1, 1, 1];

// d = { color: '#rrggbb', metal, rough, superficie, gain? }  →  parámetros completos de MeshPhysicalMaterial
// gain (opcional, 1 por omisión) aclara u oscurece el material entero, difuso y reflejo por igual. Lo usa cada visor
// para igualar al original las piezas que el estudio común ilumina distinto (por ejemplo, un marco plano de frente).
export function physicalParams(d) {
  const c = new THREE.Color(d.color), alb = [c.r, c.g, c.b], M = d.metal, g = d.gain ?? 1;
  const out = (color, metalness, roughness, { ior = 1.5, specularIntensity = 1, specularColor = WHITE, envMapIntensity = 1 } = {}) => ({
    color: new THREE.Color().setRGB(color[0], color[1], color[2]), metalness, roughness, ior, specularIntensity,
    specularColor: new THREE.Color().setRGB(specularColor[0], specularColor[1], specularColor[2]), envMapIntensity,
  });
  if (d.superficie === 'pintura') return out(alb, M, d.rough);                                      // hoja pintada: tal cual
  // hules y negros mates: el original los pinta sin reflejo, sea cual sea su valor de metal
  if (d.superficie === 'elastomero') return out(alb.map((a) => a * g), 0, Math.max(d.rough, 0.85), { envMapIntensity: 0.8 * g });
  // fundición satinada (bisagras y tornillería de la vaivén): difuso mate con un reflejo leve, sin depender de "metal"
  if (d.superficie === 'fundicion') return out(alb.map((a) => a * CAL.kd * FUNDICION.kd * g), 0, Math.max(d.rough, 0.45), { ior: iorFor(FUNDICION.f0 * g) });
  // vidrio esmerilado de la mirilla: el original lo pinta de un gris azulado fijo, sea cual sea su color de tabla
  if (d.superficie === 'vidrio') return out(VIDRIO.color.map((a) => a * g), 0, VIDRIO.rough, { ior: iorFor(VIDRIO.f0 * g) });
  const f0 = 0.055 + (0.91 - 0.055) * M;
  const tint = [0.86, 0.91, 0.95].map((t, i) => t + (Math.max(alb[i], 0.2) - t) * 0.38 * M);
  const A = alb.map((a) => a * (1 - 0.82 * M) * CAL.kd * g);                                       // difuso
  if (M <= 0.2) {                                                                                   // plásticos
    const S = tint.map((t) => t * f0 * CAL.ksDielectric * g), F = (S[0] + S[1] + S[2]) / 3, Fc = Math.min(0.16, F), mx = Math.max(...S);
    return out(A, 0, Math.max(0.08, d.rough * CAL.roughDielectric), { ior: iorFor(F), specularIntensity: F / Fc, specularColor: S.map((s) => s / mx) });
  }
  const S = tint.map((t) => t * f0 * CAL.ksMetal * g);                                              // metales
  let lo = 0, hi = 0.98;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (0.04 * (1 - m) + (A[1] * m) / (1 - m) < S[1]) lo = m; else hi = m; }
  const m = (lo + hi) / 2;
  return out(A.map((a) => Math.min(1, a / (1 - m))), m, Math.max(0.08, d.rough * CAL.roughMetal));
}

// Material nuevo a partir de una definición del original. Una cara o dos lo decide cada visor (extra.side).
export const materialFromOriginal = (name, d, extra = {}) => new THREE.MeshPhysicalMaterial({ name, ...physicalParams(d), ...extra });

// Cambia en sitio un material ya creado (la vaivén retoca marco y vidrio según el acabado de la hoja)
export function updateFromOriginal(material, d) {
  const p = physicalParams(d);
  material.color.copy(p.color); material.specularColor.copy(p.specularColor);
  material.metalness = p.metalness; material.roughness = p.roughness; material.ior = p.ior;
  material.specularIntensity = p.specularIntensity; material.envMapIntensity = p.envMapIntensity;
}

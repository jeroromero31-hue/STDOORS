// Registro único de materiales PBR. Abatible y Vaivén usan las MISMAS instancias para que un acabado
// se vea idéntico en ambas puertas bajo la misma luz. No se crean materiales de acabado fuera de aquí.
import * as THREE from 'three';
import { brushedRoughness, satinRoughness, orangePeelNormal, diamondPlate } from './textures.js';

// Acabados que el usuario puede elegir, por familia (fuente: MATRIZ_PRODUCTOS_ACABADOS.csv)
export const FINISHES_BY_DOOR = {
  corrediza: [],                                   // único acabado: el del modelo aprobado, sin selector
  abatible: ['blackMetal', 'stainless', 'hygienicWhite'],
  vaiven: ['blackMetal', 'stainless', 'hygienicWhite'],
  cds: [],                                         // marco negro según foto; Advanced/Plus/LT no son colores
};
export const FINISH_LABEL = { blackMetal: 'Negro', stainless: 'Inoxidable', hygienicWhite: 'Blanco sanitario' };
export const BUMPER_BY_DOOR = { abatible: 'stainlessDiamond' }; // solo inox diamante

let registry = null;

export function createFinishRegistry(renderer) {
  if (registry) return registry;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tex = {
    brushed: brushedRoughness(0.24, 0.09),
    satinBlack: satinRoughness(0.36, 0.05, 3),
    satinAlu: satinRoughness(0.34, 0.06, 5),
    peel: orangePeelNormal(),
    diamond: diamondPlate(),
  };
  // placa diamante: ~60 mm por motivo sobre una hoja de referencia de 0.34 × 0.62 m; cada visor ajusta el repeat a su tamaño real
  tex.diamond.normal.repeat.set(6, 10); tex.diamond.roughness.repeat.set(6, 10);
  Object.values(tex).flatMap((t) => (t.isTexture ? [t] : Object.values(t))).forEach((t) => { t.anisotropy = maxAniso; });

  const m = {
    // Negro metálico: aluminio/lámina metalizada negra satinada. Neutro (sin tinte azul), no espejo.
    blackMetal: new THREE.MeshPhysicalMaterial({
      name: 'blackMetal', color: new THREE.Color('#18191b'), metalness: 0.62, roughness: 0.36, roughnessMap: tex.satinBlack,
      clearcoat: 0.22, clearcoatRoughness: 0.32, envMapIntensity: 1.0,
    }),
    // Acero inoxidable cepillado: metal pleno, vetas anisotrópicas que cambian al mover la cámara.
    stainless: new THREE.MeshPhysicalMaterial({
      name: 'stainless', color: new THREE.Color('#c9cdd0'), metalness: 1, roughness: 0.24, roughnessMap: tex.brushed,
      anisotropy: 0.65, anisotropyRotation: 0, envMapIntensity: 1.15,
    }),
    // Blanco sanitario: lámina pintada/laminada, reflejo suave, piel de naranja apenas perceptible.
    hygienicWhite: new THREE.MeshPhysicalMaterial({
      name: 'hygienicWhite', color: new THREE.Color('#eceeea'), metalness: 0, roughness: 0.46,
      clearcoat: 0.5, clearcoatRoughness: 0.2, normalMap: tex.peel, normalScale: new THREE.Vector2(0.18, 0.18),
      clearcoatNormalMap: tex.peel, clearcoatNormalScale: new THREE.Vector2(0.12, 0.12), envMapIntensity: 1.0,
    }),
    // Bumper: inoxidable con relieve diamante (único bumper de la abatible)
    stainlessDiamond: new THREE.MeshPhysicalMaterial({
      name: 'stainlessDiamond', color: new THREE.Color('#d2d6d9'), metalness: 1, roughness: 0.22,
      roughnessMap: tex.diamond.roughness, normalMap: tex.diamond.normal, normalScale: new THREE.Vector2(1, 1), envMapIntensity: 1.2,
    }),
    // Perfil perimetral de aluminio anodizado natural
    aluminum: new THREE.MeshPhysicalMaterial({ name: 'aluminum', color: new THREE.Color('#c4c9cd'), metalness: 1, roughness: 0.34, roughnessMap: tex.satinAlu, envMapIntensity: 1.0 }),
    // Aluminio negro CDS (marco y hojas Reach-In)
    blackAluminum: new THREE.MeshPhysicalMaterial({ name: 'blackAluminum', color: new THREE.Color('#141517'), metalness: 0.55, roughness: 0.42, roughnessMap: tex.satinBlack, clearcoat: 0.15, clearcoatRoughness: 0.45, envMapIntensity: 0.9 }),
    // Vidrio: transparente con reflejo moderado. Sin transmisión real para mantener el rendimiento en móvil.
    glass: new THREE.MeshPhysicalMaterial({ name: 'glass', color: new THREE.Color('#ffffff'), metalness: 0, roughness: 0.03, ior: 1.52, transparent: true, opacity: 0.1, envMapIntensity: 1.5, depthWrite: false, side: THREE.DoubleSide }),
    rubber: new THREE.MeshStandardMaterial({ name: 'rubber', color: new THREE.Color('#0d0e0f'), roughness: 0.88, metalness: 0 }),
    plasticGray: new THREE.MeshPhysicalMaterial({ name: 'plasticGray', color: new THREE.Color('#8a9095'), roughness: 0.55, metalness: 0, clearcoat: 0.1 }),
    plasticBlack: new THREE.MeshPhysicalMaterial({ name: 'plasticBlack', color: new THREE.Color('#141618'), roughness: 0.5, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
    steelHardware: new THREE.MeshStandardMaterial({ name: 'steelHardware', color: new THREE.Color('#d4d8db'), metalness: 1, roughness: 0.22 }),
  };

  registry = {
    materials: m,
    textures: tex,
    get(name) { const x = m[name]; if (!x) throw new Error(`Material desconocido: ${name}`); return x; },
    finishFor(door) { return FINISHES_BY_DOOR[door] || []; },
    // Ajuste de calidad: en "baja" se quitan clearcoat y anisotropía (mismo color base, menos costo)
    setQuality(q) {
      const low = q === 'baja';
      m.stainless.anisotropy = low ? 0 : 0.65;
      for (const k of ['blackMetal', 'hygienicWhite', 'blackAluminum']) m[k].clearcoat = low ? 0 : { blackMetal: 0.22, hygienicWhite: 0.5, blackAluminum: 0.15 }[k];
      Object.values(m).forEach((x) => { x.needsUpdate = true; });
    },
    dispose() { Object.values(m).forEach((x) => x.dispose()); registry = null; },
  };
  return registry;
}

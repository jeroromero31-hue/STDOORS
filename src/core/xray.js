// Fase 10F · «Rayos X»: la puerta se vuelve transparente y se ven las piezas de adentro (ejes, rodajas, refuerzos).
// Un solo material para toda la escena: las caras que se ven de canto brillan más (como en una radiografía) y las que
// se ven de frente casi desaparecen. Se suma la luz de cada capa, así lo que está detrás se sigue viendo.
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vW; varying vec3 vN;
  void main() {
    vec3 p = position; vec3 n = normal;
    #ifdef USE_INSTANCING
      p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
    #endif
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fragmentShader = /* glsl */ `
  uniform float uK; varying vec3 vW; varying vec3 vN;
  void main() {
    vec3 v = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(normalize(vN), v));
    f = pow(f, 2.2);
    vec3 c = mix(vec3(0.03, 0.18, 0.32), vec3(0.62, 0.95, 1.0), f);
    gl_FragColor = vec4(c * (0.10 + 0.9 * f) * uK, 1.0);
  }`;

export function createXray(stage) {
  const mat = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms: { uK: { value: 1 } },
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
  mat.name = 'RayosX';
  const bg = new THREE.Color(0x041726);
  let on = false, saved = null;
  return {
    get on() { return on; },
    set(v) {
      v = !!v; if (v === on) return; on = v;
      const s = stage.scene;
      // el muro, el piso y el cuarto se ocultan: de canto brillarían más que la puerta
      if (on) {
        const hidden = []; s.traverse((o) => { if (o.name === 'MuroYPiso' && o.visible) { o.visible = false; hidden.push(o); } });
        saved = { bg: s.background, fog: s.fog, hidden }; s.overrideMaterial = mat; s.background = bg; s.fog = null;
      } else if (saved) { s.overrideMaterial = null; s.background = saved.bg; s.fog = saved.fog; saved.hidden.forEach((o) => { o.visible = true; }); saved = null; }
      stage.invalidate(6);
    },
  };
}

// Vaho de la cámara frigorífica: al abrir la puerta, el aire frío del interior se ve como niebla que se mueve
// dentro del vano y sale a ras de piso. Partículas suaves (una por vértice), sin texturas que descargar.
import * as THREE from 'three';

const VERT = /* glsl */`
  attribute float aLife; attribute float aSize; attribute float aSeed;
  uniform float uPx; uniform float uFade; uniform float uMax;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(aSize * uPx / max(0.2, -mv.z), uMax);   // tope: las partículas muy cerca no llenan la pantalla
    // entra y sale suave a lo largo de su vida; se apaga muy cerca de la cámara (al cruzarla no tapa la vista)
    float life = sin(3.14159 * clamp(aLife, 0.0, 1.0));
    float near = smoothstep(0.25, 1.1, -mv.z);
    vA = life * near * uFade * (0.55 + 0.45 * aSeed);
  }`;
const FRAG = /* glsl */`
  uniform vec3 uColor; uniform float uOpacity;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = dot(c, c) * 4.0;
    float a = exp(-d * 3.2) * vA * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }`;

// box: volumen del que sale (dentro del vano); out: hasta dónde llega a ras de piso
export function createVapor(stage, { count = 140, x = 1.15, y0 = 0.02, y1 = 2.3, z0 = -1.6, z1 = -0.05 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3), life = new Float32Array(count), size = new Float32Array(count), seed = new Float32Array(count), span = new Float32Array(count);
  const R = Math.random;
  const spawn = (i, initial) => {
    const low = R() < 0.55;                                     // la mitad nace a ras de piso: es la que sale por el vano
    pos[i * 3] = (R() * 2 - 1) * x;
    pos[i * 3 + 1] = low ? y0 + R() * 0.35 : y0 + R() * (y1 - y0);
    pos[i * 3 + 2] = z0 + R() * (z1 - z0);
    vel[i * 3] = (R() * 2 - 1) * 0.05;
    vel[i * 3 + 1] = low ? -0.01 + R() * 0.02 : (R() * 2 - 1) * 0.03;
    vel[i * 3 + 2] = low ? 0.16 + R() * 0.3 : 0.02 + R() * 0.06;   // el aire frío baja y sale hacia afuera
    size[i] = low ? 0.45 + R() * 0.5 : 0.3 + R() * 0.4;
    seed[i] = R(); span[i] = 3.5 + R() * 4;
    life[i] = initial ? R() : 0;
  };
  for (let i = 0; i < count; i++) spawn(i, true);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aLife', new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 2), 12);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(0xeef8fc) }, uOpacity: { value: 0.2 }, uPx: { value: 300 }, uFade: { value: 0 }, uMax: { value: 256 } },
  });
  const points = new THREE.Points(geo, mat); points.name = 'Vaho'; points.renderOrder = 2000; points.frustumCulled = false;
  stage.scene.add(points);

  let amount = 0, target = 0;          // cuánto vaho hay (sigue a la apertura de la puerta)
  const step = (dt) => {
    amount += (target - amount) * (1 - Math.exp(-dt * 2.2));
    mat.uniforms.uFade.value = amount;
    // tamaño de punto: proporcional al alto de la imagen en píxeles de dispositivo
    const h = stage.renderer.domElement.height;
    mat.uniforms.uPx.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2)));
    mat.uniforms.uMax.value = Math.max(32, h * 0.28);
    if (amount < 0.002) { points.visible = false; return; }
    points.visible = true;
    for (let i = 0; i < count; i++) {
      life[i] += dt / span[i];
      if (life[i] >= 1) { spawn(i, false); continue; }
      const k = i * 3;
      pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt; pos[k + 2] += vel[k + 2] * dt * (0.4 + amount);
      if (pos[k + 1] < y0) pos[k + 1] = y0;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.aLife.needsUpdate = true;
    stage.invalidate(2);                // las partículas se mueven aunque la escena no cambie de firma
  };
  stage.onFrame.add(step);
  return {
    points,
    set(v) { target = v; },
    dispose() { stage.onFrame.delete(step); stage.scene.remove(points); geo.dispose(); mat.dispose(); },
  };
}

// Fase 10E · «Ver el frío»: la escena como la vería una cámara térmica.
//
// Toda la escena se dibuja con un solo material que no usa luces: el color sale de una «temperatura» de 0 (frío)
// a 1 (ambiente) calculada en cada punto del mundo. Detrás del muro está la cámara fría; al abrir una puerta,
// el aire frío sale por el hueco, baja al piso y se extiende hacia afuera, con un ruido que corre como corriente.
// Al cerrar, el frío no desaparece de golpe: se disipa en un par de segundos. El vidrio se ve opaco, como en una
// cámara térmica real (el infrarrojo no atraviesa el vidrio).
//
// Es una ilustración: no hay grados en pantalla ni datos inventados, solo «Frío» y «Ambiente» en la escala.
//
// Cada visor describe sus huecos con `thermal`: { wallZ, floorY, openings() → [{ x0, x1, top, amount }] } en metros
// del mundo y `amount` de 0 (cerrada) a 1 (abierta). Hasta 4 huecos (la CDS tiene 3 puertas).
import * as THREE from 'three';

const MAX = 4;

// Escala de color: azul marino (frío) → azul → violeta → magenta → naranja → amarillo (ambiente). En sRGB directo.
export const THERMAL_STOPS = ['#0a1440', '#1736a8', '#1e8fe0', '#5a3fb0', '#b3307a', '#e8552a', '#f9a21b', '#ffe680'];

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

const glslStops = THERMAL_STOPS.map((h) => {
  const c = parseInt(h.slice(1), 16);
  return `vec3(${((c >> 16) & 255) / 255}, ${((c >> 8) & 255) / 255}, ${(c & 255) / 255})`;
});

const fragmentShader = /* glsl */ `
  uniform float uTime; uniform float uWallZ; uniform float uFloorY; uniform int uN; uniform vec4 uOpen[${MAX}]; uniform float uTop[${MAX}]; uniform float uSemi;
  varying vec3 vW; varying vec3 vN;
  uniform sampler2D uNoise;
  // Fase 12 · ruido 3D con una sola lectura de textura (antes: 8 cálculos de hash por llamada). Cada rebanada en z es la
  // misma textura corrida (37, 17); el canal verde trae la rebanada siguiente, así que basta mezclar los dos canales.
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (i.xy + vec2(37.0, 17.0) * i.z) + f.xy;
    vec2 rg = texture2D(uNoise, (uv + 0.5) / 256.0).rg;
    return mix(rg.x, rg.y, f.z);
  }
  float fbm(vec3 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.03 + 7.1) + 0.15 * noise(p * 4.1 + 3.7); }
  vec3 palette(float t) {
    const vec3 c0 = ${glslStops[0]}; const vec3 c1 = ${glslStops[1]}; const vec3 c2 = ${glslStops[2]}; const vec3 c3 = ${glslStops[3]};
    const vec3 c4 = ${glslStops[4]}; const vec3 c5 = ${glslStops[5]}; const vec3 c6 = ${glslStops[6]}; const vec3 c7 = ${glslStops[7]};
    float s = clamp(t, 0.0, 1.0) * 7.0;
    vec3 c = mix(c0, c1, clamp(s, 0.0, 1.0));
    c = mix(c, c2, clamp(s - 1.0, 0.0, 1.0)); c = mix(c, c3, clamp(s - 2.0, 0.0, 1.0)); c = mix(c, c4, clamp(s - 3.0, 0.0, 1.0));
    c = mix(c, c5, clamp(s - 4.0, 0.0, 1.0)); c = mix(c, c6, clamp(s - 5.0, 0.0, 1.0)); c = mix(c, c7, clamp(s - 6.0, 0.0, 1.0));
    return c;
  }
  void main() {
    vec3 p = vW, n = normalize(vN);
    float dz = p.z - uWallZ, y = p.y - uFloorY;
    // ambiente: más tibio arriba (el aire caliente sube) y el piso más fresco; con algo de variación en las superficies.
    // Fase 12: más rango (antes todo quedaba naranja con la puerta cerrada)
    float up = smoothstep(0.0, 2.8, y);
    float t = 0.6 + 0.21 * up + 0.07 * (fbm(p * 1.7) - 0.5);
    t -= 0.07 * smoothstep(0.55, 0.95, n.y) * (1.0 - up);
    // detrás del muro: la cámara fría
    t = mix(t, 0.07 + 0.05 * fbm(p * 3.0 + uTime * 0.05), smoothstep(-0.02, -0.22, dz));
    float cold = 0.0;
    // corriente: ruido que avanza hacia afuera y baja (uno para todos los huecos)
    float flow = fbm(vec3(p.x * 2.4, y * 2.2 + uTime * 0.35, max(dz, 0.0) * 1.8 - uTime * 0.9));
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= uN) break;
      vec4 o = uOpen[i]; float a = o.z; if (a < 0.002) continue;
      float cx = 0.5 * (o.x + o.y), hw = 0.5 * (o.y - o.x), d = max(dz, 0.0);
      // a lo ancho: el hueco, abriéndose al alejarse de él
      float spread = hw + d * 0.42;
      float lx = 1.0 - smoothstep(spread * 0.55, spread * 1.05 + 0.18, abs(p.x - cx));
      // a lo alto: junto al hueco ocupa casi toda su altura; lejos queda una capa fría pegada al piso
      float layer = mix(uTop[i] * (0.45 + 0.5 * a), 0.18 + 0.22 * a, smoothstep(0.0, 1.8, d));
      float ly = 1.0 - smoothstep(layer * 0.55, layer * 1.1, y);
      // hacia afuera: llega más lejos con la puerta más abierta
      float lz = exp(-d / (0.55 + 2.4 * a)) * smoothstep(-0.25, 0.05, dz);
      cold = max(cold, a * lx * ly * lz * (0.55 + 0.9 * flow));
    }
    // la hoja cerrada: del otro lado está la cámara fría, así que se ve algo más fresca que el muro (y más abajo que arriba)
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= uN) break;
      vec4 o = uOpen[i]; float shut = 1.0 - clamp(o.z * 4.0, 0.0, 1.0); if (shut < 0.01) continue;
      float inX = smoothstep(o.x - 0.01, o.x + 0.01, p.x) * (1.0 - smoothstep(o.y - 0.01, o.y + 0.01, p.x));
      float inY = 1.0 - smoothstep(uTop[i] - 0.01, uTop[i] + 0.02, y);
      float inZ = smoothstep(-0.06, -0.02, dz) * (1.0 - smoothstep(0.24, 0.3, dz));
      t -= (1.0 - uSemi) * shut * inX * inY * inZ * (0.09 + 0.05 * (1.0 - y / max(uTop[i], 0.5)));   // la vaivén tiene lo suyo abajo
    }
    t = mix(t, 0.1, clamp(cold * 1.35, 0.0, 1.0));
    // puerta semi aislante (vaivén): la hoja cerrada deja pasar algo de frío (se ve más fresca que el muro) y por la junta
    // de en medio y por abajo se cuela un hilo de aire frío que baja al piso
    if (uSemi > 0.0) {
      float leak = 0.0, panel = 0.0;
      for (int i = 0; i < ${MAX}; i++) {
        if (i >= uN) break;
        vec4 o = uOpen[i]; float shut = 1.0 - clamp(o.z * 3.0, 0.0, 1.0);
        float inX = step(o.x, p.x) * step(p.x, o.y), inY = step(y, uTop[i]);
        panel = max(panel, shut * inX * inY * exp(-abs(dz) / 0.07));
        float seam = exp(-min(abs(p.x - o.x), abs(p.x - o.y)) / 0.02) * inY;           // juntas de los lados y de en medio
        float under = (1.0 - smoothstep(0.0, 0.16 + 0.08 * flow, y)) * inX * exp(-max(dz, 0.0) / 0.45) * smoothstep(-0.05, 0.02, dz);
        leak = max(leak, shut * (seam * exp(-abs(dz) / 0.05) * 0.8 + under * (0.55 + 0.6 * flow)));
      }
      t = mix(t, 0.42, uSemi * panel * 0.6);
      t = mix(t, 0.16, uSemi * clamp(leak, 0.0, 1.0));
    }
    // relieve: sin luces, las caras se separan un poco según hacia dónde miran
    float shade = 0.78 + 0.22 * dot(n, normalize(vec3(0.35, 0.75, 0.55)));
    float rim = 1.0 - abs(dot(n, normalize(cameraPosition - vW)));          // contornos: las caras de canto se oscurecen
    shade *= 1.0 - 0.38 * rim * rim;
    gl_FragColor = vec4(palette(t) * shade, 1.0);
  }`;

// textura de ruido (256 × 256): rojo al azar y verde = el rojo corrido (37, 17), para el ruido 3D de arriba
let noiseTex = null;
function noiseTexture() {
  if (noiseTex) return noiseTex;
  const N = 256, r = new Uint8Array(N * N), d = new Uint8Array(N * N * 4);
  let seed = 1234567;
  for (let i = 0; i < r.length; i++) { seed = (seed * 1103515245 + 12345) >>> 0; r[i] = (seed >>> 16) & 255; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = (y * N + x) * 4; d[k] = r[y * N + x]; d[k + 1] = r[((y + 17) & 255) * N + ((x + 37) & 255)]; d[k + 3] = 255;
  }
  noiseTex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.magFilter = noiseTex.minFilter = THREE.LinearFilter;
  noiseTex.generateMipmaps = false; noiseTex.colorSpace = THREE.NoColorSpace; noiseTex.needsUpdate = true;
  return noiseTex;
}

export function createThermal(stage, spec) {
  const uOpen = Array.from({ length: MAX }, () => new THREE.Vector4());
  const uTop = new Array(MAX).fill(2);
  const mat = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, toneMapped: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uWallZ: { value: spec.wallZ || 0 }, uFloorY: { value: spec.floorY || 0 }, uN: { value: 0 }, uOpen: { value: uOpen }, uTop: { value: uTop }, uSemi: { value: spec.semi ? 1 : 0 }, uNoise: { value: noiseTexture() } },
  });
  mat.name = 'VistaTermica';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let on = false, saved = null, t0 = performance.now(), last = performance.now(), lastDraw = 0;
  const shown = new Array(MAX).fill(0);                      // apertura «vista»: el frío sale rápido y se disipa lento
  const bg = new THREE.Color(THERMAL_STOPS[0]);

  stage.onFrame.add(() => {
    if (!on) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
    const list = (spec.openings() || []).slice(0, MAX);
    mat.uniforms.uN.value = list.length;
    list.forEach((o, i) => {
      const goal = Math.max(0, Math.min(1, o.amount));
      const k = reduced.matches ? 1 : 1 - Math.exp(-dt * (goal > shown[i] ? 2.6 : 0.9));
      shown[i] += (goal - shown[i]) * k;
      uOpen[i].set(o.x0, o.x1, shown[i], 0); uTop[i] = o.top;
    });
    mat.uniforms.uTime.value = reduced.matches ? 0 : (now - t0) / 1000;
    // la corriente se mueve: se dibuja cada cuadro mientras está activa. En teléfonos y equipos modestos, a 30 cuadros
    // por segundo: la corriente se ve igual y el teléfono se calienta menos (Fase 12: antes solo en calidad baja)
    if ((coarse || stage.quality !== 'alta') && now - lastDraw < 31) return;
    lastDraw = now; stage.invalidate(2);
  });
  const coarse = matchMedia('(pointer: coarse)').matches;

  return {
    material: mat,
    get on() { return on; },
    set(v) {
      v = !!v; if (v === on) return; on = v;
      const s = stage.scene;
      if (on) {
        saved = { bg: s.background, fog: s.fog };
        list0();
        s.overrideMaterial = mat; s.background = bg; s.fog = null; last = performance.now();
      } else if (saved) {
        s.overrideMaterial = null; s.background = saved.bg; s.fog = saved.fog; saved = null;
      }
      // Fase 12 · la imagen de una cámara térmica es suave: se dibuja con menos píxeles (hasta 1.25× en el teléfono) y
      // sin mapa de sombras (este material no usa luces). Al salir se regresa todo.
      stage.cap = on ? (coarse ? 1.25 : 1.5) : 0; stage.shadowsPaused = on;
      if (!on && stage.shadowsDirty) stage.shadowsDirty();
      if (stage.applyRatio) stage.applyRatio();
      stage.invalidate(6);
    },
  };
  // al encender, lo que ya está abierto aparece sin esperar la subida
  function list0() { (spec.openings() || []).slice(0, MAX).forEach((o, i) => { shown[i] = Math.max(0, Math.min(1, o.amount)) * 0.6; }); }
}

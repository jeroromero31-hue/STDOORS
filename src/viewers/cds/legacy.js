// CDS Legacy · núcleo del conjunto Reach-In de 3 puertas.
// Procede de 01_MODELOS_ORIGINALES/CDS_LEGACY_MODELO_ACTUAL.html (código propio de ST, generado por Claude en la Fase 0).
// Se conserva el código del original, solo desminificado: la geometría, la mecánica (autocierre y retención a 90°)
// y los productos son los aprobados. Los nombres cortos vienen del original; la tabla de abajo dice qué es cada uno.
// Cambios frente al original: docs/DIFERENCIAS_CON_ORIGINALES.md (sección CDS).
import {
  Mesh as At, Group as me, BoxGeometry as Ot, CylinderGeometry as Me, PlaneGeometry as an, TubeGeometry as gr, LatheGeometry as mr,
  BufferGeometry as Ke, BufferAttribute as Ie, InstancedMesh as dr, MeshStandardMaterial as Wt, MeshPhysicalMaterial as Je,
  MeshBasicMaterial as Fn, CanvasTexture as ni, Color as Lt, Vector2 as it, Vector3 as R, Matrix4 as Zt, Quaternion as Le, Euler as $e,
  Plane as Ye, Raycaster as Mr, PointLight as ki, CatmullRomCurve3 as us, MathUtils as Ue,
  SRGBColorSpace as Be, DoubleSide as Te, RepeatWrapping as Li, DynamicDrawUsage as Wc,
} from 'three';

let hl = 4;   // anisotropía de las texturas de lienzo
const HOLD_CATCH = 90;   // [sitio] ángulo al que se engancha el arrastre (le.HOLD_ANGLE)
function nh(i) {
 hl = i
}

function zn(i, t, e, {
 srgb: n = !1,
 repeat: s = null
} = {}) {
 let r = document.createElement("canvas");
 r.width = i, r.height = t;
 let o = r.getContext("2d");
 e(o, i, t);
 let a = new ni(r);
 return a.anisotropy = hl, n && (a.colorSpace = Be), s && (a.wrapS = a.wrapT = Li, a.repeat.set(s[0], s[1])), a
}

function ih(i, t, e, n = 2, s = null) {
 let r = document.createElement("canvas");
 r.width = i, r.height = t;
 let o = r.getContext("2d"),
  a = o.createImageData(i, t),
  l = new Float32Array(i * t);
 for (let u = 0; u < t; u++)
  for (let d = 0; d < i; d++) l[u * i + d] = e(d / i, u / t);
 let h = (u, d) => l[(d + t) % t * i + (u + i) % i];
 for (let u = 0; u < t; u++)
  for (let d = 0; d < i; d++) {
   let f = (h(d + 1, u) - h(d - 1, u)) * n,
    g = (h(d, u + 1) - h(d, u - 1)) * n,
    x = -f,
    m = g,
    p = 1,
    b = Math.hypot(x, m, p),
    M = (u * i + d) * 4;
   a.data[M] = (x / b * .5 + .5) * 255, a.data[M + 1] = (m / b * .5 + .5) * 255, a.data[M + 2] = (p / b * .5 + .5) * 255, a.data[M + 3] = 255
  }
 o.putImageData(a, 0, 0);
 let c = new ni(r);
 return c.anisotropy = hl, s && (c.wrapS = c.wrapT = Li, c.repeat.set(s[0], s[1])), c
}

function sh() {
 return zn(256, 256, (i, t, e) => {
  i.fillStyle = "#6b6b6b", i.fillRect(0, 0, t, e);
  for (let n = 0; n < 1800; n++) {
   let s = 95 + Math.random() * 40;
   i.fillStyle = `rgba(${s},${s},${s},0.35)`, i.fillRect(Math.random() * t, Math.random() * e, 1 + Math.random() * 2, 1)
  }
  for (let n = 0; n < 260; n++) {
   let s = Math.random() * e,
    r = 90 + Math.random() * 40;
   i.strokeStyle = `rgba(${r},${r},${r},0.18)`, i.beginPath(), i.moveTo(0, s), i.lineTo(t, s + (Math.random() - .5) * 2), i.stroke()
  }
 }, {
  repeat: [6, 6]
 })
}

function rh() {
 return zn(256, 256, (i, t, e) => {
  i.fillStyle = "#f2f3f2", i.fillRect(0, 0, t, e), i.fillStyle = "#9ea4a8";
  let n = 32;
  for (let s = n / 2; s < e; s += n)
   for (let r = n / 2; r < t; r += n) i.beginPath(), i.arc(r + (s / n % 2 ? n / 2 : 0), s, 3.2, 0, Math.PI * 2), i.fill()
 }, {
  srgb: !0,
  repeat: [8, 8]
 })
}

function oh() {
 return ih(128, 16, i => Math.pow(Math.abs(Math.sin(i * Math.PI * 8)), .6), 4, [6, 30])
}

function ah() {
 return ih(256, 8, i => .5 + .5 * Math.sin(i * Math.PI * 2 * 40), 3)
}

function lh() {
 return zn(512, 512, (i, t, e) => {
  i.fillStyle = "#c3c5c2", i.fillRect(0, 0, t, e);
  for (let n = 0; n < 9e3; n++) {
   let s = 185 + Math.random() * 30;
   i.fillStyle = `rgba(${s},${s},${s-3},0.16)`, i.fillRect(Math.random() * t, Math.random() * e, 2, 2)
  }
  i.strokeStyle = "rgba(160,162,160,0.55)", i.lineWidth = 2, i.beginPath(), i.moveTo(0, 1), i.lineTo(t, 1), i.moveTo(1, 0), i.lineTo(1, e), i.stroke()
 }, {
  srgb: !0,
  repeat: [7, 7]
 })
}

function ch() {
 return zn(512, 512, (i, t, e) => {
  i.fillStyle = "#e2e5e4", i.fillRect(0, 0, t, e);
  for (let n = 0; n < 5e3; n++) {
   let s = 220 + Math.random() * 20;
   i.fillStyle = `rgba(${s},${s},${s},0.2)`, i.fillRect(Math.random() * t, Math.random() * e, 2, 2)
  }
 }, {
  srgb: !0,
  repeat: [4, 2]
 })
}

function hh(i, t, e, n, s) {
 i.fillStyle = "#fff", i.fillRect(t - 6, e - 6, n + 12, s + 22), i.fillStyle = "#111";
 let r = t,
  o = 7;
 for (; r < t + n;) {
  o = (o * 9301 + 49297) % 233280;
  let a = 1 + o % 4;
  (o >> 3) % 2 && i.fillRect(r, e, a, s), r += a + 1
 }
 i.font = "600 12px Arial", i.fillText("7 501234 567890", t + 2, e + s + 13)
}

function uh(i, t, e, n) {
 i.strokeStyle = n, i.fillStyle = n, i.lineWidth = 2, i.strokeRect(t, e, 170, 150), i.font = "700 15px Arial", i.fillText("Informaci\xF3n", t + 8, e + 22), i.fillText("nutrimental", t + 8, e + 40), i.font = "12px Arial", ["Contenido energ\xE9tico", "Prote\xEDnas", "Grasas totales", "Carbohidratos", "Sodio"].forEach((r, o) => {
  i.fillRect(t + 8, e + 52 + o * 19, 154, 1), i.fillText(r, t + 8, e + 66 + o * 19)
 })
}

function Cr(i, {
 w: t = 1024,
 h: e = 512,
 can: n = !1
} = {}) {
 return zn(t, e, s => {
  let {
   bg: r,
   ink: o,
   accent: a,
   title: l,
   sub: h,
   vol: c
  } = i.art;
  if (s.fillStyle = r, s.fillRect(0, 0, t, e), n) {
   let g = s.createLinearGradient(0, 0, 0, e * .11);
   g.addColorStop(0, "#c7cbcf"), g.addColorStop(1, "#9aa0a5"), s.fillStyle = g, s.fillRect(0, 0, t, e * .105), s.fillStyle = "#a8adb1", s.fillRect(0, e * .94, t, e * .06)
  }
  let u = n ? e * .12 : 0,
   d = n ? e * .93 : e,
   f = (u + d) / 2;
  s.fillStyle = a, s.beginPath(), s.moveTo(0, d - (d - u) * .28), s.bezierCurveTo(t * .3, d - (d - u) * .42, t * .7, d - (d - u) * .12, t, d - (d - u) * .26), s.lineTo(t, d), s.lineTo(0, d), s.closePath(), s.globalAlpha = .9, s.fill(), s.globalAlpha = 1, s.fillStyle = o, s.textAlign = "center", s.font = `800 ${Math.round((d-u)*.25)}px "Arial Black", Arial, sans-serif`, s.fillText(l, t / 2, f + (d - u) * .02), s.font = `600 ${Math.round((d-u)*.075)}px Arial, sans-serif`, s.fillText(h.toUpperCase(), t / 2, f + (d - u) * .14), s.font = `700 ${Math.round((d-u)*.07)}px Arial, sans-serif`, s.fillText(c, t / 2, d - (d - u) * .06), s.font = `700 ${Math.round((d-u)*.06)}px Arial, sans-serif`, s.fillText("SELECCI\xD3N", t / 2, u + (d - u) * .16), s.fillRect(t / 2 - 60, u + (d - u) * .2, 120, 3), s.textAlign = "left", uh(s, t * .02, f - 75, o), hh(s, t * .86, f - 30, 110, 50)
 }, {
  srgb: !0
 })
}

function dh(i) {
 let {
  bg: t,
  ink: e,
  accent: n,
  title: s,
  sub: r,
  vol: o
 } = i.art, a = zn(512, 1024, (c, u, d) => {
  c.fillStyle = t, c.fillRect(0, 0, u, d), c.fillStyle = n, c.beginPath(), c.moveTo(0, d * .62), c.bezierCurveTo(u * .35, d * .55, u * .7, d * .7, u, d * .6), c.lineTo(u, d), c.lineTo(0, d), c.fill(), c.fillStyle = "rgba(255,255,255,0.85)", c.beginPath(), c.arc(u / 2, d * .73, u * .22, 0, Math.PI * 2), c.fill(), c.fillStyle = n, c.beginPath(), c.arc(u / 2, d * .73, u * .16, 0, Math.PI * 2), c.fill(), c.fillStyle = e, c.textAlign = "center", c.font = "700 34px Arial", c.fillText("SELECCI\xD3N", u / 2, d * .12), c.font = '800 96px "Arial Black", Arial', s.split(" ").forEach((f, g) => c.fillText(f, u / 2, d * .27 + g * 100)), c.font = "600 30px Arial", c.fillText(r.toUpperCase(), u / 2, d * .47), c.fillStyle = "#fff", c.font = "800 54px Arial", c.fillText(o, u / 2, d * .95)
 }, {
  srgb: !0
 }), l = zn(512, 1024, (c, u, d) => {
  c.fillStyle = t, c.fillRect(0, 0, u, d), c.save(), c.translate(u / 2, d / 2), c.scale(2.2, 2.2), uh(c, -85, -75, e), c.restore(), hh(c, u * .25, d * .86, 250, 70)
 }, {
  srgb: !0
 }), h = zn(256, 256, (c, u, d) => {
  c.fillStyle = t, c.fillRect(0, 0, u, d), c.fillStyle = "rgba(0,0,0,0.12)", c.fillRect(0, d * .48, u, 6)
 }, {
  srgb: !0
 });
 return {
  front: a,
  side: l,
  top: h
 }
}
var ul = .072,
 dl = .064,
 Pr = .762,
 Ir = .11,
 fl = 2.0066,   // 79" (PDF: medidas estándar 30" × 79"). Antes 1.905 (75"), estimado
 fh = .095,
 Ne = {
  JAMB: ul,
  MULL: dl,
  BAY: Pr,
  SILL: Ir,
  OPEN_H: fl,
  HEADER: fh,
  FRAME_DEPTH: .1,
  TOTAL_W: 2 * ul + 3 * Pr + 2 * dl,
  TOTAL_H: Ir + fl + fh,
  LEAF_OVERLAP: .017,
  LEAF_T: .04,
  LEAF_Z0: .006,
  AXIS_INSET: .016,
  STILE: .046,
  TOP_RAIL: .05,
  BOTTOM_RAIL: .072,
  CAB_DEPTH: .92
 },
 Ft = [0, 1, 2].map(i => {
  let t = -Ne.TOTAL_W / 2 + ul + i * (Pr + dl),
   e = t + Pr,
   n = t - Ne.LEAF_OVERLAP,
   s = e + Ne.LEAF_OVERLAP;
  return {
   index: i,
   x0: t,
   x1: e,
   cx: (t + e) / 2,
   leafX0: n,
   leafX1: s,
   leafW: s - n,
   leafY0: Ir - .012,
   leafY1: Ir + fl + .012,
   axisX: s - Ne.AXIS_INSET,
   axisZ: Ne.LEAF_Z0 + Ne.LEAF_T / 2,
   // [sitio] Mano de la puerta: −1 = bisagras a la izquierda y jaladera a la derecha, como el juego real
   // (04_PRODUCTOS_FOTOGRAFIAS/REFERENCIAS_APROBADAS_Y_CAPTURAS/CDS_SET_3_HOJAS_REFERENCIA.png). La hoja se construye
   // igual que en el original (eje a la derecha, en axisX) y src/viewers/cds.js la refleja sobre el centro del vano;
   // hingeX es dónde queda el eje real.
   hand: -1,
   hingeX: (t + e) - (s - Ne.AXIS_INSET)
  }
 }),
 le = {
  HOLD_ANGLE: 90,
  CATCH_TOL: 4,
  CLOSE_EPS: .25,
  DEFAULT_CLOSE_TIME: 3.5,
  PICK_MIN_ANGLE: 85
 },
 ph = [.16, .52, .88, 1.24, 1.6],   // altura de cada parrilla (m)
 Lr = {
  DEPTH: .6,
  SLOPE_DEG: 3,
  FRONT_Z: -.115
 },
 Dr = {
  advanced: {
   name: "Legacy Advanced",
   use: "Refrigeraci\xF3n",
   panes: 2,
   heated: !1,
   gas: "Gas arg\xF3n",
   bullets: ["Refrigeraci\xF3n", "Dos vidrios sin resistencia", "C\xE1mara con gas arg\xF3n"]
  },
  plus: {
   name: "Legacy Plus",
   use: "Refrigeraci\xF3n",
   panes: 2,
   heated: !0,
   gas: null,
   bullets: ["Refrigeraci\xF3n", "Dos vidrios con resistencia"]
  },
  lt: {
   name: "Legacy LT",
   use: "Congelaci\xF3n",
   panes: 3,
   heated: !0,
   gas: null,
   bullets: ["Congelaci\xF3n", "Tres vidrios con resistencia"]
  }
 },
 gs = {
  high: {
   label: "Alta",
   pixelRatio: 2,
   shadows: !0,
   rows: 6
  },
  medium: {
   label: "Media",
   pixelRatio: 1.5,
   shadows: !0,
   rows: 3
  },
  low: {
   label: "B\xE1sica",
   pixelRatio: 1,
   shadows: !1,
   rows: 2
  }
 };

function gh() {
 let i = sh();
 return {
  blackAlu: new Je({
   color: 1382170,
   metalness: .55,
   roughness: .42,
   roughnessMap: i,
   clearcoat: .18,
   clearcoatRoughness: .45,
   envMapIntensity: .9
  }),
  blackAluEdge: new Je({
   color: 987154,
   metalness: .5,
   roughness: .5,
   roughnessMap: i,
   envMapIntensity: .7
  }),
  handle: new Je({
   color: 855568,
   metalness: .45,
   roughness: .32,
   clearcoat: .35,
   clearcoatRoughness: .25,
   envMapIntensity: 1
  }),
  glass: new Je({
   color: 16777215,
   metalness: 0,
   roughness: .02,
   transparent: !0,
   opacity: .085,
   ior: 1.52,
   specularIntensity: 1,
   envMapIntensity: 1.6,
   depthWrite: !1,
   side: Te
  }),
  glassEdge: new Wt({
   color: 6262656,
   roughness: .2,
   transparent: !0,
   opacity: .55
  }),
  spacer: new Wt({
   color: 2764080,
   metalness: .6,
   roughness: .45
  }),
  rubber: new Wt({
   color: 723724,
   roughness: .86,
   metalness: 0
  }),
  chrome: new Wt({
   color: 12830924,
   metalness: 1,
   roughness: .18
  }),
  hardware: new Wt({
   color: 2829874,
   metalness: .75,
   roughness: .38
  }),
  interior: new Wt({
   color: 16777215,
   map: rh(),
   roughness: .62
  }),
  interiorPlain: new Wt({
   color: 15856369,
   roughness: .6
  }),
  upright: new Wt({
   color: 15001318,
   metalness: .3,
   roughness: .45
  }),
  ledStrip: new Wt({
   color: 16777215,
   emissive: 16054527,
   emissiveIntensity: 2.2,
   roughness: .3
  }),
  trayBase: new Wt({
   color: 1776670,
   roughness: .58,
   metalness: .05,
   normalMap: oh(),
   normalScale: new it(.9, .9)
  }),
  trayRail: new Wt({
   color: 13225425,
   metalness: 1,
   roughness: .32
  }),
  wire: new Wt({
   color: 13817562,
   metalness: 1,
   roughness: .26
  }),
  strip: new Wt({
   color: 14672612,
   metalness: .6,
   roughness: .35
  }),
  acrylic: new Je({
   color: 16777215,
   transparent: !0,
   opacity: .22,
   roughness: .05,
   metalness: 0,
   envMapIntensity: 1.2,
   depthWrite: !1
  }),
  wall: new Wt({
   color: 16777215,
   map: ch(),
   roughness: .9
  }),
  floor: new Wt({
   color: 16777215,
   map: lh(),
   roughness: .38,
   metalness: 0,
   envMapIntensity: .6
  }),
  baseboard: new Wt({
   color: 14212059,
   roughness: .5
  }),
  pet: new Je({
   color: 16055295,
   metalness: 0,
   roughness: .06,
   transparent: !0,
   opacity: .22,
   envMapIntensity: 1.6,
   depthWrite: !1,
   side: Te
  }),
  crown: new Wt({
   color: 13215301,
   metalness: 1,
   roughness: .3
  }),
  canTop: new Wt({
   color: 12567752,
   metalness: 1,
   roughness: .25
  }),
  knurl: ah()
 }
}

function _h(i, t = 1489355) {
 let e = [];
 for (let s of i) {
  e.push([s, s.material]);
  let o = (Array.isArray(s.material) ? s.material : [s.material]).map(a => {
   let l = a.clone();
   return l.emissive && (l.emissive = new Lt(t), l.emissiveIntensity = 0), l
  });
  s.material = Array.isArray(s.material) ? o : o[0]
 }
 let n = 0;
 return {
  tick(s) {
   n += s;
   let r = .25 + .25 * Math.sin(n * 4);
   for (let [o] of e)(Array.isArray(o.material) ? o.material : [o.material]).forEach(l => {
    l.emissive && (l.emissiveIntensity = r)
   })
  },
  clear() {
   for (let [s, r] of e)(Array.isArray(s.material) ? s.material : [s.material]).forEach(a => a.dispose()), s.material = r
  }
 }
}
var _s = new R;

function Qe(i, t, e, n, s, r) {
 let o = 2 * Math.PI * s / 4,
  a = Math.max(r - 2 * s, 0),
  l = Math.PI / 4;
 _s.copy(t), _s[n] = 0, _s.normalize();
 let h = .5 * o / (o + a),
  c = 1 - _s.angleTo(i) / l;
 return Math.sign(_s[e]) === 1 ? c * h : a / (o + a) + h + h * (1 - c)
}
var Wi = class extends Ot {
 constructor(t = 1, e = 1, n = 1, s = 2, r = .1) {
  if (s = s * 2 + 1, r = Math.min(t / 2, e / 2, n / 2, r), super(1, 1, 1, s, s, s), s === 1) return;
  let o = this.toNonIndexed();
  this.index = null, this.attributes.position = o.attributes.position, this.attributes.normal = o.attributes.normal, this.attributes.uv = o.attributes.uv;
  let a = new R,
   l = new R,
   h = new R(t, e, n).divideScalar(2).subScalar(r),
   c = this.attributes.position.array,
   u = this.attributes.normal.array,
   d = this.attributes.uv.array,
   f = c.length / 6,
   g = new R,
   x = .5 / s;
  for (let m = 0, p = 0; m < c.length; m += 3, p += 2) switch (a.fromArray(c, m), l.copy(a), l.x -= Math.sign(l.x) * x, l.y -= Math.sign(l.y) * x, l.z -= Math.sign(l.z) * x, l.normalize(), c[m + 0] = h.x * Math.sign(a.x) + l.x * r, c[m + 1] = h.y * Math.sign(a.y) + l.y * r, c[m + 2] = h.z * Math.sign(a.z) + l.z * r, u[m + 0] = l.x, u[m + 1] = l.y, u[m + 2] = l.z, Math.floor(m / f)) {
   case 0:
    g.set(1, 0, 0), d[p + 0] = Qe(g, l, "z", "y", r, n), d[p + 1] = 1 - Qe(g, l, "y", "z", r, e);
    break;
   case 1:
    g.set(-1, 0, 0), d[p + 0] = 1 - Qe(g, l, "z", "y", r, n), d[p + 1] = 1 - Qe(g, l, "y", "z", r, e);
    break;
   case 2:
    g.set(0, 1, 0), d[p + 0] = 1 - Qe(g, l, "x", "z", r, t), d[p + 1] = Qe(g, l, "z", "x", r, n);
    break;
   case 3:
    g.set(0, -1, 0), d[p + 0] = 1 - Qe(g, l, "x", "z", r, t), d[p + 1] = 1 - Qe(g, l, "z", "x", r, n);
    break;
   case 4:
    g.set(0, 0, 1), d[p + 0] = 1 - Qe(g, l, "x", "y", r, t), d[p + 1] = 1 - Qe(g, l, "y", "x", r, e);
    break;
   case 5:
    g.set(0, 0, -1), d[p + 0] = Qe(g, l, "x", "y", r, t), d[p + 1] = 1 - Qe(g, l, "y", "x", r, e);
    break
  }
 }
};
var Xi = (i, t, e, n = .004) => new Wi(i, t, e, 3, Math.min(n, i / 2 - 1e-4, t / 2 - 1e-4, e / 2 - 1e-4));

function ce(i, t, e, n, s, r, o) {
 let a = new At(t, e);
 return a.position.set(n, s, r), a.castShadow = !0, a.receiveShadow = !0, o && (a.name = o), i.add(a), a
}

function xh(i) {
 let t = new me;
 t.name = "MasterFrame";
 let {
  TOTAL_W: e,
  TOTAL_H: n,
  SILL: s,
  OPEN_H: r,
  HEADER: o,
  JAMB: a,
  MULL: l,
  FRAME_DEPTH: h,
  CAB_DEPTH: c
 } = Ne, u = {
  jambs: [],
  mullions: [],
  header: null,
  sill: null,
  topHinges: [],
  bottomHinges: [],
  leds: [],
  ledLights: [],
  interior: []
 }, d = -h / 2;
 u.header = ce(t, Xi(e, o, h, .005), i.blackAlu, 0, s + r + o / 2, d, "Header"), u.sill = ce(t, Xi(e, s, h, .005), i.blackAlu, 0, s / 2, d, "Sill");
 for (let V of [-1, 1]) u.jambs.push(ce(t, Xi(a, r + .002, h, .004), i.blackAlu, V * (e / 2 - a / 2), s + r / 2, d, "Jamb"));
 for (let V = 0; V < 2; V++) {
  let F = (Ft[V].x1 + Ft[V + 1].x0) / 2,
   K = ce(t, Xi(l, r + .002, h, .004), i.blackAlu.clone(), F, s + r / 2, d, "Mullion");
  for (let G of [-.017, .017]) ce(t, new Ot(.0025, r - .02, .002), i.blackAluEdge, F + G, s + r / 2, 5e-4);
  u.mullions.push(K)
 }
 for (let V of Ft) ce(t, new Ot(V.x1 - V.x0, .004, h), i.blackAluEdge, V.cx, s + .002, d), ce(t, new Ot(V.x1 - V.x0, .004, h), i.blackAluEdge, V.cx, s + r - .002, d);
 for (let V of Ft) {
  // [sitio] con la mano izquierda el herraje se refleja sobre el centro del vano (hx)
  let hx = V.hand < 0 ? (st => 2 * V.cx - st) : (st => st),
   F = V.leafY1,
   K = ce(t, Xi(.056, .04, .05, .004), i.hardware, hx(V.axisX - .006), F + .0225, .025, "TopHinge");
  ce(t, new Me(.0055, .0055, .008, 18), i.chrome, hx(V.axisX), F + .001, V.axisZ);
  for (let st of [-.018, .01]) ce(t, new Me(.0035, .0035, .002, 12).rotateX(Math.PI / 2), i.chrome, hx(V.axisX - .006 + st), F + .026, .0505);
  u.topHinges.push(K);
  let G = ce(t, Xi(.06, .064, .05, .004), i.hardware, hx(V.axisX - .008), V.leafY0 - .034, .025, "BottomHinge");
  ce(t, new Me(.0055, .0055, .008, 18), i.chrome, hx(V.axisX), V.leafY0 - .001, V.axisZ), ce(t, new Me(.0045, .0045, .002, 16).rotateX(Math.PI / 2), i.chrome, hx(V.axisX - .008), V.leafY0 - .034, .0505), u.bottomHinges.push(G)
 }
 let f = e - 2 * .03,
  g = r + .02,
  x = s + r / 2,
  m = ce(t, new an(f, g), i.interior, 0, x, -c);
 m.receiveShadow = !0, m.castShadow = !1;
 let p = ce(t, new an(f, c - h), i.interiorPlain, 0, s + .001, -(c + h) / 2);
 p.rotation.x = -Math.PI / 2;
 let b = ce(t, new an(f, c - h), i.interiorPlain, 0, s + r - .001, -(c + h) / 2);
 b.rotation.x = Math.PI / 2;
 for (let V of [-1, 1]) {
  let F = ce(t, new an(c - h, g), i.interiorPlain, V * f / 2, x, -(c + h) / 2);
  F.rotation.y = -V * Math.PI / 2
 }
 let M = [Ft[0].x0 + .01, (Ft[0].x1 + Ft[1].x0) / 2, (Ft[1].x1 + Ft[2].x0) / 2, Ft[2].x1 - .01];
 for (let V of M) ce(t, new Ot(.03, g, .03), i.upright, V, x, -c + .02);
 u.interior.push(m, p, b);
 let E = [Ft[0].x0 + .012, (Ft[0].x1 + Ft[1].x0) / 2, (Ft[1].x1 + Ft[2].x0) / 2, Ft[2].x1 - .012];
 for (let V of E) {
  let F = ce(t, new Ot(.014, r - .12, .008), i.ledStrip, V, x, -h - .006, "KeyLED");
  F.castShadow = !1, u.leds.push(F);
  let K = new ki(15923199, .9, 1.8, 1.4);
  K.position.set(V, x, -h - .08), t.add(K), u.ledLights.push(K)
 }
 let D = new me;
 D.name = "Architecture";
 let A = -.055,
  T = .1,
  P = 9,
  X = 3.4;
 ce(D, new Ot((P - e) / 2, X, T), i.wall, -(e / 2 + (P - e) / 4), X / 2, A - .002), ce(D, new Ot((P - e) / 2, X, T), i.wall, e / 2 + (P - e) / 4, X / 2, A - .002), ce(D, new Ot(e, X - n, T), i.wall, 0, n + (X - n) / 2, A - .002);
 for (let V of [-1, 1]) ce(D, new Ot((P - e) / 2, .09, .012), i.baseboard, V * (e / 2 + (P - e) / 4), .045, 0);
 let _ = document.createElement("canvas");
 _.width = 256, _.height = 256;
 let S = _.getContext("2d");
 S.filter = "blur(18px)", S.fillStyle = "rgba(30,40,45,0.55)", S.fillRect(40, 40, 176, 216);
 let U = new ni(_),
  O = new At(new an(e + .5, n + .42), new Fn({
   map: U,
   transparent: !0,
   depthWrite: !1,
   opacity: .45
  }));
 O.position.set(0, (n + .42) / 2 - .02, A + .0475), O.renderOrder = -1, D.add(O);
 let H = ce(D, new an(16, 12), i.floor, 0, 0, 3);
 return H.rotation.x = -Math.PI / 2, H.castShadow = !1, t.add(D), {
  root: t,
  parts: u
 }
}
var xs = (i, t, e, n = .003) => new Wi(i, t, e, 3, Math.min(n, i / 2 - 1e-4, t / 2 - 1e-4, e / 2 - 1e-4));

function yh(i, t) {
 let e = new me;
 e.name = `DoorPivot_${i.index+1}`, e.position.set(i.axisX, 0, i.axisZ);
 let n = Ne.LEAF_T,
  s = Ne.STILE,
  r = Ne.TOP_RAIL,
  o = Ne.BOTTOM_RAIL,
  a = i.leafX1 - i.axisX,
  l = i.leafX0 - i.axisX,
  h = a - l,
  c = i.leafY0,
  u = i.leafY1,
  d = u - c,
  f = [],
  g = [],
  x = (et, Pt, zt, Bt, C, {
   pick: Re = !0,
   shadow: kt = !0
  } = {}) => {
   let Dt = new At(et, Pt);
   return Dt.position.set(zt, Bt, C), Dt.castShadow = kt, Dt.receiveShadow = !0, Dt.userData.doorIndex = i.index, e.add(Dt), f.push(Dt), Re && g.push(Dt), Dt
  },
  m = [x(xs(s, d, n, .004), t.blackAlu, l + s / 2, c + d / 2, 0), x(xs(s, d, n, .004), t.blackAlu, a - s / 2, c + d / 2, 0), x(xs(h - 2 * s + .002, r, n, .004), t.blackAlu, (l + a) / 2, u - r / 2, 0), x(xs(h - 2 * s + .002, o, n, .004), t.blackAlu, (l + a) / 2, c + o / 2, 0)],
  p = l + s,
  b = a - s,
  M = c + o,
  E = u - r,
  D = b - p,
  A = E - M,
  T = .006,
  P = n / 2 + 8e-4;
 x(new Ot(D, T, .003), t.blackAluEdge, (p + b) / 2, E - T / 2, P), x(new Ot(D, T, .003), t.blackAluEdge, (p + b) / 2, M + T / 2, P), x(new Ot(T, A, .003), t.blackAluEdge, p + T / 2, (M + E) / 2, P), x(new Ot(T, A, .003), t.blackAluEdge, b - T / 2, (M + E) / 2, P);
 let X = new Ot(D + .012, A + .012, .004),
  _ = {
   front: x(X, t.glass, (p + b) / 2, (M + E) / 2, .014, {
    shadow: !1
   }),
   middle: x(X, t.glass, (p + b) / 2, (M + E) / 2, 0, {
    shadow: !1
   }),
   back: x(X, t.glass, (p + b) / 2, (M + E) / 2, -.014, {
    shadow: !1
   })
  };
 Object.values(_).forEach(et => {
  et.renderOrder = 2
 });
 let S = [],
  U = .009;
 for (let [et, Pt, zt, Bt] of [
   [D, U, (p + b) / 2, E - U / 2],
   [D, U, (p + b) / 2, M + U / 2],
   [U, A, p + U / 2, (M + E) / 2],
   [U, A, b - U / 2, (M + E) / 2]
  ]) S.push(x(new Ot(et, Pt, .024), t.spacer, zt, Bt, 0, {
  pick: !1
 }));
 let O = [],
  H = -n / 2 - .0015,
  V = .01,
  F = l + V,
  K = a - V,
  G = c + V,
  st = u - V,
  dt = [{
   len: K - F,
   horiz: !0,
   x: (F + K) / 2,
   y: st
  }, {
   len: K - F,
   horiz: !0,
   x: (F + K) / 2,
   y: G
  }, {
   len: st - G,
   horiz: !1,
   x: F,
   y: (G + st) / 2
  }, {
   len: st - G,
   horiz: !1,
   x: K,
   y: (G + st) / 2
  }];
 for (let et of dt) {
  let Pt = et.horiz ? new Ot(et.len, .016, .003) : new Ot(.016, et.len, .003);
  O.push(x(Pt, t.rubber, et.x, et.y, H, {
   pick: !1,
   shadow: !1
  }));
  for (let zt of [-.005, 0, .005]) {
   let Bt = et.horiz ? new Ot(et.len, .0016, .0045) : new Ot(.0016, et.len, .0045);
   O.push(x(Bt, t.rubber, et.x + (et.horiz ? 0 : zt), et.y + (et.horiz ? zt : 0), H - .0035, {
    pick: !1,
    shadow: !1
   }))
  }
 }
 let lt = new me;
 lt.name = "Handle";
 let Ht = .4,
  Yt = 1.1,
  Y = l + s / 2 + .002,
  j = .032,
  pt = new At(xs(.019, Ht, .015, .0065), t.handle);
 pt.position.set(0, 0, n / 2 + j + .0075), lt.add(pt);
 for (let et of [-(Ht / 2 - .03), Ht / 2 - .03]) {
  let Pt = new At(new Me(.0065, .0075, j, 20).rotateX(Math.PI / 2), t.handle);
  Pt.position.set(0, et, n / 2 + j / 2), lt.add(Pt);
  let zt = new At(new Me(.0105, .0105, .003, 24).rotateX(Math.PI / 2), t.handle);
  zt.position.set(0, et, n / 2 + .0015), lt.add(zt)
 }
 lt.position.set(Y, Yt, 0), lt.traverse(et => {
  et.isMesh && (et.castShadow = !0, et.userData.doorIndex = i.index, et.userData.isHandle = !0, g.push(et), f.push(et))
 }), e.add(lt);
 let ct = new Me(.0095, .0095, .01, 24),
  Rt = [x(ct, t.hardware, 0, u - .004, 0, {
   pick: !1
  }), x(ct, t.hardware, 0, c + .004, 0, {
   pick: !1
  })];
 return {
  bay: i,
  pivot: e,
  meshes: f,
  pickables: g,
  rails: m,
  panes: _,
  spacers: S,
  gaskets: O,
  handle: lt,
  sleeves: Rt
 }
}

function pl(i, t = !1) {
 let e = i[0].index !== null,
  n = new Set(Object.keys(i[0].attributes)),
  s = new Set(Object.keys(i[0].morphAttributes)),
  r = {},
  o = {},
  a = i[0].morphTargetsRelative,
  l = new Ke,
  h = 0;
 for (let c = 0; c < i.length; ++c) {
  let u = i[c],
   d = 0;
  if (e !== (u.index !== null)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
  for (let f in u.attributes) {
   if (!n.has(f)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + '. All geometries must have compatible attributes; make sure "' + f + '" attribute exists among all geometries, or in none of them.'), null;
   r[f] === void 0 && (r[f] = []), r[f].push(u.attributes[f]), d++
  }
  if (d !== n.size) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + ". Make sure all geometries have the same number of attributes."), null;
  if (a !== u.morphTargetsRelative) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
  for (let f in u.morphAttributes) {
   if (!s.has(f)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + ".  .morphAttributes must be consistent throughout all geometries."), null;
   o[f] === void 0 && (o[f] = []), o[f].push(u.morphAttributes[f])
  }
  if (t) {
   let f;
   if (e) f = u.index.count;
   else if (u.attributes.position !== void 0) f = u.attributes.position.count;
   else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + c + ". The geometry must have either an index or a position attribute"), null;
   l.addGroup(h, f, c), h += f
  }
 }
 if (e) {
  let c = 0,
   u = [];
  for (let d = 0; d < i.length; ++d) {
   let f = i[d].index;
   for (let g = 0; g < f.count; ++g) u.push(f.getX(g) + c);
   c += i[d].attributes.position.count
  }
  l.setIndex(u)
 }
 for (let c in r) {
  let u = vh(r[c]);
  if (!u) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + c + " attribute."), null;
  l.setAttribute(c, u)
 }
 for (let c in o) {
  let u = o[c][0].length;
  if (u === 0) break;
  l.morphAttributes = l.morphAttributes || {}, l.morphAttributes[c] = [];
  for (let d = 0; d < u; ++d) {
   let f = [];
   for (let x = 0; x < o[c].length; ++x) f.push(o[c][x][d]);
   let g = vh(f);
   if (!g) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + c + " morphAttribute."), null;
   l.morphAttributes[c].push(g)
  }
 }
 return l
}

function vh(i) {
 let t, e, n, s = -1,
  r = 0;
 for (let h = 0; h < i.length; ++h) {
  let c = i[h];
  if (t === void 0 && (t = c.array.constructor), t !== c.array.constructor) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."), null;
  if (e === void 0 && (e = c.itemSize), e !== c.itemSize) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."), null;
  if (n === void 0 && (n = c.normalized), n !== c.normalized) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."), null;
  if (s === -1 && (s = c.gpuType), s !== c.gpuType) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."), null;
  r += c.count * e
 }
 let o = new t(r),
  a = new Ie(o, e, n),
  l = 0;
 for (let h = 0; h < i.length; ++h) {
  let c = i[h];
  if (c.isInterleavedBufferAttribute) {
   let u = l / e;
   for (let d = 0, f = c.count; d < f; d++)
    for (let g = 0; g < e; g++) {
     let x = c.getComponent(d, g);
     a.setComponent(d + u, g, x)
    }
  } else o.set(c.array, l);
  l += c.count * e
 }
 return s !== void 0 && (a.gpuType = s), a
}

function Mh(i, t) {
 let e = new me;
 e.name = "Shelves";
 let n = [],
  s = Ne.BAY - .024,
  r = Lr.DEPTH;
 for (let o of Ft) ph.forEach((a, l) => {
  let h = t[o.index][l],
   c = h.lane,
   u = Math.floor((s - .02) / c),
   d = u * c,
   f = -d / 2,
   g = new me;
  g.position.set(o.cx, a, Lr.FRONT_Z), g.rotation.x = Ue.degToRad(Lr.SLOPE_DEG), g.name = `Tray_${o.index+1}_${l+1}`;
  let x = new At(new Ot(s, .008, r), i.trayBase);
  x.position.set(0, -.004, -r / 2), x.receiveShadow = !0, g.add(x);
  for (let A of [-1, 1]) {
   let T = new At(new Ot(.012, .022, r), i.trayRail);
   T.position.set(A * (s / 2 + .004), .003, -r / 2), g.add(T);
   let P = new At(new Ot(.018, .03, r + .15), i.upright);
   P.position.set(A * (s / 2 - .04), -.025, -r / 2 - .06), g.add(P)
  }
  let m = new At(new Ot(s, .014, .018), i.trayRail);
  m.position.set(0, -.004, .006), g.add(m);
  let p = new At(new Ot(s, .055, .004), i.acrylic);
  p.position.set(0, .03, .012), p.renderOrder = 3, g.add(p);
  let b = [],
   M = [];
  for (let A = 0; A <= u; A++) {
   let T = f + A * c,
    P = [
     [0, -.004],
     [.042, -.004],
     [.062, -.03],
     [.062, -r + .05],
     [.035, -r + .01],
     [0, -r + .01]
    ].map(([S, U]) => new R(T, S, U)),
    X = new us(P, !1, "catmullrom", .05);
   b.push(new gr(X, 26, .0021, 5, !1));
   let _ = new Ot(.01, .002, r - .02);
   _.translate(T, .001, -r / 2), M.push(_)
  }
  let E = new At(pl(b), i.wire);
  E.castShadow = !1, g.add(E);
  let D = new At(pl(M), i.strip);
  g.add(D), e.add(g), n.push({
   group: g,
   bay: o.index,
   level: l,
   sku: h,
   lanes: u,
   pitch: c,
   x0: f,
   width: s,
   depth: r
  })
 });
 return {
  root: e,
  trays: n
 }
}
var oi = {
  cola: {
   kind: "can",
   name: "Refresco de cola",
   vol: "355 ml",
   lane: .076,
   rowPitch: .068,
   art: {
    bg: "#b0141c",
    ink: "#ffffff",
    accent: "#7c0c12",
    title: "COLA",
    sub: "Refresco original",
    vol: "355 ml"
   }
  },
  lima: {
   kind: "can",
   name: "Refresco lima-lim\xF3n",
   vol: "355 ml",
   lane: .076,
   rowPitch: .068,
   art: {
    bg: "#2c8a3c",
    ink: "#ffffff",
    accent: "#c9e04a",
    title: "LIM\xD3N",
    sub: "Lima-lim\xF3n",
    vol: "355 ml"
   }
  },
  mineral: {
   kind: "can",
   name: "Agua mineral",
   vol: "355 ml",
   lane: .076,
   rowPitch: .068,
   art: {
    bg: "#e6edf1",
    ink: "#0b3d66",
    accent: "#2a86c7",
    title: "MINERAL",
    sub: "Agua mineral gasificada",
    vol: "355 ml"
   }
  },
  lager: {
   kind: "can",
   name: "Cerveza clara (lata)",
   vol: "473 ml",
   lane: .076,
   rowPitch: .068,
   tall: !0,
   art: {
    bg: "#c8a031",
    ink: "#1b1a17",
    accent: "#ffffff",
    title: "LAGER",
    sub: "Cerveza clara",
    vol: "473 ml"
   }
  },
  agua: {
   kind: "pet",
   name: "Agua purificada",
   vol: "600 ml",
   lane: .077,
   rowPitch: .069,
   liquid: {
    color: 14217471,
    opacity: .18
   },
   cap: 1925045,
   art: {
    bg: "#e9f5fc",
    ink: "#0d4f8b",
    accent: "#7cc4ec",
    title: "AGUA",
    sub: "Purificada",
    vol: "600 ml"
   }
  },
  naranja: {
   kind: "pet",
   name: "Refresco de naranja",
   vol: "600 ml",
   lane: .077,
   rowPitch: .069,
   liquid: {
    color: 15763224,
    opacity: .92
   },
   cap: 15921906,
   art: {
    bg: "#f6a21a",
    ink: "#ffffff",
    accent: "#d9480f",
    title: "NARANJA",
    sub: "Refresco",
    vol: "600 ml"
   }
  },
  te: {
   kind: "pet",
   name: "T\xE9 negro fr\xEDo",
   vol: "600 ml",
   lane: .077,
   rowPitch: .069,
   liquid: {
    color: 7222544,
    opacity: .9
   },
   cap: 2236962,
   art: {
    bg: "#f3ead6",
    ink: "#3e2410",
    accent: "#a5651f",
    title: "T\xC9 NEGRO",
    sub: "Con lim\xF3n",
    vol: "600 ml"
   }
  },
  ambar: {
   kind: "glass",
   name: "Cerveza (botella \xE1mbar)",
   vol: "355 ml",
   lane: .071,
   rowPitch: .064,
   glass: 6173192,
   art: {
    bg: "#f1e8d2",
    ink: "#5a1d0f",
    accent: "#b8322a",
    title: "PILSNER",
    sub: "Cerveza",
    vol: "355 ml"
   }
  },
  verde: {
   kind: "glass",
   name: "Cerveza (botella verde)",
   vol: "355 ml",
   lane: .071,
   rowPitch: .064,
   glass: 1923628,
   art: {
    bg: "#ffffff",
    ink: "#14532d",
    accent: "#c59b2b",
    title: "LAGER",
    sub: "Cerveza clara",
    vol: "355 ml"
   }
  },
  jugo: {
   kind: "carton",
   name: "Jugo de naranja",
   vol: "1 L",
   lane: .105,
   rowPitch: .07,
   art: {
    bg: "#f7b21b",
    ink: "#5a2a00",
    accent: "#e8610f",
    title: "JUGO NARANJA",
    sub: "100% jugo",
    vol: "1 L"
   }
  },
  leche: {
   kind: "carton",
   name: "Leche entera",
   vol: "1 L",
   lane: .105,
   rowPitch: .07,
   art: {
    bg: "#f4f8fc",
    ink: "#0d3f7a",
    accent: "#2c7cd6",
    title: "LECHE ENTERA",
    sub: "Pasteurizada",
    vol: "1 L"
   }
  }
 },
 Sh = [
  ["leche", "mineral", "lima", "cola", "cola"],
  ["jugo", "te", "naranja", "agua", "agua"],
  ["lager", "ambar", "verde", "ambar", "lager"]
 ];

function Ur(i, t = 48) {
 let e = new mr(i.map(([n, s]) => new it(n, s)), t, Math.PI, Math.PI * 2);
 return e.computeVertexNormals(), e
}

function hg(i, t, e) {
 let n = i.attributes.position,
  s = i.attributes.uv;
 for (let r = 0; r < n.count; r++) s.setY(r, (n.getY(r) - t) / (e - t));
 return s.needsUpdate = !0, i
}

function ug(i) {
 return [
  [0, .007],
  [.012, .0055],
  [.022, .0015],
  [.0262, 0],
  [.0305, .0025],
  [.0328, .0085],
  [.033, .013],
  [.033, i - .016],
  [.0322, i - .011],
  [.0292, i - .0055],
  [.0272, i - .0018],
  [.0278, i - 6e-4],
  [.0276, i],
  [.0262, i - 4e-4],
  [.0255, i - .004],
  [.023, i - .0048],
  [0, i - .0045]
 ]
}

function dg() {
 return [
  [0, .004],
  [.012, 5e-4],
  [.024, 0],
  [.031, .004],
  [.0335, .014],
  [.0335, .036],
  [.0312, .041],
  [.0335, .046],
  [.0335, .142],
  [.0315, .15],
  [.0335, .156],
  [.0332, .165],
  [.029, .182],
  [.022, .196],
  [.0158, .206],
  [.0132, .211],
  [.0132, .2135],
  [.0165, .214],
  [.0165, .2165],
  [.0132, .217],
  [.0132, .222],
  [0, .222]
 ]
}

function fg() {
 return [
  [0, .003],
  [.02, .0015],
  [.0285, .0015],
  [.0305, .006],
  [.0305, .125],
  [.0292, .14],
  [.024, .16],
  [.0165, .178],
  [.0135, .192],
  [.013, .214],
  [.0142, .2155],
  [.0142, .2195],
  [.0125, .2205],
  [0, .2205]
 ]
}
var pg = (i, t, e, n) => i.filter(([, s]) => s >= e && s <= n).map(([s, r]) => [s * t, r]),
 ml = new Map;

function Nr(i, t) {
 if (ml.has(i)) return ml.get(i);
 let e = oi[i],
  n = [],
  s;
 if (e.kind === "can") {
  let o = e.tall ? .157 : .122,
   a = hg(Ur(ug(o), 26), 0, o),
   l = Cr(e, {
    can: !0
   }),
   h = new Wt({
    map: l,
    metalness: .82,
    roughness: .26,
    envMapIntensity: 1.2
   });
  n = [{
   geo: a,
   mat: h,
   main: !0
  }];
  let c = new Ot(.01, .0012, .02);
  c.translate(0, o - .0035, .006), n.push({
   geo: c,
   mat: t.canTop
  }), s = {
   r: .033,
   h: o
  }
 } else if (e.kind === "pet") {
  let o = dg(),
   a = Ur(o, 24),
   l = Ur([...pg(o, .955, .004, .178), [0, .178]], 18),
   h = new Je({
    color: e.liquid.color,
    roughness: .15,
    transparent: e.liquid.opacity < 1,
    opacity: e.liquid.opacity,
    envMapIntensity: .8,
    depthWrite: e.liquid.opacity > .5
   }),
   c = new Me(.0148, .0152, .019, 20);
  c.translate(0, .2295, 0);
  let u = new Wt({
    color: e.cap,
    roughness: .45,
    normalMap: t.knurl,
    normalScale: new it(.6, .6)
   }),
   d = new Me(.0339, .0339, .088, 26, 1, !0, Math.PI, Math.PI * 2);
  d.translate(0, .096, 0);
  let f = new Wt({
   map: Cr(e, {
    w: 1024,
    h: 384
   }),
   roughness: .35,
   metalness: .05,
   side: Te
  });
  n = [{
   geo: l,
   mat: h,
   order: 1
  }, {
   geo: d,
   mat: f,
   main: !0
  }, {
   geo: c,
   mat: u
  }, {
   geo: a,
   mat: t.pet,
   order: 4
  }], s = {
   r: .0335,
   h: .239
  }
 } else if (e.kind === "glass") {
  let o = fg(),
   a = Ur(o, 24),
   l = new Je({
    color: e.glass,
    roughness: .04,
    metalness: 0,
    transparent: !0,
    opacity: .86,
    envMapIntensity: 1.6,
    clearcoat: 1,
    clearcoatRoughness: .03
   }),
   h = new Me(.0309, .0309, .075, 14, 1, !0, -1.15, 2.3);
  h.translate(0, .062, 0);
  let c = new Wt({
    map: Cr(e, {
     w: 768,
     h: 512
    }),
    roughness: .5,
    side: Te
   }),
   u = new Me(.0137, .017, .026, 16, 1, !0);
  u.translate(0, .186, 0);
  let d = new Wt({
    color: new Lt(e.art.accent),
    roughness: .4,
    metalness: .2,
    side: Te
   }),
   f = new Me(.015, .016, .007, 14);
  f.translate(0, .224, 0), n = [{
   geo: a,
   mat: l,
   main: !0,
   order: 2
  }, {
   geo: h,
   mat: c
  }, {
   geo: u,
   mat: d
  }, {
   geo: f,
   mat: t.crown
  }], s = {
   r: .0305,
   h: .228
  }
 } else {
  let h = new Ot(.095, .195, .064);
  h.translate(0, .195 / 2, 0);
  let c = dh(e),
   u = b => new Wt({
    map: b,
    roughness: .55,
    metalness: 0
   }),
   d = u(c.side),
   f = u(c.top),
   g = u(c.front),
   x = [d, d, f, f, g, d],
   m = new Me(.012, .013, .012, 16);
  m.translate(.018, .195 + .006, .006);
  let p = new Wt({
   color: new Lt(e.art.accent),
   roughness: .45,
   normalMap: t.knurl
  });
  n = [{
   geo: h,
   mat: x,
   main: !0
  }, {
   geo: m,
   mat: p
  }], s = {
   r: .0475,
   h: .207
  }
 }
 let r = {
  sku: e,
  parts: n,
  size: s
 };
 return ml.set(i, r), r
}

function bh(i, t) {
 let {
  parts: e
 } = Nr(i, t), n = new me;
 for (let s of e) {
  let r = new At(s.geo, s.mat);
  r.castShadow = !0, s.order && (r.renderOrder = s.order + 10), n.add(r)
 }
 return n
}
var Qt = {
  CLOSED: "CLOSED",
  DRAGGING: "DRAGGING",
  AUTO_CLOSING: "AUTO_CLOSING",
  HOLD_OPEN_90: "HOLD_OPEN_90",
  MANUAL_CLOSING: "MANUAL_CLOSING"
 },
 Or = class {
  constructor(t, {
   closeTime: e = le.DEFAULT_CLOSE_TIME
  } = {}) {
   this.door = t, this.index = t.bay.index, this.angle = 0, this.vel = 0, this.target = 0, this.state = Qt.CLOSED, this.closeTime = e, this.locks = 0, this.auto = null, this.listeners = {}
  }
  on(t, e) {
   var n;
   ((n = this.listeners)[t] || (n[t] = [])).push(e)
  }
  emit(t, e) {
   (this.listeners[t] || []).forEach(n => n(e))
  }
  setState(t) {
   if (t !== this.state) {
    let e = this.state;
    this.state = t, this.emit("state", {
     state: t,
     prev: e
    })
   }
  }
  lock() {
   this.locks++
  }
  unlock() {
   this.locks = Math.max(0, this.locks - 1)
  }
  get isLocked() {
   return this.locks > 0
  }
  beginDrag() {
   return this.isLocked ? (this.emit("blocked"), !1) : (this.auto = null, this.setState(this.state === Qt.HOLD_OPEN_90 ? Qt.MANUAL_CLOSING : Qt.DRAGGING), this.target = this.angle, this.vel = 0, !0)
  }
  dragTo(t) {
   let e = Ue.clamp(t, 0, le.HOLD_ANGLE);
   e >= le.HOLD_ANGLE - le.CATCH_TOL && (e = le.HOLD_ANGLE), this.target = e
  }
  endDrag() {
   this.state !== Qt.DRAGGING && this.state !== Qt.MANUAL_CLOSING || (this.angle >= le.HOLD_ANGLE - le.CATCH_TOL || this.target >= le.HOLD_ANGLE ? this.setState(Qt.HOLD_OPEN_90) : this.angle <= le.CLOSE_EPS ? (this.angle = 0, this.vel = 0, this.setState(Qt.CLOSED)) : (this.vel = 0, this.setState(Qt.AUTO_CLOSING)))
  }
  openTo(t, {
   release: e = !0,
   speed: n = 1
  } = {}) {
   if (this.isLocked && t < le.HOLD_ANGLE) {
    this.emit("blocked");
    return
   }
   this.setState(this.state === Qt.HOLD_OPEN_90 && t < le.HOLD_ANGLE ? Qt.MANUAL_CLOSING : Qt.DRAGGING), this.target = Ue.clamp(t, 0, le.HOLD_ANGLE), this.auto = {
    release: e,
    speed: n
   }
  }
  closeNow() {
   if (this.isLocked) {
    this.emit("blocked");
    return
   }
   this.state !== Qt.CLOSED && (this.auto = null, this.vel = 0, this.setState(Qt.AUTO_CLOSING))
  }
  update(t) {
   t = Math.min(t, .05);
   let e = this.angle;
   switch (this.state) {
    case Qt.CLOSED:
     this.angle = 0, this.vel = 0;
     break;
    case Qt.DRAGGING:
    case Qt.MANUAL_CLOSING: {
     let n = this.auto ? 3.2 * this.auto.speed : 16;
     if (this.angle += (this.target - this.angle) * (1 - Math.exp(-t * n)), this.auto && Math.abs(this.target - this.angle) < .15) {
      this.angle = this.target;
      let s = this.auto;
      this.auto = null, s.release && this.endDrag()
     }
     break
    }
    case Qt.HOLD_OPEN_90: {
     this.angle += (le.HOLD_ANGLE - this.angle) * (1 - Math.exp(-t * 9)), Math.abs(le.HOLD_ANGLE - this.angle) < .01 && (this.angle = le.HOLD_ANGLE);
     break
    }
    case Qt.AUTO_CLOSING: {
     let n = 8.5 / Math.max(.6, this.closeTime),
      s = 1 / 240,
      r = t;
     for (; r > 1e-6;) {
      let o = Math.min(s, r);
      r -= o;
      let a = -n * n * this.angle - 2 * n * this.vel;
      if (this.vel += a * o, this.angle += this.vel * o, this.angle <= le.CLOSE_EPS) break
     }
     this.angle <= le.CLOSE_EPS && (this.angle = 0, this.vel = 0, this.setState(Qt.CLOSED), this.emit("seated"));
     break
    }
   }
   this.angle = Ue.clamp(this.angle, 0, le.HOLD_ANGLE), this.state !== Qt.AUTO_CLOSING && (this.vel = (this.angle - e) / Math.max(t, 1e-4)), this.door.pivot.rotation.y = Ue.degToRad(this.angle)
  }
 };
var mg = new Zt().makeScale(0, 0, 0),
 Eh = .5,
 gg = .065,
 Fr = class {
  constructor(t, e, n, s) {
   this.scene = t, this.M = n, this.doors = s, this.records = [], this.instanced = [], this.bySku = new Map, this.held = null, this.listeners = {}, this.maxRows = 6, this.root = new me, this.root.name = "Products", t.add(this.root), this._populate(e)
  }
  on(t, e) {
   var n;
   ((n = this.listeners)[t] || (n[t] = [])).push(e)
  }
  emit(t, e) {
   (this.listeners[t] || []).forEach(n => n(e))
  }
  _populate(t) {
   let e = new Zt;
   for (let n of t) {
    n.group.updateMatrixWorld(!0);
    let s = Object.keys(oi).find(a => oi[a] === n.sku),
     {
      size: r
     } = Nr(s, this.M),
     o = Math.floor((n.depth - .03) / n.sku.rowPitch);
    for (let a = 0; a < n.lanes; a++)
     for (let l = 0; l < o; l++) {
      let h = new Zt().makeTranslation(n.x0 + (a + .5) * n.pitch, 5e-4, -.006 - r.r * (n.sku.kind === "carton" ? .7 : 1) - l * n.sku.rowPitch),
       c = e.multiplyMatrices(n.group.matrixWorld, h).clone(),
       u = {
        skuId: s,
        bay: n.bay,
        level: n.level,
        lane: a,
        row: l,
        world: c,
        out: !1,
        index: -1
       };
      this.bySku.has(s) || this.bySku.set(s, []), this.bySku.get(s).push(u), this.records.push(u)
     }
   }
   for (let [n, s] of this.bySku) {
    s.sort((a, l) => a.row - l.row || a.bay - l.bay || a.level - l.level || a.lane - l.lane), s.forEach((a, l) => {
     a.index = l
    });
    let {
     parts: r
    } = Nr(n, this.M), o = r.map(a => {
     let l = new dr(a.geo, a.mat, s.length);
     return l.instanceMatrix.setUsage(Wc), s.forEach((h, c) => l.setMatrixAt(c, h.world)), l.castShadow = !1, l.receiveShadow = !1, a.order && (l.renderOrder = a.order + 5), l.userData = {
      skuId: n,
      main: !!a.main
     }, l.computeBoundingSphere(), this.root.add(l), this.instanced.push(l), l
    });
    this.bySku.get(n).meshes = o
   }
   this.setMaxRows(this.maxRows)
  }
  setMaxRows(t) {
   this.maxRows = t;
   for (let [, e] of this.bySku) {
    let n = e.filter(s => s.row < t).length;
    e.meshes.forEach(s => {
     s.count = n
    })
   }
  }
  get pickables() {
   return this.instanced.filter(t => t.userData.main)
  }
  recordFromHit(t) {
   let e = this.bySku.get(t.object.userData.skuId),
    n = e && e[t.instanceId];
   if (!n) return null;
   let s = this.records.filter(r => r.bay === n.bay && r.level === n.level && r.lane === n.lane && !r.out && r.row < this.maxRows);
   return s.sort((r, o) => r.row - o.row), s[0] || null
  }
  _setVisible(t, e) {
   this.bySku.get(t.skuId).meshes.forEach(s => {
    s.setMatrixAt(t.index, e ? t.world : mg), s.instanceMatrix.needsUpdate = !0
   })
  }
  canPick(t) {
   let e = this.doors[t.bay];
   return e.angle >= le.PICK_MIN_ANGLE && e.state === "HOLD_OPEN_90"
  }
  extract(t, e) {
   this.held && this.returnHeld(!0);
   let n = bh(t.skuId, this.M),
    s = new R,
    r = new Le,
    o = new R;
   t.world.decompose(s, r, o), n.position.copy(s), n.quaternion.copy(r), this.root.add(n), t.out = !0, this._setVisible(t, !1), this.doors[t.bay].lock();
   let a = Ft[t.bay],
    l = s.clone(),
    h = l.clone().add(new R(0, gg, 0)),
    c = new R(l.x, h.y, .08);
   this.held = {
    rec: t,
    mesh: n,
    bay: a,
    phase: "EXTRACTING",
    path: [l, h, c],
    seg: 0,
    t: 0,
    homeQuat: r.clone(),
    uprightQuat: new Le,
    target: new R(l.x, h.y + .05, Eh),
    spinX: 0,
    spinY: 0
   }, e && this.held.target.copy(this.clampTarget(e)), this.emit("held", this.info())
  }
  clampTarget(t) {
   let e = this.held ? this.held.bay : Ft[0];
   return new R(Ue.clamp(t.x, e.x0 + .06, e.x1 - .08), Ue.clamp(t.y, .3, 1.85), Eh)
  }
  dragTo(t) {
   !this.held || this.held.phase === "RETURNING" || (this.held.target.copy(this.clampTarget(t)), this.held.phase === "INSPECT" && (this.held.phase = "DRAGGING"))
  }
  release() {
   this.held && this.held.phase === "DRAGGING" && (this.held.phase = "INSPECT")
  }
  rotateBy(t, e) {
   this.held && (this.held.spinY += t * .012, this.held.spinX = Ue.clamp(this.held.spinX + e * .008, -1.1, 1.1))
  }
  returnHeld(t = !1) {
   let e = this.held;
   if (!e) return;
   if (t) {
    this._finishReturn();
    return
   }
   let n = e.mesh.position.clone(),
    [s, r, o] = e.path;
   e.path = [n, new R(o.x, o.y, .08), r, s], e.phase = "RETURNING", e.seg = 0, e.t = 0, e.retQuat0 = e.mesh.quaternion.clone(), this.emit("returning", this.info())
  }
  _finishReturn() {
   let t = this.held;
   t && (this.root.remove(t.mesh), t.rec.out = !1, this._setVisible(t.rec, !0), this.doors[t.rec.bay].unlock(), this.held = null, this.emit("returned"))
  }
  resetAll() {
   this.held && this.returnHeld(!0)
  }
  info() {
   if (!this.held) return null;
   let t = oi[this.held.rec.skuId];
   return {
    name: t.name,
    vol: t.vol,
    kind: t.kind,
    bay: this.held.rec.bay,
    phase: this.held.phase
   }
  }
  isHeldObject(t) {
   let e = t;
   for (; e;) {
    if (this.held && e === this.held.mesh) return !0;
    e = e.parent
   }
   return !1
  }
  update(t) {
   let e = this.held;
   if (!e) return;
   let n = e.mesh;
   if (e.phase === "EXTRACTING" || e.phase === "RETURNING") {
    let o = e.path.length - 1,
     a = e.path[e.seg],
     l = e.path[e.seg + 1],
     h = a.distanceTo(l);
    e.t += t * (.55 / Math.max(h, .02)) * 1.6;
    let c = Math.min(1, e.t),
     u = c * c * (3 - 2 * c);
    if (n.position.lerpVectors(a, l, u), e.phase === "RETURNING") {
     let d = (e.seg + u) / o;
     n.quaternion.slerpQuaternions(e.retQuat0, e.homeQuat, Math.min(1, d * 1.6))
    }
    if (c >= 1 && (e.seg++, e.t = 0, e.seg >= o))
     if (e.phase === "EXTRACTING") e.phase = "DRAGGING", this.emit("held", this.info());
     else {
      this._finishReturn();
      return
     } return
   }
   let s = 1 - Math.exp(-t * 14);
   n.position.lerp(e.target, s);
   let r = new Le().setFromEuler(new $e(e.spinX, e.spinY, 0, "YXZ"));
   n.quaternion.slerp(e.homeQuat.clone().multiply(r), 1 - Math.exp(-t * 12))
  }
 };
var Br = class {
 constructor({
  canvas: t,
  camera: e,
  controls: n,
  doors: s,
  doorCtrls: r,
  products: o,
  ui: a
 }) {
  Object.assign(this, {
   canvas: t,
   camera: e,
   controls: n,
   doors: s,
   doorCtrls: r,
   products: o,
   ui: a
  }), this.ray = new Mr, this.ndc = new it, this.active = null, this.lastHover = 0, this.enabled = !0, t.addEventListener("pointerdown", l => this.down(l), {
   capture: !0
  }), t.addEventListener("pointermove", l => this.move(l)), window.addEventListener("pointerup", l => this.up(l)), window.addEventListener("pointercancel", l => this.up(l)), t.addEventListener("dblclick", l => this.dbl(l))
 }
 _setRay(t) {
  let e = this.canvas.getBoundingClientRect();
  this.ndc.set((t.clientX - e.left) / e.width * 2 - 1, -((t.clientY - e.top) / e.height) * 2 + 1), this.ray.setFromCamera(this.ndc, this.camera)
 }
 _hit() {
  let t = [];
  return this.doors.forEach(n => t.push(...n.pickables)), t.push(...this.products.pickables), this.products.held && t.push(this.products.held.mesh), this.ray.intersectObjects(t, !0)[0] || null
 }
 _angleFromRay(t, e) {
  let n = t.door.bay,
   s = this.ray.ray.origin,
   r = this.ray.ray.direction,
   o = (s.x - (n.hingeX ?? n.axisX)) * (n.hand || 1),   // [sitio] eje real; con la mano izquierda, x reflejada
   a = s.z - n.axisZ,
   l = r.x * r.x + r.z * r.z,
   h = 2 * (o * r.x * (n.hand || 1) + a * r.z),
   c = o * o + a * a - e * e,
   u, d = h * h - 4 * l * c;
  if (l < 1e-8) return null;
  if (d >= 0) {
   let x = Math.sqrt(d);
   u = (-h - x) / (2 * l), u < 0 && (u = (-h + x) / (2 * l))
  } else u = -h / (2 * l);
  if (u < 0) return null;
  let f = o + r.x * (n.hand || 1) * u,
   g = a + r.z * u;
  // [sitio] Si el rayo ya no corta el círculo del punto tomado (el puntero salió de la silueta de la hoja), el
  // original se quedaba en el ángulo tangente y, desde el frente, la puerta no llegaba a la retención. Ahora sigue
  // girando en el mismo sentido, en proporción a lo que el puntero se aleja: 90° por cada radio.
  this.miss = d < 0 ? Math.hypot(f, g) / e - 1 : 0;
  return Ue.radToDeg(Math.atan2(g, -f))
 }
 down(t) {
  if (!this.enabled || t.button !== void 0 && t.button > 0) return;
  this._setRay(t);
  let e = this._hit();
  if (!e) return;
  if (this.products.held && this.products.isHeldObject(e.object)) {
   this._capture(t), this.active = {
    type: "inspect",
    x: t.clientX,
    y: t.clientY,
    moved: !1
   };
   return
  }
  let n = e.object.userData.doorIndex;
  if (n !== void 0) {
   let s = this.doorCtrls[n];
   if (!s.beginDrag()) {
    this.ui.toast("Devuelve el producto a la parrilla antes de cerrar la puerta."), this._capture(t), this.active = {
     type: "noop"
    };
    return
   }
   let r = s.door.bay,
    o = Math.max(.12, Math.hypot(e.point.x - (r.hingeX ?? r.axisX), e.point.z - r.axisZ)),
    a = this._angleFromRay(s, o);
   this._capture(t), this.active = {
    type: "door",
    x0: t.clientX,
    y0: t.clientY,
    ctrl: s,
    radius: o,
    offset: a === null ? 0 : s.angle - a
   }, this.ui.focusDoor(n);
   return
  }
  if (e.object.isInstancedMesh) {
   let s = this.products.recordFromHit(e);
   if (!s) return;
   if (!this.products.canPick(s)) {
    this.ui.toast(`Abre la puerta ${s.bay+1} hasta la retenci\xF3n de 90\xB0 para tomar el producto.`), this._capture(t), this.active = {
     type: "noop"
    };
    return
   }
   this._capture(t), this.products.extract(s, this._pointOnInspectPlane()), this.active = {
    type: "product"
   }
  }
 }
 _capture(t) {
  this.controls.enabled = !1, t.stopImmediatePropagation();
  try {
   this.canvas.setPointerCapture(t.pointerId)
  } catch {}
  this.canvas.style.cursor = "grabbing"
 }
 _pointOnInspectPlane() {
  let t = new R;
  return this.ray.ray.intersectPlane(new Ye(new R(0, 0, 1), -.5), t) ? t : null
 }
 move(t) {
  this._setRay(t);
  let e = this.active;
  if (!e) {
   this._hover(t);
   return
  }
  if (e.type === "door") {
   let n = this._angleFromRay(e.ctrl, e.radius);
   if (n !== null) {
    // fuera de la silueta: se parte del último ángulo con corte y se sigue en el sentido en que iba, fijado al salir
    if (this.miss > 0) { if (e.missSign === undefined) e.missSign = Math.sign(n - (e.lastHit ?? n)) || (e.ctrl.angle >= 45 ? 1 : -1); n = (e.lastHit ?? n) + e.missSign * this.miss * 90; }
    else { e.lastHit = n; e.missSign = undefined; }
    // [sitio] Retención al arrastrar: al llegar a 90° la puerta queda enganchada aunque el puntero siga de largo
    // (más allá, el rayo vuelve a cortar la hoja por el otro lado y la cerraba). Se desengancha al regresar el puntero.
    const d0 = Math.hypot(t.clientX - e.x0, t.clientY - e.y0);
    if (e.latch !== undefined) { if (d0 < e.latch - 24) e.latch = undefined; else return; }
    e.ctrl.dragTo(n + e.offset);
    if (e.ctrl.target >= HOLD_CATCH) e.latch = d0;
   }
  } else if (e.type === "product") {
   let n = this._pointOnInspectPlane();
   n && this.products.dragTo(n)
  } else if (e.type === "inspect") {
   let n = t.clientX - e.x,
    s = t.clientY - e.y;
   if (e.x = t.clientX, e.y = t.clientY, Math.abs(n) + Math.abs(s) > 0 && (e.moved = !0), t.shiftKey || this.ui.productMode === "move") {
    let r = this._pointOnInspectPlane();
    r && this.products.dragTo(r)
   } else this.products.rotateBy(n, s)
  }
 }
 up() {
  let t = this.active;
  t && (t.type === "door" && t.ctrl.endDrag(), t.type === "product" && this.products.release(), this.active = null, this.controls.enabled = !0, this.canvas.style.cursor = "")
 }
 dbl(t) {
  this._setRay(t);
  let e = this._hit();
  e && this.products.held && this.products.isHeldObject(e.object) && this.products.returnHeld()
 }
 _hover(t) {
  let e = performance.now();
  if (e - this.lastHover < 60) return;
  this.lastHover = e;
  let n = this._hit(),
   s = "";
  if (n) {
   if (n.object.userData.doorIndex !== void 0) s = "grab";
   else if (this.products.held && this.products.isHeldObject(n.object)) s = "grab";
   else if (n.object.isInstancedMesh) {
    let r = this.products.recordFromHit(n);
    s = r && this.products.canPick(r) ? "grab" : "not-allowed"
   }
  }
  this.canvas.style.cursor = s
 }
};
var zr = class {
 constructor(t, e) {
  this.camera = t, this.controls = e, this.anim = null, e.addEventListener("start", () => {
   this.anim = null
  });
  let n = (Ft[0].x1 + Ft[1].x0) / 2,
   s = Ft[1].axisX;
  this.views = {
   perspective: {
    pos: [2.75, 1.55, 4.35],
    tgt: [.05, .98, 0]
   },
   front: {
    pos: [0, 1.02, 5.3],
    tgt: [0, .98, 0]
   },
   door0: {
    pos: [Ft[0].cx + 1, 1.35, 2.1],
    tgt: [Ft[0].cx, 1.05, 0]
   },
   door1: {
    pos: [Ft[1].cx + 1, 1.35, 2.1],
    tgt: [Ft[1].cx, 1.05, 0]
   },
   door2: {
    pos: [Ft[2].cx + 1, 1.35, 2.1],
    tgt: [Ft[2].cx, 1.05, 0]
   },
   mullion: {
    pos: [n + .42, 1.32, .62],
    tgt: [n, 1.18, 0]
   },
   kwikLevel: {
    pos: [s + .34, 2.24, .52],
    tgt: [s - .02, 2.03, .02]
   },
   kwikTorque: {
    pos: [s + .55, .62, 1.35],
    tgt: [s - .25, .42, .25]
   },
   hold90: {
    pos: [Ft[1].cx + 1.55, 1.55, 2.25],
    tgt: [Ft[1].cx + .2, 1, .25]
   },
   seal: {
    pos: [s + .3, 1.12, .42],
    tgt: [s - .03, 1.02, 0]
   },
   shelves: {
    pos: [Ft[1].cx - .15, 1.28, 1.25],
    tgt: [Ft[1].cx, 1, -.35]
   },
   keyled: {
    pos: [.4, 1.15, 2.6],
    tgt: [0, 1.05, -.3]
   },
   glass: {
    pos: [Ft[0].cx - .25, 1.35, .75],
    tgt: [Ft[0].leafX0 + .03, 1.2, .02]
   }
  }
 }
 go(t, e = 1.15) {
  let n = this.views[t];
  n && (this.anim = {
   p0: this.camera.position.clone(),
   t0: this.controls.target.clone(),
   p1: new R(...n.pos),
   t1: new R(...n.tgt),
   t: 0,
   d: e
  })
 }
 update(t) {
  let e = this.anim;
  if (!e) return;
  e.t += t / e.d;
  let n = Math.min(1, e.t),
   s = n < .5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2;
  this.camera.position.lerpVectors(e.p0, e.p1, s), this.controls.target.lerpVectors(e.t0, e.t1, s), n >= 1 && (this.anim = null)
 }
};

function wh(i) {
 let {
  rig: t,
  doorCtrls: e,
  doors: n,
  frame: s,
  products: r,
  setKeyLED: o
 } = i, a = null, l = () => {
  a && (a.clear(), a = null)
 }, h = d => {
  l(), a = _h(d)
 }, c = e[1];
 return {
  list: [{
   id: "kwikTorque",
   title: "Kwik Torque",
   tag: "Autocierre",
   text: "Al soltar la puerta antes de la retenci\xF3n, regresa sola a 0\xB0: acelera, desacelera antes del contacto y asienta contra el marco. Ajusta la velocidad de cierre para demostrar la regulaci\xF3n.",
   run() {
    r.resetAll(), t.go("kwikTorque"), h([s.parts.bottomHinges[1], s.parts.topHinges[1]]), c.openTo(55, {
     release: !0,
     speed: .9
    })
   }
  }, {
   id: "hold90",
   title: "Apertura a 90\xB0",
   tag: "Retenci\xF3n",
   text: "Al llegar a 90\xB0 la hoja se detiene y permanece abierta sin sostenerla, ideal para surtir. T\xF3mala de nuevo para cerrarla: al salir de la retenci\xF3n vuelve a actuar el autocierre.",
   run() {
    l(), t.go("hold90"), c.openTo(le.HOLD_ANGLE, {
     release: !0,
     speed: .9
    })
   }
  }, {
   id: "kwikLevel",
   title: "Kwik Level",
   tag: "Alineaci\xF3n superior",
   schematic: !0,
   text: "Sistema de alineaci\xF3n en la bisagra superior para nivelar las hojas respecto al marco. La pieza resaltada indica su ubicaci\xF3n; su mecanismo interno no se modela (representaci\xF3n esquem\xE1tica).",
   run() {
    t.go("kwikLevel"), h(s.parts.topHinges)
   }
  }, {
   id: "mullion",
   title: "Mullion Design",
   tag: "Perfiles compartidos",
   text: "Las divisiones verticales son compartidas por dos puertas: un solo marco maestro continuo con menos perfiles entre vanos y mayor superficie de vidrio.",
   run() {
    t.go("mullion"), h(s.parts.mullions)
   }
  }, {
   id: "seal",
   title: "Triple sello",
   tag: "Empaque",
   schematic: !0,
   text: "El empaque perimetral de la hoja asienta contra la cara del marco. Se muestran tres labios de sello; observa c\xF3mo asientan al cerrar. La secci\xF3n es una representaci\xF3n esquem\xE1tica.",
   run() {
    r.resetAll(), t.go("seal"), h(n[1].gaskets), c.openTo(30, {
     release: !0,
     speed: 1.2
    })
   }
  }, {
   id: "keyled",
   title: "KeyLED",
   tag: "Iluminaci\xF3n",
   text: "Iluminaci\xF3n LED integrada en los perfiles verticales, del lado interior del exhibidor. Enciende y apaga para comparar la presentaci\xF3n del producto.",
   run() {
    l(), t.go("keyled"), o("toggle")
   }
  }, {
   id: "shelves",
   title: "Parrillas",
   tag: "Exhibici\xF3n",
   text: "Parrillas con base acanalada, gu\xEDas de alambre y frente transparente, preparadas para flujo por gravedad. Con la puerta retenida a 90\xB0, toma un producto, arr\xE1stralo, g\xEDralo y devu\xE9lvelo.",
   run() {
    t.go("shelves"), h([]), c.openTo(le.HOLD_ANGLE, {
     release: !0,
     speed: 1
    })
   }
  }],
  clear: l,
  tick(d) {
   a && a.tick(d)
  }
 }
}

// ---------- lo que usa el visor del sitio ----------
export {
  nh as setTextureAnisotropy, Ne as DIM, Ft as BAYS, le as HOLD, Dr as MODELS, gh as createMaterials, xh as buildFrame, yh as buildDoor,
  Mh as buildShelves, oi as SKUS, Sh as PLANOGRAM, Fr as Products, Or as DoorController, Qt as DoorState, Br as Interaction, zr as CameraViews,
  wh as features, ph as SHELF_LEVELS,
};

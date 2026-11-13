// Puerta abatible. Geometría migrada del modelo base aprobado (01_MODELOS_ORIGINALES/ABATIBLE_MODELO_BASE.html),
// con tres cambios documentados en docs/DIFERENCIAS_CON_ORIGINALES.md:
//   1. Chapa nueva según ABATIBLE_CHAPA_REAL_REFERENCIA_OBLIGATORIA.png.
//   2. Bumper único: inox diamante. Acabados solo del registro compartido.
//   3. El pivote de la hoja pasa al eje del barril de las bisagras (antes giraba 27.5 mm por delante de él).
import * as THREE from 'three';
import { rbox, scaleUV, swapUV } from '../core/stage.js';
import { Hinge } from '../core/hinge.js';
import { createBackdrop } from '../core/backdrop.js';

// ---------- medidas (m), iguales al modelo base ----------
const OW = 0.90, OH = 1.95;              // paso libre
const FW = 0.12, FD = 0.06;              // marco: ancho de cara y fondo
const W = 1.00, H = 2.00, T = 0.10;      // hoja
const YB = 0.012, YT = YB + H;
const ZB = 0.068, ZF = ZB + T;           // cara posterior / frontal de la hoja
const PW = 0.045;                        // perfil perimetral de aluminio
const PX = -W / 2 - 0.012;               // eje de bisagra en x
const BR = 0.0135;                       // radio del barril
const BZ0 = FD + 0.011, BZ1 = ZF - 0.018;
const PZ = BZ1 - BR + 0.004;             // eje de bisagra en z = centro del barril
const BUMPER_TOP = 0.92;                 // altura del bumper del modelo base
export const ABATIBLE = { W, H, T, PX, PZ, ZF, ZB, OW, OH, FD, MAX_OPEN: 95 };

// chapa: proporciones medidas sobre la fotografía de referencia
const LK = { W: 0.084, H: 0.172, D: 0.050, x: W / 2 - PW - 0.020 - 0.042, y0: 1.012 };

export function createAbatible(stage, reg, { logoUrl } = {}) {
  const R = reg.materials;
  const root = new THREE.Group(); root.name = 'Abatible';
  const pickables = [];
  const add = (parent, geo, mat, x = 0, y = 0, z = 0, { shadow = true } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
  };

  // ---------- muro, piso e interior ("blanco es afuera, azul marino es adentro") ----------
  const backdrop = createBackdrop(stage, { opening: { left: -OW / 2, right: OW / 2, top: OH } });
  root.add(backdrop.group);

  // ---------- marco ----------
  const frame = new THREE.Group(); frame.name = 'Marco'; root.add(frame);
  const frameMeshes = [];
  {
    const fx = OW / 2 + FW / 2;
    frameMeshes.push(add(frame, rbox(FW, OH + FW, FD, 0.006), R.hygienicWhite, -fx, (OH + FW) / 2, FD / 2));
    frameMeshes.push(add(frame, rbox(FW, OH + FW, FD, 0.006), R.hygienicWhite, fx, (OH + FW) / 2, FD / 2));
    frameMeshes.push(add(frame, rbox(OW + 2 * FW, FW, FD, 0.006), R.hygienicWhite, 0, OH + FW / 2, FD / 2));
    frameMeshes.push(add(frame, new THREE.BoxGeometry(0.012, OH, 0.16), R.hygienicWhite, -OW / 2 + 0.006, OH / 2, -0.08));
    frameMeshes.push(add(frame, new THREE.BoxGeometry(0.012, OH, 0.16), R.hygienicWhite, OW / 2 - 0.006, OH / 2, -0.08));
    frameMeshes.push(add(frame, new THREE.BoxGeometry(OW, 0.012, 0.16), R.hygienicWhite, 0, OH - 0.006, -0.08));
    // tapones blancos Ø22 sobre la franja visible del marco
    const plug = new THREE.SphereGeometry(0.013, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const vx = (W / 2 + OW / 2 + FW) / 2;
    const plugMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.45 });
    for (const s of [-1, 1]) for (const y of [0.32, 1.02, 1.72]) { const p = add(frame, plug, plugMat, s * vx, y, FD, { shadow: false }); p.rotation.x = Math.PI / 2; p.scale.set(1, 0.45, 1); }
    for (const x of [-0.25, 0.25]) { const p = add(frame, plug, plugMat, x, YT + (OH + FW - YT) / 2 + 0.002, FD, { shadow: false }); p.rotation.x = Math.PI / 2; p.scale.set(1, 0.45, 1); }
    // contrapieza del cerrojo: en el canto del marco, queda cubierta por la hoja cerrada (como en la foto)
    add(frame, rbox(0.016, 0.078, 0.046, 0.005), R.plasticGray, OW / 2 - 0.008 - 0.012, LK.y0 + LK.H - 0.045, 0.030);
    add(frame, rbox(0.006, 0.040, 0.030, 0.002), R.steelHardware, OW / 2 - 0.008 - 0.021, LK.y0 + LK.H - 0.045, 0.030);
  }

  // ---------- hoja (hija del pivote, que está sobre el eje del barril) ----------
  const pivot = new THREE.Group(); pivot.name = 'PivoteHoja'; pivot.position.set(PX, 0, PZ); root.add(pivot);
  const leaf = new THREE.Group(); leaf.name = 'Hoja'; leaf.position.set(-PX, 0, -PZ); pivot.add(leaf);
  const hinge = new Hinge(pivot, { dir: 1, min: 0, max: ABATIBLE.MAX_OPEN, mode: 'free' });
  const grab = (m) => { m.userData.hinge = hinge; pickables.push(m); return m; };

  grab(add(leaf, new THREE.BoxGeometry(W - 0.006, H - 0.006, T - 0.004), R.aluminum, 0, YB + H / 2, ZB + T / 2));
  const faceGeo = swapUV(new THREE.BoxGeometry(W - 2 * PW + 0.004, H - 2 * PW + 0.004, 0.002));   // veta vertical
  const face = grab(add(leaf, faceGeo, R.hygienicWhite, 0, YB + H / 2, ZF - 0.001));
  const back = add(leaf, swapUV(new THREE.BoxGeometry(W - 0.03, H - 0.03, 0.002)), R.hygienicWhite, 0, YB + H / 2, ZB - 0.0005);
  {
    // perfil perimetral de aluminio: labio frontal a inglete + cantos
    const L = -W / 2, Rr = W / 2, B = YB, Tp = YT;
    for (const pts of [
      [[L, Tp], [L + PW, Tp - PW], [Rr - PW, Tp - PW], [Rr, Tp]], [[L, B], [Rr, B], [Rr - PW, B + PW], [L + PW, B + PW]],
      [[L, B], [L + PW, B + PW], [L + PW, Tp - PW], [L, Tp]], [[Rr, B], [Rr, Tp], [Rr - PW, Tp - PW], [Rr - PW, B + PW]],
    ]) {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0016, bevelSegments: 2 });
      grab(add(leaf, g, R.aluminum, 0, 0, ZF + 0.0005));
    }
    add(leaf, new THREE.BoxGeometry(0.004, H, T + 0.006), R.aluminum, L - 0.0015, YB + H / 2, ZB + T / 2 + 0.003);
    add(leaf, new THREE.BoxGeometry(0.004, H, T + 0.006), R.aluminum, Rr + 0.0015, YB + H / 2, ZB + T / 2 + 0.003);
    add(leaf, new THREE.BoxGeometry(W + 0.006, 0.004, T + 0.006), R.aluminum, 0, YT + 0.0015, ZB + T / 2 + 0.003);
    add(leaf, new THREE.BoxGeometry(W + 0.006, 0.004, T + 0.006), R.aluminum, 0, YB - 0.0015, ZB + T / 2 + 0.003);
    // empaque perimetral negro en la cara posterior
    const gz = ZB - 0.006, gw = 0.024, gd = 0.012;
    add(leaf, rbox(gw, H - 0.06, gd, 0.005), R.rubber, L + 0.035, YB + H / 2, gz);
    add(leaf, rbox(gw, H - 0.06, gd, 0.005), R.rubber, Rr - 0.035, YB + H / 2, gz);
    add(leaf, rbox(W - 0.06, gw, gd, 0.005), R.rubber, 0, YT - 0.035, gz);
    add(leaf, rbox(W - 0.06, gw, gd, 0.005), R.rubber, 0, YB + 0.035, gz);
  }

  // ---------- bumper: inox diamante (único) con remate de aluminio ----------
  {
    const y0 = YB + PW - 0.002, w = W - 2 * PW + 0.002, h = BUMPER_TOP - y0, tile = 0.12;
    const plate = scaleUV(new THREE.BoxGeometry(w, h, 0.003), w / tile, h / tile);
    grab(add(leaf, plate, R.stainlessDiamond, 0, y0 + h / 2, ZF + 0.0018));
    add(leaf, rbox(w, 0.034, 0.011, 0.003), R.aluminum, 0, BUMPER_TOP, ZF + 0.0055);
    for (const x of [-w / 2 + 0.04, -w / 6, w / 6, w / 2 - 0.04]) add(leaf, new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 12).rotateX(Math.PI / 2), R.steelHardware, x, BUMPER_TOP, ZF + 0.0115, { shadow: false });
  }

  // ---------- logo ST ----------
  if (logoUrl) new THREE.TextureLoader().load(logoUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const w = 0.12, h = w * tex.image.height / tex.image.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }));
    m.position.set(W / 2 - PW - 0.11, YT - PW - 0.075, ZF + 0.0006); leaf.add(m);
  });

  // ---------- chapa exterior (según la fotografía de referencia) ----------
  const lock = new THREE.Group(); lock.name = 'Chapa'; lock.position.set(LK.x, LK.y0, ZF); leaf.add(lock);
  {
    const { W: w, H: h, D: d } = LK;
    // cuerpo gris: perfil lateral con la parte alta inclinada hacia la hoja, extruido a lo ancho con cantos redondeados
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(-(d - 0.007), 0); s.quadraticCurveTo(-d, 0, -d, 0.007);
    s.lineTo(-d, h - 0.036); s.quadraticCurveTo(-d, h - 0.026, -d + 0.006, h - 0.019);
    s.lineTo(-d * 0.52, h - 0.003); s.quadraticCurveTo(-d * 0.44, h, -d * 0.34, h); s.lineTo(0, h); s.closePath();
    const bev = 0.010;
    const body = new THREE.ExtrudeGeometry(s, { depth: w - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: 0.006, bevelOffset: -0.006, bevelSegments: 5, curveSegments: 10 });
    body.rotateY(Math.PI / 2); body.translate(-w / 2 + bev, 0, 0);
    grab(add(lock, body, R.plasticGray));
    // cilindro de llave (perfil europeo), arriba y hacia la izquierda
    const cx = -w / 2 + 0.32 * w, cy = h * 0.71, cr = 0.0082, sw = 0.0042;
    const k = new THREE.Shape();
    const a = Math.asin(sw / cr);
    k.absarc(cx, cy, cr, -Math.PI / 2 + a, -Math.PI / 2 - a + Math.PI * 2, false);
    k.lineTo(cx - sw, cy - 0.019); k.absarc(cx, cy - 0.019, sw, Math.PI, Math.PI * 2, false); k.closePath();
    add(lock, new THREE.ExtrudeGeometry(k, { depth: 0.0022, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 2, curveSegments: 20 }), R.steelHardware, 0, 0, d - 0.0006, { shadow: false });
    add(lock, new THREE.CylinderGeometry(0.0052, 0.0052, 0.0012, 24).rotateX(Math.PI / 2), R.steelHardware, cx, cy, d + 0.0032, { shadow: false });
    add(lock, new THREE.BoxGeometry(0.0016, 0.0072, 0.0008), R.rubber, cx, cy, d + 0.0040, { shadow: false });
    // palanca negra: tira plana sobre la mitad izquierda del cuerpo, baja y termina en la jaladera
    const lever = new THREE.Group(); lever.name = 'Palanca'; lock.add(lever);
    const sx = -w / 2 + 0.06 * w + 0.022, sTop = h * 0.57, sBot = -0.016;
    grab(add(lever, rbox(0.044, sTop - sBot, 0.013, 0.0035), R.plasticBlack, sx, (sTop + sBot) / 2, d - 0.0025));
    add(lever, rbox(0.046, 0.007, 0.006, 0.002), R.plasticBlack, sx, sTop - 0.0035, d + 0.0030);
    // jaladera: lóbulo grande a la izquierda que se afina hacia la derecha
    const c1 = [-0.0205, -0.020], r1 = 0.0250, c2 = [0.0215, -0.034], r2 = 0.0110;
    const ang = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]), dd = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]), b = Math.acos((r1 - r2) / dd);
    const p = new THREE.Shape();
    p.absarc(c1[0], c1[1], r1, ang + b, ang - b + Math.PI * 2, false);
    p.absarc(c2[0], c2[1], r2, ang - b, ang + b, false); p.closePath();
    const paddle = new THREE.ExtrudeGeometry(p, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.005, bevelOffset: -0.005, bevelSegments: 5, curveSegments: 24 });
    const pm = grab(add(lever, paddle, R.plasticBlack, 0, 0, 0.010)); pm.rotation.x = 0.10;
  }

  // ---------- bisagras de leva (geometría aprobada del modelo base) ----------
  const screw = () => new THREE.CylinderGeometry(0.0052, 0.0052, 0.0024, 16).rotateX(Math.PI / 2);
  const block = (pts) => new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))), { depth: BZ1 - BZ0 - 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3, curveSegments: 8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5f6468, roughness: 0.6 });
  const hingeYs = [0.30, 1.74];
  for (const hy of hingeYs) {
    const fixed = new THREE.Group(); fixed.position.set(PX, hy, 0); frame.add(fixed);
    const moving = new THREE.Group(); moving.position.set(PX, hy, 0); leaf.add(moving);
    const pu = -0.030;
    add(fixed, rbox(0.068, 0.244, 0.010, 0.010), R.plasticGray, pu, 0, FD + 0.005);
    add(fixed, rbox(0.060, 0.236, 0.003, 0.008), dark, pu, 0, FD + 0.0095, { shadow: false });
    for (const du of [-0.020, 0.010]) for (const dv of [-0.108, 0.104]) {
      add(fixed, new THREE.CylinderGeometry(0.0068, 0.0068, 0.0012, 18).rotateX(Math.PI / 2), R.rubber, pu + du, dv, FD + 0.0112, { shadow: false });
      add(fixed, screw(), R.steelHardware, pu + du, dv, FD + 0.0125, { shadow: false });
      add(fixed, new THREE.BoxGeometry(0.007, 0.0012, 0.0008), R.rubber, pu + du, dv, FD + 0.0139, { shadow: false });
    }
    add(fixed, block([[-0.056, -0.080], [-0.006, -0.080], [-0.006, -0.026], [-0.056, -0.046]]), R.plasticGray, 0, 0, BZ0 + 0.003);
    add(moving, block([[-0.056, -0.042], [-0.006, -0.022], [-0.006, 0.074], [-0.056, 0.074]]), R.plasticGray, 0, 0, BZ0 + 0.003);
    const step = add(fixed, new THREE.BoxGeometry(0.020, 0.004, BZ1 - BZ0), dark, -0.044, -0.0425, (BZ0 + BZ1) / 2, { shadow: false }); step.rotation.z = Math.atan2(0.020, 0.050);
    // barril sobre el eje de giro: mitad inferior fija, mitad superior con la hoja (concéntricas en todo el recorrido)
    add(fixed, new THREE.CylinderGeometry(BR, BR, 0.074, 32), R.plasticGray, 0, -0.062, PZ);
    add(moving, new THREE.CylinderGeometry(BR, BR, 0.108, 32), R.plasticGray, 0, 0.040, PZ);
    const cap1 = add(moving, new THREE.SphereGeometry(BR, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), R.plasticGray, 0, 0.094, PZ); cap1.scale.y = 0.4;
    const cap2 = add(fixed, new THREE.SphereGeometry(BR, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), R.plasticGray, 0, -0.099, PZ); cap2.scale.y = 0.4;
    add(fixed, new THREE.CylinderGeometry(BR - 0.001, BR - 0.001, 0.003, 32), dark, 0, -0.0245, PZ, { shadow: false });
    add(moving, rbox(0.016, 0.080, 0.020, 0.004), R.plasticGray, 0.009, 0.026, PZ - 0.006);
  }

  // ---------- acabados: solo los del registro; el marco acompaña al inoxidable como en las fotos ----------
  let finish = 'hygienicWhite';
  function setFinish(name) {
    if (!reg.finishFor('abatible').includes(name)) throw new Error(`Acabado no disponible en abatible: ${name}`);
    finish = name; face.material = R[name]; back.material = R[name];
    const fm = name === 'stainless' ? R.stainless : R.hygienicWhite;
    frameMeshes.forEach((m) => { m.material = fm; });
  }
  setFinish(finish);

  stage.onFrame.add((dt) => hinge.update(dt));

  stage.scene.add(root);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, pivot, leaf, hinge, pickables: () => pickables,
    get finish() { return finish; }, setFinish,
    setInside: backdrop.setInside,   // el muro pasa de blanco a azul marino
    // anclas para los puntos de pieza (numero = pieza del catálogo)
    anchors: [
      { numero: '30', parent: frame, position: V(PX - 0.03, hingeYs[1], FD + 0.07) },
      { numero: '27', parent: leaf, position: V(LK.x, LK.y0 + LK.H * 0.5, ZF + LK.D) },
      { numero: '11', parent: leaf, position: V(W / 2 - 0.035, 1.55, ZB - 0.012) },
      { numero: '09', parent: frame, position: V(-(OW / 2 + FW - 0.02), 1.25, FD) },
      { numero: '25', parent: frame, position: V((W / 2 + OW / 2 + FW) / 2, 1.72, FD + 0.006) },
    ],
    views: {
      general: (st) => { const d = st.fitDistance(1.6, 2.2, 1.1); return { pos: [d * 0.42, 1.18, d * 0.91], tgt: [0.02, 1.02, 0.1] }; },
      frontal: (st) => { const d = st.fitDistance(1.55, 2.35); return { pos: [0, 1.05, d], tgt: [0, 1.03, 0.1] }; },
      abierta: (st) => { const d = st.fitDistance(2.3, 2.3, 1.1); return { pos: [d * 0.5, 1.25, d * 0.87], tgt: [0.1, 1.02, 0.35] }; },
      interior: (st) => { const d = st.fitDistance(2.2, 2.3, 1.1); return { pos: [d * 0.64, 1.3, d * 0.77], tgt: [0.05, 1.02, 0.4] }; },
      bisagra: { pos: [-1.02, 1.9, 0.5], tgt: [PX, 1.73, 0.12] },
      empaque: { pos: [1.75, 1.5, 0.95], tgt: [0.15, 1.2, 0.5] },
      chapa: { pos: [LK.x + 0.26, 1.13, 0.86], tgt: [LK.x - 0.01, 1.03, ZF + 0.02] },
      bumper: { pos: [0.72, 0.62, 1.42], tgt: [0.02, 0.5, 0.17] },
    },
  };
}

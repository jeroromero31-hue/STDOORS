// Puerta abatible. Geometría migrada del modelo base aprobado (01_MODELOS_ORIGINALES/ABATIBLE_MODELO_BASE.html),
// con tres cambios documentados en docs/DIFERENCIAS_CON_ORIGINALES.md:
//   1. Chapa nueva según ABATIBLE_CHAPA_REAL_REFERENCIA_OBLIGATORIA.png.
//   2. Bumper único: inox diamante. Acabados solo del registro compartido.
//   3. Bisagras como la foto del componente (ABATIBLE_30, bisagra reversible): placa en el marco, placa en la hoja,
//      cuerpo en "C" con brazo arriba y abajo, perno visible, barril y collarín. La hoja gira sobre el eje del barril.
import * as THREE from 'three';
import { frameBox } from '../core/cameraRig.js';
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
// bisagra reversible (proporciones medidas sobre la foto ABATIBLE_30): el barril va sobre la placa de la hoja y su eje es el giro
const HP = { w: 0.048, h: 0.170, t: 0.008, r: 0.009 };   // placas
const BR = 0.0195;                       // radio del barril
const PX = -W / 2 + 0.0055;              // eje de bisagra en x: sobre el borde de la placa de la hoja
const LIP = 0.0085;                      // fondo del labio de aluminio de la hoja: la placa de la hoja va encima
const PZ = ZF + LIP + HP.t + BR;         // eje de bisagra en z: el barril apoya en la placa
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
    // manguitos roscados para marco (pieza 21, como la foto): cabeza plana en "D" sobre la cara del marco y el cuerpo
    // metido en el marco (se ve en «Rayos X»)
    const sleeveHead = (() => {
      const r = 0.0115, cut = 0.0082, a = Math.acos(cut / r), sh = new THREE.Shape();
      sh.absarc(0, 0, r, a, Math.PI * 2 - a, false); sh.lineTo(cut, r * Math.sin(a)); sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: 0.0016, bevelEnabled: true, bevelThickness: 0.0011, bevelSize: 0.0011, bevelSegments: 3, curveSegments: 28 });
    })();
    const sleeveBody = new THREE.CylinderGeometry(0.0062, 0.0062, 0.034, 20).rotateX(Math.PI / 2).translate(0, 0, -0.017);
    const vx = (W / 2 + OW / 2 + FW) / 2;
    const plugMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.42 });
    const sleeve = (x, y, rot) => {
      const g = new THREE.Group(); g.position.set(x, y, FD); g.rotation.z = rot; g.name = 'ManguitoRoscado'; frame.add(g);
      add(g, sleeveHead, plugMat, 0, 0, 0.0011, { shadow: false }); add(g, sleeveBody, plugMat, 0, 0, 0, { shadow: false });
    };
    for (const s of [-1, 1]) for (const y of [0.32, 1.02, 1.72]) sleeve(s * vx, y, s < 0 ? 0 : Math.PI);   // lo plano hacia el hueco
    for (const x of [-0.25, 0.25]) sleeve(x, YT + (OH + FW - YT) / 2 + 0.002, -Math.PI / 2);
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

  // ---------- bisagras reversibles, como la foto del componente (pieza 30) ----------
  // Fijo (en el marco): placa, cuerpo en "C" (columna + brazo superior + brazo inferior), perno y collarín.
  // Móvil (en la hoja): placa y barril. El barril y el collarín son concéntricos con el eje en todo el recorrido.
  // Cada pieza guarda hacia dónde se separa en el despiece (solo la bisagra de arriba, la que se ve de cerca).
  const plate = () => {
    const { w, h, r } = HP, s0 = new THREE.Shape();
    s0.moveTo(-w / 2 + r, -h / 2); s0.lineTo(w / 2 - r, -h / 2); s0.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0);
    s0.lineTo(w / 2, h / 2 - r); s0.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s0.lineTo(-w / 2 + r, h / 2);
    s0.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s0.lineTo(-w / 2, -h / 2 + r); s0.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5);
    return new THREE.ExtrudeGeometry(s0, { depth: HP.t - 0.003, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 3, curveSegments: 10 }).translate(0, 0, 0.0015);
  };
  // Las dos placas quedan en un mismo plano, como en la foto: la del marco va sobre un suplemento que la sube hasta el
  // frente de la hoja (la hoja está 108 mm por delante de la cara del marco).
  const XL = -0.531, ZP = ZF + LIP + HP.t, RA = BR - 0.001, XC = PX - 0.0055;   // XC: hasta aquí el brazo baja a la placa
  const arm = (hgt) => {
    const sh = new THREE.Shape(), zc = PZ - Math.sqrt(RA * RA - (XC - PX) ** 2), a0 = Math.atan2(zc - PZ, XC - PX);
    sh.moveTo(XL, ZP); sh.lineTo(XC, ZP); sh.lineTo(XC, zc);
    sh.absarc(PX, PZ, RA, a0, Math.PI / 2, false); sh.lineTo(XL, PZ + RA); sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: hgt - 0.003, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 3, curveSegments: 24 })
      .rotateX(Math.PI / 2).translate(0, -0.0015, 0);          // planta (x, z) extruida hacia abajo
  };
  const hingeYs = [0.30, 1.74];
  const hingeParts = [];
  const hingeMat = R.plasticBlack;                          // Fase 10H: negra, como el cerrojo (indicación de ST)
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x55595d, roughness: 0.7 });
  // despiece en el plano de la vista «bisagra»: d = a la derecha en pantalla, u = arriba, c = hacia la cámara
  const SR = new THREE.Vector3(0.79, 0, 0.61), SC = new THREE.Vector3(-0.6, 0.2, 0.78);
  const ex = (d, u, c) => { const v = SR.clone().multiplyScalar(d).addScaledVector(SC, c); v.y += u; return [v.x, v.y, v.z]; };
  hingeYs.forEach((hy, k) => {
    const fixed = new THREE.Group(); fixed.position.set(0, hy, 0); fixed.name = 'BisagraFija'; frame.add(fixed);
    const moving = new THREE.Group(); moving.position.set(0, hy, 0); moving.name = 'BisagraMovil'; leaf.add(moving);
    const part = (m, dx, dy, dz) => { if (k === 1) hingeParts.push({ m, home: m.position.clone(), dir: new THREE.Vector3(dx, dy, dz) }); return m; };
    // placas: la del marco sobre su cara, la de la hoja sobre la cara frontal (pegada al canto)
    // suplemento: del color del marco, para que se lea como parte del marco y la bisagra conserve su tamaño de pieza
    frameMeshes.push(add(fixed, rbox(HP.w + 0.006, HP.h + 0.006, ZF + LIP - FD, 0.006), R.hygienicWhite, -0.527, 0, (FD + ZF + LIP) / 2));
    part(add(fixed, plate(), hingeMat, -0.527, 0, ZF + LIP), ...ex(-0.05, 0, 0));
    part(add(moving, plate(), hingeMat, -W / 2 + 0.0255, 0, ZF + LIP), ...ex(0.075, 0, 0));
    // cuerpo en "C": brazo superior grueso, brazo inferior delgado y la columna entre ambos
    part(add(fixed, arm(0.032), hingeMat, 0, 0.066, 0), ...ex(0, 0.055, 0.03));
    part(add(fixed, arm(0.016), hingeMat, 0, -0.050, 0), ...ex(0, -0.06, 0.03));
    part(add(fixed, rbox(0.016, 0.084, PZ + RA - ZP - 0.003, 0.003), hingeMat, XL + 0.008, -0.008, (ZP + PZ + RA - 0.003) / 2), ...ex(-0.028, 0, 0.03));
    // perno de acero: se ve entre el brazo superior y el barril
    part(add(fixed, new THREE.CylinderGeometry(0.0042, 0.0042, 0.106, 20), R.steelHardware, PX, -0.008, PZ), ...ex(0.035, 0.15, 0.05));
    // barril (con la hoja) y collarín (fijo), concéntricos con el eje
    const barrel = add(moving, new THREE.CylinderGeometry(BR, BR, 0.061, 40), hingeMat, PX, -0.0025, PZ); barrel.name = 'BarrilBisagra';
    part(barrel, ...ex(0.035, 0.01, 0.06));
    part(add(fixed, new THREE.CylinderGeometry(BR - 0.0012, BR - 0.0012, 0.0165, 40), hingeMat, PX, -0.0415, PZ), ...ex(0.035, -0.035, 0.06));
    // filo oscuro entre barril y collarín (como en la foto): viaja con el collarín en el despiece
    part(add(fixed, new THREE.CylinderGeometry(BR - 0.0006, BR - 0.0006, 0.0008, 40), seamMat, PX, -0.0332, PZ, { shadow: false }), ...ex(0.035, -0.035, 0.06));
  });

  // despiece de la bisagra de arriba: 0 = armada, 1 = separada (las piezas salen hacia la cámara, con un pequeño retraso entre ellas)
  let exT = 0, exGoal = 0;
  const reducedEx = matchMedia('(prefers-reduced-motion: reduce)');
  stage.onFrame.add((dt) => {
    if (exT === exGoal) return;
    exT = reducedEx.matches ? exGoal : exT + Math.sign(exGoal - exT) * Math.min(Math.abs(exGoal - exT), dt / 1.1);
    hingeParts.forEach(({ m, home, dir }, i) => {
      const t = Math.min(1, Math.max(0, exT * 1.35 - i * 0.05)), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      m.position.copy(home).addScaledVector(dir, e);
    });
    if (stage.invalidate) stage.invalidate(2);
  });
  const explode = (on) => { exGoal = on ? 1 : 0; if (stage.invalidate) stage.invalidate(2); };

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
    root, pivot, leaf, hinge, pickables: () => pickables, explode,
    thermal: { wallZ: 0, floorY: 0, openings: () => [{ x0: -OW / 2, x1: OW / 2, top: OH, amount: Math.min(1, Math.abs(hinge.angle) / 80) }] },
    get finish() { return finish; }, setFinish,
    setInside: backdrop.setInside,   // el muro pasa de blanco a azul marino
    // anclas para los puntos de pieza (numero = pieza del catálogo)
    anchors: [
      { numero: '30', parent: frame, position: V(PX - 0.012, hingeYs[1] + 0.05, PZ + RA) },
      { numero: '27', parent: leaf, position: V(LK.x, LK.y0 + LK.H * 0.5, ZF + LK.D) },
      { numero: '11', parent: leaf, position: V(W / 2 - 0.035, 1.55, ZB - 0.012) },
      { numero: '09', parent: frame, position: V(-(OW / 2 + FW - 0.02), 1.25, FD) },
      { numero: '21', parent: frame, position: V((W / 2 + OW / 2 + FW) / 2, 1.72, FD + 0.006) },
    ],
    views: {
      general: (st) => { const d = st.fitDistance(1.6, 2.2, 1.1); return { pos: [d * 0.42, 1.18, d * 0.91], tgt: [0.02, 1.02, 0.1] }; },
      frontal: (st) => { const d = st.fitDistance(1.55, 2.35); return { pos: [0, 1.05, d], tgt: [0, 1.03, 0.1] }; },
      abierta: (st) => { const d = st.fitDistance(2.3, 2.3, 1.1); return { pos: [d * 0.5, 1.25, d * 0.87], tgt: [0.1, 1.02, 0.35] }; },
      interior: (st) => { const d = st.fitDistance(2.2, 2.3, 1.1); return { pos: [d * 0.64, 1.3, d * 0.77], tgt: [0.05, 1.02, 0.4] }; },
      bisagra: { pos: [-0.86, 1.86, 0.62], tgt: [PX - 0.01, 1.735, 0.15] },
      despiece: { pos: [-1.06, 1.93, 0.84], tgt: [PX + 0.01, 1.75, 0.19] },     // la bisagra separada completa
      empaque: { pos: [1.75, 1.5, 0.95], tgt: [0.15, 1.2, 0.5] },
      chapa: { pos: [LK.x + 0.26, 1.13, 0.86], tgt: [LK.x - 0.01, 1.03, ZF + 0.02] },
      bumper: { pos: [0.72, 0.62, 1.42], tgt: [0.02, 0.5, 0.17] },
      frio: (st) => frameBox(st, [-1.0, 0, -0.2, 1.6, 2.3, 2.2], 0.32, 0.3),            // hueco, hoja abierta y el piso de enfrente
    },
  };
}

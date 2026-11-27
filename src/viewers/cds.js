// Conjunto Reach-In CDS Legacy: marco maestro con mullions, tres puertas independientes, parrillas y productos.
// El núcleo (geometría, autocierre, retención a 90°, productos) es el del modelo aprobado: ./cds/legacy.js.
// Aquí solo se monta sobre el escenario común del sitio: muro, piso, luz, cámara y controles de la página.
import * as THREE from 'three';
import {
  DIM, BAYS, HOLD, MODELS, createMaterials, buildFrame, buildDoor, buildShelves, SKUS, PLANOGRAM,
  Products, DoorController, DoorState, Interaction, setTextureAnisotropy,
} from './cds/legacy.js';
import { createBackdrop } from '../core/backdrop.js';
import { frameBox } from '../core/cameraRig.js';
import { toast } from '../ui/site.js';

const ROWS = { alta: 6, media: 3, baja: 2 };            // filas de producto por carril según la calidad
const W = DIM.TOTAL_W, H = DIM.TOTAL_H;
// La caja cerrada incluye cabezal y jaladeras (medidos: ±1.279 m de ancho, 0.093 m al frente) y el fondo del gabinete,
// que se ve por el vidrio: en pantallas angostas la esquina trasera quedaba fuera del cuadro.
const BOX = { closed: [-W / 2 - 0.012, 0, -DIM.CAB_DEPTH, W / 2 + 0.012, H, 0.1], open: [-W / 2, 0, -0.12, W / 2, H, 0.85] };

export function createCDS(stage) {
  setTextureAnisotropy(Math.min(8, stage.renderer.capabilities.getMaxAnisotropy()));
  const root = new THREE.Group(); root.name = 'CDS'; stage.scene.add(root);
  const M = createMaterials();
  // Fase 14C · los materiales que cambian con el acabado llevan nombre: así los encuentra «Verla en tu espacio» en el GLB
  [M.blackAlu, M.blackAluEdge, M.handle].forEach((m) => { m.name = 'cds-acabado'; });

  // marco, gabinete y KeyLED del original; su muro y su piso se sustituyen por los comunes del sitio
  const frame = buildFrame(M); root.add(frame.root);
  const arch = frame.root.getObjectByName('Architecture'); if (arch) arch.visible = false;
  const backdrop = createBackdrop(stage, { wallZ: -0.007, opening: { left: -W / 2, right: W / 2, top: H }, halfWidth: 9, height: 4, floorDepth: 12, interiorDepth: DIM.CAB_DEPTH + 0.2 });
  root.add(backdrop.group);

  // puertas: cada hoja con su manija cuelga de su pivote. El núcleo construye la hoja con el eje a la derecha; aquí
  // se refleja sobre el centro de su vano para dejar las bisagras a la izquierda y la jaladera a la derecha, como el
  // juego real (b.hand = −1, ver BAYS en cds/legacy.js). El reflejo conserva el sentido de apertura hacia afuera.
  const doors = BAYS.map((b) => {
    const d = buildDoor(b, M);
    if (b.hand < 0) { const m = new THREE.Group(); m.name = `Mano izquierda ${b.index + 1}`; m.scale.x = -1; m.position.x = 2 * b.cx; m.add(d.pivot); root.add(m); }
    else root.add(d.pivot);
    return d;
  });
  const ctrls = doors.map((d) => new DoorController(d));

  // parrillas y productos
  const shelves = buildShelves(M, PLANOGRAM.map((row) => row.map((k) => SKUS[k]))); root.add(shelves.root);
  root.updateMatrixWorld(true);
  const products = new Products(root, shelves.trays, M, ctrls);
  products.setMaxRows(ROWS[stage.quality] || 3);

  // modelo: Advanced y Plus llevan dos vidrios; LT, tres (brief §3 y PDF). Lo demás no cambia por fuera.
  let model = 'advanced';
  const setModel = (id) => { if (!MODELS[id]) throw new Error(`Modelo CDS desconocido: ${id}`); model = id; doors.forEach((d) => { d.panes.middle.visible = MODELS[id].panes === 3; }); };
  setModel(model);

  // ---------- Fase 14C · acabado del marco, las puertas y las jaladeras: negro (estándar) o cromo (bajo pedido) ----------
  // Se cambian los mismos materiales en su lugar (las columnas llevan su propia copia del aluminio negro).
  const CROMO = { color: 0xe2e6e9, metalness: 1, roughness: 0.09, clearcoat: 0, envMapIntensity: 1.35 };
  const finMats = [M.blackAlu, M.blackAluEdge, M.handle];
  frame.root.traverse((o) => { if (o.isMesh && /Mullion/.test(o.name) && !finMats.includes(o.material)) finMats.push(o.material); });
  // Kwik Torque (bisagra de abajo) y la tapa de abajo del eje de cada puerta: también van en cromo. Llevan su propia copia
  // del material de herraje; Kwik Level (arriba) se queda como está.
  const torque = M.hardware.clone(); torque.name = 'cds-acabado'; finMats.push(torque);
  frame.parts.bottomHinges.forEach((m) => { m.material = torque; });
  doors.forEach((d) => d.pivot.traverse((o) => { if (o.isMesh && o.material === M.hardware && o.position.y < 1) o.material = torque; }));
  const finOrig = finMats.map((m) => ({ color: m.color.getHex(), metalness: m.metalness, roughness: m.roughness, roughnessMap: m.roughnessMap, clearcoat: m.clearcoat || 0, envMapIntensity: m.envMapIntensity }));
  let finish = 'negro';
  const setFinish = (id) => {
    finish = id === 'cromo' ? 'cromo' : 'negro';
    finMats.forEach((m, i) => {
      const o = finOrig[i], c = finish === 'cromo' ? CROMO : null;
      m.color.setHex(c ? c.color : o.color); m.metalness = c ? c.metalness : o.metalness; m.roughness = c ? c.roughness : o.roughness;
      m.roughnessMap = c ? null : o.roughnessMap; if ('clearcoat' in m) m.clearcoat = c ? c.clearcoat : o.clearcoat;
      m.envMapIntensity = c ? c.envMapIntensity : o.envMapIntensity; m.needsUpdate = true;
    });
    if (stage.invalidate) stage.invalidate(3);
  };

  // ---------- Fase 10F · «Prueba de humedad»: vaho sobre el vidrio exterior de cada puerta ----------
  // Una capa delante del vidrio de afuera (el lado tibio y húmedo). Su mapa marca dónde se empaña primero: orillas,
  // parte baja y gotas sueltas; al subir la humedad el vaho avanza de ahí hacia el centro. Es una ilustración.
  const fogMap = (() => {
    const w = 128, h = 320, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h);
    const hash = (x, y) => { const s0 = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s0 - Math.floor(s0); };
    const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / (w - 1), v = y / (h - 1), edge = Math.min(u, 1 - u, v * 0.6, 1 - v);
      const n = 0.6 * vnoise(u * 6, v * 15) + 0.4 * vnoise(u * 17, v * 41);
      const m = Math.max(0, Math.min(1, 0.95 - edge * 3.2 + v * 0.22 + (n - 0.5) * 0.55));
      const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = m * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    for (let k = 0; k < 140; k++) {                                   // gotas: se marcan antes que el resto
      const x = hash(k, 3) * w, y = hash(k, 7) * h, r = 0.8 + hash(k, 11) * 2.2;
      g.fillStyle = `rgba(255,255,255,${0.55 + hash(k, 13) * 0.45})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
  })();
  const fogMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f7, roughness: 0.92, metalness: 0, transparent: true, opacity: 0.94, alphaMap: fogMap, depthWrite: false, side: THREE.DoubleSide });
  fogMat.name = 'Vaho';
  const fogU = { value: 0 };
  // Fase 12 · «Límpialo con el dedo»: un mapa por puerta (las tres lado a lado) donde el dedo deja el vidrio limpio;
  // blanco = limpio. Con el tiempo se vuelve a empañar, más rápido entre más humedad le sobre al modelo.
  const WP = { w: 64, h: 150 }, wipeCv = document.createElement('canvas'); wipeCv.width = WP.w * doors.length; wipeCv.height = WP.h;
  const wipeG = wipeCv.getContext('2d'); wipeG.fillStyle = '#000'; wipeG.fillRect(0, 0, wipeCv.width, wipeCv.height);
  const wipeTex = new THREE.CanvasTexture(wipeCv); wipeTex.colorSpace = THREE.NoColorSpace; wipeTex.generateMipmaps = false; wipeTex.minFilter = THREE.LinearFilter;
  const wipeU = { value: wipeTex };
  fogMat.onBeforeCompile = (sh) => {
    sh.uniforms.uFog = fogU; sh.uniforms.uWipe = wipeU;
    sh.vertexShader = 'attribute vec2 wipeUv;\nvarying vec2 vWipeUv;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvWipeUv = wipeUv;');
    sh.fragmentShader = 'uniform float uFog;\nuniform sampler2D uWipe;\nvarying vec2 vWipeUv;\n' + sh.fragmentShader.replace('#include <alphamap_fragment>',
      'float fogM = texture2D( alphaMap, vAlphaMapUv ).g; float wipeM = texture2D( uWipe, vWipeUv ).r;\n' +
      'diffuseColor.a *= smoothstep( 1.0 - uFog - 0.12, 1.0 - uFog + 0.06, fogM ) * step( 0.001, uFog ) * ( 1.0 - smoothstep( 0.12, 0.7, wipeM ) );');
  };
  const fogMeshes = doors.map((d, i) => {
    const f = d.panes.front, p = f.geometry.parameters;
    const g = new THREE.PlaneGeometry(p.width - 0.004, p.height - 0.004), uv = g.attributes.uv, wu = new Float32Array(uv.count * 2);
    for (let k = 0; k < uv.count; k++) { wu[k * 2] = (i + uv.getX(k)) / doors.length; wu[k * 2 + 1] = uv.getY(k); }
    g.setAttribute('wipeUv', new THREE.BufferAttribute(wu, 2));
    const m = new THREE.Mesh(g, fogMat);
    m.position.z = p.depth / 2 + 0.0008; m.renderOrder = 12; m.name = 'Vaho'; m.userData.bay = i; m.userData.paneW = p.width; m.raycast = () => {}; f.add(m);   // no estorba al tomar la jaladera
    return m;
  });
  let fogNow = 0, fogGoal = 0;
  stage.onFrame.add((dt) => {
    if (fogNow === fogGoal) return;
    const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1, dt * (fogGoal > fogNow ? 0.9 : 1.4));
    fogNow += (fogGoal - fogNow) * k; if (Math.abs(fogGoal - fogNow) < 0.002) fogNow = fogGoal;
    fogU.value = fogNow; if (stage.invalidate) stage.invalidate(2);
  });

  // trazo del dedo: solo cuando el vidrio está empañado y la página lo permite (paso «Prueba de humedad»)
  let wipeOn = false, wiping = null, dirty = false, wiped = 0, refog = 8, sinceWipe = 0, wipeCb = null, upAcc = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), handles = doors.flatMap((d) => d.pickables.filter((m) => m.userData.isHandle));
  const hitGlass = (e) => {
    if (!wipeOn || fogNow < 0.08) return null;
    const r = stage.canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, stage.camera);
    const hits = []; fogMeshes.forEach((m) => THREE.Mesh.prototype.raycast.call(m, ray, hits));
    if (!hits.length) return null;
    hits.sort((a, b) => a.distance - b.distance);
    const grab = ray.intersectObjects(handles, false)[0];               // la jaladera va primero: con ella se abre la puerta
    if (grab && grab.distance < hits[0].distance + 0.01) return null;
    return hits[0];
  };
  const dab = (h, prev) => {
    const m = h.object, i = m.userData.bay, x = (i + h.uv.x) * WP.w, y = (1 - h.uv.y) * WP.h;
    const rad = Math.max(5, 0.05 / m.userData.paneW * WP.w);          // ~5 cm: la yema del dedo con algo de barrido
    wipeG.save(); wipeG.beginPath(); wipeG.rect(i * WP.w, 0, WP.w, WP.h); wipeG.clip();        // no se pasa a la puerta de al lado
    const steps = prev && prev.bay === i ? Math.max(1, Math.ceil(Math.hypot(x - prev.x, y - prev.y) / (rad * 0.4))) : 1;
    for (let s = 1; s <= steps; s++) {
      const px = prev && prev.bay === i ? prev.x + (x - prev.x) * s / steps : x, py = prev && prev.bay === i ? prev.y + (y - prev.y) * s / steps : y;
      const gr = wipeG.createRadialGradient(px, py, rad * 0.2, px, py, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      wipeG.fillStyle = gr; wipeG.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    wipeG.restore(); dirty = true; wiped = 1; sinceWipe = 0;
    return { bay: i, x, y };
  };
  const onDown = (e) => {
    const h = hitGlass(e); if (!h) return;
    e.stopPropagation(); e.preventDefault();                          // ni gira la cámara ni toma la puerta
    wiping = { id: e.pointerId, last: dab(h, null) };
    try { stage.canvas.setPointerCapture(e.pointerId); } catch (_) { /* sin captura en algunos navegadores */ }
    if (wipeCb) wipeCb('start');
  };
  const onMove = (e) => {
    if (!wiping || e.pointerId !== wiping.id) return;
    e.stopPropagation();
    const h = hitGlass(e); if (h) wiping.last = dab(h, wiping.last); else wiping.last = null;
    if (stage.invalidate) stage.invalidate(2);
  };
  const onUp = (e) => { if (!wiping || e.pointerId !== wiping.id) return; wiping = null; if (wipeCb) wipeCb('end'); };
  // En el teléfono se limpia de lado a lado: el visor deja que el dedo desplace la página hacia arriba y abajo (pan-y), así
  // que un trazo que empieza de lado limpia y uno que empieza hacia arriba o abajo sigue moviendo la página.
  const host = stage.canvas.parentElement;
  host.addEventListener('pointerdown', onDown, { capture: true });
  host.addEventListener('pointermove', onMove, { capture: true });
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  stage.onFrame.add((dt) => {
    if (!wiped) return;
    sinceWipe += dt; upAcc += dt;
    if (!wiping && sinceWipe > 0.6 && upAcc > 1 / 15) {               // se vuelve a empañar poco a poco (15 veces por segundo basta)
      const a = Math.min(0.5, upAcc * 3.2 / refog); upAcc = 0;
      wipeG.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`; wipeG.fillRect(0, 0, wipeCv.width, wipeCv.height); dirty = true;
      wiped *= 1 - a;
      if (wiped < 0.02 || fogGoal === 0) { wipeG.fillStyle = '#000'; wipeG.fillRect(0, 0, wipeCv.width, wipeCv.height); wiped = 0; if (wipeCb) wipeCb('fogged'); }
    }
    if (dirty) { wipeTex.needsUpdate = true; dirty = false; if (stage.invalidate) stage.invalidate(2); }
  });
  const fog = {
    set: (v) => { fogGoal = Math.max(0, Math.min(1, v)); if (stage.invalidate) stage.invalidate(2); }, get value() { return fogGoal; },
    // on: el dedo limpia; seconds: cuánto tarda en volverse a empañar; cb('start'|'end'|'fogged')
    wipe(on, { seconds = 8, onEvent = null } = {}) { wipeOn = !!on; refog = Math.max(2, seconds); wipeCb = onEvent; },
    get wiped() { return wiped; },
  };

  // Encuadres: cada uno es una caja que debe quedar completa en el visor, vista desde un ángulo. Así se adaptan a la
  // proporción del visor (escritorio, tableta o celular) en vez de usar la distancia fija del original.
  // Los encuadres del lado de la bisagra se escribieron para el eje a la derecha: con la mano izquierda se reflejan
  // sobre el centro del vano (mx) y la cámara pasa al otro lado (yaw con signo contrario, sy).
  const b1 = BAYS[1], mull = (BAYS[0].x1 + BAYS[1].x0) / 2, lw = b1.leafW, hand = b1.hand || 1;
  const mx = (x) => (hand < 0 ? 2 * b1.cx - x : x), sy = hand;
  const span = (a, b) => [Math.min(mx(a), mx(b)), Math.max(mx(a), mx(b))];
  const fit = (box, yaw, pitch, m) => (st) => frameBox(st, box, yaw, pitch, m);
  const side = ([x0, x1], y0, z0, y1, z1) => [x0, y0, z0, x1, y1, z1];
  const views = {
    general: fit(BOX.closed, -0.45 * sy, 0.04),
    frontal: fit(BOX.closed, 0, 0),
    abierta: fit(BOX.open, -0.42 * sy, 0.06),
    interior: fit(BOX.open, -0.18 * sy, 0.02),
    retencion: fit(side(span(b1.x0 - 0.25, b1.axisX + 0.12), 0, -0.1, H, lw + 0.05), -0.62 * sy, 0.08),
    autocierre: fit(side(span(b1.x0, b1.axisX + 0.12), 0, -0.1, 1.0, 0.7), -0.5 * sy, 0.18),
    parrillas: fit([b1.x0 - 0.05, 0.45, -0.62, b1.x1 + 0.05, 1.95, 0.1], -0.22 * sy, 0.04, 1.02),
    kwikLevel: fit(side(span(b1.axisX - 0.32, b1.axisX + 0.12), b1.leafY1 - 0.3, -0.1, H + 0.01, 0.1), -0.45 * sy, -0.12),
    mullion: fit([mull - 0.22, 0.95, -0.1, mull + 0.22, 1.55, 0.06], -0.5, 0.05),
    sello: fit(side(span(b1.x0 - 0.12, b1.x1), 0.6, -0.12, 1.55, 0.45), -0.38 * sy, 0.05),
    frio: fit([-W / 2, 0, -0.1, W / 2, H, 1.9], -0.3 * sy, 0.3),          // las tres puertas y el piso de enfrente
    humedad: fit([BAYS[0].x0, 0.25, -0.1, BAYS[2].x1, H - 0.08, 0.12], -0.12 * sy, 0.04, 1.03),   // las tres puertas de frente
    keyled: fit([-W / 2 + 0.05, 0.12, -DIM.CAB_DEPTH, W / 2 - 0.05, H - 0.1, 0.05], -0.22 * sy, 0.05, 1.0),
  };

  // KeyLED: tiras en los perfiles verticales, del lado interior
  let led = true;
  // con las luces apagadas el interior se oscurece: una capa oscura justo detrás de los vidrios (se ve también por la
  // puerta abierta) que entra y sale en 0.4 s
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x03080d, transparent: true, opacity: 0, depthWrite: false });
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.03, H - 0.06), darkMat); dark.name = 'InteriorSinLuz';
  dark.position.set(0, H / 2, -0.035); dark.visible = false; dark.renderOrder = 10; dark.raycast = () => {}; root.add(dark);   // después de los productos: los cubre parejo
  let darkGoal = 0;
  stage.onFrame.add((dt) => {
    if (darkMat.opacity === darkGoal) return;
    const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1, dt / 0.4);
    darkMat.opacity += (darkGoal - darkMat.opacity) * Math.max(k, 0.12); if (Math.abs(darkGoal - darkMat.opacity) < 0.004) darkMat.opacity = darkGoal;
    dark.visible = darkMat.opacity > 0.001; if (stage.invalidate) stage.invalidate(2);
  });
  const setLED = (on) => { led = !!on; M.ledStrip.emissiveIntensity = led ? 2.2 : 0; M.ledStrip.color.set(led ? 0xffffff : 0x9aa1a6); frame.parts.ledLights.forEach((l) => { l.intensity = led ? 0.9 : 0; }); darkGoal = led ? 0 : 0.7; if (stage.invalidate) stage.invalidate(3); };

  // ---------- movimiento para la página ----------
  const listeners = new Set(); let wasOpen = false;
  const isOpen = () => ctrls.some((c) => c.state === DoorState.HOLD_OPEN_90 || ((c.state === DoorState.DRAGGING) && c.target >= 45) || c.angle >= 45);
  stage.onFrame.add((dt) => {
    ctrls.forEach((c) => c.update(dt)); products.update(dt);
    const o = isOpen(); if (o !== wasOpen) { wasOpen = o; listeners.forEach((f) => f(o)); }
  });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const open = (c, deg) => {
    if (deg >= HOLD.HOLD_ANGLE) { c.openTo(HOLD.HOLD_ANGLE, { release: true, speed: 1 }); if (reduced()) { c.angle = HOLD.HOLD_ANGLE; c.target = HOLD.HOLD_ANGLE; c.auto = null; c.setState(DoorState.HOLD_OPEN_90); } }
    else if (deg <= 0) { if (c.state !== DoorState.CLOSED) { products.resetAll(); c.closeNow(); if (reduced()) { c.angle = 0; c.vel = 0; c.setState(DoorState.CLOSED); } } }
    else c.openTo(deg, { release: true, speed: 1 });             // se suelta antes de 90°: el autocierre la regresa
  };
  const all = (deg) => ctrls.forEach((c) => open(c, deg));
  let interaction = null;
  const motion = {
    attachDrag({ onGrab } = {}) {
      interaction = new Interaction({
        canvas: stage.canvas, camera: stage.camera, controls: stage.controls, doors, doorCtrls: ctrls, products,
        ui: { productMode: 'rotate', toast, focusDoor: () => onGrab && onGrab() },
      });
    },
    onOpenChange: (f) => listeners.add(f),
    setOpen: (on) => all(on ? HOLD.HOLD_ANGLE : 0),
    inside: (on) => { if (on) { all(0); open(ctrls[1], HOLD.HOLD_ANGLE); } else all(0); },
    // Fase 10K · «Tomar un producto» sin saber arrastrar: abre la puerta (si hace falta), espera a que quede retenida a
    // 90° y saca un producto del frente; el mismo de antes se puede regresar. Los productos tomados se avisan con onProduct.
    takeOne(bay = 1) {
      const c = ctrls[bay];
      const pick = () => {
        const recs = products.records.filter((r) => r.bay === bay && !r.out && r.row === 0 && r.row < products.maxRows);
        const r = recs[Math.floor(Math.random() * recs.length)]; if (!r) return;
        products.extract(r); if (stage.invalidate) stage.invalidate(30);
      };
      if (c.state === DoorState.HOLD_OPEN_90 && c.angle >= HOLD.PICK_MIN_ANGLE) { pick(); return; }
      open(c, HOLD.HOLD_ANGLE);
      const t0 = performance.now(); let tries = 0;
      const wait = () => {
        if (c.angle >= HOLD.PICK_MIN_ANGLE) {
          stage.onFrame.delete(wait);
          if (c.state !== DoorState.HOLD_OPEN_90) { c.angle = HOLD.HOLD_ANGLE; c.target = HOLD.HOLD_ANGLE; c.auto = null; c.setState(DoorState.HOLD_OPEN_90); }
          pick();
        }
        // si otra cosa la cerró (p. ej. el paso anterior de la historia la soltó y se cerró sola), se vuelve a abrir
        else if ((c.state === DoorState.CLOSED || c.state === DoorState.AUTO_CLOSING) && tries < 3 && performance.now() - t0 > 400) { tries++; open(c, HOLD.HOLD_ANGLE); }
        else if (performance.now() - t0 > 30000) stage.onFrame.delete(wait);
      };
      stage.onFrame.add(wait);
    },
    giveBack: () => { products.returnHeld(); if (stage.invalidate) stage.invalidate(30); },
    get holding() { return products.info(); },
    onProduct(f) { products.on('held', (i) => f(i)); products.on('returned', () => f(null)); },
    // pasos: data-open="90" (las tres) o "0,90,0" (una cifra por puerta); data-led="0|1"
    step(d) {
      if (d.open !== undefined) { const a = String(d.open).split(',').map(Number); ctrls.forEach((c, i) => open(c, a[i] ?? a[0])); }
      if (d.led !== undefined) setLED(d.led === '1');
    },
  };

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, M, frame, doors, ctrls, products, shelves, motion,
    // «Ver el frío»: una salida por puerta (cada vano se refleja sobre su propio centro: conserva su ancho)
    thermal: {
      wallZ: -0.007, floorY: 0, openings: () => ctrls.map((c, i) => ({ x0: BAYS[i].x0, x1: BAYS[i].x1, top: BAYS[i].leafY1, amount: Math.min(1, c.angle / HOLD.HOLD_ANGLE) })),
      // aplicación de cada modelo según strefrigeracion.com (Plus y Advanced: refrigeración −5 °C; LT: congelación −20 °C)
      note: () => (model === 'lt' ? 'LT: congelación, −20 °C' : `${MODELS[model].name.replace('Legacy ', '')}: refrigeración, −5 °C`),
    },
    fog,
    setInside: backdrop.setInside,
    get led() { return led; }, setLED,
    // el control de "acabado" de la página aquí elige el modelo; por fuera son iguales
    options: {
      label: 'Modelo', current: () => model, set: setModel,
      items: Object.entries(MODELS).map(([id, m]) => ({ id, label: m.name.replace('Legacy ', ''), title: m.name, detail: `${m.use} · ${m.panes} vidrios${m.heated ? ' con resistencia' : ' sin resistencia'}${m.gas ? ' y argón' : ''}` })),
    },
    // Fase 14C · acabado: negro, o cromo bajo pedido (botones junto al modelo; quedan en la URL como ?acabado=)
    get finish() { return finish; }, setFinish,
    configs: [{
      key: 'acabado', label: 'Acabado', fade: true, current: () => finish, set: setFinish,
      items: [
        { id: 'negro', label: 'Negro', detail: 'Acabado negro' },
        { id: 'cromo', label: 'Cromo<small class="chip__tag">Bajo pedido</small>', detail: 'Acabado cromo, bajo pedido' },
      ],
    }],
    limits: { minDistance: 0.35, maxDistance: 8.5, minAzimuthAngle: -1.25, maxAzimuthAngle: 1.25, minPolarAngle: Math.PI * 0.18 },
    views,
    // "ver por dentro": funciones del PDF señaladas sobre la puerta central
    anchors: [
      { label: 'Puerta a 90°', text: 'Al abrir la puerta por completo se queda abierta a 90°, sin brazo. Si se suelta antes, regresa sola.', parent: doors[1].pivot, position: V(b1.leafX0 - b1.axisX + 0.08, 1.5, 0.03) },
      { label: 'Kwik Torque', text: 'Ajusta la velocidad de cierre de la puerta con 3 o 4 clics.', parent: root, position: V(mx(b1.axisX - 0.008), b1.leafY0 - 0.034, 0.05) },
      { label: 'Kwik Level', text: 'Alineación de la puerta en la parte alta: facilita nivelar una puerta con otra.', parent: root, position: V(mx(b1.axisX - 0.006), b1.leafY1 + 0.0225, 0.05) },
      { label: 'Mullion Design', text: 'Columna tipo "T" entre puertas: un marco resistente, pensado para durar.', parent: root, position: V(mull, 1.2, 0.005) },
      { label: 'Triple sello', text: 'El empaque de triple sello envuelve el marco por dentro y trabaja con un imán integrado para sellar la puerta.', parent: doors[1].pivot, position: V(b1.leafX0 - b1.axisX + 0.012, 0.7, -0.022) },
      { label: 'KeyLED', text: 'Iluminación sin balastro, con conexión eléctrica en un solo extremo y protección de vinilo.', parent: root, position: V(mull, 1.8, -DIM.FRAME_DEPTH - 0.01) },
    ],
  };
}

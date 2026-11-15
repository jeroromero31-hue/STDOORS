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

  // marco, gabinete y KeyLED del original; su muro y su piso se sustituyen por los comunes del sitio
  const frame = buildFrame(M); root.add(frame.root);
  const arch = frame.root.getObjectByName('Architecture'); if (arch) arch.visible = false;
  const backdrop = createBackdrop(stage, { wallZ: -0.007, opening: { left: -W / 2, right: W / 2, top: H }, halfWidth: 9, height: 4, floorDepth: 12, interiorDepth: DIM.CAB_DEPTH + 0.2 });
  root.add(backdrop.group);

  // puertas: cada hoja con su manija cuelga de su pivote
  const doors = BAYS.map((b) => { const d = buildDoor(b, M); root.add(d.pivot); return d; });
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

  // Encuadres: cada uno es una caja que debe quedar completa en el visor, vista desde un ángulo. Así se adaptan a la
  // proporción del visor (escritorio, tableta o celular) en vez de usar la distancia fija del original.
  const b1 = BAYS[1], mull = (BAYS[0].x1 + BAYS[1].x0) / 2, lw = b1.leafW;
  const fit = (box, yaw, pitch, m) => (st) => frameBox(st, box, yaw, pitch, m);
  const views = {
    general: fit(BOX.closed, -0.45, 0.04),
    frontal: fit(BOX.closed, 0, 0),
    abierta: fit(BOX.open, -0.42, 0.06),
    interior: fit(BOX.open, -0.18, 0.02),
    retencion: fit([b1.x0 - 0.25, 0, -0.1, b1.axisX + 0.12, H, lw + 0.05], -0.62, 0.08),
    autocierre: fit([b1.x0, 0, -0.1, b1.axisX + 0.12, 1.0, 0.7], -0.5, 0.18),
    parrillas: fit([b1.x0 - 0.05, 0.45, -0.62, b1.x1 + 0.05, 1.95, 0.1], -0.22, 0.04, 1.02),
    kwikLevel: fit([b1.axisX - 0.32, b1.leafY1 - 0.3, -0.1, b1.axisX + 0.12, H + 0.01, 0.1], -0.45, -0.12),
    mullion: fit([mull - 0.22, 0.95, -0.1, mull + 0.22, 1.55, 0.06], -0.5, 0.05),
    sello: fit([b1.x0 - 0.12, 0.6, -0.12, b1.x1, 1.55, 0.45], -0.38, 0.05),
    keyled: fit([-W / 2 + 0.05, 0.12, -DIM.CAB_DEPTH, W / 2 - 0.05, H - 0.1, 0.05], -0.22, 0.05, 1.0),
  };

  // KeyLED: tiras en los perfiles verticales, del lado interior
  let led = true;
  const setLED = (on) => { led = !!on; M.ledStrip.emissiveIntensity = led ? 2.2 : 0; M.ledStrip.color.set(led ? 0xffffff : 0x9aa1a6); frame.parts.ledLights.forEach((l) => { l.intensity = led ? 0.9 : 0; }); };

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
    // pasos: data-open="90" (las tres) o "0,90,0" (una cifra por puerta); data-led="0|1"
    step(d) {
      if (d.open !== undefined) { const a = String(d.open).split(',').map(Number); ctrls.forEach((c, i) => open(c, a[i] ?? a[0])); }
      if (d.led !== undefined) setLED(d.led === '1');
    },
  };

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    root, M, frame, doors, ctrls, products, shelves, motion,
    setInside: backdrop.setInside,
    get led() { return led; }, setLED,
    // el control de "acabado" de la página aquí elige el modelo; por fuera son iguales
    options: {
      label: 'Modelo', current: () => model, set: setModel,
      items: Object.entries(MODELS).map(([id, m]) => ({ id, label: m.name.replace('Legacy ', ''), title: m.name, detail: `${m.use} · ${m.panes} vidrios${m.heated ? ' con resistencia' : ' sin resistencia'}${m.gas ? ' y argón' : ''}` })),
    },
    limits: { minDistance: 0.35, maxDistance: 8.5, minAzimuthAngle: -1.25, maxAzimuthAngle: 1.25, minPolarAngle: Math.PI * 0.18 },
    views,
    // "ver por dentro": funciones del PDF señaladas sobre la puerta central
    anchors: [
      { label: 'Puerta a 90°', text: 'Al abrir la puerta por completo se queda abierta a 90°, sin brazo. Si se suelta antes, regresa sola.', parent: doors[1].pivot, position: V(b1.leafX0 - b1.axisX + 0.08, 1.5, 0.03) },
      { label: 'Kwik Torque', text: 'Ajusta la velocidad de cierre de la puerta con 3 o 4 clics.', parent: root, position: V(b1.axisX - 0.008, b1.leafY0 - 0.034, 0.05) },
      { label: 'Kwik Level', text: 'Alineación de la puerta en la parte alta: facilita nivelar una puerta con otra.', parent: root, position: V(b1.axisX - 0.006, b1.leafY1 + 0.0225, 0.05) },
      { label: 'Mullion Design', text: 'Columna tipo "T" entre puertas: un marco resistente, pensado para durar.', parent: root, position: V(mull, 1.2, 0.005) },
      { label: 'Triple sello', text: 'El empaque de triple sello envuelve el marco por dentro y trabaja con un imán integrado para sellar la puerta.', parent: doors[1].pivot, position: V(b1.leafX0 - b1.axisX + 0.012, 0.7, -0.022) },
      { label: 'KeyLED', text: 'Iluminación sin balastro, con conexión eléctrica en un solo extremo y protección de vinilo.', parent: root, position: V(mull, 1.8, -DIM.FRAME_DEPTH - 0.01) },
    ],
  };
}

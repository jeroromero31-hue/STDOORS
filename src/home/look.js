// Fase 10D · "Look" de la entrada: luz y materiales de foto de producto para la escena del Inicio.
// No toca el modelo de la puerta: solo cambia luces, muro, piso e interior de ESTA escena.
//   · luz principal: un reflector suave desde arriba a la izquierda que deja un círculo de luz alrededor de la puerta y
//     la orilla más oscura (en vez de un estudio parejo); sombras suaves del marco sobre el muro
//   · muro de paneles de cámara frigorífica (juntas verticales cada 1.15 m) y piso de concreto pulido que refleja
//   · al abrir: luz fría que sale del interior y cae sobre el piso, y el interior se ilumina azul
//   · sombra de contacto en la base del muro
import * as THREE from 'three';

function canvasTex(w, h, draw, { srgb = true, repeat = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function applyLook(stage, viewer) {
  const { scene, renderer } = stage;
  // En teléfonos la escena se mantiene ligera: sin reflector, sin relieve en el muro, sin luz del interior. El círculo de
  // luz lo da una viñeta de CSS (cuesta nada) y las juntas del muro siguen en su textura.
  const phone = matchMedia('(pointer: coarse)').matches;
  const back = scene.getObjectByName('MuroYPiso');
  if (!back) return { set() {} };
  const meshes = back.children.filter((o) => o.isMesh);
  const wall = meshes.find((m) => m.geometry.type === 'ExtrudeGeometry');
  const inner = meshes.find((m) => m.geometry.type === 'BoxGeometry');
  const floor = meshes.find((m) => m.geometry.type === 'PlaneGeometry');

  // muro y piso: los paneles, el piso pulido y la sombra de contacto ya los pone el escenario común (backdrop.js);
  // aquí solo baja la luz de ambiente que reciben, para que se note el círculo del reflector
  if (wall) wall.material.envMapIntensity = phone ? 0.22 : 0.07;
  if (floor) { floor.material.envMapIntensity = phone ? 0.4 : 0.18; floor.material.roughness = 0.4; floor.material.color.set(0xc9d0d4); }
  // ---------- interior: azul marino que recibe la luz fría ----------
  if (inner) inner.material = new THREE.MeshStandardMaterial({ color: 0x0a3a58, emissive: 0x052f49, emissiveIntensity: 0.85, roughness: 0.95, side: THREE.BackSide, envMapIntensity: 0 });

  // ---------- luces ----------
  if (phone) {
    stage.key.intensity = 0.9;                                         // como antes, con menos ambiente
    scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = 0.16; });
  } else {
    stage.key.intensity = 0.1; stage.key.castShadow = false;          // queda como relleno
    scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = 0.07; });
  }
  const spot = new THREE.SpotLight(0xfff6ec, 120, 0, 0.36, 0.85, 2);
  spot.position.set(-1.7, 4.4, 3.8); spot.target.position.set(0.15, 1.15, 0);
  spot.castShadow = renderer.shadowMap.enabled && !phone;
  spot.visible = !phone;
  spot.shadow.mapSize.set(stage.quality === 'alta' ? 2048 : 1024, stage.quality === 'alta' ? 2048 : 1024);
  spot.shadow.bias = -0.0003; spot.shadow.normalBias = 0.03; spot.shadow.camera.near = 1; spot.shadow.camera.far = 14;
  if (!phone) scene.add(spot, spot.target);
  if (!phone) { const rim = new THREE.DirectionalLight(0xdfeefa, 0.22); rim.position.set(4, 2.5, 2); scene.add(rim); }   // filo frío por la derecha
  // luz fría del interior: en computadora una luz real; en teléfonos el interior solo brilla más (una luz menos por píxel)
  const cold = phone ? null : new THREE.PointLight(0xa8dcff, 0, 4.5, 2);
  if (cold) { cold.position.set(0, 2.1, -1.0); scene.add(cold); }
  stage.onQuality.add(() => { spot.castShadow = renderer.shadowMap.enabled && !phone; });

  // ---------- luz fría que sale por el vano y cae sobre el piso ----------
  const spillTex = canvasTex(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.12, 0); g.lineTo(w * 0.88, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
  }, { repeat: false });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.4), new THREE.MeshBasicMaterial({ map: spillTex, color: 0xbfe6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.003, 1.65); spill.renderOrder = 5; back.add(spill);   // con el muro y el piso

  // ---------- sombra de contacto alrededor del marco (oclusión ambiental "horneada") ----------
  // donde el marco toca el muro la luz del ambiente llega menos: un halo suave y oscuro alrededor de su contorno
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible || o === spill) return;
    for (let a = o; a; a = a.parent) if (a.name === 'MuroYPiso' || a.name === 'Vaho') return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.union(tmp);
  });
  if (!box.isEmpty()) {
    // lienzo: el contorno del marco con un margen m arriba y a los lados (abajo está el piso)
    const m = 0.4, W = box.max.x - box.min.x + 2 * m, H = box.max.y - box.min.y + m, s = 110;   // px por metro
    const halo = canvasTex(Math.round(W * s), Math.round(H * s), (g, w, h) => {
      const x = m * s, y = m * s, fw = w - 2 * m * s, fh = h - y;
      // solo la sombra: el rectángulo se dibuja fuera del lienzo y su sombra cae en su lugar
      g.shadowColor = 'rgba(8, 28, 42, 0.45)'; g.shadowBlur = 0.12 * s; g.shadowOffsetX = 5000;
      g.fillStyle = '#000'; g.fillRect(x - 5000, y, fw, fh + 40);
      g.shadowColor = 'transparent'; g.clearRect(x + 1, y + 1, fw - 2, fh);       // dentro del marco no va nada
    }, { repeat: false });
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false }));
    decal.position.set((box.min.x + box.max.x) / 2, box.min.y + H / 2, 0.002);
    decal.renderOrder = 3; back.add(decal);
  }

  renderer.toneMappingExposure = 1.0;
  // open: 0…1 cuánto está abierta la puerta
  return {
    set(open) {
      if (cold) cold.intensity = 2.4 * open;
      else if (inner) inner.material.emissiveIntensity = 0.85 + 0.6 * open;
      spill.material.opacity = 0.26 * open; spill.visible = open > 0.002;   // apagada no se dibuja
    },
  };
}

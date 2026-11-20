// Comportamientos de Quick Look (iPhone) para que la puerta se abra y se cierre cuando la tocas.
// Esquemas «Preliminary» de Apple (USDZ schemas for AR: Preliminary_Behavior, Preliminary_Trigger, Preliminary_Action).
//
// Cómo funciona:
// - La línea de tiempo del USDZ tiene tramos: «cerrada» (quieta), «abrir», «abierta» (quieta), «cerrar» y, en la CDS,
//   «tomar-N». Nada se reproduce solo: cada toque pide un tramo.
// - Quick Look no recuerda estados, así que la puerta va dos veces (A y B, la misma geometría): con la puerta cerrada se
//   ve A; tocar A oculta A, muestra B y reproduce «abrir». Tocar B hace lo contrario y reproduce «cerrar».
// - Al terminar un tramo, Quick Look regresa al primer cuadro; por eso cada tramo sigue con un tramo quieto en bucle
//   («abierta» o «cerrada»), que mantiene la pose final.
// - Los comportamientos con animación son exclusivos: uno nuevo detiene al anterior (si no, Quick Look los encima).

const block = (head, body) => `${head}\n{\n${body.filter(Boolean).join('\n')}\n}`;
const rel = (paths) => (paths.length === 1 ? `<${paths[0]}>` : `[${paths.map((p) => `<${p}>`).join(', ')}]`);
const num = (v) => +v.toFixed(4);

const vis = (name, paths, show) => ({
  name,
  text: block(`def Preliminary_Action "${name}"`, [
    `rel affectedObjects = ${rel(paths)}`, 'double duration = 0', 'token easeType = "none"', 'token info:id = "Visibility"',
    'token motionType = "none"', 'double moveDistance = 0', 'token style = "basic"', `token type = "${show ? 'show' : 'hide'}"`,
  ]),
});
const play = (name, target, seg) => ({
  name,
  text: block(`def Preliminary_Action "${name}"`, [
    `rel affectedObjects = <${target}>`, 'double animationSpeed = 1', `double duration = ${num(seg.dur)}`, 'token info:id = "StartAnimation"',
    'token multiplePerformOperation = "allow"', 'bool reversed = 0', 'bool reverses = 0', `double start = ${num(seg.start)}`,
  ]),
});
const group = (name, type, kids, loops = false) => ({
  name,
  text: block(`def Preliminary_Action "${name}"`, [
    `rel actions = ${rel(kids.map((k) => k.name))}`, 'token info:id = "Group"', `bool loops = ${loops ? 1 : 0}`,
    `int performCount = ${loops ? 0 : 1}`, `token type = "${type}"`, 'token multiplePerformOperation = "allow"', ...kids.map((k) => k.text),
  ]),
});
const tap = (name, paths) => ({ name, text: block(`def Preliminary_Trigger "${name}"`, [`rel affectedObjects = ${rel(paths)}`, 'token info:id = "TapGesture"']) });
const onStart = (name) => ({ name, text: block(`def Preliminary_Trigger "${name}"`, ['token info:id = "SceneTransition"', 'token type = "enter"']) });
const behavior = (name, trig, act, exclusive) => block(`def Preliminary_Behavior "${name}"`, [
  `rel triggers = <${trig.name}>`, `rel actions = <${act.name}>`, `uniform bool exclusive = ${exclusive ? 1 : 0}`, trig.text, act.text,
]);
// un tramo y después su pose quieta, en bucle
const playThenHold = (name, root, seg, hold) => group(name, 'serial', [play('Tramo', root, seg), group('Queda', 'serial', [play('Pose', root, hold)], true)]);

/**
 * @param {object} o
 * @param {string} o.root   ruta del grupo animado (p. ej. /Root/Scenes/Scene/Puerta)
 * @param {string[]} o.A    rutas de las piezas que se tocan con la puerta cerrada (visibles al inicio)
 * @param {string[]} o.B    sus copias, para la puerta abierta (ocultas al inicio)
 * @param {object} o.segs   tramos { cerrada, abrir, abierta, cerrar, [clip]: … } con { start, dur } en segundos
 * @param {{clip: string, paths: string[]}[]} [o.prods] productos que se toman (CDS)
 */
export function tapBehaviors({ root, A, B, segs, prods = [] }) {
  const out = [
    behavior('AlInicio', onStart('Inicio'), vis('OcultaB', B, false), false),
    behavior('Abrir', tap('Toque', A), group('Hacer', 'parallel', [vis('OcultaA', A, false), vis('MuestraB', B, true), playThenHold('Mueve', root, segs.abrir, segs.abierta)]), true),
    behavior('Cerrar', tap('Toque', B), group('Hacer', 'parallel', [vis('OcultaB', B, false), vis('MuestraA', A, true), playThenHold('Mueve', root, segs.cerrar, segs.cerrada)]), true),
  ];
  prods.forEach((p, k) => {
    if (!segs[p.clip] || !p.paths.length) return;
    out.push(behavior(`Tomar${k}`, tap('Toque', p.paths), group('Hacer', 'parallel', [vis('OcultaA', A, false), vis('MuestraB', B, true), playThenHold('Mueve', root, segs[p.clip], segs.abierta)]), true));
  });
  return block('def Scope "Behaviors"', out);
}

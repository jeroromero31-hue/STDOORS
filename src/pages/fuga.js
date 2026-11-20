// Fase 10K · ¿Cuánto frío se escapa por tu puerta?
// Fase 11 · ahora en positivo: «¿Cuánto puedes ahorrar en luz?». El número grande es el ahorro al mes entre cómo se usa
// tu puerta hoy y cómo se usaría con los cambios que marcas (que cierre en 10 s, que no se quede abierta, cortina).
import { mountSite, url } from '../ui/site.js';
import '../styles/fuga.css';
import { fuga, escenarios } from '../ui/fugaCalc.js';
import { mountFugaSim } from '../ui/fugaSim.js';
import { vano } from '../ui/vano.js';
import { waButton, waUpdate } from '../ui/whatsapp.js';

mountSite('fuga');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const form = $('#fugaForm');
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const num = (n, d = 0) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: d }).format(n);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sim = mountFugaSim($('#fugaSim'), { reduced });
const st = { proteccion: 'ninguna', hrIn: 85, mej: { rapida: true, cerrada: true, tiras: true } };
const mejor = (i) => ({ ...i, segundos: st.mej.rapida ? Math.min(i.segundos, 10) : i.segundos, minutos: st.mej.cerrada ? 0 : i.minutos, proteccion: st.mej.tiras ? 'tiras' : i.proteccion });

// medida: la del sitio si ya la escribiste
const v = vano.get();
if (v && v.ancho && v.alto && v.fam !== 'cds') {
  form.ancho.value = v.ancho; form.alto.value = v.alto;
  const from = $('[data-from]'); from.textContent = 'Con la medida que escribiste en el sitio.'; from.hidden = false;
}

const read = () => ({
  ancho: Math.max(30, +form.ancho.value || 0), alto: Math.max(50, +form.alto.value || 0),
  tIn: +form.tIn.value, hrIn: st.hrIn, tOut: +form.tOut.value, hrOut: +form.hrOut.value,
  aperturas: +form.aperturas.value, segundos: +form.segundos.value, minutos: +form.minutos.value,
  proteccion: st.proteccion, precio: Math.max(0, +form.precio.value || 0), alt: +form.alt.value,
});
const out = (k, t) => { const o = $(`[data-o="${k}"]`); if (o) o.value = t; };
const r = (k) => $(`[data-r="${k}"]`);
let wa = null;
function update() {
  const i = read();
  out('tIn', `${i.tIn} °C`); out('tOut', `${i.tOut} °C`); out('hrOut', `${i.hrOut} %`);
  out('aperturas', num(i.aperturas)); out('segundos', `${i.segundos} s`); out('minutos', `${i.minutos} min`);
  $$('[data-uso]').forEach((b) => b.setAttribute('aria-pressed', String(i.tIn <= -5 ? b.dataset.uso === '-20' : b.dataset.uso === '2')));
  $('[data-v="tin"]').textContent = `${i.tIn} °C`; $('[data-v="tout"]').textContent = `${i.tOut} °C`;
  const f = fuga(i);
  if (!f) {
    r('ahorro').textContent = money.format(0); r('vs').textContent = ''; r('year').textContent = 'Afuera tiene que estar más tibio que adentro para que haya algo que ahorrar.';
    ['luz', 'min', 'kw', 'agua'].forEach((k) => { r(k).textContent = '—'; }); r('eq').textContent = ''; $('#fugaSc').innerHTML = '';
    sim.set({ velocidad: 0, alto: i.alto, tIn: i.tIn, tOut: i.tOut }); return;
  }
  const g = fuga(mejor(i)), ahorro = Math.max(0, f.mes.pesos - g.mes.pesos);
  r('ahorro').textContent = money.format(ahorro); r('mini').textContent = money.format(ahorro);
  r('year').textContent = ahorro > 0 ? `${money.format(Math.max(0, f.año.pesos - g.año.pesos))} al año` : 'Marca uno de los cambios de abajo para ver tu ahorro.';
  r('vs').textContent = `Hoy el frío que sale por la puerta te cuesta unos ${money.format(f.mes.pesos)} al mes; con estos cambios, ${money.format(g.mes.pesos)}.`;
  r('luz').textContent = `${num(Math.max(0, f.mes.luz - g.mes.luz))} kWh`;
  r('min').textContent = f.abiertaMin >= 90 ? `${num(f.abiertaMin / 60, 1)} h` : `${num(f.abiertaMin)} min`;
  r('kw').textContent = `${num(f.qOpen, f.qOpen < 10 ? 1 : 0)} kW`;
  r('agua').textContent = `${num(Math.max(0, f.mes.hielo - g.mes.hielo))} L al mes`;
  const heaters = f.qOpen / 1.5;
  r('eq').textContent = heaters >= 1
    ? `Cada segundo que la puerta está abierta es como prender ${num(heaters)} calentadores eléctricos de 1,500 W dentro de la cámara: por eso cerrarla pronto ahorra tanto.`
    : 'Con esta diferencia de temperatura entra poco calor: el ahorro es chico.';
  sim.set({ velocidad: f.velocidad, alto: i.alto, tIn: i.tIn, tOut: i.tOut });
  // escenarios
  $('#fugaSc').innerHTML = escenarios(i).map((s) => `<li class="fuga__s"><p><b>${s.t}</b><span>${s.d}</span></p><p class="fuga__save"><b>${money.format(s.ahorro)}</b><span>de ahorro al mes (${num(s.pct * 100)} %)</span></p></li>`).join('');
  // WhatsApp con el resultado
  const texto = `Hola, calculé que puedo ahorrar unos ${money.format(ahorro)} al mes en luz con mi puerta de ${i.ancho} × ${i.alto} cm (${i.tIn} °C adentro, ${i.tOut} °C afuera, ${i.aperturas} aperturas al día). Quiero cotizar una puerta a la medida.`;
  if (!wa) { wa = waButton({ tipo: 'texto', texto }, { label: 'Mandarlo por WhatsApp' }); $('#fugaWA').replaceWith(wa); }
  waUpdate(wa, { tipo: 'texto', texto });
}
form.addEventListener('input', update);
form.addEventListener('submit', (e) => e.preventDefault());
$$('[data-uso]').forEach((b) => { b.onclick = () => { form.tIn.value = b.dataset.uso; st.hrIn = +b.dataset.uso <= -5 ? 80 : 85; update(); }; });
$$('[data-mej]').forEach((b) => { b.onclick = () => { const k = b.dataset.mej; st.mej[k] = !st.mej[k]; b.setAttribute('aria-pressed', String(st.mej[k])); update(); }; });
$$('[data-prot]').forEach((b) => { b.onclick = () => { st.proteccion = b.dataset.prot; $$('[data-prot]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); update(); }; });
$('#fugaDoor').onclick = (e) => {
  const open = !sim.open; sim.setOpen(open);
  e.currentTarget.setAttribute('aria-pressed', String(open)); e.currentTarget.textContent = open ? 'Cerrar la puerta' : 'Abrir la puerta';
};
// la medida es una sola para todo el sitio: al cotizar o verla con la cámara se guarda
const keep = () => { const i = read(); vano.set({ ancho: i.ancho, alto: i.alto }); return i; };
$('#fugaQuote').href = url('industriales/');
$('#fugaQuote').addEventListener('click', keep);
$('#fugaAR').onclick = async () => { const i = keep(); const fam = (vano.get().fam && vano.get().fam !== 'cds') ? vano.get().fam : 'abatible'; const { openAR } = await import('../ui/ar.js'); openAR(fam, { ancho: i.ancho, alto: i.alto }); };
update();
// barrita con el resultado: aparece cuando el resultado grande queda fuera de la pantalla y estás en los datos
const mini = $('#fugaMini');
let resVis = true, formVis = false;
const syncMini = () => { const on = !resVis && formVis; mini.classList.toggle('is-on', on); mini.setAttribute('aria-hidden', String(!on)); mini.tabIndex = on ? 0 : -1; };
new IntersectionObserver(([e]) => { resVis = e.isIntersecting; syncMini(); }).observe($('#fugaRes'));
new IntersectionObserver(([e]) => { formVis = e.isIntersecting; syncMini(); }, { rootMargin: '-35% 0px -35% 0px' }).observe(form);   // solo con los datos a media pantalla

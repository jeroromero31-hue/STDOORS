// Fase 10H · Cotizar a la medida. Las puertas industriales se fabrican a la medida del vano: cada puerta de la
// solicitud trae su medida (ancho × alto), su uso y hacia dónde abre, y se dibuja en un plano a escala, con una
// persona de 1.70 m al lado para darse idea del tamaño. Las CDS no son a la medida: se piden por juego, en medidas
// estándar (Fase 14C, datos de ST): ancho 23", 26" o 30" y alto 73"; la Legacy Plus solo en 23" y 26". Acabado negro,
// o cromo bajo pedido.

export const FAM_NAME = { abatible: 'Puerta abatible', corrediza: 'Puerta corrediza', vaiven: 'Puerta vaivén', cds: 'Juego CDS Legacy' };
export const famOf = (id) => (id.match(/^puerta-(abatible|corrediza|vaiven|cds)/) || [])[1] || null;
export const CDS_W = [23, 26, 30], CDS_H = [73], CDS_MOD = { advanced: 'Advanced', plus: 'Plus', lt: 'LT' };
export const CDS_ANCHOS = { advanced: [23, 26, 30], plus: [23, 26], lt: [23, 26, 30] };
export const CDS_ACABADO = { negro: 'Negro', cromo: 'Cromo' }, CDS_PEDIDO = { cromo: true };
const IN = 2.54;

// una configuración CDS siempre válida: alto 73", un ancho que exista para ese modelo (la Plus de 30" pasa a 26")
export function cdsFix(c = {}) {
  const modelo = CDS_MOD[c.modelo] ? c.modelo : 'advanced', anchos = CDS_ANCHOS[modelo];
  const w = +c.ancho, ancho = anchos.includes(w) ? w : anchos.filter((a) => a <= (w || 26)).pop() || anchos[0];
  return { ...c, puertas: Math.max(1, Math.min(12, Math.round(+c.puertas) || 3)), ancho, alto: CDS_H[0], modelo, acabado: CDS_ACABADO[c.acabado] ? c.acabado : 'negro' };
}

export function defaults(fam, item = {}) {
  if (fam === 'cds') {
    const m = Object.keys(CDS_MOD).find((k) => new RegExp(CDS_MOD[k], 'i').test(item.nombre || '')) || 'advanced';
    return { puertas: 3, ancho: 26, alto: 73, modelo: m, acabado: /-acabadocromo/.test(item.id || '') ? 'cromo' : 'negro' };
  }
  return { ancho: '', alto: '', sinMedida: false, uso: 'refrigeracion', mano: 'derecha', hojas: 1 };   // vaivén: de una hoja, como se presenta (14C)
}

const cmOf = (inch) => Math.round(inch * IN);
// Campos del juego CDS, los mismos en «A tu medida» y en Cotizar: puertas, modelo, ancho, alto (fijo) y acabado.
// Los botones llevan data-k / data-v; quien los monta guarda el cambio y llama a cdsSync para dejarlos al día.
export function cdsFields(c, uid, sm = false) {
  const ch = sm ? 'chip chip--sm' : 'chip', anchos = CDS_ANCHOS[c.modelo];
  const row = (k, label, opts, extra = '') => `<div class="q-f"><span class="q-f__l" id="c${k}-${uid}">${label}</span><div class="chips${k === 'acabado' ? ' q-fin' : ''}" role="group" aria-labelledby="c${k}-${uid}">${opts}</div>${extra}</div>`;
  return `
    <div class="q-f"><span class="q-f__l" id="cn-${uid}">Puertas en el juego</span>
      <div class="q-qty" role="group" aria-labelledby="cn-${uid}"><button type="button" data-n="-1" aria-label="Una puerta menos">−</button><output data-out="puertas">${c.puertas}</output><button type="button" data-n="1" aria-label="Una puerta más">+</button></div></div>
    ${row('modelo', 'Modelo', Object.entries(CDS_MOD).map(([v, t]) => `<button type="button" class="${ch}" data-k="modelo" data-v="${v}" aria-pressed="${c.modelo === v}">${t}</button>`).join(''))}
    ${row('ancho', 'Ancho de cada puerta', CDS_W.map((w) => `<button type="button" class="${ch} chip--in" data-k="ancho" data-v="${w}" aria-pressed="${c.ancho === w}"${anchos.includes(w) ? '' : ' disabled'}>${w}"<small>${cmOf(w)} cm</small></button>`).join(''),
      `<p class="q-note t-small" data-cds-note${c.modelo === 'plus' ? '' : ' hidden'}>La Plus se fabrica en 23" y 26".</p>`)}
    <div class="q-f"><span class="q-f__l">Alto</span><p class="q-fixed"><b>73"</b> <span>${cmOf(73)} cm · el alto estándar</span></p></div>
    ${row('acabado', 'Acabado', Object.entries(CDS_ACABADO).map(([v, t]) => `<button type="button" class="${ch}" data-k="acabado" data-v="${v}" aria-pressed="${c.acabado === v}"><i aria-hidden="true"></i>${t}${CDS_PEDIDO[v] ? '<small class="chip__tag">Bajo pedido</small>' : ''}</button>`).join(''),
      `<p class="q-note t-small" data-cds-pedido${c.acabado === 'cromo' ? '' : ' hidden'}>El cromo se fabrica bajo pedido.</p>`)}`;
}
export function cdsSync(root, c) {
  const anchos = CDS_ANCHOS[c.modelo];
  root.querySelectorAll('.chip[data-k][data-v]').forEach((b) => {
    const k = b.dataset.k; if (!(k in c)) return;
    b.setAttribute('aria-pressed', String(String(c[k]) === b.dataset.v));
    if (k === 'ancho') b.disabled = !anchos.includes(+b.dataset.v);
  });
  const out = root.querySelector('[data-out="puertas"]'); if (out) out.textContent = c.puertas;
  const note = root.querySelector('[data-cds-note]'); if (note) note.hidden = c.modelo !== 'plus';
  const ped = root.querySelector('[data-cds-pedido]'); if (ped) ped.hidden = c.acabado !== 'cromo';
}

// «1.2» o «1,20» se toma como metros; lo demás, en centímetros
export function toCm(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  if (!isFinite(n) || n <= 0) return '';
  return Math.round(n < 10 ? n * 100 : n);
}
const m2 = (a, b) => (a * b / 10000).toFixed(2);
const ACABADO = { hygienicWhite: 'blanco sanitario', stainless: 'inoxidable', blackMetal: 'negro' };

// una línea de texto para el mensaje de la solicitud
export function describe(fam, c) {
  if (!c) return '';
  if (fam === 'cds') { c = cdsFix(c); return `${c.puertas} ${c.puertas === 1 ? 'puerta' : 'puertas'} de ${c.ancho}" × ${c.alto}" (${cmOf(c.ancho)} × ${cmOf(c.alto)} cm cada una), modelo ${CDS_MOD[c.modelo]}, acabado ${CDS_ACABADO[c.acabado].toLowerCase()}${CDS_PEDIDO[c.acabado] ? ' (bajo pedido)' : ''}`; }
  const parts = [];
  if (c.acabado && ACABADO[c.acabado]) parts.push(`acabado ${ACABADO[c.acabado]}`);
  if (c.sinMedida || !c.ancho || !c.alto) parts.push(c.sinMedida ? 'medida del vano por tomar en visita' : 'medida del vano por confirmar');
  else parts.push(`vano de ${c.ancho} × ${c.alto} cm (${m2(c.ancho, c.alto)} m²)`);
  if (fam === 'vaiven') parts.push(c.hojas === 1 ? 'una hoja' : 'dos hojas');
  else parts.push(c.uso === 'congelacion' ? 'congelación' : 'refrigeración');
  if (fam === 'abatible') parts.push(`bisagras a la ${c.mano}`);
  if (fam === 'corrediza') parts.push(`abre corriendo hacia la ${c.mano}`);
  return parts.join(', ');
}

// ---------- plano a escala (SVG) ----------
const VW = 360, VH = 230, G = 188;   // ancho y alto del dibujo; línea del piso
export function plano(fam, c) {
  const cds = fam === 'cds';
  const known = cds || (c.ancho && c.alto && !c.sinMedida);
  const W = cds ? c.ancho * IN : (known ? +c.ancho : 100), H = cds ? c.alto * IN : (known ? +c.alto : 210);
  const n = cds ? c.puertas : (fam === 'vaiven' ? c.hojas : 1), FR = cds ? 5 : 0;
  const setW = cds ? n * W + 2 * FR : W, rail = fam === 'corrediza' ? W + 12 : 0;
  const left = fam === 'corrediza' && c.mano === 'izquierda';
  const PERSON = 75;                           // persona (45 cm) más 30 cm de aire
  const k = Math.min(150 / Math.max(H + 16, 190), (VW - 56) / (PERSON + setW + rail + 20));
  const X = (cm) => +(cm * k).toFixed(2);
  const x0 = 14, dx = x0 + X(PERSON) + (left ? X(rail) : 0), top = G - X(H);
  const s = [];
  // piso y persona de 1.70 m
  s.push(`<line class="pl-g" x1="0" y1="${G}" x2="${VW}" y2="${G}"/>`);
  s.push(`<g class="pl-p"><circle cx="${x0 + X(22)}" cy="${G - X(159)}" r="${X(11)}"/><rect x="${x0}" y="${G - X(146)}" width="${X(44)}" height="${X(146)}" rx="${X(18)}"/></g>`);
  s.push(`<text class="pl-s" x="${x0 + X(22)}" y="${G - X(176)}" text-anchor="middle">1.70 m</text>`);
  if (cds) {
    s.push(`<rect class="pl-f" x="${dx}" y="${top - X(FR)}" width="${X(setW)}" height="${X(H + FR)}"/>`);
    for (let i = 0; i < n; i++) {
      const x = dx + X(FR + i * W), gl = X(6);
      s.push(`<rect class="pl-d" x="${x}" y="${top}" width="${X(W)}" height="${X(H)}"/>`);
      s.push(`<rect class="pl-glass" x="${x + gl}" y="${top + gl}" width="${X(W) - 2 * gl}" height="${X(H) - 2 * gl}"/>`);
      for (let r = 1; r <= 5; r++) s.push(`<line class="pl-sh" x1="${x + gl}" x2="${x + X(W) - gl}" y1="${top + gl + (X(H) - 2 * gl) * r / 6}" y2="${top + gl + (X(H) - 2 * gl) * r / 6}"/>`);
      s.push(`<rect class="pl-h" x="${x + X(W) - gl - X(4)}" y="${top + X(H) * 0.35}" width="${X(2.5)}" height="${X(H) * 0.3}"/>`);
    }
  } else if (fam === 'corrediza') {
    const ext = X(5), dir = left ? -1 : 1;
    s.push(`<rect class="pl-v" x="${dx}" y="${top}" width="${X(W)}" height="${X(H)}"/>`);
    const rx = left ? dx - X(rail) : dx;
    s.push(`<rect class="pl-r" x="${rx - ext}" y="${top - X(16)}" width="${X(W + rail) + 2 * ext}" height="${X(7)}" rx="${X(3)}"/>`);
    s.push(`<rect class="pl-d" x="${dx - ext}" y="${top - X(5)}" width="${X(W) + 2 * ext}" height="${X(H + 5)}"/>`);
    const hx = left ? dx + X(W) - X(12) : dx + X(10);
    s.push(`<rect class="pl-h" x="${hx}" y="${top + X(H) * 0.42}" width="${X(2.5)}" height="${X(30)}"/>`);
    const ay = top + X(H) * 0.25, ax = dx + X(W) / 2;
    s.push(`<path class="pl-a" d="M${ax - dir * X(W) * 0.22} ${ay} H${ax + dir * X(W) * 0.22} m${-dir * 6} -5 l${dir * 6} 5 l${-dir * 6} 5"/>`);
  } else {
    // abatible y vaivén: hoja(s) dentro del marco
    s.push(`<rect class="pl-f" x="${dx - X(4)}" y="${top - X(4)}" width="${X(W + 8)}" height="${X(H + 4)}"/>`);
    const lw = W / n;
    for (let i = 0; i < n; i++) {
      const x = dx + X(i * lw), w = X(lw);
      s.push(`<rect class="pl-d" x="${x}" y="${top}" width="${w}" height="${X(H)}"/>`);
      if (fam === 'vaiven') {
        const ow = Math.min(w * 0.36, X(26)), oh = X(H) * 0.3;
        s.push(`<rect class="pl-glass" x="${x + w / 2 - ow / 2}" y="${top + X(H) * 0.16}" width="${ow}" height="${oh}" rx="${ow / 2}"/>`);
        s.push(`<rect class="pl-b" x="${x + X(3)}" y="${G - X(H) * 0.47}" width="${w - X(6)}" height="${X(H) * 0.07}"/>`);
        s.push(`<rect class="pl-k" x="${x + X(2)}" y="${G - X(H) * 0.26}" width="${w - X(4)}" height="${X(H) * 0.26 - X(2)}"/>`);
        const hx = i === 0 ? x : x + w;
        [0.14, 0.82].forEach((t) => s.push(`<rect class="pl-hi" x="${hx - X(2)}" y="${top + X(H) * t}" width="${X(4)}" height="${X(12)}"/>`));
      } else {
        const hingeR = c.mano === 'derecha', hx = hingeR ? x + w : x, fx = hingeR ? x : x + w;
        [0.12, 0.8].forEach((t) => s.push(`<rect class="pl-hi" x="${hx - X(2.5)}" y="${top + X(H) * t}" width="${X(5)}" height="${X(14)}"/>`));
        s.push(`<path class="pl-sw" d="M${fx} ${top} L${hx} ${top + X(H) / 2} L${fx} ${G}"/>`);
        s.push(`<rect class="pl-h" x="${hingeR ? x + X(8) : x + w - X(11)}" y="${top + X(H) * 0.47}" width="${X(3)}" height="${X(18)}"/>`);
      }
    }
    if (fam === 'vaiven') s.push(`<path class="pl-a" d="M${dx + X(W) / 2 - 10} ${top - X(10)} h20 m-4 -4 l4 4 l-4 4 M${dx + X(W) / 2 - 10} ${top - X(10)} m4 -4 l-4 4 l4 4"/>`);
  }
  // cotas: ancho abajo, alto a la derecha
  const dw = cds ? W : W, cx0 = cds ? dx + X(FR) : dx, cx1 = cx0 + X(dw), cy = G + 16;
  const wl = cds ? `${c.ancho}"` : known ? `${c.ancho} cm` : 'ancho ?';
  const hl = cds ? `${c.alto}"` : known ? `${c.alto} cm` : 'alto ?';
  s.push(`<g class="pl-c"><line x1="${cx0}" x2="${cx1}" y1="${cy}" y2="${cy}"/><line x1="${cx0}" x2="${cx0}" y1="${cy - 5}" y2="${cy + 5}"/><line x1="${cx1}" x2="${cx1}" y1="${cy - 5}" y2="${cy + 5}"/></g>`);
  s.push(`<text class="pl-t${known ? '' : ' is-q'}" x="${(cx0 + cx1) / 2}" y="${cy + 15}" text-anchor="middle">${wl}</text>`);
  const vx = Math.min(VW - 26, (fam === 'corrediza' && !left ? dx + X(W + rail) + 4 : dx + X(setW)) + 14);
  s.push(`<g class="pl-c"><line x1="${vx}" x2="${vx}" y1="${top}" y2="${G}"/><line x1="${vx - 5}" x2="${vx + 5}" y1="${top}" y2="${top}"/><line x1="${vx - 5}" x2="${vx + 5}" y1="${G}" y2="${G}"/></g>`);
  s.push(`<text class="pl-t${known ? '' : ' is-q'}" transform="translate(${vx + 13} ${(top + G) / 2}) rotate(-90)" text-anchor="middle">${hl}</text>`);
  const label = cds ? `Plano: juego de ${n} puertas CDS de ${c.ancho} por ${c.alto} pulgadas, junto a una persona de 1.70 m`
    : `Plano: ${FAM_NAME[fam].toLowerCase()}${known ? ` de ${c.ancho} por ${c.alto} centímetros` : ', medida por definir'}, junto a una persona de 1.70 m`;
  return `<svg class="plano" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${label}">${s.join('')}</svg>`;
}

// Fase 11 · Vista previa en vivo: la puerta dibujada de frente, a escala, con su acabado, su medida y sus opciones,
// junto a una persona de 1.70 m. Cambia al instante mientras el cliente configura (Inicio, Cotizar). Es un dibujo
// ligero (SVG, sin descargas); el 3D a la medida se abre con «Mírala en 3D».
import { CDS_MOD } from './medida.js';

const IN = 2.54;
let uid = 0;
export const ACABADO_NOMBRE = { hygienicWhite: 'Blanco sanitario', stainless: 'Inoxidable', blackMetal: 'Negro' };
export const ACABADOS_DE = { abatible: ['hygienicWhite', 'stainless', 'blackMetal'], vaiven: ['blackMetal', 'stainless', 'hygienicWhite'], corrediza: [], cds: [] };
// medida que se dibuja cuando aún no hay una (cm)
export const MEDIDA_TIPICA = { abatible: [100, 210], corrediza: [180, 250], vaiven: [180, 230] };

// gradientes y tramas de cada acabado; un id propio por dibujo para que convivan varios en la misma página
function defs(id) {
  return `<defs>
    <linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfcfa"/><stop offset="1" stop-color="#e3e7e3"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="#d9dcde"/><stop offset=".45" stop-color="#aeb3b6"/><stop offset=".7" stop-color="#c8cbcd"/><stop offset="1" stop-color="#b4b8bb"/></linearGradient>
    <pattern id="${id}br" width="4" height="60" patternUnits="userSpaceOnUse"><rect x=".5" width=".5" height="60" fill="#fff" opacity=".28"/><rect x="2.6" width=".4" height="60" fill="#5d6468" opacity=".12"/></pattern>
    <linearGradient id="${id}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36393d"/><stop offset=".5" stop-color="#1d1e20"/><stop offset="1" stop-color="#252729"/></linearGradient>
    <linearGradient id="${id}al" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3e7ea"/><stop offset=".5" stop-color="#a9b0b5"/><stop offset="1" stop-color="#d4d9dc"/></linearGradient>
    <pattern id="${id}d" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#c3c8cb"/><path d="M1.2 5.6l2.4-2.4M3.6 5.6L6 3.2" stroke="#8d9498" stroke-width="1.1" stroke-linecap="round"/></pattern>
    <linearGradient id="${id}cr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".22" stop-color="#b9c0c5"/><stop offset=".5" stop-color="#eef1f3"/><stop offset=".78" stop-color="#9ea6ac"/><stop offset="1" stop-color="#dfe3e6"/></linearGradient>
    <linearGradient id="${id}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6fb"/><stop offset="1" stop-color="#cfe6ef"/></linearGradient>
  </defs>`;
}
const FILL = { hygienicWhite: 'w', stainless: 's', blackMetal: 'k' };
// inoxidable: degradado y, encima, vetas finas de cepillado
const face = (id, fin, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}${fin})"/>${fin === 's' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}br)"/>` : ''}`;

/**
 * @param {'abatible'|'corrediza'|'vaiven'|'cds'} fam
 * @param {object} c configuración: { ancho, alto (cm; en CDS, pulgadas), acabado, mano, hojas, puertas, modelo, sinMedida }
 */
export function doorArt(fam, c = {}) {
  const id = `dp${++uid}`, VW = 360, VH = 262, G = 222;
  const cds = fam === 'cds';
  const known = cds || (+c.ancho > 0 && +c.alto > 0 && !c.sinMedida);
  const [tw, th] = MEDIDA_TIPICA[fam] || [100, 210];
  const W = cds ? (c.ancho || 26) * IN : (known ? +c.ancho : tw), H = cds ? (c.alto || 73) * IN : (known ? +c.alto : th);
  const n = cds ? (c.puertas || 3) : 1, FR = cds ? 6 : 8;           // marco (cm)
  const setW = cds ? n * W + 2 * FR : W + 2 * FR, rail = fam === 'corrediza' ? W + 10 : 0;
  const left = c.mano === 'izquierda';
  const PERSON = 78;
  const k = Math.min(178 / Math.max(H + FR + 22, 200), (VW - 70) / (PERSON + setW + rail + 16));
  const X = (cm) => +(cm * k).toFixed(2);
  const x0 = 16, dx = x0 + X(PERSON) + (fam === 'corrediza' && left ? X(rail) : 0), top = G - X(H);
  const fin = FILL[c.acabado] || FILL[(ACABADOS_DE[fam] || [])[0]] || 'w';
  const s = [defs(id)];
  // muro de paneles y piso
  s.push(`<rect class="dp-wall" x="0" y="0" width="${VW}" height="${G}"/>`);
  for (let x = 40; x < VW; x += 74) s.push(`<line class="dp-joint" x1="${x}" x2="${x}" y1="0" y2="${G}"/>`);
  s.push(`<rect class="dp-floor" x="0" y="${G}" width="${VW}" height="${VH - G}"/>`);
  // persona de 1.70 m
  s.push(`<g class="dp-person"><circle cx="${x0 + X(22)}" cy="${G - X(160)}" r="${X(11)}"/><path d="M${x0 + X(4)} ${G} V${G - X(118)} q0 ${-X(30)} ${X(18)} ${-X(30)} h${X(8)} q${X(18)} 0 ${X(18)} ${X(30)} V${G}Z"/></g>`);
  s.push(`<text class="dp-s" x="${x0 + X(22)}" y="${G - X(178)}" text-anchor="middle">1.70 m</text>`);
  if (cds) {
    // juego CDS: marco negro (o cromo, bajo pedido), puertas de vidrio con parrillas y productos
    const fx = dx, fw = X(setW), ft = top - X(FR), cr = c.acabado === 'cromo', mk = cr ? 'cr' : 'k';
    s.push(`<rect class="dp-shadow" x="${fx + 3}" y="${ft + 4}" width="${fw}" height="${G - ft - 4}"/>`);
    s.push(`<rect x="${fx}" y="${ft}" width="${fw}" height="${G - ft}" fill="url(#${id}${mk})"/>`);
    const COLORS = ['#c8423b', '#e2a33a', '#3f8f4e', '#2f6fa8', '#d9d2c4', '#7a4a2e'];
    for (let i = 0; i < n; i++) {
      const x = dx + X(FR + i * W), w = X(W), gx = x + X(3.5), gw = w - X(7), gy = top + X(3.5), gh = X(H) - X(7);
      s.push(`<rect x="${x}" y="${top}" width="${w}" height="${X(H)}" fill="url(#${id}${mk})" stroke="${cr ? '#8d959b' : '#0d0e0f'}" stroke-width=".6"/>`);
      s.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="url(#${id}gl)"/>`);
      for (let r = 1; r <= 5; r++) {
        const y = gy + gh * r / 6;
        s.push(`<line class="dp-shelf" x1="${gx}" x2="${gx + gw}" y1="${y}" y2="${y}"/>`);
        const pw = Math.max(2, gw / 9), ph = Math.min(gh / 6 - 3, X(26));
        for (let p = 0; p < 7; p++) s.push(`<rect x="${(gx + 2 + p * (gw - 4) / 7).toFixed(1)}" y="${(y - ph).toFixed(1)}" width="${(pw * 0.8).toFixed(1)}" height="${ph.toFixed(1)}" rx="1" fill="${COLORS[(r + i + Math.floor(p / 3)) % COLORS.length]}" opacity=".85"/>`);
      }
      s.push(`<rect x="${gx}" y="${gy}" width="${gw * 0.35}" height="${gh}" fill="#fff" opacity=".18"/>`);
      s.push(`<rect x="${x + w - X(5)}" y="${top + X(H) * 0.32}" width="${X(2.4)}" height="${X(H) * 0.36}" rx="1" fill="${cr ? '#c9cfd3' : '#0a0b0c'}"${cr ? ' stroke="#7f878d" stroke-width=".5"' : ''}/>`);
    }
    s.push(`<rect x="${fx}" y="${ft}" width="${fw}" height="${X(FR) * 0.9}" fill="${cr ? '#aeb5ba' : '#111214'}"/>`);
  } else if (fam === 'corrediza') {
    const ext = X(6), rx = left ? dx - X(rail) : dx;
    s.push(`<rect class="dp-hole" x="${dx}" y="${top}" width="${X(W)}" height="${X(H)}"/>`);
    s.push(`<rect x="${rx - ext}" y="${top - X(22)}" width="${X(W + rail) + 2 * ext}" height="${X(12)}" rx="${X(3)}" fill="url(#${id}al)" stroke="#8a9196" stroke-width=".6"/>`);
    const lx = dx - ext, lw = X(W) + 2 * ext;
    s.push(`<rect class="dp-shadow" x="${lx + 3}" y="${top - X(8) + 4}" width="${lw}" height="${X(H + 8) - 4}"/>`);
    s.push(`<rect x="${lx}" y="${top - X(8)}" width="${lw}" height="${X(H + 8)}" fill="url(#${id}w)" stroke="url(#${id}al)" stroke-width="${Math.max(1.5, X(4))}"/>`);
    const hx = left ? lx + lw - X(16) : lx + X(10);
    s.push(`<rect x="${hx}" y="${top + X(H) * 0.4}" width="${X(5)}" height="${X(40)}" rx="${X(2)}" fill="url(#${id}al)" stroke="#7f878c" stroke-width=".5"/>`);
    const ay = top - X(36), ax = lx + lw / 2, dir = left ? -1 : 1;
    s.push(`<path class="dp-arrow" d="M${ax - dir * lw * 0.2} ${ay} H${ax + dir * lw * 0.2} m${-dir * 6} -5 l${dir * 6} 5 l${-dir * 6} 5"/>`);
  } else {
    // abatible y vaivén: marco y hoja(s)
    const fx = dx, fw = X(setW), ft = top - X(FR);
    const frameFill = fam === 'vaiven' ? `url(#${id}al)` : (c.acabado === 'stainless' ? `url(#${id}s)` : `url(#${id}w)`);
    s.push(`<rect class="dp-shadow" x="${fx + 3}" y="${ft + 4}" width="${fw}" height="${G - ft - 4}"/>`);
    s.push(`<rect x="${fx}" y="${ft}" width="${fw}" height="${G - ft}" fill="${frameFill}" stroke="#aab2b7" stroke-width=".6"/>`);
    const hojas = fam === 'vaiven' ? (c.hojas === 1 ? 1 : 2) : 1, lw = W / hojas;
    for (let i = 0; i < hojas; i++) {
      const x = dx + X(FR + i * lw), w = X(lw), y = top, h = X(H) - 1;
      // perfil perimetral de aluminio y cara con el acabado
      s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}al)"/>`);
      const p = Math.max(1.2, X(4));
      s.push(face(id, fin, x + p, y + p, w - 2 * p, h - 2 * p));
      if (fam === 'abatible') {
        const bh = X(Math.min(92, H * 0.44));
        s.push(`<rect x="${x + p}" y="${G - bh}" width="${w - 2 * p}" height="${bh - p}" fill="url(#${id}d)"/>`);
        s.push(`<rect x="${x + p}" y="${G - bh - 1}" width="${w - 2 * p}" height="${Math.max(1.4, X(3))}" fill="url(#${id}al)"/>`);
        // chapa: cuerpo gris y palanca negra, del lado contrario a las bisagras
        const hingeR = c.mano === 'derecha', lx = hingeR ? x + X(10) : x + w - X(10) - X(8), ly = G - X(108);
        s.push(`<rect x="${lx}" y="${ly}" width="${X(8)}" height="${X(18)}" rx="${X(2)}" fill="#9a9ea2"/><rect x="${lx + X(0.6)}" y="${ly + X(10)}" width="${X(4)}" height="${X(10)}" rx="${X(0.8)}" fill="#151618"/><ellipse cx="${lx + X(3)}" cy="${ly + X(20.5)}" rx="${X(3.4)}" ry="${X(2.4)}" fill="#151618"/>`);
        const hx = hingeR ? x + w : x;
        [0.1, 0.84].forEach((t) => s.push(`<rect x="${hx - X(3)}" y="${y + X(H) * t}" width="${X(6)}" height="${X(17)}" rx="${X(1.5)}" fill="#a3a8ab" stroke="#7d8488" stroke-width=".5"/>`));
      } else {
        // vaivén: ventanilla ovalada, bumper y placa de pateo
        const ow = Math.min(w * 0.34, X(28)), oh = X(H) * 0.27;
        s.push(`<rect x="${x + w / 2 - ow / 2}" y="${y + X(H) * 0.14}" width="${ow}" height="${oh}" rx="${ow / 2}" fill="url(#${id}gl)" stroke="#1d1f21" stroke-width="${Math.max(1.4, X(3))}"/>`);
        const bt = { 150: 15, 500: 50, 1000: 100 }[c.bumper] || 15;
        s.push(`<rect x="${x + p}" y="${G - X(H) * 0.45}" width="${w - 2 * p}" height="${Math.max(2, X(bt * 0.25 + 6))}" fill="#141516"/>`);
        s.push(face(id, 's', x + p, G - X(28), w - 2 * p, X(28) - p));
        const hx = i === 0 ? x : x + w;
        [0.12, 0.84].forEach((t) => s.push(`<rect x="${hx - X(2.5)}" y="${y + X(H) * t}" width="${X(5)}" height="${X(14)}" rx="${X(1)}" fill="#3a3d40"/>`));
      }
    }
  }
  // cotas: ancho abajo, alto a la derecha
  const cx0 = cds ? dx + X(FR) : dx + (fam === 'corrediza' ? 0 : X(FR)), cx1 = cx0 + X(cds ? W : W), cy = G + 16;
  const wl = cds ? `${c.ancho || 26}"` : known ? `${c.ancho} cm` : 'ancho ?';
  const hl = cds ? `${c.alto || 73}"` : known ? `${c.alto} cm` : 'alto ?';
  s.push(`<g class="dp-c"><line x1="${cx0}" x2="${cx1}" y1="${cy}" y2="${cy}"/><line x1="${cx0}" x2="${cx0}" y1="${cy - 5}" y2="${cy + 5}"/><line x1="${cx1}" x2="${cx1}" y1="${cy - 5}" y2="${cy + 5}"/></g>`);
  s.push(`<text class="dp-t${known ? '' : ' is-q'}" x="${(cx0 + cx1) / 2}" y="${cy + 15}" text-anchor="middle">${wl}${cds && n > 1 ? ' c/u' : ''}</text>`);
  const vx = Math.min(VW - 22, (fam === 'corrediza' && !left ? dx + X(W + rail) + 4 : dx + X(setW)) + 12);
  s.push(`<g class="dp-c"><line x1="${vx}" x2="${vx}" y1="${top}" y2="${G}"/><line x1="${vx - 5}" x2="${vx + 5}" y1="${top}" y2="${top}"/><line x1="${vx - 5}" x2="${vx + 5}" y1="${G}" y2="${G}"/></g>`);
  s.push(`<text class="dp-t${known ? '' : ' is-q'}" transform="translate(${vx + 12} ${(top + G) / 2}) rotate(-90)" text-anchor="middle">${hl}</text>`);
  const nom = { abatible: 'Puerta abatible', corrediza: 'Puerta corrediza', vaiven: 'Puerta vaivén', cds: 'Juego CDS Legacy' }[fam];
  const label = cds ? `${nom} ${CDS_MOD[c.modelo] || ''}: ${n} puertas de ${c.ancho || 26} por ${c.alto || 73} pulgadas${c.acabado === 'cromo' ? ', acabado cromo' : ''}, junto a una persona de 1.70 m`
    : `${nom}${c.acabado ? `, ${ACABADO_NOMBRE[c.acabado].toLowerCase()}` : ''}${known ? `, de ${c.ancho} por ${c.alto} centímetros` : ', medida por definir'}, junto a una persona de 1.70 m`;
  return `<svg class="dprev" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${label}">${s.join('')}</svg>`;
}

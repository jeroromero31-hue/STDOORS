// Fase 10K · ¿Cuánto frío se escapa por la puerta? Cálculo (sin interfaz).
//
// Método de Gosney y Olama (1975), el que usa ASHRAE para el aire que se intercambia por la puerta de una cámara
// frigorífica: con la puerta abierta, el aire frío (más pesado) sale por abajo y el tibio entra por arriba.
//   q_lleno = 0.221 · A · ρ_frío · F_densidad · √((1 − ρ_tibio/ρ_frío) · g · H) · (h_tibio − h_frío)        [kW]
//   F_densidad = [2 / (1 + (ρ_frío/ρ_tibio)^(1/3))]^1.5
//   q_promedio = q_lleno · F_flujo · D_t · (1 − E)
//     F_flujo (factor de flujo en la puerta) = 0.8 si la diferencia de temperatura pasa de 11 °C; si no, 1.1
//     D_t (fracción del día abierta) = (aperturas · segundos por apertura + 60 · minutos que se queda abierta) / 86 400
//     E (protección) = 0 sin protección, 0.5 cortina de aire, 0.9 cortina de tiras (hawaiana)
// Aire húmedo: presión por altitud (atmósfera estándar), presión de saturación de Magnus (agua y hielo), relación de
// humedad, entalpía y densidad por kilogramo de aire seco. La luz que cuesta reponer ese frío: carga ÷ COP del equipo
// (supuesto: 2.5 en refrigeración, 1.5 en congelación).
export const PROTECCION = { ninguna: { e: 0, label: 'Sin protección' }, aire: { e: 0.5, label: 'Cortina de aire' }, tiras: { e: 0.9, label: 'Cortina hawaiana (de tiras)' } };
const G = 9.81;
const pressure = (alt) => 101.325 * Math.pow(1 - 2.25577e-5 * alt, 5.25588);                 // kPa
const psat = (t) => (t >= 0 ? 0.61094 * Math.exp((17.625 * t) / (t + 243.04)) : 0.61115 * Math.exp((22.452 * t) / (272.55 + t)));   // kPa
export function air(t, rh, alt = 0) {
  const P = pressure(alt), pw = Math.min(0.99, rh / 100) * psat(t);
  const W = (0.621945 * pw) / (P - pw);                                                      // kg agua / kg aire seco
  const h = 1.006 * t + W * (2501 + 1.86 * t);                                               // kJ / kg aire seco
  const rho = P / (0.287042 * (t + 273.15) * (1 + 1.607858 * W));                            // kg aire seco / m³
  return { P, W, h, rho };
}
export const copFor = (tIn) => (tIn <= -5 ? 1.5 : 2.5);

export function fuga(i) {
  const A = (i.ancho / 100) * (i.alto / 100), H = i.alto / 100;
  const cold = air(i.tIn, i.hrIn, i.alt), warm = air(i.tOut, i.hrOut, i.alt);
  const dRho = 1 - warm.rho / cold.rho;
  if (!(A > 0) || dRho <= 0) return null;
  const Fd = Math.pow(2 / (1 + Math.pow(cold.rho / warm.rho, 1 / 3)), 1.5);
  const B = 0.221 * A * cold.rho * Fd * Math.sqrt(dRho * G * H);                             // kg aire seco / s
  const Ff = i.tOut - i.tIn > 11 ? 0.8 : 1.1;
  const E = (PROTECCION[i.proteccion] || PROTECCION.ninguna).e;
  const qOpen = B * (warm.h - cold.h) * Ff;                                                  // kW mientras está abierta
  const Dt = Math.min(1, (i.aperturas * i.segundos + 60 * i.minutos) / 86400);
  const qAvg = qOpen * Dt * (1 - E);                                                         // kW promedio
  const cop = copFor(i.tIn);
  const termDia = qAvg * 24, luzDia = termDia / cop;                                         // kWh de frío y de luz
  const hieloDia = B * Ff * Dt * (1 - E) * 86400 * Math.max(0, warm.W - cold.W);             // kg de agua que se vuelve escarcha
  return {
    qOpen, qAvg, Dt, cop, flujo: B * Ff, abiertaMin: Dt * 1440,
    mes: { frio: termDia * 30, luz: luzDia * 30, pesos: luzDia * 30 * i.precio, hielo: hieloDia * 30 },
    año: { pesos: luzDia * 365 * i.precio, luz: luzDia * 365 },
    velocidad: Math.sqrt(dRho * G * H),                                                      // escala de la corriente, m/s
  };
}
// «¿Qué cambia si…?»: escenarios sobre los datos actuales
export function escenarios(i) {
  const base = fuga(i); if (!base) return [];
  const list = [
    { id: 'rapida', t: 'Cada apertura dura la mitad', d: `${Math.round(i.segundos / 2)} s en vez de ${i.segundos} s`, cambio: { segundos: i.segundos / 2 } },
    i.minutos > 0 ? { id: 'cerrada', t: 'No se queda abierta', d: `Sin los ${i.minutos} min al día que se queda abierta`, cambio: { minutos: 0 } } : null,
    i.proteccion !== 'tiras' ? { id: 'tiras', t: 'Con cortina hawaiana', d: 'Tiras de PVC en el vano', cambio: { proteccion: 'tiras' } } : null,
    { id: 'menos', t: 'La mitad de aperturas', d: `${Math.round(i.aperturas / 2)} al día en vez de ${i.aperturas}`, cambio: { aperturas: i.aperturas / 2 } },
  ].filter(Boolean);
  return list.map((s) => { const r = fuga({ ...i, ...s.cambio }); const ahorro = base.mes.pesos - r.mes.pesos; return { ...s, ahorro, pct: base.mes.pesos > 0 ? ahorro / base.mes.pesos : 0 }; });
}

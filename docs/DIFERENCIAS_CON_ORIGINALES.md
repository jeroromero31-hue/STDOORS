# Diferencias con los modelos originales

Los archivos de `01_MODELOS_ORIGINALES` no se modificaron. Aquí se registra en qué se aparta cada visor nuevo de su modelo base y por qué.

## Puerta abatible (Fase 3A)

Base: `ABATIBLE_MODELO_BASE.html`. Las medidas de hoja, marco, perfil, empaque, bisagras y logo se copiaron tal cual.

| Elemento | Modelo base | Visor nuevo | Motivo |
|---|---|---|---|
| Chapa exterior | Caja gris genérica con cilindro redondo, palanca centrada y jaladera en bloque | Cuerpo gris de 84 × 172 × 50 mm con la parte alta inclinada, cilindro de perfil europeo arriba a la izquierda, palanca negra sobre la mitad izquierda y jaladera en lóbulo | Fotografía `ABATIBLE_CHAPA_REAL_REFERENCIA_OBLIGATORIA.png` |
| Contrapieza | Bloque gris sobre la cara del marco, junto a la hoja | Pieza gris en el canto del marco, cubierta por la hoja al cerrar | Misma fotografía |
| Altura de la chapa | Base del cuerpo a 0.98 m | Base del cuerpo a 1.01 m | La jaladera nueva chocaba con el remate del bumper |
| Bumper | 4 opciones (inox, negro, blanco, sin bumper) y altura ajustable | Solo inox diamante, a 0.92 m (la altura inicial del modelo base) | Matriz de acabados y brief |
| Acabados de hoja | Materiales propios del visor | `blackMetal`, `stainless` y `hygienicWhite` del registro compartido | Brief §4 |
| Cara posterior de la hoja | Blanca, o negra con hoja negra | Mismo acabado que la cara frontal | Simplificación; por confirmar |
| Marco | Selector blanco / inoxidable | Sin selector: inoxidable con hoja inoxidable, blanco con las otras dos | Así aparece en las fotos de instalaciones; por confirmar |
| Eje de giro | 27.5 mm por delante del barril de las bisagras: al abrir, la mitad móvil del barril se separaba de la fija hasta 39 mm | Sobre el centro del barril: las dos mitades quedan concéntricas en todo el recorrido (0.000 mm medidos) | Checklist: "bisagras mantienen pivote" |
| Apertura máxima | 100° | 95° | Con el eje corregido, a más de 95° el canto de la hoja toca el cuerpo fijo de la bisagra |
| Interior del vano | Caja azul claro con luz | Azul marino de la marca | Concepto de la Fase 1: blanco afuera, azul marino adentro |
| Controles | 17 botones y 2 deslizadores en un panel lateral | 3: abrir o cerrar, acabado y ver por dentro | Brief §8 |

**Medidas estimadas:** la chapa se dimensionó a partir de la fotografía, sin plano. Sus medidas reales pueden diferir.

## Puerta corrediza (Fase 3B)

Base: `CORREDIZA_VFINAL_MODELO_BASE.html`. La geometría y la trayectoria no se copiaron a mano: se extraen del archivo original con `scripts/convert-corrediza.mjs` y se comprueban con `scripts/verify-corrediza.mjs`.

### Lo que no cambia (comprobado)

| Elemento | Comprobación | Resultado |
|---|---|---|
| Geometría: 124 mallas, 43 466 triángulos, 130 398 vértices | Cada posición y cada normal `float32` del binario contra el original | 782 388 valores comparados, 0 distintos |
| Trayectoria: recorrido de 1.92 m, descenso, acercamiento al marco, compresión del empaque, giro de poleas y tapa del riel | Matrices del motor original contra las del visor nuevo en 1 660 poses | Diferencia máxima 0.0000005 (redondeo: el original calcula con 32 bits) |
| Las 14 cámaras con nombre del original | Matriz de vista del original contra la conversión | Diferencia máxima 0.0000003 |
| Orden de dibujo de las mallas | Cada malla conserva su posición en la lista | Igual |
| Logo de la hoja | Mismo PNG, mismo tamaño (224 × 92 mm) y misma posición | Igual |

### Lo que cambia

| Elemento | Modelo base | Visor nuevo | Motivo |
|---|---|---|---|
| Acabado de la hoja | Selector «Blanco» / «Negro metal.» / «Inox»; abre en blanco | Sin selector. Queda el blanco con que abre el modelo | Matriz de acabados: "único acabado, sin selector" |
| Motor de dibujo | WebGL propio con un sombreado no físico | Three.js con materiales físicos, y la luz, el entorno y las sombras comunes del sitio | Brief §4; coherencia con las otras puertas |
| Materiales | 28 materiales definidos por color, metal y rugosidad | Los mismos 28, con los mismos valores de tabla, convertidos al modelo físico (ver abajo) | El sombreado del original no es PBR estándar |
| Muro y piso | Muro gris de 6.96 × 4.1 m y piso de estudio, con bordes a la vista | Muro y piso comunes del sitio, en los mismos planos (cara del muro a −0.10 m, piso a −0.495 m). Blancos; azul marino en modo interior | Concepto de la Fase 1 |
| Hueco oscuro detrás del muro | Existe, pero el muro lo tapa | No se dibuja | No se ve desde el frente |
| Sombras | No hay | Sombra de la luz principal sobre el muro y entre las piezas | Escenario común |
| Estado inicial | Hoja cerrada, tapa abierta al 94 % | Hoja cerrada, tapa cerrada | La página presenta primero el producto como se ve instalado |
| Mover la hoja | Deslizador 0–100 % y cuatro botones: «Cerrar y sellar», «Abrir puerta», «Ver el momento del sellado» y «Reproducir ciclo completo» | Arrastre directo de la hoja, botón Abrir / Cerrar y pasos de la página | Brief §8: máximo 3 controles |
| Tapa del riel | Deslizador continuo y dos botones | Abierta o cerrada, con el mismo giro animado de 0.95 s: botón, toque sobre la tapa, "Ver por dentro" y pasos | Mismo criterio |
| Duración del recorrido | Abrir 2.95 s, cerrar 3.0 s | 3.0 s el recorrido completo; proporcional si es parcial (mínimo 0.6 s) | Con arrastre, la hoja puede partir de cualquier punto |
| Soltar la hoja sobre las rampas | No aplica (deslizador) | La hoja termina de bajar sola hasta asentar | Decisión de interacción; se puede quitar |
| Cámaras | 14 vistas con botón y vista trasera | 7 vistas que acompañan a los pasos. Órbita libre limitada al frente del muro (±72°) | Detrás del muro no hay nada que ver |
| Óptica | Campo de visión de 45° | 32°, el del sitio | Menos deformación en primeros planos |
| Rueda del ratón | Acerca y aleja; la página no se desplaza | Desplaza la página; acerca con Ctrl o pellizco | Igual que en la abatible |
| Indicadores | % de recorrido, compresión del empaque y asiento | No se muestran | Son valores ilustrativos. El original ya lo advertía |
| Borde del logo | Recortado, sin suavizar | Suavizado | Se ve limpio a cualquier distancia |

### Cómo se convirtieron los materiales

El original calcula el reflejo como `f0 = mix(0.055, 0.91, metal)` con un tinte frío, y el difuso como `color · (1 − 0.82 · metal)`. Con esos mismos tres números, un material estándar de Three.js daba plásticos casi negros y aluminios apagados. Por eso `src/viewers/corrediza.js` despeja los parámetros físicos que reproducen la respuesta del original y los ajusta con cinco constantes (`CAL`).

Las constantes se calibraron midiendo el tono medio de cada material en los dos renders, desde 10 cámaras iguales y sin sombras. Estos son los materiales que más superficie ocupan:

| Material | Dónde está | Original (RGB medio) | Nuevo (RGB medio) |
|---|---|---|---|
| `panel` | Hoja | 227, 228, 228 | 245, 246, 246 |
| `mth-polymer` | Carros, bloques y tapas laterales | 54, 62, 69 | 50, 54, 58 |
| `mth-alu` | Riel | 177, 187, 194 | 191, 204, 213 |
| `mth-hood` | Tapa del riel, cara exterior | 197, 203, 207 | 222, 229, 233 |
| `rim` | Marco de la hoja | 188, 196, 201 | 177, 183, 185 |
| `mth-hood-inner` | Tapa del riel, cara interior | 122, 136, 146 | 87, 95, 102 |
| `mth-polymer-mid` | Forros y nervaduras | 128, 137, 145 | 86, 89, 93 |
| `rubber` | Empaques | 26, 30, 33 | 19, 23, 25 |

Cómo leer la tabla:

- **La hoja y el muro son más claros.** El estudio del sitio es blanco y el del original era gris. La relación entre hoja, aluminio y muro se mantiene: la hoja es lo más claro y el aluminio queda un poco por debajo del muro.
- **Las caras interiores son más oscuras.** La cara interior de la tapa y los forros miran hacia abajo. Con luz física reciben menos luz; el original las iluminaba igual que al resto.
- **El tono general es más neutro.** El original teñía los reflejos de azul. El estudio del sitio es neutro para que los acabados se vean igual en todas las puertas.

No es una copia píxel a píxel del sombreado y no pretende serlo. Las capturas con la misma cámara están en `docs/capturas/ST_FASE_3B_antes_despues_*.png`.

### Detalles del modelo original que se conservan tal cual

- **46 triángulos con el orden de vértices invertido** (marco fijo, un forro y una rampa). El original dibuja a dos caras y el visor nuevo también, así que se ven igual.
- **Parte de la guía inferior queda dentro del muro.** El brazo de la brida de la hoja entra en el muro y termina detrás de él, con un rodillo y una ranura que no se ven desde el frente. Lo que se ve (brida sobre el riel guía) es lo aprobado.
- **La hoja queda 15 cm por encima del piso de estudio**, y el marco, 14.5 cm por delante del muro. Así está el modelo aprobado; no se tocó.
- **El muro es continuo:** al abrir la hoja no se ve un vano, se ve muro. También así está el modelo aprobado.

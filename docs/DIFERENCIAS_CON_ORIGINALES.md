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

## Puerta vaivén (Fase 3C-1)

Base: `VAIVEN_V13_MODELO_BASE.html`. Igual que en la corrediza, la geometría y el giro no se copiaron a mano: se extraen del archivo original con `scripts/convert-vaiven.mjs` y se comprueban con `scripts/verify-vaiven.mjs`.

Esta fase es solo la migración. Las correcciones de bisagras e intersecciones van en la Fase 3C-2 (ver "Defectos del modelo original que siguen igual").

### Lo que no cambia (comprobado)

| Elemento | Comprobación | Resultado |
|---|---|---|
| Geometría: 33 mallas, 25 476 triángulos, 76 428 vértices | Cada posición y cada normal `float32` del binario contra el original | 458 568 valores comparados, 0 distintos |
| Giro de las hojas: ejes en x = ±1.145 m, apertura de 1.10 rad (63.03°), hacia el frente y hacia atrás | Matrices del motor original contra las del visor nuevo en 2 482 poses | Diferencia máxima 0.00000003 (redondeo) |
| Las 7 cámaras con nombre del original | Matriz de vista del original contra la conversión | Diferencia máxima 0.0000002 |
| Orden de dibujo y caras | Cada malla conserva su posición en la lista; se dibuja una sola cara y, a igual profundidad, gana la primera | Igual |
| Logo de las hojas | Mismo PNG, mismo tamaño (156 × 64 mm) y misma posición, en las cuatro caras | Igual |
| Estado inicial | Hojas cerradas, acabado negro, cámara a la derecha y un poco por debajo del centro | Igual |

### Lo que cambia

| Elemento | Modelo base | Visor nuevo | Motivo |
|---|---|---|---|
| Acabados de hoja | «Negro metálico», «Blanco satinado» y «Acero inoxidable», cada uno con una fórmula propia del sombreador | `blackMetal`, `hygienicWhite` y `stainless` del registro compartido, con los nombres Negro, Blanco sanitario e Inoxidable | Matriz de acabados y brief §4: mismo registro y mismo sombreado que la abatible |
| Reflejos sobre la hoja negra | Rectángulos de luz dibujados por el sombreador (un estudio simulado) | Reflejo real del estudio común | Mismo motivo |
| Motor de dibujo | WebGL propio con un sombreado no físico | Three.js con materiales físicos, y la luz, el entorno y las sombras comunes del sitio | Brief §4; coherencia con las otras puertas |
| Materiales que no son acabado (marco, bisagras, hules, vidrio, tornillos, placa inferior) | 15 materiales definidos por color, metal y rugosidad | Los mismos 15, con los mismos valores de tabla, convertidos al modelo físico y ajustados de tono (ver abajo) | El sombreado del original no es PBR estándar |
| Placa inferior | Acero cepillado; negra mate cuando la hoja es de acero inoxidable | Igual | Se conserva |
| Frente del marco | Cambia un poco de tono con cada acabado de hoja | El mismo tono en los tres acabados, más satinado | Con el retoque del inoxidable quedaba casi blanco y se perdía contra el muro (ver abajo) |
| Muro y piso | No hay: la puerta flota sobre un fondo claro | Muro blanco con vano y piso, comunes del sitio. Detrás del vano, el interior azul marino | Concepto de la Fase 1 |
| Sombras | No hay | Sombra de la luz principal sobre el muro, el piso y entre las piezas | Escenario común |
| Mover las hojas | Botones para abrir ambas hojas, solo la izquierda o solo la derecha, cerrar y cambiar el sentido de apertura | Arrastre directo de cada hoja hacia los dos lados, botón Abrir / Cerrar y pasos de la página | Brief §8: máximo 3 controles |
| Abrir con el botón | Las dos hojas hacia el frente (o hacia atrás con el sentido invertido) | Las dos hojas hacia el frente. Hacia atrás: arrastrando, o en el paso "Cada hoja, hacia los dos lados" | Mismo criterio |
| Soltar una hoja casi cerrada | No aplica (solo botones) | A menos de 2° del marco termina de cerrar. En cualquier otro punto se queda donde se suelta | Decisión de interacción; no hay retorno automático porque el original no lo tiene |
| Cámaras | Frontal, 3/4, lateral y posterior con botón; enfoques de bisagra y empaque; giro automático | 9 encuadres que acompañan a los pasos. Órbita libre limitada al frente del muro (±74°) | Detrás del muro no hay nada que ver |
| Encuadre | Distancia fija: en pantallas angostas la vista frontal cortaba el marco | Cada encuadre se ajusta a la proporción del visor. Marco y hojas quedan completos, con margen | Brief §5: "no cortar el contorno superior ni laterales", "auto-fit en móvil" |
| Volver al encuadre | Botón «Reiniciar» (también cierra las hojas) | Botón "Reencuadrar", que solo aparece cuando el usuario movió la cámara | Brief §5; no es un control fijo |
| Óptica | Campo de visión de 45° | 32°, el del sitio | Menos deformación en primeros planos |
| Rueda del ratón | Acerca y aleja; la página no se desplaza | Desplaza la página; acerca con Ctrl o pellizco | Igual que en las otras puertas |
| Señaladores de pieza | 4 señaladores con texto propio (mirilla, bisagra, bumper, marco) | "Ver por dentro": hojas entreabiertas a 28°, muro azul marino y 5 puntos ligados a piezas del catálogo | Las piezas salen del catálogo, no de texto suelto |
| Galería de fotos y descarga del modelo | Enlazan a 9 imágenes y a un archivo GLB que no vienen en el paquete | No se incluyen | Faltan los archivos (auditoría de la Fase 0) |
| Borde del logo | Recortado, sin suavizar | Suavizado | Se ve limpio a cualquier distancia |

### Cómo se convirtieron los materiales

Se usa la misma conversión de la corrediza (`src/materials/fromOriginal.js`), con dos clases de superficie más que este modelo trae: fundición satinada (bisagras y tornillos) y vidrio esmerilado (ventanillas). Después se midió el tono medio de cada material en los dos renders, desde las 14 cámaras de prueba y sin sombras, y se ajustó donde el estudio común iluminaba distinto:

| Ajuste | Valor | Por qué |
|---|---|---|
| Frente del marco | Rugosidad × 2.4 y ganancia 0.68; igual en los tres acabados | Es una placa plana que mira a la cámara. Con la rugosidad de tabla reflejaba las luces del estudio como un espejo: de frente quedaba casi blanca y no se distinguía del muro |
| Placa inferior | Ganancia 1.12 | Quedaba un 9–17 % más oscura que en el original |
| Bumper y empaques | Ganancia 2.6 y 1.5 | El mapeo de tono del sitio hunde los negros; así el hule se acerca al gris muy oscuro del original |
| Tornillos | Ganancia 0.85 | Quedaban más brillantes que en el original |

Tono medio de cada material, original contra nuevo:

| Material | Original (RGB) | Nuevo (RGB) | Luminancia nuevo / original |
|---|---|---|---|
| Frente del marco, con hoja negra | 196, 202, 206 | 190, 196, 199 | 0.93 |
| Frente del marco, con hoja blanca | 201, 205, 208 | 188, 194, 197 | 0.88 |
| Frente del marco, con hoja inoxidable | 184, 192, 198 | 191, 197, 200 | 1.06 |
| Perfil de la hoja y cantos del marco, con hoja negra | 170, 180, 187 | 183, 189, 194 | 1.13 |
| Perfil de la hoja y cantos del marco, con hoja blanca | 178, 187, 195 | 165, 172, 176 | 0.83 |
| Placa inferior, con hoja negra | 145, 158, 168 | 151, 158, 165 | 1.02 |
| Placa inferior, con hoja blanca | 149, 161, 170 | 149, 155, 160 | 0.94 |
| Placa inferior negra, con hoja inoxidable | 21, 23, 26 | 19, 22, 24 | 0.84 |
| Vidrio de la ventanilla | 174–177, 186–188, 189–191 | 165–180, 180–195, 182–197 | 0.92 a 1.10 |
| Bisagra (cuerpo) | 150, 160, 167 | 148, 157, 164 | 0.96 |
| Bisagra (nudillos) | 139, 151, 160 | 136, 147, 154 | 0.93 |
| Tornillos | 209, 212, 213 | 214, 218, 219 | 1.07 |
| Bumper | 32, 35, 37 | 21, 27, 31 | 0.54 |
| Canto del bumper | 41, 47, 52 | 43, 49, 55 | 1.12 |
| Empaques | 25, 28, 31 | 21, 25, 29 | 0.76 |
| Hoja negra (registro compartido, sin calibrar) | 85, 87, 87 | 42, 43, 44 | 0.21 |
| Hoja blanca (registro compartido, sin calibrar) | 217, 217, 217 | 225, 227, 223 | 1.10 |
| Hoja inoxidable (registro compartido, sin calibrar) | 187, 191, 191 | 190, 192, 194 | 1.02 |

Medido en calidad baja, sin sombras ni muro, sobre los píxeles donde cada material se ve en las dos imágenes. El perfil de la hoja con el acabado inoxidable ocupa muy pocos píxeles en estas vistas (2 888) y su medida no es fiable; no se incluye.

Cómo leer la tabla:

- **La hoja no se calibró.** Usa los acabados del registro compartido, los mismos de la abatible. El negro del sitio es satinado y más profundo que el del original, que pintaba encima rectángulos de luz. El blanco sanitario es un poco más cálido.
- **El inoxidable refleja el estudio.** El promedio de la tabla coincide con el original, pero en calidad alta el reparto no es parejo: la parte de la hoja que queda por encima de la altura de la cámara se ve gris oscuro y la de abajo, muy clara. Es el mismo material de la abatible y se comporta igual allá. Si se quiere más parejo, el cambio se hace en el registro y aplica a las dos puertas.
- **No es una copia píxel a píxel del sombreado** y no pretende serlo. Las capturas con la misma cámara están en `docs/capturas/ST_FASE_3C1_antes_despues_*.png`.

### Defectos del modelo original que siguen igual (se corrigen en la Fase 3C-2)

Se midieron sobre la geometría, sin tocarla:

- **La bisagra entera gira con la hoja.** Placas, nudillos y perno pertenecen al grupo de la hoja y giran con ella sobre el eje central. No hay una mitad fija en el marco.
- **La hoja atraviesa el marco al girar.** Cerrada, el empaque del lado de la bisagra ya está 30 mm dentro del poste y el canto superior de la hoja entra 3.5 mm en el cabezal. Al abrir a 63°, el empaque llega a 40 mm dentro del poste; el perfil de la hoja, los tornillos y las piezas de la bisagra, a entre 27 y 30 mm; la cara de la hoja, a 10 mm.
- **El frente del marco es una placa separada 5.5 mm del cuerpo del marco.** De cerca se ve una rendija fina entre los dos.
- **320 triángulos con el orden de vértices invertido y 176 sin área.** El original dibuja una sola cara, así que no se ven; el visor nuevo hace lo mismo.

Lo que sí está bien y se comprobó: las dos hojas son independientes y **no se cruzan entre sí**. El punto más lejano de cada hoja queda a 1.1441 m de su eje y el centro del vano está a 1.145 m; cerradas, la holgura entre hojas es de 2.4 mm.

## Puerta vaivén · Fase 3C-2, parte 1: perfil de aluminio completo en las dos caras

**Problema (reportado por ST):** a una cara de la hoja le faltaba el perfil de aluminio de las orillas.

**Causa, medida en el modelo original:** el marco fijo trae tres tiras negras (`static/gasket`) **solo por el frente**: una en cada poste y otra en el cabezal (z de 24.5 a 49.5 mm).
- **Del lado de la bisagra y arriba tapaban el perfil de la hoja.** De frente se veía el empaque negro pegado al panel. Por detrás, el perfil sí aparecía: 29 px en la misma vista de prueba.
- **Además se metían 7 mm en el perfil** con la hoja cerrada.
- **No giran con la hoja:** al abrirla, se quedaban flotando junto al poste.

**Cambio:** esas tres tiras ya no se dibujan. El binario no cambia y la geometría sigue siendo bit a bit la del original; solo se omiten esas mallas. El empaque real va en la hoja (`left/gasket`, `right/gasket`) y se conserva.

**Comprobado** con una pasada de identificación por malla, en la misma fila de píxeles junto a la bisagra:

| Vista | Antes | Después |
|---|---|---|
| Frente | empaque del marco y luego el panel; perfil 0 px | empaque de la hoja 24 px y perfil 29 px |
| Atrás | perfil 29 px y empaque de la hoja 31 px | igual |

Ahora se dibujan 32 mallas y 25 440 triángulos (antes 33 y 25 476).

## Puerta vaivén · Fase 3C-2, parte 2: bisagras de dos ejes, mitad fija y marco sin intersecciones

Decisiones de ST: "Dos ejes y mitad fija". En el ancho del vano no hubo preferencia; se tomó la opción recomendada, ensanchar el marco y no tocar las hojas.

### Problema medido en el original

- **Las hojas no caben en el marco.** Cada hoja con su empaque mide 30 mm más de lo que cabe entre los postes; en total faltan 59 mm.
- **La hoja atraviesa el marco.** Gira sobre un eje pegado a la cara del poste. Cerrada, el empaque ya entra 30 mm en el poste y a 63° llega a 40 mm. El canto superior entra 3.5 mm en el cabezal.
- **La bisagra entera gira con la hoja.** No había una parte fija en el marco.

### Cambios

| Elemento | Original | Ahora |
|---|---|---|
| Postes | Cara interior a ±1.1445 m | Cada poste 31.5 mm hacia afuera; holgura de 2 mm con el empaque de la hoja |
| Cabezal | Parte baja a 2.4215 m | 6.5 mm más arriba; holgura de 3 mm |
| Frente del marco | Separado 5.5 mm del cuerpo | Pegado al cuerpo |
| Muro | Vano de ±1.24 m | Vano ensanchado lo mismo que el marco |
| Eje de giro | Uno solo, en el canto, para los dos sentidos | Dos ejes, en la columna de nudillos: 30 mm hacia el poste y 78 mm hacia el frente o hacia atrás. La hoja gira sobre el del lado hacia el que abre |
| Bisagra | Todo el herraje gira con la hoja | La columna de nudillos (con tapas y perno) es la mitad fija. Hay una por cara: la del lado hacia el que abre se queda en el marco; la de la cara contraria acompaña a la hoja, como el eslabón central de una bisagra de doble acción. Las placas con tornillos van siempre con la hoja |
| Botón Abrir / Cerrar | Las dos hojas a la vez | La segunda hoja arranca cuando la primera pasa de 12°. Al cerrar, la primera espera a que la segunda cierre. Así los empaques del canto no se cruzan |
| Arrastre | Un eje | Sigue al eje del lado en curso y cambia de eje al pasar por el cierre. El punto tomado sigue bajo el puntero (0.01 px de error en la prueba) |

**Lo que no cambia:** la geometría de las hojas (panel, perfil, empaques, ventanilla, bumper, placa inferior, bisagras), su orientación en cada ángulo, su posición cerrada y la apertura máxima de 63.03°. `vaiven.bin` sigue idéntico al original. El ensanchado del marco y la separación de la bisagra se hacen al cargar, con las mismas funciones que usa la verificación (`src/viewers/vaiven.rig.js`).

### Verificación (`scripts/verify-vaiven.mjs`, sección 3C-2)

Se recorre la hoja izquierda de −63° a +63° en pasos de 0.5° (253 ángulos), con todos sus vértices. La derecha es su espejo.

| Medida | Original | Ahora |
|---|---|---|
| Hoja dentro del marco (postes y cabezal) | 39.9 mm | 0 mm |
| Mitad fija dentro del poste | — | 0 mm |
| Orientación de la hoja frente al original | — | Igual (diferencia 0.00000003) |
| Hoja cerrada frente al original | — | Igual (diferencia 0.00000002) |
| Entre hojas | 0 mm | Solo empaques de canto, hasta 6.7 mm si las dos pasan a la vez cerca de los 6°. Con el escalonado del botón no pasa (0 cuadros en la prueba). Con la otra hoja cerrada, 1.5 mm |

Prueba de control: con el eje y el marco del original, la misma verificación marca 39.89 mm y falla. Es decir, sí detecta el problema.

**Límite:** al arrastrar una hoja mientras la otra está entreabierta entre 3° y 9°, sus empaques de canto pueden cruzarse hasta 6.7 mm. Es hule contra hule; en una puerta real se comprimen.

## CDS Legacy (Fase 4A)

Base: `CDS_LEGACY_MODELO_ACTUAL.html`. Es un visor que hice al inicio del proyecto: la geometría se genera por código, no hay un modelo fijo. Su código se trajo al sitio tal cual, solo desminificado (`src/viewers/cds/legacy.js`). Los nombres cortos de variables vienen del original; el encabezado del archivo dice qué clase de Three.js es cada uno. Las líneas que cambian llevan la marca `[sitio]`.

### Lo que no cambia

- Marco maestro con mullions fijos, tres puertas independientes y la manija como hija del pivote de su puerta.
- Mecánica: si se suelta antes de 90°, la puerta cierra sola (oscilador amortiguado, 3.5 s); a 90° queda retenida (umbral de 4°). Con un producto fuera, la puerta no cierra.
- Productos (1 056 en calidad alta, todos de marcas inventadas): solo se toman con la puerta retenida a 90°, se giran y se devuelven con doble clic. Nunca atraviesan el vidrio.
- Parrillas, KeyLED, gabinete, vidrios y materiales.
- Modelos: Advanced y Plus con 2 vidrios, LT con 3.

### Lo que cambia

| Elemento | Original | Ahora | Motivo |
|---|---|---|---|
| Alto del vano por puerta | 1.905 m (75"), estimado | 2.007 m (79") | PDF: medidas estándar 30" × 79". El ancho de 30" ya coincidía. **Pendiente de confirmar** si el 79" es la hoja o el vano |
| Escenario | Muro, piso, luces y cámara propios | Los comunes del sitio. El muro tiene el vano del marco; detrás, el interior azul marino | Coherencia con las puertas industriales |
| Controles | Panel lateral con 24 controles (muchos de menos de 44 px); en celular la página se desbordaba | 3 controles: Abrir/Cerrar, modelo (Advanced, Plus, LT) y Ver por dentro | Brief §8 |
| Funciones (Kwik Torque, Kwik Level, Mullion, Triple sello, KeyLED, 90°) | Botones de un panel, con textos propios | Pasos de la página y 6 puntos en "Ver por dentro". Textos tomados del PDF, sin cifras de protección | Brief §7 y procedencia: no anunciar porcentajes sin metodología |
| Cámaras | Posiciones fijas | Cada vista encuadra una caja y se ajusta a la proporción del visor | Nada cortado en celular |
| Arrastre de una puerta | El ángulo se quedaba en la tangente cuando el puntero salía de la silueta de la hoja; desde el frente, la puerta no llegaba a 90° | Fuera de la silueta sigue girando en el mismo sentido (90° por cada radio). Al llegar a 90° queda enganchada hasta que el puntero regresa | Sin esto no se podía retener la puerta arrastrándola desde la vista general |
| Velocidad de cierre y calidad | Deslizadores en el panel | Valores fijos (3.5 s; las filas de producto según la calidad del sitio) | Menos controles; se puede volver a exponer si hace falta |
| Etiquetas de calidad automática | Mensaje al bajar la calidad | Lo maneja el escenario común | — |

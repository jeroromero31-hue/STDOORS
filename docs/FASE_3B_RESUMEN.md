# FASE 3B · Puerta corrediza: resumen

**Fecha:** 13 nov 2026 · **Modelo:** Fable 5.2, esfuerzo Máximo
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

- **Visor de la corrediza** en `/industriales/corrediza/`, sobre el escenario común del sitio (Three.js).
- **La misma puerta, comprobada con números:**
  - Geometría: 782 388 valores comparados contra el modelo aprobado, 0 distintos.
  - Trayectoria: 1 660 poses comparadas contra el motor original; la diferencia máxima es redondeo (0.0000005).
  - Poleas dentro del riel, dos bloques con rampa, descenso al cerrar, tapa del riel y guía inferior: todo viene del modelo aprobado, sin piezas nuevas.
- **Un solo acabado, sin selector.** Es el blanco con que abría el modelo original. El visor no tiene función para cambiarlo.
- **Tres controles:** Abrir / Cerrar, Levantar tapa y Ver por dentro. Además:
  - La hoja se arrastra con el puntero. Si se suelta sobre las rampas, termina de bajar sola.
  - La tapa también se levanta tocándola en el modelo.
- **"Ver por dentro"** levanta la tapa, pasa el muro a azul marino y señala 7 piezas del catálogo.
- **"Cómo cierra"** en 4 pasos, más la guía inferior. Cada bloque mueve la cámara, la hoja y la tapa:
  1. Corre colgada del riel.
  2. Llega a los bloques.
  3. Baja y se asienta.
  4. El empaque sella.
- **Piezas** (12 destacadas de 57), **ficha** y **cotizar**, con la misma plantilla de la abatible.
- **El modelo pesa menos:** de 6.7 MB (el HTML original) a 1.2 MB. Con la compresión gzip que aplican los servidores, de 1.7 MB a 273 KB.

## Módulos nuevos

| Archivo | Para qué sirve |
|---|---|
| `scripts/convert-corrediza.mjs` | Extrae la geometría del modelo aprobado a un binario, sin pérdidas |
| `scripts/verify-corrediza.mjs` | Compara geometría, trayectoria y cámaras contra el original. Falla si algo no coincide |
| `src/viewers/corrediza.js` | Visor: materiales, cámaras, puntos de pieza |
| `src/viewers/corrediza.kinematics.js` | Trayectoria de la hoja, poleas, empaque y tapa |
| `src/viewers/corrediza.rig.js` | Árbol de nodos: cada grupo del original cuelga de su eje real |
| `src/core/slider.js` | Hoja corrediza genérica: progreso, arrastre y toque |
| `src/core/backdrop.js` | Muro y piso comunes. La abatible ya lo usa; la vaivén lo usará |

`src/ui/doorPage.js` ahora acepta puertas que no giran: cada visor declara cómo se mueve.

## Cambios que afectan a todo el sitio

- **Pasos desfasados en celular (error mío de la Fase 3A).** En celular el visor queda fijo arriba y tapaba la línea que activa cada paso. La cámara cambiaba cuando el texto ya no se veía. Ahora la línea va en la franja de texto visible. Probado en las dos puertas a 360, 390 y 820 px de ancho y en escritorio.
- **Cantos finos a trazos.** En pantallas de densidad 1, los perfiles delgados se veían como líneas punteadas. La calidad alta ahora dibuja a 1.5×. El costo en una GPU real no está medido.
- **Animaciones con pocos cuadros.** El límite de tiempo por cuadro pasó de 0.05 a 0.1 s. Antes, por debajo de 20 cuadros por segundo las animaciones iban en cámara lenta.
- **Enlaces en subcarpeta.** Los enlaces escritos como `/cotizar/` fallaban si el sitio se publicaba en una subcarpeta. Corregido y probado con un build en `/st-doors/`.
- **Subnavegación:** los enlaces cortos ("Ficha") medían menos de 44 px de ancho. Corregido.
- **Página Industriales:** enlaces provisionales a las dos puertas ya migradas.

Mover el muro al módulo común no alteró la abatible: sus capturas de antes y después (vista general y abierta) son idénticas píxel a píxel.

## Lo que sí cambia frente al original

El detalle está en `docs/DIFERENCIAS_CON_ORIGINALES.md`. Lo principal:

- **El sombreado no es idéntico.** El original usa un motor propio, no físico. El sitio usa materiales físicos con luz y sombras reales. Convertí los 28 materiales con una fórmula y la calibré contra el original, pero el resultado es más neutro, con la hoja más blanca y las caras interiores más oscuras.
- **El muro es el del sitio:** blanco, y azul marino en modo interior. Va en los mismos planos que el muro gris del original.
- **Controles:** los deslizadores y las 14 vistas con botón del original no pasan a la página. Se sustituyen por el arrastre directo, 3 botones y 7 cámaras que acompañan a los pasos.
- **No se muestran porcentajes de compresión ni milímetros de descenso.** Son valores ilustrativos; la ficha lo dice.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Geometría contra el original | 0 diferencias en 782 388 valores |
| Trayectoria contra el motor original | Diferencia máxima 0.0000005 en 1 660 poses |
| Trayectoria en el navegador | Cerrada: −26 mm y −7 mm. En lo alto de la rampa: 0.12 m de avance. Abierta: 1.92 m |
| Arrastre con ratón | La hoja sigue al puntero, la cámara no se mueve y la hoja se queda donde se suelta |
| Soltar sobre las rampas | Termina de bajar hasta asentar |
| Botón Abrir / Cerrar | Funciona y cambia su texto |
| Tapa: botón y toque sobre el modelo | Sube y baja. Arrastrar sobre la tapa solo gira la cámara |
| Selector de acabado | No existe: 0 muestras en la página |
| Pasos de "Cómo cierra" | Cámara, posición y tapa correctas en los 5 bloques, y al volver arriba |
| Ver por dentro | 7 puntos visibles; cada uno abre su pieza. Al salir, la tapa vuelve a como estaba |
| Piezas y solicitud | 12 destacadas de 57. Guarda "Puerta corrediza" y actualiza el contador |
| Táctil emulado | Deslizar horizontal mueve la hoja; deslizar vertical desplaza la página |
| Celular 390 × 844 | Sin desbordamiento; controles de 44 px o más |
| Sin WebGL, o si el modelo no descarga | Muestra una imagen de la puerta; el resto de la página funciona |
| Sitio en subcarpeta | El modelo, el logo y los enlaces cargan |
| Las 10 páginas del sitio, escritorio y celular | Sin errores de consola, sin imágenes rotas, sin desbordamiento |
| Abatible después de los cambios comunes | Mismas pruebas de la Fase 3A, mismos resultados |

**No probado:** Safari, celulares y tabletas reales, arrastre con un dedo real (solo emulado), rendimiento en GPU real y lectores de pantalla.

## Por confirmar contigo

1. **Izquierda y derecha de las poleas.** El punto de pieza de la polea del lado izquierdo (vista de frente) abre "Polea plástica izquierda" (pieza 38). El catálogo no dice desde dónde se mira. ¿Es correcto?
2. **Bloques.** Señalé como "bloque cierre" (47) el del extremo donde cierra la hoja, y como "bloque central" (48) el de media vía. ¿Es correcto?
3. **Vano.** Como en el modelo aprobado, al abrir se ve muro, no un hueco. ¿Quieres que en una fase posterior se vea el interior de la cámara en azul marino, como en la abatible? Habría que definir cómo se une el marco al muro.
4. **La hoja baja sola** si se suelta sobre las rampas. ¿Así se comporta la puerta real, o prefieres que se quede donde se suelta?
5. **Descenso y compresión.** El modelo usa 26 mm de descenso, 7 mm de acercamiento y 24 % de compresión. Son los valores del original, marcados como "por validar". Si tienes los reales, los cambio en un solo archivo.

## Capturas

- `docs/capturas/ST_FASE_3B_antes_despues_1_general.png`: vista general cerrada, abierta y frontal.
- `docs/capturas/ST_FASE_3B_antes_despues_2_mecanismo.png`: riel con la tapa levantada y la polea arriba y abajo de la rampa.
- `docs/capturas/ST_FASE_3B_antes_despues_3_detalles.png`: tapa, guía inferior y perfil.
- `docs/capturas/ST_FASE_3B_pagina.png`: la página en escritorio y en celular.

En las tres primeras, el original va a la izquierda y el sitio nuevo a la derecha, con la misma cámara.

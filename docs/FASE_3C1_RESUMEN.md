# FASE 3C-1 · Puerta vaivén: migración — resumen

**Fecha:** 13 nov 2026 · **Modelo:** Fable 5.2, esfuerzo Máximo
**Archivos originales:** no se modificó ninguno.

Esta fase lleva la vaivén al sitio tal como está en el modelo aprobado. Las correcciones de bisagras e intersecciones son la Fase 3C-2 (ver "Lo que esta fase no corrige").

## Qué quedó listo

- **Visor de la vaivén** en `/industriales/vaiven/`, sobre el escenario común del sitio (Three.js).
- **La misma puerta, comprobada con números:**
  - Geometría: 458 568 valores comparados contra el modelo aprobado, 0 distintos (33 mallas, 25 476 triángulos).
  - Giro: 2 482 poses comparadas contra el motor original; la diferencia máxima es redondeo (0.00000003). Mismos ejes (x = ±1.145 m) y misma apertura (63.03°), hacia el frente y hacia atrás.
- **Solo tres acabados:** Negro, Inoxidable y Blanco sanitario. Salen del registro compartido: son los mismos materiales de la abatible, con la textura a la misma escala. El visor rechaza cualquier otro. El nombre «Blanco satinado» del original ya no aparece.
- **Marco completo en pantalla.** Cada encuadre se ajusta a la proporción del visor. Medido en 5 encuadres y 4 tamaños de pantalla: marco y hojas quedan enteros, con 12 px de margen como mínimo (celular de 360 px).
- **Dos hojas independientes.** Cada una se arrastra por separado, hacia el frente o hacia atrás, y la otra no se mueve. No se cruzan entre sí: el punto más lejano de cada hoja queda a 1.1441 m de su eje y el centro del vano está a 1.145 m.
- **Tres controles:** Abrir / Cerrar, acabado y Ver por dentro.
  - El botón abre las dos hojas hacia el frente, hasta los 63° del original.
  - Arrastre: la hoja sigue al puntero. Si el puntero sigue de largo, la hoja cruza al otro lado sin soltarla.
  - Soltada a menos de 2° del marco, termina de cerrar. En cualquier otro punto se queda donde se suelta (el original no tiene retorno automático).
- **"Ver por dentro":** hojas entreabiertas a 28°, muro azul marino y 5 piezas del catálogo señaladas (ventanilla, bisagra, bumper de 150 mm, empaque lateral y perfil de aluminio).
- **"Cómo abre"** en 6 bloques. Cada uno mueve la cámara y las hojas: hacia los dos lados, bisagras, empaque lateral, ventanilla, bumper y placa inferior, marco perimetral (vista frontal).
- **Piezas** (las 10 de la familia), **ficha** y **cotizar**, con la misma plantilla de las otras puertas.
- **El modelo pesa menos:** de 6.9 MB (el HTML original) a 1.2 MB. Con la compresión gzip de los servidores, de unos 310 KB a unos 190 KB.

## Módulos nuevos

| Archivo | Para qué sirve |
|---|---|
| `scripts/convert-vaiven.mjs` | Extrae la geometría del modelo aprobado a un binario, sin pérdidas |
| `scripts/verify-vaiven.mjs` | Compara geometría, giro y cámaras contra el original. Falla si algo no coincide |
| `scripts/lib/meshpack.mjs` | Empaquetado y comparación comunes a corrediza y vaivén |
| `src/viewers/vaiven.js` | Visor: materiales, acabados, cámaras y puntos de pieza |
| `src/viewers/vaiven.rig.js` | Árbol de nodos: marco fijo y una hoja colgada de cada eje |
| `src/materials/fromOriginal.js` | Conversión de los materiales de un modelo original al sitio. Antes vivía dentro de la corrediza |
| `src/models/vaiven.bin`, `vaiven.json` | Geometría y tabla de materiales generadas |
| `src/models/logo-hoja.png` | Logo de las hojas. Sustituye a `corrediza-logo.png`: es el mismo archivo, ahora común |

Los scripts de la corrediza pasaron a usar la librería común. Su binario salió idéntico, byte por byte, y su verificación sigue pasando.

## Cambios que afectan a todo el sitio

- **Paso equivocado tras un desplazamiento rápido (error mío que venía de la Fase 3A).** Lo encontré al probar esta página. Si el navegador avisaba tarde y juntaba varios cambios (salto largo, equipo lento), la página podía quedarse con la cámara y la puerta de un paso que ya no era el que se leía. Por ejemplo: volver arriba desde "Piezas" y que la puerta quedara en el paso de la bisagra. Corregido en `src/ui/doorPage.js`, junto con el resaltado de la subnavegación, que tenía el mismo fallo. Probado en las tres puertas, en celular y escritorio.
- **Rayas finas en el muro.** El muro con vano eran tres losas juntas y sus uniones se veían como una línea tenue encima de cada esquina del marco. Ahora es una sola pieza. También le pasaba a la abatible.
- **Botón "Reencuadrar".** Aparece solo cuando el usuario movió la cámara y la devuelve al encuadre de la vista en curso. No cuenta como control fijo. Está en las tres puertas.
- **Arrastre de hojas de doble acción** en `src/core/hinge.js`. Solo se activa en hojas que giran a los dos lados; la abatible conserva su arrastre de antes.
- **"Reducir movimiento":** con esa preferencia del sistema, las hojas abisagradas cambian de posición sin animarse (abatible y vaivén).
- **Inercia de la cámara:** si quedaba inercia de un giro del usuario, desviaba la cámara al volver a un encuadre. Ahora se descarta.
- **Página Industriales:** enlace provisional a la vaivén.

Regresión de las otras puertas, con capturas de antes y después:

- **Corrediza:** idénticas píxel a píxel en las 3 vistas.
- **Abatible:** vista general y abierta, iguales salvo las uniones del muro que desaparecieron (131 y 136 píxeles de 646 625). En "ver por dentro" cambia además el borde de los puntos numerados, que se dibujan en HTML encima del modelo.

## Lo que sí cambia frente al original

El detalle está en `docs/DIFERENCIAS_CON_ORIGINALES.md`. Lo principal:

- **Acabados de hoja:** los tres del registro compartido en lugar de los tres del original. El negro del sitio es satinado y más profundo; el original le pintaba rectángulos de luz encima. El blanco es un poco más cálido.
- **El inoxidable no queda parejo.** La parte de la hoja por encima de la altura de la cámara se ve gris oscuro y la de abajo, muy clara. Es el mismo material de la abatible. Emparejarlo es un cambio del registro y aplica a las dos puertas: no lo toqué sin tu visto bueno.
- **El sombreado no es idéntico.** Los 15 materiales que no son acabado se convirtieron con la misma fórmula de la corrediza y se ajustaron de tono contra el original. La tabla de medidas está en el documento de diferencias.
- **Frente del marco:** igual en los tres acabados y más satinado. Con los valores del original, de frente quedaba casi blanco y se perdía contra el muro.
- **Muro, piso y sombras:** el original no los tiene. Detrás del vano se ve el interior azul marino.
- **Controles:** los botones del original (abrir ambas, solo izquierda, solo derecha, cambiar sentido) y sus 4 vistas con botón se sustituyen por el arrastre, 3 controles y 9 encuadres que acompañan a los pasos.
- **Galería de fotos y descarga del modelo:** no se incluyen. Los archivos no vienen en el paquete.

## Lo que esta fase no corrige (Fase 3C-2)

Son defectos del modelo aprobado. Los medí sobre la geometría, sin tocarla:

- **La bisagra entera gira con la hoja.** Placas, nudillos y perno pertenecen a la hoja. No hay una mitad fija en el marco.
- **La hoja atraviesa el marco.** Cerrada, el empaque del lado de la bisagra ya está 30 mm dentro del poste y el canto superior entra 3.5 mm en el cabezal. A 63°, el empaque llega a 40 mm; el perfil, los tornillos y las piezas de la bisagra, a entre 27 y 30 mm; la cara de la hoja, a 10 mm.
- **El frente del marco está separado 5.5 mm del cuerpo del marco.** De cerca se ve una rendija fina.

El punto "2 hojas independientes sin intersecciones" de la lista de aceptación queda así: independientes, sí; sin cruzarse entre ellas, sí; sin atravesar el marco, **no todavía**.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Geometría contra el original | 0 diferencias en 458 568 valores |
| Giro contra el motor original | Diferencia máxima 0.00000003 en 2 482 poses |
| Pivotes a 0°, 45° y 63°, al frente y atrás | El eje no se mueve y la hoja no se inclina (error 0.0000000000000002 m) |
| Acabados | 3 muestras; las dos hojas comparten material; otro acabado, rechazado |
| Blanco sanitario contra el de la abatible | Mismos parámetros y misma escala de textura |
| Placa inferior | Inoxidable; negra mate con la hoja inoxidable, como en el original |
| Botón Abrir / Cerrar | Las dos hojas a 63.03° y de vuelta; cambia su texto |
| Arrastre con ratón | La hoja sigue al puntero (0.03 px de error), cruza al otro lado y la cámara no se mueve |
| Hojas independientes | Al mover la izquierda, la derecha no cambia |
| Soltar junto al marco | Asienta cerrada |
| Hoja detrás del muro | No se puede tomar a través del muro |
| Reencuadrar | Aparece al mover la cámara; al pulsarlo vuelve al encuadre exacto |
| Rueda del ratón sobre el visor | Desplaza la página |
| Pasos de "Cómo abre" | Cámara y ángulo de cada hoja correctos en los 6 bloques y al volver arriba |
| Saltos largos de desplazamiento | Cámara correcta en las tres puertas, celular y escritorio |
| Ver por dentro | 5 puntos dentro del visor; cada uno abre su pieza; al salir, todo vuelve |
| Piezas y solicitud | 10 de 10; guarda "Puerta vaivén, negro" y actualiza el contador |
| Marco completo | 5 encuadres × 4 tamaños (1366, 820, 390 y 360 px): margen mínimo 12 px |
| Táctil emulado | Un dedo en horizontal gira la hoja a los dos lados; en vertical desplaza la página |
| Celular 390 × 844 | Sin desbordamiento; controles de 44 px o más |
| Sin WebGL, o si el modelo no descarga | Imagen fija de la puerta; el resto de la página funciona |
| Vista rápida de un solo archivo | Abre desde disco sin pedir nada a internet, en escritorio y celular |
| Las 11 páginas del sitio, escritorio y celular | Sin errores, sin desbordamiento, sin imágenes rotas |
| Corrediza y abatible | Sus pruebas de página pasan igual que antes (19 de 19 la corrediza) |

**No probado:** Safari, celulares y tabletas reales, arrastre con un dedo real (solo emulado), rendimiento en una GPU real y lectores de pantalla.

## Preguntas

1. **Inoxidable:** ¿lo dejo como está o lo emparejo? Cambia en la abatible y en la vaivén a la vez.
2. **Botón Abrir:** abre las dos hojas hacia el frente, como el original. ¿Así está bien?
3. **Retorno automático:** el original deja la hoja donde se suelta. ¿La vaivén real regresa sola al centro?
4. **Placa inferior:** ¿cómo la llaman ustedes y es una pieza del catálogo? En la página la nombré "placa inferior" y no la ligué a ninguna pieza.
5. **Para la 3C-2:** ¿tienes fotos de la bisagra instalada, de frente y de canto? Con ellas separo la mitad fija de la móvil sin inventar piezas.

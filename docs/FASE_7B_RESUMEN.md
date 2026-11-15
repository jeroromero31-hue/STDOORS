# FASE 7B · Animaciones dentro de los visores 3D — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno. No se tocó la geometría ni la mecánica de ninguna puerta.

## Qué había y qué se agregó

Los acercamientos guiados (bisagra, empaque, chapa, polea, guía, mirilla…) y las aperturas que explican el sellado ya existían en el recorrido "Cómo cierra/funciona" desde las Fases 3 y 4. Por ejemplo, en la corrediza ("Baja y se asienta", "El empaque sella") y en la abatible ("El empaque toca el marco"). Esta fase agrega lo que faltaba:

| Movimiento | Qué explica | Detalle |
|---|---|---|
| **Acercamiento a cada pieza en "Ver por dentro"** (abatible 5, corrediza 7, vaivén 5, CDS 6) | Dónde está la pieza y cómo es de cerca | La cámara se acerca a la distancia mínima del visor y deja la pieza al centro. Si algo la tapa (por ejemplo, la hoja abierta delante de la bisagra), gira la vista alrededor del eje vertical, dentro de los límites del visor, hasta encontrar el ángulo que deja ver más de la pieza. |
| **La cámara sigue a la pieza** | Que la pieza va montada en la hoja | Si la hoja se mueve, el encuadre la acompaña hasta que el usuario toma la cámara o elige otra vista. |
| **"Ver toda la puerta"** en la nota de la pieza | Volver al conjunto | Regresa a la vista interior, cierra la nota y devuelve el foco al punto. |
| **Fundido al cambiar acabado (y modelo CDS)** | Que es la misma puerta con otro material | Se copia el cuadro actual, se cambia el material y la copia se desvanece en 0.42 s. Es un fundido real entre los dos aspectos. |
| **Enlace desde el catálogo** (`?pieza=`) | Llegar directo a la pieza | Ahora abre la puerta ya acercada a esa pieza. |
| **Recorrido sin atravesar nada** | — | Si la línea recta cruzaría algo (la hoja abierta), la cámara rodea por fuera con una curva. |
| **Celular** | — | La nota de la pieza tapa la parte baja del visor, así que la pieza se encuadra en la parte libre, por encima de la nota. |

Con "reducir movimiento" la cámara salta directo al encuadre y el acabado cambia sin fundido.

## Archivos

- **`src/ui/doorPage.js`:**
  - acercamiento con búsqueda de ángulo
  - seguimiento de la pieza
  - "Ver toda la puerta"
  - fundido
  - `window.__door` expone los puntos y un `Raycaster` para las pruebas
- **`src/core/cameraRig.js`:** `destination` y `shift()`
- **`src/styles/door.css`**

## Verificación

Probado en el build de producción, con Chromium y GL por software:

| Prueba | Resultado |
|---|---|
| Visores 3D (Fase 7B) | 36 de 36. Las 4 puertas, con y sin reducir movimiento, y los 23 puntos uno por uno. En cada punto se comprobó: la pieza queda en el centro exacto del encuadre (0 mm de error), a la distancia mínima del visor, del mismo lado del muro, y nada la tapa. Además, el recorrido real cuadro a cuadro no atraviesa ninguna malla. También se comprobó "Ver toda la puerta" con el foco, el fundido de acabado (abatible, vaivén) y de modelo (CDS), sin fundido con reducir movimiento, el enlace `?pieza=`, y celular de 390 px en abatible, vaivén y CDS (pieza a la vista sobre la nota) |
| Regresión puertas | Abatible sin errores, corrediza 19/19, vaivén 23/23, CDS 20/20 |
| Regresión sitio | Catálogo 22/22; las 11 páginas 22/22 |

**Videos:** `acercamiento_abatible_chapa.gif` (escritorio) y `acercamiento_vaiven_bisagra.gif` (celular).

Las regresiones de las puertas corrieron antes del último ajuste, el del encuadre en celular. Ese ajuste solo actúa cuando la nota tapa el centro del visor, y se probó con los 36 casos y las 22 páginas.

**No probado:** fluidez en GPU y celulares reales, gesto real del dedo sobre los puntos, Safari y lectores de pantalla.

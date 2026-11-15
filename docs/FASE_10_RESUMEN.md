# Fase 10 · Inicio inmersivo

**Pedido:** llevar el Inicio al nivel de las referencias (ZRK Technology, Active Theory, Lusion, RESN, Bruno Simon, páginas de producto de Apple), integrar el 3D en el Inicio y usar solo las 4 fotos de puertas mejoradas por el propietario (`04_PRODUCTOS_FOTOGRAFIAS/PUERTAS_ORIGINALES`).

## La idea: cruzar la puerta

El sitio ya usaba "blanco es afuera, azul marino es adentro". El Inicio lo convierte en un recorrido continuo:

| Tramo | Qué pasa | Referencia |
|---|---|---|
| **Entrada (afuera, blanco)** | La vaivén inoxidable en 3D real, a pantalla completa, con el título al lado. Al bajar, las hojas abren hacia adentro (la derecha arranca 12° después, como en la página de la vaivén), sale el vaho de la cámara, unas etiquetas siguen a tres piezas reales del catálogo (03 ventanilla, 02 bisagra, 06 bumper) con la lectura de apertura en grados, y la cámara cruza el vano hasta el interior azul marino. | Lusion / Active Theory (3D en tiempo real), ZRK (lecturas técnicas sobre el objeto) |
| **Adentro: las tres puertas** | Un capítulo por puerta con su foto mejorada. La foto se descubre abriéndose **como esa puerta**: la abatible gira sobre su bisagra, la corrediza sube un poco y corre, la vaivén se separa al centro. Después llega el texto con datos de la ficha. | Apple (capítulos fijos que avanzan con el scroll) |
| **El sistema** | Las piezas con su número de catálogo, en formato de ficha. En escritorio, la foto de la pieza cambia al pasar por cada renglón. | ZRK (callouts numerados) |
| **CDS** | 36 cuadros dibujados con nuestro propio modelo CDS que avanzan con el scroll: el juego gira y la puerta central abre hasta quedarse a 90°. Pesa mucho menos que un segundo visor 3D. | Apple AirPods Pro (secuencia de imágenes) |
| **Salida (afuera, blanco)** | Cotizar. | |

## Qué se hizo

- **`src/home/hero.js`**: escena de la entrada. Usa el modelo aprobado de la vaivén sin cambios; solo mueve la cámara y el ángulo de las hojas. La cámara encaja la puerta en lo que deja libre el texto (al lado en horizontal, entre título y botones en vertical), medido en cada tamaño de pantalla.
- **`src/home/vapor.js`**: vaho de la cámara frigorífica, partículas suaves sin texturas; menos partículas en calidad baja y con tope de tamaño.
- **`src/home/scrub.js`**: avance de cada sección con el scroll nativo (no secuestra el desplazamiento), con un poco de inercia para que el movimiento se vea continuo.
- **`src/home/cdsSequence.js`** y **`scripts/render-cds-sequence.py`** (+ `lab/cds-secuencia.html`, interna): la secuencia CDS, en horizontal (1440 × 900) y vertical (720 × 900). Los cuadros se descargan cuando la sección se acerca, primero unos pocos repartidos y luego el resto.
- **`src/styles/home.css`**: estilos solo del Inicio. Los estilos del Inicio anterior se quitaron de `components.css`.
- **Fotos**: `scripts/build-home-photos.mjs` ahora solo usa las 4 puertas mejoradas y recorta solo el área transparente que traen dos de ellas. Las fotos de instalaciones de baja calidad ya no están en el Inicio (siguen en la página de CDS).
- **`src/viewers/vaiven.js`**: puede avisar el avance de la descarga del modelo (para el indicador de carga del Inicio). La geometría no cambia.

## Sin 3D, sin movimiento, teclado

- **Sin WebGL:** la entrada muestra la foto de la vaivén y es una pantalla normal (la página no se alarga).
- **Con «reducir movimiento»:** la entrada es una pantalla con la puerta quieta y cerrada, con sus etiquetas; los capítulos no se fijan y sus fotos se ven completas; la secuencia CDS muestra su último cuadro.
- **Con teclado:** si el foco llega al texto de un capítulo, la puerta ya está abierta y el texto a la vista. El texto de la entrada, una vez que se desvanece, deja de poder enfocarse.

## Verificación

| Prueba | Resultado |
|---|---|
| Recorrido completo, escritorio y celular (`f10/home.py`) | 19 de 19 |
| Encuadre de la entrada en 10 tamaños (escritorio, laptop, 4:3, ultra ancho, iPad, iPhone, iPhone SE y las 3 formas del iPhone Duo) | 10 de 10: la puerta completa, bajo el menú y sin tocar el texto |
| Accesibilidad (axe, WCAG 2.1 A/AA), escritorio y celular | 0 fallas |
| Celular simulado lento (4G lenta, CPU 4×) | LCP 0.7 s (el título), CLS 0.001, 3D listo a los 10.8 s con indicador de avance |

## Pendiente

- Probar en teléfonos reales: la fluidez del vaho y del cruce depende de la GPU, y aquí solo hay render por software.
- Las 4 fotos del Inicio son las mejoradas por el propietario: confirmar que se pueden publicar como imagen de producto.

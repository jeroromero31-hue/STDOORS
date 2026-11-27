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
- **Todo el sitio:** al pasar de una página a otra el contenido se funde y el menú se queda quieto (transiciones entre páginas del navegador; donde no hay soporte, la navegación es la de siempre; nada con «reducir movimiento»).

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
| Pruebas anteriores (puertas, 3D, movimiento, catálogo, cotizar, CDS, 7 tamaños, iPhone Duo, revisión de las 20 páginas) | Todas pasan: 23/23, 19/19, 36/36, 11/11, 22/22, 13/13, 20/20, 10/10, 7/7, Duo 9 páginas OK, 20/20 páginas limpias |

La prueba del Inicio anterior (Fase 6B) queda retirada: comprobaba un diseño que ya no existe, incluido "Inicio sin visores 3D", que ahora se cambió a pedido del propietario (un solo visor, que se descarga después del texto). La prueba de movimiento (Fase 7A) se actualizó al Inicio nuevo.

## Pendiente

- Probar en teléfonos reales: la fluidez del vaho y del cruce depende de la GPU, y aquí solo hay render por software.
- Las 4 fotos del Inicio son las mejoradas por el propietario: confirmar que se pueden publicar como imagen de producto.

---

# Fase 10B · Segunda vuelta

**Pedido:** otra foto de la abatible; CDS con apertura izquierda; potenciar todo guiándose por las referencias; "iba lento".

## Cambios

| Qué | Cómo |
|---|---|
| **CDS con bisagras a la izquierda** (en todo el sitio) | Igual que la foto de referencia del juego de 3 hojas. La hoja se refleja sobre el centro de su vano; herraje del marco, arrastre, encuadres y puntos de pieza ajustados (detalle en `DIFERENCIAS_CON_ORIGINALES.md`). La secuencia CDS del Inicio y la imagen fija de la página de CDS se volvieron a dibujar. |
| **Nueva imagen de la abatible** | Toma de estudio hecha con su modelo 3D: blanco sanitario, entreabierta, con el interior azul marino detrás. |
| **Más rápido** | Tramos de scroll más cortos (entrada 250svh en vez de 310, capítulos 175 en vez de 230, CDS 190 en vez de 240); el movimiento sigue al scroll casi sin retraso (inercia de 6–8 a 12–14); el modelo de la vaivén empieza a bajar junto con el JavaScript, no después; la entrada dibuja a lo más en calidad «media» (1.5×, sombras de 1024), casi el doble de rápido que «alta». |
| **Frase que se ilumina** (Apple) | Después de cruzar la puerta, una frase grande se enciende palabra por palabra con el scroll. |
| **Cifras grandes** (ZRK) | 3 formas de abrir · 76 piezas · 90° · 5 años de garantía CDS (según su ficha). Cuentan hasta su valor al llegar. |
| **Capítulos de cine** | En escritorio, la foto de cada puerta entra grande al centro de la pantalla, ahí abre su puerta y después se hace a un lado para dejar entrar el texto. |
| **Empujar la puerta** (Bruno Simon / Active Theory) | Con la vaivén cerrada, pasar el ratón rápido sobre una hoja (o tocarla en el celular) la mece hacia adentro y regresa sola, como una vaivén. |

## Verificación (10B)

| Prueba | Resultado |
|---|---|
| Recorrido del Inicio, escritorio y celular (incluye frase, cifras, capítulos de cine y empujar la puerta) | 25 de 25 |
| CDS con bisagras a la izquierda: eje y jaladera de las 3 puertas, apertura a 90° hacia afuera, arrastre con el ratón | 4 de 4 |
| Página de CDS (retención, autocierre, productos, pasos; el arrastre ahora jala hacia el lado nuevo) | 20 de 20 |
| Encuadre de la entrada en 10 tamaños, incluido el iPhone Duo | 10 de 10 |
| Accesibilidad (axe): la frase "apagada" se ve a 3.5:1, legible | 0 fallas |
| Puertas, 3D, movimiento, catálogo, cotizar, 7 tamaños, iPhone Duo, 20 páginas | 23/23, 19/19, 36/36, 11/11, 22/22, 13/13, 10/10, 7/7, Duo OK, 20/20 |
| Celular simulado lento | LCP 0.7 s, CLS 0.002; el 3D aparece a los **8.7 s** (antes 10.8) y dibuja el doble de rápido |

---

# Fase 10D · Inicio cinematográfico

**Pedido:** "elévala a un nivel más alto". Elegido por el propietario: **el Inicio**, y lo que más falta: **realismo del 3D** y **animaciones**.

## Realismo del 3D (`src/home/look.js`)

| Antes | Ahora |
|---|---|
| Estudio parejo: todo igual de iluminado | Un reflector suave desde arriba a la izquierda deja un círculo de luz alrededor de la puerta y la orilla más oscura, con sombras suaves del marco sobre el muro |
| Muro liso | Paneles de cámara frigorífica con sus juntas verticales cada 1.15 m y un relieve fino |
| Piso mate | Concreto pulido que refleja la luz |
| La puerta "flota" sobre el muro | Sombra de contacto alrededor del marco y en la base del muro |
| Interior azul plano | Al abrir, el interior se ilumina con luz fría y esa luz cae sobre el piso por el vano |
| | Grano fino de película y viñeta sobre la escena |

En teléfonos la escena se mantiene ligera (sin reflector, sin relieve, sin luz del interior): el círculo de luz lo da una viñeta y el resto se conserva.

## Animaciones (`src/home/cine.js`)

- **Intro con la marca:** pantalla azul marino con el logo ST y una barra de carga; cuando la puerta 3D está lista (o a los 2.6 s) se abre como una vaivén. Una vez por sesión; nunca con «reducir movimiento».
- **Títulos por líneas:** cada línea sube desde una ranura (entrada, capítulos, piezas, CDS y salida).
- **Scroll suave** con inercia en computadora (Lenis 1.3.27); en pantallas táctiles, el scroll del teléfono.
- **Cursor:** un anillo que crece sobre lo que se puede tocar y dice qué hace ("Abrir", "Ver", "Cotizar"); sobre la vaivén cerrada dice "Empuja".
- **Salida:** dos hojas azul marino se abren desde adentro y se vuelve al blanco de "¿Ya sabes qué necesitas?", el mismo gesto de la entrada al revés.

## Rendimiento

El título se sigue pintando desde el primer momento (bajo la intro), así que la página cuenta como cargada igual que antes: **LCP 0.8 s, CLS 0.001** en celular simulado lento.

---

# Fase 10E · Cada puerta, más a fondo

**Pedido:** desarrollar más cada puerta; la CDS se trababa en el Inicio; en las puertas con bumper, poder cambiar su medida y verla; secciones más inmersivas ("inventa algo"); más animación en todo.

## La CDS ya no traba el Inicio (`src/home/cdsSequence.js`)

Los 72 cuadros de la secuencia se decodificaban en el hilo principal al llegar a la sección. Ahora se decodifican fuera de él (`createImageBitmap`), de 3 en 3, y el lienzo se dibuja a 1.5× como máximo y sin transparencia.

## Páginas de puerta a pantalla completa (`src/ui/doorPage.js`, `src/styles/door.css`)

- En computadora el 3D ocupa todo el ancho y el texto flota encima en una tarjeta de vidrio a la izquierda. La cámara se corre (`stage.setInset`) para que la puerta quede centrada en el espacio libre, no debajo de la tarjeta.
- El paso que se está leyendo manda: su título entra por líneas y los demás quedan atenuados.
- Lectura en vivo en la esquina: "Apertura de hoja 63°" mientras se mueve la puerta.
- Títulos por líneas, cursor con etiqueta y scroll suave en todo el sitio (antes solo en el Inicio). Listas de piezas que entran en cascada.

## Bumper a la medida (vaivén)

Botones **150 · 500 · 1000 mm** junto a los acabados y en el paso del bumper. Al elegir:

- la franja de hule del modelo cambia de alto en el 3D (crece la cara plana; los cantos redondeados conservan su forma) y se acomoda entre la placa inferior y la ventanilla;
- la cámara encuadra el bumper completo, con una cota en milímetros y el contorno de la franja en las dos hojas;
- el punto de pieza pasa al número de catálogo de esa medida (06, 07 u 08);
- la medida queda en la URL (`?bumper=500`) y en la cotización ("bumper de 500 mm").

La abatible tiene un solo bumper en catálogo (inox diamante), por eso no lleva opciones.

## Lo inventado: «Ver el frío» (las 4 puertas)

Un botón junto a "Ver por dentro" y un paso propio al final del recorrido de cada puerta: la escena se vuelve una vista de cámara térmica. Detrás del muro está el frío; al abrir, el aire frío sale por el hueco, cae y corre por el piso con una corriente animada; al cerrar se disipa en un par de segundos.

- En la CDS cada puerta tiene su propia salida: solo la abierta deja salir frío.
- En la corrediza sale solo por la parte del hueco que la hoja ya no cubre.
- El vidrio se ve opaco, como en una cámara térmica real.
- Es **ilustrativa**: la escala dice "Frío" y "Ambiente", sin grados ni cifras inventadas.
- Al encenderla con el botón, si la puerta está cerrada se abre sola para mostrar la salida. En el paso del recorrido se enciende al llegar y se apaga al salir.
- Con "reducir movimiento": sin barrido de escáner y sin corriente animada.

Código: `src/core/thermal.js` (un material para toda la escena, con instancias), y en cada visor `thermal: { wallZ, floorY, openings() }`.

## Correcciones que salieron en las pruebas

- Los pasos que no se están leyendo ya no se atenúan (el texto atenuado no pasaba el contraste mínimo): esperan un poco más abajo y el paso actual se marca con una línea cian que crece a su lado.
- Los puntos de pieza y la cota se calculan con la cámara ya movida en cada cuadro (antes iban un cuadro atrás). Con eso, al cerrar la nota de una pieza el foco del teclado vuelve siempre al punto.

## Pruebas

| Prueba | Resultado |
|---|---|
| Inicio (escritorio, celular, reducir movimiento, sin WebGL) | 29/29 |
| Encuadre de la entrada en 10 tamaños | todos OK |
| Accesibilidad (axe) en las 9 páginas, escritorio y celular | 0 fallas |
| Abatible · corrediza · vaivén · CDS (recorridos completos, ajustados al 3D a pantalla completa y al paso «Ver el frío») | ver `docs/ENTREGA.md` |
| Puntos de pieza en las 4 puertas, con y sin movimiento | 36/36 |
| iPhone Duo (3 formas) y teléfonos | OK |
| Bumper 150/500/1000 y «Ver el frío» en las 4 puertas, escritorio y celular | sin errores en consola |

---

# Fase 10F · Bisagra igual a la foto, CDS mejor presentada y más vistas especiales

**Pedido:** bisagra de la abatible idéntica a la foto del componente; potenciar más todo, con más cosas del nivel de «Ver el frío»; presentar mejor las puertas CDS.

## Bisagra de la abatible (`src/viewers/abatible.js`)

Rehecha según `ABATIBLE_30_Bisagra_reversible_de_68_mm` (con las proporciones medidas sobre la foto): dos placas redondeadas una junto a otra, cuerpo en "C" con brazo superior grueso y brazo inferior delgado, perno a la vista, barril y collarín. La placa de la hoja va sobre el frente de la hoja; la del marco, sobre un suplemento que la sube al mismo plano (la hoja está 108 mm por delante del marco). La hoja gira sobre el eje del barril: barril y collarín se mantienen concéntricos en todo el recorrido.

**Despiece:** paso nuevo "Así está armada la bisagra". Al llegar, las piezas de la bisagra de arriba se separan hacia la cámara, una tras otra; al salir se arman. Botón "Separar piezas / Armar".

## CDS mejor presentada (`src/ui/cdsPage.js`, `src/viewers/cds.js`)

- **Comparador:** pestañas Advanced, Plus y LT. A la izquierda, el corte del vidrio animado: los vidrios entran y salen al cambiar de modelo, el argón se mueve entre ellos y la resistencia brilla en el vidrio de afuera. A la derecha: aplicación, vidrios, resistencia, argón, protección contra la humedad (la cifra y la barra suben hasta 65, 100 u 89 %) y garantía. Sigue al modelo elegido en el 3D y lleva a él.
- **Prueba de humedad:** paso nuevo del recorrido. Subes la humedad del lugar (30 a 100 %) y el vidrio de afuera se empaña si pasa la protección del modelo: el vaho aparece primero en las orillas, abajo y en gotas, y avanza hacia el centro.
- **Luces KeyLED:** botón "Apagar luces / Encender luces" en el paso de la iluminación; sin luces, el interior se oscurece.
- **«Ver el frío» en la CDS:** la escala dice la aplicación del modelo elegido (por ejemplo "LT: congelación, −20 °C").

Fuentes: vidrios, resistencia, argón y protección, del catálogo Legacy. Temperaturas de aplicación, de strefrigeracion.com/reachin.php. Donde la página de ST dice "2 vidrios con gas argón" para la Plus, se respetó el catálogo (dos vidrios con resistencia).

## Más vistas especiales

- **Rayos X (las 4 puertas):** junto a "Ver el frío". La puerta se vuelve transparente y se ven sus piezas de adentro (ejes, rodajas, refuerzos, parrillas). Las dos vistas van como un par de botones pequeños, una a la vez, con barrido de escáner al cambiar.
- **Inicio:** mientras las hojas de la vaivén abren con el scroll, la escena pasa a la vista térmica y se ve salir el frío por el piso; al seguir bajando regresa a la vista normal.

## Pruebas (10F)

Inicio 29/29 · encuadre de la entrada en todos los tamaños · abatible, corrediza 19/19, vaivén 23/23, CDS 20/20 · puntos de pieza 36/36 · componentes, industriales y sitio completos · iPhone Duo (3 formas y 9 páginas) · teléfonos · accesibilidad (axe) 0 fallas en las 9 páginas, escritorio y celular. Las pruebas de la CDS se ajustaron al comparador nuevo (pestañas, corte y protección 65/100/89 %).

Corrección que salió en las pruebas: el vaho y la capa de "luces apagadas" de la CDS estorbaban al tomar la puerta o un producto con el puntero; ya no se pueden tocar.

---

# Fase 10G · Anotaciones de ST, escáner en el Inicio y todo pensado para el celular

**Pedido:** pieza 09 de 5.80 m; vaivén semi aislante (con un enfoque igual de pro); perfil H de aluminio en todas las puertas; en la abatible, manguito roscado en vez de tapón blanco; bumper con su curva; bisagra de la abatible a su tamaño de pieza; Inicio al nivel de las páginas de puerta (con lo de rayos X); quitar el bajón de la CDS en el Inicio; Componentes y Cotizar al mismo nivel; prioridad al celular.

## Correcciones de ST

- **Pieza 09:** "Marco exterior 110, 5.80 m" (los PDF dicen 5.30 m; manda la corrección de ST). Cambia también su dirección en el catálogo.
- **Perfil de aluminio "H", 6.50 m:** aparece en las tres puertas industriales del catálogo.
- **Abatible:** los tapones blancos del marco pasan a ser **manguitos roscados** (pieza 21) como su foto: cabeza plana en "D" y el cuerpo metido en el marco (se ve en rayos X). El punto de pieza señala la 21.
- **Bisagra de la abatible:** el suplemento que la sube al frente de la hoja ahora es del color del marco; la bisagra gris queda del tamaño de la pieza.
- **Bumper de la vaivén:** ahora es la placa negra del catálogo, en las dos caras, que da la vuelta al canto de en medio con su curva, con tornillos arriba y del lado de la bisagra. Empieza después de la bisagra. Sigue cambiando a 150, 500 y 1000 mm con su cota.
- **Vaivén semi aislante:** en el título de la página, la ficha, el Inicio y el listado. Su vista térmica es distinta: la hoja cerrada se ve más fresca que el muro y por las juntas y por abajo se cuela un hilo de aire frío (frena el frío, no lo sella). En ese paso hay un botón **Simular paso**: las hojas se abren de golpe, se quedan un momento y regresan solas al centro, pasándose un poco del otro lado; con la vista térmica se ve cuánto frío sale en un paso.

## Inicio: escáner

Sección nueva después de las tres puertas industriales: "Míralas por dentro". Las cuatro puertas pasan, una por una, bajo una línea de escaneo; arriba de la línea la puerta queda en rayos X sobre un plano técnico y se van señalando sus piezas con el número del catálogo (en la CDS, sus funciones). Botón para abrir esa puerta en 3D.

Son imágenes de nuestros mismos modelos, dibujadas desde la misma cámara en normal y en rayos X (`scripts/render-escaner.py` con `lab/escaner.html`), en horizontal para computadora y en vertical para celular: en el teléfono no se carga 3D en esta sección. Las etiquetas se acomodan solas para no encimarse. Con "reducir movimiento", las cuatro puertas en rayos X una tras otra.

## Fluidez en el celular

- **CDS en el Inicio:** antes se decodificaban los 72 cuadros completos (en celular unos 190 MB de imagen en memoria) y el teléfono se trababa al llegar. Ahora se guardan los archivos comprimidos (~1 MB) y solo se decodifican, ya al tamaño de la pantalla, los 12 cuadros alrededor del que se ve.
- **Vista térmica:** en teléfonos se dibuja a 30 cuadros por segundo (la corriente se ve igual y el teléfono se calienta menos). Medido: la vista térmica y los rayos X cuestan menos que la vista normal.
- **Menú:** en celular ya no difumina lo de atrás (ese desenfoque se recalcula en cada cuadro del scroll).

## Componentes y Cotizar

- **Componentes:** botón "Ver en rayos X". Cada foto pasa a un plano azul con una línea de escaneo (una tras otra) y, si el nombre trae medida (5.80 m, 68 mm, 4.50 m…), aparece con su línea de cota. Las tarjetas de puerta muestran el render en rayos X de esa puerta. La elección se recuerda al cambiar de página.
- **Cotizar:** "Plano de tu solicitud" con puertas, piezas y unidades que cuentan al cambiar, y cada producto con su miniatura en rayos X (la puerta o la pieza). En celular, cantidad y "Quitar" van bajo el nombre.

---

# Fase 10H · Anotaciones de Luis, piezas que se juegan y cotizar a la medida

**Pedido:** quitar los rayos X de Componentes y hacer algo diferente; cotizar pensando en que las industriales son a la medida y las CDS por juego; vaivén con lámina abajo y bumper arriba (no doble bumper); bisagra de la vaivén metida en U como la MTH; bisagra de la abatible negra como el cerrojo; manija chica en la corrediza en vez de la palancota; guía de abajo de la corrediza hacia arriba; piezas flotando por la página que se puedan jugar; que la CDS del Inicio no se trabe; que la escala de «Ver el frío» no tape la puerta; todo más integrado y pensado para el celular.

## Herrajes según ST

- **Vaivén:** lámina metálica abajo siempre, bumper negro arriba. Bisagra con placas en U ("metidas"), como la MTH.
- **Abatible:** bisagra negra, como el cerrojo.
- **Corrediza:** manija externa fija chica (pieza 39) en lugar de la palanca de 68 mm; la guía de abajo con el brazo bajo el riel y el perno hacia arriba.

## Piezas que se juegan

Recortes reales de 16 piezas del catálogo (`scripts/build-flotantes.py`, fondo transparente, ~10 KB cada uno). Se agarran con el dedo o el ratón, se lanzan, chocan entre sí y se quedan donde las dejas. Tocar una sin arrastrar muestra su número y nombre con un enlace a su ficha.

- **Inicio:** flotan en las orillas de la frase de entrada, de las cifras y de la salida a cotizar, con un poco de profundidad al hacer scroll. La foto fija de "Cada pieza tiene su número" ahora es una **mesa de piezas**: pasar por un renglón levanta su pieza; tocar una pieza marca su renglón. En celular la mesa va arriba de la lista.
- **Componentes:** se quitaron los rayos X. Arriba hay una mesa con 8 piezas; tocar una abre su ficha.
- El bucle solo corre con la zona en pantalla y se detiene si nada se mueve; en celular el arrastre es directo y el resto de la página se desplaza normal.

## Cotizar a la medida

- Cada puerta industrial de la solicitud es una ficha: **medida del vano** (ancho × alto en cm; "1.20" se toma como metros), "aún no la tengo: que la tomen en la visita", uso (refrigeración o congelación), hacia dónde abre (bisagras o corrida a la izquierda o derecha) y, en la vaivén, una o dos hojas.
- Al lado, un **plano a escala** que se redibuja mientras escribes, con cotas y una persona de 1.70 m para darse idea del tamaño.
- **CDS por juego:** cuántas puertas lleva el juego, ancho de cada puerta (23", 26" o 30"), alto (67", 73" o 79") y modelo; el plano dibuja el juego completo. La cantidad cuenta juegos.
- **Agregar una puerta a la medida** directamente desde Cotizar (abatible, corrediza, vaivén o juego CDS) y "Agregar otra con otra medida" en cada ficha.
- El texto que se envía lleva todo: "1 × Puerta abatible — vano de 120 × 210 cm (2.52 m²), refrigeración, bisagras a la izquierda".

## Fluidez y detalles

- **CDS en el Inicio:** ya no es una secuencia de imágenes decodificada al vuelo: es un video corto (3 s, ~0.3 MB, H.264 con respaldo VP9; `scripts/build-cds-video.py`) que arranca solo al llegar a la pantalla, se queda en la puerta abierta y se repite si regresas desde arriba. El ángulo de la puerta cuenta en vivo (0° → 90°) y hay un botón para verla abrir otra vez. Con "reducir movimiento" se ve la puerta abierta y el botón.
- **«Ver el frío»:** la escala ahora es una tira delgada pegada al borde de abajo del visor (Frío → Ambiente); ya no tapa la puerta. Igual en la entrada del Inicio.
- Al agregar una puerta desde su página, el aviso dice que la medida se pone en Cotizar.

## Pruebas (10H)

Inicio 31/31 (mesa de piezas: arrastrar y tocar; video CDS que termina en 90°) · encuadre de la entrada en todos los tamaños · CDS con jaladera 4/4 · abatible · corrediza 20/20 (sin palanca, con manija 39 y guía nueva; las 118 mallas del modelo base siguen) · vaivén 23/23 (lámina siempre metálica) · CDS 20/20 · componentes 22/22 · cotizar e industriales 14/14 (puerta a la medida: 1.2 → 120 cm, plano y texto) · sitio 11/11 · puntos de pieza 36/36 · iPhone Duo y 9 páginas · teléfonos 10/10 · accesibilidad (axe) 0 fallas en las 9 páginas, y también en Cotizar con fichas a la medida llenas.

Corrección que salió en las pruebas: al pasar de «ancho» a «alto» en Cotizar, la lista se redibujaba y se perdía lo escrito; ahora los cambios de la misma página no redibujan la lista.

---

# Fase 10I · Correcciones de ST, carga más rápida, navegación y Componentes / Industriales nuevos

**Pedido:** la manija nueva de la corrediza "vuela" y no es igual a la de la foto; la palanca grande, como opción; la CDS del Inicio se sigue trabando; más cosas para que la página se vea mejor; que el 3D cargue más rápido; el escáner del Inicio en celular tapa el producto; cambiar de puerta sin pasar por Menú → Industriales; algo especial para el plegable (Duo) con animación al plegar; que en celular no baje tanto la calidad del 3D; menú, Industriales, Componentes y la ficha de cada pieza, más trabajados. Y la bisagra de la abatible: pegada al marco y a la puerta, sin elevación, y gris como antes.

## Herrajes

- **Abatible:** la bisagra vuelve a gris (como la foto de la pieza 30). Ya no lleva suplemento: el marco rodea la hoja hasta su mismo frente (como en la foto de referencia de la abatible), así la placa del marco y la de la hoja quedan en un mismo plano, pegadas al marco y a la puerta. Los manguitos roscados van sobre ese frente.
- **Corrediza, manija:** quedaba 8 cm adelante de la hoja. Ahora cada soporte es la pieza de la foto: placa negra atornillada sobre la cara de la hoja junto al canto (dos tornillos), que dobla hacia afuera y termina en un nudillo redondo; el tubo de acero va entre los dos nudillos. La barra de la palanca que venía unida a la lámina de la hoja se separó en su propia malla (sin perder ni agregar triángulos).
- **Corrediza, palanca:** opción **Manija** en la página: "Manija fija" (pieza 39, la de siempre) o "Palanca 68 mm" (pieza 64). Se ve en el 3D, el punto de pieza cambia de número, queda en la dirección y en la solicitud. Hay un paso nuevo, "La manija".

## CDS en el Inicio

El video ahora sale de 96 cuadros reales dibujados con el modelo 3D a 30 por segundo (antes eran 36 cuadros con intermedios inventados por el programa, que se veían a saltos). Piso del interior mate, como la secuencia original. `scripts/render-cds-video.py`.

## 3D: carga y calidad

- **Modelos comprimidos:** la corrediza y la vaivén se descargan en gzip (`.binz`: 293 KB y 194 KB en vez de 1.2 MB cada una) y el navegador los descomprime sin pérdidas, con su tamaño verificado. Si el navegador no sabe descomprimir, pide el `.bin` original. `scripts/comprimir-modelos.mjs`.
- **Empiezan a bajar antes:** cada página de puerta (y el Inicio) pide su modelo desde el `<head>`, junto con el JavaScript.
- **Caché en el teléfono:** un service worker guarda JavaScript, estilos, fuentes y modelos (todo lo que lleva huella en el nombre) y las imágenes; al volver o al pasar de una puerta a otra abren al instante. Las páginas y los videos van siempre a la red.
- **Mientras carga:** la foto de la puerta difuminada y una barra con el avance real de la descarga.
- **Calidad en celular:** un teléfono ya no cae a "baja" solo por reportar pocos núcleos (los iPhone lo hacen); "media" dibuja a 2× y "baja" a 1.5×. Con la escena quieta se dibuja un cuadro a la densidad de la pantalla (hasta 2.5×): lo que se mira de cerca se ve nítido y al girar sigue fluido.

## Navegación

- **Menú nuevo (celular):** las cuatro puertas con su foto (un toque a cualquiera; la actual dice "Estás aquí"), luego Industriales, Componentes, Cotizar con lo que llevas e Inicio, y el contacto.
- **Computadora:** al pasar por "Industriales" se despliegan las tres puertas con su foto.
- **Cambiar de puerta:** en cada página de puerta, el nombre en la barra de secciones ("Corrediza ⌄") abre las cuatro puertas; al final de la página, "Otras puertas".
- **Entre páginas:** paso suave (desvanecido) en los navegadores que lo soportan; la barra de arriba no parpadea.

## Inicio: escáner en celular

Sobre la puerta solo van puntos con número; abajo, en una línea, la pieza que el escáner acaba de encontrar ("2 · Kit de cerrojo de 68 mm · Pieza 27"). La puerta se ve completa.

## Industriales

"Tres formas de abrir una cámara": las tres puertas en imagen alta que pasa a rayos X (al pasar el puntero; en celular, una vez al verse, en carrusel), **el espacio que pide cada una** visto desde arriba y animado (giro de la abatible, recorrido de la corrediza junto al muro, vaivén hacia los dos lados) y **lado a lado** (cómo abre, cómo cierra, aislamiento, espacio, acabados, piezas). Cierra con "Se fabrican a la medida de tu vano" y el enlace a cotizar.

## Componentes

- **Por tipo de pieza:** ocho tarjetas (herrajes, montaje, perfiles, fijación, empaques, protección, eléctrico, señalización), cada una con una pieza real recortada.
- **Tarjetas con número:** el número de catálogo va sobre la foto.
- **Ficha técnica:** número grande, tipo y puerta, foto sobre retícula con su cota cuando el nombre trae medida (5.80 m, 68 mm…), datos (número, tipo, medida, puerta, fuente), **dónde va** (la puerta con un punto que late en su lugar, para las piezas señaladas en el escáner), cantidad antes de agregar, **copiar referencia** y compartir (para mandarla por WhatsApp), y más piezas del mismo tipo y puerta.

## Plegables (Duo)

- Al plegar, desplegar o girar (un cambio brusco de ancho), dos hojas azul marino se juntan en la bisagra con el logotipo y vuelven a abrir, como una vaivén, mientras la página se reacomoda debajo. Con "reducir movimiento" no se anima.
- Abierto en dos pantallas: en las puertas, el texto en la pantalla izquierda y la puerta entera en la derecha (nada cae en la bisagra); también Cotizar y el menú se acomodan a cada pantalla.

## Pruebas (10I)

Inicio 31/31 · encuadre de la entrada en todos los tamaños · CDS con jaladera 4/4 · abatible (giro, despiece, pasos) · corrediza 21/21 (manija como la foto, opción de palanca, 119 mallas y los mismos 43 394 triángulos, modelo comprimido; si no descarga, imagen fija) · vaivén 23/23 · CDS 20/20 · componentes 22/22 · cotizar e industriales 14/14 (menú nuevo, tocables ≥ 44 px) · sitio 11/11 · puntos de pieza 36/36 · Duo 7/7 y 9 páginas en sus 3 tamaños · teléfonos 10/10 · accesibilidad (axe) 0 fallas en las 9 páginas y también con el menú abierto, la ficha de pieza y el cambio de puerta.

Correcciones que salieron en las pruebas: los toques (tapa de la corrediza, piezas flotantes) ahora se miden con la hora del evento, así un cuadro pesado no convierte un toque en arrastre; los números del escáner en celular se dibujan a 12 px.

# Fase 10J · A la medida en todo el sitio, verla con la cámara, encuentra tu pieza y WhatsApp

**Pedido:** que en celular la página sea todavía más ágil; la CDS del Inicio se sigue trabando; innovar más con llamadas a la acción sobre la medida e integrar lo que propusimos (ver la puerta con la cámara a la medida del vano, encontrar la pieza tocando la puerta, WhatsApp con el mensaje ya escrito) y dejar la página más completa.

## CDS en el Inicio

En iPhone el video se trababa porque Safari no lo descarga antes de tiempo (ignora `preload`): empezaba a reproducirse con lo que iba llegando. Ahora el video completo se baja por adelantado (cuando la página termina de cargar y queda libre, o cuando la sección está a dos pantallas y media) y se reproduce desde la memoria del teléfono; si no se puede, usa el video normal. Con "ahorro de datos" se baja solo al acercarse. Medido con red 4G lenta y desplazamiento rápido y lento: ni una espera ni un corte.

## Celular más ágil

- **El 3D quieto ya no se redibuja:** la red de seguridad del dibujo (un cuadro por segundo) ahora solo corre los 8 s después de cada cambio y nunca sobre el cuadro nítido. Con la puerta quieta, cero cuadros: sin tirones periódicos y menos batería.
- **Las páginas siguientes se adelantan:** al tocar o pasar por un enlace del sitio, el navegador ya va pidiendo la página (reglas de especulación) y, con el teléfono libre, se bajan los modelos de corrediza y vaivén, que quedan guardados.
- Lo nuevo (cámara, buscador de piezas, medida) se carga solo cuando se usa o se acerca; el Inicio pesa lo mismo que antes.

## La medida, en todo el sitio

Una sola medida para todo el sitio: se escribe una vez y la recuerdan el Inicio, Industriales, la página de cada puerta y Cotizar.

- **Inicio, «Hecha a la medida de tu vano»:** eliges la puerta, escribes ancho y alto y la ves a escala junto a una persona de 1.70 m, con su área. Desde ahí: agregar a la solicitud, verla con la cámara o mandar la medida por WhatsApp.
- **Cada puerta, «Tu puerta X, a la medida de tu vano»:** lo mismo, con el acabado y las opciones que elegiste en la página. En la CDS, el juego: cuántas puertas, ancho y alto.
- **Industriales:** la misma tarjeta al final.
- **«¿Cómo mido mi vano?»:** tres pasos ilustrados (ancho en tres alturas, alto en los dos lados, lo que estorba alrededor y el muro libre para la corrediza).
- **Barra fija en celular:** al bajar por una puerta aparece «Cotizar a la medida» (o «Cotizar el juego») con un botón de cámara al lado; se esconde al llegar a la sección.
- **Cotizar:** la puerta rápida ya trae la medida escrita.

## Verla en tu espacio (cámara)

La puerta a tamaño real con la cámara del teléfono, escalada a la medida escrita (si no hay medida, a una medida típica). En Android abre la realidad aumentada de Chrome y en iPhone la de Safari (Quick Look). En computadora muestra un código QR para abrirla en el teléfono con la misma medida. Botón «En tu espacio» junto a los rayos X, en la barra fija y en cada tarjeta de medida.

Modelos para la cámara: `scripts/build-ar.py` con `lab/ar.html` (solo en desarrollo, `VITE_LAB=1`) exporta las cuatro puertas a `public/ar/*.glbz` y sus medidas a `src/data/ar.json`; al abrir, el modelo se reescala en el teléfono a la medida (sin descargar otro archivo).

## Encuentra tu pieza

En Componentes, «¿No sabes cómo se llama? Toca dónde está»: eliges tu puerta y tocas la zona (bisagras, chapa, riel, poleas, manija, guía de abajo, empaques, marco, resistencia, bumper, ventanilla…) sobre la misma imagen del escáner; aparecen las piezas de esa zona con su número y foto, y cada una abre su ficha. Las zonas también están en una fila de botones arriba de los resultados. «¿No la reconoces?»: tomarle una foto y mandarla por WhatsApp. Se llega desde el menú («¿Qué pieza es?»), desde cada puerta (debajo de sus piezas) y desde el Inicio (debajo de la lista de piezas).

## WhatsApp con el mensaje escrito

Cada botón arma el mensaje según dónde estás: la medida y la puerta, la pieza con su número y cantidad, o la foto de la pieza (en el teléfono se comparte la foto directamente). En Cotizar, «Mandar por WhatsApp» siempre a la vista. **Falta el número de ST:** mientras no esté en `src/data/contacto.json` (`"whatsapp"`), WhatsApp se abre con el mensaje listo para elegir a quién mandarlo.

## Cuadros azules en algunos teléfonos (reporte de ST)

En el teléfono de una persona aparecían paneles azules al pasar del Inicio a las puertas; en otros no. Eran las dos hojas azul marino de la animación del plegable (Duo): se disparaban con cualquier cambio grande del ancho de la ventana, y en Android ese cambio también ocurre sin plegar nada: cuando algo de la página se sale por un lado, Chrome agranda la ventana para mostrarlo. Con la letra del teléfono más grande de lo normal pasaba en el Inicio (las cifras «5 años», el termómetro, las fichas de cada puerta), en las páginas de puerta (el aviso «Arrastra una hoja…»), en CDS (termómetro y pestañas de modelo) y en Cotizar (botón «Abrir correo con la solicitud»).

- La animación ahora solo sale si cambia la pantalla misma (plegar o desplegar), sin girar el teléfono, sin zoom y no en el primer segundo de la página. Probado: algo más ancho que la pantalla, girar y hacer zoom no la disparan; desplegar y plegar sí (`f10j/foldtest.py`).
- Nada se sale de lo ancho con la letra al 100 %, 130 % y 150 % en 360 px (Inicio, Industriales, las tres puertas, CDS, Componentes y Cotizar): los botones largos pasan a dos renglones en pantallas angostas, los títulos parten una palabra solo si no cabe sola, las cifras se ajustan a su columna y los termómetros recortan su texto con «…».
- Era un iPhone 17 con Safari: ahí el ancho de la pantalla nunca cambia, así que la animación del plegable ya no puede salir (antes la podía disparar, por ejemplo, el zoom con dos dedos). Además, por si era Safari dibujando el reverso de las hojas azules que se abren entre el Inicio y las puertas (y las de la entrada y el final): ahora cada hoja se desvanece en cuanto queda de canto, así no puede quedarse a la vista. No hay iPhone en este entorno para confirmarlo en real.
- Llegar con un enlace a una sección (p. ej. `/cds/#ficha`) va ahí de inmediato; antes, en un teléfono lento, la página se quedaba arriba mientras se preparaba el 3D.

## Pruebas (10J)

`f10j/flow10j.py` (nueva, 47 comprobaciones en celular 390 y 360 y escritorio): cada zona de las tres puertas muestra piezas; la manija de la corrediza lleva a la 39 y la 64; la ficha trae WhatsApp; la medida escrita en el Inicio aparece en la corrediza, en Industriales y en Cotizar; la cámara carga la corrediza a la escala del vano; barra fija con botones de 44 px; sin desborde; axe sin fallas en Componentes, Inicio con «Cómo medir», cámara e Industriales. Se corrigió en el camino: al pasar de «Ancho» a «Alto» la tarjeta se rehacía y borraba el alto (y en el teléfono cerraba el teclado). Pruebas anteriores actualizadas al botón nuevo de agregar, a WhatsApp siempre visible, al video CDS descargado por adelantado y a la intro (espera a que termine en vez de un tiempo fijo). Cadena completa: todo correcto; los dos gestos con un dedo (corrediza y vaivén) fallaron solo dentro de la cadena por lentitud del render por software y pasan solos (21/21 y 23/23), igual que la versión 10I en las mismas condiciones.

# Fase 10K · Realidad aumentada que se abre, a la medida y con productos; calculadora de fuga de frío

**Pedido:** optimizar la parte 3D en realidad aumentada: más inmersiva, que se puedan abrir las puertas, un escalado más manejable y que todo se pueda mover; en la CDS, que tenga productos y se puedan tomar; crear más cosas, subir el nivel de la página y agregar otra cosa innovadora.

## «Verla en tu espacio», nueva

- **Se abre y se cierra.** Cada modelo lleva su movimiento real, tomado de la misma puerta del sitio: bisagra de la abatible, levante y recorrido de la corrediza, las dos hojas del vaivén, las tres puertas de la CDS. Hay un botón «Ábrela / Ciérrala», un punto para tocar sobre la hoja y una barra para dejarla abierta a cualquier ángulo.
- **Dentro de la cámara (Android).** Los mismos controles aparecen sobre la imagen: abrirla, la barra de apertura y la ayuda «Muévela con un dedo · gírala con dos».
- **iPhone.** Quick Look no deja tocar la puerta. Por eso recibe una película armada en el teléfono, a la medida: cerrada, se abre, se queda abierta, se cierra y vuelve a empezar; en la CDS además salen dos productos y regresan. Los archivos se revisaron con las herramientas de USD de Pixar: abren bien y las piezas se mueven en el tiempo. No hay iPhone aquí para verlo en Quick Look.
- **La medida, ahí mismo y sin deformar.** Dos barras (ancho y alto) rehacen la puerta al momento, y la medida queda guardada para todo el sitio. Ya no se estira el modelo completo: solo lo que hay entre bisagras, manijas, chapas, ventanillas, perfiles y rieles, y esas piezas conservan su tamaño. Lo de arriba sube con el vano; la manija, la bisagra de abajo y la ventanilla se quedan a su altura. En la corrediza, el riel y el recorrido de la hoja crecen con el ancho.
- **Cotas en centímetros** sobre la puerta (ancho y alto), también dentro de la cámara.
- **Escala en la cámara.** «Tamaño real» la deja fija a 1:1; «Libre» deja agrandarla o achicarla con dos dedos. En Android también se puede poner **en el piso o en la pared**. Siempre se mueve con un dedo y se gira con dos.
- **CDS con productos para tomar.** Seis productos llevan un «+». Al tocar uno, la puerta se abre, el producto sale de la parrilla, viene hacia ti, gira para enseñar la etiqueta y regresa. En la vista previa la cámara se acerca al producto.
- **Altura real.** La corrediza llega hasta el piso real (su hoja cuelga sobre la guía): antes, en la cámara, quedaba unos 12 cm más abajo.
- Modelos: `scripts/build-ar.py` con `lab/ar.html`; el ajuste a la medida está en `src/ui/arResize.js` y el exportador de iPhone con línea de tiempo en `src/ui/usdzAnim.js`. Pesos con gzip: abatible 0.82 MB, corrediza 0.41 MB, vaivén 0.40 MB y CDS 2.3 MB, porque ahora lleva sus productos.

## CDS: «Toma un producto» con un botón

En el paso «Toma un producto» de la página CDS hay un botón «Tomar un producto». Abre la puerta del centro, espera a que quede retenida a 90° y saca un producto. Dice cuál es y su tamaño (p. ej. «Agua purificada · 600 ml»). «Regresarlo» lo devuelve a la parrilla. Los que ya tomaste quedan en una lista. Arrastrar con el dedo sigue funcionando igual.

## Lo innovador: ¿Cuánto frío se escapa por tu puerta? (`/fuga-de-frio/`)

Una calculadora con una vista que imita a una cámara térmica: el corte de una cámara frigorífica con la puerta abierta, donde el aire frío sale por abajo y el tibio entra por arriba, con los mismos colores de «Ver el frío». La puerta se puede cerrar para ver cómo se detiene.

- **Datos:** medida de la puerta (si ya la escribiste en el sitio, la toma), temperatura adentro (refrigeración o congelación), temperatura y humedad afuera, aperturas al día, segundos que dura abierta cada vez, minutos al día que se queda abierta, protección del vano (nada, cortina hawaiana, cortina de aire), precio de la luz por kWh y altura de la ciudad.
- **Resultado:** pesos al mes y al año, kWh de luz, tiempo abierta al día, el calor que entra con la puerta abierta (comparado con calentadores de 1,500 W) y los litros de agua que el equipo tiene que sacar del aire.
- **«¿Qué cambia si…?»:** lo que ahorras si cada apertura dura la mitad, si no se queda abierta, con cortina hawaiana o con la mitad de aperturas.
- **Siguiente paso:** cotizar con esa medida, verla con la cámara o mandar el cálculo por WhatsApp.
- **En el celular** el resultado te sigue en una barrita mientras mueves los datos.
- **Método:** el de Gosney y Olama que usa ASHRAE para la puerta de una cámara frigorífica, con factor de flujo 0.8 (si la diferencia pasa de 11 °C; si no, 1.1), protección 0.9 para la cortina de tiras y 0.5 para la de aire, y aire húmedo calculado según la altura de la ciudad. La luz se calcula con un equipo de eficiencia típica (COP 2.5 en refrigeración y 1.5 en congelación) y 30 días al mes. El precio de inicio es de $4.00 por kWh y se cambia por el del recibo. Es una estimación para comparar y la página lo dice.
- **Se llega desde** el menú («¿Cuánto frío se escapa?»), el Inicio (junto a la medida) y el paso «Mira por dónde se escapa el frío» de cada puerta.

## Pruebas (10K)

`f10k/flow10k.py` (nueva):
- La vista con cámara, en celular y en escritorio:
  - La abatible de 120 × 260 se arma con marco de 1.44 × 2.72 m y cotas de 120 y 260 cm.
  - La barra de ancho la rehace en vivo y guarda la medida.
  - «Ábrela» y la barra de apertura funcionan; «Libre» cambia la escala.
  - Sale el QR en computadora y pasa axe.
  - La corrediza mide 3.26 m de alto total, hasta el piso real.
  - La CDS trae 6 productos y tomar uno funciona.
- La calculadora:
  - Con los datos de inicio da $1,406 al mes; en congelación, $5,144; con cortina hawaiana, $514.
  - El texto de WhatsApp, la barrita del celular, sin desborde y axe.
- Las entradas desde el menú, el Inicio y las puertas.
- «Tomar un producto» en la página CDS.

Los archivos de iPhone se revisan con `f10k/usdz.py` y `f10k/usdcheck.py`, que usan las herramientas de USD.

La calculadora entró a las revisiones de toda la página: en los tres tamaños del Duo no se desborda, todo lo que se toca mide al menos 44 px y no hay texto de menos de 12 px; pasa axe en celular y escritorio y no se desborda con la letra del teléfono al 130 % y al 150 %. En la cadena completa todo pasa, salvo el gesto con un dedo de la corrediza, que solo falla dentro de la cadena por lo lento del render por software (igual que en 10J).

# Fase 11 · «Tu puerta en un minuto»: ruta guiada, configurador en vivo, chapa real y RA que se abre al tocarla

Pedido de ST: chapa idéntica a la real; la calculadora con otro enfoque (que no se sienta como un gasto); un Inicio de
otro nivel; que el acabado se vea bien y se previsualice mientras se configura; que en la cámara la puerta se abra al
tocarla (no en un ciclo sin fin); y todo el sitio más digerible: una ruta que se recorra en menos de un minuto y que
deje saltar cualquier paso.

## El Inicio es una ruta de cinco paradas (`index.html`, `src/pages/inicio.js`, `src/styles/home.css`)
- **Entrada:** la foto de la abatible entreabierta. Al bajar, la foto se acerca al vano y el azul del interior crece
  desde él hasta llenar la pantalla: entras a la cámara. Es el único momento animado de la página.
- **Riel:** arriba, cinco segmentos (Elige · Por dentro · A tu medida · En tu espacio · Cotiza), la parada actual y
  **Saltar**. Cada segmento lleva directo a su parada.
- **1 Elige:** cuatro puertas, un toque; la ruta sigue sola. Si no eliges, se usa la abatible.
- **2 Por dentro:** la puerta elegida en rayos X (las imágenes del escáner); deslizas la línea y aparecen sus piezas con
  su número. «Ábrela en 3D» lleva a su página.
- **3 A tu medida:** acabado, medida (−/+ de 5 cm o escrita), bisagras u hojas y uso; en CDS, modelo, puertas y medidas
  estándar. **La puerta dibujada cambia al momento** (`src/ui/preview.js`: frente a escala, con su acabado, bumper,
  chapa, ventanillas, riel o productos, junto a una persona de 1.70 m). «Mírala en 3D» abre el visor a esa medida y con
  ese acabado.
- **4 En tu espacio:** la cámara (se abre al tocarla) y **lo que ahorras** al mes en luz con esa puerta.
- **5 Cotiza:** el resumen de lo elegido; «Cotizar esta puerta» la agrega con su configuración y abre Cotizar; o por
  WhatsApp con el mensaje escrito.
- Lo elegido se guarda en la medida compartida del sitio: la página de cada puerta abre con ese acabado y Cotizar lo trae.
- **Más ligero:** el Inicio ya no carga 3D ni precarga modelos (antes: three.js, el modelo de la vaivén y la secuencia
  CDS). Solo fotos; el 3D se descarga cuando lo pides.

## Chapa de la abatible, otra vez sobre la foto obligatoria (`src/viewers/abatible.js`)
Medida de frente sobre `ABATIBLE_CHAPA_REAL_REFERENCIA_OBLIGATORIA.png`: cuerpo gris mate más oscuro con las esquinas de
arriba muy redondeadas y la parte alta curvada hacia la hoja; cilindro europeo a 0.29 del ancho y 0.72 del alto; placa
negra plana de la mitad izquierda desde 0.59 del alto; jaladera con lóbulo grande a la izquierda que se afina hacia la
derecha y baja bajo el cuerpo. Sombreado suave (sin facetas). Comparación: `docs/capturas/fase11-chapa.png` (corregida en 11B).
Se rehicieron con la chapa nueva el modelo de la cámara, las imágenes del escáner y la foto de estudio del Inicio.

## Acabados que se ven bien (`src/materials/FinishRegistry.js`)
- **Negro:** pintura satinada (antes parecía vidrio negro): metal 0.3, rugosidad 0.5, barniz ligero.
- **Inoxidable:** cepillado satinado parejo, como el configurador original (antes reflejaba el cuarto como espejo):
  rugosidad 0.45, reflejo 0.95, anisotropía 0.4.
- El marco sigue la regla del configurador original: blanco con hoja blanca o negra; inoxidable con hoja inoxidable.

## Configurador en vivo, también en la cámara y en Cotizar
- La vista 3D/cámara trae los acabados de la abatible y de la vaivén; al tocar uno, la puerta cambia al momento
  (`finishGlb` en `src/ui/arResize.js` cambia el material dentro del GLB; en la abatible negra la hoja lleva su propio
  material para que el marco siga blanco). El iPhone recibe el mismo acabado (su USDZ se arma de esos bytes).
- Cotizar: cada puerta muestra el mismo dibujo en vivo, con chips de acabado y «Mírala en 3D, a esta medida».

## Realidad aumentada: se abre cuando la tocas
- **iPhone (Quick Look):** el USDZ ya no repite una película. Lleva comportamientos de Apple (`src/ui/usdzTap.js`):
  tocar la puerta la abre; tocarla otra vez la cierra; en la CDS, tocar un producto lo saca y lo regresa. Cómo:
  línea de tiempo por tramos (cerrada, abrir, abierta, cerrar, tomar-N), nada se reproduce solo, la puerta va dos veces
  (A cerrada / B abierta, misma geometría) y cada toque cambia cuál se ve; al final de cada tramo, su pose quieta en
  bucle (Quick Look regresa al primer cuadro si no). Validado con las herramientas de USD (rutas completas, tramos y
  poses correctas). **Falta probarlo en un iPhone real.**
- **Android y vista previa:** tocar la puerta misma (no solo el punto) la abre o la cierra; arrastrar sigue girándola.

## Ahorro en vez de fuga (`/fuga-de-frio/`)
Ahora es «¿Cuánto puedes ahorrar en luz?». El número grande (en verde) es el ahorro al mes entre cómo se usa tu puerta
hoy y con los cambios que marcas: que cierre en 10 s, que no se quede abierta, cortina hawaiana. Cada cambio se puede
quitar. El costo de hoy queda como dato chico. En el menú y en las puertas: «Calcula tu ahorro».

## Menú y Cotizar
- Menú del celular azul marino («adentro de la cámara»): la ruta de un minuto arriba, las cuatro puertas en una tira
  que se desliza, y Industriales, Componentes, ¿Qué pieza es?, Calcula tu ahorro y Cotizar.
- Cotizar vacío invita a armar la puerta en un minuto; el texto de arriba es más corto.

## Pruebas (11)
`/home/claude/f11/flow11.py` (ruta completa en 390, 360 y escritorio, letra grande, axe, cámara con acabados y toque,
chapa, acabado compartido, Cotizar) y la cadena de regresión (`f11/chain11.sh`). USDZ: `f11/usdz.py` + `f11/usdtap.py`.


# Fase 11B · «Baja a −20 °C»: el Inicio de antes, con termómetro, escarcha y recorrido de 60 s

ST pidió no quitar el diseño que ya funcionaba: la ruta de cinco paradas de la Fase 11 se retiró y **el Inicio de la
Fase 10K regresó completo** (la vaivén en 3D que se abre con el scroll, los tres capítulos, los rayos X, las piezas, la
CDS, la medida y el cierre). Encima se montó una capa nueva (`src/home/frio.js`, `src/styles/frio.css`):

- **Termómetro del recorrido:** en el borde derecho. La temperatura baja con el scroll, de 30 °C afuera a −20 °C al
  final (cada capítulo tiene la suya). Al tocarlo se abren los 10 capítulos con su temperatura para brincar a cualquiera,
  y el botón «Recorrido de 60 s».
- **Escarcha:** debajo de 0 °C las orillas de la pantalla se escarchan (más mientras más frío); al regresar se derrite.
  Al cruzar 0 °C el teléfono da un toque de vibración, si lo permite.
- **Recorrido de 60 s:** desde la portada, el termómetro o el menú (`/?recorrido=1`). La página se recorre sola,
  capítulo por capítulo (la vaivén se abre, entras, las tres puertas, los rayos X, las piezas, la CDS, la medida y
  Cotiza), con una línea que dice qué estás viendo. Tocar la pantalla lo pausa; «Seguir», «Siguiente» y «Salir».
- **Vista previa en vivo en «Hecha a la medida»:** la puerta dibujada a escala con su acabado (chips de acabado en la
  abatible y la vaivén); en las páginas de puerta, cambiar el acabado ahí cambia también la puerta 3D.
- Se quedan de la Fase 11: chapa, acabados, cámara que se abre al tocarla (también en iPhone), acabado en la cámara,
  calculadora de ahorro, menú nuevo y Cotizar con vista previa.

## Chapa, otra vez (11B)
Con la imagen de la pieza 27 (kit de cerrojo de 68 mm) que mandó ST: la foto de referencia está tomada desde un costado
y por eso la jaladera parecía cargada a la izquierda. Ahora: cuerpo gris mate hondo (7.4 × 16.6 × 5.8 cm) con aristas
muy redondeadas; cilindro de llave redondo, centrado arriba; placa negra centrada, del 92 % del ancho del frente, desde
la mitad hacia abajo; y debajo del cuerpo la jaladera en forma de bota: lóbulo que cuelga a la izquierda (donde entran
los dedos), esquina redonda a la derecha justo bajo el cuerpo, inclinada hacia afuera. Comparación con la pieza 27 y con
la foto: `docs/capturas/fase11b-chapa.png`. Se rehicieron el modelo de la cámara, los rayos X y la foto de la abatible.

## Pruebas (11B)
`/home/claude/f11/flow11b.py` (el Inicio completo, termómetro, escarcha, capítulos, recorrido con pausa/siguiente/salir,
`/?recorrido=1`, medida con vista previa, Cotizar, menú, calculadora, cámara, chapa) y la cadena de regresión con las
pruebas del Inicio de la Fase 10 otra vez activas.


# Fase 11C · chapa y liberador con las fotos de ST, sin recorrido automático, escarcha que se derrite con el dedo

- **Se quitó el recorrido de 60 s** (ST no lo quería literal). Se quedan el termómetro (brincar entre capítulos) y la
  escarcha bajo 0 °C.
- **Tu dedo derrite la escarcha:** donde tocas (o pasas el cursor) la escarcha se derrite en un círculo y vuelve a
  congelarse en 2.6 s. La primera vez aparece una pista. Son capas de máscara CSS sobre la escarcha: no estorban al
  scroll ni usan canvas (`frostLayer` en `src/home/frio.js`).
- **Páginas de puerta: el frío se escapa mientras está abierta.** Si la hoja pasa de 20° de apertura, las orillas de la
  pantalla se escarchan poco a poco (hasta 70 %); al cerrarla se derrite en unos segundos.
- **Chapa exterior (fotos de frente y de lado):** cuerpo gris claro 9.2 × 18.5 × 5.6 cm (frente 1 : 2), tope y aristas
  redondeados; cilindro europeo centrado en el tercio de arriba, **sin llave**; placa negra centrada (68 % del ancho)
  metida en su hueco desde la mitad; debajo, jaladera simétrica en «T» (94 % del ancho) con hombros curvos, esquinas
  redondas y borde inferior apenas cóncavo, en cuña para que entren los dedos. Más arriba en la hoja (sobre el bumper).
- **Liberador interior (fotos de adentro):** caja gris horizontal con pliegue en «V», sobre placa con dos tornillos
  hexagonales; palanca verde con la etiqueta luminosa «PUSH» y lengüeta gris hacia el canto. Se ve al abrir la puerta.
- Comparación con las fotos: `docs/capturas/fase11c-chapa.png`. Se rehicieron el modelo de la cámara, los rayos X y la
  foto de la abatible.


# Fase 12 · optimización a fondo (Android, iPhone y computadora), vidrio que se limpia con el dedo y el liberador en la vista 3D

Pedido de ST: «optimizar al máximo nivel posible, sin perder calidad»: la CDS del Inicio se trababa (celular y
computadora), la vista térmica se veía mal en el celular, Android iba «súper lento»; integrar la manija interna de la
abatible a la vista 3D (Android y Apple); quitar la calculadora de ahorro e innovar con otra cosa.

## Qué se encontró y qué se hizo

**CDS del Inicio (el tirón).** El video tenía defectos en los propios cuadros: un cuadro en blanco y un salto de encuadre
a los 0.55 s (justo cuando la puerta empieza a abrir) y dos cuadros repetidos al final. Venía de capturar la pantalla
después de esperar. Ahora cada cuadro se dibuja y se lee del lienzo en la misma tarea (`window.shot`), a 1.5× y reducido
con Lanczos, **a 60 cuadros por segundo** (192 cuadros, antes 96 a 30), y se codifica con x264 lento («animation»).
`scripts/render-cds-video.py`. La lectura de grados solo toca el texto cuando cambia.

**Vista térmica en el celular.** La escala «Frío · Ambiente» chocaba con el termómetro del Inicio (las dos usaban la
clase `.thermo`): en las páginas de puerta la barra de colores salía debajo del visor, cruzando los botones. El
termómetro ahora es `.ftermo`. Además:
- El ruido del aire frío lee una textura (una lectura por llamada) en vez de 8 cálculos de hash: unas 5 veces menos
  trabajo por píxel.
- Se dibuja con menos píxeles (hasta 1.25× en el teléfono; una cámara térmica real es de baja resolución) y sin mapa de
  sombras (ese material no usa luces). En teléfonos, la corriente se anima a 30 cuadros por segundo.
- Más rango de color con la puerta cerrada: el aire es más tibio arriba y el piso más fresco, y la hoja cerrada se ve
  algo más fresca que el muro (del otro lado está la cámara fría). Antes con la puerta cerrada todo era naranja.

**Android lento — lo que más pesaba en la tarjeta gráfica:**
- **Desenfoque sobre el 3D.** La barra de secciones de las puertas difuminaba (`backdrop-filter`) el 3D que tenía
  debajo, en cada cuadro. En teléfonos y tabletas ya no difumina (fondo casi opaco); en computadora el radio bajó de 18 a
  14 px. Las etiquetas del 3D del Inicio tampoco difuminan.
- **Resolución dinámica** (`src/core/stage.js`): mientras algo se mueve, si el equipo no llega a ~45 cuadros por
  segundo se dibuja con menos píxeles (hasta 55 %), y vuelve a subir cuando sobra tiempo. Quieta, la escena se dibuja
  nítida a la densidad de la pantalla (como antes), así que lo que se mira de cerca no pierde calidad. Si bajar no
  mejora (pantalla a 30 Hz por ahorro de batería), regresa y no vuelve a bajar. Se recuerda entre páginas.
- **Sombras solo cuando algo se mueve:** el mapa de sombras se redibuja solo si cambió algo que proyecta sombra (o una
  luz), no al girar la cámara ni al seguir el scroll.
- **Sombreadores en paralelo** (`stage.precompile`, KHR_parallel_shader_compile, que tiene Chrome en Android): antes el
  primer cuadro compilaba todo de golpe y trababa la página medio segundo o más. Donde el navegador no compila en
  paralelo se deja como antes (esperar solo atrasaría el primer cuadro).
- **Vaho del Inicio:** 90 partículas en el teléfono (antes 140), un poco más densas: se ve igual y se pintan menos
  píxeles (cada una puede ocupar un cuarto de la pantalla).

**Hilo principal (scroll):**
- **Escarcha:** era un `div` con dos texturas SVG de ruido (`feTurbulence`) y máscaras CSS; el teléfono recalculaba el
  ruido al repintar (al aparecer la barra del navegador, al derretir). Ahora es un lienzo que se pinta una vez, con una
  textura ya hecha (`public/img/frio/escarcha.webp`, 51 KB, `scripts/build-escarcha.py`) que se pide al acercarse a 0 °C
  (o al abrir la puerta). Su intensidad es la opacidad del lienzo: la anima la tarjeta gráfica sin repintar.
- **Escáner de rayos X:** el recorte de la imagen normal era `clip-path` (repintaba la imagen en cada cuadro) y la línea
  bajaba cambiando `top`. Ahora son transformaciones (el marco baja y la imagen sube lo mismo).

**Vista 3D y cámara:**
- **«Por dentro»:** en la abatible, la vista 3D tiene «Por fuera / Por dentro». «Por dentro» lleva la cámara atrás de
  la puerta, cerca del liberador (la manija de emergencia «PUSH»), con un letrero que lo señala; solo se ve desde atrás.
  En la cámara (Android y iPhone) el liberador ya venía en el modelo: rodea la puerta para verlo.
- **Puntos de la vista 3D centrados:** las cotas (cm), «Ábrela» y los productos se corrían medio tamaño hacia arriba
  a la izquierda (model-viewer ya los centra). Ya quedan sobre su punto.
- **iPhone:** el archivo para la cámara (USDZ) bajó de 9.8 a 4.4 MB (se juntan los vértices repetidos y se escriben menos
  cifras) y se arma en cuanto abre la vista (antes esperaba 0.7 s).
- **Más rápido al abrir:** al tocar (o pasar el cursor por) «En tu espacio», «Verla en tu espacio» o «Mírala en 3D», el
  visor y el modelo empiezan a bajar antes del clic.

Capturas: `docs/capturas/fase12-termica-antes-despues.png` (celular: antes la barra de colores cruzaba los botones;
ahora queda en el visor) y `docs/capturas/fase12-por-dentro.png` (vista 3D por fuera y «Por dentro» con el liberador).

## Calculadora retirada · lo nuevo: «Límpialo con el dedo» (CDS)
La calculadora de ahorro se quitó (página, menú, Inicio y puertas); `/fuga-de-frio/` manda al Inicio.
En su lugar, en la **Prueba de humedad** de la CDS: cuando el vidrio se empaña, **pasas el dedo (o el mouse) y lo
limpias**, como un vidrio real; con el tiempo se vuelve a empañar, más rápido entre más humedad le sobre al modelo, y al
final dice en cuántos segundos y qué modelo se quedaría claro con esa humedad (Plus, con resistencia en el vidrio). El
dedo sobre el vidrio no gira la cámara ni mueve la página; la jaladera sigue abriendo la puerta.

## Pruebas (12)
`/home/claude/f12/flow12.py` (vidrio que se limpia en celular y computadora, escala térmica dentro del visor y más
ligera, sombras al girar y al abrir, resolución dinámica, «Por dentro» y liberador, cotas centradas, escarcha en lienzo
y derretir, escáner con transformaciones, calculadora retirada, USDZ < 6 MB, video a 60 cuadros sin saltos ni
repetidos) y la cadena de regresión de las fases anteriores (con las pruebas de la calculadora cambiadas a «ya no está»).

## Fase 12B · computadora: el Inicio ya no se traba
ST lo abrió en la computadora (GitHub Pages) y el Inicio iba trabado.
- **Sin scroll suave por JavaScript (Lenis).** Movía la página desde el hilo principal: cada vez que el 3D tardaba un
  cuadro, toda la página se detenía. Ahora el scroll es el del navegador (con rueda y trackpad también es suave) y lo que
  sigue al scroll conserva su inercia propia.
- **Tope de píxeles mientras algo se mueve:** a lo más ~2.1 millones por cuadro en computadora (1.4 en el teléfono).
  En una laptop con pantalla de densidad 2 el 3D del Inicio pasaba de 5.2 a 2.1 millones de píxeles por cuadro (en la
  prueba, 2.3 veces más rápido). Quieta, la escena se sigue dibujando nítida a la densidad de la pantalla (y a 1.5× en
  pantallas de densidad 1, como antes).

## Fase 12B · iPhone: el Inicio salía con la foto en vez del 3D
En el iPhone de ST (GitHub Pages) la entrada mostraba la foto de respaldo, recortada. La descarga del modelo se tomaba
como error si llegaban más bytes de los que anunciaba el servidor (pasa cuando el servidor o la red comprimen al
enviar). Ahora ese tamaño solo sirve para la barra de avance, y si la descarga falla se pide otra vez directo de la
red antes de rendirse. Diagnóstico: cualquier página con `?debug=1` muestra abajo el navegador, la tarjeta gráfica y
los errores (`?debug=0` lo quita). El video de la CDS se codificó con 4 cuadros de referencia (más compatible con los
decodificadores de los teléfonos).


# Fase 13 · Google Ads: medición y botones que responden al anuncio

Estrategia de la fase 1 (una campaña de búsqueda, $3,000 MXN al mes, todo México): documento «ST Doors · Estrategia de
Google Ads, fase 1». En el sitio:
- **Eventos** (`src/ui/track.js`, a `dataLayer`): principales `whatsapp_click`, `llamada_click`, `cotizacion_enviada`;
  secundarios `agregar_solicitud`, `ar_abrir`, `ficha_pieza`, `correo_click`, `cotizacion_copiada`, `anuncio_boton`.
- **Google Tag Manager** se carga solo con su clave en `src/data/marketing.json` («gtm»); sin clave no se carga nada.
- **Visita de anuncio** (`utm_*` o `gclid`, se recuerda 30 días): una línea arriba con lo que buscó y su botón
  (cámara fría → cotizar a la medida; refacciones → encontrar mi pieza; CDS → cotizar el juego) y «Llamar».
  El grupo sale de `utm_content` (camara, refacciones, cds, vaiven).
- **De qué anuncio vino:** WhatsApp y el correo de cotización terminan con «Vengo de: anuncio de Google · …».
- **Barra del celular** de cada puerta: botón «Llamar».
Prueba: `/home/claude/f12/ads13.py` (30/30).

# Fase 14 · liberador de la abatible a su tamaño real y entrada nueva del Inicio («el umbral»)

## Liberador interior de la abatible
ST indicó que la chapa de adentro es más grande. Con las fotos (caja, placa con dos tornillos y palanca «PUSH») se
rehízo a su tamaño real (`src/viewers/abatible.js`, grupo `Liberador`):
- caja gris de **14.5 × 9 × 5.8 cm** (antes 10 × 6.2 × 4.2), con la parte de arriba doblada hacia la placa sobre un
  pliegue en «V» con la punta al centro, como en la foto de lado (antes el pliegue era una «Λ» de dos tiras);
- placa vertical con un tornillo hexagonal arriba y otro abajo de la caja, con su arandela;
- palanca verde de 7.2 × 9.6 cm con las dos esquinas del lado de la caja cortadas y la etiqueta luminosa «PUSH»;
- lengüeta gris hacia el canto, que termina antes del empaque. Todo junto mide ~24 × 15 cm.
El modelo de «Verla en tu espacio» se volvió a exportar (`python3 scripts/build-ar.py --solo abatible`) y «Por dentro»
señala el liberador nuevo. El escáner del Inicio (rayos X de la abatible) se volvió a dibujar con él
(`python3 scripts/render-escaner.py --solo abatible`).

## Entrada del Inicio: «el umbral»
Quien probó el sitio dijo que al bajar todo se volvía azul y había que seguir bajando: la entrada medía 2.5 pantallas
(la cámara cruzaba a un interior azul marino vacío) y luego venía la frase azul (1.7 pantallas más). Ahora:
- **Afuera**: el muro, el piso y la vaivén de inoxidable, de frente. Son tres imágenes (marco, hoja izquierda y hoja
  derecha) dibujadas con el mismo modelo 3D (`scripts/build-umbral.py` desde `lab/umbral.html`); el Inicio ya **no
  carga three.js ni el modelo** (≈ 2 MB menos) y funciona igual sin WebGL. Las piezas del muro se acomodan alrededor
  de la puerta: por el vano y las ventanillas se ve lo que hay adentro.
- **Al bajar** (0.9 de pantalla en total): las hojas abren hacia adentro con CSS 3D sobre su bisagra, como hojas
  pesadas (resorte con amortiguamiento); un brillo cruza el inoxidable y la cara se oscurece al alejarse de la luz. El
  aire frío sale como vaho blanco a ras de piso (`scripts/build-vaho.py`), la vista camina hacia la puerta y la cruza
  en una bocanada de vaho.
- **Adentro**: la cámara fría, clara (hielo, no azul marino), con las tres puertas: en el teléfono una lista con su
  imagen; desde tableta, de pie sobre el piso y a escala entre ellas. Cada una lleva a su página en 3D. Abajo, el
  enlace a las puertas CDS.
- **La puerta se empuja**: con la puerta cerrada, tocar una hoja la abre un poco, arrastrar su orilla hacia la
  bisagra la abre más y con el ratón basta pasarlo rápido. Regresa sola y pasa un poco del centro hacia afuera antes de
  quedarse quieta (doble acción). Al cargar, la puerta «respira» una vez. En Android, un toque corto de vibración.
- Se quitaron la cortina azul con el logo, la vista térmica de la entrada y la frase azul. Se quedan el termómetro
  (baja de 30 °C al entrar) y la escarcha (bajo 0 °C, más adelante).
- Solo se animan `transform` y `opacity`; el vaho se mueve solo mientras hay vaho y la entrada está a la vista. Con el
  procesador 4 veces más lento: ~1 ms de JavaScript por cuadro, 60 cuadros por segundo y sin tareas largas.
- Movimiento reducido o sin JavaScript: la puerta cerrada en la primera pantalla y las tres puertas debajo.
- Con el teclado, al llegar a las puertas de adentro se cruza la puerta para que se vean.
- Sin saltos al cargar (CLS 0.0001): desde el primer cuadro la página ya tiene el acomodo final (la clase `js` la pone
  el `<head>`) y la puerta aparece ya en su lugar, medida con la letra definitiva.

Pruebas: `/home/claude/f14/flow14.py` (33/33: tamaño del liberador, entrada en teléfono y computadora, empujar,
diez tamaños de pantalla, sin azul marino en ninguna parte de la entrada, movimiento reducido, sin JavaScript, axe).
Se adaptaron `f10/home.py`, `f10/hero_sizes.py`, `f11/flow11b.py` (9 capítulos en el termómetro), `f9/duo_pages.py` y
`f12/smoke.py` a la entrada nueva. Cadena completa (`/home/claude/f14/chain14.sh`, 23 pruebas): todo bien.

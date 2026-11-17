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

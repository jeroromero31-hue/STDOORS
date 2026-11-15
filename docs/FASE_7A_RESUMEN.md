# FASE 7A · Animaciones de página (sin 3D) — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
La Fase 7 se dividió en dos partes: esta (7A) y las animaciones dentro de los visores 3D (7B).
**Archivos originales:** no se modificó ninguno.

## Qué se mueve y por qué

El brief (§8) pide que cada animación responda a qué atributo del producto explica.

| Movimiento | Qué explica | Cuándo |
|---|---|---|
| **Entrada del Inicio:** la foto se abre desde el centro hacia los lados (1.1 s); el texto aparece a la vez | Que el producto es una puerta: el vano se abre como dos hojas | Una vez, al cargar |
| **Fichas técnicas:** los renglones aparecen en orden de lectura (60 ms entre uno y otro) | Que la ficha se lee de arriba abajo | Una vez, al llegar a la ficha. No se esconde si ya estaba a la vista o si se llegó con el enlace #ficha |
| **Contador de Cotizar:** salta al agregar algo | Que lo agregado llegó a la solicitud | Solo cuando sube, no al quitar |
| **Chips y tarjeta del modelo CDS:** el chip cede un poco al tocarlo y la tarjeta marca el cambio con suavidad | Que la elección se registró | Al tocar |

**Reglas que se cumplen:**
- Todo está dentro de `prefers-reduced-motion: no-preference`. Con "reducir movimiento" no hay ninguna animación y todo aparece completo desde el inicio.
- Solo cambian opacidad, transformación y recorte: el contenido no se mueve de lugar.
- No se usa la entrada con deslizamiento hacia arriba en cada sección. El brief y la guía de diseño la desaconsejan.

## Arreglo de paso: el contenido saltaba al cargar

Las pruebas encontraron que en todas las páginas el contenido bajaba 69 px al cargar. El menú lo pone el JavaScript después del primer pintado. Ahora la página reserva ese alto desde el principio (`--nav-h`, `body:has(> main:first-child)`).

- En el Inicio, el desplazamiento de carga (CLS) bajó de 0.05 a 0 con movimiento.
- Con "reducir movimiento" queda en 0.0004, por el cambio de fuente.

## Archivos

- **Nuevo:** `src/ui/motion.js`
- **Modificados:**
  - `src/ui/site.js` (llama a la ficha y al contador)
  - `src/styles/components.css`
  - `src/styles/tokens.css` (`--nav-h`)

## Verificación

Probado en el build de producción, con Chromium, con y sin "reducir movimiento":

| Prueba | Resultado |
|---|---|
| Movimiento | 11 de 11: la entrada se abre y termina completa, sin desplazar nada; sin animaciones con reducir movimiento; la ficha queda oculta antes de llegar y aparece completa al llegar; la ficha se ve completa si se llega directo; el contador salta al agregar y no al quitar, ni con reducir movimiento; en celular de 390 px no hay desborde |
| Regresión | Inicio 13/13, Cotizar 13/13, Catálogo 22/22, las 11 páginas 22/22 |
| Video de la entrada | `inicio_entrada_escritorio.gif` e `inicio_entrada_celular.gif` |

**No probado:** fluidez en celulares reales (60 fps), Safari (`:has` necesita iOS 15.4 o más reciente; en uno más viejo solo vuelve el salto de 69 px al cargar) y lectores de pantalla.

**Pendiente para la Fase 8:** la página de la puerta abatible acumula un CLS de 0.099 al desplazarse. Está justo debajo del límite "bueno" (0.1) y no viene de esta fase, pero conviene revisarlo.

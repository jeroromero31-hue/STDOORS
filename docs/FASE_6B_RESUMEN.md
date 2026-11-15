# FASE 6B · Página de Inicio — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

El Inicio (`/`), que antes era un esqueleto, ahora tiene cinco partes. No se usan bloques de tarjetas genéricas (brief §7).

1. **Entrada.** "El frío se queda de su lado." sobre el muro, y al lado la foto de la puerta vaivén de frente. La foto está tratada como el vano abierto en el muro, con sombra interior de marco, igual que el muro con vano de los visores 3D. Tiene dos botones: Puertas industriales y Puertas CDS. En celular el orden es título, foto y botones.
2. **Industrial y CDS con el mismo peso:** dos columnas iguales, cada una con foto, una frase, sus tres accesos y un dato respaldado.
   - Industrial: Abatible, Corrediza y Vaivén; "76 piezas de repuesto con número de catálogo".
   - CDS: Advanced, Plus y LT, que abren la página CDS con ese modelo en el visor; "Garantía de 5 años, según la ficha".
3. **"Lo que no se ve desde afuera"** (superficie azul marino, la del "Ver por dentro"). Una idea de ingeniería por puerta, con la foto de la pieza real del catálogo y un enlace a su 3D. Todo sale de las páginas de puerta y de los nombres del catálogo; no se agregó ningún dato nuevo.
4. **Instaladas:** mosaico con 3 fotos industriales y 3 CDS, y un enlace a la galería CDS.
5. **Cotizar:** "Ir a cotizar" y un correo directo (tomado de `contacto.json`).

**Sin 3D en el Inicio** (brief §8): no carga Three.js ni visores. Son 65 KB de JavaScript, y las fotos se sirven en AVIF/WebP a 640, 1280 y 1920 px, con carga diferida salvo la de entrada. Las animaciones quedan para la Fase 7.

## Fotos

`scripts/build-home-photos.mjs` crea `public/img/inicio/` (940 KB, 7 fotos en 2 formatos) y `src/data/inicio-fotos.json`.
- **Producto:** las 4 de `PUERTAS_ORIGINALES`. El archivo de la abatible trae blanco a la derecha y se recortó.
- **Instalaciones industriales:** 3 de las 4 de `REFERENCIAS_APROBADAS_Y_CAPTURAS`. La del montacargas con marca de un tercero quedó fuera, con el mismo criterio que las fotos CDS con marcas.

## Archivos

- **Nuevos:**
  - `src/pages/inicio.js`
  - `scripts/build-home-photos.mjs`
  - `src/data/inicio-fotos.json`
  - `public/img/inicio/`
- **Modificados:** `index.html` y `src/styles/components.css`.

## Verificación

Probado en el build de producción, con Chromium:

| Prueba | Resultado |
|---|---|
| Inicio | 13 de 13: sin 3D ni Three.js, un solo h1, Industrial y CDS con el mismo ancho y alto, los 16 enlaces internos existen (con su sección), las fotos cargan (la de entrada con prioridad y las demás en diferido), cada foto llena su marco, el mosaico tiene 3 + 3 sin huecos, las 4 ideas de ingeniería con enlace al 3D, el correo, el acceso "Plus" abre CDS con Plus, y celular de 390 y 360 px (sin desborde, todo lo tocable de 44 px o más, orden título → foto → botones) |
| Las 11 páginas, escritorio y celular | 22 de 22 |
| Vista rápida | Abre sin internet, con las 15 fotos |

**No probado:** Safari, celulares reales, GPU real, lectores de pantalla y la velocidad de carga en una red real.

## Pendientes y preguntas

1. **Fotos de producto:** ¿las de `PUERTAS_ORIGINALES` son fotos reales o renders? El brief prefiere fotos reales. Si son renders, conviene decirlo o cambiarlas.
2. **Fotos industriales:** ¿son instalaciones de ST? Se presentan como "Instaladas".
3. **Montacargas:** ¿se puede usar la foto con el montacargas Toyota?

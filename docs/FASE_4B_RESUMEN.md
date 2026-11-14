# FASE 4B · CDS Legacy: página completa — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

- **Comparador "Tres modelos, un mismo marco"** (`#modelos`). Hay una tarjeta para Advanced, Plus y LT, cada una con el color de su modelo.
  - Cada tarjeta lleva un corte del vidrio visto desde arriba: cuántos vidrios tiene, la resistencia (línea ondulada) y el argón (puntos). Solo aparece lo que dice el PDF.
  - El botón "Ver … en 3D" pone ese modelo en el visor y lleva al visor.
  - La tarjeta del modelo que está en el visor queda marcada.
  - Sin WebGL los botones se ocultan y las tarjetas se siguen leyendo.
- **Galería "Instaladas"** (`#instalaciones`) con 11 fotos reales.
  - Visor a pantalla completa con los botones Anterior, Siguiente y Cerrar, y un contador ("3 de 11").
  - Responde a las flechas del teclado y a Esc, y se puede deslizar con el dedo. Al cerrar, el foco vuelve a la foto.
  - Las fotos se sirven en WebP y AVIF a tres tamaños y la miniatura carga en diferido.
- **Submenú:** Cómo funciona · Modelos · Instalaciones · Ficha · Cotizar.
- **Ficha:** la tabla de modelos pasó al comparador. La ficha conserva medidas, opcionales, funciones y garantía.

## Archivos

- **Nuevos:**
  - `src/ui/cdsPage.js`
  - `scripts/build-cds-photos.mjs`
  - `src/data/cds-instalaciones.json`
  - `public/img/cds/` (66 archivos, 3.7 MB; el navegador baja solo el tamaño que necesita)
- **Modificados:** `cds/index.html`, `src/pages/cds.js`, `src/styles/components.css`.
- **Sin cambios en el código común** (`doorPage.js`), así que las puertas industriales no se tocaron.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Página CDS | 20 de 20. Son las 14 de la 4A más 6 nuevas: el comparador cambia el modelo y lleva al visor; el corte del vidrio coincide con el PDF; la galería tiene 11 fotos y el visor avanza, da la vuelta, responde a flechas y Esc y devuelve el foco; todas las fotos cargan y tienen texto alternativo; en celulares de 390 y 360 px el visor cabe, sus botones miden 48 px y se desliza con el dedo |
| Submenú en celular (CDS y las tres industriales, 360 y 390 px) | Sin enlaces encimados. En CDS el submenú se desliza de lado porque tiene 5 enlaces |
| Las 11 páginas, escritorio y celular | 22 de 22 sin errores, sin desbordamiento y sin imágenes rotas |
| Vista rápida de un solo archivo | Abre sin internet; las 11 fotos van incrustadas y el visor funciona |

Correcciones hechas durante la fase y ya verificadas:
- **Foto equivocada:** la galería mostraba por error la fachada de Kiosko. Se cambió por la foto correcta.
- **Persona en la foto 4:** se recortó el borde derecho donde aparecía la cara de una persona.
- **Submenú en celular:** los enlaces se encimaban. Ya no se encogen. Este cambio afecta también a las industriales y se volvió a probar en ellas.
- **Foto del visor:** en celular salía estirada a lo alto. Ahora conserva su proporción.

La prueba de 20 corrió antes de estas dos últimas correcciones. Esos cambios se comprobaron con la prueba del submenú, las 22 páginas y la vista rápida.

**No probado:** Safari, celulares reales, dedo real (el deslizamiento se probó con toques emulados), GPU real y lectores de pantalla.

## Pendientes y preguntas

1. **Permiso para fotos con marca:** ¿se pueden publicar las fotos de Beer Cave, Kiosko y la del póster? Si el cliente dice que sí, entran con un solo cambio en `scripts/build-cds-photos.mjs`.
2. **Pies de foto:** ¿quieres ciudad o tipo de negocio en cada foto? Hoy solo describen lo que se ve.
3. Siguen abiertas las preguntas de la 4A: si los 79" son de la hoja o del vano, las piezas CDS para el catálogo y la velocidad de cierre ajustable.

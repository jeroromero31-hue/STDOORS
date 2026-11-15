# FASE 5 · Catálogo de componentes — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

La página **Componentes** (`/componentes/`), que antes era un esqueleto, ahora es el catálogo completo de 76 piezas con fotografía real.

- **Al abrir no se listan todas** (brief §6). Primero aparecen las tres puertas (Abatible 27, Corrediza 57, Vaivén 10) y la búsqueda.
- **Búsqueda al escribir**, por nombre, tipo o puerta:
  - Ignora los acentos ("termico" encuentra "térmico").
  - Con varias palabras, deben aparecer todas.
  - Un número busca el número de pieza (3 = 03) y ese resultado va primero. "pieza 30" también funciona.
- **Filtros:**
  - Puerta (chips con cuántas piezas tiene cada una).
  - Tipo, mostrando solo los tipos que hay en lo que estás viendo. En celular la fila se desliza de lado.
- **Orden:** el del catálogo impreso, por número; las piezas sin número van al final. No se inventaron las piezas 36 y 70.
- **Ficha** en panel lateral (en celular, hoja inferior):
  - Foto, nombre y número del catálogo.
  - Avisos "Por confirmar" en las 11 piezas que los tienen.
  - Tipo, en qué puerta se usa (con enlace a la puerta) y el catálogo PDF de donde sale.
  - **Agregar o quitar de tu solicitud**, y el contador del menú se actualiza.
  - **Anterior / Siguiente** dentro de la lista actual.
- **Foto ampliada** a 1600 px. "Acercar" la muestra a tamaño real para recorrerla. Esc cierra solo la foto.
- **Puerta 3D:** las 17 piezas señaladas en las puertas tienen "Verla en la puerta … 3D". Ese botón abre la puerta en "Ver por dentro" con la pieza ya marcada (nuevo parámetro `?pieza=` en `doorPage.js`). Al revés, los enlaces de las puertas (`?id=` y `?fam=`) abren la ficha o la puerta en el catálogo.
- **La URL guarda** puerta, tipo, búsqueda y pieza abierta, así que se puede compartir el enlace a una pieza.

## Archivos

- **Nuevos:**
  - `src/ui/catalog.js`
  - `src/pages/componentes.js`
  - `src/data/piezas-3d.json`
- **Modificados:**
  - `componentes/index.html`
  - `src/styles/components.css` (estilos del catálogo)
  - `src/ui/doorPage.js` (solo `?pieza=`; sin el parámetro la puerta se comporta igual que antes)
  - `src/ui/site.js` (la hoja avisa al cerrarse)
  - `README.md`

## Verificación

Probado en el build de producción, con Chromium:

| Prueba | Resultado |
|---|---|
| Catálogo | 22 de 22: inicio sin lista, filtros y cuentas, búsqueda (7 casos comparados contra los datos), sin resultados, ficha con teclado, solicitud, paginación, foto ampliada, Esc y foco, enlaces directos, avisos, piezas sin número, botones 3D, las 94 fotos cargan, sin errores de consola, las 3 puertas abren en la pieza, y celular de 390 y 360 px (sin desborde y todo lo tocable de 44 px o más) |
| Las 11 páginas, escritorio y celular | 22 de 22 sin errores |
| Vista rápida de un solo archivo | Abre sin internet, con las 76 piezas incrustadas |

**Errores encontrados por las pruebas y corregidos:**
- **Mapa de piezas 3D incompleto:** en la Abatible leía 1 de sus 5 piezas. Ahora se compara en la prueba contra las anclas reales de cada visor.
- **Página ensanchada en celular:** la fila de tipos ensanchaba la página a 695 px en lugar de 390.

**No probado:** Safari, celulares reales, dedo real, GPU real y lectores de pantalla.

## Pendientes y preguntas

1. **Material y disponibilidad:** el brief los pide en el dataset, pero ni los PDF ni el inventario los traen. No se inventaron. ¿Hay una lista de materiales o existencias?
2. **4 piezas del PDF sin fotografía** siguen sin publicar (`pendientes_sin_publicar`), por ejemplo la "Pija galvanizada 12X2", que es la posible pieza 36. ¿Hay fotos?
3. **11 avisos "por confirmar"**, como el largo del perfil rompe puente (5.80 m o 4.50 m) y la numeración 69–76 de la Corrediza.
4. **Las piezas CDS no están en el catálogo** porque no hay imágenes de piezas CDS en el paquete.
5. **El envío de la solicitud** se construye en la Fase 6. Hoy la solicitud se guarda en el navegador.

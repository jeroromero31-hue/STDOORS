# FASE 6A · Cotizar, Industriales y menú — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
La Fase 6 se dividió en dos partes: esta (6A) y el Inicio (6B).
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

### Cotizar (`/cotizar/`)

- **Productos:** aquí aparece todo lo agregado desde las puertas, las CDS y el catálogo.
  - La cantidad se cambia con − y +, o escribiéndola (entre 1 y 99).
  - Cada producto se puede quitar, y la solicitud completa se puede vaciar.
  - Si está vacía, lo dice y lleva a Industriales, CDS y Componentes. Aun así se puede escribir una consulta general.
- **Formulario:**
  - Campos: nombre, empresa, ciudad, teléfono, correo y detalles.
  - Obligatorios: el nombre y al menos un teléfono o un correo.
  - Los errores salen junto al campo, en texto, y el foco va al primero.
- **Envío honesto** (brief §7: no simular envío sin destino configurado):
  - "Abrir correo con la solicitud" abre el programa de correo del usuario, dirigido a ST, con asunto y todo el texto. La envía el usuario.
  - "Copiar texto" copia la solicitud.
  - "Ver el texto que se enviará" muestra exactamente lo que se manda.
  - La lista no se borra al enviar.
- **WhatsApp:** el botón está programado, pero queda oculto mientras `src/data/contacto.json` no tenga un número confirmado. Para activarlo basta con escribir el número en ese archivo.
- **Datos de contacto en un solo archivo** (`src/data/contacto.json`). El pie de página ya los toma de ahí.

### Industriales (`/industriales/`)

- Las tres puertas, cada una con su imagen, cómo abre (la misma frase de su página), el botón para verla en 3D y cuántas piezas tiene en el catálogo.
- Un enlace a CDS para quien busca puertas de exhibición.

### Menú

- Marca la sección actual, también dentro de una puerta.
- En celular el menú abre con todas las secciones.

## Archivos

- **Nuevos:**
  - `src/ui/cotizar.js`
  - `src/pages/cotizar.js`
  - `src/pages/industriales.js`
  - `src/data/contacto.json`
- **Modificados:**
  - `cotizar/index.html`
  - `industriales/index.html`
  - `src/ui/site.js` (contacto, `solicitud.update` y `solicitud.clear`)
  - `src/styles/components.css`

## Verificación

Probado en el build de producción, con Chromium:

| Prueba | Resultado |
|---|---|
| Cotizar, Industriales y menú | 13 de 13: vacía, flujo real desde el catálogo, cantidades y límites, texto, validación y foco, mailto (destinatario, asunto, cuerpo), copiar, quitar y vaciar, Industriales, menú, y celular de 390 y 360 px (sin desborde y todo lo tocable de 44 px o más) |
| Catálogo (regresión) | 22 de 22 |
| Las 11 páginas, escritorio y celular | 22 de 22 |
| Vistas rápidas de Industriales y Cotizar | Abren sin internet |

**No probado:**
- Que el programa de correo del celular reciba bien el texto. El mailto se comprobó por su contenido, pero no se abrió ninguna app de correo real.
- Safari, celulares reales, dedo real y lectores de pantalla.

## Pendientes y preguntas

1. **Número de WhatsApp** de ST (o confirmar que no se usará).
2. **Correo y teléfono:** confirmar que siguen vigentes; salen del PDF de CDS.
3. **Servidor de formularios:** si más adelante hay uno (Formspree, correo del hosting, CRM), se cambia el envío sin tocar el resto.

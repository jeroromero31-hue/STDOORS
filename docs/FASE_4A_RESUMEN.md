# FASE 4A · CDS Legacy: el visor en el sitio — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

- **Página `/cds/`** con el juego de tres puertas Reach-In sobre el escenario común del sitio: mismo muro, piso, luz y cámara que las puertas industriales.
- **Mecánica conservada** del modelo aprobado:
  - Si se suelta antes de 90°, la puerta se cierra sola.
  - A 90° se queda retenida.
  - Con un producto fuera, la puerta no se cierra a mano y avisa "Devuelve el producto a la parrilla antes de cerrar la puerta".
- **Productos manipulables:** solo con la puerta retenida a 90°. Se toman, se giran y se devuelven con doble clic. Con la puerta cerrada no se pueden tomar, así que nunca atraviesan el vidrio.
- **Tres controles:**
  - Abrir/Cerrar: las tres puertas se retienen a 90°. "Cerrar" devuelve el producto que esté fuera y cierra.
  - Modelo: Advanced, Plus o LT. LT muestra el tercer vidrio.
  - Ver por dentro.
- **Ocho bloques de "Cómo funciona"**, cada uno con su cámara y la posición de las puertas: retención a 90°, autocierre (Kwik Torque), tomar un producto, Kwik Level, columna "T", triple sello, KeyLED y los tres modelos.
- **"Ver por dentro":** 6 funciones señaladas, cada una con su nota. Los textos salen del PDF y no publican porcentajes de protección.
- **Ficha:** los tres modelos, medidas estándar, opcionales de Advanced y garantía de 5 años.
- **Medidas del PDF:** cada puerta de 30" × 79" (antes el alto era 75", estimado).

## Cambios en el código común

- `src/ui/doorPage.js`:
  - Acepta otra sección del menú.
  - Admite opciones de texto (el modelo) en el lugar de los acabados.
  - Admite puntos con nota en vez de pieza del catálogo.
  - Deja la sección de piezas como opcional.
  - Las tres puertas industriales siguen pasando sus pruebas.
- **Arrastre CDS:** cambio en el código del original, marcado `[sitio]`.
  - Antes, desde la vista general la puerta no llegaba a 90° al arrastrarla; ahora sí.
  - Al llegar a 90° queda enganchada hasta que el puntero regresa.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Página CDS | 14 de 14: puertas, modelos, botón, arrastre a menos de 90° y a 90°, productos, pasos, ver por dentro, rueda, solicitud, celular 390 y 360 px, sin WebGL |
| Pasos en celular, tableta y escritorio | Correctos |
| Abatible, corrediza y vaivén | 17/17, 19/19 y las de la vaivén sin fallas |
| Las 11 páginas, escritorio y celular | Sin errores, sin desbordamiento, sin imágenes rotas |
| Vista rápida de un solo archivo | Abre sin internet; las tres puertas se retienen a 90° |

**No probado:** Safari, celulares reales, dedo real (solo emulado), GPU real y lectores de pantalla. La página CDS es la más pesada del sitio (1 056 productos en calidad alta); el rendimiento en equipos modestos se mide en la Fase 8.

## Pendientes y preguntas

1. **Alto de 79":** ¿es el alto de la hoja o del vano? Lo tomé como vano por puerta, igual que el ancho de 30".
2. **Piezas CDS:** el catálogo no tiene piezas CDS, así que la página no muestra esa sección. ¿Hay piezas que deban aparecer?
3. **Velocidad de cierre:** quedó fija en 3.5 s. ¿La quieres ajustable, como en el original?
4. **Para la 4B:** fotos de instalaciones reales en la página y el comparador de modelos más visual.

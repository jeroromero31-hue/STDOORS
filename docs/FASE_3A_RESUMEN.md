# FASE 3A · Puerta abatible: resumen

**Fecha:** 12 nov 2026 · **Modelo:** Fable 5.2, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

- **Visor de la abatible** en `/industriales/abatible/`, construido sobre el escenario y los materiales de la Fase 2.
- **Chapa nueva** según la fotografía obligatoria: cuerpo gris, cilindro de perfil europeo, palanca negra y jaladera. La contrapieza va en el canto del marco.
- **Bumper único:** inox diamante. Ya no hay selector de bumper ni de altura.
- **Tres acabados** del registro compartido: negro, inoxidable y blanco sanitario. El visor rechaza cualquier otro.
- **Página de puerta completa**, con una plantilla que reutilizarán la corrediza y la vaivén:
  - El modelo queda fijo a la izquierda y el texto lo recorre a la derecha. En celular el modelo queda arriba.
  - Tres controles: abrir o cerrar, acabado y ver por dentro.
  - "Ver por dentro" pasa el muro a azul marino y señala 5 piezas que llevan a su ficha.
  - "Cómo cierra": bisagras, empaque y chapa (pasos 1 a 3), más el bumper. Cada bloque mueve la cámara y la hoja.
  - Piezas de esta puerta (12 destacadas de 27), ficha y cotizar.
- **Módulos reutilizables:** `core/hinge.js` (hoja abisagrada y arrastre), `core/cameraRig.js`, `core/hotspots.js`, `ui/doorPage.js`.

## Correcciones que salieron al revisar

- **Eje de giro.** En el modelo base la hoja giraba 27.5 mm por delante del barril de las bisagras, y al abrir el barril se partía en dos. Moví el pivote al centro del barril. Por eso la apertura máxima pasó de 100° a 95°.
- **Logo gigante (error mío de la Fase 2).** Una regla de estilo que agregué al final de la Fase 2 dejaba el logo de la navegación a tamaño completo. El ZIP de la Fase 2 salió con ese error. Ya está corregido y verificado en todas las páginas (30 px).
- **Luz de estudio.** Los metales se veían gris plano. Agregué tiras de luz verticales al entorno; ahora el inoxidable y el aluminio muestran reflejos. La escena de calibración usa el mismo entorno.
- **Referencia mal rotulada.** `INDUSTRIAL_ABATIBLE_PRODUCTO_VISTA_3_4.png` muestra una puerta corrediza, no una abatible. No la usé para esta fase.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Separación entre barril móvil y fijo, de 0° a 95° | 0.000 mm |
| Arrastre con ratón sobre la hoja | La hoja sigue al puntero, la cámara se bloquea y la hoja se queda donde se suelta |
| Botón Abrir / Cerrar | Funciona y cambia su texto |
| Acabados | 3 opciones; un acabado no permitido se rechaza |
| Opciones de bumper en la página | 0 |
| Rueda del ratón sobre el visor | Desplaza la página (acerca solo con Ctrl o pellizco) |
| Pasos de "Cómo cierra" | Cambian cámara y ángulo: bisagra, empaque, chapa, bumper |
| Agregar a mi solicitud | Guarda "Puerta abatible, blanco sanitario" y actualiza el contador |
| Sin WebGL | Muestra una imagen de la puerta; el resto de la página funciona |
| Celular 390 × 844 | Sin desbordamiento; controles de 44 px o más |
| Errores de consola | 0 |

**No probado:** Safari, celulares reales, arrastre con el dedo y rendimiento en GPU real.

## Por confirmar contigo

1. ¿El marco debe ser inoxidable cuando la hoja es inoxidable, y blanco en los otros dos casos?
2. ¿La cara interior de la hoja lleva el mismo acabado que la exterior?
3. ¿La abatible abre más de 95°?
4. Medidas reales de la chapa, si las tienes.

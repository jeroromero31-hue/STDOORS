# FASE 3C-2 · Puerta vaivén: correcciones — resumen

**Fecha:** 14 nov 2026 · **Modelo:** Opus 5.5 (Fable ya no estaba disponible)
**Archivos originales:** no se modificó ninguno. `vaiven.bin` sigue idéntico al modelo aprobado; las correcciones se aplican al cargar.

## Qué quedó listo

1. **El perfil de aluminio de las orillas se ve completo en las dos caras** (lo que reportaste).
   - Causa: el marco traía tres tiras negras solo por el frente. Tapaban el perfil del lado de la bisagra y arriba, se metían 7 mm en él y se quedaban flotando al abrir.
   - Ahora: el perfil mide lo mismo de frente y por detrás, 29 px en la vista de prueba (antes 0 de frente).
2. **La hoja ya no atraviesa el marco.**
   - Antes entraba hasta 39.9 mm en el poste y 3.5 mm en el cabezal. Ahora, 0 mm en los 253 ángulos medidos, de −63° a +63°.
   - Para lograrlo el marco crece: cada poste se separa 31.5 mm (el marco es 63 mm más ancho) y el cabezal sube 6.5 mm.
   - Las hojas no cambian: misma medida, misma posición cerrada, misma orientación y misma apertura de 63°.
3. **Bisagra de dos ejes con mitad fija.**
   - La columna de nudillos queda en el marco; las placas con tornillos van con la hoja.
   - Al empujar hacia el frente, la hoja gira sobre el nudillo del frente; hacia atrás, sobre el de atrás.
   - Los nudillos de la cara contraria acompañan a la hoja, como el eslabón central de una bisagra de doble acción. Sin eso, la placa de esa cara se habría separado de su nudillo.
4. **Las hojas ya no cruzan sus empaques al abrir y cerrar juntas.** Con el botón, una arranca primero y la otra la sigue al pasar los 12°.
5. **El arrastre sigue funcionando hacia los dos lados**, con el eje correcto. El punto que tomas queda bajo el dedo o el puntero.

## Verificación

**Probado** en el build de producción, con Chromium y render por software:

| Prueba | Resultado |
|---|---|
| Geometría contra el original | 0 diferencias en 458 568 valores |
| Hoja dentro del marco, de −63° a +63° | 0 mm (antes 39.9 mm) |
| Mitad fija dentro del poste | 0 mm |
| Orientación y posición cerrada frente al original | Iguales (diferencia 0.00000003) |
| Prueba de control con el eje y el marco originales | Marca 39.89 mm y falla: la verificación sí detecta el problema |
| Entre hojas con el botón | 0 cuadros con las dos hojas a la vez cerca del cierre |
| Perfil de aluminio, frente y atrás | 29 px en las dos caras |
| Página de la vaivén | 23 de 23 comprobaciones (arrastre, botón, pasos, marco completo en 4 tamaños, táctil emulado, respaldos) |
| Pasos en celular, tableta y escritorio; saltos largos | Correctos |
| Abatible y corrediza | Idénticas píxel a píxel a la Fase 3C-1 |
| Las 11 páginas del sitio, escritorio y celular | Sin errores |
| Vista rápida de un solo archivo | Abre sin internet, en escritorio y celular |

**No probado:** Safari, celulares reales, dedo real (solo emulado), GPU real y lectores de pantalla.

## Límites

- **Empaques de canto al arrastrar.** Si arrastras una hoja mientras la otra está entreabierta entre 3° y 9°, sus empaques de canto pueden cruzarse hasta 6.7 mm. Es hule contra hule.
- **Ancho del marco.** Es 63 mm mayor que el del modelo original. Si me pasas las medidas reales de vano y hoja, lo ajusto a eso.
- **Forma de la bisagra.** Los ejes salen de la geometría de los nudillos, no de una ficha técnica. Con fotos de la bisagra instalada se puede afinar.

## Archivos

- `src/viewers/vaiven.rig.js`: ejes, medidas del marco y las funciones que ensanchan el marco y separan la bisagra.
- `src/viewers/vaiven.js`: mitad fija y escalonado de las dos hojas.
- `src/core/hinge.js`: giro sobre dos ejes y arrastre con cambio de eje. La abatible no cambia.
- `scripts/verify-vaiven.mjs`: sección de holguras.
- `docs/DIFERENCIAS_CON_ORIGINALES.md`: secciones 3C-2, parte 1 y parte 2.

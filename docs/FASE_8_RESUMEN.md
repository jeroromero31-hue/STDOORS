# FASE 8 · Optimización móvil — resumen

**Fecha:** 15 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno. No se tocó la geometría, la mecánica ni el aspecto aprobado de ninguna puerta.

## Cómo se midió

Celular simulado en Chromium: pantalla de 390 × 844, densidad 3, CPU cuatro veces más lenta y red "4G lenta" (1.6 Mb/s, 150 ms). Se recorre cada página hasta abajo.
- El script es `scripts/medicion/medir_movil.py`.
- Los datos crudos están en `docs/medicion_fase8_antes.json` y `docs/medicion_fase8_despues.json`.
- El 3D corre con GL por software: los segundos del visor y los cuadros por segundo **solo sirven para comparar antes y después**, no son lo que verá un teléfono.

| Página | Peso (comprimido) | LCP | CLS | Visor listo (s, GL por software) | Dibujos con la puerta quieta |
|---|---|---|---|---|---|
| / | 408 → 409 KB | 1.5 → 0.8 s | 0.000 → 0.000 | — → — | — → — |
| /industriales/ | 130 → 130 KB | 1.2 → 1.2 s | 0.000 → 0.000 | — → — | — → — |
| /industriales/abatible/ | 307 → 308 KB | 0.7 → 0.6 s | 0.017 → 0.000 | 5.3 → 5.8 | cada cuadro → 3 en 3 s |
| /industriales/corrediza/ | 605 → 606 KB | 0.8 → 0.8 s | 0.000 → 0.000 | 4.0 → 4.2 | cada cuadro → 3 en 3 s |
| /industriales/vaiven/ | 481 → 481 KB | 0.9 → 0.7 s | 0.025 → 0.000 | 3.8 → 4.1 | cada cuadro → 3 en 3 s |
| /cds/ | 721 → 721 KB | 0.7 → 0.8 s | 0.018 → 0.001 | 14.8 → 13.5 | cada cuadro → 4 en 3 s |
| /componentes/ | 147 → 147 KB | 1.8 → 1.7 s | 0.000 → 0.000 | — → — | — → — |
| /cotizar/ | 80 → 80 KB | 0.5 → 0.6 s | 0.000 → 0.000 | — → — | — → — |

El peso incluye las fotos que se cargan al bajar por la página. LCP es el tiempo hasta ver lo principal; CLS, cuánto se mueve el contenido (bueno: menos de 0.1).

## Qué se cambió

1. **El 3D solo dibuja cuando algo cambia** (`stage.js`).
   - Antes se dibujaba 60 veces por segundo aunque la puerta estuviera quieta. Ahora solo se dibuja cuando cambia algo: la cámara, posiciones, materiales, luces, instancias o el tamaño. Con la puerta quieta se dibuja una vez por segundo como red de seguridad.
   - En un teléfono esto significa menos batería y menos calor mientras se lee la página.
   - Detalles resueltos:
     - El propio dibujo de los vidrios sube la "versión" del material, así que no se usa.
     - El código CDS marca sus instancias como cambiadas en cada cuadro, así que se compara su contenido.
     - Con GPU muy lenta, la red de seguridad espera 3 cuadros sin dibujar.
2. **La calidad del 3D baja sola si va lento.** Mientras se dibuja de corrido se mide el tiempo entre cuadros. Si la mediana de 16 pasa de 50 ms (menos de 20 cuadros por segundo), baja un nivel: alta → media → baja. Nunca se toca si se fijó con `?calidad=`.
   - Niveles: alta = densidad 2 y sombras de 2048; media = 1.5 y 1024; baja = 1, sin sombras.
3. **Sin saltos de contenido:**
   - Los acabados van después de "Ver por dentro" y en celular tienen su renglón reservado: antes, al aparecer, empujaban la página 60 px.
   - Hay una **fuente de respaldo con las medidas de Outfit** (Arial o Roboto ajustada, con valores calculados con la frecuencia de letras del español): al llegar Outfit, el texto no cambia de renglones. En Componentes, el CLS en red lenta bajó de 0.155 a 0.
4. **La foto de entrada del Inicio está escrita en el HTML**, con prioridad alta, en vez de ponerla el JavaScript. Se probó que funciona también publicada en una subcarpeta (`VITE_BASE`). El LCP del Inicio bajó de 1.5 s a 0.8 s.
5. **El acercamiento a una pieza actualiza las posiciones** antes de apuntar, porque ahora el dibujo no lo hace en cada cuadro.
6. **`vite.config.js`** ignora los archivos temporales de Vite. Hacían fallar el build si coincidía con el servidor de vista previa.

## Lo que no bajó: el peso

| Pieza | Sin comprimir | Comprimido (gzip) | Nota |
|---|---|---|---|
| Three.js y código 3D común | 548 KB | ≈ 140 KB | Se descarga en cada puerta y queda en caché entre puertas |
| Geometría corrediza / vaivén (.bin) | 1.16 / 1.17 MB | ≈ 276 / 186 KB | Es la geometría aprobada |
| Fuentes Outfit (4 pesos) | 54 KB | — | woff2, solo latín |

Reducir la geometría con meshopt o Draco bajaría el .bin entre 50 y 70 %, pero cuantiza los vértices, es decir, cambia la geometría aprobada por fracciones de milímetro. No lo hice sin tu visto bueno.

Lo que sí conviene: publicar en un hosting que comprima con brotli o gzip (Netlify, Vercel, Cloudflare y GitHub Pages lo hacen solos). Con eso el peso real es la columna "comprimido".

## Verificación

| Prueba | Resultado |
|---|---|
| Dibujo cuando cambia | En las 4 puertas, quieta = 3 dibujos en 3 s (antes, todos los cuadros); al abrir se dibuja en cada cuadro |
| Calidad adaptativa | Baja de alta a media con 3D lento (mediana 1217 ms con GL por software); con `?calidad=alta` no cambia |
| Regresión completa | Abatible sin errores; corrediza 19/19, vaivén 23/23, CDS 20/20, 3D Fase 7B 36/36, catálogo 22/22, Cotizar 13/13, Inicio 13/13, movimiento 11/11, las 11 páginas 22/22 |

## Lo que solo se puede medir en un teléfono real

1. **Cuadros por segundo** del 3D al girar y al abrir, sobre todo en CDS (379 000 triángulos y 350 llamadas de dibujo).
2. **Tiempo real hasta ver el visor**, con la compilación de shaders en una GPU real.
3. **Si la calidad adaptativa baja cuando debe** y no antes. El umbral de 20 cuadros por segundo es una decisión que conviene confirmar.
4. **Batería y temperatura** tras unos minutos en una página de puerta.
5. **Safari en iPhone:** `:has()` necesita iOS 15.4 o más reciente, y `size-adjust` de la fuente de respaldo, iOS 17 o más reciente; en uno más viejo solo vuelve el pequeño salto al cargar.
6. **Peso real con la compresión del hosting** elegido.

Sugerencia de prueba: un Android de gama media (por ejemplo, un Samsung A15 o Moto G) y un iPhone de hace 3 o 4 años, abriendo cada puerta, girando 10 segundos y abriendo y cerrando.

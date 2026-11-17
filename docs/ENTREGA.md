# ST Doors · Entrega final (Fase 9)

**Fecha:** 15 nov 2026 · **Modelo:** Opus 5.5

**Contenido:**
- Estado de cada punto de la lista de aceptación del brief, con su evidencia.
- Lo que falta probar en dispositivos reales.
- Preguntas abiertas para ST.
- Cómo publicar.

Signos: ✅ comprobado aquí · ⚠️ comprobado en emulación; falta un dispositivo real · ❓ depende de una respuesta de ST.

## 1. Lista de aceptación

### Estructura

| Punto | Estado | Evidencia |
|---|---|---|
| Una sola navegación, tipografía, diseño y responsive coherentes | ✅ | Las 10 páginas, en escritorio y celular, sin desbordes, sin textos de menos de 12 px, sin imágenes rotas ni errores (20/20). La auditoría de accesibilidad axe (WCAG 2.1 A/AA) no encontró ninguna falla en ninguna página. |
| Inicio muestra Industrial y CDS de forma proporcional, con llamados útiles | ✅ | Dos columnas del mismo ancho y con fotos de la misma altura, con tres accesos cada una (prueba del Inicio, 13/13). |
| Sin botones inertes, enlaces rotos, rutas locales de Mac, errores JS ni recursos sin cargar | ✅ | Se revisaron 125 enlaces internos (página y sección): ninguno roto. Todos los botones visibles tienen función. No hay rutas `/Users/` ni `file://` en el código. Sin errores de consola ni peticiones fallidas. Las páginas internas (`lab/`) ya no se publican: tenían botones de muestra sin función. |
| Logo sin alteración geométrica | ✅ | En esta fase se encontró y corrigió el logo del pie de página: se veía 20 % más angosto. Ahora todos los logos conservan su proporción exacta (2.474). |

### Geometría y materiales

| Punto | Estado | Evidencia |
|---|---|---|
| Corrediza: un solo acabado, sin selector; poleas en el riel, dos bloques negros, guía inferior, tapa y bajada funcionando | ✅ | No tiene selector de acabados. La geometría es idéntica al modelo aprobado, valor por valor: 782 388 números comparados, 0 distintos. El movimiento, comparado en 1 660 posiciones contra el motor original, difiere como máximo 0.0005 mm (`npm run verificar`). Prueba de la corrediza, 19/19. |
| Abatible: tres acabados; bumper solo inox diamante; chapa con llave, cuerpo y tirador negro según foto | ✅ | Acabados: negro, inoxidable y blanco sanitario. No hay opciones para el bumper. La chapa se rehízo en la Fase 3A a partir de la foto (capturas en `docs/capturas/`). |
| Vaivén: tres acabados; marco frontal completo; dos hojas independientes sin intersecciones | ✅ | Los mismos tres acabados. El perfil de aluminio se ve completo en las dos caras (Fase 3C-2). En 253 ángulos la hoja queda dentro del marco con 0 mm de cruce; entre hojas solo se tocan los empaques, como en la realidad. Prueba de la vaivén, 23/23. |
| El mismo blanco sanitario, inoxidable y negro en vaivén y abatible | ✅ | Comparados en las dos puertas: mismo tipo de material, color, metal, rugosidad, laca, anisotropía y reflejo. Salen de un único registro (`FinishRegistry`). |
| Inoxidable claramente más reflejante, sin brillo plástico | ✅ | Inoxidable: metal 1, rugosidad 0.24, cepillado direccional y textura de rugosidad. Blanco: metal 0, rugosidad 0.46 y laca. Se ve en el mismo estudio de luz. |
| Bisagras mantienen el pivote; las hojas no se separan del marco | ✅ | Abatible: separación máxima 0 mm. Vaivén: hoja y nudillos dentro del marco, 0 mm. |
| Jaladeras CDS finas, proporcionales y en el marco compartido | ✅ | Geometría del modelo CDS aprobado, sin cambios. |
| CDS: tres puertas, retención a 90°, cierre automático antes de 90°, productos que se sacan y no atraviesan el vidrio | ✅ | Prueba de CDS, 20/20: retención, cierre automático, arrastre, sacar y devolver producto, y en celular. |

### Catálogo y contenido

| Punto | Estado | Evidencia |
|---|---|---|
| Piezas con nombre y familia reales; los dos perfiles extra de la vaivén sin número inventado | ✅ | `vaiven-perfil-aluminio-40-mm` y `vaiven-perfil-aluminio-h` muestran "Sin número de catálogo". |
| No existen piezas 36 ni 70 | ✅ | Comprobado en los datos y en la página. |
| Búsqueda, filtros y zoom funcionan; enlaces a fichas correctos | ✅ | Prueba del catálogo, 22/22, incluidos los enlaces directos y el ida y vuelta con la puerta 3D. |
| Lo que dice el sitio corresponde a los PDF y fotos, sin datos inventados | ✅ ❓ | Cada texto sale de los PDF o de los nombres del catálogo. Lo dudoso está marcado "por confirmar" (sección 3). |

### Interfaz, movimiento y rendimiento

| Punto | Estado | Evidencia |
|---|---|---|
| En escritorio la puerta es el foco y los controles aparecen según el contexto | ✅ | Tres controles fijos (Abrir, Ver por dentro, acabado o modelo); lo demás aparece en "Ver por dentro". |
| En celular pequeño, Android angosto, plegable y tablet: 3D encuadrado y todo usable | ⚠️ | Emulado en 7 tamaños: iPhone SE, Android 360, plegable cerrado 280 y abierto, tablet vertical y horizontal, escritorio. Las 4 puertas quedan completas en el visor, sin desborde, con controles de 44 px o más. Aquí se corrigió el encuadre de CDS en pantallas angostas. Después se agregó el **iPhone Duo**: pantalla exterior (466 × 678), interior vertical (626 × 890) e interior horizontal (890 × 626), y plegar y desplegar con la página abierta. Las 4 puertas se reencuadran completas, y las 9 páginas quedan sin desborde, con tocables de 44 px o más. Se corrigieron dos cosas: en la pantalla interior la página abría con el acercamiento a la bisagra en vez de la puerta completa, y el enlace "CDS" del menú medía 34 px de ancho. |
| El scroll funciona normal y hay respaldo sin WebGL | ✅ | Sin WebGL, cada puerta muestra su imagen fija, oculta los controles 3D, conserva los pasos y se desplaza normal. |
| "Reducir movimiento" quita lo no esencial | ✅ | Pruebas de movimiento (11/11) y de 3D (36/36), con y sin la opción. |
| Carga diferida; no cargar 76 fotos al abrir | ✅ | El catálogo no muestra piezas hasta elegir puerta o buscar, y las fotos cargan en diferido en tres tamaños. |
| Ratón y arrastre, tacto, teclado, zoom, cerrar y reabrir, botón "atrás" y estado tras cambiar acabado | ⚠️ | Probado en emulación: arrastre de hojas, toques, teclado y foco visible, zoom de foto, hojas y diálogos. Al volver con "atrás" se conservan la ficha y la lista. En esta fase se agregó que el acabado y el modelo elegidos queden en la URL, así que al volver se conservan. |
| Inicio inmersivo (Fase 10): la vaivén en 3D abre con el scroll y la cámara cruza al interior; capítulos de las tres puertas; secuencia CDS | ⚠️ | Recorrido completo 19/19 en escritorio y celular; encuadre de la entrada en 10 tamaños (incluido el iPhone Duo en sus 3 formas); axe 0 fallas; sin WebGL y con "reducir movimiento" probados. LCP 0.7 s y CLS 0.001 en celular simulado lento. Falta ver la fluidez en una GPU real. Detalle en `docs/FASE_10_RESUMEN.md`. |
| Páginas de puerta (Fase 10E): 3D a pantalla completa con tarjetas, bumper de la vaivén en 150/500/1000 mm con cota, «Ver el frío» (vista térmica) en las 4 puertas | ⚠️ | Probado en escritorio y celular sin errores. Falta verlo en una GPU real. Detalle en `docs/FASE_10_RESUMEN.md`. |
| Fase 10F: bisagra de la abatible según la foto (con despiece), comparador CDS con corte del vidrio, prueba de humedad, luces KeyLED, «Rayos X» en las 4 puertas y vista térmica en el Inicio | ⚠️ | Probado en escritorio y celular sin errores. Falta verlo en una GPU real. Detalle en `docs/FASE_10_RESUMEN.md`. |
| Fase 10G: anotaciones de ST (pieza 09, perfil H, manguito roscado, bumper con curva, vaivén semi aislante con «Simular paso»), escáner de rayos X en el Inicio, catálogo y cotización en rayos X, fluidez de la CDS en el Inicio y ajustes para celular | ⚠️ | Probado en escritorio y celular sin errores. Falta verlo en un teléfono real. Detalle en `docs/FASE_10_RESUMEN.md`. |
| Chrome y Safari reales | ⚠️ | Solo Chromium sin pantalla y con GL por software. **Safari no se ha probado** (sección 2). |

### Entrega de fuente

| Punto | Estado | Evidencia |
|---|---|---|
| El proyecto arranca siguiendo el README | ✅ | Desde un clon limpio: `npm ci`, `npm run build` y `npm run preview` sirven las 8 páginas con código 200, y `npm run verificar` pasa. |
| No se modificaron los originales de `01_MODELOS_ORIGINALES` | ✅ | La huella SHA-256 de los 4 HTML es idéntica a la de los ZIP subidos. El proyecto nunca los copió ni los editó. |
| Registro de cambios de geometría y materiales, y pendientes técnicos | ✅ | `docs/DIFERENCIAS_CON_ORIGINALES.md` (por puerta y fase), los resúmenes de cada fase en `docs/` y este documento. |

## 2. Falta probar en dispositivos reales

1. **Safari en iPhone:**
   - El 3D.
   - La fuente de respaldo (`size-adjust` necesita iOS 17 o más reciente).
   - `:has()`, que necesita iOS 15.4 o más reciente.
   - El correo que abre "Cotizar".
2. **Un Android de gama media y un iPhone de 3 o 4 años:**
   - Cuadros por segundo al girar y abrir, sobre todo en CDS (379 000 triángulos).
   - Tiempo hasta ver el 3D.
   - Que la calidad baje sola cuando debe.
   - Batería y temperatura tras unos minutos.
3. **Dedo real:** arrastrar hojas, deslizar fotos, tocar los puntos de "Ver por dentro".
4. **Lector de pantalla** (VoiceOver o TalkBack): el recorrido por las páginas y los avisos.
5. **El hosting final:** la compresión, la página 404 y la ruta si va en una subcarpeta.

## 3. Preguntas abiertas para ST

**Contenido y datos**
1. **CDS 79":** ¿es la medida de la hoja o del vano? Se tomó como vano.
2. **Cierre de CDS:** ¿la velocidad de cierre es ajustable? Hoy está fija en 3.5 s.
3. **Vaivén:** ¿las hojas regresan solas al centro? Hoy se quedan donde se sueltan.
4. **Medidas reales del vano** de cada puerta industrial.
5. **Material y disponibilidad de cada pieza:** el brief los pide, pero ni los PDF ni el inventario los traen.
6. **4 piezas del PDF sin foto**, entre ellas la "Pija galvanizada 12X2", posible pieza 36. ¿Hay fotos?
7. **11 avisos "por confirmar" en el catálogo**, por ejemplo el largo del perfil rompe puente (5.80 o 4.50 m) y la numeración 69–76 de la corrediza.
8. **Fotos de bisagras reales** para comparar con las del 3D.
9. **Inoxidable:** ¿el cepillado del 3D se parece al real?

**Fotos**
10. **Permiso para publicar fotos con marcas:** el letrero Beer Cave, la fachada de Kiosko, el póster con personas y la del montacargas Toyota.
11. Las fotos de `PUERTAS_ORIGINALES`, ¿son fotos reales o imágenes hechas por computadora?
12. Las 3 fotos industriales de "Instaladas", ¿son instalaciones de ST?
13. La foto CDS con un trabajador de espaldas, ¿se puede dejar?
14. ¿Ponemos ciudad o tipo de negocio en las fotos de instalaciones?

**Marca y publicación**
15. **Fuente Nexa:** archivos `.woff2` con licencia web. Outfit es provisional.
16. **Dominio y hosting:** con el dominio se generan el enlace canónico, la imagen para compartir y el sitemap.
17. **WhatsApp de ST** (o confirmar que no se usa) y si siguen vigentes info@strefrigeracion.mx y 33 3600 1376.
18. **Comprimir la geometría 3D** (meshopt o Draco): baja el peso a la mitad o menos, pero mueve los vértices fracciones de milímetro. ¿Se aprueba?

## 4. Cómo publicar

Los pasos completos están en el README (sección "Publicar"). En corto:

```bash
npm ci
SITE_URL=https://www.tudominio.mx npm run build     # o sin SITE_URL si aún no hay dominio
# sube el contenido de dist/ a Netlify, Cloudflare Pages, Vercel o tu servidor
```

- **En una subcarpeta:** `VITE_BASE=/carpeta/ npm run build`.
- **Correo y WhatsApp:** se cambian en `src/data/contacto.json`.
- **Páginas internas:** las de calibración y sistema de diseño no se publican; se ven con `npm run dev`.

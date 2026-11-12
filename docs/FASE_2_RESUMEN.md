# FASE 2 · Sistema visual y base técnica: resumen

**Fecha:** 12 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto
**Archivos originales:** no se modificó ninguno.

## Qué quedó listo

| Pieza | Archivo | Estado |
|---|---|---|
| Proyecto Vite multipágina | `vite.config.js`, `package.json` | Compila en 1.5 s; publicable en la raíz o en una subcarpeta |
| Tokens de diseño | `src/styles/tokens.css` | Color, escala tipográfica 1.333 fluida, espacio, radios por jerarquía, movimiento con movimiento reducido |
| Componentes de interfaz | `src/styles/components.css`, `src/ui/site.js` | Navegación con menú móvil, pie, botones, chips, selector segmentado, acabados, campos con error, búsqueda, ficha, hoja lateral con foco atrapado, aviso, "Mi solicitud" |
| Guía del sistema | `/lab/sistema.html` | Todo lo anterior, en uso real y con piezas reales |
| Registro de materiales | `src/materials/FinishRegistry.js` | Negro, inoxidable cepillado, blanco sanitario, bumper inox diamante, aluminio, aluminio negro CDS, vidrio, hule, plásticos, tornillería |
| Escena de calibración | `/lab/materiales.html` | Muestras con la misma luz, vistas frontal, 3/4 y detalle, giro del entorno, tres calidades y tabla de parámetros en vivo |
| Escenario 3D común | `src/core/stage.js` | Entorno de estudio propio sin HDRI de terceros, mapeo tonal neutro, calidad adaptativa, pausa fuera de pantalla, respaldo sin WebGL, gestos táctiles que no atrapan el desplazamiento |
| Imágenes del catálogo | `public/img/componentes/` | 76 piezas en AVIF y WebP a 480/960/1600 px: **4.7 MB en total** (los originales pesan 95 MB) |
| Datos del catálogo | `src/data/components.json` | 76 piezas con id estable, nombre, número, familias, tipo, PDF de origen, avisos e imágenes; 4 pendientes registradas sin publicar |
| Logo web | `public/img/marca/` | Sacado del PNG exacto 4K, recortado y escalado sin redibujar |
| Páginas | Inicio, Industriales, 3 puertas, CDS, Componentes, Cotizar | Esqueletos con la navegación real; cada una indica en qué fase se construye |

## Decisiones técnicas

- **Peso por página:** Three.js (≈128 KB gzip) solo se descarga en páginas con 3D. Una página sin 3D pesa unos 7 KB de JS y 4 KB de CSS, sin contar la fuente.
- **Mapeo tonal neutro** (`NeutralToneMapping`), para que el blanco sanitario siga siendo blanco y no se vuelva gris o crema.
- **Entorno de estudio propio:** sala gris neutra con bandas de luz alargadas, que dan lectura al acero cepillado. No usa HDRI con licencia de terceros.
- **Una sola instancia por acabado:** abatible y vaivén comparten `blackMetal`, `stainless` y `hygienicWhite`.
- **Calidad "baja":** quita anisotropía y barniz, pero conserva el color base.
- **Catálogo con las correcciones de la Fase 0:**
  - Piezas 09–26: una sola entrada compatible con Abatible y Corrediza.
  - Bisagra de vaivén: nombre tomado del PDF.
  - Perfiles extra de vaivén: nombres del PDF, sin número.
  - Avisos visibles en la pieza 10 y en las 69–76.
- **Pendientes sin publicar:** pija 12×2 (posible 36), palanca interna derecha (posible 70), refuerzo de palanca interna izquierda y PTR de vaivén.

## Calibración de materiales: lo observado

- **Primera pasada:** el entorno era oscuro y con tinte azul. El inoxidable se veía gris oscuro y el blanco, gris. Lo corregí con un entorno gris claro y neutro.
- **Diamante:** el patrón salía muy espaciado; lo ajusté a una densidad de unos 60 mm por motivo. Cada visor lo adapta al tamaño real del bumper.
- **Resultado:**
  - El blanco se ve blanco con brillo en el canto.
  - El negro es neutro, satinado y no es espejo.
  - El inoxidable muestra bandas de luz que se mueven al girar el entorno.
- **Falta en GPU real:** el render de prueba fue por software. La anisotropía y los reflejos se verán con más definición en una GPU real, y conviene revisar la calibración en tu equipo.

## Verificación

- **Probado:** 10 páginas en escritorio (1366 × 820) y móvil (390 × 844), servidas desde el build de producción.
  - 0 errores de consola, 0 recursos que fallen y 0 imágenes rotas.
  - 0 desbordamiento horizontal.
  - La fuente carga.
  - Todos los controles miden 44 px o más.
- **No probado:** Safari, iPhone y Android reales, rendimiento con GPU real y lector de pantalla.

## Preguntas abiertas

Ninguna detiene la Fase 3A:

- Licencia de Nexa.
- Numeración de las piezas 36, 70 y 71–76.
- GLB e imágenes de vaivén.
- Hosting y destino del formulario.
- Logos de clientes.
- Puerta de servicio.
- Opciones Advanced con 3 vidrios y Low-E.
- Visto bueno al concepto del muro y a los tipos de pieza (Fase 1).

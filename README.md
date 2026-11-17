# ST Doors: sitio web

Sitio estático multipágina hecho con Vite y Three.js r169. No usa framework ni servidor.

## Requisitos

- Node.js 18 o superior.

## Uso

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera el sitio publicable en dist/
npm run preview    # sirve dist/ en http://localhost:4173 para revisarlo
```

> **No abras `dist/index.html` con doble clic.** El sitio usa rutas absolutas y necesita servirse por HTTP (`npm run preview` o cualquier hosting).

## Publicar

- **En la raíz de un dominio:** sube el contenido de `dist/` a Netlify, Vercel, Cloudflare Pages o tu servidor.
- **En una subcarpeta**, por ejemplo GitHub Pages en `usuario.github.io/st-doors/`:
  ```bash
  VITE_BASE=/st-doors/ npm run build
  ```
  Los enlaces escritos en el HTML (`href="/…"`) y las imágenes se ajustan solos a la subcarpeta.
- **Con el dominio definitivo** agrega `SITE_URL` para generar el enlace canónico, la imagen para compartir y `sitemap.xml`:
  ```bash
  SITE_URL=https://www.tudominio.mx npm run build
  ```
  Sin `SITE_URL` se generan igual las etiquetas para compartir (título y descripción) y `robots.txt`.
- **Página 404:** `dist/404.html`. Netlify, Cloudflare Pages y GitHub Pages la usan solos. En Vercel o en un servidor propio hay que indicarla. `npm run preview` no la usa: ahí cualquier ruta inexistente muestra el Inicio.
- **Compresión:** conviene que el hosting sirva con brotli o gzip (los cuatro anteriores lo hacen solos). La geometría 3D y el código bajan a la cuarta parte.
- **Correo y WhatsApp de Cotizar:** se cambian en `src/data/contacto.json`. Mientras `whatsapp` sea `null`, el botón de WhatsApp no aparece.

## Páginas internas

`lab/materiales.html` (calibración de materiales), `lab/sistema.html` (sistema de diseño), `lab/cds-secuencia.html` (secuencia CDS del Inicio) y `lab/abatible-foto.html` (foto de estudio de la abatible) se ven con `npm run dev`, pero **no se publican**. Para incluirlas en un build: `VITE_LAB=1 npm run build`.

## Fotos de instalaciones y del Inicio

```bash
ST_PAQUETE=/ruta/al/paquete npm run fotos                     # las dos de abajo
ST_PAQUETE=/ruta/al/paquete node scripts/build-cds-photos.mjs    # 11 fotos CDS → public/img/cds/ y src/data/cds-instalaciones.json
ST_PAQUETE=/ruta/al/paquete node scripts/build-home-photos.mjs   # las 4 puertas mejoradas → public/img/inicio/ y src/data/inicio-fotos.json
```

Las fotos con marcas de clientes o de terceros quedan fuera; la lista está en cada script.

### Secuencia CDS del Inicio

Los 36 cuadros que avanzan con el scroll en la sección CDS del Inicio se dibujan con el mismo modelo 3D de la página de CDS
(dos formatos: horizontal 1440 × 900 y vertical 720 × 900). Solo hace falta regenerarlos si cambia el modelo CDS:

```bash
npx vite --port 5199 &                                        # servidor de desarrollo (sirve lab/cds-secuencia.html)
python3 scripts/render-cds-sequence.py --nuevo                # → scripts/fuentes/cds-secuencia/ (36 cuadros, fuente del video)
python3 scripts/build-cds-video.py                          # → public/video/cds-*.mp4/.webm, carteles y src/data/cds-secuencia.json (ffmpeg)
python3 scripts/build-flotantes.py                          # → public/img/flotantes/ (recortes de piezas) y src/data/flotantes.json
python3 scripts/render-escaner.py                           # → public/img/inicio/escaner/ y src/data/escaner.json (lab/escaner.html)
```

Con render por software (sin GPU) cada cuadro tarda unos 20 s; sin `--nuevo` continúa donde se quedó.
Con el mismo servidor, `lab/cds-secuencia.html?poster=1` da la imagen fija de la página de CDS (sin 3D).

### Foto de estudio de la abatible

La foto de la abatible del Inicio se dibuja con su modelo 3D (blanco sanitario, entreabierta):

```bash
python3 scripts/render-abatible-photo.py                      # → scripts/fuentes/abatible-estudio.png
ST_PAQUETE=/ruta/al/paquete node scripts/build-home-photos.mjs   # la convierte junto con las demás fotos del Inicio
```

## Regenerar imágenes y datos del catálogo

Los originales del paquete **no se modifican**.

```bash
ST_PAQUETE=/ruta/al/paquete npm run assets          # solo genera lo que falta
ST_PAQUETE=/ruta/al/paquete npm run assets -- --force
```

**Qué lee:**
- `00_DIRECCION_PROYECTO/INVENTARIO_COMPONENTES.csv`
- `03_COMPONENTES_ORIGINALES_ALTA_CALIDAD/`
- `05_IDENTIDAD_ST/ST_Logo_Azul_Original_Exacto_4K.png`

**Qué produce:**
- `public/img/componentes/`: cada pieza en AVIF y WebP, a 480, 960 y 1600 px, sobre un lienzo 4:3 con fondo blanco.
- `src/data/components.json`: el catálogo con las correcciones de la auditoría. Las piezas del PDF sin imagen quedan en `pendientes_sin_publicar` y no se muestran.
- `public/img/marca/`: el logo para web, sacado del PNG exacto sin cambiar su geometría.

## Regenerar y verificar los modelos de la corrediza y la vaivén

La geometría de estas dos puertas sale de los modelos aprobados, que **no se modifican**:

- `01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html`
- `01_MODELOS_ORIGINALES/VAIVEN_V13_MODELO_BASE.html`

```bash
ST_PAQUETE=/ruta/al/paquete npm run corrediza    # convierte la corrediza y luego la verifica
ST_PAQUETE=/ruta/al/paquete npm run vaiven       # convierte la vaivén y luego la verifica
ST_PAQUETE=/ruta/al/paquete npm run verificar    # solo verifica las dos
```

**Qué produce la conversión** (`scripts/convert-corrediza.mjs`, `scripts/convert-vaiven.mjs`):
- `src/models/<puerta>.bin`: los mismos vértices y normales `float32` que el original sube a la GPU, malla por malla y en el mismo orden. Solo cambia el empaquetado (índices en vez de vértices repetidos).
- `src/models/<puerta>.json`: tabla de materiales, cámaras con nombre del original y el índice de mallas. La de la vaivén trae además los tres acabados del original.
- `src/models/logo-hoja.png`: el logo que los dos originales imprimen en la hoja (es el mismo archivo en ambos).

**Qué comprueba la verificación** (`scripts/verify-corrediza.mjs`, `scripts/verify-vaiven.mjs`). Termina con error si algo no coincide y deja el resultado en `docs/verificacion-<puerta>.json`:
- Geometría: cada valor del binario contra el original, bit a bit.
- Movimiento: ejecuta las funciones del motor original y compara sus matrices con las del visor nuevo. En la corrediza, todo el recorrido y la apertura de la tapa. En la vaivén, el giro de cada hoja hacia los dos lados, con la misma clase `Hinge` que usa la página.
- Cámaras: las vistas con nombre del original (14 en la corrediza, 7 en la vaivén).

## Estructura

```
index.html, industriales/…, cds/, componentes/, cotizar/   páginas (cada index.html es una entrada)
lab/materiales.html      calibración de materiales (interna, noindex)
lab/sistema.html         guía del sistema de diseño (interna, noindex)
src/styles/tokens.css    colores, tipo, espacio, radios y movimiento
src/styles/base.css      reset, tipografía y superficies (muro / hielo / navy)
src/styles/components.css botones, navegación, campos, chips, acabados, ficha, aviso, visor
src/ui/site.js           navegación, pie, "Mi solicitud", avisos, hoja lateral
src/ui/picture.js        imagen responsiva AVIF/WebP del catálogo
src/ui/catalog.js        catálogo de componentes: búsqueda, filtros, ficha y foto ampliada
src/ui/cotizar.js        solicitud editable y envío por correo / copiar (WhatsApp listo, oculto sin número)
src/ui/cdsPage.js        comparador de modelos CDS y galería de instalaciones
src/ui/motion.js         movimiento de página (fichas, contador) con «reducir movimiento»
src/pages/               un módulo por página (inicio, industriales, cds, componentes, cotizar, 404…)
src/home/hero.js         Inicio: la vaivén en 3D que abre con el scroll y la cámara que cruza al interior
src/home/vapor.js        Inicio: vaho de la cámara frigorífica (partículas) al abrir la puerta
src/home/scrub.js        Inicio: avance de cada sección con el scroll (sin secuestrar el desplazamiento)
src/home/cdsSequence.js  Inicio: secuencia CDS cuadro por cuadro
src/home/look.js         Inicio: luz y materiales de foto de producto (reflector, muro de paneles, piso pulido, luz fría)
src/ui/cine.js           Intro con la marca (Inicio), títulos por líneas, scroll suave (Lenis) y cursor en todo el sitio
src/core/thermal.js      «Ver el frío»: vista térmica ilustrativa de cualquier puerta (cada visor describe sus huecos)
src/core/xray.js         «Rayos X»: la puerta transparente, con sus piezas de adentro a la vista
src/ui/cdsPage.js        CDS: comparador con corte del vidrio, prueba de humedad y luces KeyLED
src/ui/vaivenPage.js     Vaivén: «Simular paso» (las hojas abren y regresan solas)
src/home/scanner.js      Inicio: escáner de rayos X de las cuatro puertas (imágenes de scripts/render-escaner.py)
src/home/cdsSequence.js  Inicio: video de la CDS que abre al llegar a la pantalla, con el ángulo en vivo
src/ui/floaters.js       piezas flotantes que se agarran y se lanzan (Inicio y Componentes)
src/ui/medida.js         Cotizar a la medida: medida del vano, juego CDS y plano a escala
src/styles/home.css      estilos del Inicio (solo se cargan ahí)
src/data/contacto.json   correo, teléfono y WhatsApp de ST
src/data/inicio-fotos.json, cds-instalaciones.json, cds-secuencia.json   fotos y secuencia generadas por los scripts
src/core/stage.js        escenario 3D común: entorno de estudio, calidad, respaldo sin WebGL
src/core/backdrop.js     muro y piso comunes (blanco afuera, azul marino adentro)
src/core/hinge.js        hoja abisagrada: giro sobre su eje real y arrastre con el puntero (una o dos direcciones)
src/core/slider.js       hoja corrediza: progreso 0–1, arrastre con el puntero y toque
src/core/cameraRig.js    cámaras con nombre, encuadre de una caja según el visor y transición entre ellas
src/core/hotspots.js     puntos de pieza sobre el modelo
src/viewers/abatible.js  puerta abatible
src/viewers/corrediza.js puerta corrediza (corrediza.kinematics.js: trayectoria; corrediza.rig.js: nodos)
src/viewers/vaiven.js    puerta vaivén de doble hoja (vaiven.rig.js: marco fijo y una hoja por eje)
src/viewers/cds.js       juego Reach-In CDS Legacy sobre el escenario común (cds/legacy.js: núcleo del modelo aprobado)
src/models/              geometría de la corrediza y de la vaivén generada desde los modelos aprobados
src/ui/doorPage.js       lógica común de las páginas de puerta
src/materials/           FinishRegistry (registro único de acabados), texturas procedurales y fromOriginal.js
                         (conversión de los materiales de un modelo original al sitio)
src/data/components.json catálogo generado
src/data/piezas-3d.json  piezas señaladas en cada puerta 3D (la prueba de la Fase 5 lo compara con las anclas)
scripts/build-assets.mjs generador de imágenes y datos
scripts/convert-*.mjs / verify-*.mjs   conversión sin pérdidas y verificación de la corrediza y la vaivén
scripts/lib/meshpack.mjs empaquetado y comparación de geometría, comunes a las dos conversiones
docs/                    resumen de cada fase, diferencias con los originales y capturas
```

## Reglas del sistema

- **Acabados:** se crean solo en `src/materials/FinishRegistry.js`. Abatible y vaivén comparten las mismas instancias, así que un acabado se ve igual en las dos puertas. Los materiales propios de un modelo original (corrediza; herrajes y marco de la vaivén) se convierten con `src/materials/fromOriginal.js`.
- **Acabados por puerta:** salen de `FINISHES_BY_DOOR`, que copia `MATRIZ_PRODUCTOS_ACABADOS.csv`.
  - La corrediza no tiene selector. CDS no tiene acabados, pero sí selector de modelo (Advanced, Plus, LT).
  - La corrediza conserva su único acabado: sus materiales salen de la tabla del modelo original (`src/models/corrediza.json`), no del registro compartido.
  - La vaivén solo admite negro, inoxidable y blanco sanitario. La cara de la hoja usa el registro compartido; marco, bisagras, hules y vidrio salen de la tabla de su modelo original (`src/models/vaiven.json`).
  - El bumper de la abatible es solo inox diamante.
- **Tipografía:** Outfit (licencia OFL) es provisional. Para cambiar a Nexa, agrega los archivos `.woff2` con licencia web, declara su `@font-face` y quita los imports de `@fontsource/outfit` en `src/ui/site.js`. Como `--font` ya pone "Nexa" primero, no hay que tocar nada más.
- **3D:**
  - Solo se carga en las páginas que lo usan.
  - Solo dibuja cuando algo cambia.
  - Baja la calidad sola si va a menos de 20 cuadros por segundo.
  - La calidad se puede fijar con `?calidad=alta|media|baja`.
  - El acabado y el modelo elegidos quedan en la URL (`?acabado=`, `?modelo=`).
- **Medir en celular simulado:** `python3 scripts/medicion/medir_movil.py salida.json`, con `npm run preview` corriendo (necesita Python y Playwright).

# ST Doors: sitio web

Sitio estático multipágina hecho con Vite, Three.js r169 y GSAP. No usa framework ni servidor.

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

## Regenerar y verificar el modelo de la corrediza

La geometría de la corrediza sale del modelo aprobado (`01_MODELOS_ORIGINALES/CORREDIZA_VFINAL_MODELO_BASE.html`), que **no se modifica**.

```bash
ST_PAQUETE=/ruta/al/paquete npm run corrediza    # convierte y luego verifica
ST_PAQUETE=/ruta/al/paquete npm run verificar    # solo verifica
```

**Qué produce la conversión** (`scripts/convert-corrediza.mjs`):
- `src/models/corrediza.bin`: los mismos vértices y normales `float32` que el original sube a la GPU, malla por malla y en el mismo orden. Solo cambia el empaquetado (índices en vez de vértices repetidos).
- `src/models/corrediza.json`: tabla de materiales, cámaras con nombre del original y el índice de mallas.
- `src/models/corrediza-logo.png`: el logo que el original imprime en la hoja.

**Qué comprueba la verificación** (`scripts/verify-corrediza.mjs`). Termina con error si algo no coincide y deja el resultado en `docs/verificacion-corrediza.json`:
- Geometría: cada valor del binario contra el original, bit a bit.
- Cinemática: ejecuta las funciones del motor original y compara sus matrices con las del visor nuevo en todo el recorrido y en toda la apertura de la tapa.
- Cámaras: las 14 vistas con nombre del original.

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
src/core/stage.js        escenario 3D común: entorno de estudio, calidad, respaldo sin WebGL
src/core/backdrop.js     muro y piso comunes (blanco afuera, azul marino adentro)
src/core/hinge.js        hoja abisagrada: giro sobre su eje real y arrastre con el puntero
src/core/slider.js       hoja corrediza: progreso 0–1, arrastre con el puntero y toque
src/core/cameraRig.js    cámaras con nombre y transición entre ellas
src/core/hotspots.js     puntos de pieza sobre el modelo
src/viewers/abatible.js  puerta abatible
src/viewers/corrediza.js puerta corrediza (corrediza.kinematics.js: trayectoria; corrediza.rig.js: nodos)
src/models/              geometría de la corrediza generada desde el modelo aprobado
src/ui/doorPage.js       lógica común de las páginas de puerta
src/materials/           FinishRegistry (registro único de materiales) y texturas procedurales
src/data/components.json catálogo generado
scripts/build-assets.mjs generador de imágenes y datos
scripts/convert-corrediza.mjs / verify-corrediza.mjs   conversión sin pérdidas y verificación de la corrediza
docs/                    resumen de cada fase, diferencias con los originales y capturas
```

## Reglas del sistema

- **Materiales:** se crean solo en `src/materials/FinishRegistry.js`. Abatible y vaivén comparten las mismas instancias, así que un acabado se ve igual en las dos puertas.
- **Acabados por puerta:** salen de `FINISHES_BY_DOOR`, que copia `MATRIZ_PRODUCTOS_ACABADOS.csv`.
  - Corrediza y CDS no tienen selector.
  - La corrediza conserva su único acabado: sus materiales salen de la tabla del modelo original (`src/models/corrediza.json`), no del registro compartido.
  - El bumper de la abatible es solo inox diamante.
- **Tipografía:** Outfit (licencia OFL) es provisional. Para cambiar a Nexa, agrega los archivos `.woff2` con licencia web, declara su `@font-face` y quita los imports de `@fontsource/outfit` en `src/ui/site.js`. Como `--font` ya pone "Nexa" primero, no hay que tocar nada más.
- **3D:** solo se carga en las páginas que lo usan. La calidad se puede forzar con `?calidad=alta|media|baja`.

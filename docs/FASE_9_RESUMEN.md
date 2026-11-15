# FASE 9 · Validación final — resumen

**Fecha:** 15 nov 2026 · **Modelo:** Opus 5.5, esfuerzo Alto

El estado de cada punto de la lista de aceptación, con su evidencia, las preguntas para ST y cómo publicar están en **`docs/ENTREGA.md`**.

## Correcciones de esta fase

- **Logo del pie de página deformado** (20 % más angosto): ahora conserva su proporción.
- **Foco visible** en el campo de búsqueda del catálogo.
- **Encuadre de CDS en pantallas angostas:** en un plegable cerrado (280 px) la esquina trasera del gabinete se salía del cuadro.
- **El acabado y el modelo elegidos quedan en la URL**, así que al volver con "atrás" o al compartir el enlace se conservan.
- **Páginas internas (`lab/`) fuera del sitio publicado:** tenían botones de muestra sin función. Se pueden incluir con `VITE_LAB=1`.
- **Página 404**, `robots.txt` y etiquetas para compartir (título, descripción, idioma, color). Con `SITE_URL` se agregan el enlace canónico, la imagen para compartir y `sitemap.xml`.
- **Subcarpeta (`VITE_BASE`):** los enlaces escritos en el HTML se ajustan solos. Antes apuntaban a la raíz.
- **Dependencia GSAP quitada:** no se usaba.
- **README al día:** publicación, fotos, páginas internas, contacto y 3D.
- **Pruebas de esta fase incluidas** en `scripts/qa/`.

## Verificación final

| Prueba | Resultado |
|---|---|
| Accesibilidad axe (WCAG 2.1 A/AA), SEO, 125 enlaces, botones, logos, foco | 9 páginas × 2 tamaños: 0 fallas (`docs/auditoria_fase9.json`) |
| 7 tamaños de pantalla × 4 puertas, sin WebGL, atrás/adelante, acabado al volver | 10 de 10 |
| Acabados y mismo material en abatible y vaivén | Iguales en las tres |
| Regresión completa | Abatible sin errores; corrediza 19/19, vaivén 23/23, CDS 20/20, 3D 36/36, catálogo 22/22, Cotizar 13/13, Inicio 13/13, movimiento 11/11, sitio 20/20 |
| Modelos aprobados | `npm run verificar`: corrediza y vaivén iguales al original |
| Originales | SHA-256 de los 4 HTML idéntica a la de los ZIP subidos |
| Arranque desde cero | Clon limpio → `npm ci` → `npm run build` → `npm run preview`: todas las páginas responden 200 |

**No probado:** Safari, teléfonos y GPU reales, dedo real y lectores de pantalla (lista en `ENTREGA.md`, sección 2).

# Pruebas de la Fase 9

Necesitan Python 3, Playwright (`pip install playwright && playwright install chromium`) y el sitio servido con `npm run preview` (puerto 4173).

| Script | Qué comprueba |
|---|---|
| `auditoria.py` | Accesibilidad con axe-core, WCAG 2.1 A/AA (`npm i axe-core`, o indica su ruta con `AXE_JS`), SEO básico, enlaces internos, botones sin función, logo sin deformar, foco visible y errores. Escribe `auditoria.json`. |
| `dispositivos.py` | Encuadre de las 4 puertas en 7 tamaños de pantalla, el sitio sin WebGL y el botón "atrás". |
| `acabados.py` | Acabados de cada puerta, y que abatible y vaivén usen el mismo material. |

La medición de rendimiento en celular simulado está en `scripts/medicion/medir_movil.py`.

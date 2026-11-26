"""Textura de escarcha (Fase 12): un mosaico de 256 × 256 px de CSS con grano fino (cristales sueltos de ~1 px) y
manchas grandes alargadas, en blanco azulado con transparencia. Antes se calculaba en el teléfono (SVG feTurbulence)
y trababa la pantalla al aparecer; ahora se descarga ya hecha (~50 KB) y el navegador la decodifica aparte. En pantallas
de 2× se dibuja al doble (el grano queda de 1 px de CSS, como el original).

Uso: python3 scripts/build-escarcha.py   → public/img/frio/escarcha.webp
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 256                      # lado del mosaico en píxeles de CSS
R = 1
rng = np.random.default_rng(7)


def value_noise(nx, ny):
    """ruido de valor en mosaico: nx × ny puntos de control, interpolación suave (smoothstep)"""
    g = rng.random((ny, nx))
    y, x = np.mgrid[0:S, 0:S].astype(np.float64)
    fx, fy = x * nx / S, y * ny / S
    xi, yi = np.floor(fx).astype(int), np.floor(fy).astype(int)
    tx, ty = fx - xi, fy - yi
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    x0, x1, y0, y1 = xi % nx, (xi + 1) % nx, yi % ny, (yi + 1) % ny
    return (g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty


fine = 0.5 * value_noise(S, S) + 0.3 * value_noise(S // 2, S // 2) + 0.2 * value_noise(S // 4, S // 4)
bx, by = max(2, round(S / (50 * R))), max(3, round(S / (20 * R)))            # manchas de ~50 × 20 px de CSS
big = 0.47 * value_noise(bx, by) + 0.27 * value_noise(bx * 2, by * 2) + 0.16 * value_noise(bx * 4, by * 4) + 0.1 * value_noise(bx * 8, by * 8)
a1 = np.clip(2.2 * fine - 1.05, 0, 1)
a2 = np.clip(1.4 * big - 0.6, 0, 1) * 0.85
a = a1 + a2 * (1 - a1)
with np.errstate(invalid='ignore', divide='ignore'):
    r = np.where(a > 0, (0.92 * a1 + 0.86 * a2 * (1 - a1)) / a, 0)
    g = np.where(a > 0, (0.98 * a1 + 0.95 * a2 * (1 - a1)) / a, 0)
img = np.dstack([r * 255, g * 255, np.full_like(a, 255), a * 255]).round().clip(0, 255).astype(np.uint8)
out = os.path.join(ROOT, 'public/img/frio/escarcha.webp')
Image.fromarray(img, 'RGBA').save(out, 'WEBP', quality=82, alpha_quality=80, method=6)
print(out, os.path.getsize(out), 'bytes')

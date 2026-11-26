"""Vaho frío para la entrada del Inicio (Fase 14): dos texturas blancas con transparencia, hechas de ruido fractal.
  · vaho-banco.webp: un banco bajo y ancho, denso abajo (el aire frío pesa y sale a ras de piso)
  · vaho-nube.webp:  una bocanada redonda, para el paso por la puerta
En el Inicio se mueven con transformaciones de CSS (las anima la tarjeta gráfica; no se vuelven a pintar).

Uso: python3 scripts/build-vaho.py   → public/img/umbral/vaho-*.webp
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(11)


def value_noise(w, h, nx, ny):
    g = rng.random((ny + 2, nx + 2))
    y, x = np.mgrid[0:h, 0:w].astype(np.float64)
    fx, fy = x * nx / w, y * ny / h
    xi, yi = np.floor(fx).astype(int), np.floor(fy).astype(int)
    tx, ty = fx - xi, fy - yi
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    return (g[yi, xi] * (1 - tx) + g[yi, xi + 1] * tx) * (1 - ty) + (g[yi + 1, xi] * (1 - tx) + g[yi + 1, xi + 1] * tx) * ty


def fbm(w, h, nx, ny, oct=5):
    out, amp, tot = np.zeros((h, w)), 1.0, 0.0
    for o in range(oct):
        out += amp * value_noise(w, h, nx * 2 ** o, ny * 2 ** o); tot += amp; amp *= 0.52
    return out / tot


def save(a, name, tint=(244, 250, 252)):
    a = np.clip(a, 0, 1)
    img = np.dstack([np.full_like(a, tint[0]), np.full_like(a, tint[1]), np.full_like(a, tint[2]), a * 255]).round().astype(np.uint8)
    p = os.path.join(ROOT, 'public', 'img', 'umbral', name)
    Image.fromarray(img, 'RGBA').save(p, 'WEBP', quality=72, method=6, alpha_quality=72)
    print(name, os.path.getsize(p))


os.makedirs(os.path.join(ROOT, 'public', 'img', 'umbral'), exist_ok=True)
# banco: 1024 × 384; más denso abajo, deshilachado arriba y en las puntas, sin llegar a ser una placa blanca
W, H = 1024, 384
n = fbm(W, H, 6, 2)
m = fbm(W, H, 14, 5, oct=3)
y, x = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
prof = np.clip((y - 0.05) / 0.75, 0, 1) ** 1.6                      # 0 arriba → 1 abajo
ends = np.clip(np.minimum(x, 1 - x) / 0.3, 0, 1) ** 1.8
dens = np.clip(1.6 * n - 0.55 + 0.6 * prof, 0, 1) ** 1.4             # bocanadas: el ruido decide dónde hay vaho
a = dens * (0.35 + 0.65 * prof) * ends * (0.75 + 0.25 * m)
a *= np.clip((1 - y) / 0.16, 0, 1) ** 1.2 * np.clip(y / 0.3, 0, 1) ** 1.5   # sin borde abajo (se apoya en el piso) ni arriba
save(np.clip(a * 1.05, 0, 0.82), 'vaho-banco.webp')
# nube: 512 × 512, irregular y deshilachada
S = 512
n = fbm(S, S, 4, 4)
m = fbm(S, S, 10, 10, oct=3)
y, x = (np.mgrid[0:S, 0:S] + 0.5) / S
r = np.hypot(x - 0.5, y - 0.5) / 0.5 + 0.35 * (n - 0.5)
a = np.clip(1 - r, 0, 1) ** 1.3 * np.clip(1.5 * n - 0.25, 0, 1) * (0.7 + 0.3 * m)
save(np.clip(a * 1.25, 0, 0.8), 'vaho-nube.webp')

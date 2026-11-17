"""Piezas flotantes (Fase 10H): recortes con fondo transparente de algunas fotos del catálogo, para las piezas que se
pueden arrastrar y lanzar en el Inicio y en Componentes.

El fondo de las fotos es blanco liso: se quita lo blanco que toca el borde (así el blanco de una pieza blanca,
rodeado de su sombreado, se queda), con un borde suave para que no se vea dentado.

Uso:  python3 scripts/build-flotantes.py
Lee public/img/componentes/<id>-1600.webp y escribe public/img/flotantes/<id>.webp y src/data/flotantes.json.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public/img/componentes')
OUT = os.path.join(ROOT, 'public/img/flotantes')
# piezas compactas y reconocibles (los perfiles de varios metros se ven como una raya)
PIEZAS = ['corrediza-39', 'abatible-30', 'vaiven-02', 'corrediza-37', 'abatible-27', 'corrediza-41', 'vaiven-05', 'corrediza-47',
          'abatible-21', 'corrediza-76', 'corrediza-40', 'abatible-35', 'vaiven-03', 'corrediza-74', 'abatible-23', 'corrediza-42',
          # Fase 10I · una por tipo para las tarjetas de Componentes
          'abatible-11', 'corrediza-58', 'corrediza-72', 'vaiven-06']
MAX = 520


def cutout(path):
    im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(np.float32)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.abs(a - bg).max(axis=2)
    lab, _ = ndimage.label(dist < 9)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    bgmask = np.isin(lab, edge)
    # orilla: hasta 12 px del fondo, lo claro se vuelve transparente en proporción («color a alfa» contra el blanco),
    # así no queda halo blanco ni en un fondo azul marino; más adentro la pieza queda opaca (también si es blanca)
    ring = ndimage.binary_dilation(bgmask, iterations=12, border_value=1) & ~bgmask
    alpha = np.ones(dist.shape, np.float32); alpha[bgmask] = 0
    ra = np.clip(dist / 48, 0, 1); alpha[ring] = ra[ring]
    alpha = ndimage.gaussian_filter(alpha, 0.6)
    safe = np.maximum(alpha, 0.04)[..., None]
    a = np.clip(bg + (a - bg) / safe, 0, 255) * (alpha[..., None] > 0.01) + a * (alpha[..., None] <= 0.01)
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    ys, xs = np.where(alpha > 0.03)
    pad = 6
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1))
    out = out.crop(box)
    s = MAX / max(out.size)
    if s < 1: out = out.resize((round(out.width * s), round(out.height * s)), Image.LANCZOS)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    data = []
    for pid in PIEZAS:
        src = sorted(f for f in os.listdir(SRC) if f.startswith(pid + '-') and f.endswith('-1600.webp'))[0]
        full = src[:-len('-1600.webp')]
        img = cutout(os.path.join(SRC, src))
        img.save(os.path.join(OUT, f'{full}.webp'), 'WEBP', quality=82, method=6)
        data.append({'id': full, 'img': f'img/flotantes/{full}.webp', 'w': img.width, 'h': img.height})
        print(full, img.size, f'{os.path.getsize(os.path.join(OUT, full + ".webp")) / 1024:.0f} KB')
    with open(os.path.join(ROOT, 'src/data/flotantes.json'), 'w') as fh: json.dump({'origen': 'scripts/build-flotantes.py', 'piezas': data}, fh, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

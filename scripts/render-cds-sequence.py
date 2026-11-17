"""Secuencia de CDS del Inicio: cuadros dibujados con el modelo 3D del sitio (lab/cds-secuencia.html).

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/render-cds-sequence.py [--n 36] [--base http://localhost:5199] [--nuevo]
Sin --nuevo continúa donde se quedó (cada cuadro tarda varios segundos con render por software).
Escribe scripts/fuentes/cds-secuencia/{ancho,alto}-NN.webp; luego scripts/build-cds-video.py arma los videos.
Requiere: pip install playwright pillow  y  playwright install chromium.
"""
import argparse, asyncio, io, json, os
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scripts/fuentes/cds-secuencia')   # fuente del video (scripts/build-cds-video.py); no se publica
FORMATS = {'ancho': (1440, 900, 74), 'alto': (720, 900, 72)}   # ancho × alto en píxeles y calidad WebP


async def main(n, base, fresh):
    os.makedirs(OUT, exist_ok=True)
    if fresh:
        for f in os.listdir(OUT):
            os.remove(os.path.join(OUT, f))
    data = {'origen': 'scripts/render-cds-sequence.py', 'cuadros': n, 'formatos': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for name, (w, h, q) in FORMATS.items():
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
            await pg.goto(f'{base}/lab/cds-secuencia.html?calidad=alta&formato={name}')
            await pg.wait_for_function('window.frame && window.__cds', timeout=60000)
            await pg.evaluate('frame(0)'); await pg.wait_for_timeout(2500)
            total = 0
            for i in range(n):
                path = os.path.join(OUT, f'{name}-{i:02d}.webp')
                if os.path.exists(path):
                    total += os.path.getsize(path); continue
                await pg.evaluate(f'frame({i / (n - 1)})')
                await pg.wait_for_timeout(350)
                png = await pg.screenshot(clip={'x': 0, 'y': 0, 'width': w, 'height': h})
                Image.open(io.BytesIO(png)).convert('RGB').save(path, 'WEBP', quality=q, method=6)
                total += os.path.getsize(path)
            data['formatos'][name] = {'ancho': w, 'alto': h, 'bytes': total}
            print(name, f'{n} cuadros', f'{total / 1e6:.2f} MB')
            await pg.close()
        await b.close()
    with open(os.path.join(ROOT, 'src/data/cds-secuencia.json'), 'w') as fh:
        json.dump(data, fh, indent=1)


if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--n', type=int, default=36); a.add_argument('--base', default='http://localhost:5199'); a.add_argument('--nuevo', action='store_true')
    x = a.parse_args(); asyncio.run(main(x.n, x.base, x.nuevo))

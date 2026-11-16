"""Foto de estudio de la abatible para el Inicio, dibujada con el modelo 3D del sitio (lab/abatible-foto.html).

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/render-abatible-photo.py [--base http://localhost:5199]
Escribe scripts/fuentes/abatible-estudio.png (3:4, 1620 × 2160); scripts/build-home-photos.mjs la convierte.
"""
import argparse, asyncio, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scripts/fuentes/abatible-estudio.png')
# hoja abierta 38°, vista desde la izquierda: se ve la jaladera, el bumper de inox diamante y el interior azul marino
SHOT = (38, [-0.62, 0, -0.05, 0.62, 2.15, 0.9], -0.46, 0.05, 1.05)

async def main(base):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1080, 'height': 1440}, device_scale_factor=1.5)
        await pg.goto(f'{base}/lab/abatible-foto.html?calidad=alta', timeout=120000)
        await pg.wait_for_function('window.shotBox && window.__v', timeout=120000)
        await pg.wait_for_timeout(4000)
        d, box, yaw, pitch, m = SHOT
        await pg.evaluate(f'shotBox({d},{box},{yaw},{pitch},{m})'); await pg.wait_for_timeout(6000)
        await pg.screenshot(path=OUT)
        await b.close()
    print('listo', OUT)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--base', default='http://localhost:5199')
    asyncio.run(main(a.parse_args().base))

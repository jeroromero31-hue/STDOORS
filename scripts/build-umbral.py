"""Imágenes de la entrada del Inicio (Fase 14, «el umbral»).

Dibuja desde lab/umbral.html, con el mismo modelo 3D de cada puerta:
  · la vaivén de frente, sin perspectiva, en tres capas con fondo transparente: marco, hoja izquierda y hoja derecha
    (en el Inicio las hojas giran con CSS 3D sobre su bisagra; no se carga el 3D);
  · la abatible, la corrediza y la vaivén cerradas, de 3/4 y sin muro, para la fila que se ve al entrar.
Guarda WebP con transparencia en public/img/umbral/ (dos tamaños) y src/data/umbral.json con las proporciones.

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/build-umbral.py [--base http://localhost:5199]
"""
import argparse, asyncio, base64, io, json, os
from PIL import Image
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'img', 'umbral')
RAW = os.path.join('/tmp', 'umbral-raw')

def png(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')

def save(im, name, widths, q=84):
    out = {}
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f'{name}-{w}.webp'), 'WEBP', quality=q, method=6, alpha_quality=90)
        out[w] = f'{name}-{w}.webp'
    return out

async def main(base):
    os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
    meta = {'origen': 'scripts/build-umbral.py', 'vaiven': {}, 'fila': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 900})
        pg.on('console', lambda m: print('  ', m.type, m.text[:160]) if m.type == 'error' else None)
        await pg.goto(f'{base}/lab/umbral.html?puerta=vaiven&modo=hojas', timeout=180000); await pg.wait_for_function('window.__ready', timeout=180000)
        await pg.evaluate('window.__ready')
        r = await pg.evaluate('window.hojas(900)')
        meta['vaiven'] = {'w': r['w'], 'h': r['h'], 'caja': r['caja'], 'ejes': r['ejes']}
        for k in ('marco', 'izq', 'der'):
            im = png(r[k]); im.save(os.path.join(RAW, f'vaiven-{k}.png'))
            if k != 'marco':
                bb = im.getchannel('A').point(lambda a: 255 if a > 6 else 0).getbbox(); im = im.crop(bb)
                # dónde cae la hoja dentro del marco, en fracciones (para acomodarla en CSS)
                meta['vaiven'][k + 'Rect'] = [round(bb[0] / r['w'], 5), round(bb[1] / r['h'], 5), round((bb[2] - bb[0]) / r['w'], 5), round((bb[3] - bb[1]) / r['h'], 5)]
            W = im.width
            meta['vaiven'][k] = save(im, f'vaiven-{k}', [round(W * 0.5), W])
            print(k, im.size)
        await pg.close()
        for d in ('abatible', 'corrediza', 'vaiven'):
            pg = await b.new_page(viewport={'width': 900, 'height': 900})
            await pg.goto(f'{base}/lab/umbral.html?puerta={d}&modo=fila', timeout=180000); await pg.wait_for_function('window.__ready', timeout=180000)
            await pg.evaluate('window.__ready')
            im = png(await pg.evaluate('window.fila(1100, 1100)'))
            bb = im.getchannel('A').point(lambda a: 255 if a > 6 else 0).getbbox()
            im = im.crop(bb); im.save(os.path.join(RAW, f'fila-{d}.png'))
            meta['fila'][d] = {'ancho': im.width, 'alto': im.height, 'img': save(im, f'fila-{d}', [round(im.width * 0.5), im.width], q=86)}
            print(d, im.size)
            await pg.close()
        await b.close()
    with open(os.path.join(ROOT, 'src', 'data', 'umbral.json'), 'w') as fh: json.dump(meta, fh, indent=1)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--base', default='http://localhost:5199')
    asyncio.run(main(a.parse_args().base))

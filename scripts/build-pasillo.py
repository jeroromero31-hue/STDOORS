"""Imágenes del pasillo del Inicio (Fase 14B): las cuatro puertas de frente, en capas con fondo transparente.
  · abatible: fijo (marco y bisagras fijas) + hoja (gira sobre su bisagra)
  · corrediza: fijo (marco, riel y guía) + hoja (corre sobre el riel) + frente (tapa del riel)
  · vaivén: fijo (marco) + hoja izquierda + hoja derecha (giran hacia los dos lados)
  · CDS: fijo (marco, gabinete, parrillas y productos con la luz encendida) + tres puertas (abren hacia afuera)
Todas a la misma escala (px por metro), para que en el pasillo guarden su tamaño real entre ellas.
Guarda WebP con transparencia en public/img/pasillo/ (dos tamaños) y src/data/pasillo.json con proporciones, capas
(dónde cae cada una dentro del encuadre) y ejes de giro.

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/build-pasillo.py [--base http://localhost:5199] [--solo vaiven]
"""
import argparse, asyncio, base64, io, json, os
from PIL import Image
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'img', 'pasillo')
RAW = '/tmp/pasillo-raw'
PPM = 420
ACABADO = {'abatible': 'stainless', 'corrediza': None, 'vaiven': 'stainless', 'cds': None}

def png(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')

async def main(base, solo):
    os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
    path = os.path.join(ROOT, 'src', 'data', 'pasillo.json')
    data = json.load(open(path)) if (solo and os.path.exists(path)) else {'origen': 'scripts/build-pasillo.py', 'ppm': PPM, 'puertas': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for d in (solo or ['abatible', 'corrediza', 'vaiven', 'cds']):
            pg = await b.new_page(viewport={'width': 900, 'height': 900})
            pg.on('console', lambda m: print('  ', m.type, m.text[:160]) if m.type == 'error' else None)
            q = f'&acabado={ACABADO[d]}' if ACABADO[d] else ''
            await pg.goto(f'{base}/lab/umbral.html?puerta={d}&modo=capas{q}', timeout=180000); await pg.wait_for_function('window.__ready', timeout=180000)
            await pg.evaluate('window.__ready'); await pg.wait_for_timeout(800)
            r = await pg.evaluate(f'window.capas({PPM})')
            W, H = r['w'], r['h']
            entry = {'w': W, 'h': H, 'metros': r['metros'], 'ejes': r['ejes'], 'piso': r['piso'], 'capas': {}}
            if 'recorrido' in r: entry['recorrido'] = r['recorrido']
            for k in [x for x in r if x not in ('w', 'h', 'metros', 'ejes', 'recorrido', 'piso')]:
                im = png(r[k]); im.save(os.path.join(RAW, f'{d}-{k}.png'))
                bb = im.getchannel('A').point(lambda a: 255 if a > 4 else 0).getbbox()
                if not bb: print('  capa vacía', d, k); continue
                im = im.crop(bb)
                rect = [round(bb[0] / W, 5), round(bb[1] / H, 5), round((bb[2] - bb[0]) / W, 5), round((bb[3] - bb[1]) / H, 5)]
                files = {}
                for s in (0.5, 1.0):
                    w = max(8, round(im.width * s)); h = max(8, round(im.height * s))
                    f = f'{d}-{k}-{w}.webp'
                    im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f), 'WEBP', quality=84, method=6, alpha_quality=88)
                    files[w] = f
                entry['capas'][k] = {'rect': rect, 'img': files}
                print(d, k, im.size, rect)
            data['puertas'][d] = entry
            await pg.close()
        await b.close()
    with open(path, 'w') as fh: json.dump(data, fh, indent=1)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--base', default='http://localhost:5199'); a.add_argument('--solo', nargs='*')
    x = a.parse_args(); asyncio.run(main(x.base, x.solo))

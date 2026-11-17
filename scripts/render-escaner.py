"""Escáner del Inicio: cada puerta, normal y en rayos X, desde la misma cámara; en horizontal y en vertical.
Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/render-escaner.py [--base http://localhost:5199]
Escribe public/img/inicio/escaner/<puerta>-<formato>-<modo>.webp y src/data/escaner.json (posiciones de las etiquetas)."""
import argparse, asyncio, io, json, os
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'img', 'inicio', 'escaner')
SIZES = {'ancho': (1200, 1000), 'alto': (900, 1200)}
PUERTAS = [('abatible', 'Puerta abatible', '/industriales/abatible/'), ('corrediza', 'Puerta corrediza', '/industriales/corrediza/'),
           ('vaiven', 'Puerta vaivén', '/industriales/vaiven/'), ('cds', 'Puertas CDS Legacy', '/cds/')]

async def main(base, solo=None):
    os.makedirs(OUT, exist_ok=True)
    data = {'origen': 'scripts/render-escaner.py', 'puertas': []}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for pid, nombre, href in PUERTAS:
            if solo and pid not in solo: continue
            entry = {'id': pid, 'nombre': nombre, 'href': href, 'tags': {}}
            for fmt, (w, h) in SIZES.items():
                for modo in ('normal', 'rayos'):
                    pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
                    await pg.goto(f'{base}/lab/escaner.html?puerta={pid}&modo={modo}&formato={fmt}', timeout=120000)
                    res = await pg.evaluate('window.__ready')
                    png = await pg.screenshot(clip={'x': 0, 'y': 0, 'width': w, 'height': h}, timeout=120000)
                    Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(OUT, f'{pid}-{fmt}-{modo}.webp'), quality=80, method=6)
                    if modo == 'rayos': entry['tags'][fmt] = res['tags']
                    print(pid, fmt, modo, len(res['tags']), 'etiquetas')
                    await pg.close()
            data['puertas'].append(entry)
        await b.close()
    if solo: print(json.dumps(data, ensure_ascii=False)[:1500]); return
    with open(os.path.join(ROOT, 'src', 'data', 'escaner.json'), 'w') as f: json.dump(data, f, ensure_ascii=False, indent=1)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://localhost:5199'); ap.add_argument('--solo', nargs='*')
    a = ap.parse_args(); asyncio.run(main(a.base, a.solo))

"""Modelos para «Verla en tu espacio» (Fase 10J): exporta cada puerta a GLB desde lab/ar.html y guarda una copia gzip
(public/ar/<puerta>.glbz) más src/data/ar.json con el vano de cada modelo (para escalarlo a la medida del cliente).

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/build-ar.py [--base http://localhost:5199]
"""
import argparse, asyncio, base64, gzip, json, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'ar')
async def main(base):
    os.makedirs(OUT, exist_ok=True); data = {'origen': 'scripts/build-ar.py', 'puertas': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for d in ['abatible', 'corrediza', 'vaiven', 'cds']:
            pg = await b.new_page(viewport={'width': 600, 'height': 600})
            await pg.goto(f'{base}/lab/ar.html?puerta={d}', timeout=180000); await pg.wait_for_function('window.__ready', timeout=180000)
            r = await pg.evaluate('exportAR()')
            raw = base64.b64decode(r['b64'])
            with gzip.open(os.path.join(OUT, f'{d}.glbz'), 'wb', compresslevel=9) as fh: fh.write(raw)
            z = os.path.getsize(os.path.join(OUT, f'{d}.glbz'))
            data['puertas'][d] = {'bytes': len(raw), 'bytesZ': z, 'vano': r['vano'], 'caja': r['box']}
            print(d, f'{len(raw)/1e6:.2f} MB → {z/1e6:.2f} MB', r['vano'])
            await pg.close()
        await b.close()
    with open(os.path.join(ROOT, 'src', 'data', 'ar.json'), 'w') as fh: json.dump(data, fh, indent=1)
if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--base', default='http://localhost:5199'); asyncio.run(main(a.parse_args().base))

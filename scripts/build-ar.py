"""Modelos para «Verla en tu espacio» (Fases 10J y 10K): exporta cada puerta a GLB desde lab/ar.html y guarda una copia
gzip (public/ar/<puerta>.glbz) más src/data/ar.json con el vano de cada modelo, sus franjas rígidas (para hacerla a la
medida sin estirar herrajes), sus clips (abrir, cerrar y, en la CDS, tomar-N) y los puntos para tocar en 3D.

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/build-ar.py [--base http://localhost:5199] [--solo abatible]
Con --solo se exporta solo esa puerta y se actualiza su parte de src/data/ar.json (las demás quedan igual).
"""
import argparse, asyncio, base64, gzip, json, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'ar')
async def main(base, solo=None):
    os.makedirs(OUT, exist_ok=True); data = {'origen': 'scripts/build-ar.py', 'puertas': {}}; pending = {}
    if solo: data = json.load(open(os.path.join(ROOT, 'src', 'data', 'ar.json')))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for d in ([solo] if solo else ['abatible', 'corrediza', 'vaiven', 'cds']):
            pg = await b.new_page(viewport={'width': 600, 'height': 600})
            await pg.goto(f'{base}/lab/ar.html?puerta={d}', timeout=180000); await pg.wait_for_function('window.__ready', timeout=180000)
            pg.on('console', lambda m: print('  ', m.type, m.text[:200]) if m.type in ('error', 'warning') else None)
            r = await pg.evaluate('exportAR()')
            raw = base64.b64decode(r['b64'])
            # se escribe todo al final: un archivo nuevo en public/ recarga el servidor de desarrollo a media exportación
            gz = gzip.compress(raw, compresslevel=9); pending[d] = gz; z = len(gz)
            data['puertas'][d] = {'bytes': len(raw), 'bytesZ': z, 'vano': r['vano'], 'caja': r['box'], 'franjas': r['franjas'], 'clips': r['clips'], 'abrir': r['abrir'], 'interior': r.get('interior'), 'recorrido': r['recorrido'], 'productos': r['productos']}
            print(d, f'{len(raw)/1e6:.2f} MB → {z/1e6:.2f} MB', r['stats'], r['clips'], len(r['franjas']['x']), len(r['franjas']['y']))
            await pg.close()
        await b.close()
    for d, gz in pending.items():
        with open(os.path.join(OUT, f'{d}.glbz'), 'wb') as fh: fh.write(gz)
    with open(os.path.join(ROOT, 'src', 'data', 'ar.json'), 'w') as fh: json.dump(data, fh, indent=1)
if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--base', default='http://localhost:5199'); a.add_argument('--solo', default=None)
    x = a.parse_args(); asyncio.run(main(x.base, x.solo))

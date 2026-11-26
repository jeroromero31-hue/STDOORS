"""Video de CDS del Inicio (Fase 10I; Fase 12: 60 cuadros por segundo y cuadros exactos): la toma de
lab/cds-secuencia.html dibujada cuadro por cuadro con el modelo 3D del sitio (sin cuadros inventados), y codificada en
H.264 (y VP9 de respaldo). Cada cuadro se dibuja y se lee del lienzo en la misma tarea (window.shot), a más densidad
que el video, y se reduce con Lanczos: sin cuadros en blanco ni repetidos y con orillas limpias.

Uso (con el servidor de desarrollo corriendo:  npx vite --port 5199):
    python3 scripts/render-cds-video.py [--n 192] [--fps 60] [--base http://localhost:5199]
Sin --nuevo continúa donde se quedó (los cuadros se guardan en /tmp/st-cds-video).
Escribe public/video/cds-{ancho,alto}.{mp4,webm}, los carteles public/img/inicio/cds/{ancho,alto}-{inicio,fin}.webp
y src/data/cds-secuencia.json. Requiere playwright, pillow y ffmpeg.
"""
import argparse, asyncio, base64, io, json, os, shutil, subprocess, tempfile, time
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = os.path.join(ROOT, 'public/video')
IMG = os.path.join(ROOT, 'public/img/inicio/cds')
FORMATS = {'alto': (720, 900, 24), 'ancho': (1280, 800, 25)}   # ancho × alto en píxeles y CRF
CALIDAD = {'alto': 'alta', 'ancho': 'media'}   # horizontal: «media» (1.25×, tres filas de producto), como el video anterior
DENSIDAD = {'alto': 1, 'ancho': 1}   # en pantalla 1×: «alta» dibuja a 1.5× (1080 × 1350) y «media» a 1.25× (1600 × 1000); se reduce con Lanczos
FONDO = (5, 47, 73)                 # #052F49, el azul marino de la sección


async def render(n, base, tmp, calidad=None):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for name, (w, h, _) in FORMATS.items():
            d = os.path.join(tmp, name); os.makedirs(d, exist_ok=True)
            if all(os.path.exists(os.path.join(d, f'{i:03d}.png')) for i in range(n)): continue
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=DENSIDAD[name])
            await pg.goto(f'{base}/lab/cds-secuencia.html?calidad={calidad or CALIDAD[name]}&formato={name}', timeout=180000)
            await pg.wait_for_function('window.shot && window.__cds', timeout=180000)
            await pg.evaluate('frame(0)'); await pg.wait_for_timeout(3000)
            t0 = time.time()
            for i in range(n):
                path = os.path.join(d, f'{i:03d}.png')
                if os.path.exists(path): continue
                url = await pg.evaluate(f'shot({i / (n - 1)})')
                im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
                bg = Image.new('RGBA', im.size, FONDO + (255,)); bg.alpha_composite(im)
                bg.convert('RGB').resize((w, h), Image.LANCZOS).save(path)
                if i % 12 == 0: print(name, i, f'{(time.time() - t0) / (i + 1):.1f} s/cuadro', flush=True)
            print(name, n, 'cuadros', flush=True); await pg.close()
        await b.close()


def encode(n, fps, tmp):
    os.makedirs(VID, exist_ok=True); os.makedirs(IMG, exist_ok=True)
    data = {'origen': 'scripts/render-cds-video.py', 'cuadros': n, 'fps': fps, 'segundos': round(n / fps, 2), 'formatos': {}}
    for name, (w, h, crf) in FORMATS.items():
        d = os.path.join(tmp, name); out = os.path.join(VID, f'cds-{name}.mp4'); webm = os.path.join(VID, f'cds-{name}.webm')
        src = ['-framerate', str(fps), '-i', os.path.join(d, '%03d.png')]
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *src, '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation', '-crf', str(crf), '-pix_fmt', 'yuv420p',
                        '-profile:v', 'high', '-level', '4.1', '-g', str(n), '-x264-params', f'keyint={n}:min-keyint={n}:scenecut=0:ref=4:bframes=3', '-movflags', '+faststart', '-an', out], check=True)   # un solo cuadro clave: sin «pulso» de calidad a media toma
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *src, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-pix_fmt', 'yuv420p',
                        '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-g', str(n), '-an', webm], check=True)
        for tag, i in (('inicio', 0), ('fin', n - 1)):
            Image.open(os.path.join(d, f'{i:03d}.png')).convert('RGB').save(os.path.join(IMG, f'{name}-{tag}.webp'), 'WEBP', quality=78, method=6)
        data['formatos'][name] = {'ancho': w, 'alto': h, 'bytes': os.path.getsize(out), 'bytes_webm': os.path.getsize(webm)}
        print(out, f'{os.path.getsize(out) / 1e6:.2f} MB', webm, f'{os.path.getsize(webm) / 1e6:.2f} MB')
    with open(os.path.join(ROOT, 'src/data/cds-secuencia.json'), 'w') as fh: json.dump(data, fh, indent=1)


if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--n', type=int, default=192); a.add_argument('--fps', type=int, default=60)
    a.add_argument('--base', default='http://localhost:5199'); a.add_argument('--calidad', default=None); a.add_argument('--nuevo', action='store_true')
    a.add_argument('--tmp', default=os.path.join(tempfile.gettempdir(), 'st-cds-video'))
    x = a.parse_args()
    if x.nuevo and os.path.isdir(x.tmp): shutil.rmtree(x.tmp)
    os.makedirs(x.tmp, exist_ok=True)
    asyncio.run(render(x.n, x.base, x.tmp, x.calidad)); encode(x.n, x.fps, x.tmp)

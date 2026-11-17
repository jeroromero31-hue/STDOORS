"""Video de CDS del Inicio (Fase 10H).

Antes el Inicio decodificaba cuadro por cuadro mientras se hacía scroll y en el celular se trababa. Ahora los 36 cuadros
de scripts/fuentes/cds-secuencia (scripts/render-cds-sequence.py) se convierten en un video H.264 de 3 s a 36 cuadros
por segundo (ffmpeg interpola los cuadros intermedios); el teléfono lo reproduce con su decodificador de video.

Uso:  python3 scripts/build-cds-video.py
Escribe public/video/cds-{ancho,alto}.{mp4,webm}, los carteles public/img/inicio/cds/{ancho,alto}-{inicio,fin}.webp
y src/data/cds-secuencia.json. Requiere ffmpeg y pillow.
"""
import json, os, subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts/fuentes/cds-secuencia')
VID = os.path.join(ROOT, 'public/video')
IMG = os.path.join(ROOT, 'public/img/inicio/cds')
FORMATS = {'ancho': 25, 'alto': 24}          # CRF de cada formato
SRC_FPS, FPS = 12, 36                        # 36 cuadros a 12 por segundo = 3 s; se interpola a 36 por segundo


def main():
    os.makedirs(VID, exist_ok=True); os.makedirs(IMG, exist_ok=True)
    n = len([f for f in os.listdir(SRC) if f.startswith('alto-')])
    data = {'origen': 'scripts/build-cds-video.py', 'cuadros': n, 'fps': FPS, 'segundos': round(n / SRC_FPS, 2), 'formatos': {}}
    for name, crf in FORMATS.items():
        out = os.path.join(VID, f'cds-{name}.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(SRC_FPS), '-i', os.path.join(SRC, f'{name}-%02d.webp'),
                        '-vf', f'minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', str(crf), '-profile:v', 'high',
                        '-movflags', '+faststart', '-an', out], check=True)
        # VP9 para los navegadores sin H.264 (Chromium libre, algunos Android); mismo cuadro y misma duración
        webm = os.path.join(VID, f'cds-{name}.webm')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
                        '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-an', webm], check=True)
        first = Image.open(os.path.join(SRC, f'{name}-00.webp')).convert('RGB')
        last = Image.open(os.path.join(SRC, f'{name}-{n - 1:02d}.webp')).convert('RGB')
        first.save(os.path.join(IMG, f'{name}-inicio.webp'), 'WEBP', quality=76, method=6)
        last.save(os.path.join(IMG, f'{name}-fin.webp'), 'WEBP', quality=76, method=6)
        data['formatos'][name] = {'ancho': first.width, 'alto': first.height, 'bytes': os.path.getsize(out), 'bytes_webm': os.path.getsize(webm)}
        print(out, f'{os.path.getsize(out) / 1e6:.2f} MB')
    with open(os.path.join(ROOT, 'src/data/cds-secuencia.json'), 'w') as fh: json.dump(data, fh, indent=1)


if __name__ == '__main__':
    main()

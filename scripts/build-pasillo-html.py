"""Escribe en index.html el pasillo del Inicio (Fase 14B) a partir de src/data/pasillo.json: entre
<!-- pasillo:inicio --> y <!-- pasillo:fin -->. Cada puerta con sus capas (imágenes con su lugar y su eje), su
pantalla de temperatura, su nombre y el enlace a su página en 3D. Así el pasillo existe aunque no llegue el JavaScript.

Uso: python3 scripts/build-pasillo-html.py   (después de scripts/build-pasillo.py)
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, 'src', 'data', 'pasillo.json')))['puertas']

# texto de cada puerta; la temperatura es de ejemplo (el cuarto que cierra cada una). El enlace abre la página con el
# mismo acabado que se ve en el pasillo (inoxidable en la abatible y la vaivén)
PUERTAS = [
    ('abatible', 'Abatible', 'Gira sobre bisagras. Cámaras de refrigeración y congelación.', 'Congelación', -18, '/industriales/abatible/?acabado=stainless', 'Ábrela en 3D'),
    ('corrediza', 'Corrediza', 'Corre colgada de un riel. Vanos anchos y paso de montacargas.', 'Refrigeración', 2, '/industriales/corrediza/', 'Ábrela en 3D'),
    ('vaiven', 'Vaivén', 'Abre hacia los dos lados y regresa sola. Cocinas y pasillos.', 'Preparación', 10, '/industriales/vaiven/?acabado=stainless', 'Ábrela en 3D'),
    ('cds', 'CDS Legacy', 'Exhibición Reach-In en juego de tres. Se quedan abiertas a 90°.', 'Bebidas', 3, '/cds/', 'Ábrelas en 3D'),
]
# orden de las capas (de atrás hacia adelante) y qué se mueve
ORDEN = {'abatible': ['fijo', 'hoja'], 'corrediza': ['fijo', 'hoja', 'frente'], 'vaiven': ['izq', 'der', 'fijo'], 'cds': ['fijo', 'p0', 'p1', 'p2']}
MUEVE = {'hoja', 'izq', 'der', 'p0', 'p1', 'p2'}
VERBO = {'abatible': 'la puerta abatible', 'corrediza': 'la puerta corrediza', 'vaiven': 'la puerta vaivén', 'cds': 'las puertas CDS'}

def srcset(img):
    return ', '.join(f'/img/pasillo/{f} {w}w' for w, f in sorted(((int(k), v) for k, v in img.items())))

def small(img):
    return '/img/pasillo/' + img[str(min(int(k) for k in img))]

def pct(r):
    return f'left:{r[0] * 100:.3f}%;top:{r[1] * 100:.3f}%;width:{r[2] * 100:.3f}%;height:{r[3] * 100:.3f}%'

def tfmt(t):
    return ('−' if t < 0 else '') + f'{abs(t):.1f}'

items = []
for i, (k, nombre, desc, cuarto, t0, href, cta) in enumerate(PUERTAS):
    e = D[k]; caps = e['capas']
    # vano: lo que cubren las hojas (detrás va el cuarto frío)
    movs = [caps[c]['rect'] for c in ORDEN[k] if c in MUEVE]
    x0 = min(r[0] for r in movs); y0 = min(r[1] for r in movs); x1 = max(r[0] + r[2] for r in movs); y1 = max(r[1] + r[3] for r in movs)
    vano = [x0 + 0.01, y0 + 0.01, x1 - x0 - 0.02, y1 - y0 - 0.015]
    layers = []
    for c in ORDEN[k]:
        cap = caps[c]; r = cap['rect']
        img = f'<img src="{small(cap["img"])}" srcset="{srcset(cap["img"])}" sizes="(min-width: 900px) 40vw, 80vw" alt="" loading="lazy" decoding="async" draggable="false">'
        if c in MUEVE:
            ex, ey = e['ejes'].get(c, [r[0], 0.5])
            ox = (ex - r[0]) / r[2] * 100
            layers.append(f'<span class="pas__mv" data-k="{c}" style="{pct(r)};transform-origin:{ox:.2f}% 50%">{img}<i class="pas__shade"></i></span>')
        else:
            layers.append(f'<span class="pas__fx pas__fx--{c}" style="{pct(r)}">{img}</span>')
    back = '' if k == 'cds' else f'<span class="pas__back" style="{pct(vano)}"><i></i></span>'
    extra = f';--viaje:{e["recorrido"]}' if 'recorrido' in e else ''
    items.append(f'''          <li class="pas" data-door="{k}" data-t="{t0}" style="--mw:{e['metros'][0]};--mh:{e['metros'][1]};--ar:{e['w']}/{e['h']}{extra}">
            <div class="pas__unit">
              <p class="pas__disp" aria-hidden="true"><span class="pas__led">{tfmt(t0)}</span><span class="pas__u">°C</span><span class="pas__room">{cuarto}</span></p>
              <button type="button" class="pas__door" aria-pressed="false" aria-label="Abrir {VERBO[k]}" data-cur="Abrir">
                {back}{''.join(layers)}<span class="pas__spill"><i></i><i></i></span>
              </button>
            </div>
            <div class="pas__txt"><h3>{nombre}</h3><p>{desc}</p><a class="pas__go" href="{href}">{cta}</a></div>
          </li>''')

html = f'''<!-- pasillo:inicio -->
      <!-- Adentro: el pasillo de las cámaras (Fase 14B, scripts/build-pasillo-html.py). Cada puerta se abre a su manera al
           tocarla y la pantalla de arriba marca cómo sube la temperatura del cuarto si se queda abierta (temperaturas de
           ejemplo). En el teléfono se recorre con el dedo; en la computadora se ve el pasillo a lo largo. -->
      <div class="hx__in" id="adentro">
        <div class="wrap pas__head">
          <h2 id="adentroT">Un solo trabajo: que el frío no se escape.</h2>
          <p>Cuatro puertas, cuatro maneras de abrir. Tócalas y mira cómo sube la temperatura si se quedan abiertas.</p>
        </div>
        <div class="pas__track" tabindex="-1">
          <ul class="pas__row" aria-labelledby="adentroT">
{chr(10).join(items)}
          </ul>
        </div>
        <div class="wrap pas__nav">
          <button type="button" class="pas__arrow" data-dir="-1" aria-label="Puerta anterior"></button>
          <p class="pas__tabs" role="group" aria-label="Ir a una puerta">{''.join(f'<button type="button" data-i="{i}" aria-pressed="{str(i == 0).lower()}">{p[1].replace(" Legacy", "")}</button>' for i, p in enumerate(PUERTAS))}</p>
          <button type="button" class="pas__arrow" data-dir="1" aria-label="Puerta siguiente"></button>
        </div>
      </div>
      <!-- pasillo:fin -->'''

p = os.path.join(ROOT, 'index.html')
s = open(p).read()
if '<!-- pasillo:inicio -->' in s:
    s = re.sub(r'<!-- pasillo:inicio -->.*?<!-- pasillo:fin -->', lambda m: html, s, flags=re.S)
else:
    a = s.index('      <!-- Adentro: lo que hay del otro lado de la puerta -->')
    b = s.index('      <!-- Afuera: muro, piso y la puerta.')
    s = s[:a] + '      ' + html + '\n' + s[b:]
open(p, 'w').write(s)
print('pasillo escrito:', len(items), 'puertas')

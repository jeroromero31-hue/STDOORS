# Fase 9 · Acabados: los de cada puerta, y el mismo material (mismos parámetros) en abatible y vaivén.
import asyncio, json
from playwright.async_api import async_playwright
B='http://localhost:4173'
GL=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
GET="""(names)=>{const out={}; window.__door.stage.scene.traverse(o=>{ if(!o.material) return; for(const m of [].concat(o.material)) if(names.includes(m.name) && !out[m.name]) out[m.name]={tipo:m.type,color:m.color.getHexString(),metal:m.metalness,rugosidad:m.roughness,clearcoat:m.clearcoat??null,aniso:m.anisotropy??null,env:m.envMapIntensity,mapa:!!m.map,mapaRug:!!m.roughnessMap}}); return out}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL); res={}
    for door in ('abatible','vaiven','corrediza'):
      pg=await b.new_page(viewport={'width':1366,'height':860}); await pg.goto(f'{B}/industriales/{door}/?calidad=alta'); await pg.wait_for_timeout(6000)
      sw=await pg.evaluate("[...document.querySelectorAll('#swatches .swatch')].map(b=>b.dataset.f)")
      mats={}
      for f in sw:
        await pg.click(f'#swatches .swatch[data-f={f}]'); await pg.wait_for_timeout(400)
        mats.update(await pg.evaluate(f"({GET})(['hygienicWhite','stainless','blackMetal','diamondPlate'])"))
      extra=await pg.evaluate("[document.getElementById('finishName').textContent, document.querySelectorAll('#swatches').length]")
      res[door]={'acabados':sw,'materiales':mats,'nota':extra}; await pg.close()
    await b.close()
  print(json.dumps(res,ensure_ascii=False,indent=1))
  a,v=res['abatible']['materiales'],res['vaiven']['materiales']
  same={k:a[k]==v[k] for k in ('hygienicWhite','stainless','blackMetal') if k in a and k in v}
  print('acabados abatible', res['abatible']['acabados'], '· vaivén', res['vaiven']['acabados'], '· corrediza', res['corrediza']['acabados'], res['corrediza']['nota'])
  print('mismo material en abatible y vaivén:', same)
  s,w=a.get('stainless'),a.get('hygienicWhite')
  if s and w: print('inoxidable más reflejante que el blanco:', s['metal']>w['metal'] and s['rugosidad']<=w['rugosidad'], s, w)
asyncio.run(main())

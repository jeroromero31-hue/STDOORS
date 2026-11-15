# Fase 9 · Tamaños de pantalla: la puerta queda completa dentro del visor (vista general), sin desborde, controles ≥ 44 px.
# Más: sitio sin WebGL y botón «atrás» del navegador.
import asyncio, json, os
os.makedirs('capturas_qa', exist_ok=True)
from playwright.async_api import async_playwright
B='http://localhost:4173'
GL=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
DEV=[('iPhone SE',375,667,True),('Android estrecho',360,740,True),('Plegable cerrado',280,653,True),('Plegable abierto',717,841,True),('Tablet vertical',768,1024,True),('Tablet horizontal',1024,768,True),('iPhone Duo cerrado',466,678,True),('iPhone Duo abierto',626,890,True),('iPhone Duo abierto horizontal',890,626,True),('Escritorio',1440,900,False)]
DOORS=['/industriales/abatible/','/industriales/corrediza/','/industriales/vaiven/','/cds/']
res=[]
def ok(name, cond, info=''): res.append(bool(cond)); print(('OK   ' if cond else 'FALLA'), name, '|', str(info)[:420], flush=True)
FRAME="""(()=>{const d=window.__door, st=d.stage, T=st.camera.position.constructor; const B3=new (st.scene.children[0].constructor===Object?Object:window.__Box)();
 return null})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL)
    for name,W,H,mob in DEV:
      rows=[]
      for path in DOORS:
        ctx=await b.new_context(viewport={'width':W,'height':H},is_mobile=mob,has_touch=mob,device_scale_factor=2 if mob else 1); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
        await pg.goto(B+path+'?calidad=baja'); await pg.wait_for_timeout(5000)
        await pg.evaluate("(()=>{const st=window.__door.stage; for(let i=0;i<120;i++){st.onFrame.forEach(f=>f(1/60,0)); st.controls.update();}})()")
        r=await pg.evaluate("""(()=>{const d=window.__door, st=d.stage; st.scene.updateMatrixWorld(); st.camera.updateMatrixWorld();
          // esquinas de cada malla visible de la puerta (sin muro ni piso), proyectadas a la pantalla del visor
          let mnx=9,mny=9,mxx=-9,mxy=-9; const V=st.camera.position.constructor;
          st.scene.traverseVisible(o=>{ if(!o.isMesh) return; for(let a=o;a;a=a.parent) if(a.name==='MuroYPiso') return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb=o.geometry.boundingBox; if(o.isInstancedMesh) return;
            for(let k=0;k<8;k++){ const v=new V(k&1?bb.max.x:bb.min.x, k&2?bb.max.y:bb.min.y, k&4?bb.max.z:bb.min.z).applyMatrix4(o.matrixWorld).project(st.camera); mnx=Math.min(mnx,v.x); mxx=Math.max(mxx,v.x); mny=Math.min(mny,v.y); mxy=Math.max(mxy,v.y);} });
          const c=st.renderer.domElement.getBoundingClientRect();
          const ctl=[...document.querySelectorAll('.door__ctl button, #swatches button')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect()).filter(q=>q.height<44||q.width<44).length;
          return {ndc:[mnx,mxx,mny,mxy].map(x=>+x.toFixed(2)), canvas:[Math.round(c.width),Math.round(c.height)], desborde:document.documentElement.scrollWidth>innerWidth, chicos:ctl}})()""")
        inside=all(abs(x)<=1.0 for x in r['ndc'])
        rows.append([path.split('/')[-2], inside, r['ndc'], r['canvas'], r['desborde'], r['chicos'], errs[:1]])
        if path=='/cds/' or name in ('Plegable cerrado','Tablet horizontal'): await pg.screenshot(path=f'capturas_qa/{name.replace(" ","_")}_{path.split("/")[-2]}.png')
        await ctx.close()
      ok(f'{name} {W}×{H}: cada puerta completa en el visor, sin desborde, controles ≥ 44 px', all(x[1] and not x[4] and x[5]==0 and not x[6] for x in rows), rows)
    # sin WebGL
    nb=await p.chromium.launch(args=['--disable-webgl','--disable-3d-apis'])
    rows=[]
    for path in DOORS:
      pg=await nb.new_page(viewport={'width':390,'height':844}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
      await pg.goto(B+path); await pg.wait_for_timeout(1500)
      r=await pg.evaluate("""(()=>{const fb=document.querySelector('.viewer__fallback, .fallback, [data-fallback]'); const img=document.querySelector('.door__viewer img'); 
        return {respaldo: !!(fb||img) , imagen_ok: img? img.complete && img.naturalWidth>0 : null, canvas: document.querySelectorAll('canvas').length, controles_visibles:[...document.querySelectorAll('.door__ctl button')].filter(b=>b.offsetParent).length, pasos: document.querySelectorAll('[data-view]').length, h1: document.querySelector('h1').textContent}})()""")
      await pg.mouse.wheel(0,1200); await pg.wait_for_timeout(300); sy=await pg.evaluate("scrollY")
      rows.append([path, r, sy, errs[:1]]); await pg.close()
    ok('sin WebGL: cada puerta muestra su imagen de respaldo, oculta los controles 3D, conserva el texto y se desplaza normal', all(x[1]['respaldo'] and x[1]['imagen_ok'] and x[1]['controles_visibles']==0 and x[2]>0 and not x[3] for x in rows), rows)
    await nb.close()
    # botón atrás: catálogo → ficha → puerta 3D → atrás
    ctx=await b.new_context(viewport={'width':1366,'height':860}); pg=await ctx.new_page()
    await pg.goto(B+'/componentes/?fam=vaiven'); await pg.wait_for_timeout(600)
    pid='vaiven-perfil-aluminio-40-mm'
    await pg.evaluate(f"window.__catalog.open(window.__catalog.list().find(p=>p.id==='{pid}'))"); await pg.wait_for_timeout(400)
    await pg.click('.sheet a.btn[href*="pieza="]'); await pg.wait_for_timeout(5000)
    at=await pg.evaluate("[location.pathname, window.__door&&window.__door.rig.current]")
    await pg.go_back(); await pg.wait_for_timeout(1200)
    back=await pg.evaluate("[location.search, document.querySelector('.sheet').classList.contains('is-open'), document.querySelector('.sheet h2')&&document.querySelector('.sheet h2').textContent, document.querySelectorAll('#catGrid .part').length]")
    await pg.go_forward(); await pg.wait_for_timeout(5000)
    fwd=await pg.evaluate("[location.pathname, !!window.__door]")
    ok('atrás/adelante: de la ficha a la puerta 3D y de regreso conserva la puerta, la ficha abierta y la lista', at[0]=='/industriales/vaiven/' and back[0]==f'?fam=vaiven&id={pid}' and back[1] and back[3]==10 and fwd==['/industriales/vaiven/',True], [at,back,fwd])
    # cambio de acabado, salir y volver
    await pg.goto(B+'/industriales/abatible/?calidad=baja'); await pg.wait_for_timeout(5000)
    await pg.click('#swatches .swatch[data-f=stainless]'); await pg.wait_for_timeout(800)
    await pg.goto(B+'/componentes/'); await pg.wait_for_timeout(600); await pg.go_back(); await pg.wait_for_timeout(5000)
    st=await pg.evaluate("[document.querySelector('#swatches .swatch[aria-pressed=true]')&&document.querySelector('#swatches .swatch[aria-pressed=true]').dataset.f, location.search, !!window.__door]")
    ok('acabado elegido, salir a otra página y volver con «atrás»: la puerta vuelve con el mismo acabado', st[0]=='stainless' and 'acabado=stainless' in st[1] and st[2], st)
    await ctx.close(); await b.close()
  print(f'{sum(res)} de {len(res)} comprobaciones correctas')
asyncio.run(main())

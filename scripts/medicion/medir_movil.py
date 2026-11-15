# Fase 8 · Medición en celular simulado: 390×844, DPR 3, CPU 4× más lenta, red «4G lenta» (1.6 Mb/s, 150 ms).
# Peso transferido por tipo (y su equivalente comprimido con gzip, como lo serviría un hosting), LCP, CLS,
# tiempo hasta el visor 3D listo y cuadros por segundo (GL por software: solo sirve para comparar antes/después).
import asyncio, json, sys, gzip, time
from playwright.async_api import async_playwright
B='http://localhost:4173/'
PAGES=['','industriales/','industriales/abatible/','industriales/corrediza/','industriales/vaiven/','cds/','componentes/','cotizar/']
GL=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
OUT=sys.argv[1] if len(sys.argv)>1 else '/home/claude/f8/medicion.json'
async def one(b, path):
  ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
  pg=await ctx.new_page(); cdp=await ctx.new_cdp_session(pg)
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
  await cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':150,'downloadThroughput':1.6e6/8,'uploadThroughput':0.75e6/8})
  await cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
  bodies=[]
  async def on_resp(r):
    try:
      if r.url.startswith(B): body=await r.body(); bodies.append((r.url, r.request.resource_type, len(body), len(gzip.compress(body,6))))
    except Exception: pass
  pg.on('response', lambda r: asyncio.ensure_future(on_resp(r)))
  await pg.add_init_script("""window.__lcp=0; window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});""")
  t0=time.time(); await pg.goto(B+path, wait_until='load', timeout=180000); load=time.time()-t0
  ready=None
  if 'industriales/' in path and path!='industriales/' or path=='cds/':
    for _ in range(240):
      if await pg.evaluate("!!(window.__door && window.__door.stage)"): ready=round(time.time()-t0,1); break
      await pg.wait_for_timeout(500)
  await pg.wait_for_timeout(2500)
  # desplazarse hasta abajo poco a poco (CLS durante la lectura) y volver
  H=await pg.evaluate("document.documentElement.scrollHeight")
  for y in range(0,H,400): await pg.evaluate(f"scrollTo(0,{y})"); await pg.wait_for_timeout(120)
  await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(800)
  fps=None; canvas=None
  if ready:
    await cdp.send('Emulation.setCPUThrottlingRate',{'rate':1})
    fps=await pg.evaluate("new Promise(r=>{let n=0; const t=performance.now(); (function f(){n++; if(performance.now()-t<3000) requestAnimationFrame(f); else r(+(n/((performance.now()-t)/1000)).toFixed(1))})()})")
    canvas=await pg.evaluate("(()=>{const c=document.querySelector('canvas'); const r=window.__door.stage.renderer; return [c.width,c.height,+r.getPixelRatio().toFixed(2)]})()")
    idle=await pg.evaluate("new Promise(r=>{const st=window.__door.stage; const f0=st.frames, i0=st.renderer.info.render.frame; setTimeout(()=>r([st.frames===undefined?null:st.frames-f0, st.renderer.info.render.frame-i0]),3000)})")
    canvas=canvas+[idle]
  m=await pg.evaluate("[Math.round(window.__lcp), +window.__cls.toFixed(4)]")
  await pg.wait_for_timeout(300)
  by={}
  for u,t,n,g in bodies:
    k={'script':'js','stylesheet':'css','image':'img','font':'font','document':'html'}.get(t,'otros')
    a=by.setdefault(k,[0,0,0]); a[0]+=n; a[1]+=g; a[2]+=1
  await ctx.close()
  return {'pagina':'/'+path,'load_s':round(load,1),'lcp_ms':m[0],'cls':m[1],'visor_listo_s':ready,'fps_swgl':fps,'canvas':canvas,'por_tipo':by,
          'total_kb':round(sum(v[0] for v in by.values())/1024),'total_gzip_kb':round(sum(v[1] if k in('js','css','html','otros') else v[0] for k,v in by.items())/1024)}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL); res=[]
    for path in PAGES:
      r=await one(b,path); res.append(r)
      print(f"{r['pagina']:26} total {r['total_kb']:>5} KB (comprimido {r['total_gzip_kb']:>5}) · LCP {r['lcp_ms']/1000:4.1f} s · CLS {r['cls']:.3f} · visor {r['visor_listo_s']} s · fps {r['fps_swgl']} · canvas {r['canvas']} · js {round(r['por_tipo'].get('js',[0])[0]/1024)} KB · img {round(r['por_tipo'].get('img',[0])[0]/1024)} KB · otros {round(r['por_tipo'].get('otros',[0])[0]/1024)} KB · font {round(r['por_tipo'].get('font',[0])[0]/1024)} KB", flush=True)
    json.dump(res,open(OUT,'w'),indent=1); await b.close()
asyncio.run(main())

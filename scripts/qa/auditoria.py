# Fase 9 · Auditoría de cada página (escritorio y celular): accesibilidad (axe-core, WCAG 2.1 A/AA), SEO básico,
# enlaces internos, botones sin función, logo sin deformar, errores de consola y peticiones fallidas, foco visible.
import asyncio, json, re, sys
from playwright.async_api import async_playwright
B='http://localhost:4173'
PAGES=['/','/industriales/','/industriales/abatible/','/industriales/corrediza/','/industriales/vaiven/','/cds/','/componentes/','/cotizar/','/404.html']
GL=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
AXE=open(__import__('os').environ.get('AXE_JS','node_modules/axe-core/axe.min.js')).read()
REC="""(()=>{ window.__clickables=new WeakSet(); const o=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(t,f,opt){ if(['click','pointerdown','pointerup','mousedown','touchstart','keydown'].includes(t)) window.__clickables.add(this); return o.call(this,t,f,opt) } })()"""
async def run(b, path, W, H, mob, report):
  ctx=await b.new_context(viewport={'width':W,'height':H},is_mobile=mob,has_touch=mob,device_scale_factor=2 if mob else 1)
  pg=await ctx.new_page(); errs=[]; bad=[]
  pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m: errs.append(m.text[:160]) if m.type=='error' else None)
  pg.on('response',lambda r: bad.append((r.status,r.url[-60:])) if r.status>=400 else None)
  pg.on('requestfailed',lambda r: bad.append(('falló',r.url[-60:])))
  await pg.add_init_script(REC)
  url=B+path+('?calidad=baja' if any(k in path for k in ('abatible','corrediza','vaiven','cds')) else '')
  await pg.goto(url); await pg.wait_for_timeout(5000 if 'calidad' in url else 1500)
  r={'pagina':path,'vista':f'{W}x{H}'}
  await pg.add_script_tag(content=AXE)
  ax=await pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ej:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\\n').slice(1,2).join(''))})))")
  r['axe']=ax
  r['seo']=await pg.evaluate("""(()=>({title:document.title, desc:(document.querySelector('meta[name=description]')||{}).content||'', lang:document.documentElement.lang, h1:document.querySelectorAll('h1').length,
     viewport:!!document.querySelector('meta[name=viewport]'), robots:(document.querySelector('meta[name=robots]')||{}).content||'', og:!!document.querySelector('meta[property="og:title"]'), canonical:!!document.querySelector('link[rel=canonical]')}))()""")
  r['botones_sin_funcion']=await pg.evaluate("""[...document.querySelectorAll('button, [role=button]')].filter(b=>b.offsetParent || b.closest('dialog')).filter(b=>{
     if(b.type==='submit' && b.form) return false; if(b.onclick) return false;
     for(let e=b; e && e!==document.body; e=e.parentElement) if(window.__clickables.has(e)) return false; return true }).map(b=>(b.id||b.className||b.tagName)+' «'+b.textContent.trim().slice(0,24)+'»')""")
  r['logo']=await pg.evaluate("""[...document.querySelectorAll('img')].filter(i=>/logo/i.test(i.src)&&i.offsetParent).map(i=>{const q=i.getBoundingClientRect(); return [i.naturalWidth? +((i.naturalWidth/i.naturalHeight)/(q.width/q.height)).toFixed(3):null, Math.round(q.width), Math.round(q.height)]})""")
  if W>1000:
    links=await pg.evaluate("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)))]")
    broken=[]
    for l in links:
      u,_,frag=l.partition('#'); resp=await pg.request.get(u)
      if resp.status!=200: broken.append((l,resp.status)); continue
      if frag and f'id="{frag}"' not in await resp.text(): broken.append((l,'sin #'+frag))
    r['enlaces']=[len(links), broken]
    # foco visible: los primeros 30 elementos con Tab
    nofocus=[]
    await pg.evaluate("scrollTo(0,0); document.activeElement && document.activeElement.blur()")
    for _ in range(30):
      await pg.keyboard.press('Tab')
      f=await pg.evaluate("""(()=>{const e=document.activeElement; if(!e||e===document.body) return null; const s=getComputedStyle(e); const vis=(s.outlineStyle!=='none' && parseFloat(s.outlineWidth)>0) || (s.boxShadow&&s.boxShadow!=='none'); return [vis, (e.id||e.className||e.tagName).toString().slice(0,30)+' «'+(e.textContent||e.value||'').trim().slice(0,20)+'»']})()""")
      if f and not f[0]: nofocus.append(f[1])
    r['sin_foco_visible']=sorted(set(nofocus))
  r['errores']=errs[:5]; r['fallidas']=bad[:5]
  report.append(r); await ctx.close()
  flag=lambda: [k for k,v in (('axe',ax),('botones',r['botones_sin_funcion']),('errores',errs),('fallidas',bad),('enlaces',r.get('enlaces',[0,[]])[1]),('foco',r.get('sin_foco_visible',[]))) if v]
  print(f"{path:26} {r['vista']:9} axe {[(v['id'],v['impact'],v['n']) for v in ax]} · revisar {flag()}", flush=True)
async def main():
  report=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=GL)
    for path in PAGES:
      for W,H,m in ((1366,860,False),(390,844,True)):
        await run(b,path,W,H,m,report)
    await b.close()
  json.dump(report,open('auditoria.json','w'),ensure_ascii=False,indent=1)
asyncio.run(main())

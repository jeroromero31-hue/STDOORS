const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/vano-Bt4-vY2k.js","assets/site-C67a6W2T.js","assets/site-CUB9UA8Z.css","assets/medida-saRpYh7o.js","assets/whatsapp-LpAXtEJc.js"])))=>i.map(i=>d[i]);
import{m as g,u as l,_ as u}from"./site-C67a6W2T.js";import{c as f}from"./components-B2rbAM6X.js";g("industriales");const c=(a,o=document)=>o.querySelector(a),d=(a,o=document)=>[...o.querySelectorAll(a)],h=a=>f.piezas.filter(o=>o.familias.includes(a)).length,n=[{id:"abatible",nombre:"Abatible",como:"Gira sobre sus bisagras y cierra con chapa de palanca."},{id:"corrediza",nombre:"Corrediza",como:"Corre colgada del riel y, al cerrar, baja para sellar contra el marco."},{id:"vaiven",nombre:"Vaivén",como:"Semi aislante. Sus hojas abren hacia los dos lados y regresan solas."}],m=matchMedia("(prefers-reduced-motion: reduce)").matches,$=(a,o)=>l(`img/inicio/escaner/${a}-alto-${o}.webp`);c("#indList").innerHTML=n.map((a,o)=>`
  <li class="ind-door" style="--i:${o}">
    <a class="ind-door__img" href="${l(`industriales/${a.id}/`)}" tabindex="-1" aria-hidden="true">
      <img class="ind-door__x" src="${$(a.id,"rayos")}" alt="" width="900" height="1200" loading="lazy" decoding="async">
      <img class="ind-door__n" src="${$(a.id,"normal")}" alt="" width="900" height="1200" ${o?'loading="lazy"':'fetchpriority="high"'} decoding="async">
      <i class="ind-door__line"></i>
    </a>
    <div class="ind-door__t">
      <h2 data-no-lines><span class="ind-door__k">Puerta</span> ${a.nombre.toLowerCase()}</h2>
      <p>${a.como}</p>
      <p class="ind-door__go"><a class="btn" href="${l(`industriales/${a.id}/`)}">Abrir en 3D</a><a class="link t-small" href="${l("componentes/")}?fam=${a.id}">${h(a.id)} piezas</a></p>
    </div>
  </li>`).join("");if(!matchMedia("(hover: hover)").matches&&!m){const a=new IntersectionObserver(o=>o.forEach(r=>{r.intersectionRatio>.6&&(r.target.classList.add("is-scan"),a.unobserve(r.target))}),{threshold:[.6]});d(".ind-door").forEach(o=>a.observe(o))}const s=115,i=205,e=64,t=`<path class="pl-wall" d="M8 ${e-6}H${s}V${e+6}H8Z M${i} ${e-6}H312V${e+6}H${i}Z"/>
  <text class="pl-in" x="16" y="${e-16}">Adentro</text><text class="pl-in" x="16" y="${e+26}">Afuera</text>`,x={abatible:`${t}
    <path class="pl-zone" d="M${s} ${e+6} L${i} ${e+6} A90 90 0 0 1 ${s} ${e+96} Z"/>
    <path class="pl-arc" d="M${i} ${e+6} A90 90 0 0 1 ${s} ${e+96}"/>
    <rect class="pl-leaf pl-leaf--ab" x="${s}" y="${e+6}" width="90" height="7" rx="1.5"/>
    <circle class="pl-pin" cx="${s}" cy="${e+9.5}" r="3"/>
    <text class="pl-t" x="${s+50}" y="${e+70}">Espacio al frente para el giro</text>`,corrediza:`${t}
    <path class="pl-zone" d="M${i} ${e+6} H${i+92} V${e+18} H${i} Z"/>
    <line class="pl-rail" x1="${s-4}" y1="${e+21}" x2="${i+96}" y2="${e+21}"/>
    <rect class="pl-leaf pl-leaf--co" x="${s-2}" y="${e+7}" width="94" height="8" rx="1.5"/>
    <text class="pl-t" x="${i+46}" y="${e+44}">Muro libre a un lado</text>`,vaiven:`${t}
    <path class="pl-zone" d="M${s} ${e} L${s+45} ${e} A45 45 0 0 0 ${s} ${e-45} Z M${i} ${e} L${i-45} ${e} A45 45 0 0 1 ${i} ${e-45} Z"/>
    <path class="pl-zone" d="M${s} ${e} L${s+45} ${e} A45 45 0 0 1 ${s} ${e+45} Z M${i} ${e} L${i-45} ${e} A45 45 0 0 0 ${i} ${e+45} Z"/>
    <rect class="pl-leaf pl-leaf--vl" x="${s}" y="${e-3.5}" width="45" height="7" rx="1.5"/>
    <rect class="pl-leaf pl-leaf--vr" x="${i-45}" y="${e-3.5}" width="45" height="7" rx="1.5"/>
    <circle class="pl-pin" cx="${s}" cy="${e}" r="3"/><circle class="pl-pin" cx="${i}" cy="${e}" r="3"/>
    <text class="pl-t" x="${(s+i)/2}" y="${e+70}">Abre hacia los dos lados</text>`},p={abatible:"La hoja gira hacia afuera: deja libre frente al vano un cuarto de círculo del ancho de la hoja.",corrediza:"La hoja corre pegada al muro: pide a un lado del vano un tramo de muro libre de su mismo ancho, para el riel.",vaiven:"Las hojas se empujan desde cualquier lado y regresan solas: necesita espacio a los dos lados del vano."};c("#indPlans").innerHTML=n.map(a=>`
  <figure class="ind-plan" data-door="${a.id}">
    <svg viewBox="0 0 320 170" role="img" aria-label="Vista desde arriba de la puerta ${a.nombre.toLowerCase()}: ${p[a.id]}">${x[a.id]}</svg>
    <figcaption><b>${a.nombre}</b><span>${p[a.id]}</span></figcaption>
  </figure>`).join("");if(m)d(".ind-plan").forEach(a=>a.classList.add("is-still"));else{const a=new IntersectionObserver(o=>o.forEach(r=>r.target.classList.toggle("is-play",r.isIntersecting)),{threshold:.35});d(".ind-plan").forEach(o=>a.observe(o))}const v=[["Cómo abre",["Gira sobre bisagras","Corre colgada de un riel","Hojas que abren hacia los dos lados"]],["Cómo cierra",["Con chapa de palanca","Al cerrar baja y sella contra el marco","Regresa sola al centro"]],["Aislamiento",["Refrigeración o congelación","Refrigeración o congelación","Semi aislante"]],["Espacio que pide",["Frente al vano, para el giro","Muro libre a un lado","A los dos lados del vano"]],["Acabados",["Negro, inoxidable o blanco sanitario","Un acabado","Negro, inoxidable o blanco sanitario"]],["Piezas en el catálogo",n.map(a=>`<a class="link" href="${l("componentes/")}?fam=${a.id}">${h(a.id)} piezas</a>`)]];c("#indCmp").innerHTML=`
  <div class="cmpx__h" aria-hidden="true"><span></span>${n.map(a=>`<b>${a.nombre}</b>`).join("")}</div>
  <dl class="cmpx__rows">${v.map(([a,o])=>`<div class="cmpx__r"><dt>${a}</dt>${o.map((r,b)=>`<dd><span class="cmpx__m">${n[b].nombre}</span>${r}</dd>`).join("")}</div>`).join("")}</dl>`;u(async()=>{const{mountVano:a}=await import("./vano-Bt4-vY2k.js").then(o=>o.b);return{mountVano:a}},__vite__mapDeps([0,1,2,3,4])).then(({mountVano:a})=>a(c("#indVano"))).catch(a=>console.error(a));

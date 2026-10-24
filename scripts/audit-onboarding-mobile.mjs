#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const devices = [[320,568,'small'],[375,667,'se'],[390,844,'regular'],[430,932,'large']];
const base = 'http://127.0.0.1:3150/preview/progreso-pdf?recorrido=1';
const failures=[], sleep = ms => new Promise(r=>setTimeout(r,ms));
let server, chrome, socket, counter=0;
const pending = new Map();
async function waitFor(check,label,loops=130) {
  for(let i=0;i<loops;i++){try{const v=await check();if(v)return v}catch{}
    await sleep(500);}
  throw new Error('Timeout '+label);
}
function call(method,params={}) {
  return new Promise((resolve,reject)=>{
    const id=++counter,timeout=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method))},20000);
    pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const out=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(out.result.exceptionDetails)throw new Error(JSON.stringify(out.result.exceptionDetails));
  return out.result.result.value;
}
const snapExpression = '(() => { '
+'const g=document.querySelector("[data-first-pdf-guide]");'
+'const p=Array.from(document.querySelectorAll("[data-onboarding-study-panel]")).find(n=>n.getBoundingClientRect().width>0);'
+'const r=p?.querySelector("[role=region][aria-label=\\"Contenido de estudio\\"]");'
+'const nav=document.querySelector("[data-pdf-mobile-navigation]");'
+'const step=p?.getAttribute("data-onboarding-step") || "complete";'
+'const selector={summary:"[data-summary-reading-section=\\"0\\"]",practice:"[data-onboarding-practice-options]",progress:"[data-recommended-topics]",reinforce:"[data-onboarding-topic-detail]"};'
+'const target=r?.querySelector(selector[step]||".unreachable");'
+'const rect=n=>{if(!n)return null;const b=n.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height}};'
+'return {step,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,guide:rect(g),guideScrollWidth:g?.scrollWidth||0,guideClientWidth:g?.clientWidth||0,panel:rect(p),nav:rect(nav),target:rect(target),illustrativeRows:r?.querySelectorAll("[data-tour-example-topic]").length||0,disclaimer:!!r?.querySelector("[data-tour-progress-disclaimer]")};'
+'})()';
await mkdir('artifacts/mobile-onboarding',{recursive:true});
try {
  server=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3150'],{stdio:'ignore',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
  await waitFor(async()=>{const r=await fetch(base);return r.ok},'Next local preview',180);
  chrome=spawn(process.env.CHROME_BIN||'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-allow-origins=*','--remote-debugging-port=19223','--user-data-dir=/tmp/evaluo-mobile-qa-'+process.pid,'about:blank'],{stdio:'ignore'});
  const page=await waitFor(async()=>{const r=await fetch('http://127.0.0.1:19223/json');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl)},'Chrome debugger',80);
  socket=new WebSocket(page.webSocketDebuggerUrl);
  socket.onmessage=e=>{const x=JSON.parse(String(e.data)),job=pending.get(x.id);if(!job)return;clearTimeout(job.timeout);pending.delete(x.id);if(x.error)job.reject(new Error(JSON.stringify(x.error)));else job.resolve(x)};
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  await call('Page.enable');await call('Runtime.enable');
  for(const [width,height,name] of devices) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await call('Emulation.setTouchEmulationEnabled',{enabled:true});
    await call('Page.navigate',{url:base+'&device='+width});
    await waitFor(()=>evaluate('!!document.querySelector("[data-first-pdf-guide]")'),'guide '+name);
    await sleep(600);
    for(const step of ['summary','practice','progress','reinforce']) {
      await waitFor(async()=>{const x=await evaluate(snapExpression);return x.step===step},step+' '+name,70);
      await sleep(450);
      const x=await evaluate(snapExpression),key=name+'/'+step;
      console.log(key,JSON.stringify(x));
      const test=(yes,msg)=>{if(!yes)failures.push(key+': '+msg)};
      test(x.scrollWidth<=width+2,'page horizontal overflow '+x.scrollWidth);
      test(x.guide&&x.guide.left>=-1&&x.guide.right<=width+1,'guide horizontal overflow');
      test(x.guideScrollWidth<=x.guideClientWidth+2,'guide contents overflow horizontally '+x.guideScrollWidth+' > '+x.guideClientWidth);
      test(x.guide&&x.guide.top>=-1&&x.guide.bottom<=height+1,'guide vertical overflow');
      test(x.panel&&x.panel.height>=85,'workspace too small');
      test(x.nav&&x.nav.top>0,'mobile navigation hidden');
      test(x.target&&x.target.width>0&&x.target.height>0,'step content missing');
      test(x.guide&&x.panel&&x.guide.bottom<=x.panel.top+12,'guide overlaps workspace');
      if(step==='progress'){test(x.illustrativeRows===3,'example topics missing');test(x.disclaimer,'example disclaimer missing')}
      const screenshot=await call('Page.captureScreenshot',{format:'png',fromSurface:true});
      await writeFile('artifacts/mobile-onboarding/'+name+'-'+step+'.png',Buffer.from(screenshot.result.data,'base64'));
      const label=step==='reinforce'?'Empezar a estudiar':'Siguiente';
      const clicked=await evaluate('(() => {const g=document.querySelector("[data-first-pdf-guide]");const b=Array.from(g?.querySelectorAll("button")||[]).find(n=>n.textContent.includes('+JSON.stringify(label)+'));if(!b)return false;b.click();return true})()');
      test(clicked,'next button not found');await sleep(700);
    }
    const end=await evaluate('({guide:!!document.querySelector("[data-first-pdf-guide]"),examples:document.querySelectorAll("[data-tour-example-topic]").length})');
    console.log(name+'/finished',JSON.stringify(end));
    if(end.guide||end.examples)failures.push(name+': guide or fake progress persisted after completion');
  }
  // La guía también debe caber en escritorio/tablet: esta regresión se produjo
  // cuando el CTA final competía con las cuatro barras de pasos en la misma fila.
  for(const [width,height,name] of [[768,1024,'tablet'],[1440,900,'desktop']]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Emulation.setTouchEmulationEnabled',{enabled:false});
    await call('Page.navigate',{url:base+'&device='+name});
    await waitFor(()=>evaluate('!!document.querySelector("[data-first-pdf-guide]")'),'guide '+name);
    for(const step of ['summary','practice','progress','reinforce']) {
      await waitFor(async()=>{const x=await evaluate(snapExpression);return x.step===step},step+' '+name,70);
      await sleep(400);
      const x=await evaluate(snapExpression),key=name+'/'+step;
      console.log(key,JSON.stringify(x));
      if(x.scrollWidth>width+2)failures.push(key+': page overflows horizontally');
      if(!x.guide || x.guide.left < -1 || x.guide.right > width+1 || x.guide.top < -1 || x.guide.bottom > height+1)
        failures.push(key+': guide outside viewport');
      if(x.guideScrollWidth>x.guideClientWidth+2)
        failures.push(key+': guide has horizontal scrollbar '+x.guideScrollWidth+' > '+x.guideClientWidth);
      if(!x.target || x.target.width<=0 || x.target.height<=0)
        failures.push(key+': step target missing');
      const shot=await call('Page.captureScreenshot',{format:'png',fromSurface:true});
      await writeFile('artifacts/mobile-onboarding/'+key.replace('/','-')+'.png',Buffer.from(shot.result.data,'base64'));
      const label=step==='reinforce'?'Empezar a estudiar':'Siguiente';
      const clicked=await evaluate('(() => {const g=document.querySelector("[data-first-pdf-guide]");const b=Array.from(g?.querySelectorAll("button")||[]).find(n=>n.textContent.includes('+JSON.stringify(label)+'));if(!b)return false;b.click();return true})()');
      if(!clicked)failures.push(key+': next button missing');
      await sleep(650);
    }
  }
  // Recorremos también el lector real con contenido del PDF de prueba sin
  // onboarding: las pestañas no deben desbordar ni desaparecer en móviles.
  const readerBase = 'http://127.0.0.1:3150/preview/progreso-pdf';
  const readerMetrics = '(() => {'
    + 'const nav=document.querySelector("[data-pdf-mobile-navigation]");'
    + 'const root=document.documentElement;'
    + 'const region=Array.from(document.querySelectorAll("[role=region][aria-label]")).find(n=>n.getAttribute("aria-label")==="Contenido de estudio"&&n.getBoundingClientRect().width>0);'
    + 'const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};'
    + 'const active=nav?.querySelector("button[aria-current=page]");'
    + 'return {width:innerWidth,height:innerHeight,scrollWidth:root.scrollWidth,nav:rect(nav),region:rect(region),active:active?.textContent?.trim()||null};'
    + '})()';
  for (const [width,height,name] of devices) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await call('Emulation.setTouchEmulationEnabled',{enabled:true});
    await call('Page.navigate',{url:readerBase+'?mobile_qa='+width});
    await waitFor(async()=>{
      const x=await evaluate(readerMetrics);
      return x.nav&&x.region&&x.active?.includes('Resumen');
    },'PDF reader ready '+name,130);
    for (const tab of ['Resumen','Flashcards','Práctica','Progreso']) {
      const changed = await evaluate('(() => {const nav=document.querySelector("[data-pdf-mobile-navigation]");const b=Array.from(nav?.querySelectorAll("button")||[]).find(n=>n.textContent.trim().startsWith('+JSON.stringify(tab)+'));if(!b)return false;b.click();return true})()');
      if(!changed){failures.push('reader '+name+'/'+tab+': tab button missing');continue}
      await waitFor(async()=>{
        const x=await evaluate(readerMetrics);
        return x.active?.includes(tab);
      },'PDF reader tab '+tab+' '+name,70);
      await sleep(400);
      const x=await evaluate(readerMetrics),key='reader '+name+'/'+tab;
      console.log(key,JSON.stringify(x));
      if(x.scrollWidth>width+2)failures.push(key+': horizontal overflow '+x.scrollWidth+' > '+width);
      if(!x.nav||x.nav.left < -1||x.nav.right>width+1||x.nav.bottom>height+2||x.nav.top<0)
        failures.push(key+': navigation outside viewport '+JSON.stringify(x.nav));
      if(!x.region||x.region.width<120||x.region.right>width+3)
        failures.push(key+': study region outside viewport '+JSON.stringify(x.region));
      const shot=await call('Page.captureScreenshot',{format:'png',fromSurface:true});
      await writeFile('artifacts/mobile-onboarding/reader-'+name+'-'+tab.toLowerCase()+'.png',Buffer.from(shot.result.data,'base64'));
    }
  }
  // Completamos la matriz responsive con tablet y escritorio.
  for (const [width,height] of [[768,1024],[1024,768],[1440,900]]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Emulation.setTouchEmulationEnabled',{enabled:false});
    await call('Page.navigate',{url:readerBase+'?desktop_qa='+width});
    await waitFor(async()=>{
      const x=await evaluate(readerMetrics);
      return x.region&&x.region.width>100;
    },'PDF reader desktop '+width,130);
    const x=await evaluate(readerMetrics);
    console.log('reader desktop/'+width,JSON.stringify(x));
    if(x.scrollWidth>width+2)failures.push('reader desktop/'+width+': horizontal overflow '+x.scrollWidth);
    if(x.nav&&x.nav.width>0)failures.push('reader desktop/'+width+': mobile navigation still visible');
    const shot=await call('Page.captureScreenshot',{format:'png',fromSurface:true});
    await writeFile('artifacts/mobile-onboarding/reader-desktop-'+width+'.png',Buffer.from(shot.result.data,'base64'));
  }

  console.log('MOBILE_AUDIT_RESULT',failures.length?'FAIL':'PASS',JSON.stringify(failures));
  if(failures.length)process.exitCode=1;
}catch(e){console.error('MOBILE_AUDIT_ERROR',e);process.exitCode=1}
finally{try{socket?.close()}catch{};chrome?.kill('SIGTERM');server?.kill('SIGTERM');await sleep(250)}

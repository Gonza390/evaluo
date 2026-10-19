import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://localhost:3100';
const dir = process.env.QA_ARTIFACTS_DIR || 'qa-artifacts/master-visual';
await mkdir(dir, { recursive: true });

const cases = [
  { id: 'home', path: '/', core: true },
  { id: 'login', path: '/login', core: true },
  { id: 'empezar', path: '/empezar', core: true },
  { id: 'precios', path: '/pricing', core: true },
  { id: 'explorar', path: '/explorar' },
  { id: 'pregunteros', path: '/pregunteros' },
  { id: 'recursos', path: '/recursos' },
  { id: 'simulador', path: '/simulador' },
  { id: 'demo-estudio', path: '/demo/material-estudio', core: true },
  { id: 'primer-pdf', path: '/preview/primer-pdf', core: true },
  { id: 'pdf-listo', path: '/preview/procesando-pdf?listo=1', core: true },
  { id: 'progreso-inicial', path: '/preview/progreso-pdf?tab=progreso&nuevo=1', core: true },
  { id: 'progreso-con-errores', path: '/preview/progreso-pdf?tab=progreso', core: true },
  { id: 'mis-errores', path: '/preview/mis-errores', core: true },
  { id: 'explicacion', path: '/preview/mis-errores/explicacion', core: true },
  { id: 'resultado-simulador', path: '/preview/resultado-simulador', core: true },
  { id: 'plan-examen', path: '/preview/fecha-examen-plan' },
  { id: 'perfil-configuracion', path: '/preview/configuracion' },
  { id: 'dashboard-auth', path: '/dashboard', protected: true },
  { id: 'mis-materiales-auth', path: '/dashboard/materiales', protected: true },
];
const sizes = [
  { width: 355, height: 840, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' },
];
const browser = await chromium.launch({ headless: true });
const observations = [];
const blockers = [];

for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
  for (const target of cases) {
    const errors = [];
    const onError = error => errors.push(String(error.message || error).slice(0, 280));
    page.on('pageerror', onError);
    let status = 0, location = '';
    try {
      const response = await page.goto(base + target.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      status = response?.status() || 0;
      await page.waitForLoadState('load', { timeout: 13000 }).catch(() => {});
      await page.waitForTimeout(300);
      location = new URL(page.url()).pathname;
      const measured = await page.evaluate(() => {
        const w = window.innerWidth, root = document.documentElement;
        const main = document.querySelector('main');
        const bodyStyle = getComputedStyle(document.body);
        const controls = [...document.querySelectorAll('button, a, input, select, textarea')]
          .filter(el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return r.width>=3 && r.height>=3 && s.visibility!=='hidden' && s.display!=='none'; });
        const tiny = controls.filter(el=>{const r=el.getBoundingClientRect(); return r.height<32 && r.width<32 && r.top>=0 && r.top < innerHeight}).slice(0,7).map(el=>({text:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,32),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}));
        const offscreen = [...document.querySelectorAll('body *')]
          .filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.visibility!=='hidden' && s.display!=='none' && r.width>3 && r.right>w+3 && r.left<w+1 && r.top<innerHeight && r.bottom>0;})
          .slice(0,6).map(el=>({tag:el.tagName.toLowerCase(),width:Math.round(el.getBoundingClientRect().width),right:Math.round(el.getBoundingClientRect().right),className:String(el.className).slice(0,100)}));
        const h1=[...document.querySelectorAll('h1')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.textContent?.trim().slice(0,90));
        const headings=[...document.querySelectorAll('h2')].filter(el=>getComputedStyle(el).display!=='none').slice(0,5).map(el=>el.textContent?.trim().slice(0,80));
        const primary=[...document.querySelectorAll('button,a')].filter(el=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();return r.width>20&&r.height>20&&r.top>=0&&r.top<innerHeight&&(/rgb\(37, 99, 235\)|rgb\(79, 93, 255\)/.test(s.backgroundColor)||el.className?.toString()?.includes('bg-primary'));}).slice(0,5).map(el=>(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,70));
        return {documentWidth:root.scrollWidth,viewportWidth:w,bodyScrollWidth:document.body.scrollWidth,mainWidth:main?.getBoundingClientRect().width,background:bodyStyle.backgroundColor,fontFamily:bodyStyle.fontFamily,fontSize:bodyStyle.fontSize,headings:h1,sectionHeadings:headings,primaryActions:primary,tinyControls:tiny,visibleOverflow:offscreen,clickableCount:controls.length};
      });
      const routeOk = target.protected || target.id==='perfil-configuracion'
        ? [200,302,307,308,404].includes(status) || location !== target.path
        : status===200 && !['/login','/not-found'].includes(location);
      const record = {route:target.id,requested:target.path,location,status,viewport:size.width,ok:routeOk,errors, ...measured};
      observations.push(record);
      const filename = dir+'/'+target.id+'-'+size.name+'.png';
      if (status===200 && !target.protected)
        await page.screenshot({path:filename,fullPage:false,animations:'disabled',timeout:20000}).catch(error=>{record.screenshotError=String(error.message).slice(0,180)});
      if (!routeOk) blockers.push('Route/status '+target.id+' '+size.width+': '+status+' '+location);
      if (measured.documentWidth>size.width+2 && measured.visibleOverflow.length) blockers.push('Visible overflow '+target.id+' '+size.width+': '+JSON.stringify(measured.visibleOverflow.slice(0,2)));
      if (target.core && errors.length) blockers.push('Runtime '+target.id+' '+size.width+': '+errors.slice(0,2).join(' | '));
      console.log('AUDIT '+size.width+' '+target.id+' '+status+' '+location+' root='+measured.documentWidth+' visibleOverflow='+measured.visibleOverflow.length+' jsErrors='+errors.length);
    } catch (error) {
      blockers.push('Exception '+target.id+' '+size.width+': '+String(error.message).slice(0,350));
      observations.push({route:target.id,viewport:size.width,status,location,error:String(error.message)});
      console.log('FAIL '+size.width+' '+target.id+' '+String(error.message).slice(0,200));
    } finally {
      page.off('pageerror', onError);
    }
  }
  await page.close();
}
await browser.close();
const report={branch:process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF||'local',testedAt:new Date().toISOString(),screens:observations.length,blockers,observations};
await writeFile(dir+'/audit.json',JSON.stringify(report,null,2),'utf8');
console.log('MASTER VISUAL AUDIT RESULT '+JSON.stringify({screens:observations.length,blockers: blockers.length}));
if(blockers.length) {
  console.log('AUDIT BLOCKERS\n'+blockers.join('\n'));
  process.exitCode=1;
}

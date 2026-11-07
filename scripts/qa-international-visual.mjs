// Visual release audit of the public English journey and unauthenticated study preview.
// Runs a real Chromium browser in GitHub Actions at mobile and desktop widths.
// A passing run is NOT equivalent to authenticated end-to-end testing.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = (process.env.QA_BASE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '');
const OUT = process.env.QA_ARTIFACTS_DIR || 'qa-artifacts/international-visual';
const PAGES = [
  '/en',
  '/en/login?mode=signup',
  '/en/login?mode=login',
  '/en/pricing',
  '/en/study-pdf-with-ai',
  '/en/pdf-to-quiz',
  '/en/pdf-to-flashcards',
  '/en/resources',
  '/en/blog',
  '/en/terms',
  '/en/privacy',
  '/en/refunds',
  '/preview/progreso-pdf',
  '/preview/configuracion',
];
const DEVICES = [
  { name: 'mobile', width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
];
const report = {
  date: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || 'unknown',
  base: BASE,
  classification: 'Chromium browser visual audit, public pages and anonymous demonstration screens only',
  authenticatedE2E: false,
  routes: [],
};
function slug(path) { return path.replace(/^\//, '').replace(/[^a-z0-9]+/ig, '-') || 'home'; }
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({headless: true, args:['--no-sandbox']});
try {
  for (const device of DEVICES) {
    const context = await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.isMobile,hasTouch:device.hasTouch,deviceScaleFactor:1,reducedMotion:'reduce',locale:'en-US'});
    await context.addCookies([{name:'evaluo_ui_locale',value:'en',url:BASE}]);
    await context.addInitScript(() => { try { localStorage.setItem('evaluo_app_locale', 'en'); } catch {} });
    for (const path of PAGES) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error.message).slice(0,300)));
      const r = {path,device:device.name,width:device.width,status:0,finalPath:'',htmlLang:'',horizontalOverflow:0,overflowingElements:[],suspectedSpanish:[],brokenPublicLinks:[],pageErrors:[],checkedCTA:[],screenshot:'',issue:[]};
      try {
        const response = await page.goto(BASE + path, {waitUntil:'domcontentloaded',timeout:90000});
        r.status = response?.status() || 0;
        await page.waitForLoadState('load',{timeout:18000}).catch(()=>{});
        await page.evaluate(()=>document.fonts.ready).catch(()=>{});
        await page.waitForTimeout(250);
        r.finalPath = new URL(page.url()).pathname;
        const metrics = await page.evaluate(() => {
          const w = innerWidth;
          const visible = element => {
            const style=getComputedStyle(element);
            const rect=element.getBoundingClientRect();
            return rect.width>1 && rect.height>1 && style.display!=='none' && style.visibility!=='hidden';
          };
          const text = document.querySelector('main')?.innerText || document.body.innerText || '';
          const spanish = text.split('\n').map(s=>s.trim()).filter(s => /(?:^|[\s([{])(?:Subí|Empezá|Cargá|Continuá|Elegí|Guardá|Volvé|Rendís|¡|¿|Comenzá|Tus apuntes|Mi espacio|Tu material está listo|Tu cuenta|Prepará|Iniciar sesión|Crear cuenta gratis)(?:\s|[?!.,:]|$)/i.test(s)).slice(0,20);
          const overflowing = [...document.querySelectorAll('body *')].filter(el=>{
            if(!visible(el))return false;
            const b=el.getBoundingClientRect();
            return b.left >= -2 && b.left < w && b.right > w+4;
          }).slice(0,12).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,85),text:(el.textContent||'').trim().slice(0,65)}));
          const broken = [...document.querySelectorAll('main a[href],header a[href],nav a[href]')].filter(el=>visible(el))
            .map(el=>({text:(el.textContent||'').trim().slice(0,75),href:el.getAttribute('href')}))
            .filter(a => /^(?:\/login|\/pricing)(?:[?#]|$)/.test(a.href || '')).slice(0,18);
          return {htmlLang:document.documentElement.lang, horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-w), overflowing, spanish,broken};
        });
        Object.assign(r,{htmlLang:metrics.htmlLang,horizontalOverflow:metrics.horizontalOverflow,overflowingElements:metrics.overflowing,suspectedSpanish:metrics.spanish,brokenPublicLinks:metrics.broken});
        if(r.status!==200)r.issue.push('HTTP '+r.status);
        if(path.startsWith('/en') && r.htmlLang!=='en')r.issue.push('HTML lang not English: '+r.htmlLang);
        if(r.horizontalOverflow>4)r.issue.push('Document horizontal overflow '+r.horizontalOverflow+'px');
        if(path.startsWith('/en') && r.brokenPublicLinks.length)r.issue.push('Public links toward Spanish auth/pricing routes');
        if(r.suspectedSpanish.length)r.issue.push('Potential Spanish copy (manual review)');
        if(path==='/en') {
          const signIn = page.locator('a[href*="/en/login?mode=login"]').first();
          if(await signIn.count()) {
            await signIn.click({timeout:8000});
            r.checkedCTA.push({label:'Sign in',landed:new URL(page.url()).pathname,ok:new URL(page.url()).pathname==='/en/login'});
            if(new URL(page.url()).pathname!=='/en/login')r.issue.push('Sign-in CTA did not navigate to /en/login');
          } else r.issue.push('English sign-in CTA missing');
        }
        // Do not capture logged-in screens or real user data.
        const shot = slug(path)+'-'+device.name+'.png';
        if(path==='/en') await page.goto(BASE+path,{waitUntil:'domcontentloaded'});
        await page.screenshot({path:OUT+'/'+shot,animations:'disabled',fullPage:true,timeout:30000});
        r.screenshot=shot;
        r.pageErrors=errors.slice(0,10);
        if(r.pageErrors.length)r.issue.push('Browser script error');
      } catch (error) {
        r.issue.push('Browser failure: '+String(error).slice(0,300));
      } finally {
        report.routes.push(r);
        console.log((r.issue.length?'REVIEW':'PASS')+' '+r.path+' '+device.name+' '+JSON.stringify({status:r.status,lang:r.htmlLang,overflow:r.horizontalOverflow,spanish:r.suspectedSpanish.slice(0,3),links:r.brokenPublicLinks,issue:r.issue}));
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
report.summary={
  visited:report.routes.length,
  httpFailures:report.routes.filter(x=>x.status!==200).length,
  overflow:report.routes.filter(x=>x.horizontalOverflow>4).length,
  spanish:report.routes.filter(x=>x.suspectedSpanish.length).length,
  brokenPublicLinks:report.routes.filter(x=>x.brokenPublicLinks.length).length,
  runtimeErrors:report.routes.filter(x=>x.pageErrors.length).length,
};
await writeFile(OUT+'/report.json',JSON.stringify(report,null,2));
await writeFile(OUT+'/summary.md','# International English visual QA\n\n'+
  '**Scope:** real browser snapshots of public pages and anonymous previews, not authenticated pages.\n\n'+
  report.routes.map(x=>'- '+(x.issue.length?'REVIEW':'PASS')+' '+x.path+' '+x.device+' '+x.status+
    (x.issue.length?' — '+x.issue.join(' | '):'')).join('\n')+'\n\n'+
  'Authenticated registration, payment, upload and private pages require separate E2E credentials.\n');
if(report.summary.httpFailures || report.summary.overflow || report.summary.brokenPublicLinks) process.exitCode=1;

// Browser-based visual quality audit across public SEO page *templates* at mobile
// and desktop widths. Screenshot the top and footer, check horizontal overflow,
// and report headings with inadequate computed foreground/background contrast.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3100';
const OUT = process.env.QA_ARTIFACTS_DIR ?? 'qa-artifacts/seo-visual';
const WIDTHS = [375, 1440];
const ROUTES = [
  '/en',
  '/en/pdf-to-quiz',
  '/en/pdf-to-flashcards',
  '/en/study-pdf-with-ai',
  '/es/estudiar-pdf-con-ia',
  '/es-mx/estudiar-pdf-con-ia',
  '/es-co/estudiar-pdf-con-ia',
  '/es-es/estudiar-pdf-con-ia',
  '/es/guias',
  '/es/guias/como-estudiar-anatomia',
  '/es/paises',
  '/es/paises/mexico-guia-exani-ii-pdf',
  '/ia-para-estudiantes',
  '/estudiar-pdf-con-ia',
  '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-flashcards-desde-pdf',
  '/funciones/crear-mapa-mental-desde-pdf',
  '/funciones/practicar-por-tema',
  '/funciones/simulacro-examen-con-ia',
  '/convertir-pdf-en-preguntas',
  '/comparar/evaluo-vs-chatgpt',
  '/comparar/evaluo-vs-notebooklm',
  '/comparar/evaluo-vs-quizlet',
  '/pregunteros',
  '/landings/parciales',
  '/landings/resumenes',
  '/uba-xxi/parciales',
  '/como-estudiar-ingreso-unlam',
];
const report = { date: new Date().toISOString(), routes: [], failures: [], scope: 'Public SEO templates, not all generated academic URLs' };
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

function safeName(path) { return path.replace(/^\//, '').replace(/[^a-zA-Z0-9-]+/g, '-') || 'home'; }
async function analyze(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    function rgba(v) {
      const a = String(v || '').match(/rgba?\(([^)]+)\)/i);
      if (!a) return null;
      const n = a[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return n.length >= 3 ? [n[0],n[1],n[2],n[3] ?? 1] : null;
    }
    function effectiveBackground(element) {
      let el = element, bg = [255,255,255,1], layers = [];
      while (el && el instanceof Element) {
        const css = getComputedStyle(el), rgb = rgba(css.backgroundColor);
        if (rgb && rgb[3] > 0.95) { bg = rgb; break; }
        if (css.backgroundImage !== 'none') layers.push(css.backgroundImage);
        el = el.parentElement;
      }
      return { color: bg, hasGradient: layers.length > 0 };
    }
    function luminance(rgb) {
      const c = rgb.slice(0,3).map(x => {
        const s = x / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
    }
    const lowContrast = [];
    for (const el of [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6,footer h2,footer h3')]) {
      const r = el.getBoundingClientRect(), css = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || css.visibility === 'hidden' || css.display === 'none') continue;
      const fg = rgba(css.color), bg = effectiveBackground(el);
      if (!fg || bg.hasGradient) continue; // Complex backgrounds need manual screenshot review.
      const l1=luminance(fg),l2=luminance(bg.color);
      const contrast=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
      if (contrast < 3) lowContrast.push({text:el.textContent.trim().slice(0,85),tag:el.tagName,contrast:+contrast.toFixed(2),foreground:css.color,background:bg.color.slice(0,3),section:el.closest('section')?.className?.toString().slice(0,120)});
    }
    const overflow = Math.max(0, document.documentElement.scrollWidth-width);
    const offscreen = [...document.querySelectorAll('body *')].filter(el => {
      const css = getComputedStyle(el), r = el.getBoundingClientRect();
      return css.display !== 'none' && css.visibility !== 'hidden' &&
        r.width > 1 && r.height > 1 && r.right > width + 2 &&
        r.left < width && r.top < innerHeight && r.bottom > 0;
    }).slice(0,12).map(el => ({tag:el.tagName.toLowerCase(),className:String(el.className).slice(0,90),text:el.textContent.trim().slice(0,60),right:Math.round(el.getBoundingClientRect().right)}));
    const missingAlt = [...document.querySelectorAll('main img:not([alt])')].length;
    const tinyTargets = [...document.querySelectorAll('main a,main button')].filter(el => {
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
      return rect.width>0&&rect.height>0&&rect.height<28&&style.display!=='none'&&rect.top>=0&&rect.top<innerHeight;
    }).slice(0,4).map(el=>el.textContent.trim().slice(0,60));
    return {title:document.title, h1:document.querySelector('main h1')?.textContent?.trim().slice(0,100)||'', overflow, offscreen, lowContrast, missingAlt, tinyTargets, fullHeight:document.documentElement.scrollHeight};
  });
}

try {
  for (const path of ROUTES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: width===375? 812 : 900 }, deviceScaleFactor: 1, reducedMotion:'reduce' });
      const page = await context.newPage();
      const key = safeName(path)+'-'+width;
      const item = {path,width,status:null,issues:[],metrics:null};
      try {
        const response=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:90000});
        item.status=response?.status()??0;
        await page.waitForLoadState('load',{timeout:25000}).catch(()=>{});
        await page.evaluate(()=>document.fonts.ready).catch(()=>{});
        await page.waitForTimeout(220);
        item.metrics=await analyze(page);
        await page.screenshot({path:OUT+'/'+key+'-top.png',animations:'disabled',timeout:30000});
        await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
        await page.waitForTimeout(100);
        await page.screenshot({path:OUT+'/'+key+'-bottom.png',animations:'disabled',timeout:30000});
        if(item.status!==200)item.issues.push('Non-200 response '+item.status);
        if(item.metrics.overflow>4)item.issues.push('Horizontal overflow: '+item.metrics.overflow+'px '+JSON.stringify(item.metrics.offscreen));
        if(item.metrics.lowContrast.length)item.issues.push('Low contrast heading(s): '+JSON.stringify(item.metrics.lowContrast.slice(0,5)));
        if(item.metrics.missingAlt)item.issues.push('Missing img alt: '+item.metrics.missingAlt);
      }catch(error){item.issues.push('Browser error: '+String(error).slice(0,380));}
      report.routes.push(item);
      if(item.issues.length)report.failures.push(item);
      console.log((item.issues.length?'FAIL':'PASS')+' '+path+' '+width+(item.issues.length?' '+item.issues.join(' ; '):''));
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(OUT+'/report.json',JSON.stringify(report,null,2));
  await writeFile(OUT+'/summary.md', '# SEO visual audit\n\n'+
    report.routes.map(x=>'- '+(x.issues.length?'FAIL':'PASS')+' '+x.path+' ('+x.width+'px)'+
      (x.issues.length?' — '+x.issues.join(' | '):'')).join('\n')+'\n');
}
if(report.failures.length) {
  console.error('SEO visual audit issues on '+report.failures.length+' route/viewport pairs.');
  process.exitCode=1;
} else {
  console.log('SEO visual audit passed on '+report.routes.length+' route/viewport pairs.');
}

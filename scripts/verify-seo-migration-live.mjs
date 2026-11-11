#!/usr/bin/env node
/**
 * Evaluo public SEO migration QA (read-only). Node 22+, no dependencies.
 * Usage: node scripts/verify-seo-migration-live.mjs [--strict]
 * An UNVERIFIED check means network access was unavailable, not a pass.
 */
import { readFileSync } from 'node:fs';

const base = 'https://evaluoapp.com';
const oldHosts = ['evaluo.com.ar', 'www.evaluo.com.ar'];
const paths = [
  '/', '/estudiar-pdf-con-ia', '/funciones/resumir-pdf-con-ia',
  '/funciones/crear-mapa-mental-desde-pdf', '/ia-para-estudiantes',
  '/es/estudiar-pdf-con-ia', '/es-mx/estudiar-pdf-con-ia',
  '/es-co/estudiar-pdf-con-ia', '/es-es/estudiar-pdf-con-ia',
  '/en/study-pdf-with-ai', '/funciones/crear-flashcards-desde-pdf',
  '/en/pdf-to-flashcards', '/convertir-pdf-en-preguntas', '/en/pdf-to-quiz',
];
// [ruta en español, ruta en inglés, hreflang de la ruta en español]. Las flashcards de
// /funciones son la variante argentina (es-AR); la neutra es /es/flashcards-con-ia.
const pairs = [
  ['/funciones/crear-flashcards-desde-pdf', '/en/pdf-to-flashcards', 'es-AR'],
  ['/convertir-pdf-en-preguntas', '/en/pdf-to-quiz', 'es'],
];
const market = {
  'es-AR': '/estudiar-pdf-con-ia',
  es: '/es/estudiar-pdf-con-ia',
  'es-MX': '/es-mx/estudiar-pdf-con-ia',
  'es-CO': '/es-co/estudiar-pdf-con-ia',
  'es-ES': '/es-es/estudiar-pdf-con-ia',
  en: '/en/study-pdf-with-ai',
  'x-default': '/es/estudiar-pdf-con-ia',
};
const checks = [];
const pages = new Map();
const record = (name, status, detail) => checks.push({ name, status, detail });
function norm(input) {
  const url = new URL(input);
  return url.origin + (url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, ''));
}
function attr(tag, name) {
  const found = tag.match(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(["\\x27])(.*?)\\1','i'));
  return found?.[2] ?? '';
}
function links(html, rel) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0])
    .filter(tag => attr(tag,'rel').toLowerCase().split(/\s+/).includes(rel));
}
function noindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0])
    .some(tag => /^(robots|googlebot)$/i.test(attr(tag,'name')) && /\bnoindex\b/i.test(attr(tag,'content')));
}
async function checkUrl(url, label, validate) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal,
      headers: { 'User-Agent': 'Evaluo-SEOMigration-Audit-bot/1.0' } }); // "bot": la home redirige por país a visitantes humanos
    await validate(response);
  } catch (error) { record(label, 'UNVERIFIED', String(error?.message ?? error)); }
  finally { clearTimeout(timer); }
}
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
for (const host of oldHosts) {
  const rule = vercel.redirects?.find(r => r.has?.some(item => item.type === 'host' && item.value === host));
  const ok = rule?.statusCode === 301 && rule.destination === base + '/:path';
  record('301 config ' + host, ok ? 'PASS' : 'FAIL', rule?.destination ?? 'missing');
}
for (const path of paths) {
  await checkUrl(base + path, 'indexable canonical ' + path, async response => {
    if (!response.ok) { record('indexable canonical ' + path, 'FAIL', 'HTTP ' + response.status); return; }
    const html = await response.text();
    pages.set(path, html);
    const canonical = links(html,'canonical').map(tag => attr(tag,'href'));
    const ok = canonical.length === 1 && norm(canonical[0]) === norm(base + path) && !noindex(html);
    record('indexable canonical ' + path, ok ? 'PASS' : 'FAIL',
      JSON.stringify({ http:response.status, canonical, noindex:noindex(html) }));
  });
}
for (const host of oldHosts) {
  for (const path of ['/', '/estudiar-pdf-con-ia', '/funciones/resumir-pdf-con-ia', '/blog/como-estudiar-marketing']) {
    const label = 'live 301 ' + host + path;
    await checkUrl('https://' + host + path, label, async response => {
      const location = response.headers.get('location');
      const target = location ? norm(new URL(location, response.url).toString()) : '';
      record(label, response.status === 301 && target === norm(base + path) ? 'PASS' : 'FAIL',
        JSON.stringify({ status:response.status, location }));
    });
  }
}
for (const [es,en,esLang] of pairs) {
  for (const [path,lang,otherLang,other] of [[es,esLang,'en',en],[en,'en',esLang,es]]) {
    const html=pages.get(path);
    const label='reciprocal hreflang ' + path;
    if (!html) { record(label,'UNVERIFIED','page unavailable'); continue; }
    const tags=new Map(links(html,'alternate').filter(tag=>attr(tag,'hreflang')).map(tag=>[attr(tag,'hreflang'),attr(tag,'href')]));
    record(label, tags.get(lang)===base+path && tags.get(otherLang)===base+other ? 'PASS' : 'FAIL',
      JSON.stringify(Object.fromEntries(tags)));
  }
}
for (const path of Object.values(market)) {
  const html=pages.get(path);
  const label='regional hreflang ' + path;
  if (!html) { record(label,'UNVERIFIED','page unavailable'); continue; }
  const tags=new Map(links(html,'alternate').filter(tag=>attr(tag,'hreflang')).map(tag=>[attr(tag,'hreflang'),attr(tag,'href')]));
  const mismatches=Object.entries(market).filter(([lang,target])=>tags.get(lang)!==base+target);
  record(label, mismatches.length ? 'FAIL':'PASS', JSON.stringify(mismatches));
}
for (const path of ['/robots.txt','/sitemap.xml']) {
  await checkUrl(base+path, 'discovery '+path, async response => {
    const body=await response.text();
    record('discovery '+path, response.ok && body.includes(base) ? 'PASS':'FAIL',
      'HTTP '+response.status+', new-domain references='+body.includes(base));
  });
}
const counts=Object.fromEntries(['PASS','FAIL','UNVERIFIED'].map(status=>[status,checks.filter(c=>c.status===status).length]));
console.log(JSON.stringify({ checkedAt:new Date().toISOString(), base, counts, checks },null,2));
if (counts.FAIL || (process.argv.includes('--strict') && counts.UNVERIFIED)) process.exitCode=1;

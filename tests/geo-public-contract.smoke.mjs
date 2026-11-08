import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const about = read('app/(es)/sobre-evaluo/page.tsx');
const sitemap = read('app/sitemap.ts');
const footer = read('components/footer-home.tsx');
const llms = read('public/llms.txt');
const pricing = read('app/(es)/pricing/page.tsx');
const home = read('app/(es)/page.tsx');
const seo = read('lib/seo.ts');
assert.match(about, /alternates: \{ canonical: toAbsoluteUrl\(path\) \}/);
assert.match(about, /'@type': 'AboutPage'/);
assert.match(about, /buildSoftwareApplicationJsonLd\(\)/);
assert.match(seo, /'@type': 'SoftwareApplication'/);
assert.match(about, /buildFaqJsonLd\(questions\)/);
assert.match(about, /<h1\b/);
assert.match(about, /<FooterHome \/>/);
assert.match(about, /PDF o Word/);
assert.match(sitemap, /baseUrl\}\/sobre-evaluo/);
assert.match(footer, /href="\/sobre-evaluo"/);
assert.match(llms, /https:\/\/evaluoapp\.com\/sobre-evaluo/);
assert.match(llms, /https:\/\/evaluoapp\.com\/pricing/);
assert.match(pricing, /1 material PDF o Word gratis por mes/);
assert.match(pricing, /3 materiales PDF o Word por día/);
assert.match(home, /PDF o Word/);
assert.match(seo, /sameAs:/);
for (const content of [about, llms, pricing, home]) {
  assert.doesNotMatch(content, /2 PDFs?\s+cada\s+15\s+d[ií]as/i);
}
console.log('GEO public contract: about page, metadata, sitemap, llms.txt, pricing and links OK');

// llms.txt debe reflejar el plan gratuito vigente (1 material por mes) y listar las páginas EN y las comparativas.
assert.match(llms, /1 study material \(PDF or Word\) per month/);
assert.doesNotMatch(llms, /lifetime/i);
for (const path of ['/en/pdf-to-flashcards', '/en/ai-test-prep', '/en/compare/evaluo-vs-notebooklm', '/es/generador-de-examenes-con-ia']) {
  assert.ok(llms.includes('https://evaluoapp.com' + path), 'llms.txt must list ' + path);
}

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const landing=read('components/marketing/english-study-page.tsx');
const hub=read('components/marketing/study-blog-view.tsx');
const content=read('lib/english-seo-content.ts');
const sitemap=read('app/sitemap.ts');
const enBlog=read('app/(en)/en/blog/[slug]/page.tsx');
const esBlog=read('app/(es)/blog/[slug]/page.tsx');
assert.match(hub, /<FooterHome variant="full" locale=\{locale\} \/>/);
assert.match(hub, /href="\/en" aria-label="Evaluo English homepage"/);
assert.match(hub, /href="\/en\/resources"/);
assert.match(hub, /\/en\/pdf-to-quiz/);
assert.match(hub, /\/en\/pdf-to-flashcards/);
assert.match(landing, /<FooterHome locale="en" \/>/);
assert.match(landing, /\/en\/blog/);
assert.match(landing, /\/en\/ai-true-false-questions/);
assert.match(landing, /\/en\/match-concepts-with-ai/);
assert.match(content, /Can I use Evaluo in English/);
assert.doesNotMatch(content, /current product interface and account flow are primarily in Spanish/i);
assert.doesNotMatch(landing, /billing are still being localized/i);
for(const path of ['/en','/en/resources','/en/pdf-to-quiz','/en/pdf-to-flashcards','/en/study-pdf-with-ai','/en/ai-true-false-questions','/en/match-concepts-with-ai','/en/blog']){
  assert.ok(sitemap.includes(path),'Sitemap missing '+path);
}
assert.match(enBlog,/canonical: toAbsoluteUrl\(path\)/);
assert.match(enBlog,/getTranslation\('en', article\)/);
assert.match(esBlog,/getTranslation\('es', article\)/);
console.log('English SEO acquisition: copy, link architecture, locale and metadata contract verified');

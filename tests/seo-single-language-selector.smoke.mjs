import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const selector = read('components/marketing/landing-language-selector.tsx');
const blog = read('components/marketing/study-blog-view.tsx');
const publicHeader = read('components/marketing/public-site-header.tsx');
const englishHeader = read('components/marketing/english-seo-header.tsx');
const landing = read('components/marketing/english-study-page.tsx');
const practice = read('components/marketing/bilingual-practice-landings.tsx');
const sitemap = read('app/sitemap.ts');
const enBlog = read('app/(en)/en/blog/[slug]/page.tsx');
const esBlog = read('app/(es)/blog/[slug]/page.tsx');

assert.match(selector, /usePathname/);
assert.match(selector, /alternateHref/);
assert.match(selector, /SEO_EQUIVALENT_PAGES/);
for (const route of ['/en/pdf-to-quiz', '/en/pdf-to-flashcards', '/en/study-pdf-with-ai', '/en/ai-true-false-questions', '/en/match-concepts-with-ai']) {
  assert.ok(selector.includes(route), 'Missing bilingual route: ' + route);
}
assert.match(selector, /path\.startsWith\('\/blog\/'\)/);
assert.match(selector, /path\.startsWith\('\/en\/blog\/'\)/);
assert.match(selector, /href\.startsWith\('\/\/'\)/);
assert.doesNotMatch(selector, /flag: '🇺🇸'/);
assert.match(publicHeader, /LandingLanguageSelector locale="es"/);
assert.match(englishHeader, /LandingLanguageSelector locale="en"/);
assert.match(landing, /<EnglishSeoHeader alternateHref=\{hreflangAlternatePath\(page\.path, 'es'\)\} \/>/);
assert.match(blog, /alternateHref=\{translation \? getStudyBlogPath/);
assert.doesNotMatch(blog, /English version' : 'Versión en español'/);
assert.doesNotMatch(blog, /copy\.otherLocale/);
assert.doesNotMatch(practice, /english\?'Leer en español':'Read in English'/);
assert.match(practice, /<FooterHome locale=\{locale\} \/>/);
assert.match(enBlog, /getTranslation\('en', article\)/);
assert.match(esBlog, /getTranslation\('es', article\)/);
assert.match(enBlog, /alternates:/);
assert.match(esBlog, /alternates:/);
assert.match(sitemap, /languages: \{ es:/);
console.log('Single public selector, equivalent article routes, clean content and hreflang retained.');

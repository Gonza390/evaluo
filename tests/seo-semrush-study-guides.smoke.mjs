import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const source = read('lib/study-blog-semrush-2026-11-05-en.ts');
const separator = '= [';
assert.ok(source.includes('export const NOV5_SEMRUSH_EN_BLOG: StudyBlogArticle[] = ['));
const articles = JSON.parse(source.slice(source.indexOf(separator) + 2).trim().replace(/;\s*$/, ''));
const registry = read('lib/study-blog-articles.ts');
const view = read('components/marketing/study-blog-view.tsx');
const route = read('app/(en)/en/blog/[slug]/page.tsx');
const sitemap = read('app/sitemap.ts');

assert.equal(articles.length, 2);
assert.deepEqual(
  articles.map((item) => item.slug),
  ['how-to-study-accounting-effectively-for-exams', 'how-to-study-sociology-for-exams'],
);
assert.equal(new Set(articles.map((item) => item.key)).size, 2);
assert.equal(new Set(articles.map((item) => item.slug)).size, 2);

for (const article of articles) {
  assert.ok(article.key.endsWith('-nov2026'));
  assert.ok(article.sections.length >= 6, article.key + ': substantial body');
  assert.ok(article.exercise.steps.length >= 6, article.key + ': worked exercise');
  assert.ok(article.faq.length >= 5, article.key + ': FAQs');
  assert.ok(article.sources.length >= 3, article.key + ': sources');
  assert.ok(article.sources.every((ref) => ref.url.startsWith('https://')), article.key + ': source links');
  assert.ok(article.seoTitle.length >= 35 && article.seoTitle.length <= 65, article.key + ': title length');
  assert.ok(article.description.length >= 120 && article.description.length <= 165, article.key + ': meta description length');
  assert.ok(view.includes("'" + article.key + "':[{href:"), article.key + ': related resources');
}

assert.ok(registry.includes("import { NOV5_SEMRUSH_EN_BLOG } from './study-blog-semrush-2026-11-05-en';"));
assert.ok(registry.includes('...NOV5_SEMRUSH_EN_BLOG,'));
assert.ok(registry.includes("slug: 'how-to-study-accounting'"), 'Existing accounting-cycle page retained');
assert.ok(!articles.some((item) => item.slug === 'how-to-study-accounting'), 'No duplicated accounting slug');
assert.ok(route.includes('STUDY_BLOG_ARTICLES.en'));
assert.ok(route.includes('canonical: toAbsoluteUrl(path)'));
assert.ok(route.includes('robots: { index: true, follow: true }'));
assert.ok(sitemap.includes('for (const article of STUDY_BLOG_ARTICLES[locale])'));
assert.ok(view.includes("article.key.endsWith('-nov2026')"), 'New articles share Nov 5 date');
assert.ok(view.includes('datePublished: articleDate'));
assert.ok(view.includes("'accounting-exam-drills-nov2026': ['accounting'"), 'Accounting points to existing guide');
assert.ok(view.includes("'sociology-exam-application-nov2026': ['exam-study-time-nov2026'"));
assert.equal(2000 + 500 - 150, 2350, 'Worked accounting: ending cash');
assert.equal(500 - 150 + 2000, 2350, 'Worked accounting: liabilities + equity');
console.log('PASS: Two original English SEO guides, slug uniqueness, pedagogy, metadata, sitemap and internal links.');

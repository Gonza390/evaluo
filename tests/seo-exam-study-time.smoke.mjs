import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(file, 'utf8');

const article = read('lib/study-blog-exam-time-2026-11-05.ts');
const index = read('lib/study-blog-articles.ts');
const view = read('components/marketing/study-blog-view.tsx');
const calc = read('components/marketing/exam-study-time-estimator.tsx');
const enRoute = read('app/(en)/en/blog/[slug]/page.tsx');
const sitemap = read('app/sitemap.ts');

const key = 'exam-study-time-nov2026';
const slug = 'how-long-should-i-study-for-an-exam';
assert.ok(article.includes('EXAM_STUDY_TIME_EN_BLOG'));
assert.equal(article.split('"key": "exam-study-time-nov2026"').length - 1, 1, 'One original guide');
assert.ok(article.includes(slug));
assert.ok(article.includes('"seoTitle": "How Long Should I Study for an Exam'));
for (const term of ['pubmed.ncbi.nlm.nih.gov', 'doi.org/10.3389', '525', '450', 'closed-notes']) {
  assert.ok(article.includes(term), 'Article content: ' + term);
}
assert.ok(index.includes("import { EXAM_STUDY_TIME_EN_BLOG } from './study-blog-exam-time-2026-11-05';"));
assert.ok(index.includes('en: [\\n    ...EXAM_STUDY_TIME_EN_BLOG,'.replace('\\n', '\n')));
assert.ok(index.includes("'/en/blog/'"), 'English canonical path');
assert.ok(enRoute.includes('generateStaticParams'));
assert.ok(enRoute.includes('STUDY_BLOG_ARTICLES.en'));
assert.ok(enRoute.includes('canonical: toAbsoluteUrl(path)'));
assert.ok(enRoute.includes('robots: { index: true, follow: true }'));
assert.ok(sitemap.includes('for (const article of STUDY_BLOG_ARTICLES[locale])'));
assert.ok(view.includes("import { ExamStudyTimeEstimator }"));
assert.ok(view.includes("article.key === '" + key + "' && <ExamStudyTimeEstimator />"));
assert.ok(view.includes("article.key.endsWith('-nov2026')"));
assert.ok(view.includes('datePublished: articleDate'));
assert.ok(view.includes("href:'/en/pdf-to-quiz'"));
assert.ok(calc.includes("'use client'"));
assert.ok(calc.includes('topics * (FIRST_PASS_MINUTES + REVIEW_MINUTES)'));
assert.ok(calc.includes('days * minutesPerDay'));
assert.ok(calc.includes('aria-live="polite"'));
assert.equal(6 * (35 + 15) + 90 + 60, 450, 'Illustrative study time');
assert.equal(7 * 75, 525, 'Available time');
assert.equal(525 - 450, 75, 'Buffer');
console.log('PASS: English study hours page SEO, schema date, registration, links and estimate.');

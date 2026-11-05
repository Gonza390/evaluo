import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(path), 'utf8');
const source = read('lib/study-blog-2026-11-05.ts');
const main = read('lib/study-blog-articles.ts');
const sitemap = read('app/sitemap.ts');
const head = 'export const NOV5_ES_BLOG: StudyBlogArticle[] = ';
const tail = ';\n\nexport const NOV5_EN_BLOG: StudyBlogArticle[] = ';
const end = ';\n';
assert.ok(source.startsWith("import type { StudyBlogArticle }"));
const esStart = source.indexOf(head), enStart = source.indexOf(tail);
assert.ok(esStart > 0 && enStart > esStart, 'Missing localized article arrays');
const es = JSON.parse(source.slice(esStart + head.length, enStart));
const en = JSON.parse(source.slice(enStart + tail.length, source.length - end.length));
assert.equal(es.length, 4, 'Exactly two A and two B articles in Spanish');
assert.equal(en.length, 4, 'Exactly two A and two B articles in English');
assert.ok(main.includes("import { NOV5_ES_BLOG, NOV5_EN_BLOG }"));
assert.ok(main.includes('...NOV5_ES_BLOG,'));
assert.ok(main.includes('...NOV5_EN_BLOG,'));
assert.ok(main.includes('getStudyBlogPath(locale, article)'), 'Bilingual slug resolution remains active');
assert.ok(sitemap.includes('STUDY_BLOG_ARTICLES[locale]'));
const esSlugs = [
  'como-hacer-un-mapa-conceptual-para-estudiar',
  'metodo-pomodoro-para-estudiar',
  'como-estudiar-examen-tipo-test',
  'tecnica-feynman-para-estudiar',
];
const enSlugs = [
  'how-to-make-a-concept-map-for-studying',
  'pomodoro-study-method',
  'how-to-study-for-multiple-choice-exams',
  'feynman-technique-for-studying',
];
assert.deepEqual(es.map(a=>a.slug), esSlugs);
assert.deepEqual(en.map(a=>a.slug), enSlugs);
assert.equal(new Set(es.map(a=>a.key)).size, 4);
assert.deepEqual(es.map(a=>a.key), en.map(a=>a.key));
const previous = [
  read('lib/study-blog-master-expansion.ts'),
  read('lib/study-blog-expansion.ts'),
  main.slice(main.indexOf('export const STUDY_BLOG_ARTICLES:'))
].join('\n');
for (const slug of [...esSlugs, ...enSlugs]) {
  assert.equal(previous.includes('"slug": "'+slug+'"') || previous.includes("slug: '"+slug+"'"),false,
    'Slug already exists elsewhere: '+slug);
}
for (const article of [...es,...en]) {
  const text = [article.title, article.lead, article.takeaway, ...article.sections.flatMap(s=>s.paragraphs),
    article.exercise.context, ...article.exercise.steps, article.exercise.check,
    ...article.mistakes.map(m=>m.why),...article.faq.map(f=>f.answer)].join(' ');
  assert.ok(text.split(/\s+/u).length >= 460, 'Not sufficiently detailed: ' + article.slug);
  assert.ok(article.description.length>=90 && article.description.length<=205,'Description length: '+article.slug);
  assert.ok(article.sections.length>=5 && article.sections.every(s=>s.paragraphs.length>=2));
  assert.ok(article.exercise.steps.length>=5);
  assert.ok(article.mistakes.length>=3 && article.faq.length>=3);
  assert.ok(article.sources.length>=3);
  assert.ok(article.sources.every(s=>{try{return new URL(s.url).protocol==='https:';}catch{return false;}}));
  assert.ok(!/https?:\/\/getfilmina|ask-maeve\.com/i.test(text),'No competitor copy or links in editorial copy');
}
assert.ok(es[0].sections.some(s=>s.paragraphs.join(' ').includes('mapa mental')));
assert.ok(es[1].faq.some(f=>f.answer.includes('temporizador')));
assert.ok(es[2].exercise.steps.some(s=>s.includes('5/100')));
assert.ok(en[2].exercise.steps.some(s=>s.includes('20/80')));
assert.ok(es[3].exercise.steps.some(s=>s.includes('ósmosis')));
assert.ok(en[3].exercise.steps.some(s=>s.includes('opportunity')));
assert.ok(es[0].sources.some(s=>s.url.includes('cmu.edu')));
assert.ok(en[2].sources.some(s=>s.url.includes('pubmed')));
console.log('PASS Nov 5 bilingual blog: eight complete articles, original worked examples, slugs, locales, sources, and sitemap registration');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');

const site = read('lib/site.ts');
const robots = read('app/robots.ts');
const sitemap = read('app/sitemap.ts');
const blog = read('components/marketing/study-blog-view.tsx');
const originalArticles = read('lib/study-blog-2026-11-05.ts');
assert.match(site, /https:\/\/evaluoapp\.com/, 'Canonical hostname must default to new domain');
assert.doesNotMatch(site, /evaluo\.com\.ar/, 'Old host cannot be the canonical default');
assert.match(robots, /sitemap:.*SITE_URL/);
assert.match(robots, /'\/admin'/);
assert.ok(sitemap.includes('getTranslation(locale, article)'), 'Translation lookup required');
assert.match(sitemap, /languages:[\s\S]*?es:[\s\S]*?en:/, 'Sitemap needs reciprocal ES/EN alternates');
assert.match(blog, /const isNov5Article = article\.key\.endsWith\('-nov2026'\)/);
assert.match(blog, /isNov5Article \? '2026-11-05'/);
assert.match(blog, /5 de noviembre de 2026/);
assert.match(originalArticles, /NOV5_ES_BLOG/);
assert.match(originalArticles, /NOV5_EN_BLOG/);

const pages = [
  ['app/(es)/ia-para-estudiantes/page.tsx', 'path'],
  ['app/(es)/como-estudiar-ingreso-unlam/page.tsx', 'path'],
  ['app/(es)/uba-xxi/parciales/page.tsx', 'PATH'],
  ['app/(es)/funciones/crear-mapa-mental-desde-pdf/page.tsx', 'path'],
  ['app/(es)/funciones/resumir-pdf-con-ia/page.tsx', 'path'],
  ['app/(es)/estudiar-pdf-con-ia/page.tsx', 'path'],
];
const titles = new Set();
for (const [file, name] of pages) {
  const source = read(file);
  assert.match(source, /robots: \{ index: true, follow: true \}/, file);
  assert.ok(source.includes('canonical: toAbsoluteUrl(' + name + ')'), file + ': canonical missing');
  const title = source.match(/export const metadata: Metadata = \{\s*title: ['"]([^'"]+)['"]/);
  assert.ok(title, file + ': unique metadata title missing');
  assert.ok(title[1].length >= 30 && title[1].length <= 75, file + ': SEO title length');
  assert.ok(!titles.has(title[1]), file + ': duplicated SEO title');
  titles.add(title[1]);
  assert.ok(!source.includes('evaluo.com.ar'), file + ': old host referenced');
}
const student = read('components/marketing/seo-study-experiences-v2.tsx');
const unlam = read('components/marketing/unlam-editorial-guide.tsx');
const uba = read('app/(es)/uba-xxi/parciales/page.tsx');
const map = read('app/(es)/funciones/crear-mapa-mental-desde-pdf/page.tsx');
assert.ok(student.includes("href: '/blog/como-estudiar-examen-tipo-test'"));
assert.ok(student.includes("href: '/blog/metodo-pomodoro-para-estudiar'"));
assert.ok(student.includes("href: '/blog/como-hacer-un-mapa-conceptual-para-estudiar'"));
assert.ok(unlam.includes('Inscripción a la segunda instancia 2027: plazo finalizado'));
assert.ok(unlam.includes('Revisado el 5 de noviembre de 2026'));
assert.ok(unlam.includes('href="/estudiar-pdf-con-ia"'));
assert.ok(uba.includes('href="/blog/como-estudiar-examen-tipo-test"'));
assert.ok(map.includes('El mapa mental es una función Premium.'));
assert.ok(map.includes("href: '/blog/como-hacer-un-mapa-conceptual-para-estudiar'"));

console.log('PASS: SEO metadata, canonical hosts, ES/EN sitemap, structured dates and internal linking');
console.log('NOTE: source checks do not measure Google index coverage or verify live 301 redirects.');

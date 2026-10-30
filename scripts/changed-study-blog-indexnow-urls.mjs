// IndexNow selector for Evaluo's bilingual educational blog.
// Runs after an eligible main push, and also supports manual post-deploy dispatch.
// IndexNow is for Bing and participating engines; Google uses its own sitemap.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const BEFORE = process.env.GITHUB_EVENT_BEFORE?.trim();
const AFTER = process.env.GITHUB_SHA?.trim();
const FORCE_ALL = process.env.INDEXNOW_ALL_BLOG === '1';
const ROOT = 'https://evaluoapp.com';
const ARTICLES_FILE = 'lib/study-blog-articles.ts';
const BLOG_VIEW = 'components/marketing/study-blog-view.tsx';
const WORKFLOW = '.github/workflows/study-blog-indexnow.yml';
const BLOG_LOCALES = ['es', 'en'];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function urlsFor(locale, article) {
  const prefix = locale === 'es' ? '/blog/' : '/en/blog/';
  return ROOT + prefix + article.slug;
}

function hubFor(locale) {
  return ROOT + (locale === 'es' ? '/blog' : '/en/blog');
}

function parseCatalog(source) {
  // Keep source-of-truth in lib/study-blog-articles.ts; avoid hardcoding slugs
  // so future editorial releases are automatically recognized.
  const marker = '\n  en: [';
  const esStart = source.indexOf('\n  es: [');
  const enStart = source.indexOf(marker);
  const end = source.indexOf('\n  ],\n};', enStart);
  assert.ok(esStart >= 0 && enStart > esStart && end > enStart, 'Unexpected blog catalog layout.');
  const chunks = {
    es: source.slice(esStart + '\n  es: ['.length, enStart),
    en: source.slice(enStart + marker.length, end),
  };
  const catalog = {};
  for (const locale of BLOG_LOCALES) {
    const body = chunks[locale];
    const matches = [...body.matchAll(/^\s{6}key: '([^']+)',\r?\n\s{6}slug: '([^']+)',/gm)];
    assert.ok(matches.length > 0, 'Empty catalog for ' + locale);
    const items = new Map();
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : body.length;
      const slug = match[2];
      assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Invalid article slug.');
      assert.ok(!items.has(match[1]), 'Duplicate article key.');
      items.set(match[1], { slug, body: body.slice(match.index, endIndex).trim() });
    }
    catalog[locale] = items;
  }
  return catalog;
}

const currentSource = readFileSync(ARTICLES_FILE, 'utf8');
const current = parseCatalog(currentSource);
const output = new Set();
const all = () => {
  for (const locale of BLOG_LOCALES) {
    output.add(hubFor(locale));
    for (const article of current[locale].values()) output.add(urlsFor(locale, article));
  }
};

if (FORCE_ALL) {
  all();
} else {
  assert.match(BEFORE ?? '', /^[a-f0-9]{40}$/i, 'Missing before SHA.');
  assert.match(AFTER ?? '', /^[a-f0-9]{40}$/i, 'Missing after SHA.');
  const changed = new Set(git(['diff', '--name-only', BEFORE, AFTER]).split('\n').filter(Boolean));
  const added = new Set(git(['diff', '--name-only', '--diff-filter=A', BEFORE, AFTER]).split('\n').filter(Boolean));
  if (added.has(WORKFLOW)) {
    // One-time bootstrap: announce the 10 freshly published posts and two hubs.
    all();
  } else {
    if (changed.has(BLOG_VIEW) ||
        changed.has('components/marketing/study-blog-workshop.tsx') ||
        changed.has('lib/study-blog-workshop-types.ts') ||
        [...changed].some(path => /^app\/(?:\(es\)\/|\(en\)\/)?(?:en\/)?blog\/\[slug\]\/page\.tsx$/.test(path)) ||
        changed.has('app/(es)/layout.tsx') ||
        changed.has('app/(en)/layout.tsx')) {
      all();
    } else {
      for (const locale of BLOG_LOCALES) {
        const prefixes = locale === 'es' ? ['app/blog/', 'app/(es)/blog/'] : ['app/en/blog/', 'app/(en)/en/blog/'];
        if ([...changed].some(path => prefixes.some(p => path === p + 'page.tsx'))) output.add(hubFor(locale));
      }
      // Changes to detailed workshop content only affect their locale.
      for (const locale of BLOG_LOCALES) {
        if (changed.has('lib/study-blog-workshops-' + locale + '.ts')) {
          output.add(hubFor(locale));
          for (const article of current[locale].values()) output.add(urlsFor(locale, article));
        }
      }
      if (changed.has(ARTICLES_FILE)) {
        let beforeCatalog = null;
        try {
          beforeCatalog = parseCatalog(git(['show', BEFORE + ':' + ARTICLES_FILE]));
        } catch {
          // First-ever catalog publication changes all articles.
        }
        if (!beforeCatalog) all();
        else {
          for (const locale of BLOG_LOCALES) {
            let changedCount = 0;
            const previous = beforeCatalog[locale];
            for (const [key, article] of current[locale]) {
              const was = previous.get(key);
              if (!was || was.slug !== article.slug || was.body !== article.body) {
                output.add(urlsFor(locale, article));
                changedCount++;
              }
            }
            // A changed catalog (including additions or removals) updates the index hub.
            if (changedCount || previous.size !== current[locale].size) output.add(hubFor(locale));
          }
          // An edit to a shared source definition could change all rendered articles.
          if (output.size === 0) all();
        }
      }
    }
  }
}

const urls = [...output].sort();
assert.ok(urls.length <= 20, 'Too many changed blog URLs for a single IndexNow call. Split publishing into batches.');
const textOutput = urls.join(' ');
console.log(urls.length ? 'Blog canonical changes: ' + textOutput : 'No published blog content changed.');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'urls=' + textOutput + '\n');

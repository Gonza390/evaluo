// Pick only English canonical pages affected by a published main-branch change.
// No notifications on pull requests. The new workflow's very first installation
// can announce the four English pages published immediately before this change.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BEFORE = process.env.GITHUB_EVENT_BEFORE;
const AFTER = process.env.GITHUB_SHA;
assert.ok(/^[a-f0-9]{40}$/i.test(BEFORE ?? ''), 'Expected Github push before SHA.');
assert.ok(/^[a-f0-9]{40}$/i.test(AFTER ?? ''), 'Expected Github push after SHA.');

const diff = (args) => execFileSync('git', ['diff', ...args, BEFORE, AFTER], { encoding: 'utf8' })
  .split('\n').map(s => s.trim()).filter(Boolean);

const changed = new Set(diff(['--name-only']));
const added = new Set(diff(['--name-only', '--diff-filter=A']));
const routes = new Set();

const all = [
  'https://evaluoapp.com/en',
  'https://evaluoapp.com/en/pdf-to-quiz',
  'https://evaluoapp.com/en/pdf-to-flashcards',
  'https://evaluoapp.com/en/study-pdf-with-ai',
];

// This workflow was installed shortly after the initial English launch.
// Announce the four *newly published* pages once on first installation.
if (added.has('.github/workflows/english-indexnow.yml')) {
  all.forEach(url => routes.add(url));
} else if ([
  'lib/english-seo-content.ts',
  'lib/english-seo-metadata.ts',
  'components/marketing/english-study-page.tsx',
  'app/(en)/layout.tsx',
].some(path => changed.has(path))) {
  all.forEach(url => routes.add(url));
} else {
  const mapping = [
    ['app/(en)/en/page.tsx', all[0]],
    ['app/(en)/en/pdf-to-quiz/', all[1]],
    ['app/(en)/en/pdf-to-flashcards/', all[2]],
    ['app/(en)/en/study-pdf-with-ai/', all[3]],
  ];
  for (const file of changed) {
    for (const [path, url] of mapping) {
      if (file === path || (path.endsWith('/') && file.startsWith(path))) {
        routes.add(url);
      }
    }
  }
}
const urls = [...routes];
assert.ok(urls.length <= 4);
const output = urls.join(' ');
console.log(urls.length ? 'English canonical URL changes: ' + output : 'No English page content change; no IndexNow notification.');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'urls=' + output + '\n');

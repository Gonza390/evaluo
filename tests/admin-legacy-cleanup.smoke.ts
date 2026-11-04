import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const retired = new Set([
  "app/(es)/administrador/actions.ts",
  "app/(es)/administrador/biblioteca-actions.ts",
  "app/(es)/administrador/estructura-actions.ts",
  "app/(es)/administrador/mail-actions.ts",
  "app/(es)/administrador/performance-actions.ts",
  "app/(es)/administrador/cached-performance-actions.ts",
  "app/(es)/administrador/shared-actions.ts",
  "app/(es)/administrador/referrals-actions.ts",
  "app/(es)/administrador/ai-key-health-actions.ts",
  "app/(es)/administrador/ai-cost-data.ts",
  "app/(es)/administrador/import-helpers.ts",
  "app/(es)/administrador/material-analysis.ts",
  "app/(es)/administrador/materia-hierarchy-actions.ts"
]);
const ignored = new Set(['.git', '.next', '.vercel', 'node_modules', 'coverage',
  'out', 'output', 'tmp', 'public', 'supabase', 'docs', 'backups', 'video']);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mdx']);
const testPath = 'tests/admin-legacy-cleanup.smoke.ts';
const errors = [];
let sourceFiles = 0;

for (const modulePath of retired) {
  assert.ok(!existsSync(join(root, modulePath)),
    'Old administrator module still present: ' + modulePath);
}

function checkFile(absolute) {
  const path = relative(root, absolute).replaceAll('\\', '/');
  if (path === testPath) return;
  ++sourceFiles;
  const body = readFileSync(absolute, 'utf8');
  // Scan static imports, re-exports, literal dynamic imports and require(),
  // plus relative paths in other quoted expressions. Do not rely on filename
  // substrings: Solicitudes has its own active ./actions.ts.
  for (const match of body.matchAll(/['"`]((?:@\/|\.\.?\/)[^'"`\n]+)['"`]/g)) {
    const specifier = match[1];
    const base = specifier.startsWith('@/')
      ? specifier.slice(2)
      : normalize(join(dirname(path), specifier)).replaceAll('\\', '/');
    for (const candidate of [base, base + '.ts', base + '.tsx', base + '/index.ts']) {
      if (retired.has(candidate)) {
        errors.push(path + ': reference to retired administrator module ' + candidate);
      }
    }
  }
  // Old absolute source paths in smoke tests can silently retain obsolete
  // expectations even when the main app compiles.
  for (const modulePath of retired) {
    if (body.includes(modulePath)) {
      errors.push(path + ': literal reference to retired module ' + modulePath);
    }
  }
}
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) walk(join(folder, entry.name));
      continue;
    }
    if (entry.isFile() && extensions.has(extname(entry.name))) {
      checkFile(join(folder, entry.name));
    }
  }
}
walk(root);
assert.deepEqual([...new Set(errors)], [], 'Dangling references to old administrator modules');
console.log('[admin-legacy] Verified ' + retired.size + ' removed modules across ' +
  sourceFiles + ' source files; no dangling imports or test references.');

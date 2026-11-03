import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative } from 'node:path';

const blockedRoutes = [
  ['/demo/carrera-sugerencias', 'app/(es)/demo/carrera-sugerencias/page.tsx'],
  ['/demo/empezar-preview', 'app/(es)/demo/empezar-preview/page.tsx'],
  ['/demo/material-upload-error', 'app/(es)/demo/material-upload-error/page.tsx'],
  ['/preview/fecha-examen-plan', 'app/(es)/preview/fecha-examen-plan/page.tsx'],
  ['/preview/mis-errores', 'app/(es)/preview/mis-errores/page.tsx'],
  ['/preview/procesando-pdf', 'app/(es)/preview/procesando-pdf/page.tsx'],
  ['/preview/resultado-practica-retencion', 'app/(es)/preview/resultado-practica-retencion/page.tsx'],
];

// Keep these active: marketing /demo/material-estudio, redirect /preview/primer-pdf,
// responsive QA /preview/progreso-pdf + /preview/mis-errores/explicacion,
// test coverage /preview/resultado-simulador, environment-gated previews.
const removedModules = [
  "components/demo/career-duplicate-suggestions-demo.tsx",
  "components/preview/exam-date-plan-preview.tsx",
  "components/preview/study-errors-preview.tsx",
  "components/preview/pdf-processing-preview.tsx",
  "components/preview/pdf-processing-material-preview.tsx",
  "components/preview/pdf-processing-sample-study.ts"
];

const reviewOnly = [
  'public/pdf.worker.min.mjs',
];

// Starter assets were removed from public/. Prevent accidental broken references
// when restoring old layouts or importing components from earlier versions.
const removedStarterAssets = [
  'public/placeholder-logo.png',
  'public/placeholder-logo.svg',
  'public/placeholder-user.jpg',
  'public/placeholder.jpg',
  'public/placeholder.svg',
];

const ignored = new Set(['.git', '.next', 'node_modules', '.turbo', '.lighthouseci', 'coverage', 'public', 'docs', 'video', 'supabase', 'tmp']);
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.css', '.mdx']);
const sources = [];
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) visit(join(dir, entry.name));
      continue;
    }
    if (!entry.isFile() || !extensions.has(extname(entry.name))) continue;
    const path = relative('.', join(dir, entry.name)).replaceAll('\\', '/');
    if (path === 'scripts/audit-legacy-routes.mjs') continue;
    if (statSync(join(dir, entry.name)).size > 300_000) continue;
    sources.push({ path, contents: readFileSync(join(dir, entry.name), 'utf8') });
  }
}
visit('.');

function references(token, sourcePath, checkRoute = false) {
  return sources.filter(({ path, contents }) => {
    if (path === sourcePath) return false;
    let index = contents.indexOf(token);
    while (index !== -1) {
      const after = contents[index + token.length] || '';
      if (!checkRoute || !/[A-Za-z0-9/_-]/.test(after)) return true;
      index = contents.indexOf(token, index + token.length);
    }
    return false;
  }).map(({ path }) => path);
}
let invalid = 0;
for (const assetPath of removedStarterAssets) {
  const token = '/' + assetPath.slice('public/'.length);
  const refPaths = references(token, assetPath);
  if (refPaths.length) {
    invalid++;
    console.error('[legacy cleanup] Deleted starter asset still referenced: ' + token + ' -> ' + refPaths.join(', '));
  }
}
for (const [route, sourcePath] of blockedRoutes) {
  const refPaths = [...new Set([
    ...references(route, sourcePath, true),
    ...references(sourcePath, sourcePath),
  ])];
  if (refPaths.length) {
    invalid++;
    console.error('[legacy cleanup] Still referenced: ' + route + ' -> ' + refPaths.join(', '));
  } else {
    console.log('[legacy cleanup] No active source references: ' + route);
  }
}
for (const path of removedModules) {
  const basename = path.split('/').at(-1).replace(/\.[^.]+$/, '');
  // Check complete quoted module specifiers, not substrings of similar names.
  // For example, real-study-errors-preview is NOT study-errors-preview.
  const refPaths = sources
    .filter(({ path: sourcePath, contents }) =>
      sourcePath !== path
      && [...contents.matchAll(/['"`]([^'"`\n]+)['"`]/g)].some((match) => {
        const specifier = match[1];
        return specifier.endsWith('/' + basename)
          || specifier.endsWith('/' + basename + '.tsx')
          || specifier.endsWith('/' + basename + '.ts');
      })
    )
    .map(({ path: sourcePath }) => sourcePath);
  if (refPaths.length) {
    invalid++;
    console.error('[legacy cleanup] Removed component still referenced: ' + path + ' -> ' + refPaths.join(', '));
  } else {
    console.log('[legacy cleanup] No active source references to deleted component: ' + path);
  }
}

for (const path of reviewOnly) {
  const publicFile = path.startsWith('public/');
  const token = publicFile ? '/' + path.slice('public/'.length) : path.replace(/\.[^.]+$/, '');
  const refPaths = references(token, path);
  console.log('[legacy review] ' + path + ': ' + (refPaths.length ? refPaths.join(', ') : 'NO SOURCE REFERENCE FOUND (verify dynamic usage before deleting)'));
}

// Candidate inventory only: imports can be assembled dynamically, so never auto-delete.
const sourceByPath = new Map(sources.map((entry) => [entry.path, entry]));
const importedPaths = new Set();
for (const { path, contents } of sources) {
  for (const match of contents.matchAll(/['"`]((?:@\/|\.\.?\/)[^'"`\n]+)['"`]/g)) {
    const importPath = match[1].startsWith('@/') ?
      match[1].slice(2) :
      normalize(join(dirname(path), match[1])).replaceAll('\\', '/');
    for (const candidate of [importPath, importPath + '.ts', importPath + '.tsx', importPath + '/index.ts', importPath + '/index.tsx']) {
      if (candidate !== path && sourceByPath.has(candidate)) importedPaths.add(candidate);
    }
  }
}
const possibleOrphans = sources
  .filter(({ path }) => path.startsWith('components/') && /\.tsx?$/.test(path) && !importedPaths.has(path))
  .sort((a, b) => b.contents.length - a.contents.length)
  .slice(0, 20);
console.log('[legacy review] Top 20 components without a static local import (not proof of disuse):');
for (const candidate of possibleOrphans) {
  console.log('[legacy review] candidate: ' + candidate.path + ' (' + candidate.contents.length + ' bytes)');
}

if (invalid) process.exitCode = 1;

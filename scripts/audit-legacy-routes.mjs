import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

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
const reviewOnly = [
  'components/demo/career-duplicate-suggestions-demo.tsx',
  'components/preview/exam-date-plan-preview.tsx',
  'components/preview/study-errors-preview.tsx',
  'components/preview/pdf-processing-preview.tsx',
  'components/preview/pdf-processing-material-preview.tsx',
  'components/preview/pdf-processing-sample-study.ts',
  'public/pdf.worker.min.mjs',
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
for (const path of reviewOnly) {
  const publicFile = path.startsWith('public/');
  const token = publicFile ? '/' + path.slice('public/'.length) : path.replace(/\.[^.]+$/, '');
  const refPaths = references(token, path);
  console.log('[legacy review] ' + path + ': ' + (refPaths.length ? refPaths.join(', ') : 'NO SOURCE REFERENCE FOUND (verify dynamic usage before deleting)'));
}
if (invalid) process.exitCode = 1;

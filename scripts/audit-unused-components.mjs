import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative } from 'node:path';

// Conservative inventory only. Next's file-system routes, runtime dynamic imports,
// external/public URLs, code generation and non-source references may escape this scan.
// Do not remove a component solely because it appears in this report.
const ignored = new Set(['.git', '.next', 'node_modules', '.vercel', 'tmp', 'output', 'out', 'coverage', '.lighthouseci', 'public', 'supabase', 'docs', 'backups']);
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mdx']);
const entries = [];
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const full = join(folder, entry.name);
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) walk(full);
    } else if (entry.isFile() && exts.has(extname(entry.name))) {
      entries.push({ path: relative('.', full).replaceAll('\\', '/'), body: readFileSync(full, 'utf8') });
    }
  }
}
walk('.');
const byPath = new Set(entries.map((item) => item.path));
const imported = new Map();
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx'];
function recordImport(importer, specifier) {
  if (!specifier.startsWith('@/') && !specifier.startsWith('./') && !specifier.startsWith('../')) return;
  const base = specifier.startsWith('@/')
    ? specifier.slice(2) : normalize(join(dirname(importer), specifier)).replaceAll('\\', '/');
  for (const suffix of extensions) {
    const target = base + suffix;
    if (!byPath.has(target) || target === importer) continue;
    const callers = imported.get(target) ?? new Set();
    callers.add(importer);
    imported.set(target, callers);
  }
}
for (const { path, body } of entries) {
  // Includes static imports/exports, dynamic imports, and require() with literal paths.
  // Resolving all quoted local specifiers is intentionally more conservative than
  // trying to parse only one style of import.
  for (const match of body.matchAll(/['"`']((?:@\/|\.\.?\/)[^'"`\n]+)['"`']/g)) {
    recordImport(path, match[1]);
  }
}
const components = entries.filter(({ path }) => path.startsWith('components/') && /\.tsx?$/.test(path));
const candidates = [];
for (const component of components) {
  if (imported.has(component.path)) continue;
  const basename = component.path.split('/').at(-1).replace(/\.tsx?$/, '');
  const otherMentions = entries.filter(({ path, body }) => path !== component.path
    && (body.includes(component.path) || body.includes('@/'.concat(component.path))
      || (basename.length >= 7 && body.includes(basename))));
  candidates.push({ path: component.path, bytes: Buffer.byteLength(component.body), mentions: otherMentions.map((item) => item.path) });
}
const strong = candidates.filter((item) => item.mentions.length === 0).sort((a,b) => b.bytes-a.bytes);
const ambiguous = candidates.filter((item) => item.mentions.length > 0).sort((a,b) => b.bytes-a.bytes);
console.log('[unused-components] Scanned ' + entries.length + ' source files; ' + components.length + ' components');
console.log('[unused-components] No local import and no matching code mention: ' + strong.length);
for (const item of strong) console.log('[unused-components] REVIEW ' + item.path + ' (' + item.bytes + ' bytes)');
console.log('[unused-components] No local import, but other source references exist: ' + ambiguous.length);
for (const item of ambiguous.slice(0, 35)) console.log('[unused-components] HOLD ' + item.path + ' referenced by ' + item.mentions.slice(0, 4).join(', '));
console.log('[unused-components] Review only; no files were removed.');

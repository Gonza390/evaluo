// Audit production-facing source and assets for hardcoded old-domain links.
// Only redirect declarations should retain absolute URLs to the legacy host.
// Run with: node scripts/audit-domain-migration.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIRS = ['app', 'components', 'lib', 'public', 'scripts'];
const ROOT_FILES = ['proxy.ts', 'next.config.mjs', 'vercel.json'];
const EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.htm',
  '.xml', '.txt', '.webmanifest', '.svg', '.css',
]);
const IGNORED_FOLDERS = new Set(['node_modules', '.next', '.git', '.vercel', 'coverage', '.lighthouseci', 'artifacts']);
const LEGACY_URL = /https?:\/\/(?:www\.)?evaluo\.com\.ar(?=[\/?#"'\\\s<]|$)/g;
// Both old hosts must remain here as redirect conditions and are not a migration leak.
const ALLOWED_FILES = new Set(['vercel.json']);
const found = [];
let filesRead = 0;

function scanFile(relative) {
  const ext = path.extname(relative).toLowerCase();
  if (!EXTENSIONS.has(ext) || ALLOWED_FILES.has(relative)) return;
  const content = readFileSync(path.join(ROOT, relative), 'utf8');
  filesRead += 1;
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    LEGACY_URL.lastIndex = 0;
    if (LEGACY_URL.test(lines[i])) found.push({ path: relative, line: i + 1, excerpt: lines[i].trim().slice(0, 170) });
  }
}
function visit(relative) {
  const absolute = path.join(ROOT, relative);
  if (!existsSync(absolute)) return;
  const st = statSync(absolute);
  if (st.isFile()) return scanFile(relative);
  if (!st.isDirectory()) return;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_FOLDERS.has(entry.name)) continue;
    visit(path.join(relative, entry.name));
  }
}
for (const directory of SOURCE_DIRS) visit(directory);
for (const file of ROOT_FILES) visit(file);
if (found.length) {
  console.error(`Found ${found.length} hardcoded legacy URLs across ${filesRead} source files:\n`);
  for (const item of found.slice(0, 100)) console.error(`${item.path}:${item.line}: ${item.excerpt}`);
  if (found.length > 100) console.error(`...and ${found.length - 100} more results`);
  console.error('Move URL creation to lib/site.ts; preserve old URLs only as domain redirect conditions.');
  process.exitCode = 1;
} else {
  console.log(`Domain migration source audit passed (${filesRead} files). Legacy URLs are only permitted in vercel.json redirect rules.`);
}

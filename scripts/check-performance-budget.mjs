import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nextDir = join(root, '.next');
const budgetPath = join(root, 'performance-budget.json');

if (!existsSync(join(nextDir, 'BUILD_ID'))) {
  throw new Error('Falta .next/BUILD_ID. Ejecutá npm run build antes del presupuesto.');
}

const config = JSON.parse(readFileSync(budgetPath, 'utf8'));
const buildManifest = JSON.parse(readFileSync(join(nextDir, 'build-manifest.json'), 'utf8'));
const sharedFiles = [
  ...(buildManifest.polyfillFiles ?? []),
  ...(buildManifest.rootMainFiles ?? []),
];

function readRouteManifest(appPath) {
  const manifestPath = join(nextDir, 'server', 'app', `${appPath}_client-reference-manifest.js`);
  const source = readFileSync(manifestPath, 'utf8');
  const assignment = source.indexOf('= ', source.indexOf('__RSC_MANIFEST['));
  const jsonStart = assignment + 2;
  const jsonEnd = source.lastIndexOf(';');
  return JSON.parse(source.slice(jsonStart, jsonEnd));
}

function gzipBytes(file) {
  const absolutePath = join(
    nextDir,
    file.startsWith('static/') ? file : file.replace(/^\/_next\//, '')
  );
  return gzipSync(readFileSync(absolutePath)).byteLength;
}

function routeSize(appPath) {
  const manifest = readRouteManifest(appPath);
  const files = new Set(sharedFiles);

  for (const routeFiles of Object.values(manifest.entryJSFiles ?? {})) {
    for (const file of routeFiles) files.add(file);
  }
  for (const entries of Object.values(manifest.entryCSSFiles ?? {})) {
    for (const entry of entries) files.add(entry.path);
  }

  return [...files].reduce((total, file) => total + gzipBytes(file), 0);
}

const failures = [];
console.log('Performance budget (assets iniciales, gzip)');

for (const route of config.routes) {
  const bytes = routeSize(route.appPath);
  const kilobytes = bytes / 1024;
  const passed = kilobytes <= route.maxGzipKb;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${route.label.padEnd(22)} ${kilobytes.toFixed(1)} KB / ${route.maxGzipKb} KB`
  );
  if (!passed) failures.push(`${route.label}: ${kilobytes.toFixed(1)} KB > ${route.maxGzipKb} KB`);
}

if (failures.length > 0) {
  console.error(`\nRegresión de performance:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
}

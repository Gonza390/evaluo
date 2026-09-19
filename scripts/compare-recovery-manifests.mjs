import { readFile } from 'node:fs/promises';

const [sourcePath, targetPath] = process.argv.slice(2);
if (!sourcePath || !targetPath) {
  console.error('Uso: node scripts/compare-recovery-manifests.mjs <origen.json> <restaurado.json>');
  process.exit(1);
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const target = JSON.parse(await readFile(targetPath, 'utf8'));

const checks = [];

function compare(label, expected, actual) {
  const ok = expected === actual;
  checks.push({ label, expected, actual, ok });
}

compare('auth.users', source.auth?.users, target.auth?.users);

for (const table of Object.keys(source.tables ?? {}).sort()) {
  compare(`table:${table}`, source.tables?.[table], target.tables?.[table]);
}

compare(
  'storage:biblioteca:objectCount',
  source.storage?.biblioteca?.objectCount,
  target.storage?.biblioteca?.objectCount
);
compare(
  'storage:biblioteca:totalBytes',
  source.storage?.biblioteca?.totalBytes,
  target.storage?.biblioteca?.totalBytes
);
compare(
  'storage:biblioteca:sha256',
  source.storage?.biblioteca?.sha256,
  target.storage?.biblioteca?.sha256
);

for (const check of checks) {
  console.log(
    `${check.ok ? 'PASS' : 'FAIL'} ${check.label}: esperado=${check.expected} actual=${check.actual}`
  );
}

if (checks.some((check) => !check.ok)) {
  process.exit(1);
}

console.log('PASS: la huella crítica de recuperación coincide.');

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../tests/smoke-manifest.json', import.meta.url)));
const failures = [];

for (const { file, alias } of manifest) {
  const args = [
    ...(alias ? ['--import', './tests/alias-loader.mjs'] : []),
    '--experimental-strip-types',
    file,
  ];
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    failures.push({ file, exitCode: result.status ?? 1 });
    console.error(`Smoke falló: ${file}`);
  }
}
if (failures.length) {
  console.error('\nPruebas fallidas: '+ failures.length + ' de ' + manifest.length);
  for (const failure of failures) console.error(' - ' + failure.file + ' (exit ' + failure.exitCode + ')');
  process.exit(1);
}
console.log('Todos los ' + manifest.length + ' smoke tests pasaron.');

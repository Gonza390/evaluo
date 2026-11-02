import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../tests/smoke-manifest.json', import.meta.url)));

for (const { file, alias } of manifest) {
  const args = [
    ...(alias ? ['--import', './tests/alias-loader.mjs'] : []),
    '--experimental-strip-types',
    file,
  ];
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Smoke falló: ${file}`);
    process.exit(result.status ?? 1);
  }
}

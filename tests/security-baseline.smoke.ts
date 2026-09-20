import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const ciSource = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');

function numericVersion(value: string | undefined) {
  return (value ?? '').replace(/^[^0-9]*/, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function atLeast(value: string | undefined, minimum: [number, number, number]) {
  const current = numericVersion(value);
  for (let index = 0; index < minimum.length; index += 1) {
    if ((current[index] ?? 0) > minimum[index]) return true;
    if ((current[index] ?? 0) < minimum[index]) return false;
  }
  return true;
}

assert.ok(atLeast(packageJson.dependencies?.next, [16, 3, 5]), 'Next.js debe mantenerse en 16.3.5 o superior.');
assert.ok(atLeast(packageJson.dependencies?.sharp, [0, 35, 4]), 'Sharp debe mantenerse en 0.35.4 o superior.');
assert.ok(
  atLeast(packageJson.devDependencies?.['eslint-config-next'], [16, 3, 5]),
  'eslint-config-next debe acompañar el parche de Next.js.'
);

for (const requiredStep of [
  'npm audit --audit-level=high',
  'npx tsc --noEmit',
  'npm run lint',
  'npm test',
  'npm run build',
  'npm run performance:budget',
  'npx --yes @lhci/cli@0.15.1 autorun',
]) {
  assert.ok(ciSource.includes(requiredStep), `CI debe ejecutar: ${requiredStep}`);
}

console.log('Security baseline smoke tests passed.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isInternalQueueRequestAuthorized } from '../lib/student-materials/job-auth.ts';

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

const previousInternalQueueSecret = process.env.INTERNAL_QUEUE_SECRET;
const previousCronSecret = process.env.CRON_SECRET;

process.env.INTERNAL_QUEUE_SECRET = 'internal-queue-test-secret';
process.env.CRON_SECRET = 'cron-test-secret';

const authRequest = (secret: string) =>
  new Request('https://evaluo.com.ar/api/internal/test', {
    headers: { authorization: `Bearer ${secret}` },
  });

assert.equal(
  isInternalQueueRequestAuthorized(authRequest('internal-queue-test-secret')),
  true,
  'Los requests internos deben aceptar INTERNAL_QUEUE_SECRET.'
);
assert.equal(
  isInternalQueueRequestAuthorized(authRequest('cron-test-secret')),
  true,
  'Los cron de Vercel deben aceptar CRON_SECRET aunque INTERNAL_QUEUE_SECRET también exista.'
);
assert.equal(
  isInternalQueueRequestAuthorized(authRequest('secret-incorrecto')),
  false,
  'No se deben aceptar secretos desconocidos.'
);

if (previousInternalQueueSecret === undefined) delete process.env.INTERNAL_QUEUE_SECRET;
else process.env.INTERNAL_QUEUE_SECRET = previousInternalQueueSecret;
if (previousCronSecret === undefined) delete process.env.CRON_SECRET;
else process.env.CRON_SECRET = previousCronSecret;

console.log('Security baseline smoke tests passed.');

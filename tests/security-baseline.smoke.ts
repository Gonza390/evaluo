import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isInternalQueueRequestAuthorized } from '../lib/student-materials/job-auth.ts';
import { isTerminalAuthSessionError } from '../lib/auth-session-errors.ts';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const ciSource = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');

function numericVersion(value: string | undefined) {
  return (value ?? '')
    .replace(/^[^0-9]*/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

function atLeast(value: string | undefined, minimum: [number, number, number]) {
  const current = numericVersion(value);
  for (let index = 0; index < minimum.length; index += 1) {
    if ((current[index] ?? 0) > minimum[index]) return true;
    if ((current[index] ?? 0) < minimum[index]) return false;
  }
  return true;
}

assert.ok(
  atLeast(packageJson.dependencies?.next, [16, 3, 5]),
  'Next.js debe mantenerse en 16.3.5 o superior.'
);
assert.ok(
  atLeast(packageJson.dependencies?.sharp, [0, 35, 4]),
  'Sharp debe mantenerse en 0.35.4 o superior.'
);
// Solo exigir el parche de la configuración de Next si el proyecto la utiliza.
// La configuración propia de ESLint no necesita instalar eslint-config-next.
if (packageJson.devDependencies?.['eslint-config-next']) {
  assert.ok(
    atLeast(packageJson.devDependencies['eslint-config-next'], [16, 3, 5]),
    'Si se instala eslint-config-next, debe acompañar el parche de Next.js.'
  );
}

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

// La vista de preguntas fue revocada a anon/authenticated: no restaurar el GRANT
// para solucionar errores 401 de versiones antiguas. Las rutas nuevas deben
// usar las RPC públicas agregadas o lecturas privadas con autorización.
// Los SQL de migraciones no son rutas de aplicación y quedan fuera de este control.
const unsafeQuestionBankReads: string[] = [];
const unsafeViewRead = /\\.from\\s*\\(\\s*['"`]preguntas_banco_public['"`]\\s*\\)|\\/rest\\/v1\\/preguntas_banco_public/g;
function auditApplicationSource(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      auditApplicationSource(path);
      continue;
    }
    if (!/\\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) continue;
    const text = readFileSync(path, 'utf8');
    if (unsafeViewRead.test(text)) unsafeQuestionBankReads.push(path);
    unsafeViewRead.lastIndex = 0;
  }
}
for (const root of ['app', 'components', 'lib', 'services', 'hooks', 'src']) {
  try { auditApplicationSource(resolve(root)); }
  catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error &&
          error.code === 'ENOENT')) throw error;
  }
}
assert.deepEqual(
  unsafeQuestionBankReads, [],
  'Nunca consultar directamente preguntas_banco_public: se revocó por seguridad. Usar RPC o acceso privado verificado.'
);

// Un refresh inválido es terminal y debe limpiar únicamente las cookies de Auth.
// Los problemas de red no deben cerrar sesiones válidas ni afectar otros dispositivos.
assert.equal(isTerminalAuthSessionError({ code: 'session_not_found' }), true);
assert.equal(isTerminalAuthSessionError({ code: 'refresh_token_not_found' }), true);
assert.equal(isTerminalAuthSessionError({ message: 'Invalid Refresh Token: Refresh Token Not Found' }), true);
assert.equal(isTerminalAuthSessionError({ message: 'fetch failed' }), false);
const proxySource = readFileSync(resolve('proxy.ts'), 'utf8');
assert.match(proxySource, /isTerminalAuthSessionError\\(authError\\)/);
assert.match(proxySource, /response\\.cookies\\.delete\\(cookie\\.name\\)/);
const idleGuardSource = readFileSync(resolve('components/SessionIdleGuard.tsx'), 'utf8');
assert.match(idleGuardSource, /supabase\\.auth\\.signOut\\(\\{\\s*scope:\\s*'local'\\s*\\}\\)/);

await import('./proxy-home.smoke.ts');

console.log('Security baseline smoke tests passed.');

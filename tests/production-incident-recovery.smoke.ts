import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSingleFlightPolling } from '../lib/student-materials/processing-polling.ts';
import { isTerminalAuthSessionError } from '../lib/auth-session-errors.ts';

// El polling nunca debe lanzar dos Server Actions simultáneas.
const gate = createSingleFlightPolling<number>();
let finish!: (value: number) => void;
let calls = 0;
const slow = gate.run(() => {
  calls += 1;
  return new Promise<number>((resolve) => { finish = resolve; });
});
assert.deepEqual(await gate.run(async () => { calls += 1; return 99; }), { kind: 'busy' });
assert.equal(calls, 1);
finish(42);
assert.deepEqual(await slow, { kind: 'success', value: 42 });

assert.deepEqual(
  await gate.run(async () => { throw new Error('An unexpected response was received from the server.'); }),
  { kind: 'error', consecutiveFailures: 1 },
);
assert.deepEqual(
  await gate.run(async () => { throw new Error('temporarily unavailable'); }),
  { kind: 'error', consecutiveFailures: 2 },
);
assert.deepEqual(await gate.run(async () => 200), { kind: 'success', value: 200 });
assert.deepEqual(
  await gate.run(async () => { throw new Error('failed'); }),
  { kind: 'error', consecutiveFailures: 1 },
);

for (const invalid of [
  { code: 'session_not_found' },
  { code: 'refresh_token_not_found' },
  { code: 'invalid_refresh_token' },
  { message: 'Session not found' },
]) assert.equal(isTerminalAuthSessionError(invalid), true);
for (const valid of [
  { code: 'network_error', message: 'fetch failed' },
  { status: 503, message: 'Service unavailable' },
  null,
]) assert.equal(isTerminalAuthSessionError(valid), false);

const pdfFirst = readFileSync('components/dashboard/pdf-first-upload-shell.tsx', 'utf8');
const quickPdf = readFileSync('components/dashboard/quick-pdf-upload.tsx', 'utf8');
for (const client of [pdfFirst, quickPdf]) {
  assert.match(client, /createSingleFlightPolling/);
  assert.match(client, /outcome\.kind === 'error'/);
  assert.match(client, /window\.setInterval/);
  assert.doesNotMatch(client, /const state = await getStudentMaterialProcessingStateAction\(/);
}
assert.match(pdfFirst, /processStudentMaterialAction\(result\.materialId\)\.catch/);
assert.match(quickPdf, /processStudentMaterialAction\(result\.materialId\)\.catch/);

for (const client of [pdfFirst, quickPdf]) {
  assert.match(client, /fetchStudentMaterialProcessingState/);
}
const stateRoute = readFileSync('app/api/student-materials/[id]/processing-state/route.ts', 'utf8');
assert.match(stateRoute, /getStudentMaterialProcessingStateAction\(id\)/);
assert.match(stateRoute, /private, no-store/);
const stateClient = readFileSync('lib/student-materials/processing-state-client.ts', 'utf8');
assert.match(stateClient, /credentials: 'same-origin'/);
assert.match(stateClient, /cache: 'no-store'/);
const stateAction = readFileSync('app/(es)/dashboard/materiales/actions.ts', 'utf8');
assert.match(stateAction, /const user = await requireAuthenticatedUser\(\)/);
assert.match(stateAction, /\.eq\('user_id', user.id\)/);

const proxy = readFileSync('proxy.ts', 'utf8');
const guard = readFileSync('components/SessionIdleGuard.tsx', 'utf8');
const callback = readFileSync('app/(es)/auth/callback/route.ts', 'utf8');
assert.match(proxy, /isTerminalAuthSessionError\(authError\)/);
assert.match(proxy, /response\.cookies\.delete/);
assert.match(guard, /sessionCheckInFlightRef/);
assert.match(guard, /event === 'SIGNED_OUT'/);
assert.match(guard, /auth-expired/);
assert.match(callback, /getAll\(\)/);
assert.match(callback, /setAll\(cookiesToSet\)/);
assert.match(callback, /redirectWithSessionCookies/);

const worker = readFileSync('app/api/internal/student-material-jobs/route.ts', 'utf8');
assert.match(worker, /isInternalQueueRequestAuthorized\(request\)/);
assert.match(worker, /MAX_JOBS_PER_DISPATCH = 3/);
assert.match(worker, /DISPATCH_BUDGET_MS = 90_000/);
assert.match(worker, /jobs_processed: jobsProcessed/);

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  crons: Array<{ path: string; schedule: string }>;
};
const workerCrons = vercel.crons.filter((cron) =>
  cron.path.startsWith('/api/internal/student-material-jobs')
);
assert.equal(workerCrons.length, 2);
assert.deepEqual(workerCrons.map((cron) => cron.schedule), ['30 8 * * *', '0 12 * * *']);

console.log('Dashboard polling, auth expiration and PDF cron recovery smoke tests passed.');

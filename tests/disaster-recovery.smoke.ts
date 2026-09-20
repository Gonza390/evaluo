import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestSource = readFileSync(resolve('scripts/recovery-manifest.mjs'), 'utf8');
const compareSource = readFileSync(resolve('scripts/compare-recovery-manifests.mjs'), 'utf8');
const runbookSource = readFileSync(resolve('docs/disaster-recovery.md'), 'utf8');

for (const table of [
  'profiles',
  'student_materials',
  'student_material_jobs',
  'simulator_attempts',
  'historial_respuestas',
  'user_subscriptions',
  'payment_transactions',
  'payment_checkout_attempts',
  'payment_webhook_events',
]) {
  assert.ok(manifestSource.includes(`name: '${table}'`), `El manifest debe cubrir ${table}.`);
}

assert.match(manifestSource, /fingerprintAuthUsers/);
assert.match(manifestSource, /sha256: sha256\(ids\)/);
assert.match(manifestSource, /fingerprintTable/);
assert.match(manifestSource, /version: 2/);
assert.doesNotMatch(manifestSource, /email|whatsapp|telefono/i);
assert.match(manifestSource, /storageObjects\.map\(\(item\) => `\$\{item\.path\}\\t\$\{item\.size\}`\)/);

assert.match(compareSource, /auth\.users\.sha256/);
assert.match(compareSource, /table:\$\{table\}:sha256/);
assert.match(compareSource, /storage:biblioteca:sha256/);
assert.match(compareSource, /process\.exit\(1\)/);

for (const requiredRunbookTerm of [
  'entorno aislado',
  'Restaurar Storage',
  'RTO/RPO',
  'login de una cuenta de prueba',
  'suscripción/transacción existente',
]) {
  assert.ok(runbookSource.includes(requiredRunbookTerm), `El runbook debe incluir: ${requiredRunbookTerm}`);
}

console.log('Disaster recovery smoke tests passed.');

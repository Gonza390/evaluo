import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20261022174516_stale_pdf_job_recovery_every_five_minutes.sql', 'utf8'
);
assert.match(migration, /create extension if not exists pg_cron/);
assert.match(migration, /security invoker/);
assert.match(migration, /revoke all on schema internal_tasks from public, anon, authenticated/i);
assert.match(migration, /revoke all on function internal_tasks\.fail_expired_material_jobs/);
assert.match(migration, /j\.status = 'processing'/);
assert.match(migration, /interval '7 minutes'/);
assert.match(migration, /m\.processing_status = 'processing'/);
assert.match(migration, /'\*\/5 \* \* \* \*'/);
assert.doesNotMatch(migration, /update\s+public\.student_materials[^]*?set\s+processing_status\s*=\s*'ready'/);

const page = readFileSync('app/materiales/[id]/page.tsx', 'utf8');
const retry = readFileSync('components/student-material-processing-retry.tsx', 'utf8');
const refresh = readFileSync('components/student-material-processing-refresh.tsx', 'utf8');
assert.match(page, /material\.processing_status === 'failed'/);
assert.match(page, /material\.processing_error ===/);
assert.match(page, /failedJob\.attempts < 3/);
assert.match(page, /autoRetry=\{shouldAutoResume\}/);
assert.match(page, /StudentMaterialProcessingRefresh/);
assert.match(retry, /autoTriggeredRef\.current = true/);
assert.match(retry, /processStudentMaterialAction\(materialId\)/);
assert.match(refresh, /router\.refresh\(\)/);

console.log('Stale PDF job watchdog and guarded retry regression tests passed.');

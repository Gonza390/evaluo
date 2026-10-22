import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateCalendarWrite,
  describeCalendarSaveError,
} from '../lib/calendar-write-validation.ts';

const base = {
  eventType: 'exam',
  eventDate: '2026-11-15',
  examInstance: '1',
  materiaId: null,
  carreraId: null,
  materialId: null,
  reminderDays: [7, 3, 1],
};

let result = validateCalendarWrite(base);
assert.equal(result.ok, true);
if (result.ok) {
  assert.equal(result.value.examInstance, '1');
  assert.deepEqual(result.value.reminderDays, [7, 3, 1]);
  assert.equal(result.value.eventType, 'exam');
}

result = validateCalendarWrite({ ...base, examInstance: 'integrador', reminderDays: [1, 7, 1, 3] });
assert.equal(result.ok, true);
if (result.ok) assert.deepEqual(result.value.reminderDays, [7, 3, 1]);

result = validateCalendarWrite({ ...base, eventType: 'assignment', examInstance: 'otro', reminderDays: [3] });
assert.equal(result.ok, true);
if (result.ok) {
  assert.equal(result.value.examInstance, null);
  assert.equal(result.value.reminderDays, null);
}
assert.equal(validateCalendarWrite({ ...base, examInstance: 'parcial_1' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, examInstance: 'final' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, eventType: 'reminder' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, eventDate: '2026-02-30' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, eventDate: '2026/11/15' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, materiaId: 'demo-material' }).ok, false);
assert.equal(validateCalendarWrite({ ...base, reminderDays: [0, 3] }).ok, false);
assert.equal(validateCalendarWrite({ ...base, reminderDays: ['7'] }).ok, false);

assert.match(describeCalendarSaveError({ code: '23514' }), /opciones admitidas/);
assert.match(describeCalendarSaveError({ code: '23503' }), /materia o carrera/);
assert.match(describeCalendarSaveError({ code: '42501' }), /sesión/);
assert.doesNotMatch(describeCalendarSaveError({ code: '23514', message: 'sensitive-data' }), /sensitive-data/);

const page = readFileSync('app/calendario/page.tsx', 'utf8');
const instrumentation = readFileSync('instrumentation.ts', 'utf8');
const runtimeTracer = readFileSync('lib/server-runtime-warnings.ts', 'utf8');
assert.match(page, /validateCalendarWrite\(/);
assert.match(page, /event_type: validEvent\.eventType/);
assert.match(page, /exam_instance: validEvent\.examInstance/);
assert.match(page, /postgresCode: error\?\.code/);
assert.match(runtimeTracer, /warning\.code !== 'DEP0005'/);
assert.match(runtimeTracer, /runtime\.bufferDeprecation\.origin/);
assert.match(instrumentation, /server-runtime-warnings/);
assert.doesNotMatch(runtimeTracer, /noDeprecation\s*=\s*true/);

const migration = readFileSync(
  'supabase/migrations/20261022092124_calendar_legacy_exam_instance_ai_source_vision.sql',
  'utf8'
);
assert.match(migration, /lower\(btrim\(new\.exam_instance\)\) = 'parcial_1'/);
assert.match(migration, /lower\(btrim\(new\.exam_instance\)\) = 'parcial_2'/);
assert.match(migration, /new\.exam_instance := '1'/);
assert.match(migration, /new\.exam_instance := '2'/);
assert.match(migration, /before insert or update of exam_instance/i);
assert.match(migration, /'source_vision'::text/);
assert.match(migration, /student_material_ai_usage_operation_check/);
assert.doesNotMatch(migration, /drop constraint if exists study_calendar_events_exam_instance_check/i);

console.log('Calendar CHECK constraint and Buffer deprecation diagnostic tests passed.');

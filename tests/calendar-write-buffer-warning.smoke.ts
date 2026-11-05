import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCalendarGrid } from '../lib/calendar-utils.ts';
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

// La grilla usa sólo las semanas necesarias y mantiene todas las fechas del mes.
assert.equal(getCalendarGrid(new Date(2027, 1, 1)).length, 28, 'Febrero 2027 entra en cuatro semanas.');
assert.equal(getCalendarGrid(new Date(2027, 2, 1)).length, 35, 'Marzo 2027 necesita cinco semanas.');
assert.equal(getCalendarGrid(new Date(2026, 10, 1)).length, 42, 'Noviembre 2026 necesita seis semanas.');
for (const [year, month] of [[2026, 10], [2027, 1], [2027, 2]]) {
  const grid = getCalendarGrid(new Date(year, month, 1));
  assert.equal(grid[0].getDay(), 1, 'Cada calendario empieza un lunes.');
  assert.equal(grid[grid.length - 1].getDay(), 0, 'Cada calendario termina un domingo.');
  const dates = grid.map(date => date.toISOString().slice(0, 10));
  assert.equal(new Set(dates).size, dates.length, 'No se repiten fechas.');
}

const page = readFileSync('app/(es)/calendario/page.tsx', 'utf8');
const studyPlanApi = readFileSync('app/api/study-plans/route.ts', 'utf8');
assert.match(studyPlanApi, /request\.nextUrl\.searchParams\.get\('view'\)==='calendar'/,
  'La API de planes ofrece una consulta liviana para el calendario.');
assert.match(studyPlanApi, /\.eq\('user_id',user\.id\)\.maybeSingle\(\)/,
  'El plan del calendario se consulta únicamente para el usuario autenticado.');
assert.match(page, /fetch\('\/api\/study-plans\?view=calendar'/,
  'El calendario consulta el plan persistido, no genera actividades ficticias.');
assert.match(page, /const activeStudyPlan = ownerStudyPlan && user && ownerStudyPlan\.userId === user\.id/,
  'El calendario no accede al plan cuando la sesión todavía no existe.');
assert.doesNotMatch(page, /ownerStudyPlan\?\.userId === user\?\.id \? ownerStudyPlan\.plan/,
  'No se debe comparar undefined con undefined durante el primer render.');
assert.match(page, /normalizeCalendarStudyPlan\(data\?\.plan\)/,
  'Las respuestas incompletas del plan se normalizan antes del render.');
assert.match(page, /Array\.isArray\(day\.topics\)/,
  'Los días dañados o antiguos no deben romper el calendario.');
assert.match(page, /Number\.isFinite\(day\.estimatedMinutes\)/,
  'Los minutos del plan se validan antes de mostrarse.');
assert.match(page, /data-calendar-plan-day/,
  'Los días con temas guardados tienen una marca azul.');
assert.match(page, /data-calendar-plan-exam/,
  'La fecha del examen guardada en el plan tiene una marca diferente.');
assert.match(page, /data-calendar-selected-plan-day/,
  'El día seleccionado presenta los temas planificados.');
assert.match(page, /selectedStudyPlanDay\.estimatedMinutes/,
  'El calendario presenta los minutos guardados en el plan.');
assert.match(page, /selectedStudyPlanDay\.topics\.slice\(0, 2\)/,
  'El detalle del día es compacto para evitar scroll innecesario.');
assert.match(page, /href="\/dashboard\/plan-de-estudio"/,
  'La sección del plan abre su pantalla de origen.');
assert.match(page, /cellEvents\.length > 0 \|\| \(!planDay && !isPlanExamDay\)/,
  'Los eventos del calendario conservan su editor existente.');
assert.match(page, /new Map<string, PlanDay>\(\)/,
  'Los indicadores se derivan de los días reales guardados, no duplican eventos.');

assert.match(page, /h-\[48px\][^\n]*sm:h-\[56px\]/,
  'Las fechas son compactas en móvil y escritorio, conservando un área táctil mínima.');
assert.doesNotMatch(page, /min-h-\[64px\]/,
  'Las casillas no deben expandirse a la altura antigua.');
assert.match(page, /cellEvents\.length > 1 \? \([\s\S]*?absolute right-1 top-1/,
  'La cantidad adicional de eventos no debe crear una tercera línea dentro de la fecha.');
assert.match(page, /min-\[480px\]:hidden/,
  'En pantallas pequeñas los eventos se distinguen mediante un indicador compacto.');
const instrumentation = readFileSync('instrumentation.ts', 'utf8');
const runtimeTracer = readFileSync('lib/server-runtime-warnings.ts', 'utf8');
// El recorrido guiado del Calendario fue eliminado, no deshabilitado.
assert.doesNotMatch(page, /TourCard|CalendarTour|calendarTourStep|showCalendarTour/);
assert.doesNotMatch(page, /getCalendarTourStorageKey|evaluo_calendar_tour_seen/);
assert.doesNotMatch(page, /monthTourRef|gridTourRef|composerTourRef|createTourRef/);
assert.match(page, /const openComposerForDate =/);
assert.match(page, /const handleCreateEvent =/);
assert.match(page, /const handleDeleteEvent =/);
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

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAllowedAnalyticsEventName } from '@/lib/analytics-events';
import { sanitizeAnalyticsMetadata } from '@/lib/analytics-metadata';

// Medición del límite Free alcanzado desde el plan: se muestra / qué hace el alumno.
assert.equal(isAllowedAnalyticsEventName('plan_limit_reached'), true);
assert.equal(isAllowedAnalyticsEventName('plan_limit_action'), true);

const action = sanitizeAnalyticsMetadata('plan_limit_action', {
  source: 'study_plan', limit_kind: 'matching_round', material_id: 'm1', topic_index: 2,
  has_next: true, action: 'next_activity', email: 'x@y.z', free_text: 'no debe pasar',
}) as Record<string, unknown>;
assert.equal(action.action, 'next_activity');
assert.equal(action.limit_kind, 'matching_round');
assert.equal(action.topic_index, 2);
assert.equal('email' in action, false, 'Solo claves de la lista blanca.');
assert.equal('free_text' in action, false);

const screen = readFileSync('components/dashboard/free-practice-limit-screen.tsx', 'utf8');
assert.match(screen, /Seguir con mi siguiente actividad/, 'Tercera salida para no cortar al alumno Free.');
assert.match(screen, /plan\?\.next && <Link/, 'La salida solo aparece si el plan tiene una actividad siguiente.');
for (const a of ['premium', 'next_activity', 'back'])
  assert.match(screen, new RegExp(`onClickCapture=\\{\\(\\) => trackPlanLimit\\('plan_limit_action', '${a}'\\)`), `Falta medir la acción ${a}.`);
assert.match(screen, /trackPlanLimit\('plan_limit_reached'\)/, 'Falta medir que el límite se mostró.');
assert.match(screen, /if \(planMaterialId === undefined \|\| planTopicIndex === undefined\) return;/,
  'Fuera del plan (material, simulador) no se emite el evento.');

for (const f of ['app/(es)/dashboard/practicar/[id]/[mode]/page.tsx', 'components/dashboard/practice-session.tsx'])
  assert.match(readFileSync(f, 'utf8'), /plan=\{planNav && planTopicIndex !== undefined/, `${f} debe pasar el contexto del plan.`);
console.log('plan-limit-tracking ok');

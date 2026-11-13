import assert from 'node:assert/strict';
import { overduePlanTopics, planDateKey, reorganizePlanSchedule } from '../lib/student-materials/plan-reorganize.ts';

const M = '11111111-1111-4111-8111-111111111111';
const topic = (i: number) =>
  ({ materialId: M, materialTitle: 'Mat', topicIndex: i, title: 'Tema ' + (i + 1), estimatedMinutes: 20 });
const day = (date: string, ...idx: number[]) =>
  ({ date, topics: idx.map(topic), estimatedMinutes: idx.length * 20 });
const days = [day('2026-11-10', 0), day('2026-11-11', 1), day('2026-11-12', 2), day('2026-11-20', 3)];
const today = new Date(2026, 10, 13, 12);
const todayKey = planDateKey(today);
assert.equal(todayKey, '2026-11-13');

// Atrasados: solo días anteriores a hoy y no completados; hoy y futuro no cuentan.
const overdue = overduePlanTopics(days, [`${M}:0`], todayKey);
assert.deepEqual(overdue.topics.map(t => t.topicIndex), [1, 2]);
assert.equal(overdue.firstDate, '2026-11-11');
assert.equal(overduePlanTopics(days, [`${M}:0`, `${M}:1`, `${M}:2`], todayKey).topics.length, 0);

// Reorganizar: lo completado conserva su día; lo pendiente se reparte desde hoy.
const result = reorganizePlanSchedule({
  days, completedKeys: [`${M}:0`], examDate: '2026-11-25', dailyMinutes: 30, preferences: ['practicar'], start: today,
});
assert.ok(result.ok);
if (result.ok) {
  assert.equal(result.moved, 3);
  assert.deepEqual(result.schedule[0]!.topics.map(t => t.topicIndex), [0], 'el tema completado no se mueve');
  assert.equal(result.schedule[0]!.date, '2026-11-10');
  const all = result.schedule.flatMap(d => d.topics.map(t => t.topicIndex)).sort();
  assert.deepEqual(all, [0, 1, 2, 3], 'ningún tema se pierde ni se duplica');
  const rescheduled = result.schedule.filter(d => d.date >= todayKey);
  assert.ok(rescheduled.length > 0);
  assert.ok(rescheduled.every(d => d.date < '2026-11-25'), 'todo antes del examen');
  assert.ok(result.schedule.slice(1).every(d => d.date >= todayKey), 'nada queda en días vencidos');
}

// Casos sin salida.
assert.deepEqual(reorganizePlanSchedule({ days, completedKeys: [], examDate: '2026-11-13', dailyMinutes: 30,
  preferences: ['practicar'], start: today }), { ok: false, error: 'exam_passed' });
assert.deepEqual(reorganizePlanSchedule({ days, completedKeys: [0, 1, 2, 3].map(i => `${M}:${i}`), examDate: '2026-11-25',
  dailyMinutes: 30, preferences: ['practicar'], start: today }), { ok: false, error: 'nothing_pending' });

console.log('plan-reorganize.smoke ok');

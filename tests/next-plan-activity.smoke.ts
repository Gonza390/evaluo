import assert from 'node:assert/strict';
import { nextPlanActivity } from '../lib/student-materials/next-plan-activity.ts';

const M = '11111111-1111-4111-8111-111111111111';
const topic = (topicIndex: number) =>
  ({ materialId: M, materialTitle: 'Mat', topicIndex, title: 'Tema ' + (topicIndex + 1), estimatedMinutes: 20 });
const days = [
  { date: '2026-11-20', topics: [topic(1)], estimatedMinutes: 20 },
  { date: '2026-11-19', topics: [topic(0)], estimatedMinutes: 20 },
];
const base = { days, preferences: ['memorizar'], dailyMinutes: 30, readingKeys: [] as string[], practice: [] };

// Orden del calendario por fecha, no por posición en el arreglo.
let next = nextPlanActivity({ ...base, current: { materialId: M, topicIndex: 0, mode: 'flashcards' } })!;
assert.match(next.href, /studyTopic=0/, 'el tema 0 aún no se leyó');

// Con el tema 0 leído y su práctica terminada, sigue con el tema 1.
const read0 = [`${M}:0`];
next = nextPlanActivity({ ...base, readingKeys: read0, current: { materialId: M, topicIndex: 0, mode: 'flashcards' } })!;
assert.match(next.href, /studyTopic=1/);
assert.equal(next.topicTitle, 'Tema 2');

// La rotación es estable por tema (tema 1 → unir). La práctica pendiente lleva planTopic.
next = nextPlanActivity({ ...base, readingKeys: [`${M}:0`, `${M}:1`],
  current: { materialId: M, topicIndex: 0, mode: 'flashcards' } })!;
assert.match(next.href, /\/dashboard\/practicar\/.+\/unir\?repaso=rapido&planTopic=1$/);

// Todo hecho: no hay siguiente.
const everything = nextPlanActivity({ ...base, readingKeys: [`${M}:0`, `${M}:1`],
  practice: [{ material_id: M, topic_index: 1, mode: 'unir' }],
  current: { materialId: M, topicIndex: 0, mode: 'flashcards' } });
assert.equal(everything, null);

console.log('next-plan-activity.smoke ok');

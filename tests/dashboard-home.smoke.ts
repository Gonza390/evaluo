import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeView, daysBetween, type HomeInput } from '../lib/dashboard-home-model.ts';

const file = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const topics = Array.from({ length: 8 }, (_, i) => ({ title: `Tema ${i + 1}`, minutes: 10 + i }));
const base: HomeInput = {
  firstName: 'Gonza',
  today: '2026-11-08',
  material: { id: 'm1', title: 'Marketing I', examDate: null },
  topics,
  readTopics: [],
  touchedTopics: [],
  weakTopicCount: 0,
  plan: null,
  exams: [],
};

assert.equal(daysBetween('2026-11-08', '2026-11-26'), 18);
assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);

// 2 · Sin fecha, todavía no empezó.
{
  const view = buildHomeView(base);
  assert.equal(view.mode, 'sin-fecha');
  assert.equal(view.greeting, 'Tu apunte de Marketing I está listo, Gonza.');
  assert.equal(view.card.kind, 'empezar');
  assert.match(view.card.text, /^Empezá por Tema 1\. Es el tema 1 de 8 y te lleva unos 10 minutos\.$/);
  assert.deepEqual(view.agenda.askDate, { materialId: 'm1', materialTitle: 'Marketing I' });
  assert.equal(view.agenda.tasks[0].href, '/materiales/m1?tab=resumen&studyTopic=0');
}

// 1 · Sin fecha, ya avanzó (y dejó un tema a mitad).
{
  const view = buildHomeView({ ...base, readTopics: [0, 1, 2, 3, 4], touchedTopics: [0, 1, 2, 3, 4, 5] });
  assert.equal(view.greeting, 'Gonza, te faltan 3 temas de Marketing I.');
  assert.equal(view.card.kind, 'retomar');
  assert.equal(view.card.text, 'Te quedó a mitad Tema 6. Terminalo en unos 15 minutos.');
  if (view.card.kind === 'retomar') assert.equal(view.card.progressLabel, '5 de 8 temas leídos');
  assert.ok(view.agenda.askDate);
}
{
  const view = buildHomeView({ ...base, readTopics: [0], touchedTopics: [0] });
  assert.equal(view.card.text, 'Ahora sigue Tema 2. Te lleva unos 11 minutos.');
  assert.equal(view.greeting, 'Gonza, te faltan 7 temas de Marketing I.');
}

// 4 · Con fecha, sin plan.
{
  const view = buildHomeView({
    ...base,
    material: { ...base.material, examDate: '2026-11-26' },
    readTopics: [0, 1, 2, 3, 4],
    weakTopicCount: 2,
    exams: [{ materialId: 'm1', title: 'Marketing I', examDate: '2026-11-26' }],
  });
  assert.equal(view.mode, 'con-fecha');
  assert.equal(view.greeting, 'Faltan 18 días para Marketing I, Gonza.');
  assert.equal(view.card.kind, 'preparacion');
  if (view.card.kind === 'preparacion') {
    assert.equal(view.card.percent, 38);
    assert.deepEqual([view.card.good, view.card.weak, view.card.unseen], [3, 2, 3]);
  }
  assert.equal(view.card.text, 'Estás 38% listo. Para rendir tranquilo te faltan Tema 6, Tema 7 y Tema 8.');
  assert.equal(view.agenda.askDate, null);
  assert.equal(view.agenda.exam?.daysLeft, 18);
  assert.equal(view.agenda.planCta?.href, '/dashboard/plan-de-estudio?material=m1');
  assert.equal(view.agenda.exams.length, 1);
}

// Fecha pasada: vuelve a pedir la fecha.
{
  const view = buildHomeView({ ...base, material: { ...base.material, examDate: '2026-11-01' } });
  assert.equal(view.mode, 'sin-fecha');
}

// 5 · Con plan.
{
  const day = (date: string, indexes: number[]) => ({
    date,
    topics: indexes.map((i) => ({ materialId: 'm1', topicIndex: i, title: `Tema ${i + 1}`, estimatedMinutes: 15 })),
  });
  const plan = {
    examDate: '2026-11-26',
    days: [day('2026-11-05', [0]), day('2026-11-06', [1]), day('2026-11-07', [2]), day('2026-11-08', [3, 4, 5]), day('2026-11-09', [6])],
  };
  const view = buildHomeView({ ...base, readTopics: [0, 1, 2, 3], plan });
  assert.equal(view.mode, 'con-plan');
  assert.equal(view.greeting, 'Hoy te quedan 2 tareas, Gonza.');
  assert.equal(view.card.kind, 'plan');
  if (view.card.kind === 'plan') {
    assert.deepEqual([view.card.dayNumber, view.card.totalDays, view.card.behind], [4, 5, 0]);
  }
  assert.equal(view.card.text, 'Ahora sigue Tema 5: leelo y hacé las preguntas. Unos 15 minutos.');
  assert.deepEqual(view.agenda.tasks.map((task) => task.done), [true, false, false]);

  const behind = buildHomeView({ ...base, readTopics: [0], plan });
  if (behind.card.kind === 'plan') assert.equal(behind.card.behind, 2);
}

// Sin nombre no queda una coma suelta.
assert.equal(buildHomeView({ ...base, firstName: undefined }).greeting, 'Tu apunte de Marketing I está listo.');

// La página usa la home nueva solo en español y con un PDF listo; si falla, queda la anterior.
const page = file('app/(es)/dashboard/page.tsx');
assert.match(page, /getDashboardHomeView/);
assert.match(page, /locale !== 'en' && hasReadyMaterial/);
const space = file('components/dashboard/maeve-study-space.tsx');
assert.match(space, /<HomeSpace/);
assert.match(space, /<MaeveDashboardChrome/, 'La home anterior sigue como respaldo.');
const loader = file('lib/dashboard-home.ts');
assert.match(loader, /return null;\s*\}\s*\}\s*$/, 'Ante un error devuelve null y se usa la home anterior.');

// El componente de diapositivas es genérico.
const slides = file('components/dashboard/diapositivas.tsx');
assert.match(slides, /export function Diapositivas/);
assert.match(slides, /total > 1/, 'Con una sola diapositiva no hay flechas.');

console.log('dashboard-home smoke ok');

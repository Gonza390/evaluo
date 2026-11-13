import assert from 'node:assert/strict';
import {
  fragmentInPlanTopic, practiceItemInPlanTopic, readTopicIndex, resolvePlanTopicScope,
} from '../lib/student-materials/plan-topic-scope.ts';

const sections = [
  { title: 'Tema 1: Mercado', body: 'Texto.\n\nVer en PDF · páginas 2, 3 y 4' },
  { title: 'Tema 2: Precio', body: 'Texto.\n\nVer en PDF · páginas 4, 5' },
  { title: 'Tema 3: Plaza', body: 'Text.\n\nView in PDF · pages 7, 8' },
  { title: 'Apartado Promoción', body: 'Sin citas de página.' },
];

// Una página citada por dos temas no prueba pertenencia: se excluye de ambos.
const one = resolvePlanTopicScope(sections, 0)!;
const two = resolvePlanTopicScope(sections, 1)!;
assert.deepEqual([...one.pages].sort(), [2, 3]);
assert.deepEqual([...two.pages], [5]);
// También entiende las citas en inglés.
assert.deepEqual([...resolvePlanTopicScope(sections, 2)!.pages].sort(), [7, 8]);

// Índices inválidos no producen alcance.
assert.equal(resolvePlanTopicScope(sections, 9), null);
assert.equal(resolvePlanTopicScope(sections, -1), null);
assert.equal(resolvePlanTopicScope(sections, undefined), null);

// Fragmentos: PDF por página, Word por título de apartado.
assert.equal(fragmentInPlanTopic(one, { pageStart: 3 }), true);
assert.equal(fragmentInPlanTopic(one, { pageStart: 5 }), false, 'página de otro tema');
assert.equal(fragmentInPlanTopic(one, { pageStart: 4 }), false, 'página compartida');
const word = resolvePlanTopicScope(sections, 3)!;
assert.equal(fragmentInPlanTopic(word, { pageStart: null, sectionTitle: 'Apartado: Promoción' }), true);
assert.equal(fragmentInPlanTopic(word, { pageStart: null, sectionTitle: 'Otro apartado' }), false);
assert.equal(fragmentInPlanTopic(word, { pageStart: null, sectionTitle: null }), false);

// Ejercicios construidos: por página; sin página, por capítulo.
assert.equal(practiceItemInPlanTopic(two, { pageStart: 5 }), true);
assert.equal(practiceItemInPlanTopic(two, { pageStart: 2 }), false);
assert.equal(practiceItemInPlanTopic(word, { pageStart: null, chapterTitle: 'Apartado Promoción' }), true);
assert.equal(practiceItemInPlanTopic(two, {}), false, 'sin evidencia, se descarta');

// topicIndex de los cuerpos JSON.
assert.equal(readTopicIndex(0), 0);
assert.equal(readTopicIndex(399), 399);
assert.equal(readTopicIndex(400), undefined);
assert.equal(readTopicIndex(-1), undefined);
assert.equal(readTopicIndex('2'), undefined);
assert.equal(readTopicIndex(1.5), undefined);
assert.equal(readTopicIndex(undefined), undefined);

console.log('plan-topic-scope.smoke ok');

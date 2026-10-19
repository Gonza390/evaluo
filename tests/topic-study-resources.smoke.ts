import assert from 'node:assert/strict';
import {
  getTopicStudyResources,
  findConceptTopic,
} from '../lib/student-materials/topic-study-resources.ts';
import type { StudyGlossaryItem } from '../lib/student-materials/types.ts';
import type { StudyFlashcard } from '../lib/student-materials/pedagogy.ts';

const sections = [
  {
    title: '1. Aprendizaje automático',
    body: 'El sobreajuste dificulta generalizar. Se comparan datos de entrenamiento y prueba.',
  },
  { title: '2. Seguridad', body: 'La seguridad protege datos y las contraseñas evitan accesos.' },
];
const concept = (term: string, context = ''): StudyGlossaryItem => ({
  term,
  context,
  definition: `Definición respaldada de ${term}.`,
  importance: 'alta',
});
const glossary = [
  concept('Sobreajuste'),
  concept('datos'),
  concept('contraseñas'),
  concept('seguro'),
  concept('Sobreajuste', 'Sección de Seguridad'),
];
const card = (term: string, sectionTitle: string | null = null): StudyFlashcard => ({
  front: `¿Qué es ${term}?`,
  back: `Definición respaldada de ${term}.`,
  level: 'recordar',
  reference: { pageStart: 6, pageEnd: 7, sectionTitle, excerpt: 'Fragmento original conservado.' },
});
const cards = [
  card('Sobreajuste'),
  card('contraseñas'),
  card('Sobreajuste', 'Seguridad'),
  card('Sobreajuste'),
];
const first = getTopicStudyResources(sections, glossary, cards, 0);
assert.deepEqual(
  first.concepts.map((item) => item.term),
  ['Sobreajuste']
);
assert.equal(
  first.flashcards.length,
  1,
  'No duplicar tarjetas ni incluir referencias contradictorias.'
);
assert.equal(
  first.flashcards[0],
  cards[0],
  'Reutilizar la tarjeta original, sin fabricar páginas ni contenido.'
);
assert.deepEqual(
  getTopicStudyResources(sections, glossary, cards, 1).concepts.map((item) => item.term),
  ['contraseñas']
);
assert.equal(getTopicStudyResources(sections, glossary, cards, 1).flashcards.length, 1);
assert.deepEqual(getTopicStudyResources(sections, glossary, cards, -1), {
  concepts: [],
  flashcards: [],
});
const ambiguous = [
  { title: 'A', body: 'Sobreajuste' },
  { title: 'B', body: 'Sobreajuste' },
];
assert.equal(
  getTopicStudyResources(ambiguous, [concept('Sobreajuste')], [card('Sobreajuste')], 0).concepts
    .length,
  0
);
assert.equal(
  getTopicStudyResources(ambiguous, [concept('Sobreajuste')], [card('Sobreajuste')], 0).flashcards
    .length,
  0
);
assert.equal(
  getTopicStudyResources([{ title: 'Seguridad', body: 'Inseguro' }], [concept('seguro')], [], 0)
    .concepts.length,
  0,
  'No asociar por subcadenas.'
);
console.log('topic-study-resources.smoke: OK');
const reordered = [sections[1], sections[0]];
assert.equal(
  reordered[findConceptTopic(concept('Sobreajuste'), reordered)]?.title,
  sections[0].title,
  'Cambiar el orden no debe trasladar el concepto a otro tema.'
);
assert.equal(
  findConceptTopic(concept('Ausente'), sections),
  -1,
  'Un concepto ausente no se reparte por posición.'
);
assert.equal(
  findConceptTopic(concept('Sobreajuste', 'Repetido'), [
    { title: 'Repetido', body: 'Sobreajuste' },
    { title: 'Repetido', body: 'Otro contenido' },
  ]),
  -1,
  'Un título duplicado no identifica un capítulo inequívocamente.'
);

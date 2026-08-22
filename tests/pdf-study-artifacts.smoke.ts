import assert from 'node:assert/strict';
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';
import type {
  StudentMaterialSummary,
  StudyGlossaryItem,
} from '../lib/student-materials/types.ts';

const summary: StudentMaterialSummary = {
  shortSummary: 'Guía de estudio sobre aprendizaje, evaluación y estrategias de práctica.',
  keyPoints: [
    'La recuperación activa exige intentar recordar antes de revisar la respuesta.',
    'La evaluación permite comprobar si una estrategia está funcionando.',
    'Los ejemplos ayudan a aplicar conceptos a situaciones concretas.',
    'La planificación organiza objetivos, estrategias y tiempos.',
    'La retroalimentación permite ajustar el proceso de aprendizaje.',
  ],
  sections: [
    {
      title: '1. Recuperación activa',
      body: 'La recuperación activa consiste en intentar recordar una idea antes de volver a leerla. Relaciona memoria, práctica y comprobación del conocimiento.\nVer en PDF · página 1',
    },
    {
      title: '2. Estrategias de estudio',
      body: 'Una estrategia de estudio debe elegirse según el objetivo. Ejemplo: ante un caso con conceptos confundibles, el estudiante puede recuperar la definición, compararla y justificar la diferencia.\nVer en PDF · página 2',
    },
    {
      title: '3. Evaluación del aprendizaje',
      body: 'La evaluación permite detectar errores y ajustar decisiones. Un proceso de revisión puede incluir responder, comprobar, identificar el error y volver a practicar.\nVer en PDF · página 3',
    },
  ],
  hasContent: true,
  status: 'ready',
  provider: 'test',
  errorMessage: null,
  sourceChunksCount: 3,
};

const glossary: StudyGlossaryItem[] = [
  {
    term: 'Recuperación activa',
    definition: 'Práctica que exige intentar recordar una respuesta antes de consultar nuevamente el material.',
    context: 'Recuperación activa · Fundamentos · Ver en PDF · página 1',
    importance: 'alta',
  },
  {
    term: 'Planificación',
    definition: 'Proceso de definir objetivos, seleccionar estrategias y organizar el tiempo disponible para estudiar.',
    context: 'Estrategias de estudio · Ver en PDF · página 2',
    importance: 'alta',
  },
  {
    term: 'Autoevaluación',
    definition: 'Proceso mediante el cual el estudiante comprueba qué puede explicar o resolver sin consultar sus apuntes.',
    context: 'Evaluación del aprendizaje · Ver en PDF · página 3',
    importance: 'alta',
  },
  {
    term: 'Retroalimentación',
    definition: 'Información sobre el desempeño que permite reconocer errores y ajustar una respuesta o estrategia posterior.',
    context: 'Evaluación del aprendizaje · Ver en PDF · página 3',
    importance: 'alta',
  },
  {
    term: 'Tipos de repaso',
    definition: 'Clasificación que incluye repaso activo, repaso espaciado y autoevaluación según el objetivo de estudio.',
    context: 'Estrategias de estudio · Ver en PDF · página 2',
    importance: 'media',
  },
  {
    term: 'Monitoreo',
    definition: 'Revisión periódica de si la estrategia elegida está funcionando y acercando al estudiante a su objetivo.',
    context: 'Estrategias de estudio · Evaluación · Ver en PDF · página 3',
    importance: 'media',
  },
];

const chunks = [
  {
    text: 'La recuperación activa exige intentar recordar antes de volver a consultar el material.',
    pageStart: 1,
    pageEnd: 1,
    sectionTitle: 'Recuperación activa',
    excerpt: '',
  },
  {
    text: 'La planificación organiza objetivos, estrategias y tiempos. Los tipos de repaso incluyen práctica activa y autoevaluación.',
    pageStart: 2,
    pageEnd: 2,
    sectionTitle: 'Estrategias de estudio',
    excerpt: '',
  },
  {
    text: 'La autoevaluación y la retroalimentación permiten detectar errores, monitorear el aprendizaje y ajustar decisiones.',
    pageStart: 3,
    pageEnd: 3,
    sectionTitle: 'Evaluación del aprendizaje',
    excerpt: '',
  },
];

const artifacts = buildPedagogicalArtifacts({ summary, glossary, chunks });
const repeatedArtifacts = buildPedagogicalArtifacts({ summary, glossary, chunks });

assert.deepEqual(
  repeatedArtifacts,
  artifacts,
  'Los artefactos del mismo PDF deben ser deterministas entre renders.'
);

assert.ok(artifacts.flashcards.length >= 5, 'Debe conservar una cantidad útil de flashcards.');
assert.ok(
  artifacts.flashcards.every(
    (card) => card.front.startsWith('¿') && card.front.endsWith('?')
  ),
  'Las flashcards deben plantear una consigna de recuperación y no mostrar sólo el término.'
);
assert.ok(
  artifacts.flashcards.some((card) => card.level === 'recordar') &&
    artifacts.flashcards.some((card) => card.level === 'comprender'),
  'El nivel de las flashcards debe responder al contenido y conservar práctica de memoria y comprensión.'
);

const multipleChoice = artifacts.questions.filter(
  (question) => question.type === 'multiple_choice'
);
assert.ok(multipleChoice.length >= 4, 'El mini examen debe conservar preguntas multiple choice.');

const correctPositions = multipleChoice.map((question) =>
  question.options.findIndex((option) => option === question.answer)
);
assert.ok(
  correctPositions.every((position) => position >= 0),
  'Toda pregunta multiple choice debe contener su respuesta correcta entre las opciones.'
);
assert.ok(
  new Set(correctPositions).size > 1,
  'La respuesta correcta no debe aparecer siempre en la misma posición.'
);

for (const question of multipleChoice) {
  const normalizedOptions = question.options.map((option) =>
    option.toLocaleLowerCase('es').replace(/\s+/g, ' ').trim()
  );
  assert.equal(
    new Set(normalizedOptions).size,
    normalizedOptions.length,
    'Los distractores de una pregunta no deben repetirse.'
  );
}

const openQuestions = artifacts.questions.filter((question) => question.type === 'open');
assert.ok(
  openQuestions.some((question) => question.level === 'comprender'),
  'Debe existir práctica abierta de comprensión.'
);
assert.ok(
  openQuestions.some((question) => question.level === 'aplicar'),
  'Las secciones con ejemplos o procesos deben poder producir práctica de aplicación.'
);
assert.ok(
  openQuestions.every(
    (question) => question.answer.length <= 483 && !/Ver en PDF/i.test(question.answer)
  ),
  'La respuesta modelo debe ser breve y no arrastrar referencias de interfaz.'
);
assert.ok(
  artifacts.miniExamQuestionIds.length >= 3,
  'El mini examen debe conservar progresión entre recordar, comprender y aplicar.'
);

console.log('PDF study artifacts smoke tests passed.');

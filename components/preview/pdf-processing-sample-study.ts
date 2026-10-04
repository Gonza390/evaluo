import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

export const processingTopics = [
  {
    name: 'Finalismo',
    title: 'Teoría de la acción',
    text: 'La acción humana se caracteriza por su orientación hacia un fin. La persona anticipa un objetivo y dirige su conducta para alcanzarlo.',
    takeaway: 'La finalidad forma parte de la acción.',
  },
  {
    name: 'Culpabilidad',
    title: 'La culpabilidad',
    text: 'La culpabilidad expresa un reproche personal. Se analiza si, en las circunstancias del caso, podía exigírsele a la persona actuar de otra manera.',
    takeaway: 'Se considera la exigibilidad de actuar de otra manera, no solo el resultado.',
  },
];

// Contenido preparado para probar el recorrido. No genera IA ni guarda resultados de cuenta.
const preparedQuestions = [
  {
    topic: 0,
    prompt: 'Según el finalismo, ¿qué caracteriza a la acción humana?',
    options: [
      'El resultado, sin considerar el objetivo.',
      'Una conducta orientada hacia un fin.',
      'Un movimiento sin dirección.',
    ],
    correct: 1,
  },
  {
    topic: 1,
    prompt:
      'Se analiza si una persona podía actuar de otra manera. ¿Qué concepto se está evaluando?',
    options: [
      'La culpabilidad como reproche personal.',
      'Únicamente el resultado de la conducta.',
      'La finalidad como único criterio.',
    ],
    correct: 0,
  },
  {
    topic: 0,
    prompt:
      'Una persona anticipa un objetivo y elige cómo alcanzarlo. ¿Qué aspecto destaca el finalismo?',
    options: [
      'Solo el resultado obtenido.',
      'La ausencia de una intención.',
      'La dirección de la conducta hacia un fin.',
    ],
    correct: 2,
  },
  {
    topic: 1,
    prompt: '¿Por qué producir un resultado no basta para analizar la culpabilidad?',
    options: [
      'Porque el resultado nunca importa.',
      'Porque también se evalúa si era exigible actuar de otro modo.',
      'Porque toda conducta tiene el mismo reproche.',
    ],
    correct: 1,
  },
  {
    topic: 0,
    prompt:
      '¿Qué diferencia a una acción orientada a un objetivo de una descripción basada solo en el resultado?',
    options: [
      'Considerar el fin hacia el que se dirige la conducta.',
      'Ignorar lo que la persona hace.',
      'Suponer que el resultado explica todo.',
    ],
    correct: 0,
  },
  {
    topic: 1,
    prompt: 'En este material, ¿en qué se apoya el juicio de reproche personal?',
    options: [
      'Solo en que ocurrió un resultado.',
      'En la existencia de cualquier objetivo.',
      'En si podía exigirse actuar conforme a derecho en esas circunstancias.',
    ],
    correct: 2,
  },
];

export const processingSummary: StudentMaterialSummary = {
  shortSummary:
    'Este material presenta la teoría de la acción y el enfoque finalista, y distingue la finalidad de la conducta del juicio de culpabilidad.',
  keyPoints: processingTopics.map((topic) => topic.takeaway),
  sections: processingTopics.map((topic) => ({ title: topic.title, body: topic.text })),
  hasContent: true,
  status: 'ready',
  provider: 'demo-preparado',
  errorMessage: null,
  sourceChunksCount: 2,
};
export const processingGlossary: StudyGlossaryItem[] = processingTopics.map((topic) => ({
  term: topic.name,
  definition: topic.text,
  context: topic.title,
  importance: 'alta',
}));
export const processingArtifacts: PedagogicalArtifacts = {
  flashcards: processingTopics.map((topic, index) => ({
    front: '¿Cómo se explica ' + topic.name.toLowerCase() + ' en este material?',
    back: topic.text,
    level: 'comprender',
    reference: {
      pageStart: index + 1,
      pageEnd: index + 1,
      sectionTitle: topic.title,
      excerpt: topic.text,
    },
  })),
  questions: preparedQuestions.map((question, index) => ({
    id: 'processing-sample-' + index,
    type: 'multiple_choice',
    level: 'comprender',
    kind: 'concept',
    topic: processingTopics[question.topic].name,
    prompt: question.prompt,
    options: question.options,
    answer: question.options[question.correct],
    explanation: processingTopics[question.topic].text,
    reference: {
      pageStart: question.topic + 1,
      pageEnd: question.topic + 1,
      sectionTitle: processingTopics[question.topic].title,
      excerpt: processingTopics[question.topic].text,
    },
  })),
  miniExamQuestionIds: preparedQuestions.map((_, index) => 'processing-sample-' + index),
  coverage: { conceptsUsed: 2, sectionsUsed: 2, referencedItems: 8, totalItems: 8 },
};

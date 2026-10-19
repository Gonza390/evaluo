import assert from 'node:assert/strict';
import {
  buildPedagogicalArtifacts,
  selectPedagogicalConcepts,
} from '../lib/student-materials/pedagogy.ts';
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
  openQuestions.every(
    (question) => question.answer.length <= 483 && !/Ver en PDF/i.test(question.answer)
  ),
  'La respuesta modelo debe ser breve y no arrastrar referencias de interfaz.'
);
assert.ok(
  artifacts.miniExamQuestionIds.length >= 3,
  'El mini examen debe conservar progresión entre recordar, comprender y aplicar.'
);

function makeSummary(
  subject: string,
  sections: Array<{ title: string; body: string }>
): StudentMaterialSummary {
  return {
    shortSummary: `Guía de estudio de ${subject}.`,
    keyPoints: [
      `Conceptos centrales de ${subject}.`,
      'Definiciones necesarias para recuperar información.',
      'Relaciones entre conceptos para comprender el tema.',
      'Ejemplos o procedimientos cuando el material los incluye.',
      'Práctica basada únicamente en el contenido provisto.',
    ],
    sections,
    hasContent: true,
    status: 'ready',
    provider: 'test',
    errorMessage: null,
    sourceChunksCount: sections.length,
  };
}

function assertDomainArtifacts(
  label: string,
  domainSummary: StudentMaterialSummary,
  domainGlossary: StudyGlossaryItem[]
) {
  const output = buildPedagogicalArtifacts({ summary: domainSummary, glossary: domainGlossary });
  const domainMultipleChoice = output.questions.filter(
    (question) => question.type === 'multiple_choice'
  );

  assert.ok(output.flashcards.length >= 5, `${label}: debe generar suficientes flashcards.`);
  assert.ok(
    output.flashcards.every((card) => card.front.startsWith('¿') && card.front.endsWith('?')),
    `${label}: todas las flashcards deben exigir recuperación activa.`
  );
  assert.ok(
    domainMultipleChoice.length >= 4,
    `${label}: debe generar suficientes preguntas multiple choice.`
  );
  assert.ok(
    domainMultipleChoice.every((question) => question.options.includes(question.answer)),
    `${label}: cada multiple choice debe conservar la respuesta correcta.`
  );
  assert.ok(
    output.questions.some((question) => question.type === 'open' && question.level === 'comprender'),
    `${label}: debe conservar al menos una pregunta abierta de comprensión.`
  );
  assert.ok(
    output.coverage.referencedItems === output.coverage.totalItems,
    `${label}: todo artefacto debe conservar una referencia o fallback trazable.`
  );
}

const legalGlossary: StudyGlossaryItem[] = [
  {
    term: 'Obligación jurídica',
    definition: 'Vínculo jurídico por el cual una persona debe cumplir una prestación exigible a favor de otra.',
    context: 'Fundamentos de las obligaciones y elementos del vínculo jurídico.',
    importance: 'alta',
  },
  {
    term: 'Contrato',
    definition: 'Acto jurídico mediante el cual dos o más partes expresan consentimiento para regular relaciones patrimoniales.',
    context: 'Conceptos centrales de contratos y autonomía de la voluntad.',
    importance: 'alta',
  },
  {
    term: 'Buena fe',
    definition: 'Principio que exige a las partes comportarse con lealtad, cooperación y confianza durante la relación jurídica.',
    context: 'Principios de interpretación y ejecución contractual.',
    importance: 'alta',
  },
  {
    term: 'Responsabilidad civil',
    definition: 'Deber de reparar un daño cuando se reúnen los presupuestos que el ordenamiento exige para atribuirlo.',
    context: 'Elementos de la responsabilidad y consecuencias del incumplimiento.',
    importance: 'alta',
  },
  {
    term: 'Nulidad',
    definition: 'Consecuencia jurídica que priva de efectos al acto cuando presenta un defecto previsto por el ordenamiento.',
    context: 'Clasificación de ineficacias y efectos de los actos jurídicos.',
    importance: 'media',
  },
  {
    term: 'Capacidad jurídica',
    definition: 'Aptitud reconocida por el derecho para ser titular de derechos y ejercerlos según las reglas aplicables.',
    context: 'Conceptos de persona, capacidad y representación.',
    importance: 'media',
  },
];

const mathGlossary: StudyGlossaryItem[] = [
  {
    term: 'Derivada',
    definition: 'Tasa de variación instantánea de una función obtenida como límite del cociente incremental cuando existe.',
    context: 'Fundamentos del cálculo diferencial y variación de funciones.',
    importance: 'alta',
  },
  {
    term: 'Punto crítico',
    definition: 'Valor del dominio donde la derivada se anula o no existe y que debe analizarse para estudiar extremos.',
    context: 'Criterios para máximos, mínimos y comportamiento local.',
    importance: 'alta',
  },
  {
    term: 'Concavidad',
    definition: 'Propiedad que describe cómo cambia la pendiente de una función y puede estudiarse mediante la segunda derivada.',
    context: 'Características de la gráfica y criterio de la segunda derivada.',
    importance: 'alta',
  },
  {
    term: 'Integral definida',
    definition: 'Valor asociado a la acumulación de una magnitud en un intervalo y calculado mediante límites de sumas.',
    context: 'Conceptos centrales del cálculo integral y acumulación.',
    importance: 'alta',
  },
  {
    term: 'Límite',
    definition: 'Valor al que se aproxima una función cuando la variable independiente se acerca a un punto determinado.',
    context: 'Base conceptual para continuidad, derivadas e integrales.',
    importance: 'media',
  },
  {
    term: 'Continuidad',
    definition: 'Propiedad de una función cuyo valor coincide con el límite correspondiente en el punto considerado.',
    context: 'Relación entre límite, valor de función y comportamiento local.',
    importance: 'media',
  },
];

const psychologyGlossary: StudyGlossaryItem[] = [
  {
    term: 'Memoria de trabajo',
    definition: 'Sistema de capacidad limitada que mantiene y manipula información de forma temporal durante una tarea.',
    context: 'Fundamentos de memoria, atención y procesamiento cognitivo.',
    importance: 'alta',
  },
  {
    term: 'Atención selectiva',
    definition: 'Proceso que prioriza ciertos estímulos relevantes mientras reduce el procesamiento de información competidora.',
    context: 'Procesos cognitivos y relación entre atención y memoria.',
    importance: 'alta',
  },
  {
    term: 'Refuerzo positivo',
    definition: 'Procedimiento por el cual una consecuencia posterior incrementa la probabilidad de una conducta determinada.',
    context: 'Principios del aprendizaje y procesos de modificación de conducta.',
    importance: 'alta',
  },
  {
    term: 'Sesgo cognitivo',
    definition: 'Patrón sistemático de procesamiento que puede desviar juicios o decisiones respecto de un análisis más objetivo.',
    context: 'Conceptos sobre pensamiento, decisión y errores sistemáticos.',
    importance: 'alta',
  },
  {
    term: 'Motivación intrínseca',
    definition: 'Disposición a realizar una actividad por el interés o satisfacción inherente a la propia actividad.',
    context: 'Teorías de motivación y regulación de la conducta.',
    importance: 'media',
  },
  {
    term: 'Autorregulación',
    definition: 'Proceso de monitorear y ajustar pensamientos, emociones o conductas para avanzar hacia una meta definida.',
    context: 'Procesos de control, metas y estrategias de regulación.',
    importance: 'media',
  },
];

assertDomainArtifacts(
  'Derecho',
  makeSummary('Derecho de obligaciones', [
    {
      title: 'Obligaciones y contratos',
      body: 'La obligación vincula acreedor, deudor y prestación. El contrato organiza relaciones patrimoniales mediante consentimiento y debe interpretarse conforme al principio de buena fe.',
    },
    {
      title: 'Incumplimiento y responsabilidad',
      body: 'Ante un caso de incumplimiento deben analizarse los presupuestos de responsabilidad civil y las consecuencias jurídicas que correspondan según el material.',
    },
  ]),
  legalGlossary
);

assertDomainArtifacts(
  'Matemática',
  makeSummary('Cálculo diferencial', [
    {
      title: 'Derivadas y comportamiento local',
      body: 'La derivada expresa variación instantánea. Los puntos críticos y la concavidad permiten estudiar el comportamiento local de una función.',
    },
    {
      title: 'Aplicación de criterios',
      body: 'Ejemplo: para resolver un problema de extremos se identifican puntos críticos, se analiza la segunda derivada y se justifica la clasificación obtenida.',
    },
  ]),
  mathGlossary
);

assertDomainArtifacts(
  'Psicología',
  makeSummary('Procesos cognitivos y aprendizaje', [
    {
      title: 'Atención y memoria',
      body: 'La atención selectiva prioriza información y la memoria de trabajo mantiene temporalmente los elementos necesarios para completar una tarea.',
    },
    {
      title: 'Aprendizaje y autorregulación',
      body: 'En una situación de aprendizaje pueden analizarse refuerzos, motivación y estrategias de autorregulación para explicar cambios de conducta.',
    },
  ]),
  psychologyGlossary
);

const rankingProbe: StudyGlossaryItem[] = [
  ...legalGlossary,
  {
    term: 'Inteligencia artificial',
    definition: 'Conjunto de técnicas computacionales utilizadas para automatizar tareas mediante modelos y datos.',
    context: 'Fundamentos y conceptos de tecnología.',
    importance: 'media',
    englishTerm: 'Artificial intelligence',
  },
];
const topLegalConcepts = selectPedagogicalConcepts(rankingProbe, 4);
assert.ok(
  topLegalConcepts.every((item) => item.term !== 'Inteligencia artificial'),
  'Un término tecnológico de importancia media no debe desplazar conceptos centrales de otro dominio.'
);

console.log('PDF study artifacts smoke tests passed across academic domains.');
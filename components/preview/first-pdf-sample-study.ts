import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-materials/types';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import { samplePdf } from './first-pdf-preview-data';

export const sampleSummary: StudentMaterialSummary = {
  shortSummary: samplePdf.summary,
  keyPoints: [
    'Correlación no implica causalidad.',
    'Considerá terceras variables.',
    'Compará grupos en condiciones similares.',
  ],
  sections: [
    { title: 'Correlación y causalidad', body: samplePdf.fragments[0] },
    { title: 'Cómo comparar explicaciones', body: samplePdf.fragments[1] },
  ],
  hasContent: true,
  status: 'ready',
  provider: 'demo-preparado',
  errorMessage: null,
  sourceChunksCount: 2,
};
export const sampleGlossary: StudyGlossaryItem[] = [
  {
    term: 'Correlación',
    definition:
      'Asociación entre dos variables que cambian juntas. Por sí sola no demuestra que una cause la otra.',
    context: 'Relación entre variables · página 1',
    importance: 'alta',
  },
  {
    term: 'Causalidad',
    definition:
      'Relación en la que un cambio produce otro. Para investigarla hay que considerar otras explicaciones y comparar condiciones.',
    context: 'Diferencia entre asociación y causa · páginas 1–2',
    importance: 'alta',
  },
  {
    term: 'Tercera variable',
    definition:
      'Otro factor que puede influir en las dos variables observadas y explicar su asociación, como el calor en el ejemplo del PDF.',
    context: 'Confusión conceptual · página 1',
    importance: 'alta',
  },
  {
    term: 'Asignación al azar',
    definition:
      'Asignar una intervención al azar ayuda a reducir diferencias previas entre grupos. Los resultados se interpretan dentro de las condiciones del estudio.',
    context: 'Comparación de grupos · página 2',
    importance: 'alta',
  },
];
export const sampleArtifacts: PedagogicalArtifacts = {
  flashcards: [
    {
      front: '¿Por qué una correlación no demuestra por sí sola una causa?',
      back: 'Una tercera variable puede explicar que ambas cambien juntas. En el PDF, el calor puede aumentar tanto la venta de helados como el uso de ventiladores.',
      level: 'comprender',
      reference: {
        pageStart: 1,
        pageEnd: 1,
        sectionTitle: 'Correlación y causalidad',
        excerpt: samplePdf.fragments[0]!,
      },
    },
    {
      front: '¿Cómo comparar dos técnicas de estudio con mejores condiciones?',
      back: 'Compará grupos en condiciones similares y asigná la intervención al azar para reducir diferencias previas. El resultado sigue dependiendo de las condiciones del estudio.',
      level: 'comprender',
      reference: {
        pageStart: 2,
        pageEnd: 2,
        sectionTitle: 'Cómo comparar explicaciones',
        excerpt: samplePdf.fragments[1]!,
      },
    },
  ],
  questions: [],
  miniExamQuestionIds: [],
  coverage: { conceptsUsed: 4, sectionsUsed: 2, referencedItems: 2, totalItems: 2 },
};

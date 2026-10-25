import { hasSourceContradictedCausalDirection } from '../lib/student-materials/answer-integrity.ts';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  analyzePdfDocument,
  buildStudyDocumentModel,
  buildSummaryChunks,
  buildSummarySourceText,
  buildTraceableSummaryChunks,
  summarizeExtractedText,
} from '../lib/student-materials/text.ts';
import { buildStudentMaterialGlossary } from '../lib/student-materials/glossary.ts';
import {
  cleanRepeatedPageChrome,
  extractTextFromPdfBuffer,
} from '../lib/student-materials/pdf-extract.ts';
import {
  buildPedagogicalArtifacts,
  PEDAGOGICAL_ARTIFACTS_VERSION,
  resolveFlashcardLimit,
} from '../lib/student-materials/pedagogy.ts';
import { buildStudentMaterialPedagogicalQualityReport } from '../lib/student-materials/quality.ts';
import { buildPedagogicalArtifacts as buildCurrentPedagogicalArtifacts } from '../lib/student-materials/pedagogy-v2.ts';
import {
  buildPedagogicalMapGroupFromIndexes,
  expandCompactPedagogicalNode,
  findMissingCompactChunkNumbers,
  selectPedagogicalRecoveryChunkNumbers,
  mergeCompactPedagogicalNodes,
  normalizeCompactPedagogicalNode,
} from '../lib/student-materials/pedagogy-ai.ts';
import {
  buildCanonicalSummarySource,
  buildCanonicalSummarySourceText,
} from '../lib/student-materials/canonical-summary-source.ts';
import {
  buildCanonicalStudentMaterialSummaryFallback,
  buildCanonicalSummaryPrompt,
  sanitizeCanonicalSummaryPayload,
} from '../lib/student-materials/canonical-summary.ts';
import {
  buildCanonicalStudentMaterialGlossary,
  CANONICAL_GLOSSARY_PROVIDER,
  resolveCanonicalGlossaryLimit,
} from '../lib/student-materials/canonical-glossary.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';
import {
  resolveQuestionBankTarget,
  resolveQuestionCategoryFactor,
  selectSourceDistributedItems,
  analyzeQuestionBankCoverage,
} from '../lib/student-materials/question-bank.ts';

function normalizeForTest(value: string) {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const sampleText = `
UNIDAD 1. APRENDIZAJE AUTORREGULADO

El aprendizaje autorregulado es la capacidad del estudiante para planificar, monitorear y ajustar su propio proceso de estudio.

1.1 Planificacion
- Definicion: implica fijar objetivos, elegir estrategias y organizar tiempos.
- Ejemplo: crear un cronograma de lectura antes del examen.

1.2 Monitoreo
El monitoreo consiste en revisar si la estrategia usada esta funcionando.

Importancia del modelo PERMA: permite relacionar bienestar, motivacion y rendimiento academico.

UNIDAD 2. ESTRATEGIAS DE ESTUDIO

Las tecnicas de estudio incluyen subrayado, elaboracion de resumenes y repasos espaciados.

Tipos de repaso: repaso activo, repaso espaciado y autoevaluacion.

Walter Pachey propone vincular tecnica, organizacion y reflexion del estudiante.
`;

const model = buildStudyDocumentModel(sampleText, 'Material de prueba');
const analysis = analyzePdfDocument(
  Buffer.from('%PDF-1.4 /Type /Page /Subtype /Image', 'latin1'),
  sampleText,
  4
);

assert.ok(model.sections.length >= 2, 'El modelo deberia detectar al menos dos secciones.');
assert.ok(model.sectionTitles.some((title) => /aprendizaje autorregulado/i.test(title)));
assert.ok(
  model.conceptIndex.some((concept) => /perma/i.test(concept.term) || /perma/i.test(concept.detail))
);
assert.equal(
  analysis.hasSelectableText,
  true,
  'El analizador deberia detectar texto seleccionable en el ejemplo.'
);
assert.equal(
  analysis.hasEmbeddedImages,
  true,
  'El analizador deberia detectar imagenes embebidas cuando aparecen tokens PDF.'
);
assert.equal(
  analysis.processingStrategy,
  'hybrid_text',
  'El analizador deberia proponer estrategia hibrida para contenido mixto.'
);

const summary = summarizeExtractedText(sampleText, 'Material de prueba');
assert.ok(summary.sections.length >= 2, 'El resumen local deberia reflejar varias secciones.');
assert.ok(summary.keyPoints.length >= 3, 'El resumen local deberia producir puntos clave utiles.');

const glossary = buildStudentMaterialGlossary(sampleText, {
  ...summary,
  status: 'ready',
  provider: 'test',
  errorMessage: null,
  sourceChunksCount: model.chunkCount,
});

assert.ok(glossary.length >= 4, 'El glosario deberia detectar varios conceptos utiles.');
assert.ok(
  glossary.some(
    (item) => /autorregulado/i.test(item.term) || /autorregulado/i.test(item.definition)
  )
);
assert.ok(
  !glossary.some((item) => /^(importante|ejemplo|definicion|clave de estudio)$/i.test(item.term)),
  'El glosario no deberia incluir etiquetas de formato como terminos.'
);

const smartRecoverySelection = selectPedagogicalRecoveryChunkNumbers({
  expectedChunkNumbers: [1, 2, 3],
  missingChunkNumbers: [2, 3],
  chunks: [
    {
      text: 'La fotosíntesis transforma energía luminosa en energía química mediante reacciones organizadas.',
      pageStart: 1,
      pageEnd: 1,
    },
    {
      text: 'Material de estudio · Unidad 1 · Página 1',
      pageStart: 1,
      pageEnd: 1,
    },
    {
      text: 'Definición y clasificación: los pigmentos fotosintéticos se clasifican según el espectro que absorben. El proceso incluye captación de luz, transferencia de electrones y síntesis de ATP, con diferencias funcionales entre pigmentos.',
      pageStart: 1,
      pageEnd: 1,
    },
  ],
});
assert.deepEqual(
  smartRecoverySelection,
  [3],
  'La recuperación inteligente debe omitir chrome/continuaciones de una página ya cubierta y recuperar el bloque académico sustantivo.'
);

const cleanedPages = cleanRepeatedPageChrome([
  'UNIVERSIDAD EVALUO\nUnidad 1\nLa memoria de trabajo permite sostener información.\nPágina 1',
  'UNIVERSIDAD EVALUO\nUnidad 2\nLa práctica de recuperación fortalece el aprendizaje.\nPágina 2',
  'UNIVERSIDAD EVALUO\nUnidad 3\nLa memoria de trabajo permite resolver una actividad.\nPágina 3',
]);
assert.equal(cleanedPages.length, 3);
assert.ok(cleanedPages.every((page) => !page.includes('UNIVERSIDAD EVALUO')));
assert.ok(cleanedPages.every((page) => !/Página \d/.test(page)));
assert.ok(
  cleanedPages.filter((page) => page.includes('La memoria de trabajo')).length === 2,
  'La limpieza no debe borrar contenido académico repetido dentro del cuerpo.'
);

async function buildPdfExtractionRegressionFixture() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pageSize: [number, number] = [595, 842];
  const header = 'UNIVERSIDAD EVALUO - MATERIAL DE ESTUDIO';

  const addChrome = (
    page: ReturnType<PDFDocument['addPage']>,
    pageNumber: number
  ) => {
    page.drawText(header, { x: 40, y: 805, size: 10, font });
    page.drawText(`Pagina ${pageNumber}`, { x: 40, y: 24, size: 10, font });
  };

  const page1 = pdf.addPage(pageSize);
  addChrome(page1, 1);
  page1.drawText('TABLA DE APRENDIZAJE', { x: 40, y: 760, size: 14, font });
  page1.drawText('Tipo', { x: 40, y: 720, size: 10, font });
  page1.drawText('Como funciona y ejemplos', { x: 260, y: 720, size: 10, font });

  page1.drawText('Supervisado', { x: 40, y: 695, size: 10, font });
  page1.drawText('Aprende con respuestas correctas.', { x: 260, y: 695, size: 10, font });
  page1.drawText('Sirve para clasificacion y prediccion.', {
    x: 260,
    y: 681,
    size: 10,
    font,
  });

  page1.drawText('No supervisado', { x: 40, y: 650, size: 10, font });
  page1.drawText('Busca grupos y estructuras.', { x: 260, y: 650, size: 10, font });
  page1.drawText('Detecta patrones desconocidos.', {
    x: 260,
    y: 636,
    size: 10,
    font,
  });

  page1.drawText('Por refuerzo', { x: 40, y: 605, size: 10, font });
  page1.drawText('Aprende mediante recompensas y penalizaciones.', {
    x: 260,
    y: 605,
    size: 10,
    font,
  });
  page1.drawText(
    'La tabla debe conservar cada explicacion junto al tipo de aprendizaje correspondiente.',
    { x: 40, y: 560, size: 10, font }
  );

  pdf.addPage(pageSize);

  const page3 = pdf.addPage(pageSize);
  addChrome(page3, 3);
  page3.drawText('UNIDAD 3. GENERALIZACION', { x: 40, y: 760, size: 14, font });
  page3.drawText(
    'La generalizacion permite aplicar un modelo a ejemplos que no fueron utilizados durante el entrenamiento.',
    { x: 40, y: 720, size: 10, font }
  );
  page3.drawText(
    'Una evaluacion correcta separa los datos de entrenamiento de los datos empleados para comprobar rendimiento.',
    { x: 40, y: 700, size: 10, font }
  );
  page3.drawText(
    'La pagina debe conservar su numero fisico aunque la pagina anterior no contenga texto seleccionable.',
    { x: 40, y: 680, size: 10, font }
  );

  const page4 = pdf.addPage(pageSize);
  addChrome(page4, 4);
  page4.drawText('UNIDAD 4. EVALUACION', { x: 40, y: 760, size: 14, font });
  page4.drawText(
    'La evaluacion analiza el rendimiento del modelo y los tipos de error que pueden aparecer en situaciones reales.',
    { x: 40, y: 720, size: 10, font }
  );
  page4.drawText(
    'La trazabilidad debe indicar que este contenido pertenece a la pagina fisica cuatro del documento original.',
    { x: 40, y: 700, size: 10, font }
  );
  page4.drawText(
    'Los encabezados y pies repetidos no deben formar parte del contenido academico persistido.',
    { x: 40, y: 680, size: 10, font }
  );

  return Buffer.from(await pdf.save());
}

const extractionFixture = await extractTextFromPdfBuffer(
  await buildPdfExtractionRegressionFixture()
);

assert.equal(extractionFixture.pageCount, 4, 'PDF.js debe conservar las cuatro páginas físicas.');
assert.equal(
  extractionFixture.pages?.length,
  4,
  'La extracción debe devolver una entrada por cada página física.'
);
assert.equal(
  extractionFixture.pages?.[1] ?? '__missing__',
  '',
  'Una página sin texto debe mantenerse vacía sin desplazar la numeración posterior.'
);

const extractionPage1 = extractionFixture.pages?.[0] ?? '';
assert.match(
  extractionPage1,
  /\| Supervisado \| Aprende con respuestas correctas\. Sirve para clasificacion y prediccion\. \|/,
  'Una celda multilínea debe permanecer dentro de la fila Supervisado.'
);
assert.match(
  extractionPage1,
  /\| No supervisado \| Busca grupos y estructuras\. Detecta patrones desconocidos\. \|/,
  'Una celda multilínea debe permanecer dentro de la fila No supervisado.'
);
assert.match(
  extractionPage1,
  /\| Por refuerzo \| Aprende mediante recompensas y penalizaciones\. \|/,
  'La última fila de la tabla debe conservarse completa.'
);
assert.ok(
  !extractionPage1.includes('UNIVERSIDAD EVALUO'),
  'El encabezado repetido debe eliminarse del texto académico.'
);
assert.ok(
  !/Pagina 1/.test(extractionPage1),
  'El pie de página repetido debe eliminarse del texto académico.'
);

for (const pageIndex of [2, 3]) {
  const page = extractionFixture.pages?.[pageIndex] ?? '';
  assert.ok(
    !page.includes('UNIVERSIDAD EVALUO'),
    `El encabezado repetido debe eliminarse de la página ${pageIndex + 1}.`
  );
  assert.ok(
    !new RegExp(`Pagina ${pageIndex + 1}`).test(page),
    `El pie repetido debe eliminarse de la página ${pageIndex + 1}.`
  );
}

const extractionTraceableChunks = buildTraceableSummaryChunks(
  extractionFixture.pages,
  extractionFixture.text
);
const extractionPhysicalPages = new Set(
  extractionTraceableChunks
    .map((chunk) => chunk.pageStart)
    .filter((page): page is number => typeof page === 'number')
);

assert.ok(extractionPhysicalPages.has(1), 'Debe haber chunks trazables de la página 1.');
assert.ok(extractionPhysicalPages.has(3), 'Debe conservarse la página física 3.');
assert.ok(extractionPhysicalPages.has(4), 'Debe conservarse la página física 4.');
assert.ok(
  !extractionPhysicalPages.has(2),
  'La página física 2 vacía no debe producir chunks ficticios.'
);

const traceableChunks = buildTraceableSummaryChunks(
  [
    'UNIDAD 1. MEMORIA\n\nLa memoria de trabajo permite sostener información durante una actividad compleja, comparar alternativas, resolver problemas y tomar decisiones fundamentadas.',
    'UNIDAD 2. APRENDIZAJE\n\nLa recuperación activa fortalece el aprendizaje al exigir que el estudiante recuerde sin releer, explique relaciones y aplique los conceptos en situaciones nuevas.',
  ],
  ''
);
assert.equal(traceableChunks.length, 2);
assert.deepEqual(
  traceableChunks.map((chunk) => chunk.pageStart),
  [1, 2]
);
assert.ok(traceableChunks.every((chunk) => chunk.pageEnd === chunk.pageStart));
assert.ok(traceableChunks.every((chunk) => chunk.contentHash.length === 64));
assert.match(traceableChunks[0]?.sectionTitle ?? '', /MEMORIA/i);
const longStructuredMaterial = Array.from(
  { length: 50 },
  (_, index) =>
    `UNIDAD ${index + 1}. CONTENIDO ${index + 1}\n\nEl concepto académico ${index + 1} desarrolla una explicación suficientemente extensa para comprobar que el procesamiento conserva cobertura de todo el documento y no descarta silenciosamente sus unidades finales.`
).join('\n\n');
const longModel = buildStudyDocumentModel(longStructuredMaterial, 'Documento extenso');
assert.equal(longModel.sections.length, 24, 'El modelo debe aplicar un límite amplio y explícito.');
assert.match(
  longModel.sectionTitles.at(-1) ?? '',
  /CONTENIDO 50/i,
  'Al reducir secciones debe conservar también el final del documento.'
);

const manyChunks = buildSummaryChunks(
  Array.from(
    { length: 80 },
    (_, index) =>
      `Bloque ${index + 1}. ${'Contenido académico relevante y verificable. '.repeat(12)}`
  ).join('\n\n')
);
assert.ok(
  manyChunks.length > 36,
  'El chunking no debe truncar documentos medianos en 36 fragmentos.'
);
const coveredSource = buildSummarySourceText(
  `${'x'.repeat(14_100)} MARCADOR_FINAL`,
  Array.from(
    { length: 30 },
    (_, index) => `Fragmento de cobertura ${index + 1}. MARCA_${index + 1}`
  )
);
assert.match(
  coveredSource,
  /MARCA_30/,
  'La selección para IA debe incluir el final del documento.'
);

const compactNodeA = normalizeCompactPedagogicalNode(
  {
    t: 'Material compacto',
    o: 'Primera parte del material.',
    tp: [
      {
        n: 'Aprendizaje automático',
        d: 'Los modelos aprenden patrones a partir de datos.',
        v: 'alta',
        s: [1],
      },
    ],
    c: [
      {
        n: 'Machine learning',
        d: 'Aprende patrones a partir de datos.',
        k: 'definicion',
        s: [1],
      },
    ],
    r: [],
    cl: [],
    p: [],
    f: [],
    a: [],
    e: [],
    x: [],
    cf: [],
  },
  new Set([1, 2, 3])
);

const compactNodeB = normalizeCompactPedagogicalNode(
  {
    t: 'Material compacto',
    o: 'Segunda parte del material.',
    tp: [
      {
        n: 'Aprendizaje automático',
        d: 'Los modelos aprenden patrones a partir de datos y ejemplos.',
        v: 'alta',
        s: [3, 999],
      },
    ],
    c: [
      {
        n: 'Machine learning',
        d: 'Aprende patrones a partir de datos.',
        k: 'definicion',
        s: [3],
      },
    ],
    r: [],
    cl: [],
    p: [],
    f: [],
    a: [],
    e: [],
    x: [],
    cf: [],
  },
  new Set([1, 2, 3])
);

const compactMerged = mergeCompactPedagogicalNodes([
  compactNodeA,
  compactNodeB,
]);
assert.equal(
  compactMerged.tp.length,
  1,
  'La compactación determinista debe fusionar topics duplicados exactos.'
);
assert.deepEqual(
  compactMerged.tp[0]?.s,
  [1, 3],
  'Al fusionar duplicados debe unir todos los source chunks válidos.'
);
assert.equal(
  compactMerged.c.length,
  1,
  'La compactación determinista debe fusionar conceptos equivalentes por clave.'
);
assert.deepEqual(
  compactMerged.c[0]?.s,
  [1, 3],
  'La provenance de conceptos duplicados no puede perderse.'
);

const expandedCompact = expandCompactPedagogicalNode(compactMerged);
const expandedTopics = Array.isArray(expandedCompact.topics)
  ? expandedCompact.topics
  : [];
const expandedConcepts = Array.isArray(expandedCompact.concepts)
  ? expandedCompact.concepts
  : [];

assert.deepEqual(
  (expandedTopics[0] as { sourceChunkNumbers?: number[] } | undefined)
    ?.sourceChunkNumbers,
  [1, 3],
  'La expansión al contrato canónico debe restaurar sourceChunkNumbers.'
);
assert.deepEqual(
  (expandedConcepts[0] as { sourceChunkNumbers?: number[] } | undefined)
    ?.sourceChunkNumbers,
  [1, 3],
  'La expansión debe conservar provenance de conceptos.'
);
assert.ok(
  JSON.stringify(compactMerged).length <
    JSON.stringify(expandedCompact).length,
  'La representación intermedia compacta debe serializar menos caracteres que el contrato expandido.'
);

const recoveryChunks = [
  {
    text: 'Contenido del chunk uno.',
    pageStart: 1,
    pageEnd: 1,
  },
  {
    text: 'Contenido del chunk dos.',
    pageStart: 2,
    pageEnd: 2,
  },
  {
    text: 'Contenido del chunk tres.',
    pageStart: 3,
    pageEnd: 3,
  },
];

const selectiveRecoveryGroup = buildPedagogicalMapGroupFromIndexes(
  recoveryChunks,
  [2, 1, 2, 999, -1]
);
assert.deepEqual(
  selectiveRecoveryGroup.chunkIndexes,
  [1, 2],
  'La recuperación debe reenviar únicamente índices válidos, únicos y ordenados.'
);
assert.match(selectiveRecoveryGroup.text, /\[CHUNK 2 \| PAGINA 2\]/);
assert.match(selectiveRecoveryGroup.text, /\[CHUNK 3 \| PAGINA 3\]/);
assert.doesNotMatch(
  selectiveRecoveryGroup.text,
  /CHUNK 1/,
  'La recuperación selectiva no debe volver a enviar chunks que ya tenían provenance.'
);

const partialRecoveryNode = normalizeCompactPedagogicalNode({
  t: 'Recuperación',
  o: '',
  tp: [
    {
      n: 'Tema parcial',
      d: 'Tema respaldado por dos de tres chunks.',
      v: 'alta',
      s: [1, 3],
    },
  ],
  c: [],
  r: [],
  cl: [],
  p: [],
  f: [],
  a: [],
  e: [],
  x: [],
  cf: [],
});
assert.deepEqual(
  findMissingCompactChunkNumbers([1, 2, 3], partialRecoveryNode),
  [2],
  'Debe identificar exactamente qué chunk quedó sin provenance.'
);

const recoveredMissingNode = normalizeCompactPedagogicalNode({
  t: 'Recuperación',
  o: '',
  tp: [
    {
      n: 'Tema recuperado',
      d: 'Contenido exclusivo del chunk faltante.',
      v: 'media',
      s: [2],
    },
  ],
  c: [],
  r: [],
  cl: [],
  p: [],
  f: [],
  a: [],
  e: [],
  x: [],
  cf: [],
});
const recoveredCompleteNode = mergeCompactPedagogicalNodes([
  partialRecoveryNode,
  recoveredMissingNode,
]);
assert.deepEqual(
  findMissingCompactChunkNumbers([1, 2, 3], recoveredCompleteNode),
  [],
  'Al unir el map parcial con la recuperación debe restablecerse la cobertura completa.'
);

const canonicalSummaryFixture: CanonicalPedagogicalModel = {
  title: 'Material canónico de prueba',
  overview: 'Panorama completo del material para estudiar.',
  topics: [
    {
      title: 'Fundamentos de IA',
      description: 'Define la IA y sus límites.',
      relevance: 'alta',
      pageReferences: [2, 1, 2],
    },
  ],
  concepts: [
    {
      term: 'Machine learning',
      detail: 'Aprende patrones a partir de datos.',
      kind: 'definicion',
      pageReferences: [2],
    },
  ],
  relationships: [
    {
      source: 'Machine learning',
      target: 'Inteligencia artificial',
      description: 'Machine learning es una parte de la IA.',
    },
  ],
  classifications: [
    {
      title: 'Tipos de aprendizaje',
      items: ['Supervisado', 'No supervisado', 'Por refuerzo'],
      pageReferences: [3],
    },
  ],
  processes: [
    {
      title: 'Ciclo de entrenamiento',
      steps: ['Preparar datos', 'Entrenar', 'Evaluar'],
    },
  ],
  formulas: [],
  authorsOrTheories: ['Teoría de prueba'],
  examples: ['Clasificar correos como spam o no spam.'],
  examRelevantClaims: [
    'PREGUNTA TÍPICA DE EXAMEN: diferencia reglas y aprendizaje automático.',
  ],
  confusions: ['No confundir machine learning con deep learning.'],
  chunkCount: 8,
  sourceBindings: [
    {
      kind: 'topic',
      key: 'Fundamentos de IA',
      references: [
        {
          pageStart: 1,
          pageEnd: 1,
          chunkIndexes: [0],
          excerpt: 'EXCERPT_INTERNO_QUE_NO_DEBE_LLEGAR_AL_RESUMEN',
        },
      ],
    },
    {
      kind: 'relationship',
      key: 'Machine learning → Inteligencia artificial',
      references: [
        {
          pageStart: 2,
          pageEnd: 2,
          chunkIndexes: [1],
          excerpt: 'Relación fuente.',
        },
      ],
    },
    {
      kind: 'process',
      key: 'Ciclo de entrenamiento',
      references: [
        {
          pageStart: 4,
          pageEnd: 4,
          chunkIndexes: [3],
          excerpt: 'Proceso fuente.',
        },
      ],
    },
    {
      kind: 'author_or_theory',
      key: 'Teoría de prueba',
      references: [
        {
          pageStart: 4,
          pageEnd: 4,
          chunkIndexes: [3],
          excerpt: 'Teoría fuente.',
        },
      ],
    },
    {
      kind: 'example',
      key: 'Clasificar correos como spam o no spam.',
      references: [
        {
          pageStart: 5,
          pageEnd: 5,
          chunkIndexes: [4],
          excerpt: 'Ejemplo fuente.',
        },
      ],
    },
    {
      kind: 'confusion',
      key: 'No confundir machine learning con deep learning.',
      references: [
        {
          pageStart: 6,
          pageEnd: 6,
          chunkIndexes: [5],
          excerpt: 'Confusión fuente.',
        },
      ],
    },
    {
      kind: 'exam_relevant_claim',
      key: 'PREGUNTA TÍPICA DE EXAMEN: diferencia reglas y aprendizaje automático.',
      references: [
        {
          pageStart: 7,
          pageEnd: 7,
          chunkIndexes: [6],
          excerpt: 'Consigna de práctica.',
        },
      ],
    },
  ],
};

const canonicalGlossaryFixture: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  concepts: [
    ...canonicalSummaryFixture.concepts,
    {
      term: 'Aprendizaje supervisado',
      detail: 'Aprendizaje a partir de ejemplos con una etiqueta conocida.',
      kind: 'definicion',
    },
    {
      term: 'Deep learning',
      detail: 'Aprendizaje automático que usa redes neuronales profundas para reconocer patrones complejos.',
      kind: 'definicion',
      pageReferences: [6],
    },
    {
      term: 'Material canónico de prueba',
      detail: 'Asignatura o materia correspondiente al material de estudio.',
      kind: 'definicion',
      pageReferences: [1],
    },
  ],
  sourceBindings: [
    ...(canonicalSummaryFixture.sourceBindings ?? []),
    {
      kind: 'concept',
      key: 'Aprendizaje supervisado',
      references: [
        {
          pageStart: 3,
          pageEnd: 3,
          chunkIndexes: [2],
          excerpt: 'Aprendizaje supervisado con etiquetas.',
        },
      ],
    },
  ],
};

const canonicalGlossary = buildCanonicalStudentMaterialGlossary(
  canonicalGlossaryFixture
);

assert.equal(
  CANONICAL_GLOSSARY_PROVIDER,
  'canonical-local',
  'El glosario canónico debe identificarse como una proyección local, sin nueva llamada de IA.'
);
assert.ok(
  canonicalGlossary.some((item) => item.term === 'Machine learning'),
  'El glosario canónico debe derivar entradas directamente de concepts.'
);
assert.match(
  canonicalGlossary.find((item) => item.term === 'Machine learning')?.context ?? '',
  /Ver en PDF · página 2/,
  'Los conceptos con pageReferences directas deben conservar trazabilidad física.'
);
assert.match(
  canonicalGlossary.find((item) => item.term === 'Aprendizaje supervisado')?.context ?? '',
  /Ver en PDF · página 3/,
  'El glosario debe recuperar páginas desde sourceBindings cuando el concepto no las trae directamente.'
);
assert.ok(
  canonicalGlossary.some((item) => item.term === 'Tipos de aprendizaje'),
  'Las clasificaciones canónicas útiles deben poder convertirse en entradas del glosario.'
);
assert.ok(
  !canonicalGlossary.some((item) => item.term === 'Material canónico de prueba'),
  'El glosario canónico debe excluir títulos de materia o metadatos administrativos.'
);
assert.doesNotMatch(
  JSON.stringify(canonicalGlossary),
  /PREGUNTA TÍPICA DE EXAMEN/,
  'El glosario canónico no debe mezclar consignas o claims reservados para práctica.'
);
assert.doesNotMatch(
  JSON.stringify(canonicalGlossary),
  /EXCERPT_INTERNO_QUE_NO_DEBE_LLEGAR_AL_RESUMEN|chunkIndexes/,
  'El glosario visible no debe exponer provenance interna.'
);

const denseGlossaryFixture: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  topics: [
    {
      title: 'Tema inicial',
      description: 'Conceptos introductorios.',
      relevance: 'alta',
      pageReferences: [1],
    },
    {
      title: 'Tema intermedio',
      description: 'Conceptos del centro del material.',
      relevance: 'media',
      pageReferences: [8],
    },
    {
      title: 'Tema final',
      description: 'Conceptos del cierre del material.',
      relevance: 'alta',
      pageReferences: [15],
    },
  ],
  concepts: [
    ...Array.from({ length: 70 }, (_, index) => ({
      term: `Concepto base ${String(index + 1).padStart(2, '0')}`,
      detail: `Definición pedagógica suficientemente desarrollada para el concepto ${index + 1}.`,
      kind: 'definicion' as const,
      pageReferences: [1],
    })),
    {
      term: 'Concepto representativo página 8',
      detail: 'Concepto necesario para conservar cobertura temática de la página ocho.',
      kind: 'definicion',
      pageReferences: [8],
    },
    {
      term: 'ZZZ concepto representativo página 15',
      detail: 'Concepto necesario para conservar cobertura temática de la página quince.',
      kind: 'definicion',
      pageReferences: [15],
    },
  ],
  classifications: [],
  formulas: [],
  sourceBindings: [],
};

assert.equal(
  resolveCanonicalGlossaryLimit(denseGlossaryFixture),
  34,
  'Un material de 15 páginas debe respetar la densidad canónica de 2,25 términos por página, con techo global.'
);

const denseCanonicalGlossary = buildCanonicalStudentMaterialGlossary(
  denseGlossaryFixture
);

assert.equal(
  denseCanonicalGlossary.length,
  34,
  'El glosario denso de 15 páginas debe quedar limitado a 34 entradas.'
);
// En un PDF extenso, el límite crece y conserva la parte final del contenido.
const extensiveGlossaryModel: CanonicalPedagogicalModel = {
  ...denseGlossaryFixture,
  topics: Array.from({ length: 100 }, (_, i) => ({
    title: `Unidad ${i + 1}`, description: `Tema de la página ${i + 1}`,
    relevance: i % 3 === 0 ? 'alta' as const : 'media' as const,
    pageReferences: [i + 1],
  })),
  concepts: Array.from({ length: 190 }, (_, i) => ({
    term: `Término jurídico extenso ${i + 1}`,
    detail: `Explicación particular del concepto ${i + 1} respaldada por la página indicada.`,
    kind: 'definicion' as const,
    pageReferences: [(i % 100) + 1],
  })),
};
const extensiveGlossary = buildCanonicalStudentMaterialGlossary(extensiveGlossaryModel);
assert.ok(extensiveGlossary.length >= 90 && extensiveGlossary.length <= 120,
  'La cantidad del glosario largo debe escalar sin exceder un tope razonable.');
assert.ok(extensiveGlossary.some((item) => /página 9[0-9]|página 100/i.test(item.context)),
  'El glosario largo debe representar términos del final del documento.');
assert.ok(extensiveGlossary.some((item) => item.importance === 'media'),
  'La prioridad del glosario debe permitir diferenciar términos centrales y complementarios.');

assert.ok(
  denseCanonicalGlossary.some(
    (item) => item.term === 'Concepto representativo página 8'
  ),
  'La selección debe reservar representación para temas intermedios antes de completar por prioridad global.'
);
assert.ok(
  denseCanonicalGlossary.some(
    (item) => item.term === 'ZZZ concepto representativo página 15'
  ),
  'La selección debe conservar cobertura del último tema aunque su término quede al final alfabéticamente.'
);

const canonicalSummarySource = buildCanonicalSummarySource(
  canonicalSummaryFixture
);
const canonicalSummarySourceText = buildCanonicalSummarySourceText(
  canonicalSummaryFixture
);

assert.deepEqual(
  canonicalSummarySource.topics[0]?.pageReferences,
  [1, 2],
  'La proyección debe deduplicar y ordenar páginas físicas.'
);
assert.deepEqual(
  canonicalSummarySource.relationships[0]?.pageReferences,
  [2],
  'Las relaciones deben recuperar páginas desde sourceBindings.'
);
assert.deepEqual(
  canonicalSummarySource.processes[0]?.pageReferences,
  [4],
  'Los procesos deben recuperar páginas desde sourceBindings.'
);
assert.deepEqual(
  canonicalSummarySource.authorsOrTheories[0]?.pageReferences,
  [4],
  'Autores y teorías deben conservar trazabilidad física.'
);
assert.deepEqual(
  canonicalSummarySource.examples[0]?.pageReferences,
  [5],
  'Los ejemplos deben conservar trazabilidad física.'
);
assert.deepEqual(
  canonicalSummarySource.confusions[0]?.pageReferences,
  [6],
  'Las confusiones útiles para estudiar deben conservar trazabilidad física.'
);
assert.equal(
  'examRelevantClaims' in canonicalSummarySource,
  false,
  'Las consignas o claims de examen no deben formar parte de la fuente del resumen.'
);
assert.doesNotMatch(
  canonicalSummarySourceText,
  /PREGUNTA TÍPICA DE EXAMEN/,
  'La fuente compacta del resumen no debe mezclar contenido reservado para práctica.'
);
assert.doesNotMatch(
  canonicalSummarySourceText,
  /sourceBindings|chunkIndexes|excerpt|EXCERPT_INTERNO/,
  'La fuente compacta no debe reenviar provenance interna costosa a la IA.'
);
assert.match(canonicalSummarySourceText, /Fundamentos de IA/);
assert.match(canonicalSummarySourceText, /Clasificar correos como spam o no spam/);

const canonicalGuidePrompt = buildCanonicalSummaryPrompt(
  {
    title: 'Material canónico de prueba',
    materiaName: 'Inteligencia Artificial',
  },
  canonicalSummaryFixture
);
assert.match(
  canonicalGuidePrompt,
  /source_topic_numbers/,
  'La generación canónica debe referenciar topics canónicos, no páginas inventadas por IA.'
);
assert.doesNotMatch(
  canonicalGuidePrompt,
  /PREGUNTA TÍPICA DE EXAMEN/,
  'Las consignas reservadas para práctica no deben llegar al prompt de la guía.'
);
assert.doesNotMatch(
  canonicalGuidePrompt,
  /chunkIndexes|EXCERPT_INTERNO_QUE_NO_DEBE_LLEGAR_AL_RESUMEN/,
  'La nueva generación no debe reenviar provenance interna costosa.'
);


const sourceWithOriginalEvidence: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  topics: [
    { title: 'Gasometría arterial', description: 'Valores de referencia en sangre arterial.', relevance: 'alta', pageReferences: [1] },
    { title: 'Equilibrio ácido-base', description: 'Clasificación y compensación del medio interno.', relevance: 'alta', pageReferences: [2] },
  ],
  sourceBindings: [
    {
      kind: 'topic',
      key: 'Gasometría arterial',
      references: [{
        pageStart: 1, pageEnd: 1, chunkIndexes: [0],
        excerpt: 'MARCADOR_INTERNO_NO_EXPORTAR',
      }],
    },
  ],
};
const evidencePrompt = buildCanonicalSummaryPrompt(
  {
    title: 'Bioquímica clínica',
    pages: [
      'Gasometría arterial: pH normal de 7,35 a 7,45. PaCO2 entre 35 y 45 mmHg. HCO3 entre 22 y 26 mEq/L. Todos estos valores permiten describir el equilibrio ácido-base.',
      'Equilibrio ácido-base: ante un caso clínico de acidosis metabólica, se analiza primero el pH y el bicarbonato. Luego se examina la compensación respiratoria.',
    ],
    text: '',
  },
  sourceWithOriginalEvidence
);
assert.match(
  evidencePrompt,
  /7,35 a 7,45/,
  'El resumen híbrido debe recuperar valores cuantitativos desde los chunks originales.'
);
assert.match(
  evidencePrompt,
  /caso clínico de acidosis metabólica/,
  'El resumen híbrido debe recuperar datos clínicos originales vinculados al tema.'
);
assert.doesNotMatch(
  evidencePrompt,
  /MARCADOR_INTERNO_NO_EXPORTAR|chunkIndexes/,
  'No debe filtrar excerpts o índices internos de provenance al prompt.'
);
assert.match(
  evidencePrompt,
  /Valores cuantitativos: preservá parámetro/,
  'El prompt debe exigir preservar unidades, rangos y tablas.'
);
assert.match(
  evidencePrompt,
  /Procesos: conservá secuencia/,
  'El prompt debe preservar procesos y casos.'
);
const legacyPromptWithoutPages = buildCanonicalSummaryPrompt(
  { title: 'Material sin evidencia original' },
  sourceWithOriginalEvidence
);
assert.doesNotMatch(
  legacyPromptWithoutPages,
  /7,35 a 7,45|MARCADOR_INTERNO_NO_EXPORTAR/,
  'La generación debe seguir funcionando cuando no hay páginas originales.'
);


// Regresión: el umbral de expansión no puede borrar la información detallada
// que la IA tomó de los fragmentos originales de un documento.
const preservationFixture: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  topics: [
    { title: 'Gasometría', description: 'El pH arterial, la PaCO2 y el bicarbonato permiten interpretar el equilibrio ácido base.', relevance: 'alta', pageReferences: [1] },
    { title: 'Metabolismo', description: 'Las distintas rutas metabólicas regulan la disponibilidad energética para células y tejidos.', relevance: 'alta', pageReferences: [2] },
    { title: 'Hemograma', description: 'Las fracciones celulares de la sangre permiten identificar alteraciones hematológicas relevantes.', relevance: 'alta', pageReferences: [3] },
  ],
  concepts: [],
  relationships: [],
  classifications: [],
  processes: [],
  formulas: [],
  examples: [],
  confusions: [],
  authorsOrTheories: [],
  examRelevantClaims: [],
  sourceBindings: [],
};
const preservedGuide = sanitizeCanonicalSummaryPayload(
  {
    summary_short:
      'El documento presenta tres áreas de bioquímica clínica, incluyendo interpretación de gases sanguíneos, metabolismo celular y parámetros hematológicos.',
    key_points: [
      'La gasometría permite analizar el equilibrio ácido base de la sangre.',
      'El metabolismo participa de la distribución de energía del organismo.',
      'Los resultados del hemograma permiten estudiar componentes celulares.',
      'Las diferencias de los parámetros clínicos pueden orientar al análisis.',
      'Cada sistema del material tiene conceptos centrales para interpretar.',
    ],
    sections: [
      {
        title: 'Gasometría arterial',
        body: 'Dato original importante: pH de 7,35 a 7,45 y PaCO2 de 35 a 45 mmHg.',
        source_topic_numbers: [1],
      },
      {
        title: 'Metabolismo',
        body: 'Un ejemplo breve de metabolismo vinculado al funcionamiento celular.',
        source_topic_numbers: [2],
      },
      {
        title: 'Hemograma',
        body: 'Una síntesis breve de los parámetros hematológicos.',
        source_topic_numbers: [3],
      },
    ],
  },
  preservationFixture,
  'gemini-prueba'
);
assert.equal(
  preservedGuide?.provider,
  'gemini-prueba-canonical-expanded',
  'La respuesta breve válida debe complementarse sin descartarse.'
);
assert.match(
  preservedGuide?.sections[0]?.body ?? '',
  /pH de 7,35 a 7,45 y PaCO2 de 35 a 45 mmHg/,
  'No se debe perder la información específica del PDF cuando se expande la guía.'
);
assert.match(
  preservedGuide?.sections[0]?.body ?? '',
  /Conceptos complementarios para repasar/,
  'La expansión debe aportar contexto canónico adicional cuando corresponde.'
);
assert.match(
  preservedGuide?.sections[0]?.body ?? '',
  /Ver en PDF · página 1$/,
  'La expansión debe conservar la referencia al PDF al final de la sección.'
);


// Regresión de profundidad: el material clínico/conceptual denso debe recibir
// más espacio que otro PDF de igual longitud pero sin detalles académicos.
const lengthTopics = Array.from({ length: 16 }, (_, index) => ({
  title: `Unidad clínica ${index + 1}`,
  description: `Descripción académica verificable de la unidad ${index + 1}.`,
  relevance: 'alta' as const,
  pageReferences: [index * 2 + 1, index * 2 + 2],
}));
const lightLengthModel: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  topics: lengthTopics,
  concepts: [],
  relationships: [],
  classifications: [],
  processes: [],
  formulas: [],
  authorsOrTheories: [],
  examples: [],
  examRelevantClaims: [],
  confusions: [],
  sourceBindings: [],
};
const denseLengthModel: CanonicalPedagogicalModel = {
  ...lightLengthModel,
  concepts: Array.from({ length: 84 }, (_, index) => ({
    term: `Parámetro de laboratorio ${index + 1}`,
    detail: `Significado clínico y valor de referencia del parámetro ${index + 1}.`,
    kind: 'definicion' as const,
    pageReferences: [(index % 32) + 1],
  })),
  formulas: [
    {
      expression: 'A = B / C',
      description: 'Relación cuantitativa respaldada por el material.',
      pageReferences: [16],
    },
  ],
};
function extractPlannedWords(prompt: string) {
  return Number(prompt.match(/Apuntá aproximadamente a (\d+) palabras/)?.[1] ?? 0);
}
const lightWords = extractPlannedWords(
  buildCanonicalSummaryPrompt({ title: 'PDF conceptual simple' }, lightLengthModel)
);
const denseWords = extractPlannedWords(
  buildCanonicalSummaryPrompt({ title: 'PDF clínico denso' }, denseLengthModel)
);
assert.ok(lightWords >= 3_000 && lightWords <= 3_500,
  'Un PDF de 32 páginas con baja densidad debe conservar una guía moderada.');
assert.ok(denseWords >= 5_000 && denseWords <= 7_500,
  'Un PDF de 32 páginas con alta densidad debe tener más desarrollo.');
assert.ok(denseWords > lightWords,
  'La extensión debe adaptarse a la densidad, no sólo a la cantidad de páginas.');

const canonicalGuideFallback =
  buildCanonicalStudentMaterialSummaryFallback(canonicalSummaryFixture);
assert.equal(canonicalGuideFallback.provider, 'canonical-local-fallback');
assert.equal(canonicalGuideFallback.sourceChunksCount, canonicalSummaryFixture.chunkCount);
assert.ok(
  canonicalGuideFallback.sections.length >= 3 &&
    canonicalGuideFallback.sections.length < canonicalSummarySource.topics.length,
  'El fallback canónico debe agrupar topics en capítulos moderados en lugar de crear una sección por topic.'
);
const canonicalGuideFallbackText = JSON.stringify(canonicalGuideFallback);
for (const topic of canonicalSummarySource.topics) {
  assert.ok(
    canonicalGuideFallbackText.includes(topic.description),
    `El fallback jerárquico debe conservar el contenido del topic: ${topic.title}`
  );
}
assert.match(
  canonicalGuideFallback.sections[0]?.body ?? '',
  /Ver en PDF · páginas 1, 2/,
  'La guía canónica debe conservar referencias físicas derivadas del modelo.'
);
assert.doesNotMatch(
  JSON.stringify(canonicalGuideFallback),
  /PREGUNTA TÍPICA DE EXAMEN/,
  'El fallback de guía tampoco debe mezclar consignas de práctica.'
);

assert.equal(
  resolveFlashcardLimit({
    canonicalModel: denseGlossaryFixture,
    glossary: denseCanonicalGlossary,
  }),
  20,
  'Un PDF académicamente denso debe escalar el objetivo de flashcards por encima de 12.'
);

const denseFlashcardPedagogy = buildPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: denseCanonicalGlossary,
  canonicalModel: denseGlossaryFixture,
  chunks: traceableChunks.map((chunk) => ({
    text: chunk.text,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    sectionTitle: chunk.sectionTitle,
    excerpt: '',
  })),
});
assert.equal(
  denseFlashcardPedagogy.flashcards.length,
  20,
  'Un material denso con suficiente evidencia debe producir más de 12 flashcards distintas y trazables.'
);

const veryDenseFlashcardFixture: CanonicalPedagogicalModel = {
  ...denseGlossaryFixture,
  concepts: Array.from({ length: 180 }, (_, index) => ({
    term: `Concepto intensivo ${index + 1}`,
    detail: `Definición académica suficientemente desarrollada del concepto intensivo ${index + 1}.`,
    kind: 'definicion' as const,
    pageReferences: [(index % 30) + 1],
  })),
};
assert.ok(
  resolveFlashcardLimit({
    canonicalModel: veryDenseFlashcardFixture,
    glossary: denseCanonicalGlossary,
  }) >= 45,
  'Los PDFs muy densos deben poder tener más de 30 flashcards.'
);

const pedagogy = buildPedagogicalArtifacts({
  summary: {
    ...summary,
    status: 'ready',
    provider: 'test',
    errorMessage: null,
    sourceChunksCount: 2,
  },
  glossary,
  chunks: traceableChunks.map((chunk) => ({
    text: chunk.text,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    sectionTitle: chunk.sectionTitle,
    excerpt: '',
  })),
});
assert.ok(pedagogy.flashcards.length >= 4, 'Debe generar tarjetas desde conceptos reales.');
assert.ok(pedagogy.questions.some((question) => question.type === 'multiple_choice'));
assert.ok(
  pedagogy.questions.some((question) => question.type === 'open' && question.level === 'comprender')
);
assert.ok(pedagogy.questions.every((question) => question.answer && question.explanation));
assert.ok(
  pedagogy.miniExamQuestionIds.length >= 3,
  'El mini parcial debe tener dificultad progresiva.'
);

assert.equal(resolveQuestionCategoryFactor({ pageCount: 94, topicCount: 104 }), 4);
assert.equal(resolveQuestionBankTarget({ pageCount: 94, topicCount: 104 }), 120);
assert.equal(resolveQuestionCategoryFactor({ pageCount: 22, topicCount: 27 }), 1);

const hundredPageConcepts = Array.from({ length: 100 }, (_, i) => ({
  label: `Concepto de la página ${i + 1}`,
  pageReferences: [i + 1],
}));
const distributedConcepts = selectSourceDistributedItems(
  hundredPageConcepts, 10, (item) => item.pageReferences
);
assert.equal(distributedConcepts.length, 10);
assert.deepEqual(
  distributedConcepts.map((item) => item.pageReferences[0]),
  [1, 12, 23, 34, 45, 56, 67, 78, 89, 100],
  'Muestrear a lo largo de todo el PDF, no sólo las primeras 10 páginas.'
);
const twoPerPage = selectSourceDistributedItems(
  Array.from({ length: 100 }, (_, i) => ({
    label: `Concepto ${i + 1}`,
    pageReferences: [Math.floor(i / 2) + 1],
  })),
  70,
  (item) => item.pageReferences
);
assert.equal(new Set(twoPerPage.map((item) => item.pageReferences[0])).size, 50,
  'Usar todas las páginas con evidencia antes de repetir preguntas de la misma página.');


// Material largo con evidencia académica distribuida: ampliar cobertura sin
// duplicar llamadas a la IA ni inventar preguntas fuera del modelo original.
const denseQuestionBankModel: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  topics: Array.from({ length: 100 }, (_, i) => ({
    title: `Tema ${i + 1}`,
    description: `Conceptos y relaciones del tema ${i + 1}.`,
    relevance: 'alta' as const,
    pageReferences: [i + 1],
  })),
  concepts: Array.from({ length: 150 }, (_, i) => ({
    term: `Concepto ${i + 1}`,
    detail: `Definición diferenciada del concepto ${i + 1}, con efectos sobre el proceso educativo y relación con el conocimiento científico del tema.`,
    kind: 'definicion' as const,
    pageReferences: [(i % 94) + 1],
  })),
  relationships: Array.from({ length: 90 }, (_, i) => ({
    source: `Concepto ${i + 1}`,
    target: `Concepto ${i + 2}`,
    description: `El concepto ${i + 1} favorece la comprensión del concepto ${i + 2} mediante un análisis científico verificable.`,
    pageReferences: [(i % 94) + 1],
  })),
  classifications: [],
  processes: [],
  formulas: [],
  examRelevantClaims: [],
  confusions: [],
};
const longBank = buildPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  canonicalModel: denseQuestionBankModel,
  pageCount: 94,
});
assert.ok(longBank.questions.length > 43,
  'Un PDF largo y denso debe disponer de más preguntas que el banco fijo anterior.');
assert.ok(new Set(longBank.questions.map((q) => q.topic)).size >= 35,
  'Las preguntas de PDFs extensos deben distribuirse entre conceptos diferentes.');
assert.ok(longBank.questions.length <= 120,
  'El banco extenso debe respetar un límite razonable sin llenar con contenido ficticio.');
assert.ok(longBank.questions.every((question) => question.id.startsWith('q-v11-')),
  'Las preguntas nuevas deben usar IDs incompatibles con los posicionales antiguos.');
assert.equal(
  new Set(longBank.questions.map((question) => question.id)).size,
  longBank.questions.length,
  'No puede haber colisiones de ID entre preguntas del mismo banco.'
);
assert.deepEqual(
  buildPedagogicalArtifacts({
    summary: canonicalGuideFallback,
    glossary: canonicalGlossary,
    canonicalModel: denseQuestionBankModel,
    pageCount: 94,
  }).questions.map((question) => question.id),
  longBank.questions.map((question) => question.id),
  'Las preguntas del mismo PDF deben conservar sus identificadores al reprocesar.'
);
assert.ok(longBank.questions
  .filter((question) => question.kind === 'concept' && question.type === 'multiple_choice')
  .every((question) => question.explanation.includes(question.answer)),
  'El feedback de conceptos debe explicar el contenido correcto y no sólo decir que el PDF lo respalda.'
);
const longPages = longBank.questions
  .map((item) => item.reference.pageStart)
  .filter((page): page is number => page !== null);
assert.ok(longPages.some((page) => page <= 15) && longPages.some((page) => page >= 75),
  'Un PDF largo debe generar preguntas tanto del comienzo como del final.');
assert.equal(
  new Set(longPages.map((page) => Math.ceil(page / (94 / 4)))).size,
  4,
  'Los cuatro cuartos del documento deben tener preguntas cuando la fuente las respalda.'
);
// Hay fuentes suficientes en cada capítulo: al menos una pregunta de opción
// múltiple debe vincularse de manera fiable con cada sección.
const longSummaryWithChapters = {
  ...canonicalGuideFallback,
  sections: Array.from({ length: 10 }, (_, i) => {
    const concept = i * 9 + 1;
    return {
      title: `Unidad ${i + 1}: concepto ${concept}`,
      body: `En esta unidad se estudia el Concepto ${concept} y se desarrolla su definición diferenciada dentro del proceso educativo.`,
    };
  }),
};
const chapterBank = buildPedagogicalArtifacts({
  summary: longSummaryWithChapters,
  glossary: canonicalGlossary,
  canonicalModel: denseQuestionBankModel,
  pageCount: 94,
});
const chapterAudit = analyzeQuestionBankCoverage(
  chapterBank.questions,
  longSummaryWithChapters.sections,
  94
);
assert.equal(chapterAudit.chaptersWithAutoCorrectableQuestions, 10,
  'Si el contenido canónico permite preguntar por cada capítulo, el banco debe representarlos a todos.');
assert.ok(chapterBank.questions.filter((question) => question.chapterTitle).every((question) =>
  question.reference.pageStart !== null &&
  longSummaryWithChapters.sections.some((section) => section.title === question.chapterTitle)
), 'La asociación de capítulo requiere evidencia localizada, no inferencias sin fuente.');
assert.ok(chapterBank.questions.length <= 120);

// Prueba integrada del generador ACTUAL (v2): glosario, flashcards y preguntas
// comparten el modelo académico, pero se distribuyen en todas las páginas.
const integratedLongArtifacts = buildCurrentPedagogicalArtifacts({
  summary: longSummaryWithChapters,
  glossary: extensiveGlossary,
  canonicalModel: denseQuestionBankModel,
  pageCount: 94,
});
assert.ok(
  integratedLongArtifacts.flashcards.length >= 40,
  'La implementación activa v2 debe generar más de 30 tarjetas para un material extenso.'
);
assert.ok(
  integratedLongArtifacts.questions.length > 43,
  'La práctica real del wrapper v2 debe ampliar el banco canónico.'
);
const integratedCardPages = integratedLongArtifacts.flashcards
  .map((card) => card.reference.pageStart)
  .filter((page): page is number => page !== null);
assert.ok(
  integratedCardPages.some((page) => page <= 20) &&
  integratedCardPages.some((page) => page >= 75),
  'Las flashcards de un PDF extenso deben recuperar contenidos del comienzo y del final.'
);
assert.equal(
  new Set(integratedLongArtifacts.flashcards.map((card) => normalizeForTest(card.front))).size,
  integratedLongArtifacts.flashcards.length,
  'Las tarjetas no deben repetir consignas.'
);
assert.ok(
  integratedLongArtifacts.flashcards.every(
    (card) => card.front.trim() && card.back.trim() && card.reference.excerpt.trim()
  ),
  'Ninguna flashcard debe quedar sin pregunta, respuesta ni referencia.'
);
assert.ok(
  integratedLongArtifacts.flashcards.every((card) => card.reference.pageStart !== null),
  'Con suficiente evidencia, las tarjetas del PDF largo deben permitir volver a la página.'
);


const canonicalPedagogy = buildPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  canonicalModel: canonicalGlossaryFixture,
  chunks: traceableChunks.map((chunk) => ({
    text: chunk.text,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    sectionTitle: chunk.sectionTitle,
    excerpt: '',
  })),
});

assert.equal(
  PEDAGOGICAL_ARTIFACTS_VERSION,
  15,
  'Cambiar el contrato canónico debe invalidar artefactos pedagógicos viejos.'
);
assert.ok(
  canonicalPedagogy.flashcards.some((card) => /clasifica|pasos|relación/i.test(card.front)),
  'Las flashcards canónicas deben cubrir estructura y relaciones, no sólo definiciones de glosario.'
);
assert.ok(
  canonicalPedagogy.flashcards.every(
    (card) => !card.back.includes('|') && card.reference.excerpt.length > 0
  ),
  'Las flashcards canónicas deben ser limpias y trazables a la fuente.'
);
assert.ok(
  canonicalPedagogy.flashcards.every(
    (card) => !/material canónico de prueba/i.test(card.front)
  ),
  'Las flashcards no deben convertir el título administrativo del material en contenido de estudio.'
);
const openQuestionValidationFixture: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  title: 'Validación de preguntas abiertas',
  topics: [{
    title: 'Conjuntos y comparación normativa',
    description: 'Distingue conceptos que suelen confundirse y compara marcos normativos con criterios explícitos.',
    relevance: 'alta',
    pageReferences: [1],
  }],
  concepts: [
    { term: 'Conjunto vacío', detail: 'No contiene ningún elemento.', kind: 'definicion', pageReferences: [1] },
    { term: 'Conjunto que contiene cero', detail: 'Contiene un único elemento: el número cero.', kind: 'definicion', pageReferences: [1] },
    { term: 'Ley 1420', detail: 'Buscó alfabetizar y homogeneizar la formación ciudadana.', kind: 'definicion', pageReferences: [1] },
    { term: 'Ley 26.206', detail: 'Reconoce la diversidad cultural dentro de los objetivos educativos.', kind: 'definicion', pageReferences: [1] },
  ],
  relationships: [],
  classifications: [],
  processes: [],
  formulas: [],
  authorsOrTheories: [],
  examples: [],
  examRelevantClaims: [
    'Comparación entre Ley 1420 y Ley 26.206 respecto a la diversidad cultural.',
    'Mediciones de gravedad con Galileo muestran que Europa es un cuerpo rocoso diferenciado.',
  ],
  confusions: ['Confundir conjunto vacío con conjunto que contiene cero.'],
  chunkCount: 1,
  sourceBindings: [],
};

const validatedOpenQuestions = buildPedagogicalArtifacts({
  summary: {
    ...canonicalGuideFallback,
    sections: [{
      title: 'Conjuntos y comparación normativa',
      body: 'El apartado distingue el conjunto vacío del conjunto que contiene cero y presenta diferencias entre dos marcos normativos.',
    }],
  },
  glossary: canonicalGlossary,
  canonicalModel: openQuestionValidationFixture,
  chunks: [{
    text: 'El conjunto vacío no contiene elementos. El conjunto que contiene cero tiene un único elemento. La Ley 1420 y la Ley 26.206 presentan objetivos educativos diferentes.',
    pageStart: 1,
    pageEnd: 1,
    sectionTitle: 'Conjuntos y comparación normativa',
    excerpt: '',
  }],
});

const validComparisonQuestion = validatedOpenQuestions.questions.find(
  (question) => question.kind === 'relationship' && question.type === 'open' && /Ley 1420/.test(question.prompt)
);
assert.ok(
  validComparisonQuestion &&
    /Ley 26\.206/.test(validComparisonQuestion.prompt) &&
    /alfabetizar|homogeneizar/i.test(validComparisonQuestion.answer) &&
    /diversidad cultural/i.test(validComparisonQuestion.answer),
  'Una comparación abierta debe identificar dos entidades reales y ofrecer una respuesta modelo que contraste ambas.'
);
assert.ok(
  !validatedOpenQuestions.questions.some(
    (question) => question.type === 'open' && /Galileo|cuerpo rocoso diferenciado/i.test(question.prompt)
  ),
  'Una frase que sólo contiene la palabra “diferenciado” no debe convertirse en una comparación rota.'
);

const confusionQuestion = validatedOpenQuestions.questions.find(
  (question) => question.kind === 'confusion'
);
assert.ok(
  confusionQuestion &&
    normalizeForTest(confusionQuestion.answer) !== normalizeForTest(openQuestionValidationFixture.confusions[0] ?? '') &&
    /no contiene ningún elemento/i.test(confusionQuestion.answer) &&
    /único elemento/i.test(confusionQuestion.answer),
  'La respuesta modelo de una confusión debe explicar la diferencia y no repetir literalmente la confusión.'
);

const sectionQuestion = validatedOpenQuestions.questions.find(
  (question) => question.kind === 'section'
);
assert.equal(
  sectionQuestion,
  undefined,
  'Una sola frase descriptiva no justifica generar una respuesta abierta explicativa ni mezclar contenido externo.'
);

const canonicalQuality = buildStudentMaterialPedagogicalQualityReport({
  pageCount: 7,
  pages: Array.from(
    { length: 7 },
    (_, index) =>
      `Página ${index + 1} con contenido académico suficiente para verificar cobertura canónica y trazabilidad de los artefactos de estudio.`
  ),
  documentAnalysis: {
    ...analysis,
    pageCount: 7,
    requiresOcr: false,
  },
  model: canonicalGlossaryFixture,
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  artifacts: canonicalPedagogy,
  visionUsed: false,
});

assert.notEqual(
  canonicalQuality.status,
  'fail',
  'Un material canónico con contenido, trazabilidad y artefactos útiles debe superar el quality gate.'
);
assert.equal(
  canonicalQuality.representedPageRatio,
  1,
  'El quality gate debe medir cobertura de páginas académicas representadas por el modelo.'
);
assert.equal(
  canonicalQuality.artifactReferenceRatio,
  1,
  'Flashcards y preguntas deben conservar referencia a la fuente.'
);
assert.equal(canonicalQuality.practiceCoverage?.eligibleQuestionCount,
  analyzeQuestionBankCoverage(canonicalPedagogy.questions, canonicalGuideFallback.sections, 7).eligibleQuestionCount,
  'La cobertura de práctica debe medirse con preguntas que pasan sus filtros, no con el banco bruto.'
);
assert.ok(
  canonicalQuality.practiceCoverage &&
  canonicalQuality.practiceCoverage.chaptersWithAutoCorrectableQuestions <= canonicalQuality.practiceCoverage.summaryChapterCount,
  'El indicador debe distinguir capítulos con preguntas autocorregibles.'
);
assert.ok(
  canonicalQuality.practiceSourceAudit &&
  canonicalQuality.practiceSourceAudit.questionsWithPageReference >= 0,
  'La auditoría debe registrar la trazabilidad literal por página sin declarar veracidad semántica.'
);
assert.ok(
  canonicalQuality.pedagogicalDepthScore >= 0 && canonicalQuality.pedagogicalDepthScore <= 100,
  'El quality report debe medir profundidad pedagógica como indicador independiente.'
);
if (canonicalQuality.pedagogicalDepthScore < 55) {
  assert.ok(canonicalQuality.issues.includes('pedagogical_depth_low'),
    'Cuando se omiten preguntas abiertas insuficientes debe registrarse la pérdida de profundidad.');
}
assert.ok(
  canonicalQuality.questionKindCount >= 2,
  'La medición pedagógica debe premiar variedad de tipos de preguntas.'
);
assert.ok(
  canonicalQuality.flashcardKindCount >= 2,
  'La medición pedagógica debe verificar variedad estructural de flashcards.'
);

// P0: registrar extracción, aceptación y profundidad por separado.
assert.equal(typeof canonicalQuality.extractionScore, 'number');
assert.equal(typeof canonicalQuality.bankQualityScore, 'number');
assert.equal(typeof canonicalQuality.bankAcceptanceRatio, 'number');
const rejectedFixtureQuality = buildStudentMaterialPedagogicalQualityReport({
  pageCount: 7,
  pages: Array.from({ length: 7 }, (_, index) =>
    `Página ${index + 1} con contenido académico suficiente para verificar cobertura canónica y trazabilidad de los artefactos de estudio.`
  ),
  documentAnalysis: { ...analysis, pageCount: 7, requiresOcr: false },
  model: canonicalGlossaryFixture,
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  artifacts: {
    ...canonicalPedagogy,
    integrity: { rejectedQuestions: 1, rejectedFlashcards: 0, rejectedReasons: ['model_answer_unrelated_to_source'] },
  },
  visionUsed: false,
});
assert.equal(rejectedFixtureQuality.extractionScore, canonicalQuality.extractionScore,
  'Un rechazo no cambia la calidad del texto extraído.');
assert.equal(rejectedFixtureQuality.pedagogicalDepthScore, canonicalQuality.pedagogicalDepthScore,
  'La profundidad no debe bajar por una pregunta rechazada.');
assert.equal(rejectedFixtureQuality.status, 'degraded',
  'Los rechazos siguen activando las alertas de calidad.');
assert.ok((rejectedFixtureQuality.bankQualityScore ?? 0) > 59,
  'Un solo rechazo no debe limitar la calidad del banco a 59.');
assert.ok((rejectedFixtureQuality.bankAcceptanceRatio ?? 1) < 1);

// Regresión de calidad: material con actividades abiertas pero sin diagnóstico autocorregible.
// Debe conservar sus ejercicios sin declarar que está listo para medir preparación.
const openOnlyQuality = buildStudentMaterialPedagogicalQualityReport({
  pageCount: 7,
  pages: Array.from({ length: 7 }, (_, index) =>
    `Página ${index + 1} con suficiente contenido académico para detectar preguntas sin autocorrección.`
  ),
  documentAnalysis: { ...analysis, pageCount: 7, requiresOcr: false },
  model: canonicalGlossaryFixture,
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  artifacts: {
    ...canonicalPedagogy,
    questions: canonicalPedagogy.questions.filter((question) => question.type === 'open'),
    miniExamQuestionIds: [],
  },
  visionUsed: false,
});
assert.ok(openOnlyQuality.issues.includes('diagnostic_questions_insufficient'));
assert.equal(openOnlyQuality.status, 'degraded');

const missingCanonicalQuality = buildStudentMaterialPedagogicalQualityReport({
  pageCount: 2,
  pages: [
    'Página con contenido académico suficiente para requerir una representación canónica.',
    'Segunda página con más contenido académico relevante.',
  ],
  documentAnalysis: {
    ...analysis,
    pageCount: 2,
    requiresOcr: false,
  },
  model: null,
  summary: {
    ...summary,
    status: 'ready',
    provider: 'fallback-test',
    errorMessage: null,
    sourceChunksCount: 2,
  },
  glossary,
  artifacts: pedagogy,
  visionUsed: false,
});

assert.equal(
  missingCanonicalQuality.status,
  'fail',
  'Un PDF con contenido no puede quedar listo si falta el modelo pedagógico canónico.'
);


/**
 * Regresiones tomadas de materiales reales de 2026-10-18 (sin datos de alumnos).
 * PDF Derecho Indiano: la fuente dice que las Leyes fueron consecuencia
 * del sermón; el modelo había invertido la dirección en una respuesta.
 * PDF IPC: no se puede repetir la misma definición a ambos lados de una
 * comparación deductivo/inductivo.
 */
const causalSourceChunk = {
  text: 'Aquellas leyes fueron consecuencia política y jurídica del sermón pronunciado por Fray Antonio de Montesinos en Santo Domingo.',
  pageStart: 7,
  pageEnd: 7,
  sectionTitle: 'Leyes protectoras',
  excerpt: '',
};
const reversedRelationship = {
  source: 'Sermón de Fray Antonio de Montesinos',
  target: 'Leyes de Burgos',
  description: 'El sermón fue la consecuencia política y jurídica que provocó la sanción de las Leyes de Burgos.',
  pageReferences: [7],
};
assert.equal(
  hasSourceContradictedCausalDirection(reversedRelationship, [causalSourceChunk]),
  true,
  'Debe detectar cuando el modelo invierte la causalidad que consta en el PDF.'
);
assert.equal(
  hasSourceContradictedCausalDirection({
    ...reversedRelationship,
    description: 'El sermón de Montesinos motivó la sanción de las Leyes de Burgos.',
  }, [causalSourceChunk]),
  false,
  'No debe descartar una relación que expresa correctamente la dirección causal.'
);
assert.equal(
  hasSourceContradictedCausalDirection(reversedRelationship, [{
    ...causalSourceChunk,
    pageStart: 9,
    pageEnd: 9,
  }]),
  false,
  'No debe comparar fragmentos de otra página como si fueran evidencia del concepto.'
);
const reversedRelationshipModel: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  relationships: [reversedRelationship],
  confusions: [],
  examRelevantClaims: [],
};
const reversedRelationshipResult = buildCurrentPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  canonicalModel: reversedRelationshipModel,
  chunks: [causalSourceChunk],
  pageCount: 7,
});
assert.ok(
  !reversedRelationshipResult.questions.some(
    (question) => question.kind === 'relationship' &&
      /sermón fue la consecuencia/i.test(question.answer)
  ),
  'Una relación causal refutada no puede usarse como respuesta correcta.'
);
assert.ok(
  !reversedRelationshipResult.flashcards.some(
    (card) => /sermón fue la consecuencia/i.test(card.back)
  ),
  'Una flashcard no debe reutilizar una relación causal refutada.'
);

const unsafeComparisonModel: CanonicalPedagogicalModel = {
  ...canonicalSummaryFixture,
  concepts: [
    {
      term: 'Argumento deductivo',
      detail: 'Su validez se establece por la estructura lógica de sus premisas.',
      kind: 'definicion',
      pageReferences: [7],
    },
    {
      term: 'Argumento inductivo',
      detail: 'Las premisas apoyan la conclusión con una determinada probabilidad.',
      kind: 'definicion',
      pageReferences: [8],
    },
  ],
  relationships: [],
  confusions: [
    'Confundir la validez deductiva (determinada por la estructura) con la determinación de la validez inductiva (basada en la cantidad de casos).',
  ],
  examRelevantClaims: [],
};
const unsafeComparisonOutput = buildPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  canonicalModel: unsafeComparisonModel,
  chunks: [{
    text: 'La validez deductiva se determina por la estructura, mientras el argumento inductivo ofrece una conclusión probable.',
    pageStart: 7,
    pageEnd: 7,
    sectionTitle: 'Validez deductiva e inductiva',
    excerpt: '',
  }],
});
assert.ok(
  !unsafeComparisonOutput.questions.some((question) => question.kind === 'confusion'),
  'Si las entidades comparadas no tienen evidencia específica, no se fabrica una respuesta modelo.'
);


const supportedParentheticalComparison: CanonicalPedagogicalModel = {
  ...unsafeComparisonModel,
  concepts: [
    {
      term: 'Doxa',
      detail: 'Conocimiento subjetivo y particular, basado en las apariencias.',
      kind: 'definicion',
      pageReferences: [1],
    },
    {
      term: 'Episteme',
      detail: 'Conocimiento justificado que aspira a objetividad y universalidad.',
      kind: 'definicion',
      pageReferences: [1],
    },
  ],
  confusions: [
    'Confundir doxa (conocimiento vulgar subjetivo) con episteme (conocimiento científico objetivo y universal).',
  ],
};
const supportedParentheticalOutput = buildPedagogicalArtifacts({
  summary: canonicalGuideFallback,
  glossary: canonicalGlossary,
  canonicalModel: supportedParentheticalComparison,
  chunks: [{
    text: 'La doxa es opinión no justificada y la episteme aspira al conocimiento fundamentado.',
    pageStart: 1,
    pageEnd: 1,
    sectionTitle: 'Conocimiento',
    excerpt: '',
  }],
  pageCount: 1,
});
assert.ok(
  supportedParentheticalOutput.questions.some(
    (question) =>
      question.kind === 'confusion' &&
      /doxa/i.test(question.answer) &&
      /episteme/i.test(question.answer) &&
      /subjetivo/i.test(question.answer) &&
      /objetividad/i.test(question.answer)
  ),
  'Con dos conceptos explícitos y diferentes deben conservarse las comparaciones aunque incluyan aclaraciones entre paréntesis.'
);

console.log('Student material quality smoke tests passed.');
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
} from '../lib/student-materials/canonical-summary.ts';
import {
  buildCanonicalStudentMaterialGlossary,
  CANONICAL_GLOSSARY_PROVIDER,
  resolveCanonicalGlossaryLimit,
} from '../lib/student-materials/canonical-glossary.ts';
import type { CanonicalPedagogicalModel } from '../lib/student-materials/types.ts';

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
  30,
  'Un PDF académicamente denso debe escalar el objetivo de flashcards hasta 30 en lugar de quedar fijo en 12.'
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
  30,
  'Un material denso con suficiente evidencia debe producir 30 flashcards distintas y trazables.'
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
  4,
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
assert.ok(
  canonicalQuality.pedagogicalDepthScore >= 55,
  'El quality report debe medir una profundidad pedagógica mínima además de cobertura.'
);
assert.ok(
  canonicalQuality.questionKindCount >= 2,
  'La medición pedagógica debe premiar variedad de tipos de preguntas.'
);
assert.ok(
  canonicalQuality.flashcardKindCount >= 2,
  'La medición pedagógica debe verificar variedad estructural de flashcards.'
);

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

console.log('Student material quality smoke tests passed.');
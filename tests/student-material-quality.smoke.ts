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
import { buildPedagogicalArtifacts } from '../lib/student-materials/pedagogy.ts';

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

  // Página física 2 intencionalmente vacía. Debe conservar su posición.
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
  pedagogy.questions.some((question) => question.type === 'open' && question.level === 'aplicar')
);
assert.ok(pedagogy.questions.every((question) => question.answer && question.explanation));
assert.ok(
  pedagogy.miniExamQuestionIds.length >= 3,
  'El mini parcial debe tener dificultad progresiva.'
);

console.log('Student material quality smoke tests passed.');

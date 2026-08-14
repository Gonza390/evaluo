import assert from 'node:assert/strict';
import { analyzePdfDocument, buildStudyDocumentModel, summarizeExtractedText } from '../lib/student-materials/text.ts';
import { buildStudentMaterialGlossary } from '../lib/student-materials/glossary.ts';

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
const analysis = analyzePdfDocument(Buffer.from('%PDF-1.4 /Type /Page /Subtype /Image', 'latin1'), sampleText, 4);

assert.ok(model.sections.length >= 2, 'El modelo deberia detectar al menos dos secciones.');
assert.ok(model.sectionTitles.some((title) => /aprendizaje autorregulado/i.test(title)));
assert.ok(model.conceptIndex.some((concept) => /perma/i.test(concept.term) || /perma/i.test(concept.detail)));
assert.equal(analysis.hasSelectableText, true, 'El analizador deberia detectar texto seleccionable en el ejemplo.');
assert.equal(analysis.hasEmbeddedImages, true, 'El analizador deberia detectar imagenes embebidas cuando aparecen tokens PDF.');
assert.equal(analysis.processingStrategy, 'hybrid_text', 'El analizador deberia proponer estrategia hibrida para contenido mixto.');

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
assert.ok(glossary.some((item) => /autorregulado/i.test(item.term) || /autorregulado/i.test(item.definition)));
assert.ok(
  !glossary.some((item) => /^(importante|ejemplo|definicion|clave de estudio)$/i.test(item.term)),
  'El glosario no deberia incluir etiquetas de formato como terminos.'
);

console.log('Student material quality smoke tests passed.');

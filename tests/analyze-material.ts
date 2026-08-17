import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  analyzePdfDocument,
  buildSummaryChunks,
  buildStudyDocumentModel,
  extractPdfTextAndPageCount,
} from '@/lib/student-materials/text';
import { generateStudentMaterialSummary } from '@/lib/student-materials/summary';
import { generateStudentMaterialGlossary } from '@/lib/student-materials/glossary';

const args = process.argv.slice(2);
const fileArg = args.find((arg) => !arg.startsWith('--'));
const aiMode = args.includes('--ai');

if (!fileArg) {
  console.error('Uso: node --experimental-strip-types --import ./tests/alias-loader.mjs tests/analyze-material.ts <ruta-al-pdf> [--ai]');
  console.error('  --ai  ejecuta tambien las llamadas reales de IA (resumen + glosario) e imprime el resultado.');
  process.exit(1);
}

const filePath = resolve(fileArg);
const stats = statSync(filePath);
const buffer = readFileSync(filePath);

function section(title: string) {
  console.log(`\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`);
}

section('1. ARCHIVO');
console.log(`  Ruta      : ${filePath}`);
console.log(`  Tamano    : ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} KB)`);
const isPdf = buffer.slice(0, 5).toString('latin1') === '%PDF-';
console.log(`  Firma PDF : ${isPdf ? 'OK' : 'NO (no es un PDF valido)'}`);

section('2. EXTRACCION DE TEXTO');
const { text, pageCount } = await extractPdfTextAndPageCount(buffer);
console.log(`  Paginas   : ${pageCount ?? 'desconocido'}`);
console.log(`  Texto crudo: ${text.length} caracteres`);
if (text.length < 120) {
  console.log('  >>> ADVERTENCIA: texto insuficiente (<120 chars).');
  console.log('  >>> El resumen quedara en estado "error" con el mensaje:');
  console.log('  >>>   "Este PDF no trae suficiente texto extraible para construir un resumen automatico.');
  console.log('  >>>    Puede ser un escaneo o una imagen."');
}

section('3. ANALISIS DEL DOCUMENTO (heuristica deterministica, sin IA)');
const documentAnalysis = analyzePdfDocument(buffer, text, pageCount);
const printAnalysis: Record<string, unknown> = {
  documentType: documentAnalysis.documentType,
  processingStrategy: documentAnalysis.processingStrategy,
  requiresOcr: documentAnalysis.requiresOcr,
  hasSelectableText: documentAnalysis.hasSelectableText,
  hasEmbeddedImages: documentAnalysis.hasEmbeddedImages,
  hasTables: documentAnalysis.hasTables,
  hasLists: documentAnalysis.hasLists,
  structureQuality: documentAnalysis.structureQuality,
  pageCount: documentAnalysis.pageCount,
  textLength: documentAnalysis.textLength,
  paragraphCount: documentAnalysis.paragraphCount,
  headingCount: documentAnalysis.headingCount,
  bulletCount: documentAnalysis.bulletCount,
  imageCountEstimate: documentAnalysis.imageCountEstimate,
  tableLineCount: documentAnalysis.tableLineCount,
  averageCharsPerPage: documentAnalysis.averageCharsPerPage,
  averageLinesPerPage: documentAnalysis.averageLinesPerPage,
};
for (const [key, value] of Object.entries(printAnalysis)) {
  console.log(`  ${key.padEnd(24)}: ${String(value)}`);
}
console.log(`  ${'analysisSummary'.padEnd(24)}: ${documentAnalysis.analysisSummary}`);

const verdicts: string[] = [];
if (documentAnalysis.requiresOcr) {
  verdicts.push('Estrategia ocr_recommended -> el pipeline actual NO ejecuta OCR, produce resumen de error.');
}
if (documentAnalysis.processingStrategy === 'slide_layout') {
  verdicts.push('Estrategia slide_layout -> la IA recibira instrucciones para priorizar titulos, bullets y definiciones cortas.');
}
if (documentAnalysis.processingStrategy === 'hybrid_text') {
  verdicts.push('Estrategia hybrid_text -> la IA priorizara conceptos visibles, modelos y autores.');
}
if (documentAnalysis.processingStrategy === 'text_native') {
  verdicts.push('Estrategia text_native -> lectura estructurada por temas y bloques.');
}
if (verdicts.length > 0) {
  console.log(`\n  Verdicto pipeline:`);
  for (const verdict of verdicts) {
    console.log(`    - ${verdict}`);
  }
}

section('4. MODELO DETERMINISTA (buildStudyDocumentModel)');
const model = buildStudyDocumentModel(text, 'Material de prueba');
console.log(`  Secciones detectadas : ${model.sections.length}`);
console.log(`  Conceptos en indice  : ${model.conceptIndex.length}`);
console.log(`  Chunks estimados     : ${model.chunkCount}`);
for (const section of model.sections.slice(0, 6)) {
  console.log(`    - ${section.title}`);
}

const chunks = buildSummaryChunks(text);
section('5. CHUNKS (RAG / resumen por fragmentos)');
console.log(`  Total de chunks : ${chunks.length}`);
console.log(`  Estrategia      : ${text.length <= 14_000 ? 'directo (texto completo <= 14k chars)' : 'chunked (texto > 14k chars -> previews de fragmentos)'}`);
chunks.slice(0, 3).forEach((chunk, index) => {
  console.log(`\n  [chunk ${index + 1}] ${chunk.length} chars`);
  console.log(`    ${chunk.replace(/\n/g, ' ').slice(0, 220)}...`);
});

section('6. PREVIEW DEL TEXTO LIMPIO');
console.log(text.slice(0, 1200));

if (aiMode) {
  const title = 'Material de prueba';
  const context = {
    title,
    universidadName: 'Universidad de Prueba',
    carreraName: 'Carrera de Prueba',
    materiaName: 'Materia de Prueba',
    text,
    documentAnalysis,
  };

  section('7. RESUMEN CON IA (llamada real)');
  const summaryStart = Date.now();
  try {
    const summary = await generateStudentMaterialSummary(context);
    const elapsed = ((Date.now() - summaryStart) / 1000).toFixed(1);
    console.log(`  Proveedor   : ${summary.provider}`);
    console.log(`  Estado      : ${summary.status} (${elapsed}s)`);
    console.log(`  hasContent  : ${summary.hasContent}`);
    console.log(`  errorMessage: ${summary.errorMessage ?? 'sin errores'}`);
    console.log(`  Chunks usados: ${summary.sourceChunksCount}`);
    console.log(`  Resumen corto (${summary.shortSummary.length} chars):\n`);
    console.log(`    ${summary.shortSummary}`);
    console.log(`\n  Key points (${summary.keyPoints.length}):`);
    for (const point of summary.keyPoints.slice(0, 5)) {
      console.log(`    - ${point}`);
    }
    console.log(`\n  Secciones (${summary.sections.length}):`);
    for (const sectionModel of summary.sections) {
      console.log(`    - ${sectionModel.title} (${sectionModel.body.length} chars)`);
    }

    section('8. GLOSARIO CON IA (llamada real)');
    const glossaryStart = Date.now();
    try {
      const glossary = await generateStudentMaterialGlossary(context, summary);
      console.log(`  Terminos     : ${glossary.length} (${((Date.now() - glossaryStart) / 1000).toFixed(1)}s)`);
      for (const item of glossary.slice(0, 10)) {
        console.log(`    - [${item.importance}] ${item.term}: ${item.definition.slice(0, 90)}`);
      }
      if (glossary.length > 10) {
        console.log(`    ... y ${glossary.length - 10} terminos mas`);
      }
    } catch (error) {
      console.error('  Glosario fallo:', error instanceof Error ? error.message : error);
    }
  } catch (error) {
    console.error('  Resumen con IA fallo:', error instanceof Error ? error.message : error);
  }
} else {
  section('7. RESUMEN LOCAL (sin IA, heuristica)');
  const localSummary = buildStudyDocumentModel(text, 'Material de prueba');
  console.log(`  Secciones : ${localSummary.sections.length}`);
  console.log(`  Overview  : ${localSummary.overview.slice(0, 260)}...`);
  console.log('\nUsa --ai para ejecutar las llamadas reales de resumen y glosario (costo ~1-2 centavos por archivo).');
}

console.log('\nListo.');

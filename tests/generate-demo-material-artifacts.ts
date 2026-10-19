import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  analyzePdfDocument,
  buildSummaryChunks,
  buildTraceableSummaryChunks,
  extractPdfTextAndPageCount,
  mapLocalSummaryToView,
  summarizeExtractedText,
} from '@/lib/student-materials/text';
import { generateStudentMaterialGlossary } from '@/lib/student-materials/glossary';
import { generateStudentMaterialSummary } from '@/lib/student-materials/summary';
import { buildPedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

const [inputArg, outputArg, modeArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error('Uso: generate-demo-material-artifacts.ts <pdf> <salida-json>');
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const buffer = readFileSync(inputPath);
const { text, pageCount, pages } = await extractPdfTextAndPageCount(buffer);
const documentAnalysis = analyzePdfDocument(buffer, text, pageCount);
const input = {
  title: 'IA y nuevas tecnologías',
  universidadName: 'Todas las universidades',
  carreraName: 'Todas las carreras',
  materiaName: 'Material para ingresantes',
  text,
  documentAnalysis,
  // El material oficial se genera desde el PDF completo para que la demo
  // capture también tablas, jerarquía visual y cobertura de las 15 páginas.
  pdfBuffer: buffer,
};
let summary: StudentMaterialSummary;
let glossary: StudyGlossaryItem[];
if (modeArg === '--reuse-existing') {
  const existing = JSON.parse(readFileSync(outputPath, 'utf8')) as {
    summary: StudentMaterialSummary;
    glossary: StudyGlossaryItem[];
  };
  summary = existing.summary;
  glossary = existing.glossary;
} else {
  const glossarySeed = mapLocalSummaryToView(
    summarizeExtractedText(text, input.title),
    buildSummaryChunks(text).length,
    'parallel-local-seed'
  );
  [summary, glossary] = await Promise.all([
    generateStudentMaterialSummary(input),
    generateStudentMaterialGlossary(input, glossarySeed),
  ]);
}

const traceableChunks = buildTraceableSummaryChunks(pages, text);
const pedagogicalArtifacts = buildPedagogicalArtifacts({
  summary,
  glossary,
  chunks: traceableChunks.map((chunk) => ({
    text: chunk.text,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    sectionTitle: chunk.sectionTitle,
    excerpt: '',
  })),
});

writeFileSync(
  outputPath,
  `${JSON.stringify({ pageCount, summary, glossary, pedagogicalArtifacts }, null, 2)}\n`,
  'utf8'
);
console.log(
  JSON.stringify({
    outputPath,
    pageCount,
    provider: summary.provider,
    glossaryItems: glossary.length,
    flashcards: pedagogicalArtifacts.flashcards.length,
    reusedAiArtifacts: modeArg === '--reuse-existing',
  })
);

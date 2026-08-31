import {
  analyzePdfDocument,
  extractPdfTextAndPageCount as extractPdfTextAndPageCountBase,
} from '@/lib/student-materials/text';
import { sanitizeStudocuExtractedText } from '@/lib/student-materials/studocu-sanitizer';

export type {
  AdminClient,
  GenerateSummaryInput,
  PersistSummaryArtifactsInput,
  StoredGlossaryRow,
  StudyDocumentAnalysis,
  StoredSummaryRow,
  StudyGlossaryItem,
  StudySummarySection,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

export {
  buildStudentMaterialGlossary,
  buildStudentMaterialGlossaryFromFile,
  generateStudentMaterialGlossary,
} from '@/lib/student-materials/glossary';

export {
  buildStudentMaterialSummary,
  generateStudentMaterialSummary,
} from '@/lib/student-materials/summary';

export {
  buildStudentMaterialSummaryFromFile,
  ensureStudentMaterialStudyArtifacts,
  fetchStudentMaterialGlossary,
  fetchStudentMaterialSummary,
  persistStudentMaterialGlossaryArtifacts,
  persistStudentMaterialSummaryArtifacts,
  persistStudentMaterialSummaryFromComputed,
} from '@/lib/student-materials/persistence';

export { analyzePdfDocument };

export async function extractPdfTextAndPageCount(buffer: Buffer) {
  const extracted = await extractPdfTextAndPageCountBase(buffer);
  const pages = extracted.pages?.map((page) => sanitizeStudocuExtractedText(page)) ?? null;
  const text = pages
    ? pages.filter(Boolean).join('\n\n').trim()
    : sanitizeStudocuExtractedText(extracted.text);

  return {
    ...extracted,
    text,
    pages,
  };
}

export { buildPedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
export { generatePedagogicalModel } from '@/lib/student-materials/pedagogy-ai';
export type { PedagogicalArtifacts, PedagogicalChunk } from '@/lib/student-materials/pedagogy';

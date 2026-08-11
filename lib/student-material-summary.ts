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

export { analyzePdfDocument, extractPdfTextAndPageCount } from '@/lib/student-materials/text';

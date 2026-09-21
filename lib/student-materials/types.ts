import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';

export type AdminClient = Pick<SupabaseClient<Database>, 'from' | 'storage'>;

export type GenerateSummaryInput = {
  title: string;
  universidadName?: string;
  carreraName?: string;
  materiaName?: string;
  text: string;
  pages?: string[] | null;
  documentAnalysis?: StudyDocumentAnalysis;
  pdfBuffer?: Buffer;
  materialId?: string;
  userId?: string;
};

export type PersistSummaryArtifactsInput = {
  admin: AdminClient;
  studentMaterialId: string;
  title: string;
  universidadName?: string;
  carreraName?: string;
  materiaName?: string;
  text: string;
};

export type StudySummarySection = {
  title: string;
  body: string;
};

export type StudyDocumentConcept = {
  term: string;
  detail: string;
  kind: 'definicion' | 'clasificacion' | 'autor' | 'ejemplo' | 'idea_clave';
  pageReferences?: number[];
};

export type StudyDocumentSubsection = {
  title: string;
  points: string[];
  concepts: StudyDocumentConcept[];
};

export type StudyDocumentSection = {
  title: string;
  summary: string;
  subsections: StudyDocumentSubsection[];
  concepts: StudyDocumentConcept[];
};

export type StudyDocumentModel = {
  title: string;
  overview: string;
  sectionTitles: string[];
  sections: StudyDocumentSection[];
  conceptIndex: StudyDocumentConcept[];
  chunkCount: number;
};

export type CanonicalPedagogicalSourceKind =
  | 'topic'
  | 'concept'
  | 'relationship'
  | 'classification'
  | 'process'
  | 'formula'
  | 'author_or_theory'
  | 'example'
  | 'exam_relevant_claim'
  | 'confusion';

export type CanonicalPedagogicalSourceReference = {
  pageStart: number | null;
  pageEnd: number | null;
  chunkIndexes: number[];
  excerpt: string;
};

export type CanonicalPedagogicalSourceBinding = {
  kind: CanonicalPedagogicalSourceKind;
  key: string;
  references: CanonicalPedagogicalSourceReference[];
};

export type CanonicalPedagogicalModel = {
  title: string;
  overview: string;
  topics: Array<{
    title: string;
    description: string;
    relevance: 'alta' | 'media';
    pageReferences: number[];
  }>;
  concepts: StudyDocumentConcept[];
  relationships: Array<{
    source: string;
    target: string;
    description: string;
    pageReferences?: number[];
  }>;
  classifications: Array<{
    title: string;
    items: string[];
    pageReferences?: number[];
  }>;
  processes: Array<{
    title: string;
    steps: string[];
    pageReferences?: number[];
  }>;
  formulas: Array<{
    expression: string;
    description: string;
    pageReferences?: number[];
  }>;
  authorsOrTheories: string[];
  examples: string[];
  examRelevantClaims: string[];
  confusions: string[];
  chunkCount: number;
  sourceBindings?: CanonicalPedagogicalSourceBinding[];
};

export type StudentMaterialDocumentType =
  | 'structured_text'
  | 'mixed'
  | 'slides'
  | 'scanned'
  | 'image_heavy';

export type StudentMaterialProcessingStrategy =
  | 'text_native'
  | 'hybrid_text'
  | 'slide_layout'
  | 'ocr_recommended';

export type StudyDocumentAnalysis = {
  documentType: StudentMaterialDocumentType;
  processingStrategy: StudentMaterialProcessingStrategy;
  hasSelectableText: boolean;
  hasEmbeddedImages: boolean;
  requiresOcr: boolean;
  hasTables: boolean;
  hasLists: boolean;
  structureQuality: 'high' | 'medium' | 'low';
  pageCount: number | null;
  textLength: number;
  paragraphCount: number;
  headingCount: number;
  bulletCount: number;
  imageCountEstimate: number;
  tableLineCount: number;
  averageCharsPerPage: number;
  averageLinesPerPage: number;
  analysisSummary: string;
};

export type StudyGlossaryItem = {
  term: string;
  definition: string;
  context: string;
  importance: 'alta' | 'media';
  englishTerm?: string | null;
};

export type StudentMaterialPedagogicalQualityReport = {
  version: number;
  status: 'pass' | 'degraded' | 'fail';
  score: number;
  pageCount: number | null;
  sourcePagesWithContent: number;
  representedPages: number;
  representedPageRatio: number;
  uncoveredContentPages: number[];
  academicUnitCount: number;
  malformedAcademicUnits: number;
  summarySectionCount: number;
  glossaryItemCount: number;
  flashcardCount: number;
  questionCount: number;
  miniExamQuestionCount: number;
  artifactReferenceRatio: number;
  issues: string[];
};

export type StudentMaterialSummary = {
  shortSummary: string;
  keyPoints: string[];
  sections: StudySummarySection[];
  hasContent: boolean;
  status: 'pending' | 'ready' | 'error';
  provider: string;
  errorMessage: string | null;
  sourceChunksCount: number;
};

export type StoredSummaryRow = {
  status: string;
  summary_short: string | null;
  key_points: Json | null;
  summary_sections: Json | null;
  provider: string | null;
  source_chunks_count: number | null;
  error_message: string | null;
};

export type StoredGlossaryRow = {
  status: string;
  glossary_items: Json | null;
  provider: string | null;
  error_message: string | null;
};

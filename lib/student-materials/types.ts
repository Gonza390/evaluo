import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';

export type AdminClient = Pick<SupabaseClient<Database>, 'from' | 'storage'>;

export type GenerateSummaryInput = {
  title: string;
  universidadName?: string;
  carreraName?: string;
  materiaName?: string;
  text: string;
  documentAnalysis?: StudyDocumentAnalysis;
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

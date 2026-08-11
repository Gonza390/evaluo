import type { Database } from '@/types/supabase';
import type { StudyDocumentAnalysis } from '@/lib/student-materials/types';
import type { AdminClient } from '@/lib/student-materials/types';

export type StudentMaterialProcessingUpdate = {
  processingStatus: 'uploaded' | 'processing' | 'ready' | 'failed';
  processingStage: string;
  processingProgress: number;
  processingMessage: string;
  processingError?: string | null;
  pageCount?: number | null;
  processingStrategy?: string | null;
  documentAnalysis?: StudyDocumentAnalysis | null;
};

export type ProcessableStudentMaterial = {
  id: string;
  user_id: string;
  universidad_id: string;
  carrera_id: string;
  materia_id: string;
  title: string;
  file_name: string;
  file_path: string;
};

function isMissingAnalysisColumns(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String(error.message ?? '').toLowerCase() : '';
  return message.includes('processing_strategy') || message.includes('document_analysis');
}

export async function findStudentMaterialForProcessing(
  admin: AdminClient,
  materialId: string,
  ownerUserId?: string
) {
  const query = admin
    .from('student_materials')
    .select('id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path')
    .eq('id', materialId);

  if (ownerUserId) query.eq('user_id', ownerUserId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProcessableStudentMaterial | null;
}

export async function loadStudentMaterialProcessingContext(
  admin: AdminClient,
  material: ProcessableStudentMaterial
) {
  const [fileResult, carreraResult, universidadResult, materiaResult] = await Promise.all([
    admin.storage.from('biblioteca').download(material.file_path),
    admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
    admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
    admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
  ]);

  if (fileResult.error || !fileResult.data) {
    throw new Error('No pudimos volver a leer el PDF desde almacenamiento.');
  }

  return {
    file: fileResult.data,
    carreraName: carreraResult.data?.nombre ?? undefined,
    universidadName: universidadResult.data?.nombre ?? undefined,
    materiaName: materiaResult.data?.nombre ?? undefined,
  };
}

export async function updateStudentMaterialProcessing(
  admin: AdminClient,
  materialId: string,
  input: StudentMaterialProcessingUpdate
) {
  const payload: Database['public']['Tables']['student_materials']['Update'] = {
    processing_status: input.processingStatus,
    processing_stage: input.processingStage,
    processing_progress: input.processingProgress,
    processing_message: input.processingMessage,
    processing_error: input.processingError ?? null,
  };

  if (typeof input.pageCount !== 'undefined') payload.page_count = input.pageCount;
  if (typeof input.processingStrategy !== 'undefined') payload.processing_strategy = input.processingStrategy;
  if (typeof input.documentAnalysis !== 'undefined') payload.document_analysis = input.documentAnalysis;

  let { error } = await admin.from('student_materials').update(payload).eq('id', materialId);

  if (error && isMissingAnalysisColumns(error)) {
    delete payload.processing_strategy;
    delete payload.document_analysis;
    ({ error } = await admin.from('student_materials').update(payload).eq('id', materialId));
  }

  if (error) throw error;
}

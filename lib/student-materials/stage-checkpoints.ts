import 'server-only';

import type { AdminClient } from '@/lib/student-materials/types';
import {
  isReusableSource,
  isValidOcrPage,
  type CachedPage,
  type CachedSource,
} from '@/lib/student-materials/checkpoint-contract';
import type { Json } from '@/types/supabase';

const OCR_TABLE = 'student_material_ocr_pages' as never;
const CHECKPOINT_TABLE = 'student_material_processing_checkpoints' as never;

export async function loadPageOcrCheckpoint(
  admin: AdminClient,
  materialId: string,
  fileHash: string,
  pipelineVersion: string,
  selectedPageNumbers: number[]
): Promise<CachedPage[]> {
  if (!selectedPageNumbers.length) return [];
  const { data, error } = await admin
    .from(OCR_TABLE)
    .select('page_number,content,confidence,has_math,origin')
    .eq('student_material_id', materialId)
    .eq('file_sha256', fileHash)
    .eq('pipeline_version', pipelineVersion)
    .in('page_number', selectedPageNumbers);
  if (error) throw new Error(`No se pudo recuperar el OCR guardado: ${error.message}`);

  return ((data ?? []) as unknown as Array<Record<string, unknown>>)
    .map((row) => ({
      pageNumber: Number(row.page_number),
      content: String(row.content ?? ''),
      confidence: row.confidence === 'alta' || row.confidence === 'baja'
        ? row.confidence
        : 'media' as const,
      hasMath: row.has_math === true,
      origin: row.origin === 'blank' ? 'blank' as const : 'vision' as const,
    }))
    .filter(isValidOcrPage);
}

export async function savePageOcrCheckpoint(
  admin: AdminClient,
  materialId: string,
  fileHash: string,
  pipelineVersion: string,
  pages: CachedPage[]
) {
  if (!pages.length) return;
  if (pages.some((page) => !isValidOcrPage(page))) {
    throw new Error('No se guardaron páginas de OCR incompletas.');
  }
  const { error } = await admin.from(OCR_TABLE).upsert(pages.map((page) => ({
    student_material_id: materialId,
    page_number: page.pageNumber,
    file_sha256: fileHash,
    pipeline_version: pipelineVersion,
    origin: page.origin,
    content: page.content,
    confidence: page.origin === 'vision' ? page.confidence : null,
    has_math: page.origin === 'vision' && page.hasMath,
    updated_at: new Date().toISOString(),
  })) as never, { onConflict: 'student_material_id,page_number' });
  if (error) throw new Error(`No se pudo guardar el OCR recuperado: ${error.message}`);
}

export async function loadSourceStageCheckpoint(
  admin: AdminClient,
  materialId: string,
  fileHash: string,
  pipelineVersion: string
): Promise<CachedSource | null> {
  const { data, error } = await admin
    .from(CHECKPOINT_TABLE)
    .select('file_sha256,pipeline_version,source_payload')
    .eq('student_material_id', materialId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el punto de recuperación: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as {
    file_sha256: string;
    pipeline_version: string;
    source_payload: CachedSource;
  };
  if (!isReusableSource({
    cachedHash: row.file_sha256,
    currentHash: fileHash,
    cachedVersion: row.pipeline_version,
    currentVersion: pipelineVersion,
    source: row.source_payload,
  })) return null;
  return row.source_payload;
}

export async function saveSourceStageCheckpoint(
  admin: AdminClient,
  materialId: string,
  fileHash: string,
  pipelineVersion: string,
  source: CachedSource
) {
  if (!isReusableSource({
    cachedHash: fileHash,
    currentHash: fileHash,
    cachedVersion: pipelineVersion,
    currentVersion: pipelineVersion,
    source,
  })) {
    throw new Error('El OCR no tiene cobertura suficiente para guardar la etapa de lectura.');
  }
  const { error } = await admin.from(CHECKPOINT_TABLE).upsert({
    student_material_id: materialId,
    file_sha256: fileHash,
    pipeline_version: pipelineVersion,
    stage: 'source_ready',
    source_payload: source as unknown as Json,
    updated_at: new Date().toISOString(),
  } as never, { onConflict: 'student_material_id' });
  if (error) throw new Error(`No se pudo guardar la etapa de lectura: ${error.message}`);
}

export async function markPedagogicalStageCheckpoint(
  admin: AdminClient,
  materialId: string,
  fileHash: string,
  pipelineVersion: string
) {
  const { error } = await admin.from(CHECKPOINT_TABLE)
    .update({
      stage: 'model_ready',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('student_material_id', materialId)
    .eq('file_sha256', fileHash)
    .eq('pipeline_version', pipelineVersion);
  if (error) throw new Error(`No se pudo registrar la etapa pedagógica: ${error.message}`);
}

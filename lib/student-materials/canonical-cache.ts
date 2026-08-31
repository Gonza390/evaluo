import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import type { Database, Json } from '@/types/supabase';
import {
  buildStudentMaterialContentFingerprint,
  STUDENT_MATERIAL_PIPELINE_VERSION,
} from '@/lib/student-materials/canonical-cache-key';

type SummaryRow = Database['public']['Tables']['student_material_summaries']['Row'];
type GlossaryRow = Database['public']['Tables']['student_material_glossaries']['Row'];
type ChunkRow = Database['public']['Tables']['student_material_chunks']['Row'];

type CacheSourceMaterial = Database['public']['Tables']['student_materials']['Row'] & {
  content_fingerprint?: string | null;
  pipeline_version?: string | null;
  reused_from_material_id?: string | null;
  pedagogical_model?: Json | null;
};

export type StudentMaterialCanonicalCacheResult = {
  hit: boolean;
  fingerprint: string;
  pipelineVersion: string;
  sourceMaterialId: string | null;
  chunkCount: number;
  summaryProvider: string | null;
  glossaryProvider: string | null;
  glossaryItemCount: number;
};

function countGlossaryItems(value: Json) {
  return Array.isArray(value) ? value.length : 0;
}

async function markCacheIdentity(input: {
  materialId: string;
  fingerprint: string;
  reusedFromMaterialId?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('student_materials')
    .update(
      {
        content_fingerprint: input.fingerprint,
        pipeline_version: STUDENT_MATERIAL_PIPELINE_VERSION,
        reused_from_material_id: input.reusedFromMaterialId ?? null,
      } as never
    )
    .eq('id', input.materialId);

  if (error) throw error;
}

async function findCacheSource(input: {
  materialId: string;
  materiaId: string;
  fingerprint: string;
}) {
  const admin = createAdminClient();
  const query = admin
    .from('student_materials')
    .select('*')
    .eq('materia_id', input.materiaId)
    .eq('processing_status', 'ready')
    .eq('content_fingerprint' as never, input.fingerprint as never)
    .eq(
      'pipeline_version' as never,
      STUDENT_MATERIAL_PIPELINE_VERSION as never
    )
    .neq('id', input.materialId)
    .order('updated_at', { ascending: false })
    .limit(3);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as CacheSourceMaterial[];
}

async function loadSourceArtifacts(sourceMaterialId: string) {
  const admin = createAdminClient();
  const [summaryResult, glossaryResult, chunksResult] = await Promise.all([
    admin
      .from('student_material_summaries')
      .select('*')
      .eq('student_material_id', sourceMaterialId)
      .maybeSingle(),
    admin
      .from('student_material_glossaries')
      .select('*')
      .eq('student_material_id', sourceMaterialId)
      .maybeSingle(),
    admin
      .from('student_material_chunks')
      .select('*')
      .eq('student_material_id', sourceMaterialId)
      .order('chunk_index', { ascending: true }),
  ]);

  if (summaryResult.error) throw summaryResult.error;
  if (glossaryResult.error) throw glossaryResult.error;
  if (chunksResult.error) throw chunksResult.error;

  const summary = summaryResult.data as SummaryRow | null;
  const glossary = glossaryResult.data as GlossaryRow | null;
  const chunks = (chunksResult.data ?? []) as ChunkRow[];

  if (
    !summary ||
    summary.status !== 'ready' ||
    !glossary ||
    glossary.status !== 'ready' ||
    chunks.length === 0
  ) {
    return null;
  }

  return { summary, glossary, chunks };
}

async function replaceTargetArtifacts(input: {
  targetMaterialId: string;
  source: CacheSourceMaterial;
  summary: SummaryRow;
  glossary: GlossaryRow;
  chunks: ChunkRow[];
  fingerprint: string;
}) {
  const admin = createAdminClient();

  const deleteResults = await Promise.all([
    admin
      .from('student_material_chunks')
      .delete()
      .eq('student_material_id', input.targetMaterialId),
    admin
      .from('student_material_summaries')
      .delete()
      .eq('student_material_id', input.targetMaterialId),
    admin
      .from('student_material_glossaries')
      .delete()
      .eq('student_material_id', input.targetMaterialId),
  ]);

  for (const result of deleteResults) {
    if (result.error) throw result.error;
  }

  const chunkPayload = input.chunks.map((chunk) => ({
    student_material_id: input.targetMaterialId,
    chunk_index: chunk.chunk_index,
    chunk_text: chunk.chunk_text,
    page_start: chunk.page_start,
    page_end: chunk.page_end,
    section_title: chunk.section_title,
    content_hash: chunk.content_hash,
  }));

  const [chunkInsert, summaryInsert, glossaryInsert] = await Promise.all([
    admin.from('student_material_chunks').insert(chunkPayload),
    admin.from('student_material_summaries').insert({
      student_material_id: input.targetMaterialId,
      status: input.summary.status,
      summary_short: input.summary.summary_short,
      key_points: input.summary.key_points,
      summary_sections: input.summary.summary_sections,
      source_chunks_count: input.summary.source_chunks_count,
      provider: input.summary.provider,
      error_message: input.summary.error_message,
      generated_at: input.summary.generated_at,
    }),
    admin.from('student_material_glossaries').insert({
      student_material_id: input.targetMaterialId,
      status: input.glossary.status,
      glossary_items: input.glossary.glossary_items,
      provider: input.glossary.provider,
      error_message: input.glossary.error_message,
      generated_at: input.glossary.generated_at,
    }),
  ]);

  if (chunkInsert.error) throw chunkInsert.error;
  if (summaryInsert.error) throw summaryInsert.error;
  if (glossaryInsert.error) throw glossaryInsert.error;

  const { error: materialUpdateError } = await admin
    .from('student_materials')
    .update(
      {
        content_fingerprint: input.fingerprint,
        pipeline_version: STUDENT_MATERIAL_PIPELINE_VERSION,
        reused_from_material_id: input.source.id,
        pedagogical_model: input.source.pedagogical_model ?? null,
      } as never
    )
    .eq('id', input.targetMaterialId);

  if (materialUpdateError) throw materialUpdateError;
}

export async function tryReuseStudentMaterialCanonicalArtifacts(input: {
  materialId: string;
  materiaId: string;
  text: string;
}): Promise<StudentMaterialCanonicalCacheResult> {
  const fingerprint = buildStudentMaterialContentFingerprint({
    text: input.text,
    materiaId: input.materiaId,
  });

  const miss: StudentMaterialCanonicalCacheResult = {
    hit: false,
    fingerprint,
    pipelineVersion: STUDENT_MATERIAL_PIPELINE_VERSION,
    sourceMaterialId: null,
    chunkCount: 0,
    summaryProvider: null,
    glossaryProvider: null,
    glossaryItemCount: 0,
  };

  try {
    await markCacheIdentity({
      materialId: input.materialId,
      fingerprint,
      reusedFromMaterialId: null,
    });

    const candidates = await findCacheSource({
      materialId: input.materialId,
      materiaId: input.materiaId,
      fingerprint,
    });

    for (const source of candidates) {
      const artifacts = await loadSourceArtifacts(source.id);
      if (!artifacts) continue;

      await replaceTargetArtifacts({
        targetMaterialId: input.materialId,
        source,
        summary: artifacts.summary,
        glossary: artifacts.glossary,
        chunks: artifacts.chunks,
        fingerprint,
      });

      logInfo('studentMaterials.canonicalCache.hit', {
        materialId: input.materialId,
        sourceMaterialId: source.id,
        pipelineVersion: STUDENT_MATERIAL_PIPELINE_VERSION,
        chunkCount: artifacts.chunks.length,
      });

      return {
        hit: true,
        fingerprint,
        pipelineVersion: STUDENT_MATERIAL_PIPELINE_VERSION,
        sourceMaterialId: source.id,
        chunkCount: artifacts.chunks.length,
        summaryProvider: artifacts.summary.provider,
        glossaryProvider: artifacts.glossary.provider,
        glossaryItemCount: countGlossaryItems(artifacts.glossary.glossary_items),
      };
    }

    return miss;
  } catch (error) {
    logError('studentMaterials.canonicalCache', error, {
      materialId: input.materialId,
      pipelineVersion: STUDENT_MATERIAL_PIPELINE_VERSION,
    });
    return miss;
  }
}

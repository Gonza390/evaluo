import { buildPedagogicalArtifacts } from '@/lib/student-material-summary';
import { logError } from '@/lib/observability';

export const CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION = 1;

type BuildInput = Parameters<typeof buildPedagogicalArtifacts>[0];
type Artifacts = ReturnType<typeof buildPedagogicalArtifacts>;
type UntypedAdmin = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CI unblock for PDF-first merge
  from: (table: string) => any;
};

type LoadInput = {
  admin: unknown;
  materialId: string;
  summary: BuildInput['summary'];
  glossary: BuildInput['glossary'];
};

export async function loadOrBuildPedagogicalArtifacts({
  admin,
  materialId,
  summary,
  glossary,
}: LoadInput): Promise<Artifacts> {
  const db = admin as UntypedAdmin;
  const { data: cachedRow, error: cachedError } = await db
    .from('student_materials')
    .select('pedagogical_artifacts, pedagogical_artifacts_version')
    .eq('id', materialId)
    .maybeSingle();

  if (
    !cachedError &&
    cachedRow?.pedagogical_artifacts_version === CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION &&
    cachedRow?.pedagogical_artifacts
  ) {
    return cachedRow.pedagogical_artifacts as Artifacts;
  }

  const [{ data: sourceChunks, error: chunksError }, { data: modelRow, error: modelError }] =
    await Promise.all([
      db
        .from('student_material_chunks')
        .select('chunk_text, page_start, page_end, section_title')
        .eq('student_material_id', materialId)
        .order('chunk_index', { ascending: true }),
      db
        .from('student_materials')
        .select('pedagogical_model')
        .eq('id', materialId)
        .maybeSingle(),
    ]);

  if (chunksError) throw chunksError;
  if (modelError) throw modelError;

  const canonicalModel = (modelRow?.pedagogical_model ?? null) as BuildInput['canonicalModel'];
  const artifacts = buildPedagogicalArtifacts({
    summary,
    glossary,
    canonicalModel,
    chunks: (sourceChunks ?? []).map((chunk: {
      chunk_text: string;
      page_start: number | null;
      page_end: number | null;
      section_title: string | null;
    }) => ({
      text: chunk.chunk_text,
      pageStart: chunk.page_start,
      pageEnd: chunk.page_end,
      sectionTitle: chunk.section_title,
      excerpt: '',
    })),
  });

  const { error: persistError } = await db
    .from('student_materials')
    .update({
      pedagogical_artifacts: artifacts,
      pedagogical_artifacts_version: CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION,
    })
    .eq('id', materialId);

  if (persistError) {
    logError('studentMaterial.pedagogicalArtifacts.persist', persistError);
  }

  return artifacts;
}

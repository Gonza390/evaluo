import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { selectPedagogicalConcepts } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';

type QueryClient = Pick<SupabaseClient<Database>, 'from'>;

export type StudentMaterial = Database['public']['Tables']['student_materials']['Row'];

export type SharedStudentMaterialStudyArtifacts = {
  summary: boolean;
  glossary: boolean;
  flashcards: boolean;
  exercises: boolean;
  count: number;
  complete: boolean;
};

export type SharedStudentMaterial = StudentMaterial & {
  study_artifacts: SharedStudentMaterialStudyArtifacts;
};

const EMPTY_STUDY_ARTIFACTS: SharedStudentMaterialStudyArtifacts = {
  summary: false,
  glossary: false,
  flashcards: false,
  exercises: false,
  count: 0,
  complete: false,
};

function parseGlossaryItems(value: unknown): StudyGlossaryItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is StudyGlossaryItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.term === 'string' &&
      typeof candidate.definition === 'string' &&
      typeof candidate.context === 'string' &&
      (candidate.importance === 'alta' || candidate.importance === 'media')
    );
  });
}

function countSummarySections(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function buildStudyArtifacts(
  summary: {
    status: string | null;
    summary_short: string | null;
    summary_sections: unknown;
  } | undefined,
  glossary: {
    status: string | null;
    glossary_items: unknown;
  } | undefined
): SharedStudentMaterialStudyArtifacts {
  const summarySectionsCount = countSummarySections(summary?.summary_sections);
  const hasSummary =
    summary?.status === 'ready' &&
    (Boolean(summary.summary_short?.trim()) || summarySectionsCount > 0);

  const glossaryItems = glossary?.status === 'ready' ? parseGlossaryItems(glossary.glossary_items) : [];
  const pedagogicalConcepts = selectPedagogicalConcepts(glossaryItems, 12);
  const hasGlossary = glossaryItems.length > 0;
  const hasFlashcards = pedagogicalConcepts.length > 0;
  const hasExercises = summary?.status === 'ready' && summarySectionsCount > 0;
  const count = [hasSummary, hasGlossary, hasFlashcards, hasExercises].filter(Boolean).length;

  return {
    summary: hasSummary,
    glossary: hasGlossary,
    flashcards: hasFlashcards,
    exercises: hasExercises,
    count,
    complete: count === 4,
  };
}

export async function fetchSharedStudentMaterialsByMateria(
  client: QueryClient,
  materiaId: string,
  limit = 6
): Promise<SharedStudentMaterial[]> {
  const { data, error } = await client
    .from('student_materials')
    .select(
      'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, mime_type, file_size_bytes, page_count, visibility, processing_status, created_at, updated_at'
    )
    .eq('materia_id', materiaId)
    .eq('visibility', 'shared')
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false })
    .limit(Math.max(limit, 12));

  if (error) {
    throw error;
  }

  const materials = (data ?? []) as StudentMaterial[];
  if (materials.length === 0) return [];

  const materialIds = materials.map((material) => material.id);
  const [summariesResult, glossariesResult] = await Promise.all([
    client
      .from('student_material_summaries')
      .select('student_material_id, status, summary_short, summary_sections')
      .in('student_material_id', materialIds),
    client
      .from('student_material_glossaries')
      .select('student_material_id, status, glossary_items')
      .in('student_material_id', materialIds),
  ]);

  const summaryByMaterialId = new Map(
    (summariesResult.error ? [] : (summariesResult.data ?? [])).map((summary) => [
      summary.student_material_id,
      summary,
    ])
  );
  const glossaryByMaterialId = new Map(
    (glossariesResult.error ? [] : (glossariesResult.data ?? [])).map((glossary) => [
      glossary.student_material_id,
      glossary,
    ])
  );

  return materials
    .map((material): SharedStudentMaterial => {
      const studyArtifacts =
        summariesResult.error && glossariesResult.error
          ? EMPTY_STUDY_ARTIFACTS
          : buildStudyArtifacts(
              summaryByMaterialId.get(material.id),
              glossaryByMaterialId.get(material.id)
            );

      return {
        ...material,
        study_artifacts: studyArtifacts,
      };
    })
    .sort((left, right) => {
      if (left.study_artifacts.complete !== right.study_artifacts.complete) {
        return left.study_artifacts.complete ? -1 : 1;
      }
      if (left.study_artifacts.count !== right.study_artifacts.count) {
        return right.study_artifacts.count - left.study_artifacts.count;
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    })
    .slice(0, limit);
}

export async function fetchSharedStudentMaterialsByCarrera(
  client: QueryClient,
  carreraId: string,
  limit = 8
) {
  // Un PDF compartido debe aparecer en todas las carreras que tengan esa
  // materia (relación N:M vía carrera_materias), no solo en la carrera con la
  // que se subió. Primero resolvemos las materias de la carrera y luego
  // filtramos los materiales por esas materias.
  const { data: carreraMaterias, error: materiasError } = await client
    .from('carrera_materias')
    .select('materia_id')
    .eq('carrera_id', carreraId);

  if (materiasError) {
    throw materiasError;
  }

  const materiaIds = (carreraMaterias ?? [])
    .map((row) => row.materia_id)
    .filter((id): id is string => Boolean(id));

  if (materiaIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('student_materials')
    .select(
      'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, mime_type, file_size_bytes, page_count, visibility, processing_status, created_at, updated_at'
    )
    .in('materia_id', materiaIds)
    .eq('visibility', 'shared')
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentMaterial[];
}

export async function fetchStudentMaterialsByUser(
  client: QueryClient,
  userId: string,
  limit = 24
) {
  const { data, error } = await client
    .from('student_materials')
    .select(
      'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, mime_type, file_size_bytes, page_count, visibility, processing_status, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentMaterial[];
}
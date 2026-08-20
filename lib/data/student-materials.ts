import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type QueryClient = Pick<SupabaseClient<Database>, 'from'>;

export type StudentMaterial = Database['public']['Tables']['student_materials']['Row'];

export async function fetchSharedStudentMaterialsByMateria(
  client: QueryClient,
  materiaId: string,
  limit = 6
) {
  const { data, error } = await client
    .from('student_materials')
    .select(
      'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, mime_type, file_size_bytes, page_count, visibility, processing_status, created_at, updated_at'
    )
    .eq('materia_id', materiaId)
    .eq('visibility', 'shared')
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentMaterial[];
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

import { createAdminClient } from '@/lib/supabase-admin';

export type ExplorarUniversidad = {
  id: string;
  nombre: string;
  carrerasCount: number;
  materiasCount: number;
};

export async function fetchExplorarUniversidades(): Promise<ExplorarUniversidad[]> {
  const admin = createAdminClient();

  const [universidadesResult, carrerasResult, carreraMateriasResult] = await Promise.all([
    admin.from('universidades').select('id, nombre').order('nombre'),
    admin.from('carreras').select('id, universidad_id'),
    admin.from('carrera_materias').select('carrera_id, materia_id'),
  ]);

  if (universidadesResult.error) {
    throw universidadesResult.error;
  }

  if (carrerasResult.error) {
    throw carrerasResult.error;
  }

  if (carreraMateriasResult.error) {
    throw carreraMateriasResult.error;
  }

  const carrerasPorUniversidad = new Map<string, string[]>();
  const materiasPorUniversidad = new Map<string, Set<string>>();
  const carreraToUniversity = new Map<string, string>();

  for (const carrera of carrerasResult.data ?? []) {
    const universityId = carrera.universidad_id;
    if (!universityId) continue;
    carreraToUniversity.set(carrera.id, universityId);
    const current = carrerasPorUniversidad.get(universityId) ?? [];
    current.push(carrera.id);
    carrerasPorUniversidad.set(universityId, current);
  }

  for (const relation of carreraMateriasResult.data ?? []) {
    const carreraId = relation.carrera_id;
    const materiaId = relation.materia_id;
    if (!carreraId || !materiaId) continue;
    const universityId = carreraToUniversity.get(carreraId);
    if (!universityId) continue;
    const current = materiasPorUniversidad.get(universityId) ?? new Set<string>();
    current.add(materiaId);
    materiasPorUniversidad.set(universityId, current);
  }

  return (universidadesResult.data ?? []).map((universidad) => ({
    id: universidad.id,
    nombre: universidad.nombre,
    carrerasCount: carrerasPorUniversidad.get(universidad.id)?.length ?? 0,
    materiasCount: materiasPorUniversidad.get(universidad.id)?.size ?? 0,
  }));
}

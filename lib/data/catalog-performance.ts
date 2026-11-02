import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  CatalogCarrera,
  CatalogContentSignals,
  CatalogUniversidad,
  ExplorarCatalogData,
} from '@/lib/data/catalog';

type QueryClient = Pick<SupabaseClient<Database>, 'from'>;
type RpcResult = { data: unknown; error: { message?: string } | null };
type RpcClient = QueryClient & {
  rpc: (name: string) => PromiseLike<RpcResult>;
};

type ContentSignalRow = {
  materia_id: string | null;
  has_questions: boolean | null;
  has_summary: boolean | null;
  has_resources: boolean | null;
  has_shared_material: boolean | null;
};

type CarreraMateriaRow = {
  carrera_id: string | null;
  materia_id: string | null;
};

async function fetchAllCarreraMaterias(client: QueryClient): Promise<CarreraMateriaRow[]> {
  const pageSize = 1000;
  const rows: CarreraMateriaRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('carrera_materias')
      .select('carrera_id, materia_id')
      .order('carrera_id')
      .order('materia_id')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = (data ?? []) as CarreraMateriaRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function fetchCatalogContentSignalsRpc(
  client: QueryClient
): Promise<CatalogContentSignals> {
  const { data, error } = await (client as RpcClient).rpc('get_catalog_content_signals');
  if (error) throw new Error(error.message || 'No se pudieron cargar las señales del catálogo.');

  const contentMateriaIds = new Set<string>();
  const questionMateriaIds = new Set<string>();

  for (const row of (data ?? []) as ContentSignalRow[]) {
    if (!row.materia_id) continue;
    if (row.has_questions) questionMateriaIds.add(row.materia_id);
    if (row.has_questions || row.has_summary || row.has_resources || row.has_shared_material) {
      contentMateriaIds.add(row.materia_id);
    }
  }

  return {
    contentMateriaIds: [...contentMateriaIds],
    questionMateriaIds: [...questionMateriaIds],
  };
}

export async function fetchExplorarCatalogDataRpc(
  client: QueryClient
): Promise<ExplorarCatalogData> {
  const [universidadesResult, carrerasResult, carreraMaterias, contentSignals] = await Promise.all([
    client.from('universidades').select('id, nombre').order('nombre'),
    client.from('carreras').select('id, nombre, universidad_id').order('nombre'),
    fetchAllCarreraMaterias(client),
    fetchCatalogContentSignalsRpc(client),
  ]);

  if (universidadesResult.error) throw universidadesResult.error;
  if (carrerasResult.error) throw carrerasResult.error;

  const universidades = (universidadesResult.data as CatalogUniversidad[] | null) ?? [];
  const carreras = (carrerasResult.data as CatalogCarrera[] | null) ?? [];

  const universityNameById = new Map(
    universidades.map((universidad) => [universidad.id, universidad.nombre])
  );
  const carrerasPorUniversidad = new Map<string, string[]>();
  const materiasPorUniversidad = new Map<string, Set<string>>();
  const materiasPorCarrera = new Map<string, Set<string>>();
  const carreraToUniversity = new Map<string, string>();
  const contentMateriaIds = new Set(contentSignals.contentMateriaIds);
  const questionMateriaIds = new Set(contentSignals.questionMateriaIds);

  for (const carrera of carreras) {
    const universityId = carrera.universidad_id;
    if (!universityId) continue;
    carreraToUniversity.set(carrera.id, universityId);
    const current = carrerasPorUniversidad.get(universityId) ?? [];
    current.push(carrera.id);
    carrerasPorUniversidad.set(universityId, current);
  }

  for (const relation of carreraMaterias) {
    const carreraId = relation.carrera_id;
    const materiaId = relation.materia_id;
    if (!carreraId || !materiaId) continue;

    const currentCareerMaterias = materiasPorCarrera.get(carreraId) ?? new Set<string>();
    currentCareerMaterias.add(materiaId);
    materiasPorCarrera.set(carreraId, currentCareerMaterias);

    const universityId = carreraToUniversity.get(carreraId);
    if (!universityId) continue;
    const currentUniversityMaterias = materiasPorUniversidad.get(universityId) ?? new Set<string>();
    currentUniversityMaterias.add(materiaId);
    materiasPorUniversidad.set(universityId, currentUniversityMaterias);
  }

  return {
    universidades: universidades.map((universidad) => ({
      id: universidad.id,
      nombre: universidad.nombre,
      carrerasCount: carrerasPorUniversidad.get(universidad.id)?.length ?? 0,
      materiasCount: materiasPorUniversidad.get(universidad.id)?.size ?? 0,
    })),
    carreras: carreras.map((carrera) => {
      const materiaIds = [...(materiasPorCarrera.get(carrera.id) ?? [])];
      return {
        id: carrera.id,
        nombre: carrera.nombre,
        universidadId: carrera.universidad_id ?? null,
        universidadNombre: carrera.universidad_id
          ? (universityNameById.get(carrera.universidad_id) ?? 'Universidad')
          : 'Universidad',
        materiasCount: materiaIds.length,
        readyMateriasCount: materiaIds.filter((id) => contentMateriaIds.has(id)).length,
        questionMateriasCount: materiaIds.filter((id) => questionMateriaIds.has(id)).length,
      };
    }),
  };
}

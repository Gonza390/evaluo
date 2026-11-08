import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug, slugifySeoSegment } from '@/lib/seo-intents';
import { buildMateriaShareSlug, buildUniversityShareSegment } from '@/lib/materia-share-path';

type UniversityRow = { id: string; nombre: string };
type MateriaRow = { id: string; nombre: string; carrera_id?: string | null };

const loadUniversities = unstable_cache(
  async (): Promise<UniversityRow[]> => {
    const client = createPublicClient();
    const { data, error } = await client.from('universidades').select('id, nombre');
    if (error) return [];
    return (data ?? []).filter((row): row is UniversityRow => Boolean(row?.id && row?.nombre));
  },
  ['materia-share-universities'],
  { revalidate: 3600 }
);

async function findMateriaInUniversity(universityId: string, materiaSlug: string) {
  const client = createPublicClient();
  const { data: careers, error: careersError } = await client
    .from('carreras')
    .select('id')
    .eq('universidad_id', universityId);

  if (careersError) return null;
  const careerIds = (careers ?? []).map((row) => row.id).filter((id): id is string => Boolean(id));
  if (careerIds.length === 0) return null;

  const [{ data: links }, { data: directMaterias }] = await Promise.all([
    client.from('carrera_materias').select('materia_id').in('carrera_id', careerIds),
    client.from('materias').select('id, nombre, carrera_id').in('carrera_id', careerIds),
  ]);

  const linkedMateriaIds = Array.from(
    new Set((links ?? []).map((row) => row.materia_id).filter((id): id is string => Boolean(id)))
  );

  let linkedMaterias: MateriaRow[] = [];
  if (linkedMateriaIds.length > 0) {
    const { data } = await client
      .from('materias')
      .select('id, nombre, carrera_id')
      .in('id', linkedMateriaIds);
    linkedMaterias = (data ?? []) as MateriaRow[];
  }

  const materiaById = new Map<string, MateriaRow>();
  for (const materia of [...((directMaterias ?? []) as MateriaRow[]), ...linkedMaterias]) {
    if (materia?.id && materia?.nombre) materiaById.set(materia.id, materia);
  }

  return (
    Array.from(materiaById.values()).find(
      (materia) => slugifySeoSegment(materia.nombre) === materiaSlug
    ) ?? null
  );
}

function universityCandidates(universities: UniversityRow[], normalizedSlug: string) {
  return universities
    .map((university) => ({
      ...university,
      shareSegment: buildUniversityShareSegment(university.nombre),
    }))
    .filter(
      (university) =>
        university.shareSegment && normalizedSlug.endsWith(`-${university.shareSegment}`)
    )
    .sort((a, b) => b.shareSegment.length - a.shareSegment.length);
}

// /[slug] recibe muchas visitas de bots probando rutas. Primero se descarta lo
// que no termina en una universidad real (con la lista ya cacheada, sin
// consultas). Lo demás se resuelve una vez por hora por slug: antes cada visita
// hacía hasta 4 consultas a Supabase.
export async function resolveMateriaShareSlug(slug: string) {
  const normalizedSlug = slugifySeoSegment(slug);
  if (!normalizedSlug) return null;
  const universities = await loadUniversities();
  if (universityCandidates(universities, normalizedSlug).length === 0) return null;
  return cachedResolveMateriaShareSlug(normalizedSlug);
}

const cachedResolveMateriaShareSlug = unstable_cache(
  async (normalizedSlug: string) => resolveMateriaShareSlugUncached(normalizedSlug),
  ['materia-share-slug-v1'],
  { revalidate: 3600 }
);

async function resolveMateriaShareSlugUncached(normalizedSlug: string) {
  const universities = await loadUniversities();
  const candidates = universityCandidates(universities, normalizedSlug);

  for (const university of candidates) {
    const materiaSlug = normalizedSlug.slice(0, -(university.shareSegment.length + 1));
    if (!materiaSlug) continue;

    const materia = await findMateriaInUniversity(university.id, materiaSlug);
    if (!materia) continue;

    return {
      materiaId: materia.id,
      materiaNombre: materia.nombre,
      universidadId: university.id,
      universidadNombre: university.nombre,
      shareSlug: buildMateriaShareSlug(materia.nombre, university.nombre),
      destination: `/explorar/materia/${buildSeoEntitySlug(materia.nombre, materia.id)}`,
    };
  }

  return null;
}

import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug, slugifySeoSegment } from '@/lib/seo-intents';

const UNIVERSITY_NOISE = [
  'universidad',
  'nacional',
  'argentina',
  'de la',
  'del',
  'de',
] as const;

const APPROVED_CREATOR_LABELS: Record<string, string> = {
  tori: 'Tori',
  fox: 'Grupo FOX',
  'tori-fox': 'Tori / Grupo FOX',
};

function compactUniversitySlug(value: string) {
  let cleaned = value.toLowerCase();
  for (const token of UNIVERSITY_NOISE) {
    cleaned = cleaned.replace(new RegExp(`\\b${token}\\b`, 'gi'), ' ');
  }

  return slugifySeoSegment(cleaned)
    .replace(/-(?=\d)/g, '')
    .replace(/(?<=\d)-/g, '');
}

export function buildMateriaShareSlug(materiaNombre: string, universidadNombre?: string | null) {
  const materiaSlug = slugifySeoSegment(materiaNombre);
  const universidadSlug = universidadNombre ? compactUniversitySlug(universidadNombre) : '';

  return universidadSlug ? `${materiaSlug}-${universidadSlug}` : materiaSlug;
}

export function buildMateriaSharePath(materiaNombre: string, universidadNombre?: string | null) {
  return `/${buildMateriaShareSlug(materiaNombre, universidadNombre)}`;
}

export function getApprovedShareCreatorLabel(rawCreator?: string | null) {
  if (!rawCreator) return null;
  return APPROVED_CREATOR_LABELS[slugifySeoSegment(rawCreator)] ?? null;
}

type UniversityRow = { id: string; nombre: string };
type MateriaRow = { id: string; nombre: string; carrera_id?: string | null };

const loadUniversities = unstable_cache(
  async (): Promise<UniversityRow[]> => {
    const client = createPublicClient();
    const { data, error } = await client.from('universidades').select('id, nombre');
    if (error) return [];
    return (data ?? []).filter(
      (row): row is UniversityRow => Boolean(row?.id && row?.nombre)
    );
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
  const careerIds = (careers ?? []).map((row) => row.id).filter(Boolean);
  if (careerIds.length === 0) return null;

  const [{ data: links }, { data: directMaterias }] = await Promise.all([
    client.from('carrera_materias').select('materia_id').in('carrera_id', careerIds),
    client.from('materias').select('id, nombre, carrera_id').in('carrera_id', careerIds),
  ]);

  const linkedMateriaIds = Array.from(
    new Set((links ?? []).map((row) => row.materia_id).filter(Boolean))
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

export async function resolveMateriaShareSlug(slug: string) {
  const normalizedSlug = slugifySeoSegment(slug);
  if (!normalizedSlug) return null;

  const universities = await loadUniversities();
  const candidates = universities
    .map((university) => ({
      ...university,
      shareSegment: compactUniversitySlug(university.nombre),
    }))
    .filter(
      (university) =>
        university.shareSegment && normalizedSlug.endsWith(`-${university.shareSegment}`)
    )
    .sort((a, b) => b.shareSegment.length - a.shareSegment.length);

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

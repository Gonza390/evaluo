import { createAdminClient } from '@/lib/supabase-admin';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Siglo21QuestionSample = {
  id: string;
  enunciado: string;
  parcial: number;
  opcionesCount: number;
};

export type Siglo21PregunteroMateria = {
  materiaId: string;
  materiaNombre: string;
  universidadId: string;
  universidadNombre: string;
  carreraNombres: string[];
  totalPreguntas: number;
  preguntasParcial1: number;
  preguntasParcial2: number;
  preguntasIntegrador: number;
  samplePreguntas: Siglo21QuestionSample[];
};

export type Siglo21PregunteroHubItem = {
  materiaId: string;
  materiaNombre: string;
  totalPreguntas: number;
  preguntasParcial1: number;
  preguntasParcial2: number;
};

export function slugifySeoSegment(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildSeoEntitySlug(name: string, id: string) {
  return `${slugifySeoSegment(name)}--${id}`;
}

export function parseSeoEntitySlug(value: string) {
  const delimiterIndex = value.lastIndexOf('--');
  const rawId = delimiterIndex === -1 ? value : value.slice(delimiterIndex + 2);
  return UUID_PATTERN.test(rawId) ? rawId : null;
}

export function isSiglo21Name(value?: string | null) {
  if (!value) return false;
  const normalized = slugifySeoSegment(value);
  return normalized.includes('siglo-21') || normalized.includes('siglo-xxi');
}

async function getSiglo21University() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('universidades')
    .select('id, nombre')
    .ilike('nombre', '%Siglo 21%')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getSiglo21LinkedMateriaIds(universidadId: string) {
  const admin = createAdminClient();
  const { data: carreras, error: carreraError } = await admin
    .from('carreras')
    .select('id')
    .eq('universidad_id', universidadId);

  if (carreraError) throw carreraError;
  const carreraIds = (carreras ?? []).map((carrera) => carrera.id).filter(Boolean);
  if (carreraIds.length === 0) return new Set<string>();

  const { data: relations, error: relationError } = await admin
    .from('carrera_materias')
    .select('materia_id')
    .in('carrera_id', carreraIds);

  if (relationError) throw relationError;
  return new Set(
    (relations ?? []).map((row) => row.materia_id).filter((id): id is string => Boolean(id))
  );
}

async function getMateriaCareerContext(materiaId: string, universidadId: string) {
  const admin = createAdminClient();
  const { data: relations, error: relationError } = await admin
    .from('carrera_materias')
    .select('carrera_id')
    .eq('materia_id', materiaId);

  if (relationError) throw relationError;
  const carreraIds = Array.from(
    new Set((relations ?? []).map((row) => row.carrera_id).filter((id): id is string => Boolean(id)))
  );

  if (carreraIds.length === 0) return [];

  const { data: carreras, error: carreraError } = await admin
    .from('carreras')
    .select('id, nombre, universidad_id')
    .in('id', carreraIds)
    .eq('universidad_id', universidadId)
    .order('nombre');

  if (carreraError) throw carreraError;
  return (carreras ?? []).map((carrera) => carrera.nombre).filter(Boolean);
}

async function fetchAllMateriaQuestions(materiaId: string) {
  const admin = createAdminClient();
  const pageSize = 1000;
  const rows: Array<{
    id: string;
    enunciado: string;
    opciones: unknown;
    parcial: number | null;
    universidad_id: string | null;
  }> = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('preguntas_banco')
      .select('id, enunciado, opciones, parcial, universidad_id')
      .eq('materia_id', materiaId)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = (data ?? []) as typeof rows;
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

async function fetchHubQuestionRows(universidadId: string, linkedMateriaIds: Set<string>) {
  const admin = createAdminClient();
  const pageSize = 1000;
  const rows: Array<{
    materia_id: string | null;
    parcial: number | null;
    universidad_id: string | null;
  }> = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('preguntas_banco')
      .select('materia_id, parcial, universidad_id')
      .eq('universidad_id', universidadId)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = (data ?? []) as typeof rows;
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('preguntas_banco')
      .select('materia_id, parcial, universidad_id')
      .is('universidad_id', null)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = ((data ?? []) as typeof rows).filter(
      (row) => Boolean(row.materia_id) && linkedMateriaIds.has(String(row.materia_id))
    );
    rows.push(...batch);
    if ((data ?? []).length < pageSize) break;
  }

  return rows;
}

function mapQuestionSample(question: {
  id: string;
  enunciado: string;
  opciones: unknown;
  parcial: number | null;
}): Siglo21QuestionSample {
  return {
    id: question.id,
    enunciado: question.enunciado,
    parcial: Number(question.parcial ?? 1),
    opcionesCount: Array.isArray(question.opciones) ? question.opciones.length : 0,
  };
}

export async function getSiglo21PregunteroMateria(
  materiaId: string
): Promise<Siglo21PregunteroMateria | null> {
  if (!UUID_PATTERN.test(materiaId)) return null;

  const admin = createAdminClient();
  const universidad = await getSiglo21University();
  if (!universidad) return null;

  const [{ data: materia, error: materiaError }, carreraNombres, allQuestions] = await Promise.all([
    admin.from('materias').select('id, nombre').eq('id', materiaId).maybeSingle(),
    getMateriaCareerContext(materiaId, universidad.id),
    fetchAllMateriaQuestions(materiaId),
  ]);

  if (materiaError) throw materiaError;
  if (!materia) return null;

  const hasSiglo21Context = carreraNombres.length > 0;
  const questions = allQuestions.filter(
    (question) =>
      question.universidad_id === universidad.id ||
      (question.universidad_id === null && hasSiglo21Context)
  );

  if (!hasSiglo21Context && questions.length === 0) return null;

  const parcial1 = questions.filter((question) => Number(question.parcial ?? 1) === 1);
  const parcial2 = questions.filter((question) => Number(question.parcial ?? 1) === 2);
  const samplePreguntas = [
    ...parcial1.slice(0, 4).map(mapQuestionSample),
    ...parcial2.slice(0, 4).map(mapQuestionSample),
  ];

  return {
    materiaId: materia.id,
    materiaNombre: materia.nombre,
    universidadId: universidad.id,
    universidadNombre: universidad.nombre,
    carreraNombres,
    totalPreguntas: questions.length,
    preguntasParcial1: parcial1.length,
    preguntasParcial2: parcial2.length,
    preguntasIntegrador: parcial1.length > 0 && parcial2.length > 0 ? questions.length : 0,
    samplePreguntas,
  };
}

export async function getSiglo21PregunteroHub(): Promise<{
  universidadId: string;
  universidadNombre: string;
  items: Siglo21PregunteroHubItem[];
} | null> {
  const admin = createAdminClient();
  const universidad = await getSiglo21University();
  if (!universidad) return null;

  const linkedMateriaIds = await getSiglo21LinkedMateriaIds(universidad.id);
  const rows = await fetchHubQuestionRows(universidad.id, linkedMateriaIds);

  const counts = new Map<string, { total: number; p1: number; p2: number }>();
  for (const row of rows) {
    if (!row.materia_id) continue;
    const current = counts.get(row.materia_id) ?? { total: 0, p1: 0, p2: 0 };
    current.total += 1;
    if (Number(row.parcial ?? 1) === 1) current.p1 += 1;
    if (Number(row.parcial ?? 1) === 2) current.p2 += 1;
    counts.set(row.materia_id, current);
  }

  const materiaIds = Array.from(counts.keys());
  if (materiaIds.length === 0) {
    return { universidadId: universidad.id, universidadNombre: universidad.nombre, items: [] };
  }

  const { data: materias, error: materiaError } = await admin
    .from('materias')
    .select('id, nombre')
    .in('id', materiaIds);

  if (materiaError) throw materiaError;

  const items = (materias ?? [])
    .map((materia) => {
      const count = counts.get(materia.id) ?? { total: 0, p1: 0, p2: 0 };
      return {
        materiaId: materia.id,
        materiaNombre: materia.nombre,
        totalPreguntas: count.total,
        preguntasParcial1: count.p1,
        preguntasParcial2: count.p2,
      };
    })
    .filter((item) => item.totalPreguntas > 0)
    .sort((a, b) => b.totalPreguntas - a.totalPreguntas || a.materiaNombre.localeCompare(b.materiaNombre));

  return {
    universidadId: universidad.id,
    universidadNombre: universidad.nombre,
    items,
  };
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

type AdminCatalog = ReturnType<typeof createAdminClient>;

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function revalidateAdmin() {
  revalidatePath('/administrador');
}

async function getCareer(catalog: AdminCatalog, carreraId: string) {
  const { data, error } = await catalog
    .from('carreras')
    .select('id, universidad_id')
    .eq('id', carreraId)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; universidad_id: string | null } | null;
}

async function materiaBelongsToUniversity(catalog: AdminCatalog, materiaId: string, universidadId: string) {
  const { data: materia, error: materiaError } = await catalog
    .from('materias')
    .select('id, carrera_id')
    .eq('id', materiaId)
    .maybeSingle();

  if (materiaError) throw materiaError;
  if (!materia) return false;

  const careerIds = new Set<string>();
  if (materia.carrera_id) careerIds.add(String(materia.carrera_id));

  const { data: relations, error: relationsError } = await catalog
    .from('carrera_materias')
    .select('carrera_id')
    .eq('materia_id', materiaId);

  if (relationsError) throw relationsError;
  for (const relation of relations ?? []) {
    if (relation.carrera_id) careerIds.add(String(relation.carrera_id));
  }

  if (careerIds.size === 0) return false;

  const { data: careers, error: careersError } = await catalog
    .from('carreras')
    .select('id, universidad_id')
    .in('id', Array.from(careerIds));

  if (careersError) throw careersError;
  return (careers ?? []).some((career: { universidad_id?: string | null }) => String(career.universidad_id ?? '') === universidadId);
}

export async function crearMateriaEnCarreraAdministrador(input: {
  nombre: string;
  carreraId: string;
}): Promise<{ success: boolean; message: string; materiaId?: string }> {
  try {
    await requireAdminAccess();
    const catalog = createAdminClient();
    const nombre = input.nombre.trim();

    if (!nombre || !input.carreraId) {
      return { success: false, message: 'Completa el nombre de la materia.' };
    }

    const career = await getCareer(catalog, input.carreraId);
    if (!career?.universidad_id) {
      return { success: false, message: 'La carrera seleccionada no tiene una universidad válida.' };
    }

    const { data: materias, error: materiasError } = await catalog
      .from('materias')
      .select('id, nombre')
      .order('nombre');

    if (materiasError) throw materiasError;

    const normalized = normalizeName(nombre);
    const sameName = (materias ?? []).filter((materia: { nombre?: string | null }) => normalizeName(String(materia.nombre ?? '')) === normalized);

    let materiaId: string | null = null;
    for (const materia of sameName) {
      const belongs = await materiaBelongsToUniversity(
        catalog,
        String(materia.id),
        String(career.universidad_id)
      );
      if (belongs) {
        materiaId = String(materia.id);
        break;
      }
    }

    if (!materiaId) {
      const { data: created, error: createError } = await catalog
        .from('materias')
        .insert({
          nombre,
          carrera_id: input.carreraId,
          es_general: false,
        })
        .select('id')
        .single();

      if (createError || !created?.id) {
        throw createError ?? new Error('No pudimos crear la materia.');
      }
      materiaId = String(created.id);
    }

    const { data: existingRelation, error: relationCheckError } = await catalog
      .from('carrera_materias')
      .select('id')
      .eq('carrera_id', input.carreraId)
      .eq('materia_id', materiaId)
      .maybeSingle();

    if (relationCheckError) throw relationCheckError;

    if (!existingRelation) {
      const { error: relationError } = await catalog.from('carrera_materias').insert({
        carrera_id: input.carreraId,
        materia_id: materiaId,
      });
      if (relationError) throw relationError;
    }

    revalidateAdmin();
    return {
      success: true,
      materiaId,
      message: existingRelation
        ? 'La materia ya estaba asignada a esta carrera.'
        : sameName.length > 0
          ? 'Materia asignada correctamente dentro de la universidad.'
          : 'Materia creada y asignada correctamente.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos crear la materia.',
    };
  }
}

export async function vincularMateriaExistenteAdministrador(input: {
  materiaId: string;
  carreraId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const catalog = createAdminClient();

    if (!input.materiaId || !input.carreraId) {
      return { success: false, message: 'Selecciona una materia para vincular.' };
    }

    const career = await getCareer(catalog, input.carreraId);
    if (!career?.universidad_id) {
      return { success: false, message: 'La carrera seleccionada no tiene una universidad válida.' };
    }

    const { data: materia, error: materiaError } = await catalog
      .from('materias')
      .select('id, nombre')
      .eq('id', input.materiaId)
      .maybeSingle();

    if (materiaError) throw materiaError;
    if (!materia) {
      return { success: false, message: 'La materia seleccionada ya no existe.' };
    }

    const sameUniversity = await materiaBelongsToUniversity(
      catalog,
      input.materiaId,
      String(career.universidad_id)
    );

    if (!sameUniversity) {
      return {
        success: false,
        message: 'Solo podés vincular materias que ya pertenezcan a la misma universidad.',
      };
    }

    const { data: existing, error: existingError } = await catalog
      .from('carrera_materias')
      .select('id')
      .eq('carrera_id', input.carreraId)
      .eq('materia_id', input.materiaId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return { success: true, message: 'La materia ya estaba vinculada a esta carrera.' };
    }

    const { error: insertError } = await catalog.from('carrera_materias').insert({
      carrera_id: input.carreraId,
      materia_id: input.materiaId,
    });

    if (insertError) throw insertError;

    revalidateAdmin();
    return { success: true, message: `${materia.nombre} quedó vinculada a la carrera.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos vincular la materia.',
    };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { serializeDashboardMateriaStates } from '@/lib/dashboard-state';
import { hasCompleteAcademicProfile } from '@/lib/profile-completion';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import { isUuid } from '@/lib/uuid';

type UpdateProfileData = {
  universidad_id: string;
  carrera_id: string;
  materia_ids: string[];
};

function normalizeMateriaIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No pudimos actualizar el perfil.';
}

/**
 * Actualiza el perfil académico del usuario y persiste sus materias activas.
 * Las relaciones universidad -> carrera -> materia se validan nuevamente en servidor.
 */
export async function updateProfile(userId: string, data: UpdateProfileData) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      throw new Error('No se encontró una sesión válida para actualizar el perfil.');
    }

    const universidadId = String(data.universidad_id ?? '').trim();
    const carreraId = String(data.carrera_id ?? '').trim();
    const materiaIds = normalizeMateriaIds(data.materia_ids);

    if (!isUuid(universidadId) || !isUuid(carreraId)) {
      throw new Error('Universidad o carrera inválida.');
    }

    if (materiaIds.length === 0) {
      throw new Error('Seleccioná al menos una materia para continuar.');
    }

    if (materiaIds.some((materiaId) => !isUuid(materiaId))) {
      throw new Error('Una de las materias seleccionadas no es válida.');
    }

    const { data: carrera, error: carreraError } = await supabase
      .from('carreras')
      .select('id, universidad_id')
      .eq('id', carreraId)
      .maybeSingle();

    if (carreraError) {
      throw carreraError;
    }

    if (!carrera || carrera.universidad_id !== universidadId) {
      throw new Error('La carrera seleccionada no pertenece a esa universidad.');
    }

    const { data: relaciones, error: relacionesError } = await supabase
      .from('carrera_materias')
      .select('materia_id')
      .eq('carrera_id', carreraId)
      .in('materia_id', materiaIds);

    if (relacionesError) {
      throw relacionesError;
    }

    const materiaIdsDeCarrera = new Set(
      (relaciones ?? [])
        .map((relation) => relation.materia_id)
        .filter((materiaId): materiaId is string => Boolean(materiaId))
    );

    if (materiaIds.some((materiaId) => !materiaIdsDeCarrera.has(materiaId))) {
      throw new Error('Una de las materias seleccionadas no pertenece a esa carrera.');
    }

    const { data: materias, error: materiasError } = await supabase
      .from('materias')
      .select('id, nombre')
      .in('id', materiaIds);

    if (materiasError) {
      throw materiasError;
    }

    const materiaNameById = new Map((materias ?? []).map((materia) => [materia.id, materia.nombre]));
    const activeSubjects = materiaIds.map((materiaId) => ({
      id: materiaId,
      name: materiaNameById.get(materiaId) ?? '',
    }));

    if (activeSubjects.some((subject) => !subject.name)) {
      throw new Error('No pudimos validar todas las materias seleccionadas.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      universidad_id: universidadId,
      carrera_id: carreraId,
      active_subjects: serializeDashboardMateriaStates(activeSubjects),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logError('actions.updateProfile.upsert', error, { userId });
      throw error;
    }

    await trackServerAnalyticsEvent({
      eventName: 'profile_completed',
      userId,
      path: '/completar-perfil',
      metadata: {
        active_subject_count: materiaIds.length,
      },
    });

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/completar-perfil');

    return { success: true as const, message: 'Perfil actualizado.' };
  } catch (error) {
    logError('actions.updateProfile', error, { userId });
    return { success: false as const, message: errorMessage(error) };
  }
}

/**
 * Verifica si el usuario tiene universidad, carrera y al menos una materia activa.
 */
export async function checkProfileStatus(userId: string) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      return { isComplete: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('universidad_id, carrera_id, active_subjects')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logError('actions.checkProfileStatus.query', error, { userId });
      return { isComplete: false };
    }

    if (!data) {
      return { isComplete: false };
    }

    return {
      isComplete: hasCompleteAcademicProfile({
        universidadId: data.universidad_id,
        carreraId: data.carrera_id,
        activeSubjects: data.active_subjects,
      }),
    };
  } catch (error) {
    logError('actions.checkProfileStatus', error, { userId });
    return { isComplete: false };
  }
}

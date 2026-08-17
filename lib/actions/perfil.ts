'use server';

import { createClientServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/observability';

/**
 * Actualiza el perfil del usuario con universidad y carrera.
 */
export async function updateProfile(
  userId: string,
  data: { universidad_id: string; carrera_id: string }
) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      throw new Error('No se encontró una sesión válida para actualizar el perfil.');
    }

    const universidadIdValue = String(data.universidad_id ?? '').trim();
    const carreraIdValue = String(data.carrera_id ?? '').trim();

    if (!universidadIdValue || !carreraIdValue) {
      throw new Error('Universidad y carrera son obligatorias.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      universidad_id: universidadIdValue,
      carrera_id: carreraIdValue,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logError('actions.updateProfile.upsert', error, { userId });
      throw error;
    }

    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    logError('actions.updateProfile', error, { userId });
    return { success: false, error };
  }
}

/**
 * Verifica si el usuario tiene el perfil completo.
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
      .select('universidad_id, carrera_id')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logError('actions.checkProfileStatus.query', error, { userId });
      return { isComplete: false };
    }

    const universidadIdValue = String(data?.universidad_id ?? '').trim();
    const carreraIdValue = String(data?.carrera_id ?? '').trim();

    if (!data || !universidadIdValue || !carreraIdValue) {
      return { isComplete: false };
    }

    return { isComplete: true };
  } catch (error) {
    logError('actions.checkProfileStatus', error, { userId });
    return { isComplete: false };
  }
}

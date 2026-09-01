'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

function revalidateAdministrador() {
  revalidatePath('/administrador');
}

export async function crearFacultadAdministrador(input: {
  nombre: string;
  universidadId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const nombre = input.nombre.trim();

    if (!nombre || !input.universidadId) {
      return { success: false, message: 'Completa universidad y nombre de facultad.' };
    }

    const { data: universidad, error: universidadError } = await admin
      .from('universidades')
      .select('id')
      .eq('id', input.universidadId)
      .maybeSingle();

    if (universidadError) throw universidadError;
    if (!universidad) {
      return { success: false, message: 'La universidad seleccionada no existe.' };
    }

    const { data: existente, error: existenteError } = await admin
      .from('facultades')
      .select('id')
      .eq('universidad_id', input.universidadId)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (existenteError) throw existenteError;
    if (existente) {
      return { success: false, message: 'Esa facultad ya existe dentro de la universidad.' };
    }

    const { error } = await admin.from('facultades').insert({
      nombre,
      universidad_id: input.universidadId,
    });

    if (error) throw error;

    revalidateAdministrador();
    return { success: true, message: 'Facultad creada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos crear la facultad.',
    };
  }
}

export async function crearCarreraEnFacultadAdministrador(input: {
  nombre: string;
  universidadId: string;
  facultadId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const nombre = input.nombre.trim();

    if (!nombre || !input.universidadId || !input.facultadId) {
      return { success: false, message: 'Completa facultad y nombre de carrera.' };
    }

    const { data: facultad, error: facultadError } = await admin
      .from('facultades')
      .select('id, universidad_id')
      .eq('id', input.facultadId)
      .maybeSingle();

    if (facultadError) throw facultadError;
    if (!facultad || facultad.universidad_id !== input.universidadId) {
      return { success: false, message: 'La facultad no pertenece a la universidad seleccionada.' };
    }

    const { data: existente, error: existenteError } = await admin
      .from('carreras')
      .select('id')
      .eq('facultad_id', input.facultadId)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (existenteError) throw existenteError;
    if (existente) {
      return { success: false, message: 'Esa carrera ya existe dentro de la facultad.' };
    }

    const { error } = await admin.from('carreras').insert({
      nombre,
      universidad_id: input.universidadId,
      facultad_id: input.facultadId,
    });

    if (error) throw error;

    revalidateAdministrador();
    return { success: true, message: 'Carrera creada correctamente.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos crear la carrera.',
    };
  }
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin catalog incompleto en ServerDatabase
    const catalog = admin as any;
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

    const { data: existente, error: existenteError } = await catalog
      .from('facultades')
      .select('id')
      .eq('universidad_id', input.universidadId)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (existenteError) throw existenteError;
    if (existente) {
      return { success: false, message: 'Esa facultad ya existe dentro de la universidad.' };
    }

    const { error } = await catalog.from('facultades').insert({
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

export async function crearCarreraDirectaUniversidadAdministrador(input: {
  nombre: string;
  universidadId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin catalog incompleto en ServerDatabase
    const catalog = admin as any;
    const nombre = input.nombre.trim();

    if (!nombre || !input.universidadId) {
      return { success: false, message: 'Completa universidad y nombre de carrera.' };
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

    const { data: existente, error: existenteError } = await catalog
      .from('carreras')
      .select('id')
      .eq('universidad_id', input.universidadId)
      .is('facultad_id', null)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (existenteError) throw existenteError;
    if (existente) {
      return { success: false, message: 'Esa carrera ya existe dentro de la universidad.' };
    }

    const { error } = await catalog.from('carreras').insert({
      nombre,
      universidad_id: input.universidadId,
      facultad_id: null,
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

export async function crearCarreraEnFacultadAdministrador(input: {
  nombre: string;
  universidadId: string;
  facultadId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminAccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin catalog incompleto en ServerDatabase
    const catalog = createAdminClient() as any;
    const nombre = input.nombre.trim();

    if (!nombre || !input.universidadId || !input.facultadId) {
      return { success: false, message: 'Completa facultad y nombre de carrera.' };
    }

    const { data: facultad, error: facultadError } = await catalog
      .from('facultades')
      .select('id, universidad_id')
      .eq('id', input.facultadId)
      .maybeSingle();

    if (facultadError) throw facultadError;
    if (!facultad || facultad.universidad_id !== input.universidadId) {
      return { success: false, message: 'La facultad no pertenece a la universidad seleccionada.' };
    }

    const { data: existente, error: existenteError } = await catalog
      .from('carreras')
      .select('id')
      .eq('facultad_id', input.facultadId)
      .ilike('nombre', nombre)
      .maybeSingle();

    if (existenteError) throw existenteError;
    if (existente) {
      return { success: false, message: 'Esa carrera ya existe dentro de la facultad.' };
    }

    const { error } = await catalog.from('carreras').insert({
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

export async function obtenerEstructuraUniversidadAdministrador(
  universidadId: string
): Promise<{
  success: boolean;
  facultades?: Array<{ id: string; nombre: string; universidadId: string }>;
  carreras?: Array<{ id: string; nombre: string; universidadId: string | null; facultadId: string | null }>;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin catalog incompleto en ServerDatabase
    const catalog = createAdminClient() as any;

    if (!universidadId) {
      return { success: false, message: 'Falta la universidad.' };
    }

    const [facultadesRes, carrerasRes] = await Promise.all([
      catalog
        .from('facultades')
        .select('id, nombre, universidad_id')
        .eq('universidad_id', universidadId)
        .order('nombre'),
      catalog
        .from('carreras')
        .select('id, nombre, universidad_id, facultad_id')
        .eq('universidad_id', universidadId)
        .order('nombre'),
    ]);

    if (facultadesRes.error) throw facultadesRes.error;
    if (carrerasRes.error) throw carrerasRes.error;

    return {
      success: true,
      facultades: (facultadesRes.data ?? []).map((row: { id: string; nombre: string | null; universidad_id?: string | null; facultad_id?: string | null }) => ({
        id: String(row.id),
        nombre: String(row.nombre ?? ''),
        universidadId: String(row.universidad_id),
      })),
      carreras: (carrerasRes.data ?? []).map((row: { id: string; nombre: string | null; universidad_id?: string | null; facultad_id?: string | null }) => ({
        id: String(row.id),
        nombre: String(row.nombre ?? ''),
        universidadId: row.universidad_id ? String(row.universidad_id) : null,
        facultadId: row.facultad_id ? String(row.facultad_id) : null,
      })),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar la estructura académica.',
    };
  }
}

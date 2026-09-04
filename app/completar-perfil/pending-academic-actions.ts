'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { isUuid } from '@/lib/uuid';
import { findStrongCareerMatch, normalizeCareerName } from '@/lib/career-matching';

type PendingCareerInput = {
  universidadId: string;
  facultadNombre?: string;
  carreraNombre: string;
};

type PendingSubjectInput = {
  carreraId: string;
  materiaNombre: string;
};

type PendingCareerResult =
  | {
      success: true;
      carrera: {
        id: string;
        nombre: string;
        universidad_id: string;
        approval_status: 'approved' | 'pending';
      };
      facultad: { id: string; nombre: string; approval_status: 'approved' | 'pending' } | null;
    }
  | { success: false; message: string };

type PendingSubjectResult =
  | {
      success: true;
      materia: {
        id: string;
        nombre: string;
        approval_status: 'approved' | 'pending';
      };
    }
  | { success: false; message: string };

function normalizeName(value: unknown, max = 120) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function requireUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Iniciá sesión para completar tu perfil académico.');
  return user;
}

function visibleToUser(row: { approval_status?: string | null; owner_user_id?: string | null }, userId: string) {
  return row.approval_status === 'approved' || row.owner_user_id === userId;
}

export async function createPrivatePendingCareerAction(
  input: PendingCareerInput
): Promise<PendingCareerResult> {
  try {
    const user = await requireUser();
    const universidadId = String(input.universidadId ?? '').trim();
    const carreraNombre = normalizeName(input.carreraNombre);
    const facultadNombre = normalizeName(input.facultadNombre, 140);

    if (!isUuid(universidadId)) {
      return { success: false, message: 'La universidad seleccionada no es válida.' };
    }
    if (carreraNombre.length < 3) {
      return { success: false, message: 'Escribí el nombre completo de tu carrera.' };
    }

    const admin = createAdminClient() as any;
    const { data: universidad, error: universidadError } = await admin
      .from('universidades')
      .select('id')
      .eq('id', universidadId)
      .maybeSingle();

    if (universidadError) throw universidadError;
    if (!universidad) {
      return { success: false, message: 'No encontramos la universidad seleccionada.' };
    }

    const { data: carrerasExistentes, error: carrerasError } = await admin
      .from('carreras')
      .select('id, nombre, universidad_id, approval_status, owner_user_id, facultad_id')
      .eq('universidad_id', universidadId)
      .limit(250);

    if (carrerasError) throw carrerasError;

    const visibles = (carrerasExistentes ?? []).filter((row: any) => visibleToUser(row, user.id));
    const exacta = visibles.find(
      (row: any) => normalizeCareerName(row.nombre) === normalizeCareerName(carreraNombre)
    );
    const aprobadas = visibles.filter((row: any) => row.approval_status === 'approved');
    const coincidenciaFuerte = findStrongCareerMatch(carreraNombre, aprobadas)?.career ?? null;
    const carreraExistente = exacta ?? coincidenciaFuerte;

    if (carreraExistente) {
      return {
        success: true,
        carrera: {
          id: carreraExistente.id,
          nombre: carreraExistente.nombre,
          universidad_id: carreraExistente.universidad_id,
          approval_status: carreraExistente.approval_status === 'approved' ? 'approved' : 'pending',
        },
        facultad: null,
      };
    }

    let facultad: { id: string; nombre: string; approval_status: 'approved' | 'pending' } | null = null;

    if (facultadNombre) {
      const { data: facultadesExistentes, error: facultadesError } = await admin
        .from('facultades')
        .select('id, nombre, approval_status, owner_user_id')
        .eq('universidad_id', universidadId)
        .ilike('nombre', facultadNombre)
        .limit(20);

      if (facultadesError) throw facultadesError;

      const facultadExistente = (facultadesExistentes ?? []).find((row: any) =>
        visibleToUser(row, user.id)
      );

      if (facultadExistente) {
        facultad = {
          id: facultadExistente.id,
          nombre: facultadExistente.nombre,
          approval_status: facultadExistente.approval_status === 'approved' ? 'approved' : 'pending',
        };
      } else {
        const { data: creada, error: crearFacultadError } = await admin
          .from('facultades')
          .insert({
            universidad_id: universidadId,
            nombre: facultadNombre,
            approval_status: 'pending',
            owner_user_id: user.id,
          })
          .select('id, nombre, approval_status')
          .single();

        if (crearFacultadError) throw crearFacultadError;
        facultad = { id: creada.id, nombre: creada.nombre, approval_status: 'pending' };
      }
    }

    const { data: carreraCreada, error: crearCarreraError } = await admin
      .from('carreras')
      .insert({
        universidad_id: universidadId,
        facultad_id: facultad?.id ?? null,
        nombre: carreraNombre,
        approval_status: 'pending',
        owner_user_id: user.id,
      })
      .select('id, nombre, universidad_id, approval_status')
      .single();

    if (crearCarreraError) throw crearCarreraError;

    return {
      success: true,
      carrera: {
        id: carreraCreada.id,
        nombre: carreraCreada.nombre,
        universidad_id: carreraCreada.universidad_id,
        approval_status: 'pending',
      },
      facultad,
    };
  } catch (error) {
    logError('onboarding.createPrivatePendingCareer', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar tu carrera.',
    };
  }
}

export async function createPrivatePendingSubjectAction(
  input: PendingSubjectInput
): Promise<PendingSubjectResult> {
  try {
    const user = await requireUser();
    const carreraId = String(input.carreraId ?? '').trim();
    const materiaNombre = normalizeName(input.materiaNombre);

    if (!isUuid(carreraId)) {
      return { success: false, message: 'La carrera seleccionada no es válida.' };
    }
    if (materiaNombre.length < 2) {
      return { success: false, message: 'Escribí el nombre de la materia.' };
    }

    const admin = createAdminClient() as any;
    const { data: carrera, error: carreraError } = await admin
      .from('carreras')
      .select('id, approval_status, owner_user_id')
      .eq('id', carreraId)
      .maybeSingle();

    if (carreraError) throw carreraError;
    if (!carrera || !visibleToUser(carrera, user.id)) {
      return { success: false, message: 'No podés agregar materias a esa carrera.' };
    }

    const { data: relaciones, error: relacionesError } = await admin
      .from('carrera_materias')
      .select('materia_id, approval_status, owner_user_id, materias!inner(id, nombre, approval_status, owner_user_id)')
      .eq('carrera_id', carreraId)
      .ilike('materias.nombre', materiaNombre)
      .limit(20);

    if (relacionesError) throw relacionesError;

    const relacionExistente = (relaciones ?? []).find((row: any) => {
      const materia = Array.isArray(row.materias) ? row.materias[0] : row.materias;
      return visibleToUser(row, user.id) && materia && visibleToUser(materia, user.id);
    });

    if (relacionExistente) {
      const materia = Array.isArray(relacionExistente.materias)
        ? relacionExistente.materias[0]
        : relacionExistente.materias;
      return {
        success: true,
        materia: {
          id: materia.id,
          nombre: materia.nombre,
          approval_status: materia.approval_status === 'approved' ? 'approved' : 'pending',
        },
      };
    }

    const { data: materiaCreada, error: materiaError } = await admin
      .from('materias')
      .insert({
        nombre: materiaNombre,
        carrera_id: carreraId,
        es_general: false,
        approval_status: 'pending',
        owner_user_id: user.id,
      })
      .select('id, nombre, approval_status')
      .single();

    if (materiaError) throw materiaError;

    const { error: relacionError } = await admin.from('carrera_materias').insert({
      carrera_id: carreraId,
      materia_id: materiaCreada.id,
      prioridad: 2,
      approval_status: 'pending',
      owner_user_id: user.id,
    });

    if (relacionError) {
      await admin.from('materias').delete().eq('id', materiaCreada.id).eq('owner_user_id', user.id);
      throw relacionError;
    }

    return {
      success: true,
      materia: {
        id: materiaCreada.id,
        nombre: materiaCreada.nombre,
        approval_status: 'pending',
      },
    };
  } catch (error) {
    logError('onboarding.createPrivatePendingSubject', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar tu materia.',
    };
  }
}

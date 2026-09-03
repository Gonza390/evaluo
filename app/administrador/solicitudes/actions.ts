'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export type UniversityRequestStatus = 'pending' | 'reviewing' | 'planned' | 'added' | 'rejected';

export type AdminUniversityRequestRow = {
  id: string;
  universityName: string;
  country: string;
  city: string | null;
  careerName: string;
  note: string | null;
  status: UniversityRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  approvedUniversityId: string | null;
  approvedCareerId: string | null;
};

export type AdminPendingAcademicRow = {
  kind: 'career' | 'subject';
  id: string;
  name: string;
  universityName: string;
  facultyName: string | null;
  careerName: string | null;
  parentCareerApproved: boolean;
  createdAt: string | null;
};

type RawUniversityRequestRow = {
  id: string;
  university_name: string;
  country: string;
  city: string | null;
  career_name: string;
  note: string | null;
  status: UniversityRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  approved_university_id: string | null;
  approved_career_id: string | null;
};

type RawPendingCareer = {
  id: string;
  nombre: string;
  universidad_id: string | null;
  facultad_id: string | null;
  created_at: string | null;
  approval_status: string;
};

type RawPendingSubject = {
  id: string;
  nombre: string;
  carrera_id: string | null;
  approval_status: string;
};

type RawNamedRow = { id: string; nombre: string };
type RawCareerContext = RawNamedRow & {
  universidad_id: string | null;
  facultad_id: string | null;
  approval_status: string;
};

function getUntypedAdminClient() {
  return createAdminClient() as unknown as SupabaseClient;
}

function revalidateAcademicCatalog() {
  revalidatePath('/administrador');
  revalidatePath('/administrador/solicitudes');
  revalidatePath('/explorar');
  revalidatePath('/materias');
  revalidatePath('/empezar');
  revalidatePath('/dashboard/materiales');
}

export async function listarSolicitudesUniversidadAdministrador(): Promise<{
  success: boolean;
  rows: AdminUniversityRequestRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = getUntypedAdminClient();
    const { data, error } = await admin
      .from('university_requests')
      .select(
        'id, university_name, country, city, career_name, note, status, created_at, reviewed_at, approved_university_id, approved_career_id'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const rows = ((data ?? []) as RawUniversityRequestRow[]).map((row) => ({
      id: row.id,
      universityName: row.university_name,
      country: row.country,
      city: row.city,
      careerName: row.career_name,
      note: row.note,
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      approvedUniversityId: row.approved_university_id,
      approvedCareerId: row.approved_career_id,
    }));

    return { success: true, rows };
  } catch (error) {
    logError('admin.universityRequests.list', error);
    return {
      success: false,
      rows: [],
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos cargar las solicitudes de universidades.',
    };
  }
}

export async function listarCatalogoAcademicoPendienteAdministrador(): Promise<{
  success: boolean;
  rows: AdminPendingAcademicRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = getUntypedAdminClient();

    const [careersResult, subjectsResult, universitiesResult, facultiesResult, allCareersResult] =
      await Promise.all([
        admin
          .from('carreras')
          .select('id, nombre, universidad_id, facultad_id, created_at, approval_status')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: true })
          .limit(100),
        admin
          .from('materias')
          .select('id, nombre, carrera_id, approval_status')
          .eq('approval_status', 'pending')
          .limit(200),
        admin.from('universidades').select('id, nombre'),
        admin.from('facultades').select('id, nombre'),
        admin
          .from('carreras')
          .select('id, nombre, universidad_id, facultad_id, approval_status'),
      ]);

    for (const result of [
      careersResult,
      subjectsResult,
      universitiesResult,
      facultiesResult,
      allCareersResult,
    ]) {
      if (result.error) throw result.error;
    }

    const universities = new Map(
      ((universitiesResult.data ?? []) as RawNamedRow[]).map((row) => [row.id, row.nombre])
    );
    const faculties = new Map(
      ((facultiesResult.data ?? []) as RawNamedRow[]).map((row) => [row.id, row.nombre])
    );
    const careers = new Map(
      ((allCareersResult.data ?? []) as RawCareerContext[]).map((row) => [row.id, row])
    );

    const careerRows: AdminPendingAcademicRow[] = (
      (careersResult.data ?? []) as RawPendingCareer[]
    ).map((row) => ({
      kind: 'career',
      id: row.id,
      name: row.nombre,
      universityName: row.universidad_id
        ? universities.get(row.universidad_id) ?? 'Universidad'
        : 'Universidad',
      facultyName: row.facultad_id ? faculties.get(row.facultad_id) ?? null : null,
      careerName: null,
      parentCareerApproved: true,
      createdAt: row.created_at,
    }));

    const subjectRows: AdminPendingAcademicRow[] = (
      (subjectsResult.data ?? []) as RawPendingSubject[]
    ).map((row) => {
      const career = row.carrera_id ? careers.get(row.carrera_id) : undefined;
      return {
        kind: 'subject',
        id: row.id,
        name: row.nombre,
        universityName: career?.universidad_id
          ? universities.get(career.universidad_id) ?? 'Universidad'
          : 'Universidad',
        facultyName: career?.facultad_id ? faculties.get(career.facultad_id) ?? null : null,
        careerName: career?.nombre ?? null,
        parentCareerApproved: career?.approval_status === 'approved',
        createdAt: null,
      };
    });

    return { success: true, rows: [...careerRows, ...subjectRows] };
  } catch (error) {
    logError('admin.pendingAcademic.list', error);
    return {
      success: false,
      rows: [],
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos cargar el catálogo académico pendiente.',
    };
  }
}

async function resolverSolicitudUniversidad(requestId: string, decision: 'approve' | 'reject') {
  const access = await requireAdminAccess();
  const admin = getUntypedAdminClient();
  const { error } = await admin.rpc('resolve_university_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_reviewer_id: access.user.id,
  });

  if (error) {
    logError('admin.universityRequests.resolve', error, { requestId, decision });
    throw new Error('No pudimos resolver la solicitud de universidad.');
  }

  revalidateAcademicCatalog();
}

async function resolverEntidadAcademicaPendiente(
  kind: 'career' | 'subject',
  id: string,
  decision: 'approve' | 'reject'
) {
  const access = await requireAdminAccess();
  const admin = getUntypedAdminClient();
  const now = new Date().toISOString();
  const nextStatus = decision === 'approve' ? 'approved' : 'rejected';

  if (kind === 'career') {
    const { data: career, error: careerError } = await admin
      .from('carreras')
      .select('id, facultad_id, owner_user_id, approval_status')
      .eq('id', id)
      .maybeSingle();

    if (careerError) throw careerError;
    if (!career || career.approval_status !== 'pending') {
      throw new Error('La carrera ya no está pendiente.');
    }

    if (career.facultad_id) {
      const { data: faculty, error: facultyError } = await admin
        .from('facultades')
        .select('id, approval_status, owner_user_id')
        .eq('id', career.facultad_id)
        .maybeSingle();
      if (facultyError) throw facultyError;

      if (
        faculty?.approval_status === 'pending' &&
        faculty.owner_user_id === career.owner_user_id
      ) {
        const { error: updateFacultyError } = await admin
          .from('facultades')
          .update({
            approval_status: nextStatus,
            approved_at: decision === 'approve' ? now : null,
            approved_by: decision === 'approve' ? access.user.id : null,
            owner_user_id: decision === 'approve' ? null : faculty.owner_user_id,
          })
          .eq('id', faculty.id)
          .eq('approval_status', 'pending');
        if (updateFacultyError) throw updateFacultyError;
      }
    }

    const { error: updateCareerError } = await admin
      .from('carreras')
      .update({
        approval_status: nextStatus,
        approved_at: decision === 'approve' ? now : null,
        approved_by: decision === 'approve' ? access.user.id : null,
        owner_user_id: decision === 'approve' ? null : career.owner_user_id,
      })
      .eq('id', id)
      .eq('approval_status', 'pending');
    if (updateCareerError) throw updateCareerError;
  } else {
    const { data: subject, error: subjectError } = await admin
      .from('materias')
      .select('id, carrera_id, owner_user_id, approval_status')
      .eq('id', id)
      .maybeSingle();

    if (subjectError) throw subjectError;
    if (!subject || subject.approval_status !== 'pending') {
      throw new Error('La materia ya no está pendiente.');
    }

    const { data: career, error: careerError } = await admin
      .from('carreras')
      .select('id, approval_status')
      .eq('id', subject.carrera_id)
      .maybeSingle();
    if (careerError) throw careerError;

    if (decision === 'approve' && career?.approval_status !== 'approved') {
      throw new Error('Aprobá primero la carrera antes de publicar esta materia.');
    }

    const { error: updateSubjectError } = await admin
      .from('materias')
      .update({
        approval_status: nextStatus,
        approved_at: decision === 'approve' ? now : null,
        approved_by: decision === 'approve' ? access.user.id : null,
        owner_user_id: decision === 'approve' ? null : subject.owner_user_id,
      })
      .eq('id', id)
      .eq('approval_status', 'pending');
    if (updateSubjectError) throw updateSubjectError;

    const { error: updateRelationError } = await admin
      .from('carrera_materias')
      .update({
        approval_status: nextStatus,
        approved_at: decision === 'approve' ? now : null,
        approved_by: decision === 'approve' ? access.user.id : null,
        owner_user_id: decision === 'approve' ? null : subject.owner_user_id,
      })
      .eq('materia_id', id)
      .eq('carrera_id', subject.carrera_id)
      .eq('approval_status', 'pending');
    if (updateRelationError) throw updateRelationError;
  }

  revalidateAcademicCatalog();
}

export async function aprobarSolicitudUniversidadAdministrador(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '').trim();
  if (!requestId) throw new Error('Solicitud inválida.');
  await resolverSolicitudUniversidad(requestId, 'approve');
}

export async function rechazarSolicitudUniversidadAdministrador(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '').trim();
  if (!requestId) throw new Error('Solicitud inválida.');
  await resolverSolicitudUniversidad(requestId, 'reject');
}

export async function aprobarEntidadAcademicaPendienteAdministrador(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const kind = String(formData.get('kind') ?? '').trim();
  if (!id || (kind !== 'career' && kind !== 'subject')) {
    throw new Error('Solicitud académica inválida.');
  }
  await resolverEntidadAcademicaPendiente(kind, id, 'approve');
}

export async function rechazarEntidadAcademicaPendienteAdministrador(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const kind = String(formData.get('kind') ?? '').trim();
  if (!id || (kind !== 'career' && kind !== 'subject')) {
    throw new Error('Solicitud académica inválida.');
  }
  await resolverEntidadAcademicaPendiente(kind, id, 'reject');
}

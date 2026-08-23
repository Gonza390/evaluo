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

function getUntypedAdminClient() {
  return createAdminClient() as unknown as SupabaseClient;
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

  revalidatePath('/administrador');
  revalidatePath('/administrador/solicitudes');
  revalidatePath('/explorar');
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

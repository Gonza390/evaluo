import { logError } from '@/lib/observability';
import type { AdminClient } from '@/lib/student-materials/types';

export type StudentMaterialJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

const MAX_STUDENT_MATERIAL_JOB_ATTEMPTS = 3;

export type StudentMaterialJobRow = {
  id: string;
  student_material_id: string;
  status: StudentMaterialJobStatus;
  attempts: number;
  last_error: string | null;
};

function jobsTable() {
  return 'student_material_jobs' as never;
}

function isMissingJobsTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';
  return code === '42P01' || /student_material_jobs/i.test(message);
}

export async function enqueueStudentMaterialJob(admin: AdminClient, studentMaterialId: string) {
  try {
    const { data: existing, error: existingError } = await admin
      .from(jobsTable())
      .select('id, status')
      .eq('student_material_id', studentMaterialId)
      .in('status', ['queued', 'processing'])
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return String((existing as { id: string }).id);
    }

    const { data, error } = await admin
      .from(jobsTable())
      .insert({
        student_material_id: studentMaterialId,
        status: 'queued',
      } as never)
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return String((data as { id: string }).id);
  } catch (error) {
    if (isMissingJobsTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function claimStudentMaterialJob(
  admin: AdminClient,
  studentMaterialId: string
): Promise<StudentMaterialJobRow | null> {
  try {
    const { data: job, error } = await admin
      .from(jobsTable())
      .select('id, student_material_id, status, attempts, last_error')
      .eq('student_material_id', studentMaterialId)
      .in('status', ['queued', 'failed'])
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!job) {
      return null;
    }

    const attempts = Number((job as { attempts?: number }).attempts ?? 0) + 1;
    const { data: claimed, error: claimError } = await admin
      .from(jobsTable())
      .update({
        status: 'processing',
        attempts,
        started_at: new Date().toISOString(),
        last_error: null,
      } as never)
      .eq('id', (job as { id: string }).id)
      .eq('status', (job as { status: string }).status)
      .select('id, student_material_id, status, attempts, last_error')
      .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (!claimed) {
      return null;
    }

    return claimed as unknown as StudentMaterialJobRow;
  } catch (error) {
    if (isMissingJobsTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function completeStudentMaterialJob(admin: AdminClient, jobId: string) {
  try {
    const { error } = await admin
      .from(jobsTable())
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_error: null,
      } as never)
      .eq('id', jobId);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (!isMissingJobsTableError(error)) {
      throw error;
    }
  }
}

export async function failStudentMaterialJob(admin: AdminClient, jobId: string, errorMessage: string) {
  try {
    const { error } = await admin
      .from(jobsTable())
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: errorMessage,
      } as never)
      .eq('id', jobId);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (!isMissingJobsTableError(error)) {
      throw error;
    }
  }
}

export async function claimNextQueuedStudentMaterialJob(admin: AdminClient): Promise<StudentMaterialJobRow | null> {
  try {
    const { data: job, error } = await admin
      .from(jobsTable())
      .select('id, student_material_id, status, attempts, last_error')
      .in('status', ['queued', 'failed'])
      .lt('attempts', MAX_STUDENT_MATERIAL_JOB_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!job) {
      return null;
    }

    return await claimStudentMaterialJob(admin, String((job as { student_material_id: string }).student_material_id));
  } catch (error) {
    if (isMissingJobsTableError(error)) {
      return null;
    }

    logError('studentMaterialJobs.claimNext', error);
    throw error;
  }
}

import { logError } from '@/lib/observability';
import type { AdminClient } from '@/lib/student-materials/types';

export type StudentMaterialJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

const MAX_STUDENT_MATERIAL_JOB_ATTEMPTS = 3;
const STUDENT_MATERIAL_JOB_LEASE_MS = 7 * 60 * 1000;
const AUTOMATIC_RETRY_BACKOFF_MS = [0, 5 * 60 * 1000, 30 * 60 * 1000] as const;

export type StudentMaterialJobRow = {
  id: string;
  student_material_id: string;
  status: StudentMaterialJobStatus;
  attempts: number;
  last_error: string | null;
  completed_at?: string | null;
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

function getStaleJobCutoffIso(now = Date.now()) {
  return new Date(now - STUDENT_MATERIAL_JOB_LEASE_MS).toISOString();
}

export function isStudentMaterialJobEligibleForAutomaticRetry(
  job: Pick<StudentMaterialJobRow, 'status' | 'attempts' | 'completed_at'>,
  now = Date.now()
) {
  if (job.status === 'queued') return true;
  if (job.status !== 'failed') return false;
  if (job.attempts >= MAX_STUDENT_MATERIAL_JOB_ATTEMPTS) return false;

  const completedAt = job.completed_at ? Date.parse(job.completed_at) : Number.NaN;
  if (!Number.isFinite(completedAt)) return true;

  const backoffMs = AUTOMATIC_RETRY_BACKOFF_MS[Math.min(job.attempts, AUTOMATIC_RETRY_BACKOFF_MS.length - 1)];
  return now - completedAt >= backoffMs;
}

export async function recoverStaleStudentMaterialJobs(
  admin: AdminClient,
  studentMaterialId?: string
): Promise<string[]> {
  try {
    const staleBefore = getStaleJobCutoffIso();
    const recoveryMessage =
      'El procesamiento superó el tiempo máximo. Podés reintentarlo sin volver a subir el PDF.';
    const payload = {
      status: 'failed',
      completed_at: new Date().toISOString(),
      last_error: recoveryMessage,
    } as never;

    let query = admin
      .from(jobsTable())
      .update(payload)
      .eq('status', 'processing')
      .lt('started_at', staleBefore);

    if (studentMaterialId) {
      query = query.eq('student_material_id', studentMaterialId);
    }

    const { data, error } = await query.select('student_material_id');
    if (error) throw error;

    const materialIds = Array.from(
      new Set(
        ((data ?? []) as Array<{ student_material_id?: string | null }>)
          .map((row) => row.student_material_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (materialIds.length > 0) {
      const { error: materialError } = await admin
        .from('student_materials')
        .update({
          processing_status: 'failed',
          processing_stage: 'failed',
          processing_message: 'El procesamiento se interrumpió por tiempo límite.',
          processing_error: recoveryMessage,
        } as never)
        .in('id', materialIds);

      if (materialError) throw materialError;
    }

    return materialIds;
  } catch (error) {
    if (isMissingJobsTableError(error)) return [];

    logError('studentMaterialJobs.recoverStale', error, { studentMaterialId });
    throw error;
  }
}

export async function enqueueStudentMaterialJob(admin: AdminClient, studentMaterialId: string) {
  try {
    await recoverStaleStudentMaterialJobs(admin, studentMaterialId);

    const { data: existing, error: existingError } = await admin
      .from(jobsTable())
      .select('id, status, attempts')
      .eq('student_material_id', studentMaterialId)
      .in('status', ['queued', 'processing', 'failed'])
      .lt('attempts', MAX_STUDENT_MATERIAL_JOB_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return String((existing as { id: string }).id);

    const { data, error } = await admin
      .from(jobsTable())
      .insert({ student_material_id: studentMaterialId, status: 'queued' } as never)
      .select('id')
      .single();

    if (error) throw error;
    return String((data as { id: string }).id);
  } catch (error) {
    if (isMissingJobsTableError(error)) return null;
    throw error;
  }
}

export async function claimStudentMaterialJob(
  admin: AdminClient,
  studentMaterialId: string
): Promise<StudentMaterialJobRow | null> {
  try {
    await recoverStaleStudentMaterialJobs(admin, studentMaterialId);

    const { data: job, error } = await admin
      .from(jobsTable())
      .select('id, student_material_id, status, attempts, last_error, completed_at')
      .eq('student_material_id', studentMaterialId)
      .in('status', ['queued', 'failed'])
      .lt('attempts', MAX_STUDENT_MATERIAL_JOB_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!job) return null;

    const attempts = Number((job as { attempts?: number }).attempts ?? 0) + 1;
    const { data: claimed, error: claimError } = await admin
      .from(jobsTable())
      .update({
        status: 'processing',
        attempts,
        started_at: new Date().toISOString(),
        completed_at: null,
        last_error: null,
      } as never)
      .eq('id', (job as { id: string }).id)
      .eq('status', (job as { status: string }).status)
      .select('id, student_material_id, status, attempts, last_error, completed_at')
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claimed) return null;

    return claimed as unknown as StudentMaterialJobRow;
  } catch (error) {
    if (isMissingJobsTableError(error)) return null;
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

    if (error) throw error;
  } catch (error) {
    if (!isMissingJobsTableError(error)) throw error;
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

    if (error) throw error;
  } catch (error) {
    if (!isMissingJobsTableError(error)) throw error;
  }
}

export async function claimNextQueuedStudentMaterialJob(
  admin: AdminClient
): Promise<StudentMaterialJobRow | null> {
  try {
    const recoveredMaterialIds = await recoverStaleStudentMaterialJobs(admin);

    for (const recoveredMaterialId of recoveredMaterialIds) {
      const recoveredJob = await claimStudentMaterialJob(admin, recoveredMaterialId);
      if (recoveredJob) return recoveredJob;
    }

    const { data: jobs, error } = await admin
      .from(jobsTable())
      .select('id, student_material_id, status, attempts, last_error, completed_at')
      .in('status', ['queued', 'failed'])
      .lt('attempts', MAX_STUDENT_MATERIAL_JOB_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;

    const eligibleJob = ((jobs ?? []) as unknown as StudentMaterialJobRow[]).find((job) =>
      isStudentMaterialJobEligibleForAutomaticRetry(job)
    );

    if (!eligibleJob) return null;

    return await claimStudentMaterialJob(admin, eligibleJob.student_material_id);
  } catch (error) {
    if (isMissingJobsTableError(error)) return null;

    logError('studentMaterialJobs.claimNext', error);
    throw error;
  }
}

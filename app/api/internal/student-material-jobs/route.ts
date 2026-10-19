import { NextResponse } from 'next/server';
import { processNextStudentMaterialJobAction } from '@/app/dashboard/materiales/actions';
import { logError, logInfo } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

async function processNextJob(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const result = await processNextStudentMaterialJobAction();
  const durationMs = Date.now() - startedAt;
  logInfo('studentMaterials.queueWorker', {
    success: result.success,
    durationMs,
  });

  const admin = createAdminClient();
  const { error: heartbeatError } = await admin.from('analytics_events').insert({
    event_name: 'student_material_worker_dispatch',
    session_key: 'server:student-material-worker',
    path: '/api/internal/student-material-jobs',
    metadata: {
      success: result.success,
      message: result.message,
      duration_ms: durationMs,
    },
  });

  if (heartbeatError) {
    logError('studentMaterials.queueWorkerHeartbeat', heartbeatError);
  }

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

export async function GET(request: Request) {
  return processNextJob(request);
}

export async function POST(request: Request) {
  return processNextJob(request);
}

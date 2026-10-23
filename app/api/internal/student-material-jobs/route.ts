import { NextResponse } from 'next/server';
import { processNextStudentMaterialJobAction } from '@/app/dashboard/materiales/processing-actions';
import { logError, logInfo } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

// Vercel Hobby permite un disparo diario por cron. Una sola tarea por disparo
// dejaba PDFs recuperables esperando días aunque la ejecución terminara rápido.
// Conservamos margen bajo el timeout de la función para no iniciar un nuevo PDF
// cuando se agotó el presupuesto del lote.
const MAX_JOBS_PER_DISPATCH = 3;
const DISPATCH_BUDGET_MS = 90_000;
const EMPTY_QUEUE_MESSAGE = 'No hay materiales pendientes en la cola.';

async function processNextJob(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  let jobsProcessed = 0;
  let jobsFailed = 0;
  let lastMessage = EMPTY_QUEUE_MESSAGE;

  for (let index = 0; index < MAX_JOBS_PER_DISPATCH; index += 1) {
    if (Date.now() - startedAt >= DISPATCH_BUDGET_MS) break;
    const result = await processNextStudentMaterialJobAction();
    lastMessage = result.message;

    if (result.success && result.message === EMPTY_QUEUE_MESSAGE) break;
    jobsProcessed += 1;
    if (!result.success) {
      jobsFailed += 1;
      // Ante indisponibilidad de un proveedor evitamos gastar más tokens.
      break;
    }
  }

  const durationMs = Date.now() - startedAt;
  const success = jobsFailed === 0;
  logInfo('studentMaterials.queueWorker', { success, jobsProcessed, jobsFailed, durationMs });

  const admin = createAdminClient();
  const { error: heartbeatError } = await admin.from('analytics_events').insert({
    event_name: 'student_material_worker_dispatch',
    session_key: 'server:student-material-worker',
    path: '/api/internal/student-material-jobs',
    metadata: {
      success,
      message: lastMessage,
      duration_ms: durationMs,
      jobs_processed: jobsProcessed,
      jobs_failed: jobsFailed,
    },
  });

  if (heartbeatError) {
    logError('studentMaterials.queueWorkerHeartbeat', heartbeatError);
  }

  return NextResponse.json({
    success,
    message: lastMessage,
    jobsProcessed,
    jobsFailed,
  }, { status: success ? 200 : 500 });
}

export async function GET(request: Request) {
  return processNextJob(request);
}

export async function POST(request: Request) {
  return processNextJob(request);
}

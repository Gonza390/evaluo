import { NextResponse } from 'next/server';
import { processNextStudentMaterialJobAction } from '@/app/dashboard/materiales/actions';
import { logInfo } from '@/lib/observability';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

async function processNextJob(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const result = await processNextStudentMaterialJobAction();
  logInfo('studentMaterials.queueWorker', {
    success: result.success,
    durationMs: Date.now() - startedAt,
  });

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

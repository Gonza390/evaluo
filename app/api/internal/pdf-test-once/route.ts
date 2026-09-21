import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  claimStudentMaterialJob,
  failStudentMaterialJob,
} from '@/lib/student-material-jobs';
import {
  markStudentMaterialProcessingFailed,
  processStudentMaterial,
} from '@/lib/student-materials/processing-service';
import { createAdminClient } from '@/lib/supabase-admin';

export const maxDuration = 300;

const TEST_MATERIAL_ID = '6f0f836e-8186-49b3-bd0a-0e2a75e91c56';
const TEST_JOB_ID = '335a7841-9ce8-409f-bde2-f6cb2a909392';

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

async function runOneShotTest(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
  if (!token) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from('student_material_jobs')
    .select('id, student_material_id, status, last_error')
    .eq('id', TEST_JOB_ID)
    .eq('student_material_id', TEST_MATERIAL_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const storedToken =
    job && typeof job.last_error === 'string' ? job.last_error.trim() : '';

  if (
    !job ||
    job.status !== 'queued' ||
    !storedToken ||
    !secureEquals(token, storedToken)
  ) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const claimed = await claimStudentMaterialJob(admin, TEST_MATERIAL_ID);
  if (!claimed || claimed.id !== TEST_JOB_ID) {
    return NextResponse.json({ success: false }, { status: 409 });
  }

  try {
    const result = await processStudentMaterial({
      materialId: TEST_MATERIAL_ID,
      jobId: TEST_JOB_ID,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (processingError) {
    const message =
      processingError instanceof Error
        ? processingError.message
        : 'Error desconocido en la prueba de PDF.';

    await Promise.allSettled([
      failStudentMaterialJob(admin, TEST_JOB_ID, message),
      markStudentMaterialProcessingFailed(TEST_MATERIAL_ID, processingError),
    ]);

    return NextResponse.json(
      { success: false, message: 'La prueba no pudo completarse.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return runOneShotTest(request);
}

export async function POST(request: Request) {
  return runOneShotTest(request);
}

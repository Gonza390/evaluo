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

const ALLOWED_MATERIAL_IDS = new Set([
  '6f0f836e-8186-49b3-bd0a-0e2a75e91c56',
  '86846a91-2889-419b-b7f9-f53c01b1c1a8',
]);

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

async function runRegressionTest(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim() ?? '';
  const materialId = url.searchParams.get('material')?.trim() ?? '';

  if (!token || !ALLOWED_MATERIAL_IDS.has(materialId)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from('student_material_jobs')
    .select('id, student_material_id, status, last_error')
    .eq('student_material_id', materialId)
    .eq('status', 'queued')
    .eq('last_error', token)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ success: false }, { status: error ? 500 : 401 });
  }

  const storedToken =
    typeof job.last_error === 'string' ? job.last_error.trim() : '';
  if (!storedToken || !secureEquals(token, storedToken)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const claimed = await claimStudentMaterialJob(admin, materialId);
  if (!claimed || claimed.id !== job.id) {
    return NextResponse.json({ success: false }, { status: 409 });
  }

  try {
    const result = await processStudentMaterial({
      materialId,
      jobId: job.id,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (processingError) {
    const message =
      processingError instanceof Error
        ? processingError.message
        : 'Error desconocido en la prueba de PDF.';

    await Promise.allSettled([
      failStudentMaterialJob(admin, job.id, message),
      markStudentMaterialProcessingFailed(materialId, processingError),
    ]);

    return NextResponse.json(
      { success: false, message: 'La prueba no pudo completarse.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return runRegressionTest(request);
}

export async function POST(request: Request) {
  return runRegressionTest(request);
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { processStudentMaterial } from '@/lib/student-materials/processing-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MATERIAL_ID = '4080aa41-a819-466b-a564-50333bf3ba6e';
const ONE_TIME_TOKEN = 'pcHanGMtkeW53Q0RIiDHW_nNUEOWqRp7oRlhCyISd3k';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== ONE_TIME_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: material, error } = await admin
    .from('student_materials')
    .select('id, user_id')
    .eq('id', MATERIAL_ID)
    .maybeSingle();

  if (error || !material) {
    return NextResponse.json(
      { success: false, message: error?.message ?? 'Material not found' },
      { status: 404 }
    );
  }

  const cleanupResults = await Promise.all([
    admin.from('student_material_summaries').delete().eq('student_material_id', MATERIAL_ID),
    admin.from('student_material_glossaries').delete().eq('student_material_id', MATERIAL_ID),
    admin.from('student_material_chunks').delete().eq('student_material_id', MATERIAL_ID),
  ]);

  const cleanupError = cleanupResults.find((result) => result.error)?.error;
  if (cleanupError) {
    return NextResponse.json(
      { success: false, message: cleanupError.message },
      { status: 500 }
    );
  }

  const { error: statusError } = await admin
    .from('student_materials')
    .update({
      processing_status: 'processing',
      processing_stage: 'extracting',
      processing_progress: 6,
      processing_message: 'Regenerando artefactos pedagógicos con el pipeline actualizado.',
      processing_error: null,
    })
    .eq('id', MATERIAL_ID);

  if (statusError) {
    return NextResponse.json(
      { success: false, message: statusError.message },
      { status: 500 }
    );
  }

  const result = await processStudentMaterial({
    materialId: MATERIAL_ID,
    ownerUserId: material.user_id,
    jobId: null,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

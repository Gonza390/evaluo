import { NextResponse } from 'next/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/uuid';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const materiaId = String(url.searchParams.get('materia_id') ?? '').trim();

  if (!isUuid(materiaId) || !isAdminClientConfigured()) {
    return NextResponse.json({ available: false, resumenCount: 0, sharedMaterialCount: 0 });
  }

  const admin = createAdminClient();
  const [resumenes, recursos, sharedMaterials] = await Promise.all([
    admin
      .from('resumenes')
      .select('id', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .not('file_url', 'is', null),
    admin
      .from('recursos')
      .select('id', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .not('url_archivo', 'is', null),
    admin
      .from('student_materials')
      .select('id', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .eq('visibility', 'shared')
      .eq('processing_status', 'ready'),
  ]);

  const resumenCount = (resumenes.error ? 0 : resumenes.count ?? 0) + (recursos.error ? 0 : recursos.count ?? 0);
  const sharedMaterialCount = sharedMaterials.error ? 0 : sharedMaterials.count ?? 0;

  return NextResponse.json(
    {
      available: resumenCount + sharedMaterialCount > 0,
      resumenCount,
      sharedMaterialCount,
    },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
  );
}

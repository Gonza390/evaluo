import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { isUuid } from '@/lib/uuid';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function readMetadataName(metadata: Record<string, unknown> | undefined) {
  const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  if (fullName) return fullName;

  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  return name || null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ name: null, featured: false }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: material, error: materialError } = await admin
    .from('student_materials')
    .select('user_id, visibility, processing_status')
    .eq('id', id)
    .maybeSingle();

  if (materialError || !material) {
    return NextResponse.json({ name: null, featured: false }, { status: 404 });
  }

  const isPublicMaterial = material.visibility === 'shared' && material.processing_status === 'ready';

  if (!isPublicMaterial) {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== material.user_id) {
      return NextResponse.json({ name: null, featured: false }, { status: 404 });
    }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('nombre, role')
    .eq('id', material.user_id)
    .maybeSingle();

  let displayName = profile?.nombre?.trim() || null;

  if (!displayName) {
    const { data: authUser } = await admin.auth.admin.getUserById(material.user_id);
    displayName = readMetadataName(authUser.user?.user_metadata as Record<string, unknown> | undefined);
  }

  return NextResponse.json(
    {
      name: displayName || 'Estudiante',
      featured: profile?.role === 'admin',
    },
    {
      headers: isPublicMaterial
        ? {
            'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
          }
        : {
            'Cache-Control': 'private, no-store',
          },
    }
  );
}

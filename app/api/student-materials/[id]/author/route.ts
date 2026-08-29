import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { isUuid } from '@/lib/uuid';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildDisplayName(nombre?: string | null, apellido?: string | null) {
  return [nombre, apellido]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .join(' ');
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ name: null }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: material, error: materialError } = await admin
    .from('student_materials')
    .select('user_id, visibility, processing_status')
    .eq('id', id)
    .maybeSingle();

  if (materialError || !material) {
    return NextResponse.json({ name: null }, { status: 404 });
  }

  const isPublicMaterial = material.visibility === 'shared' && material.processing_status === 'ready';

  if (!isPublicMaterial) {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== material.user_id) {
      return NextResponse.json({ name: null }, { status: 404 });
    }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('nombre, apellido')
    .eq('id', material.user_id)
    .maybeSingle();

  return NextResponse.json(
    { name: buildDisplayName(profile?.nombre, profile?.apellido) || 'Estudiante' },
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

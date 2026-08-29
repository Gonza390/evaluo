import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
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

  if (
    materialError ||
    !material ||
    material.visibility !== 'shared' ||
    material.processing_status !== 'ready'
  ) {
    return NextResponse.json({ name: null }, { status: 404 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('nombre, apellido')
    .eq('id', material.user_id)
    .maybeSingle();

  return NextResponse.json(
    { name: buildDisplayName(profile?.nombre, profile?.apellido) || 'Estudiante' },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}

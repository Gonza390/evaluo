import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resolveMateriaShareSlug } from '@/lib/materia-share-slug';

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ materiaShareSlug: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { materiaShareSlug } = await params;
  const resolved = await resolveMateriaShareSlug(materiaShareSlug);

  if (!resolved) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const destination = new URL(resolved.destination, request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    destination.searchParams.set(key, value);
  });

  return NextResponse.redirect(destination, 301);
}

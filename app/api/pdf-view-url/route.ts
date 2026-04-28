import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getStorageObjectPath(resourcePath: string) {
  if (!/^https?:\/\//i.test(resourcePath)) {
    return resourcePath.replace(/^\/+/, '');
  }

  try {
    const parsedUrl = new URL(resourcePath);
    const marker = '/storage/v1/object/';
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const objectPath = parsedUrl.pathname.slice(markerIndex + marker.length);
    const segments = objectPath.split('/').filter(Boolean);
    const bucketIndex = segments.findIndex((segment) => segment === 'biblioteca');
    if (bucketIndex < 0) return null;

    return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: string };
    const path = body.path?.trim();

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    if (/^https?:\/\//i.test(path) && !path.includes('/storage/v1/object/')) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const objectPath = getStorageObjectPath(path);
    if (!objectPath) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: resourceMatch }, { data: resumenMatch }] = await Promise.all([
      supabaseAdmin
        .from('recursos')
        .select('id')
        .eq('url_archivo', objectPath)
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('resumenes')
        .select('id')
        .eq('file_url', objectPath)
        .limit(1)
        .maybeSingle(),
    ]);

    if (!resourceMatch && !resumenMatch) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from('biblioteca')
      .createSignedUrl(objectPath, 120);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Unable to sign url' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

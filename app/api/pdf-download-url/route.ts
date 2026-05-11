import { NextResponse } from 'next/server';
import { enforceRateLimit, getRequestClientKey } from '@/lib/rate-limit';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

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
    const clientKey = getRequestClientKey(request);
    const rateLimit = enforceRateLimit({
      key: `pdf-download:${clientKey}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const body = (await request.json()) as { path?: string; downloadName?: string };
    const path = body.path?.trim();
    const downloadName = body.downloadName?.trim();

    if (!path || path.length > 500) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const supabase = await createClientServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: 'Unable to validate session' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const objectPath = getStorageObjectPath(path);
    if (!objectPath) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    if (!objectPath.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

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

    const safeDownloadName =
      downloadName && downloadName.length <= 180
        ? downloadName
        : objectPath.split('/').pop() ?? 'documento.pdf';

    const { data, error } = await supabaseAdmin.storage
      .from('biblioteca')
      .createSignedUrl(objectPath, 60, { download: safeDownloadName });

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Unable to sign url' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import {
  generateAndStoreStudentMaterialThumbnail,
  loadStudentMaterialThumbnail,
} from '@/lib/student-materials/thumbnail';

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

export async function GET(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = await enforceRateLimit({
      key: `pdf-thumbnail:${clientKey}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path')?.trim();

    if (!rawPath || rawPath.length > 500) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const objectPath = getStorageObjectPath(rawPath);
    if (!objectPath || !objectPath.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const admin = createAdminClient();
    // Validación de visibilidad con RLS. También permitimos materiales de
    // estudiantes únicamente cuando están compartidos y terminaron de procesarse.
    const server = await createClientServer();
    const {
      data: { user },
    } = await server.auth.getUser();
    const [{ data: resourceMatch }, { data: resumenMatch }, { data: studentMaterialMatch }] =
      await Promise.all([
        server.from('recursos').select('id').eq('url_archivo', objectPath).limit(1).maybeSingle(),
        server.from('resumenes').select('id').eq('file_url', objectPath).limit(1).maybeSingle(),
        server
          .from('student_materials')
          .select('id')
          .eq('file_path', objectPath)
          .eq('visibility', 'shared')
          .eq('processing_status', 'ready')
          .limit(1)
          .maybeSingle(),
      ]);

    if (!resourceMatch && !resumenMatch && !studentMaterialMatch) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // La portada también es parte del documento: no exponer su primera
    // página en los catálogos públicos antes de iniciar sesión.
    if (studentMaterialMatch && !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let thumbnail = await loadStudentMaterialThumbnail(admin, objectPath);

    if (!thumbnail) {
      const { data: fileData, error: downloadError } = await admin.storage
        .from('biblioteca')
        .download(objectPath);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Unable to download pdf' }, { status: 500 });
      }

      const sourceBytes = Buffer.from(await fileData.arrayBuffer());
      thumbnail = await generateAndStoreStudentMaterialThumbnail(
        admin,
        objectPath,
        sourceBytes
      );

      if (!thumbnail) {
        return NextResponse.json({ error: 'Unable to render pdf thumbnail' }, { status: 422 });
      }
    }

    return new Response(thumbnail, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': studentMaterialMatch
          ? 'private, no-store, max-age=0'
          : 'public, max-age=3600, stale-while-revalidate=86400',
        ...Object.fromEntries(rateLimitHeaders(rateLimit)),
      },
    });
  } catch (error) {
    logError('api.pdfThumbnail', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

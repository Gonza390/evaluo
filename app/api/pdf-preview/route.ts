import { PDFDocument } from 'pdf-lib';
import { NextResponse } from 'next/server';
import { PDF_PREVIEW_PAGE_LIMIT } from '@/lib/pdf-preview';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

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
      key: `pdf-preview:${clientKey}`,
      limit: 30,
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
    // Validación de visibilidad con RLS: solo se sirve el preview si el recurso
    // o resumen es visible para el solicitante (las policies de recursos/
    // resumenes deciden). La descarga del blob usa admin porque el bucket
    // biblioteca es admin-only.
    const server = await createClientServer();
    const [{ data: resourceMatch }, { data: resumenMatch }] = await Promise.all([
      server.from('recursos').select('id').eq('url_archivo', objectPath).limit(1).maybeSingle(),
      server.from('resumenes').select('id').eq('file_url', objectPath).limit(1).maybeSingle(),
    ]);

    if (!resourceMatch && !resumenMatch) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await admin.storage
      .from('biblioteca')
      .download(objectPath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Unable to download pdf' }, { status: 500 });
    }

    const sourceBytes = new Uint8Array(await fileData.arrayBuffer());
    const sourcePdf = await PDFDocument.load(sourceBytes, {
      ignoreEncryption: false,
    });

    const previewPdf = await PDFDocument.create();
    const pageCount = sourcePdf.getPageCount();
    const previewCount = Math.min(PDF_PREVIEW_PAGE_LIMIT, pageCount);

    if (previewCount === 0) {
      return NextResponse.json({ error: 'Empty pdf' }, { status: 422 });
    }

    const copiedPages = await previewPdf.copyPages(
      sourcePdf,
      Array.from({ length: previewCount }, (_, index) => index)
    );

    copiedPages.forEach((page) => previewPdf.addPage(page));
    const previewBytes = await previewPdf.save();

    return new Response(previewBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        ...Object.fromEntries(rateLimitHeaders(rateLimit)),
      },
    });
  } catch (error) {
    logError('api.pdfPreview', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

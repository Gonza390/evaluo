import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_PATH = '/api/internal/manual-exam-3d-test';

export async function GET(request: Request) {
  const expectedHost = process.env.VERCEL_URL?.trim();
  const currentHost = new URL(request.url).host;

  // This helper is callable only through this deployment's unique Vercel hostname.
  // Vercel Deployment Protection authenticates access before the request reaches the app.
  if (!expectedHost || currentHost !== expectedHost) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const secret =
    process.env.INTERNAL_QUEUE_SECRET?.trim() || process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'Missing internal queue secret.' },
      { status: 500 }
    );
  }

  const targetUrl = new URL(TARGET_PATH, request.url);
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

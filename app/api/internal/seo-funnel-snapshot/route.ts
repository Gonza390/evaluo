import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';
import { logInfo } from '@/lib/observability';

async function handleSnapshot(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const startedAt = Date.now();
    const { data, error } = await admin.rpc('refresh_seo_funnel_daily', {
      p_days_back: 30,
    });

    if (error) {
      logInfo('seoFunnelSnapshot.error', {
        message: error.message,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const result = data?.[0] ?? null;
    logInfo('seoFunnelSnapshot.run', {
      refreshedDays: result?.refreshed_days ?? 0,
      firstDay: result?.first_day ?? null,
      lastDay: result?.last_day ?? null,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ success: true, ...(result ?? {}) });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar el funnel SEO.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleSnapshot(request);
}

export async function POST(request: Request) {
  return handleSnapshot(request);
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';
import { logInfo } from '@/lib/observability';

function getNumericParam(params: URLSearchParams, key: string, fallback: number) {
  const value = params.get(key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type ArchiveAnalyticsRpcClient = ReturnType<typeof createAdminClient> & {
  rpc: (
    fn: 'archive_analytics_events',
    args: { p_retention_days: number; p_batch_size: number; p_max_batches: number }
  ) => Promise<{
    data: { archived_rows: number; remaining_in_main: number }[] | null;
    error: { message: string } | null;
  }>;
};

async function handleRetention(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const retentionDays = getNumericParam(params, 'retention_days', 180);
    const batchSize = getNumericParam(params, 'batch_size', 1000);
    const maxBatches = getNumericParam(params, 'max_batches', 100);

    const admin = createAdminClient() as unknown as ArchiveAnalyticsRpcClient;
    const startedAt = Date.now();
    const { data, error } = await admin.rpc('archive_analytics_events', {
      p_retention_days: retentionDays,
      p_batch_size: batchSize,
      p_max_batches: maxBatches,
    });

    if (error) {
      logInfo('analyticsRetention.error', { message: error.message, durationMs: Date.now() - startedAt });
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const [result] = (data ?? []) as { archived_rows: number; remaining_in_main: number }[];
    logInfo('analyticsRetention.run', {
      archivedRows: result?.archived_rows ?? 0,
      remainingInMain: result?.remaining_in_main ?? 0,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ success: true, ...(result ?? {}) });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Error al ejecutar retención.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRetention(request);
}

export async function POST(request: Request) {
  return handleRetention(request);
}
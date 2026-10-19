import { NextResponse } from 'next/server';
import { runSimulatorExplanationWarmup } from '@/lib/simulator-explanation-warmup';

function isAuthorized(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const manualToken = process.env.EXPLANATION_WARMUP_TOKEN?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (manualToken && bearerToken === manualToken) {
    return true;
  }

  if (cronSecret && bearerToken === cronSecret) {
    return true;
  }

  return false;
}

function getNumericParam(params: URLSearchParams, key: string) {
  const value = params.get(key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function handleWarmup(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized warmup request.' }, { status: 401 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const dryRun = params.get('dry_run') === '1' || params.get('dry_run') === 'true';
    const result = await runSimulatorExplanationWarmup({
      batchSize: getNumericParam(params, 'batch_size'),
      candidatePoolSize: getNumericParam(params, 'candidate_pool'),
      maxEstimatedTokens: getNumericParam(params, 'max_tokens'),
      lookbackDays: getNumericParam(params, 'lookback_days'),
      dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo ejecutar el warmup de explicaciones.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleWarmup(request);
}

export async function POST(request: Request) {
  return handleWarmup(request);
}

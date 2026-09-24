import { NextResponse } from 'next/server';
import { runSimulatorExplanationWarmup } from '@/lib/simulator-explanation-warmup';
import { runReactivationNextSubjectDispatch } from '@/lib/email/reactivation-next-subject';
import { processNextStudentMaterialJobAction } from '@/app/dashboard/materiales/actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = 'm4zFJ8nQ2pL7xV1cK9sR5tB3wH6yD0uE';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const [warmup, reactivation] = await Promise.all([
    runSimulatorExplanationWarmup({
      dryRun: true,
      batchSize: 3,
      candidatePoolSize: 200,
      maxEstimatedTokens: 5000,
      lookbackDays: 120,
    }),
    runReactivationNextSubjectDispatch({ dryRun: true }),
  ]);

  const pdfWorker = await processNextStudentMaterialJobAction();

  return NextResponse.json({
    success: true,
    warmup: {
      dryRun: warmup.dryRun,
      selectedCount: warmup.selectedCount,
      generatedCount: warmup.generatedCount,
      skippedCount: warmup.skippedCount,
      totalEstimatedTokens: warmup.totalEstimatedTokens,
    },
    reactivation,
    pdfWorker,
  });
}

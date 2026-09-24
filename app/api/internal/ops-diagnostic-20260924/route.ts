import { NextResponse } from 'next/server';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('verification') !== '20260924') {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const cronSecret = process.env.CRON_SECRET?.trim() || '';
  const internalQueueSecret = process.env.INTERNAL_QUEUE_SECRET?.trim() || '';
  const simulatedCronRequest = new Request(request.url, {
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
  });

  return NextResponse.json({
    success: true,
    cronSecretConfigured: Boolean(cronSecret),
    internalQueueSecretConfigured: Boolean(internalQueueSecret),
    cronSecretAcceptedBySharedAuth: Boolean(
      cronSecret && isInternalQueueRequestAuthorized(simulatedCronRequest)
    ),
    reactivationFlagConfigured: typeof process.env.REACTIVATION_NEXT_SUBJECT_ENABLED === 'string',
    reactivationEnabled: process.env.REACTIVATION_NEXT_SUBJECT_ENABLED?.trim() === '1',
    explanationWarmupTokenConfigured: Boolean(process.env.EXPLANATION_WARMUP_TOKEN?.trim()),
    senderApiTokenConfigured: Boolean(process.env.SENDER_API_TOKEN?.trim()),
    senderExam7dConfigured: Boolean(process.env.SENDER_TEMPLATE_EXAM_7D?.trim()),
    senderExam3dConfigured: Boolean(process.env.SENDER_TEMPLATE_EXAM_3D?.trim()),
    senderExam1dConfigured: Boolean(process.env.SENDER_TEMPLATE_EXAM_1D?.trim()),
  });
}

import { NextResponse } from 'next/server';
import { runExamReminderDispatch } from '@/lib/email/exam-reminders';
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

  const dispatch = await runExamReminderDispatch({ dryRun: true });

  return NextResponse.json({
    success: true,
    cronSecretConfigured: Boolean(cronSecret),
    internalQueueSecretConfigured: Boolean(internalQueueSecret),
    secretsEqual: Boolean(cronSecret && internalQueueSecret && cronSecret === internalQueueSecret),
    cronSecretAcceptedByAuth: Boolean(
      cronSecret && isInternalQueueRequestAuthorized(simulatedCronRequest)
    ),
    dispatch,
  });
}

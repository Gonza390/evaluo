import { NextResponse } from 'next/server';
import { runExamReminderDispatch } from '@/lib/email/exam-reminders';
import { logError } from '@/lib/observability';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dry_run') === '1';

  try {
    const result = await runExamReminderDispatch({ dryRun });
    return NextResponse.json(result);
  } catch (error) {
    logError('examReminders.route', error);
    return NextResponse.json(
      { success: false, message: 'No pudimos procesar los recordatorios de examen.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

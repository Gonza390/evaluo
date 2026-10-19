import { NextResponse } from 'next/server';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';
import { runAIKeyHealthCheck } from '@/lib/ai/key-health';

export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const report = await runAIKeyHealthCheck();
    return NextResponse.json({
      success: true,
      checkedAt: report.checkedAt,
      healthy: report.healthy,
      total: report.total,
      checks: report.checks,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, message: 'No pudimos completar la comprobación de claves.' }, { status: 500 });
  }
}

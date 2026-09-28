import { NextResponse } from 'next/server';
import { runFlashcardReviewReminderDispatch } from '@/lib/email/flashcard-review-reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runFlashcardReviewReminderDispatch();
  return NextResponse.json(result);
}

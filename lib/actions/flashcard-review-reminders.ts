'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getTomorrowReminderAt() {
  const today = getDateKeyInTimeZone(new Date(), ARGENTINA_TIME_ZONE);
  const [year, month, day] = today.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1, 12)).toISOString().slice(0, 10);

  // 10:00 de Argentina (UTC-3). El mercado inicial de estos recordatorios es Argentina.
  return new Date(`${tomorrow}T13:00:00.000Z`);
}

function cleanTopics(topics: string[]) {
  return Array.from(
    new Set(
      topics
        .map((topic) => topic.replace(/\s+/g, ' ').trim().slice(0, 180))
        .filter(Boolean)
    )
  ).slice(0, 12);
}

export async function scheduleFlashcardReviewReminderAction(input: {
  materialId: string;
  topics: string[];
  unknownCount: number;
}): Promise<{ success: boolean; scheduledFor?: string; message?: string }> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Necesitás iniciar sesión para crear el recordatorio.' };
  }

  if (!input.materialId || !Number.isInteger(input.unknownCount) || input.unknownCount <= 0) {
    return { success: false, message: 'No encontramos nada pendiente para recordar.' };
  }

  try {
    const admin = createAdminClient();
    // Esta tabla todavía no forma parte del tipo generado de Supabase.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { data: material, error: materialError } = await db
      .from('student_materials')
      .select('id,user_id')
      .eq('id', input.materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (materialError) throw materialError;
    if (!material) {
      return { success: false, message: 'No pudimos identificar este material.' };
    }

    const scheduledFor = getTomorrowReminderAt();
    const topics = cleanTopics(input.topics);

    const { error } = await db.from('flashcard_review_reminders').upsert(
      {
        user_id: user.id,
        material_id: input.materialId,
        topics,
        unknown_count: input.unknownCount,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
        sender_email_id: null,
        sent_at: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,material_id,scheduled_for' }
    );

    if (error) throw error;

    const { error: analyticsError } = await db.from('analytics_events').insert({
      event_name: 'flashcard_review_reminder_scheduled',
      user_id: user.id,
      session_key: `user:${user.id}`,
      path: `/materiales/${input.materialId}`,
      metadata: {
        material_id: input.materialId,
        unknown_count: input.unknownCount,
        topics_count: topics.length,
        scheduled_for: scheduledFor.toISOString(),
      },
    });

    if (analyticsError) {
      logError('flashcardReviewReminder.analytics', analyticsError, {
        userId: user.id,
        materialId: input.materialId,
      });
    }

    return {
      success: true,
      scheduledFor: scheduledFor.toISOString(),
      message: 'Listo. Te lo recordamos mañana.',
    };
  } catch (error) {
    logError('flashcardReviewReminder.schedule', error, {
      userId: user.id,
      materialId: input.materialId,
    });
    return { success: false, message: 'No pudimos guardar el recordatorio.' };
  }
}

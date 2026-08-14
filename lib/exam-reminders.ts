import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';

export type ExamReminderItem = {
  id: string;
  eventId: string;
  title: string;
  materiaNombre: string | null;
  eventDate: string;
  daysBefore: number;
  daysRemaining: number;
  createdAt: string;
};

const REMINDER_HORIZON_DAYS = 14;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

function parseReminderDays(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  }
  return [];
}

function daysBetween(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / msPerDay));
}

export async function syncAndGetExamReminders(userId: string): Promise<ExamReminderItem[]> {
  const admin = createAdminClient();
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const horizonKey = toDateKey(addDays(today, REMINDER_HORIZON_DAYS));

  const { data: events, error: eventsError } = await admin
    .from('study_calendar_events')
    .select('id, title, materia_nombre, event_date, reminder_days_before')
    .eq('user_id', userId)
    .eq('event_type', 'exam')
    .gte('event_date', todayKey)
    .lte('event_date', horizonKey)
    .order('event_date', { ascending: true });

  if (eventsError) {
    logError('examReminders.sync', eventsError, { userId });
    return [];
  }

  const dueRows: Array<{
    user_id: string;
    event_id: string;
    type: string;
    title: string;
    body: string;
    materia_nombre: string | null;
    event_date: string;
    days_before: number;
    status: string;
  }> = [];

  for (const event of events ?? []) {
    const daysBefore = parseReminderDays(event.reminder_days_before);
    for (const days of daysBefore) {
      const fireDate = addDays(parseDateKey(event.event_date), -days);
      if (fireDate.getTime() <= today.getTime()) {
        dueRows.push({
          user_id: userId,
          event_id: event.id,
          type: 'exam_reminder',
          title: event.title,
          body: `Tu parcial está cada vez más cerca. Quedan ${days} día${days === 1 ? '' : 's'}.`,
          materia_nombre: event.materia_nombre ?? null,
          event_date: event.event_date,
          days_before: days,
          status: 'pending',
        });
      }
    }
  }

  if (dueRows.length > 0) {
    const { error: upsertError } = await admin
      .from('user_notifications')
      .upsert(dueRows, { onConflict: 'user_id,event_id,days_before' });

    if (upsertError) {
      logError('examReminders.upsert', upsertError, { userId });
    }
  }

  const { data: notifications, error: notificationsError } = await admin
    .from('user_notifications')
    .select('id, event_id, title, materia_nombre, event_date, days_before, created_at')
    .eq('user_id', userId)
    .eq('type', 'exam_reminder')
    .eq('status', 'pending')
    .gte('event_date', todayKey)
    .order('event_date', { ascending: true });

  if (notificationsError) {
    logError('examReminders.get', notificationsError, { userId });
    return [];
  }

  return (notifications ?? []).map((notification) => ({
    id: notification.id,
    eventId: notification.event_id ?? '',
    title: notification.title,
    materiaNombre: notification.materia_nombre ?? null,
    eventDate: notification.event_date ?? '',
    daysBefore: notification.days_before ?? 0,
    daysRemaining: notification.event_date
      ? daysBetween(today, parseDateKey(notification.event_date))
      : 0,
    createdAt: notification.created_at,
  }));
}

export async function dismissExamReminder(userId: string, notificationId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('user_notifications')
    .update({ status: 'dismissed', seen_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    logError('examReminders.dismiss', error, { userId, notificationId });
  }
}

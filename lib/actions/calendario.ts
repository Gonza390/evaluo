'use server';

import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { requirePremiumUser } from '@/lib/premium';
import {
  syncAndGetExamReminders,
  dismissExamReminder,
  type ExamReminderItem,
} from '@/lib/exam-reminders';

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function hasUpcomingExam(): Promise<boolean> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return false;
    }

    const todayKey = toDateKey(new Date());
    const { data, error } = await supabase
      .from('study_calendar_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', 'exam')
      .gte('event_date', todayKey)
      .limit(1);

    if (error) {
      logError('actions.hasUpcomingExam', error, { userId: user.id });
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    logError('actions.hasUpcomingExam', error);
    return false;
  }
}

export async function getExamReminders(): Promise<{
  success: boolean;
  reminders: ExamReminderItem[];
}> {
  try {
    const premiumCheck = await requirePremiumUser();
    if (!premiumCheck.ok) {
      return { success: false, reminders: [] };
    }

    const reminders = await syncAndGetExamReminders(premiumCheck.user.id);
    return { success: true, reminders };
  } catch (error) {
    logError('actions.getExamReminders', error);
    return { success: false, reminders: [] };
  }
}

export async function dismissExamReminderAction(notificationId: string): Promise<{
  success: boolean;
}> {
  try {
    const premiumCheck = await requirePremiumUser();
    if (!premiumCheck.ok) {
      return { success: false };
    }

    await dismissExamReminder(premiumCheck.user.id, notificationId);
    return { success: true };
  } catch (error) {
    logError('actions.dismissExamReminder', error);
    return { success: false };
  }
}

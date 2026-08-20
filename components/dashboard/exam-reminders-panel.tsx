'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, Sparkles, X } from 'lucide-react';
import { dismissExamReminderAction, getExamReminders } from '@/lib/actions/calendario';
import { usePremium } from '@/hooks/usePremium';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { ExamReminderItem } from '@/lib/exam-reminders';

function formatEventDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(date);
}

function daysRemainingLabel(days: number) {
  if (days <= 0) return 'Es hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

export function ExamRemindersPanel() {
  const { isPremium, premiumLoading } = usePremium();
  const [reminders, setReminders] = useState<ExamReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReminders() {
      if (premiumLoading) return;

      if (!isPremium) {
        if (active) {
          setReminders([]);
          setLoading(false);
        }
        return;
      }

      const result = await getExamReminders();
      if (active) {
        setReminders(result.reminders ?? []);
        setLoading(false);
      }
    }

    void loadReminders();
    return () => {
      active = false;
    };
  }, [isPremium, premiumLoading]);

  const handleDismiss = async (reminder: ExamReminderItem) => {
    setReminders((current) => current.filter((item) => item.id !== reminder.id));
    trackMarketingEvent('reminder_dismissed', {
      event_id: reminder.eventId,
      days_before: reminder.daysBefore,
    });
    await dismissExamReminderAction(reminder.id);
  };

  if (premiumLoading) {
    return null;
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div className="surface-card rounded-[var(--radius-card)] bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xl font-semibold text-slate-950">Próximos parciales</h3>
        </div>
        <Link
          href="/calendario"
          className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          Calendario
        </Link>
      </div>
      <p className="mt-1 px-5 text-xs text-slate-500">
        Recordatorios según las fechas que cargaste.
      </p>

      <div className="space-y-2.5 px-5 pb-5 pt-4">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No hay parciales próximos con recordatorios
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cargá un parcial en el calendario y activá sus recordatorios.
            </p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-white p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[12px] font-semibold text-indigo-700">
                    {daysRemainingLabel(reminder.daysRemaining)}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                  {reminder.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatEventDate(reminder.eventDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDismiss(reminder)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-600"
                aria-label="Descartar recordatorio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-3 text-[12px] text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
        Recordatorios disponibles en Premium
      </div>
    </div>
  );
}

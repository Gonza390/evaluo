'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { dismissExamReminderAction, getExamReminders } from '@/lib/actions/calendario';
import { usePremium } from '@/hooks/usePremium';
import { useUser } from '@/hooks/useUser';
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

export function NotificationBell({ compact = false }: { compact?: boolean } = {}) {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const { isPremium, premiumLoading } = usePremium();
  const [reminders, setReminders] = useState<ExamReminderItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());
  const dismissingRef = useRef(new Set<string>());
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    if (userLoading || premiumLoading) {
      return () => {
        active = false;
      };
    }

    if (!user || !isPremium) {
      setReminders([]);
      return () => {
        active = false;
      };
    }

    void getExamReminders().then((result) => {
      if (active) {
        setReminders(result.reminders ?? []);
      }
    });

    return () => {
      active = false;
    };
  }, [user, isPremium, userLoading, premiumLoading]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (userLoading || premiumLoading) return null;
  if (!user || !isPremium) return null;

  const handleDismiss = async (reminder: ExamReminderItem) => {
    if (dismissingRef.current.has(reminder.id)) return;
    dismissingRef.current.add(reminder.id);
    setDismissingIds((current) => new Set(current).add(reminder.id));

    try {
      const result = await dismissExamReminderAction(reminder.id);
      if (!result.success) {
        throw new Error('El servidor no pudo descartar el recordatorio.');
      }

      // Only remove from the UI after persistence has succeeded.
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
      trackMarketingEvent('reminder_dismissed', {
        event_id: reminder.eventId,
        days_before: reminder.daysBefore,
      });
    } catch {
      toast({
        title: 'No pudimos descartar el recordatorio',
        description: 'Sigue disponible. Revisá tu conexión e intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      dismissingRef.current.delete(reminder.id);
      setDismissingIds((current) => {
        const next = new Set(current);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const count = reminders.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 ${compact ? "h-9 w-9" : "h-11 w-11"}`}
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[12px] font-bold leading-none text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.5rem] max-sm:mt-0 max-sm:w-auto">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Recordatorios</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No tenés recordatorios pendientes.
              </div>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start justify-between gap-3 border-b border-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[12px] font-semibold text-blue-700">
                      {daysRemainingLabel(reminder.daysRemaining)}
                    </span>
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
                    disabled={dismissingIds.has(reminder.id)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-600 disabled:cursor-wait disabled:opacity-60"
                    aria-label="Descartar recordatorio"
                  >
                    {dismissingIds.has(reminder.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

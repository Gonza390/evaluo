'use client';

import { useMemo } from 'react';
import { Flame, Trophy, CalendarDays } from 'lucide-react';
import { useShellData } from '@/components/ShellDataProvider';
import { getArgentinaDayKey } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

/**
 * Calcular el array de fechas del mes actual para el calendario.
 */
function getMonthDays(today: Date) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes = 0

  const cells: Array<{ date: Date; dayKey: string; isCurrentMonth: boolean }> = [];

  // Días de relleno del mes anterior
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, dayKey: getArgentinaDayKey(d), isCurrentMonth: false });
  }

  // Días del mes actual
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, dayKey: getArgentinaDayKey(d), isCurrentMonth: true });
  }

  // Relleno hasta completar 42 celdas (6 semanas)
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ date: d, dayKey: getArgentinaDayKey(d), isCurrentMonth: false });
  }

  return cells;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
    .format(date)
    .replace(' de ', ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function StreakCard() {
  const { streak } = useShellData();
  const streakDays = streak?.streakDays ?? 0;
  const streakDayKeys = streak?.streakDayKeys ?? [];
  const todayKey = streak?.todayKey ?? getArgentinaDayKey(new Date());

  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => getMonthDays(today), [today]);
  const monthLabel = useMemo(() => getMonthLabel(today), [today]);
  const streakDayKeySet = useMemo(() => new Set(streakDayKeys), [streakDayKeys]);
  const studiedToday = streakDayKeySet.has(todayKey);

  // Hitos de racha
  const hasWeekBadge = streakDays >= 7;
  const hasMonthBadge = streakDays >= 30;

  // Próximo hito
  const nextMilestone = useMemo(() => {
    const milestones = [3, 7, 14, 21, 30];
    const next = milestones.find((m) => m > streakDays) ?? Math.max(35, streakDays + 7);
    const remaining = Math.max(0, next - streakDays);
    const progress = next > 0 ? Math.min(100, (streakDays / next) * 100) : 0;
    return { next, remaining, progress };
  }, [streakDays]);

  const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="surface-card overflow-hidden rounded-[var(--radius-card)] bg-white/90 backdrop-blur">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Flame animation */}
            <div className="relative">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  'bg-gradient-to-br from-orange-400 to-red-500 shadow-[0_8px_24px_rgba(249,115,22,0.35)]',
                  streakDays > 0 && 'animate-pulse'
                )}
              >
                <Flame className="h-6 w-6 text-white" strokeWidth={2.4} />
              </div>
              {streakDays > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#2563EB] shadow-md">
                  {streakDays}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-[1.35rem] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[1.5rem]">
                {streakDays > 0 ? (
                  <>
                    Racha de{' '}
                    <span className="inline-block tabular-nums">{streakDays}</span>{' '}
                    {streakDays === 1 ? 'día' : 'días'}
                  </>
                ) : (
                  'Empezá tu racha hoy'
                )}
              </h3>
              <p className="mt-0.5 text-[12px] font-medium leading-5 text-white/80">
                {studiedToday
                  ? '¡Estudiaste hoy! Seguí así.'
                  : 'Abrí una materia para mantener tu racha.'}
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {(hasWeekBadge || hasMonthBadge) && (
          <div className="relative mt-3 flex flex-wrap gap-2">
            {hasWeekBadge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                <Trophy className="h-3 w-3" />
                ¡Una semana seguida!
              </span>
            )}
            {hasMonthBadge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 backdrop-blur">
                <Trophy className="h-3 w-3" />
                ¡Un mes completo!
              </span>
            )}
          </div>
        )}

        {/* Milestone progress */}
        {streakDays > 0 && (
          <div className="relative mt-4 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-white/90">
                Próximo hito: {nextMilestone.next}
              </p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
                {nextMilestone.remaining === 0
                  ? '¡Logrado!'
                  : `${nextMilestone.remaining} ${nextMilestone.remaining === 1 ? 'día' : 'días'}`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white/80 to-white/50 transition-all duration-700"
                style={{ width: `${nextMilestone.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <p className="text-[13px] font-semibold capitalize text-slate-700">{monthLabel}</p>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="flex h-7 items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((cell, index) => {
            const isToday = cell.dayKey === todayKey;
            const isStudied = streakDayKeySet.has(cell.dayKey);

            return (
              <div
                key={`${cell.dayKey}-${index}`}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg text-[12px] font-medium transition-all',
                  !cell.isCurrentMonth && 'text-slate-200',
                  cell.isCurrentMonth && !isStudied && !isToday && 'text-slate-500',
                  isToday &&
                    !isStudied &&
                    'border-2 border-[#2563EB] bg-blue-50 font-bold text-[#2563EB]',
                  isStudied &&
                    'bg-gradient-to-br from-[#2563EB] to-[#6366F1] font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]',
                  isStudied && isToday && 'ring-2 ring-[#2563EB]/30 ring-offset-1'
                )}
              >
                {cell.date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
            <span className="text-[11px] text-slate-500">Estudiaste</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#2563EB]" />
            <span className="text-[11px] text-slate-500">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

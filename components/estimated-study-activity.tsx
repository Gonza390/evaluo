'use client';

import { useEffect, useMemo, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type UniversityShare = {
  name: string;
  weight: number;
};

const UNIVERSITY_SHARES: UniversityShare[] = [
  { name: 'Universidad Siglo 21', weight: 0.27 },
  { name: 'UBA', weight: 0.23 },
  { name: 'UNC', weight: 0.18 },
  { name: 'UNLaM', weight: 0.13 },
  { name: 'UTN', weight: 0.11 },
  { name: 'Otras universidades', weight: 0.08 },
];

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getArgentinaClock(now: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayKey = `${values.year}-${values.month}-${values.day}`;
  const hour = Number(values.hour ?? 0);
  const minute = Number(values.minute ?? 0);

  return {
    dayKey,
    hourDecimal: hour + minute / 60,
    quarterHour: Math.floor((hour * 60 + minute) / 15),
  };
}

function getEstimatedStudentCount(now: Date) {
  const { dayKey, hourDecimal, quarterHour } = getArgentinaClock(now);
  const daySeed = hashString(`evaluo-activity-${dayKey}`);
  const dailyPeak = 5 + (daySeed % 33);

  // Pico principal entre las 20 y 23 h, con una subida más leve por la tarde.
  const eveningPeak = Math.exp(-0.5 * Math.pow((hourDecimal - 21.3) / 3.1, 2));
  const afternoonLift = 0.18 * Math.exp(-0.5 * Math.pow((hourDecimal - 15.2) / 2.7, 2));
  const activityFactor = Math.min(1, 0.2 + 0.72 * eveningPeak + afternoonLift);

  const bucketSeed = hashString(`${dayKey}-${quarterHour}`);
  const smallVariation = ((bucketSeed % 7) - 3) / 100;
  const estimated = Math.round(dailyPeak * (activityFactor + smallVariation));

  return Math.max(5, Math.min(37, Math.min(dailyPeak, estimated)));
}

function distributeByUniversity(total: number) {
  const exact = UNIVERSITY_SHARES.map((item) => ({
    ...item,
    raw: total * item.weight,
  }));
  const initial = exact.map((item) => ({
    name: item.name,
    count: Math.floor(item.raw),
    remainder: item.raw - Math.floor(item.raw),
  }));

  let assigned = initial.reduce((sum, item) => sum + item.count, 0);
  const ranked = [...initial].sort((a, b) => b.remainder - a.remainder);
  let index = 0;

  while (assigned < total && ranked.length > 0) {
    const target = ranked[index % ranked.length];
    const original = initial.find((item) => item.name === target.name);
    if (original) {
      original.count += 1;
      assigned += 1;
    }
    index += 1;
  }

  return initial
    .map(({ name, count }) => ({ name, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function EstimatedStudyActivity() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const count = useMemo(() => (now ? getEstimatedStudentCount(now) : 0), [now]);
  const universities = useMemo(() => distributeByUniversity(count), [count]);

  if (!now) return null;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) return;
        trackMarketingEvent('estimated_activity_opened', {
          location: 'top_header',
          estimated_students: count,
        });
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 text-sm font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:border-emerald-300 hover:bg-emerald-50"
          aria-label={`Actividad estimada: ${count} estudiantes`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span>{count} estudiando</span>
          <span className="text-[11px] font-medium text-slate-400">estimado</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        sideOffset={10}
        className="w-[320px] rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_22px_60px_rgba(15,23,42,0.16)]"
      >
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-[-0.02em] text-slate-950">
                Actividad estimada: {count} estudiantes
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Simulación visual para probar este bloque en Evaluo.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-3 py-2">
          {universities.map((university, index) => (
            <div
              key={university.name}
              className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[11px] font-bold text-slate-400">
                  {index + 1}
                </span>
                <span className="truncate font-medium text-slate-700">{university.name}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-500">
                {university.count}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Prueba visual · pico estimado 20:00–23:00 ARG
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

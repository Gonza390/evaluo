'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

type UniversityCount = {
  name: string;
  count: number;
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
const MIN_STUDENTS = 5;
const MAX_STUDENTS = 37;

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
  };
}

function getDailyPeak(now: Date) {
  const { dayKey } = getArgentinaClock(now);
  return MIN_STUDENTS + (hashString(`evaluo-activity-${dayKey}`) % (MAX_STUDENTS - MIN_STUDENTS + 1));
}

function getTargetStudentCount(now: Date) {
  const { hourDecimal } = getArgentinaClock(now);
  const dailyPeak = getDailyPeak(now);

  // Actividad baja de madrugada, sube durante la tarde y alcanza el pico entre 20:00 y 23:00.
  const eveningPeak = Math.exp(-0.5 * Math.pow((hourDecimal - 21.3) / 3.0, 2));
  const afternoonLift = 0.18 * Math.exp(-0.5 * Math.pow((hourDecimal - 15.3) / 2.8, 2));
  const activityFactor = Math.min(1, 0.19 + 0.74 * eveningPeak + afternoonLift);

  return Math.max(
    MIN_STUDENTS,
    Math.min(dailyPeak, Math.round(dailyPeak * activityFactor))
  );
}

function weightedUniversityDistribution(total: number, vary = false): UniversityCount[] {
  const weighted = UNIVERSITY_SHARES.map((item) => {
    const jitter = vary ? 0.9 + Math.random() * 0.2 : 1;
    return {
      name: item.name,
      weight: item.weight * jitter,
    };
  });

  const weightTotal = weighted.reduce((sum, item) => sum + item.weight, 0);
  const exact = weighted.map((item) => {
    const raw = total * (item.weight / weightTotal);
    return {
      name: item.name,
      count: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    };
  });

  let assigned = exact.reduce((sum, item) => sum + item.count, 0);
  const ranked = [...exact].sort((a, b) => b.remainder - a.remainder);
  let index = 0;

  while (assigned < total && ranked.length > 0) {
    const target = ranked[index % ranked.length];
    const original = exact.find((item) => item.name === target.name);
    if (original) {
      original.count += 1;
      assigned += 1;
    }
    index += 1;
  }

  return UNIVERSITY_SHARES.map((university) => ({
    name: university.name,
    count: exact.find((item) => item.name === university.name)?.count ?? 0,
  })).filter((item) => item.count > 0);
}

function getNextCount(current: number, target: number, dailyPeak: number) {
  const distance = target - current;
  const trendRoll = Math.random();
  let delta = 0;

  if (distance > 1 && trendRoll < 0.72) {
    delta = Math.random() < 0.82 ? 1 : 2;
  } else if (distance < -1 && trendRoll < 0.72) {
    delta = Math.random() < 0.82 ? -1 : -2;
  } else {
    const movementRoll = Math.random();
    if (movementRoll < 0.42) delta = 1;
    else if (movementRoll < 0.84) delta = -1;
    else delta = 0;
  }

  return Math.max(MIN_STUDENTS, Math.min(dailyPeak, current + delta));
}

export function EstimatedStudyActivity() {
  const [count, setCount] = useState<number | null>(null);
  const [universities, setUniversities] = useState<UniversityCount[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const initial = getTargetStudentCount(now);
    setCount(initial);
    setUniversities(weightedUniversityDistribution(initial));

    const scheduleNextUpdate = () => {
      const delay = 15_000 + Math.floor(Math.random() * 15_000);

      timerRef.current = window.setTimeout(() => {
        setCount((current) => {
          const currentValue = current ?? getTargetStudentCount(new Date());
          const updateTime = new Date();
          const target = getTargetStudentCount(updateTime);
          const dailyPeak = getDailyPeak(updateTime);
          const next = getNextCount(currentValue, target, dailyPeak);

          setUniversities(weightedUniversityDistribution(next, true));
          return next;
        });

        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const displayedUniversities = useMemo(
    () => universities.filter((item) => item.count > 0),
    [universities]
  );

  if (count === null) return null;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) return;
        trackMarketingEvent('estimated_activity_opened', {
          location: 'top_header',
          displayed_students: count,
        });
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 text-sm font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:border-emerald-300 hover:bg-emerald-50"
          aria-label={`${count} estudiantes estudiando`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="tabular-nums">{count} Estudiando</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
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
                {count} estudiantes estudiando ahora
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                en distintas universidades
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-3 py-2">
          {displayedUniversities.map((university, index) => (
            <div
              key={university.name}
              className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors"
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
            Actualizado en vivo
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

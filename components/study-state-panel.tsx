'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarPlus,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StudyStateIconName =
  | 'book-open'
  | 'building'
  | 'alert-triangle'
  | 'calendar'
  | 'check-circle'
  | 'file-text'
  | 'loader'
  | 'sparkles';

type StudyStateTone = 'default' | 'warning' | 'success' | 'error' | 'premium' | 'loading';

interface StudyStatePanelProps {
  icon?: LucideIcon;
  iconName?: StudyStateIconName;
  eyebrow?: string;
  title: string;
  description: string;
  tone?: StudyStateTone;
  secondaryText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  className?: string;
  children?: ReactNode;
  iconSpin?: boolean;
}

function resolveSerializableIcon(iconName: StudyStateIconName | undefined) {
  if (iconName === 'book-open') return BookOpen;
  if (iconName === 'building') return Building2;
  if (iconName === 'alert-triangle') return AlertTriangle;
  if (iconName === 'calendar') return CalendarPlus;
  if (iconName === 'check-circle') return CheckCircle2;
  if (iconName === 'file-text') return FileText;
  if (iconName === 'loader') return Loader2;
  if (iconName === 'sparkles') return Sparkles;
  return null;
}

const toneStyles: Record<
  StudyStateTone,
  { surface: string; icon: string; eyebrow: string; primary: string }
> = {
  default: {
    surface: 'border-slate-200 bg-white',
    icon: 'border-blue-100 bg-blue-50 text-blue-600',
    eyebrow: 'text-blue-600',
    primary: 'bg-blue-600 hover:bg-blue-700',
  },
  warning: {
    surface: 'border-amber-200 bg-amber-50/35',
    icon: 'border-amber-200 bg-amber-50 text-amber-700',
    eyebrow: 'text-amber-700',
    primary: 'bg-amber-600 hover:bg-amber-700',
  },
  success: {
    surface: 'border-emerald-200 bg-emerald-50/30',
    icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    eyebrow: 'text-emerald-700',
    primary: 'bg-emerald-600 hover:bg-emerald-700',
  },
  error: {
    surface: 'border-rose-200 bg-rose-50/25',
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
    eyebrow: 'text-rose-700',
    primary: 'bg-rose-600 hover:bg-rose-700',
  },
  premium: {
    surface: 'border-indigo-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F8FF_100%)]',
    icon: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    eyebrow: 'text-indigo-700',
    primary: 'bg-indigo-600 hover:bg-indigo-700',
  },
  loading: {
    surface: 'border-slate-200 bg-white',
    icon: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    eyebrow: 'text-indigo-600',
    primary: 'bg-indigo-600 hover:bg-indigo-700',
  },
};

export function StudyStatePanel({
  icon,
  iconName,
  eyebrow,
  title,
  description,
  tone = 'default',
  secondaryText,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionHref,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  className = '',
  children,
  iconSpin = false,
}: StudyStatePanelProps) {
  const Icon = resolveSerializableIcon(iconName) ?? icon ?? BookOpen;
  const styles = toneStyles[tone];
  const shouldSpin = iconSpin || tone === 'loading' || iconName === 'loader';

  const primaryClassName = cn(
    'inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    styles.primary
  );
  const secondaryClassName =
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';

  return (
    <section
      aria-busy={tone === 'loading' || undefined}
      className={cn(
        'flex min-w-0 flex-col items-center justify-center rounded-[20px] border px-5 py-8 text-center sm:px-7 sm:py-10',
        styles.surface,
        className
      )}
    >
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', styles.icon)}>
        <Icon className={cn('h-5 w-5', shouldSpin && 'animate-spin')} aria-hidden="true" />
      </span>

      <div className="mt-4 max-w-lg">
        {eyebrow ? (
          <p className={cn('text-[10.5px] font-bold tracking-[0.16em] uppercase', styles.eyebrow)}>
            {eyebrow}
          </p>
        ) : null}
        <h3 className={cn('text-lg font-bold tracking-[-0.035em] text-slate-950', eyebrow && 'mt-1.5')}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {secondaryText ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">{secondaryText}</p>
        ) : null}
      </div>

      {children ? <div className="mt-6 w-full max-w-md">{children}</div> : null}

      {primaryActionLabel || secondaryActionLabel ? (
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryActionLabel
            ? primaryActionHref
              ? (
                <Link href={primaryActionHref} className={primaryClassName}>
                  {primaryActionLabel}
                </Link>
              )
              : (
                <button type="button" onClick={onPrimaryAction} className={primaryClassName}>
                  {primaryActionLabel}
                </button>
              )
            : null}

          {secondaryActionLabel
            ? secondaryActionHref
              ? (
                <Link href={secondaryActionHref} className={secondaryClassName}>
                  {secondaryActionLabel}
                </Link>
              )
              : (
                <button type="button" onClick={onSecondaryAction} className={secondaryClassName}>
                  {secondaryActionLabel}
                </button>
              )
            : null}
        </div>
      ) : null}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { BookOpen, Building2, type LucideIcon } from 'lucide-react';

type StudyStateIconName = 'book-open' | 'building';

interface StudyStatePanelProps {
  icon?: LucideIcon;
  iconName?: StudyStateIconName;
  title: string;
  description: string;
  tone?: 'default' | 'warning';
  secondaryText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  className?: string;
}

function resolveSerializableIcon(iconName: StudyStateIconName | undefined) {
  if (iconName === 'book-open') return BookOpen;
  if (iconName === 'building') return Building2;
  return null;
}

export function StudyStatePanel({
  icon,
  iconName,
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
}: StudyStatePanelProps) {
  const isWarning = tone === 'warning';
  const Icon = resolveSerializableIcon(iconName) ?? icon ?? BookOpen;

  return (
    <section
      className={`flex flex-col items-center justify-center border-y px-4 py-9 text-center sm:px-6 sm:py-11 ${
        isWarning ? 'border-amber-200 bg-amber-50/35' : 'border-slate-200 bg-white'
      } ${className}`.trim()}
    >
      <Icon className={`h-7 w-7 ${isWarning ? 'text-amber-600' : 'text-blue-600'}`} />

      <div className="mt-4 max-w-md">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {secondaryText ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">{secondaryText}</p>
        ) : null}
      </div>

      {primaryActionLabel || secondaryActionLabel ? (
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryActionLabel
            ? primaryActionHref
              ? (
                <Link
                  href={primaryActionHref}
                  className={`inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition ${
                    isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {primaryActionLabel}
                </Link>
              )
              : (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className={`inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition ${
                    isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {primaryActionLabel}
                </button>
              )
            : null}

          {secondaryActionLabel
            ? secondaryActionHref
              ? (
                <Link
                  href={secondaryActionHref}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {secondaryActionLabel}
                </Link>
              )
              : (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {secondaryActionLabel}
                </button>
              )
            : null}
        </div>
      ) : null}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { BookOpen, type LucideIcon } from 'lucide-react';

type StudyStateIconName = 'book-open';

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
    <div
      className={`surface-panel flex flex-col items-center justify-center gap-4 px-6 py-8 text-center sm:px-8 ${
        isWarning ? 'border-amber-200 bg-amber-50/70' : 'bg-white'
      } ${className}`.trim()}
    >
      <div
        className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${
          isWarning ? 'bg-amber-100 text-amber-600' : 'bg-[#EEF4FF] text-[#2563EB]'
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>

      <div className="max-w-md">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {secondaryText ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">{secondaryText}</p>
        ) : null}
      </div>

      {primaryActionLabel || secondaryActionLabel ? (
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryActionLabel
            ? primaryActionHref
              ? (
                <Link
                  href={primaryActionHref}
                  className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition ${
                    isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                  }`}
                >
                  {primaryActionLabel}
                </Link>
              )
              : (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition ${
                    isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
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
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {secondaryActionLabel}
                </Link>
              )
              : (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {secondaryActionLabel}
                </button>
              )
            : null}
        </div>
      ) : null}
    </div>
  );
}

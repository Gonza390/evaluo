'use client';

import type { LucideIcon } from 'lucide-react';

interface MateriaSectionStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'neutral' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}

export function MateriaSectionState({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  actionLabel,
  onAction,
}: MateriaSectionStateProps) {
  const isWarning = tone === 'warning';

  return (
    <div
      className={`rounded-3xl p-10 text-center ${
        isWarning
          ? 'border border-amber-200 bg-amber-50'
          : 'border border-dashed border-slate-200 bg-white'
      }`}
    >
      <Icon className={`mx-auto mb-4 h-10 w-10 ${isWarning ? 'text-amber-500' : 'text-slate-300'}`} />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
            isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface MateriaSectionStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'neutral' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}

interface EmptyStateAction {
  label: string;
  href: string;
}

export function MateriaSectionState({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  actionLabel,
  onAction,
}: MateriaSectionStateProps) {
  const params = useParams();
  const isWarning = tone === 'warning';
  const normalizedTitle = title.toLocaleLowerCase('es-AR');
  const materiaId = typeof params?.id === 'string' ? params.id : null;
  const uploadHref = '/dashboard/materiales?openUpload=1';
  const practiceHref = materiaId ? `/simulador/${encodeURIComponent(materiaId)}/1` : '/dashboard';
  const hasExplicitAction = Boolean(actionLabel && onAction);
  const showCommunityContribution =
    !isWarning &&
    !hasExplicitAction &&
    normalizedTitle.includes('pdfs de estudiantes');

  let primaryEmptyAction: EmptyStateAction | null = null;
  let secondaryEmptyAction: EmptyStateAction | null = null;

  if (!isWarning && !hasExplicitAction && !showCommunityContribution) {
    if (normalizedTitle.includes('resúmenes para este módulo')) {
      primaryEmptyAction = {
        label: 'Subir un apunte y estudiarlo',
        href: uploadHref,
      };
      secondaryEmptyAction = {
        label: 'Practicar esta materia',
        href: practiceHref,
      };
    } else if (normalizedTitle.includes('trabajos prácticos')) {
      primaryEmptyAction = {
        label: 'Subir un PDF',
        href: uploadHref,
      };
      secondaryEmptyAction = {
        label: 'Practicar esta materia',
        href: practiceHref,
      };
    } else if (normalizedTitle.includes('pregunteros')) {
      primaryEmptyAction = {
        label: 'Practicar ahora',
        href: practiceHref,
      };
      secondaryEmptyAction = {
        label: 'Subir mi propio material',
        href: uploadHref,
      };
    }
  }

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
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
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
      {primaryEmptyAction ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href={primaryEmptyAction.href}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {primaryEmptyAction.label}
          </Link>
          {secondaryEmptyAction ? (
            <Link
              href={secondaryEmptyAction.href}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {secondaryEmptyAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      {showCommunityContribution ? (
        <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-900">
            ¿Tenés un apunte que pueda ayudar a otros estudiantes?
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-800/80">
            Subilo a Evaluo y elegí compartirlo con tu materia. Si preferís usarlo sólo vos, también
            podés mantenerlo privado.
          </p>
          <Link
            href={uploadHref}
            className="mt-3 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Aportar material a la comunidad
          </Link>
        </div>
      ) : null}
    </div>
  );
}

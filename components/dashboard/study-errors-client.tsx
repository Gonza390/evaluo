'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  Layers3,
  ListChecks,
  Target,
} from 'lucide-react';
import { markStudyErrorReviewedAction } from '@/lib/actions/study-errors';
import type { StudyErrorSource, StudyErrorView, StudyErrorsPageData } from '@/lib/study-errors';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const sourceConfig: Record<
  StudyErrorSource,
  { label: string; icon: typeof Target }
> = {
  simulator: { label: 'Simulador', icon: Target },
  flashcard: { label: 'Flashcards', icon: Layers3 },
  exercise: { label: 'Práctica', icon: ListChecks },
  diagnostic: { label: 'Diagnóstico', icon: CircleAlert },
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diff = now - date.getTime();
  if (!Number.isFinite(diff) || diff < 0) return 'reciente';

  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'hoy';
  if (hours < 24) return 'hoy';
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function pageLabel(pageStart: number | null, pageEnd: number | null) {
  if (!pageStart) return null;
  if (pageEnd && pageEnd !== pageStart) return `Págs. ${pageStart}–${pageEnd}`;
  return `Pág. ${pageStart}`;
}

function buildMaterialHref(item: StudyErrorView) {
  const recommendation = item.recommendation;
  if (!recommendation) return null;

  const params = new URLSearchParams({ studyError: item.id });
  if (recommendation.pageStart) params.set('page', String(recommendation.pageStart));
  return `/materiales/${recommendation.materialId}?${params.toString()}`;
}

function buildUploadHref(item: StudyErrorView) {
  const params = new URLSearchParams({
    openUpload: '1',
    source: 'study_error',
  });
  if (item.materiaId) params.set('materiaId', item.materiaId);
  return `/dashboard/materiales?${params.toString()}`;
}

function ErrorListItem({
  item,
  active,
  onSelect,
}: {
  item: StudyErrorView;
  active: boolean;
  onSelect: () => void;
}) {
  const config = sourceConfig[item.sourceType];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 border-l-2 px-3 py-3.5 text-left transition ${
        active
          ? 'border-slate-950 bg-white'
          : 'border-transparent hover:bg-white/70'
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-slate-900' : 'text-slate-400'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm font-semibold ${active ? 'text-slate-950' : 'text-slate-700'}`}>
            {item.topic}
          </p>
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-slate-700' : 'text-slate-300'}`} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">
          {item.materiaNombre ?? config.label}
          {item.failureCount > 1 ? ` · ${item.failureCount} errores` : ' · 1 error'}
        </p>
      </div>
    </button>
  );
}

function StudyErrorDetail({ item }: { item: StudyErrorView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answersOpen, setAnswersOpen] = useState(false);
  const config = sourceConfig[item.sourceType];
  const Icon = config.icon;
  const recommendation = item.recommendation;
  const materialHref = buildMaterialHref(item);

  const startPdfStudy = () => {
    if (!materialHref) return;

    startTransition(() => {
      void markStudyErrorReviewedAction(item.id).then((result) => {
        if (!result.success) return;

        trackMarketingEvent('study_error_pdf_review_started', {
          study_error_id: item.id,
          source_type: item.sourceType,
          materia_id: item.materiaId,
          material_id: recommendation?.materialId ?? null,
          has_page_reference: Boolean(recommendation?.pageStart),
        });

        router.push(materialHref);
      });
    });
  };

  return (
    <div className="max-w-[790px]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          {config.label}
        </span>
        <span>·</span>
        <span>{item.failureCount === 1 ? '1 error' : `${item.failureCount} errores`}</span>
        <span>·</span>
        <span>{formatRelativeDate(item.lastFailedAt)}</span>
      </div>

      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
        {item.topic}
      </h2>

      <div className="mt-6 max-w-2xl">
        <p className="text-[15px] leading-7 text-slate-600">{item.prompt}</p>
        {item.explanation ? (
          <p className="mt-3 text-[15px] leading-7 text-slate-700">{item.explanation}</p>
        ) : null}
      </div>

      {recommendation ? (
        <section className="mt-8 border-t-2 border-slate-950 pt-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
              Estudiá este tema en tu PDF
            </p>
          </div>

          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {recommendation.materialTitle}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {recommendation.sectionTitle ? <span>{recommendation.sectionTitle}</span> : null}
            {recommendation.sectionTitle && pageLabel(recommendation.pageStart, recommendation.pageEnd) ? (
              <span>·</span>
            ) : null}
            {pageLabel(recommendation.pageStart, recommendation.pageEnd) ? (
              <span>{pageLabel(recommendation.pageStart, recommendation.pageEnd)}</span>
            ) : null}
          </div>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {recommendation.relation === 'origin'
              ? 'Este error salió de este material'
              : 'Evaluo eligió este material como la mejor coincidencia'}
          </p>

          {recommendation.excerpt ? (
            <blockquote className="mt-6 border-l-2 border-indigo-200 pl-5 text-[15px] leading-7 text-slate-700">
              “{recommendation.excerpt}”
            </blockquote>
          ) : null}

          <button
            type="button"
            disabled={isPending}
            onClick={startPdfStudy}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.16)] transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Estudiar este tema en mi PDF
            <ArrowRight className="h-4 w-4" />
          </button>

          {item.alternatives.length > 0 ? (
            <div className="mt-7 border-t border-slate-200 pt-5">
              <p className="text-xs text-slate-400">
                También aparece en{' '}
                {item.alternatives.map((alternative) => alternative.materialTitle).join(' · ')}.
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 border-t-2 border-slate-950 pt-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
              Estudiá este tema en tu material
            </p>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
            Todavía no encontramos este tema en un PDF tuyo
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Subí el material que entra en tu examen y Evaluo va a buscar dónde se explica este concepto.
          </p>
          <Link
            href={buildUploadHref(item)}
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white"
          >
            Subir PDF y encontrar este tema
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {item.selectedAnswer || item.correctAnswer ? (
        <section className="mt-8 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => setAnswersOpen((value) => !value)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Ver qué respondiste
            <ChevronDown className={`h-4 w-4 transition ${answersOpen ? 'rotate-180' : ''}`} />
          </button>

          {answersOpen ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {item.selectedAnswer ? (
                <div className="border-l-2 border-rose-200 pl-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">
                    Tu respuesta
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.selectedAnswer}</p>
                </div>
              ) : null}
              {item.correctAnswer ? (
                <div className="border-l-2 border-emerald-200 pl-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                    Respuesta correcta
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.correctAnswer}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-slate-900">Cómo se cierra este error</p>
        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
          Primero repasalo en tu material. Cuando después vuelvas a acertarlo en {config.label.toLowerCase()},
          va a pasar automáticamente a Resueltos.
        </p>
      </div>
    </div>
  );
}

export function StudyErrorsClient({ data }: { data: StudyErrorsPageData }) {
  const [selectedId, setSelectedId] = useState<string | null>(data.pending[0]?.id ?? null);
  const selected = useMemo(
    () => data.pending.find((item) => item.id === selectedId) ?? data.pending[0] ?? null,
    [data.pending, selectedId]
  );

  useEffect(() => {
    trackMarketingEvent('mis_errores_viewed', {
      pending_count: data.pending.length,
      resolved_count: data.resolved.length,
    });
  }, [data.pending.length, data.resolved.length]);

  if (data.pending.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Mis errores</h1>
        <div className="mt-10 border-y border-slate-200 py-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">No tenés temas pendientes</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Los errores que vuelvas a resolver después de estudiarlos van a quedar guardados como progreso.
              </p>
              {data.resolved.length > 0 ? (
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  {data.resolved.length} {data.resolved.length === 1 ? 'tema resuelto' : 'temas resueltos'}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.55rem]">
          Mis errores
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {data.pending.length} {data.pending.length === 1 ? 'tema para estudiar' : 'temas para estudiar'}
          {data.resolved.length > 0 ? ` · ${data.resolved.length} resueltos` : ''}
        </p>
      </header>

      <div className="grid min-h-[680px] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 py-5 lg:border-r lg:border-b-0 lg:pr-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Para estudiar
            </p>
            <span className="text-xs text-slate-400">{data.pending.length}</span>
          </div>

          <nav className="-mx-2">
            {data.pending.map((item) => (
              <ErrorListItem
                key={item.id}
                item={item}
                active={item.id === selected?.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </nav>

          {data.resolved.length > 0 ? (
            <div className="mt-7 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Resueltos · {data.resolved.length}
              </div>
              <div className="mt-3 space-y-2">
                {data.resolved.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="truncate">{item.topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="py-6 lg:pl-10 lg:py-8">
          {selected ? <StudyErrorDetail item={selected} /> : null}
        </section>
      </div>
    </div>
  );
}

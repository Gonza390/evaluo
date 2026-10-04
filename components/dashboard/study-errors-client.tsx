'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, FileText, Search } from 'lucide-react';
import { finishStudyErrorOnboardingAction } from '@/lib/actions/study-errors';
import type { StudyErrorView, StudyErrorsPageData } from '@/lib/study-errors';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { AppPageHeader } from '@/components/ui/app-page-header';
import { PdfTourSpotlight } from '@/components/study/pdf-tour-spotlight';
import {
  StudyErrorDetail,
  reviewPrimaryButton,
  reviewSecondaryButton,
  studyErrorSourceLabels,
} from './study-error-detail';

const unlinkedId = 'unlinked';
const pendingLabel = (count: number) => `${count} ${count === 1 ? 'pendiente' : 'pendientes'}`;
const resolvedLabel = (count: number) => `${count} ${count === 1 ? 'resuelto' : 'resueltos'}`;

export function StudyErrorsClient({
  data,
  onboarding,
  initialMaterialId,
}: {
  data: StudyErrorsPageData;
  onboarding?: { active: boolean; errorId: string | null };
  initialMaterialId?: string;
}) {
  const router = useRouter();
  const initialError = onboarding?.active
    ? data.pending.find((item) => item.id === onboarding.errorId)
    : initialMaterialId
      ? (data.pending.find((item) => item.recommendation?.materialId === initialMaterialId) ??
        data.resolved.find((item) => item.recommendation?.materialId === initialMaterialId))
      : null;
  const [materialId, setMaterialId] = useState<string | null>(
    initialError ? (initialError.recommendation?.materialId ?? unlinkedId) : null
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialError?.id ?? null);
  const [tab, setTab] = useState<'pending' | 'resolved'>(
    initialError?.status === 'resolved' ? 'resolved' : 'pending'
  );
  const [query, setQuery] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [tourStep, setTourStep] = useState(onboarding?.active && initialError ? 0 : -1);
  const [overrides, setOverrides] = useState<
    Record<string, { baseFailedAt: string; changes: Partial<StudyErrorView> }>
  >({});
  const tracked = useRef(new Set<string>());
  const tourClosing = useRef(false);
  const views = useMemo(
    () =>
      [...data.pending, ...data.resolved].map((item) => {
        const override = overrides[item.id];
        return override?.baseFailedAt === item.lastFailedAt
          ? { ...item, ...override.changes }
          : item;
      }),
    [data.pending, data.resolved, overrides]
  );
  const pdfs = useMemo(() => {
    const materials = new Map(data.materials.map((material) => [material.id, material]));
    for (const item of views)
      if (item.recommendation && !materials.has(item.recommendation.materialId))
        materials.set(item.recommendation.materialId, {
          id: item.recommendation.materialId,
          title: item.recommendation.materialTitle,
          materiaNombre: item.materiaNombre,
        });
    return Array.from(materials.values());
  }, [data.materials, views]);
  const scoped = views.filter(
    (item) => (item.recommendation?.materialId ?? unlinkedId) === materialId
  );
  const pending = scoped.filter((item) => item.status === 'pending');
  const resolved = scoped.filter((item) => item.status === 'resolved');
  const group = tab === 'pending' ? pending : resolved;
  const visible = group.filter((item) =>
    `${item.topic} ${item.prompt}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))
  );
  // Mantener el resultado recién confirmado aunque salga de la lista de pendientes.
  const selected = scoped.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const selectedPdf = pdfs.find((material) => material.id === materialId);
  const totalPending = views.filter((item) => item.status === 'pending').length;

  useEffect(() => {
    trackMarketingEvent('mis_errores_viewed', {
      pending_count: data.pending.length,
      resolved_count: data.resolved.length,
    });
  }, [data.pending.length, data.resolved.length]);
  useEffect(() => {
    if (!selected || tracked.current.has(selected.id)) return;
    tracked.current.add(selected.id);
    const days = selected.lastReviewedAt
      ? Math.floor((Date.now() - new Date(selected.lastReviewedAt).getTime()) / 86_400_000)
      : null;
    const metadata = {
      study_error_id: selected.id,
      source_type: selected.sourceType,
      materia_id: selected.materiaId,
      material_id: selected.recommendation?.materialId ?? null,
      failure_count: selected.failureCount,
      days_since_last_review: days,
      returned_after_day: days !== null && days >= 1,
    };
    trackMarketingEvent('study_error_viewed', metadata);
    if (days !== null && days >= 1) trackMarketingEvent('study_error_returned', metadata);
  }, [selected]);

  function chooseMaterial(id: string) {
    const errors = views.filter((item) => (item.recommendation?.materialId ?? unlinkedId) === id);
    const first = errors.find((item) => item.status === 'pending') ?? errors[0];
    setMaterialId(id);
    setSelectedId(first?.id ?? null);
    setTab(
      errors.length && !errors.some((item) => item.status === 'pending') ? 'resolved' : 'pending'
    );
    setQuery('');
    setMobileListOpen(false);
    setNotice('');
  }
  function nextError() {
    const next = pending.find((item) => item.id !== selectedId);
    if (next) {
      setSelectedId(next.id);
      setTab('pending');
      setQuery('');
      setMobileListOpen(false);
    }
  }
  function finish() {
    setNotice(
      `Terminaste el repaso por hoy. ${pending.length === 1 ? 'Te queda 1 error pendiente' : pending.length ? `Te quedan ${pending.length} errores pendientes` : 'No te quedan errores pendientes'}${selectedPdf ? ` en ${selectedPdf.title}` : ''}. Tu avance quedó guardado.`
    );
    setMaterialId(null);
    setSelectedId(null);
    router.refresh();
  }
  const steps = selected
    ? [
        {
          selector: '[data-study-error-tour="error"]',
          title: 'Este es tu primer error',
          description: 'Evaluo guarda el concepto que te costó para que puedas volver a repasarlo.',
        },
        {
          selector: '[data-study-error-tour="understand"]',
          title: 'Ayudame a entenderlo',
          description:
            'Pedí una explicación del concepto. Después podés pedir una versión más simple o un ejemplo.',
        },
        {
          selector: '[data-study-error-tour="source"]',
          title: selected.recommendation
            ? 'Tu PDF respalda el repaso'
            : 'Conectalo con tus apuntes',
          description: selected.recommendation
            ? 'Abrí el fragmento acá mismo, sin perder el error que estás repasando.'
            : 'Asociá tus apuntes para estudiar y comprobar este concepto con tu material.',
        },
        {
          selector: '[data-study-error-tour="practice"]',
          title: 'Comprobá si lo entendiste',
          description:
            'Después del repaso respondés una pregunta diferente. Un acierto guarda este error como Resuelto.',
        },
      ]
    : [];

  async function closeTour(outcome: 'completed' | 'skipped') {
    if (tourClosing.current) return;
    tourClosing.current = true;
    try {
      if (onboarding?.errorId) await finishStudyErrorOnboardingAction(onboarding.errorId, outcome);
    } finally {
      setTourStep(-1);
      tourClosing.current = false;
    }
  }

  if (data.loadError)
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <AppPageHeader title="Mis errores" />
        <p role="alert" className="!text-foreground mt-4">
          No pudimos cargar tus errores. Tu progreso sigue guardado.
        </p>
        <button className={reviewPrimaryButton + ' mt-4'} onClick={() => router.refresh()}>
          Reintentar
        </button>
      </div>
    );

  return (
    <>
      {tourStep >= 0 && steps[tourStep] && (
        <PdfTourSpotlight
          selector={steps[tourStep].selector}
          title={steps[tourStep].title}
          description={steps[tourStep].description}
          progress={`${tourStep + 1} de ${steps.length}`}
          nextLabel={tourStep === steps.length - 1 ? 'Entendido' : 'Siguiente'}
          onNext={() => {
            if (tourStep < steps.length - 1) {
              setTourStep((step) => step + 1);
              return;
            }
            void closeTour('completed');
          }}
          onBack={tourStep > 0 ? () => setTourStep((step) => step - 1) : undefined}
          onExit={() => void closeTour('skipped')}
          ariaLabel="Guía de Mis errores"
          footerLabel="Tu primer error"
        />
      )}
      <div className="text-foreground mx-auto w-full max-w-[1180px] min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AppPageHeader
          eyebrow="Progreso"
          title="Mis errores"
          description="Convertí lo que te costó en algo que entendés. Repasá con tus apuntes y comprobá lo aprendido."
        />
        {notice && (
          <p
            role="status"
            className="border-primary !text-foreground mt-4 border-l-2 pl-4 !text-sm"
          >
            {notice}
          </p>
        )}
        {!materialId ? (
          <section aria-labelledby="choose-pdf" className="mt-7">
            <h2 id="choose-pdf" className="text-xl font-black tracking-tighter">
              ¿Qué PDF querés reforzar?
            </h2>
            <p className="!text-muted-foreground mt-2 !text-sm">
              {totalPending
                ? `${totalPending === 1 ? '1 concepto pendiente' : `${totalPending} conceptos pendientes`}. Elegí un material para empezar.`
                : 'Tus PDFs y tu progreso de repaso están acá. Los errores nuevos aparecerán automáticamente.'}
            </p>
            <div className="divide-border border-border mt-5 divide-y border-y">
              {pdfs.map((pdf) => {
                const errors = views.filter((item) => item.recommendation?.materialId === pdf.id);
                const count = errors.filter((item) => item.status === 'pending').length;
                const topics = errors
                  .filter((item) => item.status === 'pending')
                  .slice(0, 3)
                  .map((item) => item.topic);
                return (
                  <button
                    key={pdf.id}
                    className="hover:bg-muted/50 focus-visible:outline-ring flex w-full items-start gap-3 py-5 text-left transition focus-visible:outline-2 sm:px-2"
                    onClick={() => chooseMaterial(pdf.id)}
                  >
                    <FileText className="text-primary mt-1 h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold break-words">{pdf.title}</span>
                      {pdf.materiaNombre && (
                        <span className="text-muted-foreground mt-1 block text-xs">
                          {pdf.materiaNombre}
                        </span>
                      )}
                      <span className="text-muted-foreground mt-2 block text-sm break-words">
                        {topics.length
                          ? topics.join(' · ')
                          : 'No tenés errores pendientes en este PDF.'}
                      </span>
                      <span className="text-primary mt-2 block text-xs font-semibold">
                        {pendingLabel(count)} · {resolvedLabel(errors.length - count)}
                      </span>
                    </span>
                    <ArrowRight className="text-primary mt-1 h-4 w-4 shrink-0" />
                  </button>
                );
              })}
            </div>
            {views.some((item) => !item.recommendation) && (
              <button
                className={reviewSecondaryButton + ' mt-5 w-full justify-between sm:w-auto'}
                onClick={() => chooseMaterial(unlinkedId)}
              >
                Sin PDF asociado ·{' '}
                {pendingLabel(
                  views.filter((item) => !item.recommendation && item.status === 'pending').length
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {!pdfs.length && !views.length && (
              <p className="!text-foreground mt-5">
                Todavía no tenés errores guardados. Subí un PDF y practicá: lo que te cueste quedará
                listo para repasar.
              </p>
            )}
            <Link
              href="/dashboard/materiales?openUpload=1"
              className={reviewSecondaryButton + ' mt-5 sm:ml-3'}
            >
              Subir mi PDF
            </Link>
          </section>
        ) : (
          <>
            <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <button
                className={reviewSecondaryButton}
                onClick={() => {
                  setMaterialId(null);
                  setSelectedId(null);
                  setNotice('');
                  router.refresh();
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Mis PDFs
              </button>
              <select
                aria-label="Cambiar PDF"
                value={materialId}
                onChange={(event) => chooseMaterial(event.target.value)}
                className="border-border bg-background min-h-11 w-full max-w-full min-w-0 rounded-xl border px-3 text-sm sm:w-auto sm:max-w-[65%]"
              >
                {pdfs.map((pdf) => (
                  <option key={pdf.id} value={pdf.id}>
                    {pdf.title} ·{' '}
                    {pendingLabel(
                      views.filter(
                        (item) =>
                          item.recommendation?.materialId === pdf.id && item.status === 'pending'
                      ).length
                    )}
                  </option>
                ))}
                {views.some((item) => !item.recommendation) && (
                  <option value={unlinkedId}>Sin PDF asociado</option>
                )}
              </select>
            </div>
            <div className="mt-5">
              <h2 className="text-lg font-bold break-words">
                {selectedPdf?.title ?? 'Errores sin PDF asociado'}
              </h2>
              <p className="!text-muted-foreground mt-1 !text-xs">
                {pendingLabel(pending.length)} · {resolvedLabel(resolved.length)}
              </p>
            </div>
            <div className="mt-4 lg:hidden">
              <button
                className="border-border flex min-h-12 w-full items-center justify-between gap-3 border-y py-3 text-left"
                onClick={() => setMobileListOpen((open) => !open)}
                aria-expanded={mobileListOpen}
                aria-controls="mobile-errors"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {selected?.topic ?? 'Elegí un error'}
                    {selected && selected.status === 'pending'
                      ? ` · Error ${Math.max(1, pending.findIndex((item) => item.id === selected.id) + 1)} de ${pending.length}`
                      : ''}
                  </span>
                  <span className="text-primary block text-xs">Cambiar error</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 ${mobileListOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="grid min-w-0 gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
              <aside
                id="mobile-errors"
                aria-label="Errores de este PDF"
                className={`${mobileListOpen ? 'block' : 'hidden'} lg:border-border min-w-0 pt-4 lg:block lg:border-r lg:pr-5`}
              >
                <div className="flex gap-2">
                  {(['pending', 'resolved'] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={tab === value}
                      className={`min-h-11 flex-1 border-b-2 px-2 text-xs font-semibold ${tab === value ? 'border-primary text-primary' : 'text-muted-foreground border-transparent'}`}
                      onClick={() => {
                        setTab(value);
                        setSelectedId((value === 'pending' ? pending : resolved)[0]?.id ?? null);
                        setQuery('');
                      }}
                    >
                      {value === 'pending'
                        ? `Pendientes (${pending.length})`
                        : `Resueltos (${resolved.length})`}
                    </button>
                  ))}
                </div>
                <label className="border-border mt-3 flex min-h-11 items-center gap-2 rounded-xl border px-3">
                  <Search className="text-muted-foreground h-4 w-4 shrink-0" />
                  <input
                    type="search"
                    aria-label="Buscar tema"
                    placeholder="Buscar tema"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </label>
                <nav className="mt-3 max-h-[52vh] overflow-y-auto lg:max-h-none">
                  {visible.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full border-l-2 px-3 py-3 text-left transition ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 border-transparent'}`}
                      onClick={() => {
                        setSelectedId(item.id);
                        setMobileListOpen(false);
                      }}
                    >
                      <span className="block text-sm font-semibold break-words">{item.topic}</span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {studyErrorSourceLabels[item.sourceType]} ·{' '}
                        {item.status === 'resolved'
                          ? 'Resuelto'
                          : `${item.failureCount} ${item.failureCount === 1 ? 'error' : 'errores'}`}
                      </span>
                    </button>
                  ))}
                </nav>
                {!visible.length && (
                  <p className="!text-muted-foreground mt-4 !text-xs">
                    {query
                      ? 'No encontramos ese tema.'
                      : tab === 'pending'
                        ? 'No quedan errores pendientes.'
                        : 'Todavía no hay errores resueltos.'}
                  </p>
                )}
              </aside>
              <section className="min-w-0 py-4" aria-label="Repaso del error">
                {selected ? (
                  <StudyErrorDetail
                    key={selected.id}
                    item={selected}
                    materials={pdfs}
                    pendingCount={pending.length}
                    onProgress={(changes) =>
                      setOverrides((current) => ({
                        ...current,
                        [selected.id]: {
                          baseFailedAt:
                            data.pending.find((item) => item.id === selected.id)?.lastFailedAt ??
                            selected.lastFailedAt,
                          changes: { ...current[selected.id]?.changes, ...changes },
                        },
                      }))
                    }
                    onAssociate={(id) => {
                      setOverrides((current) => ({
                        ...current,
                        [selected.id]: {
                          baseFailedAt: selected.lastFailedAt,
                          changes: {
                            recommendation: {
                              materialId: id,
                              materialTitle: pdfs.find((pdf) => pdf.id === id)?.title ?? 'Mi PDF',
                              pageStart: null,
                              pageEnd: null,
                              sectionTitle: null,
                              excerpt: null,
                              relation: 'best',
                            },
                          },
                        },
                      }));
                      setMaterialId(id);
                      router.refresh();
                    }}
                    onNext={nextError}
                    onFinish={finish}
                  />
                ) : (
                  <div className="py-8">
                    <CheckCircle2 className="text-primary h-7 w-7" />
                    <h3 className="mt-3 text-xl font-bold">
                      {tab === 'resolved'
                        ? 'Todavía no hay errores resueltos'
                        : 'Todo al día en este PDF'}
                    </h3>
                    <p className="!text-muted-foreground mt-2 !text-sm">
                      {tab === 'resolved'
                        ? 'Los errores que compruebes después del repaso van a aparecer acá.'
                        : 'Podés seguir estudiando tu material o revisar tus conceptos resueltos.'}
                    </p>
                    {selectedPdf && (
                      <Link
                        href={`/materiales/${selectedPdf.id}`}
                        className={reviewPrimaryButton + ' mt-4'}
                      >
                        Seguir estudiando mi PDF
                      </Link>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}

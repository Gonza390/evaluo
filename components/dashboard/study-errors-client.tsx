'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  FileText,
  Search,
} from 'lucide-react';
import type { StudyErrorView, StudyErrorsPageData } from '@/lib/study-errors';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { pdfProgressReviewHref, studyErrorGroupId } from '@/lib/study-error-navigation';
import { AppPageHeader } from '@/components/ui/app-page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StudyErrorDetail,
  reviewPrimaryButton,
  studyErrorSourceLabels,
  type StudyErrorReviewActions,
  type StudyErrorConversation,
} from './study-error-detail';

const STUDY_ERROR_EN: Record<string,string> = {
  "Progreso": "Progress",
  "No pudimos cargar tus errores. Tu progreso sigue guardado.": "We could not load your mistakes. Your progress is saved.",
  "Reintentar": "Try again",
  "Elegir material para repasar": "Choose a material to review",
  "Al día": "Up to date",
  "Simulador y otros conceptos": "Question bank and other concepts",
  "Repasá el error y comprobá lo aprendido.": "Review the mistake and check what you learned.",
  "Subir mi PDF": "Upload my PDF",
  "Mis PDFs": "My PDFs",
  "Cambiar material": "Change material",
  "Elegí un error": "Choose a mistake",
  "Cambiar error": "Change mistake",
  "Errores de este PDF": "Mistakes in this PDF",
  "Buscar tema": "Search topic",
  "Repaso del error": "Mistake review",
  "Seguir estudiando mi PDF": "Keep studying my PDF",
  "No encontramos ese tema.": "Topic not found.",
  "No quedan errores pendientes.": "No pending mistakes.",
  "Todavía no hay errores resueltos.": "No resolved mistakes yet.",
  "Todavía no hay errores resueltos": "No resolved mistakes yet",
  "Todo al día en este PDF": "All caught up in this PDF",
  "Los errores que compruebes después del repaso van a aparecer acá.": "Mistakes checked after review will appear here.",
  "Podés seguir estudiando tu material o revisar tus conceptos resueltos.": "Continue studying or revisit resolved concepts.",
  "Resuelto": "Resolved"
};
const unlinkedId = 'unlinked';
const sourceLabelsEn: Record<keyof typeof studyErrorSourceLabels, string> = { simulator:'Question bank',flashcard:'Flashcards',exercise:'Practice',diagnostic:'Diagnostic' };

export function StudyErrorsClient({
  data,
  initialMaterialId,
  initialErrorId,
  reviewActions,
  preview = false,
}: {
  data: StudyErrorsPageData;
  initialMaterialId?: string;
  initialErrorId?: string;
  reviewActions?: StudyErrorReviewActions;
  preview?: boolean;
}) {
  const router = useRouter();
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string) => english ? (STUDY_ERROR_EN[es] ?? es) : es;
  const pendingLabel = (n: number) => `${n} ${english ? 'pending' : n === 1 ? 'pendiente' : 'pendientes'}`;
  const resolvedLabel = (n: number) => `${n} ${english ? 'resolved' : n === 1 ? 'resuelto' : 'resueltos'}`;
  const initialError = initialErrorId
    ? [...data.pending, ...data.resolved].find((item) => item.id === initialErrorId)
    : initialMaterialId
      ? (data.pending.find((item) => item.recommendation?.materialId === initialMaterialId) ??
        data.resolved.find((item) => item.recommendation?.materialId === initialMaterialId))
      : null;
  const initialMaterialAvailable = Boolean(
    initialMaterialId &&
    (data.materials.some((material) => material.id === initialMaterialId) ||
      data.pending.some((item) => item.recommendation?.materialId === initialMaterialId) ||
      data.resolved.some((item) => item.recommendation?.materialId === initialMaterialId))
  );
  const [materialId, setMaterialId] = useState<string | null>(
    initialError
      ? studyErrorGroupId(initialError)
      : initialMaterialAvailable
        ? (initialMaterialId ?? null)
        : null
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialError?.id ?? null);
  const [tab, setTab] = useState<'pending' | 'resolved'>(
    initialError?.status === 'resolved' ? 'resolved' : 'pending'
  );
  const [query, setQuery] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [overrides, setOverrides] = useState<
    Record<string, { baseFailedAt: string; changes: Partial<StudyErrorView> }>
  >({});
  const tracked = useRef(new Set<string>());
  const pageIntro = useRef<HTMLDivElement>(null);
  // Historial de este repaso: cada error y PDF conserva su conversación en esta pantalla.
  // Un nuevo fallo o un cambio de PDF abre un contexto nuevo y evita reutilizar otra fuente.
  const [conversations, setConversations] = useState<Record<string, StudyErrorConversation>>({});
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
  const scoped = views.filter((item) => studyErrorGroupId(item) === materialId);
  const pending = scoped.filter((item) => item.status === 'pending');
  const resolved = scoped.filter((item) => item.status === 'resolved');
  const group = tab === 'pending' ? pending : resolved;
  const visible = group.filter((item) =>
    `${item.topic} ${item.prompt}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))
  );
  // Mantener el resultado recién confirmado aunque salga de la lista de pendientes.
  const selected = scoped.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const conversationKey = selected
    ? JSON.stringify([
        selected.id,
        selected.lastFailedAt,
        selected.recommendation?.materialId ?? null,
      ])
    : '';
  const initialConversation: StudyErrorConversation = {
    messages: [],
    source: selected?.recommendation ?? null,
    reviewed: Boolean(selected?.lastReviewedAt),
  };
  const selectedPdf = pdfs.find((material) => material.id === materialId);
  const totalPending = views.filter((item) => item.status === 'pending').length;
  const unlinked = views.filter((item) => studyErrorGroupId(item) === unlinkedId);
  const unlinkedPending = unlinked.filter((item) => item.status === 'pending').length;
  const headerPendingCount = materialId ? pending.length : totalPending;
  const headerDescription = headerPendingCount ? (
    <>
      {english ? 'You have ' : 'Tenés '}<strong className="text-foreground font-semibold">{headerPendingCount} {english ? (headerPendingCount === 1 ? 'concept' : 'concepts') : (headerPendingCount === 1 ? 'concepto' : 'conceptos')}</strong>{' '}
      {english ? 'to review' : 'para reforzar'}{selectedPdf ? (english ? ' in this PDF' : ' en este PDF') : ''}.
      {!materialId ? (english ? ' Choose a PDF.' : ' Elegí un PDF.') : materialId === unlinkedId ? (english ? ' Review each concept while keeping its source.' : ' Repasá cada concepto conservando su origen.') : ''}
    </>
  ) : selectedPdf ? (english ? 'No pending concepts in this PDF.' : 'No te quedan conceptos pendientes en este PDF.') :
    views.length ? (english ? 'No concepts left to review. Your progress was saved.' : 'No tenés conceptos pendientes. Tu progreso de repaso está guardado.') :
    (english ? 'Concepts you find difficult during practice will appear here for review.' : 'Los conceptos que te cuesten al practicar van a quedar acá para repasarlos.');

  useEffect(() => {
    if (preview) return;
    trackMarketingEvent('mis_errores_viewed', {
      pending_count: data.pending.length,
      resolved_count: data.resolved.length,
    });
  }, [data.pending.length, data.resolved.length, preview]);
  useEffect(() => {
    if (preview) return;
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
  }, [selected, preview]);

  function chooseMaterial(id: string) {
    const errors = views.filter((item) => studyErrorGroupId(item) === id);
    const pdfErrors = errors.filter((item) => item.sourceType !== 'simulator');
    if (!preview && id !== unlinkedId && (pdfErrors.length || !errors.length)) {
      const firstPdfError = pdfErrors.find((item) => item.status === 'pending') ?? pdfErrors[0];
      const href = pdfProgressReviewHref(id, firstPdfError);
      if (href) router.push(href);
      return;
    }
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
  function returnToMaterials() {
    setMaterialId(null);
    setSelectedId(null);
    setQuery('');
    setMobileListOpen(false);
    requestAnimationFrame(() => {
      pageIntro.current?.focus({ preventScroll: true });
      pageIntro.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function finish() {
    setNotice(
      english ? `Review complete for today. ${pending.length ? `${pending.length} pending mistake${pending.length===1?'':'s'}` : 'No pending mistakes'}${selectedPdf ? ` in ${selectedPdf.title}` : ''}. Your progress was saved.` : `Terminaste el repaso por hoy. ${pending.length === 1 ? 'Te queda 1 error pendiente' : pending.length ? `Te quedan ${pending.length} errores pendientes` : 'No te quedan errores pendientes'}${selectedPdf ? ` en ${selectedPdf.title}` : ''}. Tu avance quedó guardado.`
    );
    returnToMaterials();
    if (!preview) router.refresh();
  }
  if (data.loadError)
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <AppPageHeader title={t("Progreso")} />
        <p role="alert" className="!text-foreground mt-4">
          {t("No pudimos cargar tus errores. Tu progreso sigue guardado.")}
        </p>
        <button className={reviewPrimaryButton + ' mt-4'} onClick={() => router.refresh()}>
          {t("Reintentar")}
        </button>
      </div>
    );

  return (
    <>
      <div
        className="text-foreground mx-auto w-full max-w-[1240px] min-w-0 px-3 py-3 text-ui sm:px-4 sm:py-4 lg:px-6 lg:py-5"
        style={!materialId ? { maxWidth: '960px' } : undefined}
      >
        <div ref={pageIntro} tabIndex={-1} className="scroll-mt-24 outline-none">
          <AppPageHeader
            eyebrow={t("Progreso")}
            size="compact"
            title={t("Progreso")}
            description={<span role="status">{headerDescription}</span>}
          />
        </div>
        {notice && (
          <p
            role="status"
            className="border-primary !text-foreground mt-4 border-l-2 pl-4 !text-cuerpo"
          >
            {notice}
          </p>
        )}
        {!materialId ? (
          <section aria-labelledby="choose-pdf" className="mt-3">
            <h2 id="choose-pdf" className="sr-only">
              {t("Elegir material para repasar")}
            </h2>
            <div className="divide-border border-border divide-y border-b">
              {pdfs.map((pdf) => {
                const errors = views.filter((item) => studyErrorGroupId(item) === pdf.id);
                const count = errors.filter((item) => item.status === 'pending').length;
                const topics = errors
                  .filter((item) => item.status === 'pending')
                  .slice(0, 3)
                  .map((item) => item.topic);
                return (
                  <button
                    key={pdf.id}
                    className="hover:bg-muted/50 focus-visible:outline-ring flex w-full items-start gap-3 py-3.5 text-left transition focus-visible:outline-2 sm:px-2"
                    onClick={() => chooseMaterial(pdf.id)}
                  >
                    <FileText
                      className={`${count ? 'text-primary' : 'text-muted-foreground'} mt-1 h-5 w-5 shrink-0`}
                      aria-hidden="true"
                    />
                    <span className="grid min-w-0 flex-1 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
                      <span className="min-w-0">
                        <span
                          className={`block break-words ${count ? 'font-semibold' : 'font-medium'}`}
                        >
                          {pdf.title}
                        </span>
                        {pdf.materiaNombre && (
                          <span className="text-muted-foreground mt-1 block text-chico">
                            {pdf.materiaNombre}
                          </span>
                        )}
                      </span>
                      <span className="sm:text-right">
                        {count ? (
                          <>
                            <span className="text-primary block text-cuerpo font-semibold">
                              {count} {english ? `${count === 1 ? 'topic' : 'topics'} to review` : `${count === 1 ? 'tema' : 'temas'} para reforzar`}
                            </span>
                            {errors.length > count && (
                              <span className="text-muted-foreground mt-1 block text-chico">
                                {resolvedLabel(errors.length - count)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-cuerpo">
                            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {t("Al día")}
                            {errors.length > 0 && (
                              <span className="text-chico">
                                · {errors.length}{' '}
                                {english ? (errors.length === 1 ? 'resolved topic' : 'resolved topics') : (errors.length === 1 ? 'tema resuelto' : 'temas resueltos')}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      {topics.length > 0 && (
                        <span className="text-muted-foreground block text-cuerpo break-words sm:col-span-2">
                          {topics.join(' · ')}
                        </span>
                      )}
                    </span>
                    <ArrowRight
                      className={`${count ? 'text-primary' : 'text-muted-foreground'} mt-1 h-4 w-4 shrink-0`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
              {unlinked.length > 0 && (
                <button
                  className="hover:bg-muted/50 focus-visible:outline-ring flex w-full items-start gap-3 py-3.5 text-left transition focus-visible:outline-2 sm:px-2"
                  onClick={() => chooseMaterial(unlinkedId)}
                >
                  <FileQuestion
                    className="text-muted-foreground mt-1 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold break-words">
                      {t("Simulador y otros conceptos")}
                    </span>
                    <span className="text-muted-foreground mt-2 block text-cuerpo">
                      {pendingLabel(unlinkedPending)} · {t("Repasá el error y comprobá lo aprendido.")}
                    </span>
                    {unlinked.length > unlinkedPending && (
                      <span className="text-muted-foreground mt-1 block text-chico">
                        {resolvedLabel(unlinked.length - unlinkedPending)}
                      </span>
                    )}
                  </span>
                  <ArrowRight
                    className="text-muted-foreground mt-1 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            {!pdfs.length && !views.length && (
              <p className="!text-foreground mt-5">
                {english ? 'No saved mistakes yet. Upload a PDF and practice; difficult topics will appear here.' : 'Todavía no tenés errores guardados. Subí un PDF y practicá: lo que te cueste quedará listo para repasar.'}
              </p>
            )}
            <Link
              href="/dashboard/materiales?openUpload=1"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-ring mt-4 inline-flex min-h-11 items-center rounded-lg px-2 text-cuerpo font-medium underline underline-offset-4 transition focus-visible:outline-2"
            >
              {t("Subir mi PDF")}
            </Link>
          </section>
        ) : (
          <>
            <div className="border-border mt-3 flex min-w-0 flex-wrap items-center gap-2 border-b pb-3 sm:flex-nowrap sm:gap-4">
              <button
                className="text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-cuerpo font-medium transition focus-visible:outline-2"
                onClick={() => {
                  returnToMaterials();
                  setNotice('');
                  if (!preview) router.refresh();
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("Mis PDFs")}
              </button>
              <Select value={materialId} onValueChange={chooseMaterial}>
                <SelectTrigger
                  aria-label="Cambiar material o contexto"
                  className="hover:bg-muted/50 h-auto w-full min-w-0 flex-1 basis-full rounded-lg border-transparent px-3 py-2 text-left whitespace-normal shadow-none data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 sm:basis-0"
                >
                  <SelectValue>
                    <span className="text-muted-foreground block text-chico font-normal">
                      {t("Cambiar material")}
                    </span>
                    <span className="text-foreground mt-0.5 block text-cuerpo font-semibold [overflow-wrap:anywhere] sm:text-cuerpo">
                      {selectedPdf?.title ?? t("Simulador y otros conceptos")}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  {pdfs.map((pdf) => (
                    <SelectItem key={pdf.id} value={pdf.id} className="min-h-11 whitespace-normal">
                      <span className="block min-w-0 [overflow-wrap:anywhere]">
                        <span className="block font-medium">{pdf.title}</span>
                        <span className="text-muted-foreground mt-0.5 block text-chico">
                          {pendingLabel(
                            views.filter(
                              (item) =>
                                studyErrorGroupId(item) === pdf.id && item.status === 'pending'
                            ).length
                          )}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  {unlinked.length > 0 && (
                    <SelectItem value={unlinkedId} className="min-h-11">
                      {t("Simulador y otros conceptos")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:hidden">
              <button
                className="border-border flex min-h-12 w-full items-center justify-between gap-3 border-y py-3 text-left"
                onClick={() => setMobileListOpen((open) => !open)}
                aria-expanded={mobileListOpen}
                aria-controls="mobile-errors"
              >
                <span className="min-w-0">
                  <span className="block truncate text-cuerpo font-semibold">
                    {selected?.topic ?? t("Elegí un error")}
                    {selected && selected.status === 'pending'
                      ? (english ? ` · Mistake ${Math.max(1, pending.findIndex((item) => item.id === selected.id) + 1)} of ${pending.length}` : ` · Error ${Math.max(1, pending.findIndex((item) => item.id === selected.id) + 1)} de ${pending.length}`)
                      : ''}
                  </span>
                  <span className="text-primary block text-chico">{t("Cambiar error")}</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 ${mobileListOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="grid min-w-0 gap-4 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-5">
              <aside
                id="mobile-errors"
                aria-label={t("Errores de este PDF")}
                className={`${mobileListOpen ? 'block' : 'hidden'} lg:border-border min-w-0 pt-4 lg:block lg:border-r lg:pr-5`}
              >
                <div className="flex gap-2">
                  {(['pending', 'resolved'] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={tab === value}
                      className={`min-h-11 flex-1 border-b-2 px-2 text-chico font-semibold ${tab === value ? 'border-primary text-primary' : 'text-muted-foreground border-transparent'}`}
                      onClick={() => {
                        setTab(value);
                        setSelectedId((value === 'pending' ? pending : resolved)[0]?.id ?? null);
                        setQuery('');
                      }}
                    >
                      {value === 'pending'
                        ? (english ? `Pending (${pending.length})` : `Pendientes (${pending.length})`)
                        : (english ? `Resolved (${resolved.length})` : `Resueltos (${resolved.length})`)}
                    </button>
                  ))}
                </div>
                <label className="border-border focus-within:ring-ring mt-3 flex min-h-11 items-center gap-2 rounded-xl border px-3 focus-within:ring-2">
                  <Search className="text-muted-foreground h-4 w-4 shrink-0" />
                  <input
                    type="search"
                    aria-label={t("Buscar tema")}
                    placeholder={t("Buscar tema")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full min-w-0 bg-transparent text-cuerpo outline-none"
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
                      <span className="block text-cuerpo font-semibold break-words">{item.topic}</span>
                      <span className="text-muted-foreground mt-1 block text-chico">
                        {english ? sourceLabelsEn[item.sourceType] : studyErrorSourceLabels[item.sourceType]} ·{' '}
                        {item.status === 'resolved'
                          ? t("Resuelto")
                          : (english ? `Missed ${item.failureCount} ${item.failureCount === 1 ? 'time' : 'times'}` : `Fallaste ${item.failureCount} ${item.failureCount === 1 ? 'vez' : 'veces'}`)}
                      </span>
                    </button>
                  ))}
                </nav>
                {!visible.length && (
                  <p className="!text-muted-foreground mt-4 !text-chico">
                    {query
                      ? t("No encontramos ese tema.")
                      : tab === 'pending'
                        ? t("No quedan errores pendientes.")
                        : t("Todavía no hay errores resueltos.")}
                  </p>
                )}
              </aside>
              <section className="min-w-0 py-4" aria-label={t("Repaso del error")}>
                {selected ? (
                  <StudyErrorDetail
                    key={conversationKey}
                    item={selected}
                    conversation={conversations[conversationKey] ?? initialConversation}
                    onConversationChange={(update) =>
                      setConversations((current) => ({
                        ...current,
                        [conversationKey]: update(current[conversationKey] ?? initialConversation),
                      }))
                    }
                    reviewActions={reviewActions}
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
                      if (!preview && selected.sourceType !== 'simulator') {
                        const href = pdfProgressReviewHref(id, selected);
                        if (href) router.push(href);
                        return;
                      }
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
                      setMaterialId(selected.sourceType === 'simulator' ? unlinkedId : id);
                      router.refresh();
                    }}
                    onNext={nextError}
                    onFinish={finish}
                  />
                ) : (
                  <div className="py-8">
                    <CheckCircle2 className="text-primary h-7 w-7" />
                    <h3 className="mt-3 text-titulo-sm font-semibold">
                      {tab === 'resolved'
                        ? t("Todavía no hay errores resueltos")
                        : t("Todo al día en este PDF")}
                    </h3>
                    <p className="!text-muted-foreground mt-2 !text-cuerpo">
                      {tab === 'resolved'
                        ? t("Los errores que compruebes después del repaso van a aparecer acá.")
                        : t("Podés seguir estudiando tu material o revisar tus conceptos resueltos.")}
                    </p>
                    {selectedPdf && (
                      <Link
                        href={`/materiales/${selectedPdf.id}`}
                        className={reviewPrimaryButton + ' mt-4'}
                      >
                        {t("Seguir estudiando mi PDF")}
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

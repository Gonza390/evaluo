'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  MessageCircle,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { previewErrors, previewMaterials, type PreviewError } from './study-errors-preview-data';

import { previewLearning } from './study-errors-preview-learning';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
type ExplanationState = 'loading' | 'ready' | 'error';
type Modal = 'associate' | null;

const FREE_REVIEW_LIMIT = 2;
function remainingErrorsCopy(count: number) {
  return count === 0
    ? 'No te quedan errores'
    : count === 1
      ? 'Te queda 1 error'
      : `Te quedan ${count} errores`;
}

export function StudyErrorsPreview() {
  const [errors, setErrors] = useState<PreviewError[]>(previewErrors);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'resolved'>('pending');
  const [query, setQuery] = useState('');
  const [explanations, setExplanations] = useState<Record<string, ExplanationState>>({});
  const [opened, setOpened] = useState<string[]>([]);
  const [reported, setReported] = useState<string[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [pdfVisibleId, setPdfVisibleId] = useState<string | null>(null);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [notice, setNotice] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [followups, setFollowups] = useState<Record<string, ('simple' | 'example')[]>>({});
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [usedReviews, setUsedReviews] = useState<string[]>([]);
  const reservedReviews = useRef(new Set<string>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generationVersions = useRef(new Map<string, number>());
  const lastErrorByMaterial = useRef(new Map<string, string>());
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const mobileControls = useRef<HTMLDivElement>(null);
  const pdfHeading = useRef<HTMLHeadingElement>(null);
  const navigationReady = useRef(false);
  const modalOpener = useRef<HTMLElement | null>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const material = previewMaterials.find((item) => item.id === materialId);
  const scoped = errors.filter((item) =>
    materialId === 'unlinked' ? !item.materialId : item.materialId === materialId
  );
  const pending = scoped.filter((item) => !item.resolved).sort((a, b) => b.failures - a.failures);
  const resolved = scoped.filter((item) => item.resolved);
  const visible = (tab === 'pending' ? pending : resolved).filter((item) =>
    `${item.topic} ${item.source} ${item.question}`
      .toLocaleLowerCase('es')
      .includes(query.toLocaleLowerCase('es'))
  );
  const selected = scoped.find((item) => item.id === selectedId);
  const explanationState = selected ? explanations[selected.id] : undefined;
  const isPracticing = Boolean(selected && practiceId === selected.id);
  const learning = selected ? previewLearning[selected.id] : undefined;
  const currentGroup = selected?.resolved ? resolved : pending;
  const errorPosition = Math.max(1, currentGroup.findIndex((item) => item.id === selectedId) + 1);
  const totalPending = errors.filter((item) => !item.resolved).length;
  const remainingReviews = Math.max(0, FREE_REVIEW_LIMIT - usedReviews.length);
  const needsNewReview = Boolean(selected && !usedReviews.includes(selected.id));
  const reviewLimitReached =
    plan === 'free' &&
    remainingReviews === 0 &&
    needsNewReview &&
    selected?.evidence === 'supported';

  useEffect(() => {
    if (materialId && selectedId) lastErrorByMaterial.current.set(materialId, selectedId);
    if (!navigationReady.current) {
      navigationReady.current = true;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const heading = materialId ? detailHeading.current : pdfHeading.current;
      heading?.focus({ preventScroll: true });
      const anchor =
        materialId && !practiceId && window.innerWidth < 1024 ? mobileControls.current : heading;
      anchor?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [materialId, selectedId, practiceId]);

  function chooseMaterial(id: string) {
    setMobileListOpen(false);
    const group = errors.filter((item) =>
      id === 'unlinked' ? !item.materialId : item.materialId === id
    );
    const resume =
      group.find((item) => !item.resolved && item.id === lastErrorByMaterial.current.get(id)) ??
      group.find((item) => !item.resolved && explanations[item.id] === 'ready');
    const first =
      resume ??
      group.filter((item) => !item.resolved).sort((a, b) => b.failures - a.failures)[0] ??
      group[0];
    setPdfVisibleId(null);
    setPracticeId(null);
    setMaterialId(id);
    setSelectedId(first?.id ?? null);
    setTab(group.some((item) => !item.resolved) ? 'pending' : 'resolved');
    setQuery('');
    setNotice('');
  }

  function generateExplanation(ignoreSimulatedFailure = false) {
    if (!selected || explanationState === 'loading') return;
    const id = selected.id;
    const consumesReview = selected.evidence === 'supported' && !usedReviews.includes(id);
    const occupiedReviews = new Set([...usedReviews, ...reservedReviews.current]).size;
    if (plan === 'free' && consumesReview && occupiedReviews >= FREE_REVIEW_LIMIT) {
      setNotice(
        'Hoy ya usaste tus 2 repasos gratuitos. Mañana tenés 2 nuevos. Podés continuar con tus explicaciones anteriores.'
      );
      return;
    }
    if (consumesReview) reservedReviews.current.add(id);
    const version = (generationVersions.current.get(id) ?? 0) + 1;
    generationVersions.current.set(id, version);
    setExplanations((current) => ({ ...current, [id]: 'loading' }));
    const timer = setTimeout(() => {
      if (generationVersions.current.get(id) !== version) return;
      const failed = simulateFailure && !ignoreSimulatedFailure;
      reservedReviews.current.delete(id);
      if (!failed && consumesReview) {
        setUsedReviews((current) => (current.includes(id) ? current : [...current, id]));
      }
      setExplanations((current) => ({ ...current, [id]: failed ? 'error' : 'ready' }));
    }, 1100);
    timers.current.push(timer);
  }

  function openPractice() {
    if (!selected || !learning || selected.evidence !== 'supported') return;
    setAnswer(null);
    setResult(null);
    setPdfVisibleId(null);
    setPracticeId(selected?.id ?? null);
  }

  function openAssociate() {
    modalOpener.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setModal('associate');
  }

  function checkAnswer() {
    if (!selected || answer === null || result) return;
    if (!learning || selected.evidence !== 'supported') return;
    const correct = answer === learning.correct;
    setResult(correct ? 'correct' : 'incorrect');
    setErrors((current) =>
      current.map((item) =>
        item.id === selected.id
          ? { ...item, resolved: correct, failures: item.failures + (correct ? 0 : 1) }
          : item
      )
    );
  }

  function openPdf() {
    if (!selected) return;
    setPdfVisibleId(selected.id);
    setOpened((current) => (current.includes(selected.id) ? current : [...current, selected.id]));
  }

  function nextError() {
    setMobileListOpen(false);
    setPracticeId(null);
    setPdfVisibleId(null);
    const next = pending.find((item) => item.id !== selectedId) ?? pending[0];
    setModal(null);
    setTab('pending');
    setQuery('');
    setSelectedId(next?.id ?? null);
    setNotice(
      next
        ? next.id === selectedId
          ? 'Este es el único error pendiente del PDF. Podés seguir repasándolo.'
          : ''
        : pending.length
          ? 'No hay otro error pendiente. Podés continuar con este desde la lista.'
          : 'Terminaste los errores pendientes de este PDF.'
    );
  }

  function finishSession() {
    setMaterialId(null);
    setPracticeId(null);
    setPdfVisibleId(null);
    setMobileListOpen(false);
    setNotice(
      'Terminaste el repaso por hoy. ' +
        remainingErrorsCopy(pending.length) +
        ' en ' +
        (material?.title ?? 'este PDF') +
        '. El avance se conserva mientras esta demo siga abierta.'
    );
  }

  function reset() {
    setPlan('free');
    setUsedReviews([]);
    reservedReviews.current.clear();
    generationVersions.current.clear();
    lastErrorByMaterial.current.clear();
    setMobileListOpen(false);
    setFollowups({});
    setPdfVisibleId(null);
    setPracticeId(null);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setErrors(previewErrors);
    setExplanations({});
    setOpened([]);
    setReported([]);
    setMaterialId(null);
    setSelectedId(null);
    setModal(null);
    setNotice('');
    setSimulateFailure(false);
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="border-primary/20 bg-primary/5 mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
          <div>
            <span className="text-primary text-xs font-bold tracking-widest uppercase">
              Preview interactivo
            </span>
            <p className="!text-muted-foreground !text-xs">
              Datos, PDF e IA simulados. El progreso se conserva mientras esta página esté abierta.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs">
            Plan simulado
            <select
              aria-label="Plan simulado"
              value={plan}
              onChange={(event) => setPlan(event.target.value as 'free' | 'premium')}
              className="bg-background min-h-11 rounded-xl border px-3"
            >
              <option value="free">Gratis</option>
              <option value="premium">Premium</option>
            </select>
          </label>
          <button className={secondaryButton} onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Reiniciar demo
          </button>
        </div>

        <header className={materialId ? 'mb-4 lg:mb-7' : 'mb-7'}>
          <div
            className={
              (materialId ? 'hidden lg:flex' : 'flex') +
              ' text-primary mb-2 items-center gap-2 text-xs font-semibold tracking-widest uppercase'
            }
          >
            <BookOpen className="h-4 w-4" />
            Tus apuntes, tu progreso
          </div>
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">Mis errores</h1>
          <p className={(materialId ? 'hidden lg:block ' : '') + '!text-muted-foreground mt-2'}>
            Entendé por qué te equivocaste y repasá el tema en tus propios PDFs.
          </p>
          <div
            className={(materialId ? 'hidden lg:flex' : 'flex') + ' mt-4 flex-wrap gap-2 text-sm'}
          >
            <span className="bg-background rounded-full border px-3 py-1.5">
              {totalPending} errores pendientes
            </span>
            <span className="bg-background rounded-full border px-3 py-1.5">
              {previewMaterials.length} PDFs
            </span>
            <span className="bg-background rounded-full border px-3 py-1.5">
              {errors.length - totalPending} resueltos
            </span>
          </div>
        </header>

        {!isPracticing && (
          <section aria-label="Tus repasos con Evaluo" className="mb-6 border-y py-4">
            <p className="text-sm font-semibold" role="status">
              {plan === 'free'
                ? remainingReviews
                  ? 'Hoy podés reforzar ' +
                    remainingReviews +
                    (remainingReviews === 1 ? ' error' : ' errores') +
                    ' con ayuda de Evaluo.'
                  : 'Ya usaste tus 2 repasos con ayuda de hoy.'
                : 'Premium · Seguí reforzando tus temas con tus apuntes.'}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Cada repaso incluye explicación, una versión más simple, un ejemplo y una pregunta.
              Podés volver a consultar lo ya explicado.
            </p>
          </section>
        )}
        {!materialId ? (
          <section aria-labelledby="choose-pdf">
            {notice && (
              <p role="status" className="border-primary mb-5 border-l-2 pl-4 text-sm">
                {notice}
              </p>
            )}
            <h2
              ref={pdfHeading}
              tabIndex={-1}
              id="choose-pdf"
              className="mb-1 scroll-mt-4 text-xl font-bold outline-none"
            >
              ¿Qué PDF querés reforzar?
            </h2>
            <p className="!text-muted-foreground mb-5 !text-sm">
              Elegí tus apuntes, entendé cada error y volvé a responder para comprobar lo aprendido.
            </p>
            <div className="divide-y border-y">
              {previewMaterials.map((pdf) => {
                const group = errors.filter((item) => item.materialId === pdf.id);
                const count = group.filter((item) => !item.resolved).length;
                const remaining = group.filter((item) => !item.resolved);
                const recurrent = remaining.reduce<PreviewError | null>(
                  (best, item) => (!best || item.failures > best.failures ? item : best),
                  null
                );
                const topics = [...new Set(remaining.map((item) => item.topic))];
                const sources = [...new Set(remaining.map((item) => item.source))];
                const resume = group.find((item) => !item.resolved && opened.includes(item.id));
                return (
                  <button
                    key={pdf.id}
                    onClick={() => chooseMaterial(pdf.id)}
                    className="group hover:bg-muted/30 focus-visible:outline-ring grid w-full grid-cols-[24px_minmax(0,1fr)] gap-4 px-2 py-6 text-left transition focus-visible:outline-2 sm:gap-6 sm:px-4"
                  >
                    <FileText className="text-muted-foreground mt-1 h-5 w-5" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs font-medium">
                        {pdf.subject}
                      </span>
                      <h3 className="mt-1 text-lg font-bold tracking-tight">{pdf.title}</h3>
                      {recurrent && recurrent.failures > 1 && (
                        <span className="text-primary mt-3 block text-sm font-semibold">
                          Más recurrente: {recurrent.topic}
                          <span className="text-muted-foreground block text-xs font-normal sm:ml-2 sm:inline">
                            Fallaste esta pregunta {recurrent.failures} veces
                          </span>
                        </span>
                      )}
                      <span className="text-foreground mt-3 block text-sm">
                        {topics.length
                          ? topics.join(' · ')
                          : 'No tenés temas pendientes en este PDF.'}
                      </span>
                      {sources.length > 0 && (
                        <span className="text-muted-foreground mt-2 block text-xs">
                          Errores de {sources.join(' · ')}
                        </span>
                      )}
                      <span className="text-muted-foreground mt-3 inline-block text-xs">
                        {count
                          ? `${count} ${count === 1 ? 'error pendiente' : 'errores pendientes'}`
                          : 'Sin errores pendientes'}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        · {group.length - count}{' '}
                        {group.length - count === 1 ? 'resuelto' : 'resueltos'} · {pdf.pages}{' '}
                        páginas
                      </span>
                      <span className="text-primary mt-4 flex min-h-8 w-fit items-center gap-2 text-sm font-semibold">
                        {resume
                          ? `Continuar con ${resume.topic}`
                          : count
                            ? 'Revisar estos temas'
                            : 'Ver lo que resolví'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => chooseMaterial('unlinked')}
              className={`${secondaryButton} mt-5 w-full justify-between`}
            >
              <span className="inline-flex items-center gap-2">
                <CircleAlert className="h-4 w-4" />
                Sin PDF asociado ·{' '}
                {errors.filter((item) => !item.materialId && !item.resolved).length} pendiente
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                className={secondaryButton}
                onClick={() => {
                  setMaterialId(null);
                  setNotice('');
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Mis PDFs
              </button>
              <label className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">Material</span>
                <select
                  aria-label="Cambiar PDF"
                  value={materialId}
                  onChange={(event) => chooseMaterial(event.target.value)}
                  className="bg-background min-h-11 max-w-64 min-w-0 rounded-xl border px-3 text-sm"
                >
                  <option value="unlinked">Sin PDF asociado</option>
                  {previewMaterials.map((pdf) => (
                    <option key={pdf.id} value={pdf.id}>
                      {pdf.title} ·{' '}
                      {errors.filter((item) => item.materialId === pdf.id && !item.resolved).length}{' '}
                      {errors.filter((item) => item.materialId === pdf.id && !item.resolved)
                        .length === 1
                        ? 'pendiente'
                        : 'pendientes'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mb-6 border-b py-4">
              <h2 className="text-xl font-bold">{material?.title ?? 'Errores sin PDF asociado'}</h2>
              <p className="!text-muted-foreground mt-1 !text-sm">
                {pending.length} {pending.length === 1 ? 'pendiente' : 'pendientes'} ·{' '}
                {resolved.length} {resolved.length === 1 ? 'resuelto' : 'resueltos'}
                {material
                  ? ` · ${material.subject}`
                  : ' · Conectá un material para buscar evidencia'}
              </p>
            </div>
            <div
              className={
                'grid items-start gap-6 ' +
                (isPracticing ? '' : 'lg:grid-cols-[300px_minmax(0,1fr)]')
              }
            >
              <div
                ref={mobileControls}
                className={
                  (isPracticing ? 'hidden' : 'flex') +
                  ' scroll-mt-4 items-center justify-between gap-3 border-b pb-3 lg:hidden'
                }
              >
                <p className="text-sm font-semibold">
                  {selected
                    ? selected.topic +
                      ' · ' +
                      (selected.resolved ? 'Resuelto ' : 'Error ') +
                      errorPosition +
                      ' de ' +
                      currentGroup.length
                    : 'Elegí un error'}
                </p>
                <button
                  className={secondaryButton}
                  aria-expanded={mobileListOpen}
                  aria-controls="preview-error-list"
                  onClick={() => setMobileListOpen(!mobileListOpen)}
                >
                  {mobileListOpen ? 'Cerrar lista' : 'Cambiar error'}
                </button>
              </div>
              <aside
                id="preview-error-list"
                className={
                  (isPracticing ? 'hidden' : (mobileListOpen ? 'block' : 'hidden') + ' lg:block') +
                  ' border-t py-4 lg:border-t-0 lg:border-r lg:pr-5'
                }
              >
                <div
                  className="bg-muted mb-4 grid grid-cols-2 gap-1 rounded-xl p-1"
                  aria-label="Estado de los errores"
                >
                  {(['pending', 'resolved'] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={tab === value}
                      onClick={() => {
                        setTab(value);
                        setPracticeId(null);
                        setPdfVisibleId(null);
                        setMobileListOpen(false);
                        setSelectedId((value === 'pending' ? pending : resolved)[0]?.id ?? null);
                        setQuery('');
                      }}
                      className={`min-h-10 rounded-lg text-sm font-semibold ${tab === value ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {value === 'pending'
                        ? `Pendientes (${pending.length})`
                        : `Resueltos (${resolved.length})`}
                    </button>
                  ))}
                </div>
                <label className="focus-within:ring-ring mb-4 flex items-center gap-2 rounded-xl border px-3 focus-within:ring-2">
                  <Search className="text-muted-foreground h-4 w-4" />
                  <input
                    aria-label="Buscar un error"
                    placeholder="Buscar un tema…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </label>
                <div className="max-h-72 space-y-2 overflow-y-auto lg:max-h-[600px]">
                  {visible.map((item, index) => (
                    <button
                      key={item.id}
                      aria-pressed={selected?.id === item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setMobileListOpen(false);
                        setPracticeId(null);
                        setPdfVisibleId(null);
                        setNotice('');
                      }}
                      className={`focus-visible:outline-ring w-full border-l-2 p-3 text-left transition focus-visible:outline-2 ${selected?.id === item.id ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/60 border-transparent'}`}
                    >
                      {index === 0 && tab === 'pending' && !query && (
                        <span className="text-primary mb-1 block text-[10px] font-bold tracking-widest uppercase">
                          Empezá por este
                        </span>
                      )}
                      <span className="block text-sm font-semibold">{item.topic}</span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {item.source} ·{' '}
                        {item.evidence === 'conflict'
                          ? 'Actividad por revisar'
                          : item.resolved
                            ? 'Resuelto'
                            : `Fallaste ${item.failures} ${item.failures === 1 ? 'vez' : 'veces'}`}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {item.page ? `Página ${item.page}` : 'Sin página identificada'}
                        {opened.includes(item.id) && !item.resolved ? ' · PDF abierto' : ''}
                      </span>
                    </button>
                  ))}
                  {!visible.length && (
                    <p className="!text-muted-foreground px-2 py-5 !text-sm">
                      {query
                        ? 'No hay errores que coincidan con tu búsqueda.'
                        : tab === 'pending'
                          ? 'No quedan errores pendientes en este material.'
                          : 'Todavía no hay errores resueltos.'}
                    </p>
                  )}
                </div>
              </aside>

              <section className="min-w-0 py-4 lg:pl-4" aria-label="Detalle del error">
                {selected ? (
                  <>
                    {!isPracticing && (
                      <>
                        <div className="mb-4 flex flex-wrap gap-2 text-xs">
                          <span className="bg-muted rounded-full px-3 py-1">{selected.source}</span>
                          <span className="bg-muted rounded-full px-3 py-1">
                            {selected.evidence === 'conflict'
                              ? 'Respuesta por revisar'
                              : selected.resolved
                                ? 'Resuelto después del repaso'
                                : `Fallaste ${selected.failures} ${selected.failures === 1 ? 'vez' : 'veces'}`}
                          </span>
                          {opened.includes(selected.id) && !selected.resolved && (
                            <span className="bg-primary/10 text-primary rounded-full px-3 py-1">
                              PDF abierto · falta comprobar
                            </span>
                          )}
                        </div>
                        <h2
                          ref={detailHeading}
                          tabIndex={-1}
                          className="scroll-mt-4 text-2xl font-black tracking-tighter outline-none"
                        >
                          {selected.topic}
                        </h2>
                        <p className="!text-foreground mt-3">{selected.question}</p>
                      </>
                    )}
                    {isPracticing ? (
                      <>
                        <div className="mb-6">
                          <h2
                            ref={detailHeading}
                            tabIndex={-1}
                            className="scroll-mt-4 text-xl font-bold outline-none"
                          >
                            Comprobá lo aprendido · Pregunta 1
                          </h2>
                          <p className="!text-muted-foreground mt-2 !text-sm">
                            Aplicá lo que acabás de repasar.
                          </p>
                          <p className="!text-foreground mt-5 text-lg leading-relaxed">
                            {learning?.question}
                          </p>
                        </div>
                        <fieldset disabled={result !== null} className="space-y-3">
                          <legend className="sr-only">Elegí una respuesta</legend>
                          {learning?.options.map((option, index) => (
                            <label
                              key={option}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${answer === index ? 'border-primary bg-primary/5' : ''}`}
                            >
                              <input
                                type="radio"
                                name="preview-answer"
                                className="mt-1"
                                checked={answer === index}
                                onChange={() => setAnswer(index)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </fieldset>
                        {!result ? (
                          <button
                            className={primaryButton + ' mt-6'}
                            disabled={answer === null}
                            onClick={checkAnswer}
                          >
                            Confirmar respuesta
                          </button>
                        ) : (
                          <div role="status" className="bg-muted/30 mt-6 rounded-xl border p-4">
                            <h4 className="font-bold">
                              {result === 'correct'
                                ? 'Resolviste este error.'
                                : 'Todavía queda por reforzar'}
                            </h4>
                            <p className="!text-foreground mt-2 !text-sm">
                              {result === 'correct'
                                ? `${remainingErrorsCopy(pending.length)} en este PDF.`
                                : 'El error sigue pendiente y sumamos este intento. Volvé al fragmento y probá otra vez.'}
                            </p>
                            {learning && <p className="mt-3 text-sm">{learning.feedback}</p>}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {result === 'correct' ? (
                                <button className={primaryButton} onClick={nextError}>
                                  Seguir con otro error
                                </button>
                              ) : (
                                <button
                                  className={primaryButton}
                                  onClick={() => setPracticeId(null)}
                                >
                                  Volver a repasar
                                </button>
                              )}
                              {result === 'correct' && (
                                <button className={secondaryButton} onClick={finishSession}>
                                  Terminar por hoy
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {!result && (
                          <div className="mt-4">
                            <button
                              className="text-muted-foreground hover:text-foreground focus-visible:outline-ring min-h-11 text-sm underline underline-offset-4 focus-visible:outline-2"
                              onClick={() => setPracticeId(null)}
                            >
                              Volver a la explicación
                            </button>
                          </div>
                        )}
                      </>
                    ) : material ? (
                      <>
                        <section className="mt-6" aria-label="Chat sobre este error">
                          <div className="flex items-center gap-2">
                            <Sparkles className="text-primary h-4 w-4" />
                            <h3 className="text-base font-semibold">
                              {selected.evidence === 'conflict'
                                ? 'Aclará esta diferencia con tus apuntes'
                                : selected.evidence === 'missing'
                                  ? 'Busquemos el tema en tus apuntes'
                                  : 'Entendé por qué esta respuesta es correcta'}
                            </h3>
                          </div>
                          <p className="!text-muted-foreground mt-1 !text-xs">
                            Evaluo te lo explica con tus apuntes: {material.title}.
                          </p>
                          {!explanationState && reviewLimitReached ? (
                            <div className="border-primary mt-4 border-l-2 pl-4">
                              <h4 className="font-semibold">Ya usaste tus 2 repasos de hoy</h4>
                              <p className="text-muted-foreground mt-2 text-sm">
                                Podés consultar este fragmento del PDF o volver a las explicaciones
                                que ya abriste. Esas ayudas siguen disponibles.
                              </p>
                              <p className="text-muted-foreground mt-3 text-xs">
                                Mañana tenés 2 nuevos repasos. Tus explicaciones anteriores y los
                                fragmentos siguen disponibles.
                              </p>
                            </div>
                          ) : !explanationState ? (
                            <button
                              className="group border-primary/20 bg-primary/5 hover:bg-primary/10 focus-visible:outline-ring mt-4 flex min-h-20 w-full items-center gap-3 border-y px-3 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-4 sm:px-4"
                              onClick={() => generateExplanation()}
                              aria-label="Ayudame a entenderlo"
                            >
                              <MessageCircle className="text-primary h-5 w-5 shrink-0" />
                              <span className="min-w-0 flex-1">
                                <span className="text-primary block text-base font-semibold">
                                  Ayudame a entenderlo
                                </span>
                                <span className="text-muted-foreground mt-1 block text-sm leading-relaxed">
                                  Recibí una explicación simple, paso a paso, con tu PDF.
                                </span>
                              </span>
                              <ArrowRight className="text-primary h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                            </button>
                          ) : (
                            <>
                              <div className="mt-6 flex justify-end">
                                <div className="bg-muted/60 max-w-[90%] rounded-2xl px-4 py-3">
                                  <span className="text-muted-foreground mb-1 block text-[10px] font-semibold tracking-wider uppercase">
                                    Vos
                                  </span>
                                  <p className="!text-foreground !text-sm">
                                    Ayudame a entender {selected.topic} con mi PDF.
                                  </p>
                                </div>
                              </div>
                              <div
                                className="mt-6"
                                aria-live="polite"
                                aria-busy={explanationState === 'loading'}
                              >
                                <span className="text-primary mb-3 block text-xs font-semibold">
                                  Evaluo
                                </span>
                                {explanationState === 'loading' && (
                                  <p className="!text-muted-foreground flex items-center gap-2 !text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Estoy revisando tu PDF…
                                  </p>
                                )}
                                {explanationState === 'error' && (
                                  <>
                                    <p className="!text-foreground !text-sm">
                                      No pude preparar la explicación. Podés revisar el pasaje del
                                      PDF o reintentar tu pregunta.
                                    </p>
                                    <button
                                      className={secondaryButton + ' mt-3'}
                                      onClick={() => {
                                        setSimulateFailure(false);
                                        generateExplanation(true);
                                      }}
                                    >
                                      Reintentar
                                    </button>
                                  </>
                                )}
                                {explanationState === 'ready' &&
                                  selected.evidence === 'missing' && (
                                    <>
                                      <p className="!text-foreground !text-sm">
                                        No encontré información suficiente en este PDF para
                                        explicarte esta pregunta. Podemos buscar el tema en otro de
                                        tus materiales.
                                      </p>
                                      <button
                                        className={secondaryButton + ' mt-3'}
                                        onClick={openAssociate}
                                      >
                                        Revisar otro PDF
                                      </button>
                                    </>
                                  )}
                                {explanationState === 'ready' &&
                                  selected.evidence !== 'missing' && (
                                    <>
                                      {selected.evidence === 'conflict' && (
                                        <p className="!text-foreground mb-2 !text-sm font-semibold">
                                          Encontré una diferencia entre la actividad y tus apuntes.
                                        </p>
                                      )}
                                      <p className="!text-foreground !text-sm">
                                        {selected.explanation}
                                      </p>
                                      <p className="!text-foreground mt-3 !text-sm">
                                        <strong>Para recordarlo: </strong>
                                        {selected.takeaway}
                                      </p>
                                      {selected.evidence === 'conflict' && (
                                        <div>
                                          <button
                                            className={secondaryButton}
                                            disabled={reported.includes(selected.id)}
                                            onClick={() =>
                                              setReported((current) => [...current, selected.id])
                                            }
                                          >
                                            {reported.includes(selected.id)
                                              ? 'Revisión solicitada (simulada)'
                                              : 'Solicitar revisión de la actividad'}
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                              </div>
                            </>
                          )}
                          {explanationState === 'ready' &&
                            selected.evidence === 'supported' &&
                            learning && (
                              <>
                                {(followups[selected.id] ?? []).map((kind, index) => (
                                  <div
                                    key={index}
                                    className="mt-5 border-l-2 pl-4"
                                    aria-live="polite"
                                  >
                                    <p className="text-sm font-semibold">
                                      {kind === 'simple' ? 'Más simple' : 'Dame un ejemplo'}
                                    </p>
                                    <p className="mt-2 text-sm">{learning[kind]}</p>
                                  </div>
                                ))}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {(['simple', 'example'] as const).map((kind) => (
                                    <button
                                      key={kind}
                                      className={secondaryButton}
                                      disabled={followups[selected.id]?.includes(kind)}
                                      onClick={() =>
                                        setFollowups((current) => ({
                                          ...current,
                                          [selected.id]: [...(current[selected.id] ?? []), kind],
                                        }))
                                      }
                                    >
                                      {kind === 'simple' ? 'Más simple' : 'Dame un ejemplo'}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          {selected.excerpt && (
                            <button
                              className="text-primary mt-3 flex min-h-11 w-fit items-center text-left text-xs font-semibold underline underline-offset-4"
                              onClick={() =>
                                pdfVisibleId === selected.id ? setPdfVisibleId(null) : openPdf()
                              }
                              aria-expanded={pdfVisibleId === selected.id}
                              aria-controls={'preview-source-' + selected.id}
                            >
                              Fuente: {selected.section}
                              {selected.page ? ' · pág. ' + selected.page : ''} — Ver fragmento
                            </button>
                          )}
                          {pdfVisibleId === selected.id && (
                            <section
                              id={'preview-source-' + selected.id}
                              className="border-primary/30 mb-6 border-l-2 pl-5"
                              aria-label="PDF dentro de Mis errores"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold">{selected.section}</h3>
                                <button
                                  className={secondaryButton}
                                  onClick={() => setPdfVisibleId(null)}
                                >
                                  Cerrar fragmento
                                </button>
                              </div>
                              <blockquote className="text-foreground mt-3 text-sm leading-7">
                                {selected.excerpt}
                              </blockquote>
                              <p className="!text-muted-foreground mt-3 !text-xs">
                                {material.title}
                                {selected.page ? ' · pág. ' + selected.page : ''} · Fragmento de
                                ejemplo
                              </p>
                            </section>
                          )}

                          {explanationState === 'ready' &&
                            selected.evidence === 'supported' &&
                            !selected.resolved &&
                            learning && (
                              <div className="mt-5 border-t pt-5">
                                <p className="font-semibold">¿Querés comprobar si lo entendiste?</p>
                                <button className={primaryButton + ' mt-3'} onClick={openPractice}>
                                  Responder una pregunta
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                        </section>

                        {!isPracticing && (
                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="border-l-2 py-1 pl-4">
                              <span className="text-muted-foreground text-xs font-semibold">
                                {selected.evidence !== 'supported'
                                  ? 'Tu respuesta'
                                  : 'Respuesta incorrecta'}
                              </span>
                              <p className="!text-foreground mt-1 !text-sm">
                                {selected.options[selected.chosen]}
                              </p>
                            </div>
                            <div className="border-l-2 py-1 pl-4">
                              <span className="text-muted-foreground text-xs font-semibold">
                                {selected.evidence !== 'supported'
                                  ? 'Respuesta marcada por la actividad'
                                  : 'Respuesta correcta'}
                              </span>
                              <p className="!text-foreground mt-1 !text-sm">
                                {selected.options[selected.correct]}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-7 flex flex-wrap gap-2 border-t pt-5">
                          {explanationState !== 'ready' &&
                            opened.includes(selected.id) &&
                            !selected.resolved &&
                            learning &&
                            selected.evidence === 'supported' && (
                              <button className={primaryButton} onClick={openPractice}>
                                Responder una pregunta
                              </button>
                            )}
                          <button className={secondaryButton} onClick={nextError}>
                            Siguiente error de este PDF
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button className={secondaryButton} onClick={finishSession}>
                            Terminar por hoy
                          </button>
                        </div>
                      </>
                    ) : (
                      <section className="mt-6 border-t py-5">
                        <h3 className="font-bold">Conectá este error con tus apuntes</h3>
                        <p className="!text-muted-foreground mt-2 !text-sm">
                          Elegí un PDF para buscar el contenido que necesitás reforzar.
                        </p>
                        <button className={`${primaryButton} mt-4`} onClick={openAssociate}>
                          Asociar un PDF
                        </button>
                        <button
                          className={`${secondaryButton} mt-4 ml-2`}
                          onClick={() =>
                            setNotice(
                              'En la versión final, este botón abrirá la carga de PDF y mostrará el estado de procesamiento. La demo no carga archivos.'
                            )
                          }
                        >
                          Subir un PDF
                        </button>
                      </section>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="text-primary mx-auto h-10 w-10" />
                    <h2
                      ref={detailHeading}
                      tabIndex={-1}
                      className="mt-4 scroll-mt-4 text-xl font-bold outline-none"
                    >
                      {tab === 'resolved'
                        ? 'Todavía no resolviste errores en este PDF'
                        : pending.length
                          ? 'Elegí un error para continuar'
                          : 'Todo al día en este PDF'}
                    </h2>
                    <p className="!text-muted-foreground mt-2 !text-sm">
                      {tab === 'resolved'
                        ? 'Elegí un pendiente, repasá el concepto y comprobá lo aprendido.'
                        : pending.length
                          ? 'Podés seleccionarlo en la lista de pendientes.'
                          : 'Consultá los resueltos o elegí otro material para seguir estudiando.'}
                    </p>
                    <button
                      className={`${secondaryButton} mt-5`}
                      onClick={() => {
                        const nextTab = tab === 'resolved' ? 'pending' : 'resolved';
                        setTab(nextTab);
                        setSelectedId((nextTab === 'pending' ? pending : resolved)[0]?.id ?? null);
                      }}
                    >
                      {tab === 'resolved' ? 'Volver a pendientes' : 'Ver resueltos'}
                    </button>
                  </div>
                )}
                {notice && (
                  <p
                    role="status"
                    className="bg-muted !text-foreground mt-5 rounded-xl p-4 !text-sm"
                  >
                    {notice}
                  </p>
                )}
              </section>
            </div>
          </>
        )}

        <details className="mt-8 border-t py-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Cómo probar todos los estados
          </summary>
          <div className="text-muted-foreground mt-3 space-y-2 text-sm">
            <p className="!text-muted-foreground !text-sm">
              Derecho penal → Finalismo: chat, PDF desplegado en el error y comprobación en esta
              misma pantalla. Ubicación del dolo: contradicción y solicitud de revisión. Biología →
              Regulación epigenética: evidencia insuficiente. Historia: PDF sin pendientes. Sin PDF
              asociado: elección de material.
            </p>
            <p className="!text-muted-foreground !text-sm">
              Para probar el límite: abrí la explicación de Finalismo y Culpabilidad, después cambiá
              a Biología → Transporte pasivo. Las ayudas de los primeros dos siguen disponibles.
              Podés cambiar el plan desde el selector de la demo.
            </p>
            <button
              className={secondaryButton}
              disabled={Object.values(explanations).includes('loading')}
              onClick={() => {
                setUsedReviews([]);
                setNotice(
                  'Nuevo día simulado: tenés 2 repasos nuevos. Conservamos las explicaciones y tu progreso.'
                );
              }}
            >
              Simular nuevo día
            </button>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(event) => setSimulateFailure(event.target.checked)}
              />
              Simular fallo de IA en la próxima generación
            </label>
            <p className="!text-muted-foreground !text-xs">
              La comprobación de todas las actividades es parte de la propuesta. Este preview usa
              preguntas de opción múltiple para representar ese paso. Los ejemplos académicos son
              ilustrativos.
            </p>
          </div>
        </details>
      </div>

      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = modalOpener.current?.isConnected
              ? modalOpener.current
              : detailHeading.current;
            target?.focus({ preventScroll: true });
          }}
        >
          <DialogTitle>Elegí un material</DialogTitle>
          <DialogDescription>
            Asociar un PDF no garantiza que contenga evidencia para esta pregunta.
          </DialogDescription>
          {modal === 'associate' && selected && (
            <div className="space-y-3">
              {previewMaterials.map((pdf) => (
                <button
                  key={pdf.id}
                  disabled={pdf.id === materialId}
                  className={`${secondaryButton} w-full justify-between`}
                  onClick={() => {
                    generationVersions.current.set(
                      selected.id,
                      (generationVersions.current.get(selected.id) ?? 0) + 1
                    );
                    reservedReviews.current.delete(selected.id);
                    setFollowups((current) => ({ ...current, [selected.id]: [] }));
                    setPdfVisibleId(null);
                    setPracticeId(null);
                    setMobileListOpen(false);
                    setErrors((current) =>
                      current.map((item) =>
                        item.id === selected.id
                          ? {
                              ...item,
                              materialId: pdf.id,
                              page: null,
                              section: '',
                              excerpt: '',
                              evidence: 'missing',
                            }
                          : item
                      )
                    );
                    setExplanations((current) => {
                      const copy = { ...current };
                      delete copy[selected.id];
                      return copy;
                    });
                    setMaterialId(pdf.id);
                    setTab('pending');
                    setQuery('');
                    setModal(null);
                    setNotice(
                      'Material asociado en la demo. Este ejemplo no tiene evidencia recuperada en el nuevo PDF.'
                    );
                  }}
                >
                  <span>{pdf.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

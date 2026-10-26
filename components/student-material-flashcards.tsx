'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Expand,
  RotateCcw,
  Shrink,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pdfStudyControlsClassName } from '@/components/study/pdf-study-styles';
import {
  getFlashcardProgressAction,
  saveFlashcardProgressAction,
} from '@/app/dashboard/materiales/actions';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { scheduleFlashcardReviewReminderAction } from '@/lib/actions/flashcard-review-reminders';
import { trackClientAnalyticsEvent } from '@/lib/analytics-client';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';

type RecallResult = 'known' | 'unknown';
type QualityVote = 'up' | 'down';

function shuffledIndexes(length: number) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[target]] = [indexes[target]!, indexes[index]!];
  }
  return indexes;
}

function resolveFlashcardFront(card: StudyFlashcard) {
  const front = card.front.trim();
  if (
    !/^¿Qué distinción importante conviene recordar para no confundir estos conceptos\??$/iu.test(
      front
    )
  ) {
    return front;
  }

  const detail = card.back.trim().replace(/[.!?]+$/u, '');
  const contrast = detail.match(/^Confundir\s+(.+?)\s+con\s+(.+)$/iu);
  if (contrast?.[1] && contrast[2]) {
    return `¿Cómo distinguís ${contrast[1]} de ${contrast[2]} según el material?`;
  }

  const sectionTitle = card.reference.sectionTitle?.trim();
  if (sectionTitle) {
    return `¿Qué confusión conceptual conviene evitar en “${sectionTitle}”?`;
  }

  return front;
}

function buildSessionOrder(recall: Record<number, RecallResult>, length: number) {
  const difficult = Object.entries(recall)
    .filter(([, result]) => result === 'unknown')
    .map(([index]) => Number(index))
    .filter((index) => index >= 0 && index < length);
  const remaining = shuffledIndexes(length).filter((index) => !difficult.includes(index));
  return [...shuffledIndexes(difficult.length).map((index) => difficult[index]!), ...remaining];
}

export function StudentMaterialFlashcards({
  cards,
  materialId,
  onComplete,
  demoMode = false,
  allowedCardIndices,
  topicTitle,
  onPracticeTopic,
}: {
  cards: StudyFlashcard[];
  materialId: string;
  onComplete?: () => void;
  demoMode?: boolean;
  allowedCardIndices?: number[];
  topicTitle?: string;
  onPracticeTopic?: () => void;
}) {
  const scopedIndices = useMemo(() => allowedCardIndices ?? cards.map((_, index) => index), [allowedCardIndices, cards]);
  // Desde el recorrido de un tema empezamos con sus tarjetas, sin otro paso inicial.
  // Los índices siguen siendo los del PDF completo para conservar su progreso.
  const [started, setStarted] = useState(demoMode || allowedCardIndices !== undefined);
  const [order, setOrder] = useState<number[]>(() =>
    allowedCardIndices ?? (demoMode ? cards.map((_, index) => index) : [])
  );
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flipReady, setFlipReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recallByCard, setRecallByCard] = useState<Record<number, RecallResult>>({});
  const [sessionRecall, setSessionRecall] = useState<Record<number, RecallResult>>({});
  const [voteByCard, setVoteByCard] = useState<Record<number, QualityVote>>({});
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [hasLoadedServer, setHasLoadedServer] = useState(false);
  const [progressSyncError, setProgressSyncError] = useState(false);
  const [showAllReviewTopics, setShowAllReviewTopics] = useState(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [reminderScheduled, setReminderScheduled] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const completionHandledRef = useRef(false);
  const storageKey = `evaluo:flashcards:${materialId}`;

  // Durante la hidratación de Next.js el HTML es visible, pero los manejadores
  // de React todavía no están conectados. Mostrar carga hasta ser interactivo.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFlipReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const currentCardIndex = order[position] ?? 0;
  const currentCard = cards[currentCardIndex];
  const knownCount = Object.values(sessionRecall).filter((result) => result === 'known').length;
  const unknownCount = Object.values(sessionRecall).filter((result) => result === 'unknown').length;
  const needsReviewCount = unknownCount;
  const reviewedCount = knownCount + unknownCount;
  const progress = order.length > 0 ? Math.round((reviewedCount / order.length) * 100) : 0;
  const currentVote = voteByCard[currentCardIndex];
  const allReviewed = started && order.length > 0 && reviewedCount >= order.length;
  // «Aprendiendo» indica la tarjeta actual sin clasificar; no es una respuesta.
  const learningCount = allowedCardIndices !== undefined && started && !allReviewed &&
    !sessionRecall[currentCardIndex] ? 1 : 0;
  const reviewTopics = useMemo(() => {
    const unknownIndexes = Object.entries(sessionRecall)
      .filter(([, result]) => result !== 'known')
      .map(([index]) => Number(index))
      .filter((index) => index >= 0 && index < cards.length);

    return Array.from(
      new Set(
        unknownIndexes
          .map((index) => {
            const card = cards[index];
            return card?.reference.sectionTitle?.trim() || card?.front.trim() || '';
          })
          .filter(Boolean)
      )
    ).slice(0, 12);
  }, [cards, sessionRecall]);

  const visibleReviewTopics = showAllReviewTopics ? reviewTopics : reviewTopics.slice(0, 3);
  const hiddenReviewTopicsCount = Math.max(0, reviewTopics.length - 3);

  const beginSession = useCallback((nextOrder: number[]) => {
    completionHandledRef.current = false;
    setOrder(nextOrder);
    setSessionRecall({});
    setPosition(0);
    setFlipped(false);
    setIsFullscreen(false);
    setShowAllReviewTopics(false);
    setReminderScheduled(false);
    setReminderError(null);
    setStarted(true);
  }, []);

  const startSession = useCallback(() => {
    const fullOrder = buildSessionOrder(recallByCard, cards.length);
    const allowed = new Set(scopedIndices);
    beginSession(fullOrder.filter((index) => allowed.has(index)));
    if (!demoMode)
      void trackClientAnalyticsEvent({
        eventName: 'student_material_flashcards_started',
        metadata: {
          material_id: materialId,
          card_count: scopedIndices.length,
        },
      });
  }, [beginSession, cards.length, demoMode, materialId, recallByCard, scopedIndices]);

  const finishSession = useCallback(() => {
    setStarted(false);
    setOrder([]);
    setSessionRecall({});
    setPosition(0);
    setFlipped(false);
    setIsFullscreen(false);
    setShowAllReviewTopics(false);
    setReminderScheduled(false);
    setReminderError(null);
    completionHandledRef.current = false;
  }, []);

  const reviewDifficult = useCallback(() => {
    const unknownIndexes = Object.entries(sessionRecall)
      .filter(([, result]) => result !== 'known')
      .map(([index]) => Number(index))
      .filter((index) => index >= 0 && index < cards.length);

    if (unknownIndexes.length === 0) return;

    beginSession(shuffledIndexes(unknownIndexes.length).map((index) => unknownIndexes[index]!));
  }, [beginSession, cards.length, sessionRecall]);

  useEffect(() => {
    if (!allReviewed || completionHandledRef.current) return;
    completionHandledRef.current = true;
    onComplete?.();
  }, [allReviewed, onComplete]);

  const scheduleTomorrowReminder = useCallback(() => {
    if (demoMode || unknownCount <= 0 || isSchedulingReminder || reminderScheduled) return;

    setIsSchedulingReminder(true);
    setReminderError(null);

    void scheduleFlashcardReviewReminderAction({
      materialId,
      topics: reviewTopics,
      unknownCount,
    })
      .then((result) => {
        if (result.success) {
          setReminderScheduled(true);
          return;
        }
        setReminderError(result.message ?? 'No pudimos guardar el recordatorio.');
      })
      .catch(() => {
        setReminderError('No pudimos guardar el recordatorio.');
      })
      .finally(() => {
        setIsSchedulingReminder(false);
      });
  }, [demoMode, isSchedulingReminder, materialId, reminderScheduled, reviewTopics, unknownCount]);

  useEffect(() => {
    if (demoMode) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          recall?: Record<number, RecallResult>;
          votes?: Record<number, QualityVote>;
        };
        setRecallByCard(parsed.recall ?? {});
        setVoteByCard(parsed.votes ?? {});
      }
    } catch {
      // El estudio sigue funcionando aunque el navegador bloquee storage.
    } finally {
      setHasLoadedProgress(true);
    }
  }, [demoMode, storageKey]);

  useEffect(() => {
    if (demoMode || !hasLoadedProgress) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ recall: recallByCard, votes: voteByCard })
      );
    } catch {
      // Persistencia opcional: nunca debe bloquear una sesión.
    }
  }, [demoMode, hasLoadedProgress, recallByCard, storageKey, voteByCard]);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    void getFlashcardProgressAction(materialId)
      .then((result) => {
        if (!active) return;
        if (!result.success) {
          setProgressSyncError(true);
          return;
        }
        // Mantener los cambios locales que pueden haber ocurrido mientras cargaba el servidor.
        setRecallByCard((current) => ({ ...result.progress.recall, ...current }));
        setVoteByCard((current) => ({ ...result.progress.votes, ...current }));
      })
      .catch(() => {
        if (active) setProgressSyncError(true);
      })
      .finally(() => {
        if (active) setHasLoadedServer(true);
      });
    return () => {
      active = false;
    };
  }, [demoMode, materialId]);

  useEffect(() => {
    if (demoMode || !hasLoadedProgress || !hasLoadedServer) return;

    const indexes = new Set<number>([
      ...Object.keys(recallByCard).map(Number),
      ...Object.keys(voteByCard).map(Number),
    ]);
    if (indexes.size === 0) return;

    const entries = [...indexes].map((cardIndex) => ({
      cardIndex,
      recall: recallByCard[cardIndex] ?? null,
      vote: voteByCard[cardIndex] ?? null,
    }));

    let active = true;
    let retryTimer: number | null = null;
    const persist = async (attempt: number) => {
      try {
        const result = await saveFlashcardProgressAction(materialId, entries);
        if (!result.success) throw new Error(result.message);
        if (active) setProgressSyncError(false);
      } catch {
        if (!active) return;
        setProgressSyncError(true);
        // El caché local conserva los cambios; los errores transitorios se reintentan.
        if (attempt < 2) {
          retryTimer = window.setTimeout(() => void persist(attempt + 1), 2_000 * (attempt + 1));
        }
      }
    };

    const timer = window.setTimeout(() => void persist(0), 800);
    return () => {
      active = false;
      window.clearTimeout(timer);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [demoMode, hasLoadedProgress, hasLoadedServer, materialId, recallByCard, voteByCard]);

  const navigateBack = useCallback(() => {
    setPosition((current) => Math.max(0, current - 1));
    setFlipped(false);
  }, []);

  const markRecall = useCallback(
    (result: RecallResult) => {
      if (!flipped || !currentCard) return;

      setRecallByCard((current) => ({ ...current, [currentCardIndex]: result }));
      setSessionRecall((current) => ({ ...current, [currentCardIndex]: result }));

      if (!demoMode) {
        void recordStudentMaterialStudyResultAction({
          resultId: crypto.randomUUID(),
          materialId,
          sourceType: 'flashcard',
          itemKey: `flashcard:${currentCardIndex}`,
          wasCorrect: result === 'known',
          topic: currentCard.reference.sectionTitle ?? currentCard.front,
          prompt: currentCard.front,
          explanation: currentCard.back,
          correctAnswer: currentCard.back,
          selectedAnswer: result === 'known' ? currentCard.back : 'No lo sabía',
          reference: currentCard.reference,
        });
      }

      if (position < order.length - 1) {
        setPosition((current) => Math.min(order.length - 1, current + 1));
        setFlipped(false);
        return;
      }

      setFlipped(false);
      setIsFullscreen(false);
    },
    [currentCard, currentCardIndex, demoMode, flipped, materialId, order.length, position]
  );

  useEffect(() => {
    if (!started) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        if (target?.closest('button')) return;
        event.preventDefault();
        setFlipped((current) => !current);
      } else if (event.key === 'ArrowLeft') {
        if (target?.closest('button')) return;
        event.preventDefault();
        navigateBack();
      } else if (event.key === 'ArrowUp') {
        if (target?.closest('button')) return;
        event.preventDefault();
        markRecall('known');
      } else if (event.key === 'ArrowDown') {
        if (target?.closest('button')) return;
        event.preventDefault();
        markRecall('unknown');
      } else if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, markRecall, navigateBack, started]);

  const displayFront = currentCard ? resolveFlashcardFront(currentCard) : '';

  if (scopedIndices.length === 0) {
    return (
      <div className="border-border bg-muted rounded-2xl border px-5 py-8 text-center">
        <p className="text-foreground font-semibold">No encontramos conceptos suficientes</p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Regenerá el resumen y el glosario para intentar construir tarjetas útiles.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="border-primary/20 bg-card rounded-2xl border px-4 py-5 text-center sm:px-5">
        <div className="bg-primary mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-none">
          <RotateCcw className="h-5 w-5" />
        </div>
        <h3 className="text-foreground mt-3 text-[18px] font-bold tracking-[-0.04em]">
          Listo para aprender con flashcards
        </h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6">
          Vas a practicar {scopedIndices.length} conceptos {allowedCardIndices ? 'de este tema' : 'del PDF'} con recuperación activa. Intentá
          responder antes de voltear cada tarjeta.
        </p>
        <Button type="button" onClick={startSession} className="mt-5 rounded-2xl px-6">
          Comenzar repaso
        </Button>
      </div>
    );
  }

  if (allReviewed && allowedCardIndices !== undefined) {
    return (
      <div data-topic-flashcards-result className="border-border bg-card mx-auto w-full max-w-[640px] rounded-2xl border px-5 py-6 text-center sm:px-8">
        <div className="bg-emerald-50 mx-auto flex size-11 items-center justify-center rounded-xl text-emerald-600"><Check className="size-5" /></div>
        {topicTitle ? <p className="text-muted-foreground mt-3 text-xs font-semibold">{topicTitle}</p> : null}
        <h3 className="text-foreground mt-2 text-xl font-bold">¡Terminaste de repasar este tema!</h3>
        <p className="text-muted-foreground mt-2 text-sm">Ahora comprobá cuánto aprendiste con las preguntas del tema.</p>
        <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Resultado del repaso">
          <div className="rounded-xl border border-red-100 bg-red-50/60 px-2 py-3">
            <p className="text-xl font-bold text-red-600">{unknownCount}</p><p className="text-xs text-red-700">Mal</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-2 py-3">
            <p className="text-xl font-bold text-amber-600">{learningCount}</p><p className="text-xs text-amber-700">Aprendiendo</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-2 py-3">
            <p className="text-xl font-bold text-emerald-600">{knownCount}</p><p className="text-xs text-emerald-700">Bien</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button data-topic-flashcards-primary type="button" onClick={onPracticeTopic} disabled={!onPracticeTopic} className="min-h-11 w-full rounded-xl">
            Practicar este tema <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </Button>
          {needsReviewCount > 0 ? (
            <Button data-topic-flashcards-review type="button" variant="outline" onClick={reviewDifficult} className="min-h-11 w-full rounded-xl">
              <RotateCcw aria-hidden="true" className="mr-2 size-4" /> Repasar tarjetas ({needsReviewCount})
            </Button>
          ) : null}
        </div>
        {!onPracticeTopic ? <p className="text-muted-foreground mt-3 text-xs" role="status">Este tema todavía no tiene preguntas disponibles para practicar.</p> : null}
        {!demoMode && progressSyncError ? <p className="mt-3 text-xs text-amber-700" role="status">El progreso sigue guardado en este navegador, pero aún no pudimos sincronizarlo.</p> : null}
      </div>
    );
  }

  if (allReviewed) {
    return (
      <>
        <div className="bg-card rounded-2xl border border-emerald-200 px-4 py-5 text-center sm:px-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-none">
            <Check className="h-5 w-5" />
          </div>
          <h3 className="text-foreground mt-3 text-[18px] font-bold tracking-[-0.04em]">
            ¡Terminaste esta sesión!
          </h3>
          <p className="text-foreground mt-2 text-sm font-semibold">
            {knownCount} lo sabías · {unknownCount} no lo sabías
          </p>
          {unknownCount > 0 ? (
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs leading-5">
              Podés cerrar la sesión o volver a practicar únicamente las {unknownCount} que no
              sabías.
            </p>
          ) : (
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs leading-5">
              Completaste todas las tarjetas sin pendientes para repasar.
            </p>
          )}
          {unknownCount > 0 && reviewTopics.length > 0 ? (
            <div className="mx-auto mt-5 w-full max-w-xl border-t border-emerald-100 pt-5 text-left">
              <h4 className="text-foreground text-sm font-semibold">Temas para repasar</h4>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Estos son los temas que te costaron en esta sesión.
              </p>
              <ul className="border-border mt-3 divide-y divide-slate-200 border-y">
                {visibleReviewTopics.map((topic) => (
                  <li key={topic} className="text-foreground py-2.5 text-sm font-semibold">
                    {topic}
                  </li>
                ))}
              </ul>
              {hiddenReviewTopicsCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAllReviewTopics((current) => !current)}
                  className="text-primary hover:text-primary mt-2 text-xs font-semibold"
                >
                  {showAllReviewTopics
                    ? 'Ver menos'
                    : `Ver ${hiddenReviewTopicsCount} tema${hiddenReviewTopicsCount === 1 ? '' : 's'} más`}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {unknownCount > 0 ? (
              <>
                {!demoMode && (
                  <Button
                    type="button"
                    onClick={scheduleTomorrowReminder}
                    disabled={isSchedulingReminder || reminderScheduled}
                    className="rounded-2xl px-6"
                  >
                    <Bell className="h-4 w-4" />
                    {isSchedulingReminder
                      ? 'Guardando...'
                      : reminderScheduled
                        ? 'Te recordamos mañana'
                        : 'Recordarme mañana'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={reviewDifficult}
                  className="rounded-2xl px-6"
                >
                  <RotateCcw className="h-4 w-4" /> Repasar ahora
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={finishSession}
              className="rounded-2xl px-6"
            >
              <Check className="h-4 w-4" /> Finalizar sesión
            </Button>
          </div>
          {!demoMode && progressSyncError ? (
            <p role="status" className="text-amber-700 mx-auto mt-3 max-w-md text-xs leading-5">
              Guardamos tus tarjetas en este navegador, pero todavía no pudimos sincronizarlas.
              Volveremos a intentarlo.
            </p>
          ) : null}
          {reminderError ? (
            <p className="text-destructive mx-auto mt-3 max-w-md text-xs leading-5">
              {reminderError}
            </p>
          ) : null}
          {reminderScheduled ? (
            <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-emerald-700">
              Listo. Mañana te enviamos un recordatorio para retomar estos temas.
            </p>
          ) : null}
        </div>
      </>
    );
  }

  if (!currentCard) return null;

  const topicMode = allowedCardIndices !== undefined;
  const recallControls = (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" data-flashcard-grade="bad" disabled={!flipped} onClick={() => markRecall('unknown')} className="min-h-10 rounded-xl border-red-200 px-2 text-red-700 hover:bg-red-50">
        {topicMode ? 'Mal' : 'No lo sabía'}
      </Button>
      <Button type="button" variant="outline" data-flashcard-grade="good" disabled={!flipped} onClick={() => markRecall('known')} className="min-h-10 rounded-xl border-emerald-200 px-2 text-emerald-700 hover:bg-emerald-50">
        {topicMode ? 'Bien' : 'Lo sabía'}
      </Button>
    </div>
  );

  const session = (
    <>
      <div
        className={cn(
          'mx-auto w-full',
          topicMode ? 'max-w-[640px] space-y-2.5' : 'max-w-[720px] space-y-3',
          isFullscreen && 'flex min-h-full flex-col justify-center'
        )}
      >
        <div className={cn('flex flex-wrap items-center justify-between', topicMode ? 'gap-1' : 'gap-3')}>
          <div>
            <p className={cn('text-foreground text-xs font-semibold', !topicMode && 'hidden md:block')}>
              Tarjeta {position + 1} de {order.length}
            </p>
            {topicMode ? (
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold" aria-label="Estado de las tarjetas">
                <span data-flashcards-bad className="rounded-full border border-red-200 px-2.5 py-0.5 text-red-600">{unknownCount} Mal</span>
                <span data-flashcards-learning className="rounded-full border border-amber-200 px-2.5 py-0.5 text-amber-600">{learningCount} Aprendiendo</span>
                <span data-flashcards-good className="rounded-full border border-emerald-200 px-2.5 py-0.5 text-emerald-600">{knownCount} Bien</span>
              </div>
            ) : !demoMode ? (
              <p className="mt-0.5 flex gap-4 text-sm font-semibold">
                <span className="text-emerald-700"><Check className="mr-1 inline size-4" />{knownCount} lo sabía</span>
                <span className="text-destructive">{unknownCount} no lo sabía</span>
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {!demoMode && !topicMode && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen((value) => !value)}
                aria-label={
                  isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'
                }
                className="rounded-xl"
              >
                {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </Button>
            )}
            {isFullscreen ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                aria-label="Cerrar pantalla completa"
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={cn('overflow-hidden rounded-full bg-slate-100', topicMode ? 'h-1' : 'h-2')}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Progreso ${progress}%`}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={cn('mx-auto w-full', topicMode ? 'max-w-[610px]' : 'max-w-[720px]')}>
          {/* Una única superficie clicable y una sola cara visible.
              No dependemos de overlays transparentes ni de backface-visibility. */}
          <button
            type="button"
            data-flashcard-card
            aria-label={flipped ? 'Mostrar pregunta' : 'Mostrar respuesta'}
            aria-pressed={flipped}
            data-flashcard-ready={flipReady}
            disabled={!flipReady}
            onClick={() => setFlipped((value) => !value)}
            className={cn(
              'block w-full cursor-pointer rounded-2xl text-center outline-none disabled:cursor-progress focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              topicMode ? 'h-[190px] sm:h-[205px]' : 'h-[188px] sm:h-[210px]'
            )}
          >
            {flipped ? (
              <span
                data-flashcard-face="back"
                className="border-primary/20 bg-primary/5 flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border px-4 py-3 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 sm:px-5"
              >
                {topicMode && topicTitle ? (
                  <span data-flashcard-topic className="text-muted-foreground mb-2 max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium">{topicTitle}</span>
                ) : null}
                <span className="text-primary text-[11px] font-semibold tracking-[0.14em] uppercase">Respuesta</span>
                <span className="text-foreground mt-2 max-h-[115px] w-full overflow-y-auto text-[13px] leading-5 sm:max-h-[140px] sm:text-sm">{currentCard.back}</span>
                <span className="text-muted-foreground mt-2 text-[11px]">Hacé clic para volver a la pregunta</span>
              </span>
            ) : (
              <span
                data-flashcard-face="front"
                className="border-border bg-card flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border px-4 py-3 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 sm:px-5"
              >
                {topicMode && topicTitle ? (
                  <span data-flashcard-topic className="text-muted-foreground mb-2 max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium">{topicTitle}</span>
                ) : null}
                <span className="text-primary text-[11px] font-semibold tracking-[0.14em] uppercase">Pregunta</span>
                <span className="text-foreground mt-2 max-h-[105px] w-full overflow-y-auto text-[15px] leading-5 font-semibold tracking-tight sm:max-h-[125px] sm:text-[16px]">{displayFront}</span>
                <span className="text-muted-foreground mt-2 text-[11px]">Hacé clic para girar</span>
              </span>
            )}
          </button>
        </div>

        <div className={cn('mx-auto w-full', topicMode ? 'max-w-[610px]' : 'max-w-[720px]')}>{recallControls}</div>

        <div className={cn('items-center justify-center gap-3 md:hidden', topicMode ? 'hidden' : 'flex')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              setVoteByCard((current) => {
                const next = { ...current };
                if (currentVote === 'up') delete next[currentCardIndex];
                else next[currentCardIndex] = 'up';
                return next;
              })
            }
            aria-label="Me gusta esta tarjeta"
            aria-pressed={currentVote === 'up'}
            className={cn(
              'size-11 shrink-0 rounded-xl',
              currentVote === 'up' && 'bg-primary/10 text-primary'
            )}
          >
            <ThumbsUp aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={navigateBack}
            disabled={position === 0}
            aria-label="Tarjeta anterior"
            className="size-11 shrink-0 rounded-xl"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <span
            className="text-muted-foreground min-w-12 text-center text-xs tabular-nums"
            aria-label={`Tarjeta ${position + 1} de ${order.length}`}
          >
            {position + 1} / {order.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setPosition((current) => Math.min(order.length - 1, current + 1));
              setFlipped(false);
            }}
            disabled={position === order.length - 1}
            aria-label="Tarjeta siguiente"
            className="size-11 shrink-0 rounded-xl"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className={cn('items-center justify-between gap-3', topicMode ? 'hidden' : 'hidden md:flex')}>
          <Button
            type="button"
            variant="outline"
            onClick={navigateBack}
            disabled={position === 0}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              setVoteByCard((current) => {
                const next = { ...current };
                if (currentVote === 'up') delete next[currentCardIndex];
                else next[currentCardIndex] = 'up';
                return next;
              })
            }
            aria-label="Me gusta esta tarjeta"
            aria-pressed={currentVote === 'up'}
            className={cn(
              'size-11 rounded-lg',
              currentVote === 'up' && 'bg-primary/10 text-primary'
            )}
          >
            <ThumbsUp aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return isFullscreen
    ? createPortal(
        <div
          className={cn(
            'bg-muted fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-8',
            pdfStudyControlsClassName
          )}
        >
          {session}
        </div>,
        document.body
      )
    : session;
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bell,
  Check,
  Expand,
  RotateCcw,
  Shrink,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import {
  getFlashcardProgressAction,
  saveFlashcardProgressAction,
} from '@/app/dashboard/materiales/actions';
import { recordStudentMaterialStudyResultAction } from '@/lib/actions/study-errors';
import { scheduleFlashcardReviewReminderAction } from '@/lib/actions/flashcard-review-reminders';
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
}: {
  cards: StudyFlashcard[];
  materialId: string;
}) {
  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recallByCard, setRecallByCard] = useState<Record<number, RecallResult>>({});
  const [sessionRecall, setSessionRecall] = useState<Record<number, RecallResult>>({});
  const [voteByCard, setVoteByCard] = useState<Record<number, QualityVote>>({});
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [hasLoadedServer, setHasLoadedServer] = useState(false);
  const [showAllReviewTopics, setShowAllReviewTopics] = useState(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [reminderScheduled, setReminderScheduled] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const storageKey = `evaluo:flashcards:${materialId}`;

  const currentCardIndex = order[position] ?? 0;
  const currentCard = cards[currentCardIndex];
  const knownCount = Object.values(sessionRecall).filter((result) => result === 'known').length;
  const unknownCount = Object.values(sessionRecall).filter((result) => result === 'unknown').length;
  const reviewedCount = knownCount + unknownCount;
  const progress = order.length > 0 ? Math.round((reviewedCount / order.length) * 100) : 0;
  const currentRecall = sessionRecall[currentCardIndex];
  const currentVote = voteByCard[currentCardIndex];
  const allReviewed = started && order.length > 0 && reviewedCount >= order.length;
  const reviewTopics = useMemo(() => {
    const unknownIndexes = Object.entries(sessionRecall)
      .filter(([, result]) => result === 'unknown')
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

  const startSession = useCallback(() => {
    setOrder(buildSessionOrder(recallByCard, cards.length));
    setSessionRecall({});
    setPosition(0);
    setFlipped(false);
    setShowAllReviewTopics(false);
    setReminderScheduled(false);
    setReminderError(null);
    setStarted(true);
  }, [cards.length, recallByCard]);

  const restartFromScratch = useCallback(() => {
    setRecallByCard({});
    setSessionRecall({});
    setVoteByCard({});
    setOrder(buildSessionOrder({}, cards.length));
    setPosition(0);
    setFlipped(false);
    setIsFullscreen(false);
    setShowAllReviewTopics(false);
    setReminderScheduled(false);
    setReminderError(null);
    setStarted(true);
  }, [cards.length]);

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
  }, []);

  const reviewDifficult = useCallback(() => {
    const unknownIndexes = Object.entries(sessionRecall)
      .filter(([, result]) => result === 'unknown')
      .map(([index]) => Number(index))
      .filter((index) => index >= 0 && index < cards.length);

    if (unknownIndexes.length === 0) return;

    setOrder(shuffledIndexes(unknownIndexes.length).map((index) => unknownIndexes[index]!));
    setSessionRecall({});
    setPosition(0);
    setFlipped(false);
    setIsFullscreen(false);
    setShowAllReviewTopics(false);
    setReminderScheduled(false);
    setReminderError(null);
    setStarted(true);
  }, [cards.length, sessionRecall]);

  const scheduleTomorrowReminder = useCallback(() => {
    if (unknownCount <= 0 || isSchedulingReminder || reminderScheduled) return;

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
  }, [
    isSchedulingReminder,
    materialId,
    reminderScheduled,
    reviewTopics,
    unknownCount,
  ]);

  useEffect(() => {
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
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedProgress) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ recall: recallByCard, votes: voteByCard })
      );
    } catch {
      // Persistencia opcional: nunca debe bloquear una sesión.
    }
  }, [hasLoadedProgress, recallByCard, storageKey, voteByCard]);

  useEffect(() => {
    let active = true;
    void getFlashcardProgressAction(materialId)
      .then((result) => {
        if (!active || !result.success) return;
        // El servidor es la fuente de verdad: sus valores prevalecen sobre el caché local.
        setRecallByCard((current) => ({ ...current, ...result.progress.recall }));
        setVoteByCard((current) => ({ ...current, ...result.progress.votes }));
      })
      .finally(() => {
        if (active) setHasLoadedServer(true);
      });
    return () => {
      active = false;
    };
  }, [materialId]);

  useEffect(() => {
    if (!hasLoadedProgress || !hasLoadedServer) return;

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

    const timer = window.setTimeout(() => {
      void saveFlashcardProgressAction(materialId, entries);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [hasLoadedProgress, hasLoadedServer, materialId, recallByCard, voteByCard]);

  const navigateBack = useCallback(() => {
    setPosition((current) => Math.max(0, current - 1));
    setFlipped(false);
  }, []);


  const markRecall = useCallback(
    (result: RecallResult) => {
      if (!flipped || !currentCard) return;

      setRecallByCard((current) => ({ ...current, [currentCardIndex]: result }));
      setSessionRecall((current) => ({ ...current, [currentCardIndex]: result }));

      void recordStudentMaterialStudyResultAction({
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

      if (position < order.length - 1) {
        setPosition((current) => Math.min(order.length - 1, current + 1));
        setFlipped(false);
        return;
      }

      setFlipped(false);
      setIsFullscreen(false);
    },
    [currentCard, currentCardIndex, flipped, materialId, order.length, position]
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

  const referenceLabel = useMemo(() => {
    if (!currentCard) return '';
    if (currentCard.reference.pageStart) return `Página ${currentCard.reference.pageStart}`;
    return currentCard.reference.sectionTitle ?? 'Referencia del documento';
  }, [currentCard]);

  const displayFront = currentCard ? resolveFlashcardFront(currentCard) : '';
  const learningLevelLabel =
    currentCard?.level === 'recordar' ? 'Práctica de memoria' : 'Práctica de comprensión';

  if (cards.length === 0) {
    return (
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-8 text-center">
        <p className="font-semibold text-slate-900">No encontramos conceptos suficientes</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Regenerá el resumen y el glosario para intentar construir tarjetas útiles.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-[22px] border border-[#BFDBFE] bg-[linear-gradient(145deg,#FFFFFF_0%,#F3F7FF_100%)] px-5 py-9 text-center sm:px-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)]">
          <RotateCcw className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-[-0.04em] text-slate-950">
          Listo para aprender con flashcards
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Vas a practicar {cards.length} conceptos del PDF con recuperación activa. Intentá
          responder antes de voltear cada tarjeta.
        </p>
        <Button type="button" onClick={startSession} className="mt-5 rounded-2xl px-6">
          Generar flashcards
        </Button>
      </div>
    );
  }

  if (allReviewed) {
    return (
      <div className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(145deg,#FFFFFF_0%,#F0FDF4_100%)] px-5 py-9 text-center sm:px-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]">
          <Check className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-[-0.04em] text-slate-950">
          ¡Terminaste esta sesión!
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {knownCount} lo sabías · {unknownCount} no lo sabías
        </p>
        {unknownCount > 0 ? (
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Podés cerrar la sesión o volver a practicar únicamente las {unknownCount} que no sabías.
          </p>
        ) : (
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Completaste todas las tarjetas sin pendientes para repasar.
          </p>
        )}
        {unknownCount > 0 && reviewTopics.length > 0 ? (
          <div className="mx-auto mt-5 w-full max-w-xl border-t border-emerald-100 pt-5 text-left">
            <h4 className="text-sm font-semibold text-slate-950">Temas para repasar</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Estos son los temas que te costaron en esta sesión.
            </p>
            <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {visibleReviewTopics.map((topic) => (
                <li key={topic} className="py-2.5 text-sm font-semibold text-slate-700">
                  {topic}
                </li>
              ))}
            </ul>
            {hiddenReviewTopicsCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllReviewTopics((current) => !current)}
                className="mt-2 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
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
        {reminderError ? (
          <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-rose-600">{reminderError}</p>
        ) : null}
        {reminderScheduled ? (
          <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-emerald-700">
            Listo. Mañana te enviamos un recordatorio para retomar estos temas.
          </p>
        ) : null}
      </div>
    );
  }

  if (!currentCard) return null;

  const session = (
    <div
      className={cn(
        'space-y-4',
        isFullscreen && 'mx-auto flex h-full w-full max-w-5xl flex-col justify-center'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Tarjeta {position + 1} de {order.length}
          </p>
          <p className="mt-0.5 flex gap-4 text-sm font-semibold">
            <span className="text-emerald-700">
              <Check className="mr-1 inline h-4 w-4" />
              {knownCount} lo sabía
            </span>
            <span className="text-rose-700">{unknownCount} no lo sabía</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen((value) => !value)}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            className="rounded-xl"
          >
            {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
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
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`Progreso ${progress}%`}
      >
        <div
          className="h-full rounded-full bg-[#2563EB] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="group block min-h-[300px] w-full [perspective:1200px] sm:min-h-[360px]"
        aria-label={flipped ? 'Mostrar pregunta' : 'Mostrar respuesta'}
      >
        <div
          className={cn(
            'relative min-h-[300px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[360px]',
            flipped && '[transform:rotateY(180deg)]'
          )}
        >
          <div
            aria-hidden={flipped}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-[26px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_20px_55px_rgba(15,23,42,0.09)] [backface-visibility:hidden] sm:px-12"
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
              Pregunta
            </p>
            <h3 className="mt-5 max-w-3xl text-xl leading-8 font-bold tracking-[-0.03em] text-slate-950 sm:text-2xl">
              {displayFront}
            </h3>
            <p className="mt-6 text-xs text-slate-500">
              Tocá la tarjeta o presioná Espacio para ver la respuesta
            </p>
          </div>
          <div
            aria-hidden={!flipped}
            className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center rounded-[26px] border border-[#BFDBFE] bg-[#F8FBFF] px-6 py-10 text-center shadow-[0_20px_55px_rgba(37,99,235,0.1)] [backface-visibility:hidden] sm:px-12"
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-[#2563EB] uppercase">
              Respuesta
            </p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-800 sm:text-lg">
              {currentCard.back}
            </p>
            <p className="mt-5 text-xs text-slate-500">
              {learningLevelLabel} · Fuente: {referenceLabel}
            </p>
          </div>
        </div>
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={!flipped}
          onClick={() => markRecall('unknown')}
          className={cn(
            'h-12 rounded-2xl border-rose-200',
            currentRecall === 'unknown' && 'border-rose-400 bg-rose-50 text-rose-700'
          )}
        >
          <ArrowDown className="h-4 w-4" /> No lo sabía
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!flipped}
          onClick={() => markRecall('known')}
          className={cn(
            'h-12 rounded-2xl border-emerald-200',
            currentRecall === 'known' && 'border-emerald-400 bg-emerald-50 text-emerald-700'
          )}
        >
          <ArrowUp className="h-4 w-4" /> Lo sabía
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2" aria-label="¿Esta tarjeta fue útil?">
          <span className="text-xs text-slate-500">¿Buena tarjeta?</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setVoteByCard((current) => ({ ...current, [currentCardIndex]: 'up' }))}
            aria-label="Me gusta esta tarjeta"
            aria-pressed={currentVote === 'up'}
            className={cn(
              'h-8 w-8 rounded-lg',
              currentVote === 'up' && 'bg-emerald-100 text-emerald-700'
            )}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setVoteByCard((current) => ({ ...current, [currentCardIndex]: 'down' }))}
            aria-label="No me gusta esta tarjeta"
            aria-pressed={currentVote === 'down'}
            className={cn(
              'h-8 w-8 rounded-lg',
              currentVote === 'down' && 'bg-rose-100 text-rose-700'
            )}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-start gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={navigateBack}
          disabled={position === 0}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-center text-xs leading-6 text-slate-500">
        Presioná <Kbd>Espacio</Kbd> para voltear. Usá <Kbd>↑</Kbd> para “Lo sé” y <Kbd>↓</Kbd> para
        “No lo sé”.
      </div>
    </div>
  );

  return isFullscreen
    ? createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-50 p-4 sm:p-8">
          {session}
        </div>,
        document.body
      )
    : session;
}

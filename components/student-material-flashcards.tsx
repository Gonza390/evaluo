'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  const [voteByCard, setVoteByCard] = useState<Record<number, QualityVote>>({});
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const storageKey = `evaluo:flashcards:${materialId}`;

  const currentCardIndex = order[position] ?? 0;
  const currentCard = cards[currentCardIndex];
  const knownCount = Object.values(recallByCard).filter((result) => result === 'known').length;
  const unknownCount = Object.values(recallByCard).filter((result) => result === 'unknown').length;
  const reviewedCount = knownCount + unknownCount;
  const progress = cards.length > 0 ? Math.round((reviewedCount / cards.length) * 100) : 0;
  const currentRecall = recallByCard[currentCardIndex];
  const currentVote = voteByCard[currentCardIndex];
  const allReviewed = cards.length > 0 && reviewedCount >= cards.length;

  const startSession = useCallback(() => {
    setOrder(buildSessionOrder(recallByCard, cards.length));
    setPosition(0);
    setFlipped(false);
    setStarted(true);
  }, [cards.length, recallByCard]);

  const restartFromScratch = useCallback(() => {
    setRecallByCard({});
    setVoteByCard({});
    setOrder(buildSessionOrder({}, cards.length));
    setPosition(0);
    setFlipped(false);
    setStarted(true);
  }, [cards.length]);

  const reviewDifficult = useCallback(() => {
    const unknownIndexes = Object.entries(recallByCard)
      .filter(([, result]) => result === 'unknown')
      .map(([index]) => Number(index))
      .filter((index) => index >= 0 && index < cards.length);
    const remaining = shuffledIndexes(cards.length).filter(
      (index) => !unknownIndexes.includes(index)
    );
    const nextRecall = { ...recallByCard };
    unknownIndexes.forEach((index) => delete nextRecall[index]);
    setRecallByCard(nextRecall);
    setOrder([
      ...shuffledIndexes(unknownIndexes.length).map((index) => unknownIndexes[index]!),
      ...remaining,
    ]);
    setPosition(0);
    setFlipped(false);
    setStarted(true);
  }, [cards.length, recallByCard]);

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

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setPosition((current) => Math.min(Math.max(0, current + direction), order.length - 1));
      setFlipped(false);
    },
    [order.length]
  );

  const markRecall = useCallback(
    (result: RecallResult) => {
      if (!flipped) return;
      setRecallByCard((current) => ({ ...current, [currentCardIndex]: result }));
    },
    [currentCardIndex, flipped]
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
        navigate(-1);
      } else if (event.key === 'ArrowRight') {
        if (target?.closest('button')) return;
        event.preventDefault();
        navigate(1);
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
  }, [isFullscreen, markRecall, navigate, started]);

  const referenceLabel = useMemo(() => {
    if (!currentCard) return '';
    if (currentCard.reference.pageStart) return `Página ${currentCard.reference.pageStart}`;
    return currentCard.reference.sectionTitle ?? 'Referencia del documento';
  }, [currentCard]);

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
          ¡Repasaste todas las tarjetas!
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {knownCount} lo sabías · {unknownCount} no lo sabías
        </p>
        {unknownCount > 0 ? (
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Volvé a repasar las {unknownCount} que no sabías para afianzarlas.
          </p>
        ) : (
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Perfecto. Volvé cuando quieras para reforzar con recuperación activa.
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reviewDifficult} className="rounded-2xl px-6">
            Repasar las difíciles
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={restartFromScratch}
            className="rounded-2xl px-6"
          >
            <RotateCcw className="h-4 w-4" /> Empezar de nuevo
          </Button>
        </div>
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
            Tarjeta {position + 1} de {cards.length}
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
            size="sm"
            onClick={startSession}
            className="rounded-xl"
          >
            <RotateCcw className="h-4 w-4" /> Reordenar
          </Button>
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
              {currentCard.front}
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

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={position === 0}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(1)}
          disabled={position >= order.length - 1}
          className="rounded-xl"
        >
          Siguiente <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-center text-xs leading-6 text-slate-500">
        Presioná <Kbd>Espacio</Kbd> para voltear. Usá <Kbd>↑</Kbd> para “Lo sé”, <Kbd>↓</Kbd> para
        “No lo sé” y <Kbd>←</Kbd> <Kbd>→</Kbd> para navegar.
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

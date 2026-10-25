'use client';

import { useState, type MouseEvent } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';

type ReviewMode = 'flashcards' | 'glossary' | null;

export function SummaryChapterFinish({
  chapterIndex,
  chapterTitle,
  flashcards,
  concepts,
  canEvaluate,
  hasNextChapter,
  onEvaluate,
  onContinue,
}: {
  chapterIndex: number;
  chapterTitle: string;
  flashcards: StudyFlashcard[];
  concepts: StudyGlossaryItem[];
  canEvaluate: boolean;
  hasNextChapter: boolean;
  onEvaluate: () => void;
  onContinue: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const card = flashcards[flashcardIndex];

  const toggleReview = (mode: Exclude<ReviewMode, null>) => {
    setReviewMode((current) => current === mode ? null : mode);
    setFlashcardIndex(0);
    setAnswerVisible(false);
  };

  return (
    <aside
      data-summary-chapter-finish={chapterIndex}
      aria-label={`Qué hacer después de estudiar ${chapterTitle}`}
      className="border-primary/15 bg-card mt-7 rounded-2xl border px-4 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 aria-hidden className="h-4 w-4 text-emerald-600" />
        <span className="text-muted-foreground text-[10px] font-bold tracking-[0.13em] uppercase">
          Tema {chapterIndex + 1} · Fin de la lectura
        </span>
      </div>
      <h4 className="text-foreground mt-3 max-w-[26ch] text-xl font-bold leading-tight tracking-[-0.04em] sm:text-2xl">
        Descubrí qué sabés y qué necesitás reforzar
      </h4>
      <p className="text-muted-foreground mt-2 text-[13px]">{chapterTitle}</p>

      <Button
        data-summary-topic-evaluate={chapterIndex}
        onClick={onEvaluate}
        disabled={!canEvaluate}
        className="mt-5 h-11 w-full rounded-xl text-[14px] font-semibold"
      >
        Evaluar este tema <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
      </Button>
      {!canEvaluate ? (
        <p role="status" className="text-muted-foreground mt-2 text-center text-xs">
          Todavía no hay preguntas fiables para evaluar este tema.
        </p>
      ) : null}

      <div className="mt-4 text-center">
        <p className="text-muted-foreground text-[12px]">¿Querés repasar antes?</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            data-summary-topic-flashcards={chapterIndex}
            size="sm"
            variant="outline"
            aria-expanded={reviewMode === 'flashcards'}
            aria-controls={`topic-flashcards-${chapterIndex}`}
            disabled={flashcards.length === 0}
            onClick={() => toggleReview('flashcards')}
            className="h-9 rounded-lg px-3 text-xs font-medium"
          >
            <Layers3 aria-hidden className="mr-1.5 h-3.5 w-3.5" /> Flashcards
          </Button>
          <Button
            type="button"
            data-summary-topic-glossary={chapterIndex}
            size="sm"
            variant="outline"
            aria-expanded={reviewMode === 'glossary'}
            aria-controls={`topic-glossary-${chapterIndex}`}
            disabled={concepts.length === 0}
            onClick={() => toggleReview('glossary')}
            className="h-9 rounded-lg px-3 text-xs font-medium"
          >
            <BookOpen aria-hidden className="mr-1.5 h-3.5 w-3.5" /> Glosario
          </Button>
        </div>
      </div>

      {reviewMode === 'flashcards' && card ? (
        <div id={`topic-flashcards-${chapterIndex}`} className="border-border bg-muted/30 mt-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-[11px] font-semibold">Tarjeta {flashcardIndex + 1} de {flashcards.length}</p>
          <p className="text-foreground mt-3 text-sm font-medium leading-6">{card.front}</p>
          {answerVisible ? (
            <p className="text-muted-foreground mt-3 border-t pt-3 text-sm leading-6 whitespace-pre-line">{card.back}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAnswerVisible((visible) => !visible)}>
              {answerVisible ? 'Ocultar respuesta' : 'Mostrar respuesta'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={flashcardIndex === 0}
                onClick={() => { setFlashcardIndex((index) => index - 1); setAnswerVisible(false); }}>
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={flashcardIndex === flashcards.length - 1}
                onClick={() => { setFlashcardIndex((index) => index + 1); setAnswerVisible(false); }}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {reviewMode === 'glossary' && concepts.length > 0 ? (
        <div id={`topic-glossary-${chapterIndex}`} className="border-border bg-muted/30 mt-4 max-h-72 overflow-y-auto rounded-xl border px-4">
          <dl className="divide-border divide-y">
            {concepts.map((concept, index) => (
              <div key={`${concept.term}-${index}`} className="py-3">
                <dt className="text-foreground text-sm font-semibold">{concept.term}</dt>
                <dd className="text-muted-foreground mt-1 text-[13px] leading-5">{concept.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {hasNextChapter ? (
        <div className="mt-4 text-center">
          <button
            type="button"
            data-summary-topic-continue={chapterIndex}
            onClick={onContinue}
            className="text-muted-foreground hover:text-foreground min-h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Seguir leyendo
          </button>
        </div>
      ) : null}
    </aside>
  );
}

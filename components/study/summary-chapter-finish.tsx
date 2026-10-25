'use client';

import { useRef, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Layers3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';

type ReviewMode = 'flashcards' | 'glossary' | null;

/** Una sola invitación compacta al terminar la lectura del capítulo. */
export function SummaryChapterFinish({
  open,
  chapterIndex,
  chapterTitle,
  flashcards,
  concepts,
  canEvaluate,
  hasNextChapter,
  onEvaluate,
  onContinue,
  onClose,
}: {
  open: boolean;
  chapterIndex: number;
  chapterTitle: string;
  flashcards: StudyFlashcard[];
  concepts: StudyGlossaryItem[];
  canEvaluate: boolean;
  hasNextChapter: boolean;
  onEvaluate: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const card = flashcards[cardIndex];

  const toggleReview = (mode: Exclude<ReviewMode, null>) => {
    setReviewMode((current) => current === mode ? null : mode);
    setCardIndex(0);
    setAnswerVisible(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        data-summary-chapter-finish={chapterIndex}
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => { event.preventDefault(); headingRef.current?.focus(); }}
        overlayClassName="z-[135] bg-slate-950/45 backdrop-blur-[2px]"
        className="border-border bg-card text-card-foreground z-[135] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[500px] flex-col gap-0 overflow-hidden rounded-[22px] border p-0 shadow-[0_22px_75px_rgba(15,27,61,0.18)] sm:max-w-[500px]"
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 aria-hidden className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground text-[10px] font-bold tracking-[0.13em] uppercase">
                Tema {chapterIndex + 1} · Lectura finalizada
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar y volver al resumen"
              className="text-muted-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          <DialogTitle ref={headingRef} tabIndex={-1} className="text-foreground mt-3 text-left text-[20px] font-bold leading-tight tracking-[-0.04em] outline-none">
            Descubrí qué sabés y qué necesitás reforzar
          </DialogTitle>
          <p className="text-muted-foreground mt-2 break-words text-[13px]">{chapterTitle}</p>

          <Button
            type="button"
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
              <p className="text-muted-foreground text-[11px] font-semibold">Tarjeta {cardIndex + 1} de {flashcards.length}</p>
              <p className="text-foreground mt-3 text-sm font-medium leading-6">{card.front}</p>
              {answerVisible ? (
                <p className="text-muted-foreground mt-3 border-t pt-3 text-sm leading-6 whitespace-pre-line">{card.back}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAnswerVisible((visible) => !visible)}>
                  {answerVisible ? 'Ocultar respuesta' : 'Mostrar respuesta'}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={cardIndex === 0}
                    onClick={() => { setCardIndex((index) => index - 1); setAnswerVisible(false); }}>
                    Anterior
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={cardIndex === flashcards.length - 1}
                    onClick={() => { setCardIndex((index) => index + 1); setAnswerVisible(false); }}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';

export function TopicStudySupport({
  concepts,
  flashcards,
  pdfHref,
}: {
  concepts: StudyGlossaryItem[];
  flashcards: StudyFlashcard[];
  pdfHref?: string;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const card = flashcards[cardIndex];
  return (
    <div className="divide-border border-border mt-6 divide-y border-t">
      <section className="py-3" aria-label="Conceptos importantes de este tema">
        <h3 className="text-[16px] font-semibold">2 · Conceptos importantes</h3>
        <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
          Revisá estas definiciones del glosario antes de continuar.
        </p>
        {concepts.length ? (
          <dl className="divide-border mt-3 divide-y">
            {concepts.map((concept, index) => (
              <div key={`${concept.term}-${index}`} className="py-3">
                <dt className="text-foreground text-[14px] font-semibold">{concept.term}</dt>
                <dd className="text-foreground mt-1.5 max-w-prose text-[13.5px] leading-6 whitespace-pre-line">
                  {concept.definition}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground py-3 text-sm">
            Todavía no hay conceptos del glosario con una asociación clara a este tema.
          </p>
        )}
      </section>
      <details className="py-3">
        <summary className="focus-visible:outline-ring min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2">
          Repasar con flashcards {flashcards.length > 0 && `(${flashcards.length})`}
        </summary>
        {card ? (
          <div key={cardIndex} className="pb-4">
            <p className="text-muted-foreground mb-3 text-xs">
              Tarjeta {cardIndex + 1} de {flashcards.length} · Intentá responder antes de mirar.
            </p>
            <p className="text-foreground text-[16px] leading-6 font-medium">{card.front}</p>
            <details className="mt-4">
              <summary className="text-primary min-h-11 cursor-pointer py-3 text-sm font-semibold">
                Mostrar respuesta
              </summary>
              <p className="text-foreground py-2 text-[13.5px] leading-6 whitespace-pre-line">
                {card.back}
              </p>
              {Number.isInteger(card.reference.pageStart) &&
                Number(card.reference.pageStart) > 0 &&
                card.reference.excerpt.trim() && (
                  <div className="text-muted-foreground mt-3 text-xs leading-5">
                    <p>
                      Fuente de esta tarjeta · pág. {card.reference.pageStart}
                      {card.reference.pageEnd && card.reference.pageEnd !== card.reference.pageStart
                        ? `–${card.reference.pageEnd}`
                        : ''}
                    </p>
                    {pdfHref && (
                      <a
                        href={`${pdfHref.split('#')[0]}#page=${card.reference.pageStart}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex min-h-11 items-center underline underline-offset-4"
                      >
                        Ver en PDF
                      </a>
                    )}
                  </div>
                )}
            </details>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={cardIndex === 0}
                onClick={() => setCardIndex((index) => index - 1)}
                className="border-border focus-visible:outline-ring min-h-11 rounded-lg border px-4 text-[13px] disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={cardIndex === flashcards.length - 1}
                onClick={() => setCardIndex((index) => index + 1)}
                className="border-border focus-visible:outline-ring min-h-11 rounded-lg border px-4 text-[13px] disabled:opacity-40"
              >
                Siguiente tarjeta
              </button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Consultar tarjetas no cambia tu evaluación del tema.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-3 text-sm">
            Todavía no hay tarjetas con una asociación clara a este tema. Podés estudiar su resumen
            y consultar las flashcards generales.
          </p>
        )}
      </details>
    </div>
  );
}

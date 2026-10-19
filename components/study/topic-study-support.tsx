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
      <details className="py-3">
        <summary className="focus-visible:outline-ring min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2">
          Conceptos importantes {concepts.length > 0 && `(${concepts.length})`}
        </summary>
        {concepts.length ? (
          <div className="divide-border divide-y">
            {concepts.map((concept, index) => (
              <details key={`${concept.term}-${index}`} className="py-2">
                <summary className="text-primary min-h-11 cursor-pointer py-3 text-sm">
                  {concept.term}
                </summary>
                <p className="text-foreground pb-3 text-sm leading-6 whitespace-pre-line">
                  {concept.definition}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-3 text-sm">
            Todavía no hay conceptos del glosario con una asociación clara a este tema.
          </p>
        )}
      </details>
      <details className="py-3">
        <summary className="focus-visible:outline-ring min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2">
          Repasar con flashcards {flashcards.length > 0 && `(${flashcards.length})`}
        </summary>
        {card ? (
          <div key={cardIndex} className="pb-4">
            <p className="text-muted-foreground mb-3 text-xs">
              Tarjeta {cardIndex + 1} de {flashcards.length} · Intentá responder antes de mirar.
            </p>
            <p className="text-foreground text-base leading-7 font-medium">{card.front}</p>
            <details className="mt-4">
              <summary className="text-primary min-h-11 cursor-pointer py-3 text-sm font-semibold">
                Mostrar respuesta
              </summary>
              <p className="text-foreground py-3 text-sm leading-6 whitespace-pre-line">
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
                className="border-border focus-visible:outline-ring min-h-11 rounded-lg border px-4 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={cardIndex === flashcards.length - 1}
                onClick={() => setCardIndex((index) => index + 1)}
                className="border-border focus-visible:outline-ring min-h-11 rounded-lg border px-4 text-sm disabled:opacity-40"
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

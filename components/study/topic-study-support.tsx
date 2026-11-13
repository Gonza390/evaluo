'use client';

import { useMemo, useState } from 'react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';
import { buildTopicFlashcards } from '@/lib/student-materials/topic-flashcards';

const optionClass =
  'border-border focus-visible:outline-ring min-h-11 rounded-full border px-5 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2';
const primaryClass =
  'bg-primary text-primary-foreground focus-visible:outline-ring min-h-11 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2';

export function TopicConcepts({ concepts }: { concepts: StudyGlossaryItem[] }) {
  const english = useOptionalAppLocale() === 'en';
  return (
    <section aria-label={english ? 'Key concepts for this topic' : 'Conceptos importantes de este tema'}>
      <h3 className="text-[15px] font-semibold">
        {english ? 'Review the concepts of this topic' : 'Repasá los conceptos de este tema'}
      </h3>
      <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
        {english
          ? 'These are the glossary definitions that belong to this topic.'
          : 'Son las definiciones de tu glosario que pertenecen a este tema.'}
      </p>
      {concepts.length ? (
        <dl className="divide-border mt-3 divide-y">
          {concepts.map((concept, index) => (
            <div key={`${concept.term}-${index}`} className="py-3">
              <dt className="text-foreground text-[15px] font-semibold">
                {english && concept.englishTerm ? concept.englishTerm : concept.term}
              </dt>
              <dd className="text-foreground mt-1.5 max-w-prose text-[14px] leading-6 whitespace-pre-line">
                {concept.definition}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground py-3 text-sm">
          {english
            ? 'No glossary concepts are clearly linked to this topic yet.'
            : 'Todavía no hay conceptos del glosario con una asociación clara a este tema.'}
        </p>
      )}
    </section>
  );
}

export function TopicFlashcards({
  concepts,
  flashcards,
  pdfHref,
  onFinished,
}: {
  concepts: StudyGlossaryItem[];
  flashcards: StudyFlashcard[];
  pdfHref?: string;
  /** Se llama una vez al terminar el mazo; el paso se marca como hecho solo entonces. */
  onFinished?: () => void;
}) {
  const english = useOptionalAppLocale() === 'en';
  const cards = useMemo(
    () => buildTopicFlashcards(concepts, flashcards, english),
    [concepts, flashcards, english]
  );
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [finished, setFinished] = useState(false);
  const card = cards[index];

  function advance() {
    setShown(false);
    if (index < cards.length - 1) {
      setIndex(index + 1);
      return;
    }
    setFinished(true);
    onFinished?.();
  }

  const title = english ? 'Review with flashcards' : 'Repasá con flashcards';
  if (!card) {
    return (
      <section aria-label={title}>
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="text-muted-foreground py-3 text-sm">
          {english
            ? 'No flashcards are clearly linked to this topic yet. You can review its summary or use the general flashcards.'
            : 'Todavía no hay tarjetas con una asociación clara a este tema. Podés estudiar su resumen y consultar las flashcards generales.'}
        </p>
      </section>
    );
  }
  if (finished) {
    return (
      <section aria-label={title}>
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <div className="bg-muted/40 mt-3 rounded-2xl p-5">
          <p className="text-[18px] font-semibold">
            {english ? `You reviewed the ${cards.length} cards` : `Repasaste las ${cards.length} tarjetas del tema`}
          </p>
          <p className="text-muted-foreground mt-2 max-w-prose text-[14px] leading-6">
            {english
              ? 'Now test yourself with questions from your PDF to see how much you know.'
              : 'Ahora podés ponerte a prueba con preguntas de tu PDF para ver cuánto dominás este tema.'}
          </p>
          <button
            type="button"
            className={optionClass + ' mt-4'}
            onClick={() => {
              setIndex(0);
              setShown(false);
              setFinished(false);
            }}
          >
            {english ? 'Review again' : 'Repasar de nuevo'}
          </button>
        </div>
      </section>
    );
  }
  const page = card.reference?.pageStart;
  const hasPage = Number.isInteger(page) && Number(page) > 0 && Boolean(card.reference?.excerpt.trim());
  return (
    <section aria-label={title}>
      <h3 className="sr-only">{title}</h3>
      <p className="text-muted-foreground text-xs">
        {english ? `Card ${index + 1} of ${cards.length}` : `Tarjeta ${index + 1} de ${cards.length}`}
      </p>
      <div className="bg-muted/40 mt-3 flex min-h-[320px] flex-col rounded-3xl p-6 sm:p-8 xl:min-h-[min(420px,calc(100dvh-26rem))]" aria-live="polite">
        <div className="my-auto">
          <p className="text-foreground max-w-prose text-[20px] leading-8 font-semibold tracking-[-0.02em]">{card.front}</p>
          {shown && (
            <div className="border-border mt-6 max-w-prose border-t pt-5">
              <p className="text-foreground text-[16px] leading-7 whitespace-pre-line">{card.back}</p>
              <p className="text-muted-foreground mt-3 text-xs leading-5">
                {card.origin === 'glossary'
                  ? english ? 'From your glossary' : 'De tu glosario'
                  : hasPage
                    ? `${english ? 'Card source · p.' : 'Fuente de esta tarjeta · pág.'} ${page}${
                        card.reference?.pageEnd && card.reference.pageEnd !== page ? `–${card.reference.pageEnd}` : ''
                      }`
                    : null}
                {hasPage && pdfHref && (
                  <a
                    href={`${pdfHref.split('#')[0]}#page=${page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary ml-2 inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    {english ? 'View in PDF' : 'Ver en PDF'}
                  </a>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {shown ? (
            <>
              <button type="button" className={optionClass} onClick={advance}>
                {english ? 'Not yet' : 'Todavía no la sé'}
              </button>
              <button type="button" className={primaryClass} onClick={advance}>
                {english ? 'I know it' : 'La sé'}
              </button>
            </>
          ) : (
            <button type="button" className={primaryClass} onClick={() => setShown(true)}>
              {english ? 'Show answer' : 'Mostrar respuesta'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

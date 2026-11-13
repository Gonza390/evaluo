'use client';

import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';

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

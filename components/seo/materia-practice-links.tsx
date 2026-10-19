import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { buildSeoEntitySlug } from '@/lib/seo-intents';

type MateriaPracticeLinksProps = {
  materiaId: string;
  materiaNombre: string;
  questionCounts: Record<1 | 2 | 3, number>;
};

export function MateriaPracticeLinks({
  materiaId,
  materiaNombre,
  questionCounts,
}: MateriaPracticeLinksProps) {
  const materiaSlug = buildSeoEntitySlug(materiaNombre, materiaId);
  const hasPartial1 = questionCounts[1] > 0;
  const hasPartial2 = questionCounts[2] > 0;

  if (!hasPartial1 && !hasPartial2) return null;

  return (
    <section className="border-t border-border bg-background" aria-labelledby="materia-practice-seo-title">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id="materia-practice-seo-title" className="text-lg font-bold text-foreground">
                Preguntero y parciales de {materiaNombre}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Entrá al banco de preguntas o practicá directamente el parcial que estás preparando.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/pregunteros/${materiaSlug}`}
              className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              Ver preguntero completo
            </Link>
            {hasPartial1 ? (
              <Link
                href={`/pregunteros/${materiaSlug}/parcial/1`}
                className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Preguntero Parcial 1
              </Link>
            ) : null}
            {hasPartial2 ? (
              <Link
                href={`/pregunteros/${materiaSlug}/parcial/2`}
                className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Preguntero Parcial 2
              </Link>
            ) : null}
            {hasPartial1 && hasPartial2 ? (
              <Link
                href={`/pregunteros/${materiaSlug}/parcial/integrador`}
                className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Preguntero Integrador
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FreePracticeLimitScreen, type FreePracticeLimitKind } from '@/components/dashboard/free-practice-limit-screen';

export const metadata: Metadata = {
  title: 'Demo · Límite de práctica Free',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

const MODES: Record<string, FreePracticeLimitKind> = {
  opciones: 'multiple_choice',
  verdadero_falso: 'true_false',
  unir: 'matching_round',
  casos: 'case',
  flashcards: 'flashcard',
  simulacro: 'simulator',
};

// Visual-only demo. Never render it outside next dev or touch a student quota.
export default async function LocalFreeLimitDemo({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const type = (await searchParams)?.tipo ?? 'opciones';
  return <FreePracticeLimitScreen
    kind={MODES[type] ?? 'multiple_choice'}
    materialTitle="Apuntes de Economía"
    topicLabel="Unidad 3"
    premiumHref="/dashboard/premium?source=free_v2_multiple_choice_limit"
    backHref="/dashboard/practicar"
    backLabel="Volver a Practicar"
  />;
}

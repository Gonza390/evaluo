import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import {
  hasPremiumAccess,
  countErroresAttemptsThisWeek,
  FREE_ERRORS_REVIEWS_PER_WEEK,
} from '@/lib/premium';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import { ErrorsReviewLimit } from '@/components/premium/errors-review-limit';
import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

async function SimuladorErroresContent({
  params,
  searchParams,
}: {
  params: Promise<{ materia_id: string }>;
  searchParams?: Promise<{ parcial?: string }>;
}) {
  const { materia_id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const parcial = Number(resolvedSearchParams.parcial) || 1;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/simulador/errores/${materia_id}`)}`);
  }

  if (!materia_id) {
    redirect('/dashboard');
  }

  const isPremium = await hasPremiumAccess(user.id);
  if (!isPremium) {
    const weeklyReviews = await countErroresAttemptsThisWeek(user.id);
    if (weeklyReviews >= FREE_ERRORS_REVIEWS_PER_WEEK) {
      await trackServerAnalyticsEvent({
        eventName: 'limit_reached_errores_review',
        userId: user.id,
        path: `/simulador/errores/${materia_id}`,
        metadata: {
          materia_id,
          parcial,
          weekly_reviews: weeklyReviews,
          limit: FREE_ERRORS_REVIEWS_PER_WEEK,
        },
      });
      return <ErrorsReviewLimit materiaId={materia_id} />;
    }
  }

  return <SimuladorExamen materiaId={materia_id} parcial={parcial} mode="errores" />;
}

export default async function SimuladorErroresPage({
  params,
  searchParams,
}: {
  params: Promise<{ materia_id: string }>;
  searchParams?: Promise<{ parcial?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Preparando tu repaso de errores...</p>
          </div>
        </div>
      }
    >
      <SimuladorErroresContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

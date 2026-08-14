import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { hasPremiumAccess, countErroresAttemptsThisWeek, FREE_ERRORS_REVIEWS_PER_WEEK } from '@/lib/premium';

const SimuladorExamen = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-indigo-50 p-6">
      <div className="w-full max-w-5xl rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <div className="h-8 w-56 animate-pulse rounded-full bg-indigo-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  ),
});

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
    redirect('/login');
  }

  if (!materia_id) {
    redirect('/dashboard');
  }

  const isPremium = await hasPremiumAccess(user.id);
  if (!isPremium) {
    const weeklyReviews = await countErroresAttemptsThisWeek(user.id);
    if (weeklyReviews >= FREE_ERRORS_REVIEWS_PER_WEEK) {
      redirect('/pricing');
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
        <div className="flex min-h-screen items-center justify-center bg-indigo-50">
          <div className="animate-pulse text-indigo-600 font-bold text-xl">Cargando repaso de errores...</div>
        </div>
      }
    >
      <SimuladorErroresContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

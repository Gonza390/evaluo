import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { isQaAccount, QA_ACCOUNT_EMAIL } from '@/lib/qa-account';
import { restartQaFirstPdfOnboardingAction } from './actions';

export const metadata: Metadata = {
  title: 'Pruebas de onboarding | Evaluo',
  robots: { index: false, follow: false },
};

export default async function QaOnboardingPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fqa');
  if (!isQaAccount(user)) notFound();

  const { count, error } = await supabase
    .from('student_materials')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            QA · Sólo cuenta de pruebas
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Probar onboarding de Evaluo</h1>
          <p className="text-sm leading-6 text-slate-600">
            Cuenta: {QA_ACCOUNT_EMAIL}. Probá la primera subida de PDF, procesamiento,
            guía de estudio y entrada a la práctica sin afectar tu cuenta administradora.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Materiales existentes: {error ? 'No disponible' : (count ?? 0)}.
          {(count ?? 0) > 0 ? (
            <p className="mt-2 text-slate-600">
              Ya tenés PDFs de prueba. Podés repetir la guía, pero para simular una
              cuenta totalmente vacía tendrás que retirar esos materiales por separado.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Empezar otra prueba</h2>
          <p className="text-sm leading-6 text-slate-600">
            Esta acción limpia la marca de finalización del recorrido y el perfil
            académico para que vuelvas a seleccionar universidad y carrera. No elimina
            PDFs, respuestas, progreso ni historial y no altera tu rol.
          </p>
          <form action={restartQaFirstPdfOnboardingAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Reiniciar recorrido de prueba
            </button>
          </form>
        </div>

        <div className="border-t border-slate-100 pt-4 text-sm text-slate-600">
          <Link href="/dashboard" className="font-semibold text-indigo-700 hover:underline">
            Volver a Mi espacio
          </Link>
        </div>
      </section>
    </main>
  );
}

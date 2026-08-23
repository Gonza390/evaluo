import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { UniversityRequestForm } from './request-form';

export default async function SolicitarUniversidadPage() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?mode=signup&next=%2Fsolicitar-universidad');
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_55%,#F8FAFC_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/explorar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#EEF4FF_0%,#FFFFFF_100%)] px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">
              ¿No encontrás tu universidad?
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Contanos dónde estudiás y qué carrera cursás. Usamos estas solicitudes para decidir
              qué universidades y carreras sumar después al catálogo.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            <UniversityRequestForm />
          </div>
        </section>
      </div>
    </main>
  );
}

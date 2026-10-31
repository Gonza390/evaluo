import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, FileText, ListChecks } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';

export const metadata: Metadata = {
  title: 'Practicar | Evaluo',
  robots: { index: false, follow: false },
};

export default async function PracticeHomePage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/practicar');

  const materials = (await fetchStudentMaterialsByUser(supabase, user.id))
    .filter(material => material.processing_status === 'ready');

  return (
    <main className="mx-auto w-full max-w-[960px] px-3 py-5 pb-24 text-slate-900 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight">Practicar</h1>
        <p className="mt-1 text-[13px] text-slate-500">Elegí un material para practicar con sus preguntas.</p>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {materials.length ? materials.map(material => (
          <Link key={material.id}
            href={`/materiales/${material.id}?tab=ejercicios`}
            className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-blue-50/50 last:border-b-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold break-words">{material.title}</span>
            <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        )) : (
          <div className="flex flex-col items-start gap-3 p-5">
            <ListChecks className="size-6 text-blue-600" aria-hidden="true" />
            <p className="text-sm text-slate-600">Todavía no tenés materiales listos para practicar.</p>
            <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">
              Ir a Mi espacio
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

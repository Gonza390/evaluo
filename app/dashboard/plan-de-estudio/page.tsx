import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, FileText, GraduationCap, ListChecks, Sparkles } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';

export const metadata: Metadata = { title: 'Plan de estudio | Evaluo', robots: { index: false, follow: false } };

export default async function StudyPlanPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio');

  const materials = (await fetchStudentMaterialsByUser(supabase, user.id)).filter(
    material => material.processing_status === 'ready'
  );
  const first = materials[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-slate-900 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="md:hidden rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold">Plan de estudio</h1>
        <p className="mt-2 text-sm text-slate-600">Estamos preparando esta sección para teléfonos. Por ahora podés usarla desde una computadora.</p>
        <Link href="/dashboard/explicaciones" className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-blue-600">Ir a Estudiar <ArrowRight className="size-4" /></Link>
      </div>
      <div className="hidden md:block">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.035em] lg:text-[24px]">Plan de estudio</h1>
            <p className="mt-1 text-[12px] text-slate-500">Una vista clara de tus materiales y tu próximo paso para aprender.</p>
          </div>
          <Link href="/calendario" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
            <CalendarDays className="size-4" /> Ver calendario
          </Link>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.03)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Tu avance</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Vista inicial</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex size-[66px] shrink-0 items-center justify-center rounded-full border-[6px] border-slate-100">
                  <span className="text-[15px] font-bold tracking-tight">—</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold">{first ? 'Tu próximo paso empieza acá' : 'Empezá con tu primer PDF'}</h3>
                  <p className="mt-1 max-w-md text-[12px] leading-5 text-slate-500">
                    {first ? 'Cuando creemos tu plan, acá vas a ver las sesiones completadas y las que te faltan.' : 'Subí un material para que Evaluo pueda ayudarte a organizar tus sesiones de estudio.'}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold tracking-tight">Lo que sigue</h2>
                <span className="text-xs text-slate-400">Basado en tus PDFs</span>
              </div>
              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
                {first ? (
                  <>
                    <Link href={`/materiales/${first.id}?tab=resumen`} className="group flex items-center gap-3 bg-blue-50/70 px-3 py-3 transition hover:bg-blue-50">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><BookOpen className="size-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold">Continuar leyendo</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-600">{first.title}</span>
                      </span>
                      <ArrowRight className="size-4 text-blue-700 transition group-hover:translate-x-1" />
                    </Link>
                    <Link href={`/materiales/${first.id}?tab=ejercicios`} className="flex items-center gap-3 border-t border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ListChecks className="size-5" /></span>
                      <span className="flex-1"><span className="block text-[12px] font-semibold">Practicar lo aprendido</span><span className="block text-xs text-slate-500">Preguntas de tu material</span></span>
                      <ArrowRight className="size-4 text-slate-400" />
                    </Link>
                    <Link href={`/materiales/${first.id}?tab=progreso`} className="flex items-center gap-3 border-t border-slate-100 px-3 py-3 transition hover:bg-slate-50">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><CheckCircle2 className="size-5" /></span>
                      <span className="flex-1"><span className="block text-[12px] font-semibold">Revisar tu progreso</span><span className="block text-xs text-slate-500">Detectá qué conviene reforzar</span></span>
                      <ArrowRight className="size-4 text-slate-400" />
                    </Link>
                  </>
                ) : (
                  <div className="p-7 text-center"><FileText className="mx-auto size-8 text-blue-500" /><p className="mt-3 text-[12px] font-semibold">Todavía no hay archivos listos</p><Link href="/dashboard?openUpload=1" className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-[12px] font-semibold text-white">Subir un PDF</Link></div>
                )}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-4">
            <section className="relative overflow-hidden rounded-[18px] bg-[#eaf1ff] p-6 text-[#143c85]">
              <div className="absolute -right-6 -top-6 size-36 rounded-full bg-blue-200/50 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700"><GraduationCap className="size-4" /> PRÓXIMO EXAMEN</div>
                <h2 className="mt-3 max-w-[300px] text-[21px] font-bold leading-[1.15] tracking-[-0.04em]">¿Cuándo rendís?</h2>
                <p className="mt-3 max-w-[330px] text-[12px] leading-5 text-[#5473a2]">Registrá la fecha en tu calendario. Después podremos distribuir los temas y repasos hasta el examen.</p>
                <Link href="/calendario" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-blue-700">Agregar fecha <ArrowRight className="size-4" /></Link>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-bold tracking-tight">Tus materiales</h2><span className="text-xs text-slate-400">{materials.length} PDFs</span></div>
              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
                {materials.length ? materials.slice(0, 6).map(material => (
                  <Link key={material.id} href={`/materiales/${material.id}?tab=resumen`} className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-0 hover:bg-slate-50">
                    <FileText className="size-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{material.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-slate-400" />
                  </Link>
                )) : <p className="p-5 text-sm text-slate-500">Tus PDFs aparecerán aquí cuando estén listos.</p>}
              </div>
            </section>
            <div className="rounded-[16px] border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2"><Clock3 className="size-4 text-blue-600" /><span className="text-[12px] font-semibold">Próximamente: planificación por días</span></div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Esta primera versión permite revisar el diseño. La generación y el seguimiento automático de sesiones todavía no están activados.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

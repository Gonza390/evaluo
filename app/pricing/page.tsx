import { Clock3, Sparkles } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(79,93,255,0.12),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f6f8fc_100%)] px-4 py-10 sm:px-6 sm:py-14">
      <MarketingPageViewTracker eventName="pricing_view" payload={{ location: 'pricing_page' }} />

      <div className="mx-auto max-w-4xl">
        <section className="surface-panel overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Premium en preparación
            </div>
            <h1 className="mt-5 text-[2.15rem] font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Estamos trabajando para ofrecer una experiencia premium realmente fuerte.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Preferimos abrir estas funciones cuando estén a la altura de la plataforma. Muy pronto vas
              a tener simuladores premium, explicaciones avanzadas y seguimiento más fino.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <section className="surface-card rounded-[var(--radius-card)] bg-white/94 p-5 shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">Simuladores premium</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sets más curados, más largos y mejor adaptados al examen real.
              </p>
            </section>
            <section className="surface-card rounded-[var(--radius-card)] bg-white/94 p-5 shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">Explicaciones avanzadas</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Más contexto, más corrección y mejores recomendaciones para subir tu nota.
              </p>
            </section>
            <section className="surface-card rounded-[var(--radius-card)] bg-white/94 p-5 shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">Seguimiento inteligente</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Un progreso mucho más claro para saber qué reforzar antes de rendir.
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <TrackedLink
              href="/dashboard"
              eventName="pricing_cta_click"
              payload={{
                location: 'pricing_page',
                cta_name: 'volver_dashboard',
                destination: '/dashboard',
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Volver al dashboard
            </TrackedLink>
            <TrackedLink
              href="/explorar"
              eventName="pricing_cta_click"
              payload={{
                location: 'pricing_page',
                cta_name: 'seguir_explorando',
                destination: '/explorar',
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Seguir explorando
            </TrackedLink>
          </div>
        </section>
      </div>
    </main>
  );
}

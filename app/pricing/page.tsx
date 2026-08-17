import type { Metadata } from 'next';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PricingWaitlistCard } from '@/components/pricing/PricingWaitlistCard';

export const metadata: Metadata = {
  title: 'Premium en preparación',
  description:
    'Reserva tu acceso prioritario al plan premium de Evaluo y entra antes a la beta.',
  alternates: {
    canonical: '/pricing',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const premiumBenefits = [
  {
    title: 'Simuladores más curados',
    description:
      'Modelos más largos y mejor ajustados a la dificultad que esperas el día del parcial.',
    icon: Target,
  },
  {
    title: 'Explicaciones con más contexto',
    description:
      'Entiende rápido por qué te equivocaste y qué conviene repasar primero para subir tu nota.',
    icon: Brain,
  },
  {
    title: 'Una experiencia de estudio más clara',
    description:
      'Menos improvisación, más foco y una mejor hoja de ruta para llegar mejor preparado.',
    icon: BookOpen,
  },
];

const premiumHighlights = [
  'Acceso anticipado a la beta premium',
  'Prioridad para nuevas funciones y feedback',
  'Más visibilidad sobre errores, progreso y repaso',
];

const comparisonFeatures = [
  {
    feature: 'Resúmenes por materia',
    free: true,
    premium: true,
    freeNote: '',
    premiumNote: '',
  },
  {
    feature: 'Pregunteros con práctica',
    free: true,
    premium: true,
    freeNote: '',
    premiumNote: '',
  },
  {
    feature: 'Simuladores de examen',
    free: true,
    premium: true,
    freeNote: 'Formato básico',
    premiumNote: 'Modelos más curados y ajustados',
  },
  {
    feature: 'Revisión de errores con IA',
    free: true,
    premium: true,
    freeNote: '1 por semana',
    premiumNote: 'Sin límite',
  },
  {
    feature: 'Explicaciones paso a paso con IA',
    free: false,
    premium: true,
    freeNote: '',
    premiumNote: 'En cada respuesta incorrecta',
  },
  {
    feature: 'Simulador de errores personalizado',
    free: false,
    premium: true,
    freeNote: '',
    premiumNote: 'Enfocado en tus puntos débiles',
  },
  {
    feature: 'Radar de progreso avanzado',
    free: false,
    premium: true,
    freeNote: '',
    premiumNote: 'Tema por tema con historial',
  },
  {
    feature: 'Prioridad en nuevas funciones',
    free: false,
    premium: true,
    freeNote: '',
    premiumNote: '',
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900">
      <MarketingPageViewTracker
        eventName="pricing_view"
        payload={{ location: 'pricing_page', plan_context: 'premium_waitlist' }}
      />

      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
        <div className="mx-auto max-w-[1240px] px-4 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10 lg:px-10 lg:pb-24 lg:pt-12">
          <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
            <div className="animate-surface-reveal max-w-[640px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold ring-1 ring-[#C7D2FE] backdrop-blur">
                <Sparkles className="h-4 w-4 text-brand-2" />
                <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
                  Acceso premium en beta
                </span>
              </div>

              <h1 className="mt-6 text-[2.65rem] font-bold leading-[0.97] tracking-[-0.06em] text-heading sm:mt-8 sm:text-[3.75rem] lg:text-[4.5rem]">
                Entrá primero a la versión premium de Evaluo.
              </h1>

              <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-500 sm:mt-7 sm:text-xl sm:leading-8">
                Estamos preparando una experiencia más profunda para practicar mejor, corregir más
                rápido y llegar al parcial con una ruta mucho más clara.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">
                <TrackedLink
                  href="/login?mode=signup&intent=premium"
                  eventName="pricing_cta_click"
                  payload={{
                    location: 'pricing_hero',
                    cta_name: 'crear_cuenta_para_beta',
                    destination: '/login?mode=signup&intent=premium',
                    plan_context: 'premium_waitlist',
                  }}
                   className="inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-brand to-brand-2 px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:translate-y-[-1px] sm:h-14 sm:px-8 sm:text-base"
                >
                  Reservar acceso premium
                  <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
                <TrackedLink
                  href="/explorar"
                  eventName="pricing_cta_click"
                  payload={{
                    location: 'pricing_hero',
                    cta_name: 'seguir_explorando',
                    destination: '/explorar',
                    plan_context: 'premium_waitlist',
                  }}
                   className="inline-flex h-13 items-center justify-center rounded-2xl border border-brand/25 bg-white px-6 text-[15px] font-semibold text-brand shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:border-brand/45 sm:h-14 sm:px-8 sm:text-base"
                >
                  Ver materiales gratis
                </TrackedLink>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-slate-500 min-[440px]:grid-cols-3 sm:mt-10">
                {premiumHighlights.map((item) => (
                  <div key={item} className="surface-card rounded-2xl bg-white/85 px-4 py-4">
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-surface-reveal grid gap-4" style={{ animationDelay: '120ms' }}>
              <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {premiumBenefits.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className="rounded-[26px] border border-slate-100 bg-slate-50/85 px-4 py-5"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h2 className="mt-4 text-[17px] font-semibold leading-6 text-heading">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-[14px] leading-7 text-slate-500">
                          {item.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-[#D9DBFF] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(238,240,255,0.92)_100%)] p-6 shadow-[0_18px_45px_rgba(99,102,241,0.10)]">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#5B5FEF]">
                  Lo que buscamos construir
                </p>
                <h2 className="mt-3 text-[1.9rem] font-bold leading-[1.02] tracking-[-0.05em] text-heading sm:text-[2.3rem]">
                  Menos estudiar a ciegas. Más criterio para rendir mejor.
                </h2>
                <p className="mt-3 max-w-[520px] text-sm leading-7 text-slate-600 sm:text-[15px]">
                  El premium no apunta a darte más ruido, sino una experiencia más guiada para
                  practicar con más confianza, entender antes tus errores y llegar más fuerte al examen.
                </p>
              </div>
            </div>
          </div>

          {/* --- TABLA COMPARATIVA --- */}
          <div className="mt-12 sm:mt-16">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
                <Target className="h-3.5 w-3.5" />
                Compará los planes
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                Gratis vs Premium
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Conocé exactamente qué incluye cada plan para que elijas con tranquilidad.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_120px] border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 sm:grid-cols-[1fr_160px_160px]">
                <div className="px-5 py-4">Característica</div>
                <div className="px-4 py-4 text-center">Gratis</div>
                <div className="px-4 py-4 text-center text-indigo-700">Premium</div>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((row, idx) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_120px_120px] text-sm sm:grid-cols-[1fr_160px_160px] ${
                    idx < comparisonFeatures.length - 1 ? 'border-b border-slate-100' : ''
                  } ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-3 px-5 py-3.5 font-medium text-slate-700">
                    {row.feature}
                  </div>
                  <div className="flex flex-col items-center justify-center px-4 py-3.5 text-center">
                    {row.free ? (
                      <Check className="h-4.5 w-4.5 text-emerald-500" />
                    ) : (
                      <X className="h-4.5 w-4.5 text-slate-300" />
                    )}
                    {row.freeNote && (
                      <span className="mt-1 text-[11px] leading-4 text-slate-400">{row.freeNote}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center px-4 py-3.5 text-center">
                    <Check className="h-4.5 w-4.5 text-indigo-600" />
                    {row.premiumNote && (
                      <span className="mt-1 text-[11px] leading-4 text-slate-500">{row.premiumNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Badge de precio */}
            <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                  ARS $12,990
                </span>
                <span className="text-sm text-slate-500">/mes</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/50">
                <Sparkles className="h-3.5 w-3.5" />
                En preparación
              </span>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              Plan anual con 20% de descuento disponible al lanzar.
            </p>
          </div>

          <section className="mt-8 sm:mt-10">
            <PricingWaitlistCard />
          </section>
        </div>
      </section>
    </main>
  );
}

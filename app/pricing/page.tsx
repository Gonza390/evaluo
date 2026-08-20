import type { Metadata } from 'next';
import { ArrowRight, Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { PremiumValuePreview } from '@/components/pricing/PremiumValuePreview';

export const metadata: Metadata = {
  title: 'Planes y precios | Evaluo',
  description: 'Elegí cómo prepararte para tus parciales con Evaluo Gratis o Evaluo Premium.',
  alternates: { canonical: '/pricing' },
};

const premiumFeatures = [
  'Convertí tus apuntes en una guía de estudio priorizada',
  'Practicá un parcial basado en el material de tu curso',
  'Entendé cada error con explicaciones paso a paso',
  'Detectá qué temas reforzar antes del examen',
];

const freeFeatures = [
  'Resúmenes y materiales por materia',
  'Pregunteros para practicar',
  'Simuladores en formato básico',
  'Una revisión de errores con IA por semana',
];

const comparison = [
  ['Resúmenes y materiales', true, true],
  ['Pregunteros', true, true],
  ['Simuladores completos', false, true],
  ['Explicaciones con IA sin límite', false, true],
  ['Práctica personalizada de errores', false, true],
  ['Progreso avanzado por tema', false, true],
] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; materia?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const source = String(params.source ?? 'pricing_direct').slice(0, 80);
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <main className="bg-background text-foreground min-h-screen">
      <MarketingPageViewTracker
        eventName="pricing_view"
        payload={{ location: source, plan_context: 'premium_founders' }}
      />

      <section className="relative overflow-hidden border-b">
        <div className="bg-primary/8 absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-14 text-center sm:px-6 sm:pt-16 sm:pb-20">
          <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Precio fundador para los primeros 100
          </span>
          <h1 className="text-foreground mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-[-0.045em] sm:text-6xl sm:leading-[1.04]">
            Convertí tus apuntes en un plan para aprobar el próximo parcial.
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-xl sm:leading-8">
            Practicá con el material real de tu materia, detectá qué temas necesitás reforzar y
            entendé cada error antes del examen.
          </p>
          <a
            href="#elegir-plan"
            className="bg-primary text-primary-foreground focus-visible:ring-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ver los planes
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs">
            <ShieldCheck className="text-primary h-4 w-4" />
            Cobro seguro con Mercado Pago · Cancelá cuando quieras
          </p>
        </div>
      </section>

      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <PremiumValuePreview source={source} />
      </section>

      <section id="elegir-plan" className="scroll-mt-8 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <article className="bg-card flex flex-col rounded-3xl border p-6 sm:p-8">
              <p className="text-muted-foreground text-sm font-semibold">Gratis</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-foreground text-4xl font-bold tracking-tight">$0</span>
                <span className="text-muted-foreground pb-1 text-sm">para siempre</span>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-6">
                Todo lo necesario para empezar a estudiar con Evaluo.
              </p>
              <ul className="mt-7 flex-1 space-y-4">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6">
                    <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/explorar"
                className="border-input bg-background text-foreground hover:bg-white mt-8 inline-flex h-12 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition"
              >
                Seguir con el plan gratis
              </a>
            </article>

            <PaymentCheckoutCard features={premiumFeatures} source={source} materiaId={materiaId} />
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Compará sin vueltas
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Sabé exactamente qué desbloqueás al pasar a Premium.
            </p>
          </div>

          <div className="bg-card mt-8 overflow-hidden rounded-3xl border shadow-sm">
            <div className="bg-white grid grid-cols-[1fr_68px_82px] border-b px-4 py-4 text-xs font-bold sm:grid-cols-[1fr_140px_140px] sm:px-6 sm:text-sm">
              <span>Función</span>
              <span className="text-center">Gratis</span>
              <span className="text-primary text-center">Premium</span>
            </div>
            {comparison.map(([feature, free, premium]) => (
              <div
                key={feature}
                className="grid grid-cols-[1fr_68px_82px] items-center border-b px-4 py-4 text-sm last:border-0 sm:grid-cols-[1fr_140px_140px] sm:px-6"
              >
                <span className="pr-3 leading-5">{feature}</span>
                <span className="flex justify-center">
                  {free ? (
                    <Check className="h-5 w-5 text-emerald-600" aria-label="Incluido" />
                  ) : (
                    <X className="text-muted-foreground/50 h-5 w-5" aria-label="No incluido" />
                  )}
                </span>
                <span className="flex justify-center">
                  {premium ? (
                    <Check className="text-primary h-5 w-5" aria-label="Incluido" />
                  ) : null}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm">¿Todavía tenés dudas?</p>
            <p className="text-foreground mt-2 font-semibold">
              Podés cancelar la renovación en cualquier momento desde Mercado Pago.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

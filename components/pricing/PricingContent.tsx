import Link from 'next/link';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import './pricing-v2.css';

type PricingContentProps = {
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
};

/**
 * Contenido de pricing compartido por /pricing (pública) y /dashboard/premium
 * ("Mejorar mi plan" dentro de la app): mismo encabezado, planes y textos.
 * Versión compacta (nov-2026) para reducir el scroll.
 */
export function PricingContent({ source, materiaId, parcial, returnTo }: PricingContentProps) {
  return (
    <div className="pricing-v2 w-full min-w-0 text-slate-950">
      <section className="mx-auto flex max-w-[640px] flex-col items-center gap-2.5 px-5 pt-6 pb-5 text-center sm:px-6 sm:pt-10 sm:pb-6">
        <h1 className="text-[26px] leading-[1.12] font-extrabold tracking-[-0.8px] sm:text-[36px] sm:tracking-[-1.2px]">
          Llegá a cada examen sabiendo que estás listo.
        </h1>
        <p className="max-w-[480px] text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
          Con Gratis sabés dónde estás parado. Con Premium practicás lo que te falta hasta llegar.
        </p>

        <div
          className="mt-1 flex w-full max-w-[340px] flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left"
          aria-label="Ejemplo de nivel de preparación: 62% en Marketing I, Parcial 1"
        >
          <div className="flex justify-between text-[12px]">
            <span className="font-semibold">Marketing I · Parcial 1</span>
            <span className="text-slate-600">Ejemplo</span>
          </div>
          <div className="relative h-[26px]" aria-hidden="true">
            <div className="absolute inset-x-0 top-1 h-1.5 rounded-full bg-slate-200" />
            <div className="absolute top-1 left-0 h-1.5 w-[62%] rounded-full bg-[var(--pv-accent)]" />
            <span className="absolute top-[13px] left-[62%] -translate-x-1/2 text-[11px] font-bold text-[var(--pv-accent)]">
              62%
            </span>
            <div className="absolute top-0 left-[85%] h-3.5 w-0.5 bg-slate-950" />
            <span className="absolute top-[13px] left-[85%] -translate-x-1/2 text-[11px] font-bold">
              Listo
            </span>
          </div>
        </div>
      </section>

      <section id="elegir-plan" className="mx-auto max-w-[860px] px-5 sm:px-6">
        <PricingPlans source={source} materiaId={materiaId} parcial={parcial} returnTo={returnTo} />
      </section>

      <p className="mx-auto mt-8 mb-10 max-w-[620px] px-5 text-center text-[12px] text-slate-600">
        Al comprar aceptás los{' '}
        <Link href="/facturacion" className="font-semibold text-[var(--pv-accent)] hover:underline">
          términos de facturación
        </Link>
        .
      </p>
    </div>
  );
}

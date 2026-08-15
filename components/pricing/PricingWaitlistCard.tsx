'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { storePricingIntent } from '@/lib/pricing-intent';

const notes = [
  'Tu email se usa para darte prioridad dentro de la beta.',
  'No hace falta pagar ahora para reservar tu lugar.',
  'Cuando abramos el acceso, entras directo al flujo premium.',
];

export function PricingWaitlistCard() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    storePricingIntent({
      email: normalizedEmail,
      intent: 'premium_waitlist',
    });

    trackMarketingEvent('pricing_cta_click', {
      location: 'pricing_waitlist',
      cta_name: 'reservar_acceso_premium',
      destination: '/login?mode=signup&intent=premium',
      plan_context: 'premium_waitlist',
    });

    router.push('/login?mode=signup&intent=premium');
  };

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[#D9DBFF] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_24%),linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_58%,#EEF3FF_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(79,93,255,0.10)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold ring-1 ring-[#D9DBFF] backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#6366F1]" />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] bg-clip-text text-transparent">
              Reserva anticipada
            </span>
          </div>

          <h2 className="mt-5 text-[2rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#0F1B3D] sm:text-[2.6rem]">
            Reservá tu lugar y entrá primero cuando activemos Premium.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Este acceso está pensado para alumnos que quieren practicar con más criterio,
            entender mejor sus errores y estudiar con una experiencia más guiada.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/90 bg-white/88 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5B5FEF]">
            Acceso prioritario
          </p>
          <h3 className="mt-3 text-[1.7rem] font-bold leading-[1.02] tracking-[-0.04em] text-[#0F1B3D]">
            Guardá tu acceso antes del lanzamiento
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Déjanos tu email y te llevamos a crear tu cuenta para guardar tu prioridad dentro de Evaluo.
          </p>

          <div className="mt-5">
            <label htmlFor="pricing-email" className="text-sm font-semibold text-slate-700">
              Email universitario o personal
            </label>
            <Input
              id="pricing-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@universidad.edu"
              className="mt-3 h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500"
              required
            />
          </div>

          <Button
            type="submit"
            className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:opacity-95"
          >
            Reservar mi lugar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4">
            <p className="text-sm font-semibold text-[#0F1B3D]">¿Qué pasa después?</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Asociamos tu prioridad a una cuenta para que, cuando abramos Premium, ya tengas el acceso listo.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  FileUp,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const unlockedFeatures = [
  {
    icon: FileUp,
    title: 'Subí tu material',
    description: 'Tu PDF del curso se convierte en un espacio de estudio.',
  },
  {
    icon: BrainCircuit,
    title: 'Tu material, listo en minutos',
    description: 'Resumen, tarjetas y ejercicios armados a partir de tus apuntes.',
  },
  {
    icon: Target,
    title: 'Simulá tu parcial',
    description: 'Preguntas basadas en tu material, con corrección y explicaciones.',
  },
];

export function PaymentResult() {
  const [status, setStatus] = useState('pending');
  const [details, setDetails] = useState<{
    amountArs: number | null;
    nextPaymentDate: string | null;
    promotion: string | null;
  }>({ amountArs: null, nextPaymentDate: null, promotion: null });
  const trackedReturnStatus = useRef<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      const response = await fetch('/api/payments/status', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/login?next=/pricing/resultado');
        return;
      }
      if (response.ok) {
        const payload = (await response.json()) as {
          status?: string;
          amountArs?: number | null;
          nextPaymentDate?: string | null;
          promotion?: string | null;
        };
        setStatus(payload.status ?? 'pending');
        setDetails({
          amountArs: payload.amountArs ?? null,
          nextPaymentDate: payload.nextPaymentDate ?? null,
          promotion: payload.promotion ?? null,
        });
        if (['active', 'approved', 'authorized'].includes(payload.status ?? '')) return;
      }
      if (attempts < 10) window.setTimeout(check, 2500);
    };
    void check();
  }, []);

  const active = ['active', 'approved', 'authorized'].includes(status);

  useEffect(() => {
    if (status === 'pending' || trackedReturnStatus.current === status) return;
    trackMarketingEvent('premium_checkout_returned', { status });
    trackedReturnStatus.current = status;
  }, [status]);
  const amount = details.amountArs
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(details.amountArs)
    : null;
  const nextPayment = details.nextPaymentDate
    ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(details.nextPaymentDate)
      )
    : null;

  if (!active) {
    return (
      <div className="border-border bg-card mx-auto max-w-xl rounded-[32px] border p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10">
        {status === 'pending' ? (
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
        ) : (
          <Clock3 className="text-muted-foreground mx-auto h-12 w-12" />
        )}
        <h1 className="text-foreground mt-5 text-3xl font-bold tracking-tight">
          Estamos confirmando tu suscripción
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-7">
          Mercado Pago puede tardar unos instantes en notificarnos. No vuelvas a pagar ni cierres
          esta pantalla.
        </p>
        <Button asChild variant="outline" className="mt-6 h-11 rounded-xl px-6">
          <Link href="/pricing">Volver a Planes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-primary/20 bg-card relative mx-auto max-w-4xl overflow-hidden rounded-[36px] border shadow-[0_28px_90px_rgba(37,99,235,0.14)]">
      <div className="bg-primary/8 absolute -top-28 -right-20 h-72 w-72 rounded-full blur-3xl" />
      <div className="relative px-6 py-8 sm:px-10 sm:py-11">
        <div className="flex flex-col items-center text-center">
          <div className="bg-primary/10 ring-primary/10 flex h-20 w-20 items-center justify-center rounded-full ring-8">
            <CheckCircle2 className="text-primary h-11 w-11" aria-hidden="true" />
          </div>
          <span className="bg-primary/10 text-primary mt-7 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase">
            <Crown className="h-3.5 w-3.5" />
            Evaluo Premium
          </span>
          <h1 className="text-foreground mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            Ya podés estudiar tu material de verdad
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7 sm:text-lg">
            Subí el PDF de tu materia y la IA lo convierte en tu guía de estudio: resumen, tarjetas
            y ejercicios. Así llegás listo a tu parcial.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {unlockedFeatures.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border-border bg-background rounded-2xl border p-4 text-left"
            >
              <Icon className="text-primary h-5 w-5" aria-hidden="true" />
              <p className="text-foreground mt-3 text-sm font-bold">{title}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>
            </div>
          ))}
        </div>

        {(amount || nextPayment || details.promotion) && (
          <div className="border-border bg-white mt-6 flex flex-col gap-3 rounded-2xl border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            {amount ? (
              <span className="text-foreground flex items-center gap-2 font-semibold">
                <Check className="text-primary h-4 w-4" /> {amount} por mes
              </span>
            ) : null}
            {nextPayment ? (
              <span className="text-muted-foreground flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Próxima renovación: {nextPayment}
              </span>
            ) : null}
            {details.promotion ? (
              <span className="text-primary flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" /> Precio fundador aplicado
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <Button asChild className="h-12 w-full rounded-xl px-8 text-base sm:w-auto">
            <Link
              href="/dashboard/materiales?openUpload=1"
              onClick={() =>
                trackMarketingEvent('premium_onboarding_started', {
                  destination: '/dashboard/materiales',
                })
              }
            >
              <FileUp className="mr-2 h-4 w-4" />
              Subí tu material
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/simulador"
            className="text-muted-foreground hover:text-primary mt-1 text-xs underline-offset-4 hover:underline"
          >
            ¿Ya tenés material? Ir directo al simulador.
          </Link>
        </div>
        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-center text-xs">
          <ShieldCheck className="text-primary h-4 w-4" />
          Al subir un material podés elegir si compartirlo con tu materia o mantenerlo privado.
        </p>
        <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2 text-center text-xs">
          <ShieldCheck className="text-primary h-4 w-4" />
          Suscripción administrada de forma segura con Mercado Pago
        </p>
      </div>
    </div>
  );
}

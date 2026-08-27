'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileUp,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const unlockedFeatures = [
  ['01', 'Subí tu material', 'Convertí tu PDF en un espacio de estudio.'],
  ['02', 'Estudiá el contenido', 'Usá resumen, tarjetas y ejercicios sobre tus apuntes.'],
  ['03', 'Practicá para el parcial', 'Comprobá qué entendiste y reforzá tus errores.'],
] as const;

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
      <section className="mx-auto w-full max-w-xl border-y border-slate-200 py-10 text-center sm:py-12">
        {status === 'pending' ? (
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />
        ) : (
          <Clock3 className="mx-auto h-9 w-9 text-slate-400" />
        )}
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
          Estado de tu suscripción
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          Estamos confirmando tu suscripción
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          Mercado Pago puede tardar unos instantes en notificarnos. No vuelvas a pagar ni cierres
          esta pantalla.
        </p>
        <Button asChild variant="outline" className="mt-6 h-11 rounded-lg px-6 shadow-none">
          <Link href="/pricing">Volver a Planes</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl">
      <header className="border-b border-slate-200 pb-8 text-center sm:pb-10">
        <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">
          Evaluo Premium activado
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          Ya podés estudiar tu material de principio a fin.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Subí el PDF de tu materia y seguí el mismo recorrido: estudiar el contenido, practicar y
          volver sobre lo que necesitás reforzar.
        </p>
      </header>

      {(amount || nextPayment || details.promotion) ? (
        <dl className="border-b border-slate-200">
          {amount ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="h-4 w-4 text-blue-600" /> Plan
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{amount} por mes</dd>
            </div>
          ) : null}
          {nextPayment ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" /> Próxima renovación
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{nextPayment}</dd>
            </div>
          ) : null}
          {details.promotion ? (
            <div className="grid gap-2 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="text-sm text-slate-500">Promoción</dt>
              <dd className="text-sm font-semibold text-blue-600 sm:text-right">Precio fundador aplicado</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-14 sm:py-10">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">Qué sigue</p>
          <div className="mt-4 border-t border-slate-200">
            {unlockedFeatures.map(([number, title, description]) => (
              <div
                key={number}
                className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-slate-200 py-4"
              >
                <span className="pt-0.5 text-xs font-bold text-blue-600">{number}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:min-w-[230px]">
          <Button asChild className="h-12 w-full rounded-lg bg-blue-600 px-6 text-base shadow-none hover:bg-blue-700">
            <Link
              href="/dashboard/materiales?openUpload=1"
              onClick={() =>
                trackMarketingEvent('premium_onboarding_started', {
                  destination: '/dashboard/materiales',
                })
              }
            >
              <FileUp className="mr-2 h-4 w-4" />
              Subir mi material
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/simulador"
            className="text-center text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            Ir directo al simulador
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          Al subir un material podés elegir si compartirlo con tu materia o mantenerlo privado.
        </p>
        <p className="mt-2 flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          Suscripción administrada de forma segura con Mercado Pago.
        </p>
      </footer>
    </section>
  );
}

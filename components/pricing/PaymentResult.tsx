'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const unlockedFeatures = [
  ['01', 'Subí tu material', 'Convertí tu PDF en un espacio de estudio.'],
  ['02', 'Estudiá el contenido', 'Usá resumen, flashcards y ejercicios sobre tus apuntes.'],
  ['03', 'Practicá para el parcial', 'Comprobá qué entendiste y reforzá tus errores.'],
] as const;

type PaymentResultProps = {
  attemptId?: string;
  source?: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
};

type PaymentDetails = {
  plan: 'free' | 'premium';
  status: string;
  amountArs: number | null;
  nextPaymentDate: string | null;
  accessUntil: string | null;
  promotion: string | null;
  billingMode: 'recurring' | 'fixed_term' | null;
  checkoutStatus: string | null;
  checkoutOfferCode: string | null;
};

type PaymentResultState = 'processing' | 'approved' | 'failed' | 'attention';

const ACTIVE_STATUSES = new Set(['active', 'approved', 'authorized', 'trialing']);
const ATTENTION_STATUSES = new Set(['past_due', 'paused']);
const FAILED_STATUSES = new Set(['failed', 'rejected', 'cancelled', 'canceled', 'expired']);
const FAILED_CHECKOUT_STATUSES = new Set(['failed', 'expired']);

const INITIAL_DETAILS: PaymentDetails = {
  plan: 'free',
  status: 'pending',
  amountArs: null,
  nextPaymentDate: null,
  accessUntil: null,
  promotion: null,
  billingMode: null,
  checkoutStatus: null,
  checkoutOfferCode: null,
};

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function safeReturnTo(value: string | undefined) {
  const candidate = String(value ?? '').slice(0, 600);
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
}

function contextualPremiumRoute(
  source: string,
  materiaId: string | undefined,
  parcial: number | undefined,
  returnTo: string | undefined
) {
  const params = new URLSearchParams();
  if (materiaId) params.set('materia', materiaId);
  if (parcial) params.set('parcial', String(parcial));
  if (returnTo) params.set('returnTo', returnTo);

  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  if (source === 'material_mapa_mental') return `/premium/mapa-mental${suffix}`;
  if (source === 'simulator_explanations') return `/premium/explicaciones${suffix}`;
  if (source === 'errores_review') return `/premium/errores${suffix}`;
  if (source === 'premium_simulator') return `/premium/simulador${suffix}`;
  return '/pricing#elegir-plan';
}

function successContext(source: string, returnTo: string | undefined) {
  const destination = safeReturnTo(returnTo);

  if (source === 'material_mapa_mental') {
    return {
      title: 'Tu mapa mental ya está desbloqueado.',
      description: 'Volvé a tu material y abrí la vista de mapa mental con Premium activo.',
      cta: 'Abrir mapa mental',
      href: destination ?? '/dashboard/materiales',
    };
  }
  if (source === 'simulator_explanations') {
    return {
      title: 'Ya podés revisar tus explicaciones sin límite.',
      description: 'Volvé a tus errores y seguí entendiendo qué fallaste y qué necesitás reforzar.',
      cta: 'Ver mis explicaciones',
      href: destination ?? '/dashboard/explicaciones',
    };
  }
  if (source === 'errores_review') {
    return {
      title: 'Ya podés seguir practicando tus errores.',
      description: 'Premium quedó activo: retomá el repaso y trabajá justo sobre los temas que te cuestan.',
      cta: 'Continuar mi repaso',
      href: destination ?? '/dashboard/explicaciones',
    };
  }
  if (source === 'premium_simulator') {
    return {
      title: 'Tu simulador Premium está desbloqueado.',
      description: 'Volvé al parcial que querías practicar y empezá con Premium activo.',
      cta: 'Comenzar simulador Premium',
      href: destination ?? '/simulador',
    };
  }
  return null;
}

function resolvePaymentResultState(details: PaymentDetails): PaymentResultState {
  const status = details.status.toLowerCase();
  const checkoutStatus = details.checkoutStatus?.toLowerCase() ?? '';

  if (details.plan === 'premium' || ACTIVE_STATUSES.has(status)) return 'approved';
  if (ATTENTION_STATUSES.has(status)) return 'attention';
  if (FAILED_STATUSES.has(status) || FAILED_CHECKOUT_STATUSES.has(checkoutStatus)) return 'failed';

  return 'processing';
}

export function PaymentResult({
  attemptId,
  source = 'pricing_direct',
  materiaId,
  parcial,
  returnTo,
}: PaymentResultProps) {
  const [details, setDetails] = useState<PaymentDetails>(INITIAL_DETAILS);
  const [checking, setChecking] = useState(false);
  const trackedReturnStatus = useRef<string | null>(null);

  const checkPaymentStatus = useCallback(async () => {
    setChecking(true);
    try {
      const statusParams = new URLSearchParams();
      if (attemptId) statusParams.set('attemptId', attemptId);
      const statusQuery = statusParams.toString();
      const statusUrl = `/api/payments/status${statusQuery ? `?${statusQuery}` : ''}`;
      const response = await fetch(statusUrl, { cache: 'no-store' });
      if (response.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        return null;
      }
      if (!response.ok) return null;

      const payload = (await response.json()) as Partial<PaymentDetails>;
      const nextDetails: PaymentDetails = {
        plan: payload.plan === 'premium' ? 'premium' : 'free',
        status: payload.status ?? 'pending',
        amountArs: payload.amountArs ?? null,
        nextPaymentDate: payload.nextPaymentDate ?? null,
        accessUntil: payload.accessUntil ?? null,
        promotion: payload.promotion ?? null,
        billingMode: payload.billingMode ?? null,
        checkoutStatus: payload.checkoutStatus ?? null,
        checkoutOfferCode: payload.checkoutOfferCode ?? null,
      };
      setDetails(nextDetails);
      return nextDetails;
    } finally {
      setChecking(false);
    }
  }, [attemptId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      const nextDetails = await checkPaymentStatus();
      if (cancelled || !nextDetails) return;

      if (resolvePaymentResultState(nextDetails) === 'processing' && attempts < 10) {
        timeoutId = window.setTimeout(check, 2500);
      }
    };

    void check();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [checkPaymentStatus]);

  const resultState = resolvePaymentResultState(details);

  useEffect(() => {
    if (resultState === 'processing') return;

    const trackingKey = `${resultState}:${details.status}:${details.checkoutStatus ?? ''}`;
    if (trackedReturnStatus.current === trackingKey) return;

    trackMarketingEvent('premium_checkout_returned', {
      status: details.status,
      checkout_status: details.checkoutStatus,
      offer_code: details.checkoutOfferCode,
      result_state: resultState,
      billing_mode: details.billingMode,
      amount_ars: details.amountArs,
      source,
      destination: safeReturnTo(returnTo),
    });
    trackedReturnStatus.current = trackingKey;
  }, [
    details.amountArs,
    details.billingMode,
    details.checkoutOfferCode,
    details.checkoutStatus,
    details.status,
    resultState,
    returnTo,
    source,
  ]);

  const amount = details.amountArs
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(details.amountArs)
    : null;
  const nextPayment = formatDate(details.nextPaymentDate);
  const accessUntil = formatDate(details.accessUntil);
  const fixedTerm = details.billingMode === 'fixed_term';
  const contextualSuccess = successContext(source, returnTo);
  const retryHref = contextualPremiumRoute(source, materiaId, parcial, safeReturnTo(returnTo));

  const promotionLabel =
    details.promotion === 'founders_2026'
      ? 'Precio fundador aplicado'
      : details.promotion === 'semester_2026'
        ? 'Plan de 6 meses'
        : details.promotion
          ? 'Promoción aplicada'
          : null;

  if (resultState === 'processing') {
    return (
      <section className="mx-auto w-full max-w-xl border-y border-slate-200 py-10 text-center sm:py-12">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          Procesando pago
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          Estamos confirmando tu pago
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          Mercado Pago puede tardar unos instantes en notificarnos. No vuelvas a pagar mientras
          verificamos el estado de este intento.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => void checkPaymentStatus()}
            disabled={checking}
            className="h-11 rounded-lg px-6 shadow-none"
          >
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Actualizar estado
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href={retryHref}>Volver</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (resultState === 'failed') {
    return (
      <section className="mx-auto w-full max-w-xl border-y border-slate-200 py-10 text-center sm:py-12">
        <XCircle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
          Pago no completado
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          No pudimos activar Premium con este intento
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          El pago fue rechazado, cancelado o venció antes de completarse. Podés volver a intentarlo;
          Premium se activa únicamente cuando Mercado Pago confirma el cobro.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-lg px-6 shadow-none">
            <Link href={retryHref}>
              Intentar nuevamente
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (resultState === 'attention') {
    return (
      <section className="mx-auto w-full max-w-xl border-y border-amber-200 py-10 text-center sm:py-12">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
          Requiere acción
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          Necesitamos que revises tu suscripción
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          Mercado Pago informó un problema con el cobro o dejó la suscripción pausada. Revisá tu
          plan para ver el estado actual antes de volver a intentar un pago.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/configuracion">
              Revisar mi suscripción
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl">
      <header className="border-b border-slate-200 pb-8 text-center sm:pb-10">
        <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
          Evaluo Premium activado
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          {contextualSuccess?.title ?? 'Ya podés estudiar tu material de principio a fin.'}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          {contextualSuccess?.description ??
            'Subí el PDF de tu materia y seguí el mismo recorrido: estudiar el contenido, practicar y volver sobre lo que necesitás reforzar.'}
        </p>
      </header>

      {amount || nextPayment || accessUntil || promotionLabel ? (
        <dl className="border-b border-slate-200">
          {amount ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="h-4 w-4 text-blue-600" /> Pago
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">
                {fixedTerm ? `${amount} · pago único` : `${amount} por mes`}
              </dd>
            </div>
          ) : null}
          {nextPayment && !fixedTerm ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" /> Próxima renovación
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{nextPayment}</dd>
            </div>
          ) : null}
          {accessUntil && fixedTerm ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" /> Premium hasta
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{accessUntil}</dd>
            </div>
          ) : null}
          {promotionLabel ? (
            <div className="grid gap-2 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="text-sm text-slate-500">Oferta</dt>
              <dd className="text-sm font-semibold text-blue-600 sm:text-right">{promotionLabel}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {contextualSuccess ? (
        <div className="py-8 text-center sm:py-10">
          <Button
            asChild
            className="h-12 w-full max-w-md rounded-lg bg-blue-600 px-6 text-base shadow-none hover:bg-blue-700"
          >
            <Link
              href={contextualSuccess.href}
              onClick={() =>
                trackMarketingEvent('premium_feature_return_clicked', {
                  source,
                  destination: contextualSuccess.href,
                  materia_id: materiaId,
                  parcial,
                })
              }
            >
              {contextualSuccess.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/dashboard"
            className="mt-4 block text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            Ir al dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 py-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Qué sigue</p>
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
              href="/explorar"
              className="text-center text-xs font-semibold text-slate-500 transition hover:text-blue-600"
            >
              Volver a mis materias
            </Link>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
        {!contextualSuccess ? (
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            Al subir un material podés elegir si compartirlo con tu materia o mantenerlo privado.
          </p>
        ) : null}
        <p className={`${contextualSuccess ? '' : 'mt-2 '}flex items-start gap-2`}>
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          Pago procesado de forma segura con Mercado Pago.
        </p>
      </footer>
    </section>
  );
}

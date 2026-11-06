'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { safePremiumReturnTo, premiumPricingHref, premiumDashboardHref } from '@/lib/premium-flow';
import { premiumPaymentResultState } from '@/lib/payments/status';
import { notifyPremiumAccessChanged } from '@/lib/premium-access-events';
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
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

const PAYMENT_RESULT_EN: Record<string,string> = {
  "Subí tu material": "Upload your material",
  "Convertí tu PDF en un espacio de estudio.": "Turn your PDF into a place to study.",
  "Estudiá el contenido": "Study the content",
  "Usá resumen, flashcards y ejercicios sobre tus apuntes.": "Use summaries, flashcards and exercises based on your notes.",
  "Practicá para el parcial": "Practice for your exam",
  "Comprobá qué entendiste y reforzá tus errores.": "Check your understanding and review mistakes.",
  "Tu mapa mental ya está desbloqueado.": "Your mind map is unlocked.",
  "Volvé a tu material y abrí la vista de mapa mental con Premium activo.": "Return to your material and open the mind map with Premium active.",
  "Abrir mapa mental": "Open mind map",
  "Ya podés revisar tus explicaciones sin límite.": "You can now review more explanations.",
  "Volvé a tus errores y seguí entendiendo qué fallaste y qué necesitás reforzar.": "Return to your mistakes and review what needs more practice.",
  "Ver mis explicaciones": "View explanations",
  "Ya podés seguir practicando tus errores.": "You can continue reviewing mistakes.",
  "Premium quedó activo: retomá el repaso y trabajá justo sobre los temas que te cuestan.": "Premium is active. Continue reviewing the topics you find difficult.",
  "Continuar mi repaso": "Continue review",
  "Tu simulador Premium está desbloqueado.": "Your Premium mock exam is unlocked.",
  "Volvé al parcial que querías practicar y empezá con Premium activo.": "Return to the exam you wanted to practice with Premium active.",
  "Comenzar simulador Premium": "Start Premium mock exam",
  "Evaluo Premium está activo.": "Evaluo Premium is active.",
  "Podés continuar estudiando desde donde lo dejaste.": "You can continue studying where you left off.",
  "Continuar estudiando": "Continue studying",
  "Precio fundador aplicado": "Founder price applied",
  "Plan de 6 meses": "6-month plan",
  "Promoción aplicada": "Promotion applied",
  "Procesando pago": "Processing payment",
  "Estamos confirmando tu pago": "We are confirming your payment",
  "El proveedor de pago puede tardar unos instantes en notificarnos. No vuelvas a pagar mientras verificamos el estado de este intento.": "It may take a moment for your payment provider to notify us. Please do not pay again while we verify this payment.",
  "Actualizar estado": "Refresh status",
  "Volver": "Back",
  "Pago no completado": "Payment not completed",
  "No pudimos activar Premium con este intento": "We could not activate Premium from this attempt",
  "El pago fue rechazado, cancelado o venció antes de completarse. Podés volver a intentarlo; Premium se activa únicamente cuando el proveedor confirma el cobro.": "Your payment was declined, cancelled or expired. You can try again; Premium is activated only after the provider confirms payment.",
  "Intentar nuevamente": "Try again",
  "Volver a Mi espacio": "Return to My space",
  "Requiere acción": "Action required",
  "Necesitamos que revises tu suscripción": "Please review your subscription",
  "El proveedor informó un problema con el cobro o dejó la suscripción pausada. Revisá tu plan para ver el estado actual antes de volver a intentar un pago.": "Your payment provider reported an issue or paused the subscription. Check your current plan before paying again.",
  "Revisar mi suscripción": "Review subscription",
  "Evaluo Premium activado": "Evaluo Premium activated",
  "Ya podés estudiar tu material de principio a fin.": "You can now study your material from start to finish.",
  "Subí el PDF de tu materia y seguí el mismo recorrido: estudiar el contenido, practicar y volver sobre lo que necesitás reforzar.": "Upload your course PDF, study the content, practice and return to the topics you need to review.",
  "Pago": "Payment",
  "pago único": "one-time payment",
  "por mes": "per month",
  "Próxima renovación": "Next renewal",
  "Premium hasta": "Premium until",
  "Oferta": "Offer",
  "Ir a Mi espacio": "Go to My space",
  "Qué sigue": "Next steps",
  "Explorar": "Explore",
  "Subir PDF": "Upload PDF",
  "Subir mi PDF": "Upload my PDF",
  "Preparar otra materia": "Prepare another subject",
  "Activar Premium": "Activate Premium",
  "Cargar mi PDF": "Upload my PDF"
};

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
  amountUsdCents: number | null;
  provider: string | null;
  checkoutProvider: string | null;
  checkoutMode: string | null;
  checkoutAmountUsdCents: number | null;
  nextPaymentDate: string | null;
  accessUntil: string | null;
  promotion: string | null;
  billingMode: 'recurring' | 'fixed_term' | null;
  checkoutStatus: string | null;
  checkoutOfferCode: string | null;
};

type PaymentResultState = 'processing' | 'approved' | 'failed' | 'attention';


const INITIAL_DETAILS: PaymentDetails = {
  plan: 'free',
  status: 'pending',
  amountArs: null,
  amountUsdCents: null,
  provider: null,
  checkoutProvider: null,
  checkoutMode: null,
  checkoutAmountUsdCents: null,
  nextPaymentDate: null,
  accessUntil: null,
  promotion: null,
  billingMode: null,
  checkoutStatus: null,
  checkoutOfferCode: null,
};

function formatDate(value: string | null, english: boolean) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(english ? 'en-US' : 'es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function safeReturnTo(value: string | undefined) {
  return safePremiumReturnTo(value);
}

function contextualPremiumRoute(
  source: string,
  materiaId: string | undefined,
  parcial: number | undefined,
  returnTo: string | undefined
) {
  // Los intentos iniciados dentro de Evaluo siempre vuelven a la misma
  // pantalla Premium. Conservar /pricing sólo para la adquisición pública.
  const inAppSource = source.startsWith('free_v2_') || [
    'material_mapa_mental', 'simulator_explanations', 'errores_review',
    'premium_simulator', 'dashboard_premium', 'configuracion',
  ].includes(source);
  return inAppSource
    ? premiumDashboardHref({source, materiaId, parcial, returnTo})
    : premiumPricingHref({source, materiaId, parcial, returnTo});
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
  // Incluso una compra desde la página de precios debe recuperar el origen
  // exacto, no enviar al estudiante al dashboard genérico.
  if (destination) {
    return {
      title: 'Evaluo Premium está activo.',
      description: 'Podés continuar estudiando desde donde lo dejaste.',
      cta: 'Continuar estudiando',
      href: destination,
    };
  }
  return null;
}

function resolvePaymentResultState(details: PaymentDetails): PaymentResultState {
  return premiumPaymentResultState(details);
}

export function PaymentResult({
  attemptId,
  source = 'pricing_direct',
  materiaId,
  parcial,
  returnTo,
}: PaymentResultProps) {
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string) => english ? (PAYMENT_RESULT_EN[es] ?? es) : es;
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
        window.location.assign(`${english ? '/en/login' : '/login'}?next=${encodeURIComponent(next)}`);
        return null;
      }
      if (!response.ok) return null;

      const payload = (await response.json()) as Partial<PaymentDetails>;
      const nextDetails: PaymentDetails = {
        plan: payload.plan === 'premium' ? 'premium' : 'free',
        status: payload.status ?? 'pending',
        amountArs: payload.amountArs ?? null,
        amountUsdCents: payload.amountUsdCents ?? null,
        provider: payload.provider ?? null,
        checkoutProvider: payload.checkoutProvider ?? null,
        checkoutMode: payload.checkoutMode ?? null,
        checkoutAmountUsdCents: payload.checkoutAmountUsdCents ?? null,
        nextPaymentDate: payload.nextPaymentDate ?? null,
        accessUntil: payload.accessUntil ?? null,
        promotion: payload.promotion ?? null,
        billingMode: payload.billingMode ?? null,
        checkoutStatus: payload.checkoutStatus ?? null,
        checkoutOfferCode: payload.checkoutOfferCode ?? null,
      };
      setDetails(nextDetails);
      return nextDetails;
    } catch {
      // Sin una respuesta confirmada no podemos anunciar Premium ni marcar
      // una compra como rechazada; el usuario conserva la opción de reintentar.
      return null;
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
      if (cancelled) return;

      if ((!nextDetails || resolvePaymentResultState(nextDetails) === 'processing') && attempts < 10) {
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
  const entitlementNotified = useRef(false);
  useEffect(() => {
    if (resultState === 'approved' && !entitlementNotified.current) {
      entitlementNotified.current = true;
      notifyPremiumAccessChanged();
    }
  }, [resultState]);

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

  const amount = details.amountUsdCents && details.provider === 'creem'
    ? `US$ ${(details.amountUsdCents / 100).toFixed(2).replace('.', english ? '.' : ',')}`
    : details.amountArs
    ? new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(details.amountArs)
    : null;
  const nextPayment = formatDate(details.nextPaymentDate,english);
  const accessUntil = formatDate(details.accessUntil,english);
  const fixedTerm = details.billingMode === 'fixed_term';
  const contextualSuccess = successContext(source, returnTo);
  const baseRetryHref = contextualPremiumRoute(source, materiaId, parcial, safeReturnTo(returnTo));
  const retryHref = english && baseRetryHref.startsWith('/pricing') ? '/en' + baseRetryHref : baseRetryHref;

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
          {t("Procesando pago")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          {t("Estamos confirmando tu pago")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          {t('El proveedor de pago puede tardar unos instantes en notificarnos. No vuelvas a pagar mientras verificamos el estado de este intento.')}
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
            {t("Actualizar estado")}
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href={retryHref}>{t("Volver")}</Link>
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
          {t("Pago no completado")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          {t("No pudimos activar Premium con este intento")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          {t('El pago fue rechazado, cancelado o venció antes de completarse. Podés volver a intentarlo; Premium se activa únicamente cuando el proveedor confirma el cobro.')}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-lg px-6 shadow-none">
            <Link href={retryHref}>
              {t("Intentar nuevamente")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/dashboard">{t("Volver a Mi espacio")}</Link>
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
          {t("Requiere acción")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950">
          {t("Necesitamos que revises tu suscripción")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          {t('El proveedor informó un problema con el cobro o dejó la suscripción pausada. Revisá tu plan para ver el estado actual antes de volver a intentar un pago.')}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/configuracion">
              {t("Revisar mi suscripción")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg px-6 shadow-none">
            <Link href="/dashboard">{t("Volver a Mi espacio")}</Link>
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
          {t("Evaluo Premium activado")}
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          {t(contextualSuccess?.title ?? 'Ya podés estudiar tu material de principio a fin.')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          {t(contextualSuccess?.description ??
            'Subí el PDF de tu materia y seguí el mismo recorrido: estudiar el contenido, practicar y volver sobre lo que necesitás reforzar.')}
        </p>
      </header>

      {amount || nextPayment || accessUntil || promotionLabel ? (
        <dl className="border-b border-slate-200">
          {amount ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="h-4 w-4 text-blue-600" /> {t("Pago")}
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">
                {fixedTerm ? `${amount} · ${t('pago único')}` : `${amount} ${t('por mes')}`}
              </dd>
            </div>
          ) : null}
          {nextPayment && !fixedTerm ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" /> {t("Próxima renovación")}
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{nextPayment}</dd>
            </div>
          ) : null}
          {accessUntil && fixedTerm ? (
            <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock className="h-4 w-4" /> {t("Premium hasta")}
              </dt>
              <dd className="text-sm font-semibold text-slate-950 sm:text-right">{accessUntil}</dd>
            </div>
          ) : null}
          {promotionLabel ? (
            <div className="grid gap-2 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
              <dt className="text-sm text-slate-500">{t("Oferta")}</dt>
              <dd className="text-sm font-semibold text-blue-600 sm:text-right">{promotionLabel ? t(promotionLabel) : null}</dd>
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
              {t(contextualSuccess.cta)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/dashboard"
            className="mt-4 block text-xs font-semibold text-slate-500 transition hover:text-blue-600"
          >
            {t("Ir a Mi espacio")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 py-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{t("Qué sigue")}</p>
            <div className="mt-4 border-t border-slate-200">
              {unlockedFeatures.map(([number, title, description]) => (
                <div
                  key={number}
                  className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-slate-200 py-4"
                >
                  <span className="pt-0.5 text-xs font-bold text-blue-600">{number}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{t(title)}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{t(description)}</p>
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

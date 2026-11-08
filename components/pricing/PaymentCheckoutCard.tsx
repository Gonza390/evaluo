'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { useMercadoPagoCheckout, type MercadoPagoOfferCode } from '@/hooks/use-mercadopago-checkout';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

type PaymentCheckoutCardProps = {
  locale?: 'es' | 'en';
  features: string[];
  source?: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
  offerCode?: MercadoPagoOfferCode;
  featured?: boolean;
};

export function PaymentCheckoutCard({
  features,
  source = 'pricing_direct',
  materiaId,
  parcial,
  returnTo,
  offerCode = 'monthly',
  featured = false,
  locale: forcedLocale,
}: PaymentCheckoutCardProps) {
  const currentLocale = useOptionalAppLocale();
  const english = (forcedLocale ?? currentLocale) === 'en';
  const tr = (es: string, en: string) => english ? en : es;
  // Precio, estado del plan y apertura de Mercado Pago viven en el hook compartido.
  const {
    offer,
    displayedPrice,
    subscriptionStatus,
    loading,
    error,
    checkoutUrl,
    semesterSoldOut,
    startCheckout,
  } = useMercadoPagoCheckout({ offerCode, source, materiaId, parcial, returnTo, english });

  const isSemester = offerCode === 'semester';
  const isRecovery = offerCode === 'recovery';
  const billingLabel = isSemester ? tr("pago único","one-time") : tr("/mes","/month");

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 sm:p-8 ${
        featured
          ? 'border-2 border-blue-300 shadow-xl shadow-blue-100/60'
          : 'border border-slate-200'
      }`}
    >
      {featured && isSemester ? (
        <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-etiqueta font-semibold uppercase tracking-etiqueta text-white">
          {tr("Recomendado","Recommended")}
        </div>
      ) : null}

      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-chico font-semibold text-blue-700">
          <Sparkles className="h-3.5 w-3.5" />
          {isSemester ? tr("Premium · 6 meses","Premium · 6 months") : isRecovery ? tr("Retomá Premium","Resume Premium") : tr("Premium mensual","Monthly Premium")}
        </span>
        <h2 className="mt-4 text-titulo font-semibold tracking-titulo text-slate-950">
          {isSemester ? tr("Sostené tu progreso","Keep making progress") : isRecovery ? tr("Retomá Premium","Resume Premium") : tr("Reforzá y seguí avanzando","Review and keep progressing")}
        </h2>

        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-4xl font-bold tracking-titulo text-slate-950">
            {displayedPrice ? currency.format(displayedPrice) : tr("Consultando…","Checking…")}
          </span>
          {displayedPrice ? <span className="pb-1 text-cuerpo text-slate-600">{billingLabel}</span> : null}
        </div>

        {offer ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-chico">
            {isSemester ? (
              <>
                <span className="text-slate-500 line-through">
                  {currency.format(offer.monthlyPriceArs * 6)}
                </span>
                <span className="font-semibold text-emerald-700">
                  {tr('Ahorrás','Save')} {offer.semesterSavingsPercent}%
                </span>
              </>
            ) : offer.monthlyReferencePriceArs > (displayedPrice ?? 0) ? (
              <>
                <span className="text-slate-500 line-through">
                  {currency.format(offer.monthlyReferencePriceArs)}
                </span>
                <span className="font-semibold text-emerald-700">{tr("Precio promocional","Promotional price")}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-cuerpo leading-6 text-slate-600">
          {!offer
            ? tr("Verificando precio y disponibilidad.","Checking price and availability.")
            : isSemester
              ? english ? `Equivalent to ${currency.format(offer.semesterEquivalentMonthlyArs)} per month. One-time payment for 6 months; no automatic renewal.` : `Equivale a ${currency.format(offer.semesterEquivalentMonthlyArs)} por mes. Pagás una sola vez por los 6 meses, sin renovación automática.`
              : isRecovery
                ? tr("Retomá tu compra al precio promocional vigente. Renovación mensual automática.","Resume your purchase at the current promotional price. Renews monthly.")
                : tr("Precio promocional. Renovación mensual automática; podés cancelar futuras renovaciones cuando quieras.","Promotional price. Renews monthly; cancel future renewals anytime.")}
        </p>

        {isSemester ? (
          <div className="mt-3 text-etiqueta leading-4 text-blue-800">
            <p className="font-semibold">
              {offer?.semesterRemaining == null
                ? tr("Verificando los 50 cupos…","Checking 50 available places…")
                : offer.semesterRemaining > 0
                  ? english ? `${offer.semesterRemaining} of ${offer.semesterLimit} places currently available` : `${offer.semesterRemaining} de ${offer.semesterLimit} cupos disponibles ahora`
                  : tr("Los 50 cupos están ocupados","All 50 places are taken")}
            </p>
            <p className="mt-0.5 text-etiqueta leading-4 text-slate-500">
              {tr("Los cupos disponibles pueden cambiar mientras otras personas completan su compra.","Availability may change as other people complete their purchases.")}
            </p>
          </div>
        ) : null}
      </div>

      {subscriptionStatus === 'active' ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-cuerpo font-semibold text-slate-950">{tr("Tu Premium está activo","Your Premium is active")}</p>
              <p className="mt-1 text-chico leading-5 text-slate-600">
                {tr("Ya tenés acceso a todas las funciones incluidas en este plan.","You now have access to all features in this plan.")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionStatus === 'attention' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-cuerpo font-semibold text-amber-800">{tr("Tu suscripción necesita atención","Your subscription needs attention")}</p>
          <p className="mt-1 text-chico leading-5 text-amber-700">
            {tr("Revisá el pago pendiente antes de intentar una nueva compra.","Check the pending payment before attempting another purchase.")}
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-cuerpo leading-6 text-slate-600">
        {isSemester
          ? tr("Prepará más materiales y reforzá tus errores con IA durante 6 meses.","Study more materials and review mistakes with AI for six months.")
          : tr("Practicá con más apuntes y pedí explicaciones cuando necesitás reforzar un tema.","Practice using more notes and request explanations when a topic needs review.")}
      </p>

      <ul className="mt-7 flex-1 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-cuerpo leading-6 text-slate-800">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Check className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {subscriptionStatus === 'active' ? (
          <Button asChild className="h-12 w-full rounded-xl text-cuerpo font-semibold">
            <Link href="/dashboard">
              <Crown className="mr-2 h-4 w-4" />
              {tr("Usar mi Premium","Use my Premium")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : subscriptionStatus === 'attention' ? (
          <Button asChild variant="outline" className="h-12 w-full rounded-xl text-cuerpo font-semibold">
            <Link href="/configuracion">{tr("Revisar mi suscripción","Review my subscription")}</Link>
          </Button>
        ) : (
          <Button
            className="h-12 w-full rounded-xl text-cuerpo font-semibold"
            onClick={startCheckout}
            disabled={
              loading ||
              subscriptionStatus === 'loading' ||
              !offer ||
              subscriptionStatus === 'unavailable' ||
              semesterSoldOut
            }
          >
            {loading || subscriptionStatus === 'loading' || !offer ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading
              ? tr("Abriendo Mercado Pago…","Opening Mercado Pago…")
              : subscriptionStatus === 'loading' || !offer
                ? tr("Verificando tu plan…","Checking your plan…")
                : subscriptionStatus === 'unavailable'
                  ? tr("No pudimos verificar tu plan","Could not verify your plan")
                  : semesterSoldOut
                  ? tr("Cupos agotados","Sold out")
                  : isSemester
                    ? tr("Elegir 6 meses","Choose 6 months")
                    : isRecovery
                      ? tr("Retomar Premium por $9.990","Resume Premium for ARS 9,990")
                      : tr("Elegir Premium mensual","Choose monthly Premium")}
            {!loading && subscriptionStatus === 'inactive' && offer && !semesterSoldOut ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        )}

        {error ? (
          <p role="alert" className="mt-3 text-center text-chico text-red-600">
            {error}
          </p>
        ) : null}
        {checkoutUrl && !error ? (
          <div role="status" className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-center">
            <p className="text-chico font-semibold text-slate-950">{tr("Mercado Pago está abierto","Mercado Pago is open")}</p>
            <p className="mt-1 text-etiqueta leading-5 text-slate-600">
              {tr("Si cerraste esa pestaña, podés retomar el pago desde acá.","If you closed that tab, you can resume payment here.")}
            </p>
            <button
              type="button"
              onClick={() => window.open(checkoutUrl, 'evaluo-mercadopago')}
              className="mt-2 text-chico font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              {tr("Volver a abrir Mercado Pago","Reopen Mercado Pago")}
            </button>
          </div>
        ) : null}

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-etiqueta leading-5 text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-700" />
          {isSemester
            ? tr("Pago seguro con Mercado Pago · Sin renovación automática","Secure payment with Mercado Pago · No automatic renewal")
            : tr("Pago seguro con Mercado Pago · Renovación mensual","Secure payment with Mercado Pago · Monthly renewal")}
        </p>
      </div>
    </article>
  );
}

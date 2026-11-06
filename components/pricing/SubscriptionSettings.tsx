'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { notifyPremiumAccessChanged } from '@/lib/premium-access-events';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SUBSCRIPTION_EN: Record<string,string> = {
  "Plan y suscripción": "Plan and subscription",
  "Cargando tu plan…": "Loading your plan…",
  "Evaluo Free": "Evaluo Free",
  "Verificando tu suscripción.": "Checking your subscription.",
  "Tenés acceso completo a todas las herramientas Premium.": "You have full access to Premium tools.",
  "Tu último cobro no pudo completarse y el acceso Premium está pausado.": "Your latest payment was not completed, so Premium access is paused.",
  "Estás en el plan gratis. Pasá a Premium y desbloqueá todo el potencial de Evaluo.": "You are on the Free plan. Upgrade to Premium to unlock more study tools.",
  "Activo hasta el vencimiento": "Active until period end",
  "Plan activo": "Active plan",
  "Pago pendiente": "Payment pending",
  "Plan gratis": "Free plan",
  "Verificando suscripción": "Checking subscription",
  "Tu plan ya está activo": "Your plan is active",
  "Ir a Mi espacio": "Go to My space",
  "Explorar materiales": "Explore materials",
  "¿Querés activar Premium?": "Want to activate Premium?",
  "Entrá directo al plan Premium y continuá con el checkout seguro según tu país.": "Go directly to Premium and use the secure checkout for your country.",
  "Suscribirme a Premium": "Subscribe to Premium",
  "Comparación de planes": "Plan comparison",
  "Gratis": "Free",
  "Incluido": "Included",
  "No incluido": "Not included",
  "Desbloqueá Evaluo Premium": "Unlock Evaluo Premium",
  "Pago seguro según tu país · Cancelá futuras renovaciones": "Secure payment for your country · Cancel future renewals",
  "Cancelar suscripción": "Cancel subscription",
  "¿Cancelar Evaluo Premium?": "Cancel Evaluo Premium?",
  "Mantener Premium": "Keep Premium",
  "Confirmar cancelación": "Confirm cancellation",
  "No pudimos cargar tu suscripción. Intentá nuevamente.": "We could not load your subscription. Please try again.",
  "No pudimos cancelar la suscripción. No se realizó ningún cambio.": "We could not cancel your subscription. No changes were made.",
  "Convertí tus apuntes en una guía de estudio priorizada": "Turn your notes into a prioritized study guide",
  "Practicá un parcial basado en el material de tu curso": "Practice with an exam based on your course material",
  "Explicaciones paso a paso y práctica personalizada de errores": "Step-by-step explanations and personalized mistake review",
  "Progreso avanzado por tema y simuladores completos": "Advanced topic progress and full mock exams",
  "Resúmenes y materiales": "Summaries and materials",
  "Pregunteros": "Question banks",
  "Simuladores completos": "Full mock exams",
  "Explicaciones con IA sin límite": "Unlimited AI explanations",
  "Práctica personalizada de errores": "Personalized mistake practice",
  "Progreso avanzado por tema": "Advanced topic progress"
};

type SubscriptionPayload = {
  plan: 'free' | 'premium';
  planName: string;
  status: string;
  amountArs: number | null;
  amountUsdCents?: number | null;
  nextPaymentDate: string | null;
  promotion: string | null;
  provider: string | null;
  canceledAt: string | null;
  accessUntil: string | null;
  lastPayment: {
    status: string;
    amountArs: number | null;
    currency: string | null;
    paidAt: string;
  } | null;
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

const PREMIUM_BENEFITS = [
  'Convertí tus apuntes en una guía de estudio priorizada',
  'Practicá un parcial basado en el material de tu curso',
  'Explicaciones paso a paso y práctica personalizada de errores',
  'Progreso avanzado por tema y simuladores completos',
];

const COMPARISON = [
  ['Resúmenes y materiales', true, true],
  ['Pregunteros', true, true],
  ['Simuladores completos', false, true],
  ['Explicaciones con IA sin límite', false, true],
  ['Práctica personalizada de errores', false, true],
  ['Progreso avanzado por tema', false, true],
] as const;

const PREMIUM_CHECKOUT_HREF = '/dashboard/premium?source=configuracion&returnTo=%2Fconfiguracion';

export function SubscriptionSettings() {
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string) => english ? (SUBSCRIPTION_EN[es] ?? es) : es;
  const [data, setData] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/payments/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('status_error');
      setData((await response.json()) as SubscriptionPayload);
    } catch {
      setError(t("No pudimos cargar tu suscripción. Intentá nuevamente."));
    } finally {
      setLoading(false);
    }
  }, [english]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function cancelSubscription() {
    setCanceling(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/cancel', { method: 'POST' });
      if (!response.ok) throw new Error('cancel_error');
      notifyPremiumAccessChanged();
      await loadStatus();
    } catch {
      setError(t("No pudimos cancelar la suscripción. No se realizó ningún cambio."));
    } finally {
      setCanceling(false);
    }
  }

  const premium = data?.plan === 'premium';
  const paymentProblem = ['past_due', 'paused'].includes(data?.status ?? '');
  const canceledWithAccess = premium && data?.status === 'canceled';
  const canCancel =
    ['mercadopago', 'creem'].includes(data?.provider ?? '') && (paymentProblem || (premium && !canceledWithAccess));

  return (
    <section className="surface-panel overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${
              premium ? 'from-brand to-brand-2 bg-gradient-to-br' : 'border border-border bg-muted'
            }`}
          >
            <Crown className={`h-6 w-6 ${premium ? '' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="eyebrow-label text-brand">{t("Plan y suscripción")}</p>
            <h2 className="text-heading mt-1 text-2xl font-bold tracking-tight">
              {loading ? t("Cargando tu plan…") : premium ? 'Evaluo Premium' : t("Evaluo Free")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {loading
                ? t("Verificando tu suscripción.")
                : premium
                  ? canceledWithAccess
                    ? (english ? `Your renewal is cancelled. Premium remains active until ${formatDate(data?.accessUntil ?? null, english) ?? 'the end of the paid period'}.` : `Tu renovación está cancelada. Conservás Premium hasta el ${formatDate(data?.accessUntil ?? null, english) ?? 'fin del período pagado'}.`)
                    : t("Tenés acceso completo a todas las herramientas Premium.")
                  : paymentProblem
                    ? t("Tu último cobro no pudo completarse y el acceso Premium está pausado.")
                    : t("Estás en el plan gratis. Pasá a Premium y desbloqueá todo el potencial de Evaluo.")}
            </p>
          </div>
        </div>
        {!loading ? (
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              premium
                ? 'bg-emerald-50 text-emerald-700'
                : paymentProblem
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {premium ? <CheckCircle2 className="h-4 w-4" /> : null}
            {paymentProblem ? <AlertTriangle className="h-4 w-4" /> : null}
            {premium
              ? canceledWithAccess
                ? t("Activo hasta el vencimiento")
                : t("Plan activo")
              : paymentProblem
                ? t("Pago pendiente")
                : t("Plan gratis")}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("Verificando suscripción")}
        </div>
      ) : premium ? (
        <>
          <div className="border-border bg-muted/40 mt-6 rounded-2xl border p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-foreground">{t("Tu plan ya está activo")}</h3>
            </div>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm leading-5 text-muted-foreground">
                  <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  {t(benefit)}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-xl px-5">
                <Link href="/dashboard">
                  {t("Ir a Mi espacio")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl border-input bg-card">
                <Link href="/explorar">{t("Explorar materiales")}</Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="border-primary/20 bg-primary/5 mt-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="from-brand to-brand-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t("¿Querés activar Premium?")}</p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  {t("Entrá directo al plan Premium y continuá con el checkout seguro según tu país.")}
                </p>
              </div>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl px-5">
              <Link href={PREMIUM_CHECKOUT_HREF}>
                {t("Suscribirme a Premium")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="border-border mt-5 overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-[1fr_68px_82px] items-center border-b bg-muted/40 px-4 py-3.5 text-xs font-bold sm:grid-cols-[1fr_120px_120px] sm:px-5 sm:text-sm">
              <span className="text-muted-foreground">{t("Comparación de planes")}</span>
              <span className="text-center text-muted-foreground">{t("Gratis")}</span>
              <span className="text-brand text-center">Premium</span>
            </div>
            {COMPARISON.map(([feature, free, isPremium]) => (
              <div
                key={feature}
                className="border-border grid grid-cols-[1fr_68px_82px] items-center border-b px-4 py-3.5 text-sm last:border-0 sm:grid-cols-[1fr_120px_120px] sm:px-5"
              >
                <span className="pr-3 leading-5 text-foreground">{t(feature)}</span>
                <span className="flex justify-center">
                  {free ? (
                    <Check className="h-5 w-5 text-emerald-600" aria-label={t("Incluido")} />
                  ) : (
                    <X className="text-muted-foreground/40 h-5 w-5" aria-label={t("No incluido")} />
                  )}
                </span>
                <span className="flex justify-center">
                  {isPremium ? (
                    <Check className="text-primary h-5 w-5" aria-label={t("Incluido")} />
                  ) : null}
                </span>
              </div>
            ))}
          </div>

          <div className="border-border bg-muted/40 mt-5 rounded-2xl border p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="from-brand to-brand-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t("Desbloqueá Evaluo Premium")}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> {t("Pago seguro según tu país · Cancelá futuras renovaciones")}
                  </p>
                </div>
              </div>
              <Button asChild className="h-11 shrink-0 rounded-xl px-5">
                <Link href={PREMIUM_CHECKOUT_HREF}>
                  {t("Suscribirme a Premium")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && canCancel ? (
        <div className="mt-6 flex">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {t("Cancelar suscripción")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("¿Cancelar Evaluo Premium?")}</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  {english ? 'Your payment provider will stop future renewals. You keep Premium until the end of your paid period. Cancellation does not refund charges already made.' : 'El proveedor de pago dejará de realizar futuras renovaciones. Conservás Premium hasta finalizar el período que ya pagaste. Esta acción no reembolsa cobros ya realizados.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={canceling}>{t("Mantener Premium")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={canceling}
                  onClick={() => {
                    void cancelSubscription();
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {canceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("Confirmar cancelación")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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

type SubscriptionPayload = {
  plan: 'free' | 'premium';
  planName: string;
  status: string;
  amountArs: number | null;
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

const PREMIUM_CHECKOUT_HREF = '/pricing?source=configuracion#elegir-plan';

export function SubscriptionSettings() {
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
      setError('No pudimos cargar tu suscripción. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function cancelSubscription() {
    setCanceling(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/cancel', { method: 'POST' });
      if (!response.ok) throw new Error('cancel_error');
      await loadStatus();
    } catch {
      setError('No pudimos cancelar la suscripción. No se realizó ningún cambio.');
    } finally {
      setCanceling(false);
    }
  }

  const premium = data?.plan === 'premium';
  const paymentProblem = ['past_due', 'paused'].includes(data?.status ?? '');
  const canceledWithAccess = premium && data?.status === 'canceled';
  const canCancel =
    data?.provider === 'mercadopago' && (paymentProblem || (premium && !canceledWithAccess));

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
            <p className="eyebrow-label text-brand">Plan y suscripción</p>
            <h2 className="text-heading mt-1 text-2xl font-bold tracking-tight">
              {loading ? 'Cargando tu plan…' : premium ? 'Evaluo Premium' : 'Evaluo Free'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {loading
                ? 'Verificando tu suscripción.'
                : premium
                  ? canceledWithAccess
                    ? `Tu renovación está cancelada. Conservás Premium hasta el ${formatDate(data?.accessUntil ?? null) ?? 'fin del período pagado'}.`
                    : 'Tenés acceso completo a todas las herramientas Premium.'
                  : paymentProblem
                    ? 'Tu último cobro no pudo completarse y el acceso Premium está pausado.'
                    : 'Estás en el plan gratis. Pasá a Premium y desbloqueá todo el potencial de Evaluo.'}
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
                ? 'Activo hasta el vencimiento'
                : 'Plan activo'
              : paymentProblem
                ? 'Pago pendiente'
                : 'Plan gratis'}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando suscripción
        </div>
      ) : premium ? (
        <>
          <div className="border-border bg-muted/40 mt-6 rounded-2xl border p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-foreground">Tu plan ya está activo</h3>
            </div>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm leading-5 text-muted-foreground">
                  <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-xl px-5">
                <Link href="/dashboard">
                  Ir a mi plan de estudio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl border-input bg-card">
                <Link href="/explorar">Explorar materiales</Link>
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
                <p className="text-sm font-bold text-foreground">¿Querés activar Premium?</p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  Entrá directo al plan Premium y continuá con el checkout seguro de Mercado Pago.
                </p>
              </div>
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl px-5">
              <Link href={PREMIUM_CHECKOUT_HREF}>
                Suscribirme a Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="border-border mt-5 overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-[1fr_68px_82px] items-center border-b bg-muted/40 px-4 py-3.5 text-xs font-bold sm:grid-cols-[1fr_120px_120px] sm:px-5 sm:text-sm">
              <span className="text-muted-foreground">Comparación de planes</span>
              <span className="text-center text-muted-foreground">Gratis</span>
              <span className="text-brand text-center">Premium</span>
            </div>
            {COMPARISON.map(([feature, free, isPremium]) => (
              <div
                key={feature}
                className="border-border grid grid-cols-[1fr_68px_82px] items-center border-b px-4 py-3.5 text-sm last:border-0 sm:grid-cols-[1fr_120px_120px] sm:px-5"
              >
                <span className="pr-3 leading-5 text-foreground">{feature}</span>
                <span className="flex justify-center">
                  {free ? (
                    <Check className="h-5 w-5 text-emerald-600" aria-label="Incluido" />
                  ) : (
                    <X className="text-muted-foreground/40 h-5 w-5" aria-label="No incluido" />
                  )}
                </span>
                <span className="flex justify-center">
                  {isPremium ? (
                    <Check className="text-primary h-5 w-5" aria-label="Incluido" />
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
                  <p className="text-sm font-bold text-foreground">Desbloqueá Evaluo Premium</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> Cobro seguro con Mercado Pago · Cancelá cuando quieras
                  </p>
                </div>
              </div>
              <Button asChild className="h-11 shrink-0 rounded-xl px-5">
                <Link href={PREMIUM_CHECKOUT_HREF}>
                  Suscribirme a Premium
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
                Cancelar suscripción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar Evaluo Premium?</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  Mercado Pago dejará de realizar futuras renovaciones. Conservás Premium hasta
                  finalizar el período que ya pagaste. Esta acción no reembolsa cobros ya
                  realizados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={canceling}>Mantener Premium</AlertDialogCancel>
                <AlertDialogAction
                  disabled={canceling}
                  onClick={() => {
                    void cancelSubscription();
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {canceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmar cancelación
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </section>
  );
}

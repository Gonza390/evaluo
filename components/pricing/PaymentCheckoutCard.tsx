'use client';

import { useEffect, useState } from 'react';
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
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

type PaymentCheckoutCardProps = {
  features: string[];
  source?: string;
  materiaId?: string;
};

export function PaymentCheckoutCard({
  features,
  source = 'pricing_direct',
  materiaId,
}: PaymentCheckoutCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    'loading' | 'active' | 'attention' | 'inactive'
  >('loading');

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/payments/status', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return 'inactive';
        if (!response.ok) return 'inactive';
        const payload = (await response.json()) as { status?: string };
        if (['active', 'approved', 'authorized'].includes(payload.status ?? '')) return 'active';
        if (['past_due', 'paused'].includes(payload.status ?? '')) return 'attention';
        return 'inactive';
      })
      .then((status) => {
        if (!cancelled) setSubscriptionStatus(status);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionStatus('inactive');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    trackMarketingEvent('premium_checkout_clicked', {
      source,
      materia_id: materiaId,
      plan_context: 'premium_founders',
    });
    setLoading(true);
    setError(null);
    const checkoutWindow = window.open(
      '/pricing/resultado?estado=preparando',
      'evaluo-mercadopago'
    );
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, materiaId, planContext: 'premium_founders' }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (response.status === 401) {
        checkoutWindow?.close();
        window.location.assign('/login?mode=login&intent=premium&next=/pricing');
        return;
      }
      if (response.status === 409) {
        checkoutWindow?.close();
        setError(
          payload.error === 'checkout_in_progress'
            ? 'Ya tenés un pago en curso. Completalo desde Mercado Pago o esperá unos minutos.'
            : 'Ya existe una suscripción para esta cuenta. Revisala desde Configuración.'
        );
        setLoading(false);
        return;
      }
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || 'checkout_error');
      const providerUrl = new URL(payload.checkoutUrl);
      const isMercadoPagoUrl =
        providerUrl.protocol === 'https:' &&
        (providerUrl.hostname === 'mercadopago.com' ||
          providerUrl.hostname.endsWith('.mercadopago.com') ||
          providerUrl.hostname === 'mercadopago.com.ar' ||
          providerUrl.hostname.endsWith('.mercadopago.com.ar'));
      if (!isMercadoPagoUrl) throw new Error('invalid_checkout_url');

      setCheckoutUrl(providerUrl.toString());
      setLoading(false);
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.opener = null;
        checkoutWindow.location.replace(providerUrl.toString());
      } else {
        window.location.assign(providerUrl.toString());
      }
    } catch {
      checkoutWindow?.close();
      setError('No pudimos abrir Mercado Pago. Intentá nuevamente en unos minutos.');
      setLoading(false);
    }
  }

  return (
    <article className="border-primary/30 bg-card relative flex flex-col overflow-hidden rounded-3xl border-2 p-6 shadow-xl sm:p-8">
      <div className="bg-primary text-primary-foreground absolute top-5 right-5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
        Recomendado
      </div>
      <div>
        <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          Primeros 100 usuarios
        </span>
        <h2 className="text-foreground mt-4 text-2xl font-bold tracking-tight">Premium</h2>
        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-foreground text-4xl font-bold tracking-tight">
            {currency.format(9990)}
          </span>
          <span className="text-muted-foreground pb-1 text-sm">/mes</span>
          <span className="text-muted-foreground pb-1 text-xs line-through">
            {currency.format(12990)}
          </span>
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Precio fundador durante tus primeros seis meses. Después, continúa al precio mensual
          vigente.
        </p>
      </div>

      {subscriptionStatus === 'active' ? (
        <div className="bg-primary/8 border-primary/15 mt-6 rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-foreground text-sm font-bold">Tu Premium está activo</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Ya tenés acceso a todas las funciones incluidas en este plan.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionStatus === 'attention' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Tu suscripción necesita atención</p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            Revisá el pago pendiente antes de intentar una nueva suscripción.
          </p>
        </div>
      ) : null}

      <ul className="mt-7 flex-1 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6">
            <span className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <Check className="text-primary h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {subscriptionStatus === 'active' ? (
          <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
            <Link href="/simulador">
              <Crown className="mr-2 h-4 w-4" />
              Usar mi Premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : subscriptionStatus === 'attention' ? (
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl text-sm font-semibold"
          >
            <Link href="/configuracion">Revisar mi suscripción</Link>
          </Button>
        ) : (
          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold"
            onClick={startCheckout}
            disabled={loading || subscriptionStatus === 'loading'}
          >
            {loading || subscriptionStatus === 'loading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading
              ? 'Abriendo Mercado Pago…'
              : subscriptionStatus === 'loading'
                ? 'Verificando tu plan…'
                : 'Suscribirme a Premium'}
            {!loading && subscriptionStatus === 'inactive' ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        )}
        {error ? (
          <p role="alert" className="text-destructive mt-3 text-center text-xs">
            {error}
          </p>
        ) : null}
        {checkoutUrl && !error ? (
          <div
            role="status"
            className="border-primary/20 bg-primary/5 mt-3 rounded-xl border px-3 py-3 text-center"
          >
            <p className="text-foreground text-xs font-semibold">Mercado Pago está abierto</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-5">
              Si decidís cancelar, cerrá esa pestaña y vas a seguir acá, sin perder tu lugar.
            </p>
            <button
              type="button"
              onClick={() => window.open(checkoutUrl, 'evaluo-mercadopago')}
              className="text-primary mt-2 text-xs font-semibold underline-offset-4 hover:underline"
            >
              Volver a abrir Mercado Pago
            </button>
          </div>
        ) : null}
        <p className="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5">
          <ShieldCheck className="text-primary h-4 w-4 shrink-0" />
          Pago seguro con Mercado Pago · Renovación mensual
        </p>
      </div>
    </article>
  );
}

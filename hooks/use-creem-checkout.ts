'use client';

import { useEffect, useState } from 'react';

/**
 * Lógica compartida del checkout internacional con Creem (USD).
 * La usan `CreemCheckoutCard` y la página pública /pricing.
 * Solo acepta una respuesta en USD por US$ 9,99, del modo esperado y con URL https de creem.io.
 */
export function useCreemCheckout({ english, mode }: { english: boolean; mode: 'test' | 'live' }) {
  const tr = (es: string, en: string) => (english ? en : es);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/payments/status', { cache: 'no-store' })
      .then(async (r) => (r.ok ? ((await r.json()) as { plan?: string }) : null))
      .then((data) => {
        if (active) setPremium(data?.plan === 'premium');
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/payments/creem/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerCode: 'monthly', locale: english ? 'en' : 'es' }),
      });
      const data = (await r.json()) as {
        checkoutUrl?: string;
        error?: string;
        amountCents?: number;
        currency?: string;
        mode?: string;
      };
      if (r.status === 401) {
        window.location.assign(
          (english
            ? '/en/login?mode=login&intent=premium&next='
            : '/login?mode=login&intent=premium&next=') +
            encodeURIComponent(location.pathname + location.search)
        );
        return;
      }
      if (r.status === 403 && data.error === 'creem_country_unsupported')
        throw new Error(
          tr(
            'Todavía no podemos cobrar Premium en tu país.',
            'We cannot charge for Premium in your country yet.'
          )
        );
      if (r.status === 409)
        throw new Error(
          data.error === 'already_subscribed'
            ? tr(
                'Ya tenés Premium. Revisá tu suscripción desde Configuración.',
                'You already have Premium. Review your subscription in Settings.'
              )
            : tr(
                'Ya tenés una compra en curso. Esperá unos minutos antes de volver a intentar.',
                'You have a purchase in progress. Please try again in a few minutes.'
              )
        );
      if (
        !r.ok ||
        !data.checkoutUrl ||
        data.currency !== 'USD' ||
        data.amountCents !== 999 ||
        data.mode !== mode
      ) {
        throw new Error(
          tr(
            'No se pudo preparar el checkout. Intentá nuevamente.',
            'We could not prepare checkout. Please try again.'
          )
        );
      }
      const target = new URL(data.checkoutUrl);
      if (
        target.protocol !== 'https:' ||
        !(target.hostname === 'creem.io' || target.hostname.endsWith('.creem.io'))
      ) {
        throw new Error(tr('La URL de pago no es segura.', 'The payment URL is not secure.'));
      }
      window.location.assign(target.toString());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : tr('No se pudo iniciar el pago.', 'We could not start payment.')
      );
      setLoading(false);
    }
  }

  return { loading, checking, premium, error, start };
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Loader2, ShieldCheck, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

const FEATURE_EN: Record<string,string> = {
  "Explicaciones paso a paso y práctica personalizada de errores": "Step-by-step explanations and personalized mistake review",
  "Resúmenes por tema y conceptos clave": "Topic summaries and key concepts",
  "Práctica por tema con IA": "AI-powered practice by topic",
  "Flashcards y glosario": "Flashcards and glossary",
  "Más prácticas y simuladores": "More practice sessions and mock exams",
  "Plan de estudio personalizado": "Personalized study plan",
  "Seguimiento de tu progreso": "Progress tracking",
  "Más materiales para estudiar": "More study materials",
  "Prácticas con explicaciones": "Practice with explanations",
  "Ejercicios por tema y repasos": "Topic exercises and revision",
  "Mapas mentales": "Mind maps"
};

type Props = {
  features: string[];
  mode: 'test' | 'live';
  available: boolean;
};

export function CreemCheckoutCard({ features, mode, available }: Props) {
  const english = useOptionalAppLocale() === 'en';
  const tr = (es: string, en: string) => english ? en : es;
  const displayFeatures = english ? features.map(item => FEATURE_EN[item] ?? item) : features;
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetch('/api/payments/status', { cache: 'no-store' })
      .then(async r => r.ok ? (await r.json()) as { plan?: string } : null)
      .then(data => { if (active) setPremium(data?.plan === 'premium'); })
      .catch(() => undefined)
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/payments/creem/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerCode: 'monthly' }),
      });
      const data = await r.json() as {
        checkoutUrl?: string; error?: string; amountCents?: number; currency?: string; mode?: string;
      };
      if (r.status === 401) {
        window.location.assign((english ? '/en/login?mode=login&intent=premium&next=' : '/login?mode=login&intent=premium&next=') + encodeURIComponent(location.pathname + location.search));
        return;
      }
      if (r.status === 409) throw new Error(data.error === 'already_subscribed'
        ? tr("Ya tenés Premium. Revisá tu suscripción desde Configuración.","You already have Premium. Review your subscription in Settings.")
        : tr("Ya tenés una compra en curso. Esperá unos minutos antes de volver a intentar.","You have a purchase in progress. Please try again in a few minutes."));
      if (!r.ok || !data.checkoutUrl || data.currency !== 'USD' || data.amountCents !== 999 || data.mode !== mode) {
        throw new Error(tr("No se pudo preparar el checkout. Intentá nuevamente.","We could not prepare checkout. Please try again."));
      }
      const target = new URL(data.checkoutUrl);
      if (target.protocol !== 'https:' || !(target.hostname === 'creem.io' || target.hostname.endsWith('.creem.io'))) {
        throw new Error(tr("La URL de pago no es segura.","The payment URL is not secure."));
      }
      window.location.assign(target.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("No se pudo iniciar el pago.","We could not start payment."));
      setLoading(false);
    }
  }

  const demo = mode === 'test';
  return (
    <article className="flex h-full flex-col rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-lg shadow-blue-100/50 sm:p-8">
      <div>
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          {demo ? tr("Premium · Prueba sin cobro","Premium · No-charge test") : tr("Premium internacional","International Premium")}
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{tr("Tu estudio, sin fronteras","Your learning, without borders")}</h2>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-slate-950">{english ? 'US$ 9.99' : 'US$ 9,99'}</span>
          <span className="text-sm text-slate-600">{tr("/mes","/month")}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {demo
            ? tr("Simulación en Creem Test Mode: no se cobra dinero ni se activa Premium real.","Creem Test Mode simulation: no real money is charged and actual Premium access is not activated.")
            : tr("Suscripción mensual en USD con renovación automática. Creem muestra los impuestos aplicables y el total antes de confirmar el pago.","Monthly subscription in USD with automatic renewal. Creem shows applicable taxes and the final total before payment.")}
        </p>
      </div>
      <ul className="mt-7 flex-1 space-y-4">
        {displayFeatures.map(f => (
          <li key={f} className="flex gap-3 text-sm leading-6 text-slate-800">
            <Check className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {premium ? (
          <Button asChild className="h-12 w-full rounded-xl">
            <Link href="/dashboard"><Crown className="mr-2 h-4 w-4" />{tr("Usar mi Premium","Use my Premium")}</Link>
          </Button>
        ) : (
          <Button className="h-12 w-full rounded-xl" onClick={() => void start()}
            disabled={checking || loading || !available}>
            {checking || loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? tr("Conectando con Creem…","Connecting to Creem…")
              : checking ? tr("Verificando tu plan…","Checking your plan…")
              : !available ? tr("Próximamente","Coming soon") : demo ? tr("Probar checkout de Creem","Try Creem test checkout") : tr("Elegir Premium en USD","Choose Premium in USD")}
            {!checking && !loading && available ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        )}
        {error ? <p role="alert" className="mt-3 text-center text-xs text-red-600">{error}</p> : null}
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-500">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          {demo ? tr("Modo seguro de prueba · Sin cobros reales","Safe test mode · No real charges") : tr("Pago procesado por Creem · Cancelación de renovaciones disponible","Payment processed by Creem · You can cancel future renewals")}
        </p>
      </div>
    </article>
  );
}

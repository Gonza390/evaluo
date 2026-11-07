'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useCheckoutMarket, type CheckoutMarket } from '@/hooks/use-checkout-market';
import { PREMIUM_MONTHLY_PRICE_ARS } from '@/lib/payments/offers';

type Placement = 'hero' | 'featured' | 'billing' | 'home-plan' | 'home-footer' | 'home-faq';
type Props = { placement: Placement; locale?: 'es' | 'en' };

function localizedMarketText(market: CheckoutMarket, placement: Placement, english: boolean) {
  if (market === 'unknown') {
    if (placement === 'home-footer') return english ? 'Start free · No card required' : 'Empezá gratis · Sin tarjeta';
    if (placement === 'home-plan') return english ? 'See plans available in your country' : 'Conocé los planes para tu país';
    if (placement === 'home-faq') return english
      ? 'Billing options and currency depend on your country. Your price and provider will appear when we can verify your region. You can cancel future renewals.'
      : 'Las formas de pago y la moneda dependen de tu país. Vas a ver el precio y el proveedor cuando podamos confirmar tu región. Podés cancelar futuras renovaciones.';
    return english
      ? 'We will show the price and payment provider once your country is verified.'
      : 'Te mostraremos el precio y el medio de pago cuando podamos verificar tu país.';
  }
  if (market === 'argentina') {
    switch (placement) {
      case 'hero':
        return english ? 'In Argentina, Premium is billed in ARS with Mercado Pago.' : 'En Argentina, Premium se paga en pesos con Mercado Pago.';
      case 'home-plan':
        return english ? 'Monthly or six-month access · ARS' : 'Mensual o por 6 meses · ARS';
      case 'home-footer':
        return english ? 'Start free · No card required · Premium in ARS with Mercado Pago' : 'Empezá gratis · Sin tarjeta · Premium en pesos con Mercado Pago';
      case 'home-faq':
        return english
          ? 'In Argentina, you pay in pesos through Mercado Pago. Monthly billing renews automatically and you can cancel future renewals. The six-month plan is a one-time payment.'
          : 'En Argentina pagás en pesos mediante Mercado Pago. El plan mensual se renueva automáticamente y podés cancelar las próximas renovaciones. El acceso por 6 meses es un pago único.';
      default:
        return english
          ? 'Local plans are billed in Argentine pesos (ARS) through Mercado Pago. Choose monthly or six-month access; the total is shown before you pay.'
          : 'Los planes para Argentina se cobran en pesos (ARS) mediante Mercado Pago. Elegí mensual o por 6 meses; vas a ver el importe antes de pagar.';
    }
  }
  switch (placement) {
    case 'hero':
      return english ? 'International Premium: US$9.99/month with Creem.' : 'Premium internacional: US$ 9,99/mes con Creem.';
    case 'home-plan':
      return english ? 'US$9.99/month · Creem' : 'US$ 9,99/mes · Creem';
    case 'home-footer':
      return english ? 'Start free · No card required · Premium in USD with Creem' : 'Empezá gratis · Sin tarjeta · Premium en USD con Creem';
    case 'home-faq':
      return english
        ? 'Outside Argentina, Premium is US$9.99/month in USD through Creem, with applicable taxes shown before checkout. Monthly billing renews automatically and you can cancel future renewals.'
        : 'Fuera de Argentina, Premium cuesta US$ 9,99 por mes, con pago en USD mediante Creem. Los impuestos aplicables aparecen antes de confirmar. Podés cancelar futuras renovaciones.';
    default:
      return english
        ? 'Outside Argentina, Premium is US$9.99 per month in USD through Creem, with automatic monthly renewal. Applicable taxes and the final total appear before payment; you can cancel future renewals.'
        : 'Fuera de Argentina, Premium cuesta US$ 9,99 por mes en USD mediante Creem, con renovación mensual automática. Los impuestos aplicables y el total final se muestran antes de pagar. Podés cancelar futuras renovaciones.';
  }
}

const legalLinkClass = 'font-semibold text-blue-700 underline';

/** Links legales junto al precio: requisito de compliance del checkout (Creem MoR / Mercado Pago). */
function LegalPolicyLinks({ english }: { english: boolean }) {
  if (english) {
    return <p className="mt-3 text-xs text-slate-600">
      Monthly renewal; cancel before the next charge. Read our <Link href="/en/terms" className={legalLinkClass}>terms</Link>, <Link href="/en/privacy" className={legalLinkClass}>privacy policy</Link> and <Link href="/en/refunds" className={legalLinkClass}>refund policy</Link>.
    </p>;
  }
  return <p className="mt-3 text-xs text-slate-600">
    Renovación automática mensual y cancelación antes del siguiente cobro. Consultá los <Link href="/terminos" className={legalLinkClass}>términos</Link>, la <Link href="/privacidad" className={legalLinkClass}>política de privacidad</Link>, la <Link href="/reembolsos" className={legalLinkClass}>política de reembolsos</Link> y los <Link href="/facturacion" className={legalLinkClass}>términos de facturación</Link>.
  </p>;
}

/**
 * One region = one currency/provider on every surface.
 * Language follows the page; geography follows the Vercel API, independently.
 */
export function RegionalPricingMessage({ placement, locale = 'es' }: Props) {
  const availability = useCheckoutMarket();
  const market = availability?.market ?? 'unknown';
  const english = locale === 'en';
  const content = localizedMarketText(market, placement, english);

  if (placement === 'home-plan') {
    return <p style={{ color: 'var(--t)', fontWeight: 700 }} aria-live="polite">{content}</p>;
  }
  if (placement === 'home-footer') {
    return <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '14px' }} aria-live="polite">{content}</div>;
  }
  if (placement === 'home-faq') {
    return <>{content}</>;
  }
  if (placement === 'hero') {
    return <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600" aria-live="polite">
      <ShieldCheck className="h-4 w-4 text-blue-700" aria-hidden="true" />{content}
    </p>;
  }
  if (placement === 'featured') {
    return <section aria-label={english ? 'Premium billing for your region' : 'Pago Premium para tu país'} className="border-b border-blue-100 bg-blue-50/50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white px-5 py-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
          {market === 'international' ? (english ? 'International Premium' : 'Premium internacional')
            : market === 'argentina' ? (english ? 'Premium in Argentina' : 'Premium en Argentina')
              : (english ? 'Premium by region' : 'Premium según tu país')}
        </p>
        {market === 'argentina' ? (
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            ARS {new Intl.NumberFormat('es-AR').format(PREMIUM_MONTHLY_PRICE_ARS)} <span className="text-base font-medium text-slate-500">{english ? '/ month' : '/ mes'}</span>
          </p>
        ) : null}
        {market === 'international' ? (
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {english ? 'US$ 9.99' : 'US$ 9,99'} <span className="text-base font-medium text-slate-500">{english ? '/ month' : '/ mes'}</span>
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-slate-600" aria-live="polite">{content}</p>
        <LegalPolicyLinks english={english} />
      </div>
    </section>;
  }
  return <p className="mt-2 text-sm leading-7 text-slate-600" aria-live="polite">{content}</p>;
}

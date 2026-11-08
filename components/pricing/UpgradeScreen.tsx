'use client';

import { useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Check, Loader2, Lock } from 'lucide-react';
import { useCheckoutMarket } from '@/hooks/use-checkout-market';
import { useMercadoPagoCheckout } from '@/hooks/use-mercadopago-checkout';
import { useCreemCheckout } from '@/hooks/use-creem-checkout';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { useStickyCta } from '@/components/pricing/PricingPlans';
import type { UpgradeNextExam } from '@/lib/premium-next-exam';
import './pricing-v2.css';

/**
 * "Mejorar mi plan" dentro de la app (/dashboard/premium), ES y EN.
 * Diseño aprobado el 7/11: Evi con libro y birrete, línea del próximo examen
 * (solo si hay fecha), barra Gratis vs Premium, cuatro columnas y el precio
 * por semana con el cobro mensual siempre visible (también en el botón).
 * Precio por semana = precio mensual × 12 ÷ 52; 6 meses = pago único ÷ 26.
 */

type Locale = 'es' | 'en';
type Plan = 'monthly' | 'semester';

type Props = {
  locale: Locale;
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
  nextExam: UpgradeNextExam | null;
};

const ars = (value: number) => `$${new Intl.NumberFormat('es-AR').format(Math.round(value))}`;
export const weeklyFromMonthly = (monthly: number) => (monthly * 12) / 52;
export const weeklyFromSemester = (total: number) => total / 26;

function BookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.8125} viewBox="0 0 64 52" aria-hidden="true">
      <path d="M32 10 C24 4 12 4 4 6 V44 C12 42 24 42 32 48 Z" fill="#eef1fd" stroke="var(--pv-accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 10 C40 4 52 4 60 6 V44 C52 42 40 42 32 48 Z" fill="#ffffff" stroke="var(--pv-accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M11 16h14M11 23h14M11 30h10M39 16h14M39 23h14M39 30h10" stroke="#a9b5f0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" aria-hidden="true">
      <path d="M32 6 L60 18 L32 30 L4 18 Z" fill="var(--pv-accent)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 24 V36 C16 40 48 40 48 36 V24 L32 30 Z" fill="#3c4f97" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 21 V34" stroke="#dbbf8c" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="36" r="3" fill="#dbbf8c" />
    </svg>
  );
}

function examLine(exam: UpgradeNextExam, en: boolean) {
  const when = en
    ? exam.daysLeft === 0 ? 'today' : exam.daysLeft === 1 ? 'tomorrow' : `in ${exam.daysLeft} days`
    : exam.daysLeft === 0 ? 'hoy' : exam.daysLeft === 1 ? 'mañana' : `en ${exam.daysLeft} días`;
  if (en) return exam.subject ? `Your ${exam.subject} exam is ${when}` : `Your next exam is ${when}`;
  return exam.subject ? `Tu examen de ${exam.subject} es ${when}` : `Tu próximo examen es ${when}`;
}

function Header({ en, exam }: { en: boolean; exam: UpgradeNextExam | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-[68px] items-end justify-center gap-1.5 sm:h-[76px]">
        <div className="pv-float-late mb-1.5"><BookIcon size={44} /></div>
        <Image src="/evi/evi-estudiando.svg" alt={en ? 'Evi studying' : 'Evi estudiando'} width={84} height={84} className="pv-float size-[64px] sm:size-[72px]" priority />
        <div className="pv-float-later mb-2"><CapIcon size={44} /></div>
      </div>
      <h1 className="mt-2.5 text-destacado leading-[1.1] font-extrabold tracking-titulo text-slate-950 sm:text-[38px]">
        {en ? 'Get to your exam' : 'Llegá a tu parcial'}
        <span className="block text-[var(--pv-accent)]">{en ? 'knowing you’re ready' : 'sabiendo que estás listo'}</span>
      </h1>
      {exam ? (
        <p className="mt-2.5 inline-flex items-center gap-2 text-cuerpo text-slate-600">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          {examLine(exam, en)}
        </p>
      ) : null}
    </div>
  );
}

function Comparison({ en }: { en: boolean }) {
  const stats: { value: ReactNode; label: string; free: string }[] = [
    { value: '∞', label: en ? 'case studies' : 'casos prácticos', free: '2' },
    { value: '∞', label: en ? 'mock exams' : 'simulacros', free: '1' },
    { value: '∞', label: 'flashcards', free: '25' },
    { value: <Check className="h-7 w-7" strokeWidth={2.5} aria-label={en ? 'Included' : 'Incluido'} />, label: en ? 'mind maps' : 'mapas mentales', free: 'no' },
  ];
  return (
    <>
      <div
        className="mt-6 grid w-full grid-cols-[64px_minmax(0,1fr)_96px] items-center gap-x-3 gap-y-3.5 text-left text-ui"
        aria-label={en ? 'Materials per month: Free 1, Premium up to 90' : 'Apuntes por mes: Gratis 1, Premium hasta 90'}
      >
        <span className="text-slate-500">{en ? 'Free' : 'Gratis'}</span>
        <div className="relative h-2 rounded-full bg-slate-100"><div className="absolute inset-y-0 left-0 w-2 rounded-full bg-slate-400" /></div>
        <span className="text-slate-500">{en ? '1 material/mo' : '1 apunte/mes'}</span>
        <span className="font-semibold text-slate-950">Premium</span>
        <div className="pv-bar-fill h-2 rounded-full bg-[var(--pv-accent)]" />
        <span className="font-semibold text-slate-950">{en ? 'up to 90/mo' : 'hasta 90/mes'}</span>
      </div>
      <div className="mt-6 grid w-full grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`flex flex-col items-center gap-2 px-1.5 py-1 ${index < stats.length - 1 ? 'border-r border-slate-200' : ''}`}>
            <div className="flex h-9 items-center text-destacado leading-none font-semibold text-slate-950 sm:text-destacado">{stat.value}</div>
            <span className="text-center text-chico leading-tight font-medium text-slate-950 sm:text-ui">{stat.label}</span>
            <s aria-label={`${en ? 'Free' : 'Gratis'}: ${stat.free}`} className="mt-1 text-chico text-slate-500">{stat.free}</s>
          </div>
        ))}
      </div>
    </>
  );
}

function PlanOption({
  title, note, weekly, en, selected, onSelect, badge,
}: {
  title: string; note: string; weekly: string; en: boolean; selected: boolean;
  onSelect?: () => void; badge?: string;
}) {
  const body = (
    <>
      {onSelect ? (
        <span className={`h-[18px] w-[18px] shrink-0 rounded-full ${selected ? 'border-[5px] border-[var(--pv-accent)]' : 'border-[1.5px] border-slate-400'}`} aria-hidden="true" />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-cuerpo font-semibold text-slate-950">
          {title}
          {badge ? <span className="rounded-full bg-[var(--pv-tint)] px-2 py-0.5 text-etiqueta font-semibold text-[var(--pv-accent)]">{badge}</span> : null}
        </span>
        <span className="text-chico leading-snug text-slate-600">{note}</span>
      </span>
      <span key={weekly} className="pv-swap flex shrink-0 items-baseline gap-1">
        <span className={`${selected ? 'text-titulo sm:text-destacado' : 'text-titulo sm:text-titulo'} font-extrabold tracking-titulo text-slate-950`}>{weekly}</span>
        <span className="text-ui text-slate-600">{en ? '/week' : '/semana'}</span>
      </span>
    </>
  );
  const className = `flex w-full items-center gap-3 rounded-[18px] border-[1.5px] px-[18px] py-4 text-left sm:px-5 ${selected ? 'border-[var(--pv-accent)] bg-[var(--pv-card)]' : 'border-slate-200 bg-white'}`;
  return onSelect ? (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={className}>{body}</button>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Legal({ en, children }: { en: boolean; children?: ReactNode }) {
  const links = en
    ? [['/en/terms', 'Terms'], ['/en/privacy', 'Privacy'], ['/en/refunds', 'Refunds'], ['/en/billing', 'Billing']]
    : [['/terminos', 'Términos'], ['/privacidad', 'Privacidad'], ['/reembolsos', 'Reembolsos'], ['/facturacion', 'Facturación']];
  return (
    <p className="mt-2 text-center text-etiqueta leading-relaxed text-slate-500">
      {children ? <>{children} </> : null}
      {en ? 'By purchasing you accept the ' : 'Al comprar aceptás los '}
      {links.map(([href, label], index) => (
        <span key={href}>
          {index > 0 ? ' · ' : ''}
          <Link href={href} className="underline underline-offset-2 hover:text-slate-700">{label}</Link>
        </span>
      ))}
      .
    </p>
  );
}

function PaySecure({ provider, en }: { provider: string; en: boolean }) {
  return (
    <span className="mt-3 inline-flex items-center justify-center gap-1.5 text-chico text-slate-500">
      <Lock className="h-3 w-3" aria-hidden="true" />
      {en ? `Secure payment with ${provider}` : `Pago seguro con ${provider}`}
    </span>
  );
}

const ctaClass =
  'pv-btn inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--pv-accent)] px-5 text-cuerpo font-semibold text-white shadow-[0_10px_24px_rgba(74,99,231,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pv-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

function StickyBar({ visible, price, en, children }: { visible: boolean; price: string; en: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pv-sticky fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,27,61,0.08)] backdrop-blur sm:hidden ${visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-subtitulo font-semibold text-slate-950">
          {price}<span className="text-ui font-medium text-slate-600">{en ? '/week' : '/semana'}</span>
        </p>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}

function ArgentinaOffer({ en, source, materiaId, parcial, returnTo }: Omit<Props, 'nextExam' | 'locale'> & { en: boolean }) {
  const [plan, setPlan] = useState<Plan>('monthly');
  const ctaRef = useRef<HTMLDivElement>(null);
  const checkout = useMercadoPagoCheckout({ offerCode: plan, source, materiaId, parcial, returnTo, english: en });
  const { offer, subscriptionStatus, loading, error, checkoutUrl, semesterSoldOut, canStart } = checkout;
  const actionable = subscriptionStatus !== 'active' && subscriptionStatus !== 'attention';
  const stickyVisible = useStickyCta(ctaRef, actionable && Boolean(offer));

  const choose = (next: Plan) => {
    if (next === plan) return;
    setPlan(next);
    trackMarketingEvent('pricing_plan_toggled', { plan: next, market: 'argentina', source });
  };
  const pay = (position: 'card' | 'sticky_bar') => {
    trackMarketingEvent('pricing_cta_clicked', { market: 'argentina', plan, position, source });
    void checkout.startCheckout();
  };

  const monthly = offer?.monthlyPriceArs;
  const semester = offer?.semesterPriceArs;
  const weeklyMonthly = monthly ? ars(weeklyFromMonthly(monthly)) : '';
  const weeklySemester = semester ? ars(weeklyFromSemester(semester)) : '';
  const selectedWeekly = plan === 'semester' ? weeklySemester : weeklyMonthly;
  const price = plan === 'semester'
    ? (semester ? (en ? `${ars(semester)} one payment` : `${ars(semester)} en un pago`) : '')
    : (monthly ? (en ? `${ars(monthly)} a month` : `${ars(monthly)} por mes`) : '');
  const ctaLabel = loading
    ? (en ? 'Opening Mercado Pago…' : 'Abriendo Mercado Pago…')
    : subscriptionStatus === 'loading' || !offer
      ? (en ? 'Checking your plan…' : 'Verificando tu plan…')
      : subscriptionStatus === 'unavailable'
        ? (en ? 'We could not check your plan' : 'No pudimos verificar tu plan')
        : plan === 'semester' && semesterSoldOut
          ? (en ? 'Sold out' : 'Cupos agotados')
          : `${en ? 'Continue with Premium' : 'Seguir con Premium'} · ${price}`;

  return (
    <>
      <div role="radiogroup" aria-label={en ? 'Choose your plan' : 'Elegí tu plan'} className="mt-6 flex w-full flex-col gap-2.5">
        {!offer ? (
          <div className="h-[150px] w-full animate-pulse rounded-[18px] bg-slate-100" aria-label={en ? 'Loading prices' : 'Consultando precios'} />
        ) : (
          <>
            <PlanOption
              en={en} selected={plan === 'monthly'} onSelect={() => choose('monthly')}
              title={en ? 'Monthly' : 'Mensual'} weekly={weeklyMonthly}
              note={en ? `${ars(offer.monthlyPriceArs)} a month · cancel anytime` : `${ars(offer.monthlyPriceArs)} por mes · cancelás cuando quieras`}
            />
            <PlanOption
              en={en} selected={plan === 'semester'} onSelect={() => choose('semester')}
              title={en ? '6 months' : '6 meses'} weekly={weeklySemester}
              badge={offer.semesterSavingsPercent ? `−${offer.semesterSavingsPercent}%` : undefined}
              note={en
                ? `${ars(offer.semesterPriceArs)} in one payment · no auto-renewal`
                : `${ars(offer.semesterPriceArs)} en un solo pago · cubre el cuatrimestre · sin renovación`}
            />
            {plan === 'semester' && offer.semesterRemaining != null ? (
              <p className="text-chico font-semibold text-[var(--pv-accent)]">
                {offer.semesterRemaining > 0
                  ? (en ? `${offer.semesterRemaining} of ${offer.semesterLimit} spots left` : `Quedan ${offer.semesterRemaining} de ${offer.semesterLimit} cupos`)
                  : (en ? `All ${offer.semesterLimit} spots are taken` : `Los ${offer.semesterLimit} cupos están ocupados`)}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div ref={ctaRef} className="mt-3.5 flex w-full flex-col items-center">
        {subscriptionStatus === 'active' ? (
          <Link href={returnTo ?? '/dashboard'} className={ctaClass}>{en ? 'Use my Premium' : 'Usar mi Premium'}</Link>
        ) : subscriptionStatus === 'attention' ? (
          <>
            <Link href="/configuracion" className={ctaClass}>{en ? 'Review my subscription' : 'Revisar mi suscripción'}</Link>
            <p className="mt-2 text-center text-chico text-amber-700">
              {en ? 'You have a pending payment: review it before buying again.' : 'Tenés un pago pendiente: revisalo antes de una nueva compra.'}
            </p>
          </>
        ) : (
          <button type="button" className={ctaClass} disabled={!canStart} onClick={() => pay('card')}>
            {loading || subscriptionStatus === 'loading' || !offer ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {ctaLabel}
          </button>
        )}
        {error ? <p role="alert" className="mt-2 text-center text-chico text-red-600">{error}</p> : null}
        {checkoutUrl && !error ? (
          <p role="status" className="mt-2 text-center text-chico text-slate-600">
            {en ? 'Mercado Pago is open. ' : 'Mercado Pago está abierto. '}
            <button type="button" className="font-semibold text-[var(--pv-accent)] underline underline-offset-2" onClick={() => window.open(checkoutUrl, 'evaluo-mercadopago')}>
              {en ? 'Open it again' : 'Volver a abrirlo'}
            </button>
          </p>
        ) : null}
        <PaySecure provider="Mercado Pago" en={en} />
        <Legal en={en}>
          {plan === 'semester'
            ? (en ? 'One payment for 6 months, no automatic renewal.' : 'Pago único por 6 meses, sin renovación automática.')
            : (en ? 'Renews monthly; cancel before the next charge.' : 'Renovación mensual automática; cancelás antes del próximo cobro.')}
        </Legal>
      </div>

      <StickyBar visible={stickyVisible} price={selectedWeekly} en={en}>
        <button type="button" tabIndex={stickyVisible ? 0 : -1} disabled={!canStart} onClick={() => pay('sticky_bar')}
          className="pv-btn inline-flex h-12 items-center justify-center rounded-full bg-[var(--pv-accent)] px-5 text-cuerpo font-semibold text-white disabled:opacity-60">
          {en ? 'Continue with Premium' : 'Seguir con Premium'}
        </button>
      </StickyBar>
    </>
  );
}

function InternationalOffer({ en, source, returnTo, creemAvailable }: { en: boolean; source: string; returnTo?: string; creemAvailable: boolean }) {
  const ctaRef = useRef<HTMLDivElement>(null);
  const { loading, checking, premium, error, start } = useCreemCheckout({ english: en, mode: 'live' });
  const [notified, setNotified] = useState(false);
  const stickyVisible = useStickyCta(ctaRef, creemAvailable && !premium && !notified);
  const weekly = en ? 'US$2.31' : 'US$ 2,31';
  const monthly = en ? 'US$9.99 a month' : 'US$ 9,99 por mes';

  const pay = (position: 'card' | 'sticky_bar') => {
    trackMarketingEvent('pricing_cta_clicked', { market: 'international', plan: 'monthly', position, source });
    void start();
  };
  const notify = async () => {
    trackMarketingEvent('pricing_notify_clicked', { market: 'international', source });
    setNotified(true);
  };

  return (
    <>
      <div className="mt-6 w-full">
        <PlanOption en={en} selected title={en ? 'Monthly' : 'Mensual'} weekly={weekly}
          note={en ? `${monthly} · cancel anytime` : `${monthly} · cancelás cuando quieras`} />
      </div>
      <div ref={ctaRef} className="mt-3.5 flex w-full flex-col items-center">
        {premium ? (
          <Link href={returnTo ?? '/dashboard'} className={ctaClass}>{en ? 'Use my Premium' : 'Usar mi Premium'}</Link>
        ) : !creemAvailable ? (
          notified ? (
            <p role="status" className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-cuerpo text-slate-700">
              {en ? 'Got it. We will email you when payments are available in your country.' : 'Anotado. Te avisamos por mail cuando habilitemos los pagos en tu país.'}
            </p>
          ) : (
            <button type="button" className={ctaClass} onClick={() => void notify()}>
              {en ? 'Notify me when it’s available' : 'Avisame cuando esté disponible'}
            </button>
          )
        ) : (
          <button type="button" className={ctaClass} disabled={checking || loading} onClick={() => pay('card')}>
            {checking || loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {loading ? (en ? 'Connecting to Creem…' : 'Conectando con Creem…')
              : checking ? (en ? 'Checking your plan…' : 'Verificando tu plan…')
              : `${en ? 'Continue with Premium' : 'Seguir con Premium'} · ${monthly}`}
          </button>
        )}
        {error ? <p role="alert" className="mt-2 text-center text-chico text-red-600">{error}</p> : null}
        {creemAvailable ? <PaySecure provider="Creem" en={en} /> : (
          <span className="mt-3 text-center text-chico text-slate-500">
            {en ? 'We are enabling payments in your country.' : 'Estamos habilitando los pagos en tu país.'}
          </span>
        )}
        <Legal en={en}>{en ? 'Renews monthly; cancel before the next charge.' : 'Renovación mensual automática; cancelás antes del próximo cobro.'}</Legal>
      </div>
      {creemAvailable ? (
        <StickyBar visible={stickyVisible} price={weekly} en={en}>
          <button type="button" tabIndex={stickyVisible ? 0 : -1} disabled={checking || loading} onClick={() => pay('sticky_bar')}
            className="pv-btn inline-flex h-12 items-center justify-center rounded-full bg-[var(--pv-accent)] px-5 text-cuerpo font-semibold text-white disabled:opacity-60">
            {en ? 'Continue with Premium' : 'Seguir con Premium'}
          </button>
        </StickyBar>
      ) : null}
    </>
  );
}

export function UpgradeScreen(props: Props) {
  const en = props.locale === 'en';
  const market = useCheckoutMarket();
  const back = props.returnTo ?? '/dashboard';
  return (
    <div className="pricing-v2 relative w-full min-w-0 bg-white text-slate-950">
      {/* Arriba a la izquierda, fuera del flujo: no empuja el contenido hacia abajo. */}
      <Link href={back} className="absolute top-2 left-3 z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-cuerpo font-medium text-slate-600 hover:text-slate-900 sm:top-3 sm:left-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {en ? 'Back' : 'Volver'}
      </Link>
      <div className="mx-auto flex max-w-[420px] flex-col items-center px-5 pt-2 pb-28 sm:px-0 sm:pt-3 sm:pb-10">
        <Header en={en} exam={props.nextExam} />
        <Comparison en={en} />
        {market === null ? (
          <div className="mt-6 h-[180px] w-full animate-pulse rounded-[18px] bg-slate-100" aria-busy="true">
            <span className="sr-only">{en ? 'Checking prices for your country…' : 'Consultando precios para tu país…'}</span>
          </div>
        ) : market.market === 'argentina' ? (
          <ArgentinaOffer en={en} source={props.source} materiaId={props.materiaId} parcial={props.parcial} returnTo={props.returnTo} />
        ) : (
          <InternationalOffer en={en} source={props.source} returnTo={props.returnTo} creemAvailable={market.creemAvailable} />
        )}

      </div>
    </div>
  );
}

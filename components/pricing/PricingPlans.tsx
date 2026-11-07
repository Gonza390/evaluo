'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { useCheckoutMarket } from '@/hooks/use-checkout-market';
import { useMercadoPagoCheckout } from '@/hooks/use-mercadopago-checkout';
import { useCreemCheckout } from '@/hooks/use-creem-checkout';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { ManualReferralCode } from '@/components/pricing/ManualReferralCode';

/**
 * Planes de /pricing (rediseño nov-2026).
 * - Argentina: ARS con Mercado Pago, selector Mensual (por defecto) / 6 meses.
 * - Internacional: US$ 9,99 por mes con Creem.
 * - País sin confirmar: no se muestra ningún precio pago (fail-closed).
 * Los textos legales junto al precio son requisito de Mercado Pago y Creem (Merchant of Record).
 */

type Plan = 'monthly' | 'semester';
type Market = 'argentina' | 'international';

type PricingPlansProps = {
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
};

const ars = (value: number) => `$${new Intl.NumberFormat('es-AR').format(value)}`;

const PREMIUM_FEATURES = [
  'Practicá solo lo que te sale mal, con preguntas nuevas',
  'Simulacros y práctica sin cupo',
  'Todas tus materias: hasta 3 apuntes nuevos por día',
  'Más explicaciones con IA y mapas mentales',
];

const FREE_FEATURES = [
  '1 apunte para probar',
  'Resumen, flashcards y práctica de prueba',
  'Tu nivel de preparación por tema',
];

const ARGENTINA_UNIVERSITIES = [
  {
    src: '/universidades/uba.svg',
    alt: 'Universidad de Buenos Aires (UBA)',
    width: 150,
    height: 150,
  },
  {
    src: '/universidades/utn.png',
    alt: 'Universidad Tecnológica Nacional (UTN)',
    width: 1348,
    height: 611,
  },
  {
    src: '/universidades/siglo-21-repositorio.png',
    alt: 'Universidad Siglo 21',
    width: 825,
    height: 102,
  },
  {
    src: '/universidades/untref.svg',
    alt: 'Universidad Nacional de Tres de Febrero (UNTREF)',
    width: 550,
    height: 260,
  },
  {
    src: '/universidades/ucc.svg',
    alt: 'Universidad Católica de Córdoba',
    width: 300,
    height: 150,
  },
];

const INTERNATIONAL_UNIVERSITIES = [
  {
    src: '/universidades/columbia-circular.png',
    alt: 'Universidad Columbia del Paraguay',
    width: 120,
    height: 120,
  },
  {
    src: '/universidades/unal.svg',
    alt: 'Universidad Nacional de Colombia (UNAL)',
    width: 240,
    height: 120,
  },
];

function CheckItem({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <li
      className={`flex gap-2.5 text-[15px] leading-6 ${muted ? 'text-slate-600' : 'text-slate-800'}`}
    >
      <Check
        className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${muted ? 'text-slate-400' : 'text-[var(--pv-accent)]'}`}
        strokeWidth={2.4}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function LegalLine({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-xs leading-5 text-slate-500">
      {children}{' '}
      <Link href="/terminos" className="underline underline-offset-2 hover:text-slate-700">
        Términos
      </Link>
      {' · '}
      <Link href="/privacidad" className="underline underline-offset-2 hover:text-slate-700">
        Privacidad
      </Link>
      {' · '}
      <Link href="/reembolsos" className="underline underline-offset-2 hover:text-slate-700">
        Reembolsos
      </Link>
      {' · '}
      <Link href="/facturacion" className="underline underline-offset-2 hover:text-slate-700">
        Facturación
      </Link>
    </p>
  );
}

const primaryButton =
  'pv-btn inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--pv-accent)] px-5 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pv-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const notifyButton =
  'pv-btn inline-flex h-[54px] w-full items-center justify-center rounded-[14px] bg-slate-900 px-5 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2';
const secondaryButton =
  'pv-btn inline-flex h-[54px] w-full items-center justify-center rounded-[14px] border border-slate-300 bg-white px-5 text-[15px] font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pv-accent)] focus-visible:ring-offset-2';

function PremiumShell({ children }: { children: ReactNode }) {
  return (
    <div className="pv-premium-shadow flex w-full max-w-[460px] min-w-0 flex-col gap-[22px] rounded-[22px] border-[1.5px] border-[var(--pv-border)] bg-[var(--pv-card)] p-6 text-slate-950 sm:rounded-[24px] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Premium</h2>
        <span className="rounded-full bg-[var(--pv-tint)] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[var(--pv-accent)]">
          Recomendado
        </span>
      </div>
      {children}
    </div>
  );
}

function FreeCard({ market }: { market: Market | 'unknown' }) {
  return (
    <div className="flex w-full max-w-[460px] min-w-0 flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-6 sm:max-w-[340px] sm:gap-[22px] sm:rounded-[24px] sm:p-8">
      <div className="flex items-baseline justify-between sm:flex-col sm:gap-[22px]">
        <h2 className="text-lg font-extrabold sm:text-xl">Gratis</h2>
        <p className="text-[28px] font-extrabold tracking-tight sm:text-5xl">
          {market === 'international' ? 'US$ 0' : '$0'}
        </p>
      </div>
      <ul className="flex flex-col gap-2.5 sm:gap-3">
        {FREE_FEATURES.map((feature) => (
          <CheckItem key={feature} muted>
            {feature}
          </CheckItem>
        ))}
      </ul>
      <Link href="/estudiar-pdf-con-ia" className={`${secondaryButton} mt-auto`}>
        Probar gratis
      </Link>
    </div>
  );
}

function PlanToggle({ plan, onChange }: { plan: Plan; onChange: (plan: Plan) => void }) {
  const semester = plan === 'semester';
  const tab =
    'relative z-10 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors duration-200';
  return (
    <div
      role="radiogroup"
      aria-label="Período de pago"
      className="relative mx-auto grid w-full max-w-[340px] grid-cols-2 rounded-full bg-slate-100 p-1"
    >
      <span
        aria-hidden="true"
        className="pv-pill absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-[0_1px_4px_rgba(15,27,61,0.14)]"
        style={{ transform: `translateX(${semester ? '100%' : '0%'})` }}
      />
      <button
        type="button"
        role="radio"
        aria-checked={!semester}
        onClick={() => onChange('monthly')}
        className={`${tab} ${semester ? 'text-slate-600' : 'text-slate-950'}`}
      >
        Mensual
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={semester}
        onClick={() => onChange('semester')}
        className={`${tab} ${semester ? 'text-slate-950' : 'text-slate-600'}`}
      >
        6 meses <span className="text-xs font-bold text-[var(--pv-accent)]">−25%</span>
      </button>
    </div>
  );
}

/** Barra fija en teléfono: aparece solo cuando el botón de la tarjeta quedó arriba, fuera de la pantalla. */
function useStickyCta(target: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = target.current;
    if (!enabled || !node) {
      setVisible(false);
      return;
    }
    // Se mide en cada scroll (no con IntersectionObserver): un scroll rápido puede saltar
    // de "debajo" a "arriba" de la pantalla sin cruzar el umbral y la barra no aparecería.
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(node.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [target, enabled]);
  return visible;
}

function StickyBar({
  visible,
  price,
  note,
  action,
}: {
  visible: boolean;
  price: ReactNode;
  note: string;
  action: ReactNode;
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`pv-sticky fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,27,61,0.08)] backdrop-blur sm:hidden ${visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold text-slate-950">{price}</p>
          <p className="truncate text-xs text-slate-600">{note}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

function ArgentinaPlans(props: PricingPlansProps) {
  const [plan, setPlan] = useState<Plan>('monthly');
  const ctaRef = useRef<HTMLDivElement>(null);
  const checkout = useMercadoPagoCheckout({
    offerCode: plan,
    source: props.source,
    materiaId: props.materiaId,
    parcial: props.parcial,
    returnTo: props.returnTo,
    english: false,
  });
  const { offer, subscriptionStatus, loading, error, checkoutUrl, semesterSoldOut, canStart } =
    checkout;
  const actionable = subscriptionStatus !== 'active' && subscriptionStatus !== 'attention';
  const stickyVisible = useStickyCta(ctaRef, actionable && Boolean(offer));

  function choose(next: Plan) {
    if (next === plan) return;
    setPlan(next);
    trackMarketingEvent('pricing_plan_toggled', { plan: next, market: 'argentina' });
  }

  function pay(position: 'card' | 'sticky_bar') {
    trackMarketingEvent('pricing_cta_clicked', {
      market: 'argentina',
      plan,
      position,
      source: props.source,
    });
    void checkout.startCheckout();
  }

  const label = loading
    ? 'Abriendo Mercado Pago…'
    : subscriptionStatus === 'loading' || !offer
      ? 'Verificando tu plan…'
      : subscriptionStatus === 'unavailable'
        ? 'No pudimos verificar tu plan'
        : semesterSoldOut
          ? 'Cupos agotados'
          : 'Pasar a Premium';

  const monthlyPrice = offer?.monthlyPriceArs;
  const perMonth = plan === 'semester' ? offer?.semesterEquivalentMonthlyArs : monthlyPrice;

  return (
    <>
      <PlanToggle plan={plan} onChange={choose} />
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center sm:gap-6">
        <PremiumShell>
          <div className="min-h-[86px]" aria-live="polite">
            {!offer ? (
              <div
                className="h-[86px] animate-pulse rounded-xl bg-white/70"
                aria-label="Consultando precio"
              />
            ) : (
              <div key={plan} className="pv-swap">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  {plan === 'semester' && monthlyPrice ? (
                    <span className="text-lg font-semibold text-slate-500 line-through sm:text-xl">
                      {ars(monthlyPrice)}
                    </span>
                  ) : null}
                  <span className="text-[42px] leading-none font-extrabold tracking-[-1.4px] sm:text-5xl">
                    {perMonth ? ars(perMonth) : ''}
                  </span>
                  <span className="text-[15px] text-slate-600 sm:text-base">/mes</span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm">
                  {plan === 'semester'
                    ? `${ars(offer.semesterPriceArs)} en un solo pago · cubre el cuatrimestre · sin renovación`
                    : 'Se renueva cada mes · cancelás cuando quieras'}
                </p>
                {plan === 'semester' && offer.semesterRemaining != null ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--pv-accent)]">
                    {offer.semesterRemaining > 0
                      ? `Quedan ${offer.semesterRemaining} de ${offer.semesterLimit} cupos`
                      : `Los ${offer.semesterLimit} cupos están ocupados`}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <CheckItem key={feature}>{feature}</CheckItem>
            ))}
          </ul>

          <div ref={ctaRef} className="mt-auto flex flex-col gap-2.5">
            {subscriptionStatus === 'active' ? (
              <Link href="/dashboard" className={primaryButton}>
                Usar mi Premium
              </Link>
            ) : subscriptionStatus === 'attention' ? (
              <>
                <Link href="/configuracion" className={secondaryButton}>
                  Revisar mi suscripción
                </Link>
                <p className="text-center text-xs text-amber-700">
                  Tenés un pago pendiente: revisalo antes de una nueva compra.
                </p>
              </>
            ) : (
              <button
                type="button"
                className={primaryButton}
                disabled={!canStart}
                onClick={() => pay('card')}
              >
                {loading || subscriptionStatus === 'loading' || !offer ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {label}
              </button>
            )}
            {error ? (
              <p role="alert" className="text-center text-xs text-red-600">
                {error}
              </p>
            ) : null}
            {checkoutUrl && !error ? (
              <p role="status" className="text-center text-xs text-slate-600">
                Mercado Pago está abierto.{' '}
                <button
                  type="button"
                  className="font-semibold text-[var(--pv-accent)] underline underline-offset-2"
                  onClick={() => window.open(checkoutUrl, 'evaluo-mercadopago')}
                >
                  Volver a abrirlo
                </button>
              </p>
            ) : null}
            <p className="text-center text-[13px] text-slate-600">Pago seguro con Mercado Pago</p>
            <LegalLine>
              {plan === 'semester'
                ? 'Pago único por 6 meses, sin renovación automática.'
                : 'Renovación mensual automática; cancelás antes del próximo cobro.'}
            </LegalLine>
          </div>
        </PremiumShell>
        <FreeCard market="argentina" />
      </div>

      <details className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer list-none text-center text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          ¿Tenés un código de descuento?
        </summary>
        <div className="mt-4">
          <ManualReferralCode offerCode={plan} variant="compact" />
        </div>
      </details>

      <StickyBar
        visible={stickyVisible}
        price={
          <span key={plan} className="pv-swap inline-block">
            {perMonth ? ars(perMonth) : ''}
            <span className="text-[13px] font-medium text-slate-600">/mes</span>
          </span>
        }
        note={
          plan === 'semester' && offer
            ? `6 meses · ${ars(offer.semesterPriceArs)} en un pago`
            : 'Mensual · cancelás cuando quieras'
        }
        action={
          <button
            type="button"
            tabIndex={stickyVisible ? 0 : -1}
            className="pv-btn inline-flex h-12 items-center justify-center rounded-[14px] bg-[var(--pv-accent)] px-5 text-[15px] font-bold text-white disabled:opacity-60"
            disabled={!canStart}
            onClick={() => pay('sticky_bar')}
          >
            Pasar a Premium
          </button>
        }
      />
    </>
  );
}

function InternationalPlans({
  creemAvailable,
  source,
}: {
  creemAvailable: boolean;
  source: string;
}) {
  const ctaRef = useRef<HTMLDivElement>(null);
  const { loading, checking, premium, error, start } = useCreemCheckout({
    english: false,
    mode: 'live',
  });
  const [notified, setNotified] = useState(false);
  const stickyVisible = useStickyCta(ctaRef, !premium && !notified);

  function pay(position: 'card' | 'sticky_bar') {
    trackMarketingEvent('pricing_cta_clicked', {
      market: 'international',
      plan: 'monthly',
      position,
      source,
    });
    void start();
  }

  async function notify() {
    trackMarketingEvent('pricing_notify_clicked', { market: 'international', source });
    const response = await fetch('/api/payments/status', { cache: 'no-store' }).catch(() => null);
    if (response?.status === 401) {
      window.location.assign(
        `/login?mode=signup&intent=premium&next=${encodeURIComponent('/pricing')}`
      );
      return;
    }
    setNotified(true);
  }

  const action = (position: 'card' | 'sticky_bar') =>
    creemAvailable ? (
      <button
        type="button"
        className={
          position === 'card'
            ? primaryButton
            : 'pv-btn inline-flex h-12 items-center justify-center rounded-[14px] bg-[var(--pv-accent)] px-5 text-[15px] font-bold text-white disabled:opacity-60'
        }
        disabled={checking || loading}
        tabIndex={position === 'sticky_bar' && !stickyVisible ? -1 : 0}
        onClick={() => pay(position)}
      >
        {position === 'card' && (checking || loading) ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        {position === 'card' && loading
          ? 'Conectando con Creem…'
          : position === 'card' && checking
            ? 'Verificando tu plan…'
            : 'Pasar a Premium'}
      </button>
    ) : (
      <button
        type="button"
        className={
          position === 'card'
            ? notifyButton
            : 'pv-btn inline-flex h-12 items-center justify-center rounded-[14px] bg-slate-900 px-4 text-sm font-bold text-white'
        }
        tabIndex={position === 'sticky_bar' && !stickyVisible ? -1 : 0}
        onClick={() => void notify()}
      >
        {position === 'card' ? 'Avisame cuando esté disponible' : 'Avisame'}
      </button>
    );

  return (
    <>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center sm:gap-6">
        <PremiumShell>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[42px] leading-none font-extrabold tracking-[-1.4px] sm:text-5xl">
                US$ 9,99
              </span>
              <span className="text-[15px] text-slate-600 sm:text-base">/mes</span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm">
              Menos de US$ 2,50 por semana · cancelás cuando quieras
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <CheckItem key={feature}>{feature}</CheckItem>
            ))}
          </ul>

          <div ref={ctaRef} className="mt-auto flex flex-col gap-2.5">
            {premium ? (
              <Link href="/dashboard" className={primaryButton}>
                Usar mi Premium
              </Link>
            ) : notified ? (
              <p
                role="status"
                className="rounded-[14px] bg-white px-4 py-3 text-center text-sm text-slate-700"
              >
                Anotado. Te avisamos por mail cuando habilitemos los pagos en tu país.
              </p>
            ) : (
              action('card')
            )}
            {error ? (
              <p role="alert" className="text-center text-xs text-red-600">
                {error}
              </p>
            ) : null}
            {creemAvailable ? (
              <p className="text-center text-[13px] text-slate-600">Pago seguro con Creem</p>
            ) : !notified && !premium ? (
              <p className="text-center text-[13px] text-slate-600">
                Estamos habilitando los pagos en tu país.
              </p>
            ) : null}
            <LegalLine>Renovación mensual automática; cancelás antes del próximo cobro.</LegalLine>
          </div>
        </PremiumShell>
        <FreeCard market="international" />
      </div>

      <StickyBar
        visible={stickyVisible}
        price={
          <>
            US$ 9,99<span className="text-[13px] font-medium text-slate-600">/mes</span>
          </>
        }
        note="Cancelás cuando quieras"
        action={action('sticky_bar')}
      />
    </>
  );
}

function Universities({ market }: { market: Market | 'unknown' }) {
  const logos =
    market === 'argentina'
      ? ARGENTINA_UNIVERSITIES
      : market === 'international'
        ? INTERNATIONAL_UNIVERSITIES
        : [...ARGENTINA_UNIVERSITIES, ...INTERNATIONAL_UNIVERSITIES];
  return (
    <section
      className="mx-auto mt-12 max-w-[920px] text-center sm:mt-14"
      aria-label="Universidades"
    >
      <p className="text-[13px] font-semibold text-slate-600">
        Estudiantes de estas universidades ya usan Evaluo
      </p>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
        {logos.map((logo) => (
          <li key={logo.src}>
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              unoptimized
              className="h-8 w-auto max-w-[140px] object-contain opacity-60 grayscale"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq({ market }: { market: Market }) {
  const items =
    market === 'argentina'
      ? [
          [
            '¿Puedo cancelar?',
            'El plan mensual lo cancelás cuando quieras y no se vuelve a cobrar. El de 6 meses es un pago único: no se renueva solo.',
          ],
          [
            '¿Qué pasa con mis apuntes si vuelvo a Gratis?',
            'Nada se borra. Tus materiales y resultados quedan guardados; solo vuelven los cupos del plan gratis.',
          ],
          ['¿Cómo pago?', 'En pesos, con Mercado Pago.'],
        ]
      : [
          [
            '¿Puedo cancelar?',
            'Sí. Se renueva cada mes y cancelás la próxima renovación cuando quieras, antes del siguiente cobro.',
          ],
          [
            '¿Qué pasa con mis apuntes si vuelvo a Gratis?',
            'Nada se borra. Tus materiales y resultados quedan guardados; solo vuelven los cupos del plan gratis.',
          ],
          [
            '¿Cómo pago y cuánto termino pagando?',
            'En dólares, con tarjeta, a través de Creem. Si tu país aplica impuestos, ves el total final antes de confirmar.',
          ],
        ];
  return (
    <section className="mx-auto mt-16 max-w-[680px] sm:mt-20" aria-labelledby="pricing-faq">
      <h2
        id="pricing-faq"
        className="mb-1.5 text-[22px] font-extrabold tracking-tight sm:mb-3 sm:text-center sm:text-[26px]"
      >
        Preguntas frecuentes
      </h2>
      {items.map(([question, answer]) => (
        <details key={question} className="pv-faq border-b border-slate-200 px-1 py-[18px] sm:py-5">
          <summary className="cursor-pointer list-none text-[15px] font-bold sm:text-base [&::-webkit-details-marker]:hidden">
            {question}
          </summary>
          <p className="mt-2.5 text-sm leading-6 text-slate-600 sm:text-[15px]">{answer}</p>
        </details>
      ))}
    </section>
  );
}

export function PricingPlans(props: PricingPlansProps) {
  const market = useCheckoutMarket();

  if (market === null) {
    return (
      <div
        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6"
        aria-busy="true"
      >
        <div className="h-[520px] w-full max-w-[460px] animate-pulse rounded-[24px] bg-slate-100" />
        <div className="h-[420px] w-full max-w-[460px] animate-pulse rounded-[24px] bg-slate-50 sm:max-w-[340px]" />
        <span className="sr-only">Consultando precios para tu país…</span>
      </div>
    );
  }

  if (market.market === 'unknown') {
    return (
      <>
        <div
          role="alert"
          className="mx-auto max-w-[680px] rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm leading-6 text-amber-900"
        >
          No pudimos confirmar tu país. Por seguridad no se mostrará una opción de pago hasta que
          podamos verificar tu región.
        </div>
        <div className="mt-6 flex justify-center">
          <FreeCard market="unknown" />
        </div>
        <Universities market="unknown" />
      </>
    );
  }

  return (
    <>
      {market.market === 'argentina' ? (
        <ArgentinaPlans {...props} />
      ) : (
        <InternationalPlans creemAvailable={market.creemAvailable} source={props.source} />
      )}
      <Universities market={market.market} />
      <Faq market={market.market} />
    </>
  );
}

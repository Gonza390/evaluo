'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, Flag, ListChecks, LockKeyhole, Loader2 } from 'lucide-react';
import { ManualReferralCode } from '@/components/pricing/ManualReferralCode';
import { CreemCheckoutCard } from '@/components/pricing/CreemCheckoutCard';
import { premiumPurchaseDisplayState } from '@/lib/payments/status';
import { PREMIUM_MONTHLY_PRICE_ARS, PREMIUM_SEMESTER_PRICE_ARS } from '@/lib/payments/offers';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { useCheckoutMarket } from '@/hooks/use-checkout-market';

const PREMIUM_EN: Record<string,string> = {
  "1": "1",
  "25": "25",
  "Hasta 3 materiales nuevos por día": "Up to 3 new materials per day",
  "Más preguntas, casos prácticos y flashcards": "More questions, practical cases and flashcards",
  "Nuevos simulacros y más planes de estudio": "New mock exams and more study plans",
  "Mapas mentales y seguimiento del progreso": "Mind maps and progress tracking",
  "Estudiá más": "Study more",
  "Cargá nuevos PDF y Word de distintas materias, hasta 3 por día.": "Upload new PDF and Word documents, up to 3 per day.",
  "Practicá mejor": "Practice better",
  "Generá preguntas, casos, flashcards y simulacros sin los cupos del Free.": "Generate questions, cases, flashcards and mock exams without Free quotas.",
  "Llegá preparado": "Be exam-ready",
  "Organizá tu tiempo con planes de estudio y seguí tu progreso por tema.": "Organize your time with study plans and track topic progress.",
  "Materiales": "Materials",
  "1 de por vida": "1 lifetime upload",
  "Hasta 3 nuevos por día": "Up to 3 new per day",
  "Resumen y glosario": "Summary and glossary",
  "Sí": "Yes",
  "Opción múltiple": "Multiple choice",
  "12 preguntas": "12 questions",
  "Más preguntas": "More questions",
  "Verdadero o falso": "True or false",
  "Más ejercicios": "More exercises",
  "Unir conceptos": "Match concepts",
  "1 ronda": "1 round",
  "Más rondas": "More rounds",
  "Casos prácticos": "Case studies",
  "Más casos": "More cases",
  "Más tarjetas": "More cards",
  "Simulacros": "Mock exams",
  "Nuevos simulacros": "New mock exams",
  "Plan de estudios": "Study plan",
  "Más planificaciones": "More study plans",
  "Mapas mentales": "Mind maps",
  "No": "No",
  "¿Puedo cancelar cuando quiera?": "Can I cancel anytime?",
  "Sí. El mensual permite cancelar futuras renovaciones y conservar el acceso hasta finalizar el período pagado.": "Yes. You can cancel future renewals and keep access until the paid period ends.",
  "¿Qué pasa con mis materiales si cancelo?": "What happens to my materials if I cancel?",
  "Se conservan los materiales y el progreso guardados, pero vuelven a aplicarse los permisos Free cuando vence Premium.": "Your saved materials and progress remain available, but Free limits apply after Premium expires.",
  "¿Premium tiene materiales ilimitados?": "Does Premium allow unlimited uploads?",
  "No. Permite cargar hasta tres materiales nuevos por día.": "No. You can upload up to three new materials per day.",
  "¿Puedo seguir estudiando gratis?": "Can I continue studying for free?",
  "Sí. Podés continuar utilizando las funciones y los ejercicios que ya tenés disponibles en Free.": "Yes. You can keep using the features and exercises already available on Free.",
  "¿Qué diferencia hay entre mensual y semestral?": "What is the difference between monthly and six-month plans?",
  "Las funcionalidades son iguales. El mensual se renueva automáticamente; el semestral se paga una sola vez por seis meses.": "Features are the same. Monthly renews automatically; the six-month plan is a single payment.",
  "Esta oferta ya no está disponible para esta cuenta.": "This offer is no longer available for this account.",
  "El precio se actualizó. Recargá para ver el importe antes de continuar.": "The price changed. Reload to check the amount before continuing.",
  "Ya tenés un pago en curso. Revisalo en Mercado Pago o intentá más tarde.": "You have a payment in progress. Check Mercado Pago or try later.",
  "Los cupos del plan semestral están agotados.": "The six-month plan is sold out.",
  "Ya existe un acceso Premium para esta cuenta. Revisalo desde Configuración.": "This account already has Premium access. Check Settings.",
  "No pudimos abrir Mercado Pago. Intentá nuevamente en unos minutos.": "We could not open Mercado Pago. Please try again in a few minutes.",
  "Usar mi Premium": "Use my Premium",
  "Revisar mi suscripción": "Review my subscription",
  "No pudimos verificar tu plan": "Could not verify your plan",
  "Verificando tu plan…": "Checking your plan…",
  "Activar Premium": "Activate Premium",
  "Abriendo Mercado Pago…": "Opening Mercado Pago…",
  "Evaluo Premium internacional": "Evaluo International Premium",
  "Estudiá más, practicá tus temas y reforzá errores con un pago mensual en USD.": "Study more, practice by topic and review mistakes with monthly billing in USD.",
  "Volver al estudio sin comprar": "Return to studying without buying",
  "Estudiá más. Practicá mejor.": "Study more. Practice better.",
  "Llegá preparado a tu examen.": "Feel ready for your exam.",
  "Todo lo que necesitás para estudiar, practicar y preparar tus exámenes.": "Everything you need to study, practice and prepare for exams.",
  "Premium mensual": "Monthly Premium",
  "Precio mensual": "Monthly price",
  "ARS por mes": "ARS per month",
  "Renovación automática. Cancelás cuando quieras y conservás el acceso hasta el fin del período pagado.": "Renews automatically. Cancel future renewals anytime and keep access until the paid period ends.",
  "Pago seguro con Mercado Pago": "Secure payment with Mercado Pago",
  "¿Preferís pagar una sola vez?": "Prefer to pay once?",
  "Ver plan semestral": "View six-month plan",
  "Esta oferta no está disponible en este momento.": "This offer is currently unavailable.",
  "Abriendo…": "Opening…",
  "No disponible": "Unavailable",
  "Elegir": "Choose",
  "¿Tenés un código de descuento?": "Have a discount code?",
  "Volver a abrir Mercado Pago": "Reopen Mercado Pago",
  "Tres razones para pasarte a Premium": "Three reasons to upgrade",
  "Tabla comparativa, desplazable en pantallas pequeñas": "Comparison table, horizontally scrollable on small screens",
  "FUNCIONALIDAD": "FEATURE",
  "Los cupos Free no se reinician al eliminar materiales. Resúmenes, glosario y explicaciones de errores también están en Free.": "Free limits do not reset when you delete materials. Summaries, glossaries and mistake explanations are also available on Free.",
  "Preguntas frecuentes": "Frequently asked questions",
  "Cancelás cuando quieras.": "Cancel future renewals anytime.",
  "El plan mensual se renueva cada mes de forma automática y podés cancelar futuras renovaciones cuando quieras. El plan semestral es un pago único por seis meses, sin renovación automática. Los pagos se procesan con Mercado Pago.": "The monthly plan renews automatically. You can cancel future renewals anytime. The six-month plan is a one-time payment without automatic renewal. Mercado Pago processes these payments."
};

type Plan = 'monthly' | 'semester';
type Offer = {
  monthlyPriceArs: number;
  semesterPriceArs: number;
  semesterEquivalentMonthlyArs: number;
  semesterAvailable: boolean;
  semesterRemaining: number | null;
};
type PurchaseStatus = 'loading' | 'active' | 'attention' | 'inactive' | 'unavailable';
type PremiumDashboardScreenProps = {
  source: string;
  materiaId?: string;
  parcial?: number;
  returnTo?: string;
};
const formatArs = (amount: number) =>
  '$' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(amount);

const benefits = [
  'Hasta 3 materiales nuevos por día',
  'Más preguntas, casos prácticos y flashcards',
  'Nuevos simulacros y más planes de estudio',
  'Mapas mentales y seguimiento del progreso',
] as const;
const reasons = [
  { title: 'Estudiá más', description: 'Cargá nuevos PDF y Word de distintas materias, hasta 3 por día.', icon: BookOpen, color: '#2a49c9', bg: '#e8eefc' },
  { title: 'Practicá mejor', description: 'Generá preguntas, casos, flashcards y simulacros sin los cupos del Free.', icon: ListChecks, color: '#16774f', bg: '#e7f7ef' },
  { title: 'Llegá preparado', description: 'Organizá tu tiempo con planes de estudio y seguí tu progreso por tema.', icon: Flag, color: '#b86a0f', bg: '#fff1de' },
] as const;
const comparison = [
  ['Materiales', '1 de por vida', 'Hasta 3 nuevos por día'],
  ['Resumen y glosario', 'Sí', 'Sí'],
  ['Opción múltiple', '12 preguntas', 'Más preguntas'],
  ['Verdadero o falso', '10', 'Más ejercicios'],
  ['Unir conceptos', '1 ronda', 'Más rondas'],
  ['Casos prácticos', '2', 'Más casos'],
  ['Flashcards', '25', 'Más tarjetas'],
  ['Simulacros', '1', 'Nuevos simulacros'],
  ['Plan de estudios', '1', 'Más planificaciones'],
  ['Mapas mentales', 'No', 'Sí'],
] as const;
const faq = [
  ['¿Puedo cancelar cuando quiera?', 'Sí. El mensual permite cancelar futuras renovaciones y conservar el acceso hasta finalizar el período pagado.'],
  ['¿Qué pasa con mis materiales si cancelo?', 'Se conservan los materiales y el progreso guardados, pero vuelven a aplicarse los permisos Free cuando vence Premium.'],
  ['¿Premium tiene materiales ilimitados?', 'No. Permite cargar hasta tres materiales nuevos por día.'],
  ['¿Puedo seguir estudiando gratis?', 'Sí. Podés continuar utilizando las funciones y los ejercicios que ya tenés disponibles en Free.'],
  ['¿Qué diferencia hay entre mensual y semestral?', 'Las funcionalidades son iguales. El mensual se renueva automáticamente; el semestral se paga una sola vez por seis meses.'],
] as const;

export function PremiumDashboardScreen({source, materiaId, parcial, returnTo}: PremiumDashboardScreenProps) {
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string) => english ? (PREMIUM_EN[es] ?? es) : es;
  const [offer,setOffer] = useState<Offer|null>(null);
  const [status,setStatus] = useState<PurchaseStatus>('loading');
  const [loading,setLoading] = useState<Plan|null>(null);
  const [error,setError] = useState<string|null>(null);
  const [checkoutUrl,setCheckoutUrl] = useState<string|null>(null);
  const market = useCheckoutMarket();

  useEffect(()=>{
    // Never load local ARS offers for international visitors.
    if (market?.market !== 'argentina') return;
    let active=true;
    void Promise.allSettled([
      fetch('/api/payments/offer',{cache:'no-store'}).then(async res=>{
        if(!res.ok)throw new Error('offer_unavailable');
        const raw=await res.json() as Partial<Offer>;
        const monthly=Number(raw.monthlyPriceArs);
        const semester=Number(raw.semesterPriceArs);
        if(!Number.isFinite(monthly)||monthly<=0||!Number.isFinite(semester)||semester<=0)throw new Error('invalid_offer');
        return {
          monthlyPriceArs:monthly,
          semesterPriceArs:semester,
          semesterEquivalentMonthlyArs:Number(raw.semesterEquivalentMonthlyArs)||Math.round(semester/6),
          semesterAvailable:raw.semesterAvailable===true,
          semesterRemaining:raw.semesterRemaining == null?null:Number(raw.semesterRemaining),
        } satisfies Offer;
      }),
      fetch('/api/payments/status',{cache:'no-store'}).then(async res=>{
        if(res.status===401)return 'inactive' as PurchaseStatus;
        if(!res.ok)return 'unavailable' as PurchaseStatus;
        return premiumPurchaseDisplayState(await res.json() as {plan?:string;status?:string});
      }),
    ]).then(([o,s])=>{
      if(!active)return;
      if(o.status==='fulfilled')setOffer(o.value);
      if(s.status==='fulfilled')setStatus(s.value);
      else setStatus('unavailable');
    });
    return ()=>{active=false};
  },[market?.market]);

  async function checkout(plan:Plan){
    if(market?.market !== 'argentina'||!offer||status!=='inactive'||loading||!offer.semesterAvailable&&plan==='semester')return;
    const amount=plan==='semester'?offer.semesterPriceArs:offer.monthlyPriceArs;
    setError(null);setLoading(plan);setCheckoutUrl(null);
    trackMarketingEvent('premium_checkout_clicked',{
      source:source+':'+plan,materia_id:materiaId,plan_context:'premium',offer_code:plan,
      billing_mode:plan==='semester'?'fixed_term':'recurring',
      displayed_amount_ars:amount,semester_remaining:offer.semesterRemaining,
    });
    const paymentWindow=window.open('/pricing/resultado?estado=preparando','evaluo-mercadopago');
    try {
      const response=await fetch('/api/payments/checkout',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({source,materiaId,parcial,returnTo,planContext:'premium',offerCode:plan,expectedBaseAmountArs:amount}),
      });
      const result=await response.json() as {checkoutUrl?:string;error?:string;baseAmountArs?:number;amountArs?:number};
      if(response.status===401){
        paymentWindow?.close();
        const next=window.location.pathname+window.location.search;
        window.location.assign('/login?mode=login&intent=premium&next='+encodeURIComponent(next));
        return;
      }
      if(response.status===403||response.status===409){
        paymentWindow?.close();
        setError(response.status===403?t("Esta oferta ya no está disponible para esta cuenta."):
          result.error==='price_changed'?t("El precio se actualizó. Recargá para ver el importe antes de continuar."):
          result.error==='checkout_in_progress'?t("Ya tenés un pago en curso. Revisalo en Mercado Pago o intentá más tarde."):
          result.error==='semester_sold_out'?t("Los cupos del plan semestral están agotados."):
          t("Ya existe un acceso Premium para esta cuenta. Revisalo desde Configuración."));
        return;
      }
      if(!response.ok||!result.checkoutUrl)throw new Error('checkout_unavailable');
      if(result.baseAmountArs!==amount||!Number.isFinite(result.amountArs)||
        (result.amountArs??0)<=0||(result.amountArs??0)>amount)throw new Error('checkout_amount_mismatch');
      const target=new URL(result.checkoutUrl);
      if(target.protocol!=='https:'||!(
        target.hostname==='mercadopago.com'||target.hostname.endsWith('.mercadopago.com')||
        target.hostname==='mercadopago.com.ar'||target.hostname.endsWith('.mercadopago.com.ar')
      ))throw new Error('invalid_checkout_host');
      setCheckoutUrl(target.toString());
      if(paymentWindow&&!paymentWindow.closed){
        paymentWindow.opener=null;
        paymentWindow.location.replace(target.toString());
      }else window.location.assign(target.toString());
    } catch {
      paymentWindow?.close();
      setError(t("No pudimos abrir Mercado Pago. Intentá nuevamente en unos minutos."));
    } finally {setLoading(null);}
  }

  const priceMonthly=offer?formatArs(offer.monthlyPriceArs):formatArs(PREMIUM_MONTHLY_PRICE_ARS);
  const priceSemester=offer?formatArs(offer.semesterPriceArs):formatArs(PREMIUM_SEMESTER_PRICE_ARS);
  const monthlyDisabled=status==='loading'||status==='unavailable'||!offer||loading!==null;
  const semesterDisabled=monthlyDisabled||offer?.semesterAvailable!==true;
  const monthlyCta=status==='active'?t("Usar mi Premium"):
    status==='attention'?t("Revisar mi suscripción"):
    status==='unavailable'?t("No pudimos verificar tu plan"):
    monthlyDisabled?t("Verificando tu plan…"):t("Activar Premium");
  const mainAction=status==='active'?(returnTo??'/dashboard'):status==='attention'?'/configuracion':null;
  const backHref=returnTo??'/dashboard';

  const monthlyButton=(position:'main'|'final')=>
    mainAction?<Link href={mainAction} className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#1a5cff] px-5 py-3.5 text-[15px] font-bold sm:text-[16px] text-white transition hover:bg-[#164fe3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5cff]">{monthlyCta}</Link>
    :<button type="button" disabled={monthlyDisabled} onClick={()=>void checkout('monthly')} data-premium-purchase={position} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#1a5cff] px-5 py-3.5 text-[15px] font-bold sm:text-[16px] text-white transition hover:bg-[#164fe3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a5cff] disabled:cursor-not-allowed disabled:opacity-60">{loading==='monthly'?<Loader2 className="size-4 animate-spin"/>:null}{loading==='monthly'?t("Abriendo Mercado Pago…"):monthlyCta}</button>;
  if (market===null) return <main className="mx-auto max-w-xl px-5 py-24 text-center text-sm text-slate-600"><Loader2 className="mx-auto mb-4 size-6 animate-spin"/> Consultando Premium para tu región…</main>;
  if (market.market==='unknown') return (
    <main role="alert" className="mx-auto max-w-xl px-5 py-16 text-center text-sm leading-7 text-amber-900">
      {english ? 'We could not confirm your country. Payment is unavailable until your region can be verified.' : 'No pudimos confirmar tu país. El pago no está disponible hasta verificar tu región.'}
    </main>
  );
  if (market.market==='international') return (
    <main className="mx-auto max-w-[840px] px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-950">{t("Evaluo Premium internacional")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{t("Estudiá más, practicá tus temas y reforzá errores con un pago mensual en USD.")}</p>
      </header>
      <div className="mx-auto max-w-xl"><CreemCheckoutCard features={benefits.map(t)} mode="live" available={market.creemAvailable}/></div>
      <Link href={returnTo??'/dashboard'} className="mx-auto mt-6 block text-center text-sm font-semibold text-blue-700">{t("Volver al estudio sin comprar")}</Link>
    </main>
  );
  return <main data-premium-dashboard className="mx-auto w-full max-w-[1240px] px-3 py-7 text-[#0f172a] sm:px-4 sm:py-9 lg:px-6 lg:pb-16 lg:pt-12">
    <div className="mx-auto w-full max-w-[680px] min-w-0">
      <header className="text-center">
        <span className="inline-flex rounded-full bg-[#eef3ff] px-[14px] py-[5px] text-[12px] font-bold text-[#2a49c9]">Evaluo Premium</span>
        <h1 className="mx-auto mt-4 max-w-[680px] text-[28px] font-extrabold leading-[1.15] tracking-[-.02em] sm:text-[36px] lg:text-[40px]">{t("Estudiá más. Practicá mejor.")}<span className="block">{t("Llegá preparado a tu examen.")}</span></h1>
        <p className="mx-auto mb-9 mt-[14px] max-w-[540px] text-[14px] leading-[1.55] text-[#475569] sm:text-[16px]">{t("Todo lo que necesitás para estudiar, practicar y preparar tus exámenes.")}</p>
      </header>

      <section aria-label={t("Premium mensual")} className="relative rounded-[24px] border-2 border-[#1a5cff] bg-[#f5f8ff] px-5 pb-6 pt-7 sm:px-7 sm:pb-[26px] sm:pt-7">
        <span className="absolute -top-3 left-5 rounded-full bg-[#1a5cff] px-3 py-1 text-[11px] font-bold text-white">{t("Premium mensual")}</span>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[38px] font-extrabold tracking-[-.02em] sm:text-[44px]" aria-label={t("Precio mensual")}>{priceMonthly}</span>
          <span className="text-[13px] text-[#5b6475] sm:text-[14px]">{t("ARS por mes")}</span>
        </div>
        <p className="mb-5 mt-1 text-[13px] leading-[1.55] text-[#5b6475]">{t("Renovación automática. Cancelás cuando quieras y conservás el acceso hasta el fin del período pagado.")}</p>
        <ul className="mb-6 space-y-2.5">
          {benefits.map(item=><li key={item} className="flex items-start gap-2.5 text-[13px] leading-[1.55] sm:text-[14px]">
            <Check className="mt-0.5 size-4 shrink-0 text-[#16774f]" strokeWidth={2.6} aria-hidden="true"/><span>{t(item)}</span>
          </li>)}
        </ul>
        {monthlyButton('main')}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold sm:text-[13px] text-[#475569]"><LockKeyhole className="size-4 shrink-0" aria-hidden="true"/> {t("Pago seguro con Mercado Pago")}</p>
      </section>

      <details className="group mt-[14px] text-center" data-premium-semester>
        <summary className="cursor-pointer text-[13px] text-[#475569] marker:hidden sm:text-[14px] [&::-webkit-details-marker]:hidden">{t("¿Preferís pagar una sola vez?")} <strong className="text-[#2a49c9]">{t("Ver plan semestral")}</strong></summary>
        <div className="mt-3 flex flex-col items-stretch gap-3 rounded-[20px] border border-[#e6eaf2] bg-white p-4 text-left sm:flex-row sm:items-center sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-bold sm:text-[14px]">{(english ? 'Six-month Premium' : 'Premium semestral')} · {priceSemester} ARS</h2>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#5b6475] sm:text-[13px]">{english ? `One-time payment for six months, without auto-renewal. Equivalent to ${formatArs(offer?.semesterEquivalentMonthlyArs??7500)} per month.` : `Pago único por seis meses, sin renovación automática. Equivale a ${formatArs(offer?.semesterEquivalentMonthlyArs??7500)} por mes.`}</p>
            {offer?.semesterAvailable===false?<p className="mt-1 text-[12px] text-[#a16207]">{t("Esta oferta no está disponible en este momento.")}</p>:null}
          </div>
          <button type="button" onClick={()=>void checkout('semester')} disabled={semesterDisabled||status==='active'||status==='attention'} className="min-h-[42px] shrink-0 rounded-full border border-[#d3def8] bg-white px-5 text-[13px] font-semibold text-[#2a49c9] hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50">{loading==='semester'?t("Abriendo…"):offer?.semesterAvailable===false?t("No disponible"):t("Elegir")}</button>
        </div>
      </details>

      <details className="mt-2 text-center" data-premium-referral>
        <summary className="cursor-pointer py-1.5 text-[12px] text-[#5b6475] marker:hidden [&::-webkit-details-marker]:hidden">{t("¿Tenés un código de descuento?")}</summary>
        <div className="mx-auto mt-2 max-w-[680px] bg-white text-left">
          <ManualReferralCode offerCode="monthly" variant="compact" hideHeading/>
        </div>
      </details>
      <Link href={backHref} className="mx-auto mt-2 flex min-h-[42px] w-fit items-center justify-center px-3 text-center text-[13px] font-semibold text-[#475569] hover:text-[#2a49c9]">{t("Volver al estudio sin comprar")}</Link>
      {error?<p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-[12px] text-red-700">{error}</p>:null}
      {checkoutUrl?<button type="button" onClick={()=>window.open(checkoutUrl,'evaluo-mercadopago')} className="mx-auto mt-2 block text-[12px] font-semibold text-[#2a49c9] underline">{t("Volver a abrir Mercado Pago")}</button>:null}

      <section className="mt-12 text-center sm:mt-16" aria-labelledby="premium-reasons">
        <h2 id="premium-reasons" className="text-[22px] font-extrabold tracking-[-.02em] sm:text-[24px]">{t("Tres razones para pasarte a Premium")}</h2>
        <div className="mt-[22px] grid gap-3 min-[850px]:grid-cols-3">
          {reasons.map(item=><article key={item.title} className="min-w-0 rounded-[20px] border border-[#e6eaf2] bg-white p-5 text-left">
            <span className="flex size-9 items-center justify-center rounded-[10px]" style={{background:item.bg}}><item.icon className="size-5" color={item.color} strokeWidth={1.9} aria-hidden="true"/></span>
            <h3 className="mt-[14px] text-[15px] font-extrabold" style={{color:item.color}}>{t(item.title)}</h3>
            <p className="mt-1 text-[12px] leading-[1.55] text-[#5b6475] sm:text-[13px]">{t(item.description)}</p>
          </article>)}
        </div>
      </section>

      <section className="mt-12 text-center sm:mt-14" aria-labelledby="premium-comparison">
        <h2 id="premium-comparison" className="text-[22px] font-extrabold tracking-[-.02em] sm:text-[24px]">Free vs. Premium</h2>
        <div className="mt-[22px] w-full overflow-x-auto rounded-[20px] border border-[#e6eaf2] bg-white" tabIndex={0} aria-label={t("Tabla comparativa, desplazable en pantallas pequeñas")}>
          <table className="w-full min-w-0 table-fixed border-collapse text-[11px] sm:text-[14px]">
            <colgroup><col style={{width:'39.4%'}}/><col style={{width:'30.3%'}}/><col style={{width:'30.3%'}}/></colgroup>
            <thead><tr className="text-[11px] font-bold tracking-[.05em] text-[#5b6475]">
              <th scope="col" className="px-2.5 py-[13px] text-left sm:px-[22px]">{t("FUNCIONALIDAD")}</th><th scope="col" className="px-2 py-3 text-center">FREE</th><th scope="col" className="px-2 py-3 text-center text-[#2a49c9]">PREMIUM</th>
            </tr></thead>
            <tbody>{comparison.map(([name,free,premium])=><tr key={name} className="border-t border-[#eef1f6]">
              <th scope="row" className="px-2.5 py-[13px] text-left font-semibold leading-[1.4] break-words sm:px-[22px]">{t(name)}</th>
              <td className="px-1.5 py-[13px] text-center leading-[1.4] break-words text-[#5b6475] sm:px-2">{t(free)}</td>
              <td className="px-1.5 py-[13px] text-center font-bold leading-[1.4] break-words text-[#2a49c9] sm:px-2">{t(premium)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-left text-[11px] leading-[1.55] text-[#5b6475]">{t("Los cupos Free no se reinician al eliminar materiales. Resúmenes, glosario y explicaciones de errores también están en Free.")}</p>
      </section>

      <section className="mt-12 text-center sm:mt-14" aria-labelledby="premium-faq">
        <h2 id="premium-faq" className="text-[22px] font-extrabold tracking-[-.02em] sm:text-[24px]">{t("Preguntas frecuentes")}</h2>
        <div className="mt-[22px] overflow-hidden rounded-[20px] border border-[#e6eaf2] bg-white text-left">
          {faq.map(([question,answer],i)=><details key={question} className="border-t border-[#eef1f6] first:border-0" open={i===0}>
            <summary className="cursor-pointer px-4 py-4 text-[13px] font-bold sm:px-[22px] sm:text-[14px]">{t(question)}</summary>
            <p className="px-4 pb-4 text-[12px] leading-[1.55] text-[#475569] sm:px-[22px] sm:text-[14px]">{t(answer)}</p>
          </details>)}
        </div>
      </section>

      <section className="mt-12 rounded-[24px] bg-[#eaf0ff] px-5 py-7 text-center sm:px-8 sm:py-8" aria-label={t("Activar Premium")}>
        <h2 className="text-[22px] font-extrabold tracking-[-.02em] sm:text-[24px]">{english ? `Start today for ${priceMonthly} per month` : `Empezá hoy por ${priceMonthly} al mes`}</h2>
        <p className="mb-5 mt-1 text-[13px] text-[#475569] sm:text-[14px]">{t("Cancelás cuando quieras.")}</p>
        {monthlyButton('final')}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#475569]"><LockKeyhole className="size-4 shrink-0" aria-hidden="true"/> {t("Pago seguro con Mercado Pago")}</p>
      </section>

      <p className="mt-6 text-left text-[11px] leading-[1.65] text-[#5b6475]">{t("El plan mensual se renueva cada mes de forma automática y podés cancelar futuras renovaciones cuando quieras. El plan semestral es un pago único por seis meses, sin renovación automática. Los pagos se procesan con Mercado Pago.")}</p>
    </div>
  </main>;
}

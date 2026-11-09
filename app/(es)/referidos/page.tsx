import Link from 'next/link';
import { requestAppLocale } from '@/lib/i18n/request-app-locale';
import { redirect } from 'next/navigation';
import { BadgePercent, CreditCard, MousePointerClick, UsersRound } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { getReferralPortalData } from '@/lib/referral-portal';
import { SITE_URL } from '@/lib/site';
import { PartnerReferralActions } from '@/components/referrals/PartnerReferralActions';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function percent(value: number, english = false) {
  return `${new Intl.NumberFormat(english ? 'en-US' : 'es-AR', { maximumFractionDigits: 1 }).format(value)}%`;
}

function appliesLabel(value: 'all' | 'monthly' | 'semester', english = false) {
  if (value === 'monthly') return english ? 'Monthly' : 'Mensual';
  if (value === 'semester') return english ? '6 months' : '6 meses';
  return english ? 'Monthly and 6 months' : 'Mensual y 6 meses';
}

function MetricTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-full left-0 z-20 mt-2 hidden max-w-[220px] rounded-lg bg-slate-950 px-2.5 py-1.5 text-[11px] leading-4 font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 md:block"
    >
      {children}
    </span>
  );
}

export default async function ReferidosPage() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?mode=login&next=/referidos');
  const english = (await requestAppLocale(user.user_metadata)) === 'en';
  const tr = (es: string, en: string) => english ? en : es;

  const portal = await getReferralPortalData(user).catch(() => null);
  if (!portal) {
    return (
      <section className="mx-auto w-full max-w-[1240px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">{tr('Referidos', 'Referrals')}</p>
        <h1 className="mt-2 text-[20px] leading-[1.3] font-bold tracking-[-0.04em] text-slate-950 sm:text-[22px]">
          {tr('No hay un programa asociado a esta cuenta', 'No referral program is linked to this account')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {tr('El acceso aparece automáticamente cuando el administrador vincula tu email verificado a un referente.', 'Access appears once the administrator connects your verified email to a referral partner.')}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-3 text-[13px] font-semibold text-white"
        >
          {tr('Volver al inicio', 'Back to my study space')}
        </Link>
      </section>
    );
  }

  const primaryPartner = portal.partners[0];
  const activeCodes = portal.codes.filter((code) => code.isActive);
  const primaryCode = activeCodes[0] ?? portal.codes[0] ?? null;
  const conversionRate = portal.summary.attributedUsers
    ? (portal.summary.approvedCheckouts / portal.summary.attributedUsers) * 100
    : 0;
  const siteUrl = SITE_URL.replace(/\/$/, '');

  const metrics = [
    {
      label: tr('Atribuidos', 'Attributed users'),
      value: portal.summary.attributedUsers,
      icon: UsersRound,
      help: tr('Usuarios vinculados a tu código o link.', 'Users attributed to your referral code or link.'),
    },
    {
      label: 'Checkouts',
      value: portal.summary.checkoutAttempts,
      icon: MousePointerClick,
      help: tr('Usuarios que iniciaron un checkout con tu código.', 'Users who started checkout with your code.'),
    },
    {
      label: tr('Conversiones', 'Conversions'),
      value: portal.summary.approvedCheckouts,
      icon: BadgePercent,
      help: tr('Checkouts o suscripciones aprobadas.', 'Approved checkouts or subscriptions.'),
    },
    {
      label: tr('Pagos', 'Payments'),
      value: portal.summary.approvedPayments,
      icon: CreditCard,
      help: tr('Pagos efectivamente acreditados.', 'Payments successfully received.'),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[1240px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">{tr('Programa de referidos', 'Referral program')}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[20px] leading-[1.3] font-bold tracking-[-0.04em] text-slate-950 sm:text-[22px]">
              {primaryPartner?.brandName ?? tr('Tus referidos', 'Your referrals')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {portal.partners.length === 1
                ? primaryPartner?.name
                : `${portal.partners.length} ${english ? 'partners linked to your account' : 'referentes asociados a tu cuenta'}`}
            </p>
          </div>

          {primaryCode ? (
            <div className="min-w-0 lg:text-right">
              <p className="text-xs font-semibold text-slate-500">{tr('Código principal', 'Primary code')}</p>
              <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-950">{primaryCode.code}</p>
              <p className="mt-1 text-xs text-slate-500">
                {percent(primaryCode.discountPercent, english)} {tr('de descuento', 'discount')} · {appliesLabel(primaryCode.appliesTo, english)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {primaryCode ? (
        <div className="border-b border-slate-200 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{tr('Tu link', 'Your link')}</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-900">
                {`${siteUrl}/?ref=${encodeURIComponent(primaryCode.code)}`}
              </p>
            </div>
            <PartnerReferralActions
              code={primaryCode.code}
              referralUrl={`${siteUrl}/?ref=${encodeURIComponent(primaryCode.code)}`}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-y-4 border-b border-slate-200 py-4 md:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, help }) => (
          <div
            key={label}
            className="group relative cursor-help border-l border-slate-200 pl-4 first:border-l-0 first:pl-0"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon className="h-4 w-4" />
              <p className="text-xs font-semibold">{label}</p>
            </div>
            <p className="mt-1.5 text-[20px] font-bold tracking-[-0.04em] text-slate-950">{value}</p>
            <MetricTooltip>{help}</MetricTooltip>
          </div>
        ))}
        <div className="group relative cursor-help border-l border-slate-200 pl-4">
          <p className="text-xs font-semibold text-slate-500">{tr('Conversión', 'Conversion')}</p>
          <p className="mt-1.5 text-[20px] font-bold tracking-[-0.04em] text-slate-950">{percent(conversionRate, english)}</p>
          <MetricTooltip>{tr('Conversiones sobre usuarios atribuidos.', 'Conversions out of attributed users.')}</MetricTooltip>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-200 py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">{tr('Facturación atribuida', 'Attributed revenue')}</p>
          <p className="mt-1.5 text-[20px] font-bold tracking-[-0.04em] text-slate-950">
            {currency.format(portal.summary.revenueArs)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{tr('Pagos efectivamente aprobados por Mercado Pago.', 'Payments successfully approved by Mercado Pago.')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">{tr('Descuentos otorgados', 'Discounts granted')}</p>
          <p className="mt-1.5 text-[20px] font-bold tracking-[-0.04em] text-slate-950">
            {currency.format(portal.summary.discountsArs)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{tr('Beneficio comercial aplicado a tus conversiones.', 'Discounts applied to your conversions.')}</p>
        </div>
      </div>

      <div className="py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">{tr('Rendimiento por código', 'Performance by code')}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {tr('Sólo ves estadísticas agregadas de los códigos asociados a tu referente.', 'Only aggregate statistics for your partner codes are shown.')}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border-y border-slate-200">
          <table className="min-w-[940px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">{tr('Código', 'Code')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Atribuidos', 'Attributed')}</th>
                <th className="px-3 py-3 font-semibold">Checkouts</th>
                <th className="px-3 py-3 font-semibold">{tr('Conversiones', 'Conversions')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Pagos', 'Payments')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Conversión', 'Conversion')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Facturación', 'Revenue')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Estado', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portal.codes.map((code) => {
                const codeConversion = code.attributedUsers
                  ? (code.approvedCheckouts / code.attributedUsers) * 100
                  : 0;
                return (
                  <tr key={code.id}>
                    <td className="px-3 py-3">
                      <p className="font-mono text-sm font-bold text-slate-950">{code.code}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {percent(code.discountPercent, english)} · {appliesLabel(code.appliesTo, english)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{code.attributedUsers}</td>
                    <td className="px-3 py-3 text-slate-700">{code.checkoutAttempts}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{code.approvedCheckouts}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{code.approvedPayments}</td>
                    <td className="px-3 py-3 text-slate-700">{percent(codeConversion, english)}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{currency.format(code.revenueArs)}</td>
                    <td className="px-3 py-3">
                      <span className={code.isActive ? 'font-semibold text-emerald-700' : 'text-slate-500'}>
                        {code.isActive ? tr('Activo', 'Active') : tr('Pausado', 'Paused')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!portal.codes.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                    {tr('Todavía no hay códigos asociados a tu referente.', 'No referral codes are linked to your partner yet.')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

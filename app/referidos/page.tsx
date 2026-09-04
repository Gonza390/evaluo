import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BadgePercent, CreditCard, MousePointerClick, UsersRound } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { getReferralPortalData } from '@/lib/referral-portal';
import { PartnerReferralActions } from '@/components/referrals/PartnerReferralActions';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function percent(value: number) {
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value)}%`;
}

function appliesLabel(value: 'all' | 'monthly' | 'semester') {
  if (value === 'monthly') return 'Mensual';
  if (value === 'semester') return '6 meses';
  return 'Mensual y 6 meses';
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

  const portal = await getReferralPortalData(user).catch(() => null);
  if (!portal) {
    return (
      <section className="mx-auto w-full max-w-5xl px-2 py-6 sm:px-0 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Referidos</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
          No hay un programa asociado a esta cuenta
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          El acceso aparece automáticamente cuando el administrador vincula tu email verificado a un referente.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Volver al inicio
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evaluo.com.ar').replace(/\/$/, '');

  const metrics = [
    {
      label: 'Atribuidos',
      value: portal.summary.attributedUsers,
      icon: UsersRound,
      help: 'Usuarios vinculados a tu código o link.',
    },
    {
      label: 'Checkouts',
      value: portal.summary.checkoutAttempts,
      icon: MousePointerClick,
      help: 'Usuarios que iniciaron un checkout con tu código.',
    },
    {
      label: 'Conversiones',
      value: portal.summary.approvedCheckouts,
      icon: BadgePercent,
      help: 'Checkouts o suscripciones aprobadas.',
    },
    {
      label: 'Pagos',
      value: portal.summary.approvedPayments,
      icon: CreditCard,
      help: 'Pagos efectivamente acreditados.',
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-0 sm:py-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Programa de referidos</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {primaryPartner?.brandName ?? 'Tus referidos'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {portal.partners.length === 1
                ? primaryPartner?.name
                : `${portal.partners.length} referentes asociados a tu cuenta`}
            </p>
          </div>

          {primaryCode ? (
            <div className="min-w-0 lg:text-right">
              <p className="text-xs font-semibold text-slate-500">Código principal</p>
              <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-950">{primaryCode.code}</p>
              <p className="mt-1 text-xs text-slate-500">
                {percent(primaryCode.discountPercent)} de descuento · {appliesLabel(primaryCode.appliesTo)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {primaryCode ? (
        <div className="border-b border-slate-200 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Tu link</p>
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

      <div className="grid grid-cols-2 gap-y-6 border-b border-slate-200 py-6 md:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, help }) => (
          <div
            key={label}
            className="group relative cursor-help border-l border-slate-200 pl-4 first:border-l-0 first:pl-0"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon className="h-4 w-4" />
              <p className="text-xs font-semibold">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">{value}</p>
            <MetricTooltip>{help}</MetricTooltip>
          </div>
        ))}
        <div className="group relative cursor-help border-l border-slate-200 pl-4">
          <p className="text-xs font-semibold text-slate-500">Conversión</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">{percent(conversionRate)}</p>
          <MetricTooltip>Conversiones sobre usuarios atribuidos.</MetricTooltip>
        </div>
      </div>

      <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">Facturación atribuida</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {currency.format(portal.summary.revenueArs)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Pagos efectivamente aprobados por Mercado Pago.</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Descuentos otorgados</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {currency.format(portal.summary.discountsArs)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Beneficio comercial aplicado a tus conversiones.</p>
        </div>
      </div>

      <div className="py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">Rendimiento por código</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Sólo ves estadísticas agregadas de los códigos asociados a tu referente.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border-y border-slate-200">
          <table className="min-w-[940px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Código</th>
                <th className="px-3 py-3 font-semibold">Atribuidos</th>
                <th className="px-3 py-3 font-semibold">Checkouts</th>
                <th className="px-3 py-3 font-semibold">Conversiones</th>
                <th className="px-3 py-3 font-semibold">Pagos</th>
                <th className="px-3 py-3 font-semibold">Conversión</th>
                <th className="px-3 py-3 font-semibold">Facturación</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
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
                        {percent(code.discountPercent)} · {appliesLabel(code.appliesTo)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{code.attributedUsers}</td>
                    <td className="px-3 py-3 text-slate-700">{code.checkoutAttempts}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{code.approvedCheckouts}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{code.approvedPayments}</td>
                    <td className="px-3 py-3 text-slate-700">{percent(codeConversion)}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{currency.format(code.revenueArs)}</td>
                    <td className="px-3 py-3">
                      <span className={code.isActive ? 'font-semibold text-emerald-700' : 'text-slate-500'}>
                        {code.isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!portal.codes.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                    Todavía no hay códigos asociados a tu referente.
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

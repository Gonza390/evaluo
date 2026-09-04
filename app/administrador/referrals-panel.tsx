'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePercent, Building2, Pencil, Play, Plus, UserRoundPlus } from 'lucide-react';
import {
  cambiarEstadoCodigoReferidoAdministrador,
  cambiarEstadoMarcaReferidoAdministrador,
  crearCodigoReferidoAdministrador,
  crearMarcaReferidoAdministrador,
  crearReferenteReferidoAdministrador,
  editarCodigoReferidoAdministrador,
  type ReferralAdminData,
  type ReferralAdminCodeMetric,
} from './referrals-actions';

function formatArs(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value)}%`;
}

function dateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function appliesLabel(value: ReferralAdminCodeMetric['appliesTo']) {
  if (value === 'monthly') return 'Mensual';
  if (value === 'semester') return '6 meses';
  return 'Todos';
}

function metricClass() {
  return 'border-l border-slate-200 pl-4 first:border-l-0 first:pl-0';
}

export function ReferralsPanel({ data }: { data: ReferralAdminData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [brandName, setBrandName] = useState('');
  const [partnerBrandId, setPartnerBrandId] = useState(data.brands[0]?.id ?? '');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');

  const [codeBrandId, setCodeBrandId] = useState(data.brands[0]?.id ?? '');
  const [codePartnerId, setCodePartnerId] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [appliesTo, setAppliesTo] = useState<'all' | 'monthly' | 'semester'>('all');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [editingCode, setEditingCode] = useState<ReferralAdminCodeMetric | null>(null);

  const partnersForCode = useMemo(
    () => data.partners.filter((partner) => partner.brandId === codeBrandId && partner.status === 'active'),
    [codeBrandId, data.partners]
  );

  const brandRollups = useMemo(
    () =>
      data.brands.map((brand) => {
        const rows = data.codes.filter((code) => code.brandId === brand.id);
        return {
          ...brand,
          codes: rows.length,
          activeCodes: rows.filter((code) => code.isActive).length,
          attributedUsers: rows.reduce((sum, code) => sum + code.attributedUsers, 0),
          approvedCheckouts: rows.reduce((sum, code) => sum + code.approvedCheckouts, 0),
          revenueArs: rows.reduce((sum, code) => sum + code.revenueArs, 0),
        };
      }),
    [data.brands, data.codes]
  );

  const run = (task: () => Promise<{ success: boolean; message: string }>, onSuccess?: () => void) => {
    setNotice(null);
    startTransition(() => {
      void (async () => {
        const result = await task();
        setNotice({ tone: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
          onSuccess?.();
          router.refresh();
        }
      })();
    });
  };

  const submitBrand = (event: React.FormEvent) => {
    event.preventDefault();
    run(
      () => crearMarcaReferidoAdministrador({ name: brandName }),
      () => setBrandName('')
    );
  };

  const submitPartner = (event: React.FormEvent) => {
    event.preventDefault();
    run(
      () =>
        crearReferenteReferidoAdministrador({
          brandId: partnerBrandId,
          displayName: partnerName,
          contactEmail: partnerEmail,
        }),
      () => {
        setPartnerName('');
        setPartnerEmail('');
      }
    );
  };

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    run(
      () =>
        crearCodigoReferidoAdministrador({
          partnerId: codePartnerId,
          code: codeValue,
          discountPercent,
          appliesTo,
          maxRedemptions,
          startsAt: toIso(startsAt),
          endsAt: toIso(endsAt),
        }),
      () => {
        setCodeValue('');
        setMaxRedemptions('');
        setStartsAt('');
        setEndsAt('');
      }
    );
  };

  const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCode) return;
    const form = new FormData(event.currentTarget);
    run(
      () =>
        editarCodigoReferidoAdministrador({
          codeId: editingCode.id,
          partnerId: String(form.get('partnerId') ?? ''),
          code: String(form.get('code') ?? ''),
          discountPercent: String(form.get('discountPercent') ?? ''),
          appliesTo: String(form.get('appliesTo') ?? 'all'),
          maxRedemptions: String(form.get('maxRedemptions') ?? ''),
          startsAt: toIso(String(form.get('startsAt') ?? '')),
          endsAt: toIso(String(form.get('endsAt') ?? '')),
        }),
      () => setEditingCode(null)
    );
  };

  return (
    <section>
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-600 uppercase">Adquisición</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-slate-950">Referidos y descuentos</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Creá marcas, referentes y códigos. El histórico comercial no se elimina al pausar una campaña.
          </p>
        </div>
      </div>

      {notice ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
          role="status"
        >
          {notice.text}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-y-5 sm:grid-cols-4 lg:grid-cols-7">
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Marcas</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{data.summary.brands}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Códigos activos</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{data.summary.activeCodes}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Atribuidos</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{data.summary.attributedUsers}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Checkouts</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{data.summary.checkouts}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Pagos</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{data.summary.approvedCheckouts}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Facturación</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatArs(data.summary.revenueArs)}</p>
        </div>
        <div className={metricClass()}>
          <p className="text-xs text-slate-500">Descuentos</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatArs(data.summary.discountsArs)}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-slate-950">Marcas</h3>
          </div>
          <form onSubmit={submitBrand} className="mt-3 flex gap-2">
            <input
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              placeholder="Ej. Marca Universitaria"
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Crear
            </button>
          </form>

          <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
            {data.brands.length ? (
              data.brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{brand.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {brand.status === 'active' ? 'Activa' : 'Pausada'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        cambiarEstadoMarcaReferidoAdministrador({
                          brandId: brand.id,
                          active: brand.status !== 'active',
                        })
                      )
                    }
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {brand.status === 'active' ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-slate-500">Todavía no hay marcas creadas.</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-slate-950">Referentes</h3>
          </div>
          <form onSubmit={submitPartner} className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              value={partnerBrandId}
              onChange={(event) => setPartnerBrandId(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Elegir marca</option>
              {data.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              placeholder="Persona / referente"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            />
            <input
              value={partnerEmail}
              onChange={(event) => setPartnerEmail(event.target.value)}
              type="email"
              placeholder="Email (opcional)"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
            />
            <button
              disabled={pending || !data.brands.length}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Crear referente
            </button>
          </form>

          <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
            {data.partners.length ? (
              data.partners.map((partner) => {
                const brand = data.brands.find((item) => item.id === partner.brandId);
                return (
                  <div key={partner.id} className="py-3">
                    <p className="text-sm font-semibold text-slate-900">{partner.displayName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {brand?.name ?? 'Marca'}{partner.contactEmail ? ` · ${partner.contactEmail}` : ''}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="py-4 text-sm text-slate-500">Creá un referente para poder generar códigos.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <BadgePercent className="h-4 w-4 text-indigo-600" />
          <h3 className="font-bold text-slate-950">Nuevo código</h3>
        </div>
        <form onSubmit={submitCode} className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">
            Marca
            <select
              value={codeBrandId}
              onChange={(event) => {
                setCodeBrandId(event.target.value);
                setCodePartnerId('');
              }}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-indigo-400"
            >
              <option value="">Elegir marca</option>
              {data.brands.filter((brand) => brand.status === 'active').map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Referente
            <select
              value={codePartnerId}
              onChange={(event) => setCodePartnerId(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-indigo-400"
            >
              <option value="">Elegir referente</option>
              {partnersForCode.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Código
            <input
              value={codeValue}
              onChange={(event) => setCodeValue(event.target.value.toUpperCase())}
              placeholder="MARCA20"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm font-semibold uppercase outline-none focus:border-indigo-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Descuento (%)
            <input
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Aplica a
            <select
              value={appliesTo}
              onChange={(event) => setAppliesTo(event.target.value as typeof appliesTo)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-indigo-400"
            >
              <option value="all">Mensual y 6 meses</option>
              <option value="monthly">Sólo mensual</option>
              <option value="semester">Sólo 6 meses</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Máximo de usos
            <input
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              type="number"
              min="1"
              step="1"
              placeholder="Sin límite"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Inicio (opcional)
            <input
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              type="datetime-local"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Fin (opcional)
            <input
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              type="datetime-local"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-400"
            />
          </label>
          <button
            disabled={pending || !codePartnerId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 md:col-span-2 xl:col-span-4"
          >
            <Plus className="h-4 w-4" />
            Crear código
          </button>
        </form>
      </div>

      {editingCode ? (
        <div className="mt-7 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-950">Editar {editingCode.code}</h3>
              <p className="mt-1 text-xs text-slate-500">
                Las condiciones comerciales sólo pueden editarse mientras el código no tenga historial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingCode(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancelar
            </button>
          </div>
          <form onSubmit={submitEdit} className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-slate-600">
              Referente
              <select
                name="partnerId"
                defaultValue={editingCode.partnerId}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none"
              >
                {data.partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {data.brands.find((brand) => brand.id === partner.brandId)?.name ?? 'Marca'} · {partner.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Código
              <input
                name="code"
                defaultValue={editingCode.code}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm font-semibold uppercase outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Descuento (%)
              <input
                name="discountPercent"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                defaultValue={editingCode.discountPercent}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Aplica a
              <select
                name="appliesTo"
                defaultValue={editingCode.appliesTo}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none"
              >
                <option value="all">Mensual y 6 meses</option>
                <option value="monthly">Sólo mensual</option>
                <option value="semester">Sólo 6 meses</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Máximo de usos
              <input
                name="maxRedemptions"
                type="number"
                min="1"
                step="1"
                defaultValue={editingCode.maxRedemptions ?? ''}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Inicio
              <input
                name="startsAt"
                type="datetime-local"
                defaultValue={dateTimeLocal(editingCode.startsAt)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Fin
              <input
                name="endsAt"
                type="datetime-local"
                defaultValue={dateTimeLocal(editingCode.endsAt)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none"
              />
            </label>
            <button
              disabled={pending}
              className="h-11 self-end rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-8 border-t border-slate-200 pt-5">
        <h3 className="font-bold text-slate-950">Rendimiento por código</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Atribuidos = usuarios asociados al código. Pagos = checkouts aprobados por Mercado Pago.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left text-xs">
            <thead className="border-y border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Código</th>
                <th className="px-3 py-3 font-semibold">Marca / referente</th>
                <th className="px-3 py-3 font-semibold">Descuento</th>
                <th className="px-3 py-3 font-semibold">Atribuidos</th>
                <th className="px-3 py-3 font-semibold">Checkouts</th>
                <th className="px-3 py-3 font-semibold">Pagos</th>
                <th className="px-3 py-3 font-semibold">Conversión</th>
                <th className="px-3 py-3 font-semibold">Facturación</th>
                <th className="px-3 py-3 font-semibold">Descuentos</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-3 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.codes.map((code) => {
                const conversion = code.attributedUsers
                  ? (code.approvedCheckouts / code.attributedUsers) * 100
                  : 0;
                const hasHistory = code.attributedUsers > 0 || code.checkoutAttempts > 0;
                return (
                  <tr key={code.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-mono text-sm font-bold text-slate-950">{code.code}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{appliesLabel(code.appliesTo)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{code.brandName}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{code.partnerName}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      {formatPercent(code.discountPercent)}
                      <p className="mt-1 text-[11px] font-normal text-slate-400">
                        {code.maxRedemptions ? `${code.activatedClaims}/${code.maxRedemptions} usos` : 'Sin límite'}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{code.attributedUsers}</td>
                    <td className="px-3 py-3 text-slate-700">{code.checkoutAttempts}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{code.approvedCheckouts}</td>
                    <td className="px-3 py-3 text-slate-700">{formatPercent(conversion)}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{formatArs(code.revenueArs)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatArs(code.discountsArs)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          code.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {code.isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={pending || hasHistory}
                          title={hasHistory ? 'Con historial, las condiciones comerciales quedan congeladas.' : 'Editar'}
                          onClick={() => setEditingCode(code)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(() =>
                              cambiarEstadoCodigoReferidoAdministrador({
                                codeId: code.id,
                                active: !code.isActive,
                              })
                            )
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 disabled:opacity-50"
                        >
                          <Play className={`h-3 w-3 ${code.isActive ? 'rotate-180' : ''}`} />
                          {code.isActive ? 'Pausar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!data.codes.length ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                    Todavía no hay códigos. Creá una marca, un referente y el primer código.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {brandRollups.some((brand) => brand.codes > 0) ? (
        <div className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="font-bold text-slate-950">Resumen por marca</h3>
          <div className="mt-3 divide-y divide-slate-100 border-y border-slate-200">
            {brandRollups
              .filter((brand) => brand.codes > 0)
              .map((brand) => (
                <div
                  key={brand.id}
                  className="grid gap-2 py-3 text-xs sm:grid-cols-[minmax(140px,1.4fr)_repeat(5,minmax(72px,1fr))] sm:items-center"
                >
                  <p className="font-semibold text-slate-900">{brand.name}</p>
                  <p className="text-slate-600">{brand.activeCodes}/{brand.codes} códigos</p>
                  <p className="text-slate-600">{brand.attributedUsers} atribuidos</p>
                  <p className="text-slate-600">{brand.approvedCheckouts} pagos</p>
                  <p className="font-semibold text-slate-900">{formatArs(brand.revenueArs)}</p>
                  <p className="text-slate-500">
                    {brand.attributedUsers
                      ? formatPercent((brand.approvedCheckouts / brand.attributedUsers) * 100)
                      : '0%'} conv.
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

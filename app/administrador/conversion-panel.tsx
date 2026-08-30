'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  FileUp,
  RefreshCw,
  RotateCcw,
  Target,
  UsersRound,
} from 'lucide-react';

type ProductAnalytics = {
  generatedAt: string;
  period: 1 | 7 | 30;
  kpis: {
    newUsers: number;
    activationPct: number;
    meaningfulUsers: number;
    meaningfulOfAvailablePct: number;
    return48hPct: number | null;
    returnEligibleUsers: number;
    coveragePct: number;
    contentEmptyUsers: number;
  };
  funnel: Array<{
    key: string;
    label: string;
    value: number;
    conversionPct: number;
  }>;
  biggestDrop: {
    from: string;
    to: string;
    lost: number;
    dropPct: number;
  } | null;
  cohorts: Array<{
    date: string;
    label: string;
    registered: number;
    materia: number;
    available: number;
    opened: number;
    meaningful: number;
    returned: number;
  }>;
  acquisition: Array<{
    source: string;
    registrations: number;
    materia: number;
    meaningful: number;
    activationPct: number;
  }>;
  coverage: {
    reachedMateria: number;
    availableUsers: number;
    emptyUsers: number;
    topEmptyMaterias: Array<{
      materiaId: string;
      name: string;
      users: number;
    }>;
  };
  pdf: {
    selectedUsers: number;
    completedUsers: number;
    conversionPct: number;
  };
  users: Array<{
    userId: string;
    email: string;
    registeredAt: string;
    source: string;
    materiaId: string | null;
    materiaName: string | null;
    reachedMateria: boolean;
    contentAvailable: boolean;
    contentOpened: boolean;
    meaningfulStudy: boolean;
    returned48h: boolean;
    activeDays: number;
    simulatorAttempts: number;
    pdfSelected: number;
    pdfUploads: number;
  }>;
  exclusions: {
    adminUsers: number;
    adminSessions: number;
  };
};

function periodFromLabel(label: string): 1 | 7 | 30 {
  if (label.toLowerCase().includes('hoy')) return 1;
  if (label.includes('30')) return 30;
  return 7;
}

function formatPercent(value: number | null) {
  return value === null ? '—' : `${value.toLocaleString('es-AR')}%`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function formatSignup(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-2 text-[1.7rem] font-bold tracking-[-0.055em] text-slate-950">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function BooleanStatus({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
        value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {value ? 'Sí' : 'No'}
    </span>
  );
}

export function ConversionPanel({
  stats: _legacyStats,
  periodLabel,
}: {
  stats: unknown;
  periodLabel: string;
}) {
  const period = periodFromLabel(periodLabel);
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/product-analytics?period=${period}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as ProductAnalytics & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'No pudimos cargar las métricas de producto.');
      }
      setData(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'No pudimos cargar las métricas de producto.'
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxFunnelValue = useMemo(
    () => Math.max(1, ...(data?.funnel.map((item) => item.value) ?? [1])),
    [data]
  );

  if (loading && !data) {
    return (
      <section className="space-y-4">
        <div className="h-28 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[20px] bg-slate-50" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[22px] bg-slate-50" />
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="rounded-[22px] border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <h2 className="font-bold text-rose-950">No pudimos cargar Producto</h2>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 text-white shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
        <div className="flex items-start justify-between gap-6 px-6 py-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              <BarChart3 className="h-4 w-4" />
              Salud de activación
            </div>
            <h2 className="mt-2 text-[1.8rem] font-bold tracking-[-0.055em]">
              ¿Los nuevos usuarios llegan a estudiar?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Registro → Materia → Contenido disponible → Contenido abierto → Estudio significativo → Regreso
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <p className="text-[11px] text-slate-400">{formatDateTime(data.generatedAt)}</p>
          </div>
        </div>
        <div className="border-t border-white/10 bg-white/[0.04] px-6 py-3 text-[12px] text-slate-300">
          Administradores y cuentas internas quedan excluidos automáticamente de estas métricas.
        </div>
      </section>

      <section className="grid grid-cols-5 gap-3">
        <KpiCard
          label="Nuevos usuarios"
          value={data.kpis.newUsers.toLocaleString('es-AR')}
          detail={`Registrados en ${periodLabel.toLowerCase()}.`}
          icon={UsersRound}
        />
        <KpiCard
          label="Activación"
          value={formatPercent(data.kpis.activationPct)}
          detail={`${data.kpis.meaningfulUsers} hicieron estudio significativo.`}
          icon={Target}
        />
        <KpiCard
          label="Cobertura"
          value={formatPercent(data.kpis.coveragePct)}
          detail={`${data.kpis.contentEmptyUsers} llegaron a una materia sin contenido.`}
          icon={BookOpenCheck}
        />
        <KpiCard
          label="Regreso 48 h"
          value={formatPercent(data.kpis.return48hPct)}
          detail={
            data.kpis.returnEligibleUsers > 0
              ? `Sobre ${data.kpis.returnEligibleUsers} activados con 48 h completas.`
              : 'Todavía no hay cohorte madura para medir.'
          }
          icon={RotateCcw}
        />
        <KpiCard
          label="Estudio / contenido"
          value={formatPercent(data.kpis.meaningfulOfAvailablePct)}
          detail="De quienes encontraron contenido, cuántos realmente estudiaron."
          icon={Clock3}
        />
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] text-blue-600 uppercase">Embudo oficial</p>
            <h3 className="mt-1 text-xl font-bold tracking-[-0.04em] text-slate-950">Dónde se pierde cada usuario</h3>
          </div>
          <p className="text-xs text-slate-500">Conversión contra el paso anterior</p>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2">
          {data.funnel.map((step, index) => (
            <div key={step.key} className="relative min-w-0">
              <div className="rounded-[16px] border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-slate-500 shadow-sm">
                    {index + 1}
                  </span>
                  {index > 0 ? (
                    <span className="text-[11px] font-bold text-slate-600">{step.conversionPct}%</span>
                  ) : null}
                </div>
                <p className="mt-3 min-h-9 text-[12px] font-semibold leading-4 text-slate-700">{step.label}</p>
                <p className="mt-1 text-[1.45rem] font-bold tracking-[-0.05em] text-slate-950">
                  {step.value.toLocaleString('es-AR')}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max(4, (step.value / maxFunnelValue) * 100)}%` }}
                  />
                </div>
              </div>
              {index < data.funnel.length - 1 ? (
                <ArrowRight className="absolute top-1/2 -right-[9px] z-10 h-4 w-4 -translate-y-1/2 rounded-full bg-white text-slate-300" />
              ) : null}
            </div>
          ))}
        </div>

        {data.biggestDrop ? (
          <div className="mt-4 flex items-center justify-between gap-5 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-900">Mayor fuga del período</p>
                <p className="mt-1 text-sm text-amber-800">
                  {data.biggestDrop.from} → {data.biggestDrop.to}: se pierde {data.biggestDrop.dropPct}%.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-amber-800">
              {data.biggestDrop.lost} usuarios
            </span>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-[1.35fr_0.9fr] gap-4">
        <section className="rounded-[22px] border border-slate-200 bg-white p-5">
          <div>
            <p className="text-[12px] font-bold tracking-[0.13em] text-slate-500 uppercase">Cohortes</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">Nuevos por día</h3>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-[12px]">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-2 font-semibold">Fecha</th>
                  <th className="pb-2 text-right font-semibold">Registro</th>
                  <th className="pb-2 text-right font-semibold">Materia</th>
                  <th className="pb-2 text-right font-semibold">Disponible</th>
                  <th className="pb-2 text-right font-semibold">Abrió</th>
                  <th className="pb-2 text-right font-semibold">Estudió</th>
                  <th className="pb-2 text-right font-semibold">Volvió</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.cohorts.map((row) => (
                  <tr key={row.date}>
                    <td className="py-2.5 font-semibold text-slate-800">{row.label}</td>
                    <td className="py-2.5 text-right text-slate-600">{row.registered}</td>
                    <td className="py-2.5 text-right text-slate-600">{row.materia}</td>
                    <td className="py-2.5 text-right text-slate-600">{row.available}</td>
                    <td className="py-2.5 text-right text-slate-600">{row.opened}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">{row.meaningful}</td>
                    <td className="py-2.5 text-right text-slate-600">{row.returned}</td>
                  </tr>
                ))}
                {data.cohorts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Todavía no hay registros en este período.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5">
          <div>
            <p className="text-[12px] font-bold tracking-[0.13em] text-slate-500 uppercase">Adquisición</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">Qué fuente trae usuarios útiles</h3>
          </div>
          <div className="mt-4 space-y-2">
            {data.acquisition.slice(0, 8).map((row) => (
              <div key={row.source} className="rounded-[15px] border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-slate-800">{row.source}</span>
                  <span className="text-xs font-bold text-slate-900">{row.activationPct}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{row.registrations} registros</span>
                  <span>{row.materia} materia</span>
                  <span>{row.meaningful} estudiaron</span>
                </div>
              </div>
            ))}
            {data.acquisition.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Sin adquisición para mostrar.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-[22px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold tracking-[0.13em] text-slate-500 uppercase">Cobertura de contenido</p>
              <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">Materias que frenan activación</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-[-0.05em] text-slate-950">{data.coverage.emptyUsers}</p>
              <p className="text-[11px] text-slate-500">sin contenido</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {data.coverage.topEmptyMaterias.map((row) => (
              <div key={row.materiaId} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
                <span className="truncate text-sm text-slate-700">{row.name}</span>
                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">
                  {row.users} usuarios
                </span>
              </div>
            ))}
            {data.coverage.topEmptyMaterias.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No detectamos materias vacías en este período.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold tracking-[0.13em] text-slate-500 uppercase">PDF propio</p>
              <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">Selección → subida terminada</h3>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="rounded-[16px] bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{data.pdf.selectedUsers}</p>
              <p className="mt-1 text-xs text-slate-500">eligieron PDF</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300" />
            <div className="rounded-[16px] bg-indigo-50 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-950">{data.pdf.completedUsers}</p>
              <p className="mt-1 text-xs text-indigo-600">subidas</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-semibold text-slate-700">
            Conversión: {data.pdf.selectedUsers > 0 ? `${data.pdf.conversionPct}%` : 'sin datos nuevos todavía'}
          </p>
        </section>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold tracking-[0.13em] text-slate-500 uppercase">Diagnóstico individual</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">Usuarios nuevos y recorrido</h3>
            <p className="mt-1 text-xs text-slate-500">Sólo visible dentro del administrador.</p>
          </div>
          <span className="text-xs text-slate-500">Últimos {Math.min(50, data.users.length)}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-[12px]">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">Usuario</th>
                <th className="pb-2 font-semibold">Registro</th>
                <th className="pb-2 font-semibold">Fuente</th>
                <th className="pb-2 font-semibold">Materia</th>
                <th className="pb-2 text-center font-semibold">Disponible</th>
                <th className="pb-2 text-center font-semibold">Abrió</th>
                <th className="pb-2 text-center font-semibold">Estudió</th>
                <th className="pb-2 text-center font-semibold">Volvió</th>
                <th className="pb-2 text-right font-semibold">Sim.</th>
                <th className="pb-2 text-right font-semibold">PDF</th>
                <th className="pb-2 text-right font-semibold">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map((row) => (
                <tr key={row.userId}>
                  <td className="max-w-[220px] truncate py-2.5 font-semibold text-slate-800">{row.email}</td>
                  <td className="py-2.5 text-slate-500">{formatSignup(row.registeredAt)}</td>
                  <td className="py-2.5 text-slate-600">{row.source}</td>
                  <td className="max-w-[180px] truncate py-2.5 text-slate-600">{row.materiaName ?? '—'}</td>
                  <td className="py-2.5 text-center"><BooleanStatus value={row.contentAvailable} /></td>
                  <td className="py-2.5 text-center"><BooleanStatus value={row.contentOpened} /></td>
                  <td className="py-2.5 text-center"><BooleanStatus value={row.meaningfulStudy} /></td>
                  <td className="py-2.5 text-center"><BooleanStatus value={row.returned48h} /></td>
                  <td className="py-2.5 text-right text-slate-600">{row.simulatorAttempts}</td>
                  <td className="py-2.5 text-right text-slate-600">{row.pdfUploads}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-800">{row.activeDays}</td>
                </tr>
              ))}
              {data.users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-slate-500">
                    No hay usuarios nuevos en este período.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

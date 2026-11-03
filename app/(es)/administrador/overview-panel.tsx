'use client';

import { useMemo, useState } from 'react';
import type { AdminDailyOverview } from './overview-actions';

type MetricKey = 'registrations' | 'activeUsers' | 'sessions' | 'pdfsUploaded' | 'practicesCompleted';

const METRICS: { key: MetricKey; label: string; caption: string }[] = [
  { key: 'registrations', label: 'Registros', caption: 'Cuentas nuevas en el período' },
  { key: 'activeUsers', label: 'Activos del último día', caption: 'Usuarios únicos con eventos en el día' },
  { key: 'sessions', label: 'Sesiones', caption: 'Suma de sesiones diarias del período' },
  { key: 'pdfsUploaded', label: 'PDFs cargados', caption: 'Materiales creados en el período' },
  { key: 'practicesCompleted', label: 'Prácticas guardadas', caption: 'Sesiones completadas en las modalidades registradas' },
];

function format(value: number) {
  return value.toLocaleString('es-AR');
}

export function OverviewPanel({ rows, generatedAt }: { rows: AdminDailyOverview[]; generatedAt: string }) {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [metric, setMetric] = useState<MetricKey>('registrations');
  const selected = useMemo(() => rows.slice(-days), [rows, days]);
  const latest = selected.at(-1);
  const sums = useMemo(
    () => selected.reduce(
      (acc, item) => ({
        registrations: acc.registrations + item.registrations,
        sessions: acc.sessions + item.sessions,
        pdfsUploaded: acc.pdfsUploaded + item.pdfsUploaded,
        practicesCompleted: acc.practicesCompleted + item.practicesCompleted,
      }),
      { registrations: 0, sessions: 0, pdfsUploaded: 0, practicesCompleted: 0 }
    ),
    [selected]
  );
  const max = Math.max(1, ...selected.map((item) => item[metric]));
  const values: Record<MetricKey, number> = { ...sums, activeUsers: latest?.activeUsers ?? 0 };

  return (
    <section className="admin-product">
      <header className="admin-page-header">
        <div>
          <h1>Resumen general</h1>
          <p>Indicadores consolidados del producto. Filtrá y compará sin ejecutar otra consulta.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Período del resumen">
          {([7, 14, 30] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setDays(value)}
              aria-pressed={days === value}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${days === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}
            >{value} días</button>
          ))}
        </div>
      </header>
      <div className="admin-kpi-grid">
        {METRICS.map(({ key, label, caption }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMetric(key)}
            aria-pressed={metric === key}
            className={`admin-kpi text-left ${metric === key ? 'ring-2 ring-indigo-200' : ''}`}
          >
            <div className="admin-kpi-label">{label}</div>
            <div className="admin-kpi-value">{format(values[key])}</div>
            <div className="admin-kpi-sub">{caption}</div>
          </button>
        ))}
      </div>
      <div className="admin-card mt-4">
        <h2 className="text-base font-semibold text-slate-900">
          Evolución diaria · {METRICS.find((item) => item.key === metric)?.label}
        </h2>
        <div className="mt-5 flex h-44 items-end gap-1" role="img" aria-label="Serie diaria de la métrica seleccionada">
          {selected.map((item) => (
            <div className="group relative flex min-w-0 flex-1 items-end" key={item.day} style={{ height: '100%' }}>
              <div
                className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600"
                style={{ height: `${Math.max(2, (item[metric] / max) * 100)}%` }}
                title={`${item.day}: ${format(item[metric])}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{selected[0]?.day ?? '—'}</span><span>{latest?.day ?? '—'}</span>
        </div>
      </div>
      <p className="admin-footnote">
        Última consulta cacheada: {generatedAt}. Los indicadores se actualizan como máximo cada 15 minutos
        cuando se consulta esta pantalla. Los usuarios activos corresponden al último día y no a usuarios únicos
        acumulados en todo el período. Las prácticas incluyen solamente sesiones guardadas en practice_mode_sessions.
      </p>
    </section>
  );
}

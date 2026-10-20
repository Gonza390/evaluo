import Link from 'next/link';
import type { UnlamFunnelSnapshot } from './unlam-funnel-actions';

function percent(value: number) {
  return value.toFixed(1).replace('.', ',') + '%';
}

export function UnlamFunnelPanel({ stats }: { stats: UnlamFunnelSnapshot }) {
  const max = Math.max(1, stats.steps[0]?.sessions ?? 0);
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="unlam-funnel-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Landing específica</p>
          <h2 id="unlam-funnel-title" className="mt-1 text-xl font-bold text-slate-950">Ingreso UNLaM · Embudo de adquisición</h2>
          <p className="mt-2 text-sm text-slate-600">
            Últimos {stats.periodDays} días · Sesiones que visitaron /como-estudiar-ingreso-unlam
          </p>
        </div>
        <Link href="/como-estudiar-ingreso-unlam" target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-blue-700 hover:border-blue-200">
          Ver landing pública ↗
        </Link>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.steps.map((step, index) => (
          <div key={step.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="min-h-8 text-xs font-semibold leading-5 text-slate-600">
              {index + 1}. {step.label}
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-slate-950">{step.sessions.toLocaleString('es-AR')}</p>
              <p className="text-xs font-bold text-blue-700">{percent(step.pctOfLanding)}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-500" style={{ width: percent(step.sessions / max * 100).replace(',', '.') }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-4xl text-xs leading-6 text-slate-500">{stats.caveat}</p>
      {stats.anonymousLandingEvents > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Entradas adicionales sin identificador de sesión: {stats.anonymousLandingEvents}. Se cuentan como visitas individuales y no pueden enlazarse a otras acciones.
        </p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">
        Para evaluar consultas, posición media, impresiones y CTR de Google, consultá Search Console por la URL canónica.
      </p>
    </section>
  );
}

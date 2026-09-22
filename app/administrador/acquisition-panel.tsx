import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Linkedin,
  MessageCircle,
  Minus,
  Search,
} from 'lucide-react';
import type {
  AcquisitionOverviewStats,
  AcquisitionSourceDetail,
  AcquisitionSourceKey,
  AcquisitionSourceStats,
  AcquisitionTimelinePoint,
  AcquisitionTrend,
} from './acquisition-actions';

const SOURCE_META: Record<
  AcquisitionSourceKey,
  {
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    iconBg: string;
    cardClass: string;
    selectedClass: string;
    sparklineClass: string;
  }
> = {
  google: {
    label: 'Google',
    subtitle: 'Búsqueda orgánica',
    icon: Search,
    iconClass: 'text-blue-700',
    iconBg: 'bg-blue-100',
    cardClass: 'from-blue-50/80 via-white to-white',
    selectedClass: 'border-blue-300 ring-blue-100',
    sparklineClass: 'text-blue-500',
  },
  whatsapp: {
    label: 'WhatsApp',
    subtitle: 'Links compartidos',
    icon: MessageCircle,
    iconClass: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    cardClass: 'from-emerald-50/80 via-white to-white',
    selectedClass: 'border-emerald-300 ring-emerald-100',
    sparklineClass: 'text-emerald-500',
  },
  instagram: {
    label: 'Instagram',
    subtitle: 'Links compartidos',
    icon: Instagram,
    iconClass: 'text-fuchsia-700',
    iconBg: 'bg-fuchsia-100',
    cardClass: 'from-fuchsia-50/80 via-white to-white',
    selectedClass: 'border-fuchsia-300 ring-fuchsia-100',
    sparklineClass: 'text-fuchsia-500',
  },
  linkedin: {
    label: 'LinkedIn',
    subtitle: 'Links compartidos',
    icon: Linkedin,
    iconClass: 'text-sky-700',
    iconBg: 'bg-sky-100',
    cardClass: 'from-sky-50/80 via-white to-white',
    selectedClass: 'border-sky-300 ring-sky-100',
    sparklineClass: 'text-sky-500',
  },
};

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

function formatPct(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function GrowthBadge({ trend }: { trend: AcquisitionTrend }) {
  if (trend.direction === 'new') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
        <ArrowUpRight className="h-3 w-3" />
        Nuevo · +{trend.absoluteChange.toLocaleString('es-AR')}
      </span>
    );
  }

  if (trend.direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
        <ArrowUpRight className="h-3 w-3" />
        +{formatPct(Math.abs(trend.pctChange ?? 0))}
      </span>
    );
  }

  if (trend.direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-700">
        <ArrowDownRight className="h-3 w-3" />
        -{formatPct(Math.abs(trend.pctChange ?? 0))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
      <Minus className="h-3 w-3" />
      0,0%
    </span>
  );
}

function GrowthCopy({ trend }: { trend: AcquisitionTrend }) {
  if (trend.direction === 'new') {
    return <span>sin entradas en el período anterior</span>;
  }

  if (trend.absoluteChange === 0) {
    return <span>sin cambios vs. período anterior</span>;
  }

  const sign = trend.absoluteChange > 0 ? '+' : '-';
  return (
    <span>
      {sign}
      {Math.abs(trend.absoluteChange).toLocaleString('es-AR')} entradas vs. período anterior
    </span>
  );
}

function Sparkline({ points, className }: { points: AcquisitionTimelinePoint[]; className: string }) {
  const width = 132;
  const height = 38;
  const values = points.map((point) => point.entries);
  const max = Math.max(1, ...values);
  const denominator = Math.max(1, values.length - 1);
  const polyline = values
    .map((value, index) => {
      const x = (index / denominator) * width;
      const y = height - 3 - (value / max) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-10 w-full ${className}`} aria-hidden="true">
      <line x1="0" y1={height - 3} x2={width} y2={height - 3} stroke="currentColor" opacity="0.12" />
      {values.length > 1 ? (
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle cx={width / 2} cy={height / 2} r="3" fill="currentColor" />
      )}
    </svg>
  );
}

function SourceCard({
  item,
  period,
  selected,
}: {
  item: AcquisitionSourceStats;
  period: number;
  selected: boolean;
}) {
  const meta = SOURCE_META[item.source];
  const Icon = meta.icon;

  return (
    <Link
      href={`/administrador?panel=adquisicion&period=${period}&source=${item.source}#detalle`}
      className={`group rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${meta.cardClass} ${
        selected ? `${meta.selectedClass} ring-2` : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.iconBg}`}>
            <Icon className={`h-5 w-5 ${meta.iconClass}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">{meta.label}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{meta.subtitle}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Entradas</p>
          <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            {item.entries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatPct(item.pct)} del identificado</p>
        </div>
        <div className="text-right">
          <GrowthBadge trend={item.trend} />
          <p className="mt-1.5 text-[10px] text-slate-400">
            <GrowthCopy trend={item.trend} />
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/80 bg-white/60 px-3 py-2 shadow-sm">
        <Sparkline points={item.timeline} className={meta.sparklineClass} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
        <span className="font-semibold text-slate-400">Principal landing</span>
        <span className="max-w-[58%] truncate font-semibold text-slate-600" title={item.topLanding ?? undefined}>
          {item.topLanding ?? 'Sin datos'}
        </span>
      </div>
    </Link>
  );
}

function EvolutionChart({ detail }: { detail: AcquisitionSourceDetail }) {
  const meta = SOURCE_META[detail.source];
  const max = Math.max(1, ...detail.timeline.map((point) => point.entries));
  const showEvery = detail.timeline.length > 16 ? 5 : detail.timeline.length > 9 ? 2 : 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">Evolución de entradas</p>
          <p className="mt-1 text-xs text-slate-500">Cómo se distribuyeron las visitas durante el período.</p>
        </div>
        <GrowthBadge trend={detail.trend} />
      </div>

      <div className="mt-6 flex h-44 items-end gap-1.5 border-b border-slate-100 pb-6">
        {detail.timeline.map((point, index) => {
          const heightPct = point.entries > 0 ? Math.max(8, (point.entries / max) * 100) : 2;
          const showLabel =
            index === 0 ||
            index === detail.timeline.length - 1 ||
            index % showEvery === 0;
          return (
            <div key={point.key} className="relative flex h-full min-w-0 flex-1 items-end justify-center" title={`${point.label}: ${point.entries}`}>
              <div
                className={`w-full max-w-8 rounded-t-md bg-current opacity-80 ${meta.sparklineClass}`}
                style={{ height: `${heightPct}%` }}
              />
              {showLabel ? (
                <span className="absolute top-full mt-2 whitespace-nowrap text-[9px] font-medium text-slate-400">
                  {point.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BehaviorPanel({ detail }: { detail: AcquisitionSourceDetail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-bold text-slate-950">Qué hicieron después de entrar</p>
        <p className="mt-1 text-xs text-slate-500">Cada porcentaje toma como base las {detail.entries.toLocaleString('es-AR')} entradas del canal.</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {detail.behavior.map((item) => (
          <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="min-h-8 text-[11px] font-semibold leading-4 text-slate-600">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                {item.count.toLocaleString('es-AR')}
              </p>
              <p className="text-xs font-bold text-indigo-600">{formatPct(item.pct)}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-400">
        “Se autenticaron” une la entrada anónima con eventos posteriores del mismo session_key; Google OAuth también registra el éxito en el callback.
      </p>
    </div>
  );
}

function SeoHistoryPanel({ detail }: { detail: AcquisitionSourceDetail }) {
  if (detail.source !== 'google') return null;

  const rows = detail.seoHistory.slice(-14).reverse();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-bold text-slate-950">Histórico diario SEO → producto</p>
        <p className="mt-1 text-xs text-slate-500">
          Cohortes por día de entrada desde Google. Los días recientes se recalculan para incorporar conversiones y retornos posteriores.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              <th className="pb-2 pr-3">Fecha</th>
              <th className="pb-2 pr-3 text-right">Sesiones</th>
              <th className="pb-2 pr-3 text-right">Auth</th>
              <th className="pb-2 pr-3 text-right">Acción útil</th>
              <th className="pb-2 pr-3 text-right">Estudio</th>
              <th className="pb-2 pr-3 text-right">PDF</th>
              <th className="pb-2 text-right">Volvió</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const authPct = row.sessions > 0 ? (row.authenticated / row.sessions) * 100 : 0;
              const usefulPct = row.sessions > 0 ? (row.usefulAction / row.sessions) * 100 : 0;
              return (
                <tr key={row.date} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-3 font-semibold text-slate-700">
                    {new Date(`${row.date}T12:00:00-03:00`).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-slate-900">{row.sessions}</td>
                  <td className="py-3 pr-3 text-right text-slate-600">
                    {row.authenticated} · {formatPct(authPct)}
                  </td>
                  <td className="py-3 pr-3 text-right text-slate-600">
                    {row.usefulAction} · {formatPct(usefulPct)}
                  </td>
                  <td className="py-3 pr-3 text-right text-slate-600">{row.meaningfulStudy}</td>
                  <td className="py-3 pr-3 text-right text-slate-600">{row.pdfUploaded}</td>
                  <td className="py-3 text-right text-slate-600">{row.returned}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  El histórico comienza el 20/09/2026. Todavía no hay días cerrados para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-slate-400">
        Este histórico usa sesiones orgánicas detectadas por Evaluo. Los clics e impresiones oficiales siguen midiéndose en Search Console.
      </p>
    </div>
  );
}

function LandingPanel({ detail }: { detail: AcquisitionSourceDetail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-bold text-slate-950">Dónde aterrizaron</p>
        <p className="mt-1 text-xs text-slate-500">Las páginas que reciben las entradas de este canal.</p>
      </div>

      {detail.landings.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                <th className="pb-2 pr-3">Landing</th>
                <th className="pb-2 pr-3 text-right">Entradas</th>
                <th className="pb-2 text-right">Peso</th>
              </tr>
            </thead>
            <tbody>
              {detail.landings.map((landing) => (
                <tr key={landing.path} className="border-b border-slate-100 last:border-0">
                  <td className="max-w-[430px] py-3 pr-3">
                    <span className="block truncate font-semibold text-slate-700" title={landing.path}>
                      {landing.path}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-slate-900">
                    {landing.entries.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-500">{formatPct(landing.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Todavía no hay landings para este canal.</div>
      )}
    </div>
  );
}

function SourceDetail({ detail, activePeriod }: { detail: AcquisitionSourceDetail; activePeriod: number }) {
  const meta = SOURCE_META[detail.source];
  const Icon = meta.icon;

  return (
    <section id="detalle" className="mt-6 scroll-mt-24 border-t border-slate-200 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.iconBg}`}>
            <Icon className={`h-5 w-5 ${meta.iconClass}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Detalle del canal</p>
            <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950">{meta.label}</h3>
          </div>
        </div>
        <Link
          href={`/administrador?panel=adquisicion&period=${activePeriod}`}
          className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al overview
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Entradas</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">{detail.entries.toLocaleString('es-AR')}</p>
          <p className="mt-1 text-xs text-slate-400">{formatPct(detail.pct)} del tráfico identificado</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Entraron sin login</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            {detail.anonymousEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {detail.entries > 0 ? formatPct((detail.anonymousEntries / detail.entries) * 100) : '0,0%'} de las entradas
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Variación</p>
          <div className="mt-2">
            <GrowthBadge trend={detail.trend} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <GrowthCopy trend={detail.trend} />
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Período anterior</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            {detail.trend.previousEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">entradas comparables</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Usuarios identificados</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            {detail.identifiedUsers.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">asociados a estas entradas</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <EvolutionChart detail={detail} />
        <LandingPanel detail={detail} />
      </div>

      <div className="mt-3">
        <BehaviorPanel detail={detail} />
      </div>

      <div className="mt-3">
        <SeoHistoryPanel detail={detail} />
      </div>
    </section>
  );
}

export function AcquisitionPanel({
  stats,
  activePeriod,
  selectedSource,
}: {
  stats: AcquisitionOverviewStats;
  activePeriod: number;
  selectedSource: AcquisitionSourceKey | null;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Adquisición</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">De dónde están llegando los usuarios y cómo cambia cada canal.</p>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/administrador?panel=adquisicion&period=${option.value}${
                selectedSource ? `&source=${selectedSource}#detalle` : ''
              }`}
              className={`inline-flex min-h-10 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition ${
                option.value === activePeriod
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Entradas registradas</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {stats.totalEntries.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Origen identificado</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {stats.recognizedEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.totalEntries > 0 ? formatPct((stats.recognizedEntries / stats.totalEntries) * 100) : '0,0%'} del total
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Sin clasificar</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {stats.unclassifiedEntries.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.sources.map((item) => (
          <SourceCard
            key={item.source}
            item={item}
            period={activePeriod}
            selected={item.source === selectedSource}
          />
        ))}
      </div>

      {stats.detail ? <SourceDetail detail={stats.detail} activePeriod={activePeriod} /> : null}
    </section>
  );
}

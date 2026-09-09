import Link from 'next/link';
import { ArrowRight, Instagram, Linkedin, MessageCircle, Search } from 'lucide-react';
import type {
  AcquisitionOverviewStats,
  AcquisitionSourceKey,
  AcquisitionSourceStats,
} from './acquisition-actions';

const SOURCE_META: Record<
  AcquisitionSourceKey,
  {
    label: string;
    helper: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    iconBg: string;
  }
> = {
  google: {
    label: 'Google',
    helper: 'Orgánico por referrer',
    icon: Search,
    iconClass: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
  whatsapp: {
    label: 'WhatsApp',
    helper: 'utm_source=whatsapp',
    icon: MessageCircle,
    iconClass: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
  },
  instagram: {
    label: 'Instagram',
    helper: 'utm_source=instagram',
    icon: Instagram,
    iconClass: 'text-fuchsia-700',
    iconBg: 'bg-fuchsia-50',
  },
  linkedin: {
    label: 'LinkedIn',
    helper: 'utm_source=linkedin',
    icon: Linkedin,
    iconClass: 'text-sky-700',
    iconBg: 'bg-sky-50',
  },
};

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
] as const;

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
      href={`/administrador?panel=adquisicion&period=${period}&source=${item.source}`}
      className={`group rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.iconBg}`}>
          <Icon className={`h-5 w-5 ${meta.iconClass}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-slate-950">{meta.label}</p>
        <p className="mt-1 text-xs text-slate-500">{meta.helper}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Entradas</p>
          <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            {item.entries.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-indigo-600">{item.pct.toFixed(1)}%</p>
          <p className="mt-0.5 text-[11px] text-slate-400">del identificado</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Principal landing</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-600" title={item.topLanding ?? undefined}>
          {item.topLanding ?? 'Sin datos todavía'}
        </p>
      </div>
    </Link>
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
  const selected = selectedSource
    ? stats.sources.find((item) => item.source === selectedSource) ?? null
    : null;

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Adquisición</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Identificamos desde qué canal entra cada visita antes de analizar qué hace dentro de Evaluo.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/administrador?panel=adquisicion&period=${option.value}${
                selectedSource ? `&source=${selectedSource}` : ''
              }`}
              className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold transition ${
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
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Sin clasificar</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {stats.unclassifiedEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">Sirve para detectar links sin UTM.</p>
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

      {selected ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
          <p className="text-sm font-bold text-slate-900">Detalle de {SOURCE_META[selected.source].label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            La tarjeta ya queda enlazada. En la siguiente etapa agregamos aquí el comportamiento de estos usuarios después de entrar.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Para WhatsApp, Instagram y LinkedIn solo hace falta agregar <strong>utm_source</strong> al link. Google se reconoce por el origen de la visita.
      </p>
    </section>
  );
}

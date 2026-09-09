import Link from 'next/link';
import {
  ArrowRight,
  CircleHelp,
  Instagram,
  Linkedin,
  MessageCircle,
  Search,
} from 'lucide-react';
import type {
  AcquisitionOverviewStats,
  AcquisitionSourceKey,
  AcquisitionSourceStats,
} from './marketing-actions';

const SOURCE_META: Record<
  AcquisitionSourceKey,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    iconBg: string;
  }
> = {
  google: {
    label: 'Google',
    description: 'Tráfico orgánico detectado por referrer.',
    icon: Search,
    iconClass: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  whatsapp: {
    label: 'WhatsApp',
    description: 'Links con utm_source=whatsapp.',
    icon: MessageCircle,
    iconClass: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  instagram: {
    label: 'Instagram',
    description: 'Links con utm_source=instagram.',
    icon: Instagram,
    iconClass: 'text-fuchsia-600',
    iconBg: 'bg-fuchsia-50',
  },
  linkedin: {
    label: 'LinkedIn',
    description: 'Links con utm_source=linkedin.',
    icon: Linkedin,
    iconClass: 'text-sky-700',
    iconBg: 'bg-sky-50',
  },
};

const PERIOD_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '2 meses' },
] as const;

function SourceCard({
  source,
  period,
  selected,
}: {
  source: AcquisitionSourceStats;
  period: number;
  selected: boolean;
}) {
  const meta = SOURCE_META[source.source];
  const Icon = meta.icon;

  return (
    <Link
      href={`/administrador?panel=marketing&period=${period}&source=${source.source}`}
      className={`group rounded-[18px] border bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
        selected ? 'border-[#315efb] ring-2 ring-[#315efb]/10' : 'border-[#e7ebf4]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.iconBg}`}>
          <Icon className={`h-5 w-5 ${meta.iconClass}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-[#b0b9cc] transition group-hover:translate-x-0.5 group-hover:text-[#315efb]" />
      </div>

      <div className="mt-5">
        <p className="text-[14px] font-semibold text-[#1d2a44]">{meta.label}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#8a95aa]">{meta.description}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#eef1f6] pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#a0a9bb]">Entradas</p>
          <p className="mt-1 text-[1.7rem] font-semibold leading-none tracking-[-0.05em] text-[#1d2a44]">
            {source.entries.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold text-[#315efb]">{source.pct.toFixed(1)}%</p>
          <p className="mt-0.5 text-[11px] text-[#9aa5b8]">del tráfico identificado</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#f8f9fc] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a0a9bb]">Principal landing</p>
        <p className="mt-1 truncate text-[12px] font-medium text-[#64718b]" title={source.topLanding ?? undefined}>
          {source.topLanding ?? 'Sin datos todavía'}
        </p>
      </div>
    </Link>
  );
}

export function MarketingPanel({
  stats,
  activePeriod,
  activePeriodLabel,
  selectedSource,
}: {
  stats: AcquisitionOverviewStats;
  activePeriod: number;
  activePeriodLabel: string;
  selectedSource: AcquisitionSourceKey | null;
}) {
  const selected = selectedSource
    ? stats.sources.find((item) => item.source === selectedSource) ?? null
    : null;

  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Adquisición</p>
          <p className="mt-1 text-[14px] text-[#7f8aa3]">
            De dónde llegan los usuarios a Evaluo. Por ahora medimos Google, WhatsApp, Instagram y LinkedIn.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#e7ebf4] bg-white p-1">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option.value === activePeriod;
            return (
              <Link
                key={option.value}
                href={`/administrador?panel=marketing&period=${option.value}${
                  selectedSource ? `&source=${selectedSource}` : ''
                }`}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  isActive
                    ? 'bg-[#eef3ff] text-[#315efb]'
                    : 'text-[#6f7c96] hover:bg-[#f5f7fb] hover:text-[#1d2a44]'
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-[#e7ebf4] bg-white px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9da7b9]">Entradas registradas</p>
          <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            {stats.totalEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-[12px] text-[#8b96aa]">{activePeriodLabel.toLowerCase()}</p>
        </div>
        <div className="rounded-[16px] border border-[#e7ebf4] bg-white px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9da7b9]">Origen identificado</p>
          <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            {stats.recognizedEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-[12px] text-[#8b96aa]">Google + links con UTM</p>
        </div>
        <div className="rounded-[16px] border border-[#e7ebf4] bg-white px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9da7b9]">Sin clasificar</p>
          <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            {stats.unclassifiedEntries.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-[12px] text-[#8b96aa]">Útil para detectar links sin UTM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.sources.map((source) => (
          <SourceCard
            key={source.source}
            source={source}
            period={activePeriod}
            selected={source.source === selectedSource}
          />
        ))}
      </div>

      {selected ? (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#d9dfeb] bg-white px-6 py-7">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f5f9] text-[#7c879c]">
              <CircleHelp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1d2a44]">Detalle de {SOURCE_META[selected.source].label}</p>
              <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#7f8aa3]">
                La tarjeta ya queda preparada para abrir su análisis. En el siguiente paso vamos a sumar qué hacen estos usuarios después de entrar, sin mezclar todavía métricas que no necesitamos.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[16px] border border-[#e7ebf4] bg-[#fbfcfe] px-4 py-3 text-[12px] leading-5 text-[#7f8aa3]">
        Para WhatsApp, Instagram y LinkedIn alcanza con agregar <span className="font-semibold text-[#4f5d76]">utm_source</span> al link. Google se reconoce automáticamente por el origen de la visita.
      </div>
    </section>
  );
}

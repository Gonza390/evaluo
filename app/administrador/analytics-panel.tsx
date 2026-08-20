'use client';

import Link from 'next/link';

interface AnalyticsPanelProps {
  activePeriodLabel: string;
  activePeriod: number;
  selectedMateriaId: string;
  metricPeriods: {
    newRegistrations: 1 | 7 | 30;
    answered: 1 | 7 | 30;
    simulatorAttempts: 1 | 7 | 30;
  };
    stats: {
    usersActive: number;
    usersActiveTrendPct: number;
    loginToday: number;
    loginTopSources: Array<{ label: string; value: number }>;
    loginDevices: Array<{ name: string; value: number }>;
    newRegistrations: number;
    newRegistrationsTrendPct: number;
    answeredToday: number;
    answeredTodayTrendPct: number;
    simulatorAttempts: number;
    simulatorAttemptsTrendPct: number;
    topPages: Array<{ path: string; views: number }>;
    topMaterias: Array<{ id: string; name: string; views: number; color: string; value: number }>;
    devices: Array<{ name: string; value: number; color: string }>;
    funnel: Array<{ step: string; value: number }>;
  };
  materiaDetail: {
    materiaId: string;
    materiaNombre: string;
    totalVisitas: number;
    directLinkEntries: number;
    careerSources: Array<{ label: string; value: number; pct: number }>;
    mobilePct: number;
    loggedPct: number;
    anonymousPct: number;
    actions: Array<{ label: string; value: number; pct: number }>;
    sharedLinkActions: Array<{ label: string; value: number; pct: number }>;
    partials: Array<{
      parcial: number;
      answeredQuestions: number;
      averageScore: number;
      attempts: number;
    }>;
  } | null;
}

type MetricFilterKey =
  | 'analyticsNewRegistrations'
  | 'analyticsAnswered'
  | 'analyticsSimulators';

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-[#1d2a44]">{title}</h3>
          {description ? <p className="mt-1 text-[13px] text-[#7f8aa3]">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricFilter({
  filterKey,
  activeValue,
  hrefBuilder,
}: {
  filterKey: MetricFilterKey;
  activeValue: 1 | 7 | 30;
  hrefBuilder: (key: MetricFilterKey, value: 1 | 7 | 30) => string;
}) {
  const options = [
    { value: 1 as const, label: 'Hoy' },
    { value: 7 as const, label: '7d' },
    { value: 30 as const, label: '30d' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-[#e5ebf8] bg-white p-0.5">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefBuilder(filterKey, option.value)}
          className={`rounded-full px-2 py-1 text-[12px] font-medium transition ${
            activeValue === option.value
              ? 'bg-white text-[#2563EB]'
              : 'text-[#7f8aa3] hover:bg-white hover:text-[#1d2a44]'
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  value,
  trend,
  caption,
  filterKey,
  filterValue,
  hrefBuilder,
}: {
  label: string;
  value: string;
  trend: string;
  caption?: string;
  filterKey?: MetricFilterKey;
  filterValue?: 1 | 7 | 30;
  hrefBuilder?: (key: MetricFilterKey, value: 1 | 7 | 30) => string;
}) {
  return (
    <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
        {filterKey && filterValue && hrefBuilder ? (
          <MetricFilter filterKey={filterKey} activeValue={filterValue} hrefBuilder={hrefBuilder} />
        ) : null}
      </div>
      <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">{value}</p>
      <p className={`mt-2 text-[12px] font-semibold ${trend.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>{trend}</p>
      {caption ? <p className="mt-1 text-[12px] text-[#667085]">{caption}</p> : null}
    </div>
  );
}

function pct(current: number, base: number) {
  if (base === 0) return current > 0 ? '100%' : '0%';
  return `${Math.round((current / base) * 100)}%`;
}

function metricPeriodLabel(value: 1 | 7 | 30) {
  if (value === 1) return 'hoy';
  if (value === 7) return 'últimos 7 días';
  return 'últimos 30 días';
}

function metricTrendCaption(value: 1 | 7 | 30) {
  if (value === 1) return 'vs. ayer';
  if (value === 7) return 'vs. 7 días previos';
  return 'vs. 30 días previos';
}

export function AnalyticsPanel({
  activePeriodLabel,
  activePeriod,
  selectedMateriaId,
  metricPeriods,
  stats,
  materiaDetail,
}: AnalyticsPanelProps) {
  const funnelBase = stats.funnel[0]?.value ?? 0;

  const buildAnalyticsHref = (
    overrides: Partial<Record<MetricFilterKey | 'analyticsMateria' | 'panel' | 'period', string>>
  ) => {
    const params = new URLSearchParams({
      panel: 'analiticas',
      period: String(activePeriod),
      analyticsNewRegistrations: String(metricPeriods.newRegistrations),
      analyticsAnswered: String(metricPeriods.answered),
      analyticsSimulators: String(metricPeriods.simulatorAttempts),
    });

    if (selectedMateriaId) {
      params.set('analyticsMateria', selectedMateriaId);
    }

    for (const [key, value] of Object.entries(overrides)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }

    return `/administrador?${params.toString()}`;
  };

  const buildMetricHref = (key: MetricFilterKey, value: 1 | 7 | 30) =>
    buildAnalyticsHref({ [key]: String(value) });

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#667085]">Resumen ejecutivo</p>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <MiniStat
            label="Usuarios activos hoy"
            value={stats.usersActive.toLocaleString('es-AR')}
            trend={`${stats.usersActiveTrendPct >= 0 ? '+' : ''}${stats.usersActiveTrendPct.toFixed(1)}%`}
            caption="vs. ayer"
          />
          <MiniStat
            label={`Nuevos registros (${metricPeriodLabel(metricPeriods.newRegistrations)})`}
            value={stats.newRegistrations.toLocaleString('es-AR')}
            trend={`${stats.newRegistrationsTrendPct >= 0 ? '+' : ''}${stats.newRegistrationsTrendPct.toFixed(1)}%`}
            caption={metricTrendCaption(metricPeriods.newRegistrations)}
            filterKey="analyticsNewRegistrations"
            filterValue={metricPeriods.newRegistrations}
            hrefBuilder={buildMetricHref}
          />
          <MiniStat
            label={`Preguntas respondidas (${metricPeriodLabel(metricPeriods.answered)})`}
            value={stats.answeredToday.toLocaleString('es-AR')}
            trend={`${stats.answeredTodayTrendPct >= 0 ? '+' : ''}${stats.answeredTodayTrendPct.toFixed(1)}%`}
            caption={metricTrendCaption(metricPeriods.answered)}
            filterKey="analyticsAnswered"
            filterValue={metricPeriods.answered}
            hrefBuilder={buildMetricHref}
          />
          <MiniStat
            label={`Simuladores realizados (${metricPeriodLabel(metricPeriods.simulatorAttempts)})`}
            value={stats.simulatorAttempts.toLocaleString('es-AR')}
            trend={`${stats.simulatorAttemptsTrendPct >= 0 ? '+' : ''}${stats.simulatorAttemptsTrendPct.toFixed(1)}%`}
            caption={metricTrendCaption(metricPeriods.simulatorAttempts)}
            filterKey="analyticsSimulators"
            filterValue={metricPeriods.simulatorAttempts}
            hrefBuilder={buildMetricHref}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
            <p className="text-[12px] font-medium text-[#7f8aa3]">Top 3 lugares de login</p>
            <div className="mt-3 space-y-2">
              {stats.loginTopSources.length === 0 ? (
                <p className="text-[12px] text-[#667085]">Sin datos de hoy</p>
              ) : (
                stats.loginTopSources.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="truncate text-[#4b5874]">{item.label}</span>
                    <span className="font-semibold text-[#1d2a44]">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
          <p className="text-[12px] font-medium text-[#7f8aa3]">Dispositivo de nuevos logins</p>
          <div className="mt-3 space-y-2">
            {stats.loginDevices.length === 0 ? (
              <p className="text-[12px] text-[#667085]">Sin datos de hoy</p>
            ) : (
              stats.loginDevices.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#4b5874]">{item.name}</span>
                  <span className="font-semibold text-[#1d2a44]">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Recorrido de páginas (sesiones)" description={`Lectura del recorrido principal en ${activePeriodLabel.toLowerCase()}.`}>
          <div className="space-y-3">
            {stats.funnel.map((item) => (
              <div key={item.step}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#4b5874]">{item.step}</span>
                  <span className="text-[#7f8aa3]">
                    {item.value.toLocaleString('es-AR')} · {pct(item.value, funnelBase)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-[#2f66ea]"
                    style={{ width: `${funnelBase > 0 ? Math.max((item.value / funnelBase) * 100, 4) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top páginas" description="Qué superficies del producto concentran más tráfico.">
          <div className="space-y-3">
            {stats.topPages.map((item, index) => (
              <div key={`${item.path}-${index}`} className="flex items-center justify-between rounded-[14px] border border-[#edf1f7] px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#1d2a44]">{item.path || '/'}</p>
                  <p className="mt-1 text-[12px] text-[#8b95aa]">Posicion #{index + 1}</p>
                </div>
                <span className="text-[12px] font-semibold text-[#2f66ea]">{item.views.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SectionCard title="Materias y dispositivos" description="Demanda académica y distribución técnica.">
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#667085]">Materias más visitadas</p>
              <div className="space-y-2">
                {stats.topMaterias.map((item) => (
                  <Link
                    key={item.id}
                    href={buildAnalyticsHref({ analyticsMateria: item.id })}
                    className={`flex items-center justify-between rounded-[12px] border px-3 py-2 text-[12px] transition ${
                      selectedMateriaId === item.id
                        ? 'border-[#cfd9f7] bg-white'
                        : 'border-transparent hover:border-[#e5ebf8] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#4b5874]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#1d2a44]">{item.views.toLocaleString('es-AR')}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#667085]">Dispositivos</p>
              <div className="space-y-2">
                {stats.devices.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#4b5874]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#1d2a44]">{item.value.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {materiaDetail ? (
        <SectionCard
          title={`Detalle de ${materiaDetail.materiaNombre}`}
          description={`Lectura puntual de la materia más visitada en ${activePeriodLabel.toLowerCase()}.`}
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-[#7f8aa3]">Origen por carrera</p>
                  <span className="text-[12px] font-semibold text-[#1d2a44]">
                    {materiaDetail.totalVisitas.toLocaleString('es-AR')} visitas
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {materiaDetail.careerSources.length === 0 ? (
                    <p className="text-[12px] text-[#667085]">Todavía no detectamos carreras de entrada.</p>
                  ) : (
                    materiaDetail.careerSources.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="truncate text-[#4b5874]">{item.label}</span>
                          <span className="font-semibold text-[#1d2a44]">
                            {item.pct.toFixed(1)}% · {item.value}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white">
                          <div
                            className="h-2 rounded-full bg-[#2f66ea]"
                            style={{ width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
                <p className="text-[12px] font-medium text-[#7f8aa3]">Qué hicieron después de entrar</p>
                <div className="mt-3 space-y-2">
                  {materiaDetail.actions.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#4b5874]">{item.label}</span>
                        <span className="font-semibold text-[#1d2a44]">
                          {item.pct.toFixed(1)}% · {item.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div
                          className="h-2 rounded-full bg-[#9b5de5]"
                          style={{ width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-[#7f8aa3]">Entradas por link directo a la materia</p>
                  <span className="text-[12px] font-semibold text-[#1d2a44]">
                    {materiaDetail.directLinkEntries.toLocaleString('es-AR')} ingresos
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {materiaDetail.sharedLinkActions.length === 0 ? (
                    <p className="text-[12px] text-[#667085]">
                      Aun no hay acciones detectadas desde ingresos directos a esta materia.
                    </p>
                  ) : (
                    materiaDetail.sharedLinkActions.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-[#4b5874]">{item.label}</span>
                          <span className="font-semibold text-[#1d2a44]">
                            {item.pct.toFixed(1)}% · {item.value}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white">
                          <div
                            className="h-2 rounded-full bg-[#16a34a]"
                            style={{ width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <MiniStat label="Ingreso móvil" value={`${materiaDetail.mobilePct.toFixed(1)}%`} trend="del total de visitas" />
                <MiniStat label="Logueados" value={`${materiaDetail.loggedPct.toFixed(1)}%`} trend="del total de visitas" />
                <MiniStat label="Anónimos" value={`${materiaDetail.anonymousPct.toFixed(1)}%`} trend="del total de visitas" />
              </div>

              <div className="rounded-[16px] border border-[#edf1f7] bg-white px-4 py-4">
                <p className="text-[12px] font-medium text-[#7f8aa3]">Rendimiento por parcial</p>
                <div className="mt-3 space-y-2">
                  {materiaDetail.partials.map((item) => (
                    <div key={item.parcial} className="rounded-[12px] border border-[#edf1f7] bg-white px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold text-[#1d2a44]">Parcial {item.parcial}</span>
                        <span className="text-[12px] text-[#7f8aa3]">{item.attempts} simuladores</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
                        <div>
                          <p className="text-[#7f8aa3]">Preguntas respondidas</p>
                          <p className="mt-1 font-semibold text-[#1d2a44]">
                            {item.answeredQuestions.toLocaleString('es-AR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#7f8aa3]">Nota general</p>
                          <p className="mt-1 font-semibold text-[#1d2a44]">{item.averageScore.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

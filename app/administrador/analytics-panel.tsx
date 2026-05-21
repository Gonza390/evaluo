'use client';

import Link from 'next/link';

interface AnalyticsPanelProps {
  activePeriodLabel: string;
  activePeriod: number;
  selectedMateriaId: string;
  stats: {
    usersActive: number;
    usersActiveTrendPct: number;
    anonymousToday: number;
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
    careerSources: Array<{ label: string; value: number; pct: number }>;
    mobilePct: number;
    loggedPct: number;
    anonymousPct: number;
    actions: Array<{ label: string; value: number; pct: number }>;
    partials: Array<{
      parcial: number;
      answeredQuestions: number;
      averageScore: number;
      attempts: number;
    }>;
  } | null;
}

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

function MiniStat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">{value}</p>
      <p className="mt-2 text-[12px] font-semibold text-emerald-600">{trend}</p>
    </div>
  );
}

function pct(current: number, base: number) {
  if (base === 0) return current > 0 ? '100%' : '0%';
  return `${Math.round((current / base) * 100)}%`;
}

export function AnalyticsPanel({
  activePeriodLabel,
  activePeriod,
  selectedMateriaId,
  stats,
  materiaDetail,
}: AnalyticsPanelProps) {
  const funnelBase = stats.funnel[0]?.value ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#98a3bb]">Resumen ejecutivo</p>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <MiniStat
            label="Usuarios activos hoy"
            value={stats.usersActive.toLocaleString('es-AR')}
            trend={`${stats.usersActiveTrendPct >= 0 ? '+' : ''}${stats.usersActiveTrendPct.toFixed(1)}% vs. ayer`}
          />
          <MiniStat
            label={`Nuevos registros (${activePeriodLabel})`}
            value={stats.newRegistrations.toLocaleString('es-AR')}
            trend={`${stats.newRegistrationsTrendPct >= 0 ? '+' : ''}${stats.newRegistrationsTrendPct.toFixed(1)}%`}
          />
          <MiniStat
            label="Preguntas respondidas hoy"
            value={stats.answeredToday.toLocaleString('es-AR')}
            trend={`${stats.answeredTodayTrendPct >= 0 ? '+' : ''}${stats.answeredTodayTrendPct.toFixed(1)}% vs. ayer`}
          />
          <MiniStat
            label={`Simuladores realizados (${activePeriodLabel})`}
            value={stats.simulatorAttempts.toLocaleString('es-AR')}
            trend={`${stats.simulatorAttemptsTrendPct >= 0 ? '+' : ''}${stats.simulatorAttemptsTrendPct.toFixed(1)}%`}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <MiniStat
            label="Anónimos hoy"
            value={stats.anonymousToday.toLocaleString('es-AR')}
            trend="Usuarios sin login"
          />
          <MiniStat
            label="Se loguearon hoy"
            value={stats.loginToday.toLocaleString('es-AR')}
            trend="Ingresaron desde anónimo"
          />
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <p className="text-[12px] font-medium text-[#7f8aa3]">Top 3 lugares de login</p>
            <div className="mt-3 space-y-2">
              {stats.loginTopSources.length === 0 ? (
                <p className="text-[12px] text-[#95a0b8]">Sin datos de hoy</p>
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
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <p className="text-[12px] font-medium text-[#7f8aa3]">Dispositivo de nuevos logins</p>
            <div className="mt-3 space-y-2">
              {stats.loginDevices.length === 0 ? (
                <p className="text-[12px] text-[#95a0b8]">Sin datos de hoy</p>
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
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Funnel de navegación" description={`Lectura del recorrido principal en ${activePeriodLabel.toLowerCase()}.`}>
          <div className="space-y-3">
            {stats.funnel.map((item) => (
              <div key={item.step}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#4b5874]">{item.step}</span>
                  <span className="text-[#7f8aa3]">
                    {item.value.toLocaleString('es-AR')} · {pct(item.value, funnelBase)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#edf1f7]">
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
                  <p className="mt-1 text-[11px] text-[#8b95aa]">Posición #{index + 1}</p>
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
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#98a3bb]">Materias más visitadas</p>
              <div className="space-y-2">
                {stats.topMaterias.map((item) => (
                  <Link
                    key={item.id}
                    href={`/administrador?panel=analiticas&period=${activePeriod}&analyticsMateria=${item.id}`}
                    className={`flex items-center justify-between rounded-[12px] border px-3 py-2 text-[12px] transition ${
                      selectedMateriaId === item.id
                        ? 'border-[#cfd9f7] bg-[#f5f8ff]'
                        : 'border-transparent hover:border-[#e5ebf8] hover:bg-[#fbfcff]'
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
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#98a3bb]">Dispositivos</p>
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
              <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-[#7f8aa3]">Origen por carrera</p>
                  <span className="text-[12px] font-semibold text-[#1d2a44]">
                    {materiaDetail.totalVisitas.toLocaleString('es-AR')} visitas
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {materiaDetail.careerSources.length === 0 ? (
                    <p className="text-[12px] text-[#95a0b8]">Todavía no detectamos carreras de entrada.</p>
                  ) : (
                    materiaDetail.careerSources.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="truncate text-[#4b5874]">{item.label}</span>
                          <span className="font-semibold text-[#1d2a44]">
                            {item.pct.toFixed(1)}% · {item.value}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#edf1f7]">
                          <div className="h-2 rounded-full bg-[#2f66ea]" style={{ width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
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
                      <div className="h-2 rounded-full bg-[#edf1f7]">
                        <div className="h-2 rounded-full bg-[#9b5de5]" style={{ width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <MiniStat label="Ingreso móvil" value={`${materiaDetail.mobilePct.toFixed(1)}%`} trend="del total de visitas" />
                <MiniStat label="Logueados" value={`${materiaDetail.loggedPct.toFixed(1)}%`} trend="del total de visitas" />
                <MiniStat label="Anónimos" value={`${materiaDetail.anonymousPct.toFixed(1)}%`} trend="del total de visitas" />
              </div>

              <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
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
                          <p className="mt-1 font-semibold text-[#1d2a44]">{item.answeredQuestions.toLocaleString('es-AR')}</p>
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

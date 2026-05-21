import Link from 'next/link';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import {
  BarChart3,
  BookOpen,
  Bot,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Users,
  Waypoints,
} from 'lucide-react';
import {
  obtenerBibliotecaFormularioAdministrador,
  obtenerBibliotecaResumenAdministrador,
  obtenerDetalleMateriaAnaliticaAdministrador,
  obtenerLogsAdministrador,
  obtenerResumenAdministrador,
  obtenerUsuariosAdministrador,
} from './actions';
import { AnalyticsPanel } from './analytics-panel';
import { BibliotecaPanel } from './biblioteca-panel';
import { DashboardInsights } from './dashboard-insights';
import { IAPanel } from './ia-panel';
import { LogsPanel } from './logs-panel';
import { UsersPanel } from './users-panel';
import { requireAdminAccess } from '@/lib/auth';

type PanelKey =
  | 'dashboard'
  | 'biblioteca'
  | 'usuarios'
  | 'analiticas'
  | 'marketing'
  | 'logs'
  | 'ia';

const PANELS: Array<{
  key: PanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'analiticas', label: 'Analiticas', icon: BarChart3 },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'logs', label: 'Logs', icon: Waypoints },
  { key: 'ia', label: 'IA', icon: Bot },
];

const PERIOD_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '2 meses' },
] as const;

function formatSignedPercent(value: number) {
  const signal = value >= 0 ? '+' : '';
  return `${signal}${value.toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  trend,
  tone,
  caption = 'vs. período anterior',
}: {
  label: string;
  value: string;
  trend: string;
  tone: 'blue' | 'green' | 'violet' | 'orange';
  caption?: string;
}) {
  const tones = {
    blue: {
      halo: 'bg-blue-50 text-blue-600',
      trend: 'text-emerald-600',
    },
    green: {
      halo: 'bg-emerald-50 text-emerald-600',
      trend: 'text-emerald-600',
    },
    violet: {
      halo: 'bg-violet-50 text-violet-600',
      trend: 'text-emerald-600',
    },
    orange: {
      halo: 'bg-orange-50 text-orange-600',
      trend: 'text-emerald-600',
    },
  } as const;

  return (
    <article className="rounded-[16px] border border-[#e8ebf3] bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${tones[tone].halo}`}>
        <LineChart className="h-3.5 w-3.5" />
      </div>
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className="mt-1.5 text-[1.4rem] font-semibold leading-none tracking-[-0.04em] text-[#1d2a44]">
        {value}
      </p>
      <p className={`mt-2.5 text-[12px] font-semibold ${tones[tone].trend}`}>{trend}</p>
      <p className="mt-0.5 text-[12px] text-[#95a0b8]">{caption}</p>
    </article>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="rounded-[22px] border border-dashed border-[#d8deea] bg-white px-6 py-10 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-[#98a3bb]">{title}</p>
      <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
        Panel en construcción
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#7f8aa3]">
        Dejé esta sección vacía a propósito para que la armemos con calma en la siguiente iteración.
      </p>
    </section>
  );
}

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<{ panel?: string; period?: string; users?: string; analyticsMateria?: string }>;
}) {
  const [{ user }, rawSearchParams] = await Promise.all([
    requireAdminAccess(),
    searchParams ?? Promise.resolve({}),
  ]);
  const resolvedSearchParams = (rawSearchParams ?? {}) as {
    panel?: string;
    period?: string;
    users?: string;
    analyticsMateria?: string;
  };

  const requestedPanel = resolvedSearchParams.panel;
  const showAllUsers = resolvedSearchParams.users === 'all';
  const selectedAnalyticsMateriaId = String(resolvedSearchParams.analyticsMateria ?? '').trim();
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'dashboard';
  const activePanelMeta = PANELS.find((panel) => panel.key === activePanel) ?? PANELS[0];
  const requestedPeriod = Number(resolvedSearchParams.period ?? 30);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 30;
  const activePeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === activePeriod)?.label ?? '30 días';
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsStats = activePanel === 'dashboard' || activePanel === 'analiticas';
  const needsUsers = activePanel === 'usuarios';
  const needsLogs = activePanel === 'logs';
  const needsIA = activePanel === 'ia';
  const [
    statsResult,
    usersResult,
    bibliotecaResult,
    bibliotecaStatsResult,
    logsResult,
    analyticsMateriaResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
  ] =
    await Promise.all([
      needsStats ? obtenerResumenAdministrador(activePeriod) : Promise.resolve(null),
      needsUsers ? obtenerUsuariosAdministrador(250) : Promise.resolve(null),
      needsBiblioteca ? obtenerBibliotecaFormularioAdministrador() : Promise.resolve(null),
      needsBiblioteca ? obtenerBibliotecaResumenAdministrador() : Promise.resolve(null),
      needsLogs ? obtenerLogsAdministrador() : Promise.resolve(null),
      activePanel === 'analiticas' && selectedAnalyticsMateriaId
        ? obtenerDetalleMateriaAnaliticaAdministrador(selectedAnalyticsMateriaId, activePeriod)
        : Promise.resolve(null),
      needsIA ? obtenerPromptSistema() : Promise.resolve(null),
      needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
      needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
      needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    ]);

  if (needsStats && (!statsResult?.success || !statsResult.stats)) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {statsResult?.message ?? 'Probá nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (needsUsers && (!usersResult?.success || !usersResult.stats || !usersResult.rows)) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {usersResult?.message ?? 'ProbÃ¡ nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (
    needsBiblioteca &&
    (!bibliotecaResult?.success ||
      !bibliotecaResult.universidades ||
      !bibliotecaResult.carreras ||
      !bibliotecaResult.materias ||
      !bibliotecaStatsResult?.success ||
      !bibliotecaStatsResult.stats)
  ) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {bibliotecaResult?.message ?? 'Probá nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (
    needsLogs &&
    (!logsResult?.success || !logsResult.data)
  ) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {logsResult?.message ?? 'Proba nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (
    needsIA &&
    (!iaPromptResult?.success ||
      !iaRankingResult?.success ||
      !iaFeedbackStatsResult?.success ||
      !iaFeedbackReviewResult?.success)
  ) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {iaPromptResult?.message ??
              iaRankingResult?.message ??
              iaFeedbackReviewResult?.message ??
              'Proba nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  const stats = statsResult?.stats ?? null;
  const adminName =
    String(user.user_metadata?.full_name ?? '').trim() || user.email?.split('@')[0] || 'Gonzalo';
  const topMateriaColors = ['#2f66ea', '#9b5de5', '#f59e0b', '#16c6b7'];
  const topMaterias = (stats?.topMaterias ?? []).map((item, index) => ({
    ...item,
    value: item.views,
    color: topMateriaColors[index % topMateriaColors.length],
  }));

  return (
      <main className="min-h-screen bg-[#f6f8fc] text-[#1d2a44]">
        <header className="fixed left-[184px] right-0 top-0 z-40 border-b border-[#e7ebf4] bg-white/95 backdrop-blur">
          <div className="flex h-[64px] items-center justify-between px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98a3bb]">Panel actual</p>
              <h1 className="mt-0.5 text-[1.1rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
                {activePanelMeta.label}
              </h1>
            </div>

            <div className="text-right">
              <p className="text-[14px] font-semibold text-[#1d2a44]">{adminName}</p>
              <p className="text-[12px] text-[#7f8aa3]">Administrador</p>
            </div>
          </div>
        </header>

        <aside className="fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] w-[184px] overflow-y-auto border-r border-[#e7ebf4] bg-white px-4 py-5">
          <div className="mb-6">
            <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Evaluo</p>
          </div>

          <nav className="space-y-1">
            {PANELS.map((panel) => {
              const Icon = panel.icon;
              const isActive = panel.key === activePanel;

              return (
                <Link
                  key={panel.key}
                  href={`/administrador?panel=${panel.key}&period=${activePeriod}`}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                    isActive
                      ? 'bg-[#eef3ff] text-[#315efb]'
                      : 'text-[#6f7c96] hover:bg-[#f5f7fb] hover:text-[#1d2a44]'
                  }`}
                >
                  <Icon className="h-[15px] w-[15px]" />
                  <span>{panel.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="pl-[184px] pt-[64px]">
          <div className="px-6 py-6">
            {activePanel === 'dashboard' && stats ? (
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Resumen general</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-[#e7ebf4] bg-white p-1">
                    {PERIOD_OPTIONS.map((option) => {
                      const isActive = option.value === activePeriod;
                      return (
                        <Link
                          key={option.value}
                          href={`/administrador?panel=${activePanel}&period=${option.value}`}
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

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                  <MetricCard
                    label="Usuarios activos hoy"
                    value={stats.usersActive.toLocaleString('es-AR')}
                    trend={formatSignedPercent(stats.usersActiveTrendPct)}
                    tone="blue"
                    caption="vs. ayer"
                  />
                  <MetricCard
                    label="Nuevos registros"
                    value={stats.newRegistrations.toLocaleString('es-AR')}
                    trend={formatSignedPercent(stats.newRegistrationsTrendPct)}
                    tone="green"
                  />
                  <MetricCard
                    label="Preguntas respondidas hoy"
                    value={stats.answeredToday.toLocaleString('es-AR')}
                    trend={formatSignedPercent(stats.answeredTodayTrendPct)}
                    tone="violet"
                    caption="vs. ayer"
                  />
                  <MetricCard
                    label="Simuladores realizados"
                    value={stats.simulatorAttempts.toLocaleString('es-AR')}
                    trend={formatSignedPercent(stats.simulatorAttemptsTrendPct)}
                    tone="orange"
                  />
                </div>

                <DashboardInsights
                  topMaterias={topMaterias}
                  devices={stats.devices}
                  visitorLoginSeries={stats.visitorLoginSeries}
                  recentActivity={stats.recentActivity}
                />

                <div className="mt-6 rounded-[22px] border border-dashed border-[#d8deea] bg-white px-6 py-12 text-center">
                  <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#98a3bb]">Siguiente bloque</p>
                  <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
                    Dejamos el resto vacío por ahora
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#7f8aa3]">
                    Mostrando datos de {activePeriodLabel.toLowerCase()}. El resto del dashboard lo vamos completando bloque por bloque.
                  </p>
                </div>
              </section>
            ) : activePanel === 'analiticas' && stats ? (
              <section>
                <div className="mb-5">
                  <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Analíticas</p>
                  <p className="mt-1 text-[14px] text-[#7f8aa3]">
                    Vista de uso, funnel y concentración de demanda para tomar decisiones de producto y contenido.
                  </p>
                </div>

                <AnalyticsPanel
                  activePeriodLabel={activePeriodLabel}
                  activePeriod={activePeriod}
                  selectedMateriaId={selectedAnalyticsMateriaId}
                  stats={{
                    usersActive: stats.usersActive,
                    usersActiveTrendPct: stats.usersActiveTrendPct,
                    anonymousToday: stats.anonymousToday,
                    loginToday: stats.loginToday,
                    loginTopSources: stats.loginTopSources,
                    loginDevices: stats.loginDevices,
                    newRegistrations: stats.newRegistrations,
                    newRegistrationsTrendPct: stats.newRegistrationsTrendPct,
                    answeredToday: stats.answeredToday,
                    answeredTodayTrendPct: stats.answeredTodayTrendPct,
                    simulatorAttempts: stats.simulatorAttempts,
                    simulatorAttemptsTrendPct: stats.simulatorAttemptsTrendPct,
                    topPages: stats.topPages,
                    topMaterias,
                    devices: stats.devices,
                    funnel: stats.funnel,
                  }}
                  materiaDetail={analyticsMateriaResult?.success ? analyticsMateriaResult.detail ?? null : null}
                />
              </section>
            ) : activePanel === 'biblioteca' &&
              bibliotecaResult?.universidades &&
              bibliotecaResult.carreras &&
              bibliotecaResult.materias ? (
              <BibliotecaPanel
                overview={bibliotecaStatsResult?.stats ?? { carrerasTotal: 0, materiasTotal: 0, preguntasTotal: 0 }}
                universidades={bibliotecaResult.universidades}
                carreras={bibliotecaResult.carreras}
                materias={bibliotecaResult.materias}
                carrerasSimuladores={bibliotecaResult.carrerasSimuladores ?? []}
              />
            ) : activePanel === 'usuarios' && usersResult?.stats && usersResult.rows ? (
              <UsersPanel stats={usersResult.stats} rows={usersResult.rows} showAll={showAllUsers} />
            ) : activePanel === 'logs' && logsResult?.data ? (
              <LogsPanel data={logsResult.data} />
            ) : activePanel === 'ia' && iaPromptResult?.success && iaRankingResult?.success && iaFeedbackReviewResult?.success ? (
              <IAPanel
                initialPrompt={iaPromptResult.data ?? ''}
                initialRankingRows={iaRankingResult.rows ?? []}
                initialFeedbackStats={
                  (iaFeedbackStatsResult as { stats?: { total: number; positive: number; negative: number } } | null)
                    ?.stats ?? null
                }
                initialFeedbackReviewRows={iaFeedbackReviewResult.rows ?? []}
              />
            ) : (
              <EmptyPanel title={activePanelMeta.label} />
            )}
          </div>
        </div>
      </main>
  );
}



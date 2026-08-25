import Link from 'next/link';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  LineChart,
  Megaphone,
  ShieldAlert,
  Users,
  Waypoints,
} from 'lucide-react';
import {
  obtenerBibliotecaFormularioAdministrador,
  obtenerBibliotecaResumenAdministrador,
  obtenerConversionAdministrador,
  obtenerDetalleMateriaAnaliticaAdministrador,
  obtenerLogsAdministrador,
  obtenerResumenAdministrador,
  obtenerSegmentacionUsuariosAdministrador,
  obtenerUsuariosAdministrador,
} from './actions';
import {
  AICostPanel,
  AnalyticsPanel,
  BibliotecaPanel,
  ConversionPanel,
  DashboardInsights,
  IAPanel,
  LogsPanel,
  UsersPanel,
} from './lazy-panels';
import { getAdminAccessContext } from '@/lib/access-control';

type PanelKey =
  | 'marketing'
  | 'dashboard'
  | 'analiticas'
  | 'biblioteca'
  | 'usuarios'
  | 'logs'
  | 'ia';

const PANELS: Array<{
  key: PanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'marketing', label: 'Producto', icon: Megaphone },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'logs', label: 'Logs', icon: Waypoints },
  { key: 'ia', label: 'IA', icon: Bot },
];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
] as const;

function normalizeMetricPeriod(value: string | undefined, fallback: 1 | 7 | 30): 1 | 7 | 30 {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 7 || parsed === 30) return parsed;
  return fallback;
}

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
    },
    green: {
      halo: 'bg-emerald-50 text-emerald-600',
    },
    violet: {
      halo: 'bg-violet-50 text-violet-600',
    },
    orange: {
      halo: 'bg-orange-50 text-orange-600',
    },
  } as const;

  const isPositive = !trend.startsWith('-');
  const trendClass = isPositive ? 'text-emerald-600' : 'text-rose-600';

  return (
    <article className="rounded-[16px] border border-[#e8ebf3] bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${tones[tone].halo}`}
      >
        <LineChart className="h-3.5 w-3.5" />
      </div>
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className="mt-1.5 text-[1.4rem] leading-none font-semibold tracking-[-0.04em] text-[#1d2a44]">
        {value}
      </p>
      <p className={`mt-2.5 text-[12px] font-semibold ${trendClass}`}>{trend}</p>
      <p className="mt-0.5 text-[12px] text-[#667085]">{caption}</p>
    </article>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="rounded-[22px] border border-dashed border-[#d8deea] bg-white px-6 py-10 text-center">
      <p className="text-[12px] font-medium tracking-[0.22em] text-[#667085] uppercase">{title}</p>
      <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
        Panel en construcción
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#7f8aa3]">
        Dejé esta sección vacía a propósito para que la armemos con calma en la siguiente iteración.
      </p>
    </section>
  );
}

function AdminAccessState({
  reason,
  message,
}: {
  reason: 'session_error' | 'unauthenticated' | 'forbidden';
  message: string;
}) {
  const title =
    reason === 'unauthenticated'
      ? 'Iniciá sesión para entrar al panel'
      : reason === 'forbidden'
        ? 'No tenés acceso a este panel'
        : 'No pudimos validar tu acceso';
  const description =
    reason === 'unauthenticated'
      ? 'El panel de administración solo está disponible para cuentas con permisos internos.'
      : reason === 'forbidden'
        ? 'Tu cuenta funciona bien, pero no tiene permisos de administrador. Volvé al dashboard para seguir usando la plataforma.'
        : 'Intenta nuevamente en unos minutos. Si el problema sigue, revisa tu sesión o el estado del servidor.';

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
      <section className="w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold tracking-[0.22em] text-slate-500 uppercase">
          Acceso restringido
        </p>
        <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.05em] text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={reason === 'unauthenticated' ? '/login?next=%2Fadministrador' : '/dashboard'}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {reason === 'unauthenticated' ? 'Iniciar sesión' : 'Volver al dashboard'}
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    panel?: string;
    period?: string;
    users?: string;
    analyticsMateria?: string;
    analyticsNewRegistrations?: string;
    analyticsAnswered?: string;
    analyticsSimulators?: string;
  }>;
}) {
  const [adminAccess, rawSearchParams] = await Promise.all([
    getAdminAccessContext(),
    searchParams ?? Promise.resolve({}),
  ]);

  if (!adminAccess.ok) {
    return <AdminAccessState reason={adminAccess.reason} message={adminAccess.message} />;
  }

  const { user } = adminAccess;
  const resolvedSearchParams = (rawSearchParams ?? {}) as {
    panel?: string;
    period?: string;
    users?: string;
    analyticsMateria?: string;
    analyticsNewRegistrations?: string;
    analyticsAnswered?: string;
    analyticsSimulators?: string;
  };

  const requestedPanel = resolvedSearchParams.panel;
  const showAllUsers = resolvedSearchParams.users === 'all';
  const selectedAnalyticsMateriaId = String(resolvedSearchParams.analyticsMateria ?? '').trim();
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'marketing';
  const activePanelMeta = PANELS.find((panel) => panel.key === activePanel) ?? PANELS[0];
  const requestedPeriod = Number(resolvedSearchParams.period ?? 7);
  const activePeriod =
    PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 7;
  const activePeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === activePeriod)?.label ?? 'Hoy';
  const metricPeriods = {
    newRegistrations: normalizeMetricPeriod(
      resolvedSearchParams.analyticsNewRegistrations,
      activePeriod === 7 ? 7 : activePeriod === 30 ? 30 : 1
    ),
    answered: normalizeMetricPeriod(resolvedSearchParams.analyticsAnswered, 1),
    simulatorAttempts: normalizeMetricPeriod(
      resolvedSearchParams.analyticsSimulators,
      activePeriod === 7 ? 7 : activePeriod === 30 ? 30 : 1
    ),
  } as const;
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsStats = false;
  const needsConversion = activePanel === 'marketing';
  const needsUsers = activePanel === 'usuarios';
  const needsLogs = activePanel === 'logs';
  const needsIA = activePanel === 'ia';
  const [
    statsResult,
    usersResult,
    segmentacionResult,
    bibliotecaResult,
    bibliotecaStatsResult,
    logsResult,
    analyticsMateriaResult,
    conversionResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
    iaCostResult,
  ] = await Promise.all([
    needsStats ? obtenerResumenAdministrador(activePeriod, metricPeriods) : Promise.resolve(null),
    needsUsers ? obtenerUsuariosAdministrador(250) : Promise.resolve(null),
    needsUsers ? obtenerSegmentacionUsuariosAdministrador() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaFormularioAdministrador() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaResumenAdministrador() : Promise.resolve(null),
    needsLogs ? obtenerLogsAdministrador() : Promise.resolve(null),
    activePanel === 'analiticas' && selectedAnalyticsMateriaId
      ? obtenerDetalleMateriaAnaliticaAdministrador(selectedAnalyticsMateriaId, activePeriod)
      : Promise.resolve(null),
    needsConversion ? obtenerConversionAdministrador(activePeriod) : Promise.resolve(null),
    needsIA ? obtenerPromptSistema() : Promise.resolve(null),
    needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
    needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
    needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    needsIA ? obtenerConsumoPdfIAAdministrador() : Promise.resolve(null),
  ]);

  if (needsStats && (!statsResult?.success || !statsResult.stats)) {
    return (
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {statsResult?.message ?? 'Prob\u00e1 nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (needsUsers && (!usersResult?.success || !usersResult.stats || !usersResult.rows)) {
    return (
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {usersResult?.message ?? 'Prob\u00e1 nuevamente en unos segundos.'}
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
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {bibliotecaResult?.message ?? 'Prob\u00e1 nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (needsLogs && (!logsResult?.success || !logsResult.data)) {
    return (
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {logsResult?.message ?? 'Prob\u00e1 nuevamente en unos segundos.'}
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
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {iaPromptResult?.message ??
              iaRankingResult?.message ??
              iaFeedbackReviewResult?.message ??
              'Prob\u00e1 nuevamente en unos segundos.'}
          </p>
        </div>
      </main>
    );
  }

  if (needsConversion && (!conversionResult?.success || !conversionResult.stats)) {
    return (
      <main className="min-h-screen bg-white px-5 py-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-[#e8ebf3] bg-white p-8">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
            No pudimos cargar el panel de conversión
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
            {conversionResult?.message ?? 'Probá nuevamente en unos segundos.'}
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
    <>
      <main className="min-h-screen bg-white px-5 py-8 text-[#1d2a44] lg:hidden">
        <div className="mx-auto max-w-md rounded-[28px] border border-[#e7ebf4] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#667085] uppercase">
            Panel administrador
          </p>
          <h1 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">
            Mejor en desktop
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6f7c96]">
            Este panel todavía no está optimizado para mobile. Para revisar métricas, gestión y
            configuración sin errores visuales, abre esta sección desde desktop o una tablet amplia.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#264ee0]"
          >
            Volver al dashboard
          </Link>
        </div>
      </main>

      <main className="hidden min-h-screen bg-white text-[#1d2a44] lg:block">
        <header className="fixed top-0 right-0 left-[184px] z-40 border-b border-[#e7ebf4] bg-white/95 backdrop-blur">
          <div className="flex h-[64px] items-center justify-between px-6">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.18em] text-[#667085] uppercase">
                Panel actual
              </p>
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

        <aside className="fixed top-[64px] left-0 z-30 h-[calc(100vh-64px)] w-[184px] overflow-y-auto border-r border-[#e7ebf4] bg-white px-4 py-5">
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
                      ? 'bg-white text-[#2563EB]'
                      : 'text-[#6f7c96] hover:bg-white hover:text-[#1d2a44]'
                  }`}
                >
                  <Icon className="h-[15px] w-[15px]" />
                  <span>{panel.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="pt-[64px] pl-[184px]">
          <div className="px-6 py-6">
            {activePanel === 'dashboard' && stats ? (
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">
                      Resumen general
                    </p>
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
                              ? 'bg-white text-[#2563EB]'
                              : 'text-[#6f7c96] hover:bg-white hover:text-[#1d2a44]'
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
                  visitorLoginSeries={stats.visitorLoginSeries}
                  recentActivity={stats.recentActivity}
                />

                <div className="mt-6 rounded-[22px] border border-dashed border-[#d8deea] bg-white px-6 py-12 text-center">
                  <p className="text-[12px] font-medium tracking-[0.2em] text-[#667085] uppercase">
                    Siguiente bloque
                  </p>
                  <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
                    Dejamos el resto vacío por ahora
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#7f8aa3]">
                    Mostrando datos de {activePeriodLabel.toLowerCase()}. El resto del dashboard lo
                    vamos completando bloque por bloque.
                  </p>
                </div>
              </section>
            ) : activePanel === 'analiticas' && stats ? (
              <section>
                <div className="mb-5">
                  <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">
                    Analíticas
                  </p>
                  <p className="mt-1 text-[14px] text-[#7f8aa3]">
                    Vista de uso, funnel y concentración de demanda para tomar decisiones de
                    producto y contenido.
                  </p>
                </div>

                <AnalyticsPanel
                  activePeriodLabel={activePeriodLabel}
                  activePeriod={activePeriod}
                  selectedMateriaId={selectedAnalyticsMateriaId}
                  metricPeriods={metricPeriods}
                  stats={{
                    usersActive: stats.usersActive,
                    usersActiveTrendPct: stats.usersActiveTrendPct,
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
                  materiaDetail={
                    analyticsMateriaResult?.success ? (analyticsMateriaResult.detail ?? null) : null
                  }
                />
              </section>
            ) : activePanel === 'marketing' &&
              conversionResult?.success &&
              conversionResult.stats ? (
              <section>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">
                      Producto
                    </p>
                    <p className="mt-1 text-[14px] text-[#7f8aa3]">
                      Activación, conversión y retención de las dos materias prioritarias.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-[#e7ebf4] bg-white p-1">
                    {PERIOD_OPTIONS.map((option) => (
                      <Link
                        key={option.value}
                        href={`/administrador?panel=marketing&period=${option.value}`}
                        className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${option.value === activePeriod ? 'bg-white text-[#2563EB]' : 'text-[#6f7c96] hover:bg-white'}`}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <ConversionPanel stats={conversionResult.stats} periodLabel={activePeriodLabel} />
              </section>
            ) : activePanel === 'biblioteca' &&
              bibliotecaResult?.universidades &&
              bibliotecaResult.carreras &&
              bibliotecaResult.materias ? (
              <BibliotecaPanel
                overview={
                  bibliotecaStatsResult?.stats ?? {
                    carrerasTotal: 0,
                    materiasTotal: 0,
                    preguntasTotal: 0,
                  }
                }
                universidades={bibliotecaResult.universidades}
                carreras={bibliotecaResult.carreras}
                materias={bibliotecaResult.materias}
                carrerasSimuladores={bibliotecaResult.carrerasSimuladores ?? []}
              />
            ) : activePanel === 'usuarios' && usersResult?.stats && usersResult.rows ? (
              <UsersPanel
                stats={usersResult.stats}
                rows={usersResult.rows}
                showAll={showAllUsers}
                segmentacionStats={segmentacionResult?.stats ?? null}
                segmentacionRows={segmentacionResult?.rows ?? []}
              />
            ) : activePanel === 'logs' && logsResult?.data ? (
              <LogsPanel data={logsResult.data} />
            ) : activePanel === 'ia' &&
              iaPromptResult?.success &&
              iaRankingResult?.success &&
              iaFeedbackReviewResult?.success ? (
              <>
                <AICostPanel
                  stats={iaCostResult?.success ? (iaCostResult.stats ?? null) : null}
                  error={iaCostResult?.success ? null : iaCostResult?.message}
                />
                <IAPanel
                  initialPrompt={iaPromptResult.data ?? ''}
                  initialRankingRows={iaRankingResult.rows ?? []}
                  initialFeedbackStats={
                    (
                      iaFeedbackStatsResult as {
                        stats?: {
                          total: number;
                          positive: number;
                          negative: number;
                          generatedCount: number;
                        };
                      } | null
                    )?.stats ?? null
                  }
                  initialFeedbackReviewRows={iaFeedbackReviewResult.rows ?? []}
                />
              </>
            ) : (
              <EmptyPanel title={activePanelMeta.label} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

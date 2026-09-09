import Link from 'next/link';
import { BadgePercent, BookOpen, Bot, Megaphone, Search, Users } from 'lucide-react';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';
import { obtenerBibliotecaFormularioAdministradorOptimizado } from './performance-actions';
import {
  obtenerBibliotecaResumenAdministradorCacheado,
  obtenerUsuariosAdministradorPaginadoCacheado,
} from './cached-performance-actions';
import { obtenerReferidosAdministrador } from './referrals-actions';
import { ReferralsPanel } from './referrals-panel';
import { obtenerAdquisicionAdministrador, type AcquisitionSourceKey } from './acquisition-actions';
import { AcquisitionPanel } from './acquisition-panel';
import {
  AICostPanel,
  BibliotecaPanel,
  ConversionPanel,
  IAPanel,
  UsersPanelV2,
} from './lazy-panels';

type PanelKey =
  | 'marketing'
  | 'adquisicion'
  | 'referidos'
  | 'biblioteca'
  | 'usuarios'
  | 'ia';

const PANELS: Array<{
  key: PanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'marketing', label: 'Producto', icon: Megaphone },
  { key: 'adquisicion', label: 'Adquisición', icon: Search },
  { key: 'referidos', label: 'Referidos', icon: BadgePercent },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'ia', label: 'IA', icon: Bot },
];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

const ACQUISITION_SOURCE_KEYS: AcquisitionSourceKey[] = [
  'google',
  'whatsapp',
  'instagram',
  'linkedin',
];

function ErrorPanel({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <h2 className="font-semibold text-rose-950">No pudimos cargar este panel</h2>
      <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
    </section>
  );
}

function PanelNavigation({ activePanel, activePeriod }: { activePanel: PanelKey; activePeriod: number }) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
      aria-label="Secciones del administrador"
    >
      {PANELS.map((panel) => {
        const Icon = panel.icon;
        const active = panel.key === activePanel;
        return (
          <Link
            key={panel.key}
            href={`/administrador?panel=${panel.key}&period=${activePeriod}`}
            prefetch={false}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition lg:w-full ${
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 lg:border-transparent'
            }`}
          >
            <Icon className="h-4 w-4" />
            {panel.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    panel?: string;
    period?: string;
    usersPage?: string;
    source?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPanel = params.panel;
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'marketing';
  const activePanelMeta = PANELS.find((panel) => panel.key === activePanel) ?? PANELS[0];
  const requestedPeriod = Number(params.period ?? 7);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 7;
  const activePeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === activePeriod)?.label ?? '7 días';
  const usersPage = Math.max(1, Number(params.usersPage ?? 1) || 1);
  const requestedSource = String(params.source ?? '').trim().toLowerCase();
  const selectedAcquisitionSource = ACQUISITION_SOURCE_KEYS.includes(
    requestedSource as AcquisitionSourceKey
  )
    ? (requestedSource as AcquisitionSourceKey)
    : null;

  const needsAcquisition = activePanel === 'adquisicion';
  const needsReferrals = activePanel === 'referidos';
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsUsers = activePanel === 'usuarios';
  const needsIA = activePanel === 'ia';

  const [
    acquisitionResult,
    referralResult,
    bibliotecaResult,
    bibliotecaStatsResult,
    usersResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
    iaCostResult,
  ] = await Promise.all([
    needsAcquisition
      ? obtenerAdquisicionAdministrador(activePeriod, selectedAcquisitionSource)
      : Promise.resolve(null),
    needsReferrals ? obtenerReferidosAdministrador() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaFormularioAdministradorOptimizado() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaResumenAdministradorCacheado() : Promise.resolve(null),
    needsUsers ? obtenerUsuariosAdministradorPaginadoCacheado(usersPage, 25) : Promise.resolve(null),
    needsIA ? obtenerPromptSistema() : Promise.resolve(null),
    needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
    needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
    needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    needsIA ? obtenerConsumoPdfIAAdministrador() : Promise.resolve(null),
  ]);

  let panelContent: React.ReactNode;

  if (activePanel === 'marketing') {
    panelContent = (
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Producto</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Activación, conversión, cobertura y retención de los usuarios.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {PERIOD_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={`/administrador?panel=marketing&period=${option.value}`}
                prefetch={false}
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
        <ConversionPanel stats={null} periodLabel={activePeriodLabel} />
      </section>
    );
  } else if (activePanel === 'adquisicion') {
    panelContent =
      acquisitionResult?.success && acquisitionResult.stats ? (
        <AcquisitionPanel
          stats={acquisitionResult.stats}
          activePeriod={activePeriod}
          selectedSource={selectedAcquisitionSource}
        />
      ) : (
        <ErrorPanel message={acquisitionResult?.message ?? 'No pudimos cargar Adquisición.'} />
      );
  } else if (activePanel === 'referidos') {
    panelContent =
      referralResult?.success && referralResult.data ? (
        <ReferralsPanel data={referralResult.data} />
      ) : (
        <ErrorPanel message={referralResult?.message ?? 'No pudimos cargar Referidos.'} />
      );
  } else if (activePanel === 'biblioteca') {
    if (
      !bibliotecaResult?.success ||
      !bibliotecaResult.universidades ||
      !bibliotecaResult.carreras ||
      !bibliotecaResult.materias ||
      !bibliotecaStatsResult?.success ||
      !bibliotecaStatsResult.stats
    ) {
      panelContent = (
        <ErrorPanel
          message={
            bibliotecaResult?.message ??
            bibliotecaStatsResult?.message ??
            'No pudimos cargar Biblioteca.'
          }
        />
      );
    } else {
      panelContent = (
        <BibliotecaPanel
          overview={bibliotecaStatsResult.stats}
          universidades={bibliotecaResult.universidades}
          carreras={bibliotecaResult.carreras}
          materias={bibliotecaResult.materias}
          carrerasSimuladores={bibliotecaResult.carrerasSimuladores ?? []}
        />
      );
    }
  } else if (activePanel === 'usuarios') {
    if (!usersResult?.success || !usersResult.stats || !usersResult.rows) {
      panelContent = <ErrorPanel message={usersResult?.message ?? 'No pudimos cargar Usuarios.'} />;
    } else {
      panelContent = (
        <UsersPanelV2
          stats={usersResult.stats}
          rows={usersResult.rows}
          page={usersResult.page ?? usersPage}
          totalPages={usersResult.totalPages ?? 1}
        />
      );
    }
  } else if (
    iaPromptResult?.success &&
    iaRankingResult?.success &&
    iaFeedbackStatsResult?.success &&
    iaFeedbackReviewResult?.success
  ) {
    panelContent = (
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
              }
            ).stats ?? null
          }
          initialFeedbackReviewRows={iaFeedbackReviewResult.rows ?? []}
        />
      </>
    );
  } else {
    panelContent = (
      <ErrorPanel
        message={
          iaPromptResult?.message ??
          iaRankingResult?.message ??
          iaFeedbackReviewResult?.message ??
          'No pudimos cargar IA.'
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 px-3 py-4 text-slate-800 sm:px-5 sm:py-6 lg:px-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-600 uppercase">
                Evaluo · Administrador
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                {activePanelMeta.label}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestión operativa de producto, contenido, usuarios y calidad.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <Link
                href="/administrador/feedback-simulador"
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 hover:text-indigo-700"
              >
                Feedback simulador
              </Link>
              <Link
                href="/administrador/solicitudes"
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-3 text-white hover:bg-slate-800"
              >
                Solicitudes
              </Link>
            </div>
          </div>
          <div className="mt-4 lg:hidden">
            <PanelNavigation activePanel={activePanel} activePeriod={activePeriod} />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-2.5">
              <PanelNavigation activePanel={activePanel} activePeriod={activePeriod} />
            </div>
          </aside>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 lg:p-6">
            {panelContent}
          </div>
        </div>
      </div>
    </main>
  );
}
